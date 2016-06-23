var Ship;
if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Ship = require('../public/ship.js');
  Sim = require('../public/sim.js');
  Serializer = require('../public/serializer.js');
}

(function(exports){


var server;

const width = 1000;
const height = 1000;


function createServerShipInput(id){
  return function(dt){
    //  TODO lerp the angle, speed
    var remoteState = this.getRemoteState();
    this.state.angle = remoteState.angle;
    this.state.speed = remoteState.speed;
  };
}

function Remote(){
  console.log("Game initiated.");
  this.remoteStates = {};
  this.playerNames = {};
  this.UIDtoScores = {};
}

Remote.prototype.newPlayer = function(id, name, state) {
  this.remoteStates[id] = state;
  this.playerNames[id] = name;
  console.log('Adding player: ' + name);
}

Remote.prototype.removePlayer = function(id) {
  console.log('Removing player: ' + this.playerNames[id] + ' ' + id);
  delete this.remoteStates[id];
  delete this.playerNames[id];
  delete this.UIDtoScores[id];
  // MAYBE sim.removeShip TODO?
}

Remote.prototype.updatePlayer = function(id, state){
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

Remote.prototype.getPlayers = function() {
  return this.remoteStates;
}

Remote.prototype.getRemoteStates = function() {
  return this.remoteStates;
}

Remote.prototype.getPlayerNames = function() {
  return this.playerNames;
}
Remote.prototype.getPlayerName = function(uid) {
  return this.playerNames[uid];
}

Remote.prototype.getUIDtoScores = function() {
  return this.UIDtoScores;
}

Remote.prototype.setScore = function(uid, score) {
  this.UIDtoScores[uid] = score;
}
Remote.prototype.getScore = function(uid) {
  return this.UIDtoScores[uid];
}

exports.width = width;
exports.height = height;

exports.Remote = Remote;

exports.createServerShipInput = createServerShipInput;
exports.updateCell = Sim.updateCell;
exports.Sim = Sim;
exports.Serializer = Serializer.Class;

})(typeof exports == 'undefined' ? this.Game = {} : exports);
