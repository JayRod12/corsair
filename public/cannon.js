if (typeof exports === 'undefined'){
  //  Browser
  var cannon_frames = new Array();
  var cannon_frame_count = 14;
  for (var i = 0; i < cannon_frame_count; i++){
    var cannon_frame = new Image();
    cannon_frame.src = "../media/cannon/"+i+".png";
    cannon_frames.push(cannon_frame);
  }
}
else{
  Game = require ('./shared_game.js');
  Col = require('./collision_detection.js');
  Ship = require('./ship.js');
  //  Server
}

(function(exports){

var initialCannons = 3;

function Cannon(ship) {

  this.leftCannons = new Array();
  this.rightCannons = new Array();

  this.cannonNumber = initialCannons;
  this.ballSpeed = 0.25;
  this.spacing = 10;
  this.delay = 200;

	for (var i = 0; i < initialCannons; i++) {
    this.leftCannons.push(new SingleCannon(i, 1, ship, this));
    this.rightCannons.push(new SingleCannon(i, -1, ship, this)); 
  }

  this.offset_info = {length_offset_x: 0, length_offset_y: 0, 
						edge_offset_x: 0, edge_offset_y: 0, 
							origin_offset_x: 0, origin_offset_y: 0}; 

  this.ship = ship;
  this.level = 2;

  this.baseCooldown = 1200;
  this.cooldowns = [10, 10];

  
  this.onShoot = function(side) {

    //Ask server if we are allowed to shoot (MaybeTODO)
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
  };

  var cannon_scale = 10;
  
  this.onTick = function(dt){
    //update the number of cannons
    this.cannonNumber = this.ship.scale*cannon_scale;
	    if (this.cannonNumber >= this.leftCannons.length) {
	     for (var i = this.leftCannons.length; i < this.cannonNumber - this.leftCannons.length; i++) {
	      this.leftCannons.push(new SingleCannon(i, 1, ship, this));
         this.rightCannons.push(new SingleCannon(i, -1, ship, this)); 
	      }
	    }
    
    var normalising_const_origin = -1*0.3*this.ship.scale*Ship.shipDrawWidth;
  	this.offset_info.origin_offset_x = normalising_const_origin*Math.cos(Col.trimBranch   (this.ship.state.angle));
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

  this.onDraw = function() {
    for (var i = 0; i < this.leftCannons.length; i++) {
      this.leftCannons[i].onDraw();
    }
    for (var i = 0; i < this.rightCannons.length; i++) {
      this.rightCannons[i].onDraw();
    }
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

function CannonBall(sim, uid, state, level) {

  this.sim = sim;
  this.uid = uid;
  this.state = state;
  this.level = level;
  this.despawn = 2500;

  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.onTick = function(dt) {
    if (this.despawn < 0) {
      this.sim.removeObject(this);
    }
    this.state.x += dt * this.state.xvel;
    this.state.y += dt * this.state.yvel;
    this.despawn -= dt;
    Game.updateCell(this.sim, this, this.state.x, this.state.y);
  };

  this.getColType = function(){return "point"};
  this.getColCategory = function(){return "dynamic";};
  this.getColObj = function(){
    return {x: this.state.x, y: this.state.y};
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
  
  //this.cur_frame = 0;
  this.fire_delay = 0;
  this.fire_timer = 0;
  this.cur_frame = 0; 
  
  this.fire = function(fire_delay) {
	this.fire_delay = fire_delay;
    this.fire_timer = fire_delay;
    this.fired = true;
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
        var ball = cannonBallFromLocal(ship, this.offset_x, this.offset_y, this.side, handler.ballSpeed, handler.level);
         toSendServer.push(ball.serialize());
        var cell = ship.sim.coordinateToCell(ship.state.x,ship.state.y);
        cell.addObject(ball);
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


exports.Class = Cannon;
exports.CannonBall = CannonBall;

})(typeof exports == 'undefined' ? this.Cannon = {} : exports);
