import { heightAt } from '../sim/grid';
import type { State } from '../sim/types';
import { palette } from './palette';

// Hoekpunten van een cel in eenheden 0..1: TL TR BR BL, en middens van de randen T R B L.
const P = { TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1], T: [0.5, 0], R: [1, 0.5], B: [0.5, 1], L: [0, 0.5] } as const;
type K = keyof typeof P;
// Marching squares: bits tl=1, tr=2, br=4, bl=8. Zadelgevallen (5, 10) worden verbonden getekend.
const CASES: K[][] = [
  [],
  ['TL', 'T', 'L'],
  ['T', 'TR', 'R'],
  ['TL', 'TR', 'R', 'L'],
  ['R', 'BR', 'B'],
  ['TL', 'T', 'R', 'BR', 'B', 'L'],
  ['T', 'TR', 'BR', 'B'],
  ['TL', 'TR', 'BR', 'B', 'L'],
  ['L', 'B', 'BL'],
  ['TL', 'T', 'B', 'BL'],
  ['T', 'TR', 'R', 'B', 'BL', 'L'],
  ['TL', 'TR', 'R', 'B', 'BL'],
  ['L', 'R', 'BR', 'BL'],
  ['TL', 'T', 'R', 'BR', 'BL'],
  ['T', 'TR', 'BR', 'BL', 'L'],
  ['TL', 'TR', 'BR', 'BL'],
];

/** Het land van één niveau als vloeiend vlak met afgeschuinde randen. Buiten het raster loopt het land door. */
function levelShape(s: State, level: number, cell: number, ox: number, oy: number, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = palette.levels[level] ?? palette.levels[0];
  const inside = (x: number, y: number) => {
    const cx = Math.min(s.width - 1, Math.max(0, x));
    const cy = Math.min(s.height - 1, Math.max(0, y));
    return heightAt(s, cx, cy) >= level;
  };
  for (let j = -1; j < s.height; j++) {
    for (let i = -1; i < s.width; i++) {
      const m = (inside(i, j) ? 1 : 0) | (inside(i + 1, j) ? 2 : 0) | (inside(i + 1, j + 1) ? 4 : 0) | (inside(i, j + 1) ? 8 : 0);
      const poly = CASES[m]!;
      if (poly.length === 0) continue;
      // een cel loopt van het midden van tegel (i, j) tot het midden van tegel (i + 1, j + 1)
      const x0 = ox + (i + 0.5) * cell;
      const y0 = oy + (j + 0.5) * cell;
      ctx.beginPath();
      poly.forEach((k, n) => {
        const [px, py] = P[k];
        if (n === 0) ctx.moveTo(x0 + px * cell, y0 + py * cell);
        else ctx.lineTo(x0 + px * cell, y0 + py * cell);
      });
      ctx.closePath();
      ctx.fill();
      // de rand eroverheen laat buurcellen een fractie overlappen, anders blijven er haarnaden zichtbaar
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    }
  }
  return c;
}

/** Eenvoudige, vaste hash zodat decor niet met de sim-RNG hoeft mee te lopen. */
function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y + seed, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return ((h ^ (h >>> 12)) >>> 0) / 4294967296;
}

export interface Tree {
  x: number;
  y: number;
  /** tegel waar de boom bij hoort: bij bebouwing verdwijnt hij */
  tx: number;
  ty: number;
  r: number;
  colour: string;
}

export interface Terrain {
  key: string;
  canvas: HTMLCanvasElement;
  trees: Tree[];
}

let cached: Terrain | null = null;

/** Terrein met schaduw per niveau, één keer getekend per spel en canvasgrootte. */
export function terrainLayer(s: State, cell: number, ox: number, oy: number, w: number, h: number): Terrain {
  const key = `${s.seed}|${w}x${h}|${cell}`;
  if (cached?.key === key) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = palette.levels[0];
  ctx.fillRect(0, 0, w, h);
  for (let level = 1; level < palette.levels.length; level++) {
    ctx.save();
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = cell * 0.55;
    ctx.shadowOffsetY = cell * 0.16;
    ctx.drawImage(levelShape(s, level, cell, ox, oy, w, h), 0, 0);
    ctx.restore();
  }

  let seed = 0;
  for (let i = 0; i < s.seed.length; i++) seed = (seed * 31 + s.seed.charCodeAt(i)) | 0;
  const trees: Tree[] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (hash(x, y, seed) > 0.075) continue;
      const jx = (hash(x, y, seed + 1) - 0.5) * 0.24;
      const jy = (hash(x, y, seed + 2) - 0.5) * 0.24;
      trees.push({
        x: ox + (x + 0.5 + jx) * cell,
        y: oy + (y + 0.5 + jy) * cell,
        tx: x,
        ty: y,
        r: cell * (0.15 + hash(x, y, seed + 3) * 0.08),
        colour: palette.trees[Math.floor(hash(x, y, seed + 4) * palette.trees.length)]!,
      });
    }
  }
  cached = { key, canvas, trees };
  return cached;
}
