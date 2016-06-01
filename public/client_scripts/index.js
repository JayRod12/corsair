function webgl_support() { 
   try {
    var canvas = document.createElement( 'canvas' ); 
    return !! window.WebGLRenderingContext && canvas.getContext('webgl');
   } catch(e) { 
   	return false; 
   } 
 };

// For old browsers, replace the boat animation with just the title.
if (!webgl_support()) {
	window.onload = function() {
    	document.getElementById("titleCorsair").innerHTML = "CORSAIR";
	}
}

$(document).ready(function () {
   $('#textField').keydown(function(event) {
      if (event.keyCode == 13) {
        $('#playButton').click();
       }
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
