var camera, scene, renderer, light;
var geometry,
  material,
  material_solid,
  material_phong,
  mesh,
  world_mesh,
  boat,
  boatmesh,
  sail,
  boat_group,
  sail_mesh,
  boat_holder;

var w = false;
var a = false;
var s = false;
var d = false;

function init() {
  HEIGHT = 884;
  WIDTH = 1880;

  console.log(window.innerHeight);
  console.log(window.innerWidth);

  camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 1, 1000);
  camera.position.z = 600;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMapEnabled = true;
  container = document.getElementById('scene');
  container.appendChild(renderer.domElement);
}

function createLight() {

  var spotLight = new THREE.SpotLight(0x444444);
  spotLight.position.set(500, 1000, 100);
  spotLight.castShadow = true;
  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;
  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;
  scene.add(spotLight);

  var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
  scene.add(light);

  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(1, 1, 1);
  scene.add(dirLight);

}

function createWorld() {

  world = new THREE.IcosahedronGeometry(200, 2);
  boat = new THREE.CylinderGeometry(0, 60, 60, 4, false);
  sail = new THREE.CylinderGeometry(0, 60, 60, 4, false);

  material_flat = new THREE.MeshPhongMaterial({
    color: 0x0066CC,
    shading: THREE.FlatShading,
    shininess: 400,
    specularity: 10,
    specular: 0x050505,
  });
  material_solid = new THREE.MeshBasicMaterial({
    color: 0x70C8E3,
    shading: THREE.SmoothShading,
  });
  material_phong = new THREE.MeshPhongMaterial({
    color: 0xFFFFFf,
    shininess: 0,
    shading: THREE.FlatShading,
  });
  material_wood_flipped = new THREE.MeshPhongMaterial({
    color: 0x996600,
    shading: THREE.FlatShading,
    side: THREE.BackSide
  });
  material_wood = new THREE.MeshPhongMaterial({
    color: 0x996600,
    shading: THREE.FlatShading,
  });

  world_mesh = new THREE.Mesh(world, material_flat);
  world_mesh.castShadow = true;
  world_mesh.receiveShadow = true;
  var boat_mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 60, 60, 4, false), material_wood_flipped);
  boat_mesh.castShadow = true;
  boat_mesh.receiveShadow = true;
  sail_mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 60, 60, 4, false), material_phong);
  sail_mesh.castShadow = true;
  sail_mesh.receiveShadow = true;
  var mast_mesh = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 100, 5, false), material_wood);
  mast_mesh.castShadow = true;
  mast_mesh.receiveShadow = true;
  var horiz_mast_mesh = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 120, 5, false), material_wood);
  horiz_mast_mesh.castShadow = true;
  horiz_mast_mesh.receiveShadow = true;

  world_mesh.geometry.mergeVertices();
  world_mesh.geometry.computeVertexNormals();

  world_mesh.scale.x = 0.9;
  world_mesh.scale.y = 0.9;
  world_mesh.scale.z = 0.9;

  //boat_mesh.position.y = 185;
  boat_mesh.scale.z = 1;
  boat_mesh.scale.y = -0.5;

  sail_mesh.position.y = 75;
  sail_mesh.scale.z = 0.05;
  sail_mesh.scale.y = 1.4;

  mast_mesh.position.y = 65;

  horiz_mast_mesh.position.y = 35;
  horiz_mast_mesh.rotation.x = 2;
  horiz_mast_mesh.rotation.z = 1.6;

  boat_group = new THREE.Object3D();
  boat_holder = new THREE.Object3D();
  boat_group.add(boat_mesh);
  boat_group.add(sail_mesh);
  boat_group.add(mast_mesh);
  boat_group.add(horiz_mast_mesh);
  boat_group.castShadow = true;
  boat_group.receiveShadow = true;
  boat_group.position.y = 185;
  boat_holder.add(boat_group);

  scene.add(world_mesh);
  scene.add(boat_holder);
  scene.add(light);
}

function animation() {
  window.requestAnimationFrame(animation);

  world_mesh.rotation.x = Date.now() * -0.0001;
  world_mesh.rotation.y = Date.now() * -0.0005;
  var val = Math.floor(Math.random() * 6) + 1;
  boat_holder.rotation.y += 0.01;
  boat_holder.rotation.z += 0.005;
  boat_holder.rotation.x += 0.005;
  if (w) {
    //boat_group.rotation.y += 0.005;
    boat_holder.rotation.z -= 0.005;
    //boat_group.rotation.x += 0.005;
  }
  if (a) {
    boat_holder.rotation.y -= 0.005;
  }
  if (s) {
    boat_holder.rotation.z += 0.005;
  }
  if (d) {
    boat_holder.rotation.x += 0.005;
  }

  renderer.render(scene, camera);
}

init();
createLight();
createWorld();
animation();

$(document).on('keydown', function(evt) {
  console.log(evt.keyCode);
  if (evt.keyCode == 87) {
    w = true;
  }
  if (evt.keyCode == 65) {
    a = true;
  }
  if (evt.keyCode == 83) {
    s = true;
  }
  if (evt.keyCode == 68) {
    d = true;
  }
  if (evt.keyCode == 32) {
    console.log("Jump");
    if (boat_group.position.y == 185) {
    TweenMax.to(boat_group.position, 0.5, {
      y: 250,
      ease: Power2.easeOut
    })
    TweenMax.to(boat_group.position, 1, {
      delay: 0.5,
      y: 185,
      ease: Elastic.easeOut
    })
  }

}
});
$(document).on('keyup', function(evt) {
  console.log(evt.keyCode);

  if (evt.keyCode == 87) {
    w = false;
  }
  if (evt.keyCode == 65) {
    a = false;
  }
  if (evt.keyCode == 83) {
    s = false;
  }
  if (evt.keyCode == 68) {
    d = false;
  }
});