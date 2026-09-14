import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

/**
 * Post-processing chain: a restrained bloom on the light sources plus a soft
 * vignette, resolved through OutputPass so ACES tone mapping and the sRGB
 * conversion happen once, at the very end of the chain.
 *
 * The composer renders into a multisampled half-float target: half-float so
 * bright lamps can exceed 1.0 and bloom properly, multisampled because the
 * canvas's own antialiasing does not apply once we render to a target.
 */
export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.enabled = true;

    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = Math.min(renderer.getPixelRatio(), 1.5);

    const target = new THREE.WebGLRenderTarget(
      Math.floor(size.x * pixelRatio),
      Math.floor(size.y * pixelRatio),
      {
        type: THREE.HalfFloatType,
        samples: 0 // Avoid costly multisampling on high-DPI displays
      }
    );

    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(size.x, size.y);

    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.floor(size.x * 0.75), Math.floor(size.y * 0.75)),
      0.28, // subtle, warm glow on lanterns & candles
      0.6,
      0.88
    );
    this.composer.addPass(this.bloom);

    this.vignette = new ShaderPass(VignetteShader);
    this.vignette.uniforms.offset.value = 1.1;
    this.vignette.uniforms.darkness.value = 1.05;
    this.composer.addPass(this.vignette);

    this.composer.addPass(new OutputPass());
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  render(deltaTime) {
    this.composer.render(deltaTime);
  }
}
