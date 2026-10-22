// Eigen palet: papier en inkt. De vier kleuren komen uit de Okabe-Ito set, die ook bij kleurenblindheid
// uit elkaar te houden is; elke kleur heeft bovendien een eigen merkteken (zie draw.ts).
export const palette = {
  paper: '#f1ead9',
  grid: '#e2d9c2',
  ink: '#243b4a',
  canal: '#7fa3b8',
  levels: ['#eee6cf', '#e6dfc3', '#ddd6b6'],
  colours: ['#0072b2', '#d55e00', '#009e73', '#cc79a7'],
} as const;
