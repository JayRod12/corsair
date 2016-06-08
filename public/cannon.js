if (typeof exports === 'undefined'){
  //  Browser
}
else{
  Game = require ('./shared_game.js');
  Col = require('./collision_detection.js');
  Ship = require('./ship.js');
  //  Server
}

(function(exports){

var initialCannons = 10;


function Cannons(ship) {

  //left and right arrays of cannons
  this.leftCannons = new Array();
  this.rightCannons = new Array();

  //cannon and cannonball params
  //this.cannons = 12;
  this.cannonNumber = initialCannons;
  this.ballSpeed = 0.4;
  this.spacing = 10;
  this.delay = 200;

  for (var i = 0; i < initialCannons; i++) {
    this.leftCannons.push(new SingleCannon(i, 1, ship, this));
    this.rightCannons.push(new SingleCannon(i, -1, ship, this)); 
  }

 

  
  
  //owner of these cannons
  this.ship = ship;
  this.level = 2;

  this.baseCooldown = 1200;
  this.cooldowns = [10, 10];

  //this.futureShots = [];  //  List of future firing events

  this.onShoot = function(side) {

    //Ask server if we are allowed to shoot (MaybeTODO), DAN: why do we do this?
    var index = ((side == 1) ? 0 : 1);

    var cannonArray;
    if (index == 0) {
      cannonArray = this.leftCannons;
    } else {
      cannonArray = this.rightCannons;
    }

    var cooldown = this.cooldowns[index];

    if (cooldown > 0) return false;

    //otherwise, we're firing!
    this.cooldowns[index] = this.baseCooldown;

    for (var i = 0; i < cannonArray.length; i++) {
      var fire_delay = Math.random()*this.delay;
      //tell each 
      cannonArray[i].fire(fire_delay);
    } 
    











    /*
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
        var ball = cannonBallFromLocal(ship, offsetX, offsetY, side, ballSpeed, level);
        toSendServer.push(ball.serialize());
        var cell = ship.sim.coordinateToCell(ship.state.x,ship.state.y);
        cell.gameObjects.push(ball);
      }

      this.futureShots.push({time: i*this.delay, f : shot, i: i});
    }
*/
  };

  this.onTick = function(dt){
    if (this.cooldowns[0] > 0) this.cooldowns[0] -= dt;
    if (this.cooldowns[1] > 0) this.cooldowns[1] -= dt;

    for (var i = 0; i < this.leftCannons.length; i++) {
      this.leftCannons[i].onTick(dt);
    }

    for (var i = 0; i < this.rightCannons.length; i++) {
      this.rightCannons[i].onTick(dt);
    }
/*
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
    }*/
  };

	
}


function cannonBallFromLocal(ship, offsetX, offsetY, side, ballSpeed, level){
  var sim = ship.sim;

  var angle = Col.trimBranch(ship.state.angle + side * Math.PI / 2);

  var state = { x : ship.state.x + offsetX
               , y : ship.state.y + offsetY
               , xvel: (ship.state.speed * Math.cos(ship.state.angle))/4 + ballSpeed * Math.cos(angle)
               , yvel: (ship.state.speed * Math.sin(ship.state.angle))/4 +
               ballSpeed * Math.sin(angle)
  };
  return new CannonBall(sim, ship.uid, state, level);
  
}

/*
function cannonballFromRemote(sim, x, y, xvel, yvel, ){

}
*/

function CannonBall(sim, uid, state, level) {

  this.sim = sim;
  this.uid = uid;
  this.state = state;
  this.level = level;

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.state.life == 0) {
      this.sim.removeObject(this);
    }
    this.state.x += dt * this.state.xvel;
    this.state.y += dt * this.state.yvel;
    this.life -= 1;
    Game.updateCell(this.sim, this, this.state.x, this.state.y);
  };

  this.getColType = function(){return "point"};
  this.getColObj = function(){
    return {type: "cannonball", uid: this.uid, level: this.level, x: this.state.x, y: this.state.y};
  }


  this.collisionHandler = function(other_object){
    //if (typeof other_object == Ship.Class && other_object.uid == this.uid){
    if (other_object.uid == this.uid){
    }
    else{
      this.destroy();
    }
  }

  this.destroy = function(){
    this.sim.removeObject(this);
  }

  this.onDraw = function(ctx) {
    var radius = this.level;
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, radius, 2 * Math.PI, false);
    ctx.fillStyle = "black";
    ctx.fill();
//debugger;
  }
  this.serialize = function() {
    return {type: "cannonball",
            o: { x: this.state.x
               , y: this.state.y
               , xvel: this.state.xvel
               , yvel: this.state.yvel
               , uid: this.uid
               , level: this.level}};
  }
}

function SingleCannon(index, side, ship, handler) {
  this.index = index;
  this.side = side;
  this.ship = ship;
  this.fired = false;
  
  this.fire_timer = 0;
  
  this.fire = function(fire_delay) {
   // console.log("holy shit did that acutally work first time");
    this.fire_timer = fire_delay;
    this.fired = true;
  }
  
  this.onTick = function(dt) {
    //console.log("NOW WE ARE HERE");
    if (this.fired) {
     if (this.fire_timer > 0) {
       this.fire_timer -= dt;
     } else {
        var offsetX = handler.spacing * (handler.cannonNumber - this.index) * Math.cos(ship.state.angle);
        var offsetY = handler.spacing * (handler.cannonNumber - this.index) * Math.sin(ship.state.angle);

   //     console.log(ship.level);
        var ball = cannonBallFromLocal(ship, offsetX, offsetY, this.side, handler.ballSpeed, handler.level);
         toSendServer.push(ball.serialize());
        var cell = ship.sim.coordinateToCell(ship.state.x,ship.state.y);
        cell.gameObjects.push(ball);
        this.fired = false;
     } 
    }
  }
}

exports.Class = Cannons;
exports.CannonBall = CannonBall;

})(typeof exports == 'undefined' ? this.Cannon = {} : exports);
