if (typeof exports === 'undefined'){

  //  Browser
  var server = false;

  //  Cannon rendering info
  var cannon_frames = new Array();
  var cannon_frame_count = 14;
  //  Load cannon frames
  for (var i = 0; i < cannon_frame_count; i++){
    var cannon_frame = new Image();
    cannon_frame.src = "../media/cannon/"+i+".png";
    cannon_frames.push(cannon_frame);
  }
  var smoke_frames = new Array();
  var smoke_frame_count = 3;
  //  Load smoke particle frames
  for (var i = 0; i < smoke_frame_count; i++){
    var smoke_frame = new Image();
    smoke_frame.src = "../media/smoke/smoke"+i+".png";
    smoke_frames.push(smoke_frame);
  }

}
else{
  //  Server
  var server = true;
  Game = require ('./shared_game.js');
  Col = require('./collision_detection.js');
  Ship = require('./ship.js');
}

(function(exports){

var cannons_per_scale = 3;

function Cannon(ship) {

  this.leftCannons = new Array();
  this.rightCannons = new Array();
  //  Initial cannons are pushed onto the arrays on the first tick when their lengths
  //  are found to be less than cannons_per_scale * ship scale

  this.ballSpeed = 0.36;
  this.spacing = 10;
  this.delay = 200;

  this.offset_info = {length_offset_x: 0, length_offset_y: 0, 
						          edge_offset_x:   0, edge_offset_y:   0, 
							        origin_offset_x: 0, origin_offset_y: 0}; 

  this.ship = ship;
  this.level = 3.5;

  this.baseCooldown = 1200;
  this.cooldowns = [10, 10];

}
  //  Used only in client
Cannon.prototype.cosmeticShoot = function(side) {

  var xdif = player.state.x - this.ship.state.x
  var ydif = player.state.y - this.ship.state.y
  var dist = xdif * xdif + ydif * ydif;
  var smother = Math.sqrt(dist)/500;
  smother = Math.max(0, smother);
  smother = Math.min(1, smother);
  SFX.broadside(this.leftCannons.length, this.delay/this.leftCannons.length,
      smother);

  var index = ((side == 1) ? 0 : 1);
  var cannonArray;
  if (index == 0) {
    cannonArray = this.leftCannons;
  } else {
    cannonArray = this.rightCannons;
  }

  for (var i = 0; i < cannonArray.length; i++) {
    var fire_delay = Math.random()*this.delay;
    //tell each 
    cannonArray[i].cosmeticFire(fire_delay);
  } 

}

Cannon.prototype.onShoot = function(side) {

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

  //  Juicy shit
  viewport.shake(15, 5);
  var seed = Math.random();
  toSendServer.push({type: "cannon_fire", uid: this.ship.uid, seed: seed, side
      : side});
  SFX.broadside(this.leftCannons.length, this.delay/this.leftCannons.length, 0.2);

  //Ask server if we are allowed to shoot (MaybeTODO)
  this.cooldowns[index] = this.baseCooldown;

  for (var i = 0; i < cannonArray.length; i++) {
    var fire_delay = Math.random()*this.delay;
    //tell each 
    cannonArray[i].fire(fire_delay);
  } 
};


Cannon.prototype.onTick = function(dt){

  //  Update the number of cannons
  this.cannonNumber = this.ship.scale*cannons_per_scale;
  if (this.cannonNumber >= this.leftCannons.length) {
   for (var i = this.leftCannons.length; i < this.cannonNumber - this.leftCannons.length; i++) {
    this.leftCannons.push(new SingleCannon(i, 1, this.ship, this));
     this.rightCannons.push(new SingleCannon(i, -1, this.ship, this)); 
    }
  }
  
  var normalising_const_origin = -1*0.3*this.ship.scale*Ship.shipDrawWidth;
  this.offset_info.origin_offset_x = normalising_const_origin*Math.cos(Col.trimBranch(this.ship.state.angle));
  this.offset_info.origin_offset_y = normalising_const_origin*Math.sin(Col.trimBranch(this.ship.state.angle));

  var normalising_const_edge = 0.5*this.ship.scale*Ship.shipHitHeight;
  this.offset_info.edge_offset_x = normalising_const_edge*Math.cos(Col.trimBranch(this.ship.state.angle + Math.PI/2));
  this.offset_info.edge_offset_y = normalising_const_edge*Math.sin(Col.trimBranch(this.ship.state.angle + Math.PI/2));

  var normalising_const_length = 0.7*this.ship.scale*Ship.shipHitWidth;
  this.offset_info.length_offset_x = normalising_const_length*Math.cos(this.ship.state.angle);
  this.offset_info.length_offset_y = normalising_const_length*Math.sin(this.ship.state.angle);
  
  if (this.cooldowns[0] > 0) this.cooldowns[0] -= dt;
  if (this.cooldowns[1] > 0) this.cooldowns[1] -= dt;

  for (var i = 0; i < this.leftCannons.length; i++) {
    this.leftCannons[i].onTick(dt);
  }
  for (var i = 0; i < this.rightCannons.length; i++) {
    this.rightCannons[i].onTick(dt);
  }
};

Cannon.prototype.onDraw = function() {
  for (var i = 0; i < this.leftCannons.length; i++) {
    this.leftCannons[i].onDraw();
  }
  for (var i = 0; i < this.rightCannons.length; i++) {
    this.rightCannons[i].onDraw();
  }
};

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

function CannonBall(sim, uid, state, level) {

  this.sim = sim;
  this.uid = uid;
  this.state = state;
  this.level = level;
  this.despawn_init = 2500;
  this.despawn = this.despawn_init;
  this.angle = Math.atan2(this.state.yvel, this.state.xvel);
  this.abs_cos_angle = Math.abs(Math.cos(this.angle));

  this.trail_length = 12;
  this.trail_points = [];
  for (var i = 0; i < this.trail_length; i++){
    this.trail_points[i] = {x:this.state.x, y:this.state.y};
  }

  if (typeof this.uid === "undefined") console.log(this);

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.despawn < 0) {
      if (this.cell){
        this.sim.removeObject(this);
      }
      return;
    }

    this.state.x += dt * this.state.xvel;
    this.state.y += dt * this.state.yvel;
    this.despawn -= dt;
    Game.updateCell(this.sim, this, this.state.x, this.state.y);
  };

  //  TODO USE SERIALIZED OBJECTS INSTEAD OF COL OBJS
  this.getColType = function(){return "point"};
  this.getColCategory = function(){return "dynamic";};
  this.getColObj = function(){
    return {type: "cannonball", x: this.state.x, y: this.state.y, uid: this.uid,
    level: this.level, xvel: this.state.xvel, yvel: this.state.yvel};
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


  if (!server){
  //  Calculated by substituting t/2 into y = -x(x-t)
  //  ie maximum height, ymax = t^2 / 4
  this.parabolaNormalise = 4 / Utils.sqr(this.despawn_init);
  this.parabolaConst = 60*this.parabolaNormalise;
  }

  this.onDraw = function(ctx) {

    //  Y based on arc of shot
    //  Quadratic in t (time alive) converted to terms of despawn (time until
    //  destroyed)
    var parabolaY = this.state.y-this.abs_cos_angle*this.parabolaConst*(this.despawn_init - this.despawn)*
        (this.despawn);

    //  Shift down
    this.trail_points.splice(0, 1);
    this.trail_points[this.trail_length - 1] = {x:this.state.x, y:parabolaY}

    var radius = this.level;
    ctx.beginPath();
    ctx.arc(this.state.x, parabolaY, radius, 2 * Math.PI, false);
    ctx.fillStyle = "black";
    ctx.fill();

    //  Shadow
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, radius, 2 * Math.PI, false);
    ctx.fillStyle = "black";
    ctx.fill();

    //  Trail
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.moveTo(this.state.x, parabolaY);
    ctx.lineTo(this.trail_points[0].x, this.trail_points[0].y);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  this.handler = handler;
  this.fired = false;
 
  //Calculated position of cannons
  this.offset_x;
  this.offset_y; 
  
  this.fire_delay = 0;
  this.fire_timer = 0;
  this.cur_frame = 0; 
  this.cosmetic = false;

  this.cosmeticFire = function(fire_delay) {
	this.fire_delay = fire_delay;
    this.fire_timer = fire_delay;
    this.fired = true;
    this.cosmetic = true;
  }
  
  this.fire = function(fire_delay) {
	this.fire_delay = fire_delay;
    this.fire_timer = fire_delay;
    this.fired = true;
    this.cosmetic = false;
  }
  
  this.onTick = function(dt) {
    var index_specific_length = ((this.handler.cannonNumber/2) - this.index)/(this.handler.cannonNumber/2);
    	this.offset_x = this.handler.offset_info.origin_offset_x + this.side*this.handler.offset_info.edge_offset_x 
						+ (index_specific_length*this.handler.offset_info.length_offset_x);
    	this.offset_y = this.handler.offset_info.origin_offset_y + this.side*this.handler.offset_info.edge_offset_y 
						+ (index_specific_length*this.handler.offset_info.length_offset_y);

    if (this.fired) {
     if (this.fire_timer > 0) {
       this.fire_timer -= dt;
     } else {
       if (!this.cosmetic){
        var ball = cannonBallFromLocal(ship, this.offset_x, this.offset_y, this.side, handler.ballSpeed, handler.level);
         toSendServer.push(ball.serialize());
        var cell = ship.sim.coordinateToCell(ship.state.x + this.offset_x,
                                             ship.state.y + this.offset_y);
        cell.addObject(ball);
       }
       var driftvel = 0.006
       var driftdir = Utils.randAngle();
       var xvel = ship.state.speed * Math.cos(ship.state.angle) / 5 + driftvel *
         Math.cos(driftdir);
       var yvel = ship.state.speed * Math.sin(ship.state.angle) / 5 + driftvel *
         Math.sin(driftdir);
       var frame = Utils.randInt(smoke_frame_count);
       var width = Utils.randBetween(16, 48);
       var height = Utils.randBetween(16, 48);
       var smoke = new Smoke(sim,ship.state.x + this.offset_x, ship.state.y + 
           this.offset_y, xvel, yvel, Utils.randAngle(), width,
           height, frame);
       if (smoke.cell) smoke.cell.addObject(smoke, 0.3);
        this.fired = false;
		this.cur_frame = 1;
     } 
   }
 }

  this.onDraw = function() {
	var x = ship.state.x + this.offset_x;
    var y = ship.state.y + this.offset_y;

    ctx.translate(x, y);

	var angle = this.ship.state.angle;
	if (this.side == -1) {
		angle += Math.PI;
	}
    ctx.rotate(angle);
    

  var frame = cannon_frames[0];
	if (this.cur_frame > 0) {
		frame = cannon_frames[this.cur_frame];
		this.cur_frame = (this.cur_frame + 1) % cannon_frames.length;
	}
	//scaling cannons
	//ctx.drawImage(frame, -(frame.width*this.ship.scale*125)/(2*384), -(frame.height*this.ship.scale*125)/(2*384), this.ship.scale*125, this.ship.scale*125);
    ctx.drawImage(frame, -(frame.width*125)/(2*384), -(frame.height*125)/(2*384), 125, 125);

    ctx.rotate(-angle);
    ctx.translate(-x, -y);
  }
}

function Smoke(sim, x, y, xvel, yvel, angle, width, height, frame){
  this.sim = sim;
  this.x = x;
  this.y = y;
  this.cell = this.sim.coordinateToCell(this.x, this.y);
  this.xvel = xvel;
  this.yvel = yvel;
  this.angle = angle;
  this.width = width;
  this.height = height;
  this.frame = frame;
  this.alpha = 1;
  this.onTick = function (dt){
    this.x += this.xvel * dt;
    this.y += this.yvel * dt;
    this.alpha -= dt * 1/5000;
    if (this.alpha <= 0) this.cell.removeObject(this);
    else Game.updateCell(this.sim, this, this.x, this.y);
  }

  this.onDraw = function(ctx){
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(smoke_frames[this.frame], -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 1;
  }
}


exports.Class = Cannon;
exports.CannonBall = CannonBall;

})(typeof exports == 'undefined' ? this.Cannon = {} : exports);
