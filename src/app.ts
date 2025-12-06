import { GameLoop, Game } from './GameLoop.js';
import Scene from './scenes/Scene.js';
import Start from './scenes/Start.js';
import KeyListener from './utilities/KeyListener.js';
import MouseListener from './utilities/MouseListener.js';
import CanvasUtil from './utilities/CanvasUtil.js';

class MiniWaterways extends Game {
  private canvas: HTMLCanvasElement;
  private keyListener: KeyListener;
  private mouseListener: MouseListener;
  private currentScene: Scene;

  public constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Set the canvas for CanvasUtil
    CanvasUtil.setCanvas(this.canvas);

    // Initialize input listeners
    this.keyListener = new KeyListener();
    this.mouseListener = new MouseListener(this.canvas);

    // Start with the Start scene
    this.currentScene = new Start();
  }

  public processInput(): void {
    this.currentScene.processInput(this.keyListener);
  }

  public update(elapsed: number): boolean {
    this.currentScene = this.currentScene.update(elapsed);
    return true;
  }

  public render(): void {
    CanvasUtil.clearCanvas(this.canvas);
    CanvasUtil.fillCanvas(this.canvas, '#4a90e2');
    this.currentScene.render(this.canvas);
  }
}

const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const game = new MiniWaterways(gameCanvas);

const gameLoop = new GameLoop(game, gameCanvas);
window.addEventListener('load', () => {
  gameLoop.start();
});
