# Этап 0–1: генератор «хребет + ветки»

Рабочий план реализации. Основан на `docs/LEVEL_DESIGN.md`, разделы 4–5.
Это разбивка на задачи, сигнатуры и проверки.

Статус: этап 1 завершён. `GEN_V2 = true` для обычных этажей,
`CAMPAIGN_V2 = false`: основная игра идёт по десяти этажам, 15 — за
флагом. В коде есть таблицы, контент `_V1/_V2`, `campaign` в сейве,
генератор v2, валидатор, 1500 карт в проверках и 5 автоматических
прогонов кампании. Открыто: плейтест человеком и этап 2 (контент по ролям).

## 1. Цель этапа

Заменить «линию из комнат» на управляемый граф:

- у этажа есть хребет (обязательный путь) и ветки (необязательные);
- у каждой комнаты есть роль;
- доли обязательного и необязательного совпадают с проектом;
- старый генератор остаётся фолбэком;
- всё проверяется до включения игрокам.

Этап не добавляет биомные правила и арены. Он даёт каркас, на который
этапы 2–4 навешивают наполнение, биомы и боссов.

Кампания на 15 этажей собирается в этом же этапе, но остаётся за
отдельным флагом `CAMPAIGN_V2`: основная игра продолжает идти по
десяти этажам, пока не готовы тексты и миграция сохранений.

## 2. Что уже есть

Текущий конвейер:

```
buildCheckedFloor(index)
  └─ createFloorState(index)
       └─ generateMap(w, h, floorIdx)      // комнаты + коридоры + декор
       └─ раскладка врагов/лута/ловушек по gen.spots
  └─ validateFloorState(state)             // связность, страж, тайник
  └─ до 8 попыток, затем repairFloorState()
```

Важные факты:

- `generateMap()` возвращает `{ grid, start, end, spots, decor }`.
- `createFloorState()` использует `gen.start`, `gen.end`, `gen.spots`,
  `gen.grid`, `gen.decor` и раскладывает содержимое по свободным клеткам.
- `state.map` — это `{ w, h, grid, decor }`; он целиком уходит в сохранение.
- `validateFloorState()` проверяет только то, что может запереть игрока:
  достижимость спуска, стража, тайника, рычага, минимальную площадь.
- `repairFloorState()` прорубает прямой коридор вход → спуск. Про роли
  он ничего не знает.
- `tools/game_harness.js` автоматически экспортирует все функции
  `game.js`, объявленные с отступом в два пробела (`^  function`),
  поэтому новые функции станут доступны проверкам без правки харнесса.
  Массивы `FLOORS_V1/V2` и контент `_V1/_V2` придётся добавить в
  список экспорта вручную.
- `tools/checks.js` был жёстко завязан на `FLOORS.length === 10`,
  `FLOOR_EPILOGUES.length === 10`, `FLOOR_EVENTS.length === 10`
  и на индексы этажей в нескольких десятках тестов. После этапа 0
  массивы разделены на `_V1`/`_V2`, а таблица этажей — на
  `FLOORS_V1`/`FLOORS_V2`.

## 3. Границы этапа

Входит:

- поля этажа для бюджета комнат;
- генератор графа и геометрии;
- роли комнат как данные;
- валидатор плана;
- флаг генератора `GEN_V2` и откат на старый генератор;
- таблица 15 этажей за отдельным флагом `CAMPAIGN_V2`;
- разделение массивов контента по версии кампании;
- аддитивное поле `campaign` в сохранении;
- тесты на 1500 карт (1000 v2 + 500 v1).

Не входит:

- раскладка врагов/лута по ролям (этап 2);
- биомные правила (этап 3);
- арены и фазы (этап 4);
- новые тексты, эпилоги, советы (этап 6): v2-массивы пока
  собираются из подходящих v1-записей;
- полная миграция прогресса v1 → v2;
- включение `CAMPAIGN_V2` по умолчанию.

## 4. Целевая модель данных

`generateFloorV2()` возвращает тот же контракт, что `generateMap()`,
плюс `plan`:

```js
{
  grid,          // number[h][w], 0/1
  decor,         // number[h][w], коды декора
  start, end,    // {x, y} — вход и лестница
  spots,         // [{x, y}] все проходимые клетки
  plan           // см. ниже
}
```

План:

```js
{
  version: 2,
  index, biome, campaign, seed,
  w, h, cw, ch,            // размеры карты и крупной сетки
  budget: {                // копия бюджета этажа на момент генерации
    roomTarget, optionalMin, optionalMax, minJunctions,
    eliteCap, vault, camp, hazardHallMax
  },
  rooms: [Room],
  edges: [Edge],
  spine: [roomId],         // порядок комнат на хребте
  entryId, gateId,
  stats: {
    rooms, spine, branch, optionalShare,
    junctions, roleCounts, pathLen, clearLen
  },
  warnings: []
}
```

Комната:

```js
{
  id, role,                // "entry" | "junction" | ...
  kind: "spine" | "branch",
  cell: { cx, cy },        // крупная клетка
  x, y, w, h,              // рамка в тайлах
  shape,                   // "rect" | "cave" | "cross" | "hall" | "island"
  cells: [{x, y}],         // точные клетки пола
  center: {x, y},
  spineIndex,              // -1 для ветки
  depth,                   // 0 для хребта, 1..3 для ветки
  stem,                    // id ветки-стебля, 0 для хребта
  exits: [{x, y, to}],     // после прокладки связей
  meta: {}                 // vault, rest, elite, island и т. п.
}
```

Связь:

```js
{
  a, b,                    // roomId
  kind: "spine" | "branch" | "loop",
  width: 1 | 2,
  cells: [{x, y}]          // клетки коридора
}
```

План **не сериализуется**. `state.map` остаётся `{ w, h, grid, decor }`,
поэтому формат сохранений не меняется. План живёт только на время
генерации и нужен этапу 2 для раскладки по ролям.

## 5. Новые и изменённые функции

Все — внутри IIFE `game.js`, с отступом в два пробела, чтобы харнесс
их увидел.

| Функция | Назначение |
|---|---|
| `genRng(seed)` | Детерминированный PRNG (mulberry32) |
| `genInt(rng, a, b)` | Целое в диапазоне |
| `genPick(rng, list)` | Случайный элемент |
| `genShuffle(rng, list)` | Перемешивание на локальном RNG |
| `genCoarse(w, h)` | Размеры крупной сетки |
| `genCellRect(cell)` | Рамка клетки крупной сетки в тайлах |
| `genCellKey(cell)` | Ключ клетки для Set/Map |
| `genCellDist(a, b)` | Манхэттенское расстояние между клетками |
| `genSideCells(side, cw, ch)` | Клетки одной стороны сетки |
| `genPickEnds(cw, ch, rng)` | Вход и врата на противоположных сторонах |
| `genShortestPath(entry, gate, cw, ch)` | Кратчайший путь по клеткам (BFS) |
| `genSpineWalk(...)` | DFS-обход для пути заданной длины |
| `genSpinePath(entry, gate, targetLen, cw, ch, rng)` | Самоизбегающий путь нужной длины |
| `genGrowBranches(spine, branchBudget, cw, ch, rng)` | Ветки-стебли и комнаты |
| `genAssignRoles(plan, f, index, rng)` | Роли по грамматике |
| `genCarve(plan, w, h, index, rng)` | Геометрия: комнаты, коридоры, декор |
| `genShapeFor(biome, rng)` | Форма комнаты по биому |
| `genRoomRect(cell, shape, rng)` | Рамка комнаты внутри клетки |
| `genCarveRoom(grid, room, rng)` | Вырезание формы комнаты |
| `genCarveCorridor(grid, a, b, width, w, h, rng)` | L-коридор |
| `genRoomCenter(room, grid)` | Центр комнаты на полу |
| `genCollectSpots(grid, w, h)` | Все проходимые клетки |
| `genDecorate(plan, grid, w, h, index, campaign, rng)` | Декор по кампании |
| `genAddLoops(plan, rng)` | 1–2 петли |
| `genPlanStats(plan)` | Доли, развилки, длины |
| `genPlanSignature(plan)` | Подпись для тестов детерминизма |
| `genBuildRooms(plan, spine, branches)` | Превращает клетки в объекты комнат |
| `genDefaultSeed(index)` | Сид по умолчанию |
| `genValidatePlan(plan, grid)` | Проверки плана, возвращает `string[]` |
| `generateFloorV2(f, index, opts)` | Главная точка входа |
| `createFloorState(index, opts)` | Получает `opts = {legacy, seed, forceV2}` |
| `buildFloors(biomes)` | Собирает таблицу этажей из описания биомов |
| `campaignVersion()` | Возвращает 1 или 2: сохранение важнее флага |
| `setCampaign(version)` | Переключает активную таблицу `FLOORS` |

Вспомогательные имена не должны пересекаться с существующими.
Проверить перед стартом: `grep -n "function gen" static/game.js`.

## 6. Алгоритм

### 6.1. Сид и детерминизм

```js
function genRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- По умолчанию `genDefaultSeed(index)` считает
  `(Date.now() ^ (index * 2654435761) ^ Math.random() * 1e9) >>> 0`.
- Тесты передают `{ seed }` и не зависят от времени.
- После выбора сида генератор **не использует** глобальные `rand`,
  `shuffle`, `Math.random`: иначе детерминизма не будет. `Math.random`
  допустим только в `genDefaultSeed`, вне генерации плана.
- `createFloorState` продолжает использовать `Math.random` для содержимого;
  это нормально, детерминизм нужен только плану.

### 6.2. Крупная сетка

- Клетка: `8×6` тайлов, отступ от края карты 2 тайла.
- `cw = floor((w - 4) / 8)`, `ch = floor((h - 4) / 6)`.

Сетка `7×5` с комнатами `4–6 × 3–4` давала пол 18–27% против
35–43% у старых карт: этажи выглядели пустыми. Клетка `8×6` и комнаты
`6–7 × 4–5` дают 23–40% и ближе к таблице 4.1 `docs/LEVEL_DESIGN.md`.

| Карта | cw × ch | Клеток | Цель комнат |
|---|---|---|---|
| 32×23 (v1) | 3×3 | 9 | 7 |
| 36×26 (v1) | 4×3 | 12 | 9 |
| 38×28 (v1) | 4×4 | 16 | 10 |
| 40×28 | 4×4 | 16 | 10–12 |
| 44×30 | 5×4 | 20 | 13–16 |
| 46×30 | 5×4 | 20 | 13–16 |
| 50×32 | 5×4 | 20 | 16–19 |
| 52×34 | 6×5 | 30 | 16–19 |
| 54×34 | 6×5 | 30 | 18–22 |
| 56×36 | 6×5 | 30 | 18–22 |

Комната занимает `6–7 × 4–5` тайлов внутри клетки, с зазором 1–2 тайла
с одной стороны. `hall` — `7×5`, `cross` — `6×5`, без слияния клеток.
На плотной карте 50×32 (17 комнат на 20 клеток) около 2% сидов
не добирают одну ветку; `buildCheckedFloor` пересоздаёт такой этаж,
а после 20 попыток уходит в legacy.

### 6.3. Хребет

1. Вход — клетка на случайной стороне. Врата — на противоположной
   половине, манхэттенское расстояние `>= max(4, floor((cw + ch) * 0.45))`.
2. Целевая длина хребта:

   ```js
   targetRooms = f.roomTarget;                       // из таблицы этажа
   optionalShare = f.optionalShare;                  // 0.30..0.45
   spineRooms = Math.round(targetRooms * (1 - optionalShare));
   ```

3. Самоизбегающий путь от входа до врат из `spineRooms` клеток
   (допуск ±1: длина пути имеет ту же чётность, что и манхэттенское
   расстояние). DFS со случайным порядком соседей, до 300 попыток.
   Если не вышло — кратчайший путь. Вставка «карманов» 2×2 до нужной
   длины — резерв на этапе 1.3, если отказов станет много.
   При выборе соседа — лёгкий приоритет клеткам дальше от края:
   без него хребет липнет к границе и ветки остаются с одной стороны.
4. Узловые комнаты: вход, врата и 2–4 равномерно выбранные точки пути
   (всего 4–6 узлов; на коротком v1-хребте — 3–4).
   Остальные комнаты хребта — проходные (`combat`, `crossing`,
   `hazard_hall`, `lore`).

Псевдокод:

```
path = [entry]
while length(path) < targetLen:
    next = random free neighbor of last, не на path
    if нет: backtrack
    path.push(next)
    if last == gate and length == targetLen: success
```

### 6.4. Ветки

- `branchRooms = targetRooms - spineRooms`.
- `stemCount = clamp(round(branchRooms / 2), 2, 6)`.
- Стебель растёт из свободного соседа случайной комнаты хребта
  (не вход, не врата), глубина 1–3.
- Сумма комнат по стеблям равна `branchRooms`; лишние сокращаются.
- Ветки не касаются друг друга и хребта, кроме точки крепления:
  иначе появятся случайные петли, которые сломают учёт обязательного пути.
  На уровне клеток допускается соседство входов двух веток: комната
  меньше клетки сетки, и сама по себе смежность прохода не создаёт.
- Если стебли вышли короче цели, генератор сначала удлиняет их до
  глубины 3, затем добавляет новые стебли (до шести). Из 10 попыток
  берётся раскладка с наибольшим числом комнат.
- Один стебель на этаж делается глубины 3, чтобы появлялись роли
  `elite`/`vault`; остальные распределяются по 1–2 комнаты.
- Если свободных клеток не хватает — уменьшить `branchRooms`
  и записать warning; валидатор решит, принимать ли этаж.

### 6.5. Роли

Хребет:

- `spine[0] = entry`;
- `spine[last] = gate`;
- 3–4 узла: `junction` и `combat` через один, минимум 2 `junction`;
- если у этажа есть среда — одна проходная комната `crossing`
  (лёд) или `hazard_hall` (лава, тьма);
- остальные — `combat` / `lore`;
- `gate` получает стража на этапе 2.

Ветки:

- глубина 1: `resource` | `lore` | `treasure`;
- глубина 2: `treasure` | `ambush` | `rest` | `secret`;
- глубина 3: `elite` | `vault` | `treasure` (редкий);
- лимиты: 1 `vault`, 1 `rest`, `f.eliteCap` элит, 2 `hazard_hall`,
  1 `secret`;
- хотя бы 1 `treasure` и 1 `resource` на этаж;
- `rest` только если `f.camp`, и не рядом с вратами;
- `vault` только если `f.vault`, и не на хребте;
- `rest` и `vault` гарантируются: если листьев не хватает, они могут
  занять промежуточную комнату ветки; лист всё равно остаётся
  наградой или риском.

Проверка развилки: у комнаты `junction` минимум два ребра, ведущие
в комнаты **разных** ролей. Если таких комнат меньше
`plan.budget.minJunctions` — план не принят.

Реализация идёт по хребту слева направо: если у развилки оба соседа
одной роли, правый меняется на `combat`/`lore`. Один проход не даёт
качелей, когда соседняя развилка смотрит на уже изменённую комнату.

### 6.6. Геометрия

1. Для каждой комнаты — рамка внутри клетки:

   ```js
   w = genInt(rng, 6, 7);
   h = genInt(rng, 4, 5);
   x = frame.x + genInt(rng, 0, Math.max(0, 8 - w - 1));
   y = frame.y + genInt(rng, 0, Math.max(0, 6 - h - 1));
   ```

   Значения зажимаются, чтобы комната не вылезла за клетку.

2. Форма:
   - `rect` — катакомбы, логово;
   - `cave` — пещеры: рамка минус 1–3 угла плюс 1–2 выступа;
   - `hall` — лёд: `w = 7`, `h = 5`;
   - `island` — демоны: рамка, вокруг которой позже ставится лава;
   - `cross` — катакомбы, иногда: `6×5` минус углы 2×2.

3. Коридоры: L-образные, ширина 1; на хребте катакомб и логова — 2.
   Поворот пока просто L-излом; площадка 3×3 появится на этапе 3
   вместе с составными залами. Коридор не длиннее 6 клеток
   без комнаты или поворота.

4. Выходы комнаты: клетка на границе комнаты, обращённая к коридору.
   Для каждой связи `edge` — один выход с каждой стороны.

5. Декор: `floorDecorMix(index, f.campaign)` по клеткам пола, кроме
   клеток выходов и центров комнат. Ролевой декор — этап 2.

### 6.7. Петли

- 1–2 дополнительные связи между соседними крупными клетками,
  которые уже заняты комнатами, но не соединены.
- Приоритет: ветка-лист → более ранняя комната хребта (срезка),
  затем две комнаты хребта.
- Запрещено: вход → врата напрямую.
- Петля не должна быть короче прямого пути на 40% и длиннее в 1.4 раза.

### 6.8. Статистика

- `pathLen` — BFS от входа до врат по готовой сетке.
- `clearLen` — жадный обход всех центров комнат (nearest neighbor).
- `optionalShare = branchRooms / rooms`.
- `junctions` — число комнат `junction` с 2+ выходами в разные роли.
- `roleCounts` — по ролям.
- `pathLen / clearLen` — целевой диапазон `0.55–0.65`
  (в валидаторе допуск `0.50–0.70`).

## 7. Валидатор

`genValidatePlan(plan, grid)` возвращает массив строк. Сетка нужна для
flood fill: по плану комнат нельзя доказать, что между ними есть проход.
`validateFloorState(state)` дополняется:

```js
if (state.plan) {
  for (const p of genValidatePlan(state.plan, state.map.grid)) problems.push(p);
}
```

Проверки:

1. `rooms` в диапазоне `plan.budget.roomTarget ± 2`.
2. `optionalShare` в `plan.budget.optionalMin..optionalMax`.
3. `junctions >= plan.budget.minJunctions`.
4. `entry` и `gate` существуют и стоят на своих ролях.
5. Все комнаты имеют клетки и достижимы от входа (flood fill по `grid`).
6. Врата достижимы без ключа.
7. `vault` не на хребте, дверь проходима, подход достижим.
8. `rest` не ближе 3 клеток к вратам.
9. Лимиты ролей: 1 `vault`, 1 `rest`, `plan.budget.eliteCap` элит,
   2 `hazard_hall`, 1 `secret`.
10. Каждый лист ветки — награда или риск, не пустой тупик.
11. Два `hazard_hall` не примыкают.
12. `pathLen / clearLen` в `0.50–0.70` — на этапе 1 это **warning**,
    а не отказ: ветки длинные, жёсткий порог после этапа 3.
13. Нет коридора длиннее 6 клеток без комнаты/поворота.
14. Арены (этап 4) — без боковых дверей.

Если проверки не прошли — существующий цикл `buildCheckedFloor`
пересоздаёт этаж. Для v2:

- `FLOOR_MAX_ATTEMPTS` поднимается с 8 до 20;
- после 20 неудач — **не** `repairFloorState`, а принудительный
  `createFloorState(index, { legacy: true })`;
- в `checked` пишется `fallback: "legacy"`, чтобы это было видно в логе;
- арены не в счёт: у них нет плана, они идут старым путём с 8 попытками.

`repairFloorState` для v2 не используется: он не знает ролей и сделает
план невалидным.

## 8. Интеграция

### 8.1. `createFloorState`

```js
function createFloorState(index, opts) {
  const f = floorDef(index);
  const o = opts || {};
  const useV2 = (o.forceV2 || GEN_V2) && !o.legacy && !f.boss;
  let gen;
  if (useV2) {
    try {
      gen = generateFloorV2(f, index, o);
    } catch (err) {
      console.warn("gen v2: откат на старый генератор", err);
      gen = generateMap(f.w, f.h, index, f.campaign);
    }
  } else {
    gen = generateMap(f.w, f.h, index, f.campaign);
  }
  const state = {
    ...
    plan: gen.plan || null,
    map: { w: f.w, h: f.h, grid: gen.grid, decor: gen.decor }
  };
  ...
}
```

`plan` — транзиентное поле. В `serializeFloor` его нет.

### 8.2. `buildCheckedFloor`

```js
const f = floorDef(index);
const v2 = GEN_V2 && !f.boss;   // арены пока идут через legacy
const tries = v2 ? 20 : FLOOR_MAX_ATTEMPTS;
for (let attempt = 1; attempt <= tries; attempt++) {
  const state = createFloorState(index);
  const problems = validateFloorState(state);
  if (!problems.length) { ... return state; }
  if (attempt === tries) {
    if (v2) {
      const legacy = createFloorState(index, { legacy: true });
      // План у legacy пуст, поэтому починка снова безопасна.
      if (validateFloorState(legacy).length) repairFloorState(legacy);
      legacy.checked = { attempts: attempt, problems, repaired: true,
                         fallback: "legacy" };
      return legacy;
    }
    repairFloorState(state);
    ...
  }
}
```

### 8.3. `validateFloorState`

Дописать в конец, перед `return problems`:

```js
if (state.plan) {
  for (const p of genValidatePlan(state.plan, state.map.grid)) problems.push(p);
}
```

### 8.4. Два флага

```js
let GEN_V2 = false;       // генератор «хребет + ветки»
let CAMPAIGN_V2 = false;  // кампания 15 этажей для новых забегов
```

Оба выключены по умолчанию. Это разные решения, и включаются они
независимо:

| Флаг | Что меняет | Чего не трогает |
|---|---|---|
| `GEN_V2` | геометрию обычных этажей активной кампании | арены (этап 4), тексты, сохранения |
| `CAMPAIGN_V2` | таблицу этажей для **нового** забега | уже начатый забег, старые сохранения |

`GEN_V2` можно включить и на десяти этажах: бюджеты лежат в полях
этажа, а не выводятся из версии кампании. `CAMPAIGN_V2` без `GEN_V2`
тоже допустим: 15 этажей со старым генератором.

`campaignVersion()` — единственное место, где решается версия:

```js
function campaignVersion() {
  if (G && G.campaign) return G.campaign; // 1 или 2 из сохранения
  return FLOORS === FLOORS_V2 ? 2 : 1;    // активная таблица
}
```

Новый забег выбирает таблицу по `CAMPAIGN_V2`, а `campaignVersion()`
показывает уже выбранную. Сохранение важнее флага: если игрок начал
десятиэтажный забег, включение `CAMPAIGN_V2` не переносит его на
седьмой этаж другой кампании.

Для отладки:

- URL `?gen=v2` включает генератор, `?gen=legacy` принудительно выключает;
- URL `?campaign=v2` включает 15 этажей для новых забегов, `?campaign=v1` — выключает;
- в дев-панели — оба переключателя, активная кампания, счётчик `attempts`
  и признак `fallback: "legacy"`.

### 8.5. Две таблицы этажей

`BIOMES` остаётся источником десяти этажей. Рядом появляется
`BIOMES_V2` — пять биомов по два обычных этажа и арена. Общий сборщик
не мутирует источники:

```js
function buildFloors(biomes, campaign) {
  const out = [];
  biomes.forEach((biome, bi) => {
    biome.floors.forEach((floor, fi) => {
      out.push(Object.assign({}, floor, {
        campaign,
        name: floor.name || biome.name, biome: biome.key, biomeName: biome.name,
        biomeIndex: bi, depth: fi + 1, theme: biome.theme, boss: false
      }));
    });
    out.push(Object.assign({}, biome.boss, {
      campaign,
      name: biome.boss.name, biome: biome.key, biomeName: biome.name,
      biomeIndex: bi, depth: biome.floors.length + 1, theme: biome.theme,
      boss: true, count: 0, bossHp: biome.boss.hp, pool: [biome.boss.key],
      bossKey: biome.boss.key, bossName: biome.boss.name,
      finalBoss: bi === biomes.length - 1
    }));
  });
  return out;
}

const FLOORS_V1 = buildFloors(BIOMES, 1);
const FLOORS_V2 = buildFloors(BIOMES_V2, 2);
let FLOORS = FLOORS_V1;

function setCampaign(version) {
  FLOORS = version === 2 ? FLOORS_V2 : FLOORS_V1;
}
```

`floorDef()` не меняется: он читает активный `FLOORS`, а бесконечный
спуск сам считает глубину от `FLOORS.length`. `setCampaign()` вызывается
один раз при старте нового забега или при загрузке сохранения, до
первого `floorDef()`.

Поля этажа, которые нужны генератору:

```js
{
  campaign, w, h, count, pool, qmin, qmax,
  roomTarget, optionalShare, minJunctions,
  eliteCap, vault, camp, hazardHallMax,
  boss, bossKey, bossName, finalBoss
}
```

Для v2 значения берутся из таблицы 3.2 и раздела 4.3
`docs/LEVEL_DESIGN.md`: `roomTarget` — середина диапазона,
`optionalShare` — 0,35 / 0,38 / 0,40 / 0,43, `minJunctions` — 2 / 3 / 3 / 4.

Для v1 бюджеты меньше, потому что карты 32×23…46×30:

| Карта | Клеток 8×6 | `roomTarget` | `optionalShare` | `minJunctions` |
|---|---|---|---|---|
| 32×23 | 9 | 7 | 0,30 | 2 |
| 36×26 | 12 | 9 | 0,33 | 2 |
| 38×28 | 16 | 10 | 0,35 | 2 |
| 40×28 | 16 | 10 | 0,35 | 2 |
| 44×30 | 20 | 12 | 0,35 | 3 |
| 46×30 | 20 | 12 | 0,35 | 3 |

`buildFloors` подставляет эти значения по размеру карты, если в
описании этажа их нет. Подстановка — отдельная `v1Budget(w, h)`,
она возвращает поля из таблицы. Поэтому v1-этажи не нужно переписывать
вручную, а v2-этажи задают бюджеты явно.

Остальные поля бюджета:

- `eliteCap` — 0 на первом этаже, иначе 1;
- `vault` — true с третьего этажа (как сейчас);
- `camp` — true со второго этажа (как сейчас);
- `hazardHallMax` — 2.

Для v2 эти поля задаются таблицей 3.2: тайник на 2, 4, 5, 7, 8, 10,
11, 13, 14; привал на 2, 5, 8, 11, 14; элиты — по колонке «Элиты».

### 8.6. Контент по версии кампании

Индексы этажей в v1 и v2 не совпадают: седьмой этаж v1 — «Обитель
демонов», а v2 — «Ледяные залы». Одни и те же массивы на обе кампании
оставлять нельзя.

В `static/dungeon-content.js`:

| v1 | v2 | Доступ |
|---|---|---|
| `FLOOR_EPILOGUES_V1` | `FLOOR_EPILOGUES_V2` | `floorEpilogue(index, campaign)` |
| `FLOOR_EVENTS_V1` | `FLOOR_EVENTS_V2` | `floorEvent(index, campaign)` |
| `FLOOR_ENTRANCE_TIPS_V1` | `FLOOR_ENTRANCE_TIPS_V2` | `floorTip(index, campaign)` |
| `FLOOR_HAZARD_V1` | `FLOOR_HAZARD_V2` | `floorHazard(index, campaign)` |

`campaign` — поле этажа (`f.campaign`), а не глобальный флаг: функции
контента остаются чистыми и тестируются на обеих таблицах. Второй
аргумент необязателен и по умолчанию равен 1, поэтому старые вызовы
не ломаются. Для бесконечного спуска после последнего этажа `cycleAt`
берёт массив той же кампании, а не общий `HAZARD_CYCLE`.

В `static/game.js` так же разделяется декор:

```js
const FLOOR_DECOR_MIX_V1 = [ /* текущие 10 наборов */ ];
const FLOOR_DECOR_MIX_V2 = [ /* 15 наборов */ ];
function floorDecorMix(floorIdx, campaign) { ... }
```

V2-массивы заполняются на этапе 0.2. Новые тексты не пишутся: сначала
туда копируются записи того же биома (обычные этажи — из двух v1-записей
биома, арена — из v1-записи босса), а на этапе 6 они заменяются
своими. Пока массив короче таблицы, доступ падает на `cycleAt()` и
пишет warning в консоль — это защита от недособранного контента,
а не норма.

### 8.7. Сохранение и миграция

В `buildSaveData()` добавляется одно поле:

```js
campaign: G.campaign || 1,
```

`G.campaign` выставляется при новом забеге из `campaignVersion()` и
при загрузке из сохранения:

```js
G.campaign = data.campaign === 2 ? 2 : 1;
setCampaign(G.campaign);
```

Правила:

- старый сейв без `campaign` — это v1, а не «неизвестно»;
- `v` сохранения не меняется: поле аддитивное, формат карт прежний;
- `CAMPAIGN_V2` не переписывает существующие сейвы;
- новый забег при `CAMPAIGN_V2 = false` всегда v1;
- начатый v2-забег продолжается, даже если флаг потом выключили:
  иначе игрок потерял бы поход;
- после победы или смерти `G.campaign` сбрасывается вместе с забегом.

Полноценная миграция «прогресс v1 → v2» не входит в этап 1. Она нужна,
только если включать 15 этажей по умолчанию для старых игроков.
До этого `CAMPAIGN_V2` остаётся выключенным.

## 9. Правки в других файлах

| Файл | Что |
|---|---|
| `static/game.js` | Генератор v2, роли, валидатор, два флага, `FLOORS_V1/V2`, `buildFloors`, `setCampaign`, декор по кампании |
| `static/dungeon-content.js` | Массивы `_V1`/`_V2` для эпилогов, событий, советов и среды; версия в аргументе |
| `tools/checks.js` | `FLOORS_V1.length === 10`, `FLOORS_V2.length === 15`, тесты обеих кампаний, аудит индексов |
| `tools/game_harness.js` | Экспортировать `FLOORS_V1`, `FLOORS_V2` и массивы контента; функции экспортируются автоматически |
| `run_all_checks.py` | Без правок, если тесты лежат в `checks.js` |
| `README.md`, `DESIGN.md`, `ITCH.md` | Позже, этап 6 |

Харнесс собирает `__api` один раз при загрузке, поэтому `FLOORS`
в нём навсегда указывает на стартовую таблицу. Тесты, которые
переключают кампанию, должны брать таблицу явно:

```js
const floorsOf = (campaign) => campaign === 2 ? API.FLOORS_V2 : API.FLOORS_V1;
const floorOf = (campaign, biome, depth) =>
  floorsOf(campaign).findIndex((f) => f.biome === biome && f.depth === depth);
```

`tools/checks.js` содержит десятки тестов с `createFloorState(4)`,
`createFloorState(6)`, `createFloorState(8)`. После перехода на 15 этажей
эти индексы означают другие биомы. Их нужно не «починить числом»,
а переписать на `floorOf(campaign, biome, depth)`.

Проверки вида `API.FLOORS.length === 10` заменяются на явные:

```js
log(API.FLOORS_V1.length === 10, "v1: 10 этажей", API.FLOORS_V1.length);
log(API.FLOORS_V2.length === 15, "v2: 15 этажей", API.FLOORS_V2.length);
```


## 10. Тесты

### 10.1. Структурные (обе кампании)

Для v2 — 100 сидов на каждый из 10 обычных этажей (1000 карт).
Для v1 — 100 сидов на каждый из 5 обычных этажей (500 карт):
генератор должен работать и на старых маленьких картах 32×23…46×30.
Быстрый режим — 20 сидов, то есть 300 карт вместо 1500.

```js
function checkTable(campaign, seeds) {
  for (const [i, f] of floorsOf(campaign).entries()) {
    if (f.boss) continue;
    for (let seed = 0; seed < seeds; seed++) {
      const gen = API.generateFloorV2(f, i, { seed });
      const problems = API.genValidatePlan(gen.plan, gen.grid);
      log(problems.length === 0,
        `v${campaign} этаж ${i + 1}, сид ${seed}`, problems.join("; "));
    }
  }
}
checkTable(2, 100);
checkTable(1, 100);
```

Проверять:

- 0 проблем валидатора;
- `optionalShare` в диапазоне;
- `junctions >= f.minJunctions`;
- все комнаты достижимы;
- врата достижимы;
- `vault` не на хребте;
- `rest` не у врат;
- лимиты ролей.

### 10.2. Детерминизм

```js
const f = API.FLOORS_V2[0];
const a = API.genPlanSignature(API.generateFloorV2(f, 0, { seed: 42 }).plan);
const b = API.genPlanSignature(API.generateFloorV2(f, 0, { seed: 42 }).plan);
log(a === b, "один сид — один план");
```

### 10.3. Производительность

- 100 генераций подряд, замерить `performance.now()`.
- p95 < 50 мс, max < 120 мс.
- Отдельно — на самой большой карте 56×36.

### 10.4. Регрессия старого пути

- `createFloorState(i, { legacy: true })` для всех этажей обеих таблиц:
  старый генератор работает, `validateFloorState` проходит.
- `GEN_V2 = true` и 20 неудач: `buildCheckedFloor` возвращает legacy-этаж
  с `checked.fallback === "legacy"`, а не чинит план.
- `serializeFloor` / `deserializeFloor` для v2-этажа: карта, декор,
  враги, тайники, костры, ловушки, среда, `discovered` сохраняются.
- `plan` в сохранение не попадает: проверить, что в JSON нет `rooms`.

### 10.5. Визуальная проверка

- 5 схем этажей (по одному на биом) без тайлов, только комнаты и роли.
- 8 из 10 тестировщиков определяют биом по схеме — цель этапа 3,
  но уже на этапе 1 схемы должны различаться размером и рисунком.

### 10.6. Кампании и флаги

- Оба флага выключены: `campaignVersion() === 1`, играются 10 этажей,
  `floorDef` берёт `FLOORS_V1`.
- `CAMPAIGN_V2` включён: новый забег получает версию 2; `FLOORS_V2`
  содержит 15 этажей, арены стоят на индексах 2, 5, 8, 11, 14.
- `GEN_V2` включён, `CAMPAIGN_V2` выключен: 10 этажей, у обычных есть
  `state.plan`, у боссов — нет, арены идут через legacy.
- Оба включены: 15 этажей, 10 обычных генерируются v2, 5 арен — legacy
  до этапа 4.
- Старый сейв без `campaign` загружается как v1 даже при включённом
  `CAMPAIGN_V2`; `floorIndex` сохраняет прежний смысл.
- Начатый v2-сейв загружается как v2 даже при выключенном `CAMPAIGN_V2`.
- Новый сейв v2 содержит `campaign: 2`; после перезагрузки активна
  та же кампания и тот же этаж.
- Массивы контента: длины 10 и 15; на седьмом этаже
  `floorEpilogue(6, 1) !== floorEpilogue(6, 2)`.
- Среда v2: `floorHazard(2, 2) === null` (арена), `floorHazard(3, 2)`
  — тьма катакомб, `floorHazard(6, 2)` — лёд, `floorHazard(9, 2)` — лава.

## 11. Задачи

### Этап 0. Подготовка

| # | Задача | Файл | Оценка |
|---|---|---|---|
| 0.1 | Бюджеты `roomTarget`, `optionalShare`, `minJunctions`, `eliteCap`, `vault`, `camp`, `hazardHallMax` в обеих таблицах | `game.js` | 0.5 дня |
| 0.2 | `BIOMES_V2`, `buildFloors()`, `FLOORS_V1/V2`, `setCampaign()` | `game.js` | 0.5 дня |
| 0.3 | Флаги `GEN_V2` и `CAMPAIGN_V2`, URL-переключатели, дев-панель | `game.js` | 0.25 дня |
| 0.4 | Массивы контента `_V1`/`_V2`, аргумент `campaign`, декор по кампании | `dungeon-content.js`, `game.js` | 0.5 дня |
| 0.5 | Поле `campaign` в сохранении, загрузка, `setCampaign()` | `game.js` | 0.25 дня |
| 0.6 | Аудит тестов на индексы, `floorOf(campaign, biome, depth)`, экспорт таблиц в харнессе | `checks.js`, `game_harness.js` | 0.5 дня |

### Этап 1. Генератор

| # | Задача | Зависит от | Оценка |
|---|---|---|---|
| 1.1 | `genRng`, `genInt`, `genPick`, `genShuffle`, `genCoarse`, `genCellRect` | 0.1 | 0.5 дня |
| 1.2 | `genPickEnds`, `genSpinePath` с целевой длиной | 1.1 | 0.75 дня |
| 1.3 | `genGrowBranches`, распределение веток по стеблям | 1.2 | 0.75 дня |
| 1.4 | `genAssignRoles`, лимиты ролей, проверка развилок | 1.3 | 0.75 дня |
| 1.5 | `genCarve`, `genRoomRect`, формы комнат, коридоры | 1.4 | 0.75 дня |
| 1.6 | `genAddLoops`, выходы, двери, декор | 1.5 | 0.5 дня |
| 1.7 | `genPlanStats`, `genValidatePlan(plan, grid)`, `genPlanSignature` | 1.5 | 0.5 дня |
| 1.8 | Интеграция в `createFloorState`, `buildCheckedFloor`, `validateFloorState` | 1.7 | 0.5 дня |
| 1.9 | Тесты 1500 карт на двух таблицах, детерминизм, производительность | 1.8 | 0.75 дня |
| 1.10 | 5 плейтестов: v1 с `GEN_V2` и v2 с `CAMPAIGN_V2`, разбор карт | 1.9 | 0.5 дня |

Итого: **8–9 дней** на этапы 0–1.

Порядок включения:

1. 0.1–0.6 — данные, контент и сохранение; оба флага выключены,
   поведение игры не меняется.
2. 1.1–1.6 — генератор за `GEN_V2`; по умолчанию старый путь.
3. 1.7–1.8 — валидатор и откат на legacy.
4. 1.9 — 1500 карт на обеих таблицах.
5. 1.10 — плейтест v1 и v2.
6. Только после этого `GEN_V2 = true`. `CAMPAIGN_V2` остаётся
   выключенным до этапа 6 и миграции сохранений.

## 12. Критерии готовности

- 1000 карт v2 и 500 карт v1: 0 проблем валидатора.
- `optionalShare` — в целевом диапазоне на каждом обычном этаже.
- `junctions` — не меньше целевого числа.
- 0 недостижимых комнат.
- Врата достижимы без ключа.
- `vault` не на хребте; `rest` не у врат.
- p95 генерации < 50 мс на самой большой карте.
- Детерминизм: один сид — одна подпись плана.
- Старый генератор работает при `GEN_V2 = false` и как фолбэк.
- Оба флага выключены: играются те же 10 этажей, что и до этапа.
- `CAMPAIGN_V2` включён: новый забег получает 15 этажей, арены стоят
  на 3, 6, 9, 12 и 15 местах, контент совпадает по индексам.
- Старый сейв без `campaign` продолжается как v1 при любом флаге.
- `state.plan` не сериализуется; в JSON сохранения нет `rooms`.
- Все существующие проверки зелёные (с учётом переписанных индексов).
- 5 плейтестов: на каждом обычном этаже видно минимум 2 развилки
  и минимум одну ветку, куда хочется свернуть.

## 13. Риски

| Риск | Признак | Что делать |
|---|---|---|
| Роли не сходятся | много отказов валидатора | ослабить лимиты, увеличить число попыток, менять роли местами |
| Крупная сетка слишком блочная | карты похожи на шахматку | джиттер рамок, формы `cave`/`cross`, коридоры-петли |
| Ветки касаются друг друга | лишние проходы, ломается учёт | запрет на соседство клеток разных стеблей |
| Долгие коридоры | `clearLen` >> `pathLen` | вставлять комнаты каждые 6 клеток, петли |
| Тесты на индексах | падают после 15 этажей | `floorOf(campaign, biome, depth)`, а не числа |
| Старые сохранения | этаж 7 означает другой биом | `campaign` в сейве, старый сейв = v1, `CAMPAIGN_V2` выключен |
| Кампании перепутались | эпилог или среда не от того этажа | массивы `_V1`/`_V2`, `campaign` в аргументе, тест длин 10/15 |
| `FLOORS` в харнессе устарел | после `setCampaign(2)` тесты видят 10 этажей | брать `FLOORS_V1`/`FLOORS_V2` явно, не `API.FLOORS` |
| v1-карты слишком тесные | валидатор валит 32×23 | уменьшить `roomTarget`, не включать `GEN_V2` на v1 или оставить v1 на legacy |
| `repairFloorState` ломает роли | после починки невалидный план | для v2 — откат на legacy, не починка |
| Случайность в `createFloorState` | недетерминированные тесты | тестировать `generateFloorV2` напрямую, не через состояние |

## 14. Открытые вопросы к этапу

1. Когда включать `CAMPAIGN_V2` по умолчанию для новых игроков?
   Рекомендация: не раньше этапа 6, когда готовы тексты и миграция.
2. `?gen=v2` и `?campaign=v2` — только в dev-сборке или публично?
   Рекомендация: в dev; в публичной сборке флаг читается, но URL
   не документируется.
3. Кто принимает решение по визуальной проверке схем: автор или плейтесты?
4. Нужен ли в дев-панели экран сравнения v1 и v2 карт одного сида?
   Это ускорило бы приёмку, но добавляет отдельную UI-задачу.

## Приложение. Псевдокод

```js
function generateFloorV2(f, index, opts) {
  opts = opts || {};
  const seed = opts.seed != null ? opts.seed : genDefaultSeed(index);
  const rng = genRng(seed);
  const { cw, ch } = genCoarse(f.w, f.h);
  const { entry, gate } = genPickEnds(cw, ch, rng);
  const spineRooms = Math.max(4,
    Math.round(f.roomTarget * (1 - f.optionalShare)));
  const spine = genSpinePath(entry, gate, spineRooms, cw, ch, rng);
  const branchTarget = Math.max(1,
    Math.round(f.roomTarget * f.optionalShare));
  const branches = genGrowBranches(spine, branchTarget, cw, ch, rng);
  const plan = {
    version: 2, index, biome: f.biome, campaign: f.campaign, seed,
    w: f.w, h: f.h, cw, ch,
    budget: {
      roomTarget: f.roomTarget, optionalMin: f.optionalShare - 0.05,
      optionalMax: f.optionalShare + 0.05, minJunctions: f.minJunctions,
      eliteCap: f.eliteCap, vault: f.vault, camp: f.camp,
      hazardHallMax: 2
    },
    rooms: [], edges: [], spine: [], entryId: 0, gateId: 0,
    stats: {}, warnings: []
  };
  genBuildRooms(plan, spine, branches);
  genAssignRoles(plan, f, index, rng);
  genAddLoops(plan, rng);
  const carved = genCarve(plan, f.w, f.h, index, rng);
  plan.stats = genPlanStats(plan, carved.grid);
  return {
    grid: carved.grid,
    decor: carved.decor,
    start: carved.start,
    end: carved.end,
    spots: carved.spots,
    plan
  };
}
```

```js
function genSpinePath(entry, gate, targetLen, cw, ch, rng) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const path = [entry];
    const used = new Set([genCellKey(entry)]);
    if (genWalk(path, used, gate, targetLen, cw, ch, rng)) return path;
  }
  return genShortestPath(entry, gate, cw, ch);
}
```

```js
function genValidatePlan(plan, grid) {
  const problems = [];
  const b = plan.budget;
  if (plan.rooms.length < b.roomTarget - 2) problems.push("мало комнат");
  if (plan.rooms.length > b.roomTarget + 2) problems.push("много комнат");
  if (plan.stats.optionalShare < b.optionalMin) problems.push("мало веток");
  if (plan.stats.optionalShare > b.optionalMax) problems.push("много веток");
  if (plan.stats.junctions < b.minJunctions) problems.push("мало развилок");
  if (!grid) {
    problems.push("нет сетки для проверки достижимости");
    return problems;
  }
  // flood fill от входа, достижимость врат, vault/rest, лимиты ролей,
  // петли, длины коридоров
  return problems;
}
```
