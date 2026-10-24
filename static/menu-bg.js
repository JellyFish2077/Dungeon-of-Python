// Живой фон главного меню: процедурные подземелья без тумана войны.
//
// Два слоя меняются крест-накрест: новый подземный этаж плавно проявляется,
// старый одновременно гаснет. Генерация дешёвая (canvas 960×600), поэтому
// меню не зависит от загрузки игровых этажей и работает до входа в игру.
(function () {
  "use strict";

  const W = 960;
  const H = 608;
  const COLS = 30;
  const ROWS = 19;
  const T = 32;
  const SWAP_MS = 8000;
  const BIOME_THEMES = [0, 2, 4, 6, 9];

  const THEMES = [
    { floor: ["#1c2632", "#202b38", "#18222d"], wall: ["#2b3441", "#333e4d", "#202833"], edge: "#455365", glow: "#e8b75b", moss: "#4e7a52" },
    { floor: ["#20291f", "#243027", "#1a231b"], wall: ["#30382c", "#394436", "#252d23"], edge: "#54654b", glow: "#f0c56a", moss: "#78a75d" },
    { floor: ["#28222f", "#302837", "#211c28"], wall: ["#3a3143", "#463a4f", "#2d2735"], edge: "#655477", glow: "#e3a85b", moss: "#627d55" },
    { floor: ["#2b241e", "#342b24", "#241e19"], wall: ["#3d332a", "#4a3d31", "#30271f"], edge: "#6b5841", glow: "#ffc36a", moss: "#6f7d4a" }
  ];

  let timer = null;
  let active = false;
  let started = false;
  let current = 0;
  let layers = [];
  const tileImages = new Map();
  let repaintQueued = false;

  // Раньше фон рисовался цветными прямоугольниками. Теперь, если рядом уже
  // загружены настоящие тайлы (terrain.js), фон собирается из них. Пока
  // картинки декодируются, остаётся процедурный fallback — меню не мигает
  // пустотой.
  function imageFor(uri) {
    if (!uri || typeof Image === "undefined") return null;
    let img = tileImages.get(uri);
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (!active || repaintQueued) return;
        repaintQueued = true;
        setTimeout(() => {
          repaintQueued = false;
          if (active && typeof paintDungeon === "function") reveal(paintDungeon());
        }, 30);
      };
      img.src = uri;
      tileImages.set(uri, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }

  function drawTile(ctx, uri, px, py) {
    const img = imageFor(uri);
    if (!img) return false;
    ctx.drawImage(img, px, py, T, T);
    return true;
  }

  function el(id) {
    return typeof document !== "undefined" ? document.getElementById(id) : null;
  }

  function rint(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function prepareLayers() {
    if (layers.length) return;
    layers = [el("menu-dungeon-a"), el("menu-dungeon-b")].filter(Boolean);
  }

  function buildMap() {
    const floor = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const rooms = [];

    function carveRoom(room) {
      for (let y = room.y; y < room.y + room.h; y += 1) {
        for (let x = room.x; x < room.x + room.w; x += 1) {
          if (y > 0 && y < ROWS - 1 && x > 0 && x < COLS - 1) floor[y][x] = true;
        }
      }
    }

    function overlaps(a, b) {
      return a.x - 1 < b.x + b.w + 1 && a.x + a.w + 1 > b.x - 1 &&
        a.y - 1 < b.y + b.h + 1 && a.y + a.h + 1 > b.y - 1;
    }

    for (let attempt = 0; attempt < 120 && rooms.length < 9; attempt += 1) {
      const room = {
        w: rint(4, 9),
        h: rint(3, 6),
        x: rint(2, COLS - 11),
        y: rint(2, ROWS - 8)
      };
      if (rooms.some((other) => overlaps(room, other))) continue;
      rooms.push(room);
      carveRoom(room);
    }

    if (rooms.length < 3) {
      // Страховка от неудачной раскладки: центральный зал и две комнаты.
      rooms.length = 0;
      const fallback = [
        { x: 12, y: 7, w: 8, h: 6 },
        { x: 3, y: 3, w: 6, h: 4 },
        { x: 23, y: 12, w: 6, h: 4 }
      ];
      fallback.forEach((room) => {
        rooms.push(room);
        carveRoom(room);
      });
    }

    function carveH(x1, x2, y) {
      const from = Math.min(x1, x2);
      const to = Math.max(x1, x2);
      for (let x = from; x <= to; x += 1) {
        for (let dy = 0; dy < 2; dy += 1) {
          if (floor[y + dy] && floor[y + dy][x] !== undefined) floor[y + dy][x] = true;
        }
      }
    }

    function carveV(y1, y2, x) {
      const from = Math.min(y1, y2);
      const to = Math.max(y1, y2);
      for (let y = from; y <= to; y += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          if (floor[y] && floor[y][x + dx] !== undefined) floor[y][x + dx] = true;
        }
      }
    }

    for (let i = 1; i < rooms.length; i += 1) {
      const a = rooms[i - 1];
      const b = rooms[i];
      const ax = Math.floor(a.x + a.w / 2);
      const ay = Math.floor(a.y + a.h / 2);
      const bx = Math.floor(b.x + b.w / 2);
      const by = Math.floor(b.y + b.h / 2);
      if (Math.random() < 0.5) {
        carveH(ax, bx, ay);
        carveV(ay, by, bx);
      } else {
        carveV(ay, by, ax);
        carveH(ax, bx, by);
      }
    }

    // Пара петель, чтобы карта не выглядела цепочкой комнат.
    for (let i = 0; i < 2 && rooms.length > 3; i += 1) {
      const a = pick(rooms);
      const b = pick(rooms);
      if (a === b) continue;
      carveH(
        Math.floor(a.x + a.w / 2),
        Math.floor(b.x + b.w / 2),
        Math.floor(a.y + a.h / 2)
      );
    }

    const wall = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (floor[y][x]) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (floor[ny] && floor[ny][nx]) {
              near = true;
              break;
            }
          }
        }
        wall[y][x] = near;
      }
    }

    return { floor: floor, wall: wall, rooms: rooms, theme: pick(THEMES) };
  }

  function paintDungeon() {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.imageSmoothingEnabled = false;
    const map = buildMap();
    const themeIndex = pick(BIOME_THEMES);
    const theme = THEMES[themeIndex % THEMES.length];
    const tiles = (typeof TERRAIN_FLOORS !== "undefined" && TERRAIN_FLOORS[themeIndex])
      ? TERRAIN_FLOORS[themeIndex] : null;

    ctx.fillStyle = "#05080d";
    ctx.fillRect(0, 0, W, H);

    // Мягкое свечение в центре: подземелье видно даже по краям, но без тумана.
    const ambient = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.72);
    ambient.addColorStop(0, "rgba(45, 64, 82, 0.32)");
    ambient.addColorStop(1, "rgba(5, 8, 13, 0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 4200; i += 1) {
      ctx.fillStyle = "rgba(255, 255, 255, " + (Math.random() * 0.018) + ")";
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!map.floor[y][x]) continue;
        const px = x * T;
        const py = y * T;
        const uri = tiles && tiles.floor.length
          ? tiles.floor[((x * 7 + y * 13) % tiles.floor.length + tiles.floor.length) % tiles.floor.length]
          : "";
        if (!drawTile(ctx, uri, px, py)) {
          ctx.fillStyle = pick(theme.floor);
          ctx.fillRect(px, py, T, T);
          ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
          ctx.fillRect(px, py, T, 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
          ctx.fillRect(px, py + T - 2, T, 2);
        }
        if (Math.random() < 0.2 && typeof TERRAIN_DECOR !== "undefined") {
          const list = TERRAIN_DECOR[pick(["grass", "moss", "bones", "crystal"])];
          if (list && list.length) {
            ctx.globalAlpha = 0.9;
            drawTile(ctx, pick(list), px, py);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!map.wall[y][x]) continue;
        const px = x * T;
        const py = y * T;
        const uri = tiles && tiles.wall.length
          ? tiles.wall[((x * 11 + y * 5) % tiles.wall.length + tiles.wall.length) % tiles.wall.length]
          : "";
        if (drawTile(ctx, uri, px, py)) continue;
        ctx.fillStyle = theme.wall[2];
        ctx.fillRect(px, py + 3, T, T - 3);
        ctx.fillStyle = theme.wall[0];
        ctx.fillRect(px + 1, py + 1, T - 2, T - 5);
        ctx.fillStyle = theme.wall[1];
        ctx.fillRect(px + 2, py + 2, T - 4, 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillRect(px + 2, py + T - 6, T - 4, 3);
        ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
        ctx.fillRect(px + 3, py + 8, T - 6, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(px + T - 4, py + 9, 2, T - 16);
      }
    }

    // Декор: лестница в дальней комнате, сундуки, бочки, кости и факелы.
    const far = map.rooms[map.rooms.length - 1];
    const stairsX = Math.floor(far.x + far.w / 2);
    const stairsY = Math.floor(far.y + far.h / 2);
    const stairsUri = (typeof TERRAIN_STAIRS !== "undefined" && TERRAIN_STAIRS.down)
      ? TERRAIN_STAIRS.down[0] : "";
    if (!drawTile(ctx, stairsUri, stairsX * T, stairsY * T)) {
      const sx = stairsX * T + 3;
      const sy = stairsY * T + 3;
      ctx.fillStyle = "#05080d";
      ctx.fillRect(sx, sy, T - 6, T - 6);
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i % 2 ? "#596575" : "#3e4857";
        ctx.fillRect(sx + 2 + i, sy + 4 + i * 5, T - 10 - i * 2, 3);
      }
    }

    const openCells = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (map.floor[y][x] && Math.abs(x - stairsX) + Math.abs(y - stairsY) > 2) {
          openCells.push([x, y]);
        }
      }
    }
    function shuffle(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
    shuffle(openCells);

    function chest(x, y) {
      if (typeof TERRAIN_OBJECTS !== "undefined" && drawTile(ctx, TERRAIN_OBJECTS.chest, x * T, y * T)) return;
      const cx = x * T + 5;
      const cy = y * T + 10;
      ctx.fillStyle = "#5b3b20";
      ctx.fillRect(cx, cy, T - 10, T - 15);
      ctx.fillStyle = "#8e5c2b";
      ctx.fillRect(cx + 1, cy + 1, T - 12, 6);
      ctx.fillStyle = "#d2a34c";
      ctx.fillRect(cx + 4, cy + 7, 3, T - 18);
      ctx.fillRect(cx + T - 14, cy + 7, 3, T - 18);
      ctx.fillStyle = "#f0c56a";
      ctx.fillRect(cx + Math.floor((T - 10) / 2) - 1, cy + 8, 3, 3);
    }

    function barrel(x, y) {
      const obj = (typeof TERRAIN_VILLAGE !== "undefined" && TERRAIN_VILLAGE.objects)
        ? TERRAIN_VILLAGE.objects.barrel : "";
      if (drawTile(ctx, obj, x * T, y * T)) return;
      const cx = x * T + 8;
      const cy = y * T + 8;
      ctx.fillStyle = "#4b3422";
      ctx.fillRect(cx, cy, T - 16, T - 14);
      ctx.fillStyle = "#6d4b2d";
      ctx.fillRect(cx + 2, cy, 2, T - 14);
      ctx.fillStyle = "#9d7c48";
      ctx.fillRect(cx, cy + 3, T - 16, 2);
      ctx.fillRect(cx, cy + T - 19, T - 16, 2);
    }

    function bones(x, y) {
      if (typeof TERRAIN_DECOR !== "undefined" && TERRAIN_DECOR.bones && TERRAIN_DECOR.bones.length
          && drawTile(ctx, pick(TERRAIN_DECOR.bones), x * T, y * T)) return;
      const cx = x * T + T / 2;
      const cy = y * T + T / 2;
      ctx.strokeStyle = "#a7a18d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 2);
      ctx.lineTo(cx + 6, cy + 2);
      ctx.moveTo(cx + 5, cy - 4);
      ctx.lineTo(cx - 5, cy + 4);
      ctx.stroke();
      ctx.fillStyle = "#c8c1a9";
      ctx.beginPath();
      ctx.arc(cx + 7, cy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function torch(x, y) {
      const cx = x * T + T / 2;
      const cy = y * T + T / 2;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 72);
      glow.addColorStop(0, "rgba(255, 190, 90, 0.34)");
      glow.addColorStop(1, "rgba(255, 170, 60, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 72, cy - 72, 144, 144);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(cx - 3, cy + 4, 6, 10);
      ctx.fillStyle = "#f2b23e";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe4a1";
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    openCells.slice(0, 4).forEach(([x, y]) => chest(x, y));
    openCells.slice(4, 9).forEach(([x, y]) => barrel(x, y));
    openCells.slice(9, 15).forEach(([x, y]) => bones(x, y));
    if (typeof TERRAIN_OBJECTS !== "undefined" && TERRAIN_OBJECTS.portal && openCells[15]) {
      const [px, py] = openCells[15];
      drawTile(ctx, TERRAIN_OBJECTS.portal, px * T, py * T);
    }

    // Факелы ставим у стен, чтобы свет читался как настоящий.
    const torches = openCells.filter(([x, y]) => {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (map.wall[y + dy] && map.wall[y + dy][x + dx]) return true;
        }
      }
      return false;
    }).slice(0, 8);
    torches.forEach(([x, y]) => torch(x, y));

    // Углы темнее: взгляд сам держится за центр с названием и списком.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.7);
    vignette.addColorStop(0, "rgba(2, 6, 23, 0)");
    vignette.addColorStop(1, "rgba(2, 6, 23, 0.66)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    try {
      return canvas.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  }

  function reveal(url) {
    if (!url || !layers.length) return;
    const nextIndex = started ? 1 - current : 0;
    const next = layers[nextIndex];
    const old = layers[current];
    if (!next) return;
    next.style.backgroundImage = 'url("' + url + '")';
    next.classList.remove("is-on");
    // Принудительный reflow, чтобы смена background успела до transition.
    void next.offsetWidth;
    next.classList.add("is-on");
    if (started && old && old !== next) {
      old.classList.remove("is-on");
      setTimeout(() => {
        if (!old.classList.contains("is-on")) old.style.backgroundImage = "";
      }, 2400);
    }
    current = nextIndex;
    started = true;
  }

  function reducedMotion() {
    return typeof document !== "undefined" && document.body &&
      document.body.classList.contains("reduce-motion");
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = null;
    if (!active || reducedMotion()) return;
    timer = setInterval(() => {
      if (!active || document.hidden) return;
      reveal(paintDungeon());
    }, SWAP_MS);
  }

  function show() {
    if (active) return;
    active = true;
    prepareLayers();
    if (!started) reveal(paintDungeon());
    schedule();
  }

  function hide() {
    active = false;
    if (timer) clearInterval(timer);
    timer = null;
  }

  window.PyMenuBackground = {
    show: show,
    hide: hide,
    // Для проверок: следующий этаж можно попросить вручную.
    refresh: function () {
      if (active) reveal(paintDungeon());
    }
  };
})();
