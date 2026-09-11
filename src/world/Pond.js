import * as THREE from 'three';
import { MAT, tinted } from './Materials.js';
import { waterNormalTexture } from './Textures.js';
import { roughen } from './Props.js';
import { seededRandom } from '../utils/MathUtils.js';

/**
 * A sunken garden pond with koi.
 *
 * The meadow is carved away above it (see Ground.carve), so this really is a
 * hole in the ground with water sitting below grass level rather than a disc
 * laid on top. Two counter-scrolling normal maps give the surface moving
 * ripples, and the fish swim on lazy elliptical orbits underneath.
 */
export class Pond {
  /**
   * @param {object} options
   * @param {number} options.x  centre in world space
   * @param {number} options.z
   * @param {number} options.radius water radius
   */
  constructor({ x, z, radius = 7 }) {
    this.center = new THREE.Vector2(x, z);
    this.radius = radius;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    this.fish = [];
    this.rand = seededRandom(4242);

    this._buildBasin();
    this._buildWater();
    this._buildFish();
    this._buildPlanting();
  }

  /**
   * The hole this pond needs cut out of the meadow.
   *
   * Cut wide: the meadow is only tessellated every couple of metres, so the
   * cut edge is ragged by that much. Cutting well outside the waterline keeps
   * stray grass triangles from poking through the surface, and the bank rings
   * below cover the gap.
   */
  get hole() {
    return { x: this.center.x, z: this.center.y, radius: this.radius * 1.2 };
  }

  _buildBasin() {
    // Bowl profile, from the lip down to the deepest point
    const profile = [
      new THREE.Vector2(this.radius * 1.1, 0.1),
      new THREE.Vector2(this.radius * 0.99, 0.0),
      new THREE.Vector2(this.radius * 0.9, -0.32),
      new THREE.Vector2(this.radius * 0.68, -0.78),
      new THREE.Vector2(this.radius * 0.4, -1.05),
      new THREE.Vector2(this.radius * 0.14, -1.18),
      new THREE.Vector2(0, -1.22)
    ];

    const basinGeo = new THREE.LatheGeometry(profile, 48);
    roughen(basinGeo, 0.12, 0.5);
    const basin = new THREE.Mesh(
      basinGeo,
      tinted(MAT.soil, 0x8d7a5c, {
        side: THREE.DoubleSide,
        roughness: 0.95,
        envMapIntensity: 1.1
      })
    );
    basin.receiveShadow = true;
    this.group.add(basin);

    // Silt and pebbles on the bed, visible through the water
    const bed = new THREE.Mesh(
      new THREE.CircleGeometry(this.radius * 0.72, 36),
      tinted(MAT.gravel, 0x6f6350, { roughness: 0.98 })
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = -1.16;
    bed.receiveShadow = true;
    this.group.add(bed);

    for (let i = 0; i < 22; i++) {
      const angle = this.rand() * Math.PI * 2;
      const dist = this.rand() * this.radius * 0.72;
      const stoneGeo = new THREE.DodecahedronGeometry(0.14 + this.rand() * 0.22, 0);
      const stone = new THREE.Mesh(stoneGeo, tinted(MAT.stone, 0x7d7264));
      stone.position.set(
        Math.sin(angle) * dist,
        -1.14 + this.rand() * 0.1,
        Math.cos(angle) * dist
      );
      stone.rotation.set(this.rand(), this.rand(), this.rand());
      stone.scale.y = 0.6;
      this.group.add(stone);
    }
  }

  _buildWater() {
    const geometry = new THREE.CircleGeometry(this.radius * 0.985, 64);
    geometry.rotateX(-Math.PI / 2);

    // Two layers scrolling against each other read as real, moving water.
    this.waterLayers = [];

    const configs = [
      { y: -0.14, repeat: 4, opacity: 0.82, drift: new THREE.Vector2(0.012, 0.008) },
      { y: -0.11, repeat: 7, opacity: 0.34, drift: new THREE.Vector2(-0.009, 0.014) }
    ];

    for (const config of configs) {
      const normalMap = waterNormalTexture(config.repeat);
      const material = new THREE.MeshStandardMaterial({
        color: 0x24484f,
        normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.07,
        metalness: 0.22,
        transparent: true,
        opacity: config.opacity,
        envMapIntensity: 1.7,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = config.y;
      mesh.renderOrder = 2;
      this.group.add(mesh);
      this.waterLayers.push({ material, drift: config.drift });
    }
  }

  _buildFish() {
    const koiColors = [0xe86a34, 0xf2f0e6, 0xe8b34a, 0xd94f3d, 0xf4e3c8, 0xe07b3a, 0xf0f0ea];

    for (let i = 0; i < koi.length; i++) {
      const fish = makeKoi(koiColors[i % koiColors.length], 0.75 + this.rand() * 0.6);

      fish.userData.orbit = {
        radiusX: this.radius * (0.28 + this.rand() * 0.45),
        radiusZ: this.radius * (0.24 + this.rand() * 0.42),
        speed: (0.16 + this.rand() * 0.22) * (this.rand() < 0.5 ? -1 : 1),
        phase: this.rand() * Math.PI * 2,
        depth: -0.42 - this.rand() * 0.45,
        bobPhase: this.rand() * Math.PI * 2,
        tilt: (this.rand() - 0.5) * 0.5
      };

      this.group.add(fish);
      this.fish.push(fish);
    }
  }

  _buildPlanting() {
    // Two rings cover the ragged cut: grass matching the meadow on the
    // outside, damp earth where it meets the waterline.
    const grassBank = new THREE.Mesh(
      new THREE.RingGeometry(this.radius * 0.99, this.radius * 1.8, 56, 1),
      MAT.grass
    );
    grassBank.rotation.x = -Math.PI / 2;
    grassBank.position.y = 0.012;
    grassBank.receiveShadow = true;
    this.group.add(grassBank);

    const mudBank = new THREE.Mesh(
      new THREE.RingGeometry(this.radius * 0.93, this.radius * 1.05, 56, 1),
      tinted(MAT.soil, 0x7d6a4e)
    );
    mudBank.rotation.x = -Math.PI / 2;
    mudBank.position.y = 0.026;
    mudBank.receiveShadow = true;
    this.group.add(mudBank);

    // Stones around the rim, hiding the cut edge of the meadow
    for (let i = 0; i < 34; i++) {
      const angle = this.rand() * Math.PI * 2;
      const dist = this.radius * (0.98 + this.rand() * 0.22);
      const stone = new THREE.Mesh(
        roughen(new THREE.DodecahedronGeometry(0.28 + this.rand() * 0.34, 0), 0.07, 3),
        tinted(MAT.stone, 0x8b8172)
      );
      stone.position.set(Math.sin(angle) * dist, 0.02, Math.cos(angle) * dist);
      stone.rotation.set(this.rand() * 0.5, this.rand() * 6, this.rand() * 0.5);
      stone.scale.y = 0.7;
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.group.add(stone);
    }

    // Reeds in clumps at the water's edge
    for (let clump = 0; clump < 9; clump++) {
      const angle = this.rand() * Math.PI * 2;
      const dist = this.radius * (0.86 + this.rand() * 0.12);
      const base = new THREE.Vector2(Math.sin(angle) * dist, Math.cos(angle) * dist);

      for (let blade = 0; blade < 5 + Math.floor(this.rand() * 5); blade++) {
        const height = 0.9 + this.rand() * 0.8;
        const reed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.024, height, 5),
          tinted(MAT.stem, 0x6d8a45)
        );
        reed.position.set(
          base.x + (this.rand() - 0.5) * 0.7,
          height / 2 - 0.1,
          base.y + (this.rand() - 0.5) * 0.7
        );
        reed.rotation.z = (this.rand() - 0.5) * 0.35;
        reed.rotation.x = (this.rand() - 0.5) * 0.35;
        reed.castShadow = true;
        this.group.add(reed);

        // The odd cattail head
        if (this.rand() < 0.3) {
          const head = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.035, 0.14, 5, 8),
            tinted(MAT.bark, 0x6a4a2c)
          );
          head.position.copy(reed.position);
          head.position.y += height / 2 + 0.02;
          this.group.add(head);
        }
      }
    }

    // Lily pads, and a couple of lotus blooms
    for (let i = 0; i < 11; i++) {
      const angle = this.rand() * Math.PI * 2;
      const dist = this.radius * (0.25 + this.rand() * 0.6);
      const size = 0.32 + this.rand() * 0.3;

      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(size, 20, 0.35, Math.PI * 2 - 0.7),
        tinted(MAT.leaf, 0x53763f, { side: THREE.DoubleSide, roughness: 0.55 })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = this.rand() * Math.PI * 2;
      pad.position.set(Math.sin(angle) * dist, -0.09, Math.cos(angle) * dist);
      pad.renderOrder = 3;
      this.group.add(pad);

      if (i % 5 === 2) {
        const bloom = new THREE.Group();
        bloom.position.set(pad.position.x + 0.25, -0.06, pad.position.z + 0.2);

        for (let p = 0; p < 8; p++) {
          const petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 6),
            tinted(MAT.rose, p % 2 ? 0xf2c6d2 : 0xe8a3b8)
          );
          petal.scale.set(0.42, 0.3, 1);
          petal.position.set(0, 0.06, 0.07);
          petal.rotation.y = (p / 8) * Math.PI * 2;
          petal.rotation.x = -0.5;
          bloom.add(petal);
        }

        const heart = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 10, 8),
          tinted(MAT.sunflowerPetal, 0xf0d060)
        );
        heart.position.y = 0.09;
        bloom.add(heart);
        bloom.renderOrder = 3;
        this.group.add(bloom);
      }
    }
  }

  addTo(scene) {
    scene.add(this.group);
    return this;
  }

  update(time, dt) {
    // Scroll the two normal maps against each other
    for (const layer of this.waterLayers) {
      const map = layer.material.normalMap;
      map.offset.x = (map.offset.x + layer.drift.x * dt * 6) % 1;
      map.offset.y = (map.offset.y + layer.drift.y * dt * 6) % 1;
    }

    for (const fish of this.fish) {
      const orbit = fish.userData.orbit;
      const angle = orbit.phase + time * orbit.speed;

      const x = Math.sin(angle) * orbit.radiusX;
      const z = Math.cos(angle) * orbit.radiusZ;

      // Tangent of the ellipse, so each koi faces the way it is swimming
      const tangentX = Math.cos(angle) * orbit.radiusX * Math.sign(orbit.speed);
      const tangentZ = -Math.sin(angle) * orbit.radiusZ * Math.sign(orbit.speed);

      fish.position.set(x, orbit.depth + Math.sin(time * 0.6 + orbit.bobPhase) * 0.09, z);
      fish.rotation.y = Math.atan2(tangentX, tangentZ);
      fish.rotation.z = Math.sin(time * 1.4 + orbit.bobPhase) * 0.12 + orbit.tilt * 0.2;

      // Tail sweep
      const tail = fish.userData.tail;
      tail.rotation.y = Math.sin(time * 5.5 + orbit.bobPhase) * 0.55;
    }
  }
}

// Seven koi, sized and coloured in the loop above.
const koi = new Array(7);

/** One koi: a tapered body, fins, and a tail that sweeps. */
function makeKoi(color, scale) {
  const fish = new THREE.Group();
  fish.scale.setScalar(scale);

  const skin = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.1,
    envMapIntensity: 1.2
  });

  const bodyGeo = new THREE.SphereGeometry(0.16, 16, 12);
  bodyGeo.scale(0.62, 0.78, 1.9);
  const body = new THREE.Mesh(bodyGeo, skin);
  body.castShadow = true;
  fish.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), skin);
  head.scale.set(0.85, 0.9, 1.1);
  head.position.z = 0.24;
  fish.add(head);

  // Dorsal fin
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), skin);
  dorsal.scale.set(0.4, 1, 1.8);
  dorsal.position.set(0, 0.11, 0.02);
  fish.add(dorsal);

  // Side fins
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skin);
    fin.scale.set(1.1, 0.16, 0.5);
    fin.position.set(side * 0.09, -0.02, 0.1);
    fin.rotation.z = side * -0.5;
    fish.add(fin);
  }

  const tail = new THREE.Group();
  tail.position.z = -0.28;
  fish.add(tail);

  const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 4), skin);
  tailFin.scale.set(0.28, 1, 1);
  tailFin.rotation.x = -Math.PI / 2;
  tailFin.position.z = -0.11;
  tail.add(tailFin);

  fish.userData.tail = tail;
  return fish;
}
