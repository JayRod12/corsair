if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
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
  return array.map(serializeObject);
}

Serializer.prototype.deserializeObject = function(serial, aux) {
  if (serial == null) {
    return null;
  }
  switch (serial.type) {
    case "treasure":
      return serial.o;
    case "cannonball":
      return deserializeCannonBall(serial.o, aux);
    case "ship":
      return deserializeShip(serial.o, aux);
    case "test_obj":
      return deserializeTestObj(serial.o, aux);
    default:
      console.log('Deserializing unrecognized object');
  }

}

Serializer.prototype.deserializeArray = function(array, aux) {
  return array.map(function(o) {
    deserializeObject(o, aux);
  });
}

// TODO change cannon so it can be deserialized
Serializer.prototype.deserializeCannonBall = function(state) {
  console.log('deserializeCannonBall unimplemented');
  return null;
}

exports.Class = Serializer;

})(typeof exports == 'undefined' ? this.Serializer = {} : exports);
