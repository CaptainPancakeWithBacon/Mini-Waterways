import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

/**
 * Represents a grid system for positioning and snapping elements
 * Provides utilities for grid-based positioning and random placement
 */
export default class Grid {
  private gridSize: number = 50;
  private width: number;
  private height: number;

  /**
   * Creates a new Grid instance
   * @param width The total width of the grid area
   * @param height The total height of the grid area
   * @param gridSize The size of each grid cell (default: 50)
   */
  constructor(width: number, height: number, gridSize: number = 50) {
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
  }

  /**
   * Snaps a point to the nearest grid position
   * @param point The point to snap
   * @returns A new point aligned to the grid
   */
  public snapToGrid(point: Point): Point {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Gets the current grid cell size
   * @returns The size of each grid cell in pixels
   */
  public getGridSize(): number {
    return this.gridSize;
  }

  /**
   * Draws the grid lines on the canvas
   * Renders both regular grid lines and stronger accent lines
   * @param canvas The canvas to draw on
   */
  public draw(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = this.gridSize; x < this.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = this.gridSize; y < this.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Draw stronger lines every 100 pixels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;

    for (let x = this.gridSize * 2; x < this.width; x += this.gridSize * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = this.gridSize * 2; y < this.height; y += this.gridSize * 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  /**
   * Generates a random position on the grid within the specified margin
   * @param margin Distance from edges to avoid (default: 100)
   * @returns A random grid-aligned point
   */
  public getRandomGridPosition(margin: number = 100): Point {
    const minX = Math.ceil(margin / this.gridSize);
    const maxX = Math.floor((this.width - margin) / this.gridSize);
    const minY = Math.ceil(margin / this.gridSize);
    const maxY = Math.floor((this.height - margin) / this.gridSize);

    const gridX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const gridY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    return {
      x: gridX * this.gridSize,
      y: gridY * this.gridSize,
    };
  }
}
