import { describe, expect, it } from 'vitest';
import { config } from '../src/sim/config';
import { heightAt, tileAt } from '../src/sim/grid';
import { addQuay, addWharf, spawnOne } from '../src/sim/spawn';
import { createState, newGame } from '../src/sim/state';
import { CANAL, QUAY, WHARF } from '../src/sim/types';

describe('spawn', () => {
  it('never spawns within 1 tile of a building or on a canal', () => {
    const s = createState('spawn');
    for (let i = 0; i < 40; i++) {
      // vul de helft van het raster met kanaal en blijf spawnen
      if (i === 0) for (let x = 0; x < s.width; x += 2) for (let y = 0; y < s.height; y++) s.tiles[y * s.width + x] = CANAL;
      spawnOne(s);
    }
    const buildings = [...s.wharves, ...s.quays];
    for (const a of buildings) {
      expect(tileAt(s, a.x, a.y)).not.toBe(CANAL);
      for (const b of buildings) {
        if (a !== b) expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThan(1);
      }
    }
  });

  it('starts with one wharf and one quay, far apart and on different levels', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const s = newGame(seed);
      const w = s.wharves[0]!;
      const q = s.quays[0]!;
      expect(s.wharves).toHaveLength(1);
      expect(s.quays).toHaveLength(1);
      expect(Math.abs(w.x - q.x) + Math.abs(w.y - q.y)).toBeGreaterThanOrEqual(config.minWharfQuayDistance);
      expect(heightAt(s, w.x, w.y)).not.toBe(heightAt(s, q.x, q.y));
    }
  });

  it('gives every unlocked colour its own wharf and quay', () => {
    const s = newGame('colours');
    s.colours = 3;
    for (let i = 0; i < 4; i++) spawnOne(s);
    for (const c of [0, 1, 2]) {
      expect(s.wharves.filter((w) => w.colour === c).length).toBeGreaterThanOrEqual(1);
    }
    expect(s.quays.filter((q) => q.colour === 1).length).toBeGreaterThanOrEqual(1);
  });

  it('raises demand at a quay when the grid is full', () => {
    const s = createState('full');
    addWharf(s, 0, 0);
    addQuay(s, 10, 10);
    s.tiles.fill(CANAL);
    s.tiles[0] = WHARF;
    s.tiles[10 * s.width + 10] = QUAY;
    spawnOne(s);
    expect(s.quays[0]!.pending).toBe(1);
  });
});
