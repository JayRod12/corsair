(function (exports){


var tutorial_font = "32px Josefin Sans"; 
var tutorial_font_color = "white";

var tutorial_time_init = 3000;
var tutorial_time = tutorial_time_init;
var alpha_fallrate = 1/3000;

//  A lovely purple and an even lovelier orange
var broadside_colors = ['#C390D4', '#D4A190']

var broadside_anglerange = Math.PI / 3;
var broadside_arclength = 300;

function TutorialGame(ship){
  tutorial_time = tutorial_time_init;
  this.ship = ship;
  this.cell = this.ship.cell;
  //this.remaining_time = tutorial_time;
  this.alpha_start = 0.6;
  this.alpha = this.alpha_start;
  this.onTick = function(dt){
    this.cell = this.ship.cell;
    //if (this.remaining_time <= 0) {
    if (tutorial_time < 0) {
      this.alpha -= dt*alpha_fallrate;
      if (this.alpha < 0){
        this.cell.removeObject(this);
        tutgame = null
      }
    }
    //else this.remaining_time -= dt;
    else tutorial_time -= dt;
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

  this.blackbox_height = canvas.height * 0.2;

  this.onDraw = function(ctx){
    if (this.blackbox_height > 0){
      if (tutorial_time > 0){
      }
      else{
        this.blackbox_height -= 5;
      }

      ctx.fillStyle = "black";
      ctx.fillRect(0,0, canvas.width, this.blackbox_height);
      ctx.fillRect(0,canvas.height - this.blackbox_height, canvas.width,
          canvas.height);
    }
  }
}


exports.TutorialGame = TutorialGame;
exports.TutorialOverlay = TutorialOverlay;


})(this.Tutorial = {});
