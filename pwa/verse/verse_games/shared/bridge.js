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
    const verseId = params.verseId;

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

  function markCompleted(payload){
    if (!payload || !payload.verseId || !payload.gameId || !payload.mode) return false;

    const progress = loadProgress();

    if (!progress.verses[payload.verseId]) {
      progress.verses[payload.verseId] = {
        learnCompleted: false,
        games: {}
      };
    }

    const verseProgress = progress.verses[payload.verseId];

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

    saveProgress(progress);
    return true;
  }

  function exitGame(){
    const params = getParams();
    window.location.href = params.returnTo || "../../index.html";
  }

  window.VerseGameBridge = {
    getLaunchParams: getParams,
    getVerseContext,
    markCompleted,
    exitGame
  };
})();
