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
    "hug","tug","push","pull","snap","wave","wink","grin","zoom","zip","pop","bop","red","blue",
    "pink","gold","big","tiny","cold","hot","wet","dry","soft","hard","fast","slow","loud","sweet"
  ];
  const EXPLOSIONS = ["🎆","✨","💥","🎇"];
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
    roundTimer:0,
    pendingNextAction:null,
    bonusMode:false,
    bonusShotsLeft:0,
    bonusAutoTimer:0,
    bonusFinished:false,
    bonusFireworks:[],
    modeSpeed:{ easy:92, medium:98, hard:122 }
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
            <div class="vinv-subtitle">Blast the next correct word before the aliens reach the bottom. Then keep going right into the book and reference.</div>
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
    state.roundTimer = 0;
    state.pendingNextAction = null;
    state.bonusMode = false;
    state.bonusShotsLeft = 0;
    state.bonusAutoTimer = 0;
    state.bonusFinished = false;
    state.bonusFireworks = [];
    state.roundSpeed = getRoundSpeed();

    app.innerHTML = `
      <div class="vinv-shell">
        <div class="vinv-stage">
          <div class="vinv-build-wrap">
            <div class="vinv-build" id="vinvBuild">
              <div class="vinv-build-text" id="vinvBuildText"></div>
            </div>
          </div>

          <div class="vinv-pills">
            <div class="vinv-pill" id="vinvModePill"></div>
            <div class="vinv-pill" id="vinvStreakPill"></div>
            <div class="vinv-pill" id="vinvRoundPill"></div>
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
    return `Tap the button that matches the lane holding the next correct word.<br><br>
      A correct hit explodes and adds the word to the build area.<br><br>
      A wrong hit resets your streak. After two wrong hits in one round, that set clears and a new one begins.<br><br>
      If the correct word reaches the bottom, it abducts a human and the streak resets.`;
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
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;
    state.bottomZoneY = Math.max(120, rect.height - 96);
    state.scale = clamp(rect.width / 390, 0.88, 1.45);
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

    bottomEl.innerHTML = `<div class="vinv-bottom-zone" style="bottom:${Math.max(74, state.fieldHeight - state.bottomZoneY)}px"></div>`;
  }

  function renderHud(){
    const modePill = document.getElementById("vinvModePill");
    const streakPill = document.getElementById("vinvStreakPill");
    const roundPill = document.getElementById("vinvRoundPill");
    if (modePill) modePill.textContent = `${capitalize(selectedMode)} Mode`;
    if (streakPill) streakPill.textContent = `🔥 Streak ${state.streak}`;
    if (roundPill) roundPill.textContent = state.bonusMode ? `🎆 Bonus ${state.bonusShotsLeft}` : `✅ ${state.builtCount}/${state.queue.length}`;
    renderBuildArea();
    renderButtons();
  }

  function renderBuildArea(){
    const buildText = document.getElementById("vinvBuildText");
    const build = document.getElementById("vinvBuild");
    if (!buildText || !build) return;

    build.classList.toggle("is-shake", state.buildShakeUntil > performance.now());
    buildText.innerHTML = state.queue.map((token, index) => `
      <span class="vinv-build-token ${index < state.builtCount ? "is-built" : ""}">${escapeHtml(token)}</span>
    `).join(" ");
  }

  function renderButtons(){
    const buttons = document.querySelectorAll(".vinv-lane-btn");
    const round = state.entities;
    buttons.forEach((btn) => {
      const lane = btn.dataset.lane;
      const entity = round.find((item) => item.lane === lane);
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
    state.roundTimer = 0;
    state.pendingNextAction = null;
    state.buttonsLocked = false;
    state.activeLane = null;
    state.wrongGuessesThisRound = 0;
    state.rocket = null;
    state.trails = [];
    state.effects = state.effects.filter(effect => effect.kind === "firework");
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
        y:-18 - index * 16,
        stagger:index * 0.04,
        visible:true,
        status:"falling",
        fxClass:""
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
      y:state.fieldHeight - 32,
      targetY:Math.max(56, target.y + 44),
      speed:Math.max(360, state.fieldHeight * 1.6),
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
      unlockAfterDelay(280);
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
    target.visible = false;
    target.status = "wrong";
    addEffect({ kind:"puff", x:target.x, y:target.y + 26, icon:randomFrom(PUFFS), until:performance.now() + 320 });
    renderHud();

    if (state.wrongGuessesThisRound >= 2){
      state.buttonsLocked = true;
      state.activeLane = null;
      state.pendingNextAction = {
        at: performance.now() + 360,
        run: () => {
          state.entities.forEach(item => { item.visible = false; item.status = "fade"; });
          state.pendingNextAction = {
            at: performance.now() + 700,
            run: spawnRound
          };
        }
      };
    } else {
      unlockAfterDelay(360);
    }
    renderDynamic();
  }

  function handleCorrectHit(target){
    state.streak += 1;
    state.overlayMessage = state.streak >= 4 ? "Awesome!" : "Correct!";
    state.overlayUntil = performance.now() + 360;
    state.buttonsLocked = true;
    state.activeLane = target.lane;
    target.visible = false;
    target.status = "correct";

    state.pendingNextAction = {
      at: performance.now() + 130,
      run: () => {
        addEffect({
          kind:"burst",
          x:target.x,
          y:target.y + 18,
          icon:getExplosionIcon(),
          until:performance.now() + 520
        });
        state.entities.forEach(item => {
          if (item.id !== target.id){ item.visible = false; item.status = "fade"; }
        });
        state.builtCount += 1;
        renderHud();
        state.pendingNextAction = {
          at: performance.now() + 520,
          run: async () => {
            if (state.builtCount >= state.queue.length){
              await startBonusRound();
            } else {
              spawnRound();
            }
          }
        };
      }
    };
    renderDynamic();
  }

  function handleBottomMiss(target){
    state.streak = 0;
    state.mistakes += 1;
    state.buttonsLocked = true;
    state.activeLane = null;
    state.overlayMessage = "Abducted!";
    state.overlayUntil = performance.now() + 560;
    state.flashBadUntil = performance.now() + 260;
    state.buildShakeUntil = performance.now() + 280;

    state.entities.forEach(item => {
      if (item.id !== target.id){
        item.visible = false;
        item.status = "fade";
      }
    });

    addEffect({ kind:"human", x:target.x, y:state.bottomZoneY + 22, icon:"🧍", until:performance.now() + 680 });
    addEffect({ kind:"beam", x:target.x, y:state.bottomZoneY - 22, until:performance.now() + 640 });
    target.status = "abduct";
    target.visible = false;
    renderHud();
    renderDynamic();

    state.pendingNextAction = {
      at: performance.now() + 900,
      run: spawnRound
    };
  }

  function unlockAfterDelay(ms){
    state.pendingNextAction = {
      at: performance.now() + ms,
      run: () => {
        state.buttonsLocked = false;
        state.activeLane = null;
        state.rocket = null;
        renderButtons();
      }
    };
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
    state.bonusAutoTimer = 0;
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
      y:state.fieldHeight - 22,
      targetY:randBetween(state.fieldHeight * 0.16, state.fieldHeight * 0.5),
      speed:Math.max(300, state.fieldHeight * 1.45),
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

    if (state.pendingNextAction && ts >= state.pendingNextAction.at){
      const task = state.pendingNextAction.run;
      state.pendingNextAction = null;
      task();
    }

    if (state.buildShakeUntil && ts > state.buildShakeUntil) renderHud();

    if (!state.bonusMode){
      const speed = state.roundSpeed;
      for (const entity of state.entities){
        if (!entity.visible || entity.status !== "falling") continue;
        entity.y += speed * dt;
        if (entity.correct && entity.y >= state.bottomZoneY - 44){
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
          state.bonusAutoTimer = randBetween(0.35, 0.7);
          launchBonusRocket(randomFrom(LANE_KEYS));
        }
      }

      for (const firework of state.bonusFireworks){
        if (firework.exploded) continue;
        firework.y -= firework.speed * dt;
        addTrail(firework.x, firework.y + 18, true);
        if (firework.y <= firework.targetY){
          firework.exploded = true;
          addEffect({ kind:"firework", x:firework.x, y:firework.y, icon:getExplosionIcon(), until:ts + 700 });
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
              ? "is-correct-burst"
              : "";

      return `
        <div class="vinv-entity ${className}" style="left:${entity.x}px; top:${entity.y}px; ${hidden}">
          <div class="vinv-alien" style="color:${entity.color.hex}">${entity.color.alien}</div>
          <div class="vinv-word" style="color:${entity.color.hex}">${escapeHtml(entity.label)}</div>
        </div>
      `;
    }).join("");

    rocketsEl.innerHTML = `
      ${state.rocket ? `<div class="vinv-rocket" style="left:${state.rocket.x}px; top:${state.rocket.y}px;">🚀</div>` : ""}
      ${state.trails.map(trail => `<div class="vinv-trail ${trail.white ? "white" : ""}" style="left:${trail.x}px; top:${trail.y}px; opacity:${trail.opacity}">${trail.icon}</div>`).join("")}
      ${state.bonusFireworks.map(fw => `<div class="vinv-rocket white" style="left:${fw.x}px; top:${fw.y}px;">⚪</div>`).join("")}
    `;

    effectsEl.innerHTML = state.effects.map((effect) => {
      if (effect.kind === "puff") return `<div class="vinv-puff" style="left:${effect.x}px; top:${effect.y}px;">${effect.icon}</div>`;
      if (effect.kind === "burst") return `<div class="vinv-burst" style="left:${effect.x}px; top:${effect.y}px;">${effect.icon}</div>`;
      if (effect.kind === "human") return `<div class="vinv-human" style="left:${effect.x}px; top:${effect.y}px;">${effect.icon}</div>`;
      if (effect.kind === "beam") return `<div class="vinv-beam" style="left:${effect.x}px; top:${effect.y}px;"></div>`;
      if (effect.kind === "firework") return `<div class="vinv-burst" style="left:${effect.x}px; top:${effect.y}px;">${effect.icon}</div>`;
      return "";
    }).join("");

    bonusEl.innerHTML = state.bonusMode ? "" : "";
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
      for (const word of shuffle(verseWords)){
        if (out.size >= count) break;
        if (normalizeWord(word) !== normalizeWord(correctLabel)) out.add(word);
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
      while (out.size < count && tries < 40){
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
    const base = state.modeSpeed[selectedMode] || 96;
    if (selectedMode === "easy") return base;
    if (selectedMode === "medium") return base + Math.max(0, state.roundIndex - 1) * 7;
    return base + Math.max(0, state.roundIndex - 1) * 9;
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
    if (state.trails.length > 22) state.trails.shift();
  }

  function addEffect(effect){
    state.effects.push(effect);
    if (state.effects.length > 18) state.effects.shift();
  }

  function getExplosionIcon(){
    const big = state.streak >= 5;
    if (big) return "🎆";
    return randomFrom(EXPLOSIONS);
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
