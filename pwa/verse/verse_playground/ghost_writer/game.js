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

  const REMIX_PRESETS = {
    ghost: {
      label: "Ghost",
      cardClass: "",
      background: "#050509",
      ink: "#ffffff",
      shadow: "rgba(255,255,255,.32)",
      lineCap: "round"
    },
    chalkboard: {
      label: "Chalkboard",
      cardClass: "is-chalkboard",
      background: "#15352d",
      ink: "#f4fff4",
      shadow: "rgba(255,255,255,.20)",
      lineCap: "round"
    },
    crayon: {
      label: "Crayon",
      cardClass: "is-crayon",
      background: "#fff3d4",
      ink: "#5136a3",
      shadow: "rgba(81,54,163,.10)",
      lineCap: "round"
    }
  };

  const SPEEDS = {
    slow: { label: "Slow", multiplier: 1.45 },
    normal: { label: "Normal", multiplier: 1 },
    fast: { label: "Fast", multiplier: .62 }
  };

  const THICKNESS = {
    thin: { label: "Thin", multiplier: .78 },
    normal: { label: "Normal", multiplier: 1 },
    thick: { label: "Thick", multiplier: 1.35 }
  };

  const app = document.getElementById("app");

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
      style: "ghost",
      speed: "normal",
      thickness: "normal",
      jitter: "off",
      wobble: "off"
    };

    renderTraining();
  }

  function rootHtml(inner, { wide = false, menu = true } = {}){
    return `
      <div class="ghost-writer-root">
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
    const copied = (strokes || [])
      .map((stroke) => (stroke || []).map((p) => ({
        x: clamp(p.x, 0, 1),
        y: clamp(p.y, 0, 1),
        t: Number(p.t) || 0
      })))
      .filter((stroke) => stroke.length);

    const bounds = computeBounds(copied);

    return {
      char,
      strokes: copied,
      bounds,
      widthRatio: clamp(bounds.width || .24, .10, .92),
      heightRatio: clamp(bounds.height || .24, .10, .92)
    };
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

    const preset = REMIX_PRESETS[options.style] || REMIX_PRESETS.ghost;

    app.innerHTML = `
      <div class="ghost-playback-root">
        <div class="ghost-playback-card ${escapeHtml(preset.cardClass)}" id="ghostPlaybackCard">
          <canvas id="ghostPlaybackCanvas" aria-label="Ghost writing playback"></canvas>
          <div class="ghost-playback-label">Ghost writing...</div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("ghostPlaybackCanvas");
    const card = document.getElementById("ghostPlaybackCard");
    if (!canvas || !card) return;

    requestAnimationFrame(() => {
      startPlayback(canvas, card, options, async () => {
        if (markPractice && !state.practiceMarked){
          state.practiceMarked = true;
          await markVersePracticed();
        }

        if (returnTo === "remix") renderRemix();
      });
    });
  }

  function renderRemix(){
    stopPlayback();
    clearGuideTimer();
    state.screen = "remix";

    const preset = REMIX_PRESETS[state.remix.style] || REMIX_PRESETS.ghost;

    app.innerHTML = rootHtml(`
      <div class="ghost-card ghost-remix-card">
        <div class="ghost-remix-title">Remix Your Ghost Verse</div>

        <div class="ghost-remix-preview ${escapeHtml(preset.cardClass)}" id="ghostRemixPreview">
          <canvas id="ghostRemixCanvas" aria-label="Ghost Writer preview"></canvas>
        </div>

        <div class="ghost-options">
          ${selectOptionHtml("ghostStyleSelect", "Style", state.remix.style, REMIX_PRESETS)}
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
    `, { menu: true, wide: true });

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

  function wireRemixControls(){
    const style = document.getElementById("ghostStyleSelect");
    const speed = document.getElementById("ghostSpeedSelect");
    const thickness = document.getElementById("ghostThicknessSelect");
    const jitter = document.getElementById("ghostJitterSelect");
    const wobble = document.getElementById("ghostWobbleSelect");

    const update = () => {
      state.remix.style = style?.value || state.remix.style;
      state.remix.speed = speed?.value || state.remix.speed;
      state.remix.thickness = thickness?.value || state.remix.thickness;
      state.remix.jitter = jitter?.value || state.remix.jitter;
      state.remix.wobble = wobble?.value || state.remix.wobble;

      const preview = document.getElementById("ghostRemixPreview");
      if (preview){
        preview.classList.remove("is-chalkboard", "is-crayon");
        const preset = REMIX_PRESETS[state.remix.style] || REMIX_PRESETS.ghost;
        if (preset.cardClass) preview.classList.add(preset.cardClass);
      }
      drawRemixPreview();
    };

    [style, speed, thickness, jitter, wobble].forEach((el) => {
      if (el) el.onchange = update;
    });

    document.getElementById("ghostReplayBtn")?.addEventListener("click", () => {
      renderPlayback({ options: { ...state.remix }, markPractice: false, returnTo: "remix" });
    });

    document.getElementById("ghostAgainBtn")?.addEventListener("click", () => startRun(selectedMode));
    document.getElementById("ghostBackBtn")?.addEventListener("click", () => bridge().exitGame?.());
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
    const maxWidth = safeWidth * .88;
    const maxHeight = safeHeight * .84;

    for (let fontSize = Math.min(54, safeWidth / 12); fontSize >= 16; fontSize -= 2){
      const layout = layoutForFontSize(text, fontSize, maxWidth, maxHeight, safeWidth, safeHeight);
      if (layout.height <= maxHeight){
        return layout;
      }
    }

    return layoutForFontSize(text, 16, maxWidth, maxHeight, safeWidth, safeHeight);
  }

  function layoutForFontSize(text, fontSize, maxWidth, maxHeight, canvasWidth, canvasHeight){
    const lineHeight = fontSize * 1.32;
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
      const w = /\s/.test(char) ? fontSize * widthUnits : fontSize * widthUnits;

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

      const tokenWidth = Array.from(token).reduce((sum, char) => sum + fontSize * glyphWidthUnits(char), 0);

      if (line.length && lineWidth + tokenWidth > maxWidth){
        pushLine();
      }

      for (const char of Array.from(token)){
        addChar(char);
      }
    }

    if (line.length || !lines.length) pushLine();

    const totalHeight = lines.length * lineHeight;
    let y = Math.max(fontSize * .9, (canvasHeight - totalHeight) / 2 + fontSize * .72);

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

    return {
      placements,
      fontSize,
      lineHeight,
      height: totalHeight,
      width: Math.max(...lines.map((l) => l.width), 0)
    };
  }

  function drawGlyph(c, glyph, x, baselineY, cellW, fontSize, options = {}, partial = 1){
    if (!glyph || !glyph.strokes || !glyph.strokes.length) return;

    const preset = REMIX_PRESETS[options.style] || REMIX_PRESETS.ghost;
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

    c.strokeStyle = preset.ink;
    c.fillStyle = preset.ink;
    c.lineWidth = Math.max(1.8, fontSize * .075 * thickness.multiplier);
    c.lineCap = preset.lineCap || "round";
    c.lineJoin = "round";
    c.shadowColor = preset.shadow || "transparent";
    c.shadowBlur = options.style === "ghost" ? fontSize * .16 : fontSize * .04;

    const totalPieces = countStrokePieces(glyph.strokes);
    const piecesToDraw = Math.max(0, totalPieces * clamp(partial, 0, 1));
    let drawnPieces = 0;

    for (const stroke of glyph.strokes){
      if (!stroke.length) continue;

      if (stroke.length === 1){
        if (drawnPieces <= piecesToDraw){
          const p = stroke[0];
          c.beginPath();
          c.arc(baseX + p.x * scale, baseY + p.y * scale, c.lineWidth * 1.08, 0, Math.PI * 2);
          c.fill();
        }
        drawnPieces += 1;
        continue;
      }

      c.beginPath();
      c.moveTo(baseX + stroke[0].x * scale, baseY + stroke[0].y * scale);

      for (let i = 1; i < stroke.length; i += 1){
        if (drawnPieces + 1 > piecesToDraw){
          const remain = piecesToDraw - drawnPieces;
          if (remain > 0){
            const a = stroke[i - 1];
            const b = stroke[i];
            const x1 = a.x + (b.x - a.x) * remain;
            const y1 = a.y + (b.y - a.y) * remain;
            c.lineTo(baseX + x1 * scale, baseY + y1 * scale);
          }
          break;
        }

        c.lineTo(baseX + stroke[i].x * scale, baseY + stroke[i].y * scale);
        drawnPieces += 1;
      }

      c.stroke();

      if (drawnPieces >= piecesToDraw) break;
    }

    c.restore();
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

  function clearPlaybackCanvas(c, width, height, options){
    const preset = REMIX_PRESETS[options.style] || REMIX_PRESETS.ghost;
    c.save();
    c.fillStyle = preset.background;
    c.fillRect(0, 0, width, height);

    if (options.style === "chalkboard"){
      c.globalAlpha = .08;
      c.strokeStyle = "#ffffff";
      for (let y = 20; y < height; y += 34){
        c.beginPath();
        c.moveTo(0, y + stableNoise(`chalk-${y}`) * 4);
        c.lineTo(width, y + stableNoise(`chalk2-${y}`) * 4);
        c.stroke();
      }
    }

    if (options.style === "crayon"){
      c.globalAlpha = .10;
      c.fillStyle = "#7a5120";
      for (let x = 0; x < width; x += 26){
        c.fillRect(x, 0, 1, height);
      }
      for (let y = 0; y < height; y += 26){
        c.fillRect(0, y, width, 1);
      }
    }

    c.restore();
  }

  function drawCompleteText(c, width, height, options){
    const layout = makeLayout(width, height);
    clearPlaybackCanvas(c, width, height, options);

    for (const item of layout.placements){
      if (/\s/.test(item.char)) continue;
      drawGlyph(c, getGlyph(item.char), item.x, item.y, item.w, item.fontSize, options, 1);
    }
  }

  function startPlayback(canvas, card, options, onDone){
    const rect = card.getBoundingClientRect();
    const c = setupCanvasForDpr(canvas, rect.width, rect.height);
    const layout = makeLayout(rect.width, rect.height);
    const placements = layout.placements.filter((p) => !/\s/.test(p.char));
    const speed = SPEEDS[options.speed] || SPEEDS.normal;

    playbackState = {
      running: true,
      c,
      width: rect.width,
      height: rect.height,
      options,
      speed,
      placements,
      index: 0,
      charStart: performance.now(),
      onDone
    };

    clearPlaybackCanvas(c, rect.width, rect.height, options);
    playbackRaf = requestAnimationFrame(playbackFrame);
  }

  function playbackFrame(now){
    const ps = playbackState;
    if (!ps || !ps.running) return;

    const placements = ps.placements;

    if (ps.index >= placements.length){
      drawCompleteText(ps.c, ps.width, ps.height, ps.options);
      const done = ps.onDone;
      playbackState = null;
      playbackRaf = 0;
      if (typeof done === "function") done();
      return;
    }

    const current = placements[ps.index];
    const glyph = getGlyph(current.char);
    const pieces = glyph ? countStrokePieces(glyph.strokes) : 1;
    const duration = clamp((180 + pieces * 26) * (ps.speed?.multiplier || 1), 120, 850);
    const progress = clamp((now - ps.charStart) / duration, 0, 1);

    clearPlaybackCanvas(ps.c, ps.width, ps.height, ps.options);

    for (let i = 0; i < ps.index; i += 1){
      const item = placements[i];
      drawGlyph(ps.c, getGlyph(item.char), item.x, item.y, item.w, item.fontSize, ps.options, 1);
    }

    drawGlyph(ps.c, glyph, current.x, current.y, current.w, current.fontSize, ps.options, progress);

    if (progress >= 1){
      ps.index += 1;
      ps.charStart = now;
    }

    playbackRaf = requestAnimationFrame(playbackFrame);
  }

  function stopPlayback(){
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

  function clearGuideTimer(){
    if (guideTimer){
      clearTimeout(guideTimer);
      guideTimer = null;
    }
  }

  window.addEventListener("resize", () => {
    if (state.screen === "remix") drawRemixPreview();
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
