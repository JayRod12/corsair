
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
  Treasure = require('../public/treasure.js');
  server = true;
}


(function(exports){

function Cell(sim, x, y, gridNumber, width, height) {
  this.sim = sim;
  this.number = gridNumber * y + x;
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.gameObjects = [];
  this.staticObjects = [];
  this.drawObjects = [];
  this.prerenderObjects = [];
  this.colObjects = [];
  this.bufferedUpdates = [];

  this.tick = function(dt){
    //Check collisions first, important so that collisionHandler can do 
    //its work!
    this.checkCollisions();
    for (var i = 0; i < this.gameObjects.length; i++){
      if (typeof this.gameObjects[i].onTick !== "undefined"){
        this.gameObjects[i].onTick(dt);
      }
    }
  }

  this.drawBackground = function(ctx) {

    ctx.drawImage(this.prerenderedBackground, this.x * this.width, this.y *
        this.height, this.width, this.height);
  }

  this.draw = function(ctx){
    /*
      if (typeof this.gameObjects[i].onDraw != "undefined"){
        var toDraw = true;
        for (var j = 0; j < prerenderClasses.length; j++){
          if (this.gameObjects[i] instanceof prerenderClasses[j]){
            toDraw = false;
            console.log("AFWA");
            break;
          }
        if (toDraw) this.gameObjects[i].onDraw(ctx);
        }
      } 
    }
    for (var i = 0; i < this.staticObjects.length; i++){
      if (typeof this.staticObjects[i].onDraw != "undefined"){
        this.staticObjects[i].onDraw(ctx);
      } 
    }
    */
    for (var i = 0; i < this.drawObjects.length; i++){
      this.drawObjects[i].object.onDraw(ctx);
    }
    
  }

  //  Where depth is a value between 0 and 1
  this.addObject = function(object, depth) {

    if (typeof object.onTick !== "undefined" || server){
      this.gameObjects.push(object);
    }

    if (!server){
      if (typeof object.onDraw !== "undefined"){
        if (typeof depth === "undefined"){
          var depth = 0.5;
        }
        var pre = false;
        for (var i = 0; i < prerenderClasses.length; i++){
          if (object instanceof prerenderClasses[i]){
            pre = true;
            break;
          }
        }
        if (!pre){
          Utils.insertOrdered(this.drawObjects, {depth: depth, object: object},
              function(o){return o.depth});
        }
        else {
          this.prerenderObjects.push(object);
        }
      }
    }

    if (typeof object.getColType !== "undefined"){
      this.colObjects.push(object);
    }

  }


  this.removeObject = function(object) {
	if(!object) return;
    var found = false;
    var deepequals = false;
    if (typeof object.equals !== "undefined"){
      deepequals = true;
    }

    for (var i = 0; i < this.gameObjects.length; i++){
      if ((!deepequals && this.gameObjects[i] == object) ||
              (deepequals && object.equals(this.gameObjects[i]))) {
        this.gameObjects.splice(i,1);
        found = true;
        break;
      }
    }

    if (typeof object.onDraw !== "undefined"){
      for (var i = 0; i < this.drawObjects.length; i++){
        if ((!deepequals && this.drawObjects[i].object == object) ||
                (deepequals && object.equals(this.drawObjects[i].object))) {
          this.drawObjects.splice(i,1);
          found = true;
		      break;
        }
      }
    }

    if (typeof object.getColType !== "undefined"){
      for (var i = 0; i < this.colObjects.length; i++){
        if ((!deepequals && this.colObjects[i] == object) ||
                (deepequals && object.equals(this.colObjects[i]))) {
          this.colObjects.splice(i,1);
          found = true;
		      break;
        }
      }
    }
    if (!found) {
      console.log('Remove object didnt find object in cell');
    }
    
    if (typeof object.onDeath != "undefined") {
      object.onDeath();
    }

    if (object instanceof Cannon.CannonBall) {
    }
    if (object instanceof Ship.Class){
      this.sim.removeShip(object);
    }

    return found;
  };



  this.checkCollisions = function() {
    for (var i = 0; i < this.colObjects.length; i++) {
      if (!this.colObjects[i]){
        //  TODO what is going on here?
        //console.log("undefined colObject");
        //this.colObjects.splice(i, 1);
        continue;
      }
      if (!this.colObjects[i].getColType) continue;

      var static_obj = (this.colObjects[i].getColCategory() === "static");

      for (var j = i + 1; j < this.colObjects.length; j++) {
        if (!this.colObjects[j]){
          //  TODO what is going on here?
          //console.log("undefined colObject");
          //this.colObjects.splice(i, 1);
          continue;
        }

        if (!this.colObjects[j].getColType) continue;

        //  Do not check two static objects against each other
        if (static_obj && this.colObjects[j].getColCategory() === "static") {
          continue;
        }

        if(checkCollision(this.colObjects[i], this.colObjects[j])) {
			    var pre_update_object = this.colObjects[i].getColObj();
          //we handle collisions using the collision states specified by each object
          this.colObjects[i].collisionHandler(this.colObjects[j].getColObj());
          //  Avoid the case where object j is deleted
          if (this.colObjects[j]) this.colObjects[j].collisionHandler(pre_update_object);
        };
      }
    }
  }

  this.addSerializedUpdate = function(name, object) {
    this.bufferedUpdates.push({ name: name
                              , data: object.serialize()});
  }
  
  this.addNonSerialUpdate = function(name, object) {
    this.bufferedUpdates.push({ name: name
                              , data: object });
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
    if (realCell == null) {
      sim.removeObject(object);
      object.cell = null;
    } else {
    	var found = false;
		for (var i = 0; i < curCell.gameObjects.length; i++){
		  if (curCell.gameObjects[i] == object) {
		    curCell.gameObjects.splice(i,1);
		    found = true;
		  }
		}
		for (var i = 0; i < curCell.drawObjects.length; i++){
		  if (curCell.drawObjects[i] == object) {
		    curCell.drawObjects.splice(i,1);
		    found = true;
		  }
		}
		for (var i = 0; i < curCell.colObjects.length; i++){
		  if (curCell.colObjects[i] == object) {
		    curCell.colObjects.splice(i,1);
		    found = true;
		  }
		}

      if (!found) {
        console.log('updateCell::Could not remove object from previous current cell');
        //debugger;
      }

      if (server) {
        realCell.addSerializedUpdate('object_enter_cell', object);
      }
      realCell.addObject(object);
      object.cell = realCell;

    }
  }
}



//  Where
//  gridNumber is the height and width of the world in cells
//  cellWidth, cellHeight specify cell size
//  ActiveCells list of cells to tick and render, modified by (de)activateCell()
function Sim(remote, starttime, gridNumber, cellWidth, cellHeight, activeCells){

  console.log('Initialising sim...');

  this.time = starttime;

  this.gridNumber = gridNumber;
  this.cellWidth  = cellWidth;
  this.cellHeight = cellHeight;
  this.activeCells = activeCells;
  this.remote = remote;
  this.UIDtoShip = {};
  this.treasures = [];

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
      cell.addObject(ship);
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

  this.removeTreasure = function(treasure) {
    var found = false;
    for (var i = 0; i < this.treasures.length; i++){
      if (this.treasures[i].equals(treasure)) {
        this.treasures.splice(i,1);
        found = true;
		    break;
      }
    }
    if (!found) {
      console.log('Treasure remove: not found in treasures');
    }
    this.removeObject(treasure);
  }

  this.grid = new Array(this.gridNumber)
  for (var i = 0; i < this.gridNumber; i++) {
    this.grid[i] = new Array(this.gridNumber);
    for (var j = 0; j < this.gridNumber; j++) {
      this.grid[i][j] = new Cell(this, i, j, this.gridNumber, this.cellWidth, this.cellHeight);
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


  //  Given a function f of a cell and some auxilary data,
  //  apply that function to all cells in a given area
  //  Returns list of tuples, {cell: cellnum, ret: returnresult}
  this.applyToCells = function(x, y, width, height, f, aux){
    var x_coord = Math.floor(x / this.cellWidth);
    var y_coord = Math.floor(y / this.cellHeight);
    var x_max = Math.floor((x + width) / this.cellWidth);
    x_max = Math.min(gridNumber-1, x_max);
    var y_max = Math.floor((y + height) / this.cellWidth);
    y_max = Math.min(gridNumber-1, y_max);
    var ret = [];
    for (var y = y_coord; y <= y_max; y++){
      for (var x = x_coord; x <= x_max; x++){
        ret.push({cell: this.cellTupleToNumber({x:x, y:y}),
                  ret: f(this.grid[x][y], aux)});
      }
    }
    return ret;
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

  this.tick = function(dt){
    this.time += dt;
    for (var i = 0; i < this.activeCells.length; i++){
      this.numberToCell(this.activeCells[i]).tick(dt);
    }
  };

  this.draw = function(ctx){
    for (var i = 0; i < this.activeCells.length; i++){
      var tuple = this.cellNumberToTuple(this.activeCells[i]);
      this.numberToCell(this.activeCells[i]).drawBackground(ctx);
     //drawCellBackground(tuple.x, tuple.y, ctx);
    }
    for (var i = 0; i < this.activeCells.length; i++){
      this.numberToCell(this.activeCells[i]).draw(ctx);
    }
  };




  this.removeObject = function(object) {
    var cell = object.cell;
    if (typeof cell !== "undefined"){
      return cell.removeObject(object);
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
    cell.addObject(obj);
    cell.addSerializedUpdate('create_testObj', obj);
  }

  this.increaseScale = function(uid, value) {
    this.getShip(uid).increaseScale(value);
  }
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
  this.hypotenuse = Math.sqrt(this.state.w * this.state.w + this.state.h *
      this.state.h);
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

  this.getColType = function() {return "rectangle"};
  this.getColCategory = function() {return "dynamic";};
  this.getColObj = function() {
    return {
      x: this.state.x,
      y: this.state.y,
      width: this.state.w,
      height: this.state.h,
      hypotenuse: this.hypotenuse,
      angle: this.state.a
    }
  };
}

exports.Class = Sim;
exports.Cell = Cell;
exports.updateCell = updateCell;
exports.checkCollision = checkCollision;
exports.TestObj = TestObj;

})(typeof exports == 'undefined' ? this.Sim = {} : exports);
