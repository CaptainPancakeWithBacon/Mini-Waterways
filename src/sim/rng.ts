// Seeded RNG: xmur3 hashes a string seed into four 32-bit words, sfc32 draws from them.
// De state is een gewone array, zodat hij met de rest van State te serialiseren is.
export type Rng = [number, number, number, number];

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function seedRng(seed: string): Rng {
  const next = xmur3(seed);
  return [next(), next(), next(), next()];
}

/** Float in [0, 1). Muteert r. */
export function nextFloat(r: Rng): number {
  const t0 = (r[0] + r[1]) | 0;
  r[0] = r[1] ^ (r[1] >>> 9);
  r[1] = (r[2] + (r[2] << 3)) | 0;
  r[2] = (r[2] << 21) | (r[2] >>> 11);
  r[3] = (r[3] + 1) | 0;
  const t = (t0 + r[3]) | 0;
  r[2] = (r[2] + t) | 0;
  return (t >>> 0) / 4294967296;
}

/** Integer in [0, n). */
export function nextInt(r: Rng, n: number): number {
  return Math.floor(nextFloat(r) * n);
}
