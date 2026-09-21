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

  // --- Pedestal table beside dance floor for holding bouquet during dance ---
  const tableGroup = new THREE.Group();
  tableGroup.position.set(3.2, 0.28, 2.5);
  group.add(tableGroup);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.78, 12), MAT.darkWood);
  tableLeg.position.y = 0.39;
  tableGroup.add(tableLeg);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24), MAT.plank);
  tableTop.position.y = 0.8;
  tableGroup.add(tableTop);

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

  // Bouquet of fresh roses
  const bouquet = new THREE.Group();
  partnerGroup.add(bouquet);

  const wrap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 8), MAT.fabricPink);
  wrap.rotation.x = Math.PI;
  bouquet.add(wrap);

  const roseColors = [0xe63946, 0xff758f, 0xffb703, 0xf72585];
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      tinted(MAT.rose, roseColors[i % roseColors.length])
    );
    r.position.set(
      (Math.random() - 0.5) * 0.18,
      0.18 + Math.random() * 0.08,
      (Math.random() - 0.5) * 0.18
    );
    bouquet.add(r);
  }

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

      // Bouquet resting on table while dancing
      bouquet.position.set(3.2 - ox, 0.95, 2.5 - oz);
      bouquet.rotation.set(0, time * 0.3, 0);

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

      bouquet.position.set(0, 1.24, 0.26);
      bouquet.rotation.set(-0.2, 0, 0);
      handClaspGlow.visible = false;
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
    }
  });

  return group;
}
