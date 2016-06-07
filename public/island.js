if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  //Cannon = require('../public/cannon.js');
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

  this.collisionHandler = function(other_object) {
    //expect instanceoffing
    this.collided_timer = this.collided_basetime;
  }

  this.onDraw = function(ctx){
    //We translate to the origin of our island
      ctx.translate(this.x, this.y);

      //We rotate around this origin 
      ctx.rotate(this.angle);

        //We draw the ship, ensuring that we start drawing from the correct location 
      //(the fillRect function draws from the topmost left corner of the rectangle 
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

  this.getColType = function(){return "rectangle"};
  this.getColCategory = function() {return "static";};
  this.getColObj = function(){
    return {
      x: this.x + this.width/2,
      y: this.y + this.height/2,
      width: this.width,
      height: this.height,
	  hypotenuse: this.hypotenuse,
      angle: this.angle
    }
  };
  this.serialize = function() {
    return {type: "island",
            o: { x: this.x
               , y: this.y
               , w: this.width
               , h: this.height
               , angle: this.angle
               , color: this.color } };
  }



}

function CosmeticIsland(sim, x, y, height, width, angle, color) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.angle = angle;
	this.color = color;

  this.cell = sim.coordinateToCell(x, y);

  this.onDraw = function(ctx){
    //We translate to the origin of our island
      ctx.translate(this.x, this.y);

      //We rotate around this origin 
      ctx.rotate(this.angle);

        //We draw the ship, ensuring that we start drawing from the correct location 
      //(the fillRect function draws from the topmost left corner of the rectangle 
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

  this.serialize = function() {
    return {type: "cosmetic_island",
            o: { x: this.x
               , y: this.y
               , w: this.width
               , h: this.height
               , angle: this.angle
               , color: this.color } };
  }


}

exports.Class = Island;
exports.Cosmetic = CosmeticIsland;

})(typeof exports == 'undefined' ? this.Island = {} : exports);
