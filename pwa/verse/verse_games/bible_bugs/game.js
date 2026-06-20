(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "bible_bugs";
  const GAME_TITLE = "Bible Bugs";
  const BUILD_AREA = "compact";
  const HELP_OVERLAY_ID = "bbHelpOverlay";
  const GAME_MENU_ID = "bbGameMenuOverlay";

  const GAME_THEME = {
    bg: "#a7cb6f",
    accent: "#a7cb6f",
    helpTitleBg: "#a7cb6f",
    helpTitleColor: "#ffffff",
    helpCloseBg: "#a7cb6f",
    helpCloseColor: "#ffffff"
  };

  const IMAGE_PATHS = {
    frogIdle: "./bible_bugs_images/bible_bugs_frog_idle.png",
    frogHappy: "./bible_bugs_images/bible_bugs_frog_happy.png",
    frogGross: "./bible_bugs_images/bible_bugs_frog_gross.png",
    lilyPad: "./bible_bugs_images/bible_bugs_lilypad.png"
  };

  const BUG_EMOJIS = ["🪰", "🐞", "🐝", "🦟", "🪲", "🐛"];
  const LANES = [0.18, 0.50, 0.82];
  const BONUS_SECONDS = 20;

  const MODE_TIMING = {
    easy: { fallSeconds: 6.8, nextDelay: 0, reactionMs: 620, missDelay: 520 },
    medium: { fallSeconds: 5.8, nextDelay: 0, reactionMs: 580, missDelay: 460 },
    hard: { fallSeconds: 4.9, nextDelay: 0, reactionMs: 540, missDelay: 420 }
  };

  const BONUS_BUG_LIFE_MS = 1850;
  const BONUS_EAT_MS = 360;
  const MAIN_EAT_MS = 420;
  const TUTORIAL_EAT_MS = 420;
  const TUTORIAL_GO_MS = 1500;

const BUG_MOTION = {
  sideAmountRatio: 0.03,
  sideSpeed: 0.55,
  rotationAmount: 3,
  squishAmount: 0.02
};

const TONGUE_FX = {
  subtleSparkInterval: 12,
  rainbowSparkInterval: 12
};

const WATER_FX = {
  opacity: 0.09,
  speed: 1.80,
  spacing: 60,
  thickness: 8,
  amplitude: 23,
  frequency: 3.15,
  slantDeg: -5,
  viewSize: 1000,
  segments: 96
};

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let completionResult = null;
  let resizeBound = false;

  const shell = window.VerseGameShell;
  const parsedRef = shell.parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
  const buildData = shell.buildVerseSegments({
    verseText: ctx.verseText || "",
    book: parsedRef.book,
    reference: parsedRef.reference,
    buildArea: BUILD_AREA
  });

  const state = {
    running:false,
    paused:false,
    pauseReason:"",
    pausedAt:0,
    rafId:0,
    lastTs:0,
    fieldWidth:0,
    fieldHeight:0,
    progressIndex:0,
    buildFitDone:false,
    buildShakeUntil:0,
    fieldFlashUntil:0,
    reaction:null,
    overlayMessage:"",
    overlayUntil:0,
    overlayClass:"",
    tutorialActive:false,
    tutorialStep:"",
    tutorialBug:null,
    phase:"words",
    waveId:0,
    waveStatus:"idle",
    bugs:[],
    tongue:null,
    spitParticles:[],
    poofParticles:[],
    tongueSparkles:[],
    scheduledActions:[],
    currentStreak:0,
    maxStreak:0,
    frogChompUntil:0,
    misses:0,
    mistakes:0,
    correctEaten:0,
    bonusIntroActive:false,
    bonusIntroUntil:0,
    bonusMode:false,
    bonusEndsAt:0,
    bonusBug:null,
    bonusBugId:0,
    bonusEating:false,
    bugsEaten:0,
    done:false
  };

  renderIntro();

  function renderIntro(){
    stopLoop();

    shell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: "🐸",
      debugBadge: "BB 1.2",
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

    shell.renderModeSelect({
      app,
      title: "Choose Your Difficulty",
      icon: "🥉🥈🥇",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: `Back to ${GAME_TITLE} title`,
      onBack: renderIntro,
      onSelect: startGame
    });
  }

  function startGame(mode){
    selectedMode = mode;
    completionMarked = false;
    completionResult = null;

    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.pausedAt = 0;
    state.lastTs = 0;
    state.progressIndex = 0;
    state.buildFitDone = false;
    state.buildShakeUntil = 0;
    state.fieldFlashUntil = 0;
    state.reaction = null;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.overlayClass = "";
    state.tutorialActive = false;
    state.tutorialStep = "";
    state.tutorialBug = null;
    state.phase = "words";
    state.waveId = 0;
    state.waveStatus = "idle";
    state.bugs = [];
    state.tongue = null;
    state.spitParticles = [];
    state.poofParticles = [];
    state.tongueSparkles = [];
    state.scheduledActions = [];
    state.currentStreak = 0;
    state.maxStreak = 0;
    state.frogChompUntil = 0;
    state.misses = 0;
    state.mistakes = 0;
    state.correctEaten = 0;
    state.bonusIntroActive = false;
    state.bonusIntroUntil = 0;
    state.bonusMode = false;
    state.bonusEndsAt = 0;
    state.bonusBug = null;
    state.bonusBugId = 0;
    state.bonusEating = false;
    state.bugsEaten = 0;
    state.done = false;

    app.innerHTML = `
      <div class="bb-shell">
        <div class="bb-stage">
          <div class="bb-build-wrap">
            <div class="bb-build vm-build vm-build--${BUILD_AREA}" id="bbBuild">
              <div class="bb-build-text vm-build-text" id="bbBuildText"></div>
            </div>
          </div>

          <div class="bb-field-wrap">
            <div class="bb-field" id="bbField">
              <div class="bb-water-layer" id="bbWaterLayer" aria-hidden="true">
                <svg class="bb-water-wave-svg" id="bbWaterWaveSvg" viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg>
                <div class="bb-water-rings" id="bbWaterRings">
                  <span class="bb-water-ring ring-1"></span>
                  <span class="bb-water-ring ring-2"></span>
                  <span class="bb-water-ring ring-3"></span>
                  <span class="bb-water-ring ring-4"></span>
                  <span class="bb-water-ring ring-5"></span>
                </div>
              </div>
              <div class="bb-play-layer" id="bbPlayLayer"></div>
              <div class="bb-effects-layer" id="bbEffectsLayer"></div>
              <div class="bb-frog-layer" id="bbFrogLayer">
                ${renderFrog()}
              </div>
              <div class="bb-overlay-msg" id="bbOverlay"></div>
              <div class="bb-reaction-layer" id="bbReactionLayer"></div>
              <div class="bb-bonus-intro-overlay" id="bbBonusIntroOverlay" aria-hidden="true">
                <div class="bb-bonus-intro-card">
                  <div class="bb-bonus-intro-title">BONUS ROUND!</div>
                  <div class="bb-bonus-intro-subtitle">Eat as many bugs as you can!</div>
                </div>
              </div>
              <div class="bb-hud-layer">
                <button class="bb-corner-pill bb-corner-left" id="bbMenuPill" type="button" aria-label="Game menu">☰</button>
                <div class="bb-corner-pill bb-corner-right" id="bbStatusPill"></div>
              </div>
            </div>
          </div>
        </div>

        ${renderHelpOverlay(helpHtml())}
        ${renderGameMenuOverlay()}
      </div>
    `;

    wireCommonNav();
    wireGameInput();
    recalcField();
    updatePhase();
    updateBuildText();
    startTutorial();
    renderFrame();
    startLoop();
  }

  function renderHelpOverlay(body){
    return shell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body,
      closeText: "Close"
    });
  }

  function renderGameMenuOverlay(){
    return shell.gameMenuHtml({
      id: GAME_MENU_ID,
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function helpHtml(){
    return `Tap the bug with the next word!<br><br>
      The frog will gobble it up.<br><br>
      Finish the verse, then eat as many bonus bugs as you can!`;
  }

function wireCommonNav(){
  shell.wireGameMenu({
    id: GAME_MENU_ID,
    menuButtonId: "bbMenuPill",
    helpOverlayId: HELP_OVERLAY_ID,
    isMuted: () => muted,
    onMuteToggle: () => {
      muted = !muted;
      return muted;
    },
    onHowToPlay: openHelpFromMenu,
    onModeSelect: () => {
      setPaused(false, "");
      stopLoop();
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

  installMenuTouchFallbacks();
}

function installMenuTouchFallbacks(){
  const overlay = document.getElementById(GAME_MENU_ID);
  if (!overlay || overlay.dataset.bbTouchFallbacks === "1") return;

  overlay.dataset.bbTouchFallbacks = "1";

  function closeMenu(){
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    setPaused(false, "");
  }

  function wireTouchButton(id, action){
    const button = document.getElementById(id);
    if (!button) return;

    button.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    }, { passive:false });
  }

  wireTouchButton(`${GAME_MENU_ID}HowToBtn`, () => {
    openHelpFromMenu();
  });

  wireTouchButton(`${GAME_MENU_ID}ModeSelectBtn`, () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    setPaused(false, "");
    stopLoop();
    renderModeSelect();
  });

  wireTouchButton(`${GAME_MENU_ID}ExitBtn`, () => {
    stopLoop();
    window.VerseGameBridge.exitGame();
  });

  wireTouchButton(`${GAME_MENU_ID}CloseBtn`, () => {
    closeMenu();
  });

  wireTouchButton(`${GAME_MENU_ID}MuteBtn`, () => {
    muted = !muted;

    const muteButton = document.getElementById(`${GAME_MENU_ID}MuteBtn`);
    if (muteButton){
      muteButton.textContent = muted ? "🔇" : "🔊";
      muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
      muteButton.setAttribute("title", muted ? "Unmute" : "Mute");
    }

    overlay.setAttribute("aria-hidden", "false");
  });

  function closeHelpFromTouch(){
    const helpOverlay = document.getElementById(HELP_OVERLAY_ID);
    const menuOverlay = document.getElementById(GAME_MENU_ID);
    const mode = helpOverlay?.dataset.mode || "close";

    if (helpOverlay){
      helpOverlay.classList.remove("is-open");
      helpOverlay.setAttribute("aria-hidden", "true");
    }

    if (mode === "back"){
      if (menuOverlay){
        menuOverlay.classList.add("is-open");
        menuOverlay.setAttribute("aria-hidden", "false");
      }

      setPaused(true, "menu");
    } else {
      setPaused(false, "");
    }
  }

  wireTouchButton(`${HELP_OVERLAY_ID}CloseBtn`, closeHelpFromTouch);

  if (!document.documentElement.dataset.bbHelpTouchFallbacks){
    document.documentElement.dataset.bbHelpTouchFallbacks = "1";

    const catchHelpBackTouch = (event) => {
      const helpOverlay = document.getElementById(HELP_OVERLAY_ID);
      if (!helpOverlay || !helpOverlay.classList.contains("is-open")) return;

      const button = event.target?.closest?.(`#${HELP_OVERLAY_ID}CloseBtn`);
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      closeHelpFromTouch();
    };

    document.addEventListener("touchend", catchHelpBackTouch, { capture:true, passive:false });
    document.addEventListener("pointerup", catchHelpBackTouch, { capture:true });
    document.addEventListener("click", catchHelpBackTouch, { capture:true });
  }
}


function openHelpFromMenu(){
  const menuOverlay = document.getElementById(GAME_MENU_ID);

  if (menuOverlay){
    menuOverlay.classList.remove("is-open");
    menuOverlay.setAttribute("aria-hidden", "true");
  }

  shell.openHelp(HELP_OVERLAY_ID, "back", "Back");
  setPaused(true, "help");
}

  function setPaused(paused, reason = ""){
    const now = performance.now();

    if (paused){
      if (state.paused){
        state.pauseReason = reason || state.pauseReason;
        return;
      }

      state.paused = true;
      state.pauseReason = reason;
      state.pausedAt = now;
      return;
    }

    if (!state.paused){
      state.pauseReason = "";
      state.pausedAt = 0;
      state.lastTs = now;
      return;
    }

    const pauseDuration = Math.max(0, now - (Number(state.pausedAt) || now));
    shiftGameTimers(pauseDuration);

    state.paused = false;
    state.pauseReason = "";
    state.pausedAt = 0;
    state.lastTs = now;
  }

function shiftGameTimers(deltaMs){
  const delta = Number(deltaMs) || 0;
  if (delta <= 0) return;

  function shiftBugTimes(bug){
    if (!bug) return;

    if (Number.isFinite(bug.bornAt)) bug.bornAt += delta;
    if (Number.isFinite(bug.poofAt) && bug.poofAt > 0) bug.poofAt += delta;
    if (Number.isFinite(bug.eatStartedAt)) bug.eatStartedAt += delta;
    if (Number.isFinite(bug.expiresAt)) bug.expiresAt += delta;
  }

  for (const bug of state.bugs){
    shiftBugTimes(bug);
  }

  shiftBugTimes(state.tutorialBug);
  shiftBugTimes(state.bonusBug);

  if (state.tongue && Number.isFinite(state.tongue.startedAt)){
    state.tongue.startedAt += delta;
  }

  if (state.reaction){
    if (Number.isFinite(state.reaction.startedAt)) state.reaction.startedAt += delta;
    if (Number.isFinite(state.reaction.until)) state.reaction.until += delta;
  }

  for (const particle of state.spitParticles){
    if (Number.isFinite(particle.bornAt)) particle.bornAt += delta;
  }

  for (const particle of state.poofParticles){
    if (Number.isFinite(particle.bornAt)) particle.bornAt += delta;
  }

  for (const particle of state.tongueSparkles){
    if (Number.isFinite(particle.bornAt)) particle.bornAt += delta;
  }

  if (Number.isFinite(state.frogChompUntil) && state.frogChompUntil > 0){
    state.frogChompUntil += delta;
  }

  if (state.tongue && Number.isFinite(state.tongue.lastSparkAt)){
    state.tongue.lastSparkAt += delta;
  }

  for (const action of state.scheduledActions){
    if (Number.isFinite(action.at)) action.at += delta;
  }

  if (Number.isFinite(state.buildShakeUntil) && state.buildShakeUntil > 0){
    state.buildShakeUntil += delta;
  }

  if (Number.isFinite(state.fieldFlashUntil) && state.fieldFlashUntil > 0){
    state.fieldFlashUntil += delta;
  }

  if (Number.isFinite(state.overlayUntil) && state.overlayUntil > 0){
    state.overlayUntil += delta;
  }

  if (Number.isFinite(state.bonusIntroUntil) && state.bonusIntroUntil > 0){
    state.bonusIntroUntil += delta;
  }

  if (Number.isFinite(state.bonusEndsAt) && state.bonusEndsAt > 0){
    state.bonusEndsAt += delta;
  }
}

  function wireGameInput(){
    const field = document.getElementById("bbField");
    if (!field) return;

    field.addEventListener("pointerdown", (event) => {
      const bugButton = event.target.closest("[data-bug-id]");
      if (!bugButton) return;
      event.preventDefault();
      handleBugTap(String(bugButton.dataset.bugId));
    });

    if (!resizeBound){
      resizeBound = true;
      window.addEventListener("resize", () => {
        if (!state.running) return;
        state.buildFitDone = false;
        recalcField();
        updateBuildText();
        renderFrame();
      }, { passive:true });
    }
  }

  function recalcField(){
    const field = document.getElementById("bbField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width || 320;
    state.fieldHeight = rect.height || 420;
  }

  function updateBuildText(){
    const buildText = document.getElementById("bbBuildText");
    if (!buildText) return;

    const buildRender = shell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: buildData.bookLabel,
      reference: buildData.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: selectedMode === "hard",
      extraClass: "bb-build-text"
    });

    buildText.className = buildRender.className;
    buildText.innerHTML = buildRender.html;

    fitBibleBugsBuildText();
  }

  function fitBibleBugsBuildText(){
    if (state.buildFitDone) return;

    requestAnimationFrame(() => {
      const build = document.getElementById("bbBuild");
      const text = document.getElementById("bbBuildText");
      if (!build || !text) return;

      const result = shell.fitBuildTextOnce({
        buildEl: build,
        textEl: text,
        buildArea: BUILD_AREA
      });

      if (result) state.buildFitDone = true;
    });
  }

  function clearBuildTextFit(text){
    if (!text) return;

    text.style.fontSize = "";
    text.style.lineHeight = "";
    text.style.maxWidth = "";
    text.style.width = "";
    text.style.marginLeft = "";
    text.style.marginRight = "";

    delete text.dataset.vmFitFontSize;
    delete text.dataset.vmFitMaxWidth;
    delete text.dataset.vmFitLineHeight;
    delete text.dataset.vmFitLines;
    delete text.dataset.vmFitArea;
  }

  function updatePhase(){
    state.phase = shell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: buildData.words.length,
      totalSegments: buildData.segments.length,
      bookLabel: buildData.bookLabel,
      referenceLabel: buildData.referenceLabel
    });
  }

  function currentTarget(){
    return buildData.segments[state.progressIndex] || "";
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = [];
    const seen = new Set([shell.normalizeWord(correctLabel)]);

    function addDecoys(list){
      for (const item of list || []){
        const key = shell.normalizeWord(item);
        if (!key || seen.has(key)) continue;

        seen.add(key);
        out.push(item);

        if (out.length >= count) break;
      }
    }

    if (phase === "words"){
      if (selectedMode === "easy"){
        addDecoys(shell.getFunWordDecoys(correctLabel, buildData.words, count));
      } else {
        addDecoys(shell.getVerseWordDecoys({
          words: buildData.words,
          correct: correctLabel,
          targetIndex: state.progressIndex,
          count,
          avoidNext: 2,
          fallbackToFun: true
        }));

        if (out.length < count){
          addDecoys(shell.getFunWordDecoys(correctLabel, buildData.words, count * 2));
        }

        if (out.length < count){
          addDecoys(shell.getFunDecoys());
        }
      }
    } else if (phase === "book"){
      addDecoys(shell.getBookDecoys(correctLabel, count));
    } else if (phase === "reference"){
      addDecoys(shell.getReferenceDecoys(parsedRef, selectedMode, count + 4));
    }

    if (out.length < count){
      addDecoys(shell.getFunWordDecoys(correctLabel, buildData.words, count * 3));
    }

    if (out.length < count){
      addDecoys(shell.getFunDecoys());
    }

    return out.slice(0, count);
  }

  function getChoices(){
    updatePhase();

    const correctLabel = currentTarget();
    const phase = state.phase;
    const decoys = getDecoysForPhase(phase, correctLabel, 2);
    const labels = shell.shuffle([correctLabel, ...decoys]).slice(0, 3);

    return labels.map((label) => ({
      text: label,
      correct: label === correctLabel
    }));
  }

  function startTutorial() {
    const now = performance.now();

    state.tutorialActive = true;
    state.tutorialStep = "waiting";
    state.waveStatus = "tutorial";
    state.bugs = [];
    state.bonusBug = null;
    state.tongue = null;
    state.reaction = null;

    state.tutorialBug = {
      id: "tutorial-bug",
      text: "",
      correct: true,
      tutorial: true,
      emoji: "🐞",
      xRatio: 0.5,
      yRatio: 0.36,
      bornAt: now,
      status: "tutorial",
      poofAt: 0,
      selected: false,
      eaten: false,
      pullPoofed: false,
      motionPhase: Math.random() * Math.PI * 2,
      jitterSeed: Math.random() * Math.PI * 2
    };

    showOverlay("Tap the bug to eat it!", 60000);
  }

  function handleTutorialTap(id) {
    if (!state.tutorialActive || state.tutorialStep !== "waiting") return;

    const bug = state.tutorialBug;
    if (!bug || bug.id !== id || bug.status !== "tutorial") return;

    const now = performance.now();

    state.tutorialStep = "eating";
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.overlayClass = "";
    state.waveStatus = "tutorial_eating";
    state.frogChompUntil = now + 280;

    bug.status = "eating";
    fireTongueToBug(bug, now, TUTORIAL_EAT_MS, false, 0);

    scheduleAction(TUTORIAL_EAT_MS, finishTutorialEat);
  }

  function finishTutorialEat() {
    if (!state.tutorialActive) return;

    const now = performance.now();

    state.tongue = null;
    state.tutorialBug = null;
    state.tutorialStep = "go";
    state.waveStatus = "tutorial_go";
    state.frogChompUntil = now + 280;

    showOverlay("GO!", TUTORIAL_GO_MS, "is-go");

    scheduleAction(TUTORIAL_GO_MS, finishTutorialGo);
  }

  function finishTutorialGo() {
    if (!state.tutorialActive) return;

    state.tutorialActive = false;
    state.tutorialStep = "";
    state.tutorialBug = null;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.overlayClass = "";

    if (!state.done && !state.bonusMode && !state.bonusIntroActive) {
      spawnWave();
    }
  }


  function spawnWave(){
    updatePhase();

    if (state.phase === "done"){
      startBonusIntro();
      return;
    }

    const now = performance.now();
    const choices = getChoices();
    const timing = MODE_TIMING[selectedMode] || MODE_TIMING.medium;
    const fallMs = timing.fallSeconds * 1000;
    const shuffledLanes = shell.shuffle(LANES);

    state.waveId += 1;
    state.waveStatus = "falling";
    state.tongue = null;
    state.bugs = choices.map((choice, index) => ({
      id: `w${state.waveId}-${index}`,
      text: choice.text,
      correct: choice.correct,
      emoji: BUG_EMOJIS[(state.waveId + index) % BUG_EMOJIS.length],
      xRatio: shuffledLanes[index] || LANES[index] || 0.5,
      startY: -0.06,
      endY: 0.76,
      bornAt: now,
      fallMs,
      status: "falling",
      poofAt: 0,
      selected:false,
      eaten:false,
      pullPoofed:false,
      motionPhase: Math.random() * Math.PI * 2,
      jitterSeed: Math.random() * Math.PI * 2
    }));
  }

  function handleBugTap(id){
    if (state.paused || state.done || state.bonusIntroActive) return;

    if (state.tutorialActive){
      handleTutorialTap(id);
      return;
    }

    if (state.bonusMode){
      handleBonusTap(id);
      return;
    }

    if (state.waveStatus !== "falling") return;

    const bug = state.bugs.find((item) => item.id === id);
    if (!bug || bug.status !== "falling") return;

    const now = performance.now();
    state.waveStatus = "eating";

    for (const item of state.bugs){
      if (item.id === id){
        item.selected = true;
        item.status = "eating";
      } else {
        addBugPoof(item, now);
        item.status = "poof";
        item.poofAt = now;
      }
    }

    const tongueStreak = bug.correct ? state.currentStreak + 1 : 0;
fireTongueToBug(bug, now, MAIN_EAT_MS, false, tongueStreak);

    scheduleAction(MAIN_EAT_MS, () => finishMainEat(bug));
  }

function finishMainEat(bug){
  const isCorrect = !!bug.correct;
  const now = performance.now();

  state.tongue = null;
  state.spitParticles = [];
  state.bugs = [];
  state.waveStatus = "resolving";
  state.frogChompUntil = now + 280;

  if (isCorrect){
    state.currentStreak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.currentStreak);

    state.progressIndex = Math.min(buildData.segments.length, state.progressIndex + 1);
    state.correctEaten += 1;
    updatePhase();
    updateBuildText();
    showReaction("correct");
  } else {
    state.currentStreak = 0;

    state.mistakes += 1;
    state.buildShakeUntil = now + 320;
    addSpitSpray(now);
    showReaction("incorrect");
  }

  if (!state.done && !state.bonusMode && !state.bonusIntroActive){
    spawnWave();
  }
}
  

  function missCorrectBug(){
    const now = performance.now();
    state.waveStatus = "missed";
    state.misses += 1;
    state.currentStreak = 0;
    state.fieldFlashUntil = now + 240;

    for (const bug of state.bugs){
      addBugPoof(bug, now);
      bug.status = "poof";
      bug.poofAt = now;
    }

    showOverlay("Poof!", 440);

    const timing = MODE_TIMING[selectedMode] || MODE_TIMING.medium;
    scheduleAction(timing.missDelay, () => {
      if (!state.done && !state.bonusMode && !state.bonusIntroActive) spawnWave();
    });
  }

  function fireTongueToBug(bug, now, duration, isBonus, streakForTongue = 0){
    const frog = getFrogPoint();
    const bugPoint = getBugPoint(bug, now, { ignoreEat:true });

    if (bug){
      bug.eatFromX = bugPoint.x;
      bug.eatFromY = bugPoint.y;
      bug.eatToX = frog.x;
      bug.eatToY = frog.y;
      bug.eatStartedAt = now;
      bug.eatDuration = duration;
      bug.pullPoofed = false;
    }

    state.tongue = {
      fromX: frog.x,
      fromY: frog.y,
      toX: bugPoint.x,
      toY: bugPoint.y,
      startedAt: now,
      duration,
      isBonus: !!isBonus,
      streak: Number(streakForTongue) || 0,
      lastSparkAt: 0,
      wavePhase: Math.random() * Math.PI * 2
    };
  }

  function getFrogPoint(){
    const field = document.getElementById("bbField");
    const frogImg = document.querySelector("#bbFrog .bb-frog-img:not([hidden])");
    const frog = document.getElementById("bbFrog");
    const target = frogImg || frog;

    if (field && target){
      const fieldRect = field.getBoundingClientRect();
      const frogRect = target.getBoundingClientRect();

      return {
        x: frogRect.left - fieldRect.left + frogRect.width * 0.5,
        y: frogRect.top - fieldRect.top + frogRect.height * 0.25
      };
    }

    return {
      x: state.fieldWidth * 0.5,
      y: state.fieldHeight * 0.84
    };
  }

  function getBugPoint(bug, now = performance.now(), options = {}){
    if (!bug) return { x: state.fieldWidth * 0.5, y: state.fieldHeight * 0.35 };

    if (bug.status === "eating" && !options.ignoreEat && Number.isFinite(bug.eatFromX)){
      const duration = Math.max(1, Number(bug.eatDuration) || MAIN_EAT_MS);
      const elapsed = Math.max(0, now - (Number(bug.eatStartedAt) || now));
      const pullStart = duration * 0.44;
      const pullWindow = Math.max(1, duration - pullStart);
      const pullT = shell.clamp((elapsed - pullStart) / pullWindow, 0, 1);
      const eased = easeInCubic(pullT);

      return {
        x: bug.eatFromX + (bug.eatToX - bug.eatFromX) * eased,
        y: bug.eatFromY + (bug.eatToY - bug.eatFromY) * eased
      };
    }

    return {
      x: (bug.xRatio || 0.5) * state.fieldWidth,
      y: (bug.yRatio || 0.35) * state.fieldHeight
    };
  }

function showReaction(type){
  const now = performance.now();
  const timing = MODE_TIMING[selectedMode] || MODE_TIMING.medium;
  const duration = Math.max(420, Number(timing.reactionMs) || 580);

  state.reaction = {
    type,
    startedAt: now,
    duration,
    until: now + duration
  };
}

  function showOverlay(message, ms, extraClass = ""){
    state.overlayMessage = message;
    state.overlayUntil = performance.now() + ms;
    state.overlayClass = extraClass;
  }

function updateChosenBugSmokePoofs(now){
  function maybePoofBug(bug){
    if (!bug || bug.status !== "eating" || bug.pullPoofed) return;

    const duration = Math.max(1, Number(bug.eatDuration) || MAIN_EAT_MS);
    const elapsed = Math.max(0, now - (Number(bug.eatStartedAt) || now));
    const pullStart = duration * 0.44;

    if (elapsed < pullStart) return;

    addBugSmokePoof(bug, now);
    bug.pullPoofed = true;
  }

  for (const bug of state.bugs){
    maybePoofBug(bug);
  }

  maybePoofBug(state.tutorialBug);
  maybePoofBug(state.bonusBug);
}

function addBugSmokePoof(bug, now = performance.now()){
  if (!bug) return;

  const point = getBugPoint(bug, now);
  const count = 14;

  for (let index = 0; index < count; index += 1){
    const angle = (Math.PI * 2 * index / count) + (Math.random() - 0.5) * 0.6;
    const speed = Math.min(state.fieldWidth, state.fieldHeight) * (0.12 + Math.random() * 0.16);
    const life = 260 + Math.random() * 130;

    state.poofParticles.push({
      id: `smoke-poof-${now}-${index}-${Math.random()}`,
      x: point.x + (Math.random() - 0.5) * 10,
      y: point.y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 12 + Math.random() * 18,
      bornAt: now,
      life,
      spin: (Math.random() - 0.5) * 90,
      emoji: ""
    });
  }

  if (state.poofParticles.length > 100){
    state.poofParticles.splice(0, state.poofParticles.length - 100);
  }
}

function addBugPoof(bug, now = performance.now()){
  if (!bug) return;

  const point = getBugPoint(bug, now);
  const count = 12;

  for (let index = 0; index < count; index += 1){
    const angle = (Math.PI * 2 * index / count) + (Math.random() - 0.5) * 0.45;
    const speed = Math.min(state.fieldWidth, state.fieldHeight) * (0.16 + Math.random() * 0.18);
    const life = 320 + Math.random() * 160;

    state.poofParticles.push({
      id: `poof-${now}-${index}-${Math.random()}`,
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 9 + Math.random() * 14,
      bornAt: now,
      life,
      spin: (Math.random() - 0.5) * 140,
      emoji: Math.random() < 0.22 ? "✨" : ""
    });
  }

  if (state.poofParticles.length > 80){
    state.poofParticles.splice(0, state.poofParticles.length - 80);
  }
}

  function addSpitSpray(now = performance.now()){
    const origin = getFrogPoint();
    const count = 22;

    for (let index = 0; index < count; index += 1){
      const spread = (Math.random() - 0.5) * Math.PI * 1.05;
      const baseAngle = -Math.PI / 2 + spread;
      const speed = Math.min(state.fieldWidth, state.fieldHeight) * (0.32 + Math.random() * 0.42);
      const life = 360 + Math.random() * 220;

      state.spitParticles.push({
        id: `spit-${now}-${index}-${Math.random()}`,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        size: 4 + Math.random() * 7,
        bornAt: now,
        life
      });
    }
  }

  function scheduleAction(delayMs, fn){
    state.scheduledActions.push({
      at: performance.now() + Math.max(0, Number(delayMs) || 0),
      fn
    });
  }

  function runScheduledActions(now){
    const ready = [];
    state.scheduledActions = state.scheduledActions.filter((action) => {
      if (now >= action.at){
        ready.push(action);
        return false;
      }
      return true;
    });

    for (const action of ready){
      try { action.fn(); }
      catch (err){ console.error("Bible Bugs scheduled action failed", err); }
    }
  }

  function startBonusIntro(){
    if (state.bonusIntroActive || state.bonusMode || state.done) return;

    state.waveStatus = "bonus_intro";
    state.bugs = [];
    state.tongue = null;
    state.reaction = null;
    state.bonusIntroActive = true;
    state.bonusIntroUntil = performance.now() + 1700;
    showOverlay("", 0);
  }

  function startBonusRound(){
    state.bonusIntroActive = false;
    state.bonusMode = true;
    state.bonusEndsAt = performance.now() + BONUS_SECONDS * 1000;
    state.bonusBug = null;
    state.bonusEating = false;
    state.bugsEaten = 0;

    updateBuildText();
    spawnBonusBug();
  }

  function spawnBonusBug(){
    if (!state.bonusMode || state.done || state.bonusEating || state.bonusBug) return;

    const now = performance.now();
    const marginX = 0.16;
    const marginTop = 0.14;
    const marginBottom = 0.34;

    state.bonusBugId += 1;
    state.bonusBug = {
      id: `b${state.bonusBugId}`,
      emoji: BUG_EMOJIS[state.bonusBugId % BUG_EMOJIS.length],
      xRatio: shell.clamp(marginX + Math.random() * (1 - marginX * 2), marginX, 1 - marginX),
      yRatio: shell.clamp(marginTop + Math.random() * (1 - marginTop - marginBottom), marginTop, 1 - marginBottom),
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.055 + Math.random() * 0.055),
      vy: (Math.random() < 0.5 ? -1 : 1) * (0.040 + Math.random() * 0.050),
      bornAt: now,
      expiresAt: now + BONUS_BUG_LIFE_MS,
      status: "bonus",
      poofAt: 0,
      pullPoofed:false,
      motionPhase: Math.random() * Math.PI * 2,
      jitterSeed: Math.random() * Math.PI * 2
    };
  }

  function handleBonusTap(id){
    if (!state.bonusMode || state.bonusEating || state.paused || state.done) return;
    const bug = state.bonusBug;
    if (!bug || bug.id !== id || bug.status !== "bonus") return;

    const now = performance.now();
    state.bonusEating = true;
    bug.status = "eating";
    state.bugsEaten += 1;
    fireTongueToBug(bug, now, BONUS_EAT_MS, true);

    scheduleAction(BONUS_EAT_MS, () => {
      state.tongue = null;
      state.bonusBug = null;
      state.bonusEating = false;
      spawnBonusBug();
    });
  }

  function update(dt, now){
    runScheduledActions(now);

    state.spitParticles = state.spitParticles.filter((particle) => now - particle.bornAt < particle.life);

    state.poofParticles = state.poofParticles.filter((particle) => now - particle.bornAt < particle.life);

    updateTongueSparkles(now);
    state.tongueSparkles = state.tongueSparkles.filter((particle) => now - particle.bornAt < particle.life);

    updateChosenBugSmokePoofs(now);

    if (state.bonusIntroActive && now >= state.bonusIntroUntil){
      startBonusRound();
    }

    if (state.waveStatus === "falling"){
      let correctMissed = false;

      for (const bug of state.bugs){
        if (bug.status !== "falling") continue;
        const t = shell.clamp((now - bug.bornAt) / bug.fallMs, 0, 1);
        bug.yRatio = bug.startY + (bug.endY - bug.startY) * t;
        if (t >= 1 && bug.correct) correctMissed = true;
      }

      if (correctMissed) missCorrectBug();
    }

    updateBonusBug(dt, now);

    if (state.reaction && now >= state.reaction.until){
      state.reaction = null;
    }

    if (state.bonusMode && now >= state.bonusEndsAt){
      if (state.bonusBug && state.bonusBug.status !== "poof"){
        state.bonusBug.status = "poof";
        state.bonusBug.poofAt = now;
      }
      if (!state.bonusEating && (!state.bonusBug || state.bonusBug.status === "gone")){
        finishGame();
      }
    }
  }

  function updateBonusBug(dt, now){
    const bug = state.bonusBug;
    if (!state.bonusMode || !bug) return;

    if (bug.status === "bonus"){
      const fieldRatio = state.fieldWidth && state.fieldHeight ? state.fieldWidth / state.fieldHeight : 0.75;
      bug.xRatio += bug.vx * dt;
      bug.yRatio += bug.vy * dt * fieldRatio;

      if (bug.xRatio < 0.12 || bug.xRatio > 0.88){
        bug.vx *= -1;
        bug.xRatio = shell.clamp(bug.xRatio, 0.12, 0.88);
      }

      if (bug.yRatio < 0.14 || bug.yRatio > 0.66){
        bug.vy *= -1;
        bug.yRatio = shell.clamp(bug.yRatio, 0.14, 0.66);
      }

      if (now >= bug.expiresAt){
        bug.status = "poof";
        bug.poofAt = now;
      }
    }

    if (bug.status === "poof" && now - bug.poofAt > 260){
      state.bonusBug = null;
      if (state.bonusMode && now < state.bonusEndsAt) spawnBonusBug();
    }
  }

  function startLoop(){
    cancelAnimationFrame(state.rafId);
    state.lastTs = 0;
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
    const dt = Math.min(0.05, Math.max(0, (ts - state.lastTs) / 1000));
    state.lastTs = ts;

    if (!state.paused){
      update(dt, ts);
    }

    renderFrame();
    state.rafId = requestAnimationFrame(loop);
  }

  async function finishGame(){
    if (state.done) return;

    state.done = true;
    state.tutorialActive = false;
    state.tutorialStep = "";
    state.tutorialBug = null;
    state.bonusMode = false;
    state.bonusIntroActive = false;
    state.bonusBug = null;
    state.tongue = null;
    state.spitParticles = [];
    state.poofParticles = [];
    state.tongueSparkles = [];
    state.bugs = [];

    if (!completionMarked){
      completionMarked = true;
      try {
        completionResult = await window.VerseGameBridge.completeGameRun({
          verseId: ctx.verseId,
          gameId: GAME_ID,
          mode: selectedMode,
          stats: {
            correctEaten: state.correctEaten,
            mistakes: state.mistakes,
            misses: state.misses,
            bugsEaten: state.bugsEaten
          }
        });
      } catch (err){
        console.error("completeGameRun failed", err);
        completionResult = null;
      }
    }

    renderEndScreen();
  }

  function renderEndScreen(){
    stopLoop();

    shell.renderCompleteScreen({
      app,
      gameIcon: "🐸",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage: `Bugs eaten: ${state.bugsEaten}`,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: renderModeSelect,
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function renderFrame(){
    const field = document.getElementById("bbField");
    const waterSvg = document.getElementById("bbWaterWaveSvg");
    const play = document.getElementById("bbPlayLayer");
    const effects = document.getElementById("bbEffectsLayer");
    const frogTongueSlot = document.getElementById("bbFrogTongueSlot");
    const reactionLayer = document.getElementById("bbReactionLayer");
    const overlay = document.getElementById("bbOverlay");
    const bonusIntro = document.getElementById("bbBonusIntroOverlay");
    const statusPill = document.getElementById("bbStatusPill");
    const build = document.getElementById("bbBuild");
    const frog = document.getElementById("bbFrog");

    if (!field || !waterSvg || !play || !effects || !frogTongueSlot || !reactionLayer || !overlay || !bonusIntro || !statusPill || !build || !frog) return;

    const now = performance.now();
    field.classList.toggle("is-flash-bad", now < state.fieldFlashUntil);
    build.classList.toggle("is-shake", now < state.buildShakeUntil);
    frog.classList.toggle("is-chomping", now < state.frogChompUntil);

    renderWaterWaves(waterSvg, now);

    play.innerHTML = renderBugs();
    frogTongueSlot.innerHTML = renderTongue(now);
    effects.innerHTML = renderSpitParticles(now) + renderPoofParticles(now) + renderTongueSparkles(now);
    reactionLayer.innerHTML = renderReaction(now);

    const overlayClass = state.overlayClass ? ` ${escapeHtml(state.overlayClass)}` : "";

    overlay.innerHTML = now < state.overlayUntil && state.overlayMessage
      ? `<div class="bb-overlay-bubble${overlayClass}">${escapeHtml(state.overlayMessage)}</div>`
      : "";

    const showBonusIntro = state.bonusIntroActive && now < state.bonusIntroUntil;
    bonusIntro.classList.toggle("is-open", showBonusIntro);
    bonusIntro.setAttribute("aria-hidden", showBonusIntro ? "false" : "true");

    statusPill.textContent = getStatusText(now);
  }

  function renderBugs(){
    const items = [];
    const now = performance.now();

  for (const bug of state.bugs){
    if (bug.status === "gone" || bug.status === "poof") continue;
    items.push(renderBugButton(bug, now, false));
  }

    if (state.tutorialBug){
      items.push(renderBugButton(state.tutorialBug, now, false));
    }

    if (state.bonusBug){
      items.push(renderBugButton(state.bonusBug, now, true));
    }

    return items.join("");
  }

function renderBugButton(bug, now, isBonus){
  const p = getBugPoint(bug, now);
  const motion = getBugMotionState(bug, now, isBonus);
  const isTutorial = !!bug.tutorial;
  const statusClass = bug.status === "poof" ? " is-poof" : bug.status === "eating" ? " is-eating" : "";
  const bonusClass = isBonus ? " bb-bug--bonus" : "";
  const popClass = now - bug.bornAt < 260 ? " is-pop" : "";
  const word = isBonus || isTutorial ? "" : `<div class="bb-bug-word">${escapeHtml(bug.text)}</div>`;
  const disabled = isTutorial
    ? state.tutorialStep !== "waiting" ? " disabled" : ""
    : (!isBonus && state.waveStatus !== "falling") || (isBonus && state.bonusEating) ? " disabled" : "";

  const x = p.x + motion.swayX;
  const y = p.y;
  const buttonTransform = `rotate(${motion.rotateDeg.toFixed(2)}deg) scale(${motion.scaleX.toFixed(3)}, ${motion.scaleY.toFixed(3)})`;

  return `
    <div class="bb-bug-wrap${bonusClass}${statusClass}${popClass}" style="--bb-x:${x.toFixed(2)}px; --bb-y:${y.toFixed(2)}px;">
    <button class="bb-bug-btn" type="button" data-bug-id="${escapeHtml(bug.id)}"${disabled} style="transform:${buttonTransform};">
      ${word}
      <span class="bb-bug-emoji" aria-hidden="true">${escapeHtml(bug.emoji || "🪰")}</span>
    </button>
    </div>
  `;
}
  
function renderWaterWaves(svg, now){
  if (!svg) return;

  const cfg = WATER_FX;
  const size = cfg.viewSize;
  const spacing = cfg.spacing;
  const rows = Math.ceil(size / spacing) + 4;

  // Seamless loop: phase moves from 0 to 2π, then returns to 0.
  // Because sin(x + 2π) === sin(x), there is no visible jump.
  const loopMs = 7200 / Math.max(0.1, cfg.speed);
  const phase = ((now % loopMs) / loopMs) * Math.PI * 2;

  const paths = [];

  for (let row = -2; row < rows; row += 1){
    const y = row * spacing + 28;
    const rowPhase = phase + row * 0.72;
    const alt = row % 2 !== 0;
    const d = buildWaterSinePath({
      y,
      size,
      amplitude: cfg.amplitude,
      frequency: cfg.frequency,
      phase: rowPhase,
      slantDeg: cfg.slantDeg,
      segments: cfg.segments
    });

    paths.push(`<path class="bb-water-wave-path${alt ? " is-alt" : ""}" d="${d}"></path>`);
  }

  svg.innerHTML = paths.join("");
}

function buildWaterSinePath({ y, size, amplitude, frequency, phase, slantDeg, segments }){
  const points = [];
  const center = size * 0.5;
  const slant = Math.tan((Number(slantDeg) || 0) * Math.PI / 180);

  for (let index = 0; index <= segments; index += 1){
    const s = index / segments;

    // Extend beyond the viewBox so the slanted waves do not expose edges.
    const x = -120 + s * (size + 240);
    const baseY = y + (x - center) * slant;
    const wave = Math.sin((Math.PI * 2 * frequency * s) + phase);

    points.push({
      x,
      y: baseY + wave * amplitude
    });
  }

  return points.map((point, index) => {
    const prefix = index === 0 ? "M" : "L";
    return `${prefix}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(" ");
}

function renderTongue(now){
  const t = state.tongue;
  if (!t) return "";

  const frog = document.getElementById("bbFrog");
  const field = document.getElementById("bbField");

  if (!frog || !field) return "";

  const frogRect = frog.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();

  const localFromX = t.fromX - (frogRect.left - fieldRect.left);
  const localFromY = t.fromY - (frogRect.top - fieldRect.top);
  const localToX = t.toX - (frogRect.left - fieldRect.left);
  const localToY = t.toY - (frogRect.top - fieldRect.top);

  const elapsed = now - t.startedAt;
  const half = t.duration / 2;
  let progress = elapsed <= half ? elapsed / half : 1 - ((elapsed - half) / half);
  progress = shell.clamp(progress, 0, 1);

  const eased = easeOutCubic(progress);
  const dxFull = localToX - localFromX;
  const dyFull = localToY - localFromY;
  const fullLength = Math.max(1, Math.hypot(dxFull, dyFull));

  const sparkleTier = getTongueSparkleTier(t.streak);
  const glowClass =
    sparkleTier === "rainbow"
      ? " bb-tongue--rainbow"
      : sparkleTier === "subtle"
        ? " bb-tongue--subtle"
        : "";

  const wave = getTongueWaveConfig(t.streak);

  if (wave && fullLength > 4){
    const visibleToX = localFromX + dxFull * eased;
    const visibleToY = localFromY + dyFull * eased;
    const dxVisible = visibleToX - localFromX;
    const dyVisible = visibleToY - localFromY;
    const visibleLength = Math.max(1, Math.hypot(dxVisible, dyVisible));
    const dirX = dxVisible / visibleLength;
    const dirY = dyVisible / visibleLength;
    const perpX = -dirY;
    const perpY = dirX;
    const fieldMin = Math.max(1, Math.min(state.fieldWidth, state.fieldHeight));
    const amp = fieldMin * wave.ampRatio * eased;
    const phase = (Number(t.wavePhase) || 0) + elapsed * wave.speed;
    const segments = Math.round(shell.clamp(
      visibleLength / 7 + wave.waves * 8,
      40,
      78
    ));
    const points = [];

    for (let index = 0; index <= segments; index += 1){
      const s = index / segments;
      const baseX = localFromX + dxVisible * s;
      const baseY = localFromY + dyVisible * s;

      // Envelope keeps the tongue attached cleanly at frog and bug ends.
      const envelope = Math.sin(Math.PI * s);
      const wiggle = Math.sin((Math.PI * 2 * wave.waves * s) + phase);
      const offset = envelope * wiggle * amp;

      points.push({
        x: baseX + perpX * offset,
        y: baseY + perpY * offset
      });
    }

    const path = points.map((point, index) => {
      const prefix = index === 0 ? "M" : "L";
      return `${prefix}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }).join(" ");

    const tipRadius = shell.clamp(fieldMin * 0.026, 8, 14);
    const svgClass = `bb-tongue-svg ${wave.tierClass}${glowClass}`;

    return `
      <svg class="${svgClass}" aria-hidden="true">
        <path class="bb-tongue-svg-glow" d="${path}"></path>
        <path class="bb-tongue-svg-line" d="${path}"></path>
        <circle class="bb-tongue-svg-tip" cx="${visibleToX.toFixed(2)}" cy="${visibleToY.toFixed(2)}" r="${tipRadius.toFixed(2)}"></circle>
      </svg>
    `;
  }

  const length = Math.max(0, fullLength * eased);
  const angle = Math.atan2(dyFull, dxFull) * 180 / Math.PI;

  return `
    <div class="bb-tongue${glowClass}" style="--bb-tongue-x:${localFromX}px; --bb-tongue-y:${localFromY}px; --bb-tongue-l:${length}px; --bb-tongue-a:${angle}deg;">
      <div class="bb-tongue-glow"></div>
      <div class="bb-tongue-line"></div>
      <div class="bb-tongue-tip"></div>
    </div>
  `;
}


  function renderSpitParticles(now){
    if (!state.spitParticles.length) return "";

    const gravity = state.fieldHeight * 1.7;

    return state.spitParticles.map((particle) => {
      const age = Math.max(0, now - particle.bornAt);
      const t = age / 1000;
      const lifeT = shell.clamp(age / particle.life, 0, 1);
      const x = particle.x + particle.vx * t;
      const y = particle.y + particle.vy * t + 0.5 * gravity * t * t;
      const opacity = Math.max(0, 1 - lifeT);
      const scale = 1 - lifeT * 0.35;

      return `<span class="bb-spit-dot" style="left:${x}px; top:${y}px; width:${particle.size}px; height:${particle.size}px; opacity:${opacity}; transform:translate(-50%,-50%) scale(${scale});"></span>`;
    }).join("");
  }

function getTongueWaveConfig(streak){
  const value = Number(streak) || 0;

  if (value >= 15){
    return {
      ampRatio: 0.064,
      waves: 3.35,
      speed: 0.024,
      tierClass: "bb-tongue-svg--legendary"
    };
  }

  if (value >= 12){
    return {
      ampRatio: 0.052,
      waves: 2.75,
      speed: 0.021,
      tierClass: "bb-tongue-svg--strong"
    };
  }

  if (value >= 10){
    return {
      ampRatio: 0.042,
      waves: 2.25,
      speed: 0.019,
      tierClass: "bb-tongue-svg--medium"
    };
  }

  if (value >= 8){
    return {
      ampRatio: 0.030,
      waves: 1.65,
      speed: 0.017,
      tierClass: "bb-tongue-svg--gentle"
    };
  }

  return null;
}

function getTongueSparkleTier(streak){
  const value = Number(streak) || 0;

  if (value >= 5) return "rainbow";
  if (value >= 3) return "subtle";

  return "none";
}

function getTongueTipPoint(tongue, now){
  if (!tongue){
    return {
      x: state.fieldWidth * 0.5,
      y: state.fieldHeight * 0.75
    };
  }

  const elapsed = now - tongue.startedAt;
  const half = tongue.duration / 2;
  let progress = elapsed <= half ? elapsed / half : 1 - ((elapsed - half) / half);
  progress = shell.clamp(progress, 0, 1);

  const eased = easeOutCubic(progress);

  return {
    x: tongue.fromX + (tongue.toX - tongue.fromX) * eased,
    y: tongue.fromY + (tongue.toY - tongue.fromY) * eased,
    progress,
    extending: elapsed <= half
  };
}

function updateTongueSparkles(now){
  const tongue = state.tongue;
  if (!tongue || tongue.isBonus) return;

  const tier = getTongueSparkleTier(tongue.streak);
  if (tier === "none") return;

  const elapsed = now - tongue.startedAt;
  const half = tongue.duration / 2;

  // Only leave a trail while the tongue is stretching outward.
  if (elapsed < 0 || elapsed > half) return;

  const interval = tier === "rainbow"
  ? TONGUE_FX.rainbowSparkInterval
  : TONGUE_FX.subtleSparkInterval;
  if (tongue.lastSparkAt && now - tongue.lastSparkAt < interval) return;

  tongue.lastSparkAt = now;

  const tip = getTongueTipPoint(tongue, now);
  const count = tier === "rainbow" ? 3 : 2;
  const colors = tier === "rainbow"
    ? ["#ff5ec4", "#ffd34d", "#5ee7ff", "#8cff7a", "#b879ff"]
    : ["#ffffff", "#ffd6ef", "#ff9bd0"];

  for (let index = 0; index < count; index += 1){
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.min(state.fieldWidth, state.fieldHeight) * (0.045 + Math.random() * 0.085);
    const life = tier === "rainbow"
      ? 360 + Math.random() * 140
      : 260 + Math.random() * 100;
    const size = tier === "rainbow"
      ? 6 + Math.random() * 7
      : 3 + Math.random() * 5;

    state.tongueSparkles.push({
      id: `tongue-spark-${now}-${index}-${Math.random()}`,
      x: tip.x + (Math.random() - 0.5) * 8,
      y: tip.y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      bornAt: now,
      life,
      color: colors[Math.floor(Math.random() * colors.length)],
      rainbow: tier === "rainbow",
      spin: (Math.random() - 0.5) * 220
    });
  }

  if (state.tongueSparkles.length > 90){
    state.tongueSparkles.splice(0, state.tongueSparkles.length - 90);
  }
}

function renderTongueSparkles(now){
  if (!state.tongueSparkles.length) return "";

  return state.tongueSparkles.map((particle) => {
    const age = Math.max(0, now - particle.bornAt);
    const t = age / 1000;
    const lifeT = shell.clamp(age / particle.life, 0, 1);
    const eased = easeOutCubic(lifeT);

    const x = particle.x + particle.vx * t;
    const y = particle.y + particle.vy * t;
    const opacity = Math.max(0, 1 - eased);
    const scale = particle.rainbow
      ? 0.65 + eased * 0.75
      : 0.55 + eased * 0.55;
    const rotate = (particle.spin || 0) * lifeT;

    return `<span class="bb-tongue-sparkle${particle.rainbow ? " is-rainbow" : ""}" style="left:${x.toFixed(1)}px; top:${y.toFixed(1)}px; width:${particle.size.toFixed(1)}px; height:${particle.size.toFixed(1)}px; background:${escapeHtml(particle.color)}; opacity:${opacity.toFixed(3)}; transform:translate(-50%,-50%) rotate(${rotate.toFixed(1)}deg) scale(${scale.toFixed(3)});"></span>`;
  }).join("");
}

function renderPoofParticles(now){
  if (!state.poofParticles.length) return "";

  const gravity = state.fieldHeight * 0.32;

  return state.poofParticles.map((particle) => {
    const age = Math.max(0, now - particle.bornAt);
    const t = age / 1000;
    const lifeT = shell.clamp(age / particle.life, 0, 1);
    const eased = easeOutCubic(lifeT);

    const x = particle.x + particle.vx * t;
    const y = particle.y + particle.vy * t + 0.5 * gravity * t * t;
    const opacity = Math.max(0, 1 - eased);
    const scale = 0.45 + eased * 1.05;
    const rotate = (particle.spin || 0) * lifeT;

    if (particle.emoji){
      return `<span class="bb-poof-spark" style="left:${x}px; top:${y}px; opacity:${opacity.toFixed(3)}; transform:translate(-50%,-50%) rotate(${rotate.toFixed(1)}deg) scale(${scale.toFixed(3)});">${particle.emoji}</span>`;
    }

    return `<span class="bb-poof-dot" style="left:${x}px; top:${y}px; width:${particle.size}px; height:${particle.size}px; opacity:${opacity.toFixed(3)}; transform:translate(-50%,-50%) scale(${scale.toFixed(3)});"></span>`;
  }).join("");
}

function renderReaction(now){
  const reaction = state.reaction;
  if (!reaction || now >= reaction.until) return "";

  const isIncorrect = reaction.type === "incorrect";
  const duration = Math.max(1, Number(reaction.duration) || 580);
  const startedAt = Number(reaction.startedAt) || (reaction.until - duration);
  const age = Math.max(0, now - startedAt);
  const t = shell.clamp(age / duration, 0, 1);

  let scale = 1;
  let rotate = 0;

  if (t < 0.18){
    const popT = easeOutCubic(t / 0.18);
    scale = 0.55 + (1.14 - 0.55) * popT;
    rotate = isIncorrect ? 5 - 8 * popT : -5 + 8 * popT;
  } else if (t < 0.62){
    const settleT = easeOutCubic((t - 0.18) / 0.44);
    scale = 1.14 + (1 - 1.14) * settleT;
    rotate = isIncorrect ? -3 + (0 + 3) * settleT : 3 + (0 - 3) * settleT;
  } else {
    const fadeT = easeOutCubic((t - 0.62) / 0.38);
    scale = 1 + 0.08 * fadeT;
    rotate = 0;
  }

  const fadeIn = easeOutCubic(shell.clamp(t / 0.12, 0, 1));
  const fadeOut = shell.clamp((t - 0.72) / 0.28, 0, 1);
  const opacity = Math.max(0, fadeIn * (1 - fadeOut));

  const imgSrc = isIncorrect ? IMAGE_PATHS.frogGross : IMAGE_PATHS.frogHappy;
  const altText = isIncorrect ? "Grossed-out frog" : "Happy frog";
  const fallback = isIncorrect ? "🐸🤢" : "🐸✨";
  const typeClass = isIncorrect ? "bb-reaction--incorrect" : "bb-reaction--correct";

  return `
    <div
      class="bb-reaction ${typeClass}"
      style="opacity:${opacity.toFixed(3)}; transform:translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg);"
    >
      <img class="bb-reaction-img" src="${escapeHtml(imgSrc)}" alt="${altText}" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
      <div class="bb-reaction-fallback" hidden>${fallback}</div>
    </div>
  `;
}


  function renderFrog(){
    return `
      <div class="bb-frog" id="bbFrog">
        <img class="bb-lilypad-img" src="${escapeHtml(IMAGE_PATHS.lilyPad)}" alt="" aria-hidden="true" onerror="this.hidden=true;">
        <div class="bb-frog-tongue-slot" id="bbFrogTongueSlot"></div>
        <img class="bb-frog-img" src="${escapeHtml(IMAGE_PATHS.frogIdle)}" alt="Frog" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
        <div class="bb-frog-fallback" hidden>🐸</div>
      </div>
    `;
  }

  function getStatusText(now){
    if (state.bonusMode){
      const secondsLeft = Math.max(0, Math.ceil((state.bonusEndsAt - now) / 1000));
      return `🐞 ${state.bugsEaten} · ${secondsLeft}s`;
    }

    if (state.bonusIntroActive) return "Bonus!";

    const label = state.phase === "book"
      ? "Book"
      : state.phase === "reference"
        ? "Reference"
        : `${Math.min(state.progressIndex + 1, buildData.words.length)}/${Math.max(1, buildData.words.length)}`;

    return label;
  }

function getBugMotionState(bug, now = performance.now(), isBonus = false){
  if (!bug || bug.status === "eating"){
    return {
      swayX: 0,
      rotateDeg: 0,
      scaleX: 1,
      scaleY: 1
    };
  }

  const phase = Number(bug.motionPhase) || 0;
  const elapsed = Math.max(0, now - (Number(bug.bornAt) || now)) / 1000;

  const fieldWidth = Math.max(1, Number(state.fieldWidth) || 1);
  const amount = fieldWidth * BUG_MOTION.sideAmountRatio * (isBonus ? 0.72 : 1);

  // Gentle side-to-side from the sampler.
  const w = elapsed * Math.PI * 2 * BUG_MOTION.sideSpeed;
  const swayX = Math.sin(w + phase) * amount;

  // Gentle rotate from the sampler.
  const rotateDeg = Math.sin(elapsed * 3 + phase) * BUG_MOTION.rotationAmount;

  // Gentle pulse from the sampler. This grows/shrinks both axes together.
  const pulse = Math.sin(elapsed * 4.5 + phase) * BUG_MOTION.squishAmount;

  return {
    swayX,
    rotateDeg,
    scaleX: 1 + pulse,
    scaleY: 1 + pulse
  };
}

function easeInQuad(t){ return t * t; }
function easeInCubic(t){ return t * t * t; }
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
