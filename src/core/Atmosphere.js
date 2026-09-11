import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { CONTENT } from '../config/content.js';

/**
 * Sky, sun placement and image-based lighting.
 *
 * A physical (Preetham) sky replaces the flat background colour, and the same
 * sky is pre-filtered into an environment map so every PBR material in the
 * world picks up real sky and ground bounce instead of looking like plastic.
 * This is most of the difference between "cartoon" and "photographic-leaning".
 */
export class Atmosphere {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    const cfg = CONTENT.theme.sky;
    this.elevation = cfg.elevation;
    this.azimuth = cfg.azimuth;

    this.sunDirection = new THREE.Vector3();
    this._updateSunDirection();

    this.sky = new Sky();
    this.sky.scale.setScalar(20000);

    const uniforms = this.sky.material.uniforms;
    uniforms.turbidity.value = cfg.turbidity;
    uniforms.rayleigh.value = cfg.rayleigh;
    uniforms.mieCoefficient.value = cfg.mieCoefficient;
    uniforms.mieDirectionalG.value = cfg.mieDirectionalG;
    uniforms.sunPosition.value.copy(this.sunDirection).multiplyScalar(1000);

    scene.add(this.sky);

    this._buildEnvironment();

    // Warm aerial haze tuned to the horizon, so distance reads as distance.
    scene.fog = new THREE.FogExp2(cfg.hazeColor, cfg.hazeDensity);
  }

  _updateSunDirection() {
    const phi = THREE.MathUtils.degToRad(90 - this.elevation);
    const theta = THREE.MathUtils.degToRad(this.azimuth);
    this.sunDirection.setFromSphericalCoords(1, phi, theta);
  }

  /** Pre-filter the sky into a PMREM cube used as `scene.environment`. */
  _buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    // The sky mesh is rendered from inside, so it needs its own tiny scene.
    const envScene = new THREE.Scene();
    const skyClone = new Sky();
    skyClone.scale.setScalar(100);
    skyClone.material.uniforms.turbidity.value = this.sky.material.uniforms.turbidity.value;
    skyClone.material.uniforms.rayleigh.value = this.sky.material.uniforms.rayleigh.value;
    skyClone.material.uniforms.mieCoefficient.value =
      this.sky.material.uniforms.mieCoefficient.value;
    skyClone.material.uniforms.mieDirectionalG.value =
      this.sky.material.uniforms.mieDirectionalG.value;
    skyClone.material.uniforms.sunPosition.value.copy(this.sunDirection).multiplyScalar(1000);
    envScene.add(skyClone);

    // A large ground disc so the lower hemisphere bounces warm earth light
    // rather than leaving everything lit from above only.
    const bounce = new THREE.Mesh(
      new THREE.SphereGeometry(90, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: CONTENT.theme.sky.groundBounce,
        side: THREE.BackSide
      })
    );
    envScene.add(bounce);

    this.environment = pmrem.fromScene(envScene, 0.04).texture;
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = CONTENT.theme.sky.environmentIntensity;

    skyClone.geometry.dispose();
    skyClone.material.dispose();
    bounce.geometry.dispose();
    bounce.material.dispose();
    pmrem.dispose();
  }

  /** Keep the sky dome centred on the camera so it never clips the far plane. */
  update(cameraPosition) {
    this.sky.position.set(cameraPosition.x, 0, cameraPosition.z);
  }
}
