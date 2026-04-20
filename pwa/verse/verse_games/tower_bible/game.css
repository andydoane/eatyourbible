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
    medium:{warn1:7,warn2:10,collapse:13},
    hard:{warn1:5,warn2:8,collapse:10}
  };

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
    collapseTriggered:false,
    collapseEndsAt:0,

    stream:[],
    streamId:0,
    fx:[],
    enteringBrick:null,
    enteringId:0,
    done:false,

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
      warningLevel:0, collapseTriggered:false, collapseEndsAt:0,
      stream:[], streamId:0, fx:[], enteringBrick:null, enteringId:0,
      done:false, pendingCorrectLabel:"", pendingCorrectType:"word",
      pendingCorrectVisible:0, spawnIndex:0
    });
    seedPendingCorrect();

    app.innerHTML = `
      <div class="tb-shell">
        <div class="tb-stage">
          <div class="tb-field-wrap">
            <div class="tb-field" id="tbField">
              <div class="tb-sky-vignette"></div>
              <div class="tb-cloud c1">☁️</div>
              <div class="tb-cloud c2">☁️</div>
              <div class="tb-tower-layer" id="tbTowerLayer"></div>
              <div class="tb-warning-layer" id="tbWarningLayer"></div>
              <div class="tb-guide-layer" id="tbGuideLayer"></div>
              <div class="tb-conveyor-layer" id="tbConveyorLayer"></div>
              <div class="tb-enter-layer" id="tbEnterLayer"></div>
              <div class="tb-smoke-layer" id="tbSmokeLayer"></div>
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
      : (alreadyCompletedForMode ? "Tower rebuilt!" : "Great job!");
    const subtitle = reward?.petUnlockTriggered
      ? "You completed this game for the first time on a learned verse, so your BibloPet progression advanced."
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
    if (!towerLayer || !guideLayer || !conveyorLayer || !enterLayer || !smokeLayer || !warningLayer) return;

    renderTower(towerLayer, smokeLayer);
    renderGuide(guideLayer);
    renderConveyor(conveyorLayer);
    renderEnteringBrick(enterLayer);
    renderEffects(smokeLayer);
    renderWarning(warningLayer);
  }

  function renderGuide(layer){
    layer.innerHTML = `
      <div class="tb-guide-wrap" style="left:${state.guideCenterX}px;top:${state.laneY}px;">
        <div class="tb-guide" style="width:${state.guideWidth}px;height:${state.brickHeight}px;"></div>
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

  function renderTower(layer, smokeLayer){
    const now = performance.now();
    const towerShellClass = ["tb-tower-shell"];
    if (state.towerShakeUntil > now) towerShellClass.push("tb-tower-shake");
    else if (state.towerSettleUntil > now) towerShellClass.push("tb-tower-settle");
    if (state.warningLevel === 1) towerShellClass.push("tb-tower-wobble-1");
    if (state.warningLevel >= 2) towerShellClass.push("tb-tower-wobble-2");

    const lean = getVisualLean();
    const count = state.progress.length;
    const maxLeanPx = Math.min(state.fieldWidth * 0.065, 46);

    let html = `<div class="${towerShellClass.join(" ")}" id="tbTowerShell">`;

    let cumulativeBottom = 0;
    for (let i = 0; i < count; i++){
      const brick = state.progress[i];
      const level = i;
      const t = count <= 1 ? 0 : level / Math.max(1, count - 1);
      const curve = Math.pow(t, 1.55);
      const scale = Math.max(0.54, Math.pow(0.95, level));
      const width = state.towerWidth * 0.76 * scale;
      const height = Math.max(34, state.brickHeight * 0.9 * scale);
      const fontSize = Math.max(13, state.brickHeight * 0.33 * scale);
      const offsetX = count <= 1 ? 0 : lean * maxLeanPx * curve;
      const rot = count <= 2 ? 0 : lean * 1.15 * Math.pow(t, 1.7);
      const cls = ["tb-tower-brick"];
      const opacity = Math.max(0.72, 1 - level * 0.02);
      if (brick.kind === "book") cls.push("book");
      if (brick.kind === "reference") cls.push("ref", "capstone");
      html += `<div class="${cls.join(" ")}" style="bottom:${cumulativeBottom}px;width:${width}px;height:${height}px;font-size:${fontSize}px;opacity:${opacity.toFixed(3)};transform:translateX(calc(-50% + ${offsetX}px)) rotate(${rot}deg)">${escapeHtml(brick.label)}</div>`;
      cumulativeBottom += height + clamp(state.brickHeight * 0.07, 4, 8);
    }

    html += `</div>`;
    layer.innerHTML = html;

    if (state.collapseTriggered){
      smokeLayer.innerHTML = `
        <div class="tb-base-smoke is-open">
          <div class="p p1"></div><div class="p p2"></div><div class="p p3"></div><div class="p p4"></div><div class="p p5"></div>
        </div>` + smokeLayer.innerHTML;
    }
  }

  function renderEffects(layer){
    const now = performance.now();
    state.fx = state.fx.filter((fx) => fx.until > now);
    let html = layer.innerHTML || "";
    for (const fx of state.fx){
      html += `<div class="tb-smoke-puff" style="left:${fx.x}px;top:${fx.y}px"></div>`;
    }
    layer.innerHTML = html;
  }

  function renderWarning(layer){
    if (state.warningLevel === 0){
      layer.innerHTML = "";
      return;
    }
    const text = state.warningLevel === 1 ? "⚠️" : "⚠️⚠️";
    layer.innerHTML = `<div style="position:absolute;left:50%;top:18px;transform:translateX(-50%);font-size:${state.warningLevel === 1 ? 22 : 26}px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.18));">${text}</div>`;
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
    ensureStreamFilled();
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
      state.progress.unshift({ label:e.label, kind:e.kind, zone:e.zone });
      state.enteringBrick = null;

      state.towerSettleUntil = performance.now() + 220;

      const puffY = state.fieldHeight - towerBaseBottom() - state.brickHeight * 0.45;
      addSmoke(state.fieldWidth * 0.5, puffY);

      advancePhaseAfterPlacement();
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
    for (let i = 0; i < state.progress.length; i++){
      const brick = state.progress[i];
      if (brick.collapseDelay == null) brick.collapseDelay = i * 55;
      brick.collapseTime = (brick.collapseTime || 0) + dt;
    }
  }

  function resetAfterCollapse(){
    state.collapseTriggered = false;
    state.progress = [];
    state.warningLevel = 0;
    state.enteringBrick = null;
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
    if (!Number.isFinite(rightMostLeft)) rightMostLeft = -state.brickWidth;
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
    return brick.left <= state.guideRightX && (brick.left + brick.width) >= state.guideLeftX;
  }

  function handleBrickTap(id){
    if (state.paused || state.done || state.collapseTriggered || state.enteringBrick) return;

    const brick = state.stream.find((b) => b.id === id);
    if (!brick || !isBrickTappable(brick)) return;

    if (!brick.isCorrect){
      brick.flashWrong = true;
      brick.flashWrongUntil = performance.now() + 260;
      state.towerShakeUntil = performance.now() + 300;
      state.guideFlashUntil = performance.now() + 300;
      addSmoke(brick.center, state.laneY);
      return;
    }

    const zone = getTapZone(brick);
    const visual = zoneToEntryOffset(zone);
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

  function zoneToEntryOffset(zone){
    if (zone === 0) return 0;
    if (zone === -1) return -state.brickWidth * 0.25;
    if (zone === 1) return state.brickWidth * 0.25;
    if (zone === -2) return -state.brickWidth * 0.5;
    return state.brickWidth * 0.5;
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
        showOverlay("Now place the Bible book");
      }
      return;
    }
    if (state.phase === "book"){
      state.phase = "reference";
      showOverlay("Now place the chapter and verse");
      return;
    }
    if (state.phase === "reference"){
      state.done = true;
      finishGame();
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

    if (selectedMode !== "easy" && mag >= t.collapse && !state.collapseTriggered){
      triggerCollapse();
    }
  }

  function triggerCollapse(){
    state.collapseTriggered = true;
    state.collapseEndsAt = performance.now() + 1150;
    state.towerShakeUntil = performance.now() + 500;
  }

  function addSmoke(x, y){ state.fx.push({ x, y, until:performance.now() + 420 }); }

  async function finishGame(){
    state.running = false;
    state.done = true;
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
    const candidates = wordEntries.filter((entry, idx) => {
      if (idx === targetIndex) return false;
      const norm = normalizeWord(entry.display);
      if (!norm || norm === targetNorm) return false;
      if (Math.abs(idx - targetIndex) <= 1 && wordEntries.length > 4) return false;
      return true;
    });
    const unique = [];
    const seen = new Set();
    for (const entry of candidates){ const norm = normalizeWord(entry.display); if (seen.has(norm)) continue; seen.add(norm); unique.push(entry.display); }
    const nonTiny = unique.filter((word) => normalizeWord(word).length > 2);
    const pool = nonTiny.length >= 2 ? nonTiny : unique;
    return pool.length ? pool : FUN_DECOYS.filter((word) => normalizeWord(word) !== targetNorm);
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

  function lerp(a,b,t){ return a + (b - a) * t; }
  function easeOutBack(x){ const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr){ const copy = [...arr]; for (let i = copy.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function normalizeWord(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9']+/g, ""); }
  function escapeHtml(str){ return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;"); }
})();
