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

    /**
     * Cinematic orbit: while set, the camera ignores the character and circles
     * a point of interest instead. Used for the sit-and-watch moments.
     */
    this.orbit = null;
    this.orbitCenter = new THREE.Vector3();
    this.orbitLook = new THREE.Vector3();
  }

  /**
   * Start circling a point. The orbit begins wherever the camera already is,
   * so the move reads as the camera drifting away from behind her rather than
   * cutting to a new angle.
   */
  beginOrbit({ x, z, radius = 12, height = 4.6, lookHeight = 0.7, speed = 0.12 }) {
    this.orbitCenter.set(x, 0, z);

    const startAngle = Math.atan2(
      this.camera.position.x - x,
      this.camera.position.z - z
    );

    this.orbit = { radius, height, lookHeight, speed, angle: startAngle };
  }

  endOrbit() {
    this.orbit = null;
    // Resume behind her, wherever she is facing now
    this.yaw = this.target.yaw + Math.PI;
  }

  update(dt, input) {
    if (this.orbit) {
      this._updateOrbit(dt);
      return;
    }

    // Manual orbit takes priority; auto-alignment resumes shortly after.
    const dragDelta = input ? input.consumeDragDelta() : 0;
    const isDriving = !!this.target.isDriving;
    const isIndoor = !!this.target.isIndoor;

    if (dragDelta !== 0) {
      this.yaw -= dragDelta * 0.005;
    } else if (isDriving && input && (input.keys.has('KeyW') || input.keys.has('KeyS') || input.keys.has('ArrowUp') || input.keys.has('ArrowDown')) && input.timeSinceDrag > 0.8) {
      // Swing camera to trail smoothly behind the roadster
      this.yaw = dampAngle(this.yaw, this.target.yaw + Math.PI, 4.5, dt);
    } else if (input && input.isMoving && input.timeSinceDrag > 1.2) {
      // Swing around to sit behind her direction of travel
      this.yaw = dampAngle(this.yaw, this.target.yaw + Math.PI, this.yawEase, dt);
    }

    const pos = this.target.position;
    const targetDist = isDriving ? 8.6 : (isIndoor ? (CONTENT.camera.indoorDistance || 5.0) : this.distance);
    const targetHeight = isDriving ? 3.8 : (isIndoor ? (CONTENT.camera.indoorHeight || 3.6) : this.height);
    const targetLookHeight = isDriving ? 1.1 : (isIndoor ? 1.2 : this.lookHeight);

    this.desired.set(
      pos.x + Math.sin(this.yaw) * targetDist,
      pos.y + targetHeight,
      pos.z + Math.cos(this.yaw) * targetDist
    );

    if (!this._initialised) {
      this.camera.position.copy(this.desired);
      this.lookAt.set(pos.x, pos.y + targetLookHeight, pos.z);
      this._initialised = true;
    } else {
      this.camera.position.set(
        damp(this.camera.position.x, this.desired.x, this.followEase, dt),
        damp(this.camera.position.y, this.desired.y, this.followEase, dt),
        damp(this.camera.position.z, this.desired.z, this.followEase, dt)
      );

      this.lookAt.set(
        damp(this.lookAt.x, pos.x, this.followEase * 1.4, dt),
        damp(this.lookAt.y, pos.y + targetLookHeight, this.followEase * 1.4, dt),
        damp(this.lookAt.z, pos.z, this.followEase * 1.4, dt)
      );
    }

    this.camera.lookAt(this.lookAt);
  }

  _updateOrbit(dt) {
    const orbit = this.orbit;
    orbit.angle += orbit.speed * dt;

    this.desired.set(
      this.orbitCenter.x + Math.sin(orbit.angle) * orbit.radius,
      orbit.height,
      this.orbitCenter.z + Math.cos(orbit.angle) * orbit.radius
    );

    // Ease onto the orbit rather than snapping to it
    this.camera.position.set(
      damp(this.camera.position.x, this.desired.x, 1.6, dt),
      damp(this.camera.position.y, this.desired.y, 1.6, dt),
      damp(this.camera.position.z, this.desired.z, 1.6, dt)
    );

    this.orbitLook.set(this.orbitCenter.x, orbit.lookHeight, this.orbitCenter.z);
    this.lookAt.set(
      damp(this.lookAt.x, this.orbitLook.x, 2.2, dt),
      damp(this.lookAt.y, this.orbitLook.y, 2.2, dt),
      damp(this.lookAt.z, this.orbitLook.z, 2.2, dt)
    );

    this.camera.lookAt(this.lookAt);
  }
}
