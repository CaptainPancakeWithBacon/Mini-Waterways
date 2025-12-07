import { Point } from './Boat.js';
import CanvasUtil from './utilities/CanvasUtil.js';

/**
 * Represents a single tile in the route network
 */
export interface RouteTile {
  /** X coordinate of the tile */
  x: number;
  /** Y coordinate of the tile */
  y: number;
  /** Color of the tile */
  color: string;
  /** Set of connected tile keys in format "x,y" */
  connections: Set<string>;
  /** True if this tile provides access to a port */
  isPortTile: boolean;
}

/**
 * Manages a network of route tiles that boats can travel along
 * Handles pathfinding between tiles and visualization
 */
export default class RouteNetwork {
  private tiles: Map<string, RouteTile> = new Map();
  private gridSize: number = 50;

  /**
   * Creates a new RouteNetwork instance
   * @param gridSize The size of each grid cell (default: 50)
   */
  constructor(gridSize: number = 50) {
    this.gridSize = gridSize;
  }

  /**
   * Generates a unique key for a tile position
   * @param x X coordinate
   * @param y Y coordinate
   * @returns String key in format "x,y"
   */
  private getKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Parses a tile key back into coordinates
   * @param key The key string to parse
   * @returns Object containing x and y coordinates
   */
  private parseKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  /**
   * Adds a new tile to the network
   * Automatically connects to adjacent tiles
   * @param x X coordinate of the tile
   * @param y Y coordinate of the tile
   * @param color Color of the tile (default: blue)
   * @param isPortTile Whether this tile is associated with a port
   */
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

  /**
   * Removes a tile from the network
   * Port tiles cannot be removed
   * @param x X coordinate of the tile
   * @param y Y coordinate of the tile
   * @returns True if the tile was removed, false otherwise
   */
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

  /**
   * Checks if a tile exists at the given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns True if a tile exists at this position
   */
  public hasTile(x: number, y: number): boolean {
    return this.tiles.has(this.getKey(x, y));
  }

  /**
   * Gets the tile at the specified coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns The tile if found, undefined otherwise
   */
  public getTile(x: number, y: number): RouteTile | undefined {
    return this.tiles.get(this.getKey(x, y));
  }

  /**
   * Updates connections for a tile
   * Connects the tile to all adjacent tiles in 4 directions
   * @param x X coordinate of the tile
   * @param y Y coordinate of the tile
   */
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

  /**
   * Finds a path between two points using breadth-first search
   * @param startX Starting X coordinate
   * @param startY Starting Y coordinate
   * @param endX Ending X coordinate
   * @param endY Ending Y coordinate
   * @returns Array of points representing the path, or null if no path exists
   */
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

  /**
   * Gets all tiles in the network
   * @returns Array of all route tiles
   */
  public getTiles(): RouteTile[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Gets the total number of tiles in the network
   * @returns Total tile count
   */
  public getTileCount(): number {
    return this.tiles.size;
  }

  /**
   * Gets the count of player-placed tiles (excluding port tiles)
   * @returns Number of player-placed tiles
   */
  public getPlayerTileCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      if (!tile.isPortTile) {
        count++;
      }
    }
    return count;
  }

  /**
   * Draws the route network on the canvas
   * Renders tiles and their connections
   * @param canvas The canvas to draw on
   */
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

  /**
   * Clears all tiles from the network
   */
  public clear(): void {
    this.tiles.clear();
  }

  /**
   * Checks if two points are connected through the network
   * @param startX Starting X coordinate
   * @param startY Starting Y coordinate
   * @param endX Ending X coordinate
   * @param endY Ending Y coordinate
   * @returns True if a path exists between the two points
   */
  public areConnected(startX: number, startY: number, endX: number, endY: number): boolean {
    return this.findPath(startX, startY, endX, endY) !== null;
  }

  /**
   * Gets all tiles within a certain distance of a point
   * @param x X coordinate of the center point
   * @param y Y coordinate of the center point
   * @param radius Maximum distance from the center point
   * @returns Array of tiles within the specified radius
   */
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
