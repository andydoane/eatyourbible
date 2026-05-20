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
  const WHEEL_BUTTON_IMAGE = "./wheel_of_bible_images/button_wheel.png";
  const WHEEL_FACE_IMAGE = "./wheel_of_bible_images/wheel_face.svg";
  const DOLLAR_BILL_IMAGE = "./wheel_of_bible_images/dollar_bill.png";
  const WHEEL_ICON_HTML = `<img class="wob-shell-title-icon" src="${WHEEL_BUTTON_IMAGE}" alt="" draggable="false">`;
  const WHEEL_BUTTON_HTML = `<img class="wob-wheel-button-img" src="${WHEEL_BUTTON_IMAGE}" alt="" draggable="false">`;
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
    "#ffc751", "#a7cb6f", "#40b9c5", "#ff9e3d",
    "#bda0ff", "#ff8fb9", "#8fd7ff", "#ffe382"
  ];

  const WHEEL_VALUES = [
    { kind:"cash", label:"$800", value:800 },
    { kind:"cash", label:"$1000", value:1000 },
    { kind:"prize", label:"PRIZE" },
    { kind:"cash", label:"$100", value:100 },
    { kind:"cash", label:"$300", value:300 },
    { kind:"cash", label:"$500", value:500 },
    { kind:"cash", label:"$700", value:700 },
    { kind:"cash", label:"$900", value:900 },
    { kind:"prize", label:"PRIZE" },
    { kind:"cash", label:"$200", value:200 },
    { kind:"cash", label:"$400", value:400 },
    { kind:"cash", label:"$600", value:600 }
  ];

  const PRIZES = [
    { emoji:"🎁", name:"Surprise Box", value:1200 },
    { emoji:"🛴", name:"Scooter", value:1400 },
    { emoji:"🎮", name:"Game Prize", value:1500 },
    { emoji:"🚲", name:"Bike", value:1800 },
    { emoji:"🏰", name:"Castle Trip", value:2000 },
    { emoji:"🚀", name:"Rocket Ride", value:2200 },
    { emoji:"🦖", name:"Dino Dig", value:2500 },
    { emoji:"🏆", name:"Golden Trophy", value:3000 }
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
    screen:"intro",
    verseJson:null,
    verseText:ctx.verseText || "",
    verseRef:ctx.verseRef || "",
    translation:ctx.translation || "",
    tokens:[],
    words:[],
    uniqueLetters:[],
    echoParts:[],
    keywordSet:new Set(),
    hidePlanWords:[],
    revealedLetters:new Set(),
    challengeHistory:new Map(),
    referenceMeta:null,
    refChallengeDone:{ book:false, chapter:false, verse:false },
    selectedSpin:null,
    lastSelectedLetter:"",
    turnCount:0,
    baseCash:0,
    prizeCash:0,
    finalCash:0,
    prizeEarnings:[],
    currentChallenge:null,
    challengeInputIndex:0,
    challengeFlash:"",
    challengeBad:false,
    finalStartedAt:0,
    finalTimeLeft:60,
    finalSolvedWordIndices:new Set(),
    finalActiveWord:null,
    finalInputIndex:0,
    finalLetterStreak:0,
    finalFlash:"",
    finalBad:false,
    completed:false
  };

  function escapeHtml(value){
    if (shell().escapeHtml) return shell().escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
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

  function clearSleeps(){ sleepIds.forEach(id => clearTimeout(id)); sleepIds = []; }

  function clearTimers(){
    clearSleeps();
    if (finalTimerId){ clearInterval(finalTimerId); finalTimerId = null; }
    if (currentFitRaf){ cancelAnimationFrame(currentFitRaf); currentFitRaf = 0; }
  }

  function formatMoney(value){
    return `$${Math.max(0, Math.round(Number(value) || 0)).toLocaleString()}`;
  }

  function totalCash(){ return state.baseCash + state.prizeCash + state.finalCash; }

  function normalizeLetters(value){
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function normalizeDigits(value){
    return String(value || "").replace(/[^0-9]/g, "");
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
      if (/^\s+$/.test(part)) tokens.push({ kind:"space", text:part });
      else if (/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(part)) tokens.push({ kind:"word", text:part, wordIndex:wordIndex++ });
      else if (/^[0-9]+(?:,[0-9]{3})*$/.test(part)) tokens.push({ kind:"word", text:part, wordIndex:wordIndex++, numeric:true });
      else tokens.push({ kind:"punct", text:part });
    }
    return tokens;
  }

  function extractKeywords(json){
    const out = new Set();
    const addWord = (value) => {
      const text = String(value || "").trim();
      if (!text) return;
      for (const part of text.split(/\s+/g)){
        const norm = normalizeWord(part);
        if (norm) out.add(norm);
      }
      const phraseNorm = normalizeWord(text);
      if (phraseNorm) out.add(phraseNorm);
    };

    const generic = [json?.keywords, json?.keyWords, json?.keywordWords, json?.memoryKeywords, json?.verseKeywords];
    for (const item of generic){
      if (Array.isArray(item)) item.forEach(addWord);
      else if (typeof item === "string") item.split(/[;,]/g).forEach(addWord);
    }

    if (Array.isArray(json?.hidePlan)){
      for (const item of json.hidePlan){
        if (item?.word) addWord(item.word);
      }
    }

    return out;
  }

  function extractHidePlanWords(json){
    if (!Array.isArray(json?.hidePlan)) return [];
    return json.hidePlan
      .map(item => String(item?.word || "").trim())
      .filter(Boolean);
  }

  function parseReference(){
    if (shell().parseReferenceParts){
      return shell().parseReferenceParts(state.verseRef, state.translation, ctx.verseId);
    }
    const raw = String(state.verseRef || "").trim();
    const match = raw.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?/);
    return match ? {
      book:match[1],
      chapter:Number(match[2]),
      verse:Number(match[3]),
      verseEnd:match[4] ? Number(match[4]) : null,
      reference:match[4] ? `${match[2]}:${match[3]}-${match[4]}` : `${match[2]}:${match[3]}`,
      display:raw
    } : { book:raw, chapter:null, verse:null, verseEnd:null, reference:"", display:raw };
  }

  function buildVerseModel(){
    state.tokens = tokenizeVerse(state.verseText);
    state.words = [];
    state.referenceMeta = parseReference();

    for (const token of state.tokens){
      if (token.kind !== "word") continue;
      const display = token.text;
      const clean = normalizeWord(display);
      const letters = Array.from(display).map((char, index) => ({
        char,
        index,
        normalized:normalizeLetters(char),
        isLetter:/^[A-Za-z]$/.test(char)
      }));
      state.words.push({
        index:token.wordIndex,
        display,
        clean,
        letters,
        color:WORD_COLORS[token.wordIndex % WORD_COLORS.length],
        isKeyword:state.keywordSet.has(clean)
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
    if (!verseId){ buildVerseModel(); return null; }

    try {
      const res = await fetch(`../../verse_data/${verseId}.json`, { cache:"no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.verseJson = await res.json();
      state.verseText = state.verseJson.verseText || state.verseText;
      state.translation = state.verseJson.translation || state.translation;
      state.echoParts = Array.isArray(state.verseJson.echoParts) ? state.verseJson.echoParts.filter(Boolean).map(String) : [];
      state.keywordSet = extractKeywords(state.verseJson);
      state.hidePlanWords = extractHidePlanWords(state.verseJson);
      return state.verseJson;
    } catch (err){
      console.warn("Wheel of Bible could not load full verse JSON", err);
      state.keywordSet = new Set();
      state.hidePlanWords = [];
      state.echoParts = [];
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
    add(json.audioFile); add(json.audio); add(json.verseAudio); add(json.audioSrc);
    if (ctx.verseId) add(`${ctx.verseId}.mp3`);
    return Array.from(new Set(candidates));
  }

  function getReferenceAudioCandidates(){
    const json = state.verseJson || {};
    const candidates = [];
    const add = (src) => {
      const clean = String(src || "").trim();
      if (!clean) return;
      if (/^https?:\/\//i.test(clean) || clean.startsWith("../")) candidates.push(clean);
      else if (clean.startsWith("verse_audio/")) candidates.push(`../../${clean}`);
      else candidates.push(`../../verse_audio/${clean}`);
    };
    add(json.referenceAudioFile);
    add(json.referenceAudio);
    add(json.refAudio);
    add(json.refAudioSrc);
    if (ctx.verseId) add(`${ctx.verseId}_ref.mp3`);
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

  function audioContextConstructor(){ return window.AudioContext || window.webkitAudioContext; }
  function createAudio(){
    if (audioCtx){ if (masterGain) masterGain.gain.value = muted ? 0 : WEB_AUDIO_MASTER_VOLUME; return; }
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
      let done = false, fallbackId = null;
      const cleanup = () => { audio.onended = null; audio.onerror = null; audio.oncanplay = null; audio.oncanplaythrough = null; if (fallbackId) clearTimeout(fallbackId); };
      const finish = ok => { if (done) return; done = true; cleanup(); htmlAudioPrimed = !!ok; htmlAudioPrimePromise = null; resolve(!!ok); };
      const tryPlay = () => { const p = audio.play(); if (p?.then) p.then(()=>{}).catch(()=>finish(false)); };
      try {
        audio.pause(); audio.currentTime = 0; audio.muted = false; audio.volume = 0.01; audio.src = SILENCE_AUDIO_FILE; audio.load();
        audio.onended = () => finish(true); audio.onerror = () => finish(false);
        if (audio.readyState >= 3) tryPlay(); else { audio.oncanplay = tryPlay; audio.oncanplaythrough = tryPlay; }
        fallbackId = setTimeout(() => finish(false), 1800);
      } catch (err){ finish(false); }
    });
    return htmlAudioPrimePromise;
  }

  async function unlockAudio(){
    createAudio(); createVerseAudioElement();
    if (!audioCtx || !masterGain) return false;
    if (audioUnlocked && audioCtx.state === "running") return true;
    if (audioUnlockPromise) return audioUnlockPromise;
    audioUnlockPromise = (async () => {
      try {
        if (audioCtx.state !== "running"){ try { await audioCtx.resume?.(); } catch(err){} }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(440, now); gain.gain.setValueAtTime(0.0001, now);
        osc.connect(gain); gain.connect(masterGain); osc.start(now); osc.stop(now + 0.03);
        audioUnlocked = audioCtx.state === "running";
        return audioUnlocked;
      } catch(err){ console.warn("Wheel of Bible audio unlock failed", err); audioUnlocked = false; return false; }
      finally { audioUnlockPromise = null; }
    })();
    return audioUnlockPromise;
  }

  function midiToFreq(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }
  function playTone({ midi = 60, duration = 0.12, volume = 0.18, type = "triangle" } = {}){
    if (muted) return;
    createAudio();
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state !== "running"){ unlockAudio().then(ok => { if (ok) playTone({ midi, duration, volume, type }); }); return; }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(midiToFreq(midi), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain); gain.connect(masterGain); osc.start(now); osc.stop(now + duration + 0.04);
  }
  function playBeep(index = 0){ playTone({ midi:67 + (index % 3) * 4, duration:.10, volume:.24 }); }
  function playGood(){ playTone({ midi:72, duration:.10, volume:.28 }); setTimeout(() => playTone({ midi:79, duration:.14, volume:.22 }), 70); }
  function playBad(){ playTone({ midi:43, duration:.13, volume:.32, type:"sine" }); setTimeout(() => playTone({ midi:38, duration:.12, volume:.24, type:"sine" }), 58); }
  function playPop(i = 0){ playTone({ midi:64 + (i % 5) * 2, duration:.08, volume:.18 }); }
  function playPrize(){ playTone({ midi:72, duration:.10, volume:.25 }); setTimeout(() => playTone({ midi:76, duration:.10, volume:.24 }),70); setTimeout(() => playTone({ midi:84, duration:.18, volume:.28 }),145); }

  function stopVerseAudio(){ if (!verseAudioEl) return; try { verseAudioEl.pause(); verseAudioEl.currentTime = 0; } catch(err){} }
  async function tryPlayAudioCandidatesAndWait(candidates, fallbackMs = 1200){
    const audio = createVerseAudioElement();
    audio.muted = muted;
    audio.volume = muted ? 0 : 1;

    for (const src of candidates || []){
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = src;
        audio.load();

        await new Promise(resolve => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve();
          };
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", finish);
            audio.removeEventListener("canplay", finish);
            audio.removeEventListener("error", finish);
          };
          audio.addEventListener("loadedmetadata", finish);
          audio.addEventListener("canplay", finish);
          audio.addEventListener("error", finish);
          setTimeout(finish, 1200);
        });

        const durationMs = Number.isFinite(Number(audio.duration)) && Number(audio.duration) > 0
          ? clamp(Number(audio.duration) * 1000, 500, 30000)
          : Math.max(500, Number(fallbackMs) || 1200);

        await audio.play();

        await new Promise(resolve => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve();
          };
          const cleanup = () => {
            audio.removeEventListener("ended", finish);
            audio.removeEventListener("error", finish);
            if (timeoutId) clearTimeout(timeoutId);
          };
          audio.addEventListener("ended", finish);
          audio.addEventListener("error", finish);
          const timeoutId = setTimeout(finish, durationMs + 900);
        });

        return true;
      } catch(err){}
    }

    return false;
  }

  async function tryPlayVerseAudio(){
    return tryPlayAudioCandidatesAndWait(getVerseAudioCandidates(), estimateListenMs());
  }
  function estimateListenMs(){
    const wordCount = state.words.length || String(state.verseText || "").split(/\s+/).filter(Boolean).length;
    const duration = Number(verseAudioEl?.duration);
    if (Number.isFinite(duration) && duration > 1) return clamp(duration * 1000, 3500, 30000);
    return clamp(wordCount * 620, 3500, 18000);
  }

  function helpHtml(){
    return `
      <ul class="wob-help-list">
        <li>Spin the wheel to get a dollar amount or a prize.</li>
        <li>Pick a letter from today's verse. Every matching blank tile reveals and earns money.</li>
        <li>Tap the wiggling word or reference tile, then build the answer with letter or number tiles.</li>
        <li>In the Final Round, race to rebuild as many blank words as you can.</li>
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

  function renderHelpOverlay(){ return shell().helpOverlayHtml ? shell().helpOverlayHtml({ id:HELP_OVERLAY_ID, title:"How to Play", body:helpHtml() }) : ""; }
  function renderGameMenuOverlay(){ return shell().gameMenuHtml ? shell().gameMenuHtml({ id:MENU_OVERLAY_ID, title:"Wheel of Bible Menu", muted, showModeSelect:false, exitText:"Exit Playground" }) : ""; }

  function wireGameMenu(){
    if (!shell().wireGameMenu) return;
    shell().wireGameMenu({
      id:MENU_OVERLAY_ID,
      menuButtonId:"wobMenuPill",
      helpOverlayId:HELP_OVERLAY_ID,
      isMuted:() => muted,
      onMuteToggle:() => {
        muted = !muted;
        if (masterGain && audioCtx) masterGain.gain.setValueAtTime(muted ? 0 : WEB_AUDIO_MASTER_VOLUME, audioCtx.currentTime);
        if (verseAudioEl) verseAudioEl.muted = muted;
        return muted;
      },
      onHowToPlay:() => { document.getElementById(MENU_OVERLAY_ID)?.classList.remove("is-open"); shell().openHelp?.(HELP_OVERLAY_ID, "back", "Back"); },
      onExit:() => { stopVerseAudio(); clearTimers(); bridge().exitGame?.(); }
    });
  }

  function updateHud(status = ""){
    const money = document.getElementById("wobMoneyPill");
    const pill = document.getElementById("wobStatusPill");
    if (money) money.textContent = formatMoney(totalCash());
    if (pill && status) pill.textContent = status;
  }

  function renderIntro(){
    clearTimers(); stopVerseAudio(); state.screen = "intro";
    shell().renderTitleScreen?.({
      app, title:GAME_TITLE, icon:GAME_ICON, iconHtml:WHEEL_ICON_HTML, helpHtml:helpHtml(), helpOverlayId:HELP_OVERLAY_ID,
      startText:"Start", helpText:"How to Play", theme:GAME_THEME, backLabel:"Back to Verse Playground",
      onBack:() => bridge().exitGame?.(),
      onStart:async () => { createVerseAudioElement(); primeHtmlAudio(); unlockAudio(); await beginRun(); }
    });
  }

  async function beginRun(){
    clearTimers(); await loadVerseJson(); buildVerseModel(); resetRunState(); await playIntroSequence();
  }

  function resetRunState(){
    state.revealedLetters = new Set();
    state.challengeHistory = new Map();
    state.refChallengeDone = { book:false, chapter:false, verse:false };
    state.selectedSpin = null; state.lastSelectedLetter = ""; state.turnCount = 0;
    state.baseCash = 0; state.prizeCash = 0; state.finalCash = 0; state.prizeEarnings = [];
    state.currentChallenge = null; state.challengeInputIndex = 0;
    state.finalSolvedWordIndices = new Set(); state.finalActiveWord = null; state.finalInputIndex = 0; state.finalLetterStreak = 0;
    state.completed = false;
  }

  async function playIntroSequence(){
    state.screen = "introSequence";
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-intro-wheel-wrap"><div class="wob-wheel-shell"><div class="wob-wheel-pointer"></div><div class="wob-wheel" id="introWheel"><img class="wob-wheel-face" src="${WHEEL_FACE_IMAGE}" alt="" draggable="false"></div></div></div>
        <div class="wob-intro-words"><span class="wob-intro-word" id="introWord0">WHEEL</span><span class="wob-intro-word" id="introWord1">OF</span><span class="wob-intro-word" id="introWord2">BIBLE!</span></div>
      </div>
    `, { status:"Get Ready", rootClass:"is-simple-screen" });
    wireGameMenu();
    document.getElementById("introWheel")?.style.setProperty("--spin-deg", "1080deg");
    for (let i=0; i<3; i+=1){ await sleep(420); document.getElementById(`introWord${i}`)?.classList.add("is-in"); playBeep(i); }
    await sleep(320); playPrize(); await sleep(900); renderMeetVerse();
  }

  function renderMeetVerse(){
    state.screen = "meetVerse";
    app.innerHTML = rootHtml(`
      <div class="wob-panel wob-meet-panel">
        <button class="wob-title-button no-zoom" id="meetVerseBtn" type="button">
          Let’s meet today’s verse!
        </button>
      </div>
    `, { status:"Today's Verse", rootClass:"is-simple-screen" });
    wireGameMenu();
    document.getElementById("meetVerseBtn")?.addEventListener("click", async () => { await unlockAudio(); await playVerseIntro(); });
  }

  async function playVerseIntro(){
    state.screen = "verseIntro";
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ allVisible:true })}
        <button class="wob-spin-float-button is-verse-intro no-zoom is-hidden" id="verseIntroSpinPrompt" type="button" aria-label="Go spin the wheel">
          ${WHEEL_BUTTON_HTML}
        </button>
      </div>
    `, { status:"Listen", rootClass:"is-board-screen is-listen-screen" });
    wireGameMenu();
    fitVerseBoardSoon();

    document.getElementById("verseIntroSpinPrompt")?.addEventListener("click", () => {
      stopVerseAudio();
      renderSpinScreen();
    });

    const versePlayed = await tryPlayVerseAudio();
    if (!versePlayed) await sleep(1800);

    const refPlayed = await tryPlayAudioCandidatesAndWait(getReferenceAudioCandidates(), 1600);
    if (!refPlayed) await sleep(250);

    showVerseIntroSpinPrompt();
  }

  function showVerseIntroSpinPrompt(){
    if (state.screen !== "verseIntro") return;
    const btn = document.getElementById("verseIntroSpinPrompt");
    if (!btn) return;
    btn.classList.remove("is-hidden");
    playGood();
  }

  function referenceLine(){ return [state.verseRef || state.referenceMeta?.display || "", state.translation || ""].filter(Boolean).join(" • "); }

  function wheelLabelsHtml(){
    const step = 360 / WHEEL_VALUES.length;
    return WHEEL_VALUES.map((seg, index) => {
      const angle = index * step + step / 2;
      return `<div class="wob-wheel-label" style="--label-angle:${angle}deg;">${escapeHtml(seg.label)}</div>`;
    }).join("");
  }

  function renderSpinScreen(){
    clearTimers(); state.screen = "spin";
    if (state.uniqueLetters.length && state.revealedLetters.size >= state.uniqueLetters.length){ renderFinalIntro(); return; }
    state.selectedSpin = null;
    app.innerHTML = rootHtml(`
      <div class="wob-panel wob-spin-layout">
        <div class="wob-big-title">Spin the Wheel!</div>
        <button class="wob-wheel-shell wob-spin-wheel-button no-zoom" id="spinWheelBtn" type="button" aria-label="Spin the wheel">
          <div class="wob-wheel-pointer"></div>
          <div class="wob-wheel" id="gameWheel"><img class="wob-wheel-face" src="${WHEEL_FACE_IMAGE}" alt="" draggable="false"></div>
        </button>
        <div class="wob-subtitle wob-tap-wheel-hint">Tap the wheel to spin</div>
      </div>
    `, { status:"Spin", rootClass:"is-spin-screen" });
    wireGameMenu(); document.getElementById("spinWheelBtn")?.addEventListener("click", spinWheel);
  }

  async function spinWheel(){
    const btn = document.getElementById("spinWheelBtn"); if (btn) btn.disabled = true; await unlockAudio();
    const index = Math.floor(Math.random() * WHEEL_VALUES.length);
    const step = 360 / WHEEL_VALUES.length;
    const degrees = 360 * 5 + ((360 - (index * step)) % 360);
    document.getElementById("gameWheel")?.style.setProperty("--spin-deg", `${degrees}deg`);
    for (let i=0; i<22; i+=1) setTimeout(() => playTone({ midi:50 + (i % 3) * 3, duration:.045, volume:.12, type:"square" }), i * 95);
    await sleep(3300);
    const raw = WHEEL_VALUES[index];
    let result = { ...raw };
    if (raw.kind === "prize"){
      const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      result = { kind:"prize", label:"PRIZE", value:prize.value, prize };
      playPrize();
    } else playGood();
    state.selectedSpin = result;
    await renderSpinResult(result);
  }

  async function renderSpinResult(result){
    const card = document.querySelector(".wob-card");
    if (!card){ renderSelectLetterScreen(); return; }

    const overlay = document.createElement("div");
    overlay.className = "wob-spin-pop-overlay";
    card.appendChild(overlay);

    if (result.kind === "prize"){
      overlay.innerHTML = `
        <div class="wob-spin-pop-card is-prize">
          <button class="wob-prize-gift-button no-zoom" id="wobPrizeGiftButton" type="button" aria-label="Open prize">
            🎁
          </button>
          <div class="wob-spin-pop-hint">Tap the present!</div>
        </div>
      `;

      await new Promise(resolve => {
        const btn = document.getElementById("wobPrizeGiftButton");
        if (!btn){ resolve(); return; }

        btn.addEventListener("click", () => {
          btn.disabled = true;
          playPrize();

          const popCard = overlay.querySelector(".wob-spin-pop-card");
          if (popCard){
            popCard.classList.add("is-opened");
            popCard.innerHTML = `
              <div class="wob-open-prize-emoji">${escapeHtml(result.prize.emoji)}</div>
              <div class="wob-spin-pop-title">${escapeHtml(result.prize.name)}</div>
              <div class="wob-spin-pop-value">${escapeHtml(formatMoney(result.value))}</div>
            `;
          }

          setTimeout(resolve, 1250);
        }, { once:true });
      });

      renderSelectLetterScreen();
      return;
    }

    overlay.innerHTML = `
      <div class="wob-spin-pop-card is-cash">
        <div class="wob-spin-pop-value">${escapeHtml(formatMoney(result.value))}</div>
      </div>
    `;

    playGood();
    await sleep(950);
    renderSelectLetterScreen();
  }

  function renderSelectLetterScreen(){
    state.screen = "selectLetter";
    const spinLabel = state.selectedSpin?.kind === "prize" ? `${state.selectedSpin.prize.emoji} ${state.selectedSpin.prize.name}: ${formatMoney(state.selectedSpin.value)} per letter` : `${formatMoney(state.selectedSpin?.value || 0)} per letter`;
    app.innerHTML = rootHtml(`
      <div class="wob-panel">
        <div class="wob-subtitle">Spin Result: ${escapeHtml(spinLabel)}</div>
        <div class="wob-letter-grid">
          ${state.uniqueLetters.map(letter => {
            const used = state.revealedLetters.has(letter);
            return `<button class="wob-letter-choice no-zoom ${used ? "is-used" : ""}" data-letter="${escapeHtml(letter)}" type="button" ${used ? "disabled" : ""}>${escapeHtml(letter)}</button>`;
          }).join("")}
        </div>
      </div>
    `, { status:"Choose Letter" });
    wireGameMenu();
    document.querySelectorAll("[data-letter]").forEach(btn => btn.addEventListener("click", () => handleLetterChoice(btn.dataset.letter || "")));
  }

  function countUnrevealedLetter(letter){
    let count = 0;
    for (const word of state.words){
      for (const item of word.letters){
        if (item.isLetter && item.normalized === letter && !state.revealedLetters.has(item.normalized)) count += 1;
      }
    }
    return count;
  }

  async function handleLetterChoice(letter){
    const selected = normalizeLetters(letter).charAt(0);
    if (!selected || state.revealedLetters.has(selected)) return;
    await unlockAudio();
    const matches = countUnrevealedLetter(selected);
    state.lastSelectedLetter = selected;
    state.revealedLetters.add(selected);
    state.turnCount += 1;
    const value = Math.max(0, Number(state.selectedSpin?.value) || 0);
    const earnings = value * matches;
    if (state.selectedSpin?.kind === "prize"){
      state.prizeCash += earnings;
      state.prizeEarnings.push({ ...state.selectedSpin.prize, perLetter:value, matches, total:earnings, letter:selected });
    } else state.baseCash += earnings;
    await renderLetterReveal({ letter:selected, matches, earnings, perLetter:value });
  }

  async function renderLetterReveal({ letter, matches, earnings, perLetter }){
    state.screen = "revealLetter";

    // The letter was added before this function. Temporarily hide it so
    // we can reveal each matching tile one at a time.
    state.revealedLetters.delete(letter);

    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ animatingLetter:letter })}
      </div>
    `, { status:"Letters Reveal", rootClass:"is-board-screen" });

    wireGameMenu();
    fitVerseBoardSoon();
    await sleep(80);

    const tiles = Array.from(document.querySelectorAll(`.wob-tile[data-normalized="${letter}"]`));
    const delayMs = tiles.length > 18 ? 55 : 85;

    for (let i=0; i<tiles.length; i+=1){
      const tile = tiles[i];
      tile.textContent = letter;
      tile.classList.remove("is-hidden");
      tile.classList.add("is-pop-revealed");
      playPop(i);
      showFloatingMoneyAtElement(tile, formatMoney(perLetter));
      await sleep(delayMs);
    }

    state.revealedLetters.add(letter);
    await sleep(260);
    updateHud();

    await showRoundTotalPopup(earnings);

    if (state.uniqueLetters.length && state.revealedLetters.size >= state.uniqueLetters.length){ renderFinalIntro(); return; }
    const challenge = chooseChallengeTarget();
    if (!challenge){ renderSpinScreen(); return; }
    renderWigglingVerse(challenge);
  }

  function showFloatingMoney(text){
    const card = document.querySelector(".wob-card"); if (!card) return;
    const el = document.createElement("div");
    el.className = "wob-floating-money";
    el.textContent = text;
    card.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  function showFloatingMoneyAtElement(targetEl, text){
    const card = document.querySelector(".wob-card");
    if (!card || !targetEl) return;

    const cardBox = card.getBoundingClientRect();
    const box = targetEl.getBoundingClientRect();
    const x = box.left + box.width / 2 - cardBox.left;
    const y = box.top - cardBox.top;

    const el = document.createElement("div");
    el.className = "wob-floating-money is-tile-money";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    card.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  async function showChallengeBonusPopup(bonus) {
    const card = document.querySelector(".wob-card");
    if (!card) { await sleep(1000); return; }

    const amount = Math.max(0, Number(bonus) || 0);
    const popup = document.createElement("div");
    popup.className = "wob-challenge-bonus-pop";
    popup.innerHTML = `
      <div class="wob-challenge-bonus-label">Nice!</div>
      <div class="wob-challenge-bonus-amount">+ ${escapeHtml(formatMoney(amount))}</div>
    `;
    card.appendChild(popup);

    // Use one quick money burst behind the popup.
    spawnDollarExplosion(card, 0, 900, "classic");
    playPrize();

    await sleep(1250);
    popup.classList.add("is-leaving");
    await sleep(320);
    popup.remove();
  }

  async function showRoundTotalPopup(amount){
    const card = document.querySelector(".wob-card");
    if (!card) return;

    const total = Math.max(0, Number(amount) || 0);
    const popup = document.createElement("div");
    popup.className = "wob-round-total-pop";
    popup.innerHTML = `
      <div class="wob-round-total-label">Round Total</div>
      <div class="wob-round-total-amount">${escapeHtml(formatMoney(total))}</div>
    `;
    card.appendChild(popup);

    await sleep(420);

    const rainTiming = spawnDollarRain(card, total);
    playPrize();

    await sleep(rainTiming.totalMs + 260);

    popup.classList.add("is-leaving");
    await sleep(360);
    popup.remove();
  }

  function spawnDollarRain(card, total) {
    if (!card) return { totalMs: 0 };

    const safeTotal = Math.max(0, Number(total) || 0);
    const count = clamp(18 + Math.floor(safeTotal / 500), 18, 78);
    const rainSpanMs = clamp(900 + Math.floor(safeTotal / 5000) * 650 + count * 18, 1100, 4400);
    const fallMs = clamp(1200 + Math.floor(count * 7), 1250, 1850);
    const cardWidth = card.clientWidth || 360;
    const cardHeight = card.clientHeight || 520;
    const fallDistance = Math.round(cardHeight * .58);

    const lanes = makeShuffledRainLanes(count, cardWidth);

    for (let i = 0; i < count; i += 1) {
      const bill = document.createElement("img");
      const x = lanes[i];
      const delay = Math.round((i / count) * rainSpanMs + Math.random() * 160);
      const drift = (Math.random() * 110) - 55;
      const rotStart = (Math.random() * 80) - 40;
      const rotEnd = rotStart + (Math.random() * 260 - 130);
      const scale = .74 + Math.random() * .34;

      bill.className = "wob-dollar-bill is-dollar-rain";
      bill.src = DOLLAR_BILL_IMAGE;
      bill.alt = "";
      bill.draggable = false;
      bill.style.left = `${x}px`;
      bill.style.top = `-82px`;
      bill.style.setProperty("--drift", `${drift}px`);
      bill.style.setProperty("--fall", `${fallDistance}px`);
      bill.style.setProperty("--rot-start", `${rotStart}deg`);
      bill.style.setProperty("--rot-end", `${rotEnd}deg`);
      bill.style.setProperty("--scale", String(scale));
      bill.style.setProperty("--duration", `${fallMs}ms`);
      bill.style.setProperty("--delay", `${delay}ms`);
      card.appendChild(bill);

      setTimeout(() => bill.remove(), delay + fallMs + 80);
    }

    return { totalMs: rainSpanMs + fallMs };
  }

  function makeShuffledRainLanes(count, width) {
    const safeCount = Math.max(1, Number(count) || 1);
    const safeWidth = Math.max(120, Number(width) || 360);
    const edge = 24;
    const usableWidth = Math.max(60, safeWidth - edge * 2);

    const lanes = [];
    for (let i = 0; i < safeCount; i += 1) {
      const lane = safeCount > 1 ? i / (safeCount - 1) : .5;
      const jitter = (Math.random() * 42) - 21;
      lanes.push(clamp(edge + lane * usableWidth + jitter, 18, safeWidth - 18));
    }

    for (let i = lanes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = lanes[i];
      lanes[i] = lanes[j];
      lanes[j] = temp;
    }

    return lanes;
  }

  function spawnDollarExplosion(card, burstIndex = 0, durationMs = 950, style = "classic") {
    if (!card) return;

    const count = style === "confetti" ? 26 : (style === "popcorn" ? 28 : 22);
    const centerX = card.clientWidth / 2;
    const centerY = card.clientHeight / 2;

    for (let i = 0; i < count; i += 1) {
      const scale = dollarExplosionScale(card);
      const path = dollarExplosionPath(style, i, count, burstIndex, scale);
      const bill = document.createElement("img");
      bill.className = "wob-dollar-bill";
      bill.src = DOLLAR_BILL_IMAGE;
      bill.alt = "";
      bill.draggable = false;
      bill.style.left = `${centerX}px`;
      bill.style.top = `${centerY}px`;
      bill.style.setProperty("--x1", `${path.x1}px`);
      bill.style.setProperty("--y1", `${path.y1}px`);
      bill.style.setProperty("--x2", `${path.x2}px`);
      bill.style.setProperty("--y2", `${path.y2}px`);
      bill.style.setProperty("--rot1", `${path.rot1}deg`);
      bill.style.setProperty("--rot2", `${path.rot2}deg`);
      bill.style.setProperty("--scale", String(path.scale));
      bill.style.setProperty("--duration", `${durationMs}ms`);
      bill.style.setProperty("--delay", `${path.delay || 0}ms`);
      card.appendChild(bill);
      setTimeout(() => bill.remove(), durationMs + (path.delay || 0) + 40);
    }
  }

  function dollarExplosionScale(card){
    if (!card) return 1.6;
    const shortSide = Math.min(card.clientWidth || 360, card.clientHeight || 520);
    return clamp(shortSide / 280, 1.45, 2.35);
  }

  function scaleExplosionPath(path, scale){
    const finalX = path.x2 * scale;
    const finalY = path.y2 * scale;
    return {
      ...path,
      x1:finalX * .52,
      y1:finalY * .52,
      x2:finalX,
      y2:finalY
    };
  }

  function dollarExplosionPath(style, i, count, burstIndex, scale = 1.6) {
    const path = style === "confetti"
      ? confettiExplosionPath(i, count, burstIndex)
      : style === "popcorn"
        ? popcornExplosionPath(i, count, burstIndex)
        : classicExplosionPath(i, count, burstIndex);

    return scaleExplosionPath(path, scale);
  }

  function classicExplosionPath(i, count, burstIndex) {
    const angle = -90 + burstIndex * 17 + (360 / count) * i + (Math.random() * 4 - 2);
    const radians = angle * Math.PI / 180;
    const distance1 = 150 + (i % 3) * 34;
    const distance2 = distance1 + 190 + burstIndex * 18;
    return {
      x1: Math.cos(radians) * distance1,
      y1: Math.sin(radians) * distance1,
      x2: Math.cos(radians) * distance2,
      y2: Math.sin(radians) * distance2,
      rot1: angle + 90 + (Math.random() * 20 - 10),
      rot2: angle + 180 + (Math.random() * 28 - 14),
      scale: 0.76 + (i % 4) * 0.07,
      delay: 0
    };
  }

  function confettiExplosionPath(i, count, burstIndex) {
    const row = (i % 5) - 2;
    const side = i % 2 === 0 ? -1 : 1;
    const lane = Math.floor(i / 2);
    const x1 = side * (115 + lane * 22);
    const y1 = row * 42 - 82 + (i % 3) * 10;
    return {
      x1,
      y1,
      x2: x1 * 1.9,
      y2: y1 + 120 + burstIndex * 14,
      rot1: side * (95 + lane * 13),
      rot2: side * (190 + lane * 20),
      scale: 0.72 + (i % 4) * 0.07,
      delay: 0
    };
  }

  function popcornExplosionPath(i, count, burstIndex) {
    const angle = -90 + burstIndex * 14 + (360 / count) * i + (Math.random() * 6 - 3);
    const radians = angle * Math.PI / 180;
    const distance1 = 142 + Math.sin(i * 1.7) * 48;
    const distance2 = distance1 + 175 + (i % 3) * 22;
    return {
      x1: Math.cos(radians) * distance1,
      y1: Math.sin(radians) * distance1,
      x2: Math.cos(radians) * distance2,
      y2: Math.sin(radians) * distance2 + 38,
      rot1: angle + 90 + (Math.random() * 24 - 12),
      rot2: angle + 190 + (Math.random() * 34 - 17),
      scale: 0.72 + (i % 4) * 0.07,
      delay: i * 14
    };
  }

  function revealedCountForWord(word){ return word.letters.filter(item => item.isLetter && state.revealedLetters.has(item.normalized)).length; }
  function alphaCountForWord(word){ return word.letters.filter(item => item.isLetter).length; }

  function chooseChallengeTarget(){
    const progress = state.uniqueLetters.length ? state.revealedLetters.size / state.uniqueLetters.length : 0;
    if (!state.refChallengeDone.book && state.turnCount >= 2 && state.referenceMeta?.book) return makeReferenceChallenge("book");
    if (!state.refChallengeDone.chapter && state.turnCount >= 4 && Number.isFinite(Number(state.referenceMeta?.chapter))) return makeReferenceChallenge("chapter");
    if (!state.refChallengeDone.verse && state.turnCount >= 6 && Number.isFinite(Number(state.referenceMeta?.verse))) return makeReferenceChallenge("verse");
    if (!state.refChallengeDone.book && progress >= .22 && state.referenceMeta?.book) return makeReferenceChallenge("book");
    if (!state.refChallengeDone.chapter && progress >= .44 && Number.isFinite(Number(state.referenceMeta?.chapter))) return makeReferenceChallenge("chapter");
    if (!state.refChallengeDone.verse && progress >= .62 && Number.isFinite(Number(state.referenceMeta?.verse))) return makeReferenceChallenge("verse");
    return chooseWordChallenge();
  }

  function chooseWordChallenge(){
    const candidates = state.words.filter(word => {
      const alpha = alphaCountForWord(word);
      if (alpha < 3) return false;
      const revealed = revealedCountForWord(word);
      const last = state.challengeHistory.get(word.index);
      if (last !== undefined && revealed <= last) return false;
      return true;
    });
    if (!candidates.length) return null;
    candidates.sort((a,b) => {
      const ak = a.isKeyword ? 1 : 0, bk = b.isKeyword ? 1 : 0;
      if (bk !== ak) return bk - ak;
      const ar = revealedCountForWord(a), br = revealedCountForWord(b);
      if (br !== ar) return br - ar;
      return alphaCountForWord(b) - alphaCountForWord(a);
    });
    const pool = candidates.slice(0, Math.min(5, candidates.length));
    const word = pool[Math.floor(Math.random() * pool.length)];
    return makeWordChallenge(word);
  }

  function findEchoContext(word){
    const target = normalizeWord(word.display);
    const parts = state.echoParts.length ? state.echoParts : [state.verseText];
    for (const part of parts){
      const tokens = tokenizeVerse(part);
      let found = false;
      const html = tokens.map(token => {
        if (token.kind === "space") return " ";
        if (token.kind === "punct") return escapeHtml(token.text);
        if (!found && normalizeWord(token.text) === target){
          found = true;
          const blanks = "_".repeat(Math.max(3, normalizeLetters(token.text).length));
          return `<span class="wob-context-blank">${escapeHtml(blanks)}</span>`;
        }
        return escapeHtml(token.text);
      }).join("");
      if (found) return html;
    }
    return `Complete the word: <span class="wob-context-blank">${"_".repeat(Math.max(3, normalizeLetters(word.display).length))}</span>`;
  }

  function hexToRgb(hex){
    const clean = String(hex || "").trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
    return {
      r:parseInt(clean.slice(0,2), 16),
      g:parseInt(clean.slice(2,4), 16),
      b:parseInt(clean.slice(4,6), 16)
    };
  }

  function colorDistance(a, b){
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return 999;
    const dr = ca.r - cb.r;
    const dg = ca.g - cb.g;
    const db = ca.b - cb.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function challengeDisplayColor(originalColor){
    const choiceTileColor = "#fff7db";
    const color = originalColor || "#ffc751";

    // If the word display is too close to the cream/yellow choice tiles,
    // switch it to purple so kids can tell the display from the tap targets.
    if (colorDistance(color, choiceTileColor) < 130) return "#7f66c6";

    // Orange/yellow tiles can still feel close to the choice tiles even when
    // the raw color distance is not tiny, so move those to purple too.
    const warmConfusingColors = new Set(["#ffc751", "#ff9e3d", "#ffe382"]);
    if (warmConfusingColors.has(String(color).toLowerCase())) return "#7f66c6";

    return color;
  }

  function makeWordChallenge(word){
    const expected = normalizeLetters(word.display).split("");
    return {
      type:"word",
      wordIndex:word.index,
      word,
      expected,
      inputKind:"letters",
      title:word.isKeyword ? "Key Word Challenge" : "Word Challenge",
      prompt:"Build the missing word from this part of the verse.",
      contextHtml:findEchoContext(word),
      color:challengeDisplayColor(word.color),
      bonus:(word.isKeyword ? 900 : 550) + Math.min(800, expected.length * 100)
    };
  }

  function splitBookForChallenge(book){
    const text = String(book || "").trim();
    const match = text.match(/^(\d+)\s+(.+)$/);
    if (match) return { fixedPrefix:match[1], fillText:match[2] };
    return { fixedPrefix:"", fillText:text };
  }

  function makeReferenceChallenge(kind){
    const meta = state.referenceMeta || {};
    if (kind === "book"){
      const parts = splitBookForChallenge(meta.book || "");
      const expected = normalizeLetters(parts.fillText).split("");
      if (!expected.length) return null;
      return {
        type:"reference", refKind:"book", inputKind:"letters", expected,
        title:"Book Challenge", prompt:"What book is this from?",
        fixedPrefix:parts.fixedPrefix, displayText:parts.fillText, color:"#fff6d8", bonus:1200 + Math.min(1000, expected.length * 100)
      };
    }
    if (kind === "chapter"){
      const chapter = String(meta.chapter || "");
      const expected = normalizeDigits(chapter).split("");
      if (!expected.length) return null;
      return { type:"reference", refKind:"chapter", inputKind:"numbers", expected, title:"Chapter Challenge", prompt:"What chapter is this verse from?", displayText:chapter, color:"#fff6d8", bonus:1000 + expected.length * 300 };
    }
    const verseStart = String(meta.verse || "");
    const verseEnd = meta.verseEnd == null ? "" : String(meta.verseEnd);
    const displayText = verseEnd ? `${verseStart}-${verseEnd}` : verseStart;
    const expected = normalizeDigits(displayText).split("");
    if (!expected.length) return null;
    return { type:"reference", refKind:"verse", inputKind:"numbers", expected, title:"Verse Number Challenge", prompt:verseEnd ? "What verse numbers are these?" : "What verse number is this?", displayText, color:"#fff6d8", bonus:1000 + expected.length * 300 };
  }

  function renderWigglingVerse(challenge){
    state.screen = "findWord";
    state.currentChallenge = challenge;
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        ${verseBoardHtml({ challenge })}
      </div>
    `, { status:"Find Tile", rootClass:"is-board-screen is-find-screen" });
    wireGameMenu(); fitVerseBoardSoon();
    const selector = challenge.type === "reference" ? `[data-ref-kind="${challenge.refKind}"]` : `[data-word-index="${challenge.wordIndex}"]`;
    document.querySelector(selector)?.addEventListener("click", () => renderChallenge(challenge));
  }

  function makeChoiceLetters(correctLetters, sourceLetters, targetCount = 9){
    const out = [], seen = new Set();
    for (const letter of correctLetters){ if (!letter || seen.has(letter)) continue; out.push(letter); seen.add(letter); }
    const decoys = (sourceLetters || state.uniqueLetters).filter(letter => letter && !seen.has(letter));
    shuffle(decoys);
    for (const letter of decoys){ if (out.length >= targetCount) break; out.push(letter); seen.add(letter); }
    while (out.length < targetCount){
      const bag = correctLetters.every(ch => /^[0-9]$/.test(ch)) ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const letter = bag[Math.floor(Math.random() * bag.length)];
      if (!seen.has(letter)){ out.push(letter); seen.add(letter); }
    }
    return shuffle(out);
  }

  function shuffle(items){
    const copy = Array.isArray(items) ? items.slice() : [];
    for (let i=copy.length-1; i>0; i-=1){ const j = Math.floor(Math.random()*(i+1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }

  function choiceRowPattern(count) {
    const n = Math.max(0, Number(count) || 0);
    if (n <= 5) return [n].filter(Boolean);
    if (n === 6) return [3, 3];
    if (n === 7) return [4, 3];
    if (n === 8) return [4, 4];
    if (n === 9) return [5, 4];
    if (n === 10) return [5, 5];
    if (n === 11) return [4, 4, 3];
    if (n === 12) return [4, 4, 4];
    if (n === 13) return [5, 4, 4];
    if (n === 14) return [5, 5, 4];
    if (n === 15) return [5, 5, 5];
    if (n === 16) return [4, 4, 4, 4];
    if (n === 17) return [5, 4, 4, 4];
    if (n === 18) return [5, 5, 4, 4];
    if (n === 19) return [5, 5, 5, 4];
    if (n === 20) return [5, 5, 5, 5];

    const rows = [];
    let left = n;
    while (left > 0) {
      const size = Math.min(5, left);
      rows.push(size);
      left -= size;
    }
    return rows;
  }

  function choiceRowsHtml(choices, flashValue, isBad, dataName) {
    const items = Array.isArray(choices) ? choices : [];
    const rows = choiceRowPattern(items.length);
    let offset = 0;

    return rows.map(rowSize => {
      const row = items.slice(offset, offset + rowSize);
      offset += rowSize;
      return `<div class="wob-choice-row">${row.map(letter => `<button class="wob-choice-tile no-zoom ${flashValue === letter ? (isBad ? "is-bad" : "is-good") : ""}" data-${dataName}="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`).join("")}</div>`;
    }).join("");
  }

  function renderChallenge(challenge = state.currentChallenge){
    if (!challenge) return renderSpinScreen();
    state.screen = "challenge";
    state.currentChallenge = challenge;
    state.challengeInputIndex = 0; state.challengeFlash = ""; state.challengeBad = false;
    const uniqueCorrect = Array.from(new Set(challenge.expected));
    const targetCount = challenge.inputKind === "numbers" ? 10 : Math.max(10, uniqueCorrect.length);
    challenge.choices = challenge.inputKind === "numbers"
      ? shuffle(["0","1","2","3","4","5","6","7","8","9"])
      : makeChoiceLetters(uniqueCorrect, state.uniqueLetters, targetCount);
    drawChallenge();
  }

  function drawChallenge(){
    const challenge = state.currentChallenge;
    const choiceClass = challenge.choices.length > 9 || challenge.inputKind === "numbers" ? "is-wide" : "";
    const showPrompt = challenge.type === "reference";
    app.innerHTML = rootHtml(`
      <div class="wob-word-challenge-root">
        <div class="wob-big-title">${escapeHtml(challenge.title || "Challenge")}</div>
        ${showPrompt ? `<div class="wob-challenge-prompt">${escapeHtml(challenge.prompt || "Build the answer.")}</div>` : ""}
        ${challenge.contextHtml ? `<div class="wob-context-card">${challenge.contextHtml}</div>` : ""}
        ${typedChallengeHtml(challenge, state.challengeInputIndex)}
        <div class="wob-choice-grid is-rowed ${choiceClass}">
          ${choiceRowsHtml(challenge.choices, state.challengeFlash, state.challengeBad, "choice")}
        </div>
        <div class="wob-bonus-line">Tap the Letters in Order</div>
      </div>
    `, { status:"Challenge", rootClass:"is-challenge-screen" });
    wireGameMenu();
    document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => handleChallengeChoice(btn.dataset.choice || "")));
  }

  function typedChallengeHtml(challenge, filledCount){
    if (challenge.type === "reference" && challenge.refKind === "book"){
      return `<div class="wob-challenge-word ${state.challengeBad ? "is-no" : ""}" id="challengeWord" style="--challenge-count:${Math.max(1, challenge.expected.length + (challenge.fixedPrefix ? 1 : 0))}">
        ${challenge.fixedPrefix ? `<span class="wob-ref-fixed">${escapeHtml(challenge.fixedPrefix)}</span>` : ""}
        ${lettersToTiles(challenge.displayText, challenge.expected, filledCount, challenge.color)}
      </div>`;
    }
    if (challenge.type === "reference"){
      let digitIndex = 0;
      return `<div class="wob-challenge-word ${state.challengeBad ? "is-no" : ""}" id="challengeWord" style="--challenge-count:${Math.max(1, String(challenge.displayText || "").length)}">
        ${Array.from(String(challenge.displayText || "")).map(char => {
          if (/\d/.test(char)){
            const show = digitIndex < filledCount;
            const text = show ? challenge.expected[digitIndex] : "";
            digitIndex += 1;
            return `<span class="wob-tile ${show ? "" : "is-hidden"}" style="--tile-bg:${challenge.color}">${escapeHtml(text)}</span>`;
          }
          return `<span class="wob-punct">${escapeHtml(char)}</span>`;
        }).join("")}
      </div>`;
    }
    return `<div class="wob-challenge-word ${state.challengeBad ? "is-no" : ""}" id="challengeWord" style="--challenge-count:${Math.max(1, challenge.expected.length)}">${lettersToTiles(challenge.word.display, challenge.expected, filledCount, challenge.color)}</div>`;
  }

  function lettersToTiles(displayText, expected, filledCount, color){
    let alphaIndex = 0;
    return Array.from(String(displayText || "")).map(char => {
      if (/[A-Za-z]/.test(char)){
        const show = alphaIndex < filledCount;
        const text = show ? expected[alphaIndex] : "";
        alphaIndex += 1;
        return `<span class="wob-tile ${show ? "" : "is-hidden"}" style="--tile-bg:${color || "#ffc751"}">${escapeHtml(text)}</span>`;
      }
      if (/\s/.test(char)) return `<span class="wob-space"> </span>`;
      return `<span class="wob-punct">${escapeHtml(char)}</span>`;
    }).join("");
  }

  async function handleChallengeChoice(letter){
    const challenge = state.currentChallenge;
    if (!challenge) return;
    const choice = challenge.inputKind === "numbers" ? normalizeDigits(letter).charAt(0) : normalizeLetters(letter).charAt(0);
    const expected = challenge.expected[state.challengeInputIndex];
    if (!expected) return;
    if (choice !== expected){
      state.challengeFlash = choice; state.challengeBad = true; playBad();
      document.getElementById("challengeWord")?.classList.add("is-no");
      await sleep(300);
      state.challengeFlash = ""; state.challengeBad = false; drawChallenge(); return;
    }
    playGood(); state.challengeFlash = choice; state.challengeBad = false; state.challengeInputIndex += 1;
    if (state.challengeInputIndex >= challenge.expected.length){
      if (challenge.type === "word") state.challengeHistory.set(challenge.wordIndex, revealedCountForWord(challenge.word));
      if (challenge.type === "reference") state.refChallengeDone[challenge.refKind] = true;
      const bonus = Math.max(0, Number(challenge.bonus) || 500);
      state.baseCash += bonus;
      updateHud();
      drawChallenge();

      await showChallengeBonusPopup(bonus);

      if (state.revealedLetters.size >= state.uniqueLetters.length) renderFinalIntro();
      else renderSpinScreen();

      return;
    }
    drawChallenge();
  }

  function verseBoardHtml({ allVisible = false, revealingLetter = "", animatingLetter = "", challenge = null, finalMode = false } = {}){
    return `
      <div class="wob-verse-card is-with-reference">
        <div class="wob-verse-board ${finalMode ? "wob-final-board" : ""}" id="wobVerseBoard">
          ${state.tokens.map(token => {
            if (token.kind === "space") return `<span class="wob-space"> </span>`;
            if (token.kind === "punct") return `<span class="wob-punct">${escapeHtml(token.text)}</span>`;
            const word = state.words[token.wordIndex]; if (!word) return "";
            const isChallenge = challenge?.type === "word" && challenge.wordIndex === word.index;
            const solved = state.finalSolvedWordIndices.has(word.index);
            const tag = isChallenge || finalMode ? "button" : "span";
            const attrs = tag === "button" ? `type="button" data-word-index="${word.index}"` : `data-word-index="${word.index}"`;
            return `<${tag} class="wob-word ${isChallenge ? "is-wiggling" : ""} ${solved ? "is-solved" : ""}" ${attrs} style="--word-color:${word.color}">
              ${word.letters.map(item => {
                if (!item.isLetter) return `<span class="wob-punct">${escapeHtml(item.char)}</span>`;
                const hidden = finalMode ? true : (!allVisible && !state.revealedLetters.has(item.normalized));
                const revealing = revealingLetter && item.normalized === revealingLetter ? "is-revealing" : "";
                const tileKey = `${word.index}-${item.index}`;
                const animating = animatingLetter && item.normalized === animatingLetter ? "is-pending-reveal" : "";
                return `<span class="wob-tile ${hidden ? "is-hidden" : ""} ${revealing} ${animating}" data-tile-key="${escapeHtml(tileKey)}" data-normalized="${escapeHtml(item.normalized)}" style="--tile-bg:${word.color}">${hidden ? "" : escapeHtml(item.normalized)}</span>`;
              }).join("")}
            </${tag}>`;
          }).join("")}
          ${referenceTilesHtml(challenge)}
        </div>
      </div>`;
  }

  function referenceTilesHtml(challenge){
    const meta = state.referenceMeta || {};
    const bookText = String(meta.book || "").trim();
    const chapter = meta.chapter == null ? "" : String(meta.chapter);
    const verseText = meta.verse == null ? "" : (meta.verseEnd ? `${meta.verse}-${meta.verseEnd}` : String(meta.verse));
    if (!bookText && !chapter && !verseText) return "";

    const bookClass = challenge?.type === "reference" && challenge.refKind === "book" ? "is-wiggling" : "";
    const chapterClass = challenge?.type === "reference" && challenge.refKind === "chapter" ? "is-wiggling" : "";
    const verseClass = challenge?.type === "reference" && challenge.refKind === "verse" ? "is-wiggling" : "";

    const bookTag = bookClass ? "button" : "span";
    const chapterTag = chapterClass ? "button" : "span";
    const verseTag = verseClass ? "button" : "span";

    return `<span class="wob-ref-board" id="wobReferenceBoard">
      ${bookText ? `<${bookTag} class="wob-ref-group ${bookClass}" ${bookClass ? 'type="button" data-ref-kind="book"' : ''}><span class="wob-ref-tile is-book">${escapeHtml(bookText)}</span></${bookTag}>` : ""}
      ${chapter ? `<${chapterTag} class="wob-ref-group ${chapterClass}" ${chapterClass ? 'type="button" data-ref-kind="chapter"' : ''}><span class="wob-ref-tile">${escapeHtml(chapter)}</span></${chapterTag}>` : ""}
      ${verseText ? `<${verseTag} class="wob-ref-group ${verseClass}" ${verseClass ? 'type="button" data-ref-kind="verse"' : ''}><span class="wob-ref-tile">${escapeHtml(verseText)}</span></${verseTag}>` : ""}
    </span>`;
  }

  function fitVerseBoardSoon(){
    if (currentFitRaf) cancelAnimationFrame(currentFitRaf);
    currentFitRaf = requestAnimationFrame(() => { currentFitRaf = 0; fitVerseBoard(); });
  }
  function fitVerseBoard(){
    const board = document.getElementById("wobVerseBoard");
    const card = board?.closest(".wob-verse-card");
    if (!board || !card) return;
    const box = card.getBoundingClientRect();
    const fitHeight = Math.max(80, box.height);
    const letterCount = state.words.reduce((sum, word) => sum + word.letters.length, 0);
    let size = clamp(Math.sqrt((box.width * fitHeight) / Math.max(24, letterCount)) * 1.38, 18, 56);
    const apply = (tileSize, lineGap) => {
      board.style.setProperty("--wob-tile-size", `${tileSize}px`);
      board.style.setProperty("--wob-tile-gap", `${Math.max(2, tileSize * .12)}px`);
      board.style.setProperty("--wob-line-gap", `${lineGap}px`);
    };
    let lineGap = Math.max(6, size * .32);
    for (let i=0; i<28; i+=1){
      apply(size, lineGap);
      const over = board.scrollHeight > fitHeight - 2 || board.scrollWidth > box.width - 2;
      if (!over) break;
      size -= 1.5; lineGap = Math.max(4, size * .25); if (size <= 13) break;
    }
    const extra = Math.max(0, (fitHeight - board.scrollHeight) / Math.max(1, Math.ceil(state.words.length / 4)));
    if (extra > 8) apply(size, Math.min(size * .72, lineGap + extra * .38));
  }
  window.addEventListener("resize", fitVerseBoardSoon);
  window.addEventListener("orientationchange", () => setTimeout(fitVerseBoardSoon, 250));

  function renderFinalIntro(){
    clearTimers(); state.screen = "finalIntro";
    app.innerHTML = rootHtml(`
      <div class="wob-panel wob-final-intro-panel">
        <div class="wob-final-intro-center">
          <div class="wob-big-title">FINAL ROUND!</div>
          <div class="wob-subtitle">One minute to fill in as many missing words as possible.</div>
        </div>
        <button class="wob-btn no-zoom" id="startFinalBtn" type="button">Start Final Round</button>
      </div>
    `, { status:"Final Round", rootClass:"is-final-intro-screen" });
    wireGameMenu(); document.getElementById("startFinalBtn")?.addEventListener("click", startFinalRound);
  }

  function startFinalRound(){
    state.screen = "finalRound"; state.finalStartedAt = Date.now(); state.finalTimeLeft = 60; state.finalSolvedWordIndices = new Set(); state.finalActiveWord = null; state.finalInputIndex = 0; state.finalLetterStreak = 0;
    renderFinalRound();
    finalTimerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.finalStartedAt) / 1000);
      state.finalTimeLeft = Math.max(0, 60 - elapsed);
      const timer = document.getElementById("finalTimer"); if (timer) timer.textContent = String(state.finalTimeLeft);
      if (state.finalTimeLeft <= 0) finishFinalRound();
    }, 250);
  }

  function renderFinalRound(){
    app.innerHTML = rootHtml(`
      <div class="wob-verse-wrap">
        <div class="wob-final-hud"><div class="wob-final-timer"><span id="finalTimer">${escapeHtml(String(state.finalTimeLeft))}</span>s</div><div class="wob-subtitle">Tap words and rebuild them!</div></div>
        ${verseBoardHtml({ finalMode:true })}
      </div>
    `, { status:"Final Round", rootClass:"is-board-screen is-final-round-screen" });
    wireGameMenu(); fitVerseBoardSoon();
    document.querySelectorAll("[data-word-index]").forEach(btn => btn.addEventListener("click", () => {
      const index = Number(btn.dataset.wordIndex); if (state.finalSolvedWordIndices.has(index)) return; openFinalWord(index);
    }));
  }

  function openFinalWord(wordIndex){
    const word = state.words[wordIndex]; if (!word || state.finalTimeLeft <= 0) return;
    state.finalActiveWord = { wordIndex, word, expected:normalizeLetters(word.display).split("") };
    state.finalInputIndex = 0; state.finalLetterStreak = 0; state.finalFlash = ""; state.finalBad = false; renderFinalModal();
  }

  function renderFinalModal(){
    const active = state.finalActiveWord; if (!active) return;
    const uniqueCorrect = Array.from(new Set(active.expected));
    const targetCount = Math.max(9, Math.min(24, uniqueCorrect.length + 6));
    if (!active.choices) active.choices = makeChoiceLetters(uniqueCorrect, state.uniqueLetters, targetCount);
    const modal = document.createElement("div"); modal.className = "wob-final-modal"; modal.id = "wobFinalModal";
    modal.innerHTML = `<div class="wob-final-modal-panel"><div class="wob-big-title">Type the Word</div>${finalWordHtml(active)}<div class="wob-choice-grid is-wide">${active.choices.map(letter => `<button class="wob-choice-tile no-zoom ${state.finalFlash === letter ? (state.finalBad ? "is-bad" : "is-good") : ""}" data-final-choice="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`).join("")}</div><div class="wob-bonus-line">Streak: ${escapeHtml(String(state.finalLetterStreak))} • Next: ${escapeHtml(formatMoney((state.finalLetterStreak + 1) * 100))}</div></div>`;
    document.getElementById("wobFinalModal")?.remove(); document.querySelector(".wob-card")?.appendChild(modal);
    modal.querySelectorAll("[data-final-choice]").forEach(btn => btn.addEventListener("click", () => handleFinalChoice(btn.dataset.finalChoice || "")));
  }

  function finalWordHtml(active){
    return `<div class="wob-challenge-word ${state.finalBad ? "is-no" : ""}" id="finalWordDisplay" style="--challenge-count:${Math.max(1, active.expected.length)}">${lettersToTiles(active.word.display, active.expected, state.finalInputIndex, active.word.color)}</div>`;
  }

  async function handleFinalChoice(letter){
    const active = state.finalActiveWord; if (!active || state.finalTimeLeft <= 0) return;
    const choice = normalizeLetters(letter).charAt(0); const expected = active.expected[state.finalInputIndex]; if (!expected) return;
    if (choice !== expected){
      state.finalLetterStreak = 0; state.finalFlash = choice; state.finalBad = true; playBad(); renderFinalModal(); await sleep(260); state.finalFlash = ""; state.finalBad = false; renderFinalModal(); return;
    }
    state.finalLetterStreak += 1; const earned = state.finalLetterStreak * 100; state.finalCash += earned; state.finalInputIndex += 1; state.finalFlash = choice; state.finalBad = false; updateHud(); playGood();
    if (state.finalInputIndex >= active.expected.length){
      state.finalSolvedWordIndices.add(active.wordIndex); document.getElementById("wobFinalModal")?.remove(); state.finalActiveWord = null; renderFinalRound(); return;
    }
    renderFinalModal();
  }

  function finishFinalRound(){
    if (finalTimerId){ clearInterval(finalTimerId); finalTimerId = null; }
    document.getElementById("wobFinalModal")?.remove(); renderMoneyTotalScreen();
  }

  async function renderMoneyTotalScreen(){
    clearTimers(); state.screen = "moneyTotal";
    const normalTotal = state.baseCash + state.finalCash;
    app.innerHTML = rootHtml(`
      <div class="wob-panel wob-money-panel">
        <div class="wob-money-center">
          <div class="wob-big-title">Money Total</div>
          <div class="wob-money-total" id="moneyCount">$0</div>
          <div class="wob-prize-list" id="prizeList"></div>
        </div>
        <button class="wob-btn no-zoom" id="completeBtn" type="button" style="display:none">Complete</button>
      </div>
    `, { status:"Total", rootClass:"is-money-screen" });
    wireGameMenu(); await animateMoneyCount(document.getElementById("moneyCount"), 0, normalTotal, 1400);
    const prizeList = document.getElementById("prizeList"); let running = normalTotal;
    for (const prize of state.prizeEarnings){
      const card = document.createElement("div"); card.className = "wob-prize-card"; card.textContent = `${prize.emoji} ${prize.name} +${formatMoney(prize.total)}`; prizeList?.appendChild(card);
      playPrize(); await animateMoneyCount(document.getElementById("moneyCount"), running, running + prize.total, 520); running += prize.total; await sleep(160);
    }
    document.getElementById("completeBtn").style.display = "inline-flex";
    document.getElementById("completeBtn")?.addEventListener("click", renderComplete);
  }

  function animateMoneyCount(el, from, to, ms){
    return new Promise(resolve => {
      if (!el) return resolve(); const start = performance.now(); const duration = Math.max(120, Number(ms) || 500);
      const step = now => {
        const t = clamp((now - start) / duration, 0, 1); const eased = 1 - Math.pow(1 - t, 3); const value = from + (to - from) * eased; el.textContent = formatMoney(value);
        if (t < 1){ if (Math.random() < .18) playTone({ midi:72 + Math.floor(Math.random() * 7), duration:.035, volume:.07 }); requestAnimationFrame(step); }
        else { el.textContent = formatMoney(to); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }

  async function markVersePracticed(){
    const verseId = ctx.verseId; if (!verseId) return { ok:false };
    if (typeof bridge().markVersePracticed === "function"){
      try { return bridge().markVersePracticed({ verseId }); }
      catch(err){ console.warn("Wheel of Bible bridge markVersePracticed failed", err); }
    }
    return { ok:false };
  }

  async function renderComplete(){
    if (state.completed) return; state.completed = true; await markVersePracticed();
    const statsText = `${formatMoney(totalCash())} earned • ${state.finalSolvedWordIndices.size} final words rebuilt`;
    if (shell().renderCompleteScreen){
      shell().renderCompleteScreen({
        app, title:"Wheel Complete!", icon:"🎡", iconHtml:WHEEL_ICON_HTML, statsText, playAgainText:"Play Again", moreGamesText:"Back to Playground", backLabel:"Back to Playground", theme:GAME_THEME,
        onPlayAgain:() => beginRun(), onMoreGames:() => bridge().exitGame?.()
      });
    } else {
      app.innerHTML = `<div class="wob-root"><div class="wob-panel"><div class="wob-big-title">Complete!</div><button class="wob-btn" id="backBtn">Back</button></div></div>`;
      document.getElementById("backBtn")?.addEventListener("click", () => bridge().exitGame?.());
    }
  }

  renderIntro();
})();
