
(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell", "vsp-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "verse_splat";
  const GAME_TITLE = "Verse Splat";
  const BONUS_TIME_LIMIT_MS = 30000;

  const $ = (s, root=document) => root.querySelector(s);
  const escapeHtml = (str) => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => min + Math.random() * (max - min);

  const BLOB_COLORS = [
    { fill:"#ff5a51", text:"#fff" },
    { fill:"#ffa351", text:"#fff" },
    { fill:"#ffc751", text:"#333" },
    { fill:"#a7cb6f", text:"#fff" },
    { fill:"#40b9c5", text:"#fff" },
    { fill:"#7f66c6", text:"#fff" }
  ];

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

  function getBlobIdFromPoint(clientX, clientY, bonus=false){
    const selector = bonus ? "[data-bonus-id]" : "[data-blob-id]";
    const nodes = Array.from(document.querySelectorAll(selector));
    for (let i = nodes.length - 1; i >= 0; i--){
      const node = nodes[i];
      const rect = node.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom){
        return Number(node.dataset[bonus ? "bonusId" : "blobId"]);
      }
    }
    return null;
  }

  function extractClientPoint(event){
    if (event.touches && event.touches[0]) return { x:event.touches[0].clientX, y:event.touches[0].clientY };
    if (event.changedTouches && event.changedTouches[0]) return { x:event.changedTouches[0].clientX, y:event.changedTouches[0].clientY };
    return { x:event.clientX, y:event.clientY };
  }

  function bindBlobLayerInteraction(){
    const layer = $("#vspBlobLayer");
    if (!layer || layer.dataset.boundBlobPress === "1") return;
    const onPress = (event) => {
      if (state.menuOpen || state.helpOpen || state.screen !== "game" || state.busy) return;
      const blobNode = event.target.closest ? event.target.closest("[data-blob-id]") : null;
      const point = extractClientPoint(event);
      const blobId = blobNode ? Number(blobNode.dataset.blobId) : getBlobIdFromPoint(point.x, point.y, false);
      if (!blobId) return;
      event.preventDefault();
      event.stopPropagation();
      handleBlobTap(blobId);
    };
    layer.addEventListener("pointerdown", onPress, { passive:false });
    layer.addEventListener("touchstart", onPress, { passive:false });
    layer.addEventListener("click", onPress, { passive:false });
    layer.dataset.boundBlobPress = "1";
  }

  function bindBonusBlobLayerInteraction(){
    const layer = $("#vspBlobLayer");
    if (!layer || layer.dataset.boundBonusBlobPress === "1") return;
    const onPress = (event) => {
      if (state.menuOpen || state.helpOpen || state.screen !== "bonus") return;
      const blobNode = event.target.closest ? event.target.closest("[data-bonus-id]") : null;
      const point = extractClientPoint(event);
      const blobId = blobNode ? Number(blobNode.dataset.bonusId) : getBlobIdFromPoint(point.x, point.y, true);
      if (!blobId) return;
      event.preventDefault();
      event.stopPropagation();
      handleBonusBlobTap(blobId);
    };
    layer.addEventListener("pointerdown", onPress, { passive:false });
    layer.addEventListener("touchstart", onPress, { passive:false });
    layer.addEventListener("click", onPress, { passive:false });
    layer.dataset.boundBonusBlobPress = "1";
  }

  function renderIntro(){
    return `
      <div class="vsp-stack" style="margin:auto 0;">
        <div class="vm-pill">${escapeHtml(GAME_TITLE)}</div>
        <div class="vsp-card">
          <div class="vsp-title">Splat the next correct word.</div>
          <div class="vsp-copy" style="margin-top:10px;">Three gooey word blobs bounce around the board. Tap the next correct word to build the verse, then the book, then the reference.</div>
          <div class="vsp-chip-row" style="margin-top:14px;">
            <span class="vsp-chip">Correct = colorful splat</span>
            <span class="vsp-chip">Wrong = poof</span>
            <span class="vsp-chip">Bonus splat round</span>
          </div>
        </div>
        <div class="vsp-actions">
          <button class="vm-btn" data-action="go-mode">Play</button>
          <button class="vm-btn vm-btn-dark" data-action="show-help-intro">How to Play</button>
        </div>
      </div>
    `;
  }

  function renderModeScreen(){
    return `
      <div class="vsp-stack" style="margin:auto 0;">
        <div class="vm-pill">Choose a mode</div>
        <div class="vsp-mode-grid">
          <button class="vsp-mode-card" data-mode="easy">
            <div class="vsp-mode-title">Easy</div>
            <div class="vsp-mode-copy">Standard bouncing blobs with fun decoys.</div>
          </button>
          <button class="vsp-mode-card" data-mode="medium">
            <div class="vsp-mode-title">Medium</div>
            <div class="vsp-mode-copy">Decoys come from verse words and Bible content.</div>
          </button>
          <button class="vsp-mode-card" data-mode="hard">
            <div class="vsp-mode-title">Hard</div>
            <div class="vsp-mode-copy">Verse-style decoys. Wrong taps also remove two built words.</div>
          </button>
        </div>
        <div class="vsp-actions">
          <button class="vm-btn vm-btn-dark" data-action="back-intro">Back</button>
        </div>
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
              <button class="vsp-overlay-btn" data-action="close-help">Got it</button>
              ${state.helpBackMode ? '<button class="vsp-overlay-btn vsp-dark" data-action="help-back-menu">Back to Menu</button>' : ''}
            </div>
          </div>
        </div>
      `;
    }
    if (state.menuOpen){
      return `
        <div class="vsp-overlay">
          <div class="vsp-overlay-card vsp-overlay-card-menu">
            <div class="vsp-overlay-title">Game Menu</div>
            <div class="vsp-overlay-actions">
              <button class="vsp-overlay-btn" data-action="open-help-from-menu">How to Play</button>
              <button class="vsp-overlay-btn" data-action="toggle-mute">Mute / Unmute</button>
              <button class="vsp-overlay-btn" data-action="resume-game">Close Menu</button>
              <button class="vsp-overlay-btn vsp-dark" data-action="exit-game">Exit Game</button>
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
      <div class="vsp-stack" style="margin:auto 0;">
        <div class="vm-pill">${escapeHtml(GAME_TITLE)}</div>
        <div class="vsp-card">
          <div class="vsp-title">Nice splatting.</div>
          <div class="vsp-subtitle">${escapeHtml(state.medalMessage || `You completed ${state.mode}.`)}</div>
          <div class="vsp-copy">${escapeHtml(state.medalSubmessage || 'Verse, book, and reference complete.')}</div>
          <div class="vsp-end-stat" style="margin-top:12px;">Bonus blobs splatted: <strong>${state.bonusScore}</strong></div>
        </div>
        <div class="vsp-actions">
          <button class="vm-btn" data-action="play-again">Play Again</button>
          <button class="vm-btn vm-btn-dark" data-action="exit-game">Exit Game</button>
        </div>
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
    app.querySelectorAll("[data-action='help-back-menu']").forEach(btn => btn.onclick = () => { state.helpOpen = false; state.menuOpen = true; render(); });
    app.querySelectorAll("[data-action='toggle-mute']").forEach(btn => btn.onclick = () => closeMenu());
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
    state.helpOpen = false;
    render();
    if (state.screen === "game") afterGameScreenRender();
    if (state.screen === "bonus") afterBonusScreenRender();
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
    bindBlobLayerInteraction();
    state.blobs.forEach(blob => updateBlobDom(blob));
  }

  function updateBlobDom(blob){
    const node = document.querySelector(`[data-blob-id="${blob.id}"]`);
    if (!node) return;
    const bounds = currentBounds();
    const wobble = Math.sin(blob.wobblePhase) * 0.035;
    const squeezeX = 1 + blob.impactX + wobble;
    const squeezeY = 1 + blob.impactY - wobble;
    node.style.transform = `translate(${blob.x * bounds.width}px, ${blob.y * bounds.height}px)`;
    const body = $(".vsp-blob-body", node);
    if (body) body.style.transform = `scale(${squeezeX}, ${squeezeY}) rotate(${Math.sin(blob.wobblePhase * 0.7) * 1.6}deg)`;
    const label = $(".vsp-blob-label", node);
    if (label) label.style.letterSpacing = `${Math.sin(blob.wobblePhase) * 0.018}em`;
  }

  function safeSpawnPoint(size, existing){
    const bounds = currentBounds();
    const insetX = size.width / bounds.width;
    const insetY = size.height / bounds.height;
    const minX = bounds.leftInset / bounds.width;
    const maxX = Math.max(minX, 1 - insetX - (bounds.rightInset / bounds.width));
    const minY = bounds.topInset / bounds.height;
    const maxY = Math.max(minY, 1 - insetY - (bounds.bottomInset / bounds.height));
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

  function makeBlob({ label, isCorrect=false, preserveColor=null, preserveMotion=null }){
    const bounds = currentBounds();
    const size = labelSizeForBoard(label, bounds, false);
    const velocityMag = (0.18 + Math.random() * 0.08) * MODE_CONFIG[state.mode].speedMultiplier;
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
    state.blobs.forEach(blob => blob.state = "live");
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
    state.blobs.forEach(blob => blob.state = "live");
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

  function effectNodeAt(x, y, markup){
    const layer = $("#vspEffectLayer");
    if (!layer) return null;
    const node = document.createElement("div");
    node.className = "vsp-effect";
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = markup;
    layer.appendChild(node);
    return node;
  }

  function blobCenterPx(blob){
    const bounds = currentBounds();
    return {
      x: blob.x * bounds.width + blob.width / 2,
      y: blob.y * bounds.height + blob.height / 2
    };
  }

  function spawnSplatEffect(blob){
    const center = blobCenterPx(blob);
    const fill = blob.color;
    const markup = `
      <div class="vsp-splat">
        <div class="vsp-splat-core" style="background:${fill};"></div>
        <div class="vsp-splat-lobe" style="left:2%;top:24%;background:${fill};"></div>
        <div class="vsp-splat-lobe" style="right:4%;top:18%;background:${fill};width:34%;height:34%;"></div>
        <div class="vsp-splat-lobe" style="left:16%;bottom:8%;background:${fill};width:28%;height:28%;"></div>
        <div class="vsp-splat-lobe" style="right:12%;bottom:10%;background:${fill};width:24%;height:24%;"></div>
        <div class="vsp-drip" style="left:28%;background:${fill};"></div>
        <div class="vsp-drip" style="left:56%;height:42%;background:${fill};"></div>
      </div>`;
    const node = effectNodeAt(center.x, center.y, markup);
    if (node) setTimeout(() => node.remove(), 620);
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
    spawnSplatEffect(blob);
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

    if (blob.x <= minX){ blob.x = minX; blob.vx = Math.abs(blob.vx); blob.impactX = -0.18; blob.impactY = 0.18; }
    else if (blob.x >= maxX){ blob.x = maxX; blob.vx = -Math.abs(blob.vx); blob.impactX = -0.18; blob.impactY = 0.18; }

    if (blob.y <= minY){ blob.y = minY; blob.vy = Math.abs(blob.vy); blob.impactY = -0.18; blob.impactX = 0.18; }
    else if (blob.y >= maxY){ blob.y = maxY; blob.vy = -Math.abs(blob.vy); blob.impactY = -0.18; blob.impactX = 0.18; }

    blob.wobblePhase += dt * blob.wobbleSpeed * 3.2;
    blob.impactX *= Math.pow(0.001, dt * 2.4);
    blob.impactY *= Math.pow(0.001, dt * 2.4);
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
    const point = safeSpawnPoint({ width, height }, existing);
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
    bindBonusBlobLayerInteraction();
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

  function bonusBlobCenterPx(blob){
    const bounds = currentBounds();
    return { x: blob.x * bounds.width + blob.size / 2, y: blob.y * bounds.height + blob.size / 2 };
  }

  function handleBonusBlobTap(id){
    if (state.screen !== "bonus" || state.menuOpen || state.helpOpen) return;
    const blob = state.bonusBlobs.find(entry => entry.id === id);
    if (!blob || !blob.alive) return;
    const center = bonusBlobCenterPx(blob);
    const node = effectNodeAt(center.x, center.y, `
      <div class="vsp-splat">
        <div class="vsp-splat-core" style="background:${blob.color};"></div>
        <div class="vsp-splat-lobe" style="left:4%;top:18%;background:${blob.color};"></div>
        <div class="vsp-splat-lobe" style="right:8%;top:20%;background:${blob.color};"></div>
        <div class="vsp-splat-lobe" style="left:18%;bottom:12%;background:${blob.color};"></div>
        <div class="vsp-splat-lobe" style="right:14%;bottom:10%;background:${blob.color};"></div>
        <div class="vsp-drip" style="left:30%;background:${blob.color};"></div>
        <div class="vsp-drip" style="left:58%;height:44%;background:${blob.color};"></div>
      </div>`);
    if (node) setTimeout(() => node.remove(), 620);
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
    state.medalMessage = wasAlreadyCompleted ? `You finished ${state.mode} again.` : `${state.mode[0].toUpperCase() + state.mode.slice(1)} medal earned!`;
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
