import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONTENT } from '../config/content.js';
import { dampAngle, damp, clamp } from '../utils/MathUtils.js';

/**
 * Character Entity.
 * 
 * Supports:
 * 1. Automatic loading of custom GLTF / GLB model if placed in `public/models/character.glb`
 *    (e.g., exported from Ready Player Me or Mixamo).
 * 2. Cute, polished stylized character with smooth animations (no T-pose, no leg clipping).
 * 3. Responsive WASD walking + Shift sprinting + Space jumping.
 * 4. Automatic indoor detection for cozy house interior camera framing.
 */
export class Character {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = this.group.position;

    this.yaw = Math.PI;
    this.speed = 0;
    this.radius = 0.38;
    this.walkPhase = 0;
    this.moveAmount = 0;

    // Vertical state (jumping)
    this.verticalVelocity = 0;
    this.height = 0;
    this.isGrounded = true;
    this.landingSquash = 0;

    // Seated state
    this.seat = null;
    this.sitBlend = 0;

    // Indoor state (triggers cozy indoor camera zoom)
    this.isIndoor = false;

    // Custom GLB support
    this.isCustomModel = false;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    this._direction = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    this._buildProceduralModel();
    this._tryLoadCustomModel();

    this.group.rotation.y = this.yaw;
    scene.add(this.group);
  }

  // ---------------------------------------------------------------- GLB Loader

  _tryLoadCustomModel() {
    const loader = new GLTFLoader();
    const candidatePaths = ['/models/character.glb', '/character.glb'];

    const tryNext = (index) => {
      if (index >= candidatePaths.length) return;
      const path = candidatePaths[index];

      loader.load(
        path,
        (gltf) => {
          console.log(`Successfully loaded custom 3D character from ${path}`);
          this.isCustomModel = true;

          // Hide procedural mesh
          if (this.proceduralGroup) {
            this.proceduralGroup.visible = false;
          }

          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Compute bounding box and normalize scale to ~1.7m height
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const targetHeight = 1.75;
          const scale = size.y > 0 ? targetHeight / size.y : 1;
          model.scale.setScalar(scale);

          // Center horizontally
          model.position.y = 0;
          this.group.add(model);
          this.customModel = model;

          // Setup animations if present
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const name = clip.name.toLowerCase();
              this.actions[name] = this.mixer.clipAction(clip);
            });

            // Find idle / walk / run
            const idleClip = Object.keys(this.actions).find((k) => k.includes('idle')) || Object.keys(this.actions)[0];
            if (idleClip) {
              this.currentAction = this.actions[idleClip];
              this.currentAction.play();
            }
          }
        },
        undefined,
        () => {
          tryNext(index + 1);
        }
      );
    };

    tryNext(0);
  }

  // ---------------------------------------------------- Procedural Cute Avatar

  _buildProceduralModel() {
    const group = new THREE.Group();
    this.proceduralGroup = group;
    this.group.add(group);

    const M = this._materials();
    this.mat = M;

    const body = new THREE.Group();
    this.body = body;
    group.add(body);

    // Root pelvis
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    this.pelvis = pelvis;
    body.add(pelvis);

    this._buildLegs(M);
    this._buildTorso(M);
    this._buildArms(M);
    this._buildHead(M);
  }

  _materials() {
    return {
      skin: new THREE.MeshStandardMaterial({
        color: 0xf6cfba,
        roughness: 0.55,
        metalness: 0.0
      }),
      blush: new THREE.MeshStandardMaterial({
        color: 0xf59ca7,
        roughness: 0.6,
        metalness: 0.0,
        transparent: true,
        opacity: 0.55
      }),
      dress: new THREE.MeshStandardMaterial({
        color: 0xd67b8f, // Cute dusty rose
        roughness: 0.75,
        metalness: 0.05
      }),
      top: new THREE.MeshStandardMaterial({
        color: 0xfff3e8, // Cream puff top
        roughness: 0.8,
        metalness: 0.0
      }),
      hair: new THREE.MeshStandardMaterial({
        color: 0x221718, // Deep soft brunette
        roughness: 0.35,
        metalness: 0.1
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xf4c466,
        roughness: 0.22,
        metalness: 0.85
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: 0x4a322c,
        roughness: 0.45,
        metalness: 0.1
      }),
      eye: new THREE.MeshStandardMaterial({
        color: 0x2b1c18,
        roughness: 0.2,
        metalness: 0.0
      }),
      lip: new THREE.MeshStandardMaterial({
        color: 0xdf6f78,
        roughness: 0.4,
        metalness: 0.0
      })
    };
  }

  _buildLegs(M) {
    this.hips = [];
    this.knees = [];

    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.11, -0.05, 0);
      this.pelvis.add(hip);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 12), M.skin);
      thigh.position.y = -0.17;
      thigh.castShadow = true;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.34;
      hip.add(knee);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.36, 12), M.skin);
      shin.position.y = -0.18;
      shin.castShadow = true;
      knee.add(shin);

      // Cute mary-jane shoes
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.2), M.shoe);
      foot.position.set(0, -0.38, 0.04);
      foot.castShadow = true;
      knee.add(foot);

      // Delicate golden payal (anklet) on right leg
      if (side === 1) {
        const payal = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.008, 8, 16), M.gold);
        payal.rotation.x = Math.PI / 2;
        payal.position.set(0, -0.33, 0);
        knee.add(payal);
      }

      this.hips.push(hip);
      this.knees.push(knee);
    }
  }

  _buildTorso(M) {
    // Cute flared A-line midi dress
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.44, 0.58, 18, 1, true),
      M.dress
    );
    skirt.position.y = -0.26;
    skirt.castShadow = true;
    this.skirt = skirt;
    this.pelvis.add(skirt);

    // Waist ribbon
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.07, 18), M.gold);
    belt.position.y = 0.02;
    this.pelvis.add(belt);

    // Torso / chest
    const chest = new THREE.Group();
    chest.position.y = 0.18;
    this.pelvis.add(chest);
    this.chest = chest;

    const blouse = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.32, 14), M.top);
    blouse.position.y = 0.14;
    blouse.castShadow = true;
    chest.add(blouse);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.14, 12), M.skin);
    neck.position.y = 0.34;
    neck.castShadow = true;
    chest.add(neck);
  }

  _buildArms(M) {
    this.shoulders = [];
    this.elbows = [];

    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.24, 0.26, 0);
      this.chest.add(shoulder);

      // Cute puff sleeve
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), M.top);
      puff.scale.set(1.1, 1.2, 1.1);
      shoulder.add(puff);

      // Upper arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.24, 10), M.skin);
      upperArm.position.y = -0.13;
      upperArm.castShadow = true;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = -0.25;
      shoulder.add(elbow);

      // Forearm
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.22, 10), M.skin);
      forearm.position.y = -0.11;
      forearm.castShadow = true;
      elbow.add(forearm);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), M.skin);
      hand.position.y = -0.23;
      hand.castShadow = true;
      elbow.add(hand);

      // Initial natural hanging resting pose (NOT T-pose!)
      shoulder.rotation.z = side * -0.15;
      shoulder.rotation.x = 0.05;
      elbow.rotation.x = -0.15;

      this.shoulders.push(shoulder);
      this.elbows.push(elbow);
    }
  }

  _buildHead(M) {
    const head = new THREE.Group();
    head.position.set(0, 0.54, 0.02);
    this.chest.add(head);
    this.head = head;

    // Face
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 18), M.skin);
    face.scale.set(1, 1.12, 1.05);
    face.castShadow = true;
    head.add(face);

    // Warm expressive eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.eye);
      eye.position.set(side * 0.065, 0.02, 0.165);
      head.add(eye);

      // Soft blushing cheeks
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), M.blush);
      blush.position.set(side * 0.09, -0.04, 0.162);
      blush.rotation.y = side * 0.45;
      head.add(blush);

      // Small gold earrings
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), M.gold);
      earring.position.set(side * 0.185, 0.01, -0.02);
      head.add(earring);
    }

    // Gentle smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 6, 12, Math.PI), M.lip);
    smile.rotation.x = Math.PI * 0.9;
    smile.position.set(0, -0.07, 0.17);
    head.add(smile);

    // Hair: lovely layered dark hair
    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), M.hair);
    hairCrown.scale.set(1.06, 1.15, 1.15);
    hairCrown.position.set(0, 0.05, -0.04);
    hairCrown.castShadow = true;
    head.add(hairCrown);

    // Hair strands flowing down the back and sides
    for (const side of [-1, 1]) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.38, 6, 10), M.hair);
      strand.position.set(side * 0.11, -0.15, -0.08);
      strand.rotation.z = side * 0.08;
      strand.castShadow = true;
      head.add(strand);
    }

    // Cute sunflower hairclip
    const clip = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), M.gold);
    clip.position.set(0.16, 0.14, 0.1);
    head.add(clip);
  }

  // ---------------------------------------------------------------- Movement

  update(dt, input, cameraYaw, world) {
    if (this.seat) {
      this._updateSeated(dt);
      return;
    }

    this.sitBlend = damp(this.sitBlend, 0, 9, dt);

    // Camera-relative basis
    this._forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    this._right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    this._direction
      .set(0, 0, 0)
      .addScaledVector(this._forward, -input.move.z)
      .addScaledVector(this._right, input.move.x);

    const moving = this._direction.lengthSq() > 0.0001;
    const isSprinting = input.isSprinting && moving;

    const targetSpeed = isSprinting ? CONTENT.world.sprintSpeed : CONTENT.world.walkSpeed;

    if (moving) {
      this._direction.normalize();
      this.speed = targetSpeed * (this.isGrounded ? 1 : 0.85);

      const targetYaw = Math.atan2(this._direction.x, this._direction.z);
      this.yaw = dampAngle(this.yaw, targetYaw, CONTENT.world.turnSpeed, dt);

      this.position.x += this._direction.x * this.speed * dt;
      this.position.z += this._direction.z * this.speed * dt;

      if (world) world.constrain(this.position, this.radius);
    } else {
      this.speed = 0;
    }

    this._updateJump(dt, input);

    this.group.rotation.y = this.yaw;
    this.position.y = this.height;

    // Check indoor boundary (House is around x: -14 to -6, z: -10 to 2)
    this.isIndoor = (this.position.x > -15.5 && this.position.x < -5.5 &&
                     this.position.z > -10.5 && this.position.z < 2.0);

    const targetBlend = moving && this.isGrounded ? (isSprinting ? 1.4 : 1.0) : 0;
    this.moveAmount += (targetBlend - this.moveAmount) * Math.min(1, dt * 11);

    if (this.mixer) {
      this.mixer.update(dt);
    } else {
      this._animate(dt);
    }
  }

  _updateJump(dt, input) {
    const jump = CONTENT.world.jump;

    if (input.consumeJump() && this.isGrounded) {
      this.verticalVelocity = jump.velocity;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= jump.gravity * dt;
      this.height += this.verticalVelocity * dt;

      if (this.height <= 0) {
        this.landingSquash = clamp(-this.verticalVelocity / jump.velocity, 0, 1) * 0.14;
        this.height = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    this.landingSquash = damp(this.landingSquash, 0, 11, dt);
  }

  sitOn(seat) {
    this.seat = seat;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.height = seat.y ?? 0;
    this.moveAmount = 0;
    this.speed = 0;
  }

  standUp() {
    if (!this.seat) return;
    const seat = this.seat;
    this.position.x = seat.x + Math.sin(seat.yaw) * 0.85;
    this.position.z = seat.z + Math.cos(seat.yaw) * 0.85;
    this.height = 0;
    this.seat = null;
  }

  get isSeated() {
    return this.seat !== null;
  }

  _updateSeated(dt) {
    const seat = this.seat;
    this.position.x = damp(this.position.x, seat.x, 8, dt);
    this.position.z = damp(this.position.z, seat.z, 8, dt);
    this.position.y = damp(this.position.y, seat.y ?? 0, 8, dt);
    this.yaw = dampAngle(this.yaw, seat.yaw, 6, dt);
    this.group.rotation.y = this.yaw;

    this.sitBlend = damp(this.sitBlend, 1, 6, dt);
    this.moveAmount = damp(this.moveAmount, 0, 10, dt);
    this._animate(dt);
  }

  _animate(dt) {
    const walk = this.moveAmount;
    const sit = this.sitBlend;

    this.walkPhase += dt * (5.5 + this.speed * 0.6) * walk;
    const cycle = Math.sin(this.walkPhase);
    const cycleOff = Math.sin(this.walkPhase + Math.PI);

    // Legs swing
    const legSwing = 0.52 * walk;
    this.hips[0].rotation.x = cycle * legSwing;
    this.hips[1].rotation.x = cycleOff * legSwing;
    this.knees[0].rotation.x = -Math.max(0, -cycle) * 0.7 * walk;
    this.knees[1].rotation.x = -Math.max(0, -cycleOff) * 0.7 * walk;

    // Natural arm counter-swing
    const armSwing = 0.48 * walk;
    this.shoulders[0].rotation.x = 0.05 + cycleOff * armSwing;
    this.shoulders[1].rotation.x = 0.05 + cycle * armSwing;
    this.shoulders[0].rotation.z = -0.15 - Math.abs(cycleOff) * 0.08 * walk;
    this.shoulders[1].rotation.z = 0.15 + Math.abs(cycle) * 0.08 * walk;
    this.elbows[0].rotation.x = -0.15 - Math.max(0, cycleOff) * 0.3 * walk;
    this.elbows[1].rotation.x = -0.15 - Math.max(0, cycle) * 0.3 * walk;

    // Seated pose
    if (sit > 0.01) {
      for (let i = 0; i < 2; i++) {
        this.hips[i].rotation.x = THREE.MathUtils.lerp(this.hips[i].rotation.x, -1.4, sit);
        this.knees[i].rotation.x = THREE.MathUtils.lerp(this.knees[i].rotation.x, -1.35, sit);
        this.shoulders[i].rotation.x = THREE.MathUtils.lerp(this.shoulders[i].rotation.x, -0.3, sit);
        this.elbows[i].rotation.x = THREE.MathUtils.lerp(this.elbows[i].rotation.x, -0.9, sit);
      }
    }

    // Gentle breathing & walking bob
    const now = performance.now() * 0.001;
    const bob = Math.abs(Math.cos(this.walkPhase)) * 0.04 * walk;
    const breathe = Math.sin(now * 2.2) * 0.01 * (1 - walk);

    this.pelvis.position.y = 0.95 + bob + breathe - this.landingSquash - sit * 0.42;
    this.head.rotation.y = cycle * 0.05 * walk + Math.sin(now * 0.8) * 0.03 * (1 - walk);
  }
}
