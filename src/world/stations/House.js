import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createFenceRun, createBench, createLantern } from '../Props.js';
import { damp } from '../../utils/MathUtils.js';

/**
 * Station 1 — the House (start point).
 *
 * A small cosy cottage with a lit porch and a front garden, set just off the
 * road and angled toward it so it's in view the moment the world loads. The
 * blank painted wall in the side yard is a quiet nod to the home in the plans,
 * never spelled out in words.
 *
 * The front door opens onto a small enclosed vestibule (rather than a hole cut
 * into the main house volume, which primitive geometry can't do): its own
 * floor, side walls and a door on a hinge, sitting on the porch in front of
 * the house's existing front wall. Approaching it offers the first real
 * interaction in the world — opening the door reveals a warm little entryway
 * and her welcome message.
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

  // --- Windows ---
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

  // --- Entry vestibule: a small enclosed nook in front of the house wall,
  // with its own hinged door. This is where "walk up and open the door"
  // actually goes somewhere, rather than a door mesh flush against a solid
  // wall with nothing behind it. ---
  const nookDepth = 0.95;
  const nookFrontZ = 4 + nookDepth;
  const nookWidth = 2.0;
  const nookHeight = 2.5;

  const nook = new THREE.Group();
  nook.position.set(0, 0, 4);
  group.add(nook);

  const nookFloor = new THREE.Mesh(new THREE.BoxGeometry(nookWidth, 0.06, nookDepth), MAT.plank);
  nookFloor.position.set(0, 0.03, nookDepth / 2);
  nookFloor.receiveShadow = true;
  nook.add(nookFloor);

  const nookCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(nookWidth, 0.08, nookDepth),
    MAT.paleWall
  );
  nookCeiling.position.set(0, nookHeight, nookDepth / 2);
  nookCeiling.receiveShadow = true;
  nook.add(nookCeiling);

  const nookWallGeo = new THREE.BoxGeometry(0.1, nookHeight, nookDepth);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(nookWallGeo, MAT.paleWall);
    wall.position.set((side * nookWidth) / 2, nookHeight / 2, nookDepth / 2);
    wall.castShadow = true;
    wall.receiveShadow = true;
    nook.add(wall);
  }

  // Front facade: two jambs and a header, leaving the doorway open between them
  const doorWidth = 1.3;
  const doorHeight = 2.2;
  const jambWidth = (nookWidth - doorWidth) / 2;

  const jambGeo = new THREE.BoxGeometry(jambWidth, nookHeight, 0.1);
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(jambGeo, MAT.paleWall);
    jamb.position.set(side * (doorWidth / 2 + jambWidth / 2), nookHeight / 2, nookDepth);
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    nook.add(jamb);
  }

  const header = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, nookHeight - doorHeight, 0.1),
    MAT.paleWall
  );
  header.position.set(0, doorHeight + (nookHeight - doorHeight) / 2, nookDepth);
  header.castShadow = true;
  nook.add(header);

  // A small gabled cap over the nook, so it reads as a proper little porch
  // room rather than a box stuck to the wall
  const nookRoof = new THREE.Mesh(
    new THREE.BoxGeometry(nookWidth + 0.4, 0.16, nookDepth + 0.5),
    MAT.roofTile
  );
  nookRoof.position.set(0, nookHeight + 0.08, nookDepth / 2 - 0.1);
  nookRoof.rotation.x = -0.05;
  nookRoof.castShadow = true;
  nook.add(nookRoof);

  // Interior dressing: a small round rug and a warm pendant light, so opening
  // the door reveals somewhere lived-in rather than an empty box
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    tinted(MAT.fabricPink, 0xd98fa0)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.065, nookDepth * 0.6);
  nook.add(rug);

  const pendantCord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), MAT.darkWood);
  pendantCord.position.set(0, nookHeight - 0.2, nookDepth / 2);
  nook.add(pendantCord);

  const pendantShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.2, 12, 1, true),
    tinted(MAT.fabricCream, 0xf2e2c8, { side: THREE.DoubleSide })
  );
  pendantShade.position.set(0, nookHeight - 0.42, nookDepth / 2);
  nook.add(pendantShade);

  const nookLight = new THREE.PointLight(0xffcf9a, 0, 3.2, 2);
  nookLight.position.set(0, nookHeight - 0.5, nookDepth / 2);
  nook.add(nookLight);

  // A hook with a light scarf, a small nod to someone who's always dressed well
  const hook = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), MAT.metal);
  hook.position.set(nookWidth / 2 - 0.15, nookHeight - 0.6, 0.15);
  nook.add(hook);

  const scarf = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.5),
    tinted(MAT.fabricPink, 0xdba8c0, { side: THREE.DoubleSide })
  );
  scarf.position.set(nookWidth / 2 - 0.15, nookHeight - 0.85, 0.14);
  nook.add(scarf);

  // --- The door itself, hinged on its left edge ---
  const doorHinge = new THREE.Group();
  doorHinge.position.set(-doorWidth / 2, 0, nookFrontZ);
  nook.add(doorHinge);

  const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.08), MAT.darkWood);
  door.position.set(doorWidth / 2, doorHeight / 2, 0);
  door.castShadow = true;
  doorHinge.add(door);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), MAT.gold);
  knob.position.set(doorWidth - 0.15, doorHeight / 2, 0.05);
  doorHinge.add(knob);

  // Door state, eased open/closed by the interaction below
  const doorState = { angle: 0, target: 0 };
  ctx.registerAnimated((time, dt) => {
    doorState.angle = damp(doorState.angle, doorState.target, 6, dt);
    doorHinge.rotation.y = doorState.angle;
    nookLight.intensity = doorState.angle < -0.05 ? 5.5 : 0;
  });

  // Interaction: the first thing to actually do in the whole world
  const doorWorld = ctx.localToWorld(nook, 0, nookFrontZ);
  ctx.interactions.register({
    id: 'house_door',
    x: doorWorld.x,
    z: doorWorld.z,
    radius: 3.2,
    label: 'Open the door',
    activeLabel: 'Close the door',
    onEnter: () => {
      doorState.target = -2.1; // swings inward, into the vestibule
      ctx.messagePanel.show(ctx.station.message);
    },
    onExit: () => {
      doorState.target = 0;
      ctx.messagePanel.hide();
    }
  });

  ctx.addLocalCircle(group, 0, nookDepth / 2 + 4, 1.6); // the nook itself

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
