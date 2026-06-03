(async function () {
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "foodslice";

  const GAME_THEME = {
    bg: "#333333",
    accent: "#333333"
  };

  const BUILD_AREA = "large";

  const HELP_OVERLAY_ID = "fsHelpOverlay";

  const BONUS_DURATION_MS = 24000;
  const BONUS_STAGE_MS = BONUS_DURATION_MS / 3;

  const SLICE_EFFECT_TUNING = {
    duration: 240,
    slashDuration: 170,
    dotDuration: 360,
    colors: ["#ffc751", "#ffa351", "#ff5a51"]
  };

  const FOOD_THEMES = [
    ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🥭", "🍍", "🥥", "🥝"],
    ["🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🥪", "🥨", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍣", "🍱"],
    ["🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯"],
    ["🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🥚", "🍳"],
    ["🥦", "🥬", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥑", "🍄", "🥔", "🧅", "🧄"],
    ["🍗", "🍖", "🥩", "🍤", "🦀", "🦞", "🧀", "🥚", "🥛"]
  ];

  const BOOKS = window.VerseGameShell.getBibleBookDecoys();

  const GENERIC_DECOYS = window.VerseGameShell.getFunDecoys();

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let alreadyCompletedForMode = false;
  let completionResult = null;
  let resizeBound = false;
  let endScreenUnlockTimer = 0;

  const state = {
    running: false,
    paused: false,
    pauseReason: "",
    rafId: 0,
    lastTs: 0,
    fieldWidth: 0,
    fieldHeight: 0,
    fruitHitSize: 96,
    fruitEmojiSize: 56,
    bombHitSize: 84,
    bombEmojiSize: 50,
    sliceSize: 54,
    sliceEmojiSize: 42,
    theme: pickRandom(FOOD_THEMES),
    verseMeta: parseVerseMeta(ctx.verseId || "", ctx.verseRef || ""),
    buildData: null,
    tokens: tokenizeVerseWithSpaces(ctx.verseText || ""),
    wordEntries: [],
    wordsBuilt: 0,
    phase: "words",
    bookBuilt: false,
    referenceBuilt: false,
    buildSizeClass: "is-normal",
    buildFitDone: false,
    activeFruit: null,
    activeBomb: null,
    activeSlices: [],
    activeSliceEffects: [],
    wrongStreak: 0,
    buildShakeUntil: 0,
    fieldFlashUntil: 0,
    messageSequence: null,
    messagePill: null,
    bonusRound: false,
    bonusBannerUntil: 0,
    bonusStartedAt: 0,
    bonusEndsAt: 0,
    bonusFruits: [],
    bonusIdCounter: 0,
    bonusCount: 0,
    done: false,
    bookChoices: [],
    referenceChoices: []
  };

  state.buildData = window.VerseGameShell.buildVerseSegments({
    verseText: ctx.verseText || "",
    book: state.verseMeta.book,
    reference: state.verseMeta.reference,
    buildArea: BUILD_AREA
  });

  state.wordEntries = state.buildData.words.map((word) => ({ display: word }));
  state.buildSizeClass = state.buildData.buildSizeClass;

  renderIntro();

  function renderIntro() {
    stopLoop();

    window.VerseGameShell.renderTitleScreen({
      app,
      title: "Food Slice",
      icon: "🍉",
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
      backLabel: "Back to Food Slice title",
      onBack: renderIntro,
      onSelect: startGame
    });
  }

  function startGame(mode) {
    selectedMode = mode;
    completionMarked = false;
    completionResult = null;
    alreadyCompletedForMode = !!window.VerseGameBridge.wasAlreadyCompleted?.(ctx.verseId, GAME_ID, selectedMode);

    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.lastTs = 0;
    state.wordsBuilt = 0;
    state.bookBuilt = false;
    state.referenceBuilt = false;
    state.buildFitDone = false;
    updatePhaseFromProgress();
    state.activeFruit = null;
    state.activeBomb = null;
    state.activeSlices = [];
    state.activeSliceEffects = [];
    state.wrongStreak = 0;
    state.buildShakeUntil = 0;
    state.fieldFlashUntil = 0;
    state.messageSequence = createMessageSequence("intro");
    state.messagePill = null;
    state.bonusRound = false;
    state.bonusBannerUntil = 0;
    state.bonusStartedAt = 0;
    state.bonusEndsAt = 0;
    state.bonusFruits = [];
    state.bonusIdCounter = 0;
    state.bonusCount = 0;
    state.done = false;
    state.theme = pickRandom(FOOD_THEMES);
    state.bookChoices = makeBookChoices(state.verseMeta.book);
    state.referenceChoices = makeReferenceChoices(state.verseMeta, selectedMode);

    app.innerHTML = `
      <div class="fs-shell">
        <div class="fs-stage">
          <div class="fs-build-wrap">
            <div class="fs-build vm-build vm-build--${BUILD_AREA}" id="fsBuild">
              <div class="fs-build-text vm-build-text ${state.buildSizeClass}" id="fsBuildText"></div>
            </div>
          </div>
          <div class="fs-field-wrap">
            <div class="fs-field" id="fsField">
              <div class="fs-play-layer" id="fsPlayLayer"></div>
              <div class="fs-slice-layer" id="fsSliceLayer"></div>
              <div class="fs-banner-layer" id="fsBannerLayer"></div>
              <div class="fs-controls-layer">
                <button class="fs-corner-pill fs-corner-left" id="fsMenuPill" type="button" aria-label="Game menu">☰</button>
                <div class="fs-corner-pill fs-corner-right" id="fsPhasePill"></div>
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
    renderHud();
    startLoop();
  }

  function renderEndScreen(reward) {
    stopLoop();

    window.clearTimeout(endScreenUnlockTimer);
    endScreenUnlockTimer = 0;

    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🍉",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: completionResult,
      gameMessage: `Bonus slices: ${state.bonusCount}`,
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
      id: "fsGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function helpHtml() {
    return `Slice the next correct word to build the verse.<br><br>
      In easy mode, wrong choices do not remove built words.<br><br>
      In medium mode, decoys are chosen from other words in the verse, but there is no wrong-slice penalty.<br><br>
      In hard mode, those same verse-word decoys appear, bombs can show up, and a bomb removes one built word.<br><br>
      After the verse is built, slice the correct book and then the correct chapter and verse. Finish by slicing as much bonus food as you can.`;
  }

  function wireCommonNav() {
    window.VerseGameShell.wireGameMenu({
      id: "fsGameMenuOverlay",
      menuButtonId: "fsMenuPill",
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

    const menuPill = document.getElementById("fsMenuPill");
    if (menuPill) {
      const openFromPill = (e) => {
        if (e) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        openGameMenu();
      };
      menuPill.onclick = openFromPill;
      menuPill.onpointerdown = openFromPill;
      menuPill.ontouchstart = openFromPill;
    }

    window.onkeydown = (e) => {
      if (e.key === "Escape" && state.running) {
        if (document.getElementById("fsGameMenuOverlay")?.classList.contains("is-open")) closeGameMenu();
        else openGameMenu();
      }
    };
  }

  function openGameMenu() {
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    if (menuOverlay) {
      setPaused(true, "menu");
      menuOverlay.classList.add("is-open");
      menuOverlay.setAttribute("aria-hidden", "false");
    }
  }

  function closeGameMenu() {
    const menuOverlay = document.getElementById("fsGameMenuOverlay");

    if (menuOverlay && menuOverlay.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    if (menuOverlay) {
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    }

    const helpOverlay = document.getElementById("fsHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")) setPaused(false, "");
  }

  function openHelpFromMenu() {
    const menuOverlay = document.getElementById("fsGameMenuOverlay");

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

    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    if (menuOverlay) menuOverlay.classList.add("is-open");

    setPaused(true, "menu");
  }

  function setPaused(paused, reason = "") {
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused) state.lastTs = performance.now();
  }

  function recalcField() {
    const field = document.getElementById("fsField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;

    state.fruitHitSize = clamp(state.fieldWidth * 0.27, 108, 182);
    state.fruitEmojiSize = clamp(state.fieldWidth * 0.155, 62, 102);
    state.bombHitSize = clamp(state.fieldWidth * 0.19, 84, 134);
    state.bombEmojiSize = clamp(state.fieldWidth * 0.108, 46, 72);
    state.sliceSize = clamp(state.fieldWidth * 0.11, 40, 74);
    state.sliceEmojiSize = clamp(state.fieldWidth * 0.092, 32, 58);

    field.style.setProperty("--fs-fruit-hit", `${state.fruitHitSize}px`);
    field.style.setProperty("--fs-fruit-emoji", `${state.fruitEmojiSize}px`);
    field.style.setProperty("--fs-bomb-hit", `${state.bombHitSize}px`);
    field.style.setProperty("--fs-bomb-emoji", `${state.bombEmojiSize}px`);
    field.style.setProperty("--fs-slice-size", `${state.sliceSize}px`);
    field.style.setProperty("--fs-slice-emoji", `${state.sliceEmojiSize}px`);

    renderHud();
  }

  function renderHud() {
    const phasePill = document.getElementById("fsPhasePill");
    if (phasePill) {
      phasePill.textContent = state.bonusRound ? `🍽️ ${state.bonusCount}` : getPhaseLabel();
    }
    renderBuildArea();
    renderField();
  }

  function getPhaseLabel() {
    if (state.phase === "words") return `${state.wordsBuilt}/${state.wordEntries.length}`;
    if (state.phase === "book") return "Book";
    if (state.phase === "reference") return "Reference";
    return "Ready";
  }

  function getLinearProgressIndex() {
    return (
      state.wordsBuilt +
      (state.bookBuilt ? 1 : 0) +
      (state.referenceBuilt ? 1 : 0)
    );
  }

  function updatePhaseFromProgress() {
    const phase = window.VerseGameShell.getPhaseForProgress({
      progressIndex: getLinearProgressIndex(),
      wordCount: state.wordEntries.length,
      totalSegments: state.buildData?.segments?.length || 0,
      bookLabel: state.verseMeta.book,
      referenceLabel: state.verseMeta.reference
    });

    state.phase = phase;
  }

  function clearBuildTextFit(text) {
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

  function fitFoodBuildText() {
    if (state.buildFitDone) return;

    requestAnimationFrame(() => {
      const build = document.getElementById("fsBuild");
      const text = document.getElementById("fsBuildText");

      if (!build || !text) return;
      if (state.bonusRound) return;

      const result = window.VerseGameShell.fitBuildTextOnce({
        buildEl: build,
        textEl: text,
        buildArea: BUILD_AREA
      });

      if (result) {
        state.buildFitDone = true;
      }
    });
  }

  function renderBuildArea() {
    const build = document.getElementById("fsBuild");
    const text = document.getElementById("fsBuildText");
    if (!build || !text) return;

    build.classList.toggle("is-shake", state.buildShakeUntil > performance.now());
    if (state.bonusRound) {
      clearBuildTextFit(text);
      text.className = "fs-build-text vm-build-text fs-bonus-build-text";
      text.innerHTML = renderBonusCounterHtml();
      return;
    }

    const buildRender = window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.verseMeta.book,
      reference: state.verseMeta.reference,
      progressIndex: getLinearProgressIndex(),
      buildArea: BUILD_AREA,
      hideUnbuilt: selectedMode === "hard",
      extraClass: "fs-build-text"
    });

    text.className = buildRender.className;
    text.innerHTML = buildRender.html;

    fitFoodBuildText();
  }

  function renderField() {
    const playLayer = document.getElementById("fsPlayLayer");
    const sliceLayer = document.getElementById("fsSliceLayer");
    const bannerLayer = document.getElementById("fsBannerLayer");
    const field = document.getElementById("fsField");
    if (!playLayer || !sliceLayer || !bannerLayer || !field) return;

    field.classList.toggle("is-flash-bad", state.fieldFlashUntil > performance.now());

    let playHtml = "";
    if (state.messagePill?.alive) playHtml += renderMessagePill(state.messagePill);
    if (state.activeFruit?.alive) playHtml += renderFruitItem(state.activeFruit, false);
    if (state.activeBomb?.alive) playHtml += renderBombItem(state.activeBomb);
    for (const bonusFruit of state.bonusFruits) {
      if (bonusFruit?.alive) playHtml += renderFruitItem(bonusFruit, true);
    }
    playLayer.innerHTML = playHtml;

    playLayer.querySelectorAll("[data-role='fruit']").forEach((el) => {
      const onActivate = (e) => {
        if (e) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        const id = el.dataset.id;
        if (id === "main") handleMainFruitTap();
        else handleBonusTap(Number(id));
      };
      el.onclick = onActivate;
      el.onpointerdown = onActivate;
    });

    playLayer.querySelectorAll("[data-role='bomb']").forEach((el) => {
      const onActivate = (e) => {
        if (e) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        handleBombTap();
      };
      el.onclick = onActivate;
      el.onpointerdown = onActivate;
    });

    const slicePiecesHtml = state.activeSlices.filter(Boolean).map((piece) => `
      <div class="fs-slice-piece ${piece.side}" style="transform:translate(${piece.x}px, ${piece.y}px) translate(-50%, -50%) rotate(${piece.rotation}deg)">
        <div class="fs-slice-inner">${escapeHtml(piece.fruit || "🍎")}</div>
      </div>
    `).join("");

    const sliceEffectsHtml = state.activeSliceEffects.filter(Boolean).map(renderSliceEffect).join("");

    sliceLayer.innerHTML = slicePiecesHtml + sliceEffectsHtml;

    bannerLayer.innerHTML = (state.bonusRound && performance.now() < state.bonusBannerUntil)
      ? `<div class="fs-bonus-banner"><div class="fs-bonus-banner-text">Bonus Round!</div></div>`
      : "";




  }

  function renderFruitItem(item, isBonus) {
    const cls = `fs-item ${item.flashWrong ? "is-wrong" : ""} ${item.rejecting ? "is-rejecting" : ""}`;
    const id = isBonus ? item.id : "main";
    const wordHtml = isBonus ? "" : `<div class="fs-word-chip">${escapeHtml(item.word || "")}</div>`;
    return `
      <div class="${cls}" style="transform:translate(${item.x}px, ${item.y}px) translate(-50%, -50%)">
        <button class="fs-fruit-btn" data-role="fruit" data-id="${id}" type="button" aria-label="Slice food">
          <span class="fs-fruit-emoji" style="transform:rotate(${Math.round((item.tilt || 0) + (item.rotation || 0))}deg)">${escapeHtml(item.fruit || "🍎")}</span>
          ${wordHtml}
        </button>
      </div>
    `;
  }

  function renderBombItem(item) {
    return `
      <div class="fs-item ${item.wasHit ? "is-bomb-hit" : ""}" style="transform:translate(${item.x}px, ${item.y}px) translate(-50%, -50%)">
        <button class="fs-bomb-btn" data-role="bomb" type="button" aria-label="Bomb">
          <span class="fs-bomb-emoji" style="transform:rotate(${Math.round(item.rotation || 0)}deg)">💣</span>
        </button>
      </div>
    `;
  }

  function renderMessagePill(item) {
    const scale = getMessagePillScale(item);
    const tilt = Math.round((item.tilt || 0) + (item.rotation || 0));
    return `
      <div class="fs-message-item" style="transform:translate(${item.x}px, ${item.y}px) translate(-50%, -50%) rotate(${tilt}deg) scale(${scale})">
        <div class="fs-message-pill" style="background:${item.bg}; color:${item.color};">
          ${escapeHtml(item.text)}
        </div>
      </div>
    `;
  }

  function startLoop() {
    stopLoop();
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

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
    if (state.messageSequence) {
      stepMessageSequence(dt, now);
      return;
    }

    if (!state.bonusRound && !state.activeFruit) {
      spawnMainFruit();
      maybeSpawnBomb();
    }

    updateMovingEntity(state.activeFruit, dt);
    updateMovingEntity(state.activeBomb, dt);
    state.activeSlices.forEach((piece) => updateMovingEntity(piece, dt));
    state.activeSlices = state.activeSlices.filter((piece) => piece.alive);
    state.activeSliceEffects = state.activeSliceEffects.filter((effect) => now - effect.createdAt < effect.duration);

    if (state.activeFruit && state.activeFruit.y > state.fieldHeight + 140) state.activeFruit = null;
    if (state.activeBomb && state.activeBomb.y > state.fieldHeight + 140) state.activeBomb = null;

    if (state.bonusRound) {
      if (now >= state.bonusBannerUntil && now < state.bonusEndsAt) {
        const targetCount = getBonusTargetLiveCount(now);
        const live = state.bonusFruits.filter((item) => item.alive).length;
        if (live < targetCount) spawnBonusFruit();
      }
      state.bonusFruits.forEach((item) => updateMovingEntity(item, dt));
      state.bonusFruits = state.bonusFruits.filter((item) => item.alive && item.y <= state.fieldHeight + 140);
      if (now >= state.bonusEndsAt && state.bonusFruits.length === 0 && state.activeSlices.length === 0) {
        finishGame();
      }
    }
  }

  function updateMovingEntity(item, dt) {
    if (!item || !item.alive) return;
    const stepScale = dt / 16.6667;
    item.x += item.vx * stepScale;
    item.y += item.vy * stepScale;
    item.vy += item.gravity * stepScale;
    item.rotation += item.spin * stepScale;

    const halfSize = item.kind === "bomb"
      ? state.bombHitSize * 0.34
      : state.fruitHitSize * 0.34;

    item.x = clamp(item.x, halfSize, state.fieldWidth - halfSize);
    if (item.y > state.fieldHeight + Math.max(160, state.fruitHitSize * 1.1)) item.alive = false;
  }

  function spawnMainFruit() {
    const target = getCurrentTargetText();
    const { text, isCorrect } = pickDisplayTextForCurrentPhase(target);
    state.activeFruit = createFlyingFood({ word: text, isCorrect });
  }

  function maybeSpawnBomb() {
    if (selectedMode !== "hard" || state.bonusRound || state.done) return;
    if (!state.activeFruit?.alive) return;
    if (Math.random() >= 0.28) return;

    state.activeBomb = createFlyingBomb();
    keepBombAwayFromFruit(state.activeBomb, state.activeFruit);
  }

  function keepBombAwayFromFruit(bomb, fruit) {
    if (!bomb || !fruit) return;

    const fieldW = Math.max(320, state.fieldWidth || 320);
    const safeDistance = Math.max(
      state.fruitHitSize * 0.72,
      state.bombHitSize * 0.9,
      fieldW * 0.24
    );

    const currentDistance = Math.abs(bomb.x - fruit.x);
    if (currentDistance >= safeDistance) return;

    const pushDirection = fruit.x < fieldW / 2 ? 1 : -1;
    const preferredX = fruit.x + safeDistance * pushDirection;
    const fallbackX = fruit.x - safeDistance * pushDirection;
    const bombHalfSize = state.bombHitSize * 0.42;
    const minX = bombHalfSize;
    const maxX = fieldW - bombHalfSize;

    if (preferredX >= minX && preferredX <= maxX) {
      bomb.x = preferredX;
    } else {
      bomb.x = clamp(fallbackX, minX, maxX);
    }

    if (Math.abs(bomb.x - fruit.x) < safeDistance * 0.72) {
      bomb.x = fruit.x < fieldW / 2 ? maxX : minX;
    }

    bomb.vx += bomb.x > fruit.x ? 0.65 : -0.65;
  }


  function createFlyingFood({ word, isCorrect }) {
    const motion = createArcMotion();
    return {
      ...motion,
      fruit: pickRandom(state.theme),
      word,
      isCorrect,
      alive: true,
      flashWrong: false,
      rejecting: false,
      wasTapped: false,
      tilt: -16 + Math.random() * 32,
      kind: "fruit"
    };
  }

  function createFlyingBomb() {
    return {
      ...createArcMotion(true),
      alive: true,
      wasTapped: false,
      wasHit: false,
      kind: "bomb"
    };
  }

  function createMessageSequence(kind) {
    const bonusColors = ["#ff5a51", "#ffa351", "#ffc751", "#a7cb6f", "#40b9c5", "#7f66c6"];
    const steps = kind === "bonus"
      ? ["SLICE", "ALL", "THE", "FOOD!"].map((text, index) => {
        const bg = bonusColors[index % bonusColors.length];
        return {
          text,
          bg,
          color: bg === "#ffc751" ? "#333333" : "#ffffff"
        };
      })
      : [
        { text: "TAP", bg: "#ff5a51", color: "#ffc751" },
        { text: "TO", bg: "#ff5a51", color: "#ffc751" },
        { text: "SLICE!", bg: "#ff5a51", color: "#ffc751" },
        { text: "GO!", bg: "#a7cb6f", color: "#ffffff" }
      ];

    return {
      kind,
      steps,
      index: 0,
      nextAt: 0
    };
  }

  function stepMessageSequence(dt, now) {
    if (!state.messageSequence) return;

    if (!state.messagePill && now >= state.messageSequence.nextAt) {
      const step = state.messageSequence.steps[state.messageSequence.index];
      if (!step) {
        finishMessageSequence();
        return;
      }
      state.messagePill = createMessagePill(step);
      state.messageSequence.index += 1;
    }

    updateMessagePill(state.messagePill, dt, now);

    if (state.messagePill && !state.messagePill.alive) {
      state.messagePill = null;
      state.messageSequence.nextAt = now + 110;
    }
  }

  function finishMessageSequence() {
    const kind = state.messageSequence?.kind || "intro";
    state.messageSequence = null;
    state.messagePill = null;

    if (kind === "bonus") {
      beginBonusGameplay();
    }
  }

  function createMessagePill(step) {
    const motion = createArcMotion(false);
    motion.spin = (-0.45 + Math.random() * 0.9);

    return {
      ...motion,
      text: step.text,
      bg: step.bg,
      color: step.color,
      alive: true,
      kind: "message",
      tilt: -5 + Math.random() * 10,
      hasPausedAtApex: false,
      pauseUntil: 0,
      popUntil: 0
    };
  }

  function updateMessagePill(item, dt, now) {
    if (!item || !item.alive) return;

    if (!item.hasPausedAtApex && item.vy >= 0) {
      item.hasPausedAtApex = true;
      item.pauseUntil = now + 360;
      item.popUntil = now + 180;
    }

    if (item.hasPausedAtApex && now < item.pauseUntil) {
      item.rotation += item.spin * (dt / 16.6667);
      return;
    }

    updateMovingEntity(item, dt);
  }

  function getMessagePillScale(item) {
    if (!item?.popUntil) return 1;

    const now = performance.now();
    if (now >= item.popUntil) return 1;

    const progress = 1 - ((item.popUntil - now) / 180);
    return 1 + Math.sin(progress * Math.PI) * 0.16;
  }

  function createArcMotion(isBomb = false) {
    const fieldW = Math.max(320, state.fieldWidth || 320);
    const fieldH = Math.max(260, state.fieldHeight || 260);
    const sideInset = Math.max(state.fruitHitSize * 0.46, fieldW * 0.12);
    const startX = sideInset + Math.random() * Math.max(24, fieldW - sideInset * 2);
    const peakRatio = fieldW >= 900 ? 0.24 : 0.30;
    const targetPeakY = fieldH * peakRatio;
    const startY = fieldH + Math.max(24, state.fruitHitSize * 0.22);
    const riseDistance = Math.max(fieldH * 0.42, startY - targetPeakY);

    const gravity = fieldH * (isBomb ? 0.00115 : 0.00105);
    const baseVy = Math.sqrt(2 * gravity * riseDistance);
    const vy = -(baseVy + (Math.random() * fieldH * 0.00035 - fieldH * 0.000175));

    const horizontalRange = fieldW * (isBomb ? 0.0025 : 0.0022);
    const vx = (Math.random() * 2 - 1) * horizontalRange;
    const spin = isBomb ? (-3.4 + Math.random() * 6.8) : (-2.8 + Math.random() * 5.6);

    return { x: startX, y: startY, vx, vy, gravity, rotation: 0, spin };
  }

  function handleMainFruitTap() {
    const item = state.activeFruit;
    if (!item || !item.alive || item.wasTapped || state.paused || state.done) return;
    item.wasTapped = true;

    if (item.isCorrect) {
      createSlicesFrom(item);
      state.activeFruit = null;
      state.wrongStreak = 0;

      if (state.phase === "words") {
        state.wordsBuilt += 1;
      } else if (state.phase === "book") {
        state.bookBuilt = true;
      } else if (state.phase === "reference") {
        state.referenceBuilt = true;
      }

      updatePhaseFromProgress();

      if (state.phase === "done") {
        startBonusRound();
        return;
      }

      return;
    }

    item.flashWrong = true;
    item.rejecting = true;
    state.wrongStreak += 1;
    state.buildShakeUntil = performance.now() + 320;
    state.fieldFlashUntil = performance.now() + 260;

    setPaused(true, "wrong");
    renderHud();
    window.setTimeout(() => {
      item.alive = false;
      if (state.activeFruit === item) state.activeFruit = null;
      if (!state.done) setPaused(false, "");
      renderHud();
    }, 320);
  }

  function handleBombTap() {
    const bomb = state.activeBomb;
    if (!bomb || !bomb.alive || bomb.wasTapped || state.paused || state.done || state.bonusRound) return;
    bomb.wasTapped = true;
    bomb.wasHit = true;
    if (state.phase === "reference" && state.referenceBuilt) {
      state.referenceBuilt = false;
    } else if (state.phase === "book" && state.bookBuilt) {
      state.bookBuilt = false;
    } else if (state.wordsBuilt > 0) {
      state.wordsBuilt = Math.max(0, state.wordsBuilt - 1);
    }

    updatePhaseFromProgress();
    state.buildShakeUntil = performance.now() + 320;
    state.fieldFlashUntil = performance.now() + 260;
    setPaused(true, "bomb");
    renderHud();
    window.setTimeout(() => {
      bomb.alive = false;
      if (state.activeBomb === bomb) state.activeBomb = null;
      if (!state.done) setPaused(false, "");
      renderHud();
    }, 280);
  }

  function startBonusRound() {
    state.activeFruit = null;
    state.activeBomb = null;
    state.activeSlices = [];
    state.activeSliceEffects = [];
    state.messagePill = null;
    state.messageSequence = createMessageSequence("bonus");
    state.bonusRound = false;
    state.bonusBannerUntil = 0;
    state.bonusStartedAt = 0;
    state.bonusEndsAt = 0;
    state.bonusFruits = [];
    state.bonusCount = 0;
    setPaused(false, "");
    renderHud();
  }

  function beginBonusGameplay() {
    const now = performance.now();

    state.bonusRound = true;
    state.bonusBannerUntil = 0;
    state.bonusStartedAt = now;
    state.bonusEndsAt = now + BONUS_DURATION_MS;
    state.bonusFruits = [];
    state.bonusCount = 0;
  }

  function getBonusTargetLiveCount(now) {
    const elapsed = Math.max(0, now - state.bonusStartedAt);

    if (elapsed < BONUS_STAGE_MS) return 1;
    if (elapsed < BONUS_STAGE_MS * 2) return 2;
    return 3;
  }

  function renderBonusCounterHtml() {
    const displayScore = state.bonusCount > 99 ? "99+" : String(state.bonusCount);

    return `
      <div class="fs-bonus-score-line" aria-label="Bonus slices ${escapeHtml(displayScore)}">
        <span class="fs-bonus-score-emoji" aria-hidden="true">🍎</span>
        <span class="fs-bonus-score-x" aria-hidden="true">x</span>
        <span class="fs-bonus-score-pill">${escapeHtml(displayScore)}</span>
      </div>
    `;
  }


  function spawnBonusFruit() {
    state.bonusIdCounter += 1;
    state.bonusFruits.push({
      id: state.bonusIdCounter,
      ...createArcMotion(),
      fruit: pickRandom(state.theme),
      alive: true,
      wasTapped: false,
      tilt: -16 + Math.random() * 32,
      kind: "fruit"
    });
  }

  function handleBonusTap(id) {
    const item = state.bonusFruits.find((fruit) => fruit.id === id);
    if (!item || item.wasTapped || state.paused || !state.bonusRound) return;
    item.wasTapped = true;
    item.alive = false;
    state.bonusCount += 1;
    createSlicesFrom(item);
  }

  function createSlicesFrom(item) {
    const sliceEffect = createSliceEffectFrom(item);
    const sliceAngle = sliceEffect?.rotation ?? 90;
    const baseRotation = item.rotation || 0;

    const split = getSliceSplitMotion(sliceAngle);
    const splitOffset = state.fruitHitSize * 0.18;
    const splitSpeed = 1.55;
    const lift = -1.15;

    state.activeSlices.push(
      {
        side: "left",
        fruit: item.fruit,
        x: item.x + split.nx * splitOffset,
        y: item.y + split.ny * splitOffset,
        vx: (item.vx || 0) + split.nx * splitSpeed,
        vy: (item.vy || 0) + split.ny * splitSpeed + lift,
        gravity: item.gravity || 0.42,
        rotation: baseRotation - 10 + split.rotationNudge,
        spin: -3.8 + split.spinNudge,
        alive: true
      },
      {
        side: "right",
        fruit: item.fruit,
        x: item.x - split.nx * splitOffset,
        y: item.y - split.ny * splitOffset,
        vx: (item.vx || 0) - split.nx * splitSpeed,
        vy: (item.vy || 0) - split.ny * splitSpeed + lift,
        gravity: item.gravity || 0.42,
        rotation: baseRotation + 10 + split.rotationNudge,
        spin: 3.8 + split.spinNudge,
        alive: true
      }
    );
  }

  function getSliceSplitMotion(sliceAngle) {
    const normalAngle = (sliceAngle + 90) * Math.PI / 180;
    const nx = Math.cos(normalAngle);
    const ny = Math.sin(normalAngle);

    return {
      nx,
      ny,
      rotationNudge: (sliceAngle - 90) * 0.18,
      spinNudge: (sliceAngle - 90) * 0.025
    };
  }


  function createSliceEffectFrom(item) {
    if (!item) return;

    const createdAt = performance.now();
    const baseAngle = 74 + Math.random() * 32;
    const yOffset = item.word ? -state.fruitHitSize * 0.08 : 0;
    const dotCount = 5;
    const dots = [];

    for (let i = 0; i < dotCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 18 + Math.random() * 40;
      const lift = -36 + Math.random() * 72;

      dots.push({
        dx: side * spread,
        dy: lift,
        size: 5 + Math.random() * 6,
        delay: 22 + Math.random() * 46,
        color: SLICE_EFFECT_TUNING.colors[i % SLICE_EFFECT_TUNING.colors.length]
      });
    }

    const effect = {
      x: item.x,
      y: item.y + yOffset,
      rotation: baseAngle,
      createdAt,
      duration: SLICE_EFFECT_TUNING.duration,
      dots
    };

    state.activeSliceEffects.push(effect);

    return effect;
  }

  function renderSliceEffect(effect) {
    const now = performance.now();
    const age = Math.max(0, now - effect.createdAt);
    const slashProgress = clamp(age / SLICE_EFFECT_TUNING.slashDuration, 0, 1);
    const slashOpacity = slashProgress < 0.22
      ? slashProgress / 0.22
      : 1 - ((slashProgress - 0.22) / 0.78);
    const slashScaleX = 0.16 + Math.sin(slashProgress * Math.PI * 0.72) * 1.04;
    const slashScaleY = 0.82 + Math.sin(slashProgress * Math.PI) * 0.18;

    const dotsHtml = effect.dots.map((dot) => {
      const dotAge = Math.max(0, age - dot.delay);
      const dotProgress = clamp(dotAge / SLICE_EFFECT_TUNING.dotDuration, 0, 1);
      const dotOpacity = dotProgress <= 0
        ? 0
        : dotProgress < 0.2
          ? dotProgress / 0.2
          : 1 - ((dotProgress - 0.2) / 0.8);
      const dotX = dot.dx * dotProgress;
      const dotY = dot.dy * dotProgress + 18 * dotProgress * dotProgress;
      const dotScale = 0.75 - dotProgress * 0.55;

      return `
        <span
          class="fs-juice-dot"
          style="
            --dot-size:${dot.size}px;
            --dot-color:${dot.color};
            opacity:${Math.max(0, dotOpacity).toFixed(3)};
            transform:translate(${dotX.toFixed(1)}px, ${dotY.toFixed(1)}px) translate(-50%, -50%) scale(${Math.max(0.15, dotScale).toFixed(3)});
          "
        ></span>
      `;
    }).join("");

    return `
      <div class="fs-slice-effect" style="transform:translate(${effect.x}px, ${effect.y}px)">
        <span
          class="fs-slice-slash"
          style="
            opacity:${Math.max(0, slashOpacity).toFixed(3)};
            transform:translate(-50%, -50%) rotate(${effect.rotation.toFixed(1)}deg) scale(${Math.max(0.05, slashScaleX).toFixed(3)}, ${slashScaleY.toFixed(3)});
          "
        ></span>
        ${dotsHtml}
      </div>
    `;
  }


  async function finishGame() {
    state.running = false;
    state.done = true;
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
            bonusCount: state.bonusCount,
            wordsBuilt: state.wordsBuilt,
            wrongStreak: state.wrongStreak
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

  function getCurrentTargetText() {
    if (state.phase === "book") return state.verseMeta.book || "";
    if (state.phase === "reference") return state.verseMeta.reference || "";
    return state.wordEntries[state.wordsBuilt]?.display || "";
  }

  function pickDisplayTextForCurrentPhase(correct) {
    if (state.phase === "book") return pickPhaseChoice(correct, state.bookChoices);
    if (state.phase === "reference") return pickPhaseChoice(correct, state.referenceChoices);


    let wrongPool = [];
    if (selectedMode === "medium" || selectedMode === "hard") {
      wrongPool = getVerseDerivedDecoys(state.wordsBuilt, correct);
    } else {
      wrongPool = window.VerseGameShell.getFunWordDecoys(
        correct,
        state.wordEntries.map((entry) => entry.display),
        12
      );
    }

    const mustUseCorrect = state.wrongStreak >= 2;
    const useCorrect = mustUseCorrect || Math.random() < 0.6 || !wrongPool.length;
    if (useCorrect) {
      state.wrongStreak = 0;
      return { text: correct, isCorrect: true };
    }
    state.wrongStreak += 1;
    return { text: pickRandom(wrongPool), isCorrect: false };
  }

  function pickPhaseChoice(correct, choicePool) {
    const mustUseCorrect = state.wrongStreak >= 2;
    const wrongs = (choicePool || []).filter((item) => item !== correct);
    const useCorrect = mustUseCorrect || Math.random() < 0.6 || !wrongs.length;
    if (useCorrect) {
      state.wrongStreak = 0;
      return { text: correct, isCorrect: true };
    }
    state.wrongStreak += 1;
    return { text: pickRandom(wrongs), isCorrect: false };
  }

  function getVerseDerivedDecoys(targetIndex, correct) {
    return window.VerseGameShell.getVerseWordDecoys({
      words: state.wordEntries.map((entry) => entry.display),
      correct,
      targetIndex,
      count: 12,
      avoidNext: 2,
      fallbackToFun: true
    });
  }

  function makeBookChoices(correctBook) {
    const correct = String(correctBook || "").trim();
    if (!correct) return [];

    const others = window.VerseGameShell.getBookDecoys(correct, 3);

    return shuffle([correct, ...others]).slice(0, 4);
  }

  function makeReferenceChoices(referenceMeta, mode) {
    const correct = String(referenceMeta?.reference || "").trim();

    if (!correct) return [];

    const decoys = window.VerseGameShell.getReferenceDecoys(referenceMeta, mode, 3);

    return shuffle([
      correct,
      ...decoys.filter((ref) => normalizeWord(ref) !== normalizeWord(correct))
    ]).slice(0, 4);
  }

  function parseVerseMeta(verseId, fallbackRef) {
    return window.VerseGameShell.parseReferenceParts(
      fallbackRef,
      ctx.translation,
      verseId
    );
  }


  function tokenizeVerseWithSpaces(text) {
    return window.VerseGameShell.tokenizeVerseForBuild(text);
  }

  function extractWordEntries(tokens) {
    return window.VerseGameShell.extractWordEntries(tokens);
  }



  const clamp = window.VerseGameShell.clamp;
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  const shuffle = window.VerseGameShell.shuffle;
  const capitalize = window.VerseGameShell.capitalize;

  const normalizeWord = window.VerseGameShell.normalizeWord;
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
