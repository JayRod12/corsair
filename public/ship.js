//NEW
var loadGraphics = false;
if (typeof exports === 'undefined'){
  loadGraphics = true;
  //  Browser
  var ship_image1 = new Image();
  ship_image1.src = "../media/ship1.png";
  var ship_image2 = new Image();
  ship_image2.src = "../media/ship2.png";
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
}

(function(exports){

//  Inputfunction determines updates to the ship
//  onDraw can be null
function Ship(sim, state, uid, name, inputFunction){

  // Simulation in which the ship is.
  this.sim = sim;
  this.uid = uid;
  this.name = name;

  this.hp = 100;
  this.speed_cap = 0.8;

  //UPDATE THIS WHEN SCALE IS UPDATED.
  this.hypotenuse = Math.sqrt(shipBaseWidth*shipBaseWidth 
                              + shipBaseHeight*shipBaseHeight);
 
  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.collided_basetime = 400;

  this.collided_timer = 0;

  this.getRemoteState = function(){
    return sim.remote.getRemoteStates()[this.uid];
  };

  // Scale of the ship ?
  this.scale = 1.5;

  this.cannon = new Cannon.Class(this);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    if (typeof remoteState == "undefined" || this.hp < 0){
      if (this.name == "tom"){
        this.hp = 100;
        return;
      }
      sim.removeObject(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

    this.state.speed = Math.min(this.state.speed, this.speed_cap);
    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    if (remoteState){
      this.state.x = (this.state.x + remoteState.x) / 2
      this.state.y = (this.state.y + remoteState.y) / 2
    }
    Game.updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

  }

  this.collisionHandler = function(other_object) {
	  /*TODO: different cases (possibly) i.e. what if 
  		it's a cannonball I've collided with?*/
   //this.colour = "red";
    if (other_object.uid !== "undefined"){
      if (other_object.uid === this.uid) return;
      if (typeof other_object.level !== "undefined"){
        this.hp -= other_object.level;
      }
    }
   this.collided_timer = this.collided_basetime;
   //decrement health & handle physics;
  }

  this.default_colour = "black";

  this.wait = 0;

  this.onDraw = function(ctx){
    var width = shipBaseWidth * this.scale;
    var height = shipBaseHeight * this.scale;

    //We translate to the origin of our ship
    ctx.translate(this.state.x, this.state.y);

    //We rotate around this origin 
    ctx.rotate(this.state.angle);

      //We draw the ship, ensuring that we start drawing from the correct location 
    //(the fillRect function draws from the topmost left corner of the rectangle 
    if(this.collided_timer > 0) {
        ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = this.default_colour;
    }
    // ctx.fillRect(-width/2, -height/2, width, height);
    // ctx.strokeStyle = "#ffc0cb";
    // ctx.strokeRect(-width/2, -height/2, width, height);

    
    if (this.wait < 50) {
      ctx.drawImage(ship_image1, -width/2, -height/2, width, height);
    } else {
      ctx.drawImage(ship_image2, -width/2, -height/2, width, height);
    }

    this.wait = (this.wait + 1) % 100;

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);

    if (this.hp < 99){
      var hp_len = 80;
      var hp_height = 8;
      ctx.translate(-hp_len/2, -hp_height/2-50);
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, hp_len, hp_height); 
      ctx.fillStyle = "green";
      ctx.fillRect(0, 0, hp_len * this.hp/100, hp_height); 
      ctx.translate(hp_len/2, hp_height/2+50);
    }

      ctx.translate(-this.state.x, -this.state.y);

    // Ship name
    ctx.fillStyle = "white";
    ctx.font = "15px Josefin Sans";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(this.name);
    var textWidth = metrics.width;
    ctx.fillText(this.name, this.state.x - textWidth/2, this.state.y);
  }

  this.getColType = function() {return "rectangle"};
  this.getColObj = function() {
    return {
      x: this.state.x,
      y: this.state.y,
      width: shipBaseWidth * this.scale,
      height: shipBaseHeight * this.scale,
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

}

var shipBaseWidth = 144;
var shipBaseHeight = 80;

exports.Class = Ship;
exports.shipBaseWidth = shipBaseWidth;
exports.shipBaseHeight = shipBaseHeight;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
