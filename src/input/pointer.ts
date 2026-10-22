import type { Layout } from '../render/draw';
import { toTile } from '../render/draw';
import type { Command } from '../sim/types';

/**
 * Slepen met links plaatst kanaal, slepen met rechts of Shift haalt het weg.
 * Commando's worden verzameld en door de loop per tick leeggehaald.
 */
export function attachPointer(
  canvas: HTMLCanvasElement,
  getLayout: () => Layout,
  push: (c: Command) => void,
  onTapWhenOver: () => boolean,
) {
  let mode: Command['type'] | null = null;
  let last: [number, number] | null = null;

  const act = (e: PointerEvent) => {
    const dpr = canvas.width / canvas.clientWidth;
    const r = canvas.getBoundingClientRect();
    const [x, y] = toTile(getLayout(), (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
    if (!mode || (last && last[0] === x && last[1] === y)) return;
    // snelle bewegingen slaan tegels over: vul aan met een 4-verbonden lijn
    const [fx, fy] = last ?? [x, y];
    const steps = Math.max(Math.abs(x - fx), Math.abs(y - fy), 1);
    let [px, py] = [fx, fy];
    for (let i = 1; i <= steps; i++) {
      const nx = Math.round(fx + ((x - fx) * i) / steps);
      const ny = Math.round(fy + ((y - fy) * i) / steps);
      if (nx !== px && ny !== py) push({ type: mode, x: nx, y: py });
      push({ type: mode, x: nx, y: ny });
      [px, py] = [nx, ny];
    }
    last = [x, y];
  };

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    if (onTapWhenOver()) return;
    canvas.setPointerCapture(e.pointerId);
    mode = e.button === 2 || e.shiftKey ? 'remove' : 'place';
    last = null;
    act(e);
  });
  canvas.addEventListener('pointermove', act);
  const stop = () => (mode = null);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}
