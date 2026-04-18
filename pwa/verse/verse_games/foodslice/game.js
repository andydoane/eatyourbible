(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "foodslice";

  const FOOD_THEMES = [
    ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🥭","🍍","🥥","🥝"],
    ["🍕","🍔","🍟","🌭","🍿","🥓","🥪","🥨","🌮","🌯","🥗","🥘","🍝","🍜","🍲","🍣","🍱"],
    ["🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯"],
    ["🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🥚","🍳"],
    ["🥦","🥬","🥕","🌽","🌶️","🫑","🥒","🥑","🍄","🥔","🧅","🧄"],
    ["🍗","🍖","🥩","🍤","🦀","🦞","🧀","🥚","🥛"]
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
  const GENERIC_DECOYS = [
    "apple","banana","happy","strong","light","water","garden","music","pencil","kitten",
    "rocket","castle","orange","purple","friend","helper","window","bread","honey","planet",
    "smile","gentle","brave","snow","thunder","paper","family","teacher","sunshine","forest"
  ];

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let alreadyCompletedForMode = false;
  let resizeBound = false;
  let endScreenUnlockTimer = 0;

  const state = {
    running:false,
    paused:false,
    pauseReason:"",
    rafId:0,
    lastTs:0,
    fieldWidth:0,
    fieldHeight:0,
    fruitHitSize:96,
    fruitEmojiSize:56,
    bombHitSize:84,
    bombEmojiSize:50,
    sliceSize:54,
    sliceEmojiSize:42,
    theme:pickRandom(FOOD_THEMES),
    tokens:tokenizeVerseWithSpaces(ctx.verseText || ""),
    wordEntries:[],
    wordsBuilt:0,
    phase:"words",
    bookBuilt:false,
    referenceBuilt:false,
    buildSizeClass:"is-normal",
    activeFruit:null,
    activeBomb:null,
    activeSlices:[],
    wrongStreak:0,
    buildShakeUntil:0,
    fieldFlashUntil:0,
    overlayMessage:"",
    overlayUntil:0,
    bonusRound:false,
    bonusBannerUntil:0,
    bonusEndsAt:0,
    bonusFruits:[],
    bonusIdCounter:0,
    bonusCount:0,
    done:false,
    verseMeta:parseVerseMeta(ctx.verseId || "", ctx.verseRef || ""),
    bookChoices:[],
    referenceChoices:[]
  };

  state.wordEntries = extractWordEntries(state.tokens);
  state.buildSizeClass = getBuildSizeClass(ctx.verseText, state.verseMeta.book, state.verseMeta.reference);

  renderIntro();

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="fs-mode-shell">
        <div class="fs-mode-stage">
          <div class="fs-mode-top">
            <div style="font-size:70px;line-height:1;">🍉</div>
            <div class="fs-title">Food Slice</div>
            <div class="fs-subtitle">Slice the next correct flying food to build the verse, then finish the book and reference.</div>
            <div class="fs-mode-card">
              <div class="fs-mode-actions">
                <button class="vm-btn" id="startBtn">Start</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>
    `;
    document.getElementById("startBtn").onclick = renderModeSelect;
    wireCommonNav();
  }

  function renderModeSelect(){
    stopLoop();
    app.innerHTML = `
      <div class="fs-mode-shell">
        <div class="fs-mode-stage">
          <div class="fs-mode-top">
            <div style="font-size:70px;line-height:1;">🍉</div>
            <div class="fs-title">Choose Your Difficulty</div>
            <div class="fs-subtitle">Easy is forgiving. Medium uses verse-word decoys with no penalty. Hard uses verse-word decoys too, but a wrong slice removes two built words and bombs can appear.</div>
            <div class="fs-mode-card">
              <div class="fs-mode-actions">
                <button class="vm-btn" id="easyBtn">Easy</button>
                <button class="vm-btn" id="mediumBtn">Medium</button>
                <button class="vm-btn" id="hardBtn">Hard</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>
    `;
    document.getElementById("easyBtn").onclick = () => startGame("easy");
    document.getElementById("mediumBtn").onclick = () => startGame("medium");
    document.getElementById("hardBtn").onclick = () => startGame("hard");
    wireCommonNav();
  }

  function startGame(mode){
    selectedMode = mode;
    completionMarked = false;
    alreadyCompletedForMode = !!window.VerseGameBridge.wasAlreadyCompleted?.(ctx.verseId, GAME_ID, selectedMode);

    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.lastTs = 0;
    state.wordsBuilt = 0;
    state.phase = "words";
    state.bookBuilt = false;
    state.referenceBuilt = false;
    state.activeFruit = null;
    state.activeBomb = null;
    state.activeSlices = [];
    state.wrongStreak = 0;
    state.buildShakeUntil = 0;
    state.fieldFlashUntil = 0;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.bonusRound = false;
    state.bonusBannerUntil = 0;
    state.bonusEndsAt = 0;
    state.bonusFruits = [];
    state.bonusIdCounter = 0;
    state.bonusCount = 0;
    state.done = false;
    state.theme = pickRandom(FOOD_THEMES);
    state.bookChoices = makeBookChoices(state.verseMeta.book);
    state.referenceChoices = makeReferenceChoices(state.verseMeta.chapter, state.verseMeta.verse, state.verseMeta.verseEnd);

    app.innerHTML = `
      <div class="fs-shell">
        <div class="fs-stage">
          <div class="fs-build-wrap">
            <div class="fs-build" id="fsBuild">
              <div class="fs-build-text ${state.buildSizeClass}" id="fsBuildText"></div>
            </div>
          </div>
          <div class="fs-field-wrap">
            <div class="fs-field" id="fsField">
              <div class="fs-play-layer" id="fsPlayLayer"></div>
              <div class="fs-slice-layer" id="fsSliceLayer"></div>
              <div class="fs-banner-layer" id="fsBannerLayer"></div>
              <div class="fs-overlay-msg" id="fsOverlay"></div>
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

  function renderEndScreen(reward){
    stopLoop();
    const title = reward?.petUnlockTriggered
      ? "BibloPet Unlocked!"
      : (alreadyCompletedForMode ? "Nice slicing!" : "Great job!");
    const subtitle = reward?.petUnlockTriggered
      ? "You completed this game for the first time on a learned verse, so your BibloPet progression advanced."
      : (alreadyCompletedForMode
          ? `You finished ${ctx.verseRef} again in ${capitalize(selectedMode)} mode.`
          : `You completed ${ctx.verseRef} in ${capitalize(selectedMode)} mode.`);

    app.innerHTML = `
      <div class="fs-mode-shell">
        <div class="fs-mode-stage">
          <div class="fs-mode-top">
            <div class="fs-end-emoji">🎉</div>
            <div class="fs-mode-card fs-end-card">
              <div class="fs-end-title">${escapeHtml(title)}</div>
              <div class="fs-end-text">${escapeHtml(subtitle)}</div>
              <div class="fs-mode-actions fs-end-lock" id="fsEndActions" style="margin-top:16px;">
                <button class="vm-btn" id="playAgainBtn" disabled>Play Again</button>
                <button class="vm-btn" id="exitBtn" disabled>Practice Games</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>
    `;
    const playAgainBtn = document.getElementById("playAgainBtn");
    const exitBtn = document.getElementById("exitBtn");
    const endActions = document.getElementById("fsEndActions");

    if (playAgainBtn) playAgainBtn.onclick = () => renderModeSelect();
    if (exitBtn) exitBtn.onclick = () => window.VerseGameBridge.exitGame();

    window.clearTimeout(endScreenUnlockTimer);
    endScreenUnlockTimer = window.setTimeout(() => {
      if (playAgainBtn) playAgainBtn.disabled = false;
      if (exitBtn) exitBtn.disabled = false;
      if (endActions) endActions.classList.remove("fs-end-lock");
    }, 550);

    wireCommonNav();
  }

  function renderNav(){
    return `
      <div class="fs-nav-wrap">
        <div class="fs-nav">
          <button class="fs-nav-btn" id="homeBtn" aria-label="Home">⌂</button>
          <div class="fs-nav-center">
            <button class="fs-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="fs-nav-btn" id="muteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(body){
    return `
      <div class="fs-help-overlay" id="fsHelpOverlay" aria-hidden="true">
        <div class="fs-help-dialog">
          <div class="fs-help-title">How to Play</div>
          <div class="fs-help-body">${body}</div>
          <div class="fs-help-actions">
            <button class="vm-btn" id="fsHelpCloseBtn">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderGameMenuOverlay(){
    return `
      <div class="fs-help-overlay" id="fsGameMenuOverlay" aria-hidden="true">
        <div class="fs-help-dialog fs-game-menu-dialog">
          <div class="fs-help-title">Game Menu</div>
          <div class="fs-game-menu-actions">
            <button class="vm-btn" id="fsMenuHowToBtn">How to Play</button>
            <button class="vm-btn" id="fsMenuMuteBtn">${muted ? "Unmute" : "Mute"}</button>
            <button class="vm-btn" id="fsMenuExitBtn">Exit Game</button>
            <button class="vm-btn" id="fsMenuCloseBtn">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function helpHtml(){
    return `Slice the next correct word to build the verse.<br><br>
      In easy mode, wrong choices do not remove built words.<br><br>
      In medium mode, decoys are chosen from other words in the verse, but there is no wrong-slice penalty.<br><br>
      In hard mode, those same verse-word decoys appear, bombs can show up, and a wrong slice removes two built words.<br><br>
      After the verse is built, slice the correct book and then the correct chapter and verse. Finish by slicing as much bonus food as you can.`;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpBtn = document.getElementById("helpBtn");
    const helpOverlay = document.getElementById("fsHelpOverlay");
    const helpCloseBtn = document.getElementById("fsHelpCloseBtn");
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    const menuHowToBtn = document.getElementById("fsMenuHowToBtn");
    const menuMuteBtn = document.getElementById("fsMenuMuteBtn");
    const menuExitBtn = document.getElementById("fsMenuExitBtn");
    const menuCloseBtn = document.getElementById("fsMenuCloseBtn");

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
    if (helpCloseBtn) {
      helpCloseBtn.onclick = () => {
        const mode = helpOverlay?.dataset.mode || "close";
        if (mode === "back") backToMenuFromHelp();
        else closeHelpOverlay();
      };
    }
    if (helpOverlay) {
      helpOverlay.onclick = (e) => {
        if (e.target === helpOverlay){
          const mode = helpOverlay.dataset.mode || "close";
          if (mode === "back") backToMenuFromHelp();
          else closeHelpOverlay();
        }
      };
    }
    if (menuHowToBtn) menuHowToBtn.onclick = openHelpFromMenu;
    if (menuMuteBtn) menuMuteBtn.onclick = () => {
      muted = !muted;
      menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
      if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
    };
    if (menuExitBtn) menuExitBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (menuCloseBtn) menuCloseBtn.onclick = closeGameMenu;
    if (menuOverlay) menuOverlay.onclick = (e) => {
      if (e.target === menuOverlay) closeGameMenu();
    };
  }

  function wireGameInput(){
    if (!resizeBound){
      window.addEventListener("resize", recalcField);
      resizeBound = true;
    }

    const menuPill = document.getElementById("fsMenuPill");
    if (menuPill) {
      const openFromPill = (e) => {
        if (e){
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
      if (e.key === "Escape" && state.running){
        if (document.getElementById("fsGameMenuOverlay")?.classList.contains("is-open")) closeGameMenu();
        else openGameMenu();
      }
    };
  }

  function openGameMenu(){
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    if (menuOverlay){
      setPaused(true, "menu");
      menuOverlay.classList.add("is-open");
    }
  }

  function closeGameMenu(){
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    const helpOverlay = document.getElementById("fsHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")) setPaused(false, "");
  }

  function openHelpFromMenu(){
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
    const helpOverlay = document.getElementById("fsHelpOverlay");
    const helpCloseBtn = document.getElementById("fsHelpCloseBtn");
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    if (helpOverlay){
      helpOverlay.classList.add("is-open");
      helpOverlay.dataset.mode = "back";
    }
    if (helpCloseBtn) helpCloseBtn.textContent = "Back";
    setPaused(true, "help");
  }

  function closeHelpOverlay(){
    const helpOverlay = document.getElementById("fsHelpOverlay");
    if (helpOverlay) helpOverlay.classList.remove("is-open");
    setPaused(false, "");
  }

  function backToMenuFromHelp(){
    const helpOverlay = document.getElementById("fsHelpOverlay");
    const menuOverlay = document.getElementById("fsGameMenuOverlay");
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

  function renderHud(){
    const phasePill = document.getElementById("fsPhasePill");
    if (phasePill){
      phasePill.textContent = state.bonusRound ? `🍽️ ${state.bonusCount}` : getPhaseLabel();
    }
    renderBuildArea();
    renderField();
  }

  function getPhaseLabel(){
    if (state.phase === "words") return `${state.wordsBuilt}/${state.wordEntries.length}`;
    if (state.phase === "book") return "Book";
    if (state.phase === "reference") return "Reference";
    return "Ready";
  }

  function renderBuildArea(){
    const build = document.getElementById("fsBuild");
    const text = document.getElementById("fsBuildText");
    if (!build || !text) return;

    build.classList.toggle("is-shake", state.buildShakeUntil > performance.now());
    text.className = `fs-build-text ${state.buildSizeClass}`;

    if (state.bonusRound){
      text.innerHTML = `<div class="fs-bonus-counter">${state.bonusCount}<span class="fs-bonus-label">Bonus slices</span></div>`;
      return;
    }

    let html = "";
    let builtWordsSeen = 0;
    for (const token of state.tokens){
      if (token.kind === "space"){
        html += `<span class="fs-build-gap"> </span>`;
        continue;
      }
      if (token.kind === "word"){
        const built = builtWordsSeen < state.wordsBuilt;
        html += `<span class="fs-build-token is-verse ${built ? "is-built" : ""}">${escapeHtml(token.text)}</span>`;
        builtWordsSeen += 1;
      } else {
        const built = builtWordsSeen <= state.wordsBuilt;
        html += `<span class="fs-build-token is-verse ${built ? "is-built" : ""}">${escapeHtml(token.text)}</span>`;
      }
    }

    if (state.verseMeta.book){
      html += `<span class="fs-build-gap"> </span><span class="fs-build-token is-book ${state.bookBuilt ? "is-built" : ""}">${escapeHtml(state.verseMeta.book)}</span>`;
    }
    if (state.verseMeta.reference){
      html += `<span class="fs-build-gap"> </span><span class="fs-build-token is-reference ${state.referenceBuilt ? "is-built" : ""}">${escapeHtml(state.verseMeta.reference)}</span>`;
    }

    text.innerHTML = html;
  }

  function renderField(){
    const playLayer = document.getElementById("fsPlayLayer");
    const sliceLayer = document.getElementById("fsSliceLayer");
    const bannerLayer = document.getElementById("fsBannerLayer");
    const overlay = document.getElementById("fsOverlay");
    const field = document.getElementById("fsField");
    if (!playLayer || !sliceLayer || !bannerLayer || !overlay || !field) return;

    field.classList.toggle("is-flash-bad", state.fieldFlashUntil > performance.now());

    let playHtml = "";
    if (state.activeFruit?.alive) playHtml += renderFruitItem(state.activeFruit, false);
    if (state.activeBomb?.alive) playHtml += renderBombItem(state.activeBomb);
    for (const bonusFruit of state.bonusFruits){
      if (bonusFruit?.alive) playHtml += renderFruitItem(bonusFruit, true);
    }
    playLayer.innerHTML = playHtml;

    playLayer.querySelectorAll("[data-role='fruit']").forEach((el) => {
      const onActivate = (e) => {
        if (e){
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
        if (e){
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        handleBombTap();
      };
      el.onclick = onActivate;
      el.onpointerdown = onActivate;
    });

    sliceLayer.innerHTML = state.activeSlices.filter(Boolean).map((piece) => `
      <div class="fs-slice-piece ${piece.side}" style="transform:translate(${piece.x}px, ${piece.y}px) translate(-50%, -50%) rotate(${piece.rotation}deg)">
        <div class="fs-slice-inner">${escapeHtml(piece.fruit || "🍎")}</div>
      </div>
    `).join("");

    bannerLayer.innerHTML = (state.bonusRound && performance.now() < state.bonusBannerUntil)
      ? `<div class="fs-bonus-banner"><div class="fs-bonus-banner-text">Bonus Round!</div></div>`
      : "";

    overlay.innerHTML = (state.overlayUntil > performance.now() && state.overlayMessage)
      ? `<div class="fs-overlay-msg-inner">${escapeHtml(state.overlayMessage)}</div>`
      : "";
  }

  function renderFruitItem(item, isBonus){
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

  function renderBombItem(item){
    return `
      <div class="fs-item ${item.wasHit ? "is-bomb-hit" : ""}" style="transform:translate(${item.x}px, ${item.y}px) translate(-50%, -50%)">
        <button class="fs-bomb-btn" data-role="bomb" type="button" aria-label="Bomb">
          <span class="fs-bomb-emoji" style="transform:rotate(${Math.round(item.rotation || 0)}deg)">💣</span>
        </button>
      </div>
    `;
  }

  function startLoop(){
    stopLoop();
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(frame);
  }

  function stopLoop(){
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

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
    if (!state.bonusRound && !state.activeFruit){
      spawnMainFruit();
      maybeSpawnBomb();
    }

    updateMovingEntity(state.activeFruit, dt);
    updateMovingEntity(state.activeBomb, dt);
    state.activeSlices.forEach((piece) => updateMovingEntity(piece, dt));
    state.activeSlices = state.activeSlices.filter((piece) => piece.alive);

    if (state.activeFruit && state.activeFruit.y > state.fieldHeight + 140) state.activeFruit = null;
    if (state.activeBomb && state.activeBomb.y > state.fieldHeight + 140) state.activeBomb = null;

    if (state.bonusRound){
      if (now >= state.bonusBannerUntil && now < state.bonusEndsAt){
        const targetCount = 2 + Math.floor(Math.random() * 2);
        const live = state.bonusFruits.filter((item) => item.alive).length;
        if (live < targetCount) spawnBonusFruit();
      }
      state.bonusFruits.forEach((item) => updateMovingEntity(item, dt));
      state.bonusFruits = state.bonusFruits.filter((item) => item.alive && item.y <= state.fieldHeight + 140);
      if (now >= state.bonusEndsAt && state.bonusFruits.length === 0 && state.activeSlices.length === 0){
        finishGame();
      }
    }
  }

  function updateMovingEntity(item, dt){
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

  function spawnMainFruit(){
    const target = getCurrentTargetText();
    const { text, isCorrect } = pickDisplayTextForCurrentPhase(target);
    state.activeFruit = createFlyingFood({ word:text, isCorrect });
  }

  function maybeSpawnBomb(){
    if (selectedMode !== "hard" || state.bonusRound || state.done) return;
    if (Math.random() >= 0.28) return;
    state.activeBomb = createFlyingBomb();
  }

  function createFlyingFood({ word, isCorrect }){
    const motion = createArcMotion();
    return {
      ...motion,
      fruit: pickRandom(state.theme),
      word,
      isCorrect,
      alive:true,
      flashWrong:false,
      rejecting:false,
      wasTapped:false,
      tilt:-16 + Math.random() * 32,
      kind:"fruit"
    };
  }

  function createFlyingBomb(){
    return {
      ...createArcMotion(true),
      alive:true,
      wasTapped:false,
      wasHit:false,
      kind:"bomb"
    };
  }

  function createArcMotion(isBomb = false){
    const fieldW = Math.max(320, state.fieldWidth || 320);
    const fieldH = Math.max(260, state.fieldHeight || 260);
    const sideInset = Math.max(state.fruitHitSize * 0.46, fieldW * 0.12);
    const startX = sideInset + Math.random() * Math.max(24, fieldW - sideInset * 2);
    const peakRatio = fieldW >= 900 ? 0.24 : 0.30;
    const targetPeakY = fieldH * peakRatio;
    const startY = fieldH + Math.max(24, state.fruitHitSize * 0.22);
    const riseDistance = Math.max(fieldH * 0.42, startY - targetPeakY);

    const gravity = fieldH * (isBomb ? 0.00130 : 0.00120);
    const baseVy = Math.sqrt(2 * gravity * riseDistance);
    const vy = -(baseVy + (Math.random() * fieldH * 0.00035 - fieldH * 0.000175));

    const horizontalRange = fieldW * (isBomb ? 0.0025 : 0.0022);
    const vx = (Math.random() * 2 - 1) * horizontalRange;
    const spin = isBomb ? (-3.4 + Math.random() * 6.8) : (-2.8 + Math.random() * 5.6);

    return { x:startX, y:startY, vx, vy, gravity, rotation:0, spin };
  }

  function handleMainFruitTap(){
    const item = state.activeFruit;
    if (!item || !item.alive || item.wasTapped || state.paused || state.done) return;
    item.wasTapped = true;

    if (item.isCorrect){
      createSlicesFrom(item);
      state.activeFruit = null;
      state.wrongStreak = 0;

      if (state.phase === "words"){
        state.wordsBuilt += 1;
        if (state.wordsBuilt >= state.wordEntries.length){
          state.phase = "book";
          state.bookBuilt = false;
          state.referenceBuilt = false;
          showOverlay("Now slice the Bible book");
        }
      } else if (state.phase === "book"){
        state.bookBuilt = true;
        state.phase = "reference";
        state.referenceBuilt = false;
        showOverlay("Now slice the chapter and verse");
      } else if (state.phase === "reference"){
        state.referenceBuilt = true;
        startBonusRound();
      }
      return;
    }

    item.flashWrong = true;
    item.rejecting = true;
    state.wrongStreak += 1;
    state.buildShakeUntil = performance.now() + 320;
    state.fieldFlashUntil = performance.now() + 260;
    if (selectedMode === "hard" && state.phase === "words"){
      state.wordsBuilt = Math.max(0, state.wordsBuilt - 2);
    }
    setPaused(true, "wrong");
    renderHud();
    window.setTimeout(() => {
      item.alive = false;
      if (state.activeFruit === item) state.activeFruit = null;
      if (!state.done) setPaused(false, "");
      renderHud();
    }, 320);
  }

  function handleBombTap(){
    const bomb = state.activeBomb;
    if (!bomb || !bomb.alive || bomb.wasTapped || state.paused || state.done || state.bonusRound) return;
    bomb.wasTapped = true;
    bomb.wasHit = true;
    state.wordsBuilt = 0;
    state.bookBuilt = false;
    state.referenceBuilt = false;
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

  function startBonusRound(){
    state.activeFruit = null;
    state.activeBomb = null;
    state.bonusRound = true;
    state.bonusBannerUntil = performance.now() + 3000;
    state.bonusEndsAt = performance.now() + 23000;
    state.bonusFruits = [];
    state.bonusCount = 0;
    showOverlay("Slice as much bonus food as you can");
  }

  function spawnBonusFruit(){
    state.bonusIdCounter += 1;
    state.bonusFruits.push({
      id: state.bonusIdCounter,
      ...createArcMotion(),
      fruit: pickRandom(state.theme),
      alive:true,
      wasTapped:false,
      tilt:-16 + Math.random() * 32,
      kind:"fruit"
    });
  }

  function handleBonusTap(id){
    const item = state.bonusFruits.find((fruit) => fruit.id === id);
    if (!item || item.wasTapped || state.paused || !state.bonusRound) return;
    item.wasTapped = true;
    item.alive = false;
    state.bonusCount += 1;
    createSlicesFrom(item);
  }

  function createSlicesFrom(item){
    const baseRotation = item.rotation || 0;
    state.activeSlices.push(
      {
        side:"left", fruit:item.fruit, x:item.x, y:item.y,
        vx:(item.vx || 0) - 1.3, vy:(item.vy || 0) - 1.4,
        gravity:item.gravity || 0.42, rotation:baseRotation - 10, spin:-3.8, alive:true
      },
      {
        side:"right", fruit:item.fruit, x:item.x, y:item.y,
        vx:(item.vx || 0) + 1.3, vy:(item.vy || 0) - 1.4,
        gravity:item.gravity || 0.42, rotation:baseRotation + 10, spin:3.8, alive:true
      }
    );
  }

  async function finishGame(){
    state.running = false;
    state.done = true;
    stopLoop();

    let reward = { ok:false, petUnlockTriggered:false };
    if (!completionMarked && ctx.verseId && selectedMode){
      completionMarked = true;
      reward = await window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode
      });
    }
    renderEndScreen(reward);
  }

  function getCurrentTargetText(){
    if (state.phase === "book") return state.verseMeta.book || "";
    if (state.phase === "reference") return state.verseMeta.reference || "";
    return state.wordEntries[state.wordsBuilt]?.display || "";
  }

  function pickDisplayTextForCurrentPhase(correct){
    if (state.phase === "book") return pickPhaseChoice(correct, state.bookChoices);
    if (state.phase === "reference") return pickPhaseChoice(correct, state.referenceChoices);

    const verseWordsLower = new Set(state.wordEntries.map((entry) => normalizeWord(entry.display)));
    let wrongPool = [];
    if (selectedMode === "medium" || selectedMode === "hard"){
      wrongPool = getVerseDerivedDecoys(state.wordsBuilt, correct);
    } else {
      wrongPool = GENERIC_DECOYS.filter((word) => {
        const lower = normalizeWord(word);
        return lower !== normalizeWord(correct) && !verseWordsLower.has(lower);
      });
    }

    const mustUseCorrect = state.wrongStreak >= 2;
    const useCorrect = mustUseCorrect || Math.random() < 0.6 || !wrongPool.length;
    if (useCorrect){
      state.wrongStreak = 0;
      return { text:correct, isCorrect:true };
    }
    state.wrongStreak += 1;
    return { text:pickRandom(wrongPool), isCorrect:false };
  }

  function pickPhaseChoice(correct, choicePool){
    const mustUseCorrect = state.wrongStreak >= 2;
    const wrongs = (choicePool || []).filter((item) => item !== correct);
    const useCorrect = mustUseCorrect || Math.random() < 0.6 || !wrongs.length;
    if (useCorrect){
      state.wrongStreak = 0;
      return { text:correct, isCorrect:true };
    }
    state.wrongStreak += 1;
    return { text:pickRandom(wrongs), isCorrect:false };
  }

  function getVerseDerivedDecoys(targetIndex, correct){
    const targetNorm = normalizeWord(correct);
    const candidates = state.wordEntries.filter((entry, idx) => {
      if (idx === targetIndex) return false;
      const norm = normalizeWord(entry.display);
      if (!norm || norm === targetNorm) return false;
      if (Math.abs(idx - targetIndex) <= 1 && state.wordEntries.length > 4) return false;
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
    return pool.length ? pool : GENERIC_DECOYS.filter((word) => normalizeWord(word) !== targetNorm);
  }

  function makeBookChoices(correctBook){
    const others = shuffle(BOOKS.filter((b) => b !== correctBook)).slice(0, 3);
    return shuffle([correctBook, ...others]);
  }

  function makeReferenceChoices(chapter, verse, verseEnd){
    const correct = formatReference(chapter, verse, verseEnd);
    if (!correct) return [];
    const refs = new Set([correct]);
    const span = Number.isFinite(verseEnd) ? Math.max(0, verseEnd - verse) : 0;
    let tries = 0;
    while (refs.size < 4 && tries < 200){
      let fakeChapter = chapter + Math.floor(Math.random() * 11) - 5;
      let fakeVerse = verse + Math.floor(Math.random() * 21) - 10;
      if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 5);
      if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 10);
      const fakeEnd = span > 0 ? fakeVerse + span : null;
      refs.add(formatReference(fakeChapter, fakeVerse, fakeEnd));
      tries += 1;
    }
    return shuffle([...refs]);
  }

  function parseVerseMeta(verseId, fallbackRef){
    const slug = String(verseId || "").trim().toLowerCase();
    if (slug){
      const parts = slug.split("_").filter(Boolean);
      const nums = [];
      while (parts.length && /^\d+$/.test(parts[parts.length - 1])){
        nums.unshift(Number(parts.pop()));
      }

      if (parts.length){
        const book = parts.map((part, index) => {
          if (/^\d+$/.test(part)) return part;
          if (index === 0 && /^\d+$/.test(parts[0])) return part.charAt(0).toUpperCase() + part.slice(1);
          return part.charAt(0).toUpperCase() + part.slice(1);
        }).join(" ");
        const chapter = Number.isFinite(nums[0]) ? nums[0] : null;
        const verse = Number.isFinite(nums[1]) ? nums[1] : null;
        const verseEnd = Number.isFinite(nums[2]) ? nums[2] : null;
        return {
          book,
          chapter,
          verse,
          verseEnd,
          reference: formatReference(chapter, verse, verseEnd)
        };
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
    return {
      book,
      chapter,
      verse,
      verseEnd,
      reference: formatReference(chapter, verse, verseEnd)
    };
  }

  function formatReference(chapter, verse, verseEnd){
    if (!chapter || !verse) return "";
    return verseEnd ? `${chapter}:${verse}-${verseEnd}` : `${chapter}:${verse}`;
  }

  function tokenizeVerseWithSpaces(text){
    const tokens = [];
    const re = /(\s+|[^\s\w']+|[\w']+)/g;
    for (const part of String(text || "").match(re) || []){
      if (/^\s+$/.test(part)) tokens.push({ kind:"space", text:part });
      else if (/^[\w']+$/.test(part)) tokens.push({ kind:"word", text:part });
      else tokens.push({ kind:"punct", text:part });
    }
    return tokens;
  }

  function extractWordEntries(tokens){
    return tokens.filter((t) => t.kind === "word").map((t) => ({ display:t.text }));
  }

  function getBuildSizeClass(verseText, book, reference){
    const combinedLength = `${verseText || ""} ${book || ""} ${reference || ""}`.trim().length;
    if (combinedLength > 120) return "is-small";
    if (combinedLength > 72) return "is-medium";
    return "is-normal";
  }

  function showOverlay(message, duration = 1400){
    state.overlayMessage = message;
    state.overlayUntil = performance.now() + duration;
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr){
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function normalizeWord(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9']+/g, ""); }
  function escapeHtml(str){
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
