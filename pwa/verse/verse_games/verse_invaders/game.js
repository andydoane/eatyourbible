(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_invaders";
  const LANE_KEYS = ["left", "center", "right"];
  const LANE_COLORS = [
    {
      key: "red",
      hex: "#ff5a51",
      alienImg: "./verse_invaders_images/verse_invaders_alien_red.png",
      alienAlt: "Red alien"
    },
    {
      key: "yellow",
      hex: "#ffc751",
      alienImg: "./verse_invaders_images/verse_invaders_alien_yellow.png",
      alienAlt: "Yellow alien"
    },
    {
      key: "blue",
      hex: "#40b9c5",
      alienImg: "./verse_invaders_images/verse_invaders_alien_blue.png",
      alienAlt: "Blue alien"
    }
  ];

  const ABDUCTEE_IMAGES = [
    "./verse_invaders_images/verse_invaders_abductee_1.png",
    "./verse_invaders_images/verse_invaders_abductee_2.png"
  ];
  const BUTTON_COLOR_ORDER = {
    left: LANE_COLORS[0],
    center: LANE_COLORS[1],
    right: LANE_COLORS[2]
  };
  const CORRECT_EFFECT_POOL = ["alienPop", "starburst", "chrysanthemum", "novaBurst"];
  const BONUS_FIREWORK_POOL = ["flashRing", "classicFirework", "confettiBloom", "plasmaBurst", "cosmicCrackle"];
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
    "hug","tug","push","pull","snap","wave","wink","grin","zoom","zip","pop","bop","glimmer","snorf",
    "plinko","dazzle","whizzle","bloop","tinker","wobble","zapper","muffin","noony","pibble","crumble"
  ];

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let resizeHandlerBound = false;

  const state = {
    running:false,
    rafId:0,
    lastTs:0,
    paused:false,
    pauseReason:"",
    scale:1,
    fieldWidth:0,
    fieldHeight:0,
    controlsTopY:0,
    bottomZoneY:0,
    buttonsLocked:false,
    activeLane:null,
    flashBadUntil:0,
    buildShakeUntil:0,
    overlayMessage:"",
    overlayUntil:0,
    buildSizeClass:"normal",
    queue:[],
    builtCount:0,
    phase:"words",
    streak:0,
    mistakes:0,
    wrongGuessesThisRound:0,
    roundIndex:0,
    roundSpeed:0,
    entities:[],
    rocket:null,
    trails:[],
    effects:[],
    roundStatus:"idle",
    scheduledActions:[],
    bonusMode:false,
    bonusShotsLeft:0,
    bonusAutoTimer:0,
    bonusFinished:false,
    bonusFireworks:[],
    modeTiming:{
      easy:{ start:6.2, step:0 },
      medium:{ start:5.8, step:-0.08 },
      hard:{ start:5.1, step:-0.10 }
    }
  };

  const parsedRef = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
  const verseWords = tokenizeVerse(ctx.verseText);

  renderIntro();


  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="vinv-mode-shell">
        <div class="vinv-mode-stage">
          <div class="vinv-mode-top">
            <div style="font-size:70px;line-height:1;">👾🚀</div>
            <div class="vinv-title">Verse Invaders</div>
            <div class="vinv-subtitle">Press the color of the next correct word. Rockets lock onto that color wherever it is.</div>
            <div class="vinv-mode-card">
              <div class="vinv-mode-actions">
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
      <div class="vinv-mode-shell">
        <div class="vinv-mode-stage">
          <div class="vinv-mode-top">
            <div class="vinv-title">Choose Your Difficulty</div>
            <div class="vinv-subtitle">Easy stays steady. Medium speeds up each round. Hard starts faster and keeps speeding up.</div>
            <div class="vinv-mode-card">
              <div class="vinv-mode-actions">
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
    state.running = true;
    state.lastTs = 0;
    state.paused = false;
    state.pauseReason = "";
    state.buttonsLocked = false;
    state.activeLane = null;
    state.flashBadUntil = 0;
    state.buildShakeUntil = 0;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.queue = [...verseWords, parsedRef.book, parsedRef.reference].filter(Boolean);
    state.buildSizeClass = getBuildSizeClass(ctx.verseText, parsedRef.book, parsedRef.reference);
    state.builtCount = 0;
    state.phase = "words";
    state.streak = 0;
    state.mistakes = 0;
    state.wrongGuessesThisRound = 0;
    state.roundIndex = 0;
    state.entities = [];
    state.rocket = null;
    state.trails = [];
    state.effects = [];
    state.roundStatus = "idle";
    state.scheduledActions = [];
    state.bonusMode = false;
    state.bonusShotsLeft = 0;
    state.bonusAutoTimer = 0;
    state.bonusFinished = false;
    state.bonusFireworks = [];
    state.roundSpeed = 0;

    app.innerHTML = `
      <div class="vinv-shell">
        <div class="vinv-stage">
          <div class="vinv-build-wrap">
            <div class="vinv-build" id="vinvBuild">
              <div class="vinv-build-text" id="vinvBuildText"></div>
            </div>
          </div>

          <div class="vinv-field-wrap">
            <div class="vinv-field" id="vinvField">
              <div class="vinv-lanes" id="vinvLanes"></div>
              <div class="vinv-entities" id="vinvEntities"></div>
              <div class="vinv-rockets" id="vinvRockets"></div>
              <div class="vinv-effects" id="vinvEffects"></div>
              <div class="vinv-bottom" id="vinvBottom"></div>
              <div class="vinv-bonus" id="vinvBonus"></div>
              <div class="vinv-overlay-msg" id="vinvOverlay"></div>
              <div class="vinv-hud-overlay">
                <div class="vinv-corner-pill vinv-corner-left" id="vinvModePill"></div>
                <div class="vinv-corner-pill vinv-corner-right" id="vinvStreakPill"></div>
              </div>
            </div>

            <div class="vinv-controls" id="vinvControls">
              <button class="vinv-lane-btn" data-lane="left"></button>
              <button class="vinv-lane-btn" data-lane="center"></button>
              <button class="vinv-lane-btn" data-lane="right"></button>
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
    renderStaticField();
    spawnRound();
    startLoop();
  }

  function renderNav(){
    return `
      <div class="vinv-nav-wrap">
        <div class="vinv-nav">
          <button class="vinv-nav-btn" id="homeBtn" aria-label="Home">⌂</button>
          <div class="vinv-nav-center">
            <button class="vinv-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="vinv-nav-btn" id="muteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(body){
    return `
      <div class="vinv-help-overlay" id="vinvHelpOverlay" aria-hidden="true">
        <div class="vinv-help-dialog">
          <div class="vinv-help-title">How to Play</div>
          <div class="vinv-help-body">${body}</div>
          <div class="vinv-help-actions">
            <button class="vm-btn" id="vinvHelpCloseBtn">OK</button>
          </div>
        </div>
      </div>
    `;
  }

function renderGameMenuOverlay(){
  return `
    <div class="vinv-help-overlay" id="vinvGameMenuOverlay" aria-hidden="true">
      <div class="vinv-help-dialog vinv-game-menu-dialog">
        <div class="vinv-help-title vinv-game-menu-title">Game Menu</div>
        <div class="vinv-game-menu-actions">
          <button class="vm-btn vinv-game-menu-btn" id="vinvMenuHowToBtn">How to Play</button>
          <button class="vm-btn vinv-game-menu-btn" id="vinvMenuMuteBtn">${muted ? "Unmute" : "Mute"}</button>
          <button class="vm-btn vinv-game-menu-btn" id="vinvMenuExitBtn">Exit Game</button>
          <button class="vm-btn vinv-game-menu-btn" id="vinvMenuCloseBtn">Close</button>
        </div>
      </div>
    </div>
  `;
}

  function helpHtml(){
    return `Tap the color of the next correct word.<br><br>
      The three buttons are always red, yellow, and blue from left to right.<br><br>
      A correct hit explodes and adds the word to the build area.<br><br>
      A wrong hit resets your streak. After two wrong hits in one round, that set clears and a new one begins.<br><br>
      If the correct word reaches the buttons, it abducts a human and the streak resets.`;
  }

function wireCommonNav(){
  const homeBtn = document.getElementById("homeBtn");
  const muteBtn = document.getElementById("muteBtn");
  const helpBtn = document.getElementById("helpBtn");

  const helpOverlay = document.getElementById("vinvHelpOverlay");
  const helpCloseBtn = document.getElementById("vinvHelpCloseBtn");

  const menuOverlay = document.getElementById("vinvGameMenuOverlay");
  const menuHowToBtn = document.getElementById("vinvMenuHowToBtn");
  const menuMuteBtn = document.getElementById("vinvMenuMuteBtn");
  const menuExitBtn = document.getElementById("vinvMenuExitBtn");
  const menuCloseBtn = document.getElementById("vinvMenuCloseBtn");

  if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();

  if (muteBtn) muteBtn.onclick = () => {
    muted = !muted;
    muteBtn.textContent = muted ? "🔇" : "🔊";
    if (menuMuteBtn) menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
  };

  if (helpBtn) helpBtn.onclick = () => {
    if (helpOverlay) {
      helpOverlay.classList.add("is-open");
      helpOverlay.dataset.mode = "close";
      if (helpCloseBtn) helpCloseBtn.textContent = "OK";
    }
  };

  if (helpCloseBtn) {
    helpCloseBtn.onclick = () => {
      const mode = helpOverlay?.dataset.mode || "close";
      if (mode === "back"){
        backToMenuFromHelp();
      } else {
        closeHelpOverlay();
      }
    };
  }

  if (helpOverlay) {
    helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        const mode = helpOverlay.dataset.mode || "close";
        if (mode === "back"){
          backToMenuFromHelp();
        } else {
          closeHelpOverlay();
        }
      }
    };
  }

  if (menuHowToBtn) {
    menuHowToBtn.onclick = () => {
      openHelpFromMenu();
    };
  }

  if (menuMuteBtn) {
    menuMuteBtn.onclick = () => {
      muted = !muted;
      menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
      if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
    };
  }

  if (menuExitBtn) {
    menuExitBtn.onclick = () => window.VerseGameBridge.exitGame();
  }

  if (menuCloseBtn) {
    menuCloseBtn.onclick = () => closeGameMenu();
  }

  if (menuOverlay) {
    menuOverlay.onclick = (e) => {
      if (e.target === menuOverlay) closeGameMenu();
    };
  }
}

function setPaused(paused, reason = ""){
  state.paused = paused;
  state.pauseReason = paused ? reason : "";
  if (!paused){
    state.lastTs = performance.now();
  }
}

function openGameMenu(){
  const menuOverlay = document.getElementById("vinvGameMenuOverlay");
  if (menuOverlay){
    setPaused(true, "menu");
    menuOverlay.classList.add("is-open");
  }
}

function closeGameMenu(){
  const menuOverlay = document.getElementById("vinvGameMenuOverlay");
  if (menuOverlay){
    menuOverlay.classList.remove("is-open");
  }
  const helpOverlay = document.getElementById("vinvHelpOverlay");
  if (!helpOverlay || !helpOverlay.classList.contains("is-open")){
    setPaused(false, "");
  }
}

function openHelpFromMenu(){
  const menuOverlay = document.getElementById("vinvGameMenuOverlay");
  const helpOverlay = document.getElementById("vinvHelpOverlay");
  const helpCloseBtn = document.getElementById("vinvHelpCloseBtn");

  if (menuOverlay) menuOverlay.classList.remove("is-open");
  if (helpOverlay){
    helpOverlay.classList.add("is-open");
    helpOverlay.dataset.mode = "back";
  }
  if (helpCloseBtn) helpCloseBtn.textContent = "Back";

  setPaused(true, "help");
}

function closeHelpOverlay(){
  const helpOverlay = document.getElementById("vinvHelpOverlay");
  if (helpOverlay) helpOverlay.classList.remove("is-open");
  setPaused(false, "");
}

function backToMenuFromHelp(){
  const helpOverlay = document.getElementById("vinvHelpOverlay");
  const menuOverlay = document.getElementById("vinvGameMenuOverlay");

  if (helpOverlay) helpOverlay.classList.remove("is-open");
  if (menuOverlay) menuOverlay.classList.add("is-open");

  setPaused(true, "menu");
}

  function wireGameInput(){
    if (!resizeHandlerBound){
      window.addEventListener("resize", recalcField);
      resizeHandlerBound = true;
    }

    document.querySelectorAll(".vinv-lane-btn").forEach((btn) => {
      btn.onclick = () => handleColorPress(btn.dataset.lane);
    });

    window.onkeydown = (e) => {
      if (!state.running || state.paused) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") handleColorPress("left");
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") handleColorPress("center");
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") handleColorPress("right");
    };
  }

  function recalcField(){
    const field = document.getElementById("vinvField");
    const controls = document.getElementById("vinvControls");
    if (!field) return;

    const fieldRect = field.getBoundingClientRect();
    state.fieldWidth = fieldRect.width;
    state.fieldHeight = fieldRect.height;
    state.scale = clamp(fieldRect.width / 390, 0.88, 1.45);

    if (controls){
      const controlsRect = controls.getBoundingClientRect();
      state.controlsTopY = Math.max(0, controlsRect.top - fieldRect.top);
      state.bottomZoneY = Math.max(110, state.controlsTopY - 8);
    } else {
      state.controlsTopY = Math.max(180, state.fieldHeight - 90);
      state.bottomZoneY = Math.max(110, state.fieldHeight - 98);
    }

    state.roundSpeed = getRoundSpeed();
    renderStaticField();
  }

  function renderStaticField(){
    const lanesEl = document.getElementById("vinvLanes");
    const bottomEl = document.getElementById("vinvBottom");
    if (!lanesEl || !bottomEl) return;

    lanesEl.innerHTML = LANE_KEYS.map((lane, index) => `
      <div class="vinv-lane" style="left:${index * 33.3333}%">
        <div class="vinv-lane-guide"></div>
      </div>
    `).join("");

    bottomEl.innerHTML = "";
  }

  function renderHud(){
    const modePill = document.getElementById("vinvModePill");
    const streakPill = document.getElementById("vinvStreakPill");

    if (modePill){
      modePill.textContent = "☰";
      modePill.setAttribute("aria-label", "Game Menu");
      modePill.onclick = () => {
        openGameMenu();
      };
    }

    if (streakPill) streakPill.textContent = `🔥 ${state.streak}`;
    renderBuildArea();
    renderButtons();
  }

  function renderBuildArea(){
    const buildText = document.getElementById("vinvBuildText");
    const build = document.getElementById("vinvBuild");
    if (!buildText || !build) return;

    build.classList.toggle("is-shake", state.buildShakeUntil > performance.now());
    buildText.className = `vinv-build-text ${state.buildSizeClass}`;
    buildText.innerHTML = state.queue.map((token, index) => {
      const phaseClass = getBuildTokenPhase(index);
      const builtClass = index < state.builtCount ? "is-built" : "";
      return `<span class="vinv-build-token ${phaseClass} ${builtClass}">${escapeHtml(token)}</span>`;
    }).join(" ");
  }

function getBuildTokenPhase(index){
  if (index < verseWords.length) return "is-verse";
  if (index === verseWords.length) return "is-book";
  return "is-reference";
}

function getBuildLengthScore(verseText, book, reference){
  return String(verseText || "").length
    + String(book || "").length
    + String(reference || "").length;
}

function getBuildSizeClass(verseText, book, reference){
  const score = getBuildLengthScore(verseText, book, reference);
  if (score >= 136) return "is-small";
  if (score >= 106) return "is-medium";
  return "is-normal";
}

function renderButtons(){
    const buttons = document.querySelectorAll(".vinv-lane-btn");
    buttons.forEach((btn) => {
      const lane = btn.dataset.lane;
      const fixedColor = buttonLaneToColor(lane);
      btn.dataset.color = fixedColor.key;
      btn.textContent = "";
      btn.setAttribute("aria-label", fixedColor.key.toUpperCase());
      const shouldDim = state.activeLane && state.activeLane !== lane;
      btn.classList.toggle("is-dim", !!shouldDim);
      btn.disabled = state.buttonsLocked || (!state.bonusMode && !hasVisibleEntityForColor(fixedColor.key));
    });
  }

  function spawnRound(){
    if (state.builtCount >= state.queue.length){
      startBonusRound();
      return;
    }

    state.roundIndex += 1;
    state.roundStatus = "falling";
    state.buttonsLocked = false;
    state.activeLane = null;
    state.wrongGuessesThisRound = 0;
    state.rocket = null;
    state.trails = [];
    state.effects = state.effects.filter(effect => effect.kind === "fireworkParticle");
    state.scheduledActions = [];
    state.roundSpeed = getRoundSpeed();

    const correctLabel = state.queue[state.builtCount];
    state.phase = getCurrentPhase();
    const decoys = getDecoysForPhase(state.phase, correctLabel, 2);
    const labels = shuffle([correctLabel, ...decoys]);
    const colors = shuffle([...LANE_COLORS]);

    state.entities = LANE_KEYS.map((lane, index) => {
      const label = labels[index];
      return {
        id:`entity-${state.roundIndex}-${lane}`,
        lane,
        label,
        correct:label === correctLabel,
        color:colors[index],
        x:getLaneCenterX(lane),
        y:-22 - index * 18,
        visible:true,
        status:"falling",
        motionPhase: Math.random() * Math.PI * 2
      };
    });
    renderHud();
    renderDynamic();
  }

  function handleColorPress(buttonLane){
    if (!state.running) return;
    if (state.buttonsLocked) return;

    if (state.bonusMode){
      if (state.bonusShotsLeft <= 0) return;
      launchBonusRocket(buttonLane);
      return;
    }

    const buttonColor = buttonLaneToColor(buttonLane);
    const target = state.entities.find(item => item.visible && item.color.key === buttonColor.key);
    if (!target) return;

    state.buttonsLocked = true;
    state.activeLane = buttonLane;

    const rocketStartX = getLaneCenterX(buttonLane);
    const rocketStartY = state.controlsTopY - 16;
    const rocketSpeed = Math.max(420, state.fieldHeight * 1.62);
    const targetPoint = getEntityHitPoint(target);
    const intercept = computeIntercept(
      rocketStartX,
      rocketStartY,
      targetPoint.x,
      targetPoint.y,
      0,
      state.roundSpeed,
      rocketSpeed
    );
    const dx = intercept.x - rocketStartX;
    const dy = intercept.y - rocketStartY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const flightTime = Math.max(0.08, distance / rocketSpeed);
    const vx = dx / flightTime;
    const vy = dy / flightTime;
    const angleDeg = Math.atan2(vy, vx) * 180 / Math.PI + 90;

    state.rocket = {
      lane: buttonLane,
      x: rocketStartX,
      y: rocketStartY,
      vx,
      vy,
      speed: rocketSpeed,
      targetId: target.id,
      targetColorKey: target.color.key,
      resolved:false,
      white:false,
      age:0,
      maxAge: flightTime + 0.12,
      hitRadius: Math.max(28, 22 * state.scale),
      angleDeg
    };
    renderButtons();
  }

  function resolveRocketHit(){
    if (!state.rocket || state.rocket.resolved) return;
    state.rocket.resolved = true;
    const target = state.entities.find(item => item.id === state.rocket.targetId);
    if (!target || !target.visible){
      unlockAfterDelay(260);
      return;
    }

    if (target.correct) handleCorrectHit(target);
    else handleWrongHit(target);
  }

  function handleWrongHit(target){
    state.streak = 0;
    state.mistakes += 1;
    state.wrongGuessesThisRound += 1;
    state.flashBadUntil = performance.now() + 260;
    state.buildShakeUntil = performance.now() + 280;
    state.overlayMessage = state.wrongGuessesThisRound >= 2 ? "Too many wrong guesses!" : "Wrong color!";
    state.overlayUntil = performance.now() + 420;
    target.visible = false;
    const targetPoint = getEntityHitPoint(target);
    addEffect(makeSmokePuffEffect(targetPoint.x, target.y + 28));
    renderHud();
    renderDynamic();

    if (state.wrongGuessesThisRound >= 2){
      state.buttonsLocked = true;
      state.activeLane = null;
      scheduleAction(260, () => {
        state.entities.forEach(item => {
          if (item.visible) item.status = "fade";
        });
        renderDynamic();
      });
      scheduleAction(560, () => {
        state.entities.forEach(item => { item.visible = false; });
        spawnRound();
      });
    } else {
      unlockAfterDelay(320);
    }
  }

  function handleCorrectHit(target){
    state.streak += 1;
    state.buttonsLocked = true;
    renderDynamic();

    scheduleAction(120, () => {
      const targetPoint = getEntityHitPoint(target);
      addEffect(makeCorrectHitEffect(targetPoint.x, target.y + 22, target.color.hex, state.streak));
      target.visible = false;

      state.entities.forEach(item => {
        if (item.id !== target.id && item.visible){
          const itemPoint = getEntityHitPoint(item);
          item.visible = false;
          addEffect(makeSmokePuffEffect(itemPoint.x, item.y + 28));
        }
      });

      state.builtCount += 1;
      renderHud();
      renderDynamic();
    });

    scheduleAction(620, async () => {
      if (state.builtCount >= state.queue.length) await startBonusRound();
      else spawnRound();
    });
  }

  function handleBottomMiss(target){
    state.streak = 0;
    state.mistakes += 1;
    state.buttonsLocked = true;
    state.activeLane = null;
    state.overlayMessage = "Abducted!";
    state.overlayUntil = performance.now() + 720;
    state.flashBadUntil = performance.now() + 260;
    state.buildShakeUntil = performance.now() + 280;

    state.entities.forEach(item => {
      item.visible = false;
    });

    const targetPoint = getEntityHitPoint(target);
    addEffect(makeAbductionEffect(targetPoint.x, state.bottomZoneY - 12, target.color));
    renderHud();
    renderDynamic();

    scheduleAction(1820, () => {
      spawnRound();
    });
  }

  function unlockAfterDelay(ms){
    scheduleAction(ms, () => {
      state.buttonsLocked = false;
      state.activeLane = null;
      state.rocket = null;
      renderButtons();
    });
  }

  async function startBonusRound(){
    if (state.bonusMode) return;
    state.bonusMode = true;
    state.buttonsLocked = false;
    state.activeLane = null;
    state.entities = [];
    state.rocket = null;
    state.trails = [];
    state.overlayMessage = "Bonus Fireworks!";
    state.overlayUntil = performance.now() + 1000;
    state.bonusShotsLeft = getBonusShots();
    state.bonusAutoTimer = 0.18;
    state.bonusFinished = false;
    renderHud();
    renderDynamic();

    if (!completionMarked){
      completionMarked = true;
      await window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode
      });
    }
  }

  function launchBonusRocket(buttonLane){
    state.bonusShotsLeft = Math.max(0, state.bonusShotsLeft - 1);
    const x = getLaneCenterX(buttonLane);
    state.bonusFireworks.push({
      id:`fw-${Date.now()}-${Math.random()}`,
      x,
      y:state.controlsTopY - 12,
      targetY:randBetween(state.fieldHeight * 0.16, state.fieldHeight * 0.48),
      speed:Math.max(320, state.fieldHeight * 1.4),
      exploded:false
    });
    renderHud();
  }

  function finishBonusRound(){
    state.bonusFinished = true;
    state.buttonsLocked = true;
    state.activeLane = null;
    state.overlayMessage = "Great job!";
    state.overlayUntil = performance.now() + 1500;
    renderButtons();
    setTimeout(() => renderVictory(), 900);
  }

  function renderVictory(){
    stopLoop();
    app.innerHTML = `
      <div class="vinv-mode-shell">
        <div class="vinv-mode-stage">
          <div class="vinv-mode-top">
            <div style="font-size:74px;line-height:1;">🎆</div>
            <div class="vinv-title">Verse Invaders Complete!</div>
            <div class="vinv-subtitle">You finished the verse, book, and reference in one run.</div>
            <div class="vinv-mode-card">
              <div class="vinv-mode-actions">
                <button class="vm-btn" id="playAgainBtn">Play Again</button>
                <button class="vm-btn" id="homeDoneBtn">Done</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>
    `;
    document.getElementById("playAgainBtn").onclick = renderModeSelect;
    document.getElementById("homeDoneBtn").onclick = () => window.VerseGameBridge.exitGame();
    wireCommonNav();
  }

  function loop(ts){
    if (!state.running && !state.bonusMode) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.032, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    if (!state.paused){
      updateGame(dt, ts);
    }

    renderDynamic();
    state.rafId = requestAnimationFrame(loop);
  }

  function updateGame(dt, ts){
    state.effects = state.effects.filter(effect => effect.until > ts);
    state.trails = state.trails.filter(trail => trail.until > ts);
    processScheduledActions(ts);

    if (state.buildShakeUntil && ts > state.buildShakeUntil) renderHud();

    if (!state.bonusMode){
      const speed = state.roundSpeed;
      for (const entity of state.entities){
        if (!entity.visible || entity.status !== "falling") continue;
        entity.y += speed * dt;
        if (entity.correct && entity.y >= state.bottomZoneY - 48){
          handleBottomMiss(entity);
          break;
        }
      }

      if (state.rocket){
        state.rocket.age += dt;
        state.rocket.x += state.rocket.vx * dt;
        state.rocket.y += state.rocket.vy * dt;
        addTrail(state.rocket.x, state.rocket.y + 18, state.rocket.white);

        const target = state.entities.find(item => item.id === state.rocket.targetId && item.visible);
        if (!target){
          state.rocket = null;
          unlockAfterDelay(220);
        } else {
        const targetPoint = getEntityHitPoint(target, ts);
        const dx = targetPoint.x - state.rocket.x;
        const dy = targetPoint.y - state.rocket.y;
          if (Math.hypot(dx, dy) <= state.rocket.hitRadius || state.rocket.age >= state.rocket.maxAge){
            resolveRocketHit();
            state.rocket = null;
          }
        }
      }
    } else {
      if (state.bonusShotsLeft > 0){
        state.bonusAutoTimer -= dt;
        if (state.bonusAutoTimer <= 0){
          state.bonusAutoTimer = randBetween(0.26, 0.5);
          launchBonusRocket(randomFrom(LANE_KEYS));
        }
      }

      for (const firework of state.bonusFireworks){
        if (firework.exploded) continue;
        firework.y -= firework.speed * dt;
        addTrail(firework.x, firework.y + 18, true);
        if (firework.y <= firework.targetY){
          firework.exploded = true;
          addEffect(makeBonusFireworkEffect(firework.x, firework.y));
        }
      }
      state.bonusFireworks = state.bonusFireworks.filter(item => !item.exploded);

      if (!state.bonusFinished && state.bonusShotsLeft <= 0 && state.bonusFireworks.length === 0 && !state.effects.some(item => item.kind === "fireworkParticle")){
        finishBonusRound();
      }
    }
  }

  function renderDynamic(){
    const entitiesEl = document.getElementById("vinvEntities");
    const rocketsEl = document.getElementById("vinvRockets");
    const effectsEl = document.getElementById("vinvEffects");
    const bonusEl = document.getElementById("vinvBonus");
    const overlayEl = document.getElementById("vinvOverlay");
    const field = document.getElementById("vinvField");
    if (!entitiesEl || !rocketsEl || !effectsEl || !overlayEl || !field || !bonusEl) return;

    const now = performance.now();
    field.classList.toggle("is-flash-bad", state.flashBadUntil > now);

    entitiesEl.innerHTML = state.entities.map((entity) => {
      const hidden = entity.visible ? "" : "opacity:0;";
      const className = entity.status === "fade"
        ? "is-fade"
        : entity.status === "correct"
          ? "is-correct-pause"
          : "";

      const motion = getEntityMotionState(entity, now);

      return `
        <div
          class="vinv-entity ${className}"
          style="
            left:${entity.x}px;
            top:${entity.y}px;
            ${hidden}
            transform:translate(calc(-50% + ${motion.swayX.toFixed(1)}px), 0)
              rotate(${motion.rotateDeg.toFixed(2)}deg)
              skewX(${motion.skewXDeg.toFixed(2)}deg)
              scale(${motion.scaleX.toFixed(3)}, ${motion.scaleY.toFixed(3)});
          "
        >
          <div class="vinv-alien">
            <img
              class="vinv-alien-img"
              src="${entity.color.alienImg}"
              alt="${entity.color.alienAlt}"
              draggable="false"
            />
          </div>
          <div class="vinv-word" style="color:${entity.color.hex}">${escapeHtml(entity.label)}</div>
        </div>
      `;
    }).join("");

    rocketsEl.innerHTML = `
      ${state.rocket ? `<div class="vinv-rocket" style="left:${state.rocket.x}px; top:${state.rocket.y}px; transform:translate(-50%,-50%) rotate(${state.rocket.angleDeg.toFixed(1)}deg);">🚀</div>` : ""}
      ${state.trails.map(trail => `<div class="vinv-trail ${trail.white ? "white" : ""}" style="left:${trail.x}px; top:${trail.y}px; opacity:${trail.opacity}">${trail.icon}</div>`).join("")}
      ${state.bonusFireworks.map(fw => `<div class="vinv-rocket white" style="left:${fw.x}px; top:${fw.y}px;">⚪</div>`).join("")}
    `;

    effectsEl.innerHTML = state.effects.map((effect) => renderEffect(effect, now)).join("");

    bonusEl.innerHTML = "";
    overlayEl.innerHTML = state.overlayUntil > now && state.overlayMessage
      ? `<div class="vinv-overlay-pill">${escapeHtml(state.overlayMessage)}</div>`
      : "";

    renderButtons();
  }

  function getCurrentPhase(){
    if (state.builtCount < verseWords.length) return "words";
    if (state.builtCount === verseWords.length) return "book";
    return "reference";
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = new Set();

    if (phase === "words"){
      const versePool = verseWords.map(normalizeWord);
      for (const word of shuffle(FUN_DECOYS)){
        if (out.size >= count) break;
        if (!versePool.includes(normalizeWord(word)) && normalizeWord(word) !== normalizeWord(correctLabel)) out.add(word);
      }
    }

    if (phase === "book"){
      for (const book of shuffle(BOOKS)){
        if (out.size >= count) break;
        if (book !== correctLabel) out.add(book);
      }
    }

    if (phase === "reference"){
      const match = String(correctLabel || "").match(/^(\d+):(\d+)(?:-(\d+))?$/);
      const chapter = match ? Number(match[1]) : 1;
      const verse = match ? Number(match[2]) : 1;
      let tries = 0;
      while (out.size < count && tries < 50){
        tries += 1;
        const c = Math.max(1, chapter + Math.floor(Math.random() * 5) - 2);
        const v = Math.max(1, verse + Math.floor(Math.random() * 9) - 4);
        const label = `${c}:${v}`;
        if (label !== correctLabel) out.add(label);
      }
    }

    return Array.from(out).slice(0, count);
  }

  function getRoundSpeed(){
    const usableDistance = Math.max(180, state.bottomZoneY + 28);
    const cfg = state.modeTiming[selectedMode] || state.modeTiming.easy;
    const roundSeconds = clamp(cfg.start + Math.max(0, state.roundIndex - 1) * cfg.step, 2.2, 5.4);
    return usableDistance / roundSeconds;
  }

  function getBonusShots(){
    const max = 12;
    const penalty = Math.min(8, state.mistakes);
    return Math.max(4, max - penalty);
  }

function getLaneCenterX(lane){
  const index = LANE_KEYS.indexOf(lane);
  return state.fieldWidth * ((index + 0.5) / 3);
}

function getEntityMotionState(entity, now = performance.now()){
  const phase = entity.motionPhase || 0;
  const sway = Math.sin(now * 0.0032 + phase) * 18;
  const pulse = Math.sin(now * 0.0044 + phase * 0.7);

  return {
    swayX: sway,
    renderX: entity.x + sway,
    rotateDeg: Math.sin(now * 0.0032 + phase) * 4.5,
    skewXDeg: Math.sin(now * 0.0032 + phase) * 3.5,
    scaleX: 1 + pulse * 0.035,
    scaleY: 1 - pulse * 0.035
  };
}

function getEntityHitPoint(entity, now = performance.now()){
  const motion = getEntityMotionState(entity, now);
  return {
    x: motion.renderX,
    y: entity.y + 40
  };
}

function laneLabel(lane){
    if (lane === "left") return "LEFT";
    if (lane === "center") return "CENTER";
    return "RIGHT";
  }

  function buttonLaneToColor(lane){
    return BUTTON_COLOR_ORDER[lane] || BUTTON_COLOR_ORDER.left;
  }

  function hasVisibleEntityForColor(colorKey){
    return state.entities.some(item => item.visible && item.color.key === colorKey);
  }

  function computeIntercept(sx, sy, tx, ty, tvx, tvy, projectileSpeed){
    const rx = tx - sx;
    const ry = ty - sy;
    const a = (tvx * tvx + tvy * tvy) - (projectileSpeed * projectileSpeed);
    const b = 2 * (rx * tvx + ry * tvy);
    const c = (rx * rx + ry * ry);

    let t = null;
    if (Math.abs(a) < 0.0001){
      if (Math.abs(b) > 0.0001) t = -c / b;
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0){
        const root = Math.sqrt(disc);
        const t1 = (-b - root) / (2 * a);
        const t2 = (-b + root) / (2 * a);
        const candidates = [t1, t2].filter(v => Number.isFinite(v) && v > 0);
        if (candidates.length) t = Math.min(...candidates);
      }
    }

    if (!Number.isFinite(t) || t <= 0) t = Math.max(0.12, Math.hypot(rx, ry) / projectileSpeed);
    t = clamp(t, 0.12, 1.35);

    return { x: tx + tvx * t, y: ty + tvy * t, t };
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();
    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch){
      return { book:titleCaseBookFromSlug(idRangeMatch[1]), reference:`${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}` };
    }

    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch){
      return { book:titleCaseBookFromSlug(idMatch[1]), reference:`${idMatch[2]}:${idMatch[3]}` };
    }

    let raw = String(ref || "").trim();
    const trans = String(translation || "").trim();
    if (trans){
      raw = raw.replace(new RegExp(`\\s*\\(?${trans.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\)?\\s*$`, "i"), "").trim();
    }

    const match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
    if (match) return { book:match[1].trim(), reference:match[2].trim() };

    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0){
      return { book:raw.slice(0, lastSpace).trim(), reference:raw.slice(lastSpace + 1).trim() };
    }

    return { book:raw, reference:"" };
  }

  function titleCaseBookFromSlug(slug){
    const small = new Set(["of","the"]);
    return String(slug || "")
      .split("_")
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        if (index > 0 && small.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
  }

  function normalizeWord(word){
    return String(word || "").toLowerCase().replace(/[^a-z0-9']/g, "");
  }

  function addTrail(x, y, white){
    state.trails.push({
      x,
      y,
      icon: white ? "·" : "✨",
      opacity: white ? 0.85 : 0.95,
      white:!!white,
      until: performance.now() + 180
    });
    if (state.trails.length > 24) state.trails.shift();
  }

  function addEffect(effect){
    state.effects.push(effect);
    if (state.effects.length > 30) state.effects.shift();
  }

  function makeSmokePuffEffect(x, y){
    const born = performance.now();
    const particles = Array.from({ length: 7 }, (_, i) => ({
      angle: (Math.PI * 2 * i / 7) + randBetween(-0.24, 0.24),
      speed: randBetween(6, 18),
      size: randBetween(12, 24),
      color: Math.random() < 0.5 ? "rgba(255,255,255,0.72)" : "rgba(210,218,226,0.68)",
      alpha: randBetween(0.62, 0.92),
      gravity: randBetween(-1, 2),
      drift: randBetween(-4, 4),
      style: "smoke",
      spin: randBetween(-40, 40)
    }));
    return {
      kind:"particle",
      group:"smoke",
      preset:"smokePuff",
      x,
      y,
      born,
      life:420,
      until: born + 420,
      particles,
      ring:0,
      center:0
    };
  }

  function makeCorrectHitEffect(x, y, baseColor, streak){
    return makeParticleEffect(randomFrom(CORRECT_EFFECT_POOL), x, y, baseColor, streak, "hit");
  }

  function makeBonusFireworkEffect(x, y){
    const color = randomFrom([LANE_COLORS[0].hex, LANE_COLORS[1].hex, LANE_COLORS[2].hex, "#f28fff", "#ffffff"]);
    return makeParticleEffect(randomFrom(BONUS_FIREWORK_POOL), x, y, color, 5, "fireworkParticle");
  }

  function makeParticleEffect(preset, x, y, baseColor, streak, group){
    const born = performance.now();
    const strong = streak >= 4;
    const configMap = {
      alienPop: { life:620, count: strong ? 16 : 12, speedMin:88, speedMax:162, sizeMin:4, sizeMax:9, gravity:6, ring:0, center:0, style:"dot", shell:false, flash:false, cross:false },
      starburst: { life:680, count: strong ? 15 : 11, speedMin:96, speedMax:176, sizeMin:5, sizeMax:10, gravity:4, ring:0, center:0, style:"star", shell:false, flash:false, cross:false },
      chrysanthemum: { life:760, count: strong ? 20 : 16, speedMin:82, speedMax:154, sizeMin:4, sizeMax:8, gravity:3, ring:0, center:0, style:"petal", shell:false, flash:false, cross:false },
      novaBurst: { life:720, count: strong ? 18 : 14, speedMin:108, speedMax:186, sizeMin:4, sizeMax:10, gravity:5, ring:0, center:0, style:"shard", shell:false, flash:false, cross:false },

      flashRing: { life:900, count:18, speedMin:92, speedMax:154, sizeMin:5, sizeMax:10, gravity:8, ring:0, center:0, style:"dot", shell:false, flash:false, cross:false },
      classicFirework: { life:980, count:24, speedMin:102, speedMax:188, sizeMin:4, sizeMax:9, gravity:10, ring:0, center:0, style:"petal", shell:false, flash:false, cross:false },
      confettiBloom: { life:980, count:22, speedMin:84, speedMax:148, sizeMin:5, sizeMax:10, gravity:14, ring:0, center:0, style:"confetti", shell:false, flash:false, cross:false },
      plasmaBurst: { life:920, count:20, speedMin:112, speedMax:198, sizeMin:5, sizeMax:11, gravity:6, ring:0, center:0, style:"plasma", shell:false, flash:false, cross:false },
      cosmicCrackle: { life:1040, count:26, speedMin:74, speedMax:176, sizeMin:3, sizeMax:8, gravity:12, ring:0, center:0, style:"crackle", shell:false, flash:false, cross:false }
    };
    const cfg = configMap[preset] || configMap.alienPop;
    const palette = buildPalette(baseColor, preset);
    const particles = [];
    for (let i = 0; i < cfg.count; i++){
      particles.push({
        angle: (Math.PI * 2 * i / cfg.count) + randBetween(-0.18, 0.18),
        speed: randBetween(cfg.speedMin, cfg.speedMax),
        size: randBetween(cfg.sizeMin, cfg.sizeMax),
        color: randomFrom(palette),
        alpha: randBetween(0.82, 1),
        gravity: cfg.gravity,
        drift: randBetween(-8, 8),
        style: cfg.style,
        spin: randBetween(-220, 220)
      });
      if (preset === "cosmicCrackle" && i % 5 === 0){
        particles.push({
          angle: (Math.PI * 2 * i / cfg.count) + randBetween(-0.12, 0.12),
          speed: randBetween(cfg.speedMax * 0.65, cfg.speedMax * 1.05),
          size: randBetween(2, 4),
          color: "#ffffff",
          alpha: 1,
          gravity: cfg.gravity + 4,
          drift: randBetween(-10, 10),
          style: "spark",
          spin: randBetween(-280, 280)
        });
      }
    }
    return {
      kind:"particle",
      group,
      preset,
      x,
      y,
      born,
      life: cfg.life,
      until: born + cfg.life,
      particles,
      ring: cfg.ring,
      center: cfg.center,
      flash: cfg.flash,
      shell: cfg.shell,
      cross: cfg.cross
    };
  }

function makeAbductionEffect(x, y, color){
  const born = performance.now();
  return {
    kind:"abduction",
    group:"abduction",
    x,
    y,
    born,
    life:1700,
    until: born + 1700,
    colorHex: color.hex,
    alienImg: color.alienImg,
    alienAlt: color.alienAlt,
    abducteeImg: randomFrom(ABDUCTEE_IMAGES)
  };
}

  function buildPalette(baseColor, preset){
    if (preset === "confettiBloom") return ["#ff5a51", "#ffc751", "#40b9c5", "#f28fff", "#ffffff", "#a7cb6f"];
    if (preset === "plasmaBurst") return [baseColor, lightenColor(baseColor, 0.3), "#ffffff", "#d596ff", "#77f0ff"];
    if (preset === "cosmicCrackle") return [baseColor, "#ffffff", "#ffd96c", "#8af2ff", "#ff9fe7"];
    return [baseColor, lightenColor(baseColor, 0.2), lightenColor(baseColor, 0.36), "#ffffff", "#ffe082"];
  }

  function renderEffect(effect, now){
    if (effect.kind === "abduction"){
      const progress = clamp((now - effect.born) / effect.life, 0, 1);
      const hold = 0.18;
      const travel = progress <= hold ? 0 : (progress - hold) / (1 - hold);

      const liftDistance = Math.max(state.fieldHeight + 140, state.bottomZoneY + 260);
      const liftY = -travel * liftDistance;

      const beamOpacity = progress < 0.72
        ? 0.82
        : Math.max(0, 0.82 - ((progress - 0.72) / 0.28) * 0.82);

      const wholeOpacity = progress < 0.92
        ? 1
        : Math.max(0, 1 - ((progress - 0.92) / 0.08));

      return `
        <div class="vinv-effect-wrap vinv-abduct-wrap" style="left:${effect.x}px; top:${effect.y}px; transform:translate(-50%,-50%) translateY(${liftY.toFixed(1)}px); opacity:${wholeOpacity.toFixed(3)};">
          <div class="vinv-beam vinv-beam-abduct" style="opacity:${beamOpacity.toFixed(3)}"></div>
          <div class="vinv-abduct-stack">
            <div class="vinv-alien">
              <img
                class="vinv-alien-img"
                src="${effect.alienImg}"
                alt="${effect.alienAlt}"
                draggable="false"
              />
            </div>
            <div class="vinv-word" style="color:${effect.colorHex}; visibility:hidden; height:0; margin:0; padding:0;"></div>
            <div class="vinv-abduct-passenger">
              <img
                class="vinv-abductee-img"
                src="${effect.abducteeImg}"
                alt="Abductee"
                draggable="false"
              />
            </div>
          </div>
        </div>
      `;
    }

    if (effect.kind !== "particle") return "";

    const progress = clamp((now - effect.born) / effect.life, 0, 1);
    const particleHtml = effect.particles.map((particle) => {
      const dx = Math.cos(particle.angle) * particle.speed * progress + particle.drift * progress;
      const dy = Math.sin(particle.angle) * particle.speed * progress + (particle.gravity || 0) * progress * progress * 40;
      const opacity = clamp((particle.alpha || 1) * (1 - Math.pow(progress, effect.preset === "smokePuff" ? 1.05 : 1.55)), 0, 1);
      const scale = effect.preset === "smokePuff" ? (0.82 + progress * 0.62) : (0.72 + progress * 0.62);
      const rotation = (particle.spin || 0) * progress;
      return `<div class="vinv-particle is-${particle.style}" style="transform:translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scale(${scale.toFixed(2)});width:${particle.size.toFixed(1)}px;height:${particle.size.toFixed(1)}px;background:${particle.color};opacity:${opacity.toFixed(3)};"></div>`;
    }).join("");

    const ringSize = 18 + progress * 84 * (effect.ring || 0);
    const centerSize = 18 + (effect.center || 0) * 18 + progress * 10;
    const ring = effect.ring ? `<div class="vinv-effect-ring" style="width:${ringSize.toFixed(1)}px;height:${ringSize.toFixed(1)}px;opacity:${Math.max(0, 0.82 - progress * 0.95).toFixed(3)};border-width:${Math.max(2, 4 - progress * 2).toFixed(1)}px;"></div>` : "";
    const center = effect.center ? `<div class="vinv-effect-center" style="width:${centerSize.toFixed(1)}px;height:${centerSize.toFixed(1)}px;opacity:${Math.max(0, 0.95 - progress * 1.2).toFixed(3)};"></div>` : "";
    const flash = effect.flash ? `<div class="vinv-effect-flash" style="width:${(74 + progress * 50).toFixed(1)}px;height:${(74 + progress * 50).toFixed(1)}px;opacity:${Math.max(0, 0.28 - progress * 0.32).toFixed(3)};"></div>` : "";
    const shell = effect.shell ? `<div class="vinv-effect-shell" style="width:${(42 + progress * 36).toFixed(1)}px;height:${(42 + progress * 36).toFixed(1)}px;opacity:${Math.max(0, 0.3 - progress * 0.36).toFixed(3)};"></div>` : "";
    const cross = effect.cross ? `<div class="vinv-effect-cross" style="opacity:${Math.max(0, 0.54 - progress * 0.6).toFixed(3)};"></div>` : "";

    return `<div class="vinv-effect-wrap" style="left:${effect.x}px; top:${effect.y}px;">${flash}${shell}${ring}${center}${cross}${particleHtml}</div>`;
  }

  function lightenColor(hex, amount){
    const clean = String(hex || "#ffffff").replace("#", "");
    if (clean.length !== 6) return "#ffffff";
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
  }

  function scheduleAction(delayMs, fn){
    state.scheduledActions.push({ at: performance.now() + delayMs, run: fn });
  }

  function processScheduledActions(ts){
    if (!state.scheduledActions.length) return;
    const ready = [];
    const later = [];
    for (const action of state.scheduledActions){
      if (ts >= action.at) ready.push(action);
      else later.push(action);
    }
    state.scheduledActions = later;
    for (const action of ready) action.run();
  }

  function stopLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    state.running = false;
  }

  function startLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function randomFrom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function randBetween(min, max){ return min + Math.random() * (max - min); }
  function capitalize(str){ return String(str).charAt(0).toUpperCase() + String(str).slice(1); }
  function shuffle(arr){
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function escapeHtml(value){
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
