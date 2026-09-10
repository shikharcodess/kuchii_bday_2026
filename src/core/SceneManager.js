import * as THREE from 'three';
import { CONTENT } from '../config/content.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initFog();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONTENT.theme.skyColor);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      500
    );
    // Elevated third-person angle overlooking the starter area
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

    // Realistic PBR lighting setup
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);
  }

  initFog() {
    // Soft atmospheric distance haze matching dusk/sunset tones
    this.scene.fog = new THREE.FogExp2(CONTENT.theme.fogColor, 0.012);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
