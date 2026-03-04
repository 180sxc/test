/*
main js -> main storyline runners
-  storyline detection & state execution
-  state detection / event execution 
-  kept simple & easy for this
*/
import { byID, byCN, qsa, qs } from "/tools/dom.js";
import { canvas, ls } from "/tools/dom.js";
import { Render } from "/render.js";
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
var gameStopped = false;

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
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = 5;
    this.scale = 25;
    this.sprinting = false;
    this.stamina = 250;
    this.laststamina = 0;
    //-------------------------------------//
    this.lastMoveDir = void 0;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.scale, this.y - this.scale, this.width, this.height);
  }
  boundaryX(x, boundaries) {
    if (
      x + this.scale >= boundaries[1] == true ||
      x - this.scale <= boundaries[0] == true
    ) {
      return false;
    }
    return true;
  }
  boundaryY(y, boundaries) {
    if (
      y + this.scale >= boundaries[1] == true ||
      y - this.scale <= boundaries[0] == true
    ) {
      return false;
    }
    return true;
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
    this.holdstamina = false;
    this.showing = void 0;
    this.anchorX = void 0;
    this.anchorY = void 0;
    this.wheel = document.querySelector('.wheel');
  }
  addMapObjects(width, height, x, y, type) { //type = map boundaries
    this.mapObjectsId++;
    this.mapObjects.push({
      width: width,
      height: height,
      x: x,
      y: y,
      id: this.mapObjectsId,
    })
  }
  addGameObjects(width, height, x, y, zIndex, type, callback = void 0) {
    this.gameObjectsID++;
    this.gameObjects.push({
      width: width,
      height: height,
      active: false,
      x: x,
      y: y,
      zIndex: zIndex,
      id: this.gameObjectsID,
      type: type,
      callback: callback
    })
  }
  newMap() {
    this.addMapObjects(200, 100, 9500, 9500)
    this.addMapObjects(100, 500, 9700, 9500)
    this.addGameObjects(100, 100, 9500, 9700, 1, "obj") //usual boundary
    this.addGameObjects(100, 100, 9300, 9500, 0, "plate", (obj) => {//set constraints
      const area = { x: obj.x, y: obj.y, x2: obj.x + obj.width, y2: obj.y + obj.height }
      obj.active = this.areaTrigger(this.player.x, this.player.y, area)
      //if(obj.active) this.addGameObjects(100, 100, 9300, 9700, 1)
    }) // pressure plate
  }
  renderMapObjects(renderer, layers) { // obj map 
    if (layers == "shadow") {
      this.mapObjects.forEach(function (e) {
        renderer.drawShadows(e.width, e.height, e.x, e.y, 1);
      })
      this.gameObjects.forEach(function (e) {
        renderer.drawShadows(e.width, e.height, e.x, e.y, e.zIndex);
      })
    } else {
      this.mapObjects.forEach(function (e) {
        renderer.createObstacle(e.width, e.height, e.x, e.y, "map");
      })
      this.gameObjects.forEach(function (e) {
        if (layers == e.zIndex) renderer.createObstacle(e.width, e.height, e.x, e.y, e.type || "obj", e.active, e.zIndex);
      })
    }
  }
  areaTrigger(px, py, area) {
    const minX = Math.min(area.x, area.x2);
    const maxX = Math.max(area.x, area.x2);
    const minY = Math.min(area.y, area.y2);
    const maxY = Math.max(area.y, area.y2);

    return (
      px >= minX && px <= maxX &&
      py >= minY && py <= maxY
    );
  }

  collisions(x, y, scale) { //manage collisions with player
    //console.log(x, y, scale)
    // returns [x limit, y limit]
    let cx = true, cy = true
    for (let i = 0; i < this.mapObjects.length; i++) {
      let obj = this.mapObjects[i]
      if ((x > obj.x + obj.width && x - scale < obj.x + obj.width && y + scale > obj.y && y - scale < obj.y + obj.height) ||
        (x < obj.x && x + scale > obj.x && y + scale > obj.y && y - scale < obj.y + obj.height)) {
        cx = false
      }
      if ((y > obj.y + obj.height && y - scale < obj.y + obj.height && x + scale > obj.x && x - scale < obj.x + obj.width) ||
        (y < obj.y && y + scale > obj.y && x + scale > obj.x && x - scale < obj.x + obj.width)) {
        cy = false
      }
    }
    for (let i = 0; i < this.gameObjects.length; i++) {
      let obj = this.gameObjects[i]
      if ((x > obj.x + obj.width && x - scale < obj.x + obj.width && y + scale > obj.y && y - scale < obj.y + obj.height && obj.zIndex > 0) ||
        (x < obj.x && x + scale > obj.x && y + scale > obj.y && y - scale < obj.y + obj.height && obj.zIndex > 0)) {
        cx = false
      }
      if ((y > obj.y + obj.height && y - scale < obj.y + obj.height && x + scale > obj.x && x - scale < obj.x + obj.width && obj.zIndex > 0) ||
        (y < obj.y && y + scale > obj.y && x + scale > obj.x && x - scale < obj.x + obj.width && obj.zIndex > 0)) {
        cy = false
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
      this.player?.y || 0
    );
    //update / render for each state
    renderer.clearCanvas(this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-xOffset, -yOffset);
    renderer.drawGrids(); // map reference grids
    this.renderMapObjects(renderer, "shadow")
    this.renderMapObjects(renderer, 0); // pressure plates
    this.player?.draw(this.ctx);
    this.renderMapObjects(renderer, 1); //players & objects
    this.renderMapObjects(renderer, 2); //z-index > 1, platforms
    this.ctx.restore();
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
    var scaleFillNative =
      Math.max(sw / modules.maxScreenWidth, sh / modules.maxScreenHeight) *
      (window.devicePixelRatio || 1);
    this.canvas.width = sw * (window.devicePixelRatio || 1);
    this.canvas.height = sh * (window.devicePixelRatio || 1);
    this.canvas.style.width = sw + "px";
    this.canvas.style.height = sh + "px";
    this.ctx.setTransform(
      scaleFillNative,
      0,
      0,
      scaleFillNative,
      (sw * (window.devicePixelRatio || 1) -
        modules.maxScreenWidth * scaleFillNative) /
      2,
      (sh * (window.devicePixelRatio || 1) -
        modules.maxScreenHeight * scaleFillNative) /
      2
    );
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
    let x = 9400,
      y = 9400;
    this.player = new Player(x, y, 50, 50, "red");
    this.camX = x;
    this.camY = y;
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
