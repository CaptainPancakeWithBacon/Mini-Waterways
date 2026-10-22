import { EMPTY, LOCK, QUAY, WHARF, type State } from './types';

export const inBounds = (s: Pick<State, 'width' | 'height'>, x: number, y: number) =>
  x >= 0 && y >= 0 && x < s.width && y < s.height;

export const tileAt = (s: State, x: number, y: number) => s.tiles[y * s.width + x] ?? EMPTY;
export const heightAt = (s: State, x: number, y: number) => s.heights[y * s.width + x] ?? 0;

export function setTile(s: State, x: number, y: number, kind: number) {
  s.tiles[y * s.width + x] = kind;
}

/** Vaste volgorde, want de A*-uitkomst moet deterministisch zijn. */
export const DIRS: readonly [number, number][] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

/** Vrij om een gebouw te zetten: lege tegel en geen gebouw binnen 1 tegel (ook diagonaal). */
export function isFreeSpot(s: State, x: number, y: number): boolean {
  if (!inBounds(s, x, y) || tileAt(s, x, y) !== EMPTY) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!inBounds(s, x + dx, y + dy)) continue;
      const t = tileAt(s, x + dx, y + dy);
      if (t === WHARF || t === QUAY) return false;
    }
  }
  return true;
}

/**
 * Mag een boot van a naar b? Zonder sluis moeten de hoogtes gelijk zijn.
 * Een sluis op hoogte L laat buren op L en L + 1 toe.
 */
export function edgeOk(s: State, ax: number, ay: number, bx: number, by: number): boolean {
  const ha = heightAt(s, ax, ay);
  const hb = heightAt(s, bx, by);
  const la = tileAt(s, ax, ay) === LOCK;
  const lb = tileAt(s, bx, by) === LOCK;
  if (!la && !lb) return ha === hb;
  if (la && hb - ha !== 0 && hb - ha !== 1) return false;
  if (lb && ha - hb !== 0 && ha - hb !== 1) return false;
  return true;
}
