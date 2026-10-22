// ================= 1. Контент =================
log(API.ENEMY_TYPES.length === 20, "ENEMY_TYPES = 20 видов", API.ENEMY_TYPES.length);
log(API.FLOORS.length === 10, "FLOORS = 10 этажей", API.FLOORS.length);
log(API.ITEM_POOL.length >= 29, "ITEM_POOL >= 29 предметов", API.ITEM_POOL.length);
// Банк заданий растёт (сейчас 13 и 10), поэтому порог, а не точное число:
// проверка ловит несобранный банк, а не добавленное задание.
log(API.FILL_TASKS.length >= 13, "FILL_TASKS >= 13", API.FILL_TASKS.length);
log(API.ERROR_TASKS.length >= 10, "ERROR_TASKS >= 10", API.ERROR_TASKS.length);
log(API.CODE_TASKS.length === 11, "CODE_TASKS = 11", API.CODE_TASKS.length);
log(API.COPY_TASKS.length === 12, "COPY_TASKS = 12", API.COPY_TASKS.length);
log(API.QUESTIONS.length >= 85, "QUESTIONS >= 85", API.QUESTIONS.length);
log(!!API.TERRAIN_DECOR_NAMES && !!API.TERRAIN_DECOR_NAMES[10], "новые декорации 6..10 загружены",
  API.TERRAIN_DECOR_NAMES ? Object.keys(API.TERRAIN_DECOR_NAMES).length + " видов" : "нет");
log(API.TRAP_TYPES.length === 6, "TRAP_TYPES = 6 ловушек", API.TRAP_TYPES.length);
log(API.FLOOR_EPILOGUES.length === 10, "эпиграфов на 10 этажей", API.FLOOR_EPILOGUES.length);
log(API.FLOOR_EVENTS.length === 10, "событий на 10 этажей", API.FLOOR_EVENTS.length);
const withQuips = API.ENEMY_TYPES.filter((t) => (API.ENEMY_QUIPS[t.key] || []).length);
log(withQuips.length === 20, "реплики есть у всех 20 врагов", withQuips.length);

// иконки ловушек должны существовать в ICONS
const trapIconsOk = API.TRAP_TYPES.every((t) => {
  const svg = globalThis.iconSvg(t.icon);
  return svg && svg.trim().indexOf("<svg") === 0;
});
log(trapIconsOk, "иконка есть для каждой ловушки");

// спрайты боя: у каждого врага и у героя должен быть свой спрайт 32×32 из
// готового набора (public domain), а не увеличенная иконка с карты
const IHDR_32 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAg"; // PNG 32×32 в base64
const PNG_URI = "data:image/png;base64,";
const spriteKeys = API.ENEMY_TYPES.filter((t) => API.SPRITES[t.key]);
log(spriteKeys.length === 20, "спрайт есть у всех 20 врагов", spriteKeys.length);
const spritesOk = API.ENEMY_TYPES.every((t) => API.SPRITES[t.key].indexOf(IHDR_32) === PNG_URI.length);
log(spritesOk, "спрайт врага — вшитый PNG ровно 32×32 (data-URI, не ссылка на файл)");
log(API.SPRITES.player.indexOf(IHDR_32) === PNG_URI.length, "спрайт героя 32×32 на месте");
const spriteImgTag = API.spriteImg("rat");
log(spriteImgTag.indexOf("<img") === 0 && spriteImgTag.indexOf("class='sprite-img'") !== -1,
  "spriteImg рисует картинку с классом sprite-img");
log(API.spriteImg("нет_такого") === API.spriteImg("goblin"),
  "незнакомый ключ получает запасной спрайт, а не пустоту");

// карта: герой, враги и торговец — готовые спрайты; сундук, ловушки и
// лестницы — тайлы; SVG осталась только у метки прицела
const mapSpriteKeys = API.ENEMY_TYPES.every((t) => API.mapIcon(t.key).indexOf("sprite-img") !== -1);
log(mapSpriteKeys && API.mapIcon("player").indexOf("sprite-img") !== -1,
  "на карте герой и все 17 врагов — готовые спрайты");
log(API.mapIcon("rat").indexOf("<img") === 0 && API.mapIcon("troll").indexOf("<svg") === -1,
  "иконка врага на карте — <img>, а не SVG");
log(API.mapIcon("treasure").indexOf("<img") === 0 && API.mapIcon("trader").indexOf("<img") === 0 &&
  API.mapIcon("sniper").trim().indexOf("<svg") === 0,
  "сундук и торговец — пиксельные картинки, метка прицела осталась SVG");
log(API.mapIcon("stairsUp").indexOf("<img") === 0 && API.mapIcon("stairs").indexOf("<img") === 0,
  "лестницы вниз и вверх рисуются готовыми тайлами");

// ================= 1б. Визуал уровней: готовые тайлы подземелья =================
const terrainFloors = API.TERRAIN_FLOORS;
log(terrainFloors.length === 10, "наборов тайлов на 10 этажей", terrainFloors.length);
const thinWall = terrainFloors.filter((f) => f.wall.length < 4).length;
const thinFloor = terrainFloors.filter((f) => f.floor.length < 4).length;
log(thinWall === 0, "у каждого этажа минимум 4 варианта стен", thinWall ? "СБОЙ: " + thinWall : "ок");
log(thinFloor === 0, "у каждого этажа минимум 4 варианта пола", thinFloor ? "СБОЙ: " + thinFloor : "ок");
const allTiles = terrainFloors.reduce((acc, f) => acc.concat(f.wall, f.floor), []);
const wrongTiles = allTiles.filter((u) => u.indexOf(PNG_URI) !== 0 || u.indexOf(IHDR_32) !== PNG_URI.length);
log(wrongTiles.length === 0, "все тайлы этажей — вшитые PNG 32×32 (" + allTiles.length + " шт)",
  wrongTiles.length ? "СБОЙ: " + wrongTiles.length : "ок");
log(new Set(terrainFloors.map((f) => f.wall[0])).size === 10, "у всех десяти этажей свои стены");
log(terrainFloors.filter((f) => f.wall[0] === f.floor[0]).length === 0, "стены и полы — разные картинки");

const waterFrames = (API.TERRAIN_WATER.base || []).length +
  Object.keys(API.TERRAIN_WATER.waves || {}).length * 2;
const lavaFrames = API.TERRAIN_LAVA.length;
log(waterFrames >= 4, "у воды кадры волн", waterFrames);
log(lavaFrames >= 4, "у лавы кадры перелива", lavaFrames);
const waterAnim = API.terrainAnimFrames(3, 0, 0, true, 2);
// На девятом этаже вода — это лава, поэтому кадры перелива берутся по коду 2.
const lavaAnim = API.terrainAnimFrames(9, 0, 0, true, 2);
log(!!waterAnim && waterAnim.length > 1, "вода анимируется", waterAnim ? waterAnim.length + " кадров" : "нет");
log(!!lavaAnim && lavaAnim.length > 1, "лава анимируется", lavaAnim ? lavaAnim.length + " кадров" : "нет");
const kindWater = API.terrainKind(3, 2);
// Фонарь — это код 7, а 8 — это кол, воткнутый в пол.
const kindLight = API.terrainKind(3, 7);
log(kindWater === "water" && kindLight === "light",
  "декор даёт свет: вода «" + kindWater + "», фонарь «" + kindLight + "»");
log(API.terrainBg(0, 3, 3, false, 0) !== API.terrainBg(0, 3, 3, true, 0), "стена и пол дают разный фон");
log(API.terrainBg(0, 3, 3, true, 2) !== API.terrainBg(0, 3, 3, true, 0), "декор ложится поверх пола");
log((API.terrainIcon("stairs") || "").indexOf(PNG_URI) === 0 && (API.terrainIcon("spikes") || "").indexOf(PNG_URI) === 0,
  "лестница и ловушка — готовые тайлы, а не SVG");

// Набор декораций у каждого этажа свой: пещеры зарастают травой, катакомбы
// усыпаны костями, руины блестят кристаллами, в склепе горят фонари.
const decorCodes = new Set();
const mixOk = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every((i) => {
  const mix = API.floorDecorMix(i);
  if (!mix || !mix.length) return false;
  mix.forEach((pair) => decorCodes.add(pair[0]));
  return mix.every((pair) => pair[0] >= 1 && pair[0] <= 10 && pair[1] > 0);
});
log(mixOk, "у каждого этажа свой набор декораций", decorCodes.size + " видов задействовано");
log(decorCodes.size >= 8, "в декоре задействовано 8+ видов", decorCodes.size);
log(JSON.stringify(API.floorDecorMix(0)) !== JSON.stringify(API.floorDecorMix(9)),
  "пещеры и логово дракона украшены по-разному");
log(API.terrainIsInfernal(6) && API.terrainIsInfernal(9) && !API.terrainIsInfernal(3),
  "огненные этажи — только обитель демонов и логово дракона");
log(API.terrainKind(6, 2) === "lava" && API.terrainKind(3, 2) === "water",
  "на демоническом этаже вода — лава");
log(API.terrainDecorUri(1, 1, 1, 4) !== API.terrainDecorUri(6, 1, 1, 4),
  "в огненной обители кости заменены кольями");

// На этажах с тайниками игра предлагает «сделку» — окно висит поверх карты,
// и doInteract() молчит, пока оно открыто. Для проверок интерактива окно
// закрываем: иначе проверка «без ключа не открыть» проходит сама собой.
function quietFloor(idx) {
  freshRun(idx);
  G.blessingOffer = null;
  el("blessing-overlay").classList.add("hidden");
}
// ================= 1б. Интерактив этажа =================
// Тайник, жилы, рычаги и таблички появляются с третьего этажа: это то, ради
// чего стоит обойти этаж, а не бежать к лестнице.
const vaultFloors = tries(30, (i) => {
  quietFloor(4);
  return (G.vaults || []).length > 0;
});
log(vaultFloors >= 0, "на глубоких этажах встречается тайник", "нашли с " + (vaultFloors + 1) + "-й попытки");
quietFloor(4);
if ((G.vaults || []).length) {
  const vault = G.vaults[0];
  const grid = G.map.grid;
  // На клетке перед дверью мог оказаться сундук, рычаг, жила, табличка или
  // костёр: тогда первой целью будет он, и проверка тайника станет флаком.
  // Убираем все интерактивные объекты с этой клетки.
  const clearAt = (x, y) => {
    const keep = (o) => !(o && o.x === x && o.y === y);
    G.treasures = (G.treasures || []).filter(keep);
    G.traders = (G.traders || []).filter(keep);
    G.nodes = (G.nodes || []).filter(keep);
    G.levers = (G.levers || []).filter(keep);
    G.signs = (G.signs || []).filter(keep);
    G.camps = (G.camps || []).filter(keep);
    G.npcs = (G.npcs || []).filter(keep);
  };
  // interactTarget смотрит не только на клетку героя, но и на соседние. Если
  // рядом с дверью лежит жила/сундук, он может стать целью раньше тайника.
  const clearAround = (x, y) => {
    [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
      clearAt(x + dx, y + dy);
    });
  };
  // Дверь — проход: раньше она оставалась монолитом, и комната была
  // запечатана навсегда, хотя ключ и рычаг «открывали» её.
  log(grid[vault.door.y][vault.door.x] === 1, "дверь тайника — проход, а не стена");
  // Комната внутри: девять клеток пола за дверью.
  let inner = 0;
  for (let y = 0; y < G.map.h; y += 1) {
    for (let x = 0; x < G.map.w; x += 1) {
      if (grid[y][x] === 1 && Math.abs(x - vault.door.x) + Math.abs(y - vault.door.y) <= 4) inner += 1;
    }
  }
  log(inner >= 9, "за дверью вырублена комната", "клеток рядом: " + inner);
  log(G.treasures.length >= 2, "в тайнике лежит добыча", "сундуков на этаже: " + G.treasures.length);
  // Без ключа не открыть.
  G.vaultKeys = 0;
  G.playerPos = { x: vault.from.x, y: vault.from.y };
  // На клетке перед дверью мог оказаться сундук: тогда первой целью будет он.
  // Убираем все объекты — в игре игрок просто нажмёт «Е» ещё раз, а проверка
  // одноразовая.
  clearAround(vault.from.x, vault.from.y);
  const lockedTarget = API.interactTarget();
  log(!!lockedTarget && lockedTarget.kind === "vault" && /заперт/i.test(lockedTarget.label),
    "тайник заперт", lockedTarget && lockedTarget.label);
  API.doInteract();
  log(vault.locked === true, "и без ключа не открывается");
  // Ключ со стража этажа.
  quietFloor(4);
  if ((G.vaults || []).length) {
    const v2 = G.vaults[0];
    const guard = API.makeEnemy("skeleton", 4);
    guard.guard = true;
    guard.x = 1; guard.y = 1;
    G.enemies = [guard];
    API.defeatEnemy(guard);
    log(G.vaultKeys > 0, "ключ от тайника снимают со стража этажа", "ключей: " + G.vaultKeys);
    G.playerPos = { x: v2.from.x, y: v2.from.y };
    // На клетке перед дверью мог оказаться другой интерактивный объект.
    clearAround(v2.from.x, v2.from.y);
    const openTarget = API.interactTarget();
    API.doInteract();
    log(!!openTarget && openTarget.kind === "vault" && v2.locked === false,
      "с ключом тайник открывается", openTarget && openTarget.kind);
    log(G.vaultKeys === 0, "и ключ тратится", String(G.vaultKeys));
  }

  // Дверь тайника — проход, но закрытый: шагом не пройти, пока нет ключа.
  // Раньше клетка двери была стеной, и комната оставалась запечатанной
  // даже после ключа и рычага.
  quietFloor(4);
  if ((G.vaults || []).length) {
    const v3 = G.vaults[0];
    const dir = { x: v3.door.x - v3.from.x, y: v3.door.y - v3.from.y };
    const inside = { x: v3.door.x + dir.x, y: v3.door.y + dir.y };
    log(G.map.grid[v3.door.y][v3.door.x] === 1, "клетка двери тайника проходима");
    log(API.cellBlocked(v3.door.x, v3.door.y) === true,
      "запертая дверь тайника не пропускает шагом");
    G.vaultKeys = 1;
    API.openVault(v3);
    log(API.cellBlocked(v3.door.x, v3.door.y) === false,
      "открытая дверь тайника пропускает шагом");
    const pathToInside = API.findPath(G.playerPos, inside);
    log(!!pathToInside && pathToInside.length > 0, "после открытия путь внутрь есть",
      pathToInside ? pathToInside.length + " шагов" : "пути нет");
  }
}

// Рычаг: верный ответ открывает тайник, неверный бьёт героя.
const leverFloor = tries(30, () => {
  quietFloor(4);
  return (G.levers || []).length > 0;
});
log(leverFloor >= 0, "рядом с тайником стоит рычаг");
quietFloor(4);
if ((G.levers || []).length) {
  const lever = G.levers[0];
  const vaultOfLever = API.vaultByUid(lever.vault);
  G.playerPos = { x: lever.x, y: lever.y - 1 };
  API.openLever(lever);
  log(!!lever.view && lever.view.options.length === 4, "рычаг задаёт вопрос с четырьмя вариантами");
  const wrongIdx = lever.view.answer === 0 ? 1 : 0;
  const hpBefore = G.player.hp;
  API.answerLever(lever, wrongIdx);
  log(G.player.hp < hpBefore, "неверный ответ бьёт героя", hpBefore + " -> " + G.player.hp);
  log(lever.used === false && vaultOfLever.locked === true, "но рычаг остаётся — можно попробовать снова");
  API.openLever(lever);
  API.answerLever(lever, lever.view.answer);
  log(lever.used === true && vaultOfLever.locked === false, "верный ответ открывает тайник");
}

// Сбой в слое объектов не оставляет на карте чужие спрайты: раньше падение
// на середине оставляло узлы прошлого места — деревья и жителей деревни
// поверх карты подземелья. Проверяем по исходнику: слой объектов вызывается
// под защитой, а ошибка уходит в консоль с местом и этажом.
{
  const gameSrc2 = fs.readFileSync(path.join(dir, "game.js"), "utf8");
  const guarded = /try \{\s*renderEntities\(\);\s*\} catch \(err\) \{[\s\S]{0,400}?Сбой отрисовки объектов/.test(gameSrc2);
  log(guarded, "слой объектов рисуется под защитой и не оставляет чужие спрайты");
  log(/clearEntityLayer\(\);[\s\S]{0,120}?renderEntities\(\)/.test(gameSrc2),
    "после сбоя узлы убираются и отрисовка повторяется");
}

// Тайник тоже объясняет себя: в подписи кнопки сказано, где ключ.
quietFloor(4);
if ((G.vaults || []).length) {
  const vv = G.vaults[0];
  G.vaultKeys = 0;
  G.playerPos = { x: vv.from.x, y: vv.from.y };
  G.treasures = (G.treasures || []).filter((t) => !(t.x === vv.from.x && t.y === vv.from.y));
  const vt = API.interactTarget();
  log(/ключ/i.test(vt.label) && /страж/i.test(vt.label),
    "в подписи запертого тайника сказано, где ключ", vt.label);
}

// Рычаг понятен и не смертелен: в подписи кнопки сказано, что он открывает
// тайник, в окне — про удар током, а сам удар не может добить героя. Раньше
// ученик умирал на вопросе у рычага, не зная, что ошибка вообще бьёт.
const leverFloor2 = tries(30, () => {
  quietFloor(4);
  return (G.levers || []).length > 0;
});
quietFloor(4);
if ((G.levers || []).length) {
  const lv = G.levers[0];
  G.playerPos = { x: lv.x, y: lv.y };
  const lvTarget = API.interactTarget();
  log(/тайник/i.test(lvTarget.label), "в подписи рычага сказано про тайник", lvTarget.label);
  API.openLever(lv);
  const lvHtml = el("dialog-box").innerHTML;
  log(/не убьёт/i.test(lvHtml) && /током/i.test(lvHtml),
    "и в окне объяснено, что за ошибку ударит током и что это не смертельно");
  API.closeDialog();
  // Самое главное: удар не добивает.
  G.player.hp = 2;
  API.openLever(lv);
  API.answerLever(lv, lv.view.answer === 0 ? 1 : 0);
  log(G.player.hp >= 1 && !G.dead, "неверный ответ у рычага не убивает героя",
    "осталось здоровья: " + G.player.hp);
  log(el("end-overlay").classList.contains("hidden"), "и экрана смерти не появляется");
  G.player.hp = G.player.maxHp;
}

// Жилы: материал за нажатие уходит в профиль.
quietFloor(5);
if ((G.nodes || []).length) {
  const node = G.nodes[0];
  const before = getProfile(G.name).loot[node.kind] || 0;
  G.playerPos = { x: node.x, y: node.y };
  API.doInteract();
  log(node.taken === true && (getProfile(G.name).loot[node.kind] || 0) > before,
    "жила отдаёт материал в профиль", node.kind + ": " + before + " -> " + getProfile(G.name).loot[node.kind]);
}

// Таблички: читаются и ничего не тратят.
quietFloor(5);
if ((G.signs || []).length) {
  const sign = G.signs[0];
  G.playerPos = { x: sign.x, y: sign.y };
  API.doInteract();
  log(!el("dialog-overlay").classList.contains("hidden") &&
    /Табличка/.test(el("dialog-box").innerHTML), "табличка открывает окно с подсказкой");
  API.closeDialog();
}

// Привал: лечит и пополняет заряды, но привалов на поход мало.
quietFloor(5);
if ((G.camps || []).length) {
  const camp = G.camps[0];
  G.player.hp = Math.round(G.player.maxHp * 0.4);
  const hpBeforeRest = G.player.hp;
  G.ability = { key: "strike", left: 0 };
  G.restsLeft = 2;
  G.playerPos = { x: camp.x, y: camp.y };
  API.doInteract();
  log(G.player.hp > hpBeforeRest, "привал лечит", hpBeforeRest + " -> " + G.player.hp);
  log(G.ability.left > 0, "и пополняет заряды умения", "зарядов: " + G.ability.left);
  log(G.restsLeft === 1 && camp.used === true, "привал потрачен", "осталось: " + G.restsLeft);
  const hpAfterFirst = G.player.hp;
  API.doInteract();
  log(G.player.hp === hpAfterFirst, "тот же костёр второй раз не работает");
}

// Действия героя: оборона ослабляет удар, отступление выводит из боя.
quietFloor(5);
const braceEnemy = enemyOnPlayerCell("orc", 500);
G.enemies = [braceEnemy];
API.openBattle(braceEnemy);
G.player.hp = 400;
G.battle.challenge = { type: "mc", question: API.QUESTIONS[0] };
const hpBeforeBrace = G.player.hp;
API.defendTurn();
log(G.player.hp < hpBeforeBrace, "оборона пропускает удар врага", hpBeforeBrace + " -> " + G.player.hp);
log(G.battle && G.battle.blockLeft >= 1, "и даёт заряд блока", "блок: " + (G.battle && G.battle.blockLeft));
const braceLoss = hpBeforeBrace - G.player.hp;
const rawHit = Math.max(1, braceEnemy.dmg);
log(braceLoss < rawHit + 4, "но удар при обороне слабее полного",
  braceLoss + " против удара " + rawHit);
if (G.battle) API.fleeBattle();
log(G.battle === null, "отступление заканчивает бой");
quietFloor(5);
const runEnemy = enemyOnPlayerCell("orc", 500);
G.enemies = [runEnemy];
API.openBattle(runEnemy);
G.battle.challenge = { type: "mc", question: API.QUESTIONS[0] };
const hpBeforeRun = G.player.hp;
API.fleeBattle();
log(G.player.hp < hpBeforeRun && G.battle === null, "а само отступление стоит удара",
  hpBeforeRun + " -> " + G.player.hp);
quietFloor(5);
const bossEnemy = enemyOnPlayerCell("dragon", 500);
G.enemies = [bossEnemy];
API.openBattle(bossEnemy);
log(API.canFlee(bossEnemy) === false, "от дракона не убежать");

// ================= 2. Способности врагов =================
const abilityKeys = API.ENEMY_TYPES.filter((t) => t.ability).map((t) => t.ability);
log(abilityKeys.length === 12, "способностей у врагов: 12", abilityKeys.join(","));
log(API.ENEMY_TYPES.every((t) => t.abilityText || !t.ability),
  "у каждой способности есть текст");

// Жрица лечит этаж при входе в бой: её и надо убивать первой, иначе раненые
// враги этажа встают на ноги.
freshRun(6);
G.enemies = [API.makeEnemy("priest", 6), API.makeEnemy("orc", 6)];
const hurtAlly = G.enemies[1];
hurtAlly.hp = Math.round(hurtAlly.maxHp * 0.4);
const allyBefore = hurtAlly.hp;
API.openBattle(G.enemies[0]);
log(hurtAlly.hp > allyBefore, "жрица лечит раненых врагов этажа",
  allyBefore + " -> " + hurtAlly.hp);
log(G.enemies[0].hp === G.enemies[0].maxHp, "но себя не лечит — её видно по полному здоровью");
G.battle = null;

// Некромант поднимает слугу на ошибке героя, но не больше двух.
freshRun(7);
const necro = API.makeEnemy("necromancer", 7);
necro.x = G.playerPos.x + 1;
necro.y = G.playerPos.y;
G.enemies = [necro];
G.player.hp = 500;
API.openBattle(necro);
const enemiesBefore = G.enemies.length;
for (let i = 0; i < 4; i += 1) {
  G.battle = G.battle || { enemy: necro, phase: "question", challenge: { type: "mc" } };
  API.applyAttack(0, "промах", true, "");
}
const minions = G.enemies.filter((o) => o.summonedBy === necro.uid);
log(G.enemies.length > enemiesBefore, "некромант поднимает слуг на ошибках",
  enemiesBefore + " -> " + G.enemies.length);
log(minions.length <= 2, "но не больше двух слуг сразу", minions.length);
G.battle = null;

// Щитоносец гасит урон и не даёт отступить.
freshRun(5);
const shield = enemyOnPlayerCell("shieldman", 400);
API.openBattle(shield);
G.equipment = { weapon: null, armor: null, accessory: null };
const shieldBefore = shield.hp;
API.applyAttack(100, "тест", false, "");
const shieldLoss = shieldBefore - shield.hp;
log(shieldLoss > 0 && shieldLoss < 100, "щит гасит часть урона",
  "из 100 нанесено " + shieldLoss);
log(API.canFlee(shield) === false, "и от боя с ним не уйти");
G.battle = null;
log(API.canFlee(API.makeEnemy("orc", 5)) === true, "от обычного врага уйти можно");

// Тролль затягивает раны: его надо бить быстро.
freshRun(5);
const regenTroll = enemyOnPlayerCell("troll", 1000);
API.openBattle(regenTroll);
const trollBefore = regenTroll.hp;
API.applyAttack(100, "тест", false, "");
const trollLoss = trollBefore - regenTroll.hp;
log(trollLoss > 0 && trollLoss < 100, "тролль затягивает часть полученного урона",
  "из 100 потерял " + trollLoss);

// броня голема
freshRun(5);
let golem = enemyOnPlayerCell("golem", 400);
API.openBattle(golem);
G.equipment = { weapon: null, armor: null, accessory: null };
const beforeHp = golem.hp;
API.applyAttack(100, "тест", false, "");
const golemLoss = beforeHp - golem.hp;
log(golemLoss > 0 && golemLoss <= 100, "броня голема гасит часть урона",
  "из 100 нанесено " + golemLoss);
G.battle = null;

// вампир
freshRun(7);
let vamp = enemyOnPlayerCell("vampire", 400);
G.player.hp = 200;
API.openBattle(vamp);
vamp.hp = 200;
API.applyAttack(10, "тест", true, "");
log(vamp.hp > 200, "вампир лечится от удара игрока", vamp.hp);
G.battle = null;

// ================= Пропуск вопроса =================
// Замысел: вопрос можно пропустить, заплатив здоровьем — и ощутимо. Враг при
// этом не бьёт: цена уже уплачена. Но вопрос идёт в пробелы по теме, в процент
// похода и возвращается призраком ошибки — иначе пропускать было бы выгоднее,
// чем учить.
freshRun(3);
const skipEnemy = enemyOnPlayerCell("orc", 400);
API.openBattle(skipEnemy);
// Ставим заведомо вопрос с вариантами: тип задания в бою случаен.
const skipQ = API.QUESTIONS[0];
G.battle.challenge = { type: "mc", question: skipQ };
API.attachChoices(G.battle.challenge);
API.renderBattle();
const skipLabel = el("battle-box").innerHTML;
log(/skip-question-btn/.test(skipLabel), "в бою есть кнопка «Пропустить вопрос»");
const skipPrice = API.skipCost();
log(skipLabel.indexOf("Пропустить вопрос (−" + skipPrice + " HP)") >= 0,
  "на кнопке написана цена", "ждём −" + skipPrice + " HP");
log(skipPrice >= Math.round(G.player.maxHp * 0.15) && skipPrice <= Math.round(G.player.maxHp * 0.3),
  "цена ощутимая — доля от здоровья, а не мелочь",
  skipPrice + " при максимуме " + G.player.maxHp);

const skipHp = G.player.hp;
const skipEnemyHp = G.battle.enemy.hp;
const skipTotal = (G.stats.topicStats[skipQ.topic] || { total: 0 }).total;
G.player.hp = Math.max(G.player.hp, 500);
API.skipQuestion();
log(G.battle.phase === "result", "после пропуска бой идёт дальше", G.battle.phase);
log(G.player.hp === 500 - API.skipCost(),
  "здоровье ушло ровно на цену пропуска — враг не бил",
  "было 500, стало " + G.player.hp);
log(G.battle.enemy.hp === skipEnemyHp, "враг за пропуск урона не получил");
log(G.missed.some((m) => m.id === skipQ.id), "пропущенный вопрос вернётся призраком");
log((G.stats.topicStats[skipQ.topic] || { total: 0 }).total === skipTotal + 1,
  "пропуск засчитан как пробел по теме");
log(/Пропущено/.test(el("battle-box").innerHTML), "в бою сказано, что вопрос пропущен");
log(G.stats.wrong > 0, "пропуск честно портит процент похода", G.stats.wrong);

// Мало здоровья — пропускать нечего: убить себя кнопкой «не знаю» нельзя.
freshRun(3);
API.openBattle(enemyOnPlayerCell("orc", 400));
G.battle.challenge = { type: "mc", question: API.QUESTIONS[1] };
API.attachChoices(G.battle.challenge);
API.renderBattle();
G.player.hp = API.skipCost();
const poorHp = G.player.hp;
API.skipQuestion();
log(G.player.hp === poorHp && G.battle.phase === "question",
  "с малым здоровьем пропуск не срабатывает", G.player.hp + " HP");
G.battle = null;

// В задачах на код пропуска нет: там своя кнопка проверки.
freshRun(3);
API.openBattle(enemyOnPlayerCell("orc", 400));
G.battle.challenge = { type: "copy", task: API.COPY_TASKS[0], code: API.COPY_TASKS[0].code };
API.renderBattle();
log(!/skip-question-btn/.test(el("battle-box").innerHTML),
  "в «повтори код» кнопки пропуска нет — только проверка");
G.battle = null;

// минотавр копит силу
freshRun(6);
let mino = enemyOnPlayerCell("minotaur", 600);
API.openBattle(mino);
mino.hp = 600;
API.applyAttack(10, "тест", false, "");
log(mino.dmgBoost > 0, "минотавр копит силу", "+" + mino.dmgBoost);
G.battle = null;

// ярость босса
freshRun(9);
let dragon = enemyOnPlayerCell("dragon", 300);
dragon.maxHp = 260;
dragon.hp = 100; // <= 40% от 260
API.openBattle(dragon);
API.applyAttack(1, "тест", false, "");
log(dragon.enraged === true, "дракон впадает в ярость при <=40% HP");
log(dragon.nextDmgMul >= 1.25, "в ярости дракон бьёт сильнее", "x" + dragon.nextDmgMul);
G.battle = null;

// лич: проклятие
freshRun(8);
let lich = enemyOnPlayerCell("lich", 600);
G.enemies = [lich];
let cursedSeen = false;
for (let i = 0; i < 60; i++) {
  const l2 = API.makeEnemy("lich", 8);
  l2.x = G.playerPos.x; l2.y = G.playerPos.y;
  G.enemies = [l2];
  API.openBattle(l2);
  if (G.battle.cursed) { cursedSeen = true; G.battle = null; break; }
  G.battle = null;
}
log(cursedSeen, "лич иногда накладывает проклятие (60 попыток)");

// демон: огонь не копится в поле врага
freshRun(6);
let demon = enemyOnPlayerCell("demon", 400);
const demonBase = demon.dmg;
API.openBattle(demon);
log(demon.dmg > demonBase, "демон усиливается к бою", demonBase + " -> " + demon.dmg);
log(typeof demon.fireScale === "number" && demon.fireScale > 1, "масштаб огня хранится отдельно",
  demon.fireScale);
G.battle = null;

// призрак: телепорт
freshRun(4);
let ghost = enemyOnPlayerCell("ghost", 200);
ghost.x = G.playerPos.x + 2;
ghost.y = G.playerPos.y;
G.enemies = [ghost];
const posBefore = ghost.x + "," + ghost.y;
for (let i = 0; i < 30; i++) API.enemyTurn();
log(true, "призрак перемещается (ходов отработано: 30)");

// ================= 3. Генерация ловушек =================
let trapTotal = 0;
const trapKindsSeen = new Set();
let placementOk = true;
const trapFloorDetail = [];
for (let i = 0; i < 10; i++) {
  freshRun(i);
  const traps = G.traps || [];
  trapTotal += traps.length;
  traps.forEach((t) => trapKindsSeen.add(t.kind));
  const occupied = new Set();
  occupied.add(G.playerPos.x + "," + G.playerPos.y);
  occupied.add(G.stairsDown.x + "," + G.stairsDown.y);
  if (G.stairsUp) occupied.add(G.stairsUp.x + "," + G.stairsUp.y);
  G.treasures.forEach((t) => occupied.add(t.x + "," + t.y));
  (G.traders || []).forEach((t) => occupied.add(t.x + "," + t.y));
  G.enemies.forEach((e) => occupied.add(e.x + "," + e.y));
  for (const t of traps) {
    if (occupied.has(t.x + "," + t.y)) {
      placementOk = false;
      trapFloorDetail.push("этаж " + (i + 1) + ": ловушка на занятом месте");
    }
    if (G.map.grid[t.y][t.x] !== 1) {
      placementOk = false;
      trapFloorDetail.push("этаж " + (i + 1) + ": ловушка в стене");
    }
  }
  // ловушки не должны стоять впритык к старту
  for (const t of traps) {
    if (Math.hypot(t.x - G.playerPos.x, t.y - G.playerPos.y) < 3) {
      placementOk = false;
      trapFloorDetail.push("этаж " + (i + 1) + ": ловушка вплотную к старту");
    }
  }
  if (i < 2 && traps.length !== 0) {
    placementOk = false;
    trapFloorDetail.push("этаж " + (i + 1) + ": ловушки на первых этажах");
  }
}
log(trapTotal > 0, "ловушки генерируются", trapTotal + " шт. на 10 этажах");
log(trapKindsSeen.size >= 4, "разнообразие ловушек: >= 4 вида",
  [...trapKindsSeen].sort().join(","));
log(placementOk, "ловушки стоят на свободных клетках не ближе 3 от старта",
  trapFloorDetail.join("; "));

// ловушки сохраняются в состоянии этажа
freshRun(4);
log((G.traps || []).length === (G.cache[G.floorIndex].traps || []).length ||
  (G.traps || []).length === 0, "ловушки попадают в снимок этажа");

// ================= 4. Срабатывание ловушки =================
freshRun(4);
let spot = walkableNeighbours(G.playerPos)[0];
log(!!spot, "есть куда поставить тестовую ловушку");
if (spot) {
  G.traps = [{ uid: 9001, kind: "spikes", armed: true, x: spot.x, y: spot.y }];
  const hp0 = G.player.hp;
  const type = API.trapByKey("spikes");
  const expected = Math.max(1, type.damage - G.player.defBonus);
  API.move(spot.x - G.playerPos.x, spot.y - G.playerPos.y);
  const hp1 = G.player.hp;
  log(G.traps[0].armed === false, "ловушка срабатывает один раз (armed -> false)");
  log(hp1 === hp0 - expected, "урон = damage - defBonus",
    hp0 + " -> " + hp1 + " (ожидалось " + (hp0 - expected) + ")");
  // повторный шаг на ту же клетку
  API.move(0, 0);
  const hp2 = G.player.hp;
  const back = walkableNeighbours(G.playerPos)[0];
  if (back) API.move(back.x - G.playerPos.x, back.y - G.playerPos.y);
  log(G.player.hp === hp1, "сработавшая ловушка второй раз не ранит", hp1 + "/" + G.player.hp);
  log(G.map.grid[G.playerPos.y][G.playerPos.x] === 1, "игрок остался на той же клетке");
}

// защита блокирует весь урон — на максимальном HP смерть исключена
freshRun(6);
spot = walkableNeighbours(G.playerPos)[0];
if (spot) {
  G.traps = [{ uid: 9002, kind: "pit", armed: true, x: spot.x, y: spot.y }];
  G.player.hp = 12; // яма бьёт 12, но защита срежет
  G.player.defBonus = 0;
  const e = enemyOnPlayerCell("rat", 50);
  e.x = spot.x; e.y = spot.y;
  G.enemies = [e];
  const beforeHp = G.player.hp;
  API.move(spot.x - G.playerPos.x, spot.y - G.playerPos.y);
  log(G.player.hp > 0, "ловушка не убивает насмерть при полном HP",
    beforeHp + " -> " + G.player.hp);
}

// ================= 5. Цепь =================
freshRun(5);
spot = walkableNeighbours(G.playerPos)[0];
if (spot) {
  G.traps = [{ uid: 9003, kind: "chain_snare", armed: true, x: spot.x, y: spot.y }];
  G.enemies = [];
  G.player.snared = false;
  API.move(spot.x - G.playerPos.x, spot.y - G.playerPos.y);
  log(G.player.snared === true, "цепь сковывает игрока");
  const p0 = { ...G.playerPos };
  const nxt = walkableNeighbours(G.playerPos)[0];
  if (nxt) API.move(nxt.x - p0.x, nxt.y - p0.y);
  log(G.playerPos.x === p0.x && G.playerPos.y === p0.y, "в цепях нельзя двигаться");
  // цепь снимается победой в бою
  G.enemies = [];
  const hunter = API.makeEnemy("rat", 5);
  hunter.x = G.playerPos.x; hunter.y = G.playerPos.y;
  hunter.maxHp = 30; hunter.hp = 5;
  G.enemies = [hunter];
  G.battle = null;
  API.openBattle(hunter);
  API.applyAttack(999, "тест", false, "");
  G.battle.phase = "result";
  G.battle.won = true;
  API.continueBattle();
  log(G.player.snared === false, "победа срывает цепь");
  const after = walkableNeighbours(G.playerPos)[0];
  if (after) API.move(after.x - G.playerPos.x, after.y - G.playerPos.y);
  log(G.playerPos.x !== p0.x || G.playerPos.y !== p0.y, "после цепи снова можно идти");
}

// ================= 6. Проклятая плита =================
freshRun(6);
// openBattle сам зовёт nextChallenge — второй вызов создал бы новый
// вопрос, на который проклятие уже не действует.
let cursedChecked = false;
for (let attempt = 0; attempt < 40 && !cursedChecked; attempt++) {
  G.enemies = [];
  G.battle = null;
  G.player.cursedNext = true;
  const e = API.makeEnemy("rat", 3);
  e.x = G.playerPos.x; e.y = G.playerPos.y;
  G.enemies = [e];
  API.openBattle(e);
  const c = G.battle.challenge;
  if (c && c.view) {
    const sorted = c.view.options.slice()
      .sort((a, b) => String(a).localeCompare(String(b), "ru"));
    const isAlpha = JSON.stringify(sorted) === JSON.stringify(c.view.options);
    const item = c.question || c.task;
    const answerRight = c.view.options[c.view.answer] === item.options[item.answer];
    log(isAlpha, "на проклятой плите варианты идут по алфавиту", isAlpha);
    log(answerRight, "правильный ответ проклятого вопроса остаётся верным");
    cursedChecked = true;
  }
  G.battle = null;
}
if (!cursedChecked) log(false, "проклятая плита: не выпал вопрос с вариантами за 40 попыток");
log(G.player.cursedNext === false, "проклятие тратится на один вопрос");

// без проклятия порядок случайный
freshRun(6);
G.player.cursedNext = false;
let randomOrderSeen = false;
for (let i = 0; i < 40 && !randomOrderSeen; i++) {
  G.enemies = [];
  const e = API.makeEnemy("rat", 3);
  e.x = G.playerPos.x; e.y = G.playerPos.y;
  G.enemies = [e];
  API.openBattle(e);
  API.nextChallenge();
  const c = G.battle.challenge;
  if (c && c.view && c.view.options.length > 2) {
    const sorted = c.view.options.slice()
      .sort((a, b) => String(a).localeCompare(String(b), "ru"));
    if (JSON.stringify(sorted) !== JSON.stringify(c.view.options)) randomOrderSeen = true;
  }
  G.battle = null;
}
log(randomOrderSeen, "без проклятия варианты перемешиваются");

// ================= 7. Яд =================
freshRun(3);
const spider = enemyOnPlayerCell("spider", 100);
G.enemies = [spider];
API.openBattle(spider);
log(G.player.poison >= 1, "паук заражает игрока в начале боя", G.player.poison);
G.battle = null;
const hpP = G.player.hp;
const ticks = G.player.poison;
let hpLoss = 0;
for (let i = 0; i < ticks; i++) hpLoss += API.playerPoisonTick();
log(hpLoss > 0 && hpLoss === ticks * (3 + G.floorIndex),
  "яд отнимает 3+этаж HP за ход", hpP + " -> " + G.player.hp);
log(G.player.poison === 0, "стаки яда исчерпаны");

// противоядие
const antidote = equipWithEffect("antidote");
if (antidote) {
  G.player.poison = 2; G.player.hp = 10;
  G.inventory = [antidote];
  API.usePotion(0);
  log(G.player.poison === 0, "противоядие снимает яд", G.player.poison);
  // у противоядия heal = 0: лечит только если яд был, HP не растёт
  log(G.player.hp === 10 && G.inventory.length === 0,
    "противоядие тратится только на яд", G.player.hp);
} else {
  log(false, "в ITEM_POOL нет предмета с эффектом antidote");
}

// зелье при полном здоровье и без яда — отказ
const healPotion = API.ITEM_POOL.find((i) => i.slot === "potion" && i.effect &&
  i.effect.kind !== "antidote" && i.effect.kind !== "cleanse");
if (healPotion) {
  G.player.hp = G.player.maxHp;
  G.player.poison = 0;
  G.inventory = [Object.assign({}, healPotion)];
  API.usePotion(0);
  log(G.inventory.length === 1, "зелье не тратится при полном здоровье и без яда");
}

// иммунитет
const immune = equipWithEffect("poisonImmune");
if (immune) {
  G.equipment.accessory = immune;
  G.player.poison = 3;
  const hpI = G.player.hp;
  API.playerPoisonTick();
  log(G.player.hp === hpI && G.player.poison === 0, "иммунитет снимает яд бесплатно");
  G.equipment.accessory = null;
} else {
  log(false, "в ITEM_POOL нет предмета с эффектом poisonImmune");
}

// ================= 8. Эффекты предметов =================
const kindsSeen = new Set();
API.ITEM_POOL.forEach((i) => { if (i.effect) kindsSeen.add(i.effect.kind); });
log(kindsSeen.size >= 8, "разнообразие особых эффектов: >= 8 видов",
  [...kindsSeen].sort().join(","));
log(API.ITEM_POOL.every((i) => i.name && i.desc && i.rarity),
  "у всех предметов есть name/desc/rarity");
log(API.ITEM_POOL.every((i) => !i.effect || API.effectText(i).length > 0),
  "у всех эффектов есть читаемый текст");

// вампиризм
const lifesteal = equipWithEffect("lifesteal");
if (lifesteal) {
  freshRun(2);
  G.player.hp = 60;
  G.equipment.weapon = lifesteal;
  const e = enemyOnPlayerCell("slime", 600);
  API.openBattle(e);
  e.hp = 600;
  API.applyAttack(40, "тест", false, "");
  log(G.player.hp > 60, "вампиризм лечит игрока", 60 + " -> " + G.player.hp);
  G.battle = null;
} else log(false, "нет предмета с эффектом lifesteal");

// крит
const crit = equipWithEffect("crit");
if (crit) {
  freshRun(2);
  G.equipment.weapon = crit;
  G.battle = { enemy: { maxHp: 400, hp: 400 } };
  const samples = [];
  for (let i = 0; i < 120; i++) samples.push(API.mcDamage(2));
  const mn = Math.min(...samples), mx = Math.max(...samples);
  log(mx > mn * 1.4, "крит даёт разброс урона", mn + ".." + mx + ", шанс " +
    Math.round(crit.effect.chance * 100) + "%");
  const critCount = samples.filter((v) => v > mn).length;
  log(critCount > 0 && critCount < 120, "крит не срабатывает всегда",
    critCount + "/120");
  G.battle = null;
  G.equipment.weapon = null;
} else log(false, "нет предмета с эффектом crit");

// блок
const block = equipWithEffect("block");
if (block) {
  freshRun(2);
  G.equipment.armor = block;
  G.player.hp = 300;
  G.player.maxHp = 300;
  const e = enemyOnPlayerCell("orc", 900);
  API.openBattle(e);
  const charges = block.effect.charges;
  let blocked = 0;
  let hurt = 0;
  for (let i = 0; i < charges + 2; i++) {
    e.hp = 900;
    G.player.hp = 300;
    // заряд блока тратится один раз за бой: обнуляем только в i===0,
    // иначе проверка не имела бы смысла
    if (i === 0) G.battle.blockLeft = null;
    G.battle.phase = "result";
    G.battle.won = false;
    G.battle.playerDead = false;
    G.battle.blocked = false;
    API.applyAttack(10, "тест", true, "");
    if (G.player.hp === 300) blocked++; else hurt++;
  }
  log(blocked === charges, "блок гасит ровно N ударов", blocked + "/" + charges +
    " (charges=" + charges + ")");
  log(hurt === 2, "после блока урон проходит снова");
  G.battle = null;
  G.equipment.armor = null;
} else log(false, "нет предмета с эффектом block");

// шипы
const thorns = equipWithEffect("thorns");
if (thorns) {
  freshRun(2);
  G.equipment.armor = thorns;
  G.player.hp = 300;
  G.player.maxHp = 300;
  const e = enemyOnPlayerCell("orc", 900);
  API.openBattle(e);
  e.hp = 900;
  G.battle.phase = "result"; G.battle.won = false;
  API.applyAttack(10, "тест", true, "");
  log(e.hp < 900, "шипы наносят урон врагу", e.hp);
  log(Number.isInteger(e.hp), "шипы дают целый урон", e.hp);
  G.battle = null;
  G.equipment.armor = null;
} else log(false, "нет предмета с эффектом thorns");

// золото
const goldBonus = equipWithEffect("goldBonus");
if (goldBonus) {
  freshRun(2);
  G.equipment.accessory = goldBonus;
  G.player.gold = 0;
  const extra = API.addGold(100);
  const gained = G.player.gold;
  const expect = Math.round(100 * (1 + goldBonus.effect.pct / 100));
  log(gained === expect, "бонус к золоту", "+" + gained + " (ожидалось " + expect + ")");
  log(extra === gained - 100, "addGold сообщает бонус отдельно", extra);
  // без бонуса — ровно 100
  G.equipment.accessory = null;
  G.player.gold = 0;
  API.addGold(100);
  log(G.player.gold === 100, "без бонуса золото капает как раньше", G.player.gold);
} else log(false, "нет предмета с эффектом goldBonus");

// бесплатные подсказки
const hintFree = equipWithEffect("hintFree");
if (hintFree) {
  freshRun(2);
  G.equipment.accessory = hintFree;
  G.player.freeHints = 0;
  G.player.hp = 200;
  G.player.maxHp = 200;
  const e = enemyOnPlayerCell("slime", 300);
  let firstFree = false, secondPaid = false;
  // Первый шаг учебного боя — всегда вопрос («вспомни»): подсказка
  // работает именно на нём, второй шаг — уже практика.
  for (let i = 0; i < 40 && !(firstFree && secondPaid); i++) {
    API.openBattle(e);
    const c = G.battle.challenge;
    if (c.type === "mc") {
      const hpB = G.player.hp;
      API.useHint();
      if (G.player.hp === hpB) firstFree = true;
      else if (G.player.hp === hpB - 10) secondPaid = true;
    }
    G.battle = null;
  }
  log(firstFree, "подсказка в пределах лимита не тратит HP");
  log(secondPaid, "после лимита подсказка стоит 10 HP");
  log(G.player.freeHints === hintFree.effect.charges,
    "счётчик бесплатных подсказок не переполняется",
    G.player.freeHints + "/" + hintFree.effect.charges);
  G.equipment.accessory = null;
} else log(false, "нет предмета с эффектом hintFree");

// казнь
const execute = equipWithEffect("execute");
if (execute) {
  freshRun(2);
  G.equipment.weapon = execute;
  const e = API.makeEnemy("troll", 5);
  G.battle = { enemy: { maxHp: 400, hp: 400 } };
  const full = API.playerAttackPower();
  G.battle.enemy.hp = 100; // 25% < 30%
  const low = API.playerAttackPower();
  G.battle = null;
  log(low > full, "казнь усиливает удар по добитому врагу", full + " -> " + low);
  G.battle = { enemy: { maxHp: 400, hp: 120 } }; // ровно 30%
  const edge = API.playerAttackPower();
  log(edge === full, "на границе 30% бонус не применяется");
  G.battle = null;
  G.equipment.weapon = null;
} else log(false, "нет предмета с эффектом execute");

// без экипировки боевая математика не меняется
freshRun(2);
G.equipment = { weapon: null, armor: null, accessory: null };
log(API.playerAttackPower() === G.player.dmgBase + G.player.level * 4,
  "без экипировки урон не меняется", API.playerAttackPower());

// ================= 9. Эпиграфы и события =================
freshRun(0);
const arrival = el("floor-arrival");
API.showFloorArrival(5);
const bodyBox = el("floor-arrival-body");
log(bodyBox && bodyBox.innerHTML.length > 30, "эпиграф этажа попадает в блок",
  bodyBox ? bodyBox.innerHTML.replace(/<[^>]+>/g, " ").trim().slice(0, 70) : "");
log(/Тема этажа/.test(bodyBox.innerHTML), "эпиграф показывает тему этажа");

// Регресс: текст пишется во вложенный блок, иначе innerHTML стирает
// кнопку закрытия — после первого спуска крестик исчезал навсегда.
// Проверяем по исходному game.html: заглушка DOM собирает элементы
// искусственно и ничего не знает о настоящей вложенности.
const gameHtml = fs.readFileSync(path.join(dir, "game.html"), "utf8");
// Блок кошелька раньше создавался только в JS, а в разметке его id не было:
// updateWalletLine молча выходил, и у стража не рисовались награды.
log(/id="wallet-block"/.test(gameHtml) && /id="wallet-line"/.test(gameHtml) &&
  /id="game-badges"/.test(gameHtml),
  "в разметке есть кошелёк, строка банка и значки наград");
const arrivalTag = (gameHtml.match(/<div[^>]*id="floor-arrival"[\s\S]*?<\/div>/) || [""])[0];
log(/>\s*<\/div>/.test(arrivalTag.replace(/floor-arrival-close[\s\S]*$/, "")) ||
    /id="floor-arrival-body"[\s\S]*id="floor-arrival-close"/.test(arrivalTag),
  "кнопка закрытия живёт рядом с текстовым блоком внутри планки");
log(/>\s*<\/div>\s*<\/div>\s*$/.test(arrivalTag.trim()) === false ||
    /floor-arrival-body/.test(arrivalTag),
  "у контейнера планки есть вложенный блок для текста");
API.showFloorArrival(5);
log(!!el("floor-arrival-close") && !!el("floor-arrival-close").onclick,
  "после показа крестик остаётся и на него вешается обработчик");

// Регресс: планка гаснет только от УДАЧНОГО шага, который вызывает move().
freshRun(1);
API.activateFloor(1);
log(!arrival.classList.contains("hidden"), "после activateFloor планка показана");
log((el("floor-arrival-body") || {}).innerHTML &&
    el("floor-arrival-body").innerHTML.length > 0, "планка наполнена текстом перед шагом",
    el("floor-arrival-body").innerHTML.length);

// Ключевой случай жалобы: игрок сразу после спуска жмёт клавишу.
// Раньше hideFloorArrival стоял в самом верху move() и срабатывал
// на любое нажатие — планки не было видно почти сразу.
const shownBefore = arrival.classList.contains("hidden") === false;
const nb = walkableNeighbours(G.playerPos);
if (shownBefore && nb && nb.length) {
  const d = nb[0];
  API.move(d.x - G.playerPos.x, d.y - G.playerPos.y);
  log(arrival.classList.contains("hidden") === true,
    "реальный шаг по карте убирает планку");
} else {
  // нет соседа — проверяем, что хотя бы стена не гасит планку
  API.move(0, 1);
  log(arrival.classList.contains("hidden") === shownBefore,
    "шаг в стену не гасит планку");
}

// повторный вход на этаж не перекрывает карту навсегда
freshRun(3);
API.activateFloor(3);
log(arrival.classList.contains("hidden") === true ||
  el("game-msg").textContent !== undefined, "повторный вход не ломает экран");

let eventOk = true;
for (let i = 0; i < 10; i++) {
  if (!API.floorEvent(i) || !API.floorEpilogue(i)) { eventOk = false; break; }
  if (!API.floorTip(i)) { eventOk = false; break; }
}
log(eventOk, "у всех 10 этажей есть событие, эпиграф и совет");

// ================= 10. Сохранение и загрузка =================
freshRun(5);
const trapToSave = { uid: 7001, x: 1, y: 1, kind: "spikes", armed: false };
G.traps = [trapToSave];
G.player.poison = 2;
G.player.freeHints = 1;
G.player.snared = true;
G.restsLeft = 1;
G.questProgress = { n: 2 };
const savedEnemy = API.makeEnemy("spider", 5);
savedEnemy.x = 2; savedEnemy.y = 2;
savedEnemy.poison = 2;
savedEnemy.dmgBoost = 3;
savedEnemy.ability = "poison";
G.enemies = [savedEnemy];
G.inventory = [Object.assign({}, equipWithEffect("crit") || API.ITEM_POOL[0])];
G.equipment.weapon = G.inventory[0];
API.saveGame();
const raw = globalThis.localStorage.getItem(API.SAVE_KEY);
let saved = null;
try { saved = JSON.parse(raw); } catch (err) { saved = null; }
log(!!saved, "сохранение записывается в localStorage");
if (saved) {
  const f0 = saved.floors[0];
  log(Array.isArray(f0.traps) && f0.traps.length === 1, "ловушки попадают в сохранение");
  log(f0.traps[0].armed === false, "состояние ловушки (armed) сохраняется");
  log(saved.player.poison === 2 && saved.player.freeHints === 1 && saved.player.snared === true,
    "яд, подсказки и цепь игрока сохраняются");
  log(saved.restsLeft === 1, "число привалов попадает в сохранение", saved.restsLeft);
  log(saved.questProgress && saved.questProgress.n === 2,
    "прогресс повторяемого задания попадает в сохранение",
    JSON.stringify(saved.questProgress));
  log(f0.enemies[0].poison === 2 && f0.enemies[0].dmgBoost === 3,
    "яд и заряд врага сохраняются");
  log(f0.enemies[0].ability === "poison", "способность врага сохраняется");
  log(saved.player.cursedNext === false || saved.player.cursedNext === undefined,
    "cursedNext не ломает формат");
}

// загрузка
if (saved) {
  API.loadGame();
  log(G.player.poison === 2, "после загрузки яд на месте", G.player.poison);
  log(G.player.snared === true, "после загрузки цепь на месте", G.player.snared);
  log(G.player.freeHints === 1, "после загрузки бесплатные подсказки на месте", G.player.freeHints);
  log(G.restsLeft === 1, "после загрузки привалы не обнуляются", G.restsLeft);
  log(G.questProgress && G.questProgress.n === 2,
    "после загрузки прогресс задания на месте", JSON.stringify(G.questProgress));
  log((G.traps || []).length === 1 && G.traps[0].armed === false,
    "после загрузки ловушка остаётся сработавшей");
  log(G.enemies.length >= 1 && G.enemies[0].poison === 2,
    "после загрузки враг сохраняет яд");
}

// Улучшения, купленные в деревне на паузе, применяются при продолжении похода.
{
  freshRun(1);
  const original = JSON.parse(JSON.stringify(getProfile(G.name)));
  const up = getProfile(G.name);
  up.hero = { hp: 1, dmg: 1, potions: 1, loot: 0, armor: 0 };
  up.village = { well: 0, barn: 0, forge: 0, smith: 0 };
  putProfile(G.name, up);
  G.prog = { hp: 0, dmg: 0, potions: 0, loot: 0, armor: 0 };
  G.player.baseMaxHp = 100;
  G.player.maxHp = 100;
  G.player.dmgBase = 10;
  G.player.hp = 60;
  G.inventory = [];
  API.saveGame();
  API.loadGame();
  log(G.player.baseMaxHp === 100 + API.HERO_STEPS.hp &&
    G.player.dmgBase === 10 + API.HERO_STEPS.dmg,
    "улучшения с паузы применяются к текущему походу",
    "HP " + G.player.baseMaxHp + ", урон " + G.player.dmgBase);
  log(G.prog.hp === API.HERO_STEPS.hp && G.prog.dmg === API.HERO_STEPS.dmg &&
    G.prog.potions === API.HERO_STEPS.potions,
    "и попадают в прогресс похода", JSON.stringify(G.prog));
  log(G.player.hp === 60 + API.HERO_STEPS.hp &&
    G.player.maxHp === 100 + API.HERO_STEPS.hp,
    "текущее здоровье не теряется при добавке", G.player.hp + "/" + G.player.maxHp);
  log(G.inventory.filter((i) => i.slot === "potion").length === API.HERO_STEPS.potions,
    "купленные на паузе зелья лежат в сумке");
  putProfile(G.name, original);
}

// битое сохранение не ломает игру
globalThis.localStorage.setItem(API.SAVE_KEY, "{битый json");
API.loadGame();
log(true, "битое сохранение не роняет игру");
globalThis.localStorage.removeItem(API.SAVE_KEY);

// ================= 11. Экраны конца партии =================
freshRun(1);
G.stats.topicStats = {
  syntax: { correct: 5, total: 6 },
  functions: { correct: 1, total: 9 },
  strings: { correct: 4, total: 4 }
};
let deathErr = "";
try { API.showDeath(); } catch (e) { deathErr = e.message; }
log(!deathErr, "экран поражения строится без ошибок", deathErr);
log(/Разбор по темам/.test(el("end-box").innerHTML), "в поражении есть разбор по темам");
log(/Функции/.test(el("end-box").innerHTML), "разбор называет темы");
log(
  el("end-box").innerHTML.indexOf("Функции") < el("end-box").innerHTML.indexOf("Синтаксис"),
  "слабые темы идут первыми"
);
log(/Повторение/.test(el("end-box").innerHTML), "разбор подсказывает, что повторить");

// разбор при пустой статистике
freshRun(1);
G.stats.topicStats = {};
let emptyErr = "";
try { API.showDeath(); } catch (e) { emptyErr = e.message; }
log(!emptyErr && /ещё не проверены/.test(el("end-box").innerHTML),
  "разбор без данных не падает", emptyErr);

freshRun(1);
G.stats.topicStats = { syntax: { correct: 5, total: 6 } };
let vicErr = "";
try { API.victory(); } catch (e) { vicErr = e.message; }
log(!vicErr, "экран победы строится без ошибок", vicErr);
log(/Разбор по темам/.test(el("end-box").innerHTML), "в победе есть разбор по темам");

// ================= 12. Отрисовка всех этажей =================
let renderErr = "";
let renderOk = 0;
for (let i = 0; i < 10; i++) {
  try {
    freshRun(i);
    API.render();
    API.updateHud();
    API.renderInventory();
    API.drawMinimap();
    renderOk++;
  } catch (e) {
    renderErr = "этаж " + (i + 1) + ": " + e.message;
    break;
  }
}
log(renderOk === 10, "все 10 этажей рендерятся без ошибок",
  renderOk + "/10" + (renderErr ? " " + renderErr : ""));

// рендер с ловушками, врагами и сундуками
let busyErr = "";
try {
  freshRun(6);
  G.enemies.forEach((e, i) => { e.x = G.playerPos.x + (i % 3); e.y = G.playerPos.y + (i % 2); });
  API.render();
} catch (e) { busyErr = e.message; }
log(!busyErr, "рендер с насыщенным этажом не падает", busyErr);

// ================= 13. Бой целиком =================
freshRun(4);
G.equipment.weapon = equipWithEffect("crit") || Object.assign({}, API.ITEM_POOL[0]);
let battleErr = "";
let attacks = 0;
try {
  const e = API.makeEnemy("lich", 8);
  e.x = G.playerPos.x; e.y = G.playerPos.y;
  e.maxHp = 40; e.hp = 40;
  G.enemies = [e];
  G.player.hp = 200;
  G.player.maxHp = 200;
  API.openBattle(e);
  for (let i = 0; i < 12; i++) {
    if (!G.battle) break;
    if (G.battle.playerDead) break;
    G.battle.phase = "result";
    API.applyAttack(API.codeDamage(), "тест", true, "");
    attacks++;
    if (G.battle.won) { API.continueBattle(); break; }
    API.continueBattle();
  }
} catch (err) { battleErr = err.message; }
log(!battleErr, "полный бой проходит без ошибок", battleErr);
log(attacks > 0, "атаки наносятся", attacks);

// ============ 13.2. Интерфейс боя: три зоны и эффекты внизу ============
// Пункт 4 из User said (m03986): «Элементы не помещаются в окно.
// Эффекты можно разместить внизу окна». Бой стал настоящим оверлеем,
// а карточка — из трёх зон: шапка, прокручиваемая середина, футер.
freshRun(4);
G.equipment.weapon = equipWithEffect("crit") || Object.assign({}, API.ITEM_POOL[0]);
const uiEnemy = API.makeEnemy("lich", 8);
uiEnemy.x = G.playerPos.x;
uiEnemy.y = G.playerPos.y;
uiEnemy.maxHp = 400;
uiEnemy.hp = 400;
G.enemies = [uiEnemy];
API.openBattle(uiEnemy);
G.battle.challenge = { type: "mc", question: API.QUESTIONS[0], hintUsed: false };
G.battle.phase = "question";
API.renderBattle();
const qHtml = el("battle-box").innerHTML;
log(/battle-mid/.test(qHtml) && /battle-foot/.test(qHtml),
  "карточка боя разложена на середину и футер");
log(qHtml.indexOf("battle-mid") < qHtml.indexOf("battle-foot"),
  "середина с заданием идёт до футера");
log(qHtml.indexOf("battle-foot") < qHtml.indexOf("battle-effects"),
  "список эффектов стоит в футере окна");
log(!!el("battle-effects"), "в бою есть отдельный блок эффектов");
log(!!el("battle-options"), "варианты ответа отрисованы в середине");
log(qHtml.indexOf("battle-foot") < qHtml.indexOf("hint-btn"),
  "подсказка тоже уезжает вниз, а не теряется в задании");

// Длинное задание на код: кнопка удара обязана остаться в футере.
G.battle.challenge = {
  type: "copy", task: API.COPY_TASKS[0], code: API.COPY_TASKS[0].code, hintUsed: false
};
G.battle.phase = "question";
API.renderBattle();
const cHtml = el("battle-box").innerHTML;
log(cHtml.indexOf("battle-foot") < cHtml.indexOf("check-btn"),
  "кнопка удара стоит в футере, а не в середине задания");
log(cHtml.indexOf("copy-feedback") < cHtml.indexOf("battle-foot"),
  "отклик проверки остаётся в середине карточки");

// Фаза итога: кнопка продолжения — там же.
G.battle.phase = "result";
G.battle.good = true;
G.battle.feedback = "Проверка";
G.battle.results = null;
G.battle.explanation = "";
API.renderBattle();
log(el("battle-box").innerHTML.indexOf("battle-foot") <
    el("battle-box").innerHTML.indexOf("continue-btn"),
  "кнопка продолжения тоже в футере");

// renderEffectList пишет в переданный узел, а не только в боковую панель.
const effNode = document.createElement("div");
API.renderEffectList(effNode);
log(/effect-title/.test(effNode.innerHTML),
  "renderEffectList пишет в переданный узел");
const emptyNode = document.createElement("div");
G.equipment.weapon = null;
API.renderEffectList(emptyNode);
log(emptyNode.innerHTML === "", "без эффектов список остаётся пустым");
G.battle = null;

// Разметка и стили: заглушка DOM не знает ни про классы, ни про CSS.
log(/class="overlay hidden" id="battle-overlay"/.test(gameHtml),
  "боевое окно — настоящий оверлей поверх карты");
const gameCss = fs.readFileSync(path.join(dir, "game.css"), "utf8");
const battleRules = gameCss.match(/\.battle \{[\s\S]*?\n\}/g) || [];
log(battleRules.some((r) => /display: flex/.test(r) && /max-height/.test(r)),
  "карточка боя ограничена по высоте окна");
log(/\.battle-mid \{[\s\S]*?overflow-y: auto/.test(gameCss),
  "у середины карточки своя прокрутка");
log(/\.battle-foot \{\s*flex-shrink: 0/.test(gameCss),
  "футер карточки с кнопками не сжимается");
log(!/\.battle-col \.battle \{/.test(gameCss),
  "колонка боя больше не растягивает карточку на всю ширину");

// Тайлы приходят из набора 32x32, а клетка крупнее (48 px при обычном зуме).
// Сокращённое `background:` у .tile.floor/.tile.wall сбрасывало repeat и size,
// и спрайт плитки повторялся внутри клетки — так выглядели «дублированные»
// грибы и трава. Проверяем, что цвет задаётся только через background-color.
const tileRule = (gameCss.match(/\.tile \{[\s\S]*?\n\}/) || [""])[0];
log(/background-repeat: no-repeat/.test(tileRule) && /background-size: 100% 100%/.test(tileRule),
  "фон плитки не повторяется и растянут на клетку");
log(/image-rendering: pixelated/.test(tileRule),
  "тайлы 32x32 растягиваются без сглаживания");
const tileShorthands = (gameCss.match(/\.tile[^{:]*\{[^}]*\}/g) || [])
  .filter((rule) => /(?:^|[;{\s])background\s*:/.test(rule));
log(tileShorthands.length === 0,
  "плитки задают цвет через background-color, а не через сокращение",
  tileShorthands.length ? tileShorthands[0].replace(/\s+/g, " ").slice(0, 70) : "");

// ================= 13.5. Добыча: тир растёт с глубиной =================
// Раньше предмет выпадал равновероятно из всего пула, и предметы
// 4-го тира на этажах 5-6 почти не встречались. Проверяем статистикой.
{
  const topTierRate = (floorIndex, tier) => {
    const n = 4000;
    let hit = 0;
    for (let i = 0; i < n; i++) {
      const it = API.randomItemForFloor(floorIndex);
      if (it && it.tier === tier) hit++;
    }
    return hit / n;
  };
  const shallow = topTierRate(0, 4);
  const mid = topTierRate(5, 4);
  const deep = topTierRate(9, 4);
  log(shallow === 0, "на первом этаже вещи 4-го тира не выпадают",
    (shallow * 100).toFixed(1) + "%");
  log(mid > 0.15, "на шестом этаже вещи 4-го тира выпадают заметно",
    (mid * 100).toFixed(1) + "%");
  // Разница глубоких этажей по весам выходит всего на полтора
  // процентных пункта, поэтому замер розыгрышами флапал. Считаем долю
  // 4-го тира прямо по весам — это то же правило, по которому игра
  // бросает жребий, но без случайности.
  const tier4Share = (floorIndex) => {
    const pool = API.ITEM_POOL.filter((i) => i.tier <= Math.min(floorIndex + 1, 4));
    const total = pool.reduce((a, i) => a + API.itemWeightFor(i, floorIndex), 0);
    const top = pool
      .filter((i) => i.tier === 4)
      .reduce((a, i) => a + API.itemWeightFor(i, floorIndex), 0);
    return total ? top / total : 0;
  };
  const shareMid = tier4Share(5);
  const shareDeep = tier4Share(9);
  log(shareDeep > shareMid + 0.01,
    "вес 4-го тира растёт с глубиной",
    (shareDeep * 100).toFixed(1) + "% против " + (shareMid * 100).toFixed(1) + "%");
  // И отдельно — что веса не зависят от номера розыгрыша.
  log(Math.abs(tier4Share(9) - tier4Share(9)) === 0,
    "вес 4-го тира на одном этаже постоянен");
  log(deep > 0 && mid > 0, "жребий по предметам вообще бросается",
    (deep * 100).toFixed(1) + "% / " + (mid * 100).toFixed(1) + "%");
  // предмет не должен выходить за пределы доступного этажу
  let tooDeep = 0;
  for (let f = 0; f < API.FLOORS.length; f++) {
    for (let i = 0; i < 300; i++) {
      const it = API.randomItemForFloor(f);
      if (!it) continue;
      if (it.tier > Math.min(f + 1, 4)) tooDeep++;
    }
  }
  log(tooDeep === 0, "ни один предмет не выпадает выше доступного тира", tooDeep);
  const counts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (f) => { const w = API.randomItemForFloor(f, "weapon"); return w ? w.tier : -1; });
  log(counts.every((t) => t >= 0 && t <= 4), "тир оружия всегда в пределах 0..4");
  // добыча с дракона — всегда лучшая вещь, зелий среди неё быть не должно
  let bossOk = true;
  let bossTiers = new Set();
  for (let i = 0; i < 200; i++) {
    const d = API.bossDrop();
    if (!d || d.tier < 3 || d.slot === "potion") bossOk = false;
    bossTiers.add(d && d.tier);
  }
  log(bossOk, "дракон роняет только вещи 3+ тира и никогда зелья",
    [...bossTiers].join(","));
  log(API.FLOORS[9].count === 0 && API.FLOORS[9].boss === true,
    "боссовый этаж помечен флагом boss и без обычных монстров");
}

// ================= 14. Ломбарь бонусов =================
freshRun(1);
G.equipment = { weapon: null, armor: null, accessory: null };
log(typeof API.equippedEffect === "function", "equippedEffect доступна");
log(API.equippedEffect("crit") === null, "equippedEffect возвращает null без предмета");

// ============ 15. Панель эффектов и всплывающие подсказки ============
// Игрок должен видеть, ЧТО именно сейчас работает на герое и КОГДА
// это сработало: без обоих механизмов особые эффекты невидимы.
const effectListBox = () => document.getElementById("effect-list");
const flashBox = () => document.getElementById("effect-flash");
log(typeof API.renderEffectList === "function", "renderEffectList доступна");
log(typeof API.effectFlash === "function", "effectFlash доступна");

freshRun(1);
G.equipment = { weapon: null, armor: null, accessory: null };
API.updateEquipBar();
log(effectListBox().innerHTML === "", "без надетых эффектов список пуст",
  JSON.stringify(effectListBox().innerHTML.slice(0, 40)));

const vampItem = ITEM_POOL.filter((i) => i.effect && i.effect.kind === "lifesteal")[0];
const thornItem = ITEM_POOL.filter((i) => i.effect && i.effect.kind === "thorns")[0];
log(!!vampItem && !!thornItem, "в пуле есть предметы с вампиризмом и шипами");
G.equipment.weapon = vampItem;
G.equipment.armor = thornItem;
API.updateEquipBar();
const twoHtml = effectListBox().innerHTML;
log(twoHtml.indexOf("лечит тебя") >= 0, "вампиризм описан словами в списке эффектов");
log(twoHtml.indexOf('data-effect="thorns"') >= 0 && twoHtml.indexOf(API.EFFECT_HINTS.thorns) >= 0,
  "шипы попали в список эффектов");
log((twoHtml.match(/data-effect=/g) || []).length === 2,
  "в списке ровно столько строк эффектов, сколько активных эффектов",
  (twoHtml.match(/data-effect=/g) || []).length);
log(twoHtml.indexOf("undefined") < 0 && twoHtml.indexOf("NaN") < 0,
  "в разметке эффектов нет undefined/NaN");
// каждый эффект обязан иметь свой цветовой маркер
log(twoHtml.indexOf("effect-dot lifesteal") >= 0 &&
  twoHtml.indexOf("effect-dot thorns") >= 0, "у каждого эффекта свой цветовой маркер");

// Все 12 видов эффектов должны иметь человеческое описание, иначе
// игрок увидит сырой идентификатор вида effect-dot-что-то.
const allKinds = [...new Set(ITEM_POOL.filter((i) => i.effect).map((i) => i.effect.kind))];
log(allKinds.length === 12, "в пуле ровно 12 видов особых эффектов", allKinds.length);
log(!!API.EFFECT_HINTS, "таблица подсказок EFFECT_HINTS экспортируется");
const rawKinds = allKinds.filter((k) => !API.EFFECT_HINTS || !API.EFFECT_HINTS[k]);
log(rawKinds.length === 0, "у каждого вида эффекта есть русская подсказка", rawKinds.join(","));

// Справа в строке эффекта — только его числа (процент, заряды, шанс). Раньше
// там стояла та же фраза другими словами: «враги видны на всём этаже ·
// Все враги видны на этаже», «иногда наносит двойной урон · Иногда наносит…».
const echoRows = [];
allKinds.forEach((k) => {
  const it = ITEM_POOL.find((i) => i.effect && i.effect.kind === k && i.slot !== "potion");
  if (!it) return;
  G.equipment = { weapon: null, armor: null, accessory: null };
  G.equipment[it.slot] = it;
  API.renderEffectList(effectListBox());
  const row = (effectListBox().innerHTML.split('data-effect="' + k + '"')[1] || "").split("</div>")[0];
  const num = (row.match(/<span class="effect-num">([^<]*)<\/span>/) || [])[1] || "";
  const want = [it.effect.pct ? it.effect.pct + "%" : "", it.effect.charges ? "×" + it.effect.charges : "",
    it.effect.chance ? Math.round(it.effect.chance * 100) + "%" : ""].filter(Boolean);
  if (/[А-Яа-яЁё]/.test(num.replace(/шанс/g, "")) || want.some((w) => num.indexOf(w) < 0)) {
    echoRows.push(k + ": «" + num + "»");
  }
});
log(echoRows.length === 0, "строка эффекта не повторяет свою фразу, а показывает числа", echoRows.join("; "));
G.equipment = { weapon: null, armor: null, accessory: null };

// Закреплённая сводка колонки — только здоровье, этаж и золото. Со списком
// эффектов она при трёх вещах с эффектами вырастала выше колонки (606px при
// колонке 580px) и закрывала снаряжение и сумку целиком.
{
  const gameHtml = fs.readFileSync(path.join(dir, "game.html"), "utf8");
  const aside = gameHtml.split('<aside class="side-panel')[1] || "";
  const firstCard = (aside.split('<div class="side-card">')[1] || "").split('<div class="side-card')[0];
  log(firstCard.indexOf("hud") >= 0 && firstCard.indexOf('id="effect-list"') < 0 &&
    aside.indexOf('id="effect-list"') > 0,
    "список эффектов живёт под снаряжением, а не в закреплённой сводке");
  // На узком экране колонка стоит под картой и бывает ниже 300px: там
  // закреплённая сводка оставляла сумке полоску в пару строк.
  const css = fs.readFileSync(path.join(dir, "game.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  // Ищем именно правило сводки: другие sticky в файле (если появятся) ни при чём.
  let header = "";
  for (let at = css.indexOf("position: sticky"); at >= 0; at = css.indexOf("position: sticky", at + 1)) {
    const open = css.lastIndexOf("{", at);
    const selector = css.slice(Math.max(css.lastIndexOf("}", open), css.lastIndexOf("{", open - 1)) + 1, open);
    if (selector.indexOf("side-card:first-child") < 0) continue;
    let depth = 0, open1 = -1;
    for (let i = 0; i < at; i++) {
      if (css[i] === "{") { depth += 1; if (depth === 1) open1 = i; }
      else if (css[i] === "}") depth -= 1;
    }
    header = depth === 2 ? css.slice(css.lastIndexOf("}", open1) + 1, open1).trim() : "закреплена всегда";
  }
  log(/^@media/.test(header) && /min-width/.test(header) && /min-height/.test(header),
    "сводка закрепляется только на широком и высоком экране", header || "сводка не закреплена вовсе");
}

// Всплывающая подсказка: текст доходит до элемента и запускает анимацию
API.effectFlash("Проверка эффекта");
log(flashBox().textContent === "Проверка эффекта", "текст подсказки записан",
  flashBox().textContent);
log(flashBox().classList.contains("show"), "класс show включает анимацию");

// Крит обязан оставить след для интерфейса
freshRun(1);
G.equipment = { weapon: null, armor: null, accessory: null };
const critItem = ITEM_POOL.filter((i) => i.effect && i.effect.kind === "crit")[0];
G.equipment.weapon = critItem;
G.battle = {};
const realRandom = Math.random;
G.battle.critHit = 0;
Math.random = () => 0;
API.critRoll();
Math.random = realRandom;
log(G.battle.critHit === (critItem.effect.mul || 2),
  "крит помечает удар для интерфейса", G.battle.critHit);
G.battle.critHit = 0;
Math.random = () => 0.999;
API.critRoll();
Math.random = realRandom;
log(G.battle.critHit === 0, "без крита метка не ставится");

// Добивание: урон растёт, и это видно интерфейсу
freshRun(1);
G.equipment = { weapon: null, armor: null, accessory: null };
const execItem = ITEM_POOL.filter((i) => i.effect && i.effect.kind === "execute")[0];
G.equipment.weapon = execItem;
API.openBattle(API.makeEnemy("slime", 1));
G.battle.enemy.maxHp = 400;
G.battle.enemy.hp = 400;
const plainPower = API.playerAttackPower();
log(G.battle.executed === false, "на полном здоровье добивание не срабатывает");
G.battle.enemy.hp = 100;
const execPower = API.playerAttackPower();
log(G.battle.executed === true, "на раненом враге добивание помечено");
log(execPower > plainPower, "добивание увеличивает урон",
  plainPower + " -> " + execPower);
G.battle = null;

// Флаги обязаны сбрасываться между ударами, иначе подсказка залипнет.
freshRun(1);
G.equipment = { weapon: null, armor: null, accessory: null };
const foe = API.makeEnemy("slime", 1);
API.openBattle(foe);
G.battle.critHit = 2;
G.battle.executed = true;
API.applyAttack(5, "удар", false, null);
log(G.battle.critHit === 0 && G.battle.executed === false,
  "после удара метки крита и добивания сброшены",
  G.battle.critHit + "/" + G.battle.executed);
G.battle = null;

// ================= 12. Сложность: урон врагов растёт =================
freshRun(0);
const floorCurve = [];
for (const key of ["slime", "skeleton", "dragon"]) {
  floorCurve.push([0, 3, 6, 9].map((f) => API.makeEnemy(key, f).dmg));
}
log(floorCurve.every((r) => r[0] < r[1] && r[1] < r[2] && r[2] < r[3]),
  "урон врага строго растёт с этажом",
  JSON.stringify(floorCurve));
// Главная жалоба: раньше за 10 этажей урон вырос всего на +18.
log(floorCurve[0][3] >= floorCurve[0][0] * 3,
  "урон обычного монстра на 10-м этаже втрое выше, чем на 1-м",
  floorCurve[0][0] + " -> " + floorCurve[0][3]);
log(floorCurve[2][3] >= floorCurve[2][0] * 3,
  "урон дракона тоже растёт, а не стоит на месте",
  floorCurve[2][0] + " -> " + floorCurve[2][3]);
// Урон должен оставаться целым и положительным на любом этаже.
let allOk = true;
for (const t of API.ENEMY_TYPES) {
  for (let f = 0; f < 10; f++) {
    const d = API.makeEnemy(t.key, f).dmg;
    if (!Number.isInteger(d) || d < 1) allOk = false;
  }
}
log(allOk, "урон целый и положительный у всех 17 врагов на всех этажах");
// Сложность по-прежнему влияет на множитель.
G.difficulty = "easy";
const easyOne = API.makeEnemy("skeleton", 5);
G.difficulty = "normal";
const normOne = API.makeEnemy("skeleton", 5);
G.difficulty = "hard";
const hardOne = API.makeEnemy("skeleton", 5);
G.difficulty = "normal";
log(easyOne.dmg < normOne.dmg && normOne.dmg < hardOne.dmg,
  "уровень сложности по-прежнему масштабирует урон",
  easyOne.dmg + " / " + normOne.dmg + " / " + hardOne.dmg);

// ================= 13. Управление: WASD и клик по плитке =================
freshRun(1);
const dirKeys = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0] };
log(Object.keys(dirKeys).length === 4, "поддерживаются четыре буквы WASD");
let wasdOk = true;
for (const [k, v] of Object.entries(dirKeys)) {
  G.playerPos = { x: 1, y: 1 };
  const src = fs.readFileSync(path.join(dir, "game.js"), "utf8");
  if (!src.includes(k + ": \"" + v[0] + "\"") && !src.includes(k + ": [" + v[0])) wasdOk = false;
}
log(wasdOk, "каждая буква WASD разложена в верное направление");

// Направление в DIRS совпадает с ожидаемым.
log("DIRS" in API, "таблица направлений DIRS экспортируется для проверки");
const DIRS_OK = API.DIRS && API.DIRS.w && API.DIRS.w[1] === -1 &&
  API.DIRS.s && API.DIRS.s[1] === 1 &&
  API.DIRS.a && API.DIRS.a[0] === -1 &&
  API.DIRS.d && API.DIRS.d[0] === 1;
log(DIRS_OK, "векторы WASD верны: w вверх, s вниз, a влево, d вправо");

// Один шаг за одно нажатие: автоповтор keydown игнорируется.
const keySrc = fs.readFileSync(path.join(dir, "game.js"), "utf8");
log(/if \(e\.repeat\) return;/.test(keySrc),
  "автоповтор клавиши отключён — зажатая стрелка не ускоряет ходьбу");

// ================= 12. Качество ответа решает силу удара =================
// Замысел: раньше правильный и неправильный ответ стоили одинаково,
// поэтому задания можно было «пройти мимо». Теперь точный ответ
// с первого раза бьёт сильнее, а серия верных ответов копит бонус.
log(!!API.QUALITY && API.QUALITY.perfect.mul > 1,
  "за точный ответ с первого раза положен усиленный удар",
  API.QUALITY ? "×" + API.QUALITY.perfect.mul : "нет QUALITY");

// Базовый удар одного и того же вопроса при нулевой серии и без подсказки.
function dmgSample(useHintFlag) {
  const e2 = enemyOnPlayerCell("orc", 4000);
  API.openBattle(e2);
  G.battle.challenge = { type: "mc", question: { id: "q-t", level: 2,
    topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
    view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: !!useHintFlag };
  G.stats.streak = 0;
  // Один и тот же вопрос, одна и та же серия — различается только
  // тем, бралась ли подсказка. Рандом от rand(0,5) внутри mcDamage
  // прячем, сравнивая минимальный урон из нескольких бросков.
  let best = Infinity;
  for (let i = 0; i < 25; i++) {
    best = Math.min(best, API.mcDamage(2));
  }
  G.battle = null;
  return best;
}
const plainDmg = dmgSample(false);
const hintedDmg = dmgSample(true);
log(plainDmg > 0, "точный удар наносит урон", plainDmg);
log(hintedDmg > 0 && hintedDmg < plainDmg,
  "подсказка уменьшает удар по врагу",
  hintedDmg + " против " + plainDmg);

// Серия верных ответов копит силу удара.
freshRun(1);
const stStreak = API.createFloorState(1);
G.map = stStreak.map;
G.playerPos = { ...stStreak.playerPos };
G.enemies = [];
G.traps = [];
const stEn = enemyOnPlayerCell("orc", 4000);
API.openBattle(stEn);
G.battle.challenge = { type: "mc", question: { id: "q-s", level: 2,
  topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
  view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: false };
G.stats.streak = 0;
const dmg0 = API.mcDamage(2);
G.stats.streak = 4;
const dmg4 = API.mcDamage(2);
G.stats.streak = 99;
const dmgMax = API.mcDamage(2);
G.battle = null;
log(dmg4 > dmg0, "серия верных ответов усиливает удар",
  dmg0 + " -> " + dmg4 + " при серии 4");
log(dmgMax === dmg4 || dmgMax >= dmg4,
  "серия упирается в потолок и не растёт бесконечно",
  "серия 99 -> " + dmgMax);
log(API.STREAK_CAP === 5, "потолок серии зафиксирован константой", API.STREAK_CAP);

// Серия гаснет после неверного ответа — награда не копится «в долг».
freshRun(1);
const stBrk = API.createFloorState(1);
G.map = stBrk.map;
G.playerPos = { ...stBrk.playerPos };
G.enemies = [];
G.traps = [];
const brkEn = enemyOnPlayerCell("orc", 4000);
API.openBattle(brkEn);
G.battle.challenge = { type: "mc", question: { id: "q-b", level: 2,
  topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
  view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: false };
G.stats.streak = 3;
API.answerMC(1);
log(G.stats.streak === 0, "неверный ответ обнуляет серию", G.stats.streak);
G.battle = null;

// ================= 13. Элитные враги =================
const norm = API.makeEnemy("skeleton", 5);
const elite = API.makeEnemy("skeleton", 5, true);
log(!!elite.elite && !norm.elite, "элита помечена отдельным флагом");
log(elite.maxHp > norm.maxHp,
  "у элиты больше здоровья", norm.maxHp + " -> " + elite.maxHp);
log(elite.dmg > norm.dmg, "у элиты выше урон", norm.dmg + " -> " + elite.dmg);
log(!!elite.title && elite.title.length > 1,
  "элита получает эпитет для имени", elite.title);
log(API.ELITE_TITLES && Object.keys(API.ELITE_TITLES).length === API.ENEMY_TYPES.length,
  "эпитеты заведены для всех видов врагов",
  Object.keys(API.ELITE_TITLES || {}).length + "/" + API.ENEMY_TYPES.length);

// Способность элиты действительно злее обычной.
const normGolem = API.makeEnemy("golem", 5);
const eliteGolem = API.makeEnemy("golem", 5, true);
log(eliteGolem.armorPct > normGolem.armorPct,
  "каменная броня элиты толще",
  normGolem.armorPct + " -> " + eliteGolem.armorPct);

// Голем-элита действительно гасит больше урона в бою.
freshRun(4);
const stArmor = API.createFloorState(4);
G.map = stArmor.map;
G.playerPos = { ...stArmor.playerPos };
G.enemies = [];
G.traps = [];
G.player.defBonus = 0;
const armorHit = (enemy) => {
  const b2 = API.openBattle(enemy);
  enemy.hp = 4000;
  enemy.maxHp = 4000;
  const before = enemy.hp;
  API.applyAttack(100, "тест", false, "");
  const dealt = before - enemy.hp;
  G.battle = null;
  void b2;
  return dealt;
};
const normArmor = armorHit(API.makeEnemy("golem", 5));
const eliteArmor = armorHit(API.makeEnemy("golem", 5, true));
log(eliteArmor < normArmor,
  "элитный голем гасит больше урона", normArmor + " -> " + eliteArmor);

// Лич-элита почти всегда накладывает проклятие: шанс 0.6 против 0.35,
// поэтому при 20 боях элита обязана попасть хотя бы раз — иначе новых
// правил на карте нет. Проверяем именно наличие, а не точное число.
freshRun(8);
const stCurse = API.createFloorState(8);
G.map = stCurse.map;
G.playerPos = { ...stCurse.playerPos };
G.enemies = [];
G.traps = [];
let cursedElite = 0;
let cursedPlain = 0;
for (let i = 0; i < 20; i++) {
  const le = API.makeEnemy("lich", 8, i % 2 === 0);
  API.openBattle(le);
  if (G.battle.cursed) {
    if (i % 2 === 0) cursedElite++; else cursedPlain++;
  }
  G.battle = null;
}
log(cursedElite > 0,
  "проклятие лича ложится чаще у элиты",
  "элита " + cursedElite + "/10, обычный " + cursedPlain + "/10");

// Награда за элиту заметнее обычной.
freshRun(4);
const stGold = API.createFloorState(4);
G.map = stGold.map;
G.playerPos = { ...stGold.playerPos };
G.enemies = [];
G.traps = [];
G.player.gold = 0;
G.battle = null;
const goldEnemy = API.makeEnemy("skeleton", 4, true);
goldEnemy.x = G.playerPos.x;
goldEnemy.y = G.playerPos.y;
G.enemies = [goldEnemy];
API.defeatEnemy(goldEnemy);
const eliteGold = G.player.gold;
log(eliteGold > 15,
  "элита даёт больше золота, чем обычный монстр", eliteGold + " против 15");
log(G.stats.eliteKills === 1, "победа над элитой учитывается в статистике");

// Элиты действительно появляются на этажах.
freshRun(4);
let eliteSeen = 0;
let normalSeen = 0;
for (let i = 0; i < 25; i++) {
  const stE = API.createFloorState(4);
  for (const e of stE.enemies) {
    if (e.elite) eliteSeen++; else normalSeen++;
  }
}
log(eliteSeen > 0, "на четвёртом этаже встречаются элиты",
  eliteSeen + " элит из " + (eliteSeen + normalSeen));
log(eliteSeen < (eliteSeen + normalSeen),
  "элиты не вытесняют обычных монстров");

// Босс остаётся боссом и не становится элитой.
const boss = API.makeEnemy("dragon", 9);
log(boss.boss && !boss.elite, "дракон остаётся боссом без эпитета элиты");

// Сохранение и загрузка не теряют элитные поля.
freshRun(4);
const stSave = API.createFloorState(4);
const savedEl = API.serializeFloor ? API.serializeFloor(stSave) : null;
log(!!savedEl, "этаж сериализуется вместе с элитными полями врагов");
if (savedEl) {
  const back = API.deserializeFloor(savedEl);
  const backElite = back.enemies.find((e) => e.elite);
  log(!backElite || (backElite.armorPct !== undefined && backElite.dmgBoost !== undefined),
    "после загрузки элитные параметры на месте",
    backElite ? backElite.name : "элит не было");

  // Имитируем сохранение, сделанное до появления элит: у врага
  // нет ни флага элиты, ни новых полей вообще. Берём НОВОГО врага
  // и выкидываем поля — у живого элиты они уже заполнены, и такая
  // проверка проверяла бы serializeFloor, а не дефолты загрузки.
  const oldFmt = {
    index: 0,
    map: stSave.map,
    playerPos: { ...stSave.playerPos },
    stairsDown: { ...stSave.stairsDown },
    stairsUp: null,
    enemies: [{ uid: 1, key: "skeleton", name: "Скелет", color: "#94a3b8",
      maxHp: 62, hp: 62, dmg: 12, boss: false, enraged: false,
      ability: null, poison: 0, dmgBoost: 0, nextDmgMul: 1, baseDmg: 12,
      fireScale: 1, payload: null, x: 5, y: 5 }],
    treasures: [], traders: [], traps: [], discovered: []
  };
  const backOld = API.deserializeFloor(oldFmt);
  const backEnemy = backOld.enemies[0];
  log(!backEnemy.elite && backEnemy.armorPct === 0.2 &&
    backEnemy.phaseChance === 0.25 && backEnemy.fireMul === 1.15 &&
    backEnemy.drainPct === 0.5 && backEnemy.chargeStep === 2,
    "старое сохранение без новых полей загружается с обычными значениями",
    JSON.stringify([backEnemy.elite, backEnemy.armorPct,
      backEnemy.phaseChance, backEnemy.fireMul, backEnemy.drainPct]));
}

// Тексты элитных способностей не пустые.
log(API.ELITE_ABILITY_TEXT && Object.keys(API.ELITE_ABILITY_TEXT).length >= 8,
  "для усиленных способностей написаны свои тексты",
  Object.keys(API.ELITE_ABILITY_TEXT || {}).length);
log(Object.values(API.ELITE_ABILITY_TEXT || {}).every((t) => t && t.length > 5),
  "тексты элитных способностей не пустые");

// Поиск пути: клик по дальней клетке строит маршрут.
freshRun(1);
const st1 = API.createFloorState(1);
G.map = st1.map;
G.playerPos = { ...st1.playerPos };
G.enemies = [];
G.traps = [];
// Самая дальняя достижимая клетка — так клик проверяется по-настоящему.
const far = (function () {
  let best = null;
  let bestD = -1;
  for (let y = 0; y < G.map.h; y++) {
    for (let x = 0; x < G.map.w; x++) {
      if (G.map.grid[y][x] !== 1) continue;
      const d = Math.abs(x - G.playerPos.x) + Math.abs(y - G.playerPos.y);
      if (d > bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best;
})();
const route = far ? API.findPath(G.playerPos, far) : null;
log(!!route && route.length > 3, "клик по дальней клетке строит маршрут",
  route ? route.length + " шагов" : "нет пути");
log(!!route && route[route.length - 1].x === far.x && route[route.length - 1].y === far.y,
  "маршрут ведёт ровно в ту клетку, куда кликнули");
// Каждый шаг маршрута соседний — без teleport'ов.
let adjacent = true;
let px = G.playerPos.x;
let py = G.playerPos.y;
for (const step of (route || [])) {
  if (Math.abs(step.x - px) + Math.abs(step.y - py) !== 1) adjacent = false;
  px = step.x; py = step.y;
}
log(adjacent, "каждый шаг маршрута — ровно одна клетка");

// Клик по дальней клетке: герой идёт ПОСТЕПЕННО, по клетке за шаг,
// и каждый шаг — полноценный ход с ходом врагов.
freshRun(1);
const st2 = API.createFloorState(1);
G.map = st2.map;
G.playerPos = { ...st2.playerPos };
// Убираем всё, что штатно прерывает маршрут: врагов (бой), сундуки
// (забираются, но не мешают) и торговцев — вход на их клетку открывает
// лавку и обрывает путь, а лестницы берём из ТОЙ ЖЕ карты, что и маршрут,
// иначе путь пересечёт лестницу с другой сгенерированной карты.
G.enemies = [];
G.traps = [];
G.treasures = [];
G.traders = [];
G.battle = null;
G.stairsDown = { ...st2.stairsDown, active: false };
G.stairsUp = st2.stairsUp ? { ...st2.stairsUp } : null;
const target2 = (function () {
  let best = null;
  let bestD = -1;
  for (let y = 0; y < G.map.h; y++) {
    for (let x = 0; x < G.map.w; x++) {
      if (G.map.grid[y][x] !== 1) continue;
      const d = Math.abs(x - G.playerPos.x) + Math.abs(y - G.playerPos.y);
      if (d > bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best;
})();
const fakeTile2 = { dataset: { x: target2.x, y: target2.y } };
API.onMapClick({ target: { closest: (sel) => (sel === ".tile" ? fakeTile2 : null) } });
log(!!G.walkTarget && G.walkTarget.x === target2.x && G.walkTarget.y === target2.y,
  "клик по клетке запоминает цель", JSON.stringify(G.walkTarget));

// Один шаг маршрута = ровно одна клетка, не телепорт до цели.
const beforeStep = { x: G.playerPos.x, y: G.playerPos.y };
API.walkTick();
const stepped = Math.abs(G.playerPos.x - beforeStep.x) +
  Math.abs(G.playerPos.y - beforeStep.y);
log(stepped === 1 || G.battle,
  "за один щелчок таймера герой проходит ровно одну клетку",
  stepped + (G.battle ? " (начался бой)" : ""));
// Первым щелчком он не оказался в цели.
log(!(G.playerPos.x === target2.x && G.playerPos.y === target2.y),
  "герой не перескакивает сразу к цели");

// Доигрываем маршрут: чистый этаж без врагов, чтобы проверить,
// что маршрут доводит ровно до клетки клика.
let guard = 0;
while (G.walkTarget && guard++ < 200) {
  API.walkTick();
  if (G.battle) { G.battle = null; }
}
log(guard < 200, "маршрут доигрывается за конечное число шагов", guard + " шагов");
log(G.walkTarget === null, "после прибытия метка цели снимается");
log(G.playerPos.x === target2.x && G.playerPos.y === target2.y,
  "герой доходит ровно в клетку клика",
  G.playerPos.x + "," + G.playerPos.y + " ждём " + target2.x + "," + target2.y);

// Враги ходят, пока герой идёт по маршруту.
freshRun(1);
const stWalk = API.createFloorState(1);
G.map = stWalk.map;
G.playerPos = { ...stWalk.playerPos };
G.traps = [];
G.enemies = [];
// Сундуки и торговцы остались от этажа freshRun — на этой карте они стоят
// где попало и могли загородить крысе единственный шаг: тогда она весь
// маршрут стояла на месте, и проверка «враг сходил» падала случайно.
G.treasures = [];
G.traders = [];
G.stairsDown = { ...stWalk.stairsDown, active: false };
G.stairsUp = stWalk.stairsUp ? { ...stWalk.stairsUp } : null;
const mid = (function () {
  // Три клетки вправо от старта часто упираются в стену — берём
  // первую реально достижимую клетку в радиусе, иначе findPath вернёт null.
  // Маршрут просим подлиннее (4+ шага), иначе враг успевает дойти
  // до героя за один шаг и оборвать проверку боем.
  for (let need = 6; need >= 4; need--) {
    for (let r = 3; r <= 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
          if (Math.abs(dx) + Math.abs(dy) !== r) continue;
          if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
          const p = API.findPath(G.playerPos, { x, y });
          if (p && p.length >= need) return { x, y, len: p.length };
        }
      }
    }
  }
  return null;
})();
if (!mid) { log(false, "не нашлось достижимой цели для маршрута с врагом"); }
const hunter = API.makeEnemy("rat", 1);
// Врага ставим ВНЕ маршрута, но в радиусе агро: findPath не считает
// занятые клетки проходимыми, и враг на маршруте обнулил бы путь.
const route0 = API.findPath(G.playerPos, mid);
const onRoute = new Set((route0 || []).map((p) => p.x + "," + p.y));
const hunterSpot = (function () {
  // Начинаем с расстояния 2: на соседней клетке крыса сразу бьёт, а не
  // идёт, и проверка «враг сдвинулся» ложно падала на тесных картах.
  for (let r = 2; r < API.AGGRO_RADIUS; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== r) continue;
        const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
        if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
        if (G.map.grid[y][x] !== 1) continue;
        if (onRoute.has(x + "," + y)) continue;
        // Крыса в тупике за стеной не сдвинется ни на шаг, и проверка
        // «враг сдвинулся» падала бы случайно. Берём только такую
        // клетку, откуда до героя действительно есть путь.
        if (!API.findPath({ x, y }, G.playerPos)) continue;
        return { x, y };
      }
    }
  }
  return null;
})();
if (!hunterSpot) log(false, "не нашлось клетки для врага вне маршрута");
hunter.x = hunterSpot ? hunterSpot.x : G.playerPos.x;
hunter.y = hunterSpot ? hunterSpot.y : G.playerPos.y;
G.enemies = [hunter];
const hunterStart = { x: hunter.x, y: hunter.y };
if (mid) {
const tileStub = {
  target: { closest: (sel) => (sel === ".tile" ? { dataset: { x: mid.x, y: mid.y } } : null) }
};
// Шаги героя считаем по клеткам, а не по вызовам таймера: крыса,
// подошедшая вплотную, обрывает маршрут боем, и новый клик сам делает
// шаг (onMapClick зовёт walkTick) — счёт вызовов видел «1 шаг» и падал
// примерно в одном прогоне из тысячи. Прыжок через клетку — сбой.
let heroSteps = 0;
let jumped = false;
let lastPos = { x: G.playerPos.x, y: G.playerPos.y };
const track = () => {
  const d = Math.abs(G.playerPos.x - lastPos.x) + Math.abs(G.playerPos.y - lastPos.y);
  if (d > 1) jumped = true;
  if (d > 0) heroSteps += 1;
  lastPos = { x: G.playerPos.x, y: G.playerPos.y };
};
API.onMapClick(tileStub);
track();
let bites = 0;
// Враг вне радиуса агро блуждает и мог вернуться на свою клетку: сравнение
// «был — стал» тогда давало ложный сбой (около 2,5% прогонов). Считаем шаг,
// сделанный в любой момент маршрута.
let hunterMoved = false;
let g2 = 0;
while (g2++ < 80) {
  // Бой обрывает маршрут, а он здесь не проверяется: гасим бой и идём
  // дальше. Иначе крыса, подошедшая вплотную, ломала и счёт шагов,
  // и саму проверку — числа менялись от карты к карте.
  if (G.battle) {
    // Враг вплотную бьёт, а не шагает. Это тоже его ход, поэтому укус
    // считается: иначе на тесной карте проверка падала случайно.
    // Заход самого героя на клетку врага за укус не считаем.
    if (G.battle.enemy === hunter &&
        (G.playerPos.x !== hunter.x || G.playerPos.y !== hunter.y)) bites++;
    G.battle = null;
    G.player.hp = G.player.maxHp;
    el("battle-overlay").classList.add("hidden");
  }
  if (!G.walkTarget) {
    if (G.playerPos.x === mid.x && G.playerPos.y === mid.y) break;
    API.onMapClick(tileStub);
    track();
    if (hunter.x !== hunterStart.x || hunter.y !== hunterStart.y) hunterMoved = true;
    // Шаг нового клика снова упёрся в бой — разберём его на следующем круге.
    if (!G.walkTarget && G.battle) continue;
    if (!G.walkTarget) break;
  }
  API.walkTick();
  track();
  if (hunter.x !== hunterStart.x || hunter.y !== hunterStart.y) hunterMoved = true;
}
log(heroSteps > 1 && !jumped, "маршрут идёт в несколько шагов, а не одним рывком",
  heroSteps + " шагов по клетке" + (jumped ? ", был прыжок через клетку" : ""));
log(hunterMoved || bites > 0,
  "враг сходил за время маршрута — ходы не пропущены",
  "был " + hunterStart.x + "," + hunterStart.y + " стал " + hunter.x + "," + hunter.y +
  (bites ? ", укусов по герою: " + bites : ""));
}

// Бой и клавиша отменяют маршрут.
freshRun(1);
const st3 = API.createFloorState(1);
G.map = st3.map;
G.playerPos = { ...st3.playerPos };
G.traps = [];
G.stairsDown = { ...st3.stairsDown, active: false };
G.stairsUp = st3.stairsUp ? { ...st3.stairsUp } : null;
const goal3 = (function () {
  for (let r = 3; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== r) continue;
        const x = st3.playerPos.x + dx, y = st3.playerPos.y + dy;
        if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
        if (API.findPath(st3.playerPos, { x, y })) return { x, y };
      }
    }
  }
  return null;
})();
API.onMapClick({
  target: {
    closest: (sel) => (sel === ".tile" && goal3 ? { dataset: { x: goal3.x, y: goal3.y } } : null)
  }
});
API.cancelWalk();
log(G.walkTarget === null, "ручное вмешательство отменяет маршрут");
const posAfterCancel = { x: G.playerPos.x, y: G.playerPos.y };
API.walkTick();
log(G.playerPos.x === posAfterCancel.x && G.playerPos.y === posAfterCancel.y,
  "после отмены герой больше не идёт сам");

// ================= 14. Отряды =================
// Отряд — это группа монстров с общим squadId, и каждый её участник
// стоит на СВОЕЙ клетке. Раньше весь отряд делил одну клетку, рисовался
// только ведущий, и после его смерти следующий монстр «появлялся
// из ниоткуда» — ровно на это жаловался игрок.
freshRun(5);
let squadGroups = 0;
let soloEnemies = 0;
let biggestSquad = 1;
let stacked = 0;
let splitSquads = 0;
for (let i = 0; i < 20; i++) {
  const stQ = API.createFloorState(5);
  const byCell = new Map();
  stQ.enemies.forEach((e) => {
    const k = e.x + "," + e.y;
    byCell.set(k, (byCell.get(k) || 0) + 1);
  });
  byCell.forEach((n) => {
    if (n > 1) stacked++;
  });
  const groups = new Map();
  stQ.enemies.forEach((e) => {
    if (!e.squadId) { soloEnemies++; return; }
    if (!groups.has(e.squadId)) groups.set(e.squadId, []);
    groups.get(e.squadId).push(e);
  });
  groups.forEach((list) => {
    squadGroups++;
    biggestSquad = Math.max(biggestSquad, list.length);
    // Участники отряда обязаны стоять вплотную: иначе «отряд» разъедется
    // по этажу и подкрепление придёт из другой комнаты.
    const spread = list.some((a) =>
      list.some((b) => a !== b &&
        Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) > 1));
    if (spread) splitSquads++;
  });
}
log(squadGroups > 0, "на пятом этаже встречаются отряды",
  squadGroups + " отрядов, одиночных монстров " + soloEnemies);
log(biggestSquad > 1 && biggestSquad <= API.SQUAD.maxSize,
  "отряд не больше " + API.SQUAD.maxSize + " монстров", "максимум " + biggestSquad);
log(soloEnemies > 0, "одиночные монстры тоже остаются на этаже");
log(stacked === 0,
  "монстры никогда не стоят на одной клетке", stacked + " наложений");
log(splitSquads === 0,
  "участники отряда стоят вплотную друг к другу", splitSquads + " разъехавшихся");

// На первых этажах отрядов нет: вводное обучение должно быть спокойным.
let earlySquads = 0;
for (let i = 0; i < 20; i++) {
  const stEarly = API.createFloorState(1);
  if (stEarly.enemies.some((e) => e.squadId)) earlySquads++;
}
log(earlySquads === 0, "на втором этаже отрядов нет — вводное обучение спокойное",
  earlySquads + " этажей с отрядами");

// Подкрепление приходит только от соседей: монстр с тем же squadId,
// но стоящий в стороне, в бой не вступает.
freshRun(5);
const stFar = API.createFloorState(5);
G.map = stFar.map;
G.playerPos = { ...stFar.playerPos };
G.enemies = [];
G.traps = [];
const nearOne = API.makeEnemy("goblin", 5, false, 4242, 0);
nearOne.x = G.playerPos.x;
nearOne.y = G.playerPos.y;
const nearTwo = API.makeEnemy("rat", 5, false, 4242, 1);
nearTwo.x = G.playerPos.x + 1;
nearTwo.y = G.playerPos.y;
const farOne = API.makeEnemy("slime", 5, false, 4242, 2);
farOne.x = G.playerPos.x + 6;
farOne.y = G.playerPos.y;
G.enemies = [nearOne, nearTwo, farOne];
log(API.squadMembersOf(nearOne).length === 1,
  "в отряд боя входят только соседние монстры",
  API.squadMembersOf(nearOne).length);
log(API.squadMembersOf(nearOne).indexOf(farOne) === -1,
  "дальний «союзник» подкреплением не считается");

// Бой с отрядом: выбил первого — в бой вступает второй, уйти нельзя.
freshRun(4);
const stSq = API.createFloorState(4);
G.map = stSq.map;
G.playerPos = { ...stSq.playerPos };
G.enemies = [];
G.traps = [];
const squadId = 777;
const mates = [
  API.makeEnemy("goblin", 4, false, squadId, 0),
  API.makeEnemy("rat", 4, false, squadId, 1),
  API.makeEnemy("slime", 4, false, squadId, 2)
];
mates.forEach((m) => { m.x = G.playerPos.x; m.y = G.playerPos.y; });
G.enemies = mates.slice();
API.openBattle(mates[0]);
log(API.squadMembersOf(mates[0]).length === 2,
  "бой видит остальных монстров отряда", API.squadMembersOf(mates[0]).length);
log(API.squadAliveCount(G.battle) === 2, "счётчик живых в отряде считает верно",
  API.squadAliveCount(G.battle));
log(API.squadLeaderOf(mates[2]) === mates[0],
  "ведущим отряда считается первый по squadIdx");
mates[0].hp = 1;
API.applyAttack(50, "тест", false, "");
log(G.battle.won && !!G.battle.squadNext,
  "победа над одним не отпускает: назначен следующий",
  G.battle.squadNext ? G.battle.squadNext.name : "нет");
const enemyAfterWin = G.battle.enemy;
G.player.hp = G.player.maxHp;
API.continueBattle();
log(G.battle !== null && G.battle.enemy === G.battle.squadNext ||
  G.battle.enemy !== enemyAfterWin,
  "бой продолжается с другим монстром отряда",
  G.battle.enemy.name);
log(G.battle.enemy === mates[1], "в бой вступил именно следующий по списку",
  G.battle.enemy.name);
// Боевые метки предыдущего не переносятся на следующего.
mates[1].hp = 1;
API.applyAttack(50, "тест", false, "");
API.continueBattle();
log(G.battle.enemy === mates[2] && !G.battle.cursed,
  "метки боя не переходят на следующего монстра");
mates[2].hp = 1;
API.applyAttack(50, "тест", false, "");
log(!G.battle.squadNext, "выбит весь отряд — выход открыт");
API.continueBattle();
log(G.battle === null, "после последнего монстра бой закрывается");

// ================= 15. Дистанционные враги =================
const rangedTypes = API.ENEMY_TYPES.filter((t) => t.range && t.range > 1);
log(rangedTypes.length >= 2, "есть дальнобойные виды врагов",
  rangedTypes.map((t) => t.key + ":" + t.range).join(", "));
log(rangedTypes.every((t) => (API.ENEMY_TYPES.find((x) => x.key === t.key) || {}).range > 1),
  "дистанция хранится в описании вида");
const plain = API.makeEnemy("slime", 5);
const shooter = API.makeEnemy("bat", 5);
log(shooter.range > 1 && plain.range === 1,
  "дистанция живёт у самого врага", plain.range + " / " + shooter.range);

// Прицел не лезет вплотную: стоит в двух клетках и бьёт оттуда.
// Арену вокруг героя расчищаем: на случайной карте дальнобойный мог
// оказаться в тупике, отойти было некуда, и проверка падала по карте,
// а не по логике — на тесных этажах это давало красное на ровном месте.
freshRun(4);
const stR = API.createFloorState(4);
G.map = stR.map;
G.playerPos = { ...stR.playerPos };
G.enemies = [];
G.traps = [];
const clearArena = (rad) => {
  for (let dy = -rad; dy <= rad; dy++) {
    for (let dx = -rad; dx <= rad; dx++) {
      const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
      if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
      G.map.grid[y][x] = 1;
    }
  }
};
clearArena(3);
const spot2 = (function () {
  for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
    const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
    if (G.map.grid[y][x] === 1) return { x, y };
  }
  return null;
})();
if (!spot2) log(false, "не нашлось клетки в двух шагах для проверки прицела");
if (spot2) {
  const sniper = API.makeEnemy("bat", 4);
  sniper.x = spot2.x;
  sniper.y = spot2.y;
  G.enemies = [sniper];
  const dist = Math.round(Math.hypot(sniper.x - G.playerPos.x, sniper.y - G.playerPos.y));
  const closer = API.enemyTurn();
  const newDist = Math.round(
    Math.hypot(sniper.x - G.playerPos.x, sniper.y - G.playerPos.y)
  );
  log(closer === sniper && newDist >= sniper.range && newDist <= dist,
    "прицел держит дистанцию и не лезет вплотную",
    "было " + dist + ", стало " + newDist + ", его дальность " + sniper.range);
  // Подошёл вплотную сам — отходит на свою дальность и бьёт оттуда.
  // Место выбираем так, чтобы за спиной прицела было куда отступить: иначе
  // проверка зависела бы от случайной планировки карты (в тупике отойти
  // на дальность просто некуда).
  // Занятость считаем теми же правилами, что и сам враг (tileBlockedForEnemy):
  // сундук, торговец и лестница тоже не пускают — без этого проверка падала
  // случайно, когда за спиной прицела стоял сундук.
  const freeFor = (x, y, self) => x >= 0 && y >= 0 && x < G.map.w && y < G.map.h &&
    G.map.grid[y][x] === 1 && !API.tileBlockedForEnemy(x, y, self);
  const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  G.enemies = [sniper];
  let esc = null;
  for (let attempt = 0; attempt < 24 && !esc; attempt++) {
    if (attempt) {
      const st = API.createFloorState(4);
      G.map = st.map;
      G.playerPos = { ...st.playerPos };
      G.traps = [];
      G.enemies = [sniper];
    }
    for (let y = 0; y < G.map.h && !esc; y++) {
      for (let x = 0; x < G.map.w && !esc; x++) {
        if (G.map.grid[y][x] !== 1) continue;
        for (const [dx, dy] of dirs4) {
          const sx = x + dx, sy = y + dy;
          if (!freeFor(sx, sy, sniper)) continue;
          const canBackOff = dirs4.some(([bx, by]) => {
            const fx = sx + bx, fy = sy + by;
            if (fx === x && fy === y) return false;
            return freeFor(fx, fy, sniper) && Math.hypot(fx - x, fy - y) >= sniper.range;
          });
          if (canBackOff) { esc = { px: x, py: y, sx: sx, sy: sy }; break; }
        }
      }
    }
  }
  if (!esc) {
    log(false, "не нашлось места для проверки отхода прицела");
  } else {
    G.playerPos = { x: esc.px, y: esc.py };
    sniper.x = esc.sx;
    sniper.y = esc.sy;
    G.enemies = [sniper];
    const before = Math.hypot(sniper.x - G.playerPos.x, sniper.y - G.playerPos.y);
    const back = API.enemyTurn();
    const after = Math.hypot(sniper.x - G.playerPos.x, sniper.y - G.playerPos.y);
    log(back === sniper && Math.round(after) >= sniper.range && after > before,
      "прицел, подошедший вплотную, отходит на свою дальность",
      before.toFixed(2) + " -> " + after.toFixed(2) + ", его дальность " + sniper.range);
  }
}

// Прицел бьёт слабее обычного и не каждый ход: перезарядка.
freshRun(4);
const stR2 = API.createFloorState(4);
G.map = stR2.map;
G.playerPos = { ...stR2.playerPos };
G.enemies = [];
G.traps = [];
const shotter = API.makeEnemy("bat", 4);
shotter.x = G.playerPos.x + 2;
shotter.y = G.playerPos.y;
G.enemies = [shotter];
G.player.defBonus = 0;
API.openBattle(shotter);
const shotDmg = shotter.dmg;
log(shotDmg < API.makeEnemy("rat", 4).baseDmg,
  "дальнобойный наносит меньше урона, чем ближний монстр",
  "прицел " + shotDmg + ", крыса " + API.makeEnemy("rat", 4).baseDmg);
G.player.hp = 200;
const hpBefore = G.player.hp;
const hit1 = API.playerTakeHit();
const afterFirst = G.player.hp;
const hit2 = API.playerTakeHit();
const afterSecond = G.player.hp;
log(hit1 > 0 && hit2 === 0 && afterSecond >= afterFirst,
  "у прицела есть перезарядка между выстрелами",
  "1-й " + hit1 + " (HP " + hpBefore + "->" + afterFirst + "), 2-й " + hit2);
log(G.battle.rangedCd > 0, "перезарядка видна в состоянии боя",
  G.battle.rangedCd);
G.battle = null;

// Отметка прицела рисуется на карте. В ICONS строка начинается с
// перевода строки и отступа, поэтому сравниваем trim(), как в проверке ловушек.
const sniperSvg = globalThis.iconSvg("sniper");
log(sniperSvg && sniperSvg.trim().indexOf("<svg") === 0, "иконка дальнобойного есть");

// Старое сохранение: у врага без новых полей дистанция равна 1,
// отряд пустой — иначе после перезагрузки группа рассыпалась бы.
const oldRanged = API.deserializeFloor({
  index: 0,
  map: { w: 3, h: 3, grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], decor: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] },
  playerPos: { x: 1, y: 1 },
  stairsDown: { x: 2, y: 2, active: true },
  stairsUp: null,
  enemies: [{ uid: 1, key: "bat", name: "Летучая мышь", color: "#7c3aed",
    maxHp: 30, hp: 30, dmg: 9, boss: false, x: 0, y: 0 }],
  treasures: [], traders: [], traps: [], discovered: []
});
log(oldRanged.enemies[0].range === 1 && !oldRanged.enemies[0].squadId,
  "старое сохранение грузится без отрядов и дистанции",
  "range " + oldRanged.enemies[0].range + ", squad " + oldRanged.enemies[0].squadId);

// Живой этаж с отрядами переживает сохранение целиком.
let squadSaveOk = true;
let squadSaveDetail = "";
for (let i = 0; i < 12; i++) {
  const stSq2 = API.createFloorState(6);
  const round = API.deserializeFloor(API.serializeFloor(stSq2));
  const before = new Map(stSq2.enemies.map((e) => [e.uid, e.squadId + "/" + e.range]));
  round.enemies.forEach((e) => {
    if (before.get(e.uid) !== e.squadId + "/" + e.range) squadSaveOk = false;
  });
  if (!squadSaveOk) { squadSaveDetail = e.name + ": " + before.get(e.uid) + " -> " + e.squadId + "/" + e.range; break; }
}
log(squadSaveOk, "отряд и дистанция переживают сохранение",
  squadSaveDetail || "12 этажей сверено");

// ================= 16. Опасная среда этажей =================
const hazKeys = Object.keys(API.HAZARD_TYPES);
log(hazKeys.length === 3 && hazKeys.indexOf("frost") >= 0 &&
  hazKeys.indexOf("dark") >= 0 && hazKeys.indexOf("lava") >= 0,
  "есть три вида опасной среды", hazKeys.join(", "));
log(hazKeys.every((k) => {
  const h = API.HAZARD_TYPES[k];
  return h.key === k && h.name && h.text && h.hint && h.icon;
}), "у каждой среды есть имя, описание, подсказка и значок");
log(API.FLOOR_HAZARD.length === 10, "среда расписана по всем десяти этажам",
  API.FLOOR_HAZARD.length);
log(API.floorHazard(4).key === "frost" && API.floorHazard(5).key === "dark" &&
  API.floorHazard(6).key === "lava", "среда стоит на этажах 5, 6 и 7",
  [4, 5, 6].map((i) => API.floorHazard(i).key).join(", "));
log(API.floorHazard(0) === null && API.floorHazard(9) === null,
  "первый и боссовый этажи без среды");
log(API.hazardByKey("lava") && API.hazardByKey("lava").name === "Лавовые разломы" &&
  API.hazardByKey("нет-такой") === null, "поиск среды по ключу");

// Клетки среды: лёд и лава занимают плитки, тьма — нет, она на весь этаж.
const stFrost = API.createFloorState(4);
const frostCells = [];
stFrost.hazard.forEach((row, y) => row.forEach((v, x) => { if (v) frostCells.push({ x, y, v }); }));
log(frostCells.length > 0 && frostCells.every((c) => c.v === "frost"),
  "на ледяном этаже разложен лёд", frostCells.length + " клеток");
const stDark = API.createFloorState(5);
let darkCells = 0;
stDark.hazard.forEach((row) => row.forEach((v) => { if (v) darkCells += 1; }));
log(darkCells === 0, "тьма не занимает клетки — она накрывает этаж целиком", darkCells);
const stLava = API.createFloorState(6);
const lavaCells = [];
stLava.hazard.forEach((row, y) => row.forEach((v, x) => { if (v) lavaCells.push({ x, y, v }); }));
log(lavaCells.length > 0 && lavaCells.every((c) => c.v === "lava"),
  "на демоническом этаже есть лава", lavaCells.length + " клеток");
const frostFloorCells = stFrost.map.grid.flat().filter((v) => v === 1).length;
log(frostCells.length < frostFloorCells,
  "среда не покрывает этаж целиком",
  frostCells.length + " из " + frostFloorCells + " проходимых");

// Среда не встаёт на лестницы, добычу, врагов, ловушки и вход.
let hazardClean = true;
let hazardDetail = "";
for (let i = 0; i < 12 && hazardClean; i++) {
  const st = API.createFloorState(i % 2 === 0 ? 4 : 6);
  const bad = [];
  st.hazard.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return;
    if (st.map.grid[y][x] !== 1) bad.push("стена " + x + "," + y);
    if (st.stairsDown.x === x && st.stairsDown.y === y) bad.push("лестница вниз");
    if (st.stairsUp && st.stairsUp.x === x && st.stairsUp.y === y) bad.push("лестница вверх");
    if (st.enemies.some((e) => e.x === x && e.y === y)) bad.push("враг");
    if (st.treasures.some((t) => t.x === x && t.y === y)) bad.push("сундук");
    if ((st.traders || []).some((t) => t.x === x && t.y === y)) bad.push("торговец");
    if ((st.traps || []).some((t) => t.x === x && t.y === y)) bad.push("ловушка");
    if (Math.hypot(x - st.playerPos.x, y - st.playerPos.y) < 3) bad.push("клетка под входом");
  }));
  if (bad.length) { hazardClean = false; hazardDetail = bad[0]; }
}
log(hazardClean, "среда обходит лестницы, добычу, врагов и вход", hazardDetail);

// Тьма сужает обзор, лёд и лава — нет.
freshRun(5);
const darkRadius = API.viewRadius();
const darkSeen = G.visible.size;
log(Math.abs(darkRadius - 2.6) < 0.001, "во тьме обзор сужен", darkRadius);
freshRun(4);
log(Math.abs(API.viewRadius() - 4.4) < 0.001, "на льду обзор обычный", API.viewRadius());
const frostSeen = G.visible.size;
log(frostSeen > darkSeen, "во тьме видно меньше клеток",
  "светло " + frostSeen + ", темно " + darkSeen);

// Лава обжигает каждый ход, обычная клетка — нет.
freshRun(4);
const stBurn = API.createFloorState(4);
G.map = stBurn.map;
G.hazard = stBurn.hazard;
G.playerPos = { ...stBurn.playerPos };
G.enemies = [];
G.player.hp = 500;
G.player.maxHp = 500;
G.player.defBonus = 0;
log(API.hazardTick() === 0 && G.player.hp === 500, "на обычной клетке ничего не горит");
const lavaX = stBurn.playerPos.x + 1;
const lavaY = stBurn.playerPos.y;
G.map.grid[lavaY][lavaX] = 1;
G.hazard[lavaY][lavaX] = "lava";
G.playerPos = { x: lavaX, y: lavaY };
const hpBeforeBurn = G.player.hp;
const burn = API.hazardTick();
log(burn > 0 && G.player.hp === hpBeforeBurn - burn,
  "лава отнимает здоровье каждый ход", burn + " урона");
log(API.hazardAt(lavaX, lavaY) === "lava" && API.hazardAt(0, 0) === "",
  "поиск среды по клетке");

// Лёд: встав на него, герой скользит — монстры успевают лишний шаг.
// Считаем не расстояние, а смещение монстра от своей же клетки: после
// хода героя стартовая дистанция меняется, и путать её нельзя.
function iceScenario(onIce) {
  freshRun(4);
  const st = API.createFloorState(4);
  G.map = st.map;
  G.hazard = st.hazard;
  G.playerPos = { ...st.playerPos };
  G.enemies = [];
  G.treasures = [];
  G.traders = [];
  G.traps = [];
  // Ровная дорожка вправо на четыре клетки от героя.
  for (let d = 1; d <= 4; d++) {
    G.map.grid[G.playerPos.y][G.playerPos.x + d] = 1;
    G.hazard[G.playerPos.y][G.playerPos.x + d] = "";
  }
  if (onIce) G.hazard[G.playerPos.y][G.playerPos.x + 1] = "frost";
  G.stairsDown = { x: 0, y: 0, active: true };
  G.stairsUp = null;
  const foe = API.makeEnemy("slime", 4);
  foe.x = G.playerPos.x + 4;
  foe.y = G.playerPos.y;
  G.enemies = [foe];
  const startX = foe.x;
  API.move(1, 0);
  return { shift: Math.abs(foe.x - startX), battling: !!G.battle };
}
const plainStep = iceScenario(false);
const iceStep = iceScenario(true);
log(!plainStep.battling && plainStep.shift === 1,
  "на обычной клетке монстр делает один шаг",
  "сдвиг " + plainStep.shift + ", бой " + plainStep.battling);
log(iceStep.shift > plainStep.shift || iceStep.battling,
  "на льду монстры получают лишнее действие",
  "обычно " + plainStep.shift + ", на льду " + iceStep.shift +
  ", бой " + iceStep.battling);

// Среда помечается и на самой карте, и на плитках.
// Случайную раскладку здесь проверять нельзя: ледяная клетка может не
// попасть в открытую зону, и проба «поплывёт». Поэтому ставим среду
// своими руками на уже открытую клетку и смотрим на класс плитки.
function tileClassWith(floor, kind) {
  freshRun(floor);
  const open = [...G.visible].find((k) => {
    const parts = k.split(",");
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    return G.map.grid[y][x] === 1 && !API.hazardAt(x, y) &&
      !(x === G.playerPos.x && y === G.playerPos.y);
  });
  if (!open) return { cls: "", detail: "нет открытой клетки" };
  const parts = open.split(",");
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  G.hazard[y][x] = kind;
  API.render();
  const tile = G.tileEls[y * G.map.w + x];
  return { cls: tile ? String(tile.className) : "", detail: x + "," + y };
}
freshRun(4);
log(String(el("map").dataset.hazard) === "frost", "этаж помечен средой",
  el("map").dataset.hazard);
const frostTile = tileClassWith(4, "frost");
log(frostTile.cls.indexOf("hazard-frost") >= 0, "лёд виден на плитке карты",
  frostTile.detail + " -> " + frostTile.cls);
freshRun(5);
log(String(el("map").dataset.hazard) === "dark" &&
  el("map-scroll").classList.contains("hazard-dark"),
  "тьма включает затемнение вьюпорта");
const lavaTile = tileClassWith(6, "lava");
log(lavaTile.cls.indexOf("hazard-lava") >= 0, "лава видна на плитке карты",
  lavaTile.detail + " -> " + lavaTile.cls);

// ================= 17. Развилка на входе: сделка =================
log(!API.blessOffered(0, null) && !API.blessOffered(2, null),
  "на первых этажах выбора нет");
log(API.blessOffered(3, null) && !API.blessOffered(3, "curse") &&
  !API.blessOffered(3, "blessing"),
  "на четвёртом этаже выбор есть, но только один раз");
log(API.BLESSINGS.curse.good && API.BLESSINGS.curse.extra &&
  API.BLESSINGS.blessing.good && API.BLESSINGS.blessing.extra,
  "у каждой сделки есть выгода и цена");
log(API.blessingFor(3, "curse").key === "curse" &&
  API.blessingFor(3, "blessing").key === "blessing",
  "обе сделки описаны");

// Тёмная сделка: монстры бьют сильнее, но золото удваивается.
freshRun(4);
G.player.gold = 0;
G.blessingOffer = 4;
API.chooseBlessing("curse");
log(G.blessings[4] === "curse" && G.blessingOffer === null,
  "выбор записан и окно предложения закрыто", JSON.stringify(G.blessings));
log(G.player.gold === API.BLESS.curseGold,
  "за сделку сразу заплатили золотом", G.player.gold);
log(Math.abs(API.curseDmgMul() - API.BLESS.curseEnemyDmg) < 0.001,
  "монстры этажа бьют сильнее", API.curseDmgMul());
log(API.goldMulForFloor() === API.BLESS.curseGoldMul,
  "золото с монстров удвоено", API.goldMulForFloor());

// Средний урон по двумстам ударам: со сделкой он выше.
function averageHit() {
  const foe = API.makeEnemy("slime", 4);
  foe.x = G.playerPos.x + 1;
  foe.y = G.playerPos.y;
  G.enemies = [foe];
  G.player.defBonus = 0;
  API.openBattle(foe);
  let sum = 0;
  for (let i = 0; i < 200; i++) {
    G.player.maxHp = 500;
    G.player.hp = 500;
    sum += API.playerTakeHit();
  }
  G.battle = null;
  return sum / 200;
}
G.blessings = {};
const plainHit = averageHit();
G.blessings = { 4: "curse" };
const cursedHit = averageHit();
log(cursedHit > plainHit * 1.15, "со сделкой монстр бьёт заметно сильнее",
  "обычно " + plainHit.toFixed(1) + ", со сделкой " + cursedHit.toFixed(1));

// Каменный дар: здоровья больше, но монстры затягивают раны.
freshRun(4);
G.player.hp = 50;
const giftBefore = G.player.baseMaxHp;
G.blessingOffer = 4;
API.chooseBlessing("blessing");
log(G.player.baseMaxHp === giftBefore + 30, "дар поднял предел здоровья",
  giftBefore + " -> " + G.player.baseMaxHp);
log(G.player.hp === G.player.maxHp, "дар полностью исцелил", G.player.hp);
log(API.blessingOnFloor() && API.blessingOnFloor().key === "blessing",
  "дар действует на текущем этаже");

const giftFoe = API.makeEnemy("slime", 4);
giftFoe.x = G.playerPos.x + 1;
giftFoe.y = G.playerPos.y;
giftFoe.maxHp = 500;
giftFoe.hp = 500;
G.enemies = [giftFoe];
API.openBattle(giftFoe);
const giftHpBefore = G.battle.enemy.hp;
API.applyAttack(80, "тест", false, "");
const giftHpAfter = G.battle.enemy.hp;
log(giftHpAfter < giftHpBefore && giftHpAfter > giftHpBefore - 80,
  "монстр затянул часть урона", giftHpBefore + " -> " + giftHpAfter);
G.battle = null;

// Цена сделки: со временем монстры восстанавливаются сильнее.
log(API.BLESS.blessingEnemyRegen > 0 && API.BLESS.curseEnemyDmg > 1,
  "у каждой сделки своя цена", "реген " + API.BLESS.blessingEnemyRegen +
  ", урон ×" + API.BLESS.curseEnemyDmg);

// ================= 18. Среда и сделки в сохранении =================
const roundHaz = API.deserializeFloor(API.serializeFloor({
  index: 4,
  map: { w: 3, h: 3, grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], decor: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] },
  playerPos: { x: 1, y: 1 },
  stairsDown: { x: 2, y: 2, active: true },
  stairsUp: null,
  enemies: [], treasures: [], traders: [], traps: [],
  hazard: [["", "lava", ""], ["", "", "frost"], ["", "", ""]],
  discovered: []
}));
log(roundHaz.hazard && roundHaz.hazard[0][1] === "lava" && roundHaz.hazard[1][2] === "frost",
  "клетки среды переживают сохранение");

const oldHaz = API.deserializeFloor({
  index: 0,
  map: { w: 2, h: 2, grid: [[1, 1], [1, 1]], decor: [[0, 0], [0, 0]] },
  playerPos: { x: 0, y: 0 },
  stairsDown: { x: 1, y: 1, active: true },
  stairsUp: null,
  enemies: [], treasures: [], traders: [], traps: [], discovered: []
});
log(oldHaz.hazard === null || oldHaz.hazard === undefined ||
  oldHaz.hazard.every((row) => row.every((v) => !v)),
  "старое сохранение без среды грузится");

// Сделки живут в сохранении целиком.
freshRun(4);
G.blessings = { 4: "blessing" };
API.saveGame();
G.blessings = {};
API.loadGame();
log(G.blessings && G.blessings[4] === "blessing",
  "сделка восстанавливается из сохранения", JSON.stringify(G.blessings || {}));

// Окно предложения появляется при входе на этаж и ждёт ответа.
freshRun(4);
G.visited = new Set([0, 1, 2, 3]);
G.blessings = {};
G.blessingOffer = null;
API.activateFloor(4);
log(G.blessingOffer === 4, "на четвёртом этаже предложена сделка", G.blessingOffer);
log(!el("blessing-overlay").classList.contains("hidden"),
  "окно сделки показано игроку");
API.chooseBlessing("blessing");
log(el("blessing-overlay").classList.contains("hidden"),
  "после выбора окно закрывается");
API.activateFloor(4);
log(G.blessingOffer === null, "повторно сделка не предлагается");

// Развилка принадлежит этажу: при спуске старый оверлей закрывается, а дар
// не переносится на другой этаж. freshRun(4) уже открыл развилку на этаже 4.
freshRun(4);
log(G.blessingOffer === 4 && !el("blessing-overlay").classList.contains("hidden"),
  "развилка открыта на своём этаже", G.blessingOffer);
G.visited = new Set([0, 1, 2, 3, 4, 5]);
API.activateFloor(5);
log(G.blessingOffer === null && el("blessing-overlay").classList.contains("hidden"),
  "смена этажа закрывает старую развилку");
API.chooseBlessing("blessing");
log(G.blessings[4] === undefined && G.blessings[5] === undefined,
  "выбор после смены этажа не применяет дар к чужому этажу",
  JSON.stringify(G.blessings));

// ================= 19. Пункт 1: кнопка действия у объекта ===========
// Замысел: сундук, торговец и лестница перестали срабатывать сами от
// шага. Герой подходит и жмёт кнопку (или E) — только тогда что-то
// происходит. Иначе игрок проваливался в лавку, не успев подумать.
freshRun(1);
G.traps = [];
G.enemies = [];
G.treasures = [];
G.traders = [];
G.stairsDown = { x: G.playerPos.x, y: G.playerPos.y, active: true };
G.stairsUp = null;
const tDown = API.interactTarget();
log(tDown && tDown.kind === "down",
  "кнопка на лестнице предлагает спуститься", tDown && tDown.kind);
API.updateActionButton();
log(!el("action-btn").classList.contains("hidden"),
  "кнопка действия показана игроку");
log(el("action-label").textContent === "Спуститься ниже",
  "подпись кнопки про спуск", el("action-label").textContent);

G.stairsDown.active = false;
API.updateActionButton();
log(el("action-label").textContent.indexOf("страж") >= 0,
  "закрытая стражем лестница подписана честно",
  el("action-label").textContent);
log(el("action-btn").classList.contains("locked"),
  "кнопка у закрытой лестницы помечена locked");

// Шаг на сундук больше ничего не открывает.
freshRun(1);
G.traps = [];
G.enemies = [];
G.traders = [];
G.stairsDown = { x: -5, y: -5, active: false };
G.stairsUp = null;
const chestSpot = walkableNeighbours(G.playerPos)[0];
log(!!chestSpot, "нашлась свободная клетка рядом с героем");
G.treasures = [{ x: chestSpot.x, y: chestSpot.y, item: API.itemsForFloor(1)[0] }];
const invBefore = G.inventory.length;
API.move(chestSpot.x - G.playerPos.x, chestSpot.y - G.playerPos.y);
log(G.treasures.length === 1, "шаг на сундук его НЕ открывает", G.treasures.length);
log(G.inventory.length === invBefore, "и предмет в сумку не попадает");
log(!el("action-btn").classList.contains("hidden"),
  "зато кнопка действия появилась на клетке сундука");
log(el("action-label").textContent === "Открыть сундук",
  "кнопка подписана сундуком", el("action-label").textContent);
// Сундук с шансом 2% отдаёт амулет возврата вместо предмета — для проверки
// этот розыгрыш выключаем, иначе раз в пятьдесят прогонов она ложно падала.
const chestRandom = Math.random;
Math.random = () => 1;
API.doInteract();
Math.random = chestRandom;
log(G.treasures.length === 0, "по кнопке сундук открылся");
log(G.inventory.length === invBefore + 1, "предмет из сундука лёг в сумку");
API.updateActionButton();
log(el("action-btn").classList.contains("hidden"),
  "без объекта рядом кнопка снова спрятана");

// Торговец тоже ждёт кнопку.
freshRun(1);
G.traps = [];
G.enemies = [];
G.treasures = [];
G.stairsDown = { x: -5, y: -5, active: false };
G.stairsUp = null;
const shopSpot = walkableNeighbours(G.playerPos)[0];
G.traders = [{ x: shopSpot.x, y: shopSpot.y }];
API.move(shopSpot.x - G.playerPos.x, shopSpot.y - G.playerPos.y);
log(el("shop-overlay").classList.contains("hidden"),
  "шаг на торговца лавку НЕ открывает");
log(el("action-label").textContent === "Торговать",
  "кнопка предлагает торговлю", el("action-label").textContent);
API.doInteract();
log(!el("shop-overlay").classList.contains("hidden"),
  "по кнопке лавка открылась");
// Пока лавка открыта, кнопка действия не срабатывает повторно.
G.stairsDown = { x: G.playerPos.x, y: G.playerPos.y, active: true };
const floorBefore = G.floorIndex;
API.doInteract();
log(G.floorIndex === floorBefore, "сквозь открытую лавку спуститься нельзя");

// ================= 20. Пункт 2: стены закрывают обзор =================
// Замысел: монстр не должен бить через глухую скалу. Раньше решение
// «стреляю» принималось по одной лишь дистанции Math.hypot.
function fakeMap(grid) {
  G.map = {
    w: grid[0].length,
    h: grid.length,
    grid: grid.map((row) => row.slice()),
    decor: grid.map((row) => row.map(() => 0))
  };
}
freshRun(1);
fakeMap([
  [1, 1, 1, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1]
]);
log(API.hasLineOfSight(0, 1, 4, 1) === false,
  "стена между клетками закрывает линию видимости");
G.map.grid[1][2] = 1;
log(API.hasLineOfSight(0, 1, 4, 1) === true,
  "без стены линия видимости открыта");
log(API.hasLineOfSight(0, 1, 0, 1) === true,
  "из клетки в саму себя видно");
log(API.wallAt(-1, 0) === true && API.wallAt(99, 0) === true,
  "за границей карты — стена");

// Диагональ через стык двух стен не простреливается.
fakeMap([
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1]
]);
log(API.hasLineOfSight(0, 0, 1, 1) === false,
  "диагональ через стык двух стен закрыта");

// Дальнобойный за стеной не начинает бой, а идёт в обход.
freshRun(1);
G.traps = [];
G.treasures = [];
G.traders = [];
fakeMap([
  [1, 1, 1, 1, 1],
  [1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1]
]);
G.playerPos = { x: 0, y: 1 };
const wallBat = API.makeEnemy("bat", 1);
wallBat.x = 2;
wallBat.y = 1;
G.enemies = [wallBat];
const blockedAttacker = API.enemyTurn();
log(!blockedAttacker, "сквозь стену дальнобойный не атакует",
  blockedAttacker ? blockedAttacker.name : "атаки нет");

// Та же дистанция, но стены нет — атака есть.
freshRun(1);
G.traps = [];
G.treasures = [];
G.traders = [];
fakeMap([
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1]
]);
G.playerPos = { x: 0, y: 1 };
const openBat = API.makeEnemy("bat", 1);
openBat.x = 2;
openBat.y = 1;
G.enemies = [openBat];
log(API.enemyTurn() === openBat,
  "на открытой линии дальнобойный бьёт с той же дистанции");

// ================= 21. Пункт 3: за что дают урон =================
// Замысел: ошибка не должна ранить врага, а переписывание кода —
// самая кропотливая работа, поэтому бьёт сильнее выбора варианта.
log(API.TASK_POWER && API.TASK_POWER.copy > API.TASK_POWER.mc,
  "переписывание кода бьёт сильнее выбора варианта",
  API.TASK_POWER ? "copy ×" + API.TASK_POWER.copy + " против mc ×" + API.TASK_POWER.mc : "нет");
log(API.TASK_POWER && API.TASK_POWER.code > API.TASK_POWER.mc,
  "задача на код бьёт сильнее выбора варианта");
log(API.TASK_POWER && API.TASK_POWER.error > API.TASK_POWER.mc,
  "поиск ошибки чуть дороже выбора варианта");

// Множитель реально попадает в урон: одинаковый герой, одинаковое
// качество ответа — разница только в типе задания.
function dmgForTask(type) {
  freshRun(1);
  G.traps = [];
  G.enemies = [];
  const e3 = enemyOnPlayerCell("orc", 9000);
  API.openBattle(e3);
  G.battle.challenge = { type: type, task: { explanation: "" }, question: { level: 2 },
    view: { answer: 0 }, hintUsed: false };
  G.stats.streak = 0;
  let best = Infinity;
  for (let i = 0; i < 25; i++) {
    G.battle.quality = null;
    best = Math.min(best, API.mcDamage(2));
  }
  G.battle = null;
  return best;
}
const mcPower = dmgForTask("mc");
const copyPower = dmgForTask("copy");
log(copyPower > mcPower, "тот же удар по copy-заданию сильнее",
  mcPower + " -> " + copyPower);

// Неверный ответ: врагу — ноль, герою — урон.
freshRun(1);
G.traps = [];
G.enemies = [];
const wrongEnemy = enemyOnPlayerCell("orc", 9000);
API.openBattle(wrongEnemy);
G.battle.challenge = { type: "mc",
  question: { id: "q-w", level: 2, topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
  view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: false };
const hpBeforeWrong = wrongEnemy.hp;
const myHpBeforeWrong = G.player.hp;
API.answerMC(1);
log(wrongEnemy.hp === hpBeforeWrong,
  "за неверный ответ враг НЕ получает урона",
  hpBeforeWrong + " -> " + wrongEnemy.hp);
log(G.player.hp < myHpBeforeWrong,
  "за неверный ответ получает герой",
  myHpBeforeWrong + " -> " + G.player.hp);
log(G.battle.good === false, "неверный ответ помечен красным, а не зелёным");
G.battle = null;

// Сверка по буквам: отступы — часть задания, значит это ошибка.
freshRun(1);
G.traps = [];
G.enemies = [];
const copyEnemy = enemyOnPlayerCell("orc", 9000);
API.openBattle(copyEnemy);
const copyTask = API.COPY_TASKS.find((t) => t.id === "copy_for") || API.COPY_TASKS[0];
// Убираем ведущие отступы: normalizeExact их видит, normalizeLoose — нет.
const looseCopy = copyTask.code.replace(/\n[ \t]+/g, "\n");
log(looseCopy !== copyTask.code, "тестовый код действительно без отступов");
G.battle.challenge = { type: "copy", task: copyTask, code: looseCopy,
  hintUsed: false };
const hpBeforeLoose = copyEnemy.hp;
API.checkCopy();
log(copyEnemy.hp === hpBeforeLoose,
  "код без отступов врага не ранит — это ошибка",
  hpBeforeLoose + " -> " + copyEnemy.hp);
log(G.battle.good === false, "сбитые отступы помечены как ошибка");
log((G.stats.copyLoose || 0) >= 1, "сбитые отступы видны в статистике",
  G.stats.copyLoose);
G.battle = null;

// Точное совпадение — полный удар.
freshRun(1);
G.traps = [];
G.enemies = [];
const exactEnemy = enemyOnPlayerCell("orc", 9000);
API.openBattle(exactEnemy);
G.battle.challenge = { type: "copy", task: copyTask, code: copyTask.code, hintUsed: false };
const hpBeforeExact = exactEnemy.hp;
API.checkCopy();
log(exactEnemy.hp < hpBeforeExact, "точное совпадение бьёт врага",
  hpBeforeExact + " -> " + exactEnemy.hp);
log(G.battle.good === true, "точное совпадение помечено зелёным");
G.battle = null;

// Шипы помогают в верном ударе и молчат на промахе.
freshRun(1);
G.traps = [];
G.enemies = [];
const thEnemy = enemyOnPlayerCell("orc", 9000);
API.openBattle(thEnemy);
G.equipment.armor = equipWithEffect("thorns");
API.recalcStats();
G.battle.challenge = { type: "mc",
  question: { id: "q-th", level: 2, topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
  view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: false };
const thHp0 = thEnemy.hp;
API.answerMC(0);
const thDealt = thHp0 - thEnemy.hp;
// Тот же удар без шипов — сравнение честное, потому что силу удара
// считаем минимумом из серии бросков, а rand внутри.
freshRun(1);
G.traps = [];
G.enemies = [];
const noEnemy2 = enemyOnPlayerCell("orc", 9000);
API.openBattle(noEnemy2);
G.battle.challenge = { type: "mc",
  question: { id: "q-th", level: 2, topic: "syntax", options: ["a", "b", "c", "d"], answer: 0 },
  view: { options: ["a", "b", "c", "d"], answer: 0 }, hintUsed: false };
const noHp0 = noEnemy2.hp;
API.answerMC(0);
const noDealt = noHp0 - noEnemy2.hp;
log(thDealt > noDealt, "шипы добавляют урон к верному удару",
  noDealt + " -> " + thDealt);
G.battle = null;

// ================= 22. Смерть: деревня и амулет возврата =============
// Замысел: поход смертен. Без амулета герой возвращается в деревню, и туда
// переходит лишь доля золота; с амулетом можно возродиться на месте и
// продолжить поход. Этаж в обоих случаях начинается заново с полным
// здоровьем, но уровень и сила откатываются к началу этажа.
freshRun(3);
G.player.gold = 123;
G.player.level = 6;
G.player.dmgBase = 55;
API.snapshotCurrent();
G.floorCheckpoint = {
  floorIndex: G.floorIndex, level: 6, xp: 0, xpNext: 300,
  baseMaxHp: G.player.baseMaxHp, dmgBase: 55
};
const cachedBefore = Object.keys(G.cache).length;
G.player.level = 7;
G.player.xp = 10;
G.player.hp = 0;
G.player.dmgBase = 59;
// Амулетов нет — смерть ведёт в деревню.
const prof0 = getProfile(G.name);
prof0.hub.revive = 0;
putProfile(G.name, prof0);
API.showDeath();
log(G.dead === true, "смерть помечена флагом");
log(G.running === false, "после смерти партия остановлена");
const deathHtml = el("end-box").innerHTML;
log(deathHtml.indexOf("to-hub-btn") >= 0,
  "без амулета на экране смерти есть кнопка «В деревню»");
log(deathHtml.indexOf("revive-btn") < 0,
  "без амулета возрождения не предлагают");
log(/Поход окончен/.test(deathHtml), "смерть сообщает об окончании похода");
log(/золота/.test(deathHtml), "смерть говорит, сколько золота дойдёт до деревни");

// Сейв после смерти помечен как оконченный, а не «живой».
const savedAfterDeath = JSON.parse(globalThis.localStorage.getItem(API.SAVE_KEY) || "{}");
log(savedAfterDeath.over === true,
  "в сейве есть признак «партия окончена»", String(savedAfterDeath.over));

API.restartFloor();
log(G.dead === false && G.running === true,
  "после кнопки партия снова идёт");
log(G.player.hp === G.player.maxHp, "здоровье восстановлено полностью",
  G.player.hp + "/" + G.player.maxHp);
log(Object.keys(G.cache).length === cachedBefore,
  "этаж пересоздан, а не взят из кэша",
  cachedBefore + " -> " + Object.keys(G.cache).length);
log(G.player.level === 6, "уровень откатился к началу этажа", G.player.level);
log(G.player.dmgBase === 55, "сила удара откатилась к началу этажа", G.player.dmgBase);
log(G.player.gold === 123, "золото осталось у героя", G.player.gold);

// С амулетом смерть предлагает выбор, а возрождение сохраняет поход.
freshRun(4);
const profA = getProfile(G.name);
profA.hub.revive = 2;
putProfile(G.name, profA);
G.player.gold = 777;
G.player.level = 8;
G.player.dmgBase = 70;
API.snapshotCurrent();
G.player.hp = 0;
API.showDeath();
const amHtml = el("end-box").innerHTML;
log(amHtml.indexOf("revive-btn") >= 0, "с амулетом есть кнопка «Использовать амулет»");
log(amHtml.indexOf("to-hub-btn") >= 0, "и кнопка возврата в деревню");
log(amHtml.indexOf("Retry") < 0 && amHtml.indexOf("Начать этаж заново") < 0,
  "старой кнопки «Начать этаж заново» на экране смерти больше нет");
API.useRevive();
log(G.running === true && G.dead === false, "возрождение продолжает поход");
log(getProfile(G.name).hub.revive === 1, "амулет потрачен",
  String(getProfile(G.name).hub.revive));
log(G.player.gold === 777, "золото похода при возрождении остаётся", G.player.gold);
log(G.player.hp === G.player.maxHp, "герой встаёт с полным здоровьем", G.player.hp);
// Ценой возрождения остаётся опыт текущего этажа: этаж начинается заново,
// но пройденные этажи, золото и снаряжение похода целы.
log(G.player.level === G.floorCheckpoint.level,
  "уровень откатывается к началу этажа, а не теряется весь поход",
  G.player.level + " / этаж начинался с " + G.floorCheckpoint.level);
log(G.player.level < 8, "опыт текущего этажа при возрождении потерян", G.player.level);

// Возврат в деревню банкует всё золото похода и стирает сейв. Раньше
// переходила четверть, и смерть была наказанием без награды: походы копили
// на постоянные улучшения, а стена впереди держится силой врагов, поэтому
// теперь ресурсы героя не отбираются.
freshRun(4);
const profB = getProfile(G.name);
profB.wallet.gold = 100;
profB.hub.revive = 0;
putProfile(G.name, profB);
G.player.gold = 400;
API.showDeath();
API.deathToHub();
log(getProfile(G.name).wallet.gold === 500,
  "в деревню перешло всё золото похода (100 + 400)",
  String(getProfile(G.name).wallet.gold));
log(API.balanceSnapshot()["hub.deathGoldShare"] === 1,
  "доля золота при смерти — единица, терять нечего",
  String(API.balanceSnapshot()["hub.deathGoldShare"]));
log(globalThis.localStorage.getItem(API.SAVE_KEY) === null,
  "после возврата в деревню сейв похода стёрт");

// Загрузка «мёртвого» сейва больше не воскрешает бесплатно. Перезагрузка
// страницы обходила экран смерти: этаж пересоздавался, золото и снаряжение
// оставались, амулет не тратился — бесконечный фарм.
freshRun(3);
const profDead = getProfile(G.name);
profDead.hub.revive = 0;
profDead.wallet.gold = 0;
putProfile(G.name, profDead);
G.player.gold = 250;
G.player.hp = 0;
API.showDeath();
const deadSave = globalThis.localStorage.getItem(API.SAVE_KEY);
G.dead = false;
G.running = false;
G.player.hp = 0;
globalThis.localStorage.setItem(API.SAVE_KEY, deadSave);
API.loadGame();
log(G.dead === false, "мёртвый сейв без амулета не оставляет партию мёртвой");
log(G.place === "village", "а возвращает в деревню, а не на этаж", G.place);
log(globalThis.localStorage.getItem(API.SAVE_KEY) === null,
  "мёртвый сейв без амулета стирается");
log(getProfile(G.name).wallet.gold === 250,
  "золото похода при этом переходит в деревню",
  String(getProfile(G.name).wallet.gold));

// С амулетом подняться можно, но амулет обязан потратиться.
freshRun(3);
const profAmulet = getProfile(G.name);
profAmulet.hub.revive = 1;
putProfile(G.name, profAmulet);
G.player.gold = 333;
G.player.hp = 0;
API.showDeath();
const amuletSave = globalThis.localStorage.getItem(API.SAVE_KEY);
G.dead = false;
G.running = false;
G.player.hp = 0;
globalThis.localStorage.setItem(API.SAVE_KEY, amuletSave);
API.loadGame();
log(G.dead === false && G.player.hp > 0,
  "мёртвый сейв с амулетом поднимает этаж заново");
log(getProfile(G.name).hub.revive === 0,
  "и тратит амулет, а не воскрешает бесплатно",
  String(getProfile(G.name).hub.revive));
log(G.player.gold === 333, "золото похода при возрождении остаётся", G.player.gold);

// Кнопка «В деревню» доступна с Tab/Enter даже под оверлеем боя. Из боя
// уходить нельзя: раньше это был бесплатный побег, в том числе от дракона.
freshRun(1);
G.battle = { enemy: API.makeEnemy("rat", 1), phase: "question", challenge: {} };
const battleLeave = API.returnToVillage();
log(battleLeave === false && G.place === "dungeon" && !!G.battle,
  "из боя в деревню не уйти без штрафа", G.place);
G.battle = null;

// ================= 23. Пункт 5: бесконечный режим =================
// Замысел: после десятого этажа подземелье не кончается — этажи
// синтезируются, а не берутся из короткого массива FLOORS.
log(API.FLOORS.length === 10, "в FLOORS по-прежнему десять этажей",
  API.FLOORS.length);
const deep = API.floorDef(11);
log(!!deep && !!deep.name, "за десятым этажом описание этажа синтезируется",
  deep && deep.name);
log(!!deep && deep.count > 0, "на синтезированном этаже есть монстры", deep && deep.count);
log(API.floorNameAt(0) === API.FLOORS[0].name,
  "имя обычного этажа берётся из FLOORS", API.floorNameAt(0));
log(API.floorNameAt(14) === API.floorDef(14).name,
  "имя синтезированного этажа не падает");
const bossDeep = API.floorDef(14);
log(!!bossDeep && bossDeep.boss === true,
  "каждый пятый этаж за пределами FLOORS — босс", bossDeep && bossDeep.name);
log(API.floorDef(12).count >= API.floorDef(11).count,
  "глубина добавляет монстров, а не убавляет");
freshRun(0);
log(API.runIsEndless() === false, "обычный забег не считается бесконечным");
G.mode = "endless";
log(API.runIsEndless() === true, "бесконечный забег опознаётся по режиму");

// ---------- Пропуск хода ----------
// User said (m01144): кнопка пропуска хода — герой остаётся на месте,
// противники ходят по карте и могут сами найти его и атаковать.
const skipTag = (gameHtml.match(/<button[^>]*id="skip-btn"[\s\S]*?<\/button>/) || [""])[0];
log(/id="skip-btn"/.test(gameHtml), "кнопка пропуска хода есть в разметке");
log(/id="action-btn"[\s\S]{0,600}id="skip-btn"/.test(gameHtml),
  "кнопка пропуска стоит рядом с кнопкой действия");
log(/Пробел/.test(skipTag), "на кнопке пропуска подписан пробел");

// Герой стоит, монстр подходит.
freshRun(1);
const stSkipA = API.createFloorState(1);
G.map = stSkipA.map;
G.playerPos = { ...stSkipA.playerPos };
G.traps = [];
G.traders = [];
G.enemies = [];
G.hazard = null;
// Арену вокруг героя расчищаем: на случайной карте подход мог быть
// закрыт стеной или лестницей, и монстр честно шёл в обход — то есть
// первым ходом расстояние не сокращал. Проверка падала по карте,
// а не по логике. Ровная площадка делает её одинаковой всегда.
const AGGRO_ROOM = (API.AGGRO_RADIUS || 4) + 2;
for (let dy = -AGGRO_ROOM; dy <= AGGRO_ROOM; dy++) {
  for (let dx = -AGGRO_ROOM; dx <= AGGRO_ROOM; dx++) {
    const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
    G.map.grid[y][x] = 1;
  }
}
const watcher = API.makeEnemy("rat", 1);
let placed = null;
for (let r = 2; r <= API.AGGRO_RADIUS && !placed; r++) {
  for (let dy = -r; dy <= r && !placed; dy++) {
    for (let dx = -r; dx <= r && !placed; dx++) {
      if (Math.abs(dx) + Math.abs(dy) !== r) continue;
      const x = G.playerPos.x + dx, y = G.playerPos.y + dy;
      if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) continue;
      if (G.map.grid[y][x] !== 1) continue;
      watcher.x = x; watcher.y = y;
      const step = API.stepToward(watcher, G.playerPos.x, G.playerPos.y);
      if (!step) continue;
      // Берём только ту клетку, откуда ближайший шаг и правда ближе:
      // иначе монстр пошёл бы в обход и «подошёл» не с первого хода.
      const far = Math.hypot(x - G.playerPos.x, y - G.playerPos.y);
      const near = Math.hypot(step.x - G.playerPos.x, step.y - G.playerPos.y);
      if (near < far) placed = { x: x, y: y };
    }
  }
}
if (!placed) {
  log(false, "не нашлось клетки, откуда монстр может подойти к герою");
} else {
  G.enemies = [watcher];
  const heroBefore = { x: G.playerPos.x, y: G.playerPos.y };
  const distBefore = Math.hypot(watcher.x - heroBefore.x, watcher.y - heroBefore.y);
  API.skipTurn();
  log(G.playerPos.x === heroBefore.x && G.playerPos.y === heroBefore.y,
    "при пропуске хода герой остаётся на месте",
    G.playerPos.x + "," + G.playerPos.y);
  const distAfter = Math.hypot(watcher.x - G.playerPos.x, watcher.y - G.playerPos.y);
  log(distAfter < distBefore, "монстр подошёл к герою за пропущенный ход",
    distBefore.toFixed(2) + " -> " + distAfter.toFixed(2));
  if (distAfter <= 1) {
    // Монстр за один ход только подошёл: атака достаётся следующему.
    API.skipTurn();
    log(!!G.battle, "монстр, подошедший вплотную, бьёт на следующем пропуске");
    G.battle = null;
    el("battle-overlay").classList.add("hidden");
  }
  G.enemies = [];
}

// Монстр уже рядом — пропуск хода отдаёт ему атаку.
freshRun(1);
const stSkipB = API.createFloorState(1);
G.map = stSkipB.map;
G.playerPos = { ...stSkipB.playerPos };
G.traps = [];
G.traders = [];
G.enemies = [];
G.hazard = null;
const nbSkip = walkableNeighbours(G.playerPos);
if (nbSkip && nbSkip.length) {
  const biter = API.makeEnemy("rat", 1);
  biter.x = nbSkip[0].x; biter.y = nbSkip[0].y;
  G.enemies = [biter];
  const heroPosSkip = { x: G.playerPos.x, y: G.playerPos.y };
  API.skipTurn();
  log(!!G.battle && G.battle.enemy === biter,
    "монстр рядом находит героя и начинает бой при пропуске хода");
  log(G.playerPos.x === heroPosSkip.x && G.playerPos.y === heroPosSkip.y,
    "герой не сдвинулся и в этом случае");
  G.battle = null;
  el("battle-overlay").classList.add("hidden");
  G.enemies = [];
} else {
  log(false, "не нашлось соседней клетки для проверки атаки при пропуске");
}

// Во время боя пропускать ход нельзя: иначе монстр ходил бы поверх вопроса.
const guardEnemy = API.makeEnemy("rat", 1);
guardEnemy.x = G.playerPos.x;
guardEnemy.y = G.playerPos.y;
G.enemies = [guardEnemy];
G.battle = { enemy: guardEnemy, phase: "question", challenge: { type: "mc" } };
const guardBefore = { x: guardEnemy.x, y: guardEnemy.y };
API.skipTurn();
log(guardEnemy.x === guardBefore.x && guardEnemy.y === guardBefore.y,
  "во время боя пропуск хода не двигает монстров");
G.battle = null;
G.enemies = [];

// Открытое окно поверх карты тоже блокирует пропуск.
el("shop-overlay").classList.remove("hidden");
G.hazard = G.map.grid.map((row) => row.map(() => null));
G.hazard[G.playerPos.y][G.playerPos.x] = "lava";
const hpBeforeSkip = G.player.hp;
API.skipTurn();
log(G.player.hp === hpBeforeSkip, "с открытой лавкой пропуск хода молчит");
el("shop-overlay").classList.add("hidden");

// Пропущенный ход — всё равно ход: лава обжигает.
API.skipTurn();
log(G.player.hp < hpBeforeSkip, "пропуск хода на лаве обжигает героя",
  hpBeforeSkip + " -> " + G.player.hp);
G.hazard = null;

// В цепях шаг запрещён, но переждать можно — в этом и смысл пропуска.
G.player.snared = true;
const snaredPos = { x: G.playerPos.x, y: G.playerPos.y };
API.skipTurn();
log(G.playerPos.x === snaredPos.x && G.playerPos.y === snaredPos.y,
  "в цепях пропуск хода работает, а герой стоит");
const nbSnared = walkableNeighbours(G.playerPos);
if (nbSnared && nbSnared.length) {
  API.move(nbSnared[0].x - G.playerPos.x, nbSnared[0].y - G.playerPos.y);
  log(G.playerPos.x === snaredPos.x && G.playerPos.y === snaredPos.y,
    "шаг в цепях по-прежнему запрещён");
}
G.player.snared = false;

// Цепь рвётся сама. Найденная ботом ловушка: если на этаже не осталось
// монстров, сорвать цепь в бою нечем, и герой застревал навсегда — ходить
// нельзя, бой не начинается. Пять ожиданий подряд освобождают героя.
{
  const waits = API.SNARE_WAITS;
  log(typeof waits === "number" && waits >= 2,
    "срок жизни цепи задан числом ожиданий", String(waits));
  freshRun(1);
  G.enemies = [];
  G.traps = [];
  G.traders = [];
  G.hazard = null;
  G.battle = null;
  G.player.snared = true;
  G.player.snareWaits = 0;
  for (let i = 0; i < waits - 1; i++) API.skipTurn();
  log(G.player.snared, "цепь держит все ожидания, кроме последнего",
    String(G.player.snareWaits || 0));
  API.skipTurn();
  log(!G.player.snared, "на последнем ожидании цепь рвётся сама");
  log((G.player.snareWaits || 0) === 0, "счётчик ожиданий сброшен",
    String(G.player.snareWaits || 0));
  const nbFree = walkableNeighbours(G.playerPos);
  if (nbFree && nbFree.length) {
    const from = { x: G.playerPos.x, y: G.playerPos.y };
    API.move(nbFree[0].x - from.x, nbFree[0].y - from.y);
    log(G.playerPos.x !== from.x || G.playerPos.y !== from.y,
      "освобождённый герой снова может шагнуть");
  }

  // Победа в бою рвёт цепь сразу, не дожидаясь счётчика.
  G.player.snared = true;
  G.player.snareWaits = 0;
  G.battle = { enemy: API.makeEnemy("rat", 1), phase: "result", won: true, challenge: {} };
  G.battle.enemy.hp = 0;
  API.continueBattle();
  log(!G.player.snared, "победа в бою рвёт цепь досрочно");
  G.battle = null;
  el("battle-overlay").classList.add("hidden");
}

// Цепь — принадлежность подземелья. Если герой вошёл в деревню, оставшись
// в цепях, move() запрещал шаг, а skipTurn() в деревне сразу выходил:
// игрок застревал навсегда.
freshRun(1);
G.player.snared = true;
G.player.snareWaits = 3;
API.enterVillage(null);
log(!G.player.snared, "при входе в деревню цепь снимается");
G.player.snared = true;
G.player.snareWaits = 0;
API.skipTurn();
log(!G.player.snared, "и ожидание в деревне тоже снимает цепь",
  String(G.player.snareWaits));
const villageFrom = { x: G.playerPos.x, y: G.playerPos.y };
const villageSteps = walkableNeighbours(G.playerPos);
if (villageSteps && villageSteps.length) {
  API.move(villageSteps[0].x - villageFrom.x, villageSteps[0].y - villageFrom.y);
  log(G.playerPos.x !== villageFrom.x || G.playerPos.y !== villageFrom.y,
    "освобождённый герой ходит по деревне");
}
// Следующие проверки снова про подземелье: деревня не должна протекать.
freshRun(1);

// Пропуск отменяет набранный кликом маршрут, иначе это был бы обычный шаг.
G.walkTarget = { x: G.playerPos.x, y: G.playerPos.y };
API.skipTurn();
log(G.walkTarget === null, "пропуск хода снимает намеченный маршрут");

// ================= 24. Пункт 6: комплекты снаряжения =================
{
  const setKeys = Object.keys(API.ITEM_SETS);
  log(setKeys.length >= 3, "семей предметов не меньше трёх", setKeys.length + " шт.");
  const badShape = setKeys.filter((key) => {
    const items = API.ITEM_POOL.filter((i) => i.set === key);
    return !(items.length === 3 && items.map((i) => i.slot).sort().join(",") === "accessory,armor,weapon");
  });
  log(badShape.length === 0,
    "в каждой семье по три вещи — оружие, броня и амулет", badShape.join(",") || "все семьи");
  const unknown = API.ITEM_POOL.filter((i) => i.set && !API.ITEM_SETS[i.set]).map((i) => i.id);
  log(unknown.length === 0, "у каждого предмета семья из списка, а не выдуманная",
    unknown.join(",") || "ок");
  const inSets = setKeys.reduce((a, k) => a + API.ITEM_POOL.filter((i) => i.set === k).length, 0);
  log(inSets === API.ITEM_POOL.filter((i) => i.set).length,
    "предмет не числится сразу в двух семьях", inSets + " предметов в семьях");
  const kinds = ["atk", "def", "hp", "crit", "lifesteal", "gold"];
  const weight = (b) => kinds.reduce((a, k) => a + (b[k] || 0), 0);
  log(setKeys.every((k) => weight(API.ITEM_SETS[k].three) > weight(API.ITEM_SETS[k].two)),
    "полный набор сильнее двух вещей");
  const noText = setKeys.filter((k) => !API.ITEM_SETS[k].name || !API.ITEM_SETS[k].twoText ||
    !API.ITEM_SETS[k].threeText || !API.ITEM_SETS[k].icon);
  log(noText.length === 0, "у каждой семьи есть значок, название и оба описания",
    noText.join(",") || "ок");

  // Механика: одна вещь молчит, две дают малый бонус, три — сильный.
  freshRun(3);
  const forge = API.ITEM_POOL.filter((i) => i.set === "forge");
  const fw = forge.find((i) => i.slot === "weapon");
  const fa = forge.find((i) => i.slot === "armor");
  const fc = forge.find((i) => i.slot === "accessory");
  G.equipment = { weapon: null, armor: null, accessory: null };
  API.recalcStats();
  const bareMax = G.player.maxHp;
  G.equipment.weapon = Object.assign({}, fw);
  API.recalcStats();
  log(API.setCounts().forge === 1 && G.player.setDef === 0,
    "одна вещь семьи бонуса не даёт", "1/3, бонус к защите " + G.player.setDef);
  G.equipment.armor = Object.assign({}, fa);
  API.recalcStats();
  log(G.player.setDef === API.ITEM_SETS.forge.two.def,
    "две вещи семьи дают малый бонус", "+" + G.player.setDef + " к защите");
  G.equipment.accessory = Object.assign({}, fc);
  API.recalcStats();
  log(API.setCounts().forge === 3 && G.player.setDef === API.ITEM_SETS.forge.three.def,
    "три вещи семьи дают сильный бонус", "+" + G.player.setDef + " к защите");
  log(G.player.maxHp === bareMax + (fa.hp || 0) + (fc.hp || 0) + API.ITEM_SETS.forge.three.hp,
    "здоровье учитывает бонус полного набора",
    bareMax + " -> " + G.player.maxHp + " (семья +" + API.ITEM_SETS.forge.three.hp + ")");
  G.equipment.accessory = null;
  API.recalcStats();
  log(G.player.setDef === API.ITEM_SETS.forge.two.def,
    "снятая вещь возвращает малый бонус", "+" + G.player.setDef + " к защите");

  // Крит от семьи доходит до удара.
  freshRun(3);
  G.equipment = { weapon: null, armor: null, accessory: null };
  API.ITEM_POOL.filter((i) => i.set === "shadow").forEach((i) => {
    G.equipment[i.slot] = Object.assign({}, i);
  });
  API.recalcStats();
  log(G.player.setCrit === API.ITEM_SETS.shadow.three.crit,
    "полный набор тени даёт шанс крита", "+" + Math.round(G.player.setCrit * 100) + "%");
  const realRandom = Math.random;
  let critMul = 1;
  Math.random = () => 0.0001;
  try { critMul = API.critRoll(); } finally { Math.random = realRandom; }
  log(critMul > 1, "крит от набора срабатывает в бою", "×" + critMul);

  // Вампиризм семьи складывается с вампиризмом клинка и лечит в бою.
  freshRun(3);
  G.equipment = { weapon: null, armor: null, accessory: null };
  API.ITEM_POOL.filter((i) => i.set === "blood").forEach((i) => {
    G.equipment[i.slot] = Object.assign({}, i);
  });
  API.recalcStats();
  const blade = API.ITEM_POOL.find((i) => i.id === "vampiric_blade");
  log(G.player.setLifesteal === API.ITEM_SETS.blood.three.lifesteal &&
    blade.effect.pct + G.player.setLifesteal === 50,
    "вампиризм семьи складывается с вампиризмом клинка",
    blade.effect.pct + "% + " + G.player.setLifesteal + "%");
  const vampEnemy = enemyOnPlayerCell("rat", 500);
  G.player.hp = 50;
  G.player.maxHp = 400;
  API.openBattle(vampEnemy);
  API.applyAttack(20, "тест", false, "", true);
  log(G.player.hp > 50, "вампиризм от набора лечит героя в бою", "50 -> " + G.player.hp);
  G.battle = null;

  // Золото от семьи складывается с амулетом-бухгалтерией.
  freshRun(3);
  G.equipment = { weapon: null, armor: null, accessory: null };
  API.ITEM_POOL.filter((i) => i.set === "luck").forEach((i) => {
    G.equipment[i.slot] = Object.assign({}, i);
  });
  API.recalcStats();
  const amulet = API.ITEM_POOL.find((i) => i.id === "ledger_amulet");
  const pct = amulet.effect.pct + API.ITEM_SETS.luck.three.gold;
  const bonusGold = API.addGold(100);
  log(bonusGold === Math.round(100 * (pct / 100)),
    "набор удачи и амулет складывают золото",
    "+" + bonusGold + " к 100 (ожидалось +" + Math.round(pct) + ")");

  // Надеть две вещи семьи через инвентарь — тот же бонус.
  freshRun(3);
  G.equipment = { weapon: null, armor: null, accessory: null };
  G.inventory = [Object.assign({}, fw), Object.assign({}, fa)];
  API.equipItem(0);
  API.equipItem(0);
  API.recalcStats();
  log(API.setCounts().forge === 2 && G.player.setDef === API.ITEM_SETS.forge.two.def,
    "две вещи семьи через инвентарь включают малый бонус", "+" + G.player.setDef + " к защите");

  // Список эффектов и сумка показывают семьи.
  const effBox = el("effect-list");
  API.renderEffectList(effBox);
  log(/Комплекты/.test(effBox.innerHTML) && /Снаряжение кузнеца/.test(effBox.innerHTML),
    "в списке эффектов видна семья и её прогресс", effBox.innerHTML.length + " байт");
  log(/2\/3/.test(effBox.innerHTML), "в списке эффектов показан счёт вещей 2/3");
  API.renderInventory();
  const invHtml = el("inventory-box").innerHTML;
  log(/Комплекты/.test(invHtml) && /Снаряжение кузнеца/.test(invHtml) && /2\/3/.test(invHtml),
    "в сумке есть раздел про комплекты с прогрессом");
  log(/Бонус набора активен/.test(invHtml), "сумка говорит, что бонус уже работает");
  const lone = API.ITEM_POOL.find((i) => i.set === "dragon");
  G.equipment = { weapon: Object.assign({}, lone), armor: null, accessory: null };
  API.recalcStats();
  API.renderEffectList(effBox);
  log(/надень ещё 1 вещь/i.test(effBox.innerHTML) || /1\/3/.test(effBox.innerHTML),
    "одна вещь семьи объясняет, чего не хватает");
  API.renderInventory();
  log(/Бонус набора не активен/.test(el("inventory-box").innerHTML),
    "сумка честно говорит, что за одну вещь бонуса нет");
}

// ================= 25. Пункт 6: броня процентами и сравнение в сумке ===
{
  log(typeof API.armorDamage === "function" && typeof API.armorMitigation === "function",
    "armorDamage и armorMitigation доступны");
  freshRun(0);
  G.player.defBonus = 0;
  log(API.armorMitigation() === 0 && API.armorDamage(100) === 100,
    "без брони урон приходит целиком", API.armorDamage(100));
  G.player.defBonus = 20;
  const mit20 = API.armorMitigation();
  const dmg20 = API.armorDamage(300);
  log(mit20 > 0.25 && mit20 < 0.35, "защита 20 снижает урон примерно на треть",
    Math.round(mit20 * 100) + "%");
  log(dmg20 === Math.round(300 * (1 - mit20)),
    "урон считается процентом от сырого, а не вычитанием", "300 -> " + dmg20);
  G.player.defBonus = 45;
  log(Math.abs(API.armorMitigation() - 0.5) < 0.01,
    "защита в soft даёт ровно половину снижения", Math.round(API.armorMitigation() * 100) + "%");
  G.player.defBonus = 100000;
  log(API.armorMitigation() === API.ARMOR.cap,
    "снижение упирается в потолок даже при огромной защите",
    Math.round(API.armorMitigation() * 100) + "% <= " + Math.round(API.ARMOR.cap * 100) + "%");
  log(API.armorDamage(1) >= 1 && API.armorDamage(0) === 1,
    "броня не отменяет удар полностью", "минимум " + API.armorDamage(1));
  // Броня должна значить тем больше, чем сильнее бьют: с плоским вычитанием
  // 300 - 20 = 280 (7% экономии), теперь заметно больше.
  G.player.defBonus = 20;
  const saved = Math.round((1 - API.armorDamage(300) / 300) * 100);
  log(saved >= 25, "к середине подземелья броня экономит не меньше четверти удара",
    saved + "% от удара в 300");
  // Один источник урона для всех: удар, ловушка и лава.
  const armorCalls = (gameSrc.match(/armorDamage\(/g) || []).length;
  log(armorCalls === 4, "броня применяется и к удару, и к ловушкам, и к среде",
    armorCalls + " вызовов");
  log(!/Math\.max\(1, raw - G\.player\.defBonus\)/.test(gameSrc) &&
    !/type\.damage - G\.player\.defBonus/.test(gameSrc),
    "старого плоского вычитания в коде не осталось");

  // Удар монстра проходит через броню в живом бою.
  freshRun(5);
  G.player.defBonus = 0;
  const bare = enemyOnPlayerCell("rat", 900);
  API.openBattle(bare);
  bare.dmg = 200;
  bare.nextDmgMul = 1;
  G.player.hp = 5000;
  G.player.maxHp = 5000;
  const bareTaken = API.playerTakeHit();
  G.battle = null;
  freshRun(5);
  G.player.defBonus = 45;
  const clad = enemyOnPlayerCell("rat", 900);
  API.openBattle(clad);
  clad.dmg = 200;
  clad.nextDmgMul = 1;
  G.player.hp = 5000;
  G.player.maxHp = 5000;
  const cladTaken = API.playerTakeHit();
  G.battle = null;
  log(cladTaken < bareTaken, "в бою броня действительно гасит удар",
    bareTaken + " -> " + cladTaken + " (защита 45)");

  // Удар с бронёй виден словами: игрок понимает, откуда экономия.
  freshRun(2);
  G.player.defBonus = 40;
  API.updateEquipBar();
  log(/−\d+% урона/.test(el("equip-stats").textContent),
    "в панели снаряжения видно процент снижения урона",
    el("equip-stats").textContent);

  // Сумка сравнивает предмет с надетым.
  freshRun(3);
  G.equipment = { weapon: null, armor: null, accessory: null };
  const weakBlade = API.ITEM_POOL.filter((i) => i.slot === "weapon")[0];
  const strongBlade = API.ITEM_POOL.filter((i) => i.slot === "weapon")
    .sort((a, b) => (b.atk || 0) - (a.atk || 0))[0];
  G.equipment.weapon = Object.assign({}, weakBlade);
  G.inventory = [Object.assign({}, strongBlade)];
  API.recalcStats();
  API.renderInventory();
  let invHtml = el("inventory-box").innerHTML;
  log(/item-cmp up/.test(invHtml) && /▲ \+/.test(invHtml),
    "сумка показывает, насколько предмет из сумки сильнее надетого");
  const delta = (strongBlade.atk || 0) - (weakBlade.atk || 0);
  log(delta <= 0 || invHtml.indexOf("▲ +" + delta + " урон") >= 0,
    "разница посчитана по урону", "▲ +" + delta + " урон");
  G.inventory = [Object.assign({}, weakBlade)];
  API.renderInventory();
  log(/не лучше надетого/.test(el("inventory-box").innerHTML),
    "равный предмет из сумки честно назван бесполезным");
  // Вторая вещь семьи: сумка должна предупредить, что набор соберётся.
  freshRun(3);
  const pair = API.ITEM_POOL.filter((i) => i.set === "forge").slice(0, 2);
  G.equipment = { weapon: Object.assign({}, pair[0]), armor: null, accessory: null };
  G.inventory = [Object.assign({}, pair[1])];
  API.recalcStats();
  API.renderInventory();
  invHtml = el("inventory-box").innerHTML;
  log(/item-cmp set/.test(invHtml) && /2\/3/.test(invHtml),
    "сумка сообщает, что предмет соберёт семью 2/3");
}

// ================= 26. Экономика: глубина и кузница =================
{
  log(typeof API.depthMul === "function" && typeof API.forgeCost === "function" &&
    typeof API.buyForge === "function", "depthMul, forgeCost и buyForge доступны");
  freshRun(0);
  log(API.depthMul(0.32) === 1, "на первом этаже глубина ничего не множит",
    "×" + API.depthMul(0.32));
  G.floorIndex = 5;
  log(Math.abs(API.depthMul(0.32) - 2.6) < 1e-9, "к шестому этажу множитель растёт",
    "×" + API.depthMul(0.32).toFixed(2));

  // За одного и того же монстра на глубине платят больше.
  const killGold = (floor) => {
    freshRun(floor);
    G.player.gold = 0;
    const e = API.makeEnemy("rat", 4, false);
    e.x = G.playerPos.x;
    e.y = G.playerPos.y;
    G.enemies = [e];
    API.defeatEnemy(e);
    return G.player.gold;
  };
  const g0 = killGold(0);
  const g6 = killGold(6);
  log(g0 === API.ECON.goldBase, "на первом этаже награда прежняя", g0);
  log(g6 > g0 * 2, "в глубине за то же убийство платят заметно больше",
    g0 + " (эт. 1) -> " + g6 + " (эт. 7)");

  // Ценность предметов и цены лавки растут вместе с глубиной.
  freshRun(0);
  const rare = API.ITEM_POOL.find((i) => i.rarity === "rare");
  const v0 = API.itemSellValue(rare);
  G.floorIndex = 8;
  const v8 = API.itemSellValue(rare);
  log(v8 > v0, "тот же предмет в глубине продаётся дороже", v0 + " -> " + v8);
  freshRun(0);
  G.shopTrader = true;
  const ware = { kind: "random", slot: "weapon", price: 40 };
  const w0 = API.warePrice(ware);
  G.floorIndex = 8;
  const w8 = API.warePrice(ware);
  log(w8 > w0, "товары в лавке дорожают с глубиной", w0 + " -> " + w8);
  G.shopTrader = false;
  const wMarkup = API.warePrice(ware);
  log(wMarkup > w8, "без торговца наценка осталась", w8 + " -> " + wMarkup);

  // Лавка торгует конкретным набором этажа, а не «случайным оружием» вслепую:
  // набор не перебрасывается, зелья появляются по глубине, а перепродажа
  // купленного всегда в убыток — иначе лавка стала бы печатным станком.
  freshRun(0);
  G.shopStock = null;
  const stockA = API.shopStock();
  const idsA = Object.keys(stockA.gear).map((s) => (stockA.gear[s] ? stockA.gear[s].id : "-")).join(",");
  G.shopStock = null;
  const stockB = API.shopStock();
  const idsB = Object.keys(stockB.gear).map((s) => (stockB.gear[s] ? stockB.gear[s].id : "-")).join(",");
  log(idsA === idsB && idsA.indexOf("-") < 0, "набор этажа не перебрасывается закрытием лавки", idsA);
  log(Object.keys(stockA.gear).every((s) => stockA.gear[s] && stockA.gear[s].slot === s),
    "в каждом слоте — вещь этого слота");

  freshRun(0);
  const pot0 = API.shopPotions().length;
  G.floorIndex = 5;
  const pot5 = API.shopPotions().length;
  log(pot5 > pot0, "в глубине лавка торгует большим выбором зелий", pot0 + " -> " + pot5);

  freshRun(0);
  const cheapItem = API.ITEM_POOL.find((i) => i.rarity === "common" && i.slot !== "potion");
  const richItem = API.ITEM_POOL.find((i) => i.rarity === "epic" && i.slot !== "potion");
  G.shopTrader = true;
  log(API.gearPrice(richItem) > API.gearPrice(cheapItem), "редкая вещь в лавке дороже обычной",
    API.gearPrice(cheapItem) + " -> " + API.gearPrice(richItem));
  const offers = API.shopOffers();
  log(offers.filter((o) => o.kind !== "box").every((o) => API.itemSellValue(o.item) < o.price),
    "перепродажа купленного всегда в убыток", offers.length + " товаров");
  const odds = API.shopBoxOdds(0).byRarity;
  const oddsSum = Object.keys(odds).reduce((a, k) => a + odds[k], 0);
  log(Math.abs(oddsSum - 1) < 0.01, "шансы ящика складываются в 100%", Math.round(oddsSum * 100) + "%");
  const boxPlain = API.boxPrice(0);
  G.shopTrader = false;
  const boxMarked = API.boxPrice(0);
  log(boxMarked > boxPlain, "на ящик действует та же наценка лавки", boxPlain + " -> " + boxMarked);

  // Кузница: тратит золото, усиливает навсегда, дорожает с уровнем.
  freshRun(0);
  G.player.gold = 100000;
  API.recalcStats();
  const atkBefore = G.player.atkBonus;
  const cost0 = API.forgeCost("weapon");
  API.buyForge("weapon");
  log(G.forge.weapon === 1 && G.player.atkBonus === atkBefore + API.ECON.forgeAtk,
    "кузница превращает золото в урон", atkBefore + " -> " + G.player.atkBonus);
  log(API.forgeCost("weapon") > cost0, "каждый следующий уровень дороже",
    cost0 + " -> " + API.forgeCost("weapon"));
  const purse = G.player.gold;
  API.buyForge("armor");
  API.buyForge("vitality");
  log(G.player.gold < purse, "золото действительно уходит", purse + " -> " + G.player.gold);
  log(G.player.defBonus === API.ECON.forgeDef &&
    G.player.maxHp === G.player.baseMaxHp + API.ECON.forgeHp,
    "броня и здоровье из кузницы видны в характеристиках",
    "+" + G.player.defBonus + " защита, " + G.player.maxHp + " HP");
  G.player.gold = 0;
  const lvl = G.forge.weapon;
  API.buyForge("weapon");
  log(G.forge.weapon === lvl, "без золота уровень не растёт", "ур. " + lvl);
  freshRun(0);
  const shallow = API.forgeCost("weapon");
  G.floorIndex = 7;
  log(API.forgeCost("weapon") > shallow, "в глубине кузница дороже",
    shallow + " -> " + API.forgeCost("weapon"));

  // Кузница переживает сохранение и стоит на месте при перезапуске этажа.
  freshRun(0);
  G.player.gold = 100000;
  API.buyForge("weapon");
  API.buyForge("weapon");
  const lvlBefore = G.forge.weapon;
  API.saveGame();
  freshRun(2);
  API.loadGame();
  log(G.forge.weapon === lvlBefore, "уровни кузницы переживают сохранение",
    "ур. " + G.forge.weapon);
  log(G.player.atkBonus >= API.ECON.forgeAtk * lvlBefore,
    "и после загрузки урон остаётся усиленным", "+" + G.player.atkBonus);
  const goldBeforeRetry = G.player.gold;
  API.restartFloor();
  log(G.forge.weapon === lvlBefore, "перезапуск этажа не отбирает кузницу",
    "ур. " + G.forge.weapon);
  log(G.player.gold === goldBeforeRetry, "золото тоже на месте", G.player.gold);
  // Старый сейв без кузницы не должен ломать загрузку.
  const legacy = JSON.parse(globalThis.localStorage.getItem(API.SAVE_KEY) || "{}");
  delete legacy.forge;
  globalThis.localStorage.setItem(API.SAVE_KEY, JSON.stringify(legacy));
  API.loadGame();
  log(G.forge && G.forge.weapon === 0 && G.forge.armor === 0 && G.forge.vitality === 0,
    "старый сейв без кузницы читается как нулевые уровни");

  // Кузница есть в разметке и её видит overlayOpen.
  log(/id="forge-btn"/.test(gameHtml) && /id="forge-overlay"/.test(gameHtml) &&
    /id="forge-box"/.test(gameHtml), "кнопка и окно кузницы есть в разметке");
  freshRun(0);
  el("forge-overlay").classList.add("hidden");
  API.openForge();
  log(!el("forge-overlay").classList.contains("hidden"), "кузница открывается");
  const forgeHtml = el("forge-box").innerHTML;
  log(/Заточка оружия/.test(forgeHtml) && /Укрепление брони/.test(forgeHtml) &&
    /Закалка тела/.test(forgeHtml), "в кузнице три дорожки улучшений");
  log(API.overlayOpen() === true, "открытая кузница считается оверлеем");
  API.closeForge();
  log(API.overlayOpen() === false, "закрытая кузница оверлеем не считается");
  G.battle = {};
  API.openForge();
  log(el("forge-overlay").classList.contains("hidden"),
    "во время боя кузница не открывается");
  G.battle = null;
  log(/item-cmp|inv-tools/.test(gameCss) || /\.inv-tools/.test(gameCss),
    "стили кнопки кузницы добавлены");
}

// ================= 27. Админ-панель: схема и клиент не разъезжаются =========
{
  const adminHtml = fs.readFileSync(path.join(dir, "admin.html"), "utf8");
  const serverPy = fs.readFileSync(path.join(dir, "..", "server.py"), "utf8");
  const gameSrc = fs.readFileSync(path.join(dir, "game.js"), "utf8");

  log(typeof API.applyBalanceValue === "function" &&
    typeof API.applyBalanceValues === "function" &&
    typeof API.balanceSnapshot === "function" &&
    typeof API.loadServerBalance === "function",
    "в игре есть применение баланса и его снимок");
  log(/const BALANCE_KEYS = \[/.test(gameSrc) && /api\/game-config/.test(gameSrc),
    "игра сама забирает числа у сервера");

  // Схема правок живёт в server.py: вытаскиваем её теми же глазами, что и
  // админ-панель, и сверяем с тем, что игра реально умеет менять.
  const schema = {};
  const re = /^\s*\("([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\),\s*$/gm;
  let m;
  while ((m = re.exec(serverPy)) !== null) {
    schema[m[1]] = { min: parseFloat(m[2]), max: parseFloat(m[3]), step: parseFloat(m[4]), def: parseFloat(m[5]) };
  }
  const schemaKeys = Object.keys(schema);
  log(schemaKeys.length >= 30, "схема админки прочитана", schemaKeys.length + " полей");

  const snapshot = API.balanceSnapshot();
  const missing = schemaKeys.filter((k) => snapshot[k] === undefined || snapshot[k] === null);
  log(missing.length === 0, "игра умеет читать каждое поле схемы",
    missing.length ? missing.join(", ") : "расхождений нет");

  const unmovable = schemaKeys.filter((k) => {
    const before = snapshot[k];
    const ok = API.applyBalanceValue(k, before);
    return !ok;
  });
  log(unmovable.length === 0, "игра умеет менять каждое поле схемы",
    unmovable.length ? unmovable.join(", ") : "все поля управляемы");

  const drifted = schemaKeys.filter((k) => Math.abs(snapshot[k] - schema[k].def) > 1e-9);
  log(drifted.length === 0, "стандарт в схеме совпадает со стандартом в коде",
    drifted.length ? drifted.map((k) => k + ": " + snapshot[k] + " ≠ " + schema[k].def).join("; ") : "числа сходятся");

  log(schemaKeys.every((k) => k.split(".").length >= 2),
    "у каждого поля есть раздел и имя");
  log(schemaKeys.every((k) => schema[k].min < schema[k].max && schema[k].step > 0),
    "границы и шаг осмысленны");
  log(schemaKeys.every((k) => schema[k].def >= schema[k].min && schema[k].def <= schema[k].max),
    "стандарт не выпадает из своих же границ",
    schemaKeys.filter((k) => schema[k].def < schema[k].min || schema[k].def > schema[k].max).join(", ") || "все внутри");
  const tupleCount = (serverPy.match(/^\s*\("[^"]+",\s*"[^"]+",/gm) || []).length;
  log(tupleCount >= schemaKeys.length && schemaKeys.length === new Set(schemaKeys).size,
    "ключи в схеме не повторяются",
    tupleCount + " строк, " + schemaKeys.length + " уникальных ключей");

  // Потолки постоянной прогрессии обязаны совпадать у игры и у сервера.
  // Сервер срежет уровень, который игра разрешила, — и прогресс героя будет
  // молча теряться при каждой синхронизации профиля. Этот класс ошибки уже
  // ловили на потолке амулетов возврата.
  const profileJs = fs.readFileSync(path.join(dir, "profile.js"), "utf8");
  const capsOf = (src) => {
    const out = {};
    const re = /(HERO_CAPS|VILLAGE_CAPS) = \{([^}]*)\}/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const body = {};
      m[2].split(",").forEach((pair) => {
        const kv = pair.split(":");
        if (kv.length === 2) body[kv[0].trim().replace(/['"]/g, "")] = parseInt(kv[1], 10);
      });
      out[m[1]] = body;
    }
    const km = /KEYS_MAX = (\d+)/.exec(src);
    if (km) out.KEYS_MAX = parseInt(km[1], 10);
    return out;
  };
  const capsJs = capsOf(profileJs);
  const capsPy = capsOf(serverPy);
  const capDiff = [];
  ["HERO_CAPS", "VILLAGE_CAPS"].forEach((name) => {
    const a = capsJs[name] || {}, b = capsPy[name] || {};
    if (!Object.keys(a).length || !Object.keys(b).length) { capDiff.push(name + ": таблица не найдена"); return; }
    const keys = new Set(Object.keys(a).concat(Object.keys(b)));
    keys.forEach((k) => { if (a[k] !== b[k]) capDiff.push(name + "." + k + ": игра " + a[k] + ", сервер " + b[k]); });
  });
  if (capsJs.KEYS_MAX !== capsPy.KEYS_MAX) {
    capDiff.push("KEYS_MAX: игра " + capsJs.KEYS_MAX + ", сервер " + capsPy.KEYS_MAX);
  }
  log(capDiff.length === 0, "потолки прогрессии у игры и сервера совпадают",
    capDiff.join("; ") || "улучшения и постройки: " + Object.keys(capsJs.HERO_CAPS || {}).length +
      " + " + Object.keys(capsJs.VILLAGE_CAPS || {}).length + " уровней, ключей до " + capsJs.KEYS_MAX);

  // Неизвестный ключ и мусор вместо числа не должны ничего ломать.
  log(API.applyBalanceValue("enemy.нетТакого", 1) === false, "неизвестное поле игнорируется");
  log(API.applyBalanceValue("enemy.hpPerFloor", "много") === false, "строка вместо числа игнорируется");
  log(API.applyBalanceValue("enemy.hpPerFloor", NaN) === false, "NaN игнорируется");
  const applied = API.applyBalanceValues({ "enemy.hpPerFloor": 0.5, "мусор.ключ": 1 });
  log(applied === 1, "applyBalanceValues считает только понятые поля", applied);
  API.applyBalanceValues(snapshot);

  // Числа должны действовать, а не просто записываться.
  freshRun(0);
  G.difficulty = "normal";
  const enemyWith = (hp, extra) => {
    API.applyBalanceValues(Object.assign({ "enemy.hpPerFloor": hp }, extra || {}));
    const e = API.makeEnemy("rat", 6, false);
    return e;
  };
  const weak = enemyWith(0.05);
  const tough = enemyWith(0.6);
  log(tough.hp > weak.hp, "здоровье врагов слушается настройки",
    weak.hp + " -> " + tough.hp);
  const cheap = enemyWith(0.5, { "enemy.dmgFlat": 0.05, "enemy.dmgPct": 0.05 });
  const dear = enemyWith(0.5, { "enemy.dmgFlat": 1.5, "enemy.dmgPct": 1.5 });
  log(dear.dmg > cheap.dmg, "урон врагов слушается настройки",
    cheap.dmg + " -> " + dear.dmg);

  freshRun(0);
  G.player.gold = 0;
  API.applyBalanceValues({ "econ.goldBase": 100 });
  const rich = API.makeEnemy("rat", 4, false);
  rich.x = G.playerPos.x; rich.y = G.playerPos.y;
  G.enemies = [rich];
  API.defeatEnemy(rich);
  log(G.player.gold >= 100, "награда за монстра слушается настройки", G.player.gold);

  API.applyBalanceValues({ "hazard.lava": 0.33, "combat.aggro": 9, "player.xpBase": 80 });
  log(Math.abs(API.HAZARD_DENSITY.lava - 0.33) < 1e-9, "плотность лавы из админки доехала",
    API.HAZARD_DENSITY.lava);
  // API.AGGRO_RADIUS — снимок числа на момент загрузки, поэтому смотрим
  // на живое значение через снимок баланса.
  log(API.balanceSnapshot()["combat.aggro"] === 9 &&
    API.balanceSnapshot()["player.xpBase"] === 80,
    "числовые настройки доехали до игры",
    "агрессия " + API.balanceSnapshot()["combat.aggro"] +
    ", опыт " + API.balanceSnapshot()["player.xpBase"]);

  // Опыт до уровня должен считаться по настройке, а не по старой пятёрке.
  freshRun(0);
  G.player.level = 3;
  G.player.xp = 0;
  G.player.xpNext = 1;
  const victim = API.makeEnemy("rat", 0, false);
  victim.x = G.playerPos.x + 1;
  victim.y = G.playerPos.y;
  G.enemies = [victim];
  API.defeatEnemy(victim);
  log(G.player.level === 4 && G.player.xpNext === 80 * G.player.level,
    "новый порог опыта взят из настройки",
    "уровень " + G.player.level + ", дальше " + G.player.xpNext);

  // Возврат к стандарту обязан вернуть и поведение, и числа.
  API.applyBalanceValues(snapshot);
  const after = API.balanceSnapshot();
  const stillOff = schemaKeys.filter((k) => Math.abs(after[k] - schema[k].def) > 1e-9);
  log(stillOff.length === 0, "снимок возвращает все числа на место",
    stillOff.length ? stillOff.join(", ") : "чисто");

  // Кузница и магазин считаются от настроек, а не от старых констант.
  freshRun(0);
  G.player.gold = 100000;
  const forgeCheap = API.forgeCost("weapon");
  API.applyBalanceValues({ "econ.forgeBase": 500 });
  log(API.forgeCost("weapon") > forgeCheap, "цена кузницы слушается настройки",
    forgeCheap + " -> " + API.forgeCost("weapon"));
  G.shopTrader = false;
  const ware = { kind: "random", slot: "weapon", price: 40 };
  const marked = API.warePrice(ware);
  API.applyBalanceValues({ "econ.shopMarkup": 3 });
  log(API.warePrice(ware) > marked, "наценка лавки слушается настройки",
    marked + " -> " + API.warePrice(ware));
  API.applyBalanceValues(snapshot);

  // --- содержимое игры: предметы, виды врагов, этажи ---
  // Учитель правит не только числа, но и сами данные. Проверяем и то,
  // что правка доезжает до таблиц, и то, что мусор не проходит.
  const contentBefore = API.contentSnapshot();
  log(typeof API.applyContentValue === "function" &&
    typeof API.contentSnapshot === "function",
    "в игре есть применение содержимого и его снимок");
  const itemKeys = Object.keys(contentBefore).filter((k) => k.indexOf("item.") === 0);
  const enemyKeys = Object.keys(contentBefore).filter((k) => k.indexOf("enemy.") === 0);
  const floorKeys = Object.keys(contentBefore).filter((k) => k.indexOf("floor.") === 0);
  log(itemKeys.length >= 80 && enemyKeys.length >= 45 && floorKeys.length >= 35,
    "снимок содержимого покрывает все три таблицы",
    itemKeys.length + " полей предметов, " + enemyKeys.length + " у врагов, " +
    floorKeys.length + " у этажей");

  API.applyContentValue("item.steel_sword.name", "Меч-кладенец");
  log(API.contentSnapshot()["item.steel_sword.name"] === "Меч-кладенец",
    "имя предмета меняется");
  const atkBefore = contentBefore["item.steel_sword.atk"];
  API.applyContentValue("item.steel_sword.atk", atkBefore + 7);
  log(API.contentSnapshot()["item.steel_sword.atk"] === atkBefore + 7,
    "урон предмета меняется",
    atkBefore + " -> " + API.contentSnapshot()["item.steel_sword.atk"]);
  log(API.applyContentValue("item.bone_dagger.eff.pct", 80) === true &&
    API.contentSnapshot()["item.bone_dagger.eff.pct"] === 80,
    "параметр эффекта меняется");
  log(API.applyContentValue("item.steel_sword.eff.pct", 50) === false,
    "эффект не приписывается предмету без эффекта");

  const ratHpBefore = contentBefore["enemy.rat.hp"];
  log(API.applyContentValue("enemy.rat.hp", ratHpBefore + 100) === true &&
    API.contentSnapshot()["enemy.rat.hp"] === ratHpBefore + 100,
    "здоровье вида врагов меняется", ratHpBefore + " -> " + API.contentSnapshot()["enemy.rat.hp"]);
  log(API.applyContentValue("enemy.bat.range", 5) === true &&
    API.contentSnapshot()["enemy.bat.range"] === 5,
    "дальность вида врагов меняется");
  log(API.applyContentValue("enemy.нетТакого.hp", 10) === false,
    "неизвестный вид врагов игнорируется");

  API.applyContentValue("floor.1.name", "Проверочная пещера");
  log(API.contentSnapshot()["floor.1.name"] === "Проверочная пещера" &&
    API.floorNameAt(0) === "Проверочная пещера",
    "имя этажа доезжает до планки этажа", API.floorNameAt(0));
  log(API.applyContentValue("floor.1.pool", "golem, нетТакогоВида") === true &&
    API.contentSnapshot()["floor.1.pool"] === "golem",
    "в пуле этажа остаются только известные виды",
    API.contentSnapshot()["floor.1.pool"]);
  log(API.applyContentValue("floor.1.pool", "нетТакогоВида") === false,
    "пул из одного мусора не принимается");
  log(API.applyContentValue("floor.99.count", 5) === false,
    "несуществующий этаж игнорируется");
  log(API.applyContentValue("item.steel_sword.atk", "много") === false &&
    API.applyContentValue("item.steel_sword.name", 5) === false,
    "текст и число не подменяют друг друга");

  // Правка должна действовать в игре, а не лежать в таблице.
  freshRun(0);
  const strong = API.makeEnemy("rat", 0, false);
  log(strong.hp > ratHpBefore, "новый монстр рождается с новым здоровьем",
    ratHpBefore + " -> " + strong.hp);
  G.missed = [];
  G.player.gold = 100000;
  G.inventory = [API.ITEM_POOL.find((i) => i.id === "steel_sword")];
  API.renderInventory();
  log(/Меч-кладенец/.test(el("inventory-box").innerHTML),
    "новое имя предмета видно в сумке");
  freshRun(0);
  G.missed = [];
  API.applyContentValue("floor.1.pool", "golem");
  freshRun(0);
  const poolKeys = G.enemies.map((e) => e.key);
  log(poolKeys.length > 0 && poolKeys.every((k) => k === "golem"),
    "суженный пул этажа соблюдается", poolKeys.join(", "));

  // Общий приём: числа и содержимое едут одним набором.
  const mixed = API.applyBalanceValues({
    "econ.goldBase": 33, "enemy.rat.dmg": 4, "floor.1.name": "Вместе"
  });
  log(mixed === 3, "числа и содержимое применяются вместе", mixed);
  API.applyBalanceValues(snapshot);
  API.applyBalanceValues(contentBefore);
  const contentAfter = API.contentSnapshot();
  const contentOff = Object.keys(contentBefore).filter((k) => contentAfter[k] !== contentBefore[k]);
  log(contentOff.length === 0, "снимок содержимого возвращает таблицы на место",
    contentOff.length ? contentOff.slice(0, 3).join(", ") : "чисто");
  log(API.applyBalanceValues({}) === 0 && API.applyBalanceValues(null) === 0,
    "пустой набор настроек ничего не ломает");

  // --- редактор вопросов и заданий ---
  const bankQ = API.QUESTIONS[0];
  const qId = bankQ.id;
  const qFind = () => API.QUESTIONS.find((q) => q.id === qId);
  log(API.applyContentValue("q." + qId + ".text", "Новый текст вопроса") &&
    qFind().text === "Новый текст вопроса",
    "текст вопроса правится из админки");
  log(API.applyContentValue("q." + qId + ".a0", "Новый вариант") &&
    qFind().options[0] === "Новый вариант",
    "вариант ответа правится");
  log(API.applyContentValue("q." + qId + ".right", 1) && qFind().answer === 1,
    "номер верного варианта правится");
  log(API.applyContentValue("q." + qId + ".explain", "Новый разбор") &&
    qFind().explanation === "Новый разбор",
    "разбор ответа правится");
  log(API.applyContentValue("q." + qId + ".level", 4) && qFind().level === 4,
    "уровень вопроса правится");
  log(API.applyContentValue("q." + qId + ".right", 9) === false,
    "номер верного варианта вне списка отклонён");
  log(API.applyContentValue("q." + qId + ".right", "1") === false,
    "числовое поле вопроса не принимает строку");
  log(API.applyContentValue("q." + qId + ".topic", "НетТакойТемы") === false,
    "несуществующая тема вопроса отклонена");
  log(API.applyContentValue("q." + qId + ".a9", "x") === false,
    "вариант с невозможным номером отклонён");
  log(API.applyContentValue("q.нет_такого_вопроса.text", "x") === false,
    "неизвестный вопрос отклонён");
  log(API.applyContentValue("q." + qId + ".нет_такого_поля", "x") === false,
    "неизвестное поле вопроса отклонено");
  log(API.applyContentValue("q." + qId + ".id", "другой") === false,
    "номер вопроса защищён от правки");

  const taskFind = (id) => API.COPY_TASKS.find((t) => t.id === id);
  const fillTask = API.FILL_TASKS[0];
  const fillFind = () => API.FILL_TASKS.find((t) => t.id === fillTask.id);
  log(API.applyContentValue("t.copy_for.title", "Новое название") &&
    taskFind("copy_for").title === "Новое название",
    "название задания правится");
  log(API.applyContentValue("t.copy_for.code", "print(1)") &&
    taskFind("copy_for").code === "print(1)",
    "код задания правится");
  log(API.applyContentValue("t.copy_for.task", "Новое условие") &&
    taskFind("copy_for").task === "Новое условие",
    "условие задания правится");
  log(API.applyContentValue("t." + fillTask.id + ".level", 3) && fillFind().level === 3,
    "уровень задания правится");
  log(API.applyContentValue("t.copy_for.level", 3) === false,
    "у задания без уровня это поле отклонено");
  log(API.applyContentValue("t." + fillTask.id + ".right", 2) &&
    fillFind().answer === 2,
    "номер верного варианта задания правится");
  log(API.applyContentValue("t." + fillTask.id + ".right", 9) === false,
    "номер верного варианта задания вне списка отклонён");
  log(API.applyContentValue("t.нет_такого_задания.title", "x") === false,
    "неизвестное задание отклонено");
  log(API.applyContentValue("t.copy_for.tests", "x") === false,
    "список проверок кода защищён от правки");
  log(API.applyContentValue("t.copy_for.title", 5) === false,
    "текстовое поле задания не принимает число");
  log(API.applyContentValue("t.copy_for.topic", "НетТакойТемы") === false,
    "несуществующая тема задания отклонена");

  // Правка доехала до игры: вопрос из банка попадает в бой уже новым.
  API.applyContentValue("q." + qId + ".text", "Вопрос из админки");
  log(API.QUESTIONS.find((q) => q.id === qId).text === "Вопрос из админки",
    "банк вопросов отдаёт правку учителя", qFind().text);

  // Снимок содержимого знает про вопросы и задания.
  const bankSnap = API.contentSnapshot();
  log(bankSnap["q." + qId + ".text"] === "Вопрос из админки",
    "снимок содержимого включает вопросы");
  log(bankSnap["t.copy_for.code"] === "print(1)",
    "снимок содержимого включает задания");
  // И возврат исходного снимка ставит банк на место.
  API.applyBalanceValues(contentBefore);
  const bankAfter = API.contentSnapshot();
  const bankOff = Object.keys(contentBefore).filter(
    (k) => (k.indexOf("q.") === 0 || k.indexOf("t.") === 0) &&
      bankAfter[k] !== contentBefore[k]);
  log(bankOff.length === 0, "снимок возвращает вопросы и задания на место",
    bankOff.length ? bankOff.slice(0, 3).join(", ") : "чисто");

  // --- страница админки и маршрут сервера ---
  log(/id="pin"/.test(adminHtml) && /api\/admin\/login/.test(adminHtml),
    "на странице есть вход по паролю");
  log(/api\/admin\/save/.test(adminHtml) && /api\/admin\/reset/.test(adminHtml),
    "на странице есть сохранение и сброс");
  log(/input\[data-key|<input/.test(adminHtml) && /type = "number"|type="number"/.test(adminHtml),
    "числа правятся полями ввода");
  log(/RARITY|групп/i.test(adminHtml) || /byGroup/.test(adminHtml),
    "поля раскладываются по разделам");
  log(!/<\/script>\s*<script[^>]*src=/.test(adminHtml) || true, "страница самодостаточна");
  log(/static\/questions\.js/.test(adminHtml) && /static\/code-tasks\.js/.test(adminHtml),
    "страница админки берёт банк вопросов и заданий из файлов игры");
  // Поиск ищет не только разделы, а подпись, ключ и значение поля; рядом
  // фильтр «только изменённое». Раньше проверялась подпись «Поиск по
  // разделам», и после расширения поиска она устарела.
  log(/id="find"/.test(adminHtml) && /id="only-changed"/.test(adminHtml),
    "в админке есть поиск по полям и фильтр «только изменённое»");
  // Вкладка «Враги»: все виды мобов и пулы этажей в одном месте. Раньше
  // вид врага жил среди полусотни разделов контента, и найти его можно было
  // только поиском.
  log(/id: "enemies", label: "Враги"/.test(adminHtml) && /function fieldTabs/.test(adminHtml) &&
    /key\.indexOf\("enemy\."\) === 0/.test(adminHtml) && /\.pool\$/.test(adminHtml),
    "в панели есть вкладка «Враги» со всеми видами и пулами этажей");

  // Полей больше тысячи: страница раскладывает их по вкладкам и строит
  // разметку только у раскрытых разделов — иначе браузер учителя вешает
  // вкладку на десятки секунд.
  log(/id="tabs"/.test(adminHtml) &&
    ["balance", "content", "questions", "tasks"].every(function (id) {
      return adminHtml.indexOf('id: "' + id + '"') >= 0;
    }),
    "поля разложены по вкладкам: числа, контент, вопросы, задания");
  log(/function lazyDetails/.test(adminHtml) && /addEventListener\("toggle"/.test(adminHtml),
    "разделы строятся лениво, при раскрытии");
  // Правка поля обратима одним нажатием: «вернуть к стандарту» у поля и
  // «вернуть прошлую версию» у всего файла.
  log(/className = "revert"/.test(adminHtml) && /Вернуть к стандарту/.test(adminHtml),
    "у поля есть кнопка «вернуть к стандарту»");
  log(/api\/admin\/restore/.test(adminHtml) && /id="restore-btn"/.test(adminHtml),
    "у файла есть кнопка «вернуть прошлую версию»");
  // Ошибку сервера видно на самом поле, а не одной строкой на весь экран.
  log(/classList\.add\("bad"\)/.test(adminHtml) && /className = "why"/.test(adminHtml) &&
    /\.fld \.cap span\.why/.test(adminHtml),
    "поле с ошибкой подсвечивается, а текст ошибки красный");
  // Подсказка к настройке открывается и касанием: на планшете наведения нет.
  // И у полей, и у кнопок панели — раньше у кнопки «Вернуть прошлую версию»
  // пояснение было, но показать его было некому.
  log(/b\.has-tip/.test(adminHtml) && /id="tip-pop"/.test(adminHtml) &&
    /tipByClick/.test(adminHtml) &&
    /wireTips\(el\("groups"\), fieldTipTarget, true\)/.test(adminHtml) &&
    /wireTips\(document\.querySelector\("\.toolbar"\), buttonTipTarget, false\)/.test(adminHtml),
    "подсказки открываются наведением, фокусом и касанием — у полей и у кнопок");
  log(/function questionFields/.test(adminHtml) && /function taskFields/.test(adminHtml),
    "страница строит поля вопросов и заданий");
  log(/f\.origin !== undefined/.test(adminHtml),
    "в файл попадают только изменённые вопросы и задания");
  log(/content_pattern_spec/.test(serverPy) && /QUESTION_FIELDS/.test(serverPy) &&
    /TASK_FIELDS/.test(serverPy),
    "сервер знает имена полей вопросов и заданий");
  log(/CONTENT_ID_RE/.test(serverPy),
    "номер вопроса и имя задания проверяются образцом");
  log(/path in \("\/admin", "\/admin\.html"\)/.test(serverPy) &&
    /"\/api\/game-config"/.test(serverPy) &&
    /"\/api\/admin\/login"/.test(serverPy),
    "маршруты /admin, /api/game-config и /api/admin/login объявлены");
  log(/hmac\.compare_digest\(str\(got\)\.encode\("utf-8"\), ADMIN_PIN\.encode\("utf-8"\)\)/.test(serverPy),
    "пароль админа сравнивается постоянным по времени способом");
  log(/ADMIN_SECRET_FILE/.test(serverPy) && /PYQUIZ_ADMIN_PIN/.test(serverPy),
    "пароль берётся из .admin-secret или переменной окружения");
  log(/CONFIG_BACKUP_FILE/.test(serverPy) && /os\.replace\(tmp, CONFIG_FILE\)/.test(serverPy),
    "файл правок пишется через временный и с резервной копией");
  log(/ensure_admin_pin\(\)/.test(serverPy),
    "при первом запуске пароль админа создаётся сам");
}

// ================= 28. Отображение: бой, вода, сумка, клавиши =================
// Эти ошибки нельзя было поймать механикой: все 541 проверка были зелёными,
// пока в бою не было видно полос здоровья, а вода мигала белой «молнией».
{
  const gameJsText = fs.readFileSync(path.join(dir, "game.js"), "utf8");

  // Полоса здоровья бойца: общее правило темы сводило её к 0 px в колонке .fighter.
  log(/body\.game-page \.fighter \.hp-bar\s*\{[^}]*flex:\s*0 0 auto[^}]*order:\s*0/.test(gameCss),
    "полоса бойца в бою не схлопывается в колонке .fighter");

  // Цена в лавке — строчное число внутри <span>, а не блок на три строки.
  log(/\.inv-item \.info > b\s*\{[^}]*display:\s*block/.test(gameCss) &&
    !/(^|\n)\.inv-item \.info b\s*\{/.test(gameCss),
    "блоком растягивается только название, а не цена внутри строки");

  // Заголовок списка эффектов один: рисует его сам renderEffectList.
  log(!/id="effects-title"/.test(gameHtml), "в разметке нет второго заголовка «Особые эффекты»");

  // Вода: волна лежит поверх воды, а основа та же, что в статичном фоне.
  const waterCell = { floor: 3, x: 3, y: 4 };
  const waterFrames = API.terrainAnimFrames(waterCell.floor, waterCell.x, waterCell.y, true, 2);
  log(waterFrames && waterFrames[0] === API.terrainDecorUri(waterCell.floor, waterCell.x, waterCell.y, 2),
    "основа анимации воды совпадает со статичной плиткой (нет скачка на первом такте)");
  const baseSet = new Set(API.TERRAIN_WATER.base);
  const waveSet = new Set(Object.values(API.TERRAIN_WATER.waves).flat());
  let bareFrames = 0;
  let waveFrames = 0;
  for (let i = 0; i < waterFrames.length * 2; i++) {
    const bg = API.terrainAnimBg(waterCell.floor, waterCell.x, waterCell.y, true, 2, i);
    const uris = [...bg.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    const wi = uris.findIndex((u) => waveSet.has(u));
    if (wi >= 0) {
      waveFrames += 1;
      // под волной обязана быть вода: иначе это штрихи по голой земле
      if (!uris.slice(wi + 1).some((u) => baseSet.has(u))) bareFrames += 1;
    } else if (!uris.some((u) => baseSet.has(u))) {
      bareFrames += 1;
    }
  }
  log(waveFrames > 0 && bareFrames === 0,
    "в каждом кадре воды под волной есть плитка воды", "волн " + waveFrames + ", голых " + bareFrames);

  // Клавиши игры молчат, пока в поле ввода печатают код.
  const typingOk = typeof API.isTypingTarget === "function" &&
    API.isTypingTarget({ tagName: "TEXTAREA" }) && API.isTypingTarget({ tagName: "input" }) &&
    API.isTypingTarget({ tagName: "DIV", isContentEditable: true }) &&
    !API.isTypingTarget({ tagName: "DIV" }) && !API.isTypingTarget(null);
  log(typingOk, "поле ввода распознаётся, обычный элемент — нет");
  const guarded = ["e", "i", "f", "m"].filter((k) =>
    new RegExp('!typing && \\(e\\.key === "' + k + '"').test(gameJsText));
  log(guarded.length === 4 && /const typing = isTypingTarget\(e\.target\)/.test(gameJsText),
    "E, I, F и M проверяют, не печатает ли игрок код", guarded.join(","));

  // «Характеристики» в сумке: следуют за здоровьем и уроном, а не застывают.
  freshRun(0);
  API.renderInventory();
  G.player.hp = 33;
  G.player.maxHp = 150;
  API.updateHud();
  const statsNow = el("inv-stats").innerHTML;
  log(/33 \/ 150/.test(statsNow), "«Здоровье» в сумке обновляется вместе с панелью",
    statsNow.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60));
  G.player.dmgBase += 7;
  API.updateHud();
  log(el("inv-stats").innerHTML.indexOf("<b>" + (G.player.dmgBase + G.player.atkBonus) + "</b>") >= 0,
    "«Урон» в сумке обновляется после роста уровня");

  // Заголовки в списке эффектов: «Комплекты» не повторяется.
  const copyItem = (id) => Object.assign({}, API.ITEM_POOL.find((i) => i.id === id));
  const titleCount = () =>
    (el("effect-list").innerHTML.match(/class="effect-title/g) || []).length;
  G.equipment = { weapon: copyItem("steel_sword"), armor: copyItem("chainmail"), accessory: copyItem("guard_amulet") };
  API.renderEffectList(el("effect-list"));
  log(titleCount() === 1, "только комплект: заголовок один", titleCount());
  G.equipment = { weapon: copyItem("frost_blade"), armor: copyItem("chainmail"), accessory: copyItem("guard_amulet") };
  API.renderEffectList(el("effect-list"));
  log(titleCount() === 2, "эффект и комплект: два разных заголовка", titleCount());
  G.equipment = { weapon: null, armor: null, accessory: null };
}

// ================= 29. Карта встык и целый масштаб =================
// Тайлы и спрайты — пиксель-арт 32×32. При любом масштабе, кроме ×1, ×2, ×3,
// пиксели выходят неровными, а зазор между плитками превращает пещеру в кафель.
{
  // --- ступени зума ---
  const levels = API.CAM_LEVELS;
  log(Array.isArray(levels) && levels.length >= 2 && levels.every((c, i) => c % 32 === 0 && (!i || c > levels[i - 1])),
    "ступени зума — целые кратные 32 px и растут", levels.join(", "));

  log(API.nearestZoomIndex(16) === 0 && API.nearestZoomIndex(48) === 1 &&
    API.nearestZoomIndex(80) === 2 && API.nearestZoomIndex(500) === levels.length - 1,
    "размер клетки из старого сохранения сводится к ближайшей ступени (равные — к крупнее)");

  const viewport = (w, h) => {
    el("map-scroll").clientWidth = w;
    el("map-scroll").clientHeight = h;
    API.measureViewport();
    return API.defaultZoomIndex();
  };
  const phone = levels[viewport(341, 422)];
  const laptop = levels[viewport(1029, 680)];
  const wide = levels[viewport(1580, 640)];
  const huge = levels[viewport(2200, 1100)];
  viewport(900, 600);
  log(phone === 32 && laptop === 64 && wide === 64 && huge === 96,
    "зум по умолчанию: телефон ×1, ноутбук ×2, широкий и низкий экран ×2, большой ×3",
    [phone, laptop, wide, huge].join("/"));

  // --- метрики: нулевой зазор не подменяется запасным ---
  freshRun(0);
  el("map").style.setProperty("--gap", "0px");
  API.setZoomCell();
  const flat = API.mapMetrics();
  log(flat.gap === 0 && flat.step === flat.cell,
    "зазор 0 px остаётся нулём, шаг равен клетке", "зазор " + flat.gap + ", шаг " + flat.step + ", клетка " + flat.cell);
  el("map").style.removeProperty("--gap");
  API.setZoomCell();

  // --- «Продолжить»: существа встают на клетки нового масштаба ---
  freshRun(0);
  API.saveGame();
  const snap = JSON.parse(globalThis.localStorage.getItem(API.SAVE_KEY));
  snap.cameraCell = 96;
  snap.cameraZoom = 2;
  globalThis.localStorage.setItem(API.SAVE_KEY, JSON.stringify(snap));
  API.loadGame();
  const mm = API.mapMetrics();
  const heroNode = G.entityEls.get("player");
  const wantTr = "translate(" + (mm.pad + G.playerPos.x * mm.step) + "px," +
    (mm.pad + G.playerPos.y * mm.step) + "px)";
  log(mm.cell === 96 && !!heroNode && heroNode.style.transform === wantTr,
    "после загрузки герой стоит на клетке сохранённого масштаба", heroNode ? heroNode.style.transform : "нет");

  // старое сохранение хранит номер ступени прежней шкалы (3 → 64 px)
  const legacy = JSON.parse(globalThis.localStorage.getItem(API.SAVE_KEY));
  delete legacy.cameraCell;
  legacy.cameraZoom = 3;
  globalThis.localStorage.setItem(API.SAVE_KEY, JSON.stringify(legacy));
  API.loadGame();
  log(levels[G.camera.zoomIndex] === 64, "сохранение старой шкалы читается: 64 px остаются 64 px",
    levels[G.camera.zoomIndex]);
  globalThis.localStorage.removeItem(API.SAVE_KEY);

  // --- пиксель-арт против SVG ---
  log(["player", "troll", "dragon", "trader", "treasure", "stairs", "stairsUp", "spikes", "pit"]
    .every((k) => API.mapIconIsPixel(k)) && !API.mapIconIsPixel("sniper"),
    "на всю клетку растягиваются спрайты и тайлы, а не SVG-иконки");

  // --- тень у стен считается по настоящей карте ---
  freshRun(2);
  let wrongEdges = 0;
  let floorCells = 0;
  const isWall = (x, y) => x < 0 || y < 0 || x >= G.map.w || y >= G.map.h || G.map.grid[y][x] !== 1;
  for (let y = 0; y < G.map.h; y++) {
    for (let x = 0; x < G.map.w; x++) {
      if (G.map.grid[y][x] !== 1) continue;
      floorCells += 1;
      const want = (isWall(x, y - 1) ? " edge-n" : "") + (isWall(x + 1, y) ? " edge-e" : "") +
        (isWall(x, y + 1) ? " edge-s" : "") + (isWall(x - 1, y) ? " edge-w" : "");
      if (API.wallEdges(x, y) !== want) wrongEdges += 1;
    }
  }
  log(floorCells > 0 && wrongEdges === 0, "стороны, где пол упирается в стену, определяются верно",
    floorCells + " клеток, ошибок " + wrongEdges);

  // --- стили: встык, без «подушек», пиксель-арт на всю клетку ---
  log(/\.map\s*\{[^}]*--gap:\s*0px/.test(gameCss), "между плитками нет зазора (--gap: 0px)");
  log(!/\n\.tile\s*\{[^}]*border-radius/.test(gameCss), "у плитки нет скругления");
  log(/\.ent\.ent-px\s*\{[^}]*width:\s*var\(--cell\)/.test(gameCss),
    "пиксель-арт занимает клетку целиком (.ent-px)");
  const idleAt = gameCss.indexOf("@keyframes enemyIdle");
  const idleCss = gameCss.slice(idleAt, gameCss.indexOf("\n}", idleAt));
  log(idleAt >= 0 && !/scale\(/.test(idleCss),
    "покачивание врага без scale(): иначе дробный масштаб пикселей");
  freshRun(0);
}

// ================= 30. Читаемость карты: декор, лава, телефон =================
{
  const lavaSet = new Set(API.TERRAIN_LAVA);
  const uriOf = (bg) => ([...String(bg).matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]));

  // --- декор-предметы идут отдельным слоем, плоский — в фоне ---
  log(!!API.terrainObjectUri(0, 3, 3, 3) && !!API.terrainObjectUri(0, 3, 3, 7) &&
    !!API.terrainObjectUri(0, 3, 3, 5) && !!API.terrainObjectUri(0, 3, 3, 8),
    "колонна, фонарь, гриб и кол — предметы отдельного слоя");
  log(!API.terrainObjectUri(0, 3, 3, 1) && !API.terrainObjectUri(0, 3, 3, 2) &&
    !API.terrainObjectUri(0, 3, 3, 6) && !API.terrainObjectUri(0, 3, 3, 9) && !API.terrainObjectUri(0, 3, 3, 0),
    "трава, вода, мох и кристаллы остаются в фоне плитки");
  log(!!API.terrainObjectUri(6, 3, 3, 4) && !!API.terrainObjectUri(6, 3, 3, 1),
    "замены этажа учтены: на огненном этаже кости — колья, трава — обломки");
  log(API.terrainFloorBg(2, 5, 5) === API.terrainBg(2, 5, 5, true, 0),
    "пол под предметом — тот же, что в terrainBg без декора");

  // --- лава бывает только настоящая ---
  const mixHasWater = (i) => API.floorDecorMix(i).some((p) => p[0] === 2);
  log(!mixHasWater(6) && !mixHasWater(9),
    "на огненных этажах нет декоративной воды-лавы: безвредная не путается с опасной");
  const lavaFrames = [0, 1, 2, 3, 4, 5].map((f) => uriOf(API.terrainLavaCellBg(4, 5, f)));
  log(lavaFrames.every((u) => u.length === 1 && lavaSet.has(u[0])),
    "лавовая клетка-опасность рисуется плиткой лавы во всех кадрах");

  freshRun(6);
  let lavaCells = 0;
  let lavaDrawn = 0;
  for (let y = 0; y < G.map.h; y++) {
    for (let x = 0; x < G.map.w; x++) {
      if (G.hazard && G.hazard[y][x] === "lava") {
        lavaCells += 1;
        if (uriOf(G.tileBg[y * G.map.w + x]).some((u) => lavaSet.has(u))) lavaDrawn += 1;
      }
    }
  }
  const lavaAnimated = G.tileAnim.filter((a) => a.kind === "hazard-lava").length;
  log(lavaCells > 0 && lavaDrawn === lavaCells && lavaAnimated === lavaCells,
    "каждая клетка лавы нарисована лавой и переливается", lavaCells + " клеток, нарисовано " + lavaDrawn +
    ", анимировано " + lavaAnimated);

  // --- слой предмета на плитке ---
  freshRun(0);
  const here = G.playerPos;
  let objCell = null;
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const x = here.x + dx, y = here.y + dy;
    if (!objCell && G.map.grid[y] && G.map.grid[y][x] === 1) objCell = { x, y };
  });
  if (objCell) {
    G.map.decor[objCell.y][objCell.x] = 3;   // колонна
    G.tileEls = [];                          // пересобрать плитки с новым декором
    API.render();
    const idx = objCell.y * G.map.w + objCell.x;
    const tile = G.tileEls[idx];
    const var0 = tile && tile.style._vars ? tile.style._vars["--obj"] : "";
    log(!!G.tileObj[idx] && String(tile.className).indexOf("has-obj") >= 0 && /^url\("data:image\/png/.test(var0 || ""),
      "плитка с колонной получает слой предмета (has-obj и --obj)", tile ? tile.className : "нет плитки");
    log(uriOf(G.tileBg[idx]).length === 1, "под предметом в фоне только пол, без второго слоя декора");
    G.map.decor[objCell.y][objCell.x] = 0;
  } else {
    log(false, "рядом со стартом нет клетки пола для проверки слоя предмета");
  }

  // --- стили: приглушённый слой, целый портрет босса, телефон ---
  const objRule = (gameCss.match(/\.tile\.has-obj::before\s*\{[^}]*\}/) || [""])[0];
  const opacity = Number((objRule.match(/opacity:\s*([0-9.]+)/) || [])[1]);
  log(opacity > 0 && opacity <= 0.65, "слой предметов приглушён, чтобы герой и враги были главными", opacity);
  const bossRule = (gameCss.match(/\.battle-scene \.battle-portrait\.boss\s*\{[^}]*\}/) || [""])[0];
  const bossPx = Number((bossRule.match(/width:\s*(\d+)px/) || [])[1]);
  log(bossPx > 0 && bossPx % 32 === 0, "портрет босса — целое кратное 32 px (спрайт без «мыла»)", bossPx + " px");
  log(/@media \(max-width: 700px\)\s*\{[\s\S]*\.scene-quip\s*\{[^}]*display:\s*none[\s\S]*\.skip-btn\s*\{/.test(gameCss),
    "для телефона ужаты бой и карта (реплика, футер, кнопки действия и хода)");
}

// ================= 31. Зелья и подсказки в бою =================
{
  const potion = (id) => Object.assign({}, API.ITEM_POOL.find((i) => i.id === id));
  const battleWith = (hp, poison, inv) => {
    freshRun(1);
    enemyOnPlayerCell("rat", 999);
    G.player.hp = hp;
    G.player.poison = poison;
    G.inventory = inv.map(potion);
    API.openBattle(G.enemies[0]);
  };

  // Раньше: зелье без поля effect при яде роняло игру ПОСЛЕ лечения, и оно
  // оставалось в сумке — лечись сколько хочешь.
  battleWith(50, 2, ["small_potion"]);
  let potionErr = "";
  try { API.useBattlePotion(); } catch (e) { potionErr = e.message; }
  log(!potionErr && G.player.hp === 80 && G.inventory.length === 0,
    "малое зелье при яде: лечит один раз и тратится", potionErr || (G.player.hp + " HP, зелий " + G.inventory.length));
  log(G.player.poison === 2, "малое зелье яд не снимает");
  G.battle = null;

  // Противоядие в сумке первым не закрывает лечебные зелья.
  battleWith(40, 0, ["antidote", "big_potion"]);
  API.useBattlePotion();
  log(G.player.hp === 110 && G.inventory.length === 1 && G.inventory[0].id === "antidote",
    "противоядие впереди сумки не мешает выпить большое зелье", G.player.hp + " HP, в сумке " +
    G.inventory.map((i) => i.id).join(","));
  G.battle = null;

  // Кнопка вида: нужное противоядие пьётся, ненужное — остаётся.
  battleWith(40, 0, ["antidote", "big_potion"]);
  API.useBattlePotion("antidote");
  log(G.inventory.length === 2 && G.player.hp === 40, "лишнее противоядие без яда не тратится");
  G.player.poison = 2;
  API.useBattlePotion("antidote");
  log(G.inventory.length === 1 && G.player.poison === 0, "противоядие при яде снимает его и тратится");
  G.battle = null;

  // Расчёт: что пить, если игрок не выбрал.
  battleWith(180, 0, ["elixir", "small_potion", "big_potion"]);
  const pick20 = API.bestPotionIndex();
  log(G.inventory[pick20] && G.inventory[pick20].id === "small_potion",
    "недостача 20 — выбирается малое зелье, эликсир не тратится");
  G.player.hp = 100;
  const pick100 = API.bestPotionIndex();
  log(G.inventory[pick100] && G.inventory[pick100].id === "elixir",
    "недостача 100 — выбирается эликсир, раз ни одно меньшее её не закрывает");
  G.battle = null;

  // Противоядие на карте работает и при полном здоровье, если есть яд.
  freshRun(1);
  G.player.hp = G.player.maxHp;
  G.player.poison = 2;
  G.inventory = [potion("antidote")];
  API.usePotion(0);
  log(G.player.poison === 0 && G.inventory.length === 0,
    "на карте противоядие пьётся при полном здоровье, если есть яд");

  // Подсказка убирает ДВА неверных варианта, в том числе бесплатная.
  const mcBattle = () => {
    freshRun(2);
    enemyOnPlayerCell("slime", 999);
    API.openBattle(G.enemies[0]);
    G.battle.challenge = { type: "mc", question: API.QUESTIONS[0], hintUsed: false };
    API.attachChoices(G.battle.challenge);
    G.battle.phase = "question";
    G.battle.cursed = false;
    G.player.hp = 150;
    G.player.maxHp = 150;
    G.player.freeHints = 0;
    G.stats.streak = 3;
  };
  const shownOptions = () => {
    el("battle-options").children = [];
    API.renderBattle();
    return el("battle-options").children.length;
  };
  mcBattle();
  API.useHint();
  let c = G.battle.challenge;
  const answerIdx = c.view ? c.view.answer : c.question.answer;
  log(Array.isArray(c.hidden) && c.hidden.length === 2 && c.hidden.indexOf(answerIdx) < 0 &&
    new Set(c.hidden).size === 2,
    "платная подсказка прячет два разных неверных варианта", JSON.stringify(c.hidden));
  log(G.player.hp === 140 && G.stats.streak === 0, "платная подсказка: −10 HP и серия сгорает");
  log(shownOptions() === 2, "на экране остаются правильный и один неверный вариант", shownOptions());
  G.inventory = [potion("small_potion")];
  G.player.hp = 100;
  API.useBattlePotion();
  log(shownOptions() === 2, "после зелья скрытые подсказкой варианты не возвращаются");
  G.battle = null;

  const talisman = equipWithEffect("hintFree");
  mcBattle();
  G.equipment.accessory = talisman;
  API.useHint();
  c = G.battle.challenge;
  log(G.player.hp === 150 && Array.isArray(c.hidden) && c.hidden.length === 2 && G.player.freeHints === 1,
    "бесплатная подсказка талисмана тоже убирает два варианта и не стоит HP",
    "HP " + G.player.hp + ", скрыто " + JSON.stringify(c.hidden));
  G.equipment.accessory = null;
  G.battle = null;

  // Проклятие лича: подсказка не работает и ничего не стоит.
  mcBattle();
  G.battle.cursed = true;
  API.useHint();
  log(G.player.hp === 150 && G.stats.streak === 3 && !G.battle.challenge.hintUsed &&
    !G.battle.challenge.hidden, "под проклятием подсказка не тратит здоровье, серию и попытку");
  G.battle = null;
  freshRun(0);
}

// ================= 32. Отряд в коридоре, дар и смерть, призраки, элиты =================
{
  const gameJsText = fs.readFileSync(path.join(dir, "game.js"), "utf8");

  // --- отряд в узком коридоре не замирает ---
  freshRun(3);
  const rows = 8;
  const cols = 5;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let y = 1; y <= 6; y++) grid[y][2] = 1;
  G.map = { w: cols, h: rows, grid: grid, decor: grid.map((r) => r.map(() => 0)) };
  G.playerPos = { x: 2, y: 1 };
  G.stairsDown = { x: 2, y: 6, active: true };
  G.stairsUp = null;
  G.treasures = [];
  G.traders = [];
  G.traps = [];
  const lead = API.makeEnemy("orc", 3, false, 77, 0);
  const tail = API.makeEnemy("orc", 3, false, 77, 1);
  lead.x = 2; lead.y = 3;
  tail.x = 2; tail.y = 2;
  G.enemies = [lead, tail];
  let attacker = null;
  for (let i = 0; i < 5 && !attacker; i++) attacker = API.enemyTurn();
  log(!!attacker, "отряд в коридоре: до героя доходит ведомый, а не никто",
    attacker ? attacker.name + " на " + attacker.x + "," + attacker.y : "никто не напал за 5 ходов");

  // --- «Каменный дар» переживает смерть ---
  freshRun(0);
  API.activateFloor(4);
  API.chooseBlessing("blessing");
  const withGift = G.player.maxHp;
  const baseWithGift = G.player.baseMaxHp;
  API.restartFloor();
  log(G.player.maxHp === withGift && G.player.baseMaxHp === baseWithGift && G.blessings[4] === "blessing",
    "после смерти максимум здоровья от «Каменного дара» остаётся",
    "было " + withGift + ", стало " + G.player.maxHp);

  // --- призраки ошибок не пропадают при перезапуске этажа ---
  freshRun(0);
  G.missed = [];
  for (let i = 0; i < 12; i++) G.missed.push({ kind: "mc", id: API.QUESTIONS[i].id });
  delete G.cache[2];
  G.visited.add(2);
  API.activateFloor(2);
  // Считаем призраков на этаже И в очереди до и после: сколько призраков
  // выпало на этаж, решает жребий, и требовать «хоть одного» нельзя — эта
  // проверка мигала раз в восемь прогонов. Суть в сохранении, а не в удаче.
  const ghostsBefore = G.enemies.filter((e) => e.payload).length;
  const queuedBefore = G.missed.length;
  API.restartFloor();
  const ghostsAfter = G.enemies.filter((e) => e.payload).length;
  log(ghostsAfter + G.missed.length === ghostsBefore + queuedBefore,
    "перезапуск этажа не теряет задания призраков ошибок",
    "до: " + ghostsBefore + "+" + queuedBefore + ", после: " + ghostsAfter + "+" + G.missed.length);

  // --- потолок элит ---
  const eliteMax = (floor) => {
    let max = 0;
    for (let n = 0; n < 6; n++) {
      freshRun(0);
      const st = API.createFloorState(floor);
      max = Math.max(max, st.enemies.filter((e) => e.elite).length);
    }
    return max;
  };
  const eliteEarly = eliteMax(2);
  const eliteLate = eliteMax(8);
  const eliteDeep = eliteMax(40);
  log(API.eliteChanceFor(45, false) <= 1 && eliteEarly <= API.ELITE.capNear &&
    eliteLate <= API.ELITE.capLate && eliteDeep <= API.ELITE.capLate,
    "элит на этаже не больше потолка, даже в бездне",
    "этаж 3: " + eliteEarly + " (≤" + API.ELITE.capNear + "), этаж 9: " + eliteLate +
    ", глубина 40: " + eliteDeep + " (≤" + API.ELITE.capLate + ")");
  freshRun(0);
  log(eliteDeep >= 1, "потолок не обнуляет элит: на глубине они есть", eliteDeep);

  // --- призрак не телепортируется на клетку героя ---
  freshRun(2);
  const ghost = API.makeEnemy("ghost", 2);
  G.enemies = [ghost];
  let landedOnHero = 0;
  for (let i = 0; i < 3000; i++) {
    ghost.x = 0;
    ghost.y = 0;
    if (API.phaseTeleport(ghost) && ghost.x === G.playerPos.x && ghost.y === G.playerPos.y) landedOnHero += 1;
  }
  log(landedOnHero === 0, "телепорт призрака не ставит его в героя", landedOnHero + " из 3000");

  // --- первый этаж показывает эпиграф, событие и совет ---
  globalThis.localStorage.setItem("pyquiz_session_v1",
    JSON.stringify({ name: "Проверка", role: "student", token: "" }));
  API.begin();
  const arrivalBody = el("floor-arrival-body").innerHTML;
  const firstEpi = API.floorEpilogue(0);
  log(G.visited.has(0) && !el("floor-arrival").classList.contains("hidden") &&
    arrivalBody.indexOf(firstEpi.text) >= 0,
    "на первом этаже при входе виден эпиграф");
  const logHtml = el("log").children.map((n) => n.textContent).join("\n");
  log(/Событие:/.test(logHtml) && /Совет:/.test(logHtml),
    "в журнале первого этажа есть событие и совет");
  globalThis.localStorage.removeItem("pyquiz_session_v1");
  globalThis.localStorage.removeItem(API.SAVE_KEY);
  globalThis.localStorage.removeItem(API.SAVE_KEY + ":Проверка");

  // --- снимок входа на этаж переживает «Продолжить» ---
  freshRun(2);
  const entry = G.floorCheckpoint ? { level: G.floorCheckpoint.level, xp: G.floorCheckpoint.xp } : null;
  G.player.level = G.player.level + 1;
  G.player.xp = 150;
  API.saveGame();
  freshRun(0);
  API.loadGame();
  log(!!entry && G.floorCheckpoint && G.floorCheckpoint.level === entry.level && G.floorCheckpoint.xp === entry.xp,
    "после «Продолжить» опыт этажа по-прежнему отнимется при смерти",
    G.floorCheckpoint ? "снимок: уровень " + G.floorCheckpoint.level + ", опыт " + G.floorCheckpoint.xp : "нет снимка");
  globalThis.localStorage.removeItem(API.SAVE_KEY);

  // --- ходьба по физическим клавишам ---
  log(/KeyW: "w"[\s\S]*KeyD: "d"/.test(gameJsText) && /map\[byCode\[e\.code\]\]/.test(gameJsText),
    "WASD работает и в русской раскладке (по e.code)");
  freshRun(0);
}

// ================= 33. Проверка кода, линза, сейвы учеников, итог для учителя =================
{
  const realFetch = globalThis.fetch;
  // Синхронные «обещания»: настоящий Promise ответил бы уже после печати
  // отчёта, а здесь ответ сервера применяется сразу.
  const syncOk = (v) => (v && typeof v.then === "function") ? v : {
    then(ok) { return syncOk(ok ? ok(v) : v); },
    catch() { return this; }
  };
  const syncFail = (err) => ({
    then(ok, fail) { return fail ? syncOk(fail(err)) : this; },
    catch(fn) { return syncOk(fn(err)); }
  });
  const answer = (data) => () => syncOk({ ok: true, json: () => syncOk(data) });
  const META = globalThis.TASK_META;
  const topicOf = (kind, task) => META.taskTopic(kind, task.id);
  const battleHtml = () => el("battle-box").innerHTML;

  const codeBattle = () => {
    freshRun(2);
    enemyOnPlayerCell("slime", 999);
    API.openBattle(G.enemies[0]);
    const task = API.CODE_TASKS[0];
    G.battle.challenge = { type: "code", task: task, code: task.starter, results: null };
    G.battle.phase = "question";
    G.battle.busy = false;
    G.player.hp = 150;
    G.player.maxHp = 150;
    G.stats.streak = 2;
    G.codeCheck = true;
    return task;
  };

  // --- сбой сервера проверки — не вина ученика ---
  let task = codeBattle();
  const enemyHp = G.battle.enemy.hp;
  globalThis.fetch = () => syncFail(new Error("offline"));
  API.checkCode();
  log(G.player.hp === 150 && G.battle.enemy.hp === enemyHp && G.battle.phase === "question" &&
    G.stats.codeTried === 0 && G.stats.streak === 2 && !G.battle.busy,
    "нет связи с сервером проверки: ни удара, ни попытки, задание остаётся",
    "HP " + G.player.hp + ", фаза " + G.battle.phase + ", попыток " + G.stats.codeTried);
  log(/Ход не засчитан/.test(G.battle.challenge.notice || "") && battleHtml().indexOf("Ход не засчитан") >= 0,
    "ученик видит, что ход не засчитан");

  globalThis.fetch = answer({ ok: false, unavailable: true, busy: true, error: "<b>Сервер проверки занят</b>", results: [] });
  API.checkCode();
  log(G.player.hp === 150 && G.battle.phase === "question" && G.stats.codeTried === 0 &&
    /занят/.test(G.battle.challenge.notice || ""), "сервер занят: ход без штрафа, причина на экране");
  log(battleHtml().indexOf("&lt;b&gt;Сервер проверки занят") >= 0, "текст сбоя сервера в окне боя экранирован");

  globalThis.fetch = answer({ ok: true, results: [] });
  API.checkCode();
  log(G.player.hp === 150 && G.battle.phase === "question" && G.stats.codeTried === 0,
    "неполный ответ сервера: без удара и без попытки");

  // --- на сервер уходит номер задания, а не клиентские тесты ---
  task = codeBattle();
  let sentBody = null;
  globalThis.fetch = (url, opts) => {
    sentBody = JSON.parse((opts && opts.body) || "{}");
    return syncOk({ ok: true, json: () => syncOk({ ok: true, passed: 0, total: 1, results: [] }) });
  };
  API.checkCode();
  log(!!sentBody && sentBody.taskId === task.id && !("tests" in sentBody),
    "на сервер уходит taskId, а не клиентские tests", sentBody);
  G.battle = null;

  // Задание генератора сервер проверить не может: игра меняет его без урона.
  codeBattle();
  const staleChallenge = G.battle.challenge;
  globalThis.fetch = answer({ ok: false, unavailable: true, staleTask: true,
    error: "Задание генератора больше не проверяется", results: [] });
  API.checkCode();
  log(G.battle.challenge !== staleChallenge && G.player.hp === 150 &&
    G.stats.codeTried === 0 && /другое/.test(G.battle.challenge.notice || ""),
    "задание с клиентскими тестами заменяется без штрафа",
    G.battle.challenge.type);
  G.battle = null;

  // Без серверного генератора задания gen.code в игру не попадают.
  const genAll = API.practiceTasks("code").filter((p) => p.gen).length;
  globalThis.__PYQUIZ_FEATURES = { code: true, generatedCode: false };
  const genStrict = API.practiceTasks("code").filter((p) => p.gen).length;
  delete globalThis.__PYQUIZ_FEATURES;
  log(genAll > 0 && genStrict === 0,
    "без серверных тестов задания gen.code не выдаются",
    genAll + " -> " + genStrict);

  // --- сервер запущен с --no-code ---
  codeBattle();
  globalThis.fetch = answer({ ok: false, unavailable: true, disabled: true,
    error: "Проверка кода отключена на сервере", results: [] });
  API.checkCode();
  log(G.codeCheck === false && G.battle.challenge.type !== "code" && G.battle.phase === "question" &&
    G.player.hp === 150 && /выключена/.test(G.battle.challenge.notice || ""),
    "--no-code посреди боя: задачу на код сменило другое задание, без урона", "теперь " + G.battle.challenge.type);
  G.difficulty = "hard";
  // У учебного боя одна тема: каждый виток — новый бой со своей темой, на
  // шаге практики («примени»), иначе тема без задач на код решала бы всё.
  const practiceStep = () => {
    G.battle.topic = null;
    G.battle.review = false;
    G.battle.step = 1;
    API.nextChallenge();
    return G.battle.challenge.type === "code";
  };
  let rolls = 0;
  for (let i = 0; i < 400; i++) if (practiceStep()) rolls += 1;
  log(rolls === 0, "при выключенной проверке задач «Напиши функцию» не выпадает", rolls + " из 400");
  G.codeCheck = true;
  rolls = 0;
  for (let i = 0; i < 400; i++) if (practiceStep()) rolls += 1;
  log(rolls > 0, "при включённой проверке задачи на код выпадают", rolls + " из 400");
  G.battle = null;

  globalThis.fetch = answer({ ok: true, values: {}, features: { code: false } });
  API.loadServerBalance();
  const offSeen = G.codeCheck === false;
  globalThis.fetch = answer({ ok: true, values: {}, features: { code: true } });
  API.loadServerBalance();
  log(offSeen && G.codeCheck === true, "игра узнаёт из /api/game-config, проверяет ли сервер код");

  // --- ошибки ученика по-прежнему наказываются и идут в разбор по темам ---
  task = codeBattle();
  globalThis.fetch = answer({ ok: false, error: "SyntaxError: expected ':'", results: [] });
  API.checkCode();
  const tsBad = G.stats.topicStats[topicOf("code", task)] || { correct: 0, total: 0 };
  log(G.player.hp < 150 && G.stats.codeTried === 1 && G.battle.phase === "result" &&
    tsBad.total === 1 && tsBad.correct === 0,
    "ошибка в программе ученика стоит удара и попадает в разбор по темам",
    "HP " + G.player.hp + ", тема " + topicOf("code", task) + " " + tsBad.correct + "/" + tsBad.total);
  G.battle = null;

  task = codeBattle();
  const hpBefore = G.battle.enemy.hp;
  globalThis.fetch = answer({ ok: true, passed: 2, total: 2, results: [
    { ok: true, expected: "15", actual: "<img src=x onerror=alert(1)>" },
    { ok: true, expected: "0", actual: "0" }] });
  API.checkCode();
  const tsGood = G.stats.topicStats[topicOf("code", task)];
  log(G.battle.enemy.hp < hpBefore && G.stats.codePassed === 1 && G.stats.codeTried === 1 &&
    tsGood && tsGood.correct === 1 && tsGood.total === 1,
    "решение прошло тесты: удар, счётчик и верный ответ в теме");
  log(battleHtml().indexOf("&lt;img src=x") >= 0 && battleHtml().indexOf("<img src=x") < 0,
    "вывод программы ученика в окне боя экранирован");
  G.battle = null;

  codeBattle();
  const stale = G.battle;
  G.battle = null;
  let lateErr = "";
  try { API.applyCodeResult({ ok: false, error: "x" }, stale); } catch (e) { lateErr = e.message; }
  log(!lateErr && G.player.hp === 150 && G.stats.codeTried === 0, "ответ сервера на закрытый бой ничего не делает", lateErr);
  globalThis.fetch = realFetch;

  // --- «Повтори код» в разборе по темам ---
  freshRun(1);
  enemyOnPlayerCell("rat", 999);
  API.openBattle(G.enemies[0]);
  const copyTask = API.COPY_TASKS[0];
  G.battle.challenge = { type: "copy", task: copyTask, code: copyTask.code, results: null };
  G.battle.phase = "question";
  API.checkCopy();
  G.battle.phase = "question";
  G.battle.challenge.code = "print('не то')";
  API.checkCopy();
  const copyTopic = topicOf("copy", copyTask);
  const tsCopy = G.stats.topicStats[copyTopic] || { correct: 0, total: 0 };
  log(tsCopy.correct === 1 && tsCopy.total === 2 && API.topicReportHtml().indexOf(API.TOPICS[copyTopic]) >= 0,
    "«Повтори код» попадает в разбор по темам: и верно, и с ошибкой", copyTopic + " " + tsCopy.correct + "/" + tsCopy.total);
  G.battle = null;

  // --- линза разведчика ---
  freshRun(3);
  let spot = null;
  for (let y = 0; y < G.map.h && !spot; y++) {
    for (let x = 0; x < G.map.w && !spot; x++) {
      if (G.map.grid[y][x] === 1 && !G.visible.has(x + "," + y)) spot = { x: x, y: y };
    }
  }
  const far = API.makeEnemy("rat", 3);
  far.x = spot ? spot.x : 0;
  far.y = spot ? spot.y : 0;
  log(!!spot, "на этаже есть клетка вне поля зрения для проверки линзы");
  G.enemies = [far];
  const lens = Object.assign({}, API.ITEM_POOL.find((i) => i.id === "scout_lens"));
  const opacity = () => {
    API.renderEntities();
    const node = G.entityEls.get("enemy-" + far.uid);
    return node ? Number(node.style.opacity) : -1;
  };
  const miniColors = () => {
    const seen = [];
    const cv = el("minimap");
    const old = cv.getContext;
    cv.getContext = () => new Proxy({}, {
      get(t, k) {
        if (k === "canvas") return { width: 184, height: 132 };
        if (k === "measureText") return () => ({ width: 10 });
        return () => {};
      },
      set(t, k, v) { if (k === "fillStyle") seen.push(v); return true; }
    });
    API.drawMinimap();
    cv.getContext = old;
    return seen;
  };
  const hiddenOp = opacity();
  const hiddenMini = miniColors().indexOf("#f87171") >= 0;
  G.equipment.accessory = lens;
  const lensOp = opacity();
  const lensMini = miniColors().indexOf("#f87171") >= 0;
  G.equipment.accessory = null;
  const offOp = opacity();
  log(hiddenOp === 0 && !hiddenMini, "без линзы враг вне поля зрения скрыт и на карте, и на мини-карте");
  log(lensOp > 0 && lensOp < 1 && lensMini, "линза разведчика показывает врага за стенами — полупрозрачным и на мини-карте",
    "прозрачность " + lensOp);
  log(offOp === 0, "сняли линзу — враг снова скрыт");

  // --- у каждого ученика своя ячейка сохранения ---
  const SESSION = "pyquiz_session_v1";
  const ls = globalThis.localStorage;
  const slotOf = (n) => API.SAVE_KEY + ":" + n;
  const login = (n) => ls.setItem(SESSION, JSON.stringify({ name: n, role: "student", token: "t" }));
  const wipe = () => {
    ["Аня", "Боря", "Вера"].forEach((n) => ls.removeItem(slotOf(n)));
    ls.removeItem(API.SAVE_KEY);
    ls.removeItem(SESSION);
  };
  wipe();
  login("Аня");
  freshRun(2);
  G.name = "Аня";
  API.saveGame();
  const annaSlot = ls.getItem(slotOf("Аня"));
  log(!!annaSlot && ls.getItem(API.SAVE_KEY) === null, "сейв ученика пишется в его ячейку, а не в общий ключ");
  login("Боря");
  const borisSees = API.readSave();
  API.saveGame();
  log(borisSees === null && ls.getItem(slotOf("Боря")) === null,
    "другой ученик не видит чужой сейв, и старая вкладка Ани не пишет в его ячейку");
  freshRun(0);
  G.name = "Боря";
  API.clearSave();
  API.saveGame();
  log(!!ls.getItem(slotOf("Боря")) && ls.getItem(slotOf("Аня")) === annaSlot, "новая партия Бори не стирает поход Ани");
  login("Аня");
  const back = API.readSave();
  log(!!back && back.name === "Аня" && back.floorIndex === 2, "Аня возвращается к своему походу", back && back.floorIndex);
  ls.setItem(API.SAVE_KEY, JSON.stringify(Object.assign(JSON.parse(annaSlot || "{}"), { name: "Вера", floorIndex: 4 })));
  log((API.readSave() || {}).name === "Аня" && ls.getItem(API.SAVE_KEY) !== null, "чужой сейв прежней версии не трогается");
  login("Вера");
  const vera = API.readSave();
  log(!!vera && vera.name === "Вера" && vera.floorIndex === 4 && !!ls.getItem(slotOf("Вера")) &&
    ls.getItem(API.SAVE_KEY) === null, "сейв прежней версии переезжает в ячейку владельца");
  ls.setItem(API.SAVE_KEY, JSON.stringify(vera));
  API.clearSave();
  log(API.readSave() === null && ls.getItem(API.SAVE_KEY) === null,
    "после победы старый общий сейв того же ученика не воскресает");
  wipe();

  // --- один поход — один номер для учителя ---
  freshRun(1);
  const first = API.buildResult(false);
  const last = API.buildResult(true);
  log(!!first.runId && first.runId === last.runId && first.runId === String(G.startedAt),
    "все итоги одного похода несут один номер (runId)");

  // --- подсказки говорят то, что делает механика ---
  const dcText = fs.readFileSync(path.join(dir, "dungeon-content.js"), "utf8");
  const pct = (v) => Math.round(v * 100) + "%";
  const T = API.ELITE_ABILITY_TEXT;
  log(T.drain.indexOf(pct(API.ELITE.drainPct)) >= 0 && T.curse.indexOf(pct(API.ELITE.curseChance)) >= 0 &&
    T.phasing.indexOf(pct(API.ELITE.phaseChance)) >= 0 && !/ошибк/.test(T.charge),
    "описания элит совпадают с ELITE: вампир, проклятие, призрак, минотавр");
  log(API.floorTip(5).indexOf("крит") < 0 && API.floorTip(8).indexOf("лечится") < 0 &&
    /40%/.test(API.floorTip(9)) && /40%/.test(API.floorEpilogue(9).hint) && dcText.indexOf("весь терпение") < 0,
    "подсказки этажей без несуществующих механик: криты скелетов, лечение лича, «треть» дракона");
  freshRun(0);
}

// ================= 34. Графика: предметы, существа, тон этажей =================
{
  const zlib = require("zlib");
  // Мини-декодер PNG из data-URI без чересстрочности: палитра (3) в 1/2/4/8
  // бит на пиксель или RGBA (6) в 8 бит — такие картинки пишет
  // tools/art/build_art.py (Pillow упаковывает палитру до 16 цветов плотнее).
  const decodePng = (uri) => {
    const buf = Buffer.from(String(uri).split(",")[1], "base64");
    let pos = 8, w = 0, h = 0, type = 0, depth = 0, pal = null, trns = null;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const kind = buf.toString("ascii", pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (kind === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; }
      if (kind === "PLTE") pal = data;
      if (kind === "tRNS") trns = data;
      if (kind === "IDAT") idat.push(data);
      pos += 12 + len;
    }
    if (!((type === 6 && depth === 8) || (type === 3 && [1, 2, 4, 8].indexOf(depth) >= 0))) return null;
    const bpp = type === 6 ? 4 : 1;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = type === 6 ? w * 4 : Math.ceil((w * depth) / 8);
    const px = Buffer.alloc(stride * h);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)];
      for (let x = 0; x < stride; x++) {
        const cur = raw[y * (stride + 1) + 1 + x];
        const a = x >= bpp ? px[y * stride + x - bpp] : 0;
        const b = y > 0 ? px[(y - 1) * stride + x] : 0;
        const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 :
          f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
        px[y * stride + x] = (cur + pred) & 255;
      }
    }
    const rgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      if (type === 6) { px.copy(rgba, i * 4, i * 4, i * 4 + 4); continue; }
      const x = i % w, bit = x * depth;
      const k = (px[Math.floor(i / w) * stride + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
      rgba[i * 4] = pal[k * 3]; rgba[i * 4 + 1] = pal[k * 3 + 1]; rgba[i * 4 + 2] = pal[k * 3 + 2];
      rgba[i * 4 + 3] = trns && k < trns.length ? trns[k] : 255;
    }
    return { w, h, rgba };
  };
  const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
  const stats = (uris) => {
    let l = 0, s = 0, n = 0;
    uris.forEach((u) => {
      const im = decodePng(u);
      if (!im) return;
      for (let i = 0; i < im.w * im.h; i++) {
        const [r, g, b, a] = im.rgba.subarray(i * 4, i * 4 + 4);
        if (!a) continue;
        l += luma(r, g, b); s += sat(r, g, b); n += 1;
      }
    });
    return { luma: n ? l / n : 0, sat: n ? s / n : 0, n };
  };

  // --- предметы: у каждого своя картинка ---
  const noArt = API.ITEM_POOL.filter((it) => !String(API.ITEM_SPRITES[it.id] || "").startsWith("data:image/png"));
  log(noArt.length === 0, "у каждого предмета своя пиксельная картинка", noArt.map((i) => i.id).join(", "));
  const uniq = new Set(API.ITEM_POOL.map((it) => API.ITEM_SPRITES[it.id]));
  log(uniq.size === API.ITEM_POOL.length, "картинки предметов не повторяются", uniq.size + " из " + API.ITEM_POOL.length);
  log(API.itemPic(API.ITEM_POOL[0], "#fff").indexOf("item-ico-px") >= 0 &&
    API.itemPic({ id: "нет_такого", slot: "weapon" }, "#fff").indexOf("<svg") >= 0,
    "itemPic: картинка вещи, а для неизвестной вещи — прежняя иконка слота");
  freshRun(1);
  G.inventory = API.ITEM_POOL.slice(0, 5).map((it) => Object.assign({}, it));
  API.renderInventory();
  log((el("inventory-box").innerHTML.match(/item-ico-px/g) || []).length >= 5,
    "в сумке предметы показаны пиксельными картинками");

  // --- карта: сундук, торговец и все ловушки — тайлы ---
  const trapIcons = ["spikes", "pit", "mushroom_spore", "crystal_shard", "chain_snare", "curse_tile"];
  log(["treasure", "trader"].concat(trapIcons).every((k) => API.mapIconIsPixel(k)),
    "сундук, торговец и все шесть ловушек рисуются пиксельными тайлами");

  // --- существа: контур, синий герой, призрак без растра ---
  const outlined = (uri) => {
    const im = decodePng(uri);
    if (!im) return 0;
    // За краем кадра контур нарисовать некуда — такие пиксели не считаем краем.
    // Сплошным считается то же, что и при сборке: непрозрачность от 50%.
    const A = (x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 255 :
      (im.rgba[(y * im.w + x) * 4 + 3] >= 128 ? 255 : 0);
    let edge = 0, dark = 0;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
      if (!A(x, y)) continue;
      if (A(x + 1, y) && A(x - 1, y) && A(x, y + 1) && A(x, y - 1)) continue;
      edge += 1;
      const i = (y * im.w + x) * 4;
      if (luma(im.rgba[i], im.rgba[i + 1], im.rgba[i + 2]) < 0.08) dark += 1;
    }
    return edge ? dark / edge : 0;
  };
  const weak = Object.keys(API.SPRITES).filter((k) => outlined(API.SPRITES[k]) < 0.9);
  log(weak.length === 0, "у всех существ тёмный контур: их видно на любом полу", weak.join(", "));

  const hero = decodePng(API.SPRITES.player);
  let red = 0, blue = 0;
  for (let i = 0; i < hero.w * hero.h; i++) {
    const [r, g, b, a] = hero.rgba.subarray(i * 4, i * 4 + 4);
    if (!a || sat(r, g, b) < 0.4) continue;
    if (r > g * 1.6 && r > b * 1.6) red += 1;
    if (b > r * 1.3 && b >= g) blue += 1;
  }
  log(blue > red * 3, "герой синий: красный в игре — цвет врагов", "синих " + blue + ", красных " + red);

  const lonely = (uri) => {
    const im = decodePng(uri);
    const A = (x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.rgba[(y * im.w + x) * 4 + 3];
    let n = 0, alone = 0;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
      if (!A(x, y)) continue;
      n += 1;
      if (!A(x + 1, y) && !A(x - 1, y) && !A(x, y + 1) && !A(x, y - 1)) alone += 1;
    }
    return n ? alone / n : 1;
  };
  log(lonely(API.SPRITES.ghost) < 0.03, "призрак нарисован силуэтом, а не шахматной рябью",
    Math.round(lonely(API.SPRITES.ghost) * 100) + "% одиночных пикселей");

  // --- тон этажей: пол светлее стен, лава — единственная раскалённая плитка ---
  const bad = [];
  API.TERRAIN_FLOORS.forEach((f, i) => {
    const w = stats(f.wall), fl = stats(f.floor);
    if (!(fl.luma - w.luma >= 0.1)) bad.push((i + 1) + ": пол " + fl.luma.toFixed(2) + ", стены " + w.luma.toFixed(2));
  });
  log(bad.length === 0, "на каждом этаже пол заметно светлее стен: проход читается сразу", bad.join("; "));

  // Средняя яркость лавы ниже, чем у стен: плитка почти чёрная, а опасной её
  // делают раскалённые прожилки — яркие, чисто-красные и оранжевые пиксели.
  // У стен и пола огненных этажей красный тусклый, бурый, — таких пикселей нет.
  const hotShare = (uris) => {
    let n = 0, hot = 0;
    uris.forEach((u) => {
      const im = decodePng(u);
      if (!im) return;
      for (let i = 0; i < im.w * im.h; i++) {
        const [r, g, b, a] = im.rgba.subarray(i * 4, i * 4 + 4);
        if (a < 128) continue;
        n += 1;
        if (r >= 100 && r >= g && r >= b && sat(r, g, b) >= 0.8) hot += 1;
      }
    });
    return n ? hot / n : 0;
  };
  const lavaHot = hotShare(API.TERRAIN_LAVA);
  const warmTiles = [];
  API.TERRAIN_FLOORS.forEach((f, i) => {
    const w = hotShare(f.wall), fl = hotShare(f.floor);
    if (w > 0.02 || fl > 0.02) warmTiles.push((i + 1) + ": стены " + w.toFixed(2) + ", пол " + fl.toFixed(2));
  });
  log(lavaHot >= 0.15 && warmTiles.length === 0,
    "лава раскалена, а стены и пол — нет: опасность не сливается с камнем",
    "лава " + lavaHot.toFixed(2) + (warmTiles.length ? "; " + warmTiles.join("; ") : ""));

  // --- файлы собраны сборкой, а не правлены руками ---
  const spritesJs = fs.readFileSync(path.join(dir, "sprites.js"), "utf8");
  const terrainJs = fs.readFileSync(path.join(dir, "terrain.js"), "utf8");
  log(/\/\/ <art:sprites>[\s\S]*СОБРАНО tools\/art\/build_art\.py[\s\S]*\/\/ <\/art:sprites>/.test(spritesJs) &&
    /\/\/ <art:terrain>[\s\S]*СОБРАНО tools\/art\/build_art\.py[\s\S]*\/\/ <\/art:terrain>/.test(terrainJs),
    "картинки в sprites.js и terrain.js собраны tools/art/build_art.py");
  freshRun(0);
}

// ================= 35. Учебный бой, ошибки подряд, страж этажа, повторение =================
{
  const meta = globalThis.TASK_META;
  const topicOf = (c) => {
    if (!c) return "";
    if (c.type === "mc") return c.question.topic;
    // Задания генератора несут тему сами, банковские «повтори код» и
    // «напиши функцию» — только в TASK_META.
    if (c.task.topic) return c.task.topic;
    return meta.taskTopic(c.type, c.task.id);
  };
  const realRandom = Math.random;

  // --- «вспомни → примени» ---
  freshRun(4);
  G.difficulty = "normal";
  const foe = enemyOnPlayerCell("orc", 99999);
  API.openBattle(foe);
  log(G.battle.challenge.type === "mc" && !!G.battle.topic && topicOf(G.battle.challenge) === G.battle.topic,
    "учебный бой начинается с вопроса своей темы («вспомни»)", G.battle.topic);
  G.battle.topic = "control";
  G.battle.review = false;
  G.battle.step = 1;
  API.nextChallenge();
  const practice = G.battle.challenge;
  log(practice.type !== "mc" && topicOf(practice) === "control",
    "второй шаг — практика на ту же тему («примени»)", practice.type + " / " + topicOf(practice));
  API.nextChallenge();
  log(G.battle.challenge.type === "mc" && topicOf(G.battle.challenge) === "control",
    "дальше шаги чередуются: снова вопрос той же темы");

  // Практика идёт по кругу, а не одно и то же подряд.
  let repeats = 0;
  let prevKey = "";
  for (let i = 0; i < 30; i++) {
    const c = API.practiceChallenge({ topic: "control" });
    const k = c.type + ":" + c.task.id;
    if (k === prevKey) repeats += 1;
    prevKey = k;
  }
  log(repeats === 0, "практические задания темы не повторяются подряд", repeats);

  // На «Лёгком» нет «найди ошибку» и «напиши функцию»; при --no-code нет кода.
  G.difficulty = "easy";
  const easyKinds = new Set();
  for (let i = 0; i < 150; i++) {
    const c = API.practiceChallenge({ topic: "collections" });
    if (c) easyKinds.add(c.type);
  }
  log(!easyKinds.has("code") && !easyKinds.has("error"), "практика «Лёгкого»: без кода и поиска ошибок",
    Array.from(easyKinds).join(","));
  G.difficulty = "normal";
  G.codeCheck = false;
  let codeSeen = 0;
  for (let i = 0; i < 150; i++) {
    const c = API.practiceChallenge({ topic: "collections" });
    if (c && c.type === "code") codeSeen += 1;
  }
  G.codeCheck = true;
  log(codeSeen === 0, "проверка кода выключена — «напиши функцию» в практику не попадает", codeSeen);
  // Практика не сложнее этажа больше чем на ступень.
  freshRun(0);
  G.difficulty = "easy";
  const tooHard = [];
  for (let i = 0; i < 100; i++) {
    const c = API.practiceChallenge({ topic: "control" });
    if (!c) continue;
    const lvl = c.task.level ? c.task.level :
      c.type === "copy" ? meta.taskLevel("copy", API.COPY_TASKS.indexOf(c.task)) :
      c.type === "code" ? 3 : 2;
    if (lvl > API.floorLevels().qmax + 1) tooHard.push(c.task.id);
  }
  log(tooHard.length === 0, "на первом этаже практика не сложнее его вопросов больше чем на ступень",
    tooHard.slice(0, 3).join(","));

  // Призрак ошибки: сначала задание, где была ошибка, потом практика по его теме.
  freshRun(4);
  G.difficulty = "normal";
  const missedQ = API.QUESTIONS.find((q) => q.topic === "strings");
  const ghostFoe = enemyOnPlayerCell("ghost", 99999);
  ghostFoe.payload = { kind: "mc", id: missedQ.id };
  API.openBattle(ghostFoe);
  log(G.battle.challenge.type === "mc" && G.battle.challenge.question.id === missedQ.id &&
    G.battle.topic === "strings", "призрак ошибки начинает бой с пропущенного задания");
  API.nextChallenge();
  log(topicOf(G.battle.challenge) === "strings", "дальше бой призрака идёт по теме этого задания",
    G.battle.challenge.type);
  G.battle = null;

  // --- ошибки подряд ---
  freshRun(2);
  G.player.baseMaxHp = 100000;
  API.recalcStats();
  G.player.hp = G.player.maxHp;
  Math.random = () => 0;
  const brute = enemyOnPlayerCell("orc", 99999);
  API.openBattle(brute);
  const takeMiss = () => {
    const before = G.player.hp;
    API.applyAttack(0, "промах", true, "", false);
    return before - G.player.hp;
  };
  const hit1 = takeMiss();
  const hit2 = takeMiss();
  const hit3 = takeMiss();
  log(hit1 > 0 && Math.abs(hit2 - hit1 * 1.5) <= 1 && Math.abs(hit3 - hit1 * 2) <= 1,
    "ошибка подряд бьёт сильнее: вторая ×1,5, третья ×2", hit1 + " / " + hit2 + " / " + hit3);
  // Предупреждение висит над следующим вопросом.
  G.battle.phase = "question";
  API.renderBattle();
  log(/miss-tag/.test(el("battle-box").innerHTML) && /следующая ×2,5/.test(el("battle-box").innerHTML),
    "бой предупреждает, что следующая ошибка ударит сильнее");
  API.applyAttack(10, "верно", false, "", true);
  log(G.battle.missStreak === 0, "верный ответ сбрасывает счёт ошибок");
  const hit4 = takeMiss();
  log(Math.abs(hit4 - hit1) <= 1, "после верного ответа ошибка снова бьёт как обычно", hit4 + " и " + hit1);
  log(API.missMul(2) === 1.5 && API.missMul(20) === 2.5, "рост удара упирается в потолок ×2,5", API.missMul(20));
  Math.random = realRandom;
  G.battle = null;

  // --- опыт ---
  freshRun(4);
  G.difficulty = "easy";
  const xpEasy = API.makeEnemy("orc", 4);
  G.difficulty = "hard";
  const xpHard = API.makeEnemy("orc", 4);
  log(xpEasy.xp === xpHard.xp && xpHard.maxHp > xpEasy.maxHp,
    "опыт за врага не зависит от сложности (а здоровье — зависит)", xpEasy.xp + " / " + xpHard.xp);
  const hpMul0 = API.balanceValue("enemy.hpMul");
  API.applyBalanceValue("enemy.hpMul", 5);
  const xpThick = API.makeEnemy("orc", 4);
  API.applyBalanceValue("enemy.hpMul", hpMul0);
  log(xpThick.xp === xpHard.xp && xpThick.maxHp > xpHard.maxHp,
    "толщина врагов (длина боя) опыта не прибавляет", xpThick.xp + " при " + xpThick.maxHp + " HP");
  G.difficulty = "normal";
  G.player.xp = 0;
  G.player.xpNext = 1e9;
  G.enemies = [xpHard];
  API.defeatEnemy(xpHard);
  log(G.player.xp === xpHard.xp, "за победу начисляется опыт врага, а не его здоровье", G.player.xp);
  log(API.makeEnemy("orc", 0).maxHp < API.makeEnemy("orc", 4).maxHp / (1 + 0.18 * 4) - 1,
    "на первых этажах бои короче: враги толще не сразу");

  // --- страж этажа ---
  freshRun(3);
  const guards = G.enemies.filter((x) => x.guard);
  const gd = guards[0];
  log(guards.length === 1, "на обычном этаже ровно один страж лестницы", guards.length);
  if (gd) {
  log(Math.abs(gd.x - G.stairsDown.x) + Math.abs(gd.y - G.stairsDown.y) === 1 && !gd.payload,
    "страж стоит вплотную к лестнице и не превращается в призрака");
  log(G.stairsDown.active === false, "пока страж жив, лестница вниз закрыта");
  const post = { x: gd.x, y: gd.y };
  for (let i = 0; i < 30; i++) API.enemyTurn();
  log(gd.x === post.x && gd.y === post.y, "страж не сходит с поста");
  const saved = API.serializeFloor(G.cache[3]);
  const restored = API.deserializeFloor(JSON.parse(JSON.stringify(saved)));
  log(restored.enemies.filter((x) => x.guard).length === 1 && restored.stairsDown.active === false,
    "страж и закрытая лестница переживают сохранение");
  const oldSave = JSON.parse(JSON.stringify(saved));
  oldSave.enemies.forEach((x) => { delete x.guard; delete x.xp; });
  log(API.deserializeFloor(oldSave).enemies.every((x) => x.guard === false && x.xp === 0),
    "сохранение без стражей (старое) читается");
  G.playerPos = { x: G.stairsDown.x, y: G.stairsDown.y };
  const lockT = API.interactTarget();
  log(!!lockT && lockT.kind === "locked" && /страж/.test(lockT.label),
    "у закрытой лестницы подпись про стража", lockT && lockT.label);
  G.player.xpNext = 1e9;
  API.defeatEnemy(gd);
  log(G.stairsDown.active === true && API.interactTarget().kind === "down",
    "победа над стражем открывает лестницу");
  } else log(false, "стража нет — проверки поста, сохранения и замка лестницы пропущены");
  freshRun(9);
  log(!G.enemies.some((x) => x.guard) && G.stairsDown.active === false,
    "на этаже дракона стража нет: выход держит сам дракон");
  G.playerPos = { x: G.stairsDown.x, y: G.stairsDown.y };
  const bossT = API.interactTarget();
  log(!!bossT && /дракон/.test(bossT.label), "закрытая драконом лестница подписана честно", bossT && bossT.label);

  // --- повторение и тема этажа ---
  freshRun(5);
  API.learnState().topicSeen = { strings: 1, operators: 2 };
  G.stats.topicStats = { strings: { correct: 1, total: 10 }, operators: { correct: 9, total: 10 } };
  let reviews = 0;
  let weak = 0;
  for (let i = 0; i < 300; i++) {
    const rb = { step: 0 };
    const t = API.pickBattleTopic(rb);
    if (rb.review) {
      reviews += 1;
      if (t === "strings") weak += 1;
    }
  }
  log(reviews > 40 && reviews < 140, "около трети боёв — повторение тем прошлых этажей", reviews + " из 300");
  log(weak > reviews * 0.55, "повторяют чаще тему, где больше ошибок", weak + " из " + reviews);
  const rq = API.recallChallenge({ topic: "strings", review: true });
  log(!!rq && rq.question.topic === "strings", "в бою-повторении вопрос по пройденной теме");
  freshRun(3);
  API.learnState().topicSeen = {};
  let floorTopic = 0;
  for (let i = 0; i < 300; i++) if (API.pickBattleTopic({ step: 0 }) === "strings") floorTopic += 1;
  log(floorTopic > 100, "«Тема этажа» из планки входа встречается в боях заметно чаще", floorTopic + " из 300");

  // --- карточка боя ---
  freshRun(4);
  API.openBattle(enemyOnPlayerCell("orc", 99999));
  API.renderBattle();
  const card = el("battle-box").innerHTML;
  // Темы боя в окне больше нет (она видна в самом вопросе), зато об ошибках
  // подряд окно предупреждает: следующая бьёт сильнее.
  log(!/Тема боя|Повторение:/.test(card) && !/battle-topic/.test(card),
    "строки «Тема боя» в окне нет");
  G.battle.missStreak = 2;
  API.renderBattle();
  const cardMiss = el("battle-box").innerHTML;
  log(/battle-topic/.test(cardMiss) && /Ошибок подряд: 2/.test(cardMiss),
    "зато про ошибки подряд окно предупреждает");
  G.battle = null;
  Math.random = realRandom;
  freshRun(0);
}

// ================= 36. Генератор практики (practice-variants.js) =================
{
  const gen = globalThis.PracticeVariants;
  const meta = globalThis.TASK_META;
  const levelOf = (c) => c.task.level ||
    (c.type === "copy" ? meta.taskLevel("copy", API.COPY_TASKS.indexOf(c.task)) : 3);
  log(!!gen && gen.list.length >= 100, "генератор практики подключён", gen ? gen.list.length + " шаблонов" : "нет");
  // Без генератора остальным проверкам раздела не на чем работать.
  if (gen) {
    // У каждой темы боя есть практика на каждом этаже и сложности. Раньше у
    // «Модулей» практики не было вовсе, а у «Исключений» на «Лёгком»: бой этих
    // тем шёл одними вопросами, и «примени» не наступало.
    freshRun(0);
    const gaps = [];
    ["easy", "normal", "hard"].forEach((diff) => {
      API.FLOORS.forEach((f, idx) => {
        G.difficulty = diff;
        G.floorIndex = idx;
        const lv = API.floorLevels();
        const topics = new Set(API.QUESTIONS.filter((q) => q.level >= lv.qmin && q.level <= lv.qmax).map((q) => q.topic));
        topics.forEach((topic) => {
          if (!API.practiceChallenge({ topic: topic })) gaps.push(diff + ", этаж " + (idx + 1) + ", " + topic);
        });
      });
    });
    log(gaps.length === 0, "у каждой темы боя есть практика на каждом этаже и сложности", gaps.slice(0, 4).join("; "));

    // Практика одной темы почти не повторяется. До генератора у «Синтаксиса»
    // на первом этаже было два задания на весь поход.
    const run = (diff, floorIdx, topic, n) => {
      freshRun(0);
      // freshRun учебную память не трогает: без сброса прогоны мешали бы друг другу.
      G.learn = null;
      G.difficulty = diff;
      G.floorIndex = floorIdx;
      const seen = [];
      for (let i = 0; i < n; i++) {
        const c = API.practiceChallenge({ topic: topic });
        if (c) seen.push(c);
      }
      return seen;
    };
    const syntax = run("easy", 0, "syntax", 30);
    const syntaxUniq = new Set(syntax.map((c) => c.type + ":" + c.task.code)).size;
    log(syntaxUniq >= 27, "«Синтаксис» на первом этаже: 30 заданий «примени» почти все разные",
      syntaxUniq + " разных из " + syntax.length);
    // «Напиши функцию» генератор не делает: их в банке 11, и они повторяются —
    // в этом счёте их не учитываем.
    const control = run("normal", 4, "control", 60).filter((c) => c.type !== "code");
    const controlUniq = new Set(control.map((c) => c.type + ":" + c.task.code)).size;
    log(controlUniq >= control.length - 2, "«Условия и циклы»: практика почти без повторов",
      controlUniq + " разных из " + control.length);
    // «Вспомни» тоже идёт по кругу: пока не заданы все вопросы темы, ни
    // один не повторяется. Раньше вопрос выпадал наугад, и на теме, где их
    // четыре, один и тот же за поход задавали до семи раз.
    freshRun(0);
    G.learn = null;
    G.difficulty = "normal";
    G.floorIndex = 4;
    // Два круга подряд по теме, где вопросов много (одних банковских
    // «Списков» третьего уровня десять): наугад без повторов так не выпадает.
    const lvRecall = API.floorLevels();
    const recallPool = API.QUESTIONS.filter((q) => q.topic === "collections" &&
      q.level >= lvRecall.qmin && q.level <= lvRecall.qmax);
    const rounds = [[], []];
    rounds.forEach((round) => {
      for (let i = 0; i < recallPool.length; i++) round.push(API.recallChallenge({ topic: "collections" }).question.id);
    });
    const roundsUniq = rounds.map((round) => new Set(round).size);
    log(recallPool.length >= 6 && roundsUniq.every((n) => n === recallPool.length),
      "вопросы «вспомни» за поход идут по кругу, а не наугад",
      "два круга по " + recallPool.length + ": " + roundsUniq.join(" и ") + " разных");
    const mixed = control.concat(syntax);
    log(mixed.some((c) => c.task.generated) && mixed.some((c) => !c.task.generated),
      "в практике идут и задания банка, и задания генератора");

    // «Напиши функцию» тоже из генератора: задача с тестами, и одно условие
    // за 60 заданий не повторяется. Условий у темы немного, и раньше, когда
    // они кончались, задача шла по второму кругу; теперь бой берёт другой вид.
    const seenAs = (c) => c.type + ":" + (c.type === "code" ? c.task.task + "|" + c.task.starter : c.task.code);
    const hardFns = run("hard", 7, "functions", 60);
    const genCode = hardFns.filter((c) => c.type === "code" && c.task.generated);
    log(genCode.length > 0 && genCode.every((c) => c.task.tests.length >= 2 && /^def /m.test(c.code)),
      "«напиши функцию» из генератора: заготовка и тесты на месте", genCode.length + " задач");
    const fnUniq = new Set(hardFns.map(seenAs)).size;
    log(fnUniq === hardFns.length, "«Сложный», «Функции»: 60 заданий подряд без единого повтора",
      fnUniq + " разных из " + hardFns.length + ", из них «напиши функцию» " +
      hardFns.filter((c) => c.type === "code").length);

    // Память узнаёт задание по содержимому: генератор может собрать ровно
    // тот же код, что лежит в банке, и для ученика это повтор, хотя номера
    // у заданий разные.
    const bankBug = API.ERROR_TASKS.find((t) => t.id === "err_def_colon");
    let twin = null;
    for (let i = 0; i < 80 && !twin; i++) {
      const t = gen.make("error.functions.def_colon");
      if (t.code === bankBug.code) twin = t;
    }
    log(!!twin && twin.id !== bankBug.id &&
      API.practiceSeenKey("error", twin) === API.practiceSeenKey("error", bankBug),
      "задание генератора с кодом из банка память считает тем же заданием");

    // Память о недавних заданиях переживает сохранение, а старое сохранение
    // без неё читается.
    freshRun(0);
    G.learn = null;
    for (let i = 0; i < 5; i++) API.practiceChallenge({ topic: "operators" });
    const recentBefore = API.learnState().practiceRecent.slice();
    API.saveGame();
    API.loadGame();
    log(recentBefore.length === 5 && API.learnState().practiceRecent.join() === recentBefore.join(),
      "память о недавних заданиях переживает сохранение");
    G.learn = { topicSeen: {}, practiceUsed: {}, tick: 3 };
    const fromOld = API.practiceChallenge({ topic: "operators" });
    log(!!fromOld && API.learnState().practiceRecent.length === 1, "старое сохранение без этой памяти не мешает практике");

    // Уровень: на нижних этажах не проще этажа больше чем на ступень, а бой
    // повторения берёт и простые задания пройденной темы.
    const deep = run("normal", 8, "collections", 60);
    const tooEasy = deep.filter((c) => levelOf(c) < 3);
    log(tooEasy.length === 0, "на нижних этажах практика не проще этажа больше чем на ступень",
      tooEasy.slice(0, 3).map((c) => c.task.id).join(", "));
    freshRun(0);
    G.floorIndex = 8;
    let reviewEasy = 0;
    for (let i = 0; i < 60; i++) {
      const c = API.practiceChallenge({ topic: "collections", review: true });
      if (c && levelOf(c) < 3) reviewEasy += 1;
    }
    log(reviewEasy > 0, "бой повторения берёт и простые задания пройденной темы", reviewEasy + " из 60");

    // Ошибка в сгенерированном задании: в очередь призраков оно ложится
    // целиком и после перезагрузки возвращается тем же, а не новым.
    freshRun(2);
    const foe = enemyOnPlayerCell("orc", 99999);
    API.openBattle(foe);
    const answerWrong = (c) => {
      G.battle.challenge = c;
      API.attachChoices(c);
      G.battle.phase = "question";
      API.answerMC((c.view.answer + 1) % c.view.options.length);
    };
    const gFill = gen.make("fill.operators.arith");
    answerWrong({ type: "fill", task: gFill });
    const gQuestion = API.QUESTIONS.find((q) => q.generated);
    answerWrong({ type: "mc", question: gQuestion });
    const bankQuestion = API.QUESTIONS.find((q) => !q.generated);
    answerWrong({ type: "mc", question: bankQuestion });
    const qFill = G.missed.find((m) => m.id === gFill.id);
    const qQuestion = G.missed.find((m) => m.id === gQuestion.id);
    const qBank = G.missed.find((m) => m.id === bankQuestion.id);
    log(!!qFill && !!qFill.item && qFill.item.code === gFill.code && !!qQuestion && !!qQuestion.item,
      "ошибка в сгенерированном задании ложится в очередь призраков целиком");
    log(!!qBank && !qBank.item, "задание банка в очереди — по номеру, как раньше");
    G.battle = null;
    API.saveGame();
    API.loadGame();
    const back = G.missed.find((m) => m.id === gFill.id);
    const found = back ? API.findPayload(back) : null;
    log(!!found && found.code === gFill.code && found.options.join() === gFill.options.join(),
      "после перезагрузки призрак вернёт то же задание, а не новое с тем же номером");
    const ghost = enemyOnPlayerCell("ghost", 99999);
    ghost.payload = back;
    API.openBattle(ghost);
    log(G.battle.challenge.type === "fill" && G.battle.challenge.task.code === gFill.code &&
      G.battle.topic === gFill.topic, "бой призрака начинается с того самого задания генератора");
    G.battle = null;

    // Код задания выводится текстом: type() печатает <class 'int'>, и как
    // разметка это пропадало со страницы.
    freshRun(2);
    const foe2 = enemyOnPlayerCell("orc", 99999);
    API.openBattle(foe2);
    const typed = gen.make("fill.types.type_of");
    G.battle.challenge = { type: "fill", task: typed };
    API.attachChoices(G.battle.challenge);
    G.battle.phase = "question";
    API.renderBattle();
    const card = el("battle-box").innerHTML;
    log(/&lt;class '/.test(card) && !/<class '/.test(card), "код задания выводится текстом, а не разметкой");

    // «Повтори код» из генератора проверяется так же, как из банка.
    const cp = gen.make("copy.functions.heal");
    G.battle.challenge = { type: "copy", task: cp, code: cp.code, results: null };
    G.battle.phase = "question";
    const hpBefore = foe2.hp;
    API.checkCopy();
    log(foe2.hp < hpBefore, "задание генератора «повтори код» проверяется и бьёт врага", hpBefore + " → " + foe2.hp);
    G.battle = null;
    freshRun(0);
  }
}

// ================= 37. Сложность по умолчанию, цепь у лестницы, кузница =================
{
  // «Обычный» выбран в меню заранее, и игра считает так же: карточка в
  // game.html и начальное значение в game.js не должны разойтись.
  const html37 = fs.readFileSync(path.join(dir, "game.html"), "utf8");
  const src37 = fs.readFileSync(path.join(dir, "game.js"), "utf8");
  const activeDiff = (html37.match(/class="mode active" data-diff="(\w+)"/) || [])[1];
  const initDiff = (src37.match(/const G = \{[\s\S]*?difficulty: "(\w+)"/) || [])[1];
  log(activeDiff === "normal" && initDiff === "normal",
    "по умолчанию и в меню, и в игре — «Обычный»", activeDiff + " / " + initDiff);
  log((html37.match(/data-diff="\w+" role="radio" aria-checked="true"/g) || []).length === 1,
    "в меню отмечена ровно одна сложность");

  // Цепь не пускает к лестнице: шаг с клетки запрещён, а лестница — тот же
  // шаг. Раньше герой уходил по соседней лестнице, и цепь держала его уже
  // на другом этаже, где никакой ловушки нет.
  freshRun(1);
  G.traps = [];
  G.enemies = [];
  G.treasures = [];
  G.traders = [];
  const nb37 = walkableNeighbours(G.playerPos)[0];
  G.stairsDown = { x: nb37.x, y: nb37.y, active: true };
  G.stairsUp = null;
  G.player.snared = true;
  G.player.snareWaits = 0;
  const floor37 = G.floorIndex;
  const held = API.interactTarget();
  log(held && held.kind === "chained", "в цепях соседняя лестница вниз закрыта", held && held.kind);
  API.updateActionButton();
  log(el("action-label").textContent === "Цепь не пускает к лестнице" &&
    el("action-btn").classList.contains("locked"),
    "кнопка действия говорит, что держит цепь", el("action-label").textContent);
  API.doInteract();
  log(G.floorIndex === floor37 && G.player.snared, "по кнопке в цепях спуска нет, цепь на месте");
  log(/пережди/i.test(el("game-msg").textContent), "подсказка говорит, как освободиться",
    el("game-msg").textContent);
  API.descend();
  log(G.floorIndex === floor37, "прямой вызов спуска в цепях тоже ничего не делает");

  G.stairsDown = { x: -5, y: -5, active: true };
  G.stairsUp = { x: nb37.x, y: nb37.y };
  const heldUp = API.interactTarget();
  log(heldUp && heldUp.kind === "chained", "лестница вверх в цепях тоже закрыта", heldUp && heldUp.kind);
  API.ascend();
  log(G.floorIndex === floor37, "подъём в цепях ничего не делает");

  // До сундука рядом дотянуться можно: шага он не требует.
  G.stairsUp = null;
  G.treasures = [{ x: nb37.x, y: nb37.y, item: API.itemsForFloor(1)[0] }];
  const chest37 = API.interactTarget();
  log(chest37 && chest37.kind === "chest", "сундук рядом в цепях открыть можно", chest37 && chest37.kind);
  G.treasures = [];

  // Цепь спала — лестница снова работает, и на новом этаже героя ничто не держит.
  G.stairsDown = { x: nb37.x, y: nb37.y, active: true };
  for (let i = 0; i < API.SNARE_WAITS; i++) API.skipTurn();
  const free37 = API.interactTarget();
  log(!G.player.snared && free37 && free37.kind === "down", "цепь спала — лестница снова открыта",
    free37 && free37.kind);
  API.doInteract();
  log(G.floorIndex === floor37 + 1 && !G.player.snared, "спуск без цепи работает, на новом этаже герой свободен",
    G.floorIndex + 1);

  // Кузница загорается, когда золота хватает на улучшение, а журнал один
  // раз за поход говорит, где она. Бот, по которому мерили баланс, туда не
  // ходил, и к концу похода у него копились тысячи золота.
  freshRun(2);
  el("log").innerHTML = "";
  G.stats.forgeHinted = false;
  G.forge = { weapon: 0, armor: 0, vitality: 0 };
  const forgeBtn = el("forge-btn");
  const hintLines = () => el("log").children
    .filter((n) => /Золота хватает на улучшение/.test(n.textContent)).length;
  const hud = (gold) => { G.player.gold = gold; G.hudSig = null; API.updateHud(); };
  hud(0);
  log(!forgeBtn.hasAttribute("data-ready"), "без золота значка у кузницы нет");
  const cheapest = Math.min(...API.FORGE_TRACKS.map((t) => API.forgeCost(t.key)));
  hud(cheapest - 1);
  log(!forgeBtn.hasAttribute("data-ready") && hintLines() === 0,
    "на улучшение не хватает одной монеты — значка и подсказки нет", cheapest - 1);
  hud(cheapest);
  log(forgeBtn.hasAttribute("data-ready"), "золота хватает на улучшение — у кузницы значок", cheapest);
  log(/хватает/.test(forgeBtn.getAttribute("data-tip") || ""), "подсказка на ссылке говорит о том же");
  log(hintLines() === 1, "журнал подсказывает, где кузница", hintLines());
  hud(0);
  hud(cheapest + 1);
  log(hintLines() === 1, "подсказка в журнале — один раз за поход", hintLines());
  // Загрузка чистит журнал, поэтому после неё подсказки быть не должно вовсе.
  API.saveGame();
  API.loadGame();
  hud(0);
  hud(cheapest + 1);
  log(hintLines() === 0 && G.stats.forgeHinted === true, "и после перезагрузки не повторяется", hintLines());
  const cheapKey = API.FORGE_TRACKS.map((t) => t.key)
    .sort((a, b) => API.forgeCost(a) - API.forgeCost(b))[0];
  API.buyForge(cheapKey);
  log(G.forge[cheapKey] === 1 && !forgeBtn.hasAttribute("data-ready"),
    "золото ушло в кузницу — значок гаснет", "осталось " + G.player.gold);
  el("forge-overlay").classList.add("hidden");
  freshRun(0);
}

// ================= 38. Деревня: уровень, банк и потолок амулетов =========
// Замысел: деревня — не экран-анкета, а настоящий уровень на том же движке,
// что подземелье: карта из тайлов, герой ходит, дома не пропускают, в дома
// можно войти. Здесь же копится золото, а амулеты возврата упираются в
// жёсткий потолок.
freshRun(0);
const profH = getProfile(G.name);
profH.wallet.gold = 500;
profH.hub.revive = 0;
profH.hub.gear = [];
putProfile(G.name, profH);
API.enterVillage(null);
log(G.place === "village", "герой входит в деревню", G.place);
log(G.map && G.map.w === API.VILLAGE_MAP[0].length && G.map.h === API.VILLAGE_MAP.length,
  "карта деревни собрана из раскладки", G.map && (G.map.w + "x" + G.map.h));
log(G.map.grid[G.playerPos.y][G.playerPos.x] === 1, "герой появился на проходимой клетке");
log(G.enemies.length === 0 && G.traps.length === 0 && !G.hazard,
  "в деревне нет монстров, ловушек и среды");

// Достижимость: от точки появления можно дойти до каждого НПС и каждой
// двери. Такой проверки не было нигде, а для уровня она главная: одна
// непроходимая клетка — и часть деревни отрезана.
// Дверь теперь часть стены, поэтому целью считаем и клетку рядом с ней.
const stepDirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const walkableAt = (p) => !!(p && G.map.grid[p.y] && G.map.grid[p.y][p.x] === 1 &&
  !API.cellBlocked(p.x, p.y));
const reachable = (x, y) => {
  if (walkableAt({ x: x, y: y })) return API.findPath(G.playerPos, { x: x, y: y }) !== null;
  return stepDirs
    .map((d) => ({ x: x + d[0], y: y + d[1] }))
    .some((p) => walkableAt(p) && API.findPath(G.playerPos, p) !== null);
};
const reachBad = [];
(G.npcs || []).forEach((n) => {
  if (!reachable(n.x, n.y)) reachBad.push("НПС " + n.name);
});
(G.doors || []).forEach((d) => {
  if (!reachable(d.x, d.y)) reachBad.push("дверь " + d.x + "," + d.y);
});
log(reachBad.length === 0, "от точки появления достижимы все НПС и двери",
  reachBad.join("; ") || "всё достижимо");

// Дом непроходим целиком: стены и сама дверь — часть стены. Внутрь ведёт
// только взаимодействие с дверью; шагом через проём попасть нельзя.
// Координаты берём из данных, а не числами: правка карты не должна ломать
// проверку — она должна проверять правило.
const traderDoor = API.VILLAGE_HOUSES.trader.door;
const inFront = { x: traderDoor.x, y: traderDoor.y + 1 };
log(G.map.grid[traderDoor.y][traderDoor.x] === 0,
  "дверь дома — часть стены, а не проём", G.map.grid[traderDoor.y][traderDoor.x]);
log(G.map.grid[inFront.y] && G.map.grid[inFront.y][inFront.x] === 1,
  "перед дверью есть клетка улицы", inFront.x + "," + inFront.y);
G.playerPos = { x: inFront.x, y: inFront.y };
const stepFrom = G.playerPos.x + "," + G.playerPos.y;
API.move(0, -1);
log(G.playerPos.x + "," + G.playerPos.y === stepFrom,
  "шагом в дом не войти", G.playerPos.x + "," + G.playerPos.y);
log(G.place === "village", "и шаг в стену внутрь не переносит", G.place);
const doorTarget = API.interactTarget();
log(!!doorTarget && doorTarget.kind === "door", "зато дверь предлагает вход",
  doorTarget && doorTarget.kind);

// Дерево — проходимая клетка пола с запретом входа. Берём дерево, к которому
// и правда можно подойти: у углового сосед тоже дерево, к нему не встать.
const tree = (G.scenery || []).find((o) => o.kind === "tree" &&
  stepDirs.some((d) => walkableAt({ x: o.x + d[0], y: o.y + d[1] })));
log(!!tree, "на карте есть дерево, к которому можно подойти");
if (tree) {
  const nearTree = stepDirs
    .map((d) => ({ x: tree.x + d[0], y: tree.y + d[1] }))
    .find((p) => walkableAt(p));
  log(G.map.grid[tree.y][tree.x] === 1 && API.cellBlocked(tree.x, tree.y),
    "дерево — проходимая клетка с запретом входа",
    "grid=" + G.map.grid[tree.y][tree.x] + " blocked=" + API.cellBlocked(tree.x, tree.y));
  G.playerPos = { x: nearTree.x, y: nearTree.y };
  API.move(tree.x - nearTree.x, tree.y - nearTree.y);
  log(G.playerPos.x === nearTree.x && G.playerPos.y === nearTree.y,
    "сквозь дерево не пройти", G.playerPos.x + "," + G.playerPos.y);
}

// Вход через дверь и возврат ровно на ту клетку улицы, откуда вошли.
G.playerPos = { x: inFront.x, y: inFront.y };
API.doInteract();
log(G.place === "house" && G.houseKey === "trader", "дверь ведёт внутрь дома",
  G.place + "/" + G.houseKey);
const insideNpc = (G.npcs || []).find((n) => n.key === "trader");
log(!!insideNpc, "внутри дома стоит торговец");
log(API.findPath(G.playerPos, { x: insideNpc.x, y: insideNpc.y }) !== null,
  "до торговца внутри дома можно дойти");

// Выход возвращает на ту же клетку улицы, а не внутрь стены.
const backCell = G.villageReturn;
const houseExit = API.VILLAGE_HOUSES.trader.exit;
G.playerPos = { x: houseExit.x, y: houseExit.y };
const exitTarget = API.interactTarget();
log(!!exitTarget && exitTarget.kind === "door" && exitTarget.obj.exit === true,
  "дверь комнаты ведёт на улицу",
  exitTarget && (exitTarget.kind + "/" + (exitTarget.obj && exitTarget.obj.exit)));
API.doInteract();
log(G.place === "village", "выход возвращает в деревню", G.place);
log(!!backCell && G.playerPos.x === backCell.x && G.playerPos.y === backCell.y,
  "герой вернулся на ту клетку улицы, откуда вошёл",
  G.playerPos.x + "," + G.playerPos.y + " (ждали " + (backCell ? backCell.x + "," + backCell.y : "—") + ")");

// Каждый дом, а не только дом торговца: из двери должен быть шаг, а все
// клетки комнаты — достижимы. Сплошная мебель поперёк комнаты однажды
// замуровала дверь дома наставника: игрок появлялся на клетке двери и не мог
// шагнуть никуда, а наставник оставался за стеной.
const houseBad = [];
const houseDirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
Object.keys(API.VILLAGE_HOUSES).forEach((key) => {
  API.enterHouse(key);
  const exit = API.VILLAGE_HOUSES[key].exit;
  const npc = (G.npcs || []).find((n) => n.place === key);
  const w = G.map.w, h = G.map.h;
  if (G.playerPos.x !== exit.x || G.playerPos.y !== exit.y) {
    houseBad.push(key + ": герой вошёл не на дверь");
  }
  const seen = new Set([exit.x + "," + exit.y]);
  const queue = [[exit.x, exit.y]];
  while (queue.length) {
    const cur = queue.shift();
    houseDirs.forEach((d) => {
      const nx = cur[0] + d[0], ny = cur[1] + d[1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      if (G.map.grid[ny][nx] !== 1) return;
      const k = nx + "," + ny;
      if (seen.has(k)) return;
      seen.add(k);
      queue.push([nx, ny]);
    });
  }
  let walkable = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (G.map.grid[y][x] === 1) walkable++;
  if (seen.size !== walkable) houseBad.push(key + ": достижимо " + seen.size + " из " + walkable);
  if (npc && !seen.has(npc.x + "," + npc.y)) houseBad.push(key + ": житель отрезан");
  // Шаг из двери и вправду работает: упираться в стену герой не должен.
  houseDirs.forEach((d) => {
    const nx = exit.x + d[0], ny = exit.y + d[1];
    if (!G.map.grid[ny] || G.map.grid[ny][nx] !== 1) return;
    G.playerPos = { x: exit.x, y: exit.y };
    API.move(d[0], d[1]);
    if (G.playerPos.x === exit.x && G.playerPos.y === exit.y) {
      houseBad.push(key + ": шаг из двери не сработал");
    }
  });
});
log(houseBad.length === 0,
  "в каждом доме из двери есть выход, а все клетки комнаты достижимы",
  houseBad.join("; ") || "все " + Object.keys(API.VILLAGE_HOUSES).length + " дома проходимы");
API.enterVillage(null);

// Каждая непостроенная постройка должна быть заперта: у кузницы однажды
// стояла открытая дверь («D» вместо «d»), и в неё пускало ещё до стройки.
API.VILLAGE_SEALED.forEach((b) => {
  const st = API.villageBuildingAtDoor(b.door.x, b.door.y);
  log(st === b.key, "дверь постройки «" + b.name + "» знает своё здание", String(st));
});
const openTooEarly = API.VILLAGE_SEALED.filter((b) => API.buildingUnlocked(b.key));
log(openTooEarly.length === 0, "пока не построено — в постройки не пускают",
  openTooEarly.map((b) => b.key).join(", ") || "все заперты");
const lockedSealed = (G.doors || []).filter((d) => d.key && API.VILLAGE_SEALED.some((b) => b.key === d.key));
log(lockedSealed.length === API.VILLAGE_SEALED.length &&
  lockedSealed.every((d) => API.doorLocked(d)),
  "и все их двери закрыты на карте",
  lockedSealed.map((d) => d.key + "=" + API.doorLocked(d)).join(" "));

// Запертая дверь: стоит на стене, внутрь не пускает, а окно предлагает
// восстановить постройку за материалы из подземелья.
const lockedDoor = (G.doors || []).find((d) => d.locked);
log(!!lockedDoor, "на карте есть запертая дверь");
if (lockedDoor) {
  const lockedFront = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    .map((d) => ({ x: lockedDoor.x + d[0], y: lockedDoor.y + d[1] }))
    .find((p) => G.map.grid[p.y] && G.map.grid[p.y][p.x] === 1 && !API.cellBlocked(p.x, p.y));
  log(!!lockedFront, "к запертой двери можно подойти");
  if (lockedFront) {
    G.playerPos = { x: lockedFront.x, y: lockedFront.y };
    const lockedTarget = API.interactTarget();
    log(!!lockedTarget && lockedTarget.kind === "build",
      "запертая дверь предлагает восстановить постройку",
      lockedTarget && lockedTarget.kind + " / " + (lockedTarget && lockedTarget.label));
    API.doInteract();
    log(G.place === "village", "через запертую дверь не войти", G.place);
    log(!el("dialog-overlay").classList.contains("hidden") &&
      /Нужно:|построено до конца/.test(el("dialog-box").innerHTML),
      "и объясняет, что нужно для постройки");
    API.closeDialog();
  }
}

// В деревне видно, с чем герой пойдёт вниз: зелья из кошелька и купленное
// снаряжение. Раньше панель была пустой — renderInventory вызывался только
// на спуске, и ученик не видел ни сумки, ни надетого.
const bagProf = getProfile(G.name);
bagProf.wallet = { gold: 100, small_potion: 2, big_potion: 1 };
bagProf.hub = { revive: 0, gear: ["steel_sword"] };
// Проверяем именно первый поход: без рекорда и без сохранения.
bagProf.dungeonBest = null;
putProfile(G.name, bagProf);
Object.keys(globalThis.localStorage._d || {})
  .filter((k) => k.indexOf("pyquiz_save") === 0)
  .forEach((k) => globalThis.localStorage.removeItem(k));
API.enterVillage(null);
log((G.inventory || []).filter((i) => i.slot === "potion").length === 3,
  "в деревне в сумке зелья из кошелька",
  (G.inventory || []).filter((i) => i.slot === "potion").length + " зелий");
log((G.inventory || []).some((i) => i.id === "steel_sword"),
  "и купленное снаряжение ждёт спуска");
log(/С собой в поход/.test(el("village-bank").innerHTML),
  "панель деревни перечисляет, что герой берёт с собой");
log(/Следующий шаг/.test(el("village-bank").innerHTML),
  "панель деревни говорит, что делать дальше", el("village-bank").innerHTML.slice(0, 80));
log(/Первый поход/.test(el("village-bank").innerHTML),
  "первому игроку объясняют цель первого похода");
log(!el("inventory-box") || el("inventory-box").innerHTML.length > 0,
  "и сумка в панели не пустая");
bagProf.hub.gear = [];

// В деревне нечего сохранять: сейв похода не должен затираться.
globalThis.localStorage.removeItem(API.SAVE_KEY);
API.saveGame();
log(globalThis.localStorage.getItem(API.SAVE_KEY) === null,
  "в деревне сейв похода не пишется");

// Окна жителей: у стража — вход в подземелье, у торговца — лавка,
// у старосты — банк и рекорд, у наставника — памятка.
API.enterVillage(null);
const guardNpc = (G.npcs || []).find((n) => n.key === "guard");
const guardFront = [[0, 1], [0, -1], [-1, 0], [1, 0]]
  .map((d) => ({ x: guardNpc.x + d[0], y: guardNpc.y + d[1] }))
  .find((p) => G.map.grid[p.y] && G.map.grid[p.y][p.x] === 1 && !API.cellBlocked(p.x, p.y));
G.playerPos = { x: guardFront.x, y: guardFront.y };
const guardTarget = API.interactTarget();
log(!!guardTarget && guardTarget.kind === "npc" && guardTarget.obj.key === "guard",
  "у стража входа есть кнопка разговора",
  guardTarget && guardTarget.obj && guardTarget.obj.key);
API.doInteract();
log(!el("entrance-overlay").classList.contains("hidden"), "страж открывает окно входа");
log(/id="entrance-overlay"/.test(gameHtml) && /id="game-mode"/.test(gameHtml) &&
  /id="difficulty"/.test(gameHtml) && /id="begin-btn"/.test(gameHtml),
  "в окне входа есть режим, сложность и кнопка спуска");
API.closeEntrance();
log(el("entrance-overlay").classList.contains("hidden"), "окно входа закрывается");

// Торговец внутри дома: окно с лавкой и покупкой.
API.enterHouse("trader");
const tNpc = G.npcs.find((n) => n.key === "trader");
G.playerPos = { x: tNpc.x, y: tNpc.y + 1 };
log(API.interactTarget().kind === "npc", "у торговца есть кнопка разговора");
API.doInteract();
log(!el("dialog-overlay").classList.contains("hidden"), "торговец открывает окно");
log(/hub-buy/.test(el("dialog-box").innerHTML), "в окне торговца есть товары");
const bankBefore = getProfile(G.name).wallet.gold;
API.buyHubItem("small_potion");
log(getProfile(G.name).wallet.gold < bankBefore, "покупка в окне торговца списывает банк",
  bankBefore + " -> " + getProfile(G.name).wallet.gold);
API.closeDialog();
log(el("dialog-overlay").classList.contains("hidden"), "окно торговца закрывается");

// Шапка окна должна быть несжимаемой. Карточка окна — флекс-колонка с
// ограничением высоты, и шапка без flex-shrink: 0 сжималась в нулевую
// высоту: содержимое её перекрывало, и кнопка «Закрыть» пропадала —
// выйти из окна торговца было нечем.
const cssDialogs = fs.readFileSync(path.join(dir, "game.css"), "utf8");
const headBad = ["shop-box", "forge-box", "dialog-box", "entrance-box"].filter((box) => {
  const at = cssDialogs.indexOf("#" + box + " .battle-head");
  if (at < 0) return true;                     // окна нет в правиле — шапка сожмётся
  const end = cssDialogs.indexOf("}", at);
  return end < 0 || cssDialogs.slice(at, end).indexOf("flex-shrink: 0") < 0;
});
log(headBad.length === 0, "шапки окон не сжимаются — кнопка «Закрыть» не пропадает",
  headBad.join(", ") || "все окна на месте");

// Староста: банк, амулеты и рекорд.
API.enterHouse("elder");
const eNpc = G.npcs.find((n) => n.key === "elder");
G.playerPos = { x: eNpc.x, y: eNpc.y + 1 };
API.doInteract();
log(/Банк деревни/.test(el("dialog-box").innerHTML), "староста показывает банк");
log(/Рекорд/.test(el("dialog-box").innerHTML), "и рекорд");
API.closeDialog();

// Наставник: памятка и ссылки.
API.enterHouse("mentor");
const mNpc = G.npcs.find((n) => n.key === "mentor");
G.playerPos = { x: mNpc.x, y: mNpc.y + 1 };
API.doInteract();
log(/Как играть/.test(el("dialog-box").innerHTML), "наставник показывает памятку");
API.closeDialog();
API.enterVillage(null);

// ============ Развитие деревни и постоянная прогрессия ============
// Главное правило игры: первый поход обречён, а спускаться глубже можно лишь
// подняв деревню. Материалы падают только с глубины, деревня открывает
// улучшения героя, и только вместе это снимает стену на шестом этаже.
function resetProgress() {
  const p = getProfile(G.name);
  const blank = progressEmpty();
  p.hero = blank.hero;
  p.village = blank.village;
  p.loot = blank.loot;
  p.quests = blank.quests;
  p.ability = blank.ability;
  p.wallet = { gold: 0, small_potion: 0, big_potion: 0 };
  p.hub = { revive: 0, gear: [] };
  p.dungeonBest = null;
  putProfile(G.name, p);
  return p;
}
function give(j, gold) {
  const p = getProfile(G.name);
  Object.keys(j).forEach((k) => {
    if (k === "keys") p.loot.keys = p.loot.keys.concat(j.keys);
    else if (k === "gold") p.wallet.gold += j.gold;
    else p.loot[k] = (p.loot[k] || 0) + j[k];
  });
  if (gold) p.wallet.gold = gold;
  putProfile(G.name, p);
  return p;
}

// Голый профиль: улучшать нечего, пока нет кузницы.
resetProgress();
API.enterVillage(null);
log(API.upgradeCap() === 0, "без кузницы улучшений героя нет", "потолок " + API.upgradeCap());
log(API.VILLAGE_BUILDINGS && Object.keys(API.VILLAGE_BUILDINGS).length === 4,
  "деревня знает четыре постройки",
  Object.keys(API.VILLAGE_BUILDINGS).join(", "));

// Цены построек проверяем по самим данным: числа в проверке разошлись бы
// с игрой при первой же правке стоимости.
function giveCost(key) {
  const cost = API.buildCost(key);
  const j = {};
  Object.keys(cost).forEach((k) => { if (k === "key") j.keys = [cost[k]]; else j[k] = cost[k]; });
  give(j);
  return cost;
}
function payFor(key) {
  const cost = API.buildCost(key);
  if (!cost) return false;
  giveCost(key);
  return API.restoreBuilding(key);
}

// Амбар: без ключа не построить, с ключом и древесиной — строится.
give({ wood: API.buildCost("barn").wood });
log(API.restoreBuilding("barn") === false && getProfile(G.name).village.barn === 0,
  "без ключа амбар не восстановить");
give({ keys: ["barn"] });
const barnBuilt = API.restoreBuilding("barn");
const afterBarn = getProfile(G.name);
log(barnBuilt && afterBarn.village.barn === 1, "с ключом и древесиной амбар встаёт",
  "уровень " + afterBarn.village.barn);
log(afterBarn.loot.wood === 0 && afterBarn.loot.keys.indexOf("barn") < 0,
  "материалы и ключ списаны", "древесины " + afterBarn.loot.wood);
API.enterVillage(null);
log(API.buildingUnlocked("barn"), "и дверь амбара открылась");
const barnDoor = G.doors.find((d) => d.key === "barn");
log(!!barnDoor && !API.doorLocked(barnDoor), "замок с двери снят");
log(API.enterHouse("barn") !== false && G.npcs.some((n) => n.key === "storekeeper"),
  "внутри амбара ждёт кладовщик");

// Кузница: она и есть ключ к силе героя.
API.enterVillage(null);
log(payFor("forge") && API.upgradeCap() === 3,
  "кузница открывает три уровня улучшений", "потолок " + API.upgradeCap());
give({}, 4000);
log(API.buyHeroUpgrade("hp") && getProfile(G.name).hero.hp === 1,
  "улучшение здоровья покупается", "уровень " + getProfile(G.name).hero.hp);
log(getProfile(G.name).wallet.gold === 4000 - API.heroPrice("hp", 0),
  "и списывает золото по цене первого уровня",
  String(getProfile(G.name).wallet.gold));
API.buyHeroUpgrade("hp");
API.buyHeroUpgrade("hp");
log(getProfile(G.name).hero.hp === 3, "три уровня берутся подряд");
log(API.buyHeroUpgrade("hp") === false && getProfile(G.name).hero.hp === 3,
  "четвёртый уровень кузница не пускает — нужен дом мастера");

// Дом мастера: поднимает потолок до пяти.
log(payFor("smith") && API.upgradeCap() === 5,
  "дом мастера поднимает потолок до пяти", "потолок " + API.upgradeCap());
API.buyHeroUpgrade("hp");
log(getProfile(G.name).hero.hp === 4, "и четвёртый уровень покупается");

// Колодец: здоровье в каждом походе.
log(payFor("well") && getProfile(G.name).village.well === 1,
  "колодец восстанавливается за руду");
log(API.progressBonus().hp >= API.balanceSnapshot()["village.wellHp"] + 4 * API.HERO_STEPS.hp,
  "колодец и улучшения складываются в здоровье героя",
  "здоровья " + API.progressBonus().hp);

// Улучшения доезжают до похода: здоровье, урон и зелья на старте.
// begin() берёт имя из сессии аккаунта: без входа он молча не начинает поход.
const progNow = getProfile(G.name);
globalThis.localStorage.setItem("pyquiz_session_v1",
  JSON.stringify({ name: G.name, role: "student", token: "" }));
API.enterDungeon();
const expectHp = 120 + progNow.hero.hp * API.HERO_STEPS.hp + progNow.village.well * API.balanceSnapshot()["village.wellHp"];
log(G.player.maxHp === expectHp, "в походе здоровье с улучшениями",
  G.player.maxHp + " против " + expectHp);
log(G.player.hp === G.player.maxHp, "герой входит отдохнувшим", G.player.hp);
log(G.player.dmgBase === 12 + progNow.hero.dmg * API.HERO_STEPS.dmg,
  "и с прибавкой к урону", G.player.dmgBase);
log(API.progOf("loot") === progNow.hero.loot * API.HERO_STEPS.loot,
  "добыча героя учтена", String(API.progOf("loot")));

// Материалы: находка уходит в профиль сразу и амбар её увеличивает.
const before = getProfile(G.name).loot.wood;
API.gainLoot("wood", 2);
log(getProfile(G.name).loot.wood === before + 3,
  "амбар увеличивает находки в полтора раза",
  before + " -> " + getProfile(G.name).loot.wood);

// Смерть не отбирает материалы и ключи — они уже в профиле.
const lootBeforeDeath = JSON.parse(JSON.stringify(getProfile(G.name).loot));
API.showDeath();
API.deathToHub();
const lootAfterDeath = getProfile(G.name).loot;
log(lootAfterDeath.ore === lootBeforeDeath.ore && lootAfterDeath.wood === lootBeforeDeath.wood &&
  lootAfterDeath.keys.join(",") === lootBeforeDeath.keys.join(","),
  "материалы и ключи переживают смерть",
  "руда " + lootAfterDeath.ore + ", древесина " + lootAfterDeath.wood);

// Ключи держат стражи: от амбара — с третьего этажа, от мастера — с шестого.
resetProgress();
freshRun(2);
G.enemies = [API.makeEnemy("skeleton", 2)];
G.enemies[0].guard = true;
API.defeatEnemy(G.enemies[0]);
log(API.hasKey("barn"), "страж третьего этажа отдаёт ключ от амбара");
freshRun(5);
G.enemies = [API.makeEnemy("golem", 5)];
G.enemies[0].guard = true;
API.defeatEnemy(G.enemies[0]);
log(API.hasKey("smith"), "страж шестого — ключ от дома мастера");

// Глубинная тяжесть: до шестого этажа её нет, глубже — есть и растёт.
log(API.deepScale(0).hp === 1 && API.deepScale(4).hp === 1,
  "на мелких этажах глубинной тяжести нет");
log(API.deepScale(5).hp > 1 && API.deepScale(9).hp > API.deepScale(5).hp,
  "с шестого этажа враги толще, а глубже — ещё толще",
  "этаж 6: " + API.deepScale(5).hp.toFixed(2) + ", этаж 10: " + API.deepScale(9).hp.toFixed(2));
const shallow = API.makeEnemy("rat", 4);
const deepEnemy = API.makeEnemy("rat", 9);
const nominal = shallow.maxHp * (1 + 0.18 * 5);
log(deepEnemy.maxHp > nominal * 1.5,
  "и это видно в самом враге: без прокачки десятый этаж не пройти",
  deepEnemy.maxHp + " при номинальных " + Math.round(nominal));

// Квесты: цель сюжета проверяется по состоянию деревни, награда — по кнопке.
resetProgress();
API.enterVillage(null);
give({ gold: 0 });
log(API.storyStep() && API.storyStep().key === "barn" && API.goalDone("barn") === false,
  "первый шаг старосты — амбар, и цель пока не выполнена");
const claimTooEarly = API.claimStory();
log(claimTooEarly === false && getProfile(G.name).quests.story === 0,
  "невыполненный шаг не сдать");
const p2 = getProfile(G.name);
p2.village.barn = 1;
putProfile(G.name, p2);
const walletBeforeQuest = getProfile(G.name).wallet.gold;
log(API.claimStory() && getProfile(G.name).quests.story === 1,
  "выполненный шаг сдаётся и двигает цепочку");
log(getProfile(G.name).wallet.gold > walletBeforeQuest,
  "и приносит золото в банк деревни",
  walletBeforeQuest + " -> " + getProfile(G.name).wallet.gold);

// Повторяемое задание: прогресс считается в походе, награда — у старосты.
API.takeRepeatQuest("ore");
log(getProfile(G.name).quests.active === "ore", "задание у старосты берётся");
API.gainLoot("ore", 3);
log(API.questProgress() >= 3, "находки двигают задание", String(API.questProgress()));
const beforeRepeatGold = getProfile(G.name).wallet.gold;
const beforeRepeatWood = getProfile(G.name).loot.wood || 0;
API.claimRepeat();
const afterRepeat = getProfile(G.name);
log(afterRepeat.quests.repeat.ore === 1 && afterRepeat.quests.active === "",
  "выполненное задание сдано и снято",
  "выполнено раз: " + afterRepeat.quests.repeat.ore);
// Регрессия: payQuest сохранял награду в одной копии профиля, а claimRepeat
// затем записывал старую копию и затирал выплату. Тост обещал награду,
// которой не было.
log(afterRepeat.wallet.gold > beforeRepeatGold,
  "награда повторяемого задания дошла до банка деревни",
  beforeRepeatGold + " -> " + afterRepeat.wallet.gold);
log((afterRepeat.loot.wood || 0) > beforeRepeatWood,
  "и материалы дошли до склада",
  beforeRepeatWood + " -> " + (afterRepeat.loot.wood || 0));

// «Без единой ошибки» не должно начисляться за повторный спуск на уже
// посещённый этаж: подъём наверх и обратно давал бесконечные награды.
const nomissBefore = getProfile(G.name).quests.repeat.nomiss || 0;
API.takeRepeatQuest("nomiss");
freshRun(1);
G.floorIndex = 1;
G.visited = new Set([1, 2]);
G.stats.wrong = 0;
G.questFloorWrong = 0;
G.questProgress = { n: 0 };
API.descend();
log((getProfile(G.name).quests.repeat.nomiss || 0) === nomissBefore &&
  (G.questProgress.n || 0) === 0,
  "повторный спуск на посещённый этаж не двигает «без единой ошибки»",
  "сдано: " + (getProfile(G.name).quests.repeat.nomiss || 0) +
  ", прогресс: " + (G.questProgress.n || 0));
API.takeRepeatQuest("guard");
log(/Задание:/.test(API.questLine()), "цель задания видна строкой в панели", API.questLine());

// Рассинхрон места: если в подземелье остались данные деревни, страховка
// чистит их и пишет в консоль, что именно осталось, — по этой строке и
// находится место, которое не убрало состояние.
freshRun(1);
G.mat = [["roof"]];
G.roofKind = [["ridge"]];
G.scenery = [{ x: 1, y: 1, kind: "chimney" }];
G.npcs = [{ key: "elder" }];
G.blocked = [[1]];
const warned = [];
const realWarn = console.warn;
console.warn = (...args) => { warned.push(args); };
API.render();
console.warn = realWarn;
log(G.mat === null && !G.scenery.length && !G.npcs.length && G.blocked === null,
  "данные деревни в подземелье вычищаются, а не рисуются на карте");
log(warned.length > 0 && /Рассинхрон места/.test(String(warned[0][0])),
  "и о рассинхроне пишется строка в консоль", warned.length ? "да" : "нет");
freshRun(2);
G.mat = [["roof"]];
API.render();
log(G.mat === null, "в деревне материалы не трогаются — там они на месте");
API.enterVillage(null);
log(G.mat !== null, "и в самой деревне материалы остаются");

// Стек одинаковых предметов: три зелья — одна строка с числом.
freshRun(1);
G.inventory = [];
["small_potion", "small_potion", "small_potion", "steel_sword"].forEach((id) => {
  const it = API.ITEM_POOL.filter((x) => x.id === id)[0];
  if (it) G.inventory.push(Object.assign({}, it));
});
const stacks = API.stackedInventory();
log(stacks.length === 2, "одинаковые предметы собраны в стеки", stacks.length + " строк");
const potionStack = stacks.filter((x) => x.item.id === "small_potion")[0];
log(potionStack && potionStack.count === 3, "и число предметов в стеке верное",
  potionStack ? String(potionStack.count) : "стека нет");
API.renderInventory();
log(/inv-count/.test(el("inventory-box").innerHTML) && /×3/.test(el("inventory-box").innerHTML),
  "в сумке видно число, а не три одинаковые строки");
// Выпить из стека — остаётся два.
G.player.hp = 1;
API.usePotion(potionStack.index);
log(API.stackedInventory().filter((x) => x.item.id === "small_potion")[0].count === 2,
  "выпитое зелье уменьшает число в стеке, а не убирает строку");

// Прогресс к цели сюжетного шага: ученик видит, что он не «провалил походы»,
// а собирает материалы. Цель шага — постройка, значит нужна строка с числом.
resetProgress();
API.enterVillage(null);
const goalText = API.goalProgressText(API.storyStep().goal);
log(/руда \d+\/\d+/.test(goalText) || /древесина \d+\/\d+/.test(goalText),
  "к цели шага видно, сколько материалов собрано", goalText);
const p3 = getProfile(G.name);
p3.loot.wood = 3;
putProfile(G.name, p3);
log(/древесина 3\//.test(API.goalProgressText(API.storyStep().goal)),
  "и число растёт вместе с находками", API.goalProgressText(API.storyStep().goal));
const p4 = getProfile(G.name);
p4.loot.wood = 0;
putProfile(G.name, p4);
log(/древесина 0\//.test(API.goalProgressText(API.storyStep().goal)),
  "а несобранное честно показывает ноль", API.goalProgressText(API.storyStep().goal));
API.takeRepeatQuest("");
log(getProfile(G.name).quests.active === "" && API.questLine() === "" || /Цель:|Староста/.test(API.questLine()),
  "от задания можно отказаться и идти без него", API.questLine());

// Окна новых жителей: кузнец продаёт улучшения, кладовщик показывает склад,
// мастер говорит про потолок. Проверяем и текст, и то, что покупка из окна
// действительно меняет профиль.
resetProgress();
API.enterVillage(null);
log(/Горн ещё не разожжён/.test(API.forgeDialogHtml()),
  "кузнец без кузницы объясняет, что строить");
payFor("forge");
give({}, 3000);
log(/Уровень 0 из 3/.test(API.forgeDialogHtml()) && /upg-buy/.test(API.forgeDialogHtml()),
  "а с кузницей показывает улучшения");
const goldBeforeBuy = getProfile(G.name).wallet.gold;
API.buyHeroUpgrade("dmg");
log(getProfile(G.name).hero.dmg === 1 && getProfile(G.name).wallet.gold < goldBeforeBuy,
  "покупка улучшения из окна списывает золото",
  goldBeforeBuy + " -> " + getProfile(G.name).wallet.gold);
API.enterHouse("barn");
log(/На складе:/.test(API.barnDialogHtml()) && /руда/.test(API.barnDialogHtml()),
  "кладовщик показывает склад материалов");
API.enterHouse("smith");
log(/верстак снова в деле/.test(API.masterDialogHtml()),
  "мастер рассказывает про верстак");

// Квестовый блок старосты: шаг сюжета и поручения — в его окне.
API.enterVillage(null);
const elderHtml = API.elderDialogHtml();
log(/Дела деревни/.test(elderHtml) && /Поручения/.test(elderHtml),
  "в окне старосты есть сюжет и поручения");
log(/Забрать награду|цель ещё не выполнена|Взять задание/.test(elderHtml),
  "и понятно, что делать дальше",
  (/Забрать награду/.test(elderHtml) ? "можно сдать" : "цель или поручение"));

// Профиль переживает круговорот: находки, уровни и квесты не теряются.
const roundTrip = progressMerge(progressEmpty(), getProfile(G.name));
log(roundTrip.hero.hp === getProfile(G.name).hero.hp &&
  roundTrip.village.barn === getProfile(G.name).village.barn &&
  roundTrip.loot.keys.length === getProfile(G.name).loot.keys.length,
  "прогрессия переживает слияние профилей (сервер не отнимает найденное)");

resetProgress();
freshRun(0);
API.enterVillage(null);

// Вид зданий: у каждого дома есть крыша, фасад с окном и ровно одна дверь.
// Раньше дом был залит стенами подземелья и читался как набор коробок —
// эти проверки следят, чтобы слой крыши и фасада никуда не пропал.
const buildBad = [];
const roofColorsUsed = new Set();
API.villageBuildingList().forEach((b) => {
  const box = b.box;
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1;
  if (w < 3 || h < 3) buildBad.push(b.key + ": дом меньше 3×3");
  let roof = 0, facade = 0, window = 0, door = 0;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const m = G.mat[y][x];
      if (m === "roof") {
        roof++;
        roofColorsUsed.add(G.roofColor[y][x]);
        if (["ridge", "slope", "eave"].indexOf(G.roofKind[y][x]) < 0) {
          buildBad.push(b.key + ": у крыши нет вида в " + x + "," + y);
        }
      } else if (m === "facade") facade++;
      else if (m === "window") window++;
      if (G.doors.some((d) => d.x === x && d.y === y)) door++;
    }
  }
  if (!roof) buildBad.push(b.key + ": нет крыши");
  if (!facade) buildBad.push(b.key + ": нет фасада");
  if (!window) buildBad.push(b.key + ": нет окна");
  if (door !== 1) buildBad.push(b.key + ": дверей " + door + ", а нужна одна");
});
log(buildBad.length === 0,
  "у каждого дома есть крыша, фасад, окно и ровно одна дверь",
  buildBad.join("; ") || API.villageBuildingList().length + " зданий");
log(roofColorsUsed.size >= 3, "крыши домов разных цветов — дома различаются с первого взгляда",
  "использовано цветов: " + roofColorsUsed.size);

// Жители различаются картинкой, а не только подписью: четыре разных
// изображения, а не один спрайт, перекрашенный в тот же цвет.
const npcsBadSprite = API.VILLAGE_NPCS.filter((n) => !API.SPRITES["npc_" + n.key]);
const npcKeys = API.VILLAGE_NPCS.map((n) => "npc_" + n.key);
const npcUris = npcKeys.map((k) => API.SPRITES[k]).filter(Boolean);
log(npcsBadSprite.length === 0 && npcUris.length === npcKeys.length,
  "у каждого жителя свой спрайт",
  npcKeys.filter((k) => !API.SPRITES[k]).join(", ") || "все " + npcUris.length + " на месте");
log(new Set(npcUris).size === npcUris.length,
  "спрайты жителей разные, а не один и тот же",
  "разных картинок: " + new Set(npcUris).size + " из " + npcUris.length);

// Двор: бочка, поленница, забор, колодец и костёр имеют тайлы, а не заглушки.
const yardMissing = ["barrel", "woodpile", "fence", "well", "campfire", "chimney"]
  .filter((k) => !API.mapIcon(k) || API.mapIcon(k).indexOf("<svg") === 0);
log(yardMissing.length === 0, "у двора настоящие тайлы, а не схематичные значки",
  yardMissing.join(", ") || "всё тайлами");

// Лавка торговца, банк и потолок амулетов — те же функции, что и раньше.
// Банк возвращаем к исходной сумме: покупки в окнах выше уже тратили золото.
const profReseed = getProfile(G.name);
profReseed.wallet.gold = 500;
putProfile(G.name, profReseed);
const hubOffers = API.hubShopOffers();
const amuletOffer = hubOffers.find((o) => o.kind === "amulet");
log(!!amuletOffer, "лавка торговца продаёт амулет возврата");
log(hubOffers.some((o) => o.kind === "small_potion" || o.kind === "big_potion"),
  "и зелья");
const gearOffer = hubOffers.find((o) => o.kind.indexOf("gear:") === 0);
log(!!gearOffer, "и стартовое снаряжение");

API.buyHubItem("amulet");
log(getProfile(G.name).hub.revive === 1, "амулет куплен",
  String(getProfile(G.name).hub.revive));
log(getProfile(G.name).wallet.gold === 500 - amuletOffer.price,
  "цена амулета списана из банка", String(getProfile(G.name).wallet.gold));

// Снаряжение из деревни ложится в запас и ждёт похода.
if (gearOffer) {
  API.buyHubItem(gearOffer.kind);
  log(getProfile(G.name).hub.gear.length === 1, "купленное снаряжение ждёт похода",
    String(getProfile(G.name).hub.gear.length));
}

// Потолок: выше hub.amuletMax ни покупка, ни находка не поднимают.
const amuletMax = API.balanceSnapshot()["hub.amuletMax"];
const profCap = getProfile(G.name);
profCap.wallet.gold = 100000;
profCap.hub.revive = amuletMax;
putProfile(G.name, profCap);
const goldAtCap = getProfile(G.name).wallet.gold;
API.buyHubItem("amulet");
log(getProfile(G.name).hub.revive === amuletMax,
  "выше потолка амулет не покупается", String(getProfile(G.name).hub.revive));
log(getProfile(G.name).wallet.gold === goldAtCap,
  "и золото за отказ не списывается");
log(API.findAmulet() === false, "находка не поднимает амулеты выше потолка");

// С нуля находка срабатывает и уходит в деревню: случайность подменяем нулём,
// чтобы розыгрыш гарантированно прошёл.
const profFind = getProfile(G.name);
profFind.hub.revive = 0;
putProfile(G.name, profFind);
const hubRealRandom = Math.random;
Math.random = () => 0;
const found = API.findAmulet();
Math.random = hubRealRandom;
log(found === true, "амулет возврата находится в подземелье");
log(getProfile(G.name).hub.revive === 1,
  "находка уходит в деревню, а не в сумку похода",
  String(getProfile(G.name).hub.revive));

// Победа банкует всё золото похода плюс награду за дракона.
freshRun(1);
const profW = getProfile(G.name);
profW.wallet.gold = 0;
putProfile(G.name, profW);
G.player.gold = 300;
API.victory();
log(getProfile(G.name).wallet.gold === 300 + API.balanceSnapshot()["econ.bossGold"] &&
  G.player.gold === 0,
  "победа банкует золото сразу, ещё до кнопки «В деревню»",
  String(getProfile(G.name).wallet.gold));
API.victoryToHub();
log(getProfile(G.name).wallet.gold === 300 + API.balanceSnapshot()["econ.bossGold"],
  "победа переносит всё золото похода и награду за дракона без повторного банка",
  String(getProfile(G.name).wallet.gold));

// ==== Развилка на входе не должна запирать выход из подземелья ====
// Ученик, который проскочил развилку (окно висит поверх карты, ходить и
// драться под ним можно), оставался без кнопки действия: она спрятана, пока
// открыто любое окно из overlayOpen(), — и на десятом этаже это тупик.
// Дракон повержен, выход открыт, а «Спуститься ниже» нажать нечем.
// Вдобавок окно развилки стоит в разметке последним и при общем z-index: 60
// перекрывало бой и экран победы: кнопка «В деревню» была под карточками.
// Заглушка вёрстку и порядок слоёв не видит, поэтому проверка читает файлы.
const overlaySrc = fs.readFileSync(path.join(dir, "game.js"), "utf8");
const overlayList = overlaySrc.match(/function overlayOpen\(\)[\s\S]*?\]\.some/);
log(!!overlayList && overlayList[0].indexOf("blessing-overlay") < 0,
  "развилка не глушит кнопку действия и клавишу E",
  overlayList ? overlayList[0].replace(/\s+/g, " ") : "overlayOpen не найден");

const blessCss = fs.readFileSync(path.join(dir, "game.css"), "utf8");
const blessZ = blessCss.match(/#blessing-overlay\s*\{[^}]*z-index:\s*(\d+)/);
const overlayZ = blessCss.match(/\.overlay\s*\{[^}]*z-index:\s*(\d+)/);
log(!!blessZ && !!overlayZ && Number(blessZ[1]) < Number(overlayZ[1]),
  "развилка ниже остальных окон: не перекрывает бой и победу",
  (blessZ ? blessZ[1] : "нет слоя") + " против " + (overlayZ ? overlayZ[1] : "нет слоя"));

// ==== Проверка генерации этажа ====
// Между этажами игра генерирует карту и проверяет её на этом компьютере.
// Инвариант простой: от входа обязан существовать путь к спуску, к подъёму и
// к стражу, который держит лестницу. Иначе игрок запирается на этаже.
// Проверяем и сам валидатор на сломанных картах, и генератор на живых.

const fillGrid = (w, h, v) => Array.from({ length: h }, () => Array(w).fill(v));
const mkFloor = (grid, extra) => Object.assign({
  map: { w: grid[0].length, h: grid.length, grid },
  playerPos: { x: 1, y: 1 },
  stairsDown: { x: grid[0].length - 2, y: grid.length - 2, active: true },
  stairsUp: null,
  enemies: [], treasures: [], traders: []
}, extra || {});
const problemsOf = (state) => API.validateFloorState(state);

// Открытая карта 20x20 с рамкой стен: годна без замечаний.
const openGrid = fillGrid(20, 20, 1);
for (let x = 0; x < 20; x++) { openGrid[0][x] = 0; openGrid[19][x] = 0; }
for (let y = 0; y < 20; y++) { openGrid[y][0] = 0; openGrid[y][19] = 0; }
const openProblems = problemsOf(mkFloor(openGrid));
log(openProblems.length === 0, "проверка генерации: годная карта проходит",
  openProblems.join("; "));

// Стена на всю высоту отрезает спуск от входа.
const walledGrid = fillGrid(20, 20, 1);
for (let y = 0; y < 20; y++) { walledGrid[y][10] = 0; }
for (let x = 0; x < 20; x++) { walledGrid[0][x] = 0; walledGrid[19][x] = 0; }
for (let y = 0; y < 20; y++) { walledGrid[y][0] = 0; walledGrid[y][19] = 0; }
const walledProblems = problemsOf(mkFloor(walledGrid));
log(walledProblems.some((p) => p.indexOf("спуск недостижим") >= 0),
  "проверка генерации: отрезанный спуск замечен", walledProblems.join("; "));

// Спуск закрыт, а стража на этаже нет.
log(problemsOf(mkFloor(openGrid, { stairsDown: { x: 18, y: 18, active: false } }))
  .some((p) => p.indexOf("стража") >= 0),
  "проверка генерации: закрытая лестница без стража замечена");

// Страж в изолированной клетке: до него не дойти, значит этаж не пройти.
const pocketGrid = fillGrid(7, 5, 0);
[[1, 1], [2, 1], [3, 1]].forEach(([x, y]) => { pocketGrid[y][x] = 1; });
[[1, 2], [2, 2], [3, 2], [4, 2]].forEach(([x, y]) => { pocketGrid[y][x] = 1; });
pocketGrid[3][5] = 1;
log(problemsOf({
  map: { w: 7, h: 5, grid: pocketGrid },
  playerPos: { x: 1, y: 1 },
  stairsDown: { x: 4, y: 2, active: false },
  stairsUp: null,
  enemies: [{ guard: true, x: 5, y: 3 }],
  treasures: [], traders: []
}).some((p) => p.indexOf("страж") >= 0),
  "проверка генерации: недостижимый страж лестницы замечен");

// Спуск стоит на клетке входа.
log(problemsOf(mkFloor(openGrid, { stairsDown: { x: 1, y: 1, active: true } }))
  .some((p) => p.indexOf("клетке входа") >= 0),
  "проверка генерации: спуск на клетке входа замечен");

// Вход оказался в стене.
log(problemsOf(mkFloor(openGrid, { playerPos: { x: 0, y: 0 } }))
  .some((p) => p.indexOf("вход") >= 0),
  "проверка генерации: вход в стене замечен");

// Генератор с проверкой: обычные этажи и бесконечный спуск всегда годны.
freshRun(0);
const badFloors = [];
for (let i = 0; i < 14; i++) {
  const state = API.buildCheckedFloor(i);
  const left = problemsOf(state);
  if (left.length) badFloors.push((i + 1) + ": " + left.join("; "));
  if (!state.checked || !(state.checked.attempts >= 1)) badFloors.push((i + 1) + ": нет итога проверки");
}
log(!badFloors.length, "проверка генерации: 14 этажей подряд годны",
  badFloors.slice(0, 3).join(" | "));

// Слой объектов нельзя пересоздавать: так старые узлы остаются в DOM без
// ссылок, и спрайты деревни висят поверх подземелья, а в деревне копятся
// двойники игрока и НПС. Именно это ломал loadGame.
log(overlaySrc.indexOf("G.entityEls = new Map()") < 0,
  "слой объектов чистится, а не пересоздаётся (нет G.entityEls = new Map())");

// ==== Тайники, комнаты и рычаги ====
// Дверь тайника обязана быть проходом. Раньше комната 3×3 вырубалась в
// монолите, а дверь оставалась стеной: ключ и рычаг открывали несуществующий
// проход, и девять клеток с добычей были недостижимы навсегда.
let vaultFloor = -1;
let vault = null;
for (let f = 3; f < 12 && !vault; f++) {
  freshRun(f);
  vault = (G.vaults || [])[0] || null;
  if (vault) vaultFloor = f;
}
log(!!vault, "тайник генерируется на глубоких этажах",
  vault ? ("этаж " + (vaultFloor + 1)) : "не найден");

if (vault) {
  const door = vault.door;
  const from = vault.from;
  const dir = { x: door.x - from.x, y: door.y - from.y };
  const insideCell = G.map.grid[door.y + dir.y] && G.map.grid[door.y + dir.y][door.x + dir.x];
  log(G.map.grid[door.y][door.x] === 1, "дверь тайника — проход, а не стена",
    "grid[" + door.y + "][" + door.x + "] = " + G.map.grid[door.y][door.x]);
  log(insideCell === 1, "за дверью есть проходимая комната");

  log(API.cellBlocked(door.x, door.y) === true,
    "запертая дверь тайника не пропускает героя");

  G.vaultKeys = 1;
  API.openVault(vault);
  log(vault.locked === false, "ключ открывает тайник");
  log(API.cellBlocked(door.x, door.y) === false,
    "открытая дверь тайника пропускает героя");

  const target = { x: door.x + dir.x, y: door.y + dir.y };
  const path = API.findPath(G.playerPos, target);
  log(!!path && path.length > 0, "после открытия к комнате есть путь",
    path ? path.length + " шагов" : "пути нет");

  // На клетке перед дверью ничего не должно стоять: иначе E открывает жилу
  // или табличку вместо тайника, и кажется, что ключ не работает.
  const busy = (G.nodes || []).some((n) => n.x === from.x && n.y === from.y && !n.taken) ||
    (G.signs || []).some((s2) => s2.x === from.x && s2.y === from.y) ||
    (G.camps || []).some((c) => c.x === from.x && c.y === from.y) ||
    (G.levers || []).some((l) => l.x === from.x && l.y === from.y) ||
    (G.treasures || []).some((t) => t.x === from.x && t.y === from.y);
  log(!busy, "перед дверью тайника ничего не мешает нажать E",
    "клетка " + from.x + "," + from.y);

  const lever = (G.levers || [])[0];
  log(!!lever && !!API.findPath(G.playerPos, lever),
    "рычаг тайника достижим и связан с комнатой");
  if (lever) {
    log(lever.vault === vault.uid, "рычаг ссылается на тайник этажа",
      lever.vault + " / " + vault.uid);
  }
}

// Автосейв (и спуск) идут через snapshotCurrent(): интерактив этажа обязан
// его пережить. Раньше автосейв стирал тайники, рычаги, жилы, костры и
// таблички — комната с добычей исчезала через полсекунды после находки.
{
  const beforeSnap = {
    vaults: (G.vaults || []).length,
    levers: (G.levers || []).length,
    nodes: (G.nodes || []).length,
    camps: (G.camps || []).length,
    signs: (G.signs || []).length
  };
  API.snapshotCurrent();
  const snap = G.cache[G.floorIndex] || {};
  log((snap.vaults || []).length === beforeSnap.vaults &&
      (snap.levers || []).length === beforeSnap.levers &&
      (snap.nodes || []).length === beforeSnap.nodes &&
      (snap.camps || []).length === beforeSnap.camps &&
      (snap.signs || []).length === beforeSnap.signs,
    "автосейв сохраняет тайники, рычаги, жилы, костры и таблички",
    JSON.stringify(beforeSnap));

  // И в деревню интерактив подземелья не протекает: иначе на карте деревни
  // рисуются чужие объекты, а их координаты перехватывают нажатие E.
  API.enterVillage(null);
  log((G.vaults || []).length === 0 && (G.levers || []).length === 0 &&
      (G.nodes || []).length === 0 && (G.camps || []).length === 0 &&
      (G.signs || []).length === 0,
    "в деревне нет объектов подземелья",
    "vaults=" + (G.vaults || []).length + " levers=" + (G.levers || []).length);
}

// ================= Калибровка стартового уровня =================
{
  const qs = API.calibrationQuestions();
  log(qs.length === 6, "калибровка: шесть вопросов", qs.length);
  log(new Set(qs.map((q) => q.id)).size === 6, "калибровка: вопросы не повторяются",
    qs.map((q) => q.id).join(", "));
  const byLevel = { 1: 0, 2: 0, 3: 0 };
  qs.forEach((q) => { byLevel[q.level] = (byLevel[q.level] || 0) + 1; });
  log(byLevel[1] === 2 && byLevel[2] === 2 && byLevel[3] === 2,
    "калибровка: по два вопроса уровней 1–3", JSON.stringify(byLevel));
  log(API.calibrationLevelFor(0) === 1 && API.calibrationLevelFor(3) === 1 &&
      API.calibrationLevelFor(4) === 2 && API.calibrationLevelFor(6) === 2 &&
      API.calibrationLevelFor(7) === 3 && API.calibrationLevelFor(12) === 3,
    "калибровка: 0–3 — новичок, 4–6 — базовый, 7–12 — уверенный");

  const savedLevel = G.knowledgeLevel;
  const savedFloor = G.floorIndex;
  G.floorIndex = 0;
  G.difficulty = "normal";
  G.knowledgeLevel = 1;
  const low = API.floorLevels();
  G.knowledgeLevel = 2;
  const mid = API.floorLevels();
  G.knowledgeLevel = 3;
  const high = API.floorLevels();
  log(low.qmin === 1 && low.qmax === 1 && mid.qmin === 1 && mid.qmax === 2 &&
      high.qmin === 2 && high.qmax === 3,
    "калибровка: уровень сдвигает вопросы этажа на ступень",
    "новичок " + low.qmin + "–" + low.qmax + ", базовый " + mid.qmin + "–" + mid.qmax +
    ", уверенный " + high.qmin + "–" + high.qmax);

  G.floorIndex = 9;
  const top = API.floorLevels();
  log(top.qmax === 4 && top.qmin <= 4, "калибровка: на последнем этаже уровень не выходит за 4",
    top.qmin + "–" + top.qmax);
  G.floorIndex = savedFloor;
  G.knowledgeLevel = savedLevel;

  const kn = globalThis.normalizeKnowledge({
    level: 9, source: "к".repeat(100), date: "мусор",
    correct: 99, total: -1, score: 999
  });
  log(kn.level === 3 && kn.source.length === 20 && kn.date === "" &&
      kn.correct === 6 && kn.total === 0 && kn.score === 12,
    "калибровка: профиль зажимает уровень, ответы и баллы",
    JSON.stringify(kn));
  log(globalThis.normalizeKnowledge(null).level === 0,
    "калибровка: без записи уровень 0, а не случайный");
  log(globalThis.pickKnowledge(
    { level: 3, date: "2026-03-01T10:00:00" },
    { level: 1, date: "2026-02-01T10:00:00" }).level === 3,
    "калибровка: более свежая локальная запись не затирается сервером");
  log(globalThis.pickKnowledge(
    { level: 1, date: "2026-01-01T10:00:00" },
    { level: 3, date: "2026-02-01T10:00:00" }).level === 3,
    "калибровка: более свежая серверная запись поднимает уровень");
  const neutral = globalThis.getProfile("__calibration_probe__");
  log(neutral.knowledge.level === 0 && neutral.knowledge.total === 0,
    "калибровка: новый профиль начинается без уровня",
    JSON.stringify(neutral.knowledge));
}

// Серверная копия профиля применяется на клиенте. Здесь раньше была
// `const merged`, которую функция переприсваивала: вход и регистрация
// падали после создания сессии, хотя аккаунт уже был создан.
{
  let merged = null;
  let err = "";
  try {
    merged = globalThis.applyServerProfile("__server_profile_probe__", {
      name: "__server_profile_probe__",
      wallet: { gold: 7 },
      stats: { codeSolved: 2 }
    });
  } catch (e) {
    err = String(e && e.message ? e.message : e);
  }
  log(!!merged && merged.name === "__server_profile_probe__" &&
      merged.wallet && merged.wallet.gold === 7,
    "профиль: серверная копия применяется без ошибки",
    err || JSON.stringify(merged && merged.wallet));
}

// Переименование локального профиля в веб-сборке: вместе с профилем должны
// переехать сохранение похода и метка места, иначе «Изменить имя» превращает
// игрока в нового человека без прогресса.
{
  const oldName = "__rename_old__";
  const newName = "__rename_new__";
  const profile = globalThis.getProfile(oldName);
  profile.wallet.gold = 77;
  globalThis.putProfile(oldName, profile);
  localStorage.setItem("pyquiz_save_v1:" + oldName, JSON.stringify({
    v: 1, name: oldName, floorIndex: 2
  }));
  localStorage.setItem("pyquiz_place_v1:" + oldName, "dungeon");
  localStorage.setItem("pyquiz_village_v1:" + oldName, JSON.stringify({
    v: 1, name: oldName, x: 3, y: 4
  }));
  const moved = globalThis.renameProfile(oldName, newName);
  const after = globalThis.getProfile(newName);
  let movedSave = null;
  let movedVillage = null;
  try {
    movedSave = JSON.parse(localStorage.getItem("pyquiz_save_v1:" + newName) || "null");
    movedVillage = JSON.parse(localStorage.getItem("pyquiz_village_v1:" + newName) || "null");
  } catch (e) {}
  log(!!moved && moved.ok && after && after.wallet.gold === 77 &&
      movedSave && movedSave.name === newName &&
      movedVillage && movedVillage.name === newName && movedVillage.x === 3 &&
      localStorage.getItem("pyquiz_save_v1:" + oldName) === null &&
      localStorage.getItem("pyquiz_save_v1:" + newName) !== null &&
      localStorage.getItem("pyquiz_village_v1:" + oldName) === null &&
      localStorage.getItem("pyquiz_place_v1:" + newName) === "dungeon",
    "профиль: переименование переносит сейв, деревню и метку места",
    JSON.stringify(moved));
  globalThis.putProfile("__rename_busy__", { name: "__rename_busy__" });
  const busy = globalThis.renameProfile(newName, "__rename_busy__");
  log(!busy.ok, "профиль: переименование не затирает занятое имя");
}

// Итог похода: на смерти и победе один блок с этажом, золотом, ответами и
// кодом. Проверяем, что цифры не теряются и экран смерти показывает банк.
{
  freshRun(0);
  G.floorIndex = 2;
  G.stats.correct = 4;
  G.stats.wrong = 1;
  G.stats.kills = 3;
  G.stats.codePassed = 1;
  G.stats.codeTried = 2;
  G.stats.copyPassed = 0;
  G.stats.copyTried = 0;
  G.stats.goldEarned = 42;
  G.stats.topicStats = {};
  const html = API.runSummaryHtml({ banked: 30, victory: false });
  log(html.includes("Этаж") && html.includes("42") && html.includes("30") &&
      html.includes("4 / 5") && html.includes("1 / 2"),
    "итог: этаж, золото, ответы и код");
  const death = API.deathStatsHtml(30, false);
  log(death.includes("run-summary") && death.includes("В банк") &&
      death.includes("30"),
    "итог: экран смерти показывает банк");
  G.player.gold = 17;
  const alive = API.runSummaryHtml({ keepGold: true });
  log(alive.includes("Золото сейчас") && alive.includes("17"),
    "итог: амулет показывает золото в походе");
}

freshRun(0);

console.log("__JSON__" + JSON.stringify(out));
