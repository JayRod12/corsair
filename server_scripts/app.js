const port = 3000;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var UUID = require('node-uuid');
var Game = require('../shared_game.js');


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

Game.initializeGame();

//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();


  Game.newPlayer(client.userid);


  client.emit('on_connected', {id : client.userid,
    players : Game.getPlayers});

  //  Tell other users that a new player has joined
  client.broadcast.emit('player_joined', {id : client.userid, x : 0, y : 0});


  //  Log
  console.log('\t socket.io:: player ' + client.userid + ' connected');

  //  On client disconnect
  client.on('disconnect', function () {
    console.log('\t socket.io:: client disconnected ' + client.userid );
    client.broadcast.emit('player_left',  {id : client.userid});
    Game.deletePlayer(client.userid);
  });

  //  On tick
  client.on('client_update', function(data) {
    Game.updatePlayer({userid: client.userid, x : data.x, y : data.y, speed : data.speed, angle
    : data.angle});
    //  Respond with current server state, instead broadcast regularly?
    client.emit('server_update', Game.getPlayers())
  });

});

