import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createFenceRun, createBench, createLantern } from '../Props.js';

/**
 * Station 1 — the House (start point).
 *
 * A small cosy cottage with a lit porch and a front garden, set just off the
 * road and angled toward it so it's in view the moment the world loads. The
 * blank painted wall in the side yard is a quiet nod to the home in the plans,
 * never spelled out in words.
 *
 * Everything is built in the group's local space and converted through
 * `ctx.localToWorld` where world coordinates are needed, so the whole station
 * can be moved or re-angled from one place.
 */
export function buildHouse(ctx) {
  const group = new THREE.Group();
  const { x, z } = ctx.station.position;

  // Set back from the road on the west side, porch turned toward the path.
  // Far enough down the road that the whole cottage is in frame on first load.
  group.position.set(x - 10.5, 0, z - 6);
  group.rotation.y = 0.95;
  ctx.scene.add(group);

  // --- Walls ---
  const walls = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 8), MAT.paleWall);
  walls.position.y = 2.1;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.5, 8.3), MAT.wood);
  trim.position.y = 0.25;
  trim.castShadow = true;
  trim.receiveShadow = true;
  group.add(trim);

  // --- Pyramid roof (a 4-sided cone, rotated so a face points forward) ---
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.4, 2.9, 4), MAT.roofTile);
  roof.position.y = 5.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.9), MAT.stone);
  chimney.position.set(2.6, 5.8, -1.6);
  chimney.castShadow = true;
  group.add(chimney);

  // --- Porch ---
  const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.3, 3.4), MAT.plank);
  porchDeck.position.set(0, 0.15, 5.6);
  porchDeck.receiveShadow = true;
  porchDeck.castShadow = true;
  group.add(porchDeck);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.24, 3.8), MAT.roofTile);
  porchRoof.position.set(0, 3.1, 5.6);
  porchRoof.rotation.x = -0.08;
  porchRoof.castShadow = true;
  group.add(porchRoof);

  const postGeo = new THREE.CylinderGeometry(0.13, 0.15, 3, 8);
  for (const px of [-3.4, 3.4]) {
    const post = new THREE.Mesh(postGeo, MAT.wood);
    post.position.set(px, 1.5, 7.1);
    post.castShadow = true;
    group.add(post);
  }

  for (let i = 0; i < 2; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.5), MAT.sandstone);
    step.position.set(0, 0.07 + (1 - i) * 0.08, 7.5 + i * 0.5);
    step.receiveShadow = true;
    group.add(step);
  }

  const doormat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.7), MAT.fabricPink);
  doormat.position.set(0, 0.33, 5.4);
  doormat.receiveShadow = true;
  group.add(doormat);
  group.userData.doormat = doormat; // Phase 3 puts the welcome line here

  // --- Door & windows ---
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 0.14), MAT.darkWood);
  door.position.set(0, 1.25, 4.02);
  door.castShadow = true;
  group.add(door);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), MAT.gold);
  knob.position.set(0.5, 1.3, 4.12);
  group.add(knob);

  const windowGeo = new THREE.BoxGeometry(1.5, 1.4, 0.12);
  const windowSpots = [
    [-2.8, 2.4, 4.02, 0],
    [2.8, 2.4, 4.02, 0],
    [4.52, 2.4, 1.2, Math.PI / 2],
    [-4.52, 2.4, -1.2, Math.PI / 2]
  ];
  for (const [wx, wy, wz, ry] of windowSpots) {
    const pane = new THREE.Mesh(windowGeo, MAT.windowGlow);
    pane.position.set(wx, wy, wz);
    pane.rotation.y = ry;
    group.add(pane);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.65, 0.08), MAT.wood);
    frame.position.set(wx, wy, wz - 0.04 * Math.cos(ry));
    frame.rotation.y = ry;
    frame.castShadow = true;
    group.add(frame);
  }

  // Warm light spilling from the porch
  const porchLight = new THREE.PointLight(0xffbb6b, 14, 18, 2);
  porchLight.position.set(0, 2.8, 6);
  group.add(porchLight);

  const lampGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), MAT.lampGlow);
  lampGlobe.position.set(0, 2.85, 5.9);
  group.add(lampGlobe);

  // --- Side yard: a blank wall waiting to be painted, and a vegetable patch ---
  const paintWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 5), MAT.white);
  paintWall.position.set(-6.6, 1.3, 1);
  paintWall.castShadow = true;
  paintWall.receiveShadow = true;
  group.add(paintWall);

  const swatchColors = [0xf0b929, 0xe07a8f, 0x7fb4c4, 0x8fbf6a];
  swatchColors.forEach((color, i) => {
    const swatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.8, 0.8),
      tinted(MAT.white, color)
    );
    swatch.position.set(-6.78, 1.5, -1.4 + i * 1.15);
    group.add(swatch);
  });

  const soilPatch = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2.4), MAT.soil);
  soilPatch.position.set(-5.8, 0.1, 5.4);
  soilPatch.receiveShadow = true;
  group.add(soilPatch);

  for (let i = 0; i < 6; i++) {
    const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), MAT.stem);
    sprout.position.set(-7.1 + (i % 3) * 1.3, 0.45, 4.8 + Math.floor(i / 3) * 1.1);
    sprout.castShadow = true;
    group.add(sprout);
  }

  // --- Yard dressing (still local, so it turns with the house) ---
  const bench = createBench();
  bench.position.set(5.6, 0, 6.4);
  bench.rotation.y = -0.7;
  group.add(bench);
  ctx.addLocalCircle(group, 5.6, 6.4, 1.2);

  for (const [lx, lz] of [[-4.6, 8.6], [4.6, 8.6]]) {
    const lantern = createLantern({ height: 2.4 });
    lantern.position.set(lx, 0, lz);
    group.add(lantern);
    ctx.addLocalCircle(group, lx, lz, 0.5);
  }

  // Picket fence around the front garden, left open where the path arrives
  group.add(createFenceRun(-8.5, 9.6, -2.2, 9.6));
  group.add(createFenceRun(2.2, 9.6, 8.5, 9.6));
  group.add(createFenceRun(-8.5, 9.6, -8.5, 2));
  group.add(createFenceRun(8.5, 9.6, 8.5, 2));

  // The cottage body itself, as an oriented box collider
  ctx.addBox(group.position.x, group.position.z, 4.9, 4.4, group.rotation.y);
  ctx.addLocalCircle(group, -6.6, 1, 2.6); // painting wall

  // Greenery hugging the cottage
  const bushSpots = [
    [-9, 7.5], [-4.6, 8.8], [4.6, 8.8], [9, 7.5],
    [-10, 2], [10, 2], [-9, -3], [9, -3]
  ];
  for (const [bx, bz] of bushSpots) {
    const world = ctx.localToWorld(group, bx, bz);
    ctx.fields.bushes.add(world.x, world.z, {
      scale: 0.8 + Math.random() * 0.5,
      rotY: Math.random() * Math.PI
    });
  }

  for (const [tx, tz] of [[-13, 4], [13, 6], [-11, -8]]) {
    const world = ctx.localToWorld(group, tx, tz);
    ctx.fields.trees.add(world.x, world.z, {
      scale: 1.05 + Math.random() * 0.3,
      rotY: Math.random() * Math.PI * 2
    });
    ctx.addCircle(world.x, world.z, 0.9);
  }

  return group;
}
