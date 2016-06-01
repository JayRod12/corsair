console.log("Starting...");

const port = 3000;
const server = true;

var init = false;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var UUID = require('node-uuid');
var Game = require('../public/shared_game.js');


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

//  On client connection
var socketList = [];
io.on('connection', function(client){

  //  Add to socketList
  socketList.push(client);
  
  //  Generate new client id associate with their connection
  client.userid = UUID();

  //  TODO don't spawn on top of other people or in 'danger'
  //  TODO fix initial vars
  var initState = {
    //x: Math.random()*Game.width,
    //y: Math.random()*Game.height,
    x: 10,
    y: 10,
    //angle: Math.random()*Math.PI/2,
    angle: +Math.PI/3,
    speed: 0
  };

  var ac = [];
  ac.push(sim.coordinateToCellIndex(initState.x, initState.y));
  var metadata = {
    gridNumber: gridNumber,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    //  Temp
    //activeCells: allCells
    activeCells: ac
  }

  var data = {id : client.userid, names : Game.getPlayerNames(),
        players : Game.getPlayers(), state: initState, meta: metadata};
  client.emit('on_connect', data);


  //  Wait for response

  client.on('on_connect_response', function (data){

    Game.newPlayer(client.userid, data.name, initState);
    sim.addShip(initState, client.userid,
      Game.createServerShipInput(client.userid));

    //  Tell other users that a new player has joined
    client.broadcast.emit('player_joined', {id : client.userid, name :
        data.name, state : initState});

    playerCount += 1;

    //  If we are not simulating we now have at least one player so we should
    //  begin simulating
    if (typeof sim_loop == "undefined" && init){
      console.log("starting simulation");
      sim_loop = setInterval(sim_loop_func, sim_t, sim_t);
      send_loop = setInterval(send_loop_func, send_t);
      test_loop = setInterval(test_loop_func, test_t);
    }


    //  Log
    console.log('\t socket.io:: player ' + client.userid + ' connected, ' +
        playerCount + ' players');
    client.emit('start_game', {});
  });




  //  On tick
  client.on('client_update', function(data) {
    Game.updatePlayer(client.userid, data.state);
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
    Game.removePlayer(client.userid);

    //  Stop simulating if noone is connected
    if (playerCount < 1){
      console.log("stopping simulation");
      clearInterval(sim_loop);
      clearInterval(test_loop);
    }
  });

});

function send_loop_func(){
  socketList.forEach(function (client) {
    var cells = calculateCellsToSend(client.userid);

    //  Respond with current server state, instead broadcast regularly?
    var allBufferedUpdates = [];
    for (var i = 0; i < cells.length; i++){
      var x = cells[i].x;
      var y = cells[i].y;
      var bufferedUpdates = sim.grid[x][y].bufferedUpdates;
      if (bufferedUpdates.length > 0){
        allBufferedUpdates.push({x:x, y:y, updates:
          bufferedUpdates});
      }
    }
    var data = {players: Game.getPlayers(), cells: allCells, updates: {}}; //cells: cells, updates: {}};
    //allBufferedUpdates};
    client.emit('server_update', data);
  });

  //  Clear update buffer
  //  ASSUME NO DROPPED PACKETS
  for (var i = 0; i < allCells.length; i++){
    sim.grid[allCells[i].x][allCells[i].y].bufferedUpdates = [];
  }

}

function calculateCellsToSend(uid){
  var s = Game.getPlayerShips()[uid];
  if (s == null) {
    return [];
  }
  var list = [];
  var base = sim.coordinateToCellIndex(s.state.x,s.state.y);
  if (base != null) {
    const bufferConst = 4;
    if (base.x + 1 < gridNumber && s.state.x % cellWidth > cellWidth/bufferConst){
      list.push({x:base.x+1, y:base.y})
    }
    if (base.y + 1 < gridNumber && s.state.y % cellHeight > cellHeight/bufferConst){
      list.push({x:base.x, y:base.y+1})
    }
    if (base.x - 1 > 0 && s.state.x % cellWidth < cellWidth/bufferConst){
      list.push({x:base.x-1, y:base.y})
    }
    if (base.y - 1 > 0 && s.state.y % cellHeight < cellHeight/bufferConst){
      list.push({x:base.x, y:base.y-1})
    }
    list.push(base);
  }
  return list;
}

var sim_loop_func = function(dt){
  //console.log(sim.activeCells);
  sim.tick(dt);
}

Game.Sim.prototype.addTestObject = function() {

  var w = 20 + 40 * Math.random();
  var h = 20 + 40 * Math.random();
  var x = (gridNumber * cellWidth - w) * Math.random();
  var y = (gridNumber * cellHeight - h) * Math.random();
 
  var state = {x: x, y: y, w: w, h: h};
  var obj = new Game.TestObj(this, state);
  var cell = this.coordinateToCell(state.x, state.y);
  cell.gameObjects.push(obj);
  cell.bufferedUpdates.push({name: 'create_testObj', data: state});
}

var test_loop_func = function(){
  sim.addTestObject();
}


Game.initializeGame();

const gridNumber = 5;
const cellWidth  = 1500;
const cellHeight = 1500;
var allCells = [];
for (var y = 0; y < gridNumber; y++){
  for (var x = 0; x < gridNumber; x++){
    allCells.push({x:x, y:y});
  }
}

var sim = new Game.Sim(gridNumber, cellWidth, cellHeight, allCells);
var sim_t = 1000 / 30;
var send_t = 1000 / 30;
var test_t = 1000 / 100;
var sim_loop;
var send_loop;
var test_loop;
var playerCount = 0;
var init = true;
