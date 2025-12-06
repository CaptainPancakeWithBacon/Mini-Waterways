import CanvasUtil from '../utilities/CanvasUtil.js';
import KeyListener from '../utilities/KeyListener.js';
import MouseListener from '../utilities/MouseListener.js';
import Scene from './Scene.js';
import Port, { PortType } from '../Port.js';
import { Boat } from '../Boat.js';
import { Point } from '../Boat.js';
import Grid from '../Grid.js';
import RouteNetwork from '../RouteNetwork.js';
import TransitLine from '../TransitLine.js';

export default class Start extends Scene {
  private grid: Grid;
  private routeNetwork: RouteNetwork;
  private ports: Port[] = [];
  private transitLines: TransitLine[] = [];

  // Tile placement mode
  private isPlacingTiles: boolean = false;
  private isRemovingTiles: boolean = false;
  private lastPlacedTile: Point | null = null;

  // Line creation mode
  private isCreatingLine: boolean = false;
  private currentLine: TransitLine | null = null;

  // Game state
  private score: number = 0;
  private gameTime: number = 0;
  private isGameOver: boolean = false;
  private gameOverMessage: string = '';

  // Resources
  private maxTiles: number = 30;
  private maxBoatsPerLine: number = 2;
  private boatSpawnTimer: number = 0;
  private boatSpawnInterval: number = 5000;

  // Progression
  private dayDuration: number = 30000;
  private currentDay: number = 1;
  private nextPortTimer: number = 0;
  private nextPortInterval: number = 30000;
  private lastRewardDay: number = 0;

  public constructor() {
    super();
    this.grid = new Grid(window.innerWidth, window.innerHeight, 50);
    this.routeNetwork = new RouteNetwork(50);
    this.initializePorts();
  }

  private initializePorts(): void {
    // Start with 3 ports on the grid
    const portTypes = [PortType.RESIDENTIAL, PortType.INDUSTRIAL, PortType.COMMERCIAL];
    const portNames = ['Green Haven', 'Industry Bay', 'Central Hub'];

    for (let i = 0; i < 3; i++) {
      const pos = this.grid.getRandomGridPosition(150);
      const port = new Port(pos.x, pos.y, portNames[i], portTypes[i]);
      this.ports.push(port);

      // Add initial tiles around the port to make it accessible
      this.addTilesAroundPort(port);
    }
  }

  private addTilesAroundPort(port: Port): void {
    const pos = port.getPosition();
    const gridSize = 50;

    // Add tiles in a cross pattern around the port
    const offsets = [
      { dx: 0, dy: 0 },   // Center
      { dx: 1, dy: 0 },   // Right
      { dx: -1, dy: 0 },  // Left
      { dx: 0, dy: 1 },   // Down
      { dx: 0, dy: -1 },  // Up
    ];

    for (const offset of offsets) {
      const tileX = pos.x + offset.dx * gridSize;
      const tileY = pos.y + offset.dy * gridSize;
      this.routeNetwork.addTile(tileX, tileY, '#3498db', true); // Mark as port tile
    }
  }

  private spawnNewPort(): void {
    const portTypes = [PortType.RESIDENTIAL, PortType.INDUSTRIAL, PortType.COMMERCIAL];
    const portNames = [
      'North Harbor', 'South Port', 'East Dock', 'West Bay',
      'Marina Vista', 'Harbor Point', 'Seaside Terminal', 'Ocean Gate',
      'Bay View', 'Port Royal', 'Anchor Bay', 'Lighthouse Port'
    ];

    const pos = this.grid.getRandomGridPosition(100);
    const type = portTypes[Math.floor(Math.random() * portTypes.length)];
    const name = portNames[this.ports.length % portNames.length];

    const port = new Port(pos.x, pos.y, name, type);
    this.ports.push(port);

    // Add initial tiles around new port
    this.addTilesAroundPort(port);

    // Only update paths for boats that need it (lost their path)
    for (const line of this.transitLines) {
      for (const boat of line.getBoats()) {
        if (boat.needsPathUpdate()) {
          boat.forcePathUpdate();
        }
      }
    }
  }

  private getPortAtPosition(point: Point): Port | null {
    for (const port of this.ports) {
      if (port.contains(point)) {
        return port;
      }
    }
    return null;
  }


  private checkProgression(): void {
    const currentDay = this.currentDay;

    // Give rewards every 3 days
    if (currentDay > this.lastRewardDay && currentDay % 3 === 0) {
      this.lastRewardDay = currentDay;

      // Reward: +10 tiles
      this.maxTiles += 10;

      // Reward: +1 boat per line every 6 days
      if (currentDay % 6 === 0) {
        this.maxBoatsPerLine++;
        // Update existing lines
        for (const line of this.transitLines) {
          line.setMaxBoats(this.maxBoatsPerLine);
        }
      }

      // Show reward notification (could be enhanced later)
      console.log(`Day ${currentDay} Reward! +10 tiles, Max tiles: ${this.maxTiles}`);
    }
  }

  public processInput(keyListener: KeyListener): void {
    if (this.isGameOver) return;

    const mousePos = MouseListener.mouseCoordinates;
    const snappedPos = this.grid.snapToGrid(mousePos);

    // Toggle line creation mode with 'L' key
    if (KeyListener.keyPressed(KeyListener.KEY_L)) {
      this.isCreatingLine = !this.isCreatingLine;

      if (this.isCreatingLine) {
        // Start new line
        this.currentLine = new TransitLine(this.routeNetwork);
        this.isPlacingTiles = false;
        this.isRemovingTiles = false;
      } else {
        // Cancel line creation
        this.currentLine = null;
      }
    }

    // Complete line with Enter key
    if (this.isCreatingLine && KeyListener.keyPressed(KeyListener.KEY_ENTER)) {
      if (this.currentLine && this.currentLine.isValid()) {
        this.transitLines.push(this.currentLine);
        this.currentLine.setMaxBoats(this.maxBoatsPerLine);
        this.currentLine = null;
        this.isCreatingLine = false;
      }
    }

    // Cancel line with Escape key
    if (this.isCreatingLine && KeyListener.keyPressed(KeyListener.KEY_ESC)) {
      this.currentLine = null;
      this.isCreatingLine = false;
    }

    // Remove last port from line with Backspace
    if (this.isCreatingLine && this.currentLine && KeyListener.keyPressed('Backspace')) {
      this.currentLine.removeLastPort();
    }

    // Line creation mode - click ports to add to line
    if (this.isCreatingLine && MouseListener.buttonPressed(MouseListener.BUTTON_LEFT)) {
      const clickedPort = this.getPortAtPosition(mousePos);
      if (clickedPort && this.currentLine) {
        this.currentLine.addPort(clickedPort);
      }
    }

    // Normal mode - place/remove tiles
    if (!this.isCreatingLine) {
      // Left click - place tiles
      if (MouseListener.buttonPressed(MouseListener.BUTTON_LEFT)) {
        if (!this.getPortAtPosition(mousePos)) {
          this.isPlacingTiles = true;
          this.isRemovingTiles = false;
          this.lastPlacedTile = null;
        }
      }

      // Right click - remove tiles
      if (MouseListener.buttonPressed(MouseListener.BUTTON_RIGHT)) {
        if (!this.getPortAtPosition(mousePos)) {
          this.isRemovingTiles = true;
          this.isPlacingTiles = false;
          this.lastPlacedTile = null;
        }
      }
    }

    // Place tiles while dragging
    if (MouseListener.isButtonDown(MouseListener.BUTTON_LEFT) && this.isPlacingTiles) {
      if (this.routeNetwork.getPlayerTileCount() < this.maxTiles) {
        if (!this.lastPlacedTile ||
            this.lastPlacedTile.x !== snappedPos.x ||
            this.lastPlacedTile.y !== snappedPos.y) {

          if (!this.getPortAtPosition(snappedPos)) {
            this.routeNetwork.addTile(snappedPos.x, snappedPos.y);
            this.lastPlacedTile = snappedPos;

            // Update paths for all boats on all lines
            for (const line of this.transitLines) {
              for (const boat of line.getBoats()) {
                if (boat.needsPathUpdate()) {
                  boat.forcePathUpdate();
                }
              }
            }
          }
        }
      }
    }

    // Remove tiles while dragging
    if (MouseListener.isButtonDown(MouseListener.BUTTON_RIGHT) && this.isRemovingTiles) {
      if (!this.lastPlacedTile ||
          this.lastPlacedTile.x !== snappedPos.x ||
          this.lastPlacedTile.y !== snappedPos.y) {

        if (!this.getPortAtPosition(snappedPos)) {
          const removed = this.routeNetwork.removeTile(snappedPos.x, snappedPos.y);
          if (removed) {
            this.lastPlacedTile = snappedPos;

            // Mark all boats to check if they need path updates
            for (const line of this.transitLines) {
              for (const boat of line.getBoats()) {
                boat.forcePathUpdate();
              }
            }
          }
        }
      }
    }

    // Stop placing/removing tiles
    if (MouseListener.mouseUp) {
      this.isPlacingTiles = false;
      this.isRemovingTiles = false;
      this.lastPlacedTile = null;
    }
  }

  public update(elapsed: number): Scene {
    if (this.isGameOver) return this;

    this.gameTime += elapsed;
    this.currentDay = Math.floor(this.gameTime / this.dayDuration) + 1;

    // Check for progression rewards
    this.checkProgression();

    // Update all ports
    for (const port of this.ports) {
      port.update(elapsed);

      if (port.hasOverflowed()) {
        this.isGameOver = true;
        this.gameOverMessage = `${port.getName()} overflowed!`;
      }
    }

    // Spawn new ports
    this.nextPortTimer += elapsed;
    if (this.nextPortTimer >= this.nextPortInterval) {
      this.spawnNewPort();
      this.nextPortTimer = 0;
      this.nextPortInterval = Math.max(20000, this.nextPortInterval - 500);
    }

    // Update all transit lines and their boats
    for (const line of this.transitLines) {
      for (const boat of line.getBoats()) {
        boat.update();

        // Check if boat reached destination
        if (boat.isAtDestination()) {
          const destinationPort = boat.getCurrentDestinationPort();
          const destinationType = destinationPort.getType();

          // Unload passengers that match this port's type
          if (boat.getPassengers() > 0) {
            const allPassengers = boat.unloadPassengers();
            const matchingPassengers = allPassengers.filter(p => p.destinationType === destinationType);
            const nonMatchingPassengers = allPassengers.filter(p => p.destinationType !== destinationType);

            // Score for successfully delivered passengers
            this.score += matchingPassengers.length;

            // Put non-matching passengers back on the boat (wrong destination)
            if (nonMatchingPassengers.length > 0) {
              boat.loadPassengers(nonMatchingPassengers);
            }
          }

          // Load new passengers heading to other ports
          if (destinationPort.getPassengers() > 0) {
            const loadedPassengers = destinationPort.removePassengers(999);
            boat.loadPassengers(loadedPassengers);
          }

          // Move to next stop on the line
          boat.swapDestination();
        }
      }
    }

    // Spawn boats on transit lines that need them
    this.boatSpawnTimer += elapsed;
    if (this.boatSpawnTimer >= this.boatSpawnInterval) {
      this.trySpawnBoatsOnLines();
      this.boatSpawnTimer = 0;
    }

    return this;
  }

  private trySpawnBoatsOnLines(): void {
    // Spawn boats on lines that:
    // 1. Are valid (have connected route)
    // 2. Have capacity for more boats
    // 3. Have at least one port with waiting passengers
    for (const line of this.transitLines) {
      if (!line.isValid()) continue;
      if (line.getBoatCount() >= line.getMaxBoats()) continue;

      // Check if any port on the line has passengers
      let hasPassengers = false;
      for (const port of line.getPorts()) {
        if (port.getPassengers() > 0) {
          hasPassengers = true;
          break;
        }
      }

      if (hasPassengers) {
        line.spawnBoat();
        // Load passengers at first port if available
        const boats = line.getBoats();
        const newBoat = boats[boats.length - 1];
        const firstPort = line.getPorts()[0];
        if (firstPort && firstPort.getPassengers() > 0 && newBoat) {
          const loadedPassengers = firstPort.removePassengers(999);
          newBoat.loadPassengers(loadedPassengers);
        }
        // Only spawn one boat per interval
        return;
      }
    }
  }

  public render(canvas: HTMLCanvasElement): void {
    // Draw grid
    this.grid.draw(canvas);

    // Draw route network
    this.routeNetwork.draw(canvas);

    // Draw all transit lines (routes)
    for (const line of this.transitLines) {
      line.draw(canvas);
    }

    // Draw line being created
    if (this.isCreatingLine && this.currentLine) {
      this.currentLine.draw(canvas);
    }

    // Draw tile preview while placing
    if (this.isPlacingTiles) {
      const mousePos = MouseListener.mouseCoordinates;
      const snappedPos = this.grid.snapToGrid(mousePos);

      if (!this.getPortAtPosition(snappedPos) &&
          this.routeNetwork.getPlayerTileCount() < this.maxTiles) {
        const gridSize = 50;
        CanvasUtil.fillRectangle(
          canvas,
          snappedPos.x - gridSize / 2,
          snappedPos.y - gridSize / 2,
          gridSize,
          gridSize,
          255, 255, 255,
          0.3,
          0
        );
      }
    }

    // Draw removal preview
    if (this.isRemovingTiles) {
      const mousePos = MouseListener.mouseCoordinates;
      const snappedPos = this.grid.snapToGrid(mousePos);

      if (!this.getPortAtPosition(snappedPos) &&
          this.routeNetwork.hasTile(snappedPos.x, snappedPos.y)) {
        const gridSize = 50;
        CanvasUtil.fillRectangle(
          canvas,
          snappedPos.x - gridSize / 2,
          snappedPos.y - gridSize / 2,
          gridSize,
          gridSize,
          231, 76, 60,
          0.5,
          0
        );
      }
    }

    // Draw all boats from all lines
    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (const line of this.transitLines) {
        line.drawBoats(ctx);
      }
    }

    // Draw all ports (on top)
    for (const port of this.ports) {
      port.draw(canvas);
    }

    // Draw UI
    this.drawUI(canvas);

    // Draw game over screen
    if (this.isGameOver) {
      this.drawGameOver(canvas);
    }
  }

  private drawUI(canvas: HTMLCanvasElement): void {
    const padding = 20;
    const lineHeight = 25;
    let yPos = padding;

    // Draw semi-transparent background
    CanvasUtil.fillRectangle(
      canvas,
      padding - 10,
      padding - 10,
      250,
      lineHeight * 5 + 10,
      0, 0, 0,
      0.5,
      5
    );

    // Score
    CanvasUtil.writeText(
      canvas,
      `Score: ${this.score}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      18,
      '#ffffff',
      700
    );
    yPos += lineHeight;

    // Day
    CanvasUtil.writeText(
      canvas,
      `Day: ${this.currentDay}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400
    );
    yPos += lineHeight;

    // Route Tiles (only player tiles)
    const tileColor = this.routeNetwork.getPlayerTileCount() >= this.maxTiles ? '#e74c3c' : '#ffffff';
    CanvasUtil.writeText(
      canvas,
      `Route Tiles: ${this.routeNetwork.getPlayerTileCount()}/${this.maxTiles}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      tileColor,
      400
    );
    yPos += lineHeight;

    // Transit Lines
    CanvasUtil.writeText(
      canvas,
      `Lines: ${this.transitLines.length}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400
    );
    yPos += lineHeight;

    // Total Boats
    let totalBoats = 0;
    for (const line of this.transitLines) {
      totalBoats += line.getBoatCount();
    }
    CanvasUtil.writeText(
      canvas,
      `Boats: ${totalBoats}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400
    );
    yPos += lineHeight;

    // Ports
    CanvasUtil.writeText(
      canvas,
      `Ports: ${this.ports.length}`,
      padding,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400
    );

    // Draw legend at bottom
    const legendY = canvas.height - 180;
    CanvasUtil.fillRectangle(
      canvas,
      padding - 10,
      legendY - 10,
      320,
      170,
      0, 0, 0,
      0.5,
      5
    );

    CanvasUtil.writeText(
      canvas,
      this.isCreatingLine ? '🚌 LINE CREATION MODE' : 'Controls:',
      padding,
      legendY + 15,
      'left',
      'sans-serif',
      14,
      this.isCreatingLine ? '#f39c12' : '#ffffff',
      700
    );

    if (this.isCreatingLine) {
      CanvasUtil.writeText(
        canvas,
        'Click ports to add to line',
        padding,
        legendY + 40,
        'left',
        'sans-serif',
        12,
        'rgba(255, 255, 255, 0.9)',
        400
      );

      CanvasUtil.writeText(
        canvas,
        'Enter: Finish line | Esc: Cancel',
        padding,
        legendY + 58,
        'left',
        'sans-serif',
        12,
        '#2ecc71',
        400
      );

      CanvasUtil.writeText(
        canvas,
        `Ports selected: ${this.currentLine?.getPortCount() || 0}`,
        padding,
        legendY + 76,
        'left',
        'sans-serif',
        12,
        'rgba(255, 255, 255, 0.9)',
        400
      );
    } else {
      CanvasUtil.writeText(
        canvas,
        'L: Create transit line',
        padding,
        legendY + 40,
        'left',
        'sans-serif',
        12,
        '#3498db',
        400
      );

      CanvasUtil.writeText(
        canvas,
        'Left Click: Place tiles',
        padding,
        legendY + 58,
        'left',
        'sans-serif',
        12,
        'rgba(255, 255, 255, 0.9)',
        400
      );

      CanvasUtil.writeText(
        canvas,
        'Right Click: Remove tiles',
        padding,
        legendY + 76,
        'left',
        'sans-serif',
        12,
        '#e74c3c',
        400
      );
    }

    CanvasUtil.writeText(
      canvas,
      'Tiles auto-connect when adjacent',
      padding,
      legendY + 94,
      'left',
      'sans-serif',
      11,
      'rgba(255, 255, 255, 0.7)',
      400
    );

    CanvasUtil.writeText(
      canvas,
      '🎁 Every 3 days: +10 tiles',
      padding,
      legendY + 112,
      'left',
      'sans-serif',
      11,
      '#2ecc71',
      400
    );

    CanvasUtil.writeText(
      canvas,
      '🎁 Every 6 days: +1 boat/line',
      padding,
      legendY + 130,
      'left',
      'sans-serif',
      11,
      '#2ecc71',
      400
    );

    CanvasUtil.writeText(
      canvas,
      'Connect ports with colored lines!',
      padding,
      legendY + 148,
      'left',
      'sans-serif',
      10,
      'rgba(255, 255, 255, 0.6)',
      400
    );
  }

  private drawGameOver(canvas: HTMLCanvasElement): void {
    // Draw overlay
    CanvasUtil.fillRectangle(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0, 0, 0,
      0.7
    );

    // Draw game over panel
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;

    CanvasUtil.fillRectangle(
      canvas,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      52, 73, 94,
      0.95,
      10
    );

    // Game Over text
    CanvasUtil.writeText(
      canvas,
      'GAME OVER',
      canvas.width / 2,
      panelY + 60,
      'center',
      'sans-serif',
      40,
      '#e74c3c',
      700
    );

    // Reason
    CanvasUtil.writeText(
      canvas,
      this.gameOverMessage,
      canvas.width / 2,
      panelY + 110,
      'center',
      'sans-serif',
      20,
      '#ffffff',
      400
    );

    // Final score
    CanvasUtil.writeText(
      canvas,
      `Final Score: ${this.score}`,
      canvas.width / 2,
      panelY + 160,
      'center',
      'sans-serif',
      24,
      '#2ecc71',
      700
    );

    // Days survived
    CanvasUtil.writeText(
      canvas,
      `Survived ${this.currentDay} days`,
      canvas.width / 2,
      panelY + 200,
      'center',
      'sans-serif',
      18,
      '#ffffff',
      400
    );

    // Restart instruction
    CanvasUtil.writeText(
      canvas,
      'Refresh to play again',
      canvas.width / 2,
      panelY + 250,
      'center',
      'sans-serif',
      16,
      'rgba(255, 255, 255, 0.7)',
      400
    );
  }
}
