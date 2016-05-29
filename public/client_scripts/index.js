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
	$(function () {
  		if ($.cookie("loaded") != "true") {
      		$('body.home').hide().fadeIn(3000);
      		$.cookie("loaded", "true");
 	 	}
	});
});