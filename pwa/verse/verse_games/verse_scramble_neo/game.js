(async function(){
  const app = document.getElementById("app");
  if (app) app.classList.add("vm-shell");

  const ctx = await window.VerseGameBridge.getVerseContext();
  const GAME_ID = "scramble";

  const GAME_THEME = {
    bg: "#7f66c6",
    accent: "#7f66c6"
  };

  const BUILD_AREA = "compact";
  const HELP_OVERLAY_ID = "vsnHelpOverlay";

  const MAGNET_COLORS = [
    "#fc171a",
    "#fc7e0e",
    "#feca02",
    "#74d025",
    "#007df4",
    "#8956d9"
  ];

  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const DIGITS = "0123456789".split("");

  let selectedMode = null;
  let muted = false;

  const shuffle = window.VerseGameShell.shuffle;

  const state = {
    screen: "intro",
    words: [],
    segments: [],
    targetGroups: [],
    targetGroupIndex: 0,
    metaIndices: new Set(),
    progressIndex: 0,
    buildSizeClass: "is-normal",
    bookLabel: "",
    referenceLabel: "",
    referenceMeta: null,
    currentTarget: null,
    tiles: [],
    letterIndex: 0,
    tileSeed: 0,
    busy: false,
    completed: false,
    menuOpen: false,
    helpOpen: false,
    helpBackMode: false,
    startTime: 0,
    completionResult: null,
    correctLetters: 0,
    wrongTaps: 0,
    targetsCompleted: 0,
    streak: 0,
    bestStreak: 0,
    showingInstruction: false,
    instructionToken: 0
  };

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function initVerseData(){
    const parsed = window.VerseGameShell.parseReferenceParts(ctx.verseRef, ctx.translation, ctx.verseId);
    const buildData = window.VerseGameShell.buildVerseSegments({
      verseText: ctx.verseText || "",
      book: parsed.book,
      reference: parsed.reference,
      buildArea: BUILD_AREA
    });

    state.words = buildData.words;
    state.segments = buildData.segments;
    state.metaIndices = buildData.metaIndices;
    state.bookLabel = buildData.bookLabel;
    state.referenceLabel = buildData.referenceLabel;
    state.referenceMeta = parsed;
    state.buildSizeClass = buildData.buildSizeClass;
    state.progressIndex = 0;
    state.targetGroups = buildTargetGroups();
    state.targetGroupIndex = 0;
    state.currentTarget = null;
    state.tiles = [];
    state.letterIndex = 0;
    state.tileSeed = 0;
    state.busy = false;
    state.completed = false;
    state.completionResult = null;
    state.correctLetters = 0;
    state.wrongTaps = 0;
    state.targetsCompleted = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.showingInstruction = false;
    state.instructionToken += 1;
  }

  function currentPhase(index = state.progressIndex){
    return window.VerseGameShell.getPhaseForProgress({
      progressIndex: index,
      wordCount: state.words.length,
      totalSegments: state.segments.length,
      bookLabel: state.bookLabel,
      referenceLabel: state.referenceLabel
    });
  }

  function isPlayableChar(ch, kind){
    if (!ch) return false;
    if (kind === "reference") return /[0-9]/.test(ch);
    if (kind === "book") return /[A-Za-z0-9]/.test(ch);
    return /[A-Za-z]/.test(ch);
  }

  function getPlayableText(displayText, kind){
    return Array.from(displayText)
      .filter(ch => isPlayableChar(ch, kind))
      .join("")
      .toUpperCase();
  }

  function displayTextForSegments(startIndex, count){
    return state.segments.slice(startIndex, startIndex + count).join(" ");
  }

  function targetKindForPhase(phase){
    if (phase === "book") return "book";
    if (phase === "reference") return "reference";
    return "word";
  }


  function isVerseWordIndex(index) {
    return currentPhase(index) === "words";
  }

  function playableLetterCountAt(index) {
    return getPlayableText(state.segments[index] || "", "word").length;
  }

  function isShortVerseWord(index) {
    const count = playableLetterCountAt(index);
    return count > 0 && count <= 2;
  }

  function endsWithStrongBreak(text) {
    return /[.!?;:]["'”’)\]]*$/.test(String(text || "").trim());
  }

  function groupCanAcceptPreviousShort(group, index) {
    return group &&
      group.startIndex + group.segmentCount === index &&
      isVerseWordIndex(group.startIndex) &&
      group.segmentCount < 2;
  }

  function buildTargetGroups() {
    const groups = [];
    let index = 0;

    while (index < state.segments.length) {
      const phase = currentPhase(index);

      if (phase !== "words") {
        groups.push({ startIndex: index, segmentCount: 1 });
        index += 1;
        continue;
      }

      if (isShortVerseWord(index)) {
        const currentText = state.segments[index] || "";
        const nextIndex = index + 1;
        const hasNextVerseWord = isVerseWordIndex(nextIndex);
        const shouldPairForward = hasNextVerseWord && !endsWithStrongBreak(currentText);

        if (shouldPairForward) {
          groups.push({ startIndex: index, segmentCount: 2 });
          index += 2;
          continue;
        }

        const previousGroup = groups[groups.length - 1];
        if (groupCanAcceptPreviousShort(previousGroup, index)) {
          previousGroup.segmentCount += 1;
          index += 1;
          continue;
        }
      }

      groups.push({ startIndex: index, segmentCount: 1 });
      index += 1;
    }

    return groups;
  }

  function makeTarget() {
    const group = state.targetGroups[state.targetGroupIndex] || {
      startIndex: state.progressIndex,
      segmentCount: 1
    };

    const phase = currentPhase(group.startIndex);
    const kind = targetKindForPhase(phase);
    const displayText = displayTextForSegments(group.startIndex, group.segmentCount);
    const playableText = getPlayableText(displayText, kind);

    return {
      startIndex: group.startIndex,
      segmentCount: group.segmentCount,
      phase,
      kind,
      displayText,
      playableText
    };
  }

  function allowedDecoyPool(target){
    const targetChars = new Set(target.playableText.split(""));
    const basePool = target.kind === "reference" ? DIGITS : LETTERS;
    return basePool.filter(ch => !targetChars.has(ch));
  }

  function extraCountForMode(target){
    if (selectedMode === "easy") return 0;
    if (selectedMode === "medium") return 3;
    return 80;
  }

  function makeTilesForTarget(target){
    const targetTiles = target.playableText.split("").map(ch => ({
      id: `vsn_tile_${state.tileSeed++}`,
      char: ch,
      source: "target"
    }));

    const pool = allowedDecoyPool(target);
    const extraCount = extraCountForMode(target);
    const decoys = [];
    for (let i = 0; i < extraCount && pool.length; i++){
      decoys.push({
        id: `vsn_tile_${state.tileSeed++}`,
        char: pool[Math.floor(Math.random() * pool.length)],
        source: "decoy"
      });
    }

    return shuffle(targetTiles.concat(decoys)).map((tile, index) => ({
      ...tile,
      color: MAGNET_COLORS[index % MAGNET_COLORS.length],
      rotation: Math.round(Math.random() * 34 - 17)
    }));
  }

  function prepareCurrentTarget(){
    state.currentTarget = makeTarget();
    state.letterIndex = 0;
    state.tiles = makeTilesForTarget(state.currentTarget);
  }

  function setScreen(screen){
    state.screen = screen;
    render();
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

  function fitBuildText(){
    requestAnimationFrame(() => {
      window.VerseGameShell.fitBuildTextOnce({
        buildEl: document.getElementById("vsnBuild"),
        textEl: document.getElementById("vsnBuildText"),
        buildArea: BUILD_AREA
      });
    });
  }

  function fitTargetText(){
    requestAnimationFrame(() => {
      const note = document.getElementById("vsnTargetNote");
      const text = document.getElementById("vsnTargetText");
      if (!note || !text) return;

      text.style.fontSize = "";
      const maxPx = Number(getComputedStyle(text).fontSize.replace("px", "")) || 42;
      const minPx = 18;
      let size = maxPx;
      const maxWidth = note.clientWidth - 28;
      while (size > minPx && text.scrollWidth > maxWidth){
        size -= 1;
        text.style.fontSize = `${size}px`;
      }
    });
  }

  function renderTargetHtml(){
    const target = state.currentTarget;
    if (!target) return "";

    let playableIndex = 0;
    return Array.from(target.displayText).map(ch => {
      if (ch === " ") return `<span class="vsn-target-space"> </span>`;

      if (!isPlayableChar(ch, target.kind)){
        return `<span class="vsn-target-static">${escapeHtml(ch)}</span>`;
      }

      const isRevealed = playableIndex < state.letterIndex;
      const html = `<span class="vsn-target-char ${isRevealed ? "is-revealed" : ""}" data-target-index="${playableIndex}">${escapeHtml(ch.toUpperCase())}</span>`;
      playableIndex += 1;
      return html;
    }).join("");
  }

  function updateTargetReveal(){
    const target = state.currentTarget;
    if (!target) return;
    document.querySelectorAll("[data-target-index]").forEach(el => {
      const index = Number(el.getAttribute("data-target-index"));
      el.classList.toggle("is-revealed", index < state.letterIndex);
    });
  }

  function updateBuildArea(){
    const buildText = document.getElementById("vsnBuildText");
    if (!buildText) return;
    const buildRender = renderBuildText();
    buildText.className = buildRender.className;
    buildText.innerHTML = buildRender.html;
    fitBuildText();
  }

  function renderIntro(){
    window.VerseGameShell.renderTitleScreen({
      app,
      title: "Verse Scramble",
      icon: "🔄",
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
        state.showingInstruction = true;
        state.instructionToken += 1;
        state.busy = true;
        state.currentTarget = null;
        state.tiles = [];
        setScreen("game");
      }
    });
  }


  function introLetterHtml(ch, index){
    const color = MAGNET_COLORS[index % MAGNET_COLORS.length];
    const rotation = Math.round(Math.random() * 20 - 10);
    const delay = Math.min(520, index * 32);
    return `<span class="vsn-intro-letter" style="--magnet-color:${color}; --magnet-rot:${rotation}deg; --intro-delay:${delay}ms;">${escapeHtml(ch)}</span>`;
  }

  function renderInstructionHtml(){
    const lines = ["TAP THE", "LETTERS", "IN ORDER"];
    let letterIndex = 0;
    return `
      <div class="vsn-instruction-message" id="vsnInstructionMessage" aria-label="Tap the letters in order">
        ${lines.map(line => `
          <div class="vsn-instruction-line">
            ${Array.from(line).map(ch => {
              if (ch === " ") return `<span class="vsn-intro-space"></span>`;
              return introLetterHtml(ch, letterIndex++);
            }).join("")}
          </div>
        `).join("")}
      </div>`;
  }

  async function runInstructionIntro(token){
    await sleep(3400);
    if (state.screen !== "game" || !state.showingInstruction || token !== state.instructionToken) return;
    const msg = document.getElementById("vsnInstructionMessage");
    if (msg){
      msg.classList.add("is-exiting");
      await sleep(430);
    }
    if (state.screen !== "game" || token !== state.instructionToken) return;
    state.showingInstruction = false;
    state.busy = false;
    prepareCurrentTarget();
    render();
  }

  function renderGame(){
    const buildRender = renderBuildText();
    app.innerHTML = `
      <div class="vsn-root vsn-mode-${selectedMode || "easy"}">
        <div class="vsn-stage">
          <div class="vsn-build-wrap">
            <div class="vsn-build vm-build vm-build--${BUILD_AREA}" id="vsnBuild">
              <div class="${buildRender.className}" id="vsnBuildText">${buildRender.html}</div>
            </div>
          </div>

          <div class="vsn-game-wrap">
            <div class="vsn-fridge-board" id="vsnBoard">
              <button class="vsn-menu-pill no-zoom" id="vsnMenuPill" aria-label="Game Menu" type="button">☰</button>

              <div class="vsn-target-note ${state.showingInstruction ? "is-blank" : ""}" id="vsnTargetNote" aria-live="polite">
                <div class="vsn-target-text" id="vsnTargetText">${state.showingInstruction ? "" : renderTargetHtml()}</div>
              </div>

              <div class="vsn-letter-field" id="vsnLetterField" aria-label="Scrambled magnet letters">
                ${state.showingInstruction ? renderInstructionHtml() : state.tiles.map(tile => `
                  <button
                    class="vsn-magnet no-zoom is-spawning"
                    type="button"
                    id="${tile.id}"
                    data-tile-id="${tile.id}"
                    data-char="${escapeHtml(tile.char)}"
                    style="--magnet-color:${tile.color}; --magnet-rot:${tile.rotation}deg;"
                    aria-label="Letter ${escapeHtml(tile.char)}"
                  >${escapeHtml(tile.char)}</button>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
        ${renderHelpOverlay()}
        ${renderGameMenuOverlay()}
      </div>`;

    wireGameScreen();
    fitBuildText();
    fitTargetText();

    if (state.showingInstruction){
      const token = state.instructionToken;
      runInstructionIntro(token);
    } else {
      requestAnimationFrame(layoutMagnets);
    }
  }

  function renderEnd(){
    window.VerseGameShell.renderCompleteScreen({
      app,
      gameIcon: "🧩",
      mode: selectedMode,
      verseId: ctx.verseId,
      gameId: GAME_ID,
      completion: state.completionResult,
      gameMessage: `${state.targetsCompleted} targets solved · ${state.wrongTaps} wrong taps · Best streak: ${state.bestStreak}`,
      theme: GAME_THEME,
      backLabel: "Back to Practice Games",
      onPlayAgain: () => setScreen("mode"),
      onMoreGames: () => window.VerseGameBridge.exitGame(),
      onChangeVerse: () => window.VerseGameBridge.returnToTitle()
    });
  }

  function helpHtml(){
    return `
      Spell each target by tapping the scrambled magnet letters in order.<br><br>
      Easy: only the letters you need.<br>
      Medium: the target letters plus 3 decoy letters.<br>
      Hard: a fridge full of extra decoy letters.<br><br>
      Punctuation and spaces appear in the target, but you only tap letters and numbers.
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
    document.querySelectorAll("[data-tile-id]").forEach(btn => {
      btn.addEventListener("click", () => handleTileTap(btn));
      btn.addEventListener("pointerdown", () => btn.classList.add("is-pressed"));
      btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
      btn.addEventListener("pointercancel", () => btn.classList.remove("is-pressed"));
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

  function tileObjectForButton(btn){
    const tileId = btn && btn.dataset ? btn.dataset.tileId : "";
    return state.tiles.find(tile => tile.id === tileId);
  }

  function expectedChar(){
    const target = state.currentTarget;
    if (!target) return "";
    return target.playableText[state.letterIndex] || "";
  }

  function shakeElement(el){
    if (!el) return;
    el.classList.remove("vsn-shake");
    void el.offsetWidth;
    el.classList.add("vsn-shake");
  }

  async function handleTileTap(btn){
    if (state.busy || state.menuOpen || state.helpOpen || state.completed) return;

    const tile = tileObjectForButton(btn);
    const expected = expectedChar();
    if (!tile || !expected || btn.classList.contains("is-used")) return;

    if (tile.char === expected){
      state.busy = true;
      state.correctLetters += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.letterIndex += 1;

      btn.classList.add("is-correct", "is-used");
      btn.disabled = true;
      updateTargetReveal();

      await sleep(170);
      btn.remove();

      if (state.letterIndex >= state.currentTarget.playableText.length){
        await completeCurrentTarget();
        return;
      }

      state.busy = false;
      return;
    }

    state.wrongTaps += 1;
    state.streak = 0;
    shakeElement(btn);
    shakeElement(document.getElementById("vsnBuild"));
  }

  async function completeCurrentTarget(){
    const note = document.getElementById("vsnTargetNote");
    if (note){
      note.classList.remove("is-complete");
      void note.offsetWidth;
      note.classList.add("is-complete");
    }

    await sleep(260);

    state.targetGroupIndex += 1;
    state.progressIndex = state.currentTarget.startIndex + state.currentTarget.segmentCount;
    state.targetsCompleted += 1;
    updateBuildArea();

    if (state.progressIndex >= state.segments.length){
      state.completed = true;
      state.completionResult = await window.VerseGameBridge.completeGameRun({
        verseId: ctx.verseId,
        gameId: GAME_ID,
        mode: selectedMode,
        startedAt: state.startTime,
        stats: {
          correctLetters: state.correctLetters,
          wrongTaps: state.wrongTaps,
          targetsCompleted: state.targetsCompleted,
          bestStreak: state.bestStreak
        }
      });
      state.busy = false;
      setScreen("end");
      return;
    }

    prepareCurrentTarget();
    state.busy = false;
    render();
  }

  function layoutMagnets(){
    const field = document.getElementById("vsnLetterField");
    if (!field) return;

    const rect = field.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const buttons = Array.from(field.querySelectorAll(".vsn-magnet"));
    const byId = new Map(buttons.map(btn => [btn.dataset.tileId, btn]));

    const targetTiles = state.tiles.filter(tile => tile.source === "target");
    const decoyTiles = state.tiles.filter(tile => tile.source === "decoy");
    const ordered = shuffle(targetTiles).concat(shuffle(decoyTiles));
    const placed = [];
    const isHard = selectedMode === "hard";

    for (const tile of ordered){
      const btn = byId.get(tile.id);
      if (!btn) continue;

      btn.style.left = "0px";
      btn.style.top = "0px";
      btn.style.visibility = "hidden";
      btn.classList.remove("is-hidden-decoy");

      const bw = btn.offsetWidth || 54;
      const bh = btn.offsetHeight || 54;
      const gap = Math.max(4, Math.min(10, rect.width * 0.012));
      const maxX = Math.max(0, rect.width - bw - 4);
      const maxY = Math.max(0, rect.height - bh - 4);
      const tries = tile.source === "target" ? 360 : (isHard ? 90 : 180);
      let chosen = null;

      for (let i = 0; i < tries; i++){
        const x = 2 + Math.random() * Math.max(1, maxX - 2);
        const y = 2 + Math.random() * Math.max(1, maxY - 2);
        const candidate = { x, y, w: bw, h: bh };
        const overlaps = placed.some(p => !(
          candidate.x + candidate.w + gap < p.x ||
          candidate.x > p.x + p.w + gap ||
          candidate.y + candidate.h + gap < p.y ||
          candidate.y > p.y + p.h + gap
        ));
        if (!overlaps){
          chosen = candidate;
          break;
        }
      }

      if (!chosen){
        if (tile.source === "decoy"){
          btn.classList.add("is-hidden-decoy");
          btn.style.display = "none";
          continue;
        }
        chosen = findFallbackSlot(placed, rect, bw, bh, gap);
      }

      placed.push(chosen);
      btn.style.left = `${chosen.x}px`;
      btn.style.top = `${chosen.y}px`;
      btn.style.visibility = "visible";
      btn.style.setProperty("--spawn-delay", `${Math.min(360, placed.length * 22)}ms`);
    }
  }

  function findFallbackSlot(placed, rect, bw, bh, gap){
    const stepX = Math.max(8, bw * 0.72);
    const stepY = Math.max(8, bh * 0.72);
    for (let y = 2; y <= Math.max(2, rect.height - bh - 2); y += stepY){
      for (let x = 2; x <= Math.max(2, rect.width - bw - 2); x += stepX){
        const candidate = { x, y, w: bw, h: bh };
        const overlaps = placed.some(p => !(
          candidate.x + candidate.w + gap < p.x ||
          candidate.x > p.x + p.w + gap ||
          candidate.y + candidate.h + gap < p.y ||
          candidate.y > p.y + p.h + gap
        ));
        if (!overlaps) return candidate;
      }
    }
    return {
      x: Math.max(2, Math.random() * Math.max(1, rect.width - bw - 4)),
      y: Math.max(2, Math.random() * Math.max(1, rect.height - bh - 4)),
      w: bw,
      h: bh
    };
  }

  function render(){
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "mode") return renderMode();
    if (state.screen === "game") return renderGame();
    if (state.screen === "end") return renderEnd();
  }

  window.addEventListener("resize", () => {
    if (state.screen === "game"){
      fitTargetText();
      layoutMagnets();
    }
  });

  setScreen("intro");
})();
