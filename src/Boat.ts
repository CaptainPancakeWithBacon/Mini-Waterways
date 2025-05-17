export interface Point {
    x: number;
    y: number;
}

export class Boat {
    position: Point;
    speed = 2;
    path: Point[] = [];
    pathIndex = 0;

    constructor(startPosition: Point) {
        this.position = { ...startPosition };
    }

    setPath(path: Point[]) {
        this.path = path;
        this.pathIndex = 0;
    }

    update() {
        if (this.pathIndex < this.path.length) {
            const target = this.path[this.pathIndex];
            const dx = target.x - this.position.x;
            const dy = target.y - this.position.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.speed) {
                this.position = target;
                this.pathIndex++;
            } else {
                this.position.x += (dx / dist) * this.speed;
                this.position.y += (dy / dist) * this.speed;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
