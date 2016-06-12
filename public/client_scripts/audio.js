(function(exports){

var a_ctx; 
window.addEventListener('load', audio_init, false);

var loaded = false;

var cannonDryLoader;
var cannonWetLoader;
var reverbBuffer;

var pickupLoader;
var impactLoader;

var ambianceLoader;
function audio_init(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
  }
  catch(e) {
    console.error("Error: Web Audio API is unsupported in this browser");
    return;
  }
  a_ctx = new AudioContext();

  //  Cannon
  var cannon_sfx_count = 5;
  var cannon_dry_filenames = [];
  var cannon_wet_filenames = [];
  for (var i = 0; i < cannon_sfx_count; i++){
    cannon_dry_filenames.push('../media/cannon_sfx/dry/cannon'+i+'.wav');
    cannon_wet_filenames.push('../media/cannon_sfx/wet/cannon'+i+'.wav');
  }

  cannonDryLoader = new BufferLoader(a_ctx, cannon_dry_filenames, finishedLoading);
  cannonWetLoader = new BufferLoader(a_ctx, cannon_wet_filenames, finishedLoading);
  cannonDryLoader.load();
  cannonWetLoader.load();

  //  Pickup
  var pickup_sfx_count = 3;
  var pickup_filenames = [];
  for (var i = 0; i < pickup_sfx_count; i++){
    pickup_filenames.push('../media/loot_sfx/pickup'+i+'.wav');
  }
  pickupLoader = new BufferLoader(a_ctx, pickup_filenames, finishedLoading);
  pickupLoader.load();

  //  Impact
  var impact_sfx_count = 3;
  var impact_filenames = [];
  for (var i = 0; i < impact_sfx_count; i++){
    impact_filenames.push('../media/impact/impact'+i+'.wav');
  }
  impactLoader = new BufferLoader(a_ctx, impact_filenames, finishedLoading);
  impactLoader.load();

  ambianceLoader = new BufferLoader(a_ctx, ['../media/ambiance.ogg'],
      playAmbiance);
  ambianceLoader.load();
}

var cannon_sfx;

//function finishedLoading(){
//}
function finishedLoading(bufferList) {
  loaded = true;
}


var cannonBallVolume = 0.8;

function broadside(cannons, raw_delay, dist){
  var delay = raw_delay * 2;
  for (var i = 0; i < cannons; i++){
    var dist_i = (dist + (i / cannons))/2;
    var f = function(){
      playCannonFire(dist_i);
    };
    setTimeout(f, delay * i );
  }
}

//  Dist is a value from 0 to 1
function playCannonFire(dist) {
  var n = Math.floor(Math.random() * cannonDryLoader.bufferList.length);
  var dist_2 = dist * dist;
  var inv_dist_2 = (1-dist) * (1-dist);

  var sourceDry = a_ctx.createBufferSource();
  var sourceWet = a_ctx.createBufferSource();
  sourceDry.buffer = cannonDryLoader.bufferList[n];
  sourceWet.buffer = cannonWetLoader.bufferList[n];

  var gainDry = a_ctx.createGain();
  var gainWet = a_ctx.createGain();
  gainDry.gain.value = inv_dist_2 * cannonBallVolume;
  gainWet.gain.value = dist_2 * cannonBallVolume;

  var biquadFilter = a_ctx.createBiquadFilter();
  biquadFilter.type = "lowpass";
  biquadFilter.frequency.value = 1000 + (inv_dist_2)*5000;
  biquadFilter.gain.value = 25;


  sourceDry.connect(gainDry);
  sourceWet.connect(gainWet);

  gainDry.connect(biquadFilter);
  gainWet.connect(biquadFilter);

  biquadFilter.connect(a_ctx.destination);

  sourceDry.start(0);
  sourceWet.start(0);
}

function playSound(buffer, level, loop){
  var source = a_ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  var gain = a_ctx.createGain();
  gain.gain.value = level;
  source.connect(gain);
  gain.connect(a_ctx.destination);
  source.start(0);
}

var pickup_volume = 0.4;
function playPickup(){

  var n = Math.floor(Math.random() * pickupLoader.bufferList.length);
  playSound(pickupLoader.bufferList[n], pickup_volume);
  /*
  var source = a_ctx.createBufferSource();
  source.buffer = pickupLoader.bufferList[n];
  var gain = a_ctx.createGain();
  gain.gain.value = pickup_volume;
  source.connect(gain);
  gain.connect(a_ctx.destination);
  source.start(0);
  */
}

var impact_volume = 0.5;
function playImpact(dist){
  //  TODO low pass?
  var n = Math.floor(Math.random() * impactLoader.bufferList.length);
  playSound(impactLoader.bufferList[n], impact_volume);

}

var ambiance_volume = 0.15;
function playAmbiance(bufferList){
  playSound(bufferList[0], ambiance_volume, true);

}


exports.broadside = broadside;
exports.playCannonFire = playCannonFire;
exports.loaded = loaded;
exports.playPickup = playPickup;
exports.playImpact = playImpact;

})(this.SFX = {});
