$(document).ready(function () {
   $('#textField').keydown(function(event) {
      if (event.keyCode == 13) {
        $('#playButton').click();
       }
   });

   Wheel.init('wheel');

   $('#playButton').click(function(event) {
     Wheel.stop();
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

