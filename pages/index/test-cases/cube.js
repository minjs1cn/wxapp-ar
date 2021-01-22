var raycaster, mouse;
var clickObjects=[];
var camera, scene, renderer;
  var mesh;

export function renderModel(canvas, THREE) {
  init();
  animate();
  function init() {
    camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 1, 1000);
    camera.position.z = 400;
    scene = new THREE.Scene();
    var texture = new THREE.TextureLoader().load('http://yun.tuisnake.com/test/zly.jpg');
    var geometry = new THREE.BoxBufferGeometry(100, 100, 100);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio);
    renderer.setSize(canvas.width, canvas.height);

    clickObjects.push(geometry);
  }
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
  }
  function animate() {
    canvas.requestAnimationFrame(animate);
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  
  
  initThreeClickEvent()
  function initThreeClickEvent() {
    //点击射线
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
  }
}

export function onClick(event, callbak) {
  mouse.x = (event.touches[0].x / renderer.domElement._width) * 2 - 1;
  mouse.y = -(event.touches[0].y / renderer.domElement._height) * 2 + 1;
  console.log(renderer.domElement, mouse)
  raycaster.setFromCamera(mouse, camera);

  //总结一下，这里必须装网格，mesh，装入组是没有效果的
  //所以我们将所有的盒子的网格放入对象就可以了
  // 需要被监听的对象要存储在clickObjects中。
  var intersects = raycaster.intersectObjects(scene.children);

  // console.log(intersects)
  if(intersects.length) {
      // 在这里填写点击代码
      console.log("dianji");
      console.log(intersects[0].object)
      callbak()
  }
}