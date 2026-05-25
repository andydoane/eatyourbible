/* =====================================================
   Verse Memory — App Structure

   TABLE OF CONTENTS

   1. Assets / Constants
   2. Utility Functions
   3. Global State
   4. Verse Loading
   5. Screen Definitions
   6. Game Framework
   7. Main Render
   8. App Bootstraps

   Tip:
   Search for "====" to quickly jump between sections.
   ===================================================== */

/* =========================================================
   Assets / folders (your GitHub directory structure)
   ========================================================= */
const AUDIO_DIR = "verse_audio/";
const WORDS_AUDIO_DIR = AUDIO_DIR + "words/";
const DATA_DIR = "verse_data/";
const IMG_DIR = "verse_images/";
const PET_IMG_DIR = "pet_images/";

// =========================================================
// DEBUG fallback: lets the app run offline (file://) without fetch()
// Set DEBUG_MODE = false when you’re ready to remove this.
// =========================================================
const DEBUG_MODE = false;

const DEBUG_VERSE_JSON = {
  "verseId": "john_3_16",
  "translation": "ESV",
  "attribution": "Debug mode verse data (remove before publishing).",
  "verseText": "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
  "echoParts": [
    "For God so loved the world",
    "that he gave his only Son",
    "that whoever believes in him",
    "should not perish but have eternal life."
  ],
  "hidePlan": [
    { "type": "emoji", "word": "God", "occurrence": 1, "emoji": "👑" },
    { "type": "emoji", "word": "world", "occurrence": 1, "emoji": "🌍" },
    { "type": "emoji", "word": "gave", "occurrence": 1, "emoji": "🎁" },
    { "type": "emoji", "word": "Son", "occurrence": 1, "emoji": "👦" },
    { "type": "underscore", "word": "whoever", "occurrence": 1 },
    { "type": "underscore", "word": "believes", "occurrence": 1 },
    { "type": "underscore", "word": "perish", "occurrence": 1 },
    { "type": "underscore", "word": "eternal", "occurrence": 1 },
    { "type": "underscore", "word": "life", "occurrence": 1 }
  ]
};


/* Pick your actual filenames in verse_images/ (safe defaults) */
const INTRO_LOGO = IMG_DIR + "eyb_logo_1.png";
const TITLE_LOGO = IMG_DIR + "title_biblozoo.png";
const TITLE_FACE_FRONT = IMG_DIR + "brain_face_front.svg";
const TITLE_FACE_BACK = IMG_DIR + "brain_face_back.svg";
const TITLE_BIBLE = IMG_DIR + "brain_bible.svg";

const TITLE_ZOO_SCENE_COUNT = 8;
const titleZooSceneIndex = Math.floor(Math.random() * TITLE_ZOO_SCENE_COUNT) + 1;

let titleZooPetVerseId = "";
let titleZooPetDirection = Math.random() < 0.5 ? "from-left" : "from-right";

const TITLE_ZOO_PET_DANCE_CLASSES = [
  "dance-nod"
];

let titleZooPetDanceClass = "dance-nod";

function pickTitleZooPetDirection() {
  return Math.random() < 0.5 ? "from-left" : "from-right";
}

function pickTitleZooPetDanceClass() {
  return "dance-nod";
}

function getTitleZooScene() {
  return {
    bg: `${IMG_DIR}zoo_${titleZooSceneIndex}_bg.jpg`,
    fg: `${IMG_DIR}zoo_${titleZooSceneIndex}_fg.png`
  };
}

const loadedBibloPetImageSrcs = new Set();
const missingBibloPetImageSrcs = new Set();

function getBibloPetImageSrcForVerseId(verseId) {
  return `${PET_IMG_DIR}pet_${verseId}.png`;
}

function handleBibloPetImageLoad(img) {
  if (!img) return;

  const src = img.getAttribute("src") || "";
  if (src) {
    loadedBibloPetImageSrcs.add(src);
    missingBibloPetImageSrcs.delete(src);
  }

  img.classList.add("is-loaded");
  img.classList.remove("is-missing");
}

function handleBibloPetImageError(img) {
  if (!img) return;

  const src = img.getAttribute("src") || "";
  if (src) {
    missingBibloPetImageSrcs.add(src);
    loadedBibloPetImageSrcs.delete(src);
  }

  img.classList.add("is-missing");
  img.classList.remove("is-loaded");
}

function preloadBibloPetImageForVerseId(verseId) {
  const src = getBibloPetImageSrcForVerseId(verseId);

  if (!src) return Promise.resolve(false);

  if (loadedBibloPetImageSrcs.has(src)) {
    return Promise.resolve(true);
  }

  if (missingBibloPetImageSrcs.has(src)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      loadedBibloPetImageSrcs.add(src);
      missingBibloPetImageSrcs.delete(src);
      resolve(true);
    };

    img.onerror = () => {
      missingBibloPetImageSrcs.add(src);
      loadedBibloPetImageSrcs.delete(src);
      resolve(false);
    };

    img.src = src;
  });
}

function bibloPetVisualHtml(verseId, emoji) {
  const safeVerseId = escapeHtml(verseId || "");
  const safeEmoji = escapeHtml(emoji || "🐾");
  const rawImgSrc = getBibloPetImageSrcForVerseId(verseId);
  const imgSrc = escapeHtml(rawImgSrc);

  const cachedClass = loadedBibloPetImageSrcs.has(rawImgSrc)
    ? " is-loaded"
    : missingBibloPetImageSrcs.has(rawImgSrc)
      ? " is-missing"
      : "";

  return `
    <span class="biblopet-visual" data-verse-id="${safeVerseId}">
      <img
        class="biblopet-img${cachedClass}"
        src="${imgSrc}"
        alt=""
        draggable="false"
        onload="handleBibloPetImageLoad(this)"
        onerror="handleBibloPetImageError(this)"
      >
      <span class="biblopet-emoji-fallback">${safeEmoji}</span>
    </span>
  `;
}

function titleZooPetVisitorHtml(pet) {
  if (!pet) return "";

  return `
    <div
      class="title-zoo-pet-visitor ${escapeHtml(titleZooPetDirection)} ${escapeHtml(titleZooPetDanceClass)}"
      title="${escapeHtml(pet.name)}"
      data-verse-id="${escapeHtml(pet.verseId)}"
      style="${escapeHtml(getTitleZooPetFeetStyle(pet))}"
    >
      <div class="title-zoo-pet-motion">
        <div class="title-zoo-pet-rotator">
          ${bibloPetVisualHtml(pet.verseId, pet.emoji)}
        </div>
      </div>
    </div>
  `;
}

function titleZooStripHtml() {
  const scene = getTitleZooScene();
  const pet = getTitleZooPet();

  return `
    <button
      class="title-zoo-strip no-zoom"
      id="titleZooStrip"
      type="button"
      aria-label="Visit BibloPet Zoo"
    >
      <img
        class="title-zoo-layer title-zoo-bg"
        src="${scene.bg}"
        alt=""
        draggable="false"
        onerror="this.closest('.title-zoo-strip')?.classList.add('is-missing')"
      >

      <div class="title-zoo-pet-layer" aria-hidden="true">
        ${titleZooPetVisitorHtml(pet)}
      </div>

      <img
        class="title-zoo-layer title-zoo-fg"
        src="${scene.fg}"
        alt=""
        draggable="false"
        onerror="this.closest('.title-zoo-strip')?.classList.add('is-missing')"
      >
    </button>
  `;
}

function titleZooVisitButtonHtml() {
  const pet = getTitleZooPet();

  if (!pet) return "";

  return `
    <button
      class="title-zoo-visit-btn no-zoom"
      id="titleZooVisitBtn"
      type="button"
      data-verse-id="${escapeHtml(pet.verseId)}"
    >
      Visit ${escapeHtml(pet.name)}
    </button>
  `;
}

function updateTitleZooVisitButton(rootEl, pet) {
  const btn = rootEl?.querySelector?.("#titleZooVisitBtn");
  if (!btn || !pet) return;

  btn.setAttribute("data-verse-id", pet.verseId);
  btn.textContent = `Visit ${pet.name}`;
}

function restartTitleZooPetAnimation(rootEl) {
  const visitor = rootEl?.querySelector?.(".title-zoo-pet-visitor");
  if (!visitor) return;

  visitor.classList.add("is-resetting");

  // Force the browser to fully apply "animation: none" before restarting.
  void visitor.offsetWidth;

  requestAnimationFrame(() => {
    visitor.classList.remove("is-resetting");
  });
}

function updateTitleZooPetVisitor(rootEl, pet) {
  if (!rootEl || !pet) return;

  const visitor = rootEl.querySelector(".title-zoo-pet-visitor");
  if (!visitor) return;

  titleZooPetDirection = pickTitleZooPetDirection();
  titleZooPetDanceClass = pickTitleZooPetDanceClass();

  visitor.classList.remove(
    "from-left",
    "from-right",
    ...TITLE_ZOO_PET_DANCE_CLASSES
  );

  visitor.classList.add(titleZooPetDirection, titleZooPetDanceClass);

  visitor.setAttribute("title", pet.name);
  visitor.setAttribute("data-verse-id", pet.verseId);

  applyTitleZooPetFeetStyle(visitor, pet);

  visitor.innerHTML = `
    <div class="title-zoo-pet-motion">
      <div class="title-zoo-pet-rotator">
        ${bibloPetVisualHtml(pet.verseId, pet.emoji)}
      </div>
    </div>
  `;

  updateTitleZooVisitButton(rootEl, pet);
}

/* =========================================================
   Inline SVG icons (copied from Ten Commandments / Creed apps)
   ========================================================= */
const SVG_BACK = `
<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
    d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
    transform="translate(246.77226)" />
</svg>`;

const SVG_HOME = `
<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M12 3L3 10h2v9h5v-6h4v6h5v-9h2L12 3z" fill="#ffffff"/>
</svg>`;

const SVG_FORWARD = `
<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path style="fill:#ffffff;stroke-width:74.9031;stroke-linecap:round"
    d="M 90.101697,426.07323 665.52324,88.164306 a 20.830539,20.830539 29.78848 0 1 31.37872,17.962384 v 676.74658 a 20.830539,20.830539 150.21152 0 1 -31.37872,17.96238 L 90.101697,462.92673 a 21.369052,21.369052 90 0 1 0,-36.8535 z"
    transform="matrix(-1,0,0,1,1023.2277,0)" />
</svg>`;

const SVG_MUTE = `
<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path style="fill:#ffffff;stroke:none;stroke-width:44.9431;stroke-linecap:round"
    d="M 660.98465,87.244161 409.97079,241.6972 a 150.47802,150.47802 0 0 1 -78.85883,22.31829 H 225.63234 a 42.587633,42.587633 0 0 0 -42.58762,42.58762 v 275.79372 a 42.587633,42.587633 0 0 0 42.58762,42.58762 h 105.47962 a 150.47802,150.47802 0 0 1 78.85883,22.3183 l 251.01386,154.45304 a 23.799138,23.799138 0 0 0 36.27121,-20.26933 V 107.51349 A 23.799138,23.799138 0 0 0 660.98465,87.244161 Z" />
  <g transform="translate(-26.458334,-255.59263)">
    <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
      d="M 1241.4124,524.69155 890.61025,875.49365" />
    <path style="fill:none;stroke:#ffffff;stroke-width:76.7747;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
      d="m 890.61025,524.69155 350.80215,350.8021" />
  </g>
</svg>`;

const SVG_UNMUTE = `
<svg class="nav-icon" viewBox="0 0 1270 889" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g transform="matrix(2.9017243,0,0,2.9017243,-948.59169,1423.6267)">
    <path style="fill:#ffffff;stroke:none;stroke-width:15.4884;stroke-linecap:round"
      d="m 554.69651,-460.54773 -86.50507,53.22802 a 51.858137,51.858137 0 0 1 -27.17654,7.69139 h -36.35067 a 14.676664,14.676664 0 0 0 -14.67666,14.67666 v 95.04477 a 14.676664,14.676664 0 0 0 14.67666,14.67666 h 36.35067 a 51.858137,51.858137 0 0 1 27.17654,7.69139 l 86.50507,53.22802 a 8.2017227,8.2017227 0 0 0 12.49988,-6.98527 v -232.26637 a 8.2017227,8.2017227 0 0 0 -12.49988,-6.98527 z" />
    <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
      d="m 596.38634,-270.01659 c 26.00162,-13.81364 42.0863,-39.52797 42.16745,-67.41243 -0.0102,-27.95044 -16.10446,-53.75052 -42.16745,-67.5969" />
    <path style="fill:none;stroke:#ffffff;stroke-width:26.4583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"
      d="m 626.65943,-233.57231 c 4.34269,-2.51562 16.69789,-10.99898 23.86366,-17.76894 23.32002,-22.03191 37.74343,-52.46821 37.74343,-86.08777 0,-33.61956 -14.42341,-64.05637 -37.74343,-86.08828 -7.16577,-6.76996 -19.52097,-15.25332 -23.86366,-17.76894" />
  </g>
</svg>`;


/* =========================================================
   Minimal Verse Engine (Learn flow)
   - Loads old JSON unchanged
   - Uses old audio naming scheme
   - Implements: Listen -> Echo -> Hide words
   ========================================================= */
const app = document.getElementById("app");
const navBar = document.getElementById("navBar");

// overlay
const overlay = document.getElementById("overlay");
const dlgTitle = document.getElementById("dlgTitle");
const dlgBody = document.getElementById("dlgBody");
const dlgActions = document.getElementById("dlgActions");

function showDialog({ title = "Notice", body = "", bodyHtml = "", actions = [] }) {
  dlgTitle.textContent = title;

  if (bodyHtml) {
    dlgBody.innerHTML = bodyHtml;
  } else {
    dlgBody.textContent = body;
  }

  dlgActions.innerHTML = "";
  for (const a of actions) dlgActions.appendChild(a);
  overlay.classList.add("show");
}
function closeDialog() {
  overlay.classList.remove("show");
  dlgActions.classList.remove("pet-name-dialog-actions");
}
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDialog(); });

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dlgBtn(label, { secondary = false, onClick } = {}) {
  const b = document.createElement("button");
  b.className = "dlg-btn" + (secondary ? " secondary" : "");
  b.type = "button";
  b.textContent = label;
  b.onclick = onClick || (() => { });
  return b;
}

function homePillHtml(label = "Home") {
  return `
    <button class="screen-home-pill no-zoom" data-home-pill type="button" aria-label="${label}">
      ${SVG_HOME}
    </button>
  `;
}

function learnInstructionLineHtml(text) {
  return `
    <div class="learn-screen-instruction">
      ${escapeHtml(text)}
    </div>
  `;
}

function practiceBackPillHtml(label = "Back to Practice") {
  return `
    <button class="screen-home-pill no-zoom" data-practice-back-pill type="button" aria-label="${label}">
      ${SVG_BACK}
    </button>
  `;
}

function bindPracticeBackPill(rootEl) {
  const btn = rootEl?.querySelector?.("[data-practice-back-pill]");
  if (!btn) return;

  btn.onclick = (e) => {
    e.stopPropagation();

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) { }

    go(Screen.PRACTICE_HUB);
  };
}

function titleHomePillHtml(label = "Home") {
  return `
    <button class="screen-title-pill no-zoom" data-home-pill type="button" aria-label="${label}">
      ${SVG_HOME}
    </button>
  `;
}

function zooBackPillHtml(label = "Zoo") {
  return `
    <button class="screen-title-pill no-zoom" data-zoo-back-pill type="button" aria-label="Back to BibloPet Zoo">
      ${SVG_BACK}
    </button>
  `;
}

function bindZooBackPill(rootEl) {
  const btn = rootEl?.querySelector?.("[data-zoo-back-pill]");
  if (!btn) return;

  btn.onclick = (e) => {
    e.stopPropagation();

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) { }

    go(Screen.PROGRESS);
  };
}

function bindHomePill(rootEl) {
  const btn = rootEl?.querySelector?.("[data-home-pill]");
  if (!btn) return;

  btn.onclick = (e) => {
    e.stopPropagation();

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) { }

    State.pendingPetUnlockVerseId = null;
    State.activeTodo = null;
    go(Screen.TITLE);
  };
}

function ensureLearnMenuOverlay() {
  if (document.getElementById("learnMenuOverlay")) return;

  const menu = document.createElement("div");
  menu.id = "learnMenuOverlay";
  menu.className = "learn-menu-overlay";
  menu.setAttribute("aria-hidden", "true");

  menu.innerHTML = `
    <div class="learn-menu-dialog" role="dialog" aria-modal="true" aria-label="Learn Menu">
      <div class="learn-menu-title">Learn Menu</div>

      <div class="learn-menu-actions">
        <button class="learn-menu-action no-zoom" id="learnMenuClose" type="button">
          Close
        </button>

        <button class="learn-menu-action no-zoom" id="learnMenuExit" type="button">
          Exit Learn
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(menu);

  menu.addEventListener("click", (e) => {
    if (e.target === menu) closeLearnMenu();
  });

  const closeBtn = menu.querySelector("#learnMenuClose");
  if (closeBtn) closeBtn.onclick = closeLearnMenu;

  const exitBtn = menu.querySelector("#learnMenuExit");
  if (exitBtn) {
    exitBtn.onclick = () => {
      learnMenuPausedAudio = false;
      closeLearnMenu();
      resetLearn(true);
    };
  }
}

function openLearnMenu() {
  ensureLearnMenuOverlay();

  const menu = document.getElementById("learnMenuOverlay");
  if (!menu) return;

  learnMenuOpen = true;
  learnMenuPausedAudio = !audioEl.paused;

  try {
    audioEl.pause();
  } catch (e) { }

  menu.classList.add("show");
  menu.setAttribute("aria-hidden", "false");
}

function closeLearnMenu() {
  const menu = document.getElementById("learnMenuOverlay");
  if (!menu) return;

  menu.classList.remove("show");
  menu.setAttribute("aria-hidden", "true");

  learnMenuOpen = false;

  if (learnMenuPausedAudio) {
    learnMenuPausedAudio = false;

    safePlay().catch(() => {
      // If the browser refuses resume, the user can tap the main screen button again.
    });
  }
}

function getVerseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("v") || "john_3_16";
}

function hasVerseIdInUrl() {
  const params = new URLSearchParams(window.location.search);
  return !!params.get("v");
}

function getRequestedVerseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("v") || "";
}

/* Audio */
const audioEl = new Audio();
audioEl.preload = "auto";

let learnMenuOpen = false;
let learnMenuPausedAudio = false;

let muted = false;
function applyMute() {
  audioEl.muted = muted;
}
function toggleMute() {
  muted = !muted;
  applyMute();
  // stop current audio immediately
  try { audioEl.pause(); } catch (e) { }
  try { audioEl.currentTime = 0; } catch (e) { }
  renderNav(); // update icon
}

function safePlay() {
  applyMute();
  return audioEl.play().catch((err) => {
    showDialog({
      title: "Audio can’t play yet",
      body: "Your browser blocked playback. Tap play again (or make sure the mp3 exists).",
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
    throw err;
  });
}

function setAudioSrc(src) {
  audioEl.src = src;
  try { audioEl.load(); } catch (e) { }
}

function getRemoveInstructionButtonText() {
  return hideWordsPerRound() > 1 ? "Remove Words" : "Remove a Word";
}

function getLearnInstructionConfig(key) {
  const configs = {
    listen: {
      image: "verse_listen.png",
      title: "Listen to the verse",
      subtext: "Tap the button to listen to the verse.",
      button: "Read It To Me",
      audio: "instructions_listen.mp3"
    },
    meaning: {
      image: "verse_meaning.png",
      title: "What It Means",
      subtext: "Let's look at what this verse means.",
      button: "What It Means",
      audio: "instructions_meaning.mp3"
    },
    chunks1: {
      image: "verse_chunks.png",
      title: "Break It Down",
      subtext: "Let's break the verse down into bite-sized chunks.",
      button: "Break It Down",
      audio: "instructions_chunks1.mp3"
    },
    chunks2: {
      image: "verse_chunks.png",
      title: "One More Time",
      subtext: "Let's do that one more time.",
      button: "One More Time",
      audio: "instructions_chunks2.mp3"
    },
    echo1: {
      image: "verse_echo.png",
      title: "Echo the Verse",
      subtext: "Repeat after me when each chunk turns green.",
      button: "Echo the Verse",
      audio: "instructions_echo1.mp3"
    },
    remove: {
      image: "verse_remove.png",
      title: "Remove Words",
      subtext: "Let's remove one word at a time.",
      button: getRemoveInstructionButtonText(),
      audio: "instructions_remove.mp3"
    },
    final: {
      image: "verse_final.png",
      title: "Final Test",
      subtext: "Try to say the verse with only the first letters visible.",
      button: "Begin Test",
      audio: "instructions_final.mp3"
    },
    games: {
      image: "verse_games.png",
      title: "Practice the Verse",
      subtext: "Choose games or playground activities.",
      button: "Practice",
      audio: "instructions_games.mp3"
    }
  };

  return configs[key] || null;
}

const LEARN_INSTRUCTION_KEYS = [
  "listen",
  "meaning",
  "chunks1",
  "chunks2",
  "echo1",
  "remove",
  "final",
  "games"
];

const preloadedInstructionImages = new Set();

function preloadLearnInstructionImages() {
  for (const key of LEARN_INSTRUCTION_KEYS) {
    const cfg = getLearnInstructionConfig(key);
    if (!cfg?.image) continue;

    const src = `${IMG_DIR}${cfg.image}`;
    if (preloadedInstructionImages.has(src)) continue;

    const img = new Image();
    img.src = src;

    preloadedInstructionImages.add(src);
  }
}

function startLearnInstruction(key) {
  State.learnInstructionKey = key;
  State.learnInstructionReady = false;
  State.learnInstructionAudioStarted = false;
  State.instructionPlaying = false;
  State.instructionKey = "";

  State.forceSlideForward = true;
  go(Screen.LEARN_INSTRUCTION);
}

async function playLearnInstructionAudio() {
  if (State.screen !== Screen.LEARN_INSTRUCTION) return;
  if (State.learnInstructionAudioStarted) return;

  const cfg = getLearnInstructionConfig(State.learnInstructionKey);
  if (!cfg) return;

  State.learnInstructionAudioStarted = true;
  State.learnInstructionReady = false;
  State.instructionPlaying = true;
  State.instructionKey = State.learnInstructionKey;
  State.audioMode = "instruction";
  render();

  setAudioSrc(`${AUDIO_DIR}${cfg.audio}`);
  audioEl.currentTime = 0;

  try {
    await safePlay();
  } catch (e) {
    State.instructionPlaying = false;
    State.learnInstructionReady = true;
    render();
    return;
  }

  await new Promise((resolve) => {
    const onEnd = () => {
      audioEl.removeEventListener("ended", onEnd);
      resolve();
    };
    audioEl.addEventListener("ended", onEnd);
  });

  if (State.screen !== Screen.LEARN_INSTRUCTION) return;

  State.instructionPlaying = false;
  State.instructionKey = "";
  State.audioMode = null;
  State.learnInstructionReady = true;
  render();
}

function continueLearnInstruction() {
  const key = State.learnInstructionKey;

  State.learnInstructionReady = false;
  State.learnInstructionAudioStarted = false;
  State.instructionPlaying = false;
  State.instructionKey = "";

  if (key === "listen") {
    goToListenAndStart();
    return;
  }

  if (key === "meaning") {
    go(Screen.MEANING);
    return;
  }

  if (key === "chunks1" || key === "chunks2") {
    goToChunksAndStart();
    return;
  }

  if (key === "echo1") {
    goToEchoAndStart();
    return;
  }

  if (key === "remove") {
    goToHideAndStartRound();
    return;
  }

  if (key === "final") {
    goToFinalRecallAndStart();
    return;
  }

  if (key === "games") {
    State.hasLearnedVerse = true;

    if (VERSE_ID) {
      markLearnCompleted(VERSE_ID);
    }

    go(Screen.PRACTICE_HUB);
  }
}

/* JSON-configured verse */
let cfg = null;
let VERSE_ID = null;
let VERSE_TEXT = "";
let VERSE_MEANING = "";
let ECHO_PARTS = [];
let HIDE_PLAN = [];
let TRANSLATION = "";
let ATTRIBUTION = "";
let VERSE_REF = "";
let AUDIO_FILE = "";

let VERSE_LIST = [];
let HAS_VERSE_SELECTION = false;

/* =========================
   Progress Storage
   ========================= */
const PROGRESS_STORAGE_KEY = "verseMemoryProgress";
const PROGRESS_VERSION = 1;
const TRAFFIC_PROGRESS_MIGRATION_VERSION = 1;

function createEmptyProgress() {
  return {
    version: PROGRESS_VERSION,
    verses: {}
  };
}

function migrateTrafficProgress(progress) {
  if (!progress || typeof progress !== "object") return false;

  let changed = false;

  if (!progress.migrations || typeof progress.migrations !== "object") {
    progress.migrations = {};
    changed = true;
  }

  if (progress.migrations.trafficTapExternal >= TRAFFIC_PROGRESS_MIGRATION_VERSION) {
    return changed;
  }

  if (progress.verses && typeof progress.verses === "object") {
    for (const verseId of Object.keys(progress.verses)) {
      const verseProgress = progress.verses[verseId];
      if (!verseProgress || typeof verseProgress !== "object") continue;

      if (!verseProgress.games || typeof verseProgress.games !== "object") continue;

      const oldTraffic = verseProgress.games.traffic;
      const newTraffic = verseProgress.games.traffic_tap_external;

      if (!oldTraffic || newTraffic) continue;

      verseProgress.games.traffic_tap_external = {
        easyCompleted: !!oldTraffic.roadCompleted,
        mediumCompleted: !!oldTraffic.trailCompleted,
        hardCompleted: !!oldTraffic.riverCompleted
      };

      changed = true;
    }
  }

  progress.migrations.trafficTapExternal = TRAFFIC_PROGRESS_MIGRATION_VERSION;
  changed = true;

  return changed;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createEmptyProgress();
    if (!parsed.verses || typeof parsed.verses !== "object") parsed.verses = {};
    if (!parsed.version) parsed.version = PROGRESS_VERSION;

    const changed = migrateTrafficProgress(parsed);
    if (changed) {
      saveProgress(parsed);
    }

    return parsed;
  } catch (err) {
    console.warn("Could not load progress from localStorage", err);
    return createEmptyProgress();
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn("Could not save progress to localStorage", err);
  }
}

function isTrackedGameCompleted(gameId, gameProgress) {
  if (!gameId || !gameProgress) return false;

  if (gameId === "traffic") {
    return !!(gameProgress.roadCompleted || gameProgress.trailCompleted || gameProgress.riverCompleted);
  }

  return !!(gameProgress.easyCompleted || gameProgress.mediumCompleted || gameProgress.hardCompleted);
}

function getVerseProgress(verseId) {
  const progress = loadProgress();
  const verseProgress = progress.verses[verseId];

  if (verseProgress) return verseProgress;

  return {
    learnCompleted: false,
    games: {}
  };
}

function updateVerseProgress(verseId, updater) {
  if (!verseId) return;

  const progress = loadProgress();

  if (!progress.verses[verseId]) {
    progress.verses[verseId] = {
      learnCompleted: false,
      games: {}
    };
  }

  updater(progress.verses[verseId]);
  saveProgress(progress);
}

function markLearnCompleted(verseId) {
  updateVerseProgress(verseId, (verseProgress) => {
    const now = Date.now();

    verseProgress.learnCompleted = true;
    verseProgress.lastPracticedAt = now;

    if (!verseProgress.learnedAt) {
      verseProgress.learnedAt = now;
    }
  });
}

function markStandardGameCompleted(verseId, gameId, mode) {
  if (!verseId || !gameId || !mode) return;

  const progress = loadProgress();

  if (!progress.verses[verseId]) {
    progress.verses[verseId] = {
      learnCompleted: false,
      games: {}
    };
  }

  const verseProgress = progress.verses[verseId];
  const wasUnlocked = isBibloPetUnlocked(verseProgress);

  if (!verseProgress.games[gameId]) {
    verseProgress.games[gameId] = {
      easyCompleted: false,
      mediumCompleted: false,
      hardCompleted: false
    };
  }

  if (mode === "easy") {
    verseProgress.games[gameId].easyCompleted = true;
  }

  if (mode === "medium") {
    verseProgress.games[gameId].mediumCompleted = true;
  }

  if (mode === "hard") {
    verseProgress.games[gameId].hardCompleted = true;
  }

  verseProgress.lastPracticedAt = Date.now();

  const isUnlockedNow = isBibloPetUnlocked(verseProgress);

  if (!wasUnlocked && isUnlockedNow && !verseProgress.petUnlockShown) {
    verseProgress.petUnlockShown = true;
    State.pendingPetUnlockVerseId = verseId;
  }

  saveProgress(progress);

  if (State.pendingPetUnlockVerseId === verseId) {
    setTimeout(() => {
      if (State.pendingPetUnlockVerseId === verseId) {
        go(Screen.PET_UNLOCK);
      }
    }, 300);
  }
}


/* =========================
   Progress Star Helpers
   ========================= */


function getExternalTrackedGameIds() {
  const list = Array.isArray(window.EXTERNAL_VERSE_GAMES) ? window.EXTERNAL_VERSE_GAMES : [];

  return list
    .filter(entry => entry && entry.enabled !== false)
    .map(entry => entry.manifest)
    .filter(manifest => manifest && manifest.progressType === "standard")
    .map(manifest => manifest.id);
}

function getTrackedGameIds() {
  return getExternalTrackedGameIds();
}

// Count stars for a single game
function getGameStars(gameId, gameProgress) {
  if (!gameProgress) return 0;

  // Special case: Traffic Tap uses themes
  if (gameId === "traffic") {
    let stars = 0;
    if (gameProgress.roadCompleted) stars++;
    if (gameProgress.trailCompleted) stars++;
    if (gameProgress.riverCompleted) stars++;
    return stars;
  }

  // Standard games use difficulty levels
  let stars = 0;
  if (gameProgress.easyCompleted) stars++;
  if (gameProgress.mediumCompleted) stars++;
  if (gameProgress.hardCompleted) stars++;
  return stars;
}

// Calculate overall verse stars (0–3)
function getVerseStars(verseProgress) {
  if (!verseProgress || !verseProgress.games) return 0;

  const trackedGameIds = getTrackedGameIds();
  if (!trackedGameIds.length) return 0;

  let totalStars = 0;
  let maxStars = trackedGameIds.length * 3;

  for (const gameId of trackedGameIds) {
    const gameProgress = verseProgress.games[gameId];
    totalStars += getGameStars(gameId, gameProgress);
  }

  const avg = totalStars / maxStars; // 0 → 1
  return Math.round(avg * 3);        // scale to 0 → 3
}

// Convert number → display string
function starsToString(stars) {
  if (stars === 3) return "⭐⭐⭐";
  if (stars === 2) return "⭐⭐☆";
  if (stars === 1) return "⭐☆☆";
  return "☆☆☆";
}

function getStandardGameMedals(gameProgress) {
  return [
    gameProgress?.easyCompleted ? "🥉" : "🔒",
    gameProgress?.mediumCompleted ? "🥈" : "🔒",
    gameProgress?.hardCompleted ? "🥇" : "🔒"
  ].join(" ");
}

function getVerseCompletedMedalCount(verseProgress) {
  if (!verseProgress || !verseProgress.games) return 0;

  let total = 0;
  const trackedGameIds = getTrackedGameIds();

  for (const gameId of trackedGameIds) {
    const gp = verseProgress.games[gameId];
    if (!gp) continue;

    if (gameId === "traffic") {
      if (gp.roadCompleted) total++;
      if (gp.trailCompleted) total++;
      if (gp.riverCompleted) total++;
    } else {
      if (gp.easyCompleted) total++;
      if (gp.mediumCompleted) total++;
      if (gp.hardCompleted) total++;
    }
  }

  return total;
}

function canUseCustomPetBackgrounds(verseProgress) {
  return getVerseCompletedMedalCount(verseProgress) >= 5;
}

function getVerseDetailProgressDisplay(gameId, gameProgress) {
  if (gameId === "traffic") {
    return getTrafficThemeSlots(gameProgress);
  }

  return getStandardGameMedals(gameProgress);
}

function getExternalVerseDetailGames() {
  const list = Array.isArray(window.EXTERNAL_VERSE_GAMES) ? window.EXTERNAL_VERSE_GAMES : [];

  return list
    .filter(entry => entry && entry.enabled !== false)
    .map(entry => entry.manifest)
    .filter(manifest => manifest && manifest.progressType === "standard")
    .map(manifest => ({
      id: manifest.id,
      label: manifest.title
    }));
}

function getVerseDetailGames() {
  return getExternalVerseDetailGames();
}

function getStandardModeMedal(mode) {
  if (mode === "easy") return "🥉";
  if (mode === "medium") return "🥈";
  if (mode === "hard") return "🥇";
  return "🏅";
}

function getStandardModeLabel(mode) {
  if (mode === "easy") return "Easy";
  if (mode === "medium") return "Medium";
  if (mode === "hard") return "Hard";
  return "Game";
}

function wasStandardModeAlreadyCompleted(verseId, gameId, mode) {
  if (!verseId || !gameId || !mode) return false;

  const verseProgress = getVerseProgress(verseId);
  const gameProgress = verseProgress.games?.[gameId];

  if (!gameProgress) return false;

  if (mode === "easy") return !!gameProgress.easyCompleted;
  if (mode === "medium") return !!gameProgress.mediumCompleted;
  if (mode === "hard") return !!gameProgress.hardCompleted;

  return false;
}

function getStandardGameRewardTitle(verseId, gameId, mode) {
  const medal = getStandardModeMedal(mode);
  const label = getStandardModeLabel(mode);
  const alreadyEarned = wasStandardModeAlreadyCompleted(verseId, gameId, mode);

  if (alreadyEarned) {
    return `You finished ${label} again!`;
  }

  return `You earned a ${medal}!`;
}


/* =========================
   BibloPet Helpers
   ========================= */

const PET_NAME_MAX_LENGTH = 16;

const PET_NAME_BLOCKLIST_URL = "biblopet_name_blocklist.json";

// Small emergency fallback. Keep this empty or add a few private entries if desired.
const PET_NAME_FALLBACK_BLOCKLIST = [
  // "examplebadword"
];

let petNameBlocklist = [...PET_NAME_FALLBACK_BLOCKLIST];
let petNameBlocklistLoadPromise = null;

const PET_RANDOM_NAMES_URL = "pet_random_names.json";

// Emergency fallback in case the JSON file fails to load.
const PET_RANDOM_NAMES_FALLBACK = [
  "Buddy",
  "Sunny",
  "Pip",
  "Mochi",
  "Coco"
];

let petRandomNames = [...PET_RANDOM_NAMES_FALLBACK];
let petRandomNamesLoadPromise = null;

function hasAnyTrackedGameCompletion(verseProgress) {
  if (!verseProgress || !verseProgress.games) return false;

  const trackedGameIds = getTrackedGameIds();
  if (!trackedGameIds.length) return false;

  for (const gameId of trackedGameIds) {
    const gp = verseProgress.games[gameId];
    if (!gp) continue;

    if (gameId === "traffic") {
      if (gp.roadCompleted || gp.trailCompleted || gp.riverCompleted) {
        return true;
      }
    } else {
      if (gp.easyCompleted || gp.mediumCompleted || gp.hardCompleted) {
        return true;
      }
    }
  }

  return false;
}

function isBibloPetUnlocked(verseProgress) {
  if (!verseProgress) return false;
  return !!verseProgress.learnCompleted && hasAnyTrackedGameCompletion(verseProgress);
}

function getVerseListItemById(verseId) {
  return VERSE_LIST.find(item => item.id === verseId) || null;
}

function getBibloPetEmojiForListItem(item) {
  return item?.biblopet || "🐾";
}

function getBibloPetEmojiForCurrentVerse() {
  return cfg?.biblopet || "🐾";
}

function getBibloPetEmojiForVerseId(verseId) {
  const item = getVerseListItemById(verseId);
  if (item?.biblopet) return item.biblopet;

  if (cfg?.verseId === verseId && cfg?.biblopet) return cfg.biblopet;

  return "🐾";
}

function getBibloPetDefaultNameForVerseId(verseId) {
  const item = getVerseListItemById(verseId);

  if (item?.biblopetDefaultName) {
    return String(item.biblopetDefaultName).trim();
  }

  if (cfg?.verseId === verseId && cfg?.biblopetDefaultName) {
    return String(cfg.biblopetDefaultName).trim();
  }

  return "BibloPet";
}

function normalizeBibloPetFeetFromBottom(value) {
  const raw = String(value ?? "").trim();

  const match = raw.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (!match) return "0%";

  const num = Number(match[1]);
  if (!Number.isFinite(num)) return "0%";

  const clamped = Math.max(0, Math.min(100, num));
  return `${clamped}%`;
}

function getBibloPetFeetFromBottomForVerseId(verseId) {
  const item = getVerseListItemById(verseId);

  if (item?.biblopetFeetFromBottom) {
    return normalizeBibloPetFeetFromBottom(item.biblopetFeetFromBottom);
  }

  if (cfg?.verseId === verseId && cfg?.biblopetFeetFromBottom) {
    return normalizeBibloPetFeetFromBottom(cfg.biblopetFeetFromBottom);
  }

  return "0%";
}

function getTitleZooPetFeetStyle(pet) {
  const feetFromBottom = normalizeBibloPetFeetFromBottom(
    pet?.feetFromBottom || "0%"
  );

  return [
    `--title-zoo-pet-feet-from-bottom: ${feetFromBottom}`,
    `--title-zoo-pet-ground-shift: calc(-100% + ${feetFromBottom})`
  ].join("; ");
}

function applyTitleZooPetFeetStyle(visitor, pet) {
  if (!visitor || !pet) return;

  const feetFromBottom = normalizeBibloPetFeetFromBottom(
    pet.feetFromBottom || "0%"
  );

  visitor.style.setProperty("--title-zoo-pet-feet-from-bottom", feetFromBottom);
  visitor.style.setProperty("--title-zoo-pet-ground-shift", `calc(-100% + ${feetFromBottom})`);
}

function cleanPetName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PET_NAME_MAX_LENGTH);
}

function normalizePetNameForBlocklist(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function extractBlocklistWordsFromJson(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (!json || typeof json !== "object") {
    return [];
  }

  const possibleKeys = [
    "words",
    "blocklist",
    "blocked",
    "badWords",
    "profanity",
    "list"
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(json[key])) {
      return json[key];
    }
  }

  return Object.values(json).flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
  });
}

function extractRandomPetNamesFromJson(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (!json || typeof json !== "object") {
    return [];
  }

  const possibleKeys = [
    "names",
    "petNames",
    "randomNames",
    "list"
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(json[key])) {
      return json[key];
    }
  }

  return Object.values(json).flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
  });
}

async function loadPetRandomNames() {
  if (petRandomNamesLoadPromise) {
    return petRandomNamesLoadPromise;
  }

  petRandomNamesLoadPromise = fetch(PET_RANDOM_NAMES_URL, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    })
    .then((json) => {
      const names = extractRandomPetNamesFromJson(json)
        .map((name) => cleanPetName(name))
        .filter(Boolean)
        .filter((name) => !isPetNameBlocked(name));

      petRandomNames = [...new Set([
        ...names,
        ...PET_RANDOM_NAMES_FALLBACK.map(cleanPetName).filter(Boolean)
      ])];

      return petRandomNames;
    })
    .catch((err) => {
      console.warn("Could not load BibloPet random names", err);

      petRandomNames = PET_RANDOM_NAMES_FALLBACK
        .map(cleanPetName)
        .filter(Boolean);

      return petRandomNames;
    });

  return petRandomNamesLoadPromise;
}

async function loadPetNameBlocklist() {
  if (petNameBlocklistLoadPromise) {
    return petNameBlocklistLoadPromise;
  }

  petNameBlocklistLoadPromise = fetch(PET_NAME_BLOCKLIST_URL, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    })
    .then((json) => {
      const words = extractBlocklistWordsFromJson(json)
        .map((word) => normalizePetNameForBlocklist(word))
        .filter(Boolean);

      petNameBlocklist = [...new Set([
        ...PET_NAME_FALLBACK_BLOCKLIST.map(normalizePetNameForBlocklist).filter(Boolean),
        ...words
      ])];

      return petNameBlocklist;
    })
    .catch((err) => {
      console.warn("Could not load BibloPet name blocklist", err);

      petNameBlocklist = PET_NAME_FALLBACK_BLOCKLIST
        .map(normalizePetNameForBlocklist)
        .filter(Boolean);

      return petNameBlocklist;
    });

  return petNameBlocklistLoadPromise;
}

function isPetNameBlocked(value) {
  const normalized = normalizePetNameForBlocklist(value);
  if (!normalized) return false;

  return petNameBlocklist.some((blocked) => {
    const cleanBlocked = normalizePetNameForBlocklist(blocked);
    return cleanBlocked && normalized.includes(cleanBlocked);
  });
}

function getSavedPetNameForVerseId(verseId) {
  const verseProgress = getVerseProgress(verseId);
  const saved = cleanPetName(verseProgress?.petName || "");

  return saved || "";
}

function getBibloPetDisplayNameForVerseId(verseId) {
  return getSavedPetNameForVerseId(verseId) || getBibloPetDefaultNameForVerseId(verseId);
}

function getUnlockedTitleZooPets() {
  if (!Array.isArray(VERSE_LIST)) return [];

  return VERSE_LIST
    .map((item) => {
      const verseId = item?.id || "";
      const verseProgress = getVerseProgress(verseId);
      const unlocked = isBibloPetUnlocked(verseProgress);

      if (!verseId || !unlocked) return null;

      return {
        verseId,
        emoji: getBibloPetEmojiForVerseId(verseId),
        name: getBibloPetDisplayNameForVerseId(verseId),
        feetFromBottom: getBibloPetFeetFromBottomForVerseId(verseId)
      };
    })
    .filter(Boolean);
}

function chooseTitleZooPet({ avoidVerseId = "" } = {}) {
  const unlockedPets = getUnlockedTitleZooPets();

  if (!unlockedPets.length) {
    titleZooPetVerseId = "";
    return null;
  }

  let candidates = unlockedPets;

  if (avoidVerseId && unlockedPets.length > 1) {
    candidates = unlockedPets.filter((pet) => pet.verseId !== avoidVerseId);
  }

  const randomPet = candidates[Math.floor(Math.random() * candidates.length)];
  titleZooPetVerseId = randomPet.verseId;

  return randomPet;
}

function getTitleZooPet() {
  const unlockedPets = getUnlockedTitleZooPets();

  if (!unlockedPets.length) {
    titleZooPetVerseId = "";
    return null;
  }

  const rememberedPet = unlockedPets.find((pet) => pet.verseId === titleZooPetVerseId);
  if (rememberedPet) {
    return rememberedPet;
  }

  return chooseTitleZooPet();
}

function advanceTitleZooPet() {
  return chooseTitleZooPet({
    avoidVerseId: titleZooPetVerseId
  });
}

function bindTitleZooPetRotation(rootEl) {
  const visitor = rootEl?.querySelector?.(".title-zoo-pet-visitor");
  if (!visitor) return;

  let rotationInProgress = false;

  visitor.addEventListener("animationend", async (event) => {
    if (State.screen !== Screen.TITLE) return;

    const isRoamAnimation =
      event.animationName === "titleZooPetRoamFromLeft" ||
      event.animationName === "titleZooPetRoamFromRight";

    if (!isRoamAnimation) return;
    if (rotationInProgress) return;

    rotationInProgress = true;

    const nextPet = advanceTitleZooPet();

    if (!nextPet) {
      rotationInProgress = false;
      return;
    }

    await preloadBibloPetImageForVerseId(nextPet.verseId);

    if (State.screen !== Screen.TITLE) {
      rotationInProgress = false;
      return;
    }

    updateTitleZooPetVisitor(rootEl, nextPet);
    restartTitleZooPetAnimation(rootEl);

    rotationInProgress = false;
  });
}

function hasCustomPetNameForVerseId(verseId) {
  return !!getSavedPetNameForVerseId(verseId);
}

function savePetNameForVerseId(verseId, rawName) {
  if (!verseId) return { ok: false, message: "No verse selected." };

  const cleaned = cleanPetName(rawName);

  if (isPetNameBlocked(cleaned)) {
    return {
      ok: false,
      message: "Please choose a different name."
    };
  }

  updateVerseProgress(verseId, (verseProgress) => {
    if (cleaned) {
      verseProgress.petName = cleaned;
    } else {
      delete verseProgress.petName;
    }
  });

  return { ok: true, name: cleaned };
}

function getRandomPetName() {
  if (!petRandomNames.length) return "Buddy";
  return petRandomNames[Math.floor(Math.random() * petRandomNames.length)];
}

function getBibloPetStatusEmoji(verseProgress) {
  const status = getBibloPetStatus(verseProgress);

  if (status === "happy") return "😀";
  if (status === "hungry") return "🤤";
  if (status === "sleeping") return "😴";

  return "";
}

function getBibloPetStatusText(verseProgress) {
  const status = getBibloPetStatus(verseProgress);

  if (status === "locked") {
    return "Practice more to unlock your BibloPet.";
  }

  if (status === "happy") {
    return "Your BibloPet is happy!";
  }

  if (status === "hungry") {
    return "Your BibloPet is getting hungry. Practice this verse to feed it!";
  }

  if (status === "sleeping") {
    return "Your BibloPet is asleep. Practice to wake it up.";
  }

  return "";
}

function getBibloPetStatus(verseProgress) {
  if (!isBibloPetUnlocked(verseProgress)) return "locked";

  const last = verseProgress.lastPracticedAt;
  if (!last) {
    // If unlocked but never practiced timestamped,
    // treat as hungry to encourage first interaction
    return "hungry";
  }

  const now = Date.now();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);

  if (diffDays < 2) return "happy";
  if (diffDays < 7) return "hungry";
  return "sleeping";
}

function getBibloPetStats() {
  const stats = {
    totalVerses: Array.isArray(VERSE_LIST) ? VERSE_LIST.length : 0,
    unlocked: 0,
    happy: 0,
    hungry: 0,
    sleeping: 0
  };

  if (!Array.isArray(VERSE_LIST)) return stats;

  for (const item of VERSE_LIST) {
    const verseProgress = getVerseProgress(item.id);
    const unlocked = isBibloPetUnlocked(verseProgress);

    if (!unlocked) continue;

    stats.unlocked += 1;

    const status = getBibloPetStatus(verseProgress);
    if (status === "happy") stats.happy += 1;
    if (status === "hungry") stats.hungry += 1;
    if (status === "sleeping") stats.sleeping += 1;
  }

  return stats;
}

const HAPPY_PET_ANIMATIONS = [
  { class: "pet-happy-pace", duration: 2400 },
  { class: "pet-happy-flip", duration: 1800 },
  { class: "pet-happy-jump", duration: 2600 },
  { class: "pet-happy-lean", duration: 2000 },
  { class: "pet-happy-zoomies", duration: 2800 },
  { class: "pet-happy-roll-bob", duration: 4800 },
  { class: "pet-happy-hop-combo", duration: 5200 },
  { class: "pet-happy-hop-dance", duration: 18000 }
];

function isVerseMastered(verseProgress) {
  if (!verseProgress || !verseProgress.games) return false;

  const trackedGameIds = getTrackedGameIds();
  if (!trackedGameIds.length) return false;

  for (const gameId of trackedGameIds) {
    const gp = verseProgress.games[gameId];

    if (gameId === "traffic") {
      if (!gp?.roadCompleted || !gp?.trailCompleted || !gp?.riverCompleted) {
        return false;
      }
    } else {
      if (!gp?.easyCompleted || !gp?.mediumCompleted || !gp?.hardCompleted) {
        return false;
      }
    }
  }

  return true;
}

function getVerseBackgroundIndex(verseId) {
  const verseProgress = getVerseProgress(verseId);
  return Number.isInteger(verseProgress.bgIndex) ? verseProgress.bgIndex : 0;
}

function setVerseBackgroundIndex(verseId, index) {
  updateVerseProgress(verseId, (verseProgress) => {
    verseProgress.bgIndex = index;
  });
}

function cycleVerseBackground(verseId) {
  const current = getVerseBackgroundIndex(verseId);
  const TOTAL_BACKGROUNDS = 24;
  const next = (current + 1) % TOTAL_BACKGROUNDS;
  setVerseBackgroundIndex(verseId, next);
}

function getVerseBackgroundClass(verseId, verseProgress) {
  if (!canUseCustomPetBackgrounds(verseProgress)) return "";

  const bgIndex = getVerseBackgroundIndex(verseId);

  if (bgIndex === 1) return "pet-stage-stars";
  if (bgIndex === 2) return "pet-stage-clouds";
  if (bgIndex === 3) return "pet-stage-space";
  if (bgIndex === 4) return "pet-stage-aurora-green";
  if (bgIndex === 5) return "pet-stage-aurora-pink";
  if (bgIndex === 6) return "pet-stage-aurora-ice";
  if (bgIndex === 7) return "pet-stage-checker-classic";
  if (bgIndex === 8) return "pet-stage-checker-sunset";
  if (bgIndex === 9) return "pet-stage-checker-mint";
  if (bgIndex === 10) return "pet-stage-checker-night";
  if (bgIndex === 11) return "pet-stage-confetti";
  if (bgIndex === 12) return "pet-stage-sunset";
  if (bgIndex === 13) return "pet-stage-bubbles";
  if (bgIndex === 14) return "pet-stage-lava";
  if (bgIndex === 15) return "pet-stage-water";
  if (bgIndex === 16) return "pet-stage-ice";
  if (bgIndex === 17) return "pet-stage-plain";
  if (bgIndex === 18) return "pet-stage-desert";
  if (bgIndex === 19) return "pet-stage-library";
  if (bgIndex === 20) return "pet-stage-denim-blue";
  if (bgIndex === 21) return "pet-stage-denim-red";
  if (bgIndex === 22) return "pet-stage-denim-green";
  if (bgIndex === 23) return "pet-stage-blueprint";

  return "pet-stage-rainbow";
}

const HUNGRY_FOOD_POOL = [
  "🍎", "🥩", "🧀", "🍓", "🥕", "🌮", "🍇", "🍪", "🥨", "🍌"
];

let hungryFoodTimer = null;

function getRandomHungryFoodPair() {
  if (HUNGRY_FOOD_POOL.length < 2) {
    return { left: "🍎", right: "🍞" };
  }

  const leftIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);
  let rightIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);

  while (rightIndex === leftIndex) {
    rightIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);
  }

  return {
    left: HUNGRY_FOOD_POOL[leftIndex],
    right: HUNGRY_FOOD_POOL[rightIndex]
  };
}

function clearHungryFoodCycle() {
  if (hungryFoodTimer) {
    clearInterval(hungryFoodTimer);
    hungryFoodTimer = null;
  }
}

function updateHungryFoodTargets(rootEl) {
  const leftEl = rootEl?.querySelector(".pet-hungry-food-target.left");
  const rightEl = rootEl?.querySelector(".pet-hungry-food-target.right");
  if (!leftEl || !rightEl) return;

  const pair = getRandomHungryFoodPair();
  leftEl.textContent = pair.left;
  rightEl.textContent = pair.right;
}

function startHungryFoodCycle(rootEl, petStatus) {
  clearHungryFoodCycle();

  if (petStatus !== "hungry") return;

  updateHungryFoodTargets(rootEl);

  hungryFoodTimer = setInterval(() => {
    if (!rootEl || !rootEl.isConnected) {
      clearHungryFoodCycle();
      return;
    }

    updateHungryFoodTargets(rootEl);
  }, 6000);
}

function applyPetMotionVars(rootEl) {
  const stage = rootEl?.querySelector(".pet-stage");
  if (!stage) return;

  const stageWidth = stage.clientWidth || 0;
  if (!stageWidth) return;

  const paceDistance = Math.max(42, Math.min(180, Math.round(stageWidth * 0.22)));
  const zoomNear = Math.max(180, Math.min(700, Math.round(stageWidth * 0.9)));
  const zoomFar = Math.max(210, Math.min(900, Math.round(stageWidth * 0.9)));

  const jump1 = Math.max(48, Math.min(90, Math.round(stageWidth * 0.14)));
  const jump2 = Math.max(92, Math.min(150, Math.round(stageWidth * 0.27)));
  const jump3 = Math.max(220, Math.min(360, Math.round(stageWidth * 0.52)));

  const rollLeft = Math.round(stageWidth * -0.42);
  const rollRight = Math.round(stageWidth * 0.42);
  const hopSide = Math.round(stageWidth * 0.27);

  stage.style.setProperty("--pet-pace-distance", `${paceDistance}px`);
  stage.style.setProperty("--pet-zoomies-near", `${zoomNear}px`);
  stage.style.setProperty("--pet-zoomies-far", `${zoomFar}px`);
  stage.style.setProperty("--pet-jump-1", `${jump1}px`);
  stage.style.setProperty("--pet-jump-2", `${jump2}px`);
  stage.style.setProperty("--pet-jump-3", `${jump3}px`);
  stage.style.setProperty("--pet-roll-left", `${rollLeft}px`);
  stage.style.setProperty("--pet-roll-right", `${rollRight}px`);
  stage.style.setProperty("--pet-hop-side", `${hopSide}px`);
}

function getRandomHappyPetAnimationClass() {
  const options = [
    "pet-happy-pace",
    "pet-happy-flip"
  ];

  return options[Math.floor(Math.random() * options.length)];
}

function getBibloPetAnimationClass(verseId, verseProgress) {
  const status = getBibloPetStatus(verseProgress);

  if (status === "locked") return "";

  // Sleeping = fixed
  if (status === "sleeping") {
    return "pet-sleeping";
  }

  // Hungry = pacing with disappearing food targets
  if (status === "hungry") {
    return "pet-hungry-pace";
  }

  // Happy = controlled system
  if (status === "happy") {
    if (State.petAnimPhase === "action") {
      return State.petAnimActionClass;
    }

    return "pet-happy-idle";
  }

  return "";
}

function startPetAnimationCycle(verseId, verseProgress) {
  const status = getBibloPetStatus(verseProgress);

  if (status !== "happy") {
    clearPetAnimationCycle();
    State.petAnimPhase = "idle";
    State.petAnimActionClass = "";
    return;
  }

  if (State.petAnimTimer) return;

  function scheduleIdle() {
    State.petAnimPhase = "idle";
    State.petAnimActionClass = "";
    render();

    const idleTime = 2000 + Math.random() * 4000;

    State.petAnimTimer = setTimeout(() => {
      State.petAnimTimer = null;
      scheduleAction();
    }, idleTime);
  }

  function scheduleAction() {
    const action =
      HAPPY_PET_ANIMATIONS[Math.floor(Math.random() * HAPPY_PET_ANIMATIONS.length)];

    State.petAnimActionClass = action.class;
    State.petAnimActionDuration = action.duration;
    State.petAnimPhase = "action";
    render();

    const actionTime = State.petAnimActionDuration || 2000;

    State.petAnimTimer = setTimeout(() => {
      State.petAnimTimer = null;
      scheduleIdle();
    }, actionTime);
  }

  // Start on the next tick, not during render
  State.petAnimTimer = setTimeout(() => {
    State.petAnimTimer = null;
    scheduleIdle();
  }, 0);
}

function clearPetAnimationCycle() {
  if (State.petAnimTimer) {
    clearTimeout(State.petAnimTimer);
    State.petAnimTimer = null;
  }

  State.petAnimPhase = "idle";
  State.petAnimActionClass = "";
}

async function playVerseDetailListen() {
  try {
    setAudioSrc(refAudioFile());
    audioEl.currentTime = 0;
    await safePlay();
    await waitForAudioEnd();

    setAudioSrc(AUDIO_FILE);
    audioEl.currentTime = 0;
    await safePlay();
    await waitForAudioEnd();

    setAudioSrc(AUDIO_FILE);
  } catch (err) {
    console.warn("Verse detail listen failed", err);
  }
}

// tokenization (copied conceptually from old engine)
const TokenType = { SPACE: "space", WORD: "word", PUNCT: "punct", OTHER: "other" };
function tokenize(text) {
  const re = /(\s+|[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]+)/g;
  const raw = text.match(re) || [];
  return raw.map(t => {
    if (/^\s+$/.test(t)) return { type: TokenType.SPACE, text: t };
    if (/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(t)) return { type: TokenType.WORD, text: t };
    if (/^[0-9]+$/.test(t)) return { type: TokenType.WORD, text: t };
    if (/^[^\sA-Za-z0-9]+$/.test(t)) return { type: TokenType.PUNCT, text: t };
    return { type: TokenType.OTHER, text: t };
  });
}

let tokens = [];
let planResolved = [];
let planMixed = [];
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function resolveHidePlanToTokenIndices(tokens, plan) {
  const wordPositionsByLower = new Map();
  tokens.forEach((tok, idx) => {
    if (tok.type !== TokenType.WORD) return;
    const key = tok.text.toLowerCase();
    if (!wordPositionsByLower.has(key)) wordPositionsByLower.set(key, []);
    wordPositionsByLower.get(key).push(idx);
  });

  return plan.map((item) => {
    const key = String(item.word).toLowerCase();
    const list = wordPositionsByLower.get(key) || [];
    const occ = item.occurrence ?? 1;
    const tokenIndex = list[occ - 1];
    return { ...item, tokenIndex };
  }).filter(x => Number.isFinite(x.tokenIndex));
}
function reshuffleHidePlan() {
  planMixed = shuffleArray([...planResolved]);
}

function verseIdToRef(verseId, translation) {
  const parts = String(verseId || "").split("_").filter(Boolean);

  let nums = [];
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])) {
    nums.unshift(parts.pop());
  }

  const bookSlug = parts.join(" ");
  const book = bookSlug.replace(/\b\w/g, c => c.toUpperCase());

  const chapter = nums[0] || "1";
  const verse = nums[1] || "1";
  const verseEnd = nums[2] || "";

  const versePart = verseEnd ? `${verse}–${verseEnd}` : verse;
  const t = translation ? ` (${translation})` : "";

  return `${book} ${chapter}:${versePart}${t}`;
}

function getTitleSubtitle() {
  if (!HAS_VERSE_SELECTION) {
    return "Choose a verse to begin";
  }
  return VERSE_REF;
}

function getVerseFitClass(text) {
  const raw = String(text || "").trim();

  if (!raw) return "verse-fit-medium";

  const compact = raw.replace(/\s+/g, " ").trim();
  const len = compact.length;

  if (len <= 38) return "verse-fit-short";
  if (len <= 90) return "verse-fit-medium";
  if (len <= 135) return "verse-fit-long";
  return "verse-fit-extra-long";
}

function smartLearnTextHtml({ title = "", body = "", extraClass = "" } = {}) {
  return `
    <div class="smart-learn-text ${escapeHtml(extraClass)}" data-smart-learn-text>
      ${title
      ? `<div class="smart-learn-title">${escapeHtml(title)}</div>`
      : ``
    }
      <div class="smart-learn-body">${escapeHtml(body)}</div>
    </div>
  `;
}

const LEARN_CHUNK_COLORS = [
  "#ff5a51",
  "#ffa351",
  "#ffc751",
  "#a7cb6f",
  "#40b9c5",
  "#7f66c6"
];

let learnChunkColorCacheKey = "";
let learnChunkColorOrder = [];

function shuffleLearnChunkColors(colors) {
  const arr = colors.slice();

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
}

function getLearnChunkColorOrder(count) {
  const cacheKey = `${VERSE_ID}`;

  if (learnChunkColorCacheKey !== cacheKey || learnChunkColorOrder.length !== LEARN_CHUNK_COLORS.length) {
    learnChunkColorCacheKey = cacheKey;
    learnChunkColorOrder = shuffleLearnChunkColors(LEARN_CHUNK_COLORS);
  }

  return Array.from({ length: count }, (_, i) => {
    return learnChunkColorOrder[i % learnChunkColorOrder.length];
  });
}

function getChunkVisibleCount(learnParts) {
  const count = Array.isArray(learnParts) ? learnParts.length : 0;

  if (!count) return 0;

  if (State.chunkRunning) {
    return Math.max(0, Math.min(count, State.chunkIndex + 1));
  }

  if (State.chunkPassCount > 0) {
    return count;
  }

  return 0;
}

function learnChunkStageHtml(learnParts, visibleCount = 0) {
  const chunks = Array.isArray(learnParts) && learnParts.length
    ? learnParts
    : [{ text: VERSE_TEXT }];

  const fitText = chunks
    .map((part) => part?.text || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const chunkColors = getLearnChunkColorOrder(chunks.length);

  return `
    <div
      class="learn-chunk-stage"
      data-smart-learn-text
      data-smart-fit-text="${escapeHtml(fitText)}"
    >
      <div class="smart-learn-body learn-chunk-body">
        ${chunks.map((part, i) => {
    const color = chunkColors[i];
    const visibleClass = i < visibleCount ? " is-visible" : "";

    return `
          <span
            class="learn-chunk-piece${visibleClass}"
            style="--chunk-color:${escapeHtml(color)};"
          >${escapeHtml(part?.text || "")}</span>
        `;
  }).join("")}
      </div>
    </div>
  `;
}

function getEchoChunkStateClass(index) {
  if (!State.echoRunning && !State.echoDone) {
    return "is-future";
  }

  if (State.echoDone) {
    return "is-completed";
  }

  if (index < State.echoIndex) {
    return "is-completed";
  }

  if (index > State.echoIndex) {
    return "is-future";
  }

  return State.echoSpeaking ? "is-echoing" : "is-listening";
}

function learnEchoStageHtml(learnParts) {
  const chunks = Array.isArray(learnParts) && learnParts.length
    ? learnParts
    : [{ text: VERSE_TEXT }];

  const fitText = chunks
    .map((part) => part?.text || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return `
    <div
      class="learn-echo-stage"
      data-smart-learn-text
      data-smart-fit-text="${escapeHtml(fitText)}"
    >
      <div class="smart-learn-body learn-echo-body">
        ${chunks.map((part, i) => {
    const stateClass = getEchoChunkStateClass(i);

    return `
          <span class="learn-echo-piece ${stateClass}">
            ${escapeHtml(part?.text || "")}
          </span>
        `;
  }).join("")}
      </div>
    </div>
  `;
}

function getSmartLearnLineHeight(textLength, stageRatio) {
  if (stageRatio > 1.35) {
    if (textLength <= 90) return 1.10;
    if (textLength <= 190) return 1.08;
    return 1.05;
  }

  if (textLength <= 80) return 1.18;
  if (textLength <= 170) return 1.12;
  return 1.06;
}

function getSmartLearnWidthRatio(textLength, stageRatio) {
  if (stageRatio > 1.35) {
    return 0.96;
  }

  if (stageRatio > 1.05) {
    return 0.93;
  }

  if (textLength <= 80) {
    return 0.92;
  }

  return 0.98;
}

function getSmartLearnMaxFontSize(textLength, stageRatio, block) {
  const isMissingWords =
    block?.classList?.contains("smart-learn-text-remove") ||
    block?.classList?.contains("smart-learn-text-final");

  if (stageRatio > 1.35) {
    if (isMissingWords) {
      if (textLength <= 70) return 82;
      if (textLength <= 140) return 76;
      if (textLength <= 240) return 68;
      return 56;
    }

    if (textLength <= 70) return 64;
    if (textLength <= 140) return 58;
    if (textLength <= 240) return 50;
    return 42;
  }

  if (stageRatio > 1.05) {
    if (isMissingWords) {
      if (textLength <= 70) return 88;
      if (textLength <= 140) return 82;
      if (textLength <= 240) return 72;
      return 60;
    }

    if (textLength <= 70) return 74;
    if (textLength <= 140) return 66;
    if (textLength <= 240) return 56;
    return 46;
  }

  if (isMissingWords) {
    if (textLength > 220) return 76;
    if (textLength > 140) return 86;
    return 104;
  }

  if (textLength > 220) return 62;
  if (textLength > 140) return 74;
  return 96;
}

function getElementHorizontalPaddingPx(el) {
  const styles = window.getComputedStyle(el);
  const left = parseFloat(styles.paddingLeft) || 0;
  const right = parseFloat(styles.paddingRight) || 0;
  return left + right;
}

function getElementVerticalPaddingPx(el) {
  const styles = window.getComputedStyle(el);
  const top = parseFloat(styles.paddingTop) || 0;
  const bottom = parseFloat(styles.paddingBottom) || 0;
  return top + bottom;
}

function fitSmartLearnText(root = document) {
  const blocks = root.querySelectorAll("[data-smart-learn-text]");

  blocks.forEach((block) => {
    const stage = block.closest(".learn-stage");
    const body = block.querySelector(".smart-learn-body");

    if (!stage || !body) return;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;

    if (stageWidth <= 0 || stageHeight <= 0) return;

    const stageContentWidth = Math.max(120, stageWidth - getElementHorizontalPaddingPx(stage));
    const stageContentHeight = Math.max(120, stageHeight - getElementVerticalPaddingPx(stage));

    const bodyText = block.getAttribute("data-smart-fit-text") || body.textContent || "";
    const textLength = bodyText.replace(/\s+/g, " ").trim().length;
    const stageRatio = stageContentWidth / stageContentHeight;

    const lineHeight = getSmartLearnLineHeight(textLength, stageRatio);
    const widthRatio = getSmartLearnWidthRatio(textLength, stageRatio);
    const targetWidth = Math.floor(stageContentWidth * widthRatio);

    block.style.setProperty("--smart-line-height", String(lineHeight));
    block.style.width = `${targetWidth}px`;
    block.style.maxWidth = `${targetWidth}px`;

    let low = 18;
    let high = getSmartLearnMaxFontSize(textLength, stageRatio, block);
    let best = low;

    for (let i = 0; i < 10; i++) {
      const mid = (low + high) / 2;

      block.style.setProperty("--smart-font-size", `${mid}px`);

      const fits =
        block.scrollHeight <= stageContentHeight &&
        block.scrollWidth <= stageContentWidth;

      if (fits) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    block.style.setProperty("--smart-font-size", `${Math.floor(best)}px`);
  });
}

function scheduleSmartLearnTextFit(root) {
  const run = () => fitSmartLearnText(root);

  requestAnimationFrame(run);
  setTimeout(run, 120);
  setTimeout(run, 420);

  if (document.fonts?.ready) {
    document.fonts.ready.then(run).catch(() => { });
  }
}

/* =========================
   4. Verse Loading
   ========================= */
async function loadVerse(verseId) {
  let json;

  try {
    const res = await fetch(`${DATA_DIR}${verseId}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = await res.json();
  } catch (err) {
    if (DEBUG_MODE) {
      console.warn("Fetch failed — using DEBUG_VERSE_JSON instead.", err);
      json = DEBUG_VERSE_JSON;
    } else {
      throw new Error(`Could not load ${DATA_DIR}${verseId}.json (and DEBUG_MODE is off).`);
    }
  }

  cfg = json;
  VERSE_ID = json.verseId;
  TRANSLATION = json.translation || "";
  ATTRIBUTION = json.attribution || "";
  VERSE_TEXT = json.verseText || "";
  VERSE_MEANING = json.meaning || "This verse teaches us something important about God.";
  ECHO_PARTS = Array.isArray(json.echoParts) ? json.echoParts : [];
  HIDE_PLAN = Array.isArray(json.hidePlan) ? json.hidePlan : [];

  VERSE_REF = verseIdToRef(VERSE_ID, TRANSLATION);
  AUDIO_FILE = `${AUDIO_DIR}${VERSE_ID}.mp3`;

  document.title = `Verse Memory • ${VERSE_REF}`;

  tokens = tokenize(VERSE_TEXT);
  planResolved = resolveHidePlanToTokenIndices(tokens, HIDE_PLAN);
  reshuffleHidePlan();

  const verseProgress = getVerseProgress(VERSE_ID);
  State.hasLearnedVerse = !!verseProgress.learnCompleted;
}

async function loadVerseList() {
  try {
    const res = await fetch(`${DATA_DIR}verse_list.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const baseList = Array.isArray(json) ? json.slice() : [];

    const enrichedList = await Promise.all(baseList.map(async (item) => {
      if (!item?.id) return item;

      const alreadyHasPetData =
        item.biblopetDefaultName &&
        item.biblopet &&
        item.biblopetFeetFromBottom;

      if (alreadyHasPetData) {
        return item;
      }

      try {
        const verseRes = await fetch(`${DATA_DIR}${item.id}.json`, { cache: "no-store" });
        if (!verseRes.ok) throw new Error(`HTTP ${verseRes.status}`);

        const verseJson = await verseRes.json();

        return {
          ...item,
          biblopetDefaultName: verseJson.biblopetDefaultName || item.biblopetDefaultName || "",
          biblopet: verseJson.biblopet || item.biblopet || "",
          biblopetFeetFromBottom: verseJson.biblopetFeetFromBottom || item.biblopetFeetFromBottom || "0%"
        };
      } catch (err) {
        console.warn(`Could not load default BibloPet data for ${item.id}`, err);
        return {
          ...item,
          biblopetFeetFromBottom: item.biblopetFeetFromBottom || "0%"
        };
      }
    }));

    VERSE_LIST = enrichedList;

    VERSE_LIST.sort((a, b) => {
      const refA = String(a?.ref || "");
      const refB = String(b?.ref || "");
      return refA.localeCompare(refB);
    });
  } catch (err) {
    console.warn("Could not load verse_list.json", err);
    VERSE_LIST = [];
  }
}

/* =========================
   5. Screen Definitions
   ========================= */
const Screen = {
  INTRO: "intro",
  TITLE_SEQUENCE: "title_sequence",
  TITLE: "title",
  TODO: "todo",
  TODO_DEV: "todo_dev",
  PROGRESS: "progress",
  VERSE_DETAIL: "verse_detail",
  LEARN_LEVEL: "learn_level",
  PRACTICE_GATE: "practice_gate",
  LEARN_INSTRUCTION: "learn_instruction",
  LISTEN: "listen",
  MEANING: "meaning",
  CHUNKS: "chunks",
  ECHO: "echo",
  HIDE: "hide",
  FINAL_RECALL: "final_recall",
  CELEBRATION: "celebration",
  PET_UNLOCK: "pet_unlock",
  PET_STATS: "pet_stats",
  PRACTICE_HUB: "practice_hub",
  PRACTICE: "practice",
  PLAYGROUND: "playground",
  GAME_MIX_FINISHED: "game_mix_finished"
};

function isLearnFlowScreen(screen) {
  return (
    screen === Screen.LEARN_INSTRUCTION ||
    screen === Screen.LISTEN ||
    screen === Screen.MEANING ||
    screen === Screen.CHUNKS ||
    screen === Screen.ECHO ||
    screen === Screen.HIDE ||
    screen === Screen.FINAL_RECALL
  );
}

/* =========================
   1. Global State
   ========================= */
const State = {
  screen: Screen.INTRO,
  slideX: 0,                // numeric index used for transforms
  isSliding: false,
  transitionFromIdx: null,
  transitionToIdx: null,
  forceSlideForward: false,

  // Learn progression
  hasLearnedVerse: false,
  audioMode: null,
  instructionPlaying: false,
  instructionKey: "",
  learnInstructionKey: "",
  learnInstructionReady: false,
  learnInstructionAudioStarted: false,
  listenInstructionDone: false,
  meaningInstructionDone: false,
  chunksIntroDone: false,
  chunksReplayPromptDone: false,
  echoIntroPromptDone: false,
  removeIntroPromptDone: false,
  finalIntroPromptDone: false,
  selectedVerseId: null,
  pendingPetUnlockVerseId: null,
  activeTodo: null,
  petAnimationVerseId: null,
  petAnimationStatus: "",
  petAnimationClass: "",
  petAnimTimer: null,
  petAnimPhase: "idle", // "idle" | "action"
  petAnimActionClass: "",
  petAnimActionDuration: 0,

  listenDone: false,
  listenPlaying: false,
  listenAutoStarting: false,
  listenAutoFallbackReady: false,

  chunkDone: false,
  chunkRunning: false,
  chunkAutoStarting: false,
  chunkAutoFallbackReady: false,
  chunkIndex: 0,
  chunkPassCount: 0,

  echoDone: false,
  echoRunning: false,
  echoAutoStarting: false,
  echoAutoFallbackReady: false,
  echoNeedsSecondPass: false,
  echoIndex: 0,
  echoSpeaking: false,
  hideCount: 0,
  revealedTokenIdx: new Set(),
  hideAutoStarting: false,
  hideAutoFallbackReady: false,
  hidePoofActive: false,
  sayVerseActive: false,
  sayVerseStartedAt: 0,
  sayVerseDurationMs: 0,
  hideReadyForFinal: false,
  finalRecallAutoStarting: false,
  finalRecallAutoFallbackReady: false,
  finalRecallActive: false,
  finalRecallStartedAt: 0,
  finalRecallDurationMs: 0,
  finalRecallDone: false,
  finalRecallRevealed: false,
  fireworksTimer: null,
  // Title carousel
  titleOptionIndex: 0,

  // Learn level carousel
  learnLevelIndex: 0,
  learnLevel: null,
  learnStartScreen: null,

  // Practice carousel
  practiceIndex: 0,
};

const TITLE_OPTIONS = [
  { id: "learn", label: "Learn the Verse", action: () => go(Screen.LEARN_LEVEL) },
  {
    id: "practice", label: "Practice", action: () => {
      if (State.hasLearnedVerse) go(Screen.PRACTICE_HUB);
      else go(Screen.PRACTICE_GATE);
    }
  },
  { id: "progress", label: "BibloPet Zoo", action: () => go(Screen.PROGRESS) },
];

function renderTitleActionButton({ id, label, image, color, textColor }) {
  return `
    <button
      class="title-action-btn title-action-${id} no-zoom"
      type="button"
      data-title-action="${id}"
      style="--title-action-bg:${color}; --title-action-text:${textColor};"
      aria-label="${label}"
    >
      <img
        class="title-action-img"
        src="${IMG_DIR}${image}"
        alt=""
        draggable="false"
        onerror="this.style.display='none'"
      >
      <span class="title-action-label">${label}</span>
    </button>
  `;
}

const LEARN_LEVEL_OPTIONS = [
  {
    label: "Not at all",
    emoji: "👎",
    color: "#a7cb6f",
    textColor: "#ffffff",
    startScreen: Screen.LISTEN,
    level: "not_at_all"
  },
  {
    label: "A little bit",
    emoji: "👌",
    color: "#f2f2f2",
    textColor: "#333333",
    startScreen: Screen.ECHO,
    level: "a_little"
  },
  {
    label: "Pretty well",
    emoji: "👍",
    color: "#ff5a51",
    textColor: "#ffffff",
    startScreen: Screen.ECHO,
    level: "pretty_well"
  }
];

const BUILTIN_PRACTICE_GAMES = [];

const HIDDEN_PRACTICE_GAME_ID = "wheel_of_bible";
const HIDDEN_PRACTICE_LONG_PRESS_MS = 2000;
const HIDDEN_LEARN_COMPLETE_LONG_PRESS_MS = 2000;

function getExternalPracticeGames() {
  const list = Array.isArray(window.EXTERNAL_VERSE_GAMES) ? window.EXTERNAL_VERSE_GAMES : [];

  return list
    .filter(entry => entry && entry.enabled !== false)
    .map(entry => entry.manifest)
    .filter(manifest => manifest && manifest.visibleInCarousel !== false)
    .map(manifest => ({
      id: manifest.id,
      title: manifest.title || "Practice Game",
      icon: manifest.icon || "🎮",
      desc: manifest.description || "",
      cardColor: manifest.cardColor || "#7f66c6",
      cardTextColor: manifest.cardTextColor || "#ffffff",
      source: "external",
      manifest
    }));
}

function getPracticeGames() {
  return [...BUILTIN_PRACTICE_GAMES, ...getExternalPracticeGames()];
}

function getExternalPlaygroundActivities() {
  const list = Array.isArray(window.EXTERNAL_VERSE_PLAYGROUND) ? window.EXTERNAL_VERSE_PLAYGROUND : [];

  return list
    .filter(entry => entry && entry.enabled !== false)
    .map(entry => entry.manifest)
    .filter(manifest => manifest && manifest.visibleInCarousel !== false)
    .map(manifest => ({
      id: manifest.id,
      title: manifest.title || "Playground Activity",
      icon: manifest.icon || "🎵",
      desc: manifest.description || "",
      cardColor: manifest.cardColor || "#2b1748",
      cardTextColor: manifest.cardTextColor || "#ffffff",
      source: "external",
      manifest
    }));
}

function getPlaygroundActivities() {
  return getExternalPlaygroundActivities();
}

/* =========================
   Game Mix Session
   ========================= */

const GAME_MIX_STORAGE_KEY = "verseMemoryGameMix";
const GAME_MIX_VERSION = 1;
const GAME_MIX_MODES = ["easy", "medium", "hard"];
const GAME_MIX_LOADING_MIN_MS = 600;

let gameMixLaunchTimer = null;

function createGameMixState(verseId) {
  return {
    version: GAME_MIX_VERSION,
    active: true,
    verseId: verseId || "",
    playedGameIds: [],
    currentGameId: "",
    currentMode: "",
    startedAt: Date.now()
  };
}

function getGameMixState() {
  try {
    const raw = sessionStorage.getItem(GAME_MIX_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== GAME_MIX_VERSION) return null;
    if (!parsed.active) return null;

    if (!Array.isArray(parsed.playedGameIds)) {
      parsed.playedGameIds = [];
    }

    return parsed;
  } catch (err) {
    console.warn("Could not load Game Mix state", err);
    return null;
  }
}

function saveGameMixState(state) {
  try {
    sessionStorage.setItem(GAME_MIX_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save Game Mix state", err);
  }
}

function clearGameMixState() {
  try {
    sessionStorage.removeItem(GAME_MIX_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear Game Mix state", err);
  }
}

function getEligibleGameMixGames() {
  return getPracticeGames().filter(game =>
    game &&
    game.source === "external" &&
    game.manifest &&
    game.id
  );
}

function pickRandomFromList(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function showGameMixLoadingScreen() {
  if (gameMixLaunchTimer) {
    clearTimeout(gameMixLaunchTimer);
    gameMixLaunchTimer = null;
  }

  try {
    navBar.style.display = "none";
  } catch (e) { }

  app.innerHTML = `
    <div class="game-mix-loading-screen">
      <div class="game-mix-loading-card" role="status" aria-live="polite">
        <div class="game-mix-loading-icon-wrap" aria-hidden="true">
          <div class="game-mix-loading-rainbow"></div>
          <img
            class="game-mix-loading-image"
            src="${IMG_DIR}verse_mix.png"
            alt=""
          >
        </div>

        <div class="game-mix-loading-text">
          Loading Mix
        </div>
      </div>
    </div>
  `;
}

function getGameMixModeForGame(gameId) {
  const verseProgress = getVerseProgress(VERSE_ID);
  const gameProgress = verseProgress?.games?.[gameId];

  if (!gameProgress?.easyCompleted) return "easy";
  if (!gameProgress?.mediumCompleted) return "medium";
  if (!gameProgress?.hardCompleted) return "hard";

  return pickRandomFromList(GAME_MIX_MODES) || "easy";
}

function pickNextGameMixGame() {
  const state = getGameMixState();
  if (!state || state.verseId !== VERSE_ID) return null;

  const played = new Set(state.playedGameIds || []);
  const eligible = getEligibleGameMixGames();
  const unplayed = eligible.filter(game => !played.has(game.id));

  return pickRandomFromList(unplayed);
}

function launchGameMixGame(game) {
  if (!game?.manifest) return false;

  let state = getGameMixState();

  if (!state || state.verseId !== VERSE_ID) {
    state = createGameMixState(VERSE_ID);
  }

  const mode = getGameMixModeForGame(game.id);

  state.currentGameId = game.id;
  state.currentMode = mode;

  saveGameMixState(state);

  showGameMixLoadingScreen();

  gameMixLaunchTimer = setTimeout(() => {
    gameMixLaunchTimer = null;

    launchExternalGame(game.manifest, {
      mix: true,
      mode
    });
  }, GAME_MIX_LOADING_MIN_MS);

  return true;
}

function startGameMix() {
  const eligible = getEligibleGameMixGames();

  if (!eligible.length) {
    showDialog({
      title: "No games yet",
      body: "No practice games are available for Game Mix right now.",
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
    return;
  }

  const state = createGameMixState(VERSE_ID);
  saveGameMixState(state);

  const firstGame = pickRandomFromList(eligible);
  launchGameMixGame(firstGame);
}

function recordGameMixCompletedGame(gameId) {
  const state = getGameMixState();
  if (!state || state.verseId !== VERSE_ID) return null;

  const safeGameId = String(gameId || state.currentGameId || "").trim();

  if (safeGameId && !state.playedGameIds.includes(safeGameId)) {
    state.playedGameIds.push(safeGameId);
  }

  state.currentGameId = "";
  state.currentMode = "";

  saveGameMixState(state);
  return state;
}

function cleanGameMixUrlParams() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("mixNext");
    url.searchParams.delete("completedGameId");
    url.searchParams.delete("mixPetUnlock");
    window.history.replaceState({}, "", url.href);
  } catch (err) {
    console.warn("Could not clean Game Mix URL params", err);
  }
}

function continueGameMixAfterCompletion(completedGameId) {
  const state = recordGameMixCompletedGame(completedGameId);

  if (!state) {
    clearGameMixState();
    cleanGameMixUrlParams();
    setScreen(Screen.TITLE);
    return true;
  }

  const nextGame = pickNextGameMixGame();

  if (nextGame) {
    launchGameMixGame(nextGame);
    return true;
  }

  cleanGameMixUrlParams();
  setScreen(Screen.GAME_MIX_FINISHED);
  return true;
}

function handleGameMixNextFromUrl(params) {
  if (!params || params.get("mixNext") !== "1") return false;

  const completedGameId = params.get("completedGameId") || "";
  return continueGameMixAfterCompletion(completedGameId);
}

function isGameMixPetUnlockRequest() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mixPetUnlock") === "1";
}

function getGameMixCompletedGameIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("completedGameId") || "";
}

function getExternalGameManifestById(gameId) {
  const sources = [
    window.EXTERNAL_VERSE_GAMES,
    window.EXTERNAL_VERSE_PLAYGROUND
  ];

  for (const source of sources) {
    const list = Array.isArray(source) ? source : [];

    for (const entry of list) {
      if (!entry || entry.enabled === false) continue;

      const manifest = entry.manifest;
      if (manifest && manifest.id === gameId) return manifest;
    }
  }

  return null;
}

function launchHiddenPracticeGame(gameId = HIDDEN_PRACTICE_GAME_ID) {
  const manifest = getExternalGameManifestById(gameId);
  if (!manifest) {
    console.warn(`Hidden practice game not found: ${gameId}`);
    return;
  }

  launchExternalGame(manifest);
}

function bindLongPress(element, {
  delay = 2000,
  onLongPress = () => { },
  shouldStart = () => true
} = {}) {
  if (!element) return;

  let timer = null;
  let fired = false;
  let startX = 0;
  let startY = 0;

  const clearPress = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const startPress = (event) => {
    if (!shouldStart()) return;

    const point = event.touches?.[0] || event;
    startX = point?.clientX ?? 0;
    startY = point?.clientY ?? 0;

    fired = false;
    clearPress();

    timer = setTimeout(() => {
      timer = null;
      fired = true;
      onLongPress(event);
    }, delay);
  };

  const movePress = (event) => {
    if (!timer) return;
    const point = event.touches?.[0] || event;
    const x = point?.clientX ?? startX;
    const y = point?.clientY ?? startY;
    const dx = x - startX;
    const dy = y - startY;
    if (Math.hypot(dx, dy) > 12) {
      clearPress();
    }
  };

  const endPress = () => {
    clearPress();
  };

  element.style.webkitTouchCallout = "none";
  element.style.webkitUserSelect = "none";
  element.style.userSelect = "none";
  element.style.touchAction = "manipulation";

  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  element.addEventListener("pointerdown", startPress, { passive: true });
  element.addEventListener("pointermove", movePress, { passive: true });
  element.addEventListener("pointerup", endPress, { passive: true });
  element.addEventListener("pointercancel", endPress, { passive: true });
  element.addEventListener("pointerleave", endPress, { passive: true });

  element.addEventListener("touchstart", startPress, { passive: true });
  element.addEventListener("touchmove", movePress, { passive: true });
  element.addEventListener("touchend", endPress, { passive: true });
  element.addEventListener("touchcancel", endPress, { passive: true });

  element.addEventListener("mousedown", startPress, { passive: true });
  element.addEventListener("mousemove", movePress, { passive: true });
  element.addEventListener("mouseup", endPress, { passive: true });
  element.addEventListener("mouseleave", endPress, { passive: true });

  element.addEventListener("click", (event) => {
    if (fired) {
      event.preventDefault();
      event.stopPropagation();
      fired = false;
    }
  }, true);
}

function getPracticeGameIcon(game) {
  if (!game) return "🎮";

  const title = String(game.title || "").trim();

  const firstSymbolMatch = title.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u27BF])/u);
  if (firstSymbolMatch) return firstSymbolMatch[0];

  return "🎮";
}

function getPracticeIconWindow(total, current, maxVisible = 5) {
  if (total <= 0) return [];

  const visible = Math.min(maxVisible, total);
  const half = Math.floor(visible / 2);

  let start = current - half;
  let end = start + visible;

  if (start < 0) {
    start = 0;
    end = visible;
  }

  if (end > total) {
    end = total;
    start = total - visible;
  }

  const out = [];
  for (let i = start; i < end; i++) {
    out.push(i);
  }
  return out;
}

function renderPracticeIconStrip(practiceGames, currentIndex) {
  const windowIndices = getPracticeIconWindow(practiceGames.length, currentIndex, 5);

  return windowIndices.map((gameIndex) => {
    const game = practiceGames[gameIndex];
    const icon = getPracticeGameIcon(game);
    const distance = Math.abs(gameIndex - currentIndex);

    let cls = "practice-icon";
    if (gameIndex === currentIndex) cls += " active";
    else if (distance === 1) cls += " near";
    else cls += " far";

    return `<span class="${cls}" aria-hidden="true">${icon}</span>`;
  }).join("");
}

function renderPracticeGameMedals(gameProgress) {
  const medals = [
    { mode: "easy", label: "Easy", icon: "🥉", earned: !!gameProgress?.easyCompleted },
    { mode: "medium", label: "Medium", icon: "🥈", earned: !!gameProgress?.mediumCompleted },
    { mode: "hard", label: "Hard", icon: "🥇", earned: !!gameProgress?.hardCompleted }
  ];

  return medals.map(medal => `
    <span
      class="practice-card-medal ${medal.earned ? "earned" : "unearned"}"
      aria-label="${medal.label} medal ${medal.earned ? "earned" : "not earned"}"
      title="${medal.label} medal ${medal.earned ? "earned" : "not earned"}"
    >
      ${medal.icon}
    </span>
  `).join("");
}

function getRandomPracticeGame(practiceGames) {
  const availableGames = Array.isArray(practiceGames)
    ? practiceGames.filter(game => game && game.source === "external" && game.manifest)
    : [];

  if (!availableGames.length) return null;

  const randomIndex = Math.floor(Math.random() * availableGames.length);
  return availableGames[randomIndex];
}

function renderGameMixCard() {
  return `
    <button
      class="practice-game-card practice-game-mix-card no-zoom"
      type="button"
      data-practice-game-mix
      aria-label="Play Game Mix"
    >
      <div class="practice-game-card-top">
        <div class="practice-game-emoji-wrap" aria-hidden="true">
          <div class="practice-game-emoji-shadow"></div>
          <div class="practice-game-emoji">🔀</div>
        </div>

        <div class="practice-game-title">
          Game Mix
        </div>
      </div>

      <div class="practice-game-card-bottom practice-game-mix-bottom">
        Surprise me!
      </div>
    </button>
  `;
}

function renderPracticeHubCard({ id, title, icon, cardColor, cardTextColor }) {
  return `
    <button
      class="practice-game-card practice-simple-card no-zoom"
      type="button"
      data-practice-hub-choice="${id}"
      style="--practice-card-color: ${cardColor}; --practice-card-text: ${cardTextColor};"
      aria-label="${title}"
    >
      <div class="practice-game-card-top">
        <div class="practice-game-emoji-wrap" aria-hidden="true">
          <div class="practice-game-emoji">${icon}</div>
        </div>

        <div class="practice-game-title">
          ${title}
        </div>
      </div>
    </button>
  `;
}

function renderPlaygroundActivityCard(activity) {
  return `
    <button
      class="practice-game-card practice-simple-card no-zoom"
      type="button"
      data-playground-activity-id="${activity.id}"
      style="--practice-card-color: ${activity.cardColor}; --practice-card-text: ${activity.cardTextColor};"
      aria-label="Play ${activity.title}"
    >
      <div class="practice-game-card-top">
        <div class="practice-game-emoji-wrap" aria-hidden="true">
          <div class="practice-game-emoji">${activity.icon}</div>
        </div>

        <div class="practice-game-title">
          ${activity.title}
        </div>
      </div>
    </button>
  `;
}


function renderPracticeGameCard(game, verseProgress) {
  const gameProgress = verseProgress?.games?.[game.id];

  return `
    <button
      class="practice-game-card no-zoom"
      type="button"
      data-practice-game-id="${game.id}"
      style="--practice-card-color: ${game.cardColor}; --practice-card-text: ${game.cardTextColor};"
      aria-label="Play ${game.title}"
    >
      <div class="practice-game-card-top">
        <div class="practice-game-emoji-wrap" aria-hidden="true">
          
          <div class="practice-game-emoji">${game.icon}</div>
        </div>

        <div class="practice-game-title">
          ${game.title}
        </div>
      </div>

      <div class="practice-game-card-bottom" aria-label="Progress for ${game.title}">
        ${renderPracticeGameMedals(gameProgress)}
      </div>
    </button>
  `;
}


function resetLearn(goTitle = false) {
  const keepLearnLevel = State.learnLevel;
  const keepLearnStartScreen = State.learnStartScreen;

  State.audioMode = null;
  State.instructionPlaying = false;
  State.instructionKey = "";
  State.learnInstructionKey = "";
  State.learnInstructionReady = false;
  State.learnInstructionAudioStarted = false;
  State.listenInstructionDone = false;
  State.meaningInstructionDone = false;
  State.chunksIntroDone = false;
  State.chunksReplayPromptDone = false;
  State.echoIntroPromptDone = false;
  State.removeIntroPromptDone = false;
  State.finalIntroPromptDone = false;

  State.listenDone = false;
  State.listenPlaying = false;
  State.listenAutoStarting = false;
  State.listenAutoFallbackReady = false;

  State.learnLevel = keepLearnLevel;
  State.learnStartScreen = keepLearnStartScreen;

  State.chunkDone = false;
  State.chunkRunning = false;
  State.chunkAutoStarting = false;
  State.chunkAutoFallbackReady = false;
  State.chunkIndex = 0;
  State.chunkPassCount = 0;

  State.echoDone = false;
  State.echoRunning = false;
  State.echoAutoStarting = false;
  State.echoAutoFallbackReady = false;
  State.echoNeedsSecondPass = false;
  State.echoIndex = 0;
  State.echoSpeaking = false;

  State.hideCount = 0;
  State.revealedTokenIdx = new Set();
  State.hideAutoStarting = false;
  State.hideAutoFallbackReady = false;
  State.hidePoofActive = false;
  State.sayVerseActive = false;
  State.sayVerseStartedAt = 0;
  State.sayVerseDurationMs = 0;
  State.hideReadyForFinal = false;

  reshuffleHidePlan();

  State.finalRecallAutoStarting = false;
  State.finalRecallAutoFallbackReady = false;
  State.finalRecallActive = false;
  State.finalRecallStartedAt = 0;
  State.finalRecallDurationMs = 0;
  State.finalRecallDone = false;
  State.finalRecallRevealed = false;

  stopFireworks();

  cancelLearnAudio();
  if (goTitle) go(Screen.TITLE);
  render();
}

function startListenInstructionIfNeeded() {
  if (State.screen !== Screen.LISTEN) return;
  if (State.learnLevel !== "not_at_all") return;
  if (State.listenInstructionDone) return;
  if (State.listenDone || State.listenPlaying || State.instructionPlaying) return;

  playInstruction("listen", {
    doneFlag: "listenInstructionDone"
  });
}

/* Slide navigation */
function screenToIndex(screen) {
  // order matters for sliding
  const order = [
    Screen.INTRO,
    Screen.TITLE_SEQUENCE,
    Screen.TITLE,
    Screen.TODO,
    Screen.TODO_DEV,
    Screen.PROGRESS,
    Screen.PET_STATS,
    Screen.VERSE_DETAIL,
    Screen.LEARN_LEVEL,
    Screen.PRACTICE_GATE,
    Screen.LEARN_INSTRUCTION,
    Screen.LISTEN,
    Screen.MEANING,
    Screen.CHUNKS,
    Screen.ECHO,
    Screen.HIDE,
    Screen.FINAL_RECALL,
    Screen.CELEBRATION,
    Screen.PET_UNLOCK,
    Screen.PRACTICE_HUB,
    Screen.PRACTICE,
    Screen.PLAYGROUND,
    Screen.GAME_MIX_FINISHED
  ];
  return order.indexOf(screen);
}

function go(nextScreen) {
  const from = State.screen;

  if (from === nextScreen) {
    State.forceSlideForward = false;
    return;
  }

  const fromIdx = screenToIndex(from);
  const toIdx = screenToIndex(nextScreen);

  if (State.isSliding) {
    State.forceSlideForward = false;
    return;
  }

  State.isSliding = true;

  // stop any learn audio/echo sequence when leaving a screen
  cancelLearnAudio();

  if (from === Screen.HIDE && nextScreen !== Screen.HIDE) {
    State.sayVerseActive = false;
    State.sayVerseStartedAt = 0;
    State.sayVerseDurationMs = 0;
  }

  if (from === Screen.FINAL_RECALL && nextScreen !== Screen.FINAL_RECALL) {
    State.finalRecallActive = false;
    State.finalRecallStartedAt = 0;
    State.finalRecallDurationMs = 0;
    State.finalRecallDone = false;
    State.finalRecallRevealed = false;
  }

  // Auto-shuffle when entering the missing-words section (no user button)
  if (nextScreen === Screen.HIDE && from !== Screen.HIDE) {
    reshuffleHidePlan();
    State.hideCount = 0;
    State.revealedTokenIdx = new Set();
    State.hideReadyForFinal = false;
  }

  // Track the exact screens involved in this transition
  State.transitionFromIdx = fromIdx;
  State.transitionToIdx = toIdx;

  // Keep the old screen centered first
  State.slideX = fromIdx;

  // Update to the new logical screen, but don't jump visually yet
  State.screen = nextScreen;
  render();

  if (nextScreen === Screen.VERSE_DETAIL) {
    setTimeout(() => {
      if (State.screen !== Screen.VERSE_DETAIL) return;

      const verseId = State.selectedVerseId;
      const verseProgress = getVerseProgress(verseId);

      startPetAnimationCycle(verseId, verseProgress);
    }, 0);
  } else {
    clearPetAnimationCycle();
  }


  // On the next frame, slide to the new screen
  requestAnimationFrame(() => {
    State.slideX = toIdx;
    updateSlideTransforms();

    setTimeout(() => {
      State.isSliding = false;
      State.transitionFromIdx = null;
      State.transitionToIdx = null;
      State.forceSlideForward = false;
      render();
    }, 340);
  });
}


/* If you jump directly (no transition), call this */
function setScreen(screen) {
  State.screen = screen;
  State.slideX = screenToIndex(screen);
  render();
}

function updateSlideTransforms() {
  const slides = document.querySelectorAll(".slide");

  const forceForward =
    State.isSliding &&
    State.forceSlideForward &&
    State.transitionFromIdx !== null &&
    State.transitionToIdx !== null;

  slides.forEach(slide => {
    const idx = Number(slide.dataset.idx || 0);
    let dx;

    if (forceForward) {
      if (idx === State.transitionFromIdx) {
        dx = (State.slideX === State.transitionFromIdx) ? 0 : -100;
      } else if (idx === State.transitionToIdx) {
        dx = (State.slideX === State.transitionFromIdx) ? 100 : 0;
      } else {
        dx = (idx - State.slideX) * 100;
      }
    } else {
      dx = (idx - State.slideX) * 100;
    }

    slide.style.transform = `translateX(${dx}%)`;
  });
}

/* Title carousel controls */
function titlePrev() {
  State.titleOptionIndex = (State.titleOptionIndex - 1 + TITLE_OPTIONS.length) % TITLE_OPTIONS.length;
  render();
}
function titleNext() {
  State.titleOptionIndex = (State.titleOptionIndex + 1) % TITLE_OPTIONS.length;
  render();
}

function titleRun() {
  if (!HAS_VERSE_SELECTION) {
    showDialog({
      title: "Pick a verse first 🙂",
      body: "Choose a verse from the dropdown before you start.",
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
    return;
  }

  TITLE_OPTIONS[State.titleOptionIndex].action();
}

/* Learn level carousel controls */
function learnLevelPrev() {
  State.learnLevelIndex = (State.learnLevelIndex - 1 + LEARN_LEVEL_OPTIONS.length) % LEARN_LEVEL_OPTIONS.length;
  render();
}

function learnLevelNext() {
  State.learnLevelIndex = (State.learnLevelIndex + 1) % LEARN_LEVEL_OPTIONS.length;
  render();
}

function learnLevelRun() {
  const opt = LEARN_LEVEL_OPTIONS[State.learnLevelIndex];

  State.learnLevel = opt.level;
  State.learnStartScreen = opt.startScreen;

  resetLearn(false);

  if (State.learnStartScreen === Screen.ECHO) {
    startLearnInstruction("echo1");
    return;
  }

  startLearnInstruction("listen");
}

/* Practice carousel controls */
function practicePrev() {
  const games = getPracticeGames();
  if (!games.length) return;

  State.practiceIndex = (State.practiceIndex - 1 + games.length) % games.length;
  render();
}

function practiceNext() {
  const games = getPracticeGames();
  if (!games.length) return;

  State.practiceIndex = (State.practiceIndex + 1) % games.length;
  render();
}

function getReturnToScreenUrl(screenName = "practice") {
  const url = new URL("index.html", window.location.href);

  if (VERSE_ID) {
    url.searchParams.set("v", VERSE_ID);
  }

  url.searchParams.set("screen", screenName);
  return url.href;
}

function getReturnToPracticeUrl() {
  return getReturnToScreenUrl("practice");
}

function getReturnToPlaygroundUrl() {
  return getReturnToScreenUrl("playground");
}

function launchExternalGame(manifest, options = {}) {
  if (!manifest || !manifest.launchUrl || !VERSE_ID) return;

  const params = new URLSearchParams({
    verseId: VERSE_ID,
    ref: VERSE_REF || "",
    translation: TRANSLATION || "",
    returnTo: getReturnToPracticeUrl(),
    source: "verse_memory_app"
  });

  if (options.mix) {
    params.set("mix", "1");
  }

  if (options.mode) {
    params.set("mode", options.mode);
  }

  window.location.href = `${manifest.launchUrl}?${params.toString()}`;
}

function launchExternalPlaygroundActivity(manifest) {
  if (!manifest || !manifest.launchUrl || !VERSE_ID) return;

  const params = new URLSearchParams({
    verseId: VERSE_ID,
    ref: VERSE_REF || "",
    translation: TRANSLATION || "",
    returnTo: getReturnToPlaygroundUrl(),
    source: "verse_memory_app"
  });

  window.location.href = `${manifest.launchUrl}?${params.toString()}`;
}

function practiceRun() {
  const games = getPracticeGames();
  const g = games[State.practiceIndex];
  if (!g) return;

  if (g.source === "external") {
    launchExternalGame(g.manifest);
    return;
  }

  console.warn("Practice game is not external and cannot be launched:", g);
}

/* Build verse display with hidden items */
function underscoresForWord(word) {
  if (!word) return "";
  const first = word[0];
  const restLen = Math.max(0, word.length - 1);
  return first + "_".repeat(restLen);
}

function isTokenHidden(tokenIdx) {
  if (State.revealedTokenIdx.has(tokenIdx)) return false;
  // hidden if it's in first hideCount items of the mixed plan
  for (let i = 0; i < Math.min(State.hideCount, planMixed.length); i++) {
    if (planMixed[i].tokenIndex === tokenIdx) return true;
  }
  return false;
}

function hideInfoForToken(tokenIdx) {
  for (let i = 0; i < Math.min(State.hideCount, planMixed.length); i++) {
    const item = planMixed[i];
    if (item.tokenIndex === tokenIdx) return item;
  }
  return null;
}



function verseNode() {
  const p = document.createElement("p");
  p.className = "verse";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === TokenType.SPACE) {
      p.appendChild(document.createTextNode(t.text));
      continue;
    }
    if (!isTokenHidden(i)) {
      if (State.revealedTokenIdx.has(i)) {
        const span = document.createElement("span");
        span.className = "revealed-word";
        span.textContent = t.text;
        p.appendChild(span);
      } else {
        p.appendChild(document.createTextNode(t.text));
      }
      continue;
    }
    const info = hideInfoForToken(i);
    const span = document.createElement("span");
    span.className = "hintable no-zoom " + (info?.type === "emoji" ? "emoji" : "underscore");
    span.textContent = info?.type === "emoji"
      ? (info.emoji || "❓")
      : underscoresForWord(t.text);

    span.onclick = () => {

      // mark revealed in state
      State.revealedTokenIdx.add(i);

      // create yellow revealed word element
      const revealed = document.createElement("span");
      revealed.className = "revealed-word";
      revealed.textContent = t.text;

      // replace the blank directly without re-rendering the screen
      span.replaceWith(revealed);

      scheduleSmartLearnTextFit(document);

    };


    p.appendChild(span);
  }
  return p;
}

function finalRecallNode(showVerse = false) {
  const p = document.createElement("p");
  p.className = "verse";

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === TokenType.SPACE) {
      p.appendChild(document.createTextNode(t.text));
      continue;
    }

    if (showVerse) {
      p.appendChild(document.createTextNode(t.text));
      continue;
    }

    if (t.type === TokenType.WORD) {
      const span = document.createElement("span");
      span.className = "hintable no-zoom underscore";
      span.textContent = underscoresForWord(t.text);
      p.appendChild(span);
      continue;
    }

    p.appendChild(document.createTextNode(t.text));
  }

  return p;
}

function instructionAudioFile(key) {
  return `${AUDIO_DIR}instructions_${key}.mp3`;
}

function waitForAudioEnd() {
  return new Promise((resolve) => {
    const onEnd = () => {
      audioEl.removeEventListener("ended", onEnd);
      resolve();
    };
    audioEl.addEventListener("ended", onEnd);
  });
}

function waitForPausableDelay(ms) {
  return new Promise((resolve) => {
    let remaining = ms;
    let last = performance.now();

    function tick() {
      const now = performance.now();

      if (!learnMenuOpen) {
        remaining -= (now - last);
      }

      last = now;

      if (remaining <= 0) {
        resolve();
        return;
      }

      setTimeout(tick, 50);
    }

    tick();
  });
}

async function playInstruction(key, { doneFlag = null, delayMs = 0, after = null } = {}) {
  const my = ++echoCancelToken;

  State.instructionPlaying = true;
  State.instructionKey = key;
  State.audioMode = "instruction";
  render();

  try {
    if (delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
      if (my !== echoCancelToken) return;
    }

    const file = instructionAudioFile(key);
    setAudioSrc(file);
    audioEl.currentTime = 0;

    try {
      await safePlay();
    } catch (e) {
      showDialog({
        title: "Instruction audio missing",
        body: `Couldn't play: ${file}`,
        actions: [dlgBtn("OK", { onClick: closeDialog })]
      });
      return;
    }

    await waitForAudioEnd();
    if (my !== echoCancelToken) return;

    if (doneFlag) {
      State[doneFlag] = true;
    }

    State.instructionPlaying = false;
    State.instructionKey = "";
    State.audioMode = null;
    setAudioSrc(AUDIO_FILE);
    render();

    if (typeof after === "function") {
      after();
    }
  } finally {
    if (my === echoCancelToken) {
      State.instructionPlaying = false;
      State.instructionKey = "";
      if (State.audioMode === "instruction") {
        State.audioMode = null;
      }
      setAudioSrc(AUDIO_FILE);
      render();
    }
  }
}

function listenPlay() {
  State.listenAutoStarting = false;
  State.listenAutoFallbackReady = false;
  State.listenPlaying = true;
  State.listenDone = false;
  State.audioMode = "listen_ref";

  setAudioSrc(refAudioFile());
  audioEl.currentTime = 0;

  safePlay()
    .then(() => {
      render();
    })
    .catch(() => {
      State.listenPlaying = false;
      State.listenAutoStarting = false;
      State.listenAutoFallbackReady = true;
      State.audioMode = null;
      render();

      showDialog({
        title: "Reference audio missing",
        body: `Couldn't play: ${refAudioFile()}`,
        actions: [dlgBtn("OK", { onClick: closeDialog })]
      });
    });
}

audioEl.addEventListener("ended", () => {
  if (State.screen === Screen.LISTEN && State.audioMode === "listen_ref") {
    State.audioMode = "listen_verse";

    setAudioSrc(AUDIO_FILE);
    audioEl.currentTime = 0;

    safePlay()
      .then(() => {
        render();
      })
      .catch(() => {
        State.listenPlaying = false;
        State.audioMode = null;
        render();

        showDialog({
          title: "Verse audio missing",
          body: `Couldn't play: ${AUDIO_FILE}`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
      });

    return;
  }

  if (State.screen === Screen.LISTEN && State.audioMode === "listen_verse") {
    State.listenPlaying = false;
    State.audioMode = null;
    State.listenDone = true;

    startLearnInstruction("meaning");
  }
});

function echoPartFileByIndex(i) {
  // a, b, c...
  const suffix = String.fromCharCode("a".charCodeAt(0) + i);
  return `${AUDIO_DIR}${VERSE_ID}${suffix}.mp3`;
}

function refAudioFile() {
  return `${AUDIO_DIR}${VERSE_ID}_ref.mp3`;
}

function getLearnAudioParts() {
  const parts = [
    { text: VERSE_REF, file: refAudioFile() }
  ];

  if (ECHO_PARTS.length) {
    for (let i = 0; i < ECHO_PARTS.length; i++) {
      parts.push({
        text: ECHO_PARTS[i],
        file: echoPartFileByIndex(i)
      });
    }
  } else {
    parts.push({
      text: VERSE_TEXT,
      file: AUDIO_FILE
    });
  }

  return parts;
}

function waitForDuration(timeoutMs = 2000) {
  return new Promise((resolve) => {
    // If duration is already known, resolve immediately
    if (isFinite(audioEl.duration) && audioEl.duration > 0) return resolve(audioEl.duration);

    const t0 = Date.now();

    const done = () => {
      audioEl.removeEventListener("loadedmetadata", done);
      audioEl.removeEventListener("durationchange", done);
      const d = (isFinite(audioEl.duration) && audioEl.duration > 0) ? audioEl.duration : NaN;
      resolve(d);
    };

    audioEl.addEventListener("loadedmetadata", done);
    audioEl.addEventListener("durationchange", done);

    // Fallback: don’t hang forever
    const timer = setInterval(() => {
      if (isFinite(audioEl.duration) && audioEl.duration > 0) {
        clearInterval(timer);
        done();
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(timer);
        done();
      }
    }, 50);
  });
}

function getSayVersePct() {
  if (!State.sayVerseActive || !State.sayVerseDurationMs) return 1;

  const elapsed = performance.now() - State.sayVerseStartedAt;
  return Math.max(0, 1 - elapsed / State.sayVerseDurationMs);
}

function getFinalRecallPct() {
  if (!State.finalRecallActive || !State.finalRecallDurationMs) return 1;

  const elapsed = performance.now() - State.finalRecallStartedAt;
  return Math.max(0, 1 - elapsed / State.finalRecallDurationMs);
}

function runAfterSlide(fn, { timeoutMs = 2200, intervalMs = 50 } = {}) {
  const startedAt = Date.now();

  function check() {
    if (!State.isSliding) {
      fn();
      return;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      State.isSliding = false;
      State.transitionFromIdx = null;
      State.transitionToIdx = null;
      State.forceSlideForward = false;
      State.slideX = screenToIndex(State.screen);

      updateSlideTransforms();

      fn();
      return;
    }

    setTimeout(check, intervalMs);
  }

  setTimeout(check, intervalMs);
}

function goToListenAndStart() {
  State.listenDone = false;
  State.listenAutoStarting = true;
  State.listenAutoFallbackReady = false;

  go(Screen.LISTEN);

  runAfterSlide(() => {
    if (
      State.screen === Screen.LISTEN &&
      State.listenAutoStarting &&
      !State.listenPlaying &&
      !State.listenDone
    ) {
      listenPlay();
    }
  });

  setTimeout(() => {
    if (
      State.screen === Screen.LISTEN &&
      State.listenAutoStarting &&
      !State.listenPlaying &&
      !State.listenDone
    ) {
      State.listenAutoFallbackReady = true;
      render();
    }
  }, 1600);
}


function goToChunksAndStart() {
  State.chunkAutoStarting = true;
  State.chunkAutoFallbackReady = false;

  go(Screen.CHUNKS);

  runAfterSlide(() => {
    if (
      State.screen === Screen.CHUNKS &&
      State.chunkAutoStarting &&
      !State.chunkRunning &&
      State.chunkPassCount < 2
    ) {
      startChunkFlow();
    } else {
      State.chunkAutoStarting = false;
      State.chunkAutoFallbackReady = false;
      render();
    }
  });

  setTimeout(() => {
    if (
      State.screen === Screen.CHUNKS &&
      State.chunkAutoStarting &&
      !State.chunkRunning &&
      State.chunkPassCount < 2
    ) {
      State.chunkAutoFallbackReady = true;
      render();
    }
  }, 1600);
}


function goToEchoAndStart() {
  State.echoAutoStarting = true;
  State.echoAutoFallbackReady = false;

  go(Screen.ECHO);

  runAfterSlide(() => {
    if (State.screen !== Screen.ECHO) {
      State.echoAutoStarting = false;
      State.echoAutoFallbackReady = false;
      render();
      return;
    }

    if (
      State.echoAutoStarting &&
      !State.echoRunning &&
      !State.echoDone
    ) {
      startEchoFlow();
    }
  });

  setTimeout(() => {
    if (
      State.screen === Screen.ECHO &&
      State.echoAutoStarting &&
      !State.echoRunning &&
      !State.echoDone
    ) {
      State.echoAutoFallbackReady = true;
      render();
    }
  }, 1600);
}



function goToHideAndStartRound() {
  State.hideAutoStarting = true;
  State.hideAutoFallbackReady = false;

  go(Screen.HIDE);

  runAfterSlide(() => {
    if (
      State.screen === Screen.HIDE &&
      State.hideAutoStarting &&
      !State.sayVerseActive &&
      State.hideCount === 0
    ) {
      startHideRound();
    } else if (State.screen !== Screen.HIDE) {
      State.hideAutoStarting = false;
      State.hideAutoFallbackReady = false;
      render();
    }
  });

  setTimeout(() => {
    if (
      State.screen === Screen.HIDE &&
      State.hideAutoStarting &&
      !State.sayVerseActive &&
      State.hideCount === 0
    ) {
      State.hideAutoFallbackReady = true;
      render();
    }
  }, 1600);
}

function hideWordsPerRound() {
  return State.learnLevel === "pretty_well" ? 2 : 1;
}

function hideTimerMultiplier() {
  return 1.0;
}

function goToFinalRecallAndStart() {
  State.finalRecallAutoStarting = true;
  State.finalRecallAutoFallbackReady = false;

  go(Screen.FINAL_RECALL);

  runAfterSlide(() => {
    if (
      State.screen === Screen.FINAL_RECALL &&
      State.finalRecallAutoStarting &&
      !State.finalRecallActive &&
      !State.finalRecallDone &&
      !State.finalRecallRevealed
    ) {
      startFinalRecallFlow();
    } else if (State.screen !== Screen.FINAL_RECALL) {
      State.finalRecallAutoStarting = false;
      State.finalRecallAutoFallbackReady = false;
      render();
    }
  });

  setTimeout(() => {
    if (
      State.screen === Screen.FINAL_RECALL &&
      State.finalRecallAutoStarting &&
      !State.finalRecallActive &&
      !State.finalRecallDone &&
      !State.finalRecallRevealed
    ) {
      State.finalRecallAutoFallbackReady = true;
      render();
    }
  }, 1600);
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startHideRoundWithPoof() {
  if (State.sayVerseActive) return;
  if (State.hideReadyForFinal) return;

  State.hidePoofActive = true;
  render();

  await waitMs(120);

  startHideRound().catch((err) => {
    console.warn("Could not start hide round", err);
  });

  setTimeout(() => {
    State.hidePoofActive = false;

    if (State.screen === Screen.HIDE) {
      render();
    }
  }, 520);
}

async function startHideRound() {
  if (State.sayVerseActive) return;
  if (State.hideReadyForFinal) return;

  State.hideAutoStarting = false;
  State.hideAutoFallbackReady = false;

  if (State.hideCount >= planMixed.length) {
    State.hideReadyForFinal = true;
    render();
    return;
  }

  State.hideReadyForFinal = false;
  State.hideCount = Math.min(planMixed.length, State.hideCount + hideWordsPerRound());
  State.revealedTokenIdx = new Set();

  State.sayVerseActive = true;
  State.sayVerseStartedAt = 0;
  State.sayVerseDurationMs = 0;
  render();

  setAudioSrc(AUDIO_FILE);
  const d = await waitForDuration();
  const durationMs = (isFinite(d) && d > 0)
    ? d * 1000 * hideTimerMultiplier()
    : 6500;

  if (State.screen !== Screen.HIDE || !State.sayVerseActive) return;

  State.sayVerseStartedAt = performance.now();
  State.sayVerseDurationMs = durationMs;

  const animate = () => {
    const pct = getSayVersePct();
    const currentBar = document.getElementById("sayVerseBar");

    if (currentBar) {
      currentBar.style.width = (pct * 100) + "%";
    }

    if (pct > 0 && State.sayVerseActive && State.screen === Screen.HIDE) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);

  await new Promise(r => setTimeout(r, durationMs));

  if (State.screen !== Screen.HIDE) return;

  State.sayVerseActive = false;
  State.sayVerseStartedAt = 0;
  State.sayVerseDurationMs = 0;

  if (State.hideCount >= planMixed.length) {
    State.hideReadyForFinal = true;
    render();
    return;
  }

  render();
}

async function startFinalRecallFlow() {
  if (State.finalRecallActive) return;

  State.finalRecallAutoStarting = false;
  State.finalRecallAutoFallbackReady = false;
  State.finalRecallActive = true;
  State.finalRecallStartedAt = 0;
  State.finalRecallDurationMs = 0;
  State.finalRecallDone = false;
  State.finalRecallRevealed = false;
  render();

  setAudioSrc(AUDIO_FILE);
  const d = await waitForDuration();
  const durationMs = (isFinite(d) && d > 0) ? d * 1000 : 5000;

  if (State.screen !== Screen.FINAL_RECALL || !State.finalRecallActive) return;

  State.finalRecallStartedAt = performance.now();
  State.finalRecallDurationMs = durationMs;
  render();

  await new Promise(r => setTimeout(r, durationMs));

  if (State.screen !== Screen.FINAL_RECALL) return;

  State.finalRecallActive = false;
  State.finalRecallStartedAt = 0;
  State.finalRecallDurationMs = 0;
  State.finalRecallDone = true;
  State.hasLearnedVerse = true;

  if (VERSE_ID) {
    markLearnCompleted(VERSE_ID);
  }

  render();
}

async function startChunkFlow() {
  if (State.chunkRunning) return;

  State.chunkAutoStarting = false;
  State.chunkAutoFallbackReady = false;

  // cancel any prior learn audio sequence
  cancelLearnAudio();

  await runChunkSequence();
}

async function runChunkSequence() {
  const my = ++echoCancelToken;

  State.chunkDone = false;
  State.chunkRunning = true;
  State.chunkIndex = 0;
  State.audioMode = "chunk";
  render();

  try {
    const learnParts = getLearnAudioParts();

    for (let i = 0; i < learnParts.length; i++) {
      if (my !== echoCancelToken) return;

      const part = learnParts[i];
      const file = part.file;

      setAudioSrc(file);
      audioEl.currentTime = 0;

      State.chunkIndex = i;
      render();

      try {
        await safePlay();
      } catch (e) {
        showDialog({
          title: "Learn audio missing",
          body: `Couldn't play: ${file}`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
        return;
      }

      await new Promise((resolve) => {
        const onEnd = () => {
          audioEl.removeEventListener("ended", onEnd);
          resolve();
        };
        audioEl.addEventListener("ended", onEnd);
      });

      if (my !== echoCancelToken) return;

      const d = await waitForDuration();
      const pauseMs = (isFinite(d) && d > 0) ? Math.max(500, d * 0.35 * 1000) : 700;
      await waitForPausableDelay(pauseMs);

      if (my !== echoCancelToken) return;
    }

    setAudioSrc(AUDIO_FILE);
    State.audioMode = null;
    State.chunkDone = true;
    State.chunkPassCount = Math.min(2, State.chunkPassCount + 1);
  } finally {
    if (my === echoCancelToken) {
      State.chunkRunning = false;

      if (State.screen === Screen.CHUNKS && State.chunkPassCount === 1) {
        startLearnInstruction("chunks2");
        return;
      }

      if (State.screen === Screen.CHUNKS && State.chunkPassCount >= 2) {
        startLearnInstruction("echo1");
        return;
      }

      render();
    }
  }
}

async function startEchoFlow() {
  if (State.echoRunning) return;

  State.echoAutoStarting = false;
  State.echoAutoFallbackReady = false;

  // cancel any prior
  cancelLearnAudio();

  await runEchoSequence();
}

let echoCancelToken = 0;

function cancelLearnAudio() {
  echoCancelToken++;
  try { audioEl.pause(); audioEl.currentTime = 0; } catch (e) { }

  State.audioMode = null;
  State.instructionPlaying = false;
  State.instructionKey = "";

  State.listenPlaying = false;
  State.chunkRunning = false;
  State.echoRunning = false;
  State.echoSpeaking = false;
}

async function runEchoSequence() {
  const my = ++echoCancelToken;

  State.echoDone = false;
  State.echoRunning = true;
  State.echoSpeaking = false;
  State.echoIndex = 0;
  State.audioMode = "echo";
  render();

  try {
    const learnParts = getLearnAudioParts();

    for (let i = 0; i < learnParts.length; i++) {
      if (my !== echoCancelToken) return;

      const part = learnParts[i];
      const file = part.file;

      setAudioSrc(file);
      audioEl.currentTime = 0;

      State.echoIndex = i;
      render();

      try {
        await safePlay();
      } catch (e) {
        showDialog({
          title: "Learn audio missing",
          body: `Couldn't play: ${file}`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
        return;
      }

      await new Promise((resolve) => {
        const onEnd = () => {
          audioEl.removeEventListener("ended", onEnd);
          resolve();
        };
        audioEl.addEventListener("ended", onEnd);
      });

      if (my !== echoCancelToken) return;

      State.echoSpeaking = true;
      render();

      // Give the child time to repeat: duration × 1.25 (fallback 2s if unknown)
      const d = await waitForDuration();
      const repeatMs = (isFinite(d) && d > 0) ? (d * 1.25 * 1000) : 2000;
      await waitForPausableDelay(repeatMs);

      if (my !== echoCancelToken) return;

      State.echoSpeaking = false;
      render();
    }

    // restore main verse audio for later
    setAudioSrc(AUDIO_FILE);

    State.echoDone = true;
    State.echoRunning = false;
    State.echoSpeaking = false;
    State.audioMode = null;

    startLearnInstruction("remove");
    return;

  } finally {
    if (my === echoCancelToken) {
      State.echoRunning = false;
      State.echoSpeaking = false;
      render();
    }
  }
}

function stopFireworks() {
  if (State.fireworksTimer) {
    clearInterval(State.fireworksTimer);
    State.fireworksTimer = null;
  }
}

function startFireworks(canvas) {
  stopFireworks();

  const ctx = canvas.getContext("2d");
  const particles = [];

  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  function burst() {
    const x = Math.random() * canvas.clientWidth;
    const y = 80 + Math.random() * (canvas.clientHeight * 0.45);

    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 2 + Math.random() * 3.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        size: 2 + Math.random() * 3
      });
    }
  }

  burst();
  State.fireworksTimer = setInterval(burst, 1400);

  function tick() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life -= 1;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life / 60);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = ["#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#ffffff"][i % 5];
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (State.screen === Screen.CELEBRATION) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}


/* Nav rendering */
function renderNav() {
  // Always show nav except intro/title? Your other apps hide nav on intro.
  const show = (
    State.screen !== Screen.INTRO &&
    State.screen !== Screen.TITLE_SEQUENCE &&
    State.screen !== Screen.TITLE &&
    State.screen !== Screen.TODO &&
    State.screen !== Screen.TODO_DEV &&
    State.screen !== Screen.CELEBRATION &&
    State.screen !== Screen.LEARN_LEVEL &&
    State.screen !== Screen.PRACTICE_GATE &&
    State.screen !== Screen.PRACTICE_HUB &&
    State.screen !== Screen.PRACTICE &&
    State.screen !== Screen.PLAYGROUND &&
    State.screen !== Screen.PROGRESS &&
    State.screen !== Screen.VERSE_DETAIL &&
    State.screen !== Screen.PET_STATS &&
    State.screen !== Screen.PET_UNLOCK &&
    !isLearnFlowScreen(State.screen)
  );

  navBar.style.display = show ? "flex" : "none";
  if (!show) {
    navBar.innerHTML = "";
    return;
  }

  // Determine left/back and right/next behavior
  let left = null;
  let center = "";
  let right = null;

  const muteBtn = `
    <button class="nav-btn no-zoom" id="btnMute" title="Mute / unmute">
      ${muted ? SVG_MUTE : SVG_UNMUTE}
    </button>
  `;

  const backBtn = `
    <button class="nav-btn no-zoom" id="btnBack" title="Back">
      ${SVG_BACK}
    </button>
  `;

  const homeBtn = `
  <button class="nav-btn no-zoom" id="btnHome" title="Home">
    ${SVG_HOME}
  </button>
`;

  const nextBtn = `
    <button class="nav-btn no-zoom" id="btnNext" title="Next">
      ${SVG_FORWARD}
    </button>
  `;

  // left/back destinations
  const isLearnScreen = isLearnFlowScreen(State.screen);

  if (State.screen === Screen.TITLE) left = "";
  else if (isLearnScreen) left = homeBtn;
  else left = backBtn;

  // center label
  if (State.screen === Screen.TITLE) center = "HOME";
  if (State.screen === Screen.PROGRESS) center = "PROGRESS";
  if (State.screen === Screen.PET_STATS) center = "STATS";
  if (State.screen === Screen.VERSE_DETAIL) center = "PROGRESS";
  if (State.screen === Screen.LEARN_LEVEL) center = "LEARN";
  if (State.screen === Screen.PRACTICE_GATE) center = "PRACTICE";
  if (State.screen === Screen.LISTEN) center = "LISTEN TO THE VERSE";
  if (State.screen === Screen.MEANING) center = "WHAT IT MEANS";
  if (State.screen === Screen.CHUNKS) center = "BREAK IT INTO CHUNKS";
  if (State.screen === Screen.ECHO) center = "ECHO THE VERSE";
  if (State.screen === Screen.HIDE) center = "TRY TO SAY THE VERSE";
  if (State.screen === Screen.FINAL_RECALL) center = "FINAL TEST";
  if (State.screen === Screen.PET_UNLOCK) center = "BIBLOPET";
  if (State.screen === Screen.PRACTICE) center = "PRACTICE";

  right = (
    isLearnScreen ||
    State.screen === Screen.PROGRESS ||
    State.screen === Screen.PET_STATS ||
    State.screen === Screen.VERSE_DETAIL ||
    State.screen === Screen.PET_UNLOCK
  ) ? "" : nextBtn;

  const rightControls = isLearnScreen
    ? `${right || ""}`
    : `${muteBtn}${right || ""}`;

  navBar.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center;">
      ${left || `<div style="width:var(--tap);height:var(--tap)"></div>`}
    </div>
    <div class="nav-center">${center}</div>
    <div style="display:flex; gap:12px; align-items:center;">
      ${rightControls}
    </div>
  `;

  // wire events
  const btnMute = document.getElementById("btnMute");
  if (btnMute) btnMute.onclick = toggleMute;

  const btnBack = document.getElementById("btnBack");
  if (btnBack) {
    btnBack.onclick = () => {
      if (State.screen === Screen.LEARN_LEVEL) go(Screen.TITLE);
      else if (State.screen === Screen.PROGRESS) go(Screen.TITLE);
      else if (State.screen === Screen.PET_STATS) go(Screen.PROGRESS);
      else if (State.screen === Screen.VERSE_DETAIL) go(Screen.PROGRESS);
      else if (State.screen === Screen.PRACTICE_GATE) go(Screen.TITLE);
      else if (State.screen === Screen.LISTEN) go(Screen.LEARN_LEVEL);
      else if (State.screen === Screen.MEANING) go(Screen.LISTEN);
      else if (State.screen === Screen.CHUNKS) go(Screen.MEANING);
      else if (State.screen === Screen.ECHO) {
        if (State.learnStartScreen === Screen.ECHO) go(Screen.LEARN_LEVEL);
        else go(Screen.CHUNKS);
      }
      else if (State.screen === Screen.HIDE) go(Screen.ECHO);
      else if (State.screen === Screen.FINAL_RECALL) go(Screen.HIDE);
      else if (State.screen === Screen.PRACTICE) go(Screen.TITLE);
      else go(Screen.TITLE);
    };
  }

  const btnHome = document.getElementById("btnHome");
  if (btnHome) {
    btnHome.onclick = () => {
      if (
        State.screen === Screen.LISTEN ||
        State.screen === Screen.MEANING ||
        State.screen === Screen.CHUNKS ||
        State.screen === Screen.ECHO ||
        State.screen === Screen.HIDE ||
        State.screen === Screen.FINAL_RECALL
      ) {
        resetLearn(true);
        return;
      }

      if (State.screen === Screen.PRACTICE_GATE) {
        go(Screen.TITLE);
        return;
      }

      go(Screen.TITLE);
    };
  }


  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    const disabled =
      (State.screen === Screen.LISTEN && (!State.listenDone || State.listenPlaying)) ||
      (State.screen === Screen.ECHO && (!State.echoDone || State.echoRunning)) ||
      (State.screen === Screen.FINAL_RECALL);

    btnNext.style.opacity = disabled ? "0.45" : "1";
    btnNext.style.pointerEvents = disabled ? "none" : "auto";

    btnNext.onclick = () => {
      if (State.isSliding) return;

      if (State.screen === Screen.TITLE) go(Screen.LEARN_LEVEL);
      else if (State.screen === Screen.LEARN_LEVEL) learnLevelRun();
      else if (State.screen === Screen.PRACTICE_GATE) {
        resetLearn(false);
        go(Screen.LEARN_LEVEL);
      }
      else if (State.screen === Screen.LISTEN) go(Screen.MEANING);
      else if (State.screen === Screen.MEANING) {
        if (!State.instructionPlaying) {
          playInstruction("chunks1", {
            doneFlag: "chunksIntroDone",
            after: () => {
              goToChunksAndStart();
            }
          });
        }
      }
      else if (State.screen === Screen.CHUNKS) {
        if (State.instructionPlaying) return;
        if (State.chunkPassCount >= 2) goToEchoAndStart();
        else if (!State.chunkRunning) startChunkFlow();
      }
      else if (State.screen === Screen.ECHO) goToHideAndStartRound();
      else if (State.screen === Screen.HIDE) {
        if (State.instructionPlaying) return;

        if (State.hideCount >= planMixed.length) {
          goToFinalRecallAndStart();
        } else {
          startHideRound();
        }
      }
      else if (State.screen === Screen.FINAL_RECALL) return;
      else if (State.screen === Screen.PRACTICE) go(Screen.TITLE);
    };
  }
}

/* Screen builders */
function makeSlide({ idx, bg, navHidden = false, inner }) {
  const learnLayout = inner?.querySelector?.(".learn-layout");
  const learnRef = learnLayout?.querySelector?.(".learn-ref");
  const isInstructionLayout = !!learnLayout?.classList?.contains("learn-layout-instruction");
  const hasLearnMenu = !!learnLayout && !!learnRef && !isInstructionLayout;

  if (hasLearnMenu) {
    navHidden = true;
    learnLayout.classList.add("learn-layout-with-menu");

    const menuBtn = document.createElement("button");
    menuBtn.className = "learn-menu-btn no-zoom";
    menuBtn.type = "button";
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-label", "Learn Menu");
    menuBtn.onclick = openLearnMenu;

    learnRef.prepend(menuBtn);
  }

  const s = document.createElement("div");
  s.className = "slide" + (navHidden ? " nav-hidden" : "");
  s.style.setProperty("--bg", bg);
  s.dataset.idx = String(idx);
  s.innerHTML = "";
  s.appendChild(inner);

  return s;
}


/* =========================
   6. Game Framework
   ========================= */


function screenIntro(idx) {
  const wrap = document.createElement("div");
  wrap.className = "quiz-intro";
  wrap.innerHTML = `
    <img src="${INTRO_LOGO}" alt="Logo" onerror="this.style.display='none'">
    <div class="presented">Presented by</div>
    <div class="site">eatyourbible.com</div>
    <div class="hint">Tap anywhere to start</div>
  `;
  wrap.onclick = () => { go(Screen.TITLE_SEQUENCE); };
  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenTitleSequence(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-sequence-screen";
  wrap.setAttribute("aria-label", "Let's Memorize God's Word!");

  wrap.innerHTML = `
    <div class="title-sequence-content">
      <div class="title-sequence-head-stage" aria-hidden="true">
        <img
          class="title-sequence-face title-sequence-face-back"
          src="${TITLE_FACE_BACK}"
          alt=""
          draggable="false"
          onerror="this.style.display='none'"
        >

        <img
          class="title-sequence-bible"
          src="${TITLE_BIBLE}"
          alt=""
          draggable="false"
          onerror="this.style.display='none'"
        >

        <img
          class="title-sequence-face title-sequence-face-front"
          src="${TITLE_FACE_FRONT}"
          alt=""
          draggable="false"
          onerror="this.style.display='none'"
        >
      </div>

      <div class="title-sequence-message">
        Let’s Memorize God’s Word!
      </div>
    </div>
  `;

  let readyForTap = false;

  function makeReadyForTap() {
    if (readyForTap) return;
    readyForTap = true;
    wrap.classList.add("is-ready");
  }

  wrap.addEventListener("animationend", (e) => {
    if (e.animationName === "titleSequenceTextPop") {
      makeReadyForTap();
    }
  });

  setTimeout(makeReadyForTap, 3800);

  wrap.onclick = () => {
    if (!readyForTap) return;
    go(Screen.TITLE);
  };

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenTitle(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen";
  const opt = TITLE_OPTIONS[State.titleOptionIndex];
  const buttonLabel =
    opt.id === "learn" && State.hasLearnedVerse
      ? "Learn Again"
      : opt.label;

  wrap.innerHTML = `
    <div class="title-content">
      <div id="titleLogoSecretWrap" class="title-logo-secret-wrap">
        <img
          id="titleLogoSecret"
          src="${TITLE_LOGO}"
          alt="Title graphic"
          draggable="false"
          onerror="this.style.display='none'">
      </div>
    <h2>
      ${HAS_VERSE_SELECTION ? `${VERSE_REF}` : "Biblo-Zoo"}
      ${DEBUG_MODE ? " (DEBUG)" : ""}
    </h2>
    
      <div class="title-picker">
        <select id="versePicker" class="title-picker-select"></select>
      </div>

      <button
        class="title-todo-btn no-zoom"
        id="titleTodoBtn"
        type="button"
        aria-label="Open Zoo To-Do"
      >
        <img
          class="title-todo-img"
          src="${IMG_DIR}button_todo.png"
          alt="Zoo To-Do"
          draggable="false"
          onerror="this.style.display='none'"
        >
      </button>

      <div class="title-action-row" aria-label="Main actions">
        ${renderTitleActionButton({
    id: "learn",
    label: State.hasLearnedVerse ? "Review" : "Learn",
    image: "button_learn.png",
    color: "#ffc751",
    textColor: "#333333"
  })}

        ${renderTitleActionButton({
    id: "practice",
    label: "Practice",
    image: "button_practice.png",
    color: "#ff5a51",
    textColor: "#ffffff"
  })}

        ${renderTitleActionButton({
    id: "pets",
    label: "Pets",
    image: "button_pets.png",
    color: "#a7cb6f",
    textColor: "#ffffff"
  })}
      </div>

      ${titleZooStripHtml()}

      ${titleZooVisitButtonHtml()}

      <div class="title-attribution" style="max-width: 60ch;">
        ${ATTRIBUTION ? ATTRIBUTION : ""}
      </div>
    </div>
  `;

  const titleTodoBtn = wrap.querySelector("#titleTodoBtn");
  if (titleTodoBtn) {
    titleTodoBtn.onclick = (e) => {
      e.stopPropagation();
      go(Screen.TODO);
    };
  }


  // wire title action buttons
  wrap.querySelectorAll("[data-title-action]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      if (!HAS_VERSE_SELECTION) {
        showDialog({
          title: "Pick a verse first 🙂",
          body: "Choose a verse from the dropdown before you start.",
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
        return;
      }

      const action = btn.dataset.titleAction;

      if (action === "learn") {
        go(Screen.LEARN_LEVEL);
        return;
      }

      if (action === "practice") {
        if (State.hasLearnedVerse) go(Screen.PRACTICE_HUB);
        else go(Screen.PRACTICE_GATE);
        return;
      }

      if (action === "pets") {
        go(Screen.PROGRESS);
      }
    };
  });

  const titleZooStrip = wrap.querySelector("#titleZooStrip");
  if (titleZooStrip) {
    titleZooStrip.onclick = (e) => {
      e.stopPropagation();
      go(Screen.PROGRESS);
    };
  }

  const titleZooVisitBtn = wrap.querySelector("#titleZooVisitBtn");
  if (titleZooVisitBtn) {
    titleZooVisitBtn.onclick = (e) => {
      e.stopPropagation();

      const verseId = titleZooVisitBtn.getAttribute("data-verse-id");
      if (!verseId) return;

      State.selectedVerseId = verseId;
      go(Screen.VERSE_DETAIL);
    };
  }

  bindTitleZooPetRotation(wrap);

  const titleLogoSecretWrap = wrap.querySelector("#titleLogoSecretWrap");
  const titleLogoSecret = wrap.querySelector("#titleLogoSecret");

  if (titleLogoSecret) {
    titleLogoSecret.setAttribute("draggable", "false");
    titleLogoSecret.style.webkitUserDrag = "none";
    titleLogoSecret.style.webkitTouchCallout = "none";
    titleLogoSecret.style.userSelect = "none";
    titleLogoSecret.style.webkitUserSelect = "none";
    titleLogoSecret.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  bindLongPress(titleLogoSecretWrap, {
    delay: HIDDEN_LEARN_COMPLETE_LONG_PRESS_MS,
    shouldStart: () => HAS_VERSE_SELECTION && !!VERSE_ID,
    onLongPress: () => {
      if (!VERSE_ID) return;

      markLearnCompleted(VERSE_ID);
      State.hasLearnedVerse = true;
      render();

      showDialog({
        title: "Debug Learn Complete",
        body: `${VERSE_REF} was marked as Learn completed.`,
        actions: [dlgBtn("OK", { onClick: closeDialog })]
      });
    }
  });

  const versePicker = wrap.querySelector("#versePicker");
  if (versePicker) {
    versePicker.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a verse...";
    placeholder.disabled = true;
    placeholder.selected = !HAS_VERSE_SELECTION;
    versePicker.appendChild(placeholder);

    for (const item of VERSE_LIST) {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.ref;

      if (HAS_VERSE_SELECTION && item.id === VERSE_ID) {
        opt.selected = true;
      }

      versePicker.appendChild(opt);
    }

    versePicker.onchange = async () => {
      const nextVerseId = versePicker.value;
      if (!nextVerseId) return;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("v", nextVerseId);
        history.replaceState(null, "", url.toString());

        await loadVerse(nextVerseId);
        HAS_VERSE_SELECTION = true;
        State.titleOptionIndex = 0;
        resetLearn(false);
        render();
      } catch (err) {
        console.error(err);
        showDialog({
          title: "Verse JSON not found",
          body: `Could not load ${DATA_DIR}${nextVerseId}.json`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
      }
    };
  }



  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function todoDevRowHtml(todo = {}) {
  const {
    type = "",
    image = "",
    emoji = "",
    text = "",
    verseId = "",
    petEmoji = "",
    disabled = false
  } = todo;

  let iconHtml = "";

  if (type === "feed_pet" || type === "wake_pet") {
    iconHtml = bibloPetVisualHtml(verseId, petEmoji || "🐾");
  } else if (image) {
    iconHtml = `
      <img
        class="todo-dev-row-img"
        src="${escapeHtml(image)}"
        alt=""
        draggable="false"
        onerror="this.style.display='none'"
      >
    `;
  } else {
    iconHtml = `<span class="todo-dev-row-emoji" aria-hidden="true">${escapeHtml(emoji || "✅")}</span>`;
  }

  return `
    <button
      class="todo-dev-row no-zoom ${disabled ? "is-disabled" : ""}"
      type="button"
      data-todo-type="${escapeHtml(type)}"
      data-verse-id="${escapeHtml(verseId)}"
      ${disabled ? "disabled" : ""}
    >
      <span class="todo-dev-row-icon">
        ${iconHtml}
      </span>

      <span class="todo-dev-row-text">
        ${escapeHtml(text)}
      </span>
    </button>
  `;
}

function getKnownZooTodoVerseIds(progress) {
  if (!Array.isArray(VERSE_LIST)) return [];

  return VERSE_LIST
    .map((item) => item?.id || "")
    .filter(Boolean);
}

function getMostRecentLearnedAt(progress) {
  if (!progress?.verses || typeof progress.verses !== "object") return 0;

  let mostRecent = 0;

  for (const verseProgress of Object.values(progress.verses)) {
    if (!verseProgress?.learnCompleted) continue;

    // learnedAt is the new accurate field.
    // lastPracticedAt is a fallback for verses learned before learnedAt existed.
    const learnedAt = Number(verseProgress.learnedAt || verseProgress.lastPracticedAt || 0);

    if (learnedAt > mostRecent) {
      mostRecent = learnedAt;
    }
  }

  return mostRecent;
}

function hasAnyLearnedVerse(progress) {
  if (!progress?.verses || typeof progress.verses !== "object") return false;

  return Object.values(progress.verses).some((verseProgress) => {
    return !!verseProgress?.learnCompleted;
  });
}

function shouldShowLearnNewVerseTodo(progress) {
  const DAY_MS = 1000 * 60 * 60 * 24;

  if (!hasAnyLearnedVerse(progress)) return true;

  const mostRecentLearnedAt = getMostRecentLearnedAt(progress);

  // If we cannot determine when the last verse was learned,
  // gently suggest learning a new one.
  if (!mostRecentLearnedAt) return true;

  return Date.now() - mostRecentLearnedAt >= 7 * DAY_MS;
}

function generateZooTodos() {
  const progress = loadProgress();
  const todos = [];
  const sleepingTodos = [];
  const hungryTodos = [];

  const verseIds = getKnownZooTodoVerseIds(progress);

  for (const verseId of verseIds) {
    const verseProgress = progress?.verses?.[verseId] || {
      learnCompleted: false,
      games: {}
    };

    const status = getBibloPetStatus(verseProgress);

    if (status !== "hungry" && status !== "sleeping") continue;

    const petName = getBibloPetDisplayNameForVerseId(verseId);
    const petEmoji = getBibloPetEmojiForVerseId(verseId);

    const todo = {
      type: status === "sleeping" ? "wake_pet" : "feed_pet",
      verseId,
      petEmoji,
      text: status === "sleeping"
        ? `Wake up ${petName}`
        : `Feed ${petName}`
    };

    if (status === "sleeping") {
      sleepingTodos.push(todo);
    } else {
      hungryTodos.push(todo);
    }
  }

  todos.push(...sleepingTodos);
  todos.push(...hungryTodos);

  if (shouldShowLearnNewVerseTodo(progress)) {
    todos.push({
      type: "learn_new_verse",
      image: `${IMG_DIR}clipboard_bible.png`,
      text: "Learn a New Verse"
    });
  }

  if (!todos.length) {
    todos.push({
      type: "all_done",
      emoji: "✅",
      text: "All Done!",
      disabled: true
    });
  }

  return todos;
}

function getZooTodoActionText(type, petName) {
  if (type === "wake_pet") return `Wake up ${petName}`;
  if (type === "feed_pet") return `Feed ${petName}`;
  return "";
}

async function startZooTodo(todoType, verseId) {
  if (todoType === "learn_new_verse") {
    showDialog({
      title: "Coming Soon!",
      body: "A verse selection screen will live here.",
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
    return;
  }

  if (todoType !== "feed_pet" && todoType !== "wake_pet") return;
  if (!verseId) return;

  const petName = getBibloPetDisplayNameForVerseId(verseId);
  const petEmoji = getBibloPetEmojiForVerseId(verseId);

  State.activeTodo = {
    type: todoType,
    verseId,
    petName,
    petEmoji,
    text: getZooTodoActionText(todoType, petName)
  };

  State.selectedVerseId = verseId;

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("v", verseId);
    history.replaceState(null, "", url.toString());

    await loadVerse(verseId);
    HAS_VERSE_SELECTION = true;

    go(Screen.PRACTICE_HUB);
  } catch (err) {
    console.error(err);

    State.activeTodo = null;

    showDialog({
      title: "Verse JSON not found",
      body: `Could not load ${DATA_DIR}${verseId}.json`,
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
  }
}

function bindZooTodoRows(rootEl) {
  rootEl.querySelectorAll("[data-todo-type]").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();

      if (btn.disabled) return;

      const todoType = btn.getAttribute("data-todo-type") || "";
      const verseId = btn.getAttribute("data-verse-id") || "";

      await startZooTodo(todoType, verseId);
    };
  });
}

function practiceHubHeaderHtml() {
  const activeTodo = State.activeTodo;

  if (
    activeTodo &&
    activeTodo.verseId &&
    activeTodo.verseId === VERSE_ID &&
    (activeTodo.type === "feed_pet" || activeTodo.type === "wake_pet")
  ) {
    return `
      <div class="practice-todo-header">
        <div class="practice-todo-pet" aria-hidden="true">
          ${bibloPetVisualHtml(activeTodo.verseId, activeTodo.petEmoji || "🐾")}
        </div>

        <h2 id="practiceHubTitle">
          ${escapeHtml(activeTodo.text || getZooTodoActionText(activeTodo.type, activeTodo.petName || "BibloPet"))}
        </h2>
      </div>
    `;
  }

  return `<h2 id="practiceHubTitle">Practice</h2>`;
}

function screenTodo(idx) {
  const wrap = document.createElement("div");
  wrap.className = "todo-screen";

  wrap.innerHTML = `
    ${homePillHtml("Home")}

    <div class="todo-coming-soon-card" id="todoComingSoonCard">
      <img
        class="todo-coming-soon-img"
        src="${IMG_DIR}button_todo.png"
        alt="Zoo To-Do"
        draggable="false"
        onerror="this.style.display='none'"
      >

      <div class="todo-coming-soon-title">Coming Soon!</div>
      <div class="todo-coming-soon-text">
        Your zookeeper checklist will live here.
      </div>
    </div>
  `;

  bindHomePill(wrap);

  bindLongPress(wrap.querySelector("#todoComingSoonCard"), {
    delay: 1000,
    onLongPress: () => {
      go(Screen.TODO_DEV);
    }
  });

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenTodoDev(idx) {
  const wrap = document.createElement("div");
  wrap.className = "todo-dev-screen";

  const rowsHtml = generateZooTodos()
    .map(todoDevRowHtml)
    .join("");

  wrap.innerHTML = `
    ${homePillHtml("Home")}

    <main class="todo-dev-page">
      <section class="todo-dev-clipboard" aria-label="Zoo To-Do prototype">
        <img
          class="todo-dev-clip"
          src="${IMG_DIR}clipboard_clip.png"
          alt=""
          draggable="false"
          onerror="this.style.display='none'"
        >

        <div class="todo-dev-paper">
          <img
            class="todo-dev-title-img"
            src="${IMG_DIR}clipboard_title.png"
            alt="Zoo To-Do"
            draggable="false"
            onerror="this.style.display='none'"
          >

          <div class="todo-dev-list">
            ${rowsHtml}
          </div>
        </div>
      </section>
    </main>
  `;

  bindHomePill(wrap);
  bindZooTodoRows(wrap);

  return makeSlide({ idx, bg: "#a7cb6f", navHidden: true, inner: wrap });
}


function screenProgress(idx) {
  const wrap = document.createElement("div");
  wrap.className = "progress-screen";

  const hasVerses = Array.isArray(VERSE_LIST) && VERSE_LIST.length > 0;

  if (!hasVerses) {
    wrap.innerHTML = `
      <div class="progress-shell">
        <div class="biblopet-title-row">
          ${titleHomePillHtml()}
          <div class="progress-heading">BibloPet Zoo</div>
          <div class="biblopet-title-spacer"></div>
        </div>

        <div class="progress-subheading">Practice each verse to unlock its BibloPet.</div>
        <div class="progress-empty-card">
          No verses found yet.
        </div>
      </div>
    `;

    bindHomePill(wrap);

    return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
  }

  const rowsHtml = VERSE_LIST.map(item => {
    const verseProgress = getVerseProgress(item.id);
    const unlocked = isBibloPetUnlocked(verseProgress);
    const petEmoji = unlocked ? getBibloPetEmojiForListItem(item) : "🔒";
    const petVisual = unlocked
      ? bibloPetVisualHtml(item.id, petEmoji)
      : escapeHtml(petEmoji);
    const statusEmoji = unlocked ? getBibloPetStatusEmoji(verseProgress) : "";

    return `
      <div class="progress-row" data-verse-id="${item.id}">
        <div class="progress-row-pet">${petVisual}</div>
        <div class="progress-row-main">
          <div class="progress-row-ref">${item.ref}</div>
        </div>
        <div class="progress-row-status">${statusEmoji}</div>
      </div>
    `;
  }).join("");

  wrap.innerHTML = `
    <div class="progress-shell">
      <div class="biblopet-title-row">
        ${titleHomePillHtml()}
        <div class="progress-heading">BibloPet Zoo</div>
        <div class="biblopet-title-spacer"></div>
      </div>

      <div class="progress-subheading">Practice each verse to unlock its BibloPet.</div>

      <div class="progress-toolbar">
        <button class="progress-stats-btn no-zoom" id="btnBibloPetStats" type="button">
          BibloPet Stats
        </button>
      </div>

      <div class="progress-list">
        ${rowsHtml}
      </div>
    </div>
  `;

  const btnStats = wrap.querySelector("#btnBibloPetStats");
  if (btnStats) {
    btnStats.onclick = () => {
      go(Screen.PET_STATS);
    };
  }

  wrap.querySelectorAll(".progress-row").forEach(row => {
    row.onclick = () => {
      const verseId = row.getAttribute("data-verse-id");
      State.selectedVerseId = verseId;
      go(Screen.VERSE_DETAIL);
    };
  });

  bindHomePill(wrap);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });

}

function openPetNameDialog(verseId) {
  loadPetNameBlocklist();
  loadPetRandomNames();

  dlgActions.classList.add("pet-name-dialog-actions");

  const currentDisplayName = getBibloPetDisplayNameForVerseId(verseId);
  const hasCustomName = hasCustomPetNameForVerseId(verseId);

  showDialog({
    title: hasCustomName ? "Rename your BibloPet" : "Name your BibloPet",
    bodyHtml: `
      <div class="pet-name-dialog">
        <input
          class="pet-name-input"
          id="petNameInput"
          type="text"
          maxlength="${PET_NAME_MAX_LENGTH}"
          value="${escapeHtml(currentDisplayName)}"
          autocomplete="off"
          autocapitalize="words"
          spellcheck="false"
          aria-label="BibloPet name"
        >

        <div class="pet-name-hint">
          Leave blank to use the default name.
        </div>

        <div class="pet-name-error" id="petNameError" aria-live="polite"></div>
      </div>
    `,
    actions: [
      dlgBtn("Surprise Name", {
        secondary: true,
        onClick: async () => {
          const input = document.getElementById("petNameInput");
          const error = document.getElementById("petNameError");

          if (error) {
            error.textContent = "";
          }

          await loadPetNameBlocklist();
          await loadPetRandomNames();

          if (input) {
            input.value = getRandomPetName();
            input.focus();
            input.select();
          }
        }
      }),

      dlgBtn("Save Name", {
        onClick: async () => {
          const input = document.getElementById("petNameInput");
          const error = document.getElementById("petNameError");
          const rawName = input ? input.value : "";

          if (error) {
            error.textContent = "";
          }

          await loadPetNameBlocklist();

          const result = savePetNameForVerseId(verseId, rawName);

          if (!result.ok) {
            if (error) {
              error.textContent = result.message || "Please choose a different name.";
            }
            return;
          }

          closeDialog();
          render();
        }
      }),

      dlgBtn("Cancel", {
        secondary: true,
        onClick: closeDialog
      })
    ]
  });

  requestAnimationFrame(() => {
    const input = document.getElementById("petNameInput");
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function screenVerseDetail(idx) {
  const verseId = State.selectedVerseId;
  const verseItem = getVerseListItemById(verseId);
  const verseProgress = getVerseProgress(verseId);

  const unlocked = isBibloPetUnlocked(verseProgress);
  const mastered = isVerseMastered(verseProgress);
  const petEmoji = unlocked ? getBibloPetEmojiForVerseId(verseId) : "🔒";
  const petDisplayName = unlocked ? getBibloPetDisplayNameForVerseId(verseId) : "";
  const petNameButtonText = hasCustomPetNameForVerseId(verseId) ? "Rename Pet" : "Name Pet";
  const statusEmoji = unlocked ? getBibloPetStatusEmoji(verseProgress) : "🔒";
  const statusText = getBibloPetStatusText(verseProgress);
  const petStatus = getBibloPetStatus(verseProgress);
  const petAnimationClass = unlocked ? getBibloPetAnimationClass(verseId, verseProgress) : "";
  const petBackgroundClass = unlocked ? getVerseBackgroundClass(verseId, verseProgress) : "";
  const learnStatus = verseProgress.learnCompleted ? "✔" : "";

  function gameRow(label, gameId) {
    const progressDisplay = getVerseDetailProgressDisplay(gameId, verseProgress.games[gameId]);

    return `
      <div class="detail-row">
        <div class="detail-label">${label}</div>
        <div class="detail-stars detail-medals">${progressDisplay}</div>
      </div>
    `;
  }

  const wrap = document.createElement("div");
  wrap.className = "detail-screen";

  wrap.innerHTML = `
    <div class="detail-shell">
      <div class="biblopet-title-row">
        ${zooBackPillHtml()}
        <div class="detail-heading">${verseItem ? verseItem.ref : ""}</div>
        <div class="biblopet-title-spacer"></div>
      </div>

      <div class="detail-scroll">
        <div class="pet-card">
          ${unlocked
      ? `
                <div class="pet-stage ${petBackgroundClass}">
                  ${petStatus === "sleeping"
        ? `
                        <div class="pet-sleep-zs" aria-hidden="true">
                          <span>Z</span>
                          <span>Z</span>
                          <span>Z</span>
                        </div>
                      `
        : ""
      }
                  ${petStatus === "hungry"
        ? `
                        <div class="pet-hungry-food-targets" aria-hidden="true">
                          <span class="pet-hungry-food-target left">🍎</span>
                          <span class="pet-hungry-food-target right">🍞</span>
                        </div>
                      `
        : ""
      }
                  <div class="pet-emoji pet-emoji-unlocked ${petAnimationClass}">
  ${bibloPetVisualHtml(verseId, petEmoji)}
</div>
                </div>

                <button class="pet-bg-btn no-zoom" id="btnChangePetBg" type="button">
                  Change Background
                </button>
              `
      : `
                <div class="pet-stage">
                  <div class="pet-emoji pet-emoji-locked">🔒</div>
                  <div class="pet-locked-text">Practice more to unlock your BibloPet.</div>
                </div>
              `
    }
        </div>

        ${unlocked
      ? `
              <div class="pet-name-card">
                <div class="pet-name-label">BibloPet Name</div>
                <div class="pet-name-value">${petDisplayName}</div>
                <button class="pet-name-btn no-zoom" id="btnRenamePet" type="button">
                  ${petNameButtonText}
                </button>
              </div>
            `
      : ""
    }

        <div class="pet-status-card">
          <div class="pet-status-label">BibloPet Status:</div>
          <div class="pet-status-emoji">${statusEmoji}</div>
        </div>

        <div class="pet-helper-text">${statusText}</div>

        <button class="detail-listen-btn no-zoom" id="btnDetailListen" type="button">
          Listen to the Verse
        </button>

        ${verseProgress.learnCompleted
      ? `
              <button class="detail-listen-btn no-zoom" id="btnDetailPractice" type="button">
                Practice this verse
              </button>
            `
      : ""
    }

        <div class="detail-section">
          ${getVerseDetailGames().map(game => gameRow(game.label, game.id)).join("")}
        </div>
      </div>
    </div>
  `;

  const btnChangePetBg = wrap.querySelector("#btnChangePetBg");
  if (btnChangePetBg) {
    btnChangePetBg.onclick = () => {
      const medalCount = getVerseCompletedMedalCount(verseProgress);

      if (!canUseCustomPetBackgrounds(verseProgress)) {
        showDialog({
          title: "Locked",
          body: `Earn 5 total medals on this verse to unlock custom backgrounds for this BibloPet. You currently have ${medalCount}/5.`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
        return;
      }

      cycleVerseBackground(verseId);
      render();
    };
  }

  const btnRenamePet = wrap.querySelector("#btnRenamePet");
  if (btnRenamePet) {
    btnRenamePet.onclick = () => {
      openPetNameDialog(verseId);
    };
  }

  const btnDetailListen = wrap.querySelector("#btnDetailListen");
  if (btnDetailListen) {
    btnDetailListen.onclick = () => {
      const verseAudioFile = `${AUDIO_DIR}${verseId}.mp3`;

      try {
        audioEl.pause();
        audioEl.currentTime = 0;
      } catch (e) { }

      setAudioSrc(verseAudioFile);
      audioEl.currentTime = 0;

      safePlay().catch(() => {
        showDialog({
          title: "Verse audio missing",
          body: `Couldn't play: ${verseAudioFile}`,
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
      });
    };
  }

  const btnDetailPractice = wrap.querySelector("#btnDetailPractice");
  if (btnDetailPractice) {
    btnDetailPractice.onclick = () => {
      const url = new URL("index.html", window.location.href);
      url.searchParams.set("v", verseId);
      url.searchParams.set("screen", "practice_hub");
      window.location.href = url.href;
    };
  }

  bindZooBackPill(wrap);

  requestAnimationFrame(() => {
    applyPetMotionVars(wrap);
    startHungryFoodCycle(wrap, petStatus);
  });

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPetUnlock(idx) {
  const verseId = State.pendingPetUnlockVerseId;
  const verseItem = getVerseListItemById(verseId);
  const petEmoji = getBibloPetEmojiForVerseId(verseId);

  const wrap = document.createElement("div");
  wrap.className = "pet-unlock-screen";

  wrap.innerHTML = `
    ${homePillHtml()}
    <div class="pet-unlock-shell">
      <div class="pet-unlock-card">
        <div class="pet-unlock-emoji pet-emoji-unlocked">
          ${bibloPetVisualHtml(verseId, petEmoji)}
        </div>
      </div>

      <div class="pet-unlock-title">BibloPet Unlocked!</div>
      <div class="pet-unlock-ref">${verseItem ? verseItem.ref : ""}</div>

      <div class="celebration-actions">
        <button class="carousel-main no-zoom" id="btnPetUnlockPractice">
          ${isGameMixPetUnlockRequest() ? "Continue Mix" : "Practice"}
        </button>
        <button class="carousel-main no-zoom" id="btnPetUnlockVisit">
          ${isGameMixPetUnlockRequest() ? "Visit BibloPet Zoo" : "Visit BibloPet"}
        </button>
      </div>
    </div>
  `;

  const btnPractice = wrap.querySelector("#btnPetUnlockPractice");
  if (btnPractice) {
    btnPractice.onclick = () => {
      const unlockedVerseId = State.pendingPetUnlockVerseId;
      State.pendingPetUnlockVerseId = null;
      if (unlockedVerseId) State.selectedVerseId = unlockedVerseId;

      if (isGameMixPetUnlockRequest()) {
        const completedGameId = getGameMixCompletedGameIdFromUrl() || getGameMixState()?.currentGameId || "";
        continueGameMixAfterCompletion(completedGameId);
        return;
      }

      go(Screen.PRACTICE_HUB);
    };
  }

  const btnVisit = wrap.querySelector("#btnPetUnlockVisit");
  if (btnVisit) {
    btnVisit.onclick = () => {
      const unlockedVerseId = State.pendingPetUnlockVerseId;
      State.pendingPetUnlockVerseId = null;
      if (unlockedVerseId) State.selectedVerseId = unlockedVerseId;

      if (isGameMixPetUnlockRequest()) {
        clearGameMixState();
        cleanGameMixUrlParams();
        go(Screen.PROGRESS);
        return;
      }

      go(Screen.VERSE_DETAIL);
    };
  }

  bindHomePill(wrap);

  if (isGameMixPetUnlockRequest()) {
    const homeBtn = wrap.querySelector("[data-home-pill]");
    if (homeBtn) {
      homeBtn.onclick = (e) => {
        e.stopPropagation();

        try {
          audioEl.pause();
          audioEl.currentTime = 0;
        } catch (e) { }

        State.pendingPetUnlockVerseId = null;
        clearGameMixState();
        cleanGameMixUrlParams();
        go(Screen.TITLE);
      };
    }
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPetStats(idx) {
  const stats = getBibloPetStats();

  const wrap = document.createElement("div");
  wrap.className = "pet-stats-screen";

  wrap.innerHTML = `
    <div class="pet-stats-shell">
      <div class="biblopet-title-row">
        ${zooBackPillHtml()}
        <div class="pet-stats-heading">BibloPet Stats</div>
        <div class="biblopet-title-spacer"></div>
      </div>

      <div class="pet-stats-subheading">Here’s how your BibloPets are doing.</div>

      <div class="pet-stats-grid">
        <div class="pet-stats-card">
          <div class="pet-stats-emoji">📖</div>
          <div class="pet-stats-value">${stats.totalVerses}</div>
          <div class="pet-stats-label">Total Verses</div>
        </div>

        <div class="pet-stats-card">
          <div class="pet-stats-emoji">🐾</div>
          <div class="pet-stats-value">${stats.unlocked}</div>
          <div class="pet-stats-label">Unlocked Pets</div>
        </div>

        <div class="pet-stats-card">
          <div class="pet-stats-emoji">😀</div>
          <div class="pet-stats-value">${stats.happy}</div>
          <div class="pet-stats-label">Happy</div>
        </div>

        <div class="pet-stats-card">
          <div class="pet-stats-emoji">🤤</div>
          <div class="pet-stats-value">${stats.hungry}</div>
          <div class="pet-stats-label">Hungry</div>
        </div>

        <div class="pet-stats-card">
          <div class="pet-stats-emoji">😴</div>
          <div class="pet-stats-value">${stats.sleeping}</div>
          <div class="pet-stats-label">Asleep</div>
        </div>
      </div>
    </div>
  `;

  bindZooBackPill(wrap);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenLearnLevel(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen learn-level-screen";

  wrap.innerHTML = `
    ${homePillHtml()}
    <div class="title-content learn-level-content">
      <h2>Before we get started...</h2>
      <h2>How well do you know this verse?</h2>

      <div class="learn-level-stack">
        ${LEARN_LEVEL_OPTIONS.map((opt, i) => `
          <button
            class="learn-level-btn no-zoom"
            data-index="${i}"
            style="background:${opt.color}; color:${opt.textColor};"
          >
            <span class="learn-level-btn-title">${opt.emoji} ${opt.label}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  wrap.querySelectorAll(".learn-level-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      State.learnLevelIndex = Number(btn.dataset.index);
      learnLevelRun();
    };
  });

  bindHomePill(wrap);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenLearnInstruction(idx) {
  const cfg = getLearnInstructionConfig(State.learnInstructionKey);

  const image = cfg?.image || "verse_listen.png";
  const title = cfg?.title || "";
  const subtext = cfg?.subtext || "";
  const button = cfg?.button || "Continue";

  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  inner.innerHTML = `
    <div class="learn-layout learn-layout-instruction">

      <div class="learn-instruction-card">
        <img
          class="learn-instruction-image"
          src="${IMG_DIR}${image}"
          alt=""
          draggable="false"
          onerror="this.style.display='none'">

        <div class="learn-instruction-title">${title}</div>
        <div class="learn-instruction-subtext">${subtext}</div>

        <div class="learn-instruction-actions">
          <button
            class="carousel-main no-zoom learn-instruction-btn ${State.learnInstructionReady ? "is-ready" : "is-waiting"}"
            id="btnLearnInstructionContinue"
            type="button"
            ${State.learnInstructionReady ? "" : "disabled"}
            aria-disabled="${State.learnInstructionReady ? "false" : "true"}"
          >
            ${button}
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnLearnInstructionContinue");
  if (btn) {
    btn.onclick = () => {
      if (!State.learnInstructionReady) return;
      continueLearnInstruction();
    };
  }

  runAfterSlide(() => {
    if (State.screen === Screen.LEARN_INSTRUCTION) {
      playLearnInstructionAudio();
    }
  });

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenListen(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const hasHeardVerse =
    State.listenPlaying ||
    State.listenDone ||
    (State.instructionPlaying && State.instructionKey === "meaning");

  const listenDisplayText =
    hasHeardVerse ? VERSE_TEXT : "";

  const listenDisplayFitClass =
    hasHeardVerse
      ? getVerseFitClass(VERSE_TEXT)
      : "verse-fit-short";

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-listen learn-layout-coach-centered">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Listen as the verse is read.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-stage-smart ${listenDisplayFitClass}">
        ${smartLearnTextHtml({
      title: hasHeardVerse ? VERSE_REF : "",
      body: listenDisplayText,
      extraClass: hasHeardVerse ? "smart-learn-text-verse" : "smart-learn-text-placeholder"
    })}
      </div>

      <div class="learn-coach learn-bottom-zone">
        <div class="coach-actions">
          ${(
      State.listenPlaying ||
      State.instructionPlaying ||
      (State.listenAutoStarting && !State.listenAutoFallbackReady)
    )
      ? ``
      : `
                <button class="carousel-main no-zoom" id="btnListenPlay" style="max-width:520px;">
                  ${State.listenDone
        ? "What It Means"
        : State.listenAutoFallbackReady
          ? "Tap to Play Verse"
          : "🔊 Read it to me"
      }
                </button>
              `
    }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnListenPlay");
  if (btn) {
    btn.onclick = async () => {
      if (State.listenDone) {
        startLearnInstruction("meaning");
        return;
      }

      listenPlay();
    };
  }

  scheduleSmartLearnTextFit(inner);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenMeaning(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-meaning learn-layout-meaning">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Read what this verse means.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-stage-smart learn-verse-meaning">
        ${smartLearnTextHtml({
      title: "What It Means...",
      body: VERSE_MEANING,
      extraClass: "smart-learn-text-meaning"
    })}
      </div>

      <div class="learn-coach learn-bottom-zone learn-coach-meaning learn-coach-meaning-minimal">
        <div class="coach-actions">
          ${State.instructionPlaying
      ? ``
      : `
                <button class="carousel-main no-zoom learn-bottom-action-btn learn-remove-action-btn" id="btnMeaningNext" style="max-width:520px;">
                  Break It Down
                </button>
              `
    }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnMeaningNext");
  if (btn) {
    btn.onclick = () => {
      startLearnInstruction("chunks1");
    };
  }

  scheduleSmartLearnTextFit(inner);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenChunks(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const learnParts = getLearnAudioParts();
  const chunkText = learnParts[State.chunkIndex]?.text || VERSE_TEXT;

  let coachText = "Listen carefully as each chunk plays.";
  let buttonLabel = "▶ Start";

  if (State.instructionPlaying && State.instructionKey === "chunks1") {
    coachText = "Let's break the verse down into bite sized chunks.";
  } else if (State.instructionPlaying && State.instructionKey === "chunks2") {
    coachText = "Let's do that one more time.";
    buttonLabel = "One More Time";
  } else if (State.instructionPlaying && State.instructionKey === "echo1") {
    coachText = "Now echo the verse after me.";
    buttonLabel = "Echo the Verse";
  } else if (State.chunkRunning) {
    coachText = "Listen carefully as each chunk plays.";
  } else if (State.chunkPassCount === 1) {
    coachText = "Listen through the chunks one more time.";
    buttonLabel = "One More Time";
  } else if (State.chunkPassCount >= 2) {
    coachText = "Tap the button to echo the verse.";
    buttonLabel = "Echo the Verse";
  }

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-chunks learn-layout-coach-centered">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Listen for each chunk.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-chunk-stage-card ${getVerseFitClass(VERSE_TEXT)}">
        ${learnChunkStageHtml(learnParts, getChunkVisibleCount(learnParts))}
      </div>

      <div class="learn-coach learn-bottom-zone">
        <div>
          <div class="coach-text">${coachText}</div>
        </div>

        <div class="coach-actions">
          ${(
      State.chunkRunning ||
      State.instructionPlaying ||
      (State.chunkAutoStarting && !State.chunkAutoFallbackReady)
    )
      ? ``
      : `
                <button class="carousel-main no-zoom" id="btnChunks" style="max-width:520px;">
                  ${buttonLabel}
                </button>
              `
    }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnChunks");
  if (btn) {
    btn.onclick = async () => {
      if (State.chunkPassCount >= 2) {
        goToEchoAndStart();
        return;
      }

      await startChunkFlow();
    };
  }

  scheduleSmartLearnTextFit(inner);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenEcho(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";
  const learnParts = getLearnAudioParts();

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-echo learn-layout-coach-centered">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Echo each chunk after it turns yellow.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-echo-stage-card ${getVerseFitClass(VERSE_TEXT)}">
        ${learnEchoStageHtml(learnParts)}
      </div>

      <div class="learn-coach learn-bottom-zone">
        <div class="coach-actions">
          ${(
      State.echoRunning ||
      State.instructionPlaying ||
      (State.echoAutoStarting && !State.echoAutoFallbackReady)
    )
      ? ``
      : `
                <button class="carousel-main no-zoom" id="btnEcho" style="max-width:520px;">
                  ${State.echoDone ? (hideWordsPerRound() === 2 ? "Remove Words" : "Remove a Word") : "▶ Start Echo"}
                </button>
              `
    }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnEcho");
  if (btn) {
    btn.onclick = async () => {
      if (State.echoDone) {
        goToHideAndStartRound();
        return;
      }

      await startEchoFlow();
    };
  }

  scheduleSmartLearnTextFit(inner);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}


function screenHide(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const hiddenNow = Math.min(State.hideCount, planMixed.length);
  const done = hiddenNow >= planMixed.length;

  const removeLabel = hideWordsPerRound() === 2 ? "Remove Words" : "Remove a Word";
  const removeAnotherLabel = hideWordsPerRound() === 2 ? "Remove More Words" : "Remove Another";
  let buttonLabel = removeLabel;

  if (done) {
    buttonLabel = "Test Your Progress";
  } else if (hiddenNow > 0) {
    buttonLabel = removeAnotherLabel;
  }

  const hideBottomHtml = State.sayVerseActive
    ? `
      <div class="learn-progress-action-slot">
        <div class="learn-bottom-progress" aria-label="Time remaining">
          <div
            class="learn-bottom-progress-bar"
            id="sayVerseBar"
            style="width:${getSayVersePct() * 100}%"
          ></div>
        </div>
      </div>
    `
    : (
      State.instructionPlaying ||
      (State.hideAutoStarting && !State.hideAutoFallbackReady)
    )
      ? `
        <div class="learn-progress-action-slot" aria-hidden="true"></div>
      `
      : `
        <div class="learn-progress-action-slot">
          <button
            class="carousel-main no-zoom learn-bottom-action-btn learn-remove-action-btn"
            id="btnRemoveWord"
          >
            ${buttonLabel}
          </button>
        </div>
      `;

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-remove learn-layout-coach-centered">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Say the verse before more words disappear.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-stage-smart missing-words-theme learn-hide-poof-card ${State.hidePoofActive ? "is-poofing" : ""} ${getVerseFitClass(VERSE_TEXT)}">
        <div
          class="smart-learn-text smart-learn-text-remove"
          data-smart-learn-text
          data-smart-fit-text="${escapeHtml(VERSE_TEXT)}"
        >
          <div class="smart-learn-title">${escapeHtml(VERSE_REF)}</div>
          <div class="smart-learn-body" id="verseStage"></div>
        </div>

        <div class="learn-hide-poof-overlay" aria-hidden="true">
          <span class="learn-hide-poof-sparkle sparkle-one">✦</span>
          <span class="learn-hide-poof-sparkle sparkle-two">✦</span>
          <span class="learn-hide-poof-sparkle sparkle-three">✦</span>
        </div>
      </div>

      <div class="learn-coach learn-bottom-zone learn-progress-bottom-zone">
        ${hideBottomHtml}
      </div>
    </div>
  `;

  inner.querySelector("#verseStage").appendChild(verseNode());

  scheduleSmartLearnTextFit(inner);

  const btnRemove = inner.querySelector("#btnRemoveWord");
  if (btnRemove) {
    btnRemove.onclick = async () => {
      if (done) {
        startLearnInstruction("final");
        return;
      }

      await startHideRoundWithPoof();
    };
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenFinalRecall(idx) {
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  let finalBottomHtml = State.finalRecallAutoFallbackReady
    ? `
      <div class="learn-progress-action-slot">
        <button
          class="carousel-main no-zoom learn-bottom-action-btn"
          id="btnFinalStart"
        >
          Begin Test
        </button>
      </div>
    `
    : `<div class="learn-progress-action-slot" aria-hidden="true"></div>`;

  if (State.finalRecallActive) {
    finalBottomHtml = `
      <div class="learn-progress-action-slot">
        <div class="learn-bottom-progress" aria-label="Time remaining">
          <div
            class="learn-bottom-progress-bar"
            id="finalRecallBar"
            style="width:${getFinalRecallPct() * 100}%"
          ></div>
        </div>
      </div>
    `;
  } else if (State.finalRecallDone && !State.finalRecallRevealed) {
    finalBottomHtml = `
      <div class="learn-progress-action-slot">
        <button
          class="carousel-main no-zoom learn-bottom-action-btn"
          id="btnFinalReveal"
        >
          Reveal Verse
        </button>
      </div>
    `;
  } else if (State.finalRecallRevealed) {
    finalBottomHtml = `
      <div class="learn-progress-action-slot">
        <button
          class="carousel-main no-zoom learn-bottom-action-btn"
          id="btnFinalGames"
        >
          Practice time
        </button>
      </div>
    `;
  }

  inner.innerHTML = `
    <div class="learn-layout learn-screen learn-screen-final learn-layout-coach-centered final-recall-layout">
      <div class="learn-ref learn-instruction-line">
        ${learnInstructionLineHtml("Try the verse with only hints.")}
      </div>

      <div class="learn-verse learn-stage learn-stage-card learn-stage-smart missing-words-theme ${getVerseFitClass(VERSE_TEXT)}">
        <div
          class="smart-learn-text smart-learn-text-final"
          data-smart-learn-text
          data-smart-fit-text="${escapeHtml(VERSE_TEXT)}"
        >
          <div class="smart-learn-title">${escapeHtml(VERSE_REF)}</div>
          <div class="smart-learn-body" id="finalRecallStage"></div>
        </div>
      </div>

      <div class="learn-coach learn-bottom-zone learn-progress-bottom-zone">
        ${finalBottomHtml}
      </div>
    </div>
  `;

  inner
    .querySelector("#finalRecallStage")
    .appendChild(finalRecallNode(State.finalRecallRevealed));

  scheduleSmartLearnTextFit(inner);

  const btnFinalStart = inner.querySelector("#btnFinalStart");
  if (btnFinalStart) {
    btnFinalStart.onclick = () => {
      startFinalRecallFlow();
    };
  }

  const btnFinalReveal = inner.querySelector("#btnFinalReveal");
  if (btnFinalReveal) {
    btnFinalReveal.onclick = () => {
      State.finalRecallRevealed = true;
      render();
    };
  }

  const btnFinalGames = inner.querySelector("#btnFinalGames");
  if (btnFinalGames) {
    btnFinalGames.onclick = () => {
      startLearnInstruction("games");
    };
  }

  if (State.finalRecallActive) {
    const animate = () => {
      const pct = getFinalRecallPct();
      const currentBar = document.getElementById("finalRecallBar");

      if (currentBar) {
        currentBar.style.width = (pct * 100) + "%";
      }

      if (pct > 0 && State.finalRecallActive) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner });
}

function screenCelebration(idx) {

  const wrap = document.createElement("div");
  wrap.className = "celebration-screen";

  wrap.innerHTML = `
    <canvas id="fireworksCanvas"></canvas>

    <h2>Great job learning the verse!</h2>
    <div class="celebration-prompt">Practice the verse to unlock a new BibloPet! 🐾</div>

    <div class="celebration-actions">
      <button class="carousel-main no-zoom" id="btnCelebrateTitle">Title Screen</button>
      <button class="carousel-main no-zoom" id="btnCelebrateGames">Practice</button>
    </div>
  `;

  const canvas = wrap.querySelector("#fireworksCanvas");
  setTimeout(() => {
    if (State.screen === Screen.CELEBRATION) {
      startFireworks(canvas);
    }
  }, 0);

  wrap.querySelector("#btnCelebrateTitle").onclick = () => {
    stopFireworks();
    go(Screen.TITLE);
  };

  wrap.querySelector("#btnCelebrateGames").onclick = () => {
    stopFireworks();
    go(Screen.PRACTICE_HUB);
  };

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPracticeGate(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen learn-level-screen";

  wrap.innerHTML = `
    ${homePillHtml()}
    <div class="title-content learn-level-content practice-gate-content">
      <div class="practice-gate-stack">
        <img
          class="practice-gate-image"
          src="${IMG_DIR}verse_wait_hand.png"
          alt="Yellow hand"
        />

        <div class="practice-gate-title">WAIT!</div>

        <div class="practice-gate-text">
          You need to know the verse a bit to play these games.
        </div>

        <button class="carousel-main no-zoom" id="btnPracticeGate" style="max-width:520px;">
          Next
        </button>
      </div>
    </div>
  `;

  const btn = wrap.querySelector("#btnPracticeGate");
  if (btn) {
    btn.onclick = () => {
      resetLearn(false);
      go(Screen.LEARN_LEVEL);
    };
  }

  bindHomePill(wrap);

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPracticeHub(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen practice-screen";

  const cardsHtml = `
    ${renderPracticeHubCard({
    id: "games",
    title: "Games",
    icon: "🎮",
    cardColor: "#7f66c6",
    cardTextColor: "#ffffff"
  })}

    ${renderPracticeHubCard({
    id: "playground",
    title: "Playground",
    icon: "🛝",
    cardColor: "#a7cb6f",
    cardTextColor: "#ffffff"
  })}
  `;

  const headerHtml = practiceHubHeaderHtml();

  wrap.innerHTML = `
    <div class="title-content practice-content">
      <div class="practice-title-row">
        ${homePillHtml()}
        ${headerHtml}
        <div class="practice-title-spacer" aria-hidden="true"></div>
      </div>

      <div class="practice-scroll-wrap">
        <div class="practice-card-list">
          ${cardsHtml}
        </div>
      </div>
    </div>

    <div class="practice-scroll-vignette" aria-hidden="true"></div>
  `;

  bindHomePill(wrap);

  wrap.querySelectorAll("[data-practice-hub-choice]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      const choice = btn.dataset.practiceHubChoice;

      if (choice === "games") {
        go(Screen.PRACTICE);
        return;
      }

      if (choice === "playground") {
        go(Screen.PLAYGROUND);
      }
    };
  });

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPractice(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen practice-screen";

  const practiceGames = getPracticeGames();
  const verseProgress = getVerseProgress(VERSE_ID);

  const cardsHtml = practiceGames.length
    ? `
      ${renderGameMixCard()}

      <div class="practice-pick-heading">
        Pick a Game
      </div>

      ${practiceGames.map(game => renderPracticeGameCard(game, verseProgress)).join("")}
    `
    : `
      <div class="practice-empty-card">
        <div class="practice-empty-title">No Practice Games</div>
        <div class="practice-empty-text">No games are available right now.</div>
      </div>
    `;

  wrap.innerHTML = `
    <div class="title-content practice-content">
      <div class="practice-title-row">
        ${practiceBackPillHtml()}
        <h2 id="practiceTitle">Practice Games</h2>
        <div class="practice-title-spacer" aria-hidden="true"></div>
      </div>

      <div class="practice-scroll-wrap">
        <div class="practice-card-list">
          ${cardsHtml}
        </div>
      </div>
    </div>

    <div class="practice-scroll-vignette" aria-hidden="true"></div>
  `;

  bindPracticeBackPill(wrap);

  const gameMixBtn = wrap.querySelector("[data-practice-game-mix]");
  if (gameMixBtn) {
    gameMixBtn.onclick = (e) => {
      e.stopPropagation();
      startGameMix();
    };
  }

  wrap.querySelectorAll("[data-practice-game-id]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      const gameId = btn.dataset.practiceGameId;
      const game = practiceGames.find(g => g.id === gameId);

      if (!game) return;

      State.practiceIndex = Math.max(0, practiceGames.findIndex(g => g.id === gameId));

      if (game.source === "external") {
        launchExternalGame(game.manifest);
        return;
      }

      console.warn("Practice game is not external and cannot be launched:", game);
    };
  });

  const practiceTitle = wrap.querySelector("#practiceTitle");
  if (practiceTitle) {
    bindLongPress(practiceTitle, {
      delay: HIDDEN_PRACTICE_LONG_PRESS_MS,
      onLongPress: () => launchHiddenPracticeGame()
    });
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPlayground(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen practice-screen";

  const activities = getPlaygroundActivities();

  const cardsHtml = activities.length
    ? `
      <div class="practice-pick-heading">
        Pick an Activity
      </div>

      ${activities.map(activity => renderPlaygroundActivityCard(activity)).join("")}
    `
    : `
      <div class="practice-empty-card">
        <div class="practice-empty-title">No Playground Activities</div>
        <div class="practice-empty-text">No activities are available right now.</div>
      </div>
    `;

  wrap.innerHTML = `
    <div class="title-content practice-content">
      <div class="practice-title-row">
        ${practiceBackPillHtml()}
        <h2 id="playgroundTitle">Playground</h2>
        <div class="practice-title-spacer" aria-hidden="true"></div>
      </div>

      <div class="practice-scroll-wrap">
        <div class="practice-card-list">
          ${cardsHtml}
        </div>
      </div>
    </div>

    <div class="practice-scroll-vignette" aria-hidden="true"></div>
  `;

  bindPracticeBackPill(wrap);

  wrap.querySelectorAll("[data-playground-activity-id]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      const activityId = btn.dataset.playgroundActivityId;
      const activity = activities.find(item => item.id === activityId);

      if (!activity) return;

      if (activity.source === "external") {
        launchExternalPlaygroundActivity(activity.manifest);
        return;
      }

      console.warn("Playground activity is not external and cannot be launched:", activity);
    };
  });

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenGameMixFinished(idx) {
  const wrap = document.createElement("div");
  wrap.className = "title-screen game-mix-finished-screen";

  wrap.innerHTML = `
    <div class="game-mix-finished-card">
      <div class="game-mix-finished-emoji" aria-hidden="true">🎉</div>
      <div class="game-mix-finished-title">Mix Finished!</div>
      <div class="game-mix-finished-text">You completed every game.</div>

      <div class="game-mix-finished-actions">
        <button class="carousel-main no-zoom" id="btnPlayAnotherMix" type="button">
          Play Another Mix
        </button>

        <button class="carousel-main no-zoom" id="btnEndMix" type="button">
          End Mix
        </button>
      </div>
    </div>
  `;

  const playAnotherBtn = wrap.querySelector("#btnPlayAnotherMix");
  if (playAnotherBtn) {
    playAnotherBtn.onclick = () => {
      startGameMix();
    };
  }

  const endBtn = wrap.querySelector("#btnEndMix");
  if (endBtn) {
    endBtn.onclick = () => {
      clearGameMixState();
      go(Screen.TITLE);
    };
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

/* =========================
   7. Main Render
   ========================= */
function render() {
  let savedDetailScrollTop = 0;

  if (State.screen === Screen.VERSE_DETAIL) {
    const existingDetailScroll = document.querySelector(".detail-scroll");
    if (existingDetailScroll) {
      savedDetailScrollTop = existingDetailScroll.scrollTop;
    }
  }

  app.innerHTML = "";

  const currentIdx = screenToIndex(State.screen);

  let indicesToRender;
  if (State.isSliding) {
    indicesToRender = [State.transitionFromIdx, State.transitionToIdx];
  } else {
    indicesToRender = [currentIdx];
  }

  const uniq = Array.from(new Set(indicesToRender.filter(i => i !== null && i >= 0)));
  for (const idx of uniq) {
    const screen = ["intro", "title_sequence", "title", "todo", "todo_dev", "progress", "pet_stats", "verse_detail", "learn_level", "practice_gate", "learn_instruction", "listen", "meaning", "chunks", "echo", "hide", "final_recall", "celebration", "pet_unlock", "practice_hub", "practice", "playground", "game_mix_finished"][idx];
    let slide = null;
    if (screen === Screen.INTRO) slide = screenIntro(idx);
    if (screen === Screen.TITLE_SEQUENCE) slide = screenTitleSequence(idx);
    if (screen === Screen.TITLE) slide = screenTitle(idx);
    if (screen === Screen.TODO) slide = screenTodo(idx);
    if (screen === Screen.TODO_DEV) slide = screenTodoDev(idx);
    if (screen === Screen.PROGRESS) slide = screenProgress(idx);
    if (screen === Screen.PET_STATS) slide = screenPetStats(idx);
    if (screen === Screen.VERSE_DETAIL) slide = screenVerseDetail(idx);
    if (screen === Screen.LEARN_LEVEL) slide = screenLearnLevel(idx);
    if (screen === Screen.PRACTICE_GATE) slide = screenPracticeGate(idx);
    if (screen === Screen.LEARN_INSTRUCTION) slide = screenLearnInstruction(idx);
    if (screen === Screen.LISTEN) slide = screenListen(idx);
    if (screen === Screen.MEANING) slide = screenMeaning(idx);
    if (screen === Screen.CHUNKS) slide = screenChunks(idx);
    if (screen === Screen.ECHO) slide = screenEcho(idx);
    if (screen === Screen.HIDE) slide = screenHide(idx);
    if (screen === Screen.FINAL_RECALL) slide = screenFinalRecall(idx);
    if (screen === Screen.CELEBRATION) slide = screenCelebration(idx);
    if (screen === Screen.PET_UNLOCK) slide = screenPetUnlock(idx);
    if (screen === Screen.PRACTICE_HUB) slide = screenPracticeHub(idx);
    if (screen === Screen.PRACTICE) slide = screenPractice(idx);
    if (screen === Screen.PLAYGROUND) slide = screenPlayground(idx);
    if (screen === Screen.GAME_MIX_FINISHED) slide = screenGameMixFinished(idx);
    if (slide) app.appendChild(slide);
  }

  if (!State.isSliding) {
    State.slideX = currentIdx;
  }
  updateSlideTransforms();

  renderNav();

  if (State.screen === Screen.VERSE_DETAIL && savedDetailScrollTop > 0) {
    requestAnimationFrame(() => {
      const newDetailScroll = document.querySelector(".detail-scroll");
      if (newDetailScroll) {
        newDetailScroll.scrollTop = savedDetailScrollTop;
      }
    });
  }
}

/* =========================
   8. App Bootstrap
   ========================= */

(async function init() {
  preloadLearnInstructionImages();
  loadPetNameBlocklist();

  await loadVerseList();
  HAS_VERSE_SELECTION = hasVerseIdInUrl();

  try {
    const requestedVerseId = getRequestedVerseIdFromUrl();

    if (requestedVerseId) {
      await loadVerse(requestedVerseId);
    }
  } catch (e) {
    console.error(e);
    showDialog({
      title: "Verse JSON not found",
      body: String(e.message || e),
      actions: [dlgBtn("OK", { onClick: closeDialog })]
    });
  }

  const params = new URLSearchParams(window.location.search);
  const requestedScreen = params.get("screen");
  const petUnlockVerseId = params.get("petUnlock");

  if (params.get("mixNext") === "1" && HAS_VERSE_SELECTION) {
    const handled = handleGameMixNextFromUrl(params);
    applyMute();
    if (handled) return;
  }

  if (petUnlockVerseId) {
    State.pendingPetUnlockVerseId = petUnlockVerseId;
    State.selectedVerseId = petUnlockVerseId;
    setScreen(Screen.PET_UNLOCK);
  } else if (requestedScreen === "practice_hub" && HAS_VERSE_SELECTION) {
    setScreen(Screen.PRACTICE_HUB);
  } else if (requestedScreen === "practice" && HAS_VERSE_SELECTION) {
    setScreen(Screen.PRACTICE);
  } else if (requestedScreen === "playground" && HAS_VERSE_SELECTION) {
    setScreen(Screen.PLAYGROUND);
  } else if (requestedScreen === "progress" && HAS_VERSE_SELECTION) {
    setScreen(Screen.PROGRESS);
  } else if (requestedScreen === "todo") {
    setScreen(Screen.TODO);
  } else if (requestedScreen === "todo_dev") {
    setScreen(Screen.TODO_DEV);
  } else if (requestedScreen === "title") {
    setScreen(Screen.TITLE);
  } else {
    setScreen(Screen.INTRO);
  }

  applyMute();
})();
