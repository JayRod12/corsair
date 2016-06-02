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
	if(object_1 instanceof Ship.Class && object_2 instanceof Ship.Class) {
	  var rectangle_1 = {x: object_1.state.x, 
                         y: object_1.state.y, 
					     height: Ship.shipBaseHeight*object_1.scale, 
						 width: Ship.shipBaseWidth*object_1.scale,
					     angle: object_1.state.angle};
		var rectangle_2 = {x: object_2.state.x, 
                           y: object_2.state.y, 
					       height: Ship.shipBaseHeight*object_2.scale, 
						   width: Ship.shipBaseWidth*object_2.scale,
						   angle: object_2.state.angle};
			var res = Col.RectRect(rectangle_1, rectangle_2, true);
			console.log(res);
      return res;
    }
    var rect_s, rect_i;
    var ship_island_collision = false;
    if(object_1 instanceof Ship.Class && object_2 instanceof Island.Class){
      rect_s = {
        x: object_1.state.x,
        y: object_1.state.y,
        width: Ship.shipBaseWidth * object_1.scale,
        height: Ship.shipBaseHeight * object_1.scale,
        angle: object_1.state.angle
      };
      rect_i = {
        x: object_2.x,
        y: object_2.y,
        width: object_2.width,
        height: object_2.height,
        angle: object_2.angle
      };
      ship_island_collision = true;
    }
    if(object_1 instanceof Island.Class && object_2 instanceof Ship.Class) {
      rect_s = {
        x: object_2.state.x,
        y: object_2.state.y,
        width: Ship.shipBaseWidth * object_2.scale,
        height: Ship.shipBaseHeight * object_2.scale,
        angle: object_2.state.angle
      };
      rect_i = {
        x: object_1.x,
        y: object_1.y,
        width: object_1.width,
        height: object_1.height,
        angle: object_1.angle
      };
      ship_island_collision = true;
    }
    if (ship_island_collision) {
      var point_s = {x: rect_s.x, y:rect_s.y};
      //var ret = queryPointRectangleCollision(point_s,
                  //rect_i, true);
      var ret = Col.RectRect(rect_s, rect_i, true);
      return ret;
    }

	return false;
    //I'm sorry for my sins. TODO: CannonBall (point) cases
}	

exports.Class = Sim;
exports.Cell = Cell;
exports.updateCell = updateCell;
exports.checkCollision = checkCollision;

})(typeof exports == 'undefined' ? this.Sim = {} : exports);
