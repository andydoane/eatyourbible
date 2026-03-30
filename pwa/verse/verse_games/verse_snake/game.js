(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  let selectedMode = null;
  let completed = false;
  let muted = false;

  const state = {
    rafId: 0,
    running: false,
    turnDir: 0,
    flashUntil: 0,
    happyUntil: 0,
    snakeStyle: "default",
    head: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 120
    },
    trail: [],
    snakeLengthPx: 500,
    fieldWidth: 0,
    fieldHeight: 0
  };

  function getBackSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
          d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
          transform="translate(246.77226)" />
      </svg>
    `;
  }

  function getForwardSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
          d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
          transform="matrix(-1,0,0,1,1023.2277,0)" />
      </svg>
    `;
  }

  function getHomeSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/>
      </svg>
    `;
  }

  function getMuteSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round"
          d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z" />
        <g transform="translate(-26.458334,-255.59263)">
          <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="M 1241.4124,524.69155 890.61025,875.49365" />
          <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 890.61025,524.69155 350.80215,350.8021" />
        </g>
      </svg>
    `;
  }

  function getUnmuteSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <g transform="matrix(2.9017243,0,0,2.9017243,-948.59169,1423.6267)">
          <path style="fill:#ffffff;stroke:none;stroke-width:15.4884;stroke-linecap:round"
            d="m 554.69651,-460.54773 -86.50507,53.22802 a 51.858137,51.858137 0 0 1 -27.17654,7.69139 h -36.35067 a 14.676664,14.676664 0 0 0 -14.67666,14.67666 v 95.04477 a 14.676664,14.676664 0 0 0 14.67666,14.67666 h 36.35067 a 51.858137,51.858137 0 0 1 27.17654,7.69139 l 86.50507,53.22802 a 8.2017227,8.2017227 0 0 0 12.49988,-6.98527 v -232.26637 a 8.2017227,8.2017227 0 0 0 -12.49988,-6.98527 z" />
          <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 596.38634,-270.01659 c 26.00162,-13.81364 42.0863,-39.52797 42.16745,-67.41243 -0.0102,-27.95044 -16.10446,-53.75052 -42.16745,-67.5969" />
          <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 626.65943,-233.57231 c 4.34269,-2.51562 16.69789,-10.99898 23.86366,-17.76894 23.32002,-22.03191 37.74343,-52.46821 37.74343,-86.08777 0,-33.61956 -14.42341,-64.05637 -37.74343,-86.08828 -7.16577,-6.76996 -19.52097,-15.25332 -23.86366,-17.76894" />
        </g>
      </svg>
    `;
  }

  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    window.onkeydown = null;
    window.onkeyup = null;
  }

  function resetSnakeMotion(){
    state.turnDir = 0;
    state.flashUntil = 0;
    state.happyUntil = 0;
    state.snakeStyle = "default";
    state.head.angle = -Math.PI / 2;
    state.head.speed = getModeSpeed(selectedMode);
    state.trail = [];
    state.fieldWidth = 0;
    state.fieldHeight = 0;
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
      <div class="vm-stack" style="padding:18px 16px 22px; min-height:100dvh;">
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
      <div class="vs-root">
        <div class="vs-stage">
          <div class="vs-build-wrap">
            <div class="vs-build" id="vsBuild">
              <div class="vs-build-text" id="vsBuildText">${getBuiltVerseText()}</div>
            </div>
          </div>

          <div class="vs-field-wrap">
            <div class="vs-field" id="vsField">
              <div class="vs-status">${selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode"}</div>

              <svg class="vs-svg" id="vsSvg" aria-hidden="true">
                <path class="vs-snake-body" id="vsSnakeBody" d=""></path>

                <g id="vsSnakeHeadGroup">
                  <circle class="vs-snake-head" id="vsSnakeHead" cx="0" cy="0" r="20"></circle>
                  <circle class="vs-snake-eye" id="vsSnakeEyeLeft" cx="-7" cy="-5" r="2.8"></circle>
                  <circle class="vs-snake-eye" id="vsSnakeEyeRight" cx="7" cy="-5" r="2.8"></circle>
                  <path class="vs-snake-tongue" id="vsSnakeTongue" d=""></path>
                </g>
              </svg>
            </div>

            <div class="vs-controls">
              <button class="vs-turn-btn no-zoom" id="turnLeftBtn" aria-label="Turn left">
                ${getBackSvg()}
              </button>
              <button class="vs-turn-btn no-zoom" id="turnRightBtn" aria-label="Turn right">
                ${getForwardSvg()}
              </button>
            </div>

            <div class="vs-nav">
              <button class="vs-nav-btn no-zoom" id="homeBtn" aria-label="Home">
                ${getHomeSvg()}
              </button>

              <div class="vs-nav-center">
                <button class="vs-help-btn no-zoom" id="helpBtn" type="button">HELP</button>
              </div>

              <button class="vs-nav-btn no-zoom" id="muteBtn" aria-label="Mute">
                ${muted ? getMuteSvg() : getUnmuteSvg()}
              </button>
            </div>
          </div>
        </div>

        <div class="vs-help-overlay" id="vsHelpOverlay" aria-hidden="true">
          <div class="vs-help-dialog">
            <div class="vs-help-title">How to Play Verse Snake</div>
            <div class="vs-help-body">
              Use the left and right arrows to steer the snake.<br><br>
              This is the movement prototype, so word targets are coming next.
            </div>
            <div class="vs-help-actions">
              <button class="vs-help-close no-zoom" id="vsHelpCloseBtn" type="button">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;

    wireGameControls();

    requestAnimationFrame(() => {
      initializeFieldAndSnake();
      startLoop();
    });
  }

  function wireGameControls(){
    const leftBtn = document.getElementById("turnLeftBtn");
    const rightBtn = document.getElementById("turnRightBtn");
    const homeBtn = document.getElementById("homeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpOverlay = document.getElementById("vsHelpOverlay");
    const helpCloseBtn = document.getElementById("vsHelpCloseBtn");

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

    homeBtn.onclick = () => {
      stopLoop();
      window.VerseGameBridge.exitGame();
    };

    helpBtn.onclick = () => {
      helpOverlay.classList.add("show");
      helpOverlay.setAttribute("aria-hidden", "false");
    };

    helpCloseBtn.onclick = () => {
      helpOverlay.classList.remove("show");
      helpOverlay.setAttribute("aria-hidden", "true");
    };

    helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        helpOverlay.classList.remove("show");
        helpOverlay.setAttribute("aria-hidden", "true");
      }
    };

    muteBtn.onclick = () => {
      muted = !muted;
      const btn = document.getElementById("muteBtn");
      if (btn){
        btn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      }
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

  function initializeFieldAndSnake(){
    syncFieldMetrics();

    state.head.x = state.fieldWidth * 0.50;
    state.head.y = state.fieldHeight * 0.55;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getModeSpeed(selectedMode);

    state.trail = [];
    seedTrail();
    drawSnake();
  }

  function syncFieldMetrics(){
    const field = document.getElementById("vsField");
    const svg = document.getElementById("vsSvg");
    if (!field || !svg) return;

    const rect = field.getBoundingClientRect();
    state.fieldWidth = Math.max(1, rect.width);
    state.fieldHeight = Math.max(1, rect.height);

    svg.setAttribute("viewBox", `0 0 ${state.fieldWidth} ${state.fieldHeight}`);
  }

  function startLoop(){
    state.running = true;
    let lastTs = performance.now();

    function tick(ts){
      if (!state.running) return;

      const dt = Math.min(34, ts - lastTs);
      lastTs = ts;

      syncFieldMetrics();
      updateMotion(dt);
      drawSnake();

      state.rafId = requestAnimationFrame(tick);
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function seedTrail(){
    state.trail = [];
    const step = 8;

    for (let i = 0; i < state.snakeLengthPx; i += step){
      state.trail.push({
        x: state.head.x,
        y: state.head.y + i,
        breakBefore: i === 0 ? false : false
      });
    }
  }

  function updateMotion(dt){
    const turnRate = 2.5;

    state.head.angle += state.turnDir * turnRate * (dt / 1000);

    const speed = state.head.speed;
    let nextX = state.head.x + Math.cos(state.head.angle) * speed * (dt / 1000);
    let nextY = state.head.y + Math.sin(state.head.angle) * speed * (dt / 1000);
    let wrapped = false;

    const pad = 24;

    if (nextX < -pad){
      nextX = state.fieldWidth + pad;
      wrapped = true;
    } else if (nextX > state.fieldWidth + pad){
      nextX = -pad;
      wrapped = true;
    }

    if (nextY < -pad){
      nextY = state.fieldHeight + pad;
      wrapped = true;
    } else if (nextY > state.fieldHeight + pad){
      nextY = -pad;
      wrapped = true;
    }

    // If a wrap happened, mark the old head point as the start of a new segment
    // so the tail does not connect across the whole screen.
    if (wrapped && state.trail.length > 0){
      state.trail[0].breakBefore = true;
    }

    state.head.x = nextX;
    state.head.y = nextY;

    state.trail.unshift({
      x: state.head.x,
      y: state.head.y,
      breakBefore: false
    });

    trimTrail();
  }

  function trimTrail(){
    let total = 0;
    const trimmed = [];

    for (let i = 0; i < state.trail.length; i++){
      const p = state.trail[i];
      trimmed.push(p);

      if (i > 0){
        const prev = state.trail[i - 1];
        if (!p.breakBefore){
          total += Math.hypot(p.x - prev.x, p.y - prev.y);
        }
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
      const p = simplified[i];

      if (p.breakBefore){
        d += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      } else {
        d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }
    }

    return d;
  }

function simplifyTrail(points, minDist){
  if (!points.length) return [];

  const out = [points[0]];
  let last = points[0];

  for (let i = 1; i < points.length; i++){
    const p = points[i];

    if (p.breakBefore){
      out.push({
        x: p.x,
        y: p.y,
        breakBefore: true
      });
      last = p;
      continue;
    }

    if (Math.hypot(p.x - last.x, p.y - last.y) >= minDist){
      out.push({
        x: p.x,
        y: p.y,
        breakBefore: false
      });
      last = p;
    }
  }

  const tail = points[points.length - 1];
  const lastOut = out[out.length - 1];

  if (!lastOut || lastOut.x !== tail.x || lastOut.y !== tail.y){
    out.push({
      x: tail.x,
      y: tail.y,
      breakBefore: !!tail.breakBefore
    });
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

    tongue.setAttribute("d", "M 0 -22 L -4 -34 L 0 -31 L 4 -34 Z");
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
      <div class="vm-stack" style="padding:18px 16px 22px; min-height:100dvh;">
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
