/* =====================================================
   Verse Memory
   Practice Games

   This file contains:
   1. Traffic Tap
   2. Bouncing Words
   3. Food Slice
   4. Verse Chain
   5. Tower of Bible
   6. Verse Scramble
   ===================================================== */

/* =========================================================
   1. Traffic Tap
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
   2. Bouncing Words
   ========================================================= */


function bouncingBurstAt(fieldEl, x, y){
  const canvas = document.createElement("canvas");
  canvas.className = "bounce-burst";
  canvas.style.left = "0";
  canvas.style.top = "0";

  const width = Math.max(1, Math.floor(fieldEl.clientWidth));
  const height = Math.max(1, Math.floor(fieldEl.clientHeight));

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  fieldEl.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  x = Math.max(0, Math.min(width, x));
  y = Math.max(0, Math.min(height, y));

  const colors = ["#ffd54f", "#ff8a65", "#81c784", "#64b5f6", "#ffffff"];
  const particles = [];

  for (let i = 0; i < 24; i++){
    const angle = (Math.PI * 2 * i) / 24;
    const speed = 1.8 + Math.random() * 2.8;
    const life = 22 + Math.random() * 10;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color: colors[i % colors.length]
    });
  }

  function tick(){
    ctx.clearRect(0, 0, width, height);

    let alive = 0;

    for (const p of particles){
      if (p.life <= 0) continue;

      alive += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 1;

      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (alive > 0){
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);
}

function bouncingColorSet(){
  const colors = ["bounce-color-1", "bounce-color-2", "bounce-color-3"];
  shuffleArray(colors);
  return colors;
}

function scrambleColorSet(){
  const colors = ["color-1", "color-2", "color-3", "color-4", "color-5"];
  shuffleArray(colors);
  return colors.slice(0, 3);
}

function scrambleShapeSet(){
  const shapes = [
    "shape-slime-blob-soft",
    "shape-rocket-goo-soft",
    "shape-zig-round-b",
    "shape-organic-soft-b",
    "shape-splat-pill-soft",
    "shape-wide-sploosh-b-soft",
    "shape-wide-sploosh-soft"
  ];
  shuffleArray(shapes);
  return shapes.slice(0, 3);
}

function scrambleLayoutSeeds(count, maxHorizontalShift){
  const seeds = [];

  for (let i = 0; i < count; i++){
    const shift = maxHorizontalShift === 0
      ? 0
      : Math.round((Math.random() * 2 - 1) * maxHorizontalShift);

    const rotation = Math.round((Math.random() * 8) - 4);

    seeds.push({
      shift,
      rotation
    });
  }

  return seeds;
}

function bouncingAnimateCorrectChoice(btnEl, fieldEl, onDone){
  const st = State.bouncingGame;

  let burstX = 0;
  let burstY = 0;

  const mover = st?.movers?.find(m => m.btn === btnEl);

  if (mover){
    burstX = mover.x + (mover.w / 2);
    burstY = mover.y + (mover.h / 2);

    btnEl.style.left = `${Math.round(mover.x)}px`;
    btnEl.style.top = `${Math.round(mover.y)}px`;
  } else {
    const rectField = fieldEl.getBoundingClientRect();
    const rectBtn = btnEl.getBoundingClientRect();
    burstX = rectBtn.left - rectField.left + (rectBtn.width / 2);
    burstY = rectBtn.top - rectField.top + (rectBtn.height / 2);
  }

  bouncingBurstAt(fieldEl, burstX, burstY);
  btnEl.classList.add("burst-out");

  setTimeout(() => {
    onDone();
  }, 210);
}

function bouncingDebugOverlay(fieldEl, btnRefs){
  const st = State.bouncingGame;
  if (!State.debugBounce || !st || !fieldEl) return;

  const pad = 16;
  const fieldW = fieldEl.clientWidth;

  fieldEl.querySelectorAll(".bounce-debug-line, .bounce-debug-right-line, .bounce-debug-box").forEach(el => el.remove());

  const leftLine = document.createElement("div");
  leftLine.className = "bounce-debug-line";
  leftLine.style.left = `${pad}px`;
  fieldEl.appendChild(leftLine);

  const movers = st.movers || [];

  movers.forEach((m) => {
    const rightLine = document.createElement("div");
    rightLine.className = "bounce-debug-right-line";

    const rightBounceX = Math.max(pad, fieldW - m.w - pad);

    rightLine.style.left = `${Math.round(rightBounceX)}px`;
    fieldEl.appendChild(rightLine);

    const box = document.createElement("div");
    box.className = "bounce-debug-box";
    box.style.left = `${Math.round(m.x)}px`;
    box.style.top = `${Math.round(m.y)}px`;
    box.style.width = `${Math.round(m.w)}px`;
    box.style.height = `${Math.round(m.h)}px`;
    fieldEl.appendChild(box);
  });

  if (!movers.length && Array.isArray(btnRefs)){
    btnRefs.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const fieldRect = fieldEl.getBoundingClientRect();

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      const x = Math.round(rect.left - fieldRect.left);
      const y = Math.round(rect.top - fieldRect.top);


      const box = document.createElement("div");
      box.className = "bounce-debug-box";
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      fieldEl.appendChild(box);
    });
  }
}

function bouncingRefreshDebugOverlay(fieldEl){
  if (!State.debugBounce || !fieldEl) return;

  fieldEl.querySelectorAll(".bounce-debug-right-line, .bounce-debug-box").forEach(el => el.remove());

  const st = State.bouncingGame;
  const movers = st?.movers || [];
  const pad = 16;
  const fieldW = fieldEl.clientWidth;

  movers.forEach((m) => {
    const rightLine = document.createElement("div");
    rightLine.className = "bounce-debug-right-line";

    const rightBounceX = Math.max(pad, fieldW - m.w - pad);

    rightLine.style.left = `${Math.round(rightBounceX)}px`;
    fieldEl.appendChild(rightLine);

    const box = document.createElement("div");
    box.className = "bounce-debug-box";
    box.style.left = `${Math.round(m.x)}px`;
    box.style.top = `${Math.round(m.y)}px`;
    box.style.width = `${Math.round(m.w)}px`;
    box.style.height = `${Math.round(m.h)}px`;
    fieldEl.appendChild(box);
  });
}

function bouncingBuiltVerseNode(){
  const p = document.createElement("p");
  p.className = "verse scramble-verse";

  const st = State.bouncingGame;
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
      <span style="font-weight:600;">Tap the first moving word to start.</span>
    `;
  }

  return p;
}

function bouncingMakeChoices(wordTokenIndices, correctTokenIndex){
  return scrambleMakeChoices(wordTokenIndices, correctTokenIndex);
}

function bouncingMakeBookChoices(correctBook){
  return scrambleMakeBookChoices(correctBook);
}

function bouncingMakeReferenceChoices(correctChapter, correctVerse){
  return scrambleMakeReferenceChoices(correctChapter, correctVerse);
}

function bouncingNextChoices(){
  const st = State.bouncingGame;
  if (!st) return;

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return;
    st.choices = bouncingMakeChoices(st.wordTokenIndices, correctTokenIndex);
    return;
  }

  if (st.phase === "book"){
    st.choices = bouncingMakeBookChoices(st.targetBook);
    return;
  }

  if (st.phase === "ref"){
    st.choices = bouncingMakeReferenceChoices(st.targetChapter, st.targetVerse);
    return;
  }

  st.choices = [];
}

function bouncingRandomPositions(choices, fieldEl){
  const st = State.bouncingGame;
  const pad = 16;
  const gap = 14;

  const fieldRect = fieldEl?.getBoundingClientRect();
  const fieldW = Math.max(260, Math.floor(fieldRect?.width || 320));
  const fieldH = Math.max(240, Math.floor(fieldRect?.height || 240));

  const measurer = document.createElement("div");
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.left = "-9999px";
  measurer.style.top = "-9999px";
  document.body.appendChild(measurer);

  function measureChoice(text){
    const btn = document.createElement("button");
    btn.className = "scramble-word";
    btn.style.position = "absolute";
    btn.style.left = "0";
    btn.style.top = "0";
    btn.style.maxWidth = `${Math.max(120, fieldW - (pad * 2))}px`;
    btn.textContent = text;
    measurer.appendChild(btn);

    const rect = btn.getBoundingClientRect();
    const size = {
      w: Math.ceil(rect.width),
      h: Math.ceil(rect.height)
    };

    btn.remove();
    return size;
  }

  function overlaps(a, b){
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  function randBetween(min, max){
    if (max <= min) return min;
    return min + Math.random() * (max - min);
  }

  function makeZone(x1, x2, y1, y2){
    return {
      xMin: Math.round(x1 * fieldW),
      xMax: Math.round(x2 * fieldW),
      yMin: Math.round(y1 * fieldH),
      yMax: Math.round(y2 * fieldH)
    };
  }

  const layouts = [
    [
      makeZone(0.10, 0.30, 0.02, 0.10),
      makeZone(0.42, 0.62, 0.44, 0.54),
      makeZone(0.18, 0.38, 0.88, 0.96)
    ],
    [
      makeZone(0.44, 0.64, 0.03, 0.11),
      makeZone(0.12, 0.32, 0.45, 0.55),
      makeZone(0.52, 0.72, 0.87, 0.95)
    ],
    [
      makeZone(0.18, 0.38, 0.01, 0.09),
      makeZone(0.54, 0.74, 0.43, 0.53),
      makeZone(0.34, 0.54, 0.89, 0.97)
    ],
    [
      makeZone(0.50, 0.70, 0.02, 0.10),
      makeZone(0.28, 0.48, 0.46, 0.56),
      makeZone(0.08, 0.28, 0.86, 0.94)
    ],
    [
      makeZone(0.24, 0.44, 0.03, 0.11),
      makeZone(0.46, 0.66, 0.44, 0.54),
      makeZone(0.56, 0.76, 0.88, 0.96)
    ]
  ];

  let layoutIndex = Math.floor(Math.random() * layouts.length);
  if (layouts.length > 1 && st?.lastLayoutIndex === layoutIndex){
    layoutIndex = (layoutIndex + 1 + Math.floor(Math.random() * (layouts.length - 1))) % layouts.length;
  }
  if (st) st.lastLayoutIndex = layoutIndex;

  const chosenLayout = layouts[layoutIndex];
  const sizes = choices.map(measureChoice);
  const positions = [];
  const placed = [];

  for (let i = 0; i < sizes.length; i++){
    const size = sizes[i];
    const zone = chosenLayout[i] || chosenLayout[0];

    const minX = Math.max(pad, zone.xMin);
    const maxX = Math.max(minX, Math.min(zone.xMax - size.w, fieldW - size.w - pad));
    const minY = Math.max(pad, zone.yMin);
    const maxY = Math.max(minY, Math.min(zone.yMax - size.h, fieldH - size.h - pad));

    let placedRect = null;

    for (let attempt = 0; attempt < 120; attempt++){
      const rect = {
        x: randBetween(minX, maxX),
        y: randBetween(minY, maxY),
        w: size.w,
        h: size.h
      };

      const hit = placed.some(p => overlaps(rect, p));
      if (!hit){
        placedRect = rect;
        break;
      }
    }

    if (!placedRect){
      const fallbackRect = {
        x: minX,
        y: minY,
        w: size.w,
        h: size.h
      };

      const hit = placed.some(p => overlaps(fallbackRect, p));
      if (!hit){
        placedRect = fallbackRect;
      }
    }

    if (!placedRect){
      for (let attempt = 0; attempt < 140; attempt++){
        const rect = {
          x: randBetween(pad, Math.max(pad, fieldW - size.w - pad)),
          y: randBetween(pad, Math.max(pad, fieldH - size.h - pad)),
          w: size.w,
          h: size.h
        };

        const hit = placed.some(p => overlaps(rect, p));
        if (!hit){
          placedRect = rect;
          break;
        }
      }
    }

    if (!placedRect){
      placedRect = {
        x: pad,
        y: pad + (i * (size.h + gap)),
        w: size.w,
        h: size.h
      };
    }

    const rotationDeg = 0;

    placed.push(placedRect);
    positions.push({
      leftPx: Math.round(placedRect.x),
      topPx: Math.round(placedRect.y),
      rotationDeg
    });
  }

  measurer.remove();
  return positions;
}

function bouncingRandomVelocity(){
  const mag = 1.2 + (Math.random() * 1.0);
  return Math.random() < 0.5 ? -mag : mag;
}

function bouncingBuildMovers(fieldEl, btnRefs){
  const st = State.bouncingGame;
  if (!st) return [];

  const rectField = fieldEl.getBoundingClientRect();
  const fieldW = Math.floor(rectField.width || 320);
  const fieldH = Math.floor(rectField.height || 240);

  return btnRefs.map((btn, i) => {
    const pos = st.positions[i] || { leftPx: 20, topPx: 20, rotationDeg: 0 };
    let vx = bouncingRandomVelocity();
    let vy = bouncingRandomVelocity();

    if (Math.abs(vx) < 1.1) vx = vx < 0 ? -1.1 : 1.1;
    if (Math.abs(vy) < 1.1) vy = vy < 0 ? -1.1 : 1.1;

    return {
      btn,
      x: pos.leftPx,
      y: pos.topPx,
      vx,
      vy,
      w: Math.ceil(btn.offsetWidth),
      h: Math.ceil(btn.offsetHeight),
      fieldW,
      fieldH
    };
  });
}

function bouncingStopMotion(){
  const st = State.bouncingGame;
  if (!st) return;

  if (st.rafId){
    cancelAnimationFrame(st.rafId);
    st.rafId = 0;
  }

  st.fieldEl = null;
  st.btnRefs = null;
  st.movers = null;
}

function bouncingStartMotion(fieldEl, btnRefs){
  const st = State.bouncingGame;
  if (!st || st.done) return;

  bouncingStopMotion();

  st.fieldEl = fieldEl;
  st.btnRefs = btnRefs;
  st.movers = bouncingBuildMovers(fieldEl, btnRefs);

  function tick(){
    const live = State.bouncingGame;
    if (!live || live !== st) return;
    if (State.screen !== Screen.GAME || State.activeGame !== "bouncing") return;
    if (st.done) return;
    if (!st.movers || !st.movers.length) return;

    const padX = 0;
    const padY = 16;

    for (const m of st.movers){
      const fieldW = fieldEl.clientWidth;
      const fieldH = fieldEl.clientHeight;

      const minX = padX;
      const maxX = Math.max(minX, fieldW - m.w - padX);
      const minY = padY;
      const maxY = Math.max(minY, fieldH - m.h - padY);

      m.x += m.vx;
      m.y += m.vy;

      if (m.x <= minX){
        m.x = minX;
        m.vx *= -1;
      }
      if (m.x >= maxX){
        m.x = maxX;
        m.vx *= -1;
      }
      if (m.y <= minY){
        m.y = minY;
        m.vy *= -1;
      }
      if (m.y >= maxY){
        m.y = maxY;
        m.vy *= -1;
      }

      m.btn.style.left = `${Math.round(m.x)}px`;
      m.btn.style.top = `${Math.round(m.y)}px`;
    }

    bouncingRefreshDebugOverlay(fieldEl);

    st.rafId = requestAnimationFrame(tick);
  }

  st.rafId = requestAnimationFrame(tick);
}

function startBouncingWordsGame(){
  const wordTokenIndices = scrambleWordTokenIndices();
  const meta = chainVerseMetaFromId(VERSE_ID);

  State.bouncingGame = {
    wordTokenIndices,
    builtCount: 0,
    choices: [],
    positions: [],
    done: false,
    wrongChoice: null,
    phase: "words",
    showRef: false,
    targetBook: meta.book,
    targetChapter: meta.chapter,
    targetVerse: meta.verse,
    score: 0,
    wrongGuesses: 0,
    startedAt: performance.now(),
    endedAt: 0,
    lastLayoutIndex: -1,
    rafId: 0,
    fieldEl: null,
    btnRefs: null,
    movers: null
  };

  bouncingNextChoices();
  State.bouncingGame.positions = [];
}

function bouncingRoundRefresh(){
  const st = State.bouncingGame;
  if (!st) return;
  bouncingNextChoices();
  st.positions = [];
}

function bouncingElapsedMs(){
  const st = State.bouncingGame;
  if (!st) return 0;
  return (st.endedAt || performance.now()) - st.startedAt;
}

function bouncingChoose(choice, btnEl, fieldEl){
  const st = State.bouncingGame;
  if (!st || st.done) return;

  let correctChoice = "";

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return;
    correctChoice = tokens[correctTokenIndex].text;
  } else if (st.phase === "book"){
    correctChoice = st.targetBook;
  } else if (st.phase === "ref"){
    correctChoice = `${st.targetChapter}:${st.targetVerse}`;
  } else {
    return;
  }

  const rectField = fieldEl.getBoundingClientRect();
  const rectBtn = btnEl.getBoundingClientRect();
  const popX = rectBtn.left - rectField.left + (rectBtn.width / 2);
  const popY = rectBtn.top - rectField.top - 6;

  if (choice !== correctChoice){
    st.score -= 25;
    st.wrongGuesses += 1;
    st.wrongChoice = choice;
    scrambleShowPopup(fieldEl, popX, popY, "-25", false);

    btnEl.classList.add("wrong");

    setTimeout(() => {
      btnEl.classList.remove("wrong");

      if (State.bouncingGame && State.bouncingGame.wrongChoice === choice){
        State.bouncingGame.wrongChoice = null;
      }
    }, 350);

    return;
  }

  st.score += 100;
  st.wrongChoice = null;
  scrambleShowPopup(fieldEl, popX, popY, "+100", true);

  const hitMover = st.movers?.find(m => m.btn === btnEl);
  if (hitMover){
    hitMover.btn.style.pointerEvents = "none";
    hitMover.btn.style.visibility = "hidden";
    hitMover.vx = 0;
    hitMover.vy = 0;
  }

  bouncingAnimateCorrectChoice(btnEl, fieldEl, () => {
    bouncingStopMotion();

    const live = State.bouncingGame;
    if (!live || live !== st) return;

    if (st.phase === "words"){
      st.builtCount += 1;

      if (st.builtCount >= st.wordTokenIndices.length){
        st.phase = "book";
        bouncingRoundRefresh();
        render();
        return;
      }

      bouncingRoundRefresh();
      render();
      return;
    }

    if (st.phase === "book"){
      st.phase = "ref";
      bouncingRoundRefresh();
      render();
      return;
    }

    if (st.phase === "ref"){
      st.phase = "done";
      st.done = true;
      st.showRef = true;
      st.endedAt = performance.now();
      st.choices = [];
      st.positions = [];
      render();
    }
  });
  
}

function scrambleBuiltVerseNode(){
  const p = document.createElement("p");
  p.className = "verse scramble-veerse";

  const st = State.scrambleGame;
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

function scrambleMakeChoices(wordTokenIndices, correctTokenIndex){
  const correctWord = tokens[correctTokenIndex].text;

  const verseWordsLower = wordTokenIndices
    .map(idx => tokens[idx].text.toLowerCase());

  const pool = VERSE_CHAIN_DECOY_WORDS
    .filter(word => word.toLowerCase() !== correctWord.toLowerCase())
    .filter((word, i, arr) => arr.indexOf(word) === i)
    .filter(word => !verseWordsLower.includes(word.toLowerCase()));

  shuffleArray(pool);

  const choices = [correctWord, ...pool.slice(0, 2)];
  shuffleArray(choices);
  return choices;
}

function scrambleMakeBookChoices(correctBook){
  const choices = [
    correctBook,
    ...chainPickRandomItems(BIBLE_BOOKS, 2, [correctBook])
  ];
  return shuffleArray(choices);
}

function scrambleMakeReferenceChoices(correctChapter, correctVerse){
  const correctRef = `${correctChapter}:${correctVerse}`;
  const refs = new Set([correctRef]);

  let tries = 0;
  while (refs.size < 3 && tries < 200){
    const chapterBump = Math.floor(Math.random() * 11) - 5;
    const verseBump = Math.floor(Math.random() * 21) - 10;

    let fakeChapter = correctChapter + chapterBump;
    let fakeVerse = correctVerse + verseBump;

    if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 5);
    if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 10);

    refs.add(`${fakeChapter}:${fakeVerse}`);
    tries += 1;
  }

  return shuffleArray(Array.from(refs));
}

function scrambleNextChoices(){
  const st = State.scrambleGame;
  if (!st) return;

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return;
    st.choices = scrambleMakeChoices(st.wordTokenIndices, correctTokenIndex);
    st.layoutSeeds = [];
    return;
  }

  if (st.phase === "book"){
    st.choices = scrambleMakeBookChoices(st.targetBook);
    st.layoutSeeds = [];
    return;
  }

  if (st.phase === "ref"){
    st.choices = scrambleMakeReferenceChoices(st.targetChapter, st.targetVerse);
    st.layoutSeeds = [];
    return;
  }

  st.choices = [];
  st.layoutSeeds = [];
}



function scrambleShowPopup(field, x, y, text, good){
  const pop = document.createElement("div");
  pop.className = `scramble-popup ${good ? "good" : "bad"}`;
  pop.textContent = text;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  field.appendChild(pop);

  setTimeout(() => {
    pop.remove();
  }, 650);
}

function scrambleDebugOverlay(fieldEl){
  if (!State.debugBounce || !fieldEl) return;

  fieldEl.querySelectorAll(".scramble-debug-line").forEach(el => el.remove());

  const padX = 6;

  const leftLine = document.createElement("div");
  leftLine.className = "scramble-debug-line";
  leftLine.style.left = `${padX}px`;
  fieldEl.appendChild(leftLine);

  const rightLine = document.createElement("div");
  rightLine.className = "scramble-debug-line";
  rightLine.style.right = `${padX}px`;
  fieldEl.appendChild(rightLine);
}


function startVerseScrambleGame(){
  const wordTokenIndices = scrambleWordTokenIndices();
  const meta = chainVerseMetaFromId(VERSE_ID);

  State.scrambleGame = {
    layoutSeeds: [],
    wordTokenIndices,
    builtCount: 0,
    choices: [],
    positions: [],
    colorSet: [],
    shapeSet: [],
    done: false,
    wrongChoice: null,
    phase: "words",
    showRef: false,
    targetBook: meta.book,
    targetChapter: meta.chapter,
    targetVerse: meta.verse,
    score: 0,
    wrongGuesses: 0,
    startedAt: performance.now(),
    endedAt: 0,
    lastLayoutIndex: -1
  };

  scrambleNextChoices();
  State.scrambleGame.positions = [];
}

function scrambleRoundRefresh(){
  const st = State.scrambleGame;
  if (!st) return;
  scrambleNextChoices();
  st.positions = [];
  st.colorSet = [];
  st.shapeSet = [];
}

function scrambleElapsedMs(){
  const st = State.scrambleGame;
  if (!st) return 0;
  return (st.endedAt || performance.now()) - st.startedAt;
}

function scrambleFormatTime(ms){
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins ? `${mins}m ${secs}s` : `${secs}s`;
}

function scrambleChoose(choice, btnEl, fieldEl){
  const st = State.scrambleGame;
  if (!st || st.done) return;

  let correctChoice = "";

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return;
    correctChoice = tokens[correctTokenIndex].text;
  } else if (st.phase === "book"){
    correctChoice = st.targetBook;
  } else if (st.phase === "ref"){
    correctChoice = `${st.targetChapter}:${st.targetVerse}`;
  } else {
    return;
  }

  const rectField = fieldEl.getBoundingClientRect();
  const rectBtn = btnEl.getBoundingClientRect();
  const popX = rectBtn.left - rectField.left + (rectBtn.width / 2);
  const popY = rectBtn.top - rectField.top - 6;

  if (choice !== correctChoice){
    st.score -= 25;
    st.wrongGuesses += 1;
    st.wrongChoice = choice;
    scrambleShowPopup(fieldEl, popX, popY, "-25", false);
    render();

    setTimeout(() => {
      if (State.scrambleGame && State.scrambleGame.wrongChoice === choice){
        State.scrambleGame.wrongChoice = null;
        render();
      }
    }, 350);

    return;
  }

  st.score += 100;
  st.wrongChoice = null;
  scrambleShowPopup(fieldEl, popX, popY, "+100", true);

  if (st.phase === "words"){
    st.builtCount += 1;

    if (st.builtCount >= st.wordTokenIndices.length){
      st.phase = "book";
      setTimeout(() => {
        scrambleRoundRefresh();
        render();
      }, 180);
      return;
    }

    setTimeout(() => {
      scrambleRoundRefresh();
      render();
    }, 180);
    return;
  }

  if (st.phase === "book"){
    st.phase = "ref";
    setTimeout(() => {
      scrambleRoundRefresh();
      render();
    }, 180);
    return;
  }

  if (st.phase === "ref"){
    st.phase = "done";
    st.done = true;
    st.showRef = true;
    st.endedAt = performance.now();
    st.choices = [];
    st.positions = [];
    render();
  }
}

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


/* =========================================================
    3. FOOD SLIDE CODE
   ========================================================= */


   
function foodSliceChooseMode(mode){
  const st = State.foodSliceGame;
  if (!st) return;

  foodSliceEnsureTheme();

  st.mode = mode;
  st.running = false;
  st.wordsBuilt = [];
  st.nextWordIndex = 0;
  st.activeFruit = null;
  st.activeBomb = null;
  st.activeSlices = [];
  st.bonusRound = false;
  st.bonusFruits = [];
  st.bonusBannerUntil = 0;
  st.bonusEndsAt = 0;
  st.bonusIdCounter = 0;
  st.phase = "words";
  st.targetBook = "";
  st.targetChapter = 0;
  st.targetVerse = 0;
  st.targetReference = "";
  st.phaseChoices = [];
  st.phaseChoiceIndex = 0;
  st.phase = "words";
  st.targetBook = "";
  st.targetChapter = 0;
  st.targetVerse = 0;
  st.targetReference = "";
  st.phaseChoices = [];
  st.phaseChoiceIndex = 0;
  st.wordTokenIndices = [];
  st.pendingIsCorrect = false;
  st.wrongStreak = 0;
  st.done = false;







  foodSliceStopMotion();


  render();
}

function foodSliceRenderModeSelect(stage, st, gameRoot){
  stage.innerHTML = "";

  const titleEl = gameRoot ? gameRoot.querySelector("#gameCoachTitle") : null;
  const actionsEl = gameRoot ? gameRoot.querySelector("#gameCoachActions") : null;

  if (titleEl){
    titleEl.textContent = "Choose Difficulty";
  }

  if (actionsEl){
    actionsEl.innerHTML = `
      <div class="foodslice-stage">
        <div class="foodslice-mode-wrap">
          <div class="foodslice-mode-inner">
            <div style="font-size:40px; line-height:1;">🍉🍓🍍</div>
            <div class="foodslice-title">Food Slice</div>
            <div class="foodslice-subtext">
              Choose your difficulty, then tap the correct flying word-fruit to build the verse.
            </div>

            <button class="carousel-main no-zoom" id="foodSliceModeEasy">Easy</button>
            <button class="carousel-main no-zoom" id="foodSliceModeMedium">Medium</button>
            <button class="carousel-main no-zoom" id="foodSliceModeHard">Hard</button>

            <div class="foodslice-subtext" style="max-width:520px;">
              Easy = wrong taps only flash red. Medium = lose 2 words. Hard = lose 2 words and watch out for bombs.
            </div>
          </div>
        </div>
      </div>
    `;

    const btnEasy = gameRoot.querySelector("#foodSliceModeEasy");
    const btnMedium = gameRoot.querySelector("#foodSliceModeMedium");
    const btnHard = gameRoot.querySelector("#foodSliceModeHard");

    if (btnEasy) btnEasy.onclick = () => foodSliceChooseMode("easy");
    if (btnMedium) btnMedium.onclick = () => foodSliceChooseMode("medium");
    if (btnHard) btnHard.onclick = () => foodSliceChooseMode("hard");
  }
}

function foodSliceBuiltVerseNode(){
  const p = document.createElement("p");
  p.className = "verse foodslice-verse";

  const st = State.foodSliceGame;
  const builtCount = st?.nextWordIndex || 0;

  const wordTokenIndices = [];
  for (let i = 0; i < tokens.length; i++){
    if (tokens[i].type === TokenType.WORD){
      wordTokenIndices.push(i);
    }
  }

  const builtSet = new Set(wordTokenIndices.slice(0, builtCount));

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

  if (!builtCount){
    p.innerHTML = `
      Slice the first correct fruit to start.<br>
      <span style="font-weight:600;">Build the verse one word at a time.</span>
    `;
    return p;
  }

  if (builtCount < wordTokenIndices.length){
    p.appendChild(document.createTextNode(" …"));
    return p;
  }

  const stPhase = st?.phase || "words";

  if (stPhase === "book"){
    p.innerHTML = `
      <span style="font-weight:900;">Verse complete!</span><br>
      <span style="font-weight:600;">Now slice the correct Bible book.</span>
    `;
    return p;
  }

  if (stPhase === "reference" && !st?.bonusRound){
    p.innerHTML = `
      <span style="font-weight:900;">Book complete!</span><br>
      <span style="font-weight:600;">Now slice the correct chapter and verse.</span>
    `;
    return p;
  }

  if (st?.bonusRound || st?.done){
    p.textContent = `${VERSE_REF} – ${VERSE_TEXT}`;
    return p;
  }

  p.appendChild(document.createTextNode(""));
  return p;
}


const FOOD_SLICE_FRUITS = ["🍎","🍐","🍊","🍋","🍉","🍇","🍓","🍒","🥝","🍍","🥥","🍑"];
const FOOD_SLICE_THEMES = [
  {
    id: "fruits",
    label: "Fruits",
    items: ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝"]
  },
  {
    id: "savory",
    label: "Savory",
    items: ["🍕","🍔","🍟","🌭","🍿","🥓","🥪","🥨","🌮","🌯","🥗","🥘","🍝","🍜","🍲","🍣","🍱"]
  },
  {
    id: "sweets",
    label: "Sweets",
    items: ["🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯"]
  },
  {
    id: "bakery",
    label: "Bakery",
    items: ["🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🥚","🍳"]
  },
  {
    id: "veggies",
    label: "Veggies",
    items: ["🥦","🥬","🥕","🌽","🌶️","🫑","🥒","🍆","🥑","🍄","🥔","🧅","🧄"]
  },
  {
    id: "proteins",
    label: "Proteins",
    items: ["🍗","🍖","🥩","🍤","🦀","🦞","🧀","🥚","🥛"]
  }
];

const FOOD_SLICE_WRONG_WORDS = [
  "apple","banana","happy","strong","light","water","garden","music","pencil","kitten",
  "rocket","castle","orange","purple","friend","helper","window","bread","honey","planet",
  "smile","gentle","brave","snow","thunder","paper","family","teacher","sunshine","forest"
];

function foodSlicePickRandomTheme(){
  const theme = FOOD_SLICE_THEMES[Math.floor(Math.random() * FOOD_SLICE_THEMES.length)];
  return {
    id: theme.id,
    label: theme.label,
    items: [...theme.items]
  };
}

function foodSliceEnsureTheme(){
  const st = State.foodSliceGame;
  if (!st) return;

  if (!st.themeId || !Array.isArray(st.foodPool) || !st.foodPool.length){
    const theme = foodSlicePickRandomTheme();
    st.themeId = theme.id;
    st.themeLabel = theme.label;
    st.foodPool = theme.items;
  }
}

function foodSliceRandomEmoji(){
  const st = State.foodSliceGame;
  if (!st) return "🍎";

  foodSliceEnsureTheme();

  if (!Array.isArray(st.foodPool) || !st.foodPool.length){
    return "🍎";
  }

  return st.foodPool[Math.floor(Math.random() * st.foodPool.length)];
}


function foodSliceWordTokenIndices(){
  const out = [];
  for (let i = 0; i < tokens.length; i++){
    if (tokens[i].type === TokenType.WORD){
      out.push(i);
    }
  }
  return out;
}

function foodSliceCurrentCorrectWord(){
  const st = State.foodSliceGame;
  if (!st) return "";

  const idxs = st.wordTokenIndices || [];
  const tokenIndex = idxs[st.nextWordIndex];
  if (!Number.isFinite(tokenIndex)) return "";
  return tokens[tokenIndex]?.text || "";
}

function foodSlicePickDisplayWord(){
  const st = State.foodSliceGame;
  if (!st) return "";

  if (st.phase === "book" || st.phase === "reference"){
    return foodSlicePickPhaseDisplayText();
  }

  const correctWord = foodSliceCurrentCorrectWord();
  const verseWordsLower = (st.wordTokenIndices || []).map(i => String(tokens[i]?.text || "").toLowerCase());

  const wrongPool = FOOD_SLICE_WRONG_WORDS.filter(word => {
    const lower = String(word).toLowerCase();
    return lower !== String(correctWord).toLowerCase() && !verseWordsLower.includes(lower);
  });

  const mustUseCorrect = st.wrongStreak >= 2;
  const useCorrect = mustUseCorrect || Math.random() < 0.6;

  if (useCorrect || !wrongPool.length){
    st.pendingIsCorrect = true;
    st.wrongStreak = 0;
    return correctWord;
  }

  const wrongWord = wrongPool[Math.floor(Math.random() * wrongPool.length)];
  st.pendingIsCorrect = false;
  st.wrongStreak += 1;
  return wrongWord;

}

function foodSliceSpawnOne(fieldEl){
  const st = State.foodSliceGame;
  if (!st || !fieldEl || st.done) return;

  const fieldW = Math.max(320, fieldEl.clientWidth || 0);
  const fieldH = Math.max(260, fieldEl.clientHeight || 0);

  const startX = 52 + Math.random() * Math.max(40, fieldW - 104);

  const peakRatio = fieldW >= 900 ? 0.16 : 0.24;
  const targetPeakY = fieldH * peakRatio;

  const startY = fieldH + 44;
  const riseDistance = Math.max(140, startY - targetPeakY);

  const gravity = 0.42;
  const baseVy = Math.sqrt(2 * gravity * riseDistance);
  const vy = -(baseVy + (Math.random() * 1.2 - 0.6));

  const horizontalRange = Math.max(1.0, Math.min(2.6, fieldW / 260));
  const vx = (Math.random() * 2 - 1) * horizontalRange;

  const spin = -6 + Math.random() * 12;

  const item = {
    fruit: foodSliceRandomEmoji(),

    word: foodSlicePickDisplayWord(),
    isCorrect: !!st.pendingIsCorrect,
    x: startX,
    y: startY,
    vx,
    vy,
    gravity,
    rotation: 0,
    spin,
    alive: true,
    wasTapped: false,
    flashWrong: false
  };


  st.activeFruit = item;
  st.activeBomb = null;
  foodSliceSpawnBomb(fieldEl);
}



function foodSliceStopMotion(){
  const st = State.foodSliceGame;
  if (!st?.rafId) return;
  cancelAnimationFrame(st.rafId);
  st.rafId = 0;
}

function foodSliceRenderField(fieldEl){
  const st = State.foodSliceGame;
  if (!st || !fieldEl) return;

  fieldEl.innerHTML = `<div class="foodslice-slice-layer" id="foodSliceSliceLayer"></div>`;

  const sliceLayer = fieldEl.querySelector("#foodSliceSliceLayer");
  const item = st.activeFruit;
  const bomb = st.activeBomb;
  const slices = Array.isArray(st.activeSlices) ? st.activeSlices : [];
  const bonusFruits = Array.isArray(st.bonusFruits) ? st.bonusFruits : [];
  const showBonusBanner = st.bonusRound && performance.now() < st.bonusBannerUntil;

  if ((!item || !item.alive) && (!bomb || !bomb.alive) && !slices.length && !bonusFruits.length && !showBonusBanner) return;



  if (!st.bonusRound && item && item.alive){
    const wrap = document.createElement("div");
    wrap.className = "foodslice-item";
    if (item.flashWrong) wrap.classList.add("wrong");
    wrap.style.transform = `translate(${item.x}px, ${item.y}px)`;

    const stack = document.createElement("div");
    stack.className = "foodslice-stack";

    const btn = document.createElement("button");
    btn.className = "foodslice-fruit-btn no-zoom";
    btn.type = "button";
    btn.setAttribute("aria-label", item.word ? `Fruit with word ${item.word}` : "Fruit");
    btn.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      foodSliceHandleTap();
    };

    const fruit = document.createElement("span");
    fruit.className = "foodslice-fruit-emoji";
    fruit.textContent = item.fruit;
    fruit.style.transform = `rotate(${item.rotation}deg)`;

    const word = document.createElement("div");
    word.className = "foodslice-word";
    word.textContent = item.word;

    btn.appendChild(fruit);
    stack.appendChild(btn);
    stack.appendChild(word);
    wrap.appendChild(stack);
    fieldEl.appendChild(wrap);
  }

  if (st.bonusRound && bonusFruits.length){
    for (const bonusItem of bonusFruits){
      if (!bonusItem || !bonusItem.alive) continue;

      const wrap = document.createElement("div");
      wrap.className = "foodslice-item";
      wrap.style.transform = `translate(${bonusItem.x}px, ${bonusItem.y}px)`;

      const stack = document.createElement("div");
      stack.className = "foodslice-stack";

      const btn = document.createElement("button");
      btn.className = "foodslice-fruit-btn no-zoom";
      btn.type = "button";
      btn.setAttribute("aria-label", "Bonus fruit");
      btn.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        foodSliceHandleBonusTap(bonusItem);
      };

      const fruit = document.createElement("span");
      fruit.className = "foodslice-fruit-emoji";
      fruit.textContent = bonusItem.fruit;
      fruit.style.transform = `rotate(${bonusItem.rotation}deg)`;

      btn.appendChild(fruit);
      stack.appendChild(btn);
      wrap.appendChild(stack);
      fieldEl.appendChild(wrap);
    }
  }


  if (bomb && bomb.alive){
    const bombWrap = document.createElement("div");
    bombWrap.className = "foodslice-item";
    if (bomb.wasHit) bombWrap.classList.add("bomb-hit");
    bombWrap.style.transform = `translate(${bomb.x}px, ${bomb.y}px)`;

    const bombStack = document.createElement("div");
    bombStack.className = "foodslice-stack";

    const bombBtn = document.createElement("button");
    bombBtn.className = "foodslice-bomb-btn no-zoom";
    bombBtn.type = "button";
    bombBtn.setAttribute("aria-label", "Bomb");
    bombBtn.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      foodSliceHandleBombTap();
    };

    const bombEmoji = document.createElement("span");
    bombEmoji.className = "foodslice-bomb-emoji";
    bombEmoji.textContent = "💣";
    bombEmoji.style.transform = `rotate(${bomb.rotation}deg)`;

    bombBtn.appendChild(bombEmoji);
    bombStack.appendChild(bombBtn);
    bombWrap.appendChild(bombStack);
    fieldEl.appendChild(bombWrap);
  }

  if (sliceLayer && slices.length){
    for (const piece of slices){
      if (!piece || !piece.alive) continue;

      const pieceEl = document.createElement("div");
      pieceEl.className = `foodslice-slice-piece ${piece.side}`;
      pieceEl.style.transform = `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotation}deg)`;

      const inner = document.createElement("div");
      inner.className = "foodslice-slice-inner";

      const emoji = document.createElement("span");
      emoji.className = "foodslice-slice-emoji";
      emoji.textContent = piece.fruit;

      inner.appendChild(emoji);
      pieceEl.appendChild(inner);
      sliceLayer.appendChild(pieceEl);
    }
  }

  if (showBonusBanner){
    const banner = document.createElement("div");
    banner.className = "foodslice-bonus-banner";
    banner.innerHTML = `<div class="foodslice-bonus-banner-text">BONUS ROUND!</div>`;
    fieldEl.appendChild(banner);
  }
}


/* =========================================================
   FOOD SLICE CODE
   ========================================================= */

   


function foodSliceStep(fieldEl){
  const st = State.foodSliceGame;
  if (!st || !fieldEl || !st.running) return;

  const fieldW = Math.max(320, fieldEl.clientWidth || 0);
  const fieldH = Math.max(260, fieldEl.clientHeight || 0);

  if (st.bonusRound){
    const now = performance.now();

    if (now >= st.bonusBannerUntil && now < st.bonusEndsAt){
      const liveCount = (st.bonusFruits || []).filter(item => item && item.alive).length;
      const targetCount = 2 + Math.floor(Math.random() * 2);

      if (liveCount < targetCount){
        foodSliceSpawnBonusFruit(fieldEl);
      }
    }

    if (Array.isArray(st.bonusFruits) && st.bonusFruits.length){
      for (const bonusItem of st.bonusFruits){
        if (!bonusItem || !bonusItem.alive) continue;

        bonusItem.x += bonusItem.vx;
        bonusItem.y += bonusItem.vy;
        bonusItem.vy += bonusItem.gravity;
        bonusItem.rotation += bonusItem.spin;

        if (bonusItem.x < 18) bonusItem.x = 18;
        if (bonusItem.x > fieldW - 18) bonusItem.x = fieldW - 18;

        if (bonusItem.y > fieldH + 120){
          bonusItem.alive = false;
        }
      }

      st.bonusFruits = st.bonusFruits.filter(item => item && item.alive);
    }

    if (Array.isArray(st.activeSlices) && st.activeSlices.length){
      for (const piece of st.activeSlices){
        if (!piece || !piece.alive) continue;

        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += piece.gravity;
        piece.rotation += piece.spin;

        if (piece.y > fieldH + 120){
          piece.alive = false;
        }
      }

      st.activeSlices = st.activeSlices.filter(piece => piece && piece.alive);
    }

    if (now >= st.bonusEndsAt && (!st.bonusFruits || !st.bonusFruits.length) && (!st.activeSlices || !st.activeSlices.length)){
      st.bonusRound = false;
      st.running = false;
      st.done = true;
      foodSliceStopMotion();
      render();
      return;
    }

    foodSliceRenderField(fieldEl);
  } else {
    if (!st.activeFruit || !st.activeFruit.alive){
      foodSliceSpawnOne(fieldEl);
    }

    const item = st.activeFruit;
    if (item){
      item.x += item.vx;
      item.y += item.vy;
      item.vy += item.gravity;
      item.rotation += item.spin;

      if (item.x < 18) item.x = 18;
      if (item.x > fieldW - 18) item.x = fieldW - 18;

      if (item.y > fieldH + 120){
        item.alive = false;
        st.activeFruit = null;
      }
    }

    const bomb = st.activeBomb;
    if (bomb){
      bomb.x += bomb.vx;
      bomb.y += bomb.vy;
      bomb.vy += bomb.gravity;
      bomb.rotation += bomb.spin;

      if (bomb.x < 18) bomb.x = 18;
      if (bomb.x > fieldW - 18) bomb.x = fieldW - 18;

      if (bomb.y > fieldH + 120){
        bomb.alive = false;
        st.activeBomb = null;
      }
    }

    if (Array.isArray(st.activeSlices) && st.activeSlices.length){
      for (const piece of st.activeSlices){
        if (!piece || !piece.alive) continue;

        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += piece.gravity;
        piece.rotation += piece.spin;

        if (piece.y > fieldH + 120){
          piece.alive = false;
        }
      }

      st.activeSlices = st.activeSlices.filter(piece => piece && piece.alive);
    }

    foodSliceRenderField(fieldEl);
  }
  


  st.rafId = requestAnimationFrame(() => foodSliceStep(fieldEl));
}

function foodSliceStartRound(){
  const st = State.foodSliceGame;
  if (!st) return;

  const meta = foodSliceVerseMeta();

  st.wordTokenIndices = foodSliceWordTokenIndices();
  st.nextWordIndex = 0;
  st.wordsBuilt = [];
  st.activeFruit = null;
  st.activeBomb = null;
  st.activeSlices = [];
  st.bonusRound = false;
  st.bonusFruits = [];
  st.bonusBannerUntil = 0;
  st.bonusEndsAt = 0;
  st.bonusIdCounter = 0;
  st.phase = "words";
  st.targetBook = meta.book;
  st.targetChapter = meta.chapter;
  st.targetVerse = meta.verse;
  st.targetReference = `${meta.chapter}:${meta.verse}`;
  st.phaseChoices = [];
  st.phaseChoiceIndex = 0;
  st.pendingIsCorrect = false;
  st.wrongStreak = 0;
  st.done = false;
  st.running = true;




}


function foodSliceRefreshVerseBox(){
  const stage = document.getElementById("gameStage");
  if (!stage || State.activeGame !== "foodslice") return;

  stage.innerHTML = "";
  stage.appendChild(foodSliceBuiltVerseNode());
}

function foodSliceClearFruitSoon(delayMs = 0, resumeAfter = false){
  const st = State.foodSliceGame;
  if (!st) return;

  window.setTimeout(() => {
    const live = State.foodSliceGame;
    if (!live) return;

    if (live.activeFruit){
      live.activeFruit.alive = false;
      live.activeFruit = null;
    }

    if (!resumeAfter && live.activeBomb && live.done){
      live.activeBomb.alive = false;
      live.activeBomb = null;
    }


    if (resumeAfter && !live.done){
      const field = document.getElementById("foodSliceField");
      if (field){
        live.running = true;
        foodSliceStopMotion();
        requestAnimationFrame(() => {
          foodSliceStep(field);
        });
      }
    }
  }, delayMs);
}


function foodSliceHandleTap(){
  const st = State.foodSliceGame;
  if (!st || !st.running || st.done) return;

  const item = st.activeFruit;
  if (!item || !item.alive || item.wasTapped) return;

  item.wasTapped = true;


if (item.isCorrect){
    foodSliceCreateSlicesFromFruit(item);

    if (st.phase === "words"){
      st.nextWordIndex += 1;
      st.wordsBuilt = st.wordTokenIndices.slice(0, st.nextWordIndex);
      foodSliceRefreshVerseBox();

      if (st.nextWordIndex >= st.wordTokenIndices.length){
        const field = document.getElementById("foodSliceField");
        if (field){
          foodSliceRenderField(field);
        }

        foodSliceClearFruitSoon(0);
        foodSliceStartBookPhase();
        return;
      }
    } else if (st.phase === "book"){
      const field = document.getElementById("foodSliceField");
      if (field){
        foodSliceRenderField(field);
      }

      foodSliceClearFruitSoon(0);
      foodSliceStartReferencePhase();
      return;
    } else if (st.phase === "reference"){
      const field = document.getElementById("foodSliceField");
      if (field){
        foodSliceRenderField(field);
      }

      foodSliceClearFruitSoon(0);
      foodSliceStartBonusRound();

      if (field){
        foodSliceStopMotion();
        requestAnimationFrame(() => {
          foodSliceStep(field);
        });
      }

      return;
    }

    const field = document.getElementById("foodSliceField");
    if (field){
      foodSliceRenderField(field);
    }

    foodSliceClearFruitSoon(0);
    return;
  }
  

  foodSliceApplyWrongPenalty();

  item.flashWrong = true;
  st.running = false;
  foodSliceStopMotion();


  const field = document.getElementById("foodSliceField");
  if (field){
    foodSliceRenderField(field);
  }

  foodSliceClearFruitSoon(260, true);
}

function foodSliceApplyWrongPenalty(){
  const st = State.foodSliceGame;
  if (!st) return;

  if (st.mode !== "medium" && st.mode !== "hard") return;
  if (st.phase !== "words") return;


  const removeCount = Math.min(2, st.nextWordIndex);
  if (removeCount <= 0) return;

  st.nextWordIndex -= removeCount;
  st.wordsBuilt = st.wordTokenIndices.slice(0, st.nextWordIndex);
  foodSliceRefreshVerseBox();
}

function foodSliceSpawnBomb(fieldEl){
  const st = State.foodSliceGame;
  if (!st || !fieldEl || st.mode !== "hard" || st.done) return;

  if (Math.random() >= 0.28) return;

  const fieldW = Math.max(320, fieldEl.clientWidth || 0);
  const fieldH = Math.max(260, fieldEl.clientHeight || 0);

  const startX = 52 + Math.random() * Math.max(40, fieldW - 104);

  const peakRatio = fieldW >= 900 ? 0.16 : 0.24;
  const targetPeakY = fieldH * peakRatio;

  const startY = fieldH + 44;
  const riseDistance = Math.max(140, startY - targetPeakY);

  const gravity = 0.42;
  const baseVy = Math.sqrt(2 * gravity * riseDistance);
  const vy = -(baseVy + (Math.random() * 1.2 - 0.6));

  const horizontalRange = Math.max(1.0, Math.min(2.6, fieldW / 260));
  const vx = (Math.random() * 2 - 1) * horizontalRange;

  const spin = -7 + Math.random() * 14;

  st.activeBomb = {
    x: startX,
    y: startY,
    vx,
    vy,
    gravity,
    rotation: 0,
    spin,
    alive: true,
    wasTapped: false,
    wasHit: false
  };
}

function foodSliceClearAllBuiltWords(){
  const st = State.foodSliceGame;
  if (!st) return;

  st.nextWordIndex = 0;
  st.wordsBuilt = [];
  foodSliceRefreshVerseBox();
}

function foodSliceHandleBombTap(){
  const st = State.foodSliceGame;
  if (!st || !st.running || st.done || st.bonusRound) return;


  const bomb = st.activeBomb;
  if (!bomb || !bomb.alive || bomb.wasTapped) return;

  bomb.wasTapped = true;
  bomb.wasHit = true;

  foodSliceClearAllBuiltWords();

  st.running = false;
  foodSliceStopMotion();

  const field = document.getElementById("foodSliceField");
  if (field){
    foodSliceRenderField(field);
  }

  window.setTimeout(() => {
    const live = State.foodSliceGame;
    if (!live) return;

    if (live.activeBomb){
      live.activeBomb.alive = false;
      live.activeBomb = null;
    }

    if (!live.done){
      const nextField = document.getElementById("foodSliceField");
      if (nextField){
        live.running = true;
        foodSliceStopMotion();
        requestAnimationFrame(() => {
          foodSliceStep(nextField);
        });
      }
    }
  }, 280);
}

function foodSliceCreateSlicesFromFruit(item){
  const st = State.foodSliceGame;
  if (!st || !item) return;

  const baseRotation = item.rotation || 0;

  st.activeSlices.push(
    {
      side: "left",
      fruit: item.fruit,
      x: item.x,
      y: item.y,
      vx: (item.vx || 0) - 1.6,
      vy: (item.vy || 0) - 1.8,
      gravity: item.gravity || 0.42,
      rotation: baseRotation - 10,
      spin: -4.5,
      alive: true
    },
    {
      side: "right",
      fruit: item.fruit,
      x: item.x,
      y: item.y,
      vx: (item.vx || 0) + 1.6,
      vy: (item.vy || 0) - 1.8,
      gravity: item.gravity || 0.42,
      rotation: baseRotation + 10,
      spin: 4.5,
      alive: true
    }
  );
}

function foodSliceStartBonusRound(){
  const st = State.foodSliceGame;
  if (!st) return;

  const now = performance.now();

  st.activeFruit = null;
  st.activeBomb = null;
  st.bonusRound = true;
  st.bonusFruits = [];
  st.bonusBannerUntil = now + 3000;
  st.bonusEndsAt = now + 23000;
  st.running = true;

  foodSliceRefreshVerseBox();
}

function foodSliceSpawnBonusFruit(fieldEl){
  const st = State.foodSliceGame;
  if (!st || !fieldEl) return;

  const fieldW = Math.max(320, fieldEl.clientWidth || 0);
  const fieldH = Math.max(260, fieldEl.clientHeight || 0);

  const startX = 52 + Math.random() * Math.max(40, fieldW - 104);

  const peakRatio = fieldW >= 900 ? 0.16 : 0.24;
  const targetPeakY = fieldH * peakRatio;

  const startY = fieldH + 44;
  const riseDistance = Math.max(140, startY - targetPeakY);

  const gravity = 0.42;
  const baseVy = Math.sqrt(2 * gravity * riseDistance);
  const vy = -(baseVy + (Math.random() * 1.2 - 0.6));

  const horizontalRange = Math.max(1.0, Math.min(2.6, fieldW / 260));
  const vx = (Math.random() * 2 - 1) * horizontalRange;

  const spin = -6 + Math.random() * 12;

  st.bonusIdCounter += 1;

  st.bonusFruits.push({
    id: st.bonusIdCounter,
    fruit: foodSliceRandomEmoji(),
    x: startX,
    y: startY,
    vx,
    vy,
    gravity,
    rotation: 0,
    spin,
    alive: true,
    wasTapped: false
  });
}

function foodSliceHandleBonusTap(bonusItem){
  const st = State.foodSliceGame;
  if (!st || !st.running || !st.bonusRound || !bonusItem || bonusItem.wasTapped) return;

  bonusItem.wasTapped = true;
  foodSliceCreateSlicesFromFruit(bonusItem);
  bonusItem.alive = false;

  st.bonusFruits = st.bonusFruits.filter(item => item && item.alive);

  const field = document.getElementById("foodSliceField");
  if (field){
    foodSliceRenderField(field);
  }
}

function foodSliceVerseMeta(){
  return chainVerseMetaFromId(VERSE_ID);
}

function foodSliceCurrentTargetText(){
  const st = State.foodSliceGame;
  if (!st) return "";

  if (st.phase === "book"){
    return st.targetBook || "";
  }

  if (st.phase === "reference"){
    return st.targetReference || "";
  }

  return foodSliceCurrentCorrectWord();
}

function foodSliceMakeBookChoices(correctBook){
  const choices = [
    correctBook,
    ...chainPickRandomItems(BIBLE_BOOKS, 3, [correctBook])
  ];
  return shuffleArray(choices);
}

function foodSliceMakeReferenceChoices(correctChapter, correctVerse){
  const correctRef = `${correctChapter}:${correctVerse}`;
  const refs = new Set([correctRef]);

  let tries = 0;
  while (refs.size < 4 && tries < 200){
    const chapterBump = Math.floor(Math.random() * 11) - 5;
    const verseBump = Math.floor(Math.random() * 21) - 10;

    let fakeChapter = correctChapter + chapterBump;
    let fakeVerse = correctVerse + verseBump;

    if (fakeChapter < 1) fakeChapter = 1 + Math.floor(Math.random() * 5);
    if (fakeVerse < 1) fakeVerse = 1 + Math.floor(Math.random() * 10);

    refs.add(`${fakeChapter}:${fakeVerse}`);
    tries += 1;
  }

  return shuffleArray(Array.from(refs));
}

function foodSliceStartBookPhase(){
  const st = State.foodSliceGame;
  if (!st) return;

  const meta = foodSliceVerseMeta();

  st.phase = "book";
  st.targetBook = meta.book;
  st.targetChapter = meta.chapter;
  st.targetVerse = meta.verse;
  st.targetReference = `${meta.chapter}:${meta.verse}`;
  st.phaseChoices = foodSliceMakeBookChoices(meta.book);
  st.phaseChoiceIndex = 0;
  st.activeFruit = null;
  st.activeBomb = null;
  st.wrongStreak = 0;
  foodSliceRefreshVerseBox();
}


function foodSliceStartReferencePhase(){
  const st = State.foodSliceGame;
  if (!st) return;

  st.phase = "reference";
  st.targetReference = `${st.targetChapter}:${st.targetVerse}`;
  st.phaseChoices = foodSliceMakeReferenceChoices(st.targetChapter, st.targetVerse);
  st.phaseChoiceIndex = 0;
  st.activeFruit = null;
  st.activeBomb = null;
  st.wrongStreak = 0;
  foodSliceRefreshVerseBox();
}


function foodSlicePickPhaseDisplayText(){
  const st = State.foodSliceGame;
  if (!st) return "";

  if (!Array.isArray(st.phaseChoices) || !st.phaseChoices.length){
    return "";
  }

  const mustUseCorrect = st.wrongStreak >= 2;
  const correct = foodSliceCurrentTargetText();
  const useCorrect = mustUseCorrect || Math.random() < 0.6;

  let choice = correct;

  if (!useCorrect){
    const wrongs = st.phaseChoices.filter(x => x !== correct);
    if (wrongs.length){
      choice = wrongs[Math.floor(Math.random() * wrongs.length)];
    }
  }

  st.pendingIsCorrect = (choice === correct);

  if (st.pendingIsCorrect){
    st.wrongStreak = 0;
  } else {
    st.wrongStreak += 1;
  }

  return choice;
}
   
registerGame({
  id: "foodslice",
  title: "Food Slice",
  description: "Slice the correct flying word-fruit to build the verse.",

  start(stage){
    if (!State.foodSliceGame){
      State.foodSliceGame = {
        mode: null,
        running: false,
        wordsBuilt: [],
        nextWordIndex: 0,
        activeFruit: null,
        activeBomb: null,
        activeSlices: [],
        bonusRound: false,
        bonusFruits: [],
        bonusBannerUntil: 0,
        bonusEndsAt: 0,
        bonusIdCounter: 0,
        themeId: "",
        themeLabel: "",
        foodPool: [],
        phase: "words",
        targetBook: "",
        targetChapter: 0,
        targetVerse: 0,
        targetReference: "",
        phaseChoices: [],
        phaseChoiceIndex: 0,
        wordTokenIndices: [],
        pendingIsCorrect: false,
        wrongStreak: 0,
        rafId: 0,
        done: false

      };

      foodSliceEnsureTheme();
    }


    const st = State.foodSliceGame;
    const gameRoot = stage.closest(".learn-layout");

    if (!st.mode){
      foodSliceRenderModeSelect(stage, st, gameRoot);
      return;
    }

    stage.innerHTML = "";
    stage.appendChild(foodSliceBuiltVerseNode());



    const titleEl = gameRoot ? gameRoot.querySelector("#gameCoachTitle") : null;
    const actionsEl = gameRoot ? gameRoot.querySelector("#gameCoachActions") : null;

    if (titleEl){
      titleEl.textContent = "";
    }


    if (actionsEl){
      if (st.done){
        actionsEl.innerHTML = `
          <div class="foodslice-stage">
            <div class="foodslice-placeholder">
              <div class="foodslice-placeholder-inner">
                <div style="font-size:42px; line-height:1;">🎉</div>
                <div class="foodslice-title">Great Job!</div>
                <div class="foodslice-subtext">
                  You finished the verse in ${st.mode.charAt(0).toUpperCase() + st.mode.slice(1)} mode.
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }

      actionsEl.innerHTML = `
        <div class="foodslice-stage">
          <div class="foodslice-field" id="foodSliceField"></div>
        </div>
      `;

      const field = gameRoot.querySelector("#foodSliceField");

      if (!st.running){
        foodSliceStartRound();
      }

      foodSliceStopMotion();
      foodSliceRenderField(field);

      requestAnimationFrame(() => {
        foodSliceStep(field);
      });
    }



  }
});




/* =========================================================
    4. VERSE CHAIN CODE
   ========================================================= */

function chainWordTokenIndices(){
  const out = [];
  for (let i = 0; i < tokens.length; i++){
    if (tokens[i].type === TokenType.WORD){
      out.push(i);
    }
  }
  return out;
}

function chainBuiltVerseNode(){
  const p = document.createElement("p");
  p.className = "verse";

  const st = State.chainGame;
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

function chainMakeChoices(wordTokenIndices, correctTokenIndex){
  const correctWord = tokens[correctTokenIndex].text;

  const verseWordsLower = wordTokenIndices
    .map(idx => tokens[idx].text.toLowerCase());

  const pool = VERSE_CHAIN_DECOY_WORDS
    .filter(word => word.toLowerCase() !== correctWord.toLowerCase())
    .filter((word, i, arr) => arr.indexOf(word) === i)
    .filter(word => !verseWordsLower.includes(word.toLowerCase()));

  shuffleArray(pool);

  const choices = [correctWord, ...pool.slice(0, 3)];
  return shuffleArray(choices);
}


function startVerseChainGame(){
  const wordTokenIndices = chainWordTokenIndices();

  const meta = chainVerseMetaFromId(VERSE_ID);

  State.chainGame = {
    wordTokenIndices,
    builtCount: 0,
    choices: [],
    choiceIndex: 0,
    done: false,
    wrongChoice: null,
    phase: "words",
    showRef: false,
    targetBook: meta.book,
    targetChapter: meta.chapter,
    targetVerse: meta.verse,
  };

  const firstTokenIndex = wordTokenIndices[0];
  if (Number.isFinite(firstTokenIndex)){
    State.chainGame.choices = chainMakeChoices(wordTokenIndices, firstTokenIndex);
    chainSetRandomChoiceIndex();
  }
}

function chainPrevChoice(){
  const st = State.chainGame;
  if (!st || st.done || !st.choices.length) return;
  st.choiceIndex = (st.choiceIndex - 1 + st.choices.length) % st.choices.length;
  render();
}

function chainNextChoice(){
  const st = State.chainGame;
  if (!st || st.done || !st.choices.length) return;
  st.choiceIndex = (st.choiceIndex + 1) % st.choices.length;
  render();
}

function chainCurrentChoice(){
  const st = State.chainGame;
  if (!st || !st.choices.length) return "";
  return st.choices[st.choiceIndex];
}

function chainChoose(word){
  const st = State.chainGame;
  if (!st || st.done) return;

  if (st.phase === "words"){
    const correctTokenIndex = st.wordTokenIndices[st.builtCount];
    if (!Number.isFinite(correctTokenIndex)) return;

    const correctWord = tokens[correctTokenIndex].text;

    if (word === correctWord){
      st.builtCount += 1;
      st.wrongChoice = null;

      if (st.builtCount >= st.wordTokenIndices.length){
        st.phase = "book";
        st.choices = chainMakeBookChoices(st.targetBook);
        chainSetRandomChoiceIndex();
        render();
        return;
      }

      const nextTokenIndex = st.wordTokenIndices[st.builtCount];
      st.choices = chainMakeChoices(st.wordTokenIndices, nextTokenIndex);
      chainSetRandomChoiceIndex();
      render();
      return;
    }

    st.wrongChoice = word;
    render();

    setTimeout(() => {
      if (State.chainGame && State.chainGame.wrongChoice === word){
        State.chainGame.wrongChoice = null;
        render();
      }
    }, 350);

    return;
  }

  if (st.phase === "book"){
    if (word === st.targetBook){
      st.phase = "ref";
      st.wrongChoice = null;
      st.choices = chainMakeReferenceChoices(st.targetChapter, st.targetVerse);
      chainSetRandomChoiceIndex();
      render();
      return;
    }

    st.wrongChoice = word;
    render();

    setTimeout(() => {
      if (State.chainGame && State.chainGame.wrongChoice === word){
        State.chainGame.wrongChoice = null;
        render();
      }
    }, 350);

    return;
  }

  if (st.phase === "ref"){
    const correctRef = `${st.targetChapter}:${st.targetVerse}`;

    if (word === correctRef){
      st.phase = "done";
      st.done = true;
      st.showRef = true;
      st.wrongChoice = null;
      st.choices = [];
      render();
      return;
    }

    st.wrongChoice = word;
    render();

    setTimeout(() => {
      if (State.chainGame && State.chainGame.wrongChoice === word){
        State.chainGame.wrongChoice = null;
        render();
      }
    }, 350);

    return;
  }
}


registerGame({
  id: "chain",
  title: "Verse Chain",
  description: "Use the arrows to find the next word, then tap it.",
  start(stage){
    if (!State.chainGame){
      startVerseChainGame();
    }

    const st = State.chainGame;

    stage.innerHTML = "";

    const verseBox = document.createElement("div");
    verseBox.style.width = "100%";
    verseBox.style.maxWidth = "760px";
    verseBox.style.minHeight = "140px";
    verseBox.style.display = "flex";
    verseBox.style.alignItems = "center";
    verseBox.style.justifyContent = "center";
    verseBox.style.textAlign = "center";
    verseBox.appendChild(chainBuiltVerseNode());

    stage.appendChild(verseBox);

    const gameLayout = stage.closest(".learn-layout");
    const coachTitle = gameLayout?.querySelector("#gameCoachTitle");
    const coachActions = gameLayout?.querySelector("#gameCoachActions");


    if (coachTitle) coachTitle.textContent = "";

    if (coachActions){
      coachActions.innerHTML = "";

    if (st.done){
      const doneMsg = document.createElement("div");
      doneMsg.className = "small";
      doneMsg.style.fontWeight = "900";
      doneMsg.style.textAlign = "center";
      doneMsg.style.maxWidth = "520px";
      doneMsg.textContent = "Great job! You finished the verse! Tap Back below to go back to Practice Games.";
      coachActions.appendChild(doneMsg);
      return;
    }

      const row = document.createElement("div");
      row.className = "game-carousel-row";

      const prevBtn = document.createElement("button");
      prevBtn.className = "carousel-arrow no-zoom";
      prevBtn.type = "button";
      prevBtn.innerHTML = SVG_BACK;
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        chainPrevChoice();
      };

      const mainBtn = document.createElement("button");
      mainBtn.className = "carousel-main no-zoom";
      mainBtn.type = "button";
      mainBtn.textContent = chainCurrentChoice();
      mainBtn.style.margin = "0";

      if (st.wrongChoice === chainCurrentChoice()){
        mainBtn.style.background = "#ffb3b3";
        mainBtn.style.color = "#7a1111";
        mainBtn.style.boxShadow = "0 4px 0 rgba(122,17,17,0.25)";
      }

      mainBtn.onclick = (e) => {
        e.stopPropagation();
        chainChoose(chainCurrentChoice());
      };

      const nextBtn = document.createElement("button");
      nextBtn.className = "carousel-arrow no-zoom";
      nextBtn.type = "button";
      nextBtn.innerHTML = SVG_FORWARD;
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        chainNextChoice();
      };

      row.appendChild(prevBtn);
      row.appendChild(mainBtn);
      row.appendChild(nextBtn);
      coachActions.appendChild(row);

      const dots = document.createElement("div");
      dots.className = "carousel-dots";
      dots.innerHTML = st.choices.map((_, i) =>
        `<span class="carousel-dot ${i === st.choiceIndex ? "active" : ""}"></span>`
      ).join("");

      coachActions.appendChild(dots);
    }
  }
});
   
/* =========================================================
    5. TOWER OF BIBLE CODE
   ========================================================= */
function startTowerGame(){
  const wordTokenIndices = chainWordTokenIndices();
  const meta = chainVerseMetaFromId(VERSE_ID);

  State.towerGame = {
    wordTokenIndices,
    targetBook: meta.book,
    targetChapter: meta.chapter,
    targetVerse: meta.verse,
    mode: null,
    progress: [],
    choices: [],
    choiceIndex: 0,
    wrongChoice: null,
    done: false,
    isAnimating: false,
    pendingSpawnIndex: -1
  };
}

function towerProgressWordCount(st){
  return st.progress.filter(x => x.type === "word").length;
}

function towerHasBook(st){
  return st.progress.some(x => x.type === "book");
}

function towerHasRef(st){
  return st.progress.some(x => x.type === "ref");
}

function towerCurrentPhase(st){
  if (!st || !st.mode) return "mode";
  if (towerHasRef(st)) return "done";
  if (towerHasBook(st)) return "ref";
  if (towerProgressWordCount(st) >= st.wordTokenIndices.length) return "book";
  return "words";
}

function towerCurrentCorrectLabel(st){
  const phase = towerCurrentPhase(st);

  if (phase === "words"){
    const builtWordCount = towerProgressWordCount(st);
    const correctTokenIndex = st.wordTokenIndices[builtWordCount];
    if (!Number.isFinite(correctTokenIndex)) return "";
    return tokens[correctTokenIndex].text;
  }

  if (phase === "book"){
    return st.targetBook;
  }

  if (phase === "ref"){
    return `${st.targetChapter}:${st.targetVerse}`;
  }

  return "";
}

function towerSetRandomChoiceIndex(){
  const st = State.towerGame;
  if (!st || !st.choices.length){
    if (st) st.choiceIndex = 0;
    return;
  }
  st.choiceIndex = Math.floor(Math.random() * st.choices.length);
}

function towerMakeChoices(st){
  const phase = towerCurrentPhase(st);

  if (phase === "words"){
    const builtWordCount = towerProgressWordCount(st);
    const correctTokenIndex = st.wordTokenIndices[builtWordCount];
    if (!Number.isFinite(correctTokenIndex)) return [];
    return chainMakeChoices(st.wordTokenIndices, correctTokenIndex);
  }

  if (phase === "book"){
    return chainMakeBookChoices(st.targetBook);
  }

  if (phase === "ref"){
    return chainMakeReferenceChoices(st.targetChapter, st.targetVerse);
  }

  return [];
}

function towerRefreshChoices(){
  const st = State.towerGame;
  if (!st || !st.mode) return;
  st.choices = towerMakeChoices(st);
  towerSetRandomChoiceIndex();
}

function towerCurrentChoice(){
  const st = State.towerGame;
  if (!st || !st.choices.length) return "";
  return st.choices[st.choiceIndex];
}

function towerPrevChoice(){
  const st = State.towerGame;
  if (!st || st.done || !st.mode || !st.choices.length || st.isAnimating) return;
  st.choiceIndex = (st.choiceIndex - 1 + st.choices.length) % st.choices.length;
  render();
}

function towerNextChoice(){
  const st = State.towerGame;
  if (!st || st.done || !st.mode || !st.choices.length || st.isAnimating) return;
  st.choiceIndex = (st.choiceIndex + 1) % st.choices.length;
  render();
}

function towerModeLabel(mode){
  if (mode === "easy") return "Easy";
  if (mode === "medium") return "Medium";
  if (mode === "hard") return "Hard";
  return "";
}

function towerChooseMode(mode){
  const st = State.towerGame;
  if (!st) return;

  st.mode = mode;
  st.progress = [];
  st.done = false;
  st.wrongChoice = null;
  st.isAnimating = false;
  st.pendingSpawnIndex = -1;
  towerRefreshChoices();
  render();
}

function towerShrinkScale(bottomLevel){
  return Math.max(0.70, 1 - (bottomLevel * 0.015));
}

function towerBrickOpacity(bottomLevel){
  return Math.max(0.28, 0.67 - (bottomLevel * 0.035));
}

function towerBrickBottom(bottomLevel){
  return -6 + (bottomLevel * 56);
}

function towerApplyBrickStyles(brickEl, bottomLevel){
  const scale = towerShrinkScale(bottomLevel);
  brickEl.style.bottom = `${towerBrickBottom(bottomLevel)}px`;
  brickEl.style.width = `${(74 * scale).toFixed(2)}%`;
  brickEl.style.fontSize = `${Math.max(18, 30 * scale).toFixed(2)}px`;
  brickEl.style.opacity = `${towerBrickOpacity(bottomLevel).toFixed(3)}`;
}

function towerAnimateAddBrick(st, onDone){
  const shellEl = document.getElementById("towerStackShell");
  if (!shellEl){
    onDone();
    return;
  }

  const bricks = Array.from(shellEl.querySelectorAll(".tower-brick"));
  const newTotal = bricks.length + 1;

  bricks.forEach((brickEl, i) => {
    const newBottomLevel = newTotal - 1 - i;
    towerApplyBrickStyles(brickEl, newBottomLevel);
  });

  const newBrickEl = document.createElement("div");
  newBrickEl.className = "tower-brick spawn-in";
  newBrickEl.textContent = towerCurrentCorrectLabel(st) || "";
  towerApplyBrickStyles(newBrickEl, 0);
  shellEl.appendChild(newBrickEl);

  setTimeout(() => {
    onDone();
  }, 390);
}

function towerAnimateMediumLoss(st){
  const shellEl = document.getElementById("towerStackShell");
  const removeCount = Math.min(2, st.progress.length);

  if (!shellEl || removeCount <= 0){
    if (removeCount > 0){
      st.progress.splice(st.progress.length - removeCount, removeCount);
    }
    towerSyncAfterLoss(st);
    st.isAnimating = false;
    render();
    return;
  }

  const brickEls = Array.from(shellEl.querySelectorAll(".tower-brick"));
  const removedEls = brickEls.slice(-removeCount);
  const survivorEls = brickEls.slice(0, -removeCount);

  removedEls.forEach(el => el.classList.add("crumble-out"));

  setTimeout(() => {
    removedEls.forEach(el => el.remove());

    const newTotal = survivorEls.length;
    survivorEls.forEach((el, i) => {
      const newBottomLevel = newTotal - 1 - i;
      towerApplyBrickStyles(el, newBottomLevel);
      el.classList.add("settle-down");

      setTimeout(() => {
        el.classList.remove("settle-down");
      }, 240);
    });
  }, 220);

  setTimeout(() => {
    st.progress.splice(st.progress.length - removeCount, removeCount);
    towerSyncAfterLoss(st);
    st.isAnimating = false;
    render();
  }, 620);
}

function towerAnimateHardLoss(st){
  const shellEl = document.getElementById("towerStackShell");

  if (!shellEl){
    st.progress = [];
    towerSyncAfterLoss(st);
    st.isAnimating = false;
    render();
    return;
  }

  const brickEls = Array.from(shellEl.querySelectorAll(".tower-brick"));

  if (!brickEls.length){
    st.progress = [];
    towerSyncAfterLoss(st);
    st.isAnimating = false;
    render();
    return;
  }

  let tallestTop = 0;

  brickEls.forEach((el) => {
    const bottomPx = parseFloat(el.style.bottom || "0") || 0;
    const topPx = bottomPx + el.offsetHeight;
    if (topPx > tallestTop) tallestTop = topPx;
  });

  shellEl.style.height = `${Math.max(1, Math.ceil(tallestTop))}px`;

  // force layout so the browser sees the new height before the animation starts
  shellEl.getBoundingClientRect();

  shellEl.classList.add("sink-away");

  setTimeout(() => {
    st.progress = [];
    towerSyncAfterLoss(st);
    st.isAnimating = false;
    render();
  }, 1600);
}

function towerSyncAfterLoss(st){
  st.done = towerCurrentPhase(st) === "done";
  towerRefreshChoices();
}

function towerApplyPenalty(st){
  if (!st) return;

  if (st.mode === "easy"){
    st.isAnimating = false;
    return;
  }

  if (st.mode === "medium"){
    towerAnimateMediumLoss(st);
    return;
  }

  if (st.mode === "hard"){
    towerAnimateHardLoss(st);
    return;
  }

  st.isAnimating = false;
}

function towerFlashWrong(word, withPenalty){
  const st = State.towerGame;
  if (!st) return;

  st.wrongChoice = word;
  render();

  setTimeout(() => {
    const live = State.towerGame;
    if (!live) return;

    if (live.wrongChoice === word){
      live.wrongChoice = null;
      render();
    }

    if (withPenalty){
      towerApplyPenalty(live);
    }
  }, 320);
}

function towerChoose(choice){
  const st = State.towerGame;
  if (!st || !st.mode || st.done || st.isAnimating) return;

  const phase = towerCurrentPhase(st);
  const correct = towerCurrentCorrectLabel(st);

  if (!correct) return;

  if (choice !== correct){
    st.isAnimating = st.mode === "medium" || st.mode === "hard";
    towerFlashWrong(choice, st.mode === "medium" || st.mode === "hard");
    return;
  }

  st.wrongChoice = null;
  st.isAnimating = true;

  towerAnimateAddBrick(st, () => {
    const live = State.towerGame;
    if (!live) return;

    if (phase === "words"){
      live.progress.push({
        type: "word",
        label: correct
      });
      live.pendingSpawnIndex = live.progress.length - 1;
      live.isAnimating = false;
      towerRefreshChoices();
      render();
      return;
    }

    if (phase === "book"){
      live.progress.push({
        type: "book",
        label: correct
      });
      live.pendingSpawnIndex = -1;
      live.isAnimating = false;
      towerRefreshChoices();
      render();
      return;
    }

    if (phase === "ref"){
      live.progress.push({
        type: "ref",
        label: correct
      });
      live.pendingSpawnIndex = -1;
      live.done = true;
      live.choices = [];
      live.isAnimating = false;
      render();
    }
  });
}


function towerRenderModeSelect(stage, st, gameRoot){
  stage.innerHTML = `
    <div class="tower-stage">
      <div class="tower-cloud cloud-1">${SVG_TOWER_CLOUD}</div>
      <div class="tower-cloud cloud-2">${SVG_TOWER_CLOUD}</div>

      <div class="tower-mode-wrap">
        <div class="tower-mode-card">
          <h3>Tower of Bible</h3>
          <p>Choose your difficulty, then build the tower one correct word at a time.</p>

          <div class="tower-mode-buttons">
            <button class="tower-mode-btn no-zoom" id="towerModeEasy">Easy</button>
            <button class="tower-mode-btn no-zoom" id="towerModeMedium">Medium</button>
            <button class="tower-mode-btn no-zoom" id="towerModeHard">Hard</button>
          </div>
        </div>
      </div>
    </div>
  `;

  stage.querySelector("#towerModeEasy").onclick = () => towerChooseMode("easy");
  stage.querySelector("#towerModeMedium").onclick = () => towerChooseMode("medium");
  stage.querySelector("#towerModeHard").onclick = () => towerChooseMode("hard");

  const titleEl = gameRoot ? gameRoot.querySelector("#gameCoachTitle") : null;
  const actionsEl = gameRoot ? gameRoot.querySelector("#gameCoachActions") : null;

  if (titleEl){
    titleEl.textContent = "Choose Difficulty";
  }

  if (actionsEl){
    actionsEl.innerHTML = `
          <div class="tower-status-line">Easy = wrong answer flashes. Medium = lose 2 newest bricks. Hard = lose the whole tower.</div>
    `;
  }
}

function towerRenderBricks(fieldEl, st){
  const total = st.progress.length;

  for (let i = 0; i < total; i++){
    const brick = st.progress[i];
    const bottomLevel = total - 1 - i;

    const brickEl = document.createElement("div");
    brickEl.className = "tower-brick";
    brickEl.textContent = brick.label;

    towerApplyBrickStyles(brickEl, bottomLevel);

    fieldEl.appendChild(brickEl);
  }

  if (st.pendingSpawnIndex !== -1){
    st.pendingSpawnIndex = -1;
  }
}

function towerRenderStage(stage, st){
  const showStartOverlay = !st.done && st.progress.length === 0 && st.mode;

  let towerStage = stage.querySelector(".tower-stage");

  if (!towerStage){
    stage.innerHTML = `
      <div class="tower-stage">
        <div class="tower-cloud cloud-1">${SVG_TOWER_CLOUD}</div>
        <div class="tower-cloud cloud-2">${SVG_TOWER_CLOUD}</div>
        <div class="tower-stack-field" id="towerStackField">
          <div class="tower-stack-shell" id="towerStackShell"></div>
        </div>
      </div>
    `;
    towerStage = stage.querySelector(".tower-stage");
  }

  let fieldEl = towerStage.querySelector("#towerStackField");
  if (!fieldEl){
    fieldEl = document.createElement("div");
    fieldEl.className = "tower-stack-field";
    fieldEl.id = "towerStackField";
    towerStage.appendChild(fieldEl);
  }

  let shellEl = towerStage.querySelector("#towerStackShell");
  if (!shellEl){
    shellEl = document.createElement("div");
    shellEl.className = "tower-stack-shell";
    shellEl.id = "towerStackShell";
    fieldEl.appendChild(shellEl);
  }

  shellEl.innerHTML = "";
  towerRenderBricks(shellEl, st);

  const oldStart = towerStage.querySelector(".tower-start");
  if (oldStart) oldStart.remove();

  const oldWin = towerStage.querySelector(".tower-win");
  if (oldWin) oldWin.remove();

  if (showStartOverlay){
    const startEl = document.createElement("div");
    startEl.className = "tower-start";
    startEl.innerHTML = `<div class="tower-start-text">Tap the first word to start your tower.</div>`;
    towerStage.appendChild(startEl);
  }

  if (st.done){
    const winEl = document.createElement("div");
    winEl.className = "tower-win";
    winEl.innerHTML = `<div class="tower-win-text">You completed the Tower of Bible!</div>`;
    towerStage.appendChild(winEl);
  }
}

function towerRenderCoach(st, gameRoot){
  const titleEl = gameRoot ? gameRoot.querySelector("#gameCoachTitle") : null;
  const actionsEl = gameRoot ? gameRoot.querySelector("#gameCoachActions") : null;
  if (!actionsEl) return;

  const currentChoice = towerCurrentChoice();

  if (titleEl){
    titleEl.textContent = "";
  }

  actionsEl.innerHTML = st.done ? `` : `
    <div class="game-carousel-row">
      <button class="carousel-arrow no-zoom" id="towerPrev" aria-label="Previous">${SVG_BACK}</button>
      <button class="carousel-main no-zoom tower-choice-btn ${st.wrongChoice === currentChoice ? "wrong" : ""}" id="towerChooseBtn">${currentChoice}</button>
      <button class="carousel-arrow no-zoom" id="towerNext" aria-label="Next">${SVG_FORWARD}</button>
    </div>
  `;

  if (st.done) return;

  const btnPrev = gameRoot ? gameRoot.querySelector("#towerPrev") : null;
  const btnNext = gameRoot ? gameRoot.querySelector("#towerNext") : null;
  const btnChoose = gameRoot ? gameRoot.querySelector("#towerChooseBtn") : null;

  if (btnPrev) btnPrev.onclick = (e) => { e.stopPropagation(); towerPrevChoice(); };
  if (btnNext) btnNext.onclick = (e) => { e.stopPropagation(); towerNextChoice(); };
  if (btnChoose) btnChoose.onclick = (e) => {
    e.stopPropagation();
    towerChoose(towerCurrentChoice());
  };

}


registerGame({
  id: "tower",
  title: "Tower of Bible",
  description: "Build a tower one correct word at a time.",
  start(stage){
    if (!State.towerGame){
      startTowerGame();
    }

    const st = State.towerGame;
    if (!st) return;

    const gameRoot = stage.closest(".learn-layout");

    if (!st.mode){
      towerRenderModeSelect(stage, st, gameRoot);
      return;
    }

    towerRenderStage(stage, st);
    towerRenderCoach(st, gameRoot);
  }
});


/* =========================================================
    6. VERSE SCRAMBLE CODE
   ========================================================= */


registerGame({
  id: "scramble",
  title: "Verse Scramble",
  description: "Tap the correct next word.",
  start(stage){
    if (!State.scrambleGame){
      startVerseScrambleGame();
    }

    const st = State.scrambleGame;
    stage.innerHTML = "";

    const verseBox = document.createElement("div");
    verseBox.style.width = "100%";
    verseBox.style.maxWidth = "760px";
    verseBox.style.minHeight = "90px";
    verseBox.style.display = "flex";
    verseBox.style.alignItems = "center";
    verseBox.style.justifyContent = "center";
    verseBox.style.textAlign = "center";
    verseBox.appendChild(scrambleBuiltVerseNode());
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
        Total time: ${scrambleFormatTime(scrambleElapsedMs())}
      `;
      coachActions.appendChild(doneMsg);
      return;
    }

const field = document.createElement("div");
field.className = "scramble-field";
coachActions.appendChild(field);

if (!st.colorSet.length || st.colorSet.length !== st.choices.length){
  st.colorSet = scrambleColorSet();
}

if (!st.shapeSet.length || st.shapeSet.length !== st.choices.length){
  st.shapeSet = scrambleShapeSet();
}

const maxHorizontalShift = 20;

if (!st.layoutSeeds.length || st.layoutSeeds.length !== st.choices.length){
  st.layoutSeeds = scrambleLayoutSeeds(st.choices.length, maxHorizontalShift);
}

st.choices.forEach((choice, i) => {
  const slot = document.createElement("div");
  slot.className = "scramble-slot";

  const btn = document.createElement("button");
  btn.className = "scramble-word no-zoom";
  btn.classList.add(st.colorSet[i]);
  btn.classList.add(st.shapeSet[i]);
  if (st.wrongChoice === choice) btn.classList.add("wrong");
  btn.type = "button";
  btn.textContent = choice;

  const seed = st.layoutSeeds[i] || { shift: 0, rotation: 0 };

  btn.style.setProperty("--spawnX", `${seed.shift}px`);
  btn.style.setProperty("--rot", `${seed.rotation}deg`);

  btn.onclick = (e) => {
    e.stopPropagation();
    scrambleChoose(choice, btn, field);
  };

  slot.appendChild(btn);
  field.appendChild(slot);
});

scrambleDebugOverlay(field);
  }
});
