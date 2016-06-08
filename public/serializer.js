if (typeof exports === 'undefined'){
  //  Browser
}
else{
  //  Server
  Cannon = require('../public/cannon.js');
  Game = require('../public/shared_game.js');
  Sim = require('../public/sim.js');
  Ship = require('../public/ship.js');
  Treasure = require('../public/treasure.js');
}

(function(exports){

// Serializer objects before sending them through sockets.

function Serializer(sim) {

  //  It feels wrong for the below to be commented but it is correct
  //this.sim = sim;

  this.deserializeArray = function(array, server_time_diff) {
    var ret = [];
    for (var i = 0; i < array.length; i++){
      ret.push(this.deserializeObject(array[i]));
    }
    return ret;
  }

  this.deserializeObject = function(serial, server_time_diff) {
    if (serial == null) {
      return null;
    }

    //  TODO calculate difference in time between server and client and send
    //  along with update

    return this.deserializeObjFunctions[serial.type](serial.o, server_time_diff);

  }

  this.deserializeShip = function(o) {
    if (o.uid == our_id) {
      return null;
    }
    console.log('Deserializing ship');
     
    var ship = new Ship.Class(this.sim, o.state, o.uid, o.name,
                              Game.createServerShipInput(o.uid));
    this.sim.setShip(o.uid, ship);
    return ship;
  };

  this.serializeObject = function (o) {
    if (typeof o.serialize != "undefined") {
      return o.serialize();
    } else {
      console.log('Serializing non-serializable object of type ' + typeof o);
      return null;
    }
  };

  this.serializeArray = function(array) {
    return array.map(this.serializeObject);
  };

  this.deserializeObjFunctions = {

    //  Identity function
    treasure : function(o) {
      return new Treasure.Class(sim, o.x, o.y, o.value, o.hp);
    },

    island : function(o) {
      return new Island.Class(sim, o.x, o.y, o.h, o.w, o.angle, o.color); 
    },


    //  NOTE in the server these are in static objects but when we deserialize we
    //  place in gameObjects
    cosmetic_island : function(o) {
      return new Island.Cosmetic(sim, o.x, o.y, o.h, o.w, o.angle, o.color); 
    },

    // TODO change cannon so it can be deserialized
    cannonball : function(serial, server_time_diff) {
      var state = {
        x: serial.x + server_time_diff * serial.xvel,
        y: serial.y + server_time_diff * serial.yvel,
        xvel: serial.xvel,
        yvel: serial.yvel,
      }

      //  TODO
      //  UIDtoShip may return false if ship is not in a loaded cell
      //  what do we do in this case?
      return new Cannon.CannonBall(sim, serial.uid, state,
          serial.level);
    },


    ship : function(serial) {
      if (serial.uid == our_id) {
        return null;
      }
       
      var ship = new Ship.Class(sim, serial.state, serial.uid, serial.name,
                                Game.createServerShipInput(serial.uid));
      ship.hp = serial.hp;
      ship.scale = serial.scale;
      sim.UIDtoShip[serial.uid] = ship;
      return ship;
    },

    test_obj : function(state) {
      return new Sim.TestObj(sim, state);
    }

  }
}



exports.Class = Serializer;

})(typeof exports == 'undefined' ? this.Serializer = {} : exports);
