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
var ping;
var lastTime;
var currentTime;
var delta;
var interval;
var toSendServer = [];

var player;
var meta;
var our_id;

// Game objects
var nearest_treasure = { x : -1, y : -1 };

// Game loops
var server_loop = 0;
var client_loop = 0;
var ping_loop = 0;
var ping_timeout = 1000;
var ping_sent_time;
var localHighScoreTable = {};
const MAXIMUM_SPEED = 4;


// Constants for the game
const speed_norm = 100 * 5;
const backColor = "rgb(104, 104, 104)";
const seaColor = "rgb(92, 184, 235)";
const seaHighlightColor = "rgb(102, 204, 255)";
const s_delay = 1000/40;


//  Draws all objects
function draw(){
  viewport.x = player.state.x - canvas.width / (2 * viewport.scale);
  viewport.y = player.state.y - canvas.height / (2 * viewport.scale);
  viewport.shipx = player.state.x;
  viewport.shipy = player.state.y;

  drawBehindGrid(ctx);
  viewport.draw(ctx, canvas.width, canvas.height);
  drawCompass();
  drawScore();
  drawHighScoresTable(localHighScoreTable);
  drawDebug();
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
    setupCompass();
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
}

//  Update the server about the player's position

function client_update(player){

  //  TODO send server our local time

  if ((typeof socket != "undefined") && socket.connected) {
    socket.emit('client_update', {state: player.state, updates : toSendServer,
        clienttime : sim.time});
    if (toSendServer.length > 0){
    }
    toSendServer = [];
  }
}

function endClient() {

  if (client_loop) {
    window.cancelAnimationFrame(client_loop);
    client_loop = 0;
  }
  if (server_loop) {
    clearInterval(server_loop);
    server_loop = 0;
  }
  socket.disconnect();
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
  function ping_func(){
    ping_sent_time = (new Date).getTime();
    socket.emit('corsair_ping', {}); 
  }

  socket.on('corsair_pong', function(){
    ping = Math.floor((new Date).getTime() - ping_sent_time);
    setTimeout(ping_func, ping_timeout);
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
    var server_time_diff = sim.time - data.servertime;

    var allBufferedUpdates = data.updates;
    for (var i = 0; i < allBufferedUpdates.length; i++){
      var num = allBufferedUpdates[i].num;
      var updates = allBufferedUpdates[i].updates;
      var cell = sim.numberToCell(num);
      for (var j = 0; j < updates.length; j++){
        var update = updates[j];
        switch(update.name){
          case 'create_testObj':
            cell.addObject(new Sim.TestObj(sim, update.data));
            break;
          case 'object_enter_cell':
            if (update.data.type == "ship") {
              if (update.data.o.uid != our_id) {
                var obj = serializer.deserializeObject(update.data,
                    server_time_diff);
                cell.addObject(obj);
              }
            }
            break;
          case 'create_cannonball':
            //  CHECK IF OWN CANNONBALL
            if (update.data.o.uid === our_id) break;

            var obj = serializer.deserializeObject(update.data, server_time_diff);
            obj.cell.addObject(obj);
            break;
          case 'remove_treasure':
            var treasure = serializer.deserializeObject(update.data,
                server_time_diff);
            sim.removeTreasure(treasure);
            break;
          case 'add_treasure':
            var treasure = serializer.deserializeObject(update.data,
                server_time_diff);
            sim.treasures.push(treasure);
            treasure.cell.addObject(treasure);
            break;
          case 'ship_update':
            console.log('ship update');
            var ship = sim.getShip(update.data.uid);
            ship.hp = update.data.hp;
            ship.gold = update.data.gold;
            sim.updateScale(update.data.uid, viewport, update.data.gold);
            console.log('GOLD ' + ship.gold);
            break;
          default:
            console.log("Unrecognised command from server " + update.name);
        }
      }
    }

    sim.time = data.servertime;


    deserializeNewStates(data.new_cells, server_time_diff);
    // Sim will only draw the active cells
    sim.activeCells = data.active_cells;
  });
  ping_func();
}

function deserializeNewStates(new_cells_states, server_time_diff) {
  for (var i = 0; i < new_cells_states.length; i++) {
    var cell = sim.numberToCell(new_cells_states[i].num);
    /*
    cell.staticObjects =
      serializer.deserializeArray(new_cells_states[i].state.static_obj)
                .filter(function(x) { return x != null; });
                */
    var objects = 
      serializer.deserializeArray(new_cells_states[i].state.game_obj,
          server_time_diff)
                .filter(function(x) { return x != null; });

    for (var j = 0; j < objects.length; j++){
      cell.addObject(objects[j]);
    }

    cell.prerenderedBackground = prerenderBackground(cell);
  }
}

// Terminate the game when the ship dies
function onShipDeath() {
  $('#game_canvas').hide();
  $('body').css({'background':'black'});
  $('#welcomeScreen').fadeIn('slow');
  console.log('Ship death ' + mouse_x + ', ' + mouse_y);
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
  sim = new Sim.Class(remote, data.meta.servertime, meta.gridNumber, meta.cellWidth, meta.cellHeight,
    meta.activeCells);
  serializer = new Serializer.Class(sim);
  sim.treasures = serializer.deserializeArray(data.treasures);

  deserializeNewStates(data.new_cells_states);

  updateHighScoresTable(data.scoresTable);


  //  Using 16:9 aspect ratio
  viewport = new Viewport(sim, 0, 0, 1.6, 0.9, 0.8);

  console.log("Our id is " + our_id);

  var our_name = (localStorage['nickname'] == "") ?
    PirateNameGenerator.generate() : localStorage['nickname'];

  remote.newPlayer(our_id, our_name, data.state);
  player = sim.addShip(our_id, our_name, data.state, localShipInput);
  player.isLocalShip = true;
  player.onDeath = onShipDeath;

  // Make compass point to nearest treasure
  setupCompass();

  //  Set our world up in the config described by the server
  for (var userid in data.players){
    if (userid != our_id) {
      addServerShip(userid, data.names[userid], data.players[userid]);
    }
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
