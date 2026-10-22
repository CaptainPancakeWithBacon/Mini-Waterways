import { config, ticks } from '../sim/config';
import { edgeOk, heightAt, tileAt } from '../sim/grid';
import { ticksPerTile } from '../sim/step';
import { CANAL, EMPTY, LOCK, QUAY, WHARF, type State } from '../sim/types';
import { palette, shade } from './palette';
import { terrainLayer } from './terrain';

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
  if (canvas.width === 0 || canvas.height === 0) return; // nog geen layout
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
  const shadow = (blur: number, dy: number) => {
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = cell * blur;
    ctx.shadowOffsetY = cell * dy;
  };
  const noShadow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  };

  // land: gelaagd papier, één keer getekend en gecachet
  const terrain = terrainLayer(s, cell, ox, oy, canvas.width, canvas.height);
  ctx.drawImage(terrain.canvas, 0, 0);
  // buiten het speelveld een sluier, zodat duidelijk is waar je kunt bouwen
  ctx.fillStyle = 'rgba(244, 239, 227, 0.72)';
  ctx.fillRect(0, 0, canvas.width, oy);
  ctx.fillRect(0, oy + s.height * cell, canvas.width, canvas.height);
  ctx.fillRect(0, oy, ox, s.height * cell);
  ctx.fillRect(ox + s.width * cell, oy, canvas.width, s.height * cell);

  // bomen: weg zodra er op de tegel gebouwd is
  for (const t of terrain.trees) {
    if (tileAt(s, t.tx, t.ty) !== EMPTY) continue;
    ctx.fillStyle = 'rgba(36, 59, 74, 0.14)';
    ctx.beginPath();
    ctx.ellipse(t.x + t.r * 0.35, t.y + t.r * 0.75, t.r * 1.05, t.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.colour;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(t.colour, 0.3);
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

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
  // tegels met een verbinding krijgen hun ronde einden van de lijn zelf; losse tegels een stip
  const linked = new Set<number>();
  for (const [x, y, nx, ny] of links) {
    linked.add(y * s.width + x);
    linked.add(ny * s.width + nx);
  }
  const stroke = (width: number, colour: string, withShadow = false) => {
    if (withShadow) shadow(0.3, 0.07);
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
      if (!walk(s.tiles[i]!) || linked.has(i)) continue;
      ctx.beginPath();
      ctx.arc(cx(i % s.width), cy(Math.floor(i / s.width)), width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    noShadow();
  };
  stroke(cell * 0.66, palette.bank, true); // oever
  stroke(cell * 0.46, palette.water);
  stroke(cell * 0.15, palette.waterLight);

  // sluizen: stenen kamer met een poort aan beide uiteinden, dikker aan de kant waar het land hoger ligt
  for (const l of s.locks) {
    const x = ox + l.x * cell;
    const y = oy + l.y * cell;
    const size = cell * 0.9;
    const x0 = x + (cell - size) / 2;
    const y0 = y + (cell - size) / 2;
    const total = ticks(config.lockCycleSeconds * (l.pond ? config.pondFactor : 1));
    const level = l.cycleLeft > 0 ? (l.state === 'low' ? 1 - l.cycleLeft / total : l.cycleLeft / total) : l.state === 'high' ? 1 : 0;

    shadow(0.35, 0.08);
    roundRect(ctx, x0, y0, size, size, cell * 0.16);
    ctx.fillStyle = palette.bank;
    ctx.fill();
    noShadow();
    ctx.save();
    roundRect(ctx, x0 + cell * 0.06, y0 + cell * 0.06, size - cell * 0.12, size - cell * 0.12, cell * 0.12);
    ctx.clip();
    ctx.fillStyle = shade(palette.waterLight, 0.35);
    ctx.fillRect(x0, y0, size, size);
    const wh = size * (0.18 + 0.82 * level);
    ctx.fillStyle = palette.water;
    ctx.fillRect(x0, y0 + size - wh, size, wh + 1);
    ctx.fillStyle = palette.waterLight;
    ctx.fillRect(x0, y0 + size - wh, size, Math.max(2, cell * 0.05));
    ctx.restore();

    // richting van de doorvaart: naar de hoge buur toe
    let ax = 1;
    let ay = 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
      const nx = l.x + dx;
      const ny = l.y + dy;
      if (nx >= 0 && ny >= 0 && nx < s.width && ny < s.height && heightAt(s, nx, ny) === heightAt(s, l.x, l.y) + 1) {
        ax = dx;
        ay = dy;
        break;
      }
    }
    ctx.strokeStyle = palette.ink;
    ctx.lineCap = 'round';
    for (const [dir, w] of [[1, 2.4], [-1, 1.3]] as const) {
      ctx.lineWidth = line * w;
      ctx.beginPath();
      ctx.moveTo(cx(l.x) + ax * dir * size * 0.46 + ay * size * 0.34, cy(l.y) + ay * dir * size * 0.46 + ax * size * 0.34);
      ctx.lineTo(cx(l.x) + ax * dir * size * 0.46 - ay * size * 0.34, cy(l.y) + ay * dir * size * 0.46 - ax * size * 0.34);
      ctx.stroke();
    }
    if (l.pond) {
      ctx.fillStyle = palette.ink;
      ctx.beginPath();
      ctx.arc(x + cell * 0.82, y + cell * 0.18, cell * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // wharves: pakhuis met een kleurig dak en een zijkant, zodat ze boven het land uitsteken
  for (const w of s.wharves) {
    const k = appear(`w${w.id}`, now);
    const r = cell * 0.36 * k;
    const depth = cell * 0.1 * k;
    const colour = palette.colours[w.colour] ?? palette.ink;
    shadow(0.3, 0.1);
    roundRect(ctx, cx(w.x) - r, cy(w.y) - r + depth, 2 * r, 2 * r, r * 0.3);
    ctx.fillStyle = shade(colour, -0.3);
    ctx.fill();
    noShadow();
    roundRect(ctx, cx(w.x) - r, cy(w.y) - r, 2 * r, 2 * r, r * 0.3);
    ctx.fillStyle = colour;
    ctx.fill();
    roundRect(ctx, cx(w.x) - r * 0.78, cy(w.y) - r * 0.78, r * 1.56, r * 1.56, r * 0.22);
    ctx.fillStyle = shade(colour, 0.14);
    ctx.fill();
    glyph(ctx, w.colour, cx(w.x), cy(w.y), r);
  }

  // quays: ronde kom met een kleurige rand. De ring is de aftelklok, de hele quay hapert zodra hij te vol staat
  const ringTicks = ticks(config.ringSeconds);
  for (const q of s.quays) {
    const colour = palette.colours[q.colour] ?? palette.ink;
    const over = q.pending > config.quayCapacity;
    const k = appear(`q${q.id}`, now) * (over ? 1 + 0.045 * Math.sin(now / 130) : 1);
    const r = cell * 0.4 * k;
    shadow(0.3, 0.1);
    ctx.fillStyle = palette.bank;
    ctx.beginPath();
    ctx.arc(cx(q.x), cy(q.y), r * 1.1, 0, Math.PI * 2);
    ctx.fill();
    noShadow();
    ctx.fillStyle = shade(palette.waterLight, 0.4);
    ctx.strokeStyle = colour;
    ctx.lineWidth = cell * 0.12 * k;
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
      ctx.arc(cx(q.x), cy(q.y), cell * 0.6, -Math.PI / 2, -Math.PI / 2 + (q.ring / ringTicks) * Math.PI * 2);
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

  // boten: spitse scheepjes met een dek en een kielzog
  const perTile = ticksPerTile(s);
  for (const b of s.barges) {
    const a = b.path[b.i]!;
    const n = b.path[Math.min(b.i + 1, b.path.length - 1)]!;
    const t = b.sub / perTile;
    const px = cx(a[0] + (n[0] - a[0]) * t);
    const py = cy(a[1] + (n[1] - a[1]) * t);
    const moving = n[0] !== a[0] || n[1] !== a[1];
    if (moving) angles.set(b.id, Math.atan2(n[1] - a[1], n[0] - a[0]));
    const colour = palette.colours[b.colour] ?? palette.ink;
    const L = cell * 0.64;
    const W = cell * 0.34;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angles.get(b.id) ?? 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = Math.max(1.5, cell * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-L * 0.45, -W * 0.35);
    ctx.lineTo(-L * 1.25, -W * 0.95);
    ctx.moveTo(-L * 0.45, W * 0.35);
    ctx.lineTo(-L * 1.25, W * 0.95);
    ctx.stroke();
    shadow(0.18, 0.05);
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.quadraticCurveTo(L * 0.22, -W / 2, -L / 2 + W * 0.2, -W / 2);
    ctx.lineTo(-L / 2, -W * 0.3);
    ctx.lineTo(-L / 2, W * 0.3);
    ctx.lineTo(-L / 2 + W * 0.2, W / 2);
    ctx.quadraticCurveTo(L * 0.22, W / 2, L / 2, 0);
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
    noShadow();
    roundRect(ctx, -L * 0.28, -W * 0.2, L * 0.5, W * 0.4, W * 0.15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
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
