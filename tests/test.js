var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Cases = require('./coll_cases.js');
var pos_cases = Cases.pos_array;
var neg_cases = Cases.neg_array;
var Collisions = require('../public/collision_detection.js');

describe('Collision detection - positive cases:', function(){
  for (var i = 0; i < pos_cases.length; i++){
    var r1 = pos_cases[i].r1;
    var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
    r1 = { x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w, height : r1.w, angle : r1.a };
    var r2 = pos_cases[i].r2;
    var h2 = Math.sqrt(r2.w * r2.w + r2.h * r2.h);
    r2 = { x : r2.x, y : r2.y, hypotenuse : h2, width : r2.w, height : r2.w, angle : r2.a };
    it('Should collide_'+i.toString(), function(){
      assert(Collisions.RectRect(r1, r2), 
        'Isn\'t colliding where it should be');
    });
  }

  for (var i = 0; i < pos_cases.length; i++){
    var r1 = pos_cases[i].r1;
    var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
    r1 = { x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w, height : r1.w, angle : r1.a };
    it('R1_' +i.toString()+ ' Should collide with itself', function(){
      assert(Collisions.RectRect(r1, r1), 
        'Isn\'t colliding with itself');
    });
  }

  for (var i = 0; i < pos_cases.length; i++){
    var r1 = pos_cases[i].r2;
    var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
    r1 = { x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w, height : r1.w, angle : r1.a };
    it('R2_' +i.toString()+ ' Should collide with itself', function(){
      assert(Collisions.RectRect(r1, r1), 
        'Isn\'t colliding with itself');
    });
  }

});

describe('Collision detection - negative cases:', function(){

  for (var i = 0; i < neg_cases.length; i++){
    var r1 = neg_cases[i].r1;
    var h1 = Math.sqrt(r1.w * r1.w + r1.h * r1.h);
    r1 = { x : r1.x, y : r1.y, hypotenuse : h1, width : r1.w, height : r1.w, angle : r1.a };
    assert(r1.x);
    var r2 = neg_cases[i].r2;
    var h2 = Math.sqrt(r2.w * r2.w + r2.h * r2.h);
    r2 = { x : r2.x, y : r2.y, hypotenuse : h2, width : r2.w, height : r2.w, angle : r1.a };
    it('Shouldn\'t collide_'+i.toString(), function(){
      assert(!Collisions.RectRect(r1, r2),
        'Is colliding when the objects don\'t overlap, what are you doing Tom?');
    });
  }

});
