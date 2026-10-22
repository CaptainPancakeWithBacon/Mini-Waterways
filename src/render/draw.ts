import { config, ticks } from '../sim/config';
import { ticksPerTile } from '../sim/step';
import { CANAL, type State } from '../sim/types';
import { palette } from './palette';

export interface Layout {
  cell: number;
  ox: number;
  oy: number;
}

/** Raster passend en gecentreerd in het canvas (in device-pixels). */
export function layout(canvas: HTMLCanvasElement, s: State): Layout {
  const cell = Math.floor(Math.min(canvas.width / s.width, canvas.height / s.height));
  return { cell, ox: Math.floor((canvas.width - cell * s.width) / 2), oy: Math.floor((canvas.height - cell * s.height) / 2) };
}

export function toTile(l: Layout, px: number, py: number): [number, number] {
  return [Math.floor((px - l.ox) / l.cell), Math.floor((py - l.oy) / l.cell)];
}

export function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: State) {
  const l = layout(canvas, s);
  const { cell, ox, oy } = l;
  const cx = (x: number) => ox + (x + 0.5) * cell;
  const cy = (y: number) => oy + (y + 0.5) * cell;

  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= s.width; x++) {
    ctx.moveTo(ox + x * cell, oy);
    ctx.lineTo(ox + x * cell, oy + s.height * cell);
  }
  for (let y = 0; y <= s.height; y++) {
    ctx.moveTo(ox, oy + y * cell);
    ctx.lineTo(ox + s.width * cell, oy + y * cell);
  }
  ctx.stroke();

  ctx.fillStyle = palette.canal;
  const inset = cell * 0.2;
  for (let i = 0; i < s.tiles.length; i++) {
    if (s.tiles[i] !== CANAL) continue;
    ctx.fillRect(ox + (i % s.width) * cell + inset, oy + Math.floor(i / s.width) * cell + inset, cell - 2 * inset, cell - 2 * inset);
  }

  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(2, cell * 0.08);
  for (const w of s.wharves) {
    ctx.strokeRect(cx(w.x) - cell * 0.35, cy(w.y) - cell * 0.35, cell * 0.7, cell * 0.7);
  }

  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    ctx.beginPath();
    ctx.arc(cx(q.x), cy(q.y), cell * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    // wachtende lading als stipjes, rood zodra het quay over de capaciteit zit
    ctx.fillStyle = q.pending > config.quayCapacity ? palette.warn : palette.ink;
    for (let n = 0; n < Math.min(q.pending, 12); n++) {
      ctx.beginPath();
      ctx.arc(cx(q.x) - cell * 0.2 + (n % 4) * cell * 0.13, cy(q.y) - cell * 0.1 + Math.floor(n / 4) * cell * 0.13, cell * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    if (q.ring > 0) {
      ctx.strokeStyle = palette.warn;
      ctx.beginPath();
      ctx.arc(cx(q.x), cy(q.y), cell * 0.5, -Math.PI / 2, -Math.PI / 2 + (q.ring / ringTicks) * Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = palette.ink;
    }
  }

  ctx.fillStyle = palette.ink;
  const perTile = ticksPerTile();
  for (const b of s.barges) {
    const a = b.path[b.i]!;
    const n = b.path[Math.min(b.i + 1, b.path.length - 1)]!;
    const t = b.sub / perTile;
    const x = cx(a[0] + (n[0] - a[0]) * t);
    const y = cy(a[1] + (n[1] - a[1]) * t);
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = palette.ink;
  ctx.font = `${Math.round(cell * 0.7)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(s.score), ox + cell * 0.3, oy + cell * 0.2);

  if (s.over) {
    ctx.fillStyle = 'rgba(241, 234, 217, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(cell * 1.4)}px system-ui, sans-serif`;
    ctx.fillText(`Score ${s.score}`, canvas.width / 2, canvas.height / 2 - cell);
    ctx.font = `${Math.round(cell * 0.7)}px system-ui, sans-serif`;
    ctx.fillText('Tik om opnieuw te beginnen', canvas.width / 2, canvas.height / 2 + cell * 0.5);
  }
}
