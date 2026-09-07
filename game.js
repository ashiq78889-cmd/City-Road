import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("gameCanvas");
const startScreen = document.getElementById("startScreen");
const gameOver = document.getElementById("gameOver");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const coinsEl = document.getElementById("coins");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const finalScoreEl = document.getElementById("finalScore");
const finalCoinsEl = document.getElementById("finalCoins");

let scene, camera, renderer;
let player;
let road;
let objects = [];

let running = false;
let score = 0;
let coins = 0;
let speed = 0.35;
let lane = 0;

const lanes = [-3, 0, 3];

const clock = new THREE.Clock();

function createScene() {
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 25, 100);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );

  camera.position.set(0, 5, 10);
  camera.lookAt(0, 1, -10);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2
  );

  scene.add(ambient);

  const sun = new THREE.DirectionalLight(
    0xffffff,
    2
  );

  sun.position.set(10, 20, 10);
  scene.add(sun);

  createRoad();
  createPlayer();
  createCity();

  animate();
}

function createRoad() {
  const roadGeometry = new THREE.BoxGeometry(12, 0.2, 200);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333
  });

  road = new THREE.Mesh(
    roadGeometry,
    roadMaterial
  );

  road.position.set(0, -0.1, -70);

  scene.add(road);

  for (let z = 10; z > -150; z -= 8) {
    for (const x of [-1.5, 1.5]) {
      const lineGeometry = new THREE.BoxGeometry(
        0.15,
        0.03,
        4
      );

      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff
      });

      const line = new THREE.Mesh(
        lineGeometry,
        lineMaterial
      );

      line.position.set(x, 0.02, z);

      scene.add(line);
      objects.push({
        mesh: line,
        type: "roadLine"
      });
    }
  }
}

function createPlayer() {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.8, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0x2196f3
    })
  );

  body.position.set(0, 1, 5);

  scene.add(body);

  player = body;
}

function createCity() {
  for (let z = 0; z > -150; z -= 12) {
    createBuilding(-9, z);
    createBuilding(9, z);
  }
}

function createBuilding(x, z) {
  const height = 3 + Math.random() * 8;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(
      4,
      height,
      5
    ),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(
        Math.random(),
        0.35,
        0.45
      )
    })
  );

  building.position.set(
    x,
    height / 2,
    z
  );

  scene.add(building);
}

function createObstacle() {
  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.4, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xe53935
    })
  );

  obstacle.position.set(
    lanes[Math.floor(Math.random() * 3)],
    0.7,
    -80
  );

  scene.add(obstacle);

  objects.push({
    mesh: obstacle,
    type: "obstacle"
  });
}

function createCoin() {
  const coin = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.45,
      0.15,
      12,
      24
    ),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2
    })
  );

  coin.position.set(
    lanes[Math.floor(Math.random() * 3)],
    1.2,
    -80
  );

  coin.rotation.x = Math.PI / 2;

  scene.add(coin);

  objects.push({
    mesh: coin,
    type: "coin"
  });
}

function startGame() {
  startScreen.classList.add("hidden");
  gameOver.classList.add("hidden");

  score = 0;
  coins = 0;
  speed = 0.35;
  lane = 0;

  player.position.x = 0;

  objects.forEach(obj => {
    scene.remove(obj.mesh);
  });

  objects = [];

  running = true;

  coinsEl.textContent = coins;
  scoreEl.textContent = score;
  speedEl.textContent = "1";

  clock.start();
}

function endGame() {
  running = false;

  finalScoreEl.textContent = score;
  finalCoinsEl.textContent = coins;

  gameOver.classList.remove("hidden");
}

function moveLeft() {
  if (!running) return;

  lane = Math.max(0, lane - 1);

  player.position.x = lanes[lane];
}

function moveRight() {
  if (!running) return;

  lane = Math.min(2, lane + 1);

  player.position.x = lanes[lane];
}

let startX = 0;

window.addEventListener("touchstart", event => {
  startX = event.touches[0].clientX;
});

window.addEventListener("touchend", event => {
  const endX = event.changedTouches[0].clientX;
  const difference = endX - startX;

  if (Math.abs(difference) < 40) return;

  if (difference < 0) {
    moveLeft();
  } else {
    moveRight();
  }
});

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") moveLeft();
  if (event.key === "ArrowRight") moveRight();
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (running) {
    score += delta * 10;

    scoreEl.textContent = Math.floor(score);

    speed += delta * 0.005;

    speedEl.textContent =
      (speed / 0.35).toFixed(1);

    if (Math.random() < 0.025) {
      createObstacle();
    }

    if (Math.random() < 0.035) {
      createCoin();
    }

    objects.forEach(obj => {
      obj.mesh.position.z += speed;

      if (obj.type === "coin") {
        obj.mesh.rotation.z += 0.08;
      }

      const distance = obj.mesh.position.distanceTo(
        player.position
      );

      if (obj.type === "coin" && distance < 1.5) {
        coins++;

        coinsEl.textContent = coins;

        scene.remove(obj.mesh);
        obj.mesh.position.z = 999;
      }

      if (obj.type === "obstacle" && distance < 1.5) {
        endGame();
      }
    });

    objects = objects.filter(
      obj => obj.mesh.position.z < 15
    );
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

createScene();
