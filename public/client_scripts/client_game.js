//const server = false;
server = false;

//  Set up sockets
var socket = io();
var canvas = $("#main_canvas")[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
var sim;
var viewport;
var lastTime;
var player;


//  Viewport maps world area to canvas for printing
function Viewport(sim, x, y, baseWidth, baseHeight, scale){

  this.sim = sim;

  this.x = x;
  this.y = y;
  this.baseHeight = baseHeight / baseWidth;
  this.baseWidth = 1;
  this.scale = scale;

  this.getWidth = function(){
    return this.baseWidth * scale;
  }

  this.getHeight = function(){
    return this.baseWidth * scale;
  }

  this.draw = function(ctx, canvaswidth, canvasheight){


    // Scale
    ctx.scale(scale, scale);
    ctx.translate(-this.x, -this.y);

    sim.draw();

    // Inverse scale
    ctx.translate(this.x, this.y); 
    ctx.scale(1/scale, 1/scale);

  }
}

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
  viewport.x = player.state.x - canvas.width / (2 * viewport.scale);
  viewport.y = player.state.y - canvas.height / (2 * viewport.scale);

  //  Fastest way to clear entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //sim.draw();
  viewport.draw(ctx, canvas.width, canvas.height);
  //fixed object to ensure no hickery dickery 
  
  /*
  ctx.fillStyle = "white";
  ctx.fillRect(800, 400, 50, 60);
  ctx.fillRect(500, 500, 50, 60);
  ctx.fillRect(30, 50, 50, 60);
  ctx.fillRect(400, 100, 120, 60);
  */

}

function createShipOnDraw(colour){
  return function(){
    var width = shipBaseWidth * this.scale;
    var height = shipBaseHeight * this.scale;


    //We translate to the origin of our ship
    ctx.translate(this.state.x, this.state.y);

    //We rotate around this origin 
    ctx.rotate(this.state.angle);

      //We draw the ship, ensuring that we start drawing from the correct location 
    //(the fillRect function draws from the topmost left corner of the rectangle 
    ctx.fillStyle = colour;
    ctx.fillRect(-width/2, -height/2, width, height);

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);
    ctx.translate(-this.state.x, -this.state.y);

    ctx.fillStyle = "white";
    ctx.font = "5px Courier";
    var text = localStorage['nickname'] == "" ? "Corsair" : localStorage['nickname'];
    var metrics = ctx.measureText(text);
    var textWidth = metrics.width;
    ctx.fillText(text, this.state.x - textWidth/2, this.state.y);
  }
}

function createShipOnViewportDraw(colour){
  return function(translation, scale){
    var width = shipBaseWidth * this.scale;
    var height = shipBaseHeight * this.scale;

    //We translate to the origin of our ship
    ctx.translate(this.state.x, this.state.y);

    //We rotate around this origin 
    ctx.rotate(this.state.angle);

      //We draw the ship, ensuring that we start drawing from the correct location 
    //(the fillRect function draws from the topmost left corner of the rectangle 
    ctx.fillStyle = colour;
    ctx.fillRect(-width/2, -height/2, width, height);

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);
    ctx.translate(-this.state.x, -this.state.y);
  }
}

//  Store current mouse position
var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#main_canvas" ).mousemove(function(event){
  //  TEMP
  var scale = viewport.scale;
  mouse_x = (event.offsetX/scale + viewport.x);
  mouse_y = (event.offsetY/scale + viewport.y);

  console.log('player.x: ' + player.state.x);
  console.log('mouseX: ' + mouse_x);
  console.log('viewportx: ' + viewport.x);
  console.log('offsetx: ' + event.offsetX);
});

const speed_norm = 100 * 5;

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
  var delta_angle_limit = Math.PI/90;
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

  initializeGame();
  sim = new Sim(data.meta.gridNumber, data.meta.cellWidth, data.meta.cellHeight,
    data.meta.activeCells);

  //  Using 16:9 aspect ratio
  viewport = new Viewport(sim, 0, 0, 1.6, 0.9, 2);

  our_id = data.id;
  console.log("Our id is " + our_id);


  newPlayer(our_id, data.state);
  player = sim.addShip(data.state, our_id, localShipInput,
    createShipOnDraw("black"));

  //  Set our world up in the config described by the server

  for (var userid in data.players){
    addServerShip(userid, data.players[userid]);
  }

  //  Delay between updating the server
  const s_delay = 1000/40;

  //  Send information about the local player to the server every s_delay
  if(typeof server_loop != "undefined") clearInterval(server_loop);
  var server_loop = setInterval(client_update, s_delay, player);

  window.requestAnimationFrame(clientTick);
});

//  Update the server about the player's position

function client_update(player){
  socket.emit('client_update', {state: player.state});
}

//  Add a new ship to the local world from information from the server

function addServerShip(userid, state){
  console.log("adding new player");
  newPlayer(userid, state);
  sim.addShip(state, userid, 
      createServerShipInput(userid),
        createShipOnDraw("brown"));

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
