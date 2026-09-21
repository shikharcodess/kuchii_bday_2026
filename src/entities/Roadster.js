import * as THREE from 'three';
import { MAT } from '../world/Materials.js';
import { mergeGeometries } from '../world/Props.js';
import { damp, dampAngle, clamp } from '../utils/MathUtils.js';

/**
 * Vintage Convertible Roadster — Kuchii's Special Birthday Ride.
 *
 * Features:
 * 1. Curvaceous 1950s/60s retro convertible roadster with cream enamel lacquer,
 *    curved fenders, chrome grille, round glowing headlights, and caramel leather interior.
 * 2. Front & rear "KUCHII 🧿" license plates + "L" learner driver badge.
 * 3. Full driving mechanics: acceleration (W), reverse/brake (S), steering (A/D),
 *    and classic dual-tone horn (Space).
 * 4. Front wheels physically turn left/right; all 4 wheels spin when driving.
 * 5. Cockpit steering wheel rotates with steering input.
 * 6. Tail lights brighten to vivid red when braking or reversing.
 * 7. Kuchii sits gracefully in the driver seat, and her loyal Dog companion rides
 *    happily in the passenger seat beside her!
 * 8. Full boundary & obstacle collision constraints via world.constrain().
 */
export class Roadster {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = this.group.position;

    // Initial position & orientation
    const initX = options.x ?? -12;
    const initZ = options.z ?? -68;
    const initYaw = options.yaw ?? (Math.PI * 0.1);
    this.position.set(initX, 0, initZ);
    this.yaw = initYaw;
    this.group.rotation.y = this.yaw;

    // Driving state & physics parameters
    this.isDriven = false;
    this.driver = null;
    this.passenger = null;

    this.speed = 0;
    this.maxForwardSpeed = 10.5; // ~24 mph (brisk, scenic, responsive)
    this.maxReverseSpeed = -4.2;
    this.acceleration = 12.0;
    this.brakeForce = 22.0;
    this.coastFriction = 0.92;
    this.wheelbase = 2.2;

    this.steerAngle = 0;
    this.maxSteerAngle = 0.52; // ~30 degrees
    this.steerSpeed = 4.5;
    this.steerReturnSpeed = 7.5;

    this.wheelRadius = 0.32;
    this.wheelSpin = 0;

    // Horn debounce
    this.lastHornTime = 0;

    // Seat local positions (Right-hand drive for India)
    this.driverSeatPos = new THREE.Vector3(0.38, 0.56, 0.14);
    this.passengerSeatPos = new THREE.Vector3(-0.38, 0.56, 0.14);

    // Dynamic meshes to animate
    this.frontWheelPivots = [];
    this.wheelMeshes = [];
    this.steeringWheel = null;
    this.brakeLights = [];
    this.headlights = [];

    this._buildCar();
    scene.add(this.group);
  }

  // ---------------------------------------------------------------- Visual Model

  _buildCar() {
    // One mesh per material: static parts are merged so the whole car is ~15 draw calls.
    const bodyPaint = new THREE.MeshStandardMaterial({ color: 0xb3122e, roughness: 0.22, metalness: 0.45, envMapIntensity: 1.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.12, metalness: 0.95, envMapIntensity: 1.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1c1a1a, roughness: 0.8, metalness: 0.2 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0xc9955a, roughness: 0.7, metalness: 0.02 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide });
    const headlampMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffe9a8, emissiveIntensity: 0.9, roughness: 0.15 });
    const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xfb8500, emissiveIntensity: 0.7 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x8a0010, emissive: 0xff1a33, emissiveIntensity: 0.6, roughness: 0.2 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a2e12, roughness: 0.35 });
    const wickerMat = new THREE.MeshStandardMaterial({ color: 0xb57a42, roughness: 0.88 });
    const thermosMat = new THREE.MeshStandardMaterial({ color: 0xd90429, metalness: 0.4, roughness: 0.3 });

    const parts = new Map(); // material -> geometries
    const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
      geo.applyMatrix4(new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
        new THREE.Vector3(1, 1, 1)
      ));
      if (!parts.has(mat)) parts.set(mat, []);
      parts.get(mat).push(geo);
    };
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, n = 12) => new THREE.CylinderGeometry(rt, rb, h, n);

    // --- Body: one extruded side profile (profile-x = car z, y up), wheel arches cut as holes ---
    const W = 1.72;
    const profile = new THREE.Shape();
    profile.moveTo(-2.05, 0.3);
    profile.lineTo(-2.05, 0.7);
    profile.quadraticCurveTo(-1.9, 0.86, -1.5, 0.9);   // nose
    profile.lineTo(-0.62, 0.98);                        // hood up to cowl
    profile.quadraticCurveTo(-0.5, 1.0, -0.48, 0.88);
    profile.lineTo(-0.44, 0.7);                         // cockpit cut
    profile.lineTo(0.72, 0.7);
    profile.lineTo(0.78, 0.96);                         // rear deck
    profile.quadraticCurveTo(1.5, 0.98, 1.95, 0.82);
    profile.quadraticCurveTo(2.08, 0.7, 2.05, 0.3);
    profile.lineTo(-2.05, 0.3);
    for (const zArch of [-1.2, 1.2]) {
      const arch = new THREE.Path();
      arch.absarc(zArch, 0.32, 0.44, 0, Math.PI * 2, false);
      profile.holes.push(arch);
    }
    const body = new THREE.ExtrudeGeometry(profile, {
      depth: W - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 10
    });
    // Extrude builds in XY and extrudes along +Z; rotate so profile-X becomes car-Z and extrusion becomes car-X.
    add(body, bodyPaint, (W - 0.16) / 2, 0, 0, 0, -Math.PI / 2, 0);

    // Cockpit tub sitting in the cut-out
    add(box(W - 0.3, 0.36, 1.16), darkMat, 0, 0.5, 0.14);
    add(box(W - 0.2, 0.06, 1.2), darkMat, 0, 0.71, 0.14);

    // Chrome side spears
    for (const sx of [-1, 1]) add(box(0.02, 0.035, 3.2), chromeMat, sx * (W / 2 + 0.005), 0.6, 0.05);

    // --- Grille & nose ---
    add(box(0.9, 0.3, 0.06), chromeMat, 0, 0.5, -2.06);
    add(box(0.82, 0.24, 0.04), darkMat, 0, 0.5, -2.08);
    for (let s = -4; s <= 4; s++) add(box(0.022, 0.22, 0.05), chromeMat, s * 0.09, 0.5, -2.09);
    add(new THREE.ConeGeometry(0.035, 0.12, 8), MAT.gold, 0, 0.98, -1.85, -Math.PI / 2.4); // hood mascot

    // Headlamps: chrome ring + glowing lens set into the nose, amber indicator below
    for (const sx of [-0.58, 0.58]) {
      add(cyl(0.15, 0.17, 0.08, 16), chromeMat, sx, 0.72, -2.02, Math.PI / 2);
      add(new THREE.SphereGeometry(0.12, 14, 10), headlampMat, sx, 0.72, -2.03);
      add(new THREE.SphereGeometry(0.045, 8, 6), amberMat, sx, 0.5, -2.06);
    }

    // --- Bumpers with overriders, exhausts ---
    for (const z of [-2.14, 2.14]) {
      add(cyl(0.045, 0.045, W + 0.2, 10), chromeMat, 0, 0.38, z, 0, 0, Math.PI / 2);
      for (const sx of [-0.5, 0.5]) add(cyl(0.04, 0.05, 0.22, 8), chromeMat, sx, 0.44, z);
    }
    for (const sx of [-0.4, 0.4]) add(cyl(0.035, 0.035, 0.2, 10), chromeMat, sx, 0.26, 2.12, Math.PI / 2);

    // --- Tail lights ---
    for (const sx of [-0.62, 0.62]) {
      add(box(0.14, 0.2, 0.06), chromeMat, sx, 0.68, 2.0);
      add(box(0.1, 0.16, 0.05), tailMat, sx, 0.68, 2.04);
    }
    this.brakeLights.push(tailMat);

    // --- Windshield: chrome frame + tilted glass, mirrors ---
    const wsZ = -0.5, wsTilt = 0.38;
    add(box(W - 0.2, 0.04, 0.04), chromeMat, 0, 1.36, wsZ - 0.14);
    for (const sx of [-1, 1]) add(box(0.04, 0.5, 0.04), chromeMat, sx * (W / 2 - 0.12), 1.12, wsZ - 0.07, wsTilt);
    add(new THREE.PlaneGeometry(W - 0.24, 0.48), glassMat, 0, 1.12, wsZ - 0.07, wsTilt);
    add(box(0.16, 0.07, 0.03), chromeMat, 0, 1.28, wsZ - 0.18);
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.05, 8, 6), chromeMat, sx * (W / 2 + 0.08), 1.0, wsZ + 0.1);

    // --- Interior ---
    add(box(W - 0.32, 0.22, 0.26), woodMat, 0, 0.82, -0.32);
    for (const dx of [0.28, 0.48]) add(cyl(0.06, 0.06, 0.02, 12), chromeMat, dx, 0.86, -0.18, Math.PI / 2);
    for (const sx of [-0.38, 0.38]) {
      add(box(0.52, 0.14, 0.5), leatherMat, sx, 0.5, 0.14);
      add(box(0.5, 0.5, 0.12), leatherMat, sx, 0.78, 0.42, -0.14);
      add(box(0.3, 0.12, 0.1), leatherMat, sx, 1.06, 0.46, -0.14);
    }
    add(cyl(0.014, 0.014, 0.22, 6), chromeMat, 0.05, 0.62, -0.05, -0.2);
    add(new THREE.SphereGeometry(0.035, 8, 6), MAT.gold, 0.05, 0.74, -0.08);

    // Luggage rack + picnic basket + thermos on the rear deck
    for (const z of [0.95, 1.5]) add(box(0.9, 0.025, 0.025), chromeMat, 0, 1.0, z);
    for (let r = -2; r <= 2; r++) add(box(0.02, 0.02, 0.6), chromeMat, r * 0.2, 1.0, 1.22);
    add(box(0.5, 0.26, 0.36), wickerMat, -0.14, 1.14, 1.22);
    add(cyl(0.06, 0.06, 0.28, 10), thermosMat, 0.28, 1.15, 1.22);

    for (const [mat, geos] of parts) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.castShadow = mat === bodyPaint || mat === leatherMat;
      mesh.receiveShadow = mat === bodyPaint;
      this.group.add(mesh);
    }
    this.headlights.push(headlampMat);

    // --- Plates & learner badge ---
    const frontPlate = this._createLicensePlateMesh('KUCHII 🧿');
    frontPlate.position.set(0, 0.42, -2.12);
    this.group.add(frontPlate);
    const rearPlate = this._createLicensePlateMesh('KUCHII 🧿');
    rearPlate.position.set(0, 0.42, 2.12);
    rearPlate.rotation.y = Math.PI;
    this.group.add(rearPlate);
    const learnerBadge = this._createLearnerBadgeMesh();
    learnerBadge.position.set(-0.55, 0.72, 2.09);
    learnerBadge.rotation.y = Math.PI;
    this.group.add(learnerBadge);

    // --- Steering wheel (rotates with input) ---
    const steerPivot = new THREE.Group();
    steerPivot.position.set(0.38, 0.9, -0.14);
    steerPivot.rotation.x = -0.5;
    const sw = [new THREE.TorusGeometry(0.18, 0.02, 8, 24)];
    const hub = cyl(0.04, 0.04, 0.03, 10); hub.rotateX(Math.PI / 2); sw.push(hub);
    for (let sp = 0; sp < 3; sp++) {
      const spoke = box(0.02, 0.17, 0.014);
      spoke.translate(0, 0.085, 0); spoke.rotateZ((sp * Math.PI * 2) / 3);
      sw.push(spoke);
    }
    steerPivot.add(new THREE.Mesh(mergeGeometries(sw), chromeMat));
    this.group.add(steerPivot);
    this.steeringWheel = steerPivot;

    // --- Wheels: front pair on steer pivots, rear pair fixed ---
    const track = W / 2 + 0.02;
    for (const [z, steer] of [[-1.2, true], [1.2, false]]) {
      for (const sx of [-track, track]) {
        const pivot = new THREE.Group();
        pivot.position.set(sx, 0.32, z);
        this.group.add(pivot);
        if (steer) this.frontWheelPivots.push(pivot);
        const wheel = this._createWheelMesh(chromeMat, tireMat);
        pivot.add(wheel);
        this.wheelMeshes.push(wheel);
      }
    }
  }

  _createWheelMesh(chromeMat, tireMat) {
    // Axle runs along X; the group spins on X.
    const wheel = new THREE.Group();
    const tire = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 20);
    tire.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tire, tireMat);
    tireMesh.castShadow = true;
    wheel.add(tireMesh);

    const hub = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16);
    hub.rotateZ(Math.PI / 2);
    const caps = [hub];
    for (const sx of [-0.13, 0.13]) {
      const cap = new THREE.SphereGeometry(0.07, 10, 8);
      cap.translate(sx, 0, 0);
      caps.push(cap);
    }
    wheel.add(new THREE.Mesh(mergeGeometries(caps), chromeMat));
    return wheel;
  }

  _createLicensePlateMesh(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 256, 80);

    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 72);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Cinzel", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.16),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 })
    );
    return mesh;
  }

  _createLearnerBadgeMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#d90429';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 120, 120);

    ctx.fillStyle = '#d90429';
    ctx.font = '900 96px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.24),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 })
    );
    return mesh;
  }

  // ---------------------------------------------------------------- Interaction API

  /**
   * Driver steps into the car.
   */
  mount(character, dog) {
    this.isDriven = true;
    this.driver = character;
    this.passenger = dog;

    character.enterVehicle(this);
    if (dog) {
      dog.enterVehicle(this);
    }
  }

  /**
   * Driver parks and steps out.
   */
  dismount() {
    this.isDriven = false;
    this.speed = 0;

    // Reset brake lights
    for (const b of this.brakeLights) {
      b.emissiveIntensity = 0.6;
    }

    // Compute safe driver exit position on the right side of the roadster
    const exitRight = new THREE.Vector3(1.4, 0, 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).add(this.position);
    exitRight.y = 0;

    // Compute safe passenger exit position on the left side
    const exitLeft = new THREE.Vector3(-1.4, 0, 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).add(this.position);
    exitLeft.y = 0;

    if (this.driver) {
      this.driver.exitVehicle(exitRight);
    }
    if (this.passenger) {
      this.passenger.exitVehicle(exitLeft);
    }

    this.driver = null;
    this.passenger = null;
  }

  // ---------------------------------------------------------------- Update Loop

  update(dt, input, world, audio) {
    if (!this.isDriven) {
      // Natural coasting deceleration if coasting to stop
      if (Math.abs(this.speed) > 0.01) {
        this.speed *= Math.pow(0.85, dt * 60);
        this._updateMotion(dt, world);
      }
      this.steerAngle = damp(this.steerAngle, 0, 8, dt);
      this._updateVisualPivots();
      return;
    }

    // Handle Driving Inputs
    let throttle = 0;
    let steering = 0;
    let isBraking = false;

    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) throttle += 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) throttle -= 1;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) steering += 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) steering -= 1;

    // Acceleration & Braking
    if (throttle > 0) {
      if (this.speed < 0) {
        // Forward key while moving backward -> Brake
        this.speed += this.brakeForce * dt;
        isBraking = true;
      } else {
        this.speed += this.acceleration * dt;
      }
    } else if (throttle < 0) {
      if (this.speed > 0.2) {
        // Reverse key while moving forward -> Brake hard!
        this.speed -= this.brakeForce * dt;
        isBraking = true;
      } else {
        // Moving backward in reverse gear
        this.speed -= this.acceleration * 0.6 * dt;
      }
    } else {
      // Coasting friction
      this.speed *= Math.pow(this.coastFriction, dt * 60);
      if (Math.abs(this.speed) < 0.05) this.speed = 0;
    }

    this.speed = clamp(this.speed, this.maxReverseSpeed, this.maxForwardSpeed);

    // Steering Angle
    const targetSteer = steering * this.maxSteerAngle;
    const steerRate = steering !== 0 ? this.steerSpeed : this.steerReturnSpeed;
    this.steerAngle = damp(this.steerAngle, targetSteer, steerRate, dt);

    // Apply movement & world constraints
    this._updateMotion(dt, world);

    // Brake Lights Glow
    const brakeIntensity = (isBraking || this.speed < -0.1) ? 2.2 : 0.6;
    for (const b of this.brakeLights) {
      b.emissiveIntensity = damp(b.emissiveIntensity, brakeIntensity, 12, dt);
    }

    // Car Horn (Space or Jump)
    if (input.keys.has('Space') || input.consumeJump()) {
      const now = performance.now();
      if (now - this.lastHornTime > 450) {
        this.lastHornTime = now;
        if (audio && audio.playHorn) {
          audio.playHorn();
        }
        // Emit cheerful celebratory event
        window.dispatchEvent(new CustomEvent('roadster_honk', { detail: { x: this.position.x, z: this.position.z } }));
      }
    }

    // Update wheel pivots and steering wheel rotation
    this._updateVisualPivots();

    // Synchronize Driver & Passenger positions
    this._syncOccupants();
  }

  _updateMotion(dt, world) {
    if (Math.abs(this.speed) > 0.02) {
      // Angular velocity proportional to steering angle and velocity
      // Signed speed already flips the turn direction in reverse, like a real car
      this.yaw += (this.speed / this.wheelbase) * Math.sin(this.steerAngle) * dt;

      // Translate in direction of vehicle yaw
      // Note: Roadster model faces -Z (so forward is -Z)
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);

      this.position.x += forwardX * this.speed * dt;
      this.position.z += forwardZ * this.speed * dt;

      // Constrain within map bounds and push out of static tree/building colliders
      if (world) {
        world.constrain(this.position, 1.35);
      }

      // Wheel spinning
      this.wheelSpin += (this.speed * dt) / this.wheelRadius;
    }

    this.group.rotation.y = this.yaw;
    this.position.y = 0;
  }

  _updateVisualPivots() {
    // Front wheel steer rotation
    for (const pivot of this.frontWheelPivots) {
      pivot.rotation.y = this.steerAngle;
    }

    // Wheel rolling spin
    for (const wheel of this.wheelMeshes) {
      wheel.rotation.x = this.wheelSpin;
    }

    // Cockpit steering wheel rotation
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -this.steerAngle * 2.8;
    }
  }

  _syncOccupants() {
    // Keep Kuchii seated in driver seat
    if (this.driver) {
      const driverWorld = this.driverSeatPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).add(this.position);
      this.driver.position.copy(driverWorld);
      // Character/Dog models face +Z at their yaw; the car faces -Z at its yaw
      this.driver.yaw = this.yaw + Math.PI;
      this.driver.group.rotation.y = this.yaw + Math.PI;
    }

    // Keep Dog seated in passenger seat
    if (this.passenger) {
      const passWorld = this.passengerSeatPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).add(this.position);
      this.passenger.position.copy(passWorld);
      this.passenger.yaw = this.yaw + Math.PI;
      this.passenger.group.rotation.y = this.yaw + Math.PI;
    }
  }
}
