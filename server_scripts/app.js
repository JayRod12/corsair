console.log("Starting...");

const port = 3000;
const server = true;


var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var UUID = require('node-uuid');
var Game = require('../public/shared_game.js');
var Sim = require('../public/sim.js');
var Perlin = require('../public/perlin.js').Class;
var ServerGame = require('./server_game.js');

var remote = new Game.Remote();

var socketList = [];

// Game related data

const gridNumber = 2;
const cellWidth  = 1500;
const cellHeight = 1500;
var allCells = [];
for (var i = 0; i < gridNumber * gridNumber; i++) {
    allCells.push(i);
}

var sim = new Sim.Class(remote,gridNumber, cellWidth, cellHeight, allCells);
sim.populateMap();
//var island = new Island(100, 100, 100, 100, Math.PI/4, "black");

ServerGame.generateIslands(sim, gridNumber, cellWidth, cellHeight);

//  Testing safe spawn algorithm

/*
for (var i = 0; i < 250; i++){
  var timeout = 10000;
  var x, y;
  while (timeout --> 0){
    x = Math.random()*gridNumber * cellWidth;
    y = Math.random()*gridNumber * cellHeight;
    if (ServerGame.checkSafeSpawn(sim, x, y)) break;
  }
  if (timeout <= 0) {
    console.log("breaking");
    break;
  }
  var testObj = new Sim.TestObj(sim, {x:x, y:y, w:32, h:32});
  //  Ugly
  sim.coordinateToCell(x, y).gameObjects.push(testObj);
}
*/

var sim_t = 1000 / 30;
var serializer = new Game.Serializer(sim);

var send_t = 1000 / 30;
var test_t = 1000 / 100;
var sim_loop = 0;
var send_loop = 0;
var test_loop = 0;
var playerCount = 0;

// SERVER
app.use(express.static(path.resolve(__dirname + '/../public/')));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});

app.get('/highScores', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/highScores.html'));
});

http.listen(process.env.PORT || port, function() {
  console.log('Listening on 3000');
});



// SOCKETS

//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();

  var initState;
  var timeout = 1000;
  var x, y;
  while (timeout > 0){
    x = Math.random()*gridNumber * cellWidth;
    y = Math.random()*gridNumber * cellHeight;
    if (ServerGame.checkSafeSpawn(sim, x, y)) break;
  }
  


  var initState = {
    x: x,
    y: y,
    angle: Math.random()*Math.PI*2,
    speed: 0
  };



  var ac = [];
  ac.push(sim.coordinateToCellNumber(initState.x, initState.y));
  client.cells = ac;

  var metadata = {
    gridNumber: gridNumber,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    activeCells: ac
  };

  var new_cells_states = serializeNewCells(ac);
  var data = {id : client.userid, names : remote.getPlayerNames(),
        players : remote.getPlayers(), state: initState, meta: metadata, new_cells_states: new_cells_states };
  client.emit('on_connect', data);


  //  Wait for response

  client.on('on_connect_response', function (data){

    remote.newPlayer(client.userid, data.name, initState);
    var ship = sim.addShip(client.userid, data.name, initState,
      Game.createServerShipInput(client.userid));

    // Notify players in this cell that a new ship arrives
    var cell = sim.coordinateToCell(initState.x, initState.y);
    cell.addUpdate('object_enter_cell', ship);

    //  Add to socketList, ie. start sending client updates
    socketList.push(client);

    //  Tell other users that a new player has joined
    client.broadcast.emit('player_joined', {id : client.userid, name :
        data.name, state : initState});

    playerCount += 1;

    //  If we are not simulating we now have at least one player so we should
    //  begin simulating
    console.log("starting simulation");

    if (sim_loop == 0) {
      sim_loop = setInterval(sim_loop_func, sim_t, sim_t);
    }

    if (send_loop == 0) {
      send_loop = setInterval(send_loop_func, send_t);
    }

    /*
      //  Uncomment for instance testing
    if (test_loop == 0) {
      test_loop = setInterval(test_loop_func, test_t);
    }
    */


    //  Log
    console.log('\t socket.io:: player ' + client.userid + ' connected, ' +
        playerCount + ' players');
    client.emit('start_game', {});
  });




  //  On tick
  client.on('client_update', function(data) {
    remote.updatePlayer(client.userid, data.state);
    for (var i = 0; i < data.updates.length; i++){
      //  Only allow deserialization of certain objects
      var serial = data.updates[i];
      if (serial.type === "cannonball"){
        var cannonball = serializer.deserializeObject(serial);
        var cell = cannonball.cell;
        cell.gameObjects.push(cannonball);
        cell.addUpdate('create_cannonball', cannonball);
      }
    }
  });

  //  On client disconnect
  client.on('disconnect', function () {
    
    //  Remove from socketlist
    for (var i = 0; i < socketList.length; i++){
      if (socketList[i] == client){
        socketList.splice(i, 1);
      }
    }

    // Decrement count
    playerCount -= 1;

    console.log('\t socket.io:: client disconnected ' + client.userid + '  ' +
      playerCount + ' players');
    client.broadcast.emit('player_left',  {id : client.userid});
    remote.removePlayer(client.userid);
    if (sim.UIDtoShip[client.userid]){
      sim.removeObject(sim.UIDtoShip[client.userid]);
    }

    //  Stop simulating if noone is connected
    if (playerCount < 1){
      console.log("stopping simulation");
      if (sim_loop != 0) { 
        clearInterval(sim_loop);
        sim_loop = 0;
      }
      if (test_loop != 0) { 
        clearInterval(test_loop);
        test_loop = 0;
      }
      if (send_loop) {
        clearInterval(send_loop);
        send_loop = 0;
      }
    }
  });

});

// Allows array difference computation
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

Array.prototype.intersection = function(a) {
  return this.filter(function(n) {
    return a.indexOf(n) != -1;
  });
};

function send_loop_func(){
  //console.log('SocketList of length ' + socketList.length);
  socketList.forEach(function (client) {
    if (typeof client.cells == "undefined") {
      client.cells = [];
    }

    // Find all cells of interest for the client
    var cells = calculateCellsToSend(client.userid);
    // Find which cells it already knows about
    var old_cells = cells.intersection(client.cells);
    // Find which cells it has no information about
    var new_cells = cells.diff(old_cells);
    // Store active cells to compare during next loop
    client.cells = cells;

    //  Send buffered updates from all cells that we already have information
    //  about, no need to send all objects again, only the updates.
    var allBufferedUpdates = [];
    for (var i = 0; i < old_cells.length; i++){
      var cell = sim.numberToCell(old_cells[i]);
      var cell_updates = cell.getUpdates();

      if (cell_updates.length > 0){
        allBufferedUpdates.push({ num: old_cells[i]
                                , updates: cell_updates });
      }
    }
    // Send all objects from the new cells (serialized)
    var new_cells_states = serializeNewCells(new_cells);

    // Prepare data
    var data = { players: remote.getPlayers(), active_cells:client.cells 
               , updates: allBufferedUpdates, scoresTable: remote.getUIDtoScores(), new_cells: new_cells_states};

    // Send
    client.emit('server_update', data);
  });

  //  Clear update buffer
  //  ASSUME NO DROPPED PACKETS
  for (var i = 0; i < allCells.length; i++){
    sim.numberToCell(allCells[i]).clearUpdates();
  }

}

function serializeNewCells(new_cells) {
  var new_cells_states = [];
  for (var i = 0; i < new_cells.length; i++) {
    var cell_game_objects = sim.numberToCell(new_cells[i]).gameObjects;
    var cell_static_objects = sim.numberToCell(new_cells[i]).staticObjects;
    var cell_state = { game_obj: serializer.serializeArray(cell_game_objects)
                     , static_obj: serializer.serializeArray(cell_static_objects) };

    new_cells_states.push({ num: new_cells[i]
                          , state: cell_state });
  }
  return new_cells_states;
}

function calculateCellsToSend(uid){
  var s = sim.getShip(uid);
  if (s == null) {
    //console.log('No cells to send');
    return [];
  }
  var list = [];
  var base = sim.coordinateToCellIndex(s.state.x,s.state.y);
  var x_pos = false;
  var x_neg = false;
  var y_pos = false;
  var y_neg = false;
  if (base != null) {
    const bufferConst = 2;
   
    x_pos = base.x + 1 < gridNumber && s.state.x % cellWidth > cellWidth/bufferConst;
    y_pos = base.y + 1 < gridNumber && s.state.y % cellHeight > cellHeight/bufferConst;
    x_neg = base.x - 1 >= 0 && s.state.x % cellWidth < cellWidth/bufferConst;
    y_neg = base.y - 1 >= 0 && s.state.y % cellHeight < cellHeight/bufferConst;

    if (x_pos){
      list.push(sim.cellTupleToNumber({x:base.x+1, y:base.y}));
      if (y_pos) {
        list.push(sim.cellTupleToNumber({x:base.x+1, y:base.y+1}));
      } else if (y_neg) {
        list.push(sim.cellTupleToNumber({x:base.x+1, y:base.y-1}));
      }
    } else if (x_neg) {
      list.push(sim.cellTupleToNumber({x:base.x-1, y:base.y}));
      if (y_pos) {
        list.push(sim.cellTupleToNumber({x:base.x-1, y:base.y+1}));
      } else if(y_neg) {
        list.push(sim.cellTupleToNumber({x:base.x-1, y:base.y-1}));
      }
    }

    if (y_pos) {
      list.push(sim.cellTupleToNumber({x:base.x, y:base.y+1}));
    } else if(y_neg) {
      list.push(sim.cellTupleToNumber({x:base.x, y:base.y-1}));
    }
    
    list.push(sim.cellTupleToNumber(base));
  }
  return list;
}

var sim_loop_func = function(dt){
  sim.tick(dt);
}


var test_loop_func = function(){
  sim.addTestObject();
}


