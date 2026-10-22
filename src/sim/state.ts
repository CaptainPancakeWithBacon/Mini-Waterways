import { config, ticks } from './config';
import { seedRng } from './rng';
import { spawnOne } from './spawn';
import { EMPTY, type State } from './types';

/** Lege wereld zonder gebouwen. */
export function createState(seed: string): State {
  const { width, height } = config.grid;
  return {
    tick: 0,
    rng: seedRng(seed),
    width,
    height,
    tiles: new Array<number>(width * height).fill(EMPTY),
    wharves: [],
    quays: [],
    barges: [],
    score: 0,
    over: false,
    nextId: 1,
    nextSpawnTick: ticks(config.spawnDelayStartSec),
    difficulty: 1,
  };
}

/** Beginstand: één wharf en één quay. */
export function newGame(seed: string): State {
  const s = createState(seed);
  spawnOne(s);
  spawnOne(s);
  return s;
}
