var socket;
var canvas = $("#main_canvas")[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
var remote;
var sim;
var serializer;
var viewport;
// Client tick
var fps;
var lastTime;
var currentTime;
var delta;
var interval;

var player;
var meta;
var our_id;

// Game loops
var server_loop = 0;
var client_loop = 0;
var localHighScoreTable = {};
const MAXIMUM_SPEED = 4;


// Constants for the game
const speed_norm = 100 * 5*2;
const backColor = "rgb(104, 104, 104)";
const seaColor = "rgb(92, 184, 235)";
const seaHighlightColor = "rgb(102, 204, 255)";
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
  //  If this cell is in activeCells
  var playerCell = sim.coordinateToCellIndex(player.state.x, player.state.y);
  if (playerCell == null) {
    return;
  }

  if (cx == playerCell.x && cy == playerCell.y){
    ctx.fillStyle = seaHighlightColor;
  }
  else{
    ctx.fillStyle = seaColor;
  }

  ctx.fillRect(cx*meta.cellWidth, cy*meta.cellHeight, meta.cellWidth+2,
      meta.cellHeight+2);
}


var treasureX = 300;
var treasureY = 300;

function drawTreasure() {
    ctx.beginPath();
    ctx.arc(treasureX, treasureY, 10, 2 * Math.PI, false);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
}

function drawHighScoresTable(scoreTable) {
  var maxDisplay = 10;
  var currentPlayers = Object.keys(scoreTable).length;
  var i = 0;

  var displayNumber = currentPlayers < maxDisplay ? currentPlayers : maxDisplay;
    
  for (var uid in scoreTable) {
    if (i <= displayNumber) {
      i++;
      ctx.beginPath();
      ctx.font = "20px Josefin Sans";
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'black';
      ctx.textAlign="left"; 
      ctx.strokeText("#" + i + "\t\t" + scoreTable[uid].shipName + "\t" + scoreTable[uid].score + "\n", 
        (9/10)*canvas.width, (1/10)*canvas.height + i * 20);
      ctx.stroke();
      ctx.closePath();
    } else {
      break;
    }
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "50px Josefin Sans";
  ctx.fillText(localHighScoreTable[player.uid].score, (1/15)*canvas.width, (9.5/10)*canvas.height);
}


function drawCompass() {
  drawCompassScaled(player.state.x, player.state.y, treasureX, treasureY, 50);
}

function drawFps() {
  ctx.fillStyle = "black";
  ctx.font = "15px Josefin Sans";
  ctx.fillText("fps: "+ fps, (1/10)*canvas.width, (1/10)*canvas.height);
}

//  Draws all objects
function draw(){
  viewport.x = player.state.x - canvas.width / (2 * viewport.scale);
  viewport.y = player.state.y - canvas.height / (2 * viewport.scale);

  drawBehindGrid(ctx);
  viewport.draw(ctx, canvas.width, canvas.height);
  drawCompass();
  drawHighScoresTable(localHighScoreTable);
  drawFps();
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
    default:
      return true;
  }
});

var delta_angle_limit = Math.PI/45;
var localShipInput = function(){
  var delta_angle = (Math.atan2(mouse_y - this.state.y, mouse_x - this.state.x) 
						- this.state.angle); 

  //Ensure delta_angle stays within the range [-PI, PI]
  delta_angle = Col.trimBranch(delta_angle);
 
  if (delta_angle > delta_angle_limit) {
    delta_angle = delta_angle_limit;
  } else if (delta_angle < -delta_angle_limit) {
    delta_angle = -delta_angle_limit;
  }

  this.state.angle = Col.trimBranch(this.state.angle + delta_angle);
  this.state.speed = Math.min(MAXIMUM_SPEED,
                              Math.sqrt(Math.pow(this.state.x - mouse_x,2) +
                                        Math.pow(this.state.y - mouse_y,2)) / speed_norm);
}


// GAME LOOP


//  Called repeatedly, holds game loop
//  TODO maybe skip frames if at more than 60fps?

function clientTick(){
       
  client_loop = window.requestAnimationFrame(clientTick);
  currentTime = Date.now();
  delta = currentTime - lastTime;

  fps = Math.floor(1000/(delta));

  if (delta > interval) {
    lastTime = currentTime - (delta % interval);
    mouse_x = (mouse_screen_x/viewport.scale + viewport.x);
    mouse_y = (mouse_screen_y/viewport.scale + viewport.y);

    sim.tick(delta);
    draw();
  }
}

function updateHighScoresTable(global) {
    localHighScoreTable = jQuery.extend({}, global);
}

//  Add a new ship to the local world from information from the server

function addServerShip(userid, name, state){
  console.log("adding new player");
  remote.newPlayer(userid, name, state);
  //sim.addShip(userid, state, userid,
  //    Game.createServerShipInput(userid));

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
    client_loop = 0;
  }
  if (server_loop) {
    clearInterval(server_loop);
    server_loop = 0;
  }
}

function startClient() {
  // Initialize sockets
  console.log('socket status' + socket);
  if (typeof socket == "undefined" || !socket.connected) {
    socket = io();
  }

  socket.on('on_connect', function (data){
    console.log('New connection');
    playClientGame(data);
  });
  
  socket.on('start_game', function(data){
  
    lastTime = Date.now();
    if (client_loop == 0) {
      client_loop = window.requestAnimationFrame(clientTick);
    }

  
    //  Delay between updating the server
  
    //  Send information about the local player to the server every s_delay
    if(server_loop == 0) {
      server_loop = setInterval(client_update, s_delay, player);
    }
  });

  //  Recieved when another player joins the server
  socket.on('player_joined', function (data){
    console.log('player joined');
    if (data.id != our_id) {
      addServerShip(data.id, data.name, data.state);
    }
  });
  
  //  Recieved when another player leaves the server
  //  We delete the local ship
  socket.on('player_left', function (data){
    console.log('player left');
    remote.removePlayer(data.id);
  });
  
  //  On update from server
  socket.on('server_update', function (data){
    updateHighScoresTable(data.scoresTable);

    // check if you died
    if (data.active_cells.length == 0) {
      player.onDeath();
    }

    var players = data.players;
    for (var uid in players){
      var update = players[uid];
      remote.updatePlayer(uid, update);
    }
    var allBufferedUpdates = data.updates;
    for (var i = 0; i < allBufferedUpdates.length; i++){
      var num = allBufferedUpdates[i].num;
      var updates = allBufferedUpdates[i].updates;
      var cell = sim.numberToCell(num);
      for (var j = 0; j < updates.length; j++){
        var update = updates[j];
        switch(update.name){
          case 'create_testObj':
            cell.gameObjects.push(new Sim.TestObj(sim, update.data));
            break;
          case 'object_enter_cell':
            if (update.data.type == "ship") {
              if (update.data.o.uid != our_id) {
                var obj = serializer.deserializeObject(update.data);
                console.log(obj);
                cell.gameObjects.push(obj);
              }
            }
            break;
          default:
            console.log("Unrecognised command from server " + update.name);
        }
      }
    }


    deserializeNewStates(data.new_cells);
    // Sim will only draw the active cells
    sim.activeCells = data.active_cells;
  });
}

function deserializeNewStates(new_cells_states) {
  for (var i = 0; i < new_cells_states.length; i++) {
    var cell = sim.numberToCell(new_cells_states[i].num);
    cell.staticObjects =
      serializer.deserializeArray(new_cells_states[i].state.static_obj)
                .filter(function(x) { return x != null; });
    cell.gameObjects = 
      serializer.deserializeArray(new_cells_states[i].state.game_obj)
                .filter(function(x) { return x != null; });
  }
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
  fps = 60;
  interval = 1000/fps;
  delta = 0;
  player = null;
  meta = null;
  our_id = null;

  remote = new Game.Remote();
  meta = data.meta;
  sim = new Sim.Class(remote, meta.gridNumber, meta.cellWidth, meta.cellHeight,
    meta.activeCells);
  serializer = new Serializer.Class(sim);
  deserializeNewStates(data.new_cells_states);
  //sim.populateMap(drawTreasure);
  
  updateHighScoresTable(data.scoresTable);


  //  Using 16:9 aspect ratio
  viewport = new Viewport(sim, 0, 0, 1.6, 0.9, 1);

  our_id = data.id;
  console.log("Our id is " + our_id);

  var our_name = (localStorage['nickname'] == "") ? "Corsair" : localStorage['nickname'];
  remote.newPlayer(our_id, our_name, data.state);
  player = sim.addShip(our_id, our_name, data.state, localShipInput);
  player.onDeath = onShipDeath;

  //  Set our world up in the config described by the server
  for (var userid in data.players){
    if (userid != our_id) {
      addServerShip(userid, data.names[userid], data.players[userid]);
    }
  }

  if (typeof socket != "undefined") {
    socket.emit('on_connect_response', {name : our_name});
    console.log('ON CONNECT RESPONSE');
  }
}


$('document').unload(function() {
  if ((typeof socket != "undefined") && socket.connected) {
    socket.emit('disconnect');
  }
});
