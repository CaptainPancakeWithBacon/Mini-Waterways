import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

export enum PortType {
  RESIDENTIAL = 'residential',
  INDUSTRIAL = 'industrial',
  COMMERCIAL = 'commercial',
}

export interface Passenger {
  destinationType: PortType;
  color: string;
}

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

  constructor(x: number, y: number, name: string, type: PortType = PortType.RESIDENTIAL) {
    this.position = { x, y };
    this.name = name;
    this.type = type;
    this.color = this.getColorForType(type);
  }

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

  public getPosition(): Point {
    return { ...this.position };
  }

  public getName(): string {
    return this.name;
  }

  public getType(): PortType {
    return this.type;
  }

  public contains(point: Point): boolean {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  private generatePassenger(): Passenger {
    // Generate passenger with random destination (different from current port)
    const availableTypes = this.allPortTypes.filter(t => t !== this.type);
    const destinationType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return {
      destinationType,
      color: this.getColorForType(destinationType)
    };
  }

  public addPassengers(count: number): void {
    for (let i = 0; i < count; i++) {
      this.passengers.push(this.generatePassenger());
    }
  }

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

  public getPassengers(): number {
    return this.passengers.length;
  }

  public getPassengersByDestination(destinationType: PortType): number {
    return this.passengers.filter(p => p.destinationType === destinationType).length;
  }

  public isAtCapacity(): boolean {
    return this.passengers.length >= this.maxCapacity;
  }

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

  public hasOverflowed(): boolean {
    return this.overflowTimer >= this.overflowThreshold;
  }

  public getOverflowProgress(): number {
    return Math.min(1, this.overflowTimer / this.overflowThreshold);
  }

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
