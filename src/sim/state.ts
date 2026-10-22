import { config, ticks } from './config';
import { seedRng } from './rng';
import { spawnOne } from './spawn';
import { genHeights } from './terrain';
import { EMPTY, type Mode, type State } from './types';

/** Wereld met terrein maar zonder gebouwen. */
export function createState(seed: string, mode: Mode = 'classic', waterOn = false): State {
  const { width, height } = config.grid;
  const rng = seedRng(seed);
  const heights = genHeights(rng, width, height);
  return {
    tick: 0,
    rng,
    seed,
    mode,
    waterOn,
    width,
    height,
    tiles: new Array<number>(width * height).fill(EMPTY),
    heights,
    wharves: [],
    quays: [],
    barges: [],
    locks: [],
    score: 0,
    over: false,
    nextId: 1,
    nextSpawnTick: ticks(config.spawnDelayStartSec),
    difficulty: 1,
    week: 0,
    nextWeekTick: ticks(config.weekSeconds),
    milestoneNext: config.endlessMilestone,
    choice: null,
    lastTool: null,
    tilesLeft: config.startTiles,
    lockCharges: config.startLocks,
    pondCharges: 0,
    bargeBonus: 0,
    speedBonus: 0,
    colours: 1,
    water: config.water.max,
  };
}

/** Beginstand: één wharf en één quay op verschillende niveaus. */
export function newGame(seed: string, mode: Mode = 'classic', waterOn = false): State {
  const s = createState(seed, mode, waterOn);
  spawnOne(s);
  spawnOne(s, true);
  return s;
}
