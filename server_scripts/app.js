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

var remote = new Game.Remote();

var socketList = [];

// Game related data

const gridNumber = 5;
const cellWidth  = 1500;
const cellHeight = 1500;
var allCells = [];
for (var i = 0; i < gridNumber * gridNumber; i++) {
    allCells.push(i);
}

var sim = new Sim.Class(remote,gridNumber, cellWidth, cellHeight, allCells);
sim.populateMap();
//var island = new Island(100, 100, 100, 100, Math.PI/4, "black");


function generateIslands(){
  var perlin = new Perlin(8 * gridNumber, 8 * gridNumber, 5, 0.5);
  var island_size = 32;
  var sea_level = 0.64;
  var max_x = gridNumber * cellWidth;
  var max_y = gridNumber * cellHeight;
  for (var y = 0; y < max_y; y+= island_size){
    console.log("Generating islands: " + y + "/" + Math.floor(max_y/island_size));
    for (var x = 0; x < max_x; x+= island_size){
      var l = perlin.perlin(x / max_x, y / max_y);
      if (l > sea_level){
        var color = "green";
        var i = new Island.Class(x, y, island_size, island_size, 0, color);
        sim.coordinateToCell(x,y).gameObjects.push(i);
      }
    }
  }
}

generateIslands();

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

  //  TODO don't spawn on top of other people or in 'danger'
  //  TODO fix initial vars
  var initState = {
    //x: Math.random()*Game.width,
    //y: Math.random()*Game.height,
    x: 20,
    y: 20,
    //angle: Math.random()*Math.PI/2,
    angle: +Math.PI/3,
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
    sim.addShip(client.userid, data.name, initState,
      Game.createServerShipInput(client.userid));

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

    var cells = calculateCellsToSend(client.userid);
    var old_cells = cells.intersection(client.cells);
    var new_cells = cells.diff(old_cells);
    client.cells = cells;

    //  Respond with current server state, instead broadcast regularly?
    var allBufferedUpdates = [];
    for (var i = 0; i < old_cells.length; i++){
      var tuple = sim.cellNumberToTuple(old_cells[i]);
      var bufferedUpdates = sim.grid[tuple.x][tuple.y].bufferedUpdates;
      if (bufferedUpdates.length > 0){
        allBufferedUpdates.push({num: old_cells[i], updates: bufferedUpdates});
      }
    }
    // Send serialized objects
    var new_cells_states = serializeNewCells(new_cells);

    var data = { players: remote.getPlayers(), active_cells:client.cells 
               , updates: allBufferedUpdates, scoresTable: remote.getUIDtoScores(), new_cells: new_cells_states};
    client.emit('server_update', data);
  });

  //  Clear update buffer
  //  ASSUME NO DROPPED PACKETS
  for (var i = 0; i < allCells.length; i++){
    sim.numberToCell(allCells[i]).bufferedUpdates = [];
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
  var s = sim.UIDtoShip[uid];
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


