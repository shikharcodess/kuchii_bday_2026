import * as THREE from 'three';
import { CONTENT } from '../config/content.js';

/**
 * The lighting rig.
 *
 * Most of the ambient light now comes from the sky environment map (see
 * Atmosphere.js), so this is deliberately simple: one strong, warm, low sun for
 * long raking shadows, and a weak hemisphere light to keep shadowed sides from
 * going flat.
 */
export class Lighting {
  constructor(scene, sunDirection) {
    this.scene = scene;
    this.sunDirection = sunDirection ?? new THREE.Vector3(0.4, 0.35, 0.5).normalize();
    this.initLights();
  }

  initLights() {
    const theme = CONTENT.theme;

    // Sky/ground fill — subtle, since the environment map does the heavy work.
    this.hemiLight = new THREE.HemisphereLight(theme.ambientSky, theme.ambientGround, 0.35);
    this.scene.add(this.hemiLight);

    // Primary golden-hour sun
    this.sunLight = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
    this.sunOffset = this.sunDirection.clone().multiplyScalar(60);
    this.sunLight.position.copy(this.sunOffset);
    this.sunLight.castShadow = true;

    // A tight shadow frustum that follows the player keeps texel density high,
    // which is what makes the shadows read as sharp contact shadows up close.
    const shadow = this.sunLight.shadow;
    shadow.mapSize.set(2048, 2048);
    shadow.camera.near = 1;
    shadow.camera.far = 140;

    const extent = 26;
    shadow.camera.left = -extent;
    shadow.camera.right = extent;
    shadow.camera.top = extent;
    shadow.camera.bottom = -extent;
    shadow.bias = -0.0002;
    shadow.normalBias = 0.035;
    shadow.radius = 1.6;

    this.sunLight.target = new THREE.Object3D();
    this.scene.add(this.sunLight.target);
    this.scene.add(this.sunLight);
  }

  /**
   * Keep the shadow-casting sun centred on the player.
   * Without this, shadows would only resolve near the world origin.
   */
  update(focusPosition) {
    if (!focusPosition) return;

    this.sunLight.target.position.set(focusPosition.x, 0, focusPosition.z);
    this.sunLight.target.updateMatrixWorld();

    this.sunLight.position.set(
      focusPosition.x + this.sunOffset.x,
      this.sunOffset.y,
      focusPosition.z + this.sunOffset.z
    );
  }
}
