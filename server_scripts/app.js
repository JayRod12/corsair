const port = 3000;
const server = true;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var UUID = require('node-uuid');
var Game = require('../public/shared_game.js');
var bodyParser = require('body-parser');


app.use(express.static(path.resolve(__dirname + '/../public/')));
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});

app.post('/game', function(req, res) {
  // TODO: use name variable
  var name = req.body.shipName;
  res.sendFile(path.resolve(__dirname + '/../html/game.html'));
});

app.post('/highScores', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/highScores.html'));
});

app.post('/index', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});


http.listen(process.env.PORT || port, function() {
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
  sim.addShip(initState, client.userid,
    Game.createServerShipInput(client.userid));

  //  Tell other users that a new player has joined
  client.broadcast.emit('player_joined', {id : client.userid, state : 
    initState});

  playerCount += 1;

  //  If we are not simulating we now have at least one player so we should
  //  begin simulating
  if (typeof sim_loop == "undefined"){
    console.log("starting simulation");
    sim_loop = setInterval(sim.tick, sim_t, sim_t);
  }


  //  Log
  console.log('\t socket.io:: player ' + client.userid + ' connected, ' +
      playerCount + ' players');

  //  On client disconnect
  client.on('disconnect', function () {

    console.log('\t socket.io:: client disconnected ' + client.userid + '  ' +
      playerCount + ' players');
    client.broadcast.emit('player_left',  {id : client.userid});
    Game.removePlayer(client.userid);
    playerCount -= 1;

    //  Stop simulating if noone is connected
    if (playerCount < 1){
      console.log("stopping simulation");
      clearInterval(sim_loop);
    }
  });

  //  On tick
  client.on('client_update', function(data) {
    Game.updatePlayer(client.userid, data.state);
    //  Respond with current server state, instead broadcast regularly?
    client.emit('server_update', Game.getPlayers())
  });

});


Game.initializeGame();

var sim = new Game.Sim();
var sim_t = 1000 / 60;
var sim_loop;
var playerCount = 0;
