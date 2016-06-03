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
function Ship(sim, state, uid, inputFunction, onDraw, onDrawCannon){

  // Simulation in which the ship is.
  this.sim = sim;
  this.hp = 100;

  //UPDATE THIS WHEN SCALE IS UPDATED. FUCK YOU GUYS FOR NOT CARING ABOUT ME.
  this.hypotenuse = Math.sqrt(shipBaseWidth*shipBaseWidth 
                              + shipBaseHeight*shipBaseHeight);
 
  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = sim.coordinateToCell(this.state.x, this.state.y);

  this.collided_basetime = 400;

  this.collided_timer = 0;

  this.getRemoteState = function(){
    return sim.remote.getRemoteStates()[uid];
  };

  // Scale of the ship ?
  this.scale = 1;

  this.cannon = new Cannon.Class(this, onDrawCannon);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    //if (typeof remoteState == "undefined" || this.hp < 0){
    if (this.hp < 0){
      sim.removeObject(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

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
    if (other_object.ship !== "undefined"){
      if (other_object.ship === this) return;
    }
   this.collided_timer = this.collided_basetime;
   //decrement health & handle physics;
  }

  this.onDraw = onDraw;

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
}

var shipBaseWidth = 90;
var shipBaseHeight = 40;

exports.Class = Ship;
exports.shipBaseWidth = shipBaseWidth;
exports.shipBaseHeight = shipBaseHeight;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
