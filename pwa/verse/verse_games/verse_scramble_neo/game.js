(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "verse_scramble_neo";

  let selectedMode = null;
  let muted = false;
  let bestWpm = 0;

  const BUTTON_COLORS = [
    "vsn-color-red",
    "vsn-color-orange",
    "vsn-color-yellow",
    "vsn-color-green",
    "vsn-color-blue",
    "vsn-color-pink"
  ];
const BUTTON_SHAPES = [
  "vsn-shape-blob",
  "vsn-shape-splat",
  "vsn-shape-pill",
  "vsn-shape-cloud",
  "vsn-shape-goo",
  "vsn-shape-marshmallow",
  "vsn-shape-puddle",
  "vsn-shape-jelly",
  "vsn-shape-soft-boom",
  "vsn-shape-soft-star",
  "vsn-shape-squish",
  "vsn-shape-gumdrop",
  "vsn-shape-splash",
  "vsn-shape-melt",
  "vsn-shape-cushion",
  "vsn-shape-muffin-top",
  "vsn-shape-bubble-blob",
  "vsn-shape-wobble"
];

const BUTTON_DANCES = [
  "vsn-dance-bouncey",
  "vsn-dance-jelly",
  "vsn-dance-wiggle",
  "vsn-dance-bobble",
  "vsn-dance-sway",
  "vsn-dance-pulse",
  "vsn-dance-scoot",
  "vsn-dance-wobble",
  "vsn-dance-plop",
  "vsn-dance-noodle",
  "vsn-dance-squash",
  "vsn-dance-float"
];

  const FUN_DECOYS = [
    "taco","banana","penguin","cupcake","dinosaur","pickle","marshmallow","noodle","waffle","rocket",
    "jellybean","pancake","popcorn","unicorn","bubble","muffin","otter","kangaroo","scooter","rainbow",
    "pretzel","monkey","donut","cookie","balloon","zebra","narwhal","kitten","puppy","burrito",
    "pirate","robot","slipper","backpack","bongo","volcano","watermelon","cheeseburger","toothbrush","snowman",
    "duckling","hamster","meatball","spaghetti","blueberry","coconut","sundae","firetruck","yo-yo","treasure"
  ];
  const BIBLE_BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther",
    "Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
    "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
    "Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians",
    "Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
    "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const state = {
    screen: "intro",
    words: [],
    segments: [],
    metaIndices: new Set(),
    progressIndex: 0,
    streak: 0,
    bestStreak: 0,
    buildSizeClass: "is-normal",
    buildRemoving: new Set(),
    bookLabel: "",
    referenceLabel: "",
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    busy: false,
    completed: false,
    startTime: 0,
    endTime: 0,
    roundChoices: [],
    redFlashKey: 0,
    boardSeed: 0
  };

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
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

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
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
      return { book: titleCaseBookFromSlug(idRangeMatch[1]), reference: `${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}` };
    }
    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch){
      return { book: titleCaseBookFromSlug(idMatch[1]), reference: `${idMatch[2]}:${idMatch[3]}` };
    }

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
      return { book: match[1].trim(), reference: match[2].trim() };
    }

    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0){
      return { book: raw.slice(0, lastSpace).trim(), reference: raw.slice(lastSpace + 1).trim() };
    }

    return { book: raw, reference: "" };
  }

  function getBuildLengthScore(verseText, book, reference){
    return String(verseText || "").length + String(book || "").length + String(reference || "").length;
  }

  function getBuildSizeClass(verseText, book, reference){
    const score = getBuildLengthScore(verseText, book, reference);
    if (score >= 136) return "is-small";
    if (score >= 106) return "is-medium";
    return "is-normal";
  }

  function normalizeWord(word){
    return String(word || "").toLowerCase();
  }

  function initVerseData(){
    state.words = tokenizeVerse(ctx.verseText);
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    state.bookLabel = parsed.book || "";
    state.referenceLabel = parsed.reference || "";
    state.buildSizeClass = getBuildSizeClass(ctx.verseText, state.bookLabel, state.referenceLabel);
    state.segments = [...state.words];
    state.metaIndices = new Set();
    if (state.bookLabel){
      state.metaIndices.add(state.segments.length);
      state.segments.push(state.bookLabel);
    }
    if (state.referenceLabel){
      state.metaIndices.add(state.segments.length);
      state.segments.push(state.referenceLabel);
    }
    state.progressIndex = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.buildRemoving = new Set();
    state.roundChoices = [];
    state.busy = false;
    state.completed = false;
    state.boardSeed = 0;
    state.redFlashKey = 0;
  }

  function currentPhase(){
    if (state.progressIndex < state.words.length) return "words";
    if (state.progressIndex === state.words.length && state.bookLabel) return "book";
    if (state.progressIndex < state.segments.length) return "reference";
    return "done";
  }

  function currentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function uniqueVisibleChoices(correct, decoys){
    const out = [correct];
    const seen = new Set([normalizeWord(correct)]);
    for (const d of decoys){
      const key = normalizeWord(d);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(d);
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

  function bookDecoys(correct){
    return shuffle(BIBLE_BOOKS.filter(book => normalizeWord(book) !== normalizeWord(correct)));
  }

  function refDecoys(correctRef){
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
        if (candidate !== correctRef && !out.includes(candidate)) out.push(candidate);
      }
    }
    for (const fallback of ["1:1","3:16","8:28","23:1","5:13","4:12"]){
      if (fallback !== correctRef && !out.includes(fallback)) out.push(fallback);
    }
    return shuffle(out);
  }

  function buildRoundChoices(){
    const correct = currentCorrectLabel();
    const phase = currentPhase();
    let decoyPool = [];
    if (phase === "words"){
      decoyPool = selectedMode === "easy" ? easyDecoys(correct) : verseWordDecoys(correct);
      if (decoyPool.length < 2) decoyPool = decoyPool.concat(easyDecoys(correct));
    } else if (phase === "book"){
      decoyPool = bookDecoys(correct);
    } else if (phase === "reference"){
      decoyPool = refDecoys(correct);
    }

    const choices = uniqueVisibleChoices(correct, decoyPool).slice(0, 3);
    while (choices.length < 3){
      const fallback = phase === "book" ? bookDecoys(correct) : easyDecoys(correct);
      for (const item of fallback){
        if (choices.map(normalizeWord).includes(normalizeWord(item))) continue;
        choices.push(item);
        if (choices.length >= 3) break;
      }
    }

    const colors = shuffle(BUTTON_COLORS).slice(0, 3);
    const shaped = shuffle(BUTTON_SHAPES);
    const dances = shuffle(BUTTON_DANCES).slice(0, 3);

    const perRow = shuffle(choices).map((label, index) => ({
      id: `choice_${state.boardSeed}_${index}`,
      label,
      isCorrect: normalizeWord(label) === normalizeWord(correct),
      colorClass: colors[index],
      shapeClass: shaped[index % shaped.length],
      danceClass: dances[index],
      rotation: `${[-5,-2,3,5,1,-3][Math.floor(Math.random() * 6)]}deg`
    }));
    state.roundChoices = perRow;
    state.boardSeed += 1;
  }

  function streakDancing(){
    return state.streak >= 3;
  }

  function setScreen(screen){
    state.screen = screen;
    render();
  }

  function formatMode(mode){
    return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Mode";
  }

  function renderBuildText(){
    return state.segments.map((segment, index) => {
      const built = index < state.progressIndex;
      const meta = state.metaIndices.has(index);
      const removing = state.buildRemoving.has(index);
      return `<span class="vsn-build-word ${built ? "is-built" : ""} ${meta ? "is-meta" : ""} ${removing ? "is-removing" : ""}">${escapeHtml(segment)}</span>`;
    }).join(" ");
  }

  function navIcon(svg){ return svg; }

  function getHomeSvg(){
    return `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/></svg>`;
  }
  function getMuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round" d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z" /><g transform="translate(-26.458334,-255.59263)"><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1" d="M 1241.4124,524.69155 890.61025,875.49365" /><path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1" d="m 890.61025,524.69155 350.80215,350.8021" /></g></svg>`;
  }
  function getUnmuteSvg(){
    return `<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g transform="matrix(2.9017243,0,0,2.9017243,-948.59169,1423.6267)"><path style="fill:#ffffff;stroke:none;stroke-width:15.4884;stroke-linecap:round" d="m 554.69651,-460.54773 -86.50507,53.22802 a 51.858137,51.858137 0 0 1 -27.17654,7.69139 h -36.35067 a 14.676664,14.676664 0 0 0 -14.67666,14.67666 v 95.04477 a 14.676664,14.676664 0 0 0 14.67666,14.67666 h 36.35067 a 51.858137,51.858137 0 0 1 27.17654,7.69139 l 86.50507,53.22802 a 8.2017227,8.2017227 0 0 0 12.49988,-6.98527 v -232.26637 a 8.2017227,8.2017227 0 0 0 -12.49988,-6.98527 z" /><path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1" d="m 596.38634,-270.01659 c 26.00162,-13.81364 42.0863,-39.52797 42.16745,-67.41243 -0.0102,-27.95044 -16.10446,-53.75052 -42.16745,-67.5969" /><path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1" d="m 626.65943,-233.57231 c 4.34269,-2.51562 16.69789,-10.99898 23.86366,-17.76894 23.32002,-22.03191 37.74343,-52.46821 37.74343,-86.08777 0,-33.61956 -14.42341,-64.05637 -37.74343,-86.08828 -7.16577,-6.76996 -19.52097,-15.25332 -23.86366,-17.76894" /></g></svg>`;
  }

  function renderTopNav(){
    return `<div class="vsn-mode-card" style="display:none"></div>`;
  }

  function renderIntro(){
    app.innerHTML = `
      <div class="vsn-mode-shell">
        <div class="vsn-mode-stage">
          <div class="vsn-mode-top">
            <div style="font-size:72px;line-height:1;">🧩</div>
            <div class="vsn-mode-title">Verse Scramble</div>
            <div class="vsn-mode-subtitle">Tap the next correct word as fast as you can. Build the verse, then the book, then the reference.</div>
            <div class="vsn-mode-card">
              <div class="vsn-mode-actions">
                <button class="vm-btn no-zoom" id="vsnStartBtn">Start</button>
              </div>
            </div>
          </div>
        </div>
        ${renderModeNav()}
        ${renderHelpOverlay()}
      </div>`;
    wireModeNav();
    document.getElementById("vsnStartBtn").onclick = () => setScreen("mode");
  }

  function renderMode(){
    app.innerHTML = `
      <div class="vsn-mode-shell">
        <div class="vsn-mode-stage">
          <div class="vsn-mode-top">
            <div class="vsn-mode-title">🧩 Verse Scramble</div>
            <div class="vsn-mode-subtitle">Choose your difficulty.</div>
            <div class="vsn-mode-card">
              <div class="vsn-mode-actions">
                <button class="vm-btn no-zoom" data-mode="easy">Easy</button>
                <button class="vm-btn no-zoom" data-mode="medium">Medium</button>
                <button class="vm-btn no-zoom" data-mode="hard">Hard</button>
              </div>
            </div>
          </div>
        </div>
        ${renderModeNav()}
        ${renderHelpOverlay()}
      </div>`;
    wireModeNav();
    document.querySelectorAll("[data-mode]").forEach(btn => {
      btn.onclick = () => {
        selectedMode = btn.dataset.mode;
        initVerseData();
        state.startTime = performance.now();
        buildRoundChoices();
        setScreen("game");
      };
    });
  }

  function renderGame(){
    app.innerHTML = `
      <div class="vsn-root">
        <div class="vsn-stage">
          <div class="vsn-build-wrap">
            <div class="vsn-build ${state.buildRemoving.size ? "vsn-shake" : ""}" id="vsnBuild">
              <div class="vsn-build-text ${state.buildSizeClass}" id="vsnBuildText">${renderBuildText()}</div>
            </div>
          </div>
          <div class="vsn-game-wrap">
            <div class="vsn-game-board" id="vsnBoard">
              <div class="vsn-red-flash ${state.redFlashKey ? "is-flashing" : ""}" id="vsnRedFlash"></div>
              <div class="vsn-particle-layer" id="vsnParticleLayer"></div>
              <div class="vsn-smoke-layer" id="vsnSmokeLayer"></div>
              <div class="vsn-board-content">
                <div class="vsn-overlay-pills">
                  <button class="vsn-pill vsn-menu-pill no-zoom" id="vsnMenuPill" aria-label="Game Menu" type="button">☰</button>
                  <div class="vsn-pill" id="vsnStreakPill">Streak: ${state.streak}</div>
                </div>
                <div class="vsn-main-area" id="vsnMainArea">
                  ${state.roundChoices.map((choice, index) => `
                    <div class="vsn-row" data-row="${index}">
                      <button
                        class="vsn-choice ${choice.colorClass} ${choice.shapeClass} ${streakDancing() ? choice.danceClass : ""} is-spawning no-zoom"
                        id="${choice.id}"
                        data-choice-id="${choice.id}"
                        type="button"
                        style="--vsn-rot:${choice.rotation};"
                      >${escapeHtml(choice.label)}</button>
                    </div>
                  `).join("")}
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

  function totalElapsedMs(){
    return Math.max(1, (state.endTime || performance.now()) - state.startTime);
  }

  function wordsPerMinute(){
    const taps = state.segments.length;
    const minutes = totalElapsedMs() / 60000;
    return Math.max(1, Math.round(taps / minutes));
  }

  function renderEnd(){
    const wpm = wordsPerMinute();
    bestWpm = Math.max(bestWpm, wpm);
    const timeSecs = (totalElapsedMs() / 1000).toFixed(1);
    app.innerHTML = `
      <div class="vsn-mode-shell">
        <div class="vsn-mode-stage">
          <div class="vsn-end-card">
            <div class="vsn-end-title">You finished Verse Scramble!</div>
            <div class="vsn-speedometer">
              <div class="vsn-speedometer-label">Your speed was</div>
              <div class="vsn-speedometer-value">${wpm}</div>
              <div class="vsn-speedometer-label">words per minute</div>
              <div class="vsn-speedometer-sub">Time: ${timeSecs}s · Best streak: ${state.bestStreak}<br>Beat your top speed of ${bestWpm} WPM.</div>
            </div>
            <div class="vsn-end-stats">Mode: ${escapeHtml(formatMode(selectedMode))}</div>
            <div class="vsn-mode-card">
              <div class="vsn-mode-actions">
                <button class="vm-btn no-zoom" id="vsnPlayAgainBtn">Play Again</button>
                <button class="vm-btn no-zoom" id="vsnExitBtn">Exit Game</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById("vsnPlayAgainBtn").onclick = () => {
      initVerseData();
      state.startTime = performance.now();
      buildRoundChoices();
      setScreen("game");
    };
    document.getElementById("vsnExitBtn").onclick = () => window.VerseGameBridge.exitGame();
  }

  function renderModeNav(){
    return `
      <div style="width:100%;max-width:840px;margin:0 auto;padding:0 14px calc(12px + var(--vsn-safe-bottom));display:flex;justify-content:space-between;align-items:center;gap:14px;background:rgba(0,0,0,0.30);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);height:70px;">
        <button class="no-zoom" id="vsnHomeBtn" aria-label="Home" style="width:54px;height:54px;border:none;border-radius:16px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;">${navIcon(getHomeSvg())}</button>
        <button class="no-zoom" id="vsnHelpBtn" type="button" style="min-width:118px;height:44px;padding:0 16px;border:none;border-radius:999px;background:rgba(255,255,255,0.14);color:#fff;font-size:16px;font-weight:900;">HELP</button>
        <button class="no-zoom" id="vsnMuteBtn" aria-label="Mute" style="width:54px;height:54px;border:none;border-radius:16px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;">${muted ? getMuteSvg() : getUnmuteSvg()}</button>
      </div>`;
  }

  function renderHelpOverlay(){
    return `
      <div class="vsn-help-overlay ${state.helpOpen ? "show" : ""}" id="vsnHelpOverlay" aria-hidden="${state.helpOpen ? "false" : "true"}">
        <div class="vsn-help-dialog">
          <div class="vsn-help-title">How to Play Verse Scramble</div>
          <div class="vsn-help-body">
            Tap the next correct word as quickly as you can.<br><br>
            Easy: fun decoys.<br>
            Medium: decoys are other words from the verse.<br>
            Hard: same as Medium, but wrong taps remove two built words.<br><br>
            After the verse words, collect the book, then the reference.
          </div>
          <div class="vsn-help-actions">
            <button class="vsn-help-close no-zoom" id="vsnHelpCloseBtn" type="button">${state.helpBackMode ? "Back" : "OK"}</button>
          </div>
        </div>
      </div>`;
  }

  function renderGameMenuOverlay(){
    return `
      <div class="vsn-help-overlay ${state.menuOpen ? "show" : ""}" id="vsnGameMenuOverlay" aria-hidden="${state.menuOpen ? "false" : "true"}">
        <div class="vsn-help-dialog vsn-game-menu-dialog">
          <div class="vsn-help-title vsn-game-menu-title">Game Menu</div>
          <div class="vsn-game-menu-actions">
            <button class="vsn-game-menu-btn no-zoom" id="vsnMenuHowToBtn" type="button">How to Play</button>
            <button class="vsn-game-menu-btn no-zoom" id="vsnMenuMuteBtn" type="button">${muted ? "Unmute" : "Mute"}</button>
            <button class="vsn-game-menu-btn no-zoom" id="vsnMenuExitBtn" type="button">Exit Game</button>
            <button class="vsn-game-menu-btn no-zoom" id="vsnMenuCloseBtn" type="button">Close</button>
          </div>
        </div>
      </div>`;
  }

  function wireModeNav(){
    const homeBtn = document.getElementById("vsnHomeBtn");
    const helpBtn = document.getElementById("vsnHelpBtn");
    const muteBtn = document.getElementById("vsnMuteBtn");
    const helpOverlay = document.getElementById("vsnHelpOverlay");
    const helpCloseBtn = document.getElementById("vsnHelpCloseBtn");

    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (helpBtn) helpBtn.onclick = () => { state.helpOpen = true; state.helpBackMode = false; render(); };
    if (helpCloseBtn) helpCloseBtn.onclick = () => { state.helpOpen = false; state.helpBackMode = false; render(); };
    if (helpOverlay) helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){ state.helpOpen = false; state.helpBackMode = false; render(); }
    };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
  }

  function wireGameScreen(){
    const menuPill = document.getElementById("vsnMenuPill");
    if (menuPill){
      menuPill.onclick = (e) => {
        e.stopPropagation();
        if (state.busy) return;
        state.menuOpen = true;
        state.helpOpen = false;
        state.helpBackMode = false;
        render();
      };
    }

    document.querySelectorAll("[data-choice-id]").forEach(btn => {
      btn.onclick = () => handleChoice(btn.dataset.choiceId);
    });

    const menuOverlay = document.getElementById("vsnGameMenuOverlay");
    const helpOverlay = document.getElementById("vsnHelpOverlay");
    const closeHelp = document.getElementById("vsnHelpCloseBtn");
    const howTo = document.getElementById("vsnMenuHowToBtn");
    const muteBtn = document.getElementById("vsnMenuMuteBtn");
    const exitBtn = document.getElementById("vsnMenuExitBtn");
    const closeBtn = document.getElementById("vsnMenuCloseBtn");

    if (howTo) howTo.onclick = () => { state.menuOpen = false; state.helpOpen = true; state.helpBackMode = true; render(); };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
    if (exitBtn) exitBtn.onclick = () => window.VerseGameBridge.exitGame();
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

  function flashWrongBoard(){
    const el = document.getElementById("vsnRedFlash");
    if (!el) return;
    el.classList.remove("is-flashing");
    void el.offsetWidth;
    el.classList.add("is-flashing");
  }

  function spawnParticlesAtButton(buttonEl, type){
    const layer = document.getElementById(type === "smoke" ? "vsnSmokeLayer" : "vsnParticleLayer");
    if (!layer || !buttonEl) return;
    const layerRect = layer.getBoundingClientRect();
    const rect = buttonEl.getBoundingClientRect();
    const cx = rect.left - layerRect.left + rect.width / 2;
    const cy = rect.top - layerRect.top + rect.height / 2;

    if (type === "smoke"){
      for (let i = 0; i < 9; i++){
        const puff = document.createElement("div");
        puff.className = "vsn-smoke";
        puff.style.left = `${cx + (Math.random() * 34 - 17)}px`;
        puff.style.top = `${cy + (Math.random() * 18 - 9)}px`;
        puff.style.setProperty("--sx", `${Math.round(Math.random() * 30 - 15)}px`);
        puff.style.setProperty("--sy", `${Math.round(-10 - Math.random() * 24)}px`);
        layer.appendChild(puff);
        puff.addEventListener("animationend", () => puff.remove(), { once:true });
      }
      return;
    }

    const palette = ["#ffffff", "#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#f8f8f8"];
    const count = 18 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++){
      const particle = document.createElement("div");
      particle.className = "vsn-particle";
      particle.style.left = `${cx}px`;
      particle.style.top = `${cy}px`;
      particle.style.setProperty("--dx", `${Math.round(Math.random() * 120 - 60)}px`);
      particle.style.setProperty("--dy", `${Math.round(Math.random() * 120 - 60)}px`);
      particle.style.setProperty("--pcolor", palette[i % palette.length]);
      layer.appendChild(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once:true });
    }
  }

  function spawnSmokeForAll(){
    state.roundChoices.forEach(choice => {
      const el = document.getElementById(choice.id);
      if (el) spawnParticlesAtButton(el, "smoke");
    });
  }

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function handleChoice(choiceId){
    if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;
    const choice = state.roundChoices.find(c => c.id === choiceId);
    const btn = document.getElementById(choiceId);
    if (!choice || !btn) return;
    state.busy = true;

    if (choice.isCorrect){
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      spawnParticlesAtButton(btn, "burst");
      state.roundChoices.forEach(c => {
        const el = document.getElementById(c.id);
        if (!el) return;
        if (c.id === choiceId){
          el.classList.add("is-bursting");
        } else {
          el.style.opacity = "0";
        }
      });
      await sleep(340);
      state.progressIndex += 1;
      if (state.progressIndex >= state.segments.length){
        state.completed = true;
        state.endTime = performance.now();
        await window.VerseGameBridge.markCompleted({
          verseId: ctx.verseId,
          gameId: GAME_ID,
          mode: selectedMode
        });
        state.busy = false;
        setScreen("end");
        return;
      }
      buildRoundChoices();
      state.busy = false;
      render();
      return;
    }

    state.streak = 0;
    spawnSmokeForAll();
    flashWrongBoard();
    const build = document.getElementById("vsnBuild");
    if (build){
      build.classList.remove("vsn-shake");
      void build.offsetWidth;
      build.classList.add("vsn-shake");
    }
    state.roundChoices.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) el.style.opacity = "0";
    });

    if (selectedMode === "hard"){
      const removeCount = Math.min(2, state.progressIndex);
      const removing = new Set();
      for (let i = 0; i < removeCount; i++) removing.add(state.progressIndex - 1 - i);
      state.buildRemoving = removing;
      render();
      const buildAgain = document.getElementById("vsnBuild");
      if (buildAgain){
        buildAgain.classList.remove("vsn-shake");
        void buildAgain.offsetWidth;
        buildAgain.classList.add("vsn-shake");
      }
      await sleep(380);
      state.progressIndex = Math.max(0, state.progressIndex - removeCount);
      state.buildRemoving = new Set();
    } else {
      await sleep(360);
    }

    buildRoundChoices();
    state.busy = false;
    render();
  }

  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
