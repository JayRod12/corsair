if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Game = require('../public/shared_game.js');
}

(function(exports){

function Island(sim, x, y, height, width, angle, color) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.hypotenuse = Math.sqrt(this.width*this.width + this.height*this.height);
	this.angle = angle;
	this.color = color;
  this.collided_timer = 0;
  this.collided_basetime = 400;

  this.cell = sim.coordinateToCell(x, y);

}

Island.prototype.collisionHandler = function(other_object) {
  this.collided_timer = this.collided_basetime;
}


Island.prototype.onDraw = function(ctx){
  //We translate to the origin of our island
  ctx.translate(this.x, this.y);

  //We rotate around this origin 
  ctx.rotate(this.angle);

  if (this.collided_timer > 0) {
    ctx.fillStyle = "red";
  } else {
    ctx.fillStyle = this.color;
  }    
  ctx.fillRect(0, 0, this.width, this.height);

  //We undo our transformations for the next draw/calculations
  ctx.rotate(-this.angle);
  ctx.translate(-this.x, -this.y);
}

Island.prototype.getColType = function(){return "rectangle"};
Island.prototype.getColCategory = function() {return "static";};
Island.prototype.getColObj = function(){
  return { 
    type: "island",
    x: this.x + this.width/2,
    y: this.y + this.height/2,
    width: this.width,
    height: this.height,
    hypotenuse: this.hypotenuse,
    angle: this.angle
  }
};
Island.prototype.serialize = function() {
  //return null;
  return {type: "island",
          o: { x: this.x
             , y: this.y
             , w: this.width
             , h: this.height
             , angle: this.angle
             , color: this.color } };
}



function CosmeticIsland(sim, x, y, height, width, angle, color) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.angle = angle;
	this.color = color;

  this.cell = sim.coordinateToCell(x, y);

}

CosmeticIsland.prototype.onDraw = function(ctx){
  //We translate to the origin of our island
  ctx.translate(this.x, this.y);

  //We rotate around this origin 
  ctx.rotate(this.angle);

  ctx.fillStyle = this.color;
  ctx.fillRect(0, 0, this.width, this.height);

  //We undo our transformations for the next draw/calculations
  ctx.rotate(-this.angle);
  ctx.translate(-this.x, -this.y);
}

CosmeticIsland.prototype.serialize = function() {
  return {type: "cosmetic_island",
          o: { x: this.x
             , y: this.y
             , w: this.width
             , h: this.height
             , angle: this.angle
             , color: this.color } };
}



exports.Class = Island;
exports.Cosmetic = CosmeticIsland;

})(typeof exports == 'undefined' ? this.Island = {} : exports);
