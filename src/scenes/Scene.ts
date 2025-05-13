import KeyListener from '../utilities/KeyListener.js';

export default abstract class Scene {
  public abstract processInput(keyListener: KeyListener): void;
  public abstract update(elapsed: number): Scene;
  public abstract render(canvas: HTMLCanvasElement): void;
}
