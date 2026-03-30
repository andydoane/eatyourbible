(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  let selectedMode = null;
  let completed = false;
  let muted = false;

  const TARGET_COLORS = [
    "#ff5a51",
    "#ffa351",
    "#ffc751",
    "#40b9c5",
    "#7f66c6",
    "#a7cb6f"
  ];

  const ALL_BIBLE_BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther",
    "Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
    "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
    "Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians",
    "Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
    "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const FUNNY_DECOY_WORDS = [
    "taco","banana","penguin","cupcake","dinosaur","pickle","marshmallow","noodle","waffle","rocket",
    "jellybean","pancake","popcorn","unicorn","bubble","muffin","otter","kangaroo","scooter","rainbow",
    "pretzel","monkey","donut","cookie","balloon","zebra","narwhal","kitten","puppy","burrito",
    "pirate","robot","slipper","backpack","bongo","volcano","watermelon","cheeseburger","toothbrush","snowman",
    "duckling","hamster","meatball","spaghetti","blueberry","coconut","sundae","firetruck","yo-yo","treasure"
  ];

  const state = {
    rafId: 0,
    running: false,
    turnDir: 0,
    flashUntil: 0,
    happyUntil: 0,
    snakeStyle: "default",
    head: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 120
    },
    trail: [],
    snakeLengthPx: 500,
    fieldWidth: 0,
    fieldHeight: 0,
    words: [],
    bookLabel: "",
    referenceLabel: "",
    segments: [],
    progressIndex: 0,
    targets: [],
    nextTargetId: 1
  };

  function getBackSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
          d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
          transform="translate(246.77226)" />
      </svg>
    `;
  }

  function getForwardSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
          d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
          transform="matrix(-1,0,0,1,1023.2277,0)" />
      </svg>
    `;
  }

  function getHomeSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/>
      </svg>
    `;
  }

  function getMuteSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round"
          d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z" />
        <g transform="translate(-26.458334,-255.59263)">
          <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="M 1241.4124,524.69155 890.61025,875.49365" />
          <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 890.61025,524.69155 350.80215,350.8021" />
        </g>
      </svg>
    `;
  }

  function getUnmuteSvg(){
    return `
      <svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <g transform="matrix(2.9017243,0,0,2.9017243,-948.59169,1423.6267)">
          <path style="fill:#ffffff;stroke:none;stroke-width:15.4884;stroke-linecap:round"
            d="m 554.69651,-460.54773 -86.50507,53.22802 a 51.858137,51.858137 0 0 1 -27.17654,7.69139 h -36.35067 a 14.676664,14.676664 0 0 0 -14.67666,14.67666 v 95.04477 a 14.676664,14.676664 0 0 0 14.67666,14.67666 h 36.35067 a 51.858137,51.858137 0 0 1 27.17654,7.69139 l 86.50507,53.22802 a 8.2017227,8.2017227 0 0 0 12.49988,-6.98527 v -232.26637 a 8.2017227,8.2017227 0 0 0 -12.49988,-6.98527 z" />
          <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 596.38634,-270.01659 c 26.00162,-13.81364 42.0863,-39.52797 42.16745,-67.41243 -0.0102,-27.95044 -16.10446,-53.75052 -42.16745,-67.5969" />
          <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
            d="m 626.65943,-233.57231 c 4.34269,-2.51562 16.69789,-10.99898 23.86366,-17.76894 23.32002,-22.03191 37.74343,-52.46821 37.74343,-86.08777 0,-33.61956 -14.42341,-64.05637 -37.74343,-86.08828 -7.16577,-6.76996 -19.52097,-15.25332 -23.86366,-17.76894" />
        </g>
      </svg>
    `;
  }

  function stopLoop(){
    state.running = false;
    if (state.rafId){
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    window.onkeydown = null;
    window.onkeyup = null;
  }

  function resetSnakeMotion(){
    state.turnDir = 0;
    state.flashUntil = 0;
    state.happyUntil = 0;
    state.snakeStyle = "default";
    state.head.angle = -Math.PI / 2;
    state.head.speed = getBaseSpeed(selectedMode);
    state.trail = [];
    state.fieldWidth = 0;
    state.fieldHeight = 0;
    state.words = [];
    state.bookLabel = "";
    state.referenceLabel = "";
    state.segments = [];
    state.progressIndex = 0;
    state.targets = [];
    state.nextTargetId = 1;
  }

  function getBaseSpeed(mode){
    if (mode === "medium") return 136;
    if (mode === "hard") return 150;
    return 122;
  }

  function getSpeedRamp(mode){
    if (mode === "medium") return 2.2;
    if (mode === "hard") return 4.0;
    return 0;
  }

  function getCurrentSpeed(){
    return getBaseSpeed(selectedMode) + (state.progressIndex * getSpeedRamp(selectedMode));
  }

  function tokenizeVerse(text){
    return String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
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

  // Preferred path: derive from verseId, since that's the stable source in your JSON files.
  // Examples:
  //   genesis_1_1 -> Genesis / 1:1
  //   1_corinthians_15_22 -> 1 Corinthians / 15:22
  //   song_of_solomon_2_1 -> Song of Solomon / 2:1
  const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
  if (idMatch){
    return {
      book: titleCaseBookFromSlug(idMatch[1]),
      reference: `${idMatch[2]}:${idMatch[3]}`
    };
  }

  // Fallback: parse the incoming ref string if verseId is unavailable or unexpected.
  let raw = String(ref || "").trim();
  const trans = String(translation || "").trim();

  const KNOWN_TRANSLATIONS = [
    "ESV","NIV","NLT","KJV","NKJV","CSB","HCSB","NASB","NASB95","LSB",
    "AMP","RSV","NRSV","NRSVUE","NET","MSG","GW","CEV","GNT","ERV","ICB"
  ];

  function stripTrailingTranslationToken(text){
    let out = String(text || "").trim();
    if (!out) return out;

    if (trans){
      const escapedTrans = trans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`\\s*\\(?${escapedTrans}\\)?\\s*$`, "i"), "").trim();
    }

    for (const code of KNOWN_TRANSLATIONS){
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`\\s*\\(?${escaped}\\)?\\s*$`, "i"), "").trim();
    }

    out = out.replace(/\s+\(?[A-Z]{2,8}\)?\s*$/, "").trim();
    return out;
  }

  raw = stripTrailingTranslationToken(raw);

  let match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
  if (match){
    return {
      book: match[1].trim(),
      reference: match[2].trim()
    };
  }

  raw = stripTrailingTranslationToken(raw);

  match = raw.match(/^(.*?)\s+(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s*$/);
  if (match){
    return {
      book: match[1].trim(),
      reference: match[2].trim()
    };
  }

  const lastSpace = raw.lastIndexOf(" ");
  if (lastSpace > 0){
    return {
      book: raw.slice(0, lastSpace).trim(),
      reference: raw.slice(lastSpace + 1).trim()
    };
  }

  return {
    book: raw,
    reference: ""
  };
}

  function getWordPhaseCount(){
    return state.words.length;
  }

  function hasBookPhase(){
    return !!state.bookLabel;
  }

  function hasReferencePhase(){
    return !!state.referenceLabel;
  }

  function getPhaseForIndex(index){
    const wordCount = getWordPhaseCount();

    if (index < wordCount){
      return "words";
    }

    if (hasBookPhase() && index === wordCount){
      return "book";
    }

    if (hasReferencePhase()){
      const refIndex = wordCount + (hasBookPhase() ? 1 : 0);
      if (index === refIndex){
        return "reference";
      }
    }

    return "done";
  }

  function getCurrentPhase(){
    return getPhaseForIndex(state.progressIndex);
  }

  function getCurrentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function updateBuildText(){
    const el = document.getElementById("vsBuildText");
    if (!el) return;

    if (!state.segments.length){
      el.textContent = "";
      return;
    }

    el.classList.add("is-verse-layout");
    el.innerHTML = state.segments.map((segment, index) => `
      <span class="vs-build-word ${index < state.progressIndex ? "is-built" : ""}">
        ${escapeHtml(segment)}
      </span>
    `).join(" ");
  }

  function shakeBuildArea(){
    const build = document.getElementById("vsBuild");
    if (!build) return;
    build.classList.remove("vs-shake");
    void build.offsetWidth;
    build.classList.add("vs-shake");
  }

  function renderModeSelect(){
    stopLoop();

    app.innerHTML = `
      <div class="vs-mode-shell">
        <div class="vs-mode-stage">
          <div class="vs-mode-top">
            <div class="vs-mode-title">🐍 Verse Snake</div>
            <div class="vs-mode-subtitle">Choose your difficulty.</div>

            <div class="vs-mode-card">
              <div class="vs-mode-actions">
                <button class="vm-btn" id="easyBtn">Easy</button>
                <button class="vm-btn" id="mediumBtn">Medium</button>
                <button class="vm-btn" id="hardBtn">Hard</button>
              </div>
            </div>
          </div>
        </div>

        <div class="vs-mode-nav-wrap">
          <div class="vs-nav">
            <button class="vs-nav-btn no-zoom" id="homeBtn" aria-label="Home">
              ${getHomeSvg()}
            </button>

            <div class="vs-nav-center">
              <button class="vs-help-btn no-zoom" id="helpBtn" type="button">HELP</button>
            </div>

            <button class="vs-nav-btn no-zoom" id="muteBtn" aria-label="Mute">
              ${muted ? getMuteSvg() : getUnmuteSvg()}
            </button>
          </div>
        </div>

        <div class="vs-help-overlay" id="vsHelpOverlay" aria-hidden="true">
          <div class="vs-help-dialog">
            <div class="vs-help-title">How to Play Verse Snake</div>
            <div class="vs-help-body">
              Easy: no penalty.<br>
              Medium: lose 2 built items.<br>
              Hard: lose everything built.<br><br>
              After the verse words, collect the book, then the reference.
            </div>
            <div class="vs-help-actions">
              <button class="vs-help-close no-zoom" id="vsHelpCloseBtn" type="button">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("easyBtn").onclick = () => {
      selectedMode = "easy";
      renderGameScreen();
    };

    document.getElementById("mediumBtn").onclick = () => {
      selectedMode = "medium";
      renderGameScreen();
    };

    document.getElementById("hardBtn").onclick = () => {
      selectedMode = "hard";
      renderGameScreen();
    };

    wireModeSelectNav();
  }

  function wireModeSelectNav(){
    const homeBtn = document.getElementById("homeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpOverlay = document.getElementById("vsHelpOverlay");
    const helpCloseBtn = document.getElementById("vsHelpCloseBtn");

    homeBtn.onclick = () => {
      window.VerseGameBridge.exitGame();
    };

    helpBtn.onclick = () => {
      helpOverlay.classList.add("show");
      helpOverlay.setAttribute("aria-hidden", "false");
    };

    helpCloseBtn.onclick = () => {
      helpOverlay.classList.remove("show");
      helpOverlay.setAttribute("aria-hidden", "true");
    };

    helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        helpOverlay.classList.remove("show");
        helpOverlay.setAttribute("aria-hidden", "true");
      }
    };

    muteBtn.onclick = () => {
      muted = !muted;
      const btn = document.getElementById("muteBtn");
      if (btn){
        btn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      }
    };
  }

  function renderGameScreen(){
    stopLoop();
    resetSnakeMotion();

    app.innerHTML = `
      <div class="vs-root">
        <div class="vs-stage">
          <div class="vs-build-wrap">
            <div class="vs-build" id="vsBuild">
              <div class="vs-build-text" id="vsBuildText"></div>
            </div>
          </div>

          <div class="vs-field-wrap">
            <div class="vs-field" id="vsField">
              <div class="vs-status">${selectedMode ? selectedMode[0].toUpperCase() + selectedMode.slice(1) : "Mode"}</div>

              <div class="vs-target-layer" id="vsTargetLayer"></div>

              <svg class="vs-svg" id="vsSvg" aria-hidden="true">
                <path class="vs-snake-body" id="vsSnakeBody" d=""></path>

                <g id="vsSnakeHeadGroup">
                  <circle class="vs-snake-head" id="vsSnakeHead" cx="0" cy="0" r="20"></circle>
                  <circle class="vs-snake-eye" id="vsSnakeEyeLeft" cx="-7" cy="-5" r="2.8"></circle>
                  <circle class="vs-snake-eye" id="vsSnakeEyeRight" cx="7" cy="-5" r="2.8"></circle>
                  <path class="vs-snake-tongue" id="vsSnakeTongue" d=""></path>
                </g>
              </svg>
            </div>

            <div class="vs-controls">
              <button class="vs-turn-btn no-zoom" id="turnLeftBtn" aria-label="Turn left">
                ${getBackSvg()}
              </button>
              <button class="vs-turn-btn no-zoom" id="turnRightBtn" aria-label="Turn right">
                ${getForwardSvg()}
              </button>
            </div>

            <div class="vs-nav">
              <button class="vs-nav-btn no-zoom" id="homeBtn" aria-label="Home">
                ${getHomeSvg()}
              </button>

              <div class="vs-nav-center">
                <button class="vs-help-btn no-zoom" id="helpBtn" type="button">HELP</button>
              </div>

              <button class="vs-nav-btn no-zoom" id="muteBtn" aria-label="Mute">
                ${muted ? getMuteSvg() : getUnmuteSvg()}
              </button>
            </div>
          </div>
        </div>

        <div class="vs-help-overlay" id="vsHelpOverlay" aria-hidden="true">
          <div class="vs-help-dialog">
            <div class="vs-help-title">How to Play Verse Snake</div>
            <div class="vs-help-body">
              Easy: no penalty.<br>
              Medium: lose 2 built items.<br>
              Hard: lose everything built.<br><br>
              After the verse words, collect the book, then the reference.
            </div>
            <div class="vs-help-actions">
              <button class="vs-help-close no-zoom" id="vsHelpCloseBtn" type="button">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;

    wireGameControls();

    requestAnimationFrame(() => {
      initializeFieldAndSnake();
      startLoop();
    });
  }

  function wireGameControls(){
    const leftBtn = document.getElementById("turnLeftBtn");
    const rightBtn = document.getElementById("turnRightBtn");
    const homeBtn = document.getElementById("homeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const muteBtn = document.getElementById("muteBtn");
    const helpOverlay = document.getElementById("vsHelpOverlay");
    const helpCloseBtn = document.getElementById("vsHelpCloseBtn");

    const turnLeftStart = (e) => {
      if (e) e.preventDefault();
      state.turnDir = -1;
    };

    const turnRightStart = (e) => {
      if (e) e.preventDefault();
      state.turnDir = 1;
    };

    const turnStop = (e) => {
      if (e) e.preventDefault();
      state.turnDir = 0;
    };

    leftBtn.addEventListener("pointerdown", turnLeftStart);
    rightBtn.addEventListener("pointerdown", turnRightStart);

    leftBtn.addEventListener("pointerup", turnStop);
    rightBtn.addEventListener("pointerup", turnStop);
    leftBtn.addEventListener("pointercancel", turnStop);
    rightBtn.addEventListener("pointercancel", turnStop);
    leftBtn.addEventListener("pointerleave", turnStop);
    rightBtn.addEventListener("pointerleave", turnStop);

    leftBtn.addEventListener("dblclick", (e) => e.preventDefault());
    rightBtn.addEventListener("dblclick", (e) => e.preventDefault());

    homeBtn.onclick = () => {
      stopLoop();
      window.VerseGameBridge.exitGame();
    };

    helpBtn.onclick = () => {
      helpOverlay.classList.add("show");
      helpOverlay.setAttribute("aria-hidden", "false");
    };

    helpCloseBtn.onclick = () => {
      helpOverlay.classList.remove("show");
      helpOverlay.setAttribute("aria-hidden", "true");
    };

    helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        helpOverlay.classList.remove("show");
        helpOverlay.setAttribute("aria-hidden", "true");
      }
    };

    muteBtn.onclick = () => {
      muted = !muted;
      const btn = document.getElementById("muteBtn");
      if (btn){
        btn.innerHTML = muted ? getMuteSvg() : getUnmuteSvg();
      }
    };

    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.turnDir = -1;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        state.turnDir = 1;
      }
    };

    window.onkeyup = (e) => {
      if (e.key === "ArrowLeft" && state.turnDir === -1) state.turnDir = 0;
      if (e.key === "ArrowRight" && state.turnDir === 1) state.turnDir = 0;
    };
  }

  function initializeFieldAndSnake(){
    syncFieldMetrics();

    state.snakeLengthPx = Math.max(
      180,
      Math.min(state.fieldWidth * 0.5, 420)
    );

    state.words = tokenizeVerse(ctx.verseText);

    const refParts = parseReferenceParts(
      ctx.verseRef || launch.ref || "",
      ctx.translation,
      ctx.verseId || launch.verseId || ""
    );
    state.bookLabel = refParts.book;
    state.referenceLabel = refParts.reference;

    state.segments = [
      ...state.words,
      ...(state.bookLabel ? [state.bookLabel] : []),
      ...(state.referenceLabel ? [state.referenceLabel] : [])
    ];

    state.progressIndex = 0;

    state.head.x = state.fieldWidth * 0.50;
    state.head.y = state.fieldHeight * 0.55;
    state.head.angle = -Math.PI / 2;
    state.head.speed = getCurrentSpeed();

    state.trail = [];
    seedTrail();
    updateBuildText();
    scheduleTargetsSpawn();
    renderTargets();
    drawSnake();
  }

  function syncFieldMetrics(){
    const field = document.getElementById("vsField");
    const svg = document.getElementById("vsSvg");
    if (!field || !svg) return;

    const rect = field.getBoundingClientRect();
    state.fieldWidth = Math.max(1, rect.width);
    state.fieldHeight = Math.max(1, rect.height);

    svg.setAttribute("viewBox", `0 0 ${state.fieldWidth} ${state.fieldHeight}`);
  }

  function startLoop(){
    state.running = true;
    let lastTs = performance.now();

    function tick(ts){
      if (!state.running) return;

      const dt = Math.min(34, ts - lastTs);
      lastTs = ts;

      syncFieldMetrics();
      updateMotion(dt);
      updateTargetVisibility(ts);
      checkTargetCollisions();
      drawSnake();

      state.rafId = requestAnimationFrame(tick);
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function seedTrail(){
    state.trail = [];
    const step = 8;

    for (let i = 0; i < state.snakeLengthPx; i += step){
      state.trail.push({
        x: state.head.x,
        y: state.head.y + i,
        breakBefore: false
      });
    }
  }

  function updateMotion(dt){
    const turnRate = 2.5;

    state.head.angle += state.turnDir * turnRate * (dt / 1000);
    state.head.speed = getCurrentSpeed();

    const speed = state.head.speed;
    let nextX = state.head.x + Math.cos(state.head.angle) * speed * (dt / 1000);
    let nextY = state.head.y + Math.sin(state.head.angle) * speed * (dt / 1000);
    let wrapped = false;

    const pad = 24;

    if (nextX < -pad){
      nextX = state.fieldWidth + pad;
      wrapped = true;
    } else if (nextX > state.fieldWidth + pad){
      nextX = -pad;
      wrapped = true;
    }

    if (nextY < -pad){
      nextY = state.fieldHeight + pad;
      wrapped = true;
    } else if (nextY > state.fieldHeight + pad){
      nextY = -pad;
      wrapped = true;
    }

    if (wrapped && state.trail.length > 0){
      state.trail[0].breakBefore = true;
    }

    state.head.x = nextX;
    state.head.y = nextY;

    state.trail.unshift({
      x: state.head.x,
      y: state.head.y,
      breakBefore: false
    });

    trimTrail();
  }

  function trimTrail(){
    let total = 0;
    const trimmed = [];

    for (let i = 0; i < state.trail.length; i++){
      const p = state.trail[i];
      trimmed.push(p);

      if (i > 0){
        const prev = state.trail[i - 1];
        if (!p.breakBefore){
          total += Math.hypot(p.x - prev.x, p.y - prev.y);
        }
      }

      if (total >= state.snakeLengthPx){
        break;
      }
    }

    state.trail = trimmed;
  }

  function buildBodyPath(points){
    if (!points.length) return "";

    const simplified = simplifyTrail(points, 10);
    if (!simplified.length) return "";

    let d = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`;

    for (let i = 1; i < simplified.length; i++){
      const p = simplified[i];

      if (p.breakBefore){
        d += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      } else {
        d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }
    }

    return d;
  }

  function simplifyTrail(points, minDist){
    if (!points.length) return [];

    const out = [points[0]];
    let last = points[0];

    for (let i = 1; i < points.length; i++){
      const p = points[i];

      if (p.breakBefore){
        out.push({
          x: p.x,
          y: p.y,
          breakBefore: true
        });
        last = p;
        continue;
      }

      if (Math.hypot(p.x - last.x, p.y - last.y) >= minDist){
        out.push({
          x: p.x,
          y: p.y,
          breakBefore: false
        });
        last = p;
      }
    }

    const tail = points[points.length - 1];
    const lastOut = out[out.length - 1];

    if (!lastOut || lastOut.x !== tail.x || lastOut.y !== tail.y){
      out.push({
        x: tail.x,
        y: tail.y,
        breakBefore: !!tail.breakBefore
      });
    }

    return out;
  }

  function drawSnake(){
    const body = document.getElementById("vsSnakeBody");
    const head = document.getElementById("vsSnakeHead");
    const leftEye = document.getElementById("vsSnakeEyeLeft");
    const rightEye = document.getElementById("vsSnakeEyeRight");
    const tongue = document.getElementById("vsSnakeTongue");
    const headGroup = document.getElementById("vsSnakeHeadGroup");

    if (!body || !head || !leftEye || !rightEye || !tongue || !headGroup) return;

    const now = performance.now();
    const isWrong = now < state.flashUntil;
    const isHappy = now < state.happyUntil;

    body.setAttribute("d", buildBodyPath(state.trail));
    body.classList.toggle("is-wrong", isWrong);
    body.classList.toggle("is-happy", isHappy);

    head.classList.toggle("is-wrong", isWrong);

    const headColor = getSnakeHeadColor();
    const bodyColor = getSnakeBodyColor();

    head.setAttribute("fill", headColor);
    body.setAttribute("stroke", bodyColor);

    const angleDeg = (state.head.angle * 180 / Math.PI) + 90;
    headGroup.setAttribute(
      "transform",
      `translate(${state.head.x.toFixed(1)} ${state.head.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`
    );

    head.setAttribute("cx", "0");
    head.setAttribute("cy", "0");
    head.setAttribute("r", "20");

    leftEye.setAttribute("cx", "-7");
    leftEye.setAttribute("cy", "-5");
    rightEye.setAttribute("cx", "7");
    rightEye.setAttribute("cy", "-5");

    tongue.setAttribute("d", "M 0 -22 L -4 -34 L 0 -31 L 4 -34 Z");
  }

  function getSnakeBodyColor(){
    if (state.snakeStyle === "berry") return "#ff7eb6";
    if (state.snakeStyle === "ocean") return "#74c0fc";
    if (state.snakeStyle === "sun") return "#ffd43b";
    return "#a7cb6f";
  }

  function getSnakeHeadColor(){
    if (state.snakeStyle === "berry") return "#ff7eb6";
    if (state.snakeStyle === "ocean") return "#74c0fc";
    if (state.snakeStyle === "sun") return "#ffd43b";
    return "#a7cb6f";
  }

  function getTargetCount(){
    return state.fieldWidth <= 520 ? 2 : 3;
  }

  function pickWordDecoys(correctWord, count){
    const safePool = FUNNY_DECOY_WORDS.filter(word => word.toLowerCase() !== String(correctWord).toLowerCase());
    const pool = shuffle(Array.from(new Set(safePool)));

    const out = [];
    for (const word of pool){
      out.push(word);
      if (out.length >= count) break;
    }

    while (out.length < count){
      out.push("taco");
    }

    return out;
  }

  function pickBookDecoys(correctBook, count){
    const pool = shuffle(
      Array.from(new Set(ALL_BIBLE_BOOKS.filter(book => book !== correctBook)))
    );

    const out = [];
    for (const book of pool){
      out.push(book);
      if (out.length >= count) break;
    }

    while (out.length < count){
      out.push(correctBook);
    }

    return out;
  }

  function buildReferenceDecoys(correctRef, count){
    const out = [];
    const match = String(correctRef || "").match(/^(\d+):(\d+)(.*)$/);

    if (match){
      const chapter = parseInt(match[1], 10);
      const verse = parseInt(match[2], 10);
      const suffix = match[3] || "";

      const candidates = [
        `${chapter}:${Math.max(1, verse - 1)}${suffix}`,
        `${chapter}:${verse + 1}${suffix}`,
        `${Math.max(1, chapter - 1)}:${verse}${suffix}`,
        `${chapter + 1}:${verse}${suffix}`,
        `${chapter}:${verse + 2}${suffix}`,
        `${chapter + 1}:${verse + 1}${suffix}`
      ];

      for (const candidate of candidates){
        if (candidate !== correctRef && !out.includes(candidate)){
          out.push(candidate);
        }
        if (out.length >= count) break;
      }
    }

    const fallbacks = ["1:1", "3:16", "8:28", "23:1", "5:13", "4:12"];
    for (const candidate of fallbacks){
      if (candidate !== correctRef && !out.includes(candidate)){
        out.push(candidate);
      }
      if (out.length >= count) break;
    }

    while (out.length < count){
      out.push(correctRef);
    }

    return out;
  }

  function getChoicesForCurrentPhase(){
    const phase = getCurrentPhase();
    const correct = getCurrentCorrectLabel();
    const decoyCount = getTargetCount() - 1;

    if (phase === "words"){
      return [
        { word: correct, isCorrect: true },
        ...pickWordDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    if (phase === "book"){
      return [
        { word: correct, isCorrect: true },
        ...pickBookDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    if (phase === "reference"){
      return [
        { word: correct, isCorrect: true },
        ...buildReferenceDecoys(correct, decoyCount).map(word => ({ word, isCorrect: false }))
      ];
    }

    return [];
  }

  function distance(a, b){
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function findSpawnPosition(existing){
    const marginX = 64;
    const marginTop = 90;
    const marginBottom = 80;
    const headPoint = { x: state.head.x, y: state.head.y };

    for (let i = 0; i < 80; i++){
      const p = {
        x: marginX + Math.random() * Math.max(40, state.fieldWidth - marginX * 2),
        y: marginTop + Math.random() * Math.max(40, state.fieldHeight - marginTop - marginBottom)
      };

      if (distance(p, headPoint) < 150) continue;

      let tooClose = false;
      for (const item of existing){
        if (distance(p, item) < 120){
          tooClose = true;
          break;
        }
      }

      if (!tooClose) return p;
    }

    return {
      x: state.fieldWidth * 0.5,
      y: state.fieldHeight * 0.5
    };
  }

  function scheduleTargetsSpawn(){
    const correctLabel = getCurrentCorrectLabel();
    if (!correctLabel){
      state.targets = [];
      renderTargets();
      return;
    }

    const choices = getChoicesForCurrentPhase();
    const shuffledChoices = shuffle(choices);
    const shuffledColors = shuffle(TARGET_COLORS);
    const usedPositions = [];
    const baseTime = performance.now() + 170;

    state.targets = shuffledChoices.map((choice, index) => {
      const pos = findSpawnPosition(usedPositions);
      usedPositions.push(pos);

      return {
        id: state.nextTargetId++,
        word: choice.word,
        isCorrect: choice.isCorrect,
        x: pos.x,
        y: pos.y,
        r: 21,
        color: shuffledColors[index % shuffledColors.length],
        flashUntil: 0,
        flashing: false,
        visible: false,
        visibleAt: baseTime + index * 120
      };
    });

    renderTargets();
  }

  function updateTargetVisibility(now){
    let changed = false;

    for (const target of state.targets){
      if (!target.visible && now >= target.visibleAt){
        target.visible = true;
        changed = true;
      }

      if (target.flashing && now >= target.flashUntil){
        target.flashing = false;
        changed = true;
      }
    }

    if (changed){
      renderTargets();
    }
  }

  function renderTargets(){
    const layer = document.getElementById("vsTargetLayer");
    if (!layer) return;

    layer.innerHTML = state.targets
      .filter(target => target.visible)
      .map(target => `
        <div
          class="vs-target is-visible ${target.flashing ? "is-wrong" : ""}"
          style="left:${target.x}px; top:${target.y}px;"
        >
          <div class="vs-target-dot" style="background:${target.color};"></div>
          <div class="vs-target-word">${escapeHtml(target.word)}</div>
        </div>
      `).join("");
  }

  function completeCurrentMode(){
    const result = window.VerseGameBridge.markCompleted({
      verseId: ctx.verseId,
      gameId: "verse_snake",
      mode: selectedMode,
      progressType: "standard"
    });

    const shouldAutoShowPetUnlock = !!result?.petUnlockTriggered;
    completed = true;
    renderDone(shouldAutoShowPetUnlock);
  }

  function handleCorrectTarget(target){
    state.progressIndex += 1;
    state.happyUntil = performance.now() + 260;

    updateBuildText();

    if (state.progressIndex >= state.segments.length){
      completeCurrentMode();
      return;
    }

    state.targets = [];
    renderTargets();

    setTimeout(() => {
      if (!state.running) return;
      scheduleTargetsSpawn();
    }, 170);
  }

  function applyWrongPenalty(){
    if (selectedMode === "easy"){
      return false;
    }

    if (selectedMode === "medium"){
      const newIndex = Math.max(0, state.progressIndex - 2);
      const changed = newIndex !== state.progressIndex;
      state.progressIndex = newIndex;
      return changed;
    }

    if (selectedMode === "hard"){
      const changed = state.progressIndex !== 0;
      state.progressIndex = 0;
      return changed;
    }

    return false;
  }

  function handleWrongTarget(target){
    const now = performance.now();
    if (target.flashing) return;

    target.flashing = true;
    target.flashUntil = now + 240;
    state.flashUntil = now + 240;
    shakeBuildArea();

    const changedProgress = applyWrongPenalty();
    updateBuildText();

    state.targets = state.targets.filter(t => t.id !== target.id);
    renderTargets();

    if (changedProgress || state.targets.filter(t => t.visible && !t.isCorrect).length === 0){
      setTimeout(() => {
        if (!state.running) return;
        scheduleTargetsSpawn();
      }, 190);
    }
  }

  function checkTargetCollisions(){
    if (!state.targets.length) return;

    const headPoint = { x: state.head.x, y: state.head.y };
    const headRadius = 18;

    for (const target of state.targets){
      if (!target.visible) continue;

      const d = Math.hypot(headPoint.x - target.x, headPoint.y - target.y);
      if (d <= target.r + headRadius){
        if (target.isCorrect){
          handleCorrectTarget(target);
        } else {
          handleWrongTarget(target);
        }
        break;
      }
    }
  }

  function renderDone(autoShowPetUnlock = false){
    stopLoop();

    app.innerHTML = `
      <div class="vm-stack" style="padding:18px 16px 22px; min-height:100dvh;">
        <div class="vm-title">🎉 Great job!</div>
        <div class="vm-subtitle">
          ${
            autoShowPetUnlock
              ? "You unlocked a BibloPet!"
              : `Verse Snake ${selectedMode} was marked complete.`
          }
        </div>

        <div class="vm-actions">
          <button class="vm-btn" id="againBtn">Play Again</button>
          <button class="vm-btn vm-btn-dark" id="backBtn">Practice Games</button>
        </div>
      </div>
    `;

    document.getElementById("againBtn").onclick = () => {
      completed = false;
      renderModeSelect();
    };

    document.getElementById("backBtn").onclick = () => {
      window.VerseGameBridge.exitGame();
    };

    if (autoShowPetUnlock){
      setTimeout(() => {
        window.VerseGameBridge.exitGame();
      }, 450);
    }
  }

  renderModeSelect();
})();
