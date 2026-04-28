(async function(){
  const app = document.getElementById("app");
  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_munch";

  const GAME_THEME = {
    bg: "#7f66c6",
    accent: "#7f66c6"
  };

  const HELP_OVERLAY_ID = "vmunchHelpOverlay";

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
    "taco","penguin","waffle","otter","pretzel","robot","balloon","muffin","snowman","pickle",
    "marshmallow","scooter","cupcake","backpack","blueberry","firetruck","treasure","noodle","narwhal","bongo",
    "yo-yo","zebra","meatball","pirate","volcano","hamster","jellybean","pancake","monkey","donut"
  ];
  const FOOD_EMOJIS = ["🍎","🍇","🍓","🍉","🍊","🍒","🍍","🥝","🍋","🥨","🧀","🥕"];
  const HAPPY_REACTIONS = ["😋","☺️","😁"];
  const SAD_REACTIONS = ["🤮","🤢","😵‍💫"];
  const ANTICIPATION_FACES = ["😕","🫤","😐"];
  const EMOTION_FACE = {
    "-3":"😡",
    "-2":"😠",
    "-1":"🤨",
    "0":"😐",
    "1":"🙂",
    "2":"😊",
    "3":"😁"
  };

  const EMOTION_LABEL = {
    "-3":"Mad",
    "-2":"Grumpy",
    "-1":"Annoyed",
    "0":"Calm",
    "1":"Pleased",
    "2":"Cheerful",
    "3":"Happy"
  };

const FACE_MAP = {
  // moods
  "😡":"munch_angry_3.png",
  "😠":"munch_angry_2.png",
  "🤨":"munch_angry_1.png",
  "😐":"munch_neutral.png",
  "🙂":"munch_happy_1.png",
  "😊":"munch_happy_2.png",
  "😁":"munch_happy_3.png",

  // negatives
  "🤢":"munch_negative_sick.png",
  "🤮":"munch_negative_puke.png",
  "😵‍💫":"munch_negative_dizzy.png",

  // positives
  "☺️":"munch_positive_1.png",
  "😋":"munch_positive_2.png",

  // mouth open (all map to same)
  "😄":"munch_mouth_open.png",
  "😮":"munch_mouth_open.png",
  "😦":"munch_mouth_open.png",

  // chew
  "😀":"munch_chew_open.png",

  // anticipation
  "😕":"munch_anticipation_1.png",
  "🫤":"munch_anticipation_2.png",

  // bonus
  "🥳":"munch_celebration.png"
};


  function preloadFaceImages(){
    Object.values(FACE_MAP).forEach(file => {
      const img = new Image();
      img.src = `verse_munch_images/${file}`;
    });
  }

  const TRAIL_EMOJIS = ["✨","⭐","💫","🫧","🌟"];

  const POSITIVE_REACTIONS = [
  "is-react-yum-tilt",
  "is-react-sparkle-pop",
  "is-react-jelly",
  "is-react-hop",
  "is-react-victory-wiggle"
];

  let selectedMode = null;
  let completed = false;
  let muted = false;
  let bonusRunning = false;

  const state = {
    running:false,
    rafId:0,
    lastTs:0,
    paused:false,
    pauseReason:"",
    scale:1,
    fieldWidth:0,
    fieldHeight:0,
    words:tokenizeVerse(ctx.verseText),
    segments:[],
    bookLabel:"",
    referenceLabel:"",
    progressIndex:0,
    streak:0,
    emotionLevel:0,
    carouselItems:[],
    carouselIndex:0,
    inputLocked:false,
    faceBase:"😐",
    faceDisplay:"😐",
    faceClasses:new Set(),
    idleTimer:0,
    flyingFood:null,
    hitWord:null,
    trails:[],
    particles:[],
    confetti:[],
    feedbackBadge:"",
    feedbackUntil:0,
    buildSizeClass:"is-normal",
    reactionFlash:"",
    reactionFlashUntil:0,
    faceScaleBoost:0,
    bonusCount:0,
    buildShakeUntil:0,
    lastFaceFile:""
  };

  setupReferenceSegments();
  renderIntro();
  preloadFaceImages();

function introHelpHtml(){
  return `
    Use the left and right arrows to rotate the selector.<br><br>
    Tap the centered word to feed it to the face.<br><br>
    Correct picks build the verse and grow your streak. Wrong picks only reset your streak.<br><br>
    After the full verse is built, munch the book, then the chapter and verse.
  `;
}

function modeHelpHtml(){
  return `
    Easy: slower animation timing and gentler pace.<br><br>
    Medium: balanced default timing.<br><br>
    Hard: snappier timing and less dwell before the next choice.
  `;
}

function gameHelpHtml(){
  return `
    Rotate the selector with the arrows.<br><br>
    Tap the word to feed it upward.<br><br>
    The face emotion changes only after each reaction finishes.<br><br>
    Wrong picks reset your streak but never end the run.
  `;
}

function completeHelpHtml(){
  return `
    Great job! This completion has already been recorded for medals, stars, and BibloPets.
  `;
}

function renderIntro(){
  stopLoop();

  window.VerseGameShell.renderTitleScreen({
    app,
    title: "Verse Munch",
    iconHtml: `<img src="verse_munch_images/munch_positive_2.png" alt="" draggable="false">`,
    helpHtml: introHelpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Practice Games",
    onBack: () => window.VerseGameBridge.exitGame(),
    onStart: renderModeSelect
  });
}

function renderModeSelect(){
  stopLoop();

  window.VerseGameShell.renderModeSelect({
    app,
    title: "Choose Your Difficulty",
    icon: "🥉🥈🥇",
    helpHtml: modeHelpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Verse Munch title",
    onBack: renderIntro,
    onSelect: startGame
  });
}

  function startGame(mode){
    selectedMode = mode;
    completed = false;
    bonusRunning = false;
    state.running = true;
    state.lastTs = 0;
    state.paused = false;
    state.pauseReason = "";
    state.progressIndex = 0;
    state.streak = 0;
    state.emotionLevel = 0;
    state.faceBase = getEmotionFace();
    state.faceDisplay = state.faceBase;
    state.faceClasses = new Set();
    state.idleTimer = getIdleDelay();
    state.flyingFood = null;
    state.hitWord = null;
    state.trails = [];
    state.particles = [];
    state.confetti = [];
    state.feedbackBadge = "";
    state.feedbackUntil = 0;
    state.reactionFlash = "";
    state.reactionFlashUntil = 0;
    state.faceScaleBoost = 0;
    state.bonusCount = 0;
    state.buildShakeUntil = 0;
    state.inputLocked = false;
    buildCarouselForCurrentStep();

app.innerHTML = `
  <div class="vmunch-root">
    <div class="vmunch-stage">
      <div class="vmunch-build-wrap">
        <div class="vmunch-build" id="vmunchBuild">
          <div class="vmunch-build-text" id="vmunchBuildText"></div>
        </div>
      </div>

      <div class="vmunch-overlay-pills">
        <button class="vmunch-pill vmunch-menu-pill" id="vmunchMenuPill" aria-label="Game Menu">☰</button>
        <div class="vmunch-pill" id="vmunchMoodPill">${escapeHtml(getMoodLabel())}</div>
      </div>

      <div class="vmunch-field-wrap">
        <div class="vmunch-field" id="vmunchField">
          <div class="vmunch-bg" id="vmunchBg"></div>
          <div class="vmunch-trails" id="vmunchTrails"></div>
          <div class="vmunch-particles" id="vmunchParticles"></div>
          <div class="vmunch-food-flight" id="vmunchFoodFlight"></div>
          <div class="vmunch-feedback" id="vmunchFeedback"></div>
          <div class="vmunch-confetti" id="vmunchConfetti"></div>

          <div class="vmunch-main">
            <div class="vmunch-face-zone">
              <div class="vmunch-face-stack">
                <div class="vmunch-face-glow"></div>
                <div class="vmunch-face" id="vmunchFace"></div>
              </div>
            </div>

            <div class="vmunch-food-zone">
              <div class="vmunch-food-display" id="vmunchFoodDisplay"></div>
            </div>

            <div class="vmunch-carousel-zone">
              <div class="vmunch-carousel-shell">
                <div class="vmunch-carousel-row">
                  <button class="vmunch-arrow-btn" id="vmunchPrevBtn" aria-label="Previous choice">‹</button>
                  <button class="vmunch-choice-btn" id="vmunchChoiceBtn" type="button"></button>
                  <button class="vmunch-arrow-btn" id="vmunchNextBtn" aria-label="Next choice">›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${renderHelpOverlay(gameHelpHtml())}
    ${renderGameMenuOverlay()}
  </div>
`;

    seedBackground();
    wireCommonNav();
    wireGameInput();
    recalcField();
    renderFrame(performance.now());
    startLoop();
  }

  function renderComplete(){
    stopLoop();
    const unlockAt = performance.now() + 700;

    app.innerHTML = `
      <div class="vmunch-mode-shell">
        <div class="vmunch-mode-stage">
          <div class="vmunch-mode-top">
            <div class="vmunch-complete-icon">🎉</div>
            <div class="vmunch-mode-title">Verse Munch Complete!</div>
            <div class="vmunch-mode-subtitle">You finished ${escapeHtml(ctx.verseRef || "")}. Nice munching.</div>

            <div class="vmunch-mode-card">
              <div class="vmunch-mode-actions">
                <button class="vm-btn" id="playAgainBtn" disabled>Play Again</button>
                <button class="vm-btn" id="doneBtn" disabled>Back to Practice</button>
              </div>
            </div>
          </div>
        </div>

        ${renderNav()}
        ${renderHelpOverlay(completeHelpHtml())}
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
      <div class="vmunch-nav-wrap">
        <div class="vmunch-nav">
          <button class="vmunch-nav-btn" id="homeBtn" aria-label="Home">${getHomeSvg()}</button>
          <div class="vmunch-nav-center">
            <button class="vmunch-help-btn" id="helpBtn" type="button">HELP</button>
          </div>
          <button class="vmunch-nav-btn" id="muteBtn" aria-label="Mute">${muted ? getMuteSvg() : getUnmuteSvg()}</button>
        </div>
      </div>
    `;
  }

function renderHelpOverlay(body){
  return window.VerseGameShell.helpOverlayHtml({
    id: HELP_OVERLAY_ID,
    title: "How to Play",
    body,
    closeText: "Close"
  });
}

function renderGameMenuOverlay(){
  return `
    <div class="vmunch-help-overlay" id="vmunchGameMenuOverlay" aria-hidden="true">
      <div class="vmunch-help-dialog vmunch-game-menu-dialog">
        <div class="vmunch-help-title vmunch-game-menu-title">Game Menu</div>
        <div class="vmunch-game-menu-actions">
          <button class="vm-btn vmunch-game-menu-btn" id="vmunchMenuHowToBtn">How to Play</button>
          <button class="vm-btn vmunch-game-menu-btn" id="vmunchMenuMuteBtn">${muted ? "Unmute" : "Mute"}</button>
          <button class="vm-btn vmunch-game-menu-btn" id="vmunchMenuExitBtn">Exit Game</button>
          <button class="vm-btn vmunch-game-menu-btn" id="vmunchMenuCloseBtn">Close</button>
        </div>
      </div>
    </div>
  `;
}

function wireCommonNav(){
  const homeBtn = document.getElementById("homeBtn");
  const helpBtn = document.getElementById("helpBtn");
  const muteBtn = document.getElementById("muteBtn");

  const helpOverlay = document.getElementById("vmunchHelpOverlay");
  const helpCloseBtn = document.getElementById("vmunchHelpCloseBtn");

  const menuOverlay = document.getElementById("vmunchGameMenuOverlay");
  const menuHowToBtn = document.getElementById("vmunchMenuHowToBtn");
  const menuMuteBtn = document.getElementById("vmunchMenuMuteBtn");
  const menuExitBtn = document.getElementById("vmunchMenuExitBtn");
  const menuCloseBtn = document.getElementById("vmunchMenuCloseBtn");

  if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();

window.VerseGameShell.wireHelp({
  id: HELP_OVERLAY_ID,
  triggerId: "helpBtn",
  closeText: "Close",
  onBack: backToMenuFromHelp,
  onClose: () => setPaused(false, "")
});

  if (muteBtn){
    muteBtn.onclick = () => {
      muted = !muted;
      muteBtn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      if (menuMuteBtn) menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
    };
  }

  if (menuHowToBtn){
    menuHowToBtn.onclick = () => {
      openHelpFromMenu();
    };
  }

  if (menuMuteBtn){
    menuMuteBtn.onclick = () => {
      muted = !muted;
      menuMuteBtn.textContent = muted ? "Unmute" : "Mute";
      if (muteBtn) muteBtn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
    };
  }

  if (menuExitBtn){
    menuExitBtn.onclick = () => window.VerseGameBridge.exitGame();
  }

  if (menuCloseBtn){
    menuCloseBtn.onclick = () => closeGameMenu();
  }

  if (menuOverlay){
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
  const menuOverlay = document.getElementById("vmunchGameMenuOverlay");
  if (menuOverlay){
    setPaused(true, "menu");
    menuOverlay.classList.add("is-open");
  }
}

function closeGameMenu(){
  const menuOverlay = document.getElementById("vmunchGameMenuOverlay");
  if (menuOverlay){
    menuOverlay.classList.remove("is-open");
  }
  const helpOverlay = document.getElementById("vmunchHelpOverlay");
  if (!helpOverlay || !helpOverlay.classList.contains("is-open")){
    setPaused(false, "");
  }
}

function openHelpFromMenu(){
  const menuOverlay = document.getElementById("vmunchGameMenuOverlay");

  if (menuOverlay) menuOverlay.classList.remove("is-open");

  window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");

  setPaused(true, "help");
}


function closeHelpOverlay(){
  window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);
  setPaused(false, "");
}

function backToMenuFromHelp(){
  window.VerseGameShell.closeHelp(HELP_OVERLAY_ID);

  const menuOverlay = document.getElementById("vmunchGameMenuOverlay");
  if (menuOverlay) menuOverlay.classList.add("is-open");

  setPaused(true, "menu");
}

  function wireGameInput(){
    const prevBtn = document.getElementById("vmunchPrevBtn");
    const nextBtn = document.getElementById("vmunchNextBtn");
    const choiceBtn = document.getElementById("vmunchChoiceBtn");

    prevBtn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (state.paused) return;
      rotateCarousel(-1);
    });
    nextBtn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (state.paused) return;
      rotateCarousel(1);
    });
    choiceBtn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (state.paused) return;
      handleCenteredSelection();
    });

    window.addEventListener("resize", recalcField);
    window.onkeydown = (e) => {
      if (!state.running || state.inputLocked || state.paused) return;
      if (e.key === "ArrowLeft"){
        e.preventDefault();
        rotateCarousel(-1);
      } else if (e.key === "ArrowRight"){
        e.preventDefault();
        rotateCarousel(1);
      } else if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        handleCenteredSelection();
      }
    };
  }

  function startLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);
  }

  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    window.onkeydown = null;
  }

  function loop(ts){
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.032, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    recalcField();

    if (!state.paused){
      updateIdle(dt);
      updateFlyingFood(dt);
      updateTrails(dt);
      updateParticles(dt);
      updateConfetti(dt);
    }

    renderFrame(ts);
    state.rafId = requestAnimationFrame(loop);
  }

  function recalcField(){
    const field = document.getElementById("vmunchField");
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.fieldWidth = rect.width;
    state.fieldHeight = rect.height;
    const t = clamp((rect.width - 360) / (920 - 360), 0, 1);
    state.scale = 1 + t * 0.25;
  }

  function updateIdle(dt){
    if (state.inputLocked || bonusRunning) return;
    state.idleTimer -= dt;
    if (state.idleTimer > 0) return;

    const variants = getIdleVariants();
    const variant = variants[Math.floor(Math.random() * variants.length)];
    state.faceClasses = new Set([variant]);
    state.idleTimer = getIdleDelay();

    setTimeout(() => {
      if (!state.inputLocked) state.faceClasses = new Set();
    }, 640);
  }

  function updateFlyingFood(dt){
    const food = state.flyingFood;
    if (!food) return;
    food.elapsed += dt;
    const t = clamp(food.elapsed / food.duration, 0, 1);
    const eased = easeOutCubic(t);
    food.x = lerp(food.startX, food.endX, eased);
    food.y = lerp(food.startY, food.endY, eased);
    food.scale = lerp(food.startScale, food.endScale, eased);
    if (t >= 1 && food.active) food.active = false;
  }

  function updateTrails(dt){
    for (const part of state.trails){
      part.age += dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
    }
    state.trails = state.trails.filter(part => part.age < part.life);
  }

  function updateParticles(dt){
    for (const p of state.particles){
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
    state.particles = state.particles.filter(p => p.age < p.life);
  }

  function updateConfetti(dt){
    for (const c of state.confetti){
      c.age += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += c.gravity * dt;
      c.rotation += c.spin * dt;
    }
    state.confetti = state.confetti.filter(c => c.age < c.life);
  }

  function rotateCarousel(dir){
    if (!state.running || state.inputLocked || !state.carouselItems.length) return;
    const len = state.carouselItems.length;
    state.carouselIndex = (state.carouselIndex + dir + len) % len;
    renderFrame(performance.now());
  }

  async function handleCenteredSelection(){
    if (!state.running || state.inputLocked || !state.carouselItems.length) return;
    const item = state.carouselItems[state.carouselIndex];
    if (!item) return;

    state.inputLocked = true;
    state.faceClasses = new Set();

    const currentCorrect = getCurrentCorrectLabel();
    const isCorrect = normalizeWord(item.label) === normalizeWord(currentCorrect);
    state.hitWord = {
      text:item.label,
      x:getChoiceCenterX(),
      y:getChoiceCenterY(),
      age:0,
      life:0.42
    };

    await playFoodLaunchAnimation(item);
    await playMouthOpenAnimation();
    await playChewAnimation();
    await playAnticipationAnimation();
    await playReactionAnimation(isCorrect);

    if (isCorrect){
      state.progressIndex += 1;
      state.streak += 1;
      spawnSuccessParticles();
    } else {
      state.streak = 0;
      state.buildShakeUntil = performance.now() + 280;
      spawnMissParticles();
    }

    state.emotionLevel = clamp(state.emotionLevel + (isCorrect ? 1 : -1), -3, 3);
    state.faceBase = getEmotionFace();
    state.faceDisplay = state.faceBase;
    state.faceClasses = new Set();
    state.feedbackBadge = isCorrect ? "Correct!" : "Nope!";
    state.feedbackUntil = performance.now() + 650;
    state.hitWord = null;

    if (getCurrentPhase() === "done"){
      await startBonusRound();
      await finishRun();
      return;
    }

    buildCarouselForCurrentStep();
    state.inputLocked = false;
    state.idleTimer = getIdleDelay();
    renderFrame(performance.now());
  }

  async function playFoodLaunchAnimation(item){
    const launchDuration = getTiming().launch;
    state.flyingFood = {
      emoji:item.food,
      label:item.label,
      startX:getFoodStartPoint().x,
      startY:getFoodStartPoint().y,
      endX:getMouthPoint().x,
      endY:getMouthPoint().y,
      x:getFoodStartPoint().x,
      y:getFoodStartPoint().y,
      startScale:1,
      endScale:2,
      scale:1,
      elapsed:0,
      duration:launchDuration,
      active:true
    };

    const trailTier = getTrailTier();
    if (trailTier > 0){
      const trailCount = 4 + trailTier * 2;
      for (let i = 0; i < trailCount; i++){
        state.trails.push({
          id:Math.random().toString(36).slice(2),
          emoji:randomFrom(TRAIL_EMOJIS),
          x:getFoodStartPoint().x,
          y:getFoodStartPoint().y,
          vx:-40 + Math.random() * 80,
          vy:-60 - Math.random() * 50,
          age:0,
          life:0.42 + trailTier * 0.08,
          size:16 + trailTier * 3 + Math.random() * 8
        });
      }
    }

    await waitSeconds(launchDuration * 0.84);
  }

  async function playMouthOpenAnimation(){
    state.faceDisplay = getOpenMouthFace();
    state.faceClasses = new Set(["is-open"]);
    await waitSeconds(getTiming().mouthOpen);
  }

  async function playChewAnimation(){
    const chewFaces = ["😀","😐","😀","😐","😀","😐"];
    const chewDuration = getTiming().chew;
    const stepDuration = chewDuration / chewFaces.length;

    state.faceClasses = new Set(["is-chew"]);
    state.flyingFood = null;
    spawnChewCrumbs();

    for (let i = 0; i < chewFaces.length; i++){
      state.faceDisplay = chewFaces[i];
      if (i === 3) spawnChewCrumbs(true);
      await waitSeconds(stepDuration);
    }
  }

  async function playAnticipationAnimation(){
    const faces = ["😕","🫤","😐","🤨"];
    const face = randomFrom(faces);
    state.faceDisplay = face;

    const steps = [
      "is-tilt-left",
      "is-tilt-right",
      "is-tilt-left-strong"
    ];

    for (const tiltClass of steps){
      state.faceClasses = new Set([tiltClass, "is-anticipation-lean-in"]);
      await waitSeconds(0.32);

      state.faceClasses = new Set([tiltClass]);
      await waitSeconds(0.12);
    }

    state.faceClasses = new Set();
  }

  async function playReactionAnimation(isCorrect){
    state.reactionFlash = isCorrect ? "is-flash-positive" : "is-flash-negative";
    state.reactionFlashUntil = performance.now() + (getTiming().reaction * 1000);

    if (isCorrect){
      const reaction = randomFrom(HAPPY_REACTIONS);
      state.faceDisplay = reaction;

      const animClass = randomFrom(POSITIVE_REACTIONS);
      state.faceClasses = new Set([animClass]);

      if (animClass === "is-react-sparkle-pop"){
        spawnReactionSparkles();
      }
    } else {
      const negativeOptions = [
        { face: "🤮", cls: "is-react-negative" },
        { face: "🤢", cls: "is-react-barf-bounce" },
        { face: "😵‍💫", cls: "is-react-head-no-hard" }
      ];

      const choice = randomFrom(negativeOptions);
      state.faceDisplay = choice.face;
      state.faceClasses = new Set([choice.cls]);
    }

    await waitSeconds(getTiming().reaction);
  }


  
  async function startBonusRound(){
    if (bonusRunning) return;
    bonusRunning = true;
    state.inputLocked = true;

    for (let i = 0; i < 5; i++){
      state.bonusCount = i + 1;
      const bonusItem = {
        label:"bonus",
        food:FOOD_EMOJIS[i % FOOD_EMOJIS.length]
      };
      state.faceScaleBoost = 1 + (i + 1) * 0.08;
      await playFoodLaunchAnimation(bonusItem);
      await playMouthOpenAnimation();
      await playChewAnimation();

      const bonusAnimClass = randomFrom(POSITIVE_REACTIONS);
      state.faceDisplay = randomFrom(HAPPY_REACTIONS);
      state.faceClasses = new Set([bonusAnimClass, "is-bonus"]);

      if (bonusAnimClass === "is-react-sparkle-pop"){
        spawnReactionSparkles();
      }

      spawnSuccessParticles(true);
      await waitSeconds(getTiming().bonusReaction);
    }

    spawnConfettiBurst();
    state.faceDisplay = "🥳";
    state.faceClasses = new Set(["is-react-victory-wiggle", "is-bonus"]);
    await waitSeconds(0.9);
  }

  async function finishRun(){
    if (completed) return;
    completed = true;
    state.running = false;

    try {
      await window.VerseGameBridge.markCompleted({
        verseId:ctx.verseId,
        gameId:GAME_ID,
        mode:selectedMode
      });
    } catch (err) {
      console.error("markCompleted failed", err);
    }

    renderComplete();
  }

  function seedBackground(){
    const bg = document.getElementById("vmunchBg");
    if (!bg) return;
    const bubbleCount = state.fieldWidth < 420 ? 8 : 12;
    let html = "";
    for (let i = 0; i < bubbleCount; i++){
      const size = 18 + Math.random() * 82;
      html += `<div class="bubble" style="width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;opacity:${0.04 + Math.random() * 0.10};transform:translate(-50%,-50%);"></div>`;
    }
    bg.innerHTML = html;
  }

  function renderFrame(ts){
    renderReactionFlash(ts);
    updateBuildText();
    renderBuildShake(ts);
    renderFace();
    renderSelector();
    renderFlight();
    renderTrails();
    renderParticles();
    renderConfetti();
    renderFeedback(ts);
    updateMenuPill();
    updateMoodPill();
  }

  function updateBuildText(){
    const el = document.getElementById("vmunchBuildText");
    if (!el) return;

    el.className = `vmunch-build-text ${state.buildSizeClass}`;

    el.innerHTML = state.segments.map((segment, index) => `
      <span class="vmunch-build-word ${index < state.progressIndex ? "is-built" : ""}">
        ${escapeHtml(segment)}
      </span>
    `).join(" ");
  }

  function renderBuildShake(ts){
    const build = document.getElementById("vmunchBuild");
    if (!build) return;
    build.classList.toggle("vmunch-build-shake", ts < state.buildShakeUntil);
  }

  function renderFace(){
    const face = document.getElementById("vmunchFace");
    const foodDisplay = document.getElementById("vmunchFoodDisplay");
    if (!face) return;

    face.className = "vmunch-face";
    for (const cls of state.faceClasses) face.classList.add(cls);
    const file = FACE_MAP[state.faceDisplay] || "";

    if (file !== state.lastFaceFile){
      if (file){
        face.innerHTML = `<img src="verse_munch_images/${file}" alt="">`;
      } else {
        face.innerHTML = "";
      }
      state.lastFaceFile = file;
    }
    face.style.transform = state.faceScaleBoost > 0 ? `scale(${state.faceScaleBoost})` : "";

    if (foodDisplay){
      if (state.inputLocked){
        foodDisplay.textContent = "";
      } else {
        foodDisplay.textContent = getCurrentFoodEmoji();
      }
    }
  }

  function renderSelector(){
    const row = document.querySelector(".vmunch-carousel-row");
    const choiceBtn = document.getElementById("vmunchChoiceBtn");
    const prevBtn = document.getElementById("vmunchPrevBtn");
    const nextBtn = document.getElementById("vmunchNextBtn");
    if (!choiceBtn) return;

    const item = state.carouselItems[state.carouselIndex];
    choiceBtn.textContent = item ? item.label : "";

    const locked = state.inputLocked || bonusRunning || !item;
    choiceBtn.disabled = locked;
    prevBtn.disabled = locked;
    nextBtn.disabled = locked;

    if (row){
      row.classList.toggle("is-hidden", locked);
    }
  }

  function renderFlight(){
    const layer = document.getElementById("vmunchFoodFlight");
    if (!layer) return;
    let html = "";
    if (state.flyingFood){
      html += `
        <div class="vmunch-flying-food" style="left:${state.flyingFood.x}px;top:${state.flyingFood.y}px;transform:translate(-50%,-50%) scale(${state.flyingFood.scale});">
          ${escapeHtml(state.flyingFood.emoji)}
        </div>
      `;
    }
    if (state.hitWord){
      html += `
        <div class="vmunch-hit-word" style="left:${state.hitWord.x}px;top:${state.hitWord.y}px;transform:translate(-50%,-50%);">
          ${escapeHtml(state.hitWord.text)}
        </div>
      `;
    }
    layer.innerHTML = html;
  }

  function renderTrails(){
    const layer = document.getElementById("vmunchTrails");
    if (!layer) return;
    layer.innerHTML = state.trails.map((part) => {
      const alpha = 1 - (part.age / part.life);
      return `<div class="vmunch-spark" style="left:${part.x}px;top:${part.y}px;opacity:${alpha};transform:translate(-50%,-50%) scale(${part.size / 24});">${part.emoji}</div>`;
    }).join("");
  }

  function renderParticles(){
    const layer = document.getElementById("vmunchParticles");
    if (!layer) return;
    layer.innerHTML = state.particles.map((p) => {
      const alpha = 1 - (p.age / p.life);
      if (p.type === "spark"){
        return `<div class="vmunch-spark" style="left:${p.x}px;top:${p.y}px;opacity:${alpha};transform:translate(-50%,-50%) scale(${p.size / 22});">${p.value}</div>`;
      }
      return `<div class="vmunch-trail-particle" style="left:${p.x}px;top:${p.y}px;width:${p.size}px;height:${p.size}px;opacity:${alpha};transform:translate(-50%,-50%);background:${p.color};"></div>`;
    }).join("");
  }

  function renderConfetti(){
    const layer = document.getElementById("vmunchConfetti");
    if (!layer) return;
    layer.innerHTML = state.confetti.map((c) => {
      const alpha = 1 - (c.age / c.life);
      return `<div class="vmunch-confetto" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;opacity:${alpha};background:${c.color};transform:translate(-50%,-50%) rotate(${c.rotation}deg);"></div>`;
    }).join("");
  }

  function renderReactionFlash(ts){
    const root = document.querySelector(".vmunch-root, .vmunch-mode-shell");
    if (!root) return;

    root.classList.remove("is-flash-positive", "is-flash-negative");

    if (state.reactionFlash && ts < state.reactionFlashUntil){
      root.classList.add(state.reactionFlash);
    }
  }

  function renderFeedback(ts){
    const layer = document.getElementById("vmunchFeedback");
    if (!layer) return;
    if (!state.feedbackBadge || ts > state.feedbackUntil){
      layer.innerHTML = "";
      return;
    }
    layer.innerHTML = `<div class="vmunch-feedback-badge">${escapeHtml(state.feedbackBadge)}</div>`;
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

  function buildCarouselForCurrentStep(){
    const phase = getCurrentPhase();
    if (phase === "done"){
      state.carouselItems = [];
      return;
    }

    const correctLabel = getCurrentCorrectLabel();
    const decoys = getDecoysForPhase(phase, correctLabel, 3);
    const labels = shuffle([correctLabel, ...decoys]);
    // pick 4 unique random foods
    const foods = shuffle(FOOD_EMOJIS).slice(0, labels.length);

    state.carouselItems = labels.map((label, index) => ({
      label,
      food:foods[index],
      type:phase === "words" ? "word" : phase === "book" ? "book" : "reference"
    }));
    state.carouselIndex = Math.floor(Math.random() * state.carouselItems.length);
  }

  function getDecoysForPhase(phase, correctLabel, count){
    const out = new Set();
    if (phase === "words"){
      const verseWords = state.words.map(normalizeWord);
      for (const word of shuffle(FUN_DECOYS)){
        if (out.size >= count) break;
        const normalized = normalizeWord(word);
        if (!verseWords.includes(normalized) && normalized !== normalizeWord(correctLabel)) out.add(word);
      }
    } else if (phase === "book"){
      for (const book of shuffle(BOOKS)){
        if (out.size >= count) break;
        if (book !== correctLabel) out.add(book);
      }
    } else if (phase === "reference"){
      const match = String(correctLabel).match(/^(\d+):(\d+)(?:-(\d+))?$/);
      const chapter = match ? Number(match[1]) : 1;
      const verseA = match ? Number(match[2]) : 1;
      const verseB = match && match[3] ? Number(match[3]) : null;
      let tries = 0;
      while (out.size < count && tries < 80){
        tries++;
        const c = Math.max(1, chapter + Math.floor(Math.random() * 5) - 2);
        const v = Math.max(1, verseA + Math.floor(Math.random() * 9) - 4);
        let label = `${c}:${v}`;
        if (verseB && Math.random() < 0.35){
          const end = Math.max(v + 1, verseB + Math.floor(Math.random() * 3) - 1);
          label = `${c}:${v}-${end}`;
        }
        if (label !== correctLabel) out.add(label);
      }
    }
    return Array.from(out).slice(0, count);
  }

  function spawnSuccessParticles(isBonus = false){
    const center = getMouthPoint();
    const count = isBonus ? 18 : 12;
    for (let i = 0; i < count; i++){
      state.particles.push({
        type:Math.random() < 0.5 ? "spark" : "dot",
        value:randomFrom(TRAIL_EMOJIS),
        x:center.x + (Math.random() * 24 - 12),
        y:center.y + (Math.random() * 24 - 12),
        vx:-140 + Math.random() * 280,
        vy:-180 + Math.random() * 160,
        gravity:220,
        age:0,
        life:0.75 + Math.random() * 0.25,
        size:12 + Math.random() * 16,
        color:randomFrom(["#ffc751", "#ff5a51", "#40b9c5", "#a7cb6f", "#ffffff"])
      });
    }
  }

  function spawnMissParticles(){
    const center = getMouthPoint();
    for (let i = 0; i < 10; i++){
      state.particles.push({
        type:i % 2 === 0 ? "spark" : "dot",
        value:i % 2 === 0 ? "💨" : "🫧",
        x:center.x + (Math.random() * 24 - 12),
        y:center.y + (Math.random() * 18 - 9),
        vx:-120 + Math.random() * 240,
        vy:-40 + Math.random() * 130,
        gravity:260,
        age:0,
        life:0.45 + Math.random() * 0.2,
        size:11 + Math.random() * 8,
        color:randomFrom(["#ffffff", "#e8e4ff", "#ffcad0"])
      });
    }
  }

function spawnChewCrumbs(isSecondary = false){
  const center = getMouthPoint();
  const crumbColors = ["#f6dfa6", "#f7c96d", "#fff4cf", "#f4b66a", "#ffffff"];
  const countPerSide = isSecondary ? 4 : 6;
  const s = state.scale || 1;

  for (const dir of [-1, 1]){
    for (let i = 0; i < countPerSide; i++){
      const speedX = (90 + Math.random() * (isSecondary ? 60 : 90)) * s;
      const speedY = (45 + Math.random() * 70) * s;

      state.particles.push({
        type: "dot",
        x: center.x + dir * (6 + Math.random() * 8) * s,
        y: center.y + (Math.random() * 12 - 4) * s,
        vx: dir * speedX,
        vy: -speedY,
        gravity: (240 + Math.random() * 80) * s,
        age: 0,
        life: 0.34 + Math.random() * 0.18,
        size: (6 + Math.random() * 7) * s,
        color: randomFrom(crumbColors)
      });
    }
  }
}

  function spawnConfettiBurst(){
    const centerX = state.fieldWidth * 0.5;
    const centerY = state.fieldHeight * 0.32;
    for (let i = 0; i < 70; i++){
      state.confetti.push({
        x:centerX,
        y:centerY,
        vx:-220 + Math.random() * 440,
        vy:-260 + Math.random() * 130,
        gravity:380,
        age:0,
        life:1.5 + Math.random() * 0.8,
        w:7 + Math.random() * 9,
        h:12 + Math.random() * 12,
        color:randomFrom(["#ff5a51", "#ffc751", "#40b9c5", "#a7cb6f", "#ffffff", "#7f66c6"]),
        rotation:Math.random() * 180,
        spin:-340 + Math.random() * 680
      });
    }
  }

  function spawnReactionSparkles(){
    const center = getMouthPoint();
    const sparks = ["✨","⭐","💫","🌟"];

    for (let i = 0; i < 6; i++){
      state.particles.push({
        type: "spark",
        value: randomFrom(sparks),
        x: center.x + (Math.random()*20 - 10),
        y: center.y - 20 + (Math.random()*10),
        vx: -60 + Math.random()*120,
        vy: -120 + Math.random()*80,
        gravity: 180,
        age: 0,
        life: 0.5 + Math.random()*0.2,
        size: 12 + Math.random()*8,
        color: "#fff"
      });
    }
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

  function setupReferenceSegments(){
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    state.bookLabel = parsed.book || "";
    state.referenceLabel = parsed.reference || "";
    state.buildSizeClass = getBuildSizeClass(ctx.verseText, state.bookLabel, state.referenceLabel);

    state.segments = [...state.words];
    if (state.bookLabel) state.segments.push(state.bookLabel);
    if (state.referenceLabel) state.segments.push(state.referenceLabel);
  }

  function getOpenMouthFace(){
    if (state.emotionLevel >= 2) return "😄";
    if (state.emotionLevel >= 0) return "😮";
    return "😦";
  }

  function getEmotionFace(){
    return EMOTION_FACE[String(state.emotionLevel)] || "😐";
  }

  function getMoodLabel(){
    return EMOTION_LABEL[String(state.emotionLevel)] || "Calm";
  }

  function getIdleVariants(){
    if (state.emotionLevel >= 2) return ["is-idle-bob", "is-idle-sway", "is-idle-wiggle"];
    if (state.emotionLevel <= -2) return ["is-idle-blink", "is-idle-sway"];
    return ["is-idle-bob", "is-idle-blink", "is-idle-sway"];
  }

  function getPositiveCaption(){
    if (getCurrentPhase() === "book") return "Book unlocked!";
    if (getCurrentPhase() === "reference") return "Reference unlocked!";
    if (state.progressIndex >= state.words.length) return "Verse complete! Keep feeding the reference.";
    return state.streak >= 4 ? "Yum. On a roll!" : "Nice bite!";
  }

  function getNegativeCaption(chosen, correct){
    if (getCurrentPhase() === "book") return `Not ${chosen}. The right book is still hiding.`;
    if (getCurrentPhase() === "reference") return `${chosen} was off. Try the right reference.`;
    return `Not ${chosen}. Looking for ${correct}.`;
  }


  function updateMenuPill(){
    const pill = document.getElementById("vmunchMenuPill");
    if (!pill) return;
    pill.textContent = "☰";
    pill.setAttribute("aria-label", "Game Menu");
    pill.onclick = () => openGameMenu();
  }

  function updateMoodPill(){
    const pill = document.getElementById("vmunchMoodPill");
    if (!pill) return;
    pill.textContent = getMoodLabel();
  }

  function getTrailTier(){
    if (state.streak < 2) return 0;
    if (state.streak < 4) return 1;
    if (state.streak < 7) return 2;
    return 3;
  }

  function getTiming(){
    if (selectedMode === "hard"){
      return { launch:0.34, mouthOpen:0.14, chew:0.80, anticipation:0.22, reaction:0.36, bonusReaction:0.22 };
    }
    if (selectedMode === "medium"){
      return { launch:0.40, mouthOpen:0.16, chew:0.80, anticipation:0.26, reaction:0.40, bonusReaction:0.24 };
    }
    return { launch:0.46, mouthOpen:0.18, chew:0.80, anticipation:0.30, reaction:0.46, bonusReaction:0.28 };
  }

  function getIdleDelay(){
    if (selectedMode === "hard") return 1.3 + Math.random() * 1.0;
    if (selectedMode === "medium") return 1.6 + Math.random() * 1.1;
    return 1.9 + Math.random() * 1.2;
  }

  function getCurrentFoodEmoji(){
    const item = state.carouselItems[state.carouselIndex];
    if (!item) return bonusRunning ? FOOD_EMOJIS[state.bonusCount % FOOD_EMOJIS.length] : FOOD_EMOJIS[state.progressIndex % FOOD_EMOJIS.length];
    return item.food;
  }

  function getFoodStartPoint(){
    const el = document.getElementById("vmunchFoodDisplay");
    const field = document.getElementById("vmunchField");
    if (!el || !field){
      return { x:state.fieldWidth * 0.5, y:state.fieldHeight * 0.68 };
    }
    const rect = el.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    return {
      x:rect.left - fieldRect.left + rect.width * 0.5,
      y:rect.top - fieldRect.top + rect.height * 0.5
    };
  }

  function getChoiceCenterX(){
    const btn = document.getElementById("vmunchChoiceBtn");
    const field = document.getElementById("vmunchField");
    if (!btn || !field) return state.fieldWidth * 0.5;
    const rect = btn.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    return rect.left - fieldRect.left + rect.width * 0.5;
  }

  function getChoiceCenterY(){
    const btn = document.getElementById("vmunchChoiceBtn");
    const field = document.getElementById("vmunchField");
    if (!btn || !field) return state.fieldHeight * 0.82;
    const rect = btn.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    return rect.top - fieldRect.top + rect.height * 0.5;
  }

function getMouthPoint(){
  const face = document.getElementById("vmunchFace");
  const field = document.getElementById("vmunchField");

  if (!face || !field){
    return {
      x: state.fieldWidth * 0.5,
      y: state.fieldHeight * 0.42
    };
  }

  const faceRect = face.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();

  return {
    x: faceRect.left - fieldRect.left + faceRect.width * 0.5,
    y: faceRect.top - fieldRect.top + faceRect.height * 0.64
  };
}

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
  }

  function normalizeWord(word){
    return String(word || "").toLowerCase().replace(/[^a-z0-9']/g, "");
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();

    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch){
      return {
        book:titleCaseBookFromSlug(idRangeMatch[1]),
        reference:`${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}`
      };
    }

    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch){
      return {
        book:titleCaseBookFromSlug(idMatch[1]),
        reference:`${idMatch[2]}:${idMatch[3]}`
      };
    }

    let raw = String(ref || "").trim();
    const trans = String(translation || "").trim();
    if (trans){
      raw = raw.replace(new RegExp(`\\s*\\(?${trans.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\)?\\s*$`, "i"), "").trim();
    }

    const match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
    if (match){
      return { book:match[1].trim(), reference:match[2].trim() };
    }

    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0){
      return {
        book:raw.slice(0, lastSpace).trim(),
        reference:raw.slice(lastSpace + 1).trim()
      };
    }

    return { book:raw, reference:"" };
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

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function capitalize(str){ return String(str).charAt(0).toUpperCase() + String(str).slice(1); }
  function randomFrom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function waitSeconds(seconds){ return new Promise(resolve => setTimeout(resolve, seconds * 1000)); }

  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
