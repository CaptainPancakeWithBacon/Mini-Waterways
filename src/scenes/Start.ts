import CanvasUtil from '../utilities/CanvasUtil.js';
import KeyListener from '../utilities/KeyListener.js';
import MouseListener from '../utilities/MouseListener.js';
import Scene from './Scene.js';
import Port, { PortType } from '../Port.js';
import { Point } from '../Boat.js';
import Grid from '../Grid.js';
import RouteNetwork from '../RouteNetwork.js';
import TransitLine from '../TransitLine.js';
import ButtonBar from '../utilities/ButtonBar.js';

/**
 * Main gameplay scene for Mini Waterways
 * Manages the game state, transit lines, ports, boats, and user interactions
 * Handles tile placement, line creation, passenger transport, and game progression
 */
export default class Start extends Scene {
  private grid: Grid;

  private routeNetwork: RouteNetwork;

  private ports: Port[] = [];

  private transitLines: TransitLine[] = [];

  private buttonBar: ButtonBar;

  // Tile placement mode
  private isPlacingTiles: boolean = false;

  private isRemovingTiles: boolean = false;

  private lastPlacedTile: Point | null = null;

  // Line creation mode
  private isCreatingLine: boolean = false;

  private currentLine: TransitLine | null = null;

  // Boat placement mode
  private isPlacingBoats: boolean = false;

  // Line editing mode
  private isEditingLine: boolean = false;

  private selectedLine: TransitLine | null = null;

  // Game state
  private score: number = 0;

  private gameTime: number = 0;

  private isGameOver: boolean = false;

  private gameOverMessage: string = '';

  // Resources
  private maxTiles: number = 30;

  private maxBoatsPerLine: number = 2;

  // Progression
  private dayDuration: number = 30000;

  private currentDay: number = 1;

  private nextPortTimer: number = 0;

  private nextPortInterval: number = 30000;

  private lastRewardDay: number = 0;

  /**
   * Creates a new Start scene instance
   * Initializes the grid, route network, and starting ports
   */
  public constructor() {
    super();
    this.grid = new Grid(window.innerWidth, window.innerHeight, 50);
    this.routeNetwork = new RouteNetwork(50);
    this.buttonBar = new ButtonBar();
    this.buttonBar.createGameButtons(window.innerWidth, window.innerHeight);
    this.initializePorts();
  }

  /**
   * Initializes the starting ports for the game
   * Creates 3 ports of different types with accessible tiles
   */
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
      { dx: 0, dy: 0 }, // Center
      { dx: 1, dy: 0 }, // Right
      { dx: -1, dy: 0 }, // Left
      { dx: 0, dy: 1 }, // Down
      { dx: 0, dy: -1 }, // Up
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
      'Bay View', 'Port Royal', 'Anchor Bay', 'Lighthouse Port',
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

  private getLineAtPosition(point: Point): TransitLine | null {
    // Check each line to see if the point is near its path
    const threshold = 20; // Distance threshold for clicking on a line

    for (const line of this.transitLines) {
      const ports = line.getPorts();
      if (ports.length < 2) continue;

      // Check each segment of the line
      for (let i = 0; i < ports.length; i++) {
        const port1 = ports[i];
        const port2 = ports[(i + 1) % ports.length];
        const pos1 = port1.getPosition();
        const pos2 = port2.getPosition();

        // Get the path between these two ports
        const path = this.routeNetwork.findPath(pos1.x, pos1.y, pos2.x, pos2.y);
        if (!path || path.length < 2) continue;

        // Check if point is near any segment of this path
        for (let j = 0; j < path.length - 1; j++) {
          const segStart = path[j];
          const segEnd = path[j + 1];

          // Calculate distance from point to line segment
          const dist = this.distanceToSegment(point, segStart, segEnd);
          if (dist < threshold) {
            return line;
          }
        }
      }
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  private distanceToSegment(point: Point, segStart: Point, segEnd: Point): number {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Segment is a point
      const px = point.x - segStart.x;
      const py = point.y - segStart.y;
      return Math.sqrt(px * px + py * py);
    }

    // Calculate projection of point onto line segment
    const t = Math.max(0, Math.min(1, ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared));
    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    const distX = point.x - projX;
    const distY = point.y - projY;
    return Math.sqrt(distX * distX + distY * distY);
  }

  private checkProgression(): void {
    const { currentDay } = this;

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

  public processInput(_keyListener: KeyListener): void {
    if (this.isGameOver) return;

    const mousePos = MouseListener.mouseCoordinates;
    const snappedPos = this.grid.snapToGrid(mousePos);

    // Update button states
    this.buttonBar.update();

    const placeTilesBtn = this.buttonBar.getButton('placeTiles');
    const removeTilesBtn = this.buttonBar.getButton('removeTiles');
    const createLineBtn = this.buttonBar.getButton('createLine');
    const completeLineBtn = this.buttonBar.getButton('completeLine');
    const cancelLineBtn = this.buttonBar.getButton('cancelLine');
    const undoPortBtn = this.buttonBar.getButton('undoPort');
    const addBoatBtn = this.buttonBar.getButton('addBoat');
    const editLineBtn = this.buttonBar.getButton('editLine');
    const deleteLineBtn = this.buttonBar.getButton('deleteLine');

    // Update button active states
    if (placeTilesBtn) placeTilesBtn.setActive(this.isPlacingTiles);
    if (removeTilesBtn) removeTilesBtn.setActive(this.isRemovingTiles);
    if (createLineBtn) createLineBtn.setActive(this.isCreatingLine);
    if (addBoatBtn) addBoatBtn.setActive(this.isPlacingBoats);
    if (editLineBtn) editLineBtn.setActive(this.isEditingLine);

    // Handle button clicks and keyboard shortcuts
    if (this.isCreatingLine) {
      // Line creation mode buttons
      if (createLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_L)) {
        // Toggle off line mode
        this.isCreatingLine = false;
        this.currentLine = null;
      }

      if (completeLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_ENTER)) {
        if (this.currentLine && this.currentLine.isValid()) {
          this.transitLines.push(this.currentLine);
          this.currentLine.setMaxBoats(this.maxBoatsPerLine);
          this.currentLine = null;
          this.isCreatingLine = false;
        }
      }

      if (cancelLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_ESC)) {
        this.currentLine = null;
        this.isCreatingLine = false;
      }

      if (undoPortBtn?.isClicked() || KeyListener.keyPressed('Backspace')) {
        if (this.currentLine) {
          this.currentLine.removeLastPort();
        }
      }
    } else if (this.isEditingLine) {
      // Line editing mode buttons
      if (editLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_E)) {
        // Toggle off edit mode
        this.isEditingLine = false;
        this.selectedLine = null;
      }

      if (cancelLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_ESC)) {
        this.isEditingLine = false;
        this.selectedLine = null;
      }

      if (deleteLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_DEL)) {
        if (this.selectedLine) {
          const index = this.transitLines.indexOf(this.selectedLine);
          if (index > -1) {
            this.transitLines.splice(index, 1);
          }
          this.selectedLine = null;
          this.isEditingLine = false;
        }
      }
    } else {
      // Normal mode buttons
      if (placeTilesBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_P)) {
        this.isPlacingTiles = !this.isPlacingTiles;
        this.isRemovingTiles = false;
        this.isPlacingBoats = false;
        this.lastPlacedTile = null;
      }

      if (removeTilesBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_R)) {
        this.isRemovingTiles = !this.isRemovingTiles;
        this.isPlacingTiles = false;
        this.isPlacingBoats = false;
        this.lastPlacedTile = null;
      }

      if (createLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_L)) {
        this.isCreatingLine = true;
        this.currentLine = new TransitLine(this.routeNetwork);
        this.isPlacingTiles = false;
        this.isRemovingTiles = false;
        this.isPlacingBoats = false;
        this.lastPlacedTile = null;
      }

      if (addBoatBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_B)) {
        this.isPlacingBoats = !this.isPlacingBoats;
        this.isPlacingTiles = false;
        this.isRemovingTiles = false;
      }

      if (editLineBtn?.isClicked() || KeyListener.keyPressed(KeyListener.KEY_E)) {
        this.isEditingLine = true;
        this.isPlacingTiles = false;
        this.isRemovingTiles = false;
        this.isPlacingBoats = false;
      }
    }

    // Handle boat placement
    if (this.isPlacingBoats && MouseListener.buttonPressed(MouseListener.BUTTON_LEFT)) {
      const clickedLine = this.getLineAtPosition(mousePos);
      if (clickedLine) {
        // Add a boat to this line
        const ports = clickedLine.getPorts();
        if (ports.length >= 2 && clickedLine.getBoatCount() < clickedLine.getMaxBoats()) {
          clickedLine.spawnBoat();
          // Load passengers at first port if available (up to boat capacity)
          const boats = clickedLine.getBoats();
          const newBoat = boats[boats.length - 1];
          const firstPort = ports[0];
          if (firstPort && firstPort.getPassengers() > 0 && newBoat) {
            const boatCapacity = 10; // Boat max capacity
            const loadedPassengers = firstPort.removePassengers(boatCapacity);
            newBoat.loadPassengers(loadedPassengers);
          }
        }
      }
    }

    // Handle line selection for editing
    if (this.isEditingLine && !this.selectedLine && MouseListener.buttonPressed(MouseListener.BUTTON_LEFT)) {
      const clickedLine = this.getLineAtPosition(mousePos);
      if (clickedLine) {
        this.selectedLine = clickedLine;
      }
    }

    // Line creation mode - click ports to add to line
    if (this.isCreatingLine && MouseListener.buttonPressed(MouseListener.BUTTON_LEFT)) {
      const clickedPort = this.getPortAtPosition(mousePos);
      if (clickedPort && this.currentLine) {
        this.currentLine.addPort(clickedPort);
      }
    }

    // Place tiles while in place mode
    if (MouseListener.isButtonDown(MouseListener.BUTTON_LEFT) && this.isPlacingTiles) {
      if (this.routeNetwork.getPlayerTileCount() < this.maxTiles) {
        if (!this.lastPlacedTile
            || this.lastPlacedTile.x !== snappedPos.x
            || this.lastPlacedTile.y !== snappedPos.y) {
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

    // Remove tiles while in remove mode
    if (MouseListener.isButtonDown(MouseListener.BUTTON_LEFT) && this.isRemovingTiles) {
      if (!this.lastPlacedTile
          || this.lastPlacedTile.x !== snappedPos.x
          || this.lastPlacedTile.y !== snappedPos.y) {
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

    // Stop placing/removing tiles on mouse up
    if (MouseListener.mouseUp) {
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
            const matchingPassengers = allPassengers.filter((p) => p.destinationType === destinationType);
            const nonMatchingPassengers = allPassengers.filter((p) => p.destinationType !== destinationType);

            // Score for successfully delivered passengers
            this.score += matchingPassengers.length;

            // Put non-matching passengers back on the boat (wrong destination)
            if (nonMatchingPassengers.length > 0) {
              boat.loadPassengers(nonMatchingPassengers);
            }
          }

          // Load new passengers heading to other ports (up to remaining boat capacity)
          if (destinationPort.getPassengers() > 0) {
            const boatCapacity = 10; // Boat max capacity
            const currentPassengers = boat.getPassengers();
            const availableSpace = boatCapacity - currentPassengers;
            if (availableSpace > 0) {
              const loadedPassengers = destinationPort.removePassengers(availableSpace);
              boat.loadPassengers(loadedPassengers);
            }
          }

          // Move to next stop on the line
          boat.swapDestination();
        }
      }
    }

    return this;
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

    // Draw selected line with highlight
    if (this.selectedLine) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const ports = this.selectedLine.getPorts();
        if (ports.length >= 2) {
          // Draw thick highlight around selected line
          for (let i = 0; i < ports.length; i++) {
            const port1 = ports[i];
            const port2 = ports[(i + 1) % ports.length];
            const pos1 = port1.getPosition();
            const pos2 = port2.getPosition();

            const path = this.routeNetwork.findPath(pos1.x, pos1.y, pos2.x, pos2.y);
            if (path && path.length > 1) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.lineWidth = 8;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.setLineDash([10, 5]);

              ctx.beginPath();
              ctx.moveTo(path[0].x, path[0].y);
              for (let j = 1; j < path.length; j++) {
                ctx.lineTo(path[j].x, path[j].y);
              }
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }
    }

    // Draw line being created
    if (this.isCreatingLine && this.currentLine) {
      this.currentLine.draw(canvas);
    }

    // Draw tile preview while placing
    if (this.isPlacingTiles) {
      const mousePos = MouseListener.mouseCoordinates;
      const snappedPos = this.grid.snapToGrid(mousePos);

      if (!this.getPortAtPosition(snappedPos)
          && this.routeNetwork.getPlayerTileCount() < this.maxTiles) {
        const gridSize = 50;
        CanvasUtil.fillRectangle(
          canvas,
          snappedPos.x - gridSize / 2,
          snappedPos.y - gridSize / 2,
          gridSize,
          gridSize,
          'rgba(255, 255, 255, 0.3)',
        );
      }
    }

    // Draw removal preview
    if (this.isRemovingTiles) {
      const mousePos = MouseListener.mouseCoordinates;
      const snappedPos = this.grid.snapToGrid(mousePos);

      if (!this.getPortAtPosition(snappedPos)
          && this.routeNetwork.hasTile(snappedPos.x, snappedPos.y)) {
        const gridSize = 50;
        CanvasUtil.fillRectangle(
          canvas,
          snappedPos.x - gridSize / 2,
          snappedPos.y - gridSize / 2,
          gridSize,
          gridSize,
          'rgba(231, 76, 60, 0.5)',
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

    // Draw button bar
    this.buttonBar.draw(canvas, this.isCreatingLine, this.isEditingLine);

    // Draw game over screen
    if (this.isGameOver) {
      this.drawGameOver(canvas);
    }
  }

  private drawUI(canvas: HTMLCanvasElement): void {
    const padding = 20;
    const lineHeight = 25;
    let yPos = padding;

    // Draw stats panel at top right instead of top left
    const panelWidth = 220;
    const panelX = canvas.width - panelWidth - padding + 10;

    // Draw semi-transparent background
    CanvasUtil.fillRectangle(
      canvas,
      panelX - 10,
      padding - 10,
      panelWidth,
      lineHeight * 6 + 10,
      'rgba(0, 0, 0, 0.5)',
      5,
    );

    // Score
    CanvasUtil.writeText(
      canvas,
      `Score: ${this.score}`,
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      18,
      '#ffffff',
      700,
    );
    yPos += lineHeight;

    // Day
    CanvasUtil.writeText(
      canvas,
      `Day: ${this.currentDay}`,
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400,
    );
    yPos += lineHeight;

    // Route Tiles (only player tiles)
    const tileColor = this.routeNetwork.getPlayerTileCount() >= this.maxTiles ? '#e74c3c' : '#ffffff';
    CanvasUtil.writeText(
      canvas,
      `Tiles: ${this.routeNetwork.getPlayerTileCount()}/${this.maxTiles}`,
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      tileColor,
      400,
    );
    yPos += lineHeight;

    // Transit Lines
    CanvasUtil.writeText(
      canvas,
      `Lines: ${this.transitLines.length}`,
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400,
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
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400,
    );
    yPos += lineHeight;

    // Ports
    CanvasUtil.writeText(
      canvas,
      `Ports: ${this.ports.length}`,
      panelX,
      yPos + 20,
      'left',
      'sans-serif',
      16,
      '#ffffff',
      400,
    );

    // Draw compact info panel at bottom left (above button bar)
    if (this.isCreatingLine) {
      const legendY = canvas.height - this.buttonBar.getBarHeight() - 85;
      CanvasUtil.fillRectangle(
        canvas,
        padding - 10,
        legendY - 10,
        280,
        75,
        'rgba(0, 0, 0, 0.7)',
        5,
      );

      CanvasUtil.writeText(
        canvas,
        '🚌 LINE CREATION MODE',
        padding,
        legendY + 15,
        'left',
        'sans-serif',
        14,
        '#f39c12',
        700,
      );

      CanvasUtil.writeText(
        canvas,
        'Click ports to add to line',
        padding,
        legendY + 38,
        'left',
        'sans-serif',
        12,
        'rgba(255, 255, 255, 0.9)',
        400,
      );

      CanvasUtil.writeText(
        canvas,
        `Ports selected: ${this.currentLine?.getPortCount() || 0}`,
        padding,
        legendY + 58,
        'left',
        'sans-serif',
        12,
        '#2ecc71',
        600,
      );
    } else if (this.isPlacingBoats) {
      const legendY = canvas.height - this.buttonBar.getBarHeight() - 65;
      CanvasUtil.fillRectangle(
        canvas,
        padding - 10,
        legendY - 10,
        280,
        55,
        'rgba(0, 0, 0, 0.7)',
        5,
      );

      CanvasUtil.writeText(
        canvas,
        '🚤 BOAT PLACEMENT MODE',
        padding,
        legendY + 15,
        'left',
        'sans-serif',
        14,
        '#1abc9c',
        700,
      );

      CanvasUtil.writeText(
        canvas,
        'Click on a line to add a boat',
        padding,
        legendY + 38,
        'left',
        'sans-serif',
        12,
        'rgba(255, 255, 255, 0.9)',
        400,
      );
    } else if (this.isEditingLine) {
      const legendY = canvas.height - this.buttonBar.getBarHeight() - 85;
      CanvasUtil.fillRectangle(
        canvas,
        padding - 10,
        legendY - 10,
        280,
        75,
        'rgba(0, 0, 0, 0.7)',
        5,
      );

      CanvasUtil.writeText(
        canvas,
        '✏️ LINE EDITING MODE',
        padding,
        legendY + 15,
        'left',
        'sans-serif',
        14,
        '#9b59b6',
        700,
      );

      if (this.selectedLine) {
        CanvasUtil.writeText(
          canvas,
          'Line selected',
          padding,
          legendY + 38,
          'left',
          'sans-serif',
          12,
          '#2ecc71',
          600,
        );

        CanvasUtil.writeText(
          canvas,
          'Press Delete to remove line',
          padding,
          legendY + 58,
          'left',
          'sans-serif',
          12,
          'rgba(255, 255, 255, 0.9)',
          400,
        );
      } else {
        CanvasUtil.writeText(
          canvas,
          'Click on a line to select it',
          padding,
          legendY + 38,
          'left',
          'sans-serif',
          12,
          'rgba(255, 255, 255, 0.9)',
          400,
        );
      }
    }
  }

  private drawGameOver(canvas: HTMLCanvasElement): void {
    // Draw overlay
    CanvasUtil.fillRectangle(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      'rgba(0, 0, 0, 0.7)',
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
      'rgba(52, 73, 94, 0.95)',
      10,
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
      700,
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
      400,
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
      700,
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
      400,
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
      400,
    );
  }
}
