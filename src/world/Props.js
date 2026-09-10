import * as THREE from 'three';
import { MAT, tinted } from './Materials.js';

/**
 * Reusable environment props.
 *
 * Anything that appears dozens of times (trees, sunflowers, grass tufts) goes
 * through `InstancedField` so the whole map stays at a handful of draw calls.
 * One-off props are plain groups.
 */

export class InstancedField {
  /** @param {{geometry: THREE.BufferGeometry, material: THREE.Material}[]} parts */
  constructor(parts) {
    this.parts = parts;
    this.instances = [];
  }

  add(x, z, { scale = 1, rotY = 0, y = 0, tilt = 0 } = {}) {
    this.instances.push({ x, y, z, scale, rotY, tilt });
    return this;
  }

  get count() {
    return this.instances.length;
  }

  build(parent) {
    if (this.instances.length === 0) return [];

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    const meshes = this.parts.map(({ geometry, material }) => {
      const mesh = new THREE.InstancedMesh(geometry, material, this.instances.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.instances.forEach((inst, i) => {
        euler.set(inst.tilt, inst.rotY, 0);
        quat.setFromEuler(euler);
        pos.set(inst.x, inst.y, inst.z);
        scl.setScalar(inst.scale);
        matrix.compose(pos, quat, scl);
        mesh.setMatrixAt(i, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      parent.add(mesh);
      return mesh;
    });

    return meshes;
  }
}

/** A broadleaf tree: tapered trunk + three offset foliage clusters. */
export function treeField(leafMaterial = MAT.leaf) {
  const trunk = new THREE.CylinderGeometry(0.16, 0.3, 3.2, 7);
  trunk.translate(0, 1.6, 0);

  const canopyA = new THREE.IcosahedronGeometry(1.35, 1);
  canopyA.translate(0, 3.7, 0);
  const canopyB = new THREE.IcosahedronGeometry(0.95, 1);
  canopyB.translate(0.85, 3.1, 0.4);
  const canopyC = new THREE.IcosahedronGeometry(0.85, 1);
  canopyC.translate(-0.7, 3.3, -0.5);

  const canopy = mergeGeometries([canopyA, canopyB, canopyC]);

  return new InstancedField([
    { geometry: trunk, material: MAT.bark },
    { geometry: canopy, material: leafMaterial }
  ]);
}

/** A slim conifer for the mountain/dusk stretches of the map. */
export function pineField(leafMaterial = MAT.leafDeep) {
  const trunk = new THREE.CylinderGeometry(0.14, 0.22, 2.0, 6);
  trunk.translate(0, 1.0, 0);

  const tiers = [
    { r: 1.25, h: 1.8, y: 2.0 },
    { r: 0.95, h: 1.6, y: 3.1 },
    { r: 0.6, h: 1.3, y: 4.1 }
  ].map(({ r, h, y }) => {
    const cone = new THREE.ConeGeometry(r, h, 8);
    cone.translate(0, y, 0);
    return cone;
  });

  return new InstancedField([
    { geometry: trunk, material: MAT.bark },
    { geometry: mergeGeometries(tiers), material: leafMaterial }
  ]);
}

/** Low rounded shrubs used to soften path edges and building bases. */
export function bushField(material = MAT.leafWarm) {
  const a = new THREE.IcosahedronGeometry(0.55, 1);
  a.translate(0, 0.42, 0);
  const b = new THREE.IcosahedronGeometry(0.38, 1);
  b.translate(0.42, 0.3, 0.18);
  const c = new THREE.IcosahedronGeometry(0.33, 1);
  c.translate(-0.36, 0.28, -0.2);

  return new InstancedField([{ geometry: mergeGeometries([a, b, c]), material }]);
}

/** Scattered stones so the meadow doesn't read as an empty plane. */
export function rockField(material = MAT.stone) {
  const rock = new THREE.DodecahedronGeometry(0.45, 0);
  rock.scale(1, 0.6, 1.15);
  rock.translate(0, 0.2, 0);
  return new InstancedField([{ geometry: rock, material }]);
}

/** Tall grass tufts — a splayed cluster of tapered blades, cheap in bulk. */
export function grassTuftField(material = MAT.grassLight) {
  const blades = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const lean = 0.22 + (i % 2) * 0.14;
    const height = 0.5 + (i % 3) * 0.16;

    const blade = new THREE.ConeGeometry(0.05, height, 4);
    blade.translate(0, height / 2, 0);
    blade.rotateX(lean);
    blade.rotateY(angle);
    blade.translate(Math.sin(angle) * 0.07, 0, Math.cos(angle) * 0.07);
    blades.push(blade);
  }
  return new InstancedField([{ geometry: mergeGeometries(blades), material }]);
}

/** Sunflower field: stem, leaf pair, petal disc and dark seeded core. */
export function sunflowerField() {
  const stem = new THREE.CylinderGeometry(0.045, 0.06, 1.9, 6);
  stem.translate(0, 0.95, 0);

  const leafA = new THREE.SphereGeometry(0.26, 8, 6);
  leafA.scale(1.5, 0.12, 0.55);
  leafA.translate(0.28, 1.05, 0);
  const leafB = leafA.clone();
  leafB.rotateY(Math.PI);
  leafB.translate(-0.56, -0.28, 0);

  const petals = [];
  const petalCount = 14;
  for (let i = 0; i < petalCount; i++) {
    const petal = new THREE.SphereGeometry(0.2, 6, 5);
    petal.scale(0.38, 0.1, 1);
    petal.translate(0, 0, 0.3);
    petal.rotateY((i / petalCount) * Math.PI * 2);
    petals.push(petal);
  }
  const petalDisc = mergeGeometries(petals);
  petalDisc.rotateX(-Math.PI / 2.6);
  petalDisc.translate(0, 1.95, 0.05);

  const core = new THREE.SphereGeometry(0.19, 12, 10);
  core.scale(1, 0.45, 1);
  core.rotateX(-Math.PI / 2.6);
  core.translate(0, 1.97, 0.1);

  return new InstancedField([
    { geometry: mergeGeometries([stem, leafA, leafB]), material: MAT.stem },
    { geometry: petalDisc, material: MAT.sunflowerPetal },
    { geometry: core, material: MAT.sunflowerCore }
  ]);
}

/** Warm path lantern on a slim post — the map's main night-time light motif. */
export function createLantern({ height = 2.6, glass = MAT.lampGlow } = {}) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.22, 10), MAT.stone);
  base.position.y = 0.11;
  base.castShadow = true;
  group.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, height, 8), MAT.metal);
  post.position.y = height / 2;
  post.castShadow = true;
  group.add(post);

  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.3, 0.42, 6),
    glass
  );
  housing.position.y = height + 0.16;
  group.add(housing);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.26, 6), MAT.copper);
  cap.position.y = height + 0.5;
  cap.castShadow = true;
  group.add(cap);

  return group;
}

/** Short picket fence run between two points, posts spaced evenly. */
export function createFenceRun(ax, az, bx, bz, { spacing = 1.5, height = 1.05 } = {}) {
  const group = new THREE.Group();
  const dx = bx - ax;
  const dz = bz - az;
  const length = Math.hypot(dx, dz);
  const count = Math.max(2, Math.round(length / spacing));
  const angle = Math.atan2(dx, dz);

  const postGeo = new THREE.BoxGeometry(0.12, height, 0.12);
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const post = new THREE.Mesh(postGeo, MAT.plank);
    post.position.set(ax + dx * t, height / 2, az + dz * t);
    post.rotation.y = angle;
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }

  // Two horizontal rails
  for (const railY of [height * 0.32, height * 0.72]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, length), MAT.plank);
    rail.position.set(ax + dx / 2, railY, az + dz / 2);
    rail.rotation.y = angle;
    rail.castShadow = true;
    group.add(rail);
  }

  return group;
}

/** Wooden signpost with a blank board — Phase 3 fills these in with text. */
export function createSignpost({ boardWidth = 1.6, boardHeight = 0.8, height = 1.5 } = {}) {
  const group = new THREE.Group();

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, height, 8), MAT.darkWood);
  post.position.y = height / 2;
  post.castShadow = true;
  group.add(post);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth, boardHeight, 0.08),
    MAT.plank
  );
  board.position.y = height + boardHeight * 0.35;
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);
  group.userData.board = board;

  return group;
}

/** Simple garden bench. */
export function createBench() {
  const group = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.72), MAT.plank);
  seat.position.y = 0.55;
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), MAT.plank);
  back.position.set(0, 0.88, -0.3);
  back.rotation.x = -0.16;
  back.castShadow = true;
  group.add(back);

  const legGeo = new THREE.BoxGeometry(0.14, 0.55, 0.6);
  for (const side of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(legGeo, MAT.darkWood);
    leg.position.set(side, 0.28, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  return group;
}

/**
 * A sagging string of little bulbs between two posts.
 * Used over the food street and the finale dance floor.
 */
export function createStringLights(ax, ay, az, bx, by, bz, { sag = 1.2, bulbs = 9 } = {}) {
  const group = new THREE.Group();

  const start = new THREE.Vector3(ax, ay, az);
  const end = new THREE.Vector3(bx, by, bz);
  const mid = start.clone().lerp(end, 0.5);
  mid.y -= sag;

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 20, 0.02, 5, false),
    MAT.darkWood
  );
  group.add(wire);

  const bulbGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const warmBulb = tinted(MAT.lampGlow, 0xffdca8);
  for (let i = 1; i < bulbs; i++) {
    const point = curve.getPoint(i / bulbs);
    const bulb = new THREE.Mesh(bulbGeo, warmBulb);
    bulb.position.copy(point);
    bulb.position.y -= 0.1;
    group.add(bulb);
  }

  return group;
}

/**
 * Minimal geometry merge (avoids pulling in the addons build).
 * All inputs must share the same attribute layout, which they do here since
 * everything comes from Three's primitive generators.
 */
export function mergeGeometries(geometries) {
  const merged = new THREE.BufferGeometry();
  const attributeNames = ['position', 'normal', 'uv'];
  const arrays = {};
  const indices = [];
  let vertexOffset = 0;

  for (const name of attributeNames) arrays[name] = [];

  for (const geo of geometries) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const positionCount = nonIndexed.attributes.position.count;

    for (const name of attributeNames) {
      const attribute = nonIndexed.attributes[name];
      if (!attribute) continue;
      const source = attribute.array;
      for (let i = 0; i < source.length; i++) arrays[name].push(source[i]);
    }

    for (let i = 0; i < positionCount; i++) indices.push(vertexOffset + i);
    vertexOffset += positionCount;
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
  if (arrays.uv.length) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uv, 2));
  }
  merged.setIndex(indices);
  merged.computeBoundingSphere();
  return merged;
}
