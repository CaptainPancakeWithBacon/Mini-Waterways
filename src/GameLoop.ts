/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */

/**
 * Represents a basic Game Loop based on `requestAnimationFrame()`.
 *
 * The implementation of this class depends on another class: `Game`. This
 * means that, if you use this class, you need to either have a `Game` class
 * that exactly implements the three methods `processInput()`, `update(elapsed)`
 * and `render()` or change the code in the `step()` method of this class so it
 * represents your own game methods.
 *
 * @see https://gameprogrammingpatterns.com/game-loop.html
 * @author BugSlayer
 */

export abstract class Game {
  public abstract processInput(): void;
  public abstract update(elapsed: number): boolean;
  public abstract render(): void;
}

export class GameLoop {
  public static readonly STATE_IDLE = 0;

  public static readonly STATE_STARTING = 1;

  public static readonly STATE_RUNNING = 2;

  public static readonly STATE_STOPPING = 3;

  public static readonly NORMAL_MODE = 0;

  public static readonly PLAY_CATCH_UP = 1;

  private mode: number;

  private state: number;

  private game: Game;

  private previousElapsed: number;

  private gameStart: number;

  private frameEnd: number;

  public gameTime: number;

  public frameCount: number;

  public fps: number;

  public load: number;

  private readonly targetFrameRate: number = 80;

  private readonly frameTimeLimit: number = 1000 / this.targetFrameRate;

  private canvas: HTMLCanvasElement;

  public constructor(game: Game, canvas: HTMLCanvasElement, mode: number = GameLoop.NORMAL_MODE) {
    this.state = GameLoop.STATE_IDLE;
    this.mode = mode;
    this.game = game;
    this.canvas = canvas; // Initialize canvas
  }

  /**
   * Start the game loop.
   */
  public start(): void {
    if (this.state === GameLoop.STATE_IDLE) {
      this.state = GameLoop.STATE_STARTING;
      this.gameStart = performance.now();
      this.frameEnd = this.gameStart;
      this.previousElapsed = this.gameStart;
      this.gameTime = 0;
      this.frameCount = 0;
      requestAnimationFrame(this.step);
    }
  }

  /**
   * Requests to gracefully stop the gameloop.
   */
  public stop(): void {
    this.state = GameLoop.STATE_STOPPING;
  }

  /**
   * Returns `true` if the given state exactly matches the current state of
   * this object
   *
   * @param state the state to check
   * @returns `true` if the given state exactly matches the current state of
   *   this object
   */
  public isInState(state: number): boolean {
    return this.state === state;
  }

  /**
   * This MUST be an arrow method in order to keep the `this` variable working
   * correctly. It will be overwritten by another object otherwise caused by
   * javascript scoping behaviour.
   *
   * @param timestamp a `DOMHighResTimeStamp` similar to the one returned by
   *   `performance.now()`, indicating the point in time when `requestAnimationFrame()`
   *   starts to execute callback functions
   */
  private step = (timestamp: number) => {
    if (this.isInState(GameLoop.STATE_STARTING)) {
      this.state = GameLoop.STATE_RUNNING;
    }

    this.game.processInput();

    // Let the game update itself
    let shouldStop = false;
    if (this.mode === GameLoop.PLAY_CATCH_UP) {
      const step = 1;
      while (this.previousElapsed < timestamp && !shouldStop) {
        shouldStop = !this.game.update(step);
        this.previousElapsed += step;
      }
    } else {
      const now = performance.now();
      const elapsed = now - this.previousElapsed;
      shouldStop = !this.game.update(elapsed);
      this.previousElapsed = now;
    }

    // Let the game render itself
    this.game.render();

    // Check if a next animation frame needs to be requested
    if (!shouldStop || this.isInState(GameLoop.STATE_STOPPING)) {
      const nextTimestamp = timestamp + this.frameTimeLimit;
      setTimeout(() => {
        requestAnimationFrame(this.step);
      }, Math.max(0, nextTimestamp - performance.now()));
    } else {
      this.state = GameLoop.STATE_IDLE;
    }

    // Handle time measurement and analysis
    const now = performance.now();
    const stepTime = timestamp - now;
    const frameTime = now - this.frameEnd;
    this.fps = Math.round(1000 / frameTime);
    this.load = stepTime / frameTime;
    this.frameEnd = now;
    this.gameTime = now - this.gameStart;
    this.frameCount += 1;

    this.renderFPS();
  };

  /**
   * renders fps on the screen
   */
  private renderFPS() {
    const context = this.canvas.getContext('2d');
    if (context) {
      context.font = '20px System-ui';
      context.fillText(`FPS: ${this.fps}`, window.innerWidth / 50, window.innerHeight / 45);
    }
  }
}
