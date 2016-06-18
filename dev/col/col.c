#include <stdint.h>
#include <stdbool.h>
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include<emscripten.h>

#include <stdlib.h>
/*  Back in C baby */

const float epsilon = 0.0001;

struct rect {
  float x;
  float y;
  float angle;
  float width;
  float height;
  float hypotenuse;
};

struct vector {
  float x;
  float y;
};


uint32_t d_sqr(uint32_t x);
float d_sqr_f (float x);
bool queryRectRect(struct rect *r1, struct rect *r2, bool first);
bool queryPointRect(struct vector *v, struct rect *r);
float getRectangleTravel(float theta, struct rect *r);

uint32_t d_sqr(uint32_t x){
  return x * x;
}

float d_sqr_f (float x){
  return x * x;
}

EMSCRIPTEN_KEEPALIVE
float trimBranch(float x){
  if (x > M_PI) return x - 2*M_PI;
  if (x < -M_PI) return x + 2*M_PI;
  return x;
}

EMSCRIPTEN_KEEPALIVE
bool rectrect(float x1,float y1,float w1,float h1,float a1,float hy1,float
    x2,float y2,float w2,float h2,float a2,float hy2){
  struct rect r1 = {x1, y1, w1, h1, a1, hy1};
  struct rect r2 = {x2, y2, w2, h2, a2, hy2};
  return queryRectRect(&r1, &r2, true);
}

EMSCRIPTEN_KEEPALIVE
bool queryRectRect(struct rect *r1, struct rect *r2, bool first){

  //  Heuristic using circles
  //  Do this with ints to make faster
  if (first){

   uint32_t twice_radial_diff = (uint32_t)ceil(r1->hypotenuse);
   uint32_t radial_diff_sq = (twice_radial_diff*twice_radial_diff) >> 2;

   uint32_t r1_x = (uint32_t)r1->x;
   uint32_t r1_y = (uint32_t)r1->y;
   uint32_t r2_x = (uint32_t)r2->x;
   uint32_t r2_y = (uint32_t)r2->y;

   uint32_t squared_origin_diff = d_sqr(r1_x - r2_x) + d_sqr(r1_y - r2_y);
   if (squared_origin_diff > radial_diff_sq) return false;

  }

  //  Proper collision detection
  struct vector c1_nr = {-r2->width/2,r2->height/2};
  struct vector c2_nr = {r2->width/2,r2->height/2};
  struct vector c3_nr = {r2->width/2,-r2->height/2};
  struct vector c4_nr = {-r2->width/2,-r2->height/2};

  float cos_theta = cos(r2->angle);
  float sin_theta = sin(r2->angle);

  struct vector c1_nt = {c1_nr.x * cos_theta - c1_nr.y * sin_theta,
                         c1_nr.x * sin_theta + c1_nr.y * cos_theta};
  struct vector c2_nt = {c2_nr.x * cos_theta - c2_nr.y * sin_theta,
                         c2_nr.x * sin_theta + c2_nr.y * cos_theta};
  struct vector c3_nt = {c3_nr.x * cos_theta - c3_nr.y * sin_theta,
                         c3_nr.x * sin_theta + c3_nr.y * cos_theta};
  struct vector c4_nt = {c4_nr.x * cos_theta - c4_nr.y * sin_theta,
                         c4_nr.x * sin_theta + c4_nr.y * cos_theta};

  struct vector c1 = {c1_nt.x + r2->x, c1_nt.y + r2->y};
  if (queryPointRect(&c1, r1)) return true;

  struct vector c2 = {c2_nt.x + r2->x, c2_nt.y + r2->y};
  if (queryPointRect(&c2, r1)) return true;

  struct vector c3 = {c3_nt.x + r2->x, c3_nt.y + r2->y};
  if (queryPointRect(&c3, r1)) return true;

  struct vector c4 = {c4_nt.x + r2->x, c4_nt.y + r2->y};
  if (queryPointRect(&c4, r1)) return true;

  if (first){
    return queryRectRect(r2, r1, false);
  }
  return false;
}

EMSCRIPTEN_KEEPALIVE
bool queryPointRect(struct vector *p, struct rect *r){
  struct vector odv_p = {r->x - p->x , r->y - p->y};
  float odv_p_square_length = d_sqr_f(odv_p.x) + d_sqr_f(odv_p.y);

  //  Heuristic check
  if (4*odv_p_square_length + epsilon >= d_sqr_f(r->hypotenuse)) return false;

  float odv_p_theta = trimBranch(atan2(odv_p.y, odv_p.x));
  float odv_p_angle_to_rectangle = trimBranch(odv_p_theta - r->angle);

  float trav = getRectangleTravel(abs(odv_p_angle_to_rectangle), r);

  return d_sqr_f(trav) + epsilon >= odv_p_square_length;
}

float getRectangleTravel(float theta, struct rect *r){
  float rectangle_inner_theta = trimBranch(atan2(r->height, r->width));

  if ((0 <= theta) && (theta <= rectangle_inner_theta)) {
    return r->width / (2*cos(theta));
  }
  else if ((rectangle_inner_theta < theta) && theta <= (M_PI -
        rectangle_inner_theta)) {
    return r->height / (2*sin(theta));
  }

  return r->width / (2*cos(M_PI - theta));
}

int main(){
  struct rect r1 = {0, 0, 0, 1, 1, sqrt(2)};
  struct rect r2 = {0.5, 0, 0, 1, 1, sqrt(2)};
  bool b = queryRectRect(&r1, &r2, true);
  printf("AWF %d\n", b);
  return 0;
}
