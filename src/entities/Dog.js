import * as THREE from 'three';
import { dampAngle } from '../utils/MathUtils.js';

/**
 * The dog companion.
 *
 * Simple follow AI: he aims for a spot just behind and beside her, trots when
 * he falls behind, and settles into an idle (tail wag + breathing) when he
 * catches up. Authored facing +Z like the character.
 */
export class Dog {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = this.group.position;

    this.yaw = Math.PI;
    this.radius = 0.4;
    this.followDistance = options.followDistance ?? 1.8;
    this.sideOffset = options.sideOffset ?? 1.0;
    this.maxSpeed = options.maxSpeed ?? 8.2;
    this.speed = 0;
    this.trotPhase = 0;
    this.moveAmount = 0;
    this.isDancing = false;
    this.danceCenter = null;

    this._target = new THREE.Vector3();
    this._delta = new THREE.Vector3();

    this._build();
    scene.add(this.group);
  }

  _build() {
    const furMat = new THREE.MeshStandardMaterial({
      color: 0xc08b52,
      roughness: 0.85,
      metalness: 0.0
    });
    const darkFur = new THREE.MeshStandardMaterial({
      color: 0x8a5d33,
      roughness: 0.85,
      metalness: 0.0
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x2a211d,
      roughness: 0.4,
      metalness: 0.05
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xd9607a,
      roughness: 0.6,
      metalness: 0.1
    });

    const body = new THREE.Group();
    this.body = body;
    this.group.add(body);

    // Torso lying along +Z
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 12), furMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.y = 0.44;
    torso.castShadow = true;
    body.add(torso);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.62, 0.42);
    this.head = head;
    body.add(head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), furMat);
    skull.castShadow = true;
    head.add(skull);

    const snout = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 5, 10), furMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.04, 0.17);
    snout.castShadow = true;
    head.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), noseMat);
    nose.position.set(0, -0.03, 0.27);
    head.add(nose);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), noseMat);
      eye.position.set(side * 0.075, 0.04, 0.14);
      head.add(eye);

      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 8), darkFur);
      ear.position.set(side * 0.13, 0.06, -0.02);
      ear.rotation.z = side * 0.5;
      ear.castShadow = true;
      head.add(ear);
    }

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16), collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.55, 0.26);
    body.add(collar);

    // Legs — front pair and back pair swing in opposite phase
    this.legs = [];
    const legGeo = new THREE.CapsuleGeometry(0.055, 0.22, 5, 10);
    const legPositions = [
      [-0.13, 0.28],
      [0.13, 0.28],
      [-0.13, -0.24],
      [0.13, -0.24]
    ];
    for (const [x, z] of legPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.34, z);
      const leg = new THREE.Mesh(legGeo, darkFur);
      leg.position.y = -0.16;
      leg.castShadow = true;
      pivot.add(leg);
      body.add(pivot);
      this.legs.push(pivot);
    }

    // Tail
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.55, -0.32);
    const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.26, 5, 10), furMat);
    tailMesh.position.y = 0.14;
    tailMesh.castShadow = true;
    this.tail.add(tailMesh);
    this.tail.rotation.x = -0.6;
    body.add(this.tail);
  }

  setDancing(isDancing, centerPos = null) {
    this.isDancing = isDancing;
    this.danceCenter = centerPos;
    if (!isDancing) {
      this.body.rotation.x = 0;
      this.position.y = 0;
    }
  }

  /**
   * @param {number} dt
   * @param {Character} leader the character to trail behind
   * @param {World} world
   */
  update(dt, leader, world) {
    if (this.isDancing) {
      this._updateDancing(dt);
      return;
    }

    // Aim for a point behind and to the side of her, in her local frame.
    const back = -this.followDistance;
    const side = this.sideOffset;
    const sin = Math.sin(leader.yaw);
    const cos = Math.cos(leader.yaw);

    this._target.set(
      leader.position.x + sin * back + cos * side,
      0,
      leader.position.z + cos * back - sin * side
    );

    this._delta.subVectors(this._target, this.position);
    this._delta.y = 0;
    const distance = this._delta.length();

    // If he gets badly stuck (wedged behind a tree while she walks on), give up
    // and reappear at her heel rather than leaving her without her dog.
    if (distance > 26) {
      this.position.copy(this._target);
      this.yaw = leader.yaw;
      return;
    }

    // Dead zone so he doesn't jitter when she's standing still.
    if (distance > 0.35) {
      const eagerness = Math.min(1, (distance - 0.35) / 1.6);
      this.speed = this.maxSpeed * eagerness;
      this._delta.normalize();

      this.position.x += this._delta.x * this.speed * dt;
      this.position.z += this._delta.z * this.speed * dt;

      const targetYaw = Math.atan2(this._delta.x, this._delta.z);
      this.yaw = dampAngle(this.yaw, targetYaw, 8, dt);

      if (world) world.constrain(this.position, this.radius);
    } else {
      this.speed = 0;
      // When idle he turns to look at her.
      const lookYaw = Math.atan2(
        leader.position.x - this.position.x,
        leader.position.z - this.position.z
      );
      this.yaw = dampAngle(this.yaw, lookYaw, 4, dt);
    }

    this.group.rotation.y = this.yaw;

    const targetBlend = this.speed > 0.2 ? 1 : 0;
    this.moveAmount += (targetBlend - this.moveAmount) * Math.min(1, dt * 8);

    this._animate(dt);
  }

  _animate(dt) {
    const blend = this.moveAmount;
    this.trotPhase += dt * (7 + this.speed) * blend;

    const swing = Math.sin(this.trotPhase) * 0.7 * blend;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.legs[2].rotation.x = -swing;
    this.legs[3].rotation.x = swing;

    const now = performance.now() * 0.001;
    // Tail wags fast when trotting, lazily when idle
    const wagSpeed = 6 + blend * 8;
    this.tail.rotation.y = Math.sin(now * wagSpeed) * (0.35 + blend * 0.35);
    this.tail.rotation.x = -0.6 - blend * 0.15;

    this.body.position.y = Math.abs(Math.cos(this.trotPhase)) * 0.035 * blend;
    this.head.rotation.z = Math.sin(now * 1.7) * 0.05 * (1 - blend);
    this.head.rotation.x = Math.sin(now * 1.1) * 0.04 * (1 - blend);
  }

  _updateDancing(dt) {
    const now = performance.now() * 0.001;

    // Circle joyfully nearby the couple
    if (this.danceCenter) {
      const radius = 2.4;
      const angle = now * 1.2;
      this.position.x = this.danceCenter.x + Math.sin(angle) * radius;
      this.position.z = this.danceCenter.z + Math.cos(angle) * radius;
      this.position.y = 0.28 + Math.abs(Math.sin(now * 8)) * 0.08;
      // Face inward toward the dancing couple
      const lookYaw = Math.atan2(this.danceCenter.x - this.position.x, this.danceCenter.z - this.position.z);
      this.yaw = dampAngle(this.yaw, lookYaw, 8, dt);
      this.group.rotation.y = this.yaw;
    }

    // Hind leg rearing & joyful paw dance!
    this.body.rotation.x = -0.65 + Math.sin(now * 8) * 0.12;
    // Front paws happily tapping the air in rhythm
    this.legs[0].rotation.x = -0.8 + Math.sin(now * 12) * 0.55;
    this.legs[1].rotation.x = -0.8 - Math.sin(now * 12) * 0.55;
    // Hind legs supporting
    this.legs[2].rotation.x = 0.35;
    this.legs[3].rotation.x = 0.35;

    // Tail wagging at maximum excitement!
    this.tail.rotation.y = Math.sin(now * 24) * 0.85;
    this.tail.rotation.x = 0.2;

    // Head bopping happily to the beat
    this.head.rotation.x = 0.22 + Math.sin(now * 8) * 0.12;
    this.head.rotation.z = Math.sin(now * 6) * 0.1;
  }
}
