import { Boat } from './Boat';

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cellSize = 50;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

let boats: Boat[] = Array.from({ length: 3 }, (_, i) => new Boat({ x: 100 + i * 20, y: 100 }));
let currentPath: { x: number; y: number }[] = [];
let isDrawing = false;

function snapToGrid(x: number, y: number) {
    return {
        x: Math.round(x / cellSize) * cellSize,
        y: Math.round(y / cellSize) * cellSize
    };
}

function drawGrid() {
    ctx.strokeStyle = "#ddd";
    for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const pos = snapToGrid(e.clientX, e.clientY);
    currentPath = [pos];
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        const pos = snapToGrid(e.clientX, e.clientY);
        const last = currentPath[currentPath.length - 1];
        if (last.x !== pos.x || last.y !== pos.y) {
            currentPath.push(pos);
        }
    }
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    if (currentPath.length > 1) {
        boats.forEach(boat => boat.setPath([...currentPath]));
    }
});

function drawPath(path: { x: number; y: number }[]) {
    if (path.length < 2) return;
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPath(currentPath);
    boats.forEach(boat => {
        boat.update();
        boat.draw(ctx);
    });
    requestAnimationFrame(gameLoop);
}

gameLoop();
