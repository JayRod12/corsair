(function(exports){

var a_ctx; 
window.addEventListener('load', audio_init, false);

var loaded = false;

var cannonDryLoader;
var cannonWetLoader;
var reverbBuffer;

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
}

var cannon_sfx;

//function finishedLoading(){
//}
function finishedLoading(bufferList) {
  loaded = true;
}


var cannonBallVolume = 0.8;

function broadside(cannons, raw_delay, dist){
  var delay = raw_delay * 6;
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

  var sourceDry = a_ctx.createBufferSource();
  var sourceWet = a_ctx.createBufferSource();
  sourceDry.buffer = cannonDryLoader.bufferList[n];
  sourceWet.buffer = cannonWetLoader.bufferList[n];

  var gainDry = a_ctx.createGain();
  var gainWet = a_ctx.createGain();
  gainDry.gain.value = (1-dist_2) * cannonBallVolume;
  gainWet.gain.value = dist_2 * cannonBallVolume;

  var biquadFilter = a_ctx.createBiquadFilter();
  biquadFilter.type = "lowpass";
  biquadFilter.frequency.value = 1000 + (1-dist)*5000;
  biquadFilter.gain.value = 25;


  sourceDry.connect(gainDry);
  sourceWet.connect(gainWet);

  gainDry.connect(biquadFilter);
  gainWet.connect(biquadFilter);

  biquadFilter.connect(a_ctx.destination);

  sourceDry.start(0);
  sourceWet.start(0);
}
exports.broadside = broadside;
exports.playCannonFire = playCannonFire;
exports.loaded = loaded;

})(this.SFX = {});
