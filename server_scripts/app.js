const port = 3000;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var UUID = require("node-uuid");


app.use(express.static(path.resolve(__dirname + '/../public/')));
  //console.log(path.resolve(__dirname + '/../html/index.html'));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});

app.get('/game', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/game.html'));
});

app.get('/client/game.js', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/client/game.js'));
});

http.listen(port, function() {
  console.log('Listening on 3000');
});


//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();

  players[client.userid] = new Player(0,0);

  //  Give client their id and list of players
  var playerlist = []

  client.emit('on_connected', {id : client.userid, //playerIds : playerlist,
    players : players});

  //  Tell other users that a new player has joined
  client.broadcast.emit('player_joined', {id : client.userid, x : 0, y : 0});

  client.emit('playerlist', playerlist);

  //  Log
  console.log('\t socket.io:: player ' + client.userid + ' connected');

  //  On client disconnect
  client.on('disconnect', function () {
    console.log('\t socket.io:: client disconnected ' + client.userid );
    client.broadcast.emit('player_left',  {id : client.userid});
    delete players[client.userid];
  });

  //  On tick
  client.on('client_update', function(data) {
    players[client.userid] = {x : data.x, y : data.y, speed : data.speed, angle
    : data.angle};
    //  Respond with current server state, instead broadcast regularly?
    client.emit('server_update', players)
  });
});


//  Temporary basic world representation

const width = 1000;
const height = 1000;

var players = {};

function Player(x, y){
  this.x = x;
  this.y = y;
  this.speed = 0;
  this.angle = 0;
}
