(function(exports){

var pirateNames = [
"William Kidd", 
"Blackbeard", 
"Long Ben", 
"Sir Francis Drake",
"Calico Jack", 
"Grace O'Malley", 
"Anne Bonny", 
"Thomas Tew", 
"Barbarossa",
"Thomas Griggs",
"Ignatius VII"
];

exports.generate = function(){
  var i = Math.floor(pirateNames.length * Math.random());
  return pirateNames[i];
}

})(typeof exports == "undefined" ? this.PirateNameGenerator = {} : exports);
