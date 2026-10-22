import { describe, expect, it } from 'vitest';
import { config } from '../src/sim/config';

describe('config', () => {
  it('has a positive tick rate and a non-empty grid', () => {
    expect(config.tickRate).toBeGreaterThan(0);
    expect(config.grid.width * config.grid.height).toBeGreaterThan(0);
  });
});
