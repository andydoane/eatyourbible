(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_typer";
  const GAME_TITLE = "Verse Typer";
  const GAME_ICON = "🐛";
  const HELP_OVERLAY_ID = "verseTyperHelpOverlay";

  const GAME_THEME = {
    bg: "#f7cf5d",
    accent: "#3b8f3f",
    helpTitleBg: "#7ebf4f",
    helpTitleColor: "#ffffff",
    helpCloseBg: "#ff5a51",
    helpCloseColor: "#ffffff"
  };

  const MODES = [
    { id: "beginner", label: "Beginner" },
    { id: "advanced", label: "Advanced" }
  ];

  const LETTER_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ];

  const NUMBER_ROWS = [
    ["1", "2", "3", "4", "5"],
    ["6", "7", "8", "9", "0"]
  ];

  const THEME_SKINS = {
    caterpillar: {
      id: "caterpillar",
      wordClass: "vt-skin-caterpillar",
      itemName: "caterpillar"
    }
  };

  const skin = THEME_SKINS.caterpillar;

  let selectedMode = "beginner";
  let muted = false;
  let audioCtx = null;
  let masterGain = null;
  let chunkAudio = null;

  const state = {
    screen: "intro",
    verseJson: null,
    chunks: [],
    bookWords: [],
    referenceChars: [],
    referenceExpectedDigits: [],
    referenceDigitPositions: [],
    currentChunkIndex: 0,
    currentWordIndex: 0,
    currentItem: null,
    typedIndex: 0,
    revealed: false,
    justTypedIndex: -1,
    justTypedSegmentIndex: -1,
    acceptingInput: false,
    transitionLocked: false,
    paused: false,
    startTime: 0,
    correctLetters: 0,
    typos: 0,
    streak: 0,
    bestStreak: 0,
    badges: [],
    sparkles: [],
    headShakeUntil: 0,
    keyFlash: "",
    keyFlashBad: false,
    phaseLabel: "",
    menuOpen: false,
    completed: false,
    sleepIds: []
  };

  const sleep = (ms) => new Promise(resolve => {
    const id = setTimeout(() => {
      state.sleepIds = state.sleepIds.filter(item => item !== id);
      resolve();
    }, ms);
    state.sleepIds.push(id);
  });

  function clearSleeps(){
    state.sleepIds.forEach(id => clearTimeout(id));
    state.sleepIds = [];
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function audioContextConstructor(){
    return window.AudioContext || window.webkitAudioContext;
  }

  function createAudio(){
    if (audioCtx){
      if (masterGain) masterGain.gain.value = muted ? 0 : 0.45;
      return;
    }

    const AudioCtor = audioContextConstructor();
    if (!AudioCtor) return;

    audioCtx = new AudioCtor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 0.45;
    masterGain.connect(audioCtx.destination);
  }

  function unlockAudio(){
    createAudio();
    if (!audioCtx || !masterGain) return;

    if (audioCtx.state !== "running"){
      audioCtx.resume?.().catch?.(() => {});
    }

    try {
      const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      source.buffer = buffer;
      gain.gain.value = 0.0001;
      source.connect(gain);
      gain.connect(masterGain);
      source.start(0);
    } catch(err){}
  }

  function midiToFreq(midi){
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone({ midi = 60, duration = 0.16, volume = 0.16, type = "triangle" } = {}){
    if (!audioCtx || !masterGain || muted) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(midi), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  function melodyForLength(length){
    const melodies = {
      1: [67],
      2: [60, 67],
      3: [60, 64, 67],
      4: [60, 62, 65, 67],
      5: [60, 64, 67, 72, 67],
      6: [60, 62, 64, 67, 69, 72],
      7: [60, 64, 67, 69, 72, 69, 67],
      8: [60, 62, 64, 67, 69, 72, 74, 72]
    };

    if (melodies[length]) return melodies[length];
    return [60, 62, 64, 67, 69, 72, 74, 76, 74, 72, 69, 67];
  }

  function playCorrectLetterSound(){
    const item = state.currentItem;
    const len = Math.max(1, item?.expected?.length || 1);
    const melody = melodyForLength(Math.min(12, len));
    const midi = melody[state.typedIndex % melody.length] || 60;
    playTone({ midi, duration: 0.13, volume: 0.13, type: state.streak >= 15 ? "square" : "triangle" });
  }

  function playWrongSound(){
    playTone({ midi: 43, duration: 0.13, volume: 0.12, type: "sine" });
    setTimeout(() => playTone({ midi: 38, duration: 0.11, volume: 0.09, type: "sine" }), 55);
  }

  function playWordDoneSound(){
    playTone({ midi: 72, duration: 0.14, volume: 0.11, type: "triangle" });
    setTimeout(() => playTone({ midi: 76, duration: 0.18, volume: 0.10, type: "triangle" }), 70);
  }

  function normalizeLetters(value){
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function tokenizeWords(value){
    if (window.VerseGameShell?.tokenizeVerseWords){
      return window.VerseGameShell.tokenizeVerseWords(String(value || ""))
        .map(word => normalizeLetters(word))
        .filter(Boolean);
    }

    return String(value || "")
      .match(/[A-Za-z]+(?:[’'][A-Za-z]+)?|[0-9]+/g)?.map(normalizeLetters).filter(Boolean) || [];
  }

  function titleCase(value){
    return String(value || "")
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function prettyWord(value){
    const clean = normalizeLetters(value);
    return clean || String(value || "").trim();
  }

  function echoPartFileByIndex(index){
    const suffix = String.fromCharCode("a".charCodeAt(0) + index);
    return `../../verse_audio/${ctx.verseId}${suffix}.mp3`;
  }

  async function loadVerseJson(){
    if (state.verseJson) return state.verseJson;

    const params = window.VerseGameBridge.getLaunchParams?.() || {};
    const verseId = ctx.verseId || params.verseId || "";
    if (!verseId) return null;

    try {
      const res = await fetch(`../../verse_data/${verseId}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.verseJson = await res.json();
      return state.verseJson;
    } catch (err){
      console.warn("Verse Typer could not load full verse JSON", err);
      return null;
    }
  }

  function splitFallbackChunks(verseText){
    const words = tokenizeWords(verseText);
    const chunks = [];
    for (let i = 0; i < words.length; i += 6){
      const partWords = words.slice(i, i + 6);
      chunks.push({
        text: partWords.map(titleCase).join(" "),
        words: partWords,
        audioFile: ""
      });
    }
    return chunks;
  }

  function makeChunks(verseJson){
    const echoParts = Array.isArray(verseJson?.echoParts)
      ? verseJson.echoParts.filter(part => String(part || "").trim())
      : [];

    if (!echoParts.length){
      return splitFallbackChunks(ctx.verseText || verseJson?.verseText || "");
    }

    return echoParts.map((part, index) => ({
      text: String(part || "").trim(),
      words: tokenizeWords(part),
      audioFile: echoPartFileByIndex(index)
    })).filter(chunk => chunk.words.length);
  }

  function makeBookWords(book){
    const raw = String(book || "").trim();
    if (!raw) return [];

    const parts = raw.split(/\s+/).filter(Boolean);
    const out = [];

    parts.forEach((part) => {
      if (part === "1") out.push("FIRST");
      else if (part === "2") out.push("SECOND");
      else if (part === "3") out.push("THIRD");
      else out.push(prettyWord(part));
    });

    return out.filter(Boolean);
  }

  function makeReferenceData(reference){
    const chars = String(reference || "").replace(/[–—−]/g, "-").split("");
    const expected = [];
    const positions = [];

    chars.forEach((char, index) => {
      if (/\d/.test(char)){
        expected.push(char);
        positions.push(index);
      }
    });

    return { chars, expected, positions };
  }

  async function initRunData(){
    const verseJson = await loadVerseJson();
    const parsed = window.VerseGameShell.parseReferenceParts(
      ctx.verseRef,
      ctx.translation,
      ctx.verseId
    );

    const chunks = makeChunks(verseJson || {});
    const fallbackChunks = chunks.length ? chunks : splitFallbackChunks(ctx.verseText || "");
    const bookWords = makeBookWords(parsed.book);
    const referenceData = makeReferenceData(parsed.reference);

    state.chunks = fallbackChunks;
    state.bookWords = bookWords;
    state.referenceChars = referenceData.chars;
    state.referenceExpectedDigits = referenceData.expected;
    state.referenceDigitPositions = referenceData.positions;
  }

  function resetStats(){
    state.currentChunkIndex = 0;
    state.currentWordIndex = 0;
    state.currentItem = null;
    state.typedIndex = 0;
    state.revealed = false;
    state.justTypedIndex = -1;
    state.justTypedSegmentIndex = -1;
    state.acceptingInput = false;
    state.transitionLocked = false;
    state.paused = false;
    state.startTime = performance.now();
    state.correctLetters = 0;
    state.typos = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.badges = [];
    state.sparkles = [];
    state.headShakeUntil = 0;
    state.keyFlash = "";
    state.keyFlashBad = false;
    state.completed = false;
  }

  function renderIntro(){
    stopAllAudio();
    clearSleeps();

    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: GAME_ICON,
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      startText: "Start",
      helpText: "How to Play",
      theme: GAME_THEME,
      backLabel: "Back to Verse Playground",
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: () => {
        unlockAudio();
        setScreen("mode");
      }
    });
  }

  function renderMode(){
    stopAllAudio();
    clearSleeps();

    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Mode",
      icon: "🐛✨",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      backLabel: "Back to Verse Typer title",
      theme: GAME_THEME,
      modes: MODES,
      onBack: () => setScreen("intro"),
      onSelect: async (mode) => {
        unlockAudio();
        selectedMode = mode === "advanced" ? "advanced" : "beginner";
        await beginRun();
      }
    });
  }

  async function beginRun(){
    await initRunData();
    resetStats();
    state.screen = "game";
    renderGameShell();
    startChunkWord(0, 0);
  }

  function renderGameShell(){
    app.innerHTML = `
      <div class="vt-root ${skin.wordClass}">
        <div class="vt-stage">
          <div class="vt-topbar">
            <button class="vt-pill vt-menu-pill no-zoom" id="vtMenuPill" type="button" aria-label="Game Menu">☰</button>
            <div class="vt-pill vt-phase-pill" id="vtPhasePill">Verse</div>
            <div class="vt-pill vt-streak-pill" id="vtStreakPill">🔥 0</div>
          </div>

          <div class="vt-play-card" id="vtPlayCard">
            <div class="vt-sky" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>

            <div class="vt-badge-layer" id="vtBadgeLayer"></div>
            <div class="vt-sparkle-layer" id="vtSparkleLayer"></div>
            <div class="vt-main" id="vtMain"></div>
          </div>

          <div class="vt-keyboard-wrap" id="vtKeyboardWrap"></div>
        </div>

        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>
    `;

    wireGameMenu();
    wirePhysicalKeyboard();
    renderHud();
    renderKeyboard("letters");
  }

  function renderHelpOverlay(){
    return window.VerseGameShell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body: helpHtml()
    });
  }

  function renderGameMenuOverlay(){
    return window.VerseGameShell.gameMenuHtml({
      id: "verseTyperGameMenuOverlay",
      title: "Verse Typer Menu",
      muted,
      showModeSelect: true,
      exitText: "Exit Playground"
    });
  }

  function wireGameMenu(){
    window.VerseGameShell.wireGameMenu({
      id: "verseTyperGameMenuOverlay",
      menuButtonId: "vtMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        muted = !muted;
        if (masterGain && audioCtx){
          masterGain.gain.setValueAtTime(muted ? 0 : 0.45, audioCtx.currentTime);
        }
        if (chunkAudio) chunkAudio.muted = muted;
        return muted;
      },
      onHowToPlay: () => {
        window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
        state.paused = true;
      },
      onModeSelect: () => {
        state.paused = false;
        stopAllAudio();
        setScreen("mode");
      },
      onExit: () => {
        stopAllAudio();
        window.VerseGameBridge.exitGame();
      },
      onOpen: () => { state.paused = true; },
      onClose: () => { state.paused = false; },
      onBackFromHelp: () => { state.paused = true; }
    });
  }

  function wirePhysicalKeyboard(){
    window.onkeydown = (event) => {
      if (state.screen !== "game") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = String(event.key || "").toUpperCase();
      if (/^[A-Z]$/.test(key) || /^\d$/.test(key)){
        event.preventDefault();
        handleKey(key);
      }
    };
  }

  function renderHud(){
    const streak = document.getElementById("vtStreakPill");
    const phase = document.getElementById("vtPhasePill");
    if (streak) streak.textContent = `🔥 ${state.streak}`;
    if (phase) phase.textContent = state.phaseLabel || "Verse";
  }

  function renderKeyboard(type){
    const wrap = document.getElementById("vtKeyboardWrap");
    if (!wrap) return;

    const rows = type === "numbers" ? NUMBER_ROWS : LETTER_ROWS;
    const extraClass = type === "numbers" ? "is-numbers" : "is-letters";

    wrap.innerHTML = `
      <div class="vt-keyboard ${extraClass}">
        ${rows.map(row => `
          <div class="vt-key-row">
            ${row.map(key => `
              <button class="vt-key no-zoom ${state.keyFlash === key ? (state.keyFlashBad ? "is-bad" : "is-good") : ""}" data-vt-key="${escapeHtml(key)}" type="button">${escapeHtml(key)}</button>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `;

    wrap.querySelectorAll("[data-vt-key]").forEach(btn => {
      btn.onclick = () => {
        unlockAudio();
        handleKey(btn.dataset.vtKey);
      };
    });
  }

  function setPhaseLabel(label){
    state.phaseLabel = label;
    renderHud();
  }

  function startChunkWord(chunkIndex, wordIndex){
    const chunk = state.chunks[chunkIndex];
    if (!chunk){
      startBookPhase();
      return;
    }

    const word = chunk.words[wordIndex];
    if (!word){
      startChunkReview(chunkIndex);
      return;
    }

    state.currentChunkIndex = chunkIndex;
    state.currentWordIndex = wordIndex;
    setCurrentItem({
      kind: "word",
      display: word,
      expected: normalizeLetters(word),
      phase: "verse",
      chunkIndex,
      wordIndex
    });
    setPhaseLabel(`Chunk ${chunkIndex + 1}/${state.chunks.length}`);
    renderKeyboard("letters");
    renderCurrentItem("enter");
  }

  function startBookPhase(){
    if (!state.bookWords.length){
      startReferencePhase();
      return;
    }

    state.currentWordIndex = 0;
    startBookWord(0);
  }

  function startBookWord(index){
    const word = state.bookWords[index];
    if (!word){
      startReferencePhase();
      return;
    }

    state.currentWordIndex = index;
    setCurrentItem({
      kind: "book",
      display: word,
      expected: normalizeLetters(word),
      phase: "book"
    });
    setPhaseLabel("Book");
    renderKeyboard("letters");
    renderCurrentItem("enter");
  }

  function startReferencePhase(){
    if (!state.referenceExpectedDigits.length){
      finishRun();
      return;
    }

    setCurrentItem({
      kind: "reference",
      display: state.referenceChars.join(""),
      expected: state.referenceExpectedDigits.join(""),
      chars: state.referenceChars,
      digitPositions: state.referenceDigitPositions,
      phase: "reference"
    });
    setPhaseLabel("Chapter & Verse");
    renderKeyboard("numbers");
    renderCurrentItem("enter");
  }

  function setCurrentItem(item){
    state.currentItem = item;
    state.typedIndex = 0;
    state.revealed = false;
    state.justTypedIndex = -1;
    state.justTypedSegmentIndex = -1;
    state.acceptingInput = false;
    state.transitionLocked = true;
  }

  function renderCurrentItem(animationState = ""){
    const main = document.getElementById("vtMain");
    if (!main || !state.currentItem) return;

    const item = state.currentItem;
    const glowClass = state.streak >= 20 ? "is-glow-strong" : state.streak >= 10 ? "is-glow" : "";
    const enterClass = animationState === "enter" ? "is-entering" : "";
    const exitClass = animationState === "exit" ? "is-exiting" : "";

    main.innerHTML = `
      <div class="vt-word-scene">
        <div class="vt-instruction">${instructionText()}</div>
        <button class="vt-word-object ${skin.wordClass} ${enterClass} ${exitClass} ${glowClass} no-zoom" id="vtWordObject" type="button" aria-label="Current word caterpillar">
          ${renderItemSegments(item)}
        </button>
      </div>
    `;

    const wordObject = document.getElementById("vtWordObject");
    if (wordObject){
      wordObject.onclick = () => {
        if (selectedMode === "advanced" && item.kind !== "reference"){
          state.revealed = true;
          renderCurrentItem();
        }
      };
    }

    renderBadgesAndSparkles();

    if (animationState === "enter"){
      setTimeout(() => {
        state.acceptingInput = true;
        state.transitionLocked = false;
        renderCurrentItem();
      }, 560);
    }
  }

  function instructionText(){
    if (!state.currentItem) return "";
    if (state.currentItem.kind === "reference") return "Type the numbers. Skip the punctuation!";
    if (selectedMode === "advanced") return "Type the next word. Tap the caterpillar for a hint.";
    return "Type the caterpillar word.";
  }

  function renderItemSegments(item){
    if (item.kind === "reference"){
      const typedPositions = new Set(item.digitPositions.slice(0, state.typedIndex));
      return `
        <span class="vt-head ${state.headShakeUntil > performance.now() ? "is-no" : ""}">${faceHtml()}</span>
        <span class="vt-body vt-reference-body">
          ${item.chars.map((char, index) => {
            const isDigit = /\d/.test(char);
            const typed = typedPositions.has(index);
            const just = index === state.justTypedSegmentIndex;
            return `<span class="vt-segment ${isDigit ? "" : "is-fixed"} ${typed ? "is-typed" : ""} ${just ? "is-hop" : ""}">${escapeHtml(char)}</span>`;
          }).join("")}
        </span>
        <span class="vt-tail"></span>
      `;
    }

    const letters = item.expected.split("");
    const hideUntyped = selectedMode === "advanced" && !state.revealed;

    return `
      <span class="vt-head ${state.headShakeUntil > performance.now() ? "is-no" : ""}">${faceHtml()}</span>
      <span class="vt-body">
        ${letters.map((letter, index) => {
          const typed = index < state.typedIndex;
          const just = index === state.justTypedIndex;
          const visible = !hideUntyped || typed;
          return `<span class="vt-segment ${typed ? "is-typed" : ""} ${just ? "is-hop" : ""}">${visible ? escapeHtml(letter) : ""}</span>`;
        }).join("")}
      </span>
      <span class="vt-tail"></span>
    `;
  }

  function faceHtml(){
    return `
      <span class="vt-ant vt-ant-left"></span>
      <span class="vt-ant vt-ant-right"></span>
      <span class="vt-eye vt-eye-left"></span>
      <span class="vt-eye vt-eye-right"></span>
      <span class="vt-smile"></span>
    `;
  }

  function handleKey(rawKey){
    if (state.paused || state.transitionLocked || !state.acceptingInput || !state.currentItem) return;
    if (state.currentItem.kind === "reference" && !/^\d$/.test(rawKey)) return;
    if (state.currentItem.kind !== "reference" && !/^[A-Z]$/.test(rawKey)) return;

    const expected = state.currentItem.expected[state.typedIndex];
    if (!expected) return;

    if (rawKey === expected){
      handleCorrectKey(rawKey);
    } else {
      handleWrongKey(rawKey);
    }
  }

  function handleCorrectKey(key){
    playCorrectLetterSound();

    const item = state.currentItem;
    state.correctLetters += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.keyFlash = key;
    state.keyFlashBad = false;

    if (item.kind === "reference"){
      state.justTypedSegmentIndex = item.digitPositions[state.typedIndex];
      state.justTypedIndex = -1;
    } else {
      state.justTypedIndex = state.typedIndex;
      state.justTypedSegmentIndex = -1;
    }

    state.typedIndex += 1;

    if (state.streak > 0 && state.streak % 5 === 0){
      addStreakBadge(state.streak);
    }

    if (state.streak >= 10){
      addSparkles(state.streak >= 20 ? 9 : 5);
    }

    renderHud();
    renderKeyboard(item.kind === "reference" ? "numbers" : "letters");
    renderCurrentItem();

    setTimeout(() => {
      state.keyFlash = "";
      state.justTypedIndex = -1;
      state.justTypedSegmentIndex = -1;
      renderKeyboard(item.kind === "reference" ? "numbers" : "letters");
      renderCurrentItem();
    }, 260);

    if (state.typedIndex >= item.expected.length){
      state.acceptingInput = false;
      state.transitionLocked = true;
      playWordDoneSound();
      setTimeout(() => completeCurrentItem(), 420);
    }
  }

  function handleWrongKey(key){
    state.typos += 1;
    state.streak = 0;
    state.keyFlash = key;
    state.keyFlashBad = true;
    state.headShakeUntil = performance.now() + 420;

    playWrongSound();
    renderHud();
    renderKeyboard(state.currentItem.kind === "reference" ? "numbers" : "letters");
    renderCurrentItem();

    setTimeout(() => {
      state.keyFlash = "";
      state.headShakeUntil = 0;
      renderKeyboard(state.currentItem?.kind === "reference" ? "numbers" : "letters");
      renderCurrentItem();
    }, 430);
  }

  function completeCurrentItem(){
    renderCurrentItem("exit");

    setTimeout(() => {
      const item = state.currentItem;
      if (!item) return;

      if (item.kind === "word"){
        startChunkWord(state.currentChunkIndex, state.currentWordIndex + 1);
        return;
      }

      if (item.kind === "book"){
        startBookWord(state.currentWordIndex + 1);
        return;
      }

      if (item.kind === "reference"){
        finishRun();
      }
    }, 620);
  }

  async function startChunkReview(chunkIndex){
    const chunk = state.chunks[chunkIndex];
    if (!chunk){
      startBookPhase();
      return;
    }

    state.acceptingInput = false;
    state.transitionLocked = true;
    setPhaseLabel(`Listen ${chunkIndex + 1}/${state.chunks.length}`);
    renderKeyboard("letters");

    const main = document.getElementById("vtMain");
    if (main){
      main.innerHTML = `
        <div class="vt-review-scene">
          <div class="vt-review-label">Great typing!</div>
          <div class="vt-review-card">
            <div class="vt-review-text">${escapeHtml(chunk.text)}</div>
          </div>
          <div class="vt-review-note">Listen to this chunk.</div>
        </div>
      `;
    }

    await sleep(260);
    await playChunkAudio(chunk.audioFile);
    await sleep(420);

    startChunkWord(chunkIndex + 1, 0);
  }

  function stopAllAudio(){
    clearSleeps();
    if (chunkAudio){
      try { chunkAudio.pause(); } catch(err){}
      chunkAudio = null;
    }
  }

  function playChunkAudio(file){
    if (!file) return sleep(900);

    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      try {
        chunkAudio = new Audio(file);
        chunkAudio.preload = "auto";
        chunkAudio.muted = muted;
        chunkAudio.onended = finish;
        chunkAudio.onerror = () => {
          console.warn("Verse Typer chunk audio missing", file);
          finish();
        };

        const playPromise = chunkAudio.play();
        if (playPromise?.catch){
          playPromise.catch(err => {
            console.warn("Verse Typer chunk audio could not play", file, err);
            finish();
          });
        }

        setTimeout(finish, 8000);
      } catch(err){
        console.warn("Verse Typer chunk audio failed", file, err);
        finish();
      }
    });
  }

  function addStreakBadge(streak){
    const id = `badge-${Date.now()}-${Math.random()}`;
    state.badges.push({ id, text: `${streak} streak!` });
    renderBadgesAndSparkles();
    setTimeout(() => {
      state.badges = state.badges.filter(item => item.id !== id);
      renderBadgesAndSparkles();
    }, 950);
  }

  function addSparkles(count){
    for (let i = 0; i < count; i += 1){
      const id = `spark-${Date.now()}-${Math.random()}-${i}`;
      state.sparkles.push({
        id,
        left: 22 + Math.random() * 56,
        top: 26 + Math.random() * 42,
        dx: (Math.random() * 90 - 45).toFixed(1) + "px",
        dy: (-28 - Math.random() * 52).toFixed(1) + "px",
        delay: Math.random() * 80
      });
      setTimeout(() => {
        state.sparkles = state.sparkles.filter(item => item.id !== id);
        renderBadgesAndSparkles();
      }, 780);
    }
    renderBadgesAndSparkles();
  }

  function renderBadgesAndSparkles(){
    const badgeLayer = document.getElementById("vtBadgeLayer");
    const sparkleLayer = document.getElementById("vtSparkleLayer");

    if (badgeLayer){
      badgeLayer.innerHTML = state.badges.map(badge => `
        <div class="vt-streak-badge">${escapeHtml(badge.text)} ✨</div>
      `).join("");
    }

    if (sparkleLayer){
      sparkleLayer.innerHTML = state.sparkles.map(spark => `
        <span class="vt-sparkle" style="left:${spark.left}%;top:${spark.top}%;--vt-dx:${spark.dx};--vt-dy:${spark.dy};animation-delay:${spark.delay}ms">✦</span>
      `).join("");
    }
  }

  function correctPercentage(){
    const total = state.correctLetters + state.typos;
    if (!total) return 100;
    return Math.round((state.correctLetters / total) * 100);
  }

  async function finishRun(){
    if (state.completed) return;
    state.completed = true;
    stopAllAudio();

    try {
      window.VerseGameBridge.markVersePracticed?.({ verseId: ctx.verseId });
    } catch(err){}

    await sleep(260);
    renderEnd();
  }

  function renderEnd(){
    state.screen = "end";
    clearSleeps();
    const pct = correctPercentage();

    window.VerseGameShell.renderCompleteScreen({
      app,
      title: "Verse Typed!",
      icon: "🐛",
      statsHtml: `Correct typing: ${pct}%<br>Best streak: ${state.bestStreak}`,
      playAgainText: "Play Again",
      moreGamesText: "More Playground",
      backLabel: "Back to Verse Playground",
      theme: GAME_THEME,
      onPlayAgain: () => setScreen("mode"),
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function helpHtml(){
    return `
      Type each caterpillar word with the letter keyboard.<br><br>
      Beginner shows the letters. Advanced hides the letters, but you can tap the caterpillar for a hint.<br><br>
      After each verse chunk, the chunk appears on screen while its audio plays. Then the next caterpillar comes in.<br><br>
      Wrong letters make the caterpillar say “no,” but this is a playground — just keep typing!
    `;
  }

  function setScreen(screen){
    state.screen = screen;
    if (screen !== "game"){
      stopAllAudio();
      clearSleeps();
    }
    if (screen === "intro") renderIntro();
    if (screen === "mode") renderMode();
  }

  document.addEventListener("pointerdown", () => unlockAudio(), { capture: true, passive: true });
  setScreen("intro");
})();
