import type { Rng } from './rng';

export const EMPTY = 0;
export const CANAL = 1;
export const WHARF = 2;
export const QUAY = 3;
export const LOCK = 4;

export type Pos = [number, number];
export type Mode = 'classic' | 'endless' | 'expert';
export type Tool = 'lock' | 'pond' | 'boat' | 'speed';
export type Side = 'low' | 'high';

export interface Card {
  tiles: number;
  tool: Tool;
}

export interface Wharf {
  id: number;
  x: number;
  y: number;
  colour: number;
}

export interface Quay {
  id: number;
  x: number;
  y: number;
  colour: number;
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
  colour: number;
  /** tegels van wharf naar quay, daarna omgedraaid voor de terugweg */
  path: Pos[];
  /** index in path van de tegel waar de boot vandaan komt */
  i: number;
  /** ticks onderweg naar path[i + 1] */
  sub: number;
  returning: boolean;
}

/**
 * Een sluis ligt op hoogte L en verbindt buren op L ('low') en L+1 ('high').
 * De kamer staat op één kant; wisselen kost een cyclus.
 */
export interface Lock {
  x: number;
  y: number;
  state: Side;
  /** boot die in de kamer ligt */
  occupant: number | null;
  /** boot die de lege kamer heeft laten wisselen en als eerste mag */
  reserved: number | null;
  cycleLeft: number;
  pond: boolean;
}

export interface State {
  tick: number;
  rng: Rng;
  seed: string;
  mode: Mode;
  waterOn: boolean;
  width: number;
  height: number;
  /** rij na rij: index = y * width + x */
  tiles: number[];
  /** terreinhoogte per tegel, 0 tot levels - 1 */
  heights: number[];
  wharves: Wharf[];
  quays: Quay[];
  barges: Barge[];
  locks: Lock[];
  score: number;
  over: boolean;
  nextId: number;
  nextSpawnTick: number;
  /** groeit geometrisch, deelt alle intervallen */
  difficulty: number;
  week: number;
  nextWeekTick: number;
  milestoneNext: number;
  /** openstaande keuze: de sim staat stil tot er gekozen is */
  choice: Card[] | null;
  lastTool: Tool | null;
  tilesLeft: number;
  lockCharges: number;
  pondCharges: number;
  bargeBonus: number;
  speedBonus: number;
  colours: number;
  water: number;
}

export type Command =
  | { type: 'place' | 'remove' | 'lock' | 'pond'; x: number; y: number }
  | { type: 'pick'; index: number };

export interface Replay {
  seed: string;
  mode?: Mode;
  water?: boolean;
  commands: { tick: number; cmd: Command }[];
}
