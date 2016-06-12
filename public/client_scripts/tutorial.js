(function (exports){


var tutorial_font = "32px Josefin Sans"; 
var tutorial_font_color = "white";

var tutorial_time = 3000;
var alpha_fallrate = 1/8000;

//  A lovely purple and an even lovelier orange
var broadside_colors = ['#C390D4', '#D4A190']

var broadside_anglerange = Math.PI / 3;
var broadside_arclength = 300;

function TutorialGame(ship){
  this.ship = ship;
  this.cell = this.ship.cell;
  this.remaining_time = tutorial_time;
  this.alpha = 0.6;
  this.onTick = function(dt){
    this.cell = this.ship.cell;
    if (this.remaining_time <= 0) {
      this.alpha -= dt*alpha_fallrate;
      if (this.alpha <= 0) this.cell.removeObject(this);
    }
    else this.remaining_time -= dt;
  }
  this.onDraw = function(ctx){
    ctx.globalAlpha = this.alpha;

    this.drawOneSide(-1, broadside_colors[0], 'left click', ctx);
    this.drawOneSide(1, broadside_colors[1], 'right click', ctx);

    ctx.globalAlpha = 1;
  }
  this.drawOneSide = function(side, color, text, ctx){
    ctx.beginPath();

    var base_angle = this.ship.state.angle + side*Math.PI/2;

    ctx.moveTo(this.ship.state.x, this.ship.state.y);
    var angle = base_angle + broadside_anglerange;
    ctx.lineTo(this.ship.state.x + broadside_arclength *
        Math.cos(angle), this.ship.state.y + broadside_arclength *
        Math.sin(angle));

    ctx.moveTo(this.ship.state.x, this.ship.state.y);
    var angle = base_angle - broadside_anglerange;
    ctx.lineTo(this.ship.state.x + broadside_arclength *
        Math.cos(angle), this.ship.state.y + broadside_arclength *
        Math.sin(angle));
        
    ctx.arc(this.ship.state.x, this.ship.state.y, broadside_arclength,
      this.ship.state.angle + side* Math.PI / 2 -
      broadside_anglerange, this.ship.state.angle + side *Math.PI / 2 + broadside_anglerange);
    ctx.fillStyle = color;
    ctx.fill();

    var x, y;

    x = this.ship.state.x + broadside_arclength/2 * Math.cos(base_angle);
    y = this.ship.state.y + broadside_arclength/2 * Math.sin(base_angle);

    ctx.fillStyle = tutorial_font_color;
    ctx.font = tutorial_font;
    ctx.textAlign="left"; 
    var metrics = ctx.measureText(text);

    ctx.fillText(text, x - metrics.width/2, y - 10);

  }
}


function TutorialOverlay(){
  this.onDraw = function(ctx){
  }
}


exports.TutorialGame = TutorialGame;
exports.TutorialOverlay = TutorialOverlay;


})(this.Tutorial = {});
