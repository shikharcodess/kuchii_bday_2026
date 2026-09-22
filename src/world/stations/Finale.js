import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createLantern, createStringLights, createBench } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';


/**
 * Station 7 — the Finale clearing.
 *
 * A round wooden dance floor under a flower arch, ringed with lanterns and
 * strung bulbs, sheltered by a half-circle of pines.
 * Features:
 * - Partner avatar (Shikhar) with full articulated body, arms, and dance poses.
 * - Coordinated hand-holding slow waltz with Kuchii.
 * - Audio playback of public/audio/dance.mp3.
 * - Dancing dog companion hopping and paw-tapping in joy.
 * - 3D extruded floating hearts and falling rose petals.
 * - Clean cinematic view without obstructive text headlines.
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

  // --- Pedestal table beside dance floor with celebratory Birthday Cake ---
  const tableGroup = new THREE.Group();
  tableGroup.position.set(3.2, 0.28, 2.5);
  group.add(tableGroup);

  // Wide stable pedestal base
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.04, 24), MAT.darkWood);
  tableBase.position.y = 0.02;
  tableBase.receiveShadow = true;
  tableGroup.add(tableBase);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.76, 16), MAT.darkWood);
  tableLeg.position.y = 0.40;
  tableLeg.castShadow = true;
  tableGroup.add(tableLeg);

  // Tabletop (diameter ~1.0m for cake + dessert plates + bouquet)
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 32), MAT.plank);
  tableTop.position.y = 0.80;
  tableTop.receiveShadow = true;
  tableTop.castShadow = true;
  tableGroup.add(tableTop);

  // Polished gold rim around table edge
  const tableTrim = new THREE.Mesh(new THREE.TorusGeometry(0.478, 0.007, 8, 32), MAT.gold);
  tableTrim.rotation.x = Math.PI / 2;
  tableTrim.position.y = 0.825;
  tableGroup.add(tableTrim);

  ctx.addCircle(x + 3.2, z + 2.5, 0.5);

  // --- Celebratory Birthday Cake ---
  const cakeData = buildCelebrationCake();
  cakeData.group.position.set(0, 0.825, 0);
  tableGroup.add(cakeData.group);

  // --- Tabletop Accents: Dessert Plates & Golden Cake Server ---
  const plateGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.012, 20);
  const plateMat = tinted(MAT.white, 0xfffcf7, { roughness: 0.3 });
  const plate1 = new THREE.Mesh(plateGeo, plateMat);
  plate1.position.set(-0.25, 0.831, 0.14);
  plate1.castShadow = true;
  plate1.receiveShadow = true;
  tableGroup.add(plate1);

  const plate2 = new THREE.Mesh(plateGeo, plateMat);
  plate2.position.set(-0.23, 0.831, -0.16);
  plate2.castShadow = true;
  plate2.receiveShadow = true;
  tableGroup.add(plate2);

  // Golden cake knife / server
  const knifeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.003, 0.12), MAT.gold);
  knifeBlade.position.set(-0.35, 0.832, 0.13);
  knifeBlade.rotation.y = 0.2;
  tableGroup.add(knifeBlade);

  // Rose petals scattered gracefully on the tabletop
  const tablePetalMat = tinted(MAT.rose, 0xff758f, { side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const tp = new THREE.Mesh(new THREE.CircleGeometry(0.022, 5), tablePetalMat);
    tp.rotation.x = -Math.PI / 2;
    const pAng = i * 1.05 + 0.3;
    const pRad = 0.32 + (i % 2) * 0.08;
    tp.position.set(Math.sin(pAng) * pRad, 0.827, Math.cos(pAng) * pRad);
    tableGroup.add(tp);
  }

  // Bouquet resting on the table when couple begins their dance
  const tableBouquet = createRoseBouquet();
  tableBouquet.rotation.set(Math.PI / 2, 0.2, 0.4);
  tableBouquet.position.set(0.24, 0.86, 0.12);
  tableBouquet.scale.set(0.85, 0.85, 0.85);
  tableBouquet.visible = false;
  tableGroup.add(tableBouquet);

  // --- Interactive Partner Character (Shikhar) ---
  const partnerGroup = new THREE.Group();
  partnerGroup.position.set(1.5, 0.28, floorRadius - 1.2);
  partnerGroup.rotation.y = Math.PI * 0.9;
  group.add(partnerGroup);

  // Procedural Partner Model (Well-tailored charcoal suit with articulated arms)
  const pSkinMat = tinted(MAT.fabricCream, 0xfce4d6);
  const pJacketMat = tinted(MAT.darkWood, 0x1e222d, { roughness: 0.8 });
  const pTrouserMat = tinted(MAT.darkWood, 0x161820, { roughness: 0.85 });
  const pShoeMat = tinted(MAT.darkWood, 0x0d0e12, { roughness: 0.45 });
  const pShirtMat = tinted(MAT.fabricCream, 0xf8f9fa);
  const pTieMat = tinted(MAT.rose, 0xa31e3d);
  const pEyeMat = tinted(MAT.darkWood, 0x221a14);

  // Legs & Shoes
  const pLegs = [];
  for (const side of [-0.14, 0.14]) {
    const hip = new THREE.Group();
    hip.position.set(side, 0.85, 0);
    partnerGroup.add(hip);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.82, 10), pTrouserMat);
    leg.position.y = -0.41;
    leg.castShadow = true;
    hip.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), pShoeMat);
    shoe.position.set(0, -0.81, 0.05);
    shoe.castShadow = true;
    hip.add(shoe);

    pLegs.push(hip);
  }

  // Torso
  const pTorso = new THREE.Group();
  pTorso.position.y = 0.9;
  partnerGroup.add(pTorso);

  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.26), pJacketMat);
  jacket.position.y = 0.29;
  jacket.castShadow = true;
  pTorso.add(jacket);

  // Collar & Tie
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.12, 12), pShirtMat);
  collar.position.y = 0.59;
  pTorso.add(collar);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.02), pTieMat);
  tie.position.set(0, 0.43, 0.135);
  pTorso.add(tie);

  // Head & Stylish Hair
  const pHead = new THREE.Group();
  pHead.position.y = 0.75;
  pTorso.add(pHead);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), pSkinMat);
  headMesh.castShadow = true;
  pHead.add(headMesh);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.158, 14, 12), tinted(MAT.darkWood, 0x141214));
  hair.scale.set(1.05, 0.92, 1.1);
  hair.position.set(0, 0.05, -0.02);
  pHead.add(hair);

  for (const es of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), pEyeMat);
    eye.position.set(es, 0.015, 0.138);
    pHead.add(eye);
  }

  // Left Arm (clasping Kuchii's right hand in dance hold)
  const pShoulderL = new THREE.Group();
  pShoulderL.position.set(-0.24, 0.52, 0);
  pTorso.add(pShoulderL);

  const pUpperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.24, 10), pJacketMat);
  pUpperArmL.position.y = -0.12;
  pUpperArmL.castShadow = true;
  pShoulderL.add(pUpperArmL);

  const pElbowL = new THREE.Group();
  pElbowL.position.y = -0.24;
  pShoulderL.add(pElbowL);

  const pForearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.22, 10), pJacketMat);
  pForearmL.position.y = -0.11;
  pForearmL.castShadow = true;
  pElbowL.add(pForearmL);

  const pHandL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), pSkinMat);
  pHandL.position.y = -0.22;
  pHandL.castShadow = true;
  pElbowL.add(pHandL);

  // Right Arm (resting gently on Kuchii's waist in dance hold)
  const pShoulderR = new THREE.Group();
  pShoulderR.position.set(0.24, 0.52, 0);
  pTorso.add(pShoulderR);

  const pUpperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.24, 10), pJacketMat);
  pUpperArmR.position.y = -0.12;
  pUpperArmR.castShadow = true;
  pShoulderR.add(pUpperArmR);

  const pElbowR = new THREE.Group();
  pElbowR.position.y = -0.24;
  pShoulderR.add(pElbowR);

  const pForearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.22, 10), pJacketMat);
  pForearmR.position.y = -0.11;
  pForearmR.castShadow = true;
  pElbowR.add(pForearmR);

  const pHandR = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), pSkinMat);
  pHandR.position.y = -0.22;
  pHandR.castShadow = true;
  pElbowR.add(pHandR);

  // Bouquet of fresh roses held by Shikhar
  const bouquet = createRoseBouquet();
  partnerGroup.add(bouquet);

  // Golden glowing link at clasped hands
  const handClaspGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 12),
    tinted(MAT.gold, 0xffeb99, { transparent: true, opacity: 0.85 })
  );
  handClaspGlow.visible = false;
  group.add(handClaspGlow);

  // Floating falling rose petals around the dance floor
  const fallingPetals = [];
  const petalMat = tinted(MAT.rose, 0xff758f, { side: THREE.DoubleSide });
  for (let i = 0; i < 24; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.08, 5), petalMat);
    p.position.set((rand() - 0.5) * 6, 1.8 + rand() * 3.5, (rand() - 0.5) * 6);
    group.add(p);
    fallingPetals.push({
      mesh: p,
      speed: 0.35 + rand() * 0.45,
      rotSpeed: 1.2 + rand() * 2.0,
      wobble: rand() * Math.PI * 2
    });
  }

  // Dance State Machine
  let isDancing = false;
  let activeCharacter = null;

  // Animation Loop
  ctx.registerAnimated((time, dt) => {
    // Falling petals drifting down softly
    fallingPetals.forEach((p) => {
      p.mesh.position.y -= p.speed * dt;
      p.mesh.rotation.x += p.rotSpeed * dt;
      p.mesh.rotation.y += p.rotSpeed * dt * 0.7;
      p.mesh.position.x += Math.sin(time * 1.5 + p.wobble) * dt * 0.25;
      if (p.mesh.position.y < 0.28) {
        p.mesh.position.y = 4.6 + Math.random() * 1.0;
        p.mesh.position.x = (Math.random() - 0.5) * 5.6;
        p.mesh.position.z = (Math.random() - 0.5) * 5.6;
      }
    });

    if (isDancing) {
      // Synchronized ballroom waltz revolution around the gazebo floor
      const danceAngle = time * 0.42;
      const radius = 0.38;
      const ox = Math.sin(danceAngle) * radius;
      const oz = Math.cos(danceAngle) * radius;
      const waltzBob = Math.abs(Math.sin(time * 2.4)) * 0.04;

      // Partner (Shikhar) at center + (ox, oz), facing center / Kuchii
      partnerGroup.position.set(ox, 0.28 + waltzBob, oz);
      partnerGroup.rotation.y = danceAngle + Math.PI;

      // Subtle footwork rise-and-fall
      const stepPhase = Math.sin(time * 2.4);
      pLegs[0].rotation.x = stepPhase * 0.18;
      pLegs[1].rotation.x = -stepPhase * 0.18;

      // Partner arm pose in dance hold:
      // Left arm raised clasping Kuchii's right hand
      pShoulderL.rotation.x = -0.75;
      pShoulderL.rotation.z = -0.35;
      pElbowL.rotation.x = -0.6;

      // Right arm wrapping gently around Kuchii's waist
      pShoulderR.rotation.x = -0.55;
      pShoulderR.rotation.z = 0.3;
      pElbowR.rotation.x = -0.85;

      // Bouquet rests gracefully on table next to cake while dancing
      bouquet.visible = false;
      tableBouquet.visible = true;

      // Character (Kuchii) follows synchronized slow waltz position facing Shikhar
      if (activeCharacter) {
        activeCharacter.dancePos = new THREE.Vector3(x - ox, 0.28 + waltzBob, z - oz);
        activeCharacter.danceYaw = danceAngle;
      }

      // Hand clasp glow positioned right between their raised hands
      handClaspGlow.visible = true;
      const handRelX = Math.cos(danceAngle) * 0.32;
      const handRelZ = -Math.sin(danceAngle) * 0.32;
      handClaspGlow.position.set(handRelX, 1.15 + waltzBob, handRelZ);
      handClaspGlow.scale.setScalar(0.9 + Math.sin(time * 5) * 0.18);
    } else {
      // Idle waiting pose by entrance
      partnerGroup.position.set(1.5, 0.28 + Math.sin(time * 2.0) * 0.02, floorRadius - 1.2);
      partnerGroup.rotation.y = Math.PI * 0.9;
      pLegs[0].rotation.x = 0;
      pLegs[1].rotation.x = 0;

      // Holding bouquet gently in front of chest
      pShoulderR.rotation.x = -0.75;
      pShoulderR.rotation.z = 0.22;
      pElbowR.rotation.x = -0.7;

      pShoulderL.rotation.x = -0.75;
      pShoulderL.rotation.z = -0.22;
      pElbowL.rotation.x = -0.7;

      bouquet.visible = true;
      tableBouquet.visible = false;
      bouquet.position.set(0, 1.24, 0.26);
      bouquet.rotation.set(-0.2, 0, 0);
      handClaspGlow.visible = false;
    }

    // Gentle flickering of birthday candle flames & warm light
    if (cakeData) {
      const flicker = 1 + Math.sin(time * 16) * 0.08 + Math.cos(time * 24) * 0.05;
      cakeData.candleFlames.forEach((flame, idx) => {
        flame.scale.set(flicker, flicker * (1 + Math.sin(time * 14 + idx) * 0.07), flicker);
      });
      if (cakeData.candleLight) {
        cakeData.candleLight.intensity = 0.85 + Math.sin(time * 15) * 0.12;
      }
    }
  });

  const exitNote = document.getElementById('dance-exit-hint');
  if (exitNote) {
    exitNote.addEventListener('click', () => {
      if (isDancing && activeCharacter) {
        ctx.interactions.deactivate(activeCharacter);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && isDancing && activeCharacter) {
      ctx.interactions.deactivate(activeCharacter);
    }
  });

  // --- Grand Finale Interaction ---
  ctx.interactions.register({
    id: 'finale_dance',
    x: x,
    z: z + (floorRadius - 1.2),
    radius: 4.8,
    label: "Take Shikhar's hand & dance under the stars ✨",
    activeLabel: null, // Hide prompt from blocking view of dancing couple
    onEnter: (character) => {
      isDancing = true;
      activeCharacter = character;

      // Show "[Esc] Press Esc to exit the dance" note
      if (exitNote) {
        exitNote.classList.remove('hidden');
      }

      // Play public/audio/dance.mp3
      if (ctx.audio) {
        ctx.audio.playDanceMusic();
      }

      // Dog starts happy celebration dance
      if (ctx.dog) {
        ctx.dog.setDancing(true, { x: x, z: z });
      }

      // Character initiates synchronized dance
      if (character) {
        character.startDancing({ x: x, y: 0.28, z: z + 0.38 }, 0);
      }

      // Romantic 360 camera orbit
      if (ctx.camera) {
        ctx.camera.beginOrbit({
          x: x,
          z: z,
          radius: 8.2,
          height: 3.4,
          lookHeight: 1.35,
          speed: 0.18
        });
      }

      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'finale_dance' } }));
    },
    onExit: (character) => {
      isDancing = false;

      // Hide exit note
      if (exitNote) {
        exitNote.classList.add('hidden');
      }

      if (activeCharacter) {
        activeCharacter.stopDancing();
        activeCharacter = null;
      } else if (character) {
        character.stopDancing();
      }

      if (ctx.dog) {
        ctx.dog.setDancing(false);
      }

      if (ctx.audio) {
        ctx.audio.stopDanceMusic();
      }

      if (ctx.camera) {
        ctx.camera.endOrbit();
      }

      handClaspGlow.visible = false;
      ctx.messagePanel?.hide();
      bouquet.visible = true;
      tableBouquet.visible = false;
    }
  });

  return group;
}

/**
 * Creates a fresh wrapped rose bouquet with ribbon detailing.
 */
function createRoseBouquet() {
  const bouquet = new THREE.Group();
  const wrap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 12), MAT.fabricPink);
  wrap.rotation.x = Math.PI;
  wrap.castShadow = true;
  bouquet.add(wrap);

  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 16), MAT.gold);
  bow.rotation.x = Math.PI / 2;
  bow.position.y = -0.03;
  bouquet.add(bow);

  const roseColors = [0xe63946, 0xff758f, 0xffb703, 0xf72585];
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      tinted(MAT.rose, roseColors[i % roseColors.length])
    );
    r.position.set(
      Math.sin(i * 1.3) * 0.075,
      0.16 + (i % 3) * 0.025,
      Math.cos(i * 1.3) * 0.075
    );
    r.castShadow = true;
    bouquet.add(r);
  }
  return bouquet;
}

/**
 * Builds a tiered celebratory birthday cake for Kuchii, complete with
 * a gold-accented pedestal stand, piped frosting pearls, ruby strawberry glaze,
 * fresh strawberries, flickering candles with warm light, and a gold heart topper.
 */
function buildCelebrationCake() {
  const cake = new THREE.Group();

  const standMat = MAT.gold;
  const plateMat = tinted(MAT.white, 0xfffcf7, { roughness: 0.25, metalness: 0.08 });
  const tier1Mat = tinted(MAT.fabricPink, 0xf7b2bd, { roughness: 0.52 });
  const tier2Mat = tinted(MAT.fabricCream, 0xfffaf2, { roughness: 0.45 });
  const glazeMat = new THREE.MeshStandardMaterial({ color: 0xc9184a, roughness: 0.16, metalness: 0.12 });
  const berryMat = new THREE.MeshStandardMaterial({ color: 0xba181b, roughness: 0.35, metalness: 0.05 });
  const leafMat = tinted(MAT.leafDeep, 0x2d6a4f, { roughness: 0.8 });
  const creamPearlMat = tinted(MAT.fabricCream, 0xfffdfa, { roughness: 0.3 });
  const candleMat1 = tinted(MAT.rose, 0xff8fa3, { roughness: 0.5 });
  const candleMat2 = tinted(MAT.white, 0xfff8ee, { roughness: 0.4 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffe066,
    emissive: 0xff9900,
    emissiveIntensity: 2.8,
    roughness: 0.2
  });

  // 1. Ornate Cake Stand
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.025, 24), standMat);
  standBase.position.y = 0.0125;
  standBase.castShadow = true;
  standBase.receiveShadow = true;
  cake.add(standBase);

  const standStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.055, 16), standMat);
  standStem.position.y = 0.048;
  standStem.castShadow = true;
  cake.add(standStem);

  const standPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 32), plateMat);
  standPlate.position.y = 0.082;
  standPlate.castShadow = true;
  standPlate.receiveShadow = true;
  cake.add(standPlate);

  const standRim = new THREE.Mesh(new THREE.TorusGeometry(0.276, 0.008, 8, 32), standMat);
  standRim.rotation.x = Math.PI / 2;
  standRim.position.y = 0.091;
  cake.add(standRim);

  // 2. Base Tier (Velvet Strawberry Rose Cream)
  const tier1Height = 0.12;
  const tier1Radius = 0.23;
  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(tier1Radius, tier1Radius, tier1Height, 32),
    tier1Mat
  );
  tier1.position.y = 0.092 + tier1Height / 2;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  cake.add(tier1);

  // Piped frosting pearls circling base
  const pearlCount1 = 22;
  for (let i = 0; i < pearlCount1; i++) {
    const angle = (i / pearlCount1) * Math.PI * 2;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), creamPearlMat);
    pearl.position.set(
      Math.sin(angle) * (tier1Radius + 0.003),
      0.098,
      Math.cos(angle) * (tier1Radius + 0.003)
    );
    cake.add(pearl);
  }

  // Tier 1 intermediate drip/glaze ribbon
  const dripPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(tier1Radius + 0.003, tier1Radius + 0.003, 0.014, 32),
    glazeMat
  );
  dripPlate.position.y = 0.092 + tier1Height - 0.005;
  cake.add(dripPlate);

  // 3. Top Tier (Silky French Vanilla Cream)
  const tier2Height = 0.10;
  const tier2Radius = 0.15;
  const tier2 = new THREE.Mesh(
    new THREE.CylinderGeometry(tier2Radius, tier2Radius, tier2Height, 32),
    tier2Mat
  );
  tier2.position.y = 0.092 + tier1Height + tier2Height / 2;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  cake.add(tier2);

  // Pearl border at base of Tier 2
  const pearlCount2 = 16;
  for (let i = 0; i < pearlCount2; i++) {
    const angle = (i / pearlCount2) * Math.PI * 2;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), creamPearlMat);
    pearl.position.set(
      Math.sin(angle) * (tier2Radius + 0.003),
      0.092 + tier1Height + 0.005,
      Math.cos(angle) * (tier2Radius + 0.003)
    );
    cake.add(pearl);
  }

  // Top glaze crown
  const topGlaze = new THREE.Mesh(
    new THREE.CylinderGeometry(tier2Radius + 0.002, tier2Radius + 0.002, 0.016, 32),
    glazeMat
  );
  topGlaze.position.y = 0.092 + tier1Height + tier2Height;
  cake.add(topGlaze);

  // Glaze drips along top tier sides
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.18;
    const dripLen = 0.02 + (i % 3) * 0.014;
    const drip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.003, dripLen, 8),
      glazeMat
    );
    drip.position.set(
      Math.sin(angle) * (tier2Radius + 0.004),
      0.092 + tier1Height + tier2Height - dripLen / 2,
      Math.cos(angle) * (tier2Radius + 0.004)
    );
    cake.add(drip);
  }

  // 4. Fresh Strawberries
  const strawberryPositions = [
    // Top tier crown
    { rad: 0.095, angle: 0, y: 0.092 + tier1Height + tier2Height + 0.016 },
    { rad: 0.095, angle: (Math.PI * 2) / 5, y: 0.092 + tier1Height + tier2Height + 0.016 },
    { rad: 0.095, angle: (Math.PI * 2 * 2) / 5, y: 0.092 + tier1Height + tier2Height + 0.016 },
    { rad: 0.095, angle: (Math.PI * 2 * 3) / 5, y: 0.092 + tier1Height + tier2Height + 0.016 },
    { rad: 0.095, angle: (Math.PI * 2 * 4) / 5, y: 0.092 + tier1Height + tier2Height + 0.016 },
    // Base tier shoulder strawberries
    { rad: 0.19, angle: 0.8, y: 0.092 + tier1Height + 0.012 },
    { rad: 0.19, angle: 2.8, y: 0.092 + tier1Height + 0.012 },
    { rad: 0.19, angle: 4.8, y: 0.092 + tier1Height + 0.012 }
  ];

  strawberryPositions.forEach((pos) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(
      Math.sin(pos.angle) * pos.rad,
      pos.y,
      Math.cos(pos.angle) * pos.rad
    );

    const berry = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.038, 8), berryMat);
    berry.rotation.x = Math.PI;
    berry.position.y = 0.012;
    sGroup.add(berry);

    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.014, 5), leafMat);
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.y = 0.024;
    sGroup.add(leaf);

    cake.add(sGroup);
  });

  // Edible gold sugar pearls
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.4;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), MAT.gold);
    pearl.position.set(
      Math.sin(angle) * 0.055,
      0.092 + tier1Height + tier2Height + 0.01,
      Math.cos(angle) * 0.055
    );
    cake.add(pearl);
  }

  // 5. Birthday Candles & Flames
  const candleFlames = [];
  const candleBaseY = 0.092 + tier1Height + tier2Height + 0.008;
  const candleData = [
    { x: 0, z: 0, h: 0.09, mat: standMat },
    { x: -0.045, z: 0.025, h: 0.075, mat: candleMat1 },
    { x: 0.045, z: -0.025, h: 0.075, mat: candleMat2 }
  ];

  candleData.forEach((cd) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cd.x, candleBaseY, cd.z);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, cd.h, 10), cd.mat);
    stick.position.y = cd.h / 2;
    stick.castShadow = true;
    cGroup.add(stick);

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 6), MAT.darkWood);
    wick.position.y = cd.h + 0.006;
    cGroup.add(wick);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.028, 8), flameMat);
    flame.position.y = cd.h + 0.02;
    cGroup.add(flame);
    candleFlames.push(flame);

    cake.add(cGroup);
  });

  // Candle warm candlelight
  const candleLight = new THREE.PointLight(0xffaa55, 0.85, 2.2);
  candleLight.position.set(0, candleBaseY + 0.12, 0);
  cake.add(candleLight);

  // 6. Golden Heart Cake Topper
  const topperGroup = new THREE.Group();
  topperGroup.position.set(0, candleBaseY, -0.05);

  const topperStick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.11, 8), MAT.gold);
  topperStick.position.y = 0.055;
  topperGroup.add(topperStick);

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(0, 0.02, -0.03, 0.04, -0.03, 0.065);
  heartShape.bezierCurveTo(-0.03, 0.085, -0.015, 0.095, 0, 0.075);
  heartShape.bezierCurveTo(0.015, 0.095, 0.03, 0.085, 0.03, 0.065);
  heartShape.bezierCurveTo(0.03, 0.04, 0, 0.02, 0, 0);

  const extrudeSettings = {
    depth: 0.008,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003
  };
  const heartMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, extrudeSettings), MAT.gold);
  heartMesh.position.set(0, 0.11, -0.004);
  heartMesh.scale.set(0.65, 0.65, 0.65);
  topperGroup.add(heartMesh);

  cake.add(topperGroup);

  return { group: cake, candleFlames, candleLight };
}
