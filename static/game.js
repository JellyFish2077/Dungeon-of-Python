(function () {
  "use strict";

  const ENEMY_TYPES = [
    { key: "slime", name: "Слизь", short: "С", color: "#22c55e", hp: 40, dmg: 8 },
    { key: "rat", name: "Крыса", short: "К", color: "#a16207", hp: 34, dmg: 7 },
    { key: "bat", name: "Летучая мышь", short: "М", color: "#7c3aed", hp: 30, dmg: 9 },
    { key: "skeleton", name: "Скелет", short: "С", color: "#94a3b8", hp: 62, dmg: 12 },
    { key: "goblin", name: "Гоблин", short: "Г", color: "#65a30d", hp: 56, dmg: 11 },
    { key: "spider", name: "Паук", short: "П", color: "#78716c", hp: 50, dmg: 13 },
    { key: "orc", name: "Орк", short: "О", color: "#b45309", hp: 82, dmg: 16 },
    { key: "troll", name: "Тролль", short: "Т", color: "#15803d", hp: 98, dmg: 18 },
    { key: "ghost", name: "Призрак", short: "Ф", color: "#38bdf8", hp: 72, dmg: 20 },
    { key: "wolf", name: "Волк", short: "В", color: "#64748b", hp: 58, dmg: 14 },
    { key: "zombie", name: "Зомби", short: "З", color: "#65a30d", hp: 66, dmg: 13 },
    { key: "golem", name: "Голем", short: "Г", color: "#78716c", hp: 110, dmg: 17 },
    { key: "demon", name: "Демон", short: "Д", color: "#dc2626", hp: 90, dmg: 21 },
    { key: "minotaur", name: "Минотавр", short: "М", color: "#92400e", hp: 130, dmg: 20 },
    { key: "vampire", name: "Вампир", short: "В", color: "#9d174d", hp: 105, dmg: 22 },
    { key: "lich", name: "Лич", short: "Л", color: "#7c3aed", hp: 145, dmg: 24 },
    { key: "dragon", name: "Дракон", short: "Д", color: "#dc2626", hp: 260, dmg: 25, boss: true }
  ];

  const FLOORS = [
    { name: "Пещеры новичка", w: 30, h: 22, count: 8, pool: ["slime", "rat", "bat"], qmin: 1, qmax: 2 },
    { name: "Забытые катакомбы", w: 34, h: 24, count: 10, pool: ["skeleton", "goblin", "spider"], qmin: 2, qmax: 2 },
    { name: "Логово орков", w: 36, h: 26, count: 12, pool: ["orc", "troll", "ghost"], qmin: 2, qmax: 3 },
    { name: "Гнилые болота", w: 38, h: 26, count: 12, pool: ["zombie", "spider", "goblin"], qmin: 2, qmax: 3 },
    { name: "Ледяные залы", w: 40, h: 28, count: 14, pool: ["wolf", "ghost", "troll"], qmin: 3, qmax: 3 },
    { name: "Древние руины", w: 42, h: 28, count: 14, pool: ["golem", "skeleton", "orc"], qmin: 3, qmax: 3 },
    { name: "Обитель демонов", w: 44, h: 30, count: 16, pool: ["demon", "minotaur", "ghost"], qmin: 3, qmax: 4 },
    { name: "Проклятый склеп", w: 46, h: 30, count: 16, pool: ["vampire", "zombie", "skeleton", "golem"], qmin: 4, qmax: 4 },
    { name: "Тронный зал лича", w: 48, h: 32, count: 18, pool: ["lich", "demon", "vampire"], qmin: 4, qmax: 4 },
    { name: "Логово дракона", w: 34, h: 24, count: 0, pool: ["dragon"], qmin: 4, qmax: 4, boss: true }
  ];

  const DIFFICULTY = {
    easy: { name: "Лёгкий", wMc: 0.35, wCopy: 0.2, wFill: 0.45, wError: 0.0, wCode: 0.0, enemyScale: 0.85, qBonus: -1 },
    normal: { name: "Обычный", wMc: 0.3, wCopy: 0.18, wFill: 0.2, wError: 0.17, wCode: 0.15, enemyScale: 1.0, qBonus: 0 },
    hard: { name: "Сложный", wMc: 0.25, wCopy: 0.15, wFill: 0.15, wError: 0.15, wCode: 0.3, enemyScale: 1.2, qBonus: 1 }
  };

  const LETTERS = ["A", "B", "C", "D"];
  const VIEW_RADIUS = 4.4;
  const SAVE_KEY = "pyquiz_save_v1";

  const G = {
    name: "",
    startedAt: 0,
    difficulty: "easy",
    floorIndex: 0,
    playerPos: { x: 1, y: 1 },
    player: null,
    map: null,
    enemies: [],
    treasures: [],
    traders: [],
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    uid: 0,
    entityEls: new Map(),
    tileEls: [],
    tileBg: [],
    camera: { zoomIndex: null, tx: 0, ty: 0 },
    minimapOn: true,
    stairsDown: null,
    stairsUp: null,
    cache: {},
    visited: new Set(),
    visible: new Set(),
    discovered: new Set(),
    battle: null,
    lastQId: null,
    codeQueue: [],
    copyQueue: [],
    fillQueue: [],
    errorQueue: [],
    missed: [],
    stats: null,
    running: false,
    finishedVictory: false
  };

  // Скрытый хук для автотестов: ?debug=1 открывает состояние игры.
  try {
    if (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("debug") === "1") {
      window.__pyquiz = G;
      window.__floors = FLOORS;
    }
  } catch (e) {
    // ignore
  }

  const el = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const key = (x, y) => x + "," + y;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function show(screen) {
    ["start", "game"].forEach((s) => el("screen-" + s).classList.toggle("hidden", s !== screen));
    const stage = el("stage");
    if (stage) stage.classList.toggle("playing", screen === "game");
    const side = document.querySelector(".side-panel");
    if (side) side.classList.toggle("hidden", screen !== "game");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function log(msg) {
    const box = el("log");
    const line = document.createElement("div");
    line.textContent = "• " + msg;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
    while (box.children.length > 40) box.removeChild(box.firstChild);
  }

  function setMsg(msg) {
    el("game-msg").textContent = msg || "";
  }

  function toast(msg, ms) {
    const t = el("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), ms || 2200);
  }

  // ---------- Карта ----------

  function carveH(grid, x1, x2, y, w) {
    const from = Math.min(x1, x2);
    const to = Math.max(x1, x2);
    for (let x = from; x <= to; x++) {
      if (grid[y] && x >= 0 && x < w) grid[y][x] = 1;
    }
  }

  function carveV(grid, y1, y2, x, h) {
    const from = Math.min(y1, y2);
    const to = Math.max(y1, y2);
    for (let y = from; y <= to; y++) {
      if (y >= 0 && y < h && grid[y][x] !== undefined) grid[y][x] = 1;
    }
  }

  function roomCenter(r) {
    return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
  }

  function generateMap(w, h) {
    const grid = Array.from({ length: h }, () => Array(w).fill(0));
    const rooms = [];
    const maxRooms = clamp(Math.floor((w * h) / 70), 6, 60);
    const maxW = Math.min(7, Math.floor(w / 3));
    const maxH = Math.min(5, Math.floor(h / 3));

    for (let attempt = 0; attempt < 200 && rooms.length < maxRooms; attempt++) {
      const rw = rand(3, Math.max(3, maxW));
      const rh = rand(3, Math.max(3, maxH));
      const rx = rand(1, w - 1 - rw);
      const ry = rand(1, h - 1 - rh);
      let overlaps = false;
      for (const o of rooms) {
        if (
          rx - 1 < o.x + o.w &&
          rx + rw + 1 > o.x &&
          ry - 1 < o.y + o.h &&
          ry + rh + 1 > o.y
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) grid[y][x] = 1;
      }
    }

    if (rooms.length < 2) {
      let x = 1;
      let y = Math.floor(h / 2);
      for (let i = 0; i < w + h; i++) {
        grid[y][x] = 1;
        const moves = [[1, 0], [0, 1], [0, -1], [-1, 0]];
        const d = moves[rand(0, moves.length - 1)];
        x = clamp(x + d[0], 1, w - 2);
        y = clamp(y + d[1], 1, h - 2);
      }
      rooms.length = 0;
      rooms.push({ x: 1, y: 1, w: 3, h: 3 });
      rooms.push({ x: w - 4, y: h - 4, w: 3, h: 3 });
      carveH(grid, 1, 3, 1, w);
      carveV(grid, 1, 3, 1, h);
      carveH(grid, w - 4, w - 2, h - 2, w);
      carveV(grid, h - 4, h - 2, w - 2, h);
    }

    rooms.sort((a, b) => roomCenter(a).x - roomCenter(b).x);

    for (let i = 1; i < rooms.length; i++) {
      const a = roomCenter(rooms[i - 1]);
      const b = roomCenter(rooms[i]);
      if (Math.random() < 0.5) {
        carveH(grid, a.x, b.x, a.y, w);
        carveV(grid, a.y, b.y, b.x, h);
      } else {
        carveV(grid, a.y, b.y, a.x, h);
        carveH(grid, a.x, b.x, b.y, w);
      }
    }

    for (let k = 0; k < Math.max(1, Math.floor(rooms.length / 2)); k++) {
      const a = roomCenter(rooms[rand(0, rooms.length - 1)]);
      const b = roomCenter(rooms[rand(0, rooms.length - 1)]);
      if (Math.random() < 0.5) {
        carveH(grid, a.x, b.x, a.y, w);
        carveV(grid, a.y, b.y, b.x, h);
      } else {
        carveV(grid, a.y, b.y, a.x, h);
        carveH(grid, a.x, b.x, b.y, w);
      }
    }

    const bumps = Math.floor(w * h * 0.05);
    for (let t = 0; t < bumps; t++) {
      const x = rand(1, w - 2);
      const y = rand(1, h - 2);
      if (grid[y][x] === 1) {
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rand(0, 3)];
        const nx = x + d[0];
        const ny = y + d[1];
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) grid[ny][nx] = 1;
      }
    }

    const start = roomCenter(rooms[0]);
    const end = roomCenter(rooms[rooms.length - 1]);
    grid[start.y][start.x] = 1;
    grid[end.y][end.x] = 1;

    const spots = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (grid[y][x] === 1) spots.push({ x, y });
      }
    }

    const decor = Array.from({ length: h }, () => Array(w).fill(0));
    spots.forEach((s) => {
      const r = Math.random();
      if (r < 0.12) decor[s.y][s.x] = 1;
      else if (r < 0.18) decor[s.y][s.x] = 2;
      else if (r < 0.23) decor[s.y][s.x] = 3;
      else if (r < 0.26) decor[s.y][s.x] = 4;
      else if (r < 0.29) decor[s.y][s.x] = 5;
    });
    decor[start.y][start.x] = 0;
    decor[end.y][end.x] = 0;

    return { grid, start, end, spots, decor };
  }

  function makeEnemy(typeKey, floorIdx) {
    const t = ENEMY_TYPES.find((e) => e.key === typeKey);
    const mul = DIFFICULTY[G.difficulty].enemyScale;
    const hp = Math.round(t.hp * (1 + 0.18 * floorIdx) * mul);
    return {
      uid: ++G.uid,
      key: t.key,
      name: t.name,
      short: t.short,
      color: t.color,
      maxHp: hp,
      hp,
      dmg: Math.max(1, Math.round((t.dmg + floorIdx * 2) * mul)),
      boss: !!t.boss,
      x: 0,
      y: 0
    };
  }

  function createFloorState(index) {
    const f = FLOORS[index];
    const gen = generateMap(f.w, f.h);
    const bossFloor = index === FLOORS.length - 1;
    const state = {
      index,
      map: { w: f.w, h: f.h, grid: gen.grid, decor: gen.decor },
      playerPos: { x: gen.start.x, y: gen.start.y },
      stairsDown: { x: gen.end.x, y: gen.end.y, active: !bossFloor },
      stairsUp: index > 0 ? { x: gen.start.x, y: gen.start.y } : null,
      enemies: [],
      treasures: [],
      traders: [],
      discovered: new Set()
    };

    const far = gen.spots.filter(
      (s) =>
        Math.hypot(s.x - gen.start.x, s.y - gen.start.y) >= 3 &&
        !(s.x === gen.end.x && s.y === gen.end.y)
    );
    shuffle(far);

    const count = f.boss ? 1 : f.count;
    for (let i = 0; i < count && i < far.length; i++) {
      const spot = far[i];
      const e = makeEnemy(f.boss ? "dragon" : f.pool[rand(0, f.pool.length - 1)], index);
      e.x = spot.x;
      e.y = spot.y;
      state.enemies.push(e);
    }

    for (const e of state.enemies) {
      if (!e.boss && G.missed.length && Math.random() < 0.35) {
        const p = G.missed.shift();
        e.payload = p;
        e.isGhost = true;
        e.name = "Призрак ошибки";
        e.key = "ghost";
        e.color = "#c084fc";
      }
    }

    const used = new Set(state.enemies.map((e) => key(e.x, e.y)));
    used.add(key(gen.start.x, gen.start.y));
    used.add(key(gen.end.x, gen.end.y));
    const free = far.filter((s) => !used.has(key(s.x, s.y)));
    const chests = f.boss ? 5 : 4 + (index >= 2 ? 1 : 0) + (index >= 5 ? 2 : 0);
    for (let i = 0; i < chests && i < free.length; i++) {
      state.treasures.push({
        uid: ++G.uid,
        x: free[i].x,
        y: free[i].y,
        item: randomItemForFloor(index)
      });
      used.add(key(free[i].x, free[i].y));
    }
    const tSpot = free.find((s) => !used.has(key(s.x, s.y)));
    if (tSpot) {
      state.traders.push({ uid: ++G.uid, x: tSpot.x, y: tSpot.y });
    }
    return state;
  }

  function snapshotCurrent() {
    G.cache[G.floorIndex] = {
      index: G.floorIndex,
      map: G.map,
      playerPos: { ...G.playerPos },
      stairsDown: G.stairsDown,
      stairsUp: G.stairsUp,
      enemies: G.enemies,
      treasures: G.treasures,
      traders: G.traders,
      discovered: G.discovered
    };
  }

  function activateFloor(index) {
    let state = G.cache[index];
    if (!state) {
      state = createFloorState(index);
      G.cache[index] = state;
    }
    G.floorIndex = index;
    G.map = state.map;
    G.stairsDown = state.stairsDown;
    G.stairsUp = state.stairsUp;
    G.enemies = state.enemies;
    G.treasures = state.treasures;
    G.traders = state.traders || [];
    G.playerPos = { ...state.playerPos };
    G.visible = new Set();
    G.discovered = state.discovered || new Set();
    G.entityEls.forEach((node) => node.remove());
    G.entityEls.clear();
    G.tileEls = [];
    G.tileBg = [];
    G.camera.zoomIndex = null;
    el("map").dataset.theme = String(index % 10);
    el("map").classList.add("no-cam-anim");
    render();
    requestAnimationFrame(() => el("map").classList.remove("no-cam-anim"));
  }

  function randomItemForFloor(floorIndex, slot) {
    const pool = itemsForFloor(floorIndex, slot);
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { ...item };
  }

  function computeVisibility() {
    const { grid } = G.map;
    const { x: px, y: py } = G.playerPos;
    G.visible = new Set();
    for (let y = 0; y < G.map.h; y++) {
      for (let x = 0; x < G.map.w; x++) {
        if (Math.hypot(x - px, y - py) <= VIEW_RADIUS) {
          G.visible.add(key(x, y));
          G.discovered.add(key(x, y));
        }
      }
    }
  }

  function mapMetrics() {
    const cs = getComputedStyle(el("map"));
    const cell = parseFloat(cs.getPropertyValue("--cell")) || 46;
    const gap = parseFloat(cs.getPropertyValue("--gap")) || 4;
    const pad = parseFloat(cs.getPropertyValue("--pad")) || 14;
    return { cell, gap, pad, step: cell + gap };
  }

  const CAM_LEVELS = [16, 32, 48, 64, 80, 96];

  function setZoomCell() {
    const viewport = el("map-scroll");
    const vw = viewport.clientWidth || 1;
    if (G.camera.zoomIndex == null) {
      const target = vw / 24;
      let idx = 0;
      for (let i = 0; i < CAM_LEVELS.length; i++) {
        if (CAM_LEVELS[i] <= target) idx = i;
      }
      G.camera.zoomIndex = idx;
    }
    G.camera.zoomIndex = clamp(G.camera.zoomIndex, 0, CAM_LEVELS.length - 1);
    el("map").style.setProperty("--cell", CAM_LEVELS[G.camera.zoomIndex] + "px");
  }

  function positionCamera() {
    const viewport = el("map-scroll");
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (!vw || !vh) return;
    const mapEl = el("map");
    const { cell, pad, step } = mapMetrics();
    const mapW = mapEl.offsetWidth || 1;
    const mapH = mapEl.offsetHeight || 1;
    const cx = pad + G.playerPos.x * step + cell / 2;
    const cy = pad + G.playerPos.y * step + cell / 2;

    let tx = vw / 2 - cx;
    let ty = vh / 2 - cy;
    tx = mapW <= vw ? (vw - mapW) / 2 : clamp(tx, vw - mapW, 0);
    ty = mapH <= vh ? (vh - mapH) / 2 : clamp(ty, vh - mapH, 0);

    G.camera.tx = tx;
    G.camera.ty = ty;
    mapEl.style.transform = "translate(" + tx + "px," + ty + "px)";
    drawMinimap();
  }

  function updateCamera() {
    setZoomCell();
    positionCamera();
  }

  function toggleMinimap() {
    G.minimapOn = !G.minimapOn;
    const cv = el("minimap");
    if (cv) cv.classList.toggle("off", !G.minimapOn);
    if (G.minimapOn) drawMinimap();
  }

  function drawMinimap() {
    const cv = el("minimap");
    if (!cv || cv.classList.contains("off") || !G.map) return;
    const ctx = cv.getContext("2d");
    const w = G.map.w;
    const h = G.map.h;
    const grid = G.map.grid;
    const cw = cv.width;
    const ch = cv.height;
    ctx.clearRect(0, 0, cw, ch);
    const cs = Math.min(cw / w, ch / h);
    const ox = (cw - cs * w) / 2;
    const oy = (ch - cs * h) / 2;
    const dot = (x, y, color, scale) => {
      const s = scale == null ? 0.62 : scale;
      ctx.fillStyle = color;
      ctx.fillRect(
        ox + x * cs + (cs * (1 - s)) / 2,
        oy + y * cs + (cs * (1 - s)) / 2,
        Math.max(2, cs * s),
        Math.max(2, cs * s)
      );
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = key(x, y);
        if (!G.discovered.has(k)) continue;
        const vis = G.visible.has(k);
        ctx.fillStyle = grid[y][x] === 1 ? (vis ? "#24406a" : "#15233c") : "#080d18";
        ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
      }
    }

    G.treasures.forEach((t) => {
      if (G.discovered.has(key(t.x, t.y))) dot(t.x, t.y, "#fbbf24", 0.5);
    });
    (G.traders || []).forEach((t) => {
      if (G.discovered.has(key(t.x, t.y))) dot(t.x, t.y, "#e9d5ff", 0.66);
    });
    if (G.stairsUp && G.discovered.has(key(G.stairsUp.x, G.stairsUp.y))) {
      dot(G.stairsUp.x, G.stairsUp.y, "#34d399", 0.72);
    }
    if (G.discovered.has(key(G.stairsDown.x, G.stairsDown.y))) {
      dot(G.stairsDown.x, G.stairsDown.y, "#38bdf8", 0.72);
    }
    G.enemies.forEach((e) => {
      if (G.visible.has(key(e.x, e.y))) {
        dot(e.x, e.y, e.boss ? "#dc2626" : "#f87171", 0.62);
      }
    });
    dot(G.playerPos.x, G.playerPos.y, "#f6c453", 0.9);

    const vp = el("map-scroll");
    if (vp) {
      const { pad, step } = mapMetrics();
      const gx1 = (0 - G.camera.tx - pad) / step;
      const gy1 = (0 - G.camera.ty - pad) / step;
      const gx2 = (vp.clientWidth - G.camera.tx - pad) / step;
      const gy2 = (vp.clientHeight - G.camera.ty - pad) / step;
      ctx.strokeStyle = "rgba(246,196,83,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + gx1 * cs, oy + gy1 * cs, (gx2 - gx1) * cs, (gy2 - gy1) * cs);
    }
  }

  function render() {
    setZoomCell();
    computeVisibility();
    renderTiles();
    renderEntities();
    positionCamera();
    updateHud();
  }

  function renderTiles() {
    const { w, h, grid } = G.map;
    const decor = G.map.decor;
    const tiles = el("tiles");
    const need = w * h;

    if (G.tileEls.length !== need) {
      tiles.style.gridTemplateColumns = "repeat(" + w + ", var(--cell))";
      tiles.innerHTML = "";
      G.tileEls = [];
      G.tileBg = [];
      const theme = G.floorIndex % 10;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const t = document.createElement("div");
          t.className = "tile unseen";
          tiles.appendChild(t);
          G.tileEls.push(t);
          const isFloor = grid[y][x] === 1;
          const d = isFloor && decor && decor[y] ? decor[y][x] || 0 : 0;
          G.tileBg.push(tileBackground(theme, G.floorIndex, x, y, isFloor, d));
        }
      }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = G.tileEls[y * w + x];
        const k = key(x, y);
        const seen = G.discovered.has(k);
        const isFloor = grid[y][x] === 1;
        const cls = "tile " + (seen ? (isFloor ? "floor" : "wall") + (G.visible.has(k) ? "" : " seen") : "unseen");
        if (t.dataset.cls !== cls) {
          t.className = cls;
          t.dataset.cls = cls;
          t.style.backgroundImage = seen ? G.tileBg[y * w + x] : "";
        }
      }
    }
  }

  function renderEntities() {
    const { pad, step } = mapMetrics();
    const layer = el("entities");
    const alive = new Set();

    const place = (id, x, y, vis, iconKey, cls, color, title, z) => {
      alive.add(id);
      let node = G.entityEls.get(id);
      let created = false;
      if (!node) {
        node = document.createElement("div");
        node.className = "entity";
        G.entityEls.set(id, node);
        layer.appendChild(node);
        created = true;
      }

      const sig = iconKey + "|" + cls + "|" + (color || "");
      if (node.dataset.sig !== sig) {
        node.dataset.sig = sig;
        node.innerHTML =
          '<span class="ent ' + cls + '"' +
          (color ? ' style="--c:' + color + '"' : "") +
          ' title="' + (title || "") + '">' + iconSvg(iconKey) + "</span>";
      }

      node.style.zIndex = String(z || 1);
      const tr = "translate(" + (pad + x * step) + "px," + (pad + y * step) + "px)";
      const op = vis ? "1" : "0";

      if (created) {
        node.classList.add("no-anim");
        node.style.transform = tr;
        node.style.opacity = op;
        requestAnimationFrame(() => node.classList.remove("no-anim"));
      } else {
        node.style.transform = tr;
        node.style.opacity = op;
      }
    };

    place("player", G.playerPos.x, G.playerPos.y, true, "player", "ent-player", null, "Герой", 6);

    G.enemies.forEach((e) => {
      const vis = G.visible.has(key(e.x, e.y));
      place(
        "enemy-" + e.uid,
        e.x,
        e.y,
        vis,
        e.key,
        "ent-enemy" + (e.boss ? " boss" : ""),
        e.color,
        e.name,
        e.boss ? 5 : 4
      );
    });

    G.treasures.forEach((t) => {
      const vis = G.visible.has(key(t.x, t.y));
      place("treasure-" + t.uid, t.x, t.y, vis, "treasure", "ent-treasure", null, "Сундук", 2);
    });

    (G.traders || []).forEach((t) => {
      const vis = G.visible.has(key(t.x, t.y));
      place("trader-" + t.uid, t.x, t.y, vis, "trader", "ent-trader", null, "Торговец", 3);
    });

    if (G.stairsUp) {
      place(
        "stairs-up",
        G.stairsUp.x,
        G.stairsUp.y,
        G.visible.has(key(G.stairsUp.x, G.stairsUp.y)),
        "stairsUp",
        "ent-stairs up",
        null,
        "Лестница вверх",
        2
      );
    }

    place(
      "stairs-down",
      G.stairsDown.x,
      G.stairsDown.y,
      G.visible.has(key(G.stairsDown.x, G.stairsDown.y)),
      "stairs",
      "ent-stairs" + (G.stairsDown.active ? "" : " locked"),
      null,
      "Лестница вниз",
      2
    );

    G.entityEls.forEach((node, id) => {
      if (!alive.has(id)) {
        G.entityEls.delete(id);
        node.style.opacity = "0";
        setTimeout(() => node.remove(), 260);
      }
    });
  }

  function updateHud() {
    const p = G.player;
    const hpPct = Math.round((p.hp / p.maxHp) * 100);
    const hpBar = el("player-hp").parentElement;
    el("player-hp").style.width = hpPct + "%";
    hpBar.classList.toggle("low", p.hp / p.maxHp < 0.3);

    if (p._lastHp != null && p.hp !== p._lastHp) {
      const flash = p.hp < p._lastHp ? "hurt" : "heal";
      hpBar.classList.remove("hurt", "heal");
      void hpBar.offsetWidth;
      hpBar.classList.add(flash);
      clearTimeout(hpBar._flashTimer);
      hpBar._flashTimer = setTimeout(() => hpBar.classList.remove(flash), 520);
    }
    p._lastHp = p.hp;

    el("player-hp-text").textContent = p.hp + " / " + p.maxHp;
    el("player-level").textContent = p.level;
    const xpPct = Math.round((p.xp / p.xpNext) * 100);
    el("player-xp").style.width = clamp(xpPct, 0, 100) + "%";
    el("player-xp-text").textContent = p.xp + " / " + p.xpNext + " очков";
    el("floor-name").textContent =
      "Этаж " + (G.floorIndex + 1) + " · " + FLOORS[G.floorIndex].name;
    el("enemies-left").textContent = "Монстров: " + G.enemies.length;
    el("gold-text").textContent = p.gold || 0;
    updateEquipBar();
    scheduleSave();
  }

  function addGold(n) {
    G.player.gold = (G.player.gold || 0) + n;
    G.stats.goldEarned = (G.stats.goldEarned || 0) + n;
    updateHud();
  }

  const SHOP_WARES = [
    { id: "small_potion", price: 20 },
    { id: "big_potion", price: 45 },
    { id: "elixir", price: 120 },
    { kind: "random", slot: "weapon", price: 80, label: "Случайное оружие" },
    { kind: "random", slot: "armor", price: 80, label: "Случайная броня" },
    { kind: "random", slot: "accessory", price: 60, label: "Случайный амулет" }
  ];
  const SHOP_MARKUP = 1.5;

  function warePrice(w) {
    return G.shopTrader ? w.price : Math.ceil(w.price * SHOP_MARKUP);
  }

  function openShop(fromTrader) {
    if (!G.running) return;
    G.shopTrader = !!fromTrader;
    renderShop();
    el("shop-overlay").classList.remove("hidden");
  }

  function closeShop() {
    el("shop-overlay").classList.add("hidden");
  }

  function renderShop() {
    const box = el("shop-box");
    if (!box) return;
    let html = "<div class='battle-head'><div><div class='enemy-name'>Лавка" +
      (G.shopTrader ? "" : " <small style='color:#fca5a5'>(наценка ×1.5)</small>") + "</div>" +
      "<div class='hud-num'>Золото: <b>" + G.player.gold + "</b></div></div>" +
      "<button class='exit-btn' id='shop-close' type='button'>Закрыть</button></div>";
    if (!G.shopTrader) {
      html += "<div class='hud-num' style='margin-bottom:10px'>У торговца на этаже дешевле — найди его!</div>";
    }
    html += "<div class='inv-section'><h3>Товары</h3>";
    SHOP_WARES.forEach((w, i) => {
      const price = warePrice(w);
      let name, info;
      if (w.kind === "random") {
        name = w.label + " (эт. " + (G.floorIndex + 1) + ")";
        info = "цена " + price + " · предмет по твоему этажу";
      } else {
        const it = itemById(w.id);
        name = it.name;
        info = itemBonusText(it) + " · цена " + price;
      }
      html += "<div class='inv-item'><div class='info'><b>" + name + "</b>" +
        "<span>" + info + "</span></div>" +
        "<button class='btn' data-buy='" + i + "'>Купить</button></div>";
    });
    html += "</div>";
    box.innerHTML = html;
    el("shop-close").addEventListener("click", closeShop);
    box.querySelectorAll("button[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => buyItem(Number(btn.dataset.buy)));
    });
  }

  function buyItem(i) {
    const w = SHOP_WARES[i];
    if (!w) return;
    const price = warePrice(w);
    if (G.player.gold < price) {
      toast("Не хватает золота");
      return;
    }
    const item = w.kind === "random"
      ? randomItemForFloor(G.floorIndex, w.slot)
      : Object.assign({}, itemById(w.id));
    G.player.gold -= price;
    addItem(item);
    updateHud();
    renderShop();
    if (G.battle) renderBattle();
  }

  function itemBonusText(item) {
    const parts = [];
    if (item.atk) parts.push("атака +" + item.atk);
    if (item.hp) parts.push("HP +" + item.hp);
    if (item.def) parts.push("защита +" + item.def);
    if (item.heal) parts.push("лечение +" + (item.heal > 999 ? "всё" : item.heal));
    return parts.join(", ");
  }

  function updateEquipBar() {
    const eq = G.equipment;
    el("equip-weapon").textContent = eq.weapon ? eq.weapon.name : "пусто";
    el("equip-armor").textContent = eq.armor ? eq.armor.name : "пусто";
    el("equip-accessory").textContent = eq.accessory ? eq.accessory.name : "пусто";
    el("equip-stats").textContent = "+" + G.player.atkBonus + " / " + G.player.defBonus;
  }

  // ---------- Предметы и инвентарь ----------

  function recalcStats() {
    const p = G.player;
    const eq = G.equipment;
    const atk = (eq.weapon && eq.weapon.atk ? eq.weapon.atk : 0) +
      (eq.accessory && eq.accessory.atk ? eq.accessory.atk : 0);
    const def = (eq.armor && eq.armor.def ? eq.armor.def : 0) +
      (eq.accessory && eq.accessory.def ? eq.accessory.def : 0);
    const bonusHp = (eq.armor && eq.armor.hp ? eq.armor.hp : 0) +
      (eq.accessory && eq.accessory.hp ? eq.accessory.hp : 0);
    p.atkBonus = atk;
    p.defBonus = def;
    p.maxHp = p.baseMaxHp + bonusHp;
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    updateEquipBar();
  }

  function addItem(item) {
    G.inventory.push(item);
    if (item.slot === "potion") {
      log("В сумке " + countPotions() + " зелий.");
    } else {
      log("Предмет «" + item.name + "» добавлен в инвентарь.");
    }
    renderInventory();
  }

  function countPotions() {
    return G.inventory.filter((i) => i.slot === "potion").length;
  }

  function equipItem(index) {
    const item = G.inventory[index];
    if (!item || item.slot === "potion") return;
    const slot = item.slot;
    G.inventory.splice(index, 1);
    if (G.equipment[slot]) G.inventory.push(G.equipment[slot]);
    G.equipment[slot] = item;
    recalcStats();
    log("Экипировано: " + item.name + ".");
    updateHud();
    renderInventory();
  }

  function usePotion(index) {
    const item = G.inventory[index];
    if (!item || item.slot !== "potion") return;
    if (G.player.hp >= G.player.maxHp) {
      toast("Здоровье уже полное");
      return;
    }
    const healed = Math.min(item.heal, G.player.maxHp - G.player.hp);
    G.player.hp += healed;
    G.inventory.splice(index, 1);
    log("Выпито зелье: +" + healed + " здоровья.");
    toast("+" + healed + " здоровья");
    updateHud();
    renderInventory();
  }

  function openInventory() {
    if (!G.running) return;
    renderInventory();
    const box = el("inventory-card");
    if (box && box.scrollIntoView) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function renderInventory() {
    const p = G.player;
    const box = el("inventory-box");
    if (!box || !p) return;
    let html = "";
    html += "<div class='inv-section'><h3>Характеристики</h3>" +
      "<div class='inv-stats'>" +
      "<span>Урон: <b>" + (p.dmgBase + p.atkBonus) + "</b></span>" +
      "<span>Здоровье: <b>" + p.hp + " / " + p.maxHp + "</b></span>" +
      "<span>Защита: <b>" + p.defBonus + "</b></span>" +
      "<span>Зелий: <b>" + countPotions() + "</b></span>" +
      "</div>";

    html += "<div class='inv-section'><h3>Экипировано</h3>";
    ["weapon", "armor", "accessory"].forEach((slot) => {
      const item = G.equipment[slot];
      const ico = item
        ? "<span class='item-ico'>" + itemIcon(item.slot, RARITY[item.rarity].color) + "</span>"
        : "";
      html += "<div class='inv-item' style='border-left-color:" +
        (item ? RARITY[item.rarity].color : "#e2e8f0") + "'>" +
        "<div class='info'><b>" + ico + SLOT_NAMES[slot] + ": " +
        (item ? item.name : "пусто") + "</b>" +
        "<span>" + (item ? itemBonusText(item) : "нет предмета") + "</span></div>";
      if (item) {
        html += "<div class='inv-actions'>" +
          "<button class='btn ghost' data-unequip='" + slot + "'>Снять</button>" +
          "</div>";
      }
      html += "</div>";
    });
    html += "</div>";

    html += "<div class='inv-section'><h3>Сумка</h3>";
    if (G.inventory.length === 0) {
      html += "<div class='inv-empty'>Пока пусто. Ищи сундуки и побеждай монстров.</div>";
    } else {
      G.inventory.forEach((item, i) => {
        const isPotion = item.slot === "potion";
        const ico = "<span class='item-ico'>" + itemIcon(item.slot, RARITY[item.rarity].color) + "</span>";
        html += "<div class='inv-item' style='border-left-color:" + RARITY[item.rarity].color + "'>" +
          "<div class='info'><b>" + ico + item.name + "</b>" +
          "<span>" + RARITY[item.rarity].name + " · " + itemBonusText(item) + "</span></div>" +
          "<div class='inv-actions'>" +
          "<button class='btn " + (isPotion ? "purple" : "") + "' data-item='" + i + "'>" +
          (isPotion ? "Выпить" : "Экипировать") + "</button>" +
          "<button class='btn ghost' data-discard='" + i + "'>Убрать</button>" +
          "</div></div>";
      });
    }
    html += "</div>";

    box.innerHTML = html;
    box.querySelectorAll("button[data-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.item);
        if (G.inventory[i] && G.inventory[i].slot === "potion") usePotion(i);
        else equipItem(i);
      });
    });
    box.querySelectorAll("button[data-discard]").forEach((btn) => {
      btn.addEventListener("click", () => discardItem(Number(btn.dataset.discard)));
    });
    box.querySelectorAll("button[data-unequip]").forEach((btn) => {
      btn.addEventListener("click", () => unequipItem(btn.dataset.unequip));
    });
  }

  function discardItem(index) {
    const item = G.inventory[index];
    if (!item) return;
    if (!window.confirm("Убрать «" + item.name + "» из инвентаря?")) return;
    G.inventory.splice(index, 1);
    log("Убран предмет: " + item.name + ".");
    updateHud();
    renderInventory();
  }

  function unequipItem(slot) {
    const item = G.equipment[slot];
    if (!item) return;
    G.equipment[slot] = null;
    G.inventory.push(item);
    recalcStats();
    log("Снято: " + item.name + ".");
    updateHud();
    renderInventory();
  }

  // ---------- Движение ----------

  function move(dx, dy) {
    if (!G.running || G.battle) return;
    if (!el("end-overlay").classList.contains("hidden")) return;
    if (!el("shop-overlay").classList.contains("hidden")) return;
    const nx = G.playerPos.x + dx;
    const ny = G.playerPos.y + dy;
    if (nx < 0 || ny < 0 || nx >= G.map.w || ny >= G.map.h) return;
    if (G.map.grid[ny][nx] !== 1) {
      setMsg("Здесь стена.");
      return;
    }

    G.playerPos = { x: nx, y: ny };
    setMsg("");

    const enemy = G.enemies.find((e) => e.x === nx && e.y === ny);
    if (enemy) {
      render();
      openBattle(enemy);
      return;
    }

    const ti = G.treasures.findIndex((t) => t.x === nx && t.y === ny);
    if (ti >= 0) {
      const chest = G.treasures.splice(ti, 1)[0];
      addItem(chest.item);
      log("Ты нашёл сундук: " + chest.item.name + ".");
      toast("Найдено: " + chest.item.name);
    }

    const trader = (G.traders || []).find((t) => t.x === nx && t.y === ny);
    if (trader) {
      setMsg("Торговец: «Заглядывай в лавку, герой!»");
      render();
      openShop(true);
      return;
    }

    if (G.stairsUp && G.stairsUp.x === nx && G.stairsUp.y === ny) {
      ascend();
      return;
    }

    if (G.stairsDown.x === nx && G.stairsDown.y === ny) {
      if (!G.stairsDown.active) {
        setMsg("Выход охраняет дракон — победи его.");
      } else {
        descend();
        return;
      }
    }

    const attacker = enemyTurn();
    render();
    if (attacker) openBattle(attacker);
  }

  const AGGRO_RADIUS = 4;

  function tileBlockedForEnemy(x, y, mover) {
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) return true;
    if (G.map.grid[y][x] !== 1) return true;
    if (x === G.playerPos.x && y === G.playerPos.y) return false;
    if (G.stairsDown.x === x && G.stairsDown.y === y) return true;
    if (G.stairsUp && G.stairsUp.x === x && G.stairsUp.y === y) return true;
    if (G.treasures.some((t) => t.x === x && t.y === y)) return true;
    if ((G.traders || []).some((t) => t.x === x && t.y === y)) return true;
    if (G.enemies.some((o) => o !== mover && o.x === x && o.y === y)) return true;
    return false;
  }

  function stepToward(e, px, py) {
    const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    let best = null;
    let bestDist = Infinity;
    dirs.forEach(([dx, dy]) => {
      const x = e.x + dx;
      const y = e.y + dy;
      if (tileBlockedForEnemy(x, y, e)) return;
      const d = Math.hypot(x - px, y - py);
      if (d < bestDist) {
        bestDist = d;
        best = { x, y };
      }
    });
    return best;
  }

  function wander(e) {
    const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    for (const [dx, dy] of dirs) {
      const x = e.x + dx;
      const y = e.y + dy;
      if (tileBlockedForEnemy(x, y, e)) continue;
      if (x === G.playerPos.x && y === G.playerPos.y) continue;
      return { x, y };
    }
    return null;
  }

  function enemyTurn() {
    const px = G.playerPos.x;
    const py = G.playerPos.y;
    for (const e of G.enemies) {
      const dist = Math.hypot(e.x - px, e.y - py);
      if (dist > AGGRO_RADIUS) {
        if (Math.random() < 0.25) {
          const w = wander(e);
          if (w) {
            e.x = w.x;
            e.y = w.y;
          }
        }
        continue;
      }
      const step = stepToward(e, px, py);
      if (!step) continue;
      const nextDist = Math.hypot(step.x - px, step.y - py);
      if (nextDist >= dist) continue;
      if (step.x === px && step.y === py) return e;
      e.x = step.x;
      e.y = step.y;
    }
    return null;
  }

  function descend() {
    if (G.floorIndex < FLOORS.length - 1) {
      snapshotCurrent();
      const next = G.floorIndex + 1;
      if (!G.visited.has(next)) {
        G.visited.add(next);
        G.stats.floorsCleared += 1;
      }
      activateFloor(next);
      log("Ты спускаешься на этаж " + (next + 1) + ": " + FLOORS[next].name + ".");
      setMsg("Этаж " + (next + 1) + ". Монстров: " + G.enemies.length);
    } else {
      victory();
    }
  }

  function ascend() {
    if (G.floorIndex === 0) return;
    snapshotCurrent();
    const prev = G.floorIndex - 1;
    activateFloor(prev);
    log("Ты поднимаешься на этаж " + (prev + 1) + ": " + FLOORS[prev].name + ".");
    setMsg("Возвращение на этаж " + (prev + 1) + ".");
  }

  // ---------- Бой ----------

  function openBattle(enemy) {
    G.battle = {
      enemy,
      phase: "question",
      challenge: null,
      feedback: "",
      explanation: "",
      good: false,
      busy: false,
      won: false,
      playerDead: false,
      results: null
    };
    nextChallenge();
    renderBattle();
    el("battle-overlay").classList.remove("hidden");
    document.body.classList.add("battling");
    requestAnimationFrame(() => {
      if (G.running && G.map) updateCamera();
    });
  }

  function pickQuestion() {
    const f = FLOORS[G.floorIndex];
    const qb = DIFFICULTY[G.difficulty].qBonus;
    const qmin = clamp(f.qmin + qb, 1, 4);
    const qmax = clamp(f.qmax + qb, qmin, 4);
    let pool = QUESTIONS.filter((q) => q.level >= qmin && q.level <= qmax);
    if (pool.length === 0) pool = QUESTIONS;
    let q = pool[rand(0, pool.length - 1)];
    if (pool.length > 1 && q.id === G.lastQId) {
      q = pool[(pool.indexOf(q) + 1) % pool.length];
    }
    G.lastQId = q.id;
    return q;
  }

  function pickCodeTask() {
    if (!G.codeQueue.length) {
      G.codeQueue = shuffle(CODE_TASKS.map((t) => t.id));
    }
    const id = G.codeQueue.shift();
    return CODE_TASKS.find((t) => t.id === id);
  }

  function pickCopyTask() {
    if (!G.copyQueue.length) {
      G.copyQueue = shuffle(COPY_TASKS.map((t) => t.id));
    }
    const id = G.copyQueue.shift();
    return COPY_TASKS.find((t) => t.id === id);
  }

  function pickFillTask() {
    if (!G.fillQueue.length) {
      G.fillQueue = shuffle(FILL_TASKS.map((t) => t.id));
    }
    const id = G.fillQueue.shift();
    return FILL_TASKS.find((t) => t.id === id);
  }

  function pickErrorTask() {
    if (!G.errorQueue.length) {
      G.errorQueue = shuffle(ERROR_TASKS.map((t) => t.id));
    }
    const id = G.errorQueue.shift();
    return ERROR_TASKS.find((t) => t.id === id);
  }

  function pushMissed(kind, id) {
    if (kind !== "mc" && kind !== "fill" && kind !== "error") return;
    if (!G.missed.some((m) => m.kind === kind && m.id === id)) {
      G.missed.push({ kind, id });
      if (G.missed.length > 20) G.missed.shift();
    }
  }

  function findPayload(p) {
    if (p.kind === "mc") return QUESTIONS.find((q) => q.id === p.id) || null;
    if (p.kind === "fill") return FILL_TASKS.find((t) => t.id === p.id) || null;
    if (p.kind === "error") return ERROR_TASKS.find((t) => t.id === p.id) || null;
    return null;
  }

  function nextChallenge() {
    const b = G.battle;

    const payload = b.enemy.payload;
    if (payload) {
      const item = findPayload(payload);
      if (item) {
        if (payload.kind === "mc") b.challenge = { type: "mc", question: item };
        else b.challenge = { type: payload.kind, task: item };
        b.phase = "question";
        b.feedback = "";
        b.explanation = "";
        b.results = null;
        return;
      }
    }

    const d = DIFFICULTY[G.difficulty];
    const roll = Math.random();
    let type = "mc";
    let acc = d.wMc;
    if (roll < acc) type = "mc";
    else if (roll < (acc += d.wCopy)) type = "copy";
    else if (roll < (acc += (d.wFill || 0))) type = "fill";
    else if (roll < (acc += (d.wError || 0))) type = "error";
    else if (d.wCode > 0) type = "code";

    if (type === "copy") {
      b.challenge = { type: "copy", task: pickCopyTask(), code: "", results: null };
    } else if (type === "fill") {
      b.challenge = { type: "fill", task: pickFillTask() };
    } else if (type === "error") {
      b.challenge = { type: "error", task: pickErrorTask() };
    } else if (type === "code") {
      const task = pickCodeTask();
      b.challenge = { type: "code", task, code: task.starter, results: null };
    } else {
      b.challenge = { type: "mc", question: pickQuestion() };
    }
    b.phase = "question";
    b.feedback = "";
    b.explanation = "";
    b.results = null;
  }

  function normalizeExact(s) {
    return s
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/, ""))
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
  }

  function normalizeLoose(s) {
    return s.replace(/\s+/g, "");
  }

  function playerAttackPower() {
    return G.player.dmgBase + G.player.level * 4 + G.player.atkBonus;
  }

  function mcDamage(level) {
    return playerAttackPower() + level * 6 + rand(0, 5);
  }

  function codeDamage() {
    return playerAttackPower() * 2 + 10;
  }

  function playerTakeHit() {
    const e = G.battle.enemy;
    const dmg = Math.max(1, e.dmg + rand(0, 3) - G.player.defBonus);
    G.player.hp = Math.max(0, G.player.hp - dmg);
    if (G.player.hp === 0) G.battle.playerDead = true;
    return dmg;
  }

  function spawnFloat(container, text, cls, xPct, yPct) {
    if (!container) return;
    const span = document.createElement("span");
    span.className = "dmg-float " + (cls || "");
    span.textContent = text;
    span.style.left = (xPct == null ? 50 : xPct) + "%";
    span.style.top = (yPct == null ? 40 : yPct) + "%";
    container.appendChild(span);
    setTimeout(() => span.remove(), 1000);
  }

  function shakeEl(node) {
    if (!node) return;
    node.classList.remove("shake");
    void node.offsetWidth;
    node.classList.add("shake");
    setTimeout(() => node.classList.remove("shake"), 500);
  }

  function applyAttack(damage, message, counter, explanation) {
    const b = G.battle;
    const e = b.enemy;
    b.explanation = explanation || "";
    e.hp = Math.max(0, e.hp - damage);
    const parts = [message];
    let dealt = 0;
    let taken = 0;
    if (damage > 0) {
      dealt = damage;
      parts.push("Ты нанёс " + damage + " урона.");
    }
    if (e.hp <= 0) {
      defeatEnemy();
      b.won = true;
    } else {
      if (e.boss && !e.enraged && e.hp <= e.maxHp * 0.4) {
        e.enraged = true;
        e.dmg = Math.round(e.dmg * 1.5);
        parts.push("Враг впадает в ярость!");
      }
      if (counter) {
        taken = playerTakeHit();
        parts.push(e.name + " бьёт тебя на " + taken + " урона.");
      }
    }
    b.feedback = parts.join(" ");
    b.good = damage > 0;
    b.phase = "result";
    renderBattle();
    updateHud();

    const box = el("battle-box");
    if (dealt) spawnFloat(box, "-" + dealt, "hit", 80, 18);
    if (taken) {
      spawnFloat(box, "-" + taken, "hurt", 20, 60);
      shakeEl(box);
    }
    const result = box.querySelector(".battle-feedback");
    if (result) result.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function defeatEnemy() {
    const e = G.battle.enemy;
    const idx = G.enemies.indexOf(e);
    if (idx >= 0) G.enemies.splice(idx, 1);
    G.stats.kills += 1;
    const xp = e.maxHp;
    G.player.xp += xp;
    log(e.name + " повержен! Получено " + xp + " опыта.");
    addGold(e.boss ? 100 : 15);
    while (G.player.xp >= G.player.xpNext) {
      G.player.xp -= G.player.xpNext;
      G.player.level += 1;
      G.player.baseMaxHp += 30;
      G.player.dmgBase += 4;
      G.player.xpNext = 50 * G.player.level;
      recalcStats();
      G.player.hp = Math.min(G.player.maxHp, G.player.hp + 30);
      log("Новый уровень! Теперь ты уровня " + G.player.level + ".");
      toast("Уровень " + G.player.level + "!");
    }

    const dropChance = e.boss ? 1 : 0.35;
    if (Math.random() < dropChance) {
      const item = e.boss
        ? randomItemForFloor(2, null)
        : randomItemForFloor(G.floorIndex);
      addItem(item);
      log("С монстра выпал предмет: " + item.name + ".");
      toast("Добыча: " + item.name);
    }

    if (G.enemies.length === 0) {
      G.stairsDown.active = true;
      if (G.floorIndex === FLOORS.length - 1) {
        log("Дракон повержен! Выход из подземелья открыт.");
      } else {
        log("Этаж зачищен! Но спуститься можно было в любой момент.");
      }
    }
  }

  function closeBattle() {
    G.battle = null;
    el("battle-overlay").classList.add("hidden");
    document.body.classList.remove("battling");
    render();
  }

  function renderBattle() {
    const b = G.battle;
    if (!b) return;
    const e = b.enemy;
    const box = el("battle-box");

    const hpPct = Math.round((e.hp / e.maxHp) * 100);
    let html = "";
    html +=
      "<div class='battle-head'>" +
      "<div class='enemy-block'>" +
      "<div class='battle-avatar" + (e.boss ? " boss" : "") + "' style='--c:" + e.color + "'>" +
      iconSvg(e.key) + "</div>" +
      "<div><div class='enemy-name' style='color:" + e.color + "'>" + e.name + "</div>" +
      (e.boss ? "<div class='enemy-tag'>БОСС</div>" : "<div class='hud-num'>Монстр</div>") +
      "</div></div>" +
      "<div class='battle-hp'>" +
      "<div class='hud-label'>Здоровье врага</div>" +
      "<div class='hp-bar enemy'><i style='width:" + hpPct + "%'></i></div>" +
      "<div class='hud-num'>" + e.hp + " / " + e.maxHp + "</div></div>" +
      "</div>";

    if (b.phase === "question") {
      const c = b.challenge;
      if (c.type === "mc" || c.type === "fill" || c.type === "error") {
        const item = c.question || c.task;
        if (c.type === "mc") {
          html += "<div class='challenge-tag'>Вопрос</div>";
          html += "<div class='challenge-q'>" + item.text + "</div>";
        } else if (c.type === "fill") {
          html += "<div class='challenge-tag copy'>Вставь пропущенное</div>";
          html += "<div class='challenge-q'>" + item.title + "</div>";
          html += "<p class='lead' style='margin-bottom:10px'>Выбери, что вставить вместо ___</p>";
        } else {
          html += "<div class='challenge-tag code'>Найди ошибку</div>";
          html += "<div class='challenge-q'>" + item.title + "</div>";
          html += "<p class='lead' style='margin-bottom:10px'>Что не так в этом коде?</p>";
        }
        if (item.code) {
          html += "<pre class='code'>" + item.code + "</pre>";
        }
        html += "<div class='options' id='battle-options'></div>";
        html += "<div class='potion-row'><button class='btn ghost' id='hint-btn' type='button'>Подсказка (−10 HP)</button></div>";
      } else if (c.type === "copy") {
        html += "<div class='challenge-tag copy'>Повтори код</div>";
        html += "<div class='challenge-q'>" + c.task.title + "</div>";
        html += "<p class='lead' style='margin-bottom:10px'>" + c.task.task + "</p>";
        html += "<pre class='code sample-code' id='copy-sample'>" + c.task.code + "</pre>";
        html += "<div class='copy-note'>Копирование запрещено — перепиши код вручную.</div>";
        html += "<textarea class='code-editor' id='copy-input' spellcheck='false' autocomplete='off' autocorrect='off' autocapitalize='off' placeholder='Напиши код здесь...'></textarea>";
        html +=
          "<div class='battle-actions'>" +
          "<button class='btn' id='check-btn'>Проверить и атаковать</button></div>";
        html += "<div class='battle-feedback' id='copy-feedback'></div>";
      } else {
        html += "<div class='challenge-tag code'>Напиши функцию</div>";
        html += "<div class='challenge-q'>" + c.task.title + "</div>";
        html += "<p class='lead' style='margin-bottom:12px'>" + c.task.task + "</p>";
        html += "<textarea class='code-editor' id='code-input' spellcheck='false'></textarea>";
        html +=
          "<div class='battle-actions'>" +
          "<button class='btn purple' id='check-btn'>Проверить и атаковать</button></div>";
        html += "<div class='test-results' id='test-results'></div>";
        html += "<div class='battle-feedback' id='code-feedback'></div>";
      }
      html += potionRowHtml();
    } else {
      html += "<div class='battle-feedback " + (b.good ? "good" : "bad") + "'>" + b.feedback + "</div>";
      if (b.explanation) {
        html += "<div class='battle-explain'><b>Пояснение:</b> " + b.explanation + "</div>";
      }
      if (b.results) {
        html += "<div class='test-results'>";
        if (b.results.error) {
          html += "<div class='test-line fail'>" + b.results.error + "</div>";
        }
        (b.results.results || []).forEach((r, i) => {
          html +=
            "<div class='test-line " + (r.ok ? "pass" : "fail") + "'>" +
            "#" + (i + 1) + " " + (r.ok ? "пройден" : "провален") +
            " · ожидалось " + r.expected + ", получено " + r.actual + "</div>";
        });
        html += "</div>";
      }
      const label = b.won ? "Забрать добычу" : b.playerDead ? "Продолжить" : "Следующий вопрос";
      html += "<div class='battle-actions'><button class='btn' id='continue-btn'>" + label + "</button></div>";
    }

    box.innerHTML = html;

    if (
      b.phase === "question" &&
      (b.challenge.type === "mc" ||
        b.challenge.type === "fill" ||
        b.challenge.type === "error")
    ) {
      const item = b.challenge.question || b.challenge.task;
      const opts = el("battle-options");
      item.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option";
        btn.innerHTML = "<span class='key'>" + LETTERS[i] + "</span><span></span>";
        btn.lastChild.textContent = opt;
        btn.addEventListener("click", () => answerMC(i));
        opts.appendChild(btn);
      });
      const hb = el("hint-btn");
      if (hb) hb.addEventListener("click", useHint);
    } else if (b.phase === "question" && b.challenge.type === "copy") {
      const input = el("copy-input");
      input.value = b.challenge.code;
      input.addEventListener("input", () => (b.challenge.code = input.value));
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Tab") {
          ev.preventDefault();
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.value = input.value.slice(0, start) + "    " + input.value.slice(end);
          input.selectionStart = input.selectionEnd = start + 4;
          b.challenge.code = input.value;
        }
      });
      protectAgainstCopy(input);
      protectSample(el("copy-sample"));
      el("check-btn").addEventListener("click", checkCopy);
      input.focus();
    } else if (b.phase === "question" && b.challenge.type === "code") {
      const input = el("code-input");
      input.value = b.challenge.code;
      input.addEventListener("input", () => (b.challenge.code = input.value));
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Tab") {
          ev.preventDefault();
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.value = input.value.slice(0, start) + "    " + input.value.slice(end);
          input.selectionStart = input.selectionEnd = start + 4;
          b.challenge.code = input.value;
        }
      });
      el("check-btn").addEventListener("click", checkCode);
      input.focus();
    } else {
      el("continue-btn").addEventListener("click", continueBattle);
    }

    const potionBtn = el("battle-potion");
    if (potionBtn) potionBtn.addEventListener("click", useBattlePotion);
  }

  function blockCopyEvent(ev) {
    ev.preventDefault();
    toast("Копирование запрещено — набери код руками");
  }

  function protectAgainstCopy(input) {
    input.addEventListener("paste", blockCopyEvent);
    input.addEventListener("drop", blockCopyEvent);
    input.addEventListener("dragover", (ev) => ev.preventDefault());
    input.addEventListener("beforeinput", (ev) => {
      if (ev.inputType === "insertFromPaste" || ev.inputType === "insertFromDrop") {
        ev.preventDefault();
        toast("Копирование запрещено — набери код руками");
      }
    });
  }

  function protectSample(sample) {
    if (!sample) return;
    sample.addEventListener("copy", blockCopyEvent);
    sample.addEventListener("cut", blockCopyEvent);
    sample.addEventListener("contextmenu", (ev) => ev.preventDefault());
    sample.addEventListener("dragstart", (ev) => ev.preventDefault());
  }

  function potionRowHtml() {
    const n = countPotions();
    if (!n) return "";
    return (
      "<div class='potion-row'><button class='btn ghost' id='battle-potion' type='button'>" +
      "Выпить зелье (" + n + ")</button></div>"
    );
  }

  function useBattlePotion() {
    const idx = G.inventory.findIndex((i) => i.slot === "potion");
    if (idx < 0) return;
    if (G.player.hp >= G.player.maxHp) {
      toast("Здоровье уже полное");
      return;
    }
    const item = G.inventory[idx];
    const healed = Math.min(item.heal, G.player.maxHp - G.player.hp);
    G.player.hp += healed;
    G.inventory.splice(idx, 1);
    toast("+" + healed + " здоровья");
    updateHud();
    renderBattle();
    spawnFloat(el("battle-box"), "+" + healed, "heal", 20, 60);
  }

  function useHint() {
    const b = G.battle;
    if (!b || b.phase !== "question") return;
    const c = b.challenge;
    const item = c.question || c.task;
    if (!item || !item.options || c.hintUsed) return;
    if (G.player.hp <= 10) {
      toast("Мало здоровья для подсказки");
      return;
    }
    G.player.hp -= 10;
    G.stats.hintsUsed = (G.stats.hintsUsed || 0) + 1;
    c.hintUsed = true;
    const opts = el("battle-options");
    if (opts) {
      const wrong = Array.from(opts.children).filter((btn, i) => i !== item.answer);
      if (wrong.length) wrong[rand(0, wrong.length - 1)].remove();
    }
    const hb = el("hint-btn");
    if (hb) hb.remove();
    updateHud();
  }

  function checkCopy() {
    const b = G.battle;
    if (b.phase !== "question" || b.challenge.type !== "copy") return;
    const target = b.challenge.task.code;
    const typed = b.challenge.code || "";
    G.stats.copyTried += 1;

    const explain = b.challenge.task.explanation;
    if (!typed.trim()) {
      applyAttack(0, "Ты не написал код.", true, explain);
      return;
    }
    const exact = normalizeExact(typed) === normalizeExact(target);
    const loose = normalizeLoose(typed) === normalizeLoose(target);

    if (exact) {
      G.stats.copyPassed += 1;
      addGold(8);
      applyAttack(codeDamage(), "Точное совпадение! Отличный удар!", false, explain);
    } else if (loose) {
      G.stats.copyPassed += 1;
      addGold(4);
      applyAttack(
        Math.round(codeDamage() * 0.6),
        "Код совпал! Проверь отступы для точности.",
        false,
        explain
      );
    } else {
      applyAttack(
        0,
        "Код отличается. Сравни с образцом и попробуй снова.",
        true,
        explain
      );
    }
  }

  function answerMC(chosen) {
    const b = G.battle;
    if (b.phase !== "question") return;
    const c = b.challenge;
    const item = c.question || c.task;
    const topic = item.topic || "syntax";
    const level = item.level || 2;
    const correct = chosen === item.answer;
    G.stats.topicStats[topic] = G.stats.topicStats[topic] || { correct: 0, total: 0 };
    G.stats.topicStats[topic].total += 1;
    if (correct) {
      G.stats.correct += 1;
      G.stats.topicStats[topic].correct += 1;
      addGold(6);
      applyAttack(mcDamage(level), "Верно!", false, item.explanation);
    } else {
      G.stats.wrong += 1;
      pushMissed(c.type, item.id);
      applyAttack(
        0,
        "Неверно. Правильный ответ: " + LETTERS[item.answer] + ".",
        true,
        item.explanation
      );
    }
  }

  function checkCode() {
    const b = G.battle;
    if (b.phase !== "question" || b.busy) return;
    b.busy = true;
    const btn = el("check-btn");
    btn.disabled = true;
    btn.textContent = "Проверяем...";

    G.stats.codeTried += 1;
    fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: b.challenge.code, tests: b.challenge.task.tests })
    })
      .then((r) => r.json())
      .then((data) => {
        b.busy = false;
        const explain = b.challenge.task.explanation;
        if (!data.ok) {
          b.results = {
            error: data.error || "Не удалось проверить код",
            results: []
          };
          applyAttack(0, "Код не сработал: " + b.results.error, true, explain);
          return;
        }
        const total = data.total;
        const passed = data.passed;
        b.results = data;
        if (passed === total) {
          G.stats.codePassed += 1;
          addGold(12);
          applyAttack(codeDamage(), "Код прошёл все тесты! Критический удар!", false, explain);
        } else if (passed > 0) {
          addGold(6);
          applyAttack(Math.round(codeDamage() / 2), "Часть тестов пройдена (" + passed + "/" + total + ").", true, explain);
        } else {
          applyAttack(0, "Ни один тест не пройден (0/" + total + ").", true, explain);
        }
      })
      .catch(() => {
        b.busy = false;
        applyAttack(0, "Сервер проверки кода недоступен.", true, b.challenge.task.explanation);
      });
  }

  function continueBattle() {
    const b = G.battle;
    if (b.won) {
      closeBattle();
      return;
    }
    if (b.playerDead) {
      closeBattle();
      showDeath();
      return;
    }
    nextChallenge();
    renderBattle();
  }

  // ---------- Завершение ----------

  const LEVELS = [
    { max: 35, key: "novice", title: "Новичок" },
    { max: 60, key: "basic", title: "Базовый уровень" },
    { max: 85, key: "confident", title: "Уверенный уровень" },
    { max: 101, key: "advanced", title: "Продвинутый уровень" }
  ];

  function levelFromPercent(pct) {
    return LEVELS.find((l) => pct < l.max) || LEVELS[LEVELS.length - 1];
  }

  function buildResult(victoryFlag) {
    const total = G.stats.correct + G.stats.wrong;
    const percent = total ? Math.round((G.stats.correct / total) * 100) : 0;
    return {
      name: G.name,
      mode: "dungeon",
      date: new Date().toISOString(),
      percent,
      correctCount: G.stats.correct,
      total,
      seconds: Math.round((Date.now() - G.startedAt) / 1000),
      level: levelFromPercent(percent),
      topicStats: G.stats.topicStats,
      dungeon: {
        floorsCleared: G.stats.floorsCleared,
        kills: G.stats.kills,
        codePassed: G.stats.codePassed,
        codeTried: G.stats.codeTried,
        copyPassed: G.stats.copyPassed,
        copyTried: G.stats.copyTried,
        hintsUsed: G.stats.hintsUsed || 0,
        goldEarned: G.stats.goldEarned || 0,
        victory: !!victoryFlag
      }
    };
  }

  function submitResult(victoryFlag) {
    if (!/^https?:$/.test(window.location.protocol)) return;
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildResult(victoryFlag))
    }).catch(() => {});
  }

  function showDeath() {
    const earned = earnGameBadges();
    if (earned.length) toast("Достижение: " + earned.map((b) => b.title).join(", "));
    saveDungeonBest(false);
    submitResult(false);
    G.running = false;
    const p = G.player;
    el("end-box").innerHTML =
      "<div class='big-emoji-free game-over'>Поражение</div>" +
      "<h2 class='game-over'>Ты пал в бою</h2>" +
      "<p class='lead'>Ты дошёл до этажа " + (G.floorIndex + 1) + " и победил " +
      G.stats.kills + " монстров.</p>" +
      "<div class='battle-actions' style='justify-content:center;flex-wrap:wrap'>" +
      "<button class='btn' id='revive-btn'>Возродиться с половиной здоровья</button>" +
      "<button class='btn ghost' id='restart-btn'>Начать заново</button>" +
      "<a class='btn ghost link-btn' href='/'>К тесту</a>" +
      "</div>";
    el("end-overlay").classList.remove("hidden");
    el("revive-btn").addEventListener("click", () => {
      p.hp = Math.max(1, Math.floor(p.maxHp / 2));
      G.running = true;
      el("end-overlay").classList.add("hidden");
      log("Ты возродился с " + p.hp + " здоровья.");
      render();
    });
    el("restart-btn").addEventListener("click", () => {
      el("end-overlay").classList.add("hidden");
      reset();
    });
  }

  function victory() {
    if (G.finishedVictory) return;
    G.finishedVictory = true;
    G.running = false;
    clearSave();
    const earned = earnGameBadges();
    if (earned.length) toast("Достижение: " + earned.map((b) => b.title).join(", "));
    saveDungeonBest(true);
    submitResult(true);
    el("end-box").innerHTML =
      "<div class='big-emoji-free victory'>Победа</div>" +
      "<h2 class='victory'>Дракон повержен!</h2>" +
      "<p class='lead'>Ты прошёл подземелье. Правильных ответов: " + G.stats.correct +
      ", ошибок: " + G.stats.wrong + ". Написано функций: " + G.stats.codePassed +
      " из " + G.stats.codeTried + ". Повторено кода: " + G.stats.copyPassed +
      " из " + G.stats.copyTried + ".</p>" +
      "<div class='battle-actions' style='justify-content:center;flex-wrap:wrap'>" +
      "<button class='btn' id='again-btn'>Пройти заново</button>" +
      "<a class='btn ghost link-btn' href='/'>Пройти тест</a>" +
      "</div>";
    el("end-overlay").classList.remove("hidden");
    el("again-btn").addEventListener("click", () => {
      el("end-overlay").classList.add("hidden");
      reset();
    });
  }

  // ---------- Запуск / сброс ----------

  function begin() {
    const name = el("name").value.trim();
    if (!name) {
      toast("Введите имя героя");
      el("name").focus();
      return;
    }
    G.name = name;
    setLastName(name);
    clearSave();
    G.startedAt = Date.now();
    updateWalletLine();
    G.floorIndex = 0;
    G.player = {
      hp: 120,
      baseMaxHp: 120,
      maxHp: 120,
      level: 1,
      xp: 0,
      xpNext: 50,
      dmgBase: 12,
      atkBonus: 0,
      defBonus: 0,
      gold: 0
    };
    G.equipment = { weapon: null, armor: null, accessory: null };
    G.inventory = [{ ...itemById("small_potion") }];
    G.uid = 0;
    G.stats = {
      correct: 0,
      wrong: 0,
      codePassed: 0,
      codeTried: 0,
      copyPassed: 0,
      copyTried: 0,
      hintsUsed: 0,
      goldEarned: 0,
      topicStats: {},
      floorsCleared: 0,
      kills: 0
    };
    G.lastQId = null;
    G.codeQueue = [];
    G.copyQueue = [];
    G.fillQueue = [];
    G.errorQueue = [];
    G.missed = [];
    G.finishedVictory = false;
    G.running = true;
    document.body.classList.remove("battling");
    G.cache = {};
    G.visited = new Set([0]);
    recalcStats();
    el("log").innerHTML = "";
    toggleLog(false);
    show("game");
    activateFloor(0);
    claimWallet();
    renderInventory();
    log("Ты входишь в подземелье: " + FLOORS[0].name + ".");
    log("Сложность: " + DIFFICULTY[G.difficulty].name + ".");
    log("Монстры двигаются навстречу каждый твой ход.");
    log("Лестницу можно найти и спуститься, даже не убивая всех монстров.");
    log("Лестница вверх возвращает на прошлый этаж с его монстрами и добычей.");
    setMsg("Найди лестницу — спуститься можно, даже если монстры ещё живы.");
  }

  function updateWalletLine() {
    const line = el("wallet-line");
    if (!line) return;
    const name = el("name").value.trim();
    if (!name) {
      line.classList.add("hidden");
      return;
    }
    const prof = getProfile(name);
    line.classList.remove("hidden");
    const best = prof.dungeonBest
      ? " Рекорд: этаж " + prof.dungeonBest.floors + ", " + prof.dungeonBest.percent + "%" +
        (prof.dungeonBest.victory ? " (победа)" : "") + "."
      : " Подземелье ещё не пройдено.";
    line.textContent = "Кошелёк: " + walletText(prof.wallet) + "." + best;
    let b = el("game-badges");
    if (!b) {
      b = document.createElement("p");
      b.id = "game-badges";
      b.className = "lead";
      b.style.textAlign = "left";
      line.parentNode.insertBefore(b, line.nextSibling);
    }
    b.innerHTML = badgesHtml(prof);
  }

  function claimWallet() {
    const box = el("claim-box");
    if (!box || !box.checked) return;
    const prof = getProfile(G.name);
    if (!prof || walletEmpty(prof.wallet)) return;
    const parts = [];
    if (prof.wallet.gold > 0) {
      G.player.gold += prof.wallet.gold;
      parts.push("+" + prof.wallet.gold + " золота");
      prof.wallet.gold = 0;
    }
    ["small_potion", "big_potion"].forEach((key) => {
      while (prof.wallet[key] > 0) {
        const item = itemById(key === "small_potion" ? "small_potion" : "big_potion");
        if (!item) break;
        G.inventory.push(Object.assign({}, item));
        prof.wallet[key] -= 1;
        parts.push("зелье: " + item.name);
      }
    });
    putProfile(G.name, prof);
    if (parts.length) log("Награды из кошелька: " + parts.join(", ") + ".");
  }

  function earnGameBadges() {
    const prof = getProfile(G.name);
    if (!prof) return [];
    const today = new Date().toISOString().slice(0, 10);
    if (prof.stats.days.indexOf(today) < 0) prof.stats.days.push(today);
    prof.stats.codeSolved += G.stats.codePassed || 0;
    const earned = earnBadges(prof);
    putProfile(G.name, prof);
    syncProfile(G.name);
    return earned;
  }

  function saveDungeonBest(victoryFlag) {
    const prof = getProfile(G.name);
    if (!prof) return;
    const total = G.stats.correct + G.stats.wrong;
    const percent = total ? Math.round((G.stats.correct / total) * 100) : 0;
    const cur = {
      percent,
      floors: G.floorIndex + 1,
      victory: !!victoryFlag,
      date: new Date().toISOString()
    };
    const prev = prof.dungeonBest;
    if (!prev || cur.victory > prev.victory ||
        (cur.victory === prev.victory && cur.floors > prev.floors) ||
        (cur.victory === prev.victory && cur.floors === prev.floors && cur.percent > prev.percent)) {
      prof.dungeonBest = cur;
      putProfile(G.name, prof);
    }
  }

  function reset() {
    G.running = false;
    G.battle = null;
    el("battle-overlay").classList.add("hidden");
    document.body.classList.remove("battling");
    show("start");
    updateResumeButton();
    updateWalletLine();
  }

  function leave() {
    if (window.confirm("Выйти в меню? Прогресс сохранится, можно будет продолжить.")) {
      saveGame();
      reset();
    }
  }

  // ---------- Сохранение / загрузка ----------

  let saveTimer = null;

  function toggleLog(force) {
    const box = el("log");
    const btn = el("log-toggle");
    if (!box) return;
    const open = force != null ? !!force : box.classList.contains("collapsed");
    box.classList.toggle("collapsed", !open);
    if (btn) btn.classList.toggle("active", open);
    if (open) box.scrollTop = box.scrollHeight;
  }

  function scheduleSave() {
    if (!G.running || !G.stats) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveGame, 400);
  }

  function serializeFloor(st) {
    return {
      index: st.index,
      map: st.map,
      playerPos: st.playerPos,
      stairsDown: st.stairsDown,
      stairsUp: st.stairsUp,
      enemies: st.enemies.map((e) => ({
        uid: e.uid,
        key: e.key,
        name: e.name,
        short: e.short,
        color: e.color,
        maxHp: e.maxHp,
        hp: e.hp,
        dmg: e.dmg,
        boss: !!e.boss,
        enraged: !!e.enraged,
        x: e.x,
        y: e.y
      })),
      treasures: st.treasures.map((t) => ({ uid: t.uid, x: t.x, y: t.y, item: t.item })),
      traders: (st.traders || []).map((t) => ({ uid: t.uid, x: t.x, y: t.y })),
      discovered: Array.from(st.discovered || [])
    };
  }

  function deserializeFloor(o) {
    return {
      index: o.index,
      map: o.map,
      playerPos: o.playerPos,
      stairsDown: o.stairsDown,
      stairsUp: o.stairsUp,
      enemies: (o.enemies || []).map((e) => Object.assign({}, e)),
      treasures: (o.treasures || []).map((t) => Object.assign({}, t)),
      traders: (o.traders || []).map((t) => Object.assign({}, t)),
      discovered: new Set(o.discovered || [])
    };
  }

  function saveGame() {
    if (!G.running || !G.stats) return;
    try {
      snapshotCurrent();
      const data = {
        v: 1,
        name: G.name,
        difficulty: G.difficulty,
        floorIndex: G.floorIndex,
        startedAt: G.startedAt,
        player: G.player,
        equipment: G.equipment,
        inventory: G.inventory,
        stats: G.stats,
        visited: Array.from(G.visited),
        uid: G.uid,
        missed: G.missed || [],
        cameraZoom: G.camera.zoomIndex,
        floors: Object.keys(G.cache).map((k) => serializeFloor(G.cache[k]))
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage может быть недоступен — просто пропускаем
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function updateResumeButton() {
    const btn = el("resume-btn");
    if (!btn) return;
    const data = readSave();
    if (data && data.v === 1) {
      btn.style.display = "";
      btn.textContent =
        "Продолжить — этаж " + (data.floorIndex + 1) + " (" + (data.name || "герой") + ")";
    } else {
      btn.style.display = "none";
    }
  }

  function loadGame() {
    const data = readSave();
    if (!data || data.v !== 1) return;
    G.name = data.name || "Герой";
    G.difficulty = data.difficulty || "easy";
    G.startedAt = data.startedAt || Date.now();
    G.player = data.player;
    G.equipment = data.equipment || { weapon: null, armor: null, accessory: null };
    G.inventory = data.inventory || [];
    G.stats = data.stats;
    G.visited = new Set(data.visited || [0]);
    G.uid = data.uid || 0;
    G.missed = data.missed || [];
    G.cache = {};
    (data.floors || []).forEach((f) => {
      G.cache[f.index] = deserializeFloor(f);
    });
    G.entityEls = new Map();
    G.battle = null;
    G.codeQueue = [];
    G.copyQueue = [];
    G.fillQueue = [];
    G.errorQueue = [];
    G.finishedVictory = false;
    G.running = true;
    document.body.classList.remove("battling");
    el("difficulty").querySelectorAll(".mode").forEach((m) => {
      m.classList.toggle("active", m.dataset.diff === G.difficulty);
    });
    el("name").value = G.name;
    recalcStats();
    el("log").innerHTML = "";
    toggleLog(false);
    show("game");
    activateFloor(data.floorIndex || 0);
    renderInventory();
    if (data.cameraZoom != null) {
      G.camera.zoomIndex = data.cameraZoom;
      updateCamera();
    }
    log("Продолжение игры. Этаж " + (G.floorIndex + 1) + ": " + FLOORS[G.floorIndex].name + ".");
    setMsg("Игра восстановлена из сохранения.");
  }

  // ---------- Ввод ----------

  const DIRS = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0]
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      node.innerHTML = iconSvg(node.dataset.icon);
    });

    el("begin-btn").addEventListener("click", begin);
    el("resume-btn").addEventListener("click", loadGame);
    el("leave-btn").addEventListener("click", leave);
    el("shop-btn").addEventListener("click", () => openShop(false));
    el("minimap").addEventListener("click", toggleMinimap);
    el("log-toggle").addEventListener("click", () => toggleLog());
    updateResumeButton();
    updateWalletLine();
    el("name").addEventListener("input", updateWalletLine);
    el("name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") begin();
    });

    el("difficulty").addEventListener("click", (e) => {
      const mode = e.target.closest(".mode");
      if (!mode) return;
      el("difficulty").querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
      mode.classList.add("active");
      G.difficulty = mode.dataset.diff;
    });

    window.addEventListener("resize", () => {
      if (G.running && G.map && !el("screen-game").classList.contains("hidden")) {
        render();
      }
    });

    el("map-scroll").addEventListener(
      "wheel",
      (e) => {
        if (!G.running || !G.map) return;
        e.preventDefault();
        const step = e.deltaY < 0 ? 1 : -1;
        G.camera.zoomIndex = clamp(
          (G.camera.zoomIndex == null ? 2 : G.camera.zoomIndex) + step,
          0,
          CAM_LEVELS.length - 1
        );
        updateCamera();
        renderEntities();
      },
      { passive: false }
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "i" || e.key === "I" || e.key === "ш" || e.key === "Ш") {
        if (!el("screen-game").classList.contains("hidden") &&
            el("battle-overlay").classList.contains("hidden")) {
          openInventory();
          return;
        }
      }
      if (e.key === "m" || e.key === "M" || e.key === "ь" || e.key === "Ь") {
        if (!el("screen-game").classList.contains("hidden")) {
          toggleMinimap();
          return;
        }
      }
      if (e.key === "Escape" && !el("shop-overlay").classList.contains("hidden")) {
        closeShop();
        return;
      }
      if (!el("battle-overlay").classList.contains("hidden")) return;
      if (!el("end-overlay").classList.contains("hidden")) return;
      if (!el("shop-overlay").classList.contains("hidden")) return;
      if (el("screen-game").classList.contains("hidden")) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "w",
        a: "a",
        s: "s",
        d: "d"
      };
      const dir = map[k] || map[e.key];
      if (dir) {
        e.preventDefault();
        const d = DIRS[dir];
        move(d[0], d[1]);
      }
    });
  });
})();
