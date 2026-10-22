import { DIRS } from './grid';
import type { Pos } from './types';

/**
 * A* op een 4-richtingen raster. Geeft de tegels van start tot en met goal, of null.
 * ponytail: open lijst is een array die per stap gescand wordt, prima voor ~600 tegels;
 * een binaire heap als het raster groeit.
 */
export function findPath(
  width: number,
  height: number,
  passable: (x: number, y: number) => boolean,
  start: Pos,
  goal: Pos,
): Pos[] | null {
  const key = (x: number, y: number) => y * width + x;
  const h = (x: number, y: number) => Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
  const g = new Map<number, number>([[key(...start), 0]]);
  const from = new Map<number, number>();
  const open: Pos[] = [start];
  const closed = new Set<number>();

  while (open.length > 0) {
    // laagste f, bij gelijkspel de eerst toegevoegde: deterministisch
    let best = 0;
    let bestF = Infinity;
    for (let n = 0; n < open.length; n++) {
      const [x, y] = open[n]!;
      const f = g.get(key(x, y))! + h(x, y);
      if (f < bestF) {
        bestF = f;
        best = n;
      }
    }
    const [cx, cy] = open.splice(best, 1)[0]!;
    const ck = key(cx, cy);
    if (cx === goal[0] && cy === goal[1]) {
      const path: Pos[] = [[cx, cy]];
      let k = ck;
      while (from.has(k)) {
        k = from.get(k)!;
        path.push([k % width, Math.floor(k / width)]);
      }
      return path.reverse();
    }
    closed.add(ck);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nk = key(nx, ny);
      if (closed.has(nk) || !passable(nx, ny)) continue;
      const ng = g.get(ck)! + 1;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        from.set(nk, ck);
        if (!open.some(([ox, oy]) => ox === nx && oy === ny)) open.push([nx, ny]);
      }
    }
  }
  return null;
}
