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

  let sharedFunDecoyBag = [];

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

  function getVerseWordDecoys({
    words = [],
    correct = "",
    targetIndex = -1,
    count = 6,
    avoidNext = 2,
    fallbackToFun = true
  } = {}){
    const desiredCount = Math.max(0, Number(count) || 0);
    const correctNorm = normalizeWord(correct);
    const safeWords = Array.isArray(words) ? words : [];
    const safeTargetIndex = Number(targetIndex);
    const safeAvoidNext = Math.max(0, Number(avoidNext) || 0);

    if (!desiredCount) return [];

    const blocked = new Set();

    if (correctNorm){
      blocked.add(correctNorm);
    }

    if (
      Number.isFinite(safeTargetIndex) &&
      safeTargetIndex >= 0 &&
      safeAvoidNext > 0
    ){
      for (
        let index = safeTargetIndex + 1;
        index <= safeTargetIndex + safeAvoidNext && index < safeWords.length;
        index += 1
      ){
        const nextKey = normalizeWord(safeWords[index]);
        if (nextKey){
          blocked.add(nextKey);
        }
      }
    }

    const candidates = [];
    const used = new Set();

    for (const word of safeWords){
      const key = normalizeWord(word);

      if (!key) continue;
      if (blocked.has(key)) continue;
      if (used.has(key)) continue;

      candidates.push(word);
      used.add(key);
    }

    const out = shuffle(candidates).slice(0, desiredCount);

    if (out.length < desiredCount && fallbackToFun){
      const alreadyUsed = new Set(out.map(normalizeWord));

      for (const word of getFunWordDecoys(correct, safeWords, desiredCount * 2)){
        const key = normalizeWord(word);

        if (!key) continue;
        if (blocked.has(key)) continue;
        if (alreadyUsed.has(key)) continue;

        out.push(word);
        alreadyUsed.add(key);

        if (out.length >= desiredCount) break;
      }
    }

    return out.slice(0, desiredCount);
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

  function getBuildLengthScore(verseText, book, reference){
    return (
      String(verseText || "").length +
      String(book || "").length +
      String(reference || "").length
    );
  }

  function getBuildSizeClass(verseText, book, reference, buildArea = "large"){
    const score = getBuildLengthScore(verseText, book, reference);

    const profiles = {
      large: {
        mediumAt: 106,
        smallAt: 136
      },
      compact: {
        mediumAt: 73,
        smallAt: 121
      },
      none: {
        mediumAt: Infinity,
        smallAt: Infinity
      }
    };

    const profile = profiles[String(buildArea || "large").toLowerCase()] || profiles.large;

    if (score >= profile.smallAt) return "is-small";
    if (score >= profile.mediumAt) return "is-medium";
    return "is-normal";
  }

  function buildVerseSegments({
    verseText = "",
    book = "",
    reference = "",
    buildArea = "large"
  } = {}){
    const words = tokenizeVerseWords(verseText);
    const bookLabel = String(book || "").trim();
    const referenceLabel = String(reference || "").trim();
    const area = String(buildArea || "large").toLowerCase();

    const segments = [...words];
    const metaIndices = new Set();

    if (bookLabel){
      metaIndices.add(segments.length);
      segments.push(bookLabel);
    }

    if (referenceLabel){
      metaIndices.add(segments.length);
      segments.push(referenceLabel);
    }

    return {
      words,
      segments,
      metaIndices,
      bookLabel,
      referenceLabel,
      buildArea: area,
      buildSizeClass: getBuildSizeClass(verseText, bookLabel, referenceLabel, area)
    };
  }

  function getPhaseForProgress({
    progressIndex = 0,
    wordCount = 0,
    totalSegments = 0,
    bookLabel = "",
    referenceLabel = "",
    hasBook = null,
    hasReference = null
  } = {}){
    const index = Math.max(0, Number(progressIndex) || 0);
    const words = Math.max(0, Number(wordCount) || 0);
    const total = Math.max(words, Number(totalSegments) || 0);

    const book = hasBook === null ? !!String(bookLabel || "").trim() : !!hasBook;
    const reference = hasReference === null ? !!String(referenceLabel || "").trim() : !!hasReference;

    if (index < words) return "words";

    let cursor = words;

    if (book){
      if (index === cursor) return "book";
      cursor += 1;
    }

    if (reference){
      if (index === cursor) return "reference";
      cursor += 1;
    }

    if (index < total) return "reference";

    return "done";
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

  function gameMenuHtml({
    id = "verseGameMenuOverlay",
    title = "Game Menu",
    muted = false,
    howToText = "How to Play",
    modeSelectText = "Mode Select",
    exitText = "Exit Game",
    closeText = "Close",
    showModeSelect = true
  } = {}){
    const safeId = escapeHtml(id);

    return `
      <div class="vm-game-menu-overlay" id="${safeId}" aria-hidden="true">
        <div class="vm-game-menu-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
          <div class="vm-game-menu-header">
            <div class="vm-game-menu-title">${escapeHtml(title)}</div>

            <button
              class="vm-game-menu-mute-btn"
              id="${safeId}MuteBtn"
              type="button"
              aria-label="${muted ? "Unmute" : "Mute"}"
              title="${muted ? "Unmute" : "Mute"}"
            >${muted ? "🔇" : "🔊"}</button>
          </div>

          <div class="vm-game-menu-actions">
            <button class="vm-btn vm-game-menu-btn" id="${safeId}HowToBtn" type="button">${escapeHtml(howToText)}</button>
            ${showModeSelect ? `<button class="vm-btn vm-game-menu-btn" id="${safeId}ModeSelectBtn" type="button">${escapeHtml(modeSelectText)}</button>` : ""}
            <button class="vm-btn vm-game-menu-btn" id="${safeId}ExitBtn" type="button">${escapeHtml(exitText)}</button>
            <button class="vm-btn vm-game-menu-btn vm-game-menu-close-btn" id="${safeId}CloseBtn" type="button">${escapeHtml(closeText)}</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireGameMenu({
    id = "verseGameMenuOverlay",
    menuButtonId = "",
    helpOverlayId = "",
    closeHelpText = "Close",
    backHelpText = "Back",
    isMuted = null,
    onMuteToggle = null,
    onHowToPlay = null,
    onModeSelect = null,
    onExit = null,
    onOpen = null,
    onClose = null,
    onBackFromHelp = null
  } = {}){
    const overlay = document.getElementById(id);
    const menuButton = menuButtonId ? document.getElementById(menuButtonId) : null;

    const howToBtn = document.getElementById(`${id}HowToBtn`);
    const modeSelectBtn = document.getElementById(`${id}ModeSelectBtn`);
    const muteBtn = document.getElementById(`${id}MuteBtn`);
    const exitBtn = document.getElementById(`${id}ExitBtn`);
    const closeBtn = document.getElementById(`${id}CloseBtn`);

    const updateMuteButton = () => {
      if (!muteBtn) return;

      const muted = typeof isMuted === "function" ? !!isMuted() : false;
      muteBtn.textContent = muted ? "🔇" : "🔊";
      muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
      muteBtn.setAttribute("title", muted ? "Unmute" : "Mute");
    };

    const openMenu = (event) => {
      if (event){
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
      }

      if (typeof onOpen === "function"){
        onOpen();
      }

      if (overlay){
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
      }

      updateMuteButton();
    };

    const closeMenu = () => {
      if (overlay){
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
      }

      if (typeof onClose === "function"){
        onClose();
      }
    };

    const openHelp = () => {
      if (typeof onHowToPlay === "function"){
        onHowToPlay();
        return;
      }

      if (overlay){
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
      }

      if (helpOverlayId){
        openHelp(helpOverlayId, "back", backHelpText);
      }
    };

    if (menuButton){
      menuButton.onclick = openMenu;
      menuButton.onpointerdown = openMenu;
      menuButton.ontouchstart = openMenu;
    }

    if (howToBtn){
      howToBtn.onclick = openHelp;
    }

    if (modeSelectBtn){
      modeSelectBtn.onclick = () => {
        if (overlay){
          overlay.classList.remove("is-open");
          overlay.setAttribute("aria-hidden", "true");
        }

        if (typeof onModeSelect === "function"){
          onModeSelect();
        }
      };
    }

    if (muteBtn){
      muteBtn.onclick = () => {
        if (typeof onMuteToggle === "function"){
          onMuteToggle();
        }

        updateMuteButton();
      };
    }

    if (exitBtn && typeof onExit === "function"){
      exitBtn.onclick = onExit;
    }

    if (closeBtn){
      closeBtn.onclick = closeMenu;
    }

    if (overlay){
      overlay.onclick = (event) => {
        if (event.target === overlay){
          closeMenu();
        }
      };
    }

    if (helpOverlayId){
      wireHelp({
        id: helpOverlayId,
        closeText: closeHelpText,
        onBack: () => {
          closeHelp(helpOverlayId);

          if (overlay){
            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
          }

          if (typeof onBackFromHelp === "function"){
            onBackFromHelp();
          }
        },
        onClose
      });
    }

    updateMuteButton();

    return {
      open: openMenu,
      close: closeMenu,
      updateMuteButton
    };
  }


  window.VerseGameShell = {
    escapeHtml,
    getFunDecoys,
    getBibleBookDecoys,
    getBookDecoys,
    getFunWordDecoys,
    getVerseWordDecoys,
    shuffle,
    clamp,
    capitalize,
    normalizeWord,
    tokenizeVerseWords,
    tokenizeVerseForBuild,
    extractWordEntries,
    getBuildLengthScore,
    getBuildSizeClass,
    buildVerseSegments,
    getPhaseForProgress,
    titleCaseBookFromSlug,
    parseReferenceParts,
    getReferenceDecoys,
    helpOverlayHtml,
    openHelp,
    closeHelp,
    wireHelp,
    gameMenuHtml,
    wireGameMenu,
    renderTitleScreen,
    renderModeSelect,
    renderCompleteScreen
  };
})();
