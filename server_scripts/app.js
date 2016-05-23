var express = require('express');
var app = express();
var http = require('http').Server(app);
//var socket = require('socket.io')(http);

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/game', function(req, res) {
  res.sendFile(__dirname + '/html/game.html');
});

http.listen(3000, function() {
  console.log('Listening on 3000');
});
