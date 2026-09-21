import * as THREE from 'three';

/**
 * Query-string development helpers, so any part of the map can be inspected
 * without walking the whole route first. None of them affect a normal visit.
 *
 *   ?at=x,z    start her at a world position
 *   ?cam=8     pull the chase camera in or out
 *   ?yaw=180   start the camera at a given angle, in degrees
 *   ?press=2   fire the interact key once, N seconds after load
 *   ?jump=1    fire the jump key once, N seconds after load
 */
const params = new URLSearchParams(import.meta.env.DEV ? window.location.search : '');

export const DevOptions = {
  /** @returns {THREE.Vector3|null} */
  spawnPoint() {
    const raw = params.get('at');
    if (!raw) return null;

    const [x, z] = raw.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    return new THREE.Vector3(x, 0, z);
  },

  /** Fires the interact key on a timer, for testing interactions headlessly. */
  scheduleInteract(input) {
    const delay = Number(params.get('press'));
    if (!Number.isFinite(delay)) return;
    setTimeout(() => input.queueInteract(), delay * 1000);
  },

  scheduleJump(input) {
    const delay = Number(params.get('jump'));
    if (!Number.isFinite(delay)) return;
    setTimeout(() => { input.jumpQueued = true; }, delay * 1000);
  },

  applyCamera(controller) {
    const distance = Number(params.get('cam'));
    if (Number.isFinite(distance) && distance > 0) {
      const ratio = distance / controller.distance;
      controller.distance = distance;
      controller.height *= ratio;
      controller.lookHeight = 1.1;
    }

    const yaw = Number(params.get('yaw'));
    if (Number.isFinite(yaw) && params.has('yaw')) {
      controller.yaw = THREE.MathUtils.degToRad(yaw);
    }
  }
};
