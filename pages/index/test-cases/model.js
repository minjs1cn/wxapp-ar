import { registerGLTFLoader } from '../loaders/gltf-loader'
import registerOrbit from "./orbit"
var raycaster, mouse;
var clickObjects=[];

var container, stats, clock, gui, mixer, actions, activeAction, previousAction;
var camera, scene, renderer, model, face, controls;
var api = { state: 'Walking' };
var hongbao

export function renderModel(canvas, THREE) {
  registerGLTFLoader(THREE)

  init();
  animate();
  function init() {
    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(5, 3, 10);
    camera.lookAt(new THREE.Vector3(0, 2, 0));
    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xe0e0e0);
    // scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);
    clock = new THREE.Clock();
    // lights
    var light = new THREE.HemisphereLight(0xff0000, 0xe00000, 0.5);
    light.position.set(0, 20, 0);
    scene.add(light);
    var light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 20, 10);
    scene.add(light2);

    // var light3 = new THREE.PointLight(0xff0000, 1, 1);
    // light3.position.set(0, 0, 0);
    // scene.add(light3);

    // ground
    // var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    // mesh.rotation.x = - Math.PI / 2;
    // scene.add(mesh);
    // var grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    // grid.material.opacity = 0.2;
    // grid.material.transparent = true;
    // scene.add(grid);
    // model
    var loader = new THREE.GLTFLoader();
    loader.load('https://yun.tuisnake.com/test/RobotExpressive.glb', function (gltf) {
      console.log(gltf)
      model = gltf.scene;
      scene.add(model);
      createGUI(model, gltf.animations)
      clickObjects.push(model)
    }, undefined, function (e) {
      console.error(e);
    });
    loader.load('https://yun.tuisnake.com/test/82fb5355-1b32-4219-a78a-9d967b996bea.glb', function (obj) {
      hongbao = obj.scene
      scene.add(hongbao);
      hongbao.scale.set(0.02, 0.02, 0.02)
      hongbao.position.y = -3
      hongbao.rotation.x = -0.2
      console.log(obj)
      // createGUI(model, gltf.animations)
      // clickObjects.push(model)
    }, undefined, function (e) {
      console.error(e);
    });
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio);
    renderer.setSize(canvas.width, canvas.height);
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;

    const { OrbitControls } = registerOrbit(THREE)
    controls = new OrbitControls( camera, renderer.domElement );

    camera.position.set( 0, 5, 10 );
    controls.update();
  }

  function createGUI(model, animations) {
    var states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
    var emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];
    mixer = new THREE.AnimationMixer(model);
    mixer._root.position.y = -1
    actions = {};
    for (var i = 0; i < animations.length; i++) {
      var clip = animations[i];
      var action = mixer.clipAction(clip);
      actions[clip.name] = action;
      if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }

    // expressions
    face = model.getObjectByName('Head_2');
    activeAction = actions['Walking'];
    activeAction.play();
  }

  function fadeToAction(name, duration) {
    previousAction = activeAction;
    activeAction = actions[name];
    if (previousAction !== activeAction) {
      previousAction.fadeOut(duration);
    }
    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
  }
  function animate() {
    var dt = clock.getDelta();
    if (mixer) {
      mixer.update(dt);
    }
    canvas.requestAnimationFrame(animate);
    controls.update()
    if (hongbao) {
      hongbao.rotation.y += 0.05
    }
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
  if (!event || !event.touches.length) return
  mouse.x = (event.touches[0].x / renderer.domElement._width) * 2 - 1;
  mouse.y = -(event.touches[0].y / renderer.domElement._height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);

  //总结一下，这里必须装网格，mesh，装入组是没有效果的
  //所以我们将所有的盒子的网格放入对象就可以了
  // 需要被监听的对象要存储在clickObjects中。
  var intersects = raycaster.intersectObjects(clickObjects);

  console.log(mouse)
  if (mouse.x < 0.109 && mouse.x > 0.109 * -1 && mouse.y < 0.365 * -1 && mouse.y > 0.662 * -1) {
    console.log('click')
    callbak()
  }
  if(intersects.length) {
      // 在这里填写点击代码
      console.log("dianji");
      console.log(intersects[0].object)
      callbak()
  }
}