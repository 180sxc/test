/*
main js -> main storyline runners
-  storyline detection & state execution
-  state detection / event execution 
-  kept simple & easy for this
*/

import { byID, byCN, qsa, qs } from "/tools/dom.js";
import { canvas,ls } from "/tools/dom.js";
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
function createSave(){

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
  movePlayer(ctx, movekeys, keys) {
    if (stopMovement) return;
    let newmovedir = undefined;
    newmovedir = this.newMoveDir(ctx, movekeys, keys);
    //movement here
    this.x2 = this.x + (isNaN(Math.cos(newmovedir) * this.speed) ? 0 : Math.cos(newmovedir) * this.speed) // calc estimated next coord
    this.y2 = this.y + (isNaN(Math.sin(newmovedir) * this.speed) ? 0 : Math.sin(newmovedir) * this.speed)
    this.x += (!this.boundaryX(this.x2,mapData.boundaries.map)) ? 0 : (isNaN(Math.cos(newmovedir) * this.speed) ? 0 : Math.cos(newmovedir) * this.speed);
    this.y += (!this.boundaryY(this.y2,mapData.boundaries.map)) ? 0 : (isNaN(Math.sin(newmovedir) * this.speed) ? 0 : Math.sin(newmovedir) * this.speed);
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
  enter(data) {} // on state enter
  update(dt) {} // exit conditions here and calls this.stack.requestPop()
  exit() {} // on state exit
}



class FSM {
  constructor(init){
    this.stack = [];
    this.pendingPop = !1;
  }
  push(state, data) {
    this.pendingPop = false;
    state.stack = this;
    this.stack.push(state); //push states to queue
    state.enter(data) //[SUBCLASS METHODS]
  }
  requestPop(){
    console.log(1)
    if(!this.pendingPop)this.pendingPop = !0; //requests pop from ext states
  }
  pop(){
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
  update(dt) {}
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
  }
  renderMapObjects(renderer){ //havent done renderer
    if(this.renderedMap) return
    renderer.createObstacle(200, 100, 9900, 9900)
    this.renderedMap = true;
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
      yOffset
    );
    //update / render for each state
    renderer.clearCanvas();
    this.renderMapObjects(renderer) //set object boundaries etc etc
    this.ctx.save();
    this.ctx.translate(-xOffset, -yOffset);
    renderer.drawGrids();
    this.player?.draw(this.ctx);
    this.ctx.restore();
    this.rtick += 1;
    this.rtick % 20 == 0 && this.updateGame();
    this.player.movePlayer(this.ctx, this.movekeys, this.keys);
    requestAnimationFrame(this.doUpdate.bind(this));
  }
  keyDown(e) {
    let k = e.keyCode || e.key;
    if (!this.keys[k]) {
      this.keys[k] = !0;
      if (this.movekeys[k]) {
        this.moving = true;
        this.player.movePlayer(this.ctx, this.movekeys, this.keys);
      } else if(k == 27 && !gameStopped){
        fsm.push(new Pause())
      } else if(k == 16){
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
        this.player.movePlayer(this.ctx, this.movekeys, this.keys);
      } else if(k == 16){
        this.player.sprinting = false;
      }
    }
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
    this.doUpdate();
    setInterval(this.updateGame.bind(this), 1000 / 60);
  }

  newPlayer() {
    let x = 9900,
      y = 9900;
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
    document.querySelector(".stamina").style.width = Math.round((this.player.stamina / 250) * 100) + "%"
    if(this.player.sprinting && this.player.stamina) {
      this.player.stamina = Math.max(this.player.stamina - 4, 0)
      this.player.speed = 10
    } else {
      this.player.speed = 5
      this.player.stamina = Math.min(this.player.stamina + 0.2, 250)
    }
  }
}
window.addEventListener("DOMContentLoaded", () => {
  var game = new loop(canvas, canvas.getContext("2d"));
  game.init();
  window.addEventListener("resize", modules.checkTrusted(game.resize));
  window.addEventListener("keydown", modules.checkTrusted(game.keyDown.bind(game)));
  window.addEventListener("keyup", modules.checkTrusted(game.keyUp.bind(game)));
});
