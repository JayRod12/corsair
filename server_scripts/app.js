const port = 3000;
const server = true;

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


http.listen(port, function() {
  console.log('Listening on 3000');
});

//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();




  //  TODO don't spawn on top of other people or in 'danger'
  var initState = {
    x: Math.random()*Game.width,
    y: Math.random()*Game.height,
    angle: Math.random()*2*Math.PI,
    speed: 0
  };


  client.emit('on_connected', {id : client.userid,
    players : Game.getPlayers(), state: initState});

  Game.newPlayer(client.userid, initState);
  sim.addShip(initState, Game.getPlayers()[client.userid],
    Game.createServerShipInput(client.userid));

  //  Tell other users that a new player has joined
  client.broadcast.emit('player_joined', {id : client.userid, state : 
    initState});


  //  Log
  console.log('\t socket.io:: player ' + client.userid + ' connected');

  //  On client disconnect
  client.on('disconnect', function () {
    console.log('\t socket.io:: client disconnected ' + client.userid );
    client.broadcast.emit('player_left',  {id : client.userid});
    Game.removePlayer(client.userid);
  });

  //  On tick
  client.on('client_update', function(data) {
    console.log("from client " + data.state.x);
    Game.updatePlayer(client.userid, data.state);
    console.log("from client " + Game.getPlayers()[client.userid].x);
    //  Respond with current server state, instead broadcast regularly?
    client.emit('server_update', Game.getPlayers())
  });

});


Game.initializeGame();

var sim = new Game.Sim();
var sim_t = 1000 / 60;
var sim_loop = setInterval(sim.tick, sim_t, sim_t);
