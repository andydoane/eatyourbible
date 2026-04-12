(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_invaders";
  const LANE_KEYS = ["left", "center", "right"];
  const LANE_COLORS = [
    { key: "red", hex: "#ff5a51", alien: "👾" },
    { key: "yellow", hex: "#ffc751", alien: "👽" },
    { key: "blue", hex: "#40b9c5", alien: "🤖" }
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
  const FUN_DECOYS = [
    "taco","banana","penguin","cupcake","pickle","rocket","waffle","balloon","otter","pretzel",
    "pancake","bubble","marshmallow","treasure","robot","firetruck","yo-yo","snowman","blueberry","noodle",
    "pizza","donut","shark","lemon","grape","berry","sock","boot","kite","plane","cat","dog",
    "pig","cow","bug","ant","frog","duck","bear","bat","bird","fish","jam","pie","cake","egg",
    "star","ball","hop","skip","jump","run","spin","clap","sing","swim","kick","dig","nap",
    "hug","tug","push","pull","snap","wave","wink","grin","zoom","zip","pop","bop","glimmer","snorf",
    "plinko","dazzle","whizzle","bloop","tinker","wobble","zapper","muffin","noony","pibble","crumble"
  ];
  const EXPLOSIONS = ["🎆","✨","💥","🎇","✹"];
  const PUFFS = ["💨","☁️","🫧"];

  let selectedMode = null;
  let muted = false;
  let completionMarked = false;
  let resizeHandlerBound = false;

  const state = {
    running:false,
    rafId:0,
    lastTs:0,
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
      easy:{ start:4.9, step:0 },
      medium:{ start:4.7, step:-0.15 },
      hard:{ start:4.0, step:-0.16 }
    }
  };

  const parsedRef = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
  const verseWords = tokenizeVerse(ctx.verseText);

  renderConstructionScreen();

  function renderConstructionScreen(){
    stopLoop();
    app.innerHTML = `
      <div class="vinv-mode-shell">
        <div class="vinv-mode-stage">
          <div class="vinv-mode-top">
            <div class="vinv-title">🚧 Verse Invaders</div>
            <div class="vinv-subtitle">UNDER CONSTRUCTION: This game might be buggy!</div>
            <div class="vinv-mode-card">
              <div class="vinv-mode-actions">
                <button class="vm-btn" id="constructionOkBtn">OK</button>
              </div>
            </div>
          </div>
        </div>
        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
      </div>
    `;
    document.getElementById("constructionOkBtn").onclick = renderIntro;
    wireCommonNav();
  }

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="vinv-mode-shell">
        <div class="vinv-mode-stage">
          <div class="vinv-mode-top">
            <div style="font-size:70px;line-height:1;">👾🚀</div>
            <div class="vinv-title">Verse Invaders</div>
            <div class="vinv-subtitle">Blast the next correct word before the aliens reach the buttons. Then keep going right into the book and reference.</div>
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
    state.buttonsLocked = false;
    state.activeLane = null;
    state.flashBadUntil = 0;
    state.buildShakeUntil = 0;
    state.overlayMessage = "";
    state.overlayUntil = 0;
    state.queue = [...verseWords, parsedRef.book, parsedRef.reference].filter(Boolean);
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

        ${renderNav()}
        ${renderHelpOverlay(helpHtml())}
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

  function helpHtml(){
    return `Tap the button under the lane holding the next correct word.<br><br>
      A correct hit explodes and adds the word to the build area.<br><br>
      A wrong hit resets your streak. After two wrong hits in one round, that set clears and a new one begins.<br><br>
      If the correct word reaches the buttons, it abducts a human and the streak resets.`;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpBtn = document.getElementById("helpBtn");
    const overlay = document.getElementById("vinvHelpOverlay");
    const closeBtn = document.getElementById("vinvHelpCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (muteBtn) muteBtn.onclick = () => {
      muted = !muted;
      muteBtn.textContent = muted ? "🔇" : "🔊";
    };
    if (helpBtn) helpBtn.onclick = () => overlay.classList.add("is-open");
    if (closeBtn) closeBtn.onclick = () => overlay.classList.remove("is-open");
    if (overlay) overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove("is-open"); };
  }

  function wireGameInput(){
    if (!resizeHandlerBound){
      window.addEventListener("resize", recalcField);
      resizeHandlerBound = true;
    }

    document.querySelectorAll(".vinv-lane-btn").forEach((btn) => {
      btn.onclick = () => handleLanePress(btn.dataset.lane);
    });

    window.onkeydown = (e) => {
      if (!state.running) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") handleLanePress("left");
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") handleLanePress("center");
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") handleLanePress("right");
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
    if (modePill) modePill.textContent = capitalize(selectedMode);
    if (streakPill) streakPill.textContent = `🔥 ${state.streak}`;
    renderBuildArea();
    renderButtons();
  }

  function renderBuildArea(){
    const buildText = document.getElementById("vinvBuildText");
    const build = document.getElementById("vinvBuild");
    if (!buildText || !build) return;

    build.classList.toggle("is-shake", state.buildShakeUntil > performance.now());
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

  function renderButtons(){
    const buttons = document.querySelectorAll(".vinv-lane-btn");
    const round = state.entities;
    buttons.forEach((btn) => {
      const lane = btn.dataset.lane;
      const entity = round.find((item) => item.lane === lane && item.visible);
      const colorKey = entity?.color?.key || laneToDefaultColor(lane).key;
      btn.dataset.color = colorKey;
      btn.textContent = laneLabel(lane);
      const shouldDim = state.activeLane && state.activeLane !== lane;
      btn.classList.toggle("is-dim", !!shouldDim);
      btn.disabled = state.buttonsLocked || (!state.bonusMode && !entity);
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
    state.effects = state.effects.filter(effect => effect.kind === "firework");
    state.scheduledActions = [];
    state.roundSpeed = getRoundSpeed();

    const correctLabel = state.queue[state.builtCount];
    state.phase = getCurrentPhase();
    const decoys = getDecoysForPhase(state.phase, correctLabel, 2);
    const labels = shuffle([correctLabel, ...decoys]);
    const colors = shuffle([...LANE_COLORS]);

    state.entities = LANE_KEYS.map((lane, index) => {
      const label = labels[index];
      const isCorrect = label === correctLabel;
      return {
        id:`entity-${state.roundIndex}-${lane}`,
        lane,
        label,
        correct:isCorrect,
        color:colors[index],
        x:getLaneCenterX(lane),
        y:-22 - index * 18,
        visible:true,
        status:"falling"
      };
    });

    renderHud();
    renderDynamic();
  }

  function handleLanePress(lane){
    if (!state.running) return;
    if (state.buttonsLocked) return;

    if (state.bonusMode){
      if (state.bonusShotsLeft <= 0) return;
      launchBonusRocket(lane);
      return;
    }

    const target = state.entities.find(item => item.lane === lane && item.visible);
    if (!target) return;

    state.buttonsLocked = true;
    state.activeLane = lane;
    state.rocket = {
      lane,
      x:getLaneCenterX(lane),
      y:state.controlsTopY - 16,
      targetY:Math.max(56, target.y + 48),
      speed:Math.max(380, state.fieldHeight * 1.55),
      targetId:target.id,
      resolved:false,
      white:false
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

    if (target.correct){
      handleCorrectHit(target);
    } else {
      handleWrongHit(target);
    }
  }

  function handleWrongHit(target){
    state.streak = 0;
    state.mistakes += 1;
    state.wrongGuessesThisRound += 1;
    state.flashBadUntil = performance.now() + 260;
    state.buildShakeUntil = performance.now() + 280;
    state.overlayMessage = state.wrongGuessesThisRound >= 2 ? "Too many wrong guesses!" : "Wrong lane!";
    state.overlayUntil = performance.now() + 420;
    target.status = "wrong";
    addEffect(makeSmokePuffEffect(target.x, target.y + 28));
    renderHud();
    renderDynamic();

    scheduleAction(210, () => {
      target.visible = false;
      renderDynamic();
    });

    if (state.wrongGuessesThisRound >= 2){
      state.buttonsLocked = true;
      state.activeLane = null;
      scheduleAction(320, () => {
        state.entities.forEach(item => {
          if (item.visible){
            item.status = "fade";
          }
        });
        renderDynamic();
      });
      scheduleAction(620, () => {
        state.entities.forEach(item => { item.visible = false; });
        spawnRound();
      });
    } else {
      unlockAfterDelay(340);
    }
  }

  function handleCorrectHit(target){
    state.streak += 1;
    state.overlayMessage = state.streak >= 4 ? "Awesome!" : "Correct!";
    state.overlayUntil = performance.now() + 380;
    state.buttonsLocked = true;
    state.activeLane = target.lane;
    target.status = "correct";
    renderDynamic();

    scheduleAction(120, () => {
      addEffect(makeCorrectHitEffect(target.x, target.y + 22, target.color.hex, state.streak));
      target.visible = false;
      state.entities.forEach(item => {
        if (item.id !== target.id && item.visible){ item.status = "fade"; }
      });
      state.builtCount += 1;
      renderHud();
      renderDynamic();
    });

    scheduleAction(560, async () => {
      state.entities.forEach(item => { if (item.id !== target.id) item.visible = false; });
      if (state.builtCount >= state.queue.length){
        await startBonusRound();
      } else {
        spawnRound();
      }
    });
  }

  function handleBottomMiss(target){
    state.streak = 0;
    state.mistakes += 1;
    state.buttonsLocked = true;
    state.activeLane = null;
    state.overlayMessage = "Abducted!";
    state.overlayUntil = performance.now() + 620;
    state.flashBadUntil = performance.now() + 260;
    state.buildShakeUntil = performance.now() + 280;

    state.entities.forEach(item => {
      if (item.id !== target.id){
        item.visible = false;
        item.status = "fade";
      }
    });

    target.status = "abduct";
    target.abductHuman = true;
    addEffect({ kind:"beam", x:target.x, y:state.bottomZoneY - 58, until:performance.now() + 1180 });
    renderHud();
    renderDynamic();

    scheduleAction(1200, () => {
      target.visible = false;
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

  function launchBonusRocket(lane){
    state.bonusShotsLeft = Math.max(0, state.bonusShotsLeft - 1);
    const x = getLaneCenterX(lane);
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

    updateGame(dt, ts);
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
        state.rocket.y -= state.rocket.speed * dt;
        addTrail(state.rocket.x, state.rocket.y + 18, state.rocket.white);
        if (state.rocket.y <= state.rocket.targetY){
          resolveRocketHit();
          state.rocket = null;
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

      if (!state.bonusFinished && state.bonusShotsLeft <= 0 && state.bonusFireworks.length === 0 && !state.effects.some(item => item.kind === "firework")){
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
      const className = entity.status === "wrong"
        ? "is-hit-wrong"
        : entity.status === "fade"
          ? "is-fade"
          : entity.status === "abduct"
            ? "is-abduct"
            : entity.status === "correct"
              ? "is-correct-pause"
              : "";

      return `
        <div class="vinv-entity ${className}" style="left:${entity.x}px; top:${entity.y}px; ${hidden}">
          <div class="vinv-alien" style="color:${entity.color.hex}">${entity.color.alien}</div>
          <div class="vinv-word" style="color:${entity.color.hex}">${escapeHtml(entity.label)}</div>
          ${entity.abductHuman ? `<div class="vinv-abduct-passenger">🧍</div>` : ""}
        </div>
      `;
    }).join("");

    rocketsEl.innerHTML = `
      ${state.rocket ? `<div class="vinv-rocket" style="left:${state.rocket.x}px; top:${state.rocket.y}px;">🚀</div>` : ""}
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

  function laneLabel(lane){
    if (lane === "left") return "LEFT";
    if (lane === "center") return "CENTER";
    return "RIGHT";
  }

  function laneToDefaultColor(lane){
    if (lane === "left") return LANE_COLORS[0];
    if (lane === "center") return LANE_COLORS[1];
    return LANE_COLORS[2];
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
    if (state.effects.length > 24) state.effects.shift();
  }

  function makeSmokePuffEffect(x, y){
    const born = performance.now();
    return {
      kind:"particle",
      preset:"smokePuff",
      x,
      y,
      born,
      life:420,
      until: born + 420,
      particles: Array.from({ length: 7 }, () => ({
        angle: randBetween(-2.7, -0.4),
        speed: randBetween(18, 52),
        size: randBetween(10, 22),
        color: Math.random() < 0.5 ? "rgba(255,255,255,0.72)" : "rgba(210,218,226,0.68)",
        alpha: randBetween(0.65, 0.95),
        gravity: -8,
        drift: randBetween(-14, 14),
        style: "dot",
        spin: randBetween(-80, 80)
      }))
    };
  }

  function makeCorrectHitEffect(x, y, baseColor, streak){
    return makeParticleEffect(randomFrom(CORRECT_EFFECT_POOL), x, y, baseColor, streak);
  }

  function makeBonusFireworkEffect(x, y){
    const color = randomFrom([LANE_COLORS[0].hex, LANE_COLORS[1].hex, LANE_COLORS[2].hex, "#f28fff", "#ffffff"]);
    return makeParticleEffect(randomFrom(BONUS_FIREWORK_POOL), x, y, color, 5);
  }

  function makeParticleEffect(preset, x, y, baseColor, streak){
    const born = performance.now();
    const strong = streak >= 4;
    const configMap = {
      alienPop: { life:620, count: strong ? 16 : 12, speedMin:82, speedMax:152, sizeMin:4, sizeMax:9, gravity:18, ring:0.68, center:1, style:"dot", shell:false, flash:false, cross:false },
      starburst: { life:680, count: strong ? 15 : 11, speedMin:90, speedMax:168, sizeMin:5, sizeMax:10, gravity:10, ring:0.46, center:0.95, style:"star", shell:false, flash:false, cross:false },
      chrysanthemum: { life:760, count: strong ? 20 : 16, speedMin:78, speedMax:148, sizeMin:4, sizeMax:8, gravity:8, ring:0.58, center:0.98, style:"petal", shell:true, flash:false, cross:false },
      novaBurst: { life:720, count: strong ? 18 : 14, speedMin:100, speedMax:178, sizeMin:4, sizeMax:10, gravity:14, ring:0.82, center:1.08, style:"shard", shell:false, flash:false, cross:true },
      flashRing: { life:900, count:18, speedMin:92, speedMax:154, sizeMin:5, sizeMax:10, gravity:8, ring:1.02, center:1.14, style:"dot", shell:false, flash:true, cross:false },
      classicFirework: { life:980, count:24, speedMin:102, speedMax:188, sizeMin:4, sizeMax:9, gravity:14, ring:0.86, center:1.02, style:"petal", shell:true, flash:false, cross:false },
      confettiBloom: { life:980, count:22, speedMin:84, speedMax:148, sizeMin:5, sizeMax:10, gravity:24, ring:0.64, center:0.84, style:"confetti", shell:false, flash:false, cross:false },
      plasmaBurst: { life:920, count:20, speedMin:112, speedMax:198, sizeMin:5, sizeMax:11, gravity:8, ring:0.88, center:1.1, style:"plasma", shell:false, flash:true, cross:false },
      cosmicCrackle: { life:1040, count:26, speedMin:74, speedMax:176, sizeMin:3, sizeMax:8, gravity:20, ring:0.76, center:1.0, style:"crackle", shell:true, flash:false, cross:false }
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

  function buildPalette(baseColor, preset){
    if (preset === "confettiBloom"){
      return ["#ff5a51", "#ffc751", "#40b9c5", "#f28fff", "#ffffff", "#a7cb6f"];
    }
    if (preset === "plasmaBurst"){
      return [baseColor, lightenColor(baseColor, 0.3), "#ffffff", "#d596ff", "#77f0ff"];
    }
    if (preset === "cosmicCrackle"){
      return [baseColor, "#ffffff", "#ffd96c", "#8af2ff", "#ff9fe7"];
    }
    return [baseColor, lightenColor(baseColor, 0.2), lightenColor(baseColor, 0.36), "#ffffff", "#ffe082"];
  }

  function renderEffect(effect, now){
    if (effect.kind === "beam"){
      return `<div class="vinv-beam" style="left:${effect.x}px; top:${effect.y}px;"></div>`;
    }
    if (effect.kind !== "particle") return "";

    const progress = clamp((now - effect.born) / effect.life, 0, 1);
    const particleHtml = effect.particles.map((particle) => {
      const dx = Math.cos(particle.angle) * particle.speed * progress + particle.drift * progress;
      const dy = Math.sin(particle.angle) * particle.speed * progress + (particle.gravity || 0) * progress * progress * 40;
      const opacity = clamp((particle.alpha || 1) * (1 - Math.pow(progress, effect.preset === "smokePuff" ? 1.15 : 1.55)), 0, 1);
      const scale = effect.preset === "smokePuff"
        ? (0.7 + progress * 1.15)
        : (0.72 + progress * 0.62);
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
