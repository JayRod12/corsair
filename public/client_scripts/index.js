$(document).ready(function () {
     // Fade in animation
     $("body").hide().fadeIn(3000); 
     $("div div canvas").fadeIn(1000);

     $('#textField').keydown(function(event) {
        if (event.keyCode == 13) {
            this.form.submit();
            return false;
         }
    });

});