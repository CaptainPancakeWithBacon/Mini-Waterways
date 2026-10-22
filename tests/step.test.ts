import { describe, expect, it } from 'vitest';
import { config, ticks } from '../src/sim/config';
import { tileAt } from '../src/sim/grid';
import { addQuay, addWharf } from '../src/sim/spawn';
import { createState } from '../src/sim/state';
import { step, ticksPerTile } from '../src/sim/step';
import { CANAL, type Command, type State } from '../src/sim/types';

/** Wharf (0,0), quay (6,0), kanaal ertussen op rij 0. */
function line(): State {
  const s = createState('step');
  s.nextSpawnTick = Infinity; // geen willekeurige gebouwen in deze tests
  addWharf(s, 0, 0);
  addQuay(s, 6, 0);
  s.quays[0]!.nextDemandTick = Infinity;
  return s;
}
const canalLine: Command[] = [1, 2, 3, 4, 5].map((x) => ({ type: 'place', x, y: 0 }));

describe('step', () => {
  it('delivers cargo, scores and sends the barge home', () => {
    const s = line();
    s.quays[0]!.pending = 1;
    step(s, canalLine);
    for (let i = 0; i < ticksPerTile() * 6 + 1; i++) step(s);
    expect(s.score).toBe(1);
    expect(s.quays[0]!.pending).toBe(0);
    expect(s.barges[0]?.returning).toBe(true);
    for (let i = 0; i < ticksPerTile() * 6 + 1; i++) step(s);
    expect(s.barges).toHaveLength(0);
  });

  it('does not send a barge without a connection', () => {
    const s = line();
    s.quays[0]!.pending = 1;
    for (let i = 0; i < 100; i++) step(s);
    expect(s.barges).toHaveLength(0);
  });

  it('refuses to remove a canal tile that a barge still needs', () => {
    const s = line();
    s.quays[0]!.pending = 1;
    step(s, canalLine);
    expect(s.barges).toHaveLength(1);
    step(s, [{ type: 'remove', x: 3, y: 0 }]);
    expect(tileAt(s, 3, 0)).toBe(CANAL);
  });

  it('removes unused canal', () => {
    const s = line();
    step(s, canalLine);
    step(s, [{ type: 'remove', x: 3, y: 0 }]);
    expect(tileAt(s, 3, 0)).toBe(0);
  });

  it('ends the run when a quay stays over capacity for the full ring', () => {
    const s = line();
    s.quays[0]!.pending = config.quayCapacity + 1;
    const ringTicks = ticks(config.ringSeconds);
    for (let i = 0; i < ringTicks - 1; i++) step(s);
    expect(s.over).toBe(false);
    step(s);
    expect(s.over).toBe(true);
  });

  it('drains the ring when the quay is back under capacity', () => {
    const s = line();
    s.quays[0]!.pending = config.quayCapacity + 1;
    for (let i = 0; i < 100; i++) step(s);
    s.quays[0]!.pending = 0;
    for (let i = 0; i < 100; i++) step(s);
    expect(s.quays[0]!.ring).toBe(0);
    expect(s.over).toBe(false);
  });
});
