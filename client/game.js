var canvas = $("#canvas")[0];
var ctx = canvas.getContext("2d");
var w = $("#canvas").width();
var h = $("#canvas").height();

//  Array of objects to be updated every tick
var gameObjects = [];
var drawObjects = [];


//  Called fps times a second, dt is delta time
function tick(dt){
  //  Updates all game object with their onTick functions
  for (var i = 0; i < gameObjects.length; i++){
    gameObjects[i].onTick(dt);
  }
  draw();
}

//  Draws all objects
function draw(){
  //  Fastest way to clear entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < drawObjects.length; i++){
    drawObjects[i].onDraw();
  }
  //fixed object to ensure no hickery dickery 
  
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 50, 60);
  ctx.fillRect(400, 100, 120, 60);

}

//  Where inputFunction is the ships method of input, either a function
//  taking information from the server or local input (mouse)
function Ship(x, y, inputFunction){

  //x and y represent the centre of the ship
  this.x = x;
  this.y = y;

  this.width = 90;
  this.height = 40;

  this.speed = 5;
  this.angle = 0;

  this.inputFunction = inputFunction;

  this.onTick = function(dt){

    //  Updates speed and angle
    this.inputFunction();

    this.x += this.speed * Math.cos(this.angle) * dt;
    this.y += this.speed * Math.sin(this.angle) * dt;
  }
  this.onDraw = function(){

	//We translate to the origin of our ship
    ctx.translate(this.x, this.y);

	//We rotate around this origin 
    ctx.rotate(this.angle);

    //We draw the ship, ensuring that we start drawing from the correct location 
	//(the fillRect function draws from the topmost left corner of the rectangle 
    ctx.fillStyle = "brown";
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

	//We undo our transformations for the next draw/calculations
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);
  }
}

var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#canvas" ).mousemove(function(event){
  mouse_x = event.clientX;
  mouse_y = event.clientY;
});

const speed_norm = 1000/60;

var playerInput = function(){
  var delta_angle = (Math.atan2(mouse_y - this.y, mouse_x - this.x) 
						- this.angle); 

  //Ensure delta_angle stays within the range [-PI, PI]
  if (delta_angle > Math.PI) {
  delta_angle = delta_angle - 2*Math.PI ;
  }

  if(delta_angle < -Math.PI) {
  delta_angle = 2*Math.PI + delta_angle;
  }
  var delta_angle_limit = Math.PI/600; 
  if (delta_angle > delta_angle_limit) {
    delta_angle = delta_angle_limit;
  } else if (delta_angle < -delta_angle_limit) {
    delta_angle = -delta_angle_limit;
  }

  this.angle += delta_angle;

  if (this.angle > Math.PI) {
	this.angle -= 2*Math.PI;
  } 

  if (this.angle < -Math.PI) {
    this.angle += 2*Math.PI;
  }
  console.log(this.angle);
  this.speed = Math.sqrt(Math.pow(this.x - mouse_x,2) + Math.pow(this.y
      -mouse_y,2)) / speed_norm;
}

function init(){
  var player = new Ship(20, 20, playerInput);
  gameObjects.push(player);
  drawObjects.push(player);

  //  Todo measure dt properly every tick to compensate for dropped frames
  const dt = 1/60;

  if(typeof game_loop != "undefined") clearInterval(game_loop);
  //  Third argument is the delay time to pass to tick on each call
  var game_loop = setInterval(tick, dt, dt);
}
init();

