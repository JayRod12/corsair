var server;

const width = 1000;
const height = 1000;

const shipBaseWidth = 90;
const shipBaseHeight = 40;

var remoteStates;

//  Inputfunction determines updates to the ship
//  onDraw can be null

function Ship(sim, state, uid, inputFunction, onDraw){

  this.sim = sim;

  //  Should contain:
  //  x, y, angle, speed
  this.state = state;

  this.getRemoteState = function(){
    return remoteStates[uid];
  };

  this.scale = 1;

  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    //console.log('update');

    var remoteState = this.getRemoteState();

    //  If player has left the server remove their ship from the sim
    if (typeof remoteState == "undefined"){
      sim.removeShip(this);
      return;
    }

    //  Updates speed and angle
    this.inputFunction();

    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    this.state.x = (this.state.x + remoteState.x) / 2
    this.state.y = (this.state.y + remoteState.y) / 2

    //this.state.x = this.pla
    /*
    if (!server){
      this.state.x = remoteState.x;
      this.state.y = remoteState.y;
    }
    */
    //console.log (remoteState.x - this.state.x);
  }

  this.onDraw = onDraw;
}

//  Grid logic

/*
var grid_number = 10;
var cell_size = 200; 
var grid;

function initializeGrid() {
  grid = new Array(grid_number)
  for (var i = 0; i < grid_number; i++) {
    grid[i] = new Array(grid_number);
    for (var j = 0; j < grid_number; j++) {
      grid[i][j] = new Cell(i, j);
      console.log('Initialising ' + i + ', ' + j);
    }
  }
}
*/

function Cell(x, y, gridNumber) {
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.gameObjects = [];

  this.tick = function(dt){
    for (var i = 0; i < this.gameObjects.length; i++){
      this.gameObjects[i].onTick(dt);
    }
  }

  this.draw = function(dt){
    for (var i = 0; i < this.gameObjects.length; i++){
      if (typeof this.gameObjects[i].onDraw != "undefined"){
        this.gameObjects[i].onDraw();
      }
    }
  }
}


//  Where
//  gridNumber is the height and width of the world in cells
//  cellWidth, cellHeight specify cell size
//  ActiveCells list of cells to tick and render, modified by (de)activateCell()
function Sim(gridNumber, cellWidth, cellHeight, activeCells){

  console.log('Initialising sim...');

  this.gridNumber = gridNumber;
  this.cellWidth  = cellWidth;
  this.cellHeight = cellHeight;
  this.activeCells = activeCells;

  this.grid = new Array(this.gridNumber)
  for (var i = 0; i < this.gridNumber; i++) {
    this.grid[i] = new Array(this.gridNumber);
    for (var j = 0; j < this.gridNumber; j++) {
      this.grid[i][j] = new Cell(i, j, this.gridNumber);
      console.log('Initialising ' + i + ', ' + j);
    }
  }
  /*
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
  */

  //this.

  // Get Cell given pixel position
  this.coordinateToCell = function(x, y) {
    if (!this.grid) {
      return null;
    }
    var x_coord = Math.floor(x / this.cellWidth);
    var y_coord = Math.floor(y / this.cellHeight);
    return this.grid[x_coord][y_coord];
  };

  this.tick = function(dt){
    for (var i = 0; i < this.activeCells.length; i++){
      var x = this.activeCells[i].x;
      var y = this.activeCells[i].y;
      this.grid[x][y].tick(dt);
    }
  };

  this.draw = function(dt){
    for (var i = 0; i < this.activeCells.length; i++){
      var x = this.activeCells[i].x;
      var y = this.activeCells[i].y;
      this.grid[x][y].draw();
    }
  };


  this.addShip = function (state, uid, inputFunction, onDraw){
    var cell = this.coordinateToCell(state.x, state.y);
    var ship = new Ship(this, state, uid, inputFunction, onDraw);
    cell.gameObjects.push(ship);
    return ship;
  };

  this.removeShip = function (doomed_ship){
    var cell = this.coordinateToCell(doomed_ship.state.x, doomed_ship.state.y);
    for (var i = 0; i < cell.gameObjects.length; i++){
      if (cell.gameObjects[i] == doomed_ship) {
        cell.gameObjects.splice(i,1);
      }
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
