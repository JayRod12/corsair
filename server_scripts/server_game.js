var Island = require('../public/island.js').Class;
var Perlin = require('../public/perlin.js').Class;


function generateIslands(sim, gridNumber, cellWidth, cellHeight){
  var perlin = new Perlin(8 * gridNumber, 8 * gridNumber, 5, 0.5);
  var island_size = 32;
  var sea_level = 0.64;
  var max_x = gridNumber * cellWidth;
  var max_y = gridNumber * cellHeight;
  for (var y = 0; y < max_y; y+= island_size){
    console.log("Generating islands: " + y + "/" + Math.floor(max_y/island_size));
    for (var x = 0; x < max_x; x+= island_size){
      var l = perlin.perlin(x / max_x, y / max_y);
      if (l > sea_level){
        var color = "green";
        var i = new Island(x, y, island_size, island_size, 0, color);
        sim.coordinateToCell(x,y).gameObjects.push(i);
      }
    }
  }
}

exports.generateIslands = generateIslands;

