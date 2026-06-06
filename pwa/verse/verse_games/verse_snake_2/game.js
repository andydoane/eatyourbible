(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_snake_2";
  const GAME_TITLE = "Verse Slither";
  const HELP_OVERLAY_ID = "vslHelpOverlay";

  const GAME_THEME = {
    bg: "#333333",
    accent: "#333333"
  };

  const SLITHER_TUNING = {
    maxStageWidth: 840,
    speeds: { easy: 128, medium: 142, hard: 156 },
    turnRate: { easy: 4.0, medium: 3.7, hard: 3.45 },
    spawnDistanceScreens: { easy: 1.12, medium: 1.32, hard: 1.48 },
    pairSeparationScreen: { easy: 0.20, medium: 0.23, hard: 0.26 },
    pairRoamScreen: { easy: 0.10, medium: 0.12, hard: 0.14 },
    targetMinScreenDistance: 0.95,
    wrongFleeSpeeds: { easy: 54, medium: 72, hard: 92 },
    wrongFleeMaxScreenDistance: 1.22,
    encounterMaxDistanceScreens: 1.1,
    patternScrollFactor: 1.35,
    fruitChance: 0.62
  };

  const FRUIT_EMOJIS = ["🍎","🍓","🍇","🍊","🍉","🍒","🍑","🍍","🥝","🍋"];
  const SNAKE_STYLES = ["default", "berry", "ocean", "sun", "lava", "ice"];

  let selectedMode = null;
  let muted = false;
  let completed = false;
  let completionResult = null;

  const state = {
    rafId: 0,
    running: false,
    paused: false,
    pauseReason: "",
    pauseStartedAt: 0,
    flashText: "",
    flashUntil: 0,
    happyUntil: 0,
    pickupPops: [],
    snakeStyle: "default",
    snakeStyleIndex: 0,
    fruitCount: 0,
    fieldWidth: 1,
    fieldHeight: 1,
    camera: { x: 0, y: 0 },
    pointer: { x: 0, y: -140, active: false },
    head: { x: 0, y: 0, angle: -Math.PI / 2, speed: 130 },
    trail: [],
    snakeLengthPx: 440,
    words: [],
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    segments: [],
    progressIndex: 0,
    encounter: null,
    targets: [],
    fruit: null,
    nextTargetId: 1,
    lastSpawnAngle: -Math.PI / 2
  };

  const clamp = window.VerseGameShell.clamp;

  function helpHtml(){
    return `
      <p>Guide the snake by pointing where you want it to slither.</p>
      <p>Follow the arrow to find each word pair. Eat the correct next word to build the verse.</p>
      <p>Fruit changes your snake color for fun.</p>
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
      id: "vslGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    window.onkeydown = null;
    window.onkeyup = null;
    window.onpointermove = null;
  }

  function setPaused(paused, reason = ""){
    if (paused){
      if (state.paused) return;
      state.paused = true;
      state.pauseReason = reason;
      state.pauseStartedAt = performance.now();
      return;
    }

    if (!state.paused) return;
    const deltaMs = performance.now() - (state.pauseStartedAt || performance.now());
    state.paused = false;
    state.pauseReason = "";
    state.pauseStartedAt = 0;
    if (state.flashUntil) state.flashUntil += deltaMs;
    if (state.happyUntil) state.happyUntil += deltaMs;
  }

  function openGameMenu(){
    const menuOverlay = document.getElementById("vslGameMenuOverlay");
    if (!menuOverlay) return;
    setPaused(true, "menu");
    menuOverlay.classList.add("is-open");
    menuOverlay.setAttribute("aria-hidden", "false");
  }

  function openHelpFromMenu(){
    const menuOverlay = document.getElementById("vslGameMenuOverlay");
    if (menuOverlay){
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    }
    window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
    setPaused(true, "help");
  }

  function renderIntroScreen(){
    stopLoop();
    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
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
      backLabel: `Back to ${GAME_TITLE} title`,
      onBack: renderIntroScreen,
      onSelect: (mode) => {
        selectedMode = mode;
        completed = false;
        completionResult = null;
        renderGameScreen();
      }
    });
  }

  function renderGameScreen(){
    stopLoop();
    resetStateForRun();

    app.innerHTML = `
      <div class="vsl-root">
        <div class="vsl-stage">
          <div class="vsl-build-shell">
            <div class="vsl-build-line" id="vslBuildLine">
              <div class="vsl-build-track" id="vslBuildTrack"></div>
            </div>
          </div>

          <div class="vsl-field-wrap">
            <div class="vsl-field" id="vslField">
              <div class="vsl-pattern-layer" id="vslPatternLayer"></div>

              <div class="vsl-overlay-pills">
                <button class="vsl-pill vsl-menu-pill no-zoom" id="vslMenuPill" aria-label="Game Menu" type="button">☰</button>
                <div class="vsl-pill vsl-mode-pill" id="vslModePill">${modeLabel()}</div>
              </div>

              <div class="vsl-fruit-layer" id="vslFruitLayer"></div>
              <div class="vsl-target-layer" id="vslTargetLayer"></div>
              <div class="vsl-pickup-pop-layer" id="vslPickupPopLayer"></div>
              <div class="vsl-arrow-layer"><div class="vsl-arrow" id="vslArrow"></div></div>
              <div class="vsl-flash-message" id="vslFlashMessage"></div>

              <svg class="vsl-svg" id="vslSvg" aria-hidden="true">
                <g id="vslSnakeGroup" class="vsl-snake-style-default">
                  <path class="vsl-snake-body" id="vslSnakeBody" d=""></path>
                  <path class="vsl-snake-body-2" id="vslSnakeBodyStripe" d=""></path>
                  <g id="vslSnakeHeadGroup">
                    <circle class="vsl-snake-head" id="vslSnakeHead" cx="0" cy="0" r="22"></circle>
                    <circle class="vsl-snake-eye" id="vslSnakeEyeLeft" cx="-8" cy="-6" r="5"></circle>
                    <circle class="vsl-snake-eye" id="vslSnakeEyeRight" cx="8" cy="-6" r="5"></circle>
                    <circle class="vsl-snake-pupil" id="vslSnakePupilLeft" cx="-8" cy="-6" r="2.1"></circle>
                    <circle class="vsl-snake-pupil" id="vslSnakePupilRight" cx="8" cy="-6" r="2.1"></circle>
                    <path class="vsl-snake-tongue" id="vslSnakeTongue" d=""></path>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>
    `;

    wireGameControls();

    requestAnimationFrame(() => {
      initializeGame();
      startLoop();
    });
  }

  function wireGameControls(){
    const field = document.getElementById("vslField");
    const menuPill = document.getElementById("vslMenuPill");

    if (menuPill){
      menuPill.onclick = (e) => {
        e.stopPropagation();
        openGameMenu();
      };
    }

    if (field){
      const updatePointer = (clientX, clientY) => {
        const rect = field.getBoundingClientRect();
        state.pointer.x = clientX - rect.left - rect.width / 2;
        state.pointer.y = clientY - rect.top - rect.height / 2;
        state.pointer.active = true;
      };

      field.addEventListener("pointerdown", (e) => {
        if (state.paused) return;
        e.preventDefault();
        field.setPointerCapture?.(e.pointerId);
        updatePointer(e.clientX, e.clientY);
      });

      field.addEventListener("pointermove", (e) => {
        if (state.paused) return;
        if (e.pointerType !== "mouse" && !e.isPrimary) return;
        updatePointer(e.clientX, e.clientY);
      });

      field.addEventListener("pointerup", (e) => {
        field.releasePointerCapture?.(e.pointerId);
      });

      field.addEventListener("pointercancel", (e) => {
        field.releasePointerCapture?.(e.pointerId);
      });
    }

    window.VerseGameShell.wireGameMenu({
      id: "vslGameMenuOverlay",
      menuButtonId: "vslMenuPill",
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
  }

  function resetStateForRun(){
    state.running = false;
    state.paused = false;
    state.pauseReason = "";
    state.flashText = "";
    state.flashUntil = 0;
    state.happyUntil = 0;
    state.pickupPops = [];
    state.snakeStyle = "default";
    state.snakeStyleIndex = 0;
    state.fruitCount = 0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.pointer.x = 0;
    state.pointer.y = -140;
    state.pointer.active = false;
    state.head.x = 0;
    state.head.y = 0;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getCurrentSpeed();
    state.trail = [];
    state.progressIndex = 0;
    state.encounter = null;
    state.targets = [];
    state.fruit = null;
    state.nextTargetId = 1;
    state.lastSpawnAngle = -Math.PI / 2;
  }

  function initializeGame(){
    syncFieldMetrics();

    const refParts = window.VerseGameShell.parseReferenceParts(
      ctx.verseRef || launch.ref || "",
      ctx.translation,
      ctx.verseId || launch.verseId || ""
    );

    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: refParts.book,
      reference: refParts.reference,
      buildArea: "compact"
    });

    state.words = buildData.words;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.referenceMeta = refParts;
    state.segments = buildData.segments;

    state.snakeLengthPx = Math.max(240, Math.min(Math.min(state.fieldWidth, state.fieldHeight) * 0.72, 560));
    seedTrail();
    updateBuildHud();
    spawnEncounter();
    maybeSpawnFruit(true);
    renderTargets();
    renderFruit();
    drawSnake();
  }

  function syncFieldMetrics(){
    const field = document.getElementById("vslField");
    const svg = document.getElementById("vslSvg");
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
        keepObjectiveWithinRange();
        updateEncounter(dt, ts);
        updateFruit(dt, ts);
        checkCollisions(ts);
        maybeRecenterWorld();
      }

      updateCamera();
      updatePatternLayer();
      updateBuildHudShift();
      drawSnake();
      renderTargets();
      renderFruit();
      renderPickupPops(ts);
      renderArrow();
      renderFlash(ts);
      state.rafId = requestAnimationFrame(tick);
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function getCurrentSpeed(){
    return SLITHER_TUNING.speeds[selectedMode] || SLITHER_TUNING.speeds.medium;
  }

  function getCurrentTurnRate(){
    return SLITHER_TUNING.turnRate[selectedMode] || SLITHER_TUNING.turnRate.medium;
  }

  function getWrongFleeSpeed() {
    return SLITHER_TUNING.wrongFleeSpeeds[selectedMode] || SLITHER_TUNING.wrongFleeSpeeds.medium;
  }

  function seedTrail(){
    state.trail = [];
    const step = 8;
    for (let i = 0; i < state.snakeLengthPx; i += step){
      state.trail.push({ x: state.head.x, y: state.head.y + i });
    }
  }

  function updateMotion(dt){
    const aimAngle = Math.atan2(state.pointer.y, state.pointer.x);
    const diff = angleDelta(state.head.angle, aimAngle);
    const maxTurn = getCurrentTurnRate() * (dt / 1000);
    state.head.angle += clamp(diff, -maxTurn, maxTurn);
    state.head.speed = getCurrentSpeed();

    state.head.x += Math.cos(state.head.angle) * state.head.speed * (dt / 1000);
    state.head.y += Math.sin(state.head.angle) * state.head.speed * (dt / 1000);

    state.trail.unshift({ x: state.head.x, y: state.head.y });
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
        total += Math.hypot(p.x - prev.x, p.y - prev.y);
      }
      if (total >= state.snakeLengthPx) break;
    }

    state.trail = trimmed;
  }

  function updateCamera(){
    state.camera.x = state.head.x - state.fieldWidth / 2;
    state.camera.y = state.head.y - state.fieldHeight / 2;
  }

  function updatePatternLayer() {
    const layer = document.getElementById("vslPatternLayer");
    if (!layer) return;

    const head = document.getElementById("vslSnakeHead");
    const headRadius = head ? Number(head.getAttribute("r")) || 22 : 22;
    const headHeight = headRadius * 2;

    const tileHeight = Math.round(headHeight / 0.14);
    const tileWidth = Math.round(tileHeight * (471.133 / 408.010));
    const scrollFactor = SLITHER_TUNING.patternScrollFactor || 1;

    const x = -Math.round(mod(state.camera.x * scrollFactor, tileWidth));
    const y = -Math.round(mod(state.camera.y * scrollFactor, tileHeight));

    layer.style.setProperty("--vsl-pattern-w", `${tileWidth}px`);
    layer.style.setProperty("--vsl-pattern-h", `${tileHeight}px`);
    layer.style.setProperty("--vsl-pattern-x", `${x}px`);
    layer.style.setProperty("--vsl-pattern-y", `${y}px`);
  }

  function worldToScreen(p){
    return {
      x: p.x - state.camera.x,
      y: p.y - state.camera.y
    };
  }

  function screenDiagonal(){
    return Math.hypot(state.fieldWidth, state.fieldHeight);
  }

  function normalizeWord(value){
    return String(value || "").trim().toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^a-z0-9']/g, "");
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

  function getChoicesForCurrentPhase(){
    const phase = getCurrentPhase();
    const correct = getCurrentCorrectLabel();

    if (phase === "words"){
      const decoys = selectedMode === "easy"
        ? window.VerseGameShell.getFunWordDecoys(correct, state.words, 1)
        : window.VerseGameShell.getVerseWordDecoys({
            words: state.words,
            correct,
            targetIndex: state.progressIndex,
            count: 1,
            avoidNext: 2,
            fallbackToFun: true
          });
      return [
        { word: correct, isCorrect: true },
        { word: decoys[0] || "apple", isCorrect: false }
      ];
    }

    if (phase === "book"){
      const decoys = window.VerseGameShell.getBookDecoys(state.bookLabel, 1);
      return [
        { word: correct, isCorrect: true },
        { word: decoys[0] || "Psalm", isCorrect: false }
      ];
    }

    if (phase === "reference"){
      const decoys = window.VerseGameShell.getReferenceDecoys(state.referenceMeta, selectedMode, 1)
        .filter((ref) => normalizeWord(ref) !== normalizeWord(correct));
      return [
        { word: correct, isCorrect: true },
        { word: decoys[0] || "1:1", isCorrect: false }
      ];
    }

    return [];
  }

  function spawnEncounter(){
    if (state.progressIndex >= state.segments.length){
      finishGame();
      return;
    }

    const choices = getChoicesForCurrentPhase();
    if (choices.length < 2) return;

    let angle = randomAngleAwayFrom(state.lastSpawnAngle);
    const scale = Math.max(state.fieldWidth, state.fieldHeight);
    const modeFactor = SLITHER_TUNING.spawnDistanceScreens[selectedMode] || 1.32;
    const distance = scale * (modeFactor + Math.random() * 0.28);
    const center = {
      x: state.head.x + Math.cos(angle) * distance,
      y: state.head.y + Math.sin(angle) * distance
    };

    state.lastSpawnAngle = angle;
    state.encounter = {
      center,
      baseCenter: { ...center },
      driftAngle: angle + Math.PI / 2,
      driftPhase: Math.random() * Math.PI * 2,
      bornAt: performance.now(),
      collapsed: false
    };

    const separation = clamp(
      Math.min(state.fieldWidth, state.fieldHeight) * (SLITHER_TUNING.pairSeparationScreen[selectedMode] || 0.23),
      106,
      190
    );
    const sideAngle = angle + Math.PI / 2 + (Math.random() < 0.5 ? 0 : Math.PI);

    state.targets = shuffle(choices).map((choice, index) => {
      const sign = index === 0 ? -1 : 1;
      return {
        id: state.nextTargetId++,
        word: choice.word,
        isCorrect: choice.isCorrect,
        x: center.x + Math.cos(sideAngle) * separation * 0.5 * sign,
        y: center.y + Math.sin(sideAngle) * separation * 0.5 * sign,
        anchorX: center.x,
        anchorY: center.y,
        offsetAngle: sideAngle + (sign < 0 ? Math.PI : 0),
        baseOffset: separation * 0.5,
        phase: Math.random() * Math.PI * 2,
        wiggle: 0,
        r: estimateTargetRadius(choice.word),
        wrongHitUntil: 0,
        fleeing: false,
        fleeAngle: 0,
        freeAnchor: null
      };
    });

    maybeSpawnFruit(false);
  }

  function keepObjectiveWithinRange() {
    const maxDist = Math.max(state.fieldWidth, state.fieldHeight) * (SLITHER_TUNING.encounterMaxDistanceScreens || 1.85);

    if (state.encounter && !state.encounter.collapsed) {
      const dx = state.encounter.baseCenter.x - state.head.x;
      const dy = state.encounter.baseCenter.y - state.head.y;
      const dist = Math.hypot(dx, dy);

      if (dist > maxDist) {
        const ux = dx / dist;
        const uy = dy / dist;
        const newBase = {
          x: state.head.x + ux * maxDist,
          y: state.head.y + uy * maxDist
        };

        const moveX = newBase.x - state.encounter.baseCenter.x;
        const moveY = newBase.y - state.encounter.baseCenter.y;

        state.encounter.baseCenter.x += moveX;
        state.encounter.baseCenter.y += moveY;
        state.encounter.center.x += moveX;
        state.encounter.center.y += moveY;

        for (const target of state.targets) {
          if (target.fleeing) continue;
          target.anchorX += moveX;
          target.anchorY += moveY;
        }

        if (state.fruit) {
          const fruitDist = Math.hypot(state.fruit.x - state.head.x, state.fruit.y - state.head.y);
          if (fruitDist > maxDist * 1.1) {
            state.fruit.x += moveX;
            state.fruit.y += moveY;
          }
        }
      }

      return;
    }

    const correct = state.targets.find((target) => target.isCorrect);
    if (!correct || correct.fleeing) return;

    const anchor = correct.freeAnchor || correct;
    const dx = anchor.x - state.head.x;
    const dy = anchor.y - state.head.y;
    const dist = Math.hypot(dx, dy);

    if (dist > maxDist) {
      const ux = dx / dist;
      const uy = dy / dist;
      const newAnchor = {
        x: state.head.x + ux * maxDist,
        y: state.head.y + uy * maxDist
      };

      const moveX = newAnchor.x - anchor.x;
      const moveY = newAnchor.y - anchor.y;

      if (correct.freeAnchor) {
        correct.freeAnchor.x += moveX;
        correct.freeAnchor.y += moveY;
      }

      correct.x += moveX;
      correct.y += moveY;
      correct.anchorX += moveX;
      correct.anchorY += moveY;
    }
  }

  function updateEncounter(dt, ts){
    if (!state.targets.length) return;

    const encounter = state.encounter;
    const scale = Math.min(state.fieldWidth, state.fieldHeight);
    const roam = clamp(scale * (SLITHER_TUNING.pairRoamScreen[selectedMode] || 0.12), 44, 110);

    if (encounter && !encounter.collapsed){
      encounter.driftPhase += dt / 1000;
      encounter.center.x = encounter.baseCenter.x + Math.cos(encounter.driftPhase * 0.45 + encounter.driftAngle) * roam * 0.42;
      encounter.center.y = encounter.baseCenter.y + Math.sin(encounter.driftPhase * 0.45 + encounter.driftAngle) * roam * 0.42;
    }

    for (const target of state.targets){
      if (target.fleeing){
        const fleeSpeed = getWrongFleeSpeed();
        target.x += Math.cos(target.fleeAngle) * fleeSpeed * (dt / 1000);
        target.y += Math.sin(target.fleeAngle) * fleeSpeed * (dt / 1000);
        const distFromPlayer = Math.hypot(target.x - state.head.x, target.y - state.head.y);
        const maxDist = Math.max(state.fieldWidth, state.fieldHeight) * SLITHER_TUNING.wrongFleeMaxScreenDistance;
        if (distFromPlayer >= maxDist){
          target.fleeing = false;
          target.freeAnchor = { x: target.x, y: target.y };
        }
        continue;
      }

      target.phase += dt / 1000;
      const center = target.freeAnchor || (encounter ? encounter.center : { x: target.anchorX, y: target.anchorY });
      const pulse = Math.sin(target.phase * 1.8) * 12;
      const side = target.baseOffset + pulse;
      const sway = Math.sin(target.phase * 2.7) * 18;
      const a = target.offsetAngle;
      target.x = center.x + Math.cos(a) * side + Math.cos(a + Math.PI / 2) * sway;
      target.y = center.y + Math.sin(a) * side + Math.sin(a + Math.PI / 2) * sway;
    }

    keepTargetsSeparated();
  }

  function keepTargetsSeparated(){
    if (state.targets.length < 2) return;
    const a = state.targets[0];
    const b = state.targets[1];
    const minDist = Math.max(a.r + b.r + 18, Math.min(state.fieldWidth, state.fieldHeight) * 0.18);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d >= minDist) return;
    const push = (minDist - d) * 0.5;
    const ux = dx / d;
    const uy = dy / d;
    a.x -= ux * push;
    a.y -= uy * push;
    b.x += ux * push;
    b.y += uy * push;
  }

  function maybeSpawnFruit(force){
    if (state.fruit) return;
    if (!force && Math.random() > SLITHER_TUNING.fruitChance) return;

    const targetPoint = state.encounter ? state.encounter.center : state.head;
    const along = 0.35 + Math.random() * 0.45;
    const side = (Math.random() * 2 - 1) * Math.min(state.fieldWidth, state.fieldHeight) * 0.30;
    const dx = targetPoint.x - state.head.x;
    const dy = targetPoint.y - state.head.y;
    const angle = Math.atan2(dy, dx);

    state.fruit = {
      x: state.head.x + dx * along + Math.cos(angle + Math.PI / 2) * side,
      y: state.head.y + dy * along + Math.sin(angle + Math.PI / 2) * side,
      r: 26,
      emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
      phase: Math.random() * Math.PI * 2
    };
  }

  function updateFruit(dt){
    if (!state.fruit) return;
    state.fruit.phase += dt / 1000;
  }

  function checkCollisions(ts){
    checkFruitCollision();
    checkTargetCollision(ts);
  }

  function checkFruitCollision(){
    if (!state.fruit) return;
    const d = Math.hypot(state.head.x - state.fruit.x, state.head.y - state.fruit.y);
    if (d <= state.fruit.r + 22){
      state.fruit = null;
      state.fruitCount += 1;
      state.snakeStyleIndex = (state.snakeStyleIndex + 1 + Math.floor(Math.random() * 2)) % SNAKE_STYLES.length;
      state.snakeStyle = SNAKE_STYLES[state.snakeStyleIndex];
      state.happyUntil = performance.now() + 320;
      applySnakeStyle();
    }
  }

  function checkTargetCollision(ts){
    for (const target of [...state.targets]){
      if (target.hit) continue;
      const d = Math.hypot(state.head.x - target.x, state.head.y - target.y);
      if (d <= target.r + 23){
        if (target.isCorrect){
          handleCorrectTarget(target);
        } else {
          handleWrongTarget(target, ts);
        }
        break;
      }
    }
  }

  function handleCorrectTarget(target){
    showPickupPop({
      text: target.word,
      kind: "correct",
      x: target.x,
      y: target.y
    });

    state.progressIndex += 1;
    state.targets = [];
    state.encounter = null;
    state.happyUntil = performance.now() + 380;
    updateBuildHud();

    if (state.progressIndex >= state.segments.length){
      finishGame();
      return;
    }

    spawnEncounter();
  }

  function handleWrongTarget(target, ts){
    target.hit = true;
    target.wrongHitUntil = ts + 320;

    showPickupPop({
      text: "OOPS!",
      kind: "wrong",
      x: target.x,
      y: target.y
    });

    state.flashText = "";
    state.flashUntil = 0;

    setTimeout(() => {
      if (!state.running || completed) return;
      state.targets = state.targets.filter((item) => item.id !== target.id);
      const correct = state.targets.find((item) => item.isCorrect);
      if (correct){
        const fleeAngle = Math.atan2(correct.y - state.head.y, correct.x - state.head.x);
        correct.fleeing = true;
        correct.fleeAngle = fleeAngle;
        correct.freeAnchor = null;
        if (state.encounter) state.encounter.collapsed = true;
      }
    }, 180);
  }

  function finishGame(){
    if (completed) return;
    completed = true;
    completionResult = null;

    if (window.VerseGameBridge.completeGameRun){
      completionResult = window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode,
        stats: {
          fruitCount: state.fruitCount,
          progressIndex: state.progressIndex
        }
      });
    }

    setTimeout(renderDone, 220);
  }

  function renderDone(){
    stopLoop();
    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🐍",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage: `Fruit eaten: ${state.fruitCount}`,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: () => {
        completed = false;
        renderModeSelect();
      },
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function updateBuildHud(){
    const track = document.getElementById("vslBuildTrack");
    if (!track) return;

    const current = getCurrentCorrectLabel();
    const built = state.segments.slice(0, state.progressIndex);
    const visibleBuilt = built.slice(-4);
    const fadePrefix = built.length > visibleBuilt.length;
    const isHard = selectedMode === "hard";
    const meta = `${state.referenceMeta?.book || state.bookLabel || ""} ${state.referenceMeta?.reference || state.referenceLabel || ""}`.trim();

    const builtHtml = visibleBuilt.map((word, index) => {
      const className = index < Math.max(0, visibleBuilt.length - 2) ? "vsl-build-fade" : "vsl-build-context";
      return `<span class="${className}">${escapeHtml(word)}</span>`;
    }).join("");

    const prefix = fadePrefix ? `<span class="vsl-build-fade">…</span>` : "";
    const currentHtml = current
      ? (isHard ? `<span class="vsl-build-blank" aria-label="blank"></span>` : `<span class="vsl-build-current">${escapeHtml(current)}</span>`)
      : `<span class="vsl-build-current">Done!</span>`;

    track.innerHTML = `
      ${prefix}
      ${builtHtml}
      ${currentHtml}
      <span class="vsl-build-meta">${escapeHtml(meta)} • ${Math.min(state.progressIndex + 1, state.segments.length)}/${state.segments.length}</span>
    `;

    updateBuildHudShift();
  }

  function updateBuildHudShift(){
    const track = document.getElementById("vslBuildTrack");
    const line = document.getElementById("vslBuildLine");
    if (!track || !line) return;
    const overflow = track.scrollWidth - line.clientWidth;
    const shift = overflow > 0 ? -overflow : 0;
    track.style.setProperty("--vsl-build-shift", `${shift}px`);
  }

  function renderTargets(){
    const layer = document.getElementById("vslTargetLayer");
    if (!layer) return;

    const activeIds = new Set(state.targets.map((target) => String(target.id)));
    for (const child of [...layer.children]){
      if (!activeIds.has(child.dataset.id)) child.remove();
    }

    for (const target of state.targets){
      let el = layer.querySelector(`[data-id="${target.id}"]`);
      if (!el){
        el = document.createElement("div");
        el.className = "vsl-word-target";
        el.dataset.id = String(target.id);
        el.textContent = target.word;
        layer.appendChild(el);
      }

      const p = worldToScreen(target);
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
      el.classList.toggle("is-wrong-hit", performance.now() < target.wrongHitUntil);
    }
  }

  function showPickupPop({ text, kind, x, y }) {
    state.pickupPops.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      kind,
      x,
      y,
      bornAt: performance.now(),
      duration: 720
    });
  }

  function renderPickupPops(ts) {
    const layer = document.getElementById("vslPickupPopLayer");
    if (!layer) return;

    state.pickupPops = state.pickupPops.filter((pop) => ts - pop.bornAt < pop.duration);
    const activeIds = new Set(state.pickupPops.map((pop) => pop.id));

    for (const child of [...layer.children]) {
      if (!activeIds.has(child.dataset.id)) child.remove();
    }

    for (const pop of state.pickupPops) {
      let el = layer.querySelector(`[data-id="${pop.id}"]`);
      if (!el) {
        el = document.createElement("div");
        el.className = `vsl-pickup-pop is-${pop.kind}`;
        el.dataset.id = pop.id;
        el.textContent = pop.text;
        layer.appendChild(el);
      }

      const age = ts - pop.bornAt;
      const t = Math.min(1, age / pop.duration);
      const p = worldToScreen(pop);
      const lift = 42 * easeOutCubic(t);
      const scale = 0.76 + 0.24 * easeOutBack(Math.min(1, t * 2.4));
      const opacity = t > 0.68 ? 1 - ((t - 0.68) / 0.32) : 1;

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - lift).toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function renderFruit(){
    const layer = document.getElementById("vslFruitLayer");
    if (!layer) return;
    layer.innerHTML = "";
    if (!state.fruit) return;
    const el = document.createElement("div");
    el.className = "vsl-fruit";
    el.textContent = state.fruit.emoji;
    const p = worldToScreen(state.fruit);
    const bob = Math.sin(state.fruit.phase * 2.2) * 4;
    el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y + bob).toFixed(1)}px) translate(-50%, -50%)`;
    layer.appendChild(el);
  }

  function renderArrow(){
    const arrow = document.getElementById("vslArrow");
    if (!arrow) return;
    const target = getArrowTargetPoint();
    if (!target){
      arrow.classList.remove("is-visible");
      return;
    }

    const screen = worldToScreen(target);
    const cx = state.fieldWidth / 2;
    const cy = state.fieldHeight / 2;
    const dx = screen.x - cx;
    const dy = screen.y - cy;
    const angle = Math.atan2(dy, dx);
    const margin = Math.max(30, Math.min(state.fieldWidth, state.fieldHeight) * 0.07);

    const inside = screen.x > margin && screen.x < state.fieldWidth - margin && screen.y > margin && screen.y < state.fieldHeight - margin;
    if (inside){
      arrow.classList.remove("is-visible");
      return;
    }

    const pos = edgePointForAngle(angle, margin);
    const rotation = angle + Math.PI / 2;
    arrow.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) translate(-50%, -50%) rotate(${rotation}rad)`;
    arrow.classList.add("is-visible");
  }

  function getArrowTargetPoint(){
    const correct = state.targets.find((target) => target.isCorrect);
    if (state.targets.length > 1 && state.encounter && !state.encounter.collapsed){
      return state.encounter.center;
    }
    return correct || null;
  }

  function edgePointForAngle(angle, margin){
    const cx = state.fieldWidth / 2;
    const cy = state.fieldHeight / 2;
    const halfW = Math.max(10, cx - margin);
    const halfH = Math.max(10, cy - margin);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const t = Math.min(
      cos !== 0 ? Math.abs(halfW / cos) : Infinity,
      sin !== 0 ? Math.abs(halfH / sin) : Infinity
    );
    return {
      x: cx + cos * t,
      y: cy + sin * t
    };
  }

  function renderFlash(ts){
    const el = document.getElementById("vslFlashMessage");
    if (!el) return;
    if (state.flashText && ts < state.flashUntil){
      el.textContent = state.flashText;
      el.classList.add("is-visible");
    } else {
      el.classList.remove("is-visible");
    }
  }

  function drawSnake(){
    applySnakeStyle();
    const body = document.getElementById("vslSnakeBody");
    const stripe = document.getElementById("vslSnakeBodyStripe");
    const headGroup = document.getElementById("vslSnakeHeadGroup");
    const tongue = document.getElementById("vslSnakeTongue");
    if (!body || !stripe || !headGroup || !tongue) return;

    const screenTrail = state.trail.map(worldToScreen);
    const d = buildBodyPath(screenTrail);
    body.setAttribute("d", d);
    stripe.setAttribute("d", d);

    const head = worldToScreen(state.head);
    const pulse = performance.now() < state.happyUntil ? 1.08 : 1;
    headGroup.setAttribute("transform", `translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${(state.head.angle * 180 / Math.PI + 90).toFixed(1)}) scale(${pulse})`);
    tongue.setAttribute("d", "M 0 -21 L 0 -36 M 0 -36 L -7 -44 M 0 -36 L 7 -44");
  }

  function buildBodyPath(points){
    if (!points.length) return "";
    const simplified = simplifyTrail(points, 9);
    let d = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`;
    for (let i = 1; i < simplified.length; i++){
      d += ` L ${simplified[i].x.toFixed(1)} ${simplified[i].y.toFixed(1)}`;
    }
    return d;
  }

  function simplifyTrail(points, minDistance){
    if (points.length <= 2) return points;
    const out = [points[0]];
    let last = points[0];
    for (let i = 1; i < points.length - 1; i++){
      const p = points[i];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= minDistance){
        out.push(p);
        last = p;
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }

  function applySnakeStyle(){
    const group = document.getElementById("vslSnakeGroup");
    if (!group) return;
    group.className.baseVal = `vsl-snake-style-${state.snakeStyle}`;
  }

  function maybeRecenterWorld(){
    const limit = 50000;
    if (Math.abs(state.head.x) < limit && Math.abs(state.head.y) < limit) return;
    const ox = state.head.x;
    const oy = state.head.y;
    state.head.x = 0;
    state.head.y = 0;
    state.trail = state.trail.map((p) => ({ x: p.x - ox, y: p.y - oy }));
    for (const target of state.targets){
      target.x -= ox;
      target.y -= oy;
      target.anchorX -= ox;
      target.anchorY -= oy;
      if (target.freeAnchor){
        target.freeAnchor.x -= ox;
        target.freeAnchor.y -= oy;
      }
    }
    if (state.encounter){
      state.encounter.center.x -= ox;
      state.encounter.center.y -= oy;
      state.encounter.baseCenter.x -= ox;
      state.encounter.baseCenter.y -= oy;
    }
    if (state.fruit){
      state.fruit.x -= ox;
      state.fruit.y -= oy;
    }
  }

  function randomAngleAwayFrom(previous){
    let angle = Math.random() * Math.PI * 2;
    for (let i = 0; i < 8; i++){
      const diff = Math.abs(angleDelta(previous, angle));
      if (diff > Math.PI * 0.45) break;
      angle = Math.random() * Math.PI * 2;
    }
    return angle;
  }

  function estimateTargetRadius(word){
    return clamp(36 + String(word || "").length * 6.8, 52, 118);
  }

  function modeLabel(){
    return selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode";
  }

  function angleDelta(from, to){
    let diff = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  function mod(value, size){
    return ((value % size) + size) % size;
  }

  function shuffle(items){
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  renderIntroScreen();
})();
