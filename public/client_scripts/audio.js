var a_ctx; 
window.addEventListener('load', audio_init, false);

var cannonDryLoader;
var cannonWetLoader;
var reverbBuffer;

function audio_init(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
  }
  catch(e) {
    console.log("Error: Web Audio API is unsupported in this browser");
    return;
  }
  a_ctx = new AudioContext();

  //  Cannon
  var cannon_sfx_count = 7;
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
  console.log('doneloading');
}

var cannon_sfx;

//function finishedLoading(){
//}
function finishedLoading(bufferList) {
  /*
  // Create two sources and play them both together.
  var source1 = context.createBufferSource();
  source1.buffer = bufferList[0];

  source1.connect(context.destination);
  source1.start(0);
  */
  //playCannonFire();
}


function playCannonFire(dist) {
  
  var n = Math.floor(Math.random() * cannonDryLoader.bufferList.length);
  var source = a_ctx.createBufferSource();

  source.buffer = cannonDryLoader.bufferList[n];
  //convoler.buffer = cannonLoader.bufferList[n];

  //source.buffer = reverbBuffer;
  source.connect(a_ctx.destination);

  //source.connect(convoler);
  //convoler.connect(a_ctx.destination);
  source.start(0);
}
