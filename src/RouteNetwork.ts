import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

export interface RouteTile {
  x: number;
  y: number;
  color: string;
  connections: Set<string>; // Stores "x,y" of connected tiles
  isPortTile: boolean; // True if this is a port access tile
}

export default class RouteNetwork {
  private tiles: Map<string, RouteTile> = new Map();
  private gridSize: number = 50;

  constructor(gridSize: number = 50) {
    this.gridSize = gridSize;
  }

  private getKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private parseKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  public addTile(x: number, y: number, color: string = '#3498db', isPortTile: boolean = false): void {
    const key = this.getKey(x, y);

    if (!this.tiles.has(key)) {
      this.tiles.set(key, {
        x,
        y,
        color,
        connections: new Set(),
        isPortTile,
      });

      // Auto-connect to adjacent tiles
      this.updateConnections(x, y);
    }
  }

  public removeTile(x: number, y: number): boolean {
    const key = this.getKey(x, y);
    const tile = this.tiles.get(key);

    // Don't remove port tiles
    if (tile && tile.isPortTile) {
      return false;
    }

    if (tile) {
      // Remove connections from neighbors
      for (const connKey of tile.connections) {
        const neighbor = this.tiles.get(connKey);
        if (neighbor) {
          neighbor.connections.delete(key);
        }
      }

      this.tiles.delete(key);
      return true;
    }

    return false;
  }

  public hasTile(x: number, y: number): boolean {
    return this.tiles.has(this.getKey(x, y));
  }

  public getTile(x: number, y: number): RouteTile | undefined {
    return this.tiles.get(this.getKey(x, y));
  }

  private updateConnections(x: number, y: number): void {
    const key = this.getKey(x, y);
    const tile = this.tiles.get(key);
    if (!tile) return;

    // Check all 4 adjacent directions
    const directions = [
      { dx: 1, dy: 0 },  // Right
      { dx: -1, dy: 0 }, // Left
      { dx: 0, dy: 1 },  // Down
      { dx: 0, dy: -1 }, // Up
    ];

    for (const dir of directions) {
      const nx = x + dir.dx * this.gridSize;
      const ny = y + dir.dy * this.gridSize;
      const neighborKey = this.getKey(nx, ny);
      const neighbor = this.tiles.get(neighborKey);

      if (neighbor) {
        // Connect both ways
        tile.connections.add(neighborKey);
        neighbor.connections.add(key);
      }
    }
  }

  public findPath(startX: number, startY: number, endX: number, endY: number): Point[] | null {
    const startKey = this.getKey(startX, startY);
    const endKey = this.getKey(endX, endY);

    if (!this.tiles.has(startKey) || !this.tiles.has(endKey)) {
      return null;
    }

    // BFS pathfinding
    const queue: string[] = [startKey];
    const visited = new Set<string>([startKey]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === endKey) {
        // Reconstruct path
        const path: Point[] = [];
        let node = endKey;

        while (node !== startKey) {
          const pos = this.parseKey(node);
          path.unshift({ x: pos.x, y: pos.y });
          node = parent.get(node)!;
        }

        const startPos = this.parseKey(startKey);
        path.unshift({ x: startPos.x, y: startPos.y });

        return path;
      }

      const tile = this.tiles.get(current);
      if (!tile) continue;

      for (const neighbor of tile.connections) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return null; // No path found
  }

  public getTiles(): RouteTile[] {
    return Array.from(this.tiles.values());
  }

  public getTileCount(): number {
    return this.tiles.size;
  }

  public getPlayerTileCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      if (!tile.isPortTile) {
        count++;
      }
    }
    return count;
  }

  public draw(canvas: HTMLCanvasElement): void {
    for (const tile of this.tiles.values()) {
      // Draw tile as a square
      CanvasUtil.fillRectangle(
        canvas,
        tile.x - this.gridSize / 2,
        tile.y - this.gridSize / 2,
        this.gridSize,
        this.gridSize,
        52, 152, 219, // Blue
        0.6,
        0
      );

      // Draw border
      CanvasUtil.drawRectangle(
        canvas,
        tile.x - this.gridSize / 2,
        tile.y - this.gridSize / 2,
        this.gridSize,
        this.gridSize,
        255, 255, 255,
        0.8,
        2,
        0
      );

      // Draw connections as lines to adjacent tiles
      for (const connKey of tile.connections) {
        const conn = this.parseKey(connKey);

        // Only draw line if we haven't drawn it from the other side
        if (tile.x < conn.x || (tile.x === conn.x && tile.y < conn.y)) {
          CanvasUtil.drawLine(
            canvas,
            tile.x,
            tile.y,
            conn.x,
            conn.y,
            255, 255, 255,
            0.5,
            4
          );
        }
      }
    }
  }

  public clear(): void {
    this.tiles.clear();
  }

  // Check if two ports are connected through the network
  public areConnected(startX: number, startY: number, endX: number, endY: number): boolean {
    return this.findPath(startX, startY, endX, endY) !== null;
  }

  // Get all tiles within a certain distance of a point
  public getTilesNear(x: number, y: number, radius: number): RouteTile[] {
    const nearbyTiles: RouteTile[] = [];

    for (const tile of this.tiles.values()) {
      const dx = tile.x - x;
      const dy = tile.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        nearbyTiles.push(tile);
      }
    }

    return nearbyTiles;
  }
}
