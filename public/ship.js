if (typeof exports === 'undefined'){
  //  Browser
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

  //UPDATE THIS WHEN SCALE IS UPDATED. FUCK YOU GUYS FOR NOT CARING ABOUT ME.
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
  this.scale = 1;

  this.cannon = new Cannon.Class(this);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    if (typeof remoteState == "undefined"){
      sim.removeObject(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    this.state.x = (this.state.x + remoteState.x) / 2
    this.state.y = (this.state.y + remoteState.y) / 2
    Game.updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

  }

  this.collisionHandler = function(other_object) {
	  /*TODO: different cases (possibly) i.e. what if 
  		it's a cannonball I've collided with?*/
   //this.colour = "red";
   this.collided_timer = this.collided_basetime;
   //decrement health & handle physics;
  }

  this.default_colour = "black";
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
    ctx.fillRect(-width/2, -height/2, width, height);
    ctx.strokeStyle = "#ffc0cb";
    ctx.strokeRect(-width/2, -height/2, width, height);
  
    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);
    ctx.translate(-this.state.x, -this.state.y);
  
    // Ship name
    ctx.fillStyle = "white";
    ctx.font = "5px Courier";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(this.name);
    var textWidth = metrics.width;
    ctx.fillText(this.name, this.state.x - textWidth/2, this.state.y);
  }

  this.getColType = function(){return "rectangle"};
  this.getColObj = function(){
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
                 , state: this.state }};
  };

}

var shipBaseWidth = 90;
var shipBaseHeight = 40;

exports.Class = Ship;
exports.shipBaseWidth = shipBaseWidth;
exports.shipBaseHeight = shipBaseHeight;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
