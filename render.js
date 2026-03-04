import { modules } from "/modules/modules.js";
export class Render {
  constructor(canvas, ctx, delta, camx, camy, xof, yof, playerX, playerY) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.delta = delta;
    this.camX = camx
    this.camY = camy
    this.xOffset = xof
    this.yOffset = yof
    this.playerX = playerX
    this.playerY = playerY
  }

  clearCanvas(width, height) {
    this.ctx?.clearRect(-1000, -1000, width + 1000, height + 1000);
  }
  getCorners(x, y, w, h, x2, y2) {
    //x2 y2 = player / anchor coords
    const obj = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
    let arr = obj.sort((a, b) => {
      let dist1 = modules.getDistance(a[0], a[1], x2, y2)
      let dist2 = modules.getDistance(b[0], b[1], x2, y2)
      dist1 - dist2

    }).slice(0, 3);
    return [arr[1], arr[2]]
  }
  drawShadow(box) {
    var points = [];
    let shadow_length = this.canvas.width > this.canvas.height ? this.canvas.width : this.canvas.height;

    for (var key in box) {
      if (!box.hasOwnProperty(key)) continue;
      var vertex = box[key];
      getPoints(vertex, this.playerX, this.playerY);
    }
    function getPoints(vertex, plx, ply) {
      let angle = Math.atan2(ply - vertex.y, plx - vertex.x);
      let endX = vertex.x + shadow_length * Math.sin(-angle - Math.PI / 2);
      let endY = vertex.y + shadow_length * Math.cos(-angle - Math.PI / 2);

      points.push({
        endX: endX,
        endY: endY,
        startX: vertex.x,
        startY: vertex.y
      });
    }

    function drawShape(ctx) {

      for (var i = 0; i < points.length; i++) {
        var n = i == points.length - 1 ? 0 : i + 1;
        ctx.beginPath();
        ctx.moveTo(points[i].startX, points[i].startY);
        ctx.lineTo(points[n].startX, points[n].startY);
        ctx.lineTo(points[n].endX, points[n].endY);
        ctx.lineTo(points[i].endX, points[i].endY);
        ctx.fillStyle = "#131926";
        ctx.fill();
      }
    }
    drawShape(this.ctx);
  }
  drawGrids() {//ref grids
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
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
  drawShadows(width, height, x, y, zIndex){
    if (zIndex !== 0) {
      let box = {
        topLeft: {x: x,y: y},
        topRight: {x: x + width,y: y},
        bottomLeft: {x: x,y: y + height},
        bottomRight: {x: x + width,y: y + height}
      }
      this.drawShadow(box);
    }
  }
  createObstacle(width, height, x, y, type, active, zIndex) { // renders at corner
    let strokecolor = "rgba(0,0,0,0.5)"
    this.ctx.save();
    //let c = this.getCorners(x, y, width, height, this.playerX, this.playerY)
    this.ctx.globalAlpha = 1;
    if (type == "obj") {
      this.ctx.fillStyle = "lightBlue";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = strokecolor;
      this.ctx.strokeRect(x, y, width, height);
    } else if (type == "plate") {
      this.ctx.fillStyle = active ? "IndianRed" : "lightSteelBlue";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = strokecolor;
      this.ctx.strokeRect(x, y, width, height);
    } else {
      this.ctx.fillStyle = "dodgerBlue";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = strokecolor;
      this.ctx.strokeRect(x, y, width, height);
    }
    this.ctx.restore();
    return [width, height, x, y]
  }
}
