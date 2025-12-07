import { Point } from './Boat.js';
import { Boat } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';
import Port from './Port.js';

/**
 * Color palette for routes
 */
const ROUTE_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#e67e22', // Carrot
  '#34495e', // Wet Asphalt
];

let nextColorIndex = 0;

/**
 * Represents a transit route connecting two ports
 * Routes consist of waypoints and can have boats traveling along them
 */
export default class Route {
  private points: Point[] = [];
  private startPort: Port | null = null;
  private endPort: Port | null = null;
  private color: string;
  private lineWidth: number = 8;
  private boats: Boat[] = [];

  /**
   * Creates a new Route instance
   * @param startPort Optional starting port for the route
   */
  constructor(startPort?: Port) {
    if (startPort) {
      this.startPort = startPort;
      this.points.push(startPort.getPosition());
    }
    // Assign color from palette
    this.color = ROUTE_COLORS[nextColorIndex % ROUTE_COLORS.length];
    nextColorIndex++;
  }

  /**
   * Adds a waypoint to the route
   * @param point The point to add to the route
   */
  public addPoint(point: Point): void {
    this.points.push(point);
  }

  /**
   * Sets the end port for the route
   * Updates the last point to match the port's position
   * @param port The port to set as the destination
   */
  public setEndPort(port: Port): void {
    this.endPort = port;
    if (this.points.length > 0) {
      this.points[this.points.length - 1] = port.getPosition();
    }
  }

  /**
   * Gets all waypoints in the route
   * @returns A copy of the route's points array
   */
  public getPoints(): Point[] {
    return [...this.points];
  }

  /**
   * Checks if the route has both a start and end port
   * @returns True if the route is complete
   */
  public isComplete(): boolean {
    return this.startPort !== null && this.endPort !== null;
  }

  /**
   * Gets the starting port of the route
   * @returns The start port or null if not set
   */
  public getStartPort(): Port | null {
    return this.startPort;
  }

  /**
   * Gets the ending port of the route
   * @returns The end port or null if not set
   */
  public getEndPort(): Port | null {
    return this.endPort;
  }

  /**
   * Gets the color assigned to this route
   * @returns The route's color as a hex string
   */
  public getColor(): string {
    return this.color;
  }

  /**
   * Adds a boat to this route
   * @param boat The boat to add
   */
  public addBoat(boat: Boat): void {
    this.boats.push(boat);
  }

  /**
   * Gets all boats currently on this route
   * @returns Array of boats on the route
   */
  public getBoats(): Boat[] {
    return this.boats;
  }

  /**
   * Removes a boat from this route
   * @param boat The boat to remove
   */
  public removeBoat(boat: Boat): void {
    const index = this.boats.indexOf(boat);
    if (index > -1) {
      this.boats.splice(index, 1);
    }
  }

  /**
   * Simplifies the route path by removing redundant waypoints
   * Removes points that don't significantly change the direction
   */
  public simplifyPath(): void {
    if (this.points.length <= 2) return;

    // Keep only points that change direction significantly
    const simplified: Point[] = [this.points[0]];

    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = this.points[i - 1];
      const current = this.points[i];
      const next = this.points[i + 1];

      // Calculate angle change
      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      const angleDiff = Math.abs(angle2 - angle1);

      // Keep point if direction changes significantly
      if (angleDiff > 0.1) {
        simplified.push(current);
      }
    }

    simplified.push(this.points[this.points.length - 1]);
    this.points = simplified;
  }

  /**
   * Draws the route on the canvas
   * Renders the route path, center line, and direction arrows
   * @param canvas The canvas to draw on
   */
  public draw(canvas: HTMLCanvasElement): void {
    if (this.points.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw route shadow
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = this.lineWidth + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw route path
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw route center line (for bidirectional indication)
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw direction arrows to show bidirectional
    if (this.isComplete()) {
      this.drawDirectionArrows(ctx);
    }
  }

  /**
   * Draws bidirectional arrows along the route
   * Shows arrows in both directions to indicate two-way travel
   * @param ctx The 2D rendering context to draw with
   */
  private drawDirectionArrows(ctx: CanvasRenderingContext2D): void {
    // Draw arrows along the route to show bidirectional travel
    for (let i = 0; i < this.points.length - 1; i++) {
      const start = this.points[i];
      const end = this.points[i + 1];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      // Draw forward arrow
      ctx.save();
      ctx.translate(midX + Math.cos(angle) * 10, midY + Math.sin(angle) * 10);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, -3);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      ctx.restore();

      // Draw backward arrow
      ctx.save();
      ctx.translate(midX - Math.cos(angle) * 10, midY - Math.sin(angle) * 10);
      ctx.rotate(angle + Math.PI);
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, -3);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      ctx.restore();
    }
  }
}
