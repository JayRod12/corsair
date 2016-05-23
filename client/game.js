
/* TODO make framerate independent - add deltatime to tick updates */

const speed_norm = 100;
const max_angular_vel = 0.1;

var sea = new Rect(0, 0, 1000, 1000).fill("blue").addTo(stage);

function Ship(x, y){
  this.width = 40;
  this.height = 20;

  this.speed = 1;
  this.angle = 0;

  this.shape = new Ellipse(0, 0, this.width, this.height);
  this.shape.fill("white");

  this.setLocation(x, y);
  this.shape.addTo(stage);
};

Ship.prototype.move = function(){
  player.updateAngle(mouse_x, mouse_y);
  this.speed = Math.sqrt(Math.pow(this.x - mouse_x,2) + Math.pow(this.y -
        mouse_y,2)) / speed_norm;
  this.setLocation(this.x + Math.cos(this.angle) * this.speed,
              this.y + Math.sin(this.angle) * this.speed);
};

Ship.prototype.updateAngle = function(mouse_x, mouse_y){

  this.angle = Math.atan2(mouse_y - this.y, mouse_x - this.x);

  /*
  Try and add 'momentum' to angular velocity, so you cant spin on the spot
  currently spins 360's
  Fix, do some modular arithmatic, 
  var newAngle = Math.atan2(mouse_y - this.y, mouse_x - this.x);
  if (Math.abs(newAngle - this.angle) > max_angular_vel){
    this.angle += (newAngle > 0) ? max_angular_vel : -max_angular_vel;
  }
  else{
    this.angle = newAngle;
  }
  */

  this.shape.attr({
    rotation: this.angle
  });
};

Ship.prototype.setLocation = function(x, y){
  this.x = x;
  this.y = y; 


  this.shape.attr({
    x: x - this.width/2,
    y: y - this.height/2,
  });
};

var player = new Ship(50, 60);

var mouse_x = 0;
var mouse_y = 0;

stage.on('tick', function(e, f) {
  player.move();
});

stage.on('pointermove', function(e) {

  mouse_x = e.stageX;
  mouse_y = e.stageY;
});
