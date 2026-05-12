(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();

  const GAME_ID = "verse_jam";
  const GAME_TITLE = "Verse Jam";
  const GAME_ICON = "🎹";
  const HELP_OVERLAY_ID = "verseJamHelpOverlay";
  const BUILD_AREA = "large";

const GAME_THEME = {
  bg: "transparent",
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

  const INTRO_WORDS = ["tap", "the", "words", "match", "my", "beat"];
  // Fixed rhythm for: TAP THE WORDS (rest) MATCH MY BEAT
  // Q Q Q - | Q Q Q -
  const INTRO_RHYTHM_OFFSETS = [0, 1, 2, 4, 5, 6];

  const BASE_MELODIES = [
  // Original: gentle rise and return
  [60, 62, 64, 67, 69, 72, 69, 67, 64, 62, 60, 67],

  // Simple arch
  [60, 64, 67, 72, 69, 67, 64, 62, 60, 64, 67, 60],

  // Bouncy call-and-response
  [60, 67, 64, 69, 67, 72, 69, 64, 67, 62, 60, 67],

  // Playful step-up and landing
  [60, 62, 67, 64, 69, 67, 72, 69, 67, 64, 62, 60],

  // Higher sparkle
  [67, 69, 72, 69, 67, 64, 67, 72, 69, 67, 64, 60]
];

const REFERENCE_CADENCE_NOTES = [60, 64, 67];
  const PAD_NOTES = [48, 55, 60];

  const CLAP_BUTTON_LABEL = "👏 👏 👏 👏";

  const SOUND_BIT_BASE_URL = "./verse_jam_sounds/";

  const SOUND_BITS = [
    { id: "boom", label: "Boom!", filename: "verse_jam_voice_boom.mp3" },
    { id: "hey", label: "Hey!", filename: "verse_jam_voice_hey.mp3" },
    { id: "woo", label: "Woo!", filename: "verse_jam_voice_woo.mp3" },
    { id: "yeah", label: "Yeah!", filename: "verse_jam_voice_yeah.mp3" },
    { id: "yo", label: "Yo!", filename: "verse_jam_voice_yo.mp3" }
  ];

  const DRUM_LOOPS = {
    basic: {
      id: "chip_bounce_basic",
      bpm: 92,
      beatsPerBar: 4,
      stepsPerBeat: 4,
      lengthBeats: 4,
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

const ROUND_CONFIGS_BY_MODE = {
  beginner: [
    { name: "Warmup", bpm: 92, loop: "basic", cue: "soft", explosion: 1, echo: false, pad: false },
    { name: "Jam", bpm: 92, loop: "middle", cue: "rainbow", explosion: 1.35, echo: false, pad: true },
    { name: "Faster", bpm: 100, loop: "final", cue: "rainbow", explosion: 1.55, echo: false, pad: true },
    { name: "Finale", bpm: 108, loop: "final", cue: "rainbow", explosion: 1.85, echo: false, pad: true }
  ],

  advanced: [
    { name: "Warmup", bpm: 100, loop: "basic", cue: "soft", explosion: 1, echo: false, pad: false },
    { name: "Jam", bpm: 104, loop: "middle", cue: "rainbow", explosion: 1.35, echo: false, pad: true },
    { name: "Faster", bpm: 112, loop: "final", cue: "rainbow", explosion: 1.55, echo: false, pad: true },
    { name: "Finale", bpm: 120, loop: "final", cue: "rainbow", explosion: 1.85, echo: false, pad: true }
  ]
};

const ROUND_CONFIGS = ROUND_CONFIGS_BY_MODE.beginner;

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

// Volume balance
const COUNTDOWN_BEEP_VOLUME = 0.060;
const COUNTDOWN_GO_VOLUME = 0.075;

const BUTTON_POP_IN_NOTE_VOLUME = 0.400;

const ROUND_ONE_WORD_NOTE_VOLUME = 0.260;

const DEFAULT_WORD_NOTE_VOLUME = 0.135;

const DRUM_MASTER_VOLUME = 2.000;

// Green voice/shout filler buttons: Boom!, Hey!, Woo!, Yeah!, Yo!
// 1.0 = original MP3 volume.
// Try 0.75 if too loud, 1.25 if too quiet.
const VOICE_SOUND_BIT_VOLUME = 0.350;

// TEMP DEV TOOL: live volume tuning.
// These start from the constants above, but can be changed with the in-game mixer.
const volumeTuning = {
  countdownBeep: COUNTDOWN_BEEP_VOLUME,
  countdownGo: COUNTDOWN_GO_VOLUME,
  buttonPopIn: BUTTON_POP_IN_NOTE_VOLUME,
  roundOneWord: ROUND_ONE_WORD_NOTE_VOLUME,
  defaultWord: DEFAULT_WORD_NOTE_VOLUME,
  
  drumMaster: DRUM_MASTER_VOLUME
};

  let selectedMode = null;
  let muted = false;
  let audioCtx = null;
  let masterGain = null;
  let compressor = null;
  let beatTimer = null;
  let padTimer = null;
  let musicGeneration = 0;
  let audioUnlocked = false;
  let soundBitLoadPromise = null;
  const soundBitBuffers = {};
  const activeAudioSources = new Set();

  function audioContextConstructor(){
    return window.AudioContext || window.webkitAudioContext;
  }

function createAudioGraph(){
  if (audioCtx){
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.72;
    return;
  }

    const AudioCtor = audioContextConstructor();
    if (!AudioCtor){
      console.warn("Verse Jam: Web Audio is not available in this browser.");
      return;
    }

    audioCtx = new AudioCtor();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 0.72;

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 24;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;

    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);
  }

  function unlockAudioFromGesture(){
    createAudioGraph();

    if (!audioCtx || !masterGain) return;

    if (audioCtx.state !== "running"){
      const resumePromise = audioCtx.resume();
      if (resumePromise?.catch){
        resumePromise.catch(err => {
          console.warn("Verse Jam: audio resume failed", err);
        });
      }
    }

    // iPhone/Safari often unlocks most reliably when a real source node
    // is started directly inside a user gesture.
    try {
      const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();

      source.buffer = buffer;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

      source.connect(gain);
      gain.connect(masterGain);

      trackAudioSource(source);
      source.start(0);
    } catch (err){}

    audioUnlocked = true;

    // Load the short shout samples, but do not block the tap gesture.
    loadSoundBitBuffers();
  }

  function installAudioUnlockHandlers(){
    const unlock = () => unlockAudioFromGesture();

    ["pointerdown", "touchstart", "mousedown", "click"].forEach(eventName => {
      document.addEventListener(eventName, unlock, {
        capture: true,
        passive: true
      });
    });
  }

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
    activeBaseMelody: BASE_MELODIES[0],
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

function selectedModeId(){
  if (typeof selectedMode === "string") return selectedMode;
  return selectedMode?.id || "beginner";
}

function currentRoundConfigs(){
  return ROUND_CONFIGS_BY_MODE[selectedModeId()] || ROUND_CONFIGS_BY_MODE.beginner;
}

function currentRound(){
  const configs = currentRoundConfigs();
  return configs[Math.min(state.roundIndex, configs.length - 1)];
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

function makeCurrentRhythmOffsets(buttons){
  const ordered = [...buttons].sort((a, b) => {
    const aOrder = Number.isFinite(a.sequenceOrder) ? a.sequenceOrder : 0;
    const bOrder = Number.isFinite(b.sequenceOrder) ? b.sequenceOrder : 0;
    return aOrder - bOrder;
  });

  if (ordered.length && ordered.every(button => Number.isFinite(button.rhythmOffset))){
    return ordered.map(button => button.rhythmOffset);
  }

  return makeRhythmOffsets(buttons.length);
}

function chooseActiveBaseMelody(){
  const melody = BASE_MELODIES[Math.floor(Math.random() * BASE_MELODIES.length)];
  state.activeBaseMelody = Array.isArray(melody) ? melody : BASE_MELODIES[0];
}

function noteForSegment(segmentIndex){
  const melody = state.activeBaseMelody || BASE_MELODIES[0];
  const baseNote = melody[segmentIndex % melody.length] || 60;
  return baseNote + (state.roundIndex >= 2 ? 12 : 0);
}

function referenceNoteForOrder(sequenceOrder){
  const baseNote = REFERENCE_CADENCE_NOTES[sequenceOrder % REFERENCE_CADENCE_NOTES.length] || 60;
  return baseNote + (state.roundIndex >= 2 ? 12 : 0);
}

function makeClapButton(sequenceOrder = 0){
  return {
    id: `vj_btn_${state.roundIndex}_${state.chunkIndex}_clap_${sequenceOrder}_${Math.floor(Math.random() * 100000)}`,
    label: CLAP_BUTTON_LABEL,
    segmentIndex: -1,
    note: 60,
    kind: "clap",
    sequenceOrder,
    spawned: false,
    removing: false
  };
}

function randomSoundBit(){
  if (state.roundIndex === 0) return null;

  return SOUND_BITS[Math.floor(Math.random() * SOUND_BITS.length)] || SOUND_BITS[0];
}

function makeSoundBitButton(sequenceOrder = 0){
  const sound = randomSoundBit();

  if (!sound){
    return makeClapButton(sequenceOrder);
  }

  return {
    id: `vj_btn_${state.roundIndex}_${state.chunkIndex}_sound_${sound.id}_${sequenceOrder}_${Math.floor(Math.random() * 100000)}`,
    label: sound.label,
    segmentIndex: -1,
    note: 60,
    kind: "sound_bit",
    soundBitId: sound.id,
    soundBitFilename: sound.filename,
    sequenceOrder,
    spawned: false,
    removing: false
  };
}


function isClapButton(button){
  return button?.kind === "clap";
}

function isSoundBitButton(button){
  return button?.kind === "sound_bit";
}

function isRhythmFillerButton(button){
  return isClapButton(button) || isSoundBitButton(button);
}

function playClapSound(){
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // Generated chiptune clap.
  playTone({ midi: 72, when: now, duration: 0.055, volume: 0.13, type: "square" });
  playTone({ midi: 84, when: now + 0.025, duration: 0.045, volume: 0.08, type: "square" });
}

function playSoundBitSound(button){
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const sound = SOUND_BITS.find(item => item.id === button?.soundBitId);

  if (sound && playSoundBitSample(sound, now)){
    return;
  }

  // Fallback if the MP3 has not loaded yet.
  playTone({ midi: 79, when: now, duration: 0.075, volume: 0.12, type: "square" });
  playTone({ midi: 84, when: now + 0.055, duration: 0.085, volume: 0.09, type: "square" });
}

function playRhythmFillerSound(button){
  if (isSoundBitButton(button)){
    playSoundBitSound(button);
    return;
  }

  playClapSound();
}

function randomIntInclusive(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeRhythmFillerButton(sequenceOrder = 0){
  // Round 1 stays cleaner: only generated clap fillers.
  if (state.roundIndex === 0){
    return makeClapButton(sequenceOrder);
  }

  // Later rounds mix generated clap fillers with recorded voice fillers.
  // 60% clap keeps the rhythmic clap feel; 40% voice adds excitement.
  return Math.random() < 0.6
    ? makeClapButton(sequenceOrder)
    : makeSoundBitButton(sequenceOrder);
}

function chooseFillerCountForWordCount(wordCount){
  if (wordCount === 2){
    // 2 words: add 1 or 2 fillers, making a 3- or 4-hit pattern.
    return randomIntInclusive(1, 2);
  }

  if (wordCount === 3){
    // 3 words: add 0 or 1 filler, making a 3- or 4-hit pattern.
    return randomIntInclusive(0, 1);
  }

  if (wordCount === 4){
    // 4 words: add 0, 1, or 2 fillers, making a 4-, 5-, or 6-hit pattern.
    return randomIntInclusive(0, 2);
  }

  // 5-8 words already have enough rhythmic variety.
  return 0;
}

function chooseFillerLayout(wordCount, fillerCount){
  const key = `${wordCount}_${fillerCount}`;

  const layouts = {
    // 2 words + 1 filler = 3 hits
    "2_1": [
      ["word", "filler", "word"],
      ["word", "word", "filler"]
    ],

    // 2 words + 2 fillers = 4 hits
    "2_2": [
      ["word", "filler", "word", "filler"],
      ["word", "word", "filler", "filler"]
    ],

    // 3 words + 0 filler = 3 hits
    "3_0": [
      ["word", "word", "word"]
    ],

    // 3 words + 1 filler = 4 hits
    "3_1": [
      ["word", "filler", "word", "word"],
      ["word", "word", "word", "filler"]
    ],

    // 4 words + 0 filler.
    // Leave these simple; makeRhythmOffsets() can still provide 4-word variety.
    "4_0": [
      ["word", "word", "word", "word"]
    ],

    // 4 words + 1 filler = 5 hits with rests.
    // W = word, F = filler, rest = quarter-note rest.
    "4_1": [
      // W F W - | W - W -
      ["word", "filler", "word", "rest", "word", "rest", "word", "rest"],

      // W - W - | W F W -
      ["word", "rest", "word", "rest", "word", "filler", "word", "rest"],

      // W W - - | W F W -
      ["word", "word", "rest", "rest", "word", "filler", "word", "rest"],

      // W F - - | W - W -
      ["word", "filler", "rest", "rest", "word", "rest", "word", "rest"],

      // W F - - | W W W -
      ["word", "filler", "rest", "rest", "word", "word", "word", "rest"],

      // W - W - | W - W F
      ["word", "rest", "word", "rest", "word", "rest", "word", "filler"],

      // W - W F | W - W -
      ["word", "rest", "word", "filler", "word", "rest", "word", "rest"],

      // W W - F | W - W -
      ["word", "word", "rest", "filler", "word", "rest", "word", "rest"],

      // W - W - | W W - F
      ["word", "rest", "word", "rest", "word", "word", "rest", "filler"],

      // W W - - | W - W F
      ["word", "word", "rest", "rest", "word", "rest", "word", "filler"],

      // W W - - | W W - F
      ["word", "word", "rest", "rest", "word", "word", "rest", "filler"]
    ],

    // 4 words + 2 fillers = 6 hits with rests.
    "4_2": [
      // W F W F | W - W -
      ["word", "filler", "word", "filler", "word", "rest", "word", "rest"],

      // W - W - | W F W F
      ["word", "rest", "word", "rest", "word", "filler", "word", "filler"],

      // W F W - | W F W -
      ["word", "filler", "word", "rest", "word", "filler", "word", "rest"],

      // W - W F | W - W F
      ["word", "rest", "word", "filler", "word", "rest", "word", "filler"]
    ]
  };

  const options = layouts[key] || [Array.from({ length: wordCount }, () => "word")];
  return options[Math.floor(Math.random() * options.length)];
}

function addRhythmFillersToChunk(buttons){
  const realButtons = buttons.filter(Boolean);
  const wordCount = realButtons.length;
  const fillerCount = chooseFillerCountForWordCount(wordCount);

  if (!fillerCount){
    return realButtons.map((button, index) => ({
      ...button,
      sequenceOrder: Number.isFinite(button.sequenceOrder) ? button.sequenceOrder : index
    }));
  }

  const layout = chooseFillerLayout(wordCount, fillerCount);

  let wordIndex = 0;
  let sequenceOrder = 0;
  const result = [];

  layout.forEach((slot, rhythmOffset) => {
    if (slot === "rest"){
      return;
    }

    if (slot === "filler"){
      result.push({
        ...makeRhythmFillerButton(sequenceOrder),
        sequenceOrder,
        rhythmOffset
      });
      sequenceOrder += 1;
      return;
    }

    const sourceButton = realButtons[wordIndex];
    wordIndex += 1;

    if (!sourceButton) return;

    result.push({
      ...sourceButton,
      sequenceOrder,
      rhythmOffset
    });

    sequenceOrder += 1;
  });

  return result;
}

function getExpectedSequenceOrder(){
  return state.correctTapBeats.length;
}

function isExpectedFillerTap(button){
  if (!isRhythmFillerButton(button)) return false;

  const expectedOrder = getExpectedSequenceOrder();

  // Filler buttons are playful rhythm hits. If the next expected item
  // is any filler, allow any remaining filler button.
  return state.currentButtons.some(item =>
    isRhythmFillerButton(item) && item.sequenceOrder === expectedOrder
  );
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

function splitReferenceForJamButtons(referenceLabel){
  const raw = String(referenceLabel || "").trim();

  if (!raw){
    return {
      chapterColon: "",
      verses: ""
    };
  }

  // Handles references like:
  // 3:16
  // 15:22
  // 15:3-4
  // 15:3–4
  const match = raw.match(/^(.+?:)\s*(.+)$/);

  if (match){
    return {
      chapterColon: match[1].trim(),
      verses: match[2].trim()
    };
  }

  // Fallback if the shell ever gives us a reference without a colon.
  return {
    chapterColon: raw,
    verses: ""
  };
}

function makeReferenceChunkButtons(){
  const bookSegmentIndex = state.words.length;
  const referenceSegmentIndex = state.words.length + 1;
  const refParts = splitReferenceForJamButtons(state.referenceLabel);

  const buttons = [];

  if (state.bookLabel){
    buttons.push({
      id: `vj_btn_${state.roundIndex}_ref_book_${Math.floor(Math.random() * 100000)}`,
      label: state.bookLabel,
      segmentIndex: bookSegmentIndex,
      note: referenceNoteForOrder(0),
      kind: "book",
      sequenceOrder: 0,
      spawned: false,
      removing: false
    });
  }

  if (refParts.chapterColon){
    buttons.push({
      id: `vj_btn_${state.roundIndex}_ref_chapter_${Math.floor(Math.random() * 100000)}`,
      label: refParts.chapterColon,
      segmentIndex: referenceSegmentIndex,
      note: referenceNoteForOrder(1),
      kind: "reference_chapter",
      sequenceOrder: 1,
      spawned: false,
      removing: false
    });
  }

  if (refParts.verses){
    buttons.push({
      id: `vj_btn_${state.roundIndex}_ref_verses_${Math.floor(Math.random() * 100000)}`,
      label: refParts.verses,
      segmentIndex: referenceSegmentIndex,
      note: referenceNoteForOrder(2),
      kind: "reference_verses",
      sequenceOrder: 2,
      spawned: false,
      removing: false
    });
  }

  return buttons;
}

function isReferenceJamButton(button){
  return !!button?.kind && (
    button.kind === "book" ||
    button.kind === "reference_chapter" ||
    button.kind === "reference_verses"
  );
}

function getExpectedReferenceJamKind(){
  const bookSegmentIndex = state.words.length;
  const referenceSegmentIndex = state.words.length + 1;

  if (state.progressIndex === bookSegmentIndex){
    return "book";
  }

  if (state.progressIndex === referenceSegmentIndex){
    const chapterButtonStillVisible = state.currentButtons.some(
      button => button.kind === "reference_chapter"
    );

    if (chapterButtonStillVisible){
      return "reference_chapter";
    }

    return "reference_verses";
  }

  return "";
}

function isButtonExpected(button){
  if (!button) return false;

  const expectedOrder = getExpectedSequenceOrder();

  if (isRhythmFillerButton(button)){
    return isExpectedFillerTap(button);
  }

  if (Number.isFinite(button.sequenceOrder)){
    return button.sequenceOrder === expectedOrder;
  }

  if (isReferenceJamButton(button)){
    return button.kind === getExpectedReferenceJamKind();
  }

  return button.segmentIndex === state.progressIndex;
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
    buttons.push(...makeReferenceChunkButtons());
  } else if (phase === "reference"){
    // Normally we should reach reference as part of the combined
    // book/chapter/verse chunk above. This fallback keeps the app safe.
    buttons.push(makeButtonForSegment(state.progressIndex));
  }

    const sequenced = addRhythmFillersToChunk(buttons);

    return sequenced.map((button, visualOrder) => ({
      ...button,
      visualOrder
    }));
}

  function makeButtonForSegment(segmentIndex){
    const label = state.segments[segmentIndex];
    if (!label) return null;

    return {
      id: `vj_btn_${state.roundIndex}_${state.chunkIndex}_${segmentIndex}_${Math.floor(Math.random() * 100000)}`,
      label,
      segmentIndex,
      note: noteForSegment(segmentIndex),
      spawned: false,
      removing: false
    };
  }

  async function ensureAudio(){
    createAudioGraph();

    if (!audioCtx) return;

    unlockAudioFromGesture();

    if (audioCtx.state !== "running"){
      try {
        await audioCtx.resume();
      } catch (err){
        console.warn("Verse Jam: audio resume failed in ensureAudio", err);
      }
    }
    loadSoundBitBuffers();

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

function drumVolume(value = 1){
  return Math.max(0, value) * volumeTuning.drumMaster;
}

async function loadSoundBitBuffers(){
  if (!audioCtx) return;
  if (soundBitLoadPromise) return soundBitLoadPromise;

  soundBitLoadPromise = Promise.all(SOUND_BITS.map(async (sound) => {
    if (!sound?.filename || soundBitBuffers[sound.filename]) return;

    try {
      const res = await fetch(`${SOUND_BIT_BASE_URL}${sound.filename}`, { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      soundBitBuffers[sound.filename] = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err){
      console.warn(`Verse Jam could not load sound bit: ${sound.filename}`, err);
      soundBitBuffers[sound.filename] = null;
    }
  }));

  return soundBitLoadPromise;
}

function playSoundBitSample(sound, when = audioCtx?.currentTime || 0, volume = VOICE_SOUND_BIT_VOLUME){
  if (!audioCtx || !masterGain || muted || !sound?.filename) return false;

  const buffer = soundBitBuffers[sound.filename];
  if (!buffer) return false;

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  source.buffer = buffer;
  gain.gain.setValueAtTime(Math.max(0, volume), when);

  source.connect(gain);
  gain.connect(masterGain);

  trackAudioSource(source);
  source.start(when);

  return true;
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


  function playDrum(sound, when, volume = 1, generation = musicGeneration){
    if (generation !== musicGeneration) return;

    // Generated chiptune drums.
    if (!audioCtx || !masterGain || muted) return;

    if (sound === "kick"){
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, when);
      osc.frequency.exponentialRampToValueAtTime(48, when + 0.14);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.22 * drumVolume(volume), when + 0.006);
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
      gain.gain.exponentialRampToValueAtTime((sound === "snare" ? 0.09 : 0.045) * drumVolume(volume), when + 0.004);
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
    const volume = opts.volume || (state.roundIndex === 0 ? volumeTuning.roundOneWord : volumeTuning.defaultWord);

  playTone({
    midi: button.note,
    when: now,
    duration: 0.22,
    volume,
    type: state.roundIndex >= 1 ? "square" : "triangle"
  });

    if (round.echo){
      playTone({ midi: button.note + 12, when: now + secondsPerBeat() / 2, duration: 0.16, volume: volumeTuning.wordEcho, type: "triangle" });
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
      playTone({ midi: 72, when: now, duration: 0.11, volume: volumeTuning.countdownGo, type: "square" });
      playTone({ midi: 76, when: now + 0.045, duration: 0.12, volume: volumeTuning.countdownGo * 0.85, type: "square" });
      playTone({ midi: 79, when: now + 0.09, duration: 0.14, volume: volumeTuning.countdownGo * 0.85, type: "square" });
      return;
    }

    const midi = step === 3 ? 60 : step === 2 ? 64 : 67;
    playTone({ midi, when: now, duration: 0.12, volume: volumeTuning.countdownBeep, type: "square" });
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
  console.log("Verse Jam selected mode:", selectedMode, "mode id:", selectedModeId(), "starting bpm:", currentRound().bpm);

  // IMPORTANT for iPhone/Safari:
  // Unlock audio immediately from the user's mode-button tap,
  // before any awaited fetch or other async work.
  await ensureAudio();

  initVerseData();
  chooseActiveBaseMelody();
  state.verseJson = await loadVerseJson();
  state.phase = "intro";
  renderShellGame();
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

    const introOffsets = INTRO_RHYTHM_OFFSETS;
    const startAt = nextMeasureStartTime();

    for (let i = 0; i < INTRO_WORDS.length; i += 1){
      if (state.screen !== "game") return;
      const offset = introOffsets[i] ?? i;
      const eventTime = startAt + offset * secondsPerBeat();
      await waitUntilAudioTime(eventTime);

      if (state.screen !== "game") return;
      const el = document.createElement("div");
      el.className = `versejam-intro-word is-in${i >= 3 ? " is-response-phrase" : ""}`;
      el.textContent = INTRO_WORDS[i];
      stack.appendChild(el);
      playTone({ midi: 72 + (i % 3) * 2, when: audioCtx.currentTime, duration: 0.12, volume: 0.08, type: "triangle" });
    }

    const children = Array.from(stack.children || []);

    // Start popping the words out after the final rest.
    // Intro rhythm is: tap/the/words/rest/match/my/beat/rest.
    // Since "beat" lands on offset 6, the disappear phrase should start on offset 8.
    const introPatternLengthBeats = measureAlignedLength(introOffsets);
    const outStart = startAt + introPatternLengthBeats * secondsPerBeat();
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
    state.currentRhythmOffsets = makeCurrentRhythmOffsets(state.currentButtons);
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
    setCueButton("MATCH THIS BEAT", "listen");

    const spawnStart = nextMeasureStartTime();

    const spawnButtons = [...state.currentButtons].sort((a, b) => {
      const aOrder = Number.isFinite(a.sequenceOrder) ? a.sequenceOrder : 0;
      const bOrder = Number.isFinite(b.sequenceOrder) ? b.sequenceOrder : 0;
      return aOrder - bOrder;
    });

    for (let i = 0; i < spawnButtons.length; i += 1){
      const button = spawnButtons[i];
      const offset = Number.isFinite(button.rhythmOffset)
        ? button.rhythmOffset
        : state.currentRhythmOffsets[i] ?? i;

      await waitUntilAudioTime(spawnStart + offset * secondsPerBeat());
      if (state.screen !== "game") return;

      spawnButton(button);

      if (isRhythmFillerButton(button)){
        playRhythmFillerSound(button);
      } else {
        playTone({ midi: button.note, when: audioCtx.currentTime, duration: 0.12, volume: volumeTuning.buttonPopIn, type: "triangle" });
      }
    }

    await runEchoCountdown();
  }

  function spawnButton(button){
    const stack = document.getElementById("versejamWordStack") || document.getElementById("versejamButtonStack");
    if (!stack) return;

    const btn = document.createElement("button");
    btn.className = `versejam-word-btn is-spawning no-zoom${isClapButton(button) ? " is-clap-button" : ""}${isSoundBitButton(button) ? " is-sound-bit-button" : ""}`;
    btn.id = button.id;
    btn.type = "button";
    btn.textContent = button.label;
    btn.dataset.segmentIndex = String(button.segmentIndex);

    btn.style.order = String(
      Number.isFinite(button.visualOrder)
        ? button.visualOrder
        : Number.isFinite(button.sequenceOrder)
          ? button.sequenceOrder
          : 0
    );    

    btn.dataset.sequenceOrder = String(button.sequenceOrder ?? "");
    btn.dataset.buttonKind = button.kind || "word";

    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handleButtonTap(button.id);
    });
    stack.appendChild(btn);
    setTimeout(() => btn.classList.remove("is-spawning"), 280);
    addFloatNote(btn, isClapButton(button) ? "👏" : isSoundBitButton(button) ? "!" : "♪");
  }

function cueNextButton(){
  document.querySelectorAll(".versejam-word-btn").forEach(btn => {
    btn.classList.remove("is-next", "is-rainbow-next");

    const button = state.currentButtons.find(item => item.id === btn.id);

    if (isButtonExpected(button)){
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
    const sequenceIndex = getExpectedSequenceOrder();
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

    if (!isButtonExpected(button)){
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
    if (isRhythmFillerButton(button)){
      playRhythmFillerSound(button);
    } else {
      playWordNote(button);
    }

    explodeButton(btnEl);

    await sleep(150);
    btnEl.remove();

  let buildProgressChanged = false;

  if (isRhythmFillerButton(button)){
    // Filler buttons are part of the rhythm pattern, but they do not
    // add anything to the verse build area.
    buildProgressChanged = false;
  } else if (button.kind === "reference_chapter"){
    // The shell build area has one combined reference segment.
    // Tapping the chapter button is part of the musical chunk, but
    // we wait to advance the build until the verses button is tapped.
    buildProgressChanged = false;
  } else {
    state.progressIndex += 1;
    buildProgressChanged = true;
  }

  if (buildProgressChanged){
    state.buildFitDone = false;
    updateBuildText();
  }

  state.currentButtons = state.currentButtons.filter(item => item.id !== buttonId);

  const phase = getPhase();
  const stillInReferenceChunk = state.currentButtons.some(isReferenceJamButton);
  const stillInRhythmFillerChunk = state.currentButtons.some(isRhythmFillerButton);

  if (
    state.currentButtons.length === 0 ||
    (!stillInReferenceChunk && !stillInRhythmFillerChunk && phase !== "words")
  ){
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
    const message = state.roundIndex === 1 ? ["nice!", "now", "jam"] : ["speed", "it", "up"];
    area.innerHTML = `<div class="versejam-intro-stack" id="versejamIntroStack"></div>`;
    const stack = document.getElementById("versejamIntroStack");

    await sleep(nextMeasureDelayMs());

    for (const word of message){
      const el = document.createElement("div");
      el.className = "versejam-intro-word is-in";
      el.textContent = word;
      stack.appendChild(el);
      const transitionNotes = [72, 76, 79]; // C, E, G — same C-centered sound as the main verse notes
playTone({ midi: transitionNotes[(stack.children.length - 1) % transitionNotes.length], when: audioCtx.currentTime, duration: 0.14, volume: 0.09, type: "square" });
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
      title: "Choose Your Speed",
      icon: "🥁",
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
      note.textContent = `You played the verse ${currentRoundConfigs().length} times · ${seconds}s`;
      const actions = center.querySelector(".vm-game-actions");
      center.insertBefore(note, actions || null);
    }
  }

  function helpHtml(){
    return `
      Tap the next verse word to play its note.<br><br>
      Beginner: normal starting speed.<br>
      Advanced: faster starting speed and faster tempo climb.<br><br>
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

  installAudioUnlockHandlers();
  setScreen("intro");
})();
