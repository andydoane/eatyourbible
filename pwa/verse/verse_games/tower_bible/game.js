(async function () {
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "tower_bible";

  const GAME_THEME = {
    bg: "#40b9c5",
    accent: "#40b9c5"
  };

  const HELP_OVERLAY_ID = "tbHelpOverlay";

  const BOOKS = window.VerseGameShell.getBibleBookDecoys();

  const FUN_DECOYS = window.VerseGameShell.getFunDecoys();

  const ZONE_PERCENTAGES = {
    easy: [0.05, 0.15, 0.60, 0.15, 0.05],
    medium: [0.10, 0.20, 0.40, 0.20, 0.10],
    hard: [0.20, 0.20, 0.20, 0.20, 0.20]
  };
  const BELT_SPEED_FACTORS = {
    easy: 0.92,
    medium: 1.04,
    hard: 1.18
  };

  const THRESHOLDS = {
    easy: { warn1: 999, warn2: 999, collapse: 999 },
    medium: { warn1: 8, warn2: 12, collapse: 16 },
    hard: { warn1: 7, warn2: 11, collapse: 15 }
  };

  const DEBUG_COLLAPSE = false;

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let alreadyCompletedForMode = false;
  let completionResult = null;
  let resizeBound = false;
  let endScreenUnlockTimer = 0;

  const verseMeta = parseVerseMeta(ctx.verseId || "", ctx.verseRef || "");
  const verseTokens = tokenizeVerse(ctx.verseText || "");
  const wordEntries = extractWordEntries(verseTokens);

  const state = {
    running: false,
    paused: false,
    pauseReason: "",
    rafId: 0,
    lastTs: 0,

    fieldWidth: 0,
    fieldHeight: 0,
    laneY: 0,
    laneHeight: 0,
    lanePadX: 0,
    guideCenterX: 0,
    guideLeftX: 0,
    guideRightX: 0,
    guideWidth: 0,
    brickWidth: 0,
    brickHeight: 0,
    brickGap: 0,
    brickStep: 0,
    beltSpeed: 0,
    towerWidth: 0,

    progress: [],
    phase: "words",
    wordIndex: 0,

    towerShakeUntil: 0,
    towerSettleUntil: 0,
    guideFlashUntil: 0,
    overlayMessage: "",
    overlayUntil: 0,
    warningLevel: 0,
    hadWarning2BeforePlacement: false,
    beltRespawnLockUntil: 0,
    beltNeedsFreshSpawn: false,
    collapseTriggered: false,
    collapseEndsAt: 0,
    collapseStartedAt: 0,
    collapseDir: 1,
    collapseBasePose: null,
    lastStableTowerPose: null,
    pendingPreCollapsePose: null,
    collapseBurstFired: {},
    collapseDebugFramesLeft: 0,

    stream: [],
    streamId: 0,
    fx: [],
    enteringBrick: null,
    enteringId: 0,
    done: false,
    frenzyActive: false,
    frenzyInputLockedUntil: 0,

    pendingCorrectLabel: "",
    pendingCorrectType: "word",
    pendingCorrectVisible: 0,
    spawnIndex: 0
  };

  renderIntro();

  function renderIntro() {
    stopLoop();

    window.VerseGameShell.renderTitleScreen({
      app,
      title: "Tower of Bible",
      icon: "🏰",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: renderModeSelect
    });
  }

  function renderModeSelect() {
    stopLoop();

    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Difficulty",
      icon: "🥉🥈🥇",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Tower of Bible title",
      onBack: renderIntro,
      onSelect: startGame
    });
  }

  function startGame(mode) {
    selectedMode = mode;
    completionMarked = false;
    completionResult = null;
    alreadyCompletedForMode = !!window.VerseGameBridge.wasAlreadyCompleted?.(ctx.verseId, GAME_ID, selectedMode);

    Object.assign(state, {
      running: true, paused: false, pauseReason: "", lastTs: 0,
      progress: [], phase: "words", wordIndex: 0,
      towerShakeUntil: 0, towerSettleUntil: 0, guideFlashUntil: 0,
      overlayMessage: "", overlayUntil: 0,
      warningLevel: 0, hadWarning2BeforePlacement: false, beltRespawnLockUntil: 0, beltNeedsFreshSpawn: false, collapseTriggered: false, collapseEndsAt: 0, collapseStartedAt: 0, collapseDir: 1, collapseBasePose: null, lastStableTowerPose: null, pendingPreCollapsePose: null, collapseBurstFired: {}, collapseDebugFramesLeft: 0,
      stream: [], streamId: 0, fx: [], enteringBrick: null, enteringId: 0,
      done: false, frenzyActive: false, frenzyInputLockedUntil: 0, pendingCorrectLabel: "", pendingCorrectType: "word",
      pendingCorrectVisible: 0, spawnIndex: 0
    });
    updatePhaseFromProgress(0);
    seedPendingCorrect();

    app.innerHTML = `
      <div class="tb-shell">
        <div class="tb-stage">
          <div class="tb-field-wrap">
            <div class="tb-field" id="tbField">
              <div class="tb-cloud c1">☁️</div>
              <div class="tb-cloud c2">☁️</div>
              <div class="tb-tower-layer" id="tbTowerLayer"></div>
              <div class="tb-warning-layer" id="tbWarningLayer"></div>
              <div class="tb-guide-layer" id="tbGuideLayer"></div>
              <div class="tb-conveyor-layer" id="tbConveyorLayer"></div>
              <div class="tb-enter-layer" id="tbEnterLayer"></div>
              <div class="tb-smoke-layer" id="tbSmokeLayer"></div>
              <div id="tbDebugLayer" style="position:absolute;left:8px;bottom:8px;z-index:20;pointer-events:none;"></div>
              <div class="tb-controls-layer">
                <button class="tb-corner-pill tb-corner-left" id="tbMenuPill" type="button" aria-label="Game menu">☰</button>
                <div class="tb-corner-pill tb-corner-right" id="tbPhasePill"></div>
              </div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay(helpHtml())}
        ${renderGameMenuOverlay()}
      </div>`;

    wireCommonNav();
    wireGameInput();
    recalcField();
    fillInitialStream();
    renderHud();
    startLoop();
  }

  function renderEndScreen(reward) {
    stopLoop();

    window.clearTimeout(endScreenUnlockTimer);
    endScreenUnlockTimer = 0;

    const gameMessage = completionResult?.alreadyCompleted
      ? "Tower rebuilt!"
      : "Tower complete!";

    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🏰",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: renderModeSelect,
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }


  function renderHelpOverlay(body) {
    return window.VerseGameShell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body,
      closeText: "Close"
    });
  }

  function renderGameMenuOverlay() {
    return window.VerseGameShell.gameMenuHtml({
      id: "tbGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function helpHtml() {
    return `Tap the correct brick when it reaches the center arrows.<br><br>
      The closer you tap to the center, the straighter your tower will build.<br><br>
      Keep your tower from leaning too far left or right.`;
  }

  function wireCommonNav() {
    window.VerseGameShell.wireGameMenu({
      id: "tbGameMenuOverlay",
      menuButtonId: "tbMenuPill",
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

  function wireGameInput() {
    if (!resizeBound) {
      window.addEventListener("resize", recalcField);
      resizeBound = true;
    }
    const menuPill = document.getElementById("tbMenuPill");
    if (menuPill) {
      menuPill.onclick = (e) => {
        if (e) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        openGameMenu();
      };
    }

    const field = document.getElementById("tbField");
    if (field) {
      field.onpointerdown = (e) => {
        const menuPillEl = document.getElementById("tbMenuPill");
        if (menuPillEl && menuPillEl.contains(e.target)) return;
        if (state.frenzyActive) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          handleFrenzyTap();
        }
      };
    }

    window.onkeydown = (e) => {
      if (e.key === "Escape" && state.running) {
        if (document.getElementById("tbGameMenuOverlay")?.classList.contains("is-open")) closeGameMenu();
        else openGameMenu();
      }
    };
  }

  function openGameMenu() {
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    if (menuOverlay) {
      setPaused(true, "menu");
      menuOverlay.classList.add("is-open");
      menuOverlay.setAttribute("aria-hidden", "false");
    }
  }
  function closeGameMenu() {
    const menuOverlay = document.getElementById("tbGameMenuOverlay");

    if (menuOverlay && menuOverlay.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    if (menuOverlay) {
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    }

    const helpOverlay = document.getElementById("tbHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")) setPaused(false, "");
  }

  function openHelpFromMenu() {
    const menuOverlay = document.getElementById("tbGameMenuOverlay");

    if (menuOverlay) menuOverlay.classList.remove("is-open");

    window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");

    setPaused(true, "help");
  }

  function closeHelpOverlay() {
    window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);
    setPaused(false, "");
  }


  function backToMenuFromHelp() {
    window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);

    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    if (menuOverlay) menuOverlay.classList.add("is-open");

    setPaused(true, "menu");
  }


  function setPaused(paused, reason = "") {
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused) state.lastTs = performance.now();
  }

  function recalcField() {
    const field = document.getElementById("tbField");
    if (!field) return;
    const rect = field.getBoundingClientRect();

    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;

    state.brickWidth = clamp(state.fieldWidth * 0.27, 130, 188);
    state.brickHeight = clamp(state.fieldWidth * 0.11, 58, 78);
    state.brickGap = clamp(state.brickWidth * 1.08, 150, 236);
    state.brickStep = state.brickWidth + state.brickGap;
    state.guideWidth = state.brickWidth;
    state.laneHeight = Math.max(state.brickHeight + 18, clamp(state.fieldWidth * 0.16, 94, 126));
    state.lanePadX = 0;
    state.laneY = state.fieldHeight - laneBottomOffset() - state.laneHeight / 2;
    state.guideCenterX = state.fieldWidth / 2;
    state.guideLeftX = state.guideCenterX - state.guideWidth / 2;
    state.guideRightX = state.guideCenterX + state.guideWidth / 2;
    state.towerWidth = Math.min(state.fieldWidth * 0.86, 560);

    const effectiveStep = clamp(state.brickStep, 310, 390);
    state.beltSpeed = effectiveStep * BELT_SPEED_FACTORS[selectedMode || "easy"];

    renderHud();
  }

  function renderHud() {
    const phasePill = document.getElementById("tbPhasePill");
    if (phasePill) phasePill.textContent = currentPhaseLabel();
    renderField();
  }

  function currentPhaseLabel() {
    if (state.frenzyActive) return "Destroy!";
    if (state.done) return "Done";
    if (state.phase === "words") return `${state.wordIndex}/${wordEntries.length}`;
    if (state.phase === "book") return "Book";
    if (state.phase === "reference") return "Reference";
    return "Ready";
  }

  function getLinearProgressIndex() {
    if (state.phase === "words") {
      return state.wordIndex;
    }

    if (state.phase === "book") {
      return wordEntries.length;
    }

    if (state.phase === "reference") {
      return wordEntries.length + (verseMeta.book ? 1 : 0);
    }

    return wordEntries.length + (verseMeta.book ? 1 : 0) + (verseMeta.reference ? 1 : 0);
  }

  function updatePhaseFromProgress(progressIndex = getLinearProgressIndex()) {
    const phase = window.VerseGameShell.getPhaseForProgress({
      progressIndex,
      wordCount: wordEntries.length,
      totalSegments: wordEntries.length + (verseMeta.book ? 1 : 0) + (verseMeta.reference ? 1 : 0),
      bookLabel: verseMeta.book,
      referenceLabel: verseMeta.reference
    });

    state.phase = phase;
    return phase;
  }

  function renderField() {
    const towerLayer = document.getElementById("tbTowerLayer");
    const guideLayer = document.getElementById("tbGuideLayer");
    const conveyorLayer = document.getElementById("tbConveyorLayer");
    const enterLayer = document.getElementById("tbEnterLayer");
    const smokeLayer = document.getElementById("tbSmokeLayer");
    const warningLayer = document.getElementById("tbWarningLayer");
    const debugLayer = document.getElementById("tbDebugLayer");
    if (!towerLayer || !guideLayer || !conveyorLayer || !enterLayer || !smokeLayer || !warningLayer) return;

    renderTower(towerLayer);
    renderGuide(guideLayer);
    renderConveyor(conveyorLayer);
    renderEnteringBrick(enterLayer);
    renderOverlayMessage(guideLayer);
    renderEffects(smokeLayer);
    renderWarning(warningLayer);
    renderDebug(debugLayer);
  }

  function renderGuide(layer) {
    const laneTop = state.laneY - state.laneHeight / 2;
    const indicatorHeight = state.laneHeight / 3;

    layer.innerHTML = `
      <div class="tb-center-indicator-wrap" style="left:${state.guideCenterX}px;top:${laneTop}px;height:${state.laneHeight}px;--tb-indicator-height:${indicatorHeight}px;">
        <img
          class="tb-center-indicator tb-center-indicator-top"
          src="tower_bible_images/tower_bible_center_indicator.svg"
          alt=""
          aria-hidden="true"
        >
        <img
          class="tb-center-indicator tb-center-indicator-bottom"
          src="tower_bible_images/tower_bible_center_indicator.svg"
          alt=""
          aria-hidden="true"
        >
        <div class="tb-center-indicator-line" style="height:${state.laneHeight}px;"></div>
      </div>`;
  }

  function renderOverlayMessage(layer) {
    const now = performance.now();
    if (!layer) return;
    if (!state.overlayMessage || now >= state.overlayUntil) return;

    layer.innerHTML += `
      <div class="tb-center-overlay-msg">
        ${escapeHtml(state.overlayMessage)}
      </div>`;
  }

  function renderConveyor(layer) {
    const laneBottom = clamp(state.fieldWidth * 0.055, 24, 42);

    let html = `
      <div class="tb-conveyor-lane" style="left:${state.lanePadX}px;right:${state.lanePadX}px;bottom:${laneBottom}px;height:${state.laneHeight}px;">
    `;
    for (const brick of state.stream) {
      const tappable = isBrickTappable(brick) && !state.collapseTriggered && !state.enteringBrick;
      const classes = ["tb-choice-brick"];
      if (brick.kind === "book") classes.push("is-book");
      if (brick.kind === "reference") classes.push("is-ref");
      if (brick.flashWrong) classes.push("is-wrong");
      html += `
        <button class="${classes.join(" ")}" data-id="${brick.id}" style="left:${brick.left}px;width:${state.brickWidth}px;height:${state.brickHeight}px;font-size:${brick.fontSize}px;opacity:${brickVisualOpacity(brick).toFixed(3)};" aria-label="${brick.isCorrect ? "Correct brick" : "Brick"}">${escapeHtml(brick.label)}</button>`;
    }
    html += `
      </div>`;
    layer.innerHTML = html;

    layer.querySelectorAll("[data-id]").forEach((el) => {
      const id = Number(el.dataset.id);
      const brick = state.stream.find((b) => b.id === id);
      if (!brick) return;
      const onActivate = (e) => {
        if (e) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        handleBrickTap(id);
      };
      el.onclick = onActivate;
      el.onpointerdown = onActivate;
    });
  }

  function renderEnteringBrick(layer) {
    const e = state.enteringBrick;
    if (!e) {
      layer.innerHTML = "";
      return;
    }

    const cls = ["tb-enter-brick"];
    if (e.kind === "book") cls.push("book");
    if (e.kind === "reference") cls.push("ref");

    layer.innerHTML = `
      <div class="${cls.join(" ")}"
           style="
             left:${e.left}px;
             bottom:${e.bottom}px;
             width:${e.width}px;
             height:${e.height}px;
             font-size:${e.fontSize}px;
             transform:translateX(0) rotate(${e.rot}deg);
             opacity:1;
           ">
        ${escapeHtml(e.label)}
      </div>
    `;
  }

  function renderTower(layer) {
    const now = performance.now();
    const towerShellClass = ["tb-tower-shell"];
    if (!state.collapseTriggered) {
      if (state.towerShakeUntil > now) towerShellClass.push("tb-tower-shake");
      else if (state.towerSettleUntil > now) towerShellClass.push("tb-tower-settle");
    }

    const lean = getVisualLean();
    const count = state.progress.length;
    const maxLeanPx = Math.min(state.fieldWidth * 0.065, 46);
    const collapseElapsed = state.collapseTriggered ? (now - state.collapseStartedAt) : 0;
    const collapseTensionMs = 180;
    const collapseStepMs = 250;
    const collapseTipMs = 240;
    const collapseDropMs = 900;

    const shellRot = getTowerShellRotation(now);
    let html = `<div class="${towerShellClass.join(" ")}" id="tbTowerShell" style="transform:translateX(-50%) rotate(${shellRot}deg);">`;

    let cumulativeBottom = 0;
    const debugRenderedBricks = [];
    for (let i = 0; i < count; i++) {
      const brick = state.progress[i];
      const level = i;
      const t = count <= 1 ? 0 : level / Math.max(1, count - 1);
      const curve = Math.pow(t, 1.55);
      const scale = Math.max(0.54, Math.pow(0.95, level));
      const width = state.towerWidth * 0.76 * scale;
      const height = Math.max(34, state.brickHeight * 0.9 * scale);
      const fontSize = Math.max(13, state.brickHeight * 0.33 * scale);


      const liveBaseOffsetX = count <= 1 ? 0 : lean * maxLeanPx * curve;
      const liveBaseRot = count <= 2 ? 0 : lean * 1.15 * Math.pow(t, 1.7);
      const frozenPose = state.collapseBasePose?.[i] || null;
      const baseOffsetX = frozenPose ? frozenPose.offsetX : liveBaseOffsetX;
      const baseRot = frozenPose ? frozenPose.rot : liveBaseRot;

      const cls = ["tb-tower-brick"];
      let opacity = Math.max(0.72, 1 - level * 0.02);
      let bottom = cumulativeBottom;
      let offsetX = baseOffsetX;
      let rot = baseRot;

      if (brick.kind === "book") cls.push("book");
      if (brick.kind === "reference") cls.push("ref", "capstone");

      if (state.collapseTriggered) {
        cls.push("is-collapsing");

        const topIndex = count - 1 - i; // top brick starts first
        const localStart = collapseTensionMs + topIndex * collapseStepMs;
        const elapsedForBrick = collapseElapsed - localStart;

        const tipT = clamp(elapsedForBrick / collapseTipMs, 0, 1);
        const fallT = clamp((elapsedForBrick - collapseTipMs) / collapseDropMs, 0, 1);

        const tipEase = tipT <= 0 ? 0 : Math.pow(tipT, 1.65);
        const fallEase = fallT <= 0 ? 0 : (1 - Math.pow(1 - fallT, 2.25));

        const burstKey = `c${i}`;
        if (fallT > 0 && !state.collapseBurstFired[burstKey]) {
          const burstX = state.fieldWidth * 0.5 + baseOffsetX;
          const burstY = state.fieldHeight - (towerBaseBottom() + cumulativeBottom + height * 0.5);
          addChunkBurst(burstX, burstY, Math.max(0.9, scale * 0.95));
          state.collapseBurstFired[burstKey] = true;
        }

        const tipRot = state.collapseDir * (22 * tipEase);
        const fallRot = state.collapseDir * (84 * fallEase);
        const fallShift = state.collapseDir * (132 * fallEase);

        offsetX = baseOffsetX + fallShift;
        bottom = cumulativeBottom - ((state.fieldHeight + 260 + topIndex * 44) * fallEase);
        rot = baseRot + tipRot + fallRot;
        opacity = Math.max(0, opacity * (1 - fallEase * 0.84));
      }

      else if (i === count - 1 && state.warningLevel > 0) {
        rot += getTopBrickWarningWobble(now);
      }



      if (DEBUG_COLLAPSE && state.collapseTriggered) {
        debugRenderedBricks.push({
          i,
          label: brick.label,
          baseOffsetX,
          offsetX,
          baseRot,
          rot,
          bottom
        });
      }

      html += `<div class="${cls.join(" ")}" style="bottom:${bottom}px;width:${width}px;height:${height}px;font-size:${fontSize}px;opacity:${opacity.toFixed(3)};transform:translateX(calc(-50% + ${offsetX}px)) rotate(${rot}deg)">${escapeHtml(brick.label)}</div>`;

      if (!state.collapseTriggered && i === 0 && showBottomWarningOverlay(now)) {
        const warningClass = state.warningLevel >= 2 ? "tb-warning-overlay danger" : "tb-warning-overlay";
        const warningText = state.warningLevel >= 2 ? "WARNING!" : "WARNING";
        html += `<div class="${warningClass}" style="bottom:${bottom}px;width:${width}px;height:${height}px;font-size:${fontSize}px;transform:translateX(calc(-50% + ${offsetX}px)) rotate(${rot}deg)">${warningText}</div>`;
      }
      cumulativeBottom += height + clamp(state.brickHeight * 0.07, 4, 8);
    }

    if (!state.collapseTriggered) {
      state.lastStableTowerPose = state.progress.map((brick, i) => {
        const level = i;
        const t = count <= 1 ? 0 : level / Math.max(1, count - 1);
        const curve = Math.pow(t, 1.55);
        const liveBaseOffsetX = count <= 1 ? 0 : lean * maxLeanPx * curve;
        const liveBaseRot = count <= 2 ? 0 : lean * 1.15 * Math.pow(t, 1.7);
        return {
          offsetX: liveBaseOffsetX,
          rot: liveBaseRot
        };
      });
    }

    html += `</div>`;
    layer.innerHTML = html;

    logCollapseFrame(now, debugRenderedBricks);

  }

  function renderEffects(layer) {
    const now = performance.now();
    state.fx = state.fx.filter((fx) => fx.until > now);

    let html = "";

    if (state.collapseTriggered && (now - state.collapseStartedAt) < 700) {
      html += `
        <div class="tb-base-smoke is-open">
          <div class="p p1"></div><div class="p p2"></div><div class="p p3"></div><div class="p p4"></div><div class="p p5"></div>
        </div>`;
    }

    for (const fx of state.fx) {
      if (fx.kind === "chunk") {
        const life = Math.max(0, (fx.until - now) / 480);
        const t = 1 - life;
        const x = fx.x + (fx.dx || 0) * t;
        const y = fx.y + (fx.dy || 0) * t + 18 * t * t;
        html += `<div class="tb-chunk-puff" style="left:${x}px;top:${y}px;width:${fx.size}px;height:${fx.size}px;opacity:${life.toFixed(3)};transform:translate(-50%,-50%) rotate(${fx.rot}deg);"></div>`;
      } else {
        const scale = fx.scale || 1;
        html += `<div class="tb-smoke-puff" style="left:${fx.x}px;top:${fx.y}px;transform:translate(-50%,-50%) scale(${scale});"></div>`;
      }
    }

    layer.innerHTML = html;
  }

  function renderWarning(layer) {
    if (!layer) return;
    layer.innerHTML = "";
  }

  function renderDebug(layer) {
    if (!layer) return;
    layer.innerHTML = "";
  }

  function logCollapseFrame(now, renderedBricks) {
    if (!DEBUG_COLLAPSE) return;
    if (!state.collapseTriggered) return;
    if (state.collapseDebugFramesLeft <= 0) return;

    const elapsed = now - state.collapseStartedAt;
    const summary = renderedBricks.slice(0, 5).map((b) => ({
      i: b.i,
      label: b.label,
      baseOffsetX: Number(b.baseOffsetX.toFixed(2)),
      offsetX: Number(b.offsetX.toFixed(2)),
      baseRot: Number(b.baseRot.toFixed(2)),
      rot: Number(b.rot.toFixed(2)),
      bottom: Number(b.bottom.toFixed(2))
    }));

    console.group(`[TowerCollapseDebug] frame ${9 - state.collapseDebugFramesLeft}`);
    console.log("elapsed", Number(elapsed.toFixed(2)));
    console.log("warningLevel", state.warningLevel);
    console.log("leanScore", Number(getLeanScore().toFixed(3)));
    console.log("visualLean", Number(getVisualLean().toFixed(3)));
    console.table(summary);
    console.groupEnd();

    state.collapseDebugFramesLeft -= 1;
  }

  function startLoop() { stopLoop(); state.lastTs = 0; state.rafId = requestAnimationFrame(frame); }
  function stopLoop() { if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = 0; } }

  function frame(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(34, ts - state.lastTs);
    state.lastTs = ts;

    if (!state.paused) {
      step(dt, ts);
      renderHud();
    }
    state.rafId = requestAnimationFrame(frame);
  }

  function step(dt, now) {
    if (state.done) return;
    if (state.frenzyActive) return;

    if (state.collapseTriggered) {
      stepCollapse(dt);
      if (now >= state.collapseEndsAt) resetAfterCollapse();
      return;
    }

    stepStream(dt);
    stepEntering(dt);
    updateWarnings();
  }

  function stepStream(dt) {
    const distance = state.beltSpeed * (dt / 1000);
    for (const brick of state.stream) {
      brick.left -= distance;
      brick.center = brick.left + brick.width / 2;
      if (brick.flashWrongUntil && performance.now() >= brick.flashWrongUntil) {
        brick.flashWrong = false;
        brick.flashWrongUntil = 0;
      }
    }

    const leftCull = -state.brickWidth - 40;
    state.stream = state.stream.filter((brick) => brick.left > leftCull);
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;

    if (performance.now() >= state.beltRespawnLockUntil) {
      ensureStreamFilled();
    }
  }

  function stepEntering(dt) {
    if (!state.enteringBrick) return;
    const e = state.enteringBrick;
    e.progress = clamp(e.progress + dt / 320, 0, 1);
    const eased = easeOutBack(e.progress);
    e.left = lerp(e.fromLeft, e.toLeft, eased);
    e.bottom = lerp(e.fromBottom, e.toBottom, eased);
    e.width = lerp(e.fromWidth, e.toWidth, eased);
    e.height = lerp(e.fromHeight, e.toHeight, eased);
    e.fontSize = lerp(e.fromFontSize, e.toFontSize, eased);
    e.rot = lerp(0, e.toRot, eased);

    if (e.progress >= 1) {
      state.pendingPreCollapsePose = state.lastStableTowerPose
        ? state.lastStableTowerPose.map((p) => ({ offsetX: p.offsetX, rot: p.rot }))
        : [];

      const prevWarningLevel = state.warningLevel;

      state.progress.unshift({ label: e.label, kind: e.kind, zone: e.zone });
      state.enteringBrick = null;

      state.towerSettleUntil = performance.now() + 220;

      advancePhaseAfterPlacement();
      state.hadWarning2BeforePlacement = prevWarningLevel >= 2;
      updateWarnings();

      if (!state.done) {
        state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
        seedPendingCorrect();
        retargetExistingCorrectBricks();
        ensureStreamFilled();
      }
    }
  }

  function stepCollapse(dt) {
    // Visual collapse is driven directly from render time using
    // collapseStartedAt and collapseDir, so no per-frame mutation is needed here.
  }

  function resetAfterCollapse() {
    state.collapseTriggered = false;
    state.collapseStartedAt = 0;
    state.collapseDir = 1;
    state.collapseBasePose = null;
    state.lastStableTowerPose = null;
    state.pendingPreCollapsePose = null;
    state.collapseBurstFired = {};

    state.collapseDebugFramesLeft = 0;
    state.progress = [];
    state.phase = "words";
    state.wordIndex = 0;
    state.warningLevel = 0;
    state.hadWarning2BeforePlacement = false;
    state.beltRespawnLockUntil = 0;
    state.beltNeedsFreshSpawn = false;
    state.enteringBrick = null;
    state.frenzyActive = false;
    state.frenzyInputLockedUntil = 0;
    state.pendingCorrectVisible = 0;
    seedPendingCorrect();
    state.stream = [];
    fillInitialStream();
    state.collapseEndsAt = 0;
  }

  function fillInitialStream() {
    state.stream = [];
    let left = -state.brickWidth * 0.35;
    while (left < state.fieldWidth + state.brickWidth + 40) {
      const brick = createStreamBrick(left);
      state.stream.push(brick);
      left += state.brickStep;
    }
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
  }

  function ensureStreamFilled() {
    let rightMostLeft = state.stream.reduce((m, b) => Math.max(m, b.left), -Infinity);

    if (state.beltNeedsFreshSpawn || !Number.isFinite(rightMostLeft)) {
      let left = state.fieldWidth + state.brickWidth * 0.35;
      while (left < state.fieldWidth + state.brickWidth + state.brickStep * 3) {
        const brick = createStreamBrick(left);
        state.stream.push(brick);
        left += state.brickStep;
      }
      state.beltNeedsFreshSpawn = false;
      state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
      return;
    }

    while (rightMostLeft < state.fieldWidth + state.brickStep) {
      const left = rightMostLeft + state.brickStep;
      const brick = createStreamBrick(left);
      state.stream.push(brick);
      rightMostLeft = left;
    }
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
  }

  function createStreamBrick(left) {
    const correctKind = getPendingCorrectKind();
    const correctLabel = getPendingCorrectLabel();
    let isCorrect = false;
    let label = "";
    let kind = "word";

    if (shouldSpawnCorrect(left)) {
      isCorrect = true;
      label = correctLabel;
      kind = correctKind;
      state.pendingCorrectVisible += 1;
    } else {
      const decoy = makeDecoy(correctKind, correctLabel);
      label = decoy.label;
      kind = decoy.kind;
    }

    const fontSize = getConveyorFontSize(label, kind);
    const brick = {
      id: ++state.streamId,
      left,
      width: state.brickWidth,
      label,
      isCorrect,
      kind,
      fontSize,
      flashWrong: false,
      flashWrongUntil: 0,
      spawnIndex: state.spawnIndex++
    };
    brick.center = brick.left + brick.width / 2;
    return brick;
  }

  function shouldSpawnCorrect(left) {
    if (state.pendingCorrectVisible >= 2) return false;
    if (!getPendingCorrectLabel()) return false;

    const recentCorrects = state.stream.filter((brick) => brick.isCorrect).sort((a, b) => b.left - a.left);
    if (recentCorrects.length) {
      const nearest = recentCorrects[0];
      if (left - nearest.left < state.brickStep * 2.2) return false;
    }

    if (state.pendingCorrectVisible === 0) return true;
    return Math.random() < 0.48;
  }

  function retargetExistingCorrectBricks() {
    const remaining = state.stream.filter((brick) => brick.isCorrect);
    for (const brick of remaining) {
      brick.label = getPendingCorrectLabel();
      brick.kind = getPendingCorrectKind();
      brick.fontSize = getConveyorFontSize(brick.label, brick.kind);
    }
  }

  function getConveyorFontSize(label, kind) {
    const len = String(label || "").length;
    if (kind === "reference") return clamp(state.brickWidth * 0.13 - Math.max(0, len - 8) * 0.22, 13, 23);
    if (kind === "book") return clamp(state.brickWidth * 0.13 - Math.max(0, len - 10) * 0.2, 13, 23);
    return clamp(state.brickWidth * 0.145 - Math.max(0, len - 8) * 0.22, 14, 24);
  }

  function brickVisualOpacity(brick) {
    const laneLeft = state.lanePadX;
    const laneRight = state.fieldWidth - state.lanePadX;
    const edgeFade = clamp(state.fieldWidth * 0.12, 46, 118);
    const center = brick.center;

    if (center <= laneLeft + edgeFade) {
      const t = clamp((center - laneLeft) / edgeFade, 0, 1);
      return lerp(0.18, 0.98, t);
    }

    if (center >= laneRight - edgeFade) {
      const t = clamp((laneRight - center) / edgeFade, 0, 1);
      return lerp(0.18, 0.98, t);
    }

    return 0.98;
  }

  function isBrickTappable(brick) {
    return brick.left < state.fieldWidth && (brick.left + brick.width) > 0;
  }

  function handleBrickTap(id) {
    if (state.frenzyActive) {
      handleFrenzyTap();
      return;
    }

    if (state.paused || state.done || state.collapseTriggered || state.enteringBrick) return;

    const brick = state.stream.find((b) => b.id === id);
    if (!brick || !isBrickTappable(brick)) return;

    if (!brick.isCorrect) {
      brick.flashWrong = true;
      brick.flashWrongUntil = performance.now() + 260;
      state.towerShakeUntil = performance.now() + 300;
      state.guideFlashUntil = performance.now() + 300;
      clearStreamWithBurst();
      return;
    }

    const zone = getTapZone(brick);
    const visual = 0;
    state.stream = state.stream.filter((b) => b.id !== id);
    state.pendingCorrectVisible = state.stream.filter((b) => b.isCorrect).length;

    const startWidth = state.brickWidth;
    const startHeight = state.brickHeight;
    const startFontSize = brick.fontSize;

    const endWidth = state.towerWidth * 0.76;
    const endHeight = state.brickHeight * 0.9;
    const endFontSize = Math.max(14, state.brickHeight * 0.33);

    const startLeft = brick.left;
    const startBottom = state.fieldHeight - state.laneY - startHeight * 0.5;

    const endLeft = (state.fieldWidth * 0.5) - (endWidth * 0.5) + visual;
    const endBottom = towerBaseBottom();

    state.enteringBrick = {
      id: ++state.enteringId,
      label: brick.label,
      kind: brick.kind,
      zone,
      progress: 0,

      fromLeft: startLeft,
      toLeft: endLeft,
      left: startLeft,

      fromBottom: startBottom,
      toBottom: endBottom,
      bottom: startBottom,

      fromWidth: startWidth,
      toWidth: endWidth,
      width: startWidth,

      fromHeight: startHeight,
      toHeight: endHeight,
      height: startHeight,

      fromFontSize: startFontSize,
      toFontSize: endFontSize,
      fontSize: startFontSize,

      fromXOffset: 0,
      toXOffset: 0,
      xOffset: 0,

      toRot: 0,
      rot: 0
    };

    seedPendingCorrect();
    retargetExistingCorrectBricks();
    ensureStreamFilled();
  }

  function getTapZone(brick) {
    const delta = brick.center - state.guideCenterX;
    const normalized = clamp(delta / state.brickWidth, -0.5, 0.5);

    const [far, slight, centerPct] = [ZONE_PERCENTAGES[selectedMode || "easy"][0], ZONE_PERCENTAGES[selectedMode || "easy"][1], ZONE_PERCENTAGES[selectedMode || "easy"][2]];
    const centerHalf = centerPct / 2;
    const slightHalf = centerHalf + slight;

    if (normalized <= -slightHalf) return -2;
    if (normalized < -centerHalf) return -1;
    if (normalized <= centerHalf) return 0;
    if (normalized < slightHalf) return 1;
    return 2;
  }

  function seedPendingCorrect() {
    state.pendingCorrectType = getCurrentCorrectKind();
    state.pendingCorrectLabel = getCurrentCorrectLabel();
  }
  function getPendingCorrectKind() { return state.pendingCorrectType || getCurrentCorrectKind(); }
  function getPendingCorrectLabel() { return state.pendingCorrectLabel || getCurrentCorrectLabel(); }

  function getCurrentCorrectKind() {
    if (state.phase === "words") return "word";
    if (state.phase === "book") return "book";
    if (state.phase === "reference") return "reference";
    return "";
  }

  function getCurrentCorrectLabel() {
    if (state.phase === "words") return wordEntries[state.wordIndex]?.display || "";
    if (state.phase === "book") return verseMeta.book || "";
    if (state.phase === "reference") return verseMeta.reference || "";
    return "";
  }

  function makeDecoy(kind, correct) {
    if (kind === "book") {
      return {
        label: pickRandom(window.VerseGameShell.getBookDecoys(correct, 8)),
        kind: "book"
      };
    }

    if (kind === "reference") {
      return {
        label: pickRandom(
          makeReferenceChoices(verseMeta, selectedMode)
            .filter((ref) => normalizeWord(ref) !== normalizeWord(correct))
        ),
        kind: "reference"
      };
    }

    if (selectedMode === "medium" || selectedMode === "hard") return { label: pickRandom(getVerseDerivedDecoys(state.wordIndex, correct)), kind: "word" };
    return {
      label: pickRandom(
        window.VerseGameShell.getFunWordDecoys(
          correct,
          wordEntries.map((entry) => entry.display),
          8
        )
      ),
      kind: "word"
    };
  }

  function advancePhaseAfterPlacement() {
    const previousPhase = state.phase;

    if (previousPhase === "words") {
      state.wordIndex += 1;
      const nextPhase = updatePhaseFromProgress(state.wordIndex);

      if (nextPhase === "done") {
        startDestroyFrenzy();
      }

      return;
    }

    if (previousPhase === "book") {
      const nextPhase = updatePhaseFromProgress(
        wordEntries.length + (verseMeta.book ? 1 : 0)
      );

      if (nextPhase === "done") {
        startDestroyFrenzy();
      }

      return;
    }

    if (previousPhase === "reference") {
      const nextPhase = updatePhaseFromProgress(
        wordEntries.length + (verseMeta.book ? 1 : 0) + (verseMeta.reference ? 1 : 0)
      );

      if (nextPhase === "done") {
        startDestroyFrenzy();
      }
    }
  }

  function getLeanScore() {
    const count = state.progress.length;
    if (count <= 1) return 0;

    let sum = 0;
    for (let i = 0; i < count; i++) {
      const brick = state.progress[i];
      const weight = 1 + (i / Math.max(1, count - 1)) * 1.6;
      sum += (brick.zone || 0) * weight;
    }
    return sum;
  }

  function getVisualLean() {
    const raw = getLeanScore();
    const sign = Math.sign(raw);
    const mag = Math.abs(raw);
    const soft = 1 - Math.exp(-mag / 7.4);
    return sign * soft;
  }

  function updateWarnings() {
    const mag = Math.abs(getLeanScore());
    const t = THRESHOLDS[selectedMode || "easy"];
    let level = 0;
    if (mag >= t.warn2) level = 2;
    else if (mag >= t.warn1) level = 1;
    state.warningLevel = level;

    if (
      selectedMode !== "easy" &&
      mag >= t.collapse &&
      state.hadWarning2BeforePlacement &&
      !state.collapseTriggered
    ) {
      triggerCollapse();
    }
  }

  function triggerCollapse() {
    const lean = getVisualLean();
    const count = state.progress.length;

    state.collapseTriggered = true;
    state.collapseStartedAt = performance.now();
    state.collapseDir = lean < 0 ? -1 : 1;
    state.collapseBurstFired = {};

    const previousPose = state.pendingPreCollapsePose || state.lastStableTowerPose || [];

    state.collapseBasePose = state.progress.map((brick, i) => {
      if (i === 0) {
        return { offsetX: 0, rot: 0 };
      }
      return previousPose[i - 1] || { offsetX: 0, rot: 0 };
    });

    const collapseTensionMs = 180;
    const collapseStepMs = 250;
    const collapseTipMs = 240;
    const collapseDropMs = 900;
    const collapseBufferMs = 220;

    state.collapseEndsAt =
      state.collapseStartedAt +
      collapseTensionMs +
      Math.max(0, count - 1) * collapseStepMs +
      collapseTipMs +
      collapseDropMs +
      collapseBufferMs;

    state.towerShakeUntil = 0;

    if (DEBUG_COLLAPSE) {
      const fmtPoseRows = (arr) => (arr || []).map((p, i) => ({
        i,
        x: Number((p?.offsetX || 0).toFixed(2)),
        r: Number((p?.rot || 0).toFixed(2))
      }));

      const fmtDeltaRows = (a, b) => {
        const out = [];
        const n = Math.max(a?.length || 0, b?.length || 0);
        for (let i = 0; i < n; i++) {
          const ax = Number(a?.[i]?.offsetX || 0);
          const bx = Number(b?.[i]?.offsetX || 0);
          const ar = Number(a?.[i]?.rot || 0);
          const br = Number(b?.[i]?.rot || 0);
          out.push({
            i,
            dx: Number((bx - ax).toFixed(2)),
            dr: Number((br - ar).toFixed(2))
          });
        }
        return out;
      };

      state.collapseDebugFramesLeft = 8;

      console.group("[TowerCollapseDebug] trigger");
      console.log("warningLevel", state.warningLevel);
      console.log("leanScore", Number(getLeanScore().toFixed(3)));
      console.log("visualLean", Number(getVisualLean().toFixed(3)));
      console.table(state.progress.map((b, i) => ({
        i,
        label: b.label,
        zone: b.zone,
        kind: b.kind
      })));
      console.log("lastStable raw", state.lastStableTowerPose);
      console.log("pendingPre raw", state.pendingPreCollapsePose);
      console.log("collapseBase raw", state.collapseBasePose);
      console.table(fmtPoseRows(state.lastStableTowerPose));
      console.table(fmtPoseRows(state.pendingPreCollapsePose));
      console.table(fmtPoseRows(state.collapseBasePose));
      console.table(fmtDeltaRows(state.pendingPreCollapsePose, state.collapseBasePose));
      console.groupEnd();
    }

    state.pendingPreCollapsePose = null;
  }

  function addSmoke(x, y) {
    state.fx.push({ x, y, until: performance.now() + 420, scale: 1, kind: "smoke" });
  }

  function addChunkBurst(x, y, scale = 1) {
    const now = performance.now();
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.35;
      const speed = 26 + Math.random() * 34;
      state.fx.push({
        kind: "chunk",
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 8,
        size: (10 + Math.random() * 10) * scale,
        rot: (Math.random() * 60) - 30,
        until: now + 360 + Math.random() * 120
      });
    }
  }

  function clearStreamWithBurst() {
    for (const brick of state.stream) {
      addChunkBurst(brick.center, state.laneY, 1);
    }
    state.stream = [];
    state.pendingCorrectVisible = 0;
    state.beltNeedsFreshSpawn = true;
    state.beltRespawnLockUntil = performance.now() + 520;
  }

  function startDestroyFrenzy() {
    state.frenzyActive = true;
    state.overlayMessage = "Tap to Destroy the Tower!";
    state.overlayUntil = performance.now() + 999999;
    state.stream = [];
    state.pendingCorrectVisible = 0;
    state.enteringBrick = null;
  }

  function handleFrenzyTap() {
    const now = performance.now();
    if (!state.frenzyActive) return;
    if (now < state.frenzyInputLockedUntil) return;
    if (!state.progress.length) return;

    if (state.overlayMessage) {
      state.overlayMessage = "";
      state.overlayUntil = 0;
    }

    const topIndex = state.progress.length - 1;

    let cumulativeBottom = 0;
    for (let i = 0; i < topIndex; i++) {
      const level = i;
      const scale = Math.max(0.54, Math.pow(0.95, level));
      const height = Math.max(34, state.brickHeight * 0.9 * scale);
      cumulativeBottom += height + clamp(state.brickHeight * 0.07, 4, 8);
    }

    const level = topIndex;
    const t = state.progress.length <= 1 ? 0 : level / Math.max(1, state.progress.length - 1);
    const curve = Math.pow(t, 1.55);
    const scale = Math.max(0.54, Math.pow(0.95, level));
    const height = Math.max(34, state.brickHeight * 0.9 * scale);
    const lean = getVisualLean();
    const maxLeanPx = Math.min(state.fieldWidth * 0.065, 46);
    const offsetX = state.progress.length <= 1 ? 0 : lean * maxLeanPx * curve;

    const burstX = state.fieldWidth * 0.5 + offsetX;
    const burstY = state.fieldHeight - (towerBaseBottom() + cumulativeBottom + height * 0.5);

    addChunkBurst(burstX, burstY, Math.max(0.95, scale));
    state.progress.pop();

    if (!state.progress.length) {
      state.frenzyActive = false;
      state.overlayMessage = "";
      state.overlayUntil = 0;
      state.frenzyInputLockedUntil = performance.now() + 350;

      window.setTimeout(() => {
        if (!state.done) {
          finishGame();
        }
      }, 350);
    }
  }

  async function finishGame() {
    state.running = false;
    state.done = true;
    state.frenzyActive = false;
    stopLoop();

    let reward = { ok: false, petUnlockTriggered: false };

    if (!completionMarked && ctx.verseId && selectedMode) {
      completionMarked = true;

      try {
        completionResult = await window.VerseGameBridge.completeGameRun({
          verseId: ctx.verseId,
          gameId: GAME_ID,
          mode: selectedMode,
          stats: {
            towerBlocks: state.progress.length,
            wordIndex: state.wordIndex,
            warningLevel: state.warningLevel,
            collapsed: state.collapseTriggered
          }
        });

        reward = completionResult.reward;
      } catch (err) {
        console.error("completeGameRun failed", err);

        completionResult = {
          ok: false,
          alreadyCompleted: alreadyCompletedForMode,
          newlyCompleted: false,
          reward: {
            ok: false,
            petUnlockTriggered: false
          }
        };

        reward = completionResult.reward;
      }
    }

    renderEndScreen(reward);
  }

  function showOverlay(message, duration = 1400) { state.overlayMessage = message; state.overlayUntil = performance.now() + duration; }

  function getVerseDerivedDecoys(targetIndex, correct) {
    return window.VerseGameShell.getVerseWordDecoys({
      words: wordEntries.map((entry) => entry.display),
      correct,
      targetIndex,
      count: 12,
      avoidNext: 2,
      fallbackToFun: true
    });
  }

  function makeReferenceChoices(referenceMeta, mode) {
    return window.VerseGameShell.getReferenceDecoys(referenceMeta, mode, 10);
  }

  function parseVerseMeta(verseId, fallbackRef) {
    return window.VerseGameShell.parseReferenceParts(
      fallbackRef,
      ctx.translation,
      verseId
    );
  }

  function tokenizeVerse(text) {
    return window.VerseGameShell.tokenizeVerseForBuild(text);
  }

  function extractWordEntries(tokens) {
    return window.VerseGameShell.extractWordEntries(tokens);
  }

  function laneBottomOffset() { return clamp(state.fieldWidth * 0.055, 24, 42); }
  function towerBaseBottom() { return laneBottomOffset() + state.laneHeight + 10; }

  function getTowerShellRotation(now) {
    return 0;
  }

  function showBottomWarningOverlay(now) {
    if (state.warningLevel <= 0 || state.collapseTriggered) return false;
    const cycleMs = state.warningLevel >= 2 ? 1600 : 3000;
    const onMs = state.warningLevel >= 2 ? 800 : 1500;
    return (now % cycleMs) < onMs;
  }

  function getTopBrickWarningWobble(now) {
    if (state.collapseTriggered) return 0;
    if (state.warningLevel === 1) {
      return Math.sin(now / 180) * 1.35;
    }
    if (state.warningLevel >= 2) {
      return Math.sin(now / 120) * 2.4;
    }
    return 0;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  const clamp = window.VerseGameShell.clamp;
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  const shuffle = window.VerseGameShell.shuffle;
  const capitalize = window.VerseGameShell.capitalize;

  function normalizeWord(value) {
    return window.VerseGameShell.normalizeWord(value);
  }


  function escapeHtml(str) { return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }

})();
