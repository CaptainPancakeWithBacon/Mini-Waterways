import Port from './Port.js';
import { Boat } from './Boat.js';
import RouteNetwork from './RouteNetwork.js';
import CanvasUtil from './utilities/CanvasUtil.js';

export default class TransitLine {
  private id: string;
  private name: string;
  private ports: Port[] = [];
  private color: string;
  private boats: Boat[] = [];
  private routeNetwork: RouteNetwork;
  private maxBoats: number = 2;

  // Available line colors (Cities: Skylines inspired)
  private static readonly LINE_COLORS = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#e67e22', // Dark Orange
    '#34495e', // Dark Gray
    '#f1c40f', // Yellow
    '#95a5a6', // Gray
    '#e84393', // Pink
    '#00b894', // Mint
  ];

  private static colorIndex = 0;

  constructor(routeNetwork: RouteNetwork, name?: string) {
    this.id = `line-${Date.now()}-${Math.random()}`;
    this.routeNetwork = routeNetwork;
    this.name = name || `Line ${TransitLine.colorIndex + 1}`;
    this.color = TransitLine.LINE_COLORS[TransitLine.colorIndex % TransitLine.LINE_COLORS.length];
    TransitLine.colorIndex++;
  }

  public addPort(port: Port): void {
    // Don't add the same port twice in a row
    if (this.ports.length > 0 && this.ports[this.ports.length - 1] === port) {
      return;
    }
    this.ports.push(port);
  }

  public removeLastPort(): Port | undefined {
    return this.ports.pop();
  }

  public getPorts(): Port[] {
    return [...this.ports];
  }

  public getPortCount(): number {
    return this.ports.length;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getColor(): string {
    return this.color;
  }

  public isValid(): boolean {
    // A line needs at least 2 ports to be valid
    if (this.ports.length < 2) return false;

    // Check if all consecutive ports are connected through the network
    for (let i = 0; i < this.ports.length - 1; i++) {
      const port1 = this.ports[i].getPosition();
      const port2 = this.ports[i + 1].getPosition();

      if (!this.routeNetwork.areConnected(port1.x, port1.y, port2.x, port2.y)) {
        return false;
      }
    }

    // Check if last port connects back to first (loop)
    if (this.ports.length > 2) {
      const firstPort = this.ports[0].getPosition();
      const lastPort = this.ports[this.ports.length - 1].getPosition();
      return this.routeNetwork.areConnected(lastPort.x, lastPort.y, firstPort.x, firstPort.y);
    }

    return true;
  }

  public spawnBoat(): void {
    if (this.boats.length >= this.maxBoats) return;
    if (this.ports.length < 2) return;

    // Start boat at first port, heading to second port
    const boat = new Boat(
      this.ports[0],
      this.ports[1],
      this.routeNetwork,
      this.color
    );

    // Link boat to this transit line
    boat.setTransitLine(this);

    this.boats.push(boat);
  }

  public getBoats(): Boat[] {
    return this.boats;
  }

  public getBoatCount(): number {
    return this.boats.length;
  }

  public setMaxBoats(max: number): void {
    this.maxBoats = max;
  }

  public getMaxBoats(): number {
    return this.maxBoats;
  }

  // Get the next port in the line after the current port
  public getNextPort(currentPort: Port): Port | null {
    const index = this.ports.indexOf(currentPort);
    if (index === -1) return null;

    // Loop back to start
    return this.ports[(index + 1) % this.ports.length];
  }

  // Update all boats on this line
  public update(elapsed: number): void {
    for (const boat of this.boats) {
      boat.update();
    }
  }

  // Draw the line route on the map
  public draw(canvas: HTMLCanvasElement): void {
    if (this.ports.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw connections between consecutive ports
    for (let i = 0; i < this.ports.length; i++) {
      const port1 = this.ports[i];
      const port2 = this.ports[(i + 1) % this.ports.length];

      const pos1 = port1.getPosition();
      const pos2 = port2.getPosition();

      // Find path through network
      const path = this.routeNetwork.findPath(pos1.x, pos1.y, pos2.x, pos2.y);

      if (path && path.length > 1) {
        // Draw the path
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);

        for (let j = 1; j < path.length; j++) {
          ctx.lineTo(path[j].x, path[j].y);
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Draw port indicators on the line
    for (let i = 0; i < this.ports.length; i++) {
      const pos = this.ports[i].getPosition();

      // Draw line number badge on port
      const badgeRadius = 12;
      const badgeX = pos.x + 35;
      const badgeY = pos.y - 35;

      // Badge background
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Badge border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stop number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((i + 1).toString(), badgeX, badgeY);
    }
  }

  // Draw boats for this line
  public drawBoats(ctx: CanvasRenderingContext2D): void {
    for (const boat of this.boats) {
      boat.draw(ctx);
    }
  }

  public removeBoat(boat: Boat): void {
    const index = this.boats.indexOf(boat);
    if (index > -1) {
      this.boats.splice(index, 1);
    }
  }

  public clearBoats(): void {
    this.boats = [];
  }
}
