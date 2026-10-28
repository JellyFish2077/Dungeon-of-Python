(function () {
  "use strict";

  const ENEMY_TYPES = [
    { key: "slime", name: "Слизь", color: "#22c55e", hp: 40, dmg: 8 },
    { key: "rat", name: "Крыса", color: "#a16207", hp: 34, dmg: 7 },
    { key: "bat", name: "Летучая мышь", color: "#7c3aed", hp: 30, dmg: 9, range: 2 },
    { key: "skeleton", name: "Скелет", color: "#94a3b8", hp: 62, dmg: 12 },
    { key: "goblin", name: "Гоблин", color: "#65a30d", hp: 56, dmg: 11 },
    { key: "spider", name: "Паук", color: "#78716c", hp: 50, dmg: 13, ability: "poison", abilityText: "Паук кусает ядовито", range: 2 },
    { key: "orc", name: "Орк", color: "#b45309", hp: 82, dmg: 16 },
    { key: "troll", name: "Тролль", color: "#15803d", hp: 98, dmg: 18, ability: "regen", abilityText: "Тролль затягивает раны прямо в бою" },
    { key: "ghost", name: "Призрак", color: "#38bdf8", hp: 72, dmg: 20, ability: "phasing", abilityText: "Призрак иногда проходит сквозь стены", range: 3 },
    { key: "wolf", name: "Волк", color: "#64748b", hp: 58, dmg: 14 },
    { key: "zombie", name: "Зомби", color: "#65a30d", hp: 66, dmg: 13 },
    { key: "golem", name: "Голем", color: "#78716c", hp: 110, dmg: 17, ability: "armor", abilityText: "Каменная броня гасит часть урона" },
    { key: "demon", name: "Демон", color: "#dc2626", hp: 90, dmg: 21, ability: "fire", abilityText: "Демон поджигает: урон растёт с каждым боем" },
    { key: "minotaur", name: "Минотавр", color: "#92400e", hp: 130, dmg: 20, ability: "charge", abilityText: "Минотавр бьёт сильнее, когда ты ответил верно" },
    { key: "vampire", name: "Вампир", color: "#9d174d", hp: 105, dmg: 22, ability: "drain", abilityText: "Вампир пьёт твоё здоровье" },
    { key: "lich", name: "Лич", color: "#7c3aed", hp: 145, dmg: 24, ability: "curse", abilityText: "Лич накладывает проклятие на твои ответы" },
    // Новые виды с шестого этажа: жрица лечит этаж, некромант поднимает
    // мелких на твоих ошибках, щитоносец держит удар и не даёт уйти.
    { key: "shieldman", name: "Щитоносец", color: "#9aa7b5", hp: 120, dmg: 14, ability: "bulwark", abilityText: "Щит гасит часть урона и не даёт отступить" },
    { key: "priest", name: "Жрица", color: "#e7d7a8", hp: 95, dmg: 15, ability: "heal", abilityText: "Жрица лечит раненых врагов этажа" },
    { key: "necromancer", name: "Некромант", color: "#8b7fd4", hp: 88, dmg: 17, ability: "summon", abilityText: "Некромант поднимает мелких врагов на твоих ошибках" },
    { key: "dragon", name: "Дракон", color: "#dc2626", hp: 260, dmg: 25, boss: true, ability: "bossrage", abilityText: "Дракон впадает в ярость и усиливает удары" }
  ];

  // Пять биомов по два этажа: одна большая комната биома и босс.
  // Так кампания остаётся короткой: десять этажей, пять боссов.
  // Пул обычного этажа — объединение старых комнат биома, чтобы не терять
  // разнообразие врагов после сокращения.
  const BIOMES = [
    {
      key: "caves",
      name: "Пещеры новичка",
      theme: 0,
      floors: [
        { w: 32, h: 23, count: 5, pool: ["slime", "rat", "bat", "goblin", "skeleton"], qmin: 1, qmax: 2 }
      ],
      boss: { key: "goblin", name: "Гоблин-вожак", hp: 170, w: 34, h: 24, qmin: 2, qmax: 3 }
    },
    {
      key: "catacombs",
      name: "Забытые катакомбы",
      theme: 2,
      floors: [
        { w: 36, h: 26, count: 7, pool: ["skeleton", "goblin", "orc", "zombie", "spider"], qmin: 2, qmax: 3 }
      ],
      boss: { key: "necromancer", name: "Некромант", hp: 220, w: 36, h: 26, qmin: 3, qmax: 4 }
    },
    {
      key: "ice",
      name: "Ледяные залы",
      theme: 4,
      floors: [
        { w: 40, h: 28, count: 8, pool: ["wolf", "ghost", "troll", "golem", "shieldman"], qmin: 3, qmax: 4 }
      ],
      boss: { key: "golem", name: "Король големов", hp: 280, w: 38, h: 28, qmin: 4, qmax: 4 }
    },
    {
      key: "demons",
      name: "Обитель демонов",
      theme: 6,
      floors: [
        { w: 44, h: 30, count: 9, pool: ["demon", "minotaur", "shieldman", "vampire", "priest", "lich", "necromancer"], qmin: 4, qmax: 4 }
      ],
      boss: { key: "demon", name: "Владыка демонов", hp: 330, w: 40, h: 28, qmin: 4, qmax: 4 }
    },
    {
      key: "lair",
      name: "Логово дракона",
      theme: 9,
      floors: [
        { w: 46, h: 30, count: 10, pool: ["vampire", "priest", "shieldman", "lich", "demon", "golem", "necromancer"], qmin: 4, qmax: 4 }
      ],
      boss: { key: "dragon", name: "Дракон", hp: 360, w: 34, h: 24, qmin: 4, qmax: 4 }
    }
  ];

  const FLOORS = [];
  BIOMES.forEach((biome, biomeIndex) => {
    biome.floors.forEach((floor, floorIndex) => {
      FLOORS.push(Object.assign({}, floor, {
        name: biome.name,
        biome: biome.key,
        biomeName: biome.name,
        biomeIndex: biomeIndex,
        depth: floorIndex + 1,
        theme: biome.theme,
        boss: false
      }));
    });
    FLOORS.push({
      name: biome.boss.name,
      biome: biome.key,
      biomeName: biome.name,
      biomeIndex: biomeIndex,
      depth: biome.floors.length + 1,
      w: biome.boss.w,
      h: biome.boss.h,
      bossHp: biome.boss.hp,
      count: 0,
      pool: [biome.boss.key],
      qmin: biome.boss.qmin,
      qmax: biome.boss.qmax,
      theme: biome.theme,
      boss: true,
      bossKey: biome.boss.key,
      bossName: biome.boss.name,
      finalBoss: biomeIndex === BIOMES.length - 1
    });
  });

  // ---------- Бесконечный спуск ----------
  // За десятым этажом таблица FLOORS кончается, а бесконечный режим
  // продолжает звать floorDef(10), floorDef(11) и так далее. Этажи
  // синтезируются из трёх пулов, которые проворачиваются по кругу,
  // а каждый пятый круг закрывает дракон.
  const ENDLESS_POOLS = [
    ["vampire", "demon", "lich", "golem"],
    ["lich", "demon", "minotaur", "ghost"],
    ["dragon", "vampire", "demon", "troll"]
  ];
  const ENDLESS = {
    bossEvery: 5,
    baseCount: 14,
    countStep: 2,
    countCap: 24,
    baseW: 40,
    baseH: 28,
    sizeStep: 2,
    sizeCap: 8
  };

  function endlessFloorDef(index) {
    const depth = index - FLOORS.length + 1;
    const step = Math.min(6, depth - 1);
    const boss = depth % ENDLESS.bossEvery === 0;
    const pool = ENDLESS_POOLS[(depth - 1) % ENDLESS_POOLS.length];
    return {
      name: "Бездна · глубина " + depth,
      w: ENDLESS.baseW + Math.min(ENDLESS.sizeCap, step * ENDLESS.sizeStep),
      h: ENDLESS.baseH + Math.min(ENDLESS.sizeCap, step * ENDLESS.sizeStep),
      count: boss ? 0 : Math.min(ENDLESS.countCap, ENDLESS.baseCount + step * ENDLESS.countStep),
      pool,
      qmin: 4,
      qmax: 4,
      boss,
      endless: true,
      depth
    };
  }

  // Единственная точка, где индекс этажа превращается в его описание.
  // Раньше везде стояло FLOORS[index], и любой выход за десятый этаж
  // ронял игру на undefined.
  function floorDef(index) {
    if (index >= 0 && index < FLOORS.length) return FLOORS[index];
    return endlessFloorDef(index);
  }

  function floorNameAt(index) {
    return floorDef(index).name;
  }

  // Всего этажей в текущем забеге: в обычном режиме известное число,
  // в бесконечном спуска нет.
  function runIsEndless() {
    return G.mode === "endless";
  }

  function lastDungeonFloor() {
    return FLOORS.length - 1;
  }

  const DIFFICULTY = {
    easy: { name: "Лёгкий", wMc: 0.35, wCopy: 0.2, wFill: 0.45, wError: 0.0, wCode: 0.0, enemyScale: 0.85, qBonus: -1 },
    normal: { name: "Обычный", wMc: 0.3, wCopy: 0.18, wFill: 0.2, wError: 0.17, wCode: 0.15, enemyScale: 1.0, qBonus: 0 },
    hard: { name: "Сложный", wMc: 0.25, wCopy: 0.15, wFill: 0.15, wError: 0.15, wCode: 0.3, enemyScale: 1.5, qBonus: 1 }
  };

  // Качество ответа решает силу удара. Раньше правильный и неправильный
  // ответ стоили одинаково: ударил — и всё. Теперь точный ответ с первого
  // раза бьёт в полтора раза сильнее, а подсказка съедает эту выгоду.
  const QUALITY = {
    perfect: { mul: 1.5, label: "точный удар ×1.5" },
    near: { mul: 1.1, label: "удар с погрешностью ×1.1" },
    partial: { mul: 1, label: "" },
    hinted: { mul: 1.15, label: "удар с подсказкой ×1.15" }
  };
  // Числа ниже — «баланс»: их можно менять из админ-панели /admin, не трогая
  // код. Поэтому это let, а не const: applyBalanceValue() присваивает им
  // значения, присланные сервером (см. секцию «АДМИН-ПАНЕЛЬ» в конце файла).
  let HINT_CAP = 1.15;
  let STREAK_STEP = 0.15;
  let STREAK_CAP = 5;

  // Пункт 3: за разные задания положен разный удар. Переписать код по
  // образцу — самая кропотливая работа, она и бьёт сильнее всего; выбор
  // варианта — база; найти ошибку чуть дороже выбора. Множитель применяется
  // и к mcDamage, и к codeDamage через taskPowerMul().
  const TASK_POWER = {
    mc: 1,
    fill: 1,
    error: 1.1,
    copy: 1.35,
    code: 1.5
  };

  // Элиты — те же семнадцать видов, но с усиленной способностью и
  // эпитетом в имени. Пороги собраны в одном месте, чтобы баланс
  // можно было крутить, не разбрасываясь по коду.
  const ELITE = {
    hpMul: 1.6,
    dmgMul: 1.25,
    poisonBonus: 1,
    armorPct: 0.3,
    fireMul: 1.3,
    chargeStep: 3,
    chargeCap: 12,
    drainPct: 0.7,
    curseChance: 0.6,
    phaseChance: 0.4,
    gold: 45,
    chanceBase: 0.1,
    chanceStep: 0.02,
    capNear: 2,
    capLate: 3,
    lateFrom: 6
  };

  // Отряды: с третьего этажа монстры иногда приходят группой и стоят
  // на одной клетке. Пока не выбьёшь всех, уйти не получится — это
  // заставляет бой затягиваться и повышает цену ошибки в задании.
  const SQUAD = {
    from: 3,
    chance: 0.15,
    maxSize: 2
  };

  // Дальнобойные враги (у вида записан range) бьют с расстояния и не
  // лезут вплотную: их можно встретить на 2–3 клетки. Урон ниже, чем в
  // ближнем бою, и есть перезарядка, иначе они выбивали бы героя,
  // не дав ни разу ответить.
  const RANGED = {
    dmgScale: 0.55,
    cooldown: 2
  };

  // Сколько ожиданий подряд нужно, чтобы цепь-ловушка спала сама. Без
  // этого цепь превращалась в тупик: если рядом нет монстров, сорвать её
  // в бою нечем, а шагнуть герой не может.
  const SNARE_WAITS = 5;
  const LETTERS = ["A", "B", "C", "D"];
  let VIEW_RADIUS = 4.4;
  // В «Густой тьме» видно почти вдвое меньше — это и есть её опасность.
  let DARK_VIEW_RADIUS = 2.6;
  // Сколько здоровья снимает лава за ход (плюс номер этажа).
  let HAZARD_DMG_BASE = 7;
  // Броня снижает урон В ПРОЦЕНТАХ с убывающей отдачей: soft — значение
  // защиты, дающее ровно 50% снижения, cap — предел снижения. Плоское
  // вычитание, которое здесь было раньше, к середине подземелья переставало
  // что-либо значить: защита 20 гасила 22% удара в 90 и 6% удара в 300.
  const ARMOR = { soft: 45, cap: 0.65 };
  // Экономика растёт вместе с глубиной. Иначе к середине подземелья золото
  // обесценивается: урон и здоровье монстров растут линейно с этажом, а
  // награда за убийство была фиксированные 15. Кузница даёт золоту вторую
  // жизнь — в неё можно вкладываться без предела.
  const ECON = {
    goldBase: 15, goldDepth: 0.32, bossGold: 100,
    priceDepth: 0.22, sellRate: 0.5,
    forgeBase: 60, forgeStep: 1.35, forgeDepth: 0.3,
    forgeAtk: 3, forgeDef: 2, forgeHp: 15
  };
  const SAVE_KEY = "pyquiz_save_v1";
  // Ручное сохранение деревни: позиция героя. Профиль, материалы и постройки
  // и так пишутся в профиль, поэтому здесь только точка возврата.
  const VILLAGE_SAVE_KEY = "pyquiz_village_v1";
  // Где игрок был в прошлый раз — в деревне или в подземелье. Нужно, чтобы
  // обновление страницы в деревне не выбрасывало обратно в поход.
  const PLACE_KEY = "pyquiz_place_v1";

  // Деревня — хаб между походами. Поход одноразовый: смерть стирает
  // снаряжение, уровни и кузницу. Но найденное не отбирается: золото целиком
  // уходит в банк деревни, а материалы и ключи попадают в профиль в момент
  // находки. Раньше доля золота при смерти была 0,25, и смерть была наказанием
  // без награды — теперь походы копят на улучшения, а стена впереди держится
  // не потерей ресурсов, а силой врагов (см. DEEP_* ниже).
  let HUB_DEATH_SHARE = 1;      // доля походного золота, уцелевшая после смерти
  let HUB_AMULET_PRICE = 150;   // цена амулета возврата в лавке деревни
  let HUB_AMULET_FIND = 0.02;   // шанс найти амулет в сундуке вместо предмета
  let HUB_AMULET_MAX = 3;       // потолок амулетов у героя

  // --- Постоянная прогрессия ---
  // Улучшения героя покупаются золотом в деревне и действуют в каждом походе.
  // Каждое улучшение считается от своего шага и своей цены; цена растёт
  // ступенью HERO_PRICE_STEP, поэтому последние уровни — цель на несколько
  // походов, а не покупка между делом.
  const HERO_STEPS = { hp: 12, dmg: 2, potions: 1, loot: 0.12, armor: 0.08 };
  const HERO_PRICES = { hp: 40, dmg: 50, potions: 60, loot: 55, armor: 70 };
  let HERO_PRICE_STEP = 1.55;
  // Деревня растёт за материалы: колодец даёт здоровье на каждый поход, амбар —
  // больше находок и привалов. Кузница не даёт ничего сама — она открывает
  // уровни улучшений героя, поэтому материалы и есть настоящий замок на силе.
  let VILLAGE_WELL_HP = 10;
  let VILLAGE_BARN_BONUS = 0.5;
  let VILLAGE_COST_MUL = 1;
  // Глубинная тяжесть: с шестого этажа враги растут быстрее, чем герой за один
  // поход. Это и есть стена первых попыток: спуститься глубже можно только
  // с постоянными улучшениями и постройками. На десятом этаже здоровье врагов
  // больше номинального примерно в 1,76 раза, а урон — в 1,54.
  let DEEP_FROM = 5;            // номер этажа (нумерация с нуля), где начинается
  let DEEP_HP_MUL = 0.08;       // прибавка здоровья за каждый этаж глубже
  let DEEP_DMG_MUL = 0.06;      // прибавка урона за каждый этаж глубже
  // Материалы. Руда и древесина попадаются на мелких этажах, обломки — с
  // пятого: второй уровень кузницы нельзя получить, не спускаясь глубоко.
  let LOOT_ORE_CHANCE = 0.45;
  let LOOT_WOOD_CHANCE = 0.45;
  let LOOT_SHARD_CHANCE = 0.35;
  let QUEST_GOLD = 60;          // награда за повторяемый квест
  let QUEST_MATERIAL = 2;       // материалов в награду за квест
  // Действия героя в бою: оборона, отступление и умение. Оборона пропускает
  // ход и ослабляет удар врага вдвое, отступление стоит прощального удара,
  // умение тратит заряд похода.
  let BRACE_CUT = 0.5;          // какая доля урона врага проходит при обороне
  let FLEE_HIT = 1;             // доля урона прощального удара при отступлении
  let ABILITY_CHARGES = 2;      // зарядов умения на поход
  let ABILITY_STRIKE_MUL = 2;   // во сколько раз бьёт «Точный удар»
  let ABILITY_BREATH = 0.4;     // сколько здоровья возвращает «Второе дыхание»
  // Привал: костёр в подземелье лечит и пополняет заряды умения, но
  // пользоваться им можно лишь несколько раз за поход.
  let REST_HEAL = 0.35;
  let REST_PER_RUN = 2;

  // Множители «глубинной тяжести» для этажа. Единица — на мелких этажах.
  function deepScale(floorIdx) {
    const depth = floorIdx - DEEP_FROM + 1;
    if (depth <= 0) return { hp: 1, dmg: 1 };
    return { hp: Math.pow(1 + DEEP_HP_MUL, depth), dmg: Math.pow(1 + DEEP_DMG_MUL, depth) };
  }

  const G = {
    name: "",
    startedAt: 0,
    // «Обычный» выбран в меню заранее: на нём поход у ученика с 70% верных
    // ответов идёт около трёх уроков, а на «Лёгком» — два. Совпадает с
    // карточкой .mode.active в game.html.
    difficulty: "normal",
    // Стартовый уровень знаний из калибровки (1–3). Влияет только на
    // сложность вопросов и заданий, не на силу монстров.
    knowledgeLevel: 2,
    floorIndex: 0,
    playerPos: { x: 1, y: 1 },
    player: null,
    map: null,
    enemies: [],
    treasures: [],
    lootBags: [],
    traders: [],
    equipment: { weapon: null, armor: null, accessory: null },
    // Уровни кузницы: вложенное золото навсегда усиливает героя.
    forge: { weapon: 0, armor: 0, vitality: 0 },
    inventory: [],
    // Что герой уже видел: справочник показывает только это.
    codex: { items: {}, npcs: {}, enemies: {} },
    uid: 0,
    entityEls: new Map(),
    tileEls: [],
    tileBg: [],
    // Предметы декора (колонна, фонтан, обломки) — отдельным слоем поверх пола.
    tileObj: [],
    tileAnim: [],
    camera: { zoomIndex: null, tx: 0, ty: 0, scale: 1 },
    minimapOn: true,
    stairsDown: null,
    stairsUp: null,
    portal: null,
    cache: {},
    visited: new Set(),
    // Постоянные улучшения героя и постройки деревни, действующие в этом
    // походе (см. progressBonus). Заполняется при входе в подземелье.
    prog: { hp: 0, dmg: 0, potions: 0, loot: 0, armor: 0 },
    // Умение похода и его заряды: одно на выбор перед спуском (см. ABILITIES).
    ability: { key: "", left: 0 },
    // Ключи от тайников: походные, а не профильные — тайник на каждом этаже свой.
    vaultKeys: 0,
    // Сколько привалов ещё осталось в этом походе.
    restsLeft: 0,
    visible: new Set(),
    discovered: new Set(),
    // Опасная среда текущего этажа: матрица ключей ("" — обычная клетка).
    // Для «тьмы» матрица пустая, её эффект действует на весь этаж.
    hazard: null,
    // Выбранная сделка на каждый этаж: { 3: "curse", 5: "blessing" }.
    blessings: {},
    // Этаж, на котором сейчас ждём выбор (показывается один раз).
    blessingOffer: null,
    walkTarget: null,
    battle: null,
    lastQId: null,
    // Проверяет ли сервер код. Запущенный с --no-code сервер говорит об этом
    // в /api/game-config, и задач «Напиши функцию» тогда не будет.
    codeCheck: true,
    codeQueue: [],
    copyQueue: [],
    fillQueue: [],
    errorQueue: [],
    missed: [],
    stats: null,
    running: false,
    finishedVictory: false,
    victoryBanked: false,
    victoryBankedAmount: 0,
    // Идёт загрузка этажа: генерация и проверка карты. Пока флаг поднят,
    // ввод и действие у объекта молчат — иначе ход пришёлся бы на старую карту.
    loading: false,
    // Партия проиграна. Нужен отдельно от running: на экране смерти
    // running уже false, но именно этот флаг запрещает автосейв и
    // запрещает «Продолжить» поднимать мёртвую партию.
    dead: false,
    // Снимок героя на входе на этаж: смерть откатывает этаж, и опыт,
    // набранный на нём, теряется. Золото и снаряжение остаются.
    floorCheckpoint: null,
    // Режим забега: "dungeon" — десять этажей с драконом в конце,
    // "endless" — бесконечный спуск.
    mode: "dungeon",
    // Лавка открыта у торговца на этаже (без наценки) и подобранный под этаж
    // товар: считается из имени героя и номера этажа, поэтому не «перебрасывается».
    shopTrader: false,
    shopStock: null,
    // Место, в котором сейчас герой: "village" (деревня-хаб), "house"
    // (комната внутри дома) или "dungeon" (подземелье). От него зависит,
    // что рисуется, что делает ход и что попадает в сохранение.
    place: "village",
    houseKey: null,
    // Клетка, с которой игрок вошёл в дом: с неё же он и вернётся на улицу.
    // Сама дверь — часть стены, встать на неё нельзя.
    villageReturn: null,
    // Клетки, сквозь которые не пройти, но которые не стены: деревья,
    // заборы, колодец. Матрица того же размера, что карта (0/1). Стены
    // по-прежнему задаёт grid — их отдельно ещё и тени рисуются.
    blocked: null,
    // Номер темы земли для terrainBg. У деревни своя (каменная), у этажа —
    // номер этажа. Раньше тему брали прямо из floorIndex, и деревне было
    // бы нечем задать свою.
    ground: 0,
    npcs: [],
    doors: [],
    // Двор деревни: деревья, заборы, колодец, костёр. Не препятствия в grid,
    // поэтому рисуются отдельными объектами.
    scenery: [],
    // Житель, чьё окно сейчас открыто: нужно, чтобы перерисовать его после
    // покупки, не закрывая окно.
    dialogNpc: null,
    // Материалы клеток деревни (крыша/фасад/окно) и вид крыши с её цветом.
    // У подземелья их нет — там рисуется тема этажа.
    mat: null,
    roofKind: null,
    roofColor: null,
    // Что в деревне уже открыто. Живёт в памяти: возвращаться после смерти
    // в кромешную тьму и обходить деревню заново — скучно, а «изучение»
    // уже случилось.
    villageSeen: null
  };

  // Скрытый хук для автопроверок: ?debug=1 открывает состояние игры. Только
  // вместе с --dev: иначе любой ученик получал __setFloor, __validateFloor и
  // всё состояние G из адресной строки — это дефект, а не отладка.
  try {
    if (typeof window !== "undefined" && devEnabled() &&
        new URLSearchParams(window.location.search).get("debug") === "1") {
      window.__pyquiz = G;
      window.__floors = FLOORS;
      // Строка журнала — чтобы проба могла проверить цвета всех родов событий.
      window.__log = log;
      // ?debug=1&floor=7 — проба сразу открывает нужный этаж: иначе до
      // седьмого этажа пришлось бы идти пешком девять раз.
      window.__setFloor = (n) => {
        const i = Math.max(0, Math.min(FLOORS.length - 1, Number(n) || 0));
        activateFloor(i);
        render();
      };
      // Проверка генерации — чтобы автопроверки могли прогнать её на
      // заведомо сломанных картах, а не только на удачной генерации.
      window.__validateFloor = validateFloorState;
      window.__buildFloor = buildCheckedFloor;
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
    // Экран теперь один: деревня, дома и подземелье рисуются на одной карте.
    // Бывший экран-меню убран, его настройки переехали в окно стража.
    const stage = el("stage");
    if (stage) stage.classList.toggle("playing", screen === "game");
    const side = document.querySelector(".side-panel");
    if (side) side.classList.toggle("hidden", screen !== "game");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Журнал похода: строки разного цвета по роду события — находка, бой,
  // урон, новый этаж. Сорок одинаковых «• …» просмотреть было нельзя.
  const LOG_KINDS = {
    loot: { ico: "◆", cls: "kind-loot" },
    fight: { ico: "⚔", cls: "kind-fight" },
    hurt: { ico: "✖", cls: "kind-hurt" },
    floor: { ico: "▼", cls: "kind-floor" },
    info: { ico: "•", cls: "kind-info" },
  };
  const LOG_LIMIT = 80;
  // Сколько строк набежало, пока игрок читал выше или журнал был свёрнут.
  let logUnread = 0;

  function logAtBottom(box) {
    // Свёрнутый журнал ничего не показывает — значит всё новое не прочитано.
    if (box.classList.contains("collapsed")) return false;
    return box.scrollHeight - box.scrollTop - box.clientHeight < 24;
  }

  function logBadge() {
    // Событийный лог больше не показывается: журнал занят заданиями.
    const btn = el("log-toggle");
    if (btn) btn.removeAttribute("data-unread");
  }

  function log(msg, kind) {
    const box = el("log");
    if (!box) return;
    const def = LOG_KINDS[kind] || LOG_KINDS.info;
    const stick = logAtBottom(box);
    const line = document.createElement("div");
    line.className = "log-line " + def.cls;
    line.textContent = def.ico + " " + msg;
    box.appendChild(line);
    // Читающего выше не дёргаем вниз: он вернётся — прокрутка подтянется,
    // а пока на кнопке журнала висит счётчик новых строк.
    if (stick) {
      box.scrollTop = box.scrollHeight;
    } else {
      logUnread += 1;
      logBadge();
    }
    while (box.children.length > LOG_LIMIT) box.removeChild(box.firstChild);
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

  function clearToast() {
    const t = el("toast");
    if (t) t.classList.remove("show");
    clearTimeout(toast._timer);
  }

  // Звук необязателен для логики: в node-проверках модуля нет, и игра просто
  // молчит. Ошибку аудио тоже глотаем — она не должна ломать бой.
  function sfx(name) {
    if (typeof window === "undefined") return;
    const sound = window.PySound;
    if (!sound || typeof sound.play !== "function") return;
    try {
      sound.play(name);
    } catch (e) {
      // ignore
    }
  }

  // ---------- Подсказки при наведении ----------

  // Строки в панели и в лавке короткие, а подробности (эффект, семья,
  // сравнение с надетым) ждут наведения: одна карточка на всю игру вместо
  // `title` — одинаковый вид, мгновенный отклик и работает с клавиатуры.
  let tipNode = null;
  let tipTimer = null;

  // Текст подсказки — разметка, поэтому в атрибут её кладём через эту
  // обёртку: иначе кавычка в описании предмета рвёт HTML.
  function tipAttr(html) {
    return String(html).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function tipHide() {
    if (tipTimer) {
      clearTimeout(tipTimer);
      tipTimer = null;
    }
    if (tipNode) tipNode.classList.add("hidden");
  }

  function tipShow(target) {
    const text = target.getAttribute("data-tip");
    if (!text) return;
    if (!tipNode) {
      tipNode = document.createElement("div");
      tipNode.className = "tip hidden";
      tipNode.setAttribute("role", "tooltip");
      document.body.appendChild(tipNode);
    }
    tipNode.innerHTML = text;
    tipNode.classList.remove("hidden");
    // Карточка встаёт рядом с предметом, а не под курсором: так она не дрожит
    // и не закрывает то, о чём рассказывает.
    const r = target.getBoundingClientRect();
    const box = tipNode.getBoundingClientRect();
    const pad = 10;
    let left = r.left - box.width - pad;
    if (left < pad) left = r.right + pad;
    if (left + box.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - box.width - pad);
    }
    let top = r.top + r.height / 2 - box.height / 2;
    if (top + box.height > window.innerHeight - pad) {
      top = window.innerHeight - box.height - pad;
    }
    // Совсем широкий элемент (вариант ответа в узком окне) по бокам не влезает:
    // тогда карточка встаёт над ним, иначе она ложилась поверх соседних кнопок.
    if (r.left - box.width - pad < pad && r.right + box.width + pad > window.innerWidth) {
      left = Math.max(pad, Math.min(r.left, window.innerWidth - box.width - pad));
      top = r.top - box.height - 8;
      if (top < pad) top = Math.min(window.innerHeight - box.height - pad, r.bottom + 8);
    }
    if (top < pad) top = pad;
    tipNode.style.left = Math.round(left) + "px";
    tipNode.style.top = Math.round(top) + "px";
  }

  // Поле ввода кода в бою: пока в нём печатают, игровые клавиши молчат.
  // Иначе «m» в слове max выключала мини-карту, а «а», «у» и «ш» русского
  // комментария вызывали кузницу, действие у объекта и сумку.
  function isTypingTarget(node) {
    if (!node) return false;
    const tag = String(node.tagName || "").toUpperCase();
    return tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || !!node.isContentEditable;
  }

  function tipTarget(ev) {
    const node = ev.target;
    if (!node || !node.closest) return null;
    return node.closest("[data-tip]");
  }

  function initTips() {
    document.addEventListener("mouseover", (ev) => {
      const target = tipTarget(ev);
      if (!target) return;
      if (tipTimer) clearTimeout(tipTimer);
      tipTimer = setTimeout(() => tipShow(target), 90);
    });
    document.addEventListener("mouseout", (ev) => {
      if (tipTarget(ev)) tipHide();
    });
    // Клавиатура: подсказка полезна и без мыши.
    document.addEventListener("focusin", (ev) => {
      const target = tipTarget(ev);
      if (target) tipShow(target);
    });
    document.addEventListener("focusout", tipHide);
    document.addEventListener("click", tipHide);
    if (window.addEventListener) window.addEventListener("scroll", tipHide, true);
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

  // Набор декораций зависит от этажа: в пещерах трава и обломки, в катакомбах
  // кости и колья, в руинах — кристаллы и фонари. Числа — проценты клеток пола,
  // коды совпадают с TERRAIN_DECOR_BY_CODE из terrain.js. На огненных этажах
  // (7 и 10) воды нет: лава там — только опасная среда, а безвредная лава
  // рядом с настоящей сбивала с толку.
  const FLOOR_DECOR_MIX = [
    [[1, 10], [5, 4], [3, 6], [2, 5]],           // 1. Пещеры новичка
    [[4, 11], [3, 7], [10, 4], [6, 4]],          // 2. Гоблин-вожак
    [[3, 8], [10, 6], [4, 5], [2, 4], [7, 3]],   // 3. Забытые катакомбы
    [[2, 9], [6, 8], [5, 5], [1, 4]],            // 4. Некромант
    [[9, 10], [3, 7], [2, 4]],                   // 5. Ледяные залы
    [[3, 9], [9, 6], [6, 4], [7, 3]],            // 6. Король големов
    [[4, 8], [3, 6], [7, 5]],                    // 7. Обитель демонов
    [[4, 10], [3, 7], [10, 4], [6, 3]],          // 8. Владыка демонов
    [[9, 9], [3, 6], [7, 4], [4, 3]],            // 9. Логово дракона
    [[4, 8], [3, 6], [7, 5]]                     // 10. Дракон
  ];

  function floorDecorMix(floorIdx) {
    const n = FLOOR_DECOR_MIX.length;
    return FLOOR_DECOR_MIX[((Math.floor(floorIdx) % n) + n) % n];
  }

  function generateMap(w, h, floorIdx) {
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
    const mix = floorDecorMix(floorIdx || 0);
    spots.forEach((s) => {
      let roll = Math.random() * 100;
      for (const pair of mix) {
        roll -= pair[1];
        if (roll < 0) {
          decor[s.y][s.x] = pair[0];
          break;
        }
      }
    });
    decor[start.y][start.x] = 0;
    decor[end.y][end.x] = 0;

    return { grid, start, end, spots, decor };
  }

  // Студенты проходили подземелье, не замечая заданий: за десять этажей
  // урон врага рос всего на +2 за этаж (18 в сумме), а здоровье игрока
  // росло быстрее — от уровней, брони и зелий. Кривая сделана круче:
  // база ×(1 + 0.32·этаж) плюс стартовый урон, умноженный на сам этаж.
  // На десятом этаже крыса бьёт уже вчетверо сильнее, чем на первом.
  let ENEMY_DMG_PER_FLOOR = 0.32;
  let ENEMY_DMG_RAMP = 0.28;
  let HP_PER_FLOOR = 0.10;
  let XP_BASE = 50;
  let LEVEL_DMG = 3;
  let LEVEL_HP = 22;

  // Учебный бой. Враги толще в ENEMY_HP_MUL раз, чтобы бой шёл несколько
  // заданий подряд: «вспомни» (вопрос) и «примени» (практика на ту же тему).
  // Раньше враг падал с одного-двух ответов, и подземелье проходили за урок.
  // Опыт за врага от этого множителя не растёт — см. поле xp в makeEnemy.
  // 3,8, а не 3,5: кто вкладывает золото в кузницу, проходит поход на 7–8%
  // быстрее, и на 3,5 «Обычный» у такого ученика укладывался меньше чем в
  // три урока (замер ботом, play_dungeon.js).
  let ENEMY_HP_MUL = 1.6;
  // Вход в подземелье мягче: на первом этаже враг толще базового лишь на
  // 60% от ENEMY_HP_MUL, дальше +10% за этаж, с пятого — полностью. В начале
  // герой слабее всего, и длинные бои там превращали первые этажи в стену.
  // Мягкий вход: на первом этаже враг получает долю HP_START от полной толщины,
  // к EASE_FLOORS-му этажу — всё. Так бой на первых этажах короче: длина боя —
  // главное, что убивает слабого ученика (замер ботом: при 50% верных ответов
  // снижение общей толщины врагов поднимает проход с 20% до 48%, а урон врага и
  // отряды на это почти не влияют). Глубокие этажи остаются как были.
  let HP_START = 0.45;
  const HP_EASE_FLOORS = 7;

  function enemyHpMulFor(floorIdx) {
    const f = Math.max(0, floorIdx);
    const share = Math.min(1, HP_START + (1 - HP_START) * (f / HP_EASE_FLOORS));
    return ENEMY_HP_MUL * share;
  }
  // Ошибка подряд в одном бою бьёт сильнее: вторая ×(1 + шаг), третья
  // ×(1 + 2 шага)… до потолка. Верный ответ сбрасывает счёт. Тому, кто
  // ошибается изредка, это почти не мешает, а тыкать наугад — смертельно.
  let MISS_STEP = 0.5;
  let MISS_CAP = 2.5;
  // Пропуск вопроса в бою: цена — здоровье, и ощутимая. Доля от максимума, а
  // не фиксированное число: на первом уровне 10 HP — это десятая часть, а на
  // двадцатом сотая, и фиксированная цена перестала бы что-то значить.
  let SKIP_HP_SHARE = 0.2;
  // Страж этажа стоит у лестницы вниз: пока он жив, спуска нет.
  const GUARD = { hpMul: 1.5, dmgMul: 1.1, xpMul: 2 };
  // Повторение пройденного: с reviewFrom-го этажа (счёт с нуля) часть боёв
  // идёт по теме прошлых этажей. floorTopicChance — доля боёв на «Тему
  // этажа» из планки входа, если по ней есть вопросы нужного уровня.
  const LEARN = { reviewChance: 0.3, reviewFrom: 2, floorTopicChance: 0.4 };

  // Бесконечный спуск: за десятым этажом враги крепчают быстрее, чем растёт
  // герой. До этого урон врага рос линейно по этажу, а урон героя — по уровню
  // (плюс 10 за уровень: 4 от levelDmg и 6 в mcDamage), и уровень растёт от
  // опыта с тех же врагов. К тридцатому этажу герой был неуязвим: партии
  // обрывались по лимиту ходов, а не смертью. Надбавка квадратична по глубине,
  // поэтому обгон выравнивается. На первые десять этажей не влияет.
  let ENDLESS_DEPTH_DMG = 0.005;

  function endlessDepthMul(floorIdx) {
    if (floorIdx <= lastDungeonFloor()) return 1;
    const d = floorIdx - lastDungeonFloor();
    return 1 + ENDLESS_DEPTH_DMG * d * d;
  }

  function enemyDamageFor(type, floorIdx, mul) {
    const base = type.dmg + floorIdx * ENEMY_DMG_PER_FLOOR;
    const ramp = type.dmg * ENEMY_DMG_RAMP * floorIdx;
    return Math.max(1, Math.round((base + ramp) * mul * endlessDepthMul(floorIdx)));
  }

  function makeEnemy(typeKey, floorIdx, elite, squadId, squadIdx, isBoss) {
    const t = ENEMY_TYPES.find((e) => e.key === typeKey);
    const mul = DIFFICULTY[G.difficulty].enemyScale;
    const isElite = !!elite;
    const hpMul = isElite ? ELITE.hpMul : 1;
    const dmgMul = isElite ? ELITE.dmgMul : 1;
    // У боссов свой базовый запас здоровья: иначе слабый по виду Гоблин-вожак
    // остаётся обычным монстром, а Дракон на глубине раздувается в стену.
    const baseHp = isBoss && floorDef(floorIdx).bossHp ? floorDef(floorIdx).bossHp : t.hp;
    const hp = Math.round(baseHp * (1 + HP_PER_FLOOR * floorIdx) * mul * hpMul *
      enemyHpMulFor(floorIdx) * deepScale(floorIdx).hp);
    const dmg = enemyDamageFor(t, floorIdx, mul * dmgMul * deepScale(floorIdx).dmg);
    return {
      uid: ++G.uid,
      key: t.key,
      name: t.name,
      color: t.color,
      maxHp: hp,
      hp,
      // Опыт — от здоровья вида на этом этаже, без множителя сложности и
      // длины боя. Раньше опыт равнялся здоровью врага, и «Сложный» сам
      // кормил героя: к концу похода уровень 19,8 против 16,5 на «Лёгком».
      xp: Math.round(baseHp * (1 + HP_PER_FLOOR * floorIdx) * hpMul),
      dmg: dmg,
      baseDmg: dmg,
      fireScale: 1,
      boss: !!isBoss || !!t.boss,
      ability: t.ability || null,
      elite: isElite,
      title: isElite ? eliteTitleFor(typeKey) : "",
      // Отряд: ненулевой squadId держит монстров на одной клетке.
      // squadIdx — номер внутри группы, по нему враги расходятся
      // на карте, чтобы не стоять друг в друге.
      squadId: squadId || 0,
      squadIdx: squadIdx || 0,
      range: t.range || 1,
      shotCd: 0,
      poison: 0,
      poisonBonus: isElite ? ELITE.poisonBonus : 0,
      armorPct: abilityOfType(typeKey) === "armor" && isElite ? ELITE.armorPct : 0.2,
      fireMul: isElite ? ELITE.fireMul : 1.15,
      chargeStep: abilityOfType(typeKey) === "charge" ? (isElite ? ELITE.chargeStep : 2) : 2,
      chargeCap: abilityOfType(typeKey) === "charge" ? (isElite ? ELITE.chargeCap : 10) : 10,
      drainPct: isElite ? ELITE.drainPct : 0.5,
      curseChance: isElite ? ELITE.curseChance : 0.35,
      phaseChance: isElite ? ELITE.phaseChance : 0.25,
      dmgBoost: 0,
      nextDmgMul: 1,
      enraged: false,
      x: 0,
      y: 0
    };
  }

  // Способность вида читаем из ENEMY_TYPES: у «Призрака ошибки» поле
  // ability хранит старую способность жертвы, а у элиты она усилена.
  function abilityOfType(key) {
    const t = ENEMY_TYPES.find((x) => x.key === key);
    return (t && t.ability) || null;
  }

  function eliteTitleFor(key) {
    const titles = {
      slime: "Топкий", rat: "Шатущий", bat: "Слепой", skeleton: "Костяной страж",
      goblin: "Жадный", spider: "Плевущий", orc: "Бурый", troll: "Окаменевший",
      ghost: "Бестелесный", wolf: "Голодный", zombie: "Болотный", golem: "Каменный страж",
      demon: "Пламенный", minotaur: "Свирепый", vampire: "Кровавый", lich: "Вечный",
      dragon: "Древний"
    };
    return titles[key] || "Закалённый";
  }

  function eliteChanceFor(floorIdx, isBossFloor) {
    if (isBossFloor) return 0;
    const chance = ELITE.chanceBase + floorIdx * ELITE.chanceStep;
    return Math.max(0, Math.min(1, chance));
  }

  // Сколько элитных групп допустимо на одном этаже. capNear и capLate — это
  // число элит, а не вероятность: раньше они сравнивались с шансом
  // (min(0.7, 3)), ничего не ограничивали, и на глубине бездны элитой был
  // каждый монстр этажа.
  function eliteCapFor(floorIdx) {
    return floorIdx >= ELITE.lateFrom ? ELITE.capLate : ELITE.capNear;
  }

  // Отряд собирается из обычных монстров того же этажа: столько же видов,
  // сколько бой выдержал бы и поодиночке, но общий запас здоровья
  // и количество заходов заметно выше.
  function squadSizeFor(index, isBossFloor) {
    if (isBossFloor || index < SQUAD.from) return 1;
    if (Math.random() >= SQUAD.chance) return 1;
    return rand(2, SQUAD.maxSize);
  }

  // Сколько заработать за элиту: базовая награда обычного монстра
  // плюс заметная добавка, иначе элита не стоит риска.
  function eliteGoldBonus() {
    return ELITE.gold;
  }

  function abilityOf(e) {
    if (!e) return null;
    if (e.ability === null) return null;
    if (typeof e.ability === "string") return e.ability;
    const t = ENEMY_TYPES.find((x) => x.key === e.key);
    return (t && t.ability) || null;
  }

  function abilityTextOf(e) {
    if (!e || !abilityOf(e)) return "";
    if (e.elite) {
      return ELITE_ABILITY_TEXT[abilityOf(e)] || "Усиленная способность";
    }
    const t = ENEMY_TYPES.find((x) => x.key === e.key);
    if (!t || t.ability !== abilityOf(e)) return "";
    return t.abilityText || "";
  }

  function createFloorState(index) {
    const f = floorDef(index);
    const gen = generateMap(f.w, f.h, index);
    const bossFloor = !!f.boss;
    const state = {
      index,
      map: { w: f.w, h: f.h, grid: gen.grid, decor: gen.decor },
      playerPos: { x: gen.start.x, y: gen.start.y },
      stairsDown: { x: gen.end.x, y: gen.end.y, active: !bossFloor },
      stairsUp: index > 0 ? { x: gen.start.x, y: gen.start.y } : null,
      enemies: [],
      treasures: [],
      lootBags: [],
      traders: [],
      traps: [],
      // Интерактив этажа: тайники с запертой дверью, жилы руды, рычаги и
      // таблички. Всё это ставится после обычной раскладки, чтобы не мешать
      // генератору комнат и коридоров.
      vaults: [],
      nodes: [],
      levers: [],
      signs: [],
      portal: null,
      vaultNeedsKey: false,
      discovered: new Set()
    };

    const far = gen.spots.filter(
      (s) =>
        Math.hypot(s.x - gen.start.x, s.y - gen.start.y) >= 3 &&
        !(s.x === gen.end.x && s.y === gen.end.y)
    );
    shuffle(far);

    const used = new Set([key(gen.start.x, gen.start.y), key(gen.end.x, gen.end.y)]);
    const count = f.boss ? 1 : f.count;
    // Сначала решаем, какие группы появятся, и только потом раздаём клетки:
    // отряд из трёх монстров занимает три клетки, а не одну.
    const groups = [];
    const eliteCap = eliteCapFor(index);
    let eliteGroups = 0;
    for (let i = 0; i < count; i++) {
      const wantElite = !f.boss && Math.random() < eliteChanceFor(index, f.boss);
      const elite = wantElite && eliteGroups < eliteCap;
      if (elite) eliteGroups += 1;
      const size = squadSizeFor(index, f.boss);
      groups.push({ elite, size, squadId: size > 1 ? ++G.uid : 0 });
    }
    let cursor = 0;
    // Берём следующую свободную клетку из перемешанного списка.
    const takeSpot = () => {
      while (cursor < far.length && used.has(key(far[cursor].x, far[cursor].y))) cursor++;
      if (cursor >= far.length) return null;
      const s = far[cursor];
      cursor += 1;
      used.add(key(s.x, s.y));
      return s;
    };
    // Соседняя свободная клетка — для остальных участников отряда. Клетка
    // обязана примыкать к КАЖДОМУ уже поставленному: отряд стоит кучкой,
    // а не растягивается по коридору.
    const neighbourSpot = (placed) => {
      for (const [dx, dy] of shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
        const x = placed[0].x + dx;
        const y = placed[0].y + dy;
        if (x < 0 || y < 0 || x >= state.map.w || y >= state.map.h) continue;
        if (state.map.grid[y][x] !== 1) continue;
        if (used.has(key(x, y))) continue;
        if (placed.some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) > 1)) continue;
        used.add(key(x, y));
        return { x, y };
      }
      return null;
    };
    for (const group of groups) {
      const placed = [];
      for (let j = 0; j < group.size; j++) {
        // Если рядом нет свободной клетки, отряд выходит меньше: ставить
        // «третьего» через полкарты хуже, чем выпустить двоих.
        const spot = placed.length === 0 ? takeSpot() : neighbourSpot(placed);
        if (!spot) break;
        placed.push(spot);
        const e = makeEnemy(
          f.boss ? (f.bossKey || "dragon") : f.pool[rand(0, f.pool.length - 1)],
          index,
          group.elite && j === 0,
          group.squadId,
          j,
          f.boss
        );
        if (group.elite && j === 0) {
          e.name = e.title + " " + e.name;
        }
        e.x = spot.x;
        e.y = spot.y;
        state.enemies.push(e);
      }
      if (cursor >= far.length) break;
    }

    // Страж этажа встаёт у лестницы вниз: пока он жив, спуска нет. Раньше до
    // лестницы добегали мимо большинства врагов, и этаж проходился за пару
    // боёв. На этаже дракона стражем служит сам дракон.
    if (!bossFloor) state.stairsDown.active = !placeGuard(state, f, index, used, gen.end);

    for (const e of state.enemies) {
      if (!e.boss && !e.elite && !e.guard && G.missed.length && Math.random() < 0.35 &&
          (!e.squadId || e.squadIdx === 0)) {
        const p = G.missed.shift();
        e.payload = p;
        e.name = "Призрак ошибки";
        e.key = "ghost";
        e.color = "#c084fc";
        // Способность сохраняется от исходного монстра — «Призрак ошибки»
        // это оболочка пропущенного задания, а не рядовой призрак.
      }
    }

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
      used.add(key(tSpot.x, tSpot.y));
    }

    state.traps = placeTraps(state, index, used, free, gen.start, gen.end);
    state.camps = placeCamps(index, free, used, gen.end, gen.start);
    // Тайник ставится первым: он carve-ит комнату в монолите, и делать это
    // надо до того, как по свободным клеткам разложены жилы и таблички.
    const vault = placeVault(state, index, gen, used);
    if (vault) {
      state.vaults.push(vault);
      // Ключ от тайника лежит на страже этажа: спуск за тайником — это
      // отдельная маленькая цель, а не подарок.
      state.vaultNeedsKey = true;
    }
    state.nodes = (state.nodes || []).concat(placeNodes(index, free, used));
    state.levers = placeLevers(index, free, used, state.vaults);
    state.signs = placeSigns(index, free, used, gen.spots.length);
    state.portal = placePortal(index, free, used, gen.end);
    placeHazards(state, index);
    return state;
  }

  // Страж этажа: случайный вид из пула этажа, крепче обычного, на свободной
  // клетке рядом с лестницей вниз. null — места у лестницы нет: этаж
  // остаётся без стража, и лестница открыта сразу.
  function placeGuard(state, f, index, used, end) {
    const grid = state.map.grid;
    let spot = null;
    for (const [dx, dy] of shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
      const x = end.x + dx;
      const y = end.y + dy;
      if (x < 0 || y < 0 || x >= state.map.w || y >= state.map.h) continue;
      if (grid[y][x] !== 1 || used.has(key(x, y))) continue;
      spot = { x: x, y: y };
      break;
    }
    if (!spot || !f.pool || !f.pool.length) return null;
    const e = makeEnemy(f.pool[rand(0, f.pool.length - 1)], index, false, 0, 0);
    e.guard = true;
    e.name = "Страж лестницы " + e.name;
    e.maxHp = Math.round(e.maxHp * GUARD.hpMul);
    e.hp = e.maxHp;
    e.dmg = Math.max(1, Math.round(e.dmg * GUARD.dmgMul));
    e.baseDmg = e.dmg;
    e.xp = Math.round(e.xp * GUARD.xpMul);
    e.x = spot.x;
    e.y = spot.y;
    used.add(key(spot.x, spot.y));
    state.enemies.push(e);
    return e;
  }

  // Ловушки раскладываются по свободным клеткам комнат, но не рядом
  // со стартом, сундуками и трейдером — иначе вход на этаж превращается
  // в лотерею с потерей здоровья.
  // ---------- Интерактив этажа ----------
  // Тайник: комната 3×3, вырубленная в монолите, с единственной запертой
  // дверью. Генератор комнат её не знает, поэтому она ничего не ломает:
  // попасть внутрь можно только через дверь, а дверь открывает ключ или
  // рычаг. Внутри — сокровища и материалы, ради которых и стоит возиться.
  function placeVault(state, index, gen, used) {
    if (index < 3) return null;
    if (Math.random() < 0.25) return null;
    const grid = state.map.grid;
    const w = state.map.w, h = state.map.h;
    const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    for (let t = 0; t < 40; t += 1) {
      const spot = gen.spots[Math.floor(Math.random() * gen.spots.length)];
      if (!spot) continue;
      if (used.has(key(spot.x, spot.y))) continue;
      if (Math.abs(spot.x - gen.start.x) + Math.abs(spot.y - gen.start.y) < 5) continue;
      for (let d = 0; d < dirs.length; d += 1) {
        const dx = dirs[d][0], dy = dirs[d][1];
        const door = { x: spot.x + dx, y: spot.y + dy };
        // Внешнюю стену карты не режем: иначе через тайник можно выйти
        // за край поля. Дверь должна быть монолитом, а не полом.
        if (door.x <= 0 || door.y <= 0 || door.x >= w - 1 || door.y >= h - 1) continue;
        if (grid[door.y][door.x] !== 0) continue;
        // Комната за дверью: три клетки вглубь и три поперёк.
        const room = [];
        let fits = true;
        for (let deep = 1; deep <= 3 && fits; deep += 1) {
          for (let side = -1; side <= 1; side += 1) {
            const x = door.x + dx * deep + (dx === 0 ? side : 0);
            const y = door.y + dy * deep + (dy === 0 ? side : 0);
            if (x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1) { fits = false; break; }
            if (grid[y][x] !== 0) { fits = false; break; }
            room.push({ x: x, y: y });
          }
        }
        if (!fits || room.length !== 9) continue;
        // Дверь тоже проход: раньше она оставалась стеной, и комната была
        // запечатана навсегда — ключ и рычаг открывали несуществующий проход.
        grid[door.y][door.x] = 1;
        room.forEach((c) => { grid[c.y][c.x] = 1; });
        const fill = room.filter((c) => !(c.x === door.x && c.y === door.y));
        // Сокровища и материалы внутри: два предмета и пара жил.
        const loot = [];
        const mats = [];
        shuffle(fill);
        for (let i = 0; i < Math.min(2, fill.length); i += 1) {
          loot.push({ uid: ++G.uid, x: fill[i].x, y: fill[i].y, item: randomItemForFloor(index) });
        }
        for (let i = 2; i < Math.min(4, fill.length); i += 1) {
          mats.push({ uid: ++G.uid, x: fill[i].x, y: fill[i].y,
            kind: index >= 5 && Math.random() < 0.5 ? "shard" : "ore", taken: false });
        }
        // Перед дверью тайника не должно лежать ничего: сундук на клетке
        // подхода перехватывает нажатие, и игрок вместо «ключ нужен» просто
        // открывает сундук, а потом не понимает, почему дверь не открылась.
        state.treasures = (state.treasures || []).filter((t) =>
          Math.abs(t.x - spot.x) + Math.abs(t.y - spot.y) > 0);
        // Клетка перед дверью тоже занята: иначе жила или табличка,
        // поставленная позже, перехватывает нажатие E — и тайник
        // «не открывается», хотя ключ есть.
        used.add(key(spot.x, spot.y));
        used.add(key(door.x, door.y));
        loot.forEach((c) => used.add(key(c.x, c.y)));
        mats.forEach((c) => used.add(key(c.x, c.y)));
        const vault = {
          uid: ++G.uid, key: "vault",
          door: { x: door.x, y: door.y },
          from: { x: spot.x, y: spot.y },
          locked: true, opened: false
        };
        // Содержимое кладём в общие списки этажа: сундук остаётся сундуком,
        // жила — жилой, и отдельного кода для «внутри тайника» не нужно.
        state.treasures = (state.treasures || []).concat(loot);
        state.nodes = (state.nodes || []).concat(mats);
        return vault;
      }
    }
    return null;
  }

  // Жилы руды и поленницы: материал за одно нажатие. На мелких этажах
  // попадается древесина, глубже — руда и обломки.
  function placeNodes(index, free, used) {
    if (index < 1) return [];
    const want = index >= 5 ? 3 : 2;
    const out = [];
    const candidates = free.filter((s) => !used.has(key(s.x, s.y)));
    shuffle(candidates);
    for (let i = 0; i < Math.min(want, candidates.length); i += 1) {
      const s = candidates[i];
      const shard = index >= 5 && Math.random() < LOOT_SHARD_CHANCE;
      const wood = !shard && Math.random() < 0.5;
      used.add(key(s.x, s.y));
      out.push({ uid: ++G.uid, x: s.x, y: s.y,
        kind: shard ? "shard" : wood ? "wood" : "ore", taken: false });
    }
    return out;
  }

  // Рычаг: открывает тайник того же этажа, если ответить на короткий вопрос.
  // Ошибка бьёт героя, но рычаг остаётся — попробовать можно снова.
  function placeLevers(index, free, used, vaults) {
    const vault = vaults && vaults[0];
    if (!vault) return [];
    const candidates = free.filter((s) => !used.has(key(s.x, s.y)) &&
      Math.abs(s.x - vault.door.x) + Math.abs(s.y - vault.door.y) >= 4);
    shuffle(candidates);
    if (!candidates.length) return [];
    const s = candidates[0];
    used.add(key(s.x, s.y));
    return [{ uid: ++G.uid, x: s.x, y: s.y,
      vault: vault.uid, used: false }];
  }

  // Таблички: подсказка по Python и строка мира. Ничего не дают, кроме
  // знания — но это единственное место, где этаж разговаривает с учеником.
  function placeSigns(index, free, used, total) {
    if (total < 40) return [];
    const candidates = free.filter((s) => !used.has(key(s.x, s.y)));
    shuffle(candidates);
    if (!candidates.length) return [];
    const s = candidates[0];
    used.add(key(s.x, s.y));
    const tips = SIGN_TIPS || [];
    const tip = tips.length ? tips[Math.floor(Math.random() * tips.length)] : "";
    return [{ uid: ++G.uid, x: s.x, y: s.y, text: tip }];
  }

  // Портал в деревню открывается после каждого босса, кроме финального:
  // так игрок возвращается за печатью и не ищет старую лестницу наверх.
  function placePortal(index, free, used, end) {
    const def = floorDef(index);
    if (!def.boss || def.finalBoss || def.endless) return null;
    const candidates = free.filter((s) => !used.has(key(s.x, s.y)));
    if (!candidates.length) return null;
    candidates.sort((a, b) =>
      (Math.abs(a.x - end.x) + Math.abs(a.y - end.y)) -
      (Math.abs(b.x - end.x) + Math.abs(b.y - end.y)));
    const s = candidates[0];
    used.add(key(s.x, s.y));
    return { x: s.x, y: s.y };
  }

  // Тайник: открыть можно ключом или рычагом. Ключ тратится, а сам тайник
  // остаётся открытым до конца похода.
  function openVault(vault) {
    if (!vault) return false;
    if (!vault.locked) { setMsg("Тайник уже открыт — заходи."); return true; }
    if ((G.vaultKeys || 0) <= 0) {
      setMsg("Тайник заперт. Ключ держит страж лестницы — победи его. " +
        "Ещё дверь открывает рычаг этажа: он спросит вопрос и за ошибку ударит током, но не насмерть.");
      return false;
    }
    G.vaultKeys -= 1;
    vault.locked = false;
    vault.opened = true;
    log("Ключ от тайника повернулся: комната открыта. Ключей осталось: " + G.vaultKeys + ".", "loot");
    toast("Тайник открыт!");
    render();
    return true;
  }

  // Жила: материал в профиль (как и находки из сундуков).
  function mineNode(node) {
    if (!node || node.taken) return false;
    const got = gainLoot(node.kind, 1);
    node.taken = true;
    if (!got) log("Добыча не ушла в деревню: войди в аккаунт.", "loot");
    render();
    return true;
  }

  // Табличка: подсказка по Python. Ничего не даёт, кроме знания, и это
  // единственная награда, которую нельзя потратить.
  function readSign(sign) {
    if (!sign) return false;
    const box = el("dialog-box");
    if (!box) return false;
    G.dialogNpc = { key: "sign", name: "Табличка" };
    box.innerHTML = dialogHead("Табличка", "Кто-то оставил это здесь") +
      "<p class='lead'>«" + (sign.text || "Надпись стёрлась от времени.") + "»</p>";
    el("dialog-overlay").classList.remove("hidden");
    const close = el("dialog-close");
    if (close) close.addEventListener("click", closeDialog);
    G.stats.signsRead = (G.stats.signsRead || 0) + 1;
    return true;
  }

  // Рычаг: короткий вопрос. Верный ответ открывает тайник этажа, неверный
  // бьёт героя, но рычаг остаётся — попробовать можно снова.
  function openLever(lever) {
    if (!lever || lever.used) { setMsg("Этот рычаг уже опущен."); return false; }
    const q = pickQuestion();
    if (!q) { setMsg("Рычаг не поддаётся."); return false; }
    const options = q.options.map((o, i) => ({ text: o, idx: i }));
    shuffle(options);
    const view = { options: options.map((o) => o.text), answer: options.findIndex((o) => o.idx === q.answer) };
    lever.view = view;
    const box = el("dialog-box");
    if (!box) return false;
    G.dialogNpc = { key: "lever", name: "Рычаг" };
    const shock = Math.max(3, Math.round(G.player.maxHp * 0.08));
    box.innerHTML = dialogHead("Рычаг", "Открывает тайник этажа") +
      "<p class='lead'>За рычагом — запертая комната с добычей. Ответишь на вопрос " +
      "верно — дверь откроется; ошибёшься — ударит током на " + shock +
      " здоровья, но <b>не убьёт</b>: рычаг оставляет герою одно здоровье. " +
      "Дёргать его не обязательно.</p>" +
      "<p class='lead'>" + (q.text || "") + "</p>" +
      (q.code ? "<pre class='code lever-code'>" + escText(q.code) + "</pre>" : "") +
      "<div class='battle-options' id='lever-options'>" +
      view.options.map((o, i) =>
        "<button class='option lever-pick' type='button' data-lever='" + i + "'>" +
        "<span class='key'>" + LETTERS[i] + "</span><span>" + o + "</span></button>").join("") +
      "</div>";
    el("dialog-overlay").classList.remove("hidden");
    const close = el("dialog-close");
    if (close) close.addEventListener("click", closeDialog);
    return true;
  }

  function answerLever(lever, idx) {
    if (!lever || !lever.view) return false;
    const right = idx === lever.view.answer;
    const vault = vaultByUid(lever.vault);
    if (right) {
      lever.used = true;
      if (vault) {
        vault.locked = false;
        vault.opened = true;
        log("Рычаг опущен: тайник этажа открыт.", "loot");
        toast("Тайник открыт рычагом!");
      } else {
        log("Рычаг опущен, но открывать было нечего.", "loot");
      }
    } else {
      // Ток не убивает: он оставляет герою одно здоровье. Раньше удар мог
      // добить, и на вопросе у рычага погиб ученик — это не тот риск, который
      // уместен в задании «открой тайник».
      const shock = Math.max(3, Math.round(G.player.maxHp * 0.08));
      const dmg = Math.min(shock, Math.max(0, G.player.hp - 1));
      G.player.hp = Math.max(1, G.player.hp - dmg);
      log(dmg > 0
        ? "Рычаг бьёт током: −" + dmg + " здоровья. Не смертельно — попробуй ещё раз."
        : "Ток бьёт, но добить героя рычаг не может. Передохни и попробуй снова.", "fight");
      toast(dmg > 0 ? "Ток ударил (−" + dmg + " HP), но не насмерть" : "Рычаг не может добить героя");
      G.stats.leverWrong = (G.stats.leverWrong || 0) + 1;
    }
    lever.view = null;
    closeDialog();
    updateHud();
    render();
    // Смерти от рычага быть не может: удар оставляет одно здоровье.
    return right;
  }

  function inside(x, y, w, h) {
    return x >= 0 && y >= 0 && x < w && y < h;
  }

  function vaultAt(x, y) {
    return (G.vaults || []).find((v) => v.door && v.door.x === x && v.door.y === y) || null;
  }

  function vaultByUid(uid) {
    return (G.vaults || []).find((v) => v.uid === uid) || null;
  }

  function nodeAt(x, y) {
    return (G.nodes || []).find((n) => n.x === x && n.y === y && !n.taken) || null;
  }

  function leverAt(x, y) {
    return (G.levers || []).find((l) => l.x === x && l.y === y && !l.used) || null;
  }

  function portalActive() {
    return !!G.portal && !(G.enemies && G.enemies.length);
  }

  function signAt(x, y) {
    return (G.signs || []).find((s) => s.x === x && s.y === y) || null;
  }

  // Костры-привалы. Первый появляется со второго этажа, второй — с шестого:
  // до этого герой обходится зельями, а дальше без передышки не спуститься.
  function placeCamps(index, free, used, end, start) {
    if (index < 1) return [];
    const want = index >= 5 ? 2 : 1;
    const out = [];
    const candidates = free.filter((s) => {
      if (used.has(key(s.x, s.y))) return false;
      const toStart = Math.abs(s.x - start.x) + Math.abs(s.y - start.y);
      const toEnd = Math.abs(s.x - end.x) + Math.abs(s.y - end.y);
      return toStart >= 3 && toEnd >= 2;
    });
    shuffle(candidates);
    for (let i = 0; i < Math.min(want, candidates.length); i++) {
      const s = candidates[i];
      used.add(key(s.x, s.y));
      out.push({ uid: ++G.uid, x: s.x, y: s.y, used: false });
    }
    return out;
  }

  function campAt(x, y) {
    return (G.camps || []).find((c) => c.x === x && c.y === y) || null;
  }

  // Привал: лечение и пополнение зарядов умения. Лимит общий на поход, поэтому
  // костёр не «заправка», а решение: отдохнуть здесь или дотерпеть.
  function restAtCamp(camp) {
    if (!camp) return false;
    if (camp.used) { setMsg("Этот костёр уже прогорел."); return false; }
    if (G.restsLeft <= 0) {
      setMsg("Больше отдыхать негде: привалы на поход кончились.");
      return false;
    }
    G.restsLeft -= 1;
    camp.used = true;
    const heal = Math.round(G.player.maxHp * REST_HEAL);
    const was = G.player.hp;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + heal);
    const st = abilityState();
    const before = st.left;
    st.left = abilityCharges();
    log("Привал: +" + (G.player.hp - was) + " здоровья, заряды умения пополнены (" +
      before + " → " + st.left + "). Осталось привалов: " + G.restsLeft + ".", "loot");
    toast("Привал: +" + (G.player.hp - was) + " HP");
    updateHud();
    render();
    if (G.tutorial && G.tutorial.active) tutorialEvent("camp");
    return true;
  }

  function placeTraps(state, index, used, free, start, end) {
    const traps = [];
    if (typeof trapsForFloor !== "function" || index < 2) return traps;
    const budget = trapBudgetForFloor(index);
    const kinds = trapsForFloor(index);
    if (!budget || !kinds.length) return traps;
    const candidates = free.filter((s) => {
      if (used.has(key(s.x, s.y))) return false;
      return Math.hypot(s.x - start.x, s.y - start.y) >= 4 &&
        !(s.x === end.x && s.y === end.y);
    });
    shuffle(candidates);
    for (let i = 0; i < Math.min(budget, candidates.length); i++) {
      const s = candidates[i];
      const type = trapByKey(kinds[i % kinds.length]);
      if (!type) continue;
      used.add(key(s.x, s.y));
      traps.push({ uid: ++G.uid, x: s.x, y: s.y, kind: type.key, armed: true });
    }
    return traps;
  }

  function trapAt(x, y) {
    if (!G.traps) return null;
    return G.traps.find((t) => t.x === x && t.y === y) || null;
  }

  // Опасная среда этажа. «Тьма» клеток не занимает — она меняет обзор
  // на всём этаже, поэтому матрица остаётся пустой.
  function placeHazards(state, index) {
    const { w, h } = state.map;
    const grid = state.map.grid;
    state.hazard = Array.from({ length: h }, () => new Array(w).fill(""));
    const type = typeof floorHazard === "function" ? floorHazard(index) : null;
    if (!type || type.key === "dark") return;
    const density = typeof hazardDensity === "function" ? hazardDensity(type.key) : 0;
    if (!density) return;

    const taken = new Set();
    const mark = (x, y) => taken.add(key(x, y));
    state.enemies.forEach((e) => mark(e.x, e.y));
    state.treasures.forEach((t) => mark(t.x, t.y));
    (state.traders || []).forEach((t) => mark(t.x, t.y));
    (state.traps || []).forEach((t) => mark(t.x, t.y));
    if (state.stairsDown) mark(state.stairsDown.x, state.stairsDown.y);
    if (state.stairsUp) mark(state.stairsUp.x, state.stairsUp.y);
    const start = state.playerPos;

    const cells = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] !== 1) continue;
        if (taken.has(key(x, y))) continue;
        // Не под самой лестницей входа: иначе герой сходит с неё
        // прямо в лаву и не успевает ничего понять.
        if (Math.hypot(x - start.x, y - start.y) < 3) continue;
        cells.push({ x, y });
      }
    }
    shuffle(cells);
    const want = Math.round(cells.length * density);
    for (let i = 0; i < want && i < cells.length; i++) {
      state.hazard[cells[i].y][cells[i].x] = type.key;
    }
  }

  function hazardAt(x, y) {
    if (!G.hazard) return "";
    const row = G.hazard[y];
    return row ? row[x] || "" : "";
  }

  // Текущий этаж накрыт тьмой?
  function currentFloorHazard() {
    return typeof floorHazard === "function" ? floorHazard(G.floorIndex) : null;
  }

  // Радиус обзора. В подземелье он мал, а в деревне большой: уровень должны
  // открывать по мере обхода, но вслепую искать дома в хабе незачем.
  // Число правится в админке (village.view).
  let VILLAGE_VIEW_RADIUS = 9;

  function viewRadius() {
    if (G.place !== "dungeon") return VILLAGE_VIEW_RADIUS;
    const hz = currentFloorHazard();
    return hz && hz.key === "dark" ? DARK_VIEW_RADIUS : VIEW_RADIUS;
  }

  // Лава обжигает в конце каждого хода, пока герой стоит на ней.
  function hazardTick() {
    if (hazardAt(G.playerPos.x, G.playerPos.y) !== "lava") return 0;
    const dmg = devGod() ? 0 : armorDamage(HAZARD_DMG_BASE + G.floorIndex);
    G.player.hp = Math.max(0, G.player.hp - dmg);
    setMsg("Лава обжигает: −" + dmg + " здоровья.");
    log("Лавовый разлом обжёг тебя на " + dmg + ".", "hurt");
    const map = el("map");
    if (map) spawnFloat(map, "-" + dmg, "hurt", 50, 50);
    if (map) shakeEl(map);
    updateHud();
    if (G.player.hp <= 0) {
      showDeath();
      return dmg;
    }
    scheduleSave();
    return dmg;
  }

  // Множитель урона монстров от «Тёмной сделки» на текущем этаже.
  function curseDmgMul() {
    return G.blessings && G.blessings[G.floorIndex] === "curse"
      ? BLESS.curseEnemyDmg
      : 1;
  }

  // Множитель золота: по сделке монстры этажа отдают вдвое больше.
  function goldMulForFloor() {
    return G.blessings && G.blessings[G.floorIndex] === "curse"
      ? BLESS.curseGoldMul
      : 1;
  }

  function blessingOnFloor() {
    const chosen = G.blessings ? G.blessings[G.floorIndex] : null;
    return typeof blessingFor === "function" ? blessingFor(G.floorIndex, chosen) : null;
  }

  function snapshotCurrent() {
    const prev = G.cache[G.floorIndex];
    G.cache[G.floorIndex] = {
      index: G.floorIndex,
      map: G.map,
      playerPos: { ...G.playerPos },
      stairsDown: G.stairsDown,
      stairsUp: G.stairsUp,
      enemies: G.enemies,
      treasures: G.treasures,
      traders: G.traders,
      traps: G.traps,
      hazard: G.hazard,
      discovered: G.discovered,
      // Интерактив этажа. Без этих полей каждый автосейв (а он идёт через
      // snapshotCurrent) стирал тайники, рычаги, жилы, таблички и костры:
      // комната с добычей исчезала уже через полсекунды после находки.
      camps: G.camps || [],
      vaults: G.vaults || [],
      nodes: G.nodes || [],
      levers: G.levers || [],
      signs: G.signs || [],
      vaultNeedsKey: !!G.vaultNeedsKey,
      // Итог проверки генерации: сколько попыток понадобилось и что чинили.
      // Нужен только для диагностики, на игру не влияет.
      checked: prev && prev.checked || null
    };
  }

  // ---------- Загрузка и проверка этажа ----------

  // Сколько раз пересоздаём этаж, прежде чем чинить его принудительно.
  const FLOOR_MAX_ATTEMPTS = 8;
  // Минимальное время показа загрузки: сама генерация занимает миллисекунды,
  // и без этого оверлей мигал бы одним кадром.
  const LEVEL_MIN_LOAD_MS = 450;
  let levelLoadingAt = 0;

  function levelNow() {
    return typeof performance !== "undefined" && performance.now
      ? performance.now() : Date.now();
  }

  function nextFrame() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => setTimeout(resolve, 0));
      } else {
        setTimeout(resolve, 16);
      }
    });
  }

  function setLevelLoading(text, pct) {
    const node = el("loading-text");
    if (node) node.textContent = text;
    const fill = el("loading-fill");
    if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + "%";
  }

  function showLevelLoading(index) {
    levelLoadingAt = levelNow();
    const title = el("loading-title");
    if (title) title.textContent = "Этаж " + (index + 1) + ": " + floorNameAt(index);
    setLevelLoading("Генерация и проверка карты…", 18);
    const box = el("level-loading");
    if (box) box.classList.remove("hidden");
  }

  function hideLevelLoading() {
    const box = el("level-loading");
    if (box) box.classList.add("hidden");
  }

  // Проверка «правильной» генерации на компьютере игрока. Критично только то,
  // что может запереть игрока: путь от входа к спуску, путь к стражу, который
  // этот спуск держит, и достаточная площадь карты. Недостижимый сундук —
  // потеря содержания, но не тупик, поэтому этаж из-за него не пересоздаём.
  function validateFloorState(state) {
    const problems = [];
    const map = state.map;
    const w = map.w;
    const h = map.h;
    const grid = map.grid;
    const walkable = (x, y) =>
      x >= 0 && y >= 0 && x < w && y < h && grid[y][x] === 1;
    const start = state.playerPos;
    if (!walkable(start.x, start.y)) {
      return ["вход на непроходимой клетке"];
    }
    // Заливка от входа: всё, до чего герой реально дойдёт.
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;
    const first = start.y * w + start.x;
    seen[first] = 1;
    queue[tail++] = first;
    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % w;
      const cy = (cur - cx) / w;
      for (const d of STEP_DIRS) {
        const nx = cx + d[0];
        const ny = cy + d[1];
        if (!walkable(nx, ny)) continue;
        const ni = ny * w + nx;
        if (seen[ni]) continue;
        seen[ni] = 1;
        queue[tail++] = ni;
      }
    }
    const reach = (p) => !!p && walkable(p.x, p.y) && seen[p.y * w + p.x] === 1;
    if (!reach(state.stairsDown)) problems.push("спуск недостижим от входа");
    if (state.stairsUp && !reach(state.stairsUp)) {
      problems.push("подъём недостижим от входа");
    }
    if (state.stairsDown && start.x === state.stairsDown.x && start.y === state.stairsDown.y) {
      problems.push("спуск стоит на клетке входа");
    }
    // Лестница закрыта стражем: если до стража не дойти, этаж не пройти
    // никогда. Это и есть главный сценарий «заперло». На этаже дракона
    // лестницу держит сам дракон, отдельного стража там нет.
    if (state.stairsDown && !state.stairsDown.active) {
      const keeper = state.enemies.find((e) => e.guard || e.boss);
      if (!keeper) problems.push("спуск закрыт, но стража на этаже нет");
      else if (!reach(keeper)) problems.push("страж спуска недостижим");
    }
    // Тайник: дверь должна быть проходом, а площадка перед ней — достижима.
    // Иначе комната вырублена, но попасть в неё нельзя (именно так дверь
    // раньше оставалась стеной).
    (state.vaults || []).forEach((v) => {
      if (!v || !v.door) return;
      if (!walkable(v.door.x, v.door.y)) problems.push("дверь тайника в стене");
      if (!reach(v.from)) problems.push("к тайнику нет подхода");
    });
    // Рычаг открывает тайник: до него обязан быть путь.
    (state.levers || []).forEach((l) => {
      if (!reach(l)) problems.push("рычаг недостижим");
    });
    const minArea = Math.max(48, Math.floor(w * h * 0.12));
    if (tail < minArea) problems.push("доступно слишком мало клеток: " + tail);
    return problems;
  }

  // Последний рубеж: прорубаем коридор от входа к спуску и к стражу.
  // Лучше некрасивый прямой проход, чем этаж, который нельзя пройти.
  function repairFloorState(state) {
    const grid = state.map.grid;
    const carve = (a, b) => {
      const x1 = Math.min(a.x, b.x);
      const x2 = Math.max(a.x, b.x);
      for (let x = x1; x <= x2; x++) grid[a.y][x] = 1;
      const y1 = Math.min(a.y, b.y);
      const y2 = Math.max(a.y, b.y);
      for (let y = y1; y <= y2; y++) grid[y][b.x] = 1;
    };
    carve(state.playerPos, state.stairsDown);
    const guard = state.enemies.find((e) => e.guard);
    if (guard) carve(state.playerPos, guard);
    return state;
  }

  // Генерация с проверкой: брак пересоздаём, после исчерпания попыток чиним.
  // Очередь «призраков ошибок» откатываем: createFloorState разбирает её, и
  // неудачная попытка иначе съедала задания, которые ещё предстояло закрыть.
  function buildCheckedFloor(index) {
    const missedBackup = (G.missed || []).slice();
    for (let attempt = 1; attempt <= FLOOR_MAX_ATTEMPTS; attempt++) {
      const state = createFloorState(index);
      const problems = validateFloorState(state);
      if (!problems.length) {
        state.checked = { attempts: attempt, problems: [], repaired: false };
        return state;
      }
      G.missed = missedBackup.slice();
      if (attempt === FLOOR_MAX_ATTEMPTS) {
        repairFloorState(state);
        state.checked = {
          attempts: attempt,
          problems: problems,
          repaired: true,
          left: validateFloorState(state)
        };
        return state;
      }
    }
    // Сюда не попадаем: последняя попытка всегда возвращает состояние.
    const fallback = createFloorState(index);
    fallback.checked = { attempts: FLOOR_MAX_ATTEMPTS, problems: ["нет попыток"], repaired: false };
    return fallback;
  }

  // Вход на этаж с загрузкой. Генерация и проверка идут здесь же, на
  // компьютере игрока; оверлей показывает, что это не зависание.
  async function activateFloorLoaded(index, done) {
    // Автопроверки (node) не могут ждать кадр: они вызывают restartFloor или
    // спуск и сразу читают состояние. Флаг ставит tools/game_harness.js;
    // сама проверка генерации при этом выполняется так же.
    if (globalThis.__PYQUIZ_SYNC_FLOORS) {
      const state = G.cache[index] || buildCheckedFloor(index);
      G.cache[index] = state;
      activateFloor(index);
      if (done) done();
      return;
    }
    if (G.cache[index]) {
      // Уже пройденный этаж лежит готовым и проверенным при входе.
      activateFloor(index);
      if (done) done();
      return;
    }
    G.loading = true;
    showLevelLoading(index);
    try {
      await nextFrame();
      let state;
      try {
        state = buildCheckedFloor(index);
      } catch (err) {
        // Сбой генератора: лучше простой рабочий этаж, чем вечная загрузка.
        console.error("Генерация этажа упала", err);
        state = createFloorState(index);
        state.checked = { attempts: 0, problems: ["сбой генерации"], repaired: false };
      }
      G.cache[index] = state;
      const checked = state.checked || {};
      setLevelLoading(
        checked.repaired
          ? "Карта исправлена: путь к спуску прорублен"
          : "Проверено: всё проходимо (попыток: " + (checked.attempts || 1) + ")",
        100
      );
      await nextFrame();
      activateFloor(index);
      if (done) done();
    } finally {
      // Оверлей снимаем в любом случае, иначе ошибка оставила бы игрока
      // навечно на экране загрузки. Ввод разблокируем вместе с оверлеем:
      // иначе герой ходил бы под ещё висящим занавесом.
      const left = LEVEL_MIN_LOAD_MS - (levelNow() - levelLoadingAt);
      setTimeout(() => {
        hideLevelLoading();
        G.loading = false;
      }, Math.max(0, left));
    }
  }

  function activateFloor(index) {
    if (G.tutorial && G.tutorial.active && index !== 0) tutorialHide();
    let state = G.cache[index];
    if (!state) {
      // Страховка: если этаж активируют напрямую, он всё равно проходит
      // проверку. Основной путь — activateFloorLoaded с оверлеем загрузки.
      state = buildCheckedFloor(index);
      G.cache[index] = state;
    }
    G.floorIndex = index;
    // Развилка принадлежит тому этажу, на котором её показали. При смене
    // этажа старый оверлей закрывается: иначе он перехватывал мышь, а дар
    // применялся к уже другому этажу.
    G.blessingOffer = null;
    const oldBlessing = el("blessing-overlay");
    if (oldBlessing) oldBlessing.classList.add("hidden");
    // Подземелье — это место "dungeon": деревня и дома живут в тех же
    // полях, поэтому каждый вход обязан сбросить их за собой.
    G.place = "dungeon";
    setPlaceMarker("dungeon");
    syncPlaceButtons();
    G.houseKey = null;
    G.blocked = null;
    G.npcs = [];
    G.doors = [];
    G.scenery = [];
    G.mat = null;
    G.roofKind = null;
    G.roofColor = null;
    G.ground = floorDef(index).theme != null ? floorDef(index).theme : index % 10;
    const stageNode = el("stage");
    if (stageNode) stageNode.classList.remove("village");
    // Снимок входа на этаж. Смерть откатывает к нему: опыт этого этажа
    // теряется, а золото и снаряжение остаются (пункт 7). Снимок пишется
    // на каждом входе, поэтому всегда принадлежит текущему этажу.
    G.floorCheckpoint = {
      index: index,
      level: G.player.level,
      xp: G.player.xp,
      xpNext: G.player.xpNext,
      baseMaxHp: G.player.baseMaxHp,
      dmgBase: G.player.dmgBase
    };
    // Отметка ошибок на входе: по ней задание «без единой ошибки» понимает,
    // был ли этот этаж пройден чисто.
    G.questFloorWrong = (G.stats && G.stats.wrong) || 0;
    G.map = state.map;
    G.stairsDown = state.stairsDown;
    G.stairsUp = state.stairsUp;
    G.enemies = state.enemies;
    G.treasures = state.treasures;
    G.lootBags = state.lootBags || [];
    G.traders = state.traders || [];
    G.traps = state.traps || [];
    G.camps = state.camps || [];
    G.vaults = state.vaults || [];
    G.nodes = state.nodes || [];
    G.levers = state.levers || [];
    G.signs = state.signs || [];
    G.portal = state.portal || null;
    G.vaultNeedsKey = !!state.vaultNeedsKey;
    G.hazard = state.hazard || null;
    G.playerPos = { ...state.playerPos };
    G.visible = new Set();
    G.discovered = state.discovered || new Set();
    G.entityEls.forEach((node) => node.remove());
    G.entityEls.clear();
    G.tileEls = [];
    G.tileBg = [];
    G.tileObj = [];
    G.camera.zoomIndex = null;
    el("map").dataset.theme = String(floorDef(index).theme != null ? floorDef(index).theme : index % 10);
    const hz = currentFloorHazard();
    el("map").dataset.hazard = hz ? hz.key : "";
    // Винетка тьмы живёт на вьюпорте, а не на карте: камера держит героя
    // в центре экрана, и темнота должна сгущаться вокруг него.
    el("map-scroll").classList.toggle("hazard-dark", !!hz && hz.key === "dark");
    el("map").classList.add("no-cam-anim");
    render();
    flashFloorArrival();
    requestAnimationFrame(() => el("map").classList.remove("no-cam-anim"));

    if (!G.visited.has(index)) {
      showFloorArrival(index);
      offerBlessing(index);
    } else {
      showFloorTitle(index);
    }
    G.visited.add(index);
  }

  // ---------- Деревня и дома: уровень, а не экран ----------
  // Деревня рисуется тем же кодом, что подземелье: та же карта из тайлов,
  // камера, зум, мини-карта, поиск пути и кнопка действия. Разница только в
  // том, что здесь нет монстров, ловушек и среды, а вместо этажа — «место»
  // (G.place). Раскладка лежит текстом в village-content.js.

  // Клетка занята непроходимым объектом: дерево, забор, колодец. Стены
  // проверяются отдельно по grid — они ещё и тень отбрасывают, а объекты нет.
  function cellBlocked(x, y) {
    if (x < 0 || y < 0 || !G.map || x >= G.map.w || y >= G.map.h) return true;
    // Запертая дверь тайника не пропускает: клетка проходима, но комната
    // должна быть закрыта, пока нет ключа или рычаг не опущен.
    const vault = vaultAt(x, y);
    if (vault && vault.locked) return true;
    return !!(G.blocked && G.blocked[y] && G.blocked[y][x]);
  }

  // Подписи уличных объектов деревни и ключи их картинок. Ключ отличается от
  // вида объекта у костра: вид «fire» занят декором подземелья, значок у него
  // свой («campfire»), и без перевода mapIcon вернул бы чужую картинку.
  const PROP_NAMES = {
    tree: "Дерево", fence: "Забор", well: "Колодец", fire: "Костёр",
    barrel: "Бочка", woodpile: "Поленница", chimney: "Труба",
    table: "Стол", chair: "Стул", bed: "Кровать", shelf: "Полка",
    crate: "Ящик", anvil: "Наковальня", fireplace: "Очаг",
    workbench: "Верстак", cauldron: "Котёл", counter: "Прилавок"
  };
  const PROP_ICONS = {
    tree: "tree", fence: "fence", well: "well", fire: "campfire",
    barrel: "barrel", woodpile: "woodpile", chimney: "chimney",
    table: "table", chair: "chair", bed: "bed", shelf: "shelf",
    crate: "crate", anvil: "anvil", fireplace: "fireplace",
    workbench: "workbench", cauldron: "cauldron", counter: "counter"
  };
  const INTERIOR_PROPS = new Set([
    "table", "chair", "bed", "shelf", "crate", "anvil",
    "fireplace", "workbench", "cauldron", "counter"
  ]);

  function placeName() {    if (G.place === "village") return "Деревня";
    if (G.place === "house") {
      const h = VILLAGE_HOUSES[G.houseKey];
      return h ? h.name : "Дом";
    }
    return "Этаж " + (G.floorIndex + 1) + " · " + floorNameAt(G.floorIndex);
  }

  // Сумка героя между походами: зелья из кошелька и снаряжение, купленное
  // у торговца. Собирается при каждом входе в деревню — герой-заглушка живёт
  // долго, и заполнять сумку только при её создании значило бы показывать
  // пустую панель после каждого похода. Надетого в деревне нет: снаряжение
  // надевают в подземелье.
  function villageKitFromProfile() {
    // Поход на паузе: показываем то, что герой несёт с собой. Раньше сумка
    // и снаряжение безусловно подменялись деревенским набором из кошелька,
    // и собранный в подземелье лут выглядел пропавшим, хотя лежал в сейве.
    const paused = pausedRun();
    if (paused) {
      G.inventory = (paused.inventory || []).slice();
      G.equipment = paused.equipment
        || { weapon: null, armor: null, accessory: null };
      return;
    }
    G.inventory = [];
    G.equipment = { weapon: null, armor: null, accessory: null };
    const prof = hubProfile();
    if (!prof) return;
    const w = prof.wallet || {};
    const add = (id, n) => {
      const it = typeof itemById === "function" ? itemById(id) : null;
      for (let i = 0; i < (n || 0) && it; i += 1) G.inventory.push(Object.assign({}, it));
    };
    add("small_potion", w.small_potion || 0);
    add("big_potion", w.big_potion || 0);
    ((prof.hub && prof.hub.gear) || []).forEach((id) => add(id, 1));
  }

  // Раскладка → та же форма, что у этажа подземелья, поэтому рендер, камера
  // и ходьба деревню и подземелье не различают.
  function villagePlaceState(rows, npcPlace) {
    const src = villageParseMap(rows);
    const blocked = [];
    for (let y = 0; y < src.h; y++) blocked.push(new Array(src.w).fill(0));
    const doors = [];
    src.objects.forEach((o) => {
      if (o.blocked) blocked[o.y][o.x] = 1;
      if (o.kind === "door") {
        // Внутри дома дверь одна и она ведёт наружу; в деревне каждая дверь
        // принадлежит своему дому.
        const isExit = npcPlace !== "village";
        doors.push({
          x: o.x, y: o.y, locked: false, exit: isExit,
          key: isExit ? npcPlace : villageHouseAtDoor(o.x, o.y)
        });
      }
      if (o.kind === "locked") {
        // Дверь постройки, которую деревня ещё не восстановила. Ключ постройки
        // хранится и у запертой двери: по нему открывается окно восстановления,
        // а заперта дверь или нет — решает doorLocked прямо сейчас.
        doors.push({ x: o.x, y: o.y, key: villageBuildingAtDoor(o.x, o.y), locked: true, exit: false });
      }
    });
    const npcs = VILLAGE_NPCS.filter((n) => n.place === npcPlace).map((n) => ({
      uid: ++G.uid, key: n.key, name: n.name, x: n.at.x, y: n.at.y
    }));
    // Деревья, забор, колодец и костёр рисуются как объекты: в grid это
    // обычный пол, поэтому без отдельного списка они были бы невидимы.
    const scenery = src.objects.filter((o) =>
      o.kind === "tree" || o.kind === "fence" || o.kind === "well" || o.kind === "fire" ||
      o.kind === "barrel" || o.kind === "woodpile" || o.kind === "chimney" ||
      INTERIOR_PROPS.has(o.kind));
    // Материалы клеток: в деревне по ним рисуется крыша, фасад и окна.
    // В комнатах их нет — там всё как в подземелье, каменным полом.
    const mats = npcPlace === "village" ? villageMaterials(src) : blankMaterials(src.w, src.h);
    // Трубы с крыш — такие же уличные объекты, как дерево или колодец.
    (mats.props || []).forEach((p) => scenery.push(p));
    return {
      map: { w: src.w, h: src.h, grid: src.grid, decor: src.decor },
      blocked: blocked,
      doors: doors,
      npcs: npcs,
      scenery: scenery,
      mat: mats.mat,
      roofKind: mats.roofKind,
      roofColor: mats.roofColor
    };
  }

  // Пустые материалы нужного размера: место без зданий.
  function blankMaterials(w, h) {
    const one = () => {
      const rows = [];
      for (let y = 0; y < h; y++) rows.push(new Array(w).fill(""));
      return rows;
    };
    return { mat: one(), roofKind: one(), roofColor: one() };
  }

  function villageState() {
    return villagePlaceState(VILLAGE_MAP, "village");
  }

  function houseState(key) {
    // Внутрь можно войти и в восстановленную постройку (амбар, кузницу, дом
    // мастера): у неё есть и прямоугольник, и комната, но в списке жилых домов
    // её нет — она появляется в деревне только после постройки.
    const house = villageBuildingByKey(key);
    if (!house || !HOUSE_MAPS[key]) return null;
    // Внутри дома стены и пол берутся из TERRAIN_VILLAGE.interior: это
    // отдельная деревянная комната, а не фасад с улицы.
    return villagePlaceState(HOUSE_MAPS[key], key);
  }

  // В деревне похода ещё нет, а ходьбе и панели нужен объект героя.
  // begin() заводит своего, поэтому это только заглушка на время деревни.
  function ensureVillagePlayer() {
    if (G.player) return;
    G.player = {
      hp: 1, baseMaxHp: 1, maxHp: 1, level: 1, xp: 0, xpNext: XP_BASE,
      dmgBase: 0, atkBonus: 0, defBonus: 0, gold: 0,
      poison: 0, freeHints: 0, snared: false, cursedNext: false
    };
    if (!G.stats) {
      G.stats = { correct: 0, wrong: 0, codePassed: 0, codeTried: 0, copyPassed: 0,
        copyTried: 0, hintsUsed: 0, goldEarned: 0, topicStats: {}, floorsCleared: 0, kills: 0 };
    }
    // В деревне героя нет, но панель деревни показывает, с чем он уйдёт
    // в подземелье: улучшения читаются из того же progressBonus.
    G.prog = progressBonus();
    // Сумка и снаряжение в деревне — из профиля, а не с прошлого похода:
    // поход заканчивается смертью или победой, и его вещи либо уехали в банк,
    // либо пропали. Между походами у героя есть зелья из кошелька и то
    // снаряжение, что куплено у торговца и ждёт спуска.
    G.inventory = [];
    G.equipment = { weapon: null, armor: null, accessory: null };
    const villageProf = hubProfile();
    if (villageProf) {
      const w = villageProf.wallet || {};
      const add = (id, n) => {
        const it = typeof itemById === "function" ? itemById(id) : null;
        for (let i = 0; i < (n || 0) && it; i += 1) G.inventory.push(Object.assign({}, it));
      };
      add("small_potion", w.small_potion || 0);
      add("big_potion", w.big_potion || 0);
      (villageProf.hub && villageProf.hub.gear ? villageProf.hub.gear : []).forEach((id) => add(id, 1));
    }
  }

  // Снять слой объектов целиком. Убирать именно узлы, а не пересоздавать
  // карту G.entityEls: при пересоздании старые узлы остаются в DOM без ссылок,
  // и спрайты деревни висят поверх подземелья, а в деревне копятся двойники.
  function clearEntityLayer() {
    G.entityEls.forEach((node) => node.remove());
    G.entityEls.clear();
  }

  // Вход в место. at — куда поставить героя; без него — точка появления.
  function enterPlace(kind, key, at) {
    const st = kind === "village" ? villageState()
      : kind === "house" ? houseState(key) : null;
    if (!st) return false;
    G.place = kind;
    setPlaceMarker(kind);
    syncPlaceButtons();
    G.houseKey = kind === "house" ? key : null;
    show("game");
    G.map = st.map;
    G.blocked = st.blocked;
    G.doors = st.doors;
    G.npcs = st.npcs;
    G.scenery = st.scenery || [];
    G.mat = st.mat || null;
    G.roofKind = st.roofKind || null;
    G.roofColor = st.roofColor || null;
    G.ground = kind === "house" ? 11 : VILLAGE_GROUND;
    G.enemies = [];
    G.treasures = [];
    G.lootBags = [];
    G.traders = [];
    G.traps = [];
    G.hazard = null;
    // Интерактив подземелья не переносится в деревню и дома. Иначе тайники,
    // рычаги, жилы, костры и таблички с координатами этажа остаются на карте
    // деревни: рисуются, перехватывают E и блокируют проход.
    G.vaults = [];
    G.nodes = [];
    G.levers = [];
    G.camps = [];
    G.signs = [];
    G.vaultNeedsKey = false;
    G.stairsDown = null;
    G.stairsUp = null;
    G.portal = null;
    G.battle = null;
    G.blessingOffer = null;
    G.walkTarget = null;
    G.playerPos = at ? { x: at.x, y: at.y } : { ...VILLAGE_SPAWN };
    G.visible = new Set();
    G.discovered = (kind === "village" && G.villageSeen)
      ? new Set(G.villageSeen) : new Set();
    clearEntityLayer();
    // Пустой список плиток заставляет renderTiles собрать сетку заново:
    // две комнаты одного размера иначе оставили бы чужие стены и пол.
    G.tileEls = [];
    G.tileBg = [];
    G.tileObj = [];
    G.camera.zoomIndex = null;
    G.actionSig = null;
    G.running = true;
    G.dead = false;
    G.startedAt = Date.now();
    // Ловушки и цепи — принадлежность подземелья. Если герой поднялся в
    // деревню, оставшись в цепи, она больше не держит: иначе move() запрещал
    // шаг, а skipTurn() в деревне отключён, и игрок застревал навсегда.
    if (kind !== "dungeon" && G.player) {
      G.player.snared = false;
      G.player.snareWaits = 0;
    }
    ensureVillagePlayer();
    const stage = el("stage");
    if (stage) stage.classList.toggle("village", kind !== "dungeon");
    el("map").dataset.theme = "village";
    el("map").dataset.hazard = "";
    el("map-scroll").classList.remove("hazard-dark");
    el("map").classList.add("no-cam-anim");
    hideFloorArrival();
    measureViewport();
    // Сначала собираем сумку, потом рисуем панель: renderVillageInfo читает
    // G.inventory, и раньше он показывал пустую сумку вперёд неё.
    villageKitFromProfile();
    render();
    renderVillageInfo();
    renderInventory();
    updateEquipBar();
    requestAnimationFrame(() => el("map").classList.remove("no-cam-anim"));
    return true;
  }

  function enterVillage(at) {
    tutorialHide();
    const ok = enterPlace("village", null, at);
    // Первый вход: цель и управление должны быть видны, а не лежать
    // в скрытом aria-live-блоке. Цель живёт в HUD, управление — в тосте.
    if (ok && isFirstRun() && !G.firstGoalDone) {
      setTimeout(() => {
        toast("WASD — идти · E — действие · клик по карте — маршрут", 5200);
      }, 350);
    }
    return ok;
  }

  function enterHouse(key) {
    const house = villageBuildingByKey(key);
    if (!house || !HOUSE_MAPS[key]) return false;
    // Запоминаем клетку ПЕРЕД дверью, а не саму дверь: дверь теперь стена,
    // и вернуть игрока внутрь неё было бы нельзя.
    G.villageReturn = { x: G.playerPos.x, y: G.playerPos.y };
    return enterPlace("house", key, house.exit);
  }

  function exitHouse() {
    enterVillage(G.villageReturn || null);
  }

  // ---------- Окна жителей деревни ----------
  // У торговца — лавка, у старосты — банк, рекорд и достижения, у наставника
  // — памятка, у стража входа — настройка спуска. Одно окно на всех: содержимое
  // собирается под жителя, поэтому новых оверлеев не заводим.

  function dialogHead(title, sub) {
    return "<div class='battle-head'><div><div class='enemy-name'>" + title + "</div>" +
      "<div class='hud-num'>" + (sub || "") + "</div></div>" +
      "<button class='exit-btn' id='dialog-close' type='button' " +
      "data-tip='Закрыть. Клавиша Escape.'>Закрыть</button></div>";
  }

  function openDialog(npc) {
    if (!npc) return;
    const box = el("dialog-box");
    if (!box) return;
    markCodex("npcs", npc.key);
    G.dialogNpc = npc;
    box.innerHTML = dialogHtml(npc);
    // Единый каркас диалога: шапка остаётся сверху, остальное уходит в
    // прокручиваемое тело, а внизу — спокойная подсказка вместо второй кнопки
    // «Закрыть» (крестик уже есть в шапке).
    const head = box.querySelector(":scope > .battle-head");
    if (head) {
      const body = document.createElement("div");
      body.className = "battle-mid dialog-body";
      while (head.nextSibling) body.appendChild(head.nextSibling);
      box.appendChild(body);
      const foot = document.createElement("div");
      foot.className = "battle-foot";
      foot.innerHTML = "<span class='foot-note'>Esc — закрыть</span>";
      box.appendChild(foot);
    }
    el("dialog-overlay").classList.remove("hidden");
    const close = el("dialog-close");
    if (close) close.addEventListener("click", closeDialog);
  }

  function closeDialog() {
    G.dialogNpc = null;
    el("dialog-overlay").classList.add("hidden");
  }

  function dialogHtml(npc) {
    if (npc.key === "trader") return traderDialogHtml();
    if (npc.key === "elder") return elderDialogHtml();
    if (npc.key === "mentor") return mentorDialogHtml();
    if (npc.key === "blacksmith") return forgeDialogHtml();
    if (npc.key === "master") return masterDialogHtml();
    if (npc.key === "storekeeper") return barnDialogHtml();
    return dialogHead(npc.name) + "<p class='lead'>«Здравствуй, герой!»</p>";
  }

  // Лавка торговца: те же предложения, что были в экране-меню.
  function traderDialogHtml() {
    const prof = hubProfile();
    const gold = prof ? (prof.wallet.gold || 0) : 0;
    let html = dialogHead("Торговец", "Банк деревни: <b>" + gold + "</b> золота");
    html += "<p class='lead'>Амулеты возврата, зелья и снаряжение в дорогу.</p>";
    html += "<div class='hub-shop' id='dialog-shop'>" +
      (prof ? hubShopOffers().map((o) => hubShopCard(o, prof)).join("") : "") + "</div>";
    if (!prof) html += "<p class='lead'>Войди в аккаунт на главной — тогда будет чем платить.</p>";
    return html;
  }

  function elderDialogHtml() {
    const prof = hubProfile();
    const rev = prof && prof.hub ? prof.hub.revive : 0;
    const best = prof ? prof.dungeonBest : null;
    let html = dialogHead("Староста", "Деревня помнит твои походы");
    html += "<p class='lead'><b>Банк деревни:</b> " +
      (prof ? walletText(prof.wallet) : "пусто") + "</p>";
    html += "<p class='lead'><b>Амулеты возврата:</b> " +
      "●".repeat(rev) + "○".repeat(Math.max(0, HUB_AMULET_MAX - rev)) +
      " (" + rev + " из " + HUB_AMULET_MAX + ")</p>";
    html += "<p class='lead'><b>Рекорд:</b> " + (best
      ? "этаж " + best.floors + ", " + best.percent + "%" + (best.victory ? " — победа над драконом" : "")
      : "подземелье ещё не пройдено") + "</p>";
    html += questBlockHtml();
    if (prof) html += badgesHtml(prof);
    return html;
  }

  // Квестовый блок старосты: глава кампании и повторяемое задание. И то и
  // другое можно не брать — в подземелье пускают и без квеста, — но с ним
  // деревня платит золотом и материалами.
  function questBlockHtml() {
    const prof = hubProfile();
    if (!prof) return "";
    let html = "<h3 class='quest-head'>Кампания · " + CAMPAIGN.title + "</h3>";
    const step = storyStep();
    if (!step) {
      html += "<p class='lead'>«Печати на месте, герой. Осталась только дорога вниз».</p>";
    } else {
      const done = goalDone(step.goal);
      const chapter = storyChapterNumber(prof.quests.story);
      html += "<div class='build-block'>" +
        "<div class='hub-card-head'><b>Глава " + chapter + ". " + step.title + "</b>" +
        "<span class='hub-price'>" + (done ? "готова" : "в работе") + "</span></div>" +
        "<p class='hub-card-note'>" + step.brief + "</p>" +
        "<p class='hub-card-note'><b>Где:</b> " + step.place + "</p>" +
        "<p class='lead'>Награда: " + rewardText(step.reward) + "</p>" +
        (done
          ? "<button class='btn quest-claim' type='button' data-quest='story' data-goal=\"" +
            step.key + "\">Завершить главу</button>"
          : "<span class='hub-stock'>" + (goalProgressText(step.goal) || "цель ещё не выполнена") + "</span>") +
        "</div>";
    }
    const active = prof.quests.active;
    const def = REPEAT_QUESTS[active];
    html += "<h3 class='quest-head'>Поручения</h3>";
    if (def) {
      const ready = questProgress() >= def.need;
      html += "<div class='build-block'>" +
        "<div class='hub-card-head'><b>" + def.title + "</b><span class='hub-price'>" +
        questProgress() + " из " + def.need + "</span></div>" +
        "<p class='hub-card-note'>" + def.text + "</p>" +
        "<p class='lead'>Награда: " + rewardText(def.reward) + "</p>" +
        (ready
          ? "<button class='btn quest-claim' type='button' data-quest='repeat' data-goal=\"" +
            active + "\">Забрать награду</button>"
          : "<button class='btn ghost quest-drop' type='button' data-quest='" + active +
            "'>Отказаться от задания</button>") +
        "</div>";
    } else {
      html += "<p class='lead'>Без задания тоже можно: в подземелье пускают всегда. " +
        "С заданием деревня платит.</p><div class='hub-shop'>" +
        REPEAT_KEYS.map((k) => {
          const r = REPEAT_QUESTS[k];
          const done = prof.quests.repeat[k] || 0;
          return "<div class='hub-card'>" +
            "<div class='hub-card-head'><b>" + r.title + "</b><span class='hub-price'>" +
            r.need + (r.need === 1 ? " раз" : " раза") + "</span></div>" +
            "<p class='hub-card-note'>" + r.text + "</p>" +
            "<p class='lead'>Награда: " + rewardText(r.reward) + "</p>" +
            "<span class='hub-stock'>выполнено раз: " + done + "</span>" +
            "<button class='btn quest-take' type='button' data-quest='" + k +
            "'>Взять задание</button></div>";
        }).join("") + "</div>";
    }
    return html;
  }

  function rewardText(reward) {
    const parts = [];
    if (reward.gold) parts.push(reward.gold + " золота");
    LOOT_KINDS.forEach((k) => { if (reward[k]) parts.push(LOOT_NAMES[k] + " " + reward[k]); });
    return parts.join(" и ") || "ничего";
  }

  function mentorDialogHtml() {
    let html = dialogHead("Наставник", "Как играть");
    html += "<ul class='mentor-list'>" +
      "<li><b>Ходы</b> — стрелки или WASD. Можно кликнуть по клетке: герой пойдёт сам.</li>" +
      "<li><b>Действие</b> — клавиша E или кнопка внизу: двери, сундуки, торговец, лестницы.</li>" +
      "<li><b>Бой</b> — это урок: сначала вопрос по теме, потом задача на ту же тему. " +
      "Верный ответ бьёт врага, ошибка — тебя.</li>" +
      "<li><b>Смерть</b> — поход кончается, но находки остаются: золото, материалы и ключи " +
      "доходят до деревни целиком.</li>" +
      "<li><b>Деревня</b> — колодец, амбар, кузницу и дом мастера восстанавливают за материалы " +
      "из подземелья. Кузница даёт улучшения героя, и без неё глубоко не спуститься.</li>" +
      "<li><b>Амулет возврата</b> — второй шанс: поднимет на месте и сохранит поход. " +
      "Унести можно не больше " + HUB_AMULET_MAX + ".</li>" +
      "<li><b>Карта</b> — клавиша M, зум — колесо мыши.</li>" +
      "</ul>";
    return html;
  }

  // ---------- Развитие деревни: окна построек ----------

  // Строка цены с остатком на руках: по ней и учатся считать материалы,
  // поэтому галочка стоит там, чего хватает.
  function costHtml(cost) {
    const prof = hubProfile();
    if (!prof) return "";
    return Object.keys(cost).map((k) => {
      if (k === "key") {
        const have = prof.loot.keys.indexOf(cost[k]) >= 0;
        return (have ? "✓ " : "✗ ") + keyName(cost[k]);
      }
      const have = prof.loot[k] || 0;
      return (have >= cost[k] ? "✓ " : "✗ ") + LOOT_NAMES[k] + " " + have + "/" + cost[k];
    }).join(" · ");
  }

  // Блок постройки: что даёт, какой уровень и что нужно на следующий.
  // Один и тот же блок стоит и в окне у двери, и в окне жителя постройки.
  function buildBlockHtml(key) {
    const def = VILLAGE_BUILDINGS[key];
    if (!def) return "";
    const level = villageLevel(key);
    const cost = buildCost(key);
    let html = "<div class='build-block'>" +
      "<div class='hub-card-head'><b>" + def.name + "</b><span class='hub-price'>уровень " +
      level + " из " + def.levels.length + "</span></div>" +
      "<p class='hub-card-note'>" + def.effect() + "</p>";
    if (!cost) {
      html += "<span class='hub-stock full'>построено до конца</span></div>";
      return html;
    }
    const can = canPayBuild(cost);
    html += "<p class='lead'>Нужно: " + costHtml(cost) + "</p>" +
      "<button class='btn" + (can ? "" : " ghost") + " build-go' type='button' data-build=\"" +
      key + "\"" + (can ? "" : " disabled") + ">" +
      (level ? "Улучшить: " + def.name : "Восстановить: " + def.name) + "</button>" +
      "</div>";
    return html;
  }

  // Окно самой постройки: у запертой двери и у колодца другого разговора нет.
  function openBuild(key) {
    const def = key ? VILLAGE_BUILDINGS[key] : null;
    const box = el("dialog-box");
    if (!box) return;
    const close = () => {
      const c = el("dialog-close");
      if (c) c.addEventListener("click", closeDialog);
    };
    if (!def) {
      G.dialogNpc = null;
      box.innerHTML = dialogHead("Дверь", "") + "<p class='lead'>Дверь заперта — хозяев нет дома.</p>";
    } else {
      G.dialogNpc = { key: "build:" + key, name: def.name };
      box.innerHTML = dialogHead(def.name, "Постройка деревни") + buildBlockHtml(key);
    }
    el("dialog-overlay").classList.remove("hidden");
    close();
  }

  // Прибавка за уровень: у здоровья и силы — единицы, у добычи и брони — проценты.
  function heroStepText(kind) {
    const step = HERO_STEPS[kind] || 0;
    if (kind === "loot" || kind === "armor") return "+" + Math.round(step * 100) + "%";
    return "+" + Math.round(step);
  }

  // Улучшение героя: уровень, что даёт и цена следующего.
  function heroUpgradeCard(u, prof) {
    const level = heroLevel(u.kind);
    const cap = heroCap(u.kind);
    const maxed = level >= cap;
    const price = maxed ? 0 : heroPrice(u.kind, level);
    const gold = (prof && prof.wallet.gold) || 0;
    const can = !maxed && gold >= price;
    let html = "<div class='hub-card'>" +
      "<div class='hub-card-head'><b>" + u.name + "</b><span class='hub-price'>" +
      (maxed ? "максимум" : price + " зол.") + "</span></div>" +
      "<p class='hub-card-note'>Уровень " + level + " из " + cap + ": " + heroStepText(u.kind) +
      " " + u.unit + "</p>";
    html += "<span class='hub-stock'>" + (maxed
      ? "выше не поднять"
      : (gold >= price ? "хватает золота" : "не хватает " + (price - gold))) + "</span>" +
      "<button class='btn" + (can ? "" : " ghost") + " upg-buy' type='button' data-upg=\"" +
      u.kind + "\"" + (can ? "" : " disabled") + ">Улучшить</button></div>";
    return html;
  }

  function forgeDialogHtml() {
    const prof = hubProfile();
    const gold = prof ? (prof.wallet.gold || 0) : 0;
    const cap = upgradeCap();
    let html = dialogHead("Кузнец", "Банк деревни: <b>" + gold + "</b> золота");
    html += buildBlockHtml("forge");
    if (!cap) {
      html += "<p class='lead'>Горн ещё не разожжён — улучшать нечего. " +
        "Восстанови кузницу, и я примусь за работу.</p>";
      return html;
    }
    html += "<p class='lead'>Улучшения остаются навсегда и действуют в каждом походе. " +
      "Кузница открывает <b>" + cap + "</b> уровня" +
      (villageLevel("smith") > 0 ? "." : ", дом мастера поднимет потолок до пятого.") + "</p>";
    html += "<div class='hub-shop' id='dialog-upgrades'>" +
      HERO_UPGRADE_LIST.map((u) => heroUpgradeCard(u, prof)).join("") + "</div>";
    return html;
  }

  function masterDialogHtml() {
    let html = dialogHead("Мастер", "Мастерская");
    html += "<p class='lead'>«Ключ нашёлся — и верстак снова в деле. " +
      "Твои улучшения я подниму до пятого уровня».</p>";
    if (villageLevel("smith") > 0) {
      html += "<p class='lead'><b>Улучшения героя:</b> потолок " + upgradeCap() + " уровней.</p>";
    }
    html += buildBlockHtml("smith");
    return html;
  }

  function barnDialogHtml() {
    const prof = hubProfile();
    let html = dialogHead("Кладовщик", "Припасы деревни");
    html += buildBlockHtml("barn");
    if (prof) {
      html += "<p class='lead'><b>На складе:</b> " + LOOT_KINDS.map((k) =>
        LOOT_NAMES[k] + " " + (prof.loot[k] || 0)).join(" · ") + "</p>";
    }
    return html;
  }

  // Восстановление постройки: списываем материалы, поднимаем уровень деревни.
  // Материалы и ключи копятся в профиле, поэтому цена — единственное, что
  // уходит: неудачной постройки быть не может.
  function restoreBuilding(key) {
    const prof = hubProfile();
    const def = VILLAGE_BUILDINGS[key];
    if (!prof || !def) return false;
    const cost = buildCost(key);
    if (!cost) { toast(def.name + " уже построен до конца"); return false; }
    if (!canPayBuild(cost)) { toast("Не хватает материалов: нужно " + costHtml(cost)); return false; }
    Object.keys(cost).forEach((k) => {
      if (k === "key") prof.loot.keys = prof.loot.keys.filter((x) => x !== cost[k]);
      else prof.loot[k] = Math.max(0, (prof.loot[k] || 0) - cost[k]);
    });
    prof.village[key] = Math.min(VILLAGE_CAPS[key] || 2, villageLevel(key) + 1);
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Деревня: " + def.name + " — уровень " + prof.village[key] + ".", "loot");
    toast(def.name + ": " + def.effect());
    // Дверь постройки открывается сразу: спрайт двери уже нарисован, и его
    // надо перерисовать — замок теперь спрашивает профиль.
    G.prog = progressBonus();
    const chapter = storyStep();
    if (chapter && chapter.goal === key && goalDone(key)) {
      log("Сюжет: цель главы " + storyChapterNumber(prof.quests.story) + " «" +
        chapter.title + "» выполнена. Вернись к старосте.", "floor");
    }
    render();
    renderVillageInfo();
    updateWalletLine();
    updateHud();
    if (G.dialogNpc && G.dialogNpc.key === "build:" + key) openBuild(key);
    else if (G.dialogNpc) openDialog(G.dialogNpc);
    return true;
  }

  function buyHeroUpgrade(kind) {
    const prof = hubProfile();
    if (!prof || !HERO_STEPS[kind]) return false;
    const level = heroLevel(kind);
    if (level >= heroCap(kind)) {
      toast("Выше не поднять: нужен дом мастера или предел уровня");
      return false;
    }
    const price = heroPrice(kind, level);
    if ((prof.wallet.gold || 0) < price) { toast("Не хватает золота: нужно " + price); return false; }
    prof.wallet.gold -= price;
    prof.hero[kind] = level + 1;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    const u = HERO_UPGRADE_LIST.filter((x) => x.kind === kind)[0] || { name: kind };
    log("Улучшение героя: " + u.name + " — уровень " + prof.hero[kind] + ".", "loot");
    toast(u.name + ": уровень " + prof.hero[kind]);
    G.prog = progressBonus();
    renderVillageInfo();
    updateWalletLine();
    updateHud();
    if (G.dialogNpc) openDialog(G.dialogNpc);
    return true;
  }

  // Окно входа в подземелье: статичная вёрстка (сложность, режим, спуск).
  function openEntrance() {
    // Игрок нашёл стража — подсказка «Первый спуск» больше не нужна.
    G.firstGoalDone = true;
    markCodex("npcs", "guard");
    renderAbilityPick();
    el("entrance-overlay").classList.remove("hidden");
    updateResumeButton();
    updateWalletLine();
    updateKnowledgeLine();
    updateHud();
    // Окно — модальное: фокус должен оказаться в нём, а не остаться на
    // кнопке меню или в шапке. «Продолжить» важнее «Спуститься», если поход
    // уже ждёт.
    const resume = el("resume-btn");
    const target = resume && resume.style.display !== "none"
      ? resume : (el("begin-btn") || el("entrance-close"));
    if (target) {
      setTimeout(() => {
        try { target.focus(); } catch (e) {}
      }, 30);
    }
  }

  // Выбор умения перед спуском. Умения открывает дом мастера: без него блок
  // не показывается вовсе — незачем выбирать то, чего нет.
  function renderAbilityPick() {
    const box = el("ability-list");
    const wrap = el("ability-pick");
    const note = el("ability-note");
    if (!box || !wrap) return;
    const unlocked = abilityUnlocked();
    wrap.classList.toggle("hidden", !unlocked);
    if (!unlocked) return;
    const pick = chosenAbility();
    box.innerHTML = ABILITY_KEYS.map((key) => {
      const a = ABILITIES[key];
      return "<div class='mode" + (key === pick ? " active" : "") + "' data-ab='" + key +
        "' role='radio' aria-checked='" + (key === pick ? "true" : "false") + "' tabindex='0'>" +
        "<span class='mode-mark' aria-hidden='true'></span><b>" + a.name + "</b>" +
        "<span class='mode-note'>" + a.desc + "</span></div>";
    }).join("");
    if (note) {
      note.textContent = "Зарядов на поход: " + abilityCharges() +
        " — пополняются у костров в подземелье.";
    }
  }

  // Выбор умения: пишем в профиль, чтобы он помнился между походами.
  function pickAbility(key) {
    if (!ABILITIES[key]) return false;
    const prof = hubProfile();
    if (!prof) return false;
    prof.ability.pick = key;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    if (G.ability) G.ability.key = key;
    renderAbilityPick();
    return true;
  }

  function closeEntrance() {
    el("entrance-overlay").classList.add("hidden");
  }

  // ---------- Калибровка: окно и запись результата ----------
  // Уровень хранится в профиле, а не в сейве похода: он переезжает между
  // компьютерами вместе с аккаунтом и остаётся после смерти героя.
  let calibrationState = null;

  function updateKnowledgeLine() {
    const line = el("knowledge-line");
    const btn = el("calibration-btn");
    const k = accountName() ? knowledgeFor(accountName()) : null;
    if (line) {
      if (!k || !k.level) {
        line.textContent = "Уровень знаний пока не определён: перед первым спуском — 6 коротких вопросов.";
      } else {
        line.textContent = "Уровень знаний: " + knowledgeTitle(k.level) +
          (k.source === "skipped" ? " (выбран по умолчанию)" : "") + ".";
      }
    }
    if (btn) btn.textContent = k && k.level ? "Пройти калибровку заново" : "Проверить уровень";
  }

  function saveCalibration(level, source, correct, total, score) {
    const name = accountName();
    if (!name) return;
    const prof = getProfile(name);
    prof.knowledge = normalizeKnowledge({
      level: level, source: source, date: new Date().toISOString(),
      correct: correct, total: total, score: score
    });
    putProfile(name, prof);
    syncProfile(name);
    G.knowledgeLevel = level;
    updateKnowledgeLine();
  }

  function openCalibration(after) {
    const name = accountName();
    if (!name) {
      toast("Войди в аккаунт на главной странице");
      return;
    }
    const questions = calibrationQuestions();
    if (questions.length < 3) {
      toast("Не удалось загрузить вопросы калибровки");
      return;
    }
    calibrationState = {
      questions: questions,
      index: 0,
      score: 0,
      correct: 0,
      total: questions.length,
      chosen: -1,
      answered: false,
      saved: false,
      after: typeof after === "function" ? after : null
    };
    el("calibration-overlay").classList.remove("hidden");
    renderCalibration();
  }

  function closeCalibration() {
    el("calibration-overlay").classList.add("hidden");
    calibrationState = null;
  }

  function finishCalibration() {
    if (!calibrationState) return;
    const after = calibrationState.after;
    closeCalibration();
    if (after) after();
  }

  function calibrationResultHtml(state) {
    const level = calibrationLevelFor(state.score);
    if (!state.saved) {
      saveCalibration(level, "calibration", state.correct, state.total, state.score);
      state.saved = true;
    }
    return "<div class='battle-head'><div>" +
      "<div class='enemy-name'>Проверка уровня</div>" +
      "<div class='hud-num'>Результат</div></div>" +
      "<button class='exit-btn' id='calib-close' type='button'>Закрыть</button></div>" +
      "<h2>Уровень: " + knowledgeTitle(level) + "</h2>" +
      "<p class='lead'>Правильных ответов: " + state.correct + " из " + state.total +
      ". Баллов: " + state.score + " из 12.</p>" +
      "<p class='lead'>" + KNOWLEDGE_NOTES[level] + "</p>" +
      "<p class='mode-note'>" +
      ((typeof window !== "undefined" && window.__PYQUIZ_WEB)
        ? "Уровень сохранён в локальном сохранении этого браузера."
        : "Уровень сохранён в профиле: он будет действовать и на другом компьютере после входа.") +
      "</p>" +
      "<div class='calib-foot'>" +
      "<button class='btn' id='calib-continue' type='button'>" +
      (state.after ? "Спуститься" : "Готово") + "</button>" +
      "<button class='btn ghost' id='calib-again' type='button'>Пройти заново</button>" +
      "</div>";
  }

  function renderCalibration() {
    const state = calibrationState;
    const box = el("calibration-box");
    if (!state || !box) return;
    if (state.index >= state.questions.length) {
      box.innerHTML = calibrationResultHtml(state);
      return;
    }
    const q = state.questions[state.index];
    const opts = (q.options || []).map((text, i) => {
      let cls = "calib-option";
      if (state.answered) {
        if (i === q.answer) cls += " correct";
        else if (i === state.chosen) cls += " wrong";
      }
      return "<button class='" + cls + "' type='button' data-calib-option='" + i + "'" +
        (state.answered ? " disabled" : "") + ">" +
        "<b>" + String.fromCharCode(65 + i) + ".</b> " + escText(text) + "</button>";
    }).join("");
    let feedback = "";
    if (state.answered) {
      const ok = state.chosen === q.answer;
      feedback = "<div class='calib-feedback " + (ok ? "ok" : "bad") + "'>" +
        "<b>" + (ok ? "Верно." : "Правильный ответ: " +
          String.fromCharCode(65 + q.answer) + ".") + "</b> " +
        escText(q.explanation || "") + "</div>";
    }
    box.innerHTML =
      "<div class='battle-head'><div>" +
      "<div class='enemy-name'>Проверка уровня</div>" +
      "<div class='hud-num'>Вопрос " + (state.index + 1) + " из " + state.questions.length + "</div>" +
      "</div><button class='exit-btn' id='calib-close' type='button'>Закрыть</button></div>" +
      "<div class='calib-question'>" + escText(q.text || "") + "</div>" +
      (q.code ? "<pre class='calib-code'>" + escText(q.code) + "</pre>" : "") +
      "<div class='calib-options'>" + opts + "</div>" +
      feedback +
      "<div class='calib-foot'>" +
      (state.answered
        ? "<button class='btn' id='calib-next' type='button'>" +
          (state.index + 1 >= state.questions.length ? "Результат" : "Дальше") + "</button>"
        : "<button class='btn ghost' id='calib-skip' type='button'>Пропустить проверку</button>") +
      "</div>";
  }

  function pickCalibrationOption(index) {
    const state = calibrationState;
    if (!state || state.answered) return;
    const q = state.questions[state.index];
    if (!q || !q.options || index < 0 || index >= q.options.length) return;
    state.chosen = index;
    state.answered = true;
    state.correct += index === q.answer ? 1 : 0;
    if (index === q.answer) state.score += q.level || 1;
    renderCalibration();
  }

  function nextCalibration() {
    const state = calibrationState;
    if (!state || !state.answered) return;
    state.index += 1;
    state.chosen = -1;
    state.answered = false;
    renderCalibration();
  }

  function skipCalibration() {
    // Пропуск не оставляет ученика без уровня: игра начинается с «Базового»,
    // а калибровку можно пройти заново у стража.
    saveCalibration(2, "skipped", 0, 0, 0);
    finishCalibration();
  }

  function restartCalibration() {
    if (!calibrationState) return;
    const after = calibrationState.after;
    const questions = calibrationQuestions();
    calibrationState = {
      questions: questions,
      index: 0, score: 0, correct: 0, total: questions.length, chosen: -1,
      answered: false, saved: false, after: after
    };
    renderCalibration();
  }

  // Спуск: читаем выбранные сложность и режим (их выставляют обработчики
  // карточек) и запускаем поход. Это «сырой» старт для бота и проверок;
  // калибровку спрашивает только кнопка в окне стража (beginFromEntrance),
  // чтобы программный запуск не упирался в модальное окно.
  function enterDungeon() {
    closeEntrance();
    // Подсказка управления относится к деревне; в бою/подземелье она лишняя.
    clearToast();
    begin();
  }

  // Кнопка «Спуститься»: сразу начинаем поход. В публичной игре нет
  // входной проверки знаний; калибровка осталась в classroom-ветке.
  function beginFromEntrance() {
    enterDungeon();
  }

  // Блок деревни в боковой панели: банк и амулеты вместо здоровья похода.
  function renderVillageInfo() {
    const box = el("village-bank");
    if (!box) return;
    const prof = hubProfile();
    if (!prof) {
      box.innerHTML = "<p class='lead'>Войди в аккаунт на главной странице — " +
        "тогда золото и амулеты будут копиться между походами.</p>";
      return;
    }
    const rev = prof.hub.revive;
    let html =
      "<p class='lead'><b>Банк:</b> " + walletText(prof.wallet) + "</p>";
    // Куда идти дальше. Без этой строки после затвора игрок видел материалы,
    // постройки и «Продолжить поход», но не понимал, что именно чинить.
    const step = storyStep();
    if (step) {
      const ready = goalDone(step.goal);
      html += "<p class='lead'><b>Следующий шаг:</b> " + escText(step.title) + " — " +
        (ready ? "награда ждёт у старосты" :
          (goalProgressText(step.goal) || "поговори со старостой")) + ".</p>";
    } else {
      html += "<p class='lead'><b>Сюжет пройден.</b> Дракон побеждён — можно " +
        "спускаться в бездну.</p>";
    }
    if (!prof.dungeonBest && !pausedRun()) {
      html += "<p class='lead'><b>Первый поход:</b> найди стража у входа, " +
        "спустись до шестого этажа. У затвора понадобится оберег из кузницы. " +
        "Кузница — третья глава деревни: амбар, колодец, кузница. Поход сохранится.</p>";
    }
    html +=
      "<p class='lead'><b>Амулеты:</b> " +
      "●".repeat(rev) + "○".repeat(Math.max(0, HUB_AMULET_MAX - rev)) +
      " (" + rev + " из " + HUB_AMULET_MAX + ")</p>";
    // Материалы — то, чем растёт деревня, поэтому они всегда на виду: без
    // этого ученик не понимает, зачем таскает руду из подземелья.
    html += "<p class='lead'><b>Материалы:</b> " + LOOT_KINDS.map((k) =>
      LOOT_NAMES[k] + " " + (prof.loot[k] || 0)).join(" · ") + "</p>";
    const built = Object.keys(VILLAGE_BUILDINGS).filter((k) => villageLevel(k) > 0);
    html += "<p class='lead'><b>Постройки:</b> " + (built.length
      ? built.map((k) => VILLAGE_BUILDINGS[k].name + " " + villageLevel(k)).join(", ")
      : "пока ничего не восстановлено") + "</p>";
    // Сумка и снаряжение героя между походами: то, с чем он спустится.
    const bag = G.inventory || [];
    const potions = bag.filter((i) => i && i.slot === "potion").length;
    const gear = bag.filter((i) => i && i.slot !== "potion");
    html += "<p class='lead'><b>С собой в поход:</b> " + (potions || gear.length
      ? (potions ? "зелий " + potions : "") +
        (potions && gear.length ? ", " : "") +
        (gear.length ? "снаряжение: " + gear.map((i) => i.name).join(", ") : "")
      : "пусто — купи у торговца или возьми из банка") + "</p>";
    const cap = upgradeCap();
    if (cap > 0) {
      const up = HERO_UPGRADE_LIST.filter((u) => heroLevel(u.kind) > 0);
      html += "<p class='lead'><b>Улучшения героя:</b> " + (up.length
        ? up.map((u) => u.name + " " + heroLevel(u.kind) + "/" + heroCap(u.kind)).join(", ")
        : "куплены ещё не были") + "</p>";
    }
    // Поход на паузе: без этой строки возврат в деревню выглядел как сброс —
    // золото и вещи просто исчезали с глаз, хотя лежали в сохранении.
    const paused = pausedRun();
    if (paused) {
      const carried = paused.inventory || [];
      const carriedGold = (paused.player && paused.player.gold) || 0;
      const carriedGear = carried.filter((i) => i && i.slot !== "potion");
      html += "<p class='lead'><b>Поход на паузе:</b> этаж " +
        ((paused.floorIndex || 0) + 1) + ", золото " + carriedGold +
        (carriedGear.length
          ? ", снаряжение: " + carriedGear.map((i) => escText(i.name)).join(", ")
          : "") +
        ". Всё это вернётся, когда продолжишь.</p>" +
        "<button class='btn' id='village-resume-btn' type='button'>Продолжить поход</button>";
    }
    box.innerHTML = html;
  }

  // Выбор на входе: «Тёмная сделка» или «Каменный дар». Показывается
  // один раз на этаж, начиная с четвёртого. Игра при этом не встаёт:
  // окно висит поверх карты, а ходы можно делать и до ответа.
  function offerBlessing(index) {
    const chosen = G.blessings ? G.blessings[index] : null;
    if (typeof blessOffered !== "function" || !blessOffered(index, chosen)) return;
    const box = el("blessing-box");
    const overlay = el("blessing-overlay");
    if (!box || !overlay) return;
    G.blessingOffer = index;
    box.innerHTML =
      "<h2>Развилка на входе</h2>" +
      "<p class='bless-lead'>" + floorNameAt(index) + ": руны предлагают сделку. " +
      "Выбирай — обратно пути нет.</p>" +
      "<div class='bless-grid'>" +
      Object.keys(BLESSINGS).map((k) => {
        const b = BLESSINGS[k];
        return "<button class='bless-card " + k + "' type='button' data-bless='" + k + "'>" +
          "<span class='bless-icon'>" + b.icon + "</span>" +
          "<span class='bless-name'>" + b.name + "</span>" +
          "<span class='bless-good'>" + b.good + "</span>" +
          "<span class='bless-extra'>" + b.extra + "</span>" +
          "</button>";
      }).join("") +
      "</div>";
    overlay.classList.remove("hidden");
    box.querySelectorAll("[data-bless]").forEach((btn) => {
      btn.addEventListener("click", () => chooseBlessing(btn.dataset.bless));
    });
  }

  function chooseBlessing(kind) {
    const index = G.blessingOffer;
    if (index == null) return;
    const b = typeof BLESSINGS !== "undefined" ? BLESSINGS[kind] : null;
    if (!b) return;
    G.blessings[index] = kind;
    G.blessingOffer = null;
    el("blessing-overlay").classList.add("hidden");
    if (kind === "curse") {
      addGold(BLESS.curseGold);
      log("Тёмная сделка: монстры этого этажа бьют на 25% сильнее, " +
        "но золото с них удваивается. Получено " + BLESS.curseGold + " золота.", "hurt");
      effectFlash("Тёмная сделка · +" + BLESS.curseGold + " золота");
    } else {
      G.player.baseMaxHp += BLESS.blessingHp;
      // Снимок входа на этаж сделан до выбора. Без этой строки смерть
      // откатывала базовое здоровье, и дар пропадал, а плата за него —
      // живучие монстры — оставалась.
      if (G.floorCheckpoint && G.floorCheckpoint.index === index) {
        G.floorCheckpoint.baseMaxHp += BLESS.blessingHp;
      }
      recalcStats();
      G.player.hp = G.player.maxHp;
      log("Каменный дар: +" + BLESS.blessingHp + " к максимуму здоровья, " +
        "здоровье восстановлено полностью. Монстры этажа стали живучее.", "loot");
      effectFlash("Каменный дар · +" + BLESS.blessingHp + " HP");
    }
    render();
    updateHud();
    scheduleSave();
  }

  // Название этажа — короткая полноэкранная заставка на пару секунд.
  // Описание этажа из панели «Место/Этаж» убрано; его текст остаётся только
  // в скрытом блоке для проверок и не мешает игроку.
  function showFloorTitle(index, extraHtml) {
    const body = el("floor-arrival-body") || el("floor-arrival");
    if (!body) return;
    hideLevelLoading();
    body.innerHTML =
      "<div class='floor-intro-card'>" +
      "<div class='floor-intro-kicker'>Этаж " + (index + 1) + "</div>" +
      "<h2 class='floor-intro-title'>" + floorNameAt(index) + "</h2>" +
      (extraHtml ? "<div class='floor-intro-desc'>" + extraHtml + "</div>" : "") +
      "</div>";
    el("floor-arrival").classList.remove("hidden");
    clearTimeout(showFloorTitle._timer);
    showFloorTitle._timer = setTimeout(hideFloorArrival, 2200);
    const close = el("floor-arrival-close");
    if (close) close.onclick = hideFloorArrival;
  }

  // Первое появление на этаже: событие и подсказка по-прежнему пишутся
  // в скрытый журнал, но на экране остаётся только название этажа.
  function showFloorArrival(index) {
    const epi = typeof floorEpilogue === "function" ? floorEpilogue(index) : null;
    let extra = "";
    if (epi) {
      const topic = TOPICS[epi.topic];
      const hz = typeof floorHazard === "function" ? floorHazard(index) : null;
      extra =
        "<p>" + epi.text + "</p>" +
        (hz ? "<p class='floor-hazard'>" + hz.icon + " " + hz.name + ": " + hz.text + "</p>" : "") +
        (topic ? "<p class='floor-epi-topic'>Тема этажа: " + topic + "</p>" : "") +
        (epi.hint ? "<p class='floor-hint'>" + epi.hint + "</p>" : "") +
        (hz ? "<p class='floor-hint floor-hazard-hint'>" + hz.hint + "</p>" : "") +
        (G.stairsDown && !G.stairsDown.active && !floorDef(index).boss
          ? "<p class='floor-hint'>Лестницу вниз охраняет страж: победи его, чтобы спуститься.</p>"
          : "");
    }
    showFloorTitle(index, extra);
    const ev = typeof floorEvent === "function" ? floorEvent(index) : null;
    if (ev) log("Событие: " + ev.text);
    const tip = typeof floorTip === "function" ? floorTip(index) : null;
    if (tip) log("Совет: " + tip);
    setMsg("Этаж " + (index + 1) + ": " + floorNameAt(index) + ".");
  }

  function hideFloorArrival() {
    const box = el("floor-arrival");
    if (!box || box.classList.contains("hidden")) return;
    box.classList.add("hidden");
    clearTimeout(showFloorTitle._timer);
  }

  // Добыча на этаже. Раньше предмет выпадал равновероятно из всего
  // доступного пула, и клинок 4-го тира на пятом этаже был такой же
  // вероятностью, как ржавый меч со второго. Теперь тир выбирается
  // отдельно, с весом тем выше, чем глубже этаж: на 5+ уровне
  // «морозный клинок» и «корона власти» наконец выпадают.
  // Вес предмета в пуле этажа. Вынесено отдельной функцией, чтобы правило
  // «чем глубже, тем сильнее тянет к верхнему тиру» можно было проверить
  // не статистикой розыгрышей, а прямым сравнением весов.
  function itemWeightFor(item, floorIndex) {
    const depth = Math.min(1, (floorIndex + 1) / 10);
    // Наклон вглубь: на первом этаже перевес почти незаметен, на десятом
    // верхний тир весит втрое сильнее нижнего.
    const climb = 1 + 2 * depth * (item.tier / 4);
    // Редкое и выше — дороже: так глубина ощущается и в удаче.
    const rare = item.rarity === "epic" ? 1.5 : item.rarity === "rare" ? 1.2 : 1;
    return climb * rare;
  }

  function randomItemForFloor(floorIndex, slot) {
    const pool = itemsForFloor(floorIndex, slot);
    if (!pool.length) return null;
    const weights = pool.map((i) => itemWeightFor(i, floorIndex));
    const item = pickWeighted(pool, weights, Math.random());
    return item ? Object.assign({}, item) : null;
  }

  // Добыча с дракона: только лучшее, что есть в игре, без зелий.
  function bossDrop() {
    const best = ITEM_POOL.filter((i) => i.tier >= 3 && i.slot !== "potion");
    if (!best.length) return randomItemForFloor(lastDungeonFloor(), null);
    return { ...best[Math.floor(Math.random() * best.length)] };
  }

  function computeVisibility() {
    // Деревня открывается по мере обхода, как и подземелье, только радиус
    // больше — см. viewRadius(). Раньше здесь стоял ранний выход, который
    // помечал открытой всю карту разом, и деревня с первого кадра была
    // известна целиком — и на экране, и на мини-карте.
    const { x: px, y: py } = G.playerPos;
    const radius = viewRadius();
    G.visible = new Set();
    // Раньше здесь был перебор всех 660 клеток с Math.hypot на каждой:
    // теперь только прямоугольник вокруг героя и квадрат расстояния.
    const r = Math.ceil(radius);
    const r2 = radius * radius;
    const x0 = Math.max(0, px - r);
    const x1 = Math.min(G.map.w - 1, px + r);
    const y0 = Math.max(0, py - r);
    const y1 = Math.min(G.map.h - 1, py + r);
    for (let y = y0; y <= y1; y++) {
      const dy = y - py;
      const dy2 = dy * dy;
      for (let x = x0; x <= x1; x++) {
        const dx = x - px;
        if (dx * dx + dy2 > r2) continue;
        const k = key(x, y);
        G.visible.add(k);
        G.discovered.add(k);
      }
    }
    // Открытое в деревне запоминаем на сеанс — см. G.villageSeen.
    if (G.place !== "dungeon") G.villageSeen = new Set(G.discovered);
  }

  // Метрики карты (--cell/--gap/--pad и рамка) читаются из стилей один раз:
  // раньше getComputedStyle вызывался трижды за ход и каждый раз сбрасывал
  // очередь стилей. Кэш сбрасывается при смене масштаба и этажа.
  let metricsCache = null;

  function mapMetrics() {
    const mapEl = el("map");
    if (metricsCache && metricsCache.el === mapEl && metricsCache.floor === G.floorIndex) {
      return metricsCache;
    }
    const cs = getComputedStyle(mapEl);
    // Ноль — законное значение (плитки идут встык): `|| 4` превращал бы его в
    // запасное, и существа съезжали бы с плиток на 4 px за каждую клетку.
    const num = (name, fallback) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };
    const cell = num("--cell", 46);
    const gap = num("--gap", 4);
    const pad = num("--pad", 14);
    metricsCache = {
      el: mapEl,
      floor: G.floorIndex,
      cell: cell,
      gap: gap,
      pad: pad,
      step: cell + gap,
      frameW: (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0),
      frameH: (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0),
    };
    return metricsCache;
  }

  // Размер карты считаем арифметически: чтение offsetWidth заставляло браузер
  // пересчитывать раскладку всех 660 плиток прямо посреди отрисовки.
  function mapSize(m) {
    return {
      w: m.pad * 2 + m.frameW + G.map.w * m.cell + (G.map.w - 1) * m.gap,
      h: m.pad * 2 + m.frameH + G.map.h * m.cell + (G.map.h - 1) * m.gap,
    };
  }

  // Ступени масштаба — целые кратные нарисованным 32 px: ×1, ×2, ×3.
  // Тайлы и спрайты — пиксель-арт 32×32, и при любом другом размере клетки
  // (раньше были 16, 48 и 80 px) пиксели выходят то в один, то в два экранных
  // пикселя: картинка неровная и «дрожит» при ходьбе.
  const CAM_LEVELS = [32, 64, 96];
  // Старые сохранения хранят номер ступени прежней шкалы.
  const LEGACY_CAM_LEVELS = [16, 32, 48, 64, 80, 96];

  // Ступень по умолчанию: самая крупная, при которой в окне ещё помещается
  // хотя бы 14 клеток в ширину и 8,5 в высоту, то есть весь круг света героя
  // (радиус обзора 4,4 клетки). На ноутбуке это ×2, на телефоне ×1.
  function defaultZoomIndex() {
    if (!viewCache.w) measureViewport();
    const vw = viewCache.w || 0;
    const vh = viewCache.h || 0;
    // Окно ещё не измерено (экран скрыт): берём среднюю ступень, а не самую
    // крупную, до которой «дотягивается» нулевая ширина.
    if (!vw || !vh) return Math.min(1, CAM_LEVELS.length - 1);
    let idx = 0;
    for (let i = 0; i < CAM_LEVELS.length; i++) {
      const cell = CAM_LEVELS[i];
      if (vw / cell < 14 || vh / cell < 8.5) continue;
      idx = i;
    }
    return idx;
  }

  // Ближайшая ступень к произвольному размеру клетки; при равенстве — крупнее.
  function nearestZoomIndex(cell) {
    let best = 0;
    for (let i = 0; i < CAM_LEVELS.length; i++) {
      if (Math.abs(CAM_LEVELS[i] - cell) <= Math.abs(CAM_LEVELS[best] - cell)) best = i;
    }
    return best;
  }

  function setZoomCell() {
    // Окно берём из кэша: чтение clientWidth на каждом шаге сбрасывало
    // раскладку карты и давало рывки при ходьбе.
    if (!viewCache.w) measureViewport();
    if (G.camera.zoomIndex == null) G.camera.zoomIndex = defaultZoomIndex();
    G.camera.zoomIndex = clamp(G.camera.zoomIndex, 0, CAM_LEVELS.length - 1);
    el("map").style.setProperty("--cell", CAM_LEVELS[G.camera.zoomIndex] + "px");
    metricsCache = null;
  }

  // Размер окна подземелья запоминаем: чтение clientWidth на каждом шаге
  // заставляло браузер сводить раскладку заново.
  const viewCache = { w: 0, h: 0 };

  function measureViewport() {
    const vp = el("map-scroll");
    if (!vp) return viewCache;
    viewCache.w = vp.clientWidth;
    viewCache.h = vp.clientHeight;
    return viewCache;
  }

  function positionCamera() {
    if (!viewCache.w || !viewCache.h) measureViewport();
    const vw = viewCache.w;
    const vh = viewCache.h;
    if (!vw || !vh) return;
    const mapEl = el("map");
    const m = mapMetrics();
    const size = mapSize(m);
    const mapW = size.w;
    const mapH = size.h;
    // Бой: камера подъезжает к паре «герой и враг». Нижнюю часть экрана
    // оставляем панели с вопросом, поэтому точку пары держим выше центра.
    const focus = G.battle && document.body.classList.contains("battling")
      ? battleFocusPoint()
      : null;
    if (focus) {
      const z = BATTLE_ZOOM;
      const fx = m.pad + focus.x * m.step + m.cell / 2;
      const fy = m.pad + focus.y * m.step + m.cell / 2;
      // Панель с вопросом занимает низ экрана: пару держим в свободной
      // полосе над ней, а не в геометрическом центре окна. Длинное задание
      // поднимает панель — вместе с ней поднимается и точка камеры.
      let anchorY = Math.round(vh * 0.32);
      const box = el("battle-box");
      const panel = box && box.querySelector(".battle-panel");
      if (panel && panel.getBoundingClientRect().height > 40) {
        const pr = panel.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(panel).bottom) || 0;
        const panelTop = vh - pr.height - gap;
        anchorY = Math.max(90, Math.min(anchorY, Math.round((panelTop - 20) * 0.5)));
      }
      let tx = vw / 2 - fx * z;
      let ty = anchorY - fy * z;
      // В бою не прижимаем камеру к краю карты: важнее держать пару
      // по центру сцены. За краем плиток остаётся тёмная пустота, она
      // сливается с неисследованной частью этажа.
      tx = Math.round(tx);
      ty = Math.round(ty);
      G.camera.tx = tx;
      G.camera.ty = ty;
      G.camera.scale = z;
      mapEl.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + z + ")";
      positionBattleFighters();
      return;
    }
    G.camera.scale = 1;
    const cx = m.pad + G.playerPos.x * m.step + m.cell / 2;
    const cy = m.pad + G.playerPos.y * m.step + m.cell / 2;

    let tx = vw / 2 - cx;
    let ty = vh / 2 - cy;
    // Целые пиксели: слой на дробном сдвиге размывает пиксель-арт.
    tx = Math.round(mapW <= vw ? (vw - mapW) / 2 : clamp(tx, vw - mapW, 0));
    ty = Math.round(mapH <= vh ? (vh - mapH) / 2 : clamp(ty, vh - mapH, 0));

    G.camera.tx = tx;
    G.camera.ty = ty;
    mapEl.style.transform = "translate(" + tx + "px," + ty + "px)";
  }

  // Насколько камера приближается в бою. Как в макете: карта вырастает
  // в полтора раза, а бойцы остаются на своих клетках под крупными портретами.
  const BATTLE_ZOOM = 1.55;

  function battleFocusPoint() {
    const b = G.battle;
    if (!b || !b.enemy || !G.playerPos) return null;
    const px = G.playerPos.x;
    const py = G.playerPos.y;
    const ex = Number.isFinite(b.enemy.x) ? b.enemy.x : px;
    const ey = Number.isFinite(b.enemy.y) ? b.enemy.y : py - 1;
    return { x: (px + ex) / 2, y: (py + ey) / 2 };
  }

  // Крупные портреты боя стоят ровно над клетками героя и врага: камера
  // масштабирует карту, поэтому экранную точку считаем той же формулой.
  function positionBattleFighters() {
    const b = G.battle;
    if (!b || !b.enemy || !G.playerPos) return;
    const box = el("battle-box");
    const scroll = el("map-scroll");
    if (!box || !scroll) return;
    const heroEl = box.querySelector(".battle-stage .fighter-hero");
    const enemyEl = box.querySelector(".battle-stage .fighter-enemy");
    if (!heroEl || !enemyEl) return;
    const m = mapMetrics();
    const rect = scroll.getBoundingClientRect();
    const z = G.camera.scale || 1;
    const left = rect.left + (scroll.clientLeft || 0);
    const top = rect.top + (scroll.clientTop || 0);
    const place = (node, x, y) => {
      const sx = left + G.camera.tx + z * (m.pad + x * m.step + m.cell / 2);
      const sy = top + G.camera.ty + z * (m.pad + y * m.step + m.cell / 2);
      node.style.left = Math.round(sx) + "px";
      node.style.top = Math.round(sy) + "px";
    };
    place(heroEl, G.playerPos.x, G.playerPos.y);
    place(enemyEl, b.enemy.x, b.enemy.y);
    // Выпад идёт в сторону противника, а не всегда вправо: монстр может
    // стоять слева, сверху или снизу.
    const hx = left + G.camera.tx + z * (m.pad + G.playerPos.x * m.step + m.cell / 2);
    const hy = top + G.camera.ty + z * (m.pad + G.playerPos.y * m.step + m.cell / 2);
    const ex = left + G.camera.tx + z * (m.pad + b.enemy.x * m.step + m.cell / 2);
    const ey = top + G.camera.ty + z * (m.pad + b.enemy.y * m.step + m.cell / 2);
    const dx = ex - hx;
    const dy = ey - hy;
    const len = Math.hypot(dx, dy) || 1;
    const lx = Math.round((dx / len) * 54);
    const ly = Math.round((dy / len) * 30);
    heroEl.style.setProperty("--lunge-x", lx + "px");
    heroEl.style.setProperty("--lunge-y", ly + "px");
    enemyEl.style.setProperty("--lunge-x", (-lx) + "px");
    enemyEl.style.setProperty("--lunge-y", (-ly) + "px");
  }

  // Вход в бой: экран игры растягивается на всё окно, камера плавно
  // подъезжает. Переход включается классом только на время боя, чтобы
  // обычная ходьба не «плыла».
  function startBattleCamera() {
    const map = el("map");
    clearTimeout(endBattleMode.timer);
    if (map) map.classList.add("battle-cam");
    measureViewport();
    updateCamera();
    requestAnimationFrame(() => {
      if (!G.battle) return;
      measureViewport();
      updateCamera();
    });
  }

  // Выход из боя и смерть возвращают обычную камеру. Класс перехода
  // снимаем после анимации, иначе карта щёлкает на место.
  function endBattleMode() {
    document.body.classList.remove("battling");
    const box = el("battle-box");
    if (box) box.classList.remove("panel-open", "battle-closing");
    const map = el("map");
    if (!map || !G.playerPos || !G.map || !G.map.w) return;
    map.classList.add("battle-cam");
    clearTimeout(endBattleMode.timer);
    endBattleMode.timer = setTimeout(() => map.classList.remove("battle-cam"), 1000);
    measureViewport();
    updateCamera();
  }

  function updateCamera() {
    setZoomCell();
    positionCamera();
    drawMinimap();
  }

  function toggleMinimap() {
    G.minimapOn = !G.minimapOn;
    const cv = el("minimap");
    if (cv) cv.classList.toggle("off", !G.minimapOn);
    if (G.minimapOn) drawMinimap();
  }

  // Статический слой мини-карты (открытые клетки) собирается в отдельный
  // canvas и перерисовывается только тогда, когда открыт новый участок.
  // На каждом шаге остаётся drawImage + несколько десятков точек.
  let miniCache = { stamp: "", canvas: null };

  // Клетки открытой части карты. Рисуются либо на запасном canvas (тогда
  // результат кэшируется), либо прямо на мини-карте — в средах без canvas.
  function paintMiniCells(ctx, w, h, cs, ox, oy) {
    const grid = G.map.grid;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!G.discovered.has(key(x, y))) continue;
        ctx.fillStyle = grid[y][x] === 1 ? "#15233c" : "#080d18";
        ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
      }
    }
  }

  function minimapBase(w, h, cw, ch, cs, ox, oy) {
    const stamp = G.floorIndex + "|" + w + "x" + h + "|" + cw + "x" + ch + "|" + G.discovered.size;
    if (miniCache.stamp === stamp && miniCache.canvas) return miniCache.canvas;
    let off = null;
    try {
      off = document.createElement("canvas");
      off.width = cw;
      off.height = ch;
      const c = typeof off.getContext === "function" ? off.getContext("2d") : null;
      if (c) paintMiniCells(c, w, h, cs, ox, oy);
      else off = null;
    } catch (err) {
      off = null;
    }
    miniCache = { stamp: stamp, canvas: off };
    return off;
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

    const base = minimapBase(w, h, cw, ch, cs, ox, oy);
    if (base) ctx.drawImage(base, 0, 0);
    else paintMiniCells(ctx, w, h, cs, ox, oy);

    // Ярким тоном — только то, что герой видит прямо сейчас.
    const vr = Math.ceil(viewRadius());
    const px = G.playerPos.x;
    const py = G.playerPos.y;
    const vx0 = Math.max(0, px - vr);
    const vx1 = Math.min(w - 1, px + vr);
    const vy0 = Math.max(0, py - vr);
    const vy1 = Math.min(h - 1, py + vr);
    ctx.fillStyle = "#24406a";
    for (let y = vy0; y <= vy1; y++) {
      for (let x = vx0; x <= vx1; x++) {
        if (grid[y][x] !== 1 || !G.visible.has(key(x, y))) continue;
        ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
      }
    }

    G.treasures.forEach((t) => {
      if (G.discovered.has(key(t.x, t.y))) dot(t.x, t.y, "#fbbf24", 0.5);
    });
    (G.traders || []).forEach((t) => {
      if (G.discovered.has(key(t.x, t.y))) dot(t.x, t.y, "#e9d5ff", 0.66);
    });
    // Ловушки на мини-карте: оранжевые ромки, сработавшие гаснут.
    (G.traps || []).forEach((t) => {
      if (G.discovered.has(key(t.x, t.y))) {
        dot(t.x, t.y, t.armed === false ? "#475569" : "#8a6a4a", 0.28);
      }
    });
    (G.lootBags || []).forEach((b) => {
      if (G.discovered.has(key(b.x, b.y))) dot(b.x, b.y, "#f2c14e", 0.8);
    });
    if (G.stairsUp && G.discovered.has(key(G.stairsUp.x, G.stairsUp.y))) {
      dot(G.stairsUp.x, G.stairsUp.y, "#34d399", 0.72);
    }
    if (G.stairsDown && G.discovered.has(key(G.stairsDown.x, G.stairsDown.y))) {
      dot(G.stairsDown.x, G.stairsDown.y, "#38bdf8", 0.72);
    }
    // Портал в деревню появляется после босса. Без метки на мини-карте его
    // приходилось искать вслепую по всему этажу — игрок видел «Спуск
    // запечатан», но не понимал, куда идти за возвратом.
    if (portalActive() && G.portal) {
      dot(G.portal.x, G.portal.y, "#e879f9", 1.05);
    }
    // НПС и двери деревни — на мини-карте: без них деревня выглядит пустой.
    (G.npcs || []).forEach((n) => {
      if (G.discovered.has(key(n.x, n.y))) dot(n.x, n.y, "#fde68a", 0.8);
    });
    // Первый спуск: страж виден на мини-карте, даже пока он вне поля зрения.
    // Без этого игрок стартует в пустой деревне и не знает, куда идти.
    if (isFirstRun() && !G.firstGoalDone) {
      const guard = (G.npcs || []).find((n) => n.key === "guard");
      if (guard) {
        dot(guard.x, guard.y, "#38bdf8", 1.15);
        const gx = ox + guard.x * cs + cs / 2;
        const gy = oy + guard.y * cs + cs / 2;
        ctx.strokeStyle = "#f6c453";
        ctx.lineWidth = 1;
        ctx.strokeRect(gx - 6, gy - 6, 12, 12);
      }
    }
    (G.doors || []).forEach((d) => {
      if (G.discovered.has(key(d.x, d.y))) dot(d.x, d.y, doorLocked(d) ? "#64748b" : "#c084fc", 0.7);
    });
    const reveal = !!equippedEffect("reveal");
    G.enemies.forEach((e) => {
      if (reveal || G.visible.has(key(e.x, e.y))) {
        dot(e.x, e.y, e.boss ? "#dc2626" : "#f87171", 0.62);
      }
    });
    dot(G.playerPos.x, G.playerPos.y, "#f6c453", 0.9);

    if (viewCache.w && viewCache.h) {
      const m = mapMetrics();
      const gx1 = (0 - G.camera.tx - m.pad) / m.step;
      const gy1 = (0 - G.camera.ty - m.pad) / m.step;
      const gx2 = (viewCache.w - G.camera.tx - m.pad) / m.step;
      const gy2 = (viewCache.h - G.camera.ty - m.pad) / m.step;
      ctx.strokeStyle = "rgba(246,196,83,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + gx1 * cs, oy + gy1 * cs, (gx2 - gx1) * cs, (gy2 - gy1) * cs);
    }
  }

  // Живые плитки: вода рябит, лава переливается, свет мигает. Кадры берём
  // из terrain.js, меняем только фон видимых плиток — иначе таймер трогал бы
  // сотни узлов на каждом тике.
  let tileFrame = 0;
  let tileTimer = null;

  function startTileAnimation() {
    if (tileTimer || typeof setInterval !== "function") return;
    // unref есть только в Node: в проверочном стенде таймер не должен
    // держать процесс живым после отчёта.
    if (typeof process !== "undefined" && tileTimer === null) {
      const probe = setInterval(() => {}, 1000);
      if (probe && typeof probe.unref === "function") probe.unref();
      clearInterval(probe);
    }
    tileTimer = setInterval(() => {
      if (!G.tileAnim || !G.tileAnim.length || document.hidden) return;
      tileFrame++;
      const theme = (G.ground || 0) % 10;
      for (const item of G.tileAnim) {
        const t = G.tileEls[item.i];
        if (!t) continue;
        const k = key(item.x, item.y);
        if (!G.visible.has(k) && !G.discovered.has(k)) continue;
        const bg = item.kind === "hazard-lava"
          ? terrainLavaCellBg(item.x, item.y, tileFrame)
          : terrainAnimBg(theme, item.x, item.y, true, item.d, tileFrame);
        if (bg) t.style.backgroundImage = bg;
      }
    }, 460);
    if (tileTimer && typeof tileTimer.unref === "function") tileTimer.unref();
  }

  // Дымка по краю зрения: центр ставим туда, где герой на карте, и она
  // работает как фонарь — дальние клетки тонут в темноте.
  function updateVignette() {
    const box = el("map-vignette");
    if (!box) return;
    const { w, h } = G.map;
    const fx = ((G.playerPos.x + 0.5) / w) * 100;
    const fy = ((G.playerPos.y + 0.5) / h) * 100;
    box.style.setProperty("--fx", fx.toFixed(2) + "%");
    box.style.setProperty("--fy", fy.toFixed(2) + "%");
  }

  // Вход на этаж: короткая вспышка света и мягкий наплыв карты.
  function flashFloorArrival() {
    const tiles = el("tiles");
    if (!tiles) return;
    tiles.classList.remove("floor-in");
    void tiles.offsetWidth;
    tiles.classList.add("floor-in");
    setTimeout(() => tiles.classList.remove("floor-in"), 700);
  }

  // Страховка от рассинхрона места. В подземелье не должно быть ни материалов
  // деревни (крыши, фасады, окна), ни её предметов (двери, дымоходы, деревья),
  // ни жителей: если что-то из этого вдруг осталось, на карте появляются чужие
  // спрайты. Пишем в консоль, что именно осталось, — по этой строке и найдём
  // место, которое их не убрало, — и чистим, чтобы игрок видел нормальную карту.
  function healPlaceState() {
    if (G.place !== "dungeon") return;
    const left = {
      материалы: !!G.mat,
      предметы: (G.scenery || []).length,
      двери: (G.doors || []).filter((d) => !d.key).length,
      жители: (G.npcs || []).length,
      стены: !!G.blocked,
      крыша: !!(G.roofKind || G.roofColor)
    };
    if (!left.материалы && !left.предметы && !left.жители && !left.стены && !left.крыша) return;
    console.warn("Рассинхрон места: в подземелье остались данные деревни", left, {
      место: G.place, этаж: G.floorIndex, кадр: G.place
    });
    G.mat = null;
    G.roofKind = null;
    G.roofColor = null;
    G.scenery = [];
    G.npcs = [];
    G.blocked = null;
  }

  function render() {
    healPlaceState();
    setZoomCell();
    computeVisibility();
    // DEV: «Открыть карту» — после расчёта видимости (иначе он затрёт набор)
    // и до отрисовки плиток, чтобы они сразу были видны.
    if (G.dev && G.dev.reveal) devRevealAll();
    renderTiles();
    // Слой объектов чиним отдельно. Плитки перерисовываются первыми, и если
    // слой объектов падает на середине, на карте остаются узлы прошлого места:
    // ученики видели деревья, жителей и двери деревни поверх карты подземелья.
    // Ловим сбой, убираем все узлы и повторяем один раз, а ошибку пишем в
    // консоль с этажом и местом — по этой строке причина видна сразу.
    try {
      renderEntities();
    } catch (err) {
      console.error("Сбой отрисовки объектов", { место: G.place, этаж: G.floorIndex }, err);
      clearEntityLayer();
      try {
        renderEntities();
      } catch (err2) {
        console.error("Слой объектов не поднялся и со второго раза, карта идёт без объектов", err2);
      }
    }
    positionCamera();
    // «Фонарь» вокруг героя — примета подземелья; в деревне он только мешает.
    if (G.place === "dungeon") updateVignette();
    drawMinimap();
    updateHud();
    if (G.dev && G.dev.panel) devRender();
  }

  // Плитки трогаем только там, где что-то могло измениться: вокруг прежней и
  // новой позиции героя и вокруг клетки подсветки пути. Полный перебор 660
  // плиток остаётся только на сборке этажа.
  let tileDirty = null;

  function markTile(x, y) {
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) return;
    if (!tileDirty) {
      tileDirty = { x0: x, y0: y, x1: x, y1: y };
      return;
    }
    if (x < tileDirty.x0) tileDirty.x0 = x;
    if (y < tileDirty.y0) tileDirty.y0 = y;
    if (x > tileDirty.x1) tileDirty.x1 = x;
    if (y > tileDirty.y1) tileDirty.y1 = y;
  }

  function markTilesAround(pos) {
    if (!pos) return;
    const r = Math.ceil(viewRadius()) + 1;
    for (let y = pos.y - r; y <= pos.y + r; y++) {
      for (let x = pos.x - r; x <= pos.x + r; x++) markTile(x, y);
    }
  }

  // С каких сторон клетка пола упирается в стену: по этим классам CSS кладёт
  // мягкую тень. Плитки идут встык, и без тени пол сливается со стеной.
  function wallEdges(x, y) {
    let s = "";
    if (wallAt(x, y - 1)) s += " edge-n";
    if (wallAt(x + 1, y)) s += " edge-e";
    if (wallAt(x, y + 1)) s += " edge-s";
    if (wallAt(x - 1, y)) s += " edge-w";
    return s;
  }

  function renderTiles() {
    const { w, h, grid } = G.map;
    const decor = G.map.decor;
    const tiles = el("tiles");
    const need = w * h;
    let rebuild = false;

    if (G.tileEls.length !== need) {
      tiles.style.gridTemplateColumns = "repeat(" + w + ", var(--cell))";
      tiles.innerHTML = "";
      G.tileEls = [];
      G.tileBg = [];
      G.tileObj = [];
      G.tileAnim = [];
      const theme = G.ground || 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const t = document.createElement("div");
          t.className = "tile unseen";
          t.dataset.x = x;
          t.dataset.y = y;
          tiles.appendChild(t);
          G.tileEls.push(t);
          const isFloor = grid[y][x] === 1;
          // Материалы деревни: крыша, фасад и окна рисуются своим набором.
          // У клетки без материала всё как в подземелье — тема этажа.
          const vmat = G.mat && G.mat[y] ? G.mat[y][x] : "";
          if (vmat) {
            G.tileObj.push("");
            G.tileBg.push(villageTileUri(vmat, G.roofKind[y][x], G.roofColor[y][x], x, y));
            continue;
          }
          const d = isFloor && decor && decor[y] ? decor[y][x] || 0 : 0;
          // Опасная лава — настоящая плитка лавы, а не плёнка поверх пола.
          const lava = isFloor && hazardAt(x, y) === "lava";
          // Предмет декора живёт отдельным слоем и приглушён (.tile.has-obj).
          const obj = isFloor && d && !lava ? terrainObjectUri(theme, x, y, d) : "";
          G.tileObj.push(obj);
          if (obj) t.style.setProperty("--obj", 'url("' + obj + '")');
          G.tileBg.push(lava ? terrainLavaCellBg(x, y, 0)
            : obj ? terrainFloorBg(theme, x, y)
            : terrainBg(theme, x, y, isFloor, d));
          // Живые плитки (вода, лава) перерисовываются таймером; свет фонаря
          // — классом lit-light, поэтому в таймер не идёт.
          const anim = isFloor && d ? terrainKind(theme, d) : "";
          if (lava) {
            G.tileAnim.push({ i: y * w + x, x: x, y: y, d: 0, kind: "hazard-lava" });
          } else if (anim === "water" || anim === "lava") {
            G.tileAnim.push({ i: y * w + x, x: x, y: y, d: d, kind: anim });
          }
        }
      }
      rebuild = true;
      startTileAnimation();
    }

    if (rebuild) {
      G.tileFocus = { x: G.playerPos.x, y: G.playerPos.y };
      G.tilePathCell = G.walkTarget ? { x: G.walkTarget.x, y: G.walkTarget.y } : null;
      tileDirty = { x0: 0, y0: 0, x1: w - 1, y1: h - 1 };
    } else {
      markTilesAround(G.tileFocus);
      markTilesAround(G.playerPos);
      G.tileFocus = { x: G.playerPos.x, y: G.playerPos.y };
      if (G.tilePathCell) markTile(G.tilePathCell.x, G.tilePathCell.y);
      if (G.walkTarget) markTile(G.walkTarget.x, G.walkTarget.y);
      G.tilePathCell = G.walkTarget ? { x: G.walkTarget.x, y: G.walkTarget.y } : null;
    }
    if (!tileDirty) return;

    const box = tileDirty;
    tileDirty = null;
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        const t = G.tileEls[y * w + x];
        const k = key(x, y);
        const seen = G.discovered.has(k);
        const isFloor = grid[y][x] === 1;
        const hz = seen && isFloor ? hazardAt(x, y) : "";
        const dcode = seen && isFloor && decor && decor[y] ? decor[y][x] || 0 : 0;
        const cls = "tile " + (seen ? (isFloor ? "floor" : "wall") + (G.visible.has(k) ? "" : " seen") : "unseen") +
          (G.walkTarget && G.walkTarget.x === x && G.walkTarget.y === y ? " walk-target" : "") +
          (hz ? " hazard-" + hz : "") +
          (seen && isFloor && dcode ? " lit-" + terrainKind((G.ground || 0) % 10, dcode) : "") +
          (seen && isFloor && G.tileObj[y * w + x] ? " has-obj" : "") +
          (seen && isFloor ? wallEdges(x, y) : "");
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

      // Пиксель-арт (спрайт или тайл) занимает клетку целиком — см. .ent-px:
      // доля клетки (0.72, 0.9) давала дробный масштаб, и спрайт «мылился».
      const klass = cls + (mapIconIsPixel(iconKey) ? " ent-px" : "");
      const bobSeed = (x * 13 + y * 7 + iconKey.length) % 11;
      node.style.setProperty("--idle-delay", (-bobSeed * 0.17).toFixed(2) + "s");
      node.style.setProperty("--idle-dur", (2.2 + (bobSeed % 4) * 0.23).toFixed(2) + "s");
      const sig = iconKey + "|" + klass + "|" + (color || "");
      if (node.dataset.sig !== sig) {
        node.dataset.sig = sig;
        node.innerHTML =
          '<span class="ent ' + klass + '"' +
          (color ? ' style="--c:' + color + '"' : "") +
          ' title="' + (title || "") + '">' + mapIcon(iconKey) + "</span>";
      }

      // Пишем в стиль только изменившееся: раньше на каждом шаге каждой
      // сущности заново ставились z-index, transform и opacity, и браузер
      // пересобирал слой карты даже когда ничего не двигалось.
      const zs = String(z || 1);
      if (node.__z !== zs) {
        node.style.zIndex = zs;
        node.__z = zs;
      }
      const tr = "translate(" + (pad + x * step) + "px," + (pad + y * step) + "px)";
      // vis — да/нет или готовая прозрачность (враг за стеной под линзой).
      const op = typeof vis === "number" ? String(vis) : vis ? "1" : "0";

      if (created) {
        node.classList.add("no-anim");
        node.style.transform = tr;
        node.style.opacity = op;
        node.__tr = tr;
        node.__op = op;
        requestAnimationFrame(() => node.classList.remove("no-anim"));
      } else {
        if (node.__tr !== tr) {
          node.style.transform = tr;
          node.__tr = tr;
        }
        if (node.__op !== op) {
          node.style.opacity = op;
          node.__op = op;
        }
      }
    };

    place("player", G.playerPos.x, G.playerPos.y, true, "player", "ent-player", null, "Герой", 6);

    // Раньше отряд делил одну клетку: рисовался только ведущий, а после его
    // смерти следующий монстр «появлялся из ниоткуда». Теперь у каждого
    // участника своя клетка и своя иконка, а метка отряда показывает,
    // что рядом идут союзники.
    // Число живых соседей по отряду считаем один раз: раньше для каждого
    // монстра проходил filter по всему списку.
    const squadAlive = new Map();
    G.enemies.forEach((e) => {
      if (!e.squadId || e.hp <= 0) return;
      squadAlive.set(e.squadId, (squadAlive.get(e.squadId) || 0) + 1);
    });

    // Линза разведчика (эффект reveal): монстры этажа видны и вне поля
    // зрения — полупрозрачными, чтобы не путать с теми, кто рядом. Раньше
    // эффект был описан у предмета, но нигде не работал.
    const reveal = !!equippedEffect("reveal");
    G.enemies.forEach((e) => {
      const cellKey = key(e.x, e.y);
      const vis = G.visible.has(cellKey) ? 1 : reveal ? 0.55 : 0;
      const mates = e.squadId ? Math.max(0, (squadAlive.get(e.squadId) || 0) - (e.hp > 0 ? 1 : 0)) : 0;
      place(
        "enemy-" + e.uid,
        e.x,
        e.y,
        vis,
        e.key,
        "ent-enemy" + (e.boss ? " boss" : "") + (e.elite ? " elite" : "") +
          (e.guard ? " guard" : "") + (mates > 0 ? " squad" : ""),
        e.color,
        (e.elite ? "Элита · " : "") + e.name + (mates > 0 ? " · отряд из " + (mates + 1) : ""),
        e.boss ? 5 : 4
      );
      // Страж лестницы отмечен щитом в углу клетки: по одному свечению его
      // не отличить от обычного врага того же вида. Щит лежит внутри клетки,
      // поэтому слой выше врага (4) и дракона (5), иначе спрайт его закрывает.
      if (e.guard) {
        place("guard-" + e.uid, e.x, e.y, vis, "guard", "ent-marker guard", "#38bdf8",
          "Страж лестницы: пока он жив, спуска нет", 6);
      }
      // Дальнобойные отмечаются отдельной меткой: игрок должен знать,
      // что этот монстр бьёт издалека и к нему нельзя подходить вплотную.
      if (!(e.range > 1)) return;
      place(
        "sniper-" + e.uid,
        e.x,
        e.y,
        vis,
        "sniper",
        "ent-marker ranged",
        "#f472b6",
        "Бьёт с расстояния",
        3
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

    // НПС деревни: страж у входа, торговец, староста и наставник в домах.
    // У каждого свой спрайт — сборка делает четыре разных кафтана из одного
    // набора, иначе жители различались бы только подписью.
    (G.npcs || []).forEach((n) => {
      const vis = G.visible.has(key(n.x, n.y));
      const own = "npc_" + n.key;
      const sprite = (typeof SPRITES !== "undefined" && SPRITES[own]) ? own : "trader";
      // Первому игроку подсвечиваем стража: именно с него начинается спуск,
      // но в деревне его легко потерять среди жителей.
      const cls = "ent-npc" + (n.key === "guard" && isFirstRun() ? " first-goal" : "");
      place("npc-" + n.uid, n.x, n.y, vis, sprite, cls, null, n.name, 4);
    });

    // Двор деревни: деревья, забор, колодец и костёр.
    (G.scenery || []).forEach((o) => {
      const vis = G.visible.has(key(o.x, o.y));
      place("prop-" + o.x + "-" + o.y, o.x, o.y, vis, PROP_ICONS[o.kind] || o.kind,
        "ent-prop ent-prop-" + o.kind, null, PROP_NAMES[o.kind] || "", 2);
    });

    // Тайник: дверь в монолите, жилы, рычаги и таблички.
    (G.vaults || []).forEach((v) => {
      const vis = G.visible.has(key(v.door.x, v.door.y));
      place("vault-" + v.uid, v.door.x, v.door.y, vis,
        v.locked ? "doorLocked" : "door", "ent-vault" + (v.locked ? " locked" : ""), null,
        v.locked ? "Запертый тайник — ключ у стража лестницы" : "Открытый тайник", 2);
    });
    (G.nodes || []).forEach((n) => {
      if (n.taken) return;
      const vis = G.visible.has(key(n.x, n.y));
      place("node-" + n.uid, n.x, n.y, vis,
        n.kind === "wood" ? "woodpile" : n.kind === "shard" ? "rubble" : "ore",
        "ent-node ent-node-" + n.kind, null, "Залежи " + (LOOT_NAMES[n.kind] || ""), 2);
    });
    (G.levers || []).forEach((l) => {
      const vis = G.visible.has(key(l.x, l.y));
      place("lever-" + l.uid, l.x, l.y, vis, "lever",
        "ent-lever" + (l.used ? " spent" : ""), null, "Рычаг", 2);
    });
    (G.signs || []).forEach((sgn) => {
      const vis = G.visible.has(key(sgn.x, sgn.y));
      place("sign-" + sgn.uid, sgn.x, sgn.y, vis, "sign", "ent-sign", null, "Табличка", 2);
    });
    if (portalActive()) {
      const vis = G.visible.has(key(G.portal.x, G.portal.y));
      place("village-portal", G.portal.x, G.portal.y, vis, "portal",
        "ent-portal", null, "Портал в деревню", 2);
    }

    // Костры-привалы: пока не прогорели — горят.
    (G.camps || []).forEach((c) => {
      const vis = G.visible.has(key(c.x, c.y));
      place("camp-" + c.uid, c.x, c.y, vis, c.used ? "campfireSpent" : "campfire",
        "ent-camp" + (c.used ? " spent" : ""), null,
        c.used ? "Прогоревший костёр" : "Костёр-привал", 2);
    });

    // Двери домов: вход с улицы и выход из комнаты.
    (G.doors || []).forEach((d) => {
      const vis = G.visible.has(key(d.x, d.y));
      place("door-" + d.x + "-" + d.y, d.x, d.y, vis, doorLocked(d) ? "doorLocked" : "door",
        "ent-door" + (d.exit ? " ent-door-exit" : ""), null,
        doorLocked(d) ? "Дверь заперта" : (d.exit ? "Выйти на улицу" : "Дверь дома"), 2);
    });

    (G.traps || []).forEach((t) => {
      const vis = G.visible.has(key(t.x, t.y));
      const type = trapByKey(t.kind);
      const armed = t.armed !== false;
      place(
        "trap-" + t.uid,
        t.x,
        t.y,
        vis,
        type ? type.icon : "spikes",
        "ent-trap" + (armed ? "" : " spent"),
        type && type.damage ? "#f87171" : "#fbbf24",
        armed ? "" : (type ? type.name : "Ловушка"),
        1
      );
    });

    (G.lootBags || []).forEach((b) => {
      const vis = G.visible.has(key(b.x, b.y));
      place(
        "loot-" + b.uid,
        b.x,
        b.y,
        vis,
        "lootBag",
        "ent-bag",
        null,
        "Мешочек с добычей",
        2
      );
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

    if (G.stairsDown) {
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
    }

    G.entityEls.forEach((node, id) => {
      if (!alive.has(id)) {
        G.entityEls.delete(id);
        node.__fading = true;
        node.style.opacity = "0";
        setTimeout(() => node.remove(), 260);
      }
    });

    // Страховка: если слой и карта всё-таки разошлись, лишние узлы иначе
    // копились бы навсегда. Гаснущие узлы не трогаем — у них свой таймер.
    const tracked = new Set(G.entityEls.values());
    Array.from(layer.children).forEach((child) => {
      if (!tracked.has(child) && !child.__fading) child.remove();
    });

    // Кнопка действия следует за героем: подошёл к сундуку или лестнице —
    // она появилась, отошёл — исчезла.
    updateActionButton();
  }

  // Цифры постоянного HUD. В подземелье это текущий поход, в деревне — тот
  // герой, который выйдет в следующий: здоровье с колодцем, сила с кузницей,
  // золото из банка. Иначе в деревне на виду оставались бы «1 / 1» и ноль.
  function heroHudStats() {
    const p = G.player;
    if (G.place === "dungeon" && G.running && p) {
      return {
        level: p.level,
        hp: p.hp,
        maxHp: p.maxHp,
        xp: p.xp,
        xpNext: p.xpNext,
        gold: p.gold || 0,
        dmg: Math.round(p.dmgBase + p.atkBonus),
        def: Math.round(p.defBonus || 0),
        name: G.nick || G.name || "Герой",
        place: placeName()
      };
    }
    const prof = hubProfile();
    const prog = progressBonus();
    const maxHp = 120 + prog.hp;
    return {
      level: 1,
      hp: maxHp,
      maxHp: maxHp,
      xp: 0,
      xpNext: XP_BASE,
      gold: prof ? (prof.wallet.gold || 0) : 0,
      dmg: 12 + prog.dmg,
      def: 0,
      name: G.nick || G.name || accountName() || "Герой",
      place: placeName()
    };
  }

  function updateHud() {
    const p = G.player;
    const hs = heroHudStats();
    const hpPct = Math.round((hs.hp / hs.maxHp) * 100);
    const hpBar = el("player-hp").parentElement;
    const liveHud = el("hero-hud");

    // Всё, что не менялось с прошлого кадра, не переписываем: иначе браузер
    // на каждом шаге заново размечал панель подземелья.
    // Цель квеста и глава входят в подпись: без них строки не перерисовались
    // бы после постройки, сдачи задания и перехода сюжета.
    const quest = questLine();
    const story = storyHudData();
    const sig = hs.hp + "|" + hs.maxHp + "|" + hs.level + "|" + hs.xp + "|" + hs.xpNext + "|" +
      hs.gold + "|" + hs.dmg + "|" + hs.def + "|" + hs.name + "|" + hs.place + "|" +
      G.floorIndex + "|" + G.enemies.length + "|" + G.place + "|" + (G.houseKey || "") + "|" +
      quest + "|" + story.kicker + "|" + story.title + "|" + story.ready + "|" + story.done;
    if (G.hudSig !== sig) {
      G.hudSig = sig;
      el("player-hp").style.width = hpPct + "%";
      hpBar.classList.toggle("low", hs.hp / hs.maxHp < 0.3);
      el("player-hp-text").textContent = hs.hp + " / " + hs.maxHp;
      el("player-level").textContent = hs.level;
      const xpPct = Math.round((hs.xp / hs.xpNext) * 100);
      el("player-xp").style.width = clamp(xpPct, 0, 100) + "%";
      el("player-xp-text").textContent = hs.xp + " / " + hs.xpNext + " очков";
      el("floor-name").textContent = placeName();
      const nickEl = el("hud-nick");
      if (nickEl) nickEl.textContent = "Герой: " + (hs.name || "—");
      el("enemies-left").textContent = G.place === "dungeon"
        ? "Монстров: " + G.enemies.length
        : "Монстров: —";
      const questEl = el("quest-line");
      if (questEl) {
        questEl.textContent = quest;
        questEl.classList.toggle("hidden", !quest);
      }
      el("gold-text").textContent = hs.gold;

      // Постоянная сводка поверх карты.
      const set = (id, value) => {
        const node = el(id);
        if (node) node.textContent = value;
      };
      set("hud-level", hs.level);
      set("hud-name", hs.name);
      set("hud-gold", hs.gold);
      set("hud-hp-text", hs.hp + "/" + hs.maxHp);
      set("hud-xp-text", hs.xp + "/" + hs.xpNext);
      set("hud-dmg", hs.dmg);
      set("hud-def", hs.def);
      set("hud-place", hs.place);
      set("hud-story-kicker", story.kicker);
      set("hud-story-title", story.title);
      const hudHp = el("hud-hp");
      if (hudHp) hudHp.style.width = clamp(hpPct, 0, 100) + "%";
      const hudXp = el("hud-xp");
      if (hudXp) hudXp.style.width = clamp(xpPct, 0, 100) + "%";
      if (liveHud) liveHud.classList.toggle("is-low", hs.hp / hs.maxHp < 0.3);
      const storyBtn = el("hud-story");
      if (storyBtn) {
        storyBtn.classList.toggle("is-ready", story.ready);
        storyBtn.classList.toggle("is-done", story.done);
      }
      updateEquipBar();
      updateForgeHint();
    }
    refreshInventoryStats();
    refreshStatsPanel();

    // Вспышка урона и лечения — отдельно от подписи: она нужна ровно в тот
    // момент, когда здоровье изменилось.
    if (p && p._lastHp != null && p.hp !== p._lastHp) {
      const flash = p.hp < p._lastHp ? "hurt" : "heal";
      hpBar.classList.remove("hurt", "heal");
      void hpBar.offsetWidth;
      hpBar.classList.add(flash);
      clearTimeout(hpBar._flashTimer);
      hpBar._flashTimer = setTimeout(() => hpBar.classList.remove(flash), 520);
    }
    if (p) p._lastHp = p.hp;

    scheduleSave();
  }

  function refreshStatsPanel() {
    const box = el("stats-combat");
    if (!box) return;
    const hs = heroHudStats();
    const inRun = G.place === "dungeon" && G.running;
    const prof = hubProfile();
    const wallet = (prof && prof.wallet) || {};
    const potions = inRun && typeof countPotions === "function"
      ? countPotions()
      : (wallet.small_potion || 0) + (wallet.big_potion || 0);
    const charges = inRun && G.ability ? (G.ability.left || 0) : abilityCharges();
    box.innerHTML =
      "<span>Урон <b>" + hs.dmg + "</b></span>" +
      "<span>Защита <b>" + hs.def + "</b></span>" +
      "<span>Зелий <b>" + potions + "</b></span>" +
      "<span>Заряды <b>" + charges + "</b></span>";
  }

  function equippedEffect(kind) {
    if (!G.equipment) return null;
    for (const slot in G.equipment) {
      const it = G.equipment[slot];
      if (it && it.effect && it.effect.kind === kind) return it.effect;
    }
    return null;
  }

  // Когда эффект реально срабатывает, игрок должен это увидеть: одна
  // всплывающая строка в бою и запись в журнал. Без этого невозможно
  // понять, откуда взялось лечение или почему удар оказался сильнее.
  function effectFlash(text) {
    const box = el("effect-flash");
    if (!box) return;
    box.textContent = text;
    box.classList.remove("show");
    // Перезапуск анимации: без reflow повторный клик не перезапустит её.
    void box.offsetWidth;
    box.classList.add("show");
  }

  // Тексты эффектов для панели: коротко и по-русски, чтобы читалось с ходу.
  const EFFECT_HINTS = {
    lifesteal: "лечит тебя частью нанесённого урона",
    crit: "иногда наносит двойной урон",
    block: "гасит первые атаки врага",
    thorns: "добавляет урон к твоему верному удару",
    hintFree: "подсказки не тратят здоровье",
    goldBonus: "даёт больше золота за ответы",
    poisonImmune: "яд врага на тебя не действует",
    reveal: "враги видны на всём этаже",
    execute: "добивает раненых врагов",
    cleanse: "зелье смывает яд",
    fullHeal: "зелье лечит полностью",
    antidote: "зелье снимает яд"
  };

  // Числа эффекта для панели: процент, заряды, шанс. Фраза уже стоит слева
  // строкой из EFFECT_HINTS, а справа раньше выводился effectText() — та же
  // фраза другими словами: «враги видны на всём этаже · Все враги видны на этаже».
  function effectNumbers(effect) {
    const parts = [];
    if (effect.pct) parts.push(effect.pct + "%");
    if (effect.charges) parts.push("×" + effect.charges);
    if (effect.chance) parts.push("шанс " + Math.round(effect.chance * 100) + "%");
    return parts.join(" · ");
  }

  // Строки комплектов: сколько вещей семьи надето и что она даёт.
  function setEffectRows() {
    const counts = setCounts();
    return Object.keys(counts).map((key) => {
      const def = setByKey(key);
      const n = counts[key];
      const bonus = setBonusFor(key, n);
      const full = n >= 3;
      const text = full ? def.threeText
        : n === 2 ? def.twoText + " · до полного набора ещё 1 вещь"
        : "надень ещё 1 вещь семьи — " + def.twoText;
      return (
        '<div class="effect-row set-row' + (full ? " full" : "") + '" data-set="' + key + '">' +
        '<span class="effect-dot set-dot" style="background:' + def.color + '"></span>' +
        '<span class="effect-text">' + def.name + " " + n + "/3</span>" +
        '<span class="effect-num">' + (bonus ? text : "…") + "</span>" +
        "</div>"
      );
    }).join("");
  }

  // Список эффектов снаряжения. Пишет туда, куда скажут: в бою он живёт
  // внизу боевой карточки, а на карте — в боковой панели.
  function renderEffectList(node) {
    const box = node || el("effect-list");
    if (!box) return;
    const active = [];
    for (const slot of ["weapon", "armor", "accessory"]) {
      const it = G.equipment && G.equipment[slot];
      if (it && it.effect) active.push({ item: it, effect: it.effect });
    }
    const setRows = setEffectRows();
    if (!active.length && !setRows) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML =
      '<div class="effect-title">' + (active.length ? "Особые эффекты" : "Комплекты") + "</div>" +
      active.map(({ item, effect }) => {
        const hint = EFFECT_HINTS[effect.kind] || effect.kind;
        const detail = effectText(item);
        const nums = effectNumbers(effect);
        return (
          '<div class="effect-row" data-effect="' + effect.kind + '" data-tip="' +
          tipAttr("От «" + item.name + "». " + (item.desc || detail || hint)) +
          '">' +
          '<span class="effect-dot ' + effect.kind + '"></span>' +
          '<span class="effect-text">' + hint + "</span>" +
          (nums ? '<span class="effect-num">' + nums + "</span>" : "") +
          "</div>"
        );
      }).join("") +
      // Без особых эффектов заголовок «Комплекты» уже стоит первой строкой.
      (setRows ? (active.length ? '<div class="effect-title set-title">Комплекты</div>' : "") + setRows : "");
  }

  function addGold(n) {
    const bonus = equippedEffect("goldBonus");
    // Доля от предметов и доля от постоянного улучшения «Добыча» складываются:
    // обе — про одно и то же, и обе действуют в каждом походе.
    const pct = (bonus && bonus.pct ? bonus.pct : 0) + setBonusTotal("gold");
    const hero = progOf("loot");
    let total = n;
    if ((pct > 0 || hero > 0) && n > 0) {
      const before = total;
      total = Math.round(n * (1 + pct / 100 + hero));
      if (total > before) effectFlash("Награда · +" + (total - before) + " золота");
    }
    G.player.gold = (G.player.gold || 0) + total;
    G.stats.goldEarned = (G.stats.goldEarned || 0) + total;
    updateHud();
    return total - n;
  }

  // Цены зелий — один список и для лавки, и для выкупа. Раньше те же числа
  // лежали ещё в POTION_PRICE, и правка одного места оставляла второе врать.
  // from — с какого этажа товар появляется в лавке.
  const SHOP_WARES = [
    { id: "small_potion", price: 20, from: 0 },
    { id: "big_potion", price: 45, from: 1 },
    { id: "antidote", price: 30, from: 2 },
    { id: "elixir", price: 120, from: 2 },
    { id: "purifying_draught", price: 90, from: 4 },
    { id: "greater_elixir", price: 200, from: 5 }
  ];
  let SHOP_MARKUP = 1.5;
  // Во сколько раз покупка дороже ценности вещи. Выкуп — ECON.sellRate (0.5),
  // поэтому цена не может быть ниже 1 / sellRate: иначе лавка печатает золото.
  const GEAR_BUY_RATE = 1.6;
  const SHOP_SLOTS = ["weapon", "armor", "accessory"];

  // Наценка и выкуп в процентах — для подписей в лавке. Числа берутся из тех же
  // настроек, что правит учитель в админке, поэтому подпись не врёт.
  function markupPercent() {
    return Math.round((SHOP_MARKUP - 1) * 100);
  }

  function sellPercent() {
    return Math.round(ECON.sellRate * 100);
  }

  function warePrice(w) {
    const base = Math.ceil(w.price * depthMul(ECON.priceDepth));
    return G.shopTrader ? base : Math.ceil(base * SHOP_MARKUP);
  }

  // Наценка лавки на любую цену: у торговца на этаже её нет.
  function markedPrice(base) {
    return Math.max(1, G.shopTrader ? base : Math.ceil(base * SHOP_MARKUP));
  }

  // Цена конкретной вещи — от её редкости и этажа, а не от вида товара.
  function gearPrice(item) {
    return markedPrice(Math.ceil(itemBaseValue(item) * GEAR_BUY_RATE));
  }

  // ---------- Товар этажа ----------
  // Лавка больше не продаёт «случайное оружие» вслепую: на каждом этаже лежит
  // по одной конкретной вещи в каждый слот, с именем, статами и сравнением с
  // надетым. Набор подобран по имени героя и номеру этажа, поэтому закрыть и
  // открыть лавку заново, чтобы «перебросить» товар, не получится.
  function shopHash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Простой счётчик случайных чисел с зерном: один и тот же этаж всегда
  // получает один и тот же товар.
  function shopRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Взвешенный выбор из пула: то же правило, что у добычи с монстров.
  function pickWeighted(pool, weights, roll) {
    const total = weights.reduce((a, b) => a + b, 0);
    if (!(total > 0)) return pool[Math.floor(roll * pool.length)] || null;
    let left = roll * total;
    for (let i = 0; i < pool.length; i++) {
      left -= weights[i];
      if (left <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function pickShopGear(floor, slot, roll) {
    const pool = itemsForFloor(floor, slot);
    if (!pool.length) return null;
    const weights = pool.map((i) => itemWeightFor(i, floor));
    const item = pickWeighted(pool, weights, roll);
    return item ? Object.assign({}, item) : null;
  }

  function shopStock() {
    const floor = Math.max(0, G.floorIndex || 0);
    if (G.shopStock && G.shopStock.floor === floor) return G.shopStock;
    const seed = (G.name || "герой") + ":" + floor;
    const gear = {};
    SHOP_SLOTS.forEach((slot) => {
      gear[slot] = pickShopGear(floor, slot, shopRandom(shopHash(seed + ":" + slot)));
    });
    G.shopStock = { floor: floor, gear: gear };
    return G.shopStock;
  }

  // Зелья, доступные на этом этаже.
  function shopPotions() {
    const floor = Math.max(0, G.floorIndex || 0);
    return SHOP_WARES.filter((w) => floor >= (w.from || 0));
  }

  // Шансы ящика наугад: слот равновероятно, вещь — по весу внутри слота.
  // Считается по тем же весам, что и настоящий розыгрыш, иначе подпись врала бы.
  function shopBoxOdds(floor) {
    const byRarity = {};
    let ev = 0;
    SHOP_SLOTS.forEach((slot) => {
      const pool = itemsForFloor(floor, slot);
      if (!pool.length) return;
      const weights = pool.map((i) => itemWeightFor(i, floor));
      const total = weights.reduce((a, b) => a + b, 0) || 1;
      pool.forEach((item, i) => {
        const p = weights[i] / total / SHOP_SLOTS.length;
        byRarity[item.rarity] = (byRarity[item.rarity] || 0) + p;
        ev += p * itemBaseValue(item);
      });
    });
    return { byRarity: byRarity, ev: ev };
  }

  // Ящик стоит столько же, сколько стоила бы вещь средней ценности этого этажа:
  // та же наценка, что и у выбранной вещи, но предмет случайный.
  function boxPrice(floor) {
    return markedPrice(Math.ceil(shopBoxOdds(floor).ev * GEAR_BUY_RATE));
  }

  function shopBoxRoll(floor) {
    const slots = SHOP_SLOTS.filter((s) => itemsForFloor(floor, s).length);
    if (!slots.length) return null;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    return pickShopGear(floor, slot, Math.random());
  }

  // Всё, что лежит в лавке сейчас: один список и для отрисовки, и для покупки.
  function shopOffers() {
    const floor = Math.max(0, G.floorIndex || 0);
    const stock = shopStock();
    const list = [];
    shopPotions().forEach((w) => {
      const item = itemById(w.id);
      if (item) list.push({ kind: "potion", item: item, price: warePrice(w) });
    });
    SHOP_SLOTS.forEach((slot) => {
      const item = stock.gear[slot];
      if (item) list.push({ kind: "gear", item: item, price: gearPrice(item) });
    });
    list.push({ kind: "box", price: boxPrice(floor), odds: shopBoxOdds(floor) });
    return list;
  }

  function openShop(fromTrader) {
    if (!G.running) return;
    cancelWalk();
    G.shopTrader = !!fromTrader;
    renderShop();
    el("shop-overlay").classList.remove("hidden");
  }

  function closeShop() {
    el("shop-overlay").classList.add("hidden");
  }

  // Кнопка покупки: если золота не хватает, она гаснет и говорит об этом — как
  // в кузнице, а не всплывашкой после нажатия.
  function buyButton(index, price) {
    const can = G.player.gold >= price;
    return "<button class='btn" + (can ? " primary" : " ghost") + "' data-buy='" + index +
      "' data-tip=\"" + (can ? "Списать " + price + " золота и положить вещь в сумку."
        : "Не хватает " + (price - G.player.gold) +
          " золота. Продай лишнее или поищи золото на этаже.") + "\">" +
      (can ? "Купить" : "Мало золота") + "</button>";
  }

  // Снаряжение можно надеть сразу: вторая кнопка рядом с покупкой.
  function buyActions(index, price, withEquip) {
    const can = G.player.gold >= price;
    let out = buyButton(index, price);
    if (can && withEquip) {
      out += "<button class='btn purple' data-buy-equip='" + index +
        "' data-tip=\"Оплатить и сразу надеть — сравнение с надетым уже учтено.\">" +
        "Купить и надеть</button>";
    }
    return "<div class='inv-actions shop-buy-actions'>" + out + "</div>";
  }

  // Подсказка на кнопке продажи: цена без сравнения с надетым ничего не решает.
  function worthSellingTip(item, val) {
    const cmp = itemComparePlain(item);
    return "Получить " + val + " золота за «" + item.name + "»." +
      (cmp ? " Против надетого: " + cmp + "." : "") +
      (item.slot === "potion" ? "" : " Выкуп " + sellPercent() + "% цены — откупить назад дороже.");
  }

  // Карточка товара — та же, что в сумке: редкость, статы, эффект, комплект,
  // сравнение с надетым, описание, плюс цена. Выбирать вслепую не нужно.
  function shopCard(item, price, index, withEquip, extra) {
    const rar = RARITY[item.rarity];
    return "<div class='inv-item' style='border-left-color:" + rar.color + "'>" +
      "<div class='info'><b>" + itemPic(item, rar.color) +
      item.name + "</b>" +
      "<span>" + rar.name + " · " + itemBonusText(item) + " · цена <b>" + price + "</b></span>" +
      (item.effect ? "<span class='item-effect'>✦ " + effectText(item) + "</span>" : "") +
      (item.slot === "potion" ? "" : setLineFor(item) + itemCompareText(item)) +
      (item.desc ? "<span class='item-desc'>" + item.desc + "</span>" : "") +
      (extra ? "<span class='item-desc'>" + extra + "</span>" : "") +
      "</div>" + buyActions(index, price, withEquip) + "</div>";
  }

  function renderShop() {
    const box = el("shop-box");
    if (!box) return;
    const trader = !!G.shopTrader;
    const floor = Math.max(0, G.floorIndex || 0);
    const offers = shopOffers();
    const mark = markupPercent();
    const p = G.player;
    let html = "<div class='battle-head'><div><div class='enemy-name'>" +
      (trader ? "⚖ Торговец" : "Лавка") + "</div>" +
      "<div class='hud-num'>Золото: <b>" + p.gold + "</b></div></div>" +
      "<button class='exit-btn' id='shop-close' type='button' data-tip=\"Закрыть лавку. Клавиша Escape.\">Закрыть</button></div>";
    // Что у героя сейчас: без этих чисел непонятно, нужна ли замена.
    html += "<div class='inv-stats shop-stats'>" +
      "<span>Урон: <b>" + (p.dmgBase + p.atkBonus) + "</b></span>" +
      "<span>Защита: <b>" + p.defBonus + "</b></span>" +
      "<span>Здоровье: <b>" + p.hp + " / " + p.maxHp + "</b></span>" +
      "<span>Сумка: <b>" + G.inventory.filter((it) => it.slot !== "potion").length +
      "</b> вещей · зелий <b>" + countPotions() + "</b></span></div>";
    html += "<div class='shop-note'>" + (trader || mark <= 0
      ? "Наценки нет — цены как у торговца на этаже."
      : "Наценка лавки +" + mark + "% — у торговца на этаже дешевле, найди его!") + "</div>";

    // Две колонки на широком экране: слева товар, справа продажа. На узком
    // экране колонки складываются в одну (см. .shop-cols в game.css).
    // Прокручивается середина: иначе список товара обрезался бы потолком
    // карточки, и «Продать» просто не было видно.
    html += "<div class='battle-mid'><div class='shop-cols'>";
    html += "<div class='shop-col shop-buy'>";

    html += "<div class='inv-section'><h3>Зелья</h3>";
    offers.forEach((o, i) => {
      if (o.kind !== "potion") return;
      const have = G.inventory.filter((it) => it.id === o.item.id).length;
      html += shopCard(o.item, o.price, i, false, "В сумке: " + have);
    });
    html += "</div>";

    html += "<div class='inv-section'><h3>Снаряжение этажа " + (floor + 1) + "</h3>";
    offers.forEach((o, i) => {
      if (o.kind === "gear") html += shopCard(o.item, o.price, i, true);
    });
    html += "</div>";

    offers.forEach((o, i) => {
      if (o.kind !== "box") return;
      // Редкости по убыванию шанса: игрок должен видеть, на что идёт.
      const odds = Object.keys(o.odds.byRarity)
        .sort((a, b) => o.odds.byRarity[b] - o.odds.byRarity[a])
        .map((r) => "<span style='color:" + RARITY[r].color + "'>" + RARITY[r].name + " " +
          Math.round(o.odds.byRarity[r] * 100) + "%</span>")
        .join(" · ");
      html += "<div class='inv-section'><h3>Ящик наугад</h3>" +
        "<div class='inv-item'><div class='info'><b>🎁 Ящик этажа " + (floor + 1) + "</b>" +
        "<span>Одна случайная вещь: оружие, броня или амулет · цена <b>" + o.price + "</b></span>" +
        "<span class='item-desc'>Шансы: " + odds + "</span>" +
        "<span class='item-desc'>Слот выбирается наугад, вещь — по весу: " +
        "может достаться лучше надетого, может хуже.</span></div>" +
        buyActions(i, o.price, false) + "</div></div>";
    });
    html += "</div>";  // shop-buy

    // Продажа. Обычный хлам продаётся пачкой: щёлкать двадцать раз по одному
    // предмету — не торговля, а работа.
    const junk = G.inventory.filter((it) => it.slot !== "potion" && it.rarity === "common");
    const junkGold = junk.reduce((sum, it) => sum + itemSellValue(it), 0);
    html += "<div class='shop-col shop-sell'>";
    html += "<div class='inv-section'><h3>Продать (выкуп " + sellPercent() + "%)</h3>";
    if (junk.length > 1) {
      html += "<div class='inv-item'><div class='info'><b>Обычное снаряжение</b>" +
        "<span>" + junk.length + " шт. в сумке · выкуп " + junkGold + " золота</span>" +
        "<span class='item-desc'>Продаются сразу все обычные вещи. Зелья и вещи получше остаются.</span>" +
        "</div><div class='inv-actions'><button class='btn' id='shop-sell-common' data-tip=\"" +
        "Продать сразу все обычные вещи: " + junk.length + " шт. за " + junkGold +
        " золота. Зелья и вещи получше остаются в сумке.\">" +
        "Продать всё</button></div></div>";
    }
    if (G.inventory.length === 0) {
      html += "<div class='inv-empty'>Сумка пуста.</div>";
    } else {
      G.inventory.forEach((item, i) => {
        const val = itemSellValue(item);
        html += "<div class='inv-item' style='border-left-color:" + RARITY[item.rarity].color + "'>" +
          "<div class='info'><b>" +
          itemPic(item, RARITY[item.rarity].color) + item.name + "</b>" +
          "<span>" + RARITY[item.rarity].name + " · " + itemBonusText(item) + "</span>" +
          (item.effect ? "<span class='item-effect'>✦ " + effectText(item) + "</span>" : "") +
          setLineFor(item) + (item.slot === "potion" ? "" : itemCompareText(item)) +
          "</div><div class='inv-actions'><button class='btn' data-sell='" + i + "' data-tip=\"" +
          tipAttr(worthSellingTip(item, val)) + "\">Продать +" + val + "</button></div></div>";
      });
    }
    html += "</div></div></div></div>";  // отдел продажи, колонки, середина
    html += "<div class='battle-foot'><span class='foot-note'>Цены этого этажа</span>" +
      "<span class='win-chip'>Esc — закрыть</span></div>";

    box.innerHTML = html;
    el("shop-close").addEventListener("click", closeShop);
    box.querySelectorAll("button[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => buyItem(Number(btn.dataset.buy), false));
    });
    box.querySelectorAll("button[data-buy-equip]").forEach((btn) => {
      btn.addEventListener("click", () => buyItem(Number(btn.dataset.buyEquip), true));
    });
    box.querySelectorAll("button[data-sell]").forEach((btn) => {
      btn.addEventListener("click", () => sellItem(Number(btn.dataset.sell)));
    });
    const sellAll = el("shop-sell-common");
    if (sellAll) sellAll.addEventListener("click", quickSellCommon);
  }

  function buyItem(i, equip) {
    const offer = shopOffers()[i];
    if (!offer) return;
    if (G.player.gold < offer.price) {
      toast("Не хватает золота");
      return;
    }
    const item = offer.kind === "box"
      ? shopBoxRoll(Math.max(0, G.floorIndex || 0))
      : Object.assign({}, offer.item);
    if (!item) {
      toast("Товара нет");
      return;
    }
    G.player.gold -= offer.price;
    // Сравнение считаем до того, как вещь надета: иначе она сравнивалась бы сама с собой.
    const cmp = itemComparePlain(item);
    addItem(item, { quiet: true });
    const worn = !!equip && item.slot !== "potion";
    // «Купить и надеть»: addItem положил вещь в конец сумки — надеваем её сразу.
    if (worn) equipItem(G.inventory.length - 1);
    const what = item.slot === "potion" ? "" : (cmp || "не лучше надетого");
    toast("Куплено: " + item.name + " · −" + offer.price + " золота" + (worn ? " · надето" : ""));
    log("Куплено: «" + item.name + "» (" + RARITY[item.rarity].name + ") за " + offer.price +
      " золота" + (what ? " · " + what : "") + (worn ? " · надето сразу" : "") + ".", "loot");
    updateHud();
    renderShop();
    if (G.battle) renderBattle();
  }

  // Сколько золота вернёт пачка обычного снаряжения.
  function quickSellCommon() {
    const keep = [];
    let gold = 0;
    let count = 0;
    G.inventory.forEach((item) => {
      if (item.slot !== "potion" && item.rarity === "common") {
        gold += itemSellValue(item);
        count += 1;
        return;
      }
      keep.push(item);
    });
    if (!count) {
      toast("Обычного снаряжения в сумке нет");
      return;
    }
    G.inventory = keep;
    G.player.gold += gold;
    toast("Продано " + count + " шт. · +" + gold + " золота");
    log("Ты продал " + count + " обычных вещей за " + gold + " золота.", "loot");
    updateHud();
    renderInventory();
    renderShop();
    if (G.battle) renderBattle();
  }

  // Цены зелий для выкупа — из того же списка лавки, чтобы числа не расходились.
  const POTION_PRICE = {};
  SHOP_WARES.forEach((w) => { POTION_PRICE[w.id] = w.price; });
  const RARITY_VALUE = { common: 25, uncommon: 50, rare: 90, epic: 150 };

  // Насколько глубина поднимает цену или награду: 1 + rate × этаж.
  function depthMul(rate) {
    return 1 + rate * Math.max(0, G.floorIndex || 0);
  }

  // ---------- Кузница ----------
  // Три дорожки улучшений. Цена растёт в геометрической прогрессии, поэтому
  // золото всегда есть куда девать, даже в бесконечном спуске.
  const FORGE_TRACKS = [
    { key: "weapon", name: "Заточка оружия", icon: "⚔", text: "+" + ECON.forgeAtk + " к урону" },
    { key: "armor", name: "Укрепление брони", icon: "🛡", text: "+" + ECON.forgeDef + " к защите" },
    { key: "vitality", name: "Закалка тела", icon: "❤", text: "+" + ECON.forgeHp + " к здоровью" }
  ];

  function forgeLevel(key) {
    return (G.forge && G.forge[key]) || 0;
  }

  function forgeCost(key) {
    return Math.round(ECON.forgeBase * Math.pow(ECON.forgeStep, forgeLevel(key)) *
      depthMul(ECON.forgeDepth));
  }

  // Кузница — главная трата золота, но вход в неё легко потерять: бот, по
  // которому мерили баланс, туда не ходил вовсе и копил к концу похода
  // тысячи. Когда золота хватает на улучшение, об этом один раз за поход
  // пишет журнал.
  const FORGE_TIP = "Кузница: вложить золото в урон, защиту или здоровье.";

  function forgeReady() {
    if (!G.running || !G.player) return false;
    const cheapest = Math.min.apply(null, FORGE_TRACKS.map((t) => forgeCost(t.key)));
    return (G.player.gold || 0) >= cheapest;
  }

  function updateForgeHint() {
    const btn = el("forge-btn");
    if (!btn) return;
    const ready = forgeReady();
    if (ready) btn.setAttribute("data-ready", "+");
    else btn.removeAttribute("data-ready");
    btn.setAttribute("data-tip", ready ? FORGE_TIP + " Золота хватает на улучшение." : FORGE_TIP);
    if (ready && G.stats && !G.stats.forgeHinted) {
      G.stats.forgeHinted = true;
      log("Золота хватает на улучшение в кузнице.", "loot");
    }
  }

  function forgeBonus(key) {
    const lvl = forgeLevel(key);
    if (key === "weapon") return lvl * ECON.forgeAtk;
    if (key === "armor") return lvl * ECON.forgeDef;
    if (key === "vitality") return lvl * ECON.forgeHp;
    return 0;
  }

  function openForge() {
    if (!G.running || G.battle) return;
    cancelWalk();
    renderForge();
    el("forge-overlay").classList.remove("hidden");
  }

  function closeForge() {
    el("forge-overlay").classList.add("hidden");
  }

  function renderForge() {
    const box = el("forge-box");
    if (!box) return;
    let html = "<div class='battle-head'><div><div class='enemy-name'>⚒ Кузница</div>" +
      "<div class='hud-num'>Золото: <b>" + G.player.gold + "</b></div></div>" +
      "<button class='exit-btn' id='forge-close' type='button' data-tip=\"Закрыть кузницу. Клавиша Escape.\">Закрыть</button></div>";
    // Прокручиваемая середина: у карточки общий потолок высоты, и раньше
    // нижние улучшения могли просто не поместиться.
    html += "<div class='battle-mid'>";
    html += "<div class='hud-num' style='margin:10px 0'>Вкладывай золото — улучшения " +
      "останутся с тобой до конца спуска.</div>";
    html += "<div class='inv-section'><h3>Улучшения</h3>";
    FORGE_TRACKS.forEach((t) => {
      const lvl = forgeLevel(t.key);
      const cost = forgeCost(t.key);
      const can = G.player.gold >= cost;
      html += "<div class='inv-item'><div class='info'><b>" + t.icon + " " + t.name +
        " <span class='forge-lvl'>ур. " + lvl + "</span></b>" +
        "<span>" + t.text + " за уровень · сейчас +" + forgeBonus(t.key) + "</span>" +
        "<span class='item-desc'>Цена следующего: <b>" + cost + "</b> золота</span></div>" +
        "<button class='btn" + (can ? " primary" : " ghost") + "' data-forge='" + t.key +
        "' data-tip=\"" + (can ? "Улучшить за " + cost + " золота: " + t.text.toLowerCase() + "."
          : "Не хватает " + (cost - G.player.gold) + " золота. Улучшения остаются до конца спуска.")
        + "\">" + (can ? "Улучшить" : "Мало золота") + "</button></div>";
    });
    html += "</div></div>";
    html += "<div class='battle-foot'><span class='foot-note'>Улучшения остаются до конца спуска</span>" +
      "<span class='win-chip'>Esc — закрыть</span></div>";
    box.innerHTML = html;
    el("forge-close").addEventListener("click", closeForge);
    box.querySelectorAll("button[data-forge]").forEach((btn) => {
      btn.addEventListener("click", () => buyForge(btn.dataset.forge));
    });
  }

  function buyForge(key) {
    if (!G.running) return;
    const cost = forgeCost(key);
    if (G.player.gold < cost) {
      toast("Не хватает золота");
      return;
    }
    G.player.gold -= cost;
    G.forge[key] = forgeLevel(key) + 1;
    recalcStats();
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + (key === "vitality" ? ECON.forgeHp : 0));
    toast("Кузница: уровень " + G.forge[key]);
    log("Кузница: «" + key + "» улучшено до уровня " + G.forge[key] + " (−" + cost + " золота).", "loot");
    updateHud();
    renderForge();
    scheduleSave();
  }

  // Ценность предмета растёт с глубиной: и продажа, и покупка. Иначе к
  // 8-му этажу мешок золота ничего не стоил бы, а находки обесценивались.
  function itemBaseValue(item) {
    if (!item) return 0;
    const raw = item.slot === "potion"
      ? (POTION_PRICE[item.id] || 20)
      : (RARITY_VALUE[item.rarity] || 20);
    return Math.round(raw * depthMul(ECON.priceDepth));
  }

  function itemSellValue(item) {
    return Math.max(1, Math.floor(itemBaseValue(item) * ECON.sellRate));
  }

  function sellItem(i) {
    const item = G.inventory[i];
    if (!item) return;
    const price = itemSellValue(item);
    G.inventory.splice(i, 1);
    G.player.gold += price;
    toast("Продано: " + item.name + " (+" + price + ")");
    log("Ты продал «" + item.name + "» за " + price + " золота.", "loot");
    updateHud();
    renderInventory();
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
    // Снаряжение и бонусы меняются редко — на каждом шаге панель не трогаем.
    const sig = (eq.weapon ? eq.weapon.id + eq.weapon.name : "-") + "|" +
      (eq.armor ? eq.armor.id + eq.armor.name : "-") + "|" +
      (eq.accessory ? eq.accessory.id + eq.accessory.name : "-") + "|" +
      G.player.atkBonus + "|" + G.player.defBonus + "|" + G.player.maxHp + "|" + G.floorIndex;
    if (G.equipSig === sig) return;
    G.equipSig = sig;
    el("equip-weapon").textContent = eq.weapon ? eq.weapon.name : "пусто";
    el("equip-armor").textContent = eq.armor ? eq.armor.name : "пусто";
    el("equip-accessory").textContent = eq.accessory ? eq.accessory.name : "пусто";
    // Игрок должен видеть, что даёт собранная защита: число без процента
    // ничего не говорит, а броня теперь работает процентами.
    const guard = Math.round(armorMitigation() * 100);
    el("equip-stats").textContent = "+" + G.player.atkBonus + " урон · +" +
      G.player.defBonus + " защита" + (guard > 0 ? " (−" + guard + "% урона)" : "");
    // Подсказка на плашке: что надето и что оно даёт — видно, не открывая сумку.
    const chipTip = (id, slot) => {
      const node = el(id);
      const chip = node && node.parentElement;
      if (!chip) return;
      const item = eq[slot];
      // Пустая плашка — не кнопка: нажимать нечего.
      if ("disabled" in chip) chip.disabled = !item;
      if (!item) {
        chip.setAttribute("data-tip", tipAttr("<b>" + SLOT_NAMES[slot] +
          ": пусто</b><br>Вещь из сумки встанет сюда. Сумка открывается клавишей I."));
        return;
      }
      const parts = ["<b>" + SLOT_NAMES[slot] + ": " + item.name + "</b>",
        itemBonusText(item) + " · " + RARITY[item.rarity].name];
      if (item.effect) parts.push("✦ " + effectText(item));
      const setLine = setLineFor(item);
      if (setLine) parts.push(setLine);
      if (item.desc) parts.push(item.desc);
      parts.push("Нажми, чтобы снять и вернуть в сумку.");
      chip.setAttribute("data-tip", tipAttr(parts.join("<br>")));
    };
    chipTip("equip-weapon", "weapon");
    chipTip("equip-armor", "armor");
    chipTip("equip-accessory", "accessory");
    const statsNode = el("equip-stats");
    if (statsNode && statsNode.parentElement) {
      statsNode.parentElement.setAttribute("data-tip", tipAttr(
        "<b>Бонусы снаряжения</b><br>" + statsNode.textContent +
        (guard > 0 ? "<br>Броня снижает входящий урон на " + guard + "%." : "")));
    }
    renderEffectList();
  }

  // ---------- Предметы и инвентарь ----------

  // Сколько вещей каждой семьи сейчас надето.
  function setCounts() {
    const counts = {};
    if (!G.equipment) return counts;
    for (const slot of ["weapon", "armor", "accessory"]) {
      const key = itemSetKey(G.equipment[slot]);
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  // Что даёт семья при таком числе надетых вещей: ничего за одну, малый
  // бонус за две и сильный за все три.
  function setBonusFor(key, count) {
    const def = setByKey(key);
    if (!def) return null;
    const n = count == null ? setCounts()[key] || 0 : count;
    if (n >= 3) return def.three;
    if (n === 2) return def.two;
    return null;
  }

  // Сумма бонусов всех семей и список того, что сработало прямо сейчас.
  function activeSetBonuses() {
    const counts = setCounts();
    const total = { atk: 0, def: 0, hp: 0, crit: 0, lifesteal: 0, gold: 0 };
    const list = [];
    Object.keys(counts).forEach((key) => {
      const bonus = setBonusFor(key, counts[key]);
      if (!bonus) return;
      Object.keys(bonus).forEach((k) => {
        total[k] = (total[k] || 0) + bonus[k];
      });
      list.push({ key, count: counts[key], bonus });
    });
    return { total, list };
  }

  function setBonusTotal(kind) {
    const sets = activeSetBonuses();
    return sets.total[kind] || 0;
  }

  function recalcStats() {
    const p = G.player;
    const eq = G.equipment;
    const sets = activeSetBonuses();
    const atk = (eq.weapon && eq.weapon.atk ? eq.weapon.atk : 0) +
      (eq.accessory && eq.accessory.atk ? eq.accessory.atk : 0) +
      sets.total.atk + forgeBonus("weapon");
    const def = (eq.armor && eq.armor.def ? eq.armor.def : 0) +
      (eq.accessory && eq.accessory.def ? eq.accessory.def : 0) +
      sets.total.def + forgeBonus("armor");
    const bonusHp = (eq.armor && eq.armor.hp ? eq.armor.hp : 0) +
      (eq.accessory && eq.accessory.hp ? eq.accessory.hp : 0) +
      sets.total.hp + forgeBonus("vitality");
    p.atkBonus = atk;
    p.defBonus = def;
    // Особые бонусы семей храним отдельно: их читают крит, вампиризм и золото.
    p.setAtk = sets.total.atk;
    p.setDef = sets.total.def;
    p.setHp = sets.total.hp;
    p.setCrit = sets.total.crit;
    p.setLifesteal = sets.total.lifesteal;
    p.setGold = sets.total.gold;
    p.maxHp = p.baseMaxHp + bonusHp;
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    updateEquipBar();
  }

  function addItem(item, opts) {
    G.inventory.push(item);
    markCodex("items", item.id);
    log(item.desc ? item.name + " — " + item.desc : item.name, "loot");
    // Покупка сама пишет строку в журнал, поэтому ей лишние две ни к чему.
    if (!opts || !opts.quiet) {
      if (item.slot === "potion") {
        log("В сумке " + countPotions() + " зелий.", "loot");
      } else {
        log("Предмет «" + item.name + "» добавлен в инвентарь.", "loot");
      }
    }
    renderInventory();
  }

  // Мешочек с добычей лежит на месте павшего врага. Золото и предмет
  // забираются только при подборе: так победа не проскакивает мимо игрока.
  function lootBagAt(x, y) {
    return (G.lootBags || []).find((b) => b.x === x && b.y === y) || null;
  }

  function ensureLootBag(x, y, gold, item) {
    let bag = lootBagAt(x, y);
    if (!bag) {
      bag = { uid: ++G.uid, x, y, gold: 0, items: [] };
      G.lootBags.push(bag);
    }
    bag.gold = (bag.gold || 0) + Math.max(0, gold || 0);
    if (item) bag.items.push(item);
    return bag;
  }

  function pickupLootBag(bag) {
    if (!bag) return false;
    const idx = G.lootBags.indexOf(bag);
    if (idx < 0) return false;
    G.lootBags.splice(idx, 1);
    const gold = bag.gold || 0;
    if (gold > 0) addGold(gold);
    (bag.items || []).forEach((item) => addItem(item));
    const parts = [];
    if (gold > 0) parts.push("золото +" + gold);
    (bag.items || []).forEach((item) => parts.push(item.name));
    log("Мешочек с добычей подобран: " + (parts.length ? parts.join(", ") : "пусто") + ".", "loot");
    toast(parts.length ? "Добыча: " + parts.join(", ") : "Мешочек пуст");
    render();
    updateHud();
    updateActionButton();
    scheduleSave();
    return true;
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
    log("Экипировано: " + item.name + ".", "loot");
    updateHud();
    renderInventory();
  }

  // Что даст зелье прямо сейчас: сколько здоровья вернёт и снимет ли яд.
  // Один подсчёт для сумки и боя. Раньше они расходились: в бою зелье без
  // поля effect роняло игру на eff.kind уже после лечения, и зелье оставалось
  // в сумке (бесконечное лечение при яде), а в сумке противоядие нельзя было
  // выпить при полном здоровье.
  function potionOutcome(item) {
    if (!item || item.slot !== "potion" || !G.player) {
      return { heal: 0, cleanse: false, useful: false };
    }
    const missing = Math.max(0, G.player.maxHp - G.player.hp);
    const heal = item.heal > 0 ? Math.min(item.heal, missing) : 0;
    const eff = item.effect;
    const cleanser = !!eff && (eff.kind === "antidote" || eff.kind === "cleanse" || eff.kind === "fullHeal");
    const cleanse = (G.player.poison || 0) > 0 && cleanser;
    return { heal: heal, cleanse: cleanse, useful: heal > 0 || cleanse };
  }

  // Выпивает зелье из сумки. null — зелье сейчас бесполезно и осталось в сумке.
  function drinkPotion(index) {
    const item = G.inventory[index];
    const out = potionOutcome(item);
    if (!out.useful) {
      const idle = G.player.hp >= G.player.maxHp && !(G.player.poison > 0);
      toast(idle ? "Здоровье уже полное" : "Зелье сейчас бесполезно");
      return null;
    }
    G.player.hp += out.heal;
    if (out.cleanse) G.player.poison = 0;
    G.inventory.splice(index, 1);
    return out;
  }

  // Какое зелье пить, если игрок не выбрал: самое слабое из тех, что закрывают
  // недостачу здоровья (эликсир не тратится на царапину), а если не закрывает
  // ни одно — самое сильное.
  function bestPotionIndex() {
    if (!G.player) return -1;
    const missing = Math.max(0, G.player.maxHp - G.player.hp);
    let cover = -1;
    let coverHeal = Infinity;
    let most = -1;
    let mostGain = 0;
    G.inventory.forEach((item, i) => {
      const out = potionOutcome(item);
      if (!out.useful) return;
      const gain = out.heal + (out.cleanse ? 25 : 0);
      if (out.heal >= missing && item.heal < coverHeal) {
        cover = i;
        coverHeal = item.heal;
      }
      if (gain > mostGain) {
        most = i;
        mostGain = gain;
      }
    });
    return cover >= 0 ? cover : most;
  }

  function usePotion(index) {
    const item = G.inventory[index];
    if (!item || item.slot !== "potion") return;
    const out = drinkPotion(index);
    if (!out) return;
    log("Выпито зелье: +" + out.heal + " здоровья" + (out.cleanse ? ", яд снят" : "") + ".", "loot");
    toast("+" + out.heal + " здоровья" + (out.cleanse ? ", яд снят" : ""));
    updateHud();
    renderInventory();
  }

  // Стек одинаковых предметов: три малых зелья в сумке — одна строка с числом,
  // а не три одинаковые. Кнопки работают с первой вещью стека: для одинаковых
  // предметов это то же самое, а число уменьшается на единицу за нажатие.
  function stackedInventory() {
    const out = [];
    const where = {};
    (G.inventory || []).forEach((item, i) => {
      const id = String(item.id);
      if (where[id] === undefined) {
        where[id] = out.length;
        out.push({ item: item, index: i, count: 1 });
      } else {
        out[where[id]].count += 1;
      }
    });
    return out;
  }

  function openInventory() {
    if (!G.running) return;
    renderInventory();
    const box = el("inventory-card");
    if (box && box.scrollIntoView) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function isUsableNow(item) {
    if (!item || item.slot !== "potion") return "";
    if (G.player.hp < G.player.maxHp && item.heal > 0) return "";
    if (G.player.poison > 0 && item.effect &&
      (item.effect.kind === "antidote" || item.effect.kind === "cleanse" || item.effect.kind === "fullHeal")) {
      return "<span class='item-effect'>Снимет яд прямо сейчас</span>";
    }
    return "";
  }

  // Строка про семью предмета для сумки: к какому набору он относится и
  // что даст, если надеть его вместе с остальными.
  function setLineFor(item) {
    const key = itemSetKey(item);
    if (!key) return "";
    const def = setByKey(key);
    const n = setCounts()[key] || 0;
    const now = n >= 3 ? "набор собран" : "надето " + n + "/3";
    const next = n >= 2 ? def.threeText : def.twoText;
    return "<span class='item-set' style='color:" + def.color + "'>" + def.icon + " " +
      def.name + " · " + now + " · с набором: " + next + "</span>";
  }

  // Разница с надетым предметом того же слота. Игрок не должен держать
  // числа в голове, чтобы понять, станет ли лучше от замены.
  function itemCompareText(item) {
    if (!item || !item.slot || item.slot === "potion" || !G.equipment) return "";
    const now = G.equipment[item.slot];
    const parts = [];
    const diff = (label, value, was) => {
      const delta = (value || 0) - (was || 0);
      if (!delta) return;
      parts.push("<span class='item-cmp " + (delta > 0 ? "up" : "down") + "'>" +
        (delta > 0 ? "▲ +" + delta : "▼ " + delta) + " " + label + "</span>");
    };
    diff("урон", item.atk, now && now.atk);
    diff("защита", item.def, now && now.def);
    diff("здоровье", item.hp, now && now.hp);
    // Семья: предмет может дособрать набор, а может и развалить его.
    const key = itemSetKey(item);
    if (key) {
      const before = setCounts()[key] || 0;
      const lost = now && now.set === key ? 1 : 0;
      const after = before - lost + 1;
      if (after > before) {
        const def = setByKey(key);
        parts.push("<span class='item-cmp set'>" + def.icon + " " + def.name + " " +
          after + "/3" + (after >= 3 ? " — полный набор" : "") + "</span>");
      }
    }
    if (!parts.length) return "<div class='item-cmp-row'>не лучше надетого</div>";
    return "<div class='item-cmp-row'>" + parts.join("") + "</div>";
  }

  // То же сравнение, но простым текстом — для всплывашки и журнала покупки.
  function itemComparePlain(item) {
    if (!item || !item.slot || item.slot === "potion" || !G.equipment) return "";
    const now = G.equipment[item.slot];
    const parts = [];
    const diff = (label, value, was) => {
      const delta = (value || 0) - (was || 0);
      if (!delta) return;
      parts.push((delta > 0 ? "+" : "−") + Math.abs(delta) + " " + label);
    };
    diff("урон", item.atk, now && now.atk);
    diff("защита", item.def, now && now.def);
    diff("здоровье", item.hp, now && now.hp);
    return parts.join(", ");
  }

  // Строка «Характеристики» в сумке. Её содержимое — состояние героя, а не
  // список вещей, поэтому живёт отдельно: сумка перерисовывается только при
  // смене вещей, и здоровье с уроном в ней застывали (120 / 120 при 180 / 180).
  // Снижение урона бронёй — процент, а не число: без него «Защита: 3»
  // ничего не говорит игроку.
  function inventoryStatsInner() {
    const p = G.player;
    const guard = Math.round(armorMitigation() * 100);
    return "<span>Урон: <b>" + (p.dmgBase + p.atkBonus) + "</b></span>" +
      "<span>Здоровье: <b>" + p.hp + " / " + p.maxHp + "</b></span>" +
      "<span>Защита: <b>" + p.defBonus + "</b>" +
      (guard > 0 ? "<i class='inv-note'>−" + guard + "% урона</i>" : "") + "</span>" +
      "<span>Зелий: <b>" + countPotions() + "</b></span>";
  }

  function inventoryStatsSig() {
    const p = G.player;
    return [p.hp, p.maxHp, p.dmgBase, p.atkBonus, p.defBonus, countPotions()].join("|");
  }

  // Дёшево: подпись сравнивается на каждом updateHud, DOM трогается только
  // когда числа правда изменились.
  function refreshInventoryStats() {
    if (!G.player) return;
    const sig = inventoryStatsSig();
    if (G.invStatsSig === sig) return;
    const node = el("inv-stats");
    if (!node) return;
    G.invStatsSig = sig;
    node.innerHTML = inventoryStatsInner();
  }

  function renderInventory() {
    const p = G.player;
    const box = el("inventory-box");
    if (!box || !p) return;
    let html = "";
    html += "<div class='inv-section'><h3>Характеристики</h3>" +
      "<div class='inv-stats' id='inv-stats'>" + inventoryStatsInner() + "</div></div>";
    G.invStatsSig = inventoryStatsSig();

    // Надетое здесь не повторяем: те же три плашки стоят в закреплённой
    // сводке, а снять вещь можно нажатием на плашку.

    // Комплекты: видно, что уже работает и одной вещи до чего не хватает.
    const setCounted = setCounts();
    const setKeys = Object.keys(setCounted);
    if (setKeys.length) {
      html += "<div class='inv-section'><h3>Комплекты</h3>";
      setKeys.forEach((key) => {
        const def = setByKey(key);
        const n = setCounted[key];
        const bonus = setBonusFor(key, n);
        const state = n >= 3 ? "Полный набор: " + def.threeText
          : n === 2 ? "Работает: " + def.twoText + ". До полного набора ещё одна вещь."
          : "Пока ничего не даёт. Надень вторую вещь семьи.";
        html += "<div class='inv-item set-item' style='border-left-color:" + def.color + "'>" +
          "<div class='info'><b>" + def.icon + " " + def.name + " " + n + "/3</b>" +
          "<span>" + (bonus ? "Бонус набора активен" : "Бонус набора не активен") + "</span>" +
          "<span class='item-desc'>" + state + "</span></div></div>";
      });
      html += "</div>";
    }

    html += "<div class='inv-section'><h3>Сумка</h3>";
    if (G.inventory.length === 0) {
      html += "<div class='inv-empty'>Пока пусто. Ищи сундуки и побеждай монстров.</div>";
    } else {
      stackedInventory().forEach((stack) => {
        const item = stack.item;
        const i = stack.index;
        const count = stack.count;
        const isPotion = item.slot === "potion";
        const rarity = RARITY[item.rarity];
        const ico = itemPic(item, rarity.color);
        // Подробности уходят во всплывашку: в узкой колонке они растягивали
        // строку на пол-экрана, а нужны раз в пять предметов.
        const details = [];
        if (item.effect) details.push("✦ " + effectText(item));
        const setInfo = setLineFor(item);
        if (setInfo) details.push(setInfo);
        if (item.desc) details.push(item.desc);
        const cmp = isPotion ? "" : itemComparePlain(item);
        if (cmp) details.push("С надетым: " + cmp);
        const warn = (isPotion && G.player.poison > 0) ? isUsableNow(item) : "";
        if (warn) details.push(warn);
        const tip = "<b>" + item.name + "</b>" +
          (details.length ? "<br>" + details.join("<br>") : "");
        // Сравнение с надетым остаётся в строке настоящей разметкой
        // (itemCompareText): по ней и проверки сверяют, и игрок сразу видит
        // «▲ +2 урон» или «не лучше надетого», не наводя мышь.
        const cmpLine = isPotion ? "" : itemCompareText(item);
        html += "<div class='inv-item' data-tip=\"" + tipAttr(tip) +
          "\" style='border-left-color:" + rarity.color + "'>" +
          "<div class='info'><b>" + ico + item.name +
          (count > 1 ? " <span class='inv-count'>×" + count + "</span>" : "") + "</b>" +
          "<span>" + rarity.name + " · " + itemBonusText(item) + "</span>" +
          cmpLine + "</div>" +
          "<div class='inv-actions'>" +
          "<button class='btn " + (isPotion ? "purple" : "") + "' data-item='" + i + "' data-tip=\"" +
          tipAttr(isPotion ? "Выпить: " + (effectText(item) || item.desc || "лечение") + "."
            : "Надеть вместо того, что в этом слоте.") + "\">" +
          (isPotion ? "Выпить" : "Надеть") + "</button>" +
          "<button class='btn ghost' data-discard='" + i +
          "' data-tip=\"Убрать предмет из сумки насовсем.\">Убрать</button>" +
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
  }

  function discardItem(index) {
    const item = G.inventory[index];
    if (!item) return;
    if (!window.confirm("Убрать «" + item.name + "» из инвентаря?")) return;
    G.inventory.splice(index, 1);
    log("Убран предмет: " + item.name + ".", "loot");
    updateHud();
    renderInventory();
  }

  function unequipItem(slot) {
    const item = G.equipment[slot];
    if (!item) return;
    G.equipment[slot] = null;
    G.inventory.push(item);
    recalcStats();
    log("Снято: " + item.name + ".", "loot");
    updateHud();
    renderInventory();
  }

  // ---------- Движение ----------

  // Клик по плитке — маршрут по кратчайшему пути. Идёт герой сам,
  // по клетке за ход, и КАЖДЫЙ шаг проходит через move(): враги
  // ходят, срабатывают ловушки, задания выпадают как обычно.
  // Пока идёт маршрут, новый клик его перезапускает, а любая ручная
  // клавиша или бой — отменяет.
  let walkPath = null;

  function onMapClick(ev) {
    if (!G.running || G.battle || G.loading) return;
    if (!el("end-overlay").classList.contains("hidden")) return;
    if (!el("shop-overlay").classList.contains("hidden")) return;
    if (!el("entrance-overlay").classList.contains("hidden")) return;
    if (!el("dialog-overlay").classList.contains("hidden")) return;
    const tile = ev.target && ev.target.closest ? ev.target.closest(".tile") : null;
    if (!tile || tile.dataset.x === undefined) return;
    const tx = Number(tile.dataset.x);
    const ty = Number(tile.dataset.y);
    if (G.map.grid[ty] && G.map.grid[ty][tx] !== 1) {
      setMsg("Туда не пройти — стена.");
      return;
    }
    const path = findPath(G.playerPos, { x: tx, y: ty });
    if (!path || !path.length) {
      setMsg("Туда не добраться.");
      return;
    }
    walkPath = path;
    G.walkTarget = { x: tx, y: ty };
    setMsg("Идём…");
    render();
    walkTick();
  }

  // Маршрут окончен: гасим таймер и убираем метку цели с карты.
  function endWalk() {
    walkPath = null;
    clearTimeout(walkTick._timer);
    G.walkTarget = null;
  }

  function cancelWalk() {
    if (!walkPath && !G.walkTarget) return;
    endWalk();
    render();
  }

  // Шаг маршрута. Идём с задержкой между клетками, чтобы игрок успевал
  // заметить, куда герой идёт и откуда пришёл враг.
  function walkTick() {
    clearTimeout(walkTick._timer);
    if (!walkPath || !walkPath.length) {
      endWalk();
      setMsg("");
      render();
      return;
    }
    if (!G.running || G.battle) {
      if (G.battle) {
        endWalk();
        log("Путь прерван: " + (G.battle.enemy ? G.battle.enemy.name : "препятствие") + ".", "fight");
      }
      return;
    }
    const next = walkPath.shift();
    if (!walkPath.length) endWalk();
    const before = { x: G.playerPos.x, y: G.playerPos.y };
    move(next.x - before.x, next.y - before.y);
    // Если начался бой — маршрут обрывается, дойти сквозь дракона нельзя.
    if (G.battle) {
      endWalk();
      log("Путь прерван: " + (G.battle.enemy ? G.battle.enemy.name : "препятствие") + ".", "fight");
      return;
    }
    // Враг занял клетку, и шаг не состоялся: пробуем следующую.
    if (G.playerPos.x === before.x && G.playerPos.y === before.y && walkPath && walkPath.length) {
      const again = walkPath.shift();
      if (!walkPath.length) endWalk();
      move(again.x - G.playerPos.x, again.y - G.playerPos.y);
      if (G.battle) {
        endWalk();
        log("Путь прерван: " + (G.battle.enemy ? G.battle.enemy.name : "препятствие") + ".", "fight");
        return;
      }
    }
    if (walkPath && walkPath.length) walkTick._timer = setTimeout(walkTick, 110);
  }

  // Кратчайший путь по клеткам. Стоимость обычная; лестницы вниз и
  // сундуки не притягивают — герой идёт туда, куда кликнули.
  // Четыре направления — для поиска пути. WASD отдельно раскладывается
  // по тем же векторам в keydown, поэтому в DIRS его нет.
  const STEP_DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  function findPath(from, to) {
    const { w, h, grid } = G.map;
    const start = from.y * w + from.x;
    const goal = to.y * w + to.x;
    if (start === goal) return [];
    const prev = new Int32Array(w * h).fill(-1);
    const seen = new Uint8Array(w * h);
    const queue = [start];
    seen[start] = 1;
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      if (cur === goal) break;
      const cx = cur % w;
      const cy = (cur - cx) / w;
      for (const d of STEP_DIRS) {
        const nx = cx + d[0];
        const ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (grid[ny][nx] !== 1) continue;
        // Деревья, заборы и колодец в деревне не пропускают — иначе герой
        // прошёл бы сквозь ствол, потому что в grid это обычный пол.
        if (cellBlocked(nx, ny)) continue;
        const ni = ny * w + nx;
        if (seen[ni]) continue;
        seen[ni] = 1;
        prev[ni] = cur;
        queue.push(ni);
      }
    }
    if (!seen[goal]) return null;
    const out = [];
    let cur = goal;
    while (cur !== start && cur !== -1) {
      const x = cur % w;
      out.push({ x, y: (cur - x) / w });
      cur = prev[cur];
    }
    return out.reverse();
  }

  // ---------- Действие у объекта ----------
  // Пункт 1: сундук, торговец и лестницы больше не срабатывают сами от шага.
  // Герой встаёт на клетку (или рядом с ней) и нажимает кнопку действия
  // либо клавишу E. Клетки объектов остаются проходимыми: иначе сундук
  // в узком коридоре перекрыл бы единственный путь к лестнице.
  function interactTarget() {
    // Лестница — это шаг с клетки, а цепь шагнуть не даёт. Раньше герой в
    // цепях уходил по соседней лестнице, и цепь держала его уже на другом
    // этаже, где никакой ловушки нет. Сундук и торговец рядом доступны:
    // до них можно дотянуться, не сходя с места.
    const chained = !!(G.player && G.player.snared);
    const held = (icon) => ({ kind: "chained", label: "Цепь не пускает к лестнице", icon: icon });
    // После босса у лестницы открыт портал в деревню. Он важнее запертой
    // лестницы: иначе игрок стоит на ступеньке, видит «Спуск запечатан»
    // и не может вернуться, хотя портал рядом.
    const stairsUsable = !!(G.stairsDown && G.stairsDown.active && canDescend());
    if (!chained && !stairsUsable && portalActive() && G.portal && G.playerPos) {
      const d = Math.abs(G.playerPos.x - G.portal.x) +
        Math.abs(G.playerPos.y - G.portal.y);
      if (d <= 1) {
        return { kind: "portal", label: "Войти в портал в деревню", icon: "✦", obj: G.portal };
      }
    }
    const at = (x, y) => {
      // Мешочек с добычей — приоритетнее декора: он лежит на месте врага.
      const bag = lootBagAt(x, y);
      if (bag) {
        return { kind: "loot", label: "Подобрать мешочек с добычей", icon: "✦", obj: bag };
      }
      // НПС и двери — объекты деревни и домов.
      const npc = (G.npcs || []).find((n) => n.x === x && n.y === y);
      if (npc) return { kind: "npc", label: npc.name, icon: "☺", obj: npc };
      const door = (G.doors || []).find((d) => d.x === x && d.y === y);
      if (door) {
        if (doorLocked(door)) {
          // Запертая дверь — это постройка, которую деревня ещё не подняла.
          // Подпись сразу говорит, за что её восстанавливать.
          const bkey = villageBuildingAtDoor(x, y);
          const def = bkey ? VILLAGE_BUILDINGS[bkey] : null;
          return {
            kind: "build",
            label: def ? "Восстановить: " + def.name : "Дверь заперта",
            icon: "⚒", obj: { key: bkey }
          };
        }
        return {
          kind: "door",
          label: door.exit ? "Выйти на улицу" : "Войти в дом",
          icon: "▯", obj: door
        };
      }
      // Тайник: запертая дверь в монолит. Ключ лежит на страже этажа,
      // а рычаг где-то рядом открывает её без ключа.
      const vault = vaultAt(x, y);
      if (vault) {
        return {
          kind: "vault",
          icon: "▮", obj: vault,
          // В подписи сказано, где взять ключ: ученики видели «Запертый тайник»
          // и не понимали, что делать, а страж этажа с ключом оставался без
          // внимания.
          label: vault.locked
            ? "Тайник заперт: ключ у стража лестницы"
            : "Тайник открыт"
        };
      }
      const node = nodeAt(x, y);
      if (node) {
        return {
          kind: "node",
          label: LOOT_NAMES[node.kind] ? "Добыть: " + LOOT_NAMES[node.kind] : "Добыча",
          icon: "⛏", obj: node
        };
      }
      const lever = leverAt(x, y);
      if (lever) {
        // В подписи сразу сказано, что рычаг открывает тайник, и что за
        // ошибку ударит током: ученики видели «рычаг» и не понимали, зачем он,
        // а один погиб, потому что про удар нигде не было сказано.
        return {
          kind: "lever", icon: "⚙", obj: lever,
          label: "Рычаг: открыть тайник (ударит током за ошибку)"
        };
      }
      const sign = signAt(x, y);
      if (sign) return { kind: "sign", label: "Прочитать табличку", icon: "▤", obj: sign };
      // Костёр-привал: один раз за костёр и не больше, чем привалов на поход.
      const camp = campAt(x, y);
      if (camp && G.place === "dungeon") {
        const left = G.restsLeft || 0;
        return {
          kind: "camp",
          label: camp.used ? "Костёр прогорел"
            : left > 0 ? "Отдохнуть у костра" : "Привалов больше нет",
          icon: "🔥", obj: camp
        };
      }
      // Колодец — дворовая постройка: он не дом, но его тоже восстанавливают.
      const yard = (G.scenery || []).find((s) => s.x === x && s.y === y && s.kind === "well");
      if (yard && G.place !== "dungeon") {
        const bkey = "well";
        const def = VILLAGE_BUILDINGS[bkey];
        return {
          kind: "build",
          label: villageLevel(bkey) >= def.levels.length
            ? def.name + " восстановлен"
            : "Восстановить: " + def.name,
          icon: "⚒", obj: { key: bkey }
        };
      }
      if (portalActive() && G.portal.x === x && G.portal.y === y) {
        return { kind: "portal", label: "Войти в портал в деревню", icon: "✦", obj: G.portal };
      }
      if (G.stairsDown && G.stairsDown.x === x && G.stairsDown.y === y) {
        if (!G.stairsDown.active) {
          const bossFloor = floorDef(G.floorIndex);
          return { kind: "locked", label: bossFloor.boss ? "Выход охраняет " + String(bossFloor.bossName || "дракон").toLowerCase() : "Лестницу охраняет страж", icon: "▲" };
        }
        if (!canDescend()) return { kind: "sealed", label: "Спуск запечатан", icon: "▼" };
        return chained ? held("▼") : { kind: "down", label: "Спуститься ниже", icon: "▼" };
      }
      if (G.stairsUp && G.stairsUp.x === x && G.stairsUp.y === y) {
        return chained ? held("▲") : { kind: "up", label: "Подняться выше", icon: "▲" };
      }
      const trader = (G.traders || []).find((t) => t.x === x && t.y === y);
      if (trader) return { kind: "trader", label: "Торговать", icon: "⚖", obj: trader };
      const chest = (G.treasures || []).find((t) => t.x === x && t.y === y);
      if (chest) return { kind: "chest", label: "Открыть сундук", icon: "▣", obj: chest };
      return null;
    };
    const here = at(G.playerPos.x, G.playerPos.y);
    if (here) return here;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const found = at(G.playerPos.x + dx, G.playerPos.y + dy);
      if (found) return found;
    }
    return null;
  }

  function updateActionButton() {
    const btn = el("action-btn");
    const skip = el("skip-btn");
    const live = G.running && !overlayOpen();
    const target = live ? interactTarget() : null;
    // Кнопка меняется только когда рядом появился новый объект, поэтому
    // сравниваем подпись и не трогаем DOM на каждом шаге.
    const sig = (live ? "1" : "0") + "|" +
      (target ? target.kind + "|" + target.label + "|" + target.icon : "-");
    if (G.actionSig === sig) return;
    G.actionSig = sig;
    // Кнопка пропуска живёт по тем же правилам: ход можно пропустить,
    // только пока идёт игра и не открыто ни одного окна поверх карты.
    if (skip) skip.classList.toggle("hidden", !live || G.place !== "dungeon");
    if (!btn) return;
    if (!target) {
      btn.classList.add("hidden");
      return;
    }
    btn.classList.remove("hidden");
    btn.classList.toggle("locked",
      target.kind === "locked" || target.kind === "sealed" ||
      target.kind === "chained" || target.kind === "locked-door");
    el("action-icon").textContent = target.icon;
    el("action-label").textContent = target.label;
  }

  // Любое модальное окно поверх карты: пока оно открыто, кнопка действия
  // и клавиша E молчат, иначе можно открыть сундук «сквозь» лавку.
  // Развилки на входе (blessing-overlay) здесь нет намеренно: она не модальная,
  // герой ходит и дерётся, пока ученик не ответил. В списке она глушила кнопку
  // действия вместе с клавишей E — а через них работают лестница, сундуки и
  // жители. Ученик, который проскочил развилку, застревал: дракон повержен,
  // выход открыт, а «Спуститься ниже» нажать нечем.
  function overlayOpen() {
    // Стартовое меню — тоже модальное окно: под ним нельзя открыть сундук
    // или пропустить ход. Проверяем через PyMenu, а не через DOM: в
    // node-проверках этого модуля нет, и заглушка элемента всегда «видима».
    if (typeof window !== "undefined" && window.PyMenu &&
        typeof window.PyMenu.isOpen === "function" && window.PyMenu.isOpen()) {
      return true;
    }
    return ["end-overlay", "shop-overlay", "battle-overlay", "forge-overlay",
      "level-loading", "entrance-overlay", "calibration-overlay", "dialog-overlay"].some((id) => {
      const node = el(id);
      return node && !node.classList.contains("hidden");
    });
  }

  // Tab внутри модального окна: без этого фокус уходит в шапку и на карту
  // за оверлеем. Пока закрываем так окно стража — самое частое после меню.
  function trapFocus(e, overlayId) {
    if (e.key !== "Tab") return false;
    const box = el(overlayId);
    if (!box || box.classList.contains("hidden")) return false;
    const nodes = Array.prototype.slice.call(box.querySelectorAll(
      "button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])"
    )).filter((node) => node.offsetParent !== null);
    if (!nodes.length) return false;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (!box.contains(active)) {
      e.preventDefault();
      first.focus();
      return true;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
      return true;
    }
    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function doInteract() {
    if (!G.running || G.battle) return;
    if (overlayOpen()) return;
    const target = interactTarget();
    if (!target) return;
    if (target.kind === "npc") {
      // У стража входа — не рассказ, а настройка спуска.
      if (target.obj.key === "guard") openEntrance();
      else openDialog(target.obj);
      return;
    }
    if (target.kind === "door") {
      if (target.obj.exit) exitHouse();
      else enterHouse(target.obj.key);
      return;
    }
    if (target.kind === "camp") {
      restAtCamp(target.obj);
      return;
    }
    if (target.kind === "loot") {
      pickupLootBag(target.obj);
      return;
    }
    if (target.kind === "vault") {
      openVault(target.obj);
      return;
    }
    if (target.kind === "node") {
      mineNode(target.obj);
      return;
    }
    if (target.kind === "lever") {
      openLever(target.obj);
      return;
    }
    if (target.kind === "portal") {
      returnToVillage();
      return;
    }
    if (target.kind === "sign") {
      readSign(target.obj);
      return;
    }
    if (target.kind === "build") {
      openBuild(target.obj.key);
      return;
    }
    if (target.kind === "locked-door") {
      setMsg("Дверь заперта — хозяев нет дома.");
      return;
    }
    if (target.kind === "down") {
      descend();
      return;
    }
    if (target.kind === "up") {
      ascend();
      return;
    }
    if (target.kind === "sealed") {
      // Раньше этот случай сваливался в "locked" и на нажатие E отвечал
      // «Выход охраняет дракон», хотя страж уже побеждён, а спуск держит
      // оберег глубины из деревни.
      const message = sealMessage();
      setMsg(message);
      log(message, "floor");
      // aria-live-блок скрыт; объяснение затвора должно быть видно глазами.
      toast(message, 7000);
      return;
    }
    if (target.kind === "locked") {
      setMsg("Выход охраняет дракон — победи его.");
      return;
    }
    if (target.kind === "chained") {
      setMsg("Цепь держит тебя на клетке — к лестнице не шагнуть. Пережди её " +
        "(пропуск хода) или сорви победой в бою.");
      return;
    }
    if (target.kind === "trader") {
      setMsg("Торговец: «Заглядывай в лавку, герой!»");
      openShop(true);
      return;
    }
    if (target.kind === "chest") {
      const idx = G.treasures.indexOf(target.obj);
      if (idx < 0) return;
      const chest = G.treasures.splice(idx, 1)[0];
      // Редко в сундуке вместо предмета лежит амулет возврата: он уходит в
      // деревню и переживает смерть, поэтому им нельзя «затариться» в походе.
      if (!findAmulet()) {
        addItem(chest.item);
        log("Ты открыл сундук: " + chest.item.name + ".", "loot");
        toast("Найдено: " + chest.item.name);
      } else {
        log("Ты открыл сундук: в нём лежал амулет возврата.", "loot");
      }
      // Материалы для построек деревни лежат в тех же сундуках. Что именно
      // попадётся — зависит от глубины: руда с третьего этажа, древесина на
      // мелких, обломки с пятого. Так второй уровень кузницы нельзя
      // получить, не спускаясь глубоко.
      const mat = rollChestLoot(G.floorIndex);
      if (mat) gainLoot(mat.kind, mat.n);
      render();
      if (G.tutorial && G.tutorial.active) tutorialEvent("chest");
    }
  }

  // Материал из сундука: вид по глубине, количество — один-два. Возвращает
  // null, если на этом этаже материалов не нашлось.
  function rollChestLoot(floorIdx) {
    const kinds = [];
    if (floorIdx >= 2) kinds.push({ kind: "ore", chance: LOOT_ORE_CHANCE });
    if (floorIdx <= 5) kinds.push({ kind: "wood", chance: LOOT_WOOD_CHANCE });
    if (floorIdx >= 4) kinds.push({ kind: "shard", chance: LOOT_SHARD_CHANCE });
    // Порядок проверок случайный: иначе на пятом этаже всегда выпадала бы
    // руда, и обломки стали бы редкостью даже там, где они и есть цель.
    const order = kinds.slice();
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    for (let i = 0; i < order.length; i += 1) {
      if (Math.random() < order[i].chance) return { kind: order[i].kind, n: 1 };
    }
    // Кампания короткая: десяти этажей не хватит, если часть сундуков
    // окажется пустой по материалам. Поэтому сундук всегда отдаёт хотя бы
    // один материал, а шансы выше лишь выбирают, какой именно.
    if (order.length) return { kind: order[0].kind, n: 1 };
    return null;
  }

  // Пропуск хода: герой остаётся на месте, а монстры ходят по карте —
  // и могут сами найти его и ударить. Полноценный ход: враги двигаются,
  // на льду они успевают шагнуть лишний раз, лава в конце обжигает.
  function skipTurn() {
    if (!G.running || G.battle) return;
    if (overlayOpen()) return;
    // В деревне пропускать нечего: монстры ходят только в подземелье.
    // Но если цепь всё-таки осталась (старый сейв или переход), ожидание
    // должно её снять, а не молча ничего не делать.
    if (G.place !== "dungeon") {
      if (G.player && G.player.snared) {
        G.player.snared = false;
        G.player.snareWaits = 0;
        setMsg("Цепь спала: в деревне ей не за что держаться.");
        render();
      }
      return;
    }
    hideFloorArrival();
    // Ожидание отменяет набранный кликом маршрут: иначе герой пошёл бы
    // дальше сам, и «пропуск» превратился бы в обычный шаг.
    endWalk();
    // Цепь рвётся сама: если монстров рядом нет, сорвать её в бою нечем,
    // и партия превращалась в тупик (герой не мог ни шагнуть, ни дождаться
    // врага). Пять ожиданий подряд — и цепь слабеет.
    const chainLeft = G.player.snared ? SNARE_WAITS - (G.player.snareWaits || 0) : 0;
    setMsg(G.player.snared
      ? "Цепь держит тебя — остаётся только ждать. Рвётся через " + chainLeft + " х."
      : "Ты ждёшь. Монстры бродят по подземелью…");
    // На льду герой скользит: пока он пережидает, монстры успевают
    // лишний раз шагнуть — ровно так же, как при обычном шаге.
    const turns = hazardAt(G.playerPos.x, G.playerPos.y) === "frost" ? 2 : 1;
    for (let i = 0; i < turns; i++) {
      if (!G.running || G.battle) return;
      const attacker = enemyTurn();
      render();
      if (attacker) {
        openBattle(attacker);
        return;
      }
    }
    // Персонаж не двигался, но ход прошёл: лава под ногами жжёт.
    hazardTick();
    if (G.player.snared && G.player.hp > 0) {
      G.player.snareWaits = (G.player.snareWaits || 0) + 1;
      if (G.player.snareWaits >= SNARE_WAITS) breakChain();
    }
  }

  // Цепь спала сама: игрок пережидал, звенья разошлись.
  function breakChain() {
    G.player.snared = false;
    G.player.snareWaits = 0;
    const t = trapAt(G.playerPos.x, G.playerPos.y);
    if (t) t.armed = false;
    setMsg("Цепь разошлась — ты свободен.");
    log("Цепь ослабла и упала. Ты снова можешь идти.");
    render();
  }

  function move(dx, dy) {
    if (!G.running || G.battle) return;
    if (!el("end-overlay").classList.contains("hidden")) return;
    if (!el("shop-overlay").classList.contains("hidden")) return;
    if (!el("entrance-overlay").classList.contains("hidden")) return;
    if (!el("dialog-overlay").classList.contains("hidden")) return;
    if (G.player.snared) {
      setMsg("Цепь держит тебя. Сорви её в бою или пережди — пропусти ход.");
      return;
    }
    const nx = G.playerPos.x + dx;
    const ny = G.playerPos.y + dy;
    if (nx < 0 || ny < 0 || nx >= G.map.w || ny >= G.map.h) return;
    if (G.map.grid[ny][nx] !== 1) {
      setMsg("Здесь стена.");
      return;
    }
    if (cellBlocked(nx, ny)) {
      setMsg("Дальше не пройти.");
      return;
    }

    // Планку этажа убираем только после того, как ход признан удачным.
    // Раньше вызов стоял в самом верху move(), и она гасла от любого
    // нажатия клавиши — в том числе когда игрок упирался в стену или
    // в цепь, то есть практически сразу после спуска.
    hideFloorArrival();
    G.playerPos = { x: nx, y: ny };
    setMsg("");

    // В деревне и в домах нет ни монстров, ни ловушек, ни среды: ход — это
    // только шаг и подсказка про то, что рядом. Отдельная ветка, а не
    // «пустые списки»: так в деревню не протечёт ход монстров и лава.
    if (G.place !== "dungeon") {
      const near = interactTarget();
      if (near) setMsg(near.label + " — нажми «E».");
      render();
      return;
    }

    if (G.tutorial && G.tutorial.active) tutorialEvent("move");
    const enemy = G.enemies.find((e) => e.x === nx && e.y === ny);
    if (enemy) {
      render();
      openBattle(enemy);
      return;
    }

    // Мешочек подбирается шагом: враг уже мёртв, бой не начинается.
    const bag = lootBagAt(nx, ny);
    if (bag) pickupLootBag(bag);

    // Сундук, торговец и лестницы ждут кнопку действия (пункт 1).
    // Само по себе срабатывание убрано: шаг больше ничего не открывает.
    const standOn = (x, y) =>
      G.treasures.some((t) => t.x === x && t.y === y) ||
      (G.lootBags || []).some((t) => t.x === x && t.y === y) ||
      (G.traders || []).some((t) => t.x === x && t.y === y) ||
      (G.stairsUp && G.stairsUp.x === x && G.stairsUp.y === y) ||
      (G.stairsDown.x === x && G.stairsDown.y === y);
    if (standOn(nx, ny)) {
      updateActionButton();
      setMsg("Рядом объект — нажми кнопку действия или E.");
    }

    const trap = trapAt(nx, ny);
    if (trap && trap.armed !== false) {
      if (fireTrap(trap)) return;
    }

    // Опасная среда. Лёд под ногами заставляет скользить: монстры
    // успевают сделать лишний шаг, пока герой не удержался.
    if (hazardAt(nx, ny) === "frost") {
      setMsg("Ты поскользнулся на льду — монстры успели шагнуть.");
      const slipped = enemyTurn();
      if (slipped) {
        render();
        openBattle(slipped);
        return;
      }
    }

    const attacker = enemyTurn();
    render();
    if (attacker) {
      openBattle(attacker);
      return;
    }
    // Лава обжигает в самом конце хода: сначала монстры, потом пламя.
    hazardTick();
  }

  // ---------- Линия видимости ----------
  // Пункт 2: противник не должен бить через стену. Раньше дальнобойный
  // стрелял по одной лишь дистанции Math.hypot, поэтому летел урон сквозь
  // глухую скалу. Стенами считаются только клетки карты: сундук, торговец
  // и лестница обзор не закрывают.
  function wallAt(x, y) {
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) return true;
    return G.map.grid[y][x] !== 1;
  }

  function hasLineOfSight(x0, y0, x1, y1) {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let guard = 0;
    while ((x !== x1 || y !== y1) && guard++ < 512) {
      const e2 = 2 * err;
      let stepX = 0;
      let stepY = 0;
      if (e2 > -dy) { err -= dy; stepX = sx; }
      if (e2 < dx) { err += dx; stepY = sy; }
      // Диагональ не проходит через стык двух стен: иначе монстр бьёт
      // «через угол», хотя обе клетки по бокам глухие.
      if (stepX !== 0 && stepY !== 0) {
        if (wallAt(x + stepX, y) && wallAt(x, y + stepY)) return false;
      }
      x += stepX;
      y += stepY;
      if (x === x1 && y === y1) return true;
      if (wallAt(x, y)) return false;
    }
    return true;
  }

  // С какого расстояния враг замечает героя. Встроенное значение — запасное:
  // при загрузке его перекрывает настройка баланса «combat.aggro».
  let AGGRO_RADIUS = 3;

  function tileBlockedForEnemy(x, y, mover) {
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) return true;
    if (G.map.grid[y][x] !== 1) return true;
    // Запертая дверь тайника держит и монстров: иначе они забредали бы
    // в комнату, которую герой ещё не открыл.
    const vault = vaultAt(x, y);
    if (vault && vault.locked) return true;
    if (x === G.playerPos.x && y === G.playerPos.y) return false;
    if (G.stairsDown && G.stairsDown.x === x && G.stairsDown.y === y) return true;
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

  // Первый шаг настоящего пути в обход стены. Нужен там, где жадный шаг
  // упирается в стену: иначе монстр топчется на месте и никогда не доходит.
  function detourStep(e, px, py) {
    const path = findPath({ x: e.x, y: e.y }, { x: px, y: py });
    if (!path || !path.length) return null;
    const first = path[0];
    // Клетка героя — это атака, а не шаг.
    if (first.x === px && first.y === py) return null;
    if (tileBlockedForEnemy(first.x, first.y, e)) return null;
    return first;
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

  // Ловушка срабатывает при первом шаге на клетку.
  // Ловушки без урона меняют правила боя: цепь заставляет пропустить
  // ближайшего врага, проклятая плита делает следующий вопрос тяжелее.
  function fireTrap(trap) {
    const type = trapByKey(trap.kind);
    if (!type) return false;
    trap.armed = false;
    const p = G.player;

    if (type.key === "chain_snare") {
      p.snared = true;
      p.snareWaits = 0;
      setMsg(type.text + " Пока цепь цела, ты не уйдёшь с этой клетки.");
      log("Цепь держит тебя на месте. Сорви её победой в бою или пережди — " +
        "звенья разойдутся за " + SNARE_WAITS + " ходов.", "hurt");
      render();
      // Расстояние считаем от G.playerPos: у G.player координат на карте нет.
      const hunter = G.enemies
        .slice()
        .sort(
          (a, b) =>
            Math.hypot(a.x - G.playerPos.x, a.y - G.playerPos.y) -
            Math.hypot(b.x - G.playerPos.x, b.y - G.playerPos.y)
        )
        .find(
          (e) =>
            Math.hypot(e.x - G.playerPos.x, e.y - G.playerPos.y) <= AGGRO_RADIUS + 2
        );
      if (hunter) openBattle(hunter);
      return true;
    }

    if (type.key === "curse_tile") {
      G.player.cursedNext = true;
      setMsg(type.text);
      log("Проклятая плита: следующий вопрос будет сбивать с толку.", "hurt");
      render();
      return true;
    }

    const dmg = devGod() ? 0 : armorDamage(type.damage);
    p.hp = Math.max(0, p.hp - dmg);
    setMsg(type.text + " −" + dmg + " здоровья.");
    log(type.text + " Ты теряешь " + dmg + " здоровья.", "hurt");
    spawnFloat(el("map"), "-" + dmg, "hurt", 50, 50);
    shakeEl(el("map"));
    updateHud();
    render();
    if (p.hp <= 0) {
      showDeath();
      return true;
    }
    return true;
  }

  // Жрица лечит всех живых врагов этажа, кроме себя: её и надо убивать
  // первой. Элитная лечит сильнее (см. ELITE_ABILITY_TEXT).
  function healFloorAllies(priest) {
    const share = (priest && priest.elite) ? 0.45 : 0.3;
    let healed = 0;
    (G.enemies || []).forEach((o) => {
      if (o === priest || o.hp <= 0 || o.hp >= o.maxHp) return;
      const add = Math.min(o.maxHp - o.hp, Math.round(o.maxHp * share));
      if (add > 0) { o.hp += add; healed += 1; }
    });
    if (healed && G.battle) {
      G.battle.healAllies = healed;
      log("Жрица читает молитву: " + healed + " раненых врагов затянули раны.", "fight");
    }
  }

  // Некромант: за каждую ошибку героя поднимает мелкого слугу рядом с собой.
  // Больше двух слуг он держать не может — иначе одна ошибка наказывала бы
  // бесконечно.
  function summonMinion(necro) {
    if (!necro || necro.hp <= 0) return null;
    const cap = necro.elite ? 3 : 2;
    const mine = (G.enemies || []).filter((o) => o.summonedBy === necro.uid && o.hp > 0).length;
    if (mine >= cap) return null;
    const dirs = shuffle([[0, -1], [0, 1], [-1, 0], [1, 0]]);
    for (let i = 0; i < dirs.length; i += 1) {
      const x = necro.x + dirs[i][0], y = necro.y + dirs[i][1];
      if (!G.map.grid[y] || G.map.grid[y][x] !== 1) continue;
      if (G.enemies.some((o) => o.hp > 0 && o.x === x && o.y === y)) continue;
      if (G.playerPos.x === x && G.playerPos.y === y) continue;
      const pool = floorDef(G.floorIndex).pool || ["rat"];
      const kind = pool.filter((k) => !abilityOfType(k))[0] || pool[0];
      const minion = makeEnemy(kind, G.floorIndex, false);
      minion.x = x;
      minion.y = y;
      minion.summonedBy = necro.uid;
      minion.hp = Math.max(1, Math.round(minion.hp * 0.6));
      minion.maxHp = minion.hp;
      G.enemies.push(minion);
      log("Некромант поднимает слугу: " + minion.name + ".", "fight");
      if (G.battle) G.battle.summoned = (G.battle.summoned || 0) + 1;
      toast("Некромант поднял слугу!");
      return minion;
    }
    return null;
  }

  function playerPoisonTick() {
    if (!G.player.poison) return 0;
    if (equippedEffect("poisonImmune")) {
      G.player.poison = 0;
      toast("Оберег от яда: отравление прошло");
      effectFlash("Оберег от яда · отравление не действует");
      return 0;
    }
    G.player.poison -= 1;
    const dmg = devGod() ? 0 : Math.max(2, 3 + G.floorIndex);
    G.player.hp = Math.max(0, G.player.hp - dmg);
    if (G.player.hp === 0) G.battle.playerDead = true;
    return dmg;
  }

  // Отряд: живые союзники, стоящие ВПЛОТНУЮ к текущему монстру. Раньше
  // сюда попадали все, кто делил с ним клетку, поэтому подкрепление
  // «появлялось из ниоткуда» уже после смерти ведущего. Теперь в бой
  // вступают только те, кого игрок видит рядом.
  function squadMembersOf(enemy) {
    if (!enemy || !enemy.squadId || !G.enemies) return [];
    return G.enemies.filter(
      (e) =>
        e !== enemy &&
        e.squadId === enemy.squadId &&
        e.hp > 0 &&
        Math.max(Math.abs(e.x - enemy.x), Math.abs(e.y - enemy.y)) <= 1
    );
  }

  function squadAliveCount(b) {
    if (!b || !b.squad) return 0;
    return b.squad.filter((e) => e.hp > 0).length;
  }

  // Герой встал на клетку отряда: бой идёт по очереди, но уйти нельзя,
  // пока жив хоть один. Выбил первого — в бой вступает следующий.
  function nextSquadEnemy(b) {
    const alive = b.squad.filter((e) => e.hp > 0);
    return alive.length ? alive[0] : null;
  }

  function enemyTurn() {
    const px = G.playerPos.x;
    const py = G.playerPos.y;
    for (const e of G.enemies.slice()) {
      if (e.hp <= 0) continue;
      if (e.trapHold > 0) {
        e.trapHold -= 1;
        continue;
      }
      // Страж не сходит с поста и не бродит: бьёт, только когда герой
      // подошёл (дальнобойный — на расстояние выстрела по прямой).
      if (e.guard) {
        const reach = e.range || 1;
        const d = Math.hypot(e.x - px, e.y - py);
        if (d <= reach && (reach === 1 || hasLineOfSight(e.x, e.y, px, py))) return e;
        continue;
      }
      const leader = squadLeaderOf(e);
      // Отряд идёт по своим клеткам, а не телепортом на клетку ведущего:
      // раньше весь отряд переставлялся одним moveSquadTo, и после смерти
      // ведущего монстры «появлялись из ниоткуда» на его месте.
      // Ведомые подтягиваются к ведущему, пока герой далеко, и только
      // ведущий решает, когда отряд бьёт.
      if (leader !== e) {
        // Ведомый вплотную к герою бьёт сам. Раньше он молча стоял и ждал
        // ведущего, а ведущий в узком коридоре упирался в него же: отряд
        // замирал, и до героя не доходил никто.
        const reach = e.range || 1;
        if (Math.hypot(e.x - px, e.y - py) <= reach) {
          if (reach > 1 && !hasLineOfSight(e.x, e.y, px, py)) continue;
          return e;
        }
        if (Math.hypot(leader.x - e.x, leader.y - e.y) <= 1.5) continue;
        const close = stepToward(e, leader.x, leader.y);
        if (close) moveEnemyTo(e, close.x, close.y);
        continue;
      }
      const dist = Math.hypot(e.x - px, e.y - py);
      const range = e.range || 1;
      // Дальнобойный держит дистанцию: если подошёл вплотную — отходит
      // на свою дальность и бьёт оттуда, а не лезет на героя.
      if (range > 1 && dist <= range) {
        // Стена между монстром и героем: стрелять нельзя, надо обойти.
        if (!hasLineOfSight(e.x, e.y, px, py)) {
          const around = stepToward(e, px, py);
          if (around) moveEnemyTo(e, around.x, around.y);
          continue;
        }
        if (dist < range) {
          const away = stepAwayFrom(e, px, py, range);
          if (away) {
            moveEnemyTo(e, away.x, away.y);
          }
        }
        return e;
      }
      if (dist > AGGRO_RADIUS + range - 1) {
        if (abilityOf(e) === "phasing" && Math.random() < (e.phaseChance == null ? 0.25 : e.phaseChance)) {
          if (phaseTeleport(e)) continue;
        }
        if (Math.random() < 0.25) {
          const w = wander(e);
          if (w) {
            moveEnemyTo(e, w.x, w.y);
          }
        }
        continue;
      }
      const step = stepToward(e, px, py);
      if (!step) continue;
      const nextDist = Math.hypot(step.x - px, step.y - py);
      if (range > 1) {
        // Подойти на свою дистанцию и остановиться. Если шаг всё равно
        // оставил бы дальше нужного — не делаем его вовсе, иначе прицел
        // ушёл бы от игрока вместо того, чтобы подойти.
        if (nextDist <= range && nextDist < dist) {
          moveEnemyTo(e, step.x, step.y);
          // Шаг мог привести вплотную к стене, за которой стоит герой:
          // подошёл — но выстрела всё равно нет.
          if (!hasLineOfSight(e.x, e.y, px, py)) continue;
          return e;
        }
        continue;
      }
      // Жадный шаг увёл бы монстра дальше от героя: значит, короткий путь
      // закрыт стеной. Раньше он в этом случае просто стоял на месте и до
      // героя не доходил никогда, сколько бы ходов ни прошло. Теперь идём
      // первым шагом настоящего пути — в обход.
      if (nextDist >= dist) {
        const around = detourStep(e, px, py);
        if (around) moveEnemyTo(e, around.x, around.y);
        continue;
      }
      if (step.x === px && step.y === py) return e;
      moveEnemyTo(e, step.x, step.y);
    }
    return null;
  }

  // Ведущий отряда — первый по squadIdx, иначе сам монстр.
  function squadLeaderOf(e) {
    if (!e.squadId || !G.enemies) return e;
    let lead = e;
    G.enemies.forEach((o) => {
      if (o.squadId === e.squadId && (o.squadIdx || 0) < (lead.squadIdx || 0)) lead = o;
    });
    return lead;
  }

  // Переставить ОДНОГО монстра. Отряд больше не телепортируется целиком:
  // каждый участник ходит сам, иначе все трое возникают на одной клетке.
  // Монстры, кроме боссов, тоже наступают на ловушки. Босс слишком большой,
  // чтобы провалиться в яму или зацепиться за цепь; обычный моб — нет.
  function triggerEnemyTrap(e, x, y) {
    if (!e || e.boss) return;
    const trap = trapAt(x, y);
    if (!trap || trap.armed === false) return;
    const type = trapByKey(trap.kind);
    if (!type) return;
    trap.armed = false;
    if (type.damage > 0) {
      const dmg = Math.max(1, Math.round(e.maxHp * 0.15 + type.damage));
      e.hp = Math.max(0, e.hp - dmg);
      log(e.name + " попал в ловушку «" + type.name + "»: −" + dmg + " здоровья.", "fight");
      if (e.hp <= 0) defeatEnemy(e);
    } else {
      e.trapHold = Math.max(e.trapHold || 0, 2);
      log(e.name + " запутался в ловушке «" + type.name + "» и пропускает ход.", "fight");
    }
  }

  function moveEnemyTo(e, x, y) {
    e.x = x;
    e.y = y;
    triggerEnemyTrap(e, x, y);
  }

  // Отойти от цели на дистанцию range, не наступая на занятые клетки.
  function stepAwayFrom(e, px, py, range) {
    const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    let best = null;
    let bestDist = Math.hypot(e.x - px, e.y - py);
    dirs.forEach(([dx, dy]) => {
      const x = e.x + dx;
      const y = e.y + dy;
      if (tileBlockedForEnemy(x, y, e)) return;
      const d = Math.hypot(x - px, y - py);
      if (d > bestDist && d <= range + 1) {
        bestDist = d;
        best = { x, y };
      }
    });
    return best;
  }

  function phaseTeleport(e) {
    for (let i = 0; i < 12; i++) {
      const x = rand(0, G.map.w - 1);
      const y = rand(0, G.map.h - 1);
      const d = Math.hypot(x - G.playerPos.x, y - G.playerPos.y);
      if (d > 4) continue;
      // tileBlockedForEnemy клетку героя не блокирует (туда враг идёт бить),
      // поэтому призрак мог «появиться» прямо в герое.
      if (x === G.playerPos.x && y === G.playerPos.y) continue;
      if (tileBlockedForEnemy(x, y, e)) continue;
      e.x = x;
      e.y = y;
      return true;
    }
    return false;
  }

  function descend() {
    if (G.player && G.player.snared) return;
    cancelWalk();
    // Боссовый этаж обычного забега — последний: за драконом стены нет.
    // В бесконечном режиме за драконом спуск продолжается.
    if (floorDef(G.floorIndex).finalBoss && !runIsEndless()) {
      victory();
      return;
    }
    // Затвор глубины: на шестом этаже спуск запечатан, пока у героя нет
    // оберега из деревни. Это и есть главный замок игры — первый поход
    // кончается здесь, а не на драконе, и открывает глубину не удача, а
    // восстановленная кузница.
    if (!canDescend()) {
      const message = sealMessage();
      setMsg(message);
      log(message, "floor");
      toast(message, 7000);
      return;
    }
    snapshotCurrent();
    const next = G.floorIndex + 1;
    // visited пополняет activateFloor — там же показывается эпиграф этажа.
    // Чистый этаж засчитывается только один раз: подъём наверх и повторный
    // спуск не должны бесконечно кормить задание «без единой ошибки».
    if (!G.visited.has(next)) {
      G.stats.floorsCleared += 1;
      // Отметку ошибок ведёт activateFloor, здесь только сверка.
      if (G.stats.wrong === (G.questFloorWrong || 0)) bumpQuest("nomiss", 1);
    }
    // Этаж генерируется и проверяется на компьютере игрока под оверлеем:
    // сообщения пишем после того, как карта готова, иначе они относятся
    // ещё к прошлому этажу.
    activateFloorLoaded(next, () => {
      log("Ты спускаешься на этаж " + (next + 1) + ": " + floorNameAt(next) + ".", "floor");
      setMsg("Этаж " + (next + 1) + ". Монстров: " + G.enemies.length);
    });
  }

  function ascend() {
    if (G.player && G.player.snared) return;
    cancelWalk();
    if (G.floorIndex === 0) return;
    snapshotCurrent();
    const prev = G.floorIndex - 1;
    activateFloorLoaded(prev, () => {
      log("Ты поднимаешься на этаж " + (prev + 1) + ": " + floorNameAt(prev) + ".", "floor");
      setMsg("Возвращение на этаж " + (prev + 1) + ".");
    });
  }

  // ---------- Бой ----------

  function openBattle(enemy) {
    // Бой прерывает маршрут, набранный кликом.
    endWalk();
    cancelBattleClose();
    markCodex("enemies", enemy.key);
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
      cursed: false,
      drainHeal: 0,
      thorns: 0,
      blocked: false,
      poisonTick: 0,
      // Отряд: остальные монстры с той же клетки. Пока жив хоть один,
      // герой не может уйти с клетки боя.
      squad: squadMembersOf(enemy),
      squadNext: null,
      rangedShot: false,
      rangedCdMsg: "",
      rangedCd: 0,
      // Метки «что сработало в этом ударе»: их читает applyAttack, чтобы
      // показать игроку крит и добивание. Держим здесь, а не в момент
      // сброса, иначе до первого удара поле остаётся undefined.
      critHit: 0,
      executed: false,
      quality: null,
      qualityMul: 1,
      blockLeft: null,
      quip: typeof enemyQuip === "function" ? enemyQuip(enemy.key) : "",
      // Первые секунды боя — заставка, пока камера подъезжает. Повторная
      // отрисовка боя не должна запускать её заново.
      showIntro: true,
      introTimer: 0,
      results: null
    };
    const ab = abilityOf(enemy);
    if (ab === "curse" && Math.random() < (enemy.curseChance == null ? 0.35 : enemy.curseChance)) {
      G.battle.cursed = true;
    }
    // Жрица лечит этаж при входе в бой: тактика появляется сама — сначала
    // лекаря, потом остальных.
    if (ab === "heal") healFloorAllies(enemy);
    if (ab === "poison" && !equippedEffect("poisonImmune")) {
      // Элитный паук добавляет яд сразу двумя ходами.
      G.player.poison = Math.min(3, (G.player.poison || 0) + 1 + (enemy.poisonBonus || 0));
    }
    if (ab === "fire") {
      // Рост урона от боя к бою не должен копиться в самом поле врага:
      // держим масштаб рядом с боем, иначе демон после этажа бьёт
      // в разы сильнее заявленного.
      enemy.fireScale = (enemy.fireScale || 1) * (enemy.fireMul || 1.15);
    }
    // Дальнобойный бьёт слабее, зато не лезет вплотную. Считаем урон от
    // базы заново: и огонь демона, и прицел мыши должны сходиться
    // в одном месте, иначе бой с демоном-прицелом бьёт в разы сильнее.
    if ((enemy.range || 1) > 1) {
      enemy.shotScale = RANGED.dmgScale;
    }
    enemy.dmg = Math.max(
      1,
      Math.round(enemy.baseDmg * (enemy.fireScale || 1) * (enemy.shotScale || 1))
    );
    G.battle.rangedCd = 0;
    nextChallenge();
    const box = el("battle-box");
    if (box) box.classList.remove("panel-open");
    renderBattle();
    el("battle-overlay").classList.remove("hidden");
    document.body.classList.add("battling");
    startBattleCamera();
    requestAnimationFrame(() => {
      if (G.battle) box.classList.add("panel-open");
    });
    // Кнопка действия и «Пропустить ход» не должны висеть поверх боя.
    updateActionButton();
    requestAnimationFrame(() => {
      if (G.running && G.map) updateCamera();
    });
  }

  // В отряде бой идёт по очереди: выбил одного — вступает следующий.
  // Сброс боевых меток обязателен, иначе «отравление» или «проклятие»
  // предыдущего монстра перейдут к следующему.
  function startSquadMember(b, e) {
    b.enemy = e;
    b.challenge = null;
    b.feedback = "";
    b.explanation = "";
    b.good = false;
    b.won = false;
    b.playerDead = false;
    b.cursed = false;
    b.drainHeal = 0;
    b.thorns = 0;
    b.blocked = false;
    b.poisonTick = 0;
    b.critHit = 0;
    b.executed = false;
    b.quality = null;
    b.qualityMul = 1;
    b.blockLeft = null;
    b.quip = typeof enemyQuip === "function" ? enemyQuip(e.key) : "";
    b.showIntro = true;
    b.results = null;
    b.squadNext = null;
    b.rangedShot = false;
    b.rangedCdMsg = "";
    b.squad = squadMembersOf(e);
    const ab = abilityOf(e);
    if (ab === "curse" && Math.random() < (e.curseChance == null ? 0.35 : e.curseChance)) {
      b.cursed = true;
    }
    if (ab === "poison" && !equippedEffect("poisonImmune")) {
      G.player.poison = Math.min(3, (G.player.poison || 0) + 1 + (e.poisonBonus || 0));
    }
    if (ab === "fire") {
      e.fireScale = (e.fireScale || 1) * (e.fireMul || 1.15);
    }
    if ((e.range || 1) > 1) {
      e.shotScale = RANGED.dmgScale;
    }
    e.dmg = Math.max(
      1,
      Math.round(e.baseDmg * (e.fireScale || 1) * (e.shotScale || 1))
    );
    b.rangedCd = 0;
  }

  function pickQuestion() {
    const { qmin, qmax } = floorLevels();
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

  // Сгенерированные задания (variants.js, practice-variants.js) после
  // перезагрузки страницы собираются заново и с другим содержимым: по id
  // призрак нашёл бы чужое задание или никакого. Такое задание кладём в
  // очередь целиком.
  function pushMissed(kind, item) {
    if (kind !== "mc" && kind !== "fill" && kind !== "error") return;
    if (!item) return;
    if (!G.missed.some((m) => m.kind === kind && m.id === item.id)) {
      G.missed.push(item.generated ? { kind: kind, id: item.id, item: item } : { kind: kind, id: item.id });
      if (G.missed.length > 20) G.missed.shift();
    }
  }

  function findPayload(p) {
    if (p.item && Array.isArray(p.item.options)) return p.item;
    if (p.kind === "mc") return QUESTIONS.find((q) => q.id === p.id) || null;
    if (p.kind === "fill") return FILL_TASKS.find((t) => t.id === p.id) || null;
    if (p.kind === "error") return ERROR_TASKS.find((t) => t.id === p.id) || null;
    return null;
  }

  // ---------- Учебный бой: «вспомни → примени» ----------
  // Бой — маленький урок одной темы. Первый шаг — вспомнить правило (вопрос
  // с вариантами), следующий — сразу применить его на той же теме: вставить
  // пропущенное, найти ошибку, переписать код или написать функцию. Дальше
  // шаги чередуются. Раньше вопросы и задания выпадали вперемешку, и ничто
  // не связывало «вспомнил» с «применил».

  // ---------- Калибровка стартового уровня ----------
  // Шесть вопросов из общего банка: по два уровня 1, 2 и 3. Вес верного
  // ответа равен уровню вопроса, поэтому «вытянуть» третий уровень
  // угадыванием двух сложных вопросов не выйдет.
  const CALIBRATION_IDS = [1, 6, 16, 55, 23, 35];
  const KNOWLEDGE_TITLES = { 1: "Новичок", 2: "Базовый", 3: "Уверенный" };
  const KNOWLEDGE_NOTES = {
    1: "Задания будут на ступень проще: больше «вставь пропуск» и «повтори код».",
    2: "Обычная выдача: вопросы и задания этажа без поправки.",
    3: "Задания будут на ступень сложнее: чаще функции и разбор кода."
  };

  function calibrationQuestions() {
    const byId = {};
    QUESTIONS.forEach((q) => { byId[q.id] = q; });
    return CALIBRATION_IDS.map((id) => byId[id]).filter(Boolean);
  }

  // 0–3 балла — новичок, 4–6 — базовый, 7–12 — уверенный. Один верный
  // ответ третьего уровня (3 балла) сам по себе уровень не поднимает:
  // нужны ещё базовые знания.
  function calibrationLevelFor(score) {
    const s = Math.max(0, Math.min(12, Math.floor(Number(score) || 0)));
    if (s <= 3) return 1;
    if (s <= 6) return 2;
    return 3;
  }

  function knowledgeFor(name) {
    if (typeof getProfile !== "function") return null;
    const prof = getProfile(name || accountName());
    return prof ? normalizeKnowledge(prof.knowledge) : null;
  }

  function knowledgeLevel(name) {
    const k = knowledgeFor(name);
    return k && k.level >= 1 ? k.level : 2;
  }

  function knowledgeTitle(level) {
    return KNOWLEDGE_TITLES[level] || KNOWLEDGE_TITLES[2];
  }

  // Поправка к уровню вопросов: −1 для новичка, 0 для базового, +1 для
  // уверенного. Дальше floorLevels сам зажимает результат в 1–4.
  function knowledgeOffset() {
    const level = G.knowledgeLevel || 2;
    return clamp(level - 2, -1, 1);
  }

  // Уровни вопросов этажа с поправкой на сложность и калибровку.
  function floorLevels() {
    const f = floorDef(G.floorIndex);
    const qb = DIFFICULTY[G.difficulty].qBonus;
    const kb = knowledgeOffset();
    const qmin = clamp(f.qmin + qb + kb, 1, 4);
    const qmax = clamp(f.qmax + qb + kb, qmin, 4);
    return { qmin: qmin, qmax: qmax };
  }

  // Учебная память похода: на каком этаже тема встречалась в последний раз
  // и когда выдавалось каждое практическое задание.
  function learnState() {
    if (!G.learn || typeof G.learn !== "object") G.learn = {};
    if (!G.learn.topicSeen) G.learn.topicSeen = {};
    if (!G.learn.practiceUsed) G.learn.practiceUsed = {};
    if (!Array.isArray(G.learn.practiceRecent)) G.learn.practiceRecent = [];
    if (!G.learn.questionSeen) G.learn.questionSeen = {};
    if (!(G.learn.tick >= 0)) G.learn.tick = 0;
    return G.learn;
  }

  // Тема боя. С третьего этажа часть боёв — повторение: тема прошлых этажей,
  // где больше ошибок и что дольше не встречалась. Остальные бои — тема
  // уровня этажа, с перевесом в пользу «Темы этажа» из планки входа.
  function pickBattleTopic(b) {
    const learn = learnState();
    const { qmin, qmax } = floorLevels();
    const past = Object.keys(learn.topicSeen)
      .filter((t) => TOPICS[t] && learn.topicSeen[t] < G.floorIndex);
    if (G.floorIndex >= LEARN.reviewFrom && past.length && Math.random() < LEARN.reviewChance) {
      const ts = (G.stats && G.stats.topicStats) || {};
      const weights = past.map((t) => {
        const s = ts[t];
        const miss = s && s.total ? 1 - s.correct / s.total : 0.5;
        return 0.2 + miss * 2 + (G.floorIndex - learn.topicSeen[t]) * 0.3;
      });
      b.review = true;
      return pickWeighted(past, weights, Math.random());
    }
    const counts = {};
    QUESTIONS.forEach((q) => {
      if (q.level >= qmin && q.level <= qmax) counts[q.topic] = (counts[q.topic] || 0) + 1;
    });
    const epi = typeof floorEpilogue === "function" ? floorEpilogue(G.floorIndex) : null;
    if (epi && counts[epi.topic] && Math.random() < LEARN.floorTopicChance) return epi.topic;
    const topics = Object.keys(counts);
    if (!topics.length) return null;
    return pickWeighted(topics, topics.map((t) => counts[t]), Math.random());
  }

  // «Вспомни»: вопрос темы боя, не повторяя вопросов этого боя. В бою
  // повторения — любого пройденного уровня. Из подходящих берём самый
  // давний за поход: раньше вопрос выпадал наугад, и на теме, где вопросов
  // мало, один и тот же за поход задавали до семи раз.
  function recallChallenge(b) {
    const { qmin, qmax } = floorLevels();
    const lo = b.review ? 1 : qmin;
    let pool = QUESTIONS.filter((q) => q.topic === b.topic && q.level >= lo && q.level <= qmax);
    if (!pool.length) pool = QUESTIONS.filter((q) => q.topic === b.topic);
    if (!pool.length) return null;
    const asked = b.asked || (b.asked = []);
    const fresh = pool.filter((q) => asked.indexOf(q.id) < 0 && q.id !== G.lastQId);
    const from = fresh.length ? fresh : pool;
    const learn = learnState();
    const seenAt = learn.questionSeen;
    // Вопрос узнают по тексту и коду, а не по номеру: варианты из
    // variants.js после перезагрузки страницы получают те же номера с
    // другим содержимым.
    const keyOf = (q) => shopHash(q.text + "|" + (q.code || "")).toString(36);
    const q = shuffle(from.slice()).sort((x, y) => (seenAt[keyOf(x)] || 0) - (seenAt[keyOf(y)] || 0))[0];
    learn.tick += 1;
    seenAt[keyOf(q)] = learn.tick;
    asked.push(q.id);
    G.lastQId = q.id;
    return { type: "mc", question: q };
  }

  // Практические задания вида kind с темой и уровнем. «Вставь пропущенное»
  // и «найди ошибку» несут их сами, «повтори код» и «напиши функцию» — в
  // TASK_META (task-meta.js). В тот же список идут шаблоны генератора
  // (practice-variants.js): у них gen — имя шаблона, а само задание
  // собирается, когда шаблон выпал. key — по нему считается очередь.
  function practiceTasks(kind) {
    const meta = typeof window !== "undefined" ? window.TASK_META : null;
    const gen = typeof window !== "undefined" ? window.PracticeVariants : null;
    let list = [];
    if (kind === "fill") list = FILL_TASKS.map((t) => ({ t: t, topic: t.topic, level: t.level || 2 }));
    if (kind === "error") list = ERROR_TASKS.map((t) => ({ t: t, topic: t.topic, level: t.level || 2 }));
    if (kind === "copy") {
      list = COPY_TASKS.map((t, i) => ({
        t: t,
        topic: meta ? meta.taskTopic("copy", t.id) : "syntax",
        level: meta ? meta.taskLevel("copy", i) : 2
      }));
    }
    if (kind === "code") {
      list = CODE_TASKS.map((t) => ({ t: t, topic: meta ? meta.taskTopic("code", t.id) : "functions", level: 3 }));
    }
    list.forEach((p) => {
      p.key = p.t.id;
    });
    if (gen && gen.list) {
      // Проверки задания генератора рождаются на клиенте, поэтому сервер не
      // может отличить настоящую проверку от подделки. Пока серверного
      // генератора нет, такие задания на код не выдаются (флаг с сервера).
      const genCode = !(typeof window !== "undefined" && window.__PYQUIZ_FEATURES &&
        window.__PYQUIZ_FEATURES.generatedCode === false);
      gen.list.forEach((g) => {
        if (g.kind === kind && (g.kind !== "code" || genCode)) {
          list.push({ t: null, gen: g.key, key: "gen:" + g.key, topic: g.topic, level: g.level });
        }
      });
    }
    return list;
  }

  // Сколько последних практических заданий игра помнит, чтобы не выдать то
  // же самое ещё раз. Поход — это 80–100 заданий «примени», поэтому задание
  // банка за поход обычно выпадает один раз.
  const PRACTICE_RECENT = 120;

  // Задание в памяти — по тому, что ученик узнаёт в лицо: по коду, а у
  // «напиши функцию» — по условию. Номер не годится: генератор может
  // собрать ровно тот код, что лежит в банке, и для ученика это повтор.
  function practiceSeenKey(kind, task) {
    const text = task.code || (task.task || "") + "|" + (task.starter || "");
    return kind + ":" + shopHash(text).toString(36);
  }

  // «Примени»: практика на тему боя. Вид — по весам сложности (на «Лёгком»
  // нет «найди ошибку» и «напиши функцию»), задание — не сложнее этажа больше
  // чем на ступень и самое давнее из подходящих: задания банка и шаблоны
  // генератора идут по кругу, а уже виденное недавно не повторяется, пока
  // есть что-то другое. null — практики по теме нет.
  function practiceChallenge(b) {
    const d = DIFFICULTY[G.difficulty];
    const { qmin, qmax } = floorLevels();
    // И не проще этажа больше чем на ступень, если есть из чего выбрать:
    // на последних этажах print(___) из первой пещеры — уже не практика.
    // Бой повторения берёт задания любого пройденного уровня.
    const lo = b.review ? 1 : qmin - 1;
    const weights = { fill: d.wFill || 0, error: d.wError || 0, copy: d.wCopy || 0, code: d.wCode || 0 };
    // Код проверяет сервер. Если он запущен с --no-code, проверить решение
    // некому: раньше герой гарантированно получал удар за каждую такую задачу.
    if (G.codeCheck === false) weights.code = 0;
    const learn = learnState();
    const used = learn.practiceUsed;
    const recent = learn.practiceRecent;
    const kinds = [];
    const fits = {};
    Object.keys(weights).forEach((kind) => {
      if (!(weights[kind] > 0)) return;
      const list = practiceTasks(kind).filter((p) => p.topic === b.topic && p.level <= qmax + 1);
      if (list.length) {
        const near = list.filter((p) => p.level >= lo);
        kinds.push(kind);
        fits[kind] = near.length ? near : list;
      }
    });
    if (!kinds.length) return null;
    // Самое давнее первым: задания банка и шаблоны генератора идут по кругу.
    const byAge = (kind) => shuffle(fits[kind].slice())
      .sort((x, y) => (used[kind + ":" + x.key] || 0) - (used[kind + ":" + y.key] || 0));
    // Вид выпадает по весам. Если в нём по теме всё уже было недавно (у
    // «напиши функцию» условия быстро кончаются), пробуем следующий вид.
    // Шаблон с небольшим выбором чисел изредка повторяет недавний вариант —
    // тогда он собирает задание ещё раз, а потом очередь идёт дальше.
    const pool = kinds.slice();
    let kind = null;
    let chosen = null;
    let task = null;
    let firstKind = null;
    while (pool.length && !task) {
      const k = pickWeighted(pool, pool.map((x) => weights[x]), Math.random());
      pool.splice(pool.indexOf(k), 1);
      if (!firstKind) firstKind = k;
      const order = byAge(k);
      for (let i = 0; i < order.length && !task; i++) {
        for (let tries = 0; tries < (order[i].t ? 1 : 4) && !task; tries++) {
          const t = order[i].t || window.PracticeVariants.make(order[i].gen);
          if (t && recent.indexOf(practiceSeenKey(k, t)) < 0) {
            kind = k;
            chosen = order[i];
            task = t;
          }
        }
      }
    }
    // Всё подходящее уже было недавно — берём самое давнее из выпавшего вида.
    if (!task) {
      kind = firstKind;
      chosen = byAge(kind)[0];
      task = chosen.t || window.PracticeVariants.make(chosen.gen);
    }
    if (!task) return null;
    learn.tick += 1;
    used[kind + ":" + chosen.key] = learn.tick;
    recent.push(practiceSeenKey(kind, task));
    if (recent.length > PRACTICE_RECENT) recent.splice(0, recent.length - PRACTICE_RECENT);
    if (kind === "copy") return { type: "copy", task: task, code: "", results: null };
    if (kind === "code") return { type: "code", task: task, code: task.starter, results: null };
    return { type: kind, task: task };
  }

  // Прежний выбор вслепую по весам сложности — запасной путь, если у боя
  // нет темы (банк вопросов пуст).
  function rolledChallenge() {
    const d = DIFFICULTY[G.difficulty];
    const roll = Math.random();
    let type = "mc";
    let acc = d.wMc;
    if (roll < acc) type = "mc";
    else if (roll < (acc += d.wCopy)) type = "copy";
    else if (roll < (acc += (d.wFill || 0))) type = "fill";
    else if (roll < (acc += (d.wError || 0))) type = "error";
    else if (d.wCode > 0) type = "code";
    // «Повтори код» игра проверяет сама, а код — только сервер.
    if (type === "code" && G.codeCheck === false) type = "copy";
    if (type === "copy") return { type: "copy", task: pickCopyTask(), code: "", results: null };
    if (type === "fill") return { type: "fill", task: pickFillTask() };
    if (type === "error") return { type: "error", task: pickErrorTask() };
    if (type === "code") {
      const task = pickCodeTask();
      return { type: "code", task, code: task.starter, results: null };
    }
    return { type: "mc", question: pickQuestion() };
  }

  function nextChallenge() {
    const b = G.battle;
    const step = b.step || 0;
    b.step = step + 1;
    let c = null;

    // Призрак ошибки начинает бой с задания, на котором ученик ошибся, а
    // дальше бой идёт по теме этого задания: вспомнил — примени.
    const payload = b.enemy.payload;
    if (payload && step === 0) {
      const item = findPayload(payload);
      if (item) {
        c = payload.kind === "mc" ? { type: "mc", question: item } : { type: payload.kind, task: item };
        if (item.topic) b.topic = item.topic;
      }
    }
    if (!c) {
      if (!b.topic) b.topic = pickBattleTopic(b);
      if (b.topic && step % 2 === 1) c = practiceChallenge(b);
      if (!c && b.topic) c = recallChallenge(b);
      if (!c) c = rolledChallenge();
    }
    if (b.topic) learnState().topicSeen[b.topic] = G.floorIndex;
    b.challenge = c;
    attachChoices(b.challenge);
    b.phase = "question";
    b.feedback = "";
    b.explanation = "";
    b.results = null;
  }

  function attachChoices(c) {
    if (!c || (c.type !== "mc" && c.type !== "fill" && c.type !== "error")) return;
    const item = c.question || c.task;
    if (!item) return;
    // Проклятие с плиты действует ровно на один вопрос с вариантами.
    if (G.player.cursedNext) {
      c.cursedNext = true;
      G.player.cursedNext = false;
    }
    if (c.cursedNext) {
      // Проклятая плита: варианты выстраиваются по алфавиту, чтобы
      // правильный ответ не выдавался случайным положением.
      c.view = alphabeticalChoices(item.options, item.answer);
    } else {
      c.view = shuffleChoices(item.options, item.answer);
    }
  }

  // Тот же контракт, что у shuffleChoices, но без случайности.
  function alphabeticalChoices(options, answer) {
    const order = options
      .map((text, i) => i)
      .sort((a, b) => String(options[a]).localeCompare(String(options[b]), "ru"));
    return {
      options: order.map((i) => options[i]),
      answer: order.indexOf(answer),
      order: order
    };
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

  // Качество ответа решает силу удара: сильный ответ — сильный удар.
  // Метка ставится в момент проверки (mcDamage/checkCopy/checkCode),
  // а читается и гасится в applyAttack.
  function setQuality(kind) {
    const b = G.battle;
    if (!b) return kind;
    if (b.quality && qualityRank(b.quality) > qualityRank(kind)) return b.quality;
    b.quality = kind;
    b.qualityMul = QUALITY[kind] ? QUALITY[kind].mul : 1;
    return kind;
  }

  function qualityRank(kind) {
    return kind === "perfect" ? 3 : kind === "near" ? 2 : kind === "hinted" ? 1 : 0;
  }

  function qualityLabelFor(kind) {
    return QUALITY[kind] ? QUALITY[kind].label : "";
  }

  function playerAttackPower() {
    let power = G.player.dmgBase + G.player.level * 4 + G.player.atkBonus;
    const exec = equippedEffect("execute");
    const e = G.battle && G.battle.enemy;
    if (exec && exec.pct && e && e.hp < e.maxHp * 0.3) {
      power = Math.round(power * (1 + exec.pct / 100));
      // Помечаем, чтобы applyAttack показал, откуда взялась сила удара.
      if (G.battle) G.battle.executed = true;
    }
    return power;
  }

  // Серия верных ответов подряд поднимает удар: награда за старание
  // накапливается, но не делает игрока бессмертным.
  function streakMul() {
    const s = Math.min(STREAK_CAP, (G.stats && G.stats.streak) || 0);
    return 1 + s * STREAK_STEP;
  }

  function bonusMulFor(kind) {
    const b = G.battle;
    if (!b) return 1;
    const q = QUALITY[kind] ? QUALITY[kind].mul : 1;
    const hinted = !!(b.challenge && b.challenge.hintUsed);
    // Подсказка не даёт ударить сильнее cap, но и не подтягивает слабый
    // ответ вверх: раньше здесь стоял Math.max(q, HINT_CAP), из-за чего
    // «частичный» ответ (1.0) и ответ с подсказкой (1.15) били одинаково.
    return hinted ? Math.min(q, HINT_CAP) : q;
  }

  // Множитель типа задания: переписывание кода бьёт заметно сильнее выбора.
  function taskPowerMul() {
    const ch = G.battle && G.battle.challenge;
    return (ch && TASK_POWER[ch.type]) || 1;
  }

  // Итоговый множитель удара: качество ответа × серия верных ответов.
  function attackMulFor(kind) {
    return bonusMulFor(kind) * streakMul();
  }

  function critRoll() {
    const crit = equippedEffect("crit");
    // Комплект тени умеет добавлять шанс крита даже без предмета с критом.
    const chance = (crit && crit.chance ? crit.chance : 0) + setBonusTotal("crit");
    const mul = crit && crit.mul ? crit.mul : 2;
    if (chance > 0 && Math.random() < chance) {
      if (G.battle) G.battle.critHit = mul;
      return mul;
    }
    return 1;
  }

  function mcDamage(level) {
    const kind = setQuality("perfect");
    return Math.round(
      (playerAttackPower() * bonusMulFor(kind) + level * 6 + rand(0, 5)) *
        streakMul() *
        critRoll() *
        taskPowerMul()
    );
  }

  function codeDamage(kind) {
    const q = setQuality(kind || "perfect");
    return Math.round(
      (playerAttackPower() * 2 * bonusMulFor(q) + 10) *
        streakMul() *
        critRoll() *
        taskPowerMul()
    );
  }

  // Единая формула брони для всех источников урона: удара монстра, ловушки
  // и опасной среды. Возвращает процент снижения (0..ARMOR.cap).
  function armorMitigation() {
    const d = Math.max(0, (G.player && G.player.defBonus) || 0);
    return Math.min(ARMOR.cap, d / (d + ARMOR.soft));
  }

  // Применяет броню к «сырому» урону. Герой всегда получает хотя бы 1:
  // иначе хорошо одетый игрок мог бы стоять в лаве бесконечно.
  function armorDamage(raw) {
    const value = Math.max(0, Math.round(raw));
    return Math.max(1, Math.round(value * (1 - armorMitigation())));
  }

  // Множитель удара врага за n-ю ошибку подряд: 1, 1 + шаг, 1 + 2 шага… до потолка.
  function missMul(n) {
    return Math.min(MISS_CAP, 1 + MISS_STEP * Math.max(0, (n || 1) - 1));
  }

  // hitMul — доля удара врага. Единица у обычного промаха, меньше — при
  // обороне (герой закрылся) и при отступлении (враг бьёт вослед).
  function playerTakeHit(hitMul) {
    const b = G.battle;
    const e = b.enemy;
    const share = hitMul == null ? 1 : Math.max(0, hitMul);
    // Дальнобойный: между выстрелами есть перезарядка, иначе он бьёт
    // каждый ход и герой не успевает ни ответить, ни выпить зелье.
    if ((e.range || 1) > 1) {
      if ((b.rangedCd || 0) > 0) {
        b.rangedCd -= 1;
        if (b.rangedCd > 0) b.rangedCdMsg = "заряжается ещё " + b.rangedCd + ".";
        return 0;
      }
      b.rangedCd = RANGED.cooldown;
      b.rangedShot = true;
    }
    const mul = e.nextDmgMul && e.nextDmgMul > 0 ? e.nextDmgMul : 1;
    // «Тёмная сделка»: на этом этаже монстры бьют заметно сильнее.
    const deal = curseDmgMul();
    // Ошибка подряд в этом бою бьёт сильнее (см. MISS_STEP).
    const miss = missMul(b.missStreak || 1);
    const raw = Math.round((e.dmg + (e.dmgBoost || 0)) * mul * deal * miss * share) + rand(0, 3);
    // Постоянное улучшение «Броня» гасит долю каждого удара. Считается после
    // защиты снаряжения и до блока: блок — это полный пропуск удара.
    const cut = progOf("armor");
    let dmg = armorDamage(raw);
    if (cut > 0) dmg = Math.max(0, Math.round(dmg * (1 - Math.min(0.8, cut))));
    const block = equippedEffect("block");
    if (block && block.charges) {
      if (G.battle.blockLeft == null) G.battle.blockLeft = block.charges;
      if (G.battle.blockLeft > 0) {
        G.battle.blockLeft -= 1;
        G.battle.blocked = true;
        dmg = 0;
        effectFlash("Блок · осталось " + G.battle.blockLeft);
      }
    }
    if (devGod()) dmg = 0;
    G.player.hp = Math.max(0, G.player.hp - dmg);
    if (G.player.hp === 0) G.battle.playerDead = true;
    // Пункт 3: шипы больше НЕ ранят врага в ответ на твой промах. Раньше
    // неверный ответ всё равно отнимал у монстра здоровье, и бой можно было
    // выиграть, ошибаясь. Теперь шипы — добавка к твоему верному удару
    // (см. applyAttack), а промах бьёт только по герою.
    if (abilityOf(e) === "drain" && e.hp > 0) {
      // Элитный вампир забирает 70% урона вместо половины.
      const share = e.drainPct == null ? 0.5 : e.drainPct;
      const healed = Math.max(0, Math.min(Math.floor(dmg * share), e.maxHp - e.hp));
      if (healed > 0) {
        e.hp += healed;
        G.battle.drainHeal = (G.battle.drainHeal || 0) + healed;
      }
    }
    return dmg;
  }

  // Ключ со стража лестницы. Первый ключ — от амбара (с третьего этажа),
  // второй — от дома мастера (с пятого): без спуска деревню не поднять.
  // Ключ уходит в профиль и переживает смерть, как материалы.
  // Ключ от тайника: лежит на страже этажа, где есть тайник. Ключ походный,
  // а не профильный: тайник есть на каждом этаже свой.
  function dropVaultKey(floorIdx) {
    if (!G.vaultNeedsKey && !(G.vaults || []).length) return false;
    if (!(G.vaults || []).some((v) => v.locked)) return false;
    G.vaultKeys = (G.vaultKeys || 0) + 1;
    log("Со стража снят ключ от тайника. Ключей: " + G.vaultKeys + ".", "loot");
    toast("Ключ от тайника!");
    return true;
  }

  function dropGuardKey(floorIdx) {
    const want = [];
    if (floorIdx >= 2) want.push("barn");
    if (floorIdx >= 4) want.push("smith");
    let key = null;
    for (let i = 0; i < want.length; i += 1) {
      const k = want[i];
      if (hasKey(k)) continue;
      // Ключ нужен только пока постройка не восстановлена.
      if (villageLevel(k) > 0) continue;
      key = k;
      break;
    }
    if (!key) return;
    if (gainKey(key)) setMsg("Со стража снят " + keyName(key) + " — деревня ждёт.");
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

  // Выпад и вспышка в сцене боя: бьющий делает шаг вперёд, по битому
  // проходит вспышка, а число урона всплывает рядом с ним. Раньше число
  // летело в пустой угол карточки и ни к кому не относилось. Классы ставим
  // на саму сцену, поэтому повторная отрисовка боя их не оставляет.
  // Все поиски под защитой: в проверочном стенде querySelector даёт null.
  function strikeScene(box, side, text, kind) {
    if (!box) return;
    const scene = box.querySelector(".battle-scene");
    const arena = box.querySelector(".scene-arena");
    if (!scene || !arena) return;
    const onEnemy = side === "enemy";
    const target = box.querySelector(onEnemy ? ".fighter-enemy" : ".fighter-hero");
    scene.classList.remove("strike-enemy", "strike-hero");
    void scene.offsetWidth;
    scene.classList.add(onEnemy ? "strike-enemy" : "strike-hero");
    if (target) {
      target.classList.remove("fighter-flash");
      void target.offsetWidth;
      target.classList.add("fighter-flash");
      setTimeout(() => target.classList.remove("fighter-flash"), 600);
    }
    spawnFloat(target || arena, text, kind, 50, 4);
    setTimeout(() => scene.classList.remove("strike-enemy", "strike-hero"), 620);
  }

  function applyAttack(damage, message, counter, explanation, correct) {
    const b = G.battle;
    if (correct) sfx("correct");
    else if (counter) sfx("wrong");
    const e = b.enemy;
    const ability = abilityOf(e);
    // «Точный удар»: заряд удваивает следующий верный ответ. Промах заряда
    // не тратит — иначе умение наказывало бы за ошибку, которую оно и должно
    // помогать исправлять.
    let power = damage;
    if (b.strikeNext && correct) {
      power = Math.round(damage * ABILITY_STRIKE_MUL);
      b.strikeNext = false;
      message = message + " Точный удар!";
      effectFlash("Точный удар · ×" + ABILITY_STRIKE_MUL);
    }
    damage = power;
    b.explanation = explanation || "";
    // Флаги crit/execute выставили mcDamage/codeDamage при подсчёте урона —
    // снимаем их значения ДО сброса, иначе потеряем.
    const wasCrit = b.critHit || 0;
    const wasExecute = !!b.executed;
    const wasQuality = b.quality || null;
    const wasMul = b.qualityMul || 1;
    b.drainHeal = 0;
    b.thorns = 0;
    b.blocked = false;
    b.poisonTick = 0;
    b.critHit = 0;
    b.executed = false;
    b.quality = null;
    b.qualityMul = 1;
    b.rangedShot = false;
    b.rangedCdMsg = "";
    const parts = [message];
    let dealt = 0;
    let taken = 0;
    let hit = Math.max(0, damage);
    // Ошибки подряд: счёт растёт до удара врага, верный ответ его сбрасывает.
    if (counter) b.missStreak = (b.missStreak || 0) + 1;
    else if (damage > 0) b.missStreak = 0;
    if (hit > 0 && ability === "armor") {
      const absorbed = Math.floor(hit * (e.armorPct || 0.2));
      if (absorbed > 0) {
        hit = Math.max(1, hit - absorbed);
        parts.push("Каменная броня гасит " + absorbed + " урона.");
      }
    }
    // Щитоносец: щит гасит часть урона и не даёт отступить (см. canFlee).
    if (ability === "bulwark" && hit > 0) {
      const absorbed = Math.floor(hit * (e.elite ? 0.45 : 0.35));
      if (absorbed > 0) {
        hit = Math.max(1, hit - absorbed);
        parts.push("Щит «" + e.name + "» гасит " + absorbed + " урона.");
      }
    }
    if (ability === "charge" && hit > 0) {
      e.dmgBoost = Math.min(e.chargeCap || 10, (e.dmgBoost || 0) + (e.chargeStep || 2));
      parts.push("Минотавр накапливает силу: его удары станут сильнее.");
    }
    e.hp = Math.max(0, e.hp - hit);
    if (ability === "bossrage" && e.enraged && hit > 0 && e.hp > 0) {
      const healed = Math.max(1, Math.round(e.maxHp * (e.elite ? 0.12 : 0.08)));
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + healed);
      if (e.hp > before) parts.push("Дракон восстанавливает " + (e.hp - before) + " здоровья в ярости!");
    }
    // Тролль затягивает раны прямо в бою: его надо либо бить быстро, либо
    // не связываться вовсе.
    if (ability === "regen" && hit > 0 && e.hp > 0) {
      const healed = Math.max(1, Math.round(e.maxHp * (e.elite ? 0.14 : 0.08)));
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + healed);
      if (e.hp > before) parts.push("Тролль затягивает раны: +" + (e.hp - before) + ".");
    }
    // «Каменный дар»: монстры этажа затягивают раны после каждого
    // твоего удара — бонус героя оплачен их живучестью.
    const gift = blessingOnFloor();
    if (gift && gift.key === "blessing" && hit > 0 && e.hp > 0 && damage > 0) {
      const healed = Math.max(1, Math.round(hit * BLESS.blessingEnemyRegen));
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + healed);
      if (e.hp > before) {
        parts.push("«" + e.name + "» затягивает раны: +" + (e.hp - before) + " здоровья.");
      }
    }
    if (damage > 0) {
      dealt = hit;
      if (wasQuality === "perfect" && wasMul > 1) {
        parts.push("Точный ответ с первого раза — удар усилен.");
        effectFlash("Точный ответ · удар ×" + wasMul.toFixed(2));
      } else if (wasQuality && wasQuality !== "perfect" && wasMul < 1.5) {
        parts.push("Ответ с погрешностью — удар слабее.");
      }
      if (wasExecute) parts.push("Добивание: удар по раненому врагу усилен.");
      if (wasCrit > 1) parts.push("Критический удар ×" + wasCrit + "!");
      parts.push("Ты нанёс " + hit + " урона.");
      if (wasCrit > 1) effectFlash("Крит ×" + wasCrit);
      else if (wasExecute) effectFlash("Добивание · удар усилен");
      const ls = equippedEffect("lifesteal");
      const lsPct = (ls && ls.pct ? ls.pct : 0) + setBonusTotal("lifesteal");
      if (lsPct > 0) {
        const healed = Math.max(1, Math.round((hit * lsPct) / 100));
        const before = G.player.hp;
        G.player.hp = Math.min(G.player.maxHp, G.player.hp + healed);
        if (G.player.hp > before) {
          parts.push("Клинок тянет жизнь: +" + (G.player.hp - before) + " здоровья.");
          effectFlash("Вампиризм +" + (G.player.hp - before) + " HP");
        }
      }
      // Шипы на щите впиваются в того, кого ты бьёшь сам.
      const th = equippedEffect("thorns");
      if (th && th.pct) {
        const extra = Math.max(1, Math.round((hit * th.pct) / 100));
        e.hp = Math.max(0, e.hp - extra);
        dealt += extra;
        parts.push("Шипы на щите впиваются: " + extra + " урона.");
      }
    }
    if (e.hp <= 0) {
      defeatEnemy(e);
      b.won = true;
      // Отряд: победа над одним не отпускает героя, пока живы соседи.
      const nextSquad = nextSquadEnemy(b);
      if (nextSquad) {
        b.squadNext = nextSquad;
        parts.push(
          "Союзник рядом: в бой вступает «" + nextSquad.name + "»!"
        );
      } else if (b.squad && b.squad.length) {
        parts.push("Отряд повержен.");
      }
    } else {
      if (e.boss && !e.enraged && e.hp <= e.maxHp * 0.4) {
        e.enraged = true;
        e.dmg = Math.round(e.dmg * 1.5);
        if (ability === "bossrage") {
          e.nextDmgMul = Math.max(e.nextDmgMul || 1, 1.25);
        }
        parts.push("Враг впадает в ярость!");
      }
      if (counter) {
        // Ошибка — это и есть топливо некроманта: он поднимает слугу.
        if (ability === "summon") summonMinion(e);
        taken = playerTakeHit();
        if (b.blocked) {
          parts.push("Щит гасит удар «" + e.name + "».");
        } else if (taken > 0) {
          const dist = Math.round(
            Math.hypot(e.x - G.playerPos.x, e.y - G.playerPos.y)
          );
          if (b.rangedShot) {
            parts.push(
              e.name + " выпускает снаряд с " + dist + " клеток: " + taken + " урона."
            );
            effectFlash("Снаряд · " + taken + " урона");
          } else {
            parts.push(e.name + " бьёт тебя на " + taken + " урона.");
          }
          if (missMul(b.missStreak) > 1) {
            parts.push("Ошибка подряд — удар ×" + missMul(b.missStreak).toFixed(1).replace(".", ",") + ".");
          }
        } else if (b.rangedCdMsg) {
          parts.push(e.name + " " + b.rangedCdMsg);
        }
        if (b.drainHeal > 0) parts.push("Вампир впитывает " + b.drainHeal + " здоровья.");
        b.poisonTick = playerPoisonTick();
        if (b.poisonTick > 0) {
          parts.push("Яд отнимает ещё " + b.poisonTick + " здоровья.");
        }
      }
    }
    b.feedback = parts.join(" ");
    // Пункт 3: зелёный/красный итог боя теперь говорит именно о верности
    // ответа, а не о том, «нанесён ли хоть какой-то урон». Раньше промах,
    // отскочивший от шипов, подсвечивался как успех.
    b.good = correct == null ? damage > 0 && !counter : !!correct;
    b.phase = "result";
    renderBattle();
    updateHud();

    const box = el("battle-box");
    if (dealt) strikeScene(box, "enemy", "-" + dealt, "hit");
    if (taken) {
      strikeScene(box, "hero", "-" + taken, "hurt");
      // Трясём сцену, а не всю панель: вопрос не должен прыгать под руками.
      shakeEl(box.querySelector(".battle-stage") || box);
    }
    const result = box.querySelector(".battle-feedback");
    if (result) result.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function defeatEnemy(enemy) {
    const e = enemy || (G.battle && G.battle.enemy);
    if (!e) return;
    const idx = G.enemies.indexOf(e);
    if (idx >= 0) G.enemies.splice(idx, 1);
    if (G.portal && !G.enemies.length) {
      toast("Портал в деревню открыт");
      log("Этаж зачищен. У лестницы открылся портал в деревню.", "floor");
      // Если следующий спуск запечатан, объясняем это сразу после зачистки,
      // пока игрок стоит у портала, а не только по нажатию E на ступеньку.
      if (!canDescend()) {
        const message = sealMessage();
        setMsg(message);
        log(message, "floor");
        toast(message, 7000);
      }
    }
    G.stats.kills += 1;
    if (G.tutorial && G.tutorial.active) tutorialEvent("battle");
    // Стражи лестницы держат ключи от построек деревни: ключ от амбара лежит
    // с третьего этажа, ключ от дома мастера — с пятого. Так деревня растёт
    // не только за материалы, но и за спуск: ключ нельзя выпросить в деревне.
    if (e.guard) {
      dropGuardKey(G.floorIndex);
      dropVaultKey(G.floorIndex);
      bumpQuest("guard", 1);
    }
    if (e.elite) {
      G.stats.eliteKills = (G.stats.eliteKills || 0) + 1;
      log("Элита повержена: " + e.name + " пала в бою.", "fight");
      effectFlash("Элита повержена");
    }
    if (G.battle && G.battle.enemy === e) {
      G.battle.quip = typeof enemyDefeatQuip === "function" ? enemyDefeatQuip(e.key) : "";
    }
    const xp = e.xp || e.maxHp;
    G.player.xp += xp;
    const quip = typeof enemyDefeatQuip === "function" ? enemyDefeatQuip(e.key) : "";
    log(e.name + " повержен! Получено " + xp + " опыта." + (quip ? " " + quip : ""), "fight");
    // «Тёмная сделка» удваивает золото с монстров этого этажа.
    // Награда растёт с глубиной: иначе золото обесценивается, ведь монстры
    // к 8-му этажу бьют втрое сильнее, а платили за них столько же.
    const baseGold = e.boss ? ECON.bossGold : ECON.goldBase + (e.elite ? eliteGoldBonus() : 0);
    const bagGold = Math.round(baseGold * depthMul(ECON.goldDepth) * goldMulForFloor());
    while (G.player.xp >= G.player.xpNext) {
      G.player.xp -= G.player.xpNext;
      G.player.level += 1;
      G.player.baseMaxHp += LEVEL_HP;
      G.player.dmgBase += LEVEL_DMG;
      G.player.xpNext = XP_BASE * G.player.level;
      recalcStats();
      G.player.hp = Math.min(G.player.maxHp, G.player.hp + 30);
      log("Новый уровень! Теперь ты уровня " + G.player.level + ".", "fight");
      toast("Уровень " + G.player.level + "!");
    }

    // С элиты и дракона изредка падает амулет возврата: он уходит в деревню
    // и переживает смерть, поэтому замещает обычную добычу.
    const amuletDrop = (e.boss || e.elite) ? findAmulet() : false;
    const dropChance = e.boss ? 1 : e.elite ? 0.6 : 0.35;
    let bagItem = null;
    if (!amuletDrop && Math.random() < dropChance) {
      // Дракон — единственный, кто всегда что-то оставляет, и оставляет
      // вещь высшего тира: раньше он ронял случайную вещь третьего этажа.
      bagItem = e.boss ? bossDrop() : randomItemForFloor(G.floorIndex);
    }
    const bag = ensureLootBag(e.x, e.y, bagGold, bagItem);
    if (bagItem) {
      log("На месте врага остался мешочек: " + bagItem.name + ".", "loot");
      toast("Добыча в мешочке: " + bagItem.name);
    } else {
      log("На месте врага остался мешочек с золотом.", "loot");
    }
    // Если бой закончился на клетке героя, мешочек подбирается сразу —
    // иначе он остался бы под ногами и требовал лишнего шага.
    if (bag.x === G.playerPos.x && bag.y === G.playerPos.y) pickupLootBag(bag);

    // Страж лестницы повержен — спуск открыт.
    if (e.guard && G.stairsDown && !G.stairsDown.active) {
      G.stairsDown.active = true;
      log("Страж лестницы повержен — путь вниз открыт.", "fight");
      toast("Лестница вниз открыта");
    }

    if (G.enemies.length === 0) {
      G.stairsDown.active = true;
      if (floorDef(G.floorIndex).finalBoss && !runIsEndless()) {
        log("Дракон повержен! Выход из подземелья открыт.", "fight");
      } else if (floorDef(G.floorIndex).boss) {
        log((floorDef(G.floorIndex).bossName || "Босс") + " повержен! Путь глубже открыт.", "fight");
      } else {
        log("Этаж зачищен!", "fight");
      }
    }
  }

  let battleCloseTimer = null;
  let battleFadeTimer = null;

  function cancelBattleClose() {
    if (battleCloseTimer) clearTimeout(battleCloseTimer);
    if (battleFadeTimer) clearTimeout(battleFadeTimer);
    battleCloseTimer = null;
    battleFadeTimer = null;
    const overlay = el("battle-overlay");
    if (overlay) overlay.classList.remove("battle-closing");
  }

  function scheduleBattleClose() {
    cancelBattleClose();
    // Синхронные проверки не должны ждать таймер и закрывать бой за них.
    if (globalThis.__PYQUIZ_SYNC_FLOORS) return;
    battleCloseTimer = setTimeout(() => {
      const b = G.battle;
      if (!b || b.phase !== "result" || !b.won || b.squadNext ||
          b.playerDead || !G.player || G.player.hp <= 0) return;
      const overlay = el("battle-overlay");
      if (overlay) overlay.classList.add("battle-closing");
      battleCloseTimer = null;
      battleFadeTimer = setTimeout(() => {
        battleFadeTimer = null;
        continueBattle();
      }, 420);
    }, 1800);
  }

  function closeBattle() {
    cancelBattleClose();
    G.battle = null;
    el("battle-overlay").classList.add("hidden");
    endBattleMode();
    render();
  }

  function renderBattle() {
    const b = G.battle;
    if (!b) return;
    const e = b.enemy;
    const box = el("battle-box");

    const hpPct = Math.round((e.hp / e.maxHp) * 100);
    // Своя полоса — рядом с полосой врага. Раньше здоровье героя было только
    // в панели справа, а на узком экране карточка боя накрывает панель
    // целиком: игрок не видел, сколько у него осталось.
    const heroMax = Math.max(1, G.player.maxHp);
    const heroHp = Math.max(0, Math.min(G.player.hp, heroMax));
    const heroPct = Math.round((heroHp / heroMax) * 100);
    const abilityText = abilityTextOf(e);
    const heroName = (G.name && String(G.name).trim()) || "Герой";
    const isCodeTask = b.phase === "question" && b.challenge &&
      (b.challenge.type === "copy" || b.challenge.type === "code");
    let footLabel = "";
    let html = "";
    // Бой — не карточка поверх карты, а сцена на самой карте: камера
    // подъезжает, крупные портреты стоят над клетками бойцов, снизу
    // выезжает панель с вопросом. Карточку по центру убрали: она закрывала
    // ту самую карту, ради которой игрок и ходит по подземелью.
    let roundNote = "Ход героя";
    if (b.phase !== "question") {
      if (b.playerDead || G.player.hp <= 0) roundNote = "Поражение";
      else if (b.won) roundNote = "Победа";
      else roundNote = b.good ? "Точный ответ" : "Ошибка";
    }
    const introSub = b.quip ? "«" + b.quip + "»" : "Ответь верно — и удар будет твоим.";
    html += "<div class='battle-stage'>";
    html +=
      "<div class='battle-intro" + (b.showIntro ? "" : " gone") + "'>" +
      "<span class='battle-intro-kicker'>" + escText(floorNameAt(G.floorIndex)) +
      " · этаж " + (G.floorIndex + 1) + "</span>" +
      "<b>" + escText(e.name) + " преграждает путь</b>" +
      "<i></i>" +
      "<p>" + escText(introSub) + "</p>" +
      "</div>";
    html +=
      "<div class='battle-scene'>" +
      "<div class='scene-arena'>" +
      "<div class='fighter fighter-hero" + (heroHp <= 0 ? " down" : "") + "'>" +
      "<div class='fighter-hpbar'><i style='width:" + heroPct + "%'></i></div>" +
      "<div class='battle-portrait hero'>" + spriteImg("player") + "</div>" +
      "<div class='fighter-tag'><b>" + escText(heroName) + "</b>" +
      "<span>Уровень " + G.player.level +
      (G.player.poison > 0 ? " · яд " + G.player.poison : "") + "</span></div>" +
      "</div>" +
      "<div class='fighter fighter-enemy" + (e.hp <= 0 ? " down" : "") + "'>" +
      "<div class='fighter-hpbar enemy'><i style='width:" + hpPct + "%'></i></div>" +
      "<div class='battle-portrait" + (e.boss ? " boss" : "") + "'>" +
      spriteImg(e.key) + "</div>" +
      "<div class='fighter-tag'><b style='color:" + e.color + "'>" + escText(e.name) + "</b>" +
      "<span>" + (e.boss ? "Босс" : e.elite ? "Элита" : "Монстр") + "</span></div>" +
      "</div>" +
      "</div>" +
      (e.hp <= 0 ? "<div class='scene-banner win'>Победа</div>" : "") +
      (heroHp <= 0 ? "<div class='scene-banner lose'>Ты пал</div>" : "") +
      "</div>";
    html += "</div>";

    html += "<div class='battle-panel" + (isCodeTask ? " code-mode" : "") + "'>";
    html +=
      "<div class='battle-panel-top'>" +
      "<div class='combatant hero'>" +
      "<span class='name'>" + escText(heroName) + "</span>" +
      "<span class='hp-bar" + (heroPct <= 30 ? " low" : "") + "'>" +
      "<i style='width:" + heroPct + "%'></i></span>" +
      "<span class='num'>" + heroHp + " / " + heroMax + "</span>" +
      "</div>" +
      "<span class='round-note'>" + roundNote + "</span>" +
      "<div class='combatant enemy'>" +
      "<span class='name' style='color:" + e.color + "'>" + escText(e.name) + "</span>" +
      "<span class='hp-bar enemy'><i style='width:" + hpPct + "%'></i></span>" +
      "<span class='num'>" + e.hp + " / " + e.maxHp + "</span>" +
      "</div>" +
      "</div>";

    // Вопрос и написанный код живут в прокручиваемой середине: длинное
    // задание больше не выдавливает кнопки за край окна. Туда же уходят
    // бейджи и заметки — раньше длинная шапка съедала место у задания.
    // В фазе вопроса эта середина делится на две колонки; в фазе разбора
    // делить нечего — там идёт одна лента разбора. Колонка задания открывается
    // здесь же, до заметок: иначе заметки стали бы отдельными клетками сетки
    // и разъехались бы по колонкам, как это и случилось при первой правке.
    html += "<div class='battle-mid" + (b.phase === "question" ? " split" : "") + "'>";
    if (b.phase === "question") html += "<div class='battle-ask'>";
    html +=
      (abilityText
        ? "<div class='enemy-ability'>" + abilityText + "</div>"
        : "") +
      (b.cursed
        ? "<div class='enemy-ability curse'>Проклятие лича: подсказка не работает</div>"
        : "") +
      (squadAliveCount(b)
        ? "<div class='squad-note'>Отряд: осталось монстров — " +
          (squadAliveCount(b) + 1) + ". Пока кто-то жив, уйти нельзя.</div>"
        : "") +
      ((e.range || 1) > 1
        ? "<div class='enemy-ability ranged'>Бьёт с расстояния " + e.range +
          " клеток. Урон слабее, но подойти вплотную не выйдет.</div>"
        : "") +
      (G.player.poison > 0
        ? "<div class='enemy-quip poison'>Тебя тошнит от яда. Осталось " + G.player.poison + " ходов.</div>"
        : "") +
      ((G.stats && G.stats.streak) > 0
        ? "<div class='streak-note'>Серия верных ответов: " +
          Math.min(STREAK_CAP, G.stats.streak) +
          " (удар ×" + streakMul().toFixed(2) + ")</div>"
        : "") +
      "";

    // Строку «Тема боя» из окна убрали: тема и так видна в самом вопросе, а
    // плашка занимала место над вариантами — длинное задание уходило под
    // прокрутку. Остался только счёт ошибок подряд: это игровой сигнал,
    // следующая ошибка ударит сильнее, и о нём надо предупредить.
    const missPart = b.phase === "question" && (b.missStreak || 0) > 0
      ? "<span class='miss-tag' data-tip=\"" +
        tipAttr("Каждая ошибка подряд в этом бою бьёт сильнее. Верный ответ сбросит счёт.") + "\">" +
        "Ошибок подряд: " + b.missStreak + " · следующая ×" +
        missMul(b.missStreak + 1).toFixed(1).replace(".", ",") + "</span>"
      : "";
    if (missPart) {
      html += "<div class='battle-topic'>" + missPart + "</div>";
    }

    if (b.phase === "question") {
      const c = b.challenge;
      // Вопрос в бою делится на две вертикальные половины: слева написано
      // задание (что просят), справа — где отвечают: варианты, поле «Решение»
      // и разбор проверки. Колонка задания открыта выше, вместе с заметками.
      if (c.notice) html += "<div class='battle-note'>" + escText(c.notice) + "</div>";
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
          html += "<pre class='code'>" + escText(item.code) + "</pre>";
        }
        html += "</div><div class='battle-solve'>";
        html += "<div class='options' id='battle-options'></div>";
        if (c.cursedNext) {
          html += "<div class='battle-note'>Проклятая плита: варианты идут по алфавиту — читай внимательнее.</div>";
        }
        html += "</div>";
      } else if (c.type === "copy") {
        html += "<div class='challenge-tag copy'>Повтори код</div>";
        html += "<div class='challenge-q'>" + c.task.title + "</div>";
        html += "<p class='lead' style='margin-bottom:10px'>" + c.task.task + "</p>";
        html += "<pre class='code sample-code' id='copy-sample'>" + escText(c.task.code) + "</pre>";
        html += "</div><div class='battle-solve'>";
        html += "<div class='solve-label'>Решение</div>";
        html += "<div class='copy-note'>Копирование запрещено — перепиши код вручную.</div>";
        html += "<textarea class='code-editor' id='copy-input' spellcheck='false' autocomplete='off' autocorrect='off' autocapitalize='off' placeholder='Напиши код здесь...'></textarea>";
        html += "<div class='battle-feedback' id='copy-feedback'></div>";
        html += "</div>";
      } else {
        html += "<div class='challenge-tag code'>Напиши функцию</div>";
        html += "<div class='challenge-q'>" + c.task.title + "</div>";
        html += "<p class='lead' style='margin-bottom:12px'>" + c.task.task + "</p>";
        html += "</div><div class='battle-solve'>";
        html += "<div class='solve-label'>Решение</div>";
        html += "<textarea class='code-editor' id='code-input' spellcheck='false'></textarea>";
        html += "<div class='test-results' id='test-results'></div>";
        html += "<div class='battle-feedback' id='code-feedback'></div>";
        html += "</div>";
      }
    } else {
      html += "<div class='battle-feedback " + (b.good ? "good" : "bad") + "'>" + b.feedback + "</div>";
      if (b.explanation) {
        html += "<div class='battle-explain'><b>Пояснение:</b> " + b.explanation + "</div>";
      }
      if (b.results) {
        html += "<div class='test-results'>";
        // Текст ошибки и значения пришли из программы ученика: экранируем,
        // иначе строка с тегами из return рисовалась как разметка.
        if (b.results.error) {
          html += "<div class='test-line fail'>" + escText(b.results.error) + "</div>";
        }
        (b.results.results || []).forEach((r, i) => {
          html +=
            "<div class='test-line " + (r.ok ? "pass" : "fail") + "'>" +
            "#" + (i + 1) + " " + (r.ok ? "пройден" : "провален") +
            " · ожидалось " + escText(r.expected) + ", получено " + escText(r.actual) + "</div>";
        });
        html += "</div>";
      }
      // Мёртв — так и пишем. Раньше проверка стояла последней, и павшему
      // герою с добитым шипами врагом предлагали «Забрать добычу».
      // Подпись запоминаем: сама кнопка уезжает в футер карточки.
      footLabel = b.playerDead || G.player.hp <= 0
        ? "Продолжить"
        : b.squadNext
        ? "В бой с " + b.squadNext.name
        : b.won
        ? "Забрать добычу"
        : "Следующий вопрос";
    }

    html += "</div>";

    // Футер: кнопки по четырём категориям, чтобы не приходилось искать
    // «Пропустить» между «Обороной» и зельями. Категория без кнопок не
    // рисуется: в бою с кодом нет подсказки с вариантами, и пустая колонка
    // только сбивала бы с толку.
    html += "<div class='battle-foot'>";
    if (b.phase === "question") {
      const ctype = b.challenge.type;
      const atkBtns = [];
      if (ctype === "copy" || ctype === "code") {
        atkBtns.push(
          "<button class='btn" + (ctype === "code" ? " purple" : "") +
          "' id='check-btn' data-tip=\"" +
          tipAttr("Отправить написанный код на проверку. Ответ решает силу удара.") +
          "\">Проверить и атаковать</button>");
      } else {
        // «Вспомни»: подсказка (если её ещё не брали) и пропуск вопроса.
        // Пропуск стоит здоровья и не даёт врагу ударить: платишь только
        // здоровьем, зато вопрос уходит в пробелы и вернётся призраком.
        const btns = [];
        if (!b.challenge.hintUsed) {
          const free = equippedEffect("hintFree");
          const freeLeft = free && free.charges ? Math.max(0, free.charges - (G.player.freeHints || 0)) : 0;
          const hintLabel = b.cursed
            ? "Подсказка не работает"
            : freeLeft > 0
            ? "Подсказка (бесплатно, " + (G.player.freeHints || 0) + "/" + free.charges + ")"
            : "Подсказка (−10 HP)";
          atkBtns.push(
            "<button class='btn ghost" + (b.cursed ? " idle" : "") + "' id='hint-btn' type='button' data-tip=\"" +
            tipAttr(
              b.cursed
                ? "Проклятие лича: подсказка не работает, и тратить на неё здоровье не нужно."
                : free && free.charges
                ? "Подсказка убирает два неверных варианта. Амулет даёт " + free.charges +
                  " бесплатных за поход — осталось " + freeLeft + "."
                : "Подсказка убирает два неверных варианта и стоит 10 здоровья."
            ) +
            "\">" + hintLabel + "</button>");
        }
        const skipPrice = skipCost();
        const poor = G.player.hp <= skipPrice;
        atkBtns.push(
          "<button class='btn ghost" + (poor ? " idle" : "") + "' id='skip-question-btn' type='button' data-tip=\"" +
          tipAttr(poor
            ? "Здоровья меньше, чем стоит пропуск (" + skipPrice + " HP). Выпей зелье или ответь."
            : "Пропустить вопрос: уйдёт " + skipPrice + " здоровья — и сразу. Враг за это не бьёт, " +
              "но вопрос пойдёт в пробелы по теме и вернётся призраком ошибки.") +
          "\">Пропустить вопрос (−" + skipPrice + " HP)</button>");
      }
      const hero = heroActionBtns(b);
      html += battleGroupHtml("Атака", atkBtns, "attack");
      html += battleGroupHtml("Действие", hero.action.concat([potionRowHtml()]), "action");
      html += battleGroupHtml("Защита", hero.defense, "defense");
      html += battleGroupHtml("Побег", hero.flee, "flee");
    } else {
      // Победа закрывает окно сама: короткая пауза, затем плавное исчезновение.
      // Кнопка «Забрать добычу» больше не нужна — мешочек ждёт на карте.
      if (b.phase === "result" && b.won && !b.squadNext &&
          !b.playerDead && G.player && G.player.hp > 0) {
        html += "<div class='battle-cat-wide battle-auto-note'>" +
          "Бой завершён · добыча в мешочке</div>";
      } else {
        html += "<div class='battle-cat-wide'>" +
          "<button class='btn' id='continue-btn'>" + footLabel + "</button></div>";
      }
    }
    html += "</div>";
    html += "<div class='effect-list battle-effects' id='battle-effects'></div>";
    // Панель закрыта: выше неё только сцена с бойцами.
    html += "</div>";

    box.innerHTML = html;
    renderEffectList(el("battle-effects"));
    // Полосы прокрутки в окне боя нет, поэтому «ниже есть ещё» показывает
    // мягкая тень у нижнего края. Она есть ровно тогда, когда задание не
    // поместилось целиком, и снимается, когда ученик долистал до конца.
    const midScroll = box.querySelector(".battle-mid");
    if (midScroll) {
      const updMid = () => midScroll.classList.toggle("can-scroll",
        midScroll.scrollHeight - midScroll.scrollTop - midScroll.clientHeight > 6);
      updMid();
      midScroll.addEventListener("scroll", updMid);
    }
    // Категории действий: нажатие открывает всплывающий список над кнопкой,
    // повторное — закрывает, а открытие другой закрывает предыдущую.
    box.querySelectorAll(".battle-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.cat;
        const panel = box.querySelector("[data-list='" + key + "']");
        const wasOpen = panel && !panel.classList.contains("hidden");
        box.querySelectorAll(".battle-cat-list").forEach((n) => n.classList.add("hidden"));
        box.querySelectorAll(".battle-cat").forEach((n) => n.classList.remove("open"));
        if (panel && !wasOpen) {
          panel.classList.remove("hidden");
          btn.classList.add("open");
        }
      });
    });
    const dbtn = el("defend-btn");
    if (dbtn) dbtn.addEventListener("click", defendTurn);
    const fbtn = el("flee-btn");
    if (fbtn) fbtn.addEventListener("click", fleeBattle);
    const abtn = el("ability-btn");
    if (abtn) abtn.addEventListener("click", useAbility);

    if (
      b.phase === "question" &&
      (b.challenge.type === "mc" ||
        b.challenge.type === "fill" ||
        b.challenge.type === "error")
    ) {
      const view = b.challenge.view || (b.challenge.question || b.challenge.task);
      const opts = el("battle-options");
      view.options.forEach((opt, i) => {
        // Варианты, убранные подсказкой, не рисуются — и после перерисовки боя.
        if (b.challenge.hidden && b.challenge.hidden.indexOf(i) >= 0) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option";
        btn.setAttribute("data-tip", tipAttr("Клавиши: " + LETTERS[i] + " или " + (i + 1) + "."));
        btn.innerHTML = "<span class='key'>" + LETTERS[i] + "</span><span></span>";
        btn.lastChild.textContent = opt;
        btn.addEventListener("click", () => answerMC(i));
        opts.appendChild(btn);
      });
      const hb = el("hint-btn");
      if (hb) hb.addEventListener("click", useHint);
      const sq = el("skip-question-btn");
      if (sq) sq.addEventListener("click", skipQuestion);
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
      const cont = el("continue-btn");
      if (cont) cont.addEventListener("click", continueBattle);
    }

    if (b.phase === "result" && b.won && !b.squadNext &&
        !b.playerDead && G.player && G.player.hp > 0) {
      scheduleBattleClose();
    } else {
      cancelBattleClose();
    }

    // Заставка живёт чуть дольше подлёта камеры и гаснет сама. Повторная
    // отрисовка (ответ, удар) заставку уже не запускает.
    if (b.showIntro) {
      clearTimeout(b.introTimer);
      b.introTimer = setTimeout(() => {
        b.showIntro = false;
        const intro = box.querySelector(".battle-intro");
        if (intro) intro.classList.add("gone");
      }, 1250);
    }
    requestAnimationFrame(() => {
      if (G.battle === b) updateCamera();
    });

    box.querySelectorAll("button[data-potion]").forEach((btn) => {
      btn.addEventListener("click", () => useBattlePotion(btn.dataset.potion));
    });
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

  // Зелья в бою: по кнопке на каждый вид. Раньше кнопка была одна и пила то,
  // что лежит в сумке первым: противоядие впереди закрывало лечебные зелья.
  function potionRowHtml() {
    const kinds = [];
    G.inventory.forEach((item) => {
      if (item.slot !== "potion") return;
      let k = kinds.find((x) => x.id === item.id);
      if (!k) {
        k = { id: item.id, item: item, n: 0 };
        kinds.push(k);
      }
      k.n += 1;
    });
    if (!kinds.length) return "";
    const buttons = kinds.map((k) => {
      const out = potionOutcome(k.item);
      const now = out.useful
        ? "Сейчас: " + [out.heal ? "+" + out.heal + " здоровья" : "", out.cleanse ? "снимет яд" : ""]
          .filter(Boolean).join(", ") + "."
        : "Сейчас не нужно: здоровье полное, яда нет.";
      return "<button class='btn ghost" + (out.useful ? "" : " idle") + "' type='button' data-potion='" +
        k.id + "' data-tip=\"" +
        tipAttr("<b>" + k.item.name + "</b><br>" + (k.item.desc || effectText(k.item)) + "<br>" + now) +
        "\">" + k.item.name + (k.n > 1 ? " ×" + k.n : "") + "</button>";
    }).join("");
    return "<div class='potion-row'><span class='potion-label'>Выпить:</span>" + buttons + "</div>";
  }

  // id — вид зелья с кнопки; без него выбирается подходящее (bestPotionIndex).
  function useBattlePotion(id) {
    const idx = typeof id === "string"
      ? G.inventory.findIndex((i) => i.slot === "potion" && i.id === id)
      : bestPotionIndex();
    if (idx < 0) {
      toast("Зелье сейчас бесполезно");
      return;
    }
    const out = drinkPotion(idx);
    if (!out) return;
    if (out.heal > 0) {
      toast("+" + out.heal + " здоровья" + (out.cleanse ? ", яд снят" : ""));
      spawnFloat(el("battle-box"), "+" + out.heal, "heal", 20, 60);
    } else {
      toast("Яд снят");
    }
    updateHud();
    renderBattle();
  }

  // Сколько здоровья стоит пропустить вопрос. Никогда не убивает: если
  // здоровья меньше цены, пропуск запрещён — умирать от собственной кнопки
  // «не знаю» было бы издевательством.
  function skipCost() {
    return Math.max(8, Math.round((G.player.maxHp || 1) * SKIP_HP_SHARE));
  }

  // Пропуск вопроса. Враг при этом НЕ бьёт: вся цена — здоровье, и оно уходит
  // сразу. Но вопрос засчитывается как пробел: он идёт в разбор по темам, в
  // процент похода и возвращается призраком ошибки — иначе пропускать было бы
  // выгоднее, чем отвечать.
  function skipQuestion() {
    const b = G.battle;
    if (!b || b.phase !== "question" || b.busy) return;
    const c = b.challenge;
    if (!c || c.type === "copy" || c.type === "code") return;
    const cost = skipCost();
    if (G.player.hp <= cost) {
      toast("Мало здоровья, чтобы пропустить вопрос");
      return;
    }
    const item = c.question || c.task;
    const topic = item.topic || "syntax";
    if (!devGod()) G.player.hp -= cost;
    G.stats.wrong += 1;
    G.stats.streak = 0;
    G.stats.topicStats[topic] = G.stats.topicStats[topic] || { correct: 0, total: 0 };
    G.stats.topicStats[topic].total += 1;
    pushMissed(c.type, item);
    log("Вопрос пропущен: −" + cost + " здоровья. Он вернётся призраком.", "hurt");
    setQuality("partial");
    applyAttack(
      0,
      "Пропущено: −" + cost + " HP. Правильный ответ: " +
        LETTERS[c.view ? c.view.answer : item.answer] + ".",
      false,
      item.explanation,
      false
    );
    updateHud();
  }

  // ---------- Действия героя в бою ----------
  // Умения похода: одно на выбор перед спуском. Заряды общие на поход,
  // поэтому выбор — это выбор стиля: подсказка, сила удара или выживание.
  // Сами умения открывает дом мастера: деревня даёт не только потолок
  // улучшений, но и то, чем герой пользуется в бою.
  const ABILITIES = {
    insight: {
      name: "Прозрение",
      desc: "Убирает два неверных варианта — а в задании с кодом показывает первую проверку."
    },
    strike: {
      name: "Точный удар",
      desc: "Следующий верный ответ бьёт вдвое сильнее."
    },
    breath: {
      name: "Второе дыхание",
      desc: "Возвращает здоровье и снимает яд."
    }
  };
  const ABILITY_KEYS = ["insight", "strike", "breath"];

  function abilityState() {
    if (!G.ability) G.ability = { key: "", left: 0 };
    return G.ability;
  }

  function abilityUnlocked() {
    return villageLevel("smith") > 0;
  }

  // Зарядов у мастера второго уровня больше: дом мастера II и есть «+1 заряд».
  function abilityCharges() {
    return ABILITY_CHARGES + (villageLevel("smith") >= 2 ? 1 : 0);
  }

  function chosenAbility() {
    const prof = hubProfile();
    const pick = (prof && prof.ability && prof.ability.pick) || "";
    return ABILITIES[pick] ? pick : "";
  }

  function abilityName(key) {
    return (ABILITIES[key] || {}).name || "Умение";
  }

  // Категория действий: крупная кнопка, а её действия — во всплывающем списке
  // над ней. Так низ окна занимает одна строка, а не пол-экрана: раньше все
  // действия лежали развёрнутыми четырьмя колонками.
  function battleGroupHtml(name, btns, key) {
    const list = (btns || []).filter(Boolean).join("");
    if (!list) return "";
    return "<div class='battle-cat-wrap'>" +
      "<button class='btn battle-cat' type='button' data-cat='" + key + "'>" + name + "</button>" +
      "<div class='battle-cat-list hidden' data-list='" + key + "'>" +
      "<div class='battle-actions'>" + list + "</div></div></div>";
  }

  // Кнопки действий героя по категориям: умение — это «действие»,
  // оборона — «защита», отступление — «побег».
  function heroActionBtns(b) {
    const e = b.enemy;
    const st = abilityState();
    const hit = Math.max(1, Math.round((e.dmg + (e.dmgBoost || 0)) * FLEE_HIT));
    const deadly = G.player.hp <= hit;
    const canRun = canFlee(e);
    const defense = [];
    const flee = [];
    const action = [];
    defense.push(
      "<button class='btn ghost' id='defend-btn' type='button' data-tip=\"" +
      tipAttr("Пропустить ход и закрыться: удар врага пройдёт вполсилы, а на следующий удар " +
        "будет заряд блока. Ждать выгодно не всегда: враг всё равно бьёт, яд тикает, " +
        "а «огонь» и «натиск» за время обороны только крепнут.") +
      "\">Оборона</button>");
    flee.push(
      "<button class='btn ghost" + (canRun && !deadly ? "" : " idle") + "' id='flee-btn' type='button' data-tip=\"" +
      tipAttr(!canRun
        ? "Отсюда не уйти: дракон, страж лестницы, отряд и щитоносец держат героя."
        : deadly
        ? "Удар на прощание может добить героя — отступать поздно."
        : "Отступить: враг бьёт вослед, но бой прекращается, а герой отходит на клетку. " +
          "Враг останется на месте и снова пойдёт следом.") +
      "\">" + (canRun ? "Отступить (−" + hit + " HP)" : "Отступить нельзя") + "</button>");
    if (abilityUnlocked()) {
      const has = !!st.key && st.left > 0;
      action.push(
        "<button class='btn ghost" + (has ? "" : " idle") + "' id='ability-btn' type='button' data-tip=\"" +
        tipAttr(st.key
          ? abilityName(st.key) + ": " + ABILITIES[st.key].desc +
            (st.left > 0 ? " Осталось зарядов: " + st.left + "." : " Заряды кончились — пополни у костра.")
          : "Умение выбирают перед спуском в окне стража входа.") +
        "\">" + (st.key ? abilityName(st.key) + " (" + st.left + ")" : "Умение не выбрано") +
        "</button>");
    }
    return { action: action, defense: defense, flee: flee };
  }

  // Отступать нельзя от того, кто держит героя: дракон, страж лестницы,
  // отряд и щитоносец.
  function canFlee(e) {
    if (!e || e.boss || e.guard) return false;
    if (abilityOf(e) === "bulwark") return false;
    if (e.squadId && squadAliveCount(squadLeaderOf(e)) > 1) return false;
    return true;
  }

  // Клетка для отступления: подальше от врага и свободная.
  function retreatCell(e) {
    const p = G.playerPos;
    const cur = Math.abs(p.x - e.x) + Math.abs(p.y - e.y);
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (let i = 0; i < dirs.length; i += 1) {
      const nx = p.x + dirs[i][0], ny = p.y + dirs[i][1];
      if (!G.map.grid[ny] || G.map.grid[ny][nx] !== 1) continue;
      if (cellBlocked(nx, ny)) continue;
      if (G.enemies.some((o) => o.hp > 0 && o.x === nx && o.y === ny)) continue;
      if (Math.abs(nx - e.x) + Math.abs(ny - e.y) > cur) return { x: nx, y: ny };
    }
    return null;
  }

  // Оборона: ход уходит на защиту. Враг бьёт, но ослабленно, а герой получает
  // заряд блока на следующий удар.
  function defendTurn() {
    const b = G.battle;
    if (!b || b.phase !== "question" || b.busy) return;
    b.phase = "result";
    b.braced = true;
    G.stats.braces = (G.stats.braces || 0) + 1;
    const dmg = playerTakeHit(1 - BRACE_CUT);
    b.blockLeft = (b.blockLeft == null ? 0 : b.blockLeft) + 1;
    b.feedback = dmg > 0
      ? "Герой закрылся: удар прошёл слабее (−" + dmg + "). Следующий удар примет блок."
      : "Герой закрылся: удар не прошёл.";
    log("Оборона: удар врага ослаблен (−" + dmg + ").", "fight");
    effectFlash("Оборона · блок +1");
    renderBattle();
    continueBattle();
  }

  // Отступление: прощальный удар и шаг назад. Враг остаётся рядом и снова
  // пойдёт следом — отступление спасает от смерти, но не от боя.
  function fleeBattle() {
    const b = G.battle;
    if (!b || b.phase !== "question" || b.busy) return;
    const e = b.enemy;
    if (!canFlee(e)) { toast("Отсюда не уйти: враг держит героя"); return; }
    b.phase = "result";
    const dmg = playerTakeHit(FLEE_HIT);
    if (G.player.hp <= 0) {
      b.playerDead = true;
      continueBattle();
      return;
    }
    G.stats.flees = (G.stats.flees || 0) + 1;
    G.stats.streak = 0;
    log("Герой отступает: " + dmg + " урона на прощание.", "fight");
    const back = retreatCell(e);
    closeBattle();
    if (back) G.playerPos = { x: back.x, y: back.y };
    render();
    setMsg(back ? "Герой отступил на клетку назад." : "Герой отступил, но отходить некуда.");
  }

  // Умение: три вида, по одному заряду за применение.
  function useAbility() {
    const b = G.battle;
    const st = abilityState();
    if (!b || b.phase !== "question" || b.busy) return;
    if (!st.key) { toast("Умение не выбрано: его выбирают перед спуском"); return; }
    if (st.left <= 0) { toast("Заряды кончились — пополни у костра"); return; }
    const c = b.challenge;
    if (st.key === "insight") {
      if (c.type === "code" || c.type === "copy") {
        // Для задания с кодом «прозрение» показывает первую проверку: это
        // и есть подсказка — раньше её для кода не было вовсе.
        const tests = ((c.task && c.task.tests) || (c.view && c.view.tests) || []);
        const first = tests[0];
        b.revealed = first
          ? "Проверка: " + first.call + " должно дать " + first.expect
          : "У этой задачи нет проверок — напиши решение и нажми «Проверить».";
        toast("Прозрение: видна первая проверка");
      } else {
        const item = c.question || c.task;
        if (!item || !item.options) { toast("Здесь подсказывать нечего"); return; }
        if (c.hintUsed) { toast("Подсказка уже взята"); return; }
        c.hintUsed = true;
        const answerIdx = c.view ? c.view.answer : item.answer;
        const total = (c.view || item).options.length;
        const wrong = [];
        for (let i = 0; i < total; i += 1) if (i !== answerIdx) wrong.push(i);
        shuffle(wrong);
        c.hidden = wrong.slice(0, Math.min(2, Math.max(0, total - 2)));
        toast("Прозрение: два неверных варианта убраны");
      }
      setQuality("hinted");
      G.stats.streak = 0;
    } else if (st.key === "strike") {
      if (b.strikeNext) { toast("Точный удар уже заряжен"); return; }
      b.strikeNext = true;
      toast("Точный удар заряжен: следующий верный ответ бьёт вдвое");
      effectFlash("Точный удар заряжен");
    } else if (st.key === "breath") {
      const heal = Math.round(G.player.maxHp * ABILITY_BREATH);
      const was = G.player.hp;
      G.player.hp = Math.min(G.player.maxHp, G.player.hp + heal);
      G.player.poison = 0;
      toast("Второе дыхание: +" + (G.player.hp - was) + " здоровья, яд снят");
      effectFlash("Второе дыхание · +" + (G.player.hp - was));
    }
    st.left -= 1;
    G.stats.abilitiesUsed = (G.stats.abilitiesUsed || 0) + 1;
    updateHud();
    renderBattle();
  }

  function useHint() {
    const b = G.battle;
    if (!b || b.phase !== "question") return;
    const c = b.challenge;
    const item = c.question || c.task;
    if (!item || !item.options || c.hintUsed) return;
    // Проклятие лича: подсказка не работает, и стоить она не должна. Раньше
    // она всё равно забирала 10 здоровья и обнуляла серию — ни за что.
    if (b.cursed) {
      toast("Проклятие лича: подсказка не работает");
      return;
    }
    const free = equippedEffect("hintFree");
    const isFree = !!(free && free.charges && (G.player.freeHints || 0) < free.charges);
    if (!isFree && G.player.hp <= 10) {
      toast("Мало здоровья для подсказки");
      return;
    }
    if (!isFree && !devGod()) G.player.hp -= 10;
    G.stats.hintsUsed = (G.stats.hintsUsed || 0) + 1;
    c.hintUsed = true;
    // Подсказка уменьшает удар по врагу: ответ больше не считается точным,
    // а набранная серия верных ответов сгорает. Бесплатной её делает только
    // отсутствие платы здоровьем.
    setQuality("hinted");
    G.stats.streak = 0;
    // Убираем ДВА неверных варианта — как обещает подсказка на кнопке. Раньше
    // платная убирала один, а бесплатная (талисман) — ни одного. Скрытые
    // варианты хранятся в самом задании: перерисовка боя (зелье) их не вернёт.
    const answerIdx = c.view ? c.view.answer : item.answer;
    const total = (c.view || item).options.length;
    const wrong = [];
    for (let i = 0; i < total; i++) if (i !== answerIdx) wrong.push(i);
    shuffle(wrong);
    c.hidden = wrong.slice(0, Math.min(2, Math.max(0, total - 2)));
    if (isFree) {
      G.player.freeHints = (G.player.freeHints || 0) + 1;
      toast("Талисман: подсказка бесплатна (" + G.player.freeHints + "/" + free.charges + ")");
      effectFlash("Талисман · бесплатная подсказка");
    }
    updateHud();
    renderBattle();
  }

  // Тема задачи «повтори код» / «напиши функцию» — из таблицы task-meta.js:
  // в самих записях банка темы нет. Без неё разбор по темам в конце похода
  // и тепловая карта учителя не видели задач на код вовсе.
  function countTaskTopic(kind, task, ok) {
    const meta = typeof window !== "undefined" ? window.TASK_META : null;
    const id = task && task.id;
    const topic = (task && task.topic) ||
      (meta && meta.taskTopic ? meta.taskTopic(kind, id) : kind === "code" ? "functions" : "syntax");
    if (!topic) return;
    const ts = G.stats.topicStats;
    ts[topic] = ts[topic] || { correct: 0, total: 0 };
    ts[topic].total += 1;
    if (ok) ts[topic].correct += 1;
  }

  function escText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function checkCopy() {
    const b = G.battle;
    if (b.phase !== "question" || b.challenge.type !== "copy") return;
    const target = b.challenge.task.code;
    const typed = b.challenge.code || "";
    G.stats.copyTried += 1;

    const explain = b.challenge.task.explanation;
    if (!typed.trim()) {
      countTaskTopic("copy", b.challenge.task, false);
      applyAttack(0, "Ты не написал код.", true, explain, false);
      return;
    }
    const exact = normalizeExact(typed) === normalizeExact(target);
    const loose = normalizeLoose(typed) === normalizeLoose(target);
    countTaskTopic("copy", b.challenge.task, exact);

    if (exact) {
      G.stats.copyPassed += 1;
      G.stats.streak = (G.stats.streak || 0) + 1;
      addGold(8);
      applyAttack(codeDamage(), "Точное совпадение! Отличный удар!", false, explain, true);
    } else if (loose) {
      // Пункт 3: пробелы и отступы — часть задания («Соблюдай отступы!»),
      // поэтому такой ответ считается ошибкой: врагу урона нет, отвечает
      // герой. Раньше он давал ~28 урона и засчитывался как успех.
      G.stats.streak = 0;
      G.stats.copyLoose = (G.stats.copyLoose || 0) + 1;
      applyAttack(
        0,
        "Код совпал, но отступы сбиты — это ошибка. Сравни с образцом и попробуй снова.",
        true,
        explain,
        false
      );
    } else {
      G.stats.streak = 0;
      applyAttack(
        0,
        "Код отличается. Сравни с образцом и попробуй снова.",
        true,
        explain,
        false
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
    const correct = chosen === (c.view ? c.view.answer : item.answer);
    G.stats.topicStats[topic] = G.stats.topicStats[topic] || { correct: 0, total: 0 };
    G.stats.topicStats[topic].total += 1;
    if (correct) {
      G.stats.correct += 1;
      G.stats.topicStats[topic].correct += 1;
      G.stats.streak = (G.stats.streak || 0) + 1;
      addGold(6);
      applyAttack(mcDamage(level), "Верно!", false, item.explanation, true);
    } else {
      G.stats.wrong += 1;
      G.stats.streak = 0;
      pushMissed(c.type, item);
      applyAttack(
        0,
        "Неверно. Правильный ответ: " + LETTERS[c.view ? c.view.answer : item.answer] + ".",
        true,
        item.explanation,
        false
      );
    }
  }

  // В серверной версии проверка идёт на Python-сервере. В веб-сборке
  // web-boot подставляет Pyodide в Web Worker — контракт тот же.
  function requestCodeCheck(code, taskId) {
    if (typeof window !== "undefined" && typeof window.__PYQUIZ_CHECK_CODE === "function") {
      return window.__PYQUIZ_CHECK_CODE(code, taskId);
    }
    return fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Проверки заданий банка живут на сервере: клиент присылает только номер
      // задания. Иначе можно было прислать свои проверки и пройти любую.
      body: JSON.stringify({ code: code, taskId: taskId })
    }).then((r) => r.json());
  }

  function checkCode() {
    const b = G.battle;
    if (b.phase !== "question" || b.busy) return;
    b.busy = true;
    const btn = el("check-btn");
    btn.disabled = true;
    btn.textContent = "Проверяем...";

    requestCodeCheck(b.challenge.code, b.challenge.task.id)
      .then(
        (data) => applyCodeResult(data, b),
        () => applyCodeResult({
          ok: false,
          unavailable: true,
          error: "Проверка кода не отвечает."
        }, b)
      );
  }

  // Ответ сервера на «Проверить». Отдельно от fetch, чтобы его видели проверки.
  // unavailable — код не проверен по вине сервера (выключен, занят, нет связи):
  // ученик не ошибся, поэтому ни урона, ни попытки в счёт. Раньше любой сбой
  // сервера был ударом по герою.
  function applyCodeResult(data, battle) {
    const b = battle || G.battle;
    if (!b || G.battle !== b) return;
    b.busy = false;
    const c = b.challenge;
    if (!c || c.type !== "code" || b.phase !== "question") return;
    const explain = c.task.explanation;
    const total = data && data.total;
    const passed = data && data.passed;
    // Страховка от неполного ответа сервера: раньше `undefined === undefined`
    // проходило проверку и полный удар начислялся за пустой результат.
    const broken = !!data && !!data.ok && (typeof total !== "number" || typeof passed !== "number");
    // Задание с клиентскими проверками (генератор) сервер проверить не может:
    // заменяем его, но не отключаем проверку кода для всего похода.
    if (data && data.staleTask) {
      nextChallenge();
      b.challenge.notice = "Это задание больше не проверяется — выдано другое. Ход не потерян.";
      renderBattle();
      return;
    }
    if (!data || data.unavailable || broken) {
      if (data && data.disabled) {
        // Сервер запущен с --no-code: эту задачу меняем, новых не будет.
        G.codeCheck = false;
        nextChallenge();
        b.challenge.notice = "Проверка кода на сервере выключена — вместо задачи на код другое задание. Ход не потерян.";
      } else {
        c.notice = (broken ? "Сервер вернул неполный результат проверки." : (data && data.error) ||
          "Сервер проверки кода недоступен.") + " Ход не засчитан — нажми «Проверить» ещё раз.";
      }
      renderBattle();
      return;
    }
    G.stats.codeTried += 1;
    if (!data.ok) {
      // Ошибка в программе ученика: синтаксис, исключение, вечный цикл.
      countTaskTopic("code", c.task, false);
      b.results = {
        error: data.error || "Не удалось проверить код",
        results: []
      };
      applyAttack(0, "Код не сработал: " + escText(b.results.error), true, explain, false);
      return;
    }
    b.results = data;
    countTaskTopic("code", c.task, passed === total);
    if (passed === total) {
      G.stats.codePassed += 1;
      G.stats.streak = (G.stats.streak || 0) + 1;
      addGold(12);
      applyAttack(codeDamage(), "Код прошёл все проверки! Критический удар!", false, explain, true);
    } else if (passed > 0) {
      // Пункт 3: программа ещё неверна — врагу урона нет, получает герой.
      G.stats.streak = 0;
      applyAttack(
        0,
        "Часть проверок пройдена (" + passed + "/" + total + "), но программа ещё неверна.",
        true,
        explain,
        false
      );
    } else {
      G.stats.streak = 0;
      applyAttack(0, "Ни одна проверка не пройдена (0/" + total + ").", true, explain, false);
    }
  }

  function continueBattle() {
    const b = G.battle;
    // Смерть проверяется первой. Раньше ветка b.won стояла выше, а шипы
    // и яд успевали добить врага уже после смертельного удара — игрок
    // с нулевым здоровьем получал экран «Забрать добычу» и играл дальше.
    if (b.playerDead || G.player.hp <= 0) {
      closeBattle();
      showDeath();
      return;
    }
    // Отряд: выбил одного — бой продолжается с следующим, уйти нельзя.
    if (b.squadNext) {
      const next = b.squadNext;
      b.squadNext = null;
      startSquadMember(b, next);
      nextChallenge();
      renderBattle();
      return;
    }
    if (b.won) {
      if (G.player.snared) {
        G.player.snared = false;
        G.player.snareWaits = 0;
        const t = trapAt(G.playerPos.x, G.playerPos.y);
        if (t) t.armed = false;
        log("Ты разорвал цепь ударом.", "fight");
      }
      closeBattle();
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
    // Для старой партии без калибровки честно отправляем 0, а не базовый
    // уровень по умолчанию: учитель должен видеть «—», а не выдуманный старт.
    const known = knowledgeFor(G.name);
    return {
      name: G.name,
      mode: "dungeon",
      // Итог уходит при каждой смерти и при победе. По runId сервер узнаёт
      // тот же поход и заменяет строку, а не добавляет новую.
      runId: String(G.startedAt),
      date: new Date().toISOString(),
      percent,
      correctCount: G.stats.correct,
      total,
      seconds: Math.round((Date.now() - G.startedAt) / 1000),
      level: levelFromPercent(percent),
      // Стартовая ступень из калибровки: учитель видит, с каким уровнем
      // ученик начал поход, а не только итоговый процент.
      knowledgeLevel: known && known.level ? known.level : 0,
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
    // В публичной веб-сборке нет /api/submit: результат остаётся локальным.
    if (typeof window !== "undefined" && window.__PYQUIZ_WEB) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    // Токен сессии подписывает итог: у учителя строка отмечена как присланная
    // из аккаунта, и чужой итог без входа её не перезапишет.
    const u = typeof currentUser === "function" ? currentUser() : null;
    const body = buildResult(victoryFlag);
    if (u && u.token) body.token = u.token;
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch(() => {});
  }

  // Разбор по темам: где именно герой спотыкался. Показывается и при
// поражении, и при победе — это главная учебная часть подземелья.
function topicName(key) {
    return (typeof TOPICS !== "undefined" && TOPICS[key]) || key;
  }

  function topicReportHtml() {
    const ts = G.stats.topicStats || {};
    const rows = Object.keys(ts)
      .filter((k) => TOPICS[k])
      .map((k) => {
        const ok = ts[k].correct || 0;
        const total = ts[k].total || 0;
        return { key: k, ok: ok, bad: Math.max(0, total - ok) };
      })
      .filter((r) => r.ok + r.bad > 0);
    if (!rows.length) {
      return "<div class='report-empty'>Темы ещё не проверены — сыграй ещё.</div>";
    }
    rows.sort((a, b) => a.ok / (a.ok + a.bad) - b.ok / (b.ok + b.bad));
    let html = "<div class='run-report'><h3>Разбор по темам</h3>";
    rows.forEach((r) => {
      const total = r.ok + r.bad;
      const pct = Math.round((r.ok / total) * 100);
      const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
      html +=
        "<div class='report-row'>" +
        "<span style='flex:0 0 128px'>" + topicName(r.key) + "</span>" +
        "<span class='report-bar'><i style='width:" + pct + "%;background:" + color + "'></i></span>" +
        "<b>" + r.ok + "/" + total + "</b></div>";
    });
    const worst = rows[0];
    html += "</div>";
    if (worst && worst.ok / (worst.ok + worst.bad) < 0.5) {
      html +=
        "<p class='lead'>Слабое место — «" + topicName(worst.key) +
        "». Вернись к нему в разделе «Повторение» перед новым походом.</p>";
    }
    return html;
  }

  function showDeath() {
    sfx("death");
    const earned = earnGameBadges();
    if (earned.length) toast("Достижение: " + earned.map((b) => b.title).join(", "));
    saveDungeonBest(false);
    submitResult(false);
    G.dead = true;
    G.running = false;
    // Смертельный удар успевал уйти в автосейв: updateHud() зовёт
    // scheduleSave(), а тот через 400 мс писал player.hp = 0. Гасим
    // отложенную запись и сохраняем уже помеченное «партия окончена».
    clearTimeout(saveTimer);
    saveGame();
    // Амулет возврата даёт выбор: возродиться на месте и продолжить поход
    // или вернуться в деревню и потерять снаряжение. Без амулета выбора нет.
    const prof = hubProfile();
    const amulets = prof && prof.hub ? prof.hub.revive : 0;
    if (amulets > 0) {
      renderDeathWithAmulet(amulets);
    } else {
      renderDeathReturn(Math.floor((G.player ? G.player.gold : 0) * HUB_DEATH_SHARE));
    }
    el("end-overlay").classList.remove("hidden");
  }

  // Короткий итог похода: этаж, золото, ответы, код и следующий шаг.
  // Один и тот же блок на смерти и победе, чтобы не расходились формулировки.
  function runSummaryHtml(opts) {
    const o = opts || {};
    const s = G.stats || {};
    const total = (s.correct || 0) + (s.wrong || 0);
    const percent = total ? Math.round(((s.correct || 0) / total) * 100) : 0;
    const floor = Math.min(10, (G.floorIndex || 0) + 1);
    const goldEarned = s.goldEarned || 0;
    const currentGold = G.player ? (G.player.gold || 0) : 0;
    const banked = o.banked == null ? null : o.banked;
    const code = s.codeTried
      ? (s.codePassed || 0) + " / " + s.codeTried : "—";
    const copy = s.copyTried
      ? (s.copyPassed || 0) + " / " + s.copyTried : "—";
    const goldValue = o.keepGold
      ? currentGold
      : (banked == null ? goldEarned : banked);
    const rows = [
      ["Этаж", floor + (o.victory ? " из 10" : "")],
      ["Золото за поход", goldEarned],
      [o.keepGold ? "Золото сейчас" : "В банк", goldValue],
      ["Монстры", s.kills || 0],
      ["Ответы", (s.correct || 0) + " / " + total +
        (total ? " (" + percent + "%)" : "")],
      ["Код", code],
      ["Повторение кода", copy],
    ];
    let html = "<h3 class='run-title'>Итог похода</h3>" +
      "<div class='run-summary'>";
    rows.forEach((row) => {
      html += "<div><span>" + row[0] + "</span><b>" + row[1] + "</b></div>";
    });
    html += "</div>";
    const next = o.victory
      ? "Дракон повержен. Можно спуститься в бездну или вернуться в деревню."
      : o.keepGold
        ? "Амулет вернёт героя на этот этаж. Материалы и ключи уже в деревне."
        : "Вернись в деревню: золото в банке, материалы и ключи сохранены. " +
          "Купи улучшение или повтори слабую тему.";
    html += "<p class='lead run-next'>" + next + "</p>";
    return html;
  }

  // Общая часть экрана смерти: до какого этажа дошёл, сколько убил и разбор тем.
  function deathStatsHtml(banked, keepGold) {
    return runSummaryHtml({ banked: banked, keepGold: !!keepGold }) +
      "<p class='lead'>Материалы и ключи остаются в деревне: следующий поход " +
      "начнётся с ними.</p>" + topicReportHtml();
  }

  // Смерть с амулетом: спрашиваем игрока. Возрождение оставляет поход целым
  // (золото, снаряжение и пройденные этажи на месте) — в этом его ценность.
  function renderDeathWithAmulet(amulets) {
    el("end-box").innerHTML =
      "<div class='big-emoji-free game-over'>Поражение</div>" +
      "<h2 class='game-over'>Ты пал в бою</h2>" +
      deathStatsHtml(null, true) +
      "<p class='lead'>У тебя " + amulets + " " + amuletWord(amulets) + " возврата. " +
      "Использовать — герой встанет на этом же этаже, поход продолжится.</p>" +
      "<div class='battle-actions' style='justify-content:center;flex-wrap:wrap'>" +
      "<button class='btn' id='revive-btn'>Использовать амулет</button>" +
      "<button class='btn ghost' id='to-hub-btn'>Вернуться в деревню</button>" +
      "</div>";
    // Обёртка, а не useRevive напрямую: обработчик передаёт MouseEvent,
    // а useRevive принимает необязательный callback окончания загрузки этажа.
    el("revive-btn").addEventListener("click", () => useRevive());
    el("to-hub-btn").addEventListener("click", deathToHub);
  }

  // Смерть без амулета: поход окончен. Показываем, сколько золота уцелеет.
  function renderDeathReturn(banked) {
    el("end-box").innerHTML =
      "<div class='big-emoji-free game-over'>Поражение</div>" +
      "<h2 class='game-over'>Поход окончен</h2>" +
      deathStatsHtml(banked, false) +
      "<p class='lead'>Снаряжение, зелья, уровни и кузница этого похода потеряны. " +
      (banked > 0
        ? "В деревню перенесено " + banked + " золота — там его можно потратить."
        : "Золота на дорогу не осталось.") + "</p>" +
      "<div class='battle-actions' style='justify-content:center;flex-wrap:wrap'>" +
      "<button class='btn' id='to-hub-btn'>В деревню</button>" +
      "</div>";
    el("to-hub-btn").addEventListener("click", deathToHub);
  }

  // Имя владельца деревни. В деревне поход ещё не начат, и G.name пуст:
  // покупки и находки должны писать в профиль по имени аккаунта, иначе
  // putProfile("") молча ничего не сохранит и покупка пропадёт.
  function hubName() {
    return G.name || accountName();
  }

  // Профиль-владелец хаба.
  function hubProfile() {
    const name = hubName();
    if (!name) return null;
    return typeof getProfile === "function" ? getProfile(name) : null;
  }

  // Первый поход: ещё нет рекорда и нет сохранённого похода. Нужен для
  // подсказки «иди к стражу», пока игрок не понял цикл.
  function isFirstRun() {
    const prof = hubProfile();
    return !!prof && !prof.dungeonBest && !pausedRun();
  }

  // ---------- Первый спуск ----------
  // Не список целей, а одна памятка по клавишам. Сюжет и следующие шаги
  // живут в HUD/журнале; как только игрок сделал первый шаг, памятка уходит.

  function tutorialPanelEl() {
    return typeof document !== "undefined" ? el("tutorial-panel") : null;
  }

  function tutorialEligible() {
    const prof = hubProfile();
    return !!(prof && !prof.tutorialDone && !prof.dungeonBest &&
      G.place === "dungeon" && G.floorIndex === 0 && G.running && !G.dead);
  }

  function tutorialHint() {
    return "WASD или стрелки — идти · E — действие · Пробел — пропустить ход.";
  }

  function tutorialRender() {
    const panel = tutorialPanelEl();
    const state = G.tutorial;
    if (!panel || !state) return;
    if (state.moves >= 1) {
      tutorialFinish(false);
      return;
    }
    panel.classList.remove("hidden");
    const hint = el("tutorial-hint");
    if (hint) hint.textContent = tutorialHint();
  }

  function tutorialUsedCells() {
    const used = new Set();
    const mark = (o) => {
      if (o && typeof o.x === "number" && typeof o.y === "number") {
        used.add(o.x + "," + o.y);
      }
    };
    mark(G.playerPos);
    mark(G.stairsDown);
    mark(G.stairsUp);
    [G.treasures, G.camps, G.enemies, G.traders, G.nodes, G.levers, G.signs]
      .forEach((list) => (list || []).forEach(mark));
    return used;
  }

  function tutorialFreeSpot(minDist, maxDist, used) {
    const cells = [];
    if (!G.map || !G.map.grid) return null;
    // Считаем именно путь, а не манхэттенское расстояние: иначе сундук мог
    // оказаться за стеной в соседней комнате.
    const distances = new Map();
    const start = G.playerPos.x + "," + G.playerPos.y;
    const queue = [{ x: G.playerPos.x, y: G.playerPos.y, d: 0 }];
    distances.set(start, 0);
    for (let head = 0; head < queue.length; head += 1) {
      const cur = queue[head];
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const x = cur.x + dx;
        const y = cur.y + dy;
        if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
        if (G.map.grid[y][x] !== 1 || cellBlocked(x, y)) continue;
        const key = x + "," + y;
        if (distances.has(key)) continue;
        distances.set(key, cur.d + 1);
        queue.push({ x: x, y: y, d: cur.d + 1 });
      }
    }
    for (let y = 0; y < G.map.h; y += 1) {
      for (let x = 0; x < G.map.w; x += 1) {
        if (G.map.grid[y][x] !== 1 || cellBlocked(x, y)) continue;
        if (used.has(x + "," + y)) continue;
        const d = distances.get(x + "," + y);
        if (d == null || d < minDist || d > maxDist) continue;
        cells.push({ x: x, y: y, d: d });
      }
    }
    cells.sort((a, b) => a.d - b.d);
    return cells[0] || null;
  }

  function tutorialEnsureObjects() {
    if (!G.map || !G.playerPos) return;
    const used = tutorialUsedCells();

    const chestNear = (G.treasures || []).some((t) =>
      Math.abs(t.x - G.playerPos.x) + Math.abs(t.y - G.playerPos.y) <= 6);
    if (!chestNear) {
      const spot = tutorialFreeSpot(2, 6, used) || tutorialFreeSpot(1, 9, used);
      if (spot) {
        const item = (typeof randomItemForFloor === "function" && randomItemForFloor(0)) ||
          itemById("small_potion");
        if (item) {
          G.treasures.push({ uid: ++G.uid, x: spot.x, y: spot.y, item: item });
          used.add(spot.x + "," + spot.y);
        }
      }
    }

    const campNear = (G.camps || []).some((c) =>
      !c.used && Math.abs(c.x - G.playerPos.x) + Math.abs(c.y - G.playerPos.y) <= 8);
    if (!campNear) {
      const spot = tutorialFreeSpot(2, 6, used) || tutorialFreeSpot(1, 9, used);
      if (spot) {
        G.camps.push({ uid: ++G.uid, x: spot.x, y: spot.y, used: false });
        used.add(spot.x + "," + spot.y);
      }
    }

    const enemyNear = (G.enemies || []).some((e) =>
      !e.boss && Math.abs(e.x - G.playerPos.x) + Math.abs(e.y - G.playerPos.y) <= 7);
    if (!enemyNear) {
      const spot = tutorialFreeSpot(3, 7, used) || tutorialFreeSpot(2, 9, used);
      if (spot) {
        const enemy = makeEnemy("slime", 0);
        enemy.x = spot.x;
        enemy.y = spot.y;
        G.enemies.push(enemy);
      }
    }
    render();
  }

  function tutorialFinish(skipped) {
    const panel = tutorialPanelEl();
    if (panel) panel.classList.add("hidden");
    if (!G.tutorial) return;
    G.tutorial.active = false;
    const prof = hubProfile();
    if (prof && !prof.tutorialDone) {
      prof.tutorialDone = true;
      try { putProfile(G.name, prof); } catch (e) {}
    }
    if (skipped) setMsg("Памятка по управлению скрыта.");
  }

  function tutorialHide() {
    const panel = tutorialPanelEl();
    if (panel) panel.classList.add("hidden");
    if (G.tutorial) G.tutorial.active = false;
  }

  function tutorialStart() {
    if (G.tutorial && G.tutorial.active) return;
    if (!tutorialEligible() || !tutorialPanelEl()) return;
    G.tutorial = { active: true, moves: 0, chest: false, battle: false, camp: false };
    tutorialEnsureObjects();
    tutorialRender();
    setMsg("Управление: WASD — идти, E — действие, Пробел — пропустить ход.");
  }

  function tutorialEvent(kind) {
    if (!G.tutorial || !G.tutorial.active) return;
    if (kind === "move") {
      G.tutorial.moves += 1;
    } else if (kind === "chest" || kind === "battle" || kind === "camp") {
      G.tutorial[kind] = true;
    }
    tutorialRender();
  }

  function tutorialSkip() {
    if (!G.tutorial || !G.tutorial.active) return;
    tutorialFinish(true);
  }


  // --- Постоянная прогрессия в походе ---
  // Что герой приносит из деревни в подземелье: уровни улучшений и постройки.
  // Считается один раз при входе в поход и лежит в G.prog, чтобы бой, HUD и
  // награды читали готовые числа, а не лазили в профиль на каждом шаге.
  function progressBonus() {
    const prof = hubProfile();
    const h = (prof && prof.hero) || {};
    const v = (prof && prof.village) || {};
    const lvl = (x) => Math.max(0, Math.floor(Number(x) || 0));
    return {
      hp: Math.round(lvl(h.hp) * HERO_STEPS.hp + lvl(v.well) * VILLAGE_WELL_HP),
      dmg: Math.round(lvl(h.dmg) * HERO_STEPS.dmg),
      potions: lvl(h.potions) * HERO_STEPS.potions,
      loot: lvl(h.loot) * HERO_STEPS.loot,
      armor: lvl(h.armor) * HERO_STEPS.armor
    };
  }

  function progOf(key) {
    return (G.prog && G.prog[key]) || 0;
  }

  // Цена уровня улучшения героя: первый уровень по своей цене, каждый
  // следующий — ступенью дороже. Так последние уровни становятся целью на
  // несколько походов, а не покупкой между делом.
  function heroPrice(kind, level) {
    const base = HERO_PRICES[kind] || 60;
    return Math.round(base * Math.pow(HERO_PRICE_STEP, Math.max(0, level)));
  }

  // Множитель находок материалов от амбара: без амбара — единица.
  function lootMul() {
    const prof = hubProfile();
    const barn = prof && prof.village ? prof.village.barn || 0 : 0;
    return barn > 0 ? 1 + VILLAGE_BARN_BONUS : 1;
  }

  // Материалы уходят в профиль в момент находки — как амулет возврата, а не
  // в сумку похода: смерть их не отнимает, а постройки деревни ждут именно их.
  // Возвращает, сколько на самом деле прибавилось (с поправкой на амбар).
  function gainLoot(kind, n) {
    if (LOOT_KINDS.indexOf(kind) < 0) return 0;
    const prof = hubProfile();
    if (!prof) return 0;
    const amount = Math.max(0, Math.round((Number(n) || 0) * lootMul()));
    if (amount <= 0) return 0;
    prof.loot[kind] = (prof.loot[kind] || 0) + amount;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Найдено: " + LOOT_NAMES[kind] + " +" + amount + " (всего " + prof.loot[kind] + ").", "loot");
    if (kind === "ore") bumpQuest("ore", amount);
    return amount;
  }

  // Ключ из подземелья: уходит в профиль и переживает смерть. Ключи —
  // предметы квестов и запертых комнат, поэтому потерять их нельзя.
  function gainKey(key) {
    const prof = hubProfile();
    if (!prof || !key) return false;
    if (prof.loot.keys.indexOf(key) >= 0) return false;
    prof.loot.keys.push(key);
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Найден ключ: " + keyName(key) + ".", "loot");
    toast("Найден ключ: " + keyName(key));
    return true;
  }

  function hasKey(key) {
    const prof = hubProfile();
    return !!(prof && prof.loot && prof.loot.keys.indexOf(key) >= 0);
  }

  // Ключи: подпись и то, что они открывают. Список один, чтобы подпись в
  // журнале и назначение ключа у запертой двери не разъезжались.
  const KEY_DEFS = {
    barn: { name: "ключ от амбара", opens: "амбар" },
    smith: { name: "ключ от дома мастера", opens: "дом мастера" },
    seal: { name: "оберег глубины", opens: "седьмой этаж" },
    seal2: { name: "печать мастера", opens: "десятый этаж" }
  };

  function keyName(key) {
    const d = KEY_DEFS[key];
    return d ? d.name : String(key || "");
  }

  // --- Развитие деревни ---
  // Что и за что восстанавливается. Материалы падают в подземелье (руда с
  // третьего этажа, обломки с пятого), ключи — со стражей лестницы.
  // Постройки открывают силу героя, поэтому деревня и есть замок на победу:
  // без кузницы улучшений не купить, без дома мастера не поднять выше третьего.
  // Эффекты описаны функциями: числа берутся в момент показа окна, а не при
  // загрузке страницы — иначе правка баланса в админке оставила бы в подписи
  // старое число.
  const VILLAGE_BUILDINGS = {
    well: {
      name: "Колодец", yard: true,
      effect: () => "+" + Math.round(VILLAGE_WELL_HP) + " здоровья в каждом походе",
      levels: [{ ore: 3 }, { ore: 8, shard: 3 }]
    },
    barn: {
      name: "Амбар",
      effect: () => "+" + Math.round(VILLAGE_BARN_BONUS * 100) + "% находок материалов",
      levels: [{ wood: 3, key: "barn" }, { wood: 8, ore: 4 }]
    },
    forge: {
      name: "Кузница",
      effect: () => "улучшения героя до " + (villageLevel("smith") > 0 ? 3 : 3) + " уровня, II — амулет сверх потолка",
      levels: [{ ore: 4, wood: 2 }, { shard: 8, ore: 6 }]
    },
    smith: {
      name: "Дом мастера",
      effect: () => "улучшения героя до 5 уровня",
      levels: [{ key: "smith", shard: 3 }, { shard: 10 }]
    }
  };

  function villageLevel(key) {
    const prof = hubProfile();
    const v = (prof && prof.village) || {};
    return Math.max(0, Math.floor(Number(v[key]) || 0));
  }

  // Открыта ли постройка. Жилые дома деревни открыты всегда; амбар, кузницу
  // и дом мастера деревня восстанавливает, поэтому их двери заперты, пока в
  // профиле нет их уровня.
  function buildingUnlocked(key) {
    if (!key) return true;
    if (VILLAGE_HOUSES[key]) return true;
    return villageLevel(key) > 0;
  }

  // Заперта ли дверь прямо сейчас. Раскладка деревни при восстановлении
  // постройки не перерисовывается, поэтому замок на двери спрашивает профиль:
  // построили амбар — его дверь открылась на той же карте.
  function doorLocked(d) {
    if (!d || !d.locked) return false;
    return !buildingUnlocked(d.key);
  }

  // Цена следующего уровня постройки с учётом общего множителя цены.
  // null — если постройка уже на последнем уровне.
  function buildCost(key) {
    const def = VILLAGE_BUILDINGS[key];
    if (!def) return null;
    const level = villageLevel(key);
    if (level >= def.levels.length) return null;
    const raw = def.levels[level];
    const out = {};
    Object.keys(raw).forEach((k) => {
      out[k] = k === "key" ? raw[k] : Math.max(1, Math.round(raw[k] * VILLAGE_COST_MUL));
    });
    return out;
  }

  // Хватает ли материалов на постройку. Ключ берётся из профиля.
  function canPayBuild(cost) {
    if (!cost) return false;
    const prof = hubProfile();
    if (!prof) return false;
    return Object.keys(cost).every((k) => {
      if (k === "key") return prof.loot.keys.indexOf(cost[k]) >= 0;
      return (prof.loot[k] || 0) >= cost[k];
    });
  }

  // Потолок улучшений героя: кузница открывает первые три уровня, дом мастера
  // — остальные. Без кузницы улучшать нечего.
  function upgradeCap() {
    if (villageLevel("smith") > 0) return 5;
    if (villageLevel("forge") > 0) return 3;
    return 0;
  }

  function heroCap(kind) {
    const cap = Math.min(HERO_CAPS[kind] || 0, upgradeCap());
    return Math.max(0, cap);
  }

  function heroLevel(kind) {
    const prof = hubProfile();
    const h = (prof && prof.hero) || {};
    return Math.max(0, Math.floor(Number(h[kind]) || 0));
  }

  // Улучшения героя: подпись, что даёт и сколько стоит следующий уровень.
  // Ноль цены и потолка означает, что уровень купить нельзя.
  const HERO_UPGRADE_LIST = [
    { kind: "hp", name: "Здоровье", unit: "здоровья" },
    { kind: "dmg", name: "Сила", unit: "урона" },
    { kind: "potions", name: "Зелья", unit: "зелье на старте" },
    { kind: "loot", name: "Добыча", unit: "% золота" },
    { kind: "armor", name: "Броня", unit: "% гасимого урона" }
  ];

  // --- Квесты ---
  // Сюжетная цепочка старосты: каждая глава — опора деревни или победа.
  // Цель проверяется по состоянию мира (уровень постройки, рекорд), поэтому
  // главу нельзя забыть «сдать»: староста сам говорит, когда она закрыта.
  // Поля text/doneText — это сюжет для журнала, а не подсказка по механике.
  const CAMPAIGN = {
    title: "Печати глубины",
    prologue: "Деревня держится на четырёх опорах: амбар, колодец, кузня и дом " +
      "мастера. Под ними — старый спуск. Когда-то здесь учили первых писцов, " +
      "а потом заперли то, что не смогли объяснить. Дракон внизу охраняет " +
      "последнюю дверь.",
    epilogue: "Печати на месте. Деревня переживёт ещё одну зиму. За последней " +
      "дверью — тишина, и теперь только тебе решать, стоит ли её открывать."
  };

  const STORY_QUESTS = [
    {
      key: "barn", goal: "barn", title: "Крыша для амбара",
      place: "Деревня · амбар",
      brief: "Вернуть деревне склад и найти первую печать.",
      text: "Амбар заколочен с прошлой зимы, и деревня держится на честном " +
        "слове. В подполе спрятана первая печать; ключ от двери висит на поясе " +
        "стража лестницы, а доски разбросаны по сундукам подземелья.",
      objective: "Восстановить амбар и вернуться к старосте.",
      doneText: "Амбар снова стоит. Под старым полом нашлась печать — тёплая, " +
        "будто её только что держали в руках. Староста долго молчит, прежде " +
        "чем сказать: «Одной опорой больше».",
      reward: { gold: 60, ore: 2 }
    },
    {
      key: "well", goal: "well", title: "Вода для деревни",
      place: "Деревня · колодец",
      brief: "Расчистить колодец и услышать, что говорит глубина.",
      text: "Колодец засыпан камнем. Беда не в воде: через него деревня слушает " +
        "глубину и узнаёт, когда просыпаются старые замки. На расчистку нужна руда.",
      objective: "Восстановить колодец и вернуться к старосте.",
      doneText: "Вода пошла. В её шуме ясно слышен чужой голос: «Не спускайся " +
        "дальше». Староста делает вид, что не слышит.",
      reward: { gold: 60, wood: 2 }
    },
    {
      key: "forge", goal: "forge", title: "Разжечь горн",
      place: "Деревня · кузница",
      brief: "Восстановить кузницу и получить оберег глубины.",
      text: "Кузница стоит холодной. Пока горн не горит, герой не может укрепить " +
        "снаряжение, а спуск за четвёртым этажом закрыт без оберега глубины. " +
        "Нужны руда и древесина.",
      objective: "Восстановить кузницу и вернуться к старосте.",
      doneText: "Горн зажжён. Староста вручает оберег глубины: «Это не ключ. " +
        "Это обещание вернуться».",
      reward: { gold: 80, ore: 3, key: "seal" }
    },
    {
      key: "smith", goal: "smith", title: "Дверь мастера",
      place: "Деревня · дом мастера",
      brief: "Открыть дом мастера и снять вторую печать.",
      text: "Дом мастера заперт. Внутри — верстак, старые чертежи и вторая печать. " +
        "Ключ держит страж в ледяных залах; на ремонт нужны обломки.",
      objective: "Открыть дом мастера и вернуться к старосте.",
      doneText: "Дверь открыта. Мастер долго смотрит на печать, потом говорит: " +
        "«Значит, дракон ещё спит». Он отдаёт печать мастера — пропуск к " +
        "последнему спуску.",
      reward: { gold: 120, ore: 2, key: "seal2" }
    },
    {
      key: "dragon", goal: "victory", title: "Дракон",
      place: "Подземелье · последний спуск",
      brief: "Спуститься к дракону и закрыть старый круг.",
      text: "Опоры стоят, печати собраны. Внизу остался дракон — последний страж " +
        "старого спуска. Он ждёт не меча, а ответа: достоин ли герой закрыть " +
        "за собой дверь.",
      objective: "Победить дракона и вернуться в деревню.",
      doneText: "Дракон падает. За его спиной нет сокровищ — только дверь, " +
        "которую больше некому охранять. Ты возвращаешься в деревню с правом " +
        "закрыть её или открыть.",
      reward: { gold: 200, shard: 2 }
    }
  ];

  // Повторяемые задания. Цель считается внутри похода: «за один поход»
  // означает именно это, а частичный прогресс между спусками не копится.
  const REPEAT_QUESTS = {
    guard: {
      title: "Страж на пути", need: 1,
      text: "Срази стража лестницы — того, что охраняет спуск.",
      reward: { gold: 60, ore: 2 }, progress: "стражей побеждено"
    },
    ore: {
      title: "Руда для деревни", need: 3,
      text: "Подними три руды за один поход.",
      reward: { gold: 80, wood: 3 }, progress: "руды найдено"
    },
    nomiss: {
      title: "Без единой ошибки", need: 2,
      text: "Пройди два этажа подряд, не ошибившись ни разу.",
      reward: { gold: 70, ore: 3 }, progress: "этажей пройдено чисто"
    }
  };

  const REPEAT_KEYS = ["guard", "ore", "nomiss"];

  // Затворы стоят на границе двух последних отрезков: после трёх биомов
  // (шестой этаж) и перед драконом (десятый). Так у игрока есть время
  // собрать материалы и пройти три главы до первого затвора.
  const SEALS = [
    { floor: 6, key: "seal", what: "оберег глубины", from: "кузницы" },
    { floor: 9, key: "seal2", what: "печать мастера", from: "дома мастера" }
  ];

  // Затвор для следующего этажа: null, если спуск свободен.
  function sealFor(nextIndex) {
    for (let i = 0; i < SEALS.length; i += 1) {
      if (nextIndex >= SEALS[i].floor && !hasKey(SEALS[i].key)) return SEALS[i];
    }
    return null;
  }

  // Можно ли спуститься дальше. Затвор не мешает подниматься наверх и не
  // действует в бесконечном режиме: там глубина уже открыта победой.
  function canDescend() {
    if (runIsEndless()) return true;
    return !sealFor(G.floorIndex + 1);
  }

  function sealMessage(seal) {
    const s = seal || sealFor(G.floorIndex + 1);
    if (!s) return "";
    const chain = s.key === "seal"
      ? "Сначала подними деревню: амбар, колодец, кузница. "
      : "";
    return "Спуск запечатан: нужен " + s.what + ". Его выдают в деревне у " +
      s.from + ". " + chain + "Вернись в деревню порталом на этаже босса. " +
      "Если не хватает материалов, обыщи старые этажи: сундуки и жилы там ещё целы. " +
      "Поход сохранится — продолжишь с этого этажа.";
  }

  function questsOf() {
    const prof = hubProfile();
    return prof ? prof.quests : null;
  }

  // Текущий шаг сюжета: null, если цепочка пройдена.
  function storyStep() {
    const q = questsOf();
    if (!q) return null;
    return STORY_QUESTS[q.story] || null;
  }

  const STORY_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  // Номер главы нужен и журналу, и строке HUD. Держим его в одном месте,
  // чтобы «Глава II» не превратилась где-то в «шаг 2».
  function storyChapterNumber(index) {
    return STORY_NUMERALS[index] || String(index + 1);
  }

  function storyDoneCount() {
    const q = questsOf();
    return q ? Math.max(0, Math.min(Number(q.story) || 0, STORY_QUESTS.length)) : 0;
  }

  // Короткая строка для постоянного HUD: какая глава идёт сейчас.
  // Когда цель закрыта, игрок видит не новую подсказку, а состояние сюжета:
  // «вернись к старосте». Подробности остаются в журнале.
  function storyHudData() {
    if (isFirstRun() && G.place === "village" && !G.firstGoalDone) {
      return { kicker: "Первый спуск", title: "Страж входа →", ready: false, done: false };
    }
    const done = storyDoneCount();
    const step = STORY_QUESTS[done];
    if (!step) {
      return {
        kicker: "Кампания",
        title: "Печати на месте",
        ready: false,
        done: done >= STORY_QUESTS.length
      };
    }
    const ready = goalDone(step.goal);
    return {
      kicker: ready
        ? "Глава " + storyChapterNumber(done) + " · к старосте"
        : "Глава " + storyChapterNumber(done),
      title: step.title,
      ready: ready,
      done: false
    };
  }

  // Сколько уже собрано к цели шага: «руда 4/8 · древесина 2/4». Без этой
  // строки первые походы выглядят как пять провалов подряд, хотя на самом деле
  // ученик идёт к постройке и половину пути уже прошёл.
  function goalProgressText(goal) {
    if (!goal || goal === "victory") return "";
    const cost = buildCost(goal);
    const prof = hubProfile();
    if (!cost || !prof) return "";
    const parts = [];
    Object.keys(cost).forEach((k) => {
      if (k === "key") {
        parts.push((prof.loot.keys.indexOf(cost[k]) >= 0 ? "✓ " : "") + keyName(cost[k]));
        return;
      }
      const have = Math.min(prof.loot[k] || 0, cost[k]);
      parts.push(LOOT_NAMES[k] + " " + have + "/" + cost[k]);
    });
    return parts.join(" · ");
  }

  // Выполнена ли цель шага. Постройки — по уровню в профиле, дракон — по рекорду.
  function goalDone(goal) {
    if (goal === "victory") {
      const prof = hubProfile();
      return !!(prof && prof.dungeonBest && prof.dungeonBest.victory);
    }
    return villageLevel(goal) > 0;
  }

  // Прогресс повторяемого задания живёт в походе: G.questProgress.
  function questProgress() {
    return (G.questProgress && G.questProgress.n) || 0;
  }

  function bumpQuest(key, n) {
    const q = questsOf();
    if (!q || q.active !== key) return;
    G.questProgress = G.questProgress || { n: 0 };
    G.questProgress.n = Math.min(REPEAT_QUESTS[key].need, G.questProgress.n + (n || 1));
    const def = REPEAT_QUESTS[key];
    setMsg("Задание: " + def.progress + " " + G.questProgress.n + " из " + def.need + ".");
    if (G.questProgress.n >= def.need) log("Задание выполнено: " + def.title + ". Загляни к старосте.", "loot");
    updateHud();
  }

  // Награда: золото в банк деревни (как добыча похода) и материалы на склад.
  function payQuest(reward) {
    const prof = hubProfile();
    if (!prof) return [];
    const parts = [];
    if (reward.gold) {
      prof.wallet.gold = (prof.wallet.gold || 0) + reward.gold;
      parts.push(reward.gold + " золота");
    }
    // Ключ в награде — как оберег глубины: он не покупается и не выпадает,
    // его выдаёт староста, поэтому цепочка квестов и есть ключ от глубины.
    if (reward.key && prof.loot.keys.indexOf(reward.key) < 0) {
      prof.loot.keys.push(reward.key);
      parts.push(keyName(reward.key));
    }
    Object.keys(reward).forEach((k) => {
      if (k === "gold") return;
      if (LOOT_KINDS.indexOf(k) < 0) return;
      const n = Math.max(0, Math.round(reward[k] * lootMul()));
      prof.loot[k] = (prof.loot[k] || 0) + n;
      parts.push(LOOT_NAMES[k] + " +" + n);
    });
    putProfile(hubName(), prof);
    syncProfile(hubName());
    return parts;
  }

  function claimStory() {
    const step = storyStep();
    if (!step || !goalDone(step.goal)) return false;
    const parts = payQuest(step.reward);
    const prof = hubProfile();
    const chapterIndex = prof.quests.story;
    prof.quests.story += 1;
    prof.quests.done.push(step.key);
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Староста: глава " + storyChapterNumber(chapterIndex) + " «" + step.title +
      "» закрыта. Награда: " + parts.join(", ") + ".", "loot");
    const next = storyStep();
    if (next) {
      log("Сюжет: начинается глава " + storyChapterNumber(prof.quests.story) +
        " «" + next.title + "». " + next.brief, "floor");
      toast("Глава " + storyChapterNumber(chapterIndex) + " завершена. Дальше: " + next.title);
    } else {
      log("Сюжет: кампания «" + CAMPAIGN.title + "» завершена. " + CAMPAIGN.epilogue, "floor");
      toast("Кампания завершена: печати на месте");
    }
    renderVillageInfo();
    updateWalletLine();
    updateHud();
    return true;
  }

  function takeRepeatQuest(key) {
    const prof = hubProfile();
    if (!prof) return false;
    if (key && !REPEAT_QUESTS[key]) return false;
    // Снятое или заменённое задание остаётся в журнале как проваленное —
    // иначе отказ выглядел бы так, будто поручения никогда и не было.
    const old = prof.quests.active;
    if (old && old !== key) {
      prof.quests.failed = (prof.quests.failed || []).concat([old]).slice(-60);
    }
    // Пустой ключ — отказ от задания: без него тоже пускают, а цель может
    // оказаться не по силам.
    if (!key) {
      prof.quests.active = "";
      putProfile(hubName(), prof);
      syncProfile(hubName());
      G.questProgress = { n: 0 };
      setMsg("Задание отложено — можно идти и без него.");
      updateHud();
      return true;
    }
    prof.quests.active = key;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    G.questProgress = { n: 0 };
    setMsg("Взято задание: " + REPEAT_QUESTS[key].title);
    updateHud();
    return true;
  }

  // Перерисовать открытое окно жителя: постройки, покупки и квесты меняют его
  // содержимое, а вешать перерисовку на каждую кнопку — дублирование.
  function refreshDialog() {
    if (G.dialogNpc && !el("dialog-overlay").classList.contains("hidden")) openDialog(G.dialogNpc);
  }

  function claimRepeat() {
    // Профиль до выплаты нужен только чтобы узнать задание. Сохранять его
    // после payQuest нельзя: payQuest пишет отдельную копию профиля, и
    // putProfile старой копией затирал награду — тост обещал золото,
    // которого не было.
    const current = hubProfile();
    if (!current) return false;
    const key = current.quests.active;
    const def = REPEAT_QUESTS[key];
    if (!def || questProgress() < def.need) return false;
    const parts = payQuest(def.reward);
    const prof = hubProfile();
    if (!prof) return false;
    prof.quests.repeat[key] = (prof.quests.repeat[key] || 0) + 1;
    prof.quests.active = "";
    prof.quests.failed = (prof.quests.failed || []).filter((k) => k !== key);
    putProfile(hubName(), prof);
    syncProfile(hubName());
    G.questProgress = { n: 0 };
    log("Староста: «" + def.title + "» — выполнено. Награда: " + parts.join(", ") + ".", "loot");
    toast("Награда: " + parts.join(", "));
    renderVillageInfo();
    updateWalletLine();
    updateHud();
    return true;
  }

  // Строка цели для HUD: что сейчас от героя хотят. Пусто — ничего не хотят.
  function questLine() {
    const prof = hubProfile();
    if (!prof) return "";
    const active = prof.quests.active;
    if (active && REPEAT_QUESTS[active]) {
      const def = REPEAT_QUESTS[active];
      const done = questProgress() >= def.need;
      return (done ? "Сдать старосте: " : "Задание: ") + def.title +
        (done ? "" : " (" + questProgress() + "/" + def.need + ")");
    }
    const step = storyStep();
    if (!step) return "";
    const chapter = storyChapterNumber(prof.quests.story);
    if (goalDone(step.goal)) return "Глава " + chapter + " готова — вернись к старосте";
    const prog = goalProgressText(step.goal);
    return "Глава " + chapter + ": " + step.title + (prog ? " (" + prog + ")" : "");
  }

  // ---------- Журнал кампании ----------
  // Журнал — не лог событий и не список подсказок. Первая вкладка показывает
  // сюжет: пролог, текущую главу, её цель и весь путь до финала. Поручения
  // старосты и закрытые записи лежат отдельно, чтобы не размывать сюжет.
  // События по-прежнему пишутся в скрытый #log для проверок.
  let journalTab = "story";

  const JOURNAL_TABS = {
    story: "Сюжет",
    tasks: "Поручения",
    archive: "Архив"
  };

  function repeatActiveEntry() {
    const prof = hubProfile();
    const q = prof && prof.quests;
    const key = q && q.active;
    const def = REPEAT_QUESTS[key];
    if (!def) return null;
    const now = questProgress();
    const ready = now >= def.need;
    return {
      title: def.title,
      text: def.text,
      meta: def.progress + ": " + now + " / " + def.need +
        " · награда: " + rewardText(def.reward),
      status: ready ? "Готово к сдаче" : "В работе",
      kind: "repeat"
    };
  }

  function archiveEntries() {
    const out = [];
    const prof = hubProfile();
    if (!prof) return out;
    const q = prof.quests || {};
    const done = storyDoneCount();
    STORY_QUESTS.slice(0, done).forEach((step, index) => {
      out.push({
        title: "Глава " + storyChapterNumber(index) + ". " + step.title,
        text: step.doneText || step.text,
        meta: step.place + " · награда: " + rewardText(step.reward),
        status: "Завершено",
        kind: "story"
      });
    });
    REPEAT_KEYS.forEach((key) => {
      const def = REPEAT_QUESTS[key];
      const count = q.repeat && q.repeat[key];
      if (!def || !count) return;
      out.push({
        title: def.title,
        text: def.text,
        meta: "Выполнено раз: " + count + " · награда: " + rewardText(def.reward),
        status: "Выполнено ×" + count,
        kind: "repeat",
        done: true
      });
    });
    (q.failed || []).forEach((key) => {
      const def = REPEAT_QUESTS[key];
      if (!def) return;
      out.push({
        title: def.title,
        text: def.text,
        meta: "Задание снято или заменено",
        status: "Провалено",
        kind: "repeat",
        failed: true
      });
    });
    return out;
  }

  function journalCard(item) {
    const cls = item.failed ? " is-failed" : (item.done || item.kind === "story") ? " is-done" : "";
    return "<article class='journal-card" + cls + "'>" +
      "<div class='journal-card-head'><span class='journal-kind'>" +
      (item.kind === "story" ? "Сюжет" : "Поручение") + "</span>" +
      "<span class='journal-status'>" + item.status + "</span></div>" +
      "<h3>" + item.title + "</h3>" +
      "<p>" + item.text + "</p>" +
      "<div class='journal-meta'>" + item.meta + "</div>" +
      "</article>";
  }

  // Путь кампании: пройденное, текущая глава и то, что ещё впереди. Это не
  // спойлер квестов, а каркас истории — игроку видно, куда ведёт сюжет.
  function storyPathHtml() {
    const done = storyDoneCount();
    const rows = STORY_QUESTS.map((step, index) => {
      const isDone = index < done;
      const isCurrent = index === done;
      const ready = isCurrent && goalDone(step.goal);
      const state = isDone ? "is-done" : isCurrent ? "is-current" : "is-locked";
      const label = isDone ? "Пройдено" : isCurrent ? (ready ? "Готово" : "Сейчас") : "Впереди";
      return "<li class='story-path-step " + state + (ready ? " is-ready" : "") + "'>" +
        "<span class='story-path-num'>" + storyChapterNumber(index) + "</span>" +
        "<div class='story-path-text'><b>" + step.title + "</b><span>" + step.brief + "</span></div>" +
        "<span class='story-path-state'>" + label + "</span></li>";
    }).join("");
    return "<div class='story-path-head'>Путь кампании</div><ol class='story-path'>" + rows + "</ol>";
  }

  function storyTabHtml() {
    const done = storyDoneCount();
    const step = STORY_QUESTS[done];
    let html = "<div class='story-campaign'>" +
      "<div class='story-prologue'>" +
      "<div class='story-kicker'>Кампания «" + CAMPAIGN.title + "»</div>" +
      "<p>" + CAMPAIGN.prologue + "</p></div>";
    if (!step) {
      html += "<article class='story-current is-done'>" +
        "<div class='story-kicker'>Финал · " + done + " из " + STORY_QUESTS.length + "</div>" +
        "<h3>Печати на месте</h3>" +
        "<p class='story-lead'>" + CAMPAIGN.epilogue + "</p></article>";
    } else {
      const ready = goalDone(step.goal);
      const progress = goalProgressText(step.goal);
      html += "<article class='story-current" + (ready ? " is-ready" : "") + "'>" +
        "<div class='story-kicker'>Глава " + storyChapterNumber(done) + " из " +
        STORY_QUESTS.length + " · " + step.place + "</div>" +
        "<h3>" + step.title + "</h3>" +
        "<p class='story-lead'>" + step.text + "</p>" +
        "<div class='story-objective'><span>Цель</span><p>" + step.objective + "</p></div>" +
        "<div class='story-progress" + (ready ? " is-ready" : "") + "'>" +
        "<span>" + (ready ? "Цель выполнена — вернись к старосте" : (progress || "Цель в работе")) + "</span>" +
        "<span>Награда: " + rewardText(step.reward) + "</span></div></article>";
    }
    html += storyPathHtml() + "</div>";
    return html;
  }

  function tasksTabHtml() {
    const entry = repeatActiveEntry();
    if (!entry) {
      return "<div class='journal-empty'>Поручений нет. Староста выдаёт их в деревне.</div>";
    }
    return "<div class='journal-list'>" + journalCard(entry) + "</div>";
  }

  function archiveTabHtml() {
    const items = archiveEntries();
    if (!items.length) return "<div class='journal-empty'>Архив пока пуст.</div>";
    return "<div class='journal-list'>" + items.map(journalCard).join("") + "</div>";
  }

  function renderJournal() {
    const box = el("journal-box");
    if (!box) return;
    if (!JOURNAL_TABS[journalTab]) journalTab = "story";
    const done = storyDoneCount();
    const active = repeatActiveEntry();
    const archive = archiveEntries();
    const counts = {
      story: done + "/" + STORY_QUESTS.length,
      tasks: active ? 1 : 0,
      archive: archive.length
    };
    let subtitle;
    if (done >= STORY_QUESTS.length) subtitle = "Кампания завершена · печати на месте";
    else {
      const step = STORY_QUESTS[done];
      subtitle = "Кампания «" + CAMPAIGN.title + "» · глава " +
        storyChapterNumber(done) + " из " + STORY_QUESTS.length + " · " + step.title;
    }
    let html = "<div class='battle-head'><div>" +
      "<div class='enemy-name'>Журнал</div>" +
      "<div class='hud-num'>" + subtitle + "</div>" +
      "</div><button class='exit-btn' id='journal-close' type='button' " +
      "data-tip='Закрыть журнал. Клавиша Escape.'>Закрыть</button></div>";
    html += "<div class='battle-mid journal-body'>" +
      "<div class='journal-tabs' role='tablist' aria-label='Разделы журнала'>" +
      Object.keys(JOURNAL_TABS).map((tab) =>
        "<button class='journal-tab" + (tab === journalTab ? " is-active" : "") +
        "' type='button' role='tab' aria-selected='" + (tab === journalTab) +
        "' data-jtab='" + tab + "'>" + JOURNAL_TABS[tab] +
        " <b>" + counts[tab] + "</b></button>"
      ).join("") + "</div>";
    if (journalTab === "story") html += storyTabHtml();
    else if (journalTab === "tasks") html += tasksTabHtml();
    else html += archiveTabHtml();
    html += "</div>";
    html += "<div class='battle-foot'><span class='foot-note'>Сюжет, поручения и архив</span>" +
      "<span class='win-chip'>Esc — закрыть</span></div>";
    box.innerHTML = html;

    const close = el("journal-close");
    if (close) close.addEventListener("click", closeJournal);
    box.querySelectorAll("[data-jtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        journalTab = btn.dataset.jtab;
        renderJournal();
      });
    });
  }

  function openJournal(tab) {
    if (tab && JOURNAL_TABS[tab]) journalTab = tab;
    closeGamePanel();
    renderJournal();
    el("journal-overlay").classList.remove("hidden");
    const btn = el("log-toggle");
    if (btn) btn.classList.add("active");
  }

  function closeJournal() {
    el("journal-overlay").classList.add("hidden");
    const btn = el("log-toggle");
    if (btn) btn.classList.remove("active");
  }

  // ---------- Справочник ----------
  const CODEX_TABS = {
    controls: "Управление",
    items: "Предметы",
    npcs: "НПС",
    mobs: "Мобы"
  };
  const CODEX_CONTROLS = [
    ["WASD / стрелки", "ходить по карте"],
    ["E", "действие: сундук, дверь, торговец, лестница"],
    ["Пробел", "пропустить ход — монстры ходят без тебя"],
    ["I", "открыть инвентарь"],
    ["M", "показать или скрыть мини-карту"],
    ["Колесо мыши", "приблизить или отдалить карту"],
    ["Esc", "пауза или закрыть открытое окно"],
    ["Кузница", "улучшения героя у кузнеца в деревне"]
  ];
  const CODEX_NPC_ROLES = {
    guard: "Спуск в подземелье",
    trader: "Лавка и товары",
    elder: "Сюжетные задания",
    mentor: "Обучение",
    blacksmith: "Кузница",
    master: "Улучшения снаряжения",
    storekeeper: "Амбар и припасы"
  };
  let codexTab = "controls";

  function codexState() {
    if (!G.codex || typeof G.codex !== "object") {
      G.codex = { items: {}, npcs: {}, enemies: {} };
    }
    ["items", "npcs", "enemies"].forEach((kind) => {
      if (!G.codex[kind] || typeof G.codex[kind] !== "object") G.codex[kind] = {};
    });
    return G.codex;
  }

  function markCodex(kind, key) {
    if (!kind || !key) return;
    const codex = codexState();
    if (!codex[kind][key]) {
      codex[kind][key] = 1;
      scheduleSave();
    }
  }

  function codexItemList() {
    const seen = {};
    const out = [];
    const add = (item) => {
      if (!item || !item.id || seen[item.id]) return;
      seen[item.id] = true;
      out.push(item);
    };
    const state = codexState();
    Object.keys(state.items).forEach((id) => add(typeof itemById === "function" ? itemById(id) : null));
    if (G.equipment) Object.keys(G.equipment).forEach((slot) => add(G.equipment[slot]));
    (G.inventory || []).forEach(add);
    return out;
  }

  function codexCard(title, meta, body, icon, className) {
    return "<article class='codex-card " + (className || "") + "'>" +
      "<div class='codex-card-icon'>" + (icon || "") + "</div>" +
      "<div class='codex-card-main'><div class='codex-card-head'><h3>" + title + "</h3>" +
      (meta ? "<span>" + meta + "</span>" : "") + "</div>" +
      (body ? "<p>" + body + "</p>" : "") + "</div></article>";
  }

  function codexBodyHtml(tab) {
    if (tab === "controls") {
      return "<div class='codex-list'>" + CODEX_CONTROLS.map((row) =>
        "<div class='codex-key'><b>" + row[0] + "</b><span>" + row[1] + "</span></div>"
      ).join("") + "</div>";
    }
    if (tab === "items") {
      const items = codexItemList();
      if (!items.length) {
        return "<div class='codex-empty'>Изученных предметов пока нет: подбери что-нибудь в подземелье.</div>";
      }
      return "<div class='codex-list'>" + items.map((item) => {
        const rarity = RARITY[item.rarity] || RARITY.common;
        return codexCard(item.name,
          (SLOT_NAMES[item.slot] || item.slot) + " · " + rarity.name,
          (itemBonusText(item) ? itemBonusText(item) + ". " : "") + (item.desc || ""),
          itemPic(item, rarity.color),
          "is-item");
      }).join("") + "</div>";
    }
    if (tab === "npcs") {
      const known = VILLAGE_NPCS.filter((npc) => codexState().npcs[npc.key]);
      if (!known.length) {
        return "<div class='codex-empty'>Ты ещё не встретил ни одного жителя деревни.</div>";
      }
      return "<div class='codex-list'>" + known.map((npc) =>
        codexCard(npc.name, "Деревня", CODEX_NPC_ROLES[npc.key] || "Житель деревни.",
          iconSvg("npc_" + npc.key))
      ).join("") + "</div>";
    }
    if (tab === "mobs") {
      const known = ENEMY_TYPES.filter((mob) => codexState().enemies[mob.key]);
      if (!known.length) {
        return "<div class='codex-empty'>Ты ещё не встретил ни одного противника.</div>";
      }
      return "<div class='codex-list'>" + known.map((mob) =>
        codexCard(mob.name,
          "HP " + mob.hp + " · урон " + mob.dmg + (mob.boss ? " · босс" : ""),
          mob.abilityText || "Обычный противник подземелья.",
          iconSvg(mob.key))
      ).join("") + "</div>";
    }
    return "";
  }

  function renderCodex() {
    const box = el("codex-box");
    if (!box) return;
    if (!CODEX_TABS[codexTab]) codexTab = "controls";
    let html = "<div class='battle-head'><div>" +
      "<div class='enemy-name'>Справочник</div>" +
      "<div class='hud-num'>Управление, предметы, НПС и мобы</div>" +
      "</div><button class='exit-btn' id='codex-close' type='button' " +
      "data-tip='Закрыть справочник. Клавиша Escape.'>Закрыть</button></div>";
    html += "<div class='battle-mid codex-body'>" +
      "<div class='codex-tabs' role='tablist' aria-label='Разделы справочника'>" +
      Object.keys(CODEX_TABS).map((tab) =>
        "<button class='codex-tab" + (tab === codexTab ? " is-active" : "") +
        "' type='button' role='tab' aria-selected='" + (tab === codexTab) +
        "' data-codex-tab='" + tab + "'>" + CODEX_TABS[tab] + "</button>"
      ).join("") + "</div>" + codexBodyHtml(codexTab) + "</div>";
    html += "<div class='battle-foot'><span class='foot-note'>Знания героя</span>" +
      "<span class='win-chip'>Esc — закрыть</span></div>";
    box.innerHTML = html;
    const close = el("codex-close");
    if (close) close.addEventListener("click", closeCodex);
    box.querySelectorAll("[data-codex-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        codexTab = btn.dataset.codexTab;
        renderCodex();
      });
    });
  }

  function openCodex() {
    closeGamePanel();
    renderCodex();
    el("codex-overlay").classList.remove("hidden");
    document.removeEventListener("keydown", codexKeydown, true);
    document.addEventListener("keydown", codexKeydown, true);
  }

  function codexKeydown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    closeCodex();
  }

  function closeCodex() {
    const box = el("codex-overlay");
    if (box) box.classList.add("hidden");
    document.removeEventListener("keydown", codexKeydown, true);
  }

  window.PyCodex = { open: openCodex, close: closeCodex };

  // ---------- Обновления ----------
  // Короткая лента новостей для главного меню. Новые записи — сверху.
  const UPDATES = [
    {
      version: "1.9.1",
      date: "28 октября 2026",
      title: "Возврат из подземелья и первая глава",
      items: [
        "Портал в деревню теперь отмечен на миникарте, как только он открылся после босса. Раньше его приходилось искать по всему этажу.",
        "Амбар восстанавливается за три доски вместо четырёх: первый забег больше не упирается в возврат на прошлый этаж из-за одной доски.",
        "Честный первый забег пройден до дракона без dev-панели и телепортов: все пять глав деревни, обе печати и финальная победа."
      ]
    },
    {
      version: "1.9.0",
      date: "26 октября 2026",
      title: "Короткий спуск и публичная оболочка",
      items: [
        "Пять биомов по два этажа: десять этажей, пять боссов и полный поход примерно на 20–40 минут.",
        "Затворы глубины стоят на пороге седьмого и десятого этажей; материалы и постройки пересчитаны под короткий забег.",
        "Вход в подземелье стал короче: без проверки знаний, сразу выбор сложности и режима.",
        "Публичная страница со скриншотами, описанием и кнопкой входа в игру.",
        "Сохранения можно выгрузить в файл и загрузить обратно, а на телефоне появился экранный крест."
      ]
    },
    {
      version: "1.8.2",
      date: "24 октября 2026",
      title: "Грибы убраны из декора",
      items: [
        "Грибы больше не появляются на полу и не стоят предметами декора — их место заняли обломки.",
        "Ловушка «Споры грибов» осталась в игре: это не декор, а опасность этажа."
      ]
    },
    {
      version: "1.8.1",
      date: "24 октября 2026",
      title: "Бой закрывается сам",
      items: [
        "После победы окно боя показывает итог пару секунд и плавно исчезает — кнопка «Забрать добычу» больше не нужна.",
        "Кнопка «Убить всех» в панели разработчика теперь оставляет мешочки с добычей на местах всех врагов."
      ]
    },
    {
      version: "1.8.0",
      date: "24 октября 2026",
      title: "Тихие ловушки и мешочки с добычей",
      items: [
        "Ловушки больше не светятся и не пульсируют: их видно по едва заметной неровности пола.",
        "Обычные монстры и элита, но не боссы, сами наступают на ловушки и получают урон или теряют ход.",
        "После смерти врага или босса на его клетке остаётся мешочек: золото и предмет забираются шагом или кнопкой действия."
      ]
    },
    {
      version: "1.7.2",
      date: "24 октября 2026",
      title: "Баланс глубин",
      items: [
        "Здоровье и урон врагов на поздних этажах снижены: обычные мобы больше не требуют десятков вопросов.",
        "У боссов свой запас здоровья вместо общего вида: Гоблин-вожак остаётся первым испытанием, а Дракон — финальным, но не стеной на 40 000 HP.",
        "Кривая глубины стала мягче: бой удлиняется постепенно, а прокачка и снаряжение успевают за ней."
      ]
    },
    {
      version: "1.7.1",
      date: "24 октября 2026",
      title: "Порталы после боссов",
      items: [
        "После каждого босса, кроме финального Дракона, открывается портал в деревню.",
        "Оберег глубины теперь закрывает спуск сразу после Гоблина-вожака, а печать мастера — после Некроманта.",
        "Вернуться за наградой можно с этажа босса, не поднимаясь по старым лестницам."
      ]
    },
    {
      version: "1.7.0",
      date: "24 октября 2026",
      title: "Пять биомов",
      items: [
        "Двадцать этажей разбиты на пять биомов по три обычных этажа и боссу: Пещеры новичка, Забытые катакомбы, Ледяные залы, Обитель демонов и Логово дракона.",
        "У каждого биома свой босс: Гоблин-вожак, Некромант, Король големов, Владыка демонов и Дракон.",
        "В главном меню появился раздел «Обновления» — здесь будут короткие новости о том, что изменилось."
      ]
    },
    {
      version: "1.6.1",
      date: "22 октября 2026",
      title: "Справочник, портал и панель P",
      items: [
        "В главном меню и паузе появился «Справочник» с управлением, предметами, НПС и мобами.",
        "На этаже босса после зачистки открывается портал в деревню.",
        "Панель разработчика открывается по P; «Продолжить поход» снова возвращает на сохранённый этаж."
      ]
    },
    {
      version: "1.6.0",
      date: "21 октября 2026",
      title: "Верхнее меню и журнал",
      items: [
        "Статы, Этаж, Инвентарь, Достижения и Журнал переехали в верхнее меню.",
        "Журнал показывает выполненные, активные и проваленные задания.",
        "Появились достижения, общий инвентарь и деревенские постройки."
      ]
    }
  ];

  function updatesHtml() {
    const info = typeof window !== "undefined" ? window.__PYQUIZ_VERSION : null;
    const current = (info && info.version) || "1.7.0";
    const rows = UPDATES.map((entry) =>
      "<article class='update-entry'>" +
      "<div class='update-entry-head'><h3>" + escText(entry.title) + "</h3>" +
      "<span class='update-version'>v" + escText(entry.version) + "</span></div>" +
      "<div class='update-date'>" + escText(entry.date) + "</div>" +
      "<ul>" + entry.items.map((item) => "<li>" + escText(item) + "</li>").join("") + "</ul>" +
      "</article>"
    ).join("");
    return "<div class='battle-head'><div>" +
      "<div class='enemy-name'>Обновления</div>" +
      "<div class='hud-num'>Что нового · v" + escText(current) + "</div>" +
      "</div><button class='exit-btn' id='updates-close' type='button' " +
      "data-tip='Закрыть обновления. Клавиша Escape.'>Закрыть</button></div>" +
      "<div class='battle-mid updates-body'>" + rows + "</div>" +
      "<div class='battle-foot'><span class='foot-note'>Новости игры</span>" +
      "<span class='win-chip'>Esc — закрыть</span></div>";
  }

  function updatesKeydown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    closeUpdates();
  }

  function openUpdates() {
    closeCodex();
    closeGamePanel();
    const box = el("updates-box");
    if (!box) return;
    box.innerHTML = updatesHtml();
    const close = el("updates-close");
    if (close) close.addEventListener("click", closeUpdates);
    el("updates-overlay").classList.remove("hidden");
    document.removeEventListener("keydown", updatesKeydown, true);
    document.addEventListener("keydown", updatesKeydown, true);
  }

  function closeUpdates() {
    const box = el("updates-overlay");
    if (box) box.classList.add("hidden");
    document.removeEventListener("keydown", updatesKeydown, true);
  }

  window.PyUpdates = {
    open: openUpdates,
    close: closeUpdates,
    isOpen: () => !!(el("updates-overlay") && !el("updates-overlay").classList.contains("hidden"))
  };

  function amuletWord(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "амулет";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "амулета";
    return "амулетов";
  }

  // Переносит долю походного золота в банк деревни. Вызывается один раз —
  // при возврате в деревню (после смерти или победы).
  function bankRunGold(share) {
    const prof = hubProfile();
    if (!prof || !G.player) return 0;
    const s = Math.max(0, Math.min(1, Number(share) || 0));
    const amount = Math.floor((G.player.gold || 0) * s);
    if (amount <= 0) return 0;
    prof.wallet = prof.wallet || { gold: 0, small_potion: 0, big_potion: 0 };
    prof.wallet.gold = (prof.wallet.gold || 0) + amount;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    return amount;
  }

  // Смерть без амулета (или отказ от него): банкуем долю золота и в деревню.
  function deathToHub() {
    const banked = bankRunGold(HUB_DEATH_SHARE);
    el("end-overlay").classList.add("hidden");
    clearSave();
    reset();
    if (banked > 0) toast("В деревню перенесено " + banked + " золота");
  }

  // Тратит один амулет и поднимает героя на этом же этаже. Поведение этажа
  // то же, что у обычного перезапуска (карта и монстры новые, полное HP), но
  // поход продолжается: золото, снаряжение и пройденные этажи остаются.
  function useRevive(done) {
    const prof = hubProfile();
    if (!prof || !prof.hub || prof.hub.revive <= 0) return false;
    prof.hub.revive -= 1;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Амулет возврата рассыпался в пыль — герой снова в строю. " +
      "Осталось амулетов: " + prof.hub.revive + ".", "floor");
    toast("Амулет возврата: герой поднимается");
    restartFloor(done);
    return true;
  }

  // Редкая находка: амулет уходит в деревню, а не в сумку похода, поэтому
  // переживает смерть. Возвращает true, если находка состоялась — тогда
  // сундук отдаёт амулет вместо предмета.
  function findAmulet() {
    const prof = hubProfile();
    if (!prof || !prof.hub) return false;
    if (prof.hub.revive >= HUB_AMULET_MAX) return false;
    if (Math.random() >= HUB_AMULET_FIND) return false;
    prof.hub.revive += 1;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    log("Редкая находка: амулет возврата. Теперь их " + prof.hub.revive + ".", "loot");
    toast("Редкая находка: амулет возврата!");
    return true;
  }

  // Победа: всё золото похода плюс награда за дракона едут в деревню.
  // Банк победы срабатывает сразу, а не по кнопке «В деревню»: иначе
  // закрытая вкладка на экране победы теряла всё золото похода. Повторный
  // вызов ничего не добавляет — сумма запоминается.
  function bankVictoryGold() {
    if (G.victoryBanked) return 0;
    const prof = hubProfile();
    if (!prof || !G.player) return 0;
    const amount = (G.player.gold || 0) + ECON.bossGold;
    prof.wallet = prof.wallet || { gold: 0, small_potion: 0, big_potion: 0 };
    prof.wallet.gold = (prof.wallet.gold || 0) + amount;
    putProfile(hubName(), prof);
    syncProfile(hubName());
    // В походе этих денег больше нет: они уже в банке. Так смерть в бездне
    // не может банковать ту же сумму второй раз.
    G.player.gold = 0;
    G.victoryBanked = true;
    G.victoryBankedAmount = amount;
    return amount;
  }

  function victoryToHub() {
    const banked = G.victoryBankedAmount || bankVictoryGold();
    el("end-overlay").classList.add("hidden");
    reset();
    if (banked > 0) toast("Из похода в деревню перенесено " + banked + " золота");
  }

  // ---------- Лавка деревни ----------
  // Живёт между походами: амулеты (в постоянный запас), зелья и слабое
  // снаряжение в дорогу. Всё покупается из банка деревни (profile.wallet).
  function hubGearPool() {
    return ITEM_POOL.filter((i) => i.slot !== "potion" && i.tier <= 1);
  }

  function gearHubPrice(item) {
    const base = typeof itemBaseValue === "function" ? itemBaseValue(item) : 60;
    return Math.max(30, Math.round(base * 1.2));
  }

  function hubShopOffers() {
    const offers = [{
      kind: "amulet", name: "Амулет возврата", price: HUB_AMULET_PRICE,
      note: "Второй шанс: возрождает героя на месте. Уносить можно не больше " + HUB_AMULET_MAX + "."
    }];
    const small = itemById("small_potion");
    const big = itemById("big_potion");
    if (small) offers.push({ kind: "small_potion", name: small.name, price: 40, note: "Восстанавливает здоровье в бою." });
    if (big) offers.push({ kind: "big_potion", name: big.name, price: 80, note: "Лечит сильнее малого." });
    hubGearPool().forEach((it) => {
      offers.push({ kind: "gear:" + it.id, name: it.name, price: gearHubPrice(it), note: it.desc || "" });
    });
    return offers;
  }

  function hubShopCard(offer, prof) {
    const gold = (prof.wallet && prof.wallet.gold) || 0;
    let stock = "";
    if (offer.kind === "amulet") {
      stock = prof.hub.revive >= HUB_AMULET_MAX
        ? "<span class='hub-stock full'>максимум " + HUB_AMULET_MAX + "</span>"
        : "<span class='hub-stock'>в запасе: " + prof.hub.revive + " из " + HUB_AMULET_MAX + "</span>";
    } else if (offer.kind === "small_potion" || offer.kind === "big_potion") {
      stock = "<span class='hub-stock'>в кошельке: " + (prof.wallet[offer.kind] || 0) + "</span>";
    }
    const can = gold >= offer.price &&
      !(offer.kind === "amulet" && prof.hub.revive >= HUB_AMULET_MAX);
    return "<div class='hub-card'>" +
      "<div class='hub-card-head'><b>" + offer.name + "</b><span class='hub-price'>" + offer.price + " зол.</span></div>" +
      "<p class='hub-card-note'>" + (offer.note || "") + "</p>" +
      stock +
      "<button class='btn" + (can ? "" : " ghost") + " hub-buy' type='button' data-kind=\"" +
      offer.kind + "\"" + (can ? "" : " disabled") + ">Купить</button>" +
      "</div>";
  }

  function renderHub() {
    const bank = el("hub-bank");
    const list = el("hub-shop");
    const prof = hubProfile();
    if (bank) {
      if (!prof) {
        bank.innerHTML = "<p class='lead'>Войди в аккаунт на главной странице — " +
          "тогда золото и амулеты будут копиться между походами.</p>";
      } else {
        const rev = prof.hub.revive;
        bank.innerHTML =
          "<p class='lead'><b>Банк деревни:</b> " + walletText(prof.wallet) + "</p>" +
          "<p class='lead'><b>Амулеты возврата:</b> " +
          "●".repeat(rev) + "○".repeat(Math.max(0, HUB_AMULET_MAX - rev)) +
          " (" + rev + " из " + HUB_AMULET_MAX + ")</p>";
      }
    }
    if (list) {
      list.innerHTML = prof ? hubShopOffers().map((o) => hubShopCard(o, prof)).join("") : "";
    }
    const startBtn = el("begin-btn");
    if (startBtn) startBtn.disabled = !prof;
  }

  function buyHubItem(kind) {
    const prof = hubProfile();
    if (!prof) return;
    const offer = hubShopOffers().find((o) => o.kind === kind);
    if (!offer) return;
    prof.wallet = prof.wallet || { gold: 0, small_potion: 0, big_potion: 0 };
    if (kind === "amulet" && prof.hub.revive >= HUB_AMULET_MAX) {
      toast("Больше " + HUB_AMULET_MAX + " амулетов не унести");
      return;
    }
    if ((prof.wallet.gold || 0) < offer.price) {
      toast("Не хватает золота: нужно " + offer.price);
      return;
    }
    prof.wallet.gold -= offer.price;
    if (kind === "amulet") {
      prof.hub.revive += 1;
      toast("Куплен амулет возврата");
    } else if (kind === "small_potion" || kind === "big_potion") {
      prof.wallet[kind] = (prof.wallet[kind] || 0) + 1;
      toast("Куплено зелье: " + offer.name);
    } else if (kind.indexOf("gear:") === 0) {
      const it = itemById(kind.slice(5));
      if (it) prof.hub.gear.push(it.id);
      toast("Куплено снаряжение: " + offer.name);
    }
    putProfile(hubName(), prof);
    syncProfile(hubName());
    renderHub();
    renderVillageInfo();
    // Окно торговца открыто поверх карты — перерисуем его, чтобы покупка
    // была видна сразу, а не после закрытия.
    if (G.dialogNpc && !el("dialog-overlay").classList.contains("hidden")) openDialog(G.dialogNpc);
    updateWalletLine();
  }


  // Пункт 7: смерть откатывает текущий этаж. Карта, монстры, ловушки и
  // находки создаются заново, здоровье восстанавливается полностью,
  // золото и снаряжение остаются, опыт этажа теряется до снимка входа.
  function restartFloor(done) {
    const index = G.floorIndex;
    endWalk();
    G.battle = null;
    G.blessingOffer = null;
    G.dead = false;
    const bless = el("blessing-overlay");
    if (bless) bless.classList.add("hidden");
    const forgeOverlay = el("forge-overlay");
    if (forgeOverlay) forgeOverlay.classList.add("hidden");
    el("battle-overlay").classList.add("hidden");
    el("end-overlay").classList.add("hidden");
    endBattleMode();
    // Призрак ошибки несёт пропущенное задание. Этаж пересоздаётся, и живые
    // призраки исчезнут вместе с ним — их задания возвращаем в очередь, иначе
    // ошибка, которую ученику предстояло закрыть, пропадала бы навсегда.
    const dying = (G.cache[index] && G.cache[index].enemies) || [];
    dying.forEach((e) => {
      const p = e.payload;
      if (!p || e.hp <= 0) return;
      if (!G.missed.some((m) => m.kind === p.kind && m.id === p.id)) G.missed.unshift(p);
    });
    if (G.missed.length > 20) G.missed.length = 20;
    // Этаж пересоздаётся только если записи в кэше нет: в кэше лежат
    // ссылки на те же объекты, поэтому убитые монстры оттуда не вернутся.
    delete G.cache[index];
    const cp = G.floorCheckpoint;
    if (cp) {
      G.player.level = cp.level;
      G.player.xp = cp.xp;
      G.player.xpNext = cp.xpNext;
      G.player.baseMaxHp = cp.baseMaxHp;
      G.player.dmgBase = cp.dmgBase;
    }
    recalcStats();
    G.player.hp = G.player.maxHp;
    G.player.poison = 0;
    G.player.snared = false;
    G.player.snareWaits = 0;
    G.player.cursedNext = false;
    // Этаж считается непройденным: покажем планку входа заново.
    G.visited.delete(index);
    G.running = true;
    // Этаж пересоздаётся, значит его надо снова сгенерировать и проверить.
    activateFloorLoaded(index, () => {
      log("Этаж " + (index + 1) + " начинается заново. Здоровье восстановлено, " +
        "опыт этого этажа потерян.", "floor");
      setMsg("Ты очнулся у входа. Всё, что было на этаже, вернулось на место.");
      renderInventory();
      updateHud();
      scheduleSave();
      if (done) done();
    });
  }

  // Пункт 5: из экрана победы можно уйти в бесконечный спуск. Дракон
  // повержен, но этажи не кончаются — runIsEndless() переключает
  // floorDef() на синтез этажей, и спуск идёт, пока герой жив.
  function descendIntoAbyss() {
    const over = el("end-overlay");
    if (over) over.classList.add("hidden");
    G.mode = "endless";
    G.finishedVictory = false;
    G.dead = false;
    G.running = true;
    snapshotCurrent();
    activateFloorLoaded(G.floorIndex + 1, () => {
      log("Дракон мёртв, но подземелье не кончилось. Бездна ждёт.", "floor");
      setMsg("Бесконечный спуск: этажей больше нет, есть только глубина.");
      renderInventory();
      updateHud();
      scheduleSave();
    });
  }

  function victory() {
    if (G.finishedVictory) return;
    sfx("victory");
    G.finishedVictory = true;
    G.running = false;
    // Сначала банк, потом сейв: закрытая вкладка на экране победы не должна
    // стоить игроку всего золота похода.
    bankVictoryGold();
    // Победа — конец обычного похода: старый сейв с живым драконом не должен
    // возвращать игрока на десятый этаж. Уход в бездну пишет новый сейв сам.
    clearSave();
    const earned = earnGameBadges();
    if (earned.length) toast("Достижение: " + earned.map((b) => b.title).join(", "));
    saveDungeonBest(true);
    submitResult(true);
    el("end-box").innerHTML =
      "<div class='big-emoji-free victory'>Победа</div>" +
      "<h2 class='victory'>Дракон повержен!</h2>" +
      "<p class='lead victory-epilogue'><b>" + CAMPAIGN.title + ".</b> " +
        CAMPAIGN.epilogue + "</p>" +
      runSummaryHtml({ banked: G.victoryBankedAmount, victory: true }) +
      topicReportHtml() +
      "<div class='battle-actions' style='justify-content:center;flex-wrap:wrap'>" +
      "<button class='btn' id='to-hub-btn'>В деревню</button>" +
      "<button class='btn ghost' id='abyss-btn'>Спуститься глубже</button>" +
      "</div>";
    el("end-overlay").classList.remove("hidden");
    el("to-hub-btn").addEventListener("click", victoryToHub);
    const abyss = el("abyss-btn");
    if (abyss) abyss.addEventListener("click", descendIntoAbyss);
  }

  // ---------- Запуск / сброс ----------

  // Имя ученика берём из учётной записи (сессия auth.js): за одним
  // компьютером сменяются ученики, отдельного ввода на экране нет.
  function accountName() {
    const u = typeof currentUser === "function" ? currentUser() : null;
    return u && u.name ? String(u.name).trim() : "";
  }

  // Никнейм для подземелья задаётся в настройках профиля (profile.html).
  // Учётное имя остаётся ключом профиля, автосохранения и результатов:
  // никнейм меняет только то, как героя зовут в игре.
  function dungeonNick(name) {
    const key = name || accountName();
    if (!key) return "";
    const prof = typeof getProfile === "function" ? getProfile(key) : null;
    const nick = prof && prof.dungeonName ? String(prof.dungeonName).trim() : "";
    return nick || key;
  }

  function begin() {
    const name = accountName();
    if (!name) {
      toast("Войди в аккаунт на главной странице");
      return;
    }
    const known = knowledgeFor(name);
    G.knowledgeLevel = known && known.level ? known.level : 2;
    // Незаконченный поход затирается при старте нового: startRun делает
    // clearSave(). Раньше это происходило молча, и собранный лут исчезал.
    const paused = pausedRun();
    if (paused && !window.confirm(
      "У тебя есть незаконченный поход: этаж " + ((paused.floorIndex || 0) + 1) +
      ", золото " + ((paused.player && paused.player.gold) || 0) +
      ". Начать новый поход? Незаконченный будет потерян — " +
      "продолжить его можно кнопкой «Продолжить поход» в деревне."
    )) {
      return;
    }
    G.name = name;
    G.nick = dungeonNick(name);
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
      xpNext: XP_BASE,
      dmgBase: 12,
      atkBonus: 0,
      defBonus: 0,
      gold: 0,
      poison: 0,
      freeHints: 0
    };
    G.equipment = { weapon: null, armor: null, accessory: null };
    G.forge = { weapon: 0, armor: 0, vitality: 0 };
    G.inventory = [{ ...itemById("small_potion") }];
    // Ключи от тайников — ресурс похода: новый поход не наследует их
    // от предыдущего.
    G.vaultKeys = 0;
    // Постоянная прогрессия: уровни улучшений из кузницы и постройки деревни.
    // Прибавляем к базе до recalcStats, а здоровье выставляем после — иначе
    // расчёт снаряжения затрёт прибавку колодца.
    G.prog = progressBonus();
    G.player.baseMaxHp += progOf("hp");
    G.player.dmgBase += progOf("dmg");
    for (let i = 0; i < progOf("potions"); i += 1) {
      const pot = itemById("small_potion");
      if (pot) G.inventory.push({ ...pot });
    }
    // Умение похода: ключ приходит из профиля (его выбирают в окне стража),
    // заряды общие на поход и пополняются у костра.
    G.ability = { key: chosenAbility(), left: G.ability && G.ability.key === chosenAbility()
      ? Math.max(0, G.ability.left || 0) : abilityCharges() };
    // Привалы: базовое число плюс один от восстановленного амбара.
    G.restsLeft = REST_PER_RUN + (villageLevel("barn") >= 2 ? 1 : 0);
    if (progOf("hp") || progOf("dmg") || progOf("potions")) {
      log("Улучшения из деревни: +" + progOf("hp") + " здоровья, +" + progOf("dmg") +
        " урона, зелий сверх стартового: " + progOf("potions") + ".", "floor");
    }
    // Снаряжение, купленное в деревне, кладём в сумку на старте. Забрали —
    // значит потратили: в деревне его больше нет, а с гибелью похода оно
    // пропадёт вместе с ним. Так деревня не выдаёт снаряжение бесплатно.
    const hub = hubProfile();
    if (hub && hub.hub && Array.isArray(hub.hub.gear) && hub.hub.gear.length) {
      hub.hub.gear.forEach((id) => {
        const it = itemById(id);
        if (it) G.inventory.push(Object.assign({}, it));
      });
      hub.hub.gear = [];
      putProfile(G.name, hub);
    }
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
      kills: 0,
      streak: 0,
      bestStreak: 0,
      perfectHits: 0,
      eliteKills: 0
    };
    G.lastQId = null;
    G.questProgress = { n: 0 };
    G.codeQueue = [];
    G.copyQueue = [];
    G.fillQueue = [];
    G.errorQueue = [];
    G.missed = [];
    G.learn = { topicSeen: {}, practiceUsed: {}, tick: 0 };
    G.blessings = {};
    G.blessingOffer = null;
    G.hazard = null;
    G.finishedVictory = false;
    G.victoryBanked = false;
    G.victoryBankedAmount = 0;
    G.running = true;
    tutorialHide();
    G.tutorial = null;
    // Режим берём с переключателя в меню: обычный спуск или бесконечность.
    const modeBtn = el("game-mode").querySelector(".mode.active");
    G.mode = modeBtn && modeBtn.dataset.mode === "endless" ? "endless" : "dungeon";
    G.dead = false;
    endBattleMode();
    G.cache = {};
    // Пусто, а не [0]: этаж отмечает посещённым сам activateFloor — после
    // показа эпиграфа, события и совета. С нулём здесь первый этаж считался
    // знакомым ещё до входа, и ученик не видел ни одного из трёх.
    G.visited = new Set();
    recalcStats();
    // Полное здоровье — после пересчёта снаряжения: в поход герой входит
    // отдохнувшим, с учётом и колодца, и брони, и закалки.
    G.player.hp = G.player.maxHp;
    el("log").innerHTML = "";
    toggleLog(false);
    show("game");
    // Размер окна подземелья читаем один раз при входе в игру: дальше
    // камера обходится запомненным значением.
    measureViewport();
    log("В подземелье входит " + (G.nick || "герой") + ": " + floorNameAt(0) + ".", "floor");
    log("Сложность: " + DIFFICULTY[G.difficulty].name + ".", "floor");
    if (known && known.level) {
      log("Стартовый уровень заданий: " + knowledgeTitle(G.knowledgeLevel) + ".", "floor");
    }
    activateFloorLoaded(0, () => {
      claimWallet();
      // Кошелёк пополняет золото уже после первой отрисовки панели: без этого
      // в «Золото» до первого шага висел ноль, хотя в лавке было чем платить.
      updateHud();
      renderInventory();
      log("Монстры двигаются навстречу каждый твой ход.", "floor");
      log("Лестницу можно найти и спуститься, даже не убивая всех монстров.", "floor");
      log("Лестница вверх возвращает на прошлый этаж с его монстрами и добычей.", "floor");
      setMsg("Найди лестницу — спуститься можно, даже если монстры ещё живы.");
      tutorialStart();
    });
  }

  function updateWalletLine() {
    const name = accountName();
    const startBtn = el("begin-btn");
    if (startBtn) startBtn.disabled = !name;
    // Без учётной записи блок «Кошелёк и награды» не показываем целиком,
    // иначе от него остаётся один заголовок.
    const block = el("wallet-block");
    if (block) block.classList.toggle("hidden", !name);
    const line = el("wallet-line");
    if (!line) return;
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
    const rev = prof.hub ? prof.hub.revive : 0;
    const amulets = rev > 0 ? " Амулетов возврата: " + rev + " из " + HUB_AMULET_MAX + "." : "";
    line.textContent = "Кошелёк: " + walletText(prof.wallet) + "." + best + amulets;
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
    G.blessingOffer = null;
    const bless = el("blessing-overlay");
    if (bless) bless.classList.add("hidden");
    const forgeOverlay = el("forge-overlay");
    if (forgeOverlay) forgeOverlay.classList.add("hidden");
    el("battle-overlay").classList.add("hidden");
    endBattleMode();
    // Смерть и победа возвращают в деревню — она и есть хаб между походами.
    enterVillage(null);
    updateWalletLine();
    updateResumeButton();
  }

  // «Выйти» — это выход в главное меню сайта, а не возврат в деревню. Раньше
  // кнопка звала reset(), а он возвращает в деревню: стоя в деревне, ученик
  // нажимал и не видел ничего — «кнопка не работает».
  function leave() {
    // В деревне без сохранённого похода терять нечего: не показываем системный
    // confirm на пустом месте. Если поход идёт или ждёт в сейве — спрашиваем.
    const hasRun = (G.place === "dungeon" && G.running) || !!pausedRun();
    if (hasRun && !window.confirm(
      "Выйти на стартовый экран? Поход сохранится, его можно будет продолжить."
    )) {
      return;
    }
    // Сохраняем только поход: в деревне сохранять нечего, там сейв не пишется.
    if (G.running) saveGame();
    window.location.href = (typeof window !== "undefined" && window.__PYQUIZ_WEB)
      ? "index.html?exit=1" : "/";
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
    if (open) {
      box.scrollTop = box.scrollHeight;
      // Открыл журнал — значит прочитал: счётчик новых строк снимаем.
      logUnread = 0;
      logBadge();
    }
  }

  function scheduleSave() {
    if (!G.running || !G.stats) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveGame, 400);
  }

  // Обновление страницы или закрытие вкладки: отложенная запись в 400 мс
  // не успевает сработать, и последний ход терялся. На pagehide пишем сразу.
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
      clearTimeout(saveTimer);
      saveGame();
    });
  }

  function serializeFloor(st) {
    return {
      index: st.index,
      checked: st.checked || null,
      map: st.map,
      playerPos: st.playerPos,
      stairsDown: st.stairsDown,
      stairsUp: st.stairsUp,
      enemies: st.enemies.map((e) => ({
        uid: e.uid,
        key: e.key,
        name: e.name,
        color: e.color,
        maxHp: e.maxHp,
        hp: e.hp,
        dmg: e.dmg,
        boss: !!e.boss,
        enraged: !!e.enraged,
        ability: e.ability || null,
        elite: !!e.elite,
        title: e.title || "",
        poison: e.poison || 0,
        poisonBonus: e.poisonBonus || 0,
        armorPct: e.armorPct || 0.2,
        fireMul: e.fireMul || 1.15,
        chargeStep: e.chargeStep || 2,
        chargeCap: e.chargeCap || 10,
        drainPct: e.drainPct || 0.5,
        curseChance: e.curseChance == null ? 0.35 : e.curseChance,
        phaseChance: e.phaseChance == null ? 0.25 : e.phaseChance,
        dmgBoost: e.dmgBoost || 0,
        nextDmgMul: e.nextDmgMul || 1,
        baseDmg: e.baseDmg || e.dmg,
        fireScale: e.fireScale || 1,
        shotScale: e.shotScale || 1,
        // Отряд и дистанция: без них после перезагрузки группа
        // распалась бы на одиночек, а прицел полез бы вплотную.
        summonedBy: e.summonedBy || 0,
        squadId: e.squadId || 0,
        squadIdx: e.squadIdx || 0,
        range: e.range || 1,
        // Призрак ошибки несёт в себе задание, которое игрок когда-то
        // пропустил: без payload оно терялось при перезагрузке страницы.
        payload: e.payload || null,
        guard: !!e.guard,
        xp: e.xp || 0,
        x: e.x,
        y: e.y
      })),
      treasures: st.treasures.map((t) => ({ uid: t.uid, x: t.x, y: t.y, item: t.item })),
      lootBags: (st.lootBags || []).map((b) => ({
        uid: b.uid, x: b.x, y: b.y, gold: b.gold || 0,
        items: (b.items || []).map((item) => Object.assign({}, item))
      })),
      traders: (st.traders || []).map((t) => ({ uid: t.uid, x: t.x, y: t.y })),
      traps: (st.traps || []).map((t) => ({ uid: t.uid, x: t.x, y: t.y, kind: t.kind, armed: t.armed !== false })),
      // Костры: без них после перезагрузки страницы привалы исчезали бы,
      // а потраченные — возвращались.
      camps: (st.camps || []).map((c) => ({ uid: c.uid, x: c.x, y: c.y, used: !!c.used })),
      vaults: (st.vaults || []).map((v) => ({ uid: v.uid, key: v.key, door: v.door,
        from: v.from, locked: !!v.locked, opened: !!v.opened })),
      nodes: (st.nodes || []).map((n) => ({ uid: n.uid, x: n.x, y: n.y, kind: n.kind, taken: !!n.taken })),
      levers: (st.levers || []).map((l) => ({ uid: l.uid, x: l.x, y: l.y, vault: l.vault, used: !!l.used })),
      signs: (st.signs || []).map((s2) => ({ uid: s2.uid, x: s2.x, y: s2.y, text: s2.text })),
      portal: st.portal ? { x: st.portal.x, y: st.portal.y } : null,
      vaultNeedsKey: !!st.vaultNeedsKey,
      // Опасная среда: без неё после перезагрузки этаж «выздоравливал» —
      // лава и лёд исчезали, а тьма переставала сужать обзор.
      hazard: st.hazard || null,
      discovered: Array.from(st.discovered || [])
    };
  }

  function deserializeFloor(o) {
    return {
      index: o.index,
      checked: o.checked || null,
      map: o.map,
      playerPos: o.playerPos,
      stairsDown: o.stairsDown,
      stairsUp: o.stairsUp,
      enemies: (o.enemies || []).map((e) =>
        Object.assign(
          { poison: 0, poisonBonus: 0, armorPct: 0.2, fireMul: 1.15, chargeStep: 2,
            chargeCap: 10, drainPct: 0.5, curseChance: 0.35, phaseChance: 0.25,
            dmgBoost: 0, nextDmgMul: 1, enraged: false, ability: null,
            elite: false, title: "", baseDmg: 0, fireScale: 1, shotScale: 1,
            payload: null, squadId: 0, squadIdx: 0, range: 1, guard: false, xp: 0,
            summonedBy: 0 },
          e
        )
      ),
      treasures: (o.treasures || []).map((t) => Object.assign({}, t)),
      lootBags: (o.lootBags || []).map((b) => ({
        uid: b.uid, x: b.x, y: b.y, gold: b.gold || 0,
        items: (b.items || []).map((item) => Object.assign({}, item))
      })),
      traders: (o.traders || []).map((t) => Object.assign({}, t)),
      traps: (o.traps || []).map((t) => ({ armed: true, ...t })),
      camps: (o.camps || []).map((c) => ({ used: false, ...c })),
      vaults: (o.vaults || []).map((v) => ({ locked: true, opened: false, ...v })),
      nodes: (o.nodes || []).map((n) => ({ taken: false, ...n })),
      levers: (o.levers || []).map((l) => ({ used: false, ...l })),
      signs: (o.signs || []).map((s2) => Object.assign({}, s2)),
      portal: o.portal ? { x: o.portal.x, y: o.portal.y } : null,
      vaultNeedsKey: !!o.vaultNeedsKey,
      hazard: o.hazard || null,
      discovered: new Set(o.discovered || [])
    };
  }

  // Ячейка сохранения ученика. За одним компьютером сменяются ученики, и с
  // общим ключом новая партия одного затирала поход другого. Без входа (игра
  // открыта файлом, проверки) — прежний общий ключ.
  function saveSlot(name) {
    return name ? SAVE_KEY + ":" + name : SAVE_KEY;
  }

  function placeSlot(name) {
    const me = name != null ? name : accountName();
    return me ? PLACE_KEY + ":" + me : PLACE_KEY;
  }

  function villageSlot(name) {
    const me = name != null ? name : accountName();
    return me ? VILLAGE_SAVE_KEY + ":" + me : VILLAGE_SAVE_KEY;
  }

  function readVillageSave() {
    const me = accountName();
    if (!me) return null;
    try {
      const data = JSON.parse(localStorage.getItem(villageSlot(me)) || "null");
      if (!data || data.v !== 1 || data.name !== me) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveVillage() {
    const me = accountName();
    if (!me || G.place !== "village" || !G.playerPos) return false;
    try {
      localStorage.setItem(villageSlot(me), JSON.stringify({
        v: 1,
        name: me,
        x: G.playerPos.x,
        y: G.playerPos.y,
        updated: new Date().toISOString(),
      }));
      setPlaceMarker("village");
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadVillageData(data) {
    if (!data) return false;
    const st = villageState();
    const x = Number(data.x);
    const y = Number(data.y);
    const valid = st && Number.isInteger(x) && Number.isInteger(y) &&
      st.map.grid[y] && st.map.grid[y][x] === 1 &&
      !(st.blocked && st.blocked[y] && st.blocked[y][x]);
    enterVillage(valid ? { x: x, y: y } : null);
    return true;
  }

  function loadVillage() {
    return loadVillageData(readVillageSave());
  }

  function saveThumbnail(kind) {
    try {
      if (kind === "dungeon") {
        const mini = el("minimap");
        if (mini && mini.width && mini.height && mini.toDataURL) {
          const url = mini.toDataURL("image/png");
          if (url && url.length > 200) return url;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      const st = villageState();
      const grid = st && st.map ? st.map.grid : null;
      const cx = G.playerPos ? G.playerPos.x : 10;
      const cy = G.playerPos ? G.playerPos.y : 10;
      const cell = 16;
      const cols = 20;
      const rows = 11;
      ctx.fillStyle = "#101a16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = cx - Math.floor(cols / 2) + col;
          const y = cy - Math.floor(rows / 2) + row;
          const walkable = !!(grid && grid[y] && grid[y][x] === 1);
          ctx.fillStyle = walkable
            ? ((x + y) % 2 ? "#3f6438" : "#466d3d")
            : "#1b2620";
          ctx.fillRect(col * cell, row * cell, cell, cell);
        }
      }
      // Двери и постройки — коричневые прямоугольники, герой — синий круг.
      (st && st.doors ? st.doors : []).forEach((door) => {
        const px = (door.x - cx + Math.floor(cols / 2)) * cell;
        const py = (door.y - cy + Math.floor(rows / 2)) * cell;
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          ctx.fillStyle = door.locked ? "#5b3f26" : "#9a6a35";
          ctx.fillRect(px + 2, py + 1, cell - 4, cell - 2);
        }
      });
      const hx = Math.floor(cols / 2) * cell + cell / 2;
      const hy = Math.floor(rows / 2) * cell + cell / 2;
      ctx.fillStyle = "#2f6fe4";
      ctx.beginPath();
      ctx.arc(hx, hy, cell * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f6c453";
      ctx.lineWidth = 2;
      ctx.stroke();
      return canvas.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  }

  function snapshotMeta(data, kind) {
    const player = data && data.player ? data.player : null;
    return {
      kind: kind,
      floor: kind === "dungeon" ? (Number(data && data.floorIndex) || 0) + 1 : null,
      gold: player ? (Number(player.gold) || 0) : (Number(data && data.gold) || 0),
      mode: (data && data.mode) || ""
    };
  }

  function snapshotFromData(data, kind) {
    return {
      v: 1,
      kind: kind,
      name: accountName() || "",
      createdAt: Date.now(),
      meta: snapshotMeta(data, kind),
      thumb: saveThumbnail(kind),
      data: data
    };
  }

  function captureSnapshot() {
    const me = accountName();
    if (!me) return null;
    if (G.place === "dungeon" && G.running && !G.dead) {
      const data = buildSaveData();
      if (!data) return null;
      return snapshotFromData(data, "dungeon");
    }
    if (G.place === "village" && G.playerPos) {
      return snapshotFromData({
        v: 1,
        name: me,
        x: G.playerPos.x,
        y: G.playerPos.y,
        gold: G.player ? (G.player.gold || 0) : 0
      }, "village");
    }
    return null;
  }

  function exportLegacy() {
    const data = readSave();
    if (data && data.v === 1 && !data.over) {
      return snapshotFromData(data, "dungeon");
    }
    const village = readVillageSave();
    if (village) return snapshotFromData(village, "village");
    return null;
  }

  function loadSnapshot(snapshot) {
    if (!snapshot || snapshot.v !== 1) return false;
    if (snapshot.kind === "village") return loadVillageData(snapshot.data);
    if (snapshot.kind === "dungeon") {
      const ok = loadGame(snapshot.data);
      if (ok) setPlaceMarker("dungeon");
      return ok;
    }
    return false;
  }

  function setPlaceMarker(place) {
    try {
      localStorage.setItem(placeSlot(), place === "dungeon" ? "dungeon" : "village");
    } catch (e) {
      // localStorage может быть недоступен — просто пропускаем
    }
  }

  function placeMarker() {
    try {
      return localStorage.getItem(placeSlot()) || "";
    } catch (e) {
      return "";
    }
  }

  // Кнопка «В деревню» нужна только в подземелье: в деревне она бессмысленна.
  function syncPlaceButtons() {
    const btn = el("village-btn");
    if (btn) btn.classList.toggle("hidden", G.place !== "dungeon");
  }

  function updateFullscreenButton() {
    const btn = el("fullscreen-btn");
    if (!btn) return;
    const on = !!document.fullscreenElement;
    btn.textContent = on ? "⤢" : "⛶";
    btn.title = on ? "Выйти из полноэкранного режима (F11)" : "На весь экран (F11)";
    btn.setAttribute("aria-label", on ? "Выйти из полноэкранного режима" : "На весь экран");
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        const p = document.exitFullscreen();
        if (p && p.catch) p.catch(() => {});
      } else {
        const p = document.documentElement.requestFullscreen({ navigationUI: "hide" });
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {
      // Некоторые встроенные браузеры запрещают Fullscreen API; игра
      // остаётся в обычном окне, ничего не ломается.
    }
  }

  function buildSaveData() {
    // Пока партия не начата — сохранять нечего. Помеченную смерть пишем
    // намеренно: по ней главное меню предложит начать этаж заново.
    if (!G.stats) return null;
    if (!G.running && !G.dead) return null;
    // Деревня и дома не поход: запись деревни затёрла бы сохранённый спуск
    // (он живёт до входа в подземелье).
    if (G.place !== "dungeon") return null;
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
        forge: G.forge || { weapon: 0, armor: 0, vitality: 0 },
        // Постоянные улучшения: часть из них уже вписана в здоровье и урон, но
        // «Добыча» и «Броня» читаются на каждом ударе и находке, поэтому после
        // перезагрузки страницы их надо вернуть, а не потерять.
        prog: G.prog || null,
        ability: G.ability || null,
        restsLeft: G.restsLeft || 0,
        vaultKeys: G.vaultKeys || 0,
        inventory: G.inventory,
        stats: G.stats,
        visited: Array.from(G.visited),
        uid: G.uid,
        missed: G.missed || [],
        // Прогресс повторяемого задания живёт в походе; без него после
        // перезагрузки цель обнулялась, хотя задание оставалось взятым.
        questProgress: G.questProgress || null,
        learn: G.learn || null,
        codex: G.codex || null,
        blessings: G.blessings || {},
        cameraZoom: G.camera.zoomIndex,
        // Размер клетки в px: номер ступени зависит от шкалы, а px — нет.
        cameraCell: G.camera.zoomIndex == null ? null : CAM_LEVELS[G.camera.zoomIndex],
        mode: G.mode || "dungeon",
        // Без этих двух полей «Продолжить» после смерти поднимало бы
        // мёртвую партию и не знало, к какому состоянию откатывать этаж.
        over: !!G.dead,
        floorCheckpoint: G.floorCheckpoint,
        floors: Object.keys(G.cache).map((k) => serializeFloor(G.cache[k]))
      };
      const me = accountName();
      if (me && me !== G.name) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveGame() {
    const data = buildSaveData();
    if (!data) return false;
    try {
      // Пока шла партия, в другой вкладке мог войти другой ученик: его
      // ячейку чужим походом не затираем.
      const me = accountName();
      if (me && me !== G.name) return false;
      localStorage.setItem(saveSlot(me), JSON.stringify(data));
      return true;
    } catch (e) {
      // localStorage может быть недоступен — просто пропускаем
      return false;
    }
  }

  function clearSave() {
    const me = accountName();
    try {
      localStorage.removeItem(saveSlot(me));
      // Сейв прежней версии под общим ключом — тоже его: иначе readSave
      // поднял бы старый поход после победы или новой партии.
      if (me) {
        const old = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
        if (old && old.name === me) localStorage.removeItem(SAVE_KEY);
      }
    } catch (e) {
      // ignore
    }
  }

  function readSave() {
    const me = accountName();
    try {
      const raw = localStorage.getItem(saveSlot(me));
      if (raw || !me) return raw ? JSON.parse(raw) : null;
      // Сейв прежней версии лежит под общим ключом: отдаём его только
      // владельцу и переносим в его ячейку.
      const old = localStorage.getItem(SAVE_KEY);
      const data = old ? JSON.parse(old) : null;
      if (!data || data.name !== me) return null;
      localStorage.setItem(saveSlot(me), old);
      localStorage.removeItem(SAVE_KEY);
      return data;
    } catch (e) {
      return null;
    }
  }

  // Незаконченный поход, к которому можно вернуться. null — если продолжать
  // нечего. Деревне нужно это знать, чтобы показать, что вещи и золото
  // не пропали, а ждут продолжения.
  function pausedRun() {
    const me = accountName();
    if (!me) return null;
    const data = readSave();
    if (!data || data.v !== 1 || data.over) return null;
    if ((data.name || "") !== me) return null;
    return data;
  }

  function updateResumeButton() {
    const btn = el("resume-btn");
    if (!btn) return;
    const data = readSave();
    // «Продолжить» видит только вошедший владелец сейва: на общем
    // компьютере чужой сейв не всплывает.
    const me = accountName();
    if (data && data.v === 1 && me && (data.name || "") === me) {
      btn.style.display = "";
      // Мёртвый сейв не воскрешает бесплатно. Перезагрузка страницы не
      // должна обходить экран смерти: продолжить можно только за амулет,
      // иначе поход считается оконченным и кнопка ведёт в деревню.
      // Имя в подписи не повторяем: оно и так стоит строкой выше.
      if (data.over) {
        const prof = typeof getProfile === "function" ? getProfile(data.name || me) : null;
        const amulets = prof && prof.hub ? prof.hub.revive : 0;
        btn.textContent = amulets > 0
          ? "Возродиться за амулет: этаж " + ((data.floorIndex || 0) + 1)
          : "Поход окончен — в деревню";
      } else {
        btn.textContent = "Продолжить: этаж " + (data.floorIndex + 1);
      }
    } else {
      btn.style.display = "none";
    }
  }

  // Карточки «режим похода» и «сложность» — это группы-переключатели.
  // Мышью управляет делегирование клика (ниже, в DOMContentLoaded), а эти
  // помощники держат aria-checked и обход с клавиатуры в согласии с классом
  // .active: без них скринридер читал бы выбранным не тот вариант, а с
  // клавиатуры карточки были недоступны вовсе.
  const PICK_GROUPS = [
    ["game-mode", "mode"],
    ["difficulty", "diff"]
  ];

  function syncPickState() {
    PICK_GROUPS.forEach((pair) => {
      const box = el(pair[0]);
      if (!box) return;
      box.querySelectorAll(".mode").forEach((m) => {
        const on = m.classList.contains("active");
        m.setAttribute("aria-checked", on ? "true" : "false");
        // Одна остановка Tab на группу: в обход попадает только выбранная
        // карточка, до остальных добираются стрелками.
        m.tabIndex = on ? 0 : -1;
      });
    });
  }

  function pickArrow(box, kind, e) {
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].indexOf(e.key) < 0) return;
    const items = Array.prototype.slice.call(box.querySelectorAll(".mode"));
    const cur = items.indexOf(e.target.closest(".mode"));
    if (cur < 0 || !items.length) return;
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = (cur + step + items.length) % items.length;
    e.preventDefault();
    items.forEach((m) => m.classList.remove("active"));
    items[next].classList.add("active");
    if (kind === "mode") G.mode = items[next].dataset.mode === "endless" ? "endless" : "dungeon";
    else G.difficulty = items[next].dataset.diff;
    syncPickState();
    items[next].focus();
  }

  function loadGame(source) {
    // Кнопка «Продолжить» передаёт событие клика, а не данные. Раньше это
    // событие принималось за сейв, и продолжение молча не срабатывало:
    // игрок возвращался в деревню, сдавал квест и не мог вернуться в поход.
    const data = source && source.v === 1 ? source : readSave();
    if (!data || data.v !== 1) return false;
    // Окно стража должно закрыться: иначе загрузка идёт «за» открытой
    // модалкой, и кажется, что кнопка «Продолжить» ничего не сделала.
    closeEntrance();
    tutorialHide();
    G.tutorial = null;
    // Сейв другого ученика (за компьютером сменился игрок) не поднимаем.
    // Пока никто не вошёл, ограничивать нечем: партию поднимаем как раньше.
    const me = accountName();
    if (me && (data.name || "") !== me) return false;
    G.name = data.name || "Герой";
    G.nick = dungeonNick(G.name);
    G.knowledgeLevel = knowledgeLevel(G.name);
    G.difficulty = data.difficulty || "easy";
    G.startedAt = data.startedAt || Date.now();
    // Битый сейв с player:null раньше ронял загрузку на первом же обращении
    // к G.player.poison. Такой поход продолжать нечем — убираем его.
    if (!data.player || typeof data.player !== "object") {
      clearSave();
      updateResumeButton();
      return false;
    }
    G.player = data.player;
    G.player.poison = data.player.poison || 0;
    G.player.freeHints = data.player.freeHints || 0;
    G.player.snared = !!data.player.snared;
    G.player.snareWaits = data.player.snareWaits || 0;
    G.player.cursedNext = !!data.player.cursedNext;
    G.equipment = data.equipment || { weapon: null, armor: null, accessory: null };
    // Старый сейв без кузницы: уровни считаем нулевыми.
    G.forge = Object.assign({ weapon: 0, armor: 0, vitality: 0 }, data.forge || {});
    // Сейв без прогрессии (старая версия) — берём её из профиля, а не нулями:
    // иначе после перезагрузки страницы «Добыча» и «Броня» обнулились бы.
    const savedProg = data.prog || null;
    G.prog = savedProg || progressBonus();
    G.ability = data.ability || { key: chosenAbility(), left: abilityCharges() };
    // Раньше условие проверяло G.restsLeft, который всегда число (0 из
    // начального состояния), поэтому число привалов после перезагрузки
    // оставалось нулевым. Читаем именно поле сейва; старый сейв без него
    // получает обычный запас на поход.
    G.restsLeft = typeof data.restsLeft === "number"
      ? data.restsLeft
      : REST_PER_RUN + (villageLevel("barn") >= 2 ? 1 : 0);
    G.vaultKeys = data.vaultKeys || 0;
    G.inventory = data.inventory || [];
    // Если поход был на паузе, а игрок за это время купил улучшения героя в
    // деревне, они должны примениться к текущему походу. Иначе покупка
    // выглядит работающей (уровни в панели выросли), а в бою ничего не меняет.
    let upgradeHp = 0;
    let upgradeDmg = 0;
    let upgradePotions = 0;
    if (!data.over && savedProg && G.player.hp > 0) {
      const fresh = progressBonus();
      const num = (value) => Math.max(0, Math.floor(Number(value) || 0));
      upgradeHp = Math.max(0, num(fresh.hp) - num(savedProg.hp));
      upgradeDmg = Math.max(0, num(fresh.dmg) - num(savedProg.dmg));
      upgradePotions = Math.max(0, num(fresh.potions) - num(savedProg.potions));
      const upgradeLoot = Math.max(0, num(fresh.loot) - num(savedProg.loot));
      const upgradeArmor = Math.max(0, num(fresh.armor) - num(savedProg.armor));
      if (upgradeHp || upgradeDmg || upgradePotions || upgradeLoot || upgradeArmor) {
        G.player.baseMaxHp = num(G.player.baseMaxHp) + upgradeHp;
        G.player.dmgBase = num(G.player.dmgBase) + upgradeDmg;
        for (let i = 0; i < upgradePotions; i += 1) {
          const potion = itemById("small_potion");
          if (potion) G.inventory.push(Object.assign({}, potion));
        }
        G.prog = fresh;
      }
    }
    G.stats = Object.assign(
      { streak: 0, bestStreak: 0, perfectHits: 0, eliteKills: 0 },
      data.stats || {}
    );
    G.visited = new Set(data.visited || [0]);
    G.uid = data.uid || 0;
    G.missed = data.missed || [];
    G.questProgress = data.questProgress && typeof data.questProgress === "object"
      ? { n: Math.max(0, Math.floor(Number(data.questProgress.n) || 0)) }
      : { n: 0 };
    G.learn = data.learn || null;
    learnState();
    G.codex = data.codex && typeof data.codex === "object"
      ? { items: data.codex.items || {}, npcs: data.codex.npcs || {}, enemies: data.codex.enemies || {} }
      : { items: {}, npcs: {}, enemies: {} };
    G.blessings = data.blessings || {};
    G.blessingOffer = null;
    G.mode = data.mode || "dungeon";
    G.floorCheckpoint = data.floorCheckpoint || null;
    G.dead = !!data.over;
    G.cache = {};
    (data.floors || []).forEach((f) => {
      G.cache[f.index] = deserializeFloor(f);
    });
    // Слой объектов чистим, а не пересоздаём карту: иначе узлы деревни,
    // отрисованные до «Продолжить», остаются в DOM без ссылок — они и висели
    // поверх подземелья, а при каждом возврате в деревню копились двойники.
    clearEntityLayer();
    G.battle = null;
    G.codeQueue = [];
    G.copyQueue = [];
    G.fillQueue = [];
    G.errorQueue = [];
    G.finishedVictory = false;
    G.running = true;
    endBattleMode();
    el("difficulty").querySelectorAll(".mode").forEach((m) => {
      m.classList.toggle("active", m.dataset.diff === G.difficulty);
    });
    el("game-mode").querySelectorAll(".mode").forEach((m) => {
      m.classList.toggle("active", m.dataset.mode === G.mode);
    });
    syncPickState();
    recalcStats();
    if (upgradeHp) {
      G.player.hp = Math.min(G.player.maxHp, G.player.hp + upgradeHp);
    }
    el("log").innerHTML = "";
    toggleLog(false);
    show("game");
    if (upgradeHp || upgradeDmg || upgradePotions) {
      log("Улучшения из деревни применены к походу: +" + upgradeHp +
        " здоровья, +" + upgradeDmg + " урона, +" + upgradePotions + " зелий.", "floor");
    }
    measureViewport();
    // Хвост, общий для обоих случаев: он ждёт, пока этаж реально загрузится.
    const afterFloor = () => {
      renderInventory();
      // Старое сохранение хранит номер ступени прежней шкалы (16…96 px), новое —
      // размер клетки; в обоих случаях берём ближайшую из нынешних ступеней.
      const savedCell = data.cameraCell != null ? data.cameraCell
        : (data.cameraZoom != null ? LEGACY_CAM_LEVELS[data.cameraZoom] : null);
      if (savedCell) {
        G.camera.zoomIndex = nearestZoomIndex(savedCell);
        // Не updateCamera(): тот двигает только плитки и камеру, а существа
        // остались бы на клетках прежнего масштаба — герой стоял в пустоте.
        render();
      }
    };
    if (data.over) {
      // Партия была проиграна. Бесплатно поднять её нельзя: перезагрузка
      // страницы обходила экран смерти и давала бесконечный фарм — золото,
      // снаряжение и этаж оставались, амулет не тратился. Теперь «продолжить»
      // стоит амулета, а без амулета поход окончен: доля золота уходит в
      // деревню, сейв стирается, этаж заново не начинается.
      G.floorIndex = data.floorIndex || 0;
      const prof = hubProfile();
      const amulets = prof && prof.hub ? prof.hub.revive : 0;
      if (amulets > 0) {
        useRevive(afterFloor);
      } else {
        const banked = bankRunGold(HUB_DEATH_SHARE);
        clearSave();
        reset();
        if (banked > 0) toast("В деревню перенесено " + banked + " золота");
      }
    } else {
      activateFloorLoaded(data.floorIndex || 0, () => {
        // activateFloor делает снимок «на входе» по нынешнему герою, а опыт на
        // этаже он набрал ещё до перезагрузки. Возвращаем настоящий снимок:
        // иначе смерть после «Продолжить» не отнимала бы опыт этого этажа.
        if (data.floorCheckpoint && data.floorCheckpoint.index === G.floorIndex) {
          G.floorCheckpoint = data.floorCheckpoint;
        }
        log("Продолжение игры. Этаж " + (G.floorIndex + 1) + ": " +
          floorNameAt(G.floorIndex) + ".", "floor");
        setMsg("Игра восстановлена из сохранения.");
        afterFloor();
      });
    }
    return true;
  }

  // Обновление страницы не должно выбрасывать из похода в деревню.
  // Сейв существует только у незаконченного похода: победа и уход в деревню
  // его удаляют. Поэтому если сейв есть — продолжаем с того же этажа, а
  // деревня открывается, когда продолжать нечего (или вошёл другой ученик).
  // Без входа не поднимаем: чужая партия на общем компьютере всплывать
  // не должна, и начать поход без аккаунта всё равно нельзя.
  function resumeOnLoad() {
    if (!accountName()) return false;
    // Игрок сам ушёл в деревню кнопкой «В деревню»: обновление страницы
    // не должно утаскивать его обратно в подземелье.
    if (placeMarker() === "village") return false;
    // Проигранную партию поднимаем только по кнопке: на экране смерти был
    // выбор «амулет или в деревню», и обновление страницы не должно решать
    // за ученика. В деревне кнопка предложит начать этаж заново.
    if (!pausedRun()) return false;
    return loadGame();
  }

  // Вернуться в деревню, не заканчивая поход. Без этого игрок запирался:
  // на шестом этаже спуск запечатан, оберег глубины выдаёт староста в
  // деревне, а пути наверх к деревне из подземелья не было вовсе.
  // Поход при этом не сбрасывается: этаж, золото и снаряжение ждут в
  // сохранении, а продолжить можно у стража у входа.
  function returnToVillage() {
    if (G.place !== "dungeon" || G.dead) return false;
    // Из боя не уходят: кнопка в шапке доступна с Tab/Enter даже под
    // оверлеем, и раньше это был бесплатный побег от дракона.
    if (G.battle) return false;
    // snapshotCurrent() вызовет saveGame() сам: он сохраняет текущий этаж
    // в кэш и пишет сейв целиком.
    G.battle = null;
    G.blessingOffer = null;
    const battleOverlay = el("battle-overlay");
    if (battleOverlay) battleOverlay.classList.add("hidden");
    const blessOverlay = el("blessing-overlay");
    if (blessOverlay) blessOverlay.classList.add("hidden");
    endBattleMode();
    const floorLeft = G.floorIndex + 1;
    saveGame();
    enterVillage(null);
    updateResumeButton();
    setMsg("Поход приостановлен. Продолжить — у стража у входа в подземелье.");
    log("Ты поднялся на поверхность. Поход сохранён: этаж " +
      floorLeft + " ждёт у стража.", "floor");
    toast("Поход сохранён");
    return true;
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

  // ---------- Верхнее меню и выезжающие панели ----------
  let gamePanel = null;

  function closeGamePanel() {
    gamePanel = null;
    const dock = el("game-dock");
    if (dock) dock.classList.add("hidden");
    document.querySelectorAll(".game-panel").forEach((panel) => panel.classList.remove("is-open"));
    document.querySelectorAll(".game-nav .nav-btn").forEach((btn) => btn.classList.remove("active"));
  }

  function openGamePanel(name) {
    const dock = el("game-dock");
    if (!dock) return;
    if (name === "journal") {
      if (!el("journal-overlay").classList.contains("hidden")) closeJournal();
      else openJournal();
      return;
    }
    if (gamePanel === name) {
      closeGamePanel();
      return;
    }
    gamePanel = name;
    dock.classList.remove("hidden");
    document.querySelectorAll(".game-panel").forEach((panel) => {
      panel.classList.toggle("is-open", panel.dataset.panelView === name);
    });
    document.querySelectorAll(".game-nav .nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === name);
    });
  }

  // Переносим существующие узлы HUD в панели, сохраняя id: весь код обновления
  // героя, сумки и деревни продолжает работать без переписывания.
  function setupGamePanels() {
    const side = document.querySelector(".side-panel");
    const dock = el("game-dock");
    if (!side || !dock) return;

    const cards = Array.from(side.querySelectorAll(":scope > .side-card"));
    const hud = cards[2] ? cards[2].querySelector(".hud") : null;
    const statsSlot = el("stats-slot");
    const place = el("place-dungeon");
    const inventoryWallet = el("inventory-wallet");
    const inventoryEquip = el("inventory-equip");
    const inventoryBag = el("inventory-bag");

    if (hud && statsSlot) {
      const blocks = Array.from(hud.querySelectorAll(":scope > .hud-block"));
      if (blocks[0]) statsSlot.appendChild(blocks[0]);
      if (blocks[1]) statsSlot.appendChild(blocks[1]);
      if (blocks[2]) {
        const nick = blocks[2].querySelector("#hud-nick");
        if (nick) statsSlot.appendChild(nick);
        if (place) {
          const title = document.createElement("div");
          title.className = "panel-section-title";
          title.textContent = "Подземелье";
          const lines = document.createElement("div");
          lines.className = "place-lines";
          place.appendChild(title);
          place.appendChild(lines);
          ["#enemies-left", "#quest-line"].forEach((sel) => {
            const node = blocks[2].querySelector(sel);
            if (node) lines.appendChild(node);
          });
        }
        const gold = blocks[2].querySelector("#gold-text");
        if (gold && inventoryWallet) {
          const line = gold.closest(".hud-num");
          if (line) inventoryWallet.appendChild(line);
        }
      }
    }

    const village = el("village-info");
    const villageSlot = el("place-village-slot");
    if (village && villageSlot) villageSlot.appendChild(village);

    const wallet = el("wallet-line");
    if (wallet && inventoryWallet) inventoryWallet.appendChild(wallet);
    const badges = el("game-badges");
    if (badges) el("achievements-slot").appendChild(badges);

    const equip = side.querySelector(".equip-bar");
    if (equip && inventoryEquip) inventoryEquip.appendChild(equip);
    const effects = el("effect-list");
    if (effects) el("stats-effects").appendChild(effects);

    const bag = el("inventory-card");
    if (bag && inventoryBag) inventoryBag.appendChild(bag);

    side.classList.add("hidden");
    side.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      node.innerHTML = iconSvg(node.dataset.icon);
    });

    setupGamePanels();
    document.querySelectorAll(".game-nav [data-panel]").forEach((btn) => {
      btn.addEventListener("click", () => openGamePanel(btn.dataset.panel));
    });
    const hudStory = el("hud-story");
    if (hudStory) hudStory.addEventListener("click", () => openJournal("story"));
    document.querySelectorAll("[data-panel-close]").forEach((btn) => {
      btn.addEventListener("click", closeGamePanel);
    });
    const codexOverlay = el("codex-overlay");
    if (codexOverlay) {
      codexOverlay.addEventListener("click", (ev) => {
        if (ev.target === codexOverlay) closeCodex();
      });
    }

    el("begin-btn").addEventListener("click", beginFromEntrance);
    el("resume-btn").addEventListener("click", () => loadGame());
    const tutorialSkipBtn = el("tutorial-skip");
    if (tutorialSkipBtn) tutorialSkipBtn.addEventListener("click", tutorialSkip);
    const calibrationBtn = el("calibration-btn");
    if (calibrationBtn) calibrationBtn.addEventListener("click", () => openCalibration(null));
    el("entrance-close").addEventListener("click", closeEntrance);
    // Окно калибровки перерисовывается после каждого ответа, поэтому клики
    // ловим делегированием на оверлее, а не на отдельных кнопках.
    el("calibration-overlay").addEventListener("click", (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      const opt = t.closest("[data-calib-option]");
      if (opt) { pickCalibrationOption(Number(opt.dataset.calibOption)); return; }
      if (t.closest("#calib-next")) { nextCalibration(); return; }
      if (t.closest("#calib-skip")) { skipCalibration(); return; }
      if (t.closest("#calib-continue")) { finishCalibration(); return; }
      if (t.closest("#calib-again")) { restartCalibration(); return; }
      if (t.closest("#calib-close")) { closeCalibration(); }
    });
    el("leave-btn").addEventListener("click", leave);
    const menuBtn = el("menu-btn");
    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        if (window.PyMenu && typeof window.PyMenu.openPause === "function") {
          window.PyMenu.openPause();
        }
      });
    }
    el("village-btn").addEventListener("click", returnToVillage);
    // Крест на телефоне: те же четыре направления, что и у стрелок.
    document.addEventListener("click", (ev) => {
      const btn = ev.target && ev.target.closest ? ev.target.closest("[data-move]") : null;
      if (!btn) return;
      const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const d = dirs[btn.dataset.move];
      if (!d) return;
      ev.preventDefault();
      move(d[0], d[1]);
    });
    el("shop-btn").addEventListener("click", () => openShop(false));
    el("action-btn").addEventListener("click", doInteract);
    el("skip-btn").addEventListener("click", skipTurn);
    el("forge-btn").addEventListener("click", openForge);
    el("minimap").addEventListener("click", toggleMinimap);
    // Плашки снаряжения в сводке снимают вещь нажатием: отдельного списка
    // «Экипировано» в колонке больше нет, чтобы не повторять одно и то же.
    document.addEventListener("click", (ev) => {
      const node = ev.target && ev.target.closest ? ev.target.closest("[data-unequip]") : null;
      if (node && !node.disabled) unequipItem(node.dataset.unequip);
    });
    initTips();
    // Полноэкранный режим. На обычном сервере кнопка тоже работает, а если
    // браузер не умеет Fullscreen API — просто не показываем её.
    const fullscreenBtn = el("fullscreen-btn");
    if (fullscreenBtn) {
      if (!document.fullscreenEnabled) {
        fullscreenBtn.classList.add("hidden");
      } else {
        fullscreenBtn.addEventListener("click", toggleFullscreen);
        document.addEventListener("fullscreenchange", updateFullscreenButton);
        updateFullscreenButton();
      }
    }
    // Панель героя всегда видна: отдельной кнопки HUD больше нет.
    const sidePanel = document.querySelector(".side-panel");
    if (sidePanel) sidePanel.classList.remove("hud-collapsed");
    updateResumeButton();
    updateWalletLine();
    updateKnowledgeLine();
    renderVillageInfo();
    // Лавка торговца живёт в его окне: карточки перерисовываются после
    // покупки, поэтому клик по «Купить» делегируем контейнеру.
    document.addEventListener("click", (ev) => {
      const btn = ev.target && ev.target.closest ? ev.target.closest("#dialog-shop .hub-buy") : null;
      if (btn && !btn.disabled) buyHubItem(btn.dataset.kind);
    });
    // Улучшения героя и восстановление построек живут в окнах деревни: они
    // тоже перерисовываются после покупки, поэтому клики делегируем.
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!t || !t.closest) return;
      const upg = t.closest(".upg-buy");
      if (upg && !upg.disabled) { buyHeroUpgrade(upg.dataset.upg); return; }
      const build = t.closest(".build-go");
      if (build && !build.disabled) { restoreBuilding(build.dataset.build); return; }
      // Квесты старосты: взять, сдать, отказаться. После каждого действия окно
      // перерисовывается — иначе староста остался бы с прежним списком.
      const take = t.closest(".quest-take");
      if (take) { takeRepeatQuest(take.dataset.quest); refreshDialog(); return; }
      const drop = t.closest(".quest-drop");
      if (drop) { takeRepeatQuest(""); refreshDialog(); return; }
      const claim = t.closest(".quest-claim");
      if (claim) {
        if (claim.dataset.quest === "story") claimStory();
        else claimRepeat();
        refreshDialog();
      }
    });

    // «Продолжить поход» из панели деревни: та же кнопка, что у стража,
    // но на виду — иначе ученик начинал новый поход и затирал сохранённый.
    document.addEventListener("click", (ev) => {
      const btn = ev.target && ev.target.closest ? ev.target.closest("#village-resume-btn") : null;
      if (btn) loadGame();
    });

    // Ответ на вопрос рычага: клик по варианту в окне.
    document.addEventListener("click", (ev) => {
      const btn = ev.target && ev.target.closest ? ev.target.closest("[data-lever]") : null;
      if (!btn) return;
      const lever = (G.levers || []).find((l) => l.view && !l.used);
      if (lever) answerLever(lever, Number(btn.dataset.lever));
    });

    // Умение похода: выбор карточки в окне стража.
    el("ability-list").addEventListener("click", (e) => {
      const card = e.target.closest ? e.target.closest("[data-ab]") : null;
      if (card) pickAbility(card.dataset.ab);
    });

    el("difficulty").addEventListener("click", (e) => {
      const mode = e.target.closest(".mode");
      if (!mode) return;
      el("difficulty").querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
      mode.classList.add("active");
      G.difficulty = mode.dataset.diff;
      syncPickState();
    });

    // Режим похода: обычные десять этажей или бесконечный спуск.
    el("game-mode").addEventListener("click", (e) => {
      const mode = e.target.closest(".mode");
      if (!mode) return;
      el("game-mode").querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
      mode.classList.add("active");
      G.mode = mode.dataset.mode === "endless" ? "endless" : "dungeon";
      syncPickState();
    });

    // Клавиатура для тех же карточек: Enter/Space выбирает, стрелки ходят
    // по группе. Событие не отдаём в document — там Пробел значит «пропустить
    // ход», и на стартовом экране оно бы только мешало.
    PICK_GROUPS.forEach((pair) => {
      const box = el(pair[0]);
      if (!box) return;
      box.addEventListener("keydown", (e) => {
        const mode = e.target.closest(".mode");
        if (!mode) return;
        if (e.key === " " || e.key === "Enter" || e.key === "Spacebar") {
          e.preventDefault();
          e.stopPropagation();
          box.querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
          mode.classList.add("active");
          if (pair[1] === "mode") G.mode = mode.dataset.mode === "endless" ? "endless" : "dungeon";
          else G.difficulty = mode.dataset.diff;
          syncPickState();
          return;
        }
        pickArrow(box, pair[1], e);
      });
      syncPickState();
    });

    window.addEventListener("resize", () => {
      if (G.running && G.map && !el("screen-game").classList.contains("hidden")) {
        measureViewport();
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
          (G.camera.zoomIndex == null ? defaultZoomIndex() : G.camera.zoomIndex) + step,
          0,
          CAM_LEVELS.length - 1
        );
        updateCamera();
        renderEntities();
      },
      { passive: false }
    );

    document.addEventListener("keydown", (e) => {
      // P открывает панель разработчика даже поверх меню (F5 больше не нужен).
      if (!isTypingTarget(e.target) &&
          (String(e.key).toLowerCase() === "p" ||
           String(e.key).toLowerCase() === "з" ||
           e.code === "KeyP") && G.dev) {
        e.preventDefault();
        devToggle();
        return;
      }
      // Меню — модальное окно: под ним не ходят, не пропускают ход и не
      // открывают панели. Свои клавиши (Escape, Enter в полях) меню
      // обрабатывает отдельным слушателем.
      if (typeof window !== "undefined" && window.PyMenu &&
          typeof window.PyMenu.isOpen === "function" && window.PyMenu.isOpen()) {
        return;
      }
      // Окно стража — модальное: Tab не должен уходить в шапку и на карту.
      // Если поверх него открыта калибровка, фокусом управляет она.
      if (el("calibration-overlay").classList.contains("hidden") &&
          trapFocus(e, "entrance-overlay")) {
        return;
      }
      // Калибровка — модальное окно поверх стража: Escape закрывает, Enter
      // после ответа ведёт к следующему вопросу.
      if (!el("calibration-overlay").classList.contains("hidden")) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeCalibration();
          return;
        }
        if (e.key === "Enter" && calibrationState && calibrationState.answered) {
          e.preventDefault();
          nextCalibration();
          return;
        }
      }
      // Пока этаж грузится, клавиши не должны ходить по старой карте.
      if (G.loading) return;
      const typing = isTypingTarget(e.target);
      // E (и та же клавиша в русской раскладке) — действие у объекта.
      if (!typing && (e.key === "e" || e.key === "E" || e.key === "у" || e.key === "У")) {
        if (!el("screen-game").classList.contains("hidden") && !overlayOpen()) {
          e.preventDefault();
          doInteract();
          return;
        }
      }
      if (!typing && (e.key === "i" || e.key === "I" || e.key === "ш" || e.key === "Ш")) {
        if (!el("screen-game").classList.contains("hidden") &&
            el("battle-overlay").classList.contains("hidden")) {
          openInventory();
          return;
        }
      }
      if (!typing && (e.key === "m" || e.key === "M" || e.key === "ь" || e.key === "Ь")) {
        if (!el("screen-game").classList.contains("hidden")) {
          toggleMinimap();
          return;
        }
      }
      if (e.key === "Escape" && !el("codex-overlay").classList.contains("hidden")) {
        closeCodex();
        return;
      }
      if (e.key === "Escape" && !el("shop-overlay").classList.contains("hidden")) {
        closeShop();
        return;
      }
      // Escape закрывает окна деревни так же, как лавку.
      if (e.key === "Escape" && !el("entrance-overlay").classList.contains("hidden")) {
        closeEntrance();
        return;
      }
      if (e.key === "Escape" && !el("dialog-overlay").classList.contains("hidden")) {
        closeDialog();
        return;
      }
      // Escape закрывает и журнал: раньше его можно было только переключить
      // той же кнопкой, а панель занимала четверть карты.
      if (e.key === "Escape" && !el("log").classList.contains("collapsed")) {
        toggleLog(false);
        return;
      }
      // Escape в игре открывает паузу, а не главное меню. В бою и под
      // модальными окнами пауза не открывается: сначала закрываем их.
      if (e.key === "Escape" && G.running && !G.battle && !overlayOpen()) {
        e.preventDefault();
        if (window.PyMenu && typeof window.PyMenu.openPause === "function") {
          window.PyMenu.openPause();
        }
        return;
      }
      // В бою с вариантами ответа можно отвечать с клавиатуры: на кнопках
      // нарисованы буквы A–D, но раньше клавиши ничего не делали — приходилось
      // целиться мышью. Работают и буквы (в двух раскладках), и цифры 1–4.
      if (!el("battle-overlay").classList.contains("hidden") && G.battle &&
          G.battle.phase === "question") {
        const cb = G.battle.challenge;
        const mcType = cb.type === "mc" || cb.type === "fill" || cb.type === "error";
        if (mcType) {
          const byKey = { a: 0, "ф": 0, b: 1, "и": 1, c: 2, "с": 2, d: 3, "в": 3 };
          const letter = byKey[e.key.toLowerCase()];
          const digit = "1234".indexOf(e.key);
          const idx = letter !== undefined ? letter : digit;
          const view = cb.view || cb.question || cb.task;
          if (idx >= 0 && view && view.options && idx < view.options.length) {
            e.preventDefault();
            answerMC(idx);
            return;
          }
        }
        // Ctrl+Enter отправляет код на проверку. Обычный Enter оставлен
        // переносу строки: в функциях он нужен куда чаще, чем отправка.
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && el("check-btn")) {
          e.preventDefault();
          el("check-btn").click();
          return;
        }
      }
      if (!el("battle-overlay").classList.contains("hidden")) return;
      if (!el("end-overlay").classList.contains("hidden")) return;
      if (!el("shop-overlay").classList.contains("hidden")) return;
      if (!el("entrance-overlay").classList.contains("hidden")) return;
      if (!el("dialog-overlay").classList.contains("hidden")) return;
      if (el("screen-game").classList.contains("hidden")) return;
      // Пробел — пропуск хода: герой стоит, монстры ходят.
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        // Автоповтор браузера превратил бы одно нажатие в десяток ходов.
        if (e.repeat) return;
        cancelWalk();
        skipTurn();
        return;
      }
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
      // В русской раскладке e.key для W/A/S/D — «ц», «ф», «ы», «в»: ходить
      // по клавишам ученик не мог. Физическую клавишу даёт e.code.
      const byCode = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
      const dir = map[k] || map[e.key] || map[byCode[e.code]];
      if (dir) {
        e.preventDefault();
        // Один шаг за одно нажатие. Раньше автоповтор браузера слал
        // keydown ~30 раз в секунду, и зажатая стрелка уносила героя
        // через полэтажа, пока он не успевал прочитать вопросы.
        if (e.repeat) return;
        // Ручной шаг отменяет маршрут, набранный кликом.
        cancelWalk();
        const d = DIRS[dir];
        move(d[0], d[1]);
      }
    });

    // Клик по плите: герой идёт туда сам, по клетке за ход.
    // Каждый шаг — полноценный ход: враги в это время ходят,
    // срабатывают ловушки, задания выпадают как обычно.
    el("map").addEventListener("click", onMapClick);

    // Учитель мог поменять числа баланса на /admin: сервер отдаёт их
    // отдельно от страницы, чтобы правка не требовала пересборки файлов.
    loadServerBalance();

    // Игра открывается в деревне, только если продолжать нечего: иначе
    // обновление страницы посреди похода выбрасывало в деревню, а «Продолжить»
    // пряталось в окне стража — со стороны это выглядело как сброс прогресса.
    const resumed = resumeOnLoad();
    if (!resumed) enterVillage(null);
    // Стартовое меню — первый экран. После входа страница перезагружается,
    // и PyMenu.boot сам пропускает меню, если игрок уже нажал «Играть».
    if (window.PyMenu && typeof window.PyMenu.boot === "function") {
      window.PyMenu.boot({ resumed: resumed });
    }
    devInit();
  });

  // ---------- Инструменты разработчика ----------
  // Включаются только ключом --dev на сервере: window.__PYQUIZ_FEATURES.dev.
  // Это важно для занятия: ученик не может включить панель из адресной
  // строки — решение принимает преподаватель при запуске сервера.

  function devEnabled() {
    return !!(typeof window !== "undefined" && window.__PYQUIZ_FEATURES &&
      window.__PYQUIZ_FEATURES.dev === true);
  }

  // Неуязвимость проверяется в местах, где герой теряет здоровье.
  function devGod() {
    return !!(G.dev && G.dev.god);
  }

  function devRevealAll() {
    if (!G.map) return;
    const all = new Set();
    for (let y = 0; y < G.map.h; y++) {
      for (let x = 0; x < G.map.w; x++) {
        if (G.map.grid[y][x] === 1) all.add(key(x, y));
      }
    }
    G.visible = all;
    G.discovered = new Set(all);
  }

  function devInit() {
    // Публичная сборка не должна показывать кнопку DEV и открывать панель.
    if (!devEnabled()) return;
    if (!G.dev) G.dev = { god: false, reveal: false, panel: false, tab: "world" };
    if (!G.dev.tab) G.dev.tab = "world";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "dev-toggle";
    btn.className = "dev-toggle";
    btn.textContent = "DEV";
    btn.title = "Панель разработчика. Клавиша P.";
    btn.addEventListener("click", devToggle);
    document.body.appendChild(btn);

    const panel = document.createElement("section");
    panel.id = "dev-panel";
    panel.className = "dev-panel hidden";
    panel.innerHTML =
      "<div class='dev-head'><b>Панель разработчика</b>" +
      "<span class='dev-key'>P</span>" +
      "<button type='button' class='dev-close' data-dev='panel' title='Закрыть (P)'>×</button></div>" +
      "<div class='dev-state' id='dev-state'></div>" +
      "<div class='dev-tabs'>" +
      "<button type='button' class='dev-tab is-active' data-dev-tab='world'>Мир</button>" +
      "<button type='button' class='dev-tab' data-dev-tab='player'>Игрок</button>" +
      "<button type='button' class='dev-tab' data-dev-tab='quests'>Квесты</button>" +
      "<button type='button' class='dev-tab' data-dev-tab='items'>Предметы</button>" +
      "<button type='button' class='dev-tab' data-dev-tab='settings'>Настройки</button></div>" +
      "<div class='dev-pane is-active' data-dev-pane='world'>" +
      "<div class='dev-group'><span>Этаж</span>" +
      "<input type='number' id='dev-floor' min='1' max='99' step='1'>" +
      "<button type='button' class='dev-btn' data-dev='jump'>Перейти</button>" +
      "<button type='button' class='dev-btn' data-dev='next'>Следующий</button>" +
      "<button type='button' class='dev-btn' data-dev='regen'>Пересоздать</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='kill'>Убить всех</button>" +
      "<button type='button' class='dev-btn' data-dev='stairs'>К лестнице</button>" +
      "<button type='button' class='dev-btn' data-dev='skip'>Пропустить этаж</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='portal'>Открыть портал</button>" +
      "<button type='button' class='dev-btn dev-primary' data-dev='village'>Вернуться в деревню</button></div>" +
      "</div>" +
      "<div class='dev-pane' data-dev-pane='player'>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='heal'>Лечить</button>" +
      "<button type='button' class='dev-btn' data-dev='god'>Неуязвимость</button>" +
      "<button type='button' class='dev-btn' data-dev='xp'>+1000 опыта</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='battle-win'>Победить в бою</button></div>" +
      "</div>" +
      "<div class='dev-pane' data-dev-pane='quests'>" +
      "<div class='dev-quest' id='dev-quest-state'></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='story'>Сдать сюжетный шаг</button>" +
      "<button type='button' class='dev-btn' data-dev='repeat'>Закрыть повторяемое</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='quest-fill'>Заполнить прогресс</button>" +
      "<button type='button' class='dev-btn' data-dev='story-reset'>Сбросить сюжет</button>" +
      "<button type='button' class='dev-btn' data-dev='quest-reset'>Сбросить повторяемые</button></div>" +
      "</div>" +
      "<div class='dev-pane' data-dev-pane='items'>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='gold'>+1000 золота</button>" +
      "<button type='button' class='dev-btn' data-dev='items'>Выдать снаряжение</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='mats'>Материалы +10</button>" +
      "<button type='button' class='dev-btn' data-dev='keys'>Все ключи</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='codex-all'>Открыть весь справочник</button></div>" +
      "</div>" +
      "<div class='dev-pane' data-dev-pane='settings'>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn' data-dev='reveal'>Открыть карту</button>" +
      "<button type='button' class='dev-btn' data-dev='god'>Неуязвимость</button></div>" +
      "<div class='dev-group'>" +
      "<button type='button' class='dev-btn dev-danger' data-dev='wipe'>Удалить сейв</button></div>" +
      "</div>";
    document.body.appendChild(panel);
    panel.addEventListener("click", devClick);
    devRender();
  }

  function devToggle() {
    if (!G.dev) return;
    G.dev.panel = !G.dev.panel;
    const panel = el("dev-panel");
    if (panel) panel.classList.toggle("hidden", !G.dev.panel);
    devRender();
  }

  function devJump(index) {
    const i = Math.max(0, Math.min(99, Number(index) || 0));
    snapshotCurrent();
    activateFloorLoaded(i, () => {
      if (!G.visited) G.visited = new Set();
      G.visited.add(i);
      log("DEV: переход на этаж " + (i + 1) + ".", "floor");
      render();
      updateHud();
    });
  }

  function devKillAll() {
    if (G.battle) closeBattle();
    const foes = (G.enemies || []).slice();
    foes.forEach((e) => {
      if (G.enemies.indexOf(e) >= 0) defeatEnemy(e);
    });
    if (G.stairsDown) G.stairsDown.active = true;
    render();
    updateHud();
    updateActionButton();
    toast("Этаж очищен: врагов нет, на их местах остались мешочки");
  }

  function devToStairs() {
    if (!G.stairsDown) return;
    G.playerPos = { x: G.stairsDown.x, y: G.stairsDown.y };
    G.walkTarget = null;
    render();
    updateActionButton();
  }

  function devReturnVillage() {
    if (G.place === "village") {
      toast("Ты уже в деревне");
      return;
    }
    if (G.battle) {
      G.battle = null;
      el("battle-overlay").classList.add("hidden");
      endBattleMode();
    }
    if (!returnToVillage()) enterVillage(null);
    toast("DEV: возврат в деревню");
  }

  function devBattleWin() {
    if (!G.battle || !G.battle.enemy) {
      toast("Сейчас нет боя");
      return;
    }
    defeatEnemy(G.battle.enemy);
    G.battle.won = true;
    G.battle.phase = "result";
    continueBattle();
    updateHud();
    render();
    updateActionButton();
    toast("Бой завершён победой");
  }

  function devQuestFill() {
    const prof = hubProfile();
    const def = prof && REPEAT_QUESTS[prof.quests.active];
    if (!def) {
      toast("Нет активного повторяемого задания");
      return;
    }
    G.questProgress = { n: def.need };
    updateHud();
    toast("Прогресс задания заполнен");
  }

  function devCodexAll() {
    const state = codexState();
    (typeof ITEM_POOL !== "undefined" ? ITEM_POOL : []).forEach((item) => {
      if (item && item.id) state.items[item.id] = 1;
    });
    VILLAGE_NPCS.forEach((npc) => { state.npcs[npc.key] = 1; });
    ENEMY_TYPES.forEach((mob) => { state.enemies[mob.key] = 1; });
    scheduleSave();
    toast("Справочник открыт полностью");
  }

  function devOpenPortal() {
    if (!G.portal) {
      toast("На этом этаже портала нет");
      return;
    }
    (G.enemies || []).forEach((e) => { e.hp = 0; });
    G.enemies = [];
    if (G.stairsDown) G.stairsDown.active = true;
    render();
    updateHud();
    updateActionButton();
    toast("Портал в деревню открыт");
  }

  function devStoryStep() {
    const prof = hubProfile();
    if (!prof) { toast("Нет профиля"); return; }
    const step = storyStep();
    if (!step) { toast("Сюжет уже пройден"); return; }
    prof.quests.story = Math.min(STORY_QUESTS.length, (prof.quests.story || 0) + 1);
    if (step.key && prof.quests.done.indexOf(step.key) < 0) prof.quests.done.push(step.key);
    putProfile(hubName(), prof);
    syncProfile(hubName());
    renderVillageInfo();
    updateHud();
    toast("Сюжет: «" + step.title + "» зачтён");
  }

  function devRepeatClose() {
    const prof = hubProfile();
    if (!prof || !REPEAT_QUESTS[prof.quests.active]) {
      toast("Нет активного повторяемого задания");
      return;
    }
    const key = prof.quests.active;
    prof.quests.repeat[key] = (prof.quests.repeat[key] || 0) + 1;
    prof.quests.active = "";
    putProfile(hubName(), prof);
    syncProfile(hubName());
    G.questProgress = { n: 0 };
    renderVillageInfo();
    updateHud();
    toast("Повторяемое задание закрыто");
  }

  function devQuestReset() {
    const prof = hubProfile();
    if (!prof) return;
    prof.quests.repeat = {};
    prof.quests.active = "";
    prof.quests.failed = [];
    prof.quests.progress = {};
    putProfile(hubName(), prof);
    syncProfile(hubName());
    G.questProgress = { n: 0 };
    renderVillageInfo();
    updateHud();
    toast("Повторяемые задания сброшены");
  }

  function devStoryReset() {
    const prof = hubProfile();
    if (!prof) return;
    prof.quests.story = 0;
    prof.quests.done = [];
    putProfile(hubName(), prof);
    syncProfile(hubName());
    renderVillageInfo();
    updateHud();
    toast("Сюжет сброшен");
  }

  function devXp() {
    if (!G.player) return;
    G.player.xp += 1000;
    while (G.player.xp >= G.player.xpNext) {
      G.player.xp -= G.player.xpNext;
      G.player.level += 1;
      G.player.baseMaxHp += LEVEL_HP;
      G.player.dmgBase += LEVEL_DMG;
      G.player.xpNext = XP_BASE * G.player.level;
      recalcStats();
    }
    updateHud();
    toast("+1000 опыта");
  }

  function devClick(ev) {
    const tab = ev.target && ev.target.closest ? ev.target.closest("[data-dev-tab]") : null;
    if (tab) {
      G.dev.tab = tab.dataset.devTab;
      devRender();
      return;
    }
    const btn = ev.target && ev.target.closest ? ev.target.closest("[data-dev]") : null;
    if (!btn) return;
    devAction(btn.dataset.dev);
    devRender();
  }

  function devAction(action) {
    if (!G.dev) return;
    if (action === "panel") { devToggle(); return; }
    if (action === "village") { devReturnVillage(); return; }
    if (action === "battle-win") { devBattleWin(); return; }
    if (action === "quest-fill") { devQuestFill(); return; }
    if (action === "codex-all") { devCodexAll(); return; }
    if (action === "portal") { devOpenPortal(); return; }
    if (action === "xp") { devXp(); return; }
    if (action === "story") { devStoryStep(); return; }
    if (action === "repeat") { devRepeatClose(); return; }
    if (action === "story-reset") { devStoryReset(); return; }
    if (action === "quest-reset") { devQuestReset(); return; }
    if (action === "jump") {
      const input = el("dev-floor");
      const n = Number(input && input.value) || (G.floorIndex + 1);
      devJump(n - 1);
      return;
    }
    if (action === "next") { devJump(G.floorIndex + 1); return; }
    if (action === "regen") {
      delete G.cache[G.floorIndex];
      activateFloorLoaded(G.floorIndex);
      return;
    }
    if (action === "heal") {
      G.player.hp = G.player.maxHp;
      G.player.poison = 0;
      G.player.cursedNext = false;
      updateHud();
      render();
      return;
    }
    if (action === "god") {
      G.dev.god = !G.dev.god;
      toast("Неуязвимость: " + (G.dev.god ? "включена" : "выключена"));
      return;
    }
    if (action === "reveal") {
      G.dev.reveal = !G.dev.reveal;
      if (G.dev.reveal) devRevealAll();
      render();
      toast("Карта: " + (G.dev.reveal ? "открыта" : "обычная видимость"));
      return;
    }
    if (action === "kill") { devKillAll(); return; }
    if (action === "stairs") { devToStairs(); return; }
    if (action === "skip") { devKillAll(); devJump(G.floorIndex + 1); return; }
    if (action === "gold") {
      G.player.gold += 1000;
      updateHud();
      toast("+1000 золота");
      return;
    }
    if (action === "items") {
      ["steel_sword", "iron_armor", "small_potion", "small_potion", "big_potion"]
        .forEach((id) => {
          const it = itemById(id);
          if (it) addItem(Object.assign({}, it));
        });
      renderInventory();
      updateHud();
      toast("Выдано снаряжение и зелья");
      return;
    }
    if (action === "mats") {
      const prof = hubProfile();
      if (!prof) return;
      LOOT_KINDS.forEach((k) => { prof.loot[k] = (prof.loot[k] || 0) + 10; });
      putProfile(hubName(), prof);
      syncProfile(hubName());
      renderVillageInfo();
      toast("Материалы: +10 каждого");
      return;
    }
    if (action === "keys") {
      const prof = hubProfile();
      if (!prof) return;
      Object.keys(KEY_DEFS).forEach((k) => {
        if (prof.loot.keys.indexOf(k) < 0) prof.loot.keys.push(k);
      });
      putProfile(hubName(), prof);
      syncProfile(hubName());
      renderVillageInfo();
      toast("Выданы все ключи");
      return;
    }
    if (action === "wipe") {
      if (!window.confirm("Удалить сохранение похода и вернуться в деревню?")) return;
      clearSave();
      G.dead = false;
      G.running = false;
      enterVillage(null);
      updateResumeButton();
      toast("Сохранение похода удалено");
    }
  }

  function devRender() {
    const state = el("dev-state");
    if (!state) return;
    const cached = G.cache && G.cache[G.floorIndex];
    const checked = cached && cached.checked;
    state.textContent =
      "Место: " + (G.place || "—") +
      " · этаж " + (G.floorIndex + 1) +
      " · HP " + (G.player ? G.player.hp + "/" + G.player.maxHp : "—") +
      " · золото " + (G.player ? G.player.gold : 0) +
      " · врагов " + ((G.enemies || []).length) +
      (checked ? " · проверка: попыток " + checked.attempts +
        (checked.repaired ? ", чинена" : "") : "");
    if (G.dev && G.dev.tab) {
      document.querySelectorAll("[data-dev-tab]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.devTab === G.dev.tab);
      });
      document.querySelectorAll("[data-dev-pane]").forEach((pane) => {
        pane.classList.toggle("is-active", pane.dataset.devPane === G.dev.tab);
      });
    }
    ["god", "reveal"].forEach((name) => {
      document.querySelectorAll("[data-dev='" + name + "']").forEach((node) => {
        node.classList.toggle("dev-on", !!(G.dev && G.dev[name]));
      });
    });
    const questState = el("dev-quest-state");
    if (questState) {
      const prof = hubProfile();
      const q = prof && prof.quests;
      if (!q) {
        questState.textContent = "Профиль ещё не выбран.";
      } else {
        const step = storyStep();
        const active = REPEAT_QUESTS[q.active];
        const repeatDone = REPEAT_KEYS
          .filter((k) => q.repeat && q.repeat[k])
          .map((k) => REPEAT_QUESTS[k].title + " ×" + q.repeat[k]);
        questState.innerHTML =
          "<b>Сюжет:</b> " + Math.min(q.story || 0, STORY_QUESTS.length) + " / " + STORY_QUESTS.length +
          (step ? " · " + step.title : " · пройден") +
          "<br><b>Повторяемое:</b> " + (active
            ? active.title + " (" + questProgress() + "/" + active.need + ")"
            : "не взято") +
          "<br><b>Закрыто повторяемых:</b> " + (repeatDone.length ? repeatDone.join(", ") : "нет");
      }
    }
    const input = el("dev-floor");
    if (input && document.activeElement !== input) {
      input.value = String(G.floorIndex + 1);
    }
  }

  // ===================== АДМИН-ПАНЕЛЬ: ЧИСЛА БАЛАНСА =====================
  // Учитель меняет эти числа на странице /admin и не трогает код. Сервер
  // хранит их в game-config.json и отдаёт всем через GET /api/game-config;
  // здесь мы только применяем присланное. Имена ключей — ровно те же, что в
  // схеме server.py (BALANCE_FIELDS), поэтому список кнобов живёт в одном
  // месте, а неизвестный ключ молча игнорируется.
  //
  // Новые числа видны сразу: следующий созданный монстр, следующая цена и
  // следующий удар считаются уже по ним. Уже стоящие на карте враги хранят
  // своё hp/dmg и не пересчитываются — иначе поднятый на ходу баланс убивал
  // бы героя без единого ответа.
  const BALANCE_KEYS = [
    "enemy.hpPerFloor", "enemy.dmgFlat", "enemy.dmgPct",
    "elite.hpMul", "elite.dmgMul", "elite.chanceBase", "elite.chanceStep", "elite.gold",
    "squad.from", "squad.chance", "squad.maxSize",
    "combat.aggro", "combat.view", "combat.darkView", "combat.hazardDmg",
    "combat.rangedDmg", "combat.hintCap", "combat.streakStep", "combat.streakCap",
    "player.levelDmg", "player.levelHp", "player.xpBase",
    "econ.goldBase", "econ.goldDepth", "econ.bossGold", "econ.priceDepth",
    "econ.sellRate", "econ.shopMarkup",
    "econ.forgeBase", "econ.forgeStep", "econ.forgeDepth",
    "econ.forgeAtk", "econ.forgeDef", "econ.forgeHp",
    "difficulty.easy.enemyScale", "difficulty.normal.enemyScale", "difficulty.hard.enemyScale",
    "difficulty.easy.qBonus", "difficulty.normal.qBonus", "difficulty.hard.qBonus",
    "hazard.frost", "hazard.lava",
    "enemy.hpMul", "combat.missStep", "combat.missCap", "guard.hpMul", "guard.dmgMul",
    "learn.reviewChance", "learn.floorTopic",
    "hub.deathGoldShare", "hub.amuletPrice", "hub.amuletFindChance", "hub.amuletMax",
    "village.view", "combat.skipShare", "enemy.hpStart",
    "endless.depthDmg",
    "deep.from", "deep.hpMul", "deep.dmgMul",
    "hero.hpStep", "hero.dmgStep", "hero.lootStep", "hero.armorStep",
    "hero.hpPrice", "hero.dmgPrice", "hero.potionsPrice", "hero.lootPrice",
    "hero.armorPrice", "hero.priceStep",
    "village.wellHp", "village.barnBonus", "village.costMul",
    "loot.oreChance", "loot.woodChance", "loot.shardChance",
    "quest.gold", "quest.material",
    "combat.braceCut", "combat.fleeHit",
    "ability.charges", "ability.strikeMul", "ability.breath",
    "rest.heal", "rest.perRun"
  ];

  function applyBalanceValue(key, value) {
    if (typeof value !== "number" || !isFinite(value)) return false;
    switch (key) {
      case "enemy.hpPerFloor": HP_PER_FLOOR = value; return true;
      case "enemy.dmgFlat": ENEMY_DMG_PER_FLOOR = value; return true;
      case "enemy.dmgPct": ENEMY_DMG_RAMP = value; return true;
      case "elite.hpMul": ELITE.hpMul = value; return true;
      case "elite.dmgMul": ELITE.dmgMul = value; return true;
      case "elite.chanceBase": ELITE.chanceBase = value; return true;
      case "elite.chanceStep": ELITE.chanceStep = value; return true;
      case "elite.gold": ELITE.gold = value; return true;
      case "squad.from": SQUAD.from = value; return true;
      case "squad.chance": SQUAD.chance = value; return true;
      case "squad.maxSize": SQUAD.maxSize = value; return true;
      case "combat.aggro": AGGRO_RADIUS = value; return true;
      case "combat.view": VIEW_RADIUS = value; return true;
      case "combat.darkView": DARK_VIEW_RADIUS = value; return true;
      case "combat.hazardDmg": HAZARD_DMG_BASE = value; return true;
      case "combat.rangedDmg": RANGED.dmgScale = value; return true;
      case "combat.hintCap": HINT_CAP = value; return true;
      case "combat.streakStep": STREAK_STEP = value; return true;
      case "combat.streakCap": STREAK_CAP = value; return true;
      case "player.levelDmg": LEVEL_DMG = value; return true;
      case "player.levelHp": LEVEL_HP = value; return true;
      case "player.xpBase": XP_BASE = value; return true;
      case "econ.goldBase": ECON.goldBase = value; return true;
      case "econ.goldDepth": ECON.goldDepth = value; return true;
      case "econ.bossGold": ECON.bossGold = value; return true;
      case "econ.priceDepth": ECON.priceDepth = value; return true;
      case "econ.sellRate": ECON.sellRate = value; return true;
      case "econ.shopMarkup": SHOP_MARKUP = value; return true;
      case "econ.forgeBase": ECON.forgeBase = value; return true;
      case "econ.forgeStep": ECON.forgeStep = value; return true;
      case "econ.forgeDepth": ECON.forgeDepth = value; return true;
      case "econ.forgeAtk": ECON.forgeAtk = value; return true;
      case "econ.forgeDef": ECON.forgeDef = value; return true;
      case "econ.forgeHp": ECON.forgeHp = value; return true;
      case "difficulty.easy.enemyScale": DIFFICULTY.easy.enemyScale = value; return true;
      case "difficulty.normal.enemyScale": DIFFICULTY.normal.enemyScale = value; return true;
      case "difficulty.hard.enemyScale": DIFFICULTY.hard.enemyScale = value; return true;
      case "difficulty.easy.qBonus": DIFFICULTY.easy.qBonus = value; return true;
      case "difficulty.normal.qBonus": DIFFICULTY.normal.qBonus = value; return true;
      case "difficulty.hard.qBonus": DIFFICULTY.hard.qBonus = value; return true;
      case "hazard.frost": HAZARD_DENSITY.frost = value; return true;
      case "hazard.lava": HAZARD_DENSITY.lava = value; return true;
      case "enemy.hpMul": ENEMY_HP_MUL = value; return true;
      case "combat.missStep": MISS_STEP = value; return true;
      case "combat.missCap": MISS_CAP = value; return true;
      case "guard.hpMul": GUARD.hpMul = value; return true;
      case "guard.dmgMul": GUARD.dmgMul = value; return true;
      case "learn.reviewChance": LEARN.reviewChance = value; return true;
      case "learn.floorTopic": LEARN.floorTopicChance = value; return true;
      case "hub.deathGoldShare": HUB_DEATH_SHARE = value; return true;
      case "hub.amuletPrice": HUB_AMULET_PRICE = value; return true;
      case "hub.amuletFindChance": HUB_AMULET_FIND = value; return true;
      case "hub.amuletMax": HUB_AMULET_MAX = Math.max(0, Math.floor(value)); return true;
      case "village.view": VILLAGE_VIEW_RADIUS = value; return true;
      case "combat.skipShare": SKIP_HP_SHARE = value; return true;
      case "enemy.hpStart": HP_START = value; return true;
      case "endless.depthDmg": ENDLESS_DEPTH_DMG = value; return true;
      case "deep.from": DEEP_FROM = value; return true;
      case "deep.hpMul": DEEP_HP_MUL = value; return true;
      case "deep.dmgMul": DEEP_DMG_MUL = value; return true;
      case "hero.hpStep": HERO_STEPS.hp = value; return true;
      case "hero.dmgStep": HERO_STEPS.dmg = value; return true;
      case "hero.lootStep": HERO_STEPS.loot = value; return true;
      case "hero.armorStep": HERO_STEPS.armor = value; return true;
      case "hero.hpPrice": HERO_PRICES.hp = value; return true;
      case "hero.dmgPrice": HERO_PRICES.dmg = value; return true;
      case "hero.potionsPrice": HERO_PRICES.potions = value; return true;
      case "hero.lootPrice": HERO_PRICES.loot = value; return true;
      case "hero.armorPrice": HERO_PRICES.armor = value; return true;
      case "hero.priceStep": HERO_PRICE_STEP = value; return true;
      case "village.wellHp": VILLAGE_WELL_HP = value; return true;
      case "village.barnBonus": VILLAGE_BARN_BONUS = value; return true;
      case "village.costMul": VILLAGE_COST_MUL = value; return true;
      case "loot.oreChance": LOOT_ORE_CHANCE = value; return true;
      case "loot.woodChance": LOOT_WOOD_CHANCE = value; return true;
      case "loot.shardChance": LOOT_SHARD_CHANCE = value; return true;
      case "quest.gold": QUEST_GOLD = value; return true;
      case "quest.material": QUEST_MATERIAL = value; return true;
      case "combat.braceCut": BRACE_CUT = value; return true;
      case "combat.fleeHit": FLEE_HIT = value; return true;
      case "ability.charges": ABILITY_CHARGES = Math.max(0, Math.floor(value)); return true;
      case "ability.strikeMul": ABILITY_STRIKE_MUL = value; return true;
      case "ability.breath": ABILITY_BREATH = value; return true;
      case "rest.heal": REST_HEAL = value; return true;
      case "rest.perRun": REST_PER_RUN = Math.max(0, Math.floor(value)); return true;
      default: return false;
    }
  }

  // Текущие значения всех кнобов — то, что реально действует в игре сейчас.
  function balanceSnapshot() {
    const out = {};
    BALANCE_KEYS.forEach((key) => { out[key] = balanceValue(key); });
    return out;
  }

  function balanceValue(key) {
    switch (key) {
      case "enemy.hpPerFloor": return HP_PER_FLOOR;
      case "enemy.dmgFlat": return ENEMY_DMG_PER_FLOOR;
      case "enemy.dmgPct": return ENEMY_DMG_RAMP;
      case "elite.hpMul": return ELITE.hpMul;
      case "elite.dmgMul": return ELITE.dmgMul;
      case "elite.chanceBase": return ELITE.chanceBase;
      case "elite.chanceStep": return ELITE.chanceStep;
      case "elite.gold": return ELITE.gold;
      case "squad.from": return SQUAD.from;
      case "squad.chance": return SQUAD.chance;
      case "squad.maxSize": return SQUAD.maxSize;
      case "combat.aggro": return AGGRO_RADIUS;
      case "combat.view": return VIEW_RADIUS;
      case "combat.darkView": return DARK_VIEW_RADIUS;
      case "combat.hazardDmg": return HAZARD_DMG_BASE;
      case "combat.rangedDmg": return RANGED.dmgScale;
      case "combat.hintCap": return HINT_CAP;
      case "combat.streakStep": return STREAK_STEP;
      case "combat.streakCap": return STREAK_CAP;
      case "player.levelDmg": return LEVEL_DMG;
      case "player.levelHp": return LEVEL_HP;
      case "player.xpBase": return XP_BASE;
      case "econ.goldBase": return ECON.goldBase;
      case "econ.goldDepth": return ECON.goldDepth;
      case "econ.bossGold": return ECON.bossGold;
      case "econ.priceDepth": return ECON.priceDepth;
      case "econ.sellRate": return ECON.sellRate;
      case "econ.shopMarkup": return SHOP_MARKUP;
      case "econ.forgeBase": return ECON.forgeBase;
      case "econ.forgeStep": return ECON.forgeStep;
      case "econ.forgeDepth": return ECON.forgeDepth;
      case "econ.forgeAtk": return ECON.forgeAtk;
      case "econ.forgeDef": return ECON.forgeDef;
      case "econ.forgeHp": return ECON.forgeHp;
      case "difficulty.easy.enemyScale": return DIFFICULTY.easy.enemyScale;
      case "difficulty.normal.enemyScale": return DIFFICULTY.normal.enemyScale;
      case "difficulty.hard.enemyScale": return DIFFICULTY.hard.enemyScale;
      case "difficulty.easy.qBonus": return DIFFICULTY.easy.qBonus;
      case "difficulty.normal.qBonus": return DIFFICULTY.normal.qBonus;
      case "difficulty.hard.qBonus": return DIFFICULTY.hard.qBonus;
      case "hazard.frost": return HAZARD_DENSITY.frost;
      case "hazard.lava": return HAZARD_DENSITY.lava;
      case "enemy.hpMul": return ENEMY_HP_MUL;
      case "combat.missStep": return MISS_STEP;
      case "combat.missCap": return MISS_CAP;
      case "guard.hpMul": return GUARD.hpMul;
      case "guard.dmgMul": return GUARD.dmgMul;
      case "learn.reviewChance": return LEARN.reviewChance;
      case "learn.floorTopic": return LEARN.floorTopicChance;
      case "hub.deathGoldShare": return HUB_DEATH_SHARE;
      case "hub.amuletPrice": return HUB_AMULET_PRICE;
      case "hub.amuletFindChance": return HUB_AMULET_FIND;
      case "hub.amuletMax": return HUB_AMULET_MAX;
      case "village.view": return VILLAGE_VIEW_RADIUS;
      case "combat.skipShare": return SKIP_HP_SHARE;
      case "enemy.hpStart": return HP_START;
      case "endless.depthDmg": return ENDLESS_DEPTH_DMG;
      case "deep.from": return DEEP_FROM;
      case "deep.hpMul": return DEEP_HP_MUL;
      case "deep.dmgMul": return DEEP_DMG_MUL;
      case "hero.hpStep": return HERO_STEPS.hp;
      case "hero.dmgStep": return HERO_STEPS.dmg;
      case "hero.lootStep": return HERO_STEPS.loot;
      case "hero.armorStep": return HERO_STEPS.armor;
      case "hero.hpPrice": return HERO_PRICES.hp;
      case "hero.dmgPrice": return HERO_PRICES.dmg;
      case "hero.potionsPrice": return HERO_PRICES.potions;
      case "hero.lootPrice": return HERO_PRICES.loot;
      case "hero.armorPrice": return HERO_PRICES.armor;
      case "hero.priceStep": return HERO_PRICE_STEP;
      case "village.wellHp": return VILLAGE_WELL_HP;
      case "village.barnBonus": return VILLAGE_BARN_BONUS;
      case "village.costMul": return VILLAGE_COST_MUL;
      case "loot.oreChance": return LOOT_ORE_CHANCE;
      case "loot.woodChance": return LOOT_WOOD_CHANCE;
      case "loot.shardChance": return LOOT_SHARD_CHANCE;
      case "quest.gold": return QUEST_GOLD;
      case "quest.material": return QUEST_MATERIAL;
      case "combat.braceCut": return BRACE_CUT;
      case "combat.fleeHit": return FLEE_HIT;
      case "ability.charges": return ABILITY_CHARGES;
      case "ability.strikeMul": return ABILITY_STRIKE_MUL;
      case "ability.breath": return ABILITY_BREATH;
      case "rest.heal": return REST_HEAL;
      case "rest.perRun": return REST_PER_RUN;
      default: return null;
    }
  }

  // ---------- Содержимое игры из админ-панели ----------
  // Кроме чисел баланса учитель правит сами данные: имя и описание предмета,
  // его урон и защиту, здоровье и урон вида врагов, размеры этажа и пул
  // монстров на нём. Ключ всегда имеет вид «таблица.имя.поле»
  // (item.steel_sword.atk, enemy.rat.hp, floor.1.pool), поэтому разбор один
  // на все три таблицы. Уже стоящие на карте монстры хранят свои hp и dmg,
  // поэтому смена вида влияет на следующих — как и у чисел баланса.
  function contentItemById(id) {
    for (let i = 0; i < ITEM_POOL.length; i += 1) {
      if (ITEM_POOL[i].id === id) return ITEM_POOL[i];
    }
    return null;
  }

  function contentEnemyByKey(key) {
    for (let i = 0; i < ENEMY_TYPES.length; i += 1) {
      if (ENEMY_TYPES[i].key === key) return ENEMY_TYPES[i];
    }
    return null;
  }

  function contentFloorByNumber(number) {
    const index = parseInt(number, 10) - 1;
    if (!(index >= 0 && index < FLOORS.length)) return null;
    return FLOORS[index];
  }

  // Пул этажа — строка «rat, slime». Неизвестные виды молча выкидываем:
  // опечатка учителя не должна оставить этаж без монстров вообще.
  function contentParsePool(text) {
    const keys = String(text).split(",").map((s) => s.trim()).filter(Boolean);
    const known = keys.filter((k) => !!contentEnemyByKey(k));
    return known;
  }

  // Вопросы и задания живут в static/questions.js и static/code-tasks.js.
  // Их тоже правят из админки, но ключ у них свой: «q.<номер>.<поле>» и
  // «t.<имя>.<поле>». Имена полей у задания различаются: в панели разбор
  // называется explain, а в данных это explanation; верный вариант — right
  // против answer. Таблица ниже переводит одно в другое.
  const TASK_FIELD_ALIAS = { explain: "explanation", right: "answer" };
  // У вопроса то же расхождение: в панели поле зовётся explain и right, а в
  // данных questions.js — explanation и answer.
  const QUESTION_FIELD_ALIAS = { explain: "explanation", right: "answer" };

  // Четыре таблицы заданий: написать код, переписать код, вставить пропуск,
  // найти ошибку. Собираем их списком, чтобы правка искала задание по всем.
  function contentTaskTables() {
    return [CODE_TASKS, COPY_TASKS, FILL_TASKS, ERROR_TASKS];
  }

  function contentQuestionById(id) {
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      if (String(QUESTIONS[i].id) === String(id)) return QUESTIONS[i];
    }
    return null;
  }

  function contentTaskById(id) {
    const tables = contentTaskTables();
    for (let t = 0; t < tables.length; t += 1) {
      const list = tables[t];
      for (let i = 0; i < list.length; i += 1) {
        if (String(list[i].id) === String(id)) return list[i];
      }
    }
    return null;
  }

  function contentTopicOk(key) {
    return typeof TOPICS !== "undefined" && !!TOPICS[key];
  }

  function applyQuestionValue(parts, value, isText) {
    const question = contentQuestionById(parts[1]);
    if (!question) return false;
    const field = QUESTION_FIELD_ALIAS[parts[2]] || parts[2];
    if (field === "id" || field === "options") return false;
    if (field === "text" || field === "explanation" || field === "topic") {
      if (!isText) return false;
      if (field === "topic" && !contentTopicOk(value)) return false;
      question[field] = value;
      return true;
    }
    if (field.indexOf("a") === 0 && field.length === 2) {
      const index = parseInt(field.slice(1), 10);
      if (!isText || !(index >= 0 && index < 4)) return false;
      if (!Array.isArray(question.options) || question.options.length <= index) return false;
      question.options[index] = value;
      return true;
    }
    if (field === "answer" || field === "level") {
      if (isText) return false;
      if (field === "answer") {
        if (!Array.isArray(question.options) || value >= question.options.length) return false;
      }
      question[field] = value;
      return true;
    }
    return false;
  }

  function applyTaskValue(parts, value, isText) {
    const task = contentTaskById(parts[1]);
    if (!task) return false;
    const field = TASK_FIELD_ALIAS[parts[2]] || parts[2];
    // id и tests — не текст для правки: первый связывает задание с банком,
    // второй содержит список проверок кода, его правка сломала бы проверку.
    if (field === "id" || field === "tests") return false;
    if (!(field in task)) return false;
    if (field === "answer" || field === "level") {
      if (isText) return false;
      if (field === "answer" && Array.isArray(task.options) && value >= task.options.length) {
        return false;
      }
      task[field] = value;
      return true;
    }
    if (field === "topic") {
      if (!isText || !contentTopicOk(value)) return false;
      task[field] = value;
      return true;
    }
    if (isText) {
      task[field] = value;
      return true;
    }
    return false;
  }

  function applyContentValue(key, value) {
    const parts = String(key).split(".");
    if (parts.length !== 3 && !(parts[0] === "item" && parts.length === 4)) return false;
    const field = parts.length === 4 ? parts[2] + "." + parts[3] : parts[2];
    const isText = typeof value === "string";
    if (!isText && (typeof value !== "number" || !isFinite(value))) return false;

    if (parts[0] === "q" && parts.length === 3) {
      return applyQuestionValue(parts, value, isText);
    }

    if (parts[0] === "t" && parts.length === 3) {
      return applyTaskValue(parts, value, isText);
    }

    if (parts[0] === "item" && parts.length >= 3) {
      const item = contentItemById(parts[1]);
      if (!item) return false;
      if (field === "name" || field === "desc") {
        if (!isText) return false;
        item[field] = value;
        return true;
      }
      if (field === "atk" || field === "def" || field === "hp") {
        if (isText) return false;
        item[field] = value;
        return true;
      }
      if (field.indexOf("eff.") === 0) {
        if (isText || !item.effect) return false;
        const effField = field.slice(4);
        if (!(effField in item.effect)) return false;
        item.effect[effField] = value;
        return true;
      }
      return false;
    }

    if (parts[0] === "enemy" && parts.length === 3) {
      const type = contentEnemyByKey(parts[1]);
      if (!type) return false;
      if (field === "name") {
        if (!isText) return false;
        type.name = value;
        return true;
      }
      if (field === "hp" || field === "dmg" || field === "range") {
        if (isText) return false;
        type[field] = value;
        return true;
      }
      return false;
    }

    if (parts[0] === "floor" && parts.length === 3) {
      const floor = contentFloorByNumber(parts[1]);
      if (!floor) return false;
      if (field === "name") {
        if (!isText) return false;
        floor.name = value;
        return true;
      }
      if (field === "pool") {
        if (!isText) return false;
        const pool = contentParsePool(value);
        if (!pool.length) return false;
        floor.pool = pool;
        return true;
      }
      if (field === "count" || field === "w" || field === "h" || field === "qmin" || field === "qmax") {
        if (isText) return false;
        floor[field] = value;
        return true;
      }
      return false;
    }

    return false;
  }

  // Текущее содержимое всех правимых таблиц — то же самое, что видит игра.
  // Нужно проверкам: они сверяют, что правка учителя действительно доехала.
  function contentSnapshot() {
    const out = {};
    ITEM_POOL.forEach((item) => {
      out["item." + item.id + ".name"] = item.name;
      if (item.desc) out["item." + item.id + ".desc"] = item.desc;
      ["atk", "def", "hp"].forEach((f) => {
        if (typeof item[f] === "number") out["item." + item.id + "." + f] = item[f];
      });
      if (item.effect) {
        Object.keys(item.effect).forEach((f) => {
          if (typeof item.effect[f] === "number") {
            out["item." + item.id + ".eff." + f] = item.effect[f];
          }
        });
      }
    });
    ENEMY_TYPES.forEach((type) => {
      out["enemy." + type.key + ".name"] = type.name;
      ["hp", "dmg", "range"].forEach((f) => {
        if (typeof type[f] === "number") out["enemy." + type.key + "." + f] = type[f];
      });
    });
    FLOORS.forEach((floor, index) => {
      const prefix = "floor." + (index + 1) + ".";
      out[prefix + "name"] = floor.name;
      out[prefix + "pool"] = floor.pool.join(", ");
      ["count", "w", "h", "qmin", "qmax"].forEach((f) => {
        if (typeof floor[f] === "number") out[prefix + f] = floor[f];
      });
    });
    (typeof QUESTIONS !== "undefined" ? QUESTIONS : []).forEach((q) => {
      const prefix = "q." + q.id + ".";
      out[prefix + "text"] = q.text;
      (q.options || []).forEach((opt, i) => { out[prefix + "a" + i] = opt; });
      ["answer", "level", "topic", "explanation"].forEach((f) => {
        if (q[f] === undefined) return;
        const name = f === "answer" ? "right" : f === "explanation" ? "explain" : f;
        out[prefix + name] = q[f];
      });
    });
    contentTaskTables().forEach((list) => {
      list.forEach((task) => {
        const prefix = "t." + task.id + ".";
        Object.keys(task).forEach((f) => {
          if (f === "id" || f === "tests") return;
          const name = f === "answer" ? "right" : f === "explanation" ? "explain" : f;
          const value = task[f];
          if (typeof value === "string" || typeof value === "number") {
            out[prefix + name] = value;
          }
        });
      });
    });
    return out;
  }

  function applyBalanceValues(values) {
    if (!values || typeof values !== "object") return 0;
    let applied = 0;
    Object.keys(values).forEach((key) => {
      if (applyBalanceValue(key, values[key])) { applied += 1; return; }
      if (applyContentValue(key, values[key])) applied += 1;
    });
    if (applied && G.player) {
      recalcStats();
      if (G.player.hp > G.player.maxHp) G.player.hp = G.player.maxHp;
      if (G.running) {
        renderInventory();
        updateHud();
      }
    }
    return applied;
  }

  function loadServerBalance() {
    // Публичная сборка живёт на своих числах: сервера баланса нет.
    if (typeof window !== "undefined" && window.__PYQUIZ_WEB) return Promise.resolve(0);
    if (typeof fetch !== "function") return Promise.resolve(0);
    try {
      return fetch("/api/game-config", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          G.codeCheck = !(data && data.features && data.features.code === false);
          return applyBalanceValues(data && data.values);
        })
        .catch(() => 0);
    } catch (err) {
      // Игра открыта без сервера (файлом) — играем на своих числах.
      return Promise.resolve(0);
    }
  }

  // Меню не знает внутренностей игры: ему достаточно места, этажа и того,
  // есть ли что продолжать. resume — та же загрузка сейва, что у стража;
  // newRun открывает окно стража с выбором сложности и режима.
  if (typeof window !== "undefined") {
    window.PyGameMenuAPI = {
      status: function () {
        const paused = pausedRun();
        const place = G.place || (G.running ? "dungeon" : "village");
        const floor = (paused ? (paused.floorIndex || 0) : (G.floorIndex || 0)) + 1;
        const gold = paused && paused.player ? (paused.player.gold || 0)
          : (G.player ? (G.player.gold || 0) : 0);
        return {
          paused: !!paused && !paused.over,
          running: !!G.running,
          battle: !!G.battle,
          place: place,
          floor: floor,
          gold: gold,
          villageSave: !!readVillageSave()
        };
      },
      resume: loadGame,
      loadVillage: loadVillage,
      captureSnapshot: captureSnapshot,
      exportLegacy: exportLegacy,
      loadSnapshot: loadSnapshot,
      save: function () {
        if (G.battle) return false;
        if (G.place === "village") return saveVillage();
        if (G.place !== "dungeon" || !G.running) return false;
        saveGame();
        return true;
      },
      village: function () {
        if (G.place !== "dungeon" || G.battle) return false;
        return returnToVillage();
      },
      newRun: function () {
        // Из боя в «Новую игру» не уходят: иначе это бесплатный побег.
        if (G.battle) return false;
        if (G.place === "dungeon") {
          if (!returnToVillage()) return false;
        } else {
          enterVillage(null);
        }
        // Окно стража открывается только по E у стража. «Новая игра» просто
        // приводит в деревню и подсвечивает вход; автоматический спуск
        // отнимал у игрока выбор сложности и режима.
        setMsg("Новый поход: поговори со стражем у входа в подземелье.");
        return true;
      },
      openGuard: function () {
        // Отдельный вызов для туториала и смоук-проверок: окно стража
        // открывается не стартом игры, а действием у стража.
        if (G.battle) return false;
        openEntrance();
        return true;
      },
      move: function (dx, dy) {
        move(Number(dx) || 0, Number(dy) || 0);
      },
      leave: leave
    };
  }

  // Публичной сборке нужен только вход из стартового экрана; серверная
  // версия этот объект не создаёт.
  if (typeof window !== "undefined" && window.__PYQUIZ_WEB) {
    window.__PYQUIZ_WEB_API = { resume: loadGame, begin: enterDungeon };
  }
})();
