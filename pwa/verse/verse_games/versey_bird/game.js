const bird = document.getElementById("bird");
const gameArea = document.getElementById("gameArea");
const builtArea = document.getElementById("builtArea");
const flash = document.getElementById("flash");

const gravity = 0.5;
const flapPower = -8;

let velocity = 0;
let birdY = 200;

let running = true;

/* ======================
   BRIDGE INIT
====================== */

async function init() {
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  builtArea.textContent = ctx.verseText;

  document.getElementById("exitBtn").onclick = () => {
    window.VerseGameBridge.exitGame();
  };
}

init();

/* ======================
   INPUT
====================== */

function flap() {
  velocity = flapPower;

  bird.style.transform = "rotate(-20deg)";
  setTimeout(() => {
    bird.style.transform = "rotate(20deg)";
  }, 100);
}

window.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  flap();
});

/* ======================
   GAME LOOP
====================== */

function update() {
  if (!running) return;

  velocity += gravity;
  birdY += velocity;

  if (birdY < 0) {
    birdY = 0;
    velocity = 0;
  }

  const groundY = gameArea.clientHeight - 52;

  if (birdY > groundY) {
    birdY = groundY;
    velocity = 0;
  }

  bird.style.top = birdY + "px";

  requestAnimationFrame(update);
}

update();

/* ======================
   SIMPLE CLOUDS
====================== */

function spawnCloud() {
  const cloud = document.createElement("div");
  cloud.textContent = "☁️";

  cloud.style.position = "absolute";
  cloud.style.left = "100%";
  cloud.style.top = Math.random() * 60 + "%";
  cloud.style.fontSize = (20 + Math.random() * 30) + "px";
  cloud.style.opacity = 0.3 + Math.random() * 0.5;

  document.getElementById("cloudLayer").appendChild(cloud);

  let x = window.innerWidth;

  function move() {
    x -= 0.5;
    cloud.style.left = x + "px";

    if (x > -100) {
      requestAnimationFrame(move);
    } else {
      cloud.remove();
    }
  }

  move();
}

setInterval(spawnCloud, 2000);
