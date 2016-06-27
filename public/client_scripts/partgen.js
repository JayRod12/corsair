/*  Daniel Slocombe Copyrighted Particle Maker Maker(tm)!!*/
//  Object holding functions to create functions to create objects!
NewPart = function(){
var base_tick, base_draw;

base_tick = function(dt){
  this.width = Math.max(0, this.width + (split_growrate? this.width_growrate :
        this.grow_rate * dt));
  this.height = Math.max(0, this.height + (split_growrate? this.height_growrate :
        this.grow_rate * dt));
  this.alpha -= this.fade_rate * dt;
  if (this.alpha <= 0) this.cell.removeObject(this);
};

base_draw = function(ctx){
  ctx.globalAlpha = this.alpha;
  ctx.translate(this.x, this.y);
  ctx.rotate(this.angle);
  this.draw(ctx);
  ctx.rotate(-this.angle);
  ctx.translate(-this.x, -this.y);
  ctx.globalAlpha = 1;
};

  var split_growrate = false;
  var growrate, fix_growrate = false;
  var width_growrate,  fix_width_growrate = false;
  var height_growrate, fix_height_growrate = false;

  var faderate, fix_faderate = false;
  var gen_color, fix_color = false;
  var gen_alpha, fix_alpha = false;
  var gen_width, fix_width = false;
  var gen_height, fix_height = false;

return {

  split_growrate : function(){
    split_growrate = true;
    return this;
  },

  fix_growrate : function(x){
    growrate = x;
    fix_growrate = true;
    return this;
  },
                 
  fix_width_growrate : function(x){
    width_growrate = x;
    fix_width_growrate = true;
    return this;
  },

  fix_height_growrate : function(x){
    height_growrate = x;
    fix_height_growrate = true;
    return this;
  },

  fix_faderate : function(f){
    faderate = f;
    fix_faderate = true;
    return this;
  },

  fix_color : function(c){
    gen_color = function(){return c};
    fix_color = true;
    return this;
  },

  fix_color_func : function(x){
    gen_color = x;
    fix_color = true;
    return this;
  },

  fix_alpha : function(a){
    gen_alpha = function(){return a};
    fix_alpha = true;
    return this;
  },

  fix_alpha_func : function(x){
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
    this.draw = function(ctx){
      ctx.fillStyle = this.color; 
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    };
    return this;
  },

  rectangle_outline : function(){
    this.draw = function(ctx){
      ctx.strokeStyle = this.color; 
      ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
    };
    return this;
  },


  make : function(){
    var _draw = this.draw;
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

      if (!split_growrate){
        this.grow_rate = (fix_growrate) ? growrate : arguments[c++];
      }
      else{
        this.width_growrate = (fix_width_growrate) ? width_growrate :
          arguments[c++];
        this.height_growrate = (fix_height_growrate) ? height_growrate :
          arguments[c++];
      }

      this.fade_rate = (fix_faderate) ? faderate : arguments[c++];

      this.cell = this.sim.coordinateToCell(this.x, this.y);

      this.onTick = base_tick;
      this.onDraw = base_draw;
      this.draw = _draw;
    };
  }
}
};

//  Example usage
//  var P = NewPart.rectangle().fix_growrate(0.5).make();
//  var particle = new P(sim, x, y, ... );
