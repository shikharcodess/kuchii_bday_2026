import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { dampAngle, damp, clamp } from '../utils/MathUtils.js';
import { fabricTexture } from '../world/Textures.js';

/**
 * The player character.
 *
 * Built as a jointed figure rather than a stack of capsules: each limb has a
 * real hinge (hip -> knee -> ankle, shoulder -> elbow -> wrist), which is what
 * makes the walk cycle read as walking and makes a believable sitting pose
 * possible at all. Proportions are life-scaled — the world runs at roughly
 * 1.2 units per metre, so she stands 2.05 units, about 1.7m, at eight and a
 * half heads tall.
 *
 * The model faces +Z, so `group.rotation.y = atan2(dir.x, dir.z)` points her
 * along her direction of travel.
 */
export class Character {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = this.group.position;

    this.yaw = Math.PI;
    this.speed = 0;
    this.radius = 0.42;
    this.walkPhase = 0;
    this.moveAmount = 0;

    // Vertical state (jumping)
    this.verticalVelocity = 0;
    this.height = 0; // metres above the ground plane
    this.isGrounded = true;
    this.landingSquash = 0;

    // Seated state
    this.seat = null; // { position, yaw } while sitting
    this.sitBlend = 0;

    this._direction = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    this._build();
    this.group.rotation.y = this.yaw;
    scene.add(this.group);
  }

  // ---------------------------------------------------------------- building

  _build() {
    const M = this._materials();
    this.mat = M;

    const body = new THREE.Group();
    this.body = body;
    this.group.add(body);

    // Pelvis is the root of the whole figure
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.04;
    this.pelvis = pelvis;
    body.add(pelvis);

    this._buildLegs(M);
    this._buildTorso(M);
    this._buildArms(M);
    this._buildHead(M);
  }

  _materials() {
    const skin = new THREE.MeshStandardMaterial({
      color: 0xe0a882,
      roughness: 0.66,
      metalness: 0.0,
      envMapIntensity: 0.8
    });

    const dress = new THREE.MeshStandardMaterial({
      ...fabricTexture(0xbe8593, 4),
      bumpScale: 0.12,
      roughness: 0.88,
      metalness: 0.0,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide
    });

    const top = new THREE.MeshStandardMaterial({
      ...fabricTexture(0xf2e6d8, 5),
      bumpScale: 0.1,
      roughness: 0.92,
      metalness: 0.0,
      envMapIntensity: 0.7
    });

    return {
      skin,
      dress,
      top,
      hair: new THREE.MeshStandardMaterial({
        color: 0x241716,
        roughness: 0.42,
        metalness: 0.12,
        envMapIntensity: 1.1
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xdcb463,
        roughness: 0.26,
        metalness: 0.95,
        envMapIntensity: 1.4
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: 0x4a3a36,
        roughness: 0.5,
        metalness: 0.1,
        envMapIntensity: 0.9
      }),
      eyeWhite: new THREE.MeshStandardMaterial({
        color: 0xf4f1ec,
        roughness: 0.22,
        metalness: 0.0
      }),
      iris: new THREE.MeshStandardMaterial({
        color: 0x4a2c1c,
        roughness: 0.18,
        metalness: 0.0
      }),
      lip: new THREE.MeshStandardMaterial({
        color: 0xc4736f,
        roughness: 0.45,
        metalness: 0.0
      })
    };
  }

  _buildLegs(M) {
    this.hips = [];
    this.knees = [];

    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.13, 0, 0);
      this.pelvis.add(hip);

      // Thigh: wider at the hip, narrowing to the knee
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.3, 8, 16), M.skin);
      thigh.scale.set(1.08, 1, 1.02);
      thigh.position.y = -0.26;
      thigh.castShadow = true;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.52;
      hip.add(knee);

      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.3, 8, 16), M.skin);
      shin.position.y = -0.24;
      shin.castShadow = true;
      knee.add(shin);

      const ankle = new THREE.Group();
      ankle.position.y = -0.46;
      knee.add(ankle);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.075, 0.27), M.shoe);
      foot.position.set(0, -0.03, 0.05);
      foot.castShadow = true;
      ankle.add(foot);

      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), M.shoe);
      toe.scale.set(1, 0.55, 1.15);
      toe.position.set(0, -0.03, 0.16);
      toe.castShadow = true;
      ankle.add(toe);

      // A delicate payal on one ankle — one of her small favourite things
      if (side === 1) {
        const payal = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.011, 8, 20), M.gold);
        payal.rotation.x = Math.PI / 2;
        payal.position.y = 0.02;
        ankle.add(payal);
      }

      this.hips.push(hip);
      this.knees.push(knee);
    }
  }

  _buildTorso(M) {
    // Abdomen tapers into the waist
    const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 8, 18), M.top);
    abdomen.scale.set(1.12, 1, 0.86);
    abdomen.position.y = 0.13;
    abdomen.castShadow = true;
    this.pelvis.add(abdomen);

    const chest = new THREE.Group();
    chest.position.y = 0.3;
    this.chest = chest;
    this.pelvis.add(chest);

    const ribcage = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.2, 8, 18), M.top);
    ribcage.scale.set(1.15, 1, 0.82);
    ribcage.position.y = 0.1;
    ribcage.castShadow = true;
    chest.add(ribcage);

    // Shoulder line, so the arms don't sprout from the middle of the torso
    const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.31, 8, 16), M.top);
    shoulders.rotation.z = Math.PI / 2;
    shoulders.position.y = 0.24;
    shoulders.castShadow = true;
    chest.add(shoulders);

    // Turtleneck collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.093, 0.13, 16), M.top);
    collar.position.y = 0.34;
    collar.castShadow = true;
    chest.add(collar);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.066, 0.14, 14), M.skin);
    neck.position.y = 0.4;
    chest.add(neck);

    // --- Midi dress skirt, gathered at the waist ---
    const skirtGeo = new THREE.CylinderGeometry(0.185, 0.295, 0.8, 32, 6, true);
    rippleCloth(skirtGeo, 0.022, 13);
    const skirt = new THREE.Mesh(skirtGeo, M.dress);
    skirt.position.y = -0.33;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    this.pelvis.add(skirt);
    this.skirt = skirt;

    const waistband = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.19, 0.1, 24), M.dress);
    waistband.position.y = 0.03;
    waistband.castShadow = true;
    this.pelvis.add(waistband);

    // Bodice, so the dress and the turtleneck read as one outfit
    const bodice = new THREE.Mesh(new THREE.CapsuleGeometry(0.153, 0.14, 8, 18), M.dress);
    bodice.scale.set(1.12, 1, 0.88);
    bodice.position.y = 0.14;
    bodice.castShadow = true;
    this.pelvis.add(bodice);
  }

  _buildArms(M) {
    this.shoulders = [];
    this.elbows = [];

    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.215, 0.22, 0);
      this.chest.add(shoulder);

      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.2, 8, 14), M.top);
      upperArm.position.y = -0.17;
      upperArm.castShadow = true;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = -0.33;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.2, 8, 14), M.skin);
      forearm.position.y = -0.16;
      forearm.castShadow = true;
      elbow.add(forearm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 12), M.skin);
      hand.scale.set(0.72, 1.15, 0.5);
      hand.position.y = -0.32;
      hand.castShadow = true;
      elbow.add(hand);

      // Resting arm pose: slight outward splay and a soft elbow bend
      shoulder.rotation.z = side * 0.09;
      elbow.rotation.x = -0.12;

      this.shoulders.push(shoulder);
      this.elbows.push(elbow);
    }
  }

  _buildHead(M) {
    const head = new THREE.Group();
    head.position.y = 0.52;
    this.head = head;
    this.chest.add(head);

    // Skull: an egg, not a ball — narrower at the chin
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 28, 24), M.skin);
    skull.scale.set(0.94, 1.12, 1);
    skull.position.y = 0.08;
    skull.castShadow = true;
    head.add(skull);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), M.skin);
    jaw.scale.set(0.92, 0.82, 0.95);
    jaw.position.set(0, -0.02, 0.012);
    jaw.castShadow = true;
    head.add(jaw);

    // --- Face ---
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 10), M.skin);
    nose.rotation.x = Math.PI / 2.1;
    nose.position.set(0, 0.045, 0.108);
    head.add(nose);

    for (const side of [-1, 1]) {
      const socket = new THREE.Group();
      socket.position.set(side * 0.048, 0.082, 0.088);
      head.add(socket);

      const white = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 12), M.eyeWhite);
      white.scale.set(1, 0.78, 0.7);
      socket.add(white);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), M.iris);
      iris.position.z = 0.014;
      socket.add(iris);

      // Upper lid, which also gives the eye a lash line
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0245, 14, 10), M.skin);
      lid.scale.set(1, 0.5, 0.75);
      lid.position.y = 0.014;
      socket.add(lid);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.008, 0.012), M.hair);
      brow.position.set(side * 0.05, 0.115, 0.1);
      brow.rotation.z = -side * 0.12;
      head.add(brow);
    }

    const lips = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), M.lip);
    lips.scale.set(1.15, 0.4, 0.42);
    lips.position.set(0, -0.005, 0.1);
    head.add(lips);

    // --- Hair: open at the face, full at the back ---
    const faceGap = 0.72;
    const hairShell = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.138,
        28,
        22,
        Math.PI / 2 + faceGap,
        Math.PI * 2 - faceGap * 2
      ),
      M.hair
    );
    hairShell.scale.set(0.97, 1.12, 1.04);
    hairShell.position.y = 0.075;
    hairShell.castShadow = true;
    head.add(hairShell);

    const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.132, 22, 16), M.hair);
    fringe.scale.set(0.99, 0.62, 1.02);
    fringe.position.set(0, 0.13, 0.006);
    fringe.castShadow = true;
    head.add(fringe);

    // Length falling past the shoulders, in two soft strands
    const lengthGeo = new THREE.CapsuleGeometry(0.062, 0.3, 8, 14);
    for (const side of [-1, 1]) {
      const strand = new THREE.Mesh(lengthGeo, M.hair);
      strand.scale.set(1.1, 1, 0.75);
      strand.position.set(side * 0.075, -0.1, -0.075);
      strand.rotation.x = -0.12;
      strand.rotation.z = side * 0.1;
      strand.castShadow = true;
      head.add(strand);
    }

    const bulk = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), M.hair);
    bulk.scale.set(1, 1.25, 0.8);
    bulk.position.set(0, -0.045, -0.08);
    bulk.castShadow = true;
    head.add(bulk);

    // Small earrings
    for (const side of [-1, 1]) {
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), M.gold);
      earring.position.set(side * 0.122, 0.015, 0.008);
      head.add(earring);
    }
  }

  // ---------------------------------------------------------------- movement

  /**
   * @param {number} dt delta time in seconds
   * @param {InputManager} input
   * @param {number} cameraYaw camera orbit angle, so movement is camera-relative
   * @param {World} world provides boundary + prop collision
   */
  update(dt, input, cameraYaw, world) {
    if (this.seat) {
      this._updateSeated(dt);
      return;
    }

    this.sitBlend = damp(this.sitBlend, 0, 9, dt);

    // Camera-relative basis: W walks away from the camera, D walks screen-right
    this._forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    this._right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    this._direction
      .set(0, 0, 0)
      .addScaledVector(this._forward, -input.move.z)
      .addScaledVector(this._right, input.move.x);

    const moving = this._direction.lengthSq() > 0.0001;
    if (moving) {
      this._direction.normalize();
      // Slightly slower in the air, so a jump doesn't double as a sprint
      this.speed = CONTENT.world.walkSpeed * (this.isGrounded ? 1 : 0.85);

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

    const targetBlend = moving && this.isGrounded ? 1 : 0;
    this.moveAmount += (targetBlend - this.moveAmount) * Math.min(1, dt * 9);

    this._animate(dt);
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
        // Landing: squash proportional to how hard she came down
        this.landingSquash = clamp(-this.verticalVelocity / jump.velocity, 0, 1) * 0.16;
        this.height = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    this.landingSquash = damp(this.landingSquash, 0, 11, dt);
  }

  // ----------------------------------------------------------------- sitting

  /** Sit on a seat: `{ x, z, y, yaw }` in world space. */
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

    // Step forward off the seat so she isn't left standing inside it
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

  // --------------------------------------------------------------- animation

  _animate(dt) {
    const walk = this.moveAmount;
    const sit = this.sitBlend;
    const air = this.isGrounded ? 0 : 1;

    this.walkPhase += dt * (4.4 + this.speed * 0.55) * walk;
    const cycle = Math.sin(this.walkPhase);
    const cycleOff = Math.sin(this.walkPhase + Math.PI);

    // --- Legs ---
    // Thighs swing; knees bend on the return swing, straighten on the stride.
    const thighSwing = 0.58 * walk;
    const kneeBend = 0.95 * walk;

    this.hips[0].rotation.x = cycle * thighSwing;
    this.hips[1].rotation.x = cycleOff * thighSwing;
    this.knees[0].rotation.x = -Math.max(0, -cycle) * kneeBend - 0.06 * walk;
    this.knees[1].rotation.x = -Math.max(0, -cycleOff) * kneeBend - 0.06 * walk;

    // In the air, she tucks: front knee up, back leg trailing
    if (air > 0 || this.verticalVelocity !== 0) {
      const rise = clamp(this.verticalVelocity / CONTENT.world.jump.velocity, -1, 1);
      const tuck = (1 - Math.abs(rise)) * 0.5 + 0.35;
      this.hips[0].rotation.x = THREE.MathUtils.lerp(this.hips[0].rotation.x, -0.75 * tuck, air);
      this.hips[1].rotation.x = THREE.MathUtils.lerp(this.hips[1].rotation.x, 0.3 * tuck, air);
      this.knees[0].rotation.x = THREE.MathUtils.lerp(this.knees[0].rotation.x, -1.15 * tuck, air);
      this.knees[1].rotation.x = THREE.MathUtils.lerp(this.knees[1].rotation.x, -0.5 * tuck, air);
    }

    // Seated: thighs forward and level, knees folded down
    if (sit > 0.001) {
      for (let i = 0; i < 2; i++) {
        const spread = i === 0 ? -0.07 : 0.07;
        this.hips[i].rotation.x = THREE.MathUtils.lerp(this.hips[i].rotation.x, -1.5, sit);
        this.hips[i].rotation.z = THREE.MathUtils.lerp(this.hips[i].rotation.z, spread, sit);
        this.knees[i].rotation.x = THREE.MathUtils.lerp(this.knees[i].rotation.x, -1.45, sit);
      }

      // The skirt has no simulation, so it is reshaped by hand: shorter and
      // wider, as if the fabric were draping over her knees. Without this the
      // hem hangs straight through the bench and she reads as standing.
      const drape = THREE.MathUtils.lerp(1, 0.52, sit);
      this.skirt.scale.set(
        THREE.MathUtils.lerp(1, 1.3, sit),
        drape,
        THREE.MathUtils.lerp(1, 1.15, sit)
      );
      this.skirt.position.y = THREE.MathUtils.lerp(-0.33, -0.14, sit);
    } else {
      this.hips[0].rotation.z = 0;
      this.hips[1].rotation.z = 0;
      this.skirt.scale.set(1, 1, 1);
      this.skirt.position.y = -0.33;
    }

    // --- Arms: counter-swing to the legs, with a trailing elbow ---
    const armSwing = 0.5 * walk;
    this.shoulders[0].rotation.x = cycleOff * armSwing;
    this.shoulders[1].rotation.x = cycle * armSwing;
    this.elbows[0].rotation.x = -0.12 - Math.max(0, cycleOff) * 0.5 * walk;
    this.elbows[1].rotation.x = -0.12 - Math.max(0, cycle) * 0.5 * walk;

    if (air > 0) {
      this.shoulders[0].rotation.x = THREE.MathUtils.lerp(this.shoulders[0].rotation.x, -0.6, air);
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, -0.9, air);
      this.shoulders[0].rotation.z = THREE.MathUtils.lerp(-0.09, -0.5, air);
      this.shoulders[1].rotation.z = THREE.MathUtils.lerp(0.09, 0.5, air);
    } else {
      this.shoulders[0].rotation.z = damp(this.shoulders[0].rotation.z, -0.09, 10, dt);
      this.shoulders[1].rotation.z = damp(this.shoulders[1].rotation.z, 0.09, 10, dt);
    }

    if (sit > 0.001) {
      // Hands resting in her lap
      this.shoulders[0].rotation.x = THREE.MathUtils.lerp(this.shoulders[0].rotation.x, -0.45, sit);
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, -0.45, sit);
      this.shoulders[0].rotation.z = THREE.MathUtils.lerp(this.shoulders[0].rotation.z, -0.22, sit);
      this.shoulders[1].rotation.z = THREE.MathUtils.lerp(this.shoulders[1].rotation.z, 0.22, sit);
      this.elbows[0].rotation.x = THREE.MathUtils.lerp(this.elbows[0].rotation.x, -1.15, sit);
      this.elbows[1].rotation.x = THREE.MathUtils.lerp(this.elbows[1].rotation.x, -1.15, sit);
    }

    // --- Body carriage ---
    const now = performance.now() * 0.001;
    const bob = Math.abs(Math.cos(this.walkPhase)) * 0.035 * walk;
    const breathe = Math.sin(now * 1.5) * 0.008 * (1 - walk);

    this.pelvis.position.y = 1.04 + bob + breathe - this.landingSquash - sit * 0.5;
    this.pelvis.rotation.y = cycle * 0.07 * walk;
    this.pelvis.rotation.z = cycle * 0.03 * walk;

    this.chest.rotation.y = -cycle * 0.09 * walk;
    this.chest.rotation.x = 0.04 * walk + sit * 0.06;

    // Landing squash: she compresses through the knees, not through her head
    const squash = 1 - this.landingSquash * 1.4;
    this.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

    // Head: settles level, with a small idle drift and a look toward her path
    this.head.rotation.y = cycle * 0.06 * walk + Math.sin(now * 0.6) * 0.05 * (1 - walk);
    this.head.rotation.x = -0.03 * walk + Math.sin(now * 0.9) * 0.02 * (1 - walk) + sit * 0.05;
  }
}

/**
 * Give a cloth cylinder soft vertical folds, so the skirt doesn't read as a
 * perfect lampshade. Folds deepen toward the hem.
 */
function rippleCloth(geometry, amount, folds) {
  const position = geometry.attributes.position;
  const bounds = geometry.boundingBox ?? (geometry.computeBoundingBox(), geometry.boundingBox);
  const height = bounds.max.y - bounds.min.y;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const angle = Math.atan2(z, x);
    const drop = (bounds.max.y - y) / height; // 0 at waist, 1 at hem
    const wave = Math.sin(angle * folds) * amount * drop;

    const radial = Math.hypot(x, z);
    if (radial > 0.0001) {
      position.setXYZ(i, x + (x / radial) * wave, y, z + (z / radial) * wave);
    }
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
