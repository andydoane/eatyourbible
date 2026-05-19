(async function(){
  "use strict";

  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const shell = () => window.VerseGameShell || {};
  const bridge = () => window.VerseGameBridge || {};
  const ctx = await bridge().getVerseContext?.() || {
    verseId: "",
    verseText: "",
    verseRef: "",
    translation: "",
    attribution: ""
  };

  const GAME_ID = "wheel_of_bible";
  const GAME_TITLE = "Wheel of Bible";
  const GAME_ICON = "🎡";
  const HELP_OVERLAY_ID = "wheelOfBibleHelpOverlay";
  const MENU_OVERLAY_ID = "wheelOfBibleGameMenuOverlay";

  const GAME_THEME = {
    bg: "#ffc751",
    accent: "#7f4b00",
    helpTitleBg: "#ffc751",
    helpTitleColor: "#332818",
    helpCloseBg: "#ff5a51",
    helpCloseColor: "#ffffff"
  };

  const SILENCE_AUDIO_FILE = "../../verse_audio/silence.mp3";
  const WEB_AUDIO_MASTER_VOLUME = 0.82;

  const WORD_COLORS = [
    "#ffc751",
    "#a7cb6f",
    "#40b9c5",
    "#ff9e3d",
    "#bda0ff",
    "#ff8fb9",
    "#8fd7ff",
    "#ffe382"
  ];

  const WHEEL_VALUES = [
    { kind: "cash", label: "$100", value: 100 },
    { kind: "cash", label: "$200", value: 200 },
    { kind: "cash", label: "$300", value: 300 },
    { kind: "cash", label: "$400", value: 400 },
    { kind: "cash", label: "$500", value: 500 },
    { kind: "cash", label: "$600", value: 600 },
    { kind: "cash", label: "$700", value: 700 },
    { kind: "cash", label: "$800", value: 800 },
    { kind: "cash", label: "$900", value: 900 },
    { kind: "cash", label: "$1000", value: 1000 },
    { kind: "prize", label: "PRIZE" },
    { kind: "prize", label: "PRIZE" }
  ];

  const PRIZES = [
    { emoji: "🎁", name: "Surprise Box", value: 1200 },
    { emoji: "🛴", name: "Scooter", value: 1400 },
    { emoji: "🎮", name: "Game Prize", value: 1500 },
    { emoji: "🚲", name: "Bike", value: 1800 },
    { emoji: "🏰", name: "Castle Trip", value: 2000 },
    { emoji: "🚀", name: "Rocket Ride", value: 2200 },
    { emoji: "🦖", name: "Dino Dig", value: 2500 },
    { emoji: "🏆", name: "Golden Trophy", value: 3000 }
  ];

  let muted = false;
  let audioCtx = null;
  let masterGain = null;
  let htmlAudioPrimed = false;
  let htmlAudioPrimePromise = null;
  let audioUnlocked = false;
  let audioUnlockPromise = null;
  let verseAudioEl = null;
  let sleepIds = [];
  let finalTimerId = null;
  let currentFitRaf = 0;

  const state = {
    screen: "intro",
    verseJson: null,
    verseText: ctx.verseText || "",
    verseRef: ctx.verseRef || "",
    translation: ctx.translation || "",
    tokens: [],
    words: [],
    uniqueLetters: [],
    keywordSet: new Set(),
    usedLetters: new Set(),
    challengeHistory: new Map(),
    selectedSpin: null,
    lastSelectedLetter: "",
    baseCash: 0,
    prizeCash: 0,
    finalCash: 0,
    prizeEarnings: [],
    currentChallenge: null,
    challengeInputIndex: 0,
    challengeFlash: "",
    challengeBad: false,
    readingLocked: false,
    readWaitMs: 5000,
    finalStartedAt: 0,
    finalTimeLeft: 60,
    finalSolvedWordIndices: new Set(),
    finalActiveWord: null,
    finalInputIndex: 0,
    finalLetterStreak: 0,
    finalFlash: "",
    finalBad: false,
    completed: false
  };

  function escapeHtml(value){
    if (shell().escapeHtml) return shell().escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max){
    if (shell().clamp) return shell().clamp(value, min, max);
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  const sleep = (ms) => new Promise(resolve => {
    const id = setTimeout(() => {
      sleepIds = sleepIds.filter(item => item !== id);
      resolve();
    }, Math.max(0, Number(ms) || 0));
    sleepIds.push(id);
  });

  function clearSleeps(){
    sleepIds.forEach(id => clearTimeout(id));
    sleepIds = [];
  }

  function clearTimers(){
    clearSleeps();
    if (finalTimerId){
      clearInterval(finalTimerId);
      finalTimerId = null;
    }
    if (currentFitRaf){
      cancelAnimationFrame(currentFitRaf);
      currentFitRaf = 0;
    }
  }

  function formatMoney(value){
    return `$${Math.max(0, Math.round(Number(value) || 0)).toLocaleString()}`;
  }

  function totalCash(){
    return state.baseCash + state.prizeCash + state.finalCash;
  }

  function normalizeLetters(value){
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function normalizeWord(value){
    if (shell().normalizeWord) return shell().normalizeWord(value);
    return String(value ?? "")
      .trim()
      .replace(/[‘’]/g, "'")
      .toLowerCase()
      .replace(/^[^a-z0-9]+/gi, "")
      .replace(/[^a-z0-9]+$/gi, "")
      .replace(/[^a-z0-9']/gi, "");
  }

  function tokenizeVerse(text){
    const raw = String(text || "").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—−]/g,"-");
    const tokens = [];
    const re = /(\s+|[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+(?:,[0-9]{3})*|[^\sA-Za-z0-9]+)/g;
    let wordIndex = 0;

    for (const part of raw.match(re) || []){
      if (/^\s+$/.test(part)){
        tokens.push({ kind:"space", text:part });
      } else if (/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(part)){
        tokens.push({ kind:"word", text:part, wordIndex });
        wordIndex += 1;
      } else if (/^[0-9]+(?:,[0-9]{3})*$/.test(part)){
        tokens.push({ kind:"word", text:part, wordIndex, numeric:true });
        wordIndex += 1;
      } else {
        tokens.push({ kind:"punct", text:part });
      }
    }

    return tokens;
  }

  function extractKeywords(json){
    const raw = [];
    const add = (value) => {
      if (!value) return;
      if (Array.isArray(value)) raw.push(...value);
      else if (typeof value === "string") raw.push(...value.split(/[;,]/g));
    };

    add(json?.keywords);
    add(json?.keyWords);
    add(json?.keywordWords);
    add(json?.memoryKeywords);
    add(json?.verseKeywords);

    const out = new Set();
    for (const item of raw){
      const text = String(item || "").trim();
      if (!text) continue;
      for (const part of text.split(/\s+/g)){
        const norm = normalizeWord(part);
        if (norm) out.add(norm);
      }
      const phraseNorm = normalizeWord(text);
      if (phraseNorm) out.add(phraseNorm);
    }
    return out;
  }

  function buildVerseModel(){
    state.tokens = tokenizeVerse(state.verseText);
    state.words = [];

    for (const token of state.tokens){
      if (token.kind !== "word") continue;
      const display = token.text;
      const clean = normalizeWord(display);
      const letters = Array.from(display).map((char, index) => ({
        char,
        index,
        normalized: normalizeLetters(char),
        isLetter: /^[A-Za-z]$/.test(char)
      }));

      state.words.push({
        index: token.wordIndex,
        display,
        clean,
        letters,
        color: WORD_COLORS[token.wordIndex % WORD_COLORS.length],
        isKeyword: state.keywordSet.has(clean)
      });
    }

    const unique = new Set();
    for (const word of state.words){
      for (const letter of word.letters){
        if (letter.isLetter && letter.normalized) unique.add(letter.normalized);
      }
    }
    state.uniqueLetters = Array.from(unique).sort();
  }

  async function loadVerseJson(){
    if (state.verseJson) return state.verseJson;
    const verseId = ctx.verseId || bridge().getLaunchParams?.()?.verseId || "";
    if (!verseId) return null;

    try {
      const res = await fetch(`../../verse_data/${verseId}.json`, { cache:"no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.verseJson = await res.json();
      state.verseText = state.verseJson.verseText || state.verseText;
      state.translation = state.verseJson.translation || state.translation;
      state.keywordSet = extractKeywords(state.verseJson);
      return state.verseJson;
    } catch (err){
      console.warn("Wheel of Bible could not load full verse JSON", err);
      state.keywordSet = new Set();
      return null;
    }
  }

  function getVerseAudioCandidates(){
    const json = state.verseJson || {};
    const candidates = [];
    const add = (src) => {
      const clean = String(src || "").trim();
      if (!clean) return;
      if (/^https?:\/\//i.test(clean) || clean.startsWith("../")) candidates.push(clean);
      else if (clean.startsWith("verse_audio/")) candidates.push(`../../${clean}`);
      else candidates.push(`../../verse_audio/${clean}`);
    };

    add(json.audioFile);
    add(json.audio);
    add(json.verseAudio);
    add(json.audioSrc);
    if (ctx.verseId) add(`${ctx.verseId}.mp3`);
    return Array.from(new Set(candidates));
  }

  function createVerseAudioElement(){
    if (verseAudioEl) return verseAudioEl;
    verseAudioEl = document.createElement("audio");
    verseAudioEl.preload = "auto";
    verseAudioEl.playsInline = true;
    verseAudioEl.setAttribute("playsinline", "");
    verseAudioEl.style.display = "none";
    document.body.appendChild(verseAudioEl);
    return verseAudioEl;
  }

  function audioContextConstructor(){
    return window.AudioContext || window.webkitAudioContext;
  }

  function createAudio(){
    if (audioCtx){
      if (masterGain) masterGain.gain.value = muted ? 0 : WEB_AUDIO_MASTER_VOLUME;
      return;
    }
    const AudioCtor = audioContextConstructor();
    if (!AudioCtor) return;
    audioCtx = new AudioCtor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : WEB_AUDIO_MASTER_VOLUME;
    masterGain.connect(audioCtx.destination);
  }

  function primeHtmlAudio(){
    if (htmlAudioPrimed) return Promise.resolve(true);
    if (htmlAudioPrimePromise) return htmlAudioPrimePromise;

    const audio = createVerseAudioElement();
    htmlAudioPrimePromise = new Promise(resolve => {
      let done = false;
      let fallbackId = null;
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        audio.oncanplay = null;
        audio.oncanplaythrough = null;
        if (fallbackId) clearTimeout(fallbackId);
      };
      const finish = (ok) => {
        if (done) return;
        done = true;
        cleanup();
        htmlAudioPrimed = !!ok;
        htmlAudioPrimePromise = null;
        resolve(!!ok);
      };
      const tryPlay = () => {
        const p = audio.play();
        if (p?.then){
          p.then(() => {}).catch(() => finish(false));
        }
      };
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = 0.01;
        audio.src = SILENCE_AUDIO_FILE;
        audio.load();
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        if (audio.readyState >= 3) tryPlay();
        else {
          audio.oncanplay = tryPlay;
          audio.oncanplaythrough = tryPlay;
        }
        fallbackId = setTimeout(() => finish(false), 1800);
      } catch (err){
        finish(false);
      }
    });
    return htmlAudioPrimePromise;
  }

  async function unlockAudio(){
    createAudio();
    createVerseAudioElement();
    if (!audioCtx || !masterGain) return false;
    if (audioUnlocked && audioCtx.state === "running") return true;
    if (audioUnlockPromise) return audioUnlockPromise;

    audioUnlockPromise = (async () => {
      try {
        if (audioCtx.state !== "running"){
          try { await audioCtx.resume?.(); } catch(err){}
        }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.0001, now);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
        audioUnlocked = audioCtx.state === "running";
        return audioUnlocked;
      } catch(err){
        console.warn("Wheel of Bible audio unlock failed", err);
        audioUnlocked = false;
        return false;
      } finally {
        audioUnlockPromise = null;
      }
    })();
    return audioUnlockPromise;
  }

  function midiToFreq(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }

  function playTone({ midi = 60, duration = 0.12, volume = 0.18, type = "triangle" } = {}){
    if (muted) return;
    createAudio();
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state !== "running"){
      unlockAudio().then(ok => { if (ok) playTone({ midi, duration, volume, type }); });
      return;
    }
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

  function playBeep(index = 0){ playTone({ midi: 67 + (index % 3) * 4, duration:.10, volume:.24 }); }
  function playGood(){ playTone({ midi:72, duration:.10, volume:.28 }); setTimeout(() => playTone({ midi:79, duration:.14, volume:.22 }), 70); }
  function playBad(){ playTone({ midi:43, duration:.13, volume:.32, type:"sine" }); setTimeout(() => playTone({ midi:38, duration:.12, volume:.24, type:"sine" }), 58); }
  function playPop(i = 0){ playTone({ midi:64 + (i % 5) * 2, duration:.08, volume:.18 }); }
  function playPrize(){ playTone({ midi:72, duration:.10, volume:.25 }); setTimeout(() => playTone({ midi:76, duration:.10, volume:.24 }),70); setTimeout(() => playTone({ midi:84, duration:.18, volume:.28 }),145); }

  function stopVerseAudio(){
    if (!verseAudioEl) return;
    try { verseAudioEl.pause(); verseAudioEl.currentTime = 0; } catch(err){}
  }

  async function tryPlayVerseAudio(){
    const audio = createVerseAudioElement();
    audio.muted = muted;
    audio.volume = muted ? 0 : 1;

    const candidates = getVerseAudioCandidates();
    for (const src of candidates){
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = src;
        audio.load();
        await new Promise(resolve => {
          let done = false;
          const finish = () => { if (done) return; done = true; cleanup(); resolve(); };
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", finish);
            audio.removeEventListener("canplay", finish);
            audio.removeEventListener("error", finish);
          };
          audio.addEventListener("loadedmetadata", finish);
          audio.addEventListener("canplay", finish);
          audio.addEventListener("error", finish);
          setTimeout(finish, 1100);
        });
        await audio.play();
        return true;
      } catch (err){
        // Try the next likely filename.
      }
    }
    return false;
  }

  function estimateReadMs(){
    const wordCount = state.words.length || String(state.verseText || "").split(/\s+/).filter(Boolean).length;
    const audioDuration = Number(verseAudioEl?.duration);
    if (Number.isFinite(audioDuration) && audioDuration > 1){
      return clamp(audioDuration * 1000, 3500, 30000);
    }
    return clamp(wordCount * 620, 3500, 18000);
  }

  function helpHtml(){
    return `
      <ul class="wob-help-list">
        <li>Spin the wheel to get a dollar amount or a prize.</li>
        <li>Pick a letter from today's verse. Every matching letter disappears and earns money.</li>
        <li>Read the verse, then tap the wiggling word and fill in its missing letters.</li>
        <li>When every letter is gone, race through the Final Round and rebuild as many words as you can.</li>
      </ul>
    `;
  }

  function rootHtml(inner, { status = "", rootClass = "" } = {}){
    return `
      <div class="wob-root ${escapeHtml(rootClass)}">
        <div class="wob-stage">
          <div class="wob-topbar">
            <button class="wob-pill wob-menu-pill no-zoom" id="wobMenuPill" type="button" aria-label="Open game menu">☰</button>
            <div class="wob-pill wob-status-pill" id="wobStatusPill">${escapeHtml(status || "Wheel of Bible")}</div>
            <div class="wob-pill wob-money-pill" id="wobMoneyPill">${escapeHtml(formatMoney(totalCash()))}</div>
          </div>
          <div class="wob-card">
            <div class="wob-main" id="wobMain">${inner}</div>
          </div>
          ${renderHelpOverlay()}
          ${renderGameMenuOverlay()}
        </div>
      </div>
    `;
  }

  function renderHelpOverlay(){
    return shell().helpOverlayHtml ? shell().helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body: helpHtml()
    }) : "";
  }

  function renderGameMenuOverlay(){
    return shell().gameMenuHtml ? shell().gameMenuHtml({
      id: MENU_OVERLAY_ID,
      title: "Wheel of Bible Menu",
      muted,
      showModeSelect: false,
      exitText: "Exit Playground"
    }) : "";
  }

  function wireGameMenu(){
    if (!shell().wireGameMenu) return;
    shell().wireGameMenu({
      id: MENU_OVERLAY_ID,
      menuButtonId: "wobMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        muted = !muted;
        if (masterGain && audioCtx){
          masterGain.gain.setValueAtTime(muted ? 0 : WEB_AUDIO_MASTER_VOLUME, audioCtx.currentTime);
        }
        if (verseAudioEl) verseAudioEl.muted = muted;
        return muted;
      },
      onHowToPlay: () => {
        document.getElementById(MENU_OVERLAY_ID)?.classList.remove("is-open");
        shell().openHelp?.(HELP_OVERLAY_ID, "back", "Back");
      },
      onExit: () => {
        stopVerseAudio();
        clearTimers();
        bridge().exitGame?.();
      }
    });
  }

  function updateHud(status = ""){
    const money = document.getElementById("wobMoneyPill");
    const pill = document.getElementById("wobStatusPill");
    if (money) money.textContent = formatMoney(totalCash());
    if (pill && status) pill.textContent = status;
  }

  function renderIntro(){
    clearTimers();
    stopVerseAudio();
    state.screen = "intro";
    shell().renderTitleScreen?.({
      app,
      title: GAME_TITLE,
      icon: GAME_ICON,
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      startText: "Start",
      helpText: "How to Play",
      theme: GAME_THEME,
      backLabel: "Back to Verse Playground",
      onBack: () => bridge().exitGame?.(),
      onStart: async () => {
        createVerseAudioElement();
        primeHtmlAudio();
        unlockAudio();
        await beginRun();
      }
    });
  }

  async function beginRun(){
    clearTimers();
    await loadVerseJson();
    buildVerseModel();
    resetRunState();
    await playIntroSequence();
  }

  function resetRunState(){
    state.usedLetters = new Set();
    state.challengeHistory = new Map();
    state.selectedSpin = null;
    state.lastSelectedLetter = "";
    state.baseCash = 0;
    state.prizeCash = 0;
    state.finalCash = 0;
    state.prizeEarnings = [];
    state.currentChallenge = null;
    state.challengeInputIndex = 0;
    state.finalSolvedWordIndices = new Set();
    state.finalActiveWord = null;
    state.finalInputIndex = 0;
    state.finalLetterStreak = 0;
    state.completed = false;
  }

  async function playIntroSequence(){
    state.screen = "introSequence";
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-intro-wheel-wrap">
          <div class="wob-wheel-shell">
            <div class="wob-wheel-pointer"></div>
            <div class="wob-wheel" id="introWheel"></div>
          </div>
        </div>
        <div class="wob-intro-words">
          <span class="wob-intro-word" id="introWord0">WHEEL</span>
          <span class="wob-intro-word" id="introWord1">OF</span>
          <span class="wob-intro-word" id="introWord2">BIBLE!</span>
        </div>
      </div>
    `, { status:"Get Ready" });
    wireGameMenu();
    const wheel = document.getElementById("introWheel");
    if (wheel) wheel.style.setProperty("--spin-deg", "1080deg");
    for (let i = 0; i < 3; i += 1){
      await sleep(420);
      document.getElementById(`introWord${i}`)?.classList.add("is-in");
      playBeep(i);
    }
    await sleep(320);
    playPrize();
    await sleep(900);
    renderMeetVerse();
  }

  function renderMeetVerse(){
    state.screen = "meetVerse";
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-big-title">Let’s meet today’s verse!</div>
        <button class="wob-btn no-zoom" id="meetVerseBtn" type="button">Meet the Verse</button>
      </div>
    `, { status:"Today's Verse" });
    wireGameMenu();
    document.getElementById("meetVerseBtn")?.addEventListener("click", async () => {
      await unlockAudio();
      await playVerseIntro();
    });
  }

  async function playVerseIntro(){
    state.screen = "verseIntro";
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ allVisible:true })}
        <div class="wob-reference">${escapeHtml(referenceLine())}</div>
        <button class="wob-btn no-zoom" id="skipVerseAudioBtn" type="button">Continue</button>
      </div>
    `, { status:"Listen" });
    wireGameMenu();
    fitVerseBoardSoon();

    let continued = false;
    const continueNow = () => {
      if (continued) return;
      continued = true;
      stopVerseAudio();
      renderSpinScreen();
    };
    document.getElementById("skipVerseAudioBtn")?.addEventListener("click", continueNow);

    const played = await tryPlayVerseAudio();
    const waitMs = played ? estimateReadMs() + 450 : 1800;
    await sleep(waitMs);
    continueNow();
  }

  function referenceLine(){
    return [state.verseRef || "", state.translation || ""].filter(Boolean).join(" • ");
  }

  function wheelLabelsHtml(){
    const step = 360 / WHEEL_VALUES.length;
    return WHEEL_VALUES.map((seg, index) => {
      const angle = index * step + step / 2;
      return `<div class="wob-wheel-label" style="transform:rotate(${angle}deg) translateX(-2%);">${escapeHtml(seg.label)}</div>`;
    }).join("");
  }

  function renderSpinScreen(){
    clearTimers();
    state.screen = "spin";
    if (state.uniqueLetters.length && state.usedLetters.size >= state.uniqueLetters.length){
      renderFinalIntro();
      return;
    }
    state.selectedSpin = null;
    app.innerHTML = rootHtml(`
      <div class="wob-panel wob-spin-layout">
        <div class="wob-big-title">Spin the Wheel!</div>
        <div class="wob-wheel-shell">
          <div class="wob-wheel-pointer"></div>
          <div class="wob-wheel" id="gameWheel"><div class="wob-wheel-segments">${wheelLabelsHtml()}</div></div>
        </div>
        <button class="wob-btn no-zoom" id="spinBtn" type="button">Spin</button>
      </div>
    `, { status:"Spin" });
    wireGameMenu();
    document.getElementById("spinBtn")?.addEventListener("click", spinWheel);
  }

  async function spinWheel(){
    const btn = document.getElementById("spinBtn");
    if (btn) btn.disabled = true;
    await unlockAudio();

    const index = Math.floor(Math.random() * WHEEL_VALUES.length);
    const step = 360 / WHEEL_VALUES.length;
    const degrees = 360 * 5 + (360 - (index * step + step / 2));
    const wheel = document.getElementById("gameWheel");
    if (wheel) wheel.style.setProperty("--spin-deg", `${degrees}deg`);

    for (let i = 0; i < 22; i += 1){
      setTimeout(() => playTone({ midi: 50 + (i % 3) * 3, duration:.045, volume:.12, type:"square" }), i * 95);
    }

    await sleep(3300);
    const raw = WHEEL_VALUES[index];
    let result = { ...raw };
    if (raw.kind === "prize"){
      const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      result = { kind:"prize", label:"PRIZE", value: prize.value, prize };
      playPrize();
    } else {
      playGood();
    }
    state.selectedSpin = result;
    renderSpinResult(result);
  }

  async function renderSpinResult(result){
    const main = document.getElementById("wobMain");
    if (!main) return;
    const prizeMarkup = result.kind === "prize"
      ? `<div class="wob-spin-result-value wob-prize-pop">🎁</div><div class="wob-spin-result-title">${escapeHtml(result.prize.emoji)} ${escapeHtml(result.prize.name)}</div><div class="wob-spin-result-value">${escapeHtml(formatMoney(result.value))}</div>`
      : `<div class="wob-spin-result-title">You spun</div><div class="wob-spin-result-value">${escapeHtml(formatMoney(result.value))}</div>`;

    main.innerHTML = `
      <div class="wob-panel">
        <div class="wob-spin-result-card">${prizeMarkup}</div>
        <button class="wob-btn no-zoom" id="chooseLetterBtn" type="button">Choose a Letter</button>
      </div>
    `;
    document.getElementById("chooseLetterBtn")?.addEventListener("click", renderSelectLetterScreen);
  }

  function renderSelectLetterScreen(){
    state.screen = "selectLetter";
    const spinLabel = state.selectedSpin?.kind === "prize"
      ? `${state.selectedSpin.prize.emoji} ${state.selectedSpin.prize.name}: ${formatMoney(state.selectedSpin.value)} per letter`
      : `${formatMoney(state.selectedSpin?.value || 0)} per letter`;

    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-subtitle">Spin Result: ${escapeHtml(spinLabel)}</div>
        <div class="wob-letter-grid">
          ${state.uniqueLetters.map(letter => {
            const used = state.usedLetters.has(letter);
            return `<button class="wob-letter-choice no-zoom ${used ? "is-used" : ""}" data-letter="${escapeHtml(letter)}" type="button" ${used ? "disabled" : ""}>${escapeHtml(letter)}</button>`;
          }).join("")}
        </div>
      </div>
    `, { status:"Choose Letter" });
    wireGameMenu();
    document.querySelectorAll("[data-letter]").forEach(btn => {
      btn.addEventListener("click", () => handleLetterChoice(btn.dataset.letter || ""));
    });
  }

  function countVisibleLetter(letter){
    let count = 0;
    for (const word of state.words){
      for (const item of word.letters){
        if (item.isLetter && item.normalized === letter && !state.usedLetters.has(item.normalized)) count += 1;
      }
    }
    return count;
  }

  async function handleLetterChoice(letter){
    const selected = normalizeLetters(letter).charAt(0);
    if (!selected || state.usedLetters.has(selected)) return;
    await unlockAudio();

    const matches = countVisibleLetter(selected);
    state.lastSelectedLetter = selected;
    state.usedLetters.add(selected);

    const value = Math.max(0, Number(state.selectedSpin?.value) || 0);
    const earnings = value * matches;
    if (state.selectedSpin?.kind === "prize"){
      state.prizeCash += earnings;
      state.prizeEarnings.push({
        ...state.selectedSpin.prize,
        perLetter: value,
        matches,
        total: earnings,
        letter: selected
      });
    } else {
      state.baseCash += earnings;
    }

    await renderLetterRemoval({ letter:selected, matches, earnings, perLetter:value });
  }

  async function renderLetterRemoval({ letter, matches, earnings, perLetter }){
    state.screen = "removeLetter";
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ removingLetter:letter })}
        <div class="wob-reference">${escapeHtml(`${matches} ${letter}'s vanished • ${formatMoney(perLetter)} each`)}</div>
        <div class="wob-letter-burst">${escapeHtml(letter)}</div>
      </div>
    `, { status:"Letters Vanish" });
    wireGameMenu();
    fitVerseBoardSoon();
    playPop(0);

    const pops = Math.min(matches, 18);
    for (let i = 0; i < pops; i += 1){
      setTimeout(() => {
        playPop(i);
        showFloatingMoney(formatMoney(perLetter));
      }, 560 + i * 95);
    }
    await sleep(1250 + pops * 95);
    updateHud();
    await renderSayVersePhase();
  }

  function showFloatingMoney(text){
    const card = document.querySelector(".wob-card");
    if (!card) return;
    const el = document.createElement("div");
    el.className = "wob-floating-money";
    el.textContent = text;
    card.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  async function renderSayVersePhase(){
    state.screen = "sayVerse";
    const readMs = estimateReadMs();
    state.readWaitMs = readMs;
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({})}
        <div class="wob-reference">${escapeHtml(referenceLine())}</div>
        <div class="wob-overlay-card">
          <div class="wob-overlay-title">Say the Verse</div>
          <div class="wob-overlay-sub">Read it together. Then find the wiggling word.</div>
          <div class="wob-read-progress" style="--read-ms:${Math.round(readMs)}ms"><span></span></div>
        </div>
      </div>
    `, { status:"Say the Verse" });
    wireGameMenu();
    fitVerseBoardSoon();
    await sleep(readMs);
    if (state.screen !== "sayVerse") return;
    const challenge = chooseChallengeWord();
    if (!challenge){
      if (state.uniqueLetters.length && state.usedLetters.size >= state.uniqueLetters.length) renderFinalIntro();
      else renderSpinScreen();
      return;
    }
    renderWigglingVerse(challenge);
  }

  function hiddenCountForWord(word){
    return word.letters.filter(item => item.isLetter && state.usedLetters.has(item.normalized)).length;
  }

  function visibleCountForWord(word){
    return word.letters.filter(item => item.isLetter && !state.usedLetters.has(item.normalized)).length;
  }

  function chooseChallengeWord(){
    const candidates = state.words.filter(word => {
      const alphaCount = word.letters.filter(item => item.isLetter).length;
      const hiddenCount = hiddenCountForWord(word);
      const visibleCount = visibleCountForWord(word);
      if (alphaCount < 3) return false;
      if (hiddenCount < 1) return false;
      if (visibleCount < 1) return false;
      const last = state.challengeHistory.get(word.index) || 0;
      if (hiddenCount <= last) return false;
      return true;
    });

    if (!candidates.length) return null;
    candidates.sort((a,b) => {
      const aKey = a.isKeyword ? 1 : 0;
      const bKey = b.isKeyword ? 1 : 0;
      if (bKey !== aKey) return bKey - aKey;
      const aHidden = hiddenCountForWord(a);
      const bHidden = hiddenCountForWord(b);
      if (bHidden !== aHidden) return bHidden - aHidden;
      return b.display.length - a.display.length;
    });

    const pool = candidates.slice(0, Math.min(4, candidates.length));
    const word = pool[Math.floor(Math.random() * pool.length)];
    return makeWordChallenge(word);
  }

  function makeWordChallenge(word){
    const missing = [];
    word.letters.forEach((item, index) => {
      if (item.isLetter && state.usedLetters.has(item.normalized)){
        missing.push({ index, letter:item.normalized, original:item.char });
      }
    });
    if (!missing.length) return null;
    return {
      wordIndex: word.index,
      word,
      missing,
      expected: missing.map(item => item.letter),
      kind: word.isKeyword ? "keyword" : "word"
    };
  }

  function renderWigglingVerse(challenge){
    state.screen = "findWord";
    state.currentChallenge = challenge;
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ challengeWordIndex:challenge.wordIndex })}
        <div class="wob-reference">Find the wiggling word!</div>
      </div>
    `, { status:"Find Word" });
    wireGameMenu();
    fitVerseBoardSoon();
    document.querySelector(`[data-word-index="${challenge.wordIndex}"]`)?.addEventListener("click", () => renderWordChallenge(challenge));
  }

  function makeChoiceLetters(correctLetters, sourceLetters, targetCount = 9){
    const out = [];
    const seen = new Set();
    for (const letter of correctLetters){
      if (!letter || seen.has(letter)) continue;
      out.push(letter);
      seen.add(letter);
    }
    const decoys = (sourceLetters || state.uniqueLetters).filter(letter => letter && !seen.has(letter));
    shuffle(decoys);
    for (const letter of decoys){
      if (out.length >= targetCount) break;
      out.push(letter);
      seen.add(letter);
    }
    while (out.length < Math.min(targetCount, 9)){
      const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
      if (!seen.has(letter)){
        out.push(letter);
        seen.add(letter);
      }
    }
    return shuffle(out);
  }

  function shuffle(items){
    const copy = Array.isArray(items) ? items.slice() : [];
    for (let i = copy.length - 1; i > 0; i -= 1){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderWordChallenge(challenge = state.currentChallenge){
    if (!challenge) return renderSpinScreen();
    state.screen = "wordChallenge";
    state.currentChallenge = challenge;
    state.challengeInputIndex = 0;
    state.challengeFlash = "";
    state.challengeBad = false;
    const choices = makeChoiceLetters(challenge.expected, state.uniqueLetters, 9);
    state.currentChallenge.choices = choices;
    drawWordChallenge();
  }

  function drawWordChallenge(){
    const challenge = state.currentChallenge;
    const bonusLabel = challenge.kind === "keyword" ? "Key Word Challenge" : "Word Challenge";
    app.innerHTML = rootHtml(`
      <div class="wob-word-challenge-root">
        <div class="wob-big-title">${escapeHtml(bonusLabel)}</div>
        ${challengeWordHtml(challenge, state.challengeInputIndex)}
        <div class="wob-choice-grid">
          ${challenge.choices.map(letter => `<button class="wob-choice-tile no-zoom ${state.challengeFlash === letter ? (state.challengeBad ? "is-bad" : "is-good") : ""}" data-choice="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`).join("")}
        </div>
        <div class="wob-bonus-line">Fill the missing letters in order</div>
      </div>
    `, { status:"Word Challenge" });
    wireGameMenu();
    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", () => handleChallengeChoice(btn.dataset.choice || ""));
    });
  }

  function challengeWordHtml(challenge, filledCount, { allBlank = false, noClass = false } = {}){
    const expectedByIndex = new Map();
    challenge.missing.forEach((item, missIndex) => expectedByIndex.set(item.index, missIndex));
    return `
      <div class="wob-challenge-word ${noClass ? "is-no" : ""}" id="challengeWord">
        ${challenge.word.letters.map((item, index) => {
          if (!item.isLetter){
            return `<span class="wob-punct">${escapeHtml(item.char)}</span>`;
          }
          const missIndex = expectedByIndex.get(index);
          const shouldShow = allBlank ? missIndex < filledCount : missIndex === undefined || missIndex < filledCount;
          const text = shouldShow ? item.normalized : "";
          const hiddenClass = shouldShow ? "" : "is-hidden";
          return `<span class="wob-tile ${hiddenClass}" style="--tile-bg:${challenge.word.color}">${escapeHtml(text)}</span>`;
        }).join("")}
      </div>
    `;
  }

  async function handleChallengeChoice(letter){
    const challenge = state.currentChallenge;
    if (!challenge) return;
    const choice = normalizeLetters(letter).charAt(0);
    const expected = challenge.expected[state.challengeInputIndex];
    if (!expected) return;

    if (choice !== expected){
      state.challengeFlash = choice;
      state.challengeBad = true;
      playBad();
      const wordEl = document.getElementById("challengeWord");
      wordEl?.classList.add("is-no");
      await sleep(300);
      state.challengeFlash = "";
      state.challengeBad = false;
      drawWordChallenge();
      return;
    }

    playGood();
    state.challengeFlash = choice;
    state.challengeBad = false;
    state.challengeInputIndex += 1;

    if (state.challengeInputIndex >= challenge.expected.length){
      const hiddenNow = hiddenCountForWord(challenge.word);
      state.challengeHistory.set(challenge.wordIndex, hiddenNow);
      const bonus = (challenge.kind === "keyword" ? 750 : 450) + Math.min(500, challenge.expected.length * 100);
      state.baseCash += bonus;
      updateHud();
      drawWordChallenge();
      await sleep(420);
      app.innerHTML = rootHtml(`
        <div class="wob-panel">
          <div class="wob-big-title">Nice!</div>
          <div class="wob-subtitle">Word Bonus: ${escapeHtml(formatMoney(bonus))}</div>
          <button class="wob-btn no-zoom" id="nextSpinBtn" type="button">${state.usedLetters.size >= state.uniqueLetters.length ? "Final Round" : "Spin Again"}</button>
        </div>
      `, { status:"Bonus" });
      wireGameMenu();
      document.getElementById("nextSpinBtn")?.addEventListener("click", () => {
        if (state.usedLetters.size >= state.uniqueLetters.length) renderFinalIntro();
        else renderSpinScreen();
      });
      return;
    }

    drawWordChallenge();
  }

  function verseBoardHtml({ allVisible = false, removingLetter = "", challengeWordIndex = null, finalMode = false } = {}){
    return `
      <div class="wob-verse-card">
        <div class="wob-verse-board ${finalMode ? "wob-final-board" : ""}" id="wobVerseBoard">
          ${state.tokens.map(token => {
            if (token.kind === "space") return `<span class="wob-space"> </span>`;
            if (token.kind === "punct") return `<span class="wob-punct">${escapeHtml(token.text)}</span>`;
            const word = state.words[token.wordIndex];
            if (!word) return "";
            const isChallenge = challengeWordIndex === word.index;
            const solved = state.finalSolvedWordIndices.has(word.index);
            const tag = isChallenge || finalMode ? "button" : "span";
            const attrs = tag === "button" ? `type="button" data-word-index="${word.index}"` : `data-word-index="${word.index}"`;
            return `<${tag} class="wob-word ${isChallenge ? "is-wiggling" : ""} ${solved ? "is-solved" : ""}" ${attrs} style="--word-color:${word.color}">
              ${word.letters.map(item => {
                if (!item.isLetter){
                  return `<span class="wob-punct">${escapeHtml(item.char)}</span>`;
                }
                const hidden = finalMode ? true : (!allVisible && state.usedLetters.has(item.normalized));
                const removing = removingLetter && item.normalized === removingLetter ? "is-removing" : "";
                return `<span class="wob-tile ${hidden ? "is-hidden" : ""} ${removing}" style="--tile-bg:${word.color}">${hidden ? "" : escapeHtml(item.normalized)}</span>`;
              }).join("")}
            </${tag}>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function fitVerseBoardSoon(){
    if (currentFitRaf) cancelAnimationFrame(currentFitRaf);
    currentFitRaf = requestAnimationFrame(() => {
      currentFitRaf = 0;
      fitVerseBoard();
    });
  }

  function fitVerseBoard(){
    const board = document.getElementById("wobVerseBoard");
    const card = board?.closest(".wob-verse-card");
    if (!board || !card) return;

    const box = card.getBoundingClientRect();
    const wordCount = Math.max(1, state.words.length);
    const letterCount = state.words.reduce((sum, word) => sum + word.letters.length, 0);
    let size = clamp(Math.sqrt((box.width * box.height) / Math.max(24, letterCount)) * 1.38, 18, 56);

    const apply = (tileSize, lineGap) => {
      board.style.setProperty("--wob-tile-size", `${tileSize}px`);
      board.style.setProperty("--wob-tile-gap", `${Math.max(2, tileSize * .12)}px`);
      board.style.setProperty("--wob-line-gap", `${lineGap}px`);
    };

    let lineGap = Math.max(6, size * .32);
    for (let i = 0; i < 28; i += 1){
      apply(size, lineGap);
      const over = board.scrollHeight > box.height - 2 || board.scrollWidth > box.width - 2;
      if (!over) break;
      size -= 1.5;
      lineGap = Math.max(4, size * .25);
      if (size <= 13) break;
    }

    const extra = Math.max(0, (box.height - board.scrollHeight) / Math.max(1, Math.ceil(wordCount / 4)));
    if (extra > 8){
      apply(size, Math.min(size * .72, lineGap + extra * .38));
    }
  }

  window.addEventListener("resize", fitVerseBoardSoon);
  window.addEventListener("orientationchange", () => setTimeout(fitVerseBoardSoon, 250));

  function renderFinalIntro(){
    clearTimers();
    state.screen = "finalIntro";
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-big-title">FINAL ROUND!</div>
        <div class="wob-subtitle">One minute to fill in as many missing words as possible.</div>
        <button class="wob-btn no-zoom" id="startFinalBtn" type="button">Start Final Round</button>
      </div>
    `, { status:"Final Round" });
    wireGameMenu();
    document.getElementById("startFinalBtn")?.addEventListener("click", startFinalRound);
  }

  function startFinalRound(){
    state.screen = "finalRound";
    state.finalStartedAt = Date.now();
    state.finalTimeLeft = 60;
    state.finalSolvedWordIndices = new Set();
    state.finalActiveWord = null;
    state.finalInputIndex = 0;
    state.finalLetterStreak = 0;
    renderFinalRound();
    finalTimerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.finalStartedAt) / 1000);
      state.finalTimeLeft = Math.max(0, 60 - elapsed);
      const timer = document.getElementById("finalTimer");
      if (timer) timer.textContent = String(state.finalTimeLeft);
      if (state.finalTimeLeft <= 0) finishFinalRound();
    }, 250);
  }

  function renderFinalRound(){
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        <div class="wob-final-hud">
          <div class="wob-final-timer"><span id="finalTimer">${escapeHtml(String(state.finalTimeLeft))}</span>s</div>
          <div class="wob-subtitle">Tap words and rebuild them!</div>
        </div>
        ${verseBoardHtml({ finalMode:true })}
      </div>
    `, { status:"Final Round" });
    wireGameMenu();
    fitVerseBoardSoon();
    document.querySelectorAll("[data-word-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.wordIndex);
        if (state.finalSolvedWordIndices.has(index)) return;
        openFinalWord(index);
      });
    });
  }

  function openFinalWord(wordIndex){
    const word = state.words[wordIndex];
    if (!word || state.finalTimeLeft <= 0) return;
    state.finalActiveWord = {
      wordIndex,
      word,
      expected: normalizeLetters(word.display).split("")
    };
    state.finalInputIndex = 0;
    state.finalLetterStreak = 0;
    state.finalFlash = "";
    state.finalBad = false;
    renderFinalModal();
  }

  function renderFinalModal(){
    const active = state.finalActiveWord;
    if (!active) return;
    const uniqueCorrect = Array.from(new Set(active.expected));
    const targetCount = Math.max(9, Math.min(24, uniqueCorrect.length + 6));
    if (!active.choices) active.choices = makeChoiceLetters(uniqueCorrect, state.uniqueLetters, targetCount);

    const modal = document.createElement("div");
    modal.className = "wob-final-modal";
    modal.id = "wobFinalModal";
    modal.innerHTML = `
      <div class="wob-final-modal-panel">
        <button class="wob-btn wob-btn-secondary wob-close-small no-zoom" id="finalCloseBtn" type="button">Close</button>
        <div class="wob-big-title">Type the Word</div>
        ${finalWordHtml(active)}
        <div class="wob-choice-grid is-wide">
          ${active.choices.map(letter => `<button class="wob-choice-tile no-zoom ${state.finalFlash === letter ? (state.finalBad ? "is-bad" : "is-good") : ""}" data-final-choice="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`).join("")}
        </div>
        <div class="wob-bonus-line">Streak: ${escapeHtml(String(state.finalLetterStreak))} • Next: ${escapeHtml(formatMoney((state.finalLetterStreak + 1) * 100))}</div>
      </div>
    `;
    document.getElementById("wobFinalModal")?.remove();
    document.querySelector(".wob-card")?.appendChild(modal);
    document.getElementById("finalCloseBtn")?.addEventListener("click", () => modal.remove());
    modal.querySelectorAll("[data-final-choice]").forEach(btn => {
      btn.addEventListener("click", () => handleFinalChoice(btn.dataset.finalChoice || ""));
    });
  }

  function finalWordHtml(active){
    const word = active.word;
    let alphaIndex = 0;
    return `
      <div class="wob-challenge-word ${state.finalBad ? "is-no" : ""}" id="finalWordDisplay">
        ${word.letters.map(item => {
          if (!item.isLetter) return `<span class="wob-punct">${escapeHtml(item.char)}</span>`;
          const show = alphaIndex < state.finalInputIndex;
          const text = show ? active.expected[alphaIndex] : "";
          alphaIndex += 1;
          return `<span class="wob-tile ${show ? "" : "is-hidden"}" style="--tile-bg:${word.color}">${escapeHtml(text)}</span>`;
        }).join("")}
      </div>
    `;
  }

  async function handleFinalChoice(letter){
    const active = state.finalActiveWord;
    if (!active || state.finalTimeLeft <= 0) return;
    const choice = normalizeLetters(letter).charAt(0);
    const expected = active.expected[state.finalInputIndex];
    if (!expected) return;

    if (choice !== expected){
      state.finalLetterStreak = 0;
      state.finalFlash = choice;
      state.finalBad = true;
      playBad();
      renderFinalModal();
      await sleep(260);
      state.finalFlash = "";
      state.finalBad = false;
      renderFinalModal();
      return;
    }

    state.finalLetterStreak += 1;
    const earned = state.finalLetterStreak * 100;
    state.finalCash += earned;
    state.finalInputIndex += 1;
    state.finalFlash = choice;
    state.finalBad = false;
    updateHud();
    playGood();

    if (state.finalInputIndex >= active.expected.length){
      state.finalSolvedWordIndices.add(active.wordIndex);
      document.getElementById("wobFinalModal")?.remove();
      state.finalActiveWord = null;
      renderFinalRound();
      return;
    }

    renderFinalModal();
  }

  function finishFinalRound(){
    if (finalTimerId){
      clearInterval(finalTimerId);
      finalTimerId = null;
    }
    document.getElementById("wobFinalModal")?.remove();
    renderMoneyTotalScreen();
  }

  async function renderMoneyTotalScreen(){
    clearTimers();
    state.screen = "moneyTotal";
    const normalTotal = state.baseCash + state.finalCash;
    const prizeTotal = state.prizeCash;
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-big-title">Money Total</div>
        <div class="wob-money-total" id="moneyCount">$0</div>
        <div class="wob-prize-list" id="prizeList"></div>
        <button class="wob-btn no-zoom" id="completeBtn" type="button" style="display:none">Complete</button>
      </div>
    `, { status:"Total" });
    wireGameMenu();
    await animateMoneyCount(document.getElementById("moneyCount"), 0, normalTotal, 1400);
    const prizeList = document.getElementById("prizeList");
    let running = normalTotal;
    for (const prize of state.prizeEarnings){
      const card = document.createElement("div");
      card.className = "wob-prize-card";
      card.textContent = `${prize.emoji} ${prize.name} +${formatMoney(prize.total)}`;
      prizeList?.appendChild(card);
      playPrize();
      await animateMoneyCount(document.getElementById("moneyCount"), running, running + prize.total, 520);
      running += prize.total;
      await sleep(160);
    }
    if (!state.prizeEarnings.length && prizeTotal > 0){
      await animateMoneyCount(document.getElementById("moneyCount"), running, running + prizeTotal, 700);
      running += prizeTotal;
    }
    document.getElementById("completeBtn").style.display = "inline-flex";
    document.getElementById("completeBtn")?.addEventListener("click", renderComplete);
  }

  function animateMoneyCount(el, from, to, ms){
    return new Promise(resolve => {
      if (!el) return resolve();
      const start = performance.now();
      const duration = Math.max(120, Number(ms) || 500);
      const step = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = from + (to - from) * eased;
        el.textContent = formatMoney(value);
        if (t < 1){
          if (Math.random() < .18) playTone({ midi:72 + Math.floor(Math.random() * 7), duration:.035, volume:.07 });
          requestAnimationFrame(step);
        } else {
          el.textContent = formatMoney(to);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  async function markVersePracticed(){
    const verseId = ctx.verseId;
    if (!verseId) return { ok:false };
    if (typeof bridge().markVersePracticed === "function"){
      try { return bridge().markVersePracticed({ verseId }); }
      catch(err){ console.warn("Wheel of Bible bridge markVersePracticed failed", err); }
    }
    return { ok:false };
  }

  async function renderComplete(){
    if (state.completed) return;
    state.completed = true;
    await markVersePracticed();
    const statsText = `${formatMoney(totalCash())} earned • ${state.finalSolvedWordIndices.size} final words rebuilt`;
    if (shell().renderCompleteScreen){
      shell().renderCompleteScreen({
        app,
        title: "Wheel Complete!",
        icon: "🎡",
        statsText,
        playAgainText: "Play Again",
        moreGamesText: "Back to Playground",
        backLabel: "Back to Playground",
        theme: GAME_THEME,
        onPlayAgain: () => beginRun(),
        onMoreGames: () => bridge().exitGame?.()
      });
    } else {
      app.innerHTML = `<div class="wob-root"><div class="wob-panel"><div class="wob-big-title">Complete!</div><button class="wob-btn" id="backBtn">Back</button></div></div>`;
      document.getElementById("backBtn")?.addEventListener("click", () => bridge().exitGame?.());
    }
  }

  renderIntro();
})();
