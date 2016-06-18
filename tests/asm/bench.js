var asm = require('../../dev/col/col.js');
var asm_opt = require('../../dev/col/col_opt.js');
var col = require('../../public/collision_detection.js');
var cases = require('../coll_cases.js');
var pos_cases = cases.pos_array;
var neg_cases = cases.neg_array;

function time(string, f, it){
  var starttime = Date.now();
  for (var i = 0; i < it; i++){
    f();
  }
  console.log(string);
  console.log("Took: " + (Date.now() - starttime) + "ms for " + it +
      " iterations");
}

function gnutime(f1, f2, f3, it){
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
  starttime = Date.now();
  for (var i = 0; i < it; i++){
    f3();
  }
  var t3 = Date.now() - starttime;
  console.log(it + "\t" + t1 + "\t" + t2 + "\t" + t3);
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
function gnutimeRangeLog(f1, f2, f3, rangeMin, rangeMax, logstep){
  for (var i = rangeMin; i < rangeMax; i*=logstep){
    gnutime(f1, f2, f3, i);
  }
}
var rMin = 1000;
var rMax = 1000000;
var step = 2;
/*
timeRangeLog ("trim Branch ASM", function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);
timeRangeLog ("trim Branch ASM", function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);

    */


/*
gnutimeRangeLog (function(){col.trimBranch(-10 + Math.random()*5)}, function(){asm._trimBranch(-10 + Math.random()*5)},
    rMin, rMax, step);
    */
function asmrectrect(r1, r2){
  var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
  var h2 = Math.sqrt(r2.w * r2.w + r2.h * r2.h);
  return asm._rectrect(r1.x, r1.y, r1.w, r1.h, r1.a, h1,
                      r2.x, r2.y, r2.w, r2.h, r2.a, h2);
}
function asmoptrectrect(r1, r2){
  var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
  var h2 = Math.sqrt(r2.w * r2.w + r2.h * r2.h);
  return asm_opt._rectrect(r1.x, r1.y, r1.w, r1.h, r1.a, h1,
                      r2.x, r2.y, r2.w, r2.h, r2.a, h2);
}
function colrectrect(r1, r2){
  var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
  var h2 = Math.sqrt(r2.w * r2.w + r2.h * r2.h);
  return col.RectRect({ x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w,
    height : r1.w, angle : r1.a }, 
    { x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w, height : r1.w, angle : r1.a
    });
}
function getRekt() {
  var rand = Math.floor(Math.random() * (pos_cases.length + neg_cases.length));
  if (rand >= pos_cases.length)
    return neg_cases[rand-pos_cases.length];
  return pos_cases[rand];
}
gnutimeRangeLog (
  function(){
    r1 = getRekt();
    r2 = getRekt();
    colrectrect(r1, r2);},
  function(){
    r1 = getRekt();
    r2 = getRekt();
    asmrectrect(r1, r2);},
  function(){
    r1 = getRekt();
    r2 = getRekt();
    asmoptrectrect(r1, r2);},
    rMin, rMax, step);
