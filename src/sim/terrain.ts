import { config } from './config';
import { nextFloat, type Rng } from './rng';

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Value-noise met grote vlakken, daarna in gelijke delen gesneden: elk niveau beslaat even veel tegels
 * en buurtegels verschillen hoogstens één niveau, zodat een sluis altijd een stap kan overbruggen.
 */
export function genHeights(rng: Rng, width: number, height: number): number[] {
  const c = config.terrainCell;
  const lw = Math.ceil(width / c) + 2;
  const lh = Math.ceil(height / c) + 2;
  const lattice = Array.from({ length: lw * lh }, () => nextFloat(rng));
  const at = (gx: number, gy: number) => lattice[gy * lw + gx]!;

  const values: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = Math.floor(x / c);
      const gy = Math.floor(y / c);
      const tx = smooth((x % c) / c);
      const ty = smooth((y % c) / c);
      const top = at(gx, gy) * (1 - tx) + at(gx + 1, gy) * tx;
      const bottom = at(gx, gy + 1) * (1 - tx) + at(gx + 1, gy + 1) * tx;
      values.push(top * (1 - ty) + bottom * ty);
    }
  }

  const order = values.map((v, i) => i).sort((a, b) => values[a]! - values[b]! || a - b);
  const heights = new Array<number>(values.length).fill(0);
  order.forEach((idx, rank) => {
    heights[idx] = Math.min(config.levels - 1, Math.floor((rank * config.levels) / values.length));
  });
  return heights;
}
