(async function(){
  const app = document.getElementById("app");
  const launch = window.VerseGameBridge.getLaunchParams();
  const ctx = await window.VerseGameBridge.getVerseContext();

  let selectedMode = null;
  let completed = false;

  function renderModeSelect(){
    app.innerHTML = `
      <div class="vm-stack">
        <div class="vm-pill vs-ref">${ctx.verseRef || launch.ref || "Verse"}</div>
        <div class="vm-title">🐍 Verse Snake</div>
        <div class="vm-subtitle">Choose your difficulty.</div>

        <div class="vm-card">
          <div class="vm-actions">
            <button class="vm-btn" id="easyBtn">Easy</button>
            <button class="vm-btn" id="mediumBtn">Medium</button>
            <button class="vm-btn" id="hardBtn">Hard</button>
          </div>
        </div>

        <div class="vm-nav">
          <button class="vm-btn vm-btn-dark" id="backBtn">Back to Games</button>
        </div>
      </div>
    `;

    document.getElementById("easyBtn").onclick = () => {
      selectedMode = "easy";
      renderGameStub();
    };

    document.getElementById("mediumBtn").onclick = () => {
      selectedMode = "medium";
      renderGameStub();
    };

    document.getElementById("hardBtn").onclick = () => {
      selectedMode = "hard";
      renderGameStub();
    };

    document.getElementById("backBtn").onclick = () => {
      window.VerseGameBridge.exitGame();
    };
  }

  function renderGameStub(){
    app.innerHTML = `
      <div class="vm-stack">
        <div class="vm-pill vs-ref">${ctx.verseRef || launch.ref || "Verse"}</div>
        <div class="vm-card">
          <div class="vs-verse">${ctx.verseText || "Verse text goes here."}</div>
        </div>

        <div class="vs-field">
          Verse Snake prototype screen<br><br>
          Mode: ${selectedMode}
        </div>

        <div class="vm-card">
          <div class="vs-note">
            This is just a stub screen so we can test launch, return, and progress saving before building the real game.
          </div>
        </div>

        <div class="vm-actions">
          <button class="vm-btn" id="completeBtn">Fake Complete This Mode</button>
          <button class="vm-btn vm-btn-dark" id="backBtn">Back to Games</button>
        </div>
      </div>
    `;

    document.getElementById("completeBtn").onclick = () => {
      const result = window.VerseGameBridge.markCompleted({
        verseId: ctx.verseId,
        gameId: "verse_snake",
        mode: selectedMode,
        progressType: "standard"
      });

      const shouldAutoShowPetUnlock = !!result?.petUnlockTriggered;

      completed = true;
      renderDone(shouldAutoShowPetUnlock);
    };

    document.getElementById("backBtn").onclick = () => {
      window.VerseGameBridge.exitGame();
    };
  }

   function renderDone(autoShowPetUnlock = false){
  app.innerHTML = `
    <div class="vm-stack">
      <div class="vm-pill vs-ref">${ctx.verseRef || launch.ref || "Verse"}</div>
      <div class="vm-title">🎉 Great job!</div>
      <div class="vm-subtitle">
        ${
          autoShowPetUnlock
            ? "You unlocked a BibloPet!"
            : `Verse Snake ${selectedMode} was marked complete.`
        }
      </div>

      <div class="vm-actions">
        <button class="vm-btn" id="againBtn">Play Again</button>
        <button class="vm-btn vm-btn-dark" id="backBtn">Practice Games</button>
      </div>
    </div>
  `;

  document.getElementById("againBtn").onclick = () => {
    completed = false;
    renderModeSelect();
  };

  document.getElementById("backBtn").onclick = () => {
    window.VerseGameBridge.exitGame();
  };

  if (autoShowPetUnlock){
    setTimeout(() => {
      window.VerseGameBridge.exitGame();
    }, 450);
  }
}

  renderModeSelect();
})();
