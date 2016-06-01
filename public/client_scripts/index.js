function webglSupport() { 
   try {
    var canvas = document.createElement( 'canvas' ); 
    return !! window.WebGLRenderingContext && canvas.getContext('webgl');
   } catch(e) { 
   	return false; 
   } 
 };

function mobileBrowser() { 
 return navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i);
}

// For old browsers or for mobile phone browsers,
//replace the boat animation with just the title.
if (!webglSupport() || mobileBrowser()) {
    document.getElementById("scene").style.display = "none";
    document.getElementById("titleCorsair").style.fontFamily = "Josefin Sans";
    document.getElementById("titleCorsair").innerHTML = "CORSAIR";
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
