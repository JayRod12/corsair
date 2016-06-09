if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  //Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
}

(function(exports){

var lootSat = 33;
var lootLight = 87;

//  Radius = value * const
var lootValueRadConst = 4;

function Loot(x, y, value) {

  this.x = x;
  this.y = y;
  this.value = value;

  this.hue = Math.floor(360*Math.random());
  this.color = "hsl("+"hue, "+lootSat+"%, "+lootLight+"%)";
  
  this.onDraw = function(ctx) {

    //  Temporary draw function
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,lootValueRadConst*this.value,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

  }
  this.getColType = function(){return "circle"};
  this.getColCategory = function(){return "static";};
  this.getColObj = function(){
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
	    hypotenuse: this.hypotenuse,
      angle: this.angle
    }
  };

  this.collisionHandler = function(other_object) {
    //expect instanceoffing
    this.collided_timer = this.collided_basetime;
  }

  this.serialize = function() {
    return {type: "loot",
            o: { x: this.x
               , y: this.y
               , value: this.value
               , color: this.color } };
  }
}

exports.Class = Loot;
})(typeof exports == 'undefined' ? this.Loot = {} : exports);
