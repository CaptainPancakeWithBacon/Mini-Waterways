import { config, ticks } from './config';
import { edgeOk, heightAt, inBounds, setTile, tileAt } from './grid';
import { findPath } from './path';
import { nextInt } from './rng';
import { rules } from './rules';
import { demandInterval, spawnDelay, spawnOne } from './spawn';
import {
  CANAL,
  EMPTY,
  LOCK,
  type Barge,
  type Card,
  type Command,
  type Lock,
  type Pos,
  type Quay,
  type Side,
  type State,
  type Tool,
  type Wharf,
} from './types';

/** Ticks die een boot over één tegel doet. */
export const ticksPerTile = (s: Pick<State, 'speedBonus'>) =>
  Math.max(1, Math.round(config.tickRate / (config.bargeSpeedTilesPerSec * (1 + config.speedBonusStep * s.speedBonus))));

const lockAt = (s: State, x: number, y: number): Lock | undefined => s.locks.find((l) => l.x === x && l.y === y);
const inUse = (s: State, x: number, y: number) => s.barges.some((b) => b.path.some(([px, py]) => px === x && py === y));
const lockTicks = (l: Lock) => ticks(config.lockCycleSeconds * (l.pond ? config.pondFactor : 1));
const sideOf = (s: State, l: Lock, o: Pos): Side => (heightAt(s, o[0], o[1]) === heightAt(s, l.x, l.y) ? 'low' : 'high');

/** Een cyclus starten kost water als het waterbudget aan staat. */
function startCycle(s: State, l: Lock): boolean {
  if (s.waterOn) {
    const cost = l.pond ? config.water.costPond : config.water.costLock;
    if (s.water < cost) return false;
    s.water -= cost;
  }
  l.cycleLeft = lockTicks(l);
  return true;
}

function applyTool(s: State, tool: Tool) {
  if (tool === 'lock') s.lockCharges++;
  else if (tool === 'pond') s.pondCharges++;
  else if (tool === 'boat') s.bargeBonus++;
  else s.speedBonus++;
}

function makeCards(s: State): Card[] {
  const pool = config.toolPool.filter((t) => !(rules(s).noRepeatTool && t === s.lastTool));
  const draw = (): Card => ({
    tiles: config.cardTilesMin + nextInt(s.rng, config.cardTilesMax - config.cardTilesMin + 1),
    tool: pool[nextInt(s.rng, pool.length)]!,
  });
  const a = draw();
  let b = draw();
  for (let n = 0; n < 20 && b.tool === a.tool; n++) b = draw();
  return [a, b];
}

function pick(s: State, index: number) {
  const card = s.choice?.[index];
  if (!card) return;
  s.tilesLeft += card.tiles;
  applyTool(s, card.tool);
  s.lastTool = card.tool;
  s.choice = null;
  s.week++;
  s.colours = Math.min(config.maxColours, 1 + Math.floor(s.week / config.colourEveryWeeks));
  if (!rules(s).byMilestone) s.nextWeekTick = s.tick + ticks(config.weekSeconds);
}

function apply(s: State, c: Exclude<Command, { type: 'pick' }>) {
  if (!inBounds(s, c.x, c.y)) return;
  const t = tileAt(s, c.x, c.y);
  if (c.type === 'place') {
    if (t === EMPTY && s.tilesLeft > 0) {
      setTile(s, c.x, c.y, CANAL);
      s.tilesLeft--;
    }
  } else if (c.type === 'remove') {
    // weghalen kan niet onder het pad van een boot: dan zou die vastlopen
    if (!rules(s).canRemove || inUse(s, c.x, c.y)) return;
    if (t === CANAL) {
      setTile(s, c.x, c.y, EMPTY);
      s.tilesLeft++;
    } else if (t === LOCK) {
      const l = lockAt(s, c.x, c.y)!;
      s.locks = s.locks.filter((x) => x !== l);
      setTile(s, c.x, c.y, EMPTY);
      s.lockCharges++;
      if (l.pond) s.pondCharges++;
    }
  } else if (c.type === 'lock') {
    const h = heightAt(s, c.x, c.y);
    const higherNeighbour = ([[1, 0], [0, 1], [-1, 0], [0, -1]] as const).some(
      ([dx, dy]) => inBounds(s, c.x + dx, c.y + dy) && heightAt(s, c.x + dx, c.y + dy) === h + 1,
    );
    if ((t === EMPTY || t === CANAL) && s.lockCharges > 0 && higherNeighbour && !inUse(s, c.x, c.y)) {
      if (t === CANAL) s.tilesLeft++;
      setTile(s, c.x, c.y, LOCK);
      s.lockCharges--;
      s.locks.push({ x: c.x, y: c.y, state: 'low', occupant: null, reserved: null, cycleLeft: 0, pond: false });
    }
  } else if (t === LOCK && s.pondCharges > 0) {
    const l = lockAt(s, c.x, c.y)!;
    if (!l.pond) {
      l.pond = true;
      s.pondCharges--;
    }
  }
}

const targeted = (s: State, q: Quay) => s.barges.filter((b) => b.quayId === q.id && !b.returning).length;

function dispatch(s: State, w: Wharf) {
  if (s.barges.filter((b) => b.wharfId === w.id).length >= config.maxBargesPerWharf + s.bargeBonus) return;
  const open = s.quays
    .filter((q) => q.colour === w.colour)
    .map((q) => ({ q, want: q.pending - targeted(s, q) }))
    .filter((c) => c.want > 0)
    .sort((a, b) => b.want - a.want || a.q.id - b.q.id);
  for (const { q } of open) {
    const walk = (t: number) => t === CANAL || t === LOCK;
    const path = findPath(
      s.width,
      s.height,
      (ax, ay, bx, by) =>
        (walk(tileAt(s, ax, ay)) || (ax === w.x && ay === w.y)) &&
        (walk(tileAt(s, bx, by)) || (bx === q.x && by === q.y)) &&
        edgeOk(s, ax, ay, bx, by),
      [w.x, w.y],
      [q.x, q.y],
      (x, y) => (tileAt(s, x, y) === LOCK ? config.lockPathCost : 1),
    );
    if (path) {
      const barge: Barge = { id: s.nextId++, wharfId: w.id, quayId: q.id, colour: w.colour, path, i: 0, sub: 0, returning: false };
      s.barges.push(barge);
      return;
    }
  }
}

/** Mag boot b van tegel a naar n? Sluizen regelen wie erin mag en welke kant de kamer staat. */
function tryMove(s: State, b: Barge, a: Pos, n: Pos): boolean {
  const from = lockAt(s, a[0], a[1]);
  const into = lockAt(s, n[0], n[1]);
  if (from) {
    // de kamer moet op de kant van de volgende tegel staan
    if (from.cycleLeft > 0) return false;
    if (from.state !== sideOf(s, from, n)) {
      startCycle(s, from);
      return false;
    }
  }
  if (into) {
    if (into.occupant !== null || into.cycleLeft > 0) return false;
    if (into.reserved !== null && into.reserved !== b.id) return false;
    if (into.state !== sideOf(s, into, a)) {
      // lege kamer wisselen; wie dat doet, mag daarna als eerste
      if (startCycle(s, into)) into.reserved = b.id;
      return false;
    }
  }
  if (from) from.occupant = null;
  if (into) {
    into.occupant = b.id;
    into.reserved = null;
  }
  return true;
}

function moveBarges(s: State) {
  const perTile = ticksPerTile(s);
  s.barges = s.barges.filter((b) => {
    if (b.sub < perTile) b.sub++;
    if (b.sub < perTile) return true;
    if (!tryMove(s, b, b.path[b.i]!, b.path[b.i + 1]!)) return true; // wacht bij de sluis
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

/** Eén sim-tick. Muteert s. Staat er een keuze open, dan telt alleen `pick` en staat de tijd stil. */
export function step(s: State, commands: Command[] = []) {
  if (s.over) return;
  for (const c of commands) if (c.type === 'pick') pick(s, c.index);
  if (s.choice) return;
  for (const c of commands) if (c.type !== 'pick') apply(s, c);

  const r = rules(s);
  if (r.byMilestone ? s.score >= s.milestoneNext : s.tick >= s.nextWeekTick) {
    s.choice = makeCards(s);
    if (r.byMilestone) s.milestoneNext += config.endlessMilestone;
    return;
  }

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

  if (s.waterOn) {
    const dry = s.week % config.water.dryEveryWeeks === config.water.dryEveryWeeks - 1;
    if (s.tick % ticks(dry ? config.water.dryRefillSeconds : config.water.refillSeconds) === 0) {
      s.water = Math.min(config.water.max, s.water + 1);
    }
  }

  for (const l of s.locks) {
    if (l.cycleLeft > 0 && --l.cycleLeft === 0) l.state = l.state === 'low' ? 'high' : 'low';
  }
  if (s.tick % ticks(config.dispatchIntervalSec) === 0) for (const w of s.wharves) dispatch(s, w);
  moveBarges(s);

  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    q.ring = q.pending > config.quayCapacity ? Math.min(q.ring + 1, ringTicks) : Math.max(0, q.ring - 1);
    if (r.fail && q.ring >= ringTicks) s.over = true;
  }

  s.tick++;
  if (s.tick % ticks(config.rampSeconds) === 0) s.difficulty *= r.growth;
}
