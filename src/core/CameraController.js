import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { damp, dampAngle } from '../utils/MathUtils.js';

/**
 * Third-person chase camera.
 *
 * It sits behind and slightly above the character, eases into place, and
 * slowly swings around to line up with her direction of travel. Dragging with
 * the mouse takes manual control of the orbit for a couple of seconds.
 */
export class CameraController {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target; // anything exposing { position, yaw }

    const cfg = CONTENT.camera;
    this.distance = cfg.distance;
    this.height = cfg.height;
    this.lookHeight = cfg.lookHeight;
    this.followEase = cfg.followEase;
    this.yawEase = cfg.yawEase;

    // The camera sits opposite the character's facing, so it trails her.
    this.yaw = (target.yaw ?? 0) + Math.PI;
    this.lookAt = new THREE.Vector3();
    this.desired = new THREE.Vector3();

    // Snap into place on the very first frame instead of flying in.
    this._initialised = false;
  }

  update(dt, input) {
    // Manual orbit takes priority; auto-alignment resumes shortly after.
    const dragDelta = input ? input.consumeDragDelta() : 0;
    if (dragDelta !== 0) {
      this.yaw -= dragDelta * 0.005;
    } else if (input && input.isMoving && input.timeSinceDrag > 1.5) {
      // Swing around to sit behind her direction of travel (hence the + PI).
      this.yaw = dampAngle(this.yaw, this.target.yaw + Math.PI, this.yawEase, dt);
    }

    const pos = this.target.position;
    this.desired.set(
      pos.x + Math.sin(this.yaw) * this.distance,
      pos.y + this.height,
      pos.z + Math.cos(this.yaw) * this.distance
    );

    if (!this._initialised) {
      this.camera.position.copy(this.desired);
      this.lookAt.set(pos.x, pos.y + this.lookHeight, pos.z);
      this._initialised = true;
    } else {
      this.camera.position.set(
        damp(this.camera.position.x, this.desired.x, this.followEase, dt),
        damp(this.camera.position.y, this.desired.y, this.followEase, dt),
        damp(this.camera.position.z, this.desired.z, this.followEase, dt)
      );

      this.lookAt.set(
        damp(this.lookAt.x, pos.x, this.followEase * 1.4, dt),
        damp(this.lookAt.y, pos.y + this.lookHeight, this.followEase * 1.4, dt),
        damp(this.lookAt.z, pos.z, this.followEase * 1.4, dt)
      );
    }

    this.camera.lookAt(this.lookAt);
  }
}
