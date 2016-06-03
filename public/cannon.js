if (typeof exports === 'undefined'){
  //  Browser
}
else{
  Game = require ('./shared_game.js');
  Col = require('./collision_detection.js');
  //  Server
}

(function(exports){

function Cannon(ship, onDraw) {

  this.ballSpeed = 0.3;
  this.cannons = 5;
  this.spacing = 15;
  this.delay = 30;
  this.ship = ship;
  this.level = 3;
  this.onDraw = onDraw;

  this.baseCooldown = 1200;
  this.cooldowns = [10, 10];

  this.futureShots = [];  //  List of future firing events

  this.onShoot = function(side) {

    var index;
    var index = ((side == 1) ? 0 : 1);
    var cooldown = this.cooldowns[index];
    console.log(cooldown);

    if (cooldown > 0) return false;

    this.cooldowns[index] = this.baseCooldown;


    for (var i = 0; i < this.cannons; i++){

      var ship = this.ship;
      var level = this.level;
      var onDraw = this.onDraw;
      var ballSpeed = this.ballSpeed;
      var spacing = this.spacing;
      var cannons = this.cannons;

      var shot = function(i){
        var offsetX = spacing * (cannons / 2 - i) * Math.cos(ship.state.angle);
        var offsetY = spacing * (cannons / 2 - i) * Math.sin(ship.state.angle);
        var ball = new CannonBall(ship, offsetX, offsetY, side, ballSpeed, onDraw, level);
        var cell = ship.sim.coordinateToCell(ship.state.x,ship.state.y);
        cell.gameObjects.push(ball);
      }

      this.futureShots.push({time: i*this.delay, f : shot, i: i});
    }

  };

  this.onTick = function(dt){
    if (this.cooldowns[0] > 0) this.cooldowns[0] -= dt;
    if (this.cooldowns[1] > 0) this.cooldowns[1] -= dt;

    for (var i = 0; i < this.futureShots.length; i++){
      //  Inefficient?
      //this.futureShots[i] = {time: this.futureShots[i].time - dt, f:
        //this.futureShots[i].f};
      this.futureShots[i].time -= dt;
      if (this.futureShots[i].time < 0){
        this.futureShots[i].f(this.futureShots[i].i);
        this.futureShots.splice(i,1);
        i = i - 1;
      }
    }
  };
}

function CannonBall(ship, offsetX, offsetY, side, speed, onDraw, level) {

  this.sim = ship.sim;
  this.ship = ship; 
  this.level = level;

  var angle = Col.trimBranch(ship.state.angle - side * Math.PI / 2);

  this.state = { x : ship.state.x + offsetX
               , y : ship.state.y + offsetY
               , xvel: ship.state.speed * Math.cos(ship.state.angle)/2 + speed * Math.cos(angle)
               , yvel: ship.state.speed * Math.sin(ship.state.angle)/2 + speed * Math.sin(angle)
  };

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.state.life == 0) {
      this.sim.removeObject(this);
    }
    // TODO interpolation with remote state
    this.state.x += dt * this.state.xvel;
    this.state.y += dt * this.state.yvel;
    this.life -= 1;
    Game.updateCell(this.sim, this, this.state.x, this.state.y);
  };
  this.onDraw = onDraw;

  this.getColType = function(){return "point"};
  this.getColObj = function(){
    return {x: this.state.x, y: this.state.y};
  }
  this.collisionHandler = function(other_object){
    if (other_object !== this.ship){
      this.destroy();
    }
  }

  this.destroy = function(){
    this.sim.removeObject(this);
  }

}

exports.Class = Cannon;
exports.Ball = CannonBall;

})(typeof exports == 'undefined' ? this.Cannon = {} : exports);
