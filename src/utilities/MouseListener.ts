export interface MouseCoordinates {
  x: number;
  y: number;
}

export default class MouseListener {
  public static readonly BUTTON_LEFT = 0;

  public static readonly BUTTON_MIDDLE = 1;

  public static readonly BUTTON_RIGHT = 2;

  public static mouseCoordinates: MouseCoordinates = { x: 0, y: 0 };

  private static buttonDown: Record<number, boolean> = {};

  private static buttonQueried: Record<number, boolean> = {};

  private static buttonUp: Record<number, boolean> = {};

  public static mouseUp: boolean = false;

  /**
   *
   * @param canvas the canvas element to which the relative coordinates should given
   * @param disableContextMenu true to disable the context (right click) menu. Default: false
   */
  public constructor(canvas: HTMLCanvasElement, disableContextMenu: boolean = false) {
    canvas.addEventListener('mousemove', (ev: MouseEvent) => {
      MouseListener.mouseCoordinates = {
        x: ev.offsetX,
        y: ev.offsetY,
      };
    });
    canvas.addEventListener('mousedown', (ev: MouseEvent) => {
      MouseListener.buttonDown[ev.button] = true;
      MouseListener.mouseUp = false;
    });
    canvas.addEventListener('mouseup', (ev: MouseEvent) => {
      MouseListener.buttonDown[ev.button] = false;
      MouseListener.buttonQueried[ev.button] = false;
      MouseListener.buttonUp[ev.button] = true;
      MouseListener.mouseUp = true;
    });
    if (disableContextMenu) {
      canvas.addEventListener('contextmenu', (ev: MouseEvent) => {
        ev.preventDefault();
      });
    }
  }

  /**
   * Checks whether a mouse button is currently down.
   *
   * @param buttonCode the mouse button to check
   * @returns `true` when the specified button is currently down
   */
  public static isButtonDown(buttonCode: number = 0): boolean {
    return this.buttonDown[buttonCode];
  }

  /**
   * Check if a button was pressed this frame.
   * @param buttonCode the mouse button to check
   * @returns `true` when the specified button was pressed
   */
  public static buttonPressed(buttonCode: number): boolean {
    if (MouseListener.buttonQueried[buttonCode] === true) return false;
    if (this.buttonDown[buttonCode] === true) {
      this.buttonQueried[buttonCode] = true;
      return true;
    }
    return false;
  }

  /**
   * @returns boolean if the mouse clicks between the specified positions
   * @param buttonCode the mouse button to check
   * @param posX the x-coordinate of the top-left corner of the rectangle
   * @param posY the y-coordinate of the top-left corner of the rectangle
   * @param width the width of the rectangle
   * @param height the height of the rectangle
   */
  public static areaPressed(buttonCode: number, posX: number, posY: number, width: number, height: number): boolean {
    if (MouseListener.buttonPressed(buttonCode) && MouseListener.mouseCoordinates.x > posX && MouseListener.mouseCoordinates.y > posY && MouseListener.mouseCoordinates.x < posX + width && MouseListener.mouseCoordinates.y < posY + height) {
      return true;
    }
    return false;
  }

  /**
   * @returns boolean
   * @param buttonCode the mouse button to check
   * @param posX the x-coordinate of the mid point of the circle
   * @param posY the y-coordinate of the mid point of the circle
   * @param radius the radius of the circle
   */
  public static circlePressed(buttonCode: number, posX: number, posY: number, radius: number): boolean {
    if (MouseListener.buttonPressed(buttonCode)) {
      const dx = MouseListener.mouseCoordinates.x - posX;
      const dy = MouseListener.mouseCoordinates.y - posY;
      return Math.sqrt(dx ** 2 + dy ** 2) < radius;
    }
    return false;
  }

  /**
   * @returns boolean
   * @param buttonCode the mouse button to check
   * @param posX the x-coordinate of the mid point of the circle
   * @param posY the y-coordinate of the mid point of the circle
   * @param radius the radius of the circle
   */
  public static circleDown(buttonCode: number, posX: number, posY: number, radius: number): boolean {
    if (MouseListener.isButtonDown(buttonCode)) {
      const dx = MouseListener.mouseCoordinates.x - posX;
      const dy = MouseListener.mouseCoordinates.y - posY;
      return Math.sqrt(dx ** 2 + dy ** 2) < radius;
    }
    return false;
  }

  /**
   * @returns boolean
   * @param posX the x-coordinate of the mid point of the circle
   * @param posY the y-coordinate of the mid point of the circle
   * @param radius the radius of the circle
   */
  public static circleCollision(posX: number, posY: number, radius: number): boolean {
    const dx = MouseListener.mouseCoordinates.x - posX;
    const dy = MouseListener.mouseCoordinates.y - posY;
    return Math.sqrt(dx ** 2 + dy ** 2) < radius;
  }

  /**
   * @returns boolean if the mouse clicks between the specified positions
   * @param buttonCode the mouse button to check
   * @param posX the x-coordinate of the top-left corner of the rectangle
   * @param posY the y-coordinate of the top-left corner of the rectangle
   * @param width the width of the rectangle
   * @param height the height of the rectangle
   */
  public static areaDown(buttonCode: number, posX: number, posY: number, width: number, height: number): boolean {
    if (MouseListener.isButtonDown(buttonCode) && MouseListener.mouseCoordinates.x > posX && MouseListener.mouseCoordinates.y > posY && MouseListener.mouseCoordinates.x < posX + width && MouseListener.mouseCoordinates.y < posY + height) {
      return true;
    }
    return false;
  }

  /**
   * @returns boolean
   * @param posX is the posX of the item the mouse is hovering over
   * @param posY is the posY of the item the mouse is hovering over
   * @param width is the width of the item the mouse is hovering over
   * @param height is the height of the item the mouse is hovering over
   */
  public static mouseHover(posX: number, posY: number, width: number, height: number): boolean {
    if (MouseListener.mouseCoordinates.x > posX && MouseListener.mouseCoordinates.y > posY && MouseListener.mouseCoordinates.x < posX + width && MouseListener.mouseCoordinates.y < posY + height) {
      return true;
    }
    return false;
  }
}
