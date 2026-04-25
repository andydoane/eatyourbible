(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "traffic_tap_external";
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
    "taco","banana","penguin","cupcake","pickle","rocket","waffle","balloon","otter","pretzel",
    "pancake","bubble","marshmallow","treasure","robot","firetruck","yo-yo","snowman","blueberry","noodle",
    "pizza","donut","shark","lemon","grape","berry","sock","boot","kite","plane","cat","dog",
    "pig","cow","bug","ant","frog","duck","bear","bat","bird","fish","jam","pie","cake","egg",
    "star","ball","hop","skip","jump","run","spin","clap","sing","swim","kick","dig","nap",
    "hug","tug","push","pull","snap","wave","wink","grin","zoom","zip","pop","bop","glimmer","snorf"
  ];
  const VEHICLES = ["🚗","🚕","🚙","🏎️","🚓","🚌","🚐","🚑","🚒","🚚","🛻"];
  const BONUS_RIVALS = ["🚗","🚕","🚙","🏎️","🚓","🚐","🚚"];
  const DECOY_CLASSES = ["is-deco1","is-deco2","is-deco3","is-deco4","is-deco5"];
  const SPAWN_PATTERNS = [
    ["upper"],
    ["lower"],
    ["upper","lower"],
    ["lower","upper"],
    ["upper","upper","lower"],
    ["lower","lower","upper"]
  ];

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let alreadyCompletedForMode = false;
  let resizeBound = false;
  let endScreenUnlockTimer = 0;
  let itemsClickBound = false;

  const verseMeta = parseVerseMeta(ctx.verseRef || "");
  const buildTokens = tokenizeForBuild(ctx.verseText || "");
  const verseWords = buildTokens.filter(t => t.kind === "word").map(t => t.text);

  const state = {
    running:false,
    paused:false,
    pauseReason:"",
    lastTs:0,
    rafId:0,
    fieldWidth:0,
    fieldHeight:0,
    roadHeight:0,
    gapHeight:0,
    mainDone:false,
    bonusRound:false,
    bonusIntro:false,
    bonusIntroUntil:0,
    buildPopUntil:0,
    buildShakeUntil:0,
    overlayMessage:"",
    overlayUntil:0,
    buildSizeClass:getBuildSizeClass(ctx.verseText || "", verseMeta.book, verseMeta.reference),
    phase:"words",
    wordsBuilt:0,
    bookBuilt:false,
    referenceBuilt:false,
    mainItems:[],
    nextItemId:1,
    lastSpawnAt:0,
    nextSpawnDelay:860,
    totalSpawned:0,
    lastCorrectSpawnAt:0,
    roadCrashUntil:[0,0],
    effectPopups:[],
    crashClouds:[],
    recentCorrectConverted:false,
    bonusLane:"upper",
    bonusPlayerY:0,
    bonusWantedLane:"upper",
    bonusRoadSpeed:420,
    bonusRivals:[],
    bonusNextSpawnAt:0,
    bonusPatternIndex:0,
    bonusDistance:0,
    bonusFinishSpawned:false,
    bonusFinishX:0,
    bonusStunUntil:0,
    bonusBonks:[],
    bonusCompleted:false
  };

  renderIntro();

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="tt-mode-shell">
        <div class="tt-mode-stage">
          <div class="tt-mode-top">
            <div style="font-size:72px;line-height:1;">🚗</div>
            <div class="tt-title">Traffic Tap</div>
            <div class="tt-subtitle">Tap the correct moving word to build the verse.</div>
            <div class="tt-mode-card">
              <div class="tt-mode-actions">
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
      <div class="tt-mode-shell">
        <div class="tt-mode-stage">
          <div class="tt-mode-top">
            <div style="font-size:72px;line-height:1;">🚗</div>
            <div class="tt-title">Choose Your Difficulty</div>
            <div class="tt-subtitle">Easy uses fun decoys and steady traffic. Medium and hard use verse-word decoys, with a bigger speed ramp on hard.</div>
            <div class="tt-mode-card">
              <div class="tt-mode-actions">
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
    itemsClickBound = false;
    completionMarked = false;
    alreadyCompletedForMode = !!window.VerseGameBridge.wasAlreadyCompleted?.(ctx.verseId, GAME_ID, selectedMode);

    state.running = true;
    state.paused = false;
    state.pauseReason = "";
    state.lastTs = 0;
    state.mainDone = false;
    state.bonusRound = false;
    state.bonusIntro = false;
    state.bonusIntroUntil = 0;
    state.buildPopUntil = 0;
    state.buildShakeUntil = 0;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.phase = "words";
    state.wordsBuilt = 0;
    state.bookBuilt = false;
    state.referenceBuilt = false;
    state.mainItems = [];
    state.nextItemId = 1;
    state.lastSpawnAt = 0;
    state.nextSpawnDelay = randomSpawnDelay();
    state.totalSpawned = 0;
    state.lastCorrectSpawnAt = 0;
    state.roadCrashUntil = [0,0];
    state.effectPopups = [];
    state.crashClouds = [];
    state.recentCorrectConverted = false;
    state.bonusLane = "upper";
    state.bonusWantedLane = "upper";
    state.bonusRoadSpeed = 420;
    state.bonusRivals = [];
    state.bonusNextSpawnAt = 0;
    state.bonusPatternIndex = 0;
    state.bonusDistance = 8200;
    state.bonusFinishSpawned = false;
    state.bonusFinishX = 0;
    state.bonusStunUntil = 0;
    state.bonusBonks = [];
    state.bonusCompleted = false;

    itemsClickBound = false;

    app.innerHTML = `
      <div class="tt-shell">
        <div class="tt-stage">
          <div class="tt-build-wrap">
            <div class="tt-build" id="ttBuild">
              <div class="tt-build-text ${state.buildSizeClass}" id="ttBuildText"></div>
            </div>
          </div>
          <div class="tt-field-wrap">
            <div class="tt-field" id="ttField">
              <div class="tt-roads" id="ttRoads"></div>
              <div class="tt-road-mark-layer" id="ttRoadMarks"></div>
              <div class="tt-items-layer" id="ttItemsLayer"></div>
              <div class="tt-effects-layer" id="ttEffectsLayer"></div>
              <div class="tt-bonus-layer" id="ttBonusLayer"></div>
              <div class="tt-overlay-msg" id="ttOverlay"></div>
              <div class="tt-bonus-intro-overlay" id="ttBonusIntroOverlay" aria-hidden="true">
                <div class="tt-bonus-intro-burst"></div>
                <div class="tt-bonus-intro-content">
                  <div class="tt-bonus-intro-title">BONUS ROUND!</div>
                  <div class="tt-bonus-intro-subtitle">Tap UP or DOWN to switch lanes.</div>
                </div>
              </div>
              <div class="tt-controls-layer">
                <button class="tt-corner-pill tt-corner-left" id="ttMenuPill" type="button" aria-label="Game menu">☰</button>
                <div class="tt-bonus-buttons" id="ttBonusButtons" hidden>
                  <button class="tt-bonus-btn" id="ttUpBtn">UP</button>
                  <button class="tt-bonus-btn" id="ttDownBtn">DOWN</button>
                </div>
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
      : (alreadyCompletedForMode ? "Nice driving!" : "Great job!");
    const subtitle = reward?.petUnlockTriggered
      ? "You completed this game for the first time on a learned verse, so your BibloPet progression advanced."
      : (alreadyCompletedForMode
          ? `You finished ${ctx.verseRef} again in ${capitalize(selectedMode)} mode.`
          : `You completed ${ctx.verseRef} in ${capitalize(selectedMode)} mode.`);

    app.innerHTML = `
      <div class="tt-mode-shell">
        <div class="tt-mode-stage">
          <div class="tt-mode-top">
            <div class="tt-end-emoji">🏁</div>
            <div class="tt-end-card">
              <div class="tt-end-title">${escapeHtml(title)}</div>
              <div class="tt-end-text">${escapeHtml(subtitle)}</div>
              <div class="tt-mode-actions tt-end-lock" id="ttEndActions" style="margin-top:16px;">
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
    const endActions = document.getElementById("ttEndActions");
    if (playAgainBtn) playAgainBtn.onclick = renderModeSelect;
    if (exitBtn) exitBtn.onclick = () => window.VerseGameBridge.exitGame();

    window.clearTimeout(endScreenUnlockTimer);
    endScreenUnlockTimer = window.setTimeout(() => {
      if (playAgainBtn) playAgainBtn.disabled = false;
      if (exitBtn) exitBtn.disabled = false;
      if (endActions) endActions.classList.remove("tt-end-lock");
    }, 550);

    wireCommonNav();
  }

  function renderNav(){
    return `
      <div class="tt-nav-wrap">
        <div class="tt-nav">
          <button class="tt-nav-btn" id="homeBtn" aria-label="Home">⌂</button>
          <div class="tt-nav-center">
            <button class="tt-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="tt-nav-btn" id="muteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(body){
    return `
      <div class="tt-help-overlay" id="ttHelpOverlay" aria-hidden="true">
        <div class="tt-help-dialog">
          <div class="tt-help-title">How to Play</div>
          <div class="tt-help-body">${body}</div>
          <div class="tt-help-actions">
            <button class="vm-btn" id="ttHelpCloseBtn">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderGameMenuOverlay(){
    return `
      <div class="tt-help-overlay" id="ttGameMenuOverlay" aria-hidden="true">
        <div class="tt-help-dialog">
          <div class="tt-help-title">Game Menu</div>
          <div class="tt-game-menu-actions">
            <button class="vm-btn" id="ttMenuHowToBtn">How to Play</button>
            <button class="vm-btn" id="ttMenuMuteBtn">${muted ? "Unmute" : "Mute"}</button>
            <button class="vm-btn" id="ttMenuExitBtn">Exit Game</button>
            <button class="vm-btn" id="ttMenuCloseBtn">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function helpHtml(){
    return `Tap the correct moving word to build the verse in order.<br><br>
      Easy uses fun decoys and steady speed.<br><br>
      Medium and hard use words from the verse as decoys. Traffic speeds up as you build, with a stronger ramp on hard.<br><br>
      Wrong taps crash only that road, clearing the lane but keeping your progress.<br><br>
      After the verse, tap the correct book and then the correct chapter and verse. Then enjoy the bonus race.`;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpBtn = document.getElementById("helpBtn");
    const helpOverlay = document.getElementById("ttHelpOverlay");
    const helpCloseBtn = document.getElementById("ttHelpCloseBtn");
    const menuOverlay = document.getElementById("ttGameMenuOverlay");
    const menuHowToBtn = document.getElementById("ttMenuHowToBtn");
    const menuMuteBtn = document.getElementById("ttMenuMuteBtn");
    const menuExitBtn = document.getElementById("ttMenuExitBtn");
    const menuCloseBtn = document.getElementById("ttMenuCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (muteBtn) muteBtn.onclick = () => toggleMute(muteBtn, menuMuteBtn);
    if (helpBtn) helpBtn.onclick = () => {
      if (helpOverlay){
        helpOverlay.classList.add("is-open");
        helpOverlay.dataset.mode = "close";
        if (helpCloseBtn) helpCloseBtn.textContent = "OK";
      }
    };
    if (helpCloseBtn) helpCloseBtn.onclick = () => {
      const mode = helpOverlay?.dataset.mode || "close";
      if (mode === "back") backToMenuFromHelp();
      else closeHelpOverlay();
    };
    if (helpOverlay) helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        const mode = helpOverlay.dataset.mode || "close";
        if (mode === "back") backToMenuFromHelp();
        else closeHelpOverlay();
      }
    };
    if (menuHowToBtn) menuHowToBtn.onclick = openHelpFromMenu;
    if (menuMuteBtn) menuMuteBtn.onclick = () => toggleMute(muteBtn, menuMuteBtn);
    if (menuExitBtn) menuExitBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (menuCloseBtn) menuCloseBtn.onclick = closeGameMenu;
    if (menuOverlay) menuOverlay.onclick = (e) => {
      if (e.target === menuOverlay) closeGameMenu();
    };
  }

  function toggleMute(muteBtn, menuMuteBtn){
    muted = !muted;
    if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
    if (menuMuteBtn) menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
  }

  function wireGameInput(){
    if (!resizeBound){
      window.addEventListener("resize", recalcField);
      resizeBound = true;
    }

    const menuPill = document.getElementById("ttMenuPill");
    if (menuPill){
      const open = (e) => {
        if (e){
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
        openGameMenu();
      };
      menuPill.onclick = open;
      menuPill.onpointerdown = open;
      menuPill.ontouchstart = open;
    }

    const upBtn = document.getElementById("ttUpBtn");
    const downBtn = document.getElementById("ttDownBtn");
    if (upBtn) upBtn.onclick = () => switchBonusLane("upper");
    if (downBtn) downBtn.onclick = () => switchBonusLane("lower");

    const itemsLayer = document.getElementById("ttItemsLayer");
    if (itemsLayer && !itemsClickBound){
      const activateHit = (e) => {
        const hit = e.target.closest(".tt-hit-btn");
        if (!hit) return;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        const id = Number(hit.dataset.itemId);
        if (!Number.isFinite(id)) return;
        chooseMainItem(id, hit);
      };
      itemsLayer.addEventListener("pointerdown", activateHit);
      itemsLayer.addEventListener("click", activateHit);
      itemsClickBound = true;
    }

    window.onkeydown = (e) => {
      if (e.key === "Escape" && state.running){
        if (document.getElementById("ttGameMenuOverlay")?.classList.contains("is-open")) closeGameMenu();
        else openGameMenu();
      }
      if (!state.bonusRound) return;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") switchBonusLane("upper");
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") switchBonusLane("lower");
    };
  }

  function openGameMenu(){
    const overlay = document.getElementById("ttGameMenuOverlay");
    if (overlay){
      setPaused(true, "menu");
      overlay.classList.add("is-open");
    }
  }

  function closeGameMenu(){
    const overlay = document.getElementById("ttGameMenuOverlay");
    if (overlay) overlay.classList.remove("is-open");
    const helpOverlay = document.getElementById("ttHelpOverlay");
    if (!helpOverlay || !helpOverlay.classList.contains("is-open")) setPaused(false, "");
  }

  function openHelpFromMenu(){
    const menuOverlay = document.getElementById("ttGameMenuOverlay");
    const helpOverlay = document.getElementById("ttHelpOverlay");
    const helpCloseBtn = document.getElementById("ttHelpCloseBtn");
    if (menuOverlay) menuOverlay.classList.remove("is-open");
    if (helpOverlay){
      helpOverlay.classList.add("is-open");
      helpOverlay.dataset.mode = "back";
    }
    if (helpCloseBtn) helpCloseBtn.textContent = "Back";
    setPaused(true, "help");
  }

  function closeHelpOverlay(){
    const helpOverlay = document.getElementById("ttHelpOverlay");
    if (helpOverlay) helpOverlay.classList.remove("is-open");
    setPaused(false, "");
  }

  function backToMenuFromHelp(){
    const helpOverlay = document.getElementById("ttHelpOverlay");
    const menuOverlay = document.getElementById("ttGameMenuOverlay");
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
    const field = document.getElementById("ttField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;
    state.gapHeight = clamp(rect.height * 0.06, 12, 28);
    state.roadHeight = Math.max(110, (rect.height - state.gapHeight) / 2);
    state.bonusPlayerY = bonusLaneY(state.bonusLane);
    renderHud();
  }

  function renderHud(){
    renderBuildArea();
    renderField();
  }

  function renderBuildArea(){
    const build = document.getElementById("ttBuild");
    const text = document.getElementById("ttBuildText");
    if (!build || !text) return;

    const now = performance.now();
    build.classList.toggle("is-shake", state.buildShakeUntil > now);
    build.classList.toggle("is-pop", state.buildPopUntil > now);
    text.className = `tt-build-text ${state.buildSizeClass}`;

    if (!state.bonusRound && !state.mainDone && state.wordsBuilt === 0 && !state.bookBuilt && !state.referenceBuilt){
      text.innerHTML = `<div class="tt-build-placeholder">Build the verse one word at a time.<br><strong>Tap the first word to start.</strong></div>`;
      return;
    }

    let html = "";
    let builtWordsSeen = 0;
    for (const token of buildTokens){
      if (token.kind === "space"){
        html += `<span class="tt-build-gap"> </span>`;
        continue;
      }
      if (token.kind === "word"){
        const built = builtWordsSeen < state.wordsBuilt;
        html += `<span class="tt-build-token is-verse ${built ? "is-built" : ""}">${escapeHtml(token.text)}</span>`;
        builtWordsSeen += 1;
      } else {
        const built = builtWordsSeen <= state.wordsBuilt;
        html += `<span class="tt-build-token is-verse ${built ? "is-built" : ""}">${escapeHtml(token.text)}</span>`;
      }
    }

    if (verseMeta.book){
      html += `<span class="tt-build-gap"> </span><span class="tt-build-token is-book ${state.bookBuilt ? "is-built" : ""}">${escapeHtml(verseMeta.book)}</span>`;
    }
    if (verseMeta.reference){
      html += `<span class="tt-build-gap"> </span><span class="tt-build-token is-reference ${state.referenceBuilt ? "is-built" : ""}">${escapeHtml(verseMeta.reference)}</span>`;
    }

    text.innerHTML = html;
  }

  function renderField(){
    renderRoads();
    renderItems();
    renderEffects();
    renderBonus();
    renderOverlays();
  }

  function renderRoads(){
    const roads = document.getElementById("ttRoads");
    const marks = document.getElementById("ttRoadMarks");
    if (!roads || !marks) return;

    if (state.bonusRound){
      roads.innerHTML = "";
      marks.innerHTML = "";
      return;
    }

    const top = 0;
    const bottom = state.roadHeight + state.gapHeight;
    roads.innerHTML = `
      <div class="tt-road top ${state.roadCrashUntil[0] > performance.now() ? "is-crashing" : ""}" style="top:${top}px;height:${state.roadHeight}px"></div>
      <div class="tt-road bottom ${state.roadCrashUntil[1] > performance.now() ? "is-crashing" : ""}" style="top:${bottom}px;height:${state.roadHeight}px"></div>
    `;
    marks.innerHTML = `
      <div class="tt-road top" style="top:${top}px;height:${state.roadHeight}px"><div class="tt-road-center-line"></div></div>
      <div class="tt-road bottom" style="top:${bottom}px;height:${state.roadHeight}px"><div class="tt-road-center-line"></div></div>
    `;
  }

  function renderItems(){
    const layer = document.getElementById("ttItemsLayer");
    if (!layer) return;
    if (state.bonusRound){
      layer.innerHTML = "";
      return;
    }

    const html = state.mainItems.map(item => {
      const y = roadTopY(item.road);
      const cls = ["tt-item", item.direction > 0 ? "is-flipped" : "", item.crashing ? "is-crashing" : ""];
      const unitCls = ["tt-unit"];
      if (item.flashWrongUntil > performance.now()) unitCls.push("is-wrong");
      if (item.swerveUntil > performance.now()) unitCls.push("is-swerve");
      if (item.vanishUntil > performance.now()) unitCls.push("is-vanish");
      if (item.bonkUntil > performance.now()) unitCls.push("is-bonk");
      const bob = Math.sin((performance.now() / 220) + item.bobSeed) * 2.5;
      const tilt = item.tilt || 0;
      return `
        <div class="${cls.filter(Boolean).join(" ")}" style="transform:translate3d(${item.x}px, ${y + bob}px, 0);--tt-item-w:${item.width}px;--tt-item-h:${item.height}px;--tt-word-w:${item.wordWidth}px;--tt-word-h:${item.wordHeight}px;--tt-word-size:${item.wordFont}px;--tt-car-size:${item.carSize}px;--tt-car-hit-h:${item.carHitHeight}px;--tt-car-center-y:${item.carCenterY}%;--tt-word-center-y:${item.wordCenterY}%;--tt-item-tilt:${tilt}deg;">
          <div class="${unitCls.join(" ")}">
            <button type="button" class="tt-car-btn tt-hit-btn" data-item-id="${item.id}" aria-label="${escapeHtml(item.label)}">${item.emoji}</button>
            <button type="button" class="tt-word-btn tt-hit-btn" data-item-id="${item.id}" aria-label="${escapeHtml(item.label)}">${escapeHtml(item.label)}</button>
          </div>
        </div>
      `;
    }).join("");

    layer.innerHTML = html;
  }

  function renderEffects(){
    const layer = document.getElementById("ttEffectsLayer");
    if (!layer) return;
    const html = [];
    for (const cloud of state.crashClouds){
      html.push(`<div class="tt-crash-cloud" style="left:${cloud.x}px;top:${cloud.y}px"></div>`);
    }
    for (const pop of state.effectPopups){
      html.push(`<div class="tt-popup ${pop.good ? "good" : "bad"}" style="left:${pop.x}px;top:${pop.y}px">${escapeHtml(pop.text)}</div>`);
    }
    layer.innerHTML = html.join("");
  }

  function renderBonus(){
    const layer = document.getElementById("ttBonusLayer");
    const buttons = document.getElementById("ttBonusButtons");
    if (!layer || !buttons) return;

    buttons.hidden = !state.bonusRound;
    if (!state.bonusRound){
      layer.innerHTML = "";
      return;
    }

    const playerX = state.fieldWidth * 0.28;
    const roadTop = state.fieldHeight * 0.18;
    const roadHeight = state.fieldHeight * 0.56;
    const bonusRoadCenter = roadTop + (roadHeight / 2);

    let html = `
      <div class="tt-bonus-road" style="top:${bonusRoadCenter}px;height:${roadHeight}px">
        <div class="tt-bonus-lines"></div>
        <div class="tt-bonus-player ${state.bonusStunUntil > performance.now() ? "is-stunned" : ""}" style="left:${playerX}px;top:${bonusLaneY(state.bonusLane)}px">🏎️</div>
    `;

    for (const rival of state.bonusRivals){
      html += `<div class="tt-bonus-rival" style="left:${rival.x}px;top:${bonusLaneY(rival.lane)}px">${rival.emoji}</div>`;
    }
    if (state.bonusFinishSpawned){
      html += `<div class="tt-bonus-finish" style="left:${state.bonusFinishX}px"></div>`;
    }
    html += `</div>`;

    for (const bonk of state.bonusBonks){
      html += `<div class="tt-bonus-bonk" style="left:${bonk.x}px;top:${bonk.y}px">💥</div>`;
    }

    layer.innerHTML = html;
  }

  function renderOverlays(){
    const overlay = document.getElementById("ttOverlay");
    const bonusIntro = document.getElementById("ttBonusIntroOverlay");
    if (!overlay || !bonusIntro) return;

    if (state.overlayUntil > performance.now() && state.overlayMessage){
      overlay.innerHTML = `<div class="tt-overlay-pill is-show">${escapeHtml(state.overlayMessage)}</div>`;
    } else {
      overlay.innerHTML = "";
    }

    bonusIntro.classList.toggle("is-open", state.bonusIntro && state.bonusIntroUntil > performance.now());
  }

  function startLoop(){
    stopLoop();
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(loop);
  }

  function stopLoop(){
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function loop(ts){
    if (!state.running){
      state.rafId = 0;
      return;
    }
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(34, ts - state.lastTs);
    state.lastTs = ts;

    if (!state.paused){
      cleanupTransientEffects(ts);
      if (state.bonusRound) updateBonus(dt, ts);
      else updateMain(dt, ts);
      renderHud();
    }

    state.rafId = requestAnimationFrame(loop);
  }

  function cleanupTransientEffects(now){
    state.effectPopups = state.effectPopups.filter(p => now < p.until);
    state.crashClouds = state.crashClouds.filter(c => now < c.until);
    state.bonusBonks = state.bonusBonks.filter(b => now < b.until);
    state.mainItems = state.mainItems.filter(item => !item.removeAt || now < item.removeAt);
  }

  function updateMain(dt, now){
    if (state.bonusIntro){
      if (now >= state.bonusIntroUntil){
        state.bonusIntro = false;
        startBonusRound();
      }
      return;
    }

    trafficSpawnTick(now);

    const multiplier = trafficSpeedMultiplier();
    for (const item of state.mainItems){
      item.speed = item.speed || item.baseSpeed;
      item.targetSpeed = (item.baseSpeed || 90) * multiplier;
      updateItemSpeed(item, dt);
      if (!item.crashing && !item.vanishUntil){
        item.x += (item.direction < 0 ? -1 : 1) * item.speed * (dt / 1000);
      }
      item.tilt = (item.targetSpeed - item.speed) * 0.06 * (item.direction < 0 ? -1 : 1);
    }

    const buffer = 240;
    state.mainItems = state.mainItems.filter(item => {
      if (item.removeAt && now >= item.removeAt) return false;
      if (item.direction < 0 && item.x < -buffer) return false;
      if (item.direction > 0 && item.x > state.fieldWidth + buffer) return false;
      return true;
    });
  }

  function trafficSpawnTick(now){
    if (!state.fieldWidth) return;
    if (!state.lastSpawnAt){
      state.lastSpawnAt = now;
      state.nextSpawnDelay = randomSpawnDelay();
      return;
    }
    if (now - state.lastSpawnAt < state.nextSpawnDelay) return;

    state.lastSpawnAt = now;
    const delayUsed = state.nextSpawnDelay;
    state.nextSpawnDelay = randomSpawnDelay();

    const roadOrder = shuffle([0,1]);
    for (const road of roadOrder){
      if (!laneHasSpawnRoom(road, 182)) continue;
      spawnMainItem(road, now, delayUsed);
      break;
    }
  }

  function spawnMainItem(road, now, delayUsed){
    const correctLabel = currentTargetLabel();
    if (!correctLabel) return;

    const roadHasCorrect = state.mainItems.some(item => item.road === road && item.isCorrect && !item.crashing);
    const shouldTryCorrect = !roadHasCorrect && canSpawnCorrect(now);
    const spawnCorrect = shouldTryCorrect && (Math.random() < 0.48 || now - state.lastCorrectSpawnAt > 2600);

    const label = spawnCorrect ? correctLabel : nextDecoyLabel(correctLabel);
    const item = makeMainItem({ road, label, isCorrect: spawnCorrect, delayUsed });
    state.mainItems.push(item);
    state.totalSpawned += 1;
    if (spawnCorrect) state.lastCorrectSpawnAt = now;
  }

  function makeMainItem({ road, label, isCorrect, delayUsed }){
    const direction = road === 0 ? -1 : 1;
    const metrics = getItemMetrics(label);
    const x = direction < 0 ? state.fieldWidth + metrics.width + 40 : -(metrics.width + 40);
    const width = metrics.width;
    const norm = clamp((delayUsed - 700) / 440, 0, 1);
    const baseMin = 104;
    const baseMax = 146;
    const baseSpeed = baseMin + ((0.25 + norm * 0.75) * (baseMax - baseMin));
    return {
      id: state.nextItemId++,
      road,
      direction,
      x,
      width,
      label,
      isCorrect,
      emoji: pickRandom(VEHICLES),
      speed: baseSpeed,
      baseSpeed,
      targetSpeed: baseSpeed,
      bobSeed: Math.random() * Math.PI * 2,
      height: metrics.height,
      wordWidth: metrics.wordWidth,
      wordHeight: metrics.wordHeight,
      wordFont: metrics.wordFont,
      carSize: metrics.carSize,
      carHitHeight: metrics.carHitHeight,
      carCenterY: metrics.carCenterY,
      wordCenterY: metrics.wordCenterY,
      styleClass: DECOY_CLASSES[state.nextItemId % DECOY_CLASSES.length],
      flashWrongUntil:0,
      bonkUntil:0,
      swerveUntil:0,
      crashing:false,
      removeAt:0,
      tilt:0
    };
  }

  function laneHasSpawnRoom(road, minGap){
    const dir = road === 0 ? -1 : 1;
    const sampleWidth = estimateItemWidth(currentTargetLabel() || "word");
    const spawnX = dir < 0 ? state.fieldWidth + sampleWidth + 40 : -(sampleWidth + 40);
    for (const item of state.mainItems){
      if (item.road !== road || item.crashing) continue;
      const dist = Math.abs(item.x - spawnX);
      if (dist < Math.max(minGap, (item.width || 150) + 24)) return false;
    }
    return true;
  }

  function canSpawnCorrect(now){
    if (state.mainItems.filter(item => item.isCorrect && !item.crashing).length >= 2) return false;
    if (state.totalSpawned < 2) return false;
    return (now - state.lastCorrectSpawnAt > 1700) || Math.random() < 0.34;
  }

  function updateItemSpeed(item, dt){
    const accelPerSec = 62;
    const closeGap = 56;
    const followGap = 98;
    const releaseGap = 138;
    const others = state.mainItems.filter(other => other.road === item.road && other.id !== item.id && !other.crashing);
    let leader = null;
    let bestGap = Infinity;

    for (const other of others){
      if (item.direction < 0){
        if (other.x >= item.x) continue;
        const gap = item.x - other.x - (other.width || 150);
        if (gap < bestGap){ bestGap = gap; leader = other; }
      } else {
        if (other.x <= item.x) continue;
        const gap = other.x - item.x - (item.width || 150);
        if (gap < bestGap){ bestGap = gap; leader = other; }
      }
    }

    let targetSpeed = item.targetSpeed || item.baseSpeed;
    if (leader){
      const leaderSpeed = leader.speed || leader.baseSpeed || targetSpeed;
      if (bestGap < closeGap) targetSpeed = Math.min(targetSpeed, Math.max(leaderSpeed - 14, 52));
      else if (bestGap < followGap) targetSpeed = Math.min(targetSpeed, leaderSpeed);
      else if (bestGap < releaseGap) targetSpeed = Math.min(targetSpeed, leaderSpeed + 10);
    }

    const maxStep = accelPerSec * (dt / 1000);
    if (item.speed < targetSpeed) item.speed = Math.min(targetSpeed, item.speed + maxStep);
    else if (item.speed > targetSpeed) item.speed = Math.max(targetSpeed, item.speed - maxStep * 1.45);
  }

  function chooseMainItem(itemId, tappedEl){
    const item = state.mainItems.find(x => x.id === itemId);
    if (item && (item.vanishUntil || item.crashing || item.removeAt)) return;
    if (!item || state.bonusRound || state.bonusIntro) return;
    const layerRect = document.getElementById("ttField")?.getBoundingClientRect();
    const rect = tappedEl.getBoundingClientRect();
    const x = rect.left - layerRect.left + rect.width / 2;
    const y = rect.top - layerRect.top + rect.height / 2;

    if (!item.isCorrect){
      item.flashWrongUntil = performance.now() + 280;
      state.buildShakeUntil = performance.now() + 260;
      addPopup(x, y, "✖", false);
      crashRoad(item.road, item.id);
      return;
    }

    item.vanishUntil = performance.now() + 180;
    item.removeAt = performance.now() + 190;
    addPopup(x, y, "✔", true);
    state.buildPopUntil = performance.now() + 200;

    const target = currentTargetLabel();
    if (item.label === target){
      if (state.phase === "words"){
        state.wordsBuilt += 1;
        if (state.wordsBuilt >= verseWords.length){
          showPhaseOverlay("BOOK");
          state.phase = "book";
        }
      } else if (state.phase === "book"){
        state.bookBuilt = true;
        showPhaseOverlay("REFERENCE");
        state.phase = "reference";
      } else if (state.phase === "reference"){
        state.referenceBuilt = true;
        finishMainGame();
      }
      convertOtherCorrectCopies(item.road, target);
    }
  }

  function convertOtherCorrectCopies(chosenRoad, previousTarget){
    for (const item of state.mainItems){
      if (!item.isCorrect || item.road === chosenRoad || item.label !== previousTarget || item.crashing) continue;
      item.isCorrect = false;
      item.label = nextDecoyLabel(previousTarget);
      item.styleClass = DECOY_CLASSES[(item.id + 1) % DECOY_CLASSES.length];
      item.bonkUntil = performance.now() + 260;
    }
  }

  function crashRoad(road, tappedId){
    const now = performance.now();
    state.roadCrashUntil[road] = now + 330;
    const roadItems = state.mainItems.filter(item => item.road === road && !item.crashing);
    roadItems.sort((a,b) => {
      if (road === 0) return b.x - a.x; // spawn side to front
      return a.x - b.x;
    });

    const tapped = roadItems.find(item => item.id === tappedId);
    if (!tapped) return;

    const ordered = [tapped, ...roadItems.filter(item => item.id !== tappedId)];
    ordered.forEach((item, index) => {
      item.crashing = true;
      item.swerveUntil = now + 180 + index * 40;
      item.removeAt = now + 240 + index * 90;
      const center = itemCenter(item);
      state.crashClouds.push({ x:center.x, y:center.y, until: now + 500 + index * 90 });
    });
  }

  function finishMainGame(){
    state.mainDone = true;
    state.mainItems = [];
    state.overlayMessage = "BONUS ROUND!";
    state.overlayUntil = performance.now() + 520;
    state.bonusIntro = true;
    state.bonusIntroUntil = performance.now() + 1400;
  }

  function startBonusRound(){
    state.bonusRound = true;
    state.bonusLane = "upper";
    state.bonusWantedLane = "upper";
    state.bonusPlayerY = bonusLaneY("upper");
    state.bonusRoadSpeed = 420;
    state.bonusDistance = 8200;
    state.bonusRivals = [];
    state.bonusBonks = [];
    state.bonusNextSpawnAt = performance.now() + 650;
    state.bonusPatternIndex = 0;
    state.bonusFinishSpawned = false;
    state.bonusFinishX = state.fieldWidth + 120;
    state.bonusStunUntil = 0;
  }

  function updateBonus(dt, now){
    const playerX = state.fieldWidth * 0.28;
    state.bonusLane = state.bonusWantedLane;
    state.bonusPlayerY = bonusLaneY(state.bonusLane);

    const speedMultiplier = now < state.bonusStunUntil ? 0.58 : 1;
    const roadSpeed = state.bonusRoadSpeed * speedMultiplier;

    state.bonusDistance -= roadSpeed * (dt / 1000);

    if (!state.bonusFinishSpawned && state.bonusDistance <= 1200){
      state.bonusFinishSpawned = true;
      state.bonusFinishX = state.fieldWidth + 150;
    }

    if (!state.bonusFinishSpawned && now >= state.bonusNextSpawnAt){
      spawnBonusPattern();
      state.bonusNextSpawnAt = now + 980;
    }

    for (const rival of state.bonusRivals){
      rival.x -= rival.speed * (dt / 1000);
    }
    state.bonusRivals = state.bonusRivals.filter(rival => rival.x > -140);

    if (state.bonusFinishSpawned){
      state.bonusFinishX -= roadSpeed * (dt / 1000);
      if (state.bonusFinishX <= playerX + 30){
        completeBonusRound();
        return;
      }
    }

    for (const rival of state.bonusRivals){
      if (rival.hitUntil && now < rival.hitUntil) continue;
      const dx = Math.abs(rival.x - playerX);
      const sameLane = rival.lane === state.bonusLane;
      if (sameLane && dx < 54){
        rival.hitUntil = now + 420;
        state.bonusStunUntil = now + 420;
        state.bonusBonks.push({ x:playerX + 34, y:state.bonusPlayerY, until: now + 480 });
      }
    }
  }

  function spawnBonusPattern(){
    const pattern = SPAWN_PATTERNS[state.bonusPatternIndex % SPAWN_PATTERNS.length];
    state.bonusPatternIndex += 1;
    const trimmed = pattern.slice(0, 2);
    trimmed.forEach((lane, index) => {
      state.bonusRivals.push({
        lane,
        x: state.fieldWidth + 120 + index * 140,
        speed: 220 + Math.random() * 34,
        emoji: pickRandom(BONUS_RIVALS),
        hitUntil:0
      });
    });
  }

  async function completeBonusRound(){
    if (state.bonusCompleted) return;
    state.bonusCompleted = true;
    state.running = false;
    stopLoop();

    let reward = null;
    try {
      reward = await window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode
      });
    } catch (err) {
      console.error(err);
    }
    renderEndScreen(reward);
  }

  function switchBonusLane(lane){
    if (!state.bonusRound) return;
    state.bonusWantedLane = lane;
  }

  function currentTargetLabel(){
    if (state.phase === "words") return verseWords[state.wordsBuilt] || "";
    if (state.phase === "book") return verseMeta.book || "";
    if (state.phase === "reference") return verseMeta.reference || "";
    return "";
  }

  function nextDecoyLabel(correctLabel){
    const lowerCorrect = String(correctLabel || "").toLowerCase();

    if (state.phase === "words"){
      let pool = [];
      if (selectedMode === "easy"){
        pool = FUN_DECOYS.filter(word => word.toLowerCase() !== lowerCorrect);
      } else {
        const previousWords = uniqueStrings(verseWords.slice(0, Math.max(1, state.wordsBuilt)).map(w => w.toLowerCase()));
        pool = previousWords.filter(word => word !== lowerCorrect);
        if (pool.length < 4){
          pool = [...pool, ...FUN_DECOYS.filter(word => !pool.includes(word.toLowerCase()) && word.toLowerCase() !== lowerCorrect)];
        }
      }
      return pickRandom(pool) || pickRandom(FUN_DECOYS);
    }

    if (state.phase === "book"){
      const pool = BOOKS.filter(book => book.toLowerCase() !== lowerCorrect);
      return pickRandom(pool) || "Psalms";
    }

    if (state.phase === "reference"){
      const pool = makeReferenceChoices(verseMeta.chapter, verseMeta.verse, verseMeta.verseEnd).filter(ref => ref.toLowerCase() !== lowerCorrect);
      return pickRandom(pool) || "1:1";
    }

    return pickRandom(FUN_DECOYS);
  }

  function trafficSpeedMultiplier(){
    if (selectedMode === "easy") return 1;
    const progress = clamp(state.wordsBuilt / Math.max(1, verseWords.length - 1), 0, 1);
    if (selectedMode === "medium") return 1 + (state.phase === "words" ? 0.15 * progress : 0.15);
    return 1 + (state.phase === "words" ? 0.30 * progress : 0.30);
  }

  function randomSpawnDelay(){
    return 720 + Math.random() * 420;
  }

  function roadTopY(road){
    return road === 0 ? 0 : (state.roadHeight + state.gapHeight);
  }

  function laneCenterY(road){
    return roadTopY(road) + (state.roadHeight * 0.5);
  }

  function bonusLaneY(lane){
    const roadTop = state.fieldHeight * 0.18;
    const roadHeight = state.fieldHeight * 0.56;
    return lane === "upper"
      ? roadTop + roadHeight * 0.35
      : roadTop + roadHeight * 0.65;
  }

  function itemCenter(item){
    return { x: item.x + ((item.width || 150) / 2), y: roadTopY(item.road) + ((item.height || state.roadHeight) * 0.75) };
  }

  function addPopup(x, y, text, good){
    state.effectPopups.push({ x, y, text, good, until: performance.now() + 620 });
  }

  function showPhaseOverlay(text){
    state.overlayMessage = text;
    state.overlayUntil = performance.now() + 900;
  }

  function getItemMetrics(label){
    const labelLen = String(label || "").length;
    const roadH = Math.max(110, state.roadHeight || 160);
    const maxByField = Math.max(230, state.fieldWidth * 0.33);
    const width = clamp((state.fieldWidth < 520 ? state.fieldWidth * 0.40 : state.fieldWidth * 0.245) + labelLen * 7, 180, Math.min(380, maxByField));
    const height = Math.round(roadH);
    const wordWidth = clamp(width * 0.90, 132, width - 4);
    const wordHeight = clamp(roadH * 0.24, 36, 54);
    const wordFont = clamp(roadH * 0.155, 16, 26);
    const carSize = clamp(roadH * 0.46, 48, 88);
    const carHitHeight = clamp(roadH * 0.38, 48, 86);
    const carCenterY = 24;
    const wordCenterY = 74;
    return { width, height, wordWidth, wordHeight, wordFont, carSize, carHitHeight, carCenterY, wordCenterY };
  }

  function estimateItemWidth(label){
    return getItemMetrics(label).width;
  }

  function parseVerseMeta(ref){
    const value = String(ref || "").trim().replace(/\s+/g, " ");
    let cleaned = value
      .replace(/\s*\(([A-Z]{2,8}|KJV|NKJV|ESV|NIV|NLT|CSB|NASB|AMP|MSG)\)\s*$/i, "")
      .replace(/\s+([A-Z]{2,8}|KJV|NKJV|ESV|NIV|NLT|CSB|NASB|AMP|MSG)\s*$/i, "")
      .replace(/\s*[—-]\s*([A-Z]{2,8}|KJV|NKJV|ESV|NIV|NLT|CSB|NASB|AMP|MSG)\s*$/i, "")
      .trim();

    const match = cleaned.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match){
      return { book: cleaned, chapter: 1, verse: 1, verseEnd: null, reference: "" };
    }

    const book = match[1].trim();
    const chapter = Number(match[2]);
    const verse = Number(match[3]);
    const verseEnd = match[4] ? Number(match[4]) : null;

    return {
      book,
      chapter,
      verse,
      verseEnd,
      reference: `${chapter}:${verse}${verseEnd ? `-${verseEnd}` : ""}`
    };
  }

  function tokenizeForBuild(text){
    const raw = String(text || "");
    const parts = raw.match(/\s+|[^\s]+/g) || [];
    return parts.map(part => {
      if (/^\s+$/.test(part)) return { kind:"space", text:part };
      if (/[A-Za-z0-9]/.test(part)) return { kind:"word", text:part };
      return { kind:"punct", text:part };
    });
  }

  function makeReferenceChoices(chapter, verse, verseEnd){
    const correct = `${chapter}:${verse}${verseEnd ? `-${verseEnd}` : ""}`;
    const set = new Set([correct]);
    let tries = 0;
    while (set.size < 9 && tries < 180){
      let c = chapter + Math.floor(Math.random() * 9) - 4;
      let v = verse + Math.floor(Math.random() * 19) - 9;
      if (c < 1) c = 1 + Math.floor(Math.random() * 5);
      if (v < 1) v = 1 + Math.floor(Math.random() * 20);
      const ref = `${c}:${v}${verseEnd ? `-${v + (verseEnd - verse)}` : ""}`;
      set.add(ref);
      tries += 1;
    }
    return shuffle(Array.from(set));
  }

  function getBuildSizeClass(verseText, book, reference){
    const len = `${verseText || ""} ${book || ""} ${reference || ""}`.trim().length;
    if (len > 120) return "is-small";
    if (len > 72) return "is-medium";
    return "";
  }

  function uniqueStrings(items){
    const out = [];
    const seen = new Set();
    for (const item of items){
      const key = String(item).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function shuffle(items){
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickRandom(items){
    if (!items || !items.length) return "";
    return items[Math.floor(Math.random() * items.length)];
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function capitalize(value){
    const text = String(value || "");
    return text ? text[0].toUpperCase() + text.slice(1) : text;
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
