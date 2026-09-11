import * as THREE from 'three';
import {
  woodTexture,
  plasterTexture,
  roofTexture,
  stoneTexture,
  gravelTexture,
  fabricTexture,
  foliageTexture
} from './Textures.js';

/**
 * Shared PBR material library.
 *
 * Every surface that reads as a real material — timber, plaster, clay tile,
 * stone, cloth, foliage — carries a procedurally generated albedo and bump map
 * (see Textures.js). Reusing one instance per material across the whole map
 * keeps texture uploads and draw-call state changes down.
 */

/** Textured standard material. */
function surface(textures, options = {}) {
  const { map, bumpMap } = textures;
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: options.bumpScale ?? 0.4,
    roughness: options.roughness ?? 0.85,
    metalness: options.metalness ?? 0.02,
    envMapIntensity: options.envMapIntensity ?? 0.65,
    ...options.extra
  });
}

/** Untextured material, for polished or self-lit surfaces. */
function plain(color, roughness, metalness, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    envMapIntensity: 1,
    ...extra
  });
}

export const MAT = {
  // Structure
  wood: surface(woodTexture(0x8a6244, 2), { roughness: 0.78, bumpScale: 0.5 }),
  darkWood: surface(woodTexture(0x5c4030, 2), { roughness: 0.74, bumpScale: 0.5 }),
  plank: surface(woodTexture(0xa9825c, 3), { roughness: 0.8, bumpScale: 0.45 }),
  stone: surface(stoneTexture(0x9a9289, 2), { roughness: 0.9, bumpScale: 0.6 }),
  sandstone: surface(stoneTexture(0xd6c6ac, 2), { roughness: 0.86, bumpScale: 0.5 }),
  gravel: surface(gravelTexture(6), { roughness: 0.95, bumpScale: 0.7 }),
  paleWall: surface(plasterTexture(0xf0e2cd, 3), { roughness: 0.88, bumpScale: 0.35 }),
  roofTile: surface(roofTexture(0x9b5a4a, 3), { roughness: 0.8, bumpScale: 0.8 }),
  white: surface(plasterTexture(0xf5f2ec, 2), { roughness: 0.7, bumpScale: 0.2 }),

  metal: plain(0x6f6a66, 0.38, 0.85),
  gold: plain(0xe0b661, 0.28, 0.92),
  copper: plain(0xb87340, 0.34, 0.85),

  fabricPink: surface(fabricTexture(0xe9a3ab, 3), { roughness: 0.9, bumpScale: 0.25 }),
  fabricCream: surface(fabricTexture(0xf3e3cd, 3), { roughness: 0.92, bumpScale: 0.25 }),

  // Nature
  grass: surface(foliageTexture(0x6d8f4f, 2), { roughness: 0.92, envMapIntensity: 0.9 }),
  grassLight: surface(foliageTexture(0x86a259, 2), { roughness: 0.92, envMapIntensity: 0.9 }),
  leaf: surface(foliageTexture(0x63864a, 1.5), { roughness: 0.88, envMapIntensity: 0.85 }),
  leafWarm: surface(foliageTexture(0x8b9a4c, 1.5), { roughness: 0.88, envMapIntensity: 0.85 }),
  leafDeep: surface(foliageTexture(0x4a6d43, 1.5), { roughness: 0.9, envMapIntensity: 0.8 }),
  bark: surface(woodTexture(0x584434, 3), { roughness: 0.95, bumpScale: 0.9 }),
  soil: surface(stoneTexture(0x4a3a2c, 3), { roughness: 0.97, bumpScale: 0.6 }),

  // Accents
  sunflowerPetal: plain(0xf0b929, 0.62, 0.03),
  sunflowerCore: plain(0x53341c, 0.88, 0.02),
  stem: plain(0x4a7038, 0.9, 0.0),
  rose: plain(0xe07a8f, 0.72, 0.03),
  chili: plain(0xc0392b, 0.5, 0.05),
  curry: plain(0xd2793a, 0.42, 0.05),

  // Emissive glows (lanterns, windows, screens)
  lampGlow: plain(0xffd79a, 0.4, 0, {
    emissive: 0xffb960,
    emissiveIntensity: 1.6
  }),
  windowGlow: plain(0xffcf8f, 0.35, 0, {
    emissive: 0xffa94d,
    emissiveIntensity: 1.1
  }),
  screenGlow: plain(0x9fd8e8, 0.3, 0, {
    emissive: 0x4a9fc0,
    emissiveIntensity: 0.9
  }),
  sparkle: plain(0xffe9b8, 0.22, 0.45, {
    emissive: 0xffc978,
    emissiveIntensity: 1.2
  })
};

/** Convenience for one-off tinted variants without polluting the shared library. */
export const tinted = (base, color, overrides = {}) => {
  const mat = base.clone();
  mat.color = new THREE.Color(color);
  Object.assign(mat, overrides);
  return mat;
};
