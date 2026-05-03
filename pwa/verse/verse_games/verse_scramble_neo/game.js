(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "scramble";

  const GAME_THEME = {
    bg: "#7f66c6",
    accent: "#7f66c6"
  };

  const BUILD_AREA = "large";

  const HELP_OVERLAY_ID = "vsnHelpOverlay";

  let selectedMode = null;
  let muted = false;
  let bestWpm = 0;

  const BUTTON_COLORS = [
    "vsn-color-red",
    "vsn-color-orange",
    "vsn-color-yellow",
    "vsn-color-green",
    "vsn-color-blue",
    "vsn-color-pink"
  ];
const BUTTON_SHAPES = [
  "vsn-shape-blob",
  "vsn-shape-splat",
  "vsn-shape-pill",
  "vsn-shape-cloud",
  "vsn-shape-goo",
  "vsn-shape-marshmallow",
  "vsn-shape-puddle",
  "vsn-shape-jelly",
  "vsn-shape-soft-boom",
  "vsn-shape-soft-star",
  "vsn-shape-squish",
  "vsn-shape-gumdrop",
  "vsn-shape-splash",
  "vsn-shape-melt",
  "vsn-shape-cushion",
  "vsn-shape-muffin-top",
  "vsn-shape-bubble-blob",
  "vsn-shape-wobble"
];

const BUTTON_DANCES = [
  "vsn-dance-bouncey",
  "vsn-dance-jelly",
  "vsn-dance-wiggle",
  "vsn-dance-bobble",
  "vsn-dance-sway",
  "vsn-dance-pulse",
  "vsn-dance-scoot",
  "vsn-dance-wobble",
  "vsn-dance-plop",
  "vsn-dance-noodle",
  "vsn-dance-squash",
  "vsn-dance-float"
];

const FUN_DECOYS = window.VerseGameShell.getFunDecoys();

const BIBLE_BOOKS = window.VerseGameShell.getBibleBookDecoys();

const state = {
    screen: "intro",
    words: [],
    segments: [],
    metaIndices: new Set(),
    progressIndex: 0,
    streak: 0,
    bestStreak: 0,
    buildSizeClass: "is-normal",
    buildRemoving: new Set(),
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    busy: false,
    completed: false,
    startTime: 0,
    endTime: 0,
    completionResult: null,
    roundChoices: [],
    redFlashKey: 0,
    boardSeed: 0
  };

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

const shuffle = window.VerseGameShell.shuffle;

const tokenizeVerse = window.VerseGameShell.tokenizeVerseWords;

  const parseReferenceParts = window.VerseGameShell.parseReferenceParts;



  const normalizeWord = window.VerseGameShell.normalizeWord;

  function initVerseData(){
    const parsed = parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: parsed.book,
      reference: parsed.reference,
      buildArea: BUILD_AREA
    });

    state.words = buildData.words;
    state.referenceMeta = parsed;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.buildSizeClass = buildData.buildSizeClass;
    state.segments = buildData.segments;
    state.metaIndices = buildData.metaIndices;
    state.progressIndex = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.buildRemoving = new Set();
    state.roundChoices = [];
    state.busy = false;
    state.completed = false;
    state.completionResult = null;
    state.boardSeed = 0;
    state.redFlashKey = 0;
  }

  function currentPhase(){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function currentCorrectLabel(){
    return state.segments[state.progressIndex] || "";
  }

  function uniqueVisibleChoices(correct, decoys){
    const out = [correct];
    const seen = new Set([normalizeWord(correct)]);
    for (const d of decoys){
      const key = normalizeWord(d);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(d);
      if (out.length >= 3) break;
    }
    return out;
  }

  function verseWordDecoys(correct){
    return window.VerseGameShell.getVerseWordDecoys({
      words: state.words,
      correct,
      targetIndex: state.progressIndex,
      count: 12,
      avoidNext: 2,
      fallbackToFun: true
    });
  }

  function easyDecoys(correct){
    return window.VerseGameShell.getFunWordDecoys(correct, state.words, 12);
  }

  function bookDecoys(correct){
    return window.VerseGameShell.getBookDecoys(correct, 12);
  }

  function refDecoys(correctRef){
    return shuffle(
      window.VerseGameShell
        .getReferenceDecoys(state.referenceMeta, selectedMode, 6)
        .filter((ref) => normalizeWord(ref) !== normalizeWord(correctRef))
    );
  }

  function buildRoundChoices(){
    const correct = currentCorrectLabel();
    const phase = currentPhase();
    let decoyPool = [];
    if (phase === "words"){
      decoyPool = selectedMode === "easy" ? easyDecoys(correct) : verseWordDecoys(correct);
      if (decoyPool.length < 2) decoyPool = decoyPool.concat(easyDecoys(correct));
    } else if (phase === "book"){
      decoyPool = bookDecoys(correct);
    } else if (phase === "reference"){
      decoyPool = refDecoys(correct);
    }

    const choices = uniqueVisibleChoices(correct, decoyPool).slice(0, 3);
    while (choices.length < 3){
      const fallback = phase === "book" ? bookDecoys(correct) : easyDecoys(correct);
      for (const item of fallback){
        if (choices.map(normalizeWord).includes(normalizeWord(item))) continue;
        choices.push(item);
        if (choices.length >= 3) break;
      }
    }

    const colors = shuffle(BUTTON_COLORS).slice(0, 3);
    const shaped = shuffle(BUTTON_SHAPES);
    const dances = shuffle(BUTTON_DANCES).slice(0, 3);

    const perRow = shuffle(choices).map((label, index) => ({
      id: `choice_${state.boardSeed}_${index}`,
      label,
      isCorrect: normalizeWord(label) === normalizeWord(correct),
      colorClass: colors[index],
      shapeClass: shaped[index % shaped.length],
      danceClass: dances[index],
      rotation: `${[-5,-2,3,5,1,-3][Math.floor(Math.random() * 6)]}deg`
    }));
    state.roundChoices = perRow;
    state.boardSeed += 1;
  }

  function streakDancing(){
    return state.streak >= 3;
  }

  function setScreen(screen){
    state.screen = screen;
    render();
  }

  function formatMode(mode){
    return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Mode";
  }

function renderBuildText(){
  return window.VerseGameShell.renderBuildProgressHtml({
    verseText: ctx.verseText || "",
    book: state.bookLabel,
    reference: state.referenceLabel,
    progressIndex: state.progressIndex,
    buildArea: BUILD_AREA,
    hideUnbuilt: selectedMode === "hard",
    extraClass: "vsn-build-text"
  });
}

function renderIntro(){
  window.VerseGameShell.renderTitleScreen({
    app,
    title: "Verse Scramble",
    icon: "🧩",
    helpHtml: helpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Practice Games",
    onBack: () => window.VerseGameBridge.exitGame(),
    onStart: () => setScreen("mode")
  });
}

function renderMode(){
  window.VerseGameShell.renderModeSelect({
    app,
    title: "Choose Your Difficulty",
    icon: "🥉🥈🥇",
    helpHtml: helpHtml(),
    helpOverlayId: HELP_OVERLAY_ID,
    theme: GAME_THEME,
    backLabel: "Back to Verse Scramble title",
    onBack: () => setScreen("intro"),
    onSelect: (mode) => {
      selectedMode = mode;
      initVerseData();
      state.startTime = performance.now();
      buildRoundChoices();
      setScreen("game");
    }
  });
}

  function renderGame(){
    app.innerHTML = `
      <div class="vsn-root">
        <div class="vsn-stage">
          <div class="vsn-build-wrap">
            <div class="vsn-build vm-build vm-build--${BUILD_AREA} ${state.buildRemoving.size ? "vsn-shake" : ""}" id="vsnBuild">
              ${(() => {
  const buildRender = renderBuildText();

  return `
    <div class="${buildRender.className}" id="vsnBuildText">
      ${buildRender.html}
    </div>
  `;
})()}
            </div>
          </div>
          <div class="vsn-game-wrap">
            <div class="vsn-game-board" id="vsnBoard">
              <div class="vsn-red-flash ${state.redFlashKey ? "is-flashing" : ""}" id="vsnRedFlash"></div>
              <div class="vsn-particle-layer" id="vsnParticleLayer"></div>
              <div class="vsn-smoke-layer" id="vsnSmokeLayer"></div>
              <div class="vsn-board-content">
                <div class="vsn-overlay-pills">
                  <button class="vsn-pill vsn-menu-pill no-zoom" id="vsnMenuPill" aria-label="Game Menu" type="button">☰</button>
                  <div class="vsn-pill" id="vsnStreakPill">Streak: ${state.streak}</div>
                </div>
                <div class="vsn-main-area" id="vsnMainArea">
                  ${state.roundChoices.map((choice, index) => `
                    <div class="vsn-row" data-row="${index}">
                      <button
                        class="vsn-choice ${choice.colorClass} ${choice.shapeClass} ${streakDancing() ? choice.danceClass : ""} is-spawning no-zoom"
                        id="${choice.id}"
                        data-choice-id="${choice.id}"
                        type="button"
                        style="--vsn-rot:${choice.rotation};"
                      >${escapeHtml(choice.label)}</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireGameScreen();
  }

  function totalElapsedMs(){
    return Math.max(1, (state.endTime || performance.now()) - state.startTime);
  }

  function wordsPerMinute(){
    const taps = state.segments.length;
    const minutes = totalElapsedMs() / 60000;
    return Math.max(1, Math.round(taps / minutes));
  }

function renderEnd(){
  const wpm = wordsPerMinute();
  bestWpm = Math.max(bestWpm, wpm);
  const timeSecs = (totalElapsedMs() / 1000).toFixed(1);

  window.VerseGameShell.renderCompleteScreen({
    app,
    gameIcon: "🧩",
    mode: selectedMode,
    verseId: ctx.verseId,
    gameId: GAME_ID,
    completion: state.completionResult,
    gameMessage: `${wpm} WPM · ${timeSecs}s · Best streak: ${state.bestStreak}`,
    theme: GAME_THEME,
    backLabel: "Back to Practice Games",
    onPlayAgain: () => {
      setScreen("mode");
    },
    onMoreGames: () => window.VerseGameBridge.exitGame(),
    onChangeVerse: () => window.VerseGameBridge.returnToTitle()
  });
}


function helpHtml(){
  return `
    Tap the next correct word as quickly as you can.<br><br>
    Easy: fun decoys.<br>
    Medium: decoys are other words from the verse.<br>
    Hard: same as Medium, with the toughest decoys.<br><br>
    After the verse words, collect the book, then the reference.
  `;
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
      id: "vsnGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function wireGameScreen(){
    const menuPill = document.getElementById("vsnMenuPill");

    document.querySelectorAll("[data-choice-id]").forEach(btn => {
      btn.onclick = () => handleChoice(btn.dataset.choiceId);
    });

    window.VerseGameShell.wireGameMenu({
      id: "vsnGameMenuOverlay",
      menuButtonId: "vsnMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        muted = !muted;
        return muted;
      },
      onHowToPlay: () => {
        state.menuOpen = false;
        state.helpOpen = true;
        state.helpBackMode = true;

        const menuOverlay = document.getElementById("vsnGameMenuOverlay");
        if (menuOverlay){
          menuOverlay.classList.remove("is-open");
          menuOverlay.setAttribute("aria-hidden", "true");
        }

        window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
      },
      onModeSelect: () => {
        state.menuOpen = false;
        state.helpOpen = false;
        state.helpBackMode = false;
        setScreen("mode");
      },
      onExit: () => window.VerseGameBridge.exitGame(),
      onOpen: () => {
        if (state.busy) return;
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

  function flashWrongBoard(){
    const el = document.getElementById("vsnRedFlash");
    if (!el) return;
    el.classList.remove("is-flashing");
    void el.offsetWidth;
    el.classList.add("is-flashing");
  }

  function spawnParticlesAtButton(buttonEl, type){
    const layer = document.getElementById(type === "smoke" ? "vsnSmokeLayer" : "vsnParticleLayer");
    if (!layer || !buttonEl) return;
    const layerRect = layer.getBoundingClientRect();
    const rect = buttonEl.getBoundingClientRect();
    const cx = rect.left - layerRect.left + rect.width / 2;
    const cy = rect.top - layerRect.top + rect.height / 2;

    if (type === "smoke"){
      for (let i = 0; i < 9; i++){
        const puff = document.createElement("div");
        puff.className = "vsn-smoke";
        puff.style.left = `${cx + (Math.random() * 34 - 17)}px`;
        puff.style.top = `${cy + (Math.random() * 18 - 9)}px`;
        puff.style.setProperty("--sx", `${Math.round(Math.random() * 30 - 15)}px`);
        puff.style.setProperty("--sy", `${Math.round(-10 - Math.random() * 24)}px`);
        layer.appendChild(puff);
        puff.addEventListener("animationend", () => puff.remove(), { once:true });
      }
      return;
    }

    const palette = ["#ffffff", "#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#f8f8f8"];
    const count = 18 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++){
      const particle = document.createElement("div");
      particle.className = "vsn-particle";
      particle.style.left = `${cx}px`;
      particle.style.top = `${cy}px`;
      particle.style.setProperty("--dx", `${Math.round(Math.random() * 120 - 60)}px`);
      particle.style.setProperty("--dy", `${Math.round(Math.random() * 120 - 60)}px`);
      particle.style.setProperty("--pcolor", palette[i % palette.length]);
      layer.appendChild(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once:true });
    }
  }

  function spawnSmokeForAll(){
    state.roundChoices.forEach(choice => {
      const el = document.getElementById(choice.id);
      if (el) spawnParticlesAtButton(el, "smoke");
    });
  }

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function handleChoice(choiceId){
    if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;
    const choice = state.roundChoices.find(c => c.id === choiceId);
    const btn = document.getElementById(choiceId);
    if (!choice || !btn) return;
    state.busy = true;

    if (choice.isCorrect){
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      spawnParticlesAtButton(btn, "burst");
      state.roundChoices.forEach(c => {
        const el = document.getElementById(c.id);
        if (!el) return;
        if (c.id === choiceId){
          el.classList.add("is-bursting");
        } else {
          el.style.opacity = "0";
        }
      });
      await sleep(340);
      state.progressIndex += 1;
      if (state.progressIndex >= state.segments.length){
        state.completed = true;
        state.endTime = performance.now();

        state.completionResult = await window.VerseGameBridge.completeGameRun({
          verseId: ctx.verseId,
          gameId: GAME_ID,
          mode: selectedMode,
          startedAt: state.startTime,
          stats: {
            wpm: wordsPerMinute(),
            timeSecs: Number((totalElapsedMs() / 1000).toFixed(1)),
            bestStreak: state.bestStreak
          }
        });

        state.busy = false;
        setScreen("end");
        return;
      }
      buildRoundChoices();
      state.busy = false;
      render();
      return;
    }

    state.streak = 0;
    spawnSmokeForAll();
    flashWrongBoard();
    const build = document.getElementById("vsnBuild");
    if (build){
      build.classList.remove("vsn-shake");
      void build.offsetWidth;
      build.classList.add("vsn-shake");
    }
    state.roundChoices.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) el.style.opacity = "0";
    });

    await sleep(360);

    buildRoundChoices();
    state.busy = false;
    render();
  }

  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
