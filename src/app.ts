import { GameLoop, Game } from './GameLoop.js';
import Scene from './scenes/Scene.js';
import Start from './scenes/Start.js';
import KeyListener from './utilities/KeyListener.js';
import MouseListener from './utilities/MouseListener.js';
import CanvasUtil from './utilities/CanvasUtil.js';

/**
 * Main game class for Mini Waterways
 * Manages the game canvas, input listeners, and scene transitions
 */
class MiniWaterways extends Game {
  private canvas: HTMLCanvasElement;

  private keyListener: KeyListener;

  private mouseListener: MouseListener;

  private currentScene: Scene;

  /**
   * Creates a new MiniWaterways game instance
   *
   * @param canvas The HTML canvas element to render the game on
   */
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

  /**
   * Processes user input from keyboard and mouse
   * Delegates input processing to the current scene
   */
  public processInput(): void {
    this.currentScene.processInput(this.keyListener);
  }

  /**
   * Updates the game state
   *
   * @param elapsed Time elapsed since last update in milliseconds
   * @returns True to continue the game loop
   */
  public update(elapsed: number): boolean {
    this.currentScene = this.currentScene.update(elapsed);
    return true;
  }

  /**
   * Renders the current game state to the canvas
   * Clears the canvas, fills background, and renders the current scene
   */
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
