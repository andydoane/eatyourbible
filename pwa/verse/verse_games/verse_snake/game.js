(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  let selectedMode = null;
  let completed = false;

  const state = {
    rafId: 0,
    running: false,
    turnDir: 0,
    flashUntil: 0,
    happyUntil: 0,
    snakeStyle: "default",
    fieldRect: null,
    head: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 120
    },
    trail: [],
    snakeLengthPx: 520
  };

  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function resetSnakeMotion(){
    state.turnDir = 0;
    state.flashUntil = 0;
    state.happyUntil = 0;
    state.snakeStyle = "default";
    state.head.angle = -Math.PI / 2;
    state.head.speed = getModeSpeed(selectedMode);
    state.trail = [];
  }

  function getModeSpeed(mode){
    if (mode === "medium") return 138;
    if (mode === "hard") return 154;
    return 122;
  }

  function getBuiltVerseText(){
    return "Eat the first word to begin.";
  }

  function renderModeSelect(){
    stopLoop();

    app.innerHTML = `
      <div class="vm-stack">
        <div class="vm-pill vs-ref">${ctx.verseRef || launch.ref || "Verse"}</div>
        <div class="vm-title">🐍 Verse Snake</div>
        <div class="vm-subtitle">Choose your difficulty.</div>

        <div class="vm-card">
          <div class="vm-actions">
            <button class="vm-btn" id="easyBtn">Easy</button>
            <button class="vm-btn" id="mediumBtn">Medium</button>
            <button class="vm-btn" id="hardBtn">Hard</button>
          </div>
        </div>

        <div class="vm-nav">
          <button class="vm-btn vm-btn-dark" id="backBtn">Back to Games</button>
        </div>
      </div>
    `;

    document.getElementById("easyBtn").onclick = () => {
      selectedMode = "easy";
      renderGameScreen();
    };

    document.getElementById("mediumBtn").onclick = () => {
      selectedMode = "medium";
      renderGameScreen();
    };

    document.getElementById("hardBtn").onclick = () => {
      selectedMode = "hard";
      renderGameScreen();
    };

    document.getElementById("backBtn").onclick = () => {
      window.VerseGameBridge.exitGame();
    };
  }

  function renderGameScreen(){
    stopLoop();
    resetSnakeMotion();

    app.innerHTML = `
      <div class="vs-game-shell">
        <div class="vs-topbar">
          <div class="vm-pill">${selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode"}</div>
        </div>

        <div class="vs-build-wrap">
          <div class="vs-build" id="vsBuild">
            <div class="vs-build-text" id="vsBuildText">${getBuiltVerseText()}</div>
          </div>
        </div>

        <div class="vs-field-wrap">
          <div class="vs-field" id="vsField">
            <div class="vs-status">Movement prototype</div>
            <svg class="vs-svg" id="vsSvg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
              <path class="vs-snake-body" id="vsSnakeBody" d=""></path>
              <g id="vsSnakeHeadGroup">
                <circle class="vs-snake-head" id="vsSnakeHead" cx="0" cy="0" r="20"></circle>
                <circle class="vs-snake-eye" id="vsSnakeEyeLeft" cx="-7" cy="-4" r="2.8"></circle>
                <circle class="vs-snake-eye" id="vsSnakeEyeRight" cx="7" cy="-4" r="2.8"></circle>
                <path class="vs-snake-tongue" id="vsSnakeTongue" d=""></path>
              </g>
            </svg>
          </div>

          <div class="vs-controls">
            <button class="vs-turn-btn no-zoom" id="turnLeftBtn" aria-label="Turn left">
              ${typeof SVG_BACK !== "undefined" ? SVG_BACK : "←"}
            </button>
            <button class="vs-turn-btn no-zoom" id="turnRightBtn" aria-label="Turn right">
              ${typeof SVG_FORWARD !== "undefined" ? SVG_FORWARD : "→"}
            </button>
          </div>

          <div class="vs-bottom-nav">
            <button class="vm-btn vm-btn-dark" id="backBtn">Practice Games</button>
          </div>
        </div>
      </div>
    `;

    wireGameControls();
    startLoop();
  }

  function wireGameControls(){
    const leftBtn = document.getElementById("turnLeftBtn");
    const rightBtn = document.getElementById("turnRightBtn");
    const backBtn = document.getElementById("backBtn");

    const turnLeftStart = () => { state.turnDir = -1; };
    const turnRightStart = () => { state.turnDir = 1; };
    const turnStop = () => { state.turnDir = 0; };

    leftBtn.addEventListener("pointerdown", turnLeftStart);
    rightBtn.addEventListener("pointerdown", turnRightStart);

    leftBtn.addEventListener("pointerup", turnStop);
    rightBtn.addEventListener("pointerup", turnStop);
    leftBtn.addEventListener("pointercancel", turnStop);
    rightBtn.addEventListener("pointercancel", turnStop);
    leftBtn.addEventListener("pointerleave", turnStop);
    rightBtn.addEventListener("pointerleave", turnStop);

    backBtn.onclick = () => {
      stopLoop();
      window.VerseGameBridge.exitGame();
    };

    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.turnDir = -1;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        state.turnDir = 1;
      }
    };

    window.onkeyup = (e) => {
      if (e.key === "ArrowLeft" && state.turnDir === -1) state.turnDir = 0;
      if (e.key === "ArrowRight" && state.turnDir === 1) state.turnDir = 0;
    };
  }

  function startLoop(){
    const field = document.getElementById("vsField");
    if (!field) return;

    const rect = field.getBoundingClientRect();
    state.fieldRect = rect;

    state.head.x = rect.width * 0.50;
    state.head.y = rect.height * 0.55;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getModeSpeed(selectedMode);

    state.trail = [];
    seedTrail();

    state.running = true;

    let lastTs = performance.now();

    function tick(ts){
      if (!state.running) return;

      const dt = Math.min(34, ts - lastTs);
      lastTs = ts;

      updateMotion(dt);
      drawSnake();

      state.rafId = requestAnimationFrame(tick);
    }

    drawSnake();
    state.rafId = requestAnimationFrame(tick);
  }

  function seedTrail(){
    state.trail = [];
    const step = 8;
    for (let i = 0; i < state.snakeLengthPx; i += step){
      state.trail.push({
        x: state.head.x,
        y: state.head.y + i
      });
    }
  }

  function updateMotion(dt){
    const field = document.getElementById("vsField");
    if (!field) return;

    const rect = field.getBoundingClientRect();
    state.fieldRect = rect;

    const turnRate = 2.5;
    state.head.angle += state.turnDir * turnRate * (dt / 1000);

    const speed = state.head.speed;
    state.head.x += Math.cos(state.head.angle) * speed * (dt / 1000);
    state.head.y += Math.sin(state.head.angle) * speed * (dt / 1000);

    wrapHead(rect);

    state.trail.unshift({ x: state.head.x, y: state.head.y });

    trimTrail();
  }

  function wrapHead(rect){
    const pad = 24;

    if (state.head.x < -pad) state.head.x = rect.width + pad;
    if (state.head.x > rect.width + pad) state.head.x = -pad;
    if (state.head.y < -pad) state.head.y = rect.height + pad;
    if (state.head.y > rect.height + pad) state.head.y = -pad;
  }

  function trimTrail(){
    let total = 0;
    const trimmed = [];

    for (let i = 0; i < state.trail.length; i++){
      const p = state.trail[i];
      trimmed.push(p);

      if (i > 0){
        const prev = state.trail[i - 1];
        total += Math.hypot(p.x - prev.x, p.y - prev.y);
      }

      if (total >= state.snakeLengthPx){
        break;
      }
    }

    state.trail = trimmed;
  }

  function buildBodyPath(points){
    if (!points.length) return "";

    const simplified = simplifyTrail(points, 10);
    if (!simplified.length) return "";

    let d = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`;
    for (let i = 1; i < simplified.length; i++){
      d += ` L ${simplified[i].x.toFixed(1)} ${simplified[i].y.toFixed(1)}`;
    }
    return d;
  }

  function simplifyTrail(points, minDist){
    if (!points.length) return [];

    const out = [points[0]];
    let last = points[0];

    for (let i = 1; i < points.length; i++){
      const p = points[i];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= minDist){
        out.push(p);
        last = p;
      }
    }

    const tail = points[points.length - 1];
    if (out[out.length - 1] !== tail){
      out.push(tail);
    }

    return out;
  }

  function drawSnake(){
    const body = document.getElementById("vsSnakeBody");
    const head = document.getElementById("vsSnakeHead");
    const leftEye = document.getElementById("vsSnakeEyeLeft");
    const rightEye = document.getElementById("vsSnakeEyeRight");
    const tongue = document.getElementById("vsSnakeTongue");
    const headGroup = document.getElementById("vsSnakeHeadGroup");

    if (!body || !head || !leftEye || !rightEye || !tongue || !headGroup) return;

    const now = performance.now();
    const isWrong = now < state.flashUntil;
    const isHappy = now < state.happyUntil;

    body.setAttribute("d", buildBodyPath(state.trail));
    body.classList.toggle("is-wrong", isWrong);
    body.classList.toggle("is-happy", isHappy);

    head.classList.toggle("is-wrong", isWrong);

    const headColor = getSnakeHeadColor();
    const bodyColor = getSnakeBodyColor();

    head.setAttribute("fill", headColor);
    body.setAttribute("stroke", bodyColor);

    const angleDeg = (state.head.angle * 180 / Math.PI) + 90;
    headGroup.setAttribute(
      "transform",
      `translate(${state.head.x.toFixed(1)} ${state.head.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`
    );

    head.setAttribute("cx", "0");
    head.setAttribute("cy", "0");
    head.setAttribute("r", "20");

    leftEye.setAttribute("cx", "-7");
    leftEye.setAttribute("cy", "-5");
    rightEye.setAttribute("cx", "7");
    rightEye.setAttribute("cy", "-5");

    tongue.setAttribute(
      "d",
      "M 0 -22 L -4 -34 L 0 -31 L 4 -34 Z"
    );
  }

  function getSnakeBodyColor(){
    if (state.snakeStyle === "berry") return "#ff7eb6";
    if (state.snakeStyle === "ocean") return "#74c0fc";
    if (state.snakeStyle === "sun") return "#ffd43b";
    return "#a7cb6f";
  }

  function getSnakeHeadColor(){
    if (state.snakeStyle === "berry") return "#ff7eb6";
    if (state.snakeStyle === "ocean") return "#74c0fc";
    if (state.snakeStyle === "sun") return "#ffd43b";
    return "#a7cb6f";
  }

  function renderDone(autoShowPetUnlock = false){
    stopLoop();

    app.innerHTML = `
      <div class="vm-stack">
        <div class="vm-pill vs-ref">${ctx.verseRef || launch.ref || "Verse"}</div>
        <div class="vm-title">🎉 Great job!</div>
        <div class="vm-subtitle">
          ${
            autoShowPetUnlock
              ? "You unlocked a BibloPet!"
              : `Verse Snake ${selectedMode} was marked complete.`
          }
        </div>

        <div class="vm-actions">
          <button class="vm-btn" id="againBtn">Play Again</button>
          <button class="vm-btn vm-btn-dark" id="backBtn">Practice Games</button>
        </div>
      </div>
    `;

    document.getElementById("againBtn").onclick = () => {
      completed = false;
      renderModeSelect();
    };

    document.getElementById("backBtn").onclick = () => {
      window.VerseGameBridge.exitGame();
    };

    if (autoShowPetUnlock){
      setTimeout(() => {
        window.VerseGameBridge.exitGame();
      }, 450);
    }
  }

  renderModeSelect();
})();
