if (typeof exports === 'undefined'){
  //  Browser
}
else{
  Game = require ('../public/shared_game.js');
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
  this.cooldown = 0;

  this.futureShots = [];  //  List of future firing events

  this.onShoot = function(side) {

    if (this.cooldown > 0) return false;
    this.cooldown = this.baseCooldown;

    console.log('Ship direction: ' + this.ship.state.angle);



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
    if (this.cooldown > 0) this.cooldown -= dt;
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

  console.log(offsetX);

  this.sim = ship.sim;
  this.ship = ship; 
  this.level = level;

  var angle = ((-ship.state.angle - side * Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));

  this.state = { x : ship.state.x + offsetX
               , y : ship.state.y + offsetY
               , xvel: ship.state.speed * Math.cos(-ship.state.angle) + speed * Math.cos(angle)
               , yvel: ship.state.speed * Math.sin(-ship.state.angle) + speed * Math.sin(angle)
  };

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.state.life == 0) {
      this.sim.removeObject(this);
    }
    // TODO interpolation with remote state
    this.state.x += dt * this.state.xvel;
    this.state.y -= dt * this.state.yvel;
    this.life -= 1;
    Game.updateCell(this.sim, this, this.state.x, this.state.y);
  };
  this.onDraw = onDraw;

}

exports.Class = Cannon;
exports.Ball = CannonBall;

})(typeof exports == 'undefined' ? this.Cannon = {} : exports);