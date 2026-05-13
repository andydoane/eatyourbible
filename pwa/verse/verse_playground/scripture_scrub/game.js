(async function(){
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

  const MODE_THRESHOLDS = {
    easy: 0.66,
    medium: 0.75,
    hard: 0.85
  };

  const BRUSH_BY_MODE = {
    easy: 38,
    medium: 32,
    hard: 26
  };

  const ROUNDS = [
    {
      id: "mud",
      title: "Mud",
      icon: "🟤",
      intro: "Wipe off the mud.",
      instruction: "Drag to wipe away the mud.",
      kind: "canvas",
      texture: "mud",
      rewardIcon: "✨",
      rewardTitle: "Squeaky clean!"
    },
    {
      id: "paint",
      title: "Paint Splash",
      icon: "🎨",
      intro: "Clean off the paint.",
      instruction: "Drag to scrub away the paint.",
      kind: "canvas",
      texture: "paint",
      rewardIcon: "🌈",
      rewardTitle: "Paint cleared!"
    },
    {
      id: "fog",
      title: "Foggy Window",
      icon: "🪟",
      intro: "Wipe off the foggy window.",
      instruction: "Drag to clear the fog.",
      kind: "canvas",
      texture: "fog",
      rewardIcon: "☀️",
      rewardTitle: "Now you can see it!"
    },
    {
      id: "leaves",
      title: "Raking Leaves",
      icon: "🍂",
      intro: "Rake away the leaves.",
      instruction: "Swipe through the leaves to rake them away.",
      kind: "leaves",
      rewardIcon: "🍁",
      rewardTitle: "Leaves raked!"
    },
    {
      id: "stickers",
      title: "Emoji Stickers",
      icon: "😀",
      intro: "Peel off the stickers, one at a time.",
      instruction: "Tap each sticker to peel it away.",
      kind: "stickers",
      rewardIcon: "⭐",
      rewardTitle: "Stickers peeled!"
    },
    {
      id: "archaeology",
      title: "Archaeology",
      icon: "🏺",
      intro: "Dig carefully. Find the hidden Bible!",
      instruction: "Dig carefully — clear less dirt for a better score.",
      kind: "archaeology",
      texture: "dirt",
      rewardIcon: "📖",
      rewardTitle: "You found the Bible!"
    }
  ];

  const IMAGE_BASE = "./scripture_scrub_images/";
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

  let verseJson = null;
  let selectedMode = "easy";
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
  let resizeHandler = null;

  const parsedRef = window.VerseGameShell.parseReferenceParts(
    ctx.verseRef,
    ctx.translation,
    ctx.verseId
  );

  function escapeHtml(value){
    return window.VerseGameShell.escapeHtml(String(value ?? ""));
  }

  function shuffle(array){
    return window.VerseGameShell.shuffle(array);
  }

  function clamp(value, min, max){
    return window.VerseGameShell.clamp(value, min, max);
  }

  function roundConfig(){
    return ROUNDS[currentRoundIndex] || ROUNDS[0];
  }

  function totalRounds(){
    return ROUNDS.length;
  }

  function currentThreshold(){
    return MODE_THRESHOLDS[selectedMode] || MODE_THRESHOLDS.easy;
  }

  function currentBrushRadius(){
    return BRUSH_BY_MODE[selectedMode] || BRUSH_BY_MODE.easy;
  }

  function modeLabel(){
    if (selectedMode === "hard") return "Hard";
    if (selectedMode === "medium") return "Medium";
    return "Easy";
  }

  async function loadVerseJson(){
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

  function helpHtml(){
    return `
      <p><strong>Reveal the verse!</strong></p>
      <p>Scrub, wipe, rake, peel, and dig through six playful rounds.</p>
      <p>The verse is hiding behind each cover. Clear enough of the screen to move on.</p>
      <p>In the final archaeology round, dig carefully to find the hidden Bible. The less dirt you clear, the better your score.</p>
    `;
  }

  function renderTitleScreen(){
    window.VerseGameShell.renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: GAME_ICON,
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      startText: "Start Scrubbing",
      helpText: "How to Play",
      backLabel: "Back to Playground",
      theme: GAME_THEME,
      onBack: () => window.VerseGameBridge.exitGame(),
      onStart: renderModeSelect
    });
  }

  function renderModeSelect(){
    window.VerseGameShell.renderModeSelect({
      app,
      title: "Choose Your Scrub",
      icon: "🧽✨",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      backLabel: "Back to intro",
      theme: GAME_THEME,
      modes: [
        { id: "easy", label: "Easy" },
        { id: "medium", label: "Medium" },
        { id: "hard", label: "Hard" }
      ],
      onBack: renderTitleScreen,
      onSelect: (mode) => {
        selectedMode = ["easy", "medium", "hard"].includes(mode) ? mode : "easy";
        currentRoundIndex = 0;
        archaeologyScore = null;
        renderRoundIntro();
      }
    });
  }

  function renderRoundIntro(){
    cleanupRound();
    const round = roundConfig();
    const roundNumber = currentRoundIndex + 1;

    app.innerHTML = `
      <div class="vm-game-screen scripture-scrub-root">
        <button class="vm-game-back-pill no-zoom" id="scrubRoundBackBtn" type="button" aria-label="Back to mode select">◀</button>
        <div class="vm-game-stage scripture-scrub-round-title">
          <div class="vm-game-center">
            <div class="vm-game-icon" aria-hidden="true">${escapeHtml(round.icon)}</div>
            <div class="vm-game-title">${escapeHtml(round.title)}</div>
            <div class="vm-subtitle">${escapeHtml(round.intro)}</div>
            <div class="vm-game-actions">
              <button class="vm-btn" id="scrubStartRoundBtn" type="button">Start Round</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const backBtn = document.getElementById("scrubRoundBackBtn");
    const startBtn = document.getElementById("scrubStartRoundBtn");

    if (backBtn) backBtn.onclick = currentRoundIndex === 0 ? renderModeSelect : () => {
      currentRoundIndex = Math.max(0, currentRoundIndex - 1);
      renderRoundIntro();
    };

    if (startBtn) startBtn.onclick = renderRound;
  }

  function renderRound(){
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
          modeSelectText: "Mode Select",
          exitText: "Back to Playground",
          closeText: "Keep Scrubbing",
          showModeSelect: true
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
      onModeSelect: renderModeSelect,
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

    if (document.fonts?.ready){
      document.fonts.ready.then(() => fitVerseToScreen()).catch(() => {});
    }

    resizeHandler = () => {
      fitVerseToScreen();
      setupRoundVisuals(round);
    };
    window.addEventListener("resize", resizeHandler);

    setupRoundVisuals(round);
  }

  function getReferenceDisplay(){
    const book = parsedRef.book || "";
    const reference = parsedRef.reference || "";
    const display = [book, reference].filter(Boolean).join(" ").trim();
    return display || ctx.verseRef || ctx.verseId || "Verse";
  }

  function getVerseText(){
    return String(ctx.verseText || verseJson?.verseText || "").trim() || "Choose a verse to reveal.";
  }

  function hidePlanEntries(){
    return Array.isArray(verseJson?.hidePlan) ? verseJson.hidePlan : [];
  }

  function renderVerseHtml(){
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

  function fitVerseToScreen(){
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

    if (pill){
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

      for (const maxWidthPx of widthCandidates){
        for (const lineHeight of lineHeights){
          text.style.width = "100%";
          text.style.maxWidth = `${maxWidthPx}px`;
          text.style.marginLeft = "auto";
          text.style.marginRight = "auto";
          text.style.lineHeight = String(lineHeight);

          let low = minSize;
          let high = maxSize;
          let bestSize = minSize;

          for (let i = 0; i < 13; i += 1){
            const mid = (low + high) / 2;
            text.style.fontSize = `${mid}px`;

            if (verseOverflows(box, text)){
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

          if (!best || result.score > best.score){
            best = result;
          }
        }
      }

      if (best){
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

  function getDesiredLineRange(textLength, isDesktopStage){
    if (textLength >= 230) return isDesktopStage ? { min: 8, ideal: 10, max: 13 } : { min: 9, ideal: 11, max: 14 };
    if (textLength >= 170) return isDesktopStage ? { min: 7, ideal: 9, max: 11 } : { min: 8, ideal: 10, max: 12 };
    if (textLength >= 115) return isDesktopStage ? { min: 5, ideal: 7, max: 9 } : { min: 6, ideal: 8, max: 10 };
    if (textLength >= 70) return { min: 4, ideal: 5, max: 7 };
    return { min: 2, ideal: 3, max: 5 };
  }

  function getVerseWidthCandidates(stageWidth, textLength){
    const max = Math.min(stageWidth - 36, 760);
    const desktopLong = stageWidth >= 700 && textLength >= 150;
    const ratios = desktopLong
      ? [.86, .80, .74, .68, .62, .56]
      : [.96, .90, .84, .78, .72, .66];

    const out = [];
    for (const ratio of ratios){
      const value = Math.round(clamp(max * ratio, 300, max));
      if (!out.includes(value)) out.push(value);
    }
    return out;
  }

  function getVerseFitMetrics(box, text){
    const rects = [];
    for (const child of Array.from(text.children || [])){
      for (const rect of Array.from(child.getClientRects ? child.getClientRects() : [])){
        if (rect.width > .5 && rect.height > .5) rects.push(rect);
      }
    }

    if (!rects.length){
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
    for (const rect of rects){
      let line = lines.find((item) => Math.abs(item.top - rect.top) <= 3);
      if (!line){
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

  function scoreVerseFit({ metrics, desiredLines, textLength, fontSize }){
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

  function verseOverflows(box, text){
    const fudge = 2;
    return text.scrollWidth > box.clientWidth + fudge || text.scrollHeight > box.clientHeight + fudge;
  }

  function setupRoundVisuals(round){
    if (!coverCanvas || !coverCtx || !stageEl) return;

    const rect = stageEl.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    coverCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    coverCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    coverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, rect.width, rect.height);

    setupClearMask(rect.width, rect.height);

    const objectLayer = document.getElementById("scrubObjectLayer");
    const bibleLayer = document.getElementById("scrubBibleLayer");
    if (objectLayer) objectLayer.innerHTML = "";
    if (bibleLayer) bibleLayer.innerHTML = "";

    if (round.kind === "canvas"){
      drawCoverTexture(round.texture, rect.width, rect.height);
      wireCanvasScrub(round);
      updateProgress(0);
      return;
    }

    if (round.kind === "archaeology"){
      placeHiddenBible(rect.width, rect.height);
      drawCoverTexture("dirt", rect.width, rect.height);
      wireCanvasScrub(round);
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

  function drawCoverTexture(texture, width, height){
    coverCanvas.style.display = "block";
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.clearRect(0, 0, width, height);

    if (texture === "mud") return drawMud(width, height);
    if (texture === "paint") return drawPaint(width, height);
    if (texture === "fog") return drawFog(width, height);
    drawDirt(width, height);
  }

  function drawMud(width, height){
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6b3f20");
    gradient.addColorStop(.5, "#8a5429");
    gradient.addColorStop(1, "#4a2b19");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 220; i += 1){
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
    const minRadius = clamp(base * 0.045, 28, 56);
    const maxRadius = clamp(base * 0.135, 78, 152);

    for (let i = 0; i < splatterCount; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const color = colors[Math.floor(Math.random() * colors.length)];

      coverCtx.beginPath();
      coverCtx.fillStyle = color;
      coverCtx.globalAlpha = 0.92;
      coverCtx.arc(x, y, r, 0, Math.PI * 2);
      coverCtx.fill();

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

  function drawFog(width, height){
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(235,250,255,.93)");
    gradient.addColorStop(.5, "rgba(221,241,248,.88)");
    gradient.addColorStop(1, "rgba(249,253,255,.94)");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 90; i += 1){
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

  function drawDirt(width, height){
    const gradient = coverCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#9c733e");
    gradient.addColorStop(.48, "#6f4e2b");
    gradient.addColorStop(1, "#4d341e");
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 520; i += 1){
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 1 + Math.random() * 5;
      coverCtx.beginPath();
      coverCtx.fillStyle = Math.random() > .5 ? "rgba(55,34,18,.28)" : "rgba(198,153,87,.22)";
      coverCtx.arc(x, y, r, 0, Math.PI * 2);
      coverCtx.fill();
    }
  }

  function wireCanvasScrub(round){
    coverCanvas.onpointerdown = (event) => {
      if (menuOpen || completionLocked) return;
      event.preventDefault();
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

  function getCanvasPoint(event){
    const rect = coverCanvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height)
    };
  }

  function scrubAt(x, y, radius, round){
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

  function scrubLine(from, to, radius, round){
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (radius * .55)));
    for (let i = 0; i <= steps; i += 1){
      const t = i / steps;
      scrubAt(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius, round);
    }
  }

  function drawMudFlick(x, y, radius){
    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.fillStyle = "rgba(76,43,22,.12)";
    for (let i = 0; i < 3; i += 1){
      coverCtx.beginPath();
      coverCtx.arc(x + (Math.random() - .5) * radius * 2.2, y + (Math.random() - .5) * radius * 2.2, 2 + Math.random() * 4, 0, Math.PI * 2);
      coverCtx.fill();
    }
    coverCtx.restore();
  }

  function drawPaintSmear(x, y, radius){
    coverCtx.save();
    coverCtx.globalCompositeOperation = "source-over";
    coverCtx.globalAlpha = .08;
    coverCtx.fillStyle = SPECIAL_COLORS[Math.floor(Math.random() * SPECIAL_COLORS.length)];
    coverCtx.beginPath();
    coverCtx.ellipse(x, y, radius * 1.5, radius * .35, Math.random() * Math.PI, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();
  }

  function drawCleanWindowShine(x, y, radius){
    coverCtx.save();
    coverCtx.globalCompositeOperation = "destination-out";
    coverCtx.globalAlpha = .22;
    coverCtx.beginPath();
    coverCtx.arc(x, y, radius * 1.45, 0, Math.PI * 2);
    coverCtx.fill();
    coverCtx.restore();
  }

  function scheduleCoverageCheck(round, immediate = false){
    if (coverageCheckTimer) return;

    const delay = immediate ? 0 : 90;
    coverageCheckTimer = setTimeout(() => {
      coverageCheckTimer = null;
      const cleared = measureClearedRatio();
      updateProgress(cleared);

      if (round.kind === "archaeology"){
        checkBibleFound(cleared);
        return;
      }

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

  function updateProgress(ratio){
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

    const count = selectedMode === "hard" ? 46 : selectedMode === "medium" ? 40 : 34;
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

    const imageBag = shuffle(LEAF_IMAGES.concat(LEAF_IMAGES, LEAF_IMAGES, LEAF_IMAGES, LEAF_IMAGES, LEAF_IMAGES));

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
      rakeLeavesAt(event.clientX, event.clientY);
    };

    stageEl.onpointermove = (event) => {
      if (menuOpen || completionLocked) return;
      if (event.buttons || event.pointerType === "touch") rakeLeavesAt(event.clientX, event.clientY);
    };
  }

  function rakeLeavesAt(clientX, clientY) {
    const leaves = Array.from(document.querySelectorAll(".scrub-leaf:not(.is-raked)"));
    const stageWidth = stageEl?.getBoundingClientRect?.().width || 420;
    const hitRadius = getCoverObjectSize("leaf", stageWidth) * (selectedMode === "hard" ? .46 : .54);

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

    if (ratio >= currentThreshold()) completeRound();
  }

  function pickStickerDesign(index) {
    const style = STICKER_STYLES[index % STICKER_STYLES.length];
    const shape = STICKER_SHAPES[Math.floor(Math.random() * STICKER_SHAPES.length)];
    const border = STICKER_BORDERS[Math.floor(Math.random() * STICKER_BORDERS.length)];

    return {
      bg: style.bg,
      fg: style.fg,
      borderColor: style.border,
      shape,
      border
    };
  }

  function shouldUseWordSticker(index) {
    return index % 4 === 0;
  }



  function generateStickerPositions(count, width, height, stickerSize) {
    const safeCount = Math.max(1, Number(count) || 1);
    const marginX = Math.max(42, stickerSize * 0.58);
    const top = Math.max(112, height * 0.14);
    const bottom = Math.min(height - Math.max(44, stickerSize * 0.48), height * 0.88);
    const usableW = Math.max(1, width - marginX * 2);
    const usableH = Math.max(1, bottom - top);

    const cols = width >= 760 ? 5 : 4;
    const rows = Math.ceil(safeCount / cols);
    const cellW = usableW / cols;
    const cellH = usableH / rows;

    const positions = [];

    for (let i = 0; i < safeCount; i += 1) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = marginX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.22;
      const y = top + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.18;

      positions.push({
        x: clamp(x, marginX, width - marginX),
        y: clamp(y, top, bottom)
      });
    }

    return shuffle(positions);
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

    const count = selectedMode === "hard" ? 24 : selectedMode === "medium" ? 20 : 16;
    const baseSize = getCoverObjectSize("sticker", width);
    const positions = generateStickerPositions(count, width, height, baseSize);

    objectTotal = count;
    objectCleared = 0;
    updateProgress(0);

    const emojis = shuffle(STICKER_EMOJIS.concat(STICKER_EMOJIS, STICKER_EMOJIS, STICKER_EMOJIS));
    const words = shuffle(STICKER_WORDS.concat(STICKER_WORDS, STICKER_WORDS));

    for (let i = 0; i < count; i += 1) {
      const pos = positions[i];

      const useWord = shouldUseWordSticker(i);
      const content = useWord ? words[i % words.length] : emojis[i % emojis.length];
      const design = pickStickerDesign(i + Math.floor(Math.random() * STICKER_STYLES.length));

      const sizeVariation = useWord
        ? 0.96 + Math.random() * 0.08
        : 0.92 + Math.random() * 0.10;

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

      btn.setAttribute("aria-label", useWord ? `Peel ${content} sticker` : `Peel ${content} sticker`);
      btn.style.width = `${stickerWidth}px`;
      btn.style.height = `${stickerHeight}px`;
      btn.style.left = `${pos.x}px`;
      btn.style.top = `${pos.y}px`;
      btn.style.zIndex = String(20 + i);
      btn.style.setProperty("--scrub-rot", `${Math.round(-11 + Math.random() * 22)}deg`);
      btn.style.setProperty("--sticker-bg", design.bg);
      btn.style.setProperty("--sticker-fg", design.fg);
      btn.style.setProperty("--sticker-border", design.borderColor);
      btn.style.setProperty("--sticker-emoji-size", `${emojiSize}px`);
      btn.style.setProperty("--sticker-word-size", `${wordSize}px`);

      btn.onclick = () => peelSticker(btn);
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

    const peelStyle = STICKER_PEEL_STYLES[Math.floor(Math.random() * STICKER_PEEL_STYLES.length)];
    btn.classList.add(peelStyle);
    btn.classList.add("is-peeled");

    objectCleared += 1;
    const ratio = objectTotal ? objectCleared / objectTotal : 0;
    updateProgress(ratio);

    if (ratio >= currentThreshold()) completeRound();
  }

  function placeHiddenBible(width, height){
    const layer = document.getElementById("scrubBibleLayer");
    if (!layer) return;

    const size = clamp(Math.min(width, height) * (selectedMode === "hard" ? .13 : selectedMode === "medium" ? .15 : .18), 62, 122);
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

  function checkBibleFound(clearedRatio){
    if (!bibleRect || !coverCanvas || !coverCtx || completionLocked) return;

    const revealRatio = measureBibleRevealRatio();
    if (revealRatio < .42) return;

    archaeologyScore = calculateArchaeologyScore(clearedRatio);
    const bible = document.getElementById("scrubBibleTarget");
    if (bible) bible.classList.add("is-found");
    updateProgress(clearedRatio);
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

  function calculateArchaeologyScore(clearedRatio){
    const score = Math.round(100 - clamp(clearedRatio, 0, 1) * 80);
    return clamp(score, 10, 100);
  }

  function completeRound() {
    if (completionLocked) return;
    completionLocked = true;
    pointerDown = false;

    if (coverCanvas) {
      coverCanvas.style.pointerEvents = "none";
    }

    animateAutoCleanCover(() => {
      clearMaskFully();
      updateProgress(1);
      clearRemainingObjects();

      if (stageEl) stageEl.classList.add("scrub-round-complete");

      launchSparkles();
      showNextRoundPill();
    });
  }

  function animateAutoCleanCover(onDone = () => { }) {
    if (!stageEl || !coverCanvas || !coverCtx || coverCanvas.style.display === "none") {
      setTimeout(onDone, 360);
      return;
    }

    const rect = stageEl.getBoundingClientRect();

    const sweep = document.createElement("div");
    sweep.className = "scrub-clean-sweep";
    stageEl.appendChild(sweep);

    const start = performance.now();
    const duration = 1250;
    let previousWipeX = 0;

    function frame(now) {
      const rawProgress = clamp((now - start) / duration, 0, 1);
      const easedProgress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      const wipeX = rect.width * easedProgress;
      const bandPadding = 34;

      coverCtx.save();
      coverCtx.globalCompositeOperation = "destination-out";
      coverCtx.clearRect(
        Math.max(0, previousWipeX - bandPadding),
        0,
        Math.min(rect.width, wipeX - previousWipeX + bandPadding * 2),
        rect.height
      );
      coverCtx.restore();

      previousWipeX = Math.max(previousWipeX, wipeX);

      updateProgress(Math.max(currentThreshold(), easedProgress));

      if (rawProgress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      coverCtx.save();
      coverCtx.globalCompositeOperation = "destination-out";
      coverCtx.clearRect(0, 0, rect.width, rect.height);
      coverCtx.restore();

      setTimeout(() => {
        sweep.remove();
        onDone();
      }, 120);
    }

    requestAnimationFrame(frame);
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
      renderRoundIntro();
    };
  }

  function showRoundReward({ title, icon, message, primaryText, onPrimary }){
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

  function launchSparkles(){
    const layer = document.getElementById("scrubRewardLayer");
    if (!layer) return;

    const icons = ["✨", "⭐", "💫", "🌟"];
    for (let i = 0; i < 28; i += 1){
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

  function renderEndScreen(){
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
      title: "Scripture Scrub Complete!",
      icon: "🧽",
      statsHtml: `<div>${escapeHtml(scoreLine)}</div><div>Careful Dig Score: ${escapeHtml(score)}</div>`,
      playAgainText: "Try Again",
      moreGamesText: "More Activities",
      backLabel: "Back to Playground",
      theme: GAME_THEME,
      onPlayAgain: () => {
        currentRoundIndex = 0;
        archaeologyScore = null;
        renderModeSelect();
      },
      onMoreGames: () => window.VerseGameBridge.exitGame()
    });
  }

  function cleanupRound(){
    if (coverageCheckTimer){
      clearTimeout(coverageCheckTimer);
      coverageCheckTimer = null;
    }

    if (resizeHandler){
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }

    if (stageEl){
      stageEl.onpointerdown = null;
      stageEl.onpointermove = null;
    }

    if (coverCanvas){
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
    pointerDown = false;
    lastPoint = null;
    menuOpen = false;
  }

  verseJson = await loadVerseJson();
  renderTitleScreen();
})();
