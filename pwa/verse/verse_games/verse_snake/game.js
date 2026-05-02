(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_THEME = {
    bg: "#333333",
    accent: "#333333"
  };

  const BUILD_AREA = "large";

  const HELP_OVERLAY_ID = "vsHelpOverlay";

  let selectedMode = null;
  let completed = false;
  let muted = false;

  const TARGET_COLORS = [
    "#ff5a51",
    "#ffa351",
    "#ffc751",
    "#40b9c5",
    "#7f66c6",
    "#a7cb6f"
  ];

  const FRUIT_EMOJIS = ["🍎","🍓","🍇","🍊","🍉","🍒","🍑","🍍","🥝","🍋"];
  const BASE_SNAKE_STYLES = ["default","berry","ocean","sun"];
  const SPECIAL_SNAKE_STYLES = ["rainbow","lava","ice","candy","midnight","mono"];

const ALL_BIBLE_BOOKS = window.VerseGameShell.getBibleBookDecoys();

const FUNNY_DECOY_WORDS = window.VerseGameShell.getFunDecoys();

  const state = {
    rafId: 0,
    spawnTimerId: 0,
    running: false,
    paused: false,
    pauseReason: "",
    pauseStartedAt: 0,
    turnDir: 0,
    flashUntil: 0,
    happyUntil: 0,
    snakeStyle: "default",
    snakeStyleIndex: 0,
    fruitCount: 0,
    wavesSinceFruit: 0,
    targetGraceMs: 900,
    fruit: null,
    head: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 120
    },
    trail: [],
    snakeLengthPx: 500,
    fieldWidth: 0,
    fieldHeight: 0,
    words: [],
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    segments: [],
    buildSizeClass: "is-normal",
    progressIndex: 0,
    targets: [],
    nextTargetId: 1
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


  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    clearPendingSpawn();
    window.onkeydown = null;
    window.onkeyup = null;
  }

  function clearPendingSpawn(){
    if (state.spawnTimerId){
      clearTimeout(state.spawnTimerId);
      state.spawnTimerId = 0;
    }
  }

  function shiftPauseSensitiveTimers(deltaMs){
    if (state.flashUntil) state.flashUntil += deltaMs;
    if (state.happyUntil) state.happyUntil += deltaMs;

    for (const target of state.targets){
      if (target.visibleAt) target.visibleAt += deltaMs;
      if (target.activeAt) target.activeAt += deltaMs;
      if (target.flashUntil) target.flashUntil += deltaMs;
    }

    if (state.fruit){
      if (state.fruit.visibleAt) state.fruit.visibleAt += deltaMs;
      if (state.fruit.expiresAt) state.fruit.expiresAt += deltaMs;
    }
  }

  function setPaused(paused, reason = ""){
    if (paused){
      if (state.paused) return;
      state.paused = true;
      state.pauseReason = reason;
      state.pauseStartedAt = performance.now();
      state.turnDir = 0;
      clearPendingSpawn();
      return;
    }

    if (!state.paused) return;

    const deltaMs = performance.now() - (state.pauseStartedAt || performance.now());
    state.paused = false;
    state.pauseReason = "";
    state.pauseStartedAt = 0;
    state.turnDir = 0;

    shiftPauseSensitiveTimers(deltaMs);

    if (state.running && !state.targets.length && state.progressIndex < state.segments.length){
      queueNextTargets(170, false);
    }
  }

  function openGameMenu(){
    const menuOverlay = document.getElementById("vsGameMenuOverlay");
    if (!menuOverlay) return;
    setPaused(true, "menu");
    menuOverlay.classList.add("is-open");
    menuOverlay.setAttribute("aria-hidden", "false");
  }

  function closeGameMenu(){
    const menuOverlay = document.getElementById("vsGameMenuOverlay");

    if (menuOverlay && menuOverlay.contains(document.activeElement)){
      document.activeElement.blur();
    }

    if (menuOverlay){
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    }

    const helpOverlay = document.getElementById("vsHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")){
      setPaused(false, "");
    }
  }

function openHelpFromMenu(){
  const menuOverlay = document.getElementById("vsGameMenuOverlay");

  if (menuOverlay){
    menuOverlay.classList.remove("is-open");
    menuOverlay.setAttribute("aria-hidden", "true");
  }

  window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");

  setPaused(true, "help");
}

function closeHelpOverlay(){
  window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);
  setPaused(false, "");
}

function backToMenuFromHelp(){
  window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);

  const menuOverlay = document.getElementById("vsGameMenuOverlay");

  if (menuOverlay){
    menuOverlay.classList.add("is-open");
    menuOverlay.setAttribute("aria-hidden", "false");
  }

  setPaused(true, "menu");
}
  
  function resetSnakeMotion(){
    clearPendingSpawn();
    state.paused = false;
    state.pauseReason = "";
    state.pauseStartedAt = 0;
    state.turnDir = 0;
    state.flashUntil = 0;
    state.happyUntil = 0;
    state.snakeStyle = "default";
    state.snakeStyleIndex = 0;
    state.fruitCount = 0;
    state.wavesSinceFruit = 0;
    state.targetGraceMs = 900;
    state.fruit = null;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getBaseSpeed(selectedMode);
    state.trail = [];
    state.fieldWidth = 0;
    state.fieldHeight = 0;
    state.words = [];
    state.bookLabel = "";
    state.referenceLabel = "";
    state.referenceMeta = null;
    state.segments = [];
    state.progressIndex = 0;
    state.targets = [];
    state.nextTargetId = 1;
  }

  function getBaseSpeed(mode){
    if (mode === "medium") return 136;
    if (mode === "hard") return 150;
    return 122;
  }

  function getSpeedRamp(mode){
    if (mode === "medium") return 2.2;
    if (mode === "hard") return 4.0;
    return 0;
  }

  function getCurrentSpeed(){
    return getBaseSpeed(selectedMode) + (state.progressIndex * getSpeedRamp(selectedMode));
  }

  function tokenizeVerse(text){
    return window.VerseGameShell.tokenizeVerseWords(text);
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

const shuffle = window.VerseGameShell.shuffle;

  function normalizeWord(value){
    return window.VerseGameShell.normalizeWord(value);
  }

  function parseReferenceParts(ref, translation, verseId){
    return window.VerseGameShell.parseReferenceParts(ref, translation, verseId);
  }





  function getPhaseForIndex(index){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: index,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function getCurrentPhase(){
    return getPhaseForIndex(state.progressIndex);
  }

  function getCurrentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function updateBuildText(){
    const el = document.getElementById("vsBuildText");
    if (!el) return;

    if (!state.segments.length){
      el.textContent = "";
      return;
    }

    el.className = `vs-build-text vm-build-text vm-build-text--progress is-verse-layout ${state.buildSizeClass} ${selectedMode === "hard" ? "is-hide-unbuilt" : ""}`;
    el.innerHTML = state.segments.map((segment, index) => `
      <span class="vs-build-word vm-build-word ${index < state.progressIndex ? "is-built" : ""}">
        ${escapeHtml(segment)}
      </span>
    `).join(" ");
  }

function helpHtml(){
  return `
    Easy: no penalty.<br>
    Medium: lose 2 built items.<br>
    Hard: lose everything built.<br><br>
    After the verse words, collect the book, then the reference.<br><br>
    Grab fruit for fun snake color changes.
  `;
}

function renderHelpOverlay(){
  return window.VerseGameShell.helpOverlayHtml({
    id: HELP_OVERLAY_ID,
    title: "How to Play",
    body: helpHtml(),
    closeText: "Close"
  });
}

  function renderGameMenuOverlay(){
    return window.VerseGameShell.gameMenuHtml({
      id: "vsGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }


  function shakeBuildArea(){
    const build = document.getElementById("vsBuild");
    if (!build) return;
    build.classList.remove("vs-shake");
    void build.offsetWidth;
    build.classList.add("vs-shake");
  }

function renderIntroScreen(){
  stopLoop();

  window.VerseGameShell.renderTitleScreen({
    app,
    title: "Verse Snake",
    icon: "🐍",
    helpHtml: helpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Practice Games",
    onBack: () => window.VerseGameBridge.exitGame(),
    onStart: renderModeSelect
  });
}

function renderModeSelect(){
  stopLoop();

  window.VerseGameShell.renderModeSelect({
    app,
    title: "Choose Your Difficulty",
    icon: "🥉🥈🥇",
    helpHtml: helpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Verse Snake title",
    onBack: renderIntroScreen,
    onSelect: (mode) => {
      selectedMode = mode;
      renderGameScreen();
    }
  });
}

  function renderGameScreen(){
    stopLoop();
    resetSnakeMotion();

    app.innerHTML = `
      <div class="vs-root">
        <div class="vs-stage">
          <div class="vs-build-wrap">
            <div class="vs-build vm-build vm-build--${BUILD_AREA}" id="vsBuild">
              <div class="vs-build-text vm-build-text" id="vsBuildText"></div>
            </div>
          </div>

          <div class="vs-field-wrap">
            <div class="vs-field" id="vsField">
              <div class="vs-overlay-pills">
                <button class="vs-pill vs-menu-pill no-zoom" id="vsMenuPill" aria-label="Game Menu" type="button">☰</button>
                <div class="vs-pill" id="vsModePill">${selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode"}</div>
              </div>

              <div class="vs-fruit-layer" id="vsFruitLayer"></div>
              <div class="vs-target-layer" id="vsTargetLayer"></div>

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
          </div>
        </div>

        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
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
    const menuPill = document.getElementById("vsMenuPill");
    const modePill = document.getElementById("vsModePill");



    const turnLeftStart = (e) => {
      if (e) e.preventDefault();
      if (state.paused) return;
      state.turnDir = -1;
    };

    const turnRightStart = (e) => {
      if (e) e.preventDefault();
      if (state.paused) return;
      state.turnDir = 1;
    };

    const turnStop = (e) => {
      if (e) e.preventDefault();
      state.turnDir = 0;
    };

    leftBtn.addEventListener("pointerdown", turnLeftStart);
    rightBtn.addEventListener("pointerdown", turnRightStart);

    leftBtn.addEventListener("pointerup", turnStop);
    rightBtn.addEventListener("pointerup", turnStop);
    leftBtn.addEventListener("pointercancel", turnStop);
    rightBtn.addEventListener("pointercancel", turnStop);
    leftBtn.addEventListener("pointerleave", turnStop);
    rightBtn.addEventListener("pointerleave", turnStop);

    leftBtn.addEventListener("dblclick", (e) => e.preventDefault());
    rightBtn.addEventListener("dblclick", (e) => e.preventDefault());

    if (menuPill){
      menuPill.onclick = (e) => {
        e.stopPropagation();
        openGameMenu();
      };
    }

    if (modePill){
      modePill.textContent = selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode";
    }

    window.VerseGameShell.wireGameMenu({
      id: "vsGameMenuOverlay",
      menuButtonId: "vsMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        muted = !muted;
        return muted;
      },
      onHowToPlay: openHelpFromMenu,
      onModeSelect: () => {
        setPaused(false, "");
        renderModeSelect();
      },
      onExit: () => {
        stopLoop();
        window.VerseGameBridge.exitGame();
      },
      onOpen: () => setPaused(true, "menu"),
      onClose: () => setPaused(false, ""),
      onBackFromHelp: () => setPaused(true, "menu")
    });

    window.onkeydown = (e) => {
      if (state.paused) return;

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

    state.snakeLengthPx = Math.max(
      180,
      Math.min(state.fieldWidth * 0.5, 420)
    );

    const refParts = parseReferenceParts(
      ctx.verseRef || launch.ref || "",
      ctx.translation,
      ctx.verseId || launch.verseId || ""
    );

    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: refParts.book,
      reference: refParts.reference,
      buildArea: BUILD_AREA
    });

    state.words = buildData.words;
    state.referenceMeta = refParts;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.buildSizeClass = buildData.buildSizeClass;
    state.segments = buildData.segments;

    state.progressIndex = 0;

    state.head.x = state.fieldWidth * 0.50;
    state.head.y = state.fieldHeight * 0.55;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getCurrentSpeed();

    state.trail = [];
    seedTrail();
    updateBuildText();
    scheduleTargetsSpawn();
    renderTargets();
    renderFruit();
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

      if (!state.paused){
        updateMotion(dt);
        updateTargetVisibility(ts);
        updateFruitVisibility(ts);
        checkFruitCollision();
        checkTargetCollisions();
      }

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
        breakBefore: false
      });
    }
  }

  function updateMotion(dt){
    const turnRate = 2.5;

    state.head.angle += state.turnDir * turnRate * (dt / 1000);
    state.head.speed = getCurrentSpeed();

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

  function getRandomSpecialSnakeStyle(excludeStyle = ""){
    const pool = SPECIAL_SNAKE_STYLES.filter(style => style !== excludeStyle);
    if (!pool.length) return "rainbow";
    return pool[Math.floor(Math.random() * pool.length)];
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

    const styleClasses = ["rainbow","lava","ice","candy","midnight","mono"];

    body.setAttribute("d", buildBodyPath(state.trail));
    body.classList.toggle("is-wrong", isWrong);
    body.classList.toggle("is-happy", isHappy);

    head.classList.toggle("is-wrong", isWrong);

    for (const styleName of styleClasses){
      const active = state.snakeStyle === styleName;
      body.classList.toggle(`is-${styleName}`, active);
      head.classList.toggle(`is-${styleName}`, active);
    }

    const wrongColor = "#ff5a51";
    const headColor = isWrong ? wrongColor : getSnakeHeadColor();
    const bodyColor = isWrong ? wrongColor : getSnakeBodyColor();

    head.style.fill = headColor;
    body.style.stroke = bodyColor;

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
    if (state.snakeStyle === "lava") return "#ff7a45";
    if (state.snakeStyle === "ice") return "#bfe9ff";
    if (state.snakeStyle === "candy") return "#ff9ecf";
    if (state.snakeStyle === "midnight") return "#5a4bff";
    if (state.snakeStyle === "mono") return "#f2f2f2";
    return "#a7cb6f";
  }

  function getSnakeHeadColor(){
    if (state.snakeStyle === "berry") return "#ff7eb6";
    if (state.snakeStyle === "ocean") return "#74c0fc";
    if (state.snakeStyle === "sun") return "#ffd43b";
    if (state.snakeStyle === "lava") return "#ff944d";
    if (state.snakeStyle === "ice") return "#d8f4ff";
    if (state.snakeStyle === "candy") return "#ffd3e8";
    if (state.snakeStyle === "midnight") return "#7e72ff";
    if (state.snakeStyle === "mono") return "#ffffff";
    return "#a7cb6f";
  }

  function cycleSnakeStyle(){
    state.fruitCount += 1;

    if (state.fruitCount === 1){
      state.snakeStyle = "berry";
      return;
    }

    if (state.fruitCount === 2){
      state.snakeStyle = "ocean";
      return;
    }

    if (state.fruitCount === 3){
      state.snakeStyle = "sun";
      return;
    }

    state.snakeStyle = getRandomSpecialSnakeStyle(state.snakeStyle);
  }

  function getTargetCount(){
    return state.fieldWidth <= 520 ? 2 : 3;
  }

  function pickWordDecoys(correctWord, count){
    const decoys = selectedMode === "easy"
      ? window.VerseGameShell.getFunWordDecoys(correctWord, state.words, count)
      : window.VerseGameShell.getVerseWordDecoys({
          words: state.words,
          correct: correctWord,
          targetIndex: state.progressIndex,
          count,
          avoidNext: 2,
          fallbackToFun: true
        });

    while (decoys.length < count){
      const fallback = window.VerseGameShell.getFunWordDecoys(correctWord, state.words, count);
      const seen = new Set([correctWord, ...decoys].map(normalizeWord));

      for (const word of fallback){
        const key = normalizeWord(word);
        if (!key || seen.has(key)) continue;
        decoys.push(word);
        seen.add(key);
        if (decoys.length >= count) break;
      }

      if (decoys.length < count) break;
    }

    return decoys.slice(0, count);
  }

  function pickBookDecoys(correctBook, count){
    const decoys = window.VerseGameShell.getBookDecoys(correctBook, count);

    while (decoys.length < count){
      decoys.push("Psalm");
    }

    return decoys.slice(0, count);
  }

  function buildReferenceDecoys(correctRef, count){
    const decoys = window.VerseGameShell
      .getReferenceDecoys(state.referenceMeta, selectedMode, count)
      .filter((ref) => normalizeWord(ref) !== normalizeWord(correctRef));

    while (decoys.length < count){
      decoys.push("1:1");
    }

    return decoys.slice(0, count);
  }

  function getChoicesForCurrentPhase(){
    const phase = getCurrentPhase();
    const correct = getCurrentCorrectLabel();
    const decoyCount = getTargetCount() - 1;

    if (phase === "words"){
      return [
        { word: correct, isCorrect: true },
        ...pickWordDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    if (phase === "book"){
      return [
        { word: correct, isCorrect: true },
        ...pickBookDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    if (phase === "reference"){
      return [
        { word: correct, isCorrect: true },
        ...buildReferenceDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    return [];
  }

  function distance(a, b){
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

const clamp = window.VerseGameShell.clamp;

function findSpawnPosition(existing) {
  const isMobile = state.fieldWidth <= 520;

  const marginX = isMobile ? 54 : 64;
  const marginTop = 90;
  const marginBottom = isMobile ? 92 : 82;

  const minX = marginX;
  const maxX = Math.max(minX + 20, state.fieldWidth - marginX);
  const minY = marginTop;
  const maxY = Math.max(minY + 20, state.fieldHeight - marginBottom);

  const headPoint = { x: state.head.x, y: state.head.y };

  const headBuffer = isMobile ? 112 : 150;
  const itemBuffer = isMobile ? 102 : 148;
  const fruitBuffer = isMobile ? 96 : 136;

  function isSafePoint(p, bufferScale = 1){
    if (p.x < minX || p.x > maxX) return false;
    if (p.y < minY || p.y > maxY) return false;

    if (distance(p, headPoint) < headBuffer * bufferScale) return false;

    for (const item of existing){
      if (!item) continue;
      if (distance(p, item) < itemBuffer * bufferScale){
        return false;
      }
    }

    if (state.fruit && distance(p, state.fruit) < fruitBuffer * bufferScale){
      return false;
    }

    return true;
  }

  function randomPoint(){
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }

  function clampPoint(p){
    return {
      x: clamp(p.x, minX, maxX),
      y: clamp(p.y, minY, maxY)
    };
  }

  function jitterPoint(base, radiusX, radiusY){
    return clampPoint({
      x: base.x + ((Math.random() * 2 - 1) * radiusX),
      y: base.y + ((Math.random() * 2 - 1) * radiusY)
    });
  }

  // Pass 1:
  // Pure random placements, which keeps the older organic feel.
  for (let i = 0; i < 90; i++){
    const p = randomPoint();
    if (isSafePoint(p, 1)){
      return p;
    }
  }

  // Pass 2:
  // Build a few soft random anchors, then jitter around them.
  // This still feels random, but rescues tighter layouts without obvious fixed lanes.
  const anchorCount = isMobile ? 6 : 8;
  const anchors = [];

  for (let i = 0; i < anchorCount; i++){
    anchors.push({
      x: minX + (maxX - minX) * (0.14 + Math.random() * 0.72),
      y: minY + (maxY - minY) * (0.10 + Math.random() * 0.78)
    });
  }

  for (const anchor of shuffle(anchors)){
    for (let j = 0; j < 10; j++){
      const p = jitterPoint(
        anchor,
        isMobile ? 54 : 72,
        isMobile ? 46 : 62
      );

      if (isSafePoint(p, 0.96)){
        return p;
      }
    }
  }

  // Pass 3:
  // Last resort, still random-ish:
  // choose the safest point among several random candidates instead of snapping
  // to the same repeated fallback spots every wave.
  let bestPoint = null;
  let bestScore = -Infinity;

  for (let i = 0; i < 24; i++){
    const p = randomPoint();

    const headDist = distance(p, headPoint);
    let nearestItemDist = Infinity;

    for (const item of existing){
      if (!item) continue;
      nearestItemDist = Math.min(nearestItemDist, distance(p, item));
    }

    if (state.fruit){
      nearestItemDist = Math.min(nearestItemDist, distance(p, state.fruit));
    }

    if (!Number.isFinite(nearestItemDist)){
      nearestItemDist = itemBuffer * 1.5;
    }

    const edgeDist = Math.min(
      p.x - minX,
      maxX - p.x,
      p.y - minY,
      maxY - p.y
    );

    const score = (headDist * 0.75) + nearestItemDist + (edgeDist * 0.35);

    if (score > bestScore){
      bestScore = score;
      bestPoint = p;
    }
  }

  return bestPoint || {
    x: state.fieldWidth * 0.5,
    y: clamp(state.fieldHeight * 0.52, minY, maxY)
  };
}

function findFruitSpawnPosition(){
  const isMobile = state.fieldWidth <= 520;

  const marginX = isMobile ? 54 : 66;
  const marginTop = 86;
  const marginBottom = isMobile ? 108 : 96;

  const minX = marginX;
  const maxX = Math.max(minX + 20, state.fieldWidth - marginX);
  const minY = marginTop;
  const maxY = Math.max(minY + 20, state.fieldHeight - marginBottom);

  const headPoint = { x: state.head.x, y: state.head.y };

  const headBuffer = isMobile ? 150 : 168;
  const targetBuffer = isMobile ? 98 : 114;

  function randomPoint(){
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }

  function isSafePoint(p, headScale = 1, targetScale = 1){
    if (p.x < minX || p.x > maxX) return false;
    if (p.y < minY || p.y > maxY) return false;

    if (distance(p, headPoint) < headBuffer * headScale){
      return false;
    }

    for (const target of state.targets){
      if (!target) continue;
      if (distance(p, target) < targetBuffer * targetScale){
        return false;
      }
    }

    return true;
  }

  // Pass 1:
  // Pure random placements first, to keep fruit feeling organic.
  for (let i = 0; i < 70; i++){
    const p = randomPoint();
    if (isSafePoint(p, 1, 1)){
      return p;
    }
  }

  // Pass 2:
  // Try softer random positions that slightly favor the mid play area
  // without snapping into a fixed list of known spots.
  for (let i = 0; i < 28; i++){
    const centerish = {
      x: minX + (maxX - minX) * (0.18 + Math.random() * 0.64),
      y: minY + (maxY - minY) * (0.16 + Math.random() * 0.60)
    };

    if (isSafePoint(centerish, 0.94, 0.96)){
      return centerish;
    }
  }

  // Pass 3:
  // Pick the best of several random candidates instead of using a fixed pattern.
  let bestPoint = null;
  let bestScore = -Infinity;

  for (let i = 0; i < 24; i++){
    const p = randomPoint();

    const headDist = distance(p, headPoint);

    let nearestTargetDist = Infinity;
    for (const target of state.targets){
      if (!target) continue;
      nearestTargetDist = Math.min(nearestTargetDist, distance(p, target));
    }

    if (!Number.isFinite(nearestTargetDist)){
      nearestTargetDist = targetBuffer * 1.5;
    }

    const edgeDist = Math.min(
      p.x - minX,
      maxX - p.x,
      p.y - minY,
      maxY - p.y
    );

    const score = (headDist * 0.8) + nearestTargetDist + (edgeDist * 0.25);

    if (score > bestScore){
      bestScore = score;
      bestPoint = p;
    }
  }

  return bestPoint;
}


  function scheduleTargetsSpawn(){
    const correctLabel = getCurrentCorrectLabel();
    if (!correctLabel){
      state.targets = [];
      renderTargets();
      return;
    }

    const desiredCount = getTargetCount();
    const choices = getChoicesForCurrentPhase().slice(0, desiredCount);
    const shuffledChoices = shuffle(choices);
    const shuffledColors = shuffle(TARGET_COLORS);
    const usedPositions = [];
    const baseTime = performance.now() + 170;

    state.targets = shuffledChoices.map((choice, index) => {
      const pos = findSpawnPosition(usedPositions);
      usedPositions.push(pos);

      const visibleAt = baseTime + index * 120;

      return {
        id: state.nextTargetId++,
        word: choice.word,
        isCorrect: choice.isCorrect,
        x: pos.x,
        y: pos.y,
        r: 21,
        color: shuffledColors[index % shuffledColors.length],
        flashUntil: 0,
        flashing: false,
        visible: false,
        visibleAt,
        activeAt: visibleAt + state.targetGraceMs
      };
    });

    renderTargets();
  }

function queueNextTargets(delayMs = 170, allowFruit = false){
  clearPendingSpawn();

  state.targets = [];
  renderTargets();

  state.spawnTimerId = window.setTimeout(() => {
    state.spawnTimerId = 0;

    if (!state.running) return;

    scheduleTargetsSpawn();

    if (allowFruit){
      maybeScheduleFruitSpawn(430);
    }
  }, delayMs);
}

function maybeScheduleFruitSpawn(delayMs = 480){
  if (state.fruit) return;

  state.wavesSinceFruit += 1;

  const isMobile = state.fieldWidth <= 520;
  const shouldForceSpawn = state.wavesSinceFruit >= (isMobile ? 2 : 3);
  const shouldSpawnByChance = Math.random() <= (isMobile ? 0.62 : 0.45);

  if (!shouldForceSpawn && !shouldSpawnByChance) return;

  const pos = findFruitSpawnPosition();
  if (!pos) return;

  state.wavesSinceFruit = 0;

  state.fruit = {
    emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
    x: pos.x,
    y: pos.y,
    r: 20,
    visible: false,
    visibleAt: performance.now() + delayMs,
    expiresAt: performance.now() + delayMs + 6500
  };

  renderFruit();
}

  function updateTargetVisibility(now){
    let changed = false;

    for (const target of state.targets){
      if (!target.visible && now >= target.visibleAt){
        target.visible = true;
        changed = true;
      }

      if (target.flashing && now >= target.flashUntil){
        target.flashing = false;
        changed = true;
      }
    }

    if (changed){
      renderTargets();
    }
  }

  function updateFruitVisibility(now){
    if (!state.fruit) return;

    if (!state.fruit.visible && now >= state.fruit.visibleAt){
      state.fruit.visible = true;
      renderFruit();
    }

    if (now >= state.fruit.expiresAt){
      state.fruit = null;
      renderFruit();
    }
  }

  function renderTargets(){
    const layer = document.getElementById("vsTargetLayer");
    if (!layer) return;

    layer.innerHTML = state.targets
      .filter(target => target.visible)
      .map(target => `
        <div
          class="vs-target is-visible ${target.flashing ? "is-wrong" : ""}"
          style="left:${target.x}px; top:${target.y}px;"
        >
          <div class="vs-target-dot" style="background:${target.color};"></div>
          <div class="vs-target-word">${escapeHtml(target.word)}</div>
        </div>
      `).join("");
  }

  function renderFruit(){
    const layer = document.getElementById("vsFruitLayer");
    if (!layer) return;

    if (!state.fruit || !state.fruit.visible){
      layer.innerHTML = "";
      return;
    }

    layer.innerHTML = `
      <div class="vs-fruit is-visible" style="left:${state.fruit.x}px; top:${state.fruit.y}px;">
        ${escapeHtml(state.fruit.emoji)}
      </div>
    `;
  }

function completeCurrentMode(){
  window.VerseGameBridge.markCompleted({
    verseId: ctx.verseId,
    gameId: "verse_snake",
    mode: selectedMode,
    progressType: "standard"
  });

  completed = true;
  renderDone();
}

  function handleFruitPickup(){
    state.fruit = null;
    state.happyUntil = performance.now() + 340;
    cycleSnakeStyle();
    renderFruit();
  }

  function handleCorrectTarget(target){
    state.progressIndex += 1;
    state.happyUntil = performance.now() + 260;

    updateBuildText();

    if (state.progressIndex >= state.segments.length){
      completeCurrentMode();
      return;
    }

    queueNextTargets(170, true);
  }

  function applyWrongPenalty(){
    if (selectedMode === "easy"){
      return false;
    }

    if (selectedMode === "medium"){
      const newIndex = Math.max(0, state.progressIndex - 2);
      const changed = newIndex !== state.progressIndex;
      state.progressIndex = newIndex;
      return changed;
    }

    if (selectedMode === "hard"){
      const changed = state.progressIndex !== 0;
      state.progressIndex = 0;
      return changed;
    }

    return false;
  }

  function handleWrongTarget(target){
    const now = performance.now();
    if (target.flashing) return;

    target.flashing = true;
    target.flashUntil = now + 240;
    state.flashUntil = now + 240;
    shakeBuildArea();

    const changedProgress = applyWrongPenalty();
    updateBuildText();

    state.targets = state.targets.filter(t => t.id !== target.id);
    renderTargets();

    if (changedProgress || state.targets.filter(t => t.visible && !t.isCorrect).length === 0){
      queueNextTargets(190, false);
    }
  }

  function checkFruitCollision(){
    if (!state.fruit || !state.fruit.visible) return;

    const headPoint = { x: state.head.x, y: state.head.y };
    const headRadius = 18;
    const d = Math.hypot(headPoint.x - state.fruit.x, headPoint.y - state.fruit.y);

    if (d <= headRadius + state.fruit.r){
      handleFruitPickup();
    }
  }

  function checkTargetCollisions(){
    if (!state.targets.length) return;

    const headPoint = { x: state.head.x, y: state.head.y };
    const headRadius = 18;

    for (const target of state.targets){
      if (!target.visible) continue;
      if (performance.now() < target.activeAt) continue;

      const d = Math.hypot(headPoint.x - target.x, headPoint.y - target.y);
      if (d <= target.r + headRadius){
        if (target.isCorrect){
          handleCorrectTarget(target);
        } else {
          handleWrongTarget(target);
        }
        break;
      }
    }
  }

function renderDone(){
  stopLoop();

  const doneText = selectedMode
    ? `${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Complete!`
    : "Complete!";

  window.VerseGameShell.renderCompleteScreen({
    app,
    icon: "🎉",
    title: doneText,
    statsText: `Fruit eaten: ${state.fruitCount}`,
    theme: GAME_THEME,
    playAgainText: "Play Again",
    moreGamesText: "More Games",
    backLabel: "Back to Practice Games",
    onPlayAgain: () => {
      completed = false;
      renderModeSelect();
    },
    onMoreGames: () => window.VerseGameBridge.exitGame()
  });
}

  renderIntroScreen();
})();
