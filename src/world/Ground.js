import * as THREE from 'three';
import { CONTENT } from '../config/content.js';

/**
 * The meadow the whole world sits on.
 *
 * Kept perfectly flat so movement and collision stay simple, but given subtle
 * vertex-colour variation so it reads as grass rather than a flat green sheet.
 */
export class Ground {
  constructor(scene) {
    this.scene = scene;
    this.build();
  }

  build() {
    const { width, depth, centerZ } = CONTENT.world.ground;
    const geometry = new THREE.PlaneGeometry(width, depth, 96, 160);

    // Gentle patchwork of warm and cool greens baked into vertex colours.
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const base = new THREE.Color(0x445c37);
    const warm = new THREE.Color(0x5d6f3c);
    const dry = new THREE.Color(0x6b6a42);
    const tone = new THREE.Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);

      const patch =
        Math.sin(x * 0.06) * Math.cos(y * 0.045) * 0.5 +
        Math.sin(x * 0.021 + y * 0.017) * 0.5;
      const mix = THREE.MathUtils.clamp(patch * 0.5 + 0.5, 0, 1);

      tone.copy(base).lerp(warm, mix);
      // Occasional drier, sunnier patches
      const dryness = Math.max(0, Math.sin(x * 0.011 + y * 0.03)) * 0.25;
      tone.lerp(dry, dryness);

      colors[i * 3] = tone.r;
      colors[i * 3 + 1] = tone.g;
      colors[i * 3 + 2] = tone.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      metalness: 0.0
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, 0, centerZ);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'ground';
    this.scene.add(this.mesh);
  }
}
