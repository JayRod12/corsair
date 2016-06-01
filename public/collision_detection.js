/*Checks whether any vertex of rectangle_2 lies interior to or on rectangle_1, then calls itself with the rectangles reversed to 
   perform the reverse check*/
/*
  C1______C2
   |      | 
  C4 ----- C3
 */
const epsilon = 0.00001;
function collisionDetection(rectangle_1, rectangle_2, first) {	
//calculate where the corners would be if the rectangle was not rotated and the centre of the rectangle was the origin.
	
	//Get the non-rotated corner values of rectangle_2
	var c1_nr = {x: -rectangle_2.width/2, y: rectangle_2.height/2};
	var c2_nr = {x: rectangle_2.width/2, y: rectangle_2.height/2};
	var c3_nr = {x: rectangle_2.width/2, y: -rectangle_2.height/2};
	var c4_nr = {x: -rectangle_2.width/2, y: -rectangle_2.height/2};
	 
  //rotate the points by the angle of the rectangle, i.e. [x, y] -> [x*cos(t) - y*sin(t), x*sin(t) + y*cos(t)] 
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
	
	//Get the origin's difference from each corner
	var odv_c1 = {x: rectangle_1.x - c1.x, y: rectangle_1.y - c1.y};
	var odv_c2 = {x: rectangle_1.x - c2.x, y: rectangle_1.y - c2.y};
	var odv_c3 = {x: rectangle_1.x - c3.x, y: rectangle_1.y - c3.y};
	var odv_c4 = {x: rectangle_1.x - c4.x, y: rectangle_1.y - c4.y};
	
 	var odv_c1_length = odv_c1.x*odv_c1.x + odv_c1.y*odv_c1.y;
	var odv_c2_length = odv_c2.x*odv_c2.x + odv_c2.y*odv_c2.y;
	var odv_c3_length = odv_c3.x*odv_c3.x + odv_c3.y*odv_c3.y;
	var odv_c4_length = odv_c4.x*odv_c4.x + odv_c4.y*odv_c4.y;

 	var odv_c1_theta = trimBranch(Math.atan2(odv_c1.y, odv_c1.x));
	var odv_c2_theta = trimBranch(Math.atan2(odv_c2.y, odv_c2.x));
	var odv_c3_theta = trimBranch(Math.atan2(odv_c3.y, odv_c3.x));
	var odv_c4_theta = trimBranch(Math.atan2(odv_c4.y, odv_c4.x));
	
	var odv_c1_angle_to_rectangle_1 = trimBranch(odv_c1_theta 
													- rectangle_1.angle);
	var odv_c2_angle_to_rectangle_1 = trimBranch(odv_c2_theta 
													- rectangle_1.angle);
	var odv_c3_angle_to_rectangle_1 = trimBranch(odv_c3_theta 
													- rectangle_1.angle);
	var odv_c4_angle_to_rectangle_1 = trimBranch(odv_c4_theta 
													- rectangle_1.angle);
	
	//Cases are symmetric about the x-axis 
	var trav_c1 = getRectangleTravel(Math.abs(odv_c1_angle_to_rectangle_1), 
																rectangle_1);
	var trav_c2 = getRectangleTravel(Math.abs(odv_c2_angle_to_rectangle_1), 
																rectangle_1);
	var trav_c3 = getRectangleTravel(Math.abs(odv_c3_angle_to_rectangle_1), 
																rectangle_1);
	var trav_c4 = getRectangleTravel(Math.abs(odv_c4_angle_to_rectangle_1), 
																rectangle_1);
	
	if (trav_c1*trav_c1 + epsilon >= odv_c1_length) {return true;}
	if (trav_c2*trav_c2 + epsilon >= odv_c2_length) {return true;}
	if (trav_c3*trav_c3 + epsilon >= odv_c3_length) {return true;}
	if (trav_c4*trav_c4 + epsilon >= odv_c4_length) {return true;}
	if (first) {return collisionDetection(rectangle_2, rectangle_1, false);}
	return false;
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

//Ensure angles remain between [-Pi, Pi]
function trimBranch(angle) {
   if (angle > Math.PI) {
	angle -= 2*Math.PI;
  } 
  if (angle < -Math.PI) {
    angle += 2*Math.PI;
  }
  return angle;
}

//  Wrapper for toms retarded fucking names
exports.collisionDetection = function (r1, r2, inefficiencyGiveaway){
  return collisionDetection(
      {x : r1.x, y: r1.y, width: r1.w, height: r1.h, angle: r1.a},
      {x : r2.x, y: r2.y, width: r2.w, height: r2.h, angle: r2.a},
      inefficiencyGiveaway);
}
