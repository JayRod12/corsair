var socket;
var canvas = $("#main_canvas")[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.visibility="visible";

//var canvas2 = document.createElement('canvas');
var canvas = $("#sub_canvas")[0];
    //canvas2.id = "sub_canvas";
    canvas2.width = canvas.width;
    canvas2.height = canvas.height;
    canvas2.style.visibility="hidden";

var frame_buffer = [canvas, canvas2];
var display_frame = 0;

//var ctx = canvas.getContext("2d");

var frame_buffer_ctx = [canvas.getContext("2d"), canvas2.getContext("2d")];

var sim;
var viewport;
var lastTime;
var player;
var meta;
var our_id;

// Game loops
var server_loop;
var client_loop;


// Constants for the game
const speed_norm = 100 * 5;
const backColor = "rgb(104, 104, 104)";
const seaColor = "rgb(102, 204, 255)";
const s_delay = 1000/40;

///////////////// DRAW METHODS ////////////////////////////

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

    sim.draw(ctx);

    // Inverse scale
    ctx.translate(this.x, this.y); 
    ctx.scale(1/scale, 1/scale);

  }
}


function drawBehindGrid(ctx){
  ctx.fillStyle = backColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCellBackground(cx, cy, ctx){
  ctx.fillStyle = seaColor;
  ctx.fillRect(cx*meta.cellWidth, cy*meta.cellHeight, meta.cellWidth+2,
      meta.cellHeight+2);
}


function createShipOnDraw(colour, name){
  return function(ctx){
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
    ctx.strokeStyle = "#ffc0cb";
    ctx.strokeRect(-width/2, -height/2, width, height);

    //We undo our transformations for the next draw/calculations
    ctx.rotate(-this.state.angle);
    ctx.translate(-this.state.x, -this.state.y);

    // Ship name
    ctx.fillStyle = "white";
    ctx.font = "5px Courier";
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, this.state.x - textWidth/2, this.state.y);
  }
}

function drawCannonBalls(ctx) {

  var radius = this.level;
  ctx.beginPath();
  ctx.arc(this.state.x, this.state.y, radius, 2 * Math.PI, false);
  ctx.fillStyle = "black";
  ctx.fill();
}

var treasureX = 300;
var treasureY = 300;

function drawTreasure(ctx) {
    ctx.beginPath();
    ctx.arc(treasureX, treasureY, 10, 2 * Math.PI, false);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
}

function drawCompass(ctx) {
  drawCompassScaled(ctx, player.state.x, player.state.y, treasureX, treasureY, 50);
}

//  Draws all objects
function draw(){

  var draw_frame = 1-display_frame;
  var ctx = frame_buffer_ctx[draw_frame];


  viewport.x = player.state.x - canvas.width / (2 * viewport.scale);
  viewport.y = player.state.y - canvas.height / (2 * viewport.scale);

  //  Fastest way to clear entire canvas
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBehindGrid(ctx);
  viewport.draw(ctx, canvas.width, canvas.height);
  drawCompass(ctx);

  //  Switch buffers
  //if (draw_frame != 0) frame_buffer[draw_frame].style.visibility = "visible";
  frame_buffer[draw_frame].style.visibility = "visible";
  frame_buffer[display_frame].style.visibility = "hidden";
  display_frame = draw_frame;


}


///////////// MOVEMENT METHODS /////////////

//  Mouse position on screen
var mouse_screen_x = 0;
var mouse_screen_y = 0;

//  Mouse position in world
var mouse_x = 0;
var mouse_y = 0;

//  Update mouse position on movement
$( "#main_canvas" ).mousemove(function(event){
  mouse_screen_x = event.offsetX;
  mouse_screen_y = event.offsetY;

});


//  Disable right click context menu
$(document).ready(function(){ 
  $(document).bind("contextmenu", function(event){
      return false;
    });
});

//  Detect mouseclicks for shooting cannon balls
$( "#main_canvas" ).mousedown(function(event){

  switch(event.which){
    case 1:
      //  Left click
      player.cannon.onShoot(-1);
      return false;
    case 3:
      //  Right click
      player.cannon.onShoot(1);
      return false;

    return true;
  }
});



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

// GAME LOOP


//  Called repeatedly, holds game loop
//  TODO maybe skip frames if at more than 60fps?
function clientTick(currentTime){

  client_loop = window.requestAnimationFrame(clientTick);

  if (!lastTime) lastTime = currentTime-1;//  Subtract one to avoid any divide
                                          //  by zero
  var dt = currentTime - lastTime;
  lastTime = currentTime;

  mouse_x = (mouse_screen_x/viewport.scale + viewport.x);
  mouse_y = (mouse_screen_y/viewport.scale + viewport.y);

  sim.tick(dt);


  draw();
}

//  Add a new ship to the local world from information from the server

function addServerShip(userid, name, state){
  console.log("adding new player");
  newPlayer(userid, name, state);
  sim.addShip(state, userid,
      createServerShipInput(userid),
        createShipOnDraw("brown", name), drawCannonBalls);

}

//  Update the server about the player's position

function client_update(player){

  if ((typeof socket != "undefined") && socket.connected) {
    socket.emit('client_update', {state: player.state});
  }
}

function endClient() {
  socket.disconnect();

  if (client_loop) {
    window.cancelAnimationFrame(client_loop);
  }
}

function startClient() {
  // Initialize sockets
  console.log('socket status' + socket);
  if (!socket || !socket.connected) {
    socket = io();
  }

  socket.on('on_connect', function (data){
    console.log('New connection');
    playClientGame(data);
  });
  
  socket.on('start_game', function(data){
  
    client_loop = window.requestAnimationFrame(clientTick);
  
    //  Delay between updating the server
  
    //  Send information about the local player to the server every s_delay
    if(server_loop) {
      clearInterval(server_loop);
    }
    server_loop = setInterval(client_update, s_delay, player);
  });

  //  Recieved when another player joins the server
  socket.on('player_joined', function (data){
    console.log('player joined');
    addServerShip(data.id, data.name, data.state);
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
}

// Terminate the game when the ship dies
function onShipDeath() {
  $('#game_canvas').hide();
  $('body').css({'background':'black'});
  $('#welcomeScreen').fadeIn('slow');
  console.log('Ship death' + mouse_x + ', ' + mouse_y);
  endClient();
}

function playClientGame(data) {
  mouse_x = 0;
  mouse_y = 0;
  mouse_screen_x = 0;
  mouse_screen_y = 0;

  sim = null;
  viewport = null;
  lastTime = null;
  player = null;
  meta = null;
  our_id = null;

  initializeGame();
  meta = data.meta;
  sim = new Sim(meta.gridNumber, meta.cellWidth, meta.cellHeight,
    meta.activeCells);
  sim.populateMap(drawTreasure);
  //  Using 16:9 aspect ratio
  viewport = new Viewport(sim, 0, 0, 1.6, 0.9, 1);

  our_id = data.id;
  console.log("Our id is " + our_id);

  var our_name = (localStorage['nickname'] == "") ? "Corsair" : localStorage['nickname'];
  newPlayer(our_id, our_name, data.state);
  player = sim.addShip(data.state, our_id, localShipInput,
    createShipOnDraw("black", our_name), drawCannonBalls);
  player.onDeath = onShipDeath;

  //  Set our world up in the config described by the server
  for (var userid in data.players){
    addServerShip(userid, data.names[userid], data.players[userid]);
  }

  if (typeof socket != "undefined") {
    socket.emit('on_connect_response', {name : our_name});
  }
}


$('document').unload(function() {
  if ((typeof socket != "undefined") && socket.connected) {
    socket.emit('disconnect');
  }
});
