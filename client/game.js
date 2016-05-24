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

  //  Where x and y are the spawning position
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
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    //  For now draw square
    ctx.fillStyle = "brown";
    ctx.fillRect(- this.width/2, - this.height/2, this.width, this.height);
    ctx.rotate(-this.angle);
    ctx.translate(-this.x, -this.y);

  }
}

var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#canvas" ).mousemove(function(event){
//canvas.mousemove(function(event){
  mouse_x = event.clientX;
  mouse_y = event.clientY;
});

const speed_norm = 100/60;

var playerInput = function(){
  this.angle = Math.atan2(mouse_y - this.y, mouse_x - this.x);  
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

