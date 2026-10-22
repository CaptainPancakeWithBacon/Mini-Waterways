import { config, ticks } from './config';
import { isFreeSpot, setTile } from './grid';
import { nextInt } from './rng';
import { QUAY, WHARF, type State } from './types';

export const demandInterval = (s: State) => Math.round(ticks(config.demandIntervalStartSec) / s.difficulty) || 1;
export const spawnDelay = (s: State) => Math.round(ticks(config.spawnDelayStartSec) / s.difficulty) || 1;

export function addWharf(s: State, x: number, y: number) {
  setTile(s, x, y, WHARF);
  s.wharves.push({ id: s.nextId++, x, y });
}

export function addQuay(s: State, x: number, y: number) {
  setTile(s, x, y, QUAY);
  s.quays.push({ id: s.nextId++, x, y, pending: 0, ring: 0, nextDemandTick: s.tick + demandInterval(s) });
}

const far = (a: { x: number; y: number }[], x: number, y: number) =>
  a.every((b) => Math.abs(b.x - x) + Math.abs(b.y - y) >= config.minWharfQuayDistance);

/**
 * Zet het volgende gebouw neer: een wharf als er niet meer wharves dan quays zijn, anders een quay.
 * Is er geen plek, dan stijgt de vraag bij een bestaand quay (zoals de community het van Motorways beschrijft).
 */
export function spawnOne(s: State) {
  const wantWharf = s.wharves.length <= s.quays.length;
  for (let n = 0; n < config.spawnAttempts; n++) {
    const x = nextInt(s.rng, s.width);
    const y = nextInt(s.rng, s.height);
    if (!isFreeSpot(s, x, y) || !far(wantWharf ? s.quays : s.wharves, x, y)) continue;
    if (wantWharf) addWharf(s, x, y);
    else addQuay(s, x, y);
    return;
  }
  if (s.quays.length > 0) s.quays[nextInt(s.rng, s.quays.length)]!.pending++;
}
