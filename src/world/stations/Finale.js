import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createLantern, createStringLights, createBench } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 7 — the Finale clearing.
 *
 * A round wooden dance floor under a flower arch, ringed with lanterns and
 * strung bulbs, sheltered by a half-circle of pines. Phase 4 places the two
 * avatars here and runs the hand-holding / slow dance; this phase builds the
 * stage and leaves the anchor points behind for it.
 */
export function buildFinale(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(1310);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  ctx.scene.add(group);

  // --- Dance floor ---
  const floorRadius = 7;
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(floorRadius, floorRadius + 0.25, 0.26, 48),
    MAT.plank
  );
  floor.position.y = 0.13;
  floor.receiveShadow = true;
  floor.castShadow = true;
  group.add(floor);

  // Radial plank detail so the floor doesn't read as a flat disc
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.04, floorRadius * 0.94),
      MAT.wood
    );
    plank.position.set(
      Math.sin(angle) * floorRadius * 0.47,
      0.27,
      Math.cos(angle) * floorRadius * 0.47
    );
    plank.rotation.y = angle;
    plank.receiveShadow = true;
    group.add(plank);
  }

  const inlay = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.5, 48), MAT.gold);
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.28;
  group.add(inlay);

  // --- Flower arch over the entrance to the floor ---
  const arch = new THREE.Group();
  arch.position.set(0, 0, floorRadius + 0.6);

  const archPostGeo = new THREE.CylinderGeometry(0.14, 0.17, 3.6, 10);
  for (const side of [-3.4, 3.4]) {
    const post = new THREE.Mesh(archPostGeo, MAT.plank);
    post.position.set(side, 1.8, 0);
    post.castShadow = true;
    arch.add(post);
    ctx.addCircle(x + side, z + floorRadius + 0.6, 0.5);
  }

  const archTop = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.14, 10, 26, Math.PI), MAT.plank);
  archTop.position.y = 3.6;
  archTop.castShadow = true;
  arch.add(archTop);

  const bloomColors = [0xf0b929, 0xefb0c0, 0xf3e3cd, 0xe07a8f];
  for (let i = 0; i < 44; i++) {
    const t = rand();
    const angle = Math.PI * t;
    const bloom = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.15 + rand() * 0.14, 0),
      rand() < 0.45
        ? MAT.leafWarm
        : tinted(MAT.rose, bloomColors[Math.floor(rand() * bloomColors.length)])
    );
    bloom.position.set(
      Math.cos(angle) * 3.4 + (rand() - 0.5) * 0.35,
      3.6 + Math.sin(angle) * 3.4 + (rand() - 0.5) * 0.35,
      (rand() - 0.5) * 0.5
    );
    bloom.castShadow = true;
    arch.add(bloom);
  }
  group.add(arch);

  // --- Lantern ring and strung bulbs above the floor ---
  const poleCount = 6;
  const poleRadius = floorRadius + 2.6;
  const polePositions = [];
  for (let i = 0; i < poleCount; i++) {
    const angle = (i / poleCount) * Math.PI * 2 + Math.PI / poleCount;
    const px = Math.sin(angle) * poleRadius;
    const pz = Math.cos(angle) * poleRadius;
    polePositions.push([px, pz]);

    const lantern = createLantern({ height: 4.2, glass: tinted(MAT.lampGlow, 0xffcf9a) });
    lantern.position.set(px, 0, pz);
    group.add(lantern);
    ctx.addCircle(x + px, z + pz, 0.5);
  }

  for (let i = 0; i < poleCount; i++) {
    const [ax, az] = polePositions[i];
    const [bx, bz] = polePositions[(i + 1) % poleCount];
    group.add(createStringLights(ax, 4.5, az, bx, 4.5, bz, { sag: 1.4, bulbs: 8 }));
  }

  // Warm pools of light over the floor
  const keyLight = new THREE.PointLight(0xffb877, 26, 26, 2);
  keyLight.position.set(0, 5.5, 0);
  group.add(keyLight);

  const rimLight = new THREE.PointLight(0xffd9b0, 10, 18, 2);
  rimLight.position.set(0, 2.4, -6);
  group.add(rimLight);

  // --- Petals scattered around the floor edge ---
  const petalGeo = new THREE.CircleGeometry(0.13, 6);
  const petalCount = 120;
  const petalMesh = new THREE.InstancedMesh(
    petalGeo,
    tinted(MAT.rose, 0xf0bcc6, { side: THREE.DoubleSide }),
    petalCount
  );
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < petalCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = floorRadius * 0.35 + rand() * (floorRadius * 0.9);
    const onFloor = dist < floorRadius;
    euler.set(-Math.PI / 2, 0, rand() * Math.PI * 2);
    quat.setFromEuler(euler);
    pos.set(Math.sin(angle) * dist, onFloor ? 0.29 : 0.05, Math.cos(angle) * dist);
    scale.setScalar(0.7 + rand() * 0.6);
    matrix.compose(pos, quat, scale);
    petalMesh.setMatrixAt(i, matrix);
  }
  petalMesh.instanceMatrix.needsUpdate = true;
  petalMesh.receiveShadow = true;
  group.add(petalMesh);

  // --- Benches looking onto the floor ---
  for (const [bx, bz, ry] of [
    [-9.5, -4, 1.9],
    [9.5, -4, -1.9]
  ]) {
    const bench = createBench();
    bench.position.set(bx, 0, bz);
    bench.rotation.y = ry;
    group.add(bench);
    ctx.addCircle(x + bx, z + bz, 1.2);
  }

  // --- A sheltering half-circle of pines behind the floor ---
  // The arc spans roughly +/-105 degrees so the approach from the road stays
  // open: she should see the lit floor before she reaches it.
  for (let i = 0; i < 34; i++) {
    const angle = -1.85 + rand() * 3.7;
    const dist = 15 + rand() * 12;
    const px = x + Math.sin(angle) * dist;
    const pz = z - Math.cos(angle) * dist;
    ctx.fields.pines.add(px, pz, { scale: 1 + rand() * 0.8, rotY: rand() * Math.PI * 2 });
    ctx.addCircle(px, pz, 0.85);
  }

  for (let i = 0; i < 16; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 10 + rand() * 8;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.7 + rand() * 0.5,
      rotY: rand() * Math.PI
    });
  }

  // Anchors for the Phase 4 finale sequence.
  group.userData.danceFloor = { x, z, radius: floorRadius };
  group.userData.avatarAnchors = [
    { x: x - 0.85, z: z - 0.4 },
    { x: x + 0.85, z: z - 0.4 }
  ];

  return group;
}
