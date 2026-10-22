// Eigen palet: warm papier voor het land, helder water voor het kanaal. De vier kleuren komen uit de
// Okabe-Ito set, die ook bij kleurenblindheid uit elkaar te houden is; elke kleur heeft bovendien een
// eigen merkteken (zie draw.ts).
export const palette = {
  paper: '#f4efe3',
  ink: '#243b4a',
  water: '#4f95bd',
  waterLight: '#a8d0e6',
  levels: ['#f0e9d7', '#e9e0c8', '#e1d6b9'],
  colours: ['#0072b2', '#d55e00', '#009e73', '#cc79a7'],
} as const;
