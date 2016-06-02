var Ship;
if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Ship = require('../public/ship.js');
}

(function(exports){


var server;

const width = 1000;
const height = 1000;


function Treasure(xTreasure, yTreasure, onDraw) {
    this.xTreasure = xTreasure;
    this.yTreasure = yTreasure;
    this.onDraw = onDraw;
}

function Cell(x, y, gridNumber) {
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.gameObjects = [];
  this.staticObjects = [];

  this.tick = function(dt){
    for (var i = 0; i < this.gameObjects.length; i++){
      this.gameObjects[i].onTick(dt);
    }
  }

  this.draw = function(){
    for (var i = 0; i < this.gameObjects.length; i++){
      if (typeof this.gameObjects[i].onDraw != "undefined"){
        this.gameObjects[i].onDraw();
      } else {
        console.log('Undefined draw for cannon');
      }
    }
    for (var i = 0; i < this.staticObjects.length; i++){
      if (typeof this.staticObjects[i].onDraw != "undefined"){
        this.staticObjects[i].onDraw();
      } 
    }
  }
}

// Update cell in which the object is
function updateCell(sim, object, x, y) {
  var curCell = object.cell;
  var realCell = sim.coordinateToCell(x, y);
  if (!curCell) {
    console.log('updateCell::Invalid cells ' + curCell + '.');
    return;
  }
  if (curCell != realCell) {
    var found = 0;
    for (var i = 0; i < curCell.gameObjects.length; i++){
      if (curCell.gameObjects[i] == object) {
        curCell.gameObjects.splice(i,1);
        found = 1;
      }
    }

    if (found == 0) {
      console.log('updateCell::Could not remove object from previous current cell');
      return;
    } else {
      if (realCell == null) {
        // Object has gone out of the grid, delete it
        sim.removeObject(object);
      } else {
        realCell.gameObjects.push(object);
        object.cell = realCell;
      }
    }
  }
}



//  Where
//  gridNumber is the height and width of the world in cells
//  cellWidth, cellHeight specify cell size
//  ActiveCells list of cells to tick and render, modified by (de)activateCell()
function Sim(remote, gridNumber, cellWidth, cellHeight, activeCells){

  console.log('Initialising sim...');

  this.gridNumber = gridNumber;
  this.cellWidth  = cellWidth;
  this.cellHeight = cellHeight;
  this.activeCells = activeCells;
  this.remote = remote;

  this.grid = new Array(this.gridNumber)
  for (var i = 0; i < this.gridNumber; i++) {
    this.grid[i] = new Array(this.gridNumber);
    for (var j = 0; j < this.gridNumber; j++) {
      this.grid[i][j] = new Cell(i, j, this.gridNumber);
    }
  }

  this.activateCell = function (x,y){
    this.activeCells.push({x:x, y:y});
  };

  this.deactivateCell = function (x,y){
    var testObj = {x:x, y:y};
    for (var i = 0; i < this.activeCells.length; i++){
      if (this.activeCells[i] == testObj){
        this.activeCells.splice(i, 1);
      }
    }
  };

  // Get Cell given pixel position
  this.coordinateToCell = function(x, y) {
    if (!this.grid) {
      console.log('No grid defined');
      return null;
    }
    if (x < 0 || y < 0 || x > this.gridNumber * this.cellWidth ||
        y > this.gridNumber * this.cellHeight) {
      // 'Object in undefined cell'
      return null;
    }
    var x_coord = Math.floor(x / this.cellWidth);
    var y_coord = Math.floor(y / this.cellHeight);
    return this.grid[x_coord][y_coord];
  };

  var xTreasure = 300;
  var yTreasure = 300;

  this.populateMap = function(drawTreasure, drawCoins, drawRocks) {
    var treasure = new Treasure(xTreasure, yTreasure, drawTreasure);
    var cell = this.coordinateToCell(xTreasure, yTreasure);
    cell.staticObjects.push(treasure);
  };

  //  Given a function f of a cell and some auxilary data,
  //  apply that function to all cells in a given area
  this.applyToCells = function(f, aux, x, y, width, height){
    var x_coord = Math.floor(x / this.cellWidth);
    var y_coord = Math.floor(y / this.cellHeight);
    var x_cellcount = Math.floor(width / this.cellWidth);
    var y_cellcount = Math.floor(height / this.cellWidth);
    for (var y = y_coord; y < y_cellcount; y++){
      for (var x = x_coord; x < x_cellcount; x++){
        f(this.grid[x_coord][y_coord], aux);
      }
    }
  };


  this.tick = function(dt){
    for (var i = 0; i < this.activeCells.length; i++){
      var x = this.activeCells[i].x;
      var y = this.activeCells[i].y;
      this.grid[x][y].tick(dt);
    }
  };

  this.draw = function(ctx){
    ctx.fillStyle = "green";
    ctx.fillRect(10, 10, 20, 20);
    ctx.fillRect(610, 10, 20, 20);
    ctx.fillRect(410, 210, 20, 20);
    ctx.fillRect(110, 610, 20, 20);
    ctx.fillRect(810, 510, 20, 20);
    for (var i = 0; i < this.activeCells.length; i++){
      var x = this.activeCells[i].x;
      var y = this.activeCells[i].y;
      drawCellBackground(x, y, ctx);
    }
    for (var i = 0; i < this.activeCells.length; i++){
      var x = this.activeCells[i].x;
      var y = this.activeCells[i].y;
      this.grid[x][y].draw();
    }
  };


  this.addShip = function (state, uid, inputFunction, onDraw, onDrawCannon){
    var cell = this.coordinateToCell(state.x, state.y);
    var ship = new Ship.Class(this, state, uid, inputFunction, onDraw, onDrawCannon);
    cell.gameObjects.push(ship);
    return ship;
  };


  this.removeObject = function(object) {
    var cell = object.cell;
    for (var i = 0; i < cell.gameObjects.length; i++){
      if (cell.gameObjects[i] == object) {
        cell.gameObjects.splice(i,1);
      }
    }
    if (typeof object.onDeath != "undefined") {
      object.onDeath();
    }
  };


}

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

/*
var remote;
function initializeGame(){
  remote = new Remote();
}

function newPlayer(id, name, state) {
  remoteStates[id] = state;
  playerNames[id] = name;
  console.log('Adding player: ' + name);
}

function removePlayer(id) {
  console.log('Removing player: ' + playerNames[id] + ' ' + id);
  delete remoteStates[id];
  delete playerNames[id];
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

function getPlayerNames() {
  return playerNames;
}
*/


//  Nodejs exports for use in server
//var exports = module.exports = {};

exports.width = width;
exports.height = height;

exports.Remote = Remote;

exports.createServerShipInput = createServerShipInput;
exports.updateCell = updateCell;
exports.Sim = Sim;

})(typeof exports == 'undefined' ? this.Game = {} : exports);
