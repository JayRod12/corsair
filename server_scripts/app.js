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
    console.log("AFWAF");
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
  //res.sendFile(__dirname + '/../html/index.html');
});

app.get('/game', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/game.html'));
  //res.sendFile(__dirname + '../html/game.html');
});

app.get('/game.js', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../client/game.js'));
  //res.sendFile(__dirname + '../html/game.html');
});

http.listen(port, function() {
  console.log('Listening on 3000');
});


//  On client connection
io.on('connection', function(client){

  
  //  Generate new client id associate with their connection
  client.userid = UUID();

  players[client.userid] = new Player(0,0);

  //  Give client their id
  client.emit('onconnected', {id : client.userid});

  client.broadcast.emit('player_joined', {id : client.userid});

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
