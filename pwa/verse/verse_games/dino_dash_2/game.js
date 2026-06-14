(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "dino_dash";
  const GAME_TITLE = "Dino Dash";
  const GAME_THEME = { bg: "#333333", accent: "#333333" };
  const BUILD_AREA = "large";
  const HELP_OVERLAY_ID = "dd2HelpOverlay";
  const MENU_OVERLAY_ID = "dd2GameMenuOverlay";
  const IMAGE_PATH = "./dino_dash_images/";
  const DINO_IMAGE_CANDIDATES = ["dino_dash_dinosaur.svg", "dino_dash_dinosuar.svg"];

  const TARGET_FIELD_UNITS_WIDE = 4.35;
  const MIN_UNIT = 76;
  const MAX_UNIT = 184;
  const MAX_UNIT_BY_HEIGHT = 0.33;

  const FLYING_WORD_TRAVEL_SECONDS = 3.0;
  const FLYING_MESSAGE_GRACE_SECONDS = 0.25;
  const TABLET_HEIGHT_U = 0.52;
  const FLAG_FINISH_SECONDS = 30;
  const FLAG_CLEAR_RUNWAY_SECONDS = 1.55;

  const DINO_COLORS = [
    { name: "yellow", primary: "#ffc751", secondary: "#a68235" },
    { name: "red", primary: "#ff5a51", secondary: "#a63b35" },
    { name: "green", primary: "#a7cb6f", secondary: "#6d8448" },
    { name: "purple", primary: "#7f66c6", secondary: "#534281" },
    { name: "black", primary: "#4d4d4d", secondary: "#333333" },
    { name: "orange", primary: "#ffa351", secondary: "#a66a35" },
    { name: "pink", primary: "#ff948e", secondary: "#a6605c" },
    { name: "teal", primary: "#1ea8aa", secondary: "#146d6f" }
  ];

  const DINO_PRIMARY_PART_IDS = [
    "body",
    "front_arm",
    "back_arm",
    "front_thigh",
    "rear_thigh"
  ];

  const DINO_SECONDARY_PART_IDS = ["spine"];

  const INTRO_WORDS = [
    { text: "TAP", line: 0, delay: 0.15 },
    { text: "TO", line: 0, delay: 0.55 },
    { text: "JUMP", line: 0, delay: 0.95 },
    { text: "COLLECT", line: 1, delay: 2.05 },
    { text: "THE", line: 1, delay: 2.45 },
    { text: "CORRECT", line: 1, delay: 2.85 },
    { text: "WORDS", line: 1, delay: 3.35 }
  ];

  const BONUS_WORDS = [
    { text: "BONUS", line: 0, delay: 0.15 },
    { text: "ROUND", line: 0, delay: 0.65 },
    { text: "SEE", line: 1, delay: 1.45 },
    { text: "HOW", line: 1, delay: 1.85 },
    { text: "LONG", line: 1, delay: 2.25 },
    { text: "YOU", line: 1, delay: 2.65 },
    { text: "CAN", line: 1, delay: 3.05 },
    { text: "LAST", line: 1, delay: 3.45 }
  ];

  const DIFFICULTY = {
    easy: {
      worldSpeedU: 2.05,
      gravityU: 15.5,
      jumpU: -6.85,
      doubleJumpU: -6.65,
      patternGapU: 3.10,
      bonusMinPatternSeconds: 1.25,
      bonusStartSpeedU: 2.25,
      bonusRampU: 0.095,
      obstacleChance: 0.36,
      pairedChance: 0.24,
      topWordChance: 0.18,
      streakSpeedBoostsU: [0, 0.06, 0.13, 0.20, 0.28],
      streakSpeedEaseU: 1.0
    },
    medium: {
      worldSpeedU: 2.32,
      gravityU: 16.5,
      jumpU: -7.10,
      doubleJumpU: -6.90,
      patternGapU: 2.78,
      bonusMinPatternSeconds: 1.18,
      bonusStartSpeedU: 2.50,
      bonusRampU: 0.125,
      obstacleChance: 0.45,
      pairedChance: 0.32,
      topWordChance: 0.30,
      streakSpeedBoostsU: [0, 0.10, 0.21, 0.32, 0.44],
      streakSpeedEaseU: 1.35
    },
    hard: {
      worldSpeedU: 2.62,
      gravityU: 17.5,
      jumpU: -7.35,
      doubleJumpU: -7.15,
      patternGapU: 2.48,
      bonusMinPatternSeconds: 1.10,
      bonusStartSpeedU: 2.82,
      bonusRampU: 0.155,
      obstacleChance: 0.54,
      pairedChance: 0.40,
      topWordChance: 0.42,
      streakSpeedBoostsU: [0, 0.14, 0.29, 0.43, 0.58],
      streakSpeedEaseU: 1.7
    }
  };

  const TABLET_SHAPES = {
    compact: {
      image: "dino_dash_tablet_compact.png",
      aspect: 560 / 211,
      textWidth: 0.76,
      textX: 50,
      textY: 52
    },
    normal: {
      image: "dino_dash_tablet_normal.png",
      aspect: 895 / 294,
      textWidth: 0.80,
      textX: 50,
      textY: 51
    },
    long: {
      image: "dino_dash_tablet_long.png",
      aspect: 1147 / 296,
      textWidth: 0.83,
      textX: 50,
      textY: 51
    }
  };

  const GROUND_OBSTACLES = [
    { key: "bones", image: "dino_dash_bones.png", heightU: 0.68, offsetRatio: 0.276, hitW: 0.72, hitH: 0.48 },
    { key: "crate", image: "dino_dash_crate.png", heightU: 0.83, offsetRatio: 0.040, hitW: 0.70, hitH: 0.70 },
    { key: "cactus", image: "dino_dash_cactus.png", heightU: 1.05, offsetRatio: 0.103, hitW: 0.62, hitH: 0.76 },
    { key: "boulder", image: "dino_dash_boulder.png", heightU: 0.67, offsetRatio: 0.128, hitW: 0.72, hitH: 0.58 },
    { key: "stump", image: "dino_dash_stump.png", heightU: 0.66, offsetRatio: 0.207, hitW: 0.72, hitH: 0.58 }
  ];

  const AIR_OBSTACLES = [
    { key: "bee", image: "dino_dash_bee.svg", heightU: 0.54, speedMult: 1.18 },
    { key: "bird", image: "dino_dash_bird.svg", heightU: 0.60, speedMult: 1.25 }
  ];

  const PARTICLE_COLORS = {
    rainbow: ["#ff5a51", "#ff9f43", "#ffc751", "#7ed957", "#38bdf8", "#7f66c6", "#ff7ab6"],
    white: ["rgba(255,255,255,0.96)", "rgba(245,252,255,0.92)"],
    brown: ["#8a5a32", "#a86f3d", "#c58a4a", "#6f4728"],
    green: ["#4ade80", "#22c55e", "#86efac", "#16a34a"]
  };

  const FUN_DECOYS = [
    "banana", "pickle", "rocket", "pencil", "donut", "giggle", "bubble", "taco", "purple", "window",
    "cloud", "cookie", "dragon", "zebra", "button", "marble", "waffle", "jelly", "sunshine", "silly"
  ];

  let selectedMode = null;
  let completed = false;
  let completionResult = null;
  let muted = false;
  let dinoSvgText = "";

  const referenceParts = window.VerseGameShell.parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
  const buildData = window.VerseGameShell.buildVerseSegments({
    verseText: ctx.verseText || "",
    book: referenceParts.book,
    reference: referenceParts.reference,
    buildArea: BUILD_AREA
  });

  const state = {
    running: false,
    phase: "title",
    rafId: 0,
    paused: false,
    pauseReason: "",
    resizeHandler: null,
    field: null,
    layout: null,
    lastTs: 0,
    lastInputAt: 0,
    pausedRenderTs: 0,
    phaseStartedAt: 0,
    introStartedAt: 0,
    bonusStartedAt: 0,
    dinoColor: DINO_COLORS[0],
    dinoColorIndex: 0,
    dinoX: 0,
    dinoY: 0,
    dinoVY: 0,
    dinoAngle: 0,
    dinoHidden: false,
    dinoSpinUntil: 0,
    jumpsUsed: 0,
    landingSquashUntil: 0,
    worldX: 0,
    hillX: 0,
    backHillX: 0,
    nextItemId: 1,
    tablets: [],
    obstacles: [],
    particles: [],
    dust: [],
    trailDots: [],
    trailSparkles: [],
    nextParticleId: 1,
    nextTrailId: 1,
    spawnCooldown: 0,
    spawnPause: 0,
    fallStartedAt: 0,
    respawnAt: 0,
    bonusFinishTriggered: false,
    bonusFlagAt: 0,
    bonusFlagSpawned: false,
    bonusFinished: false,
    feet: 0,
    bonusDistanceU: 0,
    streakSpeedBoostU: 0,
    trailCooldown: 0,
    sparkleCooldown: 0,
    buildFitDone: false,
    progressIndex: 0,
    streak: 0,
    bestStreak: 0,
    verseWords: buildData.words || [],
    bookLabel: buildData.bookLabel,
    referenceLabel: buildData.referenceLabel,
    buildSegments: buildData.segments || [],
    buildSizeClass: buildData.buildSizeClass || "is-normal",
    spawnHistory: [],
    forceCorrectNext: false,
    flashUntil: 0,
    flashColor: "rgba(255,255,255,0.25)",
    shakeUntil: 0,
    resultShown: false
  };

  renderIntro();
  preloadDinoSvg();

  function introHelpHtml(){
    return `
      Tap, click, or press Space to jump.<br><br>
      Tap again while airborne to double jump.<br><br>
      Collect the correct stone tablets and avoid decoys, obstacles, flying enemies, and gaps.
    `;
  }

  function modeHelpHtml(){
    return `
      Easy: gentler speed and easier decoys.<br><br>
      Medium: balanced speed with trickier decoys.<br><br>
      Hard: faster running with the toughest decoys.
    `;
  }

  function gameHelpHtml(){
    return `
      Tap, click, or press Space to jump. Tap again in the air to double jump.<br><br>
      Collect the next correct word tablet. Avoid decoy tablets, obstacles, flying enemies, and ground gaps.<br><br>
      Missing a correct word resets your streak in Medium and Hard only.
    `;
  }

  function renderIntro(){
    stopLoop();
    cleanupResize();
    state.phase = "title";

    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: "🦖",
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
      backLabel: "Back to Dino Dash title",
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
      <div class="dd2-root">
        <div class="dd2-stage">
          <div class="dd2-build-wrap">
            <div class="dd2-build vm-build vm-build--${BUILD_AREA}" id="dd2Build">
              <div class="dd2-build-text vm-build-text" id="dd2BuildText"></div>
            </div>
          </div>

          <div class="dd2-field-wrap">
            <div class="dd2-field" id="dd2Field">
              <div class="dd2-back-hills" id="dd2BackHills">
                <div class="dd2-back-hill-strip" id="dd2BackHillA"></div>
                <div class="dd2-back-hill-strip" id="dd2BackHillB"></div>
              </div>
              <div class="dd2-hills" id="dd2Hills">
                <div class="dd2-hill-strip" id="dd2HillA"></div>
                <div class="dd2-hill-strip" id="dd2HillB"></div>
              </div>
              <div class="dd2-ground" id="dd2Ground"></div>
              <button class="dd2-menu-pill" id="dd2MenuPill" aria-label="Game Menu">☰</button>
              <div class="dd2-trail-layer" id="dd2TrailLayer"></div>
              <div class="dd2-particles" id="dd2Particles"></div>
              <div class="dd2-tablets" id="dd2Tablets"></div>
              <div class="dd2-obstacles" id="dd2Obstacles"></div>
              <div class="dd2-dino-layer"><div class="dd2-dino" id="dd2Dino"></div></div>
              <div class="dd2-intro-layer" id="dd2IntroLayer"></div>
              <div class="dd2-flash" id="dd2Flash"></div>
              <div class="dd2-result-layer" id="dd2ResultLayer" hidden></div>
            </div>
          </div>
        </div>

        ${renderHelpOverlay(gameHelpHtml())}
        ${renderGameMenuOverlay()}
      </div>
    `;

    state.field = document.getElementById("dd2Field");
    wireCommonNav();
    wireGameInput();
    updateBuildText();
    installResize();
    recalcLayout();
    renderDinoAsset();
    enterIntroPhase();
    startLoop();
  }

  function resetStateForRun(){
    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.phase = "intro";
    state.lastTs = 0;
    state.pausedRenderTs = 0;
    state.phaseStartedAt = 0;
    state.introStartedAt = 0;
    state.bonusStartedAt = 0;
    state.layout = null;
    state.dinoColorIndex = Math.floor(Math.random() * DINO_COLORS.length);
    state.dinoColor = DINO_COLORS[state.dinoColorIndex];
    state.dinoVY = 0;
    state.dinoAngle = 0;
    state.dinoHidden = false;
    state.dinoSpinUntil = 0;
    state.jumpsUsed = 0;
    state.landingSquashUntil = 0;
    state.worldX = 0;
    state.hillX = 0;
    state.backHillX = 0;
    state.nextItemId = 1;
    state.tablets = [];
    state.obstacles = [];
    state.particles = [];
    state.dust = [];
    state.trailDots = [];
    state.trailSparkles = [];
    state.nextParticleId = 1;
    state.nextTrailId = 1;
    state.spawnCooldown = 0.4;
    state.spawnPause = 0;
    state.fallStartedAt = 0;
    state.respawnAt = 0;
    state.bonusFinishTriggered = false;
    state.bonusFlagAt = 0;
    state.bonusFlagSpawned = false;
    state.bonusFinished = false;
    state.feet = 0;
    state.bonusDistanceU = 0;
    state.streakSpeedBoostU = 0;
    state.trailCooldown = 0;
    state.sparkleCooldown = 0;
    state.buildFitDone = false;
    state.progressIndex = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.spawnHistory = [];
    state.forceCorrectNext = false;
    state.flashUntil = 0;
    state.flashColor = "rgba(255,255,255,0.25)";
    state.shakeUntil = 0;
    state.resultShown = false;
  }

  function enterIntroPhase(){
    state.phase = "intro";
    state.phaseStartedAt = performance.now();
    state.introStartedAt = state.phaseStartedAt;
    clearMovingItems();
    resetDino();
  }

  function enterVersePhase(){
    state.phase = "verse";
    state.phaseStartedAt = performance.now();
    clearMovingItems();
    state.spawnCooldown = 0.35;
    state.spawnPause = 0;
  }

  function enterBonusIntroPhase(){
    state.phase = "bonusIntro";
    state.phaseStartedAt = performance.now();
    clearMovingItems();
    state.spawnCooldown = 0.35;
    state.bonusDistanceU = 0;
    state.feet = 0;
    state.bonusFinishTriggered = false;
    state.bonusFlagAt = 0;
    state.bonusFlagSpawned = false;
    state.bonusFinished = false;
    updateBuildText();
  }

  function enterBonusPhase(){
    state.phase = "bonus";
    state.phaseStartedAt = performance.now();
    state.bonusStartedAt = state.phaseStartedAt;
    clearMovingItems();
    state.spawnCooldown = 0.35;
    state.bonusDistanceU = 0;
    state.feet = 0;
    state.bonusFinishTriggered = false;
    state.bonusFlagAt = 0;
    state.bonusFlagSpawned = false;
    state.bonusFinished = false;
    updateBuildText();
  }

  function enterFallPhase(){
    if (state.phase === "fall" || !state.layout) return;
    state.phase = "fall";
    state.fallStartedAt = performance.now();
    state.respawnAt = state.fallStartedAt + 1050;
    state.spawnPause = 1.1;
    state.dinoVY = state.layout.unit * 1.2;
    state.dinoSpinUntil = state.respawnAt;
    state.streak = 0;
    clearTrail();
    flash("rgba(255, 90, 81, 0.24)", 140);
  }

  function finishBonus(){
    if (state.bonusFinished) return;
    state.bonusFinished = true;
    state.phase = "bonusResult";
    state.running = false;
    stopLoop();
    showBonusResult();
  }

  function clearMovingItems(){
    state.tablets = [];
    state.obstacles = [];
    state.particles = [];
    state.dust = [];
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
      menuButtonId: "dd2MenuPill",
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
    if (overlay) overlay.removeAttribute("hidden");
  }

  function setPaused(paused, reason = ""){
    if (!state.running && state.phase !== "bonusIntro") return;
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused) state.lastTs = 0;
  }

  function wireGameInput(){
    const field = document.getElementById("dd2Field");
    if (!field) return;

    field.addEventListener("pointerdown", event => {
      if (event.target && event.target.closest("button")) return;
      event.preventDefault();
      handleInput();
    }, { passive: false });

    window.addEventListener("keydown", event => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      if (!state.field) return;
      event.preventDefault();
      handleInput();
    });
  }

  function handleInput(){
    const now = performance.now();
    if (now - state.lastInputAt < 70) return;
    state.lastInputAt = now;
    if (state.paused) return;

    if (["intro", "verse", "bonusIntro", "bonus"].includes(state.phase)){
      jump();
    }
  }

  function jump(){
    if (!state.layout) return;
    if (state.jumpsUsed >= 2) return;

    state.dinoVY = (state.jumpsUsed === 0 ? getDifficulty().jumpU : getDifficulty().doubleJumpU) * state.layout.unit;
    state.jumpsUsed += 1;
    addJumpDust();
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
    const field = document.getElementById("dd2Field");
    if (!field) return;

    const rect = field.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const widthBasedUnit = width / TARGET_FIELD_UNITS_WIDE;
    const heightBasedMaxUnit = height * MAX_UNIT_BY_HEIGHT;
    const unit = clamp(widthBasedUnit, MIN_UNIT, Math.min(MAX_UNIT, heightBasedMaxUnit));
    const dinoAspect = 1280 / 1113;
    const groundH = clamp(unit * 0.64, height * 0.12, height * 0.20);
    const groundTop = height - groundH;
    const hillH = unit * 1.55;
    const backHillH = hillH * 2;
    const dinoH = unit;
    const dinoW = dinoH * dinoAspect;
    const dinoGroundY = groundTop - dinoH * 0.5 + unit * 0.025;
    const playTop = unit * 0.45;
    const groundTabletY = groundTop - TABLET_HEIGHT_U * unit * 1.05;
    const middleY = groundTop - unit * 1.50;
    const topY = Math.max(playTop + unit * 0.36, groundTop - unit * 3.00);
    const airClearanceY = groundTop - unit * 1.02;

    state.layout = {
      width,
      height,
      unit,
      dinoW,
      dinoH,
      dinoX: width * 0.25,
      dinoGroundY,
      groundH,
      groundTop,
      hillH,
      backHillH,
      playTop,
      lanes: {
        ground: groundTabletY,
        middle: middleY,
        top: topY
      },
      airClearanceY,
      spawnX: width + unit * 1.95,
      offscreenX: -unit * 2.7,
      flagSpawnX: width + unit * 2.05
    };

    field.style.setProperty("--dd2-ground-h", `${groundH}px`);
    field.style.setProperty("--dd2-hill-h", `${hillH}px`);
    field.style.setProperty("--dd2-back-hill-h", `${backHillH}px`);
    field.style.setProperty("--dd2-hill-w", `${Math.ceil(hillH * 10 + 4)}px`);
    field.style.setProperty("--dd2-back-hill-w", `${Math.ceil(backHillH * 10 + 4)}px`);

    state.dinoX = state.layout.dinoX;
    if (!state.dinoY) state.dinoY = dinoGroundY;
    state.dinoY = Math.min(state.dinoY, dinoGroundY);
  }

  function resetDino(){
    if (!state.layout) return;
    state.dinoX = state.layout.dinoX;
    state.dinoY = state.layout.dinoGroundY;
    state.dinoVY = 0;
    state.dinoAngle = 0;
    state.jumpsUsed = 0;
    state.dinoHidden = false;
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

    updateStreakSpeedBoost(dt);
    updateWorldScroll(dt);
    updateDino(dt, ts);
    updateParticles(dt);
    updateTrail(dt);

    if (state.phase === "intro"){
      const elapsed = (ts - state.introStartedAt) / 1000;
      if (isFlyingMessageComplete(INTRO_WORDS, elapsed)) enterVersePhase();
      return;
    }

    if (state.phase === "verse"){
      updateSpawn(dt, false);
      updateTablets(dt, ts);
      updateObstacles(dt, ts);
      if (getCurrentPhase() === "done" && state.tablets.length === 0 && state.obstacles.length === 0){
        enterBonusIntroPhase();
      }
      return;
    }

    if (state.phase === "bonusIntro"){
      const elapsed = (ts - state.phaseStartedAt) / 1000;
      if (isFlyingMessageComplete(BONUS_WORDS, elapsed)) enterBonusPhase();
      return;
    }

    if (state.phase === "bonus"){
      state.bonusDistanceU += getActiveWorldSpeedU() * dt;
      state.feet = Math.floor(state.bonusDistanceU * 14);

      const bonusElapsed = (ts - state.bonusStartedAt) / 1000;

      if (!state.bonusFinishTriggered && bonusElapsed >= FLAG_FINISH_SECONDS){
        state.bonusFinishTriggered = true;
        state.bonusFlagAt = ts + FLAG_CLEAR_RUNWAY_SECONDS * 1000;
        state.spawnCooldown = 0;
      }

      if (state.bonusFinishTriggered){
        if (!state.bonusFlagSpawned && ts >= state.bonusFlagAt){
          spawnFlag();
        }
      } else {
        updateSpawn(dt, true);
      }

      updateObstacles(dt, ts);
      updateBuildText();
      return;
    }

    if (state.phase === "fall"){
      updateObstacles(dt, ts);
      updateTablets(dt, ts);
      if (ts >= state.respawnAt){
        clearMovingItems();
        resetDino();
        state.spawnCooldown = 0.65;
        if (state.bonusStartedAt) state.phase = "bonus";
        else state.phase = "verse";
      }
    }
  }

  function updateStreakSpeedBoost(dt){
    const target = getStreakSpeedBoostTargetU();
    const ease = getDifficulty().streakSpeedEaseU || 1.25;
    const step = ease * dt;
    const current = state.streakSpeedBoostU || 0;
    if (current < target) state.streakSpeedBoostU = Math.min(target, current + step);
    else if (current > target) state.streakSpeedBoostU = Math.max(target, current - step * 1.65);
  }

  function getStreakSpeedBoostTargetU(){
    if (state.phase !== "verse") return 0;
    const boosts = getDifficulty().streakSpeedBoostsU || [0];
    const level = getTrailLevel();
    return boosts[Math.min(level, boosts.length - 1)] || 0;
  }

  function updateWorldScroll(dt){
    const speed = getActiveWorldSpeedU() * state.layout.unit;
    state.worldX -= speed * dt;
    state.hillX -= speed * dt;
    state.backHillX -= speed * 0.5 * dt;
  }

  function updateDino(dt, ts){
    const layout = state.layout;
    const d = getDifficulty();

    if (state.phase === "fall"){
      state.dinoVY += layout.unit * 13.0 * dt;
      state.dinoY += state.dinoVY * dt;
      state.dinoAngle += 420 * dt;
      return;
    }

    const wasGrounded = isDinoGrounded();
    state.dinoVY += d.gravityU * layout.unit * dt;
    state.dinoY += state.dinoVY * dt;

    if (state.dinoY > layout.dinoGroundY){
      state.dinoY = layout.dinoGroundY;
      state.dinoVY = 0;
      state.jumpsUsed = 0;
      if (!wasGrounded){
        state.landingSquashUntil = ts + 160;
        addLandingDust();
      }
    }

    if (!isDinoGrounded()){
      state.dinoAngle = clamp(state.dinoVY / (layout.unit * 0.18), -16, 26);
    } else {
      state.dinoAngle = 0;
    }
  }

  function updateSpawn(dt, bonusOnly){
    if (state.spawnPause > 0){
      state.spawnPause = Math.max(0, state.spawnPause - dt);
      return;
    }

    if (state.phase === "fall") return;
    if (state.obstacles.some(item => item.x > state.layout.width - state.layout.unit * 0.8)) return;
    if (!bonusOnly && state.tablets.some(item => item.x > state.layout.width - state.layout.unit * 0.8)) return;

    state.spawnCooldown -= dt;
    if (state.spawnCooldown > 0) return;

    if (bonusOnly){
      spawnBonusPattern();
    } else {
      spawnVersePattern();
    }

    state.spawnCooldown = bonusOnly ? getBonusPatternSpacingSeconds() : getPatternSpacingSeconds();
  }

  function getPatternSpacingSeconds(){
    const speedU = Math.max(1, getActiveWorldSpeedU());
    return getDifficulty().patternGapU / speedU;
  }

  function getBonusPatternSpacingSeconds(){
    const d = getDifficulty();
    const speedU = Math.max(1, getActiveWorldSpeedU());
    const distanceSeconds = d.patternGapU / speedU;
    const variedSeconds = distanceSeconds * randomBetween(0.92, 1.12);
    return Math.max(d.bonusMinPatternSeconds || 1.15, variedSeconds);
  }

  function spawnVersePattern(){
    const phase = getCurrentPhase();
    if (phase === "done") return;

    if (shouldForceStandaloneDecoy()){
      spawnTabletForPhase(phase, { forceDecoy: true });
      return;
    }

    const d = getDifficulty();
    const pairedRoll = Math.random();
    const obstacleRoll = Math.random();

    if (pairedRoll < d.pairedChance){
      if (Math.random() < 0.45){
        const obstacle = spawnGroundObstacle();
        spawnCorrectTablet(chooseAirWordLane(), getObstaclePairWordOffset(obstacle));
      } else if (Math.random() < 0.50){
        spawnGapObstacle();
        spawnCorrectTablet(chooseAirWordLane());
      } else {
        spawnAirObstacle();
        spawnCorrectTablet("ground");
      }
      return;
    }

    if (obstacleRoll < d.obstacleChance){
      spawnRandomObstacleOnly();
      return;
    }

    spawnTabletForPhase(phase);
  }

  function spawnBonusPattern(){
    if (state.bonusFlagSpawned) return;
    spawnRandomObstacleOnly();
  }

  function spawnRandomObstacleOnly(){
    const roll = Math.random();
    if (roll < 0.50) spawnGroundObstacle();
    else if (roll < 0.78) spawnAirObstacle();
    else spawnGapObstacle();
  }

  function spawnTabletForPhase(phase, options = {}){
    const correctLabel = getCurrentCorrectLabel();
    const decoys = getDecoysForPhase(phase, correctLabel, 4);
    const shouldBeCorrect = chooseCorrectOrDecoy({
      forceDecoy: !!options.forceDecoy,
      canSpawnDecoy: decoys.length > 0
    });
    const label = (shouldBeCorrect || decoys.length === 0)
      ? correctLabel
      : decoys[Math.floor(Math.random() * decoys.length)];
    const lane = chooseWordLane();
    spawnTablet(label, label === correctLabel, phase, lane);
  }

  function spawnCorrectTablet(lane, xOffset = 0){
    const phase = getCurrentPhase();
    if (phase === "done") return;
    spawnTablet(getCurrentCorrectLabel(), true, phase, lane, xOffset);
    rememberSpawn(true);
  }

  function spawnTablet(label, correct, phase, lane, xOffset = 0){
    const shapeKey = getTabletShapeKey(label);
    const shape = TABLET_SHAPES[shapeKey];
    const layout = state.layout;
    const h = TABLET_HEIGHT_U * layout.unit;
    const w = h * shape.aspect;
    const y = lane === "ground" ? layout.lanes.ground : lane === "top" ? layout.lanes.top : layout.lanes.middle;

    state.tablets.push({
      id: state.nextItemId++,
      label,
      correct,
      phase,
      lane,
      x: layout.spawnX + xOffset,
      y,
      w,
      h,
      shapeKey,
      collected: false,
      collectAt: 0
    });
  }

  function spawnGroundObstacle(){
    const data = GROUND_OBSTACLES[Math.floor(Math.random() * GROUND_OBSTACLES.length)];
    const layout = state.layout;
    const h = data.heightU * layout.unit;
    const w = h * getNaturalObstacleAspect(data.key);
    const y = layout.groundTop - h * 0.5 + h * data.offsetRatio;

    const obstacle = {
      id: state.nextItemId++,
      type: "ground",
      key: data.key,
      image: data.image,
      x: layout.spawnX,
      y,
      w,
      h,
      hitW: w * data.hitW,
      hitH: h * data.hitH,
      hit: false,
      age: 0
    };

    state.obstacles.push(obstacle);
    return obstacle;
  }

  function getObstaclePairWordOffset(obstacle) {
    if (!obstacle || !obstacle.w) return 0;
    return randomBetween(-obstacle.w, obstacle.w);
  }

  function spawnGapObstacle(){
    const layout = state.layout;
    const h = layout.groundH;
    const w = h * 2.40;
    state.obstacles.push({
      id: state.nextItemId++,
      type: "gap",
      key: "gap",
      image: "dino_dash_ground_gap.png",
      x: layout.spawnX,
      y: layout.groundTop + h * 0.5,
      w,
      h,
      dangerW: w * 0.64,
      hit: false,
      age: 0
    });
  }

  function spawnAirObstacle(){
    const data = AIR_OBSTACLES[Math.floor(Math.random() * AIR_OBSTACLES.length)];
    const layout = state.layout;
    const h = data.heightU * layout.unit;
    const w = h * (data.key === "bird" ? 1.32 : 1.02);
    const lane = Math.random() < getDifficulty().topWordChance ? "top" : "middle";
    const baseY = lane === "top" ? layout.lanes.top : layout.lanes.middle;
    const y = Math.min(baseY, layout.airClearanceY - h * 0.08);

    state.obstacles.push({
      id: state.nextItemId++,
      type: "air",
      key: data.key,
      image: data.image,
      x: layout.spawnX,
      y,
      baseY: y,
      lane,
      w,
      h,
      hitW: w * 0.72,
      hitH: h * 0.58,
      speedMult: data.speedMult || 1,
      wavePhase: Math.random() * Math.PI * 2,
      flapTimer: Math.random() * 0.7,
      hit: false,
      age: 0
    });
  }

  function spawnFlag(){
    if (state.bonusFlagSpawned) return;
    const layout = state.layout;
    const h = layout.unit;
    const w = h * 0.88;

    state.bonusFlagSpawned = true;
    state.obstacles.push({
      id: state.nextItemId++,
      type: "flag",
      key: "flag",
      image: "dino_dash_flag.png",
      x: layout.flagSpawnX,
      y: layout.groundTop - h * 0.5,
      w,
      h,
      hit: false,
      age: 0
    });
  }

  function getNaturalObstacleAspect(key){
    if (key === "bones") return 1141 / 580;
    if (key === "crate") return 950 / 922;
    if (key === "cactus") return 1118 / 1231;
    if (key === "boulder") return 1078 / 772;
    if (key === "stump") return 1097 / 864;
    return 1;
  }

  function updateTablets(dt, ts){
    const speed = getActiveWorldSpeedU() * state.layout.unit;
    for (const tablet of state.tablets){
      tablet.x -= speed * dt;
      if (!tablet.collected && rectsOverlap(getDinoHitbox(), getTabletHitbox(tablet))){
        if (tablet.correct) collectCorrectTablet(tablet, ts);
        else collectDecoyTablet(tablet, ts);
      }
    }

    state.tablets = state.tablets.filter(tablet => {
      if (tablet.collected) return ts - tablet.collectAt < 240;
      if (tablet.x < state.layout.offscreenX){
        if (tablet.correct) missCorrectTablet(ts);
        return false;
      }
      return true;
    });
  }

  function updateObstacles(dt, ts){
    const speed = getActiveWorldSpeedU() * state.layout.unit;
    for (const item of state.obstacles){
      const itemSpeed = speed * (item.type === "air" ? item.speedMult || 1 : 1);
      item.age += dt;
      item.x -= itemSpeed * dt;

      if (item.type === "air"){
        if (item.key === "bee"){
          item.y = item.baseY + Math.sin(item.age * 5.2 + item.wavePhase) * state.layout.unit * 0.13;
        } else {
          item.flapTimer += dt;
          const pulse = Math.max(0, Math.sin(item.flapTimer * Math.PI * 2.1));
          const fall = Math.sin(item.flapTimer * Math.PI * 4.2 + 0.7) * state.layout.unit * 0.11;
          item.y = item.baseY - pulse * state.layout.unit * 0.22 + fall;
        }
        const minY = state.layout.playTop + item.h * 0.6;
        const maxY = state.layout.airClearanceY - item.h * 0.10;
        item.y = clamp(item.y, minY, maxY);
      }

      if (!item.hit){
        if (item.type === "gap" && gapCatchesDino(item)){
          item.hit = true;
          enterFallPhase();
        } else if (item.type === "flag" && item.x + item.w * 0.5 < state.dinoX){
          finishBonus();
        } else if ((item.type === "ground" || item.type === "air") && rectsOverlap(getDinoHitbox(), getObstacleHitbox(item))){
          hitObstacle(item, ts);
        }
      }
    }

    state.obstacles = state.obstacles.filter(item => item.x > state.layout.offscreenX && !(item.type === "flag" && state.bonusFinished));
  }

  function collectCorrectTablet(tablet, ts){
    tablet.collected = true;
    tablet.collectAt = ts;
    const oldLevel = getTrailLevel();
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.progressIndex += 1;
    addParticleBurst(tablet.x, tablet.y, PARTICLE_COLORS.rainbow, 18, 0.06, 0.18);
    if (getTrailLevel() > oldLevel) addParticleBurst(state.dinoX, state.dinoY, PARTICLE_COLORS.green, 20, 0.04, 0.16);
    flash("rgba(120, 220, 190, 0.24)", 110);
    updateBuildText();
  }

  function collectDecoyTablet(tablet, ts){
    tablet.collected = true;
    tablet.collectAt = ts;
    state.streak = 0;
    clearTrail();
    state.dinoSpinUntil = ts + 520;
    state.shakeUntil = ts + 240;
    addParticleBurst(tablet.x, tablet.y, PARTICLE_COLORS.white, 12, 0.05, 0.14);
    flash("rgba(255, 90, 81, 0.24)", 130);
  }

  function missCorrectTablet(ts){
    if (selectedMode !== "easy"){
      state.streak = 0;
      clearTrail();
      state.shakeUntil = ts + 220;
      flash("rgba(255, 199, 81, 0.24)", 120);
    }
    state.forceCorrectNext = true;
  }

  function hitObstacle(item, ts){
    item.hit = true;
    state.streak = 0;
    clearTrail();
    state.dinoSpinUntil = ts + 600;
    state.shakeUntil = ts + 260;
    addParticleBurst(item.x, item.y, item.type === "air" ? PARTICLE_COLORS.white : PARTICLE_COLORS.brown, 16, 0.06, 0.20);
    flash("rgba(255, 90, 81, 0.25)", 130);
  }

  function gapCatchesDino(gap){
    if (!state.layout) return false;
    const dangerLeft = gap.x - gap.dangerW * 0.5;
    const dangerRight = gap.x + gap.dangerW * 0.5;
    const footX = state.dinoX - state.layout.unit * 0.08;
    const bottom = state.dinoY + state.layout.dinoH * 0.48;
    return footX >= dangerLeft && footX <= dangerRight && bottom >= state.layout.groundTop - state.layout.unit * 0.08;
  }

  function getDinoHitbox(){
    const layout = state.layout;
    return {
      x: state.dinoX,
      y: state.dinoY + layout.unit * 0.05,
      w: layout.dinoW * 0.52,
      h: layout.dinoH * 0.78
    };
  }

  function getTabletHitbox(tablet){
    return { x: tablet.x, y: tablet.y, w: tablet.w * 0.76, h: tablet.h * 0.72 };
  }

  function getObstacleHitbox(item){
    return { x: item.x, y: item.y, w: item.hitW || item.w * 0.7, h: item.hitH || item.h * 0.7 };
  }

  function rectsOverlap(a, b){
    return Math.abs(a.x - b.x) * 2 < (a.w + b.w) && Math.abs(a.y - b.y) * 2 < (a.h + b.h);
  }

  function chooseCorrectOrDecoy({ forceDecoy = false, canSpawnDecoy = true } = {}){
    if (!canSpawnDecoy){
      rememberSpawn(true);
      return true;
    }

    if (state.forceCorrectNext){
      state.forceCorrectNext = false;
      rememberSpawn(true);
      return true;
    }

    const decoyRun = countRun(false);
    const correctRun = countRun(true);

    if (forceDecoy && decoyRun < 2){
      rememberSpawn(false);
      return false;
    }

    let decoyChance = 0.30;
    const recent = state.spawnHistory.slice(-8);
    const recentCorrect = recent.filter(Boolean).length;
    const recentRatio = recent.length ? recentCorrect / recent.length : 0;

    if (decoyRun >= 2) decoyChance = 0;
    else if (correctRun >= 4) decoyChance = 0.82;
    else if (correctRun >= 3) decoyChance = 0.66;
    else if (recent.length >= 6 && recentRatio >= 0.75) decoyChance = 0.72;
    else if (recent.length >= 6 && recentRatio >= 0.62) decoyChance = 0.52;
    else if (recent.length >= 6 && recentRatio <= 0.35) decoyChance = 0.10;

    const isCorrect = !(Math.random() < decoyChance);
    rememberSpawn(isCorrect);
    return isCorrect;
  }

  function shouldForceStandaloneDecoy() {
    if (state.forceCorrectNext) return false;

    const recent = state.spawnHistory.slice(-6);
    if (recent.length < 4) return false;

    const recentCorrect = recent.filter(Boolean).length;
    if (countRun(true) >= 4) return true;
    if (recent.length >= 6 && recentCorrect >= 5) return true;

    return false;
  }

  function rememberSpawn(isCorrect){
    state.spawnHistory.push(isCorrect);
    if (state.spawnHistory.length > 10) state.spawnHistory.shift();
  }

  function countRun(value){
    let total = 0;
    for (let i = state.spawnHistory.length - 1; i >= 0; i -= 1){
      if (state.spawnHistory[i] !== value) break;
      total += 1;
    }
    return total;
  }

  function chooseWordLane(){
    const roll = Math.random();
    if (roll < 0.34) return "ground";
    if (roll < 0.34 + getDifficulty().topWordChance) return "top";
    return "middle";
  }

  function chooseAirWordLane(){
    return Math.random() < getDifficulty().topWordChance ? "top" : "middle";
  }

  function getTabletShapeKey(label){
    const len = String(label || "").length;
    if (len <= 4) return "compact";
    if (len <= 9) return "normal";
    return "long";
  }

  function getTabletFontSize(tablet){
    const label = String(tablet.label || "");
    const targetSize = clamp(tablet.h * 0.42, 15, 29);
    const textSafeWidth = tablet.w * TABLET_SHAPES[tablet.shapeKey].textWidth;
    const visualWeight = getTextVisualWeight(label);
    const fittedSize = textSafeWidth / Math.max(1, visualWeight);
    return clamp(Math.min(targetSize, fittedSize), 12, targetSize);
  }

  function getTextVisualWeight(label){
    const text = String(label || "").trim();
    if (!text) return 1;
    let weight = 0;
    for (const char of text){
      if (/[ilI1!'.,:;]/.test(char)) weight += 0.34;
      else if (/[fjtJr]/.test(char)) weight += 0.48;
      else if (/[mwMW@#]/.test(char)) weight += 0.98;
      else if (/[A-Z]/.test(char)) weight += 0.74;
      else if (/[0-9]/.test(char)) weight += 0.64;
      else if (/\s/.test(char)) weight += 0.34;
      else weight += 0.60;
    }
    return weight;
  }

  function getCurrentPhase(){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: state.verseWords.length,
      totalSegments: state.buildSegments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function getCurrentCorrectLabel(){
    const phase = getCurrentPhase();
    if (phase === "words") return state.verseWords[state.progressIndex] || "";
    if (phase === "book") return state.bookLabel;
    if (phase === "reference") return state.referenceLabel;
    return "";
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = [];
    const seen = new Set([normalizeWord(correctLabel)]);

    function add(list){
      for (const item of list || []){
        const key = normalizeWord(item);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
        if (out.length >= count) break;
      }
    }

    if (phase === "words"){
      if (selectedMode === "easy"){
        add(window.VerseGameShell.getFunWordDecoys(correctLabel, state.verseWords, count));
      } else {
        add(window.VerseGameShell.getVerseWordDecoys({
          words: state.verseWords,
          correct: correctLabel,
          targetIndex: state.progressIndex,
          count,
          avoidNext: 2,
          fallbackToFun: true
        }));
        add(window.VerseGameShell.getFunWordDecoys(correctLabel, state.verseWords, count));
      }
      add(FUN_DECOYS);
    }

    if (phase === "book") add(window.VerseGameShell.getBookDecoys(correctLabel, count));
    if (phase === "reference") add(window.VerseGameShell.getReferenceDecoys(referenceParts, selectedMode, count + 4));

    return out.slice(0, count);
  }

  function normalizeWord(value){
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function getDifficulty(){
    return DIFFICULTY[selectedMode] || DIFFICULTY.easy;
  }

  function getActiveWorldSpeedU(){
    if (state.phase === "bonus"){
      const elapsed = Math.max(0, (performance.now() - state.bonusStartedAt) / 1000);
      return getDifficulty().bonusStartSpeedU + elapsed * getDifficulty().bonusRampU;
    }
    return getDifficulty().worldSpeedU + (state.phase === "verse" ? state.streakSpeedBoostU : 0);
  }

  function isDinoGrounded(){
    return state.layout && Math.abs(state.dinoY - state.layout.dinoGroundY) < 2;
  }

  function getTrailLevel(){
    if (state.phase !== "verse") return 0;
    if (state.streak >= 16) return 4;
    if (state.streak >= 12) return 3;
    if (state.streak >= 8) return 2;
    if (state.streak >= 4) return 1;
    return 0;
  }

  function clearTrail(){
    state.trailDots = [];
    state.trailSparkles = [];
    state.trailCooldown = 0;
    state.sparkleCooldown = 0;
  }

  function updateTrail(dt){
    const level = getTrailLevel();
    if (level <= 0 || !state.layout || state.dinoHidden){
      clearTrail();
      return;
    }

    const speed = getActiveWorldSpeedU() * state.layout.unit;
    for (const dot of state.trailDots){
      dot.age += dt;
      dot.x -= speed * dt;
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
    }
    for (const sparkle of state.trailSparkles){
      sparkle.age += dt;
      sparkle.x -= speed * dt;
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.rotation += sparkle.spin * dt;
    }

    state.trailCooldown -= dt;
    if (state.trailCooldown <= 0){
      addTrailDot(level);
      state.trailCooldown = level >= 3 ? 0.034 : 0.044;
    }

    if (level >= 2){
      state.sparkleCooldown -= dt;
      if (state.sparkleCooldown <= 0){
        addTrailSparkle(level);
        state.sparkleCooldown = level >= 4 ? 0.075 : 0.13;
      }
    }

    state.trailDots = state.trailDots.filter(dot => dot.age < dot.life && dot.x > -dot.size * 2.2);
    state.trailSparkles = state.trailSparkles.filter(sparkle => sparkle.age < sparkle.life && sparkle.x > -sparkle.size * 2.2);
  }

  function addTrailDot(level){
    const unit = state.layout.unit;
    const isRainbow = level >= 3;
    const colors = isRainbow ? PARTICLE_COLORS.rainbow : ["rgba(255,255,255,0.88)", "rgba(245,252,255,0.78)"];
    state.trailDots.push({
      id: state.nextTrailId++,
      x: state.dinoX - unit * 0.48,
      y: state.dinoY + randomBetween(-0.26, 0.24) * unit,
      vx: randomBetween(-0.18, 0.04) * unit,
      vy: randomBetween(-0.15, 0.15) * unit,
      size: randomBetween(isRainbow ? 0.08 : 0.07, isRainbow ? 0.14 : 0.12) * unit,
      color: colors[state.nextTrailId % colors.length],
      opacity: isRainbow ? 0.86 : 0.72,
      life: 2.1,
      age: 0
    });
  }

  function addTrailSparkle(level){
    const unit = state.layout.unit;
    const colors = level >= 4 ? PARTICLE_COLORS.rainbow : ["#ffc751", "#ffe58a", "#fff4b8"];
    state.trailSparkles.push({
      id: state.nextTrailId++,
      x: state.dinoX - unit * randomBetween(0.42, 0.72),
      y: state.dinoY + randomBetween(-0.34, 0.28) * unit,
      vx: randomBetween(-0.16, 0.06) * unit,
      vy: randomBetween(-0.26, 0.26) * unit,
      size: randomBetween(0.08, level >= 4 ? 0.16 : 0.13) * unit,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      spin: randomBetween(-260, 260),
      opacity: level >= 4 ? 0.92 : 0.86,
      life: randomBetween(0.48, 0.78),
      age: 0
    });
  }

  function addJumpDust(){
    addDust(state.dinoX - state.layout.unit * 0.38, state.layout.groundTop - state.layout.unit * 0.06, 7);
  }

  function addLandingDust(){
    addDust(state.dinoX - state.layout.unit * 0.08, state.layout.groundTop - state.layout.unit * 0.05, 10);
  }

  function addDust(x, y, count){
    for (let i = 0; i < count; i += 1){
      state.dust.push({
        id: state.nextParticleId++,
        x: x + randomBetween(-0.10, 0.14) * state.layout.unit,
        y: y + randomBetween(-0.02, 0.07) * state.layout.unit,
        vx: randomBetween(-1.2, 0.15) * state.layout.unit,
        vy: randomBetween(-0.45, 0.15) * state.layout.unit,
        size: randomBetween(0.035, 0.075) * state.layout.unit,
        color: "rgba(200, 145, 73, 0.45)",
        age: 0,
        life: randomBetween(0.30, 0.55)
      });
    }
  }

  function addParticleBurst(x, y, colors, count, minSizeU, maxSizeU){
    for (let i = 0; i < count; i += 1){
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(1.0, 3.2) * state.layout.unit;
      state.particles.push({
        id: state.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomBetween(minSizeU, maxSizeU) * state.layout.unit,
        color: colors[Math.floor(Math.random() * colors.length)],
        age: 0,
        life: randomBetween(0.36, 0.72)
      });
    }
  }

  function updateParticles(dt){
    const speed = getActiveWorldSpeedU() * (state.layout ? state.layout.unit : 1);
    for (const p of state.particles){
      p.age += dt;
      p.x += p.vx * dt - speed * dt * 0.30;
      p.y += p.vy * dt;
      p.vy += state.layout.unit * 2.0 * dt;
    }
    for (const d of state.dust){
      d.age += dt;
      d.x += d.vx * dt - speed * dt * 0.45;
      d.y += d.vy * dt;
    }
    state.particles = state.particles.filter(p => p.age < p.life);
    state.dust = state.dust.filter(d => d.age < d.life);
  }

  function randomBetween(min, max){
    return min + Math.random() * (max - min);
  }

  function flash(color, duration){
    state.flashColor = color;
    state.flashUntil = performance.now() + duration;
  }

  function render(ts){
    renderWorld();
    renderTrail();
    renderParticles();
    renderTablets(ts);
    renderObstacles();
    renderDino(ts);
    renderFlyingWords(ts);
    renderFlash(ts);
  }

  function renderWorld(){
    const field = document.getElementById("dd2Field");
    if (!field || !state.layout) return;
    field.style.setProperty("--dd2-ground-x", `${state.worldX}px`);
    field.style.setProperty("--dd2-hill-x", `${state.hillX}px`);
    field.style.setProperty("--dd2-back-hill-x", `${state.backHillX}px`);

    const hillW = Math.ceil(state.layout.hillH * 10 + 4);
    const hillOffset = ((-state.hillX % hillW) + hillW) % hillW;
    const hillA = document.getElementById("dd2HillA");
    const hillB = document.getElementById("dd2HillB");
    if (hillA) hillA.style.transform = `translateX(${-hillOffset}px)`;
    if (hillB) hillB.style.transform = `translateX(${hillW - hillOffset}px)`;

    const backHillW = Math.ceil(state.layout.backHillH * 10 + 4);
    const backHillOffset = ((-state.backHillX % backHillW) + backHillW) % backHillW;
    const backHillA = document.getElementById("dd2BackHillA");
    const backHillB = document.getElementById("dd2BackHillB");
    if (backHillA) backHillA.style.transform = `translateX(${-backHillOffset}px)`;
    if (backHillB) backHillB.style.transform = `translateX(${backHillW - backHillOffset}px)`;
  }

  function renderTablets(ts){
    const layer = document.getElementById("dd2Tablets");
    if (!layer) return;
    layer.innerHTML = state.tablets.map(tablet => {
      const shape = TABLET_SHAPES[tablet.shapeKey];
      const size = getTabletFontSize(tablet);
      const cls = tablet.correct ? "is-correct" : "is-decoy";
      const collected = tablet.collected ? " is-collected" : "";
      return `
        <div class="dd2-tablet ${cls}${collected}" style="--x:${tablet.x}px;--y:${tablet.y}px;--w:${tablet.w}px;--h:${tablet.h}px;--img:url('${IMAGE_PATH}${shape.image}');">
          <div class="dd2-tablet-word" style="--size:${size}px;--text-x:${shape.textX}%;--text-y:${shape.textY}%;">${escapeHtml(tablet.label)}</div>
        </div>
      `;
    }).join("");
  }

  function renderObstacles(){
    const layer = document.getElementById("dd2Obstacles");
    if (!layer) return;
    layer.innerHTML = state.obstacles.map(item => {
      if (item.type === "flag"){
        return `<div class="dd2-flag" style="--x:${item.x}px;--y:${item.y}px;--w:${item.w}px;--h:${item.h}px;background-image:url('${IMAGE_PATH}${item.image}');"></div>`;
      }
      const cls = `dd2-obstacle dd2-obstacle--${item.type} dd2-obstacle--${item.key}${item.hit ? " is-hit" : ""}`;
      return `<div class="${cls}" style="--x:${item.x}px;--y:${item.y}px;--w:${item.w}px;--h:${item.h}px;background-image:url('${IMAGE_PATH}${item.image}');"></div>`;
    }).join("");
  }

  function renderTrail(){
    const layer = document.getElementById("dd2TrailLayer");
    if (!layer) return;
    const dots = state.trailDots.map(dot => {
      const opacity = dot.opacity * Math.max(0, 1 - dot.age / dot.life);
      return `<div class="dd2-trail-dot" style="--x:${dot.x}px;--y:${dot.y}px;--size:${dot.size}px;--color:${dot.color};opacity:${opacity};"></div>`;
    }).join("");
    const sparkles = state.trailSparkles.map(s => {
      const opacity = s.opacity * Math.max(0, 1 - s.age / s.life);
      return `<div class="dd2-trail-sparkle" style="--x:${s.x}px;--y:${s.y}px;--size:${s.size}px;--color:${s.color};--rotation:${s.rotation}deg;opacity:${opacity};"></div>`;
    }).join("");
    layer.innerHTML = dots + sparkles;
  }

  function renderParticles(){
    const layer = document.getElementById("dd2Particles");
    if (!layer) return;
    const particles = state.particles.map(p => {
      const t = p.age / p.life;
      const opacity = Math.max(0, 1 - t);
      return `<div class="dd2-particle" style="--x:${p.x}px;--y:${p.y}px;--size:${p.size * (1 + t * 0.3)}px;--color:${p.color};opacity:${opacity};"></div>`;
    }).join("");
    const dust = state.dust.map(d => {
      const opacity = Math.max(0, 1 - d.age / d.life);
      return `<div class="dd2-dust" style="--x:${d.x}px;--y:${d.y}px;--size:${d.size}px;--color:${d.color};opacity:${opacity};"></div>`;
    }).join("");
    layer.innerHTML = particles + dust;
  }

  function renderDino(ts){
    const el = document.getElementById("dd2Dino");
    if (!el || !state.layout) return;

    if (state.paused){
      if (!state.pausedRenderTs) state.pausedRenderTs = ts || performance.now();
      ts = state.pausedRenderTs;
    } else {
      state.pausedRenderTs = 0;
    }

    const runCycle = ((ts || 0) % 520) / 520;
    const runSwing = Math.sin(runCycle * Math.PI * 2);
    const grounded = isDinoGrounded();
    const airborne = !grounded || state.phase === "fall";
    const legFront = airborne ? -22 : runSwing * 18;
    const legRear = airborne ? 24 : -runSwing * 18;
    const bob = grounded ? Math.sin(runCycle * Math.PI * 2) * state.layout.unit * 0.018 : 0;
    const squashActive = ts < state.landingSquashUntil;
    const squashX = squashActive ? 1.055 : 1;
    const squashY = squashActive ? 0.955 : 1;
    const spin = ts < state.dinoSpinUntil ? ` rotate(${((ts - state.phaseStartedAt) * 0.9) % 360}deg)` : ` rotate(${state.dinoAngle}deg)`;

    el.style.setProperty("--dino-w", `${state.layout.dinoW}px`);
    el.style.setProperty("--dino-h", `${state.layout.dinoH}px`);
    el.style.left = `${state.dinoX}px`;
    el.style.top = `${state.dinoY + bob}px`;
    el.style.transform = `translate(-50%, -50%)${spin} scale(${squashX}, ${squashY})`;
    el.classList.toggle("is-airborne", airborne);
    el.classList.toggle("is-hidden", state.dinoHidden);
    el.style.setProperty("--front-leg-rot", `${legFront}deg`);
    el.style.setProperty("--rear-leg-rot", `${legRear}deg`);
  }

  function renderFlyingWords(ts){
    const layer = document.getElementById("dd2IntroLayer");
    if (!layer || !state.layout) return;

    if (state.phase === "intro"){
      const elapsed = (ts - state.introStartedAt) / 1000;
      layer.innerHTML = INTRO_WORDS.map((word, index) => renderFlyingWord(INTRO_WORDS, word, index, elapsed)).join("");
      return;
    }

    if (state.phase === "bonusIntro"){
      const elapsed = (ts - state.phaseStartedAt) / 1000;
      layer.innerHTML = BONUS_WORDS.map((word, index) => renderFlyingWord(BONUS_WORDS, word, index, elapsed)).join("");
      return;
    }

    layer.innerHTML = "";
  }

  function renderFlyingWord(words, word, index, elapsed){
    const layout = state.layout;
    const t = elapsed - word.delay;
    const travel = FLYING_WORD_TRAVEL_SECONDS;
    const size = clamp(layout.unit * 0.20, 18, 36);
    const wordW = getFlyingWordWidth(word, size);
    const lineOffset = getFlyingWordLineOffset(words, index, size);
    const startX = layout.width + wordW * 0.5 + layout.unit * 0.40 + lineOffset;
    const endX = -(wordW * 0.5 + layout.unit * 0.25);
    const progress = clamp(t / travel, 0, 1);
    const x = startX + (endX - startX) * progress;
    const baseY = word.line === 0
      ? layout.playTop + (layout.groundTop - layout.playTop) * 0.34
      : layout.playTop + (layout.groundTop - layout.playTop) * 0.62;
    const y = baseY + Math.sin((t * 4.6) + index) * layout.unit * 0.07;
    const tilt = Math.sin((t * 3.4) + index) * 3.5;
    const opacity = t < 0 || t > travel ? 0 : 1;
    const phraseClass = word.line === 0 ? " is-first-phrase" : " is-second-phrase";
    return `<div class="dd2-flying-word${phraseClass}" style="--x:${x}px;--y:${y}px;--tilt:${tilt}deg;--size:${size}px;opacity:${opacity};">${escapeHtml(word.text)}</div>`;
  }

  function getFlyingWordWidth(word, size){
    const text = String(word.text || "");
    return text.length * size * 0.78 + size * 1.48;
  }

  function getFlyingWordLineOffset(words, index, size){
    const current = words[index];
    if (!current) return 0;
    const gap = size * 1.35;
    let offset = 0;
    for (let i = 0; i < index; i += 1){
      const previous = words[i];
      if (!previous || previous.line !== current.line) continue;
      offset += getFlyingWordWidth(previous, size) + gap;
    }
    return offset;
  }

  function isFlyingMessageComplete(words, elapsed){
    if (!Array.isArray(words) || !words.length) return true;
    const last = words.reduce((max, word) => Math.max(max, word.delay), 0);
    return elapsed >= last + FLYING_WORD_TRAVEL_SECONDS + FLYING_MESSAGE_GRACE_SECONDS;
  }

  function renderFlash(ts){
    const flashEl = document.getElementById("dd2Flash");
    if (!flashEl) return;
    const active = ts < state.flashUntil;
    flashEl.classList.toggle("is-on", active);
    flashEl.style.background = state.flashColor;

    const field = document.getElementById("dd2Field");
    if (field){
      field.classList.toggle("dd2-shake", ts < state.shakeUntil);
    }
  }

  function updateBuildText(){
    const el = document.getElementById("dd2BuildText");
    if (!el) return;

    if (state.phase === "bonus" || state.phase === "bonusResult"){
      el.className = "dd2-build-text vm-build-text dd2-feet-build";
      el.innerHTML = `<span class="dd2-feet-label">Feet</span><span class="dd2-feet-number">${state.feet}</span>`;
      return;
    }

    const buildRender = window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.bookLabel,
      reference: state.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: selectedMode === "hard",
      extraClass: "dd2-build-text"
    });

    el.className = buildRender.className;
    el.innerHTML = buildRender.html;
    fitBuildText();
  }

  function fitBuildText(){
    if (state.buildFitDone) return;
    requestAnimationFrame(() => {
      const build = document.getElementById("dd2Build");
      const text = document.getElementById("dd2BuildText");
      if (!build || !text) return;
      const result = window.VerseGameShell.fitBuildTextOnce({ buildEl: build, textEl: text, buildArea: BUILD_AREA });
      if (result) state.buildFitDone = true;
    });
  }

  function showBonusResult(){
    if (state.resultShown) return;
    state.resultShown = true;
    const layer = document.getElementById("dd2ResultLayer");
    if (!layer) return;
    layer.hidden = false;
    layer.innerHTML = `
      <div class="dd2-result-card" role="dialog" aria-live="polite" aria-label="Bonus result">
        <h2 class="dd2-result-title">You made it!</h2>
        <p class="dd2-result-stat">You ran ${state.feet} feet.</p>
        <button class="dd2-result-button" id="dd2ContinueButton" type="button">Continue</button>
      </div>
    `;
    const button = document.getElementById("dd2ContinueButton");
    if (button){
      button.addEventListener("click", () => finishRun());
      button.focus({ preventScroll: true });
    }
  }

  async function finishRun(){
    if (completed) return;
    completed = true;
    state.running = false;
    stopLoop();

    try {
      completionResult = await window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode,
        stats: {
          bestStreak: state.bestStreak,
          feet: state.feet,
          progressIndex: state.progressIndex
        }
      });
    } catch (err){
      console.error("completeGameRun failed", err);
      completionResult = {
        ok: false,
        alreadyCompleted: false,
        newlyCompleted: false,
        reward: { ok: false, petUnlockTriggered: false }
      };
    }

    renderComplete();
  }

  function renderComplete(){
    stopLoop();
    cleanupResize();
    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🦖",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage: `Ran ${state.feet} feet after finishing ${ctx.verseRef || "the verse"}`,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: renderModeSelect,
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  async function preloadDinoSvg(){
    for (const filename of DINO_IMAGE_CANDIDATES){
      try {
        const response = await fetch(`${IMAGE_PATH}${filename}`);
        if (!response.ok) continue;
        dinoSvgText = await response.text();
        renderDinoAsset();
        return;
      } catch (err){
        // Try the next candidate filename.
      }
    }
  }

  function renderDinoAsset(){
    const el = document.getElementById("dd2Dino");
    if (!el || !dinoSvgText) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(dinoSvgText, "image/svg+xml");
    const svg = doc.documentElement;

    const frontLeg = svg.querySelector("#front_leg_group");
    const rearLeg = svg.querySelector("#rear_leg_group");
    if (frontLeg && !svg.querySelector("#dd2_front_leg_animator")){
      wrapSvgNode(frontLeg, "dd2_front_leg_animator");
    }
    if (rearLeg && !svg.querySelector("#dd2_rear_leg_animator")){
      wrapSvgNode(rearLeg, "dd2_rear_leg_animator");
    }

    recolorDinoSvg(svg);
    el.innerHTML = new XMLSerializer().serializeToString(svg);
  }

  function wrapSvgNode(node, wrapperId){
    const doc = node.ownerDocument;
    const wrapper = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    wrapper.setAttribute("id", wrapperId);
    node.parentNode.insertBefore(wrapper, node);
    wrapper.appendChild(node);
  }

  function recolorDinoSvg(root){
    if (!root || !state.dinoColor) return;

    for (const id of DINO_PRIMARY_PART_IDS){
      const part = root.querySelector(`#${cssEscape(id)}`);
      setSvgPartFill(part, state.dinoColor.primary);
    }

    for (const id of DINO_SECONDARY_PART_IDS){
      const part = root.querySelector(`#${cssEscape(id)}`);
      setSvgPartFill(part, state.dinoColor.secondary);
    }
  }

  function setSvgPartFill(part, color){
    if (!part || !color) return;

    part.setAttribute("fill", color);

    const style = part.getAttribute("style") || "";
    if (style.includes("fill:")){
      part.setAttribute("style", style.replace(/fill\s*:\s*[^;]+/g, `fill:${color}`));
    } else {
      part.setAttribute("style", `${style}${style && !style.trim().endsWith(";") ? ";" : ""}fill:${color};`);
    }
  }

  function cssEscape(value){
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function escapeHtml(value){
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clamp(value, min, max){
    return Math.min(max, Math.max(min, value));
  }
})();
