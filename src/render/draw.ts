import { config, ticks } from '../sim/config';
import { heightAt } from '../sim/grid';
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

/** Merkteken per kleur, zodat kleuren ook zonder kleurzicht te onderscheiden zijn. */
function glyph(ctx: CanvasRenderingContext2D, colour: number, x: number, y: number, r: number) {
  ctx.fillStyle = palette.paper;
  ctx.strokeStyle = palette.paper;
  ctx.lineWidth = Math.max(1.5, r * 0.28);
  ctx.beginPath();
  if (colour === 1) {
    ctx.moveTo(x - r * 0.5, y);
    ctx.lineTo(x + r * 0.5, y);
    ctx.stroke();
  } else if (colour === 2) {
    ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (colour === 3) {
    ctx.moveTo(x - r * 0.5, y);
    ctx.lineTo(x + r * 0.5, y);
    ctx.moveTo(x, y - r * 0.5);
    ctx.lineTo(x, y + r * 0.5);
    ctx.stroke();
  }
}

export function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: State) {
  const { cell, ox, oy } = layout(canvas, s);
  const cx = (x: number) => ox + (x + 0.5) * cell;
  const cy = (y: number) => oy + (y + 0.5) * cell;
  const line = Math.max(2, cell * 0.07);

  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // terrein: een tint per niveau, met een contourlijn waar het niveau verspringt
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      ctx.fillStyle = palette.levels[heightAt(s, x, y)] ?? palette.levels[0];
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(1.5, cell * 0.05);
  ctx.beginPath();
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      const h = heightAt(s, x, y);
      if (x + 1 < s.width && heightAt(s, x + 1, y) !== h) {
        ctx.moveTo(ox + (x + 1) * cell, oy + y * cell);
        ctx.lineTo(ox + (x + 1) * cell, oy + (y + 1) * cell);
      }
      if (y + 1 < s.height && heightAt(s, x, y + 1) !== h) {
        ctx.moveTo(ox + x * cell, oy + (y + 1) * cell);
        ctx.lineTo(ox + (x + 1) * cell, oy + (y + 1) * cell);
      }
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // kanaal
  const inset = cell * 0.2;
  for (let i = 0; i < s.tiles.length; i++) {
    if (s.tiles[i] !== CANAL) continue;
    ctx.fillStyle = palette.canal;
    ctx.fillRect(ox + (i % s.width) * cell + inset, oy + Math.floor(i / s.width) * cell + inset, cell - 2 * inset, cell - 2 * inset);
  }

  // sluizen: kamer die vol loopt tijdens een cyclus, poort aan de hoge kant
  for (const l of s.locks) {
    const x = ox + l.x * cell;
    const y = oy + l.y * cell;
    ctx.fillStyle = palette.paper;
    ctx.fillRect(x + inset / 2, y + inset / 2, cell - inset, cell - inset);
    ctx.fillStyle = palette.canal;
    const full = l.cycleLeft > 0 ? (l.state === 'low' ? l.cycleLeft / ticks(config.lockCycleSeconds * (l.pond ? config.pondFactor : 1)) : 1 - l.cycleLeft / ticks(config.lockCycleSeconds * (l.pond ? config.pondFactor : 1))) : l.state === 'high' ? 1 : 0;
    const hgt = (cell - inset) * (0.25 + 0.75 * full);
    ctx.fillRect(x + inset / 2, y + cell - inset / 2 - hgt, cell - inset, hgt);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = line;
    ctx.strokeRect(x + inset / 2, y + inset / 2, cell - inset, cell - inset);
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
      const nx = l.x + dx;
      const ny = l.y + dy;
      if (nx < 0 || ny < 0 || nx >= s.width || ny >= s.height || heightAt(s, nx, ny) !== heightAt(s, l.x, l.y) + 1) continue;
      ctx.beginPath();
      ctx.moveTo(cx(l.x) + dx * cell * 0.4 + dy * cell * 0.4, cy(l.y) + dy * cell * 0.4 + dx * cell * 0.4);
      ctx.lineTo(cx(l.x) + dx * cell * 0.4 - dy * cell * 0.4, cy(l.y) + dy * cell * 0.4 - dx * cell * 0.4);
      ctx.stroke();
    }
    if (l.pond) {
      ctx.fillStyle = palette.ink;
      ctx.beginPath();
      ctx.arc(x + cell * 0.8, y + cell * 0.2, cell * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // wharves (vierkant) en quays (cirkel)
  for (const w of s.wharves) {
    ctx.fillStyle = palette.colours[w.colour] ?? palette.ink;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = line;
    ctx.fillRect(cx(w.x) - cell * 0.36, cy(w.y) - cell * 0.36, cell * 0.72, cell * 0.72);
    ctx.strokeRect(cx(w.x) - cell * 0.36, cy(w.y) - cell * 0.36, cell * 0.72, cell * 0.72);
    glyph(ctx, w.colour, cx(w.x), cy(w.y), cell * 0.36);
  }

  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    const colour = palette.colours[q.colour] ?? palette.ink;
    ctx.fillStyle = palette.paper;
    ctx.strokeStyle = colour;
    ctx.lineWidth = line * 1.6;
    ctx.beginPath();
    ctx.arc(cx(q.x), cy(q.y), cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // wachtende lading als stipjes in de kleur van het quay
    ctx.fillStyle = colour;
    for (let n = 0; n < Math.min(q.pending, 12); n++) {
      ctx.beginPath();
      ctx.arc(cx(q.x) - cell * 0.2 + (n % 4) * cell * 0.13, cy(q.y) - cell * 0.12 + Math.floor(n / 4) * cell * 0.13, cell * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    if (q.ring > 0) {
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = line * 1.8;
      ctx.beginPath();
      ctx.arc(cx(q.x), cy(q.y), cell * 0.56, -Math.PI / 2, -Math.PI / 2 + (q.ring / ringTicks) * Math.PI * 2);
      ctx.stroke();
    }
  }

  const perTile = ticksPerTile(s);
  for (const b of s.barges) {
    const a = b.path[b.i]!;
    const n = b.path[Math.min(b.i + 1, b.path.length - 1)]!;
    const t = b.sub / perTile;
    ctx.fillStyle = palette.colours[b.colour] ?? palette.ink;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = line * 0.7;
    ctx.beginPath();
    ctx.arc(cx(a[0] + (n[0] - a[0]) * t), cy(a[1] + (n[1] - a[1]) * t), cell * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (s.over) {
    ctx.fillStyle = 'rgba(241, 234, 217, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(cell * 1.4)}px system-ui, sans-serif`;
    ctx.fillText(`Score ${s.score}`, canvas.width / 2, canvas.height / 2 - cell);
    ctx.font = `${Math.round(cell * 0.7)}px system-ui, sans-serif`;
    ctx.fillText('Tik om verder te gaan', canvas.width / 2, canvas.height / 2 + cell * 0.5);
  }
}
