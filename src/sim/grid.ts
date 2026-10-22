import { EMPTY, QUAY, WHARF, type State } from './types';

export const inBounds = (s: Pick<State, 'width' | 'height'>, x: number, y: number) =>
  x >= 0 && y >= 0 && x < s.width && y < s.height;

export const tileAt = (s: State, x: number, y: number) => s.tiles[y * s.width + x] ?? EMPTY;

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
