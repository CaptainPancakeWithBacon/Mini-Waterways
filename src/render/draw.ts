import { config, ticks } from '../sim/config';
import { edgeOk, heightAt, tileAt } from '../sim/grid';
import { ticksPerTile } from '../sim/step';
import { CANAL, LOCK, QUAY, WHARF, type State } from '../sim/types';
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

// Alleen weergave-toestand: tijdstippen voor animaties. De sim weet hier niets van.
const seen = new Map<string, number>();
const prevPending = new Map<number, number>();
const angles = new Map<number, number>();
let ripples: { x: number; y: number; t0: number; colour: string }[] = [];
let lastSeed = '';
let lastTick = 0;

const easeOutBack = (t: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const appear = (key: string, now: number) => {
  if (!seen.has(key)) seen.set(key, now);
  const t = Math.min(1, (now - seen.get(key)!) / 480);
  return t < 1 ? Math.max(0.001, easeOutBack(t)) : 1;
};

/** Merkteken per kleur, zodat kleuren ook zonder kleurzicht te onderscheiden zijn. */
function glyph(ctx: CanvasRenderingContext2D, colour: number, x: number, y: number, r: number) {
  ctx.fillStyle = palette.paper;
  ctx.strokeStyle = palette.paper;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, r * 0.26);
  ctx.beginPath();
  if (colour === 1) {
    ctx.moveTo(x - r * 0.42, y);
    ctx.lineTo(x + r * 0.42, y);
    ctx.stroke();
  } else if (colour === 2) {
    ctx.arc(x, y, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  } else if (colour === 3) {
    ctx.moveTo(x - r * 0.42, y);
    ctx.lineTo(x + r * 0.42, y);
    ctx.moveTo(x, y - r * 0.42);
    ctx.lineTo(x, y + r * 0.42);
    ctx.stroke();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: State, now = performance.now()) {
  if (s.seed !== lastSeed || s.tick < lastTick) {
    seen.clear();
    prevPending.clear();
    angles.clear();
    ripples = [];
    lastSeed = s.seed;
  }
  lastTick = s.tick;

  const { cell, ox, oy } = layout(canvas, s);
  const cx = (x: number) => ox + (x + 0.5) * cell;
  const cy = (y: number) => oy + (y + 0.5) * cell;
  const line = Math.max(2, cell * 0.07);
  const walk = (t: number) => t === CANAL || t === LOCK;

  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // land: een tint per niveau, met een zachte contourlijn waar het niveau verspringt
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      ctx.fillStyle = palette.levels[heightAt(s, x, y)] ?? palette.levels[0];
      ctx.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5);
    }
  }
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = Math.max(1.5, cell * 0.045);
  ctx.lineCap = 'round';
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

  // kanaal als doorlopende lijn. Een stap in hoogte zonder sluis verbindt niet: dat is het signaal dat er een sluis moet komen.
  const links: [number, number, number, number][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      const t = tileAt(s, x, y);
      if (!walk(t) && t !== WHARF && t !== QUAY) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= s.width || ny >= s.height) continue;
        const n = tileAt(s, nx, ny);
        const bothWater = walk(t) && walk(n);
        const toBuilding = (walk(t) && (n === WHARF || n === QUAY)) || (walk(n) && (t === WHARF || t === QUAY));
        if ((bothWater || toBuilding) && edgeOk(s, x, y, nx, ny)) links.push([x, y, nx, ny]);
      }
    }
  }
  const stroke = (width: number, colour: string) => {
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const [x, y, nx, ny] of links) {
      ctx.moveTo(cx(x), cy(y));
      ctx.lineTo(cx(nx), cy(ny));
    }
    ctx.stroke();
    for (let i = 0; i < s.tiles.length; i++) {
      if (!walk(s.tiles[i]!)) continue;
      ctx.beginPath();
      ctx.arc(cx(i % s.width), cy(Math.floor(i / s.width)), width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  stroke(cell * 0.46, palette.water);
  stroke(cell * 0.16, palette.waterLight);

  // sluizen: kamer die vol loopt tijdens een cyclus, poort aan de hoge kant
  for (const l of s.locks) {
    const x = ox + l.x * cell;
    const y = oy + l.y * cell;
    const pad = cell * 0.1;
    const size = cell - 2 * pad;
    const total = ticks(config.lockCycleSeconds * (l.pond ? config.pondFactor : 1));
    const up = l.state === 'high' ? 1 : 0;
    const level = l.cycleLeft > 0 ? (l.state === 'low' ? 1 - l.cycleLeft / total : l.cycleLeft / total) : up;
    roundRect(ctx, x + pad, y + pad, size, size, cell * 0.14);
    ctx.fillStyle = palette.paper;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = palette.water;
    const h = size * (0.2 + 0.8 * level);
    ctx.fillRect(x + pad, y + pad + size - h, size, h);
    ctx.fillStyle = palette.waterLight;
    ctx.fillRect(x + pad, y + pad + size - h, size, Math.max(2, cell * 0.06));
    ctx.restore();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = line;
    roundRect(ctx, x + pad, y + pad, size, size, cell * 0.14);
    ctx.stroke();
    // dikke poortbalk aan de kant waar het terrein hoger ligt
    ctx.lineCap = 'butt';
    ctx.lineWidth = line * 1.8;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
      const nx = l.x + dx;
      const ny = l.y + dy;
      if (nx < 0 || ny < 0 || nx >= s.width || ny >= s.height || heightAt(s, nx, ny) !== heightAt(s, l.x, l.y) + 1) continue;
      ctx.beginPath();
      ctx.moveTo(cx(l.x) + dx * size * 0.5 + dy * size * 0.36, cy(l.y) + dy * size * 0.5 + dx * size * 0.36);
      ctx.lineTo(cx(l.x) + dx * size * 0.5 - dy * size * 0.36, cy(l.y) + dy * size * 0.5 - dx * size * 0.36);
      ctx.stroke();
    }
    if (l.pond) {
      ctx.fillStyle = palette.ink;
      ctx.beginPath();
      ctx.arc(x + cell * 0.8, y + cell * 0.2, cell * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // wharves (afgeronde vierkanten)
  for (const w of s.wharves) {
    const k = appear(`w${w.id}`, now);
    const r = cell * 0.37 * k;
    ctx.fillStyle = palette.colours[w.colour] ?? palette.ink;
    roundRect(ctx, cx(w.x) - r, cy(w.y) - r, 2 * r, 2 * r, r * 0.34);
    ctx.fill();
    glyph(ctx, w.colour, cx(w.x), cy(w.y), r);
  }

  // quays (cirkels): ring is de aftelklok, de hele quay hapert zodra hij te vol staat
  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    const colour = palette.colours[q.colour] ?? palette.ink;
    const over = q.pending > config.quayCapacity;
    const k = appear(`q${q.id}`, now) * (over ? 1 + 0.045 * Math.sin(now / 130) : 1);
    const r = cell * 0.37 * k;
    ctx.fillStyle = palette.paper;
    ctx.strokeStyle = colour;
    ctx.lineWidth = cell * 0.13 * k;
    ctx.beginPath();
    ctx.arc(cx(q.x), cy(q.y), r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colour;
    const dot = cell * 0.05 * k;
    for (let n = 0; n < Math.min(q.pending, 12); n++) {
      ctx.beginPath();
      ctx.arc(cx(q.x) - cell * 0.2 + (n % 4) * cell * 0.13, cy(q.y) - cell * 0.12 + Math.floor(n / 4) * cell * 0.13, dot, 0, Math.PI * 2);
      ctx.fill();
    }
    if (q.ring > 0) {
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = cell * 0.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx(q.x), cy(q.y), cell * 0.56, -Math.PI / 2, -Math.PI / 2 + (q.ring / ringTicks) * Math.PI * 2);
      ctx.stroke();
    }
    // rimpel bij een aflevering
    if ((prevPending.get(q.id) ?? q.pending) > q.pending) ripples.push({ x: cx(q.x), y: cy(q.y), t0: now, colour });
    prevPending.set(q.id, q.pending);
  }
  ripples = ripples.filter((r) => now - r.t0 < 700);
  for (const r of ripples) {
    const t = (now - r.t0) / 700;
    ctx.globalAlpha = 0.55 * (1 - t);
    ctx.strokeStyle = r.colour;
    ctx.lineWidth = cell * 0.08;
    ctx.beginPath();
    ctx.arc(r.x, r.y, cell * (0.4 + 0.7 * t), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // boten: afgeronde scheepjes die langs hun richting liggen
  const perTile = ticksPerTile(s);
  for (const b of s.barges) {
    const a = b.path[b.i]!;
    const n = b.path[Math.min(b.i + 1, b.path.length - 1)]!;
    const t = b.sub / perTile;
    const px = cx(a[0] + (n[0] - a[0]) * t);
    const py = cy(a[1] + (n[1] - a[1]) * t);
    if (n[0] !== a[0] || n[1] !== a[1]) angles.set(b.id, Math.atan2(n[1] - a[1], n[0] - a[0]));
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angles.get(b.id) ?? 0);
    const len = cell * 0.46;
    const wid = cell * 0.28;
    roundRect(ctx, -len / 2, -wid / 2, len, wid, wid * 0.5);
    ctx.fillStyle = palette.colours[b.colour] ?? palette.ink;
    ctx.fill();
    ctx.strokeStyle = palette.paper;
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  if (s.over) {
    ctx.fillStyle = 'rgba(244, 239, 227, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(cell * 1.5)}px system-ui, sans-serif`;
    ctx.fillText(`${s.score}`, canvas.width / 2, canvas.height / 2 - cell * 0.8);
    ctx.font = `${Math.round(cell * 0.62)}px system-ui, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.fillText('afleveringen. Tik om verder te gaan', canvas.width / 2, canvas.height / 2 + cell * 0.5);
    ctx.globalAlpha = 1;
  }
}
