const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

function draw() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ctx.fillStyle = '#f1ead9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', draw);
draw();
