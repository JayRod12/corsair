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
"Ignatius VII",
"Lord Slocombe",
"First Mate Jaime"
];

exports.generate = function(){
  var i = Utils.randInt(pirateNames.length);
  return pirateNames[i];
}

})(typeof exports == "undefined" ? this.PirateNameGenerator = {} : exports);
