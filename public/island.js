if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  //Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
}

(function(exports){

function Island(x, y, height, width, angle, colour, onDraw) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.angle = angle;
	this.colour = colour;
  this.collided_timer = 0;
	this.onDraw = onDraw;
  this.collided_basetime = 400;

  this.onTick = function(dt) {
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }
  }

  this.collisionHandler = function(other_object) {
    //expect instanceoffing
    this.collided_timer = this.collided_basetime;
    other_object.collided_timer = other_object.collided_basetime;
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
      ctx.fillStyle = this.colour;
    }    
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

      //We undo our transformations for the next draw/calculations
      ctx.rotate(-this.angle);
      ctx.translate(-this.x, -this.y);
  }

  this.getColType = function(){return "rectangle"};
  this.getColObj = function(){
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      angle: this.angle
    }
  };


}

exports.Class = Island;

})(typeof exports == 'undefined' ? this.Island = {} : exports);
