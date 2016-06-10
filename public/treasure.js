
if (typeof exports === 'undefined'){
  //  Browser
  var treasure_image = new Image();
  treasure_image.src = "../media/treasure.png";
}
else{
  //  Server
  //Cannon = require('../public/cannon.js');
//  Game = require('../public/shared_game.js');
}

(function(exports){

function Treasure(sim, x, y, value, hp) {
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.cell = sim.coordinateToCell(x, y);
  this.value = value;
  this.hp = hp;


  this.onDraw = function(ctx) {
    ctx.drawImage(treasure_image, this.x-40, this.y-40, 80, 80);
  };

  this.serialize = function() {
    return { type : "treasure"
           , o : { x : this.x
                 , y : this.y
                 , value : this.value
                 , hp : this.hp } };
  };

  // No changes on tick
  this.onTick = function(dt) {
    return;
  };

  // Let ship handle this collision
  this.collisionHandler = function() {
    return;
  }
  this.getColType = function() {return "point"};
  this.getColCategory = function() {return "static";};
  this.getColObj = function() {
    return {
	    type: "treasure",
      x: this.x,
      y: this.y,
      value: this.value,
      hp: this.hp
    }
  };
  this.equals = function(o) {
    if (!(o instanceof Treasure)) {
      return false;
    } else {
      return o.cell && this.x == o.x && this.y == o.y;
    }

  }
  
}

exports.Class = Treasure;
})(typeof exports == 'undefined' ? this.Treasure = {} : exports);
