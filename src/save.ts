import type { Replay, State } from './sim/types';

const KEY = 'waterways-save';

export interface Save {
  v: 1;
  state: State;
  replay: Replay;
}

// localStorage kan ontbreken of weigeren (privévenster): dan speelt het spel gewoon zonder opslag
export function save(state: State, replay: Replay) {
  try {
    if (state.over) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ v: 1, state, replay } satisfies Save));
  } catch {
    /* geen opslag */
  }
}

export function load(): Save | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Save) : null;
    return s?.v === 1 ? s : null;
  } catch {
    return null;
  }
}
