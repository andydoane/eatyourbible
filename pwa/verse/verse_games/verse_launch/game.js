(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell", "vl-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "chain";
  const GAME_TITLE = "Verse Launch";

  const ROCKETS = [
    { key:"red", src:"./verse_launch_images/verse_launch_rocket_red.png", color:"#ff5a51", textDark:false },
    { key:"blue", src:"./verse_launch_images/verse_launch_rocket_blue.png", color:"#64b5f6", textDark:false },
    { key:"yellow", src:"./verse_launch_images/verse_launch_rocket_yellow.png", color:"#ffc751", textDark:true }
  ];

  const FUN_DECOYS = [
    "taco","banana","penguin","cupcake","dinosaur","pickle","marshmallow","noodle","waffle","rocket",
    "jellybean","pancake","popcorn","unicorn","bubble","muffin","otter","kangaroo","scooter","rainbow",
    "pretzel","monkey","donut","cookie","balloon","zebra","narwhal","kitten","puppy","burrito",
    "pirate","robot","slipper","backpack","bongo","volcano","watermelon","cheeseburger","toothbrush","snowman"
  ];
  const BIBLE_BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther",
    "Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
    "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
    "Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
    "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const state = {
    screen:"intro",
    mode:null,
    words:[],
    segments:[],
    metaIndices:new Set(),
    buildSizeClass:"is-normal",
    progressIndex:0,
    buildRemoving:new Set(),
    choices:[],
    choiceIndex:0,
    busy:false,
    menuOpen:false,
    helpOpen:false,
    helpBackMode:false,
    completed:false,
    startTime:0,
    endTime:0,
    bookLabel:"",
    referenceLabel:"",
    medalMessage:"",
    medalSubmessage:"",
    countdownValue:"",
        bonusReady:false,
    bonusTravelTextVisible:false,
    bonusFadeActive:false,
    bonusRocketColorKey:"red",
    bonusOutcome:"",
    bonusMedalAlreadyEarned:false,

    astroHits:0,
    astroInvulnerable:false,
    astroTimerMs:0,
    astroPlayerX:0.5,
    astroMoveDir:0,
    astroPlayerTilt:0,
    astroSpinDeg:0,
    astroSpinMs:0,
    astroAsteroids:[],
    astroRunning:false,
    astroMoonPhase:false,
    astroMoonY:-240,
    astroMoonDone:false,
    astroLandingPhase:false,
    astroPlayerLiftPx:0,
    astroPlayerScale:1,
    astroLastTs:0,
    astroRaf:0,
  };

  let muted = false;

  const ASTRO_DURATION_MS = 30000;
  const ASTRO_HITBOX_SCALE = 0.5;
  const ASTRO_BASE_SPEED_VH_PER_SEC = 42;
  const ASTRO_MODE_MULTIPLIER = { easy:1, medium:1.18, hard:1.38 };

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function escapeHtml(str){
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function tokenizeVerse(text){ return String(text||"").trim().split(/\s+/).filter(Boolean); }
  function normalizeWord(word){ return String(word||"").toLowerCase(); }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of","the"]);
    return String(slug||"").split("_").filter(Boolean).map((part,index)=>{
      const lower = part.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(" ");
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();
    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch) return { book:titleCaseBookFromSlug(idRangeMatch[1]), reference:`${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}` };
    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch) return { book:titleCaseBookFromSlug(idMatch[1]), reference:`${idMatch[2]}:${idMatch[3]}` };

    let raw = String(ref || "").trim();
    const trans = String(translation || "").trim();
    const KNOWN = ["ESV","NIV","NLT","KJV","NKJV","CSB","HCSB","NASB","NASB95","LSB","AMP","RSV","NRSV","NRSVUE","NET","MSG","GW","CEV","GNT","ERV","ICB"];

    function strip(text){
      let out = String(text || "").trim();
      if (!out) return out;
      if (trans){
        const escapedTrans = trans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        out = out.replace(new RegExp(`\\s*\\(?${escapedTrans}\\)?\\s*$`, "i"), "").trim();
      }
      for (const code of KNOWN){
        const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        out = out.replace(new RegExp(`\\s*\\(?${escaped}\\)?\\s*$`, "i"), "").trim();
      }
      return out.replace(/\s+\(?[A-Z]{2,8}\)?\s*$/, "").trim();
    }

    raw = strip(raw);
    const match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
    if (match) return { book:match[1].trim(), reference:match[2].trim() };
    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0) return { book:raw.slice(0,lastSpace).trim(), reference:raw.slice(lastSpace+1).trim() };
    return { book:raw, reference:"" };
  }

  function getBuildLengthScore(verseText, book, reference){
    return String(verseText||"").length + String(book||"").length + String(reference||"").length;
  }
  function getBuildSizeClass(verseText, book, reference){
    const score = getBuildLengthScore(verseText, book, reference);
    if (score >= 136) return "is-small";
    if (score >= 106) return "is-medium";
    return "is-normal";
  }

  function initVerseData(){
    state.words = tokenizeVerse(ctx.verseText);
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    state.bookLabel = parsed.book || "";
    state.referenceLabel = parsed.reference || "";
    state.buildSizeClass = getBuildSizeClass(ctx.verseText, state.bookLabel, state.referenceLabel);
    state.segments = [...state.words];
    state.metaIndices = new Set();
    if (state.bookLabel){ state.metaIndices.add(state.segments.length); state.segments.push(state.bookLabel); }
    if (state.referenceLabel){ state.metaIndices.add(state.segments.length); state.segments.push(state.referenceLabel); }
    state.progressIndex = 0;
    state.buildRemoving = new Set();
    state.choices = [];
    state.choiceIndex = 0;
    state.busy = false;
    state.menuOpen = false;
    state.helpOpen = false;
    state.helpBackMode = false;
    state.completed = false;
    state.medalMessage = "";
    state.medalSubmessage = "";
    state.countdownValue = "";
    state.bonusReady = false;
    state.bonusTravelTextVisible = false;
    state.bonusFadeActive = false;
    state.bonusRocketColorKey = "red";
    state.bonusOutcome = "";
    state.bonusMedalAlreadyEarned = false;

    state.astroHits = 0;
    state.astroInvulnerable = false;
    state.astroTimerMs = 0;
    state.astroPlayerX = 0.5;
    state.astroMoveDir = 0;
    state.astroPlayerTilt = 0;
    state.astroSpinDeg = 0;
    state.astroSpinMs = 0;
    state.astroAsteroids = [];
    state.astroRunning = false;
    state.astroMoonPhase = false;
    state.astroMoonY = -340;
    state.astroMoonDone = false;
    state.astroLandingPhase = false;
    state.astroPlayerLiftPx = 0;
    state.astroPlayerScale = 1;
    state.astroLastTs = 0;
    if (state.astroRaf){
      cancelAnimationFrame(state.astroRaf);
      state.astroRaf = 0;
    }
  }

  function currentPhase(){
    if (state.progressIndex < state.words.length) return "words";
    if (state.progressIndex === state.words.length && state.bookLabel) return "book";
    if (state.progressIndex < state.segments.length) return "reference";
    return "done";
  }
  function currentCorrectLabel(){ return state.segments[state.progressIndex] || ""; }

  function uniqueVisibleChoices(correct, decoys){
    const out = [correct];
    const seen = new Set([normalizeWord(correct)]);
    for (const d of decoys){
      const key = normalizeWord(d);
      if (!key || seen.has(key)) continue;
      seen.add(key); out.push(d);
      if (out.length >= 3) break;
    }
    return out;
  }
  function verseWordDecoys(correct){
    const uniqueVerseWords = Array.from(new Set(state.words.map(normalizeWord)));
    const mapped = [];
    for (const key of uniqueVerseWords){
      if (key === normalizeWord(correct)) continue;
      const original = state.words.find(w => normalizeWord(w) === key);
      if (original) mapped.push(original);
    }
    return shuffle(mapped);
  }
  function easyDecoys(correct){
    const verseWords = new Set(state.words.map(normalizeWord));
    return shuffle(FUN_DECOYS.filter(word => !verseWords.has(normalizeWord(word)) && normalizeWord(word) !== normalizeWord(correct)));
  }
  function bookDecoys(correct){ return shuffle(BIBLE_BOOKS.filter(book => normalizeWord(book) !== normalizeWord(correct))); }
  function refDecoys(correctRef){
    const out = [];
    const match = String(correctRef || "").match(/^(\d+):(\d+)(.*)$/);
    if (match){
      const chapter = parseInt(match[1],10);
      const verse = parseInt(match[2],10);
      const suffix = match[3] || "";
      const candidates = [
        `${chapter}:${Math.max(1, verse - 1)}${suffix}`,
        `${chapter}:${verse + 1}${suffix}`,
        `${Math.max(1, chapter - 1)}:${verse}${suffix}`,
        `${chapter + 1}:${verse}${suffix}`,
        `${chapter}:${verse + 2}${suffix}`,
        `${chapter + 1}:${verse + 1}${suffix}`
      ];
      for (const candidate of candidates){ if (candidate !== correctRef && !out.includes(candidate)) out.push(candidate); }
    }
    for (const fallback of ["1:1","3:16","8:28","23:1","5:13","4:12"]){ if (fallback !== correctRef && !out.includes(fallback)) out.push(fallback); }
    return shuffle(out);
  }

  function buildChoices(){
    const correct = currentCorrectLabel();
    const phase = currentPhase();
    let decoyPool = [];
    if (phase === "words"){
      decoyPool = state.mode === "easy" ? easyDecoys(correct) : verseWordDecoys(correct);
      if (decoyPool.length < 2) decoyPool = decoyPool.concat(easyDecoys(correct));
    } else if (phase === "book"){
      decoyPool = bookDecoys(correct);
    } else if (phase === "reference"){
      decoyPool = refDecoys(correct);
    }
    const labels = uniqueVisibleChoices(correct, decoyPool).slice(0,3);
    while (labels.length < 3){
      const fallback = phase === "book" ? bookDecoys(correct) : easyDecoys(correct);
      for (const item of fallback){
        if (labels.map(normalizeWord).includes(normalizeWord(item))) continue;
        labels.push(item);
        if (labels.length >= 3) break;
      }
    }
    const skins = shuffle(ROCKETS).slice(0,3);
    state.choices = shuffle(labels).map((label, index) => ({
      id:`choice_${index}_${Date.now()}`,
      label,
      isCorrect: normalizeWord(label) === normalizeWord(correct),
      rocket: skins[index]
    }));
    state.choiceIndex = 1;
  }

  function renderBuildText(){
    return state.segments.map((segment, index) => {
      const built = index < state.progressIndex;
      const meta = state.metaIndices.has(index);
      const removing = state.buildRemoving.has(index);
      return `<span class="vl-build-word ${built ? "is-built" : ""} ${meta ? "is-meta" : ""} ${removing ? "is-removing" : ""}">${escapeHtml(segment)}</span>`;
    }).join(" ");
  }
  function formatMode(mode){ return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Mode"; }
  function totalElapsedMs(){ return Math.max(1, (state.endTime || performance.now()) - state.startTime); }

function renderModeNav(){
  return `
    <div class="vl-nav-wrap">
      <div class="vl-nav">
        <button class="vl-nav-btn no-zoom" id="vlHomeBtn" aria-label="Home">⌂</button>
        <div class="vl-nav-center">
          <button class="vl-help-btn no-zoom" id="vlHelpBtn" type="button">HELP</button>
        </div>
        <button class="vl-nav-btn no-zoom" id="vlMuteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
      </div>
    </div>
  `;
}

  function renderHelpOverlay(){
    return `
      <div class="vl-help-overlay ${state.helpOpen ? "show" : ""}" id="vlHelpOverlay" aria-hidden="${state.helpOpen ? "false" : "true"}">
        <div class="vl-help-dialog">
          <div class="vl-help-title">How to Play Verse Launch</div>
          <div class="vl-help-body">
            Find the next correct word and launch it into the verse.<br><br>
            Easy: fun decoys.<br>
            Medium: decoys are other words from the verse.<br>
            Hard: same as Medium, but wrong launches remove up to 2 built words.<br><br>
            After the verse words, launch the book, then the reference.
          </div>
          <div class="vl-help-actions">
            <button class="vl-help-close no-zoom" id="vlHelpCloseBtn" type="button">${state.helpBackMode ? "Back" : "OK"}</button>
          </div>
        </div>
      </div>`;
  }

  function renderGameMenuOverlay(){
    return `
      <div class="vl-help-overlay ${state.menuOpen ? "show" : ""}" id="vlGameMenuOverlay" aria-hidden="${state.menuOpen ? "false" : "true"}">
        <div class="vl-help-dialog">
          <div class="vl-help-title vl-game-menu-title">Game Menu</div>
          <div class="vl-game-menu-actions">
            <button class="vl-game-menu-btn no-zoom" id="vlMenuHowToBtn" type="button">How to Play</button>
            <button class="vl-game-menu-btn no-zoom" id="vlMenuMuteBtn" type="button">${muted ? "Unmute" : "Mute"}</button>
            <button class="vl-game-menu-btn no-zoom" id="vlMenuExitBtn" type="button">Exit Game</button>
            <button class="vl-game-menu-btn no-zoom" id="vlMenuCloseBtn" type="button">Close</button>
          </div>
        </div>
      </div>`;
  }

  function renderCountdownOverlay(){
    if (!state.countdownValue) return "";
    return `
      <div class="vl-countdown-overlay" aria-hidden="true">
        <div class="vl-countdown-box is-pop">${escapeHtml(state.countdownValue)}</div>
      </div>`;
  }

  function getPreviewChoice(offset){
    if (!state.choices.length) return null;
    const total = state.choices.length;
    return state.choices[(state.choiceIndex + offset + total) % total];
  }

  function renderLauncher(choice, preview=false){
    if (!choice) return "";
    return `
      <div class="${preview ? "vl-side-preview" : "vl-main-launcher"} no-zoom" data-choice-id="${choice.id}">
        <div class="${preview ? "" : "vl-rocket-stack"}">
          <img class="${preview ? "vl-preview-rocket" : "vl-rocket"}" src="${choice.rocket.src}" alt="" />
          ${preview ? "" : `<button class="vl-launcher-hitbox no-zoom" data-choice-id="${choice.id}" type="button" aria-label="Launch ${escapeHtml(choice.label)}"></button>`}
        </div>
        <div class="${preview ? "vl-preview-bubble" : `vl-choice-bubble ${choice.rocket.textDark ? "vl-text-dark" : ""}`}" style="--bubble:${choice.rocket.color}">${escapeHtml(choice.label)}</div>
      </div>`;
  }

  function renderIntro(){
    app.innerHTML = `
      <div class="vl-mode-shell">
        <div class="vl-mode-stage">
          <div class="vl-mode-top">
            <div style="font-size:72px;line-height:1;">🚀</div>
            <div class="vl-mode-title">${GAME_TITLE}</div>
            <div class="vl-mode-subtitle">Launch the next correct word into the verse, then launch the book, then the reference.</div>
            <div class="vl-mode-card"><div class="vl-mode-actions"><button class="vm-btn no-zoom" id="vlStartBtn">Start</button></div></div>
          </div>
        </div>
        ${renderModeNav()}
        ${renderHelpOverlay()}
      </div>`;
    wireModeNav();
    $("#vlStartBtn").onclick = () => setScreen("mode");
  }

  function renderMode(){
    app.innerHTML = `
      <div class="vl-mode-shell">
        <div class="vl-mode-stage">
          <div class="vl-mode-top">
            <div class="vl-mode-title">🚀 ${GAME_TITLE}</div>
            <div class="vl-mode-subtitle">Choose your difficulty.</div>
            <div class="vl-mode-card"><div class="vl-mode-actions">
              <button class="vm-btn no-zoom" data-mode="easy">Easy</button>
              <button class="vm-btn no-zoom" data-mode="medium">Medium</button>
              <button class="vm-btn no-zoom" data-mode="hard">Hard</button>
            </div></div>
          </div>
        </div>
        ${renderModeNav()}
        ${renderHelpOverlay()}
      </div>`;
    wireModeNav();
    document.querySelectorAll("[data-mode]").forEach(btn => {
      btn.onclick = () => {
        state.mode = btn.dataset.mode;
        initVerseData();
        state.startTime = performance.now();
        buildChoices();
        setScreen("game");
      };
    });
  }

  function renderGame(){
    const center = getPreviewChoice(0);

    const bonusRocket = getBonusRocket();
    const launcherMarkup = state.bonusReady
      ? `
        <div class="vl-main-launcher no-zoom" data-choice-id="bonus_launch">
          <div class="vl-rocket-stack">
            <img class="vl-rocket" src="${bonusRocket.src}" alt="" />
            <button class="vl-launcher-hitbox no-zoom" data-choice-id="bonus_launch" type="button" aria-label="Launch to space"></button>
          </div>
          <button class="vl-star-launch-btn no-zoom" data-choice-id="bonus_launch" type="button">⭐ LAUNCH</button>
        </div>`
      : renderLauncher(center, false);

    app.innerHTML = `
      <div class="vl-root">
        <div class="vl-stage">
          <div class="vl-build-wrap"><div class="vl-build ${state.buildRemoving.size ? "vl-shake" : ""}" id="vlBuild"><div class="vl-build-text ${state.buildSizeClass}" id="vlBuildText">${renderBuildText()}</div></div></div>
          <div class="vl-game-wrap">
            <div class="vl-game-board" id="vlBoard">
              <div class="vl-red-flash" id="vlRedFlash"></div>
              <div class="vl-flight-layer" id="vlFlightLayer"></div>
              <div class="vl-smoke-layer" id="vlSmokeLayer"></div>
              <div class="vl-firework-layer" id="vlFireworkLayer"></div>
              <div class="vl-board-content">
                <div class="vl-overlay-pills"><button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button></div>
                <div class="vl-launch-area">
                  <div class="vl-flight-space">
                    ${renderCountdownOverlay()}
                  </div>
                  <div class="vl-launcher-band">
                    <div class="vl-carousel">
                      <button class="vl-arrow no-zoom" id="vlPrevBtn" type="button" aria-label="Previous launcher">‹</button>
                      <div class="vl-main-launcher-wrap">
                        <div>
                          ${launcherMarkup}
                        </div>
                      </div>
                      <button class="vl-arrow no-zoom" id="vlNextBtn" type="button" aria-label="Next launcher">›</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireGameScreen();
  }

  function renderTravel(){
    const rocket = getBonusRocket();
    app.innerHTML = `
      <div class="vl-travel-screen">
        <div class="vl-bonus-topbar">
          <button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button>
        </div>
        <div class="vl-bonus-stage" id="vlTravelStage">
          <div class="vl-travel-smoke" id="vlTravelSmoke"></div>
          <div class="vl-travel-vignette"></div>
          <img class="vl-travel-rocket" id="vlTravelRocket" src="${rocket.src}" alt="">
          <div class="vl-travel-text ${state.bonusTravelTextVisible ? "is-visible" : ""}" id="vlTravelText">Reach the moon! Watch out for asteroids!</div>
          <div class="vl-screen-fade ${state.bonusFadeActive ? "is-active" : ""}"></div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireBonusMenuOnly();
  }

  function renderAsteroidGame(){
    const rocket = getBonusRocket();
    app.innerHTML = `
      <div class="vl-asteroid-screen">
        <div class="vl-bonus-topbar">
          <button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button>
        </div>
        <div class="vl-bonus-stage" id="vlAstroStage">
          <div class="vl-space-layer" id="vlSpaceLayer">
            <img class="vl-moon" id="vlMoon" src="./verse_launch_images/verse_launch_moon.png" alt="">
          </div>
          <div class="vl-player-trail" id="vlPlayerTrail"></div>
          <img class="vl-player-rocket" id="vlPlayerRocket" src="${rocket.src}" alt="">
          <div class="vl-space-status">
            <span class="vl-hit-pip ${state.astroHits >= 1 ? "is-on" : ""}"></span>
            <span class="vl-hit-pip ${state.astroHits >= 2 ? "is-on" : ""}"></span>
            <span class="vl-hit-pip ${state.astroHits >= 3 ? "is-on" : ""}"></span>
          </div>
          <div class="vl-space-controls">
            <button class="vl-space-arrow no-zoom" id="vlLeftBtn" type="button" aria-label="Move left">‹</button>
            <button class="vl-space-arrow no-zoom" id="vlRightBtn" type="button" aria-label="Move right">›</button>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireBonusMenuOnly();
    wireAstroControls();
  }

  function renderEnd(){
    const timeSecs = (totalElapsedMs() / 1000).toFixed(1);
    app.innerHTML = `
      <div class="vl-mode-shell">
        <div class="vl-mode-stage">
          <div class="vl-end-card">
            <div class="vl-end-title">${escapeHtml(state.medalMessage || "Great job!")}</div>
            <div class="vl-end-sub">${escapeHtml(state.medalSubmessage || "You finished Verse Launch!")}</div>
            <div class="vl-end-stats">Mode: ${escapeHtml(formatMode(state.mode))} · Time: ${timeSecs}s</div>
            <div class="vl-mode-card"><div class="vl-mode-actions">
              <button class="vm-btn no-zoom" id="vlPlayAgainBtn">Play Again</button>
              <button class="vm-btn no-zoom" id="vlExitBtn">Exit Game</button>
            </div></div>
          </div>
        </div>
      </div>`;
    $("#vlPlayAgainBtn").onclick = () => { initVerseData(); state.startTime = performance.now(); buildChoices(); setScreen("game"); };
    $("#vlExitBtn").onclick = () => window.VerseGameBridge.exitGame();
  }

  function wireModeNav(){
    const homeBtn = $("#vlHomeBtn"), helpBtn = $("#vlHelpBtn"), muteBtn = $("#vlMuteBtn");
    const helpOverlay = $("#vlHelpOverlay"), helpCloseBtn = $("#vlHelpCloseBtn");
    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (helpBtn) helpBtn.onclick = () => { state.helpOpen = true; state.helpBackMode = false; render(); };
    if (helpCloseBtn) helpCloseBtn.onclick = () => { state.helpOpen = false; state.helpBackMode = false; render(); };
    if (helpOverlay) helpOverlay.onclick = (e) => { if (e.target === helpOverlay){ state.helpOpen = false; state.helpBackMode = false; render(); } };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
  }

  function prevChoice(){ if (state.busy || state.completed || !state.choices.length) return; state.choiceIndex = (state.choiceIndex - 1 + state.choices.length) % state.choices.length; render(); }
  function nextChoice(){ if (state.busy || state.completed || !state.choices.length) return; state.choiceIndex = (state.choiceIndex + 1) % state.choices.length; render(); }

  function wireGameScreen(){
    const menuPill = $("#vlMenuPill");
    if (menuPill) menuPill.onclick = (e) => { e.stopPropagation(); if (state.busy) return; state.menuOpen = true; state.helpOpen = false; state.helpBackMode = false; render(); };
    const prevBtn = $("#vlPrevBtn"), nextBtn = $("#vlNextBtn");
    if (prevBtn) prevBtn.onclick = prevChoice;
    if (nextBtn) nextBtn.onclick = nextChoice;
    document.querySelectorAll("[data-choice-id]").forEach(el => { el.onclick = () => handleLaunch(el.dataset.choiceId); });

    const menuOverlay = $("#vlGameMenuOverlay"), helpOverlay = $("#vlHelpOverlay"), closeHelp = $("#vlHelpCloseBtn");
    const howTo = $("#vlMenuHowToBtn"), muteBtn = $("#vlMenuMuteBtn"), exitBtn = $("#vlMenuExitBtn"), closeBtn = $("#vlMenuCloseBtn");
    if (howTo) howTo.onclick = () => { state.menuOpen = false; state.helpOpen = true; state.helpBackMode = true; render(); };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
    if (exitBtn) exitBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (closeBtn) closeBtn.onclick = () => { state.menuOpen = false; render(); };
    if (menuOverlay) menuOverlay.onclick = (e) => { if (e.target === menuOverlay){ state.menuOpen = false; render(); } };
    if (closeHelp) closeHelp.onclick = () => { if (state.helpBackMode){ state.helpOpen = false; state.menuOpen = true; state.helpBackMode = false; } else { state.helpOpen = false; } render(); };
    if (helpOverlay) helpOverlay.onclick = (e) => { if (e.target === helpOverlay){ if (state.helpBackMode){ state.helpOpen = false; state.menuOpen = true; state.helpBackMode = false; } else { state.helpOpen = false; } render(); } };
  }

  function wireBonusMenuOnly(){
    const menuPill = $("#vlMenuPill");
    if (menuPill) menuPill.onclick = (e) => {
      e.stopPropagation();
      state.menuOpen = true;
      state.helpOpen = false;
      state.helpBackMode = false;
      state.astroMoveDir = 0;
      render();
    };

    const menuOverlay = $("#vlGameMenuOverlay"), helpOverlay = $("#vlHelpOverlay"), closeHelp = $("#vlHelpCloseBtn");
    const howTo = $("#vlMenuHowToBtn"), muteBtn = $("#vlMenuMuteBtn"), exitBtn = $("#vlMenuExitBtn"), closeBtn = $("#vlMenuCloseBtn");

    if (howTo) howTo.onclick = () => {
      state.menuOpen = false;
      state.helpOpen = true;
      state.helpBackMode = true;
      state.astroMoveDir = 0;
      render();
    };

    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
    if (exitBtn) exitBtn.onclick = () => { stopAstroLoop(); window.VerseGameBridge.exitGame(); };
    if (closeBtn) closeBtn.onclick = () => { state.menuOpen = false; render(); };
    if (menuOverlay) menuOverlay.onclick = (e) => { if (e.target === menuOverlay){ state.menuOpen = false; render(); } };
    if (closeHelp) closeHelp.onclick = () => {
      if (state.helpBackMode){
        state.helpOpen = false;
        state.menuOpen = true;
        state.helpBackMode = false;
      } else {
        state.helpOpen = false;
      }
      render();
    };
    if (helpOverlay) helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        if (state.helpBackMode){
          state.helpOpen = false;
          state.menuOpen = true;
          state.helpBackMode = false;
        } else {
          state.helpOpen = false;
        }
        render();
      }
    };
  }

  function wireAstroControls(){
    const leftBtn = $("#vlLeftBtn");
    const rightBtn = $("#vlRightBtn");

    function setDir(dir){
      if (!state.astroMoonPhase) state.astroMoveDir = dir;
    }

    function clearDir(dir){
      if (state.astroMoveDir === dir) state.astroMoveDir = 0;
    }

    [["pointerdown", -1], ["pointerup", -1], ["pointercancel", -1], ["pointerleave", -1]].forEach(() => {});

    if (leftBtn){
      leftBtn.onpointerdown = (e) => { e.preventDefault(); setDir(-1); };
      leftBtn.onpointerup = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.onpointercancel = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.onpointerleave = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.oncontextmenu = (e) => e.preventDefault();
    }

    if (rightBtn){
      rightBtn.onpointerdown = (e) => { e.preventDefault(); setDir(1); };
      rightBtn.onpointerup = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.onpointercancel = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.onpointerleave = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.oncontextmenu = (e) => e.preventDefault();
    }
  }

  function flashWrongBoard(){
    const el = $("#vlRedFlash");
    if (!el) return;
    el.classList.remove("is-flashing"); void el.offsetWidth; el.classList.add("is-flashing");
  }

  function spawnSmoke(x, y, count=8, options={}){
    const layer = $("#vlSmokeLayer") || document.body;
    const {
      spreadX = 30,
      spreadY = 16,
      size = 18,
      color = "rgba(255,255,255,.68)"
    } = options;

    for (let i = 0; i < count; i++){
      const puff = document.createElement("div");
      puff.className = "vl-smoke-puff";
      puff.style.left = `${x + (Math.random() * spreadX - spreadX / 2)}px`;
      puff.style.top = `${y + (Math.random() * spreadY - spreadY / 2)}px`;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;
      puff.style.setProperty("--vl-smoke-color", color);
      puff.style.setProperty("--sx", `${Math.round(Math.random() * 28 - 14)}px`);
      puff.style.setProperty("--sy", `${Math.round(-16 - Math.random() * 26)}px`);
      layer.appendChild(puff);
      puff.addEventListener("animationend", () => puff.remove(), { once:true });
    }
  }

  function spawnFireworks(x, y){
    const layer = $("#vlFireworkLayer") || document.body;
    const palette = ["#ffffff", "#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#ff8cc8"];
    const count = 28 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++){
      const p = document.createElement("div");
      p.className = "vl-firework";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", `${Math.round(Math.random() * 160 - 80)}px`);
      p.style.setProperty("--dy", `${Math.round(Math.random() * 160 - 80)}px`);
      p.style.setProperty("--pcolor", palette[i % palette.length]);
      layer.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once:true });
    }
  }

  function getModeMedal(mode){ return mode === "easy" ? "🥉" : mode === "medium" ? "🥈" : mode === "hard" ? "🥇" : "🏅"; }

  function getRocketByKey(key){
    return ROCKETS.find(r => r.key === key) || ROCKETS[0];
  }

  function getSmokeTrailColor(){
    if (state.astroHits <= 0) return "#ffc751";
    if (state.astroHits === 1) return "#ffa351";
    return "#ff5a51";
  }

  function getBonusRocket(){
    return getRocketByKey(state.bonusRocketColorKey || "red");
  }

  async function finalizeBonusOutcome(success){
    state.completed = true;
    state.endTime = performance.now();
    state.bonusOutcome = success ? "success" : "crash";

    let alreadyEarned = false;
    try {
      if (window.VerseGameBridge && typeof window.VerseGameBridge.wasAlreadyCompleted === "function") {
        alreadyEarned = !!(await window.VerseGameBridge.wasAlreadyCompleted(GAME_ID, state.mode));
      }
    } catch (err) {
      alreadyEarned = false;
    }

    state.bonusMedalAlreadyEarned = alreadyEarned;

    await window.VerseGameBridge.markCompleted({
      verseId: ctx.verseId,
      gameId: GAME_ID,
      mode: state.mode
    });

    if (success){
      if (alreadyEarned){
        state.medalMessage = "Mission accomplished!";
        state.medalSubmessage = "You reached the moon!";
      } else {
        state.medalMessage = `Mission accomplished! You earned a ${getModeMedal(state.mode)}`;
        state.medalSubmessage = "You reached the moon!";
      }
    } else {
      if (alreadyEarned){
        state.medalMessage = "Rocket lost!";
        state.medalSubmessage = "You built the verse, but your rocket crashed.";
      } else {
        state.medalMessage = `Launch complete! You earned a ${getModeMedal(state.mode)}`;
        state.medalSubmessage = "You built the verse, but your rocket crashed.";
      }
    }

    state.busy = false;
    setScreen("end");
  }

  function stopAstroLoop(){
    if (state.astroRaf){
      cancelAnimationFrame(state.astroRaf);
      state.astroRaf = 0;
    }
    state.astroRunning = false;
  }

  function safeLeftPct(x){
    return Math.max(0.08, Math.min(0.92, x));
  }

  function modeAstroMultiplier(){
    return ASTRO_MODE_MULTIPLIER[state.mode] || 1;
  }

  function maybeSpawnAsteroid(dtMs){
    const chancePerSecond = state.astroMoonPhase ? 0 : 1.7;
    const roll = Math.random();
    if (roll > chancePerSecond * (dtMs / 1000)) return;

    const size = 44 + Math.random() * 22;
    state.astroAsteroids.push({
      id:`ast_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      x: 0.1 + Math.random() * 0.8,
      yPx: -size - 20,
      size,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() * 90) - 45
    });
  }

  function asteroidSpeedPxPerSec(viewH){
    return (ASTRO_BASE_SPEED_VH_PER_SEC / 100) * viewH * modeAstroMultiplier();
  }

function resetMoonOffscreen(){
  const moon = $("#vlMoon");
  if (moon){
    const moonHeight = moon.getBoundingClientRect().height || 240;
    state.astroMoonY = -moonHeight - 24;
  } else {
    state.astroMoonY = -340;
  }
}

  async function playLaunchCountdown(){
    for (const value of ["3","2","1"]){
      state.countdownValue = value;
      render();
      await sleep(520);
    }
    state.countdownValue = "";
    render();
  }

  async function animateLaunch(choice, sourceEl){
    const sourceRocket = sourceEl?.querySelector(".vl-rocket") || sourceEl;
    const sourceBubble = sourceEl?.querySelector(".vl-choice-bubble") || sourceEl;
    const buildRect = $("#vlBuild")?.getBoundingClientRect();
    if (!sourceRocket || !sourceBubble || !buildRect) return;

    const rocketRect = sourceRocket.getBoundingClientRect();
    const bubbleRect = sourceBubble.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();
    const unit = document.createElement("div");
    unit.className = "vl-flight-unit";
    unit.innerHTML = `<img class="vl-flight-rocket" src="${choice.rocket.src}" alt=""><div class="vl-flight-label ${choice.rocket.textDark ? "vl-text-dark" : ""}" style="background:${choice.rocket.color}">${escapeHtml(choice.label)}</div>`;
    document.body.appendChild(unit);

    const unitRect = unit.getBoundingClientRect();
    unit.style.left = `${rocketRect.left + (rocketRect.width / 2) - (unitRect.width / 2)}px`;
    unit.style.top = `${rocketRect.top - 8}px`;

    const startX = rocketRect.left + rocketRect.width / 2;
    const startY = rocketRect.top + rocketRect.height / 2;
    const endX = buildRect.left + buildRect.width / 2;
    const endY = buildRect.top + buildRect.height / 2;

    const smokeStartX = startX - smokeLayerRect.left;
    const smokeStartY = startY - smokeLayerRect.top;
    const smokeBubbleBottom = bubbleRect.bottom - smokeLayerRect.top;

    sourceEl.classList.add("is-hidden-during-flight");
    spawnSmoke(smokeStartX, smokeBubbleBottom - 4, 5);
    await sleep(220);
    spawnSmoke(smokeStartX, smokeBubbleBottom - 6, 8);

    unit.style.transition = "transform 240ms ease, opacity 240ms ease";
    unit.style.transform = "translate(0,-22px) scale(.98)";
    unit.style.opacity = "1";
    await sleep(240);

    const dx = Math.round(endX - startX);
    const dy = Math.round(endY - startY);

    unit.style.transition = "transform 640ms cubic-bezier(.12,.2,.18,1), opacity 640ms linear";
    unit.style.transform = `translate(${dx}px, ${dy}px) scale(.44)`;
    unit.style.opacity = ".96";

    const frames = 8;
    await sleep(40);
    for (let i = 0; i < frames; i++){
      const t = i / frames;
      spawnSmoke(
        smokeStartX + dx * t * 0.65,
        smokeStartY + dy * t * 0.65 + 64,
        2
      );
      await sleep(26);
    }
    await sleep(640);
    unit.remove();
    sourceEl.classList.remove("is-hidden-during-flight");
    spawnFireworks(endX, endY);
  }

  function showBuildShake(){
    const build = $("#vlBuild");
    if (!build) return;
    build.classList.remove("vl-shake"); void build.offsetWidth; build.classList.add("vl-shake");
  }

  async function animateFailedLaunch(sourceEl){
    const rocket = sourceEl?.querySelector(".vl-rocket");
    if (!rocket) return;

    const rocketRect = rocket.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();

    const centerX = rocketRect.left + rocketRect.width / 2 - smokeLayerRect.left;
    const centerY = rocketRect.top + rocketRect.height / 2 - smokeLayerRect.top;
    const smokeSize = Math.round(rocketRect.width * 1.5);

    spawnSmoke(centerX, centerY, 22, {
      spreadX: smokeSize * 0.50,
      spreadY: smokeSize * 0.50,
      size: smokeSize,
      color: "rgba(70,70,70,.82)"
    });

    await sleep(280);
  }

  async function animateBonusLaunch(sourceEl){
    const rocket = sourceEl?.querySelector(".vl-rocket");
    const button = sourceEl?.querySelector(".vl-star-launch-btn");
    if (!rocket || !button) return;

    const rocketRect = rocket.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();
    const startX = rocketRect.left + rocketRect.width / 2;
    const startY = rocketRect.top + rocketRect.height / 2;
    const smokeX = startX - smokeLayerRect.left;
    const smokeY = startY - smokeLayerRect.top;

    const unit = document.createElement("div");
    unit.className = "vl-flight-unit";
    unit.innerHTML = `<img class="vl-flight-rocket" src="${rocket.getAttribute("src")}" alt="">`;
    document.body.appendChild(unit);

    const unitRect = unit.getBoundingClientRect();
    unit.style.left = `${rocketRect.left + (rocketRect.width / 2) - (unitRect.width / 2)}px`;
    unit.style.top = `${rocketRect.top - 8}px`;

    sourceEl.classList.add("is-hidden-during-flight");
    spawnSmoke(smokeX, smokeY + 42, 8, { color:getSmokeTrailColor() });
    await sleep(220);
    spawnSmoke(smokeX, smokeY + 38, 10, { color:getSmokeTrailColor() });

    unit.style.transition = "transform 220ms ease, opacity 220ms ease";
    unit.style.transform = "translate(0,-26px) scale(.98)";
    await sleep(220);

    const endY = -window.innerHeight - 200;
    unit.style.transition = "transform 980ms cubic-bezier(.12,.2,.18,1), opacity 980ms linear";
    unit.style.transform = `translate(0, ${endY}px) scale(.42)`;
    unit.style.opacity = ".96";

    for (let i = 0; i < 16; i++){
      const t = i / 16;
      spawnSmoke(smokeX, smokeY - (window.innerHeight * 0.75 * t), 2, { color:getSmokeTrailColor() });
      await sleep(36);
    }

    await sleep(980);
    unit.remove();
    sourceEl.classList.remove("is-hidden-during-flight");
  }

  async function startBonusSequence(){
    setScreen("travel");
    await sleep(220);

    const rocket = $("#vlTravelRocket");
    const smokeLayer = $("#vlTravelSmoke");
    if (rocket){
      const startBottom = -120;
      const endBottom = window.innerHeight + 120;
      rocket.animate(
        [
          { transform:"translateX(-50%) translateY(0)" },
          { transform:`translateX(-50%) translateY(${-endBottom}px)` }
        ],
        { duration:1600, easing:"cubic-bezier(.15,.6,.2,1)", fill:"forwards" }
      );
    }

    for (let i = 0; i < 20; i++){
      const y = window.innerHeight - (i * 34);
      const x = window.innerWidth / 2;
      spawnSmoke(x, y, 2, { color:getSmokeTrailColor() });
      await sleep(42);
    }

    const travelText = $("#vlTravelText");
    if (travelText){
      travelText.classList.add("is-visible");
    }
    state.bonusTravelTextVisible = true;
    await sleep(1400);

    const fade = document.querySelector(".vl-screen-fade");
    if (fade){
      fade.classList.add("is-active");
    }
    state.bonusFadeActive = true;
    await sleep(430);

    state.bonusFadeActive = false;
    state.bonusTravelTextVisible = false;
    setScreen("asteroids");
    startAstroLoop();
  }

  function renderAstroEntities(){
    const stage = $("#vlAstroStage");
    const layer = $("#vlSpaceLayer");
    const rocket = $("#vlPlayerRocket");
    const moon = $("#vlMoon");
    const trail = $("#vlPlayerTrail");
    if (!stage || !layer || !rocket || !moon || !trail) return;

    const rect = stage.getBoundingClientRect();
    const leftPx = rect.width * state.astroPlayerX;
    rocket.style.left = `${leftPx}px`;
    rocket.style.transform = `translateX(-50%) translateY(${-state.astroPlayerLiftPx}px) rotate(${state.astroPlayerTilt + state.astroSpinDeg}deg) scale(${state.astroPlayerScale})`;

    trail.innerHTML = "";
    const trailColor = getSmokeTrailColor();
    const baseY = rect.height - 118;
    const spinOffsetX = Math.sin((state.astroSpinDeg || 0) * (Math.PI / 180)) * 4;

    for (let i = 0; i < 7; i++){
      const puff = document.createElement("div");
      puff.className = "vl-smoke-puff";

      const size = 14 + (i * 3);
      const driftX = Math.round((Math.random() * 18 - 9) + spinOffsetX);
      const driftY = Math.round(14 + Math.random() * 14);
      const xJitter = Math.round(Math.random() * 12 - 6);
      const yPos = baseY + (i * 12);

      puff.style.left = `${leftPx + xJitter}px`;
      puff.style.top = `${yPos}px`;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;
      puff.style.opacity = `${Math.max(0.22, 0.72 - (i * 0.07))}`;
      puff.style.setProperty("--vl-smoke-color", trailColor);
      puff.style.setProperty("--sx", `${driftX}px`);
      puff.style.setProperty("--sy", `${driftY}px`);
      trail.appendChild(puff);
    }

    layer.querySelectorAll(".vl-asteroid").forEach(n => n.remove());
    state.astroAsteroids.forEach(ast => {
      const img = document.createElement("img");
      img.className = "vl-asteroid";
      img.src = "./verse_launch_images/verse_launch_asteroid.png";
      img.style.width = `${ast.size}px`;
      img.style.height = `${ast.size}px`;
      img.style.left = `${rect.width * ast.x - ast.size / 2}px`;
      img.style.top = `${ast.yPx}px`;
      img.style.transform = `rotate(${ast.rot}deg)`;
      layer.appendChild(img);
    });

    moon.style.top = `${state.astroMoonY}px`;
  }

  function asteroidHitTest(stageRect, asteroid){
    const rocketX = stageRect.width * state.astroPlayerX;
    const rocketY = stageRect.height - 118 - 42;
    const rocketW = 84 * ASTRO_HITBOX_SCALE;
    const rocketH = 84 * ASTRO_HITBOX_SCALE;

    const astW = asteroid.size * ASTRO_HITBOX_SCALE;
    const astH = asteroid.size * ASTRO_HITBOX_SCALE;
    const astX = stageRect.width * asteroid.x;
    const astY = asteroid.yPx + asteroid.size / 2;

    return Math.abs(rocketX - astX) < (rocketW + astW) / 2 &&
           Math.abs(rocketY - astY) < (rocketH + astH) / 2;
  }

  async function astroHandleHit(){
    if (state.astroInvulnerable || state.astroMoonPhase) return;
    state.astroInvulnerable = true;
    state.astroHits += 1;

    state.astroSpinDeg = 0;
    state.astroSpinMs = 1000;

    const rocket = $("#vlPlayerRocket");
    if (rocket){
      rocket.classList.remove("is-hit", "is-flash", "is-despawned");
      void rocket.offsetWidth;
      rocket.classList.add("is-flash");
    }

    if (state.astroHits >= 3){
      const stage = $("#vlAstroStage")?.getBoundingClientRect();
      const rocket = $("#vlPlayerRocket");

      if (stage){
        const centerX = stage.width * state.astroPlayerX;
        const centerY = stage.height - 118;
        const smokeSize = 126;

        spawnSmoke(centerX, centerY, 22, {
          spreadX: smokeSize * 0.50,
          spreadY: smokeSize * 0.50,
          size: smokeSize,
          color: "rgba(255,255,255,.92)"
        });
      }

      if (rocket){
        rocket.classList.add("is-despawned");
      }

      await sleep(900);
      stopAstroLoop();
      await finalizeBonusOutcome(false);
      return;
    }

    renderAstroEntities();
    await sleep(1000);
    state.astroInvulnerable = false;
  }

  function astroTick(ts){
    if (!state.astroRunning) return;
    if (!state.astroLastTs) state.astroLastTs = ts;
    const dtMs = Math.min(34, ts - state.astroLastTs);
    state.astroLastTs = ts;

    const stage = $("#vlAstroStage");
    if (!stage){
      state.astroRaf = requestAnimationFrame(astroTick);
      return;
    }

    const rect = stage.getBoundingClientRect();
    if (state.menuOpen || state.helpOpen){
      state.astroLastTs = ts;
      renderAstroEntities();
      state.astroRaf = requestAnimationFrame(astroTick);
      return;
    }
    const dtSec = dtMs / 1000;
    const moveSpeed = 0.62 * dtSec;
    state.astroPlayerX = safeLeftPct(state.astroPlayerX + state.astroMoveDir * moveSpeed);
    state.astroPlayerTilt = state.astroMoveDir === 0 ? 0 : (state.astroMoveDir < 0 ? -12 : 12);

    if (state.astroSpinMs > 0){
      const spinStep = 360 * dtSec;
      state.astroSpinDeg += spinStep;
      state.astroSpinMs = Math.max(0, state.astroSpinMs - dtMs);
      if (state.astroSpinMs === 0){
        state.astroSpinDeg = 0;
      }
    }

    if (!state.astroMoonPhase){
      state.astroTimerMs += dtMs;
      maybeSpawnAsteroid(dtMs);

      const fallSpeed = asteroidSpeedPxPerSec(rect.height);
      state.astroAsteroids.forEach(ast => {
        ast.yPx += fallSpeed * dtSec;
        ast.rot += ast.rotSpeed * dtSec;
      });
      state.astroAsteroids = state.astroAsteroids.filter(ast => ast.yPx < rect.height + ast.size + 20);

      if (!state.astroInvulnerable){
        for (const ast of state.astroAsteroids){
          if (asteroidHitTest(rect, ast)){
            astroHandleHit();
            break;
          }
        }
      }

      if (state.astroTimerMs >= ASTRO_DURATION_MS){
        state.astroMoonPhase = true;
      }
    } else {
      state.astroAsteroids = [];

      const moonTargetY = rect.height * 0.18;
      if (!state.astroLandingPhase){
        if (state.astroMoonY < moonTargetY){
          state.astroMoonY = Math.min(moonTargetY, state.astroMoonY + rect.height * 0.010);
        } else {
          state.astroMoonDone = true;
          state.astroLandingPhase = true;
          state.astroMoveDir = 0;
        }
      } else {
        const targetX = 0.5;
        const targetLiftPx = rect.height * 0.42;
        const targetScale = 0.05;

        state.astroPlayerX += (targetX - state.astroPlayerX) * 0.08;
        state.astroPlayerLiftPx += (targetLiftPx - state.astroPlayerLiftPx) * 0.08;
        state.astroPlayerScale += (targetScale - state.astroPlayerScale) * 0.08;
        state.astroPlayerTilt *= 0.82;

        const centered = Math.abs(targetX - state.astroPlayerX) < 0.008;
        const lifted = Math.abs(targetLiftPx - state.astroPlayerLiftPx) < 3;
        const scaled = Math.abs(targetScale - state.astroPlayerScale) < 0.02;

        if (centered && lifted && scaled){
          stopAstroLoop();
          finalizeBonusOutcome(true);
          return;
        }
      }
    }

    renderAstroEntities();
    state.astroRaf = requestAnimationFrame(astroTick);
  }

function startAstroLoop(){
  state.astroRunning = true;
  state.astroLastTs = 0;
  state.astroTimerMs = 0;
  state.astroHits = 0;
  state.astroInvulnerable = false;
  state.astroPlayerX = 0.5;
  state.astroMoveDir = 0;
  state.astroPlayerTilt = 0;
  state.astroSpinDeg = 0;
  state.astroSpinMs = 0;
  state.astroAsteroids = [];
  state.astroMoonPhase = false;
  state.astroMoonDone = false;
  state.astroLandingPhase = false;
  state.astroPlayerLiftPx = 0;
  state.astroPlayerScale = 1;

  renderAstroEntities();
  resetMoonOffscreen();
  renderAstroEntities();

  state.astroRaf = requestAnimationFrame(astroTick);
}

  async function finishGame(){
    state.completed = true;
    state.endTime = performance.now();
    let alreadyEarned = false;
    try {
      if (window.VerseGameBridge && typeof window.VerseGameBridge.wasAlreadyCompleted === "function") {
        alreadyEarned = !!(await window.VerseGameBridge.wasAlreadyCompleted(GAME_ID, state.mode));
      }
    } catch (err) {
      alreadyEarned = false;
    }
    await window.VerseGameBridge.markCompleted({ verseId: ctx.verseId, gameId: GAME_ID, mode: state.mode });
    if (alreadyEarned){
      state.medalMessage = "Great job!";
      state.medalSubmessage = "You finished Verse Launch!";
    } else {
      state.medalMessage = `Well done! You earned a ${getModeMedal(state.mode)}`;
      state.medalSubmessage = "You finished Verse Launch!";
    }
    state.busy = false;
    setScreen("end");
  }

async function handleLaunch(choiceId){
  if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;

  if (choiceId === "bonus_launch"){
    state.busy = true;
    await playLaunchCountdown();

    const liveSourceEl =
      document.querySelector(`.vl-main-launcher[data-choice-id="bonus_launch"]`) ||
      document.querySelector(`.vl-launcher-hitbox[data-choice-id="bonus_launch"]`)?.closest(".vl-main-launcher");

    if (!liveSourceEl){
      state.busy = false;
      render();
      return;
    }

    await animateBonusLaunch(liveSourceEl);
    state.busy = false;
    await startBonusSequence();
    return;
  }

  const choice = state.choices.find(c => c.id === choiceId);
  if (!choice) return;

  state.busy = true;
  await playLaunchCountdown();

  const liveSourceEl =
    document.querySelector(`.vl-main-launcher[data-choice-id="${choiceId}"]`) ||
    document.querySelector(`.vl-launcher-hitbox[data-choice-id="${choiceId}"]`)?.closest(".vl-main-launcher");

  if (!liveSourceEl){
    state.busy = false;
    render();
    return;
  }

  if (choice.isCorrect){
    await animateLaunch(choice, liveSourceEl);
    state.progressIndex += 1;

    if (state.progressIndex >= state.segments.length){
      state.bonusReady = true;
      state.busy = false;
      render();
      return;
    }

    buildChoices();
    state.busy = false;
    render();
    return;
  }

  await animateFailedLaunch(liveSourceEl);
  flashWrongBoard();
  showBuildShake();

  if (state.mode === "hard"){
    const removeCount = Math.min(2, state.progressIndex);
    const removing = new Set();
    for (let i = 0; i < removeCount; i++) removing.add(state.progressIndex - 1 - i);
    state.buildRemoving = removing;
    render();
    showBuildShake();
    await sleep(360);
    state.progressIndex = Math.max(0, state.progressIndex - removeCount);
    state.buildRemoving = new Set();
  } else {
    await sleep(260);
  }

  buildChoices();
  state.busy = false;
  render();
}

  function setScreen(screen){ state.screen = screen; render(); }
  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "travel") return renderTravel();
    if (state.screen === "asteroids") return renderAsteroidGame();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
