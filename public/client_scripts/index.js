var wheelCanvas = document.getElementById('wheel');
var contextt = wheelCanvas.getContext('2d');
var wait = 0;
var image = new Image();
image.onload = function() {
  contextt.translate(wheelCanvas.width/2, wheelCanvas.height/2);
  for (var i = 0; i < 10; i++) {
    contextt.clearRect(-wheelCanvas.width/2, -wheelCanvas.height/2, wheelCanvas.width, wheelCanvas.height);
    contextt.drawImage(image, -wheelCanvas.width/2, -wheelCanvas.height/2);
  }
}

image.onerror = function() {
  console.log("Image not loaded.");
}

image.src = "../media/wheel.png";

var last_move_x = 0;
var last_move_y = 0;
var mouse_x = 0;
var mouse_y = 0;

$(document).ready(function () {
   $('#textField').keydown(function(event) {
      if (event.keyCode == 13) {
        $('#playButton').click();
       }
   });

   $("body").mousemove(function(event) {
    if (wait == 0) {
      mouse_x = event.pageX - getOffset(document.getElementById('wheel')).left - wheelCanvas.width/2;
      mouse_y = event.pageY - getOffset(document.getElementById('wheel')).top - wheelCanvas.height/2;
    }


    var offset_x = 0;
    var offset_y = 0;
    var offset   = 100000;

    offset_x = mouse_x > 0 ? offset_x = mouse_x + offset : offset_x = mouse_x - offset;
    offset_y = mouse_y > 0 ? offset_y = mouse_y + offset : offset_y = mouse_y - offset;

    contextt.clearRect(-wheelCanvas.width/2, -wheelCanvas.height/2, wheelCanvas.width, wheelCanvas.height);

    // var leftOrRight = last_move_y/last_move_x > event.pageY/event.pageX ? 1 : - 1;

    if (mouse_x < 0) {
      contextt.rotate(Math.atan2(offset_x, offset_y).toFixed(0));
    } else {
      contextt.rotate(-Math.atan2(offset_x, offset_y).toFixed(0));
    }

    contextt.drawImage(image, -wheelCanvas.width/2, -wheelCanvas.height/2);

    if (wait == 0) {
      last_move_x = event.pageX;
      last_move_y = event.pageY;
    }

    wait = (wait + 1) % 3; 

    //console.log("leftOrRight is: " + leftOrRight);
    //console.log("lastMove is: " + last_move_x);
    //console.log("current x is: " + mouse_x);

    // console.log("mouse_x: " + mouse_x + ", mouse_y" + mouse_y);
    // console.log("offset_x: " + offset_x + ", offset_y" + offset_y);
    // console.log("angle is: " + Math.atan2(offset_x, offset_y));

   });

   $('#playButton').click(function(event) {
     localStorage['nickname'] = $('#textField').val(); 
     $('#welcomeScreen').hide();
     $('body').css({'margin':'0px',
                    'padding':'0px',
                    'display':'block'});
     $('#game_canvas').fadeIn('slow');
     startClient();
     return false;
   });
});

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
