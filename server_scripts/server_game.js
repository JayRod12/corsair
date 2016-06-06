var Island = require('../public/island.js').Class;
var CosmeticIsland = require('../public/island.js').Cosmetic;
var Perlin = require('../public/perlin.js').Class;
var Treasure = require('../public/treasure.js').Class;


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
  /*
  for (var x = 0; x < islands.length; x++){
    var island_col = islands[x];
    for (var y = 0; y < island_col.length; y++){
      if (!islands[x][y]) continue;
      var neighbours = [];
      var rem = true;
      neighbours.push(
        (x > 0 && y > 0)  ? islands[x-1][y-1] : true);
      neighbours.push(
        (x > 0)            ? islands[x-1][y]   : true);
      neighbours.push(
        (x > 0 && y < yy) ? islands[x-1][y+1] : true);

      neighbours.push(
        (x < xx && y > 0)  ? islands[x+1][y-1] : true);
      neighbours.push(
        (x < xx)            ? islands[x+1][y]   : true);
      neighbours.push(
        (x < xx && y < yy) ? islands[x+1][y+1] : true);

      neighbours.push(
        (y > 0) ? islands[x][y-1] : true);
      //neighbours.push(
                   //islands[x][y]);
      neighbours.push(
        (y < yy) ? islands[x][y+1] : true);

      if (neighbours.reduce(function(x,y){return (x != null) && (y != null)}, true)){
        console.log("remming");
        sim.removeObject(islands[x][y]);
      }
    }
  }
  */
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


function generateTreasures(sim, gridNumber, cellWidth, cellHeight, treasure_num) {
  var maxHP = 80;
  var minHP = 40;
  var maxVal = 5000;
  var minVal = 500;
  var prob_val = 0.8;
  var x, y, val, hp, treasure, cell;

  // Serialized version of all treasures
  var new_treasures = [];
  for (var i = 0; i < treasure_num; i++) {
    x = Math.random() * gridNumber * cellWidth;
    y = Math.random() * gridNumber * cellHeight;
    val = Math.random() > prob_val ? Math.random() * maxVal : Math.random() * minVal;
    hp = minHP + Math.random() * (maxHP - minHP);
    treasure = new Treasure(sim, x, y, val, hp);
    cell = sim.coordinateToCell(x, y);
    cell.addObject(treasure);
    //cell.addUpdate('add_treasure', treasure);
    new_treasures.push(treasure);
  }
  Array.prototype.push.apply(sim.treasures, new_treasures);
  return new_treasures;
}


exports.generateTreasures = generateTreasures;
exports.generateIslands = generateIslands;

