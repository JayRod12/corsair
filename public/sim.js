
//  TODO extract functions and add to prototypes

var server;
if (typeof exports === 'undefined'){
  //  Browser
  server = false;
}
else{
  //  Server
  Ship = require('../public/ship.js');
  Col = require('../public/collision_detection.js');
  Island = require('../public/island.js');
  server = true;
}


(function(exports){

function Cell(x, y, gridNumber) {
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.gameObjects = [];
  this.staticObjects = [];
  this.bufferedUpdates = [];

  this.tick = function(dt){
    //Check collisions first, important so that collisionHandler can do 
    //its work!
    this.checkCollisions();
    for (var i = 0; i < this.gameObjects.length; i++){
      this.gameObjects[i].onTick(dt);
    }
  }

  this.draw = function(ctx){
    for (var i = 0; i < this.gameObjects.length; i++){
      if (typeof this.gameObjects[i].onDraw != "undefined"){
        this.gameObjects[i].onDraw(ctx);
      } 
    }
    for (var i = 0; i < this.staticObjects.length; i++){
      if (typeof this.staticObjects[i].onDraw != "undefined"){
        this.staticObjects[i].onDraw(ctx);
      } 
    }
  }

  this.checkCollisions = function() {
    for (var i = 0; i < this.gameObjects.length; i++) {
      for (var j = i + 1; j <= this.gameObjects.length; j++) {
        if (!this.gameObjects[i]){
          //  TODO what is going on here?
          //console.log("undefined gameObject");
          //this.gameObjects.splice(i, 1);
          continue;
        }
        if (!this.gameObjects[j]){
          //  TODO what is going on here?
          //console.log("undefined gameObject");
          //this.gameObjects.splice(i, 1);
          continue;
        }

        if(checkCollision(this.gameObjects[i], this.gameObjects[j])) {
          this.gameObjects[i].collisionHandler(this.gameObjects[j]);
          //  Avoid the case where object j is deleted
          if (this.gameObjects[j]) this.gameObjects[j].collisionHandler(this.gameObjects[i]);
        };
      }
    }
  }

  this.addUpdate = function(name, object) {
    this.bufferedUpdates.push({ name: name
                              , data: object.serialize()});
  }

  this.getUpdates = function() {
    return this.bufferedUpdates;
  }

  this.clearUpdates = function() {
    this.bufferedUpdates = [];
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
        if (server) {
          realCell.addUpdate('object_enter_cell', object);
        }
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
  this.UIDtoShip = {};

  this.getShip = function(uid) {
    return this.UIDtoShip[uid];
  }

  this.setShip = function(uid, ship) {
    this.UIDtoShip[uid] = ship;
  }

  this.addShip = function (uid, name, state, inputFunction){
    if (!this.UIDtoShip[uid]) {
      var cell = this.coordinateToCell(state.x, state.y);
      var ship = new Ship.Class(this, state, uid, name, inputFunction);
      cell.gameObjects.push(ship);
      remote.setScore(uid, 0);
      //remote.getUIDtoScores()[uid] = {shipName: remote.getPlayerName(uid), score: 0};
      this.UIDtoShip[uid] = ship;
      return ship;
    } else {
      return null;
    }
  };

  this.removeShip = function(ship){
    delete this.UIDtoShip[ship.uid];
  }
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
    var testObj = {x:x, y:y};
    for (var i = 0; i < this.activeCells.length; i++){
      if (this.activeCells[i] == testObj){
        this.activeCells.splice(i, 1);
      }
    }
  };


  var xTreasure = 300;
  var yTreasure = 300;

  this.populateMap = function(drawTreasure, drawIsland, drawCoins, drawRocks) {
    var treasure = new Treasure(xTreasure, yTreasure, drawTreasure);
	  var example_island = new Island.Class(this, 500, 500, 800, 40, Math.PI/4,
													"white");  
    var cell = this.coordinateToCell(xTreasure, yTreasure);
    cell.staticObjects.push(treasure);
		cell.gameObjects.push(example_island);
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
    if (!this.grid[tuple.x]) debugger;
    return this.grid[tuple.x][tuple.y];

  };
  this.numberToCell = function(n) {
    var tuple = this.cellNumberToTuple(n);
    return this.grid[tuple.x][tuple.y];

  }

  var wait = 0;
  this.tick = function(dt){
    for (var i = 0; i < this.activeCells.length; i++){
      this.numberToCell(this.activeCells[i]).tick(dt);
    }

    if (wait == 0) {
      for (var uid in remote.getUIDtoScores()) {
        remote.setScore(uid, remote.getScore(uid) + 1);
      }
    }
    wait = (wait + 1) % 50;
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
      this.numberToCell(this.activeCells[i]).draw(ctx);
    }
  };




  this.removeObject = function(object) {
    var cell = object.cell;
    for (var i = 0; i < cell.gameObjects.length; i++){
      if (cell.gameObjects[i] == object) {
        cell.gameObjects.splice(i,1);
      }
    }

    if (object instanceof Ship.Class){
      this.removeShip(object);
    }

    if (typeof object.onDeath != "undefined") {
      object.onDeath();
    }
  };

  this.addTestObject = function() {
    var w = 20 + 40 * Math.random();
    var h = 20 + 40 * Math.random();
    var x = (gridNumber * cellWidth - w) * Math.random();
    var y = (gridNumber * cellHeight - h) * Math.random();
   
    var state = {x: x, y: y, w: w, h: h};
    var obj = new TestObj(this, state);
    var cell = this.coordinateToCell(state.x, state.y);
    cell.gameObjects.push(obj);
    cell.addUpdate('create_testObj', obj);
  }
}

function Treasure(xTreasure, yTreasure, onDraw) {
    this.xTreasure = xTreasure;
    this.yTreasure = yTreasure;
    this.onDraw = onDraw;
    this.serialize = function() {
      // TODO
      return null;
    };
}

//  Probably factor out

function checkCollision(object_1, object_2) {
  //  If either object has no collision type return
  if (typeof object_1.getColType === "undefined" || 
      typeof object_2.getColType === "undefined" ) return false;

  var col_type_1 = object_1.getColType();
  var col_type_2 = object_2.getColType();


  var col_obj_1 = object_1.getColObj();
  var col_obj_2 = object_2.getColObj();

  return parseColObjects(col_type_1, col_type_2, col_obj_1, col_obj_2, true);
}

function parseColObjects(col_type_1, col_type_2, col_obj_1, col_obj_2, first){
  switch(col_type_1){
    case "rectangle":
      switch(col_type_2){
        case "rectangle":
          return Col.RectRect(col_obj_1, col_obj_2);
        case "circle":
          console.log("ERROR Currently Unsupported");
          parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
          return false;
        case "point":
          return Col.PointRect(col_obj_2, col_obj_1);
        default:
        if (!first){
          parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
          return false;
        }
      }
    case "circle":
      switch(col_type_2){
        case "circle":
          return Col.CircleCircle(col_obj_1, col_obj_2);
        case "point":
          console.log("ERROR Currently Unsupported");
          parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
          return false;
        default:
        if (!first){
          parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
          return false;
        }
      }
    case "point":
      switch(col_type_2){
        case "point":
          return Col.PointPoint(col_obj_1, col_obj_2);
        default:
        if (!first){
          parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
          return false;
        }
      }
    default:
      if (first){
        return parseColObjects(col_type_2, col_type_1, col_obj_2, col_obj_1,
            false);
      }
      parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
      return false;
  }
}
function parseColObjectsFailure(t1, t2, o1, o2){
  console.log("Collision of unknown types " + t1 + " and " + t2);
  console.log("Object 1: ");
  console.log(o1);
  console.log("Object 2: ");
  console.log(o2);
}

function TestObj(sim, state) {
  this.sim = sim;
  this.state = state;
  this.onTick = function(){return true;};
  this.onDraw = function(ctx) {
    ctx.translate(this.state.x, this.state.y);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.state.w, this.state.h);
    ctx.translate(-this.state.x, -this.state.y);
  };
  this.serialize = function() {
    return {type: "test_obj", o: this.state};
  };
}

exports.Class = Sim;
exports.Cell = Cell;
exports.updateCell = updateCell;
exports.checkCollision = checkCollision;
exports.TestObj = TestObj;

})(typeof exports == 'undefined' ? this.Sim = {} : exports);
