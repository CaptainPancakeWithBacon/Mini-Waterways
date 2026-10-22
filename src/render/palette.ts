// Eigen palet: zacht gelaagd land, helder water. De vier kleuren komen uit de Okabe-Ito set, die ook bij
// kleurenblindheid uit elkaar te houden is; elke kleur heeft bovendien een eigen merkteken (zie draw.ts).
export const palette = {
  paper: '#f4efe3',
  ink: '#243b4a',
  water: '#4f95bd',
  waterLight: '#a8d0e6',
  bank: '#fbf8ef',
  shadow: 'rgba(36, 59, 74, 0.22)',
  // hoger land is lichter, alsof de zon er beter bij kan
  levels: ['#d9e5cd', '#e6eed4', '#f3f1dc'],
  trees: ['#8db487', '#7ba776', '#a3c398'],
  colours: ['#0072b2', '#d55e00', '#009e73', '#cc79a7'],
} as const;

/** Meng een kleur met zwart (amt < 0) of wit (amt > 0). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}
