import { config, ticks } from './config';
import { inBounds, setTile, tileAt } from './grid';
import { findPath } from './path';
import { demandInterval, spawnDelay, spawnOne } from './spawn';
import { CANAL, EMPTY, type Barge, type Command, type Quay, type State, type Wharf } from './types';

/** Ticks die een boot over één tegel doet. */
export const ticksPerTile = () => Math.max(1, Math.round(config.tickRate / config.bargeSpeedTilesPerSec));

function apply(s: State, c: Command) {
  if (!inBounds(s, c.x, c.y)) return;
  if (c.type === 'place') {
    if (tileAt(s, c.x, c.y) === EMPTY) setTile(s, c.x, c.y, CANAL);
  } else if (tileAt(s, c.x, c.y) === CANAL) {
    // weghalen kan niet onder het pad van een boot: dan zou die vastlopen
    const used = s.barges.some((b) => b.path.some(([x, y]) => x === c.x && y === c.y));
    if (!used) setTile(s, c.x, c.y, EMPTY);
  }
}

const targeted = (s: State, q: Quay) => s.barges.filter((b) => b.quayId === q.id && !b.returning).length;

function dispatch(s: State, w: Wharf) {
  if (s.barges.filter((b) => b.wharfId === w.id).length >= config.maxBargesPerWharf) return;
  const open = s.quays
    .map((q) => ({ q, want: q.pending - targeted(s, q) }))
    .filter((c) => c.want > 0)
    .sort((a, b) => b.want - a.want || a.q.id - b.q.id);
  for (const { q } of open) {
    const path = findPath(
      s.width,
      s.height,
      (x, y) => tileAt(s, x, y) === CANAL || (x === q.x && y === q.y) || (x === w.x && y === w.y),
      [w.x, w.y],
      [q.x, q.y],
    );
    if (path) {
      const barge: Barge = { id: s.nextId++, wharfId: w.id, quayId: q.id, path, i: 0, sub: 0, returning: false };
      s.barges.push(barge);
      return;
    }
  }
}

function moveBarges(s: State) {
  const perTile = ticksPerTile();
  s.barges = s.barges.filter((b) => {
    if (++b.sub < perTile) return true;
    b.sub = 0;
    b.i++;
    if (b.i < b.path.length - 1) return true;
    if (b.returning) return false;
    // aangekomen bij het quay: afleveren en terugvaren
    const q = s.quays.find((x) => x.id === b.quayId)!;
    q.pending = Math.max(0, q.pending - 1);
    s.score++;
    b.path.reverse();
    b.i = 0;
    b.returning = true;
    return true;
  });
}

/** Eén sim-tick. Muteert s. */
export function step(s: State, commands: Command[] = []) {
  if (s.over) return;
  for (const c of commands) apply(s, c);

  if (s.tick >= s.nextSpawnTick) {
    spawnOne(s);
    s.nextSpawnTick = s.tick + spawnDelay(s);
  }

  for (const q of s.quays) {
    if (s.tick >= q.nextDemandTick) {
      q.pending++;
      q.nextDemandTick = s.tick + demandInterval(s);
    }
  }

  if (s.tick % ticks(config.dispatchIntervalSec) === 0) for (const w of s.wharves) dispatch(s, w);
  moveBarges(s);

  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    q.ring = q.pending > config.quayCapacity ? q.ring + 1 : Math.max(0, q.ring - 1);
    if (q.ring >= ringTicks) s.over = true;
  }

  s.tick++;
  if (s.tick % ticks(config.rampSeconds) === 0) s.difficulty *= config.difficultyGrowth;
}
