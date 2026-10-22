import type { Rng } from './rng';

export const EMPTY = 0;
export const CANAL = 1;
export const WHARF = 2;
export const QUAY = 3;

export type Pos = [number, number];

export interface Wharf {
  id: number;
  x: number;
  y: number;
}

export interface Quay {
  id: number;
  x: number;
  y: number;
  /** wachtende lading */
  pending: number;
  /** ticks dat het quay overvol is, 0 tot ringTicks */
  ring: number;
  nextDemandTick: number;
}

export interface Barge {
  id: number;
  wharfId: number;
  quayId: number;
  /** tegels van wharf naar quay, daarna omgedraaid voor de terugweg */
  path: Pos[];
  /** index in path van de tegel waar de boot vandaan komt */
  i: number;
  /** ticks onderweg naar path[i + 1] */
  sub: number;
  returning: boolean;
}

export interface State {
  tick: number;
  rng: Rng;
  width: number;
  height: number;
  /** rij na rij: index = y * width + x */
  tiles: number[];
  wharves: Wharf[];
  quays: Quay[];
  barges: Barge[];
  score: number;
  over: boolean;
  nextId: number;
  nextSpawnTick: number;
  /** groeit geometrisch, deelt alle intervallen */
  difficulty: number;
}

export type Command = { type: 'place' | 'remove'; x: number; y: number };

export interface Replay {
  seed: string;
  commands: { tick: number; cmd: Command }[];
}
