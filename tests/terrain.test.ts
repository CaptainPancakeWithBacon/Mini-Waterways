import { describe, expect, it } from 'vitest';
import { config } from '../src/sim/config';
import { createState } from '../src/sim/state';

describe('terrain', () => {
  const s = createState('terrain');

  it('uses every level about equally', () => {
    for (let l = 0; l < config.levels; l++) {
      const n = s.heights.filter((h) => h === l).length;
      expect(Math.abs(n - s.heights.length / config.levels)).toBeLessThan(2);
    }
  });

  it('never jumps more than one level between neighbours, so a lock can bridge any step', () => {
    for (const seed of ['t1', 't2', 't3', 't4', 't5']) {
      const t = createState(seed);
      for (let y = 0; y < t.height; y++) {
        for (let x = 0; x < t.width; x++) {
          const h = t.heights[y * t.width + x]!;
          if (x + 1 < t.width) expect(Math.abs(h - t.heights[y * t.width + x + 1]!)).toBeLessThanOrEqual(1);
          if (y + 1 < t.height) expect(Math.abs(h - t.heights[(y + 1) * t.width + x]!)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('is the same for the same seed', () => {
    expect(createState('terrain').heights).toEqual(s.heights);
  });
});
