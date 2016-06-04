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

  this.deserializeArray = function(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++){
      ret.push(this.deserializeObject(array[i]));
    }
    return ret;
  }

  this.deserializeObject = function(serial) {
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
      case "island":
        return this.deserializeIsland(serial.o);
      default:
        console.log('Deserializing unrecognized object');
    }

  }

  // TODO change cannon so it can be deserialized
  this.deserializeCannonBall = function(state) {
    console.log('deserializeCannonBall unimplemented');
    return null;
  }


  this.deserializeShip = function(serial) {
    if (serial.uid == our_id) {
      return null;
    }
    console.log('Deserializing ship');
     
    var ship = new Ship.Class(this.sim, serial.state, serial.uid, serial.name,
                              Game.createServerShipInput(serial.uid));
    this.sim.UIDtoShip[serial.uid] = ship;
    return ship;
  }
  this.deserializeTestObj = function(state) {
    return new Sim.TestObj(this.sim, state);
  };
  this.serializeObject = function (o) {
    if (typeof o.serialize != "undefined") {
      return o.serialize();
    } else {
      console.log('Serializing non-serializable object of type ' + typeof o);
      return null;
    }
  };

  this.deserializeIsland = function(o) {
    return new Island.Class(o.x, o.y, o.h, o.w, o.angle, o.colour); 
  };

  this.serializeArray = function(array) {
    return array.map(this.serializeObject);
  };
}



exports.Class = Serializer;

})(typeof exports == 'undefined' ? this.Serializer = {} : exports);
