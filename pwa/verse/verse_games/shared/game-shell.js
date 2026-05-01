(function(){
  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function styleVarsHtml(options = {}){
    const vars = [];

    if (options.bg) vars.push(`--vm-game-bg:${options.bg}`);
    if (options.accent) vars.push(`--vm-game-accent:${options.accent}`);
    if (options.helpTitleBg) vars.push(`--vm-game-help-title-bg:${options.helpTitleBg}`);
    if (options.helpTitleColor) vars.push(`--vm-game-help-title-color:${options.helpTitleColor}`);
    if (options.helpCloseBg) vars.push(`--vm-game-help-close-bg:${options.helpCloseBg}`);
    if (options.helpCloseColor) vars.push(`--vm-game-help-close-color:${options.helpCloseColor}`);

    return vars.length ? ` style="${vars.join("; ")};"` : "";
  }

  const SHARED_FUN_DECOYS = Object.freeze([
    "taco",
    "banana",
    "penguin",
    "cupcake",
    "pickle",
    "waffle",
    "rocket",
    "robot",
    "balloon",
    "otter",
    "pretzel",
    "pancake",
    "donut",
    "cookie",
    "muffin",
    "noodle",
    "pizza",
    "popcorn",
    "jellybean",
    "sloth",
    "blueberry",
    "melon",
    "coconut",
    "burrito",
    "sundae",
    "snowman",
    "rainbow",
    "unicorn",
    "dinosaur",
    "kangaroo",
    "hamster",
    "kitten",
    "puppy",
    "monkey",
    "zebra",
    "narwhal",
    "pirate",
    "scooter",
    "backpack",
    "firetruck",
    "yo-yo",
    "treasure",
    "volcano",
    "bubble",
    "bongo",
    "slipper",
    "meatball",
    "spaghetti",
    "burger",
    "brush",
    "glimmer",
    "wobble",
    "dazzle",
    "bloop",
    "pibble",
    "snorf"
  ]);

  const SHARED_BIBLE_BOOK_DECOYS = Object.freeze([
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalm",
    "Proverbs",
    "Isaiah",
    "Jeremiah",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "Galatians",
    "Ephesians",
    "Colossians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation"
  ]);

  function getFunDecoys(){
    return [...SHARED_FUN_DECOYS];
  }

  function getBibleBookDecoys(){
    return [...SHARED_BIBLE_BOOK_DECOYS];
  }

  function getBookDecoys(correctBook, count = 6){
    const correctNorm = normalizeWord(correctBook);
    const desiredCount = Math.max(0, Number(count) || 0);

    if (!desiredCount) return [];

    return shuffle(
      getBibleBookDecoys().filter((book) => normalizeWord(book) !== correctNorm)
    ).slice(0, desiredCount);
  }

  function getFunWordDecoys(correctWord, verseWords = [], count = 6){
    const correctNorm = normalizeWord(correctWord);
    const desiredCount = Math.max(0, Number(count) || 0);

    if (!desiredCount) return [];

    const verseWordSet = new Set(
      (Array.isArray(verseWords) ? verseWords : [])
        .map(normalizeWord)
        .filter(Boolean)
    );

    return shuffle(
      getFunDecoys().filter((word) => {
        const key = normalizeWord(word);
        if (!key) return false;
        if (key === correctNorm) return false;
        if (verseWordSet.has(key)) return false;
        return true;
      })
    ).slice(0, desiredCount);
  }

 function shuffle(array){
    const copy = Array.isArray(array) ? array.slice() : [];

    for (let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function clamp(value, min, max){
    const number = Number(value);
    const lower = Number(min);
    const upper = Number(max);

    if (!Number.isFinite(number)) return lower;
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return number;

    return Math.max(lower, Math.min(upper, number));
  }

  function capitalize(value){
    const text = String(value ?? "");
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function normalizeWord(value){
    return String(value ?? "")
      .trim()
      .replace(/[‘’]/g, "'")
      .toLowerCase()
      .replace(/^[^a-z0-9]+/gi, "")
      .replace(/[^a-z0-9]+$/gi, "")
      .replace(/[^a-z0-9']/gi, "");
  }

  function tokenizeVerseWords(text){
    const normalized = String(text ?? "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-");

    const words = [];
    const re = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?(?:,[0-9]{3})*/g;

    for (const match of normalized.matchAll(re)){
      const word = match[0];
      if (word) words.push(word);
    }

    return words;
  }

  function tokenizeVerseForBuild(text){
    const raw = String(text ?? "");
    const tokens = [];
    const re = /(\s+|[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)?(?:,[0-9]{3})*|[^\sA-Za-z0-9]+)/g;

    for (const part of raw.match(re) || []){
      if (/^\s+$/.test(part)){
        tokens.push({ kind: "space", text: part });
      } else if (/^[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)?(?:,[0-9]{3})*$/.test(part)){
        tokens.push({ kind: "word", text: part });
      } else {
        tokens.push({ kind: "punct", text: part });
      }
    }

    return tokens;
  }

  function extractWordEntries(tokens){
    return Array.isArray(tokens)
      ? tokens
          .filter((token) => token && token.kind === "word")
          .map((token) => ({ display: token.text }))
      : [];
  }

  function titleCaseBookFromSlug(slug){
    const smallWords = new Set(["of", "the"]);

    return String(slug ?? "")
      .replace(/\.json$/i, "")
      .split("_")
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        if (index > 0 && smallWords.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function stripTranslationFromReference(ref, translation){
    let raw = String(ref ?? "").trim();
    const trans = String(translation ?? "").trim();

    const knownTranslations = [
      "ESV", "NIV", "NLT", "KJV", "NKJV", "CSB", "HCSB", "NASB", "NASB95",
      "LSB", "AMP", "RSV", "NRSV", "NRSVUE", "NET", "MSG", "GW", "CEV",
      "GNT", "ERV", "ICB"
    ];

    const stripCode = (text, code) => {
      const escaped = String(code).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return String(text)
        .replace(new RegExp(`\\s*\\(${escaped}\\)\\s*$`, "i"), "")
        .replace(new RegExp(`\\s+${escaped}\\s*$`, "i"), "")
        .replace(new RegExp(`\\s*[-–—]\\s*${escaped}\\s*$`, "i"), "")
        .trim();
    };

    if (trans) raw = stripCode(raw, trans);
    for (const code of knownTranslations){
      raw = stripCode(raw, code);
    }

    return raw.trim();
  }

  function parseReferenceParts(ref, translation, verseId){
    const rawId = String(verseId ?? "")
      .trim()
      .replace(/\.json$/i, "")
      .replace(/[–—−]/g, "-");

    if (rawId){
      const parts = rawId.split("_").filter(Boolean);
      const nums = [];

      while (parts.length && /^\d+$/.test(parts[parts.length - 1])){
        nums.unshift(Number(parts.pop()));
      }

      if (parts.length && nums.length >= 2){
        const book = titleCaseBookFromSlug(parts.join("_"));
        const chapter = nums[0];
        const verse = nums[1];
        const verseEnd = nums.length >= 3 ? nums[2] : null;
        const reference = verseEnd ? `${chapter}:${verse}-${verseEnd}` : `${chapter}:${verse}`;

        return {
          book,
          chapter,
          verse,
          verseEnd,
          reference,
          display: `${book} ${reference}`
        };
      }
    }

    const rawRef = stripTranslationFromReference(ref, translation).replace(/[–—−]/g, "-");

    const match = rawRef.match(/^(.*?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?\s*$/);
    if (match){
      const book = match[1].trim();
      const chapter = Number(match[2]);
      const verse = Number(match[3]);
      const endChapter = match[4] ? Number(match[4]) : null;
      const verseEnd = match[5] ? Number(match[5]) : null;

      const reference = verseEnd
        ? endChapter && endChapter !== chapter
          ? `${chapter}:${verse}-${endChapter}:${verseEnd}`
          : `${chapter}:${verse}-${verseEnd}`
        : `${chapter}:${verse}`;

      return {
        book,
        chapter,
        verse,
        verseEnd,
        reference,
        display: `${book} ${reference}`
      };
    }

    const lastSpace = rawRef.lastIndexOf(" ");
    if (lastSpace > 0){
      const book = rawRef.slice(0, lastSpace).trim();
      const reference = rawRef.slice(lastSpace + 1).trim();

      return {
        book,
        chapter: null,
        verse: null,
        verseEnd: null,
        reference,
        display: rawRef
      };
    }

    return {
      book: rawRef,
      chapter: null,
      verse: null,
      verseEnd: null,
      reference: "",
      display: rawRef
    };
  }

  function getReferenceDecoys(referenceMeta, mode = "easy", count = 6){
    const chapter = Number(referenceMeta?.chapter);
    const verse = Number(referenceMeta?.verse);
    const verseEnd = referenceMeta?.verseEnd == null ? null : Number(referenceMeta.verseEnd);
    const correct = String(referenceMeta?.reference ?? "").trim();
    const difficulty = String(mode || "easy").toLowerCase();
    const desiredCount = Math.max(0, Number(count) || 0);

    if (!desiredCount) return [];

    const hasParsedReference =
      Number.isFinite(chapter) &&
      chapter >= 1 &&
      Number.isFinite(verse) &&
      verse >= 1;

    const span =
      Number.isFinite(verseEnd) && verseEnd > verse
        ? verseEnd - verse
        : 0;

    const formatReference = (rawChapter, rawVerse) => {
      const safeChapter = Math.max(1, Math.floor(Number(rawChapter) || 1));
      const safeVerse = Math.max(1, Math.floor(Number(rawVerse) || 1));

      return span > 0
        ? `${safeChapter}:${safeVerse}-${safeVerse + span}`
        : `${safeChapter}:${safeVerse}`;
    };

    const addCandidate = (set, candidate) => {
      const text = String(candidate ?? "").trim();
      if (!text) return;
      if (text === correct) return;
      set.add(text);
    };

    const fallbackRefs = [
      "1:1",
      "3:16",
      "8:28",
      "23:4",
      "4:12",
      "5:13",
      "6:27",
      "10:10",
      "12:2",
      "15:3"
    ];

    const out = new Set();

    if (!hasParsedReference){
      for (const ref of fallbackRefs){
        addCandidate(out, ref);
        if (out.size >= desiredCount) return [...out];
      }
      return [...out].slice(0, desiredCount);
    }

    if (difficulty === "medium" || difficulty === "hard"){
      const offsets = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [0, -2],
        [0, 2],
        [-2, 0],
        [2, 0]
      ];

      for (const [chapterOffset, verseOffset] of offsets){
        addCandidate(out, formatReference(chapter + chapterOffset, verse + verseOffset));
        if (out.size >= desiredCount) return [...out];
      }
    }

    let tries = 0;
    while (out.size < desiredCount && tries < 200){
      tries += 1;

      const randomChapter = 1 + Math.floor(Math.random() * 28);
      const randomVerse = 1 + Math.floor(Math.random() * 40);

      addCandidate(out, formatReference(randomChapter, randomVerse));
    }

    for (const ref of fallbackRefs){
      addCandidate(out, ref);
      if (out.size >= desiredCount) break;
    }

    return [...out].slice(0, desiredCount);
  }
  
  function helpOverlayHtml({
    id = "verseGameHelpOverlay",
    title = "How to Play",
    body = "",
    closeText = "Close"
  } = {}){
    return `
      <div class="vm-game-help-overlay" id="${escapeHtml(id)}" aria-hidden="true">
        <div class="vm-game-help-panel">
          <div class="vm-game-help-title">${escapeHtml(title)}</div>

          <div class="vm-game-help-body-wrap">
            <div class="vm-game-help-body">${body}</div>
          </div>

          <div class="vm-game-help-actions">
            <button class="vm-btn" id="${escapeHtml(id)}CloseBtn" type="button">${escapeHtml(closeText)}</button>
          </div>
        </div>
      </div>
    `;
  }

  function openHelp(id = "verseGameHelpOverlay", mode = "close", closeText = "Close"){
    const overlay = document.getElementById(id);
    const closeBtn = document.getElementById(`${id}CloseBtn`);

    if (!overlay) return;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    overlay.dataset.mode = mode;

    if (closeBtn) closeBtn.textContent = closeText;
  }

  function closeHelp(id = "verseGameHelpOverlay"){
    const overlay = document.getElementById(id);
    if (!overlay) return;

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function wireHelp({
    id = "verseGameHelpOverlay",
    triggerId = "helpBtn",
    onBack = null,
    onClose = null,
    closeText = "Close"
  } = {}){
    const trigger = document.getElementById(triggerId);
    const overlay = document.getElementById(id);
    const closeBtn = document.getElementById(`${id}CloseBtn`);

    if (trigger){
      trigger.onclick = () => {
        openHelp(id, "close", closeText);
      };
    }

    const closeAction = () => {
      const mode = overlay?.dataset.mode || "close";

      if (mode === "back" && typeof onBack === "function"){
        onBack();
        return;
      }

      closeHelp(id);

      if (typeof onClose === "function"){
        onClose();
      }
    };

    if (closeBtn) closeBtn.onclick = closeAction;

    if (overlay){
      overlay.onclick = (e) => {
        if (e.target === overlay) closeAction();
      };
    }
  }

  function renderTitleScreen({
    app,
    title,
    icon = "🎮",
    iconHtml = "",
    helpHtml = "",
    helpOverlayId = "verseGameHelpOverlay",
    startText = "Start",
    helpText = "How to Play",
    backLabel = "Back",
    theme = {},
    onBack,
    onStart
  } = {}){
    if (!app) return;

    app.innerHTML = `
      <div class="vm-game-screen"${styleVarsHtml(theme)}>
        <button class="vm-game-back-pill no-zoom" id="gameShellBackBtn" type="button" aria-label="${escapeHtml(backLabel)}">
          ◀
        </button>

        <div class="vm-game-stage">
          <div class="vm-game-center">
            <div class="vm-game-icon" aria-hidden="true">
              ${iconHtml || escapeHtml(icon)}
            </div>

            <div class="vm-game-title">${escapeHtml(title)}</div>

            <div class="vm-game-actions">
              <button class="vm-btn" id="gameShellStartBtn" type="button">${escapeHtml(startText)}</button>
              <button class="vm-btn vm-btn-secondary" id="helpBtn" type="button">${escapeHtml(helpText)}</button>
            </div>
          </div>
        </div>

        ${helpOverlayHtml({ id: helpOverlayId, body: helpHtml })}
      </div>
    `;

    const backBtn = document.getElementById("gameShellBackBtn");
    const startBtn = document.getElementById("gameShellStartBtn");

    if (backBtn && typeof onBack === "function") backBtn.onclick = onBack;
    if (startBtn && typeof onStart === "function") startBtn.onclick = onStart;

    wireHelp({ id: helpOverlayId, triggerId: "helpBtn" });
  }

  function renderModeSelect({
    app,
    title = "Choose Your Difficulty",
    icon = "🥉🥈🥇",
    iconHtml = "",
    helpHtml = "",
    helpOverlayId = "verseGameHelpOverlay",
    backLabel = "Back to title",
    theme = {},
    modes = [
      { id: "easy", label: "🥉 Easy" },
      { id: "medium", label: "🥈 Medium" },
      { id: "hard", label: "🥇 Hard" }
    ],
    onBack,
    onSelect
  } = {}){
    if (!app) return;

    const modeButtons = modes.map((mode) => `
      <button class="vm-btn" data-game-shell-mode="${escapeHtml(mode.id)}" type="button">
        ${escapeHtml(mode.label)}
      </button>
    `).join("");

    app.innerHTML = `
      <div class="vm-game-screen"${styleVarsHtml(theme)}>
        <button class="vm-game-back-pill no-zoom" id="gameShellModeBackBtn" type="button" aria-label="${escapeHtml(backLabel)}">
          ◀
        </button>

        <div class="vm-game-stage">
          <div class="vm-game-center">
            <div class="vm-game-difficulty-icon" aria-hidden="true">
              ${iconHtml || escapeHtml(icon)}
            </div>

            <div class="vm-game-title">${escapeHtml(title)}</div>

            <div class="vm-game-actions">
              ${modeButtons}
            </div>
          </div>
        </div>

        ${helpOverlayHtml({ id: helpOverlayId, body: helpHtml })}
      </div>
    `;

    const backBtn = document.getElementById("gameShellModeBackBtn");
    if (backBtn && typeof onBack === "function") backBtn.onclick = onBack;

    document.querySelectorAll("[data-game-shell-mode]").forEach((btn) => {
      btn.onclick = () => {
        if (typeof onSelect === "function"){
          onSelect(btn.dataset.gameShellMode);
        }
      };
    });

    wireHelp({ id: helpOverlayId, triggerId: "helpBtn" });
  }


function renderCompleteScreen({
  app,
  title = "Complete!",
  icon = "🎉",
  iconHtml = "",
  statsText = "",
  statsHtml = "",
  playAgainText = "Play Again",
  moreGamesText = "More Games",
  backLabel = "Back to Practice Games",
  theme = {},
  onPlayAgain,
  onMoreGames
} = {}){
  if (!app) return;

  const statsMarkup = statsHtml
    ? `<div class="vm-game-complete-stats">${statsHtml}</div>`
    : statsText
      ? `<div class="vm-game-complete-stats">${escapeHtml(statsText)}</div>`
      : "";

  app.innerHTML = `
    <div class="vm-game-screen"${styleVarsHtml(theme)}>
      <button class="vm-game-back-pill no-zoom" id="gameShellCompleteBackBtn" type="button" aria-label="${escapeHtml(backLabel)}">
        ◀
      </button>

      <div class="vm-game-stage">
        <div class="vm-game-center">
          <div class="vm-game-icon" aria-hidden="true">
            ${iconHtml || escapeHtml(icon)}
          </div>

          <div class="vm-game-title">${escapeHtml(title)}</div>

          ${statsMarkup}

          <div class="vm-game-actions">
            <button class="vm-btn" id="gameShellPlayAgainBtn" type="button">${escapeHtml(playAgainText)}</button>
            <button class="vm-btn vm-btn-secondary" id="gameShellMoreGamesBtn" type="button">${escapeHtml(moreGamesText)}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const playAgainBtn = document.getElementById("gameShellPlayAgainBtn");
  const moreGamesBtn = document.getElementById("gameShellMoreGamesBtn");
  const backBtn = document.getElementById("gameShellCompleteBackBtn");

  if (playAgainBtn && typeof onPlayAgain === "function") playAgainBtn.onclick = onPlayAgain;
  if (moreGamesBtn && typeof onMoreGames === "function") moreGamesBtn.onclick = onMoreGames;
  if (backBtn && typeof onMoreGames === "function") backBtn.onclick = onMoreGames;
}

  window.VerseGameShell = {
    escapeHtml,
    getFunDecoys,
    getBibleBookDecoys,
    getBookDecoys,
    getFunWordDecoys,
    shuffle,
    clamp,
    capitalize,
    normalizeWord,
    tokenizeVerseWords,
    tokenizeVerseForBuild,
    extractWordEntries,
    titleCaseBookFromSlug,
    parseReferenceParts,
    getReferenceDecoys,
    helpOverlayHtml,
    openHelp,
    closeHelp,
    wireHelp,
    renderTitleScreen,
    renderModeSelect,
    renderCompleteScreen
  };
})();
