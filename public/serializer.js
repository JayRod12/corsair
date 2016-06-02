if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
  Sim = require('../public/sim.js');
  Ship = require('../public/ship.js');
}

(function(exports){

// Serializer objects before sending them through sockets.

function Serializer(sim) {
  this.sim = sim;
}

Serializer.prototype.serializeObject = function (o) {
  if (typeof o.serialize != "undefined") {
    return o.serialize();
  } else {
    console.log('Serializing non-serializable object of type ' + typeof o);
    return null;
  }
}

Serializer.prototype.serializeArray = function(array) {
  return array.map(this.serializeObject);
}

Serializer.prototype.deserializeObject = function(serial) {
  if (serial == null) {
    return null;
  }
  switch (serial.type) {
    case "treasure":
      return serial.o;
    case "cannonball":
      return this.deserializeCannonBall(serial.o);
    case "ship":
      return this.deserializeShip(serial.o);
    case "test_obj":
      return this.deserializeTestObj(serial.o);
    default:
      console.log('Deserializing unrecognized object');
  }

}

Serializer.prototype.deserializeArray = function(array) {
  return array.map(function(o) {
    Serializer.prototype.deserializeObject(o);
  });
}

// TODO change cannon so it can be deserialized
Serializer.prototype.deserializeCannonBall = function(state) {
  console.log('deserializeCannonBall unimplemented');
  return null;
}


Serializer.prototype.deserializeShip = function(serial) {
  if (serial.uid == our_id) {
    return null;
  }
  return new Ship.Class(this.sim, serial.state, serial.uid, serial.name, 
    Game.createServerShipInput("brown", serial.name), drawCannonBalls);
}

Serializer.prototype.deserializeTestObj = function(state) {
  return new Sim.TestObj(this.sim, state);
}
exports.Class = Serializer;

})(typeof exports == 'undefined' ? this.Serializer = {} : exports);
