import * as THREE from 'three';
import { Atmosphere } from './Atmosphere.js';
import { PostFX } from './PostFX.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.initScene();
    this.initCamera();
    this.initRenderer();

    // Sky, environment lighting and haze
    this.atmosphere = new Atmosphere(this.scene, this.renderer);
    this.postFX = new PostFX(this.renderer, this.scene, this.camera);

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.15, 2000);
    this.camera.position.set(0, 7, 14);
    this.camera.lookAt(0, 1.5, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.78;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.postFX.setSize(this.width, this.height);
  }

  render(dt) {
    this.atmosphere.update(this.camera.position);
    this.postFX.render(dt);
  }
}
