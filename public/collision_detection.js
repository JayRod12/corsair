(function (exports){

/*Checks whether any vertex of rectangle_2 lies interior to or on rectangle_1, then calls itself with the rectangles reversed to 
   perform the reverse check*/
/*
  C1______C2
   |      | 
  C4 ----- C3
 */

var epsilon = 0.0001;
/*PRE: rectangle_1, rectangle_2 are objects with 
fields: {x, y, width, height, hypotenuse, angle}*/
function queryRectangleRectangleCollision(rectangle_1, rectangle_2, first) {	
  /*HEURISTIC COLLSIION DETECTION TO SPEED UP THIS CASE*/
  if(first) {
    //only do this on first
   var twice_radial_diff = rectangle_1.hypotenuse + rectangle_2.hypotenuse;
   var radial_diff_sq = 0.25*twice_radial_diff*twice_radial_diff;
   var squared_origin_diff = 
         (rectangle_1.x - rectangle_2.x)*(rectangle_1.x - rectangle_2.x) 
       + (rectangle_1.y - rectangle_2.y)*(rectangle_1.y - rectangle_2.y);
   if (squared_origin_diff + epsilon >= radial_diff_sq) {
    return false;
    }
  }
	/*ELSE DO PROPER COLLISION DETECTION*/
//Get the non-rotated corner values of rectangle_2
	  var c1_nr = {x: -rectangle_2.width/2, y: rectangle_2.height/2};
	  var c2_nr = {x: rectangle_2.width/2, y: rectangle_2.height/2};
	  var c3_nr = {x: rectangle_2.width/2, y: -rectangle_2.height/2};
	  var c4_nr = {x: -rectangle_2.width/2, y: -rectangle_2.height/2};
	 
    //rotate the points by the angle of the rectangle, 
    //i.e. [x, y] -> [x*cos(t) - y*sin(t), x*sin(t) + y*cos(t)] 
	  var cos_theta = Math.cos(rectangle_2.angle);
	  var sin_theta = Math.sin(rectangle_2.angle);
	
	  var c1_nt = {x: (c1_nr.x*cos_theta) - (c1_nr.y*sin_theta), 
				 y: (c1_nr.x*sin_theta) + (c1_nr.y*cos_theta)};
	  var c2_nt = {x: (c2_nr.x*cos_theta) - (c2_nr.y*sin_theta), 
				 y: (c2_nr.x*sin_theta) + (c2_nr.y*cos_theta)};
  	var c3_nt = {x: (c3_nr.x*cos_theta) - (c3_nr.y*sin_theta), 
				 y: (c3_nr.x*sin_theta) + (c3_nr.y*cos_theta)};
  	var c4_nt = {x: (c4_nr.x*cos_theta) - (c4_nr.y*sin_theta), 
	 			 y: (c4_nr.x*sin_theta) + (c4_nr.y*cos_theta)}; 
	
	  //Get the corner co-ordinates by translating to the origin of rectangle_2
	  var c1 = {x: c1_nt.x + rectangle_2.x, y: c1_nt.y + rectangle_2.y};
	  var c2 = {x: c2_nt.x + rectangle_2.x, y: c2_nt.y + rectangle_2.y}; 
	  var c3 = {x: c3_nt.x + rectangle_2.x, y: c3_nt.y + rectangle_2.y};
	  var c4 = {x: c4_nt.x + rectangle_2.x, y: c4_nt.y + rectangle_2.y};
	
    //A rectangle only collides with another if vertices points are on or in it
    if (queryPointRectangleCollision(c1, rectangle_1)) return true;
    if (queryPointRectangleCollision(c2, rectangle_1)) return true;
    if (queryPointRectangleCollision(c3, rectangle_1)) return true;
    if (queryPointRectangleCollision(c4, rectangle_1)) return true;
    if (first) {return queryRectangleRectangleCollision(rectangle_2, rectangle_1, false);}
    return false;
}


/*PRE: point is an object with: {x, y} rectangle is an object 
with: {x, y, width, height, angle}*/
function queryPointRectangleCollision(point, rectangle) {
	var odv_p = {x: rectangle.x - point.x, y: rectangle.y - point.y};
	var odv_p_square_length = odv_p.x*odv_p.x + odv_p.y*odv_p.y;
	//HEURISTIC CHECK
	if(4*odv_p_square_length + epsilon >= rectangle.hypotenuse*rectangle.hypotenuse) {
  return false;
  }
	var odv_p_theta = trimBranch(Math.atan2(odv_p.y, odv_p.x));
	var odv_p_angle_to_rectangle = trimBranch(odv_p_theta - rectangle.angle);
	var trav = getRectangleTravel(Math.abs(odv_p_angle_to_rectangle), rectangle);
	return trav*trav + epsilon >= odv_p_square_length;
}

/*PRE: circles are objects with: {origin {x y}, radius}*/
function queryCircleCircleCollision(circle_1, circle_2) {
	var odv = {x: circle_1.origin.x - circle_2.origin.x, 
				     y: circle_1.origin.y - circle_2.origin.y};
	var odv_square_length = odv.x*odv.x + odv.y*odv.y;
	return circle_1.radius*circle_1.radius + 2*circle_1.radius*circle_2.radius 
            + circle_2.radius*circle_2.radius >= odv_square_length;
}

/*PRE: circles are objects with: {x, y, radius}*/
function queryPointCircleCollision(p, c) {
	var diff_vect = {x: c.origin.x - p.x, 
				           y: c.origin.y - p.y};

  var dist_2 = diff_vect.x * diff_vect.x + diff_vect.y * diff_vect.y;

  return dist_2 <= c.radius * c.radius + epsilon; 
}

/*PRE: points are objects with: {x, y}*/
function queryPointPointCollision(p1, p2) {
  return (p1 === p2); //  Think this is the right number of equals signs?
	//return queryCircleCircleCollision({origin: p1, radius: 0}, 
									                  //{origin: p2, radius: 0});
}


//returns the travel of the given rectangle in the direction of theta
function getRectangleTravel(theta, rectangle) {
	//This variable is constant for a rectangle of the same size, but rectangles will scale as ship grows
	//i.e. could move this into ship object if rectangles scale width and height equally.
	var rectangle_inner_theta = trimBranch(Math.atan2(rectangle.height, rectangle.width));
	var trav;
	if ((0 <= theta) && (theta <= rectangle_inner_theta)) {
		trav = rectangle.width/(2*Math.cos(theta));
	} else if ((rectangle_inner_theta < theta) && theta <= (Math.PI - rectangle_inner_theta)) {
		trav = rectangle.height/(2*Math.sin(theta));
	} else {
			trav= rectangle.width/(2*Math.cos(Math.PI - theta));
	}
	return trav;
}

/*Ensure angles remain between [-Pi, Pi], important to call this when
    manipulating angles*/
function trimBranch(angle) {
   if (angle > Math.PI) {
	angle -= 2*Math.PI;
  } 
  if (angle < -Math.PI) {
    angle += 2*Math.PI;
  }
  return angle;
}

/*PSEUDO-TESTS*/
/*
console.log(queryPointRectangleCollision({x:0, y:5}, 
            {x:0, y:0, width:10, height:10, angle:0}));
console.log(queryPointPointCollision({x: 24, y: 32}, {x: 24, y: 32}));
console.log(queryPointPointCollision({x: 12, y: 42}, {x: 42, y: 12}));
console.log(queryCircleCircleCollision({origin: {x: 70, y:70}, radius: 24}, {origin: {x:15, y:20}, radius: 25}));
console.log(queryRectangleRectangleCollision({x: 357, y: 548, height: 22, width: 11.5, angle:(Math.PI/27.5)}, {x: 128, y: 275, height: 528, width: 817, angle: Math.PI}));
*/

exports.RectRect = function(o1, o2){return queryRectangleRectangleCollision(o1, o2, true)};
exports.PointRect = queryPointRectangleCollision;
exports.PointPoint = queryPointPointCollision;
exports.PointCircle = queryPointCircleCollision;
exports.CircleCircle = queryCircleCircleCollision;
exports.trimBranch = trimBranch;
}(typeof exports === 'undefined' ? this.Col = {} : exports));
