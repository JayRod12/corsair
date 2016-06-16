
///////////////// DRAW METHODS ////////////////////////////

//  Viewport maps world area to canvas for printing
function Viewport(sim, ship, x, y, baseWidth, baseHeight){

  this.sim = sim;
  this.ship = ship;
  this.x = x;
  this.y = y;
  this.baseHeight = baseHeight / baseWidth;
  this.baseWidth = 1;
  this.scale = 1/this.ship.scale;

  this.shake_dur = 0;
  this.shake_intensity = 0;

  this.getWidth = function(){
    return this.baseWidth * this.scale;
  }

  this.getHeight = function(){
    return this.baseWidth * this.scale;
  }

  this.draw = function(ctx, canvaswidth, canvasheight){

    //  Update x, y, lerp
    var new_x = (4*player.state.x + mouse_x)/5 - canvas.width / (2 * viewport.scale);
    var new_y = (4*player.state.y + mouse_y)/5 - canvas.height / (2 * viewport.scale);

    this.x = (this.x + new_x) / 2;
    this.y = (this.y + new_y) / 2;

    var x, y;
    x = this.x;
    y = this.y


    if (this.shake_dur > 0){
      this.shake_dur -= 1;
      var angle = Math.random() * Math.PI * 2;
      x += Math.cos(angle) * this.shake_intensity;
      y += Math.sin(angle) * this.shake_intensity;
    }

    this.scale = 1 / this.ship.scale;
    ctx.scale(this.scale, this.scale);
    ctx.translate(-x, -y);

    sim.draw(ctx);

    ctx.translate(x, y);
    ctx.scale(1/this.scale, 1/this.scale);
  }

}

const seaHue = 222;
const seaSat = 49;

const landHue = 94;
const landSat = 45;

const beachHue = 63;
const beachSat = 46;

const mountainSat = 7;
const mountainHue = 222;

const seaLevel = 0.64;
const landLevel = 0.68;
const mountainLevel = 0.70;

function makeHSL(h, s, l){
  return "hsl("+h.toString()+", "+s.toString()+"%, "+l.toString()+"%)";
}
function islandColor(height){
  if (height > mountainLevel){
    return makeHSL(mountainHue, mountainSat, height*100);
  }
  else if (height > landLevel){
    return makeHSL(landHue, landSat, height*100);
  }
  else if (height > seaLevel){
    return makeHSL(beachHue, beachSat, height*100);
  }
  else {
    return makeHSL(seaHue, seaSat, height*100);
  }
}
//  TODO get this from somewhere (meta)
var island_size = 32;
function prerenderHeightmap(cell) {
  var canvas = document.createElement('canvas');
  canvas.width = meta.cellWidth;
  canvas.height = meta.cellHeight;
  var render_target = canvas.getContext('2d');
  //jjjjjjrender_target.translate(-cell.x * meta.cellWidth, -cell.y * meta.cellHeight);
  for (var x = 0; x < cell.height_map.length; x++){
    for (var y = 0; y < cell.height_map.length; y++){
      render_target.fillStyle = islandColor(cell.height_map[x][y]);     
      render_target.fillRect(0, 0, island_size, island_size);
      render_target.translate(0, island_size);
    }
    render_target.translate(island_size, - cell.height);
  }
  render_target.translate(-cell.width, 0);
  //debugger;

  //render_target.translate(cell.x * meta.cellWidth, cell.y * meta.cellHeight);
  return canvas;
}

var prerenderClasses = [
  Island.Class,
  Island.Cosmetic
];

function prerenderBackground(cell) {
  var canvas = document.createElement('canvas');
  canvas.width = meta.cellWidth;
  canvas.height = meta.cellHeight;
  var render_target = canvas.getContext('2d');
  render_target.translate(-cell.x * meta.cellWidth, -cell.y * meta.cellHeight);
  for (var i = 0; i < cell.prerenderObjects.length; i++){
    cell.prerenderObjects[i].onDraw(render_target);
  }

  //  Clear objects
  cell.prerenderObjects = [];

  /*
  var go = cell.gameObjects;  
  for (var i = 0; i < go.length; i++){
    for (var j = 0; j < prerenderClasses.length; j++){
      if (go[i] instanceof prerenderClasses[j]){
        go[i].onDraw(render_target);
      }
    }
  }
  */
  render_target.translate(cell.x * meta.cellWidth, cell.y * meta.cellHeight);
  return canvas;
}

function drawRandomColors() {
    var colors = [];
    var letters = '0123456789ABCDEF'.split('');
    for (var j = 0; j < 10; j++) {
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];  
      }
      colors[j] = color;
    }
    return colors;
}

function drawBehindGrid(ctx){
  ctx.fillStyle = backColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

var bg_frames = [];
var bg_frame_count = 16;
var bg_frame_wait = 0;
var bg_frame_wait_time = 15;
for (var i = 0; i < bg_frame_count; i++){
  var bg_frame = new Image();
  bg_frame.src = "../media/bg/"+i+".jpeg";
  bg_frames.push(bg_frame);
}
var bg_frame_num = 0;

function drawCellBackground(cx, cy, ctx){
  /*
  bg_frame_wait++
  if (bg_frame_wait > bg_frame_wait_time){
    bg_frame_num = (bg_frame_num + 1) % bg_frame_count;
    bg_frame_wait = 0;
  }
  ctx.drawImage(bg_frames[bg_frame_num], cx * meta.cellWidth, cy * meta.cellHeight, 
    meta.cellWidth + 2, meta.cellHeight + 2);
    */
  var seaColor = "#0066ff";
  ctx.fillStyle = seaColor;
  ctx.fillRect(cx*meta.cellWidth, cy*meta.cellHeight, meta.cellWidth+2,
      meta.cellHeight+2);
}



var colors = drawRandomColors();

function drawHighScoresTable(scoreTable) {
  var maxLengthName = 14;
  var maxDisplay = 10;
  var currentPlayers = Object.keys(scoreTable).length;
  var i = 0;
  var displayNumber = Math.min(maxDisplay, currentPlayers);
  var sortScores = [];

  for (var uid in scoreTable) {
    sortScores.push(uid);
  }

  sortScores.sort(function(a, b) {
    return scoreTable[b] - scoreTable[a];
  });

  for (var i = 1; i <= displayNumber; i++) {
      var uid = sortScores[i-1];
      if (sim.getShip(uid) == undefined) return;
      var shipName = sim.getShip(uid).name;
      ctx.beginPath();
      ctx.font = "italic 15px Josefin Sans";
      ctx.lineWidth = 2;
      ctx.fillStyle = colors[i - 1];
      ctx.textAlign="left"; 
      ctx.fillText("#" + i, (7/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fillText(shipName, (7.14/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fillText(scoreTable[uid], (7.8/8)*canvas.width, (1/20)*canvas.height + i * 20);
      ctx.fill();
      ctx.closePath();
  }


}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "50px Josefin Sans";
  ctx.fillText(localHighScoreTable[player.uid], (1/15)*canvas.width, (9.5/10)*canvas.height);
}


function drawCompass() {
  if (tutgame !== null && typeof tutgame !== "undefined"){
    if (tutgame.alpha === tutgame.alpha_start){
      ctx.globalAlpha = 0;
    }
    else{
      ctx.globalAlpha = 1-(tutgame.alpha)/tutgame.alpha_start;
    }
  }
  drawCompassScaled(player.state.x, player.state.y, nearest_treasure.x, nearest_treasure.y, 50);
  ctx.globalAlpha = 1;
}

function drawDebug() {
  ctx.fillStyle = "black";
  ctx.font = "15px Josefin Sans";
  ctx.fillText("fps: "+ display_fps, (1/10)*canvas.width, (1/10)*canvas.height);
  ctx.fillText("ping: "+ ping +"ms", (1/10)*canvas.width, (2/10)*canvas.height);
}


function setupCompass() {
  // player is the ship variable in client_game.js
  Utils.insertionSort(sim.treasures, player);

  //console.log(sim.treasures.map(function(t1) {return Math.sqrt((player.state.x - t1.x) * (player.state.x - t1.x) + (player.state.y - t1.y) * (player.state.y - t1.y));}));
  //console.log(sim.treasures.map(
  //    function(t1) {
  //      return Math.sqrt((player.state.x - t1.x) * (player.state.x - t1.x) +
  //                       (player.state.y - t1.y) * (player.state.y - t1.y));}));

  if (sim.treasures.length > 0) {
    nearest_treasure = { x : sim.treasures[0].x, y : sim.treasures[0].y };
  } else {
    nearest_treasure = { x : 0, y : 0 };
  }
}
