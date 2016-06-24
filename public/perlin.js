if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
}

(function(exports){

function Perlin(gridWidth, gridHeight, octaves, persistence){

  this.gridWidth = gridWidth;
  this.gridHeight = gridHeight;
  this.octaves = octaves;
  this.persistence = persistence;

  this.grid = [];
  this.smoothed = [];
  for (var i = 0; i < this.gridWidth; i++){
    this.smoothed.push([]);
  }
  for (var x = 0; x <= this.gridWidth; x++){
    var col = [];
    for (var y = 0; y <= this.gridHeight; y++){
      col.push(Math.random());
    }
    this.grid.push(col);
  }
  for (var x = 0; x < this.gridWidth; x++){
    for (var y = 0; y < this.gridHeight; y++){
      this.smooth(x, y);
    }
  }
}

//  Basic smoothing
Perlin.prototype.smooth = function(x, y){

  var xPrev = (x-1<0) ? this.gridWidth-1 : x-1;
  var xNext = (x+1>=this.gridWidth) ? 0 : x+1;

  var yPrev = (y-1<0) ? this.gridHeight-1 : y-1;
  var yNext = (y+1>=this.gridHeight) ? 0 : y+1;


  corners = (
      this.grid[xPrev][yPrev]+this.grid[xNext][yPrev]+this.grid[xPrev][yNext]+this.grid[xNext][yNext]
      ) / 16;
  sides = ( this.grid[xPrev][y]+this.grid[xNext][y]+this.grid[x][yNext]+this.grid[x][yNext]
      ) / 8;
  centre = this.grid[x][y]/4;

  this.smoothed[x][y] = corners + sides + centre;
}

Perlin.prototype.perlin = function(x, y){

  var total = 0;
  var norm = 0;
  
  for (var i = 0; i < this.octaves; i++){
    var f = Math.pow(2, i);
    var a = Math.pow(this.persistence, i);
    norm += a;

    var mult = this.gridWidth;
    var ix, iy;
    total += this.interpolateNoise(x * f * this.gridWidth, y * f * this.gridHeight) * a;
  }
  return total / norm;
}

/*
var perlin_color = function (x, y){
  var l = perlin(x, y);
  if (l > sealevel){
    var c = "hsl("+landHue.toString() + ", " + landSat.toString() +
      "%, " + (l*100).toString() +"%)";
  }
  else{
    var c = "hsl("+seaHue.toString() + ", " + seaSat.toString() +
    "%, " + (l*100).toString() +"%)";
  }

}
*/

Perlin.prototype.interpolateNoise = function(x, y){
  var intx = Math.floor(x);
  var intx_suc = intx+1;
  var inty = Math.floor(y);
  var inty_suc = inty+1;

  var fracx = x - intx;
  var fracy = y - inty;

  intx = intx % this.gridWidth;
  intx_suc = intx_suc % this.gridWidth;
  inty = inty % this.gridHeight;
  inty_suc = inty_suc % this.gridHeight;

  var i1 = lerp(this.smoothed[intx][inty], this.smoothed[intx_suc][inty], fracx);
  var i2 = lerp(this.smoothed[intx][inty_suc], this.smoothed[intx_suc][inty_suc], fracx);

  var ret = lerp(i1, i2, fracy);
  //fade(ret);
  return ret;
}

function lerp(a, b, x){
  return a + x * (b-a);
}

function fade(t){
  return t * t * t * (t * (t * 6 - 15) + 10); // 6t^5 - 15t^4 + 10t^3
}

exports.Class = Perlin;

})(typeof exports == 'undefined' ? this.Perlin = {} : exports);
