import { modules } from "./modules/modules.js";
var textureCache = {};
export class Render {
  constructor(canvas, ctx, delta, camx, camy, xof, yof, playerX, playerY, lumine) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.delta = delta;
    this.camX = camx
    this.camY = camy
    this.xOffset = xof
    this.yOffset = yof
    this.playerX = playerX
    this.playerY = playerY
    this.lumine = lumine;
  }
  getTexture(name) {
    if (!textureCache[name]) {
      const img = new Image();
      img.src = "./assets/textures/" + name;
      textureCache[name] = {
        img,
        loaded: false
      }
      img.onload = () => {
        textureCache[name].loaded = true;
      }
    }
    return textureCache[name]
  }
  clearCanvas(width, height) {
    this.ctx?.clearRect(-1000, -1000, 11000, 11000);
  }
  drawShadow(box) {
    var points = [];
    let shadow_length = this.canvas.width > this.canvas.height ? this.canvas.width : this.canvas.height; // Reduced fixed max length
    function getPoints(vertex, plx, ply) {
      let angle = Math.atan2(ply - vertex.y, plx - vertex.x);
      let endX = vertex.x + shadow_length * Math.sin(-angle - Math.PI / 2);
      let endY = vertex.y + shadow_length * Math.cos(-angle - Math.PI / 2);

      points.push({ x: endX, y: endY, });
      points.push({ x: vertex.x, y: vertex.y });
    }
    for (var key in box) {
      if (!box.hasOwnProperty(key)) continue;
      var vertex = box[key];
      getPoints(vertex, this.playerX, this.playerY);
    }
    function drawShape(ctx) {
      let hull = modules.convexHull(points)
      ctx.beginPath()
      ctx.moveTo(hull[0].x, hull[0].y);
      for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y)
      }
      ctx.closePath();
      ctx.fillStyle = "#000000";
      ctx.fill();
    }
    this.ctx.save();
    this.ctx.globalCompositeOperation = "overlay";
    drawShape(this.ctx);
    this.ctx.restore();
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
  drawShadows(width, height, x, y, zIndex) {
    if (zIndex !== 0) {
      let box = {
        topLeft: { x: x, y: y },
        topRight: { x: x + width, y: y },
        bottomLeft: { x: x, y: y + height },
        bottomRight: { x: x + width, y: y + height }
      }
      this.drawShadow(box);
    }
  }
  draw3d(width, height, x, y, zIndex) { // convex hull algorithm
    let box = {
      topLeft: { x: x, y: y },
      topRight: { x: x + width, y: y },
      bottomLeft: { x: x, y: y + height },
      bottomRight: { x: x + width, y: y + height }
    }
    let mp = (box) => {
      let wid = (box.topLeft.x + box.topRight.x) / 2
      let len = (box.topLeft.y + box.bottomLeft.y) / 2
      return { x: wid, y: len }
    }
    let base = [];
    let proj = [];
    if (zIndex !== 0) {
      var points = []

      for (var key in box) {
        if (!box.hasOwnProperty(key)) continue;
        var vertex = box[key];
        let theta = Math.atan2(this.playerY - vertex.y, this.playerX - vertex.x)
        let offset = 20
        base.push({ x: vertex.x, y: vertex.y });
        proj.push({ x: vertex.x + Math.cos(theta) * offset, y: vertex.y + Math.sin(theta) * offset });
      }
      points = [...base, ...proj]
      function drawShape(ctx) {
        let hull = modules.convexHull(points)
        ctx.beginPath()
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
          ctx.lineTo(hull[i].x, hull[i].y)
        }
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      drawShape(this.ctx);
    }
  }
  drawDepth(e) {
    let strokecolor = "rgba(0,0,0,0)"
    this.ctx.save()
    if (e.texture.includes("#")) {
      this.ctx.fillStyle = e.texture
      this.ctx.fillRect(e.x, e.y, e.width, e.height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = strokecolor;
      this.ctx.strokeRect(e.x, e.y, e.width, e.height);
    } else {
      const fl = this.getTexture(e.texture)
      if (!e.fill) {
        for (let i = e.x; i < e.x + e.width; i += e.size[0]) {
          for (let j = e.y; j < e.y + e.height; j += e.size[1]) {
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(fl.img, i, j, e.size[0] + 1, e.size[1] + 1)
          }
        }
      } else {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.drawImage(fl.img, e.x, e.y, e.width, e.height)
      }
    }
    this.ctx.restore();
    return e
  }
  renderNotif(notif) {
    this.ctx.save();
    this.ctx.globalAlpha = notif.opacity || 1;

    const x = notif.x || this.canvas.width / 2;
    const y = notif.y || 100;
    const scale = notif.scale || 1;
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-x, -y);

    const padding = 50;
    const textWidth = this.ctx.measureText(notif.text).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 50;
    const radius = 8;
    const bx = x - boxWidth / 2;
    const by = y - boxHeight / 2;
    this.ctx.save();
    this.ctx.globalAlpha = notif.opacity * 0.1
    this.ctx.fillStyle = notif.color;
    this.ctx.shadowColor = "rgba(0,0,0,0.3)";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 2;
    this.ctx.filter = "blur(8px)"

    this.ctx.beginPath();
    this.ctx.moveTo(bx + radius, by);
    this.ctx.lineTo(bx + boxWidth - radius, by);
    this.ctx.quadraticCurveTo(bx + boxWidth, by, bx + boxWidth, by + radius);
    this.ctx.lineTo(bx + boxWidth, by + boxHeight - radius);
    this.ctx.quadraticCurveTo(bx + boxWidth, by + boxHeight, bx + boxWidth - radius, by + boxHeight);
    this.ctx.lineTo(bx + radius, by + boxHeight);
    this.ctx.quadraticCurveTo(bx, by + boxHeight, bx, by + boxHeight - radius);
    this.ctx.lineTo(bx, by + radius);
    this.ctx.quadraticCurveTo(bx, by, bx + radius, by);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // Text
    this.ctx.fillStyle = notif.color || "#ffffff";
    this.ctx.strokeStyle = "#0000001f"
    this.ctx.font = "18px Black Ops One";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.lineJoin = "round"
    this.ctx.strokeText(notif.text, x, y)
    this.ctx.fillText(notif.text, x, y);
    this.ctx.restore();
  }
  renderItems(e) {
    if (e.found) return
    const fl = this.getTexture(e.img);
    const speed = 1000;
    const time = Date.now() / speed;
    const scalePulse = 1 + Math.sin(time) * 0.08;
    const floatAmplitudeX = 15;
    const floatAmplitudeY = 10;
    const offsetX = Math.sin(time * 0.7) * floatAmplitudeX;
    const offsetY = Math.sin(time * 0.5 + 1.2) * floatAmplitudeY;
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    const centerX = e.x + e.width / 2;
    const centerY = e.y + e.height / 2;
    this.ctx.translate(centerX + offsetX, centerY + offsetY);
    this.ctx.scale(scalePulse, scalePulse);
    this.ctx.drawImage(fl.img, -e.width / 2, -e.height / 2, e.width, e.height);
    this.ctx.restore();
  }
  createObstacle(e, width, height, x, y, type, active, zIndex) { // renders at corner
    let strokecolor = "rgba(0,0,0,0)"
    this.ctx.save();
    /*this.ctx.globalAlpha = 0.7;
    this.ctx.shadowColor = "white"
    this.ctx.shadowOffsetX = 20
    this.ctx.shadowOffsetY = 20*/
    if (type == "light") {
      this.ctx.fillStyle = "#27292e";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = strokecolor;
      this.ctx.strokeRect(x, y, width, height);
    } else if (type == "obj") {
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
    } else if (type == "floor") {
      if (active && typeof active === "object") {
        let fl = []
        for (let i = 0; i < active.length; i++) {
          fl.push(this.getTexture(active[i]))
        }
        //console.log(fl[Math.floor(Math.random() * fl.length)].img)
        //const fl = this.getTexture(active)
        let size = 100
        for (let i = x; i < x + width; i += size) {
          for (let j = y; j < y + height; j += size) {
            const index = Math.abs((Math.floor(i / size) * 73) ^ (Math.floor(j / size) * 10)) % active.length;
            //Math.floor(Math.random() * fl.length) //flickering
            this.ctx.imageSmoothingEnabled = false;
            if (fl[index].loaded) {
              this.ctx.filter = "saturation(0)";
              this.ctx.drawImage(fl[index].img, i, j, size + 1, size + 1)
            }
          }
        }
      } else if (active.includes("#")) {
        this.filter = `blur(${e.callback}px)`
        this.ctx.fillStyle = active
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowColor = active; // Disable shadow for stroke
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = strokecolor;
        this.ctx.strokeRect(x, y, width, height);
      } else {
        const fl = this.getTexture(active)
        let size = 100
        for (let i = x; i < x + width; i += size) {
          for (let j = y; j < y + height; j += size) {
            this.ctx.imageSmoothingEnabled = false;
            if (fl.loaded) this.ctx.drawImage(fl.img, i, j, size + 1, size + 1)
          }
        }
      }
    } else if (type == "map") {
      //console.log(e)
      let fl = []
      for (let i = 0; i < active.length; i++) {
        fl.push(this.getTexture(active[i]))
      }
      //console.log(fl[Math.floor(Math.random() * fl.length)].img)
      //const fl = this.getTexture(active)
      let size = 100
      for (let i = x; i < x + width; i += e.size[0]) {
        for (let j = y; j < y + height; j += e.size[0]) {
          const index = Math.abs((Math.floor(i / e.size[0]) * 73) ^ (Math.floor(j / e.size[0]) * 10)) % active.length;
          //Math.floor(Math.random() * fl.length) //flickering
          this.ctx.imageSmoothingEnabled = false;
          if (fl[index].loaded) this.ctx.drawImage(fl[index].img, i, j, e.size[0] + 1, e.size[1] + 1)
        }
      }
    } else {
      this.ctx.fillStyle = "#222225";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.shadowColor = "transparent"; // Disable shadow for stroke
      let lw = 5
      this.ctx.lineWidth = lw;
      this.ctx.strokeStyle = "#39393c";
      this.ctx.strokeRect(x + lw / 2, y + lw / 2, width - lw, height - lw);
    }
    this.ctx.restore();
    return [width, height, x, y]
  }
}
