(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "dino_dash";
  const FUN_DECOYS = [
    "taco","banana","penguin","cupcake","pickle","rocket","waffle","balloon","otter","pretzel",
    "pancake","bubble","marshmallow","treasure","robot","firetruck","yo-yo","snowman","blueberry","noodle"
  ];
  const BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther",
    "Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
    "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
    "Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
    "2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
    "1 John","2 John","3 John","Jude","Revelation"
  ];

  const THEMES = [
    {
      id: "grass",
      sky: "#91ddff",
      player: "🦖",
      cloud: "☁️",
      decor: ["🌳","🌿","🌤️","🪺"],
      obstacleGround: ["🌵","🪨","🪵"],
      obstacleTop: ["☁️"],
      bandColor: "rgba(41, 82, 18, 0.10)",
      groundTop1: "#9fd86f",
      groundTop2: "#87c85a",
      groundBase1: "#b67b45",
      groundBase2: "#9a6436"
    },
    {
      id: "desert",
      sky: "#f7c47f",
      player: "🦖",
      cloud: "☁️",
      decor: ["🏜️","☀️","🌵","🪨"],
      obstacleGround: ["🌵","🪨"],
      obstacleTop: ["☀️"],
      bandColor: "rgba(94, 56, 17, 0.10)",
      groundTop1: "#efcf7b",
      groundTop2: "#ddb55f",
      groundBase1: "#c58f48",
      groundBase2: "#a97233"
    },
    {
      id: "fire",
      sky: "#ffb080",
      player: "🦖",
      cloud: "✨",
      decor: ["🔥","🌋","💥","☁️"],
      obstacleGround: ["🔥","🪨","💥"],
      obstacleTop: ["✨"],
      bandColor: "rgba(118, 28, 10, 0.10)",
      groundTop1: "#ff934f",
      groundTop2: "#ff7d47",
      groundBase1: "#8d4630",
      groundBase2: "#6d3326"
    },
    {
      id: "ice",
      sky: "#b8ecff",
      player: "🦕",
      cloud: "❄️",
      decor: ["❄️","🧊","☁️","✨"],
      obstacleGround: ["🧊","⛄","🪨"],
      obstacleTop: ["❄️"],
      bandColor: "rgba(27, 84, 126, 0.10)",
      groundTop1: "#d9f7ff",
      groundTop2: "#bcecff",
      groundBase1: "#87c6e8",
      groundBase2: "#69add3"
    }
  ];

  let selectedMode = null;
  let completed = false;
  let muted = false;

  const state = {
    running: false,
    rafId: 0,
    lastTs: 0,
    scale: 1,
    fieldWidth: 0,
    fieldHeight: 0,
    playerX: 0,
    playerY: 0,
    playerVY: 0,
    playerBaseSize: 56,
    gravityBase: 1550,
    jumpVelocityBase: -630,
    gravity: 1550,
    jumpVelocity: -630,
    bobTimer: 0,
    fieldFloorY: 0,
    laneTopY: 0,
    laneBottomY: 0,
    groundHeight: 82,
    groundDepth: 36,
    theme: null,
    clouds: [],
    decor: [],
    bands: [],
    groundSegments: [],
    particles: [],
    trail: [],
    verseWords: [],
    activeWords: [],
    obstacles: [],
    nextId: 1,
    progressIndex: 0,
    streak: 0,
    buildSegments: [],
    bookLabel: "",
    referenceLabel: "",
    flashUntil: 0,
    successFlashUntil: 0,
    shakeUntil: 0,
    currentPhase: "obstacle",
    phaseRemaining: 0,
    obstacleGoal: 0,
    wordGoal: 0,
    obstaclesResolved: 0,
    wordsResolved: 0,
    phaseBannerUntil: 0,
    worldSpeed: 0,
    wordSpeed: 0,
    groundSpawnCursor: 0,
    bandSpawnCursor: 0,
    spawnPause: 0,
    inputLockUntil: 0,
    lastHazardSpawnX: 0
  };

  const referenceParts = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
  state.bookLabel = referenceParts.book || "";
  state.referenceLabel = referenceParts.reference || "";
  state.verseWords = tokenizeVerse(ctx.verseText);
  state.buildSegments = [...state.verseWords];
  if (state.bookLabel) state.buildSegments.push(state.bookLabel);
  if (state.referenceLabel) state.buildSegments.push(state.referenceLabel);

  renderIntro();

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="dd-mode-shell">
        <div class="dd-mode-stage">
          <div class="dd-mode-top">
            <div style="font-size:72px; line-height:1;">🦖</div>
            <div class="dd-mode-title">Dino Dash</div>
            <div class="dd-mode-subtitle">
              Jump through obstacle runs.<br>
              Then choose the next verse word lane by lane.
            </div>
            <div class="dd-mode-card">
              <div class="dd-mode-actions">
                <button class="vm-btn" id="startBtn">Start</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay("Tap or click to jump.<br><br>Obstacle phase: jump over hazards and gaps.<br><br>Word phase: one word appears at a time. Jump for the top lane, stay low for the bottom lane.<br><br>Correct words build the verse. Mistakes only reset your streak.")}
      </div>
    `;

    document.getElementById("startBtn").onclick = renderModeSelect;
    wireCommonNav();
  }

  function renderModeSelect(){
    stopLoop();
    app.innerHTML = `
      <div class="dd-mode-shell">
        <div class="dd-mode-stage">
          <div class="dd-mode-top">
            <div class="dd-mode-title">🦖 Dino Dash</div>
            <div class="dd-mode-subtitle">Choose your difficulty.</div>
            <div class="dd-mode-card">
              <div class="dd-mode-actions">
                <button class="vm-btn" id="easyBtn">Easy</button>
                <button class="vm-btn" id="mediumBtn">Medium</button>
                <button class="vm-btn" id="hardBtn">Hard</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay("Easy: slower runs and more forgiving word timing.<br><br>Medium: balanced pace.<br><br>Hard: faster ground, quicker reactions, smaller reading window.")}
      </div>
    `;

    document.getElementById("easyBtn").onclick = () => startGame("easy");
    document.getElementById("mediumBtn").onclick = () => startGame("medium");
    document.getElementById("hardBtn").onclick = () => startGame("hard");
    wireCommonNav();
  }

  function startGame(mode){
    selectedMode = mode;
    completed = false;
    state.theme = { ...THEMES[Math.floor(Math.random() * THEMES.length)] };
    state.running = true;
    state.progressIndex = 0;
    state.streak = 0;
    state.particles = [];
    state.trail = [];
    state.clouds = [];
    state.decor = [];
    state.bands = [];
    state.groundSegments = [];
    state.activeWords = [];
    state.obstacles = [];
    state.nextId = 1;
    state.flashUntil = 0;
    state.successFlashUntil = 0;
    state.shakeUntil = 0;
    state.currentPhase = "obstacle";
    state.phaseRemaining = 0;
    state.obstacleGoal = 0;
    state.wordGoal = 0;
    state.obstaclesResolved = 0;
    state.wordsResolved = 0;
    state.phaseBannerUntil = performance.now() + 1400;
    state.spawnPause = 0.9;
    state.inputLockUntil = 0;
    state.bobTimer = 0;
    state.lastHazardSpawnX = 0;

    renderGame();
    recalcField();
    resetPlayer();
    seedClouds();
    seedDecor();
    seedInitialGround();
    resetPlayer();
    state.phaseRemaining = getObstacleTargetCount();
    updateBuildText();
    updatePills();
    startLoop();
  }

  function renderGame(){
    const theme = state.theme || THEMES[0];
    app.innerHTML = `
      <div class="dd-root">
        <div class="dd-stage">
          <div class="dd-build-wrap">
            <div class="dd-build" id="ddBuild">
              <div class="dd-build-text" id="ddBuildText"></div>
            </div>
          </div>

          <div class="dd-field-wrap">
            <div class="dd-field" id="ddField" style="background:${theme.sky}; --ground-top1:${theme.groundTop1}; --ground-top2:${theme.groundTop2}; --ground-base1:${theme.groundBase1}; --ground-base2:${theme.groundBase2};">
              <div class="dd-clouds" id="ddClouds"></div>
              <div class="dd-backdrop" id="ddBackdrop"></div>
              <div class="dd-trails" id="ddTrails"></div>
              <div class="dd-particles" id="ddParticles"></div>
              <div class="dd-words" id="ddWords"></div>
              <div class="dd-obstacles" id="ddObstacles"></div>
              <div class="dd-player-layer" id="ddPlayerLayer">
                <div class="dd-player" id="ddPlayer">${theme.player}</div>
              </div>
              <div class="dd-feedback" id="ddFeedback">
                <div class="dd-flash" id="ddFlash"></div>
                <div class="dd-phase-banner" id="ddPhaseBanner"></div>
              </div>
              <div class="dd-bands" id="ddBands"></div>
              <div class="dd-ground" id="ddGround"></div>
              <div class="dd-overlay-pills">
                <div class="dd-pill" id="ddPhasePill">Phase: Obstacles</div>
                <div class="dd-pill" id="ddStreakPill">Streak: 0</div>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}

        ${renderHelpOverlay("Tap or click to jump.<br><br>Obstacle phase: jump over hazards and gaps.<br><br>Word phase: choose top or bottom lane for the next word.<br><br>Build the whole verse, then collect the book, then the reference.")}
      </div>
    `;

    wireCommonNav();
    wireGameInput();
  }

  function renderComplete(){
    stopLoop();
    const doneText = selectedMode ? `${capitalize(selectedMode)} complete!` : "Complete!";
    app.innerHTML = `
      <div class="dd-mode-shell">
        <div class="dd-mode-stage">
          <div class="dd-mode-top">
            <div style="font-size:72px; line-height:1;">🏁</div>
            <div class="dd-mode-title">${doneText}</div>
            <div class="dd-mode-subtitle">You dashed through the verse.</div>
            <div class="dd-mode-card">
              <div class="dd-mode-actions">
                <button class="vm-btn" id="againBtn">Play Again</button>
                <button class="vm-btn vm-btn-dark" id="doneBtn">Done</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay("Great job! This completion is already recorded for your app progress.")}
      </div>
    `;

    document.getElementById("againBtn").onclick = () => startGame(selectedMode || "easy");
    document.getElementById("doneBtn").onclick = () => window.VerseGameBridge.exitGame();
    wireCommonNav();
  }

  function renderNav(){
    return `
      <div class="dd-nav-wrap">
        <div class="dd-nav">
          <button class="dd-nav-btn" id="homeBtn" aria-label="Home">${getHomeSvg()}</button>
          <div class="dd-nav-center">
            <button class="dd-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="dd-nav-btn" id="muteBtn" aria-label="Mute">${muted ? getMuteSvg() : getUnmuteSvg()}</button>
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(body){
    return `
      <div class="dd-help-overlay" id="ddHelpOverlay" aria-hidden="true">
        <div class="dd-help-dialog">
          <div class="dd-help-title">How to Play</div>
          <div class="dd-help-body">${body}</div>
          <div class="dd-help-actions">
            <button class="vm-btn" id="ddHelpCloseBtn">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpOverlay = document.getElementById("ddHelpOverlay");
    const helpCloseBtn = document.getElementById("ddHelpCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (helpBtn && helpOverlay) helpBtn.onclick = () => helpOverlay.classList.add("is-open");
    if (helpCloseBtn && helpOverlay) helpCloseBtn.onclick = () => helpOverlay.classList.remove("is-open");
    if (helpOverlay){
      helpOverlay.onclick = (e) => {
        if (e.target === helpOverlay) helpOverlay.classList.remove("is-open");
      };
    }
    if (muteBtn){
      muteBtn.onclick = () => {
        muted = !muted;
        muteBtn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      };
    }
  }

  function wireGameInput(){
    const field = document.getElementById("ddField");
    if (!field) return;
    const jumpHandler = (e) => {
      e.preventDefault();
      jump();
    };
    field.addEventListener("pointerdown", jumpHandler, { passive: false });
    field.addEventListener("touchstart", jumpHandler, { passive: false });
    window.addEventListener("resize", recalcField);
  }

  function startLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.lastTs = 0;
    state.running = true;
    state.rafId = requestAnimationFrame(loop);
  }

  function stopLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    state.running = false;
  }

  function loop(ts){
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.032, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    recalcField();
    updatePhase(dt, ts);
    updateClouds(dt);
    updateDecor(dt);
    updateGround(dt);
    updatePlayer(dt);
    updateWords(dt, ts);
    updateObstacles(dt, ts);
    updateParticles(dt);
    updateTrail(dt);
    renderFrame(ts);

    state.rafId = requestAnimationFrame(loop);
  }

  function recalcField(){
    const field = document.getElementById("ddField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;

    const t = clamp((rect.width - 360) / (840 - 360), 0, 1);
    state.scale = 1 + t * 0.34;
    state.gravity = state.gravityBase * state.scale;
    state.jumpVelocity = state.jumpVelocityBase * state.scale;
    state.groundHeight = Math.round((72 + t * 18) * state.scale);
    state.groundDepth = Math.round((28 + t * 8) * state.scale);
    state.fieldFloorY = state.fieldHeight - state.groundHeight;
    state.playerX = Math.max(76, state.fieldWidth * 0.22);
    state.laneBottomY = state.fieldFloorY - 28 * state.scale;
    state.laneTopY = Math.max(74 * state.scale, state.fieldFloorY - 128 * state.scale);
    state.worldSpeed = getObstacleSpeed();
    state.wordSpeed = getWordSpeed();

    if (!state.playerY) resetPlayer();
  }

  function resetPlayer(){
    state.playerVY = 0;
    state.playerY = state.fieldFloorY - getPlayerRadius();
  }

  function jump(){
    if (!state.running) return;
    const now = performance.now();
    if (now < state.inputLockUntil) return;
    const onGround = state.playerY >= state.fieldFloorY - getPlayerRadius() - 4;
    if (!onGround) return;
    state.playerVY = state.jumpVelocity;
    createJumpDust();
  }

  function updatePlayer(dt){
    state.playerVY += state.gravity * dt;
    state.playerY += state.playerVY * dt;
    state.bobTimer += dt;

    const support = getSupportYAtX(state.playerX);
    const radius = getPlayerRadius();
    const targetY = support - radius;

    if (support <= state.fieldHeight + 50 && state.playerY >= targetY){
      if (state.playerVY >= 0 || state.playerY < targetY + 18 * state.scale){
        if (state.playerVY > 220 * state.scale) createLandingDust();
        state.playerY = targetY;
        state.playerVY = 0;
      }
    }

    const topBound = 22 * state.scale;
    if (state.playerY < topBound){
      state.playerY = topBound;
      state.playerVY = 0;
    }
  }

  function updatePhase(dt, ts){
    state.spawnPause = Math.max(0, state.spawnPause - dt);

    if (getCurrentProgressPhase() === "done") return;

    const activeWords = state.activeWords.length;
    const activeObstacles = state.obstacles.length;

    if (state.currentPhase === "obstacle"){
      if (state.phaseRemaining <= 0 && activeObstacles === 0){
        switchToWordPhase(ts);
      } else if (state.spawnPause <= 0 && activeObstacles < 2 && state.phaseRemaining > 0){
        spawnObstacleOrGap();
      }
      return;
    }

    if (state.currentPhase === "word"){
      if (state.phaseRemaining <= 0 && activeWords === 0){
        switchToObstaclePhase(ts);
      } else if (state.spawnPause <= 0 && activeWords === 0 && state.phaseRemaining > 0){
        spawnWord();
      }
    }
  }

  function switchToWordPhase(ts){
    state.currentPhase = "word";
    state.phaseRemaining = getWordTargetCount();
    state.wordGoal = state.phaseRemaining;
    state.wordsResolved = 0;
    state.spawnPause = 0.8;
    state.phaseBannerUntil = ts + 1200;
    updatePills();
  }

  function switchToObstaclePhase(ts){
    if (getCurrentProgressPhase() === "done") return;
    state.currentPhase = "obstacle";
    state.phaseRemaining = getObstacleTargetCount();
    state.obstacleGoal = state.phaseRemaining;
    state.obstaclesResolved = 0;
    state.spawnPause = 0.95;
    state.phaseBannerUntil = ts + 1200;
    updatePills();
  }

  function getObstacleTargetCount(){
    if (selectedMode === "hard") return 5;
    if (selectedMode === "medium") return 4;
    return 3 + Math.round(Math.random());
  }

  function getWordTargetCount(){
    if (selectedMode === "hard") return 4;
    if (selectedMode === "medium") return 3;
    return 2 + Math.round(Math.random());
  }

  function seedClouds(){
    state.clouds = [];
    for (let i = 0; i < 4; i++){
      state.clouds.push({
        id: state.nextId++,
        x: state.fieldWidth * (0.18 + i * 0.22),
        y: 26 + Math.random() * Math.max(60, state.fieldHeight * 0.22),
        size: 24 + Math.random() * 28,
        opacity: 0.18 + Math.random() * 0.25,
        speed: 10 + Math.random() * 16
      });
    }
  }

  function updateClouds(dt){
    for (const item of state.clouds){
      item.x -= item.speed * dt;
    }
    state.clouds = state.clouds.filter(item => item.x > -120);
    while (state.clouds.length < 4){
      state.clouds.push({
        id: state.nextId++,
        x: state.fieldWidth + Math.random() * 80,
        y: 24 + Math.random() * Math.max(60, state.fieldHeight * 0.22),
        size: 24 + Math.random() * 28,
        opacity: 0.18 + Math.random() * 0.25,
        speed: 10 + Math.random() * 16
      });
    }
  }

  function seedDecor(){
    state.decor = [];
    for (let i = 0; i < 4; i++){
      state.decor.push(makeDecor(i === 0, i));
    }
  }

  function makeDecor(seed = false, index = 0){
    const set = state.theme?.decor || ["🌳"];
    return {
      id: state.nextId++,
      x: seed ? state.fieldWidth * (0.12 + index * 0.28) : state.fieldWidth + 50 + Math.random() * 120,
      y: Math.max(52, state.laneTopY - 48 * state.scale + Math.random() * 24 * state.scale),
      emoji: set[Math.floor(Math.random() * set.length)],
      size: (24 + Math.random() * 28) * state.scale,
      speed: state.worldSpeed * (0.24 + Math.random() * 0.12),
      opacity: 0.28 + Math.random() * 0.18
    };
  }

  function updateDecor(dt){
    for (const item of state.decor) item.x -= item.speed * dt;
    state.decor = state.decor.filter(item => item.x > -80);
    while (state.decor.length < 4){
      state.decor.push(makeDecor());
    }
  }

  function seedInitialGround(){
    state.groundSegments = [];
    state.bands = [];
    state.groundSpawnCursor = -80;
    state.bandSpawnCursor = -40;
    appendGroundSegment("ground", state.fieldWidth + 160, false);
    refillBands();
  }

  function appendGroundSegment(kind, width, forceExact = false){
    const seg = {
      id: state.nextId++,
      kind,
      x: state.groundSpawnCursor,
      width: Math.max(40, width)
    };
    state.groundSegments.push(seg);
    state.groundSpawnCursor += seg.width;

    if (!forceExact) refillBands();
    return seg;
  }

  function refillBands(){
    const bandWidth = 26 * state.scale;
    const spacing = bandWidth * 2;
    let cursor = state.bandSpawnCursor;
    while (cursor < state.fieldWidth + 90){
      const support = getSupportYAtX(cursor + bandWidth * 0.5, false);
      if (support < state.fieldHeight + 100){
        state.bands.push({
          id: state.nextId++,
          x: cursor,
          width: bandWidth,
          y: support,
          height: state.groundHeight + state.groundDepth
        });
      }
      cursor += spacing;
    }
    state.bandSpawnCursor = cursor;
  }

  function updateGround(dt){
    const speed = state.worldSpeed;
    for (const seg of state.groundSegments) seg.x -= speed * dt;
    for (const band of state.bands) band.x -= speed * dt;

    state.groundSegments = state.groundSegments.filter(seg => seg.x + seg.width > -140);
    state.bands = state.bands.filter(band => band.x + band.width > -60);

    if (state.groundSegments.length === 0){
      state.groundSpawnCursor = -40;
      appendGroundSegment("ground", state.fieldWidth + 180, true);
    }

    const rightEdge = Math.max(...state.groundSegments.map(seg => seg.x + seg.width));
    state.groundSpawnCursor = rightEdge;

    while (state.groundSpawnCursor < state.fieldWidth + 220){
      appendGroundSegment("ground", 220 * state.scale, true);
    }

    refillBands();
  }

  function spawnObstacleOrGap(){
    const wantsGap = Math.random() < 0.35;
    if (wantsGap){
      spawnGap();
    } else {
      spawnObstacle();
    }
  }

  function spawnGap(){
    const width = getGapWidth();
    const spacing = getObstacleSpacing();
    const startX = Math.max(
      state.fieldWidth + 120 * state.scale,
      getRightmostHazardEnd() + spacing
    );

    ensureGroundToRight(startX);

    if (state.groundSpawnCursor < startX){
      appendGroundSegment("ground", startX - state.groundSpawnCursor, true);
    }

    appendGroundSegment("gap", width, true);

    const landingPad = Math.max(
      150 * state.scale,
      spacing * 0.9
    );
    appendGroundSegment("ground", landingPad, true);

    state.lastHazardSpawnX = startX + width;
    state.phaseRemaining -= 1;
    state.spawnPause = 0.62 + Math.random() * 0.18;
  }

  function spawnObstacle(){
    const size = getObstacleSize();
    const spacing = getObstacleSpacing();
    const lane = Math.random() < 0.18 ? "top" : "ground";
    const emojiSet = lane === "top"
      ? (state.theme?.obstacleTop || ["☁️"])
      : (state.theme?.obstacleGround || ["🪨"]);

    const minX = Math.max(
      state.fieldWidth + 90 * state.scale,
      getRightmostHazardEnd() + spacing
    );

    ensureGroundToRight(minX + spacing + 160 * state.scale);

    const obstacleX = findGroundSpawnX(minX, size);

    state.obstacles.push({
      id: state.nextId++,
      kind: lane === "top" ? "top" : "ground",
      x: obstacleX,
      size,
      emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
      speed: state.worldSpeed,
      topY: lane === "top" ? state.laneTopY + 24 * state.scale : state.fieldFloorY + 2
    });

    state.lastHazardSpawnX = obstacleX;
    state.phaseRemaining -= 1;
    state.spawnPause = 0.58 + Math.random() * 0.18;
  }

  function getRightmostHazardEnd(){
    let rightmost = state.fieldWidth + 40 * state.scale;

    for (const obstacle of state.obstacles){
      rightmost = Math.max(rightmost, obstacle.x + obstacle.size * 0.45);
    }

    for (const seg of state.groundSegments){
      if (seg.kind === "gap"){
        rightmost = Math.max(rightmost, seg.x + seg.width);
      }
    }

    return Math.max(rightmost, state.lastHazardSpawnX || 0);
  }

  function findGroundSpawnX(minX, size){
    const margin = Math.max(26 * state.scale, size * 0.4);

    for (const seg of state.groundSegments){
      if (seg.kind !== "ground") continue;
      const left = seg.x + margin;
      const right = seg.x + seg.width - margin;
      if (right >= minX){
        return Math.max(minX, left);
      }
    }

    return minX;
  }

  function ensureGroundToRight(targetRight){
    const currentRight = state.groundSegments.length
      ? Math.max(...state.groundSegments.map(seg => seg.x + seg.width))
      : state.groundSpawnCursor;
    state.groundSpawnCursor = Math.max(state.groundSpawnCursor, currentRight);

    while (state.groundSpawnCursor < targetRight){
      appendGroundSegment("ground", 220 * state.scale, true);
    }
    refillBands();
  }

  function spawnWord(){
    const progressPhase = getCurrentProgressPhase();
    if (progressPhase === "done") return;

    const correctLabel = getCurrentCorrectLabel();
    const allowCorrect = Math.random() < getCorrectSpawnChance();
    const decoys = getDecoysForPhase(progressPhase, correctLabel, 3);
    const label = (allowCorrect || decoys.length === 0)
      ? correctLabel
      : decoys[Math.floor(Math.random() * decoys.length)];

    const lane = Math.random() < 0.5 ? "top" : "bottom";
    state.activeWords.push({
      id: state.nextId++,
      x: state.fieldWidth + 60,
      y: lane === "top" ? state.laneTopY : state.laneBottomY,
      lane,
      label,
      correct: normalizeWord(label) === normalizeWord(correctLabel),
      speed: state.wordSpeed,
      resolved: false
    });

    ensureGroundToRight(state.fieldWidth + 180);
    state.phaseRemaining -= 1;
    state.spawnPause = 0.55 + Math.random() * 0.22;
  }

  function updateWords(dt, ts){
    for (const word of state.activeWords) word.x -= word.speed * dt;

    let missedCorrect = false;
    for (const word of state.activeWords){
      if (word.x < -140 && word.correct && !word.resolved) missedCorrect = true;
    }

    state.activeWords = state.activeWords.filter(word => word.x > -160 && !word.resolved);

    if (missedCorrect){
      registerMistake(ts);
      state.wordsResolved += 1;
      updatePills();
      if (state.phaseRemaining <= 0 && state.activeWords.length === 0) switchToObstaclePhase(ts);
      return;
    }

    const playerRect = getPlayerRect();
    for (const word of state.activeWords){
      const halfW = getWordHitHalfWidth(word.label, word.lane);
      const rect = {
        x: word.x - halfW,
        y: word.y - (word.lane === "bottom" ? 18 : 22) * state.scale,
        w: halfW * 2,
        h: (word.lane === "bottom" ? 30 : 38) * state.scale
      };

      if (word.lane === "bottom"){
        const playerFeet = playerRect.y + playerRect.h;
        const clearAbove = playerFeet < word.y - 14 * state.scale;
        if (clearAbove) continue;
      }

      if (rectsOverlap(playerRect, rect)){
        word.resolved = true;
        state.wordsResolved += 1;
        if (word.correct){
          registerSuccess(ts, word.x, word.y);
          handleCorrectWord(ts);
        } else {
          registerMistake(ts);
        }
        updatePills();
        break;
      }
    }

    state.activeWords = state.activeWords.filter(word => !word.resolved && word.x > -160);
  }

  function updateObstacles(dt, ts){
    for (const obstacle of state.obstacles){
      obstacle.x -= obstacle.speed * dt;
    }

    const playerRect = getPlayerRect();
    let hit = null;

    for (const obstacle of state.obstacles){
      if (obstacle.kind === "ground"){
        const rect = {
          x: obstacle.x - obstacle.size * 0.24,
          y: state.fieldFloorY - obstacle.size * 0.86,
          w: obstacle.size * 0.48,
          h: obstacle.size * 0.82
        };
        if (rectsOverlap(playerRect, rect)) hit = obstacle;
      } else {
        const rect = {
          x: obstacle.x - obstacle.size * 0.22,
          y: state.laneTopY - obstacle.size * 0.45,
          w: obstacle.size * 0.44,
          h: obstacle.size * 0.44
        };
        if (rectsOverlap(playerRect, rect)) hit = obstacle;
      }
    }

    if (!hit && isPlayerFallingIntoGap()){
      hit = { id: -1, kind: "gap" };
    }

    if (hit && performance.now() >= state.inputLockUntil){
      handleObstacleHit(ts, hit.id);
      return;
    }

    let resolved = 0;
    state.obstacles = state.obstacles.filter(obstacle => {
      if (obstacle.x < -100){
        resolved += 1;
        return false;
      }
      return true;
    });

    if (resolved > 0){
      state.obstaclesResolved += resolved;
      updatePills();
      if (state.phaseRemaining <= 0 && state.obstacles.length === 0) switchToWordPhase(ts);
    }
  }

  function handleObstacleHit(ts, obstacleId){
    if (obstacleId !== -1){
      state.obstacles = state.obstacles.filter(item => item.id !== obstacleId);
    }
    registerMistake(ts);
    state.inputLockUntil = performance.now() + 650;
    state.playerVY = Math.min(state.playerVY, -280 * state.scale);
    state.obstaclesResolved += 1;
    updatePills();

    const safeY = Math.min(getSupportYAtX(state.playerX + 24 * state.scale), getSupportYAtX(state.playerX - 24 * state.scale));
    if (safeY <= state.fieldHeight + 50) state.playerY = Math.min(state.playerY, safeY - getPlayerRadius());

    if (state.phaseRemaining <= 0 && state.obstacles.length === 0) switchToWordPhase(ts);
  }

  function handleCorrectWord(ts){
    state.progressIndex += 1;
    state.streak += 1;
    updateBuildText();
    updatePills();

    if (getCurrentProgressPhase() === "done"){
      finishRun();
      return;
    }

    if (state.phaseRemaining <= 0 && state.activeWords.length === 0){
      switchToObstaclePhase(ts);
    }
  }

  function registerMistake(ts){
    state.streak = 0;
    state.flashUntil = ts + 170;
    state.shakeUntil = ts + 260;
    updatePills();

    const build = document.getElementById("ddBuild");
    if (build){
      build.classList.remove("dd-shake");
      void build.offsetWidth;
      build.classList.add("dd-shake");
    }

    for (let i = 0; i < 6; i++){
      state.particles.push({
        id: state.nextId++,
        type: "bad",
        x: state.playerX + (Math.random() * 18 - 9),
        y: state.playerY + (Math.random() * 18 - 9),
        vx: -60 + Math.random() * 120,
        vy: -80 + Math.random() * 70,
        size: 12 + Math.random() * 10,
        life: 0.34 + Math.random() * 0.12,
        age: 0,
        emoji: "💥"
      });
    }
  }

  function registerSuccess(ts, x, y){
    state.successFlashUntil = ts + 130;
    for (let i = 0; i < 8; i++){
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 70 + Math.random() * 60;
      state.particles.push({
        id: state.nextId++,
        type: "good",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 8,
        life: 0.28 + Math.random() * 0.1,
        age: 0,
        emoji: state.streak >= 5 ? "✨" : "⭐"
      });
    }
  }

  function createJumpDust(){
    const baseY = state.fieldFloorY - 8 * state.scale;
    for (let i = 0; i < 4; i++){
      state.particles.push({
        id: state.nextId++,
        type: "dust",
        x: state.playerX - 18 * state.scale + Math.random() * 20,
        y: baseY + Math.random() * 10,
        vx: -70 - Math.random() * 60,
        vy: -18 + Math.random() * 16,
        size: 11 + Math.random() * 8,
        life: 0.34 + Math.random() * 0.14,
        age: 0,
        emoji: "💨"
      });
    }
  }

  function createLandingDust(){
    const baseY = state.fieldFloorY - 8 * state.scale;
    for (let i = 0; i < 5; i++){
      state.particles.push({
        id: state.nextId++,
        type: "dust",
        x: state.playerX - 14 * state.scale + Math.random() * 28,
        y: baseY + Math.random() * 10,
        vx: -85 - Math.random() * 50,
        vy: -12 + Math.random() * 12,
        size: 12 + Math.random() * 8,
        life: 0.38 + Math.random() * 0.12,
        age: 0,
        emoji: "💨"
      });
    }
  }

  function updateParticles(dt){
    for (const particle of state.particles){
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.99;
    }
    state.particles = state.particles.filter(particle => particle.age < particle.life);
  }

  function updateTrail(dt){
    if (state.streak >= 4){
      state.trail.push({
        id: state.nextId++,
        x: state.playerX - 12 * state.scale,
        y: state.playerY + 4 * state.scale,
        age: 0,
        life: 0.28 + Math.min(0.22, state.streak * 0.01),
        emoji: state.streak >= 10 ? "🌈" : state.streak >= 7 ? "✨" : "⭐",
        size: 10 + Math.min(18, state.streak * 1.1)
      });
    }

    for (const item of state.trail){
      item.age += dt;
      item.x -= (80 + state.streak * 5) * state.scale * dt;
    }
    state.trail = state.trail.filter(item => item.age < item.life);
  }

  async function finishRun(){
    if (completed) return;
    completed = true;
    state.running = false;

    try {
      await window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode
      });
    } catch (err) {
      console.error("markCompleted failed", err);
    }

    renderComplete();
  }

  function renderFrame(ts){
    renderBuildShake(ts);
    renderClouds();
    renderDecor();
    renderTrail();
    renderParticles();
    renderWords();
    renderObstacles();
    renderGround();
    renderBands();
    renderPlayer();
    renderFeedback(ts);
  }

  function renderBuildShake(ts){
    const build = document.getElementById("ddBuild");
    if (!build) return;
    if (ts > state.shakeUntil) build.classList.remove("dd-shake");
  }

  function renderClouds(){
    const layer = document.getElementById("ddClouds");
    if (!layer) return;
    const emoji = state.theme?.cloud || "☁️";
    layer.innerHTML = state.clouds.map(item => `
      <div class="dd-cloud" style="left:${item.x}px; top:${item.y}px; font-size:${item.size}px; opacity:${item.opacity};">${emoji}</div>
    `).join("");
  }

  function renderDecor(){
    const layer = document.getElementById("ddBackdrop");
    if (!layer) return;
    layer.innerHTML = state.decor.map(item => `
      <div class="dd-back-emoji" style="left:${item.x}px; top:${item.y}px; font-size:${item.size}px; opacity:${item.opacity};">${item.emoji}</div>
    `).join("");
  }

  function renderTrail(){
    const layer = document.getElementById("ddTrails");
    if (!layer) return;
    layer.innerHTML = state.trail.map(item => `
      <div class="dd-trail" style="left:${item.x}px; top:${item.y}px; font-size:${item.size}px; opacity:${1 - item.age / item.life};">${item.emoji}</div>
    `).join("");
  }

  function renderParticles(){
    const layer = document.getElementById("ddParticles");
    if (!layer) return;
    layer.innerHTML = state.particles.map(item => `
      <div class="dd-particle" style="left:${item.x}px; top:${item.y}px; font-size:${item.size}px; opacity:${1 - item.age / item.life};">${item.emoji}</div>
    `).join("");
  }

  function renderWords(){
    const layer = document.getElementById("ddWords");
    if (!layer) return;
    layer.innerHTML = state.activeWords.map(word => `
      <div class="dd-word ${word.correct ? "is-correct" : "is-decoy"}" style="left:${word.x}px; top:${word.y}px;">
        <div class="dd-word-bubble">${escapeHtml(word.label)}</div>
      </div>
    `).join("");
  }

  function renderObstacles(){
    const layer = document.getElementById("ddObstacles");
    if (!layer) return;
    layer.innerHTML = state.obstacles.map(item => `
      <div class="dd-obstacle" style="left:${item.x}px; top:${item.kind === "ground" ? state.fieldFloorY + 2 : state.laneTopY + item.size * 0.1}px; font-size:${item.size}px;">${item.emoji}</div>
    `).join("");
  }

  function renderGround(){
    const layer = document.getElementById("ddGround");
    if (!layer) return;
    const pieces = [];
    for (const seg of state.groundSegments){
      if (seg.kind === "ground"){
        pieces.push(`
          <div class="dd-ground-piece" style="left:${seg.x}px; top:${state.fieldFloorY}px; width:${seg.width}px; height:${state.groundHeight + state.groundDepth}px;"></div>
        `);
      } else {
        pieces.push(`
          <div class="dd-gap-hole" style="left:${seg.x}px; top:${state.fieldFloorY}px; width:${seg.width}px; height:${state.groundHeight + state.groundDepth}px;"></div>
        `);
      }
    }
    layer.innerHTML = pieces.join("");
  }

  function renderBands(){
    const layer = document.getElementById("ddBands");
    if (!layer) return;
    layer.innerHTML = state.bands.map(band => `
      <div class="dd-band" style="left:${band.x}px; top:${state.fieldFloorY}px; width:${band.width}px; height:${state.groundHeight + state.groundDepth}px; background:${state.theme?.bandColor || 'rgba(0,0,0,0.08)'};"></div>
    `).join("");
  }

  function renderPlayer(){
    const player = document.getElementById("ddPlayer");
    if (!player) return;
    const size = state.playerBaseSize * state.scale;
    const groundY = state.fieldFloorY - getPlayerRadius();
    const onGround = Math.abs(state.playerY - groundY) < 3;
    const bob = onGround ? Math.sin(state.bobTimer * 11) * (2.6 * state.scale) : 0;
    const angle = onGround ? Math.sin(state.bobTimer * 12) * 2 : clamp(state.playerVY / 16, -22, 28);

    player.style.left = `${state.playerX}px`;
    player.style.top = `${state.playerY + bob}px`;
    player.style.fontSize = `${size}px`;
    player.style.transform = `translate(-50%, -50%) scaleX(-1) rotate(${angle}deg)`;
  }

  function renderFeedback(ts){
    const flash = document.getElementById("ddFlash");
    const banner = document.getElementById("ddPhaseBanner");
    if (flash){
      if (ts <= state.flashUntil){
        flash.classList.add("is-on");
        flash.style.background = "rgba(255, 90, 81, 0.34)";
      } else if (ts <= state.successFlashUntil){
        flash.classList.add("is-on");
        flash.style.background = "rgba(167, 203, 111, 0.28)";
      } else {
        flash.classList.remove("is-on");
      }
    }
    if (banner){
      if (ts <= state.phaseBannerUntil){
        banner.style.display = "block";
        banner.textContent = state.currentPhase === "obstacle" ? "Obstacle phase" : "Word phase";
      } else {
        banner.style.display = "none";
      }
    }
  }

  function updateBuildText(){
    const el = document.getElementById("ddBuildText");
    if (!el) return;
    el.innerHTML = state.buildSegments.map((segment, index) => `
      <span class="dd-build-word ${index < state.progressIndex ? "is-built" : ""}">${escapeHtml(segment)}</span>
    `).join(" ");
  }

  function updatePills(){
    const streakPill = document.getElementById("ddStreakPill");
    const phasePill = document.getElementById("ddPhasePill");
    if (streakPill){
      let flair = "";
      if (state.streak >= 10) flair = " 🌈";
      else if (state.streak >= 5) flair = " ✨";
      streakPill.textContent = `Streak: ${state.streak}${flair}`;
    }
    if (phasePill){
      if (state.currentPhase === "obstacle"){
        phasePill.textContent = `Phase: Obstacles ${Math.max(0, state.phaseRemaining + state.obstacles.length)}`;
      } else {
        phasePill.textContent = `Phase: Words ${Math.max(0, state.phaseRemaining + state.activeWords.length)}`;
      }
    }
  }

  function getCurrentProgressPhase(){
    const wordCount = state.verseWords.length;
    if (state.progressIndex < wordCount) return "words";
    if (state.progressIndex === wordCount && state.bookLabel) return "book";
    if (state.progressIndex === wordCount + (state.bookLabel ? 1 : 0) && state.referenceLabel) return "reference";
    return "done";
  }

  function getCurrentCorrectLabel(){
    return state.buildSegments[state.progressIndex] || "";
  }

  function getCorrectSpawnChance(){
    if (selectedMode === "hard") return 0.42;
    if (selectedMode === "medium") return 0.52;
    return 0.62;
  }

  function getObstacleSpeed(){
    const base = selectedMode === "hard" ? 290 : selectedMode === "medium" ? 250 : 220;
    return base * state.scale;
  }

  function getWordSpeed(){
    const base = selectedMode === "hard" ? 205 : selectedMode === "medium" ? 184 : 168;
    return base * state.scale;
  }

  function getObstacleSpacing(){
    return (selectedMode === "hard" ? 190 : selectedMode === "medium" ? 220 : 250) * state.scale;
  }

  function getGapWidth(){
    return (selectedMode === "hard" ? 120 : selectedMode === "medium" ? 108 : 96) * state.scale;
  }

  function getObstacleSize(){
    const base = selectedMode === "hard" ? 54 : selectedMode === "medium" ? 58 : 62;
    return base * state.scale;
  }

  function getPlayerRadius(){
    return state.playerBaseSize * state.scale * 0.36;
  }

  function getPlayerRect(){
    const radius = getPlayerRadius();
    return {
      x: state.playerX - radius * 0.68,
      y: state.playerY - radius * 0.95,
      w: radius * 1.36,
      h: radius * 1.8
    };
  }

  function getWordHalfWidth(label){
    return Math.max(38 * state.scale, Math.min(118 * state.scale, (String(label || "").length * 9 + 30) * state.scale * 0.52));
  }

  function getWordHitHalfWidth(label, lane){
    const text = String(label || "");
    const base = lane === "bottom" ? 54 : 62;
    const perChar = lane === "bottom" ? 3.4 : 4.2;
    return Math.max(
      34 * state.scale,
      Math.min(base * state.scale, (text.length * perChar + 22) * state.scale)
    );
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = new Set();

    if (phase === "words"){
      const verseWords = state.verseWords.map(normalizeWord);
      for (const word of shuffle(FUN_DECOYS)){
        if (out.size >= count) break;
        if (!verseWords.includes(normalizeWord(word)) && normalizeWord(word) !== normalizeWord(correctLabel)) out.add(word);
      }
      for (const word of shuffle(state.verseWords)){
        if (out.size >= count) break;
        if (normalizeWord(word) !== normalizeWord(correctLabel)) out.add(word);
      }
    }

    if (phase === "book"){
      for (const book of shuffle(BOOKS)){
        if (out.size >= count) break;
        if (book !== correctLabel) out.add(book);
      }
    }

    if (phase === "reference"){
      const clean = String(correctLabel || "").match(/^(\d+):(\d+)(?:-(\d+))?$/);
      const chapter = clean ? Number(clean[1]) : 1;
      const verse = clean ? Number(clean[2]) : 1;
      let tries = 0;
      while (out.size < count && tries < 40){
        tries++;
        const c = Math.max(1, chapter + Math.floor(Math.random() * 5) - 2);
        const v = Math.max(1, verse + Math.floor(Math.random() * 9) - 4);
        const label = `${c}:${v}`;
        if (label !== correctLabel) out.add(label);
      }
    }

    return Array.from(out).slice(0, count);
  }

  function getSupportYAtX(x, includeGapsAsFloor = true){
    const seg = state.groundSegments.find(item => x >= item.x && x <= item.x + item.width);
    if (!seg) return state.fieldFloorY;
    if (seg.kind === "gap") return includeGapsAsFloor ? state.fieldHeight + 300 : state.fieldHeight + 300;
    return state.fieldFloorY;
  }

  function isPlayerFallingIntoGap(){
    const radius = getPlayerRadius();
    const left = state.playerX - radius * 0.42;
    const right = state.playerX + radius * 0.42;
    const leftSupport = getSupportYAtX(left);
    const rightSupport = getSupportYAtX(right);
    const overGap = leftSupport > state.fieldHeight && rightSupport > state.fieldHeight;

    if (!overGap) return false;

    const feetY = state.playerY + radius;
    const lipY = state.fieldFloorY - 4 * state.scale;

    return feetY >= lipY;
  }

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
  }

  function normalizeWord(word){
    return String(word || "").toLowerCase().replace(/[^a-z0-9']/g, "");
  }

  function rectsOverlap(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  function capitalize(str){
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of", "the"]);
    return String(slug || "")
      .split("_")
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        if (index > 0 && smallWords.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();

    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch){
      return {
        book: titleCaseBookFromSlug(idRangeMatch[1]),
        reference: `${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}`
      };
    }

    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch){
      return {
        book: titleCaseBookFromSlug(idMatch[1]),
        reference: `${idMatch[2]}:${idMatch[3]}`
      };
    }

    let raw = String(ref || "").trim();
    const trans = String(translation || "").trim();
    if (trans){
      raw = raw.replace(new RegExp(`\\s*\\(?${trans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)?\\s*$`, "i"), "").trim();
    }

    const match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
    if (match){
      return { book: match[1].trim(), reference: match[2].trim() };
    }

    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0){
      return { book: raw.slice(0, lastSpace).trim(), reference: raw.slice(lastSpace + 1).trim() };
    }

    return { book: raw, reference: "" };
  }

  function getHomeSvg(){
    return `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/></svg>`;
  }

  function getMuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg"><path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round" d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z"/><g transform="translate(-26.458334,-255.59263)"><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round" d="M 1241.4124,524.69155 890.61025,875.49365"/><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round" d="m 890.61025,524.69155 350.80215,350.8021"/></g></svg>`;
  }

  function getUnmuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg"><path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round" d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z"/><path style="fill:none;stroke:#ffffff;stroke-width:63;stroke-linecap:round" d="M 877 307 Q 982 444 877 582"/><path style="fill:none;stroke:#ffffff;stroke-width:63;stroke-linecap:round" d="M 959 241 Q 1111 444 959 648"/></svg>`;
  }
})();
