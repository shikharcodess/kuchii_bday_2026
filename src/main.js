import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { Lighting } from './core/Lighting.js';
import { InputManager } from './core/InputManager.js';
import { CameraController } from './core/CameraController.js';
import { World } from './world/World.js';
import { Character } from './entities/Character.js';
import { Dog } from './entities/Dog.js';
import { GuidanceArrow } from './entities/GuidanceArrow.js';
import { SurpriseSystem } from './core/SurpriseSystem.js';
import { DevOptions } from './core/DevOptions.js';
import { InteractionSystem } from './core/InteractionSystem.js';
import { HUD } from './ui/HUD.js';
import { MessagePanel } from './ui/MessagePanel.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      throw new Error('Canvas container #canvas-container not found.');
    }

    this.sceneManager = new SceneManager(this.container);
    this.lighting = new Lighting(
      this.sceneManager.scene,
      this.sceneManager.atmosphere.sunDirection
    );

    this.input = new InputManager(this.sceneManager.renderer.domElement);
    this.hud = new HUD(this.input);
    this.interactions = new InteractionSystem(this.input, this.hud);
    this.messagePanel = new MessagePanel();

    this.guidanceArrow = new GuidanceArrow(this.sceneManager.scene);
    this.surprises = new SurpriseSystem(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.hud,
      this.messagePanel,
      this.guidanceArrow
    );

    this.character = new Character(this.sceneManager.scene);
    this.camera = new CameraController(this.sceneManager.camera, this.character);

    // Stations register their interactions as they build
    this.world = new World(this.sceneManager.scene, {
      interactions: this.interactions,
      camera: this.camera,
      messagePanel: this.messagePanel,
      surprises: this.surprises
    });

    this.character.position.copy(DevOptions.spawnPoint() ?? this.world.spawnPoint);
    DevOptions.applyCamera(this.camera);
    DevOptions.scheduleInteract(this.input);
    DevOptions.scheduleJump(this.input);

    this.dog = new Dog(this.sceneManager.scene);
    this.dog.position.set(
      this.character.position.x + 1.2,
      0,
      this.character.position.z + 1.4
    );

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
    this.surprises.update(this.input, this.character);
    this.interactions.update(this.character);
    this.character.update(dt, this.input, this.camera.yaw, this.world);
    this.dog.update(dt, this.character, this.world);
    this.guidanceArrow.update(dt, this.character.position);
    this.camera.update(dt, this.input);
    this.lighting.update(this.character.position);
    this.world.update(elapsed, dt);

    this.sceneManager.render(dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
