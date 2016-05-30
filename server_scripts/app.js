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

app.get('/game', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/game.html'));
});


http.listen(process.env.PORT || port, function() {
  console.log('Listening on 3000');
});

//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();




  //  TODO don't spawn on top of other people or in 'danger'
  //  TODO fix initial vars
  var initState = {
    x: Math.random()*Game.width,
    y: Math.random()*Game.height,
    x: 0,
    y: 0,
    angle: Math.random()*Math.PI/2,
    angle: +Math.PI/3,
    speed: 0
  };

  var metadata = {
    gridNumber: gridNumber,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    //  Temp
    activeCells: allCells
  }

  client.emit('on_connect', {id : client.userid, names : Game.getPlayerNames(),
    players : Game.getPlayers(), state: initState, meta: metadata});


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
      console.log(sim.activeCells.length);
      sim_loop = setInterval(sim_loop_func, sim_t, sim_t);
      //sim_loop = setInterval(sim.tick, sim_t, sim_t);
    }


    //  Log
    console.log('\t socket.io:: player ' + client.userid + ' connected, ' +
        playerCount + ' players');

    client.emit('start_game', {});
  });




  //  On tick
  client.on('client_update', function(data) {
    Game.updatePlayer(client.userid, data.state);
    //  Respond with current server state, instead broadcast regularly?
    client.emit('server_update', Game.getPlayers())
  });

  //  On client disconnect
  client.on('disconnect', function () {

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
    }
  });

});

var sim_loop_func = function(dt){
  //console.log(sim.activeCells);
  sim.tick(dt);
}


Game.initializeGame();

const gridNumber = 5;
const cellWidth  = 200;
const cellHeight = 200;
var allCells = [];
for (var y = 0; y < gridNumber; y++){
  for (var x = 0; x < gridNumber; x++){
    allCells.push({x:x, y:y});
  }
}

var sim = new Game.Sim(gridNumber, cellWidth, cellHeight, allCells);
var sim_t = 1000 / 60;
var sim_loop;
var playerCount = 0;
var init = true;
