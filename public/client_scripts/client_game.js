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
var display_fps;
var lastTime;
var currentTime;
var delta;
var interval;
var toSendServer = [];

var player;
var meta;
var our_id;

// Game loops
var server_loop = 0;
var client_loop = 0;
var localHighScoreTable = {};
const MAXIMUM_SPEED = 4;


// Constants for the game
const speed_norm = 100 * 5;
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

function drawRandomColors() {
    var colors = [];
    var letters = '0123456789ABCDEF'.split('');
    for (var j = 0; j < 10; j++) {
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];  
      }
      colors[j] = color;
    }
    return colors;
}

function drawBehindGrid(ctx){
  ctx.fillStyle = backColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

var bg_frames = [];
var bg_frame_count = 16;
var bg_frame_wait = 0;
var bg_frame_wait_time = 15;
for (var i = 0; i < bg_frame_count; i++){
  var bg_frame = new Image();
  bg_frame.src = "../media/bg/"+i+".jpeg";
  bg_frames.push(bg_frame);
}
var bg_frame_num = 0;

function drawCellBackground(cx, cy, ctx){
  bg_frame_wait++
  if (bg_frame_wait > bg_frame_wait_time){
    bg_frame_num = (bg_frame_num + 1) % bg_frame_count;
    bg_frame_wait = 0;
  }
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +1/4)* meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4); 
  ctx.drawImage(bg_frames[bg_frame_num], (cx +2/4)* meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +3/4)* meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
   ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, (cy + 1/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +1/4)* meta.cellWidth, (cy + 1/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4); 
  ctx.drawImage(bg_frames[bg_frame_num], (cx +2/4)* meta.cellWidth, (cy + 1/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +3/4)* meta.cellWidth, (cy + 1/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
   ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, (cy + 2/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +1/4)* meta.cellWidth, (cy + 2/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4); 
  ctx.drawImage(bg_frames[bg_frame_num], (cx +2/4)* meta.cellWidth, (cy + 2/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +3/4)* meta.cellWidth, (cy + 2/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
   ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, (cy + 3/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +1/4)* meta.cellWidth, (cy + 3/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4); 
  ctx.drawImage(bg_frames[bg_frame_num], (cx +2/4)* meta.cellWidth, (cy + 3/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx +3/4)* meta.cellWidth, (cy + 3/4) * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);




/*
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/4, cy * meta.cellHeight + meta.cellHeight/4, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/2, cy * meta.cellHeight + meta.cellHeight/2, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + (3*meta.cellWidth/4), cy * meta.cellHeight + (3*meta.cellheight/4), 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], (cx+1) * meta.cellWidth, (cy + 1)* meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);

*/

/*
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/4, cy * meta.cellHeight + meta.cellHeight/4, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/2, cy * meta.cellHeight + meta.cellHeight/2, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + (3*meta.cellWidth/4), cy * meta.cellHeight + (3*meta.cellheight/4), 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/4, cy * meta.cellHeight + meta.cellHeight/4, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/2, cy * meta.cellHeight + meta.cellHeight/2, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + (3*meta.cellWidth/4), cy * meta.cellHeight + (3*meta.cellheight/4), 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/4, cy * meta.cellHeight + meta.cellHeight/4, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + meta.cellWidth/2, cy * meta.cellHeight + meta.cellHeight/2, 
    meta.cellWidth/4, meta.cellHeight/4);
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth + (3*meta.cellWidth/4), cy * meta.cellHeight + (3*meta.cellheight/4), 
    meta.cellWidth/4, meta.cellHeight/4);
*/
//  ctx.fillStyle = seaColor;
//  ctx.fillRect(cx*meta.cellWidth, cy*meta.cellHeight, meta.cellWidth+2,
//      meta.cellHeight+2);
}

/*
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
*/


var treasureX = 300;
var treasureY = 300;

function drawTreasure() {
    ctx.beginPath();
    ctx.arc(treasureX, treasureY, 10, 2 * Math.PI, false);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
}

var colors = drawRandomColors();

function drawHighScoresTable(scoreTable) {
  var maxLengthName = 14;
  var maxDisplay = 10;
  var currentPlayers = 0;
  for (var player in scoreTable) {currentPlayers++;}
  var i = 0;

  var displayNumber = currentPlayers < maxDisplay ? currentPlayers : maxDisplay;

    
  for (var uid in scoreTable) {
    if (i < displayNumber) {
      var shipName = sim.getShip(uid).name;
      i++;
      ctx.beginPath();
      ctx.font = "italic 15px Josefin Sans";
      ctx.lineWidth = 2;
      ctx.fillStyle = colors[i - 1];
      ctx.textAlign="left"; 
      ctx.fillText("#" + i, (7/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fillText(shipName, (7.14/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fillText(scoreTable[uid], (7.8/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fill();
      ctx.closePath();
    } else {
      break;
    }
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "50px Josefin Sans";
  ctx.fillText(localHighScoreTable[player.uid], (1/15)*canvas.width, (9.5/10)*canvas.height);
}


function drawCompass() {
  drawCompassScaled(player.state.x, player.state.y, treasureX, treasureY, 50);
}

function drawFps() {
  ctx.fillStyle = "black";
  ctx.font = "15px Josefin Sans";
  ctx.fillText("fps: "+ display_fps, (1/10)*canvas.width, (1/10)*canvas.height);
}

//  Draws all objects
function draw(){
  viewport.x = player.state.x - canvas.width / (2 * viewport.scale);
  viewport.y = player.state.y - canvas.height / (2 * viewport.scale);

  drawBehindGrid(ctx);
  viewport.draw(ctx, canvas.width, canvas.height);
  drawCompass();
  drawScore();
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

  display_fps = Math.floor(1000/(delta));

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

  //  TODO send server our local time

  if ((typeof socket != "undefined") && socket.connected) {
    socket.emit('client_update', {state: player.state, updates : toSendServer});
    if (toSendServer.length > 0){
    }
    toSendServer = [];
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
                cell.gameObjects.push(obj);
              }
            }
            break;
          case 'create_cannonball':
            //  CHECK IF OWN CANNONBALL
              if (update.data.o.uid === our_id) break;

              var obj = serializer.deserializeObject(update.data);
              obj.cell.gameObjects.push(obj);
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
  our_id = data.id;
  sim = new Sim.Class(remote, meta.gridNumber, meta.cellWidth, meta.cellHeight,
    meta.activeCells);
  console.log(sim);
  //sim.populateMap(drawTreasure);
  serializer = new Serializer.Class(sim);
  deserializeNewStates(data.new_cells_states);
  
  updateHighScoresTable(data.scoresTable);


  //  Using 16:9 aspect ratio
  viewport = new Viewport(sim, 0, 0, 1.6, 0.9, 1);

  console.log("Our id is " + our_id);

  var pirateNames = ["William Kidd", "Blackbeard", "Long Ben", "Sir Francis Drake",
                     "Calico Jack", "Grace O'Malley", "Anne Bonny", "Thomas Tew", "Barbarossa"];

  var randomPirate = pirateNames[Math.floor(Math.random()*pirateNames.length)];

  var our_name = (localStorage['nickname'] == "") ?  randomPirate : localStorage['nickname'];
  remote.newPlayer(our_id, our_name, data.state);
  player = sim.addShip(our_id, our_name, data.state, localShipInput);
  player.scale = 1 + Math.random() * 2;
  player.hp = player.scale * 100;
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
