
//  TODO extract functions and add to prototypes

if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Ship = require('../public/ship.js');
  Col = require('../public/collision_detection.js');
  Island = require('../public/island.js');
}


(function(exports){

function Cell(x, y, gridNumber) {
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.gameObjects = [];
  this.staticObjects = [];

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
      } /*else {
        console.log('Undefined draw for cannon');
      }*/
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
          this.gameObjects[j].collisionHandler(this.gameObjects[i]);
        };
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

  /*
  this.populateMap = function(drawTreasure, drawCoins, drawRocks) {
    var treasure = new Treasure(xTreasure, yTreasure, drawTreasure);
	var example_island = new Island(500, 500, 100, 100, Math.PI/4, 
													"white", drawIsland);  
    var cell = this.coordinateToCell(xTreasure, yTreasure);
    cell.staticObjects.push(treasure);
    */
  this.populateMap = function(drawTreasure, drawIsland, drawCoins, drawRocks) {
    var treasure = new Treasure(xTreasure, yTreasure, drawTreasure);
	var example_island = new Island.Class(500, 500, 100, 100, Math.PI/4, 
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
      this.grid[x][y].draw(ctx);
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

function Treasure(xTreasure, yTreasure, onDraw) {
    this.xTreasure = xTreasure;
    this.yTreasure = yTreasure;
    this.onDraw = onDraw;
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
        parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
        return false;
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
        parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
        return false;
      }
    case "point":
      switch(col_type_2){
        case "point":
          return Col.PointPoint(col_obj_1, col_obj_2);
        default:
        parseColObjectsFailure(col_type_1, col_type_2, col_obj_1, col_obj_2);
        return false;
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
  console.log("Object 1: " + o1);
  console.log("Object 2: " + o2);
}

exports.Class = Sim;
exports.Cell = Cell;
exports.updateCell = updateCell;
exports.checkCollision = checkCollision;

})(typeof exports == 'undefined' ? this.Sim = {} : exports);
