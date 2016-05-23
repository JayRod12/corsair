var player = document.getElementById('player');

const height = 1000;
const width = 1000;
const fps = 60;

var b = bonsai.run(player, '../client/game.js', {
  height: height,
  width: width,
  framerate: fps
});

window.onresize = function() {
  player.style.left = (window.innerWidth - 202)/2 - 350 + 'px';
  player.style.top = window.innerHeight/2 - 200 + 'px';
};

window.onresize();
