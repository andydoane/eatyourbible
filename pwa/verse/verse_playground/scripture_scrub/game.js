(async function () {
  const app = document.getElementById("app");

  if (app) {
    app.classList.remove("vm-shell");
    app.classList.add("scripture-scrub-app");
  }

  const ctx = await window.VerseGameBridge.getVerseContext();
  const launchParams = window.VerseGameBridge.getLaunchParams?.() || {};

  const GAME_ID = "scripture_scrub";
  const GAME_TITLE = "Scripture Scrub";
  const GAME_ICON = "🧽";
  const HELP_OVERLAY_ID = "scriptureScrubHelpOverlay";
  const MENU_OVERLAY_ID = "scriptureScrubMenuOverlay";

  // Dev-only shortcut: long-press the sponge on the title screen to jump here.
  // Set to one of: "mud", "paint", "fog", "leaves", "stickers", "mower", "archaeology"
  // Set to null to disable.
  const DEBUG_SKIP_ROUND_ID = "chalkboard";
  const DEBUG_SKIP_LONG_PRESS_MS = 900;

  const SCRUB_GRADIENT = "linear-gradient(145deg, #7f66c6 0%, #40b9c5 100%)";

  const GAME_THEME = {
    bg: SCRUB_GRADIENT,
    accent: "#40b9c5",
    helpTitleBg: "#40b9c5",
    helpTitleColor: "#ffffff",
    helpCloseBg: "#ffc751",
    helpCloseColor: "#333333"
  };

  const SPECIAL_COLORS = [
    "#ff5a51",
    "#ffa351",
    "#ffc751",
    "#a7cb6f",
    "#40b9c5",
    "#7f66c6"
  ];

  const DEFAULT_CANVAS_COMPLETION_THRESHOLD = 0.95;
  const DEFAULT_BRUSH_RADIUS = 38;
  const RESPONSIVE_BRUSH_MIN = 34;
  const RESPONSIVE_BRUSH_MAX = 56;
  const RESPONSIVE_BRUSH_WIDTH_RATIO = 0.075;

  const ROUND_COMPLETION_THRESHOLDS = {
    mud: 0.95,
    paint: 0.95,
    fog: 0.92,
    chalkboard: 0.86,
    mower: 0.95,
    archaeology: 0.95
  };

  const BIBLE_REVEAL_COMPLETION_THRESHOLD = 0.96;

  const ROUNDS = [
    {
      id: "mud",
      title: "Mud",
      introTitle: "Wipe off the Mud",
      icon: "🟤",
      intro: "Wipe off the mud.",
      instruction: "Wipe away the mud.",
      kind: "canvas",
      texture: "mud",
      rewardIcon: "✨",
      rewardTitle: "Squeaky clean!"
    },
    {
      id: "paint",
      title: "Paint Splash",
      introTitle: "Clean the Paint",
      icon: "🎨",
      intro: "Clean off the paint.",
      instruction: "Clean the paint.",
      kind: "canvas",
      texture: "paint",
      rewardIcon: "🌈",
      rewardTitle: "Paint cleared!"
    },
    {
      id: "fog",
      title: "Foggy Window",
      introTitle: "Wipe the Fog",
      icon: "🪟",
      intro: "Wipe off the foggy window.",
      instruction: "Wipe the fog.",
      kind: "canvas",
      texture: "fog",
      rewardIcon: "☀️",
      rewardTitle: "Now you can see it!"
    },
    {
      id: "chalkboard",
      title: "Chalkboard Erase",
      introTitle: "Erase the Chalkboard",
      icon: "✏️",
      intro: "Erase the chalkboard.",
      instruction: "Erase the chalk.",
      kind: "chalkboard",
      rewardIcon: "🧽",
      rewardTitle: "Board erased!"
    },
    {
      id: "leaves",
      title: "Raking Leaves",
      introTitle: "Rake the Leaves",
      icon: "🍂",
      intro: "Rake the leaves.",
      instruction: "Rake the leaves.",
      kind: "leaves",
      rewardIcon: "🍁",
      rewardTitle: "Leaves raked!"
    },
    {
      id: "stickers",
      title: "Emoji Stickers",
      introTitle: "Peel the Stickers",
      icon: "😀",
      intro: "Peel off the stickers, one at a time.",
      instruction: "Peel the stickers.",
      kind: "stickers",
      rewardIcon: "⭐",
      rewardTitle: "Stickers peeled!"
    },

    {
      id: "mower",
      title: "Mowing Grass",
      introTitle: "Mow the Grass",
      icon: "🌱",
      intro: "Mow the grass.",
      instruction: "Tap a spot to send the mower.",
      kind: "mower",
      rewardIcon: "🌿",
      rewardTitle: "Grass mowed!"
    },
    {
      id: "archaeology",
      title: "Archaeology",
      introTitle: "Find the Bible",
      icon: "🏺",
      intro: "Dig carefully. Find the hidden Bible!",
      instruction: "Dig carefully — uncover the Bible!",
      kind: "archaeology",
      texture: "dirt",
      rewardIcon: "📖",
      rewardTitle: "You found the Bible!"
    }
  ];

  const IMAGE_BASE = "./scripture_scrub_images/";
  const GRASS_BG_IMAGE = "scripture_scrub_grass_bg_1.jpg";
  const MOWED_GRASS_BG_IMAGE = "scripture_scrub_grass_bg_2.jpg";
  const MOWER_IMAGE = "scripture_scrub_mower.png";
  const LEAF_IMAGES = [
    "scripture_scrub_leaf_orange_1.png",
    "scripture_scrub_leaf_orange_2.png",
    "scripture_scrub_leaf_orange_3.png",
    "scripture_scrub_leaf_yellow_1.png",
    "scripture_scrub_leaf_yellow_2.png",
    "scripture_scrub_leaf_yellow_3.png",
    "scripture_scrub_leaf_red_1.png",
    "scripture_scrub_leaf_red_2.png",
    "scripture_scrub_leaf_red_3.png"
  ];

  const PAINT_BLOB_IMAGES = [
    "scripture_scrub_blob_1.svg",
    "scripture_scrub_blob_2.svg",
    "scripture_scrub_blob_3.svg",
    "scripture_scrub_blob_4.svg",
    "scripture_scrub_blob_5.svg",
    "scripture_scrub_blob_6.svg",
    "scripture_scrub_blob_7.svg",
    "scripture_scrub_blob_8.svg",
    "scripture_scrub_blob_9.svg",
    "scripture_scrub_blob_10.svg",
    "scripture_scrub_blob_11.svg"
  ];

  const STICKER_EMOJIS = ["😀", "⭐", "❤️", "🌈", "🦊", "🐬", "🍇", "🎈", "🧁", "🚀", "🌻", "🦁", "🐢", "🍕"];

  const STICKER_WORDS = [
    "WOW",
    "YAY",
    "JOY",
    "AMEN",
    "LOVE",
    "HOPE",
    "PEACE",
    "FUN",
    "COOL",
    "SHINE",
    "GREAT",
    "NEAT",
    "SUPER"
  ];

  const STICKER_STYLES = [
    { bg: "#ffe3e1", fg: "#ff5a51", border: "#ffffff" },
    { bg: "#ffe6c9", fg: "#c95b13", border: "#ffffff" },
    { bg: "#fff1bd", fg: "#7f66c6", border: "#ffffff" },
    { bg: "#e5f2cf", fg: "#4b742c", border: "#ffffff" },
    { bg: "#d8f3f6", fg: "#167987", border: "#ffffff" },
    { bg: "#e7e0ff", fg: "#7f66c6", border: "#ffffff" },
    { bg: "#ff5a51", fg: "#ffffff", border: "#ffd7d4" },
    { bg: "#ffa351", fg: "#333333", border: "#ffffff" },
    { bg: "#ffc751", fg: "#333333", border: "#ffffff" },
    { bg: "#40b9c5", fg: "#ffffff", border: "#d8f3f6" },
    { bg: "#7f66c6", fg: "#ffffff", border: "#e7e0ff" }
  ];

  const STICKER_SHAPES = [
    "circle",
    "oval",
    "tall-oval",
    "round-rect",
    "squircle"
  ];

  const STICKER_BORDERS = [
    "white",
    "color",
    "dashed",
    "none"
  ];

  const STICKER_PEEL_STYLES = [
    "scrub-sticker-peel-twist",
    "scrub-sticker-peel-slow-curl",
    "scrub-sticker-peel-slide-down",
    "scrub-sticker-peel-wobble"
  ];

  const STICKER_RECENT_LIMIT = 18;
  const stickerRecentHistory = {
    words: [],
    emojis: [],
    colors: []
  };

  let verseJson = null;
  let grassCoverImage = null;
  let mowedGrassImage = null;
  let mowerImage = null;
  let leafImages = [];
  let paintBlobImages = [];

  let currentRoundIndex = 0;
  let muted = false;
  let menuOpen = false;
  let stageEl = null;
  let coverCanvas = null;
  let coverCtx = null;
  let clearMaskCanvas = null;
  let clearMaskCtx = null;
  let dpr = 1;
  let pointerDown = false;
  let lastPoint = null;
  let completionLocked = false;
  let coverageCheckTimer = null;
  let objectTotal = 0;
  let objectCleared = 0;
  let archaeologyScore = null;
  let bibleRect = null;
  let chalkboardTargetRect = null;
  let mowerActive = false;
  let mowerFromTop = true;
  let mowerAnimationFrame = null;
  let resizeHandler = null;

  const parsedRef = window.VerseGameShell.parseReferenceParts(
    ctx.verseRef,
    ctx.translation,
    ctx.verseId
  );

  function escapeHtml(value) {
    return window.VerseGameShell.escapeHtml(String(value ?? ""));
  }

  function shuffle(array) {
    return window.VerseGameShell.shuffle(array);
  }

  function clamp(value, min, max) {
    return window.VerseGameShell.clamp(value, min, max);
  }

  function roundConfig() {
    return ROUNDS[currentRoundIndex] || ROUNDS[0];
  }

  function totalRounds() {
    return ROUNDS.length;
  }

  function currentThreshold() {
    return roundCompletionThreshold();
  }

  function roundCompletionThreshold(round = roundConfig()) {
    if (Number.isFinite(round?.completionThreshold)) return round.completionThreshold;
    if (Object.prototype.hasOwnProperty.call(ROUND_COMPLETION_THRESHOLDS, round?.id)) {
      return ROUND_COMPLETION_THRESHOLDS[round.id];
    }
    if (round?.kind === "leaves" || round?.kind === "stickers") return 1;
    return DEFAULT_CANVAS_COMPLETION_THRESHOLD;
  }

  function currentBrushRadius(round = roundConfig()) {
    if (Number.isFinite(round?.brushRadius)) return round.brushRadius;

    const width = stageEl?.getBoundingClientRect?.().width || window.innerWidth || 0;
    if (!width) return DEFAULT_BRUSH_RADIUS;

    return clamp(
      width * RESPONSIVE_BRUSH_WIDTH_RATIO,
      RESPONSIVE_BRUSH_MIN,
      RESPONSIVE_BRUSH_MAX
    );
  }

  function dismissInstructionChip() {
    const root = document.getElementById("scrubGame");
    if (root) root.classList.add("scrub-instruction-dismissed");
  }

  async function loadVerseJson() {
    const verseId = String(ctx.verseId || launchParams.verseId || "").trim();
    if (!verseId) return null;

    try {
      const res = await fetch(`../../verse_data/${verseId}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Scripture Scrub: could not load verse JSON", err);
      return null;
    }
  }

  async function waitForLocalFonts() {
    if (!document.fonts?.load) return;

    try {
      await Promise.all([
        document.fonts.load('1em "Baloo 2"'),
        document.fonts.load('1em "Titan One"'),
        document.fonts.load('1em "Chalkboard"')
      ]);

      await document.fonts.ready;
    } catch (err) {
      console.warn("Scripture Scrub: local fonts did not finish loading", err);
    }
  }

  async function loadImageAsset(fileName, label) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Scripture Scrub: could not load ${label}`, fileName);
        resolve(null);
      };
      img.src = `${IMAGE_BASE}${fileName}`;
    });
  }

  async function loadGrassBackgroundImage() {
    return loadImageAsset(GRASS_BG_IMAGE, "grass background image");
  }

  async function loadMowedGrassBackgroundImage() {
    return loadImageAsset(MOWED_GRASS_BG_IMAGE, "mowed grass background image");
  }

  async function loadMowerImage() {
    return loadImageAsset(MOWER_IMAGE, "mower image");
  }

  async function loadLeafImages() {
    const loaded = await Promise.all(LEAF_IMAGES.map((fileName) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Scripture Scrub: could not load leaf image", fileName);
        resolve(null);
      };
      img.src = `${IMAGE_BASE}${fileName}`;
    })));

    return loaded.filter(Boolean);
  }

  async function loadPaintBlobImages() {
    const loaded = await Promise.all(PAINT_BLOB_IMAGES.map((fileName) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Scripture Scrub: could not load paint blob image", fileName);
        resolve(null);
      };
      img.src = `${IMAGE_BASE}${fileName}`;
    })));

    return loaded.filter(Boolean);
  }

  function helpHtml() {
    return `
      <p><strong>Reveal the verse!</strong></p>
      <p>Scrub, wipe, rake, peel, mow, and dig!.</p>
      <p>The verse is hiding behind each cover. Clear enough of the screen to move on.</p>
    `;
  }

  function renderTitleScreen() {
    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      debugBadge: "SS 4.1",
      icon: GAME_ICON,
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      startText: "Start Scrubbing",
      helpText: "How to Play",
      backLabel: "Back to Playground",
      theme: GAME_THEME,
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: beginScrubRun
    });

    wireTitleSpongeDebugSkip();
  }

  function wireTitleSpongeDebugSkip() {
    if (!DEBUG_SKIP_ROUND_ID) return;

    const icon = app?.querySelector?.(".vm-game-icon");
    if (!icon) return;

    icon.style.cursor = "pointer";
    icon.style.touchAction = "manipulation";

    let longPressTimer = null;
    let longPressTriggered = false;

    const clearLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const startLongPress = (event) => {
      longPressTriggered = false;
      clearLongPress();

      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        jumpToDebugRound();
      }, DEBUG_SKIP_LONG_PRESS_MS);

      event.preventDefault?.();
    };

    const cancelLongPress = () => {
      clearLongPress();
    };

    icon.addEventListener("pointerdown", startLongPress);
    icon.addEventListener("pointerup", cancelLongPress);
    icon.addEventListener("pointercancel", cancelLongPress);
    icon.addEventListener("pointerleave", cancelLongPress);

    icon.addEventListener("click", (event) => {
      if (!longPressTriggered) return;
      event.preventDefault();
      event.stopPropagation();
    });
  }

  function jumpToDebugRound() {
    const targetIndex = ROUNDS.findIndex((round) => round.id === DEBUG_SKIP_ROUND_ID);

    if (targetIndex < 0) {
      console.warn("Scripture Scrub: unknown DEBUG_SKIP_ROUND_ID", DEBUG_SKIP_ROUND_ID);
      return;
    }

    currentRoundIndex = targetIndex;
    archaeologyScore = null;
    renderRound();
  }

  function beginScrubRun() {
    currentRoundIndex = 0;
    archaeologyScore = null;
    renderRound();
  }

  function renderRoundIntro() {
    renderRound();
  }

  function renderRound() {
    cleanupRound();
    completionLocked = false;
    pointerDown = false;
    lastPoint = null;
    objectTotal = 0;
    objectCleared = 0;
    menuOpen = false;

    const round = roundConfig();

    app.innerHTML = `
      <div class="scrub-game scrub-round-${escapeHtml(round.id)}" id="scrubGame">
        <div class="scrub-stage scrub-stage-${escapeHtml(round.id)}" id="scrubStage">
          <button class="scrub-menu-button no-zoom" id="scrubMenuBtn" type="button" aria-label="Game menu">☰</button>

          <div class="scrub-hud" aria-live="polite">
            <span id="scrubHudLabel">0%</span>
            <span class="scrub-progress-track" aria-hidden="true"><span class="scrub-progress-fill" id="scrubProgressFill"></span></span>
          </div>

          <div class="scrub-instruction-chip" id="scrubInstructionChip" aria-live="polite">
            ${escapeHtml(round.instruction || round.intro || round.title)}
          </div>

          <div class="scrub-scripture-card" id="scrubScriptureCard">
            <div class="scrub-ref-pill" id="scrubRefPill">${escapeHtml(getReferenceDisplay())}</div>
            <div class="scrub-verse-fit-box" id="scrubVerseFitBox">
              <div class="scrub-verse-text" id="scrubVerseText">${renderVerseHtml()}</div>
            </div>
          </div>

          <div class="scrub-bible-layer" id="scrubBibleLayer"></div>
          <canvas class="scrub-cover-canvas" id="scrubCoverCanvas" aria-label="Scrub cover"></canvas>
          <div class="scrub-object-layer" id="scrubObjectLayer"></div>
          <div class="scrub-reward-layer" id="scrubRewardLayer"></div>
        </div>

        ${window.VerseGameShell.gameMenuHtml({
      id: MENU_OVERLAY_ID,
      title: "Scripture Scrub",
      muted,
      howToText: "How to Play",
      exitText: "Back to Playground",
      closeText: "Keep Scrubbing",
      showModeSelect: false
    })}

        ${window.VerseGameShell.helpOverlayHtml({ id: HELP_OVERLAY_ID, body: helpHtml() })}
      </div>
    `;

    stageEl = document.getElementById("scrubStage");
    coverCanvas = document.getElementById("scrubCoverCanvas");
    coverCtx = coverCanvas ? coverCanvas.getContext("2d", { willReadFrequently: true }) : null;

    window.VerseGameShell.wireGameMenu({
      id: MENU_OVERLAY_ID,
      menuButtonId: "scrubMenuBtn",
      helpOverlayId: HELP_OVERLAY_ID,
      closeHelpText: "Close",
      backHelpText: "Back",
      isMuted: () => muted,
      onMuteToggle: () => { muted = !muted; },
      onHowToPlay: () => {
        const menu = document.getElementById(MENU_OVERLAY_ID);

        if (menu) {
          menu.classList.remove("is-open");
          menu.setAttribute("aria-hidden", "true");
        }

        window.VerseGameShell.openHelp?.(HELP_OVERLAY_ID, "back", "Back");
      },
      onExit: () => window.VerseGameBridge.exitGame(),
      onOpen: () => {
        menuOpen = true;
        const root = document.getElementById("scrubGame");
        if (root) root.classList.add("scrub-is-paused");
      },
      onClose: () => {
        menuOpen = false;
        const root = document.getElementById("scrubGame");
        if (root) root.classList.remove("scrub-is-paused");
      }
    });

    fitVerseToScreen();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => fitVerseToScreen()).catch(() => { });
    }

    resizeHandler = () => {
      fitVerseToScreen();
      setupRoundVisuals(round);
    };
    window.addEventListener("resize", resizeHandler);

    setupRoundVisuals(round);
  }

  function getReferenceDisplay() {
    const book = parsedRef.book || "";
    const reference = parsedRef.reference || "";
    const display = [book, reference].filter(Boolean).join(" ").trim();
    return display || ctx.verseRef || ctx.verseId || "Verse";
  }

  function getVerseText() {
    return String(ctx.verseText || verseJson?.verseText || "").trim() || "Choose a verse to reveal.";
  }

  function hidePlanEntries() {
    return Array.isArray(verseJson?.hidePlan) ? verseJson.hidePlan : [];
  }

  function renderVerseHtml() {
    const tokens = window.VerseGameShell.tokenizeVerseForBuild(getVerseText());
    const plan = hidePlanEntries();
    const normalizedPlan = plan
      .map((entry, index) => ({
        key: window.VerseGameShell.normalizeWord(entry?.word || ""),
        occurrence: Math.max(1, Number(entry?.occurrence) || 1),
        color: SPECIAL_COLORS[index % SPECIAL_COLORS.length]
      }))
      .filter((entry) => entry.key);

    const seen = new Map();

    return tokens.map((token) => {
      if (!token) return "";

      if (token.kind === "space") return escapeHtml(token.text);
      if (token.kind === "punct") return `<span class="scrub-token-punct">${escapeHtml(token.text)}</span>`;

      const key = window.VerseGameShell.normalizeWord(token.text);
      const count = (seen.get(key) || 0) + 1;
      seen.set(key, count);

      const planIndex = normalizedPlan.findIndex((entry) => entry.key === key && entry.occurrence === count);
      const match = planIndex >= 0 ? normalizedPlan[planIndex] : null;
      const style = match ? ` style="--scrub-special-color:${escapeHtml(match.color)}"` : "";
      const cls = match ? "scrub-token-word is-special" : "scrub-token-word";

      return `<span class="${cls}"${style}>${escapeHtml(token.text)}</span>`;
    }).join("");
  }

  function fitVerseToScreen() {
    const box = document.getElementById("scrubVerseFitBox");
    const text = document.getElementById("scrubVerseText");
    const pill = document.getElementById("scrubRefPill");
    if (!box || !text) return;

    text.style.fontSize = "";
    text.style.lineHeight = "";
    text.style.maxWidth = "100%";
    text.style.width = "100%";
    text.style.marginLeft = "auto";
    text.style.marginRight = "auto";

    if (pill) {
      pill.style.fontSize = "";
    }

    requestAnimationFrame(() => {
      const boxRect = box.getBoundingClientRect();
      if (!boxRect.width || !boxRect.height) return;

      const textLength = getVerseText().length;
      const stageWidth = stageEl?.getBoundingClientRect?.().width || boxRect.width;
      const isDesktopStage = stageWidth >= 700;

      const minSize = textLength > 190 ? 13 : textLength > 140 ? 15 : 17;
      const maxSize = textLength < 65 ? 76 : textLength < 115 ? 62 : textLength < 180 ? 50 : 42;

      const desiredLines = getDesiredLineRange(textLength, isDesktopStage);
      const widthCandidates = getVerseWidthCandidates(stageWidth, textLength);
      const lineHeights = [1.04, 1.0, .96, .92, .88];

      let best = null;

      for (const maxWidthPx of widthCandidates) {
        for (const lineHeight of lineHeights) {
          text.style.width = "100%";
          text.style.maxWidth = `${maxWidthPx}px`;
          text.style.marginLeft = "auto";
          text.style.marginRight = "auto";
          text.style.lineHeight = String(lineHeight);

          let low = minSize;
          let high = maxSize;
          let bestSize = minSize;

          for (let i = 0; i < 13; i += 1) {
            const mid = (low + high) / 2;
            text.style.fontSize = `${mid}px`;

            if (verseOverflows(box, text)) {
              high = mid;
            } else {
              bestSize = mid;
              low = mid;
            }
          }

          text.style.fontSize = `${bestSize}px`;

          if (verseOverflows(box, text)) continue;

          const metrics = getVerseFitMetrics(box, text);
          const score = scoreVerseFit({
            metrics,
            desiredLines,
            textLength,
            stageWidth,
            boxRect,
            maxWidthPx,
            fontSize: bestSize
          });

          const result = {
            score,
            fontSize: Math.floor(bestSize * 10) / 10,
            lineHeight,
            maxWidthPx,
            metrics
          };

          if (!best || result.score > best.score) {
            best = result;
          }
        }
      }

      if (best) {
        text.style.fontSize = `${best.fontSize}px`;
        text.style.lineHeight = String(best.lineHeight);
        text.style.maxWidth = `${best.maxWidthPx}px`;
        text.style.width = "100%";
        text.dataset.scrubFitFontSize = String(best.fontSize);
        text.dataset.scrubFitArea = "poster";
        text.dataset.scrubFitLines = String(best.metrics.lines);
        text.dataset.scrubFitWidth = String(Math.round(best.metrics.width));
        text.dataset.scrubFitHeight = String(Math.round(best.metrics.height));
      }
    });
  }

  function getDesiredLineRange(textLength, isDesktopStage) {
    if (textLength >= 230) return isDesktopStage ? { min: 8, ideal: 10, max: 13 } : { min: 9, ideal: 11, max: 14 };
    if (textLength >= 170) return isDesktopStage ? { min: 7, ideal: 9, max: 11 } : { min: 8, ideal: 10, max: 12 };
    if (textLength >= 115) return isDesktopStage ? { min: 5, ideal: 7, max: 9 } : { min: 6, ideal: 8, max: 10 };
    if (textLength >= 70) return { min: 4, ideal: 5, max: 7 };
    return { min: 2, ideal: 3, max: 5 };
  }

  function getVerseWidthCandidates(stageWidth, textLength) {
    const max = Math.min(stageWidth - 36, 760);
    const desktopLong = stageWidth >= 700 && textLength >= 150;
    const ratios = desktopLong
      ? [.86, .80, .74, .68, .62, .56]
      : [.96, .90, .84, .78, .72, .66];

    const out = [];
    for (const ratio of ratios) {
      const value = Math.round(clamp(max * ratio, 300, max));
      if (!out.includes(value)) out.push(value);
    }
    return out;
  }

  function getVerseFitMetrics(box, text) {
    const rects = [];
    for (const child of Array.from(text.children || [])) {
      for (const rect of Array.from(child.getClientRects ? child.getClientRects() : [])) {
        if (rect.width > .5 && rect.height > .5) rects.push(rect);
      }
    }

    if (!rects.length) {
      const textRect = text.getBoundingClientRect();
      return {
        lines: 1,
        width: textRect.width,
        height: textRect.height,
        widthFill: box.clientWidth ? textRect.width / box.clientWidth : 0,
        heightFill: box.clientHeight ? textRect.height / box.clientHeight : 0,
        aspect: textRect.height ? textRect.width / textRect.height : 1
      };
    }

    const lines = [];
    for (const rect of rects) {
      let line = lines.find((item) => Math.abs(item.top - rect.top) <= 3);
      if (!line) {
        line = { top: rect.top, left: rect.left, right: rect.right, height: rect.height };
        lines.push(line);
      } else {
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        line.height = Math.max(line.height, rect.height);
      }
    }

    lines.sort((a, b) => a.top - b.top);
    const left = Math.min(...lines.map((line) => line.left));
    const right = Math.max(...lines.map((line) => line.right));
    const top = Math.min(...lines.map((line) => line.top));
    const bottom = Math.max(...lines.map((line) => line.top + line.height));
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    return {
      lines: lines.length,
      width,
      height,
      widthFill: box.clientWidth ? width / box.clientWidth : 0,
      heightFill: box.clientHeight ? height / box.clientHeight : 0,
      aspect: height ? width / height : 1
    };
  }

  function scoreVerseFit({ metrics, desiredLines, textLength, fontSize }) {
    const heightTarget = textLength >= 160 ? .80 : .74;
    const widthTarget = textLength >= 160 ? .78 : .82;
    const aspectTarget = textLength >= 160 ? 1.35 : 1.75;

    const heightScore = 34 * (1 - Math.min(1, Math.abs(metrics.heightFill - heightTarget) / .42));
    const widthScore = 24 * (1 - Math.min(1, Math.abs(metrics.widthFill - widthTarget) / .36));
    const aspectScore = 18 * (1 - Math.min(1, Math.abs(metrics.aspect - aspectTarget) / 1.4));
    const lineScore = 24 * (1 - Math.min(1, Math.abs(metrics.lines - desiredLines.ideal) / Math.max(1, desiredLines.ideal)));

    const tooFewLinesPenalty = metrics.lines < desiredLines.min ? (desiredLines.min - metrics.lines) * 18 : 0;
    const tooManyLinesPenalty = metrics.lines > desiredLines.max ? (metrics.lines - desiredLines.max) * 8 : 0;
    const tinyPenalty = fontSize < 16 ? 12 : 0;

    return heightScore + widthScore + aspectScore + lineScore - tooFewLinesPenalty - tooManyLinesPenalty - tinyPenalty;
  }

  function verseOverflows(box, text) {
    const fudge = 2;
    return text.scrollWidth > box.clientWidth + fudge || text.scrollHeight > box.clientHeight + fudge;
  }

  function setupRoundVisuals(round) {
    if (!coverCanvas || !coverCtx || !stageEl) return;

    const rect = stageEl.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    coverCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    coverCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    coverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, rect.width, rect.height);
    coverCanvas.style.opacity = "1";
    coverCanvas.style.transition = "";

    setupClearMask(rect.width, rect.height);

    const objectLayer = document.getElementById("scrubObjectLayer");
    const bibleLayer = document.getElementById("scrubBibleLayer");
    if (objectLayer) objectLayer.innerHTML = "";
    if (bibleLayer) bibleLayer.innerHTML = "";

    if (round.kind === "canvas") {
      drawCoverTexture(round.texture, rect.width, rect.height);
      wireCanvasScrub(round);
      updateProgress(0);
      return;
    }

    if (round.kind === "archaeology") {
      placeHiddenBible(rect.width, rect.height);
      drawCoverTexture("dirt", rect.width, rect.height);
      wireCanvasScrub(round);
      updateProgress(0);
      return;
    }

    if (round.kind === "chalkboard") {
      setupChalkboardRound(round, rect.width, rect.height);
      updateProgress(0);
      return;
    }

    if (round.kind === "mower") {
      setupMowerRound(round, rect.width, rect.height);
      updateProgress(0);
      return;
    }

    coverCanvas.style.display = "none";
    coverCanvas.onpointerdown = null;
    coverCanvas.onpointermove = null;
    coverCanvas.onpointerup = null;
    coverCanvas.onpointercancel = null;
    coverCanvas.onpointerleave = null;

    if (round.kind === "leaves") setupLeaves(rect.width, rect.height);
    if (round.kind === "stickers") setupStickers(rect.width, rect.height);
  }

  function setupClearMask(width, height) {
    clearMaskCanvas = document.createElement("canvas");
    clearMaskCanvas.width = coverCanvas.width;
    clearMaskCanvas.height = coverCanvas.height;

    clearMaskCtx = clearMaskCanvas.getContext("2d", { willReadFrequently: true });
    if (!clearMaskCtx) return;

    clearMaskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clearMaskCtx.globalCompositeOperation = "source-over";
    clearMaskCtx.clearRect(0, 0, width, height);
    clearMaskCtx.fillStyle = "#000000";
    clearMaskCtx.fillRect(0, 0, width, height);
  }

  function eraseClearMask(x, y, radius) {
    if (!clearMaskCtx) return;

    clearMaskCtx.save();
    clearMaskCtx.globalCompositeOperation = "destination-out";
    clearMaskCtx.beginPath();
    clearMaskCtx.arc(x, y, radius, 0, Math.PI * 2);
    clearMaskCtx.fill();
    clearMaskCtx.restore();
  }

  function clearMaskFully() {
    if (!clearMaskCanvas || !clearMaskCtx) return;

    clearMaskCtx.save();
    clearMaskCtx.setTransform(1, 0, 0, 1, 0, 0);
    clearMaskCtx.clearRect(0, 0, clearMaskCanvas.width, clearMaskCanvas.height);
    clearMaskCtx.restore();
  }

  function drawImageCover(ctxToUse, img, width, height) {
    if (!ctxToUse || !img?.naturalWidth || !img?.naturalHeight) return false;

    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctxToUse.drawImage(img, x, y, drawWidth, drawHeight);
    return true;
  }

  function setupChalkboardRound(round, width, height) {
    chalkboardTargetRect = null;

    coverCanvas.style.display = "block";
    coverCanvas.style.pointerEvents = "";
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, width, height);

    refreshChalkboardTargetRect();
    requestAnimationFrame(() => {
      refreshChalkboardTargetRect();
      updateProgress(0);
    });
    setTimeout(refreshChalkboardTargetRect, 180);

    wireChalkboardErase(round);
  }

  function refreshChalkboardTargetRect() {
    if (!stageEl) return;

    const text = document.getElementById("scrubVerseText");
    const stageRect = stageEl.getBoundingClientRect();
    const textRect = text?.getBoundingClientRect?.();

    if (!textRect || !stageRect.width || !stageRect.height) {
      chalkboardTargetRect = null;
      return;
    }

    const padX = Math.max(28, stageRect.width * 0.045);
    const padY = Math.max(28, stageRect.height * 0.045);

    const left = clamp(textRect.left - stageRect.left - padX, 0, stageRect.width);
    const top = clamp(textRect.top - stageRect.top - padY, 0, stageRect.height);
    const right = clamp(textRect.right - stageRect.left + padX, 0, stageRect.width);
    const bottom = clamp(textRect.bottom - stageRect.top + padY, 0, stageRect.height);

    chalkboardTargetRect = {
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  }

  function wireChalkboardErase(round) {
    coverCanvas.onpointerdown = (event) => {
      if (menuOpen || completionLocked) return;

      event.preventDefault();
      dismissInstructionChip();
      refreshChalkboardTargetRect();

      pointerDown = true;
      lastPoint = getCanvasPoint(event);
      coverCanvas.setPointerCapture?.(event.pointerId);

      eraseChalkboardAt(lastPoint.x, lastPoint.y, currentBrushRadius(round), round);
      scheduleCoverageCheck(round);
    };

    coverCanvas.onpointermove = (event) => {
      if (!pointerDown || menuOpen || completionLocked) return;

      event.preventDefault();

      const point = getCanvasPoint(event);
      eraseChalkboardLine(lastPoint || point, point, currentBrushRadius(round), round);
      lastPoint = point;

      scheduleCoverageCheck(round);
    };

    const stop = (event) => {
      pointerDown = false;
      lastPoint = null;

      if (event?.pointerId !== undefined) {
        coverCanvas.releasePointerCapture?.(event.pointerId);
      }

      scheduleCoverageCheck(round, true);
    };

    coverCanvas.onpointerup = stop;
    coverCanvas.onpointercancel = stop;
    coverCanvas.onpointerleave = stop;
  }

  function eraseChalkboardLine(from, to, radius, round) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (radius * .38)));

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      eraseChalkboardAt(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        radius,
        round
      );
    }
  }

  function eraseChalkboardAt(x, y, radius, round) {
    if (!coverCtx) return;

    const smearRadius = radius * 1.16;

    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.filter = "blur(6px)";
    coverCtx.fillStyle = "rgba(43, 45, 48, .92)";
    coverCtx.beginPath();
    coverCtx.arc(x, y, smearRadius, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();

    drawChalkDustSmear(x, y, radius);
    eraseClearMask(x, y, radius * 1.05);
  }

  function drawChalkDustSmear(x, y, radius) {
    if (!coverCtx) return;

    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";

    for (let i = 0; i < 7; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.95;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      const w = radius * (0.32 + Math.random() * 0.55);
      const h = radius * (0.08 + Math.random() * 0.18);

      coverCtx.save();
      coverCtx.translate(px, py);
      coverCtx.rotate(Math.random() * Math.PI);
      coverCtx.globalAlpha = 0.08 + Math.random() * 0.08;
      coverCtx.filter = "blur(5px)";
      coverCtx.fillStyle = "#ffffff";
      coverCtx.beginPath();
      coverCtx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      coverCtx.fill();
      coverCtx.restore();
    }

    coverCtx.restore();
  }

  function measureChalkboardClearedRatio() {
    if (!clearMaskCanvas || !clearMaskCtx || !chalkboardTargetRect) {
      return measureClearedRatio();
    }

    const width = clearMaskCanvas.width;
    const height = clearMaskCanvas.height;
    if (!width || !height) return 0;

    const left = Math.max(0, Math.round(chalkboardTargetRect.left * dpr));
    const top = Math.max(0, Math.round(chalkboardTargetRect.top * dpr));
    const right = Math.min(width, Math.round((chalkboardTargetRect.left + chalkboardTargetRect.width) * dpr));
    const bottom = Math.min(height, Math.round((chalkboardTargetRect.top + chalkboardTargetRect.height) * dpr));
    const step = Math.max(4, Math.round(7 * dpr));

    let total = 0;
    let cleared = 0;

    try {
      const data = clearMaskCtx.getImageData(0, 0, width, height).data;

      for (let y = top; y < bottom; y += step) {
        for (let x = left; x < right; x += step) {
          total += 1;
          const alpha = data[((y * width + x) * 4) + 3];
          if (alpha < 24) cleared += 1;
        }
      }
    } catch (err) {
      console.warn("Scripture Scrub: chalkboard coverage check failed", err);
      return 0;
    }

    return total ? cleared / total : 0;
  }

  function setupMowerRound(round, width, height) {
    const objectLayer = document.getElementById("scrubObjectLayer");
    if (objectLayer) objectLayer.innerHTML = "";

    mowerActive = false;
    mowerFromTop = true;

    if (mowerAnimationFrame) {
      cancelAnimationFrame(mowerAnimationFrame);
      mowerAnimationFrame = null;
    }

    coverCanvas.style.display = "block";
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, width, height);

    const drewGrass = drawImageCover(coverCtx, grassCoverImage, width, height);
    if (!drewGrass) {
      coverCtx.fillStyle = "#4f9b3f";
      coverCtx.fillRect(0, 0, width, height);
    }

    coverCanvas.onpointerdown = (event) => {
      if (menuOpen || completionLocked || mowerActive) return;

      event.preventDefault();
      dismissInstructionChip();

      const point = getCanvasPoint(event);
      startMowerPass(point.x, round);
    };

    coverCanvas.onpointermove = null;
    coverCanvas.onpointerup = null;
    coverCanvas.onpointercancel = null;
    coverCanvas.onpointerleave = null;
  }

  function getMowerWidth() {
    return Math.round(currentBrushRadius() * 2);
  }

  function getMowerHeight(mowerWidth) {
    if (mowerImage?.naturalWidth && mowerImage?.naturalHeight) {
      return Math.round(mowerWidth * (mowerImage.naturalHeight / mowerImage.naturalWidth));
    }

    return Math.round(mowerWidth * 1.35);
  }

  function startMowerPass(tapX, round) {
    if (!stageEl || !coverCanvas || !coverCtx || mowerActive) return;

    const rect = stageEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mowerWidth = getMowerWidth();
    const mowerHeight = getMowerHeight(mowerWidth);
    const x = clamp(tapX, mowerWidth / 2, width - mowerWidth / 2);

    const objectLayer = document.getElementById("scrubObjectLayer");
    if (!objectLayer) return;

    mowerActive = true;

    const mower = document.createElement("img");
    mower.className = "scrub-mower-sprite";
    mower.alt = "";
    mower.setAttribute("aria-hidden", "true");
    mower.src = mowerImage?.src || `${IMAGE_BASE}${MOWER_IMAGE}`;
    mower.style.width = `${mowerWidth}px`;
    mower.style.height = `${mowerHeight}px`;
    mower.style.left = `${x}px`;

    const fromTop = mowerFromTop;
    const startY = fromTop ? -mowerHeight : height + mowerHeight;
    const endY = fromTop ? height + mowerHeight : -mowerHeight;
    const rotation = fromTop ? 180 : 0;
    const duration = 1250;

    mower.style.top = `${startY}px`;
    mower.style.setProperty("--scrub-mower-rot", `${rotation}deg`);

    objectLayer.appendChild(mower);

    const startTime = performance.now();
    let lastY = startY;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeMowerPass(progress);
      const y = startY + ((endY - startY) * eased);

      mower.style.top = `${y}px`;
      eraseMowerStripSegment(x, lastY, y, mowerWidth, mowerHeight);
      lastY = y;

      if (progress < 1) {
        mowerAnimationFrame = requestAnimationFrame(animate);
        return;
      }

      finishMowerPass({
        mower,
        x,
        width: mowerWidth,
        stageHeight: height,
        round
      });
    };

    mowerAnimationFrame = requestAnimationFrame(animate);
  }

  function easeMowerPass(t) {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function eraseMowerClearMaskRect(x, y, width, height) {
    if (!clearMaskCtx) return;

    clearMaskCtx.save();
    clearMaskCtx.globalCompositeOperation = "destination-out";
    clearMaskCtx.fillRect(x, y, width, height);
    clearMaskCtx.restore();
  }

  function eraseMowerStripSegment(x, previousY, currentY, mowerWidth, mowerHeight) {
    if (!coverCtx) return;

    const top = Math.min(previousY, currentY) - mowerHeight * 0.58;
    const bottom = Math.max(previousY, currentY) + mowerHeight * 0.58;
    const rectX = x - mowerWidth / 2;
    const rectY = top;
    const rectW = mowerWidth;
    const rectH = bottom - top;

    coverCtx.save();
    coverCtx.globalCompositeOperation = "destination-out";
    coverCtx.fillRect(rectX, rectY, rectW, rectH);
    coverCtx.restore();

    eraseMowerClearMaskRect(rectX, rectY, rectW, rectH);
  }

  function finishMowerPass({ mower, x, width, stageHeight, round }) {
    mowerAnimationFrame = null;

    const rectX = x - width / 2;
    const rectY = 0;
    const rectW = width;
    const rectH = stageHeight;

    coverCtx.save();
    coverCtx.globalCompositeOperation = "destination-out";
    coverCtx.fillRect(rectX, rectY, rectW, rectH);
    coverCtx.restore();

    eraseMowerClearMaskRect(rectX, rectY, rectW, rectH);

    mower.remove();

    mowerActive = false;
    mowerFromTop = !mowerFromTop;

    scheduleCoverageCheck(round, true);
  }

  function drawCoverTexture(texture, width, height) {
    coverCanvas.style.display = "block";
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, width, height);

    if (texture === "mud") return drawMud(width, height);
    if (texture === "paint") return drawPaint(width, height);
    if (texture === "fog") return drawFog(width, height);
    drawDirt(width, height);
  }

  function drawMud(width, height) {
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6b3f20");
    gradient.addColorStop(.5, "#8a5429");
    gradient.addColorStop(1, "#4a2b19");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 220; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 5 + Math.random() * 36;
      coverCtx.beginPath();
      coverCtx.fillStyle = Math.random() > .45 ? "rgba(45,25,13,.22)" : "rgba(166,105,50,.25)";
      coverCtx.arc(x, y, r, 0, Math.PI * 2);
      coverCtx.fill();
    }
  }

  function drawPaint(width, height) {
    coverCtx.fillStyle = "#ffeaf4";
    coverCtx.fillRect(0, 0, width, height);

    const colors = ["#ff5a51", "#ffa351", "#ffc751", "#a7cb6f", "#40b9c5", "#7f66c6"];
    const base = Math.min(width, height);

    const splatterCount = Math.round(clamp((width * height) / 5200, 105, 210));
    const minRadius = clamp(base * 0.052, 34, 68);
    const maxRadius = clamp(base * 0.15, 92, 170);

    for (let i = 0; i < splatterCount; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const blob = paintBlobImages.length
        ? paintBlobImages[Math.floor(Math.random() * paintBlobImages.length)]
        : null;

      coverCtx.globalAlpha = 0.92;

      if (blob) {
        drawPaintBlobStamp(blob, x, y, r, color);
      } else {
        coverCtx.beginPath();
        coverCtx.fillStyle = color;
        coverCtx.arc(x, y, r, 0, Math.PI * 2);
        coverCtx.fill();
      }

      coverCtx.fillStyle = color;

      const dots = 4 + Math.floor(Math.random() * 8);
      for (let j = 0; j < dots; j += 1) {
        coverCtx.beginPath();
        coverCtx.arc(
          x + (Math.random() - 0.5) * r * 2.8,
          y + (Math.random() - 0.5) * r * 2.8,
          Math.max(5, r * (0.07 + Math.random() * 0.13)),
          0,
          Math.PI * 2
        );
        coverCtx.fill();
      }
    }

    coverCtx.globalAlpha = 1;
  }

  function drawPaintBlobStamp(blob, x, y, radius, color) {
    const size = radius * 2.15;
    const stampCanvas = document.createElement("canvas");
    const stampCtx = stampCanvas.getContext("2d");

    if (!stampCtx) return;

    stampCanvas.width = Math.max(1, Math.round(size));
    stampCanvas.height = Math.max(1, Math.round(size));

    stampCtx.drawImage(blob, 0, 0, stampCanvas.width, stampCanvas.height);
    stampCtx.globalCompositeOperation = "source-in";
    stampCtx.fillStyle = color;
    stampCtx.fillRect(0, 0, stampCanvas.width, stampCanvas.height);

    coverCtx.save();
    coverCtx.translate(x, y);
    coverCtx.rotate(Math.random() * Math.PI * 2);
    coverCtx.scale(1 + Math.random() * 0.28, 0.82 + Math.random() * 0.34);
    coverCtx.drawImage(stampCanvas, -stampCanvas.width / 2, -stampCanvas.height / 2);
    coverCtx.restore();
  }

  function drawFog(width, height) {
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(235,250,255,.93)");
    gradient.addColorStop(.5, "rgba(221,241,248,.88)");
    gradient.addColorStop(1, "rgba(249,253,255,.94)");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 90; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const rx = 50 + Math.random() * 150;
      const ry = 16 + Math.random() * 54;
      coverCtx.save();
      coverCtx.translate(x, y);
      coverCtx.rotate((Math.random() - .5) * .6);
      coverCtx.beginPath();
      coverCtx.fillStyle = "rgba(255,255,255,.26)";
      coverCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      coverCtx.fill();
      coverCtx.restore();
    }
  }

  function drawDirt(width, height) {
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#9c733e");
    gradient.addColorStop(.48, "#6f4e2b");
    gradient.addColorStop(1, "#4d341e");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 520; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 1 + Math.random() * 5;
      coverCtx.beginPath();
      coverCtx.fillStyle = Math.random() > .5 ? "rgba(55,34,18,.28)" : "rgba(198,153,87,.22)";
      coverCtx.arc(x, y, r, 0, Math.PI * 2);
      coverCtx.fill();
    }
  }

  function wireCanvasScrub(round) {
    coverCanvas.onpointerdown = (event) => {
      if (menuOpen || completionLocked) return;
      event.preventDefault();
      dismissInstructionChip();
      pointerDown = true;
      lastPoint = getCanvasPoint(event);
      coverCanvas.setPointerCapture?.(event.pointerId);
      scrubAt(lastPoint.x, lastPoint.y, currentBrushRadius(), round);
    };

    coverCanvas.onpointermove = (event) => {
      if (!pointerDown || menuOpen || completionLocked) return;
      event.preventDefault();
      const point = getCanvasPoint(event);
      scrubLine(lastPoint || point, point, currentBrushRadius(), round);
      lastPoint = point;
      scheduleCoverageCheck(round);
    };

    const stop = (event) => {
      pointerDown = false;
      lastPoint = null;
      if (event?.pointerId !== undefined) coverCanvas.releasePointerCapture?.(event.pointerId);
      scheduleCoverageCheck(round, true);
    };

    coverCanvas.onpointerup = stop;
    coverCanvas.onpointercancel = stop;
    coverCanvas.onpointerleave = stop;
  }

  function getCanvasPoint(event) {
    const rect = coverCanvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height)
    };
  }

  function scrubAt(x, y, radius, round) {
    if (!coverCtx || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();

    coverCtx.save();
    coverCtx.globalCompositeOperation = "destination-out";
    coverCtx.beginPath();
    coverCtx.arc(x, y, radius, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();

    eraseClearMask(x, y, radius);

    if (round.id === "mud") drawMudFlick(x, y, radius);
    if (round.id === "paint") drawPaintSmear(x, y, radius);
    if (round.id === "fog") drawCleanWindowShine(x, y, radius);

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
  }

  function scrubLine(from, to, radius, round) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (radius * .55)));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      scrubAt(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius, round);
    }
  }

  function drawMudFlick(x, y, radius) {
    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.fillStyle = "rgba(76,43,22,.12)";
    for (let i = 0; i < 3; i += 1) {
      coverCtx.beginPath();
      coverCtx.arc(x + (Math.random() - .5) * radius * 2.2, y + (Math.random() - .5) * radius * 2.2, 2 + Math.random() * 4, 0, Math.PI * 2);
      coverCtx.fill();
    }
    coverCtx.restore();
  }

  function drawPaintSmear(x, y, radius) {
    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.globalAlpha = .08;
    coverCtx.fillStyle = SPECIAL_COLORS[Math.floor(Math.random() * SPECIAL_COLORS.length)];
    coverCtx.beginPath();
    coverCtx.ellipse(x, y, radius * 1.5, radius * .35, Math.random() * Math.PI, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();
  }

  function drawCleanWindowShine(x, y, radius) {
    coverCtx.save();
    coverCtx.globalCompositeOperation = "destination-out";
    coverCtx.globalAlpha = .22;
    coverCtx.beginPath();
    coverCtx.arc(x, y, radius * 1.45, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();
  }

  function scheduleCoverageCheck(round, immediate = false) {
    if (coverageCheckTimer) return;

    const delay = immediate ? 0 : 90;
    coverageCheckTimer = setTimeout(() => {
      coverageCheckTimer = null;
      const cleared = round.kind === "chalkboard"
        ? measureChalkboardClearedRatio()
        : measureClearedRatio();

      if (round.kind === "archaeology") {
        checkBibleFound(cleared);
        return;
      }

      updateProgress(cleared);

      if (cleared >= currentThreshold()) completeRound();
    }, delay);
  }

  function measureClearedRatio() {
    if (!clearMaskCanvas || !clearMaskCtx) return 0;

    const width = clearMaskCanvas.width;
    const height = clearMaskCanvas.height;
    if (!width || !height) return 0;

    const step = Math.max(6, Math.round(10 * dpr));
    let total = 0;
    let cleared = 0;

    try {
      const data = clearMaskCtx.getImageData(0, 0, width, height).data;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          total += 1;
          const alpha = data[((y * width + x) * 4) + 3];
          if (alpha < 24) cleared += 1;
        }
      }
    } catch (err) {
      console.warn("Scripture Scrub: coverage check failed", err);
      return 0;
    }

    return total ? cleared / total : 0;
  }

  function updateProgress(ratio) {
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    const label = document.getElementById("scrubHudLabel");
    const fill = document.getElementById("scrubProgressFill");
    if (label) label.textContent = `${pct}%`;
    if (fill) fill.style.width = `${pct}%`;
  }

  function getCoverObjectSize(kind, stageWidth) {
    const width = Math.max(320, Number(stageWidth) || 420);

    if (kind === "sticker") {
      return clamp(width * .19, 112, 172);
    }

    return clamp(width * .24, 136, 220);
  }

  function generateCoverPositions({
    count,
    width,
    height,
    jitter = 0.28,
    topRatio = 0.16,
    heightRatio = 0.68
  } = {}) {
    const safeCount = Math.max(1, Number(count) || 1);
    const usableW = width * 0.86;
    const usableH = height * heightRatio;
    const startX = (width - usableW) / 2;
    const startY = height * topRatio;

    const cols = Math.ceil(Math.sqrt(safeCount * (usableW / Math.max(1, usableH))));
    const rows = Math.ceil(safeCount / cols);
    const cellW = usableW / cols;
    const cellH = usableH / rows;

    const positions = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = startX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * jitter;
        const y = startY + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * jitter;

        positions.push({
          x: clamp(x, width * 0.08, width * 0.92),
          y: clamp(y, height * 0.12, height * 0.88)
        });
      }
    }

    return shuffle(positions).slice(0, safeCount);
  }

  function setupLeaves(width, height) {
    const layer = document.getElementById("scrubObjectLayer");
    if (!layer) return;

    const count = 52;
    const size = getCoverObjectSize("leaf", width);
    const positions = generateCoverPositions({
      count,
      width,
      height,
      jitter: 0.44,
      topRatio: 0.13,
      heightRatio: 0.74
    });

    objectTotal = count;
    objectCleared = 0;
    updateProgress(0);

    const imagePool = leafImages.length ? LEAF_IMAGES : LEAF_IMAGES;
    const imageBag = shuffle(imagePool.concat(imagePool, imagePool, imagePool, imagePool, imagePool, imagePool));

    for (let i = 0; i < count; i += 1) {
      const pos = positions[i] || {
        x: width * (0.1 + Math.random() * 0.8),
        y: height * (0.16 + Math.random() * 0.66)
      };

      const img = document.createElement("img");
      img.className = "scrub-leaf";
      img.src = IMAGE_BASE + imageBag[i % imageBag.length];
      img.alt = "";
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.left = `${pos.x}px`;
      img.style.top = `${pos.y}px`;
      img.style.setProperty("--scrub-rot", `${Math.round(-80 + Math.random() * 160)}deg`);

      const drift = Math.round(-110 + Math.random() * 220);
      img.style.setProperty("--scrub-drift-x", `${drift}px`);
      img.style.setProperty("--scrub-drift-x-end", `${-drift}px`);
      img.style.setProperty("--scrub-fall-ms", `${850 + Math.round(Math.random() * 700)}ms`);

      img.dataset.cleared = "0";

      img.onerror = () => {
        const fallback = document.createElement("span");
        fallback.className = img.className;
        fallback.textContent = Math.random() > .5 ? "🍁" : "🍂";
        fallback.style.cssText = img.style.cssText;
        fallback.dataset.cleared = img.dataset.cleared;
        img.replaceWith(fallback);
      };

      layer.appendChild(img);
    }

    stageEl.onpointerdown = (event) => {
      if (menuOpen || completionLocked) return;
      dismissInstructionChip();
      rakeLeavesAt(event.clientX, event.clientY);
    };

    stageEl.onpointermove = (event) => {
      if (menuOpen || completionLocked) return;
      if (event.buttons || event.pointerType === "touch") {
        dismissInstructionChip();
        rakeLeavesAt(event.clientX, event.clientY);
      }
    };
  }

  function rakeLeavesAt(clientX, clientY) {
    const leaves = Array.from(document.querySelectorAll(".scrub-leaf:not(.is-raked)"));
    const stageWidth = stageEl?.getBoundingClientRect?.().width || 420;
    const hitRadius = getCoverObjectSize("leaf", stageWidth) * .54;

    for (const leaf of leaves) {
      const rect = leaf.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      if (Math.hypot(cx - clientX, cy - clientY) <= hitRadius) {
        leaf.classList.add("is-raked");
        leaf.dataset.cleared = "1";
        objectCleared += 1;
      }
    }

    const ratio = objectTotal ? objectCleared / objectTotal : 0;
    updateProgress(ratio);

    if (ratio >= roundCompletionThreshold()) completeRound();
  }

  function makeStickerDeck(items, copies = 1) {
    const deck = [];

    for (let i = 0; i < copies; i += 1) {
      deck.push(...items);
    }

    return shuffle(deck);
  }

  function refillStickerDeck(deck, items, copies = 1) {
    if (deck.length) return deck;
    deck.push(...makeStickerDeck(items, copies));
    return deck;
  }

  function countStickerValue(map, value) {
    return map.get(value) || 0;
  }

  function addStickerUsage(map, value) {
    map.set(value, countStickerValue(map, value) + 1);
  }

  function rememberStickerValue(list, value) {
    if (!value) return;
    list.push(value);

    while (list.length > STICKER_RECENT_LIMIT) {
      list.shift();
    }
  }

  function pickLeastUsedStickerValue(deck, source, usage, getKey = (value) => value, copies = 1) {
    refillStickerDeck(deck, source, copies);

    const candidateCount = Math.min(deck.length, Math.max(3, Math.ceil(source.length * 0.45)));
    const candidates = deck.splice(0, candidateCount);

    candidates.sort((a, b) => {
      const aKey = getKey(a);
      const bKey = getKey(b);
      const usageDiff = countStickerValue(usage, aKey) - countStickerValue(usage, bKey);
      if (usageDiff !== 0) return usageDiff;
      return Math.random() - 0.5;
    });

    const chosen = candidates.shift();
    deck.push(...shuffle(candidates));

    return chosen;
  }

  function makeWordStickerSlots(count) {
    const target = clamp(
      Math.round(count * 0.30),
      4,
      Math.min(7, count)
    );

    const indexes = Array.from({ length: count }, (_, index) => index);
    const preferred = shuffle(indexes.filter((index) => index > 0 && index < count - 1));
    const slots = new Set(preferred.slice(0, target));

    while (slots.size < target) {
      slots.add(Math.floor(Math.random() * count));
    }

    return slots;
  }

  function pickStickerContent({ useWord, decks, usage }) {
    if (useWord) {
      const word = pickLeastUsedStickerValue(
        decks.words,
        STICKER_WORDS,
        usage.words,
        (value) => value,
        1
      );

      addStickerUsage(usage.words, word);
      return word;
    }

    const emoji = pickLeastUsedStickerValue(
      decks.emojis,
      STICKER_EMOJIS,
      usage.emojis,
      (value) => value,
      1
    );

    addStickerUsage(usage.emojis, emoji);
    return emoji;
  }

  function pickStickerDesign(decks, usage) {
    const style = pickLeastUsedStickerValue(
      decks.styles,
      STICKER_STYLES,
      usage.colors,
      (value) => value.bg,
      1
    );

    const shape = pickLeastUsedStickerValue(
      decks.shapes,
      STICKER_SHAPES,
      usage.shapes,
      (value) => value,
      2
    );

    const border = pickLeastUsedStickerValue(
      decks.borders,
      STICKER_BORDERS,
      usage.borders,
      (value) => value,
      2
    );

    addStickerUsage(usage.colors, style.bg);
    addStickerUsage(usage.shapes, shape);
    addStickerUsage(usage.borders, border);

    return {
      bg: style.bg,
      fg: style.fg,
      borderColor: style.border,
      shape,
      border
    };
  }

  function pickStickerPeelStyle(decks, usage) {
    const peelStyle = pickLeastUsedStickerValue(
      decks.peelStyles,
      STICKER_PEEL_STYLES,
      usage.peelStyles,
      (value) => value,
      2
    );

    addStickerUsage(usage.peelStyles, peelStyle);
    return peelStyle;
  }



  function generateStickerPositions(count, width, height, stickerSize) {
    const safeCount = Math.max(1, Number(count) || 1);

    const edgeInset = Math.max(18, stickerSize * 0.18);
    const top = Math.max(92, height * 0.09);
    const bottom = height - edgeInset;

    const minDistance = stickerSize * (width >= 760 ? 0.70 : 0.64);
    const relaxedDistance = stickerSize * 0.46;
    const maxAttempts = safeCount * 110;
    const positions = [];

    function randomCandidate() {
      const verticalBias = Math.random();
      const yRatio = verticalBias < 0.68
        ? 0.16 + Math.random() * 0.68
        : Math.random();

      return {
        x: edgeInset + Math.random() * Math.max(1, width - edgeInset * 2),
        y: top + yRatio * Math.max(1, bottom - top)
      };
    }

    function distanceToClosest(candidate) {
      if (!positions.length) return Infinity;

      return Math.min(...positions.map((pos) => {
        const dx = candidate.x - pos.x;
        const dy = candidate.y - pos.y;
        return Math.hypot(dx, dy);
      }));
    }

    for (let attempt = 0; positions.length < safeCount && attempt < maxAttempts; attempt += 1) {
      const candidate = randomCandidate();
      const progress = attempt / maxAttempts;
      const requiredDistance = minDistance - (minDistance - relaxedDistance) * progress;

      if (distanceToClosest(candidate) >= requiredDistance) {
        positions.push(candidate);
      }
    }

    if (positions.length < safeCount) {
      const fallback = generateStickerFallbackPositions({
        count: safeCount - positions.length,
        width,
        height,
        stickerSize,
        marginX: edgeInset,
        top,
        bottom
      });

      positions.push(...fallback);
    }

    return shuffle(positions).slice(0, safeCount).map((pos) => ({
      x: clamp(pos.x, edgeInset, width - edgeInset),
      y: clamp(pos.y, top, bottom)
    }));
  }

  function generateStickerFallbackPositions({
    count,
    width,
    height,
    stickerSize,
    marginX,
    top,
    bottom
  }) {
    const safeCount = Math.max(0, Number(count) || 0);
    const usableW = Math.max(1, width - marginX * 2);
    const usableH = Math.max(1, bottom - top);

    const cols = width >= 760 ? 5 : 4;
    const rows = Math.ceil(safeCount / cols);
    const cellW = usableW / cols;
    const cellH = usableH / Math.max(1, rows);

    const positions = [];

    for (let i = 0; i < safeCount; i += 1) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      positions.push({
        x: marginX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.55,
        y: top + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.48
      });
    }

    return positions;
  }

  function stickerHtml({ content, type }) {
    const safeContent = escapeHtml(content);

    if (type === "word") {
      return `
        <span class="scrub-sticker-face">
          <span class="scrub-sticker-word">${safeContent}</span>
          <span class="scrub-sticker-shine" aria-hidden="true"></span>
          <span class="scrub-sticker-curl" aria-hidden="true"></span>
        </span>
      `;
    }

    return `
      <span class="scrub-sticker-face">
        <span class="scrub-sticker-emoji">${safeContent}</span>
        <span class="scrub-sticker-shine" aria-hidden="true"></span>
        <span class="scrub-sticker-curl" aria-hidden="true"></span>
      </span>
    `;
  }

  function setupStickers(width, height) {
    const layer = document.getElementById("scrubObjectLayer");
    if (!layer) return;

    const count = 20;
    const baseSize = getCoverObjectSize("sticker", width);
    const positions = generateStickerPositions(count, width, height, baseSize);

    objectTotal = count;
    objectCleared = 0;
    updateProgress(0);

    const wordSlots = makeWordStickerSlots(count);

    const decks = {
      words: makeStickerDeck(STICKER_WORDS),
      emojis: makeStickerDeck(STICKER_EMOJIS),
      styles: makeStickerDeck(STICKER_STYLES),
      shapes: makeStickerDeck(STICKER_SHAPES, 2),
      borders: makeStickerDeck(STICKER_BORDERS, 2),
      peelStyles: makeStickerDeck(STICKER_PEEL_STYLES, 2)
    };

    const usage = {
      words: new Map(stickerRecentHistory.words.map((value) => [value, 1])),
      emojis: new Map(stickerRecentHistory.emojis.map((value) => [value, 1])),
      colors: new Map(stickerRecentHistory.colors.map((value) => [value, 1])),
      shapes: new Map(),
      borders: new Map(),
      peelStyles: new Map()
    };

    for (let i = 0; i < count; i += 1) {
      const pos = positions[i];

      const useWord = wordSlots.has(i);
      const content = pickStickerContent({ useWord, decks, usage });
      const design = pickStickerDesign(decks, usage);
      const peelStyle = pickStickerPeelStyle(decks, usage);

      const sizeVariation = useWord
        ? 0.92 + Math.random() * 0.16
        : 0.88 + Math.random() * 0.18;

      const stickerWidth = Math.round(baseSize * sizeVariation * (useWord ? 1.16 : 1));
      const stickerHeight = Math.round(baseSize * sizeVariation * (useWord ? 0.72 : 1));

      const emojiSize = Math.round(Math.min(stickerWidth, stickerHeight) * 0.58);
      const wordSize = Math.round(clamp(stickerHeight * 0.38, 24, 44));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = [
        "scrub-sticker",
        `scrub-sticker-${useWord ? "word" : "emoji"}`,
        `scrub-sticker-shape-${design.shape}`,
        `scrub-sticker-border-${design.border}`
      ].join(" ");

      btn.innerHTML = stickerHtml({
        content,
        type: useWord ? "word" : "emoji"
      });

      btn.dataset.peelStyle = peelStyle;
      btn.dataset.stickerContent = content;
      btn.dataset.stickerType = useWord ? "word" : "emoji";
      btn.dataset.stickerColor = design.bg;

      btn.setAttribute("aria-label", useWord ? `Peel ${content} sticker` : `Peel ${content} sticker`);
      btn.style.width = `${stickerWidth}px`;
      btn.style.height = `${stickerHeight}px`;
      btn.style.left = `${pos.x}px`;
      btn.style.top = `${pos.y}px`;
      btn.style.zIndex = String(20 + Math.floor(Math.random() * 40));
      btn.style.setProperty("--scrub-rot", `${Math.round(-22 + Math.random() * 44)}deg`);
      btn.style.setProperty("--sticker-bg", design.bg);
      btn.style.setProperty("--sticker-fg", design.fg);
      btn.style.setProperty("--sticker-border", design.borderColor);
      btn.style.setProperty("--sticker-emoji-size", `${emojiSize}px`);
      btn.style.setProperty("--sticker-word-size", `${wordSize}px`);

      btn.onclick = () => {
        dismissInstructionChip();
        peelSticker(btn);
      };
      btn.onpointerdown = (event) => {
        event.stopPropagation();
      };

      layer.appendChild(btn);
    }

    const visibleStickers = layer.querySelectorAll(".scrub-sticker").length;
    objectTotal = visibleStickers;
    updateProgress(0);
  }

  function peelSticker(btn) {
    if (!btn || btn.classList.contains("is-peeled") || completionLocked) return;

    STICKER_PEEL_STYLES.forEach((styleName) => {
      btn.classList.remove(styleName);
    });

    const peelStyle = btn.dataset.peelStyle || STICKER_PEEL_STYLES[Math.floor(Math.random() * STICKER_PEEL_STYLES.length)];
    btn.classList.add(peelStyle);
    btn.classList.add("is-peeled");

    if (btn.dataset.stickerType === "word") {
      rememberStickerValue(stickerRecentHistory.words, btn.dataset.stickerContent);
    } else {
      rememberStickerValue(stickerRecentHistory.emojis, btn.dataset.stickerContent);
    }

    rememberStickerValue(stickerRecentHistory.colors, btn.dataset.stickerColor);

    objectCleared += 1;
    const ratio = objectTotal ? objectCleared / objectTotal : 0;
    updateProgress(ratio);

    if (ratio >= roundCompletionThreshold()) completeRound();
  }

  function placeHiddenBible(width, height) {
    const layer = document.getElementById("scrubBibleLayer");
    if (!layer) return;

    const size = clamp(Math.min(width, height) * .15, 62, 122);
    const margin = Math.max(58, size * .7);
    const x = margin + Math.random() * Math.max(1, width - margin * 2);
    const y = margin + Math.random() * Math.max(1, height - margin * 2);

    bibleRect = {
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      centerX: x,
      centerY: y
    };

    const img = document.createElement("img");
    img.className = "scrub-bible-target";
    img.id = "scrubBibleTarget";
    img.src = IMAGE_BASE + "scripture_scrub_bible.png";
    img.alt = "Hidden Bible";
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.onerror = () => {
      const fallback = document.createElement("div");
      fallback.className = "scrub-bible-target scrub-fallback-bible";
      fallback.id = "scrubBibleTarget";
      fallback.textContent = "📖";
      fallback.style.left = `${x}px`;
      fallback.style.top = `${y}px`;
      fallback.style.width = `${size}px`;
      fallback.style.height = `${size}px`;
      img.replaceWith(fallback);
    };
    layer.appendChild(img);
  }

  function checkBibleFound(clearedRatio) {
    if (!bibleRect || !coverCanvas || !coverCtx || completionLocked) return;

    const bibleRevealRatio = measureBibleRevealRatio();
    updateProgress(bibleRevealRatio);

    if (bibleRevealRatio < BIBLE_REVEAL_COMPLETION_THRESHOLD) return;

    archaeologyScore = calculateArchaeologyScore(clearedRatio);

    const bible = document.getElementById("scrubBibleTarget");
    if (bible) bible.classList.add("is-found");

    completeRound();
  }

  function measureBibleRevealRatio() {
    if (!clearMaskCanvas || !clearMaskCtx || !bibleRect) return 0;

    const width = clearMaskCanvas.width;
    const height = clearMaskCanvas.height;
    if (!width || !height) return 0;

    const left = Math.max(0, Math.round(bibleRect.left * dpr));
    const top = Math.max(0, Math.round(bibleRect.top * dpr));
    const right = Math.min(width, Math.round((bibleRect.left + bibleRect.width) * dpr));
    const bottom = Math.min(height, Math.round((bibleRect.top + bibleRect.height) * dpr));
    const step = Math.max(3, Math.round(5 * dpr));

    let total = 0;
    let cleared = 0;

    try {
      const data = clearMaskCtx.getImageData(0, 0, width, height).data;

      for (let y = top; y < bottom; y += step) {
        for (let x = left; x < right; x += step) {
          total += 1;
          const alpha = data[((y * width + x) * 4) + 3];
          if (alpha < 36) cleared += 1;
        }
      }
    } catch (err) {
      return 0;
    }

    return total ? cleared / total : 0;
  }

  function calculateArchaeologyScore(clearedRatio) {
    const score = Math.round(100 - clamp(clearedRatio, 0, 1) * 80);
    return clamp(score, 10, 100);
  }

  function completeRound() {
    if (completionLocked) return;
    completionLocked = true;
    pointerDown = false;

    const round = roundConfig();

    if (coverCanvas) {
      coverCanvas.style.pointerEvents = "none";
    }

    const finishRound = () => {
      clearMaskFully();
      updateProgress(1);
      clearRemainingObjects();

      if (stageEl) {
        stageEl.classList.remove("scrub-cleaning-up");
        stageEl.classList.add("scrub-round-complete");
      }

      launchSparkles();
      showNextRoundPill();
    };

    if (round.kind === "chalkboard") {
      finishRound();
      return;
    }

    if (round.kind === "mower") {
      animateMowerCoverFade(finishRound);
      return;
    }

    if (stageEl && (round.id === "mud" || round.id === "paint" || round.id === "fog")) {
      stageEl.classList.add("scrub-cleaning-up");
    }

    animateAutoCleanCover(finishRound);
  }

  function animateMowerCoverFade(onDone = () => { }) {
    if (!coverCanvas || !coverCtx || coverCanvas.style.display === "none") {
      setTimeout(onDone, 360);
      return;
    }

    clearMaskFully();
    updateProgress(1);

    coverCanvas.style.transition = "opacity 650ms ease";
    coverCanvas.style.opacity = "1";

    requestAnimationFrame(() => {
      coverCanvas.style.opacity = "0";
    });

    setTimeout(() => {
      if (stageEl) {
        const rect = stageEl.getBoundingClientRect();

        coverCtx.save();
        coverCtx.globalCompositeOperation = "destination-out";
        coverCtx.clearRect(0, 0, rect.width, rect.height);
        coverCtx.restore();
      }

      onDone();
    }, 700);
  }

  function animateAutoCleanCover(onDone = () => { }) {
    if (!stageEl || !coverCanvas || !coverCtx || coverCanvas.style.display === "none") {
      setTimeout(onDone, 360);
      return;
    }

    const rect = stageEl.getBoundingClientRect();

    const sweep = document.createElement("div");
    const sweepRoundId = String(roundConfig()?.id || "default").replace(/[^a-z0-9_-]/gi, "");
    sweep.className = `scrub-clean-sweep scrub-clean-sweep-${sweepRoundId}`;
    stageEl.appendChild(sweep);

    const totalDuration = 1250;
    const hiddenClearMoment = 980;

    updateProgress(currentThreshold());

    const clearWhileHidden = () => {
      clearMaskFully();

      coverCtx.save();
      coverCtx.globalCompositeOperation = "destination-out";
      coverCtx.clearRect(0, 0, rect.width, rect.height);
      coverCtx.restore();

      updateProgress(1);
    };

    const clearTimer = setTimeout(clearWhileHidden, hiddenClearMoment);

    setTimeout(() => {
      clearTimeout(clearTimer);
      clearWhileHidden();

      sweep.remove();
      onDone();
    }, totalDuration + 80);
  }


  function clearRemainingObjects() {
    const objectLayer = document.getElementById("scrubObjectLayer");
    if (objectLayer) objectLayer.innerHTML = "";
  }

  function showNextRoundPill() {
    const round = roundConfig();
    const pill = document.getElementById("scrubRefPill");
    if (!pill) return;

    const isFinalRound = round.kind === "archaeology";
    const buttonText = isFinalRound ? "See Results" : "Next Round";

    pill.classList.add("is-next-round");
    pill.innerHTML = `<button class="scrub-next-round-btn no-zoom" id="scrubNextRoundBtn" type="button">${escapeHtml(buttonText)}</button>`;

    const btn = document.getElementById("scrubNextRoundBtn");
    if (!btn) return;

    btn.onclick = () => {
      if (isFinalRound) {
        renderEndScreen();
        return;
      }

      currentRoundIndex += 1;
      renderRound();
    };
  }

  function showRoundReward({ title, icon, message, primaryText, onPrimary }) {
    const layer = document.getElementById("scrubRewardLayer");
    if (!layer) return;

    layer.innerHTML = `
      <div class="scrub-reward-panel">
        <div class="scrub-reward-card">
          <div class="scrub-reward-icon" aria-hidden="true">${escapeHtml(icon)}</div>
          <div class="scrub-reward-title">${escapeHtml(title)}</div>
          <div class="scrub-reward-message">${escapeHtml(message)}</div>
          <div class="scrub-reward-actions">
            <button class="vm-btn" id="scrubRewardPrimaryBtn" type="button">${escapeHtml(primaryText)}</button>
            <button class="vm-btn vm-btn-secondary" id="scrubRewardExitBtn" type="button">Back to Playground</button>
          </div>
        </div>
      </div>
    `;

    const primary = document.getElementById("scrubRewardPrimaryBtn");
    const exit = document.getElementById("scrubRewardExitBtn");
    if (primary) primary.onclick = onPrimary;
    if (exit) exit.onclick = () => window.VerseGameBridge.exitGame();
  }

  function launchSparkles() {
    const layer = document.getElementById("scrubRewardLayer");
    if (!layer) return;

    const icons = ["✨", "⭐", "💫", "🌟"];
    for (let i = 0; i < 28; i += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "scrub-sparkle";
      sparkle.textContent = icons[i % icons.length];
      sparkle.style.left = `${10 + Math.random() * 80}%`;
      sparkle.style.top = `${18 + Math.random() * 64}%`;
      sparkle.style.setProperty("--spark-x", `${Math.round(-120 + Math.random() * 240)}px`);
      sparkle.style.setProperty("--spark-y", `${Math.round(-120 + Math.random() * 120)}px`);
      layer.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1000);
    }
  }

  function renderEndScreen() {
    cleanupRound();
    const score = archaeologyScore ?? 100;
    const scoreLine = score >= 90
      ? "Amazing careful digging!"
      : score >= 75
        ? "Great explorer digging!"
        : score >= 55
          ? "Good dig — you found it!"
          : "You found the Bible!";

    window.VerseGameShell.renderCompleteScreen({
      app,
      title: "Great Scrubbing!",
      icon: "🧽",
      statsHtml: `<div>${escapeHtml(scoreLine)}</div><div>Careful Dig Score: ${escapeHtml(score)}</div>`,
      playAgainText: "Try Again",
      moreGamesText: "More Activities",
      backLabel: "Back to Playground",
      theme: GAME_THEME,
      onPlayAgain: () => {
        beginScrubRun();
      },
      onMoreGames: () => window.VerseGameBridge.exitGame()
    });
  }

  function cleanupRound() {
    if (coverageCheckTimer) {
      clearTimeout(coverageCheckTimer);
      coverageCheckTimer = null;
    }

    if (mowerAnimationFrame) {
      cancelAnimationFrame(mowerAnimationFrame);
      mowerAnimationFrame = null;
    }

    mowerActive = false;

    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }

    if (stageEl) {
      stageEl.onpointerdown = null;
      stageEl.onpointermove = null;
    }

    if (coverCanvas) {
      coverCanvas.onpointerdown = null;
      coverCanvas.onpointermove = null;
      coverCanvas.onpointerup = null;
      coverCanvas.onpointercancel = null;
      coverCanvas.onpointerleave = null;
    }

    stageEl = null;
    coverCanvas = null;
    coverCtx = null;
    clearMaskCanvas = null;
    clearMaskCtx = null;
    chalkboardTargetRect = null;
    pointerDown = false;
    lastPoint = null;
    menuOpen = false;
  }

  verseJson = await loadVerseJson();
  grassCoverImage = await loadGrassBackgroundImage();
  mowedGrassImage = await loadMowedGrassBackgroundImage();
  mowerImage = await loadMowerImage();
  leafImages = await loadLeafImages();
  paintBlobImages = await loadPaintBlobImages();
  await waitForLocalFonts();
  renderTitleScreen();
})();
