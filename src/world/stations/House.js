import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createBench, createLantern, createFenceRun } from '../Props.js';
import { damp } from '../../utils/MathUtils.js';

/**
 * Station 1 — Explorable Cozy Cottage & Porch.
 * 
 * A full walkable house:
 * - Front porch with steps, lantern, and welcome mat.
 * - Walk inside into a warm, beautifully detailed home:
 *   1. Cozy living room with brick fireplace, soft rug, and sittable sofa.
 *   2. Memory gallery wall celebrating their future home dreams.
 *   3. Kitchen counter with tea and a nod to prawn curry.
 *   4. Study/vanity desk with golden-pink sparkles and a secret birthday letter.
 * - Cutaway roof: smoothly fades when entering the house so camera and interior are pristine!
 */
export function buildHouse(ctx) {
  const group = new THREE.Group();
  const { x, z } = ctx.station.position;

  // Cottage placed just west of the path at the start
  const cottagePos = { x: x - 10.5, z: z - 4.5 };
  group.position.set(cottagePos.x, 0, cottagePos.z);
  group.rotation.y = 0.85; // angled invitingly toward the start road
  ctx.scene.add(group);

  // --- Foundation & Interior Floor ---
  const floorW = 8.6;
  const floorD = 7.4;
  const floorH = 0.24;

  // Solid stone foundation plinth to completely prevent ground clipping
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(floorW + 0.2, 0.26, floorD + 0.2),
    MAT.stone
  );
  foundation.position.set(0, 0.13, 0);
  foundation.receiveShadow = true;
  group.add(foundation);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.08, floorD),
    MAT.plank
  );
  floor.position.set(0, floorH, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // --- Porch Deck ---
  const porchW = 6.8;
  const porchD = 3.2;
  const porchZ = floorD / 2 + porchD / 2;

  const porchFoundation = new THREE.Mesh(
    new THREE.BoxGeometry(porchW + 0.2, 0.26, porchD + 0.2),
    MAT.stone
  );
  porchFoundation.position.set(0, 0.13, porchZ);
  porchFoundation.receiveShadow = true;
  group.add(porchFoundation);

  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(porchW, 0.08, porchD),
    MAT.plank
  );
  porch.position.set(0, floorH, porchZ);
  porch.receiveShadow = true;
  group.add(porch);

  // Porch steps
  for (let i = 0; i < 2; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.45), MAT.sandstone);
    step.position.set(0, (1 - i) * 0.08 + 0.045, porchZ + porchD / 2 + (i + 0.5) * 0.45);
    step.receiveShadow = true;
    group.add(step);
  }

  // Welcome doormat
  const doormat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.8), MAT.fabricPink);
  doormat.position.set(0, floorH + 0.04, porchZ + 0.3);
  doormat.receiveShadow = true;
  group.add(doormat);

  // Porch posts
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.8, 8);
  for (const px of [-porchW / 2 + 0.3, porchW / 2 - 0.3]) {
    const post = new THREE.Mesh(postGeo, MAT.wood);
    post.position.set(px, 1.4, porchZ + porchD / 2 - 0.2);
    post.castShadow = true;
    group.add(post);
  }

  // Warm porch light
  const porchLantern = new THREE.PointLight(0xffb86c, 10, 14, 2);
  porchLantern.position.set(0, 2.6, porchZ);
  group.add(porchLantern);

  const porchGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), MAT.lampGlow);
  porchGlobe.position.copy(porchLantern.position);
  group.add(porchGlobe);

  // --- Walls (Lower permanent perimeter walls) ---
  const wallH = 2.9;
  const wallThick = 0.22;

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, wallH, wallThick),
    MAT.paleWall
  );
  backWall.position.set(0, wallH / 2, -floorD / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, floorD),
    MAT.paleWall
  );
  leftWall.position.set(-floorW / 2, wallH / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, floorD),
    MAT.paleWall
  );
  rightWall.position.set(floorW / 2, wallH / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Front wall (left and right flanks of the doorway)
  const doorW = 1.6;
  const flankW = (floorW - doorW) / 2;

  for (const side of [-1, 1]) {
    const flank = new THREE.Mesh(
      new THREE.BoxGeometry(flankW, wallH, wallThick),
      MAT.paleWall
    );
    flank.position.set(side * (doorW / 2 + flankW / 2), wallH / 2, floorD / 2);
    flank.castShadow = true;
    flank.receiveShadow = true;
    group.add(flank);
  }

  // Door header
  const doorHeader = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, wallH - 2.2, wallThick),
    MAT.paleWall
  );
  doorHeader.position.set(0, 2.2 + (wallH - 2.2) / 2, floorD / 2);
  group.add(doorHeader);

  // --- Hinged Front Door ---
  const doorHinge = new THREE.Group();
  doorHinge.position.set(-doorW / 2, 0, floorD / 2);
  group.add(doorHinge);

  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(doorW * 0.96, 2.15, 0.08),
    MAT.darkWood
  );
  doorMesh.position.set(doorW * 0.48, 1.1, 0);
  doorMesh.castShadow = true;
  doorHinge.add(doorMesh);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), MAT.gold);
  knob.position.set(doorW * 0.85, 1.05, 0.06);
  doorHinge.add(knob);

  // Door opens inward invitingly
  doorHinge.rotation.y = -Math.PI * 0.45;

  // --- Interior Lighting ---
  const interiorLight = new THREE.PointLight(0xffdfa8, 14, 16, 2);
  interiorLight.position.set(0, 2.5, 0);
  group.add(interiorLight);

  // --- Cozy Living Room (Left Side) ---
  // Soft round pink/cream carpet
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 24),
    tinted(MAT.fabricPink, 0xdf99aa)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-2.2, floorH + 0.01, 0.5);
  rug.receiveShadow = true;
  group.add(rug);

  // Brick fireplace on the back wall
  const fireplace = new THREE.Group();
  fireplace.position.set(-2.4, 0, -floorD / 2 + 0.45);
  group.add(fireplace);

  // Stone surround built as two pillars + lintel so the firebox is a real cavity
  [-0.75, 0.75].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.7), MAT.stone);
    pillar.position.set(px, 0.9, 0);
    pillar.castShadow = true;
    fireplace.add(pillar);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.7), MAT.stone);
  lintel.position.set(0, 1.4, 0);
  lintel.castShadow = true;
  fireplace.add(lintel);
  const fireback = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.1), MAT.darkWood);
  fireback.position.set(0, 0.5, -0.3);
  fireplace.add(fireback);
  const hearthStone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.6), MAT.stone);
  hearthStone.position.set(0, 0.03, 0.45);
  hearthStone.receiveShadow = true;
  fireplace.add(hearthStone);

  // Logs
  [[-0.18, 0.1, 0.3], [0.18, 0.1, -0.3], [0, 0.22, 0]].forEach(([lx, ly, rot]) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8), MAT.darkWood);
    log.rotation.set(0, rot, Math.PI / 2);
    log.position.set(lx, ly, 0.05);
    fireplace.add(log);
  });

  // Glowing fire embers
  const fireGlow = new THREE.PointLight(0xff7722, 9, 7, 2);
  fireGlow.position.set(0, 0.55, 0.25);
  fireplace.add(fireGlow);

  // Layered flame: orange outer tongue, yellow core, additive so it glows over the logs
  const flame = new THREE.Group();
  flame.position.set(0, 0.5, 0.05);
  [[0.22, 0.55, 0xff5a1a, 0.55], [0.13, 0.4, 0xffb830, 0.8], [0.06, 0.25, 0xfff2b0, 0.95]].forEach(([r, h, color, opacity]) => {
    const tongue = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    tongue.position.y = h / 2 - 0.25;
    flame.add(tongue);
  });
  fireplace.add(flame);

  // Mantel shelf with a pair of fuzzy socks hung to warm
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.5), MAT.darkWood);
  mantel.position.set(0, 1.84, 0.15);
  mantel.castShadow = true;
  fireplace.add(mantel);
  [-0.35, 0.35].forEach((sx, i) => {
    const sock = createFuzzySock(i === 0 ? 0xf1a7b5 : 0xb9d6f2);
    sock.position.set(sx, 1.78, 0.42);
    fireplace.add(sock);
  });

  // Cozy Sofa
  const sofa = new THREE.Group();
  sofa.position.set(-2.2, 0, 1.8);
  sofa.rotation.y = Math.PI; // faces fireplace
  group.add(sofa);

  const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.8), MAT.fabricCream);
  sofaSeat.position.y = 0.35;
  sofaSeat.castShadow = true;
  sofa.add(sofaSeat);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.25), MAT.fabricCream);
  sofaBack.position.set(0, 0.7, -0.32);
  sofaBack.castShadow = true;
  sofa.add(sofaBack);

  for (const side of [-0.95, 0.95]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.8), MAT.fabricCream);
    arm.position.set(side, 0.5, 0);
    sofa.add(arm);
  }

  // Sit on sofa interaction
  const sofaWorld = ctx.localToWorld(group, -2.2, 1.8);
  ctx.interactions.register({
    id: 'house_sofa',
    x: sofaWorld.x,
    z: sofaWorld.z,
    radius: 1.8,
    label: 'Sit by the warm fireplace',
    activeLabel: 'Stand up',
    onEnter: (character) => {
      character.sitOn({
        x: sofaWorld.x,
        z: sofaWorld.z,
        y: 0.2,
        yaw: group.rotation.y + Math.PI
      });
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'house_fireplace' } }));
    },
    onExit: (character) => {
      character.standUp();
      ctx.messagePanel?.hide();
    }
  });

  // --- Memory Gallery Wall (Back Wall Center) ---
  const galleryGroup = new THREE.Group();
  galleryGroup.position.set(1.0, 1.6, -floorD / 2 + 0.14);
  group.add(galleryGroup);

  // Gallery wall interaction — stand in front of the frames
  const galleryWorld = ctx.localToWorld(group, 1.0, -floorD / 2 + 1.3);
  ctx.interactions.register({
    id: 'house_gallery',
    x: galleryWorld.x,
    z: galleryWorld.z,
    radius: 1.6,
    label: 'Look at the gallery wall',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'house_gallery' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // The future-home dreams from the surprise text: a garden, a library, a server room.
  ['garden', 'library', 'server'].forEach((scene, i) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.05), MAT.gold);
    frame.position.x = (i - 1) * 1.1;
    galleryGroup.add(frame);

    const painting = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.58),
      new THREE.MeshStandardMaterial({ map: createPaintingTexture(scene), roughness: 0.85 })
    );
    painting.position.set((i - 1) * 1.1, 0, 0.03);
    galleryGroup.add(painting);
  });

  const pictureLight = new THREE.PointLight(0xffe3b8, 3, 3.5, 2);
  pictureLight.position.set(0, 0.8, 0.6);
  galleryGroup.add(pictureLight);

  // --- Kitchen & Dining Nook (Right Back) ---
  const kitchen = new THREE.Group();
  kitchen.position.set(2.8, 0, -1.8);
  group.add(kitchen);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.88, 2.4), MAT.wood);
  counter.position.y = 0.44;
  counter.castShadow = true;
  counter.receiveShadow = true;
  kitchen.add(counter);

  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 10), MAT.metal);
  kettle.position.set(0.2, 0.98, -0.4);
  kitchen.add(kettle);

  // --- Vanity & Study Desk with Secret Letter (Right Front) ---
  const vanity = new THREE.Group();
  vanity.position.set(2.6, 0, 1.6);
  group.add(vanity);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.82, 1.1), MAT.darkWood);
  desk.position.y = 0.41;
  desk.castShadow = true;
  vanity.add(desk);

  // Vanity mirror
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), MAT.windowGlow);
  mirror.position.set(0, 1.35, 0.48);
  vanity.add(mirror);

  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.03, 8, 24), MAT.gold);
  mirrorFrame.position.copy(mirror.position);
  vanity.add(mirrorFrame);

  // Secret envelope / letter on desk (Surprise!)
  const envelope = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.025, 0.25), tinted(MAT.fabricCream, 0xffeedd));
  envelope.position.set(-0.25, 0.83, 0);
  envelope.rotation.y = 0.2;
  envelope.userData = { surpriseId: 'house_letter', isClickable: true };
  vanity.add(envelope);

  const envSeal = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), tinted(MAT.fabricPink, 0xdd4466));
  envSeal.position.set(-0.25, 0.85, 0);
  vanity.add(envSeal);

  // Floating sparkle particles over the vanity
  const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), MAT.lampGlow);
  sparkle.position.set(0, 1.15, 0.1);
  vanity.add(sparkle);

  // Vanity & Letter interaction
  const letterWorld = ctx.localToWorld(group, 2.35, 1.6);
  ctx.interactions.register({
    id: 'house_letter',
    x: letterWorld.x,
    z: letterWorld.z,
    radius: 1.8,
    label: 'Open Shikhar\'s Secret Note',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'house_letter' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // --- Cozy Interior Ceiling with Exposed Timber Beams ---
  const interiorCeiling = new THREE.Group();
  group.add(interiorCeiling);

  // Ceiling underside panels: warm wood/cream finish visible from inside
  const ceilingPlanks = new THREE.Mesh(
    new THREE.BoxGeometry(floorW - 0.1, 0.06, floorD - 0.1),
    MAT.paleWall
  );
  ceilingPlanks.position.set(0, wallH + 0.02, 0);
  ceilingPlanks.receiveShadow = true;
  interiorCeiling.add(ceilingPlanks);

  // 6 Exposed rustic dark-wood rafters across the width of the room
  const beamCount = 6;
  for (let i = 0; i < beamCount; i++) {
    const bz = -floorD / 2 + 0.65 + i * ((floorD - 1.3) / (beamCount - 1));
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(floorW - 0.2, 0.18, 0.18),
      MAT.darkWood
    );
    beam.position.set(0, wallH - 0.08, bz);
    beam.castShadow = true;
    interiorCeiling.add(beam);
  }

  // Central longitudinal spine beam
  const spineBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.22, floorD - 0.2),
    MAT.darkWood
  );
  spineBeam.position.set(0, wallH - 0.06, 0);
  spineBeam.castShadow = true;
  interiorCeiling.add(spineBeam);

  // Warm hanging brass chandelier from the center beam
  const chandelierCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), MAT.metal);
  chandelierCord.position.set(0, wallH - 0.26, 0);
  interiorCeiling.add(chandelierCord);

  const chandelierLantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), MAT.lampGlow);
  chandelierLantern.position.set(0, wallH - 0.48, 0);
  interiorCeiling.add(chandelierLantern);

  const chandelierLight = new THREE.PointLight(0xffe0a8, 6, 10, 2);
  chandelierLight.position.set(0, wallH - 0.48, 0);
  interiorCeiling.add(chandelierLight);

  // --- Cutaway Roof & Chimney Group ---
  const roofGroup = new THREE.Group();
  group.add(roofGroup);

  const roofMat = MAT.roofTile.clone();
  roofMat.transparent = true;
  roofMat.opacity = 0.95;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7.2, 2.8, 4),
    roofMat
  );
  roof.position.y = wallH + 1.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roofGroup.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.2, 0.85), MAT.stone);
  chimney.position.set(2.4, wallH + 1.8, -1.5);
  chimney.castShadow = true;
  roofGroup.add(chimney);

  const porchRoof = new THREE.Mesh(
    new THREE.BoxGeometry(porchW + 0.4, 0.22, porchD + 0.4),
    roofMat
  );
  porchRoof.position.set(0, 2.9, porchZ);
  porchRoof.rotation.x = -0.06;
  porchRoof.castShadow = true;
  roofGroup.add(porchRoof);

  // --- Animated Cutaway & Flickering Fire ---
  ctx.registerAnimated((time, dt) => {
    // Flickering fireplace
    fireGlow.intensity = 8 + Math.sin(time * 12) * 1.5 + Math.cos(time * 19) * 0.8;
    flame.scale.setScalar(0.9 + Math.sin(time * 10) * 0.15);
    sparkle.rotation.y = time * 2;
    sparkle.position.y = 1.15 + Math.sin(time * 3) * 0.05;

    // Cutaway roof opacity: when the player character is indoors or close, fade the roof
    const playerPos = ctx.camera?.target?.position;
    if (playerPos) {
      const dist = Math.hypot(playerPos.x - cottagePos.x, playerPos.z - cottagePos.z);
      const isIndoor = ctx.camera.target.isIndoor || (dist < 6.8);
      const targetOpacity = isIndoor ? 0.05 : 0.95;
      roofMat.opacity = damp(roofMat.opacity, targetOpacity, 6, dt);
      roofGroup.visible = roofMat.opacity > 0.02;
    }
  });

  // --- Colliders: keep player within rooms, can enter via door ---
  // Outer perimeter bounds:
  ctx.addBox(cottagePos.x, cottagePos.z - floorD / 2, floorW / 2, wallThick, group.rotation.y);
  ctx.addBox(cottagePos.x - floorW / 2, cottagePos.z, wallThick, floorD / 2, group.rotation.y);
  ctx.addBox(cottagePos.x + floorW / 2, cottagePos.z, wallThick, floorD / 2, group.rotation.y);
  // Interior furniture colliders
  ctx.addCircle(cottagePos.x - 2.2, cottagePos.z - 2.5, 0.9); // fireplace
  ctx.addCircle(cottagePos.x + 2.5, cottagePos.z - 1.5, 0.8); // kitchen counter

  return group;
}

function createFuzzySock(color) {
  const sock = new THREE.Group();
  const mat = tinted(MAT.fabricCream, color);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8), mat);
  leg.position.y = -0.1;
  sock.add(leg);
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.1, 4, 8), mat);
  foot.rotation.z = Math.PI / 2;
  foot.position.set(0.06, -0.22, 0);
  sock.add(foot);
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.025, 6, 12), MAT.fabricCream);
  cuff.rotation.x = Math.PI / 2;
  sock.add(cuff);
  return sock;
}

// Little painted scenes for the gallery wall: garden, library, server room.
function createPaintingTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const c = canvas.getContext('2d');

  if (scene === 'garden') {
    const sky = c.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, '#8fc7f2');
    sky.addColorStop(1, '#f6e3c5');
    c.fillStyle = sky;
    c.fillRect(0, 0, 256, 120);
    c.fillStyle = '#ffd86b';
    c.beginPath(); c.arc(200, 40, 22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5f9a4c';
    c.fillRect(0, 120, 256, 72);
    for (let i = 0; i < 14; i++) {
      const x = 12 + i * 18, y = 135 + (i % 3) * 16;
      c.strokeStyle = '#3f6f33'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y + 22); c.lineTo(x, y); c.stroke();
      c.fillStyle = ['#f4a261', '#e76f51', '#f2cc8f', '#e9a3ab'][i % 4];
      c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
    }
  } else if (scene === 'library') {
    c.fillStyle = '#5a3b2a';
    c.fillRect(0, 0, 256, 192);
    for (let row = 0; row < 3; row++) {
      const y = 20 + row * 56;
      c.fillStyle = '#3d2718';
      c.fillRect(8, y + 44, 240, 6);
      for (let x = 12; x < 240; x += 0) {
        const w = 10 + Math.floor(Math.random() * 10);
        const h = 30 + Math.floor(Math.random() * 12);
        c.fillStyle = ['#c0504d', '#4f81bd', '#9bbb59', '#f2cc8f', '#8064a2', '#e07a5f'][Math.floor(Math.random() * 6)];
        c.fillRect(x, y + 44 - h, w - 2, h);
        x += w;
      }
    }
  } else {
    c.fillStyle = '#141a24';
    c.fillRect(0, 0, 256, 192);
    for (let rack = 0; rack < 3; rack++) {
      const x = 24 + rack * 76;
      c.fillStyle = '#2b3442';
      c.fillRect(x, 16, 60, 160);
      for (let u = 0; u < 9; u++) {
        const y = 24 + u * 17;
        c.fillStyle = '#1c2330';
        c.fillRect(x + 4, y, 52, 13);
        c.fillStyle = (u + rack) % 3 === 0 ? '#ff9f43' : '#4cd964';
        c.beginPath(); c.arc(x + 50, y + 6.5, 2.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#3fa7ff';
        c.beginPath(); c.arc(x + 42, y + 6.5, 2, 0, Math.PI * 2); c.fill();
      }
    }
    c.fillStyle = 'rgba(80,140,255,0.08)';
    c.fillRect(0, 0, 256, 192);
  }

  // Painterly vignette so it reads as a canvas, not a screenshot
  const v = c.createRadialGradient(128, 96, 60, 128, 96, 170);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(40,20,0,0.35)');
  c.fillStyle = v;
  c.fillRect(0, 0, 256, 192);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
