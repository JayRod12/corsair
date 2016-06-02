var Ship;
if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Ship = require('../public/ship.js');
  Sim = require('../public/sim.js');
}

(function(exports){


var server;

const width = 1000;
const height = 1000;

function createServerShipInput(id){
  return function(){
    var remoteState = this.getRemoteState();
    this.state.angle = remoteState.angle;
    this.state.speed = remoteState.speed;
  };
}

function Remote(){
  console.log("game inited");
  this.remoteStates = {};
  this.playerNames = {};

  this.newPlayer = function(id, name, state) {
    this.remoteStates[id] = state;
    this.playerNames[id] = name;
    console.log('Adding player: ' + name);
  }

  this.removePlayer = function(id) {
    console.log('Removing player: ' + this.playerNames[id] + ' ' + id);
    delete this.remoteStates[id];
    delete this.playerNames[id];
  }

  this.updatePlayer = function(id, state){
    if (!this.remoteStates[id]) {
      console.log('shared_game.js :: update of unknown userid ' + id);
    }
  //  remoteStates[id] = state;
    this.remoteStates[id] = {
      x: state.x,
      y: state.y,
      angle: state.angle,
      speed: state.speed,
    }
  }

  this.getPlayers = function() {
    return this.remoteStates;
  }

  this.getRemoteStates = function() {
    return this.remoteStates;
  }

  this.getPlayerNames = function() {
    return this.playerNames;
  }
}

exports.width = width;
exports.height = height;

exports.Remote = Remote;

exports.createServerShipInput = createServerShipInput;
exports.updateCell = Sim.updateCell;
exports.Sim = Sim.Class;

})(typeof exports == 'undefined' ? this.Game = {} : exports);
