import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { dampAngle } from '../utils/MathUtils.js';

/**
 * The player character.
 *
 * Built from capsules and spheres (per the brief: readable through lighting and
 * materials rather than sculpted geometry) and animated procedurally — a simple
 * sine-driven walk cycle for the limbs plus a soft breathing idle.
 *
 * The model is authored facing +Z so `group.rotation.y = atan2(dir.x, dir.z)`
 * points her straight down her direction of travel.
 */
export class Character {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = this.group.position;
    this.yaw = Math.PI; // start facing down the path (-Z)
    this.speed = 0;
    this.radius = 0.45;
    this.walkPhase = 0;
    this.moveAmount = 0; // 0..1 blend between idle and walk poses

    this._direction = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    this._build();
    this.group.rotation.y = this.yaw;
    scene.add(this.group);
  }

  _build() {
    const skin = new THREE.MeshStandardMaterial({
      color: 0xe8b48f,
      roughness: 0.72,
      metalness: 0.0
    });
    const dressFabric = new THREE.MeshStandardMaterial({
      color: 0xe9a3ab, // soft rose midi dress
      roughness: 0.82,
      metalness: 0.02
    });
    const turtleneck = new THREE.MeshStandardMaterial({
      color: 0xf6e2d3,
      roughness: 0.9,
      metalness: 0.0
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x2c1c18,
      roughness: 0.55,
      metalness: 0.08
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xe8c169,
      roughness: 0.28,
      metalness: 0.85
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x4a3b39,
      roughness: 0.6,
      metalness: 0.1
    });

    const body = new THREE.Group();
    this.body = body;
    this.group.add(body);

    // --- Legs (pivoted at the hips so they can swing) ---
    this.legs = [];
    const legGeo = new THREE.CapsuleGeometry(0.1, 0.44, 6, 12);
    const shoeGeo = new THREE.BoxGeometry(0.16, 0.09, 0.3);
    const anklet = new THREE.TorusGeometry(0.105, 0.016, 8, 16);

    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.14, 0.78, 0);

      const leg = new THREE.Mesh(legGeo, skin);
      leg.position.y = -0.3;
      leg.castShadow = true;
      pivot.add(leg);

      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      shoe.position.set(0, -0.6, 0.06);
      shoe.castShadow = true;
      pivot.add(shoe);

      // A delicate payal on one ankle — one of her small favourite things.
      if (side === 1) {
        const payal = new THREE.Mesh(anklet, gold);
        payal.rotation.x = Math.PI / 2;
        payal.position.y = -0.52;
        pivot.add(payal);
      }

      body.add(pivot);
      this.legs.push(pivot);
    }

    // --- Skirt / dress ---
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.44, 0.66, 20, 1, true),
      dressFabric
    );
    skirt.material.side = THREE.DoubleSide;
    skirt.position.y = 1.06;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    body.add(skirt);
    this.skirt = skirt;

    // --- Torso (turtleneck top) ---
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.3, 6, 14), turtleneck);
    torso.position.y = 1.5;
    torso.castShadow = true;
    body.add(torso);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.13, 0.14, 14),
      turtleneck
    );
    collar.position.y = 1.78;
    collar.castShadow = true;
    body.add(collar);

    // --- Arms ---
    this.arms = [];
    const armGeo = new THREE.CapsuleGeometry(0.07, 0.4, 6, 12);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.26, 1.66, 0);

      const arm = new THREE.Mesh(armGeo, turtleneck);
      arm.position.y = -0.26;
      arm.castShadow = true;
      pivot.add(arm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), skin);
      hand.position.y = -0.5;
      hand.castShadow = true;
      pivot.add(hand);

      pivot.rotation.z = side * 0.08;
      body.add(pivot);
      this.arms.push(pivot);
    }

    // --- Head ---
    const head = new THREE.Group();
    head.position.y = 1.94;
    this.head = head;
    body.add(head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 18), skin);
    skull.castShadow = true;
    head.add(skull);

    // Hair is an open-backed sphere so her face is never swallowed by it:
    // the gap sits over +Z, which is the direction the model faces.
    const faceGap = 0.62;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.202,
        24,
        18,
        Math.PI / 2 + faceGap,
        Math.PI * 2 - faceGap * 2
      ),
      hairMat
    );
    hair.material.side = THREE.DoubleSide;
    hair.scale.set(1, 1.03, 1);
    hair.position.y = 0.015;
    hair.castShadow = true;
    head.add(hair);

    // A soft fringe across the forehead
    const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), hairMat);
    fringe.scale.set(1.02, 0.55, 1.02);
    fringe.position.set(0, 0.1, 0.01);
    fringe.castShadow = true;
    head.add(fringe);

    // Long hair falling behind the shoulders
    const ponytail = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 6, 12), hairMat);
    ponytail.position.set(0, -0.16, -0.14);
    ponytail.rotation.x = -0.18;
    ponytail.castShadow = true;
    head.add(ponytail);

    // Eyes, so it's obvious which way she is looking
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x2a1d1a,
      roughness: 0.35,
      metalness: 0.05
    });
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), eyeMat);
      eye.position.set(side * 0.068, 0.005, 0.168);
      head.add(eye);
    }

    // Tiny earrings
    for (const side of [-1, 1]) {
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), gold);
      earring.position.set(side * 0.175, -0.06, 0.01);
      head.add(earring);
    }
  }

  /**
   * @param {number} dt delta time in seconds
   * @param {InputManager} input
   * @param {number} cameraYaw camera orbit angle, so movement is camera-relative
   * @param {World} world provides boundary + prop collision
   */
  update(dt, input, cameraYaw, world) {
    // Camera-relative basis: W walks away from the camera, D walks screen-right.
    this._forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    this._right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    this._direction
      .set(0, 0, 0)
      .addScaledVector(this._forward, -input.move.z)
      .addScaledVector(this._right, input.move.x);

    const moving = this._direction.lengthSq() > 0.0001;
    if (moving) {
      this._direction.normalize();
      this.speed = CONTENT.world.walkSpeed;

      const targetYaw = Math.atan2(this._direction.x, this._direction.z);
      this.yaw = dampAngle(this.yaw, targetYaw, CONTENT.world.turnSpeed, dt);

      this.position.x += this._direction.x * this.speed * dt;
      this.position.z += this._direction.z * this.speed * dt;

      if (world) world.constrain(this.position, this.radius);
    } else {
      this.speed = 0;
    }

    this.group.rotation.y = this.yaw;

    // Blend between the idle and walk poses so starts/stops aren't snappy.
    const targetBlend = moving ? 1 : 0;
    this.moveAmount += (targetBlend - this.moveAmount) * Math.min(1, dt * 9);

    this._animate(dt);
  }

  _animate(dt) {
    const swing = this.moveAmount;
    this.walkPhase += dt * (4.6 + this.speed * 0.6) * swing;

    const cycle = Math.sin(this.walkPhase);
    const legSwing = cycle * 0.62 * swing;

    this.legs[0].rotation.x = legSwing;
    this.legs[1].rotation.x = -legSwing;

    this.arms[0].rotation.x = -legSwing * 0.72;
    this.arms[1].rotation.x = legSwing * 0.72;

    // Body bob on each footfall, plus a slow breathing rise when idle.
    const bob = Math.abs(Math.cos(this.walkPhase)) * 0.045 * swing;
    const breathe = Math.sin(performance.now() * 0.0016) * 0.012 * (1 - swing);
    this.body.position.y = bob + breathe;

    // Slight lean into the walk and a gentle skirt sway
    this.body.rotation.x = swing * 0.05;
    this.body.rotation.z = Math.sin(this.walkPhase) * 0.02 * swing;
    this.head.rotation.y = Math.sin(this.walkPhase * 0.5) * 0.08 * swing;
  }
}
