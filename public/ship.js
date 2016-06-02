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

  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = sim.coordinateToCell(this.state.x, this.state.y);

  this.getRemoteState = function(){
    return sim.remote.getRemoteStates()[uid];
  };

  // Scale of the ship ?
  this.scale = 1;

  this.cannon = new Cannon.Class(this, onDrawCannon);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

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

  this.onDraw = onDraw;
}

var shipBaseWidth = 90;
var shipBaseHeight = 40;

exports.Class = Ship;
exports.shipBaseWidth = shipBaseWidth;
exports.shipBaseHeight = shipBaseHeight;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
