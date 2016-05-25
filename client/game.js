//  Set up sockets
var socket = io();


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

var localInput = function(){
  this.angle = Math.atan2(mouse_y - this.y, mouse_x - this.x);  
  this.speed = Math.sqrt(Math.pow(this.x - mouse_x,2) + Math.pow(this.y
      -mouse_y,2)) / speed_norm;
}

function createServerInput(id){
  return function(){
    this.angle = other_ships[id].angle;
    this.speed = other_ships[id].speed;
  }
}

function client_update(player){
  socket.emit('client_update', {x : player.x, y : player.y, angle: player.angle,
    speed: player.speed});
}

var our_id = 0;
socket.on('onconnect', function (data){
  our_id = data.id;
  console.log("Our id is " + our_id);
});

var other_ships = {};

socket.on('player_joined', function (data){
  var userid = data.id;
  console.log("Creating new ship"); 
  other_ships[userid] = {x : 0, y: 0, angle: 0, speed: 0};
  var newship = new Ship(0, 0,
      createServerInput(userid));

  gameObjects.push(newship);
  drawObjects.push(newship);
});

//  TODO delete
socket.on('player_left', function (data){
  var userid = data.id;
  console.log("Removing ship"); 
  delete other_ships[userid];
});
  

//  On update from server
socket.on('server_update', function (data){
  for (var userid in data){
    if (userid != our_id){
      other_ships[userid] = data[userid];
    }
  }
});

function init(){
  var player = new Ship(20, 20, localInput);
  gameObjects.push(player);
  drawObjects.push(player);

  //  Todo measure dt properly every tick to compensate for dropped frames
  const dt = 1/60;
  //  Delay between time we update the server
  const s_delay = 1/40;

  if(typeof game_loop != "undefined") clearInterval(game_loop);
  //  Third argument is the delay time to pass to tick on each call
  var game_loop = setInterval(tick, dt, dt);

  if(typeof server_loop != "undefined") clearInterval(server_loop);
  var server_loop = setInterval(client_update, s_delay, player);
}
init();

