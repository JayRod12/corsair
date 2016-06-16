//NEW
var loadGraphics = false;
var server;
if (typeof exports === 'undefined'){
  loadGraphics = true;
  //  Browser
  var ship_image1 = new Image();
  ship_image1.src = "../media/ship1.png";
  var ship_image2 = new Image();
  ship_image2.src = "../media/ship2.png";	
  var symimage = new Image();
  symimage.src = "../media/symship.png";
  var ship_frames = [ship_image1, ship_image2];
  server = false;
  //TODO: (if necessary), make this an array so we can display different frames
	//at different times
  animationFrameTime = 10;
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
  Treasure = require('../public/treasure.js');
  Loot = require('../public/loot.js');
  server = true;
}

(function(exports){

var valueToScale = 1/10000;

//  Inputfunction determines updates to the ship
//  onDraw can be null
function Ship(sim, state, uid, name, inputFunction){

  // Simulation in which the ship is.
  this.sim = sim;
  this.uid = uid;
  this.name = name;
  this.isLocalShip = false;

  this.speed_cap = 0.4;
  this.gold = 0;
  this.maxhp = 100;
  this.hp = this.maxhp;

  this.scale = 1.5;
  this.targetScale = this.scale;
  this.growthRate = 0;
  this.hypotenuse = Math.sqrt(this.scale*this.scale * shipHitWidth*shipHitWidth 
                            + this.scale*this.scale * shipHitHeight*shipHitHeight);
 
  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.collided_basetime = 400;

  this.collided_timer = 0;

  this.getRemoteState = function(){
    return sim.remote.getRemoteStates()[this.uid];
  };


  this.cannon = new Cannon.Class(this);
  this.inputFunction = inputFunction;


  this.inputBuffer = [];

  //  Pre: assumes existance of inputBuffer
  //  Called in context of local ship
  this.setStateAdvance = function(state, delta, starttime){
    var time = starttime;
    this.state = state;
    var timestep = 1000/60;
    debugger;
    for (;;){
      delta -= timestep;
      //this.onTick(timestep + ((delta > 0) ? 0 : delta));
      //  Ternary operator makes it unintelligible?.

      // TODO Set input based on buffer here
      if (this.inputBuffer.length > 0){
        var i = Utils.getClosestValueIndex(this.inputBuffer, time, function(x){return
            x.time;});
        this.state.angle = this.inputBuffer[i].angle;
        this.state.speed = this.inputBuffer[i].speed;
      }
        

      if (delta > 0){
        this.onTick(timestep);
      }
      else{
        this.onTick(delta+timestep);
        break;
      }

      // TODO Do collision checking here

      time += timestep;
    }

    //  TODO is this right?
    this.inputBuffer.splice(0,1);
  }

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    //  TODO might cause 'ghost ships', player removed on local simulation
    //  but stille exists on server
    if ((!this.robot && typeof remoteState == "undefined") || this.hp <= 0){
      if (server){// && this.hp <= 0){
        console.log('spawning loot');
        this.spawnLoot();
      }
      this.cell.removeObject(this);
      return;
   }

    //  TODO better interpolation
      /*
    if (!this.isLocalShip && remoteState) {
      this.state.x = remoteState.x;
      this.state.y = remoteState.y;

    } else if (this.isLocalShip && remoteState){
      this.state.x = (this.state.x + remoteState.x) / 2
      this.state.y = (this.state.y + remoteState.y) / 2
    }
    */

    //  Updates speed and angle
    this.inputFunction();

    this.state.speed = Math.min(this.state.speed, this.speed_cap);
    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;



    Game.updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

    // scale update
    if (this.scale < this.targetScale) {
      this.updateScale();
    }

    if (/*Math.floor(Math.random() * 4) == 0 &&*/ !server){
      var w = this.scale * 8;
      var h = this.scale * 16;
      var ox = this.scale * shipDrawWidth/8 * Math.cos(this.state.angle +
          Math.PI / 2);
      var oy = this.scale * shipDrawWidth/8 * Math.sin(this.state.angle +
          Math.PI / 2);
      var wake = new Wake(this.sim, this.state.x + ox, this.state.y + oy,
          this.state.angle, w, h);
      if (wake.cell) wake.cell.addObject(wake, 0.2);
      var px = this.scale * shipDrawWidth/8 * Math.cos(this.state.angle -
          Math.PI / 2);
      var py = this.scale * shipDrawWidth/8 * Math.sin(this.state.angle -
          Math.PI / 2);
      wake = new Wake(this.sim, this.state.x + px, this.state.y + py,
          this.state.angle, w, h);
      if (wake.cell) wake.cell.addObject(wake, 0.2);
    }

  }

  this.collisionHandler = function(other_object) {
	  /*TODO: different cases (possibly) i.e. what if 
  		it's a cannonball I've collided with?*/

    var shipUpdate = false;

    if (other_object.type == "island") {
      this.cell.removeObject(this);
    }
    if (other_object.type == "ship") {
      if (server){
        this.hp -= other_object.hp*0.05;
        shipUpdate = true;
      }
    }

    if (other_object.type == "cannonball"){
      if (other_object.uid === this.uid) return;
      if (typeof other_object.level !== "undefined"){
        if (server){
          this.hp -= other_object.level*2;
          shipUpdate = true;
        }
        else{
          SFX.playImpact();
          for (var k = 0; k < 4; k++){
            var angle_spread = Math.PI/4;
            var minspeed = 0.04;
            var maxspeed = 0.05;
            var sizemin = 6;
            var sizemax = 17;
            var angleVelMin = -0.1;
            var angleVelMax = 0.1;

            var other_angle = Math.PI + Math.atan2(other_object.yvel, other_object.xvel);
            //createSplinter(thi.state.x, this.state.y, other_angle);
            var angle = Utils.randBetween(-angle_spread/2, angle_spread/2) +
              other_angle;
            var time = 90;
            var speed = Utils.randBetween(minspeed, maxspeed);
            var xvel = speed * Math.cos(angle);
            var yvel = speed * Math.sin(angle);
            var width = Utils.randBetween(sizemin, sizemax);
            var height = Utils.randBetween(sizemin, sizemax);
            var angleVel = Utils.randBetween(angleVelMin, angleVelMax);
            var s = new Splinter(this.sim, other_object.x, other_object.y, xvel,
                yvel, angleVel, width, height, time);
            if (s.cell) s.cell.addObject(s);
          }
        for (var k = 0; k < 2; k++){
            var angle_spread = Math.PI/4;
            var sizemin = 20;
            var sizemax = 60;
            var angleVelMin = -0.1;
            var angleVelMax = 0.1;

            var other_angle = Math.atan2(other_object.yvel, other_object.xvel);
            //createSplinter(thi.state.x, this.state.y, other_angle);
            var angle = Utils.randBetween(-angle_spread/2, angle_spread/2) +
              other_angle;
            var time = 90;
            var speed = 1.5 * Math.sqrt(Utils.sqr(other_object.xvel) +
                Utils.sqr(other_object.yvel));
            var xvel = speed * Math.cos(angle);
            var yvel = speed * Math.sin(angle);
            var width = Utils.randBetween(sizemin, sizemax);
            var height = Utils.randBetween(sizemin, sizemax);
            var angleVel = Utils.randBetween(angleVelMin, angleVelMax);
            var s = new Splinter(this.sim, other_object.x, other_object.y, xvel,
                yvel, angleVel, width, height, time);
            s.cell.addObject(s);

        }
        }
      }
    } else if (other_object.type == "treasure") {
      if (!server) {
        return;
      }
      this.gold += other_object.value;
      this.hp = Math.min(this.maxhp, this.hp + other_object.hp);

      this.sim.remote.setScore(this.uid, this.gold);
      shipUpdate = true;
      this.increaseScale(this.gold);
      var remObj = new Treasure.Class(this.sim, other_object.x, other_object.y,
          other_object.value, other_object.hp);
      var cell = this.sim.coordinateToCell(other_object.x, other_object.y);
      this.cell.addSerializedUpdate('remove_treasure', remObj);
      this.sim.removeTreasure(remObj);
    }
    else if (other_object.type == "loot") {
      this.gold += other_object.value;
      this.sim.remote.setScore(this.uid, this.gold);
      shipUpdate = true;
      this.increaseScale(this.gold);
      var cell = this.sim.coordinateToCell(other_object.x, other_object.y);
      var lootRem = new Loot.Class(this.sim, other_object.x, other_object.y,
          other_object.value);
      this.cell.addSerializedUpdate('remove_object', lootRem);
      this.cell.removeObject(lootRem);
    }

    if (server && shipUpdate){

      var ship_update = {
        uid : this.uid
      , gold : this.gold
      , hp : this.hp
      , scale : this.scale
      };
      this.cell.addNonSerialUpdate('ship_update', ship_update); 
    }

   this.collided_timer = this.collided_basetime;
   //decrement health & handle physics;
  }

  this.default_colour = "black";

  this.animationFrame = 0;
  this.animationFrameElapse = 0;

  this.increaseScale = function(scale_increase) {
    scale_increase *= valueToScale;
    this.targetScale = this.scale + scale_increase;
    this.growthRate = scale_increase / 100;
  }

  this.updateScale = function() {
    this.scale += this.growthRate;
    this.hypotenuse = Math.sqrt(this.scale * this.scale * shipHitWidth*shipHitWidth 
                              + this.scale * this.scale * shipHitHeight*shipHitHeight);
  }

  this.onDraw = function(ctx){
	this.cannon.onDraw();
	var drawWidth = shipDrawWidth * this.scale;
    var drawHeight = shipDrawHeight * this.scale;
	var hitWidth = shipHitWidth * this.scale;
	var hitHeight = shipHitHeight * this.scale;

    //We translate to the origin of our ship
    ctx.translate(this.state.x, this.state.y);

    //We rotate around this origin 
    ctx.rotate(this.state.angle);

      //Draw the ship's hitbox under it
    //(the fillRect function draws from the topmost left corner of the rectangle 
    /*if(this.collided_timer > 0) {
        ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = "pink";
    }
     ctx.fillRect(-hitWidth/2, -hitHeight/2, hitWidth, hitHeight);*/

    //ctx.drawImage(ship_frames[this.animationFrame], -width/2, -height/2, width, height);
	ctx.drawImage(symimage, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
    if (this.wait < 50) {
    } else {
     // ctx.drawImage(ship_image2, -width/2, -height/2, width, height);
    }

    this.animationFrameElapse += 1;
    if (this.animationFrameElapse > animationFrameTime){
      this.animationFrameElapse = 0;
      this.animationFrame = (this.animationFrame + 1 ) % ship_frames.length;
    }

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);

    var hp_len = 80;
    var hp_height = 8;
    ctx.translate(-hp_len/2, -hp_height/2-50);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, hp_len, hp_height); 
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, hp_len * this.hp/100, hp_height); 
    ctx.translate(hp_len/2, hp_height/2+50);

    ctx.translate(-this.state.x, -this.state.y);

    // Ship name
    if (tutgame !== null && typeof tutgame !== "undefined"){
      if (tutgame.alpha === tutgame.alpha_start){
        ctx.globalAlpha = 0;
      }
      else{
        ctx.globalAlpha = 1-(tutgame.alpha)/tutgame.alpha_start;
      }
    }
    ctx.fillStyle = "white";
    ctx.font =  drawWidth/11 + "px Josefin Sans";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(this.name);
    var textWidth = metrics.width;
    ctx.fillText(this.name, this.state.x - textWidth/2, this.state.y + drawHeight);
    ctx.globalAlpha = 1;
  }

  if (server){
  this.spawnLoot = function() {
    var lootDrop = 200 + this.gold/2;

    var loots_to_drop = 3 + this.gold/100;

    var value = Math.floor(lootDrop / loots_to_drop);

    var lootDisperseRadMax = shipDrawWidth * this.scale / 4;
    var lootDisperseRadMin = shipDrawWidth * this.scale / 8;
    for (var i = 0; i < Loot.lootPerScale * this.scale; i++) {
      var rad = lootDisperseRadMin + (lootDisperseRadMax - 
          lootDisperseRadMin) *
        Math.random();
      var angle = 2 * Math.PI * Math.random();

      var x = this.state.x + rad * Math.cos(angle);
      var y = this.state.y + rad * Math.sin(angle);

      var loot = new Loot.Class(this.sim, x, y, value);
      var cell = this.sim.coordinateToCell(loot.x, loot.y);
      if (cell){
        cell.addObject(loot);
        cell.addSerializedUpdate('create_object', loot);
      }
    }
  }}

  this.getColType = function() {return "rectangle";};
  this.getColCategory = function() {return "dynamic";};
  this.getColObj = function() {
    return {
	    type: "ship",
      x: this.state.x,
      y: this.state.y,
      hp: this.hp,
      width: shipHitWidth * this.scale,
      height: shipHitHeight * this.scale,
      hypotenuse: this.hypotenuse,
      angle: this.state.angle
    }
  };

  this.serialize = function() {
    return { type:"ship"
           , o : { uid: this.uid
                 , name: this.name
                 , state: this.state 
                 , hp : this.hp
                 , scale: this.scale}};
  };

  this.equals = function(o) {
    if (!(o instanceof Ship)){
      return false;
    }
    return this.uid == o.uid;

  }

}

//  TODO inherit from particle class, no idea how to do this in js


function Wake(sim, x, y, angle, width, height){
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.cell = this.sim.coordinateToCell(this.x, this.y);
  this.angle = angle;
  this.width = width;
  this.height = height;
  this.alpha = 0.28;
  this.onTick = function (dt){
    this.alpha -= dt * 1/12000;
    this.height -= dt * this.height / 1000;
    if (this.alpha <= 0) this.cell.removeObject(this);
  }

  this.onDraw = function(ctx){
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = "white";
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 1;
  }
}

/*
var splinterHueMin = 35;
var splinterHueMax = 50;
var splinterSatMin = 35;
var splinterSatMax = 75;
var splinterLightMin = 25;
var splinterLightMax = 93;
*/
var splinterHueMin = 24;
var splinterHueMax = 28;
var splinterSatMin = 30;
var splinterSatMax = 40;
var splinterLightMin = 25;
var splinterLightMax = 32;

function Splinter(sim, x, y, xvel, yvel, angleVel, width, height, time){
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.xvel = xvel;
  this.yvel = yvel;
  this.cell = this.sim.coordinateToCell(this.x, this.y);
  this.angleVel = angleVel;
  this.width = width;
  this.height = height;
  var c_choice = Math.floor(Math.random() * 3);
  if (c_choice == 0){
    var h, s, l;
    h = Math.floor(splinterHueMin + (splinterHueMax - splinterHueMin) *
        Math.random());
    s = Math.floor(splinterSatMin + (splinterSatMax - splinterSatMin) *
        Math.random());
    l = Math.floor(splinterLightMin + (splinterLightMax - splinterLightMin) *
        Math.random());
    this.color = Utils.makeHSL(h, s, l);
  }
  if (c_choice == 1) this.color = "red";
  if (c_choice == 2) this.color = "yellow";
  this.angle = Math.random() * 2 * Math.PI;
  this.alpha = 1;
  this.time = time;
  this.onTick = function (dt){
    this.x += this.xvel * dt;
    this.y += this.yvel * dt;
    if (this.time > 0) this.time -= dt;
    else this.alpha -= dt * 1/400;
    this.angle += this.angleVel * dt;
    if (this.alpha <= 0) this.cell.removeObject(this);
    else Game.updateCell(this.sim, this, this.x, this.y);
  }

  this.onDraw = function(ctx){
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 1;
  }
}

var shipDrawWidth = 112.5;
var shipDrawHeight = 60.5;
var shipHitWidth = 70;
var shipHitHeight = 28;

exports.Class = Ship;
exports.shipDrawWidth = shipDrawWidth;
exports.shipDraweHeight = shipDrawHeight;
exports.shipHitWidth = shipHitWidth;
exports.shipHitHeight = shipHitHeight;
exports.Wake= Wake;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
