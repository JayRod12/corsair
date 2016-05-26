var server;

const width = 1000;
const height = 1000;

const shipBaseWidth = 90;
const shipBaseHeight = 40;

var remoteStates;

//  Inputfunction determines updates to the ship
//  onDraw can be null

function Ship(state, remoteState, inputFunction, onDraw){

  //  Should contain:
  //  x, y, angle, speed
  this.state = state;

  this.remoteState = remoteState;

  this.scale = 1;

  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    console.log("shared " + this.remoteState.x);
    //console.log('update');

    //  If player has left the server remove their ship from the sim
    if (typeof this.remoteState == "undefined"){
      sim.removeShip(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    this.state.x = (this.state.x + this.remoteState.x) / 2
    this.state.y = (this.state.y + this.remoteState.y) / 2

    //this.state.x = this.pla
    /*
    if (!server){
      this.state.x = this.remoteState.x;
      this.state.y = this.remoteState.y;
    }
    */
    //console.log (this.remoteState.x - this.state.x);
  }

  this.onDraw = onDraw;
}

function Sim(){

  var gameObjects = [];

  this.tick = function(dt){
    for (var i = 0; i < gameObjects.length; i++){
      gameObjects[i].onTick(dt);
    }
  }

  this.draw = function(dt){
    for (var i = 0; i < gameObjects.length; i++){
      if (typeof gameObjects[i].onDraw != "undefined"){
        gameObjects[i].onDraw();
      }
    }
  }

  this.addShip = function (state, remoteState, inputFunction, onDraw){
    var ship = new Ship(state, remoteState, inputFunction, onDraw);
    gameObjects.push(ship);
    return ship;
  }

  this.removeShip = function (doomed_ship){
    for (var i = 0; i < gameObjects.length; i++){
      if (gameObjects[i] == doomed_ship) {
        gameObjects.splice(i,1);
      }
    }
  }

}

function createServerShipInput(id){
  return function(){
    this.state.angle = this.remoteState.angle;
    this.state.speed = this.remoteState.speed;
  }
}
    

/*
function CorsairState(sim){

  //  Holds a simulation and a hashmap of players at their most 
  this.sim = sim;
  this.players = {};

  this.newPlayer(id, x, y){
    //players[id];
    players[id] = {x: x, y: y, obj: sim.addShip(x,y,};
  }

}
*/

function initializeGame(){
  console.log("game inited");
  remoteStates = {};
}

function newPlayer(id, state) {
  remoteStates[id] = state;
  console.log('newplayer' + id + " " + remoteStates[id].x);
}

function removePlayer(id) {
  delete remoteStates[id];
  console.log('remplayer');
}

function updatePlayer(id, state){
  if (!remoteStates[id]) {
    console.log('shared_game.js :: update of unknown userid ' + id);
  }
//  remoteStates[id] = state;
  remoteStates[id] = {
    x: state.x,
    y: state.y,
    angle: state.angle,
    speed: state.speed,
  }
}

function getPlayers() {
  return remoteStates;
}


//  Nodejs exports for use in server
//var exports = module.exports = {};

exports.width = width;
exports.height = height;

exports.initializeGame = initializeGame;
exports.newPlayer = newPlayer;
exports.removePlayer = removePlayer;
exports.updatePlayer = updatePlayer;
exports.getPlayers = getPlayers;

exports.createServerShipInput = createServerShipInput;
exports.Sim = Sim;
