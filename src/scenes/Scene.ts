import KeyListener from '../utilities/KeyListener.js';

/**
 * Abstract base class for game scenes
 * Defines the interface that all scenes must implement
 */
export default abstract class Scene {
  /**
   * Processes user input for this scene
   * @param keyListener The keyboard input listener
   */
  public abstract processInput(keyListener: KeyListener): void;

  /**
   * Updates the scene state
   * @param elapsed Time elapsed since last update in milliseconds
   * @returns The next scene to display (may return itself)
   */
  public abstract update(elapsed: number): Scene;

  /**
   * Renders the scene to the canvas
   * @param canvas The canvas to render on
   */
  public abstract render(canvas: HTMLCanvasElement): void;
}
