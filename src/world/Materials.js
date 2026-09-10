import * as THREE from 'three';

/**
 * Shared PBR material library.
 *
 * Reusing a small set of materials across the whole map keeps draw-call state
 * changes down and gives the world a consistent, warm, realistic-leaning feel.
 */
const make = (color, roughness, metalness, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

export const MAT = {
  // Structure
  wood: make(0x8a6244, 0.82, 0.02),
  darkWood: make(0x5c4030, 0.8, 0.03),
  plank: make(0xa9825c, 0.85, 0.02),
  stone: make(0x9a9289, 0.88, 0.04),
  sandstone: make(0xd6c6ac, 0.8, 0.03),
  paleWall: make(0xf0e2cd, 0.85, 0.02),
  roofTile: make(0x9b5a4a, 0.78, 0.05),
  metal: make(0x6f6a66, 0.35, 0.85),
  gold: make(0xe0b661, 0.3, 0.9),
  copper: make(0xb87340, 0.35, 0.8),
  white: make(0xf5f2ec, 0.7, 0.03),
  fabricPink: make(0xe9a3ab, 0.85, 0.02),
  fabricCream: make(0xf3e3cd, 0.88, 0.01),

  // Nature
  grass: make(0x4c6b3c, 0.95, 0.0),
  grassLight: make(0x63834a, 0.95, 0.0),
  leaf: make(0x3f6236, 0.9, 0.0),
  leafWarm: make(0x6d7a33, 0.9, 0.0),
  leafDeep: make(0x2f5230, 0.92, 0.0),
  bark: make(0x584434, 0.92, 0.01),
  soil: make(0x4a3a2c, 0.95, 0.0),
  water: make(0x3f6f8a, 0.25, 0.15),

  // Accents
  sunflowerPetal: make(0xf0b929, 0.68, 0.03),
  sunflowerCore: make(0x53341c, 0.85, 0.02),
  stem: make(0x4a7038, 0.9, 0.0),
  rose: make(0xe07a8f, 0.75, 0.03),
  chili: make(0xc0392b, 0.55, 0.05),
  curry: make(0xd2793a, 0.45, 0.05),

  // Emissive glows (lanterns, windows, screens)
  lampGlow: new THREE.MeshStandardMaterial({
    color: 0xffd79a,
    emissive: 0xffb960,
    emissiveIntensity: 1.6,
    roughness: 0.4
  }),
  windowGlow: new THREE.MeshStandardMaterial({
    color: 0xffcf8f,
    emissive: 0xffa94d,
    emissiveIntensity: 1.1,
    roughness: 0.35
  }),
  screenGlow: new THREE.MeshStandardMaterial({
    color: 0x9fd8e8,
    emissive: 0x4a9fc0,
    emissiveIntensity: 0.9,
    roughness: 0.3
  }),
  sparkle: new THREE.MeshStandardMaterial({
    color: 0xffe9b8,
    emissive: 0xffc978,
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.4
  })
};

/** Convenience for one-off tinted variants without polluting the shared library. */
export const tinted = (base, color, overrides = {}) => {
  const mat = base.clone();
  mat.color = new THREE.Color(color);
  Object.assign(mat, overrides);
  return mat;
};
