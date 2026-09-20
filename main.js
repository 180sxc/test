/*
main js -> main storyline runners
-  storyline detection & state execution
-  state detection / event execution 
-  kept simple & easy for this
*/

import { byID, byCN, qsa, qs } from "./tools/dom.js";
import { canvas, ls } from "./tools/dom.js";
import { Render } from "./render.js";
import { modules } from "./modules/modules.js";
import { mapData } from "./assets/map-data.js";


window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60); //60fps max
    }
  );
})();

//save current level / game state 
function createSave() {

}

var stopMovement = false;
var gameStopped = false; //fps
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function fpsLoop() {
  const now = performance.now();
  frameCount++;

  // Update FPS every second
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
    //console.log(fps)
  }

  requestAnimationFrame(fpsLoop);
}
var textureCache = {}
fpsLoop();
class Player {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.x2 = void 0;
    this.y2 = void 0;
    this.lastx = this.x;
    this.lasty = this.y;
    this.dir = 0;
    this.moveDir = 0;
    this.width = 75
    this.height = 150;
    this.color = "red";
    this.speed = 5;
    this.scale = 75;
    this.sprinting = false;
    this.stamina = 300;  //300
    this.laststamina = 0;
    //-------------------------------------//
    this.lastMoveDir = void 0;
    this.prevMoveDir = 1.57;
    this.tick = 0;
    this.tick2 = 0;
  }
  getTexture(name) {
    if (!textureCache[name]) {
      const img = new Image();
      img.src = "assets/textures/" + name;
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
  drawShadow(ctx) {
    ctx.save();

    const shadowX = this.x;
    const shadowY = this.y + this.height * 0.45;
    const shadowWidth = this.width * .9;
    const shadowHeight = this.height * 0.15;

    ctx.globalAlpha = 0.3;
    ctx.filter = "blur(10px)";
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  draw(ctx) {
    let pi = Math.PI
    let round = (e) => { return Number(e.toFixed(2)) }
    const angles = [
      round(0), round(pi / -4), round(pi / -2), round((pi / -4) * 3),
      round(pi), round((pi / 4) * 3), round(pi / 2), round(pi / 4)
    ]
    //hitbox
    //ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height)
    const idle8 = this.getTexture("idlesprite.png")
    const move8 = this.getTexture("movesprite.png")
    ctx.save();
    this.drawShadow(ctx)
    ctx.imageSmoothingEnabled = false;
    if (this.lastMoveDir == void 0) {
      let fimg = idle8.img
      let spriteIndex = angles.indexOf(this.prevMoveDir);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fimg, spriteIndex * 32, 0, 32, 64, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
    } else {
      this.tick++;
      if (this.tick % 12 == 0) this.tick2 = this.tick2 == 7 ? 0 : this.tick2 + 1;
      let mimg = move8.img
      let angleIndex = angles.indexOf(this.lastMoveDir);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mimg, this.tick2 * 32, angleIndex * 64, 32, 64, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
    }
    ctx.restore();
  }
  boundaryX(x, boundaries) {
    const halfWidth = this.width / 2;
    return !(x + halfWidth >= boundaries[1] || x - halfWidth <= boundaries[0]);
  }
  boundaryY(y, boundaries) {
    const halfHeight = this.height / 2;
    return !(y + halfHeight >= boundaries[1] || y - halfHeight <= boundaries[0]);
  }
  movePlayer(ctx, movekeys, keys, collisions) {
    if (stopMovement) return;
    let newmovedir = undefined;
    newmovedir = this.newMoveDir(ctx, movekeys, keys);
    //movement here
    this.x2 = isNaN(Math.cos(newmovedir) * this.speed) ? 0 : Math.cos(newmovedir) * this.speed;
    this.y2 = isNaN(Math.sin(newmovedir) * this.speed) ? 0 : Math.sin(newmovedir) * this.speed;
    this.x += (!this.boundaryX(this.x + this.x2, mapData.boundaries.map) || !collisions(this.x + this.x2, this.y, this.scale)[0]) ? 0 : this.x2;
    this.y += (!this.boundaryY(this.y + this.y2, mapData.boundaries.map) || !collisions(this.x, this.y + this.y2, this.scale)[1]) ? 0 : this.y2;
    this.lastMoveDir = newmovedir;
    if (this.lastMoveDir !== void 0) {
      this.prevMoveDir = this.lastMoveDir
    }
  }
  newMoveDir(ctx, movekeys, keys) {
    let dy = 0,
      dx = 0;
    for (let dir in movekeys) {
      let tmpdir = movekeys[dir];
      dx += !!keys[dir] * tmpdir[0];
      dy += !!keys[dir] * tmpdir[1];
    }
    return dx == 0 && dy == 0
      ? undefined
      : modules.fixTo(Math.atan2(dy, dx), 2);
  }
}

class State {
  constructor() {
    this.stack = null;
  }
  enter(data) { } // on state enter
  update(dt) { } // exit conditions here and calls this.stack.requestPop()
  exit() { } // on state exit
}

var attributes = {
  inventory: [],
  key1: { tag: "key1", icon: "" },
  door1: { type: "door", locked: 1, key: ["key1"] },
  lighter: { tag: "lighter", icon: "" }
}
var timeslot = {}

class FSM {
  constructor(init) {
    this.stack = [];
    this.pendingPop = !1;
  }
  push(state, data) {
    this.pendingPop = false;
    state.stack = this;
    this.stack.push(state); //push states to queue
    state.enter(data) //[SUBCLASS METHODS]
  }
  requestPop() {
    console.log(1)
    if (!this.pendingPop) this.pendingPop = !0; //requests pop from ext states
  }
  pop() {
    const state = this.stack.pop(); //removes the top in queue and removes it
    state.exit();// [SUBCLASS METHODS] state defined as the exited state and finalises exits 
  }
  update(dt) {
    const top = this.top(); //gets top state
    //console.log(this.pendingPop)
    if (this.pendingPop) {
      this.pendingPop = false;
      this.pop();
    }
    top?.update(dt); // [SUBCLASS METHODS] updates top state
  }
  top() {
    return this.stack[this.stack.length - 1]; //returns top state (current/next state)
  }
}
const fsm = new FSM();

class Pause extends State {
  enter(data) {
    stopMovement = true;
    gameStopped = true;
    qs(document, ".pause-screen").style.opacity = 1;
    this.handleKeyDown = (e) => {
      if (e.keyCode == 27 && gameStopped) {
        this.stack.requestPop();
      }
    };
    window.addEventListener("keydown", this.handleKeyDown);
  }
  update(dt) { }
  exit() {
    stopMovement = false;
    gameStopped = false;
    qs(document, ".pause-screen").style.opacity = 0;
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}



class loop {
  constructor(dom, ctx) {
    this.now;
    this.lastUpdate = Date.now();
    this.canvas = dom;
    this.ctx = ctx;
    this.delta;
    this.keys = {};
    this.player = void 0;
    this.newloop = {};
    this.moving = false;
    this.movekeys = {
      87: [0, -1],
      38: [0, -1],
      83: [0, 1],
      40: [0, 1],
      65: [-1, 0],
      37: [-1, 0],
      68: [1, 0],
      39: [1, 0],
    };
    this.camX = 0;
    this.camY = 0;
    this.camLerp = 0.07;
    this.camInterrupt = !1;
    this.rtick = 0;
    this.tick = 0;
    this.maxScreenHeight = modules.maxScreenHeight;
    this.maxScreenWidth = modules.maxScreenWidth;
    this.renderedMap = false;
    this.mapObjects = []
    this.mapObjectsId = 0;
    this.gameObjects = [];
    this.gameObjectsID = 0;
    this.depthObjects = [];
    this.depthObjectsID = 0
    this.questItems = [];
    this.questItemsID = 0
    this.holdstamina = false;
    this.showing = void 0;
    this.anchorX = void 0;
    this.anchorY = void 0;
    this.wheel = document.querySelector('.wheel');
    this.rshadow = void 0;
    this.lumine = [];
    this.currentNotification = null;
    this.notificationTimer = null;
    this.lastTriggerTime = {};
    this.hasLumine = 0; //shadow and vignette
    this.objShadow = 1; //object shadow
    this.nighttime = 0; //night mode
  }
  getoutoftheroom = class extends State {
    enter(data) {
    }
    update(dt) { }
    exit() {
    }
  }
  addMapObjects(width, height, x, y, type, img, size) { //type = map boundaries
    this.mapObjectsId++;
    this.mapObjects.push({
      width: width,
      height: height,
      x: x,
      y: y,
      img: img,
      size: size,
      id: this.mapObjectsId,
    })
  }
  addDepthObjects(width, height, x, y, texture, size, side, fill, connected) {
    this.depthObjectsID++;
    this.depthObjects.push({
      width: width,
      height: height,
      x: x,
      y: y,
      id: this.depthObjects,
      texture: texture,
      size: size,
      side: side,
      fill: fill,
      connected: connected
    })
  }
  addItems(x, y, img, callback) {
    this.questItemsID++;
    this.questItems.push({
      x: x,
      y: y,
      width: 100,
      height: 100,
      img: img,
      callback: callback,
      active: false,
      found: false
    })
  }
  addGameObjects(width, height, x, y, zIndex, type, callback = void 0, active = false, size) {
    this.gameObjectsID++;
    this.gameObjects.push({
      width: width,
      height: height,
      active: active,
      x: x,
      y: y,
      zIndex: zIndex,
      id: this.gameObjectsID,
      type: type,
      size: size,
      callback: callback
    })//floor -> active > color
    if (type == "light") this.lumine.push({ width: width, height: height, x: x, y: y, type: type, active: active })
  }
  newMap() {//need walls, visible walls, objects
    //area 1 (empty factory/textile mill)
    this.addMapObjects(50, 50, 6950, 6950, "map", ["wallcorner.png"], [50, 50])
    this.addMapObjects(50, 2000, 6950, 7000, "map", ["walltexture.png"], [50, 100])
    this.addMapObjects(50, 50, 10000, 6950, "map", ["wallcorner.png"], [50, 50])
    this.addMapObjects(50, 2000, 10000, 7000, "map", ["walltexture.png"], [50, 100])
    this.addMapObjects(3000, 50, 7000, 6950, "map", ["walltexture2.png"], [100, 50])
    this.addMapObjects(400, 50, 7000, 7500, "map", ["walltexture2.png"], [100, 50])
    this.addMapObjects(3000, 50, 7000, 9000, "map", ["walltexture2.png"], [100, 50])
    this.addMapObjects(50, 500, 7600, 7000, "map", ["walltexture.png"], [50, 100])
    this.addMapObjects(50, 50, 7600, 7500, "map", ["wallcorner.png"], [50, 50])
    this.addGameObjects(3000, 2000, 7000, 7000, 0, "floor", 0, ["textileMillFloor.png"])
    this.addDepthObjects(3000, 200, 7000, 7000, "textileWindow2.png", [200, 200], true)
    this.addDepthObjects(400, 200, 7000, 7550, "textilewall.png", [200, 200], true)
    this.addGameObjects(400, 150, 7000, 7650, 0, "floor", 0, "#0000006e")
    this.addDepthObjects(50, 200, 7600, 7550, "textilewall2.png", [50, 200], true)
    this.addGameObjects(50, 150, 7600, 7650, 0, "floor", 0, "#0000006e")
    this.addGameObjects(3000, 150, 7000, 7100, 0, "floor", 0, "#0000006e")
    //this.addMapObjects(600, 100, 7600, 7600, "map", "#ff0", 0, "#b0b0b06e")
    //this.addMapObjects(1200, 200, 7600, 7600, "map", ["mill.png"], [200, 200])
    //this.addGameObjects(200, 250, 7400, 7500, 0, "floor", 0, "#0000006e")
    //this.addGameObjects(200, 150, 7400, 7650, 0, "floor", 0, "#0000006e")

    this.addDepthObjects(200, 150, 7000, 7150, "cabinet.png", [200, 150], true)

    this.addMapObjects(200, 50, 7400, 7500, "map", ["doorframe.png"], [100, 50])
    this.addGameObjects(200, 20, 7400, 7480, 0, "floor", (obj) => {
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      let active = this.areaTrigger(this.player, area)
      if (active && attributes.door1.locked) this.newNotifs("door is locked", modules.getCenter(area.x, area.y, area.x2, area.y2)[0], modules.getCenter(area.x, area.y, area.x2, area.y2)[1], "#ff6b6b")
      if (active && !attributes.door1.locked) this.teleport(7500, 7800, this.player)
      else if (attributes.inventory.indexOf("key1") !== -1) {
        attributes.door1.locked = 0
      }
    }, "#ff000000", [200, 200])
    this.addDepthObjects(200, 200, 7400, 7550, "doubledoor.png", [200, 200], true)
    this.addGameObjects(200, 50, 7400, 7600, 0, "floor", (obj) => {
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      let active = this.areaTrigger(this.player, area)
      if (active && !attributes.door1.locked) this.teleport(7500, 7400, this.player)
    }, "#0000006e", [200, 200])
    this.addGameObjects(200, 50, 7400, 7750, 0, "floor", 0, "#0000006e", [200, 200])

    this.addItems(7000, 7150, "mark.png", (obj) => {
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      obj.active = this.areaTrigger(this.player, area)
      if (obj.active) {
        if (!obj.found) this.newNotifs("You found a key!", modules.getCenter(area.x, area.y, area.x2, area.y2)[0], modules.getCenter(area.x, area.y, area.x2, area.y2)[1], "#ffda6b")
        obj.found = true;
        attributes.inventory.push(attributes.key1.tag)
      }
    })
    this.addItems(8150, 8150, "mark.png", (obj) => {
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      obj.active = this.areaTrigger(this.player, area)
      if (obj.active) {
        if (!obj.found) this.newNotifs("You found a lighter!", modules.getCenter(area.x, area.y, area.x2, area.y2)[0], modules.getCenter(area.x, area.y, area.x2, area.y2)[1], "#ffda6b")
        obj.found = true;
        attributes.inventory.push(attributes.lighter.tag)
      }
    })

    this.addGameObjects(1200, 200, 7600, 7800, 2, "map", void 0, ["mill.png"], [200, 200])
    this.addGameObjects(1200, 200, 7600, 8200, 2, "map", void 0, ["mill.png"], [200, 200])
    this.addGameObjects(1200, 200, 7600, 8600, 2, "map", void 0, ["mill.png"], [200, 200])
    this.addGameObjects(1000, 200, 7800, 7400, 2, "map", void 0, ["mill.png"], [200, 200])
    for (let i = 7000; i < 10000; i += 200) {
      //this.addGameObjects(80, 60, i, 7250, 0, "floor", 0, "#0000006e")
    }
    /*this.addMapObjects(200, 100as, 9500, 9500)
    this.addMapObjects(100, 500, 9700, 9500)
    this.addMapObjects(200, 400, 8900, 9500)
    this.addGameObjects(10, 10, 9200, 9500, 1, "light", 0, true)
    this.addGameObjects(100, 100, 9500, 9700, 1, "obj") //usual boundary
    this.addGameObjects(100, 100, 9300, 9500, 0, "plate", (obj) => {//set constraints
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      obj.active = this.areaTrigger(this.player.x, this.player.y, area)
      //if(obj.active) this.addGameObjects(100, 100, 9300, 9700, 1)
    }) // pressure plate */
  }
  renderMapObjects(renderer, layers) { // obj map 
    if (layers == "sides" && false) { //make it 3d i guess (beta)
      this.mapObjects.forEach(function (e) { renderer.draw3d(e.width, e.height, e.x, e.y, 1); })
      this.gameObjects.forEach(function (e) { renderer.draw3d(e.width, e.height, e.x, e.y, e.zIndex); })
    } else if (layers == "shadow" && this.objShadow) { //render shadow
      this.mapObjects.forEach(function (e) { renderer.drawShadows(e.width, e.height, e.x, e.y, 1); })
      this.gameObjects.forEach(function (e) { renderer.drawShadows(e.width, e.height, e.x, e.y, e.zIndex); })
    } else {
      this.mapObjects.forEach(function (e) {
        renderer.createObstacle(e, e.width, e.height, e.x, e.y, "map", e.img);
      })
      this.gameObjects.forEach(function (e) {
        if (layers == e.zIndex) renderer.createObstacle(e, e.width, e.height, e.x, e.y, e.type || "obj", e.active, e.zIndex);
      })
      this.depthObjects.forEach(function (e) {
        if (layers == 0) renderer.drawDepth(e);
      })
      this.questItems.forEach(function (e) {
        if (layers == 99) renderer.renderItems(e)
      })
    }
  }
  newNotifs(text, x, y, color, duration = 2000, triggerId = null) {
    if (triggerId) {
      const now = Date.now();
      if (this.lastTriggerTime[triggerId] &&
        now - this.lastTriggerTime[triggerId] < duration) {
        return;
      }
      this.lastTriggerTime[triggerId] = now;
    }
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
    this.currentNotification = {
      text: text,
      x: x,
      y: y,
      color: color,
      createdAt: Date.now(),
      duration: duration,
      opacity: 1,
      scale: 1,
      targetScale: 1.2,
      finalScale: 1.0,
      yOffset: 20
    };
    this.notificationTimer = setTimeout(() => {
      this.currentNotification = null;
      this.notificationTimer = null;
    }, duration);
  }
  renderNotifs(renderer) {
    if (!this.currentNotification) return;
    const inst = this.currentNotification;
    const elapsed = Date.now() - inst.createdAt;
    const progress = elapsed / inst.duration;
    if (progress > 0.8) {
      inst.opacity = 1 - (progress - 0.8) / 0.2;
    } else {
      inst.opacity = 1;
    }
    if (inst.opacity > 0) {
      renderer.renderNotif(inst);
    }
  }

  areaTrigger(x, area) {
    const halfWidth = x ? x.width / 2 : x.scale;
    const halfHeight = x ? x.height / 2 : x.scale;
    const minX = Math.min(area.x, area.x2);
    const maxX = Math.max(area.x, area.x2);
    const minY = Math.min(area.y, area.y2);
    const maxY = Math.max(area.y, area.y2);

    return (
      x.x + halfWidth >= minX && x.x - halfWidth <= maxX &&
      x.y + halfHeight >= minY && x.y - halfHeight <= maxY
    );
  }

  collisions(x, y, scale) { //manage collisions with player
    //console.log(x, y, scale)
    // returns [x limit, y limit]
    let cx = true, cy = true
    const halfWidth = this.player ? this.player.width / 2 : scale;
    const halfHeight = this.player ? this.player.height / 2 : scale;
    for (let i = 0; i < this.mapObjects.length; i++) {
      let obj = this.mapObjects[i]
      if ((x > obj.x + obj.width && x - halfWidth < obj.x + obj.width && y + halfHeight > obj.y && y - halfHeight < obj.y + obj.height) ||
        (x < obj.x && x + halfWidth > obj.x && y + halfHeight > obj.y && y - halfHeight < obj.y + obj.height)) {
        cx = false
      }
      if ((y > obj.y + obj.height && y - halfHeight < obj.y + obj.height && x + halfWidth > obj.x && x - halfWidth < obj.x + obj.width) ||
        (y < obj.y && y + halfHeight > obj.y && x + halfWidth > obj.x && x - halfWidth < obj.x + obj.width)) {
        cy = false
      }
    }
    for (let i = 0; i < this.gameObjects.length; i++) {
      let obj = this.gameObjects[i]
      if ((x > obj.x + obj.width && x - halfWidth < obj.x + obj.width && y + halfHeight > obj.y && y - halfHeight < obj.y + obj.height && obj.zIndex > 0) ||
        (x < obj.x && x + halfWidth > obj.x && y + halfHeight > obj.y && y - halfHeight < obj.y + obj.height && obj.zIndex > 0)) {
        cx = false
      }
      if ((y > obj.y + obj.height && y - halfHeight < obj.y + obj.height && x + halfWidth > obj.x && x - halfWidth < obj.x + obj.width && obj.zIndex > 0) ||
        (y < obj.y && y + halfHeight > obj.y && x + halfWidth > obj.x && x - halfWidth < obj.x + obj.width && obj.zIndex > 0)) {
        cy = false
      }
    }
    for (let i = 0; i < this.depthObjects.length; i++) {
      let obj = this.depthObjects[i]

      // Check if player is overlapping with the object
      const overlapX = x + halfWidth > obj.x && x - halfWidth < obj.x + obj.width;
      const overlapY = y + halfHeight > obj.y && y - halfHeight < obj.y + obj.height;

      if (overlapX && overlapY) {
        // Check if player's bottom is below the box's bottom
        const playerBottom = y + halfHeight;
        const boxBottom = obj.y + obj.height;
        const isBelowBoxBottom = playerBottom >= boxBottom;

        // X collision: Only block if player is NOT below the box bottom
        if (!isBelowBoxBottom) {
          cx = false; // Block X movement (can't go through sides)
        }
        // If isBelowBoxBottom is true, we allow X movement (player can walk under)

        // Y collision: Only block if player is above the box bottom
        // This allows the player to move up through the box when below it
        if (!isBelowBoxBottom) {
          cy = false; // Block Y movement (can't go up/down through sides)
        }
        // If isBelowBoxBottom is true, we allow Y movement (player can move up through)
      }
    }
    return [cx, cy]
  }
  manageGameObjects() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      let obj = this.gameObjects[i]
      if (obj.callback && typeof obj.callback === "function") {
        obj.callback(obj)
      }
    }
    for (let i = 0; i < this.questItems.length; i++) {
      let obj = this.questItems[i]
      if (obj.callback && typeof obj.callback === "function") {
        obj.callback(obj)
      }
    }
  }
  teleport(x, y, t) {
    t.x = x
    t.y = y
  }
  doUpdate() {
    this.now = Date.now();
    this.delta = this.now - this.lastUpdate;
    this.lastUpdate = this.now;
    if (this.player && !this.camInterrupt) {
      this.camX += (this.player.x - this.camX) * this.camLerp;
      this.camY += (this.player.y - this.camY) * this.camLerp;
    } else {
      this.camX = 0;
      this.camY = 0;
    }
    var xOffset = this.camX - this.maxScreenWidth / 2;
    var yOffset = this.camY - this.maxScreenHeight / 2;
    let renderer = new Render(
      this.canvas,
      this.ctx,
      this.delta,
      this.camX,
      this.camY,
      xOffset,
      yOffset,
      this.player?.x || 0,
      this.player?.y || 0,
      this.lumine
    );
    //update / render for each state
    renderer.clearCanvas(this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-xOffset, -yOffset);
    renderer.drawGrids(); // map reference grids
    this.renderMapObjects(renderer, "sides")
    this.renderMapObjects(renderer, 0); // pressure plates
    this.renderMapObjects(renderer, "shadow")
    this.player?.draw(this.ctx);
    this.renderMapObjects(renderer, 1); //players & objects
    this.renderMapObjects(renderer, 2); //z-index > 1, platforms
    this.renderMapObjects(renderer, 99);
    this.renderNotifs(renderer)
    this.ctx.restore();

    //.................dark overlay................//
    this.darkCanvas = document.createElement("canvas")
    this.darkCanvas.width = this.screenWidth
    this.darkCanvas.height = this.screenHeight
    this.darkCtx = this.darkCanvas.getContext("2d")

    this.darkCtx.clearRect(0, 0, this.screenWidth, this.screenHeight)

    this.darkCtx.fillStyle = "#040a18b5";
    this.darkCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    //............................................//

    if (this.hasLumine || this.nighttime) {
      this.darkCtx.save();
      this.darkCtx.setTransform(1, 0, 0, 1, 0, 0);
      const radius = 300
      const cx = this.player.x - xOffset;
      const cy = this.player.y - yOffset;
      this.darkCtx.globalCompositeOperation = "destination-out";
      this.rshadow = this.darkCtx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      this.rshadow.addColorStop(0, "rgba(0,0,0,1)")
      //this.rshadow.addColorStop(this.hasLumine?0.50:0.2, "rgba(0,0,0,0.8)")
      this.rshadow.addColorStop(1, "rgba(0,0,0,0)")
      this.darkCtx.fillStyle = this.rshadow;
      this.darkCtx.beginPath();
      this.darkCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.darkCtx.fill();

      this.darkCtx.globalCompositeOperation = "source-over"
      this.darkCtx.restore()
    }
    this.ctx.drawImage(this.darkCanvas, 0, 0)
    this.player?.movePlayer(this.ctx, this.movekeys, this.keys, this.collisions.bind(this));
    this.rtick += 1;
    this.rtick % 20 == 0 && this.updateGame();
    requestAnimationFrame(this.doUpdate.bind(this));
  }
  keyDown(e) {
    let k = e.keyCode || e.key;
    if (!this.keys[k]) {
      this.keys[k] = !0;
      if (this.movekeys[k]) {
        this.moving = true;
        this.player.movePlayer(this.ctx, this.movekeys, this.keys, this.collisions.bind(this));
      } else if (k == 27 && !gameStopped) {
        fsm.push(new Pause())
      } else if (k == 16) {
        this.player.sprinting = true;
      }
    }
  }
  keyUp(e) {
    let k = e.keyCode || e.key;
    if (this.keys[k]) {
      this.keys[k] = !1;
      if (this.movekeys[k]) {
        this.moving = false;
        this.player.movePlayer(this.ctx, this.movekeys, this.keys, this.collisions.bind(this));
      } else if (k == 16) {
        this.player.sprinting = false;
      }
    }
  }
  mousedown({ clientX: x, clientY: y, button }) {
    if (button == 0) {
      this.showing = true;
      this.anchorX = x;
      this.anchorY = y;
      this.wheel.style.setProperty('--x', `${x}px`);
      this.wheel.style.setProperty('--y', `${y}px`);
      this.wheel.classList.add('on');
    }
  }
  mouseup({ clientX: x, clientY: y }) {
    this.showing = false;
    let index = this.wheel.getAttribute('data-chosen')
    console.log(index)
    this.wheel.setAttribute('data-chosen', 0);
    this.wheel.classList.remove('on');
  }
  mousemove({ clientX: x, clientY: y }) {
    if (!this.showing) return;
    let dx = x - this.anchorX;
    let dy = y - this.anchorY;
    let mag = Math.sqrt(dx * dx + dy * dy);
    let index = 0;

    if (mag >= 100) {
      let deg = Math.atan2(dy, dx) + 0.5 * Math.PI;
      while (deg < 0) deg += Math.PI * 2;
      index = Math.floor((deg / Math.PI * 2) * 2) + 1;
    }

    this.wheel.setAttribute('data-chosen', index);
  }
  resize() {
    let sw = window.innerWidth;
    let sh = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    var scaleFillNative =
      Math.max(sw / modules.maxScreenWidth, sh / modules.maxScreenHeight) *
      (window.devicePixelRatio || 1);
    this.canvas.width = sw * (dpr);
    this.canvas.height = sh * (dpr);
    this.canvas.style.width = sw + "px";
    this.canvas.style.height = sh + "px";
    this.ctx.setTransform(
      scaleFillNative,
      0,
      0,
      scaleFillNative,
      (sw * (dpr) -
        modules.maxScreenWidth * scaleFillNative) /
      2,
      (sh * (dpr) -
        modules.maxScreenHeight * scaleFillNative) /
      2
    );
    this.screenWidth = sw * dpr;
    this.screenHeight = sh * dpr;
    this.rshadow = null;
    this.resize = this.resize.bind(this);
  }
  init() {
    // init canvas
    this.resize();
    this.newPlayer();
    this.newMap();
    this.doUpdate();
    setInterval(this.updateGame.bind(this), 1000 / 60);
  }

  newPlayer() {
    let x = 7200,
      y = 7400;
    this.player = new Player(x, y);
    this.camX = x;
    this.camY = y;
    fsm.push(new this.getoutoftheroom())
  }
  updateGame() {
    // 20 times slower than monitor hz -> the better ur monitor is the better u are :sob:
    this.tick++;
    fsm.update();
    if (this.player) {
      this.player.dir;
      this.player.x2;
      this.player.y2;
    }
    this.manageGameObjects()
    this.player.laststamina = this.player.stamina
    document.querySelector(".stamina").style.width = Math.round((this.player.stamina / 250) * 100) + "%"
    if (this.player.sprinting && this.player.stamina) {
      this.player.stamina = Math.max(this.player.stamina - 4, 0)
      this.player.speed = 10 / 2
    } else {
      this.player.speed = 5 / 2
      this.player.stamina = this.holdstamina ? 0 : Math.min(this.player.stamina + 0.2, 250)
    }
    //prevents holding sprint when no stamina bypasses no sprint limits
    if (this.player.laststamina > 0 && this.player.stamina == 0 && this.holdstamina == false) {
      this.holdstamina = true; // raises the flag
      console.log(1)
      setTimeout(() => {
        this.holdstamina = false;
      }, 1000)
    }
    this.hasLumine = attributes.inventory.indexOf(attributes.lighter.tag) == -1 ? 0 : 1
  }
}
window.addEventListener("DOMContentLoaded", () => {
  var game = new loop(canvas, canvas.getContext("2d"));
  game.init();
  window.addEventListener("resize", modules.checkTrusted(game.resize));
  window.addEventListener("keydown", modules.checkTrusted(game.keyDown.bind(game)));
  window.addEventListener("keyup", modules.checkTrusted(game.keyUp.bind(game)));
  window.addEventListener("mousedown", modules.checkTrusted(game.mousedown.bind(game)))
  window.addEventListener("mouseup", modules.checkTrusted(game.mouseup.bind(game)))
  window.addEventListener("mousemove", modules.checkTrusted(game.mousemove.bind(game)))
  window.addEventListener("contextmenu", (event) => { event.preventDefault() })
});
