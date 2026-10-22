import { describe, expect, it } from 'vitest';
import { config, ticks } from '../src/sim/config';
import { newGame } from '../src/sim/state';
import { step } from '../src/sim/step';
import type { State } from '../src/sim/types';

const toChoice = (s: State) => {
  for (let i = 0; i < ticks(config.weekSeconds) + 5 && !s.choice; i++) step(s);
};

describe('weeks and cards', () => {
  it('offers two cards with different tools at the end of the week and stops time', () => {
    const s = newGame('weeks');
    s.quays[0]!.nextDemandTick = Infinity;
    toChoice(s);
    expect(s.choice).toHaveLength(2);
    expect(s.choice![0]!.tool).not.toBe(s.choice![1]!.tool);
    const t = s.tick;
    for (let i = 0; i < 50; i++) step(s);
    expect(s.tick).toBe(t);
  });

  it('applies the picked card and unlocks colours as weeks pass', () => {
    const s = newGame('weeks2');
    s.quays[0]!.nextDemandTick = Infinity;
    toChoice(s);
    const card = s.choice![1]!;
    const tiles = s.tilesLeft;
    step(s, [{ type: 'pick', index: 1 }]);
    expect(s.choice).toBeNull();
    expect(s.tilesLeft).toBe(tiles + card.tiles);
    expect(s.week).toBe(1);
    s.week = 3;
    s.choice = [card, card];
    step(s, [{ type: 'pick', index: 0 }]);
    expect(s.colours).toBe(3);
  });

  it('ignores an out-of-range pick', () => {
    const s = newGame('weeks3');
    s.quays[0]!.nextDemandTick = Infinity;
    toChoice(s);
    step(s, [{ type: 'pick', index: 5 }]);
    expect(s.choice).not.toBeNull();
  });
});
