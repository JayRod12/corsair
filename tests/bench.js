var asm = require('../dev/col/col.js');
var col = require('../public/collision_detection.js');

function time(string, f, it){
  var starttime = Date.now();
  for (var i = 0; i < it; i++){
    f();
  }
  console.log(string);
  console.log("Took: " + (Date.now() - starttime) + "ms for " + it +
      " iterations");
}

function gnutime(f1, f2, it){
  var starttime = Date.now();
  for (var i = 0; i < it; i++){
    f1();
  }
  var t1 = Date.now() - starttime;
  starttime = Date.now();
  for (var i = 0; i < it; i++){
    f2();
  }
  var t2 = Date.now() - starttime;
  console.log(it + "\t" + t1 + "\t" + t2);
}


/*
time ("trim Branch ASM", function(){asm._trimBranch(-10 + Math.random()*5)},
    10000000);
time ("trim Branch STD", function(){col.trimBranch(-10 + Math.random()*5)},
    10000000);
    */

function timeRange(string, f, rangeMin, rangeMax, step){
  for (var i = rangeMin; i < rangeMax; i+=step){
    time(string, f, i);
  }
}
function timeRangeLog(string, f, rangeMin, rangeMax, logstep){
  for (var i = rangeMin; i < rangeMax; i*=logstep){
    time(string, f, i);
  }
}
function gnutimeRangeLog(f1, f2, rangeMin, rangeMax, logstep){
  for (var i = rangeMin; i < rangeMax; i*=logstep){
    gnutime(f1, f2, i);
  }
}
var rMin = 10000;
var rMax = 1000000000;
var step = 2;
/*
timeRangeLog ("trim Branch ASM", function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);
timeRangeLog ("trim Branch ASM", function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);

    */


gnutimeRangeLog (function(){col.trimBranch(-10 + Math.random()*5)}, function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);
