import * as THREE from 'three';
import { CONTENT } from '../config/content.js';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.initLights();
  }

  initLights() {
    // 1. Ambient Hemisphere Light (Sky vs Ground bounce)
    this.hemiLight = new THREE.HemisphereLight(
      CONTENT.theme.ambientSky,
      CONTENT.theme.ambientGround,
      0.85
    );
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Primary Directional "Golden Hour" Sun Light
    this.sunLight = new THREE.DirectionalLight(CONTENT.theme.sunColor, 2.2);
    this.sunLight.position.set(25, 35, 20);
    this.sunLight.castShadow = true;

    // Configure high-quality soft shadows
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 150;

    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.radius = 2.5;

    // The sun is parented to nothing, but its position and target follow the
    // player so the (necessarily limited) shadow frustum always covers her.
    this.sunOffset = new THREE.Vector3(25, 35, 20);
    this.sunLight.target = new THREE.Object3D();
    this.scene.add(this.sunLight.target);
    this.scene.add(this.sunLight);

    // 3. Subtle Warm Ambient Fill Light for gentle shadows
    this.ambientLight = new THREE.AmbientLight(0xffecd1, 0.45);
    this.scene.add(this.ambientLight);
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
