//const server = false;
server = false;

//  Set up sockets
var socket = io();

var canvas = $("#canvas")[0];
var ctx = canvas.getContext("2d");

var sim;


var lastTime;

//  Called repeatedly, holds game loop
//  TODO maybe skip frames if at more than 60fps?
function clientTick(currentTime){

  window.requestAnimationFrame(clientTick);

  if (!lastTime) lastTime = currentTime-1;//  Subtract one to avoid any divide
                                          //  by zero
  var dt = currentTime - lastTime;
  lastTime = currentTime;

  sim.tick(dt);
  draw();
}

//  Draws all objects
function draw(){
  //  Fastest way to clear entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  sim.draw();
  //fixed object to ensure no hickery dickery 
  
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 50, 60);
  ctx.fillRect(400, 100, 120, 60);

}

function shipOnDraw(){

  var width = shipBaseWidth * this.scale;
  var height = shipBaseHeight * this.scale;


  //We translate to the origin of our ship
  ctx.translate(this.state.x, this.state.y);

  //We rotate around this origin 
  ctx.rotate(this.state.angle);

    //We draw the ship, ensuring that we start drawing from the correct location 
  //(the fillRect function draws from the topmost left corner of the rectangle 
  ctx.fillStyle = "brown";
  ctx.fillRect(-width/2, -height/2, width, height);

  //We undo our transformations for the next draw/calculations
  ctx.rotate(-this.state.angle);
  ctx.translate(-this.state.x, -this.state.y);
}

//  Store current mouse position
var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#canvas" ).mousemove(function(event){
  mouse_x = event.clientX;
  mouse_y = event.clientY;
});

const speed_norm = 100 * 40;

var localShipInput = function(){
  var delta_angle = (Math.atan2(mouse_y - this.state.y, mouse_x - this.state.x) 
						- this.state.angle); 

  //Ensure delta_angle stays within the range [-PI, PI]
  if (delta_angle > Math.PI) {
  delta_angle = delta_angle - 2*Math.PI ;
  }

  if(delta_angle < -Math.PI) {
  delta_angle = 2*Math.PI + delta_angle;
  }
  var delta_angle_limit = Math.PI/120; 
  if (delta_angle > delta_angle_limit) {
    delta_angle = delta_angle_limit;
  } else if (delta_angle < -delta_angle_limit) {
    delta_angle = -delta_angle_limit;
  }

  this.state.angle += delta_angle;

  if (this.state.angle > Math.PI) {
	this.state.angle -= 2*Math.PI;
  } 

  if (this.state.angle < -Math.PI) {
    this.state.angle += 2*Math.PI;
  }
  this.state.speed = Math.sqrt(Math.pow(this.state.x - mouse_x,2) +
      Math.pow(this.state.y
      -mouse_y,2)) / speed_norm;
}

//  Creates a serverInput function that is a closure using the given id
//  The output can be passed into a new Ship

/*
function createServerShipInput(id){
  return function(){
    this.angle = getPlayers()[id].angle;
    this.speed = getPlayers()[id].speed;
  }
}
*/

//  Our id assigned to us by the server
var our_id;

//  On connecting to the server

socket.on('on_connected', function (data){
  our_id = data.id;
  console.log("Our id is " + our_id);
  newPlayer(our_id, data.state);
  var player = sim.addShip(data.state, getPlayers()[our_id], localShipInput, shipOnDraw);

  //  Set our world up in the config described by the server

  for (var userid in data.players){
    addServerShip(userid, data.players[userid]);
  }

  //  Delay between updating the server
  const s_delay = 1000/40;

  //  Send information about the local player to the server every s_delay
  if(typeof server_loop != "undefined") clearInterval(server_loop);
  var server_loop = setInterval(client_update, s_delay, player);

});

//  Update the server about the player's position

function client_update(player){
  socket.emit('client_update', {state: player.state});
}

//  Add a new ship to the local world from information from the server

function addServerShip(userid, state){
  console.log("adding new player");
  newPlayer(userid, state);
  sim.addShip(state, getPlayers()[userid], 
      createServerShipInput(userid),
        shipOnDraw);

}


//  Recieved when another player joins the server

socket.on('player_joined', function (data){
  console.log('player joined');
  addServerShip(data.id, data.state);
});

//  Recieved when another player leaves the server
//  We delete the local ship

socket.on('player_left', function (data){
  console.log('player left');
  removePlayer(data.id);
});

//  On update from server

socket.on('server_update', function (data){
  for (var uid in data){
    var update = data[uid];
    updatePlayer(uid, update);
  }
});


function init(){

  initializeGame();

  sim = new Sim();

  window.requestAnimationFrame(clientTick);

}

init();
