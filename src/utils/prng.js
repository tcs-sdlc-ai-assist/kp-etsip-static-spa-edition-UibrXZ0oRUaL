/**
 * Deterministic pseudo-random number generator (seeded PRNG) using the mulberry32 algorithm.
 * Ensures reproducible data generation across sessions given the same seed.
 */

/**
 * Converts a string seed into a numeric hash using a simple DJB2-like algorithm.
 * @param {string|number} seed - The seed value.
 * @returns {number} A 32-bit integer hash.
 */
const hashSeed = (seed) => {
  if (typeof seed === 'number') {
    return seed >>> 0;
  }
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash >>> 0;
};

/**
 * Mulberry32 PRNG core function.
 * Returns a function that produces the next pseudo-random float in [0, 1) on each call.
 * @param {number} seed - A 32-bit unsigned integer seed.
 * @returns {() => number} A function returning the next pseudo-random float.
 */
const mulberry32 = (seed) => {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Creates a deterministic pseudo-random number generator with utility methods.
 *
 * @param {string|number} seed - The seed for reproducible random generation.
 * @returns {{
 *   next: () => number,
 *   nextInt: (min: number, max: number) => number,
 *   nextFloat: () => number,
 *   pick: <T>(array: T[]) => T,
 *   shuffle: <T>(array: T[]) => T[],
 *   uuid: (prefix?: string) => string
 * }} An object with deterministic random utility methods.
 */
export const createPRNG = (seed) => {
  const numericSeed = hashSeed(seed);
  const rng = mulberry32(numericSeed);

  /**
   * Returns the next pseudo-random float in [0, 1).
   * @returns {number}
   */
  const next = () => rng();

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive).
   * @param {number} min - Minimum value (inclusive).
   * @param {number} max - Maximum value (inclusive).
   * @returns {number}
   */
  const nextInt = (min, max) => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return lo + Math.floor(rng() * (hi - lo + 1));
  };

  /**
   * Returns the next pseudo-random float in [0, 1).
   * Alias for next().
   * @returns {number}
   */
  const nextFloat = () => rng();

  /**
   * Picks a random element from the given array.
   * Returns undefined if the array is empty.
   * @template T
   * @param {T[]} array - The array to pick from.
   * @returns {T|undefined}
   */
  const pick = (array) => {
    if (!Array.isArray(array) || array.length === 0) {
      return undefined;
    }
    const index = Math.floor(rng() * array.length);
    return array[index];
  };

  /**
   * Returns a new array with elements shuffled deterministically (Fisher-Yates shuffle).
   * Does not mutate the original array.
   * @template T
   * @param {T[]} array - The array to shuffle.
   * @returns {T[]}
   */
  const shuffle = (array) => {
    if (!Array.isArray(array)) {
      return [];
    }
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  };

  /**
   * Generates a deterministic UUID-like string with an optional prefix.
   * Format: PREFIX + 8-4-4-4-12 hex characters (or without prefix if none provided).
   * @param {string} [prefix=''] - An optional prefix to prepend to the UUID.
   * @returns {string}
   */
  const uuid = (prefix = '') => {
    const hex = () => {
      const val = Math.floor(rng() * 16);
      return val.toString(16);
    };

    const segment = (length) => {
      let s = '';
      for (let i = 0; i < length; i++) {
        s += hex();
      }
      return s;
    };

    const id = `${segment(8)}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(12)}`;
    return prefix ? `${prefix}${id}` : id;
  };

  return {
    next,
    nextInt,
    nextFloat,
    pick,
    shuffle,
    uuid,
  };
};