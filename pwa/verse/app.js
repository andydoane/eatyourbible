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
const DATA_DIR  = "verse_data/";
const IMG_DIR   = "verse_images/";

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
const TITLE_LOGO = IMG_DIR + "memory_verse_title.png";

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

const SVG_TOWER_CLOUD = `
<svg class="tower-cloud-svg" viewBox="0 0 211.66667 111.65417" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="m 123.03978,3.2651746 c -20.6927,0.0302 -38.78982,13.9439004 -44.136843,33.9338504 -4.33607,-1.49815 -8.891178,-2.26447 -13.478764,-2.26756 -19.705594,0.003 -36.672558,13.9079 -40.546363,33.22898 -10.729505,0.47348 -19.2324185,9.24147 -19.2324185,20.09179 0,11.15585 8.9814225,20.136755 20.1372725,20.136755 H 172.26572 c 18.70063,0 33.75556,-15.054925 33.75556,-33.755555 0,-18.70063 -15.05493,-33.75557 -33.75556,-33.75557 h -4.21163 C 164.1158,19.106435 145.16455,3.2713046 123.03978,3.2651746 Z"/>
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

function showDialog({title="Notice", body="", actions=[]}){
  dlgTitle.textContent = title;
  dlgBody.textContent = body;
  dlgActions.innerHTML = "";
  for (const a of actions) dlgActions.appendChild(a);
  overlay.classList.add("show");
}
function closeDialog(){ overlay.classList.remove("show"); }
overlay.addEventListener("click", (e)=>{ if (e.target === overlay) closeDialog(); });

function dlgBtn(label, {secondary=false, onClick}={}){
  const b = document.createElement("button");
  b.className = "dlg-btn" + (secondary ? " secondary" : "");
  b.type = "button";
  b.textContent = label;
  b.onclick = onClick || (()=>{});
  return b;
}

window.addEventListener("keydown", (e) => {
  if (String(e.key).toLowerCase() !== "d") return;

  State.debugBounce = !State.debugBounce;

  if (State.screen === Screen.GAME && (State.activeGame === "bouncing" || State.activeGame === "scramble")){
    render();
  }
});

function getVerseIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return params.get("v") || "john_3_16";
}

function hasVerseIdInUrl(){
  const params = new URLSearchParams(window.location.search);
  return !!params.get("v");
}

function getRequestedVerseIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return params.get("v") || "";
}

/* Audio */
const audioEl = new Audio();
audioEl.preload = "auto";

let muted = false;
function applyMute(){
  audioEl.muted = muted;
}
function toggleMute(){
  muted = !muted;
  applyMute();
  // stop current audio immediately
  try { audioEl.pause(); } catch(e){}
  try { audioEl.currentTime = 0; } catch(e){}
  renderNav(); // update icon
}

function safePlay() {
  applyMute();
  return audioEl.play().catch((err) => {
    showDialog({
      title: "Audio can’t play yet",
      body: "Your browser blocked playback. Tap play again (or make sure the mp3 exists).",
      actions: [dlgBtn("OK", {onClick: closeDialog})]
    });
    throw err;
  });
}

function setAudioSrc(src){
  audioEl.src = src;
  try { audioEl.load(); } catch(e){}
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

function createEmptyProgress(){
  return {
    version: PROGRESS_VERSION,
    verses: {}
  };
}

function loadProgress(){
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createEmptyProgress();
    if (!parsed.verses || typeof parsed.verses !== "object") parsed.verses = {};
    if (!parsed.version) parsed.version = PROGRESS_VERSION;

    return parsed;
  } catch (err) {
    console.warn("Could not load progress from localStorage", err);
    return createEmptyProgress();
  }
}

function saveProgress(progress){
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn("Could not save progress to localStorage", err);
  }
}

function getVerseProgress(verseId){
  const progress = loadProgress();
  const verseProgress = progress.verses[verseId];

  if (verseProgress) return verseProgress;

  return {
    learnCompleted: false,
    games: {}
  };
}

function updateVerseProgress(verseId, updater){
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

function markLearnCompleted(verseId){
  updateVerseProgress(verseId, (verseProgress) => {
    verseProgress.learnCompleted = true;
    verseProgress.lastPracticedAt = Date.now(); // 👈 ADD THIS
  });
}

function markStandardGameCompleted(verseId, gameId, mode){
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
      if (State.screen === Screen.GAME) {
        go(Screen.PET_UNLOCK);
      }
    }, 300);
  }
}

function markTrafficCompleted(verseId, theme){
  if (!verseId || !theme) return;

  const progress = loadProgress();

  if (!progress.verses[verseId]) {
    progress.verses[verseId] = {
      learnCompleted: false,
      games: {}
    };
  }

  const verseProgress = progress.verses[verseId];
  const wasUnlocked = isBibloPetUnlocked(verseProgress);

  if (!verseProgress.games.traffic) {
    verseProgress.games.traffic = {
      roadCompleted: false,
      trailCompleted: false,
      riverCompleted: false
    };
  }

  if (theme === "road") {
    verseProgress.games.traffic.roadCompleted = true;
  }

  if (theme === "trail") {
    verseProgress.games.traffic.trailCompleted = true;
  }

  if (theme === "river") {
    verseProgress.games.traffic.riverCompleted = true;
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
      if (State.screen === Screen.GAME) {
        go(Screen.PET_UNLOCK);
      }
    }, 300);
  }
}

/* =========================
   Progress Star Helpers
   ========================= */

// All tracked games (internal IDs)
const GAME_IDS = [
  "scramble",
  "chain",     // Verse Launch
  "traffic",
  "bouncing",
  "foodslice",
  "tower"
];

// Count stars for a single game
function getGameStars(gameId, gameProgress){
  if (!gameProgress) return 0;

  // Special case: Traffic Tap uses themes
  if (gameId === "traffic"){
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
function getVerseStars(verseProgress){
  if (!verseProgress || !verseProgress.games) return 0;

  let totalStars = 0;
  let maxStars = GAME_IDS.length * 3;

  for (const gameId of GAME_IDS){
    const gameProgress = verseProgress.games[gameId];
    totalStars += getGameStars(gameId, gameProgress);
  }

  const avg = totalStars / maxStars; // 0 → 1
  return Math.round(avg * 3);        // scale to 0 → 3
}

// Convert number → display string
function starsToString(stars){
  if (stars === 3) return "⭐⭐⭐";
  if (stars === 2) return "⭐⭐☆";
  if (stars === 1) return "⭐☆☆";
  return "☆☆☆";
}

function getStandardGameMedals(gameProgress){
  return [
    gameProgress?.easyCompleted ? "🥉" : "🔒",
    gameProgress?.mediumCompleted ? "🥈" : "🔒",
    gameProgress?.hardCompleted ? "🥇" : "🔒"
  ].join(" ");
}

function getTrafficThemeSlots(gameProgress){
  return [
    gameProgress?.roadCompleted ? "🚗" : "🔒",
    gameProgress?.trailCompleted ? "🐾" : "🔒",
    gameProgress?.riverCompleted ? "🌊" : "🔒"
  ].join(" ");
}

function getVerseDetailProgressDisplay(gameId, gameProgress){
  if (gameId === "traffic"){
    return getTrafficThemeSlots(gameProgress);
  }

  return getStandardGameMedals(gameProgress);
}

function getStandardModeMedal(mode){
  if (mode === "easy") return "🥉";
  if (mode === "medium") return "🥈";
  if (mode === "hard") return "🥇";
  return "🏅";
}

function getStandardModeLabel(mode){
  if (mode === "easy") return "Easy";
  if (mode === "medium") return "Medium";
  if (mode === "hard") return "Hard";
  return "Game";
}

function wasStandardModeAlreadyCompleted(verseId, gameId, mode){
  if (!verseId || !gameId || !mode) return false;

  const verseProgress = getVerseProgress(verseId);
  const gameProgress = verseProgress.games?.[gameId];

  if (!gameProgress) return false;

  if (mode === "easy") return !!gameProgress.easyCompleted;
  if (mode === "medium") return !!gameProgress.mediumCompleted;
  if (mode === "hard") return !!gameProgress.hardCompleted;

  return false;
}

function getStandardGameRewardTitle(verseId, gameId, mode){
  const medal = getStandardModeMedal(mode);
  const label = getStandardModeLabel(mode);
  const alreadyEarned = wasStandardModeAlreadyCompleted(verseId, gameId, mode);

  if (alreadyEarned){
    return `You finished ${label} again!`;
  }

  return `You earned a ${medal}!`;
}

function getTrafficThemeLabel(theme){
  if (theme === "road") return "Road";
  if (theme === "trail") return "Trail";
  if (theme === "river") return "River";
  return "Theme";
}

function getTrafficThemeEmoji(theme){
  if (theme === "road") return "🚗";
  if (theme === "trail") return "🐾";
  if (theme === "river") return "🌊";
  return "🏁";
}

function wasTrafficThemeAlreadyCompleted(verseId, theme){
  if (!verseId || !theme) return false;

  const verseProgress = getVerseProgress(verseId);
  const trafficProgress = verseProgress.games?.traffic;

  if (!trafficProgress) return false;

  if (theme === "road") return !!trafficProgress.roadCompleted;
  if (theme === "trail") return !!trafficProgress.trailCompleted;
  if (theme === "river") return !!trafficProgress.riverCompleted;

  return false;
}

function getTrafficRewardTitle(verseId, theme){
  const emoji = getTrafficThemeEmoji(theme);
  const label = getTrafficThemeLabel(theme);
  const alreadyEarned = wasTrafficThemeAlreadyCompleted(verseId, theme);

  if (alreadyEarned){
    return `You finished ${label} again!`;
  }

  return `You unlocked ${emoji} ${label}!`;
}

/* =========================
   BibloPet Helpers
   ========================= */

function isBibloPetUnlocked(verseProgress){
  if (!verseProgress) return false;
  return !!verseProgress.learnCompleted && getVerseStars(verseProgress) > 0;
}

function getVerseListItemById(verseId){
  return VERSE_LIST.find(item => item.id === verseId) || null;
}

function getBibloPetEmojiForListItem(item){
  return item?.biblopet || "🐾";
}

function getBibloPetEmojiForCurrentVerse(){
  return cfg?.biblopet || "🐾";
}

function getBibloPetEmojiForVerseId(verseId){
  const item = getVerseListItemById(verseId);
  if (item?.biblopet) return item.biblopet;

  if (cfg?.verseId === verseId && cfg?.biblopet) return cfg.biblopet;

  return "🐾";
}

function getBibloPetStatusEmoji(verseProgress){
  const status = getBibloPetStatus(verseProgress);

  if (status === "happy") return "😀";
  if (status === "hungry") return "🤤";
  if (status === "sleeping") return "😴";

  return "";
}

function getBibloPetStatusText(verseProgress){
  const status = getBibloPetStatus(verseProgress);

  if (status === "locked"){
    return "Practice more to unlock your BibloPet.";
  }

  if (status === "happy"){
    return "Your BibloPet is happy!";
  }

  if (status === "hungry"){
    return "Your BibloPet is getting hungry. Practice this verse to feed it!";
  }

  if (status === "sleeping"){
    return "Your BibloPet is asleep. Practice to wake it up.";
  }

  return "";
}

function getBibloPetStatus(verseProgress){
  if (!isBibloPetUnlocked(verseProgress)) return "locked";

  const last = verseProgress.lastPracticedAt;
    if (!last){
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

function getBibloPetStats(){
  const stats = {
    totalVerses: Array.isArray(VERSE_LIST) ? VERSE_LIST.length : 0,
    unlocked: 0,
    happy: 0,
    hungry: 0,
    sleeping: 0
  };

  if (!Array.isArray(VERSE_LIST)) return stats;

  for (const item of VERSE_LIST){
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

function isVerseMastered(verseProgress){
  if (!verseProgress || !verseProgress.games) return false;

  for (const gameId of GAME_IDS){
    const gp = verseProgress.games[gameId];

    if (gameId === "traffic"){
      if (!gp?.roadCompleted || !gp?.trailCompleted || !gp?.riverCompleted){
        return false;
      }
    } else {
      if (!gp?.easyCompleted || !gp?.mediumCompleted || !gp?.hardCompleted){
        return false;
      }
    }
  }

  return true;
}

function getVerseBackgroundIndex(verseId){
  const verseProgress = getVerseProgress(verseId);
  return Number.isInteger(verseProgress.bgIndex) ? verseProgress.bgIndex : 0;
}

function setVerseBackgroundIndex(verseId, index){
  updateVerseProgress(verseId, (verseProgress) => {
    verseProgress.bgIndex = index;
  });
}

function cycleVerseBackground(verseId){
  const current = getVerseBackgroundIndex(verseId);
  const TOTAL_BACKGROUNDS = 24;
  const next = (current + 1) % TOTAL_BACKGROUNDS;
  setVerseBackgroundIndex(verseId, next);
}

function getVerseBackgroundClass(verseId, verseProgress){
  if (!isVerseMastered(verseProgress)) return "";

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

function getRandomHungryFoodPair(){
  if (HUNGRY_FOOD_POOL.length < 2){
    return { left: "🍎", right: "🍞" };
  }

  const leftIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);
  let rightIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);

  while (rightIndex === leftIndex){
    rightIndex = Math.floor(Math.random() * HUNGRY_FOOD_POOL.length);
  }

  return {
    left: HUNGRY_FOOD_POOL[leftIndex],
    right: HUNGRY_FOOD_POOL[rightIndex]
  };
}

function clearHungryFoodCycle(){
  if (hungryFoodTimer){
    clearInterval(hungryFoodTimer);
    hungryFoodTimer = null;
  }
}

function updateHungryFoodTargets(rootEl){
  const leftEl = rootEl?.querySelector(".pet-hungry-food-target.left");
  const rightEl = rootEl?.querySelector(".pet-hungry-food-target.right");
  if (!leftEl || !rightEl) return;

  const pair = getRandomHungryFoodPair();
  leftEl.textContent = pair.left;
  rightEl.textContent = pair.right;
}

function startHungryFoodCycle(rootEl, petStatus){
  clearHungryFoodCycle();

  if (petStatus !== "hungry") return;

  updateHungryFoodTargets(rootEl);

  hungryFoodTimer = setInterval(() => {
    if (!rootEl || !rootEl.isConnected){
      clearHungryFoodCycle();
      return;
    }

    updateHungryFoodTargets(rootEl);
  }, 6000);
}

function applyPetMotionVars(rootEl){
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

function getRandomHappyPetAnimationClass(){
  const options = [
    "pet-happy-pace",
    "pet-happy-flip"
  ];

  return options[Math.floor(Math.random() * options.length)];
}

function getBibloPetAnimationClass(verseId, verseProgress){
  const status = getBibloPetStatus(verseProgress);

  if (status === "locked") return "";

  // Sleeping = fixed
  if (status === "sleeping"){
    return "pet-sleeping";
  }

  // Hungry = pacing with disappearing food targets
  if (status === "hungry"){
    return "pet-hungry-pace";
  }

  // Happy = controlled system
  if (status === "happy"){
    if (State.petAnimPhase === "action"){
      return State.petAnimActionClass;
    }

    return "pet-happy-idle";
  }

  return "";
}

function startPetAnimationCycle(verseId, verseProgress){
  const status = getBibloPetStatus(verseProgress);

  if (status !== "happy"){
    clearPetAnimationCycle();
    State.petAnimPhase = "idle";
    State.petAnimActionClass = "";
    return;
  }

  if (State.petAnimTimer) return;

  function scheduleIdle(){
    State.petAnimPhase = "idle";
    State.petAnimActionClass = "";
    render();

    const idleTime = 2000 + Math.random() * 4000;

    State.petAnimTimer = setTimeout(() => {
      State.petAnimTimer = null;
      scheduleAction();
    }, idleTime);
  }

  function scheduleAction(){
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

function clearPetAnimationCycle(){
  if (State.petAnimTimer){
    clearTimeout(State.petAnimTimer);
    State.petAnimTimer = null;
  }

  State.petAnimPhase = "idle";
  State.petAnimActionClass = "";
}

async function playVerseDetailListen(){
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
const TokenType = { SPACE:"space", WORD:"word", PUNCT:"punct", OTHER:"other" };
function tokenize(text){
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
function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function resolveHidePlanToTokenIndices(tokens, plan){
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
function reshuffleHidePlan(){
  planMixed = shuffleArray([...planResolved]);
}

function verseIdToRef(verseId, translation){
  const parts = String(verseId || "").split("_").filter(Boolean);

  let nums = [];
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])){
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

function getTitleSubtitle(){
  if (!HAS_VERSE_SELECTION){
    return "Choose a verse to begin";
  }
  return VERSE_REF;
}

function getVerseFitClass(text){
  const raw = String(text || "").trim();

  if (!raw) return "verse-fit-medium";

  const compact = raw.replace(/\s+/g, " ").trim();
  const len = compact.length;

  if (len <= 38) return "verse-fit-short";
  if (len <= 90) return "verse-fit-medium";
  return "verse-fit-long";
}

/* =========================
   4. Verse Loading
   ========================= */
async function loadVerse(verseId){
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

async function loadVerseList(){
  try {
    const res = await fetch(`${DATA_DIR}verse_list.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    VERSE_LIST = Array.isArray(json) ? json.slice() : [];

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
  TITLE: "title",
  PROGRESS: "progress",
  VERSE_DETAIL: "verse_detail",
  LEARN_LEVEL: "learn_level",
  PRACTICE_GATE: "practice_gate",
  LISTEN: "listen",
  MEANING: "meaning",
  CHUNKS: "chunks",
  ECHO: "echo",
  HIDE: "hide",
  FINAL_RECALL: "final_recall",
  CELEBRATION: "celebration",
  PET_UNLOCK: "pet_unlock",
  PET_STATS: "pet_stats",
  PRACTICE: "practice",
  GAME: "game"
};

/* =========================
   1. Global State
   ========================= */
const State = {
  screen: Screen.INTRO,
  slideX: 0,                // numeric index used for transforms
  isSliding: false,
  transitionFromIdx: null,
  transitionToIdx: null,

  activeGame: null,
  gameRunning: false,
  gameIntroActive: false,
  chainGame: null,
  scrambleGame: null,
  bouncingGame: null,
  trafficGame: null,
  towerGame: null,
  foodSliceGame: null,
  debugBounce: false,

  // Learn progression
  hasLearnedVerse: false,
  audioMode: null,
  instructionPlaying: false,
  instructionKey: "",
  listenInstructionDone: false,
  meaningInstructionDone: false,
  chunksIntroDone: false,
  chunksReplayPromptDone: false,
  echoIntroPromptDone: false,
  removeIntroPromptDone: false,
  finalIntroPromptDone: false,
  selectedVerseId: null,
  pendingPetUnlockVerseId: null,
  petAnimationVerseId: null,
  petAnimationStatus: "",
  petAnimationClass: "",
  petAnimTimer: null,
  petAnimPhase: "idle", // "idle" | "action"
  petAnimActionClass: "",
  petAnimActionDuration: 0,

  listenDone: false,
  listenPlaying: false,

  chunkDone: false,
  chunkRunning: false,
  chunkAutoStarting: false,
  chunkIndex: 0,
  chunkPassCount: 0,

  echoDone: false,
  echoRunning: false,
  echoAutoStarting: false,
  echoNeedsSecondPass: false,
  echoIndex: 0,
  echoSpeaking: false,
  hideCount: 0,
  revealedTokenIdx: new Set(),
  sayVerseActive: false,
  sayVerseStartedAt: 0,
  sayVerseDurationMs: 0,
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
  { id: "practice", label: "Practice Games", action: () => {
      if (State.hasLearnedVerse) go(Screen.PRACTICE);
      else go(Screen.PRACTICE_GATE);
    }
  },
  { id: "progress", label: "Progress", action: () => go(Screen.PROGRESS) },
];

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

const PRACTICE_GAMES = [
  { title:"🧩 Verse Scramble", desc:"Pick the correct word blob." },
  { title:"🚀 Verse Launch", desc:"Launch words into the verse." },
  { title:"🚗 Traffic Tap", desc:"Tap moving cards and animals." },
  { title:"🏀 Bouncing Words", desc:"Tap moving verse words." },
  { title:"🍉 Food Slice", desc:"Tap the flying food." },
  { title:"🏰 Tower of Bible", desc:"Build a sky-high tower one word at a time." },
];

/* =========================================================
   6. Shared Game Helpers (Used Across Multiple Games)

   These functions are intentionally kept in app.js because
   they are shared between multiple games (Scramble, Chain,
   Bouncing, Traffic, Tower, etc).

   If you remove or move these, multiple games may break.

   Includes:
   - Random helpers
   - Verse metadata parsing
   - Choice/decoy generators
   - Token helpers
   ========================================================= */

const VERSE_CHAIN_DECOY_WORDS = [
  "apple","banana","rocket","castle","dragon","puppy","kitten","turtle","panda","eagle",
  "river","ocean","mountain","forest","garden","rainbow","thunder","snowflake","sunshine","comet",
  "teacher","student","friend","family","hero","helper","leader","builder","artist","explorer",
  "jump","run","walk","laugh","smile","share","listen","learn","play","build",
  "brave","kind","strong","gentle","happy","thankful","careful","honest","curious","patient",
  "bright","quiet","loud","soft","quick","slow","wild","safe","fresh","new",
  "circle","square","triangle","ladder","bridge","pencil","paper","backpack","window","door",
  "soccer","baseball","puzzle","cookie","popcorn","pizza","sandwich","cereal","honey","water",
  "planet","star","moon","cloud","storm","breeze","shadow","flame","spark","stone",
  "music","drum","guitar","violin","dance","story","comic","movie","camera","ticket",
  "train","bus","bicycle","helmet","scooter","airplane","map","compass","lantern",
  "gold","silver","crystal","treasure","coin","badge","trophy","medal","ribbon","crown"
];

const BIBLE_BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings",
  "1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms",
  "Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
  "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum",
  "Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
  "1 John","2 John","3 John","Jude","Revelation"
];

// Pick random unique items from a list (used for decoys)
function chainPickRandomItems(arr, count, exclude = []){
  const excluded = new Set(exclude.map(x => String(x).toLowerCase()));
  const pool = arr.filter(x => !excluded.has(String(x).toLowerCase()));
  shuffleArray(pool);
  return pool.slice(0, count);
}

// Extract book, chapter, verse from verseId (e.g. "john_3_16")
function chainVerseMetaFromId(verseId){
  const parts = String(verseId || "").split("_").filter(Boolean);

  let nums = [];
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])){
    nums.unshift(parts.pop());
  }

  const bookSlug = parts.join(" ");
  const book = bookSlug.replace(/\b\w/g, c => c.toUpperCase());

  const chapter = Number(nums[0] || 1);
  const verse = Number(nums[1] || 1);
  const verseEnd = nums[2] ? Number(nums[2]) : null;

  return { book, chapter, verse, verseEnd };
}

// Generate multiple-choice options for Bible book
function chainMakeBookChoices(correctBook){
  const choices = [
    correctBook,
    ...chainPickRandomItems(BIBLE_BOOKS, 3, [correctBook])
  ];
  return shuffleArray(choices);
}

// Generate multiple-choice options for chapter:verse reference
function chainMakeReferenceChoices(correctChapter, correctVerse){
  const correctRef = `${correctChapter}:${correctVerse}`;
  const refs = new Set([correctRef]);

  let tries = 0;
  while (refs.size < 4 && tries < 200){
    const chapterBump = Math.floor(Math.random() * 11) - 5;
    const verseBump = Math.floor(Math.random() * 21) - 10;

    let fakeChapter = correctChapter + chapterBump;
    let fakeVerse = correctVerse + verseBump;

    if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 5);
    if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 10);

    refs.add(`${fakeChapter}:${fakeVerse}`);
    tries += 1;
  }

  return shuffleArray(Array.from(refs));
}

// Pick a random index for which choice is highlighted/selected
function chainSetRandomChoiceIndex(){
  const st = State.chainGame;
  if (!st || !st.choices.length){
    if (st) st.choiceIndex = 0;
    return;
  }
  st.choiceIndex = Math.floor(Math.random() * st.choices.length);
}

// Get indices of all word tokens in the verse (used by many games)
function scrambleWordTokenIndices(){
  const out = [];
  for (let i = 0; i < tokens.length; i++){
    if (tokens[i].type === TokenType.WORD){
      out.push(i);
    }
  }
  return out;
}

/* NOTE:
   The following helpers are used by multiple games:

   - Verse Scramble
   - Verse Chain
   - Bouncing Words
   - Traffic Tap
   - Tower of Bible

   They are NOT tied to one game, so they stay here instead
   of being moved into games.js.
*/







function resetLearn(goTitle=false){
  const keepLearnLevel = State.learnLevel;
  const keepLearnStartScreen = State.learnStartScreen;

  State.audioMode = null;
  State.instructionPlaying = false;
  State.instructionKey = "";
  State.listenInstructionDone = false;
  State.meaningInstructionDone = false;
  State.chunksIntroDone = false;
  State.chunksReplayPromptDone = false;
  State.echoIntroPromptDone = false;
  State.removeIntroPromptDone = false;
  State.finalIntroPromptDone = false;

  State.listenDone = false;
  State.listenPlaying = false;

  State.learnLevel = keepLearnLevel;
  State.learnStartScreen = keepLearnStartScreen;

  State.chunkDone = false;
  State.chunkRunning = false;
  State.chunkAutoStarting = false;
  State.chunkIndex = 0;
  State.chunkPassCount = 0;

  State.echoDone = false;
  State.echoRunning = false;
  State.echoAutoStarting = false;
  State.echoNeedsSecondPass = false;
  State.echoIndex = 0;
  State.echoSpeaking = false;

  State.hideCount = 0;
  State.revealedTokenIdx = new Set();
  State.sayVerseActive = false;
  State.sayVerseStartedAt = 0;
  State.sayVerseDurationMs = 0;

  reshuffleHidePlan();

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

function startListenInstructionIfNeeded(){
  if (State.screen !== Screen.LISTEN) return;
  if (State.learnLevel !== "not_at_all") return;
  if (State.listenInstructionDone) return;
  if (State.listenDone || State.listenPlaying || State.instructionPlaying) return;

  playInstruction("listen", {
    doneFlag: "listenInstructionDone"
  });
}

function goToPracticeGamesFromGame(){
  stopGame();
  go(Screen.PRACTICE);
}

/* Slide navigation */
function screenToIndex(screen){
  // order matters for sliding
  const order = [
    Screen.INTRO,
    Screen.TITLE,
    Screen.PROGRESS,
    Screen.PET_STATS,
    Screen.VERSE_DETAIL,
    Screen.LEARN_LEVEL,
    Screen.PRACTICE_GATE,
    Screen.LISTEN,
    Screen.MEANING,
    Screen.CHUNKS,
    Screen.ECHO,
    Screen.HIDE,
    Screen.FINAL_RECALL,
    Screen.CELEBRATION,
    Screen.PET_UNLOCK,
    Screen.PRACTICE,
    Screen.GAME
  ];
  return order.indexOf(screen);
}

function go(nextScreen){
  const from = State.screen;
  if (from === nextScreen) return;

  const fromIdx = screenToIndex(from);
  const toIdx = screenToIndex(nextScreen);

  if (State.isSliding) return;
  State.isSliding = true;

  // stop any learn audio/echo sequence when leaving a screen
  cancelLearnAudio();

  if (from === Screen.HIDE && nextScreen !== Screen.HIDE){
    State.sayVerseActive = false;
    State.sayVerseStartedAt = 0;
    State.sayVerseDurationMs = 0;
  }

  if (from === Screen.FINAL_RECALL && nextScreen !== Screen.FINAL_RECALL){
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
  }

  // Track the exact screens involved in this transition
  State.transitionFromIdx = fromIdx;
  State.transitionToIdx = toIdx;

  // Keep the old screen centered first
  State.slideX = fromIdx;

  // Update to the new logical screen, but don't jump visually yet
  State.screen = nextScreen;
  render();

  if (nextScreen === Screen.VERSE_DETAIL){
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
      render();
    }, 340);
  });
}


/* If you jump directly (no transition), call this */
function setScreen(screen){
  State.screen = screen;
  State.slideX = screenToIndex(screen);
  render();
}

function updateSlideTransforms(){
  const slides = document.querySelectorAll(".slide");
  slides.forEach(slide => {
    const idx = Number(slide.dataset.idx || 0);
    const dx = (idx - State.slideX) * 100;
    slide.style.transform = `translateX(${dx}%)`;
  });
}

/* Title carousel controls */
function titlePrev(){
  State.titleOptionIndex = (State.titleOptionIndex - 1 + TITLE_OPTIONS.length) % TITLE_OPTIONS.length;
  render();
}
function titleNext(){
  State.titleOptionIndex = (State.titleOptionIndex + 1) % TITLE_OPTIONS.length;
  render();
}

function titleRun(){
  if (!HAS_VERSE_SELECTION){
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
function learnLevelPrev(){
  State.learnLevelIndex = (State.learnLevelIndex - 1 + LEARN_LEVEL_OPTIONS.length) % LEARN_LEVEL_OPTIONS.length;
  render();
}

function learnLevelNext(){
  State.learnLevelIndex = (State.learnLevelIndex + 1) % LEARN_LEVEL_OPTIONS.length;
  render();
}

function learnLevelRun(){
  const opt = LEARN_LEVEL_OPTIONS[State.learnLevelIndex];

  State.learnLevel = opt.level;
  State.learnStartScreen = opt.startScreen;

  resetLearn(false);

  if (opt.startScreen === Screen.LISTEN){
    go(Screen.LISTEN);
    runAfterSlide(() => {
      startListenInstructionIfNeeded();
    });
    return;
  }

  if (opt.startScreen === Screen.ECHO){
    goToEchoAndStart();
    return;
  }

  go(opt.startScreen);
}

/* Practice carousel controls */
function practicePrev(){
  State.practiceIndex = (State.practiceIndex - 1 + PRACTICE_GAMES.length) % PRACTICE_GAMES.length;
  render();
}
function practiceNext(){
  State.practiceIndex = (State.practiceIndex + 1) % PRACTICE_GAMES.length;
  render();
}

function practiceRun(){

  const g = PRACTICE_GAMES[State.practiceIndex];


  if (g.title.includes("Verse Scramble")){
    startGame("scramble");
    return;
  }

  if (g.title.includes("Verse Launch")){
    startGame("chain");
    return;
  }

  if (g.title.includes("Traffic Tap")){
    startGame("traffic");
    return;
  }

  if (g.title.includes("Bouncing Words")){
    startGame("bouncing");
    return;
  }

  if (g.title.includes("Food Slice")){
    startGame("foodslice");
    return;
  }

  if (g.title.includes("Tower of Bible") || g.title.includes("Stack It")){
    startGame("tower");
    return;
  }


  showDialog({
    title: g.title,
    body: "Coming soon 🙂",
    actions: [dlgBtn("OK", {onClick: closeDialog})]
  });

}

/* Build verse display with hidden items */
function underscoresForWord(word){
  if (!word) return "";
  const first = word[0];
  const restLen = Math.max(0, word.length - 1);
  return first + "_".repeat(restLen);
}

function isTokenHidden(tokenIdx){
  if (State.revealedTokenIdx.has(tokenIdx)) return false;
  // hidden if it's in first hideCount items of the mixed plan
  for (let i = 0; i < Math.min(State.hideCount, planMixed.length); i++){
    if (planMixed[i].tokenIndex === tokenIdx) return true;
  }
  return false;
}

function hideInfoForToken(tokenIdx){
  for (let i = 0; i < Math.min(State.hideCount, planMixed.length); i++){
    const item = planMixed[i];
    if (item.tokenIndex === tokenIdx) return item;
  }
  return null;
}



function verseNode(){
  const p = document.createElement("p");
  p.className = "verse";
  for (let i = 0; i < tokens.length; i++){
    const t = tokens[i];
    if (t.type === TokenType.SPACE){
      p.appendChild(document.createTextNode(t.text));
      continue;
    }
    if (!isTokenHidden(i)){
      if (State.revealedTokenIdx.has(i)){
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

    };
      

    p.appendChild(span);
  }
  return p;
}

function finalRecallNode(showVerse=false){
  const p = document.createElement("p");
  p.className = "verse";

  for (let i = 0; i < tokens.length; i++){
    const t = tokens[i];

    if (t.type === TokenType.SPACE){
      p.appendChild(document.createTextNode(t.text));
      continue;
    }

    if (showVerse){
      p.appendChild(document.createTextNode(t.text));
      continue;
    }

    if (t.type === TokenType.WORD){
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

function instructionAudioFile(key){
  return `${AUDIO_DIR}instructions_${key}.mp3`;
}

function waitForAudioEnd(){
  return new Promise((resolve) => {
    const onEnd = () => {
      audioEl.removeEventListener("ended", onEnd);
      resolve();
    };
    audioEl.addEventListener("ended", onEnd);
  });
}

async function playInstruction(key, { doneFlag = null, delayMs = 0, after = null } = {}){
  const my = ++echoCancelToken;

  State.instructionPlaying = true;
  State.instructionKey = key;
  State.audioMode = "instruction";
  render();

  try {
    if (delayMs > 0){
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
        actions: [dlgBtn("OK", {onClick: closeDialog})]
      });
      return;
    }

    await waitForAudioEnd();
    if (my !== echoCancelToken) return;

    if (doneFlag){
      State[doneFlag] = true;
    }

    State.instructionPlaying = false;
    State.instructionKey = "";
    State.audioMode = null;
    setAudioSrc(AUDIO_FILE);
    render();

    if (typeof after === "function"){
      after();
    }
  } finally {
    if (my === echoCancelToken){
      State.instructionPlaying = false;
      State.instructionKey = "";
      if (State.audioMode === "instruction"){
        State.audioMode = null;
      }
      setAudioSrc(AUDIO_FILE);
      render();
    }
  }
}

function listenPlay(){
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
      State.audioMode = null;
      render();

      showDialog({
        title: "Reference audio missing",
        body: `Couldn't play: ${refAudioFile()}`,
        actions: [dlgBtn("OK", {onClick: closeDialog})]
      });
    });
}

audioEl.addEventListener("ended", () => {
  if (State.screen === Screen.LISTEN && State.audioMode === "listen_ref"){
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
          actions: [dlgBtn("OK", {onClick: closeDialog})]
        });
      });

    return;
  }

  if (State.screen === Screen.LISTEN && State.audioMode === "listen_verse"){
    State.listenPlaying = false;
    State.audioMode = null;

    if (State.learnLevel === "not_at_all"){
      playInstruction("meaning", {
        doneFlag: "meaningInstructionDone",
        delayMs: 450,
        after: () => {
          State.listenDone = true;
          render();
        }
      });
      return;
    }

    State.listenDone = true;
    render();
  }
});

function echoPartFileByIndex(i){
  // a, b, c...
  const suffix = String.fromCharCode("a".charCodeAt(0) + i);
  return `${AUDIO_DIR}${VERSE_ID}${suffix}.mp3`;
}

function refAudioFile(){
  return `${AUDIO_DIR}${VERSE_ID}_ref.mp3`;
}

function getLearnAudioParts(){
  const parts = [
    { text: VERSE_REF, file: refAudioFile() }
  ];

  if (ECHO_PARTS.length){
    for (let i = 0; i < ECHO_PARTS.length; i++){
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

function waitForDuration(timeoutMs = 2000){
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
      if (isFinite(audioEl.duration) && audioEl.duration > 0){
        clearInterval(timer);
        done();
      } else if (Date.now() - t0 > timeoutMs){
        clearInterval(timer);
        done();
      }
    }, 50);
  });
}

function getSayVersePct(){
  if (!State.sayVerseActive || !State.sayVerseDurationMs) return 1;

  const elapsed = performance.now() - State.sayVerseStartedAt;
  return Math.max(0, 1 - elapsed / State.sayVerseDurationMs);
}

function getFinalRecallPct(){
  if (!State.finalRecallActive || !State.finalRecallDurationMs) return 1;

  const elapsed = performance.now() - State.finalRecallStartedAt;
  return Math.max(0, 1 - elapsed / State.finalRecallDurationMs);
}

function runAfterSlide(fn){
  setTimeout(() => {
    if (!State.isSliding){
      fn();
    }
  }, 380);
}

function goToChunksAndStart(){
  State.chunkAutoStarting = true;
  go(Screen.CHUNKS);
  runAfterSlide(() => {
    if (State.screen === Screen.CHUNKS && !State.chunkRunning && State.chunkPassCount === 0){
      startChunkFlow();
    } else {
      State.chunkAutoStarting = false;
      render();
    }
  });
}

function goToEchoAndStart(){
  State.echoAutoStarting = true;
  go(Screen.ECHO);

  runAfterSlide(() => {
    if (State.screen !== Screen.ECHO){
      State.echoAutoStarting = false;
      render();
      return;
    }

    // Not at all: chunks already handled instruction
    if (State.learnLevel === "not_at_all"){
      if (!State.echoRunning && !State.echoDone){
        startEchoFlow();
      }
      return;
    }

    // A little bit / Pretty well → play instruction first
    playInstruction("echo1", {
      doneFlag: "echoIntroPromptDone",
      after: () => {
        startEchoFlow();
      }
    });
  });
}

function goToHideAndStartRound(){
  go(Screen.HIDE);
  runAfterSlide(() => {
    if (State.screen === Screen.HIDE && !State.sayVerseActive && State.hideCount === 0){
      startHideRound();
    }
  });
}

function hideWordsPerRound(){
  return State.learnLevel === "pretty_well" ? 2 : 1;
}

function hideTimerMultiplier(){
  return 1.3;
}

function goToFinalRecallAndStart(){
  go(Screen.FINAL_RECALL);
  runAfterSlide(() => {
    if (
      State.screen === Screen.FINAL_RECALL &&
      !State.finalRecallActive &&
      !State.finalRecallDone &&
      !State.finalRecallRevealed
    ){
      startFinalRecallFlow();
    }
  });
}

async function startHideRound(){
  if (State.sayVerseActive) return;

  if (State.hideCount >= planMixed.length){
    go(Screen.FINAL_RECALL);
    return;
  }

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

    if (currentBar){
      currentBar.style.width = (pct * 100) + "%";
    }

    if (pct > 0 && State.sayVerseActive && State.screen === Screen.HIDE){
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);

  await new Promise(r => setTimeout(r, durationMs));

  if (State.screen !== Screen.HIDE) return;

  State.sayVerseActive = false;
  State.sayVerseStartedAt = 0;
  State.sayVerseDurationMs = 0;

  if (State.hideCount >= planMixed.length && !State.finalIntroPromptDone){
    render();

    playInstruction("final", {
      doneFlag: "finalIntroPromptDone"
    });
    return;
  }

  render();
}

async function startFinalRecallFlow(){
  if (State.finalRecallActive) return;

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

  if (VERSE_ID){
    markLearnCompleted(VERSE_ID);
  }

  render();
}

async function startChunkFlow(){
  if (State.chunkRunning) return;

  State.chunkAutoStarting = false;

  // cancel any prior learn audio sequence
  cancelLearnAudio();

  await runChunkSequence();
}

async function runChunkSequence(){
  const my = ++echoCancelToken;

  State.chunkDone = false;
  State.chunkRunning = true;
  State.chunkIndex = 0;
  State.audioMode = "chunk";
  render();

  try {
    const learnParts = getLearnAudioParts();

    for (let i = 0; i < learnParts.length; i++){
      if (my !== echoCancelToken) return;

      const part = learnParts[i];
      const file = part.file;

      setAudioSrc(file);
      audioEl.currentTime = 0;

      State.chunkIndex = i;
      render();

      try{
        await safePlay();
      }catch(e){
        showDialog({
          title: "Learn audio missing",
          body: `Couldn't play: ${file}`,
          actions: [dlgBtn("OK", {onClick: closeDialog})]
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
      await new Promise(r => setTimeout(r, pauseMs));

      if (my !== echoCancelToken) return;
    }

    setAudioSrc(AUDIO_FILE);
    State.audioMode = null;
    State.chunkDone = true;
    State.chunkPassCount = Math.min(2, State.chunkPassCount + 1);
  } finally {
    if (my === echoCancelToken){
      State.chunkRunning = false;

      if (State.learnLevel === "not_at_all" && State.chunkPassCount === 1){
        playInstruction("chunks2", {
          doneFlag: "chunksReplayPromptDone",
          delayMs: 450
        });
      } else if (State.learnLevel === "not_at_all" && State.chunkPassCount >= 2){
        playInstruction("echo1", {
          doneFlag: "echoIntroPromptDone",
          delayMs: 450
        });
      } else {
        render();
      }
    }
  }
}

async function startEchoFlow(){
  if (State.echoRunning) return;

  State.echoAutoStarting = false;

  // cancel any prior
  cancelLearnAudio();

  await runEchoSequence();
}

let echoCancelToken = 0;

function cancelLearnAudio(){
  echoCancelToken++;
  try { audioEl.pause(); audioEl.currentTime = 0; } catch(e){}

  State.audioMode = null;
  State.instructionPlaying = false;
  State.instructionKey = "";

  State.listenPlaying = false;
  State.chunkRunning = false;
  State.echoRunning = false;
  State.echoSpeaking = false;
}

async function runEchoSequence(){
  const my = ++echoCancelToken;

  State.echoDone = false;
  State.echoRunning = true;
  State.echoSpeaking = false;
  State.echoIndex = 0;
  State.audioMode = "echo";
  render();

  try {
    const learnParts = getLearnAudioParts();

    for (let i = 0; i < learnParts.length; i++){
      if (my !== echoCancelToken) return;

      const part = learnParts[i];
      const file = part.file;

      setAudioSrc(file);
      audioEl.currentTime = 0;

      State.echoIndex = i;
      render();

      try{
        await safePlay();
      }catch(e){
        showDialog({
          title: "Learn audio missing",
          body: `Couldn't play: ${file}`,
          actions: [dlgBtn("OK", {onClick: closeDialog})]
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
      await new Promise(r => setTimeout(r, repeatMs));

      if (my !== echoCancelToken) return;

      State.echoSpeaking = false;
      render();
    }

    // restore main verse audio for later
    setAudioSrc(AUDIO_FILE);
    State.audioMode = null;

    // Handle second echo for "Not at all"
    if (State.learnLevel === "not_at_all" && !State.echoNeedsSecondPass){
      State.echoNeedsSecondPass = true;
      State.echoRunning = false;
      State.echoSpeaking = false;
      State.audioMode = null;
      render();

      playInstruction("echo2", {
        delayMs: 450,
        after: () => {
          startEchoFlow();
        }
      });

      return;
    }

    if (!State.removeIntroPromptDone){
      State.echoRunning = false;
      State.echoSpeaking = false;
      State.audioMode = null;
      render();

      playInstruction("remove", {
        doneFlag: "removeIntroPromptDone",
        delayMs: 450,
        after: () => {
          State.echoDone = true;
          render();
        }
      });

      return;
    }

    State.echoDone = true;
  } finally {
    if (my === echoCancelToken){
      State.echoRunning = false;
      State.echoSpeaking = false;
      render();
    }
  }
}

function stopFireworks(){
  if (State.fireworksTimer){
    clearInterval(State.fireworksTimer);
    State.fireworksTimer = null;
  }
}

function startFireworks(canvas){
  stopFireworks();

  const ctx = canvas.getContext("2d");
  const particles = [];

  function resize(){
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  function burst(){
    const x = Math.random() * canvas.clientWidth;
    const y = 80 + Math.random() * (canvas.clientHeight * 0.45);

    for (let i = 0; i < 28; i++){
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

  function tick(){
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life -= 1;

      if (p.life <= 0){
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

    if (State.screen === Screen.CELEBRATION){
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}


/* Nav rendering */
function renderNav(){
  // Always show nav except intro/title? Your other apps hide nav on intro.
  const show = (
    State.screen !== Screen.INTRO &&
    State.screen !== Screen.TITLE &&
    State.screen !== Screen.CELEBRATION &&
    State.screen !== Screen.PET_UNLOCK
  );
  navBar.style.display = show ? "flex" : "none";
  if (!show){
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
const isLearnScreen =
  State.screen === Screen.LISTEN ||
  State.screen === Screen.MEANING ||
  State.screen === Screen.CHUNKS ||
  State.screen === Screen.ECHO ||
  State.screen === Screen.HIDE ||
  State.screen === Screen.FINAL_RECALL;

if (State.screen === Screen.TITLE) left = "";
else if (State.screen === Screen.GAME) left = homeBtn;
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
if (State.screen === Screen.PRACTICE) center = "PRACTICE";
if (State.screen === Screen.GAME) center = `<button class="nav-btn no-zoom" id="btnHelp" title="Help" style="width:auto; min-width:88px; padding:0 16px; font-weight:900;">HELP</button>`;

right = (State.screen === Screen.GAME || isLearnScreen || State.screen === Screen.PROGRESS || State.screen === Screen.PET_STATS || State.screen === Screen.VERSE_DETAIL) ? "" : nextBtn;

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
  if (btnBack){
    btnBack.onclick = () => {
        if (State.screen === Screen.LEARN_LEVEL) go(Screen.TITLE);
        else if (State.screen === Screen.PROGRESS) go(Screen.TITLE);
        else if (State.screen === Screen.PET_STATS) go(Screen.PROGRESS);
        else if (State.screen === Screen.VERSE_DETAIL) go(Screen.PROGRESS);
        else if (State.screen === Screen.PRACTICE_GATE) go(Screen.TITLE);
        else if (State.screen === Screen.LISTEN) go(Screen.LEARN_LEVEL);
        else if (State.screen === Screen.MEANING) go(Screen.LISTEN);
        else if (State.screen === Screen.CHUNKS) go(Screen.MEANING);
        else if (State.screen === Screen.ECHO){
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
if (btnHome){
  btnHome.onclick = () => {
    if (State.screen === Screen.GAME){
      goToPracticeGamesFromGame();
      return;
    }

    if (
      State.screen === Screen.LISTEN ||
      State.screen === Screen.MEANING ||
      State.screen === Screen.CHUNKS ||
      State.screen === Screen.ECHO ||
      State.screen === Screen.HIDE ||
      State.screen === Screen.FINAL_RECALL
    ){
      resetLearn(true);
      return;
    }

    if (State.screen === Screen.PRACTICE_GATE){
      go(Screen.TITLE);
      return;
    }

    go(Screen.TITLE);
  };
}

  const btnHelp = document.getElementById("btnHelp");
  if (btnHelp){
    btnHelp.onclick = () => {
      if (State.activeGame === "scramble"){
        showDialog({
          title: "How to Play Verse Scramble",
          body: "Three word blobs will appear. Tap the correct next word in the verse as fast as you can until you reach the end.",
          actions: [dlgBtn("Close", {onClick: closeDialog})]
        });
        return;
      }

      if (State.activeGame === "bouncing"){
        showDialog({
          title: "How to Play Bouncing Words",
          body: "Three words bounce around the screen. Keep tapping the correct words until you finish the verse.",
          actions: [dlgBtn("Close", {onClick: closeDialog})]
        });
        return;
      }

      if (State.activeGame === "traffic"){
        showDialog({
          title: "How to Play Traffic Tap",
          body: "Tap the moving car or word that matches the next correct word until you finish the verse.",
          actions: [dlgBtn("Close", {onClick: closeDialog})]
        });
        return;
      }

      if (State.activeGame === "tower"){
        showDialog({
          title: "How to Play Tower of Bible",
          body: "Use the arrows to look through the choices. Tap the correct words to build your tower to the sky.",
          actions: [dlgBtn("Close", {onClick: closeDialog})]
        });
        return;
      }

      if (State.activeGame === "foodslice"){
        showDialog({
          title: "How to Play Food Slice",
          body: "Tap pieces of food that match the next word of the verse before it falls. Watch out for wrong words or bombs!",
          actions: [dlgBtn("Close", {onClick: closeDialog})]
        });
        return;
      }

      showDialog({
        title: "How to Play Verse Launch",
        body: "Use the arrows to look through the choices. Tap the big word when you think it is correct.",
        actions: [dlgBtn("Close", {onClick: closeDialog})]
      });

    };
  }

  const btnNext = document.getElementById("btnNext");
  if (btnNext){
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
      else if (State.screen === Screen.PRACTICE_GATE){
        resetLearn(false);
        go(Screen.LEARN_LEVEL);
      }
      else if (State.screen === Screen.LISTEN) go(Screen.MEANING);
      else if (State.screen === Screen.MEANING){
        if (!State.instructionPlaying){
          playInstruction("chunks1", {
            doneFlag: "chunksIntroDone",
            after: () => {
              goToChunksAndStart();
            }
          });
        }
      }
      else if (State.screen === Screen.CHUNKS){
        if (State.instructionPlaying) return;
        if (State.chunkPassCount >= 2) goToEchoAndStart();
        else if (!State.chunkRunning) startChunkFlow();
      }
      else if (State.screen === Screen.ECHO) goToHideAndStartRound();
      else if (State.screen === Screen.HIDE){
        if (State.instructionPlaying) return;

        if (State.hideCount >= planMixed.length){
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
function makeSlide({idx, bg, navHidden=false, inner}){
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

const games = {};

/* =========================
   2. Game Registry
   ========================= */
function registerGame(def){
  games[def.id] = def;
}

/* =========================
   3. Game Launching
   ========================= */
function startGame(id){
  const game = games[id];
  if (!game) return;

  State.activeGame = id;
  State.gameRunning = true;
  State.gameIntroActive = true;

  go(Screen.GAME);
}

function getGameIntroTitle(){
  if (State.activeGame === "scramble") return "Verse Scramble";
  if (State.activeGame === "bouncing") return "Bouncing Words";
  if (State.activeGame === "traffic") return "Traffic Tap";
  if (State.activeGame === "tower") return "Tower of Bible";
  if (State.activeGame === "foodslice") return "Food Slice";
  return "Verse Launch";
}

function getGameIntroEmoji(){
  if (State.activeGame === "scramble") return "🧩";
  if (State.activeGame === "bouncing") return "🏀";
  if (State.activeGame === "traffic") return "🚗";
  if (State.activeGame === "tower") return "🏰";
  if (State.activeGame === "foodslice") return "🍉";
  return "🚀";
}

function getGameIntroText(){
  if (State.activeGame === "scramble"){
    return "Three words will appear. Tap the correct next word in the verse as fast as you can.";
  }

  if (State.activeGame === "bouncing"){
    return "Three words bounce around the screen. Tap the next correct word of the verse.";
  }

  if (State.activeGame === "traffic"){
    return "Tap the moving car that matches the next correct word of the verse.";
  }

  if (State.activeGame === "tower"){
    return "Use the arrows to look through the choices. Tap the correct words to add it to your tower.";
  }

  if (State.activeGame === "foodslice"){
    return "Tap pieces of food that match the next word of the verse. Watch out for wrong words or bombs!";
  }

  return "Use the arrows to look through the choices. Tap the correct word to launch it into the verse!";
}

function stopGame(){
  bouncingStopMotion();
  trafficStopMotion();
  foodSliceStopMotion();

  State.chainGame = null;
  State.scrambleGame = null;
  State.bouncingGame = null;
  State.trafficGame = null;
  State.towerGame = null;
  State.foodSliceGame = null;

  State.activeGame = null;
  State.gameRunning = false;
}

function screenIntro(idx){
  const wrap = document.createElement("div");
  wrap.className = "quiz-intro";
  wrap.innerHTML = `
    <img src="${INTRO_LOGO}" alt="Logo" onerror="this.style.display='none'">
    <div class="presented">Presented by</div>
    <div class="site">eatyourbible.com</div>
    <div class="hint">Tap anywhere to start</div>
  `;
  wrap.onclick = () => { go(Screen.TITLE); };
  return makeSlide({idx, bg: "var(--purple)", navHidden:true, inner: wrap});
}

function screenTitle(idx){
  const wrap = document.createElement("div");
  wrap.className = "title-screen";
  const opt = TITLE_OPTIONS[State.titleOptionIndex];
  const buttonLabel =
    opt.id === "learn" && State.hasLearnedVerse
      ? "Learn Again"
      : opt.label;

  wrap.innerHTML = `
    <div class="title-content">
      <img src="${TITLE_LOGO}" alt="Title graphic" onerror="this.style.display='none'">
    <h2>
      ${HAS_VERSE_SELECTION ? `Let's memorize<br>${VERSE_REF}` : "Choose a verse from<br>below to begin"}
      ${DEBUG_MODE ? " (DEBUG)" : ""}
    </h2>
    
      <div class="title-picker">
        <select id="versePicker" class="title-picker-select"></select>
      </div>
      <div class="title-carousel">
        <button class="carousel-arrow no-zoom" id="titlePrev" aria-label="Previous">${SVG_BACK}</button>
        <button class="carousel-main no-zoom" id="titleMain">${buttonLabel}</button>
        <button class="carousel-arrow no-zoom" id="titleNext" aria-label="Next">${SVG_FORWARD}</button>
      </div>

      <div class="carousel-dots" id="titleDots"></div>

      <div class="title-attribution" style="max-width: 60ch;">
        ${ATTRIBUTION ? ATTRIBUTION : ""}
      </div>
    </div>
  `;

  // wire
  wrap.querySelector("#titlePrev").onclick = (e)=>{ e.stopPropagation(); titlePrev(); };
  wrap.querySelector("#titleNext").onclick = (e)=>{ e.stopPropagation(); titleNext(); };
  wrap.querySelector("#titleMain").onclick = (e)=>{ e.stopPropagation(); titleRun(); };

  const versePicker = wrap.querySelector("#versePicker");
  if (versePicker){
    versePicker.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a verse...";
    placeholder.disabled = true;
    placeholder.selected = !HAS_VERSE_SELECTION;
    versePicker.appendChild(placeholder);

    for (const item of VERSE_LIST){
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.ref;

      if (HAS_VERSE_SELECTION && item.id === VERSE_ID){
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

  // dots
  const dots = wrap.querySelector("#titleDots");
  dots.innerHTML = TITLE_OPTIONS.map((_, i) =>
    `<span class="carousel-dot ${i === State.titleOptionIndex ? "active" : ""}"></span>`
  ).join("");

  return makeSlide({idx, bg:"var(--purple)", navHidden:true, inner: wrap});
}

function screenProgress(idx){
  const wrap = document.createElement("div");
  wrap.className = "progress-screen";

  const hasVerses = Array.isArray(VERSE_LIST) && VERSE_LIST.length > 0;

  if (!hasVerses){
    wrap.innerHTML = `
      <div class="progress-shell">
        <div class="progress-heading">BibloPet Zoo</div>
        <div class="progress-subheading">Practice each verse to unlock its BibloPet.</div>
        <div class="progress-empty-card">
          No verses found yet.
        </div>
      </div>
    `;
    return makeSlide({ idx, bg: "var(--purple)", inner: wrap });
  }

  const rowsHtml = VERSE_LIST.map(item => {
    const verseProgress = getVerseProgress(item.id);
    const unlocked = isBibloPetUnlocked(verseProgress);
    const petEmoji = unlocked ? getBibloPetEmojiForListItem(item) : "🔒";
    const statusEmoji = unlocked ? getBibloPetStatusEmoji(verseProgress) : "";

    return `
      <div class="progress-row" data-verse-id="${item.id}">
        <div class="progress-row-pet">${petEmoji}</div>
        <div class="progress-row-main">
          <div class="progress-row-ref">${item.ref}</div>
        </div>
        <div class="progress-row-status">${statusEmoji}</div>
      </div>
    `;
  }).join("");

  wrap.innerHTML = `
    <div class="progress-shell">
      <div class="progress-heading">BibloPet Zoo</div>
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
  if (btnStats){
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

  return makeSlide({ idx, bg: "var(--purple)", inner: wrap });
}

function screenVerseDetail(idx){
  const verseId = State.selectedVerseId;
  const verseItem = getVerseListItemById(verseId);
  const verseProgress = getVerseProgress(verseId);

  const unlocked = isBibloPetUnlocked(verseProgress);
  const mastered = isVerseMastered(verseProgress);
  const petEmoji = unlocked ? getBibloPetEmojiForVerseId(verseId) : "🔒";
  const statusEmoji = unlocked ? getBibloPetStatusEmoji(verseProgress) : "🔒";
  const statusText = getBibloPetStatusText(verseProgress);
  const petStatus = getBibloPetStatus(verseProgress);
  const petAnimationClass = unlocked ? getBibloPetAnimationClass(verseId, verseProgress) : "";
  const petBackgroundClass = unlocked ? getVerseBackgroundClass(verseId, verseProgress) : "";
  const learnStatus = verseProgress.learnCompleted ? "✔" : "";

  function gameRow(label, gameId){
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
      <div class="detail-heading">${verseItem ? verseItem.ref : ""}</div>

      <div class="detail-scroll">
        <div class="pet-card">
          ${
            unlocked
              ? `
                <div class="pet-stage ${petBackgroundClass}">
                  ${
                    petStatus === "sleeping"
                      ? `
                        <div class="pet-sleep-zs" aria-hidden="true">
                          <span>Z</span>
                          <span>Z</span>
                          <span>Z</span>
                        </div>
                      `
                      : ""
                  }
                  ${
                    petStatus === "hungry"
                      ? `
                        <div class="pet-hungry-food-targets" aria-hidden="true">
                          <span class="pet-hungry-food-target left">🍎</span>
                          <span class="pet-hungry-food-target right">🍞</span>
                        </div>
                      `
                      : ""
                  }
                  <div class="pet-emoji pet-emoji-unlocked ${petAnimationClass}">${petEmoji}</div>
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

        <div class="pet-status-card">
          <div class="pet-status-label">BibloPet Status:</div>
          <div class="pet-status-emoji">${statusEmoji}</div>
        </div>

        <div class="pet-helper-text">${statusText}</div>

        <button class="detail-listen-btn no-zoom" id="btnDetailListen" type="button">
          Listen to the Verse
        </button>

        <div class="detail-section">
          <div class="detail-row">
            <div class="detail-label">Learn the Verse</div>
            <div class="detail-stars">${learnStatus}</div>
          </div>
        </div>

        <div class="detail-section">
          ${gameRow("Verse Scramble", "scramble")}
          ${gameRow("Verse Launch", "chain")}
          ${gameRow("Traffic Tap", "traffic")}
          ${gameRow("Bouncing Words", "bouncing")}
          ${gameRow("Food Slice", "foodslice")}
          ${gameRow("Tower of Bible", "tower")}
        </div>
      </div>
    </div>
  `;

  const btnChangePetBg = wrap.querySelector("#btnChangePetBg");
  if (btnChangePetBg){
    btnChangePetBg.onclick = () => {
      if (!mastered){
        showDialog({
          title: "Locked",
          body: "Complete all practice games to unlock custom backgrounds for this BibloPet.",
          actions: [dlgBtn("OK", { onClick: closeDialog })]
        });
        return;
      }

      cycleVerseBackground(verseId);
      render();
    };
  }

  requestAnimationFrame(() => {
    applyPetMotionVars(wrap);
    startHungryFoodCycle(wrap, petStatus);
  });

  return makeSlide({ idx, bg: "var(--purple)", inner: wrap });
}

function screenPetUnlock(idx){
  const verseId = State.pendingPetUnlockVerseId;
  const verseItem = getVerseListItemById(verseId);
  const petEmoji = getBibloPetEmojiForVerseId(verseId);

  const wrap = document.createElement("div");
  wrap.className = "pet-unlock-screen";

  wrap.innerHTML = `
    <div class="pet-unlock-shell">
      <div class="pet-unlock-kicker">🎉</div>

      <div class="pet-unlock-card">
        <div class="pet-unlock-emoji pet-emoji-unlocked">${petEmoji}</div>
      </div>

      <div class="pet-unlock-title">You unlocked a new BibloPet!</div>
      <div class="pet-unlock-ref">${verseItem ? verseItem.ref : ""}</div>
      <div class="pet-unlock-subtext">A new BibloPet joined your zoo. Keep practicing to keep it happy!</div>

      <div class="celebration-actions">
        <button class="carousel-main no-zoom" id="btnPetUnlockPractice">Practice Games</button>
        <button class="carousel-main no-zoom" id="btnPetUnlockVisit">Visit BibloPet</button>
      </div>
    </div>
  `;

  const btnPractice = wrap.querySelector("#btnPetUnlockPractice");
  if (btnPractice){
    btnPractice.onclick = () => {
      const unlockedVerseId = State.pendingPetUnlockVerseId;
      State.pendingPetUnlockVerseId = null;
      if (unlockedVerseId) State.selectedVerseId = unlockedVerseId;
      stopGame();
      go(Screen.PRACTICE);
    };
  }

  const btnVisit = wrap.querySelector("#btnPetUnlockVisit");
  if (btnVisit){
    btnVisit.onclick = () => {
      const unlockedVerseId = State.pendingPetUnlockVerseId;
      State.pendingPetUnlockVerseId = null;
      if (unlockedVerseId) State.selectedVerseId = unlockedVerseId;
      stopGame();
      go(Screen.VERSE_DETAIL);
    };
  }

  return makeSlide({ idx, bg: "var(--purple)", navHidden: true, inner: wrap });
}

function screenPetStats(idx){
  const stats = getBibloPetStats();

  const wrap = document.createElement("div");
  wrap.className = "pet-stats-screen";

  wrap.innerHTML = `
    <div class="pet-stats-shell">
      <div class="pet-stats-heading">BibloPet Stats</div>
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

  return makeSlide({ idx, bg: "var(--purple)", inner: wrap });
}

function screenLearnLevel(idx){
  const wrap = document.createElement("div");
  wrap.className = "title-screen learn-level-screen";

  wrap.innerHTML = `
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

  return makeSlide({ idx, bg:"var(--purple)", navHidden:false, inner: wrap });
}

function screenListen(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const listenDisplayText =
    (State.listenPlaying || State.listenDone) ? VERSE_TEXT : "Listen to the verse.";

  const listenDisplayFitClass =
    (State.listenPlaying || State.listenDone)
      ? getVerseFitClass(VERSE_TEXT)
      : "verse-fit-short";

  inner.innerHTML = `
    <div class="learn-layout learn-layout-coach-centered">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse ${listenDisplayFitClass}">
        <p class="verse">${listenDisplayText}</p>
      </div>

      <div class="learn-coach">
        <div>
          <div class="coach-text">${
            State.listenDone
              ? "Tap the button to read what this verse means."
              : "Listen to the verse."
          }</div>
        </div>

        <div class="coach-actions">
          ${
            (
              State.listenPlaying ||
              State.instructionPlaying ||
              (State.learnLevel === "not_at_all" && !State.listenInstructionDone && !State.listenDone)
            )
              ? ``
              : `
                <button class="carousel-main no-zoom" id="btnListenPlay" style="max-width:520px;">
                  ${State.listenDone ? "What It Means" : "🔊 Read it to me"}
                </button>
              `
          }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnListenPlay");
  if (btn){
    btn.onclick = async () => {
      if (State.listenDone){
        go(Screen.MEANING);
        return;
      }

      listenPlay();
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}

function screenMeaning(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  inner.innerHTML = `
    <div class="learn-layout learn-layout-meaning">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse learn-verse-meaning">
        <div class="meaning-wrap">
          <div class="meaning-title">WHAT IT MEANS</div>
          <p class="verse meaning-text">${VERSE_MEANING}</p>
        </div>
      </div>

      <div class="learn-coach learn-coach-meaning learn-coach-meaning-minimal">
        <div class="coach-actions">
          ${
            State.instructionPlaying
              ? ``
              : `
                <button class="carousel-main no-zoom" id="btnMeaningNext" style="max-width:520px;">
                  Break It Down
                </button>
              `
          }
        </div>
      </div>
    </div>
  `;

  const btn = inner.querySelector("#btnMeaningNext");
  if (btn){
    btn.onclick = () => {
      playInstruction("chunks1", {
        doneFlag: "chunksIntroDone",
        after: () => {
          goToChunksAndStart();
        }
      });
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}

function screenChunks(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const learnParts = getLearnAudioParts();
  const chunkText = learnParts[State.chunkIndex]?.text || VERSE_TEXT;

  let coachText = "Listen to each part of the verse one chunk at a time.";
  let buttonLabel = "▶ Start";

  if (State.instructionPlaying && State.instructionKey === "chunks1"){
    coachText = "Let's break the verse down into bite sized chunks.";
  } else if (State.instructionPlaying && State.instructionKey === "chunks2"){
    coachText = "Let's do that one more time.";
    buttonLabel = "One More Time";
  } else if (State.instructionPlaying && State.instructionKey === "echo1"){
    coachText = "Now echo the verse after me.";
    buttonLabel = "Echo the Verse";
  } else if (State.chunkRunning){
    coachText = "Listen carefully as each chunk plays.";
  } else if (State.chunkPassCount === 1){
    coachText = "Listen through the chunks one more time.";
    buttonLabel = "One More Time";
  } else if (State.chunkPassCount >= 2){
    coachText = "Tap the button to echo the verse.";
    buttonLabel = "Echo the Verse";
  }

  inner.innerHTML = `
    <div class="learn-layout learn-layout-coach-centered">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse ${getVerseFitClass(chunkText)}">
        <p class="verse">${chunkText}</p>
      </div>

      <div class="learn-coach">
        <div>
          <div class="coach-text">${coachText}</div>
        </div>

        <div class="coach-actions">
          ${
            (State.chunkRunning || State.chunkAutoStarting || State.instructionPlaying)
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
  if (btn){
    btn.onclick = async () => {
      if (State.chunkPassCount >= 2){
        goToEchoAndStart();
        return;
      }

      await startChunkFlow();
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}

function screenEcho(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";
  const learnParts = getLearnAudioParts();
  const echoText = learnParts[State.echoIndex]?.text || VERSE_TEXT;

  inner.innerHTML = `
    <div class="learn-layout learn-layout-coach-centered">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse ${getVerseFitClass(echoText)} ${State.echoSpeaking ? "echo-green" : ""}">
        <p class="verse">${echoText}</p>
      </div>

      <div class="learn-coach">
        <div>
          <div class="coach-text">${
            State.instructionPlaying && State.instructionKey === "echo1"
              ? "Now echo the verse after me."
              : State.instructionPlaying && State.instructionKey === "echo2"
                ? "Echo the verse one more time."
                : State.instructionPlaying && State.instructionKey === "remove"
                  ? "Now, let's remove words from the verse. Try to say the verse out loud each time. If you need a hint, tap that word."
                  : State.echoDone
                    ? (hideWordsPerRound() === 2
                        ? "Tap the button to remove some words."
                        : "Tap the button to remove the first word.")
                    : "Repeat each chunk out loud during the pause."
          }</div>
        </div>

        <div class="coach-actions">
          ${
              (State.echoRunning || State.echoAutoStarting || State.instructionPlaying)
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
  if (btn){
    btn.onclick = async () => {
      if (State.echoDone){
        goToHideAndStartRound();
        return;
      }

      await startEchoFlow();
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}


function screenHide(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const hiddenNow = Math.min(State.hideCount, planMixed.length);
  const done = hiddenNow >= planMixed.length;

  let coachBody = State.sayVerseActive
    ? `
      <div class="coach-text">Say the verse out loud. If you need help, tap a missing word.</div>
      <div class="timer-wrap"><div class="timer-bar" id="sayVerseBar"></div></div>
    `
    : `<div class="coach-text">Tap the button to continue removing words.</div>`;
  const removeLabel = hideWordsPerRound() === 2 ? "Remove Words" : "Remove a Word";
  const removeAnotherLabel = hideWordsPerRound() === 2 ? "Remove More Words" : "Remove Another";
  let buttonLabel = removeLabel;

  if (State.sayVerseActive){
    buttonLabel = hiddenNow > 0 ? removeAnotherLabel : removeLabel;
  } else if (done){
    coachBody = `<div class="coach-text">${
      State.instructionPlaying && State.instructionKey === "final"
        ? "Time for your final test! Try to say the verse using only the first letter of each word."
        : "Tap the button to test if you can say the whole verse from memory."
    }</div>`;
    buttonLabel = "Begin Final Test";
  } else if (hiddenNow > 0){
    buttonLabel = removeAnotherLabel;
  }

  inner.innerHTML = `
    <div class="learn-layout learn-layout-coach-centered">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse ${getVerseFitClass(VERSE_TEXT)}">
        <div id="verseStage"></div>
      </div>

      <div class="learn-coach">
        <div>
          ${coachBody}
        </div>

        <div class="coach-actions">
          ${
            (State.sayVerseActive || State.instructionPlaying)
              ? ``
              : `
                <button
                  class="carousel-main no-zoom"
                  id="btnRemoveWord"
                  style="max-width:520px;"
                >
                  ${buttonLabel}
                </button>
              `
          }
        </div>
      </div>
    </div>
  `;

  inner.querySelector("#verseStage").appendChild(verseNode());

  const btnRemove = inner.querySelector("#btnRemoveWord");
  if (btnRemove){
    btnRemove.onclick = async () => {
      if (done){
        goToFinalRecallAndStart();
        return;
      }

      await startHideRound();
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}

function screenFinalRecall(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  let coachBody = `<div class="coach-text">Try saying the entire verse from memory.</div>`;
  let actionHtml = ``;

  if (State.finalRecallActive){
    coachBody = `
      <div class="coach-text">Try to say the verse</div>
      <div class="timer-wrap"><div class="timer-bar" id="finalRecallBar" style="width:${getFinalRecallPct() * 100}%"></div></div>
    `;
  } else if (State.finalRecallDone && !State.finalRecallRevealed){
    coachBody = `<div class="coach-text">Press below to reveal the verse.</div>`;
    actionHtml = `<button class="carousel-main no-zoom" id="btnFinalReveal" style="max-width:520px;">Reveal Verse</button>`;
  } else if (State.finalRecallRevealed){
    coachBody = `<div class="coach-text">Complete more Verse Games to unlock this verse's BibloPet! 🐾</div>`;
    actionHtml = `<button class="carousel-main no-zoom" id="btnFinalGames" style="max-width:520px;">Verse Games</button>`;
  }

  inner.innerHTML = `
    <div class="learn-layout learn-layout-coach-centered final-recall-layout">
      <div class="learn-ref">
        <div class="verse-ref-pill">${VERSE_REF}</div>
      </div>

      <div class="learn-verse ${getVerseFitClass(VERSE_TEXT)}">
        <div id="finalRecallStage"></div>
      </div>

      <div class="learn-coach">
        <div>
          ${coachBody}
        </div>

        <div class="coach-actions">
          ${actionHtml}
        </div>
      </div>
    </div>
  `;

  inner
    .querySelector("#finalRecallStage")
    .appendChild(finalRecallNode(State.finalRecallRevealed));

  const btnFinalReveal = inner.querySelector("#btnFinalReveal");
  if (btnFinalReveal){
    btnFinalReveal.onclick = () => {
      State.finalRecallRevealed = true;
      render();
    };
  }

const btnFinalGames = inner.querySelector("#btnFinalGames");
if (btnFinalGames){
  btnFinalGames.onclick = () => {
    resetLearn(false);
    go(Screen.PRACTICE);
  };
}

  if (State.finalRecallActive){
    const animate = () => {
      const pct = getFinalRecallPct();
      const currentBar = document.getElementById("finalRecallBar");

      if (currentBar){
        currentBar.style.width = (pct * 100) + "%";
      }

      if (pct > 0 && State.finalRecallActive){
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
}

function screenCelebration(idx){

  const wrap = document.createElement("div");
  wrap.className = "celebration-screen";

  wrap.innerHTML = `
    <canvas id="fireworksCanvas"></canvas>

    <h2>Great job learning the verse!</h2>
    <div class="celebration-prompt">Complete Verse Games to unlock a new BibloPet! 🐾</div>

    <div class="celebration-actions">
      <button class="carousel-main no-zoom" id="btnCelebrateTitle">Title Screen</button>
      <button class="carousel-main no-zoom" id="btnCelebrateGames">Verse Games</button>
    </div>
  `;

  const canvas = wrap.querySelector("#fireworksCanvas");
  setTimeout(() => {
    if (State.screen === Screen.CELEBRATION){
      startFireworks(canvas);
    }
  }, 0);

  wrap.querySelector("#btnCelebrateTitle").onclick = () => {
    stopFireworks();
    go(Screen.TITLE);
  };

  wrap.querySelector("#btnCelebrateGames").onclick = () => {
    stopFireworks();
    go(Screen.PRACTICE);
  };

  return makeSlide({idx, bg:"var(--purple)", navHidden:true, inner: wrap});
}

function screenPracticeGate(idx){
  const wrap = document.createElement("div");
  wrap.className = "title-screen learn-level-screen";

  wrap.innerHTML = `
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
  if (btn){
    btn.onclick = () => {
      resetLearn(false);
      go(Screen.LEARN_LEVEL);
    };
  }

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner: wrap});
}

function screenPractice(idx){
  const wrap = document.createElement("div");
  wrap.className = "title-screen";
  const g = PRACTICE_GAMES[State.practiceIndex];

  wrap.innerHTML = `
    <div class="title-content practice-content">
      <h2>Practice Games</h2>

      <div class="title-carousel">
        <button class="carousel-arrow no-zoom" id="pPrev" aria-label="Previous">${SVG_BACK}</button>

        <button class="carousel-main no-zoom" id="pMain">
          ${g.title}
        </button>

        <button class="carousel-arrow no-zoom" id="pNext" aria-label="Next">${SVG_FORWARD}</button>
      </div>

      <div class="carousel-dots" id="pDots"></div>
      <div class="practice-desc">${g.desc}</div>
  `;

  wrap.querySelector("#pPrev").onclick = (e)=>{ e.stopPropagation(); practicePrev(); };
  wrap.querySelector("#pNext").onclick = (e)=>{ e.stopPropagation(); practiceNext(); };
  wrap.querySelector("#pMain").onclick = (e)=>{ e.stopPropagation(); practiceRun(); };

  const dots = wrap.querySelector("#pDots");
  dots.innerHTML = PRACTICE_GAMES.map((_, i) =>
    `<span class="carousel-dot ${i === State.practiceIndex ? "active" : ""}"></span>`
  ).join("");

  return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner: wrap});
}


function screenGame(idx){
  const inner = document.createElement("div");
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.height = "100%";

  const game = games[State.activeGame];

  if (State.gameIntroActive){
    inner.innerHTML = `
      <div class="game-intro-screen">
        <div class="game-intro-content">
          <div class="game-intro-emoji">${getGameIntroEmoji()}</div>
          <div class="game-intro-heading">${getGameIntroTitle()}</div>
          <div class="game-intro-body">${getGameIntroText()}</div>
          <button class="carousel-main no-zoom" id="gameIntroStart">Start</button>
        </div>
      </div>
    `;

    const introStart = inner.querySelector("#gameIntroStart");
    if (introStart){
      introStart.onclick = () => {
        State.gameIntroActive = false;
        render();
      };
    }

    return makeSlide({idx, bg:"var(--purple)", navHidden:false, inner});
  }

  const showGameRef =
    (State.activeGame === "chain" && State.chainGame?.showRef) ||
    (State.activeGame === "scramble" && State.scrambleGame?.showRef) ||
    (
      State.activeGame !== "chain" &&
      State.activeGame !== "scramble" &&
      State.activeGame !== "tower" &&
      State.activeGame !== "foodslice" &&
      !(State.activeGame === "traffic" && !State.trafficGame?.theme)
    );

  const gameLayoutClass =
    State.activeGame === "tower" ? "game-tower" :
    (State.activeGame === "scramble" && State.scrambleGame?.done) ? "game-scramble-result" :
    (State.activeGame === "scramble" && !State.scrambleGame?.mode) ? "game-foodslice-mode" :
    (State.activeGame === "bouncing" && !State.bouncingGame?.mode) ? "game-bouncing-mode" :
    (State.activeGame === "bouncing") ? "game-bouncing" :
    (State.activeGame === "scramble") ? "game-scramble" :
    (State.activeGame === "traffic" && !State.trafficGame?.theme) ? "game-traffic-theme" :
    (State.activeGame === "traffic") ? "game-traffic" :
    (State.activeGame === "chain" && !State.chainGame?.mode) ? "game-foodslice-mode" :
    (State.activeGame === "chain") ? "game-chain" :
    (State.activeGame === "foodslice" && !State.foodSliceGame?.mode) ? "game-foodslice-mode" :
    (State.activeGame === "foodslice") ? "game-foodslice" :
    "";

  inner.innerHTML = `
    <div class="learn-layout ${gameLayoutClass}">
      <div class="learn-ref">
        ${showGameRef ? `<div class="verse-ref-pill">${VERSE_REF}</div>` : ``}
      </div>

      <div class="learn-verse">
        ${State.activeGame === "tower"
          ? `<div id="gameStage" style="width:100%; height:100%;"></div>`
          : `<div id="gameStage" style="width:100%;"></div>`
        }
      </div>

      <div class="learn-coach">
        <div>
          <div class="coach-title" id="gameCoachTitle"></div>
        </div>

        <div class="coach-actions" id="gameCoachActions"></div>
      </div>
    </div>
  `;

  const stage = inner.querySelector("#gameStage");

  if (game && typeof game.start === "function"){
    if (State.activeGame === "bouncing" && State.isSliding){
      // wait until the slide transition is done
    } else {
      game.start(stage);
    }
  }

  return makeSlide({
    idx,
    bg:
      State.activeGame === "traffic" ? TRAFFIC_GREEN :
      State.activeGame === "chain" ? "#40b9c5" :
      State.activeGame === "tower" ? "#40b9c5" :
      State.activeGame === "bouncing" ? "#f2f2f2" :
      State.activeGame === "foodslice" ? "#333333" :
      "var(--purple)",
    navHidden: false,
    inner
  });
}


/* =========================
   7. Main Render
   ========================= */
function render(){
  app.innerHTML = "";

  const currentIdx = screenToIndex(State.screen);

  let indicesToRender;
  if (State.isSliding) {
    indicesToRender = [State.transitionFromIdx, State.transitionToIdx];
  } else {
    indicesToRender = [currentIdx];
  }

  const uniq = Array.from(new Set(indicesToRender.filter(i => i !== null && i >= 0)));
  for (const idx of uniq){
    const screen = ["intro","title","progress","pet_stats","verse_detail","learn_level","practice_gate","listen","meaning","chunks","echo","hide","final_recall","celebration","pet_unlock","practice","game"][idx];
    let slide = null;
    if (screen === Screen.INTRO) slide = screenIntro(idx);
    if (screen === Screen.TITLE) slide = screenTitle(idx);
    if (screen === Screen.PROGRESS) slide = screenProgress(idx);
    if (screen === Screen.PET_STATS) slide = screenPetStats(idx);
    if (screen === Screen.VERSE_DETAIL) slide = screenVerseDetail(idx);
    if (screen === Screen.LEARN_LEVEL) slide = screenLearnLevel(idx);
    if (screen === Screen.PRACTICE_GATE) slide = screenPracticeGate(idx);
    if (screen === Screen.LISTEN) slide = screenListen(idx);
    if (screen === Screen.MEANING) slide = screenMeaning(idx);
    if (screen === Screen.CHUNKS) slide = screenChunks(idx);
    if (screen === Screen.ECHO) slide = screenEcho(idx);
    if (screen === Screen.HIDE) slide = screenHide(idx);
    if (screen === Screen.FINAL_RECALL) slide = screenFinalRecall(idx);
    if (screen === Screen.CELEBRATION) slide = screenCelebration(idx);
    if (screen === Screen.PET_UNLOCK) slide = screenPetUnlock(idx);
    if (screen === Screen.PRACTICE) slide = screenPractice(idx);
    if (screen === Screen.GAME) slide = screenGame(idx);
    if (slide) app.appendChild(slide);
  }

  // Ensure transform matches current slideX
  if (!State.isSliding) {
    State.slideX = currentIdx;
  }
  updateSlideTransforms();

  renderNav();
}

/* =========================
   8. App Bootstrap
   ========================= */

(async function init(){
  await loadVerseList();
  HAS_VERSE_SELECTION = hasVerseIdInUrl();

  try{
    const requestedVerseId = getRequestedVerseIdFromUrl();

    if (requestedVerseId){
      await loadVerse(requestedVerseId);
    }
  }catch(e){
    // Show a friendly error (still allow app shell)
    console.error(e);
    showDialog({
      title: "Verse JSON not found",
      body: String(e.message || e),
      actions: [dlgBtn("OK", {onClick: closeDialog})]
    });
  }

  // start on intro
  setScreen(Screen.INTRO);
  applyMute();
})();
