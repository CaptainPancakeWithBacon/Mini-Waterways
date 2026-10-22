import { describe, expect, it } from 'vitest';
import { hashState, runReplay } from '../src/sim/replay';
import { newGame } from '../src/sim/state';
import type { Command, Replay } from '../src/sim/types';

/** Kanaal in een L-vorm tussen de eerste wharf en het eerste quay van deze seed. */
function lShape(seed: string): Command[] {
  const s = newGame(seed);
  const w = s.wharves[0]!;
  const q = s.quays[0]!;
  const cells: [number, number][] = [];
  for (let x = w.x; x !== q.x; x += Math.sign(q.x - x)) cells.push([x, w.y]);
  for (let y = w.y; y !== q.y; y += Math.sign(q.y - y)) cells.push([q.x, y]);
  return cells
    .filter(([x, y]) => !(x === w.x && y === w.y) && !(x === q.x && y === q.y))
    .map(([x, y]) => ({ type: 'place', x, y }));
}

const seed = 'golden';
const replay: Replay = { seed, commands: lShape(seed).map((cmd) => ({ tick: 0, cmd })) };
const TICKS = 3000;

describe('golden replay', () => {
  it('plays the same run twice', () => {
    expect(hashState(runReplay(replay, TICKS))).toBe(hashState(runReplay(replay, TICKS)));
  });

  it('delivers cargo along the player-built canal', () => {
    expect(runReplay(replay, TICKS).score).toBeGreaterThan(0);
  });

  // Breekt deze test na een bewuste regelwijziging, controleer dan eerst dat de wijziging
  // bedoeld is en zet daarna de nieuwe hash neer.
  it('ends in the recorded state', () => {
    expect(hashState(runReplay(replay, TICKS))).toBe('fb1236ae');
  });
});
