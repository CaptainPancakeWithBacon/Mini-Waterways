import UIButton from './UIButton.js';

/**
 * Manages a collection of buttons displayed in a bar at the bottom of the screen
 * Handles button layout, updating, and rendering
 */
export default class ButtonBar {
  private buttons: Map<string, UIButton> = new Map();

  private barHeight: number = 80;

  private padding: number = 10;

  private buttonSpacing: number = 10;

  /**
   * Adds a button to the button bar
   *
   * @param id Unique identifier for the button
   * @param button The button to add
   */
  public addButton(id: string, button: UIButton): void {
    this.buttons.set(id, button);
  }

  /**
   * Gets a button by its ID
   *
   * @param id The button identifier
   * @returns The button, or undefined if not found
   */
  public getButton(id: string): UIButton | undefined {
    return this.buttons.get(id);
  }

  /**
   * Creates the default button layout for the game
   *
   * @param canvasWidth Width of the canvas for centering buttons
   * @param canvasHeight Height of the canvas for positioning at bottom
   */
  public createGameButtons(canvasWidth: number, canvasHeight: number): void {
    const buttonWidth = 120;
    const buttonHeight = 50;
    const startY = canvasHeight - this.barHeight + this.padding + 5;

    // Calculate total width needed for all buttons
    const buttonCount = 8;
    const totalWidth = (buttonWidth * buttonCount) + (this.buttonSpacing * (buttonCount - 1));
    let startX = (canvasWidth - totalWidth) / 2;

    // Place Tiles button
    this.addButton(
      'placeTiles',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '🔨 Place (P)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(52, 152, 219, 0.9)',
        'rgba(52, 152, 219, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Remove Tiles button
    this.addButton(
      'removeTiles',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '🗑️ Remove (R)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(231, 76, 60, 0.9)',
        'rgba(231, 76, 60, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Create Line button
    this.addButton(
      'createLine',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '🚌 Line (L)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(243, 156, 18, 0.9)',
        'rgba(243, 156, 18, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Complete Line button (only visible in line mode)
    this.addButton(
      'completeLine',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '✓ Done (Enter)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(46, 204, 113, 0.9)',
        'rgba(46, 204, 113, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Cancel Line button (only visible in line mode)
    this.addButton(
      'cancelLine',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '✗ Cancel (Esc)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(231, 76, 60, 0.9)',
        'rgba(231, 76, 60, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Undo Port button (only visible in line mode)
    this.addButton(
      'undoPort',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '↶ Undo (Back)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(155, 89, 182, 0.9)',
        'rgba(155, 89, 182, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Add Boat button (normal mode)
    this.addButton(
      'addBoat',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '🚤 Add Boat (B)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(26, 188, 156, 0.9)',
        'rgba(26, 188, 156, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Edit Line button (normal mode)
    this.addButton(
      'editLine',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '✏️ Edit Line (E)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(155, 89, 182, 0.9)',
        'rgba(155, 89, 182, 0.9)',
      ),
    );
    startX += buttonWidth + this.buttonSpacing;

    // Delete Line button (edit mode only)
    this.addButton(
      'deleteLine',
      new UIButton(
        startX,
        startY,
        buttonWidth,
        buttonHeight,
        '🗑️ Delete (Del)',
        'rgba(52, 73, 94, 0.9)',
        'rgba(231, 76, 60, 0.9)',
        'rgba(231, 76, 60, 0.9)',
      ),
    );
  }

  /**
   * Updates all buttons in the bar
   * Should be called every frame
   */
  public update(): void {
    for (const button of this.buttons.values()) {
      button.update();
    }
  }

  /**
   * Draws all buttons and the button bar background
   *
   * @param canvas The canvas to draw on
   * @param isLineMode Whether line creation mode is active
   * @param isEditMode Whether line editing mode is active
   */
  public draw(canvas: HTMLCanvasElement, isLineMode: boolean, isEditMode: boolean): void {
    // Draw button bar background
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - this.barHeight, canvas.width, this.barHeight);

    // Draw buttons based on mode
    const placeTiles = this.buttons.get('placeTiles');
    const removeTiles = this.buttons.get('removeTiles');
    const createLine = this.buttons.get('createLine');
    const completeLine = this.buttons.get('completeLine');
    const cancelLine = this.buttons.get('cancelLine');
    const undoPort = this.buttons.get('undoPort');
    const addBoat = this.buttons.get('addBoat');
    const editLine = this.buttons.get('editLine');
    const deleteLine = this.buttons.get('deleteLine');

    if (isLineMode) {
      // In line creation mode, only show line-related buttons
      createLine?.draw(canvas);
      completeLine?.draw(canvas);
      cancelLine?.draw(canvas);
      undoPort?.draw(canvas);
    } else if (isEditMode) {
      // In edit mode, show edit-related buttons
      editLine?.draw(canvas);
      deleteLine?.draw(canvas);
      cancelLine?.draw(canvas);
    } else {
      // In normal mode, show all normal buttons
      placeTiles?.draw(canvas);
      removeTiles?.draw(canvas);
      createLine?.draw(canvas);
      addBoat?.draw(canvas);
      editLine?.draw(canvas);
    }
  }

  /**
   * Gets the height of the button bar
   *
   * @returns The bar height in pixels
   */
  public getBarHeight(): number {
    return this.barHeight;
  }
}
