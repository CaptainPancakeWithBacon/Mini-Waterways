import { describe, expect, it } from 'vitest';
import { config } from '../src/sim/config';
import { tileAt } from '../src/sim/grid';
import { newGame } from '../src/sim/state';
import { step } from '../src/sim/step';
import { CANAL, type Mode, type State } from '../src/sim/types';

const quiet = (mode: Mode, seed = 'mode'): State => {
  const s = newGame(seed, mode);
  s.nextSpawnTick = Infinity;
  s.quays[0]!.nextDemandTick = Infinity;
  return s;
};

describe('modes', () => {
  it('endless never ends the run on overflow', () => {
    const s = quiet('endless');
    s.quays[0]!.pending = config.quayCapacity + 5;
    for (let i = 0; i < 3000; i++) step(s);
    expect(s.over).toBe(false);
  });

  it('endless offers a card per milestone of deliveries instead of per week', () => {
    const s = quiet('endless');
    s.nextWeekTick = 0; // zou in classic meteen een kaart geven
    step(s);
    expect(s.choice).toBeNull();
    s.score = config.endlessMilestone;
    step(s);
    expect(s.choice).toHaveLength(2);
    expect(s.milestoneNext).toBe(config.endlessMilestone * 2);
  });

  it('expert makes placement permanent', () => {
    const s = quiet('expert');
    const x = (s.wharves[0]!.x + 1) % s.width;
    step(s, [{ type: 'place', x, y: s.wharves[0]!.y === 0 ? 1 : 0 }]);
    const y = s.wharves[0]!.y === 0 ? 1 : 0;
    expect(tileAt(s, x, y)).toBe(CANAL);
    step(s, [{ type: 'remove', x, y }]);
    expect(tileAt(s, x, y)).toBe(CANAL);
  });

  it('expert never offers the same tool twice in a row', () => {
    for (let n = 0; n < 20; n++) {
      const s = quiet('expert', `e${n}`);
      s.lastTool = 'lock';
      s.nextWeekTick = 0;
      step(s);
      expect(s.choice!.every((c) => c.tool !== 'lock')).toBe(true);
    }
  });

  it('expert ramps harder than classic', () => {
    const c = quiet('classic');
    const e = quiet('expert');
    for (let i = 0; i < 3000; i++) {
      c.nextWeekTick = e.nextWeekTick = Infinity;
      step(c);
      step(e);
    }
    expect(e.difficulty).toBeGreaterThan(c.difficulty);
  });
});
