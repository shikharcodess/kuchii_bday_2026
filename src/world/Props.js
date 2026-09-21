import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
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

  add(x, z, { scale = 1, rotY = 0, y = 0, tilt = 0, tint = null } = {}) {
    this.instances.push({ x, y, z, scale, rotY, tilt, tint });
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

    const color = new THREE.Color();

    const meshes = this.parts.map(({ geometry, material, vary = 0, castShadow = false, receiveShadow = true }) => {
      const mesh = new THREE.InstancedMesh(geometry, material, this.instances.length);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;

      this.instances.forEach((inst, i) => {
        euler.set(inst.tilt, inst.rotY, 0);
        quat.setFromEuler(euler);
        pos.set(inst.x, inst.y, inst.z);
        scl.setScalar(inst.scale);
        matrix.compose(pos, quat, scl);
        mesh.setMatrixAt(i, matrix);

        // Deterministic per-instance shade so no two plants match exactly.
        if (vary > 0) {
          const jitter = inst.tint ?? hashUnit(inst.x, inst.z, i);
          const shade = 1 + (jitter - 0.5) * vary;
          const warmth = 1 + (hashUnit(inst.z, inst.x, i + 7) - 0.5) * vary * 0.6;
          color.setRGB(shade * warmth, shade, shade / warmth);
          mesh.setColorAt(i, color);
        }
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      parent.add(mesh);
      return mesh;
    });

    return meshes;
  }
}

/** A broadleaf tree: tapered trunk + several noise-roughened foliage clusters. */
export function treeField(leafMaterial = MAT.leaf) {
  const trunk = new THREE.CylinderGeometry(0.15, 0.34, 3.4, 8);
  roughen(trunk, 0.05, 1.4);
  trunk.translate(0, 1.7, 0);

  const clusters = [
    [0, 3.9, 0, 1.4],
    [0.9, 3.2, 0.45, 0.95],
    [-0.78, 3.45, -0.5, 0.9],
    [0.25, 4.6, -0.35, 0.8],
    [-0.5, 3.0, 0.7, 0.7]
  ].map(([cx, cy, cz, r]) => {
    const blob = new THREE.IcosahedronGeometry(r, 2);
    roughen(blob, r * 0.3, 1.1);
    blob.translate(cx, cy, cz);
    return blob;
  });

  return new InstancedField([
    { geometry: trunk, material: MAT.bark, vary: 0.16, castShadow: true },
    { geometry: mergeGeometries(clusters), material: leafMaterial, vary: 0.34, castShadow: true }
  ]);
}

/** A slim conifer for the mountain/dusk stretches of the map. */
export function pineField(leafMaterial = MAT.leafDeep) {
  const trunk = new THREE.CylinderGeometry(0.14, 0.22, 2.0, 6);
  trunk.translate(0, 1.0, 0);

  const tiers = [
    { r: 1.3, h: 1.9, y: 2.0 },
    { r: 1.05, h: 1.7, y: 3.0 },
    { r: 0.78, h: 1.5, y: 3.9 },
    { r: 0.45, h: 1.2, y: 4.8 }
  ].map(({ r, h, y }) => {
    const cone = new THREE.ConeGeometry(r, h, 9, 3);
    roughen(cone, r * 0.16, 2.2);
    cone.translate(0, y, 0);
    return cone;
  });

  return new InstancedField([
    { geometry: trunk, material: MAT.bark, vary: 0.14, castShadow: true },
    { geometry: mergeGeometries(tiers), material: leafMaterial, vary: 0.3, castShadow: true }
  ]);
}

/** Low rounded shrubs used to soften path edges and building bases. */
export function bushField(material = MAT.leafWarm) {
  const parts = [
    [0, 0.42, 0, 0.55],
    [0.42, 0.3, 0.18, 0.38],
    [-0.36, 0.28, -0.2, 0.33],
    [0.1, 0.55, -0.3, 0.28]
  ].map(([bx, by, bz, r]) => {
    const blob = new THREE.IcosahedronGeometry(r, 2);
    roughen(blob, r * 0.3, 1.6);
    blob.translate(bx, by, bz);
    return blob;
  });

  return new InstancedField([
    { geometry: mergeGeometries(parts), material, vary: 0.32 }
  ]);
}

/** Scattered stones so the meadow doesn't read as an empty plane. */
export function rockField(material = MAT.stone) {
  const rock = new THREE.DodecahedronGeometry(0.45, 1);
  roughen(rock, 0.09, 2.6);
  rock.scale(1, 0.6, 1.15);
  rock.translate(0, 0.18, 0);
  return new InstancedField([{ geometry: rock, material, vary: 0.2 }]);
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

/**
 * Sunflower field: stem, leaf pair, petal disc and dark seeded core.
 *
 * Scaled to life: the world runs at roughly 1.2 units per metre, so a stem of
 * 1.9 units is a ~1.6m plant and the 0.23-unit head is a ~38cm flower. Earlier
 * versions were nearly twice this and towered over her.
 */
export function sunflowerField() {
  const stem = new THREE.CylinderGeometry(0.022, 0.035, 1.75, 6);
  stem.translate(0, 0.87, 0);

  // A slight lean, so a field of them doesn't stand to attention
  const leafA = new THREE.SphereGeometry(0.16, 8, 6);
  leafA.scale(1.35, 0.08, 0.6);
  leafA.rotateZ(-0.35);
  leafA.translate(0.15, 0.78, 0.02);

  const leafB = new THREE.SphereGeometry(0.13, 8, 6);
  leafB.scale(1.35, 0.08, 0.6);
  leafB.rotateZ(0.4);
  leafB.rotateY(Math.PI * 0.85);
  leafB.translate(-0.13, 1.12, -0.03);

  const petals = [];
  const petalCount = 18;
  for (let i = 0; i < petalCount; i++) {
    const petal = new THREE.SphereGeometry(0.1, 6, 5);
    // Long, narrow and slightly cupped, like a real ray floret
    petal.scale(0.42, 0.12, 1);
    petal.translate(0, 0.012, 0.145);
    petal.rotateY((i / petalCount) * Math.PI * 2);
    petals.push(petal);
  }
  const petalDisc = mergeGeometries(petals);
  petalDisc.rotateX(-Math.PI / 2.5);
  petalDisc.translate(0, 1.78, 0.04);

  const core = new THREE.SphereGeometry(0.115, 14, 10);
  core.scale(1, 0.42, 1);
  core.rotateX(-Math.PI / 2.5);
  core.translate(0, 1.79, 0.06);

  const back = new THREE.SphereGeometry(0.1, 10, 8);
  back.scale(1, 0.5, 1);
  back.rotateX(-Math.PI / 2.5);
  back.translate(0, 1.76, 0.0);

  return new InstancedField([
    { geometry: mergeGeometries([stem, leafA, leafB, back]), material: MAT.stem, vary: 0.22 },
    { geometry: petalDisc, material: MAT.sunflowerPetal, vary: 0.16 },
    { geometry: core, material: MAT.sunflowerCore, vary: 0.12 }
  ]);
}

/**
 * Blooming English Rose cluster: lush leaves, delicate layered rose blossoms.
 */
export function roseField() {
  const foliage = [];
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.SphereGeometry(0.18, 6, 5);
    leaf.scale(1.2, 0.4, 0.9);
    leaf.translate(Math.sin(i * 1.6) * 0.18, 0.22 + i * 0.08, Math.cos(i * 1.6) * 0.18);
    foliage.push(leaf);
  }

  const blooms = [];
  const bloomOffsets = [
    [-0.15, 0.42, 0.08, 0.13],
    [0.16, 0.48, -0.06, 0.15],
    [0.0, 0.58, 0.02, 0.17]
  ];
  for (const [bx, by, bz, br] of bloomOffsets) {
    const bloom = new THREE.DodecahedronGeometry(br, 1);
    bloom.scale(1.1, 0.85, 1.1);
    bloom.translate(bx, by, bz);
    blooms.push(bloom);
  }

  return new InstancedField([
    { geometry: mergeGeometries(foliage), material: MAT.leafWarm, vary: 0.18 },
    { geometry: mergeGeometries(blooms), material: MAT.rosePink, vary: 0.15 }
  ]);
}

/**
 * Fragrant Lavender Stalks: slender stems with violet/purple flower spikes.
 */
export function lavenderField() {
  const stems = [];
  const spikes = [];
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const rad = 0.08 + (i % 2) * 0.05;
    const sx = Math.sin(ang) * rad;
    const sz = Math.cos(ang) * rad;
    const h = 0.65 + (i % 3) * 0.12;

    const stem = new THREE.CylinderGeometry(0.012, 0.016, h, 5);
    stem.translate(sx, h / 2, sz);
    stems.push(stem);

    const spike = new THREE.CapsuleGeometry(0.032, 0.24, 4, 6);
    spike.translate(sx, h + 0.1, sz);
    spikes.push(spike);
  }

  return new InstancedField([
    { geometry: mergeGeometries(stems), material: MAT.stem, vary: 0.18 },
    { geometry: mergeGeometries(spikes), material: MAT.lavender, vary: 0.14 }
  ]);
}

/**
 * Delicate White Daisies & Cosmos: slender wild stems with white petals and gold centers.
 */
export function cosmosField() {
  const stems = [];
  const petals = [];
  const centers = [];

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const sx = Math.sin(ang) * 0.14;
    const sz = Math.cos(ang) * 0.14;
    const h = 0.5 + (i % 2) * 0.14;

    const stem = new THREE.CylinderGeometry(0.01, 0.014, h, 4);
    stem.translate(sx, h / 2, sz);
    stems.push(stem);

    const petalDisc = new THREE.CircleGeometry(0.14, 8);
    petalDisc.rotateX(-Math.PI / 2);
    petalDisc.translate(sx, h, sz);
    petals.push(petalDisc);

    const center = new THREE.SphereGeometry(0.04, 6, 5);
    center.scale(1, 0.4, 1);
    center.translate(sx, h + 0.01, sz);
    centers.push(center);
  }

  return new InstancedField([
    { geometry: mergeGeometries(stems), material: MAT.stem, vary: 0.2 },
    { geometry: mergeGeometries(petals), material: MAT.cosmosWhite, vary: 0.12 },
    { geometry: mergeGeometries(centers), material: MAT.sunflowerPetal, vary: 0.1 }
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

const _noise = new ImprovedNoise();

/**
 * Push vertices along their normals by a noise field, so primitives stop
 * looking like primitives. Cheap, and applied once at build time.
 */
export function roughen(geometry, amount, frequency = 1) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const displacement =
      _noise.noise(x * frequency, y * frequency, z * frequency) * amount;

    position.setXYZ(
      i,
      x + normal.getX(i) * displacement,
      y + normal.getY(i) * displacement,
      z + normal.getZ(i) * displacement
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Deterministic 0..1 hash, so instance variation is stable across reloads. */
function hashUnit(a, b, salt = 0) {
  const value = Math.sin(a * 12.9898 + b * 78.233 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
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
