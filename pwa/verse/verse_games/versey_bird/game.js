(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "versey_bird";
  const TARGET_COLORS = ["#ff5a51","#ffa351","#ffc751","#40b9c5","#7f66c6","#a7cb6f"];
  const BIRDS = ["🐦","🐓","🐤","🦆","🦅","🐧","🐥"];
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
    "pancake","bubble","marshmallow","treasure","robot","firetruck","yo-yo","snowman","blueberry","noodle"
  ];
  const GRASS_SVGS = [
    `<svg viewBox="0 0 2540 1651" xmlns="http://www.w3.org/2000/svg"><path fill="#a7cb6f" d="m 1231.6382,523.41679 c -83.6762,-0.0945 -171.6464,460.6266 -149.2495,784.60141 l 21.1527,320.7409 -291.25151,-281.3909 C 499.98023,1045.8205 309.82567,904.22381 270.04011,943.94701 c -46.94035,46.81565 82.46308,406.56359 218.39965,608.81789 23.95202,34.6838 44.01533,67.9683 61.65339,98.2352 H 2018.7291 l 108.4058,-261.2642 c 144.397,-347.3052 194.8208,-622.13268 114.4731,-622.13268 -98.6396,-0.12283 -387.0908,313.52368 -522.7156,567.97608 -72.1054,135.1892 -143.0904,245.7415 -158.0529,245.7727 -14.3086,-3.1102 -46.7533,-132.7631 -70.6741,-295.0145 -47.22,-316.137 -198.9268,-762.85835 -258.9628,-762.88953 z"/></svg>`,
    `<svg viewBox="0 0 2540 1651" xmlns="http://www.w3.org/2000/svg"><path fill="#a7cb6f" d="m 1644.2751,13.517174 c -48.6513,0 -197.8696,250.563676 -276.7557,464.701426 -42.3365,115.06359 -108.6552,372.40794 -147.3835,571.9574 l -70.3936,362.7032 -111.8286,-362.7032 C 902.56946,611.23015 669.76761,52.493998 634.77209,82.605024 544.87455,159.71782 592.52916,1033.409 702.14894,1317.8175 c 18.97493,49.4591 27.99661,89.8351 19.59754,89.8351 -8.39908,0 -125.17272,-73.1626 -259.6156,-162.6246 C 223.9164,1086.4772 31.801425,1034.8403 31.801425,1129.2492 c 0,35.1193 191.337425,345.3759 313.741935,521.7509 H 2007.8182 c 16.7972,-45.6649 66.4123,-131.6747 135.8733,-231.7135 224.1231,-322.7305 364.5067,-561.25583 364.5067,-619.33229 0,-167.63388 -526.3236,160.82109 -778.038,485.54319 -87.4411,112.7924 -158.7369,181.1962 -158.3637,152.0489 0,-29.24 22.7077,-241.3247 50.0505,-471.35837 53.9695,-456.11623 65.6971,-952.670856 22.397,-952.670856 z"/></svg>`,
    `<svg viewBox="0 0 2540 1651" xmlns="http://www.w3.org/2000/svg"><path fill="#a7cb6f" d="m 795.40834,94.155707 -0.4335,0.0816 c 0.0332,-0.0014 0.0712,0.02623 0.107,0.02478 -83.371,8.660863 -144.1702,681.452993 -103.0124,1147.702913 L 727.26834,1651 h 921.49416 l 91.0378,-378.9147 c 123.9418,-514.68586 158.2873,-916.58108 78.0759,-909.80449 -98.4794,8.14159 -368.1904,486.27872 -488.7779,865.87859 -64.1163,201.6835 -128.5476,367.6248 -143.4828,368.9325 -14.4654,-3.2934 -54.4,-188.1489 -87.7217,-420.8888 C 1032.3948,723.03693 855.12314,89.987818 795.08594,94.262088 c 0.1085,-0.0043 0.214,-0.09711 0.3224,-0.105657 z"/></svg>`
  ];

  let selectedMode = null;
  let completed = false;
  let muted = false;

  const state = {
    running: false,
    rafId: 0,
    spawnCooldown: 0,
    birdEmoji: BIRDS[Math.floor(Math.random() * BIRDS.length)],
    birdX: 0,
    birdY: 0,
    birdVY: 0,
    birdRadius: 30,
    gravity: 1180,
    flapVelocity: -410,
    fieldWidth: 0,
    fieldHeight: 0,
    groundHeight: 74,
    clouds: [],
    particles: [],
    trail: [],
    targets: [],
    nextTargetId: 1,
    words: tokenizeVerse(ctx.verseText),
    bookLabel: "",
    referenceLabel: "",
    segments: [],
    progressIndex: 0,
    streak: 0,
    flashUntil: 0,
    shakeUntil: 0,
    successFlashUntil: 0,
    inputLockedUntil: 0,
    lastTs: 0
  };

  setupReferenceSegments();
  renderIntro();

  function renderIntro(){
    stopLoop();
    app.innerHTML = `
      <div class="vb-mode-shell">
        <div class="vb-mode-stage">
          <div class="vb-mode-top">
            <div style="font-size:72px; line-height:1;">🐤</div>
            <div class="vb-mode-title">Versey Bird</div>
            <div class="vb-mode-subtitle">
              Flap into the next correct word.<br>
              Then collect the book and reference.
            </div>

            <div class="vb-mode-card">
              <div class="vb-mode-actions">
                <button class="vm-btn" id="startBtn">Start</button>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}

        ${renderHelpOverlay("Tap or click to flap.<br><br>Hit the next correct word.<br>Wrong hits and missed correct words reset your streak, but they do not end the run.<br><br>After the verse is built, collect the book, then the reference.")}
      </div>
    `;

    document.getElementById("startBtn").onclick = renderModeSelect;
    wireCommonNav();
  }

  function renderModeSelect(){
    stopLoop();
    app.innerHTML = `
      <div class="vb-mode-shell">
        <div class="vb-mode-stage">
          <div class="vb-mode-top">
            <div class="vb-mode-title">🐤 Versey Bird</div>
            <div class="vb-mode-subtitle">Choose your difficulty.</div>

            <div class="vb-mode-card">
              <div class="vb-mode-actions">
                <button class="vm-btn" id="easyBtn">Easy</button>
                <button class="vm-btn" id="mediumBtn">Medium</button>
                <button class="vm-btn" id="hardBtn">Hard</button>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}

        ${renderHelpOverlay("Easy: slower speed, fewer decoys, bigger targets.<br><br>Medium: balanced.<br><br>Hard: faster speed, more decoys, smaller targets.")}
      </div>
    `;

    document.getElementById("easyBtn").onclick = () => startGame("easy");
    document.getElementById("mediumBtn").onclick = () => startGame("medium");
    document.getElementById("hardBtn").onclick = () => startGame("hard");
    wireCommonNav();
  }

  function startGame(mode){
    selectedMode = mode;
    completed = false;

    state.running = true;
    state.progressIndex = 0;
    state.streak = 0;
    state.targets = [];
    state.trail = [];
    state.particles = [];
    state.clouds = [];
    state.nextTargetId = 1;
    state.spawnCooldown = 0;
    state.lastTs = 0;
    state.flashUntil = 0;
    state.shakeUntil = 0;
    state.successFlashUntil = 0;
    state.inputLockedUntil = 0;

    app.innerHTML = `
      <div class="vb-root">
        <div class="vb-stage">
          <div class="vb-build-wrap">
            <div class="vb-build" id="vbBuild">
              <div class="vb-build-text" id="vbBuildText"></div>
            </div>
          </div>

          <div class="vb-field-wrap">
            <div class="vb-field" id="vbField">
              <div class="vb-overlay-pills">
                <div class="vb-pill" id="vbModePill">${escapeHtml(capitalize(mode))}</div>
                <div class="vb-pill" id="vbStreakPill">Streak: 0</div>
              </div>

              <div class="vb-clouds" id="vbClouds"></div>
              <div class="vb-trail" id="vbTrail"></div>
              <div class="vb-particles" id="vbParticles"></div>
              <div class="vb-targets" id="vbTargets"></div>
              <div class="vb-bird" id="vbBird">${state.birdEmoji}</div>
              <div class="vb-flash" id="vbFlash"></div>

              <div class="vb-ground">
                <div class="vb-grass-top">
                  <div class="vb-grass-track" id="vbGrassTrack"></div>
                </div>
                <div class="vb-dirt"></div>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}

        ${renderHelpOverlay("Tap or click to flap.<br><br>Touch the next correct item.<br><br>Wrong hits and missed correct words reset your streak only.<br><br>Build the whole verse, then collect the book, then the reference.")}
      </div>
    `;

    wireCommonNav();
    wireGameInput();
    updateBuildText();
    recalcField();
    populateGrass();
    resetBird();
    seedClouds();
    spawnBatch();
    startLoop();
  }

  function renderComplete(){
    stopLoop();
    const unlockAt = performance.now() + 700;

    app.innerHTML = `
      <div class="vb-mode-shell">
        <div class="vb-mode-stage">
          <div class="vb-mode-top">
            <div class="vb-complete-icon">🏅</div>
            <div class="vb-mode-title">Versey Bird Complete!</div>
            <div class="vb-mode-subtitle">
              You finished ${escapeHtml(ctx.verseRef || "")}.
            </div>

            <div class="vb-mode-card">
              <div class="vb-mode-actions">
                <button class="vm-btn" id="playAgainBtn" disabled>Play Again</button>
                <button class="vm-btn" id="doneBtn" disabled>Back to Practice</button>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}

        ${renderHelpOverlay("Great job! This completion has already been recorded for medals, stars, and BibloPets.")}
      </div>
    `;

    const playAgainBtn = document.getElementById("playAgainBtn");
    const doneBtn = document.getElementById("doneBtn");

    playAgainBtn.onclick = () => {
      if (performance.now() < unlockAt) return;
      renderModeSelect();
    };

    doneBtn.onclick = () => {
      if (performance.now() < unlockAt) return;
      window.VerseGameBridge.exitGame();
    };

    setTimeout(() => {
      if (playAgainBtn) playAgainBtn.disabled = false;
      if (doneBtn) doneBtn.disabled = false;
    }, 700);

    wireCommonNav();
  }

  function renderNav(){
    return `
      <div class="vb-nav-wrap">
        <div class="vb-nav">
          <button class="vb-nav-btn" id="homeBtn" aria-label="Home">${getHomeSvg()}</button>
          <div class="vb-nav-center">
            <button class="vb-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="vb-nav-btn" id="muteBtn" aria-label="Mute">${muted ? getMuteSvg() : getUnmuteSvg()}</button>
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(body){
    return `
      <div class="vb-help-overlay" id="vbHelpOverlay" aria-hidden="true">
        <div class="vb-help-dialog">
          <div class="vb-help-title">How to Play</div>
          <div class="vb-help-body">${body}</div>
          <div class="vb-help-actions">
            <button class="vm-btn" id="vbHelpCloseBtn">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireCommonNav(){
    const homeBtn = document.getElementById("homeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpOverlay = document.getElementById("vbHelpOverlay");
    const helpCloseBtn = document.getElementById("vbHelpCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (helpBtn) helpBtn.onclick = () => helpOverlay.classList.add("is-open");
    if (helpCloseBtn) helpCloseBtn.onclick = () => helpOverlay.classList.remove("is-open");
    if (helpOverlay){
      helpOverlay.onclick = (e) => {
        if (e.target === helpOverlay) helpOverlay.classList.remove("is-open");
      };
    }
    if (muteBtn){
      muteBtn.onclick = () => {
        muted = !muted;
        muteBtn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      };
    }
  }

  function wireGameInput(){
    const field = document.getElementById("vbField");
    const flapHandler = (e) => {
      e.preventDefault();
      flap();
    };
    field.addEventListener("pointerdown", flapHandler, { passive: false });
    field.addEventListener("touchstart", flapHandler, { passive: false });
    window.addEventListener("resize", recalcField);
  }

  function flap(){
    if (!state.running) return;
    if (performance.now() < state.inputLockedUntil) return;
    state.birdVY = state.flapVelocity;
    createPuffs();
  }

  function startLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    state.running = true;
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
    const dt = Math.min(0.032, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    recalcField();
    updateBird(dt);
    updateClouds(dt);
    updateParticles(dt);
    updateTrail(dt);
    updateTargets(dt, ts);
    maybeSpawnBatch(dt);
    renderFrame(ts);

    state.rafId = requestAnimationFrame(loop);
  }

  function recalcField(){
    const field = document.getElementById("vbField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;
    state.birdX = Math.max(70, rect.width * 0.2);
  }

  function resetBird(){
    state.birdY = state.fieldHeight * 0.48;
    state.birdVY = 0;
  }

  function updateBird(dt){
    state.birdVY += state.gravity * dt;
    state.birdY += state.birdVY * dt;

    const topBound = 18;
    const groundTop = state.fieldHeight - state.groundHeight;

    if (state.birdY < topBound){
      state.birdY = topBound;
      state.birdVY = 0;
    }

    if (state.birdY + state.birdRadius > groundTop){
      state.birdY = groundTop - state.birdRadius;
      if (state.birdVY > 0) state.birdVY *= 0.12;
    }
  }

  function updateClouds(dt){
    for (const cloud of state.clouds){
      cloud.x -= cloud.speed * dt;
    }
    state.clouds = state.clouds.filter(cloud => cloud.x > -120);

    while (state.clouds.length < 5){
      state.clouds.push(makeCloud(state.clouds.length === 0));
    }
  }

  function seedClouds(){
    state.clouds = [];
    for (let i = 0; i < 5; i++){
      state.clouds.push(makeCloud(true, i));
    }
  }

  function makeCloud(seed = false, index = 0){
    const size = 22 + Math.random() * 34;
    return {
      id: Math.random().toString(36).slice(2),
      x: seed ? state.fieldWidth * (0.18 + index * 0.22) : state.fieldWidth + Math.random() * 120,
      y: 34 + Math.random() * Math.max(80, state.fieldHeight * 0.42),
      size,
      opacity: 0.22 + Math.random() * 0.35,
      speed: 10 + Math.random() * 16
    };
  }

  function createPuffs(){
    for (let i = 0; i < 4; i++){
      state.particles.push({
        id: Math.random().toString(36).slice(2),
        type: "puff",
        x: state.birdX - 18 + Math.random() * 8,
        y: state.birdY + 8 + (Math.random() * 12 - 6),
        vx: -70 - Math.random() * 40,
        vy: -10 + Math.random() * 20,
        life: 0.42 + Math.random() * 0.16,
        age: 0,
        size: 8 + Math.random() * 12
      });
    }
  }

  function updateParticles(dt){
    for (const p of state.particles){
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    state.particles = state.particles.filter(p => p.age < p.life);
  }

  function updateTrail(dt){
    const tier = getTrailTier();
    if (tier > 0){
      state.trail.push({
        id: Math.random().toString(36).slice(2),
        x: state.birdX - 16,
        y: state.birdY + 4,
        age: 0,
        life: 0.42 + tier * 0.07,
        size: 12 + tier * 3,
        color: getTrailColor()
      });
    }

    for (const t of state.trail){
      t.age += dt;
      t.x -= (90 + tier * 14) * dt;
    }
    state.trail = state.trail.filter(t => t.age < t.life);
  }

  function getTrailTier(){
    if (state.streak < 5) return 0;
    return 1 + Math.floor((state.streak - 5) / 2);
  }

  function getTrailColor(){
    const tier = getTrailTier();
    const rainbow = ["#ff5a51","#ffa351","#ffc751","#a7cb6f","#40b9c5","#7f66c6"];
    if (tier <= 1) return "#ffc751";
    if (tier === 2) return "#ffa351";
    if (tier === 3) return "#ff5a51";
    return rainbow[Math.floor(Math.random() * rainbow.length)];
  }

  function maybeSpawnBatch(dt){
    if (state.targets.length > 0) return;
    state.spawnCooldown = Math.max(0, state.spawnCooldown - dt);
    if (state.spawnCooldown <= 0 && getCurrentPhase() !== "done"){
      spawnBatch();
    }
  }

  function spawnBatch(){
    const phase = getCurrentPhase();
    if (phase === "done") return;

    const correctLabel = getCurrentCorrectLabel();
    const decoys = getDecoysForPhase(phase, correctLabel, getDecoyCount());
    const shouldSpawnCorrect = Math.random() < getCorrectSpawnChance();
    const label = (shouldSpawnCorrect || decoys.length === 0)
      ? correctLabel
      : decoys[Math.floor(Math.random() * decoys.length)];

    const laneY = pickSingleLaneY();
    const circleSize = getCircleSize();

    state.targets = [{
      id: state.nextTargetId++,
      x: state.fieldWidth + 90,
      y: laneY,
      label,
      correct: label === correctLabel,
      color: TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)],
      speed: getScrollSpeed(),
      circleSize
    }];
  }

  function updateTargets(dt, ts){
    const groundTop = state.fieldHeight - state.groundHeight;

    for (const target of state.targets){
      target.x -= target.speed * dt;
    }

    let missedCorrect = false;

    for (const target of state.targets){
      if (target.x < -90){
        if (target.correct) missedCorrect = true;
      }
    }

    state.targets = state.targets.filter(target => target.x > -90);

    if (missedCorrect){
      registerMistake(ts);
      state.targets = [];
      state.spawnCooldown = 0.22;
      return;
    }

    for (const target of state.targets){
      const dx = target.x - state.birdX;
      const dy = (target.y - 12) - state.birdY;
      const dist = Math.hypot(dx, dy);

      if (dist <= state.birdRadius + (target.circleSize * 0.5)){
        if (target.correct){
          registerSuccess(ts, target.x, target.y - 12);
          handleCorrect();
        } else {
          registerMistake(ts);
          state.targets = [];
          state.spawnCooldown = 0.18;
        }
        return;
      }

      if (target.y > groundTop - 8){
        target.y = groundTop - 8;
      }
    }
  }

  function handleCorrect(){
    state.progressIndex += 1;
    state.streak += 1;
    state.targets = [];
    state.spawnCooldown = 0.14;
    updateBuildText();
    updateStreakPill();

    if (getCurrentPhase() === "done"){
      finishRun();
    }
  }

  function registerMistake(ts){
    state.streak = 0;
    state.flashUntil = ts + 160;
    state.shakeUntil = ts + 260;
    updateStreakPill();

    const build = document.getElementById("vbBuild");
    if (build){
      build.classList.remove("vb-shake");
      void build.offsetWidth;
      build.classList.add("vb-shake");
    }
  }

  function registerSuccess(ts, targetX, targetY){
    state.successFlashUntil = ts + 130;

    for (let i = 0; i < 8; i++){
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 70 + Math.random() * 55;
      state.particles.push({
        id: Math.random().toString(36).slice(2),
        type: "spark",
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.24 + Math.random() * 0.08,
        age: 0,
        size: 7 + Math.random() * 6
      });
    }
  }

  async function finishRun(){
    if (completed) return;
    completed = true;
    state.running = false;

    try{
      await window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode
      });
    }catch(err){
      console.error("markCompleted failed", err);
    }

    renderComplete();
  }

  function renderFrame(ts){
    renderBuildShake(ts);
    renderClouds();
    renderTargets();
    renderParticles();
    renderTrail();
    renderBird();
    renderFlash(ts);
    renderGrass(ts);
  }

  function renderBuildShake(ts){
    const build = document.getElementById("vbBuild");
    if (!build) return;
    if (ts > state.shakeUntil){
      build.classList.remove("vb-shake");
    }
  }

  function renderFlash(ts){
    const flash = document.getElementById("vbFlash");
    if (!flash) return;

    if (ts <= state.flashUntil){
      flash.classList.add("is-on");
      flash.style.background = "rgba(255, 90, 81, 0.34)";
      return;
    }

    if (ts <= state.successFlashUntil){
      flash.classList.add("is-on");
      flash.style.background = "rgba(64, 185, 197, 0.26)";
      return;
    }

    flash.classList.remove("is-on");
  }

  function renderBird(){
    const bird = document.getElementById("vbBird");
    if (!bird) return;
    const angle = clamp((state.birdVY / 9), -24, 54);
    bird.style.left = `${state.birdX}px`;
    bird.style.top = `${state.birdY}px`;
    bird.style.transform = `translate(-50%, -50%) scaleX(-1) rotate(${angle}deg)`;
  }

  function renderClouds(){
    const layer = document.getElementById("vbClouds");
    if (!layer) return;
    layer.innerHTML = state.clouds.map(cloud => `
      <div class="vb-cloud"
           style="left:${cloud.x}px; top:${cloud.y}px; font-size:${cloud.size}px; opacity:${cloud.opacity};">
        ☁️
      </div>
    `).join("");
  }

  function renderParticles(){
    const layer = document.getElementById("vbParticles");
    if (!layer) return;

    layer.innerHTML = state.particles.map(p => {
      const alpha = 1 - (p.age / p.life);
      const bg = p.type === "spark" ? "#ffffff" : "rgba(255,255,255,0.92)";
      return `
        <div class="vb-puff"
             style="left:${p.x}px; top:${p.y}px; width:${p.size}px; height:${p.size}px; opacity:${alpha}; background:${bg};">
        </div>
      `;
    }).join("");
  }

  function renderTrail(){
    const layer = document.getElementById("vbTrail");
    if (!layer) return;
    layer.innerHTML = state.trail.map(t => {
      const alpha = 1 - (t.age / t.life);
      return `
        <div class="vb-trail-dot"
             style="left:${t.x}px; top:${t.y}px; width:${t.size}px; height:${t.size}px; background:${t.color}; opacity:${alpha};">
        </div>
      `;
    }).join("");
  }

  function renderTargets(){
    const layer = document.getElementById("vbTargets");
    if (!layer) return;
    layer.innerHTML = state.targets.map(target => `
      <div class="vb-target" style="left:${target.x}px; top:${target.y}px;">
        <div class="vb-target-circle" style="background:${target.color}; --circle-size:${target.circleSize}px;"></div>
        <div class="vb-target-label">${escapeHtml(target.label)}</div>
      </div>
    `).join("");
  }

  function populateGrass(){
    const track = document.getElementById("vbGrassTrack");
    if (!track) return;

    const items = [];
    const spacing = 42;
    const count = Math.ceil((state.fieldWidth + 120) / spacing);

    for (let i = 0; i < count; i++){
      const svg = GRASS_SVGS[i % GRASS_SVGS.length];
      const width = 34 + Math.random() * 36;
      const scaleY = 0.55 + Math.random() * 0.85;
      const scaleX = 0.78 + Math.random() * 0.55;
      const yNudge = -2 + Math.random() * 4;
      const rotate = -4 + Math.random() * 8;

      items.push(`
        <div class="vb-grass-tuft"
             style="left:${i * spacing}px; width:${width}px; transform:translateX(-50%) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotate}deg); bottom:${yNudge}px;">
          ${svg}
        </div>
      `);
    }

    track.innerHTML = items.join("");
  }

  function renderGrass(ts){
    const track = document.getElementById("vbGrassTrack");
    if (!track) return;
    const x = -((ts * 0.03) % 42);
    track.style.transform = `translateX(${x}px)`;
  }

  function updateBuildText(){
    const el = document.getElementById("vbBuildText");
    if (!el) return;
    el.innerHTML = state.segments.map((segment, index) => `
      <span class="vb-build-word ${index < state.progressIndex ? "is-built" : ""}">
        ${escapeHtml(segment)}
      </span>
    `).join(" ");
  }

  function updateStreakPill(){
    const pill = document.getElementById("vbStreakPill");
    if (!pill) return;
    const tier = getTrailTier();
    let suffix = "";
    if (tier >= 4) suffix = " 🌈";
    else if (tier >= 2) suffix = " ✨";
    pill.textContent = `Streak: ${state.streak}${suffix}`;
  }

  function setupReferenceSegments(){
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    state.bookLabel = parsed.book || "";
    state.referenceLabel = parsed.reference || "";
    state.segments = [...state.words];
    if (state.bookLabel) state.segments.push(state.bookLabel);
    if (state.referenceLabel) state.segments.push(state.referenceLabel);
  }

  function getCurrentPhase(){
    const wordCount = state.words.length;
    if (state.progressIndex < wordCount) return "words";
    if (state.progressIndex === wordCount && state.bookLabel) return "book";
    if (state.progressIndex === wordCount + (state.bookLabel ? 1 : 0) && state.referenceLabel) return "reference";
    return "done";
  }

  function getCurrentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function getDecoyCount(){
    if (selectedMode === "hard") return 4;
    if (selectedMode === "medium") return 3;
    return 2;
  }

  function getCircleSize(){
    if (selectedMode === "hard") return 26;
    if (selectedMode === "medium") return 30;
    return 35;
  }

  function getScrollSpeed(){
    if (selectedMode === "hard") return 205;
    if (selectedMode === "medium") return 172;
    return 140;
  }

  function buildLaneYs(count){
    const groundTop = state.fieldHeight - state.groundHeight;
    const top = 54;
    const bottom = groundTop - 54;
    const lanes = [];
    if (count === 1) return [(top + bottom) * 0.5];
    const step = (bottom - top) / (count - 1);
    for (let i = 0; i < count; i++){
      lanes.push(top + step * i + (Math.random() * 20 - 10));
    }
    return shuffle(lanes);
  }

  function getCorrectSpawnChance(){
    if (selectedMode === "hard") return 0.38;
    if (selectedMode === "medium") return 0.48;
    return 0.58;
  }

  function pickSingleLaneY(){
    const groundTop = state.fieldHeight - state.groundHeight;
    const lanes = [
      Math.max(64, groundTop * 0.24),
      Math.max(92, groundTop * 0.50),
      Math.max(120, groundTop * 0.76)
    ];
    return lanes[Math.floor(Math.random() * lanes.length)];
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = new Set();

    if (phase === "words"){
      const verseWords = state.words.map(normalizeWord);
      for (const word of shuffle(FUN_DECOYS)){
        if (out.size >= count) break;
        if (!verseWords.includes(normalizeWord(word)) && normalizeWord(word) !== normalizeWord(correctLabel)){
          out.add(word);
        }
      }
      for (const word of shuffle(state.words)){
        if (out.size >= count) break;
        if (normalizeWord(word) !== normalizeWord(correctLabel)){
          out.add(word);
        }
      }
    }

    if (phase === "book"){
      for (const book of shuffle(BOOKS)){
        if (out.size >= count) break;
        if (book !== correctLabel) out.add(book);
      }
    }

    if (phase === "reference"){
      const match = correctLabel.match(/^(\d+):(\d+)(?:-(\d+))?$/);
      const chapter = match ? Number(match[1]) : 1;
      const verse = match ? Number(match[2]) : 1;
      let tries = 0;
      while (out.size < count && tries < 40){
        tries++;
        const c = Math.max(1, chapter + Math.floor(Math.random() * 5) - 2);
        const v = Math.max(1, verse + Math.floor(Math.random() * 9) - 4);
        const label = `${c}:${v}`;
        if (label !== correctLabel) out.add(label);
      }
    }

    return Array.from(out).slice(0, count);
  }

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
  }

  function normalizeWord(word){
    return String(word || "").toLowerCase().replace(/[^a-z0-9']/g, "");
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  function capitalize(str){
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of", "the"]);
    return String(slug || "")
      .split("_")
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        if (index > 0 && smallWords.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();

    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch){
      return {
        book: titleCaseBookFromSlug(idRangeMatch[1]),
        reference: `${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}`
      };
    }

    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch){
      return {
        book: titleCaseBookFromSlug(idMatch[1]),
        reference: `${idMatch[2]}:${idMatch[3]}`
      };
    }

    let raw = String(ref || "").trim();
    const trans = String(translation || "").trim();
    if (trans){
      raw = raw.replace(new RegExp(`\\s*\\(?${trans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)?\\s*$`, "i"), "").trim();
    }

    const match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
    if (match){
      return { book: match[1].trim(), reference: match[2].trim() };
    }

    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0){
      return {
        book: raw.slice(0, lastSpace).trim(),
        reference: raw.slice(lastSpace + 1).trim()
      };
    }

    return { book: raw, reference: "" };
  }

  function getHomeSvg(){
    return `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/></svg>`;
  }

  function getMuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg"><path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round" d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z"/><g transform="translate(-26.458334,-255.59263)"><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round" d="M 1241.4124,524.69155 890.61025,875.49365"/><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round" d="m 890.61025,524.69155 350.80215,350.8021"/></g></svg>`;
  }

  function getUnmuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg"><path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round" d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z"/><path style="fill:none;stroke:#ffffff;stroke-width:63;stroke-linecap:round" d="M 877 307 Q 982 444 877 582"/><path style="fill:none;stroke:#ffffff;stroke-width:63;stroke-linecap:round" d="M 959 241 Q 1111 444 959 648"/></svg>`;
  }
})();
