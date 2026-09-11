import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { Ground } from './Ground.js';
import { Paths } from './Paths.js';
import {
  treeField,
  pineField,
  bushField,
  rockField,
  grassTuftField,
  sunflowerField,
  createLantern
} from './Props.js';
import { MAT } from './Materials.js';
import { seededRandom } from '../utils/MathUtils.js';

import { buildHouse } from './stations/House.js';
import { buildSunflowerGarden } from './stations/SunflowerGarden.js';
import { buildTravelGlobe } from './stations/TravelGlobe.js';
import { buildNostalgiaCorner } from './stations/NostalgiaCorner.js';
import { buildFoodStreet } from './stations/FoodStreet.js';
import { buildRoadToUs } from './stations/RoadToUs.js';
import { buildFinale } from './stations/Finale.js';

const STATION_BUILDERS = {
  house: buildHouse,
  sunflower_garden: buildSunflowerGarden,
  dream_travel: buildTravelGlobe,
  nostalgia_corner: buildNostalgiaCorner,
  food_street: buildFoodStreet,
  road_to_us: buildRoadToUs,
  finale: buildFinale
};

/**
 * Assembles the whole map and owns everything the player can bump into.
 *
 * Build order: ground -> road -> stations -> roadside dressing -> perimeter,
 * with every repeated prop funnelled into instanced fields that are baked once
 * at the end.
 */
export class World {
  /**
   * @param {THREE.Scene} scene
   * @param {{interactions: InteractionSystem, camera: CameraController}} services
   *   passed through to the stations, so a station can offer an interaction
   *   without reaching back into the app.
   */
  constructor(scene, services = {}) {
    this.scene = scene;
    this.services = services;
    this.stations = new Map();

    /** Circle colliders: { x, z, r } */
    this.circles = [];
    /** Oriented box colliders: { x, z, halfW, halfD, rotation } */
    this.boxes = [];
    /** Per-frame callbacks registered by station props. */
    this.animated = [];
    /** Areas cut out of the meadow, e.g. the pond basin. */
    this.holes = [];

    this.bounds = CONTENT.world.bounds;

    this.paths = new Paths(scene);

    this.fields = {
      trees: treeField(MAT.leaf),
      pines: pineField(MAT.leafDeep),
      bushes: bushField(MAT.leafWarm),
      rocks: rockField(MAT.stone),
      grass: grassTuftField(MAT.grassLight),
      sunflowers: sunflowerField()
    };

    this._buildStations();

    // The meadow is built after the stations so it can be carved around
    // anything sunken they placed.
    this.ground = new Ground(scene, this.holes);

    this._dressRoadside();
    this._buildPerimeter();

    for (const field of Object.values(this.fields)) field.build(scene);
  }

  // --- Build helpers handed to each station module ---

  _context(station) {
    return {
      scene: this.scene,
      paths: this.paths,
      fields: this.fields,
      station,
      interactions: this.services.interactions,
      camera: this.services.camera,
      messagePanel: this.services.messagePanel,
      addCircle: (x, z, r) => this.addCircle(x, z, r),
      addHole: (hole) => this.holes.push(hole),
      addBox: (x, z, halfW, halfD, rotation = 0) => this.addBox(x, z, halfW, halfD, rotation),
      addLocalCircle: (group, lx, lz, r) => {
        const world = this.localToWorld(group, lx, lz);
        this.addCircle(world.x, world.z, r);
      },
      localToWorld: (group, lx, lz) => this.localToWorld(group, lx, lz),
      registerAnimated: (fn) => this.animated.push(fn)
    };
  }

  localToWorld(group, lx, lz) {
    group.updateMatrixWorld(true);
    return group.localToWorld(new THREE.Vector3(lx, 0, lz));
  }

  addCircle(x, z, r) {
    this.circles.push({ x, z, r });
  }

  addBox(x, z, halfW, halfD, rotation = 0) {
    this.boxes.push({ x, z, halfW, halfD, rotation });
  }

  _buildStations() {
    for (const station of CONTENT.stations) {
      const builder = STATION_BUILDERS[station.id];
      if (!builder) continue;
      const group = builder(this._context(station));
      this.stations.set(station.id, { config: station, group });
    }
  }

  /**
   * Trees, lanterns, rocks and grass along the road between stations, so no
   * stretch of the walk is bare. Station areas are skipped — they dress
   * themselves.
   */
  _dressRoadside() {
    const rand = seededRandom(5150);
    const stationTs = CONTENT.stations.map((s) =>
      this.paths.tNearest(s.position.x, s.position.z)
    );
    const stationRadiusT = 0.028; // roughly a station's footprint in curve space

    const nearStationT = (t) => stationTs.some((st) => Math.abs(st - t) < stationRadiusT);

    // Stations dress their own clearings, so scattered props keep well clear of
    // them — otherwise a stray pine ends up planted through a market stall.
    const clearOfStations = (x, z) =>
      CONTENT.stations.every((station) => {
        const keepOut = (station.radius ?? 10) + 8;
        const dx = x - station.position.x;
        const dz = z - station.position.z;
        return dx * dx + dz * dz > keepOut * keepOut;
      });

    // Lanterns marching along the road
    const lanternSpacing = 16; // metres
    const lanternCount = Math.floor(this.paths.length / lanternSpacing);
    for (let i = 1; i < lanternCount; i++) {
      const t = i / lanternCount;
      if (nearStationT(t)) continue;

      const side = i % 2 === 0 ? 1 : -1;
      const spot = this.paths.offsetAt(t, side * 3.2, new THREE.Vector3());
      if (!clearOfStations(spot.x, spot.z)) continue;
      const lantern = createLantern({ height: 2.8 });
      lantern.position.set(spot.x, 0, spot.z);
      this.scene.add(lantern);
      this.addCircle(spot.x, spot.z, 0.5);
    }

    // Trees, bushes, rocks and grass scattered in a band either side of the road
    const scatterCount = 620;
    for (let i = 0; i < scatterCount; i++) {
      const t = rand();
      const side = rand() < 0.5 ? -1 : 1;
      const lateral = side * (4.5 + rand() * 26);
      const spot = this.paths.offsetAt(t, lateral, new THREE.Vector3());

      if (!this._inBounds(spot.x, spot.z, 3)) continue;
      if (!clearOfStations(spot.x, spot.z)) continue;

      const distance = Math.abs(lateral);
      const roll = rand();

      if (roll < 0.28 && distance > 9) {
        const dusk = t > 0.68; // the pine-heavy final stretch
        const field = dusk || rand() < 0.25 ? this.fields.pines : this.fields.trees;
        field.add(spot.x, spot.z, { scale: 0.85 + rand() * 0.8, rotY: rand() * Math.PI * 2 });
        this.addCircle(spot.x, spot.z, 0.85);
      } else if (roll < 0.5 && distance > 6) {
        this.fields.bushes.add(spot.x, spot.z, {
          scale: 0.6 + rand() * 0.6,
          rotY: rand() * Math.PI * 2
        });
      } else if (roll < 0.6) {
        this.fields.rocks.add(spot.x, spot.z, {
          scale: 0.4 + rand() * 0.8,
          rotY: rand() * Math.PI * 2
        });
      } else {
        this.fields.grass.add(spot.x, spot.z, {
          scale: 0.6 + rand() * 0.8,
          rotY: rand() * Math.PI * 2
        });
      }
    }
  }

  /** A treeline just inside the map edge so the world feels enclosed. */
  _buildPerimeter() {
    const rand = seededRandom(8801);
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const step = 7;

    const place = (x, z) => {
      const jitterX = x + (rand() - 0.5) * 4;
      const jitterZ = z + (rand() - 0.5) * 4;
      const field = rand() < 0.45 ? this.fields.pines : this.fields.trees;
      field.add(jitterX, jitterZ, { scale: 1 + rand() * 0.9, rotY: rand() * Math.PI * 2 });
    };

    for (let x = minX; x <= maxX; x += step) {
      place(x, maxZ + 2);
      place(x, minZ - 2);
      // A second, sparser row further out to hide the horizon edge
      if (rand() < 0.6) place(x + 3, maxZ + 8);
      if (rand() < 0.6) place(x + 3, minZ - 8);
    }

    for (let z = minZ; z <= maxZ; z += step) {
      place(minX - 2, z);
      place(maxX + 2, z);
      if (rand() < 0.6) place(minX - 8, z + 3);
      if (rand() < 0.6) place(maxX + 8, z + 3);
    }
  }

  _inBounds(x, z, margin = 0) {
    const b = this.bounds;
    return (
      x > b.minX + margin &&
      x < b.maxX - margin &&
      z > b.minZ + margin &&
      z < b.maxZ - margin
    );
  }

  /**
   * Keeps a moving entity inside the map and out of solid props.
   * Mutates `position` in place — cheap enough to call every frame.
   */
  constrain(position, radius = 0.4) {
    const b = this.bounds;
    position.x = THREE.MathUtils.clamp(position.x, b.minX + radius, b.maxX - radius);
    position.z = THREE.MathUtils.clamp(position.z, b.minZ + radius, b.maxZ - radius);

    for (const circle of this.circles) {
      const dx = position.x - circle.x;
      const dz = position.z - circle.z;
      const minDist = circle.r + radius;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDist * minDist || distSq === 0) continue;

      const dist = Math.sqrt(distSq);
      const push = (minDist - dist) / dist;
      position.x += dx * push;
      position.z += dz * push;
    }

    for (const box of this.boxes) {
      const cos = Math.cos(-box.rotation);
      const sin = Math.sin(-box.rotation);
      const dx = position.x - box.x;
      const dz = position.z - box.z;

      // Into the box's local frame
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;

      const halfW = box.halfW + radius;
      const halfD = box.halfD + radius;
      if (Math.abs(localX) >= halfW || Math.abs(localZ) >= halfD) continue;

      // Push out along whichever face is closest
      const overlapX = halfW - Math.abs(localX);
      const overlapZ = halfD - Math.abs(localZ);
      let pushX = 0;
      let pushZ = 0;
      if (overlapX < overlapZ) {
        pushX = Math.sign(localX || 1) * overlapX;
      } else {
        pushZ = Math.sign(localZ || 1) * overlapZ;
      }

      // Back out to world space
      const cosB = Math.cos(box.rotation);
      const sinB = Math.sin(box.rotation);
      position.x += pushX * cosB - pushZ * sinB;
      position.z += pushX * sinB + pushZ * cosB;
    }

    return position;
  }

  /** Where the player starts: on the road at the top of the map, house to her left. */
  get spawnPoint() {
    return new THREE.Vector3(0, 0, 6);
  }

  update(elapsed, dt) {
    for (const fn of this.animated) fn(elapsed, dt);
  }
}
