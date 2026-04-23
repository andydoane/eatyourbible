(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "tower_bible";

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
  const FUN_DECOYS = [
    "apple","banana","rocket","castle","pickle","friend","planet","music","marshmallow","purple",
    "otter","waffle","robot","muffin","bubble","gentle","sunshine","forest","taco","penguin"
  ];
  const ZONE_PERCENTAGES = {
    easy:[0.05,0.15,0.60,0.15,0.05],
    medium:[0.10,0.20,0.40,0.20,0.10],
    hard:[0.20,0.20,0.20,0.20,0.20]
  };
  const BELT_SPEED_FACTORS = {
    easy:0.92,
    medium:1.04,
    hard:1.18
  };

  const THRESHOLDS = {
    easy:{warn1:999,warn2:999,collapse:999},
    medium:{warn1:8,warn2:12,collapse:16},
    hard:{warn1:7,warn2:11,collapse:15}
  };

  const DEBUG_COLLAPSE = false;

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let alreadyCompletedForMode = false;
  let resizeBound = false;
  let endScreenUnlockTimer = 0;

  const verseMeta = parseVerseMeta(ctx.verseId || "", ctx.verseRef || "");
  const verseTokens = tokenizeVerse(ctx.verseText || "");
  const wordEntries = extractWordEntries(verseTokens);

  const state = {
    running:false,
    paused:false,
    pauseReason:"",
    rafId:0,
    lastTs:0,

    fieldWidth:0,
    fieldHeight:0,
    laneY:0,
    laneHeight:0,
    lanePadX:0,
    guideCenterX:0,
    guideLeftX:0,
    guideRightX:0,
    guideWidth:0,
    brickWidth:0,
    brickHeight:0,
    brickGap:0,
    brickStep:0,
    beltSpeed:0,
    towerWidth:0,

    progress:[],
    phase:"words",
    wordIndex:0,

    towerShakeUntil:0,
    towerSettleUntil:0,
    guideFlashUntil:0,
    overlayMessage:"",
    overlayUntil:0,
    warningLevel:0,
    hadWarning2BeforePlacement:false,
    beltRespawnLockUntil:0,
    beltNeedsFreshSpawn:false,
    collapseTriggered:false,
    collapseEndsAt:0,
    collapseStartedAt:0,
    collapseDir:1,
    collapseBasePose:null,
    lastStableTowerPose:null,
    pendingPreCollapsePose:null,
    collapseBurstFired:{},
    collapseDebugFramesLeft:0,

    stream:[],
    streamId:0,
    fx:[],
    enteringBrick:null,
    enteringId:0,
    done:false,
    frenzyActive:false,
    frenzyInputLockedUntil:0,

    pendingCorrectLabel:"",
    pendingCorrectType:"word",
    pendingCorrectVisible:0,
    spawnIndex:0
  };

  renderIntro();

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="tb-mode-shell">
        <div class="tb-mode-stage">
          <div class="tb-mode-top">
            <div style="font-size:70px;line-height:1;">🏰</div>
            <div class="tb-title">Tower of Bible</div>
            <div class="tb-subtitle">Tap the correct brick when it lines up with the guide. Don’t let your tower lean too far either way.</div>
            <div class="tb-mode-card">
              <div class="tb-mode-actions">
                <button class="vm-btn" id="startBtn">Start</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>`;
    document.getElementById("startBtn").onclick = renderModeSelect;
    wireCommonNav();
  }

  function renderModeSelect(){
    stopLoop();
    app.innerHTML = `
      <div class="tb-mode-shell">
        <div class="tb-mode-stage">
          <div class="tb-mode-top">
            <div style="font-size:70px;line-height:1;">🏰</div>
            <div class="tb-title">Choose Your Difficulty</div>
            <div class="tb-subtitle">Easy has the biggest center timing zone. Medium uses verse-word decoys and a little more speed. Hard is the fastest and has the toughest lean threshold.</div>
            <div class="tb-mode-card">
              <div class="tb-mode-actions">
                <button class="vm-btn" id="easyBtn">Easy</button>
                <button class="vm-btn" id="mediumBtn">Medium</button>
                <button class="vm-btn" id="hardBtn">Hard</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>`;
    document.getElementById("easyBtn").onclick = () => startGame("easy");
    document.getElementById("mediumBtn").onclick = () => startGame("medium");
    document.getElementById("hardBtn").onclick = () => startGame("hard");
    wireCommonNav();
  }

  function startGame(mode){
    selectedMode = mode;
    completionMarked = false;
    alreadyCompletedForMode = !!window.VerseGameBridge.wasAlreadyCompleted?.(ctx.verseId, GAME_ID, selectedMode);

    Object.assign(state, {
      running:true, paused:false, pauseReason:"", lastTs:0,
      progress:[], phase:"words", wordIndex:0,
      towerShakeUntil:0, towerSettleUntil:0, guideFlashUntil:0,
      overlayMessage:"", overlayUntil:0,
      warningLevel:0, hadWarning2BeforePlacement:false, beltRespawnLockUntil:0, beltNeedsFreshSpawn:false, collapseTriggered:false, collapseEndsAt:0, collapseStartedAt:0, collapseDir:1, collapseBasePose:null, lastStableTowerPose:null, pendingPreCollapsePose:null, collapseBurstFired:{}, collapseDebugFramesLeft:0,
      stream:[], streamId:0, fx:[], enteringBrick:null, enteringId:0,
      done:false, frenzyActive:false, frenzyInputLockedUntil:0, pendingCorrectLabel:"", pendingCorrectType:"word",
      pendingCorrectVisible:0, spawnIndex:0
    });
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

  function renderEndScreen(reward){
    stopLoop();
    const title = reward?.petUnlockTriggered
      ? "BibloPet Unlocked!"
      : (alreadyCompletedForMode ? "Well done!" : "Great job!");
    const subtitle = reward?.petUnlockTriggered
      ? "You unlocked this verse's BibloPet!"
      : (alreadyCompletedForMode
          ? `You finished ${ctx.verseRef} again in ${capitalize(selectedMode)} mode.`
          : `You completed ${ctx.verseRef} in ${capitalize(selectedMode)} mode.`);

    app.innerHTML = `
      <div class="tb-mode-shell">
        <div class="tb-mode-stage">
          <div class="tb-mode-top">
            <div class="tb-end-emoji">🎉</div>
            <div class="tb-mode-card tb-end-card">
              <div class="tb-end-title">${escapeHtml(title)}</div>
              <div class="tb-end-text">${escapeHtml(subtitle)}</div>
              <div class="tb-mode-actions tb-end-lock" id="tbEndActions" style="margin-top:16px;">
                <button class="vm-btn" id="playAgainBtn" disabled>Play Again</button>
                <button class="vm-btn" id="exitBtn" disabled>Practice Games</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>`;
    const playAgainBtn = document.getElementById("playAgainBtn");
    const exitBtn = document.getElementById("exitBtn");
    const endActions = document.getElementById("tbEndActions");
    if (playAgainBtn) playAgainBtn.onclick = () => renderModeSelect();
    if (exitBtn) exitBtn.onclick = () => window.VerseGameBridge.exitGame();
    window.clearTimeout(endScreenUnlockTimer);
    endScreenUnlockTimer = window.setTimeout(() => {
      if (playAgainBtn) playAgainBtn.disabled = false;
      if (exitBtn) exitBtn.disabled = false;
      if (endActions) endActions.classList.remove("tb-end-lock");
    }, 550);
    wireCommonNav();
  }

  function renderNav(){
    return `<div class="tb-nav-wrap"><div class="tb-nav">
      <button class="tb-nav-btn" id="homeBtn" aria-label="Home">⌂</button>
      <div class="tb-nav-center"><button class="tb-help-btn" id="helpBtn" type="button">HELP</button></div>
      <button class="tb-nav-btn" id="muteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
    </div></div>`;
  }

  function renderHelpOverlay(body){
    return `<div class="tb-help-overlay" id="tbHelpOverlay" aria-hidden="true">
      <div class="tb-help-dialog">
        <div class="tb-help-title">How to Play</div>
        <div class="tb-help-body">${body}</div>
        <div class="tb-help-actions"><button class="vm-btn" id="tbHelpCloseBtn">OK</button></div>
      </div></div>`;
  }

  function renderGameMenuOverlay(){
    return `<div class="tb-help-overlay" id="tbGameMenuOverlay" aria-hidden="true">
      <div class="tb-help-dialog tb-game-menu-dialog">
        <div class="tb-help-title">Game Menu</div>
        <div class="tb-game-menu-actions">
          <button class="vm-btn" id="tbMenuHowToBtn">How to Play</button>
          <button class="vm-btn" id="tbMenuMuteBtn">${muted ? "Unmute" : "Mute"}</button>
          <button class="vm-btn" id="tbMenuExitBtn">Exit Game</button>
          <button class="vm-btn" id="tbMenuCloseBtn">Close</button>
        </div>
      </div></div>`;
  }

  function helpHtml(){
    return `Tap the correct brick when it lines up with the guide.<br><br>
      Bricks only become tappable inside the guide window.<br><br>
      Easy gives you the biggest center timing zone. Medium and hard are stricter.<br><br>
      Keep your tower from leaning too far left or right.<br><br>
      After the verse words are placed, build the book and then the chapter and verse reference to finish the tower.`;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpBtn = document.getElementById("helpBtn");
    const helpOverlay = document.getElementById("tbHelpOverlay");
    const helpCloseBtn = document.getElementById("tbHelpCloseBtn");
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    const menuHowToBtn = document.getElementById("tbMenuHowToBtn");
    const menuMuteBtn = document.getElementById("tbMenuMuteBtn");
    const menuExitBtn = document.getElementById("tbMenuExitBtn");
    const menuCloseBtn = document.getElementById("tbMenuCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (muteBtn) muteBtn.onclick = () => {
      muted = !muted;
      muteBtn.textContent = muted ? "🔇" : "🔊";
      if (menuMuteBtn) menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
    };
    if (helpBtn) helpBtn.onclick = () => {
      if (helpOverlay){
        helpOverlay.classList.add("is-open");
        helpOverlay.dataset.mode = "close";
        if (helpCloseBtn) helpCloseBtn.textContent = "OK";
      }
    };
    if (helpCloseBtn) helpCloseBtn.onclick = () => {
      const mode = helpOverlay?.dataset.mode || "close";
      if (mode === "back") backToMenuFromHelp(); else closeHelpOverlay();
    };
    if (helpOverlay) helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        const mode = helpOverlay.dataset.mode || "close";
        if (mode === "back") backToMenuFromHelp(); else closeHelpOverlay();
      }
    };
    if (menuHowToBtn) menuHowToBtn.onclick = openHelpFromMenu;
    if (menuMuteBtn) menuMuteBtn.onclick = () => {
      muted = !muted;
      menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
      if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
    };
    if (menuExitBtn) menuExitBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (menuCloseBtn) menuCloseBtn.onclick = closeGameMenu;
    if (menuOverlay) menuOverlay.onclick = (e) => { if (e.target === menuOverlay) closeGameMenu(); };
  }

  function wireGameInput(){
    if (!resizeBound){
      window.addEventListener("resize", recalcField);
      resizeBound = true;
    }
    const menuPill = document.getElementById("tbMenuPill");
    if (menuPill){
      menuPill.onclick = (e) => {
        if (e){
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        openGameMenu();
      };
    }

    const field = document.getElementById("tbField");
    if (field){
      field.onpointerdown = (e) => {
        const menuPillEl = document.getElementById("tbMenuPill");
        if (menuPillEl && menuPillEl.contains(e.target)) return;
        if (state.frenzyActive){
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          handleFrenzyTap();
        }
      };
    }

    window.onkeydown = (e) => {
      if (e.key === "Escape" && state.running){
        if (document.getElementById("tbGameMenuOverlay")?.classList.contains("is-open")) closeGameMenu();
        else openGameMenu();
      }
    };
  }

  function openGameMenu(){
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    if (menuOverlay){
      setPaused(true, "menu");
      menuOverlay.classList.add("is-open");
    }
  }
  function closeGameMenu(){
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    const helpOverlay = document.getElementById("tbHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")) setPaused(false, "");
  }
  function openHelpFromMenu(){
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    const helpOverlay = document.getElementById("tbHelpOverlay");
    const helpCloseBtn = document.getElementById("tbHelpCloseBtn");
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    if (helpOverlay){
      helpOverlay.classList.add("is-open");
      helpOverlay.dataset.mode = "back";
    }
    if (helpCloseBtn) helpCloseBtn.textContent = "Back";
    setPaused(true, "help");
  }
  function closeHelpOverlay(){
    const helpOverlay = document.getElementById("tbHelpOverlay");
    if (helpOverlay) helpOverlay.classList.remove("is-open");
    setPaused(false, "");
  }
  function backToMenuFromHelp(){
    const helpOverlay = document.getElementById("tbHelpOverlay");
    const menuOverlay = document.getElementById("tbGameMenuOverlay");
    if (helpOverlay) helpOverlay.classList.remove("is-open");
    if (menuOverlay) menuOverlay.classList.add("is-open");
    setPaused(true, "menu");
  }
  function setPaused(paused, reason=""){
    state.paused = paused;
    state.pauseReason = paused ? reason : "";
    if (!paused) state.lastTs = performance.now();
  }

  function recalcField(){
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

  function renderHud(){
    const phasePill = document.getElementById("tbPhasePill");
    if (phasePill) phasePill.textContent = currentPhaseLabel();
    renderField();
  }

  function currentPhaseLabel(){
    if (state.frenzyActive) return "Destroy!";
    if (state.done) return "Done";
    if (state.phase === "words") return `${state.wordIndex}/${wordEntries.length}`;
    if (state.phase === "book") return "Book";
    if (state.phase === "reference") return "Reference";
    return "Ready";
  }

  function renderField(){
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

  function renderGuide(layer){
    layer.innerHTML = `
      <div class="tb-guide-wrap" style="left:${state.guideCenterX}px;top:${state.laneY}px;">
        <div class="tb-guide" style="width:${state.guideWidth}px;height:${state.brickHeight}px;"></div>
      </div>`;
  }

  function renderOverlayMessage(layer){
    const now = performance.now();
    if (!layer) return;
    if (!state.overlayMessage || now >= state.overlayUntil) return;

    layer.innerHTML += `
      <div class="tb-center-overlay-msg">
        ${escapeHtml(state.overlayMessage)}
      </div>`;
  }

  function renderConveyor(layer){
    const laneBottom = clamp(state.fieldWidth * 0.055, 24, 42);

    let html = `
      <div class="tb-conveyor-lane" style="left:${state.lanePadX}px;right:${state.lanePadX}px;bottom:${laneBottom}px;height:${state.laneHeight}px;">
    `;
    for (const brick of state.stream){
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
        if (e){
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        handleBrickTap(id);
      };
      el.onclick = onActivate;
      el.onpointerdown = onActivate;
    });
  }

  function renderEnteringBrick(layer){
    const e = state.enteringBrick;
    if (!e){
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

  function renderTower(layer){
    const now = performance.now();
    const towerShellClass = ["tb-tower-shell"];
    if (!state.collapseTriggered){
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
    for (let i = 0; i < count; i++){
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

      if (state.collapseTriggered){
        cls.push("is-collapsing");

        const topIndex = count - 1 - i; // top brick starts first
        const localStart = collapseTensionMs + topIndex * collapseStepMs;
        const elapsedForBrick = collapseElapsed - localStart;

        const tipT = clamp(elapsedForBrick / collapseTipMs, 0, 1);
        const fallT = clamp((elapsedForBrick - collapseTipMs) / collapseDropMs, 0, 1);

        const tipEase = tipT <= 0 ? 0 : Math.pow(tipT, 1.65);
        const fallEase = fallT <= 0 ? 0 : (1 - Math.pow(1 - fallT, 2.25));

        const burstKey = `c${i}`;
        if (fallT > 0 && !state.collapseBurstFired[burstKey]){
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

      else if (i === count - 1 && state.warningLevel > 0){
        rot += getTopBrickWarningWobble(now);
      }



      if (DEBUG_COLLAPSE && state.collapseTriggered){
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

      if (!state.collapseTriggered && i === 0 && showBottomWarningOverlay(now)){
        const warningClass = state.warningLevel >= 2 ? "tb-warning-overlay danger" : "tb-warning-overlay";
        const warningText = state.warningLevel >= 2 ? "WARNING!" : "WARNING";
        html += `<div class="${warningClass}" style="bottom:${bottom}px;width:${width}px;height:${height}px;font-size:${fontSize}px;transform:translateX(calc(-50% + ${offsetX}px)) rotate(${rot}deg)">${warningText}</div>`;
      }
      cumulativeBottom += height + clamp(state.brickHeight * 0.07, 4, 8);
    }

    if (!state.collapseTriggered){
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

  function renderEffects(layer){
    const now = performance.now();
    state.fx = state.fx.filter((fx) => fx.until > now);

    let html = "";

    if (state.collapseTriggered && (now - state.collapseStartedAt) < 700){
      html += `
        <div class="tb-base-smoke is-open">
          <div class="p p1"></div><div class="p p2"></div><div class="p p3"></div><div class="p p4"></div><div class="p p5"></div>
        </div>`;
    }

    for (const fx of state.fx){
      if (fx.kind === "chunk"){
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

  function renderWarning(layer){
    if (!layer) return;
    layer.innerHTML = "";
  }

  function renderDebug(layer){
    if (!layer) return;
    layer.innerHTML = "";
  }

  function logCollapseFrame(now, renderedBricks){
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

  function startLoop(){ stopLoop(); state.lastTs = 0; state.rafId = requestAnimationFrame(frame); }
  function stopLoop(){ if (state.rafId){ cancelAnimationFrame(state.rafId); state.rafId = 0; } }

  function frame(ts){
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(34, ts - state.lastTs);
    state.lastTs = ts;

    if (!state.paused){
      step(dt, ts);
      renderHud();
    }
    state.rafId = requestAnimationFrame(frame);
  }

  function step(dt, now){
    if (state.done) return;
    if (state.frenzyActive) return;

    if (state.collapseTriggered){
      stepCollapse(dt);
      if (now >= state.collapseEndsAt) resetAfterCollapse();
      return;
    }

    stepStream(dt);
    stepEntering(dt);
    updateWarnings();
  }

  function stepStream(dt){
    const distance = state.beltSpeed * (dt / 1000);
    for (const brick of state.stream){
      brick.left -= distance;
      brick.center = brick.left + brick.width / 2;
      if (brick.flashWrongUntil && performance.now() >= brick.flashWrongUntil){
        brick.flashWrong = false;
        brick.flashWrongUntil = 0;
      }
    }

    const leftCull = -state.brickWidth - 40;
    state.stream = state.stream.filter((brick) => brick.left > leftCull);
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;

    if (performance.now() >= state.beltRespawnLockUntil){
      ensureStreamFilled();
    }
  }

  function stepEntering(dt){
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

    if (e.progress >= 1){
      state.pendingPreCollapsePose = state.lastStableTowerPose
        ? state.lastStableTowerPose.map((p) => ({ offsetX:p.offsetX, rot:p.rot }))
        : [];

      const prevWarningLevel = state.warningLevel;

      state.progress.unshift({ label:e.label, kind:e.kind, zone:e.zone });
      state.enteringBrick = null;

      state.towerSettleUntil = performance.now() + 220;

      advancePhaseAfterPlacement();
      state.hadWarning2BeforePlacement = prevWarningLevel >= 2;
      updateWarnings();

      if (!state.done){
        state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
        seedPendingCorrect();
        retargetExistingCorrectBricks();
        ensureStreamFilled();
      }
    }
  }

  function stepCollapse(dt){
    // Visual collapse is driven directly from render time using
    // collapseStartedAt and collapseDir, so no per-frame mutation is needed here.
  }

  function resetAfterCollapse(){
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

  function fillInitialStream(){
    state.stream = [];
    let left = -state.brickWidth * 0.35;
    while (left < state.fieldWidth + state.brickWidth + 40){
      const brick = createStreamBrick(left);
      state.stream.push(brick);
      left += state.brickStep;
    }
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
  }

  function ensureStreamFilled(){
    let rightMostLeft = state.stream.reduce((m, b) => Math.max(m, b.left), -Infinity);

    if (state.beltNeedsFreshSpawn || !Number.isFinite(rightMostLeft)){
      let left = state.fieldWidth + state.brickWidth * 0.35;
      while (left < state.fieldWidth + state.brickWidth + state.brickStep * 3){
        const brick = createStreamBrick(left);
        state.stream.push(brick);
        left += state.brickStep;
      }
      state.beltNeedsFreshSpawn = false;
      state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
      return;
    }

    while (rightMostLeft < state.fieldWidth + state.brickStep){
      const left = rightMostLeft + state.brickStep;
      const brick = createStreamBrick(left);
      state.stream.push(brick);
      rightMostLeft = left;
    }
    state.pendingCorrectVisible = state.stream.filter((brick) => brick.isCorrect).length;
  }

  function createStreamBrick(left){
    const correctKind = getPendingCorrectKind();
    const correctLabel = getPendingCorrectLabel();
    let isCorrect = false;
    let label = "";
    let kind = "word";

    if (shouldSpawnCorrect(left)){
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
      width:state.brickWidth,
      label,
      isCorrect,
      kind,
      fontSize,
      flashWrong:false,
      flashWrongUntil:0,
      spawnIndex: state.spawnIndex++
    };
    brick.center = brick.left + brick.width / 2;
    return brick;
  }

  function shouldSpawnCorrect(left){
    if (state.pendingCorrectVisible >= 2) return false;
    if (!getPendingCorrectLabel()) return false;

    const recentCorrects = state.stream.filter((brick) => brick.isCorrect).sort((a, b) => b.left - a.left);
    if (recentCorrects.length){
      const nearest = recentCorrects[0];
      if (left - nearest.left < state.brickStep * 2.2) return false;
    }

    if (state.pendingCorrectVisible === 0) return true;
    return Math.random() < 0.48;
  }

  function retargetExistingCorrectBricks(){
    const remaining = state.stream.filter((brick) => brick.isCorrect);
    for (const brick of remaining){
      brick.label = getPendingCorrectLabel();
      brick.kind = getPendingCorrectKind();
      brick.fontSize = getConveyorFontSize(brick.label, brick.kind);
    }
  }

  function getConveyorFontSize(label, kind){
    const len = String(label || "").length;
    if (kind === "reference") return clamp(state.brickWidth * 0.13 - Math.max(0, len - 8) * 0.22, 13, 23);
    if (kind === "book") return clamp(state.brickWidth * 0.13 - Math.max(0, len - 10) * 0.2, 13, 23);
    return clamp(state.brickWidth * 0.145 - Math.max(0, len - 8) * 0.22, 14, 24);
  }

  function brickVisualOpacity(brick){
    const laneLeft = state.lanePadX;
    const laneRight = state.fieldWidth - state.lanePadX;
    const edgeFade = clamp(state.fieldWidth * 0.12, 46, 118);
    const center = brick.center;

    if (center <= laneLeft + edgeFade){
      const t = clamp((center - laneLeft) / edgeFade, 0, 1);
      return lerp(0.18, 0.98, t);
    }

    if (center >= laneRight - edgeFade){
      const t = clamp((laneRight - center) / edgeFade, 0, 1);
      return lerp(0.18, 0.98, t);
    }

    return 0.98;
  }

  function isBrickTappable(brick){
    return brick.left < state.fieldWidth && (brick.left + brick.width) > 0;
  }

  function handleBrickTap(id){
    if (state.frenzyActive){
      handleFrenzyTap();
      return;
    }

    if (state.paused || state.done || state.collapseTriggered || state.enteringBrick) return;

    const brick = state.stream.find((b) => b.id === id);
    if (!brick || !isBrickTappable(brick)) return;

    if (!brick.isCorrect){
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
      label:brick.label,
      kind:brick.kind,
      zone,
      progress:0,

      fromLeft:startLeft,
      toLeft:endLeft,
      left:startLeft,

      fromBottom:startBottom,
      toBottom:endBottom,
      bottom:startBottom,

      fromWidth:startWidth,
      toWidth:endWidth,
      width:startWidth,

      fromHeight:startHeight,
      toHeight:endHeight,
      height:startHeight,

      fromFontSize:startFontSize,
      toFontSize:endFontSize,
      fontSize:startFontSize,

      fromXOffset:0,
      toXOffset:0,
      xOffset:0,

      toRot:0,
      rot:0
    };

    seedPendingCorrect();
    retargetExistingCorrectBricks();
    ensureStreamFilled();
  }

  function getTapZone(brick){
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

  function seedPendingCorrect(){
    state.pendingCorrectType = getCurrentCorrectKind();
    state.pendingCorrectLabel = getCurrentCorrectLabel();
  }
  function getPendingCorrectKind(){ return state.pendingCorrectType || getCurrentCorrectKind(); }
  function getPendingCorrectLabel(){ return state.pendingCorrectLabel || getCurrentCorrectLabel(); }

  function getCurrentCorrectKind(){
    if (state.phase === "words") return "word";
    if (state.phase === "book") return "book";
    if (state.phase === "reference") return "reference";
    return "";
  }

  function getCurrentCorrectLabel(){
    if (state.phase === "words") return wordEntries[state.wordIndex]?.display || "";
    if (state.phase === "book") return verseMeta.book || "";
    if (state.phase === "reference") return verseMeta.reference || "";
    return "";
  }

  function makeDecoy(kind, correct){
    if (kind === "book") return { label: pickRandom(shuffle(BOOKS.filter((b) => b !== correct)).slice(0, 8)), kind:"book" };
    if (kind === "reference") return { label: pickRandom(makeReferenceChoices(verseMeta.chapter, verseMeta.verse, verseMeta.verseEnd).filter((r) => r !== correct)), kind:"reference" };
    if (selectedMode === "medium" || selectedMode === "hard") return { label: pickRandom(getVerseDerivedDecoys(state.wordIndex, correct)), kind:"word" };
    return { label: pickRandom(FUN_DECOYS.filter((d) => normalizeWord(d) !== normalizeWord(correct))), kind:"word" };
  }

  function advancePhaseAfterPlacement(){
    if (state.phase === "words"){
      state.wordIndex += 1;
      if (state.wordIndex >= wordEntries.length){
        state.phase = "book";
      }
      return;
    }
    if (state.phase === "book"){
      state.phase = "reference";
      return;
    }
    if (state.phase === "reference"){
      startDestroyFrenzy();
    }
  }

  function getLeanScore(){
    const count = state.progress.length;
    if (count <= 1) return 0;

    let sum = 0;
    for (let i = 0; i < count; i++){
      const brick = state.progress[i];
      const weight = 1 + (i / Math.max(1, count - 1)) * 1.6;
      sum += (brick.zone || 0) * weight;
    }
    return sum;
  }

  function getVisualLean(){
    const raw = getLeanScore();
    const sign = Math.sign(raw);
    const mag = Math.abs(raw);
    const soft = 1 - Math.exp(-mag / 7.4);
    return sign * soft;
  }

  function updateWarnings(){
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
    ){
      triggerCollapse();
    }
  }

  function triggerCollapse(){
    const lean = getVisualLean();
    const count = state.progress.length;

    state.collapseTriggered = true;
    state.collapseStartedAt = performance.now();
    state.collapseDir = lean < 0 ? -1 : 1;
    state.collapseBurstFired = {};

    const previousPose = state.pendingPreCollapsePose || state.lastStableTowerPose || [];

    state.collapseBasePose = state.progress.map((brick, i) => {
      if (i === 0){
        return { offsetX:0, rot:0 };
      }
      return previousPose[i - 1] || { offsetX:0, rot:0 };
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

if (DEBUG_COLLAPSE){
  const fmtPoseRows = (arr) => (arr || []).map((p, i) => ({
    i,
    x: Number((p?.offsetX || 0).toFixed(2)),
    r: Number((p?.rot || 0).toFixed(2))
  }));

  const fmtDeltaRows = (a, b) => {
    const out = [];
    const n = Math.max(a?.length || 0, b?.length || 0);
    for (let i = 0; i < n; i++){
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

  function addSmoke(x, y){
    state.fx.push({ x, y, until:performance.now() + 420, scale:1, kind:"smoke" });
  }

  function addChunkBurst(x, y, scale = 1){
    const now = performance.now();
    for (let i = 0; i < 7; i++){
      const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.35;
      const speed = 26 + Math.random() * 34;
      state.fx.push({
        kind:"chunk",
        x,
        y,
        dx:Math.cos(angle) * speed,
        dy:Math.sin(angle) * speed - 8,
        size:(10 + Math.random() * 10) * scale,
        rot:(Math.random() * 60) - 30,
        until:now + 360 + Math.random() * 120
      });
    }
  }

  function clearStreamWithBurst(){
    for (const brick of state.stream){
      addChunkBurst(brick.center, state.laneY, 1);
    }
    state.stream = [];
    state.pendingCorrectVisible = 0;
    state.beltNeedsFreshSpawn = true;
    state.beltRespawnLockUntil = performance.now() + 520;
  }

  function startDestroyFrenzy(){
    state.frenzyActive = true;
    state.overlayMessage = "Tap to Destroy the Tower!";
    state.overlayUntil = performance.now() + 999999;
    state.stream = [];
    state.pendingCorrectVisible = 0;
    state.enteringBrick = null;
  }

  function handleFrenzyTap(){
    const now = performance.now();
    if (!state.frenzyActive) return;
    if (now < state.frenzyInputLockedUntil) return;
    if (!state.progress.length) return;

    if (state.overlayMessage){
      state.overlayMessage = "";
      state.overlayUntil = 0;
    }

    const topIndex = state.progress.length - 1;

    let cumulativeBottom = 0;
    for (let i = 0; i < topIndex; i++){
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

    if (!state.progress.length){
      state.frenzyActive = false;
      state.overlayMessage = "";
      state.overlayUntil = 0;
      state.frenzyInputLockedUntil = performance.now() + 350;

      window.setTimeout(() => {
        if (!state.done){
          finishGame();
        }
      }, 350);
    }
  }

  async function finishGame(){
    state.running = false;
    state.done = true;
    state.frenzyActive = false;
    stopLoop();
    let reward = { ok:false, petUnlockTriggered:false };
    if (!completionMarked && ctx.verseId && selectedMode){
      completionMarked = true;
      reward = await window.VerseGameBridge.markCompleted({ verseId:ctx.verseId, gameId:GAME_ID, mode:selectedMode });
    }
    renderEndScreen(reward);
  }

  function showOverlay(message, duration = 1400){ state.overlayMessage = message; state.overlayUntil = performance.now() + duration; }

  function getVerseDerivedDecoys(targetIndex, correct){
    const targetNorm = normalizeWord(correct);

    const futureTargetNorms = new Set(
      wordEntries
        .slice(targetIndex + 1)
        .map((entry) => normalizeWord(entry.display))
        .filter(Boolean)
    );

    const candidates = wordEntries.filter((entry, idx) => {
      if (idx === targetIndex) return false;

      const norm = normalizeWord(entry.display);
      if (!norm || norm === targetNorm) return false;

      // Do not use words that will be needed later as decoys.
      if (futureTargetNorms.has(norm)) return false;

      // Keep nearby words out when possible so the belt reads cleaner.
      if (Math.abs(idx - targetIndex) <= 1 && wordEntries.length > 4) return false;

      return true;
    });

    const unique = [];
    const seen = new Set();
    for (const entry of candidates){
      const norm = normalizeWord(entry.display);
      if (seen.has(norm)) continue;
      seen.add(norm);
      unique.push(entry.display);
    }

    const nonTiny = unique.filter((word) => normalizeWord(word).length > 2);
    const pool = nonTiny.length >= 2 ? nonTiny : unique;

    return pool.length
      ? pool
      : FUN_DECOYS.filter((word) => {
          const norm = normalizeWord(word);
          return norm !== targetNorm && !futureTargetNorms.has(norm);
        });
  }

  function makeReferenceChoices(chapter, verse, verseEnd){
    const correct = formatReference(chapter, verse, verseEnd);
    if (!correct) return [];
    const refs = new Set([correct]);
    const span = Number.isFinite(verseEnd) ? Math.max(0, verseEnd - verse) : 0;
    let tries = 0;
    while (refs.size < 10 && tries < 240){
      let fakeChapter = chapter + Math.floor(Math.random() * 11) - 5;
      let fakeVerse = verse + Math.floor(Math.random() * 21) - 10;
      if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 5);
      if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 10);
      const fakeEnd = span > 0 ? fakeVerse + span : null;
      refs.add(formatReference(fakeChapter, fakeVerse, fakeEnd));
      tries += 1;
    }
    return [...refs];
  }

  function parseVerseMeta(verseId, fallbackRef){
    const slug = String(verseId || "").trim().toLowerCase();
    if (slug){
      const parts = slug.split("_").filter(Boolean);
      const nums = [];
      while (parts.length && /^\d+$/.test(parts[parts.length - 1])) nums.unshift(Number(parts.pop()));
      if (parts.length){
        const book = parts.map((part) => /^\d+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
        const chapter = Number.isFinite(nums[0]) ? nums[0] : null;
        const verse = Number.isFinite(nums[1]) ? nums[1] : null;
        const verseEnd = Number.isFinite(nums[2]) ? nums[2] : null;
        return { book, chapter, verse, verseEnd, reference:formatReference(chapter, verse, verseEnd) };
      }
    }
    return parseReferenceFallback(fallbackRef);
  }

  function parseReferenceFallback(ref){
    const text = String(ref || "").trim();
    const cleaned = text.replace(/,\s*[A-Z0-9-]+$/i, "").trim();
    const match = cleaned.match(/^(.*?)(?:\s+(\d+):(\d+)(?:-(\d+))?)?$/);
    const book = (match?.[1] || cleaned).trim();
    const chapter = match?.[2] ? Number(match[2]) : null;
    const verse = match?.[3] ? Number(match[3]) : null;
    const verseEnd = match?.[4] ? Number(match[4]) : null;
    return { book, chapter, verse, verseEnd, reference:formatReference(chapter, verse, verseEnd) };
  }

  function formatReference(chapter, verse, verseEnd){ if (!chapter || !verse) return ""; return verseEnd ? `${chapter}:${verse}-${verseEnd}` : `${chapter}:${verse}`; }
  function tokenizeVerse(text){
    const tokens = [];
    const re = /(\s+|[^\s\w']+|[\w']+)/g;
    for (const part of String(text || "").match(re) || []){
      if (/^\s+$/.test(part)) tokens.push({ kind:"space", text:part });
      else if (/^[\w']+$/.test(part)) tokens.push({ kind:"word", text:part });
      else tokens.push({ kind:"punct", text:part });
    }
    return tokens;
  }
  function extractWordEntries(tokens){ return tokens.filter((t) => t.kind === "word").map((t) => ({ display:t.text })); }

  function laneBottomOffset(){ return clamp(state.fieldWidth * 0.055, 24, 42); }
  function towerBaseBottom(){ return laneBottomOffset() + state.laneHeight + 10; }

  function getTowerShellRotation(now){
    return 0;
  }

  function showBottomWarningOverlay(now){
    if (state.warningLevel <= 0 || state.collapseTriggered) return false;
    const cycleMs = state.warningLevel >= 2 ? 1600 : 3000;
    const onMs = state.warningLevel >= 2 ? 800 : 1500;
    return (now % cycleMs) < onMs;
  }

  function getTopBrickWarningWobble(now){
    if (state.collapseTriggered) return 0;
    if (state.warningLevel === 1){
      return Math.sin(now / 180) * 1.35;
    }
    if (state.warningLevel >= 2){
      return Math.sin(now / 120) * 2.4;
    }
    return 0;
  }

  function lerp(a,b,t){ return a + (b - a) * t; }
  function easeOutBack(x){ const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr){ const copy = [...arr]; for (let i = copy.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function normalizeWord(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9']+/g, ""); }
  function escapeHtml(str){ return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;"); }
})();
