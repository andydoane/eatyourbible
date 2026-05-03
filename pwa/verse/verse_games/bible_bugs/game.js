(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "bible_bugs";
  const GAME_TITLE = "Bible Bugs";
  const BUILD_AREA = "compact";
  const HELP_OVERLAY_ID = "bbHelpOverlay";
  const GAME_MENU_ID = "bbGameMenuOverlay";

  const GAME_THEME = {
    bg: "#ffffff",
    accent: "#2f7d49",
    helpTitleBg: "#2f7d49",
    helpTitleColor: "#ffffff",
    helpCloseBg: "#2f7d49",
    helpCloseColor: "#ffffff"
  };

  const IMAGE_PATHS = {
    frogIdle: "./bible_bugs_images/bible_bugs_frog_idle.png",
    frogHappy: "./bible_bugs_images/bible_bugs_frog_happy.png",
    frogGross: "./bible_bugs_images/bible_bugs_frog_gross.png"
  };

  const BUG_EMOJIS = ["🪰", "🐞", "🐝", "🦟", "🪲", "🐛"];
  const LANES = [0.18, 0.50, 0.82];
  const BONUS_SECONDS = 20;

  const MODE_TIMING = {
    easy: { fallSeconds: 6.8, nextDelay: 520, reactionMs: 720, missDelay: 520 },
    medium: { fallSeconds: 5.8, nextDelay: 460, reactionMs: 660, missDelay: 460 },
    hard: { fallSeconds: 4.9, nextDelay: 420, reactionMs: 600, missDelay: 420 }
  };

  const BONUS_BUG_LIFE_MS = 1850;
  const BONUS_EAT_MS = 360;
  const MAIN_EAT_MS = 420;

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
    phase:"words",
    waveId:0,
    waveStatus:"idle",
    bugs:[],
    tongue:null,
    scheduledActions:[],
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
    state.lastTs = 0;
    state.progressIndex = 0;
    state.buildFitDone = false;
    state.buildShakeUntil = 0;
    state.fieldFlashUntil = 0;
    state.reaction = null;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.phase = "words";
    state.waveId = 0;
    state.waveStatus = "idle";
    state.bugs = [];
    state.tongue = null;
    state.scheduledActions = [];
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
    renderFrame();
    spawnWave();
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
  }

  function openHelpFromMenu(){
    const menuOverlay = document.getElementById(GAME_MENU_ID);
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    shell.openHelp(HELP_OVERLAY_ID, "back", "Back");
    setPaused(true, "help");
  }

  function setPaused(paused, reason = ""){
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused) state.lastTs = performance.now();
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

  function getChoices(){
    const target = currentTarget();
    const phase = state.phase;
    let decoys = [];

    if (phase === "book"){
      decoys = shell.getBookDecoys(buildData.bookLabel, 2);
    } else if (phase === "reference"){
      decoys = shell.getReferenceDecoys(parsedRef, selectedMode, 2);
    } else if (selectedMode === "easy"){
      decoys = shell.getFunWordDecoys(target, buildData.words, 2);
    } else {
      decoys = shell.getVerseWordDecoys({
        words: buildData.words,
        correct: target,
        targetIndex: state.progressIndex,
        count: 2,
        avoidNext: 2,
        fallbackToFun: true
      });
    }

    const used = new Set([shell.normalizeWord(target)]);
    const out = [{ text: target, correct:true }];

    for (const decoy of decoys){
      const key = shell.normalizeWord(decoy);
      if (!key || used.has(key)) continue;
      out.push({ text: decoy, correct:false });
      used.add(key);
      if (out.length >= 3) break;
    }

    for (const decoy of shell.getFunWordDecoys(target, buildData.words, 8)){
      const key = shell.normalizeWord(decoy);
      if (!key || used.has(key)) continue;
      out.push({ text: decoy, correct:false });
      used.add(key);
      if (out.length >= 3) break;
    }

    return shell.shuffle(out).slice(0, 3);
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
    state.reaction = null;
    state.bugs = choices.map((choice, index) => ({
      id: `w${state.waveId}-${index}`,
      text: choice.text,
      correct: choice.correct,
      emoji: BUG_EMOJIS[(state.waveId + index) % BUG_EMOJIS.length],
      xRatio: shuffledLanes[index] || LANES[index] || 0.5,
      startY: -0.16,
      endY: 0.76,
      bornAt: now,
      fallMs,
      status: "falling",
      poofAt: 0,
      selected:false,
      eaten:false
    }));
  }

  function handleBugTap(id){
    if (state.paused || state.done || state.bonusIntroActive) return;

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
        item.status = "poof";
        item.poofAt = now;
      }
    }

    fireTongueToBug(bug, now, MAIN_EAT_MS, false);

    scheduleAction(MAIN_EAT_MS, () => finishMainEat(bug));
  }

  function finishMainEat(bug){
    const isCorrect = !!bug.correct;
    const now = performance.now();

    state.tongue = null;
    state.bugs = [];
    state.waveStatus = "resolving";

    if (isCorrect){
      state.progressIndex = Math.min(buildData.segments.length, state.progressIndex + 1);
      state.correctEaten += 1;
      updatePhase();
      updateBuildText();
      showReaction("correct");
      showOverlay("Yum!", 520);
    } else {
      state.mistakes += 1;
      state.buildShakeUntil = now + 320;
      state.fieldFlashUntil = now + 280;
      showReaction("wrong");
      showOverlay("Bleh! Try the next one.", 720);
    }

    const timing = MODE_TIMING[selectedMode] || MODE_TIMING.medium;
    scheduleAction(timing.nextDelay + timing.reactionMs, () => {
      if (!state.done && !state.bonusMode && !state.bonusIntroActive) spawnWave();
    });
  }

  function missCorrectBug(){
    const now = performance.now();
    state.waveStatus = "missed";
    state.misses += 1;
    state.fieldFlashUntil = now + 240;

    for (const bug of state.bugs){
      bug.status = "poof";
      bug.poofAt = now;
    }

    showOverlay("Poof!", 440);

    const timing = MODE_TIMING[selectedMode] || MODE_TIMING.medium;
    scheduleAction(timing.missDelay, () => {
      if (!state.done && !state.bonusMode && !state.bonusIntroActive) spawnWave();
    });
  }

  function fireTongueToBug(bug, now, duration, isBonus){
    const frog = getFrogPoint();
    const bugPoint = getBugPoint(bug);

    state.tongue = {
      fromX: frog.x,
      fromY: frog.y,
      toX: bugPoint.x,
      toY: bugPoint.y,
      startedAt: now,
      duration,
      isBonus: !!isBonus
    };
  }

  function getFrogPoint(){
    return {
      x: state.fieldWidth * 0.5,
      y: state.fieldHeight * 0.90
    };
  }

  function getBugPoint(bug){
    if (!bug) return { x: state.fieldWidth * 0.5, y: state.fieldHeight * 0.35 };
    return {
      x: (bug.xRatio || 0.5) * state.fieldWidth,
      y: (bug.yRatio || 0.35) * state.fieldHeight
    };
  }

  function showReaction(type){
    state.reaction = {
      type,
      until: performance.now() + ((MODE_TIMING[selectedMode] || MODE_TIMING.medium).reactionMs)
    };
  }

  function showOverlay(message, ms){
    state.overlayMessage = message;
    state.overlayUntil = performance.now() + ms;
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
      poofAt: 0
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

    if (state.bonusIntroActive && now >= state.bonusIntroUntil){
      startBonusRound();
    }

    if (state.waveStatus === "falling"){
      let correctMissed = false;

      for (const bug of state.bugs){
        if (bug.status !== "falling") continue;
        const t = shell.clamp((now - bug.bornAt) / bug.fallMs, 0, 1);
        bug.yRatio = bug.startY + (bug.endY - bug.startY) * easeInQuad(t);
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
    state.bonusMode = false;
    state.bonusIntroActive = false;
    state.bonusBug = null;
    state.tongue = null;
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
    const play = document.getElementById("bbPlayLayer");
    const effects = document.getElementById("bbEffectsLayer");
    const reactionLayer = document.getElementById("bbReactionLayer");
    const overlay = document.getElementById("bbOverlay");
    const bonusIntro = document.getElementById("bbBonusIntroOverlay");
    const statusPill = document.getElementById("bbStatusPill");
    const build = document.getElementById("bbBuild");

    if (!field || !play || !effects || !reactionLayer || !overlay || !bonusIntro || !statusPill || !build) return;

    const now = performance.now();
    field.classList.toggle("is-flash-bad", now < state.fieldFlashUntil);
    build.classList.toggle("is-shake", now < state.buildShakeUntil);

    play.innerHTML = renderBugs();
    effects.innerHTML = renderTongue(now);
    reactionLayer.innerHTML = renderReaction(now);

    overlay.innerHTML = now < state.overlayUntil && state.overlayMessage
      ? `<div class="bb-overlay-bubble">${escapeHtml(state.overlayMessage)}</div>`
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
      if (bug.status === "gone") continue;
      items.push(renderBugButton(bug, now, false));
    }

    if (state.bonusBug){
      items.push(renderBugButton(state.bonusBug, now, true));
    }

    return items.join("");
  }

  function renderBugButton(bug, now, isBonus){
    const p = getBugPoint(bug);
    const statusClass = bug.status === "poof" ? " is-poof" : bug.status === "eating" ? " is-eating" : "";
    const bonusClass = isBonus ? " bb-bug--bonus" : "";
    const popClass = now - bug.bornAt < 260 ? " is-pop" : "";
    const word = isBonus ? "" : `<div class="bb-bug-word">${escapeHtml(bug.text)}</div>`;
    const disabled = state.waveStatus !== "falling" && !isBonus ? " disabled" : "";

    return `
      <div class="bb-bug-wrap${bonusClass}${statusClass}${popClass}" style="--bb-x:${p.x}px; --bb-y:${p.y}px;">
        <button class="bb-bug-btn" type="button" data-bug-id="${escapeHtml(bug.id)}"${disabled}>
          <span class="bb-bug-emoji" aria-hidden="true">${escapeHtml(bug.emoji || "🪰")}</span>
          ${word}
        </button>
      </div>
    `;
  }

  function renderTongue(now){
    const t = state.tongue;
    if (!t) return "";

    const elapsed = now - t.startedAt;
    const half = t.duration / 2;
    let progress = elapsed <= half ? elapsed / half : 1 - ((elapsed - half) / half);
    progress = shell.clamp(progress, 0, 1);
    const eased = easeOutCubic(progress);
    const dx = t.toX - t.fromX;
    const dy = t.toY - t.fromY;
    const length = Math.max(0, Math.hypot(dx, dy) * eased);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    return `
      <div class="bb-tongue" style="--bb-tongue-x:${t.fromX}px; --bb-tongue-y:${t.fromY}px; --bb-tongue-l:${length}px; --bb-tongue-a:${angle}deg;">
        <div class="bb-tongue-line"></div>
        <div class="bb-tongue-tip"></div>
      </div>
    `;
  }

  function renderReaction(now){
    const reaction = state.reaction;
    if (!reaction || now >= reaction.until) return "";

    const isCorrect = reaction.type === "correct";
    const img = isCorrect ? IMAGE_PATHS.frogHappy : IMAGE_PATHS.frogGross;
    const alt = isCorrect ? "Happy frog" : "Grossed-out frog";
    const fallback = isCorrect ? "🐸✨" : "🐸🤢";
    const label = isCorrect ? "Yum!" : "Bleh!";

    return `
      <div class="bb-reaction bb-reaction--${isCorrect ? "correct" : "wrong"}">
        <img class="bb-reaction-img" src="${escapeHtml(img)}" alt="${escapeHtml(alt)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">
        <div class="bb-reaction-fallback" hidden>${fallback}</div>
        <div class="bb-reaction-label">${label}</div>
      </div>
    `;
  }

  function renderFrog(){
    return `
      <div class="bb-frog" id="bbFrog">
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

  function easeInQuad(t){ return t * t; }
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
