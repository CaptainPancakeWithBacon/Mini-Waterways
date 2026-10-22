import { config, ticks } from './config';
import { heightAt, isFreeSpot, setTile } from './grid';
import { nextInt } from './rng';
import { QUAY, WHARF, type State } from './types';

export const demandInterval = (s: State) => Math.round(ticks(config.demandIntervalStartSec) / s.difficulty) || 1;
export const spawnDelay = (s: State) => Math.round(ticks(config.spawnDelayStartSec) / s.difficulty) || 1;

export function addWharf(s: State, x: number, y: number, colour = 0) {
  setTile(s, x, y, WHARF);
  s.wharves.push({ id: s.nextId++, x, y, colour });
}

export function addQuay(s: State, x: number, y: number, colour = 0) {
  setTile(s, x, y, QUAY);
  s.quays.push({ id: s.nextId++, x, y, colour, pending: 0, ring: 0, nextDemandTick: s.tick + demandInterval(s) });
}

/**
 * Zet het volgende gebouw neer. De kleur met de minste gebouwen is aan de beurt (zo krijgt een nieuwe kleur
 * meteen een paar), en die zet een wharf als er niet meer wharves dan quays van die kleur zijn, anders een quay.
 * Is er geen plek, dan stijgt de vraag bij een bestaand quay (zoals de community het van Motorways beschrijft).
 * `differentHeight`: het tegenstuk moet op een ander niveau liggen, zodat de eerste route een sluis nodig heeft.
 */
export function spawnOne(s: State, differentHeight = false) {
  let colour = 0;
  let fewest = Infinity;
  for (let c = 0; c < s.colours; c++) {
    const n = s.wharves.filter((w) => w.colour === c).length + s.quays.filter((q) => q.colour === c).length;
    if (n < fewest) {
      fewest = n;
      colour = c;
    }
  }
  const wantWharf = s.wharves.filter((w) => w.colour === colour).length <= s.quays.filter((q) => q.colour === colour).length;
  const opposite = (wantWharf ? s.quays : s.wharves).filter((b) => b.colour === colour);

  for (let n = 0; n < config.spawnAttempts; n++) {
    const x = nextInt(s.rng, s.width);
    const y = nextInt(s.rng, s.height);
    if (!isFreeSpot(s, x, y)) continue;
    if (!opposite.every((b) => Math.abs(b.x - x) + Math.abs(b.y - y) >= config.minWharfQuayDistance)) continue;
    if (differentHeight && !opposite.every((b) => heightAt(s, b.x, b.y) !== heightAt(s, x, y))) continue;
    if (wantWharf) addWharf(s, x, y, colour);
    else addQuay(s, x, y, colour);
    return;
  }
  if (s.quays.length > 0) s.quays[nextInt(s.rng, s.quays.length)]!.pending++;
}
