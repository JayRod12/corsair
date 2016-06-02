// IMPORTANT TODO: Move important decisions such as removing Objects from shared to client
// TODO: Should cells really have both static and game objects? 
//   

var server;

const width = 1000;
const height = 1000;

const shipBaseWidth = 90;
const shipBaseHeight = 40;



//  Inputfunction determines updates to the ship
//  onDraw can be null

function Ship(sim, state, uid, name, inputFunction, onDraw, onDrawCannon){

  // Simulation in which the ship is.
  this.sim = sim;
  this.uid = uid;
  this.name = name;

  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = sim.coordinateToCell(this.state.x, this.state.y);
  if (this.state == undefined) {
    debugger;
  }

  this.getRemoteState = function(){
    return remoteStates[uid];
  };

  // Scale of the ship ?
  this.scale = 1;

  this.cannon = new Cannon(this, onDrawCannon);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
    var remoteState = this.getRemoteState();

    //  Updates speed and angle
    this.inputFunction();

    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    this.state.x = (this.state.x + remoteState.x) / 2
    this.state.y = (this.state.y + remoteState.y) / 2
    updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

  }

  this.onDraw = onDraw;

  this.serialize = function() {
    return { type:"ship"
           , o : { uid: this.uid
                 , name: this.name
                 , state: this.state }};
  };
}

function Cannon(ship, onDraw) {

  this.ballSpeed = 0.3;
  this.cannons = 5;
  this.spacing = 15;
  this.delay = 30;
  this.ship = ship;
  this.level = 3;
  this.onDraw = onDraw;

  this.baseCooldown = 1200;
  this.cooldown = 0;

  this.futureShots = [];  //  List of future firing events

  this.onShoot = function(side) {

    if (this.cooldown > 0) return false;
    this.cooldown = this.baseCooldown;

    console.log('Ship direction: ' + this.ship.state.angle);



    for (var i = 0; i < this.cannons; i++){

      var ship = this.ship;
      var level = this.level;
      var onDraw = this.onDraw;
      var ballSpeed = this.ballSpeed;
      var spacing = this.spacing;
      var cannons = this.cannons;

      var shot = function(i){
        var offsetX = spacing * (cannons / 2 - i) * Math.cos(ship.state.angle);
        var offsetY = spacing * (cannons / 2 - i) * Math.sin(ship.state.angle);
        var ball = new CannonBall(ship, offsetX, offsetY, side, ballSpeed, onDraw, level);
        var cell = ship.sim.coordinateToCell(ship.state.x + offsetX, ship.state.y + offsetY);
        cell.gameObjects.push(ball);
      }

      this.futureShots.push({time: i*this.delay, f : shot, i: i});
    }

  };

  this.onTick = function(dt){
    if (this.cooldown > 0) this.cooldown -= dt;
    for (var i = 0; i < this.futureShots.length; i++){
      //  Inefficient?
      //this.futureShots[i] = {time: this.futureShots[i].time - dt, f:
        //this.futureShots[i].f};
      this.futureShots[i].time -= dt;
      if (this.futureShots[i].time < 0){
        this.futureShots[i].f(this.futureShots[i].i);
        this.futureShots.splice(i,1);
        i = i - 1;
      }
    }
  };
}


function CannonBall(ship, offsetX, offsetY, side, speed, onDraw, level) {

  console.log(offsetX);

  this.sim = ship.sim;
  this.ship = ship; 
  this.level = level;

  var angle = ((-ship.state.angle - side * Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));

  this.state = { x : ship.state.x + offsetX
               , y : ship.state.y + offsetY
               , xvel: ship.state.speed * Math.cos(-ship.state.angle) + speed * Math.cos(angle)
               , yvel: ship.state.speed * Math.sin(-ship.state.angle) + speed * Math.sin(angle)
  };

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.state.life == 0) {
      this.sim.removeObject(this);
    }
    // TODO interpolation with remote state
    this.state.x += dt * this.state.xvel;
    this.state.y -= dt * this.state.yvel;
    this.life -= 1;
    updateCell(this.sim, this, this.state.x, this.state.y);
  };
  this.onDraw = onDraw;
  this.serialize = function() {
    return { type: "cannonball", o : this.state };
  };

}

// TODO change cannon so it can be deserialized
function deserializeCannonBall(state) {
  console.log('deserializeCannonBall unimplemented');
  return null;
}

function Treasure(xTreasure, yTreasure, onDraw) {
    this.xTreasure = xTreasure;
    this.yTreasure = yTreasure;
    this.onDraw = onDraw;
    this.serialize = function() {
      return { type: "treasure", o : this};
    }
}

// Serialize objects before sending them through sockets.

function serializeObject(o) {
  if (typeof o.serialize != "undefined") {
    return o.serialize();
  } else {
    console.log('Serializing non-serializable object of type ' + typeof o);
  }
}
function serializeArray(array) {
  return array.map(serializeObject);
}

function deserializeObject(serial, aux) {
  if (serial == null) {
    debugger;
  }
  switch (serial.type) {
    case "treasure":
      return serial.o;
    case "cannonball":
      return deserializeCannonBall(serial.o, aux);
    case "ship":
      return deserializeShip(serial.o, aux);
    case "test_obj":
      return deserializeTestObj(serial.o, aux);
    default:
      console.log('Deserializing unrecognized object');
  }

}

function deserializeArray(array, aux) {
  return array.map(function(o) {
    deserializeObject(o, aux);
  });
}


function Cell(x, y, gridNumber) {
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.gameObjects = [];
  this.bufferedUpdates = [];
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
    }
  }

  this.activateCell = function (x,y){
    this.activeCells.push(this.cellTupleToNumber({x:x, y:y}));
  };

  this.deactivateCell = function (x,y){
    var testObj = this.cellTupleToNumber({x:x, y:y});
    for (var i = 0; i < this.activeCells.length; i++){
      if (this.activeCells[i] == testObj){
        this.activeCells.splice(i, 1);
      }
    }
  };

  // Tuple to number
  this.cellTupleToNumber = function(tuple) {
    return gridNumber * tuple.y + tuple.x;
  };

  // Number to tuple
  this.cellNumberToTuple = function(n){
    return {x : n % gridNumber, y : Math.floor(n/gridNumber) };
  };

  // Transformations
  // (x, y) -> { x : x, y : y} <-> gN * y + x
  //                            -> Cell

  // Coordinate to tuple
  this.coordinateToCellIndex = function(x, y){
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
    return {x : x_coord, y : y_coord};
  };

  // Coordinate to number
  this.coordinateToCellNumber = function(x, y){
    var tuple = this.coordinateToCellIndex(x,y);
    return this.cellTupleToNumber(tuple);
  };

  // Get Cell given pixel position
  this.coordinateToCell = function(x, y) {
    var tuple = this.coordinateToCellIndex(x, y);
    if (tuple == null) {
      return null;
    }
    return this.grid[tuple.x][tuple.y];

  };
  this.numberToCell = function(n) {
    var tuple = this.cellNumberToTuple(n);
    return this.grid[tuple.x][tuple.y];

  }

  this.populateMap = function(drawTreasure, drawCoins, drawRocks) {
    var xTreasure = Math.random() * gridNumber * cellWidth;
    var yTreasure = Math.random() * gridNumber * cellHeight;
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
      var tuple = this.cellNumberToTuple(this.activeCells[i]);
      this.grid[tuple.x][tuple.y].tick(dt);
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
      var tuple = this.cellNumberToTuple(this.activeCells[i]);
      drawCellBackground(tuple.x, tuple.y, ctx);
    }
    for (var i = 0; i < this.activeCells.length; i++){
      var tuple = this.cellNumberToTuple(this.activeCells[i]);
      this.grid[tuple.x][tuple.y].draw();
    }
  };


  this.addShip = function (uid, name, state, inputFunction, onDraw, onDrawCannon){
    var cell = this.coordinateToCell(state.x, state.y);
    var ship = new Ship(this, state, uid, name, inputFunction, onDraw, onDrawCannon);
    cell.gameObjects.push(ship);
    playerShips[uid] = ship;
    return ship;
  };

  this.removeShip = function (ship) {
    delete playerShips[ship.uid];
  };

  this.removeObject = function(object) {
    var cell = object.cell;
    for (var i = 0; i < cell.gameObjects.length; i++){
      if (cell.gameObjects[i] == object) {
        cell.gameObjects.splice(i,1);
      }
    }

    if (object instanceof Ship) {
      this.removeShip(object);
    }

    if (typeof object.onDeath != "undefined") {
      object.onDeath();
    }
  };

}

//  Static object for testing
function TestObj(sim, state){
  this.sim = sim;
  this.state = state;
  this.onTick = function(){return true;};
  this.onDraw = function(){
    ctx.translate(this.state.x, this.state.y);
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,this.state.w,this.state.h);
    ctx.translate(-this.state.x, -this.state.y);
  }
  this.serialize = function() {
    return { type: "test_obj", o: this.state };
  }
}


function createServerShipInput(id){
  return function(){
    var remoteState = this.getRemoteState();
    this.state.angle = remoteState.angle;
    this.state.speed = remoteState.speed;
  };
}

var remoteStates;
var playerShips;
function initializeGame(){
  console.log("game inited");
  remoteStates = {};
  playerNames = {};
  playerShips = {};
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
  return remoteStatee;
}

function getPlayerNames() {
  return playerNames;
}

function getPlayerShips() {
  return playerShips;
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
exports.getPlayerNames = getPlayerNames;
exports.getPlayerShips = getPlayerShips;

exports.createServerShipInput = createServerShipInput;
exports.Sim = Sim;
exports.TestObj = TestObj;
exports.serializeArray = serializeArray;
