import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

/**
 * Procedurally generated textures.
 *
 * The brief rules out paid or downloaded asset packs, but untextured materials
 * are exactly what makes a scene read as a cartoon. So every surface here gets
 * a canvas-generated albedo, plus a matching bump/roughness map, built once at
 * load and cached. Everything is deterministic, so the world looks identical on
 * every visit.
 */

const noise = new ImprovedNoise();
const cache = new Map();

/** Fractal Brownian motion — layered noise, the basis of every texture below. */
function fbm(x, y, octaves = 4, lacunarity = 2.1, gain = 0.5) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise.noise(x * frequency, y * frequency, i * 13.7);
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / norm; // roughly -0.5..0.5
}

/**
 * Seamlessly tiling fbm.
 *
 * Blending the four wrapped corners of the sample square makes the left edge
 * match the right and the top match the bottom, so textures repeat without a
 * seam and without the smeared swirls a polar mapping would produce.
 */
function tiledFbm(u, v, scale, octaves = 4, seed = 0) {
  const x = u * scale;
  const y = v * scale;
  const sample = (a, b) => fbm(a + seed * 31.7, b + seed * 17.3, octaves);

  return (
    sample(x, y) * (1 - u) * (1 - v) +
    sample(x - scale, y) * u * (1 - v) +
    sample(x, y - scale) * (1 - u) * v +
    sample(x - scale, y - scale) * u * v
  );
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function finish(canvas, { repeat = 1, colorSpace = THREE.SRGBColorSpace } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Core generator: fills a canvas pixel by pixel from a callback that returns
 * `[r, g, b]` (0-255) for a given uv and noise value, and derives a grayscale
 * height map from the same pass for use as a bump map.
 */
function generate(key, size, shade) {
  if (cache.has(key)) return cache.get(key);

  const colorCanvas = makeCanvas(size);
  const bumpCanvas = makeCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');

  const colorData = colorCtx.createImageData(size, size);
  const bumpData = bumpCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const u = x / size;
      const v = y / size;

      const [r, g, b, height] = shade(u, v, x, y);

      colorData.data[i] = r;
      colorData.data[i + 1] = g;
      colorData.data[i + 2] = b;
      colorData.data[i + 3] = 255;

      const h = Math.max(0, Math.min(255, height));
      bumpData.data[i] = h;
      bumpData.data[i + 1] = h;
      bumpData.data[i + 2] = h;
      bumpData.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const result = { colorCanvas, bumpCanvas };
  cache.set(key, result);
  return result;
}

const mix = (a, b, t) => a + (b - a) * t;

/** Meadow grass: layered greens with dry patches and fine blade speckle. */
export function grassTexture(repeat = 1) {
  const { colorCanvas, bumpCanvas } = generate('grass', 512, (u, v) => {
    const broad = tiledFbm(u, v, 5, 4) + 0.5; // 0..1
    const detail = tiledFbm(u, v, 22, 3, 1) + 0.5;
    const blades = tiledFbm(u, v, 70, 2, 2) + 0.5;

    const lush = mix(0.35, 1, broad);
    const dry = Math.max(0, broad - 0.62) * 1.9;

    let r = mix(48, 96, lush * detail) + dry * 60;
    let g = mix(78, 132, lush) + dry * 40;
    let b = mix(38, 62, detail * lush) + dry * 18;

    // Fine blade break-up
    const speck = (blades - 0.5) * 26;
    r += speck;
    g += speck * 1.2;
    b += speck * 0.6;

    return [r, g, b, 110 + detail * 90 + blades * 40];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Packed gravel path: warm sand with scattered pebbles and worn tracks. */
export function gravelTexture(repeat = 1) {
  const { colorCanvas, bumpCanvas } = generate('gravel', 512, (u, v) => {
    const base = tiledFbm(u, v, 8, 4) + 0.5;
    const pebble = tiledFbm(u, v, 34, 2, 1) + 0.5;
    const grit = tiledFbm(u, v, 90, 2, 2) + 0.5;

    const stone = Math.pow(pebble, 3) * 1.6;

    let r = mix(132, 168, base) + stone * 34 + (grit - 0.5) * 20;
    let g = mix(116, 150, base) + stone * 28 + (grit - 0.5) * 18;
    let b = mix(94, 122, base) + stone * 22 + (grit - 0.5) * 14;

    return [r, g, b, 90 + stone * 120 + grit * 45];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Timber: directional grain with knots, tinted to whatever wood is needed. */
export function woodTexture(tint = 0x8a6244, repeat = 1) {
  const key = `wood-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 512, (u, v) => {
    // Wide across the grain, tight along it, which reads as long timber lines
    const grain = tiledFbm(u, v, 3, 4) + 0.5;
    const fine = tiledFbm(u, v * 0.18, 26, 3, 1) + 0.5;
    const rings = (Math.sin(fine * 22 + grain * 7) + 1) * 0.5;
    const knots = Math.pow(Math.max(0, tiledFbm(u, v, 6, 2, 3) + 0.5), 7) * 2;

    const shade = mix(0.72, 1.12, rings * 0.6 + grain * 0.4) - knots * 0.35;

    return [
      base.r * 255 * shade,
      base.g * 255 * shade,
      base.b * 255 * shade,
      120 + rings * 90 + knots * 40
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Lime plaster / render for the cottage walls. */
export function plasterTexture(tint = 0xf0e2cd, repeat = 1) {
  const key = `plaster-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 512, (u, v) => {
    const mottle = tiledFbm(u, v, 6, 4) + 0.5;
    const grit = tiledFbm(u, v, 80, 2, 1) + 0.5;
    const shade = mix(0.88, 1.06, mottle) + (grit - 0.5) * 0.05;

    return [
      base.r * 255 * shade,
      base.g * 255 * shade,
      base.b * 255 * shade,
      140 + mottle * 70 + grit * 30
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Weathered clay roof tiles, laid in overlapping rows. */
export function roofTexture(tint = 0x9b5a4a, repeat = 1) {
  const key = `roof-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 512, (u, v) => {
    const rows = 10;
    const cols = 14;
    const rowIndex = Math.floor(v * rows);
    const rowFraction = v * rows - rowIndex;
    const offset = rowIndex % 2 === 0 ? 0 : 0.5;
    const colFraction = (u * cols + offset) % 1;

    const weather = tiledFbm(u, v, 7, 4) + 0.5;

    // Darken the tile joins
    const joinV = Math.pow(Math.min(rowFraction, 1 - rowFraction) * 2, 0.35);
    const joinU = Math.pow(Math.min(colFraction, 1 - colFraction) * 2, 0.5);
    const join = Math.min(1, joinV * 0.6 + joinU * 0.6);

    const shade = mix(0.6, 1.1, weather) * mix(0.55, 1, join);

    return [
      base.r * 255 * shade,
      base.g * 255 * shade,
      base.b * 255 * shade,
      40 + join * 170 + weather * 45
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Woven cloth for canopies, cushions and her dress. */
export function fabricTexture(tint = 0xe9a3ab, repeat = 1) {
  const key = `fabric-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 256, (u, v, x, y) => {
    const weave = (Math.sin(x * 0.9) * Math.sin(y * 0.9) + 1) * 0.5;
    const slub = tiledFbm(u, v, 18, 3) + 0.5;
    const shade = mix(0.9, 1.08, weave * 0.6 + slub * 0.4);

    return [
      base.r * 255 * shade,
      base.g * 255 * shade,
      base.b * 255 * shade,
      110 + weave * 90 + slub * 45
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Quarried stone for plinths, walls and paving. */
export function stoneTexture(tint = 0x9a9289, repeat = 1) {
  const key = `stone-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 512, (u, v) => {
    const body = tiledFbm(u, v, 6, 5) + 0.5;
    const pits = Math.pow(Math.max(0, tiledFbm(u, v, 26, 3, 1) + 0.5), 4) * 1.5;
    const grit = tiledFbm(u, v, 85, 2, 2) + 0.5;

    const shade = mix(0.72, 1.1, body) - pits * 0.25 + (grit - 0.5) * 0.06;

    return [
      base.r * 255 * shade,
      base.g * 255 * shade,
      base.b * 255 * shade,
      110 + body * 90 - pits * 60 + grit * 30
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/** Foliage: dappled leaf clusters rather than a single flat green. */
export function foliageTexture(tint = 0x3f6236, repeat = 1) {
  const key = `foliage-${tint}`;
  const base = new THREE.Color(tint);

  const { colorCanvas, bumpCanvas } = generate(key, 256, (u, v) => {
    const clumps = tiledFbm(u, v, 7, 4) + 0.5;
    const leaves = tiledFbm(u, v, 30, 3, 1) + 0.5;
    const shade = mix(0.6, 1.35, clumps * 0.55 + leaves * 0.45);

    return [
      base.r * 255 * shade,
      base.g * 255 * shade * 1.04,
      base.b * 255 * shade,
      90 + clumps * 100 + leaves * 60
    ];
  });

  return {
    map: finish(colorCanvas, { repeat }),
    bumpMap: finish(bumpCanvas, { repeat, colorSpace: THREE.NoColorSpace })
  };
}

/**
 * Animated water normal map: two crossing wave trains encoded as a normal.
 * Scrolling this over the pond surface is what sells the water as moving.
 */
export function waterNormalTexture(repeat = 1) {
  const key = 'water-normal';
  if (cache.has(key)) {
    const cached = cache.get(key);
    return finish(cached.colorCanvas, { repeat, colorSpace: THREE.NoColorSpace });
  }

  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(size, size);

  const heightAt = (x, y) => {
    const u = (x / size) * Math.PI * 2;
    const v = (y / size) * Math.PI * 2;
    return (
      Math.sin(u * 3 + Math.sin(v * 2) * 0.6) * 0.5 +
      Math.sin(v * 4 - Math.cos(u * 3) * 0.4) * 0.35 +
      fbm(x * 0.05, y * 0.05, 3) * 0.6
    );
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const left = heightAt((x - 1 + size) % size, y);
      const right = heightAt((x + 1) % size, y);
      const up = heightAt(x, (y - 1 + size) % size);
      const down = heightAt(x, (y + 1) % size);

      // Central-difference gradient, packed into a tangent-space normal
      const dx = (right - left) * 0.5;
      const dy = (down - up) * 0.5;
      const length = Math.sqrt(dx * dx + dy * dy + 1);

      data.data[i] = ((-dx / length) * 0.5 + 0.5) * 255;
      data.data[i + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      data.data[i + 2] = (1 / length) * 0.5 * 255 + 127;
      data.data[i + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  cache.set(key, { colorCanvas: canvas, bumpCanvas: canvas });
  return finish(canvas, { repeat, colorSpace: THREE.NoColorSpace });
}
