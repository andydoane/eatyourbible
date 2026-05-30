(async function () {
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell", "vl-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "chain";
  const GAME_TITLE = "Verse Launch";

  const GAME_THEME = {
    bg: "#7f66c6",
    accent: "#7f66c6"
  };

  const BUILD_AREA = "large";

  const HELP_OVERLAY_ID = "vlHelpOverlay";

  const ROCKETS = [
    { key: "red", src: "./verse_launch_images/verse_launch_rocket_red.png", color: "#ff5a51", textDark: false },
    { key: "blue", src: "./verse_launch_images/verse_launch_rocket_blue.png", color: "#64b5f6", textDark: false },
    { key: "yellow", src: "./verse_launch_images/verse_launch_rocket_yellow.png", color: "#ffc751", textDark: true }
  ];

  const ASTEROID_IMAGE_SRC = "./verse_launch_images/verse_launch_asteroid.png";
  const MOON_IMAGE_SRC = "./verse_launch_images/verse_launch_moon.png";

  const WORD_BURST_CLOUD_SVG = `
<svg viewBox="0 0 26.458333 26.458333" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="currentColor" d="M 12.949771,1.5464282 A 6.0017493,5.3230522 7.1160496 0 0 6.9820601,6.4190471 5.3405872,4.7400094 7.154063 0 0 6.8563886,6.4134999 5.3405872,4.7400094 7.154063 0 0 1.5243277,11.020646 5.3405872,4.7400094 7.154063 0 0 2.4259083,13.677302 4.0181559,3.5662928 7.1540647 0 0 0.66145837,16.583588 4.0181559,3.5662928 7.1540647 0 0 4.6728467,20.261811 4.0181559,3.5662928 7.1540647 0 0 5.1732885,20.243 a 5.3405872,4.7400094 7.154063 0 0 5.2883005,4.342428 5.3405872,4.7400094 7.154063 0 0 3.656255,-1.210431 4.0181559,3.5662928 7.1540647 0 0 3.300558,1.639798 4.0181559,3.5662928 7.1540647 0 0 4.011389,-3.466536 4.0181559,3.5662928 7.1540647 0 0 -0.416848,-1.594767 5.3405872,4.7400094 7.154063 0 0 4.783932,-4.586787 5.3405872,4.7400094 7.154063 0 0 -1.9322,-3.706541 4.0181559,3.5662928 7.1540647 0 0 0.764128,-2.0624453 4.0181559,3.5662928 7.1540647 0 0 -4.011389,-3.6776624 4.0181559,3.5662928 7.1540647 0 0 -1.744813,0.3148283 6.0017493,5.3230522 7.1160496 0 0 -5.92283,-4.6884523 z"/>
</svg>`;

  const FUN_DECOYS = window.VerseGameShell.getFunDecoys();

  const BIBLE_BOOKS = window.VerseGameShell.getBibleBookDecoys();

  const state = {
    screen: "intro",
    mode: null,
    words: [],
    segments: [],
    metaIndices: new Set(),
    buildSizeClass: "is-normal",
    progressIndex: 0,
    buildRemoving: new Set(),
    choices: [],
    choiceIndex: 0,
    busy: false,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    completed: false,
    startTime: 0,
    endTime: 0,
    completionResult: null,
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    medalMessage: "",
    medalSubmessage: "",
    countdownValue: "",
    bonusReady: false,
    bonusTravelTextVisible: false,
    hasShownInitialCountdown: false,
    bonusFadeActive: false,
    bonusRocketColorKey: "red",
    bonusOutcome: "",
    bonusMedalAlreadyEarned: false,

    astroHits: 0,
    astroInvulnerable: false,
    astroTimerMs: 0,
    astroPlayerX: 0.5,
    astroMoveDir: 0,
    astroPlayerTilt: 0,
    astroSpinDeg: 0,
    astroSpinMs: 0,
    astroAsteroids: [],
    astroSpawnCooldownMs: 0,
    astroLastSpawnX: -1,
    astroDrainPhase: false,
    astroRunning: false,
    astroMoonPhase: false,
    astroMoonY: -240,
    astroMoonVisible: false,
    astroMoonDone: false,
    astroLandingPhase: false,
    astroPlayerLiftPx: 0,
    astroPlayerScale: 1,
    astroLastTs: 0,
    astroRaf: 0,
  };

  let muted = false;

  const ASTRO_DURATION_MS = 30000;
  const ASTRO_HITBOX_SCALE = 0.5;
  const ASTRO_BASE_SPEED_VH_PER_SEC = 42;
  const ASTRO_MODE_MULTIPLIER = { easy: 1, medium: 1.18, hard: 1.38 };

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  }

  const shuffle = window.VerseGameShell.shuffle;


  function tokenizeVerse(text) {
    return window.VerseGameShell.tokenizeVerseWords(text);
  }

  function normalizeWord(value) {
    return window.VerseGameShell.normalizeWord(value);
  }

  function preloadImages(srcList) {
    return Promise.all(
      srcList.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // don't block the game if one fails
        img.src = src;
      }))
    );
  }

  function parseReferenceParts(ref, translation, verseId) {
    return window.VerseGameShell.parseReferenceParts(ref, translation, verseId);
  }


  await preloadImages([
    ...ROCKETS.map(r => r.src),
    ASTEROID_IMAGE_SRC,
    MOON_IMAGE_SRC
  ]);

  function initVerseData() {
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
    state.buildRemoving = new Set();
    state.choices = [];
    state.choiceIndex = 0;
    state.busy = false;
    state.menuOpen = false;
    state.helpOpen = false;
    state.helpBackMode = false;
    state.completed = false;
    state.completionResult = null;
    state.medalMessage = "";
    state.medalSubmessage = "";
    state.countdownValue = "";
    state.hasShownInitialCountdown = false;
    state.bonusReady = false;
    state.bonusTravelTextVisible = false;
    state.bonusFadeActive = false;
    state.bonusRocketColorKey = "red";
    state.bonusOutcome = "";
    state.bonusMedalAlreadyEarned = false;

    state.astroHits = 0;
    state.astroInvulnerable = false;
    state.astroTimerMs = 0;
    state.astroPlayerX = 0.5;
    state.astroMoveDir = 0;
    state.astroPlayerTilt = 0;
    state.astroSpinDeg = 0;
    state.astroSpinMs = 0;
    state.astroAsteroids = [];
    state.astroSpawnCooldownMs = 0;
    state.astroLastSpawnX = -1;
    state.astroDrainPhase = false;
    state.astroRunning = false;
    state.astroMoonPhase = false;
    state.astroMoonY = -340;
    state.astroMoonVisible = false;
    state.astroMoonDone = false;
    state.astroLandingPhase = false;
    state.astroPlayerLiftPx = 0;
    state.astroPlayerScale = 1;
    state.astroDrainPhase = false;
    state.astroLastTs = 0;
    if (state.astroRaf) {
      cancelAnimationFrame(state.astroRaf);
      state.astroRaf = 0;
    }
  }

  function currentPhase() {
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: state.progressIndex,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }
  function currentCorrectLabel() { return state.segments[state.progressIndex] || ""; }

  function uniqueVisibleChoices(correct, decoys) {
    const out = [correct];
    const seen = new Set([normalizeWord(correct)]);
    for (const d of decoys) {
      const key = normalizeWord(d);
      if (!key || seen.has(key)) continue;
      seen.add(key); out.push(d);
      if (out.length >= 3) break;
    }
    return out;
  }
  function verseWordDecoys(correct) {
    return window.VerseGameShell.getVerseWordDecoys({
      words: state.words,
      correct,
      targetIndex: state.progressIndex,
      count: 12,
      avoidNext: 2,
      fallbackToFun: true
    });
  }
  function easyDecoys(correct) {
    return window.VerseGameShell.getFunWordDecoys(correct, state.words, 12);
  }

  function bookDecoys(correct) {
    return window.VerseGameShell.getBookDecoys(correct, 12);
  }

  function refDecoys(correctRef) {
    return shuffle(
      window.VerseGameShell
        .getReferenceDecoys(state.referenceMeta, state.mode, 6)
        .filter((ref) => normalizeWord(ref) !== normalizeWord(correctRef))
    );
  }

  function buildChoices() {
    const correct = currentCorrectLabel();
    const phase = currentPhase();
    let decoyPool = [];
    if (phase === "words") {
      decoyPool = state.mode === "easy" ? easyDecoys(correct) : verseWordDecoys(correct);
      if (decoyPool.length < 2) decoyPool = decoyPool.concat(easyDecoys(correct));
    } else if (phase === "book") {
      decoyPool = bookDecoys(correct);
    } else if (phase === "reference") {
      decoyPool = refDecoys(correct);
    }
    const labels = uniqueVisibleChoices(correct, decoyPool).slice(0, 3);
    while (labels.length < 3) {
      const fallback = phase === "book" ? bookDecoys(correct) : easyDecoys(correct);
      for (const item of fallback) {
        if (labels.map(normalizeWord).includes(normalizeWord(item))) continue;
        labels.push(item);
        if (labels.length >= 3) break;
      }
    }
    const skins = shuffle(ROCKETS).slice(0, 3);
    state.choices = shuffle(labels).map((label, index) => ({
      id: `choice_${index}_${Date.now()}`,
      label,
      isCorrect: normalizeWord(label) === normalizeWord(correct),
      rocket: skins[index]
    }));
    state.choiceIndex = 1;
  }

  function renderBuildText() {
    return window.VerseGameShell.renderBuildProgressHtml({
      verseText: ctx.verseText || "",
      book: state.bookLabel,
      reference: state.referenceLabel,
      progressIndex: state.progressIndex,
      buildArea: BUILD_AREA,
      hideUnbuilt: state.mode === "hard",
      extraClass: "vl-build-text"
    });
  }

  function fitBuildText() {
    requestAnimationFrame(() => {
      window.VerseGameShell.fitBuildTextOnce({
        buildEl: document.getElementById("vlBuild"),
        textEl: document.getElementById("vlBuildText"),
        buildArea: BUILD_AREA
      });
    });
  }


  function formatMode(mode) { return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Mode"; }
  function totalElapsedMs() { return Math.max(1, (state.endTime || performance.now()) - state.startTime); }

  function helpHtml() {
    return `
    Find the next correct word and launch it into the verse.<br><br>
    Easy: fun decoys.<br>
    Medium: decoys are other words from the verse.<br>
    Hard: same as Medium, with the toughest decoys.<br><br>
    After the verse words, launch the book, then the reference.
  `;
  }


  function renderHelpOverlay() {
    return window.VerseGameShell.helpOverlayHtml({
      id: HELP_OVERLAY_ID,
      title: "How to Play",
      body: helpHtml(),
      closeText: "Close"
    });
  }

  function renderGameMenuOverlay() {
    return window.VerseGameShell.gameMenuHtml({
      id: "vlGameMenuOverlay",
      title: "Game Menu",
      muted,
      showModeSelect: true
    });
  }

  function syncGameMenuOpenState() {
    const menuOverlay = $("#vlGameMenuOverlay");
    if (!menuOverlay) return;

    if (state.menuOpen) {
      menuOverlay.classList.add("is-open");
      menuOverlay.setAttribute("aria-hidden", "false");
    } else {
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function canOpenGameMenu() {
    if (state.busy) return false;
    if (state.screen === "travel") return false;
    return true;
  }

  function renderCountdownOverlay() {
    if (!state.countdownValue) return "";
    return `
      <div class="vl-countdown-overlay" aria-hidden="true">
        <div class="vl-countdown-box is-pop">${escapeHtml(state.countdownValue)}</div>
      </div>`;
  }

  function getPreviewChoice(offset) {
    if (!state.choices.length) return null;
    const total = state.choices.length;
    return state.choices[(state.choiceIndex + offset + total) % total];
  }

  function renderLauncher(choice, preview = false) {
    if (!choice) return "";
    return `
      <div class="${preview ? "vl-side-preview" : "vl-main-launcher"} no-zoom" data-choice-id="${choice.id}">
        <div class="${preview ? "" : "vl-rocket-stack"}">
          <img class="${preview ? "vl-preview-rocket" : "vl-rocket"}" src="${choice.rocket.src}" alt="" />
          ${preview ? "" : `<button class="vl-launcher-hitbox no-zoom" data-choice-id="${choice.id}" type="button" aria-label="Launch ${escapeHtml(choice.label)}"></button>`}
        </div>
        <div class="${preview ? "vl-preview-bubble" : `vl-choice-bubble ${choice.rocket.textDark ? "vl-text-dark" : ""}`}" style="--bubble:${choice.rocket.color}">${escapeHtml(choice.label)}</div>
      </div>`;
  }


  function conveyorSpeedPxPerSec() {
    if (state.mode === "easy") return 62;
    if (state.mode === "hard") return 86;
    return 74;
  }

  function renderConveyor() {
    const choices = state.choices || [];
    return `
      <div class="vl-conveyor" id="vlConveyor" aria-label="Tap the next correct word">
        <div class="vl-conveyor-track" id="vlConveyorTrack">
          ${choices.map((choice, index) => `
            <button
              class="vl-conveyor-choice vl-choice-bubble ${choice.rocket.textDark ? "vl-text-dark" : ""} no-zoom"
              data-choice-id="${choice.id}"
              data-slot="${index}"
              type="button"
              style="--bubble:${choice.rocket.color}"
              aria-label="Choose ${escapeHtml(choice.label)}">${escapeHtml(choice.label)}</button>`).join("")}
        </div>
      </div>`;
  }

  function syncConveyorTiming() {
    requestAnimationFrame(() => {
      const conveyor = document.getElementById("vlConveyor");
      if (!conveyor) return;

      const choices = [...conveyor.querySelectorAll(".vl-conveyor-choice")];
      if (!choices.length) return;

      const rect = conveyor.getBoundingClientRect();
      const maxChoiceWidth = Math.max(...choices.map(el => el.getBoundingClientRect().width), 220);
      const sidePad = Math.max(56, maxChoiceWidth * 0.35);
      const startX = rect.width + sidePad;
      const endX = -maxChoiceWidth - sidePad;
      const distance = startX - endX;
      const durationMs = Math.round((distance / conveyorSpeedPxPerSec()) * 1000);

      choices.forEach((el, index) => {
        el.style.setProperty("--vl-conveyor-start-x", `${startX}px`);
        el.style.setProperty("--vl-conveyor-end-x", `${endX}px`);
        el.style.setProperty("--vl-conveyor-duration", `${durationMs}ms`);
        el.style.setProperty("--vl-conveyor-delay", `${-Math.round((durationMs / choices.length) * index)}ms`);
      });
    });
  }

  async function fadeOutConveyor() {
    const track = document.getElementById("vlConveyorTrack");
    if (!track) return;
    track.classList.add("is-fading");
    await sleep(340);
  }

  function renderIntro() {
    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: "🚀",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: () => setScreen("mode")
    });
  }

  function renderMode() {
    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Difficulty",
      icon: "🥉🥈🥇",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      theme: GAME_THEME,
      backLabel: "Back to Verse Launch title",
      onBack: () => setScreen("intro"),
      onSelect: (mode) => {
        state.mode = mode;
        initVerseData();
        state.startTime = performance.now();
        buildChoices();
        setScreen("game");
      }
    });
  }

  function renderGame() {
    const center = getPreviewChoice(0);

    const bonusRocket = getBonusRocket();
    const launcherMarkup = state.bonusReady
      ? `
        <div class="vl-bonus-launch-wrap">
          <div class="vl-main-launcher no-zoom" data-choice-id="bonus_launch">
            <div class="vl-rocket-stack">
              <img class="vl-rocket" src="${bonusRocket.src}" alt="" />
              <button class="vl-launcher-hitbox no-zoom" data-choice-id="bonus_launch" type="button" aria-label="Launch to space"></button>
            </div>
            <button class="vl-star-launch-btn no-zoom" data-choice-id="bonus_launch" type="button">⭐ LAUNCH</button>
          </div>
        </div>`
      : renderConveyor();

    app.innerHTML = `
      <div class="vl-root">
        <div class="vl-stage">
          ${(() => {
        const buildRender = renderBuildText();

        return `
    <div class="vl-build-wrap">
      <div class="vl-build vm-build vm-build--${BUILD_AREA} ${state.buildRemoving.size ? "vl-shake" : ""}" id="vlBuild">
        <div class="${buildRender.className}" id="vlBuildText">
          ${buildRender.html}
        </div>
      </div>
    </div>
  `;
      })()}
          <div class="vl-game-wrap">
            <div class="vl-game-board" id="vlBoard">
              <div class="vl-red-flash" id="vlRedFlash"></div>
              <div class="vl-flight-layer" id="vlFlightLayer"></div>
              <div class="vl-smoke-layer" id="vlSmokeLayer"></div>
              <div class="vl-firework-layer" id="vlFireworkLayer"></div>
              <div class="vl-board-content">
                <div class="vl-overlay-pills"><button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button></div>
                <div class="vl-launch-area">
                  <div class="vl-flight-space">
                    ${renderCountdownOverlay()}
                  </div>
                  <div class="vl-launcher-band">
                    ${launcherMarkup}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireGameScreen();
    syncGameMenuOpenState();
    fitBuildText();
    syncConveyorTiming();
  }

  function renderTravel() {
    const rocket = getBonusRocket();
    app.innerHTML = `
      <div class="vl-travel-screen">
        <div class="vl-bonus-topbar">
          <button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button>
        </div>
        <div class="vl-bonus-stage" id="vlTravelStage">
          <div class="vl-travel-smoke" id="vlTravelSmoke"></div>
          <div class="vl-travel-vignette"></div>
          <img class="vl-travel-rocket" id="vlTravelRocket" src="${rocket.src}" alt="">
          <div class="vl-travel-text ${state.bonusTravelTextVisible ? "is-visible" : ""}" id="vlTravelText">Reach the moon! Watch out for asteroids!</div>
          <div class="vl-screen-fade ${state.bonusFadeActive ? "is-active" : ""}"></div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireBonusMenuOnly();
    syncGameMenuOpenState();
  }

  function renderAsteroidGame() {
    const rocket = getBonusRocket();
    app.innerHTML = `
      <div class="vl-asteroid-screen">
        <div class="vl-bonus-topbar">
          <button class="vl-pill vl-menu-pill no-zoom" id="vlMenuPill" type="button" aria-label="Game Menu">☰</button>
        </div>
        <div class="vl-bonus-stage" id="vlAstroStage">
          <div class="vl-space-layer" id="vlSpaceLayer">
            <img class="vl-moon" id="vlMoon" src="./verse_launch_images/verse_launch_moon.png" alt="">
          </div>
          <div class="vl-player-trail" id="vlPlayerTrail"></div>
          <img class="vl-player-rocket" id="vlPlayerRocket" src="${rocket.src}" alt="">
          <div class="vl-space-status">
            <span class="vl-hit-pip ${state.astroHits >= 1 ? "is-on" : ""}"></span>
            <span class="vl-hit-pip ${state.astroHits >= 2 ? "is-on" : ""}"></span>
            <span class="vl-hit-pip ${state.astroHits >= 3 ? "is-on" : ""}"></span>
          </div>
          <div class="vl-space-controls">
            <button class="vl-space-arrow no-zoom" id="vlLeftBtn" type="button" aria-label="Move left">‹</button>
            <button class="vl-space-arrow no-zoom" id="vlRightBtn" type="button" aria-label="Move right">›</button>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;
    wireBonusMenuOnly();
    syncGameMenuOpenState();
    wireAstroControls();
  }

  function renderEnd() {
    const timeSecs = (totalElapsedMs() / 1000).toFixed(1);

    let gameMessage = `Time: ${timeSecs}s`;

    if (state.bonusOutcome === "success") {
      gameMessage = `You reached the moon! Time: ${timeSecs}s`;
    } else if (state.bonusOutcome === "crash") {
      gameMessage = `Rocket crashed, but the verse was built. Time: ${timeSecs}s`;
    }

    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🚀",
      mode: state.mode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: state.completionResult,
      gameMessage,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: () => setScreen("mode"),
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function prevChoice() { if (state.busy || state.completed || !state.choices.length) return; state.choiceIndex = (state.choiceIndex - 1 + state.choices.length) % state.choices.length; render(); }
  function nextChoice() { if (state.busy || state.completed || !state.choices.length) return; state.choiceIndex = (state.choiceIndex + 1) % state.choices.length; render(); }

  function wireGameScreen() {
    const menuPill = $("#vlMenuPill");
    const prevBtn = $("#vlPrevBtn"), nextBtn = $("#vlNextBtn");
    if (prevBtn) prevBtn.onclick = prevChoice;
    if (nextBtn) nextBtn.onclick = nextChoice;
    document.querySelectorAll("[data-choice-id]").forEach(el => { el.onclick = () => handleLaunch(el.dataset.choiceId); });

    window.VerseGameShell.wireGameMenu({
      id: "vlGameMenuOverlay",
      menuButtonId: "vlMenuPill",
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

        const menuOverlay = $("#vlGameMenuOverlay");
        if (menuOverlay) {
          menuOverlay.classList.remove("is-open");
          menuOverlay.setAttribute("aria-hidden", "true");
        }

        window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
      },
      onModeSelect: () => {
        state.menuOpen = false;
        state.helpOpen = false;
        state.helpBackMode = false;
        state.busy = false;
        setScreen("mode");
      },
      onExit: () => window.VerseGameBridge.exitGame(),
      onOpen: () => {
        if (!canOpenGameMenu()) return false;

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

  function wireBonusMenuOnly() {
    const menuPill = $("#vlMenuPill");

    window.VerseGameShell.wireGameMenu({
      id: "vlGameMenuOverlay",
      menuButtonId: "vlMenuPill",
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
        state.astroMoveDir = 0;

        const menuOverlay = $("#vlGameMenuOverlay");
        if (menuOverlay) {
          menuOverlay.classList.remove("is-open");
          menuOverlay.setAttribute("aria-hidden", "true");
        }

        window.VerseGameShell.openHelp(HELP_OVERLAY_ID, "back", "Back");
      },
      onModeSelect: () => {
        state.menuOpen = false;
        state.helpOpen = false;
        state.helpBackMode = false;
        state.busy = false;
        state.astroMoveDir = 0;
        stopAstroLoop();
        setScreen("mode");
      },
      onExit: () => {
        stopAstroLoop();
        window.VerseGameBridge.exitGame();
      },
      onOpen: () => {
        if (!canOpenGameMenu()) return false;

        state.menuOpen = true;
        state.helpOpen = false;
        state.helpBackMode = false;
        state.astroMoveDir = 0;
      },
      onClose: () => {
        state.menuOpen = false;
        state.astroMoveDir = 0;
      },
      onBackFromHelp: () => {
        state.helpOpen = false;
        state.menuOpen = true;
        state.helpBackMode = false;
        state.astroMoveDir = 0;
      }
    });

  }

  function wireAstroControls() {
    const leftBtn = $("#vlLeftBtn");
    const rightBtn = $("#vlRightBtn");

    function setDir(dir) {
      if (!state.astroMoonPhase) state.astroMoveDir = dir;
    }

    function clearDir(dir) {
      if (state.astroMoveDir === dir) state.astroMoveDir = 0;
    }

    [["pointerdown", -1], ["pointerup", -1], ["pointercancel", -1], ["pointerleave", -1]].forEach(() => { });

    if (leftBtn) {
      leftBtn.onpointerdown = (e) => { e.preventDefault(); setDir(-1); };
      leftBtn.onpointerup = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.onpointercancel = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.onpointerleave = (e) => { e.preventDefault(); clearDir(-1); };
      leftBtn.oncontextmenu = (e) => e.preventDefault();
    }

    if (rightBtn) {
      rightBtn.onpointerdown = (e) => { e.preventDefault(); setDir(1); };
      rightBtn.onpointerup = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.onpointercancel = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.onpointerleave = (e) => { e.preventDefault(); clearDir(1); };
      rightBtn.oncontextmenu = (e) => e.preventDefault();
    }
  }

  function flashWrongBoard() {
    const el = $("#vlRedFlash");
    if (!el) return;
    el.classList.remove("is-flashing"); void el.offsetWidth; el.classList.add("is-flashing");
  }

  function spawnSmoke(x, y, count = 8, options = {}) {
    const layer = $("#vlSmokeLayer") || document.body;
    const {
      spreadX = 30,
      spreadY = 16,
      size = 18,
      color = "rgba(255,255,255,.68)"
    } = options;

    for (let i = 0; i < count; i++) {
      const puff = document.createElement("div");
      puff.className = "vl-smoke-puff";
      puff.style.left = `${x + (Math.random() * spreadX - spreadX / 2)}px`;
      puff.style.top = `${y + (Math.random() * spreadY - spreadY / 2)}px`;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;
      puff.style.setProperty("--vl-smoke-color", color);
      puff.style.setProperty("--sx", `${Math.round(Math.random() * 28 - 14)}px`);
      puff.style.setProperty("--sy", `${Math.round(-16 - Math.random() * 26)}px`);
      layer.appendChild(puff);
      puff.addEventListener("animationend", () => puff.remove(), { once: true });
    }
  }

  function spawnFireworks(x, y) {
    const layer = $("#vlFireworkLayer") || document.body;
    const palette = ["#ffffff", "#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#ff8cc8"];
    const count = 28 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "vl-firework";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", `${Math.round(Math.random() * 160 - 80)}px`);
      p.style.setProperty("--dy", `${Math.round(Math.random() * 160 - 80)}px`);
      p.style.setProperty("--pcolor", palette[i % palette.length]);
      layer.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function getModeMedal(mode) { return mode === "easy" ? "🥉" : mode === "medium" ? "🥈" : mode === "hard" ? "🥇" : "🏅"; }

  function getRocketByKey(key) {
    return ROCKETS.find(r => r.key === key) || ROCKETS[0];
  }

  function getSmokeTrailColor() {
    if (state.astroHits <= 0) return "#ffc751";
    if (state.astroHits === 1) return "#ffa351";
    return "#ff5a51";
  }

  function getBonusRocket() {
    return getRocketByKey(state.bonusRocketColorKey || "red");
  }

  async function finalizeBonusOutcome(success) {
    state.completed = true;
    state.endTime = performance.now();
    state.bonusOutcome = success ? "success" : "crash";

    try {
      state.completionResult = await window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: state.mode,
        startedAt: state.startTime,
        stats: {
          bonusOutcome: state.bonusOutcome,
          astroHits: state.astroHits,
          timeSecs: Number((totalElapsedMs() / 1000).toFixed(1))
        }
      });
    } catch (err) {
      console.error("completeGameRun failed", err);
      state.completionResult = {
        ok: false,
        alreadyCompleted: false,
        newlyCompleted: false,
        reward: {
          ok: false,
          petUnlockTriggered: false
        }
      };
    }

    const alreadyEarned = !!state.completionResult.alreadyCompleted;
    state.bonusMedalAlreadyEarned = alreadyEarned;

    if (success) {
      if (alreadyEarned) {
        state.medalMessage = "Mission accomplished!";
        state.medalSubmessage = "You reached the moon again. Try to beat your time!";
      } else {
        state.medalMessage = `Mission accomplished! You earned a ${getModeMedal(state.mode)}`;
        state.medalSubmessage = "You reached the moon!";
      }
    } else {
      if (alreadyEarned) {
        state.medalMessage = "Rocket lost!";
        state.medalSubmessage = "You already earned this medal. Try again for a cleaner run!";
      } else {
        state.medalMessage = `Launch complete! You earned a ${getModeMedal(state.mode)}`;
        state.medalSubmessage = "You built the verse, but your rocket crashed.";
      }
    }

    state.busy = false;
    setScreen("end");
  }

  function stopAstroLoop() {
    if (state.astroRaf) {
      cancelAnimationFrame(state.astroRaf);
      state.astroRaf = 0;
    }
    state.astroRunning = false;
  }

  function safeLeftPct(x) {
    return Math.max(0.08, Math.min(0.92, x));
  }

  function modeAstroMultiplier() {
    return ASTRO_MODE_MULTIPLIER[state.mode] || 1;
  }

  function maybeSpawnAsteroid(dtMs, stageWidth) {
    if (state.astroMoonPhase || state.astroDrainPhase) return;

    state.astroSpawnCooldownMs = Math.max(0, state.astroSpawnCooldownMs - dtMs);
    if (state.astroSpawnCooldownMs > 0) return;

    const chancePerSecond = 1.45;
    const roll = Math.random();
    if (roll > chancePerSecond * (dtMs / 1000)) return;

    const size = 44 + Math.random() * 22;

    const leftBound = 0.14;
    const rightBound = 0.86;
    const minGapPct = stageWidth < 420 ? 0.26 : stageWidth < 560 ? 0.22 : 0.18;

    const candidates = [];
    for (let i = 0; i < 7; i++) {
      candidates.push(leftBound + ((rightBound - leftBound) * (i / 6)));
    }

    const playerX = state.astroPlayerX;
    const source = candidates.filter(x => {
      return state.astroLastSpawnX < 0 || Math.abs(x - state.astroLastSpawnX) >= (minGapPct * 0.82);
    });

    const usable = source.length ? source : candidates;
    const weightedPool = [];

    usable.forEach(x => {
      const distFromPlayer = Math.abs(x - playerX);

      if (distFromPlayer >= (minGapPct * 0.75)) {
        weightedPool.push(x, x);
      } else if (distFromPlayer >= (minGapPct * 0.32)) {
        weightedPool.push(x, x);
      } else {
        weightedPool.push(x, x, x);
      }
    });

    const pool = weightedPool.length ? weightedPool : usable;
    const chosenX = pool[Math.floor(Math.random() * pool.length)];

    state.astroAsteroids.push({
      id: `ast_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      x: chosenX,
      yPx: -size - 20,
      size,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() * 90) - 45
    });

    state.astroLastSpawnX = chosenX;
    state.astroSpawnCooldownMs = stageWidth < 420 ? 420 : stageWidth < 560 ? 340 : 280;
  }

  function asteroidSpeedPxPerSec(viewH) {
    return (ASTRO_BASE_SPEED_VH_PER_SEC / 100) * viewH * modeAstroMultiplier();
  }

  function resetMoonOffscreen() {
    const moon = $("#vlMoon");
    if (moon) {
      const moonHeight = moon.getBoundingClientRect().height || 240;
      state.astroMoonY = -moonHeight - 24;
    } else {
      state.astroMoonY = -340;
    }
  }

  async function playLaunchCountdown() {
    const host =
      document.querySelector(".vl-flight-space") ||
      document.querySelector(".vl-bonus-stage") ||
      document.body;

    const overlay = document.createElement("div");
    overlay.className = "vl-countdown-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const box = document.createElement("div");
    box.className = "vl-countdown-box";
    overlay.appendChild(box);
    host.appendChild(overlay);

    for (const value of ["3", "2", "1"]) {
      box.textContent = value;
      box.classList.remove("is-pop");
      void box.offsetWidth;
      box.classList.add("is-pop");
      await sleep(520);
    }

    overlay.remove();
    state.countdownValue = "";
  }

  async function animateLaunch(choice, sourceEl) {
    const sourceRocket = sourceEl?.querySelector(".vl-rocket") || sourceEl;
    const sourceBubble = sourceEl?.querySelector(".vl-choice-bubble") || sourceEl;
    const buildRect = $("#vlBuild")?.getBoundingClientRect();
    if (!sourceRocket || !sourceBubble || !buildRect) return;

    const rocketRect = sourceRocket.getBoundingClientRect();
    const bubbleRect = sourceBubble.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();
    const unit = document.createElement("div");
    unit.className = "vl-flight-unit";
    unit.innerHTML = `<img class="vl-flight-rocket" src="${choice.rocket.src}" alt=""><div class="vl-flight-label ${choice.rocket.textDark ? "vl-text-dark" : ""}" style="background:${choice.rocket.color}">${escapeHtml(choice.label)}</div>`;
    document.body.appendChild(unit);

    const unitRect = unit.getBoundingClientRect();
    unit.style.left = `${rocketRect.left + (rocketRect.width / 2) - (unitRect.width / 2)}px`;
    unit.style.top = `${rocketRect.top - 8}px`;

    const startX = rocketRect.left + rocketRect.width / 2;
    const startY = rocketRect.top + rocketRect.height / 2;
    const endX = buildRect.left + buildRect.width / 2;
    const endY = buildRect.top + buildRect.height / 2;

    const smokeStartX = startX - smokeLayerRect.left;
    const smokeStartY = startY - smokeLayerRect.top;
    const smokeBubbleBottom = bubbleRect.bottom - smokeLayerRect.top;

    sourceEl.classList.add("is-hidden-during-flight");
    spawnSmoke(smokeStartX, smokeBubbleBottom - 4, 5);
    await sleep(220);
    spawnSmoke(smokeStartX, smokeBubbleBottom - 6, 8);

    unit.style.transition = "transform 240ms ease, opacity 240ms ease";
    unit.style.transform = "translate(0,-22px) scale(.98)";
    unit.style.opacity = "1";
    await sleep(240);

    const dx = Math.round(endX - startX);
    const dy = Math.round(endY - startY);

    unit.style.transition = "transform 640ms cubic-bezier(.12,.2,.18,1), opacity 640ms linear";
    unit.style.transform = `translate(${dx}px, ${dy}px) scale(.44)`;
    unit.style.opacity = ".96";

    const frames = 8;
    await sleep(40);
    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      spawnSmoke(
        smokeStartX + dx * t * 0.65,
        smokeStartY + dy * t * 0.65 + 64,
        2
      );
      await sleep(26);
    }
    await sleep(640);
    unit.remove();
    sourceEl.classList.remove("is-hidden-during-flight");
    spawnFireworks(endX, endY);
  }

  function showBuildShake() {
    const build = $("#vlBuild");
    if (!build) return;
    build.classList.remove("vl-shake"); void build.offsetWidth; build.classList.add("vl-shake");
  }

  function spawnWordBurst(x, y, opts = {}) {
    const layer = document.getElementById("vlFireworkLayer") || document.getElementById("vlSmokeLayer");
    if (!layer) return;

    const count = opts.count ?? 9;
    const distance = opts.distance ?? 54;
    const jitter = opts.jitter ?? 5;
    const duration = opts.duration ?? 620;
    const cloudSize = opts.cloudSize ?? 70;
    const colors = opts.colors ?? ["#ffffff", "#ffd54f", "#ff8a65"];
    const sizePool = opts.sizePool ?? [8, 10, 12, 15, 18];

    const burst = document.createElement("div");
    burst.className = "vl-word-burst";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    const burstBoxSize = Math.max(128, Math.ceil((distance + cloudSize) * 2.05));
    burst.style.width = `${burstBoxSize}px`;
    burst.style.height = `${burstBoxSize}px`;

    const cloud = document.createElement("div");
    cloud.className = "vl-word-burst-cloud";
    cloud.style.setProperty("--vl-word-burst-cloud-size", `${cloudSize}px`);
    cloud.style.setProperty("--vl-word-burst-cloud-dur", `${Math.max(500, duration - 90)}ms`);
    cloud.innerHTML = WORD_BURST_CLOUD_SVG;
    burst.appendChild(cloud);

    const baseAngle = Math.random() * Math.PI * 2;
    const step = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + step * i + rand(-0.12, 0.12);
      const dist = distance + rand(-jitter, jitter);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const size = pickRandom(sizePool) + rand(-0.5, 0.5);
      const particle = document.createElement("div");
      particle.className = "vl-word-burst-particle";
      particle.style.setProperty("--vl-word-burst-size", `${size.toFixed(1)}px`);
      particle.style.setProperty("--vl-word-burst-dur", `${duration}ms`);
      particle.style.setProperty("--vl-word-burst-start-scale", `${rand(0.68, 0.82).toFixed(2)}`);
      particle.style.setProperty("--vl-word-burst-end-scale", `${rand(1.10, 1.24).toFixed(2)}`);
      particle.style.setProperty("--vl-word-burst-tx", `${tx.toFixed(1)}px`);
      particle.style.setProperty("--vl-word-burst-ty", `${ty.toFixed(1)}px`);
      particle.style.setProperty("--vl-word-burst-delay", `${Math.round(rand(0, 18))}ms`);
      particle.style.background = colors[i % colors.length];
      burst.appendChild(particle);
    }

    layer.appendChild(burst);

    requestAnimationFrame(() => {
      cloud.classList.add("is-live");
      burst.querySelectorAll(".vl-word-burst-particle").forEach((particle) => {
        const delay = Number.parseInt(particle.style.getPropertyValue("--vl-word-burst-delay"), 10) || 0;
        window.setTimeout(() => particle.classList.add("is-live"), delay);
      });
    });

    window.setTimeout(() => burst.remove(), duration + 140);
  }


  async function animateFailedLaunch(sourceEl) {
    const rocket = sourceEl?.querySelector(".vl-rocket");
    if (!rocket) {
      const rect = sourceEl?.getBoundingClientRect();
      const layerRect = (document.getElementById("vlFireworkLayer") || document.body).getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2 - layerRect.left;
        const centerY = rect.top + rect.height / 2 - layerRect.top;
        const sizeBase = Math.max(48, Math.min(rect.width, 96));

        sourceEl.classList.add("is-wrong-choice");

        if (sourceEl.animate) {
          sourceEl.animate(
            [
              { filter: "brightness(1)" },
              { filter: "brightness(1.25)" },
              { filter: "brightness(1)" }
            ],
            { duration: 260, easing: "ease" }
          );
        }

        spawnWordBurst(centerX, centerY, {
          count: 9,
          distance: Math.round(sizeBase * 0.72),
          jitter: Math.round(sizeBase * 0.08),
          duration: 620,
          cloudSize: Math.round(sizeBase * 0.88),
          colors: ["#ffffff"],
          sizePool: [8, 10, 12, 15, 18]
        });

        await sleep(420);
        sourceEl.classList.remove("is-wrong-choice");
      }
      return;
    }

    const rocketRect = rocket.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();

    const centerX = rocketRect.left + rocketRect.width / 2 - smokeLayerRect.left;
    const centerY = rocketRect.top + rocketRect.height / 2 - smokeLayerRect.top;
    const smokeSize = Math.round(rocketRect.width * 1.5);

    spawnSmoke(centerX, centerY, 22, {
      spreadX: smokeSize * 0.50,
      spreadY: smokeSize * 0.50,
      size: smokeSize,
      color: "rgba(70,70,70,.82)"
    });

    await sleep(280);
  }

  async function animateBonusLaunch(sourceEl) {
    const rocket = sourceEl?.querySelector(".vl-rocket");
    const button = sourceEl?.querySelector(".vl-star-launch-btn");
    if (!rocket || !button) return;

    const rocketRect = rocket.getBoundingClientRect();
    const smokeLayerRect = ($("#vlSmokeLayer") || document.body).getBoundingClientRect();
    const startX = rocketRect.left + rocketRect.width / 2;
    const startY = rocketRect.top + rocketRect.height / 2;
    const smokeX = startX - smokeLayerRect.left;
    const smokeY = startY - smokeLayerRect.top;

    const unit = document.createElement("div");
    unit.className = "vl-flight-unit";
    unit.innerHTML = `<img class="vl-flight-rocket" src="${rocket.getAttribute("src")}" alt="">`;
    document.body.appendChild(unit);

    const unitRect = unit.getBoundingClientRect();
    unit.style.left = `${rocketRect.left + (rocketRect.width / 2) - (unitRect.width / 2)}px`;
    unit.style.top = `${rocketRect.top - 8}px`;

    sourceEl.classList.add("is-hidden-during-flight");
    spawnSmoke(smokeX, smokeY + 42, 8, { color: getSmokeTrailColor() });
    await sleep(220);
    spawnSmoke(smokeX, smokeY + 38, 10, { color: getSmokeTrailColor() });

    unit.style.transition = "transform 220ms ease, opacity 220ms ease";
    unit.style.transform = "translate(0,-26px) scale(.98)";
    await sleep(220);

    const endY = -window.innerHeight - 200;
    unit.style.transition = "transform 980ms cubic-bezier(.12,.2,.18,1), opacity 980ms linear";
    unit.style.transform = `translate(0, ${endY}px) scale(.42)`;
    unit.style.opacity = ".96";

    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      spawnSmoke(smokeX, smokeY - (window.innerHeight * 0.75 * t), 2, { color: getSmokeTrailColor() });
      await sleep(36);
    }

    await sleep(980);
    unit.remove();
    sourceEl.classList.remove("is-hidden-during-flight");
  }

  async function startBonusSequence() {
    setScreen("travel");
    await sleep(220);

    const rocket = $("#vlTravelRocket");
    const smokeLayer = $("#vlTravelSmoke");
    if (rocket) {
      const startBottom = -120;
      const endBottom = window.innerHeight + 120;
      rocket.animate(
        [
          { transform: "translateX(-50%) translateY(0)" },
          { transform: `translateX(-50%) translateY(${-endBottom}px)` }
        ],
        { duration: 1600, easing: "cubic-bezier(.15,.6,.2,1)", fill: "forwards" }
      );
    }

    for (let i = 0; i < 20; i++) {
      const y = window.innerHeight - (i * 34);
      const x = window.innerWidth / 2;
      spawnSmoke(x, y, 2, { color: getSmokeTrailColor() });
      await sleep(42);
    }

    const travelText = $("#vlTravelText");
    if (travelText) {
      travelText.classList.add("is-visible");
    }
    state.bonusTravelTextVisible = true;
    await sleep(1400);

    const fade = document.querySelector(".vl-screen-fade");
    if (fade) {
      fade.classList.add("is-active");
    }
    state.bonusFadeActive = true;
    await sleep(430);

    state.bonusFadeActive = false;
    state.bonusTravelTextVisible = false;
    setScreen("asteroids");
    startAstroLoop();
  }

  function renderAstroEntities() {
    const stage = $("#vlAstroStage");
    const layer = $("#vlSpaceLayer");
    const rocket = $("#vlPlayerRocket");
    const moon = $("#vlMoon");
    const trail = $("#vlPlayerTrail");
    if (!stage || !layer || !rocket || !moon || !trail) return;

    const rect = stage.getBoundingClientRect();
    const leftPx = rect.width * state.astroPlayerX;
    rocket.style.left = `${leftPx}px`;
    rocket.style.transform = `translateX(-50%) translateY(${-state.astroPlayerLiftPx}px) rotate(${state.astroPlayerTilt + state.astroSpinDeg}deg) scale(${state.astroPlayerScale})`;

    trail.innerHTML = "";
    const trailColor = getSmokeTrailColor();
    const baseY = rect.height - 118;
    const spinOffsetX = Math.sin((state.astroSpinDeg || 0) * (Math.PI / 180)) * 4;

    for (let i = 0; i < 7; i++) {
      const puff = document.createElement("div");
      puff.className = "vl-smoke-puff";

      const size = 14 + (i * 3);
      const driftX = Math.round((Math.random() * 18 - 9) + spinOffsetX);
      const driftY = Math.round(14 + Math.random() * 14);
      const xJitter = Math.round(Math.random() * 12 - 6);
      const yPos = baseY + (i * 12);

      puff.style.left = `${leftPx + xJitter}px`;
      puff.style.top = `${yPos}px`;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;
      puff.style.opacity = `${Math.max(0.22, 0.72 - (i * 0.07))}`;
      puff.style.setProperty("--vl-smoke-color", trailColor);
      puff.style.setProperty("--sx", `${driftX}px`);
      puff.style.setProperty("--sy", `${driftY}px`);
      trail.appendChild(puff);
    }

    layer.querySelectorAll(".vl-asteroid").forEach(n => n.remove());
    state.astroAsteroids.forEach(ast => {
      const img = document.createElement("img");
      img.className = "vl-asteroid";
      img.src = "./verse_launch_images/verse_launch_asteroid.png";
      img.style.width = `${ast.size}px`;
      img.style.height = `${ast.size}px`;
      img.style.left = `${rect.width * ast.x - ast.size / 2}px`;
      img.style.top = `${ast.yPx}px`;
      img.style.transform = `rotate(${ast.rot}deg)`;
      layer.appendChild(img);
    });

    moon.style.top = `${state.astroMoonY}px`;
    moon.classList.toggle("is-visible", !!state.astroMoonVisible);
  }

  function asteroidHitTest(stageRect, asteroid) {
    const rocketX = stageRect.width * state.astroPlayerX;
    const rocketY = stageRect.height - 118 - 42;
    const rocketW = 84 * ASTRO_HITBOX_SCALE;
    const rocketH = 84 * ASTRO_HITBOX_SCALE;

    const astW = asteroid.size * ASTRO_HITBOX_SCALE;
    const astH = asteroid.size * ASTRO_HITBOX_SCALE;
    const astX = stageRect.width * asteroid.x;
    const astY = asteroid.yPx + asteroid.size / 2;

    return Math.abs(rocketX - astX) < (rocketW + astW) / 2 &&
      Math.abs(rocketY - astY) < (rocketH + astH) / 2;
  }

  async function astroHandleHit() {
    if (state.astroInvulnerable || state.astroMoonPhase) return;
    state.astroInvulnerable = true;
    state.astroHits += 1;

    const rocket = $("#vlPlayerRocket");
    const isFatalHit = (state.astroHits >= 3);

    state.astroSpinDeg = 0;
    state.astroSpinMs = isFatalHit ? 0 : 1000;

    if (rocket) {
      rocket.classList.remove("is-hit", "is-flash", "is-despawned");
      void rocket.offsetWidth;
      if (!isFatalHit) {
        rocket.classList.add("is-flash");
      }
    }

    if (state.astroHits >= 3) {
      const stage = $("#vlAstroStage")?.getBoundingClientRect();
      const rocket = $("#vlPlayerRocket");

      if (stage) {
        const centerX = stage.width * state.astroPlayerX;
        const centerY = stage.height - 118;
        const smokeSize = 126;

        spawnSmoke(centerX, centerY, 22, {
          spreadX: smokeSize * 0.50,
          spreadY: smokeSize * 0.50,
          size: smokeSize,
          color: "rgba(255,255,255,.92)"
        });
      }

      if (rocket) {
        rocket.classList.add("is-despawned");
      }
      state.astroSpinDeg = 0;
      state.astroSpinMs = 0;

      await sleep(900);
      stopAstroLoop();
      await finalizeBonusOutcome(false);
      return;
    }

    renderAstroEntities();
    await sleep(1000);
    state.astroInvulnerable = false;
  }

  function astroTick(ts) {
    if (!state.astroRunning) return;
    if (!state.astroLastTs) state.astroLastTs = ts;
    const dtMs = Math.min(34, ts - state.astroLastTs);
    state.astroLastTs = ts;

    const stage = $("#vlAstroStage");
    if (!stage) {
      state.astroRaf = requestAnimationFrame(astroTick);
      return;
    }

    const rect = stage.getBoundingClientRect();
    if (state.menuOpen || state.helpOpen) {
      state.astroLastTs = ts;
      renderAstroEntities();
      state.astroRaf = requestAnimationFrame(astroTick);
      return;
    }
    const dtSec = dtMs / 1000;
    const moveSpeed = 0.62 * dtSec;
    state.astroPlayerX = safeLeftPct(state.astroPlayerX + state.astroMoveDir * moveSpeed);
    const targetTilt = state.astroMoveDir === 0 ? 0 : (state.astroMoveDir < 0 ? -12 : 12);
    state.astroPlayerTilt += (targetTilt - state.astroPlayerTilt) * 0.18;

    if (state.astroSpinMs > 0) {
      const spinStep = 360 * dtSec;
      state.astroSpinDeg += spinStep;
      state.astroSpinMs = Math.max(0, state.astroSpinMs - dtMs);
    }

    if (state.astroSpinMs <= 0 && state.astroSpinDeg !== 0) {
      state.astroSpinDeg *= 0.82;
      if (Math.abs(state.astroSpinDeg) < 2) {
        state.astroSpinDeg = 0;
      }
    }

    if (state.astroSpinDeg > 180) {
      state.astroSpinDeg -= 360;
    } else if (state.astroSpinDeg < -180) {
      state.astroSpinDeg += 360;
    }

    if (!state.astroMoonPhase) {
      state.astroTimerMs += dtMs;
      maybeSpawnAsteroid(dtMs, rect.width);

      const fallSpeed = asteroidSpeedPxPerSec(rect.height);
      state.astroAsteroids.forEach(ast => {
        ast.yPx += fallSpeed * dtSec;
        ast.rot += ast.rotSpeed * dtSec;
      });
      state.astroAsteroids = state.astroAsteroids.filter(ast => ast.yPx < rect.height + ast.size + 20);

      if (!state.astroInvulnerable) {
        for (const ast of state.astroAsteroids) {
          if (asteroidHitTest(rect, ast)) {
            astroHandleHit();
            break;
          }
        }
      }

      if (state.astroTimerMs >= ASTRO_DURATION_MS) {
        state.astroMoonPhase = true;
        state.astroDrainPhase = true;
        state.astroMoveDir = 0;
      }
    } else {
      const fallSpeed = asteroidSpeedPxPerSec(rect.height);
      state.astroAsteroids.forEach(ast => {
        ast.yPx += fallSpeed * dtSec;
        ast.rot += ast.rotSpeed * dtSec;
      });
      state.astroAsteroids = state.astroAsteroids.filter(ast => ast.yPx < rect.height + ast.size + 20);

      if (state.astroDrainPhase) {
        state.astroPlayerTilt *= 0.88;

        if (state.astroAsteroids.length === 0) {
          state.astroDrainPhase = false;
        }
      } else if (!state.astroLandingPhase) {
        const moonTargetY = rect.height * 0.14;
        const moonRiseSpeed = rect.height * 0.0038;

        state.astroMoonVisible = true;

        if (state.astroMoonY < moonTargetY) {
          state.astroMoonY = Math.min(moonTargetY, state.astroMoonY + moonRiseSpeed);
          state.astroPlayerTilt *= 0.90;
        } else {
          state.astroMoonDone = true;
          state.astroLandingPhase = true;
          state.astroMoveDir = 0;
        }
      } else {
        const targetX = 0.5;
        const targetLiftPx = rect.height * 0.42;
        const targetScale = 0.05;

        state.astroPlayerX += (targetX - state.astroPlayerX) * 0.08;
        state.astroPlayerLiftPx += (targetLiftPx - state.astroPlayerLiftPx) * 0.08;
        state.astroPlayerScale += (targetScale - state.astroPlayerScale) * 0.08;
        state.astroPlayerTilt *= 0.90;

        const centered = Math.abs(targetX - state.astroPlayerX) < 0.008;
        const lifted = Math.abs(targetLiftPx - state.astroPlayerLiftPx) < 3;
        const scaled = Math.abs(targetScale - state.astroPlayerScale) < 0.02;

        if (centered && lifted && scaled) {
          stopAstroLoop();
          finalizeBonusOutcome(true);
          return;
        }
      }
    }

    renderAstroEntities();
    state.astroRaf = requestAnimationFrame(astroTick);
  }

  function startAstroLoop() {
    state.astroRunning = true;
    state.astroLastTs = 0;
    state.astroTimerMs = 0;
    state.astroHits = 0;
    state.astroInvulnerable = false;
    state.astroPlayerX = 0.5;
    state.astroMoveDir = 0;
    state.astroPlayerTilt = 0;
    state.astroSpinDeg = 0;
    state.astroSpinMs = 0;
    state.astroAsteroids = [];
    state.astroSpawnCooldownMs = 0;
    state.astroLastSpawnX = -1;
    state.astroDrainPhase = false;
    state.astroMoonPhase = false;
    state.astroMoonDone = false;
    state.astroLandingPhase = false;
    state.astroPlayerLiftPx = 0;
    state.astroPlayerScale = 1;

    renderAstroEntities();
    resetMoonOffscreen();
    renderAstroEntities();
    state.astroMoonVisible = false;

    state.astroRaf = requestAnimationFrame(astroTick);
  }

  async function finishGame() {
    state.completed = true;
    state.endTime = performance.now();

    try {
      state.completionResult = await window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: state.mode,
        startedAt: state.startTime,
        stats: {
          timeSecs: Number((totalElapsedMs() / 1000).toFixed(1)),
          progressIndex: state.progressIndex
        }
      });
    } catch (err) {
      console.error("completeGameRun failed", err);
      state.completionResult = {
        ok: false,
        alreadyCompleted: false,
        newlyCompleted: false,
        reward: {
          ok: false,
          petUnlockTriggered: false
        }
      };
    }

    const alreadyEarned = !!state.completionResult.alreadyCompleted;

    if (alreadyEarned) {
      state.medalMessage = "Great job!";
      state.medalSubmessage = "You finished Verse Launch!";
    } else {
      state.medalMessage = `Well done! You earned a ${getModeMedal(state.mode)}`;
      state.medalSubmessage = "You finished Verse Launch!";
    }

    state.busy = false;
    setScreen("end");
  }

  async function handleLaunch(choiceId) {
    if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;

    if (choiceId === "bonus_launch") {
      state.busy = true;
      await playLaunchCountdown();

      const liveSourceEl =
        document.querySelector(`.vl-conveyor-choice[data-choice-id="${choiceId}"]`) ||
        document.querySelector(`.vl-main-launcher[data-choice-id="${choiceId}"]`) ||
        document.querySelector(`.vl-launcher-hitbox[data-choice-id="${choiceId}"]`)?.closest(".vl-main-launcher");

      if (!liveSourceEl) {
        state.busy = false;
        render();
        return;
      }

      await animateBonusLaunch(liveSourceEl);
      state.busy = false;
      await startBonusSequence();
      return;
    }

    const choice = state.choices.find(c => c.id === choiceId);
    if (!choice) return;

    state.busy = true;

    const shouldShowInitialCountdown =
      !state.hasShownInitialCountdown &&
      currentPhase() === "words" &&
      state.progressIndex === 0;

    if (shouldShowInitialCountdown) {
      state.hasShownInitialCountdown = true;
      await playLaunchCountdown();
    }

    const liveSourceEl =
      document.querySelector(`.vl-conveyor-choice[data-choice-id="${choiceId}"]`) ||
      document.querySelector(`.vl-main-launcher[data-choice-id="${choiceId}"]`) ||
      document.querySelector(`.vl-launcher-hitbox[data-choice-id="${choiceId}"]`)?.closest(".vl-main-launcher");

    if (!liveSourceEl) {
      state.busy = false;
      render();
      return;
    }

    if (choice.isCorrect) {
      await fadeOutConveyor();
      await animateLaunch(choice, liveSourceEl);
      state.progressIndex += 1;

      if (state.progressIndex >= state.segments.length) {
        state.bonusReady = true;
        state.busy = false;
        render();
        return;
      }

      buildChoices();
      state.busy = false;
      render();
      return;
    }

    await animateFailedLaunch(liveSourceEl);
    flashWrongBoard();
    showBuildShake();

    await sleep(140);

    state.busy = false;
  }

  function setScreen(screen) { state.screen = screen; render(); }
  function render() {
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "travel") return renderTravel();
    if (state.screen === "asteroids") return renderAsteroidGame();
    if (state.screen === "end") return renderEnd();
  }

  setScreen("intro");
})();
