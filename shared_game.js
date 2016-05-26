const width = 1000;
const height = 1000;

var players;

function Player(x, y){
  this.x = x;
  this.y = y;
  this.speed = 0;
  this.angle = 0;
}

exports.initializeGame = function() {
  players = {};
}

exports.newPlayer = function(id) {
  players[id] = new Player(0,0);
}

exports.deletePlayer = function(id) {
  delete players[id];
}

exports.updatePlayer = function (data) {
  if (!players[data.userid]) {
    console.log('shared_game.js :: update of unknown userid');
  }

  players[data.userid] = {x : data.x, y : data.y, speed : data.speed,
    angle : data.angle};
}

exports.getPlayers = function() {
  return players;
}

