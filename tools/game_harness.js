    const fs = require("fs");
    const path = require("path");
    const vm = require("vm");
    // Файл лежит в tools/, а игра — на уровень выше в static/.
    // Разрешаем путь и от tools/, и от корня, чтобы модуль работал и когда
    // его подключают через require прямо из корня проекта.
    const dir = fs.existsSync(path.join(__dirname, "static"))
      ? path.join(__dirname, "static")
      : path.join(__dirname, "..", "static");

    // ---------------- минимальный DOM ----------------
    function mkEl(tag) {
      const node = {
        tagName: String(tag).toUpperCase(),
        // Переменные CSS запоминаются: по ним getComputedStyle отдаёт то, что
        // игра записала сама (--cell от зума), а не одно и то же число.
        style: {
          _vars: {},
          setProperty(k, v) { this._vars[k] = String(v); },
          removeProperty(k) { delete this._vars[k]; }
        },
        dataset: {},
        classList: {
          _s: new Set(),
          add(...c) { c.forEach((x) => this._s.add(x)); },
          remove(...c) { c.forEach((x) => this._s.delete(x)); },
          toggle(c, on) {
            if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
            else if (on) this._s.add(c); else this._s.delete(c);
          },
          contains(c) { return this._s.has(c); }
        },
        children: [],
        childNodes: [],
        parentElement: null,
        _html: "",
        outerHTML: "",
        textContent: "",
        value: "",
        disabled: false,
        display: "",
        scrollTop: 0,
        clientWidth: 900,
        clientHeight: 600,
        offsetWidth: 100,
        offsetHeight: 50,
        scrollIntoView() {},
        // remove() отцепляет узел, как в браузере. Пустая заглушка копила
        // узлы карты: игра снимает их при каждой смене этажа, и за сотни
        // партий бота (у угадывающего — по 40 смертей) куча росла до 4 ГБ.
        remove() { if (this.parentElement) this.parentElement.removeChild(this); },
        appendChild(c) { this.children.push(c); c.parentElement = this; return c; },
        // removeChild обязан реально убирать узел: log() в game.js чистит
        // журнал циклом `while (children.length > 40) removeChild(firstChild)`,
        // и пустая заглушка превращает его в бесконечный цикл.
        removeChild(c) {
          this.children = this.children.filter((x) => x !== c);
          this.childNodes = this.childNodes.filter((x) => x !== c);
          this.lastChild = this.children[this.children.length - 1] || null;
          if (c) c.parentElement = null;
          return c;
        },
        get firstChild() { return this.children[0] || null; },
        insertBefore(c) { this.children.push(c); return c; },
        // Атрибуты хранятся по-настоящему: по ним проверки видят значки
        // в шапке (data-ready у кузницы, data-unread у журнала).
        _attrs: {},
        setAttribute(k, v) { this._attrs[k] = String(v); },
        removeAttribute(k) { delete this._attrs[k]; },
        getAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attrs, k) ? this._attrs[k] : null; },
        hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attrs, k); },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener() {},
        removeEventListener() {},
        getBoundingClientRect() { return { width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50 }; },
        focus() {}
      };
      // Мини-парсер innerHTML со стеком: игре нужны только children и
      // lastChild создаваемых кнопок-вариантов.
      Object.defineProperty(node, "innerHTML", {
        get() { return node._html; },
        set(v) {
          node._html = String(v);
          node.children = [];
          node.childNodes = [];
          node.lastChild = null;
          // В браузере разметка с id создаёт новый элемент вместо прежнего.
          // Заглушка же отдаёт по id один и тот же узел, и кнопки вариантов
          // копились в #battle-options от вопроса к вопросу — у бота тысячи
          // за партию, пока куча не кончалась. Обнуляем тёзку, как браузер.
          (node._html.match(/\sid=['"][^'"]+['"]/g) || []).forEach((m) => {
            const old = store[m.slice(5, -1)];
            if (!old || old === node) return;
            old.children = [];
            old.childNodes = [];
            old.lastChild = null;
            old._html = "";
          });
          const stack = [node];
          const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*?)?\/?>/g;
          let m;
          while ((m = tagRe.exec(node._html))) {
            const full = m[0];
            const name = m[1].toLowerCase();
            if (full[1] === "/") {
              if (stack.length > 1) stack.pop();
              continue;
            }
            if (["br", "hr", "img", "input", "meta", "link"].indexOf(name) >= 0) continue;
            if (full[full.length - 2] === "/") continue;
            const child = mkEl(name);
            const parent = stack[stack.length - 1];
            parent.children.push(child);
            parent.childNodes.push(child);
            parent.lastChild = child;
            stack.push(child);
          }
        },
        configurable: true
      });
      node.lastChild = null;
      return node;
    }
    const store = {};
    const noopCtx = new Proxy({}, {
      get(t, k) {
        if (k === "canvas") return { width: 184, height: 132 };
        if (k === "measureText") return () => ({ width: 10 });
        return () => {};
      },
      set() { return true; }
    });
    function el(id) {
      if (!store[id]) {
        store[id] = id === "minimap" ? mkEl("canvas") : mkEl("div");
        store[id].parentElement = mkEl("div");
        if (id === "minimap") {
          store[id].width = 184;
          store[id].height = 132;
          store[id].getContext = () => noopCtx;
        }
      }
      return store[id];
    }
    globalThis.document = {
      body: mkEl("body"),
      documentElement: mkEl("html"),
      getElementById: el,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (t) => mkEl(t),
      createDocumentFragment: () => mkEl("fragment"),
      addEventListener() {},
      removeEventListener() {},
      visibilityState: "visible",
      hidden: false
    };
    const storage = {
      _d: {},
      getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; }
    };
    globalThis.localStorage = storage;
    globalThis.window = globalThis;
    globalThis.self = globalThis;
    globalThis.top = globalThis;
    // Проверки синхронные: они вызывают restartFloor/спуск и сразу читают
    // состояние, а в браузере этаж грузится через кадр под оверлеем.
    // Флаг включает в game.js синхронную ветку загрузки с той же проверкой
    // генерации — ждать кадр в node некому.
    globalThis.__PYQUIZ_SYNC_FLOORS = true;
    globalThis.getComputedStyle = (node) => ({
      getPropertyValue: (p) => {
        const own = node && node.style && node.style._vars ? node.style._vars[p] : undefined;
        if (own !== undefined) return own;
        return p === "--cell" ? "46" : p === "--gap" ? "4" : p === "--pad" ? "14" : "";
      }
    });
    globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
    globalThis.innerWidth = 1200;
    globalThis.innerHeight = 800;
    globalThis.devicePixelRatio = 1;
    globalThis.location = { protocol: "file:", href: "file:///game", origin: "null" };
    globalThis.navigator = { userAgent: "node", language: "ru-RU", clipboard: { writeText() {} } };
    globalThis.alert = () => {};
    globalThis.confirm = () => true;
    globalThis.prompt = () => "";
    globalThis.fetch = () => Promise.reject(new Error("offline"));
    globalThis.URL = { createObjectURL: () => "", revokeObjectURL() {} };
    globalThis.scrollTo = () => {};
    globalThis.scrollBy = () => {};
    globalThis.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    globalThis.MutationObserver = function () { this.observe = () => {}; this.disconnect = () => {}; };
    globalThis.addEventListener = () => {};

    // ---------------- склейка контента ----------------
    const FILES = [
      "questions.js", "variants.js", "code-tasks.js", "task-meta.js", "practice-variants.js", "items.js",
      "icons.js", "sprites.js", "terrain.js", "dungeon-content.js", "village-content.js", "profile.js",
      "auth.js", "game.js"
    ];
    const bundle = FILES.map((f) => {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      return "/* ==== " + f + " ==== */\n" + src;
    }).join("\n");

    // Внутренние функции game.js живут в IIFE — экспортируем их хуком
    // прямо в тексте скрипта, не трогая сам файл.
    const gameSrc = fs.readFileSync(path.join(dir, "game.js"), "utf8");
    const fnNames = [...new Set(
      [...gameSrc.matchAll(/^  function ([A-Za-z0-9_$]+)/gm)].map((m) => m[1])
    )];
    const exportHook =
      "\n;globalThis.__api = {" +
      ["G", "ENEMY_TYPES", "FLOORS", "DIFFICULTY", "TOPICS", "ITEM_POOL", "RARITY", "itemsForFloor",
       "bossDrop",
       "VILLAGE_MAP", "VILLAGE_SPAWN", "VILLAGE_HOUSES", "HOUSE_MAPS", "VILLAGE_NPCS",
       "VILLAGE_TILES", "VILLAGE_GROUND", "VILLAGE_SEALED", "VILLAGE_ROOF_COLORS",
       "villageParseMap", "villageHouseAtDoor", "villageBuildingList", "villageMaterials",
       "SLOT_NAMES", "ICONS", "SPRITES", "spriteImg", "mapIcon", "QUESTIONS", "FILL_TASKS",
       "TERRAIN_FLOORS", "TERRAIN_WATER", "TERRAIN_LAVA", "TERRAIN_DECOR", "TERRAIN_STAIRS",
       "TERRAIN_TRAPS", "TERRAIN_DOORS", "TERRAIN_ICONS", "TERRAIN_DECOR_NAMES",
       "terrainPick", "terrainBg", "terrainDecorUri", "terrainAnimFrames", "terrainAnimBg",
       "terrainKind", "terrainIcon", "terrainIsInfernal", "terrainDecorName",
       "terrainObjectUri", "terrainFloorBg", "terrainLavaCellBg", "TERRAIN_OBJECT_DECOR",
       "ERROR_TASKS", "CODE_TASKS", "COPY_TASKS", "TRAP_TYPES", "FLOOR_EPILOGUES",
       "FLOOR_EVENTS", "ENEMY_QUIPS", "ENEMY_DEFEAT_QUIPS", "SAVE_KEY", "AGGRO_RADIUS",
       "trapsForFloor", "trapBudgetForFloor", "trapByKey",
       "floorEpilogue", "floorEvent", "floorTip", "enemyQuip", "enemyDefeatQuip",
       "effectText", "itemBonusText", "EFFECT_HINTS", "DIRS", "STEP_DIRS",
       "enemyDamageFor", "QUALITY", "ELITE", "ELITE_ABILITY_TEXT", "ELITE_TITLES",
       "eliteTitleFor", "eliteAbilityText", "eliteChanceFor", "eliteGoldBonus",
       "qualityLabelFor", "attackMulFor", "bonusMulFor", "setQuality",
       "streakMul", "abilityOfType", "serializeFloor", "deserializeFloor",
       "STREAK_CAP", "HINT_CAP", "TASK_POWER", "SQUAD", "RANGED", "squadMembersOf",
       "squadAliveCount", "nextSquadEnemy", "squadLeaderOf", "moveEnemyTo",
       "squadSizeFor", "startSquadMember", "stepAwayFrom",
       "HAZARD_TYPES", "FLOOR_HAZARD", "HAZARD_DENSITY", "BLESSINGS", "BLESS",
       "hazardByKey", "floorHazard", "hazardDensity", "blessOffered", "blessingFor",
       "itemWeightFor", "ITEM_SETS", "setByKey", "itemSetKey", "ARMOR", "ECON",
       "FORGE_TRACKS", "SHOP_WARES", "POTION_PRICE", "SNARE_WAITS", "CAM_LEVELS",
       "LEGACY_CAM_LEVELS", "mapIconIsPixel", "ITEM_SPRITES", "itemPic", "TERRAIN_OBJECTS",
       "TERRAIN_ICONS",
       // Постоянная прогрессия: таблицы улучшений, построек и квестов — по ним
       // проверки считают, что деревня даёт герою и сколько это стоит.
       "VILLAGE_BUILDINGS", "HERO_STEPS", "HERO_PRICES", "HERO_UPGRADE_LIST",
       "STORY_QUESTS", "REPEAT_QUESTS", "KEY_DEFS", "LOOT_KINDS", "LOOT_NAMES",
       "HERO_CAPS", "VILLAGE_CAPS", "villageBuildingAtDoor", "villageBuildingByKey"]
        .concat(fnNames)
        .filter(Boolean)
        .join(",") +
      "};\n";
    const patched = bundle.replace(/\}\)\(\);\s*$/, exportHook + "})();\n");
    if (patched === bundle) {
      console.log("FAIL: не удалось вставить хук экспорта в game.js");
      process.exit(2);
    }
    try {
      vm.runInThisContext(patched, { filename: "bundle.js" });
    } catch (err) {
      console.log("FAIL: скрипт упал при загрузке: " + err.message);
      console.log(String(err.stack).split("\n").slice(0, 6).join("\n"));
      process.exit(2);
    }

    const API = globalThis.__api;
    const G = API.G;
    const out = [];
    const log = (ok, name, extra) =>
      out.push({ ok: !!ok, name: String(name), extra: extra === undefined || extra === "" ? "" : String(extra) });
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const tries = (n, fn) => { for (let i = 0; i < n; i++) { if (fn(i)) return i; } return -1; };

    // ---------------- общие хелперы ----------------
    function freshRun(floorIndex) {
      G.running = true;
      G.name = "Проверка";
      G.difficulty = "normal";
      G.startedAt = Date.now();
      G.floorIndex = 0;
      G.visited = new Set([0]);
      G.missed = [];
      G.uid = 0;
      G.cache = {};
      G.player = {
        hp: 200, baseMaxHp: 200, maxHp: 200, level: 5, xp: 0, xpNext: 9999,
        dmgBase: 40, atkBonus: 0, defBonus: 0, gold: 0,
        poison: 0, freeHints: 0, snared: false, cursedNext: false, _lastHp: null
      };
      G.equipment = { weapon: null, armor: null, accessory: null };
      G.inventory = [];
      G.stats = {
        correct: 0, wrong: 0, codePassed: 0, codeTried: 0, copyPassed: 0, copyTried: 0,
        hintsUsed: 0, goldEarned: 0, topicStats: {}, floorsCleared: 0, kills: 0
      };
      G.battle = null;
      G.shopTrader = false;
      G.finishedVictory = false;
      G.victoryBanked = false;
      G.victoryBankedAmount = 0;
      G.running = true;
      // Опасная среда и сделки не должны протекать между прогонами.
      G.hazard = null;
      G.blessings = {};
      G.blessingOffer = null;
      G.visited = new Set([0]);
      Object.keys(store).forEach((k) => { store[k].innerHTML = ""; });
      // move() выходит сразу, если оверлеи не скрыты, а в заглушке
      // classList пуст — помечаем их скрытыми, как в настоящем HTML.
      // Список повторяет overlayOpen() в game.js: забытый здесь forge-overlay
      // молча ломает doInteract() — сундук «открывается» и не открывается.
      ["end-overlay", "shop-overlay", "battle-overlay", "blessing-overlay", "forge-overlay",
        "level-loading", "entrance-overlay", "calibration-overlay", "dialog-overlay"]
        .forEach((id) => el(id).classList.add("hidden"));
      API.activateFloor(floorIndex || 0);
    }

    function enemyOnPlayerCell(key, hpOverride) {
      const e = API.makeEnemy(key, 3);
      e.x = G.playerPos.x;
      e.y = G.playerPos.y;
      if (hpOverride) { e.hp = hpOverride; e.maxHp = Math.max(e.maxHp, hpOverride); }
      G.enemies = [e];
      return e;
    }

    function walkableNeighbours(from) {
      const res = [];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const x = from.x + dx, y = from.y + dy;
        if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) return;
        if (G.map.grid[y][x] !== 1) return;
        if (G.enemies.some((e) => e.x === x && e.y === y)) return;
        if (G.treasures.some((t) => t.x === x && t.y === y)) return;
        res.push({ x, y });
      });
      return res;
    }

    function equipWithEffect(kind) {
      const item = API.ITEM_POOL.find((i) => i.effect && i.effect.kind === kind);
      return item ? Object.assign({}, item) : null;
    }

// Харнесс работает в двух режимах: проверка склеивает его с tools/checks.js
// и запускает как обычный скрипт, а play_dungeon.js требует его напрямую.
// Фикстуры безопасны в обоих случаях.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { API, G, el, store, log, rnd, tries,
    freshRun, enemyOnPlayerCell, walkableNeighbours, equipWithEffect };
}
