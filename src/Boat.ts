import Port, { Passenger } from './Port.js';
import RouteNetwork from './RouteNetwork.js';

export interface Point {
  x: number;
  y: number;
}

export class Boat {
  position: Point;
  speed = 3;
  path: Point[] = [];
  pathIndex = 0;
  private angle: number = 0;

  // Passenger system
  private passengers: Passenger[] = [];
  private maxCapacity: number = 10;
  private color: string = '#3498db';

  // Network-based travel
  private startPort: Port;
  private endPort: Port;
  private routeNetwork: RouteNetwork;
  private needsNewPath: boolean = false;

  // Transit line support
  private transitLine: any = null; // Will be TransitLine but avoiding circular dependency

  constructor(
    startPort: Port,
    endPort: Port,
    routeNetwork: RouteNetwork,
    color: string = '#3498db'
  ) {
    this.startPort = startPort;
    this.endPort = endPort;
    this.routeNetwork = routeNetwork;
    this.position = { ...startPort.getPosition() };
    this.color = color;

    // Find initial path through network
    this.updatePath();
  }

  private updatePath(): void {
    const startPos = this.startPort.getPosition();
    const endPos = this.endPort.getPosition();

    const path = this.routeNetwork.findPath(
      startPos.x,
      startPos.y,
      endPos.x,
      endPos.y
    );

    if (path) {
      this.path = path;
      this.pathIndex = 0;
      this.needsNewPath = false;
    } else {
      // No path available - will retry later
      this.needsNewPath = true;
    }
  }

  public loadPassengers(passengers: Passenger[]): number {
    const availableSpace = this.maxCapacity - this.passengers.length;
    const toLoad = Math.min(passengers.length, availableSpace);
    this.passengers.push(...passengers.slice(0, toLoad));
    return toLoad;
  }

  public unloadPassengers(): Passenger[] {
    const unloaded = [...this.passengers];
    this.passengers = [];
    return unloaded;
  }

  public getPassengers(): number {
    return this.passengers.length;
  }

  public getPassengersList(): Passenger[] {
    return this.passengers;
  }

  public isAtDestination(): boolean {
    return this.pathIndex >= this.path.length;
  }

  public getCurrentDestinationPort(): Port {
    return this.endPort;
  }

  public setTransitLine(line: any): void {
    this.transitLine = line;
  }

  public swapDestination(): void {
    // If on a transit line, get next port from the line
    if (this.transitLine && this.transitLine.getNextPort) {
      const nextPort = this.transitLine.getNextPort(this.endPort);
      if (nextPort) {
        this.startPort = this.endPort;
        this.endPort = nextPort;
        this.updatePath();
        return;
      }
    }

    // Otherwise, swap start and end (old behavior)
    const temp = this.startPort;
    this.startPort = this.endPort;
    this.endPort = temp;

    // Find new path
    this.updatePath();
  }

  public needsPathUpdate(): boolean {
    return this.needsNewPath;
  }

  public forcePathUpdate(): void {
    this.updatePath();
  }

  update() {
    // If we need a new path, try to get one
    if (this.needsNewPath) {
      this.updatePath();
      if (this.needsNewPath) {
        // Still no path, don't move
        return;
      }
    }

    if (this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.position.x;
      const dy = target.y - this.position.y;
      const dist = Math.hypot(dx, dy);

      // Calculate angle for boat rotation
      this.angle = Math.atan2(dy, dx);

      if (dist < this.speed) {
        this.position = { ...target };
        this.pathIndex++;
      } else {
        this.position.x += (dx / dist) * this.speed;
        this.position.y += (dy / dist) * this.speed;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // Draw boat body (triangle shape)
    ctx.beginPath();
    ctx.moveTo(12, 0);  // Front point
    ctx.lineTo(-7, -6); // Back left
    ctx.lineTo(-7, 6);  // Back right
    ctx.closePath();

    // Boat fill with color
    ctx.fillStyle = this.color;
    ctx.fill();

    // Boat outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw passenger indicators if carrying passengers
    if (this.passengers.length > 0) {
      // Draw white circle background
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Draw colored dots for first few passengers
      const maxDisplay = Math.min(3, this.passengers.length);
      for (let i = 0; i < maxDisplay; i++) {
        const angle = (i / maxDisplay) * Math.PI * 2 - Math.PI / 2;
        const radius = 2.5;
        const dotX = Math.cos(angle) * radius;
        const dotY = Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.passengers[i].color;
        ctx.fill();
      }

      // Show count if more than 3 passengers
      if (this.passengers.length > 3) {
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.passengers.length.toString(), 0, 0);
      }
    }

    // Draw small wake effect
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-11, -4);
    ctx.moveTo(-7, 0);
    ctx.lineTo(-11, 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
