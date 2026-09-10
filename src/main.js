import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { Lighting } from './core/Lighting.js';
import { Ground } from './world/Ground.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      throw new Error('Canvas container #canvas-container not found.');
    }

    this.sceneManager = new SceneManager(this.container);
    this.lighting = new Lighting(this.sceneManager.scene);
    this.ground = new Ground(this.sceneManager.scene);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);

    requestAnimationFrame(this.animate);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const elapsedTime = this.clock.getElapsedTime();

    // Update animated objects
    this.ground.update(elapsedTime);

    // Render frame
    this.sceneManager.render();
  }
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
