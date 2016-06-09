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

  this.speed_cap = 0.8;
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

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    //  TODO might cause 'ghost ships', player removed on local simulation
    //  but stille exists on server
    if (typeof remoteState == "undefined" || this.hp < 0){
      sim.removeObject(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

    this.state.speed = Math.min(this.state.speed, this.speed_cap);
    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    if (!this.isLocalShip && remoteState) {
      this.state.x = remoteState.x;
      this.state.y = remoteState.y;

    } else if (this.isLocalShip && remoteState){
      this.state.x = (this.state.x + remoteState.x) / 2
      this.state.y = (this.state.y + remoteState.y) / 2
    }

    Game.updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

    // scale update
    if (this.scale < this.targetScale) {
      this.updateScale();
    }

  }

  this.collisionHandler = function(other_object) {
	  /*TODO: different cases (possibly) i.e. what if 
  		it's a cannonball I've collided with?*/

    var shipUpdate = false;

    if (other_object instanceof Cannon.CannonBall){
      if (other_object.uid === this.uid) return;
      if (typeof other_object.level !== "undefined"){
        if (server){
          this.hp -= other_object.level;
          shipUpdate = true;
        }
      }
    } else if (other_object instanceof Treasure.Class) {
      if (!server) {
        return;
      }
      this.gold += other_object.value;
      this.hp = Math.min(this.maxhp, this.hp + other_object.hp);

      sim.remote.setScore(this.uid, this.gold);
      shipUpdate = true;
      this.increaseScale(this.gold);
      other_object.cell.addSerializedUpdate('remove_treasure', other_object);
      sim.removeTreasure(other_object);
    }

    if (server && shipUpdate){
      var ship_update = {
        uid : this.uid
      , gold : this.gold
      , hp : this.hp
      };
      other_object.cell.addNonSerialUpdate('ship_update', ship_update); 
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
    ctx.fillStyle = "white";
    ctx.font =  drawWidth/11 + "px Josefin Sans";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(this.name);
    var textWidth = metrics.width;
    ctx.fillText(this.name, this.state.x - textWidth/2, this.state.y + drawHeight);
  }

  this.getColType = function() {return "rectangle";};
  this.getColCategory = function() {return "dynamic";};
  this.getColObj = function() {
    return {
      x: this.state.x,
      y: this.state.y,
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
    return this.uid == o.uid;
    }

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

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
