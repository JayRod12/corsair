var Island = require('../public/island.js').Class;
var CosmeticIsland = require('../public/island.js').Cosmetic;
var Perlin = require('../public/perlin.js').Class;
var Col = require('../public/collision_detection.js');
var Ship = require('../public/ship.js').Class;
var TestObj = require('../public/sim.js').TestObj;
var Treasure = require('../public/treasure.js').Class;
var Utils = require('../public/utils.js');

const seaHue = 222;
const seaSat = 49;

const landHue = 94;
const landSat = 45;

const beachHue = 63;
const beachSat = 46;

const mountainSat = 7;
const mountainHue = 222;

const seaLevel = 0.64;
const landLevel = 0.68;
const mountainLevel = 0.70;

function islandColor(height){
  if (height > mountainLevel){
    return Utils.makeHSL(mountainHue, mountainSat, height*100);
  }
  else if (height > landLevel){
    return Utils.makeHSL(landHue, landSat, height*100);
  }
  else if (height > seaLevel){
    return Utils.makeHSL(beachHue, beachSat, height*100);
  }
  else {
    return Utils.makeHSL(seaHue, seaSat, height*100);
  }
}

function generateIslands2(sim, gridNumber, cellWidth, cellHeight) {
  var perlin = new Perlin(8 * gridNumber, 8 * gridNumber, 6, 0.5);
  var height_maps = new Array(gridNumber * gridNumber);

  var island_size = 32;
  var max_x = gridNumber * cellWidth;
  var max_y = gridNumber * cellHeight;

  console.log("Generating islands");
  for (var cell = 0; cell < gridNumber * gridNumber; cell++) {
    var array = new Array(cellWidth / island_size);
    var base = sim.cellNumberToTuple(cell);
    var x = base.x * cellWidth;
    var y = base.y * cellHeight;

    for (var i = 0; i < cellWidth / island_size; i++) {
      array[i] = new Array(cellHeight / island_size);
      y = base.y * cellHeight;
      for (var j = 0; j < cellHeight / island_size; j++) {
        array[i][j] = perlin.perlin(x / max_x, y / max_y);
        y += island_size;
      }
      x += island_size;
    }
    height_maps[cell] = array;
  }
  return height_maps;
}

function generateIslands(sim, gridNumber, cellWidth, cellHeight){
  var perlin = new Perlin(8 * gridNumber, 8 * gridNumber, 6, 0.5);


  var island_size = 32;
  var max_x = gridNumber * cellWidth;
  var max_y = gridNumber * cellHeight;
  var islands = [];

  for (var x = 0; x < max_x; x+= island_size){
    var island_col = [];
    for (var y = 0; y < max_y; y+= island_size){
      island_col.push(false);
    }
    islands.push(island_col);
  }

  console.log("Generating islands");
  for (var x = 0; x < max_x; x+= island_size){
    //var island_col = [];
    for (var y = 0; y < max_y; y+= island_size){
      var l = perlin.perlin(x / max_x, y / max_y);
      var color = islandColor(l);
      if (l > seaLevel){
        var i = new Island(sim, x, y, island_size, island_size, 0, color);
        sim.coordinateToCell(x,y).addObject(i);
        //island_col.push(i);
        islands[Math.floor(x/island_size)][Math.floor(y/island_size)] = i;
      }
      else{
        
        var i = new CosmeticIsland(sim, x, y, island_size, island_size, 0, color);
        sim.coordinateToCell(x,y).addObject(i);

        
      }
      //island_col.push(false);
    }
    islands.push(island_col);
  }
  //  Remove inland collision detection for performance
  var xx = islands.length - 1;
  var yy = islands[0].length - 1;
  console.log("Removing inland island objects");
  for (var x = 1; x < islands.length-1; x++){
    var island_col = islands[x];
    for (var y = 1; y < island_col.length-1; y++){
      if (!islands[x][y]) continue;
      var neighbours = [];
      var rem = true;
      neighbours.push(islands[x-1][y-1]);
      neighbours.push(islands[x-1][y]  );
      neighbours.push(islands[x-1][y+1]);

      neighbours.push(islands[x+1][y-1]);
      neighbours.push(islands[x+1][y]  );
      neighbours.push(islands[x+1][y+1]);

      neighbours.push(islands[x][y-1]);
      neighbours.push(islands[x][y+1]);

      for (var i = 0; i < neighbours.length; i++){
        if (!neighbours[i]) break;
        if (i == neighbours.length - 1 && (typeof islands[x][y].cell !==
              "undefined")){
          var color = islands[x][y].color;
          var i = new CosmeticIsland(sim, islands[x][y].x, islands[x][y].y, 
              island_size, island_size, 0, color);
          i.cell.addObject(i);

          sim.removeObject(islands[x][y]);
          islands[x][y] = true;
        }
      }
      /*
      if (neighbours.reduce(function(x,y){return (x) && (y)}, true)){
        sim.removeObject(islands[x][y]);
      }
      */
    }
  }
}


function generateTreasures(sim, gridNumber, cellWidth, cellHeight, treasure_num) {
  var maxHP = 80;
  var minHP = 40;
  var minVal = 300;
  var maxVal = 500;
  var x, y, val, hp, treasure, cell;

  // Serialized version of all treasures
  var new_treasures = [];
  for (var i = 0; i < treasure_num; i++) {
    x = Math.random() * gridNumber * cellWidth;
    y = Math.random() * gridNumber * cellHeight;
    val = minVal + Math.random() * (maxVal - minVal);
    hp = minHP + Math.random() * (maxHP - minHP);
    treasure = new Treasure(sim, x, y, Math.floor(val), Math.floor(hp));
    cell = sim.coordinateToCell(x, y);
    cell.addObject(treasure);
    new_treasures.push(treasure);
  }
  Array.prototype.push.apply(sim.treasures, new_treasures);
  return new_treasures;
}
//  Check to see if a given x,y coordinate is safe to spawn a player
var dangerMinDist = 600;
var dangerousClasses = [
  Ship
  ,TestObj
  //,Treasure.Class
];
var obstacleMinDist = 200;
var obstacleClasses = [
  Island
];

function checkSafeSpawn(sim, x, y){

  var danger_circle = {origin: {x:x, y:y}, radius: dangerMinDist}
  var obstacle_circle = {origin: {x:x, y:y}, radius: obstacleMinDist}

  var xtest = Math.max(0, x - dangerMinDist);
  var ytest = Math.max(0, y - dangerMinDist);
  var ret_list = sim.applyToCells(xtest, ytest, dangerMinDist*2,
      dangerMinDist*2, function(cell){
        //  TODO static objects?
        for (var i = 0; i < cell.gameObjects.length; i++){
          var obj = cell.gameObjects[i];
          for (var j = 0; j < dangerousClasses.length; j++){
            if (obj instanceof dangerousClasses[j]){
              var colObj = obj.getColObj();
              //if (Col.CircleCircle({origin:{x:colObj.x, y:colObj.y}, radius:10}, danger_circle)){
              if (Col.PointCircle({x:colObj.x, y:colObj.y}, danger_circle)){
                return false;
              }
            }
          }
          for (var j = 0; j < obstacleClasses.length; j++){
            if (obj instanceof obstacleClasses[j]){
              var colObj = obj.getColObj();
              if (Col.CircleCircle({origin:{x:colObj.x, y:colObj.y},
                    radius:10}, obstacle_circle)){
                return false;
              }
            }
          }
        }
        return true;
      });
  for (var i = 0; i < ret_list.length; i++){
    if (!ret_list[i].ret){
      return false;
    }
  }
  return true;
}


exports.generateTreasures = generateTreasures;
exports.checkSafeSpawn = checkSafeSpawn;
exports.generateIslands = generateIslands;
exports.generateIslands2 = generateIslands2;

