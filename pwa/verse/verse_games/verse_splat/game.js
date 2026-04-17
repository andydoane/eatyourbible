(async function(){
  const app = document.getElementById("app");
  if (!app) return;
  app.classList.add("vm-shell", "vs-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "bouncing";
  const GAME_TITLE = "Verse Splat";

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

  const BLOB_COLORS = [
    { bg: "#ff5a51", darkText: false },
    { bg: "#ffa351", darkText: false },
    { bg: "#ffc751", darkText: true },
    { bg: "#a7cb6f", darkText: false },
    { bg: "#40b9c5", darkText: false },
    { bg: "#7f66c6", darkText: false }
  ];

  const BONUS_COLORS = ["#ff5a51", "#ffa351", "#ffc751", "#a7cb6f", "#40b9c5", "#7f66c6"];

  const state = {
    screen: "intro",
    mode: null,
    words: [],
    segments: [],
    metaIndices: new Set(),
    buildSizeClass: "is-normal",
    progressIndex: 0,
    buildRemoving: new Set(),
    blobs: [],
    activeIds: [],
    busy: false,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    completed: false,
    startTime: 0,
    endTime: 0,
    bookLabel: "",
    referenceLabel: "",
    medalMessage: "",
    medalSubmessage: "",
    boardFlash: false,
    streak: 0,
    wrongTapCount: 0,
    fieldRect: null,
    rafId: 0,
    frameTs: 0,
    bonusStartedAt: 0,
    bonusEndedAt: 0,
    bonusIntroVisible: true,
    bonusBlobs: [],
    bonusDone: false,
    bonusSplatted: 0,
    particles: [],
  };

  let muted = false;
  let blobIdCounter = 1;
  let particleIdCounter = 1;

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function escapeHtml(str){
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function tokenizeVerse(text){ return String(text || "").trim().split(/\s+/).filter(Boolean); }
  function normalizeWord(word){ return String(word || "").toLowerCase(); }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of","the"]);
    return String(slug || "").split("_").filter(Boolean).map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(" ");
  }

  function parseReferenceParts(ref, translation, verseId){
    const id = String(verseId || "").trim();
    const idRangeMatch = id.match(/^(.+?)_(\d+)_(\d+)_(\d+)$/);
    if (idRangeMatch) return { book: titleCaseBookFromSlug(idRangeMatch[1]), reference: `${idRangeMatch[2]}:${idRangeMatch[3]}-${idRangeMatch[4]}` };
    const idMatch = id.match(/^(.+?)_(\d+)_(\d+(?:[-–]\d+)?)$/);
    if (idMatch) return { book: titleCaseBookFromSlug(idMatch[1]), reference: `${idMatch[2]}:${idMatch[3]}` };

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
    if (match) return { book: match[1].trim(), reference: match[2].trim() };
    const lastSpace = raw.lastIndexOf(" ");
    if (lastSpace > 0) return { book: raw.slice(0, lastSpace).trim(), reference: raw.slice(lastSpace + 1).trim() };
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
  function bookDecoys(correct){ return shuffle(BIBLE_BOOKS.filter(book => normalizeWord(book) !== normalizeWord(correct))); }
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
      for (const candidate of candidates){ if (candidate !== correctRef && !out.includes(candidate)) out.push(candidate); }
    }
    for (const fallback of ["1:1","3:16","8:28","23:1","5:13","4:12"]){ if (fallback !== correctRef && !out.includes(fallback)) out.push(fallback); }
    return shuffle(out);
  }

  function initVerseData(){
    state.words = tokenizeVerse(ctx.verseText);

    if (!state.words.length && ctx.verseRef) {
      state.words = [ctx.verseRef];
    }
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
    state.blobs = [];
    state.activeIds = [];
    state.busy = false;
    state.menuOpen = false;
    state.helpOpen = false;
    state.helpBackMode = false;
    state.completed = false;
    state.startTime = 0;
    state.endTime = 0;
    state.medalMessage = "";
    state.medalSubmessage = "";
    state.boardFlash = false;
    state.streak = 0;
    state.wrongTapCount = 0;
    state.frameTs = 0;
    state.particles = [];
    state.bonusStartedAt = 0;
    state.bonusEndedAt = 0;
    state.bonusIntroVisible = true;
    state.bonusBlobs = [];
    state.bonusDone = false;
    state.bonusSplatted = 0;
  }

  function currentFieldRect(){
    const field = $(state.screen === "bonus" ? ".vs-bonus-stage" : ".vs-field");
    if (!field) return null;
    const rect = field.getBoundingClientRect();
    return { width: Math.max(240, rect.width), height: Math.max(200, rect.height) };
  }

  function blobSpeedPerSecond(width, height){
    const minDim = Math.min(width, height);
    const base = minDim * 0.28;
    if (state.mode === "medium") return base * 1.08;
    if (state.mode === "hard") return base * 1.18;
    return base;
  }

  function randomVelocity(width, height){
    const speed = blobSpeedPerSecond(width, height);
    let angle = 0;
    let tries = 0;
    do {
      angle = Math.random() * Math.PI * 2;
      tries += 1;
    } while (tries < 25 && (Math.abs(Math.cos(angle)) > 0.96 || Math.abs(Math.sin(angle)) > 0.96));
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }

  function measureBlobSize(fieldRect, label){
    const len = String(label || "").length;

    const baseWidth = clamp(fieldRect.width * 0.34, fieldRect.width * 0.25, fieldRect.width * 0.52);
    const wordFactor = clamp(len / 8.5, 0.82, 1.58);

    const blobW = clamp(baseWidth * wordFactor, fieldRect.width * 0.28, fieldRect.width * 0.62);
    const blobH = clamp(fieldRect.height * 0.18, fieldRect.height * 0.12, fieldRect.height * 0.28);

    const font = clamp(blobW * 0.145, 18, 36);

    return { w: blobW, h: blobH, font };
  }

  function findSafePosition(fieldRect, existing, w, h){
    const attempts = 120;
    const pad = Math.min(fieldRect.width, fieldRect.height) * 0.012;
    const minDist = Math.min(fieldRect.width, fieldRect.height) * 0.13;
    const minX = pad;
    const maxX = Math.max(minX, fieldRect.width - w - pad);
    const minY = pad;
    const maxY = Math.max(minY, fieldRect.height - h - pad);
    let fallback = { x: minX, y: minY };

    for (let i = 0; i < attempts; i++){
      const x = minX + Math.random() * Math.max(1, maxX - minX);
      const y = minY + Math.random() * Math.max(1, maxY - minY);
      fallback = { x, y };
      const cx = x + w / 2;
      const cy = y + h / 2;
      const hit = existing.some(b => {
        const ox = b.x + b.w / 2;
        const oy = b.y + b.h / 2;
        return Math.hypot(cx - ox, cy - oy) < Math.max(minDist, (w + b.w) * 0.38, (h + b.h) * 0.42);
      });
      if (!hit) return { x, y };
    }
    return fallback;
  }

  function currentRoundDecoyPool(correct, phase){
    if (phase === "words"){
      let pool = state.mode === "easy" ? easyDecoys(correct) : verseWordDecoys(correct);
      if (pool.length < 2) pool = pool.concat(easyDecoys(correct));
      return pool;
    }
    if (phase === "book") return bookDecoys(correct);
    if (phase === "reference") return refDecoys(correct);
    return [];
  }

  function makeRoundLabels(){
    const phase = currentPhase();
    const correct = currentCorrectLabel();
    const pool = currentRoundDecoyPool(correct, phase);
    const labels = uniqueVisibleChoices(correct, pool).slice(0, 3);
    while (labels.length < 3){
      const fallback = phase === "book" ? bookDecoys(correct) : easyDecoys(correct);
      for (const item of fallback){
        if (labels.map(normalizeWord).includes(normalizeWord(item))) continue;
        labels.push(item);
        if (labels.length >= 3) break;
      }
    }
    return shuffle(labels);
  }

  function respawnRound(keepIds = []){
    const fieldRect = currentFieldRect();
    if (!fieldRect) return;
    const labels = makeRoundLabels();
    const keepSet = new Set(keepIds);
    const survivors = state.blobs.filter(b => keepSet.has(b.id) && !b.removed);
    const colorsAvailable = shuffle(BLOB_COLORS.slice());

    survivors.forEach((blob, idx) => {
      const label = labels[idx];
      const color = colorsAvailable[idx];
      blob.label = label;
      blob.isCorrect = normalizeWord(label) === normalizeWord(currentCorrectLabel());
      blob.bg = color.bg;
      blob.darkText = color.darkText;
      blob.spawnIn = false;
      blob.alive = true;
      blob.tappedWrong = false;
    });

    const needed = 3 - survivors.length;
    const existing = survivors.slice();
    for (let i = 0; i < needed; i++){
      const label = labels[survivors.length + i];
      const color = colorsAvailable[survivors.length + i];
      const size = measureBlobSize(fieldRect, label);
      const pos = findSafePosition(fieldRect, existing, size.w, size.h);
      const vel = randomVelocity(fieldRect.width, fieldRect.height);
      const blob = {
        id: blobIdCounter++,
        label,
        isCorrect: normalizeWord(label) === normalizeWord(currentCorrectLabel()),
        bg: color.bg,
        darkText: color.darkText,
        x: pos.x,
        y: pos.y,
        w: size.w,
        h: size.h,
        font: size.font,
        vx: vel.vx,
        vy: vel.vy,
        squashX: 1,
        squashY: 1,
        wobbleT: Math.random() * Math.PI * 2,
        textStretch: 1,
        letterSpacingEm: 0,
        alive: true,
        removed: false,
        spawnIn: true,
        tappedWrong: false,
      };
      existing.push(blob);
      survivors.push(blob);
    }
    state.blobs = survivors;
    state.activeIds = survivors.map(b => b.id);
  }

  function removeBuiltWords(count){
    const remove = Math.min(count, state.progressIndex);
    if (!remove) return;
    const removing = new Set();
    for (let i = 0; i < remove; i++) removing.add(state.progressIndex - 1 - i);
    state.buildRemoving = removing;
    render();
    setTimeout(() => {
      state.progressIndex = Math.max(0, state.progressIndex - remove);
      state.buildRemoving = new Set();
      render();
    }, 340);
  }

  function totalElapsedMs(){ return Math.max(1, (state.endTime || performance.now()) - state.startTime); }
  function formatMode(mode){ return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Mode"; }
  function getModeMedal(mode){ return mode === "easy" ? "🥉" : mode === "medium" ? "🥈" : mode === "hard" ? "🥇" : "🏅"; }

  function renderBuildText(){
    return state.segments.map((segment, index) => {
      const built = index < state.progressIndex;
      const meta = state.metaIndices.has(index);
      const removing = state.buildRemoving.has(index);
      return `<span class="vs-build-word ${built ? "is-built" : ""} ${meta ? "is-meta" : ""} ${removing ? "is-removing" : ""}">${escapeHtml(segment)}</span>`;
    }).join(" ");
  }

  function renderModeNav(){
    return `
      <div class="vs-nav-wrap">
        <div class="vs-nav">
          <button class="vs-nav-btn vs-no-zoom" id="vsHomeBtn" aria-label="Home">⌂</button>
          <div class="vs-nav-center">
            <button class="vs-help-btn vs-no-zoom" id="vsHelpBtn" type="button">HELP</button>
          </div>
          <button class="vs-nav-btn vs-no-zoom" id="vsMuteBtn" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
        </div>
      </div>`;
  }

  function renderHelpOverlay(){
    return `
      <div class="vs-help-overlay ${state.helpOpen ? "show" : ""}" id="vsHelpOverlay">
        <div class="vs-help-dialog">
          <div class="vs-help-title">How to Play Verse Splat</div>
          <div class="vs-help-body">
            Tap the next correct goo blob as it bounces around the field.<br><br>
            Easy: fun decoys.<br>
            Medium: decoys come from the verse.<br>
            Hard: wrong taps remove two built words.<br><br>
            After the verse, enjoy a bonus splat round.
          </div>
          <div class="vs-help-actions">
            <button class="vs-help-close vs-no-zoom" id="vsHelpCloseBtn" type="button">${state.helpBackMode ? "Back" : "OK"}</button>
          </div>
        </div>
      </div>`;
  }

  function renderGameMenuOverlay(){
    return `
      <div class="vs-help-overlay ${state.menuOpen ? "show" : ""}" id="vsGameMenuOverlay">
        <div class="vs-help-dialog">
          <div class="vs-help-title">Game Menu</div>
          <div class="vs-game-menu-actions">
            <button class="vs-game-menu-btn vs-no-zoom" id="vsMenuHowToBtn" type="button">How to Play</button>
            <button class="vs-game-menu-btn vs-no-zoom" id="vsMenuMuteBtn" type="button">${muted ? "Unmute" : "Mute"}</button>
            <button class="vs-game-menu-btn vs-no-zoom" id="vsMenuExitBtn" type="button">Exit Game</button>
            <button class="vs-game-menu-btn vs-no-zoom" id="vsMenuCloseBtn" type="button">Close</button>
          </div>
        </div>
      </div>`;
  }

  function renderParticles(){
    return state.particles.map(p => {
      if (p.kind === "poof") {
        return `<div class="vs-poof" style="left:${p.x}%;top:${p.y}%;--dx:${p.dx}%;--dy:${p.dy}%"></div>`;
      }
      if (p.kind === "splat") {
        return `
          <div class="vs-splat" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%">
            <div class="vs-splat-main" style="--splat-color:${p.color}"></div>
            <div class="vs-splat-lobe" style="left:-8%;top:8%;--splat-color:${p.color}"></div>
            <div class="vs-splat-lobe" style="right:-6%;top:16%;--splat-color:${p.color};width:38%;height:38%"></div>
            <div class="vs-splat-lobe" style="left:14%;bottom:-6%;--splat-color:${p.color};width:34%;height:34%"></div>
            <div class="vs-splat-drip" style="left:22%;--splat-color:${p.color}"></div>
            <div class="vs-splat-drip" style="left:54%;height:42%;--splat-color:${p.color}"></div>
            <div class="vs-splat-drip" style="left:76%;height:28%;--splat-color:${p.color}"></div>
          </div>`;
      }
      return "";
    }).join("");
  }

  function renderBlobs(blobs){
    return blobs.filter(b => !b.removed).map(blob => {
      const tx = blob.squashX || 1;
      const ty = blob.squashY || 1;
      const wobble = Math.sin(blob.wobbleT || 0) * 2.4;
      const textScale = blob.textStretch || 1;
      const ls = blob.letterSpacingEm || 0;
      const classes = ["vs-blob", "vs-no-zoom"];
      if (blob.spawnIn) classes.push("spawn-in");
      return `
        <button class="${classes.join(" ")}" data-blob-id="${blob.id}" type="button"
          style="left:${(blob.x / (state.fieldRect?.width || 1)) * 100}%;top:${(blob.y / (state.fieldRect?.height || 1)) * 100}%;width:${(blob.w / (state.fieldRect?.width || 1)) * 100}%;height:${(blob.h / (state.fieldRect?.height || 1)) * 100}%;transform:translate3d(0,0,0) rotate(${wobble}deg) scale(${tx},${ty});">
          <span class="vs-blob-shell">
            <span class="vs-blob-goo" style="--blob-bg:${blob.bg}"></span>
            <span class="vs-blob-label ${blob.darkText ? "is-dark" : ""}" style="font-size:${blob.font}px;transform:scale(${textScale},1);letter-spacing:${ls}em">${escapeHtml(blob.label)}</span>
          </span>
        </button>`;
    }).join("");
  }

  function renderIntro(){
    app.innerHTML = `
      <div class="vs-mode-shell">
        <div class="vs-mode-stage">
          <div class="vs-mode-card">
            <div class="vs-mode-emoji">🟣🟠🟢</div>
            <div class="vs-mode-title">${GAME_TITLE}</div>
            <div class="vs-mode-subtitle">Tap the correct wiggly word blob as it bounces around the screen.</div>
            <div class="vs-mode-actions">
              <button class="vs-btn vs-no-zoom" id="vsStartBtn">Start</button>
            </div>
          </div>
        </div>
        ${renderModeNav()}
        ${renderHelpOverlay()}
      </div>`;
    wireModeNav();
    $("#vsStartBtn").onclick = () => setScreen("mode");
  }

  function renderMode(){
    app.innerHTML = `
      <div class="vs-mode-shell">
        <div class="vs-mode-stage">
          <div class="vs-mode-card">
            <div class="vs-mode-emoji">💥</div>
            <div class="vs-mode-title">Choose Difficulty</div>
            <div class="vs-mode-subtitle">Build the verse by splatting the next correct word blob.</div>
            <div class="vs-mode-actions">
              <button class="vs-btn vs-no-zoom" data-mode="easy">Easy</button>
              <button class="vs-btn vs-no-zoom" data-mode="medium">Medium</button>
              <button class="vs-btn vs-no-zoom" data-mode="hard">Hard</button>
            </div>
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
        setScreen("game");
        requestAnimationFrame(() => {
          state.fieldRect = currentFieldRect();
          respawnRound([]);
          render();
          startMainMotion();
        });
      };
    });
  }

  function renderGame(){
    state.fieldRect = currentFieldRect() || state.fieldRect;
    app.innerHTML = `
      <div class="vs-root">
        <div class="vs-stage">
          <div class="vs-build-wrap">
            <div class="vs-build ${state.buildRemoving.size ? "vs-shake" : ""}" id="vsBuild">
              <div class="vs-build-text ${state.buildSizeClass}" id="vsBuildText">${renderBuildText()}</div>
            </div>
          </div>
          <div class="vs-board-wrap">
            <div class="vs-board" id="vsBoard">
              <div class="vs-board-flash ${state.boardFlash ? "is-flashing" : ""}" id="vsBoardFlash"></div>
              <div class="vs-board-content">
                <div class="vs-top-row"><button class="vs-pill vs-menu-pill vs-no-zoom" id="vsMenuPill" type="button">☰</button></div>
                <div class="vs-field" id="vsField">
                  ${renderBlobs(state.blobs)}
                  <div class="vs-particles" id="vsParticles">${renderParticles()}</div>
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

  function renderBonus(){
    app.innerHTML = `
      <div class="vs-bonus-shell">
        <div class="vs-bonus-topbar"><button class="vs-pill vs-menu-pill vs-no-zoom" id="vsMenuPill" type="button">☰</button></div>
        <div class="vs-bonus-stage" id="vsBonusStage">
          <div class="vs-bonus-text ${state.bonusIntroVisible ? "is-visible" : ""}" id="vsBonusText">SPLAT TIME! Splat as many blobs as you can!</div>
          ${renderBlobs(state.bonusBlobs)}
          <div class="vs-particles" id="vsParticles">${renderParticles()}</div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireBonusScreen();
  }

  function renderEnd(){
    const timeSecs = (totalElapsedMs() / 1000).toFixed(1);
    app.innerHTML = `
      <div class="vs-mode-shell">
        <div class="vs-mode-stage">
          <div class="vs-end-card">
            <div class="vs-end-title">${escapeHtml(state.medalMessage || "Great job!")}</div>
            <div class="vs-end-sub">${escapeHtml(state.medalSubmessage || "You finished Verse Splat!")}</div>
            <div class="vs-end-stats">Mode: ${escapeHtml(formatMode(state.mode))} · Time: ${timeSecs}s</div>
            <div class="vs-mode-card" style="width:min(100%,28rem)">
              <div class="vs-mode-actions">
                <button class="vs-btn vs-no-zoom" id="vsPlayAgainBtn">Play Again</button>
                <button class="vs-btn vs-no-zoom" id="vsExitBtn">Exit Game</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    $("#vsPlayAgainBtn").onclick = () => {
      stopLoops();
      initVerseData();
      state.startTime = performance.now();
      setScreen("game");
      requestAnimationFrame(() => {
        state.fieldRect = currentFieldRect();
        respawnRound([]);
        render();
        startMainMotion();
      });
    };
    $("#vsExitBtn").onclick = () => window.VerseGameBridge.exitGame();
  }

  function wireModeNav(){
    const homeBtn = $("#vsHomeBtn"), helpBtn = $("#vsHelpBtn"), muteBtn = $("#vsMuteBtn");
    const helpOverlay = $("#vsHelpOverlay"), helpCloseBtn = $("#vsHelpCloseBtn");
    if (homeBtn) homeBtn.onclick = () => window.VerseGameBridge.exitGame();
    if (helpBtn) helpBtn.onclick = () => { state.helpOpen = true; state.helpBackMode = false; render(); };
    if (helpCloseBtn) helpCloseBtn.onclick = () => { state.helpOpen = false; state.helpBackMode = false; render(); };
    if (helpOverlay) helpOverlay.onclick = (e) => { if (e.target === helpOverlay){ state.helpOpen = false; state.helpBackMode = false; render(); } };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
  }

  function wireGameMenuCommon(){
    const menuOverlay = $("#vsGameMenuOverlay"), helpOverlay = $("#vsHelpOverlay"), closeHelp = $("#vsHelpCloseBtn");
    const howTo = $("#vsMenuHowToBtn"), muteBtn = $("#vsMenuMuteBtn"), exitBtn = $("#vsMenuExitBtn"), closeBtn = $("#vsMenuCloseBtn");
    if (howTo) howTo.onclick = () => { state.menuOpen = false; state.helpOpen = true; state.helpBackMode = true; render(); };
    if (muteBtn) muteBtn.onclick = () => { muted = !muted; render(); };
    if (exitBtn) exitBtn.onclick = () => { stopLoops(); window.VerseGameBridge.exitGame(); };
    if (closeBtn) closeBtn.onclick = () => { state.menuOpen = false; render(); };
    if (menuOverlay) menuOverlay.onclick = (e) => { if (e.target === menuOverlay){ state.menuOpen = false; render(); } };
    if (closeHelp) closeHelp.onclick = () => {
      if (state.helpBackMode){ state.helpOpen = false; state.menuOpen = true; state.helpBackMode = false; }
      else state.helpOpen = false;
      render();
    };
    if (helpOverlay) helpOverlay.onclick = (e) => {
      if (e.target === helpOverlay){
        if (state.helpBackMode){ state.helpOpen = false; state.menuOpen = true; state.helpBackMode = false; }
        else state.helpOpen = false;
        render();
      }
    };
  }

  function wireGameScreen(){
    const menuPill = $("#vsMenuPill");
    if (menuPill) menuPill.onclick = (e) => { e.stopPropagation(); if (state.busy) return; state.menuOpen = true; state.helpOpen = false; state.helpBackMode = false; render(); };
    document.querySelectorAll("[data-blob-id]").forEach(el => { el.onclick = () => handleBlobTap(Number(el.dataset.blobId)); });
    wireGameMenuCommon();
  }

  function wireBonusScreen(){
    const menuPill = $("#vsMenuPill");
    if (menuPill) menuPill.onclick = (e) => { e.stopPropagation(); state.menuOpen = true; state.helpOpen = false; state.helpBackMode = false; render(); };
    document.querySelectorAll("[data-blob-id]").forEach(el => { el.onclick = () => handleBonusBlobTap(Number(el.dataset.blobId)); });
    wireGameMenuCommon();
  }

  function flashWrongBoard(){
    state.boardFlash = true;
    render();
    setTimeout(() => {
      state.boardFlash = false;
      if (state.screen === "game") render();
    }, 340);
  }

  function addPoofAt(xPct, yPct, count = 8){
    for (let i = 0; i < count; i++){
      state.particles.push({ id: particleIdCounter++, kind: "poof", x: xPct + (Math.random() * 2 - 1) * 1.4, y: yPct + (Math.random() * 2 - 1) * 1.2, dx: (Math.random() * 8 - 4).toFixed(2), dy: (-3 - Math.random() * 4).toFixed(2) });
    }
    render();
    setTimeout(() => {
      state.particles = state.particles.filter(p => p.kind !== "poof");
      if (state.screen === "game" || state.screen === "bonus") render();
    }, 440);
  }

  function addSplatAt(xPct, yPct, color, fieldRect, big = true){
    const minDim = Math.min(fieldRect.width, fieldRect.height);
    const wPct = ((big ? minDim * 0.22 : minDim * 0.15) / fieldRect.width) * 100;
    const hPct = ((big ? minDim * 0.18 : minDim * 0.12) / fieldRect.height) * 100;
    const id = particleIdCounter++;
    state.particles.push({ id, kind: "splat", x: xPct, y: yPct, color, w: wPct, h: hPct });
    render();
    setTimeout(() => {
      state.particles = state.particles.filter(p => p.id !== id);
      if (state.screen === "game" || state.screen === "bonus") render();
    }, 1200);
  }

  function startMainMotion(){
    stopLoops();
    state.frameTs = performance.now();
    function tick(ts){
      if (state.screen !== "game") return;
      if (state.menuOpen || state.helpOpen){ state.frameTs = ts; state.rafId = requestAnimationFrame(tick); return; }
      const field = $("#vsField");
      if (!field){ state.rafId = requestAnimationFrame(tick); return; }
      const rect = field.getBoundingClientRect();
      state.fieldRect = { width: Math.max(240, rect.width), height: Math.max(200, rect.height) };
      const dt = Math.min(0.034, (ts - state.frameTs) / 1000 || 0.016);
      state.frameTs = ts;

      for (const blob of state.blobs){
        if (blob.removed) continue;
        blob.x += blob.vx * dt;
        blob.y += blob.vy * dt;
        blob.wobbleT += dt * 7.8;
        blob.squashX += (1 - blob.squashX) * 0.17;
        blob.squashY += (1 - blob.squashY) * 0.17;
        blob.textStretch += (1 - blob.textStretch) * 0.14;
        blob.letterSpacingEm += (0 - blob.letterSpacingEm) * 0.16;

        const maxX = Math.max(0, state.fieldRect.width - blob.w);
        const maxY = Math.max(0, state.fieldRect.height - blob.h);
        let hitX = false;
        let hitY = false;

        if (blob.x <= 0){ blob.x = 0; blob.vx *= -1; hitX = true; }
        else if (blob.x >= maxX){ blob.x = maxX; blob.vx *= -1; hitX = true; }
        if (blob.y <= 0){ blob.y = 0; blob.vy *= -1; hitY = true; }
        else if (blob.y >= maxY){ blob.y = maxY; blob.vy *= -1; hitY = true; }

        if (hitX){ blob.squashX = 0.56; blob.squashY = 1.42; blob.textStretch = 0.9; blob.letterSpacingEm = -0.03; }
        if (hitY){ blob.squashX = 1.3; blob.squashY = 0.62; blob.textStretch = 1.08; blob.letterSpacingEm = 0.018; }
      }
      render();
      state.rafId = requestAnimationFrame(tick);
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function startBonusMotion(){
    stopLoops();
    state.frameTs = performance.now();
    function tick(ts){
      if (state.screen !== "bonus") return;
      if (state.menuOpen || state.helpOpen){ state.frameTs = ts; state.rafId = requestAnimationFrame(tick); return; }
      const stage = $("#vsBonusStage");
      if (!stage){ state.rafId = requestAnimationFrame(tick); return; }
      const rect = stage.getBoundingClientRect();
      state.fieldRect = { width: Math.max(240, rect.width), height: Math.max(220, rect.height) };
      const dt = Math.min(0.034, (ts - state.frameTs) / 1000 || 0.016);
      state.frameTs = ts;

      for (const blob of state.bonusBlobs){
        if (blob.removed) continue;
        blob.wobbleT += dt * (4 + blob.wiggleRate);
        blob.squashX += (1 - blob.squashX) * 0.13;
        blob.squashY += (1 - blob.squashY) * 0.13;
      }

      if (!state.bonusDone && performance.now() - state.bonusStartedAt >= 30000){ endBonusRound(); return; }

      render();
      state.rafId = requestAnimationFrame(tick);
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function stopLoops(){ if (state.rafId){ cancelAnimationFrame(state.rafId); state.rafId = 0; } }

  function applyWrongPenalty(){ if (state.mode === "hard") removeBuiltWords(2); }

  async function handleBlobTap(blobId){
    if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;
    const blob = state.blobs.find(b => b.id === blobId && !b.removed);
    if (!blob) return;
    state.busy = true;
    const fieldRect = state.fieldRect || currentFieldRect();
    const xPct = ((blob.x + blob.w / 2) / fieldRect.width) * 100;
    const yPct = ((blob.y + blob.h / 2) / fieldRect.height) * 100;

    if (blob.isCorrect){
      state.streak += 1;
      state.wrongTapCount = 0;
      blob.removed = true;
      addSplatAt(xPct, yPct, blob.bg, fieldRect, true);
      state.progressIndex += 1;
      render();
      await sleep(210);

      if (state.progressIndex >= state.segments.length){ await beginBonusRound(); return; }

      const keepIds = state.blobs.filter(b => !b.removed).map(b => b.id);
      respawnRound(keepIds);
      state.busy = false;
      render();
      return;
    }

    state.streak = 0;
    state.wrongTapCount += 1;
    blob.removed = true;
    addPoofAt(xPct, yPct, 7);
    flashWrongBoard();
    const build = $("#vsBuild");
    if (build){ build.classList.remove("vs-shake"); void build.offsetWidth; build.classList.add("vs-shake"); }
    applyWrongPenalty();
    render();
    await sleep(180);

    const survivors = state.blobs.filter(b => !b.removed);
    if (state.wrongTapCount >= 2){
      for (const survivor of survivors){
        const sx = ((survivor.x + survivor.w / 2) / fieldRect.width) * 100;
        const sy = ((survivor.y + survivor.h / 2) / fieldRect.height) * 100;
        survivor.removed = true;
        addPoofAt(sx, sy, 6);
      }
      render();
      await sleep(180);
      state.wrongTapCount = 0;
      respawnRound([]);
    }
    state.busy = false;
    render();
  }

  function buildBonusBlobs(){
    const stageRect = currentFieldRect() || { width: window.innerWidth, height: window.innerHeight };
    const count = clamp(Math.round((stageRect.width * stageRect.height) / 95000), 8, 16);
    const blobs = [];
    for (let i = 0; i < count; i++){
      const sizeBase = Math.min(stageRect.width, stageRect.height);
      const w = clamp(sizeBase * (0.10 + Math.random() * 0.06), stageRect.width * 0.10, stageRect.width * 0.18);
      const h = w * (0.76 + Math.random() * 0.22);
      const x = Math.random() * Math.max(1, stageRect.width - w);
      const y = Math.random() * Math.max(1, stageRect.height - h);
      blobs.push({ id: blobIdCounter++, label: "", bg: BONUS_COLORS[i % BONUS_COLORS.length], darkText: false, x, y, w, h, font: 0, squashX: 1, squashY: 1, wobbleT: Math.random() * Math.PI * 2, wiggleRate: Math.random() * 1.4, removed: false });
    }
    state.bonusBlobs = blobs;
  }

  async function beginBonusRound(){
    state.endTime = performance.now();
    setScreen("bonus");
    state.busy = true;
    state.particles = [];
    state.bonusIntroVisible = true;
    state.bonusDone = false;
    state.bonusSplatted = 0;
    requestAnimationFrame(() => { buildBonusBlobs(); render(); startBonusMotion(); });
    await sleep(900);
    state.bonusStartedAt = performance.now();
    render();
    await sleep(1200);
    state.bonusIntroVisible = false;
    state.busy = false;
    render();
  }

  async function handleBonusBlobTap(blobId){
    if (state.busy || state.menuOpen || state.helpOpen || state.bonusDone) return;
    const blob = state.bonusBlobs.find(b => b.id === blobId && !b.removed);
    if (!blob) return;
    const fieldRect = state.fieldRect || currentFieldRect();
    const xPct = ((blob.x + blob.w / 2) / fieldRect.width) * 100;
    const yPct = ((blob.y + blob.h / 2) / fieldRect.height) * 100;
    blob.removed = true;
    state.bonusSplatted += 1;
    addSplatAt(xPct, yPct, blob.bg, fieldRect, false);
    render();
    if (state.bonusBlobs.every(b => b.removed)){ await sleep(260); endBonusRound(); }
  }

  async function finalizeCompletion(){
    state.completed = true;
    state.endTime = performance.now();
    let alreadyEarned = false;
    try {
      if (window.VerseGameBridge && typeof window.VerseGameBridge.wasAlreadyCompleted === "function") {
        alreadyEarned = !!(await window.VerseGameBridge.wasAlreadyCompleted(ctx.verseId, GAME_ID, state.mode));
      }
    } catch (err) { alreadyEarned = false; }

    await window.VerseGameBridge.markCompleted({ verseId: ctx.verseId, gameId: GAME_ID, mode: state.mode });

    if (alreadyEarned){
      state.medalMessage = "Splat-tastic!";
      state.medalSubmessage = "You finished Verse Splat again. Try to beat your time!";
    } else {
      state.medalMessage = `Splat-tastic! You earned a ${getModeMedal(state.mode)}`;
      state.medalSubmessage = "You finished Verse Splat!";
    }
    setScreen("end");
  }

  function endBonusRound(){
    if (state.bonusDone) return;
    state.bonusDone = true;
    state.bonusEndedAt = performance.now();
    stopLoops();
    finalizeCompletion();
  }

  function setScreen(screen){ state.screen = screen; render(); }
  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "bonus") return renderBonus();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
