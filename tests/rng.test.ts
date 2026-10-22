import { describe, expect, it } from 'vitest';
import { nextFloat, nextInt, seedRng } from '../src/sim/rng';

const draw = (seed: string, n = 5) => {
  const r = seedRng(seed);
  return Array.from({ length: n }, () => nextFloat(r));
};

describe('rng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draw('a')).toEqual(draw('a'));
  });

  it('gives a different sequence for another seed', () => {
    expect(draw('a')).not.toEqual(draw('b'));
  });

  it('stays in range', () => {
    const r = seedRng('range');
    for (let i = 0; i < 1000; i++) {
      const f = nextFloat(r);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      expect(nextInt(r, 7)).toBeLessThan(7);
    }
  });
});
