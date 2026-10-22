import { newGame } from './state';
import { step } from './step';
import type { Replay, State } from './types';

/** FNV-1a over de JSON van de state: genoeg om twee runs te vergelijken. */
export function hashState(s: State): string {
  const json = JSON.stringify(s);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) h = Math.imul(h ^ json.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Speelt seed plus commando's af tot en met `ticks` ticks. */
export function runReplay(r: Replay, ticks: number): State {
  const s = newGame(r.seed);
  for (let t = 0; t < ticks; t++) {
    step(
      s,
      r.commands.filter((c) => c.tick === s.tick).map((c) => c.cmd),
    );
  }
  return s;
}
