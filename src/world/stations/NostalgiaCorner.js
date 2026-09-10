import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createStringLights, createBench } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 4 — the Nostalgia Corner.
 *
 * Cartoons, movies and music, referenced through objects and colour rather than
 * any character likeness: a boxy retro TV, a film reel, a record crate, a
 * jukebox, floor cushions and a string of bunting.
 */
export function buildNostalgiaCorner(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(4104);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = 0.4;
  ctx.scene.add(group);

  // --- Wooden deck with a patterned rug ---
  const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.24, 12), MAT.plank);
  deck.position.y = 0.12;
  deck.receiveShadow = true;
  group.add(deck);

  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), MAT.fabricPink);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.25, 0.6);
  rug.receiveShadow = true;
  group.add(rug);

  const rugRing = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 32), tinted(MAT.fabricCream, 0xf0d9b5));
  rugRing.rotation.x = -Math.PI / 2;
  rugRing.position.set(0, 0.26, 0.6);
  group.add(rugRing);

  // --- Retro TV on a low cabinet ---
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 1.2), MAT.darkWood);
  cabinet.position.set(0, 0.69, -4);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  const tvBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.4), tinted(MAT.wood, 0xa9714a));
  tvBody.position.set(0, 2.04, -4);
  tvBody.castShadow = true;
  group.add(tvBody);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.1), MAT.screenGlow);
  screen.position.set(0, 2.1, -3.28);
  group.add(screen);
  group.userData.screen = screen;

  // The screen flickers gently, like an old set left on in the next room.
  ctx.registerAnimated((time) => {
    screen.material.emissiveIntensity = 0.75 + Math.sin(time * 6.3) * 0.08 + Math.sin(time * 17) * 0.04;
  });

  for (const side of [-0.6, 0.6]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 10), MAT.gold);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(side, 1.35, -3.3);
    group.add(knob);
  }

  // Rabbit-ear antenna
  for (const side of [-1, 1]) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.5, 6), MAT.metal);
    antenna.position.set(side * 0.35, 3.4, -4.1);
    antenna.rotation.z = side * 0.45;
    group.add(antenna);
  }

  const tvLight = new THREE.PointLight(0x7fc4e0, 5, 9, 2);
  tvLight.position.set(0, 2.2, -2.6);
  group.add(tvLight);

  // --- Film reel on a stand ---
  const reelStand = new THREE.Group();
  reelStand.position.set(-4.6, 0.24, -1.6);

  const reelPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.8, 8), MAT.metal);
  reelPost.position.y = 0.9;
  reelPost.castShadow = true;
  reelStand.add(reelPost);

  const reel = new THREE.Group();
  reel.position.y = 1.9;
  const reelDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.1, 24), MAT.metal);
  reelDisc.rotation.x = Math.PI / 2;
  reelDisc.castShadow = true;
  reel.add(reelDisc);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.16, 12),
      MAT.darkWood
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.sin(angle) * 0.42, Math.cos(angle) * 0.42, 0);
    reel.add(hole);
  }

  const filmStrip = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 8, 24), MAT.darkWood);
  filmStrip.castShadow = true;
  reel.add(filmStrip);

  reelStand.add(reel);
  group.add(reelStand);
  reelStand.rotation.y = 0.5; // angled toward the road
  ctx.registerAnimated((time) => {
    reel.rotation.z = time * 0.5;
  });

  // --- Jukebox ---
  const jukebox = new THREE.Group();
  jukebox.position.set(4.8, 0.24, -2.4);
  jukebox.rotation.y = -0.5;

  const jukeBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1), tinted(MAT.wood, 0x8d4f3a));
  jukeBody.position.y = 1.2;
  jukeBody.castShadow = true;
  jukeBody.receiveShadow = true;
  jukebox.add(jukeBody);

  const jukeCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 1, 18, 1, false, 0, Math.PI),
    tinted(MAT.gold, 0xd8a95c)
  );
  jukeCrown.rotation.x = Math.PI / 2;
  jukeCrown.rotation.z = Math.PI;
  jukeCrown.position.y = 2.4;
  jukeCrown.castShadow = true;
  jukebox.add(jukeCrown);

  const jukeGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1, 0.1), MAT.lampGlow);
  jukeGlass.position.set(0, 1.6, 0.52);
  jukebox.add(jukeGlass);

  // Song selector buttons
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10),
        tinted(MAT.white, row === 0 ? 0xe8c169 : 0xe07a8f)
      );
      button.rotation.x = Math.PI / 2;
      button.position.set(-0.5 + col * 0.25, 0.75 + row * 0.2, 0.53);
      jukebox.add(button);
    }
  }

  const jukeLight = new THREE.PointLight(0xffb37a, 6, 10, 2);
  jukeLight.position.set(0, 2.2, 0.8);
  jukebox.add(jukeLight);

  group.add(jukebox);
  group.userData.jukebox = jukebox;

  // --- Record crate and a couple of records on display stands ---
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.1), MAT.wood);
  crate.position.set(3, 0.64, 1.6);
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  const sleeveColors = [0xe07a8f, 0x7fb4c4, 0xf0b929, 0x8fbf6a, 0xd9d4c8];
  sleeveColors.forEach((color, i) => {
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 0.06),
      tinted(MAT.white, color)
    );
    sleeve.position.set(3, 1.15, 1.3 + i * 0.11);
    sleeve.rotation.x = -0.12;
    sleeve.castShadow = true;
    group.add(sleeve);
  });

  const vinyl = new THREE.Group();
  vinyl.position.set(-3.2, 0.24, 2.6);
  const vinylStand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.1, 8), MAT.metal);
  vinylStand.position.y = 0.55;
  vinyl.add(vinylStand);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.04, 28),
    new THREE.MeshStandardMaterial({ color: 0x1d1a1c, roughness: 0.4, metalness: 0.2 })
  );
  disc.position.y = 1.3;
  disc.rotation.x = Math.PI / 2.2;
  disc.castShadow = true;
  vinyl.add(disc);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), MAT.sunflowerPetal);
  label.position.y = 1.3;
  label.rotation.x = Math.PI / 2.2;
  vinyl.add(label);
  group.add(vinyl);
  ctx.registerAnimated((time) => {
    disc.rotation.y = time * 1.6;
    label.rotation.y = time * 1.6;
  });

  // --- Floor cushions to sit and watch ---
  const cushionColors = [0xefb0c0, 0xf2d3a0, 0xa8c8d8];
  cushionColors.forEach((color, i) => {
    const cushion = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 10),
      tinted(MAT.fabricCream, color)
    );
    cushion.scale.set(1, 0.5, 1);
    cushion.position.set(-1.6 + i * 1.6, 0.5, 1.9);
    cushion.castShadow = true;
    cushion.receiveShadow = true;
    group.add(cushion);
  });

  // --- Bunting overhead ---
  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 4.4, 8), MAT.plank);
    pole.position.set(side * 6.4, 2.2, 0.5);
    pole.castShadow = true;
    group.add(pole);
  }

  const bunting = createStringLights(-6.4, 4.2, 0.5, 6.4, 4.2, 0.5, { sag: 1.1, bulbs: 11 });
  group.add(bunting);

  const flagColors = [0xe07a8f, 0xf0b929, 0x7fb4c4, 0x8fbf6a, 0xefb0c0];
  for (let i = 0; i < 9; i++) {
    const t = (i + 1) / 10;
    const flag = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.5, 3),
      tinted(MAT.white, flagColors[i % flagColors.length])
    );
    const px = -6.4 + t * 12.8;
    const sagY = 4.2 - Math.sin(Math.PI * t) * 1.1;
    flag.position.set(px, sagY - 0.35, 0.5);
    flag.rotation.x = Math.PI;
    flag.rotation.y = Math.PI / 6;
    flag.castShadow = true;
    group.add(flag);
  }

  // Colliders on the furniture only — the deck itself stays walkable.
  ctx.addLocalCircle(group, 0, -4, 1.9); // TV cabinet
  ctx.addLocalCircle(group, 4.8, -2.4, 1.1); // jukebox
  ctx.addLocalCircle(group, -4.6, -1.6, 0.9); // film reel stand
  ctx.addLocalCircle(group, 3, 1.6, 0.9); // record crate
  ctx.addLocalCircle(group, -3.2, 2.6, 0.7); // vinyl display
  ctx.addLocalCircle(group, -6.4, 0.5, 0.5); // bunting poles
  ctx.addLocalCircle(group, 6.4, 0.5, 0.5);

  // --- Surroundings ---
  const bench = createBench();
  bench.position.set(x + 11, 0, z + 5);
  bench.rotation.y = -1.1;
  ctx.scene.add(bench);
  ctx.addCircle(x + 11, z + 5, 1.2);

  for (let i = 0; i < 12; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 12 + rand() * 9;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.7 + rand() * 0.5,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x - 13, z - 8, { scale: 1.2, rotY: 0.9 });
  ctx.fields.trees.add(x - 10, z + 10, { scale: 1.0, rotY: 2.6 });
  ctx.addCircle(x - 13, z - 8, 0.9);
  ctx.addCircle(x - 10, z + 10, 0.9);

  return group;
}
