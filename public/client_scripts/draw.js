
///////////////// DRAW METHODS ////////////////////////////

//  Viewport maps world area to canvas for printing
function Viewport(sim, x, y, baseWidth, baseHeight, scale){

  this.sim = sim;
  this.x = x;
  this.y = y;
  this.baseHeight = baseHeight / baseWidth;
  this.baseWidth = 1;
  this.scale = scale;

  this.getWidth = function(){
    return this.baseWidth * scale;
  }

  this.getHeight = function(){
    return this.baseWidth * scale;
  }

  this.draw = function(ctx, canvaswidth, canvasheight){
    // Scale
    ctx.scale(scale, scale);
    ctx.translate(-this.x, -this.y);

    sim.draw(ctx);

    // Inverse scale
    ctx.translate(this.x, this.y); 
    ctx.scale(1/scale, 1/scale);

  }
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


var treasureX = 300;
var treasureY = 300;

function drawTreasure() {
    ctx.beginPath();
    ctx.arc(treasureX, treasureY, 10, 2 * Math.PI, false);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
}

var colors = drawRandomColors();

function drawHighScoresTable(scoreTable) {
  var maxLengthName = 14;
  var maxDisplay = 10;
  //var currentPlayers = 0;
  var currentPlayers = Object.keys(scoreTable).length;

  //for (var player in scoreTable) {currentPlayers++;}
  var i = 0;

//  var displayNumber = currentPlayers < maxDisplay ? currentPlayers : maxDisplay;

  var displayNumber = Math.min(maxDisplay, currentPlayers);

  for (var uid in scoreTable) {
    if (i < displayNumber) {
      var shipName = sim.getShip(uid).name;
      i++;
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
    } else {
      break;
    }
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "50px Josefin Sans";
  ctx.fillText(localHighScoreTable[player.uid], (1/15)*canvas.width, (9.5/10)*canvas.height);
}


function drawCompass() {
  drawCompassScaled(player.state.x, player.state.y, nearest_treasure.x, nearest_treasure.y, 50);
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

  if (sim.treasures.length > 0) {
    nearest_treasure = { x : sim.treasures[0].x, y : sim.treasures[0].y };
  } else {
    nearest_treasure = { x : 0, y : 0 };
  }
}
