import CanvasUtil from './CanvasUtil.js';
import MouseListener from './MouseListener.js';

/**
 * Represents a clickable button in the UI
 * Handles rendering, hover states, and click detection
 */
export default class UIButton {
  private x: number;

  private y: number;

  private width: number;

  private height: number;

  private label: string;

  private isPressed: boolean = false;

  private wasPressed: boolean = false;

  private isHovered: boolean = false;

  private isActive: boolean = false;

  private backgroundColor: string;

  private hoverColor: string;

  private activeColor: string;

  private textColor: string;

  /**
   * Creates a new UIButton instance
   *
   * @param x X coordinate of the button
   * @param y Y coordinate of the button
   * @param width Width of the button
   * @param height Height of the button
   * @param label Text displayed on the button
   * @param backgroundColor Normal background color
   * @param hoverColor Color when hovering
   * @param activeColor Color when active/toggled
   */
  public constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    backgroundColor: string = 'rgba(52, 73, 94, 0.9)',
    hoverColor: string = 'rgba(52, 152, 219, 0.9)',
    activeColor: string = 'rgba(46, 204, 113, 0.9)',
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.label = label;
    this.backgroundColor = backgroundColor;
    this.hoverColor = hoverColor;
    this.activeColor = activeColor;
    this.textColor = '#ffffff';
  }

  /**
   * Sets the active/toggled state of the button
   *
   * @param active Whether the button should be active
   */
  public setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Gets whether the button is currently active
   *
   * @returns True if active
   */
  public getActive(): boolean {
    return this.isActive;
  }

  /**
   * Checks if a point is inside the button bounds
   *
   * @param pointX X coordinate to check
   * @param pointY Y coordinate to check
   * @returns True if point is inside button
   */
  public contains(pointX: number, pointY: number): boolean {
    return pointX >= this.x
      && pointX <= this.x + this.width
      && pointY >= this.y
      && pointY <= this.y + this.height;
  }

  /**
   * Updates the button state based on mouse input
   * Should be called every frame
   */
  public update(): void {
    const mousePos = MouseListener.mouseCoordinates;
    this.isHovered = this.contains(mousePos.x, mousePos.y);

    // Track button press state
    const currentlyPressed = this.isHovered && MouseListener.isButtonDown(MouseListener.BUTTON_LEFT);

    // Detect new click (wasn't pressed before, is pressed now)
    this.isPressed = currentlyPressed && !this.wasPressed;
    this.wasPressed = currentlyPressed;
  }

  /**
   * Checks if the button was clicked this frame
   *
   * @returns True if clicked
   */
  public isClicked(): boolean {
    return this.isPressed;
  }

  /**
   * Draws the button on the canvas
   *
   * @param canvas The canvas to draw on
   */
  public draw(canvas: HTMLCanvasElement): void {
    // Determine button color based on state
    let bgColor = this.backgroundColor;
    if (this.isActive) {
      bgColor = this.activeColor;
    } else if (this.isHovered) {
      bgColor = this.hoverColor;
    }

    // Draw button background
    CanvasUtil.fillRectangle(
      canvas,
      this.x,
      this.y,
      this.width,
      this.height,
      bgColor,
      5,
    );

    // Draw button border
    CanvasUtil.drawRectangle(
      canvas,
      this.x,
      this.y,
      this.width,
      this.height,
      'rgba(255, 255, 255, 0.5)',
    );

    // Draw button label
    CanvasUtil.writeText(
      canvas,
      this.label,
      this.x + this.width / 2,
      this.y + this.height / 2 + 5,
      'center',
      'sans-serif',
      14,
      this.textColor,
      600,
    );
  }
}
