/**
 * Helper utlity class for working with the HTML Canvas Element.
 *
 * @version 1.1.1
 * @author Frans Blauw
 */
export default class CanvasUtil {
  private static canvas: HTMLCanvasElement;

  private static ctx: CanvasRenderingContext2D;

  /**
   * @param canvas the canvas on which will be drawn
   * @returns the 2D rendering context of the canvas
   */
  private static getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (ctx === null) throw new Error('Canvas Rendering Context is null');
    return ctx;
  }

  public static setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (this.ctx === null) throw new Error('Canvas Rendering Context is null');
  }

  public static getCanvas(): HTMLCanvasElement {
    if (!this.canvas) throw new Error('Canvas is not set');
    return this.canvas;
  }

  /**
   * Fill the canvas with a colour
   *
   * @param canvas canvas that requires filling
   * @param colour the colour that the canvas will be filled with
   */
  public static fillCanvas(canvas: HTMLCanvasElement, colour: string = '#FF10F0'): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colour;
    ctx.fill();
  }

  /**
   * Loads a new image into an HTMLImageElement
   * WARNING: This happens async. Therefor the result might not immediately be visible
   *
   * @param source the path of the image to be loaded
   * @returns the image
   */
  public static loadNewImage(source: string): HTMLImageElement {
    const img = new Image();
    img.src = source;
    return img;
  }

  /**
   * Loads a new images into an HTMLImageElements
   * WARNING: This happens async. Therefor the result might not immediately be visible
   *
   * @param sources the sources of multiple images
   * @param folder the folder in which the images are located, root by default
   * @returns the array of images
   */
  public static loadNewImages(sources: string[], folder?: string) {
    const images: HTMLImageElement[] = [];
    for (const source of sources) {
      images.push(CanvasUtil.loadNewImage(folder ? folder + source : source));
    }
    return images;
  }

  public static drawImage(canvas: HTMLCanvasElement, image: HTMLImageElement, dx: number, dy: number, width: number = 0, height: number = 0, rotation: number = 0, opacity?: number): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);

    if (width === 0) width = image.width;
    if (height === 0) height = image.height;

    ctx.save();

    // Check if opacity is explicitly provided
    if (opacity !== undefined) {
      ctx.globalAlpha = opacity;
    }

    ctx.translate(dx + width / 2, dy + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  /**
   * Clear the canvas, preparing for drawing
   *
   * @param canvas canvas to be cleared
   */
  public static clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Write text to the canvas, with line breaks for each occurrence of "<br>"
   *
   * @param canvas Canvas to write to
   * @param text Text to write
   * @param xCoordinate x-coordinate of the text
   * @param yCoordinate y-coordinate of the text
   * @param alignment align of the text
   * @param fontFamily font family to use when writing text
   * @param fontSize font size in pixels
   * @param color colour of text to write
   * @param fontWeight weight of the letters
   */
  public static writeText(canvas: HTMLCanvasElement, text: string, xCoordinate: number, yCoordinate: number, alignment: CanvasTextAlign = 'center', fontFamily: string = 'sans-serif', fontSize: number = 20, color: string = 'red', fontWeight: number = 10): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = alignment;

    // each time <br> is found in the text, a line break is made
    const lines = text.split('<br>');
    let currentY = yCoordinate;

    for (const line of lines) {
      ctx.fillText(line, xCoordinate, currentY);
      currentY += fontSize;
    }
  }

  /**
   * Write outlined text to the canvas, with line breaks for each occurrence of "<br>"
   *
   * @param canvas Canvas to write to
   * @param text Text to write
   * @param xCoordinate x-coordinate of the text
   * @param yCoordinate y-coordinate of the text
   * @param alignment Align of the text
   * @param fontFamily Font family to use when writing text
   * @param fontSize Font size in pixels
   * @param color Colour of the text outline
   * @param outlineThickness Thickness of the text outline
   * @param fontWeight Font weight
   */
  public static writeTextOutline(
    canvas: HTMLCanvasElement,
    text: string,
    xCoordinate: number,
    yCoordinate: number,
    alignment: CanvasTextAlign = 'center',
    fontFamily: string = 'sans-serif',
    fontSize: number = 20,
    color: string = 'red',
    outlineThickness: number = 0.1,
    fontWeight: number = 10,
  ): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.strokeStyle = color;
    ctx.lineWidth = outlineThickness;
    ctx.textAlign = alignment;

    const lines = text.split('<br>');
    let currentY = yCoordinate;

    for (const line of lines) {
      ctx.strokeText(line, xCoordinate, currentY);
      currentY += fontSize;
    }
  }

  /**
   * Draw a circle outline on the canvas
   *
   * @param canvas the canvas to draw to
   * @param centerX the x-coordinate of the center of the circle
   * @param centerY the y-coordinate of the center of the circle
   * @param radius the radius of the circle
   * @param color the color of the circle outline
   */
  public static drawCircle(canvas: HTMLCanvasElement, centerX: number, centerY: number, radius: number, color: string = 'white'): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  /**
   * Draw a rectangle outline to the canvas
   *
   * @param canvas the canvas to draw to
   * @param dx the x-coordinate of the rectangle's top-left corner
   * @param dy the y-coordinate of the rectangle's top-left corner
   * @param width the width of the rectangle
   * @param height the height of the rectangle
   * @param color the color of the rectangle outline
   */
  public static drawRectangle(canvas: HTMLCanvasElement, dx: number, dy: number, width: number, height: number, color: string = 'white'): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.rect(dx, dy, width, height);
    ctx.stroke();
  }

  /**
   * Draw line to the canvas
   *
   * @param canvas selected canvas
   * @param x1 x position of the starting point of drawn line
   * @param y1 y position of the starting point of drawn line
   * @param x2 x position of the ending point of drawn line
   * @param y2 y position of the ending point of drawn line
   * @param color the color of the line
   * @param lineWidth the width of the line
   */
  public static drawLine(canvas: HTMLCanvasElement, x1: number, y1: number, x2: number, y2: number, color: string = 'white', lineWidth: number = 1): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  /**
   * Draw a filled circle on the canvas
   *
   * @param canvas the canvas to draw to
   * @param centerX the x-coordinate of the center of the circle
   * @param centerY the y-coordinate of the center of the circle
   * @param radius the radius of the circle
   * @param color the color of the circle
   */
  public static fillCircle(canvas: HTMLCanvasElement, centerX: number, centerY: number, radius: number, color: string = 'white'): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Draw a filled rectangle to the canvas
   *
   * @param canvas the canvas to draw to
   * @param dx the x-coordinate of the rectangle's top-left corner
   * @param dy the y-coordinate of the rectangle's top-left corner
   * @param width the width of the rectangle
   * @param height the height of the rectangle
   * @param color the color of the rectangle
   * @param borderRadius optional border radius for rounded corners
   */
  public static fillRectangle(canvas: HTMLCanvasElement, dx: number, dy: number, width: number, height: number, color: string = 'white', borderRadius: number = 0): void {
    const ctx: CanvasRenderingContext2D = CanvasUtil.getCanvasContext(canvas);
    ctx.beginPath();
    ctx.fillStyle = color;

    if (borderRadius > 0) {
      // Draw rounded rectangle
      ctx.moveTo(dx + borderRadius, dy);
      ctx.lineTo(dx + width - borderRadius, dy);
      ctx.arcTo(dx + width, dy, dx + width, dy + borderRadius, borderRadius);
      ctx.lineTo(dx + width, dy + height - borderRadius);
      ctx.arcTo(dx + width, dy + height, dx + width - borderRadius, dy + height, borderRadius);
      ctx.lineTo(dx + borderRadius, dy + height);
      ctx.arcTo(dx, dy + height, dx, dy + height - borderRadius, borderRadius);
      ctx.lineTo(dx, dy + borderRadius);
      ctx.arcTo(dx, dy, dx + borderRadius, dy, borderRadius);
      ctx.closePath();
    } else {
      // Draw regular rectangle
      ctx.rect(dx, dy, width, height);
    }

    ctx.fill();
  }
}
