import { describe, expect, it } from 'vitest';
import { heightAt } from '../src/sim/grid';
import { hashState, runReplay } from '../src/sim/replay';
import { newGame } from '../src/sim/state';
import type { Command, Replay } from '../src/sim/types';

/**
 * Kanaal in een L-vorm tussen de eerste wharf en het eerste quay van deze seed, met één sluis op
 * de plek waar het terrein een niveau stijgt. Null als de route daar niet netjes mee kan.
 */
function lShape(seed: string): Command[] | null {
  const s = newGame(seed);
  const w = s.wharves[0]!;
  const q = s.quays[0]!;
  const cells: [number, number][] = [];
  for (let x = w.x; x !== q.x; x += Math.sign(q.x - x)) cells.push([x, w.y]);
  for (let y = w.y; y !== q.y; y += Math.sign(q.y - y)) cells.push([q.x, y]);
  cells.push([q.x, q.y]);

  const cmds: Command[] = [];
  let locks = 0;
  for (let i = 0; i < cells.length; i++) {
    const [x, y] = cells[i]!;
    const isBuilding = i === 0 || i === cells.length - 1;
    const next = cells[i + 1];
    if (next) {
      const d = heightAt(s, next[0], next[1]) - heightAt(s, x, y);
      if (Math.abs(d) > 1) return null;
      if (d !== 0) {
        const lower = d > 0 ? cells[i]! : next;
        if (lower === cells[0] || lower === cells.at(-1)) return null;
        cmds.push({ type: 'lock', x: lower[0], y: lower[1] });
        locks++;
      }
    }
    if (!isBuilding && !cmds.some((c) => c.type === 'lock' && 'x' in c && c.x === x && c.y === y)) {
      cmds.push({ type: 'place', x, y });
    }
  }
  return locks === 1 ? cmds : null;
}

// eerste seed waarvan de route precies één sluis nodig heeft
let seed = '';
let route: Command[] = [];
for (let i = 0; !route.length; i++) {
  seed = `golden-${i}`;
  route = lShape(seed) ?? [];
}

const replay: Replay = {
  seed,
  commands: [
    ...route.map((cmd) => ({ tick: 0, cmd })),
    { tick: 3000, cmd: { type: 'pick', index: 0 } },
  ],
};
const TICKS = 4500;

describe('golden replay', () => {
  it('plays the same run twice', () => {
    expect(hashState(runReplay(replay, TICKS))).toBe(hashState(runReplay(replay, TICKS)));
  });

  it('delivers cargo through the lock and passes a week', () => {
    const s = runReplay(replay, TICKS);
    expect(s.score).toBeGreaterThan(0);
    expect(s.week).toBe(1);
  });

  // Breekt deze test na een bewuste regelwijziging, controleer dan eerst dat de wijziging
  // bedoeld is en zet daarna de nieuwe hash neer.
  it('ends in the recorded state', () => {
    expect(hashState(runReplay(replay, TICKS))).toBe('3d0b75f5');
  });
});
