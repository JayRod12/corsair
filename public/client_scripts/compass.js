function drawCompassScaled(shipX, shipY, treasureX, treasureY, innerRadius) {

	var posX = canvas.width/2 + window.innerWidth/2.5;
	var posY = canvas.height/2 + window.innerHeight/2.8;

    var normalize = Math.hypot(treasureX - shipX, treasureY - shipY);
    var Cx = (treasureX - shipX)* innerRadius/normalize + posX;
    var Cy = (treasureY - shipY)* innerRadius/normalize + posY;
    var Ax = -innerRadius * Math.tan(Math.PI/20) * Math.cos(Math.PI/2 - Math.atan((treasureY-shipY)/(treasureX-shipX))) + posX;
    var Ay = innerRadius * Math.tan(Math.PI/20) * Math.cos(Math.atan((treasureY-shipY)/(treasureX-shipX))) + posY;
    var Bx = -Ax + 2 * posX;
    var By = -Ay + 2 * posY;
    var Dx = 2 * posX - Cx;
    var Dy = 2 * posY - Cy;

	// Red Triangle pointing to the Treasure
	ctx.beginPath();
    ctx.moveTo(Ax, Ay); 
	ctx.lineTo(Cx, Cy); // Draw A to C
	ctx.lineTo(Bx, By); // Draw C to B
	ctx.lineTo(Ax, Ay); // Draw B to A
	ctx.fillStyle = "red";
	ctx.fill();
	ctx.closePath();

	// Black Triangle pointing opposite to the Treasure
	ctx.beginPath();
    ctx.moveTo(Ax, Ay);
	ctx.lineTo(Dx, Dy); // Draw A to D
	ctx.lineTo(Bx, By); // Draw D to B
	ctx.lineTo(Ax, Ay); // Draw B to A
	ctx.fillStyle = "black";
	ctx.fill();
	ctx.closePath();

	// DESIGN

	// Cardinal direction
	ctx.beginPath();
	ctx.font = "15px Times";
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	ctx.textAlign="center"; 
	ctx.strokeText("N", posX, posY - innerRadius - 25);
	ctx.strokeText("S", posX, posY + innerRadius + 35);
	ctx.strokeText("W", posX - innerRadius - 35, posY);	
	ctx.strokeText("E", posX + innerRadius + 35, posY);
	ctx.stroke();
	ctx.closePath();

	// Middle Circle
	ctx.beginPath();
	ctx.arc(posX, posY, innerRadius + 10, 0, 2*Math.PI);
	ctx.lineWidth = 3;
	ctx.strokeStyle = 'black';
	ctx.stroke();
	ctx.closePath();

	// Outer Circle
	ctx.beginPath();
	ctx.arc(posX, posY, innerRadius, 0, 2*Math.PI);
	ctx.strokeStyle = 'black';
	ctx.stroke();
	ctx.closePath();

	// Little Circle
	ctx.beginPath();
	ctx.arc(posX, posY, innerRadius / 15, 0, 2*Math.PI);
	ctx.fillStyle = '#ccac00';
	ctx.fill();
	ctx.closePath();

	// Most Inner Circle
	ctx.beginPath();
	ctx.arc(posX, posY, innerRadius / 20, 0, 2*Math.PI);
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'white';
	ctx.stroke();
	ctx.closePath();

	// Rectangle (distance to Treasure)
	ctx.beginPath();
	ctx.rect(posX - 75, posY + 250, 150, 50);
	ctx.strokeStyle = '#000080';
	ctx.stroke();
	ctx.fillStyle = 'black';
	ctx.textAlign="pos"; 
	ctx.font = "40px Josefin Sans";
	ctx.fillText(normalize.toFixed(0), posX, posY + 290);
	ctx.closePath();
}