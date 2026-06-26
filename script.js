// -----------------------------
// Scene setup
// -----------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// -----------------------------
// Lighting
// -----------------------------
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// -----------------------------
// Player
// -----------------------------
const player = {
  position: new THREE.Vector3(0, 3, 8),
  velocity: new THREE.Vector3(0, 0, 0),
  speed: 7,
  gravity: -20,
  jumpPower: 8,
  height: 1.8,
  onGround: false
};

camera.position.copy(player.position);

let yaw = Math.PI;
let pitch = 0;

// -----------------------------
// Keyboard
// -----------------------------
const keys = {};

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (event.code === "Digit1") setSelectedBlock("grass");
  if (event.code === "Digit2") setSelectedBlock("stone");
  if (event.code === "Digit3") setSelectedBlock("dirt");
  if (event.code === "Digit4") setSelectedBlock("brick");
  if (event.code === "Digit5") setSelectedBlock("blue");
});

document.addEventListener("keyup", function(event) {
  keys[event.code] = false;
});

// -----------------------------
// Mouse look
// -----------------------------
document.body.addEventListener("click", function() {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", function(event) {
  if (document.pointerLockElement !== document.body) return;

  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;

  const limit = Math.PI / 2 - 0.1;
  pitch = Math.max(-limit, Math.min(limit, pitch));
});

// Stop right-click menu
document.addEventListener("contextmenu", function(event) {
  event.preventDefault();
});

// -----------------------------
// Blocks
// -----------------------------
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

const materials = {
  grass: new THREE.MeshLambertMaterial({ color: 0x22aa22 }),
  stone: new THREE.MeshLambertMaterial({ color: 0x888888 }),
  dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
  brick: new THREE.MeshLambertMaterial({ color: 0xff8800 }),
  blue: new THREE.MeshLambertMaterial({ color: 0x0099ff })
};

const blockNames = {
  grass: "Grass",
  stone: "Stone",
  dirt: "Dirt",
  brick: "Brick",
  blue: "Blue Block"
};

let selectedBlock = "grass";

const blocks = [];
const blockMap = new Map();

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(x, y, z, type = "grass") {
  const key = blockKey(x, y, z);

  if (blockMap.has(key)) return;

  const block = new THREE.Mesh(blockGeometry, materials[type]);
  block.position.set(x, y, z);
  block.userData.type = type;

  scene.add(block);
  blocks.push(block);
  blockMap.set(key, block);
}

function removeBlock(block) {
  scene.remove(block);

  const x = Math.round(block.position.x);
  const y = Math.round(block.position.y);
  const z = Math.round(block.position.z);

  blockMap.delete(blockKey(x, y, z));

  const index = blocks.indexOf(block);
  if (index !== -1) {
    blocks.splice(index, 1);
  }
}

function setSelectedBlock(type) {
  selectedBlock = type;
  document.getElementById("selected").textContent = blockNames[type];
}

// -----------------------------
// Generate world
// -----------------------------
for (let x = -25; x <= 25; x++) {
  for (let z = -25; z <= 25; z++) {
    addBlock(x, 0, z, "grass");
  }
}

// Small hill
addBlock(4, 1, 4, "stone");
addBlock(4, 2, 4, "stone");
addBlock(5, 1, 4, "stone");
addBlock(4, 1, 5, "stone");
addBlock(5, 2, 5, "stone");

// Tree trunk
addBlock(-5, 1, 3, "dirt");
addBlock(-5, 2, 3, "dirt");
addBlock(-5, 3, 3, "dirt");

// Tree leaves
addBlock(-5, 4, 3, "grass");
addBlock(-4, 4, 3, "grass");
addBlock(-6, 4, 3, "grass");
addBlock(-5, 4, 4, "grass");
addBlock(-5, 4, 2, "grass");
addBlock(-5, 5, 3, "grass");

// Brick wall
for (let y = 1; y <= 3; y++) {
  for (let x = 8; x <= 12; x++) {
    addBlock(x, y, -4, "brick");
  }
}

// -----------------------------
// Break and place blocks
// -----------------------------
const raycaster = new THREE.Raycaster();

document.addEventListener("mousedown", function(event) {
  if (document.pointerLockElement !== document.body) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const hits = raycaster.intersectObjects(blocks);

  if (hits.length === 0) return;

  const hit = hits[0];

  // Left click = break
  if (event.button === 0) {
    removeBlock(hit.object);
  }

  // Right click = place
  if (event.button === 2) {
    const normal = hit.face.normal.clone();
    normal.transformDirection(hit.object.matrixWorld);

    const newPosition = hit.object.position.clone().add(normal);

    addBlock(
      Math.round(newPosition.x),
      Math.round(newPosition.y),
      Math.round(newPosition.z),
      selectedBlock
    );
  }
});

// -----------------------------
// Ground / gravity
// -----------------------------
function getGroundHeight(x, z) {
  const gridX = Math.round(x);
  const gridZ = Math.round(z);

  let highest = -100;

  for (let y = -5; y <= 20; y++) {
    if (blockMap.has(blockKey(gridX, y, gridZ))) {
      highest = Math.max(highest, y + 1);
    }
  }

  return highest;
}

// -----------------------------
// Game loop
// -----------------------------
let lastTime = performance.now();

function update() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const forward = new THREE.Vector3(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  );

  const right = new THREE.Vector3(
    Math.cos(yaw),
    0,
    -Math.sin(yaw)
  );

  const move = new THREE.Vector3();

  if (keys["KeyW"]) move.add(forward);
  if (keys["KeyS"]) move.sub(forward);
  if (keys["KeyD"]) move.add(right);
  if (keys["KeyA"]) move.sub(right);

  if (move.length() > 0) {
    move.normalize();
  }

  player.position.add(move.multiplyScalar(player.speed * dt));

  // Jump
  if (keys["Space"] && player.onGround) {
    player.velocity.y = player.jumpPower;
    player.onGround = false;
  }

  // Gravity
  player.velocity.y += player.gravity * dt;
  player.position.y += player.velocity.y * dt;

  const groundHeight = getGroundHeight(
    player.position.x,
    player.position.z
  ) + player.height;

  if (player.position.y <= groundHeight) {
    player.position.y = groundHeight;
    player.velocity.y = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  camera.position.copy(player.position);

  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

update();

// -----------------------------
// Window resize
// -----------------------------
window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
