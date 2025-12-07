import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

/**
 * Types of ports in the game
 */
export enum PortType {
  /** Residential port - generates passengers heading to other port types */
  RESIDENTIAL = 'residential',
  /** Industrial port - generates passengers heading to other port types */
  INDUSTRIAL = 'industrial',
  /** Commercial port - generates passengers heading to other port types */
  COMMERCIAL = 'commercial',
}

/**
 * Represents a passenger waiting at or traveling to a port
 */
export interface Passenger {
  /** The type of port this passenger wants to reach */
  destinationType: PortType;
  /** Visual color representing the destination type */
  color: string;
}

/**
 * Represents a port where passengers spawn and boats can dock
 * Handles passenger generation, overflow detection, and visual representation
 */
export default class Port {
  private position: Point;
  private radius: number = 30;
  private color: string;
  private name: string;
  private type: PortType;

  // Passenger/demand system
  private passengers: Passenger[] = [];
  private maxCapacity: number = 20;
  private passengerSpawnInterval: number = 2000; // Spawn every 2 seconds
  private passengerSpawnTimer: number = 0;
  private overflowTimer: number = 0;
  private overflowThreshold: number = 5000; // 5 seconds of overflow
  private allPortTypes: PortType[] = [PortType.RESIDENTIAL, PortType.INDUSTRIAL, PortType.COMMERCIAL];

  // Visual properties
  private pulseAnimation: number = 0;
  private isOverflowing: boolean = false;

  /**
   * Creates a new Port instance
   * @param x X coordinate of the port
   * @param y Y coordinate of the port
   * @param name Display name of the port
   * @param type Type of port (default: RESIDENTIAL)
   */
  constructor(x: number, y: number, name: string, type: PortType = PortType.RESIDENTIAL) {
    this.position = { x, y };
    this.name = name;
    this.type = type;
    this.color = this.getColorForType(type);
  }

  /**
   * Gets the color associated with a port type
   * @param type The port type
   * @returns Hex color string
   */
  private getColorForType(type: PortType): string {
    switch (type) {
      case PortType.RESIDENTIAL:
        return '#2ecc71'; // Green
      case PortType.INDUSTRIAL:
        return '#e74c3c'; // Red
      case PortType.COMMERCIAL:
        return '#f39c12'; // Orange
      default:
        return '#3498db'; // Blue
    }
  }

  /**
   * Gets the position of the port
   * @returns A copy of the port's position
   */
  public getPosition(): Point {
    return { ...this.position };
  }

  /**
   * Gets the name of the port
   * @returns The port's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Gets the type of the port
   * @returns The port's type
   */
  public getType(): PortType {
    return this.type;
  }

  /**
   * Checks if a point is within the port's boundaries
   * @param point The point to check
   * @returns True if the point is inside the port
   */
  public contains(point: Point): boolean {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  /**
   * Generates a new passenger with a random destination
   * Destination is always a different port type than this one
   * @returns A new passenger object
   */
  private generatePassenger(): Passenger {
    // Generate passenger with random destination (different from current port)
    const availableTypes = this.allPortTypes.filter(t => t !== this.type);
    const destinationType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return {
      destinationType,
      color: this.getColorForType(destinationType)
    };
  }

  /**
   * Adds a specified number of passengers to the port
   * @param count Number of passengers to add
   */
  public addPassengers(count: number): void {
    for (let i = 0; i < count; i++) {
      this.passengers.push(this.generatePassenger());
    }
  }

  /**
   * Removes passengers from the port
   * @param count Maximum number of passengers to remove
   * @param targetType Optional port type to filter passengers by destination
   * @returns Array of removed passengers
   */
  public removePassengers(count: number, targetType?: PortType): Passenger[] {
    const removed: Passenger[] = [];

    if (targetType) {
      // Remove only passengers going to target type
      for (let i = this.passengers.length - 1; i >= 0 && removed.length < count; i--) {
        if (this.passengers[i].destinationType === targetType) {
          removed.push(this.passengers.splice(i, 1)[0]);
        }
      }
    } else {
      // Remove any passengers
      const toRemove = Math.min(count, this.passengers.length);
      removed.push(...this.passengers.splice(0, toRemove));
    }

    if (removed.length > 0) {
      this.isOverflowing = false;
      this.overflowTimer = 0;
    }
    return removed;
  }

  /**
   * Gets the current number of passengers waiting at the port
   * @returns Number of passengers
   */
  public getPassengers(): number {
    return this.passengers.length;
  }

  /**
   * Gets the number of passengers heading to a specific port type
   * @param destinationType The destination port type to count
   * @returns Number of passengers heading to that type
   */
  public getPassengersByDestination(destinationType: PortType): number {
    return this.passengers.filter(p => p.destinationType === destinationType).length;
  }

  /**
   * Checks if the port is at maximum capacity
   * @returns True if at capacity
   */
  public isAtCapacity(): boolean {
    return this.passengers.length >= this.maxCapacity;
  }

  /**
   * Updates the port state
   * Handles passenger spawning, animations, and overflow detection
   * @param elapsed Time elapsed since last update in milliseconds
   */
  public update(elapsed: number): void {
    // Spawn passengers at intervals
    this.passengerSpawnTimer += elapsed;
    if (this.passengerSpawnTimer >= this.passengerSpawnInterval) {
      this.passengers.push(this.generatePassenger());
      this.passengerSpawnTimer = 0;
    }

    // Update pulse animation
    this.pulseAnimation += elapsed / 1000;

    // Check for overflow
    if (this.passengers.length >= this.maxCapacity) {
      this.isOverflowing = true;
      this.overflowTimer += elapsed;
    } else {
      this.isOverflowing = false;
      this.overflowTimer = 0;
    }
  }

  /**
   * Checks if the port has overflowed
   * Port overflows when at capacity for too long
   * @returns True if the port has overflowed
   */
  public hasOverflowed(): boolean {
    return this.overflowTimer >= this.overflowThreshold;
  }

  /**
   * Gets the progress towards overflow
   * @returns Value between 0 and 1 indicating overflow progress
   */
  public getOverflowProgress(): number {
    return Math.min(1, this.overflowTimer / this.overflowThreshold);
  }

  /**
   * Draws the port on the canvas
   * Renders the port circle, passengers, and overflow indicators
   * @param canvas The canvas to draw on
   */
  public draw(canvas: HTMLCanvasElement): void {
    const fillPercentage = Math.min(1, this.passengers.length / this.maxCapacity);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate pulse effect
    const pulseScale = this.isOverflowing ? 1 + Math.sin(this.pulseAnimation * 5) * 0.1 : 1;
    const currentRadius = this.radius * pulseScale;

    // Draw port background (fill based on capacity)
    if (fillPercentage > 0) {
      const fillAngle = fillPercentage * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y);
      ctx.arc(
        this.position.x,
        this.position.y,
        currentRadius,
        -Math.PI / 2,
        -Math.PI / 2 + fillAngle
      );
      ctx.closePath();
      ctx.fillStyle = this.isOverflowing ? '#e74c3c' : this.color;
      ctx.fill();
    }

    // Draw port circle (empty part)
    const fillAngle = fillPercentage * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.arc(
      this.position.x,
      this.position.y,
      currentRadius,
      -Math.PI / 2 + fillAngle,
      -Math.PI / 2 + Math.PI * 2
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Draw port outline
    CanvasUtil.drawCircle(
      canvas,
      this.position.x,
      this.position.y,
      currentRadius,
      255, 255, 255,
      1
    );

    // Draw inner shape based on type
    this.drawTypeIndicator(canvas);

    // Draw passenger count
    if (this.passengers.length > 0) {
      CanvasUtil.writeText(
        canvas,
        this.passengers.length.toString(),
        this.position.x,
        this.position.y + 5,
        'center',
        'sans-serif',
        16,
        '#ffffff',
        700
      );
    }

    // Draw colored passenger indicators below port
    if (this.passengers.length > 0) {
      const indicatorSize = 6;
      const spacing = 8;
      const maxPerRow = 5;
      const startX = this.position.x - ((Math.min(this.passengers.length, maxPerRow) - 1) * spacing) / 2;
      const startY = this.position.y + this.radius + 35;

      for (let i = 0; i < Math.min(this.passengers.length, 10); i++) {
        const row = Math.floor(i / maxPerRow);
        const col = i % maxPerRow;
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        ctx.beginPath();
        ctx.arc(x, y, indicatorSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.passengers[i].color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Show "+X" if more passengers than we can display
      if (this.passengers.length > 10) {
        CanvasUtil.writeText(
          canvas,
          `+${this.passengers.length - 10}`,
          this.position.x,
          startY + spacing + 10,
          'center',
          'sans-serif',
          9,
          'rgba(255, 255, 255, 0.7)',
          400
        );
      }
    }

    // Draw port name
    CanvasUtil.writeText(
      canvas,
      this.name,
      this.position.x,
      this.position.y + this.radius + 20,
      'center',
      'sans-serif',
      12,
      '#ffffff',
      600
    );

    // Draw overflow warning
    if (this.isOverflowing) {
      const warningRadius = currentRadius + 10;
      CanvasUtil.drawCircle(
        canvas,
        this.position.x,
        this.position.y,
        warningRadius,
        231, 76, 60,
        0.5 + Math.sin(this.pulseAnimation * 5) * 0.5
      );
    }
  }

  /**
   * Draws an icon indicating the port type
   * Renders different shapes for residential, industrial, and commercial types
   * @param canvas The canvas to draw on
   */
  private drawTypeIndicator(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    switch (this.type) {
      case PortType.RESIDENTIAL:
        // Draw house shape
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(-8, 6);
        ctx.lineTo(8, 6);
        ctx.lineTo(8, -2);
        ctx.lineTo(0, -8);
        ctx.closePath();
        ctx.stroke();
        break;
      case PortType.INDUSTRIAL:
        // Draw factory shape
        ctx.strokeRect(-8, -4, 16, 10);
        ctx.fillRect(-4, -8, 3, 4);
        ctx.fillRect(2, -10, 3, 6);
        break;
      case PortType.COMMERCIAL:
        // Draw building shape
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.strokeRect(-4, -4, 3, 3);
        ctx.strokeRect(2, -4, 3, 3);
        ctx.strokeRect(-4, 2, 3, 3);
        ctx.strokeRect(2, 2, 3, 3);
        break;
    }

    ctx.restore();
  }
}
