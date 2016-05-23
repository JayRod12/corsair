var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
//var socket = require('socket.io')(http);

app.use(express.static(path.resolve(__dirname + '/../public/')));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});

app.get('/game', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/game.html'));
});

http.listen(3000, function() {
  console.log('Listening on 3000');
});
