import { GameLoop } from './GameLoop.js';
import ColorGa from './utilities/ColorGa.js';

const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const game = new ColorGa(gameCanvas);

const gameLoop = new GameLoop(game, gameCanvas); // Pass the canvas to the GameLoop
window.addEventListener('load', () => {
  gameLoop.start();
});
