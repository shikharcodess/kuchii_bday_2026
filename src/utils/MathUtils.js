/** Small shared math helpers used by movement, camera and animation code. */

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Frame-rate independent smoothing (exponential decay).
 * `ease` is roughly "how many times per second we close the gap".
 */
export const damp = (current, target, ease, dt) =>
  lerp(current, target, 1 - Math.exp(-ease * dt));

/** Shortest signed angular difference between two angles, in radians. */
export function angleDelta(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

/** Smoothly rotate `current` toward `target` respecting wrap-around. */
export function dampAngle(current, target, ease, dt) {
  return current + angleDelta(current, target) * (1 - Math.exp(-ease * dt));
}

/** Deterministic pseudo-random in [0,1) so world layout is identical every load. */
export function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
