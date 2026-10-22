import { attachPointer } from './input/pointer';
import { draw, layout } from './render/draw';
import { config } from './sim/config';
import { newGame } from './sim/state';
import { step } from './sim/step';
import type { Command } from './sim/types';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

const newSeed = () => String(Date.now());
let state = newGame(newSeed());
let pending: Command[] = [];

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}

attachPointer(
  canvas,
  () => layout(canvas, state),
  (c) => pending.push(c),
  () => {
    if (!state.over) return false;
    state = newGame(newSeed());
    pending = [];
    return true;
  },
);

// vaste tijdstap: sim loopt op tickRate, tekenen op elk frame
const dtMs = 1000 / config.tickRate;
let acc = 0;
let prev = performance.now();

function frame(now: number) {
  acc += Math.min(now - prev, 250);
  prev = now;
  while (acc >= dtMs) {
    step(state, pending);
    pending = [];
    acc -= dtMs;
  }
  draw(ctx, canvas, state);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
