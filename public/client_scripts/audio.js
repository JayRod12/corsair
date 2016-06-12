(function(exports){

var a_ctx; 
window.addEventListener('load', audio_init, false);

var loaded = false;

var cannonDryLoader;
var cannonWetLoader;
var reverbBuffer;

var musicLoader;
var music = [{danger: 0.2, filename: '../media/music/hauljoe1.ogg'},
             {danger: 0.8, filename: '../media/music/barbary.ogg'}]

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

  //  Music
  var music_filenames = music.map(function(o){return o.filename});
  console.log(music_filenames);
  musicLoader = new BufferLoader(a_ctx, music_filenames, startMusic);
  musicLoader.load();
}

var cannon_sfx;

//function finishedLoading(){
//}

function finishedLoading(bufferList) {
  loaded = true;
}

var music_volume = 0.2;


//  TODO add min time on song
var fade_rate = 0.0005/60;
var danger = 0;
var mixing = false;
var current_deck = 0;
exports.setDanger = function(d){
  danger = d;
  //  TODO dont mix to current song
  if (!mixing){
    mixing = true;
    var song = Utils.findClosestIndex(music.map(function(x){return x.danger}, danger));
    mix_to = (current_deck == 0) ? 1 : 0;
    deck_sources[mix_to].buffer = musicLoader.bufferList[song];
    //  TODO wait for next beat
    //deck_sources[mix_to].loop = true;
    //deck_sources[mix_to].start(0);
  }
};

exports.getDanger = function(){return danger;};

exports.tick_music = function(dt){
  if (mixing){
    mix_to = (current_deck == 0) ? 1 : 0;
    decks[current_deck].gain.value -= fade_rate*dt;
    decks[mix_to].gain.value += fade_rate*dt;
    if (decks[mix_to].gain.value > music_volume){
      decks[mix_to].gain.value = music_volume;
      decks[current_deck].gain.value = 0;

      current_deck = mix_to;
      mixing = false;
    }
  }
}

var deck1_source, deck2_source;
var deck1, deck2;
var decks;
var deck_sources;
function startMusic(bufferList){
  deck1_source = a_ctx.createBufferSource();
  deck2_source = a_ctx.createBufferSource();
  deck1_source.buffer = musicLoader.bufferList[0];
  deck2_source.buffer = musicLoader.bufferList[1];
  //  TODO dont loop instead find some other song
  deck1_source.loop = true;
  deck2_source.loop = true;

  deck1 = a_ctx.createGain();
  deck2 = a_ctx.createGain();
  deck1.gain.value = music_volume;
  deck2.gain.value = 0;

  deck1_source.connect(deck1);
  deck2_source.connect(deck2);

  deck1.connect(a_ctx.destination);
  deck2.connect(a_ctx.destination);

  deck1_source.start(0);
  deck2_source.start(0);

  decks = [deck1, deck2];
  deck_sources = [deck1_source, deck2_source];
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
  console.log('afw');
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
exports.broadside = broadside;
exports.playCannonFire = playCannonFire;
exports.loaded = loaded;

})(this.SFX = {});
