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
    var r2 = pos_cases[i].r2;
    it('Should collide_'+i.toString(), function(){
      assert(Collisions.collisionDetection(r1, r2, true), 
        'Isn\'t fucking colliding where it should be');
    });
  }

  it('Should collide with itself', function(){
    var r1 = pos_cases[0].r1;
    assert(Collisions.collisionDetection(r1, r1, true), 
      'Isn\'t colliding with itself, wtf?');
  });
});

describe('Collision detection - negative cases:', function(){

  for (var i = 0; i < neg_cases.length; i++){
    var r1 = neg_cases[i].r1;
    assert(r1.x);
    var r2 = neg_cases[i].r2;
    it('Shouldn\'t collide_'+i.toString(), function(){
      assert(!Collisions.collisionDetection(r1, r2, true),
        'Is colliding when the objects don\'t overlap, what are you doing Tom?');
    });
  }

});