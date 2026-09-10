import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { Lighting } from './core/Lighting.js';
import { InputManager } from './core/InputManager.js';
import { CameraController } from './core/CameraController.js';
import { World } from './world/World.js';
import { Character } from './entities/Character.js';
import { Dog } from './entities/Dog.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      throw new Error('Canvas container #canvas-container not found.');
    }

    this.sceneManager = new SceneManager(this.container);
    this.lighting = new Lighting(this.sceneManager.scene);
    this.world = new World(this.sceneManager.scene);

    this.input = new InputManager(this.sceneManager.renderer.domElement);

    this.character = new Character(this.sceneManager.scene);
    this.character.position.copy(readSpawnOverride() ?? this.world.spawnPoint);

    this.dog = new Dog(this.sceneManager.scene);
    this.dog.position.set(
      this.character.position.x + 1.4,
      0,
      this.character.position.z + 1.8
    );

    this.camera = new CameraController(this.sceneManager.camera, this.character);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Clamp dt so a backgrounded tab doesn't teleport her on return.
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.input.update(dt);
    this.character.update(dt, this.input, this.camera.yaw, this.world);
    this.dog.update(dt, this.character, this.world);
    this.camera.update(dt, this.input);
    this.lighting.update(this.character.position);
    this.world.update(elapsed);

    this.sceneManager.render();
  }
}

/**
 * Dev helper: `?at=x,z` starts her anywhere on the map, so a single station can
 * be checked without walking the whole route first.
 */
function readSpawnOverride() {
  const raw = new URLSearchParams(window.location.search).get('at');
  if (!raw) return null;

  const [x, z] = raw.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return new THREE.Vector3(x, 0, z);
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
