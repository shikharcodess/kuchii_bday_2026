import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { damp, dampAngle } from '../utils/MathUtils.js';

/**
 * GuidanceArrow
 * 
 * A cute 3D glowing heart / compass arrow that hovers gracefully above or
 * ahead of the character, gently pointing towards the next active station
 * or undiscovered surprise.
 */
export class GuidanceArrow {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.currentTarget = new THREE.Vector3(0, 0, -24); // Initially points to Sunflower Garden
    this.visible = true;
    this.yaw = 0;

    this._build();
    this.scene.add(this.group);
  }

  _build() {
    // Glowing golden-pink material with soft elegance
    this.arrowMat = new THREE.MeshStandardMaterial({
      color: 0xf4a261,
      emissive: 0xf6c878,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.2
    });

    // Dainty arrow shaft: very slender cylinder
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 10), this.arrowMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.08;
    this.group.add(shaft);

    // Dainty arrow pointer head: small cone pointing along -Z
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 12), this.arrowMat);
    head.rotation.x = -Math.PI / 2;
    head.position.z = -0.24;
    this.group.add(head);

    // Cute miniature floating heart atop the arrow
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.05, y + 0.05);
    heartShape.bezierCurveTo(x + 0.05, y + 0.05, x + 0.04, y, x, y);
    heartShape.bezierCurveTo(x - 0.06, y, x - 0.06, y + 0.07, x - 0.06, y + 0.07);
    heartShape.bezierCurveTo(x - 0.06, y + 0.11, x - 0.02, y + 0.154, x + 0.05, y + 0.19);
    heartShape.bezierCurveTo(x + 0.12, y + 0.154, x + 0.16, y + 0.11, x + 0.16, y + 0.07);
    heartShape.bezierCurveTo(x + 0.16, y + 0.07, x + 0.16, y, x + 0.1, y);
    heartShape.bezierCurveTo(x + 0.07, y, x + 0.05, y + 0.05, x + 0.05, y + 0.05);

    const extrudeSettings = { depth: 0.02, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.006, bevelThickness: 0.006 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();
    const heart = new THREE.Mesh(heartGeo, this.arrowMat);
    heart.rotation.x = Math.PI;
    heart.rotation.z = Math.PI;
    heart.scale.setScalar(0.55);
    heart.position.set(0, 0.07, -0.02);
    this.group.add(heart);

    // Subtle, gentle glow light (reduced from 2.5 to 0.75)
    this.light = new THREE.PointLight(0xf6c878, 0.75, 2.5, 2);
    this.group.add(this.light);
  }

  setTarget(pos) {
    if (!pos) return;
    this.currentTarget.copy(pos);
  }

  update(dt, characterPosition) {
    if (!characterPosition) return;

    // Hover slightly above the player
    const now = performance.now() * 0.001;
    const hoverY = 2.65 + Math.sin(now * 2.6) * 0.08;

    this.group.position.set(
      characterPosition.x,
      characterPosition.y + hoverY,
      characterPosition.z
    );

    // Compute angle toward target (facing -Z in local coords)
    const dx = this.currentTarget.x - characterPosition.x;
    const dz = this.currentTarget.z - characterPosition.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 1.2) {
      // Point forward along direction
      const targetYaw = Math.atan2(dx, dz) + Math.PI;
      this.yaw = dampAngle(this.yaw, targetYaw, 8, dt);
      this.group.rotation.y = this.yaw;
      this.group.visible = true;
    } else {
      // Reached milestone, do a happy spin!
      this.group.rotation.y += dt * 4.0;
    }
  }
}
