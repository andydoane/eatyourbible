(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_jam";
  const GAME_TITLE = "Verse Jam";
  const GAME_ICON = "🎵";
  const HELP_OVERLAY_ID = "verseJamHelpOverlay";
  const BUILD_AREA = "large";

  const GAME_THEME = {
    bg: "#2b1748",
    accent: "#8df7ff",
    helpTitleBg: "#8df7ff",
    helpTitleColor: "#221447",
    helpCloseBg: "#ffe27a",
    helpCloseColor: "#221447"
  };

  const MODES = [
    { id: "beginner", label: "Beginner" },
    { id: "advanced", label: "Advanced" }
  ];

  const INTRO_WORDS = ["tap", "the", "words", "to", "the", "beat"];
  const BASE_MELODY = [60, 62, 64, 67, 69, 72, 69, 67, 64, 62, 60, 67];
  const PAD_NOTES = [48, 55, 60];
  const SAMPLE_BASE_URL = "./sounds/";

  const DRUM_LOOPS = {
    basic: {
      id: "chip_bounce_basic",
      bpm: 92,
      beatsPerBar: 4,
      stepsPerBeat: 4,
      lengthBeats: 4,
      samples: {
        kick: "kick-10.mp3",
        snare: "openhat-6.mp3",
        hat: "hihat-2.mp3",
        extra: "perc-9.mp3"
      },
      events: [
        { beat: 0, sound: "hat", volume: 0.2 },
        { beat: 0, sound: "kick", volume: 1 },
        { beat: 0.5, sound: "hat", volume: 0.2 },
        { beat: 1, sound: "hat", volume: 0.2 },
        { beat: 1, sound: "snare", volume: 1 },
        { beat: 1.5, sound: "hat", volume: 0.2 },
        { beat: 2, sound: "hat", volume: 0.2 },
        { beat: 2, sound: "kick", volume: 1 },
        { beat: 2.5, sound: "hat", volume: 0.2 },
        { beat: 3, sound: "hat", volume: 0.2 },
        { beat: 3, sound: "snare", volume: 1 },
        { beat: 3.5, sound: "hat", volume: 0.2 }
      ]
    },
    middle: {
      id: "chip_bounce_middle",
      bpm: 92,
      beatsPerBar: 4,
      stepsPerBeat: 4,
      lengthBeats: 4,
      samples: {
        kick: "kick-10.mp3",
        snare: "openhat-6.mp3",
        hat: "hihat-2.mp3",
        extra: "perc-9.mp3"
      },
      events: [
        { beat: 0, sound: "hat", volume: 0.2 },
        { beat: 0, sound: "kick", volume: 1 },
        { beat: 0.5, sound: "hat", volume: 0.2 },
        { beat: 1, sound: "hat", volume: 0.2 },
        { beat: 1, sound: "snare", volume: 1 },
        { beat: 1.5, sound: "hat", volume: 0.2 },
        { beat: 1.5, sound: "kick", volume: 1 },
        { beat: 2, sound: "hat", volume: 0.2 },
        { beat: 2, sound: "kick", volume: 1 },
        { beat: 2.5, sound: "hat", volume: 0.2 },
        { beat: 3, sound: "hat", volume: 0.2 },
        { beat: 3, sound: "snare", volume: 1 },
        { beat: 3.5, sound: "hat", volume: 0.2 },
        { beat: 3.75, sound: "snare", volume: 1 }
      ]
    },
    final: {
      id: "chip_bounce_final",
      bpm: 92,
      beatsPerBar: 4,
      stepsPerBeat: 4,
      lengthBeats: 4,
      samples: {
        kick: "kick-10.mp3",
        snare: "openhat-6.mp3",
        hat: "hihat-2.mp3",
        extra: "perc-9.mp3"
      },
      events: [
        { beat: 0, sound: "hat", volume: 0.2 },
        { beat: 0, sound: "kick", volume: 1 },
        { beat: 0.5, sound: "hat", volume: 0.2 },
        { beat: 0.75, sound: "kick", volume: 1 },
        { beat: 1, sound: "hat", volume: 0.2 },
        { beat: 1, sound: "kick", volume: 1 },
        { beat: 1, sound: "snare", volume: 1 },
        { beat: 1.5, sound: "hat", volume: 0.2 },
        { beat: 1.75, sound: "kick", volume: 1 },
        { beat: 2, sound: "hat", volume: 0.2 },
        { beat: 2.5, sound: "hat", volume: 0.2 },
        { beat: 2.5, sound: "kick", volume: 1 },
        { beat: 3, sound: "hat", volume: 0.2 },
        { beat: 3, sound: "snare", volume: 1 },
        { beat: 3.5, sound: "extra", volume: 0.7 },
        { beat: 3.75, sound: "snare", volume: 1 }
      ]
    }
  };

  const ROUND_CONFIGS = [
    { name: "Warmup", bpm: 92, loop: "basic", cue: "soft", explosion: 1, echo: false, pad: false },
    { name: "Jam", bpm: 92, loop: "middle", cue: "rainbow", explosion: 1.35, echo: true, pad: true },
    { name: "Faster", bpm: 100, loop: "final", cue: "rainbow", explosion: 1.55, echo: true, pad: true },
    { name: "Finale", bpm: 108, loop: "final", cue: "rainbow", explosion: 1.85, echo: true, pad: true }
  ];

  const CHUNK_RHYTHMS = {
    1: [[0]],
    2: [[0, 1]],
    3: [[0, 1, 2], [0, 2, 3]],
    4: [[0, 1, 2, 3], [0, 2, 4, 6]],
    5: [[0, 2, 4, 5, 6], [0, 3, 4, 5, 6], [0, 1, 4, 5, 6]],
    6: [[0, 1, 2, 4, 5, 6], [0, 1, 3, 4, 5, 6], [0, 2, 4, 5, 6, 7]],
    7: [[0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 3, 5, 6, 7], [0, 1, 3, 4, 5, 6, 7]],
    8: [[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 6, 8, 10, 12, 14]]
  };

  const PERFECT_BEAT_TOLERANCE = 0.24;

// Let players tap a little before TAP! so a nearly-on-beat press is not ignored.
const EARLY_INPUT_WINDOW_MS = 250;

  let selectedMode = null;
  let muted = false;
  let audioCtx = null;
  let masterGain = null;
  let compressor = null;
  let sampleGain = null;
  let sampleLoadPromise = null;
  const sampleBuffers = {};
  let beatTimer = null;
  let padTimer = null;
  let musicGeneration = 0;
  const activeAudioSources = new Set();

  const state = {
    screen: "intro",
    phase: "idle",
    verseJson: null,
    words: [],
    segments: [],
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    buildSizeClass: "is-normal",
    progressIndex: 0,
    chunkIndex: 0,
    roundIndex: 0,
    currentButtons: [],
    currentRhythmOffsets: [],
    correctTapBeats: [],
    echoStartBeat: null,
    acceptingInput: false,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    busy: false,
    completed: false,
    startTime: 0,
    buildFitDone: false,
    musicStartTime: 0,
    beatCount: 0,
    nextScheduledBeatTime: 0,
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

  function waitUntilAudioTime(targetTime){
    if (!audioCtx) return Promise.resolve();
    return sleep(Math.max(0, (targetTime - audioCtx.currentTime) * 1000));
  }

  function trackAudioSource(source){
    if (!source) return source;

    activeAudioSources.add(source);
    source.addEventListener?.("ended", () => {
      activeAudioSources.delete(source);
    }, { once: true });

    return source;
  }

  function stopActiveAudioSources(){
    activeAudioSources.forEach((source) => {
      try {
        source.stop(0);
      } catch (err){}
    });
    activeAudioSources.clear();
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeWord(value){
    return window.VerseGameShell.normalizeWord(value);
  }

  function shuffle(items){
    return window.VerseGameShell.shuffle(items);
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
      console.warn("Verse Jam could not load full verse JSON", err);
      return null;
    }
  }

  function initVerseData(){
    const parsed = window.VerseGameShell.parseReferenceParts(
      ctx.verseRef,
      ctx.translation,
      ctx.verseId
    );

    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: parsed.book,
      reference: parsed.reference,
      buildArea: BUILD_AREA
    });

    state.words = buildData.words;
    state.segments = buildData.segments;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.referenceMeta = parsed;
    state.buildSizeClass = buildData.buildSizeClass;
    state.progressIndex = 0;
    state.chunkIndex = 0;
    state.roundIndex = 0;
    state.currentButtons = [];
    state.acceptingInput = false;
    state.busy = false;
    state.completed = false;
    state.buildFitDone = false;
    state.startTime = performance.now();
  }

  function currentRound(){
    return ROUND_CONFIGS[Math.min(state.roundIndex, ROUND_CONFIGS.length - 1)];
  }

  function currentLoop(){
    return DRUM_LOOPS[currentRound().loop] || DRUM_LOOPS.basic;
  }

  function pickPatternForCount(count){
    const patterns = CHUNK_RHYTHMS[Math.max(1, Math.min(8, count))] || CHUNK_RHYTHMS[4];
    return patterns[Math.floor(Math.random() * patterns.length)].slice();
  }

  function measureAlignedLength(offsets){
    const last = offsets.length ? Math.max(...offsets) : 0;
    return Math.ceil((last + 1) / 4) * 4;
  }

  function makeRhythmOffsets(count){
    if (count <= 8) return pickPatternForCount(count);

    const offsets = [];
    let remaining = count;
    let base = 0;

    while (remaining > 0){
      const take = Math.min(8, remaining);
      const pattern = pickPatternForCount(take);
      pattern.forEach(offset => offsets.push(base + offset));
      base += measureAlignedLength(pattern);
      remaining -= take;
    }

    return offsets;
  }

  function beatPositionNow(){
    if (!audioCtx || !state.musicStartTime) return 0;
    return (audioCtx.currentTime - state.musicStartTime) / secondsPerBeat();
  }

  function nearestBeat(value){
    return Math.round(value);
  }

  function secondsPerBeat(){
    return 60 / currentRound().bpm;
  }

  function getPhase(){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function fitVerseJamBuildText(){
    if (state.buildFitDone) return;

    requestAnimationFrame(() => {
      const build = document.getElementById("versejamBuild");
      const text = document.getElementById("versejamBuildText");
      if (!build || !text) return;

      const result = window.VerseGameShell.fitBuildTextOnce({
        buildEl: build,
        textEl: text,
        buildArea: BUILD_AREA
      });

      if (result) state.buildFitDone = true;
    });
  }

  function clearBuildTextFit(text){
    if (!text) return;
    text.style.fontSize = "";
    text.style.lineHeight = "";
    text.style.maxWidth = "";
    text.style.width = "";
    text.style.marginLeft = "";
    text.style.marginRight = "";
    delete text.dataset.vmFitFontSize;
    delete text.dataset.vmFitMaxWidth;
    delete text.dataset.vmFitLineHeight;
    delete text.dataset.vmFitLines;
    delete text.dataset.vmFitArea;
  }

  function renderBuildInnerHtml(){
    if (state.phase === "intro" || state.progressIndex <= 0){
      return `<div class="versejam-build-text vm-build-text" id="versejamBuildText"></div>`;
    }

    const buildRender = window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.bookLabel,
      reference: state.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: false,
      extraClass: "versejam-build-text"
    });

    return `<div class="${buildRender.className}" id="versejamBuildText">${buildRender.html}</div>`;
  }

  function updateBuildText(){
    const text = document.getElementById("versejamBuildText");
    if (!text) return;

    if (state.phase === "intro" || state.progressIndex <= 0){
      clearBuildTextFit(text);
      text.className = "versejam-build-text vm-build-text";
      text.innerHTML = "";
      return;
    }

    const buildRender = window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.bookLabel,
      reference: state.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: false,
      extraClass: "versejam-build-text"
    });

    text.className = buildRender.className;
    text.innerHTML = buildRender.html;
    fitVerseJamBuildText();
  }

  function tokenizeWords(value){
    return window.VerseGameShell.tokenizeVerseWords(String(value || ""));
  }

  function buildChunkWordGroups(){
    const echoParts = Array.isArray(state.verseJson?.echoParts)
      ? state.verseJson.echoParts.filter(part => String(part || "").trim())
      : [];

    if (!echoParts.length){
      const groups = [];
      for (let i = 0; i < state.words.length; i += 6){
        groups.push({ start: i, count: Math.min(6, state.words.length - i) });
      }
      return groups;
    }

    let cursor = 0;
    const groups = [];

    echoParts.forEach((part) => {
      const count = tokenizeWords(part).length;
      if (!count) return;
      groups.push({ start: cursor, count });
      cursor += count;
    });

    if (cursor < state.words.length){
      groups.push({ start: cursor, count: state.words.length - cursor });
    }

    return groups.filter(group => group.count > 0);
  }

  function makeChunkButtons(){
    const phase = getPhase();
    const buttons = [];

    if (phase === "words"){
      const groups = buildChunkWordGroups();
      const group = groups[state.chunkIndex] || { start: state.progressIndex, count: 0 };
      const start = Math.max(state.progressIndex, group.start);
      const end = Math.min(group.start + group.count, state.words.length);

      for (let segmentIndex = start; segmentIndex < end; segmentIndex += 1){
        buttons.push(makeButtonForSegment(segmentIndex));
      }
    } else if (phase === "book"){
      buttons.push(makeButtonForSegment(state.progressIndex));
    } else if (phase === "reference"){
      buttons.push(makeButtonForSegment(state.progressIndex));
    }

    const visible = buttons.filter(Boolean);
    return selectedMode === "advanced" ? shuffle(visible) : visible;
  }

  function makeButtonForSegment(segmentIndex){
    const label = state.segments[segmentIndex];
    if (!label) return null;

    return {
      id: `vj_btn_${state.roundIndex}_${state.chunkIndex}_${segmentIndex}_${Math.floor(Math.random() * 100000)}`,
      label,
      segmentIndex,
      note: BASE_MELODY[segmentIndex % BASE_MELODY.length] + (state.roundIndex >= 2 ? 12 : 0),
      spawned: false,
      removing: false
    };
  }

  async function ensureAudio(){
    if (!audioCtx){
      audioCtx = new AudioContext();

      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : 0.72;

      sampleGain = audioCtx.createGain();
      sampleGain.gain.value = 1.05;

      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 24;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;

      sampleGain.connect(masterGain);
      masterGain.connect(compressor);
      compressor.connect(audioCtx.destination);
    }

    if (audioCtx.state !== "running"){
      await audioCtx.resume();
    }

    await loadSampleBuffers();
  }

  async function loadSampleBuffers(){
    if (!audioCtx) return;
    if (sampleLoadPromise) return sampleLoadPromise;

    const filenames = [...new Set(Object.values(DRUM_LOOPS).flatMap(loop => Object.values(loop.samples || {})))];

    sampleLoadPromise = Promise.all(filenames.map(async (filename) => {
      if (!filename || sampleBuffers[filename]) return;

      try {
        const res = await fetch(`${SAMPLE_BASE_URL}${filename}`, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        sampleBuffers[filename] = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (err){
        console.warn(`Verse Jam could not load drum sample: ${filename}`, err);
        sampleBuffers[filename] = null;
      }
    }));

    return sampleLoadPromise;
  }

  function setMuted(value){
    muted = !!value;
    if (masterGain){
      masterGain.gain.setValueAtTime(muted ? 0 : 0.72, audioCtx.currentTime);
    }
  }

  function midiToFreq(midi){
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone({ midi = 60, when = audioCtx?.currentTime || 0, duration = 0.22, volume = 0.16, type = "triangle" } = {}){
    if (!audioCtx || !masterGain || muted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(midi), when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    trackAudioSource(osc);
    osc.start(when);
    osc.stop(when + duration + 0.03);
  }

  function playSample(filename, when, volume = 1, generation = musicGeneration){
    if (generation !== musicGeneration) return false;
    if (!audioCtx || !sampleGain || muted || !filename) return false;
    const buffer = sampleBuffers[filename];
    if (!buffer) return false;

    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(Math.max(0, volume), when);

    source.connect(gain);
    gain.connect(sampleGain);
    trackAudioSource(source);
    source.start(when);
    return true;
  }

  function playDrum(sound, when, volume = 1, generation = musicGeneration){
    if (generation !== musicGeneration) return;
    const loop = currentLoop();
    const filename = loop.samples?.[sound];

    if (playSample(filename, when, volume, generation)){
      return;
    }

    // Fallback procedural blips if a sample is missing or still loading.
    if (!audioCtx || !masterGain || muted) return;

    if (sound === "kick"){
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, when);
      osc.frequency.exponentialRampToValueAtTime(48, when + 0.14);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.22 * volume, when + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
      osc.connect(gain);
      gain.connect(masterGain);
      trackAudioSource(osc);
      osc.start(when);
      osc.stop(when + 0.2);
      return;
    }

    if (sound === "snare" || sound === "hat" || sound === "extra"){
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(sound === "snare" ? 185 : sound === "extra" ? 320 : 520, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime((sound === "snare" ? 0.09 : 0.045) * volume, when + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + (sound === "snare" ? 0.11 : 0.045));
      osc.connect(gain);
      gain.connect(masterGain);
      trackAudioSource(osc);
      osc.start(when);
      osc.stop(when + 0.13);
    }
  }

  function scheduleDrumLoopBar(barStartTime, generation = musicGeneration){
    if (generation !== musicGeneration) return;
    const loop = currentLoop();
    const beatSeconds = secondsPerBeat();

    (loop.events || []).forEach((event) => {
      playDrum(event.sound, barStartTime + event.beat * beatSeconds, event.volume ?? 1, generation);
    });
  }

  function playWordNote(button, opts = {}){
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const round = currentRound();
    playTone({ midi: button.note, when: now, duration: 0.22, volume: opts.volume || 0.18, type: state.roundIndex >= 1 ? "square" : "triangle" });

    if (round.echo){
      playTone({ midi: button.note + 12, when: now + secondsPerBeat() / 2, duration: 0.16, volume: 0.075, type: "triangle" });
    }
  }

  function playNoNote(){
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    playTone({ midi: 43, when: now, duration: 0.16, volume: 0.13, type: "sine" });
    playTone({ midi: 38, when: now + 0.07, duration: 0.13, volume: 0.08, type: "sine" });
  }

  function stopMusic({ stopAudio = true } = {}){
    musicGeneration += 1;

    if (beatTimer){
      clearInterval(beatTimer);
      beatTimer = null;
    }
    if (padTimer){
      clearInterval(padTimer);
      padTimer = null;
    }

    if (stopAudio){
      stopActiveAudioSources();
    }
  }

  function startBeatLoop({ cleanRestart = true } = {}){
    stopMusic({ stopAudio: cleanRestart });
    const generation = musicGeneration;

    state.beatCount = 0;
    state.musicStartTime = audioCtx.currentTime + 0.08;
    state.nextScheduledBeatTime = state.musicStartTime;

    const tick = () => {
      if (!audioCtx || generation !== musicGeneration) return;
      const lookAhead = 0.18;
      while (state.nextScheduledBeatTime < audioCtx.currentTime + lookAhead){
        scheduleBeat(state.beatCount, state.nextScheduledBeatTime, generation);
        state.nextScheduledBeatTime += secondsPerBeat();
        state.beatCount += 1;
      }
    };

    tick();
    beatTimer = setInterval(tick, 45);

    if (currentRound().pad){
      schedulePad(generation);
      padTimer = setInterval(() => schedulePad(generation), secondsPerBeat() * 8 * 1000);
    }
  }

  function scheduleBeat(beatIndex, when, generation = musicGeneration){
    if (generation !== musicGeneration) return;
    const beatInBar = beatIndex % 4;

    if (beatInBar === 0){
      scheduleDrumLoopBar(when, generation);
    }

    const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
    const timeoutId = setTimeout(() => {
      if (generation === musicGeneration) pulseUi(beatInBar === 0);
    }, delay);
    state.sleepIds.push(timeoutId);
  }

  function schedulePad(generation = musicGeneration){
    if (generation !== musicGeneration) return;
    if (!audioCtx || muted || !currentRound().pad) return;
    const when = audioCtx.currentTime + 0.06;
    PAD_NOTES.forEach((midi) => {
      playTone({ midi, when, duration: secondsPerBeat() * 7.5, volume: 0.025, type: "sine" });
    });
  }

  function pulseUi(strong){
    const scale = strong ? (state.roundIndex >= 1 ? 1.075 : 1.045) : (state.roundIndex >= 1 ? 1.045 : 1.025);
    document.querySelectorAll(".versejam-word-btn, .versejam-cue-button").forEach((btn) => {
      btn.style.setProperty("--vj-beat-scale", String(scale));
    });
    const dot = document.getElementById("versejamBeatRing");
    if (dot) dot.style.setProperty("--vj-dot-scale", strong ? "1.55" : "1.22");

    setTimeout(() => {
      document.querySelectorAll(".versejam-word-btn, .versejam-cue-button").forEach((btn) => {
        btn.style.setProperty("--vj-beat-scale", "1");
      });
      if (dot) dot.style.setProperty("--vj-dot-scale", "1");
    }, 100);
  }

  function setCueButton(label, cueState = "listen"){
    const cue = document.getElementById("versejamCueButton");
    if (!cue) return;

    cue.textContent = label;
    cue.className = `versejam-cue-button versejam-cue-${cueState}`;
  }

  function playCountdownTone(step){
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (step === "go"){
      playTone({ midi: 72, when: now, duration: 0.11, volume: 0.12, type: "square" });
      playTone({ midi: 76, when: now + 0.045, duration: 0.12, volume: 0.10, type: "square" });
      playTone({ midi: 79, when: now + 0.09, duration: 0.14, volume: 0.10, type: "square" });
      return;
    }

    const midi = step === 3 ? 60 : step === 2 ? 64 : 67;
    playTone({ midi, when: now, duration: 0.12, volume: 0.105, type: "square" });
  }

  async function runEchoCountdown(){
    state.phase = "countdown";
    state.acceptingInput = false;
    state.echoStartBeat = null;

    const countdown = [
      { label: "3", cue: "3", tone: 3 },
      { label: "2", cue: "2", tone: 2 },
      { label: "1", cue: "1", tone: 1 },
      { label: "GO!", cue: "go", tone: "go" }
    ];

    const countStart = nextMeasureStartTime();

    for (let i = 0; i < countdown.length; i += 1){
      if (state.screen !== "game") return;

      await waitUntilAudioTime(countStart + i * secondsPerBeat());
      if (state.screen !== "game") return;

      const step = countdown[i];
      setCueButton(step.label, step.cue);
      playCountdownTone(step.tone);
    }

    const echoStartTime = countStart + 4 * secondsPerBeat();

    // Start accepting taps a little before the visible TAP! moment.
    // This prevents a player from being punished for pressing just before the beat.
    const earlyInputTime = Math.max(
      audioCtx.currentTime,
      echoStartTime - EARLY_INPUT_WINDOW_MS / 1000
    );

    await waitUntilAudioTime(earlyInputTime);
    if (state.screen !== "game") return;

    // Keep the official rhythm start on the real downbeat for PERFECT/GROOVY timing.
    state.echoStartBeat = (echoStartTime - state.musicStartTime) / secondsPerBeat();

    // Allow input slightly early, but do not visually say TAP! yet.
    state.acceptingInput = true;
    cueNextButton();

    await waitUntilAudioTime(echoStartTime);
    if (state.screen !== "game") return;

    // Now show the visible start cue right on the beat.
    setCueButton("TAP!", "tap");
    state.phase = "play_chunk";
  }

  function nextMeasureStartTime(){
    if (!audioCtx || !state.musicStartTime) return audioCtx?.currentTime || 0;
    const elapsed = Math.max(0, audioCtx.currentTime - state.musicStartTime);
    const beat = elapsed / secondsPerBeat();
    const nextBarBeat = Math.ceil((beat + 0.001) / 4) * 4;
    return state.musicStartTime + nextBarBeat * secondsPerBeat();
  }

  function nextMeasureDelayMs(){
    if (!audioCtx || !state.musicStartTime) return 0;
    return Math.max(0, (nextMeasureStartTime() - audioCtx.currentTime) * 1000);
  }

  function renderShellGame(){
    app.innerHTML = `
      <div class="versejam-root">
        <div class="versejam-stage">
          <div class="versejam-build-wrap">
            <div class="versejam-build vm-build vm-build--${BUILD_AREA}" id="versejamBuild">
              ${renderBuildInnerHtml()}
            </div>
          </div>

          <div class="versejam-play-wrap">
            <div class="versejam-board" id="versejamBoard">
              <div class="versejam-particle-layer" id="versejamParticleLayer"></div>
              <div class="versejam-float-layer" id="versejamFloatLayer"></div>
              <div class="versejam-board-content">
                <div class="versejam-overlay-pills">
                  <button class="versejam-pill no-zoom" id="versejamMenuPill" type="button" aria-label="Game Menu">☰</button>
                  <div class="versejam-pill versejam-round-pill" id="versejamRoundPill">${escapeHtml(currentRound().name)}</div>
                </div>
                <div class="versejam-main-area" id="versejamMainArea"></div>
              </div>
              <div class="versejam-beat-ring" id="versejamBeatRing" aria-hidden="true"></div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>
    `;

    wireGameScreen();
    updateBuildText();
  }

  function renderHelpOverlay(){
    return window.VerseGameShell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body: helpHtml(),
      closeText: state.helpBackMode ? "Back" : "Close"
    });
  }

  function renderGameMenuOverlay(){
    return window.VerseGameShell.gameMenuHtml({
      id: "verseJamGameMenuOverlay",
      title: "Verse Jam Menu",
      muted,
      showModeSelect: true
    });
  }

  function wireGameScreen(){
    window.VerseGameShell.wireGameMenu({
      id: "verseJamGameMenuOverlay",
      menuButtonId: "versejamMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        setMuted(!muted);
        return muted;
      },
      onHowToPlay: () => {
        state.menuOpen = false;
        state.helpOpen = true;
        state.helpBackMode = true;
        const menuOverlay = document.getElementById("verseJamGameMenuOverlay");
        if (menuOverlay){
          menuOverlay.classList.remove("is-open");
          menuOverlay.setAttribute("aria-hidden", "true");
        }
        window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
      },
      onModeSelect: () => {
        stopRun();
        setScreen("mode");
      },
      onExit: () => {
        stopRun();
        window.VerseGameBridge.exitGame();
      },
      onOpen: () => {
        state.menuOpen = true;
        state.helpOpen = false;
        state.helpBackMode = false;
      },
      onClose: () => {
        state.menuOpen = false;
      },
      onBackFromHelp: () => {
        state.helpOpen = false;
        state.menuOpen = true;
        state.helpBackMode = false;
      }
    });
  }

  function stopRun(){
    clearSleeps();
    stopMusic();
    state.acceptingInput = false;
    state.busy = false;
  }

  async function beginRun(mode){
    selectedMode = mode;
    initVerseData();
    state.verseJson = await loadVerseJson();
    state.phase = "intro";
    renderShellGame();
    await ensureAudio();
    startBeatLoop();
    await runIntroSequence();
    if (state.screen !== "game") return;
    await startNextPlayableGroup();
  }

  async function runIntroSequence(){
    const area = document.getElementById("versejamMainArea");
    if (!area) return;

    area.innerHTML = `<div class="versejam-intro-stack" id="versejamIntroStack"></div>`;
    const stack = document.getElementById("versejamIntroStack");
    if (!stack) return;

    const introOffsets = makeRhythmOffsets(INTRO_WORDS.length);
    const startAt = nextMeasureStartTime();

    for (let i = 0; i < INTRO_WORDS.length; i += 1){
      if (state.screen !== "game") return;
      const offset = introOffsets[i] ?? i;
      const eventTime = startAt + offset * secondsPerBeat();
      await waitUntilAudioTime(eventTime);

      if (state.screen !== "game") return;
      const el = document.createElement("div");
      el.className = "versejam-intro-word is-in";
      el.textContent = INTRO_WORDS[i];
      stack.appendChild(el);
      playTone({ midi: 72 + (i % 3) * 2, when: audioCtx.currentTime, duration: 0.12, volume: 0.08, type: "triangle" });
    }

    await waitUntilAudioTime(nextMeasureStartTime() + secondsPerBeat() * 2);

    const children = Array.from(stack.children || []);
    const outStart = nextMeasureStartTime();
    for (let i = 0; i < children.length; i += 1){
      if (state.screen !== "game") return;
      const offset = introOffsets[i] ?? i;
      const eventTime = outStart + offset * secondsPerBeat();
      await waitUntilAudioTime(eventTime);

      children[i].classList.remove("is-in");
      children[i].classList.add("is-out");
      playTone({ midi: 60, when: audioCtx.currentTime, duration: 0.08, volume: 0.05, type: "triangle" });
    }

    await waitUntilAudioTime(nextMeasureStartTime());
  }

  async function startNextPlayableGroup(){
    state.phase = "spawn_chunk";
    state.acceptingInput = false;
    state.currentButtons = makeChunkButtons();
    state.currentRhythmOffsets = makeRhythmOffsets(state.currentButtons.length);
    state.correctTapBeats = [];
    state.echoStartBeat = null;

    if (!state.currentButtons.length){
      await handleRoundOrEnd();
      return;
    }

    const area = document.getElementById("versejamMainArea");
    if (!area) return;
    area.innerHTML = `
      <div class="versejam-button-stack" id="versejamButtonStack">
        <button class="versejam-cue-button versejam-cue-listen" id="versejamCueButton" type="button" disabled>LISTEN</button>
        <div class="versejam-word-stack" id="versejamWordStack"></div>
      </div>
    `;
    setCueButton("LISTEN", "listen");

    const spawnStart = nextMeasureStartTime();

    for (let i = 0; i < state.currentButtons.length; i += 1){
      const button = state.currentButtons[i];
      const offset = state.currentRhythmOffsets[i] ?? i;
      await waitUntilAudioTime(spawnStart + offset * secondsPerBeat());
      if (state.screen !== "game") return;

      spawnButton(button);
      playTone({ midi: button.note, when: audioCtx.currentTime, duration: 0.12, volume: 0.11, type: "triangle" });
    }

    await runEchoCountdown();
  }

  function spawnButton(button){
    const stack = document.getElementById("versejamWordStack") || document.getElementById("versejamButtonStack");
    if (!stack) return;

    const btn = document.createElement("button");
    btn.className = "versejam-word-btn is-spawning no-zoom";
    btn.id = button.id;
    btn.type = "button";
    btn.textContent = button.label;
    btn.dataset.segmentIndex = String(button.segmentIndex);
    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handleButtonTap(button.id);
    });
    stack.appendChild(btn);
    setTimeout(() => btn.classList.remove("is-spawning"), 280);
    addFloatNote(btn, "♪");
  }

  function cueNextButton(){
    document.querySelectorAll(".versejam-word-btn").forEach(btn => {
      btn.classList.remove("is-next", "is-rainbow-next");
      const segmentIndex = Number(btn.dataset.segmentIndex);
      if (segmentIndex === state.progressIndex){
        btn.classList.add(currentRound().cue === "rainbow" ? "is-rainbow-next" : "is-next");
      }
    });
  }

  function getCorrectSequenceIndex(segmentIndex){
    const ordered = state.currentButtons
      .map(item => item.segmentIndex)
      .sort((a, b) => a - b);
    return ordered.indexOf(segmentIndex);
  }

  function recordCorrectTap(button){
    const sequenceIndex = getCorrectSequenceIndex(button.segmentIndex);
    const beat = beatPositionNow();
    state.correctTapBeats.push({ sequenceIndex, beat });
  }

  function isNearEchoStartGrid(beat){
    if (!Number.isFinite(beat)) return false;

    if (!Number.isFinite(state.echoStartBeat)){
      return Math.abs(beat - nearestBeat(beat)) <= PERFECT_BEAT_TOLERANCE;
    }

    const delta = beat - state.echoStartBeat;
    const nearestShiftedMeasure = Math.round(delta / 4) * 4;
    return Math.abs(delta - nearestShiftedMeasure) <= PERFECT_BEAT_TOLERANCE;
  }

  function didTapChunkPerfectly(){
    const taps = state.correctTapBeats
      .slice()
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    const expected = state.currentRhythmOffsets;
    if (!expected.length || taps.length !== expected.length) return false;

    // One-button groups are allowed to score if the press starts on the
    // countdown's echo downbeat, or on the same downbeat in a later measure.
    if (taps.length === 1){
      return isNearEchoStartGrid(taps[0].beat);
    }

    // For multi-word chunks, require the player to start on the echo downbeat
    // but allow them to wait full measures before starting. Then compare the
    // rhythm relative to that first tap.
    const firstTapBeat = taps[0].beat;
    const firstExpected = expected[0] || 0;

    if (!isNearEchoStartGrid(firstTapBeat)) return false;

    return taps.every((tap) => {
      const actualOffset = tap.beat - firstTapBeat;
      const expectedOffset = (expected[tap.sequenceIndex] ?? tap.sequenceIndex) - firstExpected;
      return Math.abs(actualOffset - expectedOffset) <= PERFECT_BEAT_TOLERANCE;
    });
  }

  function showPerfectSplash(){
    const board = document.getElementById("versejamBoard");
    if (!board) return;

    const splash = document.createElement("div");
    splash.className = "versejam-perfect-splash";
    splash.textContent = state.roundIndex >= 1 ? "GROOVY!" : "PERFECT!";
    board.appendChild(splash);

    playTone({ midi: 84, when: audioCtx.currentTime, duration: 0.12, volume: 0.12, type: "square" });
    playTone({ midi: 88, when: audioCtx.currentTime + 0.08, duration: 0.13, volume: 0.11, type: "square" });
    playTone({ midi: 91, when: audioCtx.currentTime + 0.16, duration: 0.15, volume: 0.10, type: "square" });

    splash.addEventListener("animationend", () => splash.remove(), { once: true });
  }

  async function handleButtonTap(buttonId){
    if (!state.acceptingInput || state.busy) return;

    const button = state.currentButtons.find(item => item.id === buttonId);
    const btnEl = document.getElementById(buttonId);
    if (!button || !btnEl) return;
    if (btnEl.dataset.vjPressed === "true") return;

    btnEl.dataset.vjPressed = "true";

    if (button.segmentIndex !== state.progressIndex){
      btnEl.classList.remove("is-wrong");
      void btnEl.offsetWidth;
      btnEl.classList.add("is-wrong");
      playNoNote();
      setTimeout(() => {
        if (btnEl && btnEl.isConnected) btnEl.dataset.vjPressed = "";
      }, 240);
      return;
    }

    state.busy = true;
    button.removing = true;
    recordCorrectTap(button);
    btnEl.classList.remove("is-next", "is-rainbow-next");
    btnEl.classList.add("is-removing");
    playWordNote(button);
    explodeButton(btnEl);

    await sleep(150);
    btnEl.remove();

    state.progressIndex += 1;
    state.buildFitDone = false;
    updateBuildText();

    state.currentButtons = state.currentButtons.filter(item => item.id !== buttonId);

    const phase = getPhase();
    if (state.currentButtons.length === 0 || phase !== "words"){
      const perfect = didTapChunkPerfectly();
      if (phase === "words") state.chunkIndex += 1;
      state.busy = false;
      state.acceptingInput = false;
      if (perfect) showPerfectSplash();
      await sleep(perfect ? 560 : 260);
      await startNextPlayableGroup();
      return;
    }

    state.busy = false;
    cueNextButton();
  }

  async function handleRoundOrEnd(){
    if (state.progressIndex >= state.segments.length){
      await markPlaygroundPracticed();

      if (state.roundIndex < ROUND_CONFIGS.length - 1){
        state.roundIndex += 1;
        state.progressIndex = 0;
        state.chunkIndex = 0;
        state.buildFitDone = false;
        state.currentButtons = [];
        state.phase = "intro";
        updateRoundPill();
        updateBuildText();
        startBeatLoop();
        await showRoundTransition();
        await startNextPlayableGroup();
        return;
      }

      state.completed = true;
      stopRun();
      setScreen("end");
    }
  }

  function updateRoundPill(){
    const pill = document.getElementById("versejamRoundPill");
    if (pill) pill.textContent = currentRound().name;
  }

  async function showRoundTransition(){
    const area = document.getElementById("versejamMainArea");
    if (!area) return;
    const message = state.roundIndex === 1 ? ["nice", "now", "jam"] : ["speed", "it", "up"];
    area.innerHTML = `<div class="versejam-intro-stack" id="versejamIntroStack"></div>`;
    const stack = document.getElementById("versejamIntroStack");

    await sleep(nextMeasureDelayMs());

    for (const word of message){
      const el = document.createElement("div");
      el.className = "versejam-intro-word is-in";
      el.textContent = word;
      stack.appendChild(el);
      playTone({ midi: 72 + stack.children.length * 2, when: audioCtx.currentTime, duration: 0.14, volume: 0.09, type: "square" });
      await sleep(secondsPerBeat() * 1000);
    }
    await sleep(secondsPerBeat() * 2 * 1000);
  }

  function explodeButton(btnEl){
    const layer = document.getElementById("versejamParticleLayer");
    const board = document.getElementById("versejamBoard");
    if (!layer || !board || !btnEl) return;

    const boardRect = board.getBoundingClientRect();
    const rect = btnEl.getBoundingClientRect();
    const cx = rect.left - boardRect.left + rect.width / 2;
    const cy = rect.top - boardRect.top + rect.height / 2;
    const round = currentRound();
    const palette = state.roundIndex >= 1
      ? ["#ffe27a", "#8df7ff", "#ff7ad9", "#9dff8d", "#ffffff", "#b38dff"]
      : ["#ffe27a", "#8df7ff", "#ffffff", "#ffd28d"];
    const count = Math.round(20 * round.explosion);
    const spread = 78 * round.explosion;

    for (let i = 0; i < count; i += 1){
      const p = document.createElement("div");
      p.className = "versejam-pixel";
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.setProperty("--vj-pcolor", palette[i % palette.length]);
      p.style.setProperty("--vj-dx", `${Math.round(Math.random() * spread - spread / 2)}px`);
      p.style.setProperty("--vj-dy", `${Math.round(Math.random() * spread - spread / 2)}px`);
      p.style.setProperty("--vj-rot", `${Math.round(Math.random() * 360)}deg`);
      layer.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function addFloatNote(btnEl, text){
    const layer = document.getElementById("versejamFloatLayer");
    const board = document.getElementById("versejamBoard");
    if (!layer || !board || !btnEl) return;

    const boardRect = board.getBoundingClientRect();
    const rect = btnEl.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "versejam-float-note";
    el.textContent = text;
    el.style.left = `${rect.right - boardRect.left - 26}px`;
    el.style.top = `${rect.top - boardRect.top + 10}px`;
    layer.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  function markPlaygroundPracticed(){
    const verseId = ctx.verseId;
    if (!verseId) return { ok: false };

    try {
      const raw = localStorage.getItem("verseMemoryProgress");
      const progress = raw ? JSON.parse(raw) : { version: 1, verses: {} };
      if (!progress || typeof progress !== "object") return { ok: false };
      if (!progress.verses || typeof progress.verses !== "object") progress.verses = {};
      if (!progress.version) progress.version = 1;

      if (!progress.verses[verseId]){
        progress.verses[verseId] = {
          learnCompleted: false,
          games: {}
        };
      }

      progress.verses[verseId].lastPracticedAt = Date.now();
      localStorage.setItem("verseMemoryProgress", JSON.stringify(progress));
      return { ok: true };
    } catch (err){
      console.warn("Verse Jam could not mark verse as practiced", err);
      return { ok: false };
    }
  }

  function totalElapsedMs(){
    return Math.max(1, performance.now() - state.startTime);
  }

  function renderIntro(){
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
      onStart: () => setScreen("mode")
    });
  }

  function renderMode(){
    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Verse Jam Mode",
      icon: "🎹",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      backLabel: "Back to Verse Jam title",
      theme: GAME_THEME,
      modes: MODES,
      onBack: () => setScreen("intro"),
      onSelect: (mode) => {
        state.screen = "game";
        beginRun(mode);
      }
    });
  }

  function renderEnd(){
    const seconds = (totalElapsedMs() / 1000).toFixed(1);
    window.VerseGameShell.renderCompleteScreen({
      app,
      title: "Verse Jam Complete!",
      icon: "🎵",
      playAgainText: "Play Again",
      moreGamesText: "More Playground",
      backLabel: "Back to Verse Playground",
      theme: GAME_THEME,
      onPlayAgain: () => setScreen("mode"),
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });

    const center = document.querySelector(".vm-game-center");
    if (center){
      const note = document.createElement("div");
      note.className = "vm-game-complete-stats";
      note.textContent = `You played the verse ${ROUND_CONFIGS.length} times · ${seconds}s`;
      const actions = center.querySelector(".vm-game-actions");
      center.insertBefore(note, actions || null);
    }
  }

  function helpHtml(){
    return `
      Tap the next verse word to play its note.<br><br>
      Beginner: words are stacked in order.<br>
      Advanced: words are scrambled.<br><br>
      The beat keeps going while each chunk appears. First, listen as the words pop in. Then watch the cue button count down: 3, 2, 1, GO! When it says TAP!, echo the rhythm by tapping the next verse word. Correct taps pop into chunky pixels and build the verse above. Wrong taps play a gentle “no” note.
    `;
  }

  function setScreen(screen){
    state.screen = screen;
    if (screen !== "game") stopRun();
    render();
  }

  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
