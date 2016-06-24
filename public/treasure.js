
if (typeof exports === 'undefined'){
  //  Browser
  var treasure_image = new Image();
  treasure_image.src = "../media/treasure.png";
}
else{
  //  Server
}

(function(exports){

function Treasure(sim, x, y, value, hp) {
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.cell = sim.coordinateToCell(x, y);
  this.value = value;
  this.hp = hp;
}


Treasure.prototype.onDraw = function(ctx) {
  ctx.drawImage(treasure_image, this.x-40, this.y-40, 80, 80);
};

Treasure.prototype.serialize = function() {
  return { type : "treasure"
         , o : { x : this.x
               , y : this.y
               , value : this.value
               , hp : this.hp } };
};

// Let ship handle this collision
Treasure.prototype.collisionHandler = function() {
  return;
}

Treasure.prototype.getColType = function() {return "point"};

Treasure.prototype.getColCategory = function() {return "static";};

Treasure.prototype.getColObj = function() {
  return {
    type: "treasure",
    x: this.x,
    y: this.y,
    value: this.value,
    hp: this.hp
  }
};

Treasure.prototype.equals = function(o) {
  if (!(o instanceof Treasure)) {
    return false;
  } else {
    return o.cell && this.x == o.x && this.y == o.y;
  }

}

exports.Class = Treasure;
})(typeof exports == 'undefined' ? this.Treasure = {} : exports);
