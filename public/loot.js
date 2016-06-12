if (typeof exports === 'undefined'){
  //  Browser
  var server = false;
}
else{
  //  Server
  //Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
  Ship = require('../public/ship.js');
  var server = true;
}

(function(exports){

var lootSatMin = 78;
var lootSatMax = 100;

var lootLight = 87;

var lootPerScale = 4;

var lootHueMin = 40
var lootHueMax = 50

var valueToRadius = 1/4;

function Loot(sim, x, y, value, color) {

  this.sim = sim;

  this.x = x;
  this.y = y;
  this.value = value;
  this.cell = this.sim.coordinateToCell(this.x, this.y);

  if (typeof color === "undefined"){
    var sat = lootSatMin + Math.floor((lootSatMax - lootSatMin)*Math.random());
    var hue = lootHueMin + Math.floor((lootHueMax - lootHueMin)*Math.random());
    this.color = "hsl("+hue+", "+sat+"%, "+lootLight+"%)";
  }
  else{
    this.color = color;
  }
  
  this.onDraw = function(ctx) {
    //  Temporary draw function
    ctx.fillStyle = this.color;
    //ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.x,this.y,valueToRadius*this.value,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

  }
  this.getColType = function(){return "point"};
  this.getColCategory = function(){return "static";};
  this.getColObj = function(){
    return {
      type: "loot",
      x: this.x,
      y: this.y,
      value: this.value,
      color: this.color
    }
  };

  this.onDeath = function(){
    if (server) return;
    SFX.playPickup();
    for (var i = 0; i < 5; i++){
      var angle = Math.random() * 2 * Math.PI;
      var grow_rate = 0.003 * this.value;
      var part = new LootParticle(this.sim, this.x, this.y, angle,
          grow_rate, this.color);
      if (part.cell) part.cell.addObject(part, 0.7);
    }
  }

  this.collisionHandler = function(other_object) {
  }

  this.serialize = function() {
    return {type: "loot",
            o: { x: this.x
               , y: this.y
               , value: this.value
               , color: this.color } };
  }

  this.equals = function(o) {
    if (!(o instanceof Loot)) {
      return false;
    } else {
      return this.x == o.x && this.y == o.y && this.value == o.value;
    }

  }
}

function LootParticle(sim, x, y, angle, grow_rate, color){
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.cell = this.sim.coordinateToCell(this.x, this.y);
  this.grow_rate = grow_rate;
  this.color = color;
  this.size = 0;
  this.alpha = 1;
  this.angle = angle;
  this.onTick = function (dt){
    this.size += grow_rate * dt;
    this.alpha -= dt * 1/2000;
    if (this.alpha <= 0) this.cell.removeObject(this);
  }

  this.onDraw = function(ctx){
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = color; 
    ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 1;
  }
}

exports.lootPerScale = lootPerScale;

exports.Class = Loot;

})(typeof exports == 'undefined' ? this.Loot = {} : exports);
