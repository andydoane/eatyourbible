(function(){
  "use strict";

  const GAME_ID = "ghost_writer";
  const GAME_TITLE = "Ghost Writer";
  const GAME_ICON = "👻✍️";
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
    teal: { label: "Teal", value: "#40b9c5" },
    purple: { label: "Purple", value: "#7f66c6" },
    darkGray: { label: "Dark Gray", value: "#333333" },
    lightGray: { label: "Light Gray", value: "#f2f2f2" },
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

  const REMIX_PRESETS = {
    ghost: {
      label: "Ghost Black",
      cardClass: "",
      background: "#050509",
      ink: "#f2f2f2",
      shadow: "rgba(255,255,255,.32)",
      lineCap: "round"
    },
    chalkboard: {
      label: "Chalkboard",
      cardClass: "is-chalkboard",
      background: "#15352d",
      ink: "#f2f2f2",
      shadow: "rgba(255,255,255,.20)",
      lineCap: "round"
    },
    paper: {
      label: "Paper",
      cardClass: "is-paper",
      background: "#fff8e8",
      ink: "#333333",
      shadow: "rgba(51,51,51,.10)",
      lineCap: "round"
    }
  };

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

  const PLAYBACK_TOOL = {
    src: "./ghost_writer_images/ghost_writer_pencil.png",
    baseRotationDeg: -8,
    idleWobbleDeg: 1.2,
    directionWiggleDeg: 4.5,
    directionWiggleDecay: .82,
    visible: true
  };

  const PLAYBACK_PAUSES = {
    word: 115,
    punctuation: 175,
    line: 330
  };

  const app = document.getElementById("app");

  const DEBUG_GHOST_WRITER = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("gwDebug") === "1" || localStorage.getItem("ghostWriterDebug") === "1";
    } catch (err){
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

  window.getGhostWriterDebugJson = function(){
    return JSON.stringify(window.GHOST_WRITER_DEBUG_LOG || [], null, 2);
  };

  window.clearGhostWriterDebugLog = function(){
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

  const state = {
    screen: "intro",
    fullText: "",
    displayLines: [],
    requiredChars: [],
    currentCharIndex: 0,
    currentStrokes: [],
    currentStroke: null,
    glyphs: new Map(),
    hasDrawnCurrent: false,
    practiceMarked: false,
    remix: {
      background: "ghost",
      textColor: "lightGray",
      style: "ghost",
      speed: "normal",
      thickness: "normal",
      jitter: "off",
      wobble: "off"
    }
  };

  function shell(){
    return window.VerseGameShell || {};
  }

  function bridge(){
    return window.VerseGameBridge || {};
  }

  function escapeHtml(value){
    if (shell().escapeHtml) return shell().escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max){
    if (shell().clamp) return shell().clamp(value, min, max);
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeTextForGhost(text){
    return String(text ?? "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function buildFullText(){
    parsedRef = shell().parseReferenceParts
      ? shell().parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId)
      : { book: ctx.verseRef || "", reference: "", display: ctx.verseRef || "" };

    const verse = normalizeTextForGhost(ctx.verseText || "");
    const ref = normalizeTextForGhost(
      [parsedRef?.book || "", parsedRef?.reference || ""].filter(Boolean).join(" ")
    );

    const lines = [verse, ref].filter(Boolean);

    state.displayLines = lines.length ? lines : ["WRITE THE VERSE"];
    state.fullText = state.displayLines.join("\n");
    state.requiredChars = extractRequiredChars(state.fullText);
  }

  function extractRequiredChars(text){
    const out = [];
    const seen = new Set();

    for (const char of String(text || "")){
      if (/\s/.test(char)) continue;
      if (seen.has(char)) continue;
      seen.add(char);
      out.push(char);
    }

    return out;
  }

  function helpHtml(){
    return `
      <ul class="ghost-help-list">
        <li>Write each uppercase character one time in the big square.</li>
        <li>Beginner keeps a light guide on the page. Advanced flashes the guide, then hides it.</li>
        <li>When every character is ready, tap <strong>Ghost Write!</strong> and watch the verse write itself.</li>
        <li>After the first ghost writing, replay it with fun styles like chalkboard and crayon.</li>
      </ul>
    `;
  }

  function renderIntro(){
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

  function renderModeSelect(){
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

  function startRun(mode){
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
    state.remix = {
      background: "ghost",
      textColor: "lightGray",
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
  

  function wireMenu(){
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
      onClose: () => {},
      onBackFromHelp: () => {}
    });
  }

  function currentChar(){
    return state.requiredChars[state.currentCharIndex] || "";
  }

  function isSymbolChar(char){
    return !/[A-Z0-9]/.test(char);
  }

  function isAlphaNumericChar(char){
    return /^[A-Z0-9]$/.test(String(char || ""));
  }

  function allowsDotStroke(char){
    return [".", ":", ";", "!", "?"].includes(String(char || ""));
  }

  function charLabel(char){
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

  function renderTraining(){
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

    if (selectedMode === "advanced"){
      guideTimer = setTimeout(() => {
        document.getElementById("ghostGuideText")?.classList.add("is-faded");
      }, 950);
    }
  }

  function setupCanvasForDpr(canvas, cssWidth, cssHeight){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.dataset.cssWidth = String(cssWidth);
    canvas.dataset.cssHeight = String(cssHeight);
    return c;
  }

  function setupDrawingCanvas(){
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
      if (stroke.length === 1){
        drawTrainingPoint(c, stroke[0], rect.width, rect.height);
      }
      state.currentStroke = null;
    };

    canvas.onpointerup = endStroke;
    canvas.onpointercancel = endStroke;
    canvas.onpointerleave = endStroke;
  }

  function drawTrainingPoint(c, point, width, height){
    c.save();
    c.fillStyle = "#16171d";
    c.beginPath();
    c.arc(point.x * width, point.y * height, Math.max(3.5, width * .011), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawTrainingSegment(c, a, b, width, height){
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

  function drawAllTrainingStrokes(c, width, height){
    for (const stroke of state.currentStrokes){
      if (!stroke || !stroke.length) continue;
      if (stroke.length === 1){
        drawTrainingPoint(c, stroke[0], width, height);
        continue;
      }
      for (let i = 1; i < stroke.length; i += 1){
        drawTrainingSegment(c, stroke[i - 1], stroke[i], width, height);
      }
    }
  }

  function clearCurrentDrawing(){
    state.currentStrokes = [];
    state.currentStroke = null;
    state.hasDrawnCurrent = false;
    const canvas = document.getElementById("ghostDrawCanvas");
    if (canvas){
      const width = Number(canvas.dataset.cssWidth) || canvas.getBoundingClientRect().width;
      const height = Number(canvas.dataset.cssHeight) || canvas.getBoundingClientRect().height;
      const c = setupCanvasForDpr(canvas, width, height);
      c.clearRect(0, 0, width, height);
    }
    updateSaveButton();
  }

  function updateSaveButton(){
    const btn = document.getElementById("ghostSaveBtn");
    if (!btn) return;
    btn.disabled = !state.hasDrawnCurrent;
  }

  function saveCurrentGlyph(){
    if (!state.hasDrawnCurrent) return;

    const char = currentChar();
    const glyph = makeGlyph(char, state.currentStrokes);
    state.glyphs.set(char, glyph);

    state.currentCharIndex += 1;
    state.currentStrokes = [];
    state.currentStroke = null;
    state.hasDrawnCurrent = false;

    if (state.currentCharIndex >= state.requiredChars.length){
      renderReady();
      return;
    }

    renderTraining();
  }

  function makeGlyph(char, strokes){
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
    if (isAlphaNumericChar(char) && !allowsDotStroke(char)){
      filtered = raw.filter((stroke) => {
        if (!stroke || stroke.length < 2) return false;
        return strokeDistance(stroke) >= .012;
      });

      // If filtering would erase the whole glyph, keep the original data so a
      // child does not lose a very small but intentional mark.
      if (!filtered.length && raw.length){
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

  function strokeDistance(stroke){
    let total = 0;
    for (let i = 1; i < (stroke?.length || 0); i += 1){
      const a = stroke[i - 1];
      const b = stroke[i];
      const dx = (b.x || 0) - (a.x || 0);
      const dy = (b.y || 0) - (a.y || 0);
      total += Math.hypot(dx, dy);
    }
    return total;
  }

  function strokeBounds(stroke){
    return computeBounds([stroke || []]);
  }

  function round4(value){
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 10000) / 10000;
  }

  function logGlyphDebug(glyph, rawStrokes){
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

    if (DEBUG_GHOST_WRITER){
      window.GHOST_WRITER_DEBUG_LOG.push(summary);
      console.info(`GW_DEBUG ${JSON.stringify(summary)}`);
    }

    if (suspicious.length){
      console.warn("Ghost Writer glyph had tiny/tap strokes", {
        char: summary.char,
        suspiciousRawStrokeIndexes: summary.suspiciousRawStrokeIndexes,
        removedStrokeCount: summary.removedStrokeCount,
        copyCommand: "copy(window.getGhostWriterDebugJson())",
        summary
      });
    }
  }

  function computeBounds(strokes){
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of strokes || []){
      for (const p of stroke || []){
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }

    if (!Number.isFinite(minX)){
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

  function renderReady(){
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

  function renderPlayback({ options = state.remix, markPractice = false, returnTo = "remix" } = {}){
    stopPlayback();
    clearGuideTimer();
    state.screen = "playback";

    const cleanOptions = sanitizeRemixOptions({ ...options });
    const background = getBackgroundConfig(cleanOptions);

    app.innerHTML = `
      <div class="ghost-playback-root">
        <div class="ghost-playback-card ${escapeHtml(background.cardClass || "")}" id="ghostPlaybackCard">
          <canvas id="ghostPlaybackCanvas" aria-label="Ghost writing playback"></canvas>
          <img
            class="ghost-playback-tool"
            id="ghostPlaybackTool"
            src="${escapeHtml(PLAYBACK_TOOL.src)}"
            alt=""
            draggable="false"
          >
          <div class="ghost-playback-label">Ghost writing...</div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("ghostPlaybackCanvas");
    const card = document.getElementById("ghostPlaybackCard");
    if (!canvas || !card) return;

    requestAnimationFrame(() => {
      startPlayback(canvas, card, cleanOptions, async () => {
        if (markPractice && !state.practiceMarked){
          state.practiceMarked = true;
          await markVersePracticed();
        }

        if (returnTo === "remix") renderRemix();
      });
    });
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
          <div class="ghost-options">
            ${selectBackgroundHtml("ghostBackgroundSelect", "Background", state.remix.background)}
            ${selectTextColorHtml("ghostTextColorSelect", "Text Color", state.remix.textColor, state.remix.background)}
            ${selectOptionHtml("ghostSpeedSelect", "Speed", state.remix.speed, SPEEDS)}
            ${selectOptionHtml("ghostThicknessSelect", "Thickness", state.remix.thickness, THICKNESS)}
            ${selectSimpleHtml("ghostJitterSelect", "Jitter", state.remix.jitter, { off: "Off", on: "On" })}
            ${selectSimpleHtml("ghostWobbleSelect", "Wobble", state.remix.wobble, { off: "Off", on: "On" })}
          </div>

          <div class="ghost-remix-actions">
            <button class="vm-btn" id="ghostReplayBtn" type="button">Replay</button>
            <button class="vm-btn vm-btn-secondary" id="ghostAgainBtn" type="button">Try Again</button>
            <button class="vm-btn vm-btn-secondary ghost-full" id="ghostBackBtn" type="button">Back to Playground</button>
          </div>
        </div>
      </div>
    `, { menu: true, wide: true, rootClass: "is-remix-screen" });

    wireMenu();
    wireRemixControls();
    drawRemixPreview();
  }  


  function selectOptionHtml(id, label, value, source){
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

  function selectSimpleHtml(id, label, value, source){
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

    const update = () => {
      state.remix.background = background?.value || state.remix.background;
      state.remix.style = state.remix.background;
      state.remix.textColor = textColor?.value || state.remix.textColor;
      state.remix.speed = speed?.value || state.remix.speed;
      state.remix.thickness = thickness?.value || state.remix.thickness;
      state.remix.jitter = jitter?.value || state.remix.jitter;
      state.remix.wobble = wobble?.value || state.remix.wobble;

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

    [background, textColor, speed, thickness, jitter, wobble].forEach((el) => {
      if (el) el.onchange = update;
    });

    document.getElementById("ghostReplayBtn")?.addEventListener("click", () => {
      sanitizeRemixOptions(state.remix);
      renderPlayback({ options: { ...state.remix }, markPractice: false, returnTo: "remix" });
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
  

  function getGlyph(char){
    return state.glyphs.get(char) || null;
  }

  function glyphWidthUnits(char){
    if (/\s/.test(char)) return .38;
    const glyph = getGlyph(char);
    if (!glyph) return .65;
    const minimum = isSymbolChar(char) ? .20 : .42;
    return clamp(glyph.widthRatio + .16, minimum, .98);
  }

  function makeLayout(width, height){
    const safeWidth = Math.max(120, width);
    const safeHeight = Math.max(120, height);
    const text = state.fullText || "";
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

    for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1){
      const layout = layoutForFontSize(text, fontSize, maxWidth, maxHeight, safeWidth, safeHeight);

      if (!layout.overflows){
        best = layout;
        break;
      }
    }

    if (best) return best;

    return layoutForFontSize(text, minFontSize, maxWidth, maxHeight, safeWidth, safeHeight);
  }

  function layoutForFontSize(text, fontSize, maxWidth, maxHeight, canvasWidth, canvasHeight){
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

      if (line.length && lineWidth + w > maxWidth){
        pushLine();
      }

      line.push({ char, w, fontSize });
      lineWidth += w;
    };

    const tokens = String(text || "").match(/\n|\s+|\S+/g) || [];

    for (const token of tokens){
      if (token === "\n"){
        pushLine();
        continue;
      }

      if (/^\s+$/.test(token)){
        if (line.length) addChar(" ");
        continue;
      }

      const chars = Array.from(token);
      const tokenWidth = chars.reduce((sum, char) => sum + fontSize * glyphWidthUnits(char), 0);

      if (line.length && tokenWidth <= maxWidth && lineWidth + tokenWidth > maxWidth){
        pushLine();
      }

      for (const char of chars){
        addChar(char);
      }
    }

    if (line.length || !lines.length) pushLine();

    const totalHeight = lines.length * lineHeight;
    let y = Math.max(fontSize * .9, (canvasHeight - totalHeight) / 2 + fontSize * .76);

    for (const currentLine of lines){
      let x = (canvasWidth - currentLine.width) / 2;
      for (const item of currentLine.items){
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
    const usableH = fontSize * 1.04;
    const usableW = Math.max(fontSize * .14, cellW * .88);
    const scale = Math.min(
      usableW / Math.max(.04, bounds.width),
      usableH / Math.max(.04, bounds.height)
    );

    const drawW = bounds.width * scale;
    const drawH = bounds.height * scale;
    const baseX = x + (cellW - drawW) / 2 - bounds.minX * scale;
    const baseY = baselineY - usableH * .80 + (usableH - drawH) / 2 - bounds.minY * scale;

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

  function countStrokePieces(strokes){
    let total = 0;
    for (const stroke of strokes || []){
      total += Math.max(1, (stroke?.length || 0) - 1);
    }
    return Math.max(1, total);
  }

  function stableNoise(seed){
    let h = 2166136261;
    const text = String(seed || "");
    for (let i = 0; i < text.length; i += 1){
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
    return backgroundKey === "lightGray" || backgroundKey === "darkGray";
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

  function clearPlaybackCanvas(c, width, height, options) {
    const background = getBackgroundConfig(options);

    c.save();
    c.fillStyle = background.value;
    c.fillRect(0, 0, width, height);

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
      c.globalAlpha = .08;
      c.strokeStyle = "#ffffff";
      c.lineWidth = 1;

      for (let y = 20; y < height; y += 34) {
        c.beginPath();
        c.moveTo(0, y + stableNoise(`chalk-${y}`) * 4);
        c.lineTo(width, y + stableNoise(`chalk2-${y}`) * 4);
        c.stroke();
      }

      c.globalAlpha = .045;
      for (let x = 18; x < width; x += 42) {
        c.beginPath();
        c.moveTo(x + stableNoise(`chalk-v-${x}`) * 3, 0);
        c.lineTo(x + stableNoise(`chalk-v2-${x}`) * 3, height);
        c.stroke();
      }
    }

    if (background.texture === "paper") {
      c.globalAlpha = .18;
      c.fillStyle = "#d7b98b";

      for (let y = 32; y < height; y += 32) {
        c.fillRect(0, y, width, 1);
      }

      c.globalAlpha = .12;
      c.fillStyle = "#7f66c6";
      c.fillRect(width * .12, 0, 2, height);

      c.globalAlpha = .05;
      for (let x = 0; x < width; x += 22) {
        c.fillRect(x, 0, 1, height);
      }
    }

    c.restore();
  }



  function drawCompleteText(c, width, height, options) {
    const cleanOptions = sanitizeRemixOptions({ ...options });
    const layout = makeLayout(width, height);
    clearPlaybackCanvas(c, width, height, cleanOptions);

    let colorIndex = 0;

    for (const item of layout.placements) {
      if (/\s/.test(item.char)) continue;

      drawGlyph(
        c,
        getGlyph(item.char),
        item.x,
        item.y,
        item.w,
        item.fontSize,
        { ...cleanOptions, _colorIndex: colorIndex },
        1
      );

      colorIndex += 1;
    }
  }

  function startPlayback(canvas, card, options, onDone) {
    const rect = card.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    const layout = makeLayout(rect.width, rect.height);
    const placements = buildPlaybackPlacements(layout.placements);
    const speed = SPEEDS[options.speed] || SPEEDS.normal;
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

  function buildPlaybackPlacements(allPlacements) {
    const all = Array.isArray(allPlacements) ? allPlacements : [];
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
        const item = placements[i];
        drawGlyph(ps.c, getGlyph(item.char), item.x, item.y, item.w, item.fontSize, { ...ps.options, _colorIndex: item.colorIndex || 0 }, 1);
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
    const glyph = getGlyph(current.char);
    const pieces = glyph ? countStrokePieces(glyph.strokes) : 1;
    const duration = clamp((92 + pieces * 15) * (ps.speed?.multiplier || 1), 65, 480);
    const progress = clamp((now - ps.charStart) / duration, 0, 1);
    const tip = getGlyphPlaybackTip(glyph, current, ps.options, progress);

    clearPlaybackCanvas(ps.c, ps.width, ps.height, ps.options);

    if (tip) {
      ps.lastTip = tip;
      addVaporPuff(ps, tip, now);
    }

    drawVaporTrail(ps, now);

    for (let i = 0; i < ps.index; i += 1) {
      const item = placements[i];
      drawGlyph(ps.c, getGlyph(item.char), item.x, item.y, item.w, item.fontSize, { ...ps.options, _colorIndex: item.colorIndex || 0 }, 1);
    }

    drawGlyph(ps.c, glyph, current.x, current.y, current.w, current.fontSize, { ...ps.options, _colorIndex: current.colorIndex || 0 }, progress);

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

    if (moving && Number.isFinite(tip.angleDeg)){
      if (ps.lastDirectionDeg === null || ps.lastDirectionDeg === undefined){
        ps.lastDirectionDeg = tip.angleDeg;
      } else {
        const delta = shortestAngleDelta(ps.lastDirectionDeg, tip.angleDeg);

        if (Math.abs(delta) > 12){
          ps.directionWiggle += clamp(
            delta * .10,
            -PLAYBACK_TOOL.directionWiggleDeg,
            PLAYBACK_TOOL.directionWiggleDeg
          );
        }

        ps.lastDirectionDeg = tip.angleDeg;
      }
    }

    ps.directionWiggle = clamp(
      (ps.directionWiggle || 0) * PLAYBACK_TOOL.directionWiggleDecay,
      -PLAYBACK_TOOL.directionWiggleDeg,
      PLAYBACK_TOOL.directionWiggleDeg
    );

    const idleWobble = Math.sin(now / 180) * PLAYBACK_TOOL.idleWobbleDeg;
    const tinyHandJitter = moving
      ? stableNoise(`${Math.floor(now / 120)}-${tip.x}-${tip.y}`) * .65
      : 0;

    const angle =
      PLAYBACK_TOOL.baseRotationDeg +
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

    const last = ps.vaporTrail[ps.vaporTrail.length - 1];

    if (last) {
      const dx = tip.x - last.x;
      const dy = tip.y - last.y;
      if (Math.hypot(dx, dy) < 5) {
        return;
      }
    }

    ps.vaporTrail.push({
      x: tip.x + stableNoise(`vap-x-${now}`) * 4,
      y: tip.y + stableNoise(`vap-y-${now}`) * 4,
      born: now,
      life: 520 + Math.random() * 260,
      radius: 7 + Math.random() * 13
    });

    if (ps.vaporTrail.length > 54) {
      ps.vaporTrail.splice(0, ps.vaporTrail.length - 54);
    }
  }

  function drawVaporTrail(ps, now) {
    if (!ps || !Array.isArray(ps.vaporTrail)) return;

    const c = ps.c;
    const alive = [];

    c.save();
    c.globalCompositeOperation = "lighter";

    for (const puff of ps.vaporTrail) {
      const age = now - puff.born;
      const t = clamp(age / puff.life, 0, 1);

      if (t >= 1) continue;

      alive.push(puff);

      const alpha = (1 - t) * .18;
      const radius = puff.radius * (1 + t * 1.7);
      const driftY = -18 * t;
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

    const usableH = fontSize * 1.04;
    const usableW = Math.max(fontSize * .14, cellW * .88);
    const scale = Math.min(
      usableW / Math.max(.04, glyphBounds.width),
      usableH / Math.max(.04, glyphBounds.height)
    );

    const drawW = glyphBounds.width * scale;
    const drawH = glyphBounds.height * scale;
    const baseX = x + (cellW - drawW) / 2 - glyphBounds.minX * scale;
    const baseY = baselineY - usableH * .80 + (usableH - drawH) / 2 - glyphBounds.minY * scale;

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

  function stopPlayback(){
    if (playbackState){
      hidePlaybackTool(playbackState);
    }

    if (playbackRaf){
      cancelAnimationFrame(playbackRaf);
      playbackRaf = 0;
    }

    playbackState = null;
  }

  function drawRemixPreview(){
    const canvas = document.getElementById("ghostRemixCanvas");
    const preview = document.getElementById("ghostRemixPreview");
    if (!canvas || !preview) return;

    const rect = preview.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    drawCompleteText(c, rect.width, rect.height, state.remix);
  }

  async function markVersePracticed(){
    const verseId = ctx.verseId;
    if (!verseId) return { ok: false };

    if (typeof bridge().markVersePracticed === "function"){
      try {
        return bridge().markVersePracticed({ verseId });
      } catch (err){
        console.warn("Ghost Writer bridge markVersePracticed failed; falling back.", err);
      }
    }

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
      console.warn("Ghost Writer could not mark verse as practiced", err);
      return { ok: false };
    }
  }

  function fitGuideCharacter(){
    const guide = document.getElementById("ghostGuideText");
    const wrap = document.getElementById("ghostDrawWrap");
    if (!guide || !wrap) return;

    const char = currentChar();
    const rect = wrap.getBoundingClientRect();
    const box = Math.max(1, Math.min(rect.width, rect.height));

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
    const targetW = box * (symbol ? (skinnySymbol ? .42 : .68) : .86);
    const targetH = box * (symbol ? .76 : .88);
    const maxSize = box * (symbol ? 1.18 : 1.28);
    const minSize = box * .32;

    let low = minSize;
    let high = maxSize;
    let best = minSize;

    for (let i = 0; i < 14; i += 1){
      const mid = (low + high) / 2;
      probe.style.fontSize = `${mid}px`;
      const w = probe.offsetWidth || 1;
      const h = probe.offsetHeight || 1;

      if (w <= targetW && h <= targetH){
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    document.body.removeChild(probe);
    guide.style.fontSize = `${Math.round(best)}px`;
  }

  function clearGuideTimer(){
    if (guideTimer){
      clearTimeout(guideTimer);
      guideTimer = null;
    }
  }

  window.addEventListener("resize", () => {
    if (state.screen === "remix") drawRemixPreview();
    if (state.screen === "training") fitGuideCharacter();
  });

  async function boot(){
    try {
      ctx = await bridge().getVerseContext?.() || ctx;
    } catch (err){
      console.warn("Ghost Writer could not load verse context", err);
    }

    buildFullText();
    renderIntro();
  }

  boot();
})();
