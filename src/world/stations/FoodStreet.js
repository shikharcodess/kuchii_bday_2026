import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createStringLights, createLantern } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 5 — Food Street.
 *
 * Two little stalls facing each other across the road under strings of warm
 * bulbs: a prawn-curry counter (West Bengal style, her favourite) and a spice
 * stall with baskets of chillies.
 */
export function buildFoodStreet(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(9312);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -0.35;
  ctx.scene.add(group);

  const curryStall = buildStall({
    canopyA: 0xd9604f,
    canopyB: 0xf3e3cd
  });
  curryStall.position.set(-6, 0, 0);
  curryStall.rotation.y = Math.PI / 2;
  group.add(curryStall);
  dressCurryStall(curryStall, ctx);

  const spiceStall = buildStall({
    canopyA: 0xe8a33d,
    canopyB: 0xf3e3cd
  });
  spiceStall.position.set(6, 0, 2);
  spiceStall.rotation.y = -Math.PI / 2;
  group.add(spiceStall);
  dressSpiceStall(spiceStall, ctx);

  ctx.addLocalCircle(group, -6, 0, 2.4);
  ctx.addLocalCircle(group, 6, 2, 2.4);

  // --- Warm bulbs strung across the street ---
  for (const [zPos, sag] of [[-3.5, 1.0], [1, 1.2], [5.5, 1.0]]) {
    group.add(createStringLights(-5.6, 3.5, zPos, 5.6, 3.5, zPos + 1, { sag, bulbs: 10 }));
  }

  const streetLight = new THREE.PointLight(0xffb066, 16, 22, 2);
  streetLight.position.set(0, 3.4, 1);
  group.add(streetLight);

  // --- A shared table with stools between the stalls ---
  const table = new THREE.Group();
  table.position.set(0.4, 0, 6.5);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 20), MAT.plank);
  tableTop.position.y = 0.86;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  table.add(tableTop);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.86, 10), MAT.darkWood);
  tableLeg.position.y = 0.43;
  tableLeg.castShadow = true;
  table.add(tableLeg);

  // Two bowls set out, steam curling above one of them
  for (const side of [-0.45, 0.45]) {
    const bowl = makeBowl();
    bowl.position.set(side, 0.92, 0);
    table.add(bowl);
  }

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.18, 10), MAT.fabricCream);
  candle.position.set(0, 1.01, 0.45);
  table.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), MAT.lampGlow);
  flame.position.set(0, 1.16, 0.45);
  table.add(flame);
  ctx.registerAnimated((time) => {
    flame.scale.setScalar(0.9 + Math.sin(time * 9) * 0.12);
  });

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.6;
    const stool = new THREE.Group();
    stool.position.set(Math.sin(angle) * 1.9, 0, Math.cos(angle) * 1.9);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 14), MAT.wood);
    seat.position.y = 0.56;
    seat.castShadow = true;
    stool.add(seat);

    for (let l = 0; l < 3; l++) {
      const legAngle = (l / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.56, 6), MAT.darkWood);
      leg.position.set(Math.sin(legAngle) * 0.22, 0.28, Math.cos(legAngle) * 0.22);
      leg.castShadow = true;
      stool.add(leg);
    }
    table.add(stool);
  }

  group.add(table);
  ctx.addLocalCircle(group, 0.4, 6.5, 1.5);

  // --- Surroundings ---
  for (const [lx, lz] of [[-8.5, -7], [8.5, 9]]) {
    const lantern = createLantern({ height: 3.2 });
    const world = ctx.localToWorld(group, lx, lz);
    lantern.position.copy(world);
    ctx.scene.add(lantern);
    ctx.addCircle(world.x, world.z, 0.5);
  }

  for (let i = 0; i < 14; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 13 + rand() * 10;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.65 + rand() * 0.5,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x + 14, z - 9, { scale: 1.1, rotY: 1.5 });
  ctx.fields.trees.add(x - 15, z + 8, { scale: 1.2, rotY: 0.3 });
  ctx.addCircle(x + 14, z - 9, 0.9);
  ctx.addCircle(x - 15, z + 8, 0.9);

  return group;
}

/** Shared stall shell: counter, posts and a striped canopy. */
function buildStall({ canopyA, canopyB }) {
  const stall = new THREE.Group();

  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 1.4), MAT.wood);
  counter.position.set(0, 0.52, 0.6);
  counter.castShadow = true;
  counter.receiveShadow = true;
  stall.add(counter);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 1.7), MAT.plank);
  counterTop.position.set(0, 1.11, 0.6);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  stall.add(counterTop);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 0.16), MAT.darkWood);
  backWall.position.set(0, 1.2, -0.9);
  backWall.castShadow = true;
  stall.add(backWall);

  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.9, 8);
  for (const [px, pz] of [[-2.1, 1.3], [2.1, 1.3], [-2.1, -0.9], [2.1, -0.9]]) {
    const post = new THREE.Mesh(postGeo, MAT.darkWood);
    post.position.set(px, 1.45, pz);
    post.castShadow = true;
    stall.add(post);
  }

  // Striped canopy: alternating slats angled forward
  const canopy = new THREE.Group();
  canopy.position.set(0, 3.0, 0.25);
  canopy.rotation.x = 0.22;
  for (let i = 0; i < 9; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.07, 2.9),
      tinted(MAT.fabricCream, i % 2 === 0 ? canopyA : canopyB)
    );
    slat.position.x = -2 + i * 0.5;
    slat.castShadow = true;
    slat.receiveShadow = true;
    canopy.add(slat);
  }
  const valance = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 0.08), tinted(MAT.fabricCream, canopyA));
  valance.position.set(0, -0.1, 1.45);
  canopy.add(valance);
  stall.add(canopy);

  return stall;
}

/** A curry bowl: lathe-turned dish with a thick warm filling. */
function makeBowl() {
  const bowl = new THREE.Group();

  const profile = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    profile.push(new THREE.Vector2(0.05 + t * 0.3, t * t * 0.26));
  }
  const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 20), MAT.white);
  shell.castShadow = true;
  shell.receiveShadow = true;
  bowl.add(shell);

  const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.24, 0.06, 20), MAT.curry);
  filling.position.y = 0.22;
  bowl.add(filling);

  // Two prawns curled on top
  for (const side of [-1, 1]) {
    const prawn = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.028, 6, 14, Math.PI * 1.4),
      tinted(MAT.chili, 0xe8815c)
    );
    prawn.position.set(side * 0.09, 0.27, side * 0.05);
    prawn.rotation.x = -Math.PI / 2.2;
    bowl.add(prawn);
  }

  return bowl;
}

/** Prawn curry counter: pot, ladle, plated bowls, a chilli garnish. */
function dressCurryStall(stall, ctx) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.5, 18), MAT.metal);
  pot.position.set(-1.2, 1.42, 0.6);
  pot.castShadow = true;
  stall.add(pot);

  const potContents = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 18), MAT.curry);
  potContents.position.set(-1.2, 1.66, 0.6);
  stall.add(potContents);

  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), MAT.metal);
  ladle.position.set(-1.0, 1.9, 0.75);
  ladle.rotation.z = 0.4;
  stall.add(ladle);

  // Steam: soft translucent puffs drifting up from the pot
  const steamMat = new THREE.MeshStandardMaterial({
    color: 0xf6efe4,
    transparent: true,
    opacity: 0.16,
    roughness: 1
  });
  const puffs = [];
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.2 + i * 0.05, 10, 8), steamMat);
    puff.position.set(-1.2, 1.9 + i * 0.3, 0.6);
    stall.add(puff);
    puffs.push(puff);
  }
  ctx.registerAnimated((time) => {
    puffs.forEach((puff, i) => {
      const phase = (time * 0.4 + i * 0.25) % 1;
      puff.position.y = 1.85 + phase * 1.3;
      puff.position.x = -1.2 + Math.sin(time * 0.8 + i) * 0.12;
      puff.material.opacity = 0.18 * (1 - phase);
      puff.scale.setScalar(0.7 + phase * 0.9);
    });
  });

  for (let i = 0; i < 2; i++) {
    const bowl = makeBowl();
    bowl.position.set(0.9 + i * 0.85, 1.19, 0.55);
    stall.add(bowl);
  }

  // A small chalkboard on the counter front (Phase 3 adds the caption text)
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.06), MAT.darkWood);
  board.position.set(1.1, 0.7, 1.32);
  board.rotation.x = 0.12;
  stall.add(board);
}

/** Spice stall: baskets of chillies and jars of masala. */
function dressSpiceStall(stall, ctx) {
  const basketMat = tinted(MAT.wood, 0xa87c4f);

  for (let b = 0; b < 3; b++) {
    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.26, 0.28, 14),
      basketMat
    );
    basket.position.set(-1.4 + b * 1.4, 1.29, 0.6);
    basket.castShadow = true;
    stall.add(basket);

    const heapColor = [0xc0392b, 0xd98a2b, 0x8a5a2b][b];
    const heap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      tinted(MAT.chili, heapColor)
    );
    heap.scale.set(1, 0.5, 1);
    heap.position.set(-1.4 + b * 1.4, 1.44, 0.6);
    stall.add(heap);
  }

  // Chillies hung along the back wall
  for (let i = 0; i < 9; i++) {
    const chilli = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), MAT.chili);
    chilli.position.set(-1.8 + i * 0.45, 1.85 + Math.sin(i) * 0.08, -0.78);
    chilli.rotation.x = 0.2;
    chilli.rotation.z = Math.sin(i * 2) * 0.25;
    chilli.castShadow = true;
    stall.add(chilli);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 5), MAT.stem);
    stem.position.set(chilli.position.x, chilli.position.y + 0.17, -0.78);
    stall.add(stem);
  }

  // Spice jars on a small shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.4), MAT.plank);
  shelf.position.set(0, 1.05, -0.72);
  shelf.castShadow = true;
  stall.add(shelf);

  const jarColors = [0xe8b74a, 0xb5452f, 0x7d5b32, 0xd97c2b];
  jarColors.forEach((color, i) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12),
      tinted(MAT.white, color)
    );
    jar.position.set(-0.9 + i * 0.6, 1.24, -0.72);
    jar.castShadow = true;
    stall.add(jar);
  });
}
