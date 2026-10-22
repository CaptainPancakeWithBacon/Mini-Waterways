import { describe, expect, it } from 'vitest';
import { config, ticks } from '../src/sim/config';
import { tileAt } from '../src/sim/grid';
import { addQuay, addWharf } from '../src/sim/spawn';
import { createState } from '../src/sim/state';
import { step, ticksPerTile } from '../src/sim/step';
import { LOCK, type Command, type State } from '../src/sim/types';

/** Wharf (0,0) op niveau 0, quay (6,0) op niveau 1, trap tussen x=3 en x=4. */
function stair(opts: { water?: boolean } = {}): State {
  const s = createState('stair', 'classic', opts.water ?? false);
  s.heights.fill(0);
  for (let y = 0; y < s.height; y++) for (let x = 4; x < s.width; x++) s.heights[y * s.width + x] = 1;
  s.nextSpawnTick = Infinity;
  s.nextWeekTick = Infinity;
  addWharf(s, 0, 0);
  addQuay(s, 6, 0);
  s.quays[0]!.nextDemandTick = Infinity;
  s.quays[0]!.pending = 1;
  return s;
}
const build: Command[] = [
  { type: 'place', x: 1, y: 0 },
  { type: 'place', x: 2, y: 0 },
  { type: 'lock', x: 3, y: 0 },
  { type: 'place', x: 4, y: 0 },
  { type: 'place', x: 5, y: 0 },
];
/** Ticks tot de eerste aflevering, of null. */
const untilScore = (s: State, max = 2000) => {
  for (let i = 0; i < max; i++) {
    step(s);
    if (s.score > 0) return i;
  }
  return null;
};

describe('locks', () => {
  it('blocks a step in height without a lock', () => {
    const s = stair();
    step(s, build.map((c) => (c.type === 'lock' ? { type: 'place', x: 3, y: 0 } : c)));
    for (let i = 0; i < 200; i++) step(s);
    expect(s.barges).toHaveLength(0);
  });

  it('carries a barge up through a lock, and the chamber waits on the high side afterwards', () => {
    const s = stair();
    step(s, build);
    expect(tileAt(s, 3, 0)).toBe(LOCK);
    const t = untilScore(s);
    expect(t).not.toBeNull();
    // minstens één cyclus bovenop de gewone reistijd
    expect(t!).toBeGreaterThan(ticksPerTile(s) * 6 + ticks(config.lockCycleSeconds) - 5);
    expect(s.locks[0]!.state).toBe('high');
  });

  it('is faster with a side pond', () => {
    const plain = stair();
    step(plain, build);
    const pond = stair();
    pond.pondCharges = 1;
    step(pond, [...build, { type: 'pond', x: 3, y: 0 }]);
    expect(pond.locks[0]!.pond).toBe(true);
    expect(untilScore(pond)!).toBeLessThan(untilScore(plain)!);
  });

  it('only places a lock where the terrain steps up, and spends a charge', () => {
    const s = stair();
    step(s, [{ type: 'lock', x: 1, y: 5 }]);
    expect(s.locks).toHaveLength(0);
    expect(s.lockCharges).toBe(config.startLocks);
    step(s, [{ type: 'lock', x: 3, y: 5 }]);
    expect(s.locks).toHaveLength(1);
    expect(s.lockCharges).toBe(config.startLocks - 1);
  });

  it('refunds the charge when an unused lock is removed', () => {
    const s = stair();
    step(s, [{ type: 'lock', x: 3, y: 5 }]);
    step(s, [{ type: 'remove', x: 3, y: 5 }]);
    expect(s.locks).toHaveLength(0);
    expect(s.lockCharges).toBe(config.startLocks);
  });
});

describe('water budget', () => {
  it('makes a barge wait at an empty reservoir and lets it through after rain', () => {
    const s = stair({ water: true });
    s.water = 0;
    step(s, build);
    for (let i = 0; i < 150; i++) step(s);
    expect(s.score).toBe(0);
    s.water = config.water.max;
    expect(untilScore(s)).not.toBeNull();
    expect(s.water).toBeLessThan(config.water.max);
  });

  it('refills slower in a dry week', () => {
    const wet = stair({ water: true });
    const dry = stair({ water: true });
    wet.water = dry.water = 0;
    dry.week = config.water.dryEveryWeeks - 1;
    for (let i = 0; i < 600; i++) {
      step(wet);
      step(dry);
    }
    expect(dry.water).toBeLessThan(wet.water);
  });
});
