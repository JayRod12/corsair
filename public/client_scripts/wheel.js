(function(exports){

var canvas_id, wheel_canvas, ctx;
var image, anim_frame = 0;
var current_time, last_time;
var active;
var mouse_x = 0, mouse_y = 0;
//var mousedown_x = 0, mousedown_y = 0, mousedown = false;
var mousedown = false;
var mousedown_angleoffset = 0;
var mousedown_radius = 0;

var wheel_angle = 0, wheel_angular_vel = 0, wheel_angular_accel = 0,
wheel_torque = 0;
var wheel_mass= 1;
var wheel_moment;
var wheel_friction = 0.0024;
var wheel_maxspeed = 0.05;
var wheel_minspeed = 0;

var user_strength = 1/750000;

exports.init = function(ci){
  canvas_id = ci;
  active = true;
  
  wheel_canvas = document.getElementById(canvas_id);
  wheel_canvas.style['z-index'] = '-2';
  ctx = wheel_canvas.getContext('2d');
  

  image = new Image();
  image.src = "../media/wheel.png";

  image.onload = function() {
    if (!active) return;  //  If we move onto the game before the image loads
    window.requestAnimationFrame(tick);
  }

  current_time = Date.now();
  last_time = Date.now();


  image.onerror = function() {
    console.error("Error loading image: " + image.src);
    //  Draw a text 'o'?
  }
  $("body").mousemove(function(event) {
    if (!active) return;
    mouse_x = globalToLocalX(event.pageX);
    mouse_y = globalToLocalY(event.pageY);
  });

  $("body").mousedown(function(e) {
    mousedown = true;
    mousedown_angleoffset = Math.atan2(mouse_y, mouse_x) - wheel_angle;
    mousedown_radius = Utils.dist(mouse_x, mouse_y);
  });

  //  Want to be able to release mouse anywhere
  $('body').mouseup(function(e) {
    mousedown = false;
  });

};

//  Some weird recursive thing nacho got from somewhere?
function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

//  NOTE: treating the centre of the wheel as the origin
function globalToLocalX (x) {
  return x - getOffset(document.getElementById(canvas_id)).left - 
    wheel_canvas.width/2;
}
function globalToLocalY (y) {
  return y - getOffset(document.getElementById(canvas_id)).top - 
    wheel_canvas.height/2;
}

function localToGlobalX (x) {
  return x + getOffset(document.getElementById(canvas_id)).left + 
    wheel_canvas.width/2;
}

function localToGlobalY (y) {
  return y + getOffset(document.getElementById(canvas_id)).top + 
    wheel_canvas.height/2;
}


const frame_cap = 60;

function tick(){
  anim_frame = window.requestAnimationFrame(tick);
  current_time = Date.now();
  dt = current_time - last_time;
  //if (dt < 1000/frame_cap) return;
  last_time = current_time;

  //  INTERACTION
  if (mousedown){

    var mousedown_x = mousedown_radius * Math.cos(mousedown_angleoffset +
        wheel_angle);
    var mousedown_y = mousedown_radius * Math.sin(mousedown_angleoffset +
        wheel_angle);
    var theta = Math.atan2(mousedown_y - mouse_y, mousedown_x -
        mouse_x) - (mousedown_angleoffset + wheel_angle);

    var mousedown_mouse_dist = Utils.dist(mouse_x - mousedown_x, mouse_y -
        mousedown_y);

    //  Cross product kinda, not caring about mousedown_radius at the moment
    wheel_torque = -Math.sin(theta) * mousedown_mouse_dist * user_strength;
  }
  else {
    wheel_torque = 0;
  }

  //  PHYSICS
  wheel_torque -= wheel_angular_vel * wheel_friction;

  wheel_angular_accel = wheel_torque * wheel_mass;
  wheel_angular_vel = Utils.bound2(wheel_angular_vel + wheel_angular_accel * dt,
      wheel_maxspeed, wheel_minspeed);
  
  wheel_angle = Col.trimBranch(wheel_angle + wheel_angular_vel * dt);


  //  DRAW
  ctx.translate(wheel_canvas.width/2, wheel_canvas.height/2);
  ctx.rotate(wheel_angle);
      ctx.clearRect(-wheel_canvas.width/2, -wheel_canvas.height/2,
        wheel_canvas.width, wheel_canvas.height);
      ctx.drawImage(image, -wheel_canvas.width/2, -wheel_canvas.height/2);
  ctx.rotate(-wheel_angle);
  ctx.translate(-wheel_canvas.width/2, -wheel_canvas.height/2);
}

exports.stop = function(){
  if (anim_frame !== 0)
    window.cancelAnimationFrame(anim_frame);
};


})(this.Wheel = {});
