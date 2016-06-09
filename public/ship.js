//NEW
var loadGraphics = false;
if (typeof exports === 'undefined'){
  loadGraphics = true;
  //  Browser
  var ship_image1 = new Image();
  ship_image1.src = "../media/ship1NU.png";
  var ship_image2 = new Image();
  ship_image2.src = "../media/ship2NU.png";
  var symimage = new Image();
  symimage.src = "../media/symship.png";
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
  Col = require('../public/collision_detection.js');
}

(function(exports){

//  Inputfunction determines updates to the ship
//  onDraw can be null
function Ship(sim, state, uid, name, inputFunction){

  // Simulation in which the ship is.
  this.sim = sim;
  this.uid = uid;
  this.name = name;

  this.hp = 100;
  this.speed_cap = 0.8;

  //UPDATE THIS WHEN SCALE IS UPDATED.
  this.hypotenuse = Math.sqrt(shipHitWidth*shipHitWidth 
                              + shipHitHeight*shipHitHeight);
 
  //  Should contain:
  //  x, y, angle, speed
  this.state = state;
  this.cell = this.sim.coordinateToCell(this.state.x, this.state.y);

  this.collided_basetime = 400;

  this.collided_timer = 0;

  this.getRemoteState = function(){
    return sim.remote.getRemoteStates()[this.uid];
  };

  // Scale of the ship ?
  this.scale = 1.5;

  this.cannon = new Cannon.Class(this);
  this.inputFunction = inputFunction;

  this.onTick = function(dt){
	this.scale = this.scale + 0.01;

	
    var remoteState = this.getRemoteState();

    //decrement collision_timer to notify other functionalities
    if(this.collided_timer > 0) {
      this.collided_timer -= dt;
    }

    //  If player has left the server remove their ship from the sim
    //  TODO might cause 'ghost ships', player removed on local simulation
    //  but stille exists on server
    if (typeof remoteState == "undefined" || this.hp < 0){
      if (this.name == "tom"){
        this.hp = 100;
        return;
      }
      sim.removeObject(this);
      return;
    }

    //  Updates speed and angle
    if (!(this.collided_timer > 300)) {
    this.inputFunction();
    }

    this.state.speed = Math.min(this.state.speed, this.speed_cap);
    this.state.x += this.state.speed * Math.cos(this.state.angle) * dt;
    this.state.y += this.state.speed * Math.sin(this.state.angle) * dt;


    //  TODO better interpolation
    if (remoteState){
      this.state.x = (this.state.x + remoteState.x) / 2
      this.state.y = (this.state.y + remoteState.y) / 2
    }
    Game.updateCell(this.sim, this, this.state.x, this.state.y);

    this.cannon.onTick(dt);

  }

  this.collisionHandler = function(other_object) {
	  /*TODO: different cases (possibly) i.e. what if 
  		it's a cannonball I've collided with?*/
    if (other_object.type == "cannonball"){
      if (other_object.uid == this.uid) return;
        //else decrement hp w.r.t. cannonball
        this.hp -= other_object.level;
    }

    if (other_object.type == "ship") {
      console.log("get to the update");
      var intersect_angle = Math.atan2(this.state.y - other_object.y, this.state.x - other_object.x);
      console.log(intersect_angle);
      console.log("angle: "+ other_object.angle);
      console.log("speed: " + other_object.speed);
      var x_speed_update = (other_object.speed
                            *Math.cos(Col.trimBranch(other_object.angle - intersect_angle))
                            *Math.cos(intersect_angle))
                            + (this.state.speed*Math.sin(Col.trimBranch(this.state.angle - intersect_angle))
                              *Math.cos(Col.trimBranch(intersect_angle + Math.PI/2)));
    console.log(x_speed_update);
   

      var y_speed_update = (other_object.speed
                            *Math.cos(Col.trimBranch(other_object.angle - intersect_angle))
                            *Math.sin(intersect_angle))
                            + (this.state.speed*Math.sin(Col.trimBranch(this.state.angle - intersect_angle))
                               *Math.sin(Col.trimBranch(intersect_angle + Math.PI/2)));
      console.log(y_speed_update);
      this.state.speed = Math.sqrt(x_speed_update*x_speed_update + y_speed_update*y_speed_update);
      this.state.angle = Col.trimBranch(Math.atan2(y_speed_update, x_speed_update));
    }

    
   this.collided_timer = this.collided_basetime;
   //decrement health & handle physics;
  }

  this.default_colour = "black";

  this.wait = 0;

  this.onDraw = function(ctx){

	//first, draw cannons
	this.cannon.onDraw();
    var drawwidth = shipDrawWidth * this.scale;
    var drawheight = shipDrawHeight * this.scale;
	var hitwidth = shipHitWidth * this.scale;
	var hitheight = shipHitHeight * this.scale;

    //We translate to the origin of our ship
    ctx.translate(this.state.x, this.state.y);

    //We rotate around this origin 
    ctx.rotate(this.state.angle);

	//draw hitbox underneath

	if(this.collided_timer > 0) {
        ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = this.default_colour;
    }
     ctx.fillRect(-hitwidth/2, -hitheight/2, hitwidth, hitheight);
      //We draw the ship, ensuring that we start drawing from the correct location 
    //(the fillRect function draws from the topmost left corner of the rectangle 
    
	ctx.drawImage(symimage, (-drawwidth/2), (-drawheight/2), drawwidth, drawheight);

      //We draw the ship, ensuring that we start drawing from the correct location 
    //(the fillRect function draws from the topmost left corner of the rectangle 
/*
    if (this.wait < 50) {
      ctx.drawImage(ship_image1, (-drawwidth/2), (-drawheight/2), drawwidth, drawheight);
    } else {
      ctx.drawImage(ship_image2, -drawwidth/2, -drawheight/2, drawwidth, drawheight);
    }
*/

    this.wait = (this.wait + 1) % 100;

	

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);

    if (this.hp < 99){
      var hp_len = 80;
      var hp_height = 8;
      ctx.translate(-hp_len/2, -hp_height/2-50);
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, hp_len, hp_height); 
      ctx.fillStyle = "green";
      ctx.fillRect(0, 0, hp_len * this.hp/100, hp_height); 
      ctx.translate(hp_len/2, hp_height/2+50);
    }

      ctx.translate(-this.state.x, -this.state.y);

    // Ship name
    ctx.fillStyle = "white";
    ctx.font = "15px Josefin Sans";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(this.name);
    var textWidth = metrics.width;
    ctx.fillText(this.name, this.state.x - textWidth/2, this.state.y);
  }

  this.getColType = function() {return "rectangle"};
  this.getColObj = function() {
    return {
	    type: "ship",
	    uid: this.uid,
      x: this.state.x,
      y: this.state.y,
      speed: this.state.speed,
      width: shipHitWidth * this.scale,
      height: shipHitHeight * this.scale,
      hypotenuse: this.hypotenuse,
      angle: this.state.angle
    }
  };

  this.serialize = function() {
    return { type:"ship"
           , o : { uid: this.uid
                 , name: this.name
                 , state: this.state 
                 , hp : this.hp
                 , scale: this.scale}};
  };

}

//These depend on the dimensions of the image we choose
var shipDrawWidth = 112.5;
var shipDrawHeight = 60.5;

//Likewise
var shipHitWidth = 70;
var shipHitHeight = 28;

exports.Class = Ship;
exports.shipDrawWidth = shipDrawWidth;
exports.shipDrawHeight = shipDrawHeight;
exports.shipHitWidth = shipHitWidth;
exports.shipHitHeight = shipHitHeight;

})(typeof exports == 'undefined' ? this.Ship = {} : exports);
