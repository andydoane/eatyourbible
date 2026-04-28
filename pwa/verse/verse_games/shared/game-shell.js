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
    helpOverlayHtml,
    openHelp,
    closeHelp,
    wireHelp,
    renderTitleScreen,
    renderModeSelect,
    renderCompleteScreen
  };
})();
