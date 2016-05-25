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

//  Store current mouse position
var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#canvas" ).mousemove(function(event){
  mouse_x = event.clientX;
  mouse_y = event.clientY;
});

const speed_norm = 100/60;

var localShipInput = function(){
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

//  Creates a serverInput function that is a closure using the given id
//  The output can be passed into a new Ship

function createServerShipInput(id){
  return function(){
    this.angle = other_ships[id].angle;
    this.speed = other_ships[id].speed;
  }
}

//  Hashmap of player ids to ship states
//  Does not include the local player's ship
var other_ships = {};

//  Our id assigned to us by the server
var our_id = 0;

//  On connecting to the server

socket.on('on_connected', function (data){
  our_id = data.id;
  console.log("Our id is " + our_id);

  //  Set our world up in the config described by the server

  for (var userid in data.players){
    var player = data.players[userid];
    addServerShip(userid, player.x, player.y, player.angle, player.speed);
  }
});

//  Update the server about the player's position

function client_update(player){
  socket.emit('client_update', {x : player.x, y : player.y, angle: player.angle,
    speed: player.speed});
}

//  Add a new ship to the local world from information from the server

function addServerShip(userid, x, y, angle, speed){
  var newship = new Ship(x, y,
      createServerShipInput(userid));
  other_ships[userid] = {object: newship, x : x, y: y, angle: angle, speed: speed};
  newship.speed = speed;
  newship.angle = angle;

  gameObjects.push(newship);
  drawObjects.push(newship);
}


//  Recieved when another player joins the server

socket.on('player_joined', function (data){
  addServerShip(data.id, data.x, data.y, 0, 0);
});

//  Recieved when another player leaves the server
//  We delete the local ship

//  This will leave holes in the gameObject, drawObject arrays
socket.on('player_left', function (data){
  var userid = data.id;
  var doomed_ship = other_ships[userid].object;
  for (var i = 0; i < gameObjects.length; i++){
  console.log(gameObjects[i] + " not " + doomed_ship);
    if (gameObjects[i] == doomed_ship) {
      gameObjects.splice(i,1);
      break;
    }
  }
  for (var i = 0; i < drawObjects.length; i++){
    if (drawObjects[i] == doomed_ship) {
      drawObjects.splice(i,1);
      break;
    }
  }
  delete other_ships[userid].object;
  delete other_ships[userid];
});

//  On update from server

//  TODO lag compensation - we currently do not use the x, y coordinates given
//  by the server, we only simulate based on angle and speed
//  We need to ease any inaccurcies in position out rather than directly
//  'snapping' back into position

socket.on('server_update', function (data){
  for (var userid in data){
    if (userid != our_id){
      var update = data[userid];
      other_ships[userid].x = update.x;
      other_ships[userid].y = update.y;
      other_ships[userid].speed = update.speed;
      other_ships[userid].angle = update.angle;
    }
  }
});


function init(){

  //  Create player
  var player = new Ship(0, 0, localShipInput);
  gameObjects.push(player);
  drawObjects.push(player);

  //  Todo measure dt properly every tick to compensate for dropped frames
  const dt = 1/60;
  //  Delay between time we update the server
  const s_delay = 1/40;

  if(typeof game_loop != "undefined") clearInterval(game_loop);
  //  Third argument is the delay time to pass to tick on each call
  var game_loop = setInterval(tick, dt, dt);

  //  Send information about the local player to the server every s_delay
  if(typeof server_loop != "undefined") clearInterval(server_loop);
  var server_loop = setInterval(client_update, s_delay, player);
}

init();

