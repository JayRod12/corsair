var Island = require('../public/island.js').Class;
var CosmeticIsland = require('../public/island.js').Cosmetic;
var Perlin = require('../public/perlin.js').Class;
var Col = require('../public/collision_detection.js');
//var Treasure = require('../public/treasure.js');


function generateIslands(sim, gridNumber, cellWidth, cellHeight){
  var perlin = new Perlin(8 * gridNumber, 8 * gridNumber, 6, 0.5);
  var island_size = 32;
  var sea_level = 0.62;
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
      if (l > sea_level){
        var color = "green";
        var i = new Island(sim, x, y, island_size, island_size, 0, color);
        sim.coordinateToCell(x,y).gameObjects.push(i);
        //island_col.push(i);
        islands[Math.floor(x/island_size)][Math.floor(y/island_size)] = i;
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
          i.cell.staticObjects.push(i);

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

//  Check to see if a given x,y coordinate is safe to spawn a player
var dangerMinDist = 500;
var dangerousClasses = [
  Ship.Class
  //,Treasure.Class
];
var obstacleMinDist = 100;
var obstacleClasses = [
  Island.Class
];
function checkSafeSpawn(sim, x, y){

  var danger_circle = {origin: {x:x, y:y}, radius: dangerMinDist}
  var obstacle_circle = {origin: {x:x, y:y}, radius: obstacleMinDist}

  var ret_list = sim.applyToCells(x - dangerMinDist, y - dangerMinDist, dangerMinDist*2,
      dangerMinDist*2, function(cell){
        //  TODO static objects?
        for (let i = 0; i < cell.gameObjects.length; i++){
          let obj = cell.gameObjects[i];
          for (let j = 0; j < dangerousClasses; j++){
            if (obj instanceof dangerousClasses[j]){
              
              if (Col.CircleCircle({origin: obj.))
            }
          }
          for (let j = 0; j < obstacleClasses; j++){

          }
        }
      });

  
  var cell = sim.coordinateToCell
}

exports.checkSafeSpawn = checkSafeSpawn;
exports.generateIslands = generateIslands;

