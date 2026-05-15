(function () {
  "use strict";

  const GAME_ID = "ghost_writer";
  const GAME_TITLE = "Ghost Writer";
  const GAME_ICON = "👻";
  const HELP_OVERLAY_ID = "ghostWriterHelpOverlay";
  const MENU_OVERLAY_ID = "ghostWriterGameMenuOverlay";

  const GAME_THEME = {
    bg: "linear-gradient(180deg, #101114 0%, #252733 48%, #111217 100%)",
    accent: "#d8d3ff",
    helpTitleBg: "#252733",
    helpTitleColor: "#ffffff",
    helpCloseBg: "#252733",
    helpCloseColor: "#ffffff"
  };

  const MODES = [
    { id: "beginner", label: "👻 Beginner" },
    { id: "advanced", label: "🌙 Advanced" }
  ];

  const COLOR_PALETTE = {
    red: { label: "Red", value: "#ff5a51" },
    orange: { label: "Orange", value: "#ffa351" },
    yellow: { label: "Yellow", value: "#ffc751" },
    green: { label: "Green", value: "#a7cb6f" },
    teal: { label: "Blue", value: "#40b9c5" },
    purple: { label: "Purple", value: "#7f66c6" },
    darkGray: { label: "Dark Gray", value: "#333333" },
    lightGray: { label: "White", value: "#ffffff" },
    brown: { label: "Brown", value: "#a36f44" }
  };


  const BACKGROUNDS = {
    ghost: {
      label: "Ghost Black",
      kind: "special",
      value: "#050509",
      cardClass: "",
      texture: "ghost"
    },
    red: { ...COLOR_PALETTE.red, kind: "solid", cardClass: "" },
    orange: { ...COLOR_PALETTE.orange, kind: "solid", cardClass: "" },
    yellow: { ...COLOR_PALETTE.yellow, kind: "solid", cardClass: "" },
    green: { ...COLOR_PALETTE.green, kind: "solid", cardClass: "" },
    teal: { ...COLOR_PALETTE.teal, kind: "solid", cardClass: "" },
    purple: { ...COLOR_PALETTE.purple, kind: "solid", cardClass: "" },
    darkGray: { ...COLOR_PALETTE.darkGray, kind: "solid", cardClass: "" },
    lightGray: { ...COLOR_PALETTE.lightGray, kind: "solid", cardClass: "" },
    brown: { ...COLOR_PALETTE.brown, kind: "solid", cardClass: "" },

    chalkboard: {
      label: "Chalkboard",
      kind: "special",
      value: "#15352d",
      cardClass: "is-chalkboard",
      texture: "chalkboard"
    },
    paper: {
      label: "Paper",
      kind: "special",
      value: "#fff8e8",
      cardClass: "is-paper",
      texture: "paper"
    },
    notebook: {
      label: "Notebook Paper",
      kind: "special",
      value: "#fbfdff",
      cardClass: "",
      texture: "notebook"
    },
    starryNight: {
      label: "Starry Night",
      kind: "special",
      value: "#071126",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_starry_night.png"
    },
    purpleMist: {
      label: "Purple Mist",
      kind: "special",
      value: "#21142f",
      cardClass: "",
      texture: "purpleMist"
    },
    treasureMap: {
      label: "Treasure Map",
      kind: "special",
      value: "#d9b874",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_treasure_map.png"
    },
    rainbow: {
      label: "Rainbow",
      kind: "special",
      value: "#f8f1ff",
      cardClass: "",
      texture: "rainbow"
    },
    wood: {
      label: "Wood",
      kind: "special",
      value: "#8d5a32",
      cardClass: "",
      texture: "wood"
    },
    crackedStone: {
      label: "Cracked Stone",
      kind: "special",
      value: "#787d83",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_cracked_stone.png"
    },
    grass: {
      label: "Green Grass",
      kind: "special",
      value: "#7dbc53",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_grass.png"
    },
    aquaRed: {
      label: "Swoosh Red",
      kind: "special",
      value: "#d85b61",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_red.jpg"
    },
    aquaOrange: {
      label: "Swoosh Orange",
      kind: "special",
      value: "#d98b4c",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_orange.jpg"
    },
    aquaYellow: {
      label: "Swoosh Yellow",
      kind: "special",
      value: "#d8ba54",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_yellow.jpg"
    },
    aquaGreen: {
      label: "Swoosh Green",
      kind: "special",
      value: "#5eac74",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_green.jpg"
    },
    aquaBlue: {
      label: "Swoosh Blue",
      kind: "special",
      value: "#4d8fcb",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_blue.jpg"
    },
    aquaPurple: {
      label: "Swoosh Purple",
      kind: "special",
      value: "#8f71c8",
      cardClass: "",
      texture: "image",
      imageSrc: "./ghost_writer_images/ghost_writer_bg_aqua_purple.jpg"
    }
  };

  const TEXT_COLORS = {
    ...COLOR_PALETTE,
    rainbow: { label: "Rainbow", value: "rainbow" }
  };

  const RAINBOW_INKS = [
    "#ff5a51",
    "#ffa351",
    "#ffc751",
    "#a7cb6f",
    "#40b9c5",
    "#7f66c6"
  ];



  const SPEEDS = {
    slow: { label: "Slow", multiplier: 1.8, pauseMultiplier: 1.8 },
    normal: { label: "Normal", multiplier: .85, pauseMultiplier: .85 },
    fast: { label: "Fast", multiplier: .32, pauseMultiplier: .35 }
  };

  const THICKNESS = {
    thin: { label: "Thin", multiplier: .78 },
    normal: { label: "Normal", multiplier: 1 },
    thick: { label: "Thick", multiplier: 1.35 },
    superThick: { label: "Super Thick", multiplier: 1.9 }
  };

  const BORDER_STYLES = {
    none: { label: "None" },
    solid: { label: "Solid" },
    dashed: { label: "Dashed" },
    dotted: { label: "Dotted" },
    double: { label: "Double" },
    glow: { label: "Glow" }
  };

  const BORDER_THICKNESS = {
    thin: { label: "Thin", size: 4 },
    medium: { label: "Medium", size: 8 },
    thick: { label: "Thick", size: 13 }
  };

  const PLAYBACK_TOOL = {
    baseRotationDeg: -8,
    idleWobbleDeg: 1.2,
    directionWiggleDeg: 4.5,
    directionWiggleDecay: .82,
    visible: true
  };

  const PLAYBACK_TOOLS = {
    pencil: {
      label: "Pencil",
      src: "./ghost_writer_images/ghost_writer_pencil.png",
      className: "is-pencil-tool",
      baseRotationDeg: -8
    },
    chalk: {
      label: "Chalk",
      src: "./ghost_writer_images/ghost_writer_chalk.png",
      className: "is-chalk-tool",
      baseRotationDeg: -8
    },
    crayon: {
      label: "Crayon",
      src: "",
      className: "is-crayon-tool",
      baseRotationDeg: -8
    }
  };

  const CRAYON_TOOL_IMAGES = {
    red: "./ghost_writer_images/ghost_writer_crayon_red.png",
    orange: "./ghost_writer_images/ghost_writer_crayon_orange.png",
    yellow: "./ghost_writer_images/ghost_writer_crayon_yellow.png",
    green: "./ghost_writer_images/ghost_writer_crayon_green.png",
    teal: "./ghost_writer_images/ghost_writer_crayon_blue.png",
    purple: "./ghost_writer_images/ghost_writer_crayon_purple.png",
    darkGray: "./ghost_writer_images/ghost_writer_crayon_gray.png",
    lightGray: "./ghost_writer_images/ghost_writer_crayon_white.png",
    brown: "./ghost_writer_images/ghost_writer_crayon_brown.png",
    rainbow: "./ghost_writer_images/ghost_writer_crayon_rainbow.png"
  };

  const VAPOR_LEVELS = {
    off: {
      label: "Off",
      enabled: false,
      max: 0,
      spawnDistance: Infinity,
      alpha: 0,
      radius: 0,
      radiusJitter: 0,
      life: 0,
      lifeJitter: 0,
      driftY: 0
    },

    normal: {
      label: "Normal",
      enabled: true,
      max: 54,
      spawnDistance: 5,
      alpha: .18,
      radius: 7,
      radiusJitter: 13,
      life: 520,
      lifeJitter: 260,
      driftY: 18
    },
    spooky: {
      label: "Spooky",
      enabled: true,
      max: 86,
      spawnDistance: 3,
      alpha: .26,
      radius: 10,
      radiusJitter: 18,
      life: 760,
      lifeJitter: 360,
      driftY: 26
    }
  };

  const PLAYBACK_PAUSES = {
    word: 115,
    punctuation: 175,
    line: 330
  };

  const EXPORT_IMAGE = {
    filenamePrefix: "ghost-writer"
  };

  const EXPORT_SIZES = {
    square: {
      label: "Square",
      width: 1080,
      height: 1080,
      filenameLabel: "square"
    },
    phone: {
      label: "Tall",
      width: 1290,
      height: 2796,
      filenameLabel: "tall"
    },
    wide: {
      label: "Wide",
      width: 1920,
      height: 1080,
      filenameLabel: "wide"
    }
  };

  const GUIDE_FIT = {
    letterWidth: .86,
    letterHeight: .88,
    symbolWidth: .68,
    skinnySymbolWidth: .42,
    symbolHeight: .76,
    maxLetterSize: 1.28,
    maxSymbolSize: 1.18,
    minSize: .32
  };

  const CENTERED_TRAINING_GUIDES = new Set([".", ",", ":", ";", "'", '"', "-"]);

  const GUIDE_RENDER_PROFILES = {
    ".": { yOffset: -.24 },
    ",": { yOffset: -.34 },
    ":": { yOffset: -.02 },
    ";": { yOffset: -.08 },
    "'": { yOffset: .10 },
    "\"": { yOffset: .10 },
    "-": { yOffset: 0 }
  };

  const REFERENCE_DECORATION_STYLES = ["box", "divider", "underline", "loop", "cloud", "stars"];

  const REFERENCE_DECORATION_OPTIONS = {
    box: { label: "Box" },
    divider: { label: "Squiggle Divider" },
    underline: { label: "Scribble Underline" },
    loop: { label: "Loopy Circle" },
    cloud: { label: "Cloud Puff" },
    stars: { label: "Stars" }
  };

  const REFERENCE_DECORATION = {
    refScale: .62,
    beforeGapLines: .28,
    zoneHeightLines: 1,
    dividerExtraLines: .28,
    boxPadX: .40,
    boxPadY: .16,
    cloudPadX: .70,
    cloudPadY: .32,
    loopPadX: .68,
    loopPadY: .28,
    starPadX: 1.25
  };

  const GLYPH_RENDER_PROFILES = {
    ".": {
      widthScale: .34,
      heightScale: .18,
      verticalAlign: "bottom",
      yOffset: -.02
    },
    ",": {
      widthScale: .36,
      heightScale: .26,
      verticalAlign: "bottom",
      yOffset: .07
    },
    ":": {
      widthScale: .38,
      heightScale: .50,
      verticalAlign: "middle",
      yOffset: 0
    },
    ";": {
      widthScale: .40,
      heightScale: .56,
      verticalAlign: "middle",
      yOffset: .04
    },
    "'": {
      widthScale: .30,
      heightScale: .34,
      verticalAlign: "top",
      yOffset: .03
    },
    "\"": {
      widthScale: .46,
      heightScale: .34,
      verticalAlign: "top",
      yOffset: .03
    },
    "-": {
      widthScale: .58,
      heightScale: .24,
      verticalAlign: "middle",
      yOffset: 0
    }
  };

  const app = document.getElementById("app");

  const DEBUG_GHOST_WRITER = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("gwDebug") === "1" || localStorage.getItem("ghostWriterDebug") === "1";
    } catch (err) {
      return false;
    }
  })();

  // Debug capture for handwriting issues.
  // Enable with ?gwDebug=1 or localStorage.setItem("ghostWriterDebug", "1").
  // Then run this in DevTools after testing:
  // copy(window.getGhostWriterDebugJson())
  window.GHOST_WRITER_DEBUG_LOG = Array.isArray(window.GHOST_WRITER_DEBUG_LOG)
    ? window.GHOST_WRITER_DEBUG_LOG
    : [];

  window.getGhostWriterDebugJson = function () {
    return JSON.stringify(window.GHOST_WRITER_DEBUG_LOG || [], null, 2);
  };

  window.clearGhostWriterDebugLog = function () {
    window.GHOST_WRITER_DEBUG_LOG = [];
    return true;
  };

  let ctx = {
    verseId: "",
    verseText: "",
    verseRef: "",
    translation: ""
  };

  let parsedRef = null;
  let selectedMode = "beginner";
  let muted = false;
  let guideTimer = null;
  let playbackRaf = 0;
  let playbackState = null;
  const backgroundImageCache = new Map();

  const state = {
    screen: "intro",
    fullText: "",
    verseTextOnly: "",
    referenceText: "",
    displayLines: [],
    requiredChars: [],
    referenceDecorationStyle: "box",
    currentCharIndex: 0,
    currentStrokes: [],
    currentStroke: null,
    glyphs: new Map(),
    hasDrawnCurrent: false,
    practiceMarked: false,
    remix: {
      background: "ghost",
      textColor: "lightGray",
      borderStyle: "none",
      borderThickness: "medium",
      borderColor: "lightGray",
      tool: "pencil",
      vapor: "normal",
      exportSize: "square",
      style: "ghost",
      speed: "normal",
      thickness: "normal",
      jitter: "off",
      wobble: "off"
    }
  };

  function shell() {
    return window.VerseGameShell || {};
  }

  function bridge() {
    return window.VerseGameBridge || {};
  }

  function escapeHtml(value) {
    if (shell().escapeHtml) return shell().escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    if (shell().clamp) return shell().clamp(value, min, max);
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeTextForGhost(text) {
    return String(text ?? "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function buildFullText() {
    parsedRef = shell().parseReferenceParts
      ? shell().parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId)
      : { book: ctx.verseRef || "", reference: "", display: ctx.verseRef || "" };

    const verse = normalizeTextForGhost(ctx.verseText || "");
    const ref = normalizeTextForGhost(
      [parsedRef?.book || "", parsedRef?.reference || ""].filter(Boolean).join(" ")
    );

    state.verseTextOnly = verse || "WRITE THE VERSE";
    state.referenceText = ref;
    state.displayLines = ref ? [state.verseTextOnly, ref] : [state.verseTextOnly];
    state.fullText = state.displayLines.join("\n");
    state.requiredChars = extractRequiredChars(state.fullText);
  }
  

  function extractRequiredChars(text) {
    const out = [];
    const seen = new Set();

    for (const char of String(text || "")) {
      if (/\s/.test(char)) continue;
      if (seen.has(char)) continue;
      seen.add(char);
      out.push(char);
    }

    return out;
  }

  function chooseReferenceDecorationStyle() {
    const index = Math.floor(Math.random() * REFERENCE_DECORATION_STYLES.length);
    return REFERENCE_DECORATION_STYLES[index] || "box";
  }

  function helpHtml() {
    return `
      <ul class="ghost-help-list">
        <li>Write each uppercase character one time in the big square.</li>
        <li>Beginner keeps a light guide on the page. Advanced flashes the guide, then hides it.</li>
        <li>When every character is ready, tap <strong>Ghost Write!</strong> and watch the verse write itself.</li>
        <li>After the first ghost writing, remix it with fun backgrounds, colors, borders, and writing tools.</li>
      </ul>
    `;
  }

  function renderIntro() {
    stopPlayback();
    clearGuideTimer();
    state.screen = "intro";

    shell().renderTitleScreen({
      app,
      title: GAME_TITLE,
      icon: GAME_ICON,
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      startText: "Start",
      helpText: "How to Play",
      backLabel: "Back to Playground",
      theme: GAME_THEME,
      onBack: () => bridge().exitGame?.(),
      onStart: () => renderModeSelect()
    });
  }

  function renderModeSelect() {
    stopPlayback();
    clearGuideTimer();
    state.screen = "mode";

    shell().renderModeSelect({
      app,
      title: "Choose Your Ghost",
      icon: "👻✍️",
      helpHtml: helpHtml(),
      helpOverlayId: HELP_OVERLAY_ID,
      backLabel: "Back to Ghost Writer title",
      theme: GAME_THEME,
      modes: MODES,
      onBack: () => renderIntro(),
      onSelect: (mode) => startRun(mode)
    });
  }

  function startRun(mode) {
    stopPlayback();
    clearGuideTimer();

    selectedMode = mode === "advanced" ? "advanced" : "beginner";
    state.screen = "training";
    state.currentCharIndex = 0;
    state.currentStrokes = [];
    state.currentStroke = null;
    state.glyphs = new Map();
    state.hasDrawnCurrent = false;
    state.practiceMarked = false;
    state.referenceDecorationStyle = chooseReferenceDecorationStyle();
    state.remix = {
      background: "ghost",
      textColor: "lightGray",
      borderStyle: "none",
      borderThickness: "medium",
      borderColor: "lightGray",
      tool: "pencil",
      vapor: "normal",
      exportSize: "square",
      style: "ghost",
      speed: "normal",
      thickness: "normal",
      jitter: "off",
      wobble: "off"
    };

    renderTraining();
  }

  function rootHtml(inner, { wide = false, menu = true, rootClass = "" } = {}) {
    const safeRootClass = rootClass ? ` ${escapeHtml(rootClass)}` : "";

    return `
      <div class="ghost-writer-root${safeRootClass}">
        ${menu ? `<button class="ghost-menu-pill no-zoom" id="ghostMenuPill" type="button" aria-label="Open game menu">☰</button>` : ""}
        <div class="ghost-writer-stage ${wide ? "is-wide" : ""}">
          ${inner}
        </div>
        ${shell().helpOverlayHtml ? shell().helpOverlayHtml({ id: HELP_OVERLAY_ID, title: "How to Play", body: helpHtml(), closeText: "Close" }) : ""}
        ${shell().gameMenuHtml ? shell().gameMenuHtml({
      id: MENU_OVERLAY_ID,
      title: "Ghost Writer Menu",
      muted,
      showModeSelect: true,
      exitText: "Back to Playground",
      modeSelectText: "Mode Select"
    }) : ""}
      </div>
    `;
  }


  function wireMenu() {
    if (!shell().wireGameMenu) return;

    shell().wireGameMenu({
      id: MENU_OVERLAY_ID,
      menuButtonId: "ghostMenuPill",
      helpOverlayId: HELP_OVERLAY_ID,
      isMuted: () => muted,
      onMuteToggle: () => {
        muted = !muted;
        return muted;
      },
      onModeSelect: () => renderModeSelect(),
      onExit: () => bridge().exitGame?.(),
      onOpen: () => true,
      onClose: () => { },
      onBackFromHelp: () => { }
    });
  }

  function currentChar() {
    return state.requiredChars[state.currentCharIndex] || "";
  }

  function isSymbolChar(char) {
    return !/[A-Z0-9]/.test(char);
  }

  function isAlphaNumericChar(char) {
    return /^[A-Z0-9]$/.test(String(char || ""));
  }

  function allowsDotStroke(char) {
    return [".", ":", ";", "!", "?"].includes(String(char || ""));
  }

  function getGuideRenderProfile(char) {
    return GUIDE_RENDER_PROFILES[String(char || "")] || null;
  }


  function charLabel(char) {
    if (char === "\"") return "quotation mark";
    if (char === "'") return "apostrophe";
    if (char === ":") return "colon";
    if (char === ";") return "semicolon";
    if (char === ",") return "comma";
    if (char === ".") return "period";
    if (char === "!") return "exclamation mark";
    if (char === "?") return "question mark";
    if (char === "-") return "dash";
    return char;
  }

  function renderTraining() {
    clearGuideTimer();
    state.screen = "training";

    const char = currentChar();
    const total = Math.max(1, state.requiredChars.length);
    const progress = state.currentCharIndex / total;
    const modeLabel = selectedMode === "advanced" ? "Advanced" : "Beginner";

    app.innerHTML = rootHtml(`
      <div class="ghost-card">
        <div class="ghost-topline">
          <span class="ghost-pill">${escapeHtml(modeLabel)}</span>
          <div class="ghost-progress-track" aria-hidden="true"><div class="ghost-progress-fill" style="width:${Math.round(progress * 100)}%"></div></div>
          <span class="ghost-pill">${escapeHtml(String(state.currentCharIndex + 1))}/${escapeHtml(String(total))}</span>
        </div>

        <div class="ghost-prompt">
          <div class="ghost-prompt-title">Write: ${escapeHtml(char)}</div>
          <div class="ghost-prompt-sub">Draw the ${escapeHtml(charLabel(char))} nice and big.</div>
        </div>

        <div class="ghost-draw-wrap" id="ghostDrawWrap">
          <div class="ghost-guide-text ${isSymbolChar(char) ? "is-symbol" : ""}" id="ghostGuideText">${escapeHtml(char)}</div>
          <canvas id="ghostDrawCanvas" aria-label="Draw ${escapeHtml(charLabel(char))}"></canvas>
        </div>

        <div class="ghost-train-actions">
          <button class="vm-btn vm-btn-secondary" id="ghostClearBtn" type="button">Clear</button>
          <button class="vm-btn" id="ghostSaveBtn" type="button" disabled>Save &amp; Next</button>
        </div>
      </div>
    `, { menu: true });

    wireMenu();
    setupDrawingCanvas();
    fitGuideCharacter();
    updateSaveButton();

    document.getElementById("ghostClearBtn")?.addEventListener("click", clearCurrentDrawing);
    document.getElementById("ghostSaveBtn")?.addEventListener("click", saveCurrentGlyph);

    if (selectedMode === "advanced") {
      guideTimer = setTimeout(() => {
        document.getElementById("ghostGuideText")?.classList.add("is-faded");
      }, 950);
    }
  }

  function setupCanvasForDpr(canvas, cssWidth, cssHeight) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.dataset.cssWidth = String(cssWidth);
    canvas.dataset.cssHeight = String(cssHeight);
    return c;
  }

  function setupDrawingCanvas() {
    const canvas = document.getElementById("ghostDrawCanvas");
    const wrap = document.getElementById("ghostDrawWrap");
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    c.clearRect(0, 0, rect.width, rect.height);
    drawAllTrainingStrokes(c, rect.width, rect.height);

    const getPoint = (event) => {
      const r = canvas.getBoundingClientRect();
      const x = clamp((event.clientX - r.left) / Math.max(1, r.width), 0, 1);
      const y = clamp((event.clientY - r.top) / Math.max(1, r.height), 0, 1);
      return { x, y, t: performance.now() };
    };

    canvas.onpointerdown = (event) => {
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      const point = getPoint(event);
      state.currentStroke = [point];
      state.currentStrokes.push(state.currentStroke);
      state.hasDrawnCurrent = true;
      drawTrainingPoint(c, point, rect.width, rect.height);
      updateSaveButton();
    };

    canvas.onpointermove = (event) => {
      if (!state.currentStroke) return;
      event.preventDefault();
      const point = getPoint(event);
      const stroke = state.currentStroke;
      const previous = stroke[stroke.length - 1];
      stroke.push(point);
      drawTrainingSegment(c, previous, point, rect.width, rect.height);
    };

    const endStroke = (event) => {
      if (!state.currentStroke) return;
      event.preventDefault?.();
      const stroke = state.currentStroke;
      if (stroke.length === 1) {
        drawTrainingPoint(c, stroke[0], rect.width, rect.height);
      }
      state.currentStroke = null;
    };

    canvas.onpointerup = endStroke;
    canvas.onpointercancel = endStroke;
    canvas.onpointerleave = endStroke;
  }

  function drawTrainingPoint(c, point, width, height) {
    c.save();
    c.fillStyle = "#16171d";
    c.beginPath();
    c.arc(point.x * width, point.y * height, Math.max(3.5, width * .011), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawTrainingSegment(c, a, b, width, height) {
    c.save();
    c.strokeStyle = "#16171d";
    c.lineWidth = Math.max(7, width * .022);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(a.x * width, a.y * height);
    c.lineTo(b.x * width, b.y * height);
    c.stroke();
    c.restore();
  }

  function drawAllTrainingStrokes(c, width, height) {
    for (const stroke of state.currentStrokes) {
      if (!stroke || !stroke.length) continue;
      if (stroke.length === 1) {
        drawTrainingPoint(c, stroke[0], width, height);
        continue;
      }
      for (let i = 1; i < stroke.length; i += 1) {
        drawTrainingSegment(c, stroke[i - 1], stroke[i], width, height);
      }
    }
  }

  function clearCurrentDrawing() {
    state.currentStrokes = [];
    state.currentStroke = null;
    state.hasDrawnCurrent = false;
    const canvas = document.getElementById("ghostDrawCanvas");
    if (canvas) {
      const width = Number(canvas.dataset.cssWidth) || canvas.getBoundingClientRect().width;
      const height = Number(canvas.dataset.cssHeight) || canvas.getBoundingClientRect().height;
      const c = setupCanvasForDpr(canvas, width, height);
      c.clearRect(0, 0, width, height);
    }
    updateSaveButton();
  }

  function updateSaveButton() {
    const btn = document.getElementById("ghostSaveBtn");
    if (!btn) return;
    btn.disabled = !state.hasDrawnCurrent;
  }

  function saveCurrentGlyph() {
    if (!state.hasDrawnCurrent) return;

    const char = currentChar();
    const glyph = makeGlyph(char, state.currentStrokes);
    state.glyphs.set(char, glyph);

    state.currentCharIndex += 1;
    state.currentStrokes = [];
    state.currentStroke = null;
    state.hasDrawnCurrent = false;

    if (state.currentCharIndex >= state.requiredChars.length) {
      renderReady();
      return;
    }

    renderTraining();
  }

  function makeGlyph(char, strokes) {
    const raw = (strokes || [])
      .map((stroke) => (stroke || []).map((p) => ({
        x: clamp(p.x, 0, 1),
        y: clamp(p.y, 0, 1),
        t: Number(p.t) || 0
      })))
      .filter((stroke) => stroke.length);

    let filtered = raw;

    // Letters and numbers should not accidentally save tap-dots.
    // Punctuation such as periods, colons, and question marks still needs dots,
    // so it is allowed to keep single-point / tiny strokes.
    if (isAlphaNumericChar(char) && !allowsDotStroke(char)) {
      filtered = raw.filter((stroke) => {
        if (!stroke || stroke.length < 2) return false;
        return strokeDistance(stroke) >= .012;
      });

      // If filtering would erase the whole glyph, keep the original data so a
      // child does not lose a very small but intentional mark.
      if (!filtered.length && raw.length) {
        filtered = raw;
      }
    }

    const bounds = computeBounds(filtered);
    const glyph = {
      char,
      strokes: filtered,
      rawStrokeCount: raw.length,
      filteredStrokeCount: filtered.length,
      bounds,
      widthRatio: clamp(bounds.width || .24, .10, .92),
      heightRatio: clamp(bounds.height || .24, .10, .92)
    };

    logGlyphDebug(glyph, raw);

    return glyph;
  }

  function strokeDistance(stroke) {
    let total = 0;
    for (let i = 1; i < (stroke?.length || 0); i += 1) {
      const a = stroke[i - 1];
      const b = stroke[i];
      const dx = (b.x || 0) - (a.x || 0);
      const dy = (b.y || 0) - (a.y || 0);
      total += Math.hypot(dx, dy);
    }
    return total;
  }

  function strokeBounds(stroke) {
    return computeBounds([stroke || []]);
  }

  function round4(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 10000) / 10000;
  }

  function logGlyphDebug(glyph, rawStrokes) {
    const raw = Array.isArray(rawStrokes) ? rawStrokes : [];
    const keptSet = new Set(glyph.strokes || []);

    const rawStrokeDetails = raw.map((stroke, index) => {
      const bounds = strokeBounds(stroke);
      const distance = strokeDistance(stroke);
      const points = stroke?.length || 0;
      const isTiny = points <= 1 || distance < .012 || (bounds.width <= .045 && bounds.height <= .045);

      return {
        index,
        kept: keptSet.has(stroke),
        points,
        distance: round4(distance),
        bounds: {
          minX: round4(bounds.minX),
          minY: round4(bounds.minY),
          maxX: round4(bounds.maxX),
          maxY: round4(bounds.maxY),
          width: round4(bounds.width),
          height: round4(bounds.height)
        },
        first: stroke?.[0]
          ? { x: round4(stroke[0].x), y: round4(stroke[0].y), t: round4(stroke[0].t) }
          : null,
        last: stroke?.length
          ? {
            x: round4(stroke[stroke.length - 1].x),
            y: round4(stroke[stroke.length - 1].y),
            t: round4(stroke[stroke.length - 1].t)
          }
          : null,
        tinyOrTap: isTiny
      };
    });

    const suspicious = rawStrokeDetails.filter((item) => item.tinyOrTap);

    const summary = {
      char: glyph.char,
      timestamp: new Date().toISOString(),
      verseId: ctx.verseId || "",
      mode: selectedMode,
      rawStrokeCount: raw.length,
      savedStrokeCount: glyph.strokes.length,
      removedStrokeCount: raw.length - glyph.strokes.length,
      pointsPerRawStroke: raw.map((stroke) => stroke.length),
      pointsPerSavedStroke: glyph.strokes.map((stroke) => stroke.length),
      suspiciousRawStrokeIndexes: suspicious.map((item) => item.index),
      glyphBounds: {
        minX: round4(glyph.bounds.minX),
        minY: round4(glyph.bounds.minY),
        maxX: round4(glyph.bounds.maxX),
        maxY: round4(glyph.bounds.maxY),
        width: round4(glyph.bounds.width),
        height: round4(glyph.bounds.height)
      },
      widthRatio: round4(glyph.widthRatio),
      heightRatio: round4(glyph.heightRatio),
      rawStrokeDetails
    };

    if (DEBUG_GHOST_WRITER) {
      window.GHOST_WRITER_DEBUG_LOG.push(summary);
      console.info(`GW_DEBUG ${JSON.stringify(summary)}`);
    }

    if (suspicious.length) {
      console.warn("Ghost Writer glyph had tiny/tap strokes", {
        char: summary.char,
        suspiciousRawStrokeIndexes: summary.suspiciousRawStrokeIndexes,
        removedStrokeCount: summary.removedStrokeCount,
        copyCommand: "copy(window.getGhostWriterDebugJson())",
        summary
      });
    }
  }

  function computeBounds(strokes) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of strokes || []) {
      for (const p of stroke || []) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }

    if (!Number.isFinite(minX)) {
      return { minX: .35, minY: .35, maxX: .65, maxY: .65, width: .30, height: .30 };
    }

    const pad = .035;
    minX = clamp(minX - pad, 0, 1);
    minY = clamp(minY - pad, 0, 1);
    maxX = clamp(maxX + pad, 0, 1);
    maxY = clamp(maxY + pad, 0, 1);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(.04, maxX - minX),
      height: Math.max(.04, maxY - minY)
    };
  }

  function renderReady() {
    clearGuideTimer();
    state.screen = "ready";

    app.innerHTML = rootHtml(`
      <div class="ghost-card ghost-ready-card">
        <div class="ghost-ready-icon" aria-hidden="true">👻</div>
        <div class="ghost-ready-title">The ghost learned your handwriting!</div>
        <div class="ghost-ready-sub">Now it can write the whole verse and reference.</div>
        <div class="ghost-ready-actions">
          <button class="vm-btn" id="ghostWriteBtn" type="button">Ghost Write!</button>
        </div>
      </div>
    `, { menu: true });

    wireMenu();
    document.getElementById("ghostWriteBtn")?.addEventListener("click", () => {
      renderPlayback({
        options: {
          background: "ghost",
          textColor: "lightGray",
          borderStyle: "none",
          borderThickness: "medium",
          borderColor: "lightGray",
          tool: "pencil",
          vapor: "normal",
          style: "ghost",
          speed: "normal",
          thickness: "normal",
          jitter: "off",
          wobble: "off"
        },
        markPractice: true,
        returnTo: "remix"
      });
    });
  }

  function renderPlayback({ options = state.remix, markPractice = false, returnTo = "remix" } = {}) {
    stopPlayback();
    clearGuideTimer();
    state.screen = "playback";

    const cleanOptions = sanitizeRemixOptions({ ...options });
    const background = getBackgroundConfig(cleanOptions);
    const toolConfig = getPlaybackToolConfig(cleanOptions);

    app.innerHTML = `
      <div class="ghost-playback-root">
        <div class="ghost-playback-card ${escapeHtml(background.cardClass || "")}" id="ghostPlaybackCard">
          <canvas id="ghostPlaybackCanvas" aria-label="Ghost writing playback"></canvas>
          <img
            class="ghost-playback-tool ${escapeHtml(toolConfig.className || "")}"
            id="ghostPlaybackTool"
            src="${escapeHtml(toolConfig.src)}"
            alt=""
            draggable="false"
          >

          <button class="ghost-playback-remix-btn" id="ghostPlaybackRemixBtn" type="button" aria-label="Open remix screen">
            🔄 Remix
          </button>
        </div>
      </div>
    `;

    const canvas = document.getElementById("ghostPlaybackCanvas");
    const card = document.getElementById("ghostPlaybackCard");
    const remixBtn = document.getElementById("ghostPlaybackRemixBtn");
    if (!canvas || !card) return;

    remixBtn?.addEventListener("click", () => {
      if (returnTo === "remix") {
        renderRemix();
      }
    });

    requestAnimationFrame(() => {
      startPlayback(canvas, card, cleanOptions, async () => {
        if (markPractice && !state.practiceMarked) {
          state.practiceMarked = true;
          await markVersePracticed();
        }

        showPlaybackRemixButton();
      });
    });
  }

  function showPlaybackRemixButton() {
    const remixBtn = document.getElementById("ghostPlaybackRemixBtn");
    remixBtn?.classList.add("is-visible");
  }

  function renderRemix() {
    stopPlayback();
    clearGuideTimer();
    state.screen = "remix";
    sanitizeRemixOptions(state.remix);

    const background = getBackgroundConfig(state.remix);

    app.innerHTML = rootHtml(`
      <div class="ghost-card ghost-remix-card">
        <div class="ghost-remix-title">Remix Your Ghost Verse</div>

        <div class="ghost-remix-preview ${escapeHtml(background.cardClass || "")}" id="ghostRemixPreview">
          <canvas id="ghostRemixCanvas" aria-label="Ghost Writer preview"></canvas>
        </div>

        <div class="ghost-remix-scroll">
          <div class="ghost-remix-section">
            <div class="ghost-section-title">Background</div>
            <div class="ghost-options">
              ${selectBackgroundHtml("ghostBackgroundSelect", "Background", state.remix.background)}
            </div>
          </div>

          <div class="ghost-remix-section">
            <div class="ghost-section-title">Writing</div>
            <div class="ghost-options">
              ${selectTextColorHtml("ghostTextColorSelect", "Text Color", state.remix.textColor, state.remix.background)}
              ${selectOptionHtml("ghostThicknessSelect", "Line Size", state.remix.thickness, THICKNESS)}
              ${selectSimpleHtml("ghostJitterSelect", "Wiggly Placement", state.remix.jitter, { off: "Off", on: "On" })}
              ${selectSimpleHtml("ghostWobbleSelect", "Wobble Letters", state.remix.wobble, { off: "Off", on: "On" })}
            </div>
          </div>

          <div class="ghost-remix-section">
            <div class="ghost-section-title">Reference</div>
            <div class="ghost-options">
              ${selectOptionHtml("ghostReferenceDesignSelect", "Reference Design", state.referenceDecorationStyle || "box", REFERENCE_DECORATION_OPTIONS)}
            </div>
          </div>

          <div class="ghost-remix-section">
            <div class="ghost-section-title">Ghost Effect</div>
            <div class="ghost-options">
              ${selectOptionHtml("ghostToolSelect", "Tool", state.remix.tool || "pencil", PLAYBACK_TOOLS)}
              ${selectOptionHtml("ghostVaporSelect", "Ghost Trail", state.remix.vapor || "normal", VAPOR_LEVELS)}
              ${selectOptionHtml("ghostSpeedSelect", "Speed", state.remix.speed, SPEEDS)}
            </div>
          </div>

          <div class="ghost-remix-section">
            <div class="ghost-section-title">Border</div>
            <div class="ghost-options">
              ${selectOptionHtml("ghostBorderStyleSelect", "Border Style", state.remix.borderStyle, BORDER_STYLES)}
              ${selectOptionHtml("ghostBorderThicknessSelect", "Border Thickness", state.remix.borderThickness, BORDER_THICKNESS)}
              ${selectOptionHtml("ghostBorderColorSelect", "Border Color", state.remix.borderColor, COLOR_PALETTE)}
            </div>
          </div>

          <div class="ghost-remix-section ghost-remix-section-actions">
            <div class="ghost-section-title">Actions &amp; Download</div>
            <div class="ghost-remix-actions">
              <button class="vm-btn" id="ghostReplayBtn" type="button">Replay</button>
              <button class="vm-btn vm-btn-secondary" id="ghostAgainBtn" type="button">Try Again</button>
              ${selectOptionHtml("ghostExportSizeSelect", "Download Size", state.remix.exportSize || "square", EXPORT_SIZES)}
              <button class="vm-btn vm-btn-secondary" id="ghostSaveImageBtn" type="button">Save as Image</button>
              <button class="vm-btn vm-btn-secondary ghost-full" id="ghostBackBtn" type="button">Back to Playground</button>
            </div>
          </div>
        </div>
      </div>
    `, { menu: true, wide: true, rootClass: "is-remix-screen" });

    wireMenu();
    wireRemixControls();
    drawRemixPreview();
  }


  function selectOptionHtml(id, label, value, source) {
    const options = Object.entries(source).map(([key, obj]) => {
      const selected = key === value ? " selected" : "";
      return `<option value="${escapeHtml(key)}"${selected}>${escapeHtml(obj.label || key)}</option>`;
    }).join("");

    return `
      <div class="ghost-option">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <select id="${escapeHtml(id)}">${options}</select>
      </div>
    `;
  }

  function selectSimpleHtml(id, label, value, source) {
    const options = Object.entries(source).map(([key, labelText]) => {
      const selected = key === value ? " selected" : "";
      return `<option value="${escapeHtml(key)}"${selected}>${escapeHtml(labelText)}</option>`;
    }).join("");

    return `
      <div class="ghost-option">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <select id="${escapeHtml(id)}">${options}</select>
      </div>
    `;
  }

  function selectBackgroundHtml(id, label, value) {
    const options = Object.entries(BACKGROUNDS).map(([key, obj]) => {
      const selected = key === value ? " selected" : "";
      return `<option value="${escapeHtml(key)}"${selected}>${escapeHtml(obj.label || key)}</option>`;
    }).join("");

    return `
      <div class="ghost-option">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <select id="${escapeHtml(id)}">${options}</select>
      </div>
    `;
  }

  function selectTextColorHtml(id, label, value, backgroundKey) {
    const options = Object.entries(TEXT_COLORS).map(([key, obj]) => {
      const selected = key === value ? " selected" : "";
      const disabled = isTextColorAllowedForBackground(key, backgroundKey) ? "" : " disabled";
      const note = disabled ? " · unavailable" : "";

      return `<option value="${escapeHtml(key)}"${selected}${disabled}>${escapeHtml(obj.label || key)}${note}</option>`;
    }).join("");

    return `
      <div class="ghost-option">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <select id="${escapeHtml(id)}">${options}</select>
      </div>
    `;
  }

  function wireRemixControls() {
    const background = document.getElementById("ghostBackgroundSelect");
    const textColor = document.getElementById("ghostTextColorSelect");
    const speed = document.getElementById("ghostSpeedSelect");
    const thickness = document.getElementById("ghostThicknessSelect");
    const jitter = document.getElementById("ghostJitterSelect");
    const wobble = document.getElementById("ghostWobbleSelect");
    const tool = document.getElementById("ghostToolSelect");
    const vapor = document.getElementById("ghostVaporSelect");
    const referenceDesign = document.getElementById("ghostReferenceDesignSelect");
    const exportSize = document.getElementById("ghostExportSizeSelect");
    const borderStyle = document.getElementById("ghostBorderStyleSelect");
    const borderThickness = document.getElementById("ghostBorderThicknessSelect");
    const borderColor = document.getElementById("ghostBorderColorSelect");

    const update = () => {
      state.remix.background = background?.value || state.remix.background;
      state.remix.style = state.remix.background;
      state.remix.textColor = textColor?.value || state.remix.textColor;
      state.remix.speed = speed?.value || state.remix.speed;
      state.remix.thickness = thickness?.value || state.remix.thickness;
      state.remix.jitter = jitter?.value || state.remix.jitter;
      state.remix.wobble = wobble?.value || state.remix.wobble;
      state.remix.tool = tool?.value || state.remix.tool;
      state.remix.vapor = vapor?.value || state.remix.vapor;

      if (referenceDesign?.value && REFERENCE_DECORATION_STYLES.includes(referenceDesign.value)) {
        state.referenceDecorationStyle = referenceDesign.value;
      }

      state.remix.exportSize = exportSize?.value || state.remix.exportSize;
      state.remix.borderStyle = borderStyle?.value || state.remix.borderStyle;
      state.remix.borderThickness = borderThickness?.value || state.remix.borderThickness;
      state.remix.borderColor = borderColor?.value || state.remix.borderColor;

      sanitizeRemixOptions(state.remix);

      if (textColor && textColor.value !== state.remix.textColor) {
        textColor.value = state.remix.textColor;
      }

      refreshTextColorOptions();

      const preview = document.getElementById("ghostRemixPreview");
      if (preview) {
        preview.classList.remove("is-chalkboard", "is-crayon", "is-paper");
        const backgroundConfig = getBackgroundConfig(state.remix);
        if (backgroundConfig.cardClass) preview.classList.add(backgroundConfig.cardClass);
      }

      drawRemixPreview();
    };

    [background, textColor, speed, thickness, jitter, wobble, tool, vapor, referenceDesign, exportSize, borderStyle, borderThickness, borderColor].forEach((el) => {
      if (el) el.onchange = update;
    });

    document.getElementById("ghostReplayBtn")?.addEventListener("click", () => {
      sanitizeRemixOptions(state.remix);
      renderPlayback({ options: { ...state.remix }, markPractice: false, returnTo: "remix" });
    });

    document.getElementById("ghostSaveImageBtn")?.addEventListener("click", () => {
      sanitizeRemixOptions(state.remix);
      saveGhostWriterImage({ ...state.remix });
    });

    document.getElementById("ghostAgainBtn")?.addEventListener("click", () => startRun(selectedMode));
    document.getElementById("ghostBackBtn")?.addEventListener("click", () => bridge().exitGame?.());

    refreshTextColorOptions();
  }

  function refreshTextColorOptions() {
    const textColor = document.getElementById("ghostTextColorSelect");
    if (!textColor) return;

    const backgroundKey = state.remix.background;

    for (const option of Array.from(textColor.options)) {
      const allowed = isTextColorAllowedForBackground(option.value, backgroundKey);
      option.disabled = !allowed;
      option.textContent = `${TEXT_COLORS[option.value]?.label || option.value}${allowed ? "" : " · unavailable"}`;
    }
  }


  function getGlyph(char) {
    return state.glyphs.get(char) || null;
  }

  function glyphWidthUnits(char) {
    if (/\s/.test(char)) return .38;
    const glyph = getGlyph(char);
    if (!glyph) return .65;
    const minimum = isSymbolChar(char) ? .20 : .42;
    return clamp(glyph.widthRatio + .16, minimum, .98);
  }

  function getGlyphRenderProfile(char) {
    return GLYPH_RENDER_PROFILES[String(char || "")] || null;
  }

  function getGlyphUsableArea(char, fontSize, cellW) {
    const profile = getGlyphRenderProfile(char);
    const defaultH = fontSize * 1.04;
    const defaultW = Math.max(fontSize * .14, cellW * .88);

    if (!profile) {
      return {
        usableW: defaultW,
        usableH: defaultH,
        verticalAlign: "normal",
        yOffset: 0
      };
    }

    return {
      usableW: Math.max(fontSize * .10, Math.min(defaultW, fontSize * profile.widthScale)),
      usableH: Math.max(fontSize * .10, fontSize * profile.heightScale),
      verticalAlign: profile.verticalAlign || "middle",
      yOffset: profile.yOffset || 0
    };
  }

  function getGlyphBaseYForProfile(baselineY, fontSize, usableH, drawH, profileInfo) {
    const align = profileInfo?.verticalAlign || "normal";
    const offset = (profileInfo?.yOffset || 0) * fontSize;

    if (align === "top") {
      return baselineY - fontSize * .82 + offset;
    }

    if (align === "middle") {
      return baselineY - fontSize * .80 + (fontSize * 1.04 - usableH) / 2 + (usableH - drawH) / 2 + offset;
    }

    if (align === "bottom") {
      return baselineY - drawH + fontSize * .17 + offset;
    }

    return baselineY - usableH * .80 + (usableH - drawH) / 2 + offset;
  }

  function makeLayout(width, height, options = {}) {
    const contentRect = getCanvasContentRect(width, height, options);
    const safeWidth = Math.max(120, contentRect.width);
    const safeHeight = Math.max(120, contentRect.height);
    const maxWidth = safeWidth * .94;
    const maxHeight = safeHeight * .88;

    const dynamicMax = Math.min(
      safeWidth * .17,
      safeHeight * .24,
      132
    );

    const maxFontSize = Math.max(28, dynamicMax);
    const minFontSize = 12;
    let best = null;

    for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
      const layout = layoutVerseAndReferenceForFontSize(
        fontSize,
        maxWidth,
        maxHeight,
        safeWidth,
        safeHeight,
        contentRect.x,
        contentRect.y
      );

      if (!layout.overflows) {
        best = layout;
        break;
      }
    }

    if (best) return best;

    return layoutVerseAndReferenceForFontSize(
      minFontSize,
      maxWidth,
      maxHeight,
      safeWidth,
      safeHeight,
      contentRect.x,
      contentRect.y
    );
  }

  function layoutVerseAndReferenceForFontSize(fontSize, maxWidth, maxHeight, canvasWidth, canvasHeight, offsetX = 0, offsetY = 0) {
    const verseText = state.verseTextOnly || state.fullText || "";
    const refText = state.referenceText || "";
    const hasReference = Boolean(refText);
    const lineHeight = fontSize * 1.24;
    const referenceStyle = state.referenceDecorationStyle || "box";
    const refFontSize = Math.max(10, fontSize * REFERENCE_DECORATION.refScale);
    const referenceZoneHeight = hasReference ? lineHeight * REFERENCE_DECORATION.zoneHeightLines : 0;
    const referenceGap = hasReference ? lineHeight * REFERENCE_DECORATION.beforeGapLines : 0;
    const dividerExtra = hasReference && referenceStyle === "divider" ? lineHeight * REFERENCE_DECORATION.dividerExtraLines : 0;
    const verseMaxHeight = Math.max(40, maxHeight - referenceGap - dividerExtra - referenceZoneHeight);

    const verseLayout = layoutForFontSize(
      verseText,
      fontSize,
      maxWidth,
      verseMaxHeight,
      canvasWidth,
      verseMaxHeight,
      offsetX,
      0
    );

    const totalHeight = verseLayout.height + referenceGap + dividerExtra + referenceZoneHeight;
    const startY = offsetY + Math.max(fontSize * .9, (canvasHeight - totalHeight) / 2 + fontSize * .76);

    const placements = verseLayout.placements.map((item) => ({
      ...item,
      y: item.y + startY - fontSize * .76,
      section: "verse"
    }));

    let referenceDecoration = null;

    if (hasReference) {
      const referenceZoneTop = startY - fontSize * .76 + verseLayout.height + referenceGap + dividerExtra;
      const referenceBaselineY = referenceZoneTop + referenceZoneHeight * .62;
      const referenceItems = makeReferenceLinePlacements(
        refText,
        refFontSize,
        maxWidth,
        canvasWidth,
        offsetX,
        referenceBaselineY
      );

      for (const item of referenceItems.placements) {
        placements.push(item);
      }

      referenceDecoration = makeReferenceDecorationLayout({
        style: referenceStyle,
        referenceItems,
        referenceZoneTop,
        referenceZoneHeight,
        referenceBaselineY,
        lineHeight,
        fontSize,
        refFontSize,
        maxWidth,
        canvasWidth,
        offsetX
      });
    }

    const usedWidth = Math.max(verseLayout.width, referenceDecoration?.width || 0);
    const overflows = verseLayout.overflows || usedWidth > maxWidth + 1 || totalHeight > maxHeight + 1;

    return {
      placements,
      fontSize,
      lineHeight,
      height: totalHeight,
      width: usedWidth,
      lineCount: verseLayout.lineCount + (hasReference ? 1 : 0),
      referenceDecoration,
      overflows
    };
  }

  function makeReferenceLinePlacements(text, fontSize, maxWidth, canvasWidth, offsetX, baselineY) {
    const chars = Array.from(String(text || ""));
    const items = [];
    const rawWidth = chars.reduce((sum, char) => sum + fontSize * glyphWidthUnits(char), 0);
    const safeWidth = Math.min(rawWidth, maxWidth);
    let scaleDown = rawWidth > maxWidth ? maxWidth / Math.max(1, rawWidth) : 1;
    const finalFontSize = Math.max(8, fontSize * scaleDown);
    const finalWidth = chars.reduce((sum, char) => sum + finalFontSize * glyphWidthUnits(char), 0);

    let x = offsetX + (canvasWidth - finalWidth) / 2;

    for (const char of chars) {
      const w = finalFontSize * glyphWidthUnits(char);
      items.push({
        char,
        x,
        y: baselineY,
        w,
        h: finalFontSize,
        fontSize: finalFontSize,
        section: "reference"
      });
      x += w;
    }

    return {
      placements: items,
      x: offsetX + (canvasWidth - finalWidth) / 2,
      y: baselineY,
      width: safeWidth,
      finalWidth,
      fontSize: finalFontSize
    };
  }

  function makeReferenceDecorationLayout(info) {
    const items = info.referenceItems?.placements || [];
    const visible = items.filter((item) => item && !/\s/.test(item.char));
    const first = visible[0] || items[0];
    const last = visible[visible.length - 1] || items[items.length - 1] || first;

    if (!first || !last) return null;

    const refLeft = first.x;
    const refRight = last.x + last.w;
    const refCenterX = (refLeft + refRight) / 2;
    const refWidth = Math.max(20, refRight - refLeft);
    const style = info.style || "box";
    const fontSize = info.fontSize;
    const refFontSize = info.referenceItems.fontSize || info.refFontSize;
    const zoneTop = info.referenceZoneTop;
    const zoneHeight = info.referenceZoneHeight;
    const zoneBottom = zoneTop + zoneHeight;
    const zoneCenterY = zoneTop + zoneHeight / 2;

    let padX = fontSize * REFERENCE_DECORATION.boxPadX;
    let padY = fontSize * REFERENCE_DECORATION.boxPadY;

    if (style === "cloud") {
      padX = fontSize * REFERENCE_DECORATION.cloudPadX;
      padY = fontSize * REFERENCE_DECORATION.cloudPadY;
    }

    if (style === "loop") {
      padX = fontSize * REFERENCE_DECORATION.loopPadX;
      padY = fontSize * REFERENCE_DECORATION.loopPadY;
    }

    if (style === "stars") {
      padX = fontSize * REFERENCE_DECORATION.starPadX;
      padY = fontSize * .18;
    }

    const boxW = refWidth + padX * 2;
    const boxH = Math.min(zoneHeight * .94, Math.max(refFontSize * 1.35, zoneHeight * .74));
    const boxX = refCenterX - boxW / 2;
    const boxY = zoneCenterY - boxH / 2;

    const dividerY = zoneTop - info.lineHeight * .15;
    const dividerW = Math.min(info.maxWidth * .72, Math.max(refWidth * 1.25, fontSize * 5.4));
    const dividerX = info.offsetX + info.canvasWidth / 2 - dividerW / 2;

    return {
      type: "referenceDecoration",
      style,
      x: boxX,
      y: boxY,
      w: boxW,
      h: boxH,
      refLeft,
      refRight,
      refCenterX,
      refBaselineY: info.referenceBaselineY,
      zoneTop,
      zoneBottom,
      zoneCenterY,
      dividerX,
      dividerY,
      dividerW,
      fontSize,
      refFontSize,
      width: Math.max(boxW, dividerW)
    };
  }

  function layoutForFontSize(text, fontSize, maxWidth, maxHeight, canvasWidth, canvasHeight, offsetX = 0, offsetY = 0) {
    const lineHeight = fontSize * 1.24;
    const placements = [];
    const lines = [];
    let line = [];
    let lineWidth = 0;

    const pushLine = () => {
      lines.push({ items: line, width: lineWidth });
      line = [];
      lineWidth = 0;
    };

    const addChar = (char) => {
      const widthUnits = glyphWidthUnits(char);
      const w = fontSize * widthUnits;

      if (line.length && lineWidth + w > maxWidth) {
        pushLine();
      }

      line.push({ char, w, fontSize });
      lineWidth += w;
    };

    const tokens = String(text || "").match(/\n|\s+|\S+/g) || [];

    for (const token of tokens) {
      if (token === "\n") {
        pushLine();
        continue;
      }

      if (/^\s+$/.test(token)) {
        if (line.length) addChar(" ");
        continue;
      }

      const chars = Array.from(token);
      const tokenWidth = chars.reduce((sum, char) => sum + fontSize * glyphWidthUnits(char), 0);

      if (line.length && tokenWidth <= maxWidth && lineWidth + tokenWidth > maxWidth) {
        pushLine();
      }

      for (const char of chars) {
        addChar(char);
      }
    }

    if (line.length || !lines.length) pushLine();

    const totalHeight = lines.length * lineHeight;
    let y = offsetY + Math.max(fontSize * .9, (canvasHeight - totalHeight) / 2 + fontSize * .76);

    for (const currentLine of lines) {
      let x = offsetX + (canvasWidth - currentLine.width) / 2;
      for (const item of currentLine.items) {
        placements.push({
          char: item.char,
          x,
          y,
          w: item.w,
          h: fontSize,
          fontSize
        });
        x += item.w;
      }
      y += lineHeight;
    }

    const usedWidth = Math.max(...lines.map((l) => l.width), 0);

    return {
      placements,
      fontSize,
      lineHeight,
      height: totalHeight,
      width: usedWidth,
      lineCount: lines.length,
      overflows: usedWidth > maxWidth + 1 || totalHeight > maxHeight + 1
    };
  }

  function drawGlyph(c, glyph, x, baselineY, cellW, fontSize, options = {}, partial = 1) {
    if (!glyph || !glyph.strokes || !glyph.strokes.length) return;

    const ink = getInkForOptions(options);
    const thickness = THICKNESS[options.thickness] || THICKNESS.normal;
    const jitterOn = options.jitter === "on";
    const wobbleOn = options.wobble === "on";

    const bounds = glyph.bounds || computeBounds(glyph.strokes);
    const profileInfo = getGlyphUsableArea(glyph.char, fontSize, cellW);
    const usableH = profileInfo.usableH;
    const usableW = profileInfo.usableW;
    const scale = Math.min(
      usableW / Math.max(.04, bounds.width),
      usableH / Math.max(.04, bounds.height)
    );

    const drawW = bounds.width * scale;
    const drawH = bounds.height * scale;
    const baseX = x + (cellW - drawW) / 2 - bounds.minX * scale;
    const baseY = getGlyphBaseYForProfile(baselineY, fontSize, usableH, drawH, profileInfo) - bounds.minY * scale;

    const jitterX = jitterOn ? stableNoise(`${glyph.char}-${x}-x`) * fontSize * .08 : 0;
    const jitterY = jitterOn ? stableNoise(`${glyph.char}-${x}-y`) * fontSize * .06 : 0;
    const rotation = wobbleOn ? stableNoise(`${glyph.char}-${x}-r`) * .09 : 0;

    c.save();
    c.translate(x + cellW / 2 + jitterX, baselineY - fontSize * .36 + jitterY);
    c.rotate(rotation);
    c.translate(-(x + cellW / 2), -(baselineY - fontSize * .36));

    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.lineWidth = Math.max(1.8, fontSize * .075 * thickness.multiplier);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.shadowColor = getShadowForInk(ink, options);
    c.shadowBlur = getBackgroundKey(options) === "ghost" ? fontSize * .16 : fontSize * .045;

    const safePartial = clamp(partial, 0, 1);
    const strokeUnits = glyph.strokes.map((stroke) => getStrokePlaybackUnits(stroke));
    const totalUnits = strokeUnits.reduce((sum, units) => sum + units, 0) || 1;
    let remainingUnits = totalUnits * safePartial;

    for (let strokeIndex = 0; strokeIndex < glyph.strokes.length; strokeIndex += 1) {
      const stroke = glyph.strokes[strokeIndex];
      const units = strokeUnits[strokeIndex] || 1;

      if (!stroke || !stroke.length) continue;

      if (remainingUnits <= 0) {
        break;
      }

      const strokeProgress = clamp(remainingUnits / units, 0, 1);

      if (stroke.length === 1) {
        if (strokeProgress >= 1) {
          const p = stroke[0];
          c.beginPath();
          c.arc(baseX + p.x * scale, baseY + p.y * scale, c.lineWidth * 1.08, 0, Math.PI * 2);
          c.fill();
        }

        remainingUnits -= units;
        continue;
      }

      drawStrokeProgress(c, stroke, baseX, baseY, scale, strokeProgress);

      remainingUnits -= units;

      if (strokeProgress < 1) {
        break;
      }
    }

    c.restore();
  }

  function getStrokePlaybackUnits(stroke) {
    if (!stroke || !stroke.length) return 1;
    if (stroke.length === 1) return 1;
    return Math.max(1, stroke.length - 1);
  }

  function drawReferenceDecoration(c, decoration, options = {}, partial = 1) {
    if (!decoration) return;

    const strokes = getReferenceDecorationStrokes(decoration);
    if (!strokes.length) return;

    const ink = getInkForOptions(options);
    const thickness = THICKNESS[options.thickness] || THICKNESS.normal;
    const fontSize = decoration.fontSize || 44;

    c.save();
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.lineWidth = Math.max(1.8, fontSize * .045 * thickness.multiplier);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.shadowColor = getShadowForInk(ink, options);
    c.shadowBlur = getBackgroundKey(options) === "ghost" ? fontSize * .10 : fontSize * .035;

    drawPointStrokesProgress(c, strokes, clamp(partial, 0, 1));

    c.restore();
  }

  function getReferenceDecorationPieceCount(decoration) {
    return getReferenceDecorationStrokes(decoration).reduce((sum, stroke) => {
      return sum + Math.max(1, stroke.length - 1);
    }, 0) || 1;
  }

  function getReferenceDecorationTip(decoration, options = {}, partial = 1) {
    const strokes = getReferenceDecorationStrokes(decoration);
    const point = getPointFromPointStrokes(strokes, partial);

    if (!point) return null;

    return {
      x: point.x,
      y: point.y,
      angleDeg: point.angleDeg || 0
    };
  }

  function getReferenceDecorationStrokes(decoration) {
    if (!decoration) return [];

    if (decoration.style === "divider") return makeDividerStrokes(decoration);
    if (decoration.style === "underline") return makeUnderlineStrokes(decoration);
    if (decoration.style === "loop") return makeLoopStrokes(decoration);
    if (decoration.style === "cloud") return makeCloudStrokes(decoration);
    if (decoration.style === "stars") return makeStarStrokes(decoration);

    return makeBoxStrokes(decoration);
  }

  function drawPointStrokesProgress(c, strokes, progress) {
    const safeProgress = clamp(progress, 0, 1);
    const strokeUnits = strokes.map((stroke) => Math.max(1, (stroke?.length || 0) - 1));
    const totalUnits = strokeUnits.reduce((sum, units) => sum + units, 0) || 1;
    let remainingUnits = totalUnits * safeProgress;

    for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex += 1) {
      const stroke = strokes[strokeIndex];
      const units = strokeUnits[strokeIndex] || 1;

      if (!stroke || stroke.length < 2) continue;
      if (remainingUnits <= 0) break;

      const strokeProgress = clamp(remainingUnits / units, 0, 1);
      drawRawPointStrokeProgress(c, stroke, strokeProgress);
      remainingUnits -= units;

      if (strokeProgress < 1) break;
    }
  }

  function drawRawPointStrokeProgress(c, stroke, progress) {
    const safeProgress = clamp(progress, 0, 1);
    const segmentCount = stroke.length - 1;
    const piecesToDraw = segmentCount * safeProgress;

    if (piecesToDraw <= .08) return;

    c.beginPath();
    c.moveTo(stroke[0].x, stroke[0].y);

    let drewAnyLine = false;

    for (let i = 1; i < stroke.length; i += 1) {
      const previousPieceIndex = i - 1;

      if (previousPieceIndex + 1 <= piecesToDraw) {
        c.lineTo(stroke[i].x, stroke[i].y);
        drewAnyLine = true;
        continue;
      }

      const remain = piecesToDraw - previousPieceIndex;

      if (remain > .08) {
        const a = stroke[i - 1];
        const b = stroke[i];
        c.lineTo(a.x + (b.x - a.x) * remain, a.y + (b.y - a.y) * remain);
        drewAnyLine = true;
      }

      break;
    }

    if (drewAnyLine) c.stroke();
  }

  function getPointFromPointStrokes(strokes, progress) {
    const safeProgress = clamp(progress, 0, 1);
    const strokeUnits = strokes.map((stroke) => Math.max(1, (stroke?.length || 0) - 1));
    const totalUnits = strokeUnits.reduce((sum, units) => sum + units, 0) || 1;
    let remainingUnits = totalUnits * safeProgress;

    for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex += 1) {
      const stroke = strokes[strokeIndex];
      const units = strokeUnits[strokeIndex] || 1;

      if (!stroke || stroke.length < 2) continue;

      if (remainingUnits > units) {
        remainingUnits -= units;
        continue;
      }

      const strokeProgress = clamp(remainingUnits / units, 0, 1);
      return getPointOnRawStroke(stroke, strokeProgress);
    }

    const lastStroke = strokes[strokes.length - 1];
    return lastStroke?.[lastStroke.length - 1] || null;
  }

  function getPointOnRawStroke(stroke, progress) {
    if (!stroke || !stroke.length) return null;
    if (stroke.length === 1) return stroke[0];

    const safeProgress = clamp(progress, 0, 1);
    const segmentCount = stroke.length - 1;
    const pieces = segmentCount * safeProgress;
    const index = Math.min(segmentCount - 1, Math.floor(pieces));
    const remain = clamp(pieces - index, 0, 1);
    const a = stroke[index];
    const b = stroke[index + 1] || a;

    return {
      x: a.x + (b.x - a.x) * remain,
      y: a.y + (b.y - a.y) * remain,
      angleDeg: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
    };
  }

  function makeBoxStrokes(d) {
    const over = d.fontSize * .045;
    const wobble = d.fontSize * .022;
    const x1 = d.x - over;
    const y1 = d.y;
    const x2 = d.x + d.w + over;
    const y2 = d.y + d.h;

    return [
      [
        { x: x1, y: y1 + wobble },
        { x: d.x + d.w * .32, y: y1 - wobble },
        { x: d.x + d.w * .68, y: y1 + wobble },
        { x: x2, y: y1 }
      ],
      [
        { x: x2 - wobble, y: y1 - over },
        { x: x2 + wobble, y: d.y + d.h * .50 },
        { x: x2 - wobble, y: y2 + over }
      ],
      [
        { x: x2, y: y2 - wobble },
        { x: d.x + d.w * .66, y: y2 + wobble },
        { x: d.x + d.w * .33, y: y2 - wobble },
        { x: x1, y: y2 }
      ],
      [
        { x: x1 + wobble, y: y2 + over },
        { x: x1 - wobble, y: d.y + d.h * .50 },
        { x: x1 + wobble, y: y1 - over }
      ]
    ];
  }

  function makeDividerStrokes(d) {
    const points = [];
    const steps = 44;
    const amp = Math.max(2, d.fontSize * .035);

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      points.push({
        x: d.dividerX + d.dividerW * t,
        y: d.dividerY + Math.sin(t * Math.PI * 18) * amp
      });
    }

    return [points];
  }

  function makeUnderlineStrokes(d) {
    const strokes = [];
    const y = d.refBaselineY + d.refFontSize * .36;
    const left = d.refLeft - d.refFontSize * .18;
    const right = d.refRight + d.refFontSize * .18;

    for (let pass = 0; pass < 3; pass += 1) {
      const fromLeft = pass % 2 === 0;
      const points = [];
      const steps = 18;
      const startX = fromLeft ? left : right;
      const endX = fromLeft ? right : left;

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        points.push({
          x: startX + (endX - startX) * t,
          y: y + pass * d.refFontSize * .095 + Math.sin(t * Math.PI * 5) * d.refFontSize * .025
        });
      }

      strokes.push(points);
    }

    return strokes;
  }

  function makeLoopStrokes(d) {
    return [
      makeOvalStroke(d, 0, 0, 1),
      makeOvalStroke(d, d.fontSize * .025, -d.fontSize * .018, 2)
    ];
  }

  function makeOvalStroke(d, offsetX, offsetY, seed) {
    const points = [];
    const cx = d.x + d.w / 2 + offsetX;
    const cy = d.y + d.h / 2 + offsetY;
    const rx = d.w / 2;
    const ry = d.h / 2;
    const steps = 72;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const a = t * Math.PI * 2;
      const wobble = 1 + stableNoise(`loop-${seed}-${i}`) * .035;

      points.push({
        x: cx + Math.cos(a) * rx * wobble,
        y: cy + Math.sin(a) * ry * wobble
      });
    }

    return points;
  }

  function makeCloudStrokes(d) {
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    const rx = d.w / 2;
    const ry = d.h / 2;

    const puffs = [
      { x: -.86, y: .12, r: .34, a1: .58, a2: 1.56 },
      { x: -.78, y: -.10, r: .34, a1: .98, a2: 1.82 },
      { x: -.54, y: -.36, r: .35, a1: 1.12, a2: 1.92 },
      { x: -.25, y: -.48, r: .36, a1: 1.10, a2: 1.95 },
      { x: .08, y: -.50, r: .38, a1: 1.10, a2: 1.98 },
      { x: .42, y: -.42, r: .35, a1: 1.10, a2: 1.95 },
      { x: .70, y: -.20, r: .34, a1: 1.12, a2: 1.92 },
      { x: .86, y: .05, r: .34, a1: 1.18, a2: 2.06 },
      { x: .76, y: .34, r: .32, a1: 1.28, a2: 2.12 },
      { x: .46, y: .48, r: .34, a1: 1.16, a2: 2.00 },
      { x: .12, y: .52, r: .36, a1: 1.10, a2: 2.02 },
      { x: -.24, y: .50, r: .35, a1: 1.10, a2: 2.02 },
      { x: -.58, y: .42, r: .33, a1: 1.16, a2: 2.00 },
      { x: -.82, y: .28, r: .32, a1: 1.24, a2: 2.10 }
    ];

    const points = [];

    for (let i = 0; i < puffs.length; i += 1) {
      const puff = puffs[i];
      const next = puffs[(i + 1) % puffs.length];
      const steps = 7;

      for (let j = 0; j <= steps; j += 1) {
        const t = j / steps;
        const angle = Math.PI * (puff.a1 + (puff.a2 - puff.a1) * t);
        const localRx = rx * puff.r;
        const localRy = ry * puff.r * .95;
        const wobbleX = stableNoise(`cloud-x-${i}-${j}`) * d.fontSize * .018;
        const wobbleY = stableNoise(`cloud-y-${i}-${j}`) * d.fontSize * .018;

        let x = cx + puff.x * rx + Math.cos(angle) * localRx + wobbleX;
        let y = cy + puff.y * ry + Math.sin(angle) * localRy + wobbleY;

        if (j === steps && next) {
          x = cx + next.x * rx + stableNoise(`cloud-join-x-${i}`) * d.fontSize * .012;
          y = cy + next.y * ry + stableNoise(`cloud-join-y-${i}`) * d.fontSize * .012;
        }

        points.push({ x, y });
      }
    }

    if (points.length) {
      points.push({ ...points[0] });
    }

    return [points];
  }

  function makeStarStrokes(d) {
    const size = Math.max(12, d.refFontSize * .52);
    const y = d.refBaselineY - d.refFontSize * .38;
    const gap = d.refFontSize * 1.05;
    const leftX = d.refLeft - gap;
    const rightX = d.refRight + gap;

    return [
      makePentagramStroke(leftX, y, size, "left"),
      makePentagramStroke(rightX, y, size, "right")
    ];
  }

  function makePentagramStroke(cx, cy, r, seed = "star") {
    const order = [0, 2, 4, 1, 3, 0];
    const outer = [];

    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      const pointR = r * (1 + stableNoise(`${seed}-star-r-${i}`) * .11);
      outer.push({
        x: cx + Math.cos(a) * pointR + stableNoise(`${seed}-star-x-${i}`) * r * .12,
        y: cy + Math.sin(a) * pointR + stableNoise(`${seed}-star-y-${i}`) * r * .12
      });
    }

    return order.map((index, i) => ({
      x: outer[index].x + stableNoise(`${seed}-star-line-x-${i}`) * r * .06,
      y: outer[index].y + stableNoise(`${seed}-star-line-y-${i}`) * r * .06
    }));
  }

  function drawStrokeProgress(c, stroke, baseX, baseY, scale, progress) {
    const safeProgress = clamp(progress, 0, 1);

    if (!stroke || stroke.length < 2) return;

    const segmentCount = stroke.length - 1;
    const piecesToDraw = segmentCount * safeProgress;

    if (piecesToDraw <= .08) {
      return;
    }

    c.beginPath();
    c.moveTo(baseX + stroke[0].x * scale, baseY + stroke[0].y * scale);

    let drewAnyLine = false;

    for (let i = 1; i < stroke.length; i += 1) {
      const previousPieceIndex = i - 1;

      if (previousPieceIndex + 1 <= piecesToDraw) {
        c.lineTo(baseX + stroke[i].x * scale, baseY + stroke[i].y * scale);
        drewAnyLine = true;
        continue;
      }

      const remain = piecesToDraw - previousPieceIndex;

      if (remain > .08) {
        const a = stroke[i - 1];
        const b = stroke[i];
        const x1 = a.x + (b.x - a.x) * remain;
        const y1 = a.y + (b.y - a.y) * remain;

        c.lineTo(baseX + x1 * scale, baseY + y1 * scale);
        drewAnyLine = true;
      }

      break;
    }

    if (drewAnyLine) {
      c.stroke();
    }
  }

  function countStrokePieces(strokes) {
    let total = 0;
    for (const stroke of strokes || []) {
      total += Math.max(1, (stroke?.length || 0) - 1);
    }
    return Math.max(1, total);
  }

  function stableNoise(seed) {
    let h = 2166136261;
    const text = String(seed || "");
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) / 4294967295) * 2 - 1;
  }

  function getBackgroundKey(options = {}) {
    return options.background || options.style || "ghost";
  }

  function getBackgroundConfig(options = {}) {
    const key = getBackgroundKey(options);
    return BACKGROUNDS[key] || BACKGROUNDS.ghost;
  }

  function getBackgroundImage(src) {
    if (!src) return null;

    if (backgroundImageCache.has(src)) {
      return backgroundImageCache.get(src);
    }

    const img = new Image();
    img.decoding = "async";
    img.src = src;

    backgroundImageCache.set(src, img);

    img.onload = () => {
      if (state.screen === "remix") {
        drawRemixPreview();
      }
    };

    return img;
  }

  function drawCoverImage(c, img, width, height) {
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) {
      return false;
    }

    const imageRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let sourceX = 0;
    let sourceY = 0;
    let sourceW = img.naturalWidth;
    let sourceH = img.naturalHeight;

    if (imageRatio > canvasRatio) {
      sourceW = img.naturalHeight * canvasRatio;
      sourceX = (img.naturalWidth - sourceW) / 2;
    } else {
      sourceH = img.naturalWidth / canvasRatio;
      sourceY = (img.naturalHeight - sourceH) / 2;
    }

    c.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, width, height);
    return true;
  }

  function getTextColorKey(options = {}) {
    return options.textColor || defaultTextColorForBackground(getBackgroundKey(options));
  }

  function getColorValue(key) {
    return COLOR_PALETTE[key]?.value || "";
  }

  function defaultTextColorForBackground(backgroundKey) {
    const background = BACKGROUNDS[backgroundKey] || BACKGROUNDS.ghost;

    if (backgroundKey === "lightGray" || backgroundKey === "paper" || backgroundKey === "yellow") {
      return "darkGray";
    }

    return "lightGray";
  }

  function isRainbowAllowedForBackground(backgroundKey) {
    return [
      "ghost",
      "paper",
      "notebook",
      "treasureMap",
      "crackedStone",
      "lightGray",
      "darkGray"
    ].includes(backgroundKey);
  }

  function isTextColorAllowedForBackground(textColorKey, backgroundKey) {
    if (textColorKey === "rainbow") {
      return isRainbowAllowedForBackground(backgroundKey);
    }

    const background = BACKGROUNDS[backgroundKey] || BACKGROUNDS.ghost;
    const textValue = getColorValue(textColorKey);

    if (!textValue) return false;

    return background.kind !== "solid" || background.value.toLowerCase() !== textValue.toLowerCase();
  }

  function sanitizeRemixOptions(options = state.remix) {
    const backgroundKey = getBackgroundKey(options);
    let textColorKey = getTextColorKey(options);

    if (!isTextColorAllowedForBackground(textColorKey, backgroundKey)) {
      textColorKey = defaultTextColorForBackground(backgroundKey);

      if (!isTextColorAllowedForBackground(textColorKey, backgroundKey)) {
        textColorKey = backgroundKey === "lightGray" ? "darkGray" : "lightGray";
      }
    }

    options.background = backgroundKey;
    options.textColor = textColorKey;
    options.style = backgroundKey;

    return options;
  }

  function getInkForOptions(options = {}) {
    const backgroundKey = getBackgroundKey(options);
    const textColorKey = getTextColorKey(options);

    if (textColorKey === "rainbow" && isRainbowAllowedForBackground(backgroundKey)) {
      const index = Number(options._colorIndex) || 0;
      return RAINBOW_INKS[index % RAINBOW_INKS.length];
    }

    return getColorValue(textColorKey) || COLOR_PALETTE.lightGray.value;
  }

  function getShadowForInk(ink, options = {}) {
    const backgroundKey = getBackgroundKey(options);

    if (backgroundKey === "lightGray" || backgroundKey === "paper" || backgroundKey === "yellow") {
      return "rgba(0,0,0,.14)";
    }

    if (getTextColorKey(options) === "rainbow") {
      return "rgba(255,255,255,.24)";
    }

    if (ink === "#333333" || ink === "#a36f44") {
      return "rgba(0,0,0,.18)";
    }

    return "rgba(255,255,255,.25)";
  }

  function getCrayonToolSrc(options = {}) {
    const textColorKey = getTextColorKey(options);
    const crayonKey = textColorKey === "rainbow" ? "rainbow" : textColorKey;

    return CRAYON_TOOL_IMAGES[crayonKey] || CRAYON_TOOL_IMAGES.red;
  }

  function getPlaybackToolConfig(options = {}) {
    const toolKey = options.tool || "pencil";
    const baseTool = PLAYBACK_TOOLS[toolKey] || PLAYBACK_TOOLS.pencil;
    const src = toolKey === "crayon" ? getCrayonToolSrc(options) : baseTool.src;

    return {
      ...PLAYBACK_TOOL,
      ...baseTool,
      src
    };
  }

  function getVaporConfig(options = {}) {
    return VAPOR_LEVELS[options.vapor || "normal"] || VAPOR_LEVELS.normal;
  }

  function getBorderColorValue(options = {}) {
    return getColorValue(options.borderColor || "lightGray") || COLOR_PALETTE.lightGray.value;
  }

  function drawRemixBorder(c, width, height, options = {}) {
    const style = options.borderStyle || "none";
    if (style === "none") return;

    const thicknessConfig = BORDER_THICKNESS[options.borderThickness] || BORDER_THICKNESS.medium;
    const borderColor = getBorderColorValue(options);
    const lineWidth = thicknessConfig.size;
    const inset = Math.max(14, lineWidth * 2.2);
    const radius = Math.max(20, Math.min(width, height) * .045);
    const x = inset;
    const y = inset;
    const w = Math.max(1, width - inset * 2);
    const h = Math.max(1, height - inset * 2);

    c.save();
    c.strokeStyle = borderColor;
    c.lineWidth = lineWidth;
    c.lineJoin = "round";
    c.lineCap = "round";

    if (style === "dashed") {
      c.setLineDash([lineWidth * 2.8, lineWidth * 1.7]);
    }

    if (style === "dotted") {
      c.setLineDash([lineWidth * .2, lineWidth * 1.8]);
      c.lineCap = "round";
    }

    if (style === "glow") {
      c.shadowColor = borderColor;
      c.shadowBlur = lineWidth * 3.4;
      c.globalAlpha = .72;
      roundRectPath(c, x, y, w, h, radius);
      c.stroke();

      c.shadowBlur = lineWidth * 1.2;
      c.globalAlpha = 1;
      c.lineWidth = Math.max(2, lineWidth * .55);
      roundRectPath(c, x, y, w, h, radius);
      c.stroke();

      c.restore();
      return;
    }

    if (style === "double") {
      c.lineWidth = Math.max(2, lineWidth * .55);
      roundRectPath(c, x, y, w, h, radius);
      c.stroke();

      const gap = Math.max(7, lineWidth * 1.25);
      roundRectPath(c, x + gap, y + gap, Math.max(1, w - gap * 2), Math.max(1, h - gap * 2), Math.max(8, radius - gap * .6));
      c.stroke();

      c.restore();
      return;
    }

    roundRectPath(c, x, y, w, h, radius);
    c.stroke();
    c.restore();
  }

  function getCanvasContentRect(width, height, options = {}) {
    const style = options.borderStyle || "none";

    if (style === "none") {
      return {
        x: 0,
        y: 0,
        width,
        height
      };
    }

    const thicknessConfig = BORDER_THICKNESS[options.borderThickness] || BORDER_THICKNESS.medium;
    const lineWidth = thicknessConfig.size;
    const borderInset = Math.max(14, lineWidth * 2.2);
    const extraGap = Math.max(26, lineWidth * 3.2);
    const inset = borderInset + extraGap;

    return {
      x: inset,
      y: inset,
      width: Math.max(80, width - inset * 2),
      height: Math.max(80, height - inset * 2)
    };
  }

  function roundRectPath(c, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));

    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + width - r, y);
    c.quadraticCurveTo(x + width, y, x + width, y + r);
    c.lineTo(x + width, y + height - r);
    c.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    c.lineTo(x + r, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function clearPlaybackCanvas(c, width, height, options) {
    const background = getBackgroundConfig(options);

    c.save();
    c.fillStyle = background.value;
    c.fillRect(0, 0, width, height);

    if (background.texture === "image") {
      const img = getBackgroundImage(background.imageSrc);

      if (!drawCoverImage(c, img, width, height)) {
        c.fillStyle = background.value;
        c.fillRect(0, 0, width, height);
      }

      c.restore();

      drawRemixBorder(c, width, height, options);
      return;
    }

    if (background.texture === "ghost") {
      c.globalAlpha = .16;
      const glow = c.createRadialGradient(width * .5, height * .18, 0, width * .5, height * .18, Math.max(width, height) * .58);
      glow.addColorStop(0, "rgba(255,255,255,.42)");
      glow.addColorStop(.46, "rgba(150,160,255,.16)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = glow;
      c.fillRect(0, 0, width, height);
    }

    if (background.texture === "chalkboard") {
      const boardGlow = c.createRadialGradient(width * .5, height * .35, 0, width * .5, height * .35, Math.max(width, height) * .72);
      boardGlow.addColorStop(0, "rgba(255,255,255,.08)");
      boardGlow.addColorStop(.55, "rgba(255,255,255,.025)");
      boardGlow.addColorStop(1, "rgba(0,0,0,.16)");
      c.fillStyle = boardGlow;
      c.fillRect(0, 0, width, height);



      c.globalAlpha = .09;
      c.fillStyle = "#ffffff";

      for (let i = 0; i < 56; i += 1) {
        const x = (stableNoise(`chalk-dust-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`chalk-dust-y-${i}`) * .5 + .5) * height;
        const r = Math.max(10, Math.min(width, height) * (.018 + (stableNoise(`chalk-dust-r-${i}`) * .5 + .5) * .035));
        const dust = c.createRadialGradient(x, y, 0, x, y, r);
        dust.addColorStop(0, "rgba(255,255,255,.22)");
        dust.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = dust;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }

    if (background.texture === "paper") {
      c.globalAlpha = .18;
      c.fillStyle = "#d7b98b";

      for (let y = 32; y < height; y += 32) {
        c.fillRect(0, y, width, 1);
      }

      c.globalAlpha = .05;
      for (let x = 0; x < width; x += 22) {
        c.fillRect(x, 0, 1, height);
      }
    }

    if (background.texture === "notebook") {
      const paperGlow = c.createLinearGradient(0, 0, 0, height);
      paperGlow.addColorStop(0, "#ffffff");
      paperGlow.addColorStop(1, "#eef7ff");
      c.globalAlpha = 1;
      c.fillStyle = paperGlow;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .24;
      c.fillStyle = "#80b7e8";
      const lineGap = Math.max(24, height * .055);

      for (let y = lineGap; y < height; y += lineGap) {
        c.fillRect(0, y, width, Math.max(1, height * .002));
      }

      c.globalAlpha = .04;
      c.fillStyle = "#53606f";
      for (let i = 0; i < 120; i += 1) {
        const x = (stableNoise(`notebook-speck-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`notebook-speck-y-${i}`) * .5 + .5) * height;
        c.fillRect(x, y, 1.5, 1.5);
      }
    }

    if (background.texture === "starryNight") {
      const sky = c.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#071126");
      sky.addColorStop(.55, "#101c3f");
      sky.addColorStop(1, "#02040b");
      c.globalAlpha = 1;
      c.fillStyle = sky;
      c.fillRect(0, 0, width, height);

      const moonGlow = c.createRadialGradient(width * .78, height * .20, 0, width * .78, height * .20, Math.max(width, height) * .38);
      moonGlow.addColorStop(0, "rgba(255,255,230,.30)");
      moonGlow.addColorStop(.42, "rgba(200,215,255,.12)");
      moonGlow.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = moonGlow;
      c.fillRect(0, 0, width, height);

      for (let i = 0; i < 120; i += 1) {
        const x = (stableNoise(`star-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`star-y-${i}`) * .5 + .5) * height;
        const r = Math.max(.8, Math.min(width, height) * (.0015 + (stableNoise(`star-r-${i}`) * .5 + .5) * .003));
        c.globalAlpha = .35 + (stableNoise(`star-a-${i}`) * .5 + .5) * .55;
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }

    if (background.texture === "purpleMist") {
      const mistBg = c.createLinearGradient(0, 0, width, height);
      mistBg.addColorStop(0, "#191221");
      mistBg.addColorStop(.45, "#2b1742");
      mistBg.addColorStop(1, "#0e1019");
      c.globalAlpha = 1;
      c.fillStyle = mistBg;
      c.fillRect(0, 0, width, height);

      for (let i = 0; i < 12; i += 1) {
        const x = (stableNoise(`mist-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`mist-y-${i}`) * .5 + .5) * height;
        const r = Math.max(width, height) * (.16 + (stableNoise(`mist-r-${i}`) * .5 + .5) * .22);
        const mist = c.createRadialGradient(x, y, 0, x, y, r);
        mist.addColorStop(0, "rgba(180,130,255,.18)");
        mist.addColorStop(.5, "rgba(120,190,230,.07)");
        mist.addColorStop(1, "rgba(255,255,255,0)");
        c.globalAlpha = 1;
        c.fillStyle = mist;
        c.fillRect(0, 0, width, height);
      }
    }

    if (background.texture === "treasureMap") {
      const parchment = c.createRadialGradient(width * .5, height * .45, 0, width * .5, height * .45, Math.max(width, height) * .72);
      parchment.addColorStop(0, "#f0d89c");
      parchment.addColorStop(.62, "#d9b874");
      parchment.addColorStop(1, "#9e6f38");
      c.globalAlpha = 1;
      c.fillStyle = parchment;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .12;
      c.strokeStyle = "#6f451f";
      c.lineWidth = Math.max(1, Math.min(width, height) * .004);

      for (let i = 0; i < 18; i += 1) {
        const y = (i + 1) * height / 19;
        c.beginPath();
        c.moveTo(width * .05, y + stableNoise(`map-line-a-${i}`) * 12);
        c.bezierCurveTo(
          width * .28,
          y + stableNoise(`map-line-b-${i}`) * 22,
          width * .62,
          y + stableNoise(`map-line-c-${i}`) * 22,
          width * .95,
          y + stableNoise(`map-line-d-${i}`) * 12
        );
        c.stroke();
      }

      c.globalAlpha = .13;
      c.fillStyle = "#5f3b1a";
      for (let i = 0; i < 90; i += 1) {
        const x = (stableNoise(`map-speck-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`map-speck-y-${i}`) * .5 + .5) * height;
        const r = Math.max(1.2, Math.min(width, height) * (.002 + (stableNoise(`map-speck-r-${i}`) * .5 + .5) * .006));
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }

    if (background.texture === "rainbow") {
      const rainbow = c.createLinearGradient(0, 0, width, height);
      rainbow.addColorStop(0, "#ff5a51");
      rainbow.addColorStop(.18, "#ffa351");
      rainbow.addColorStop(.34, "#ffc751");
      rainbow.addColorStop(.50, "#a7cb6f");
      rainbow.addColorStop(.68, "#40b9c5");
      rainbow.addColorStop(.84, "#7f66c6");
      rainbow.addColorStop(1, "#ff9bd2");
      c.globalAlpha = 1;
      c.fillStyle = rainbow;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .24;
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 14; i += 1) {
        const y = (i - 2) * height / 10;
        c.beginPath();
        c.ellipse(width * .5, y, width * .78, height * .12, -.24, 0, Math.PI * 2);
        c.fill();
      }
    }

    if (background.texture === "wood") {
      const wood = c.createLinearGradient(0, 0, width, height);
      wood.addColorStop(0, "#a36f44");
      wood.addColorStop(.5, "#7c4d2b");
      wood.addColorStop(1, "#5d351d");
      c.globalAlpha = 1;
      c.fillStyle = wood;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .22;
      c.strokeStyle = "#3e2414";
      c.lineWidth = Math.max(1, Math.min(width, height) * .004);

      for (let y = 0; y < height; y += Math.max(18, height * .055)) {
        c.beginPath();
        c.moveTo(0, y);
        for (let x = 0; x <= width; x += width / 8) {
          c.lineTo(x, y + stableNoise(`wood-${x}-${y}`) * height * .018);
        }
        c.stroke();
      }

      c.globalAlpha = .16;
      for (let i = 0; i < 8; i += 1) {
        const x = (stableNoise(`knot-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`knot-y-${i}`) * .5 + .5) * height;
        c.beginPath();
        c.ellipse(x, y, width * .045, height * .018, stableNoise(`knot-r-${i}`), 0, Math.PI * 2);
        c.stroke();
      }
    }

    if (background.texture === "crackedStone") {
      const stone = c.createRadialGradient(width * .5, height * .42, 0, width * .5, height * .42, Math.max(width, height) * .72);
      stone.addColorStop(0, "#a0a6ad");
      stone.addColorStop(.55, "#777d83");
      stone.addColorStop(1, "#4b5056");
      c.globalAlpha = 1;
      c.fillStyle = stone;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .20;
      c.strokeStyle = "#2d3135";
      c.lineWidth = Math.max(1.2, Math.min(width, height) * .004);

      for (let i = 0; i < 18; i += 1) {
        let x = (stableNoise(`crack-x-${i}`) * .5 + .5) * width;
        let y = (stableNoise(`crack-y-${i}`) * .5 + .5) * height;
        c.beginPath();
        c.moveTo(x, y);

        for (let j = 0; j < 4; j += 1) {
          x += stableNoise(`crack-x-${i}-${j}`) * width * .10;
          y += stableNoise(`crack-y-${i}-${j}`) * height * .10;
          c.lineTo(x, y);
        }

        c.stroke();
      }

      c.globalAlpha = .10;
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 70; i += 1) {
        const x = (stableNoise(`stone-speck-x-${i}`) * .5 + .5) * width;
        const y = (stableNoise(`stone-speck-y-${i}`) * .5 + .5) * height;
        c.fillRect(x, y, 2, 2);
      }
    }

    if (background.texture === "grass") {
      const skyGrass = c.createLinearGradient(0, 0, 0, height);
      skyGrass.addColorStop(0, "#dff7ff");
      skyGrass.addColorStop(.48, "#eefdf0");
      skyGrass.addColorStop(.49, "#92d36d");
      skyGrass.addColorStop(1, "#3e8c32");
      c.globalAlpha = 1;
      c.fillStyle = skyGrass;
      c.fillRect(0, 0, width, height);

      c.globalAlpha = .25;
      c.strokeStyle = "#1f6f25";
      c.lineWidth = Math.max(1, width * .002);

      for (let i = 0; i < 120; i += 1) {
        const x = (stableNoise(`grass-x-${i}`) * .5 + .5) * width;
        const baseY = height * (.58 + (stableNoise(`grass-y-${i}`) * .5 + .5) * .38);
        const bladeH = height * (.025 + (stableNoise(`grass-h-${i}`) * .5 + .5) * .055);
        c.beginPath();
        c.moveTo(x, baseY);
        c.lineTo(x + stableNoise(`grass-lean-${i}`) * width * .014, baseY - bladeH);
        c.stroke();
      }
    }

    c.restore();

    drawRemixBorder(c, width, height, options);
  }



  function drawCompleteText(c, width, height, options) {
    const cleanOptions = sanitizeRemixOptions({ ...options });
    const layout = makeLayout(width, height, cleanOptions);
    clearPlaybackCanvas(c, width, height, cleanOptions);

    drawLayoutGlyphs(c, layout, cleanOptions, 1);

    if (layout.referenceDecoration) {
      drawReferenceDecoration(c, layout.referenceDecoration, cleanOptions, 1);
    }
  }

  function drawLayoutGlyphs(c, layout, options, partial = 1) {
    let colorIndex = 0;

    for (const item of layout.placements || []) {
      if (/\s/.test(item.char)) continue;

      drawGlyph(
        c,
        getGlyph(item.char),
        item.x,
        item.y,
        item.w,
        item.fontSize,
        { ...options, _colorIndex: colorIndex },
        partial
      );

      colorIndex += 1;
    }
  }

  function drawCompletedPlaybackItem(c, item, options) {
    if (!item) return;

    if (item.type === "referenceDecoration") {
      drawReferenceDecoration(c, item.decoration, options, 1);
      return;
    }

    drawGlyph(
      c,
      getGlyph(item.char),
      item.x,
      item.y,
      item.w,
      item.fontSize,
      { ...options, _colorIndex: item.colorIndex || 0 },
      1
    );
  }

  async function saveGhostWriterImage(options = state.remix) {
    const cleanOptions = sanitizeRemixOptions({ ...options });
    const size = EXPORT_SIZES[cleanOptions.exportSize || "square"] || EXPORT_SIZES.square;
    const background = getBackgroundConfig(cleanOptions);

    if (background.texture === "image") {
      await waitForBackgroundImage(background.imageSrc);
    }

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    const c = canvas.getContext("2d");
    if (!c) return;

    c.setTransform(1, 0, 0, 1, 0, 0);
    drawCompleteText(c, size.width, size.height, cleanOptions);

    const filename = makeExportFilename(size);

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          downloadCanvasDataUrl(canvas, filename);
          return;
        }

        downloadBlob(blob, filename);
      }, "image/png");

      return;
    }

    downloadCanvasDataUrl(canvas, filename);
  }


  function waitForBackgroundImage(src) {
    const img = getBackgroundImage(src);

    if (!img) return Promise.resolve();
    if (img.complete && img.naturalWidth && img.naturalHeight) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => resolve();

      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });

      setTimeout(done, 1200);
    });
  }

  function makeExportFilename(size = EXPORT_SIZES.square) {
    const ref = String(parsedRef?.display || ctx.verseRef || "verse")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);

    const suffix = ref || "verse";
    const sizeLabel = size.filenameLabel || "image";

    return `${EXPORT_IMAGE.filenamePrefix}-${suffix}-${sizeLabel}.png`;
  }


  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadCanvasDataUrl(canvas, filename) {
    const link = document.createElement("a");

    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function startPlayback(canvas, card, options, onDone) {
    const rect = card.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    const layout = makeLayout(rect.width, rect.height, options);
    const placements = buildPlaybackPlacements(layout);
    const speed = SPEEDS[options.speed] || SPEEDS.normal;
    const toolConfig = getPlaybackToolConfig(options);
    const toolEl = document.getElementById("ghostPlaybackTool");

    playbackState = {
      running: true,
      c,
      width: rect.width,
      height: rect.height,
      options,
      placements,
      index: 0,
      charStart: performance.now(),
      pauseUntil: 0,
      speed,
      toolConfig,
      toolEl,
      lastTip: null,
      lastDirectionDeg: null,
      directionWiggle: 0,
      vaporTrail: [],
      onDone
    };

    clearPlaybackCanvas(c, rect.width, rect.height, options);
    hidePlaybackTool(playbackState);
    playbackRaf = requestAnimationFrame(playbackFrame);
  }

  function buildPlaybackPlacements(layout) {
    const all = Array.isArray(layout?.placements) ? layout.placements : [];
    const out = [];

    for (let i = 0; i < all.length; i += 1) {
      const item = all[i];
      if (!item || /\s/.test(item.char)) continue;

      const pauseAfter = getPauseAfterPlacement(all, i);

      out.push({
        ...item,
        pauseAfter,
        colorIndex: out.length
      });
    }

    if (layout?.referenceDecoration) {
      out.push({
        type: "referenceDecoration",
        decoration: layout.referenceDecoration,
        pauseAfter: 0,
        colorIndex: out.length
      });
    }

    return out;
  }
  

  function getPauseAfterPlacement(allPlacements, index) {
    const current = allPlacements[index];
    if (!current) return 0;

    const char = String(current.char || "");
    const isPunctuation = /[.,;:!?]/.test(char);

    let sawSpace = false;
    let next = null;

    for (let i = index + 1; i < allPlacements.length; i += 1) {
      const item = allPlacements[i];
      if (!item) continue;

      if (/\s/.test(item.char)) {
        sawSpace = true;
        continue;
      }

      next = item;
      break;
    }

    if (!next) {
      return isPunctuation ? PLAYBACK_PAUSES.punctuation : 0;
    }

    const lineJump = next.y > current.y + Math.max(8, current.fontSize * .45);

    if (lineJump) {
      return PLAYBACK_PAUSES.line;
    }

    if (isPunctuation) {
      return PLAYBACK_PAUSES.punctuation;
    }

    if (sawSpace) {
      return PLAYBACK_PAUSES.word;
    }

    return 0;
  }

  function playbackFrame(now) {
    const ps = playbackState;
    if (!ps || !ps.running) return;

    const placements = ps.placements;

    if (ps.pauseUntil && now < ps.pauseUntil) {
      clearPlaybackCanvas(ps.c, ps.width, ps.height, ps.options);
      drawVaporTrail(ps, now);

      for (let i = 0; i < ps.index; i += 1) {
        drawCompletedPlaybackItem(ps.c, placements[i], ps.options);
      }

      if (ps.lastTip) {
        updatePlaybackTool(ps, ps.lastTip, now, false);
      }

      playbackRaf = requestAnimationFrame(playbackFrame);
      return;
    }

    if (ps.pauseUntil && now >= ps.pauseUntil) {
      ps.pauseUntil = 0;
      ps.charStart = now;
    }

    if (ps.index >= placements.length) {
      drawCompleteText(ps.c, ps.width, ps.height, ps.options);
      hidePlaybackTool(ps);

      const done = ps.onDone;
      playbackState = null;
      playbackRaf = 0;

      if (typeof done === "function") done();
      return;
    }

    const current = placements[ps.index];
    const isDecoration = current?.type === "referenceDecoration";
    const glyph = isDecoration ? null : getGlyph(current.char);
    const pieces = isDecoration ? getReferenceDecorationPieceCount(current.decoration) : (glyph ? countStrokePieces(glyph.strokes) : 1);
    const duration = isDecoration
      ? clamp((160 + pieces * 18) * (ps.speed?.multiplier || 1), 180, 900)
      : clamp((92 + pieces * 15) * (ps.speed?.multiplier || 1), 65, 480);
    const progress = clamp((now - ps.charStart) / duration, 0, 1);
    const tip = isDecoration
      ? getReferenceDecorationTip(current.decoration, ps.options, progress)
      : getGlyphPlaybackTip(glyph, current, ps.options, progress);

    clearPlaybackCanvas(ps.c, ps.width, ps.height, ps.options);

    if (tip) {
      ps.lastTip = tip;
      addVaporPuff(ps, tip, now);
    }

    drawVaporTrail(ps, now);

    for (let i = 0; i < ps.index; i += 1) {
      drawCompletedPlaybackItem(ps.c, placements[i], ps.options);
    }

    if (isDecoration) {
      drawReferenceDecoration(ps.c, current.decoration, ps.options, progress);
    } else {
      drawGlyph(ps.c, glyph, current.x, current.y, current.w, current.fontSize, { ...ps.options, _colorIndex: current.colorIndex || 0 }, progress);
    }

    if (tip) {
      updatePlaybackTool(ps, tip, now, true);
    }

    if (progress >= 1) {
      ps.index += 1;

      if (current.pauseAfter) {
        ps.pauseUntil = now + current.pauseAfter * (ps.speed?.pauseMultiplier || 1);
      } else {
        ps.charStart = now;
      }
    }

    playbackRaf = requestAnimationFrame(playbackFrame);
  }

  function hidePlaybackTool(ps) {
    const tool = ps?.toolEl;
    if (!tool) return;

    tool.classList.remove("is-visible");
  }

  function updatePlaybackTool(ps, tip, now, moving) {
    const tool = ps?.toolEl;
    if (!tool || !tip) return;

    const toolConfig = ps.toolConfig || PLAYBACK_TOOL;

    if (moving && Number.isFinite(tip.angleDeg)) {
      if (ps.lastDirectionDeg === null || ps.lastDirectionDeg === undefined) {
        ps.lastDirectionDeg = tip.angleDeg;
      } else {
        const delta = shortestAngleDelta(ps.lastDirectionDeg, tip.angleDeg);

        if (Math.abs(delta) > 12) {
          ps.directionWiggle += clamp(
            delta * .10,
            -toolConfig.directionWiggleDeg,
            toolConfig.directionWiggleDeg
          );
        }

        ps.lastDirectionDeg = tip.angleDeg;
      }
    }

    ps.directionWiggle = clamp(
      (ps.directionWiggle || 0) * toolConfig.directionWiggleDecay,
      -toolConfig.directionWiggleDeg,
      toolConfig.directionWiggleDeg
    );

    const idleWobble = Math.sin(now / 180) * toolConfig.idleWobbleDeg;
    const tinyHandJitter = moving
      ? stableNoise(`${Math.floor(now / 120)}-${tip.x}-${tip.y}`) * .65
      : 0;

    const angle =
      toolConfig.baseRotationDeg +
      ps.directionWiggle +
      idleWobble +
      tinyHandJitter;

    tool.style.left = `${tip.x}px`;
    tool.style.top = `${tip.y}px`;
    tool.style.transform = `translateY(-100%) rotate(${angle}deg)`;
    tool.classList.add("is-visible");
  }


  function shortestAngleDelta(fromDeg, toDeg) {
    let delta = (toDeg - fromDeg) % 360;

    if (delta > 180) {
      delta -= 360;
    }

    if (delta < -180) {
      delta += 360;
    }

    return delta;
  }

  function addVaporPuff(ps, tip, now) {
    if (!ps || !tip) return;

    const vapor = getVaporConfig(ps.options);

    if (!vapor.enabled) {
      ps.vaporTrail = [];
      return;
    }

    const last = ps.vaporTrail[ps.vaporTrail.length - 1];

    if (last) {
      const dx = tip.x - last.x;
      const dy = tip.y - last.y;
      if (Math.hypot(dx, dy) < vapor.spawnDistance) {
        return;
      }
    }

    ps.vaporTrail.push({
      x: tip.x + stableNoise(`vap-x-${now}`) * 4,
      y: tip.y + stableNoise(`vap-y-${now}`) * 4,
      born: now,
      life: vapor.life + Math.random() * vapor.lifeJitter,
      radius: vapor.radius + Math.random() * vapor.radiusJitter,
      alpha: vapor.alpha,
      driftY: vapor.driftY
    });

    if (ps.vaporTrail.length > vapor.max) {
      ps.vaporTrail.splice(0, ps.vaporTrail.length - vapor.max);
    }
  }

  function drawVaporTrail(ps, now) {
    if (!ps || !Array.isArray(ps.vaporTrail) || !ps.vaporTrail.length) return;

    const c = ps.c;
    const alive = [];

    c.save();
    c.globalCompositeOperation = "lighter";

    for (const puff of ps.vaporTrail) {
      const age = now - puff.born;
      const t = clamp(age / puff.life, 0, 1);

      if (t >= 1) continue;

      alive.push(puff);

      const alpha = (1 - t) * (puff.alpha ?? .18);
      const radius = puff.radius * (1 + t * 1.7);
      const driftY = -(puff.driftY ?? 18) * t;
      const driftX = stableNoise(`drift-${puff.born}`) * 10 * t;

      const gradient = c.createRadialGradient(
        puff.x + driftX,
        puff.y + driftY,
        0,
        puff.x + driftX,
        puff.y + driftY,
        radius
      );

      gradient.addColorStop(0, `rgba(235,240,255,${alpha})`);
      gradient.addColorStop(.55, `rgba(190,200,255,${alpha * .45})`);
      gradient.addColorStop(1, "rgba(235,240,255,0)");

      c.fillStyle = gradient;
      c.beginPath();
      c.arc(puff.x + driftX, puff.y + driftY, radius, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();

    ps.vaporTrail = alive;
  }

  function getGlyphPlaybackTip(glyph, item, options = {}, partial = 1) {
    if (!glyph || !glyph.strokes || !glyph.strokes.length || !item) return null;

    const metrics = getGlyphDrawMetrics(glyph, item, options);
    const safePartial = clamp(partial, 0, 1);
    const strokeUnits = glyph.strokes.map((stroke) => getStrokePlaybackUnits(stroke));
    const totalUnits = strokeUnits.reduce((sum, units) => sum + units, 0) || 1;
    let remainingUnits = totalUnits * safePartial;

    if (remainingUnits <= 0) {
      const firstStroke = glyph.strokes[0];
      const firstPoint = firstStroke?.[0];

      return firstPoint ? transformGlyphPoint(firstPoint, metrics) : null;
    }

    for (let strokeIndex = 0; strokeIndex < glyph.strokes.length; strokeIndex += 1) {
      const stroke = glyph.strokes[strokeIndex];
      const units = strokeUnits[strokeIndex] || 1;

      if (!stroke || !stroke.length) continue;

      if (remainingUnits > units) {
        remainingUnits -= units;
        continue;
      }

      const strokeProgress = clamp(remainingUnits / units, 0, 1);
      const local = getStrokePointAtProgress(stroke, strokeProgress);

      return local ? transformGlyphPoint(local, metrics) : null;
    }

    const lastStroke = glyph.strokes[glyph.strokes.length - 1];
    const lastPoint = lastStroke?.[lastStroke.length - 1];

    return lastPoint ? transformGlyphPoint(lastPoint, metrics) : null;
  }

  function getGlyphDrawMetrics(glyph, item, options = {}) {
    const glyphBounds = glyph.bounds || computeBounds(glyph.strokes);
    const fontSize = item.fontSize;
    const cellW = item.w;
    const x = item.x;
    const baselineY = item.y;
    const jitterOn = options.jitter === "on";
    const wobbleOn = options.wobble === "on";

    const profileInfo = getGlyphUsableArea(glyph.char, fontSize, cellW);
    const usableH = profileInfo.usableH;
    const usableW = profileInfo.usableW;
    const scale = Math.min(
      usableW / Math.max(.04, glyphBounds.width),
      usableH / Math.max(.04, glyphBounds.height)
    );

    const drawW = glyphBounds.width * scale;
    const drawH = glyphBounds.height * scale;
    const baseX = x + (cellW - drawW) / 2 - glyphBounds.minX * scale;
    const baseY = getGlyphBaseYForProfile(baselineY, fontSize, usableH, drawH, profileInfo) - glyphBounds.minY * scale;

    const jitterX = jitterOn ? stableNoise(`${glyph.char}-${x}-x`) * fontSize * .08 : 0;
    const jitterY = jitterOn ? stableNoise(`${glyph.char}-${x}-y`) * fontSize * .06 : 0;
    const rotation = wobbleOn ? stableNoise(`${glyph.char}-${x}-r`) * .09 : 0;

    return {
      baseX,
      baseY,
      scale,
      originX: x + cellW / 2,
      originY: baselineY - fontSize * .36,
      jitterX,
      jitterY,
      rotation
    };
  }


  function getStrokePointAtProgress(stroke, progress) {
    const safeProgress = clamp(progress, 0, 1);

    if (!stroke || !stroke.length) return null;

    if (stroke.length === 1) {
      return {
        x: stroke[0].x,
        y: stroke[0].y,
        angleDeg: 0
      };
    }

    const segmentCount = stroke.length - 1;
    const pieces = segmentCount * safeProgress;

    if (pieces <= 0) {
      const a = stroke[0];
      const b = stroke[1] || a;

      return {
        x: a.x,
        y: a.y,
        angleDeg: Math.atan2((b.y || a.y) - a.y, (b.x || a.x) - a.x) * 180 / Math.PI
      };
    }

    const index = Math.min(segmentCount - 1, Math.floor(pieces));
    const remain = clamp(pieces - index, 0, 1);
    const a = stroke[index];
    const b = stroke[index + 1] || a;

    return {
      x: a.x + ((b.x || a.x) - a.x) * remain,
      y: a.y + ((b.y || a.y) - a.y) * remain,
      angleDeg: Math.atan2((b.y || a.y) - a.y, (b.x || a.x) - a.x) * 180 / Math.PI
    };
  }

  function transformGlyphPoint(point, metrics) {
    const rawX = metrics.baseX + point.x * metrics.scale;
    const rawY = metrics.baseY + point.y * metrics.scale;
    const dx = rawX - metrics.originX;
    const dy = rawY - metrics.originY;
    const cos = Math.cos(metrics.rotation);
    const sin = Math.sin(metrics.rotation);

    return {
      x: metrics.originX + metrics.jitterX + dx * cos - dy * sin,
      y: metrics.originY + metrics.jitterY + dx * sin + dy * cos,
      angleDeg: (point.angleDeg || 0) + metrics.rotation * 180 / Math.PI
    };
  }

  function stopPlayback() {
    if (playbackState) {
      hidePlaybackTool(playbackState);
    }

    if (playbackRaf) {
      cancelAnimationFrame(playbackRaf);
      playbackRaf = 0;
    }

    playbackState = null;
  }

  function drawRemixPreview() {
    const canvas = document.getElementById("ghostRemixCanvas");
    const preview = document.getElementById("ghostRemixPreview");
    if (!canvas || !preview) return;

    const rect = preview.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    drawCompleteText(c, rect.width, rect.height, state.remix);
  }

  async function markVersePracticed() {
    const verseId = ctx.verseId;
    if (!verseId) return { ok: false };

    if (typeof bridge().markVersePracticed === "function") {
      try {
        return bridge().markVersePracticed({ verseId });
      } catch (err) {
        console.warn("Ghost Writer bridge markVersePracticed failed; falling back.", err);
      }
    }

    try {
      const raw = localStorage.getItem("verseMemoryProgress");
      const progress = raw ? JSON.parse(raw) : { version: 1, verses: {} };

      if (!progress || typeof progress !== "object") return { ok: false };
      if (!progress.verses || typeof progress.verses !== "object") progress.verses = {};
      if (!progress.version) progress.version = 1;

      if (!progress.verses[verseId]) {
        progress.verses[verseId] = {
          learnCompleted: false,
          games: {}
        };
      }

      progress.verses[verseId].lastPracticedAt = Date.now();
      localStorage.setItem("verseMemoryProgress", JSON.stringify(progress));
      return { ok: true };
    } catch (err) {
      console.warn("Ghost Writer could not mark verse as practiced", err);
      return { ok: false };
    }
  }

  function fitGuideCharacter() {
    const guide = document.getElementById("ghostGuideText");
    const wrap = document.getElementById("ghostDrawWrap");
    if (!guide || !wrap) return;

    const char = currentChar();
    const rect = wrap.getBoundingClientRect();
    const box = Math.max(1, Math.min(rect.width, rect.height));
    const centeredGuide = CENTERED_TRAINING_GUIDES.has(char);
    const guideProfile = getGuideRenderProfile(char);
    const guideOffsetY = (guideProfile?.yOffset || 0) * box;

    guide.style.top = centeredGuide ? "50%" : "";
    guide.style.bottom = centeredGuide ? "auto" : "";
    guide.style.height = centeredGuide ? "auto" : "";
    guide.style.transform = centeredGuide
      ? `translateY(calc(-50% + ${guideOffsetY}px))`
      : "";

    const probe = document.createElement("span");
    probe.textContent = char || "A";
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    probe.style.fontFamily = window.getComputedStyle(guide).fontFamily;
    probe.style.fontWeight = window.getComputedStyle(guide).fontWeight;
    probe.style.lineHeight = ".92";
    document.body.appendChild(probe);

    const symbol = isSymbolChar(char);
    const skinnySymbol = [".", ",", ":", ";", "'", '"'].includes(char);
    const targetW = box * (symbol ? (skinnySymbol ? GUIDE_FIT.skinnySymbolWidth : GUIDE_FIT.symbolWidth) : GUIDE_FIT.letterWidth);
    const targetH = box * (symbol ? GUIDE_FIT.symbolHeight : GUIDE_FIT.letterHeight);
    const maxSize = box * (symbol ? GUIDE_FIT.maxSymbolSize : GUIDE_FIT.maxLetterSize);
    const minSize = box * GUIDE_FIT.minSize;

    let low = minSize;
    let high = maxSize;
    let best = minSize;

    for (let i = 0; i < 14; i += 1) {
      const mid = (low + high) / 2;
      probe.style.fontSize = `${mid}px`;
      const w = probe.offsetWidth || 1;
      const h = probe.offsetHeight || 1;

      if (w <= targetW && h <= targetH) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    document.body.removeChild(probe);
    guide.style.fontSize = `${Math.round(best)}px`;
  }



  function clearGuideTimer() {
    if (guideTimer) {
      clearTimeout(guideTimer);
      guideTimer = null;
    }
  }

  window.addEventListener("resize", () => {
    if (state.screen === "remix") drawRemixPreview();
    if (state.screen === "training") fitGuideCharacter();
  });

  async function boot() {
    try {
      ctx = await bridge().getVerseContext?.() || ctx;
    } catch (err) {
      console.warn("Ghost Writer could not load verse context", err);
    }

    buildFullText();
    renderIntro();
  }

  boot();
})();
