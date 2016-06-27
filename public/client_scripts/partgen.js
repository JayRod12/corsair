/*  Daniel Slocombe Copyrighted Particle Maker Maker(tm)!!*/
//  Object holding functions to create functions to create objects!

NewPart = (function(){
var base_tick, base_draw;
var draw;

base_tick = function(dt){
  this.size += this.grow_rate * dt;
  this.alpha -= this.fade_rate * dt;
  if (this.alpha <= 0) this.cell.removeObject(this);
};

base_draw = function(ctx){
  ctx.globalAlpha = this.alpha;
  ctx.translate(this.x, this.y);
  ctx.rotate(this.angle);
  draw(ctx);
  ctx.rotate(-this.angle);
  ctx.translate(-this.x, -this.y);
  ctx.globalAlpha = 1;
};
  var growrate, fix_growrate = false;
  var faderate, fix_faderate = false;
  var gen_color, fix_color = false;
  var gen_alpha, fix_alpha = false;
  var gen_width, fix_width = false;
  var gen_height, fix_height = false;

  console.log("AWFAF");
return {



  fix_growrate : function(x){
    growrate = x;
    fix_growrate = true;
    return this;
  },

  fix_faderate : function(x){
    faderate = x;
    fix_faderate = false;
    return this;
  },

  fix_color : function(x){
    gen_color = x;
    fix_color = true;
    return this;
  },

  fix_alpha : function(x){
    gen_alpha = x;
    fix_alpha = true;
    return this;
  },

  fix_width : function(x){
    gen_width = x;
    fix_width = true;
    return this;
  },
  fix_height : function(x){
    gen_height = x;
    fix_height = true;
    return this;
  },

  rectangle : function(){
    draw = function(ctx){
      ctx.fillStyle = this.color; 
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    };
    return this;
  },

  rectangle_outline : function(){
    draw = function(ctx){
      ctx.strokeStyle = this.color; 
      ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
    };
    return this;
  },


  make : function(){
    return function(){
      var c = 0;
      this.sim = arguments[c++];
      this.x = arguments[c++];
      this.y = arguments[c++];
      this.width = (fix_width) ? gen_width() : arguments[c++];
      this.height = (fix_height) ? gen_height() : arguments[c++];
      this.angle = arguments[c++];

      this.color = (fix_color) ? gen_color() : arguments[c++];
      this.alpha = (fix_alpha) ? gen_alpha() : arguments[c++];

      this.grow_rate = (fix_growrate) ? growrate : arguments[c++];
      this.fade_rate = (fix_faderate) ? faderate : arguments[c++];

      this.cell = this.sim.coordinateToCell(this.x, this.y);

      this.tick = base_tick;
      this.onDraw = base_draw;
    };
  }
}
})();

//  Example usage
//  var P = NewPart.rectangle().fix_growrate(0.5).make();
//  var particle = new P(sim, x, y, ... );
