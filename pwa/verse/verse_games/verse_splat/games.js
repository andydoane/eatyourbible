
(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell", "vsp-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "verse_splat";
  const GAME_ID = "verse_splat";
  const GAME_TITLE = "Verse Splat";
  const BONUS_TIME_LIMIT_MS = 30000;
  const CORRECT_TAP_LOCK_MS = 180;
  let muted = false;

  const $ = (s, root=document) => root.querySelector(s);
  const escapeHtml = (str) => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => min + Math.random() * (max - min);

  function hexToRgb(hex){
    const clean = String(hex || "").replace("#", "").trim();
    if (clean.length !== 6) return { r:255, g:255, b:255 };
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b){
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function adjustHexColor(hex, amount){
    const { r, g, b } = hexToRgb(hex);
    if (amount >= 0){
      return rgbToHex(
        r + (255 - r) * amount,
        g + (255 - g) * amount,
        b + (255 - b) * amount
      );
    }
    const factor = 1 + amount;
    return rgbToHex(r * factor, g * factor, b * factor);
  }

  const BLOB_COLORS = [
    { fill:"#ff5a51", text:"#fff" },
    { fill:"#ffa351", text:"#fff" },
    { fill:"#ffc751", text:"#333" },
    { fill:"#a7cb6f", text:"#fff" },
    { fill:"#40b9c5", text:"#fff" },
    { fill:"#7f66c6", text:"#fff" }
  ];

  const SPLAT_SVG = `<svg
   width="100"
   height="100"
   viewBox="0 0 26.458333 26.458333"
   version="1.1"
   id="svg1"
   xml:space="preserve"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg"><sodipodi:namedview
     id="namedview1"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     borderlayer="false" /><defs
     id="defs1" /><g
     id="layer1"><path
       style="fill:currentColor;stroke-width:0.403725"
       d="m 16.398026,23.907619 c -0.87602,-0.44524 -1.1569,-1.01346 -1.3654,-2.76221 -0.10453,-0.87674 -0.22365,-1.38053 -0.42254,-1.78704 -0.81496,-1.66572 -2.71338,-1.8616 -3.98673,-0.41133 -0.42654,0.4858 -0.6618002,0.95858 -1.0247902,2.05944 -0.51819,1.57153 -1.31318,2.42504 -2.37599,2.55092 -1.04936,0.12428 -1.84866,-0.61853 -1.84866,-1.71801 0,-0.95529 0.54104,-1.73365 1.89213,-2.72213 1.38506,-1.01333 1.99395,-2.05567 1.7437,-2.98501 -0.19614,-0.72842 -0.78194,-1.09774 -1.74779,-1.10192 -0.52682,-0.002 -0.87999,0.0852 -1.75424,0.43435 -1.7736,0.70839 -2.72393,0.69385 -3.5521,-0.0544 -1.31141004,-1.18478 -0.46907,-3.08582 1.46901,-3.31536 0.40294,-0.0477 0.84603,0.018 1.82496,0.27063 2.05645,0.53072 3.04526,0.40441 3.71517,-0.47458 0.25909,-0.33996 0.30747,-0.50246 0.30438,-1.02244 -0.003,-0.50988 -0.0597,-0.6985 -0.32337,-1.0761797 -0.17583,-0.25188 -0.54802,-0.60216 -0.82708,-0.77841 -1.53759,-0.97112 -1.85957,-1.21441 -2.13998,-1.61693 -1.01553,-1.45778 0.22508,-3.28292 1.92109,-2.82623 0.69593,0.1874 1.35361,0.85293 1.86232,1.88456 0.2449602,0.49676 0.6325302,1.1158 0.8612502,1.37565 1.0582,1.20218 2.55655,1.00823 3.29488,-0.42649 0.23432,-0.45533 0.2745,-0.7011 0.32993,-2.01817 0.0521,-1.23651 0.10291,-1.57701 0.28979,-1.94024 0.88848,-1.72692 3.1241,-1.3062 3.15276,0.59331 0.008,0.50867 -0.16715,0.93876 -0.99306,2.44312 -0.49707,0.90537 -0.56548,1.55728 -0.22245,2.11984 0.58953,0.96681 2.09007,0.53256 3.15024,-0.91168 0.99862,-1.3604 2.17946,-2.06315 3.06571,-1.82451 0.85084,0.22911 1.36522,0.98547 1.21924,1.79279 -0.15944,0.88168 -0.96395,1.61994 -2.23028,2.0466 -1.95116,0.6573897 -2.85333,1.7995197 -2.1886,2.7706997 0.46358,0.6773 0.89556,0.8099 2.65296,0.81441 1.44172,0.004 1.58185,0.0222 2.02543,0.26705 0.66444,0.3668 0.9655,0.84853 0.9655,1.5449 0,0.70479 -0.30531,1.19024 -0.96223,1.52996 -0.74777,0.38671 -1.50284,0.28749 -2.95785,-0.38865 -0.63987,-0.29735 -1.40281,-0.5724 -1.69542,-0.61121 -1.01399,-0.13451 -1.96086,0.31405 -2.36921,1.12238 -0.48435,0.95875 -0.24435,2.01633 0.72604,3.19938 0.89217,1.0877 1.06317,1.45523 1.06317,2.28495 0,0.74445 -0.21412,1.19163 -0.76648,1.60073 -0.43319,0.32084 -1.21814,0.35065 -1.77541,0.0674 z"
       id="path7" /></g></svg>`;

  const FUN_DECOYS = [
    "taco","banana","penguin","cupcake","dinosaur","pickle","marshmallow","noodle","waffle","rocket",
    "jellybean","pancake","popcorn","unicorn","bubble","muffin","otter","kangaroo","scooter","rainbow",
    "pretzel","monkey","donut","cookie","balloon","zebra","narwhal","kitten","puppy","burrito",
    "pirate","robot","slipper","backpack","bongo","volcano","watermelon","cheeseburger","toothbrush","snowman"
  ];

  const BIBLE_BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel",
    "1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs",
    "Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
    "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark",
    "Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
    "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter",
    "2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const MODE_CONFIG = {
    easy: { speedMultiplier: 1, rollbackCount: 0, decoyMode: "fun" },
    medium: { speedMultiplier: 1, rollbackCount: 0, decoyMode: "verse" },
    hard: { speedMultiplier: 1.05, rollbackCount: 2, decoyMode: "verse" }
  };

  function medalEmojiForMode(mode){
    if (mode === "easy") return "🥉";
    if (mode === "medium") return "🥈";
    return "🥇";
  }

  const state = {
    screen: "intro",
    mode: null,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    busy: false,
    completed: false,
    startedAt: 0,

    words: [],
    bookTokens: [],
    referenceToken: "",
    segments: [],
    metaIndices: new Set(),
    progressIndex: 0,
    buildSizeClass: "is-normal",
    buildRemoving: new Set(),
    phase: "words",

    blobs: [],
    nextBlobId: 1,
    wrongCountThisField: 0,
    rafId: 0,
    lastTs: 0,
    fieldRect: null,
    inputLockedUntil: 0,

    shakeKey: 0,
    flashKey: 0,

    bonusIntroVisible: false,
    bonusBlobs: [],
    nextBonusBlobId: 1,
    bonusRafId: 0,
    bonusStartedAt: 0,
    bonusRemainingMs: BONUS_TIME_LIMIT_MS,
    bonusScore: 0,

    medalAlreadyEarned: false,
    medalMessage: "",
    medalSubmessage: ""
  };

  function shuffle(arr){
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeWord(word){
    return String(word || "")
      .toLowerCase()
      .replace(/[“”"'‘’]/g, "")
      .replace(/^[^\w\d]+|[^\w\d:;-]+$/g, "");
  }

  function tokenizeVerse(text){
    return String(text || "").trim().split(/\s+/).filter(Boolean);
  }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of", "the"]);
    return String(slug || "").split("_").filter(Boolean).map((part, index) => {
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
    if (lastSpace > 0) return { book:raw.slice(0, lastSpace).trim(), reference:raw.slice(lastSpace + 1).trim() };
    return { book:raw, reference:"" };
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

  function initVerseData(){
    state.words = tokenizeVerse(ctx.verseText);
    const parts = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    state.bookTokens = String(parts.book || "").trim().split(/\s+/).filter(Boolean);
    state.referenceToken = String(parts.reference || "").trim();
    state.segments = [...state.words, ...state.bookTokens, ...(state.referenceToken ? [state.referenceToken] : [])];
    state.metaIndices = new Set();
    for (let i = state.words.length; i < state.words.length + state.bookTokens.length; i++) state.metaIndices.add(i);
    if (state.referenceToken) state.metaIndices.add(state.segments.length - 1);
    state.buildSizeClass = getBuildSizeClass(ctx.verseText, parts.book, parts.reference);
  }

  function setScreen(screen){
    stopLoops();
    state.screen = screen;
    render();
    if (screen === "game") afterGameScreenRender();
    if (screen === "bonus") afterBonusScreenRender();
  }

  function resetForMode(mode){
    state.mode = mode;
    state.menuOpen = false;
    state.helpOpen = false;
    state.helpBackMode = false;
    state.busy = false;
    state.completed = false;
    state.progressIndex = 0;
    state.buildRemoving = new Set();
    state.phase = "words";
    state.blobs = [];
    state.nextBlobId = 1;
    state.wrongCountThisField = 0;
    state.lastTs = 0;
    state.inputLockedUntil = 0;
    state.shakeKey = 0;
    state.flashKey = 0;
    state.bonusIntroVisible = false;
    state.bonusBlobs = [];
    state.nextBonusBlobId = 1;
    state.bonusStartedAt = 0;
    state.bonusRemainingMs = BONUS_TIME_LIMIT_MS;
    state.bonusScore = 0;
    state.medalAlreadyEarned = false;
    state.medalMessage = "";
    state.medalSubmessage = "";
    state.startedAt = Date.now();
    updatePhase();
  }

  function updatePhase(){
    if (state.progressIndex < state.words.length) state.phase = "words";
    else if (state.progressIndex < state.words.length + state.bookTokens.length) state.phase = "book";
    else if (state.progressIndex < state.segments.length) state.phase = "reference";
    else state.phase = "complete";
  }

  function releaseSpawningBlobsSoon(delay = CORRECT_TAP_LOCK_MS){
    window.setTimeout(() => {
      for (const blob of state.blobs){
        if (blob.state === "spawning"){
          blob.state = "live";
        }
      }
    }, delay);
  }

  function currentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }


  function renderBuildText(){
    return state.segments.map((segment, index) => {
      const cls = ["vsp-build-word"];
      if (index < state.progressIndex) cls.push("is-built");
      if (state.metaIndices.has(index)) cls.push("is-meta");
      if (state.buildRemoving.has(index)) cls.push("is-removing");
      return `<span class="${cls.join(" ")}">${escapeHtml(segment)}</span>`;
    }).join("");
  }


  function extractClientPoint(event){
    if (event.touches && event.touches[0]) return { x:event.touches[0].clientX, y:event.touches[0].clientY };
    if (event.changedTouches && event.changedTouches[0]) return { x:event.changedTouches[0].clientX, y:event.changedTouches[0].clientY };
    return { x:event.clientX, y:event.clientY };
  }

  function clientPointToBoardPoint(clientX, clientY){
    const boardMain = $("#vspBoardMain");
    if (!boardMain) return null;
    const rect = boardMain.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function hitTestBlobIdAtBoardPoint(boardX, boardY, bonus=false){
    const bounds = currentBounds();
    const list = bonus
      ? state.bonusBlobs.filter(blob => blob.alive)
      : state.blobs.filter(blob => blob.state === "live");
    const hits = [];

    for (let i = list.length - 1; i >= 0; i--){
      const blob = list[i];
      const width = bonus ? blob.size : blob.width;
      const height = bonus ? blob.size : blob.height;
      const left = blob.x * bounds.width;
      const top = blob.y * bounds.height;
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const nx = (boardX - centerX) / (width / 2);
      const ny = (boardY - centerY) / (height / 2);
      const ellipseScore = nx * nx + ny * ny;
      if (ellipseScore <= 1.08){
        hits.push({
          id: blob.id,
          isCorrect: bonus ? false : !!blob.isCorrect,
          score: ellipseScore,
          area: width * height,
          order: i
        });
      }
    }

    if (!hits.length) return null;
    if (!bonus){
      const correctHits = hits.filter(hit => hit.isCorrect);
      if (correctHits.length === 1) return correctHits[0].id;
    }

    hits.sort((a, b) => (a.score - b.score) || (a.area - b.area) || (a.order - b.order));
    return hits[0].id;
  }

  function bindBoardMainInteraction(){
    const boardMain = $("#vspBoardMain");
    if (!boardMain || boardMain.dataset.boundVerseSplatPress === "1") return;

    const onPress = (event) => {
      if (state.menuOpen || state.helpOpen || state.busy) return;
      if (performance.now() < state.inputLockedUntil) return;
      if (state.screen !== "game" && state.screen !== "bonus") return;

      const point = extractClientPoint(event);
      const boardPoint = clientPointToBoardPoint(point.x, point.y);
      if (!boardPoint) return;

      const blobId = hitTestBlobIdAtBoardPoint(boardPoint.x, boardPoint.y, state.screen === "bonus");
      if (!blobId) return;

      event.preventDefault();
      event.stopPropagation();

      if (state.screen === "game") handleBlobTap(blobId);
      else handleBonusBlobTap(blobId);
    };

    boardMain.addEventListener("pointerdown", onPress, { passive:false });
    boardMain.addEventListener("touchstart", onPress, { passive:false });
    boardMain.addEventListener("mousedown", onPress, { passive:false });
    boardMain.dataset.boundVerseSplatPress = "1";
  }



function nonGameHelpHtml(){
  return `Tap the next correct blob word to build the verse. After the verse, finish the book and then the reference. Wrong taps poof blobs away. In hard mode, wrong taps also remove two built words.`;
}

function renderNav(){
  return `
    <div class="vsp-nav-wrap">
      <div class="vsp-nav">
        <button class="vsp-nav-btn" data-action="exit-game" aria-label="Home">⌂</button>
        <div class="vsp-nav-center">
          <button class="vsp-help-btn" data-action="show-help-intro" type="button">HELP</button>
        </div>
        <button class="vsp-nav-btn" data-action="toggle-mute" aria-label="Mute">${muted ? "🔇" : "🔊"}</button>
      </div>
    </div>
  `;
}

function renderIntro(){
  return `
    <div class="vsp-mode-shell">
      <div class="vsp-mode-stage">
        <div class="vsp-mode-top">
          <div class="vsp-splash-emoji">🫟</div>
          <div class="vsp-title">Verse Splat</div>
          <div class="vsp-subtitle">Tap the next correct goo blob to build the verse, then the book and reference.</div>
          <div class="vsp-mode-card vsp-mode-card-single">
            <div class="vsp-mode-actions">
              <button class="vm-btn" data-action="go-mode">Start</button>
            </div>
          </div>
        </div>
      </div>
      ${renderNav()}
      ${state.helpOpen ? overlayMarkup() : ""}
    </div>
  `;
}

function renderModeScreen(){
  return `
    <div class="vsp-mode-shell">
      <div class="vsp-mode-stage">
        <div class="vsp-mode-top">
          <div class="vsp-title">Choose Your Difficulty</div>
          <div class="vsp-subtitle">Easy keeps things friendly. Medium uses verse-based decoys. Hard uses verse-based decoys and removes two built words on mistakes.</div>
          <div class="vsp-mode-card">
            <div class="vsp-mode-actions">
              <button class="vm-btn" data-mode="easy">Easy</button>
              <button class="vm-btn" data-mode="medium">Medium</button>
              <button class="vm-btn" data-mode="hard">Hard</button>
            </div>
          </div>
        </div>
      </div>
      ${renderNav()}
      ${state.helpOpen ? overlayMarkup() : ""}
    </div>
  `;
}


function overlayMarkup(){
  if (state.helpOpen){
    return `
      <div class="vsp-overlay">
        <div class="vsp-overlay-card">
          <div class="vsp-overlay-title">How to Play</div>
          <div class="vsp-overlay-copy">Tap the next correct blob word to build the verse. After the verse, finish the book and then the reference. Wrong taps poof blobs away. In hard mode, wrong taps also remove two built words.</div>
          <div class="vsp-overlay-actions">
            <button class="vm-btn vsp-menu-action" data-action="close-help">${state.helpBackMode ? 'Back' : 'OK'}</button>
          </div>
        </div>
      </div>
    `;
  }
  if (state.menuOpen){
    return `
      <div class="vsp-overlay">
        <div class="vsp-overlay-card vsp-overlay-card-menu">
          <div class="vsp-overlay-title vsp-overlay-title-menu">Game Menu</div>
          <div class="vsp-overlay-actions">
            <button class="vm-btn vsp-menu-action" data-action="open-help-from-menu">How to Play</button>
            <button class="vm-btn vsp-menu-action" data-action="toggle-mute">${muted ? 'Unmute' : 'Mute'}</button>
            <button class="vm-btn vsp-menu-action" data-action="exit-game">Exit Game</button>
            <button class="vm-btn vsp-menu-action" data-action="resume-game">Close</button>
          </div>
        </div>
      </div>
    `;
  }
  return "";
}

function gameplayShell({ bonus=false }){
    return `
      <div class="${bonus ? 'vsp-bonus-screen' : 'vsp-game-screen'}">
        ${bonus ? '' : `
          <div class="vsp-build-wrap">
            <div class="vsp-build ${state.shakeKey ? 'is-error' : ''}" id="vspBuild">
              <div class="vsp-build-text ${state.buildSizeClass}" id="vspBuildText">${renderBuildText()}</div>
            </div>
          </div>
        `}
        <div class="vsp-board-wrap">
          <div class="vsp-board" id="vspBoard">
            <div class="vsp-board-topbar">
              <button class="vsp-menu-pill" data-action="open-menu" aria-label="Open game menu">☰</button>
              ${bonus ? `<div class="vsp-bonus-timer-chip" id="vspBonusTimerChip">Time ${Math.ceil(state.bonusRemainingMs / 1000)}</div>` : ''}
            </div>
            <div class="vsp-board-main" id="vspBoardMain">
              <div class="vsp-flash-layer ${state.flashKey ? 'is-active' : ''}" id="vspFlashLayer"></div>
              <div class="vsp-back-effect-layer" id="vspBackEffectLayer"></div>
              <div class="vsp-blob-layer" id="vspBlobLayer"></div>
              <div class="vsp-effect-layer" id="vspEffectLayer"></div>
              ${bonus && state.bonusIntroVisible ? `<div class="vsp-bonus-intro"><div><div class="vsp-bonus-title">SPLAT TIME!</div><div class="vsp-bonus-copy">Splat as many blobs as you can!</div></div></div>` : ''}
            </div>
            ${overlayMarkup()}
          </div>
        </div>
      </div>
    `;
  }

  function renderBonusScreen(){
    return gameplayShell({ bonus:true });
  }

  function renderEndScreen(){
  return `
    <div class="vsp-mode-shell">
      <div class="vsp-mode-stage">
        <div class="vsp-mode-top">
          <div class="vsp-splash-emoji">🎉</div>
          <div class="vsp-title">Verse Splat Complete!</div>
          <div class="vsp-subtitle">${escapeHtml(state.medalMessage || `You completed ${state.mode}.`)}</div>
          <div class="vsp-mode-card">
            <div class="vsp-copy">${escapeHtml(state.medalSubmessage || 'Verse, book, and reference complete.')}</div>
            <div class="vsp-end-stat" style="margin-top:12px;">Bonus blobs splatted: <strong>${state.bonusScore}</strong></div>
            <div class="vsp-mode-actions" style="margin-top:16px;">
              <button class="vm-btn" data-action="play-again">Play Again</button>
              <button class="vm-btn" data-action="exit-game">Done</button>
            </div>
          </div>
        </div>
      </div>
      ${renderNav()}
      ${state.helpOpen ? overlayMarkup() : ""}
    </div>
  `;
}

  function render(){
    if (state.screen === "intro") app.innerHTML = renderIntro();
    else if (state.screen === "mode") app.innerHTML = renderModeScreen();
    else if (state.screen === "game") app.innerHTML = gameplayShell({ bonus:false });
    else if (state.screen === "bonus_intro") app.innerHTML = gameplayShell({ bonus:true });
    else if (state.screen === "bonus") app.innerHTML = renderBonusScreen();
    else if (state.screen === "end") app.innerHTML = renderEndScreen();
    bindScreenEvents();
  }

  function bindScreenEvents(){
    app.querySelectorAll("[data-action='go-mode']").forEach(btn => btn.onclick = () => setScreen("mode"));
    app.querySelectorAll("[data-action='back-intro']").forEach(btn => btn.onclick = () => setScreen("intro"));
    app.querySelectorAll("[data-mode]").forEach(btn => btn.onclick = () => startMode(btn.dataset.mode));
    app.querySelectorAll("[data-action='open-menu']").forEach(btn => btn.onclick = openMenu);
    app.querySelectorAll("[data-action='resume-game']").forEach(btn => btn.onclick = closeMenu);
    app.querySelectorAll("[data-action='show-help-intro']").forEach(btn => btn.onclick = () => { state.helpBackMode = false; state.helpOpen = true; render(); });
    app.querySelectorAll("[data-action='open-help-from-menu']").forEach(btn => btn.onclick = () => { state.helpBackMode = true; state.menuOpen = false; state.helpOpen = true; render(); });
    app.querySelectorAll("[data-action='close-help']").forEach(btn => btn.onclick = closeHelp);
    app.querySelectorAll("[data-action='toggle-mute']").forEach(btn => btn.onclick = () => { muted = !muted; render(); if (state.screen === "game") afterGameScreenRender(); if (state.screen === "bonus") afterBonusScreenRender(); });
    app.querySelectorAll("[data-action='play-again']").forEach(btn => btn.onclick = () => setScreen("mode"));
    app.querySelectorAll("[data-action='exit-game']").forEach(btn => btn.onclick = () => window.VerseGameBridge.exitGame());
  }

  function openMenu(){
    state.menuOpen = true;
    stopLoops();
    render();
  }

  function closeMenu(){
    state.menuOpen = false;
    render();
    if (state.screen === "game") afterGameScreenRender();
    if (state.screen === "bonus") afterBonusScreenRender();
  }

  function closeHelp(){
    const returnToMenu = state.helpBackMode && (state.screen === "game" || state.screen === "bonus");
    state.helpOpen = false;
    state.helpBackMode = false;
    if (returnToMenu) {
      state.menuOpen = true;
    }
    render();
    if (state.screen === "game" && !state.menuOpen) afterGameScreenRender();
    if (state.screen === "bonus" && !state.menuOpen) afterBonusScreenRender();
  }

  function startMode(mode){
    resetForMode(mode);
    setScreen("game");
  }

  function currentBounds(){
    const boardMain = $("#vspBoardMain");
    if (!boardMain) return { width: 300, height: 300, topInset: 0, leftInset: 0, rightInset: 0, bottomInset: 0 };
    const rect = boardMain.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      topInset: 0,
      leftInset: 0,
      rightInset: 0,
      bottomInset: 0,
      node: boardMain,
      blobLayer: $("#vspBlobLayer"),
      effectLayer: $("#vspEffectLayer")
    };
  }

  function labelSizeForBoard(label, bounds, stationary=false){
    const len = String(label || "").length;
    const baseH = stationary ? bounds.height * 0.14 : bounds.height * 0.13;
    const h = clamp(baseH, stationary ? 54 : 58, stationary ? 110 : 118);
    const charW = clamp(bounds.width * 0.024, 10, 18);
    const pad = stationary ? 36 : 42;
    const w = clamp(len * charW + pad, stationary ? 70 : 82, bounds.width * (stationary ? 0.24 : 0.28));
    return { width: w, height: h };
  }

  function uniqueLabels(list){
    const out = [];
    const seen = new Set();
    for (const item of list){
      const key = normalizeWord(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function easyDecoys(correct){
    const taken = new Set([normalizeWord(correct)]);
    return uniqueLabels(shuffle(FUN_DECOYS).filter(word => !taken.has(normalizeWord(word)))).slice(0, 12);
  }

  function verseWordDecoys(correct){
    const pool = state.segments.filter(token => normalizeWord(token) !== normalizeWord(correct));
    return uniqueLabels(shuffle(pool)).slice(0, 12);
  }

  function bookDecoys(correct){
    const bookWordPool = uniqueLabels(BIBLE_BOOKS.flatMap(book => book.split(/\s+/))).filter(token => normalizeWord(token) !== normalizeWord(correct));
    return shuffle(bookWordPool).slice(0, 12);
  }

  function referenceDecoys(correct){
    const match = String(correct || "").match(/^(\d+):(\d+(?:-\d+)?)$/);
    if (!match) return ["1:1", "3:16", "23:4", "8:28"];
    const ch = parseInt(match[1], 10);
    const verse = match[2];
    const simple = verse.split("-")[0];
    return uniqueLabels([
      `${ch+1}:${verse}`,
      `${Math.max(1, ch-1)}:${verse}`,
      `${ch}:${Math.max(1, parseInt(simple, 10)+1)}`,
      `${ch}:${Math.max(1, parseInt(simple, 10)-1)}`,
      `${Math.max(1, ch+2)}:${Math.max(1, parseInt(simple, 10)+2)}`,
      `${Math.max(1, ch-2)}:${Math.max(1, parseInt(simple, 10)+3)}`
    ]).filter(label => normalizeWord(label) !== normalizeWord(correct));
  }

  function decoysForCurrentPhase(correct){
    if (MODE_CONFIG[state.mode].decoyMode === "fun") return easyDecoys(correct);
    if (state.phase === "book") return uniqueLabels([...bookDecoys(correct), ...verseWordDecoys(correct)]).slice(0, 12);
    if (state.phase === "reference") return referenceDecoys(correct);
    return verseWordDecoys(correct);
  }

  function randomColorSet(count, takenColors=[]){
    const pool = shuffle(BLOB_COLORS.filter(c => !takenColors.includes(c.fill)));
    return pool.slice(0, count);
  }

  function buildFieldChoices(survivorCount){
    const correct = currentCorrectLabel();
    const decoys = decoysForCurrentPhase(correct).slice(0, Math.max(0, 3 - 1));
    const need = Math.max(0, 3 - survivorCount);
    return uniqueLabels([correct, ...decoys]).slice(0, Math.max(need, 1));
  }

  function blobMarkup(blob){
    return `
      <div class="vsp-blob ${blob.state === 'spawning' ? 'is-spawning' : ''}" data-blob-id="${blob.id}" role="button" tabindex="0" aria-label="${escapeHtml(blob.label)}" style="width:${blob.width}px;height:${blob.height}px;">
        <div class="vsp-blob-body" style="background:${blob.color};color:${blob.textColor};">
          <span class="vsp-blob-label">${escapeHtml(blob.label)}</span>
        </div>
      </div>
    `;
  }

  function renderBlobNodes(){
    const layer = $("#vspBlobLayer");
    if (!layer) return;
    layer.innerHTML = state.blobs.map(blobMarkup).join("");
    bindBoardMainInteraction();
    state.blobs.forEach(blob => updateBlobDom(blob));
  }

  function updateBlobDom(blob){
    const node = document.querySelector(`[data-blob-id="${blob.id}"]`);
    if (!node) return;
    const bounds = currentBounds();
    const wobbleX = Math.sin(blob.wobblePhase) * 0.044;
    const wobbleY = Math.cos(blob.wobblePhase * 0.9) * 0.044;
    const scaleX = 1 + wobbleX + blob.impactX;
    const scaleY = 1 + wobbleY + blob.impactY;
    node.style.transform = `translate(${blob.x * bounds.width}px, ${blob.y * bounds.height}px)`;
    const body = $(".vsp-blob-body", node);
    if (body) body.style.transform = `scale(${scaleX}, ${scaleY}) rotate(${Math.sin(blob.wobblePhase * 0.55) * 6}deg)`;
    const label = $(".vsp-blob-label", node);
    if (label) label.style.letterSpacing = `${Math.sin(blob.wobblePhase) * 0.012}em`;
  }

  function safeSpawnPoint(size, existing, insetOverrides=null){
    const bounds = currentBounds();
    const insetX = size.width / bounds.width;
    const insetY = size.height / bounds.height;

    const leftInset = insetOverrides?.leftInset ?? bounds.leftInset;
    const rightInset = insetOverrides?.rightInset ?? bounds.rightInset;
    const topInset = insetOverrides?.topInset ?? bounds.topInset;
    const bottomInset = insetOverrides?.bottomInset ?? bounds.bottomInset;

    const minX = leftInset / bounds.width;
    const maxX = Math.max(minX, 1 - insetX - (rightInset / bounds.width));
    const minY = topInset / bounds.height;
    const maxY = Math.max(minY, 1 - insetY - (bottomInset / bounds.height));

    for (let attempt = 0; attempt < 40; attempt++){
      const x = rand(minX, maxX);
      const y = rand(minY, maxY);
      const overlaps = existing.some(other => {
        const dx = ((x + insetX/2) - (other.x + (other.width / bounds.width) / 2)) * bounds.width;
        const dy = ((y + insetY/2) - (other.y + (other.height / bounds.height) / 2)) * bounds.height;
        const minDist = Math.max(size.width, other.width) * 0.68;
        return Math.hypot(dx, dy) < minDist;
      });
      if (!overlaps) return { x, y };
    }

    return { x: rand(minX, maxX), y: rand(minY, maxY) };
  }

  function bonusSpawnInsets(size){
    const board = $("#vspBoard");
    const topbar = $(".vsp-board-topbar", board || document);
    if (!board || !topbar){
      return { topInset: 0, leftInset: 0, rightInset: 0, bottomInset: 0 };
    }

    const boardRect = board.getBoundingClientRect();
    const topbarRect = topbar.getBoundingClientRect();

    const topbarBottom = topbarRect.bottom - boardRect.top;

    // Let blobs overlap the pills a little, but not sit fully under them.
    const allowedOverlap = size * 0.35;
    const topInset = Math.max(0, topbarBottom - allowedOverlap);

    return {
      topInset,
      leftInset: 0,
      rightInset: 0,
      bottomInset: 0
    };
  }

  function makeBlob({ label, isCorrect=false, preserveColor=null, preserveMotion=null }){
    const bounds = currentBounds();
    const size = labelSizeForBoard(label, bounds, false);
    const velocityMag = 0.25 * MODE_CONFIG[state.mode].speedMultiplier;
    const angle = rand(0, Math.PI * 2);
    const chosenColor = preserveColor || randomColorSet(1, state.blobs.map(b => b.color))[0] || BLOB_COLORS[0];
    const existing = state.blobs.filter(blob => blob.state === "live" || blob.state === "spawning");
    const point = safeSpawnPoint(size, existing);
    return {
      id: state.nextBlobId++,
      label,
      normalizedLabel: normalizeWord(label),
      isCorrect,
      color: chosenColor.fill,
      textColor: chosenColor.text,
      x: point.x,
      y: point.y,
      vx: preserveMotion ? preserveMotion.vx : Math.cos(angle) * velocityMag,
      vy: preserveMotion ? preserveMotion.vy : Math.sin(angle) * velocityMag,
      width: size.width,
      height: size.height,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: rand(1.2, 2.3),
      impactX: 0,
      impactY: 0,
      state: "spawning"
    };
  }

  function allocateLabelsToBlobs(blobs, labels){
    const shuffled = shuffle(blobs.slice());
    labels.forEach((label, index) => {
      const blob = shuffled[index];
      if (!blob) return;
      blob.label = label;
      blob.normalizedLabel = normalizeWord(label);
      blob.isCorrect = normalizeWord(label) === normalizeWord(currentCorrectLabel());
      const size = labelSizeForBoard(label, currentBounds(), false);
      blob.width = size.width;
      blob.height = size.height;
      blob.state = blob.state === "live" ? "live" : "spawning";
      const node = document.querySelector(`[data-blob-id="${blob.id}"]`);
      if (node){
        node.style.width = `${size.width}px`;
        node.style.height = `${size.height}px`;
        const labelNode = $(".vsp-blob-label", node);
        if (labelNode) labelNode.textContent = label;
      }
    });
  }

  function spawnInitialField(){
    const correct = currentCorrectLabel();
    const decoys = decoysForCurrentPhase(correct).slice(0, 2);
    const labels = shuffle(uniqueLabels([correct, ...decoys])).slice(0, 3);
    state.blobs = [];
    labels.forEach((label) => {
      const blob = makeBlob({ label, isCorrect: normalizeWord(label) === normalizeWord(correct) });
      state.blobs.push(blob);
    });
    renderBlobNodes();
    releaseSpawningBlobsSoon();
  }

  function refillFieldAfterCorrect(){
    const survivors = state.blobs.filter(blob => blob.state === "live");
    const correct = currentCorrectLabel();
    const labels = uniqueLabels([correct, ...decoysForCurrentPhase(correct)]).slice(0, 3);
    const chosenLabels = shuffle(labels).slice(0, 3);
    const existingColors = survivors.map(blob => blob.color);
    allocateLabelsToBlobs(survivors, chosenLabels.slice(0, survivors.length));
    const needed = 3 - survivors.length;
    const newColors = randomColorSet(needed, existingColors);
    for (let i = 0; i < needed; i++){
      const label = chosenLabels[survivors.length + i] || chosenLabels[i] || correct;
      state.blobs.push(makeBlob({ label, isCorrect: normalizeWord(label) === normalizeWord(correct), preserveColor:newColors[i] }));
    }
    renderBlobNodes();
    releaseSpawningBlobsSoon();
  }

  function refillFieldAfterSecondWrong(){
    state.blobs = [];
    state.wrongCountThisField = 0;
    spawnInitialField();
  }

  function triggerBuildShake(){
    const build = $("#vspBuild");
    if (!build) return;
    build.classList.remove("is-error");
    void build.offsetWidth;
    build.classList.add("is-error");
    setTimeout(() => build.classList.remove("is-error"), 300);
  }

  function triggerWrongFlash(){
    const layer = $("#vspFlashLayer");
    if (!layer) return;
    layer.classList.remove("is-active");
    void layer.offsetWidth;
    layer.classList.add("is-active");
    setTimeout(() => layer.classList.remove("is-active"), 280);
  }

  async function animateHardRollback(count){
    const actual = Math.min(count, state.progressIndex);
    if (!actual) return;
    const removing = [];
    for (let i = 0; i < actual; i++) removing.push(state.progressIndex - 1 - i);
    state.buildRemoving = new Set(removing);
    const buildText = $("#vspBuildText");
    if (buildText) buildText.innerHTML = renderBuildText();
    await sleep(260);
    state.progressIndex -= actual;
    state.buildRemoving = new Set();
    updatePhase();
    if (buildText) buildText.innerHTML = renderBuildText();
  }

  function appendBuildProgress(){
    const buildText = $("#vspBuildText");
    if (buildText) buildText.innerHTML = renderBuildText();
  }

  function effectNodeAt(x, y, markup, layerSelector="#vspEffectLayer"){
    const layer = $(layerSelector);
    if (!layer) return null;
    const node = document.createElement("div");
    node.className = "vsp-effect";
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = markup;
    layer.appendChild(node);
    return node;
  }

  function blobCenterPx(blob, layerSelector="#vspEffectLayer"){
    const node = document.querySelector(`[data-blob-id="${blob.id}"]`);
    const layer = $(layerSelector);
    if (node && layer){
      const nodeRect = node.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      return {
        x: (nodeRect.left - layerRect.left) + nodeRect.width / 2,
        y: (nodeRect.top - layerRect.top) + nodeRect.height / 2
      };
    }
    const bounds = currentBounds();
    return {
      x: blob.x * bounds.width + blob.width / 2,
      y: blob.y * bounds.height + blob.height / 2
    };
  }

  function spawnParticleBurst(blob, centerOverride=null, layerSelector="#vspBackEffectLayer"){
    const center = centerOverride || blobCenterPx(blob, layerSelector);
    const fill = blob.color;
    const count = Math.floor(rand(7, 11));
    const splatScale = rand(0.92, 1.08);
    const splatBase = clamp(currentBounds().width * 0.20, 120, 200);
    const splatSize = splatBase * splatScale;
    const baseAngle = rand(0, Math.PI * 2);
    const step = (Math.PI * 2) / count;
    let particles = "";

    for (let i = 0; i < count; i++){
      const angleJitter = rand(-0.10, 0.10);
      const angle = baseAngle + (i * step) + angleJitter;

      const distance = rand(splatSize * 0.62, splatSize * 1.08);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      const dotSize = rand(splatSize * 0.10, splatSize * 0.18);
      const w = dotSize.toFixed(1);
      const h = (dotSize * rand(0.94, 1.03)).toFixed(1);

      const rot = rand(-40, 40).toFixed(1);
      const dur = rand(420, 620).toFixed(0);

      const shadeAmount = Math.random() < 0.5
        ? rand(0.10, 0.18)
        : -rand(0.10, 0.18);

      const particleColor = adjustHexColor(fill, shadeAmount);

      particles += `
        <div class="vsp-particle"
          style="
            --tx:${tx.toFixed(1)}px;
            --ty:${ty.toFixed(1)}px;
            --pw:${w}px;
            --ph:${h}px;
            --prot:${rot}deg;
            --pdur:${dur}ms;
            --pcolor:${particleColor};
          ">
        </div>`;
    }

    const markup = `<div class="vsp-particle-burst" style="color:${fill};">${particles}</div>`;
    const node = effectNodeAt(center.x, center.y, markup, layerSelector);
    if (node) setTimeout(() => node.remove(), 800);
  }

  
  function spawnSplatEffect(blob, centerOverride=null, layerSelector="#vspBackEffectLayer"){
    const center = centerOverride || blobCenterPx(blob, layerSelector);
    const fill = blob.color;
    const rotation = rand(-18, 18).toFixed(2);
    const finalScale = rand(0.92, 1.08).toFixed(3);
    const popScale = (parseFloat(finalScale) * 1.12).toFixed(3);
    const markup = `
      <div class="vsp-splat-svg" style="color:${fill};--splat-rot:${rotation}deg;--splat-scale-final:${finalScale};--splat-scale-pop:${popScale};">
        ${SPLAT_SVG}
      </div>`;
    const node = effectNodeAt(center.x, center.y, markup, layerSelector);
    if (node) setTimeout(() => node.remove(), 1400);
  }

  function spawnPoofEffect(blob){
    const center = blobCenterPx(blob);
    const markup = `
      <div class="vsp-poof">
        <div class="vsp-poof-puff" style="background:rgba(255,255,255,.95)"></div>
        <div class="vsp-poof-puff" style="background:rgba(255,255,255,.92)"></div>
        <div class="vsp-poof-puff" style="background:rgba(255,255,255,.9)"></div>
        <div class="vsp-poof-puff" style="background:rgba(255,255,255,.88)"></div>
      </div>`;
    const node = effectNodeAt(center.x, center.y, markup);
    if (node) setTimeout(() => node.remove(), 420);
  }

  function removeBlobById(id){
    state.blobs = state.blobs.filter(blob => blob.id !== id);
    const node = document.querySelector(`[data-blob-id="${id}"]`);
    if (node) node.remove();
  }

  async function handleCorrectTap(blob){
    if (state.busy) return;
    state.busy = true;
    state.inputLockedUntil = performance.now() + CORRECT_TAP_LOCK_MS;
    spawnSplatEffect(blob);
    spawnParticleBurst(blob);
    removeBlobById(blob.id);
    state.progressIndex += 1;
    state.wrongCountThisField = 0;
    updatePhase();
    appendBuildProgress();
    if (state.phase === "complete"){
      await completeMainGame();
      state.busy = false;
      return;
    }
    refillFieldAfterCorrect();
    state.busy = false;
  }

  async function handleWrongTap(blob){
    if (state.busy) return;
    state.busy = true;
    spawnPoofEffect(blob);
    removeBlobById(blob.id);
    triggerBuildShake();
    triggerWrongFlash();
    state.wrongCountThisField += 1;
    if (MODE_CONFIG[state.mode].rollbackCount){
      await animateHardRollback(MODE_CONFIG[state.mode].rollbackCount);
    }
    if (state.wrongCountThisField >= 2){
      state.blobs.slice().forEach(leftover => spawnPoofEffect(leftover));
      state.blobs = [];
      renderBlobNodes();
      await sleep(140);
      refillFieldAfterSecondWrong();
    } else {
      renderBlobNodes();
    }
    state.busy = false;
  }

  async function handleBlobTap(blobId){
    if (state.menuOpen || state.helpOpen || state.screen !== "game" || state.busy) return;
    const blob = state.blobs.find(entry => entry.id === blobId);
    if (!blob) return;
    if (blob.isCorrect) await handleCorrectTap(blob);
    else await handleWrongTap(blob);
  }

  function updateBlobMotion(blob, dt, bounds){
    blob.x += blob.vx * dt;
    blob.y += blob.vy * dt;

    const minX = bounds.leftInset / bounds.width;
    const maxX = Math.max(minX, 1 - blob.width / bounds.width - (bounds.rightInset / bounds.width));
    const minY = bounds.topInset / bounds.height;
    const maxY = Math.max(minY, 1 - blob.height / bounds.height - (bounds.bottomInset / bounds.height));

    if (blob.x <= minX){
      blob.x = minX;
      blob.vx = Math.abs(blob.vx);
      blob.impactX = -0.23;
      blob.impactY = 0.8;
    }
    else if (blob.x >= maxX){
      blob.x = maxX;
      blob.vx = -Math.abs(blob.vx);
      blob.impactX = -0.23;
      blob.impactY = 0.8;
    }

    if (blob.y <= minY){
      blob.y = minY;
      blob.vy = Math.abs(blob.vy);
      blob.impactY = -0.57;
      blob.impactX = 0.39;
    }
    else if (blob.y >= maxY){
      blob.y = maxY;
      blob.vy = -Math.abs(blob.vy);
      blob.impactY = -0.57;
      blob.impactX = 0.39;
    }

    blob.wobblePhase += dt * blob.wobbleSpeed * 3.2;
    const decay = Math.pow(0.001, dt * 1);
    blob.impactX *= decay;
    blob.impactY *= decay;
  }

  function tickGame(ts){
    if (state.screen !== "game" || state.menuOpen || state.helpOpen) return;
    const bounds = currentBounds();
    const dt = state.lastTs ? Math.min((ts - state.lastTs) / 1000, 0.032) : 0.016;
    state.lastTs = ts;
    state.blobs.forEach(blob => {
      updateBlobMotion(blob, dt, bounds);
      updateBlobDom(blob);
    });
    state.rafId = requestAnimationFrame(tickGame);
  }

  function startGameLoop(){
    stopGameLoop();
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(tickGame);
  }

  function stopGameLoop(){
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }


  function makeBonusBlob(color){
    const bounds = currentBounds();
    const size = rand(clamp(bounds.width * 0.11, 54, 74), clamp(bounds.width * 0.16, 88, 124));
    const width = size;
    const height = size * rand(0.86, 1.08);
    const existing = state.bonusBlobs.map(blob => ({ x: blob.x, y: blob.y, width: blob.size, height: blob.size }));
    const point = safeSpawnPoint(
      { width, height },
      existing,
      bonusSpawnInsets(size)
    );

    return {
      id: state.nextBonusBlobId++,
      x: point.x,
      y: point.y,
      size,
      color: color.fill,
      textColor: color.text,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: rand(1, 2.1),
      alive: true
    };
  }


  function bonusBlobMarkup(blob){
    return `
      <div class="vsp-blob" data-bonus-id="${blob.id}" role="button" tabindex="0" aria-label="splat blob" style="width:${blob.size}px;height:${blob.size}px;">
        <div class="vsp-blob-body" style="background:${blob.color};"></div>
      </div>
    `;
  }

  function renderBonusBlobNodes(){
    const layer = $("#vspBlobLayer");
    if (!layer) return;
    layer.innerHTML = state.bonusBlobs.filter(blob => blob.alive).map(bonusBlobMarkup).join("");
    bindBoardMainInteraction();
    state.bonusBlobs.forEach(updateBonusBlobDom);
  }

  function updateBonusBlobDom(blob){
    const node = document.querySelector(`[data-bonus-id="${blob.id}"]`);
    if (!node) return;
    const bounds = currentBounds();
    node.style.transform = `translate(${blob.x * bounds.width}px, ${blob.y * bounds.height}px)`;
    const body = $(".vsp-blob-body", node);
    if (body){
      const wobble = Math.sin(blob.wobblePhase) * 0.07;
      body.style.transform = `scale(${1 + wobble}, ${1 - wobble}) rotate(${Math.sin(blob.wobblePhase * .8) * 2.6}deg)`;
    }
  }

  function spawnBonusBlobs(){
    state.bonusBlobs = [];
    const colors = shuffle(BLOB_COLORS);
    const total = 18;
    for (let i = 0; i < total; i++) state.bonusBlobs.push(makeBonusBlob(colors[i % colors.length]));
    renderBonusBlobNodes();
  }

  function tickBonus(ts){
    if (state.screen !== "bonus" || state.menuOpen || state.helpOpen) return;
    if (!state.bonusStartedAt) state.bonusStartedAt = ts;
    const elapsed = ts - state.bonusStartedAt;
    state.bonusRemainingMs = Math.max(0, BONUS_TIME_LIMIT_MS - elapsed);
    state.bonusBlobs.forEach(blob => {
      if (!blob.alive) return;
      blob.wobblePhase += 0.045 * blob.wobbleSpeed;
      updateBonusBlobDom(blob);
    });
    const pill = $("#vspBonusTimerChip");
    if (pill) pill.textContent = `Time ${Math.ceil(state.bonusRemainingMs / 1000)}`;
    if (state.bonusRemainingMs <= 0 || state.bonusBlobs.every(blob => !blob.alive)){
      finishBonusRound();
      return;
    }
    state.bonusRafId = requestAnimationFrame(tickBonus);
  }

  function startBonusLoop(){
    stopBonusLoop();
    state.bonusStartedAt = 0;
    state.bonusRafId = requestAnimationFrame(tickBonus);
  }

  function stopBonusLoop(){
    if (state.bonusRafId) cancelAnimationFrame(state.bonusRafId);
    state.bonusRafId = 0;
  }

  function stopLoops(){
    stopGameLoop();
    stopBonusLoop();
  }

  function bonusBlobCenterPx(blob, layerSelector="#vspEffectLayer"){
    const node = document.querySelector(`[data-bonus-id="${blob.id}"]`);
    const layer = $(layerSelector);
    if (node && layer){
      const nodeRect = node.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      return {
        x: (nodeRect.left - layerRect.left) + nodeRect.width / 2,
        y: (nodeRect.top - layerRect.top) + nodeRect.height / 2
      };
    }
    const bounds = currentBounds();
    return { x: blob.x * bounds.width + blob.size / 2, y: blob.y * bounds.height + blob.size / 2 };
  }

 

  function handleBonusBlobTap(id){
    if (state.screen !== "bonus" || state.menuOpen || state.helpOpen) return;
    const blob = state.bonusBlobs.find(entry => entry.id === id);
    if (!blob || !blob.alive) return;

    const center = bonusBlobCenterPx(blob, "#vspBackEffectLayer");
    spawnSplatEffect(blob, center, "#vspBackEffectLayer");
    spawnParticleBurst(blob, center, "#vspBackEffectLayer");

    blob.alive = false;
    state.bonusScore += 1;
    const blobNode = document.querySelector(`[data-bonus-id="${id}"]`);
    if (blobNode) blobNode.remove();
    if (state.bonusBlobs.every(entry => !entry.alive)) finishBonusRound();
  }

  async function completeMainGame(){
    stopGameLoop();
    const wasAlreadyCompleted = typeof window.VerseGameBridge.wasAlreadyCompleted === "function"
      ? !!window.VerseGameBridge.wasAlreadyCompleted(ctx.verseId, GAME_ID, state.mode)
      : false;
    state.medalAlreadyEarned = wasAlreadyCompleted;
    await window.VerseGameBridge.markCompleted({ verseId: ctx.verseId, gameId: GAME_ID, mode: state.mode });
    state.medalMessage = wasAlreadyCompleted ? `You finished ${state.mode} again.` : `${medalEmojiForMode(state.mode)} earned!`;
    state.medalSubmessage = wasAlreadyCompleted ? "The medal was already yours, but the splats were still worth it." : "Your verse progress, stars, and BibloPet flow have been updated.";
    state.bonusIntroVisible = true;
    setScreen("bonus");
    render();
    afterBonusScreenRender();
    await sleep(1200);
    state.bonusIntroVisible = false;
    render();
    afterBonusScreenRender();
  }

  function finishBonusRound(){
    stopBonusLoop();
    setScreen("end");
  }

  function afterGameScreenRender(){
    if (state.menuOpen || state.helpOpen) return;
    if (!state.blobs.length) spawnInitialField();
    else renderBlobNodes();
    startGameLoop();
  }

  function afterBonusScreenRender(){
    if (state.menuOpen || state.helpOpen) return;
    if (!state.bonusBlobs.length) spawnBonusBlobs();
    else renderBonusBlobNodes();
    if (!state.bonusIntroVisible) startBonusLoop();
  }

  initVerseData();
  render();
})();
