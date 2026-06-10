(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "versey_bird_2";
  const GAME_TITLE = "Versey Bird";
  const GAME_THEME = { bg: "#333333", accent: "#333333" };
  const BUILD_AREA = "large";
  const HELP_OVERLAY_ID = "vb2HelpOverlay";
  const MENU_OVERLAY_ID = "vb2GameMenuOverlay";
  const IMAGE_PATH = "./versey_bird_images/";

  const BIRD_COLORS = [
    { name: "yellow", primary: "#ffc751", secondary: "#a68235" },
    { name: "red", primary: "#ff5a51", secondary: "#a63b35" },
    { name: "green", primary: "#a7cb6f", secondary: "#6d8448" },
    { name: "purple", primary: "#7f66c6", secondary: "#534281" },
    { name: "black", primary: "#4d4d4d", secondary: "#8b8b8b" },
    { name: "orange", primary: "#ffa351", secondary: "#a66a35" },
    { name: "white", primary: "#f2f2f2", secondary: "#cccccc" },
    { name: "pink", primary: "#ff948e", secondary: "#a6605c" },
    { name: "teal", primary: "#1ea8aa", secondary: "#146d6f" }
  ];

  const CLOUD_SHAPES = {
    compact: {
      image: "versey_bird_cloud_compact.svg",
      aspect: 290 / 225,
      heightU: 1.22,
      textX: 50.0,
      textY: 54.8
    },
    normal: {
      image: "versey_bird_cloud_normal.svg",
      aspect: 380 / 225,
      heightU: 1.28,
      textX: 49.7,
      textY: 52.1
    },
    long: {
      image: "versey_bird_cloud_long.svg",
      aspect: 560 / 225,
      heightU: 1.34,
      textX: 49.5,
      textY: 55.4
    }
  };

  const INTRO_WORDS = [
    { text: "TAP", line: 0, delay: 0.15 },
    { text: "TO", line: 0, delay: 0.55 },
    { text: "FLY", line: 0, delay: 0.95 },
    { text: "COLLECT", line: 1, delay: 2.05 },
    { text: "CORRECT", line: 1, delay: 2.55 },
    { text: "WORDS", line: 1, delay: 3.05 }
  ];

  const DIFFICULTY = {
    easy: {
      worldSpeedU: 2.25,
      gravityU: 11.8,
      flapU: -4.85,
      cloudGapU: 2.75,
      hitPaddingU: 0.28,
      bonusStartSpeedU: 2.45,
      bonusRampU: 0.090,
      bonusStartGapU: 5.05,
      bonusMinGapU: 3.85,
      bonusPipeEveryU: 5.45,
      obstacleCloudMin: 4,
      obstacleCloudMax: 5,
      obstacleBeeChance: 0.35
    },
    medium: {
      worldSpeedU: 2.55,
      gravityU: 12.7,
      flapU: -5.15,
      cloudGapU: 2.55,
      hitPaddingU: 0.22,
      bonusStartSpeedU: 2.75,
      bonusRampU: 0.115,
      bonusStartGapU: 4.70,
      bonusMinGapU: 3.45,
      bonusPipeEveryU: 5.10,
      obstacleCloudMin: 3,
      obstacleCloudMax: 4,
      obstacleBeeChance: 0.50
    },
    hard: {
      worldSpeedU: 2.85,
      gravityU: 13.4,
      flapU: -5.35,
      cloudGapU: 2.35,
      hitPaddingU: 0.17,
      bonusStartSpeedU: 3.05,
      bonusRampU: 0.145,
      bonusStartGapU: 4.35,
      bonusMinGapU: 3.10,
      bonusPipeEveryU: 4.85,
      obstacleCloudMin: 2,
      obstacleCloudMax: 3,
      obstacleBeeChance: 0.60
    }
  };

  let selectedMode = null;
  let completed = false;
  let completionResult = null;
  let muted = false;
  let birdSvgText = "";

  const state = {
    running: false,
    phase: "title",
    rafId: 0,
    paused: false,
    pauseReason: "",
    field: null,
    resizeHandler: null,
    lastInputAt: 0,
    lastTs: 0,
    startTs: 0,
    phaseStartedAt: 0,
    introStartedAt: 0,
    bonusStartedAt: 0,
    bonusIntroUnlockAt: 0,
    crashStartedAt: 0,
    worldX: 0,
    cloudBgX: 0,
    layout: null,
    birdColor: BIRD_COLORS[0],
    birdX: 0,
    birdY: 0,
    birdVY: 0,
    birdAngle: 0,
    birdSpinUntil: 0,
    birdFlapUntil: 0,
    birdHidden: false,
    bgClouds: [],
    nextBgCloudId: 1,
    bgCloudCooldown: 0,
    poofs: [],
    obstacles: [],
    beeTrailDots: [],
    nextObstacleId: 1,
    nextBeeTrailDotId: 1,
    obstacleCloudCountdown: 0,
    wordCloud: null,
    nextCloudId: 1,
    cloudCooldown: 0,
    spawnHistory: [],
    forceCorrectNext: false,
    progressIndex: 0,
    streak: 0,
    bestStreak: 0,
    buildFitDone: false,
    words: [],
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    segments: [],
    buildSizeClass: "is-normal",
    bonusPipes: [],
    nextPipeId: 1,
    pipeCooldown: 0,
    pipesCleared: 0,
    bonusElapsed: 0,
    resultShown: false,
    flashUntil: 0,
    flashColor: "rgba(255,255,255,0.3)",
    shakeUntil: 0
  };

  setupReferenceSegments();
  renderIntro();
  preloadBirdSvg();

  function introHelpHtml(){
    return `
      Tap or click to flap.<br><br>
      During the verse flight, collect the correct word clouds and avoid decoys.<br><br>
      After the verse, book, and reference are collected, try the bonus flight. Don't hit the pipes!
    `;
  }

  function modeHelpHtml(){
    return `
      Easy: gentler flying and easier decoys.<br><br>
      Medium: balanced flying with trickier decoys.<br><br>
      Hard: faster flying with the toughest decoys.
    `;
  }

  function gameHelpHtml(){
    return `
      Tap or click to flap.<br><br>
      Collect the next correct word cloud. Avoid decoy clouds, bees, and boulders.<br><br>
      Missing a correct word resets your streak in Medium and Hard only.<br><br>
      After the verse is built, fly through as many pipes as you can.
    `;
  }

  function renderIntro(){
    stopLoop();
    cleanupResize();
    state.phase = "title";

    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: "🐤",
      helpHtml: introHelpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: renderModeSelect
    });
  }

  function renderModeSelect(){
    stopLoop();
    cleanupResize();
    state.phase = "mode";

    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Difficulty",
      icon: "🥉🥈🥇",
      helpHtml: modeHelpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Versey Bird title",
      onBack: renderIntro,
      onSelect: startGame
    });
  }

  function startGame(mode){
    stopLoop();
    cleanupResize();

    selectedMode = mode;
    completed = false;
    completionResult = null;
    resetStateForRun();

    app.innerHTML = `
      <div class="vb2-root">
        <div class="vb2-stage">
          <div class="vb2-build-wrap">
            <div class="vb2-build vm-build vm-build--${BUILD_AREA}" id="vb2Build">
              <div class="vb2-build-text vm-build-text" id="vb2BuildText"></div>
            </div>
          </div>

          <div class="vb2-field-wrap">
            <div class="vb2-field" id="vb2Field">
              <div class="vb2-bg-clouds" id="vb2BgClouds"></div>
              <div class="vb2-hills" id="vb2Hills">
                <div class="vb2-hill-strip" id="vb2HillStripA"></div>
                <div class="vb2-hill-strip" id="vb2HillStripB"></div>
              </div>
              <div class="vb2-ground" id="vb2Ground"></div>

              <button class="vb2-menu-pill" id="vb2MenuPill" aria-label="Game Menu">☰</button>

              <div class="vb2-poofs" id="vb2Poofs"></div>
              <div class="vb2-word-clouds" id="vb2WordClouds"></div>
              <div class="vb2-obstacles" id="vb2Obstacles"></div>
              <div class="vb2-pipes" id="vb2Pipes"></div>
              <div class="vb2-bird-layer"><div class="vb2-bird" id="vb2Bird"></div></div>
              <div class="vb2-intro-layer" id="vb2IntroLayer"></div>
              <div class="vb2-flash" id="vb2Flash"></div>
              <div class="vb2-result-layer" id="vb2ResultLayer" hidden></div>
            </div>
          </div>
        </div>

        ${renderHelpOverlay(gameHelpHtml())}
        ${renderGameMenuOverlay()}
      </div>
    `;

    state.field = document.getElementById("vb2Field");
    wireCommonNav();
    wireGameInput();
    updateBuildText();
    installResize();
    recalcLayout();
    renderBirdAsset();
    enterIntroPhase();
    startLoop();
  }

  function resetStateForRun(){
    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.phase = "intro";
    state.lastTs = 0;
    state.startTs = 0;
    state.phaseStartedAt = 0;
    state.introStartedAt = 0;
    state.bonusStartedAt = 0;
    state.bonusIntroUnlockAt = 0;
    state.crashStartedAt = 0;
    state.worldX = 0;
    state.cloudBgX = 0;
    state.layout = null;
    state.birdColor = BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)];
    state.birdVY = 0;
    state.birdAngle = 0;
    state.birdSpinUntil = 0;
    state.birdFlapUntil = 0;
    state.birdHidden = false;
    state.bgClouds = [];
    state.nextBgCloudId = 1;
    state.bgCloudCooldown = 0.65;
    state.poofs = [];
    state.obstacles = [];
    state.beeTrailDots = [];
    state.nextObstacleId = 1;
    state.nextBeeTrailDotId = 1;
    state.obstacleCloudCountdown = getNextObstacleCloudCountdown();
    state.wordCloud = null;
    state.nextCloudId = 1;
    state.cloudCooldown = 0;
    state.spawnHistory = [];
    state.forceCorrectNext = false;
    state.progressIndex = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.buildFitDone = false;
    state.bonusPipes = [];
    state.nextPipeId = 1;
    state.pipeCooldown = 0;
    state.pipesCleared = 0;
    state.bonusElapsed = 0;
    state.resultShown = false;
    state.flashUntil = 0;
    state.flashColor = "rgba(255,255,255,0.3)";
    state.shakeUntil = 0;
  }

  function enterIntroPhase(){
    state.phase = "intro";
    state.phaseStartedAt = performance.now();
    state.introStartedAt = state.phaseStartedAt;
    state.wordCloud = null;
    state.bonusPipes = [];
    state.birdHidden = false;
    resetBird();
  }

  function enterVersePhase(){
    state.phase = "verse";
    state.phaseStartedAt = performance.now();
    state.wordCloud = null;
    state.obstacles = [];
    state.beeTrailDots = [];
    state.obstacleCloudCountdown = getNextObstacleCloudCountdown();
    state.cloudCooldown = 0.25;
    state.birdHidden = false;
  }

  function enterBonusIntroPhase(){
    state.phase = "bonusIntro";
    state.phaseStartedAt = performance.now();
    state.bonusIntroUnlockAt = state.phaseStartedAt + 1350;
    state.wordCloud = null;
    state.obstacles = [];
    state.beeTrailDots = [];
    state.bonusPipes = [];
    state.pipeCooldown = 0;
    state.birdHidden = true;
    state.birdVY = 0;
  }

  function enterBonusPhase(){
    state.phase = "bonus";
    state.phaseStartedAt = performance.now();
    state.bonusStartedAt = state.phaseStartedAt;
    state.bonusIntroUnlockAt = 0;
    state.bonusPipes = [];
    state.nextPipeId = 1;
    state.pipeCooldown = 0.9;
    state.pipesCleared = 0;
    state.bonusElapsed = 0;
    state.resultShown = false;
    state.birdHidden = false;
    resetBird();
    flap();
  }

  function enterBonusCrashPhase(){
    if (state.phase !== "bonus") return;
    state.phase = "bonusCrash";
    state.phaseStartedAt = performance.now();
    state.crashStartedAt = state.phaseStartedAt;
    state.birdSpinUntil = state.crashStartedAt + 1500;
    state.birdVY = -2.2 * state.layout.unit;
    flash("rgba(255, 90, 81, 0.28)", 160);
  }

  function showBonusResult(){
    if (state.resultShown) return;
    state.resultShown = true;
    state.phase = "bonusResult";
    state.running = false;
    stopLoop();

    const layer = document.getElementById("vb2ResultLayer");
    if (!layer) return;

    layer.hidden = false;
    layer.innerHTML = `
      <div class="vb2-result-card" role="dialog" aria-live="polite" aria-label="Bonus result">
        <h2 class="vb2-result-title">Great flying!</h2>
        <p class="vb2-result-stat">Pipes cleared: ${state.pipesCleared}</p>
        <button class="vb2-result-button" id="vb2ContinueButton" type="button">Continue</button>
      </div>
    `;

    const button = document.getElementById("vb2ContinueButton");
    if (button){
      button.addEventListener("click", () => finishRun());
      button.focus({ preventScroll: true });
    }
  }

  function renderComplete(){
    stopLoop();
    cleanupResize();

    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🐤",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage: `Finished ${ctx.verseRef || "the verse"}`,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: renderModeSelect,
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function renderHelpOverlay(body){
    return window.VerseGameShell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body,
      closeText: "Close"
    });
  }

  function renderGameMenuOverlay(){
    return window.VerseGameShell.gameMenuHtml({
      id: MENU_OVERLAY_ID,
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function wireCommonNav(){
    window.VerseGameShell.wireGameMenu({
      id: MENU_OVERLAY_ID,
      menuButtonId: "vb2MenuPill",
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
      onExit: () => window.VerseGameBridge.exitGame(),
      onOpen: () => setPaused(true, "menu"),
      onClose: () => setPaused(false, ""),
      onBackFromHelp: () => setPaused(true, "menu")
    });
  }

  function openHelpFromMenu(){
    const overlay = document.getElementById(HELP_OVERLAY_ID);
    if (overlay){
      overlay.removeAttribute("hidden");
    }
  }

  function setPaused(paused, reason = ""){
    if (!state.running && state.phase !== "bonusIntro") return;
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused){
      state.lastTs = 0;
    }
  }

  function wireGameInput(){
    const field = document.getElementById("vb2Field");
    if (!field) return;

    field.addEventListener("pointerdown", (event) => {
      if (event.target && event.target.closest("button")) return;
      event.preventDefault();
      handleInput(event);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      if (!state.field) return;
      event.preventDefault();
      handleInput(event);
    });
  }

  function handleInput(event){
    const now = performance.now();
    if (now - state.lastInputAt < 70) return;
    state.lastInputAt = now;

    if (state.paused) return;

    if (state.phase === "bonusIntro"){
      if (now < state.bonusIntroUnlockAt) return;
      enterBonusPhase();
      return;
    }

    if (state.phase === "intro" || state.phase === "verse" || state.phase === "bonus"){
      flap();
    }
  }

  function flap(){
    if (!state.layout) return;
    state.birdVY = getDifficulty().flapU * state.layout.unit;
    state.birdFlapUntil = performance.now() + 160;
    addFlapTrail();
  }

  function installResize(){
    state.resizeHandler = () => {
      recalcLayout();
      state.lastTs = 0;
    };
    window.addEventListener("resize", state.resizeHandler, { passive: true });
  }

  function cleanupResize(){
    if (!state.resizeHandler) return;
    window.removeEventListener("resize", state.resizeHandler);
    state.resizeHandler = null;
  }

  function recalcLayout(){
    const field = document.getElementById("vb2Field");
    if (!field) return;

    const rect = field.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const rawBirdH = Math.min(height * 0.145, width * 0.17);
    const birdH = clamp(rawBirdH, 42, 74);
    const unit = birdH;
    const birdAspect = 155 / 136;
    const groundH = clamp(unit * 1.28, height * 0.14, height * 0.20);
    const hillH = unit * 3.0;
    const playTop = unit * 0.70;
    const groundY = height - groundH;
    const playBottom = groundY - unit * 0.54;
    const playH = Math.max(unit * 3.1, playBottom - playTop);

    state.layout = {
      width,
      height,
      unit,
      birdW: unit * birdAspect,
      birdH: unit,
      birdRadius: unit * 0.43,
      birdX: width * 0.25,
      groundH,
      groundY,
      hillH,
      playTop,
      playBottom,
      lanes: [
        playTop + playH * 0.20,
        playTop + playH * 0.50,
        playTop + playH * 0.80
      ],
      cloudSpawnX: width + unit * 2.3,
      cloudOffscreenX: -unit * 3.1,
      pipeSpawnX: width + unit * 1.85,
      pipeOffscreenX: -unit * 1.85,
      pipeW: unit * 1.72,
      pipeCapH: unit * 0.66,
      pipeMinH: unit * 0.78
    };

    document.documentElement.style.setProperty("--vb2-last-unit", `${unit}px`);
    field.style.setProperty("--vb2-ground-h", `${groundH}px`);
    field.style.setProperty("--vb2-hill-h", `${hillH}px`);
    field.style.setProperty("--vb2-hill-w", `${Math.ceil(hillH * 10 + 4)}px`);

    if (!state.birdX || state.birdX > width){
      state.birdX = state.layout.birdX;
    } else {
      state.birdX = state.layout.birdX;
    }

    if (!state.birdY){
      state.birdY = playTop + playH * 0.48;
    }

    state.birdY = clamp(state.birdY, playTop, groundY - state.layout.birdRadius);
  }

  function resetBird(){
    if (!state.layout) return;
    state.birdX = state.layout.birdX;
    state.birdY = state.layout.playTop + (state.layout.playBottom - state.layout.playTop) * 0.48;
    state.birdVY = 0;
    state.birdAngle = 0;
  }

  function startLoop(){
    stopLoop();
    state.running = true;
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(tick);
  }

  function stopLoop(){
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    state.running = false;
  }

  function tick(ts){
    if (!state.running){
      state.rafId = 0;
      return;
    }

    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.033, Math.max(0, (ts - state.lastTs) / 1000));
    state.lastTs = ts;

    if (!state.paused){
      update(dt, ts);
    }

    render(ts);
    state.rafId = requestAnimationFrame(tick);
  }

  function update(dt, ts){
    if (!state.layout) return;

    updateWorldScroll(dt);
    updateBackgroundClouds(dt);
    updatePoofs(dt);

    if (state.phase === "intro"){
      updateBird(dt, false);
      if (ts - state.introStartedAt > 5200){
        enterVersePhase();
      }
      return;
    }

    if (state.phase === "verse"){
      updateBird(dt, false);
      updateVerseCloud(dt, ts);
      updateObstacles(dt, ts);
      return;
    }

    if (state.phase === "bonusIntro"){
      return;
    }

    if (state.phase === "bonus"){
      updateBird(dt, true);
      updateBonusPipes(dt, ts);
      return;
    }

    if (state.phase === "bonusCrash"){
      updateCrash(dt, ts);
    }
  }

  function updateWorldScroll(dt){
    const speed = getActiveWorldSpeed();
    state.worldX -= speed * dt;
    state.cloudBgX -= speed * dt;
  }

  function updateBird(dt, bonusMode){
    const layout = state.layout;
    const difficulty = getDifficulty();
    state.birdVY += difficulty.gravityU * layout.unit * dt;
    state.birdY += state.birdVY * dt;

    if (state.birdY < layout.playTop){
      state.birdY = layout.playTop;
      state.birdVY = Math.max(0, state.birdVY * 0.25);
    }

    const floorY = layout.groundY - layout.birdRadius;
    if (state.birdY > floorY){
      state.birdY = floorY;
      if (bonusMode){
        enterBonusCrashPhase();
      } else {
        state.birdVY = Math.min(0, state.birdVY) * -0.12;
      }
    }
    state.birdAngle = clamp(state.birdVY / (layout.unit * 0.13), -24, 56);
  }

  function updateCrash(dt, ts){
    const layout = state.layout;
    state.birdVY += layout.unit * 16.5 * dt;
    state.birdY += state.birdVY * dt;

    for (const pipe of state.bonusPipes){
      pipe.x -= getBonusSpeed() * dt;
    }
    state.bonusPipes = state.bonusPipes.filter(pipe => pipe.x > layout.pipeOffscreenX);

    if (state.birdY > layout.height + layout.unit * 1.6 || ts - state.crashStartedAt > 1700){
      showBonusResult();
    }
  }

  function updateBackgroundClouds(dt) {
    if (!state.layout) return;

    state.bgCloudCooldown -= dt;
    if (state.bgCloudCooldown <= 0) {
      spawnBackgroundCloud();
      state.bgCloudCooldown = 2.8 + Math.random() * 3.2;
    }

    const baseSpeed = getActiveWorldSpeed();
    for (const cloud of state.bgClouds) {
      cloud.x -= baseSpeed * cloud.speedMult * dt;
      cloud.age += dt;
    }

    state.bgClouds = state.bgClouds.filter(cloud => {
      return cloud.x > -cloud.w * 0.75 && cloud.age < 30;
    });
  }

  function spawnBackgroundCloud() {
    const layout = state.layout;
    if (!layout) return;

    const keys = ["compact", "normal"];
    const shapeKey = keys[Math.floor(Math.random() * keys.length)];
    const shape = CLOUD_SHAPES[shapeKey];
    const heightU = getBackgroundCloudHeightU();
    const h = layout.unit * heightU;
    const w = h * shape.aspect;
    const minY = layout.playTop + layout.unit * 0.25;
    const maxY = Math.max(minY, layout.groundY - layout.hillH * 0.62);
    const y = minY + Math.random() * (maxY - minY);
    const opacity = heightU >= 1.55
      ? 0.07 + Math.random() * 0.08
      : 0.11 + Math.random() * 0.13;

    state.bgClouds.push({
      id: state.nextBgCloudId++,
      shapeKey,
      x: layout.width + w * 0.75,
      y,
      w,
      h,
      opacity,
      speedMult: 0.22 + Math.random() * 0.18,
      age: 0
    });
  }

  function getBackgroundCloudHeightU() {
    const roll = Math.random();

    if (roll < 0.70) {
      return 0.65 + Math.random() * 0.50;
    }

    if (roll < 0.95) {
      return 1.15 + Math.random() * 0.50;
    }

    return 1.65 + Math.random() * 0.35;
  }

  function updatePoofs(dt){
    for (const poof of state.poofs){
      poof.age += dt;
      poof.x += (poof.vx || 0) * dt;
      poof.x -= getWorldSpeed() * dt * 0.55;
      poof.y += poof.vy * dt;
    }
    state.poofs = state.poofs.filter(poof => poof.age < poof.life);
  }

  function updateVerseCloud(dt, ts){
    const layout = state.layout;

    if (!state.wordCloud){
      state.cloudCooldown = Math.max(0, state.cloudCooldown - dt);
      if (state.cloudCooldown <= 0 && getCurrentPhase() !== "done"){
        spawnVerseCloud();
      }
      return;
    }

    const cloud = state.wordCloud;
    cloud.x -= getWorldSpeed() * dt;

    if (!cloud.collected && circlesOverlap(state.birdX, state.birdY, layout.birdRadius, cloud.x, cloud.y, cloud.hitRadius)){
      if (cloud.correct){
        collectCorrectCloud(cloud, ts);
      } else {
        collectDecoyCloud(cloud, ts);
      }
    }

    if (cloud.x < layout.cloudOffscreenX){
      if (!cloud.collected && cloud.correct){
        missCorrectCloud(ts);
      }
      state.wordCloud = null;
      state.cloudCooldown = 0.18;
    }
  }

  function spawnVerseCloud(){
    const phase = getCurrentPhase();
    if (phase === "done"){
      enterBonusIntroPhase();
      return;
    }

    const correctLabel = getCurrentCorrectLabel();
    const shouldBeCorrect = chooseCorrectOrDecoy();
    const decoys = getDecoysForPhase(phase, correctLabel, 4);
    const label = (shouldBeCorrect || decoys.length === 0)
      ? correctLabel
      : decoys[Math.floor(Math.random() * decoys.length)];

    const shapeKey = getCloudShapeKey(label);
    const shape = CLOUD_SHAPES[shapeKey];
    const layout = state.layout;
    const h = shape.heightU * layout.unit;
    const w = h * shape.aspect;
    const laneIndex = Math.floor(Math.random() * layout.lanes.length);
    const laneY = layout.lanes[laneIndex];
    const hitPadding = getDifficulty().hitPaddingU * layout.unit;

    state.wordCloud = {
      id: state.nextCloudId++,
      label,
      phase,
      correct: label === correctLabel,
      x: layout.cloudSpawnX,
      y: clamp(laneY, layout.playTop + h * 0.52, layout.playBottom - h * 0.28),
      laneIndex,
      w,
      h,
      shapeKey,
      textX: shape.textX,
      textY: shape.textY,
      hitRadius: Math.max(w * 0.34, h * 0.54) + hitPadding,
      collected: false,
      collectAt: 0
    };

    tickObstacleCloudRhythm();
  }

  function getNextObstacleCloudCountdown() {
    const difficulty = getDifficulty();
    const min = difficulty.obstacleCloudMin || 3;
    const max = difficulty.obstacleCloudMax || min;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function tickObstacleCloudRhythm() {
    if (state.phase !== "verse" || !state.layout) return;

    state.obstacleCloudCountdown -= 1;
    if (state.obstacleCloudCountdown > 0) return;

    if (!hasRecentObstacleNearSpawn()) {
      spawnObstacle();
    }

    state.obstacleCloudCountdown = getNextObstacleCloudCountdown();
  }

  function hasRecentObstacleNearSpawn() {
    if (!state.layout) return true;
    const minX = state.layout.width - state.layout.unit * 0.15;
    return state.obstacles.some(obstacle => !obstacle.hit && obstacle.x > minX);
  }

  function spawnObstacle() {
    if (!state.layout) return;

    const difficulty = getDifficulty();
    const type = Math.random() < difficulty.obstacleBeeChance ? "bee" : "boulder";

    if (type === "bee") {
      spawnBeeObstacle();
    } else {
      spawnBoulderObstacle();
    }
  }

  function spawnBoulderObstacle() {
    const layout = state.layout;
    const h = layout.unit;
    const w = h * 1.48;
    const bottomY = layout.groundY + h * 0.135;
    const y = bottomY - h * 0.5;

    state.obstacles.push({
      id: state.nextObstacleId++,
      type: "boulder",
      x: layout.width + layout.unit * 4.0,
      y,
      baseY: y,
      w,
      h,
      hitRadius: h * 0.43,
      age: 0,
      hit: false,
      hitAt: 0
    });
  }

  function spawnBeeObstacle() {
    const layout = state.layout;
    const h = layout.unit;
    const w = h * 1.02;
    const laneIndex = chooseBeeLaneIndex();
    const baseY = layout.lanes[laneIndex];

    state.obstacles.push({
      id: state.nextObstacleId++,
      type: "bee",
      x: layout.width + layout.unit * 4.2,
      y: baseY,
      baseY,
      laneIndex,
      w,
      h,
      hitRadius: h * 0.38,
      age: 0,
      wavePhase: Math.random() * Math.PI * 2,
      trailCooldown: 0,
      hit: false,
      hitAt: 0
    });
  }

  function chooseBeeLaneIndex() {
    const layout = state.layout;
    if (!layout) return 1;

    const lanes = layout.lanes.map((_, index) => index);
    const cloudLaneIndex = state.wordCloud && Number.isFinite(state.wordCloud.laneIndex)
      ? state.wordCloud.laneIndex
      : -1;

    const openLanes = lanes.filter(index => index !== cloudLaneIndex);
    const choices = openLanes.length ? openLanes : lanes;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function updateObstacles(dt, ts) {
    const layout = state.layout;
    if (!layout) return;

    const speed = getWorldSpeed();
    const beeSpeed = speed * 1.5;

    for (const obstacle of state.obstacles) {
      obstacle.age += dt;

      if (obstacle.type === "bee") {
        obstacle.x -= beeSpeed * dt;

        const amplitude = layout.unit * 0.36;
        obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 6.1 + obstacle.wavePhase) * amplitude;
        obstacle.trailCooldown -= dt;

        if (!obstacle.hit && obstacle.trailCooldown <= 0) {
          addBeeTrailDot(obstacle);
          obstacle.trailCooldown = 0.045;
        }
      } else {
        obstacle.x -= speed * dt;
      }

      if (!obstacle.hit && circlesOverlap(state.birdX, state.birdY, layout.birdRadius, obstacle.x, obstacle.y, obstacle.hitRadius)) {
        hitObstacle(obstacle, ts);
      }
    }

    for (const dot of state.beeTrailDots) {
      dot.age += dt;
      dot.x -= speed * dt;
    }

    state.obstacles = state.obstacles.filter(obstacle => {
      if (obstacle.hit && ts - obstacle.hitAt > 270) return false;
      return obstacle.x > -layout.unit * 2.2;
    });

    state.beeTrailDots = state.beeTrailDots.filter(dot => dot.age < dot.life && dot.x > -layout.unit);
  }

  function addBeeTrailDot(bee) {
    if (!state.layout) return;

    state.beeTrailDots.push({
      id: state.nextBeeTrailDotId++,
      x: bee.x + bee.w * 0.28,
      y: bee.y + (Math.random() - 0.5) * state.layout.unit * 0.10,
      size: state.layout.unit * (0.055 + Math.random() * 0.025),
      life: 1.65,
      age: 0
    });
  }

  function hitObstacle(obstacle, ts) {
    obstacle.hit = true;
    obstacle.hitAt = ts;
    state.streak = 0;
    state.birdSpinUntil = ts + 620;
    state.shakeUntil = ts + 260;
    addBurst(obstacle.x, obstacle.y, obstacle.type === "bee" ? 5 : 6);
    flash("rgba(255, 90, 81, 0.25)", 130);
  }

  function chooseCorrectOrDecoy(){
    if (state.forceCorrectNext){
      state.forceCorrectNext = false;
      rememberSpawn(true);
      return true;
    }

    const history = state.spawnHistory.slice(-4);
    const decoyRun = countRun(false);
    const correctRun = countRun(true);

    let decoyChance = 0.28;
    if (decoyRun >= 2) decoyChance = 0;
    else if (correctRun >= 4) decoyChance = 0.62;
    else if (correctRun >= 3) decoyChance = 0.42;
    else if (history.length >= 3 && !history.includes(false)) decoyChance = 0.48;

    const isDecoy = Math.random() < decoyChance;
    const isCorrect = !isDecoy;
    rememberSpawn(isCorrect);
    return isCorrect;
  }

  function rememberSpawn(isCorrect){
    state.spawnHistory.push(isCorrect);
    if (state.spawnHistory.length > 10){
      state.spawnHistory.shift();
    }
  }

  function countRun(value){
    let total = 0;
    for (let i = state.spawnHistory.length - 1; i >= 0; i--){
      if (state.spawnHistory[i] !== value) break;
      total += 1;
    }
    return total;
  }

  function collectCorrectCloud(cloud, ts){
    cloud.collected = true;
    cloud.collectAt = ts;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.progressIndex += 1;
    addBurst(cloud.x, cloud.y, 7);
    flash("rgba(120, 220, 190, 0.25)", 110);
    updateBuildText();

    setTimeout(() => {
      if (state.wordCloud && state.wordCloud.id === cloud.id){
        state.wordCloud = null;
        state.cloudCooldown = getDifficulty().cloudGapU / Math.max(1, getDifficulty().worldSpeedU);
        if (getCurrentPhase() === "done"){
          enterBonusIntroPhase();
        }
      }
    }, 220);
  }

  function collectDecoyCloud(cloud, ts){
    cloud.collected = true;
    cloud.collectAt = ts;
    state.streak = 0;
    state.birdSpinUntil = ts + 620;
    state.shakeUntil = ts + 260;
    addBurst(cloud.x, cloud.y, 5);
    flash("rgba(255, 90, 81, 0.25)", 130);

    setTimeout(() => {
      if (state.wordCloud && state.wordCloud.id === cloud.id){
        state.wordCloud = null;
        state.cloudCooldown = 0.24;
      }
    }, 230);
  }

  function missCorrectCloud(ts){
    if (selectedMode !== "easy"){
      state.streak = 0;
      state.shakeUntil = ts + 220;
      flash("rgba(255, 199, 81, 0.24)", 120);
    }
    state.forceCorrectNext = true;
  }

  function updateBonusPipes(dt, ts){
    const layout = state.layout;
    state.bonusElapsed = Math.max(0, (ts - state.bonusStartedAt) / 1000);

    state.pipeCooldown -= dt;
    if (state.pipeCooldown <= 0){
      spawnPipePair();
      state.pipeCooldown = getPipeSpacingSeconds();
    }

    const speed = getBonusSpeed();
    for (const pipe of state.bonusPipes){
      pipe.x -= speed * dt;
      if (!pipe.passed && pipe.x + layout.pipeW * 0.5 < state.birdX){
        pipe.passed = true;
        state.pipesCleared += 1;
      }
    }

    state.bonusPipes = state.bonusPipes.filter(pipe => pipe.x > layout.pipeOffscreenX);

    for (const pipe of state.bonusPipes){
      if (pipeHitsBird(pipe)){
        enterBonusCrashPhase();
        break;
      }
    }
  }

  function spawnPipePair(){
    const layout = state.layout;
    const gap = getBonusGap();
    const capOverlap = Math.max(1, layout.unit * 0.035);
    const groundClearance = layout.unit * 0.10;
    const safeTop = layout.playTop + gap * 0.5 + layout.unit * 0.3;
    const safeBottom = layout.groundY - groundClearance - layout.pipeCapH + capOverlap - gap * 0.5;
    const gapY = safeTop >= safeBottom
      ? safeBottom
      : safeTop + Math.random() * (safeBottom - safeTop);

    state.bonusPipes.push({
      id: state.nextPipeId++,
      x: layout.pipeSpawnX,
      gapY,
      gap,
      passed: false
    });
  }

  function pipeHitsBird(pipe){
    const layout = state.layout;
    const birdLeft = state.birdX - layout.birdRadius * 0.78;
    const birdRight = state.birdX + layout.birdRadius * 0.78;
    const birdTop = state.birdY - layout.birdRadius * 0.78;
    const birdBottom = state.birdY + layout.birdRadius * 0.78;

    const pipeLeft = pipe.x - layout.pipeW * 0.5;
    const pipeRight = pipe.x + layout.pipeW * 0.5;
    if (birdRight < pipeLeft || birdLeft > pipeRight) return false;

    const gapTop = pipe.gapY - pipe.gap * 0.5;
    const gapBottom = pipe.gapY + pipe.gap * 0.5;
    return birdTop < gapTop || birdBottom > gapBottom;
  }

  function render(ts){
    renderBackground();
    renderBackgroundClouds();
    renderPoofs();
    renderWordCloud(ts);
    renderObstacles();
    renderPipes();
    renderBird(ts);
    renderIntroLayer(ts);
    renderFlash(ts);
    renderBuildShake(ts);
  }

  function renderHillStrips() {
    const stripA = document.getElementById("vb2HillStripA");
    const stripB = document.getElementById("vb2HillStripB");
    if (!stripA || !stripB || !state.layout) return;

    const hillW = Math.ceil(state.layout.hillH * 10 + 4);
    const overlap = 6;
    const loopW = hillW - overlap;
    const x = ((state.worldX % loopW) + loopW) % loopW - loopW;

    stripA.style.transform = `translateX(${x}px)`;
    stripB.style.transform = `translateX(${x + loopW}px)`;
  }

  function renderBackground(){
    const field = document.getElementById("vb2Field");
    if (!field || !state.layout) return;

    field.style.setProperty("--vb2-ground-x", `${state.worldX}px`);
    field.style.setProperty("--vb2-cloud-x", `${state.cloudBgX}px`);
    renderHillStrips();
  }

  function renderBackgroundClouds() {
    const layer = document.getElementById("vb2BgClouds");
    if (!layer || !state.layout) return;

    layer.innerHTML = state.bgClouds.map(cloud => {
      const shape = CLOUD_SHAPES[cloud.shapeKey];
      return `
        <div class="vb2-bg-cloud"
             style="
               --x:${cloud.x}px;
               --y:${cloud.y}px;
               --w:${cloud.w}px;
               --h:${cloud.h}px;
               --opacity:${cloud.opacity};
               --cloud-img:url('${IMAGE_PATH}${shape.image}');
             ">
        </div>
      `;
    }).join("");
  }

  function renderPoofs(){
    const layer = document.getElementById("vb2Poofs");
    if (!layer || !state.layout) return;

    layer.innerHTML = state.poofs.map(poof => {
      const p = clamp(poof.age / poof.life, 0, 1);
      const size = poof.size * (1 + p * 0.65);
      const opacity = 1 - p;
      return `
        <div class="vb2-poof" style="left:${poof.x}px; top:${poof.y}px; width:${size}px; height:${size}px; opacity:${opacity};"></div>
      `;
    }).join("");
  }

  function renderWordCloud(ts){
    const layer = document.getElementById("vb2WordClouds");
    if (!layer || !state.wordCloud) {
      if (layer) layer.innerHTML = "";
      return;
    }

    const cloud = state.wordCloud;
    const shape = CLOUD_SHAPES[cloud.shapeKey];
    const collectedClass = cloud.collected ? " vb2-collected" : "";
    const correctnessClass = cloud.correct ? " is-correct" : " is-decoy";
    const wordSize = getWordFontSize(cloud);

    layer.innerHTML = `
      <div class="vb2-cloud-token${correctnessClass}${collectedClass}"
           style="
             left:${cloud.x}px;
             top:${cloud.y}px;
             --cloud-w:${cloud.w}px;
             --cloud-h:${cloud.h}px;
             --cloud-img:url('${IMAGE_PATH}${shape.image}');
             --text-x:${cloud.textX}%;
             --text-y:${cloud.textY}%;
             --word-size:${wordSize}px;
           ">
        <div class="vb2-cloud-word">${escapeHtml(cloud.label)}</div>
      </div>
    `;
  }

  function renderObstacles() {
    const layer = document.getElementById("vb2Obstacles");
    if (!layer || !state.layout) return;

    const dotsHtml = state.beeTrailDots.map(dot => {
      const p = clamp(dot.age / dot.life, 0, 1);
      const opacity = 0.50 * (1 - p);
      const size = dot.size * (1 - p * 0.10);
      return `
        <div class="vb2-bee-trail-dot"
             style="
               --x:${dot.x}px;
               --y:${dot.y}px;
               --size:${size}px;
               opacity:${opacity};
             ">
        </div>
      `;
    }).join("");

    const obstacleHtml = state.obstacles.map(obstacle => {
      const hitClass = obstacle.hit ? " is-hit" : "";
      return `
        <div class="vb2-obstacle vb2-obstacle--${obstacle.type}${hitClass}"
             style="
               --x:${obstacle.x}px;
               --y:${obstacle.y}px;
               --w:${obstacle.w}px;
               --h:${obstacle.h}px;
             ">
        </div>
      `;
    }).join("");

    layer.innerHTML = dotsHtml + obstacleHtml;
  }

  function renderPipes(){
    const layer = document.getElementById("vb2Pipes");
    if (!layer || !state.layout) return;

    const layout = state.layout;
    const capH = layout.pipeCapH;
    const pieces = [];

    for (const pipe of state.bonusPipes){
      const gapTop = pipe.gapY - pipe.gap * 0.5;
      const gapBottom = pipe.gapY + pipe.gap * 0.5;
      const topPieceH = Math.max(layout.pipeMinH, gapTop + 2);
      const bottomPieceTop = gapBottom - 2;
      const bottomPieceH = Math.max(layout.pipeMinH, layout.groundY - bottomPieceTop + 4);
      const capOverlap = Math.max(1, layout.unit * 0.035);

      pieces.push(`
        <div class="vb2-pipe-piece" style="--x:${pipe.x}px; --pipe-w:${layout.pipeW}px; top:0px; height:${topPieceH}px;"></div>
        <div class="vb2-pipe-cap vb2-pipe-cap--top" style="--x:${pipe.x}px; --pipe-w:${layout.pipeW}px; top:${gapTop - capH + capOverlap}px; height:${capH}px;"></div>
        <div class="vb2-pipe-piece" style="--x:${pipe.x}px; --pipe-w:${layout.pipeW}px; top:${bottomPieceTop}px; height:${bottomPieceH}px;"></div>
        <div class="vb2-pipe-cap vb2-pipe-cap--bottom" style="--x:${pipe.x}px; --pipe-w:${layout.pipeW}px; top:${gapBottom - capOverlap}px; height:${capH}px;"></div>
      `);
    }

    layer.innerHTML = pieces.join("");
  }

  function renderBird(ts){
    const bird = document.getElementById("vb2Bird");
    if (!bird || !state.layout) return;

    bird.classList.toggle("is-hidden", state.birdHidden);
    bird.classList.toggle("is-flapping", ts < state.birdFlapUntil);
    bird.style.setProperty("--bird-w", `${state.layout.birdW}px`);
    bird.style.setProperty("--bird-h", `${state.layout.birdH}px`);
    bird.style.left = `${state.birdX}px`;
    bird.style.top = `${state.birdY}px`;

    let angle = state.birdAngle;
    if (ts < state.birdSpinUntil){
      angle = ((ts / 1000) * 880) % 360;
    }

    if (state.phase === "bonusCrash"){
      angle = ((ts - state.crashStartedAt) / 1000) * 720;
    }

    bird.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }

  function renderIntroLayer(ts){
    const layer = document.getElementById("vb2IntroLayer");
    if (!layer || !state.layout) return;

    if (state.phase === "intro"){
      const elapsed = (ts - state.introStartedAt) / 1000;
      layer.innerHTML = INTRO_WORDS.map((word, index) => renderFlyingIntroWord(word, index, elapsed)).join("");
      return;
    }

    if (state.phase === "bonusIntro"){
      layer.innerHTML = `
        <div class="vb2-bonus-ready">
          <div class="vb2-bonus-ready-title">DON’T HIT THE PIPES.</div><br>
          <div class="vb2-bonus-ready-subtitle">Tap to start bonus flight</div>
        </div>
      `;
      return;
    }

    layer.innerHTML = "";
  }

  function renderFlyingIntroWord(word, index, elapsed){
    const layout = state.layout;
    const t = elapsed - word.delay;
    const travel = 3.0;
    const startX = layout.width + layout.unit * (2.1 + index * 0.18);
    const endX = -layout.unit * 2.0;
    const progress = clamp(t / travel, 0, 1);
    const x = startX + (endX - startX) * progress;
    const baseY = word.line === 0
      ? layout.playTop + (layout.playBottom - layout.playTop) * 0.32
      : layout.playTop + (layout.playBottom - layout.playTop) * 0.60;
    const y = baseY + Math.sin((t * 5.4) + index) * layout.unit * 0.18;
    const tilt = Math.sin((t * 4.2) + index) * 5;
    const opacity = t < 0 || t > travel ? 0 : 1;
    const size = clamp(layout.unit * 0.42, 18, 34);

    return `
      <div class="vb2-flying-word" style="--x:${x}px; --y:${y}px; --tilt:${tilt}deg; --size:${size}px; opacity:${opacity};">
        ${escapeHtml(word.text)}
      </div>
    `;
  }

  function renderFlash(ts){
    const flash = document.getElementById("vb2Flash");
    if (!flash) return;

    if (ts <= state.flashUntil){
      flash.classList.add("is-on");
      flash.style.background = state.flashColor;
    } else {
      flash.classList.remove("is-on");
    }
  }

  function renderBuildShake(ts){
    const build = document.getElementById("vb2Build");
    if (!build) return;

    if (ts <= state.shakeUntil){
      build.classList.add("vb2-shake");
    } else {
      build.classList.remove("vb2-shake");
    }
  }

  function getWordFontSize(cloud){
    const len = String(cloud.label || "").length;
    const base = cloud.h * 0.32;
    if (len <= 4) return clamp(base * 1.10, 18, 34);
    if (len <= 9) return clamp(base * 0.94, 17, 31);
    return clamp(base * 0.76, 15, 27);
  }

  function addFlapTrail(){
    if (!state.layout) return;

    const unit = state.layout.unit;
    const exhaustAngleDeg = -45;
    const exhaustAngleRad = exhaustAngleDeg * Math.PI / 180;
    const dirX = Math.sin(exhaustAngleRad);
    const dirY = Math.cos(exhaustAngleRad);

    const baseX = state.birdX;
    const baseY = state.birdY + unit * 0.18;

    const puffs = [
      { distanceU: 0.14, sizeU: 0.16, life: 0.24, speedU: 0.55 },
      { distanceU: 0.42, sizeU: 0.27, life: 0.32, speedU: 0.40 },
      { distanceU: 0.74, sizeU: 0.40, life: 0.40, speedU: 0.25 }
    ];

    for (const puff of puffs){
      addPoof(
        baseX + dirX * puff.distanceU * unit,
        baseY + dirY * puff.distanceU * unit,
        puff.sizeU,
        puff.life,
        dirX * puff.speedU * unit,
        dirY * puff.speedU * unit
      );
    }
  }

  function addPoof(x, y, sizeU, life, vx = 0, vy = null){
    if (!state.layout) return;
    state.poofs.push({
      id: Math.random().toString(36).slice(2),
      x,
      y,
      size: sizeU * state.layout.unit,
      vx,
      vy: vy === null ? (Math.random() - 0.5) * state.layout.unit * 0.25 : vy,
      life,
      age: 0
    });
  }

  function addBurst(x, y, count){
    if (!state.layout) return;
    for (let i = 0; i < count; i++){
      state.poofs.push({
        id: Math.random().toString(36).slice(2),
        x: x + (Math.random() - 0.5) * state.layout.unit * 0.7,
        y: y + (Math.random() - 0.5) * state.layout.unit * 0.45,
        size: state.layout.unit * (0.16 + Math.random() * 0.20),
        vy: (Math.random() - 0.65) * state.layout.unit * 0.8,
        life: 0.24 + Math.random() * 0.16,
        age: 0
      });
    }
  }

  function flash(color, ms){
    state.flashColor = color;
    state.flashUntil = performance.now() + ms;
  }

  async function preloadBirdSvg(){
    try{
      const response = await fetch(`${IMAGE_PATH}versey_bird_bird.svg`, { cache: "force-cache" });
      if (!response.ok) throw new Error(`Bird SVG request failed: ${response.status}`);
      birdSvgText = await response.text();
      renderBirdAsset();
    }catch(err){
      console.warn("Could not inline bird SVG. Falling back to image.", err);
      birdSvgText = "";
      renderBirdAsset();
    }
  }

  function renderBirdAsset(){
    const bird = document.getElementById("vb2Bird");
    if (!bird) return;

    if (birdSvgText){
      bird.innerHTML = birdSvgText;
      prepareWingAnimator(bird);
      recolorBirdSvg(bird);
    } else {
      bird.innerHTML = `<img src="${IMAGE_PATH}versey_bird_bird.svg" alt="">`;
    }
  }

  function prepareWingAnimator(root) {
    const wingGroup = root.querySelector("#bird_wing_group");
    if (!wingGroup || wingGroup.parentNode?.id === "vb2_wing_animator") return;

    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrapper.setAttribute("id", "vb2_wing_animator");

    wingGroup.parentNode.insertBefore(wrapper, wingGroup);
    wrapper.appendChild(wingGroup);
  }

  function recolorBirdSvg(root){
    const body = root.querySelector("#bird_body");
    const wing = root.querySelector("#bird_wing");
    const tail = root.querySelector("#bird_tail");

    applySvgFill(body, state.birdColor.primary);
    applySvgFill(wing, state.birdColor.secondary);
    applySvgFill(tail, state.birdColor.secondary);
  }

  function applySvgFill(el, color){
    if (!el) return;

    el.style.fill = color;
    el.setAttribute("fill", color);

    const children = el.querySelectorAll("path, polygon, circle, ellipse, rect");
    for (const child of children){
      child.style.fill = color;
      child.setAttribute("fill", color);
    }
  }

  async function finishRun(){
    if (completed) return;
    completed = true;

    try{
      completionResult = await window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode,
        stats: {
          streak: state.bestStreak,
          finalStreak: state.streak,
          progressIndex: state.progressIndex,
          pipesCleared: state.pipesCleared
        }
      });
    }catch(err){
      console.error("completeGameRun failed", err);
      completionResult = {
        ok: false,
        alreadyCompleted: false,
        newlyCompleted: false,
        reward: {
          ok: false,
          petUnlockTriggered: false
        }
      };
    }

    renderComplete();
  }

  function updateBuildText(){
    const el = document.getElementById("vb2BuildText");
    if (!el) return;

    const buildRender = window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.bookLabel,
      reference: state.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: selectedMode === "hard",
      extraClass: "vb2-build-text"
    });

    el.className = buildRender.className;
    el.innerHTML = buildRender.html;
    fitBuildText();
  }

  function fitBuildText(){
    if (state.buildFitDone) return;

    requestAnimationFrame(() => {
      const build = document.getElementById("vb2Build");
      const text = document.getElementById("vb2BuildText");
      if (!build || !text) return;

      const result = window.VerseGameShell.fitBuildTextOnce({
        buildEl: build,
        textEl: text,
        buildArea: BUILD_AREA
      });

      if (result){
        state.buildFitDone = true;
      }
    });
  }

  function setupReferenceSegments(){
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: parsed.book,
      reference: parsed.reference,
      buildArea: BUILD_AREA
    });

    state.referenceMeta = parsed;
    state.words = buildData.words;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.buildSizeClass = buildData.buildSizeClass;
    state.segments = buildData.segments;
  }

  function getCurrentPhase(){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function getCurrentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = new Set();

    if (phase === "words"){
      const correctNorm = normalizeWord(correctLabel);

      if (selectedMode === "easy"){
        for (const word of window.VerseGameShell.getFunWordDecoys(correctLabel, state.words, count)){
          if (out.size >= count) break;
          if (normalizeWord(word) !== correctNorm) out.add(word);
        }
      } else {
        const verseDecoys = window.VerseGameShell.getVerseWordDecoys({
          words: state.words,
          correct: correctLabel,
          targetIndex: state.progressIndex,
          count,
          avoidNext: 2,
          fallbackToFun: true
        });

        for (const word of verseDecoys){
          if (out.size >= count) break;
          const norm = normalizeWord(word);
          if (!norm || norm === correctNorm) continue;
          out.add(word);
        }
      }
    }

    if (phase === "book"){
      for (const book of window.VerseGameShell.getBookDecoys(correctLabel, count)){
        if (out.size >= count) break;
        out.add(book);
      }
    }

    if (phase === "reference"){
      for (const ref of window.VerseGameShell.getReferenceDecoys(state.referenceMeta, selectedMode, count + 4)){
        if (out.size >= count) break;
        if (normalizeWord(ref) !== normalizeWord(correctLabel)) out.add(ref);
      }
    }

    return Array.from(out).slice(0, count);
  }

  function getCloudShapeKey(label){
    const len = String(label || "").length;
    if (len <= 4) return "compact";
    if (len <= 9) return "normal";
    return "long";
  }

  function getDifficulty(){
    return DIFFICULTY[selectedMode] || DIFFICULTY.medium;
  }

  function getWorldSpeed(){
    return getDifficulty().worldSpeedU * state.layout.unit;
  }

  function getActiveWorldSpeed(){
    if (state.phase === "bonus" || state.phase === "bonusCrash"){
      return getBonusSpeed();
    }

    return getWorldSpeed();
  }

  function getBonusSpeed(){
    const d = getDifficulty();
    const speedU = d.bonusStartSpeedU + state.bonusElapsed * d.bonusRampU;
    return speedU * state.layout.unit;
  }

  function getBonusGap(){
    const d = getDifficulty();
    const shrink = state.bonusElapsed * 0.040 * state.layout.unit;
    return Math.max(d.bonusMinGapU * state.layout.unit, d.bonusStartGapU * state.layout.unit - shrink);
  }

  function getPipeSpacingSeconds(){
    const d = getDifficulty();
    const spacingPx = d.bonusPipeEveryU * state.layout.unit;
    return spacingPx / Math.max(1, getBonusSpeed());
  }

  function circlesOverlap(x1, y1, r1, x2, y2, r2){
    const dx = x1 - x2;
    const dy = y1 - y2;
    const r = r1 + r2;
    return (dx * dx + dy * dy) <= (r * r);
  }

  function tokenizeVerse(text){
    return window.VerseGameShell.tokenizeVerseWords(text);
  }

  function normalizeWord(value){
    return window.VerseGameShell.normalizeWord(value);
  }

  function parseReferenceParts(ref, translation, verseId){
    return window.VerseGameShell.parseReferenceParts(ref, translation, verseId);
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max){
    if (window.VerseGameShell && window.VerseGameShell.clamp){
      return window.VerseGameShell.clamp(value, min, max);
    }
    return Math.min(max, Math.max(min, value));
  }
})();
