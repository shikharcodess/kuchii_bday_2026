import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { grassTexture } from './Textures.js';

/**
 * The meadow the whole world sits on.
 *
 * Kept perfectly flat so movement and collision stay simple, but given subtle
 * vertex-colour variation so it reads as grass rather than a flat green sheet.
 */
export class Ground {
  /**
   * @param {THREE.Scene} scene
   * @param {{x: number, z: number, radius: number}[]} holes areas cut out of the
   *   meadow so sunken features (the pond) can sit below ground level.
   */
  constructor(scene, holes = []) {
    this.scene = scene;
    this.holes = holes;
    this.build();
  }

  build() {
    const { width, depth, centerZ } = CONTENT.world.ground;
    const geometry = new THREE.PlaneGeometry(width, depth, 128, 200);

    // Bake the ground transform into the geometry, so vertex positions are
    // world coordinates and carving holes is a straight XZ test.
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, centerZ);

    // Gentle patchwork of warm and cool greens baked into vertex colours.
    if (this.holes.length > 0) this.carve(geometry);

    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const base = new THREE.Color(0xb9c4ae);
    const warm = new THREE.Color(0xd8d2b4);
    const dry = new THREE.Color(0xded0a6);
    const tone = new THREE.Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getZ(i);

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

    // Textured grass, tinted per-vertex so the meadow has broad colour
    // variation on top of the fine texture detail.
    const { map, bumpMap } = grassTexture(150);
    const material = new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.35,
      vertexColors: true,
      roughness: 0.97,
      metalness: 0.0,
      envMapIntensity: 0.5
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'ground';
    this.scene.add(this.mesh);
  }

  /**
   * Drop every triangle that falls inside a hole. The resulting edge is as
   * coarse as the mesh (a couple of metres), which is why each hole is ringed
   * with a bank of soil, stones and reeds to hide the cut.
   */
  carve(geometry) {
    const position = geometry.attributes.position;
    const index = geometry.getIndex();
    const kept = [];

    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      const cx = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
      const cz = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;

      const inHole = this.holes.some(
        (hole) => (cx - hole.x) ** 2 + (cz - hole.z) ** 2 < hole.radius * hole.radius
      );

      if (!inHole) kept.push(a, b, c);
    }

    geometry.setIndex(kept);
  }
}
