import { modules } from "./modules/modules.js";
export class Render {
  constructor(canvas, ctx, delta, camx, camy, xof, yof) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.delta = delta;
    this.camX = camx
    this.camY = camy
    this.xOffset = xof
    this.yOffset = yof
  }
  clearCanvas() {
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  drawGrids() {
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = "#000";
    this.ctx.beginPath();
    let gridSize = 100;
    for (let x = 0; x <= modules.mapScale; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, modules.mapScale);
    }
    for (let y = 0; y <= modules.mapScale; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(modules.mapScale, y);
    }
    this.ctx.stroke();
    this.ctx.closePath();
  }
  createObstacle(width, height, x, y){
    console.log(1)
    let col = "#696969"
    this.scale = 0;
    this.ctx.fillStyle = col
    this.ctx.fillRect(x - this.scale, y - this.scale, width, height);
    this.ctx.lineWidth = 2
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke()
  }
}
