(function(){
  function getParams(){
    const params = new URLSearchParams(window.location.search);

    return {
      verseId: params.get("verseId") || "",
      returnTo: params.get("returnTo") || "../../index.html",
      ref: params.get("ref") || "",
      translation: params.get("translation") || "",
      source: params.get("source") || ""
    };
  }

  async function getVerseContext(){
    const params = getParams();
    const verseId = params.verseId;e

    if (!verseId){
      return {
        verseId: "",
        verseText: "",
        verseRef: params.ref || "",
        translation: params.translation || "",
        attribution: ""
      };
    }

    try {
      const res = await fetch(`../../verse_data/${verseId}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      return {
        verseId: json.verseId || verseId,
        verseText: json.verseText || "",
        verseRef: params.ref || "",
        translation: json.translation || params.translation || "",
        attribution: json.attribution || ""
      };
    } catch (err) {
      console.warn("Could not load verse context for external game", err);

      return {
        verseId,
        verseText: "",
        verseRef: params.ref || "",
        translation: params.translation || "",
        attribution: ""
      };
    }
  }

  function loadProgress(){
    try {
      const raw = localStorage.getItem("verseMemoryProgress");
      if (!raw) return { version: 1, verses: {} };

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { version: 1, verses: {} };
      if (!parsed.verses || typeof parsed.verses !== "object") parsed.verses = {};

      return parsed;
    } catch (err) {
      console.warn("Could not load progress in external bridge", err);
      return { version: 1, verses: {} };
    }
  }

  function saveProgress(progress){
    try {
      localStorage.setItem("verseMemoryProgress", JSON.stringify(progress));
    } catch (err) {
      console.warn("Could not save progress in external bridge", err);
    }
  }

function isTrackedGameCompleted(gameId, gameProgress){
  if (!gameId || !gameProgress) return false;

  if (gameId === "traffic"){
    return !!(gameProgress.roadCompleted || gameProgress.trailCompleted || gameProgress.riverCompleted);
  }

  return !!(gameProgress.easyCompleted || gameProgress.mediumCompleted || gameProgress.hardCompleted);
}

function markCompleted(payload){
  if (!payload || !payload.verseId || !payload.gameId || !payload.mode) {
    return { ok: false, petUnlockTriggered: false };
  }

  const progress = loadProgress();

  if (!progress.verses[payload.verseId]) {
    progress.verses[payload.verseId] = {
      learnCompleted: false,
      games: {}
    };
  }

  const verseProgress = progress.verses[payload.verseId];

  const wasUnlockedBefore =
    !!verseProgress.learnCompleted &&
    Object.entries(verseProgress.games || {}).some(([gameId, gp]) =>
      isTrackedGameCompleted(gameId, gp)
    );

  if (!verseProgress.games[payload.gameId]) {
    verseProgress.games[payload.gameId] = {
      easyCompleted: false,
      mediumCompleted: false,
      hardCompleted: false
    };
  }

  if (payload.mode === "easy") verseProgress.games[payload.gameId].easyCompleted = true;
  if (payload.mode === "medium") verseProgress.games[payload.gameId].mediumCompleted = true;
  if (payload.mode === "hard") verseProgress.games[payload.gameId].hardCompleted = true;

  verseProgress.lastPracticedAt = Date.now();

  const isUnlockedNow =
    !!verseProgress.learnCompleted &&
    Object.entries(verseProgress.games || {}).some(([gameId, gp]) =>
      isTrackedGameCompleted(gameId, gp)
    );

  let petUnlockTriggered = false;

  if (!wasUnlockedBefore && isUnlockedNow && !verseProgress.petUnlockShown) {
    verseProgress.petUnlockShown = true;
    verseProgress.externalPetUnlockPending = true;
    petUnlockTriggered = true;
  }

  saveProgress(progress);

  return {
    ok: true,
    petUnlockTriggered
  };
}

function wasAlreadyCompleted(verseId, gameId, mode){
  if (!verseId || !gameId || !mode) return false;

  const progress = loadProgress();
  const verseProgress = progress.verses?.[verseId];
  const gameProgress = verseProgress?.games?.[gameId];

  if (!gameProgress) return false;

  if (mode === "easy") return !!gameProgress.easyCompleted;
  if (mode === "medium") return !!gameProgress.mediumCompleted;
  if (mode === "hard") return !!gameProgress.hardCompleted;

  return false;
}

  function buildFallbackReturnUrl(){
    const params = getParams();
  
    const fallback = new URL("../../index.html", window.location.href);
  
    if (params.verseId){
      fallback.searchParams.set("v", params.verseId);
    }
  
    fallback.searchParams.set("screen", "practice");
    return fallback.href;
  }
  
function exitGame(){
  const params = getParams();

  try {
    const raw = params.returnTo || "";
    const target = raw
      ? new URL(raw, window.location.href)
      : new URL("../../index.html", window.location.href);

    const progress = loadProgress();
    const verseProgress = progress.verses?.[params.verseId];

    if (params.verseId && verseProgress?.externalPetUnlockPending){
      target.searchParams.set("petUnlock", params.verseId);
      delete verseProgress.externalPetUnlockPending;
      saveProgress(progress);
    }

    window.location.href = target.href;
  } catch (err) {
    console.warn("Could not resolve return target", err);

    const fallback = new URL("../../index.html", window.location.href);
    if (params.verseId){
      fallback.searchParams.set("v", params.verseId);
      fallback.searchParams.set("screen", "practice");
    }

    window.location.href = fallback.href;
  }
}

  window.VerseGameBridge = {
    getLaunchParams: getParams,
    getVerseContext,
    wasAlreadyCompleted,
    markCompleted,
    exitGame
  };
})();
