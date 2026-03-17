/* =========================================================
   TRAFFIC TAP CODE
   ========================================================= */

const TRAFFIC_EMOJIS = ["🚗", "🚕", "🚙", "🏎️", "🚓", "🚌", "🚎", "🚐", "🚑", "🚒", "🚚", "🚛", "🚜", "🛻", "🚲", "🛵", "🏍️", "🛴", "🛺"];
const TRAFFIC_GREEN = "#a7cb6f";

function trafficElapsedMs(){
  const st = State.trafficGame;
  if (!st) return 0;
  return (st.endedAt || performance.now()) - st.startedAt;
}

function trafficBuiltVerseNode(){
  const p = document.createElement("p");
  p.className = "verse scramble-verse";

  const st = State.trafficGame;
  const builtCount = st?.builtCount || 0;
  const wordIdxs = st?.wordTokenIndices || [];
  const builtSet = new Set(wordIdxs.slice(0, builtCount));

  for (let i = 0; i < tokens.length; i++){
    const t = tokens[i];

    if (t.type === TokenType.SPACE || t.type === TokenType.PUNCT || t.type === TokenType.OTHER){
      p.appendChild(document.createTextNode(t.text));
      continue;
    }

    if (builtSet.has(i)){
      p.appendChild(document.createTextNode(t.text));
    } else {
      break;
    }
  }

  if (!st?.done && builtCount > 0){
    p.appendChild(document.createTextNode(" …"));
  }

  if (!builtCount){
    p.innerHTML = `
      Build the verse one word at a time.<br>
      <span style="font-weight:600;">Tap the first word to start.</span>
    `;
  }

  return p;
}

function trafficUniqueDecoys(pool, correct, count){
  const excluded = new Set([String(correct).toLowerCase()]);
  const out = [];

  for (const item of shuffleArray([...pool])){
    const key = String(item).toLowerCase();
    if (excluded.has(key)) continue;
    if (out.some(x => String(x).toLowerCase() === key)) continue;
    out.push(item);
    if (out.length >= count) break;
  }

  return out;
}

function trafficMakeRefDecoys(correctRef){
  const [chapterText, verseText] = String(correctRef).split(":");
  const chapter = Number(chapterText || 1);
  const verse = Number(verseText || 1);

  const refs = new Set();
  let tries = 0;

  while (refs.size < 8 && tries < 200){
    const chapterBump = Math.floor(Math.random() * 9) - 4;
    const verseBump = Math.floor(Math.random() * 19) - 9;

    let fakeChapter = chapter + chapterBump;
    let fakeVerse = verse + verseBump;

    if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 6);
    if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 20);

    const candidate = `${fakeChapter}:${fakeVerse}`;
    if (candidate !== correctRef){
      refs.add(candidate);
    }

    tries += 1;
  }

  return Array.from(refs);
}

function trafficCurrentCorrectLabel(st){
  if (!st) return "";

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return "";
    return tokens[correctTokenIndex].text;
  }

  if (st.phase === "book"){
    return st.targetBook;
  }

  if (st.phase === "ref"){
    return `${st.targetChapter}:${st.targetVerse}`;
  }

  return "";
}

function trafficPhaseDecoyPool(st){
  if (!st) return [];

  if (st.phase === "words"){
    const verseWordsLower = st.wordTokenIndices
      .map(idx => tokens[idx].text.toLowerCase());

    return VERSE_CHAIN_DECOY_WORDS
      .filter(word => !verseWordsLower.includes(word.toLowerCase()));
  }

  if (st.phase === "book"){
    return BIBLE_BOOKS;
  }

  if (st.phase === "ref"){
    const correctRef = `${st.targetChapter}:${st.targetVerse}`;
    return trafficMakeRefDecoys(correctRef);
  }

  return [];
}

function trafficStartPhase(st, phase){
  st.phase = phase;
  st.lastCorrectSpawnAt = 0;
  st.nextSpawnDelay = Math.min(st.nextSpawnDelay || 9999, 500);
}

function startTrafficTapGame(){
  const wordTokenIndices = scrambleWordTokenIndices();
  const meta = chainVerseMetaFromId(VERSE_ID);

  State.trafficGame = {
    wordTokenIndices,
    builtCount: 0,
    done: false,
    phase: "words",
    showRef: false,
    targetBook: meta.book,
    targetChapter: meta.chapter,
    targetVerse: meta.verse,
    startedAt: performance.now(),
    endedAt: 0,
    items: [],
    nextItemId: 1,
    spawnSerial: 0,
    totalSpawned: 0,
    lastSpawnAt: 0,
    nextSpawnDelay: 950,
    lastCorrectSpawnAt: 0,
    rafId: 0,
    fieldEl: null,
    slideEl: null,
    gameLayout: null,
    coachActions: null
  };
}

function trafficRandomSpawnDelay(){
  return 850 + Math.random() * 650;
}

function trafficChooseRoad(st){
  const topCount = st.items.filter(x => x.road === 0).length;
  const bottomCount = st.items.filter(x => x.road === 1).length;

  if (topCount < bottomCount) return 0;
  if (bottomCount < topCount) return 1;
  return Math.random() < 0.5 ? 0 : 1;
}

function trafficCanSpawnCorrect(st){
  if (!st || st.done) return false;
  if (st.totalSpawned < 2) return false;
  if (st.items.some(x => x.isCorrect)) return false;
  return true;
}

function trafficShouldSpawnCorrect(st, now){
  if (!trafficCanSpawnCorrect(st)) return false;

  const timeSinceCorrect = now - (st.lastCorrectSpawnAt || st.startedAt || now);
  if (timeSinceCorrect > 4200) return true;

  return Math.random() < 0.38;
}

function trafficSpawnItem(fieldEl){
  const st = State.trafficGame;
  if (!st || st.done || !fieldEl) return;

  const now = performance.now();
  const fieldW = Math.max(320, fieldEl.clientWidth);

  const correctLabel = trafficCurrentCorrectLabel(st);
  if (!correctLabel) return;

  const isCorrect = trafficShouldSpawnCorrect(st, now);
  const pool = trafficPhaseDecoyPool(st);

  let label = correctLabel;
  if (!isCorrect){
    const decoys = trafficUniqueDecoys(pool, correctLabel, 1);
    label = decoys[0] || "apple";
  }

  const road = trafficChooseRoad(st);
  const emoji = TRAFFIC_EMOJIS[Math.floor(Math.random() * TRAFFIC_EMOJIS.length)];
  const direction = road === 0 ? -1 : 1;
  const x = direction < 0 ? fieldW + 130 : -130;
  const speed = 100 + Math.random() * 6;

  const item = {
    id: st.nextItemId++,
    road,
    direction,
    emoji,
    label,
    isCorrect,
    x,
    speed,
    width: 150,
    destroy: false,
    spawnedAt: now
  };

  st.items.push(item);
  st.totalSpawned += 1;
  st.spawnSerial += 1;

  if (isCorrect){
    st.lastCorrectSpawnAt = now;
  }
}

function trafficSizeField(fieldEl){
  const st = State.trafficGame;
  if (!st || !fieldEl) return;

  const verseEl = st.slideEl?.querySelector(".learn-verse");
  const navEl = document.getElementById("navBar");

  if (!verseEl || !navEl) return;

  const verseRect = verseEl.getBoundingClientRect();
  const navRect = navEl.getBoundingClientRect();

  const usableHeight = Math.max(260, Math.floor(navRect.top - verseRect.bottom));

  fieldEl.style.height = `${usableHeight}px`;
  fieldEl.style.flex = "0 0 auto";
}

function trafficRoadMetrics(fieldEl){
  const fieldW = Math.max(320, fieldEl.clientWidth);
  const fieldH = Math.max(260, fieldEl.clientHeight);

  const roadH = fieldH * 0.40;
  const gapH = fieldH * 0.08;
  const laneH = roadH / 2;

  const topRoadTop = 0;
  const bottomRoadTop = roadH + gapH;

  return {
    fieldW,
    fieldH,
    roadH,
    gapH,
    laneH,
    topRoadTop,
    bottomRoadTop,
    lane1CenterY: roadH * 0.25,
    lane2CenterY: roadH * 0.75
  };
}

function trafficRemoveOffscreen(fieldEl){
  const st = State.trafficGame;
  if (!st || !fieldEl) return;

  const fieldW = Math.max(320, fieldEl.clientWidth);

  st.items = st.items.filter(item => {
    if (item.destroy) return false;
    if (item.direction < 0 && item.x < -220) return false;
    if (item.direction > 0 && item.x > fieldW + 220) return false;
    return true;
  });
}

function trafficSpawnTick(fieldEl, now){
  const st = State.trafficGame;
  if (!st || st.done) return;

  if (!st.lastSpawnAt){
    st.lastSpawnAt = now;
    st.nextSpawnDelay = trafficRandomSpawnDelay();
    return;
  }

  const timeSinceSpawn = now - st.lastSpawnAt;
  if (timeSinceSpawn < st.nextSpawnDelay) return;

  st.lastSpawnAt = now;
  st.nextSpawnDelay = trafficRandomSpawnDelay();

  const roadCounts = [
    st.items.filter(x => x.road === 0).length,
    st.items.filter(x => x.road === 1).length
  ];

  if (roadCounts[0] >= 4 && roadCounts[1] >= 4) return;

  trafficSpawnItem(fieldEl);
  trafficRenderItems(fieldEl);
}

function trafficFlashWrong(itemId){
  const st = State.trafficGame;
  if (!st || !st.fieldEl) return;

  const itemEl = st.fieldEl.querySelector(`[data-traffic-id="${itemId}"]`);
  if (!itemEl) return;

  const carBtn = itemEl.querySelector(".traffic-car-btn");
  const wordBtn = itemEl.querySelector(".traffic-word-btn");

  if (carBtn) carBtn.classList.add("wrong");
  if (wordBtn) wordBtn.classList.add("wrong");

  setTimeout(() => {
    if (carBtn) carBtn.classList.remove("wrong");
    if (wordBtn) wordBtn.classList.remove("wrong");
  }, 280);
}

function trafficChoose(itemId, tappedEl){
  const st = State.trafficGame;
  if (!st || st.done) return;

  const item = st.items.find(x => x.id === itemId);
  if (!item) return;

  const fieldEl = st.fieldEl;
  if (!fieldEl) return;

  const rectField = fieldEl.getBoundingClientRect();
  const rectBtn = tappedEl.getBoundingClientRect();
  const popX = rectBtn.left - rectField.left + (rectBtn.width / 2);
  const popY = rectBtn.top - rectField.top - 6;

  if (!item.isCorrect){
    trafficFlashWrong(item.id);
    scrambleShowPopup(fieldEl, popX, popY, "✖", false);
    return;
  }

  item.destroy = true;
  scrambleShowPopup(fieldEl, popX, popY, "✔", true);

  if (st.phase === "words"){
    st.builtCount += 1;

    if (st.builtCount >= st.wordTokenIndices.length){
      trafficStartPhase(st, "book");
      render();
      return;
    }

    render();
    return;
  }

  if (st.phase === "book"){
    trafficStartPhase(st, "ref");
    render();
    return;
  }

  if (st.phase === "ref"){
    st.phase = "done";
    st.done = true;
    st.showRef = true;
    st.endedAt = performance.now();
    st.items = [];
    render();
  }
}

function trafficStopMotion(){
  const st = State.trafficGame;
  if (!st) return;

  if (st.rafId){
    cancelAnimationFrame(st.rafId);
    st.rafId = 0;
  }

  st.fieldEl = null;
  st.slideEl = null;
  st.gameLayout = null;
  st.coachActions = null;
}


function trafficRenderItems(fieldEl){
  const st = State.trafficGame;
  if (!st || !fieldEl) return;

  trafficSizeField(fieldEl);
  const metrics = trafficRoadMetrics(fieldEl);

  const topRoad = fieldEl.querySelector(".traffic-road.top");
  const bottomRoad = fieldEl.querySelector(".traffic-road.bottom");

  if (topRoad){
    topRoad.style.top = `${metrics.topRoadTop}px`;
    topRoad.style.height = `${metrics.roadH}px`;
  }

  if (bottomRoad){
    bottomRoad.style.top = `${metrics.bottomRoadTop}px`;
    bottomRoad.style.height = `${metrics.roadH}px`;
  }

  for (const item of st.items){
    let itemEl = fieldEl.querySelector(`[data-traffic-id="${item.id}"]`);

    if (!itemEl){
      itemEl = document.createElement("div");
      itemEl.className = "traffic-item";
      itemEl.dataset.trafficId = String(item.id);

      const carBtn = document.createElement("button");
      carBtn.className = "traffic-car-btn no-zoom";
      carBtn.type = "button";

      const carFlip = document.createElement("span");
      carFlip.className = "traffic-car-flip";

      const carEmoji = document.createElement("span");
      carEmoji.className = "traffic-car-emoji";
      carEmoji.textContent = item.emoji;

      carFlip.appendChild(carEmoji);
      carBtn.appendChild(carFlip);
      carBtn.onclick = () => trafficChoose(item.id, carBtn);

      const wordBtn = document.createElement("button");
      wordBtn.className = "traffic-word-btn no-zoom";
      wordBtn.type = "button";
      wordBtn.textContent = item.label;
      wordBtn.onclick = () => trafficChoose(item.id, wordBtn);

      itemEl.appendChild(carBtn);
      itemEl.appendChild(wordBtn);
      fieldEl.appendChild(itemEl);

      requestAnimationFrame(() => {
        const w = Math.ceil(itemEl.offsetWidth || 150);
        item.width = Math.max(110, w);
      });
    }

    const roadTop = item.road === 0 ? metrics.topRoadTop : metrics.bottomRoadTop;
    const itemLeft = item.x;

    itemEl.style.transform = `translate(${itemLeft}px, ${roadTop}px)`;

    const carBtn = itemEl.querySelector(".traffic-car-btn");
    const wordBtn = itemEl.querySelector(".traffic-word-btn");

    if (carBtn){
      carBtn.style.top = `${metrics.lane1CenterY}px`;
      carBtn.style.transform = `translateX(-50%) translateY(-50%)`;

      const carFlip = carBtn.querySelector(".traffic-car-flip");
      if (carFlip){
        carFlip.style.transform = item.direction > 0
          ? `scaleX(-1)`
          : `scaleX(1)`;
      }

      const carEmoji = carBtn.querySelector(".traffic-car-emoji");
      if (carEmoji){
        const carSizePx = Math.round(metrics.laneH * 0.80);
        carEmoji.style.fontSize = `${carSizePx}px`;
      }
    }

    if (wordBtn){
      wordBtn.style.top = `${metrics.lane2CenterY}px`;
      wordBtn.style.transform = `translateX(-50%) translateY(-50%)`;
      wordBtn.textContent = item.label;
    }
  }

  fieldEl.querySelectorAll(".traffic-item").forEach(el => {
    const id = Number(el.dataset.trafficId || 0);
    const found = st.items.some(item => item.id === id);
    if (!found) el.remove();
  });
}

function trafficStartMotion(fieldEl){
  const st = State.trafficGame;
  if (!st || st.done) return;

  trafficStopMotion();
  st.fieldEl = fieldEl;

  let lastTs = performance.now();

  function tick(ts){
    const live = State.trafficGame;
    if (!live || live !== st) return;
    if (State.screen !== Screen.GAME || State.activeGame !== "traffic") return;
    if (st.done) return;
    if (!st.fieldEl) return;

    const dt = Math.min(40, ts - lastTs);
    lastTs = ts;

    trafficSizeField(fieldEl);
    trafficSpawnTick(fieldEl, ts);

    for (const item of st.items){
      item.x += item.direction * item.speed * (dt / 1000);
    }

    trafficRemoveOffscreen(fieldEl);
    trafficRenderItems(fieldEl);

    st.rafId = requestAnimationFrame(tick);
  }

  st.rafId = requestAnimationFrame(tick);
}

registerGame({
  id: "traffic",
  title: "Traffic Tap",
  description: "Tap the moving correct word.",
  start(stage){
    if (!State.trafficGame){
      startTrafficTapGame();
    }

    const st = State.trafficGame;
    trafficStopMotion();

    stage.innerHTML = "";

    const verseBox = document.createElement("div");
    verseBox.style.width = "100%";
    verseBox.style.maxWidth = "760px";
    verseBox.style.minHeight = "90px";
    verseBox.style.display = "flex";
    verseBox.style.alignItems = "center";
    verseBox.style.justifyContent = "center";
    verseBox.style.textAlign = "center";
    verseBox.appendChild(trafficBuiltVerseNode());
    stage.appendChild(verseBox);

    const gameLayout = stage.closest(".learn-layout");
    const coachTitle = gameLayout?.querySelector("#gameCoachTitle");
    const coachActions = gameLayout?.querySelector("#gameCoachActions");
    const slideEl = stage.closest(".slide");

    st.slideEl = slideEl || null;
    st.gameLayout = gameLayout || null;
    st.coachActions = coachActions || null;



    if (coachTitle) coachTitle.textContent = "";

    if (!coachActions) return;
    coachActions.innerHTML = "";

    if (st.done){
      const doneMsg = document.createElement("div");
      doneMsg.className = "traffic-done";
      doneMsg.innerHTML = `
        Great job!<br>
        Total time: ${scrambleFormatTime(trafficElapsedMs())}
      `;
      coachActions.appendChild(doneMsg);
      return;
    }

    const field = document.createElement("div");
    field.className = "traffic-field";

    const topRoad = document.createElement("div");
    topRoad.className = "traffic-road top";

    const bottomRoad = document.createElement("div");
    bottomRoad.className = "traffic-road bottom";

    field.appendChild(topRoad);
    field.appendChild(bottomRoad);
    coachActions.appendChild(field);

    trafficRenderItems(field);
    trafficStartMotion(field);
  }
});

/* =========================================================
   BOUNCING WORDS CODE
   ========================================================= */

registerGame({
  id: "bouncing",
  title: "Bouncing Words",
  description: "Tap the correct moving word.",
  start(stage){
    if (!State.bouncingGame){
      startBouncingWordsGame();
    }

    const st = State.bouncingGame;
    bouncingStopMotion();
    stage.innerHTML = "";

    const verseBox = document.createElement("div");
    verseBox.style.width = "100%";
    verseBox.style.maxWidth = "760px";
    verseBox.style.minHeight = "90px";
    verseBox.style.display = "flex";
    verseBox.style.alignItems = "center";
    verseBox.style.justifyContent = "center";
    verseBox.style.textAlign = "center";
    verseBox.appendChild(bouncingBuiltVerseNode());
    stage.appendChild(verseBox);

    const gameLayout = stage.closest(".learn-layout");
    const coachTitle = gameLayout?.querySelector("#gameCoachTitle");
    const coachActions = gameLayout?.querySelector("#gameCoachActions");

    if (coachTitle) coachTitle.textContent = "";

    if (!coachActions) return;
    coachActions.innerHTML = "";

    if (st.done){
      const doneMsg = document.createElement("div");
      doneMsg.className = "small";
      doneMsg.style.fontWeight = "900";
      doneMsg.style.textAlign = "center";
      doneMsg.style.maxWidth = "520px";
      doneMsg.innerHTML = `
        Score: ${st.score}<br>
        Incorrect guesses: ${st.wrongGuesses}<br>
        Total time: ${scrambleFormatTime(bouncingElapsedMs())}
      `;
      coachActions.appendChild(doneMsg);
      return;
    }

    const field = document.createElement("div");
    field.className = "bouncing-field";

    if (!st.positions.length || st.positions.length !== st.choices.length){
      st.positions = bouncingRandomPositions(st.choices, field);
    }

    const btnRefs = [];
    const colorSet = bouncingColorSet();
    

    st.choices.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.className = "bouncing-word no-zoom";
        if (st.wrongChoice === choice) btn.classList.add("wrong");
        btn.type = "button";
        btn.textContent = choice;
        if (!State.isSliding){
          btn.classList.add("spawn-in");
        }
        btn.classList.add(colorSet[i]);


      const pos = st.positions[i] || { leftPx: 20, topPx: 20, rotationDeg: 0 };
      btn.style.left = `${pos.leftPx}px`;
      btn.style.top = `${pos.topPx}px`;
      btn.style.setProperty("--rot", `${pos.rotationDeg || 0}deg`);

      btn.onclick = (e) => {
        e.stopPropagation();
        bouncingChoose(choice, btn, field);
      };

      btnRefs.push(btn);
      field.appendChild(btn);
    });

    coachActions.appendChild(field);
        bouncingDebugOverlay(field, btnRefs);

    if (!st.done){
      requestAnimationFrame(() => {
        bouncingStartMotion(field, btnRefs);
      });
    }
  }
});
