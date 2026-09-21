import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createStringLights, createLantern, createSignpost, createBench } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';
import { Roadster } from '../../entities/Roadster.js';

/**
 * Station 4 — Drive & Dream Scenic Overlook.
 *
 * A dedicated station celebrating her dream and goal to learn to drive:
 * - A fully drivable vintage convertible sports roadster.
 * - Smooth scenic turnout pad with zero Z-fighting/flickering.
 * - Timber valley guardrail overlooking the pine valley with festoon string lights.
 * - Vintage panoramic brass telescope on a tripod.
 * - Heartfelt wish signboard inspired by wish.txt.
 * - Full interactive driving mechanics across the entire world!
 */
export function buildDrivingOverlook(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(4104);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = 0.25;
  ctx.scene.add(group);

  // --- 1. Scenic Viewpoint Paved Turnout Pad (Zero Z-Fighting) ---
  const padW = 16;
  const padD = 13;

  // Single clean paved sandstone turnout pad at y = 0.02
  const turnout = new THREE.Mesh(
    new THREE.BoxGeometry(padW, 0.04, padD),
    MAT.sandstone
  );
  turnout.position.set(0, 0.02, 0);
  turnout.receiveShadow = true;
  group.add(turnout);

  // Rustic stone retaining curb along the rear valley drop edge
  const railZ = -padD / 2 + 0.35;
  const rearCurb = new THREE.Mesh(
    new THREE.BoxGeometry(padW, 0.16, 0.35),
    MAT.stone
  );
  rearCurb.position.set(0, 0.08, railZ);
  rearCurb.receiveShadow = true;
  group.add(rearCurb);

  // --- 2. Rustic Timber Valley Guardrail ---
  const postSpacing = 2.4;
  const postCount = Math.floor(padW / postSpacing);
  for (let i = 0; i <= postCount; i++) {
    const px = -padW / 2 + 0.8 + i * postSpacing;
    if (px > padW / 2 - 0.8) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 8), MAT.bark);
    post.position.set(px, 0.65, railZ);
    post.castShadow = true;
    group.add(post);
    ctx.addLocalCircle(group, px, railZ, 0.35);
  }

  // Horizontal top & mid timber rails
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(padW - 1.2, 0.08, 0.14), MAT.wood);
  topRail.position.set(0, 1.15, railZ);
  topRail.castShadow = true;
  group.add(topRail);

  const midRail = new THREE.Mesh(new THREE.BoxGeometry(padW - 1.2, 0.06, 0.12), MAT.wood);
  midRail.position.set(0, 0.72, railZ);
  group.add(midRail);

  // --- 3. Panoramic Brass Telescope on Tripod ---
  const telescopeGroup = new THREE.Group();
  telescopeGroup.position.set(4.2, 0.04, railZ + 0.8);
  telescopeGroup.rotation.y = -0.2;

  // Tripod legs
  for (let a = 0; a < 3; a++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 8), MAT.wood);
    leg.rotation.z = 0.26;
    leg.rotation.y = (a * Math.PI * 2) / 3;
    leg.position.y = 0.55;
    telescopeGroup.add(leg);
  }

  // Brass telescope barrel & mount
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 10), MAT.gold);
  mount.position.y = 1.12;
  telescopeGroup.add(mount);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.55, 12), MAT.gold);
  barrel.rotation.x = Math.PI / 2 - 0.22; // angled toward distant mountains
  barrel.position.set(0, 1.18, 0.08);
  barrel.castShadow = true;
  telescopeGroup.add(barrel);
  group.add(telescopeGroup);
  ctx.addLocalCircle(group, 4.2, railZ + 0.8, 0.4);

  // --- 4. The Fully Drivable Vintage Roadster ---
  const carWorld = ctx.localToWorld(group, 0.3, 0.8);
  const roadster = new Roadster(ctx.scene, {
    x: carWorld.x,
    z: carWorld.z,
    yaw: group.rotation.y - Math.PI / 14
  });

  if (ctx.setRoadster) {
    ctx.setRoadster(roadster);
  }

  // Register Clickable for Surprise
  if (ctx.surprises && ctx.surprises.registerClickable) {
    ctx.surprises.registerClickable(roadster.group, 'driving_roadster');
  }

  // Register Proximity Interaction to Enter/Drive Roadster
  ctx.interactions.register({
    id: 'driving_roadster',
    get x() { return roadster.position.x; },
    get z() { return roadster.position.z; },
    radius: 3.2,
    label: "Drive Kuchii's Roadster 🚗",
    activeLabel: "Drive: [W/S] • Steer: [A/D] • Horn: [Space] • [Esc] Exit Car",
    onEnter: (character) => {
      roadster.mount(character, ctx.dog);
      ctx.surprises?.triggerSurprise?.('driving_roadster');
      if (ctx.audio) ctx.audio.playHorn();
    },
    onExit: (character) => {
      roadster.dismount();
    }
  });

  // --- 5. Wish Signboard beside the Scenic Railing ---
  const driveSign = createSignpost({
    boardWidth: 2.8,
    boardHeight: 1.4,
    height: 1.5,
    title: "Conquer The Roads, Kuchii 🚗✨",
    lines: [
      "I pray ki tumhari saari dreams & wishes poori hon...",
      "Car achhe se seekho, independent bano & proud feel karo.",
      "Har road tumhari hai, and I'll always be your co-driver ❤️"
    ],
    signoff: "— Shikhar ❤️"
  });
  driveSign.position.set(-5.4, 0.04, -3.8);
  driveSign.rotation.y = 0.35;
  group.add(driveSign);
  ctx.addLocalCircle(group, -5.4, -3.8, 0.6);

  // --- 6. Scenic Timber Bench looking at the Valley ---
  const bench = createBench({ width: 1.6, backHeight: 0.8 });
  bench.position.set(5.2, 0.04, -1.8);
  bench.rotation.y = -Math.PI / 2;
  group.add(bench);
  ctx.addLocalCircle(group, 5.2, -1.8, 0.7);

  // --- 7. Roadside Festoon Poles & String Lights ---
  const poleHeight = 4.6;
  const poleA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleA.position.set(-6.8, poleHeight / 2 + 0.02, -railZ);
  group.add(poleA);

  const poleB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleB.position.set(6.8, poleHeight / 2 + 0.02, -railZ);
  group.add(poleB);

  const poleC = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleC.position.set(-6.8, poleHeight / 2 + 0.02, railZ);
  group.add(poleC);

  const poleD = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleD.position.set(6.8, poleHeight / 2 + 0.02, railZ);
  group.add(poleD);

  group.add(createStringLights(-6.8, poleHeight, -railZ, 6.8, poleHeight, -railZ, { sag: 0.8, bulbs: 10 }));
  group.add(createStringLights(-6.8, poleHeight, railZ, 6.8, poleHeight, railZ, { sag: 0.8, bulbs: 10 }));
  group.add(createStringLights(-6.8, poleHeight, -railZ, -6.8, poleHeight, railZ, { sag: 0.8, bulbs: 8 }));
  group.add(createStringLights(6.8, poleHeight, -railZ, 6.8, poleHeight, railZ, { sag: 0.8, bulbs: 8 }));

  // Warm overhead ambiance light over the overlook
  const ambianceLight = new THREE.PointLight(0xffdfa8, 3.5, 14, 2);
  ambianceLight.position.set(0.5, 3.4, 0.8);
  group.add(ambianceLight);

  // --- 8. Entrance Lantern ---
  const entranceLantern = createLantern({ height: 3.0 });
  entranceLantern.position.set(-7.2, 0.02, 5.2);
  group.add(entranceLantern);
  ctx.addLocalCircle(group, -7.2, 5.2, 0.5);

  // --- 9. Perimeter Flower Planters along the Guardrail ---
  for (const px of [-3.8, 1.8]) {
    const planterBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.45), MAT.wood);
    planterBox.position.set(px, 0.22, railZ + 0.4);
    planterBox.castShadow = true;
    group.add(planterBox);

    for (let f = 0; f < 6; f++) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        tinted(MAT.rose, f % 2 === 0 ? 0xffb703 : 0xf72585)
      );
      flower.position.set(px - 0.6 + f * 0.24, 0.44, railZ + 0.4);
      group.add(flower);
    }
  }

  // --- 10. Surroundings & Greenery ---
  for (let i = 0; i < 10; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 11 + rand() * 8;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.7 + rand() * 0.5,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x - 12, z - 8, { scale: 1.2, rotY: 0.9 });
  ctx.fields.trees.add(x + 11, z - 7, { scale: 1.1, rotY: 1.8 });
  ctx.addCircle(x - 12, z - 8, 0.9);
  ctx.addCircle(x + 11, z - 7, 0.9);

  return group;
}
