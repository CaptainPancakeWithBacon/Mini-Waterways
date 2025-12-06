import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

export default class Grid {
  private gridSize: number = 50;
  private width: number;
  private height: number;

  constructor(width: number, height: number, gridSize: number = 50) {
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
  }

  public snapToGrid(point: Point): Point {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize,
    };
  }

  public getGridSize(): number {
    return this.gridSize;
  }

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
