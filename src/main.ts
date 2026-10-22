import { Sound } from './audio';
import { attachPointer } from './input/pointer';
import { draw, layout } from './render/draw';
import { load, save } from './save';
import { config } from './sim/config';
import { newGame } from './sim/state';
import { step } from './sim/step';
import type { Command, Mode, Replay, State } from './sim/types';
import { createUi, type UiState } from './ui';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const sound = new Sound();

const ui: UiState = { tool: 'place', paused: false, speed: 1, muted: false };
let state: State = newGame('title');
let replay: Replay = { seed: state.seed, commands: [] };
let pending: Command[] = [];
// het titelspel achter het menu mag nooit een echte save overschrijven
let started = false;
const persist = () => started && save(state, replay);

const hasSave = () => load() !== null;

function start(mode: Mode, water: boolean, seed = String(Date.now())) {
  state = newGame(seed, mode, water);
  replay = { seed, mode, water, commands: [] };
  pending = [];
  ui.paused = false;
  started = true;
  panel.hideMenu();
  persist();
}

function push(c: Command) {
  // tijdens een keuze staat de tijd stil: alleen de keuze zelf telt, en alleen die komt in de replay
  if (state.choice && c.type !== 'pick') return;
  pending.push(c);
  replay.commands.push({ tick: state.tick, cmd: c });
}

function exportReplay() {
  const blob = new Blob([JSON.stringify(replay)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `waterways-replay-${replay.seed}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const panel = createUi(
  {
    tool: (t) => (ui.tool = t),
    pause: () => (ui.paused = !ui.paused),
    speed: () => (ui.speed = ui.speed === 3 ? 1 : ui.speed + 1),
    mute: () => {
      ui.muted = !ui.muted;
      sound.setMuted(ui.muted);
    },
    menu: () => panel.showMenu(),
    replay: exportReplay,
    pick: (i) => push({ type: 'pick', index: i }),
    start,
    resume: () => {
      const saved = load();
      if (saved) {
        state = saved.state;
        replay = saved.replay;
        pending = [];
        started = true;
      }
      panel.hideMenu();
    },
  },
  hasSave,
);

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}

attachPointer(
  canvas,
  () => layout(canvas, state),
  () => ui.tool,
  push,
  () => {
    if (panel.menuOpen()) return true;
    if (!state.over) return false;
    panel.showMenu();
    return true;
  },
);

// geluid mag pas starten na een gebruikersactie
window.addEventListener('pointerdown', () => sound.start());
window.addEventListener('keydown', (e) => {
  sound.start();
  const k = e.key.toLowerCase();
  if (k === ' ') ui.paused = !ui.paused;
  else if (k === 'm') panel.showMenu();
  else if (k === 'g') {
    ui.muted = !ui.muted;
    sound.setMuted(ui.muted);
  } else if (['1', '2', '3', '4'].includes(k)) ui.tool = (['place', 'lock', 'pond', 'remove'] as const)[Number(k) - 1]!;
  else return;
  e.preventDefault();
});

// autosave: elke paar seconden en zodra het tabblad verdwijnt
setInterval(() => !panel.menuOpen() && persist(), 5000);
document.addEventListener('visibilitychange', () => document.hidden && persist());
window.addEventListener('pagehide', persist);

// vaste tijdstap: sim loopt op tickRate (maal de gekozen snelheid), tekenen op elk frame
const dtMs = 1000 / config.tickRate;
let acc = 0;
let prev = performance.now();

function frame(now: number) {
  acc += Math.min(now - prev, 250);
  prev = now;
  if (ui.paused || panel.menuOpen()) acc = 0;
  const steps = Math.floor(acc / dtMs);
  acc -= steps * dtMs;
  // bij een open keuze staat de tijd stil, maar de pick moet wel binnenkomen
  const n = state.choice ? Math.max(1, steps) : steps * ui.speed;
  for (let i = 0; i < n; i++) {
    step(state, pending);
    pending = [];
  }
  draw(ctx, canvas, state);
  panel.update(state, ui);
  sound.update(state);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
panel.showMenu();
requestAnimationFrame(frame);
