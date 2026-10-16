// Бот-игра: настоящий код игры проигрывается без браузера.
//
// Заглушки DOM и доступ к внутренностям game.js берутся из tools/game_harness.js —
// тот же самый, на котором работает verify_dungeon.py. Значит, бот и проверка
// гоняют один и тот же код, а проверка остаётся честной.
//
// Запуск: node play_dungeon.js [--games 3] [--skill 0.8] [--seed 1] [--mode endless]
//                               [--difficulty easy|normal|hard]
//                               [--balance '{"enemy.hpMul": 2.5}'] [--no-forge] [--skip 0.2]
//
// --balance принимает числа в том же виде, что и админ-панель /admin: так
// настройку можно проверить ботом, прежде чем менять её для класса.
//
// Сложность по умолчанию — «Обычный», как в меню игры. Серия из нескольких
// партий заканчивается сводкой: смерти, самое низкое здоровье, опасные бои,
// число заданий — по ней видно, насколько игра трудна при такой доле верных
// ответов (--skill).
//
// Партия воспроизводится по зерну: на неё же подменяется Math.random игры.
// Странная партия печатает своё зерно, а повторить её с журналом ходов —
// node play_dungeon.js --seed <зерно> --games 1 --trace
//
// Бот играет по правилам:
//   * задания с вариантами — по-настоящему (за правильный ответ бьёт сильнее);
//   * код на переписывание — вставляет эталон, то есть «решает задачу»;
//   * задачу «напиши функцию» сервер в боте не проверяет: бот решает её
//     с той же вероятностью --skill, что и остальные задания;
//   * по лестнице вниз идёт, идёт в бой, открывает сундуки и покупает в лавке;
//   * надевает вещи, которые сильнее надетых, — из сундука, с врага, из лавки;
//   * золото сверх запаса на зелья несёт в кузницу (--no-forge — не несёт);
//   * умирает и жмёт «Начать этаж заново», если не хватает здоровья.
//
// Печатает разбор каждой партии и падает с кодом 1, если игра хоть раз
// выбросила исключение или зависла в цикле.

// Варианты вопросов (variants.js) генерируются уже при загрузке игры, из
// Math.random. Постоянное зерно здесь — чтобы колода вопросов была одной и
// той же в любом запуске, иначе партию по зерну не повторить.
Math.random = makeRng(0x2545f491);
const H = require("./tools/game_harness.js");
const API = H.API;
const G = H.G;

// Таймеры игры (затухание узлов карты, всплывашки, автосохранение) в боте
// не срабатывают: партии идут без пауз. Настоящие таймеры при этом копились
// до конца прогона, каждый держал свой узел, и сотни партий съедали
// гигабайты. Бот копит их сам и выполняет между партиями, когда партия уже
// окончена, — на ход партии это не влияет.
const pendingTimers = new Map();
let timerSeq = 0;
globalThis.setTimeout = (fn, ms, ...args) => {
  timerSeq += 1;
  if (typeof fn === "function") pendingTimers.set(timerSeq, () => fn(...args));
  return timerSeq;
};
globalThis.clearTimeout = (id) => { pendingTimers.delete(id); };
function flushTimers() {
  const due = Array.from(pendingTimers.values());
  pendingTimers.clear();
  due.forEach((run) => {
    try { run(); } catch (e) { /* партия окончена: сбой отложенной отрисовки не важен */ }
  });
  // То, что таймеры поставили заново (кадры анимации), уже не нужно.
  pendingTimers.clear();
}

function parseArgs(argv) {
  const out = { games: 1, skill: 0.8, seed: null, mode: "dungeon", trace: false, turns: 4000,
    difficulty: "normal", forge: true, amulets: 1, bank: 600, skip: 0, campaign: false,
    maxed: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--games") out.games = Number(argv[++i]);
    else if (a === "--skill") out.skill = Number(argv[++i]);
    else if (a === "--seed") out.seed = Number(argv[++i]);
    else if (a === "--mode") out.mode = argv[++i];
    else if (a === "--turns") out.turns = Number(argv[++i]);
    else if (a === "--difficulty") out.difficulty = argv[++i];
    else if (a === "--balance") out.balance = JSON.parse(argv[++i]);
    else if (a === "--trace") out.trace = true;
    else if (a === "--no-forge") out.forge = false;
    // Амулеты возврата и банк деревни: с ними бот проверяет второй шанс и
    // смерть с потерей похода. --amulets 0 возвращает поведение без амулетов.
    else if (a === "--amulets") out.amulets = Number(argv[++i]);
    // Доля вопросов, которые бот пропускает вместо ответа: так проверяется
    // цена пропуска на длинной дистанции, а не в одной партии.
    else if (a === "--skip") out.skip = Number(argv[++i]);
    // Кампания: серия походов ОДНИМ героем. Профиль между походами не
    // сбрасывается, и бот сам тратит найденное — восстанавливает деревню и
    // покупает улучшения. Так проверяется главное обещание игры: первый поход
    // обречён, победа приходит за несколько заходов.
    else if (a === "--campaign") out.campaign = true;
    // --maxed: профиль сразу прокачан до предела (все постройки и улучшения).
    // Так проверяется конец игры: побеждает ли тот, кто дошёл до предела.
    else if (a === "--maxed") out.maxed = true;
    else if (a === "--bank") out.bank = Number(argv[++i]);
    else throw new Error("не понял аргумент: " + a);
  }
  if (!Number.isFinite(out.games) || out.games < 1) throw new Error("--games должен быть >= 1");
  if (!Number.isFinite(out.amulets) || out.amulets < 0) throw new Error("--amulets должен быть >= 0");
  if (!Number.isFinite(out.bank) || out.bank < 0) throw new Error("--bank должен быть >= 0");
  if (!(out.skip >= 0 && out.skip <= 1)) throw new Error("--skip должен быть 0..1");
  if (!(out.skill >= 0 && out.skill <= 1)) throw new Error("--skill должен быть 0..1");
  if (out.mode !== "dungeon" && out.mode !== "endless") throw new Error("--mode: dungeon или endless");
  if (["easy", "normal", "hard"].indexOf(out.difficulty) < 0) {
    throw new Error("--difficulty: easy, normal или hard");
  }
  if (out.balance !== undefined && (!out.balance || typeof out.balance !== "object" || Array.isArray(out.balance))) {
    throw new Error("--balance: нужен объект JSON, например '{\"enemy.hpMul\": 2.5}'");
  }
  return out;
}

// Детерминированный генератор: нужен, чтобы случайный сбой можно было
// воспроизвести по номеру партии.
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  const rng = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  rng.int = (n) => Math.floor(rng() * n);
  return rng;
}

function openOverlay(id) {
  const node = H.el(id);
  return !!node && !node.classList.contains("hidden");
}

// ---------------- выбор хода ----------------

// Куда идти: к лестнице вниз, но не в клетку врага — с ним разберёмся в бою.
function stepTowardStairs(rng, avoid) {
  const goal = G.stairsDown;
  if (!goal) return null;
  const from = G.playerPos;
  const best = [];
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const x = from.x + dx;
    const y = from.y + dy;
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
    if (G.map.grid[y][x] !== 1) continue;
    const enemy = G.enemies.find((e) => e.x === x && e.y === y);
    if (enemy) {
      // На врага идём только когда идти больше некуда.
      if (avoid) continue;
      return { dx: dx, dy: dy, enemy: enemy };
    }
    if ((G.traders || []).some((t) => t.x === x && t.y === y)) continue;
    best.push({ dx: dx, dy: dy, d: Math.abs(x - goal.x) + Math.abs(y - goal.y), r: rng() });
  }
  if (!best.length) return null;
  best.sort((a, b) => a.d - b.d || a.r - b.r);
  return best[0];
}

// Ответ на задание с вариантами. skill — доля правильных ответов.
function answerChallenge(skill, rng) {
  const b = G.battle;
  const c = b.challenge;
  const view = c.view || (c.question || c.task);
  const right = view.answer;
  if (rng() < skill) return right;
  if (view.options.length < 2) return right;
  let wrong = right;
  while (wrong === right) wrong = rng.int(view.options.length);
  return wrong;
}

// Код для задания на переписывание: эталон или пустая строка (ошибка).
function codeAnswer(skill, rng) {
  return rng() < skill ? G.battle.challenge.task.code : "";
}

// ---------------- один ход ----------------

function playBattleStep(skill, rng, state) {
  const b = G.battle;
  if (!b) return "no-battle";
  if (b.phase !== "question") {
    API.continueBattle();
    return "continue";
  }
  const c = b.challenge;
  if (!c) return "no-challenge";
  // Практика («примени»): считаем, сколько заданий было и сколько из них
  // разных — по тому, что видит ученик: коду, а у «напиши функцию» — по
  // условию. Повтор того же задания за поход ученик заучивает, а не решает.
  if (c.type !== "mc" && c.task && state) {
    const key = c.type + ":" + (c.task.code || c.task.task + "|" + c.task.starter);
    state.practiceSeen.set(key, (state.practiceSeen.get(key) || 0) + 1);
  }
  // Иногда бот не знает ответа и пропускает вопрос — платит здоровьем.
  // Пропуск не отвечает за него: вопрос уходит в пробелы, как у ученика.
  if (state && (state.skipShare || 0) > 0 && rng() < state.skipShare &&
      c.type !== "copy" && c.type !== "code" &&
      G.player.hp > API.skipCost()) {
    API.skipQuestion();
    if (state.skips != null) state.skips += 1;
    return "skip";
  }
  if (c.type === "copy") {
    b.challenge.code = codeAnswer(skill, rng);
    API.checkCopy();
    return "copy";
  }
  if (c.type === "code") {
    // Задачу «напиши функцию» проверяет сервер, а его ответ приходит
    // асинхронно: бот ходит без пауз и ждал бы его вечно. Отвечаем за
    // сервер сами — тем же путём, что и настоящий ответ (applyCodeResult):
    // решено с вероятностью skill, иначе ни один тест не пройден.
    const total = Math.max(1, (c.task.tests || []).length);
    const solved = rng() < skill;
    API.applyCodeResult({ ok: true, passed: solved ? total : 0, total: total }, b);
    return "code";
  }
  API.answerMC(answerChallenge(skill, rng));
  return "answer";
}

// Сила вещи на взгляд бота: урон ценнее всего, защита и здоровье следом.
// Особый эффект добавляет немного — из двух равных по числам берём с эффектом.
function gearPower(item) {
  if (!item) return 0;
  return (item.atk || 0) * 3 + (item.def || 0) * 4 + (item.hp || 0) * 0.5 + (item.effect ? 4 : 0);
}

// Насколько вещь сильнее надетой в тот же слот (0 и меньше — не нужна).
function gearGain(item) {
  if (!item || !item.slot || item.slot === "potion") return 0;
  return gearPower(item) - gearPower(G.equipment[item.slot]);
}

// Надеть из сумки всё, что сильнее надетого: добыча с сундуков и врагов
// иначе так и лежала бы в сумке. Каждая замена строго усиливает героя,
// поэтому цикл конечен.
function equipBetter() {
  let changed = false;
  for (;;) {
    let best = -1;
    let bestGain = 0;
    G.inventory.forEach((it, i) => {
      const g = gearGain(it);
      if (g > bestGain) { best = i; bestGain = g; }
    });
    if (best < 0) return changed;
    API.equipItem(best);
    changed = true;
  }
}

// Покупки в лавке. Номер товара — это место в shopOffers(), том же списке,
// по которому лавка рисуется: зелий на глубине больше, поэтому номера
// снаряжения от этажа к этажу сдвигаются.
// Снаряжение — то, что сильнее надетого, сразу «Купить и надеть». Зелья
// лечения — до трёх в сумке, самое сильное из тех, на что хватает золота.
function shopRound() {
  let spent = 0;
  const offers = API.shopOffers();
  offers.forEach((o, i) => {
    if (o.kind !== "gear" || gearGain(o.item) <= 0 || G.player.gold < o.price) return;
    API.buyItem(i, true);
    spent += 1;
  });
  const potions = offers
    .map((o, i) => ({ o: o, i: i }))
    .filter((p) => p.o.kind === "potion" && p.o.item.heal > 0)
    .sort((a, b) => b.o.item.heal - a.o.item.heal || a.o.price - b.o.price);
  while (API.countPotions() < 3) {
    const pick = potions.find((p) => G.player.gold >= p.o.price);
    if (!pick) break;
    API.buyItem(pick.i, false);
    spent += 1;
  }
  return spent > 0;
}

// Кузница открыта всегда, кроме боя. Ученик, у которого скопилось золото,
// несёт его туда — и бот тоже: всё сверх запаса на зелья уходит в
// улучшения. Дорожку берём самую дешёвую, так уровни растут ровно.
// Без этого бот копил к концу похода тысячи золота, а сила, которую они
// покупают, в замеры длины похода не попадала.
function forgeRound(state) {
  if (!state.forge) return 0;
  const reserve = 60 + 30 * G.floorIndex;
  const keys = API.FORGE_TRACKS.map((t) => t.key);
  let bought = 0;
  for (;;) {
    const key = keys.slice().sort((a, b) => API.forgeCost(a) - API.forgeCost(b))[0];
    if (G.player.gold - API.forgeCost(key) < reserve) return bought;
    API.buyForge(key);
    bought += 1;
  }
}

// Есть ли смысл заходить в лавку: зелий меньше трёх или в ней лежит вещь
// сильнее надетой, и на неё хватает золота.
function shopWorth() {
  if (API.countPotions() < 3) return true;
  return API.shopOffers().some((o) =>
    o.kind === "gear" && gearGain(o.item) > 0 && G.player.gold >= o.price);
}

// Зелья в бою и на подходе к врагу: пьём, когда ранены.
function drinkIfHurt() {
  if (G.player.hp >= G.player.maxHp * 0.7) return false;
  const idx = G.inventory.findIndex((i) => i.slot === "potion");
  if (idx < 0) return false;
  const before = G.player.hp;
  API.usePotion(idx);
  return G.player.hp > before;
}

// Один ход героя вне боя. Возвращает описание сделанного.
function playStep(skill, rng, state) {
  if (G.battle) return playBattleStep(skill, rng, state);

  // Окно благословения висит поверх карты и блокирует все действия — и
  // ожидание тоже: в цепях под этим окном цепь не слабела никогда.
  // Берём «Каменный дар»: он даёт максимум здоровья и лечит полностью.
  // «Тёмная сделка» боту не подходит — враги бьют на 25% сильнее.
  if (openOverlay("blessing-overlay")) {
    API.chooseBlessing("blessing");
    return "blessing";
  }

  // Планка с подсказкой этажа — просто текст, её надо закрыть.
  if (openOverlay("floor-arrival")) {
    API.hideFloorArrival();
    return "arrival";
  }

  // Лавка уже открыта — покупаем, что можем, и закрываем. Раньше эта
  // проверка стояла после «торговец рядом», и в цепях бот открывал лавку
  // снова и снова, ни разу не дойдя до покупки.
  if (openOverlay("shop-overlay")) {
    const bought = shopRound();
    API.closeShop();
    return bought ? "shop-buy" : "shop-close";
  }

  // Цепь держит героя на клетке: ни шагнуть, ни уйти по лестнице. До
  // сундука и торговца рядом дотянуться можно — этим и пользуемся, а
  // остальное время пережидаем: цепь рвётся сама за несколько ожиданий.
  if (G.player.snared) {
    const t = API.interactTarget();
    if (t && t.kind === "chest") { API.doInteract(); return "chest"; }
    // К каждому торговцу — один раз: иначе бот в цепях только открывал бы
    // лавку, а ожидание, от которого цепь слабеет, не наступало бы.
    if (t && t.kind === "trader" && !state.shopsDone.has(t.obj && t.obj.uid)) {
      state.shopsDone.add(t.obj && t.obj.uid);
      if (G.player.gold >= 20 && shopWorth()) {
        API.openShop(true);
        return "shop-open";
      }
    }
    state.snared += 1;
    API.skipTurn();
    return "bound";
  }

  // Сундук под ногами или рядом — открыть, это бесплатный предмет.
  const near = API.interactTarget();
  if (near && near.kind === "chest") {
    const before = (G.treasures || []).length;
    API.doInteract();
    if ((G.treasures || []).length === before) state.chestStuck += 1;
    return "chest";
  }

  // Тайник под боком: ключ есть и дверь заперта — открываем. Уже открытый
  // тайник не трогаем: иначе бот «открывал» бы его каждый ход и вставал.
  if (near && near.kind === "vault" && near.obj.locked && (G.vaultKeys || 0) > 0) {
    if (API.openVault(near.obj)) state.vaultsOpened = (state.vaultsOpened || 0) + 1;
    return "vault";
  }

  // Жилы: материалы нужны деревне, а бот копит именно их.
  if (near && near.kind === "node") {
    API.doInteract();
    state.nodesMined = (state.nodesMined || 0) + 1;
    return "node";
  }

  // Костёр рядом, а герой ранен: привал лечит и возвращает заряды умения.
  // Тратим его не всегда, а когда здоровья меньше половины — привалов мало.
  if (near && near.kind === "camp" && (G.restsLeft || 0) > 0 &&
      G.player.hp < G.player.maxHp * 0.5) {
    API.doInteract();
    state.rests = (state.rests || 0) + 1;
    return "rest";
  }

  // В сумке есть вещь сильнее надетой (из сундука или с врага) — надеть.
  if (equipBetter()) return "equip";

  // Торговец рядом: заходим в лавку, только если есть чем платить и есть
  // что купить. Без этих проверок бот открывает и закрывает лавку каждый
  // ход и не двигается вообще.
  if (near && near.kind === "trader" && !state.shopsDone.has(near.obj && near.obj.uid)) {
    if (G.player.gold >= 20 && shopWorth()) {
      API.openShop(true);
      state.shopsDone.add(near.obj && near.obj.uid);
      return "shop-open";
    }
    state.shopsDone.add(near.obj && near.obj.uid);
  }

  // Лестница вниз. interactTarget() отдаёт kind "locked", когда выход
  // закрыт драконом, — тогда идём дальше воевать, а не спускаемся.
  if (near && near.kind === "down") {
    API.descend();
    return "descend";
  }
  // Лестница вверх боту не нужна: подъём возвращает на этаж, который мы
  // уже прошли, и на новом этаже мы стоим прямо рядом с ней — без
  // игнорирования бот бесконечно спускается-поднимается.

  // Подлечиться перед боем, если есть зелье и герой ранен.
  if (drinkIfHurt()) return "drink";

  if (forgeRound(state)) return "forge";

  // Выход закрыт стражем или драконом: идём к нему, иначе лестница не откроется.
  const goal = goalCell();

  // Бой с тем, кто стоит на клетке лестницы, начинается сам при шаге.
  // Если цель — сам дракон или страж лестницы, шаг на его клетку и есть
  // нападение. Раньше бот обходил врага на пути и тут: дракон в открытом зале
  // не нападает первым, и бот до конца партии кружил вокруг него.
  const bossGoal = !!goal && G.enemies.some((e) => (e.boss || e.guard) && e.x === goal.x && e.y === goal.y);
  const step = stepAlongPath(goal, bossGoal) || stepTowardStairs(rng, true);
  if (step) {
    API.move(step.dx, step.dy);
    return step.enemy ? "fight" : "move";
  }

  // Идти некуда — но враг рядом, значит надо его толкнуть.
  const fight = stepAlongPath(goal, true);
  if (fight) {
    API.move(fight.dx, fight.dy);
    return fight.enemy ? "fight" : "move";
  }

  const nearby = stepTowardStairs(rng, false);
  if (nearby) {
    API.move(nearby.dx, nearby.dy);
    return nearby.enemy ? "fight" : "move";
  }

  // Упёрлись: ни путь, ни жадный шаг ничего не дают. Пробуем случайный
  // свободный соседний ход — так бот выбирается из тупика и из
  // «зажатого врагами» клетки, а не стоит до конца партии.
  const tries = [];
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const x = G.playerPos.x + dx;
    const y = G.playerPos.y + dy;
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
    if (G.map.grid[y][x] !== 1) continue;
    tries.push({ dx, dy });
  }
  if (tries.length) {
    const t = tries[rng.int(tries.length)];
    API.move(t.dx, t.dy);
    return "wander";
  }

  API.skipTurn();
  return "wait";
}

// ---------------- партия ----------------

// Лестница вниз может быть закрыта драконом, а торговец — единственный
// источник золота. Поэтому цель бота: лестница, но если торговец рядом и
// золота хватает на покупку — заходим в лавку.

// Шаг к цели с учётом препятствий: берём первый клетку настоящего пути,
// а не «ближайшую соседнюю», иначе бот упирается в стену и топчется.
function stepAlongPath(goal, allowEnemy) {
  const path = API.findPath(G.playerPos, goal);
  if (!path || !path.length) return null;
  const first = path[0];
  const dx = first.x - G.playerPos.x;
  const dy = first.y - G.playerPos.y;
  const enemy = G.enemies.find((e) => e.x === first.x && e.y === first.y);
  if (enemy && !allowEnemy) return null;
  return { dx: dx, dy: dy, enemy: enemy || null };
}

// Куда идём. Обычная цель — лестница вниз. Если она закрыта стражем или
// драконом, идём к нему самому: пока он жив, лестница не откроется.
function goalCell() {
  const down = G.stairsDown;
  if (!down) return null;
  // Спуск запечатан: идти к лестнице некуда, и бот обходит этаж за сундуками —
  // именно так собирают материалы для деревни. Без этого он стоял у стены
  // до предела ходов, и «первый поход» выглядел как поломка бота.
  if (!API.canDescend()) {
    const chests = (G.treasures || []).filter((t) => API.findPath(G.playerPos, { x: t.x, y: t.y }));
    if (chests.length) return { x: chests[0].x, y: chests[0].y };
    // Жилы лежат в стороне от лестницы: пока спуск закрыт, бот обходит этаж
    // за материалами — так же, как это делает ученик.
    const nodes = (G.nodes || []).filter((n) => !n.taken &&
      API.findPath(G.playerPos, { x: n.x, y: n.y }));
    if (nodes.length) return { x: nodes[0].x, y: nodes[0].y };
    const trader = (G.traders || [])[0];
    if (trader) return { x: trader.x, y: trader.y };
    return null;
  }
  if (down.active !== false) return { x: down.x, y: down.y };
  const keeper = G.enemies.find((e) => e.boss || e.guard);
  if (keeper) return { x: keeper.x, y: keeper.y };
  return { x: down.x, y: down.y };
}

function startGame(opts, rng) {
  // Каждая партия — новый игрок: сохранения, профиль и счётчики прошлой
  // партии в общей заглушке localStorage иначе влияли бы на следующую.
  // В кампании всё наоборот: герой один, и профиль между походами живёт.
  if (!opts.campaign) globalThis.localStorage._d = {};
  // begin() берёт имя из сессии аккаунта (auth.js) и без входа не запускает
  // партию: move() и skipTurn() молча выходят, когда G.running = false.
  globalThis.localStorage.setItem("pyquiz_session_v1",
    JSON.stringify({ name: "Бот", role: "student", token: "" }));
  G.difficulty = opts.difficulty;
  // Оверлеи прячем СРАЗУ, до прохода по деревне: в заглушке classList пуст,
  // и непроявленное окно выглядит открытым — тогда walkTo и doInteract
  // решают, что поверх карты окно, и деревня проходится вхолостую.
  for (const id of ["end-overlay", "shop-overlay", "battle-overlay", "blessing-overlay", "forge-overlay",
    "entrance-overlay", "dialog-overlay"]) {
    H.el(id).classList.add("hidden");
  }
  // Деревня перед спуском: ученик приходит с накопленным золотом и тратит
  // часть на амулеты возврата и зелья. Без этого второй шанс не проверить.
  const prof = getProfile("Бот");
  if (!opts.campaign) {
    prof.wallet.gold = opts.bank;
    prof.hub.revive = 0;
    prof.hub.gear = [];
    putProfile("Бот", prof);
  }
  // Прокачанный до предела герой: проверяем, побеждает ли тот, кто прошёл
  // всю деревню. Без этого флага видно только путь, но не потолок.
  if (opts.maxed && !opts.campaign) {
    const p2 = getProfile("Бот");
    Object.keys(API.VILLAGE_CAPS).forEach((k) => { p2.village[k] = API.VILLAGE_CAPS[k]; });
    Object.keys(API.HERO_CAPS).forEach((k) => { p2.hero[k] = API.HERO_CAPS[k]; });
    p2.loot.seal = 1;
    if (p2.loot.keys.indexOf("seal") < 0) p2.loot.keys.push("seal");
    if (p2.loot.keys.indexOf("seal2") < 0) p2.loot.keys.push("seal2");
    p2.wallet.gold = 0;
    putProfile("Бот", p2);
  }
  // Деревня — настоящий уровень: бот идёт к торговцу, входит в дом, покупает
  // амулеты, выходит и у стража входа спускается. Так проверяется вся цепочка,
  // а не только begin().
  const village = villagePhase(opts);
  API.closeEntrance();
  API.closeDialog();
  if (G.place !== "dungeon") API.enterDungeon();
  // Страховка: если деревня почему-то не отдала спуск, начинаем поход напрямую,
  // чтобы партия не пропала.
  if (!G.running) API.begin();
  if (!G.running) throw new Error("не удалось начать партию");
  // Сложность в настоящей игре выбирают в окне стража до спуска, а begin()
  // её не сбрасывает: ставим заранее, первый этаж уже будет нужной. Режим
  // берётся с переключателя, а его в заглушке нет — ставим напрямую и
  // пересобираем этаж: begin() уже создал первый этаж в обычном режиме.
  if (opts.mode !== G.mode) {
    G.mode = opts.mode;
    API.activateFloor(0);
  }
  return village;
}

// Проходимая клетка рядом с целью. Дверь дома — часть стены, встать на неё
// нельзя, поэтому идём к клетке перед ней.
function frontOf(x, y) {
  const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  for (const d of dirs) {
    const p = { x: x + d[0], y: y + d[1] };
    if (G.map.grid[p.y] && G.map.grid[p.y][p.x] === 1 && !API.cellBlocked(p.x, p.y)) return p;
  }
  return null;
}

// Проход деревни ботом: дойти, войти, поговорить, выйти, спуститься.
// Возвращает, что удалось: это видно в сводке и ловит поломку уровня.
function villagePhase(opts) {
  const seen = { house: false, trader: false, guard: false };
  API.enterVillage(null);
  const house = API.VILLAGE_HOUSES.trader;
  const doorFront = frontOf(house.door.x, house.door.y);
  if (doorFront && walkTo(doorFront.x, doorFront.y, 90)) {
    API.doInteract();
    if (G.place === "house") {
      seen.house = true;
      const npc = (G.npcs || []).find((n) => n.key === "trader");
      const npcFront = npc ? (frontOf(npc.x, npc.y) || npc) : null;
      if (npcFront && walkTo(npcFront.x, npcFront.y, 40)) {
        API.doInteract();
        if (openOverlay("dialog-overlay")) {
          seen.trader = true;
          for (let i = 0; i < opts.amulets; i++) API.buyHubItem("amulet");
          API.buyHubItem("small_potion");
          API.closeDialog();
        }
      }
      walkTo(house.exit.x, house.exit.y, 40);
      API.doInteract();
    }
  }
  const guard = API.VILLAGE_NPCS.find((n) => n.key === "guard");
  const guardFront = frontOf(guard.at.x, guard.at.y);
  if (guardFront && walkTo(guardFront.x, guardFront.y, 90)) {
    API.doInteract();
    if (openOverlay("entrance-overlay")) seen.guard = true;
  }
  return seen;
}

// Идёт к клетке по поиску пути, шагая через API.move. true — дошёл.
function walkTo(x, y, limit) {
  for (let i = 0; i < (limit || 60); i++) {
    if (G.playerPos.x === x && G.playerPos.y === y) return true;
    if (openOverlay("dialog-overlay") || openOverlay("entrance-overlay")) return true;
    const path = API.findPath(G.playerPos, { x, y });
    if (!path || !path.length) return false;
    const next = path[0];
    API.move(next.x - G.playerPos.x, next.y - G.playerPos.y);
  }
  return false;
}

// Где бот стоит и что вокруг — для --trace, когда партия не закончилась.
function dumpState(why) {
  const t = API.interactTarget();
  const nearest = G.enemies
    .map((e) => ({ e, d: Math.round(Math.hypot(e.x - G.playerPos.x, e.y - G.playerPos.y)) }))
    .sort((a, b) => a.d - b.d)[0];
  const goal = goalCell();
  const path = goal ? API.findPath(G.playerPos, goal) : null;
  console.log("   " + why + " на этаже " + (G.floorIndex + 1) +
    ", клетка " + G.playerPos.x + "," + G.playerPos.y +
    ", лестница " + (G.stairsDown ? G.stairsDown.x + "," + G.stairsDown.y : "нет") +
    (G.stairsDown && G.stairsDown.active ? " открыта" : " ЗАКРЫТА") +
    ", цель " + (goal ? goal.x + "," + goal.y : "нет") +
    ", путь " + (path ? path.length + " шагов" + (path.length ? " через " + path[0].x + "," + path[0].y : "") : "НЕТ") +
    ", связан=" + !!G.player.snared +
    ", действие=" + (t ? t.kind : "нет") +
    ", бой=" + !!G.battle +
    (G.battle ? " (" + G.battle.enemy.name + ", фаза " + G.battle.phase + ")" : "") +
    ", врагов " + G.enemies.length +
    (nearest ? ", ближайший в " + nearest.d + " клетках (" + nearest.e.name + ")" : ""));
  for (const e of G.enemies) {
    console.log("     враг " + e.name + " на " + e.x + "," + e.y +
      " hp " + e.hp + "/" + e.maxHp + (e.boss ? " БОСС" : ""));
  }
}

function playOne(opts, rng, trace) {
  const skill = opts.skill;
  const village = startGame(opts, rng);
  const start = { hp: G.player.hp, gold: G.player.gold };
  const seen = {
    battles: 0, chest: 0, shop: 0, floors: 0, deaths: 0, retries: 0,
    waits: 0, drinks: 0, fights: 0, wanders: 0, stuck: 0, chestStuck: 0, snared: 0, equips: 0,
    // Второй шанс: сколько раз бот возродился амулетом и сколько раз поход
    // закончился возвратом в деревню.
    revives: 0, toHub: 0, skips: 0,
    // Доля вопросов, которые бот пропускает вместо ответа (--skip).
    skipShare: opts.skip || 0,
    // lastFloorSeen — этаж, на который бот спустился в прошлый раз;
    // descentsLost — вызовы descend(), которые ничего не изменили.
    lastFloorSeen: G.floorIndex, descentsLost: 0,
    blessings: 0,
    lowestHp: G.player.hp, deepest: G.floorIndex,
    // Для сводки: самая низкая доля здоровья за партию, этажи смертей,
    // бои, в которых здоровье падало ниже 30%.
    lowestPct: 1, deathFloors: [], dangerBattles: 0, battleLowPct: 1,
    // uid торговцев, у которых бот уже заглянул: иначе он стоит рядом
    // и бот топчется на месте, открывая лавку вхолостую.
    shopsDone: new Set(),
    // Практические задания за партию: код задания → сколько раз выпало.
    practiceSeen: new Map(),
    forge: !!opts.forge
  };
  let steps = 0;
  let lastProgress = { steps: 0, what: "старт", pos: G.playerPos.x + "," + G.playerPos.y,
    hp: G.player.hp, floor: G.floorIndex };

  while (steps < opts.turns) {
    steps += 1;
    if (!G.running) {
      if (G.dead || G.player.hp <= 0) {
        seen.deaths += 1;
        seen.deathFloors.push(G.floorIndex + 1);
        // Второй шанс: пока в деревне есть амулеты, бот возрождается и
        // продолжает поход. Амулеты кончились — поход окончен, в деревню.
        const prof = getProfile("Бот");
        const hasAmulet = !!(prof && prof.hub && prof.hub.revive > 0);
        if (hasAmulet && API.useRevive()) {
          seen.revives += 1;
          if (trace) console.log("   пал на этаже " + (G.floorIndex + 1) + ", трачу амулет");
          continue;
        }
        seen.toHub += 1;
        if (trace) console.log("   пал на этаже " + (G.floorIndex + 1) + ", возвращаюсь в деревню");
        API.deathToHub();
        break;
      }
      // Победа или конец партии — выходим.
      break;
    }
    if (openOverlay("end-overlay")) break;
    // Затвор глубины: спуска дальше нет, а на этаже больше нечего искать —
    // поход кончен. Так выглядит первый поход ученика: он упирается в
    // запечатанную лестницу, возвращается в деревню и копит на кузницу.
    if (!API.canDescend() && !G.battle && (G.treasures || []).length === 0) {
      seen.sealed = true;
      seen.toHub += 1;
      if (trace) console.log("   лестница запечатана — возвращаюсь в деревню");
      API.deathToHub();
      break;
    }
    const hadBattle = !!G.battle;
    let what = "start";
    const t0 = Date.now();
    try {
      what = playStep(skill, rng, seen);
    } catch (err) {
      console.log("ИСКЛЮЧЕНИЕ на шаге " + steps + ": " + err.message);
      console.log(String(err.stack).split("\n").slice(0, 5).join("\n"));
      return { crash: true, seen: seen, steps: steps };
    }
    if (what === "chest" && !seen.chestStuck) seen.chest += 1;
    if (what === "shop-open" || what === "shop-buy") seen.shop += 1;
    if (what === "wait") seen.waits += 1;
    if (what === "bound") seen.snared += 1;
    if (what === "drink") seen.drinks += 1;
    if (what === "equip") seen.equips += 1;
    if (what === "wander") seen.wanders += 1;
    if (what === "fight") seen.fights += 1;
    // Спуск считаем только когда этаж и правда сменился: вызов descend()
    // может ничего не сделать (окно поверх карты), и «спусков 1124» на
    // 31-м этаже — это был счётчик вызовов, а не переходов.
    if (what === "descend") {
      if (G.floorIndex !== seen.lastFloorSeen) {
        seen.floors += 1;
        seen.lastFloorSeen = G.floorIndex;
      } else {
        seen.descentsLost += 1;
      }
    }
    if (what === "blessing") seen.blessings += 1;
    if (!hadBattle && G.battle) seen.battles += 1;
    const pct = G.player.maxHp ? Math.max(0, G.player.hp) / G.player.maxHp : 1;
    if (pct < seen.lowestPct) seen.lowestPct = pct;
    if (G.battle && pct < seen.battleLowPct) seen.battleLowPct = pct;
    if (hadBattle && !G.battle) {
      if (seen.battleLowPct < 0.3) seen.dangerBattles += 1;
      seen.battleLowPct = 1;
    }
    if (G.player.hp < seen.lowestHp) seen.lowestHp = G.player.hp;
    if (G.floorIndex > seen.deepest) seen.deepest = G.floorIndex;

    // Медленный ход — сам по себе затык: значит, внутри игры что-то ушло
    // в бесконечный цикл (например, путь, который не сходится).
    const stepMs = Date.now() - t0;
    if (stepMs > 500) {
      seen.stuck += 1;
      if (trace) console.log("   МЕДЛЕННЫЙ ХОД " + stepMs + " мс: " + what +
        " на этаже " + (G.floorIndex + 1) + ", поз " + G.playerPos.x + "," + G.playerPos.y);
      break;
    }

    // Прогресс — это смена клетки, этажа, здоровья или открытого боя.
    const pos = G.playerPos.x + "," + G.playerPos.y;
    if (what === "descend" || what === "chest" || what === "shop-buy" ||
        what === "drink" || what === "equip" || what === "forge" || pos !== lastProgress.pos ||
        G.player.hp !== lastProgress.hp || G.floorIndex !== lastProgress.floor) {
      lastProgress = { steps, what, pos, hp: G.player.hp, floor: G.floorIndex };
    }
    if (trace) {
      console.log("   " + what + "  клетка " + G.playerPos.x + "," + G.playerPos.y +
        "  сундуков " + ((G.treasures || []).length) + "  HP " + Math.round(G.player.hp) + "/" + G.player.maxHp +
        "  золото " + G.player.gold + "  этаж " + (G.floorIndex + 1) +
        (G.battle ? "  бой: " + G.battle.enemy.name : ""));
    }
    // Страховка от бесконечного «иду туда же»: если за 40 ходов не сменились
    // ни этаж, ни позиция, ни здоровье — бот застрял, выходим.
    if (steps - lastProgress.steps > 40) {
      seen.stuck += 1;
      if (trace) dumpState("застрял: " + lastProgress.what);
      break;
    }
  }
  if (trace && steps >= opts.turns && G.running) dumpState("ходы кончились");

  const result = {
    crash: false,
    steps: steps,
    stuck: seen.stuck,
    deepest: seen.deepest + 1,
    floors: seen.floors,
    descentsLost: seen.descentsLost,
    deaths: seen.deaths,
    revives: seen.revives,
    toHub: seen.toHub,
    skips: seen.skips,
    // Что удалось в деревне: не дошёл до торговца или до стража — значит
    // сломался уровень, а не баланс.
    village: village,
    battles: seen.battles,
    fights: seen.fights,
    chests: seen.chest,
    vaults: seen.vaultsOpened || 0,
    nodes: seen.nodesMined || 0,
    rests: seen.rests || 0,
    shops: seen.shop,
    drinks: seen.drinks,
    bound: seen.snared,
    waits: seen.waits,
    wanders: seen.wanders,
    gold: G.player.gold,
    hp: G.player.hp,
    maxHp: G.player.maxHp,
    lowestHp: seen.lowestHp,
    level: G.player.level,
    kills: G.stats ? G.stats.kills : 0,
    correct: G.stats ? G.stats.correct : 0,
    wrong: G.stats ? G.stats.wrong : 0,
    codePassed: G.stats ? G.stats.codePassed : 0,
    victory: !!G.finishedVictory,
    dead: !!G.dead,
    // Поход кончился запечатанной лестницей: глубины ещё нет, герой вернулся
    // в деревню за материалами. Это нормальный первый поход, а не поломка.
    sealed: !!seen.sealed,
    equipped: Object.values(G.equipment || {}).filter(Boolean).length,
    equips: seen.equips,
    lowestPct: seen.lowestPct,
    deathFloors: seen.deathFloors,
    dangerBattles: seen.dangerBattles,
    tasks: G.stats ? G.stats.correct + G.stats.wrong + (G.stats.copyTried || 0) + (G.stats.codeTried || 0) : 0,
    // Время по видам: вопрос и «вставь/найди» — по 30 с, «перепиши код» —
    // минута, «напиши функцию» — две. Грубо, но честнее, чем всё по 30 с.
    minutes: G.stats ? ((G.stats.correct + G.stats.wrong) * 30 + (G.stats.copyTried || 0) * 60 +
      (G.stats.codeTried || 0) * 120) / 60 : 0,
    practice: G.stats ? (G.stats.copyTried || 0) + (G.stats.codeTried || 0) : 0,
    applied: [...seen.practiceSeen.values()].reduce((a, n) => a + n, 0),
    appliedUnique: seen.practiceSeen.size,
    appliedTop: Math.max(0, ...seen.practiceSeen.values()),
    goldEarned: G.stats ? G.stats.goldEarned || 0 : 0,
    forge: Object.assign({ weapon: 0, armor: 0, vitality: 0 }, G.forge || {}),
    gear: ["weapon", "armor", "accessory"]
      .map((s) => (G.equipment && G.equipment[s] ? G.equipment[s].id : "—")).join("/"),
    inventory: (G.inventory || []).length
  };
  return result;
}

// ---------------- вывод ----------------

function printResult(i, opts, r, elapsed, seed) {
  // Зерно для повтора: --seed принимает базу, а партия i берёт базу + i × 7919.
  const replay = " | повтор: --seed " + (seed - 7919) + " --games 1";
  if (r.crash) {
    console.log("партия " + i + ": УПАЛА после " + r.steps + " ходов" + replay);
    return false;
  }
  const end = r.victory ? "победа" : (r.dead ? "смерть" : (r.stuck ? "застрял" : "обрыв"));
  console.log(
    "партия " + i + ": " + end +
    " | глубже всего этаж " + r.deepest +
    " | спусков " + r.floors +
    (r.descentsLost ? " (холостых " + r.descentsLost + ")" : "") +
    " | боёв " + r.battles +
    " | смертей " + r.deaths +
    (r.revives ? " (возрождений " + r.revives + ")" : "") +
    " | сундуков " + r.chests +
    " | лавок " + r.shops +
    " | в цепях " + r.bound +
    " | зелий " + r.drinks +
    (r.vaults ? " | тайников " + r.vaults : "") +
    (r.nodes ? " | жил " + r.nodes : "") +
    (r.rests ? " | привалов " + r.rests : "") +
    " | уровень " + r.level +
    " | HP " + Math.round(r.hp) + "/" + r.maxHp +
    " (мин " + Math.round(r.lowestHp) + ")" +
    " | золото " + r.gold +
    " | верно/неверно " + r.correct + "/" + r.wrong +
    " | снаряжение " + r.equipped + " (" + r.gear + ", замен " + r.equips + ")" +
    " | ходов " + r.steps +
    " | " + elapsed.toFixed(1) + " с" +
    (r.victory ? "" : replay)
  );
  return true;
}

// Сводка по серии: насколько игра трудна при такой доле верных ответов.
// Теперь смерть кончает поход, поэтому «победы» — настоящий исход, а не
// формальность. Рядом — сколько раз спасал амулет возврата.
// Траты между походами в кампании. Порядок жёсткий и объясняет устройство
// игры: сначала постройки (без кузницы улучшения вообще недоступны), потом
// улучшения героя — от здоровья и силы к деньгам. Возвращает список покупок.
function campaignSpend() {
  const bought = [];
  const want = { forge: 1, barn: 1, well: 1, smith: 1 };
  for (let round = 0; round < 40; round++) {
    let did = false;
    Object.keys(want).forEach((key) => {
      if (API.villageLevel(key) >= want[key]) return;
      if (API.restoreBuilding(key)) { bought.push(key + " L" + API.villageLevel(key)); did = true; }
    });
    ["hp", "dmg", "potions", "armor", "loot"].forEach((kind) => {
      if (API.buyHeroUpgrade(kind)) { bought.push(kind + " L" + API.heroLevel(kind)); did = true; }
    });
    // Награду за сюжетный шаг выдаёт староста: именно там лежит оберег
    // глубины, без которого шестой этаж запечатан. Заходим к нему каждый раз.
    if (API.claimStory()) { bought.push("награда старосты"); did = true; }
    if (!did) break;
  }
  return bought;
}

// Отчёт кампании: главное в ней — номер похода, в котором пришла первая
// победа, и как росла глубина. Это и есть проверка «с первых попыток не
// пройти»: если победа приходит в первом-втором походе, стена не работает.
function printCampaign(opts, rows) {
  const ok = rows.filter((r) => !r.crash);
  if (!ok.length) return;
  const firstWin = ok.findIndex((r) => r.victory) + 1;
  const depths = ok.map((r) => r.deepest).join(", ");
  const prof = getProfile("Бот");
  console.log("");
  console.log("кампания: " + ok.length + " походов одним героем, верных ответов " +
    Math.round(opts.skill * 100) + "%");
  console.log("  глубина по походам: " + depths);
  console.log("  первая победа: " + (firstWin ? "поход " + firstWin : "не пришла"));
  console.log("  победы: " + ok.filter((r) => r.victory).length + " из " + ok.length +
    " (" + Math.round((ok.filter((r) => r.victory).length / ok.length) * 100) + "%)");
  console.log("  первый поход: " + ok[0].deepest + " этаж, " + ok[0].level + " уровень");
  console.log("  деревня: " + Object.keys(API.VILLAGE_BUILDINGS).map((k) =>
    k + " " + API.villageLevel(k)).join(", "));
  console.log("  герой: " + ["hp", "dmg", "potions", "armor", "loot"].map((k) =>
    k + " " + API.heroLevel(k)).join(", "));
  console.log("  кошелёк: " + prof.wallet.gold + " золота, материалы: " +
    API.LOOT_KINDS.map((k) => API.LOOT_NAMES[k] + " " + (prof.loot[k] || 0)).join(", ") +
    (prof.loot.keys.length ? ", ключи: " + prof.loot.keys.join(", ") : ""));
  const floorsHist = {};
  ok.forEach((r) => { floorsHist[r.deepest] = (floorsHist[r.deepest] || 0) + 1; });
  console.log("  где кончались походы: " + Object.keys(floorsHist).sort((a, b) => a - b)
    .map((f) => f + " этаж ×" + floorsHist[f]).join(", "));
  const sealedRuns = ok.filter((r) => r.sealed).length;
  console.log("  упёрлись в затвор глубины: " + sealedRuns + " из " + ok.length +
    (sealedRuns ? " (лестница запечатана, пока нет оберега из деревни)" : ""));
}

function printSummary(opts, rows) {
  const ok = rows.filter((r) => !r.crash);
  if (ok.length < 2) return;
  const avg = (f) => ok.reduce((a, r) => a + f(r), 0) / ok.length;
  const share = (f) => Math.round((ok.filter(f).length / ok.length) * 100);
  const median = (f) => {
    const v = ok.map(f).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  const perFloor = {};
  ok.forEach((r) => r.deathFloors.forEach((f) => { perFloor[f] = (perFloor[f] || 0) + 1; }));
  const floors = Object.keys(perFloor).map(Number).sort((a, b) => a - b);
  const names = { easy: "Лёгкий", normal: "Обычный", hard: "Сложный" };
  const tasks = avg((r) => r.tasks);
  console.log("");
  console.log("сводка: " + ok.length + " партий, сложность «" + names[opts.difficulty] + "», верных ответов " +
    Math.round(opts.skill * 100) + "%");
  if (opts.mode === "endless") {
    // В бесконечном режиме победы не бывает: партия кончается смертью или
    // лимитом ходов. Поэтому вместо «побед» — докуда дошёл и как часто гибнул.
    console.log("  глубина: в среднем этаж " + avg((r) => r.deepest).toFixed(1) +
      ", глубже всего " + Math.max(...ok.map((r) => r.deepest)) +
      "; партий с гибелью героя — " + share((r) => r.hp <= 0) + "%");
  } else {
    console.log("  победы " + share((r) => r.victory) + "%");
  }
  console.log("  смертей на партию " + avg((r) => r.deaths).toFixed(2) +
    " (хоть одна — в " + share((r) => r.deaths > 0) + "% партий, больше всего " +
    Math.max(...ok.map((r) => r.deaths)) + ")");
  if (floors.length) {
    console.log("  где умирали: " + floors.map((f) => "этаж " + f + " — " + perFloor[f]).join(", "));
  }
  console.log("  деревня: в дом торговца попал в " +
    share((r) => r.village && r.village.house) + "% партий, в лавку — " +
    share((r) => r.village && r.village.trader) + "%, к стражу входа — " +
    share((r) => r.village && r.village.guard) + "%");
  if (opts.skip > 0) {
    console.log("  пропуски: " + avg((r) => r.skips).toFixed(1) + " вопросов за партию (--skip " +
      opts.skip + "), из них оплачено здоровьем; процент похода: " +
      Math.round(avg((r) => r.correct / Math.max(1, r.correct + r.wrong) * 100)) + "%");
  }
  console.log("  второй шанс: амулетов куплено " + opts.amulets + " на партию, возрождений " +
    avg((r) => r.revives).toFixed(2) + ", возвратов в деревню " + avg((r) => r.toHub).toFixed(2));
  console.log("  самое низкое здоровье за партию: в среднем " + Math.round(avg((r) => r.lowestPct) * 100) +
    "%, медиана " + Math.round(median((r) => r.lowestPct) * 100) + "%");
  console.log("  опасных боёв (здоровье ниже 30%): " + avg((r) => r.dangerBattles).toFixed(1) + " на партию из " +
    avg((r) => r.battles).toFixed(0));
  console.log("  заданий за партию: " + tasks.toFixed(0) + ", из них переписать или написать код — " +
    avg((r) => r.practice).toFixed(0) + "; время ≈ " + Math.round(avg((r) => r.minutes)) +
    " мин (вопрос — 30 с, «перепиши» — 1 мин, «напиши функцию» — 2 мин); уровень героя " +
    avg((r) => r.level).toFixed(1));
  const applied = avg((r) => r.applied);
  if (applied > 0) {
    console.log("  практика («примени»): " + applied.toFixed(0) + " заданий за партию, разных " +
      avg((r) => r.appliedUnique).toFixed(0) + " (" +
      Math.round((avg((r) => r.appliedUnique) / applied) * 100) + "%); одно задание выпадало до " +
      avg((r) => r.appliedTop).toFixed(1) + " раз (в среднем по партиям)");
  }
  console.log("  золото: заработано " + avg((r) => r.goldEarned).toFixed(0) + ", осталось к концу " +
    avg((r) => r.gold).toFixed(0) + "; полный комплект снаряжения — в " +
    share((r) => r.equipped === 3) + "% партий");
  console.log("  кузница: заточка " + avg((r) => r.forge.weapon).toFixed(1) + ", броня " +
    avg((r) => r.forge.armor).toFixed(1) + ", закалка " + avg((r) => r.forge.vitality).toFixed(1) +
    (opts.forge ? "" : " (бот в кузницу не ходит: --no-forge)"));
}

// ---------------- main ----------------

function main() {
  const opts = parseArgs(process.argv);
  const baseSeed = opts.seed === null ? 20260520 : opts.seed;
  if (opts.balance) {
    const keys = Object.keys(opts.balance);
    const applied = API.applyBalanceValues(opts.balance);
    if (applied !== keys.length) throw new Error("--balance: игра приняла " + applied + " из " + keys.length + " ключей");
  }
  let crashed = 0;
  const rows = [];
  const t0 = Date.now();
  for (let i = 1; i <= opts.games; i++) {
    const seed = baseSeed + i * 7919;
    const rng = makeRng(seed);
    // Карта, враги и добыча берутся из Math.random игры: без подмены партию
    // с тем же зерном бота нельзя было повторить.
    Math.random = makeRng(seed ^ 0x5bd1e995);
    const g0 = Date.now();
    const r = playOne(opts, rng, opts.trace);
    flushTimers();
    // В кампании герой тратит найденное между походами: восстановить деревню
    // и поднять себя. Без этого второй поход был бы таким же обречённым.
    if (opts.campaign) {
      r.spent = campaignSpend();
      if (r.spent.length) console.log("  куплено в деревне: " + r.spent.join(", "));
      r.villageSnapshot = { barn: API.villageLevel("barn"), forge: API.villageLevel("forge"),
        well: API.villageLevel("well"), smith: API.villageLevel("smith") };
      r.heroSnapshot = { hp: API.heroLevel("hp"), dmg: API.heroLevel("dmg") };
    }
    rows.push(r);
    const ok = printResult(i, opts, r, (Date.now() - g0) / 1000, seed);
    if (!ok) crashed += 1;
  }
  console.log("итого " + opts.games + " партий за " + ((Date.now() - t0) / 1000).toFixed(1) +
    " с, упало " + crashed);
  printSummary(opts, rows);
  if (opts.campaign) printCampaign(opts, rows);
  if (crashed) process.exit(1);
}

try {
  main();
} catch (err) {
  console.log("БОТ УПАЛ: " + err.message);
  console.log(String(err.stack).split("\n").slice(0, 6).join("\n"));
  process.exit(2);
}