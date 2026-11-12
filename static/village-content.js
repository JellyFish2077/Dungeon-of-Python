// Деревня — хаб между походами, но не экран-анкета, а настоящий уровень:
// та же карта из тайлов, что и подземелье, герой ходит по ней, у домов стоят
// НПС. Раскладка задана текстом, а не кодом: её видно и можно править, не
// разбираясь в движке.
//
// Легенда (совпадает с VILLAGE_TILES ниже):
//   #  стена дома (не пройти)      .  трава                  p  дорожка
//   T  дерево (не пройти)          F  забор (не пройти)      W  колодец (не пройти)
//   C  костёр (пройти можно)       D  дверь в дом            d  запертая дверь
//   S  табличка/указатель (пройти можно, текст — в VILLAGE_SIGNS)
//   i  пол внутри дома (в деревне не встречается)
//   G  страж у входа в подземелье (это НПС, а не препятствие)
//   E  вход в подземелье (клетка под стражем)
//
// Дом — это блок клеток-стен с проёмом двери. Поэтому столкновения, тени
// стен и вид дома работают тем же кодом, что и стены подземелья, и в
// отрисовке для домов не нужно ни одной отдельной строки.
//
// Двери амбара, кузницы и дома мастера стоят буквой «d», то есть запертыми:
// их открывают материалы и ключ (см. buildingUnlocked в game.js), а какой
// спрайт нарисовать — замок или открытую дверь — решает не раскладка, а
// состояние деревни в профиле.

const VILLAGE_MAP = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T.........T........T.........T",
  "T..#####.FFFFFFVFFFFF.#####..T",
  "TT.#####.F.T.T.pT.T.F.#####.TT",
  "To.#####.F.T.o.po.T.F.#####o.T",
  "T..##D##.FFFFF.pFFFFF.##D##..T",
  "T.pppppppppppppppppppppSpppppT",
  "T#####pppppppppppppppppp#####T",
  "T#####ppppppppWppCpppppp#####T",
  "T#####pppppppoprctcppppp#####T",
  "T##D##pppppppppppppppppp##d##T",
  "T.ppppppSppppppppppppSppppppST",
  "T.p#####pFFF#####FFFFp#####p.T",
  "TTp#####pFFF#####FFFFp#####paT",
  "Tlp#####pFFF#####FFFFp#####poT",
  "T.p##d##pFFF##D##FFFFp##d##pTT",
  "TTppppppppppppppppppppppppppTT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];

// Где герой появляется в деревне (после загрузки, смерти и победы).
const VILLAGE_SPAWN = { x: 25, y: 6 };

// Указатели деревни. Одна доска у входа и таблички у недостроенных домов.
// Текст живёт здесь, а «S» в раскладке только ставит табличку на клетку:
// так надпись можно править, не трогая карту.
const VILLAGE_SIGNS = [
  {
    x: 23, y: 6, title: "Указатель", subtitle: "Деревня",
    text: "Банк ↑ · Староста ↖ · Торговец ↙ · Школа ↓ · Подземелье ←"
  },
  {
    x: 8, y: 11, title: "Строится", subtitle: "Амбар",
    text: "Амбар заколочен: нужны доски и ключ со стража лестницы.",
    building: "barn", builtTitle: "Открыто", builtSubtitle: "Амбар",
    builtText: "Амбар снова открыт: материалы на складе."
  },
  {
    x: 21, y: 11, title: "Строится", subtitle: "Кузница",
    text: "Кузница ждёт руду и дерево — тогда в ней снова застучат молоты.",
    building: "forge", builtTitle: "Открыто", builtSubtitle: "Кузница",
    builtText: "Кузница работает: горн разожжён."
  },
  {
    x: 28, y: 11, title: "Строится", subtitle: "Дом мастера",
    text: "Дом мастера пуст: сначала подними кузницу и найди печать мастера.",
    building: "smith", builtTitle: "Открыто", builtSubtitle: "Дом мастера",
    builtText: "Мастер снова за верстаком."
  }
];

// Тема земли деревни: служебный индекс 10 — собственный грунт деревни
// (TERRAIN_VILLAGE.ground), а не один из подземных этажей.
const VILLAGE_GROUND = 10;

// Значение клетки: пол/стена, код декора и необязательный объект.
//   floor: 0 — стена, 1 — пол
//   kind:  "door" | "locked" | "entrance" | "tree" | "fence" | "well" | "fire"
//   blocked: true — сквозь клетку не пройти (стены задаёт сам grid)
const VILLAGE_TILES = {
  "#": { floor: 0 },
  " ": { floor: 0 },
  ".": { floor: 1, decor: 1 },
  // Пол внутри дома: камень без травы — дома стоят на земле, а не на лугу.
  "i": { floor: 1 },
  "p": { floor: 1 },
  "T": { floor: 1, decor: 1, kind: "tree", blocked: true },
  "F": { floor: 1, decor: 1, kind: "fence", blocked: true },
  "W": { floor: 1, decor: 1, kind: "well", blocked: true },
  "C": { floor: 1, decor: 1, kind: "fire" },
  // Двор: бочка и поленница. Обе не пропускают — это утварь, а не ковёр.
  "o": { floor: 1, decor: 1, kind: "barrel", blocked: true },
  "l": { floor: 1, decor: 1, kind: "woodpile", blocked: true },
  // Дверь в деревне — часть стены: дом непроходим целиком, и внутрь ведёт
  // только взаимодействие с дверью, а не шаг через проём.
  "D": { floor: 0, kind: "door" },
  "d": { floor: 0, kind: "locked" },
  // Дверь комнаты (внутри дома) — наоборот, проходимая: с неё игрок выходит.
  "X": { floor: 1, kind: "door" },
  "S": { floor: 1, decor: 1, kind: "sign" },
  "G": { floor: 1, decor: 1, kind: "guard" },
  "E": { floor: 1, decor: 1, kind: "entrance" },
  // Спуск в подземелье: дыра в земле со ступенями. Стоит у стража входа.
  "V": { floor: 1, kind: "descent", blocked: true },
  // Маркеры НПС в раскладках: «1» — место жителя. Кто именно там стоит —
  // в VILLAGE_NPCS; маркер нужен, чтобы позиция была видна прямо в тексте.
  "1": { floor: 1, kind: "npc" },
  "2": { floor: 1, kind: "npc" },
  "3": { floor: 1, kind: "npc" },
  "4": { floor: 1, kind: "npc" },
  // Мебель внутри домов: клетка непроходима, как и уличная утварь.
  "t": { floor: 1, kind: "table", blocked: true },
  "c": { floor: 1, kind: "chair", blocked: true },
  "b": { floor: 1, kind: "bed", blocked: true },
  "s": { floor: 1, kind: "shelf", blocked: true },
  "r": { floor: 1, kind: "crate", blocked: true },
  "a": { floor: 1, kind: "anvil", blocked: true },
  "f": { floor: 1, kind: "fireplace", blocked: true },
  "w": { floor: 1, kind: "workbench", blocked: true },
  "k": { floor: 1, kind: "cauldron", blocked: true },
  "n": { floor: 1, kind: "counter", blocked: true },
  // Доска задач в школе: отдельный объект, открывает меню практики.
  "B": { floor: 1, kind: "board", blocked: true }
};

// Дома деревни. Раньше дом был просто блоком стен — отсюда и «набор
// коробок» вместо зданий. Теперь по прямоугольнику строится настоящий вид
// дома: крыша (конёк, скат, свес), фасад с окнами и дверь.
// Стены в раскладке остаются: они задают непроходимость, и прямоугольник
// обязан с ними совпадать — это проверяется при загрузке, поэтому опечатка
// падает сразу и с понятным текстом, а не тихо рисует дом мимо.
//   door — координаты двери; она же задаёт, где фасад (с той стороны дом
//   выходит на улицу). В деревне дверь всегда на нижней стене (y === y1):
//   тогда фасад смотрит вниз, а крыша стоит над ним, а не под ним.
//   exit — клетка двери внутри комнаты.
const VILLAGE_HOUSES = {
  elder: {
    name: "Дом старосты", roof: "blue",
    box: { x0: 3, y0: 2, x1: 7, y1: 5 },
    door: { x: 5, y: 5 }, exit: { x: 4, y: 6 }
  },
  bank: {
    name: "Банк", roof: "green",
    box: { x0: 22, y0: 2, x1: 26, y1: 5 },
    door: { x: 24, y: 5 }, exit: { x: 4, y: 6 }
  },
  trader: {
    name: "Дом торговца", roof: "red",
    box: { x0: 1, y0: 7, x1: 5, y1: 10 },
    door: { x: 3, y: 10 }, exit: { x: 4, y: 6 }
  },
  // Школа стоит в бывшем саду между амбаром и кузницей. Дверь смотрит
  // на нижнюю дорожку, поэтому фасад и крыша читаются как у остальных домов.
  school: {
    name: "Школа", roof: "blue",
    box: { x0: 12, y0: 12, x1: 16, y1: 15 },
    door: { x: 14, y: 15 }, exit: { x: 4, y: 6 }
  }
};

// Постройки, которые деревня восстанавливает: сначала они стоят запертыми, и
// ключ к двери — уровень этой же постройки в профиле (village.barn, .forge,
// .smith). Коричневая крыша отмечает хозяйственные постройки — их видно
// издалека и не спутать с жилыми домами.
// exit — клетка двери внутри комнаты: она у всех комнат одна (4, 6), потому
// что комнаты нарисованы по одному шаблону.
const VILLAGE_SEALED = [
  {
    key: "barn", name: "Амбар", roof: "brown", locked: true,
    box: { x0: 3, y0: 12, x1: 7, y1: 15 }, door: { x: 5, y: 15 }, exit: { x: 4, y: 6 }
  },
  {
    key: "smith", name: "Дом мастера", roof: "brown", locked: true,
    box: { x0: 24, y0: 7, x1: 28, y1: 10 }, door: { x: 26, y: 10 }, exit: { x: 4, y: 6 }
  },
  {
    key: "forge", name: "Кузница", roof: "brown", locked: true,
    box: { x0: 22, y0: 12, x1: 26, y1: 15 }, door: { x: 24, y: 15 }, exit: { x: 4, y: 6 }
  }
];

// Цвета крыш: те же ключи, что в TERRAIN_VILLAGE.roofs (см. tools/art).
const VILLAGE_ROOF_COLORS = ["red", "blue", "green", "brown"];

function villageBuildingList() {
  const out = [];
  Object.keys(VILLAGE_HOUSES).forEach((k) => {
    const h = VILLAGE_HOUSES[k];
    out.push({ key: k, name: h.name, roof: h.roof, box: h.box, door: h.door,
      exit: h.exit, locked: false });
  });
  VILLAGE_SEALED.forEach((s) => {
    out.push({ key: s.key, name: s.name, roof: s.roof, box: s.box, door: s.door,
      exit: s.exit, locked: !!s.locked });
  });
  return out;
}

// Материалы клеток для отрисовки:
//   ""       — обычная земля (трава, дорожка)
//   "roof"   — крыша дома; у неё есть вид (конёк/скат/свес) и цвет дома
//   "facade" — стена дома со стороны улицы
//   "window" — окно на фасаде
function villageMaterials(parsed, built) {
  built = built || {};
  const w = parsed.w, h = parsed.h;
  const mat = [], roofKind = [], roofColor = [];
  const props = [];
  for (let y = 0; y < h; y++) {
    mat.push(new Array(w).fill(""));
    roofKind.push(new Array(w).fill(""));
    roofColor.push(new Array(w).fill(""));
  }
  villageBuildingList().forEach((b) => {
    const box = b.box;
    if (!box) throw new Error("деревня: у дома «" + b.key + "» нет прямоугольника");
    if (VILLAGE_ROOF_COLORS.indexOf(b.roof) < 0) {
      throw new Error("деревня: у дома «" + b.key + "» неизвестный цвет крыши «" + b.roof + "»");
    }
    const facadeY = b.door.y;
    if (facadeY !== box.y0 && facadeY !== box.y1) {
      throw new Error("деревня: дверь дома «" + b.key + "» не на краю прямоугольника");
    }
    const facadeBelow = facadeY === box.y1;
    const near = facadeBelow ? box.y1 - 1 : box.y0 + 1;
    const far = facadeBelow ? box.y0 : box.y1;
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        const ch = parsed.chars[y][x];
        if (x === b.door.x && y === b.door.y) {
          // На двери стоит «D» или «d» — в деревне это одна и та же дверь,
          // какую именно нарисовать (открытую или с замком), решает состояние
          // деревни в профиле, а не раскладка. Проверяем только, что здесь
          // действительно дверь, а не пробитая в стене дыра.
          if (ch !== "D" && ch !== "d") {
            throw new Error("деревня: у дома «" + b.key + "» на двери " + x + "," + y +
              " символ «" + ch + "», а ждём дверь («D» или «d»)");
          }
          continue;
        }
        if (ch !== "#") {
          throw new Error("деревня: дом «" + b.key + "» ждёт стену в " + x + "," + y +
            ", а в раскладке «" + ch + "»");
        }
        roofColor[y][x] = b.roof;
        if (y === facadeY) {
          mat[y][x] = "facade";
        } else {
          mat[y][x] = "roof";
          roofKind[y][x] = y === far ? "ridge" : (y === near ? "eave" : "slope");
        }
      }
    }
    // Окна: по одному с каждого края фасада, клетку двери не трогаем.
    [box.x0 + 1, box.x1 - 1].forEach((x) => {
      if (mat[facadeY] && mat[facadeY][x] === "facade" && x !== b.door.x) {
        mat[facadeY][x] = "window";
      }
    });
    // Труба на дальней от фасада стороне крыши: с ней дом перестаёт быть
    // плоским прямоугольником.
    props.push({ x: box.x1 - 1, y: far, kind: "chimney" });
    // Леса у недостроенных домов: подмостки по углам фасада. Это только
    // вид — дом и так непроходим, а новые тайлы для строек не нужны.
    if (b.locked && !built[b.key]) {
      props.push({ x: box.x0, y: facadeY, kind: "scaffold" });
      props.push({ x: box.x1, y: facadeY, kind: "scaffold" });
      props.push({ x: box.x0, y: near, kind: "scaffold" });
      props.push({ x: box.x1, y: near, kind: "scaffold" });
    } else if (b.locked) {
      // Постройка поднята: леса убраны, у фасада появились припасы.
      // Кузница ещё и топится — огонёк у её стены.
      if (b.key === "barn") {
        props.push({ x: box.x0, y: facadeY, kind: "crate" });
        props.push({ x: box.x1, y: facadeY, kind: "barrel" });
      } else if (b.key === "forge") {
        props.push({ x: box.x0, y: facadeY, kind: "barrel" });
        props.push({ x: box.x1, y: facadeY, kind: "crate" });
        props.push({ x: box.x1 + 2, y: box.y0, kind: "fire" });
      } else if (b.key === "smith") {
        props.push({ x: box.x0, y: facadeY, kind: "crate" });
        props.push({ x: box.x1, y: facadeY, kind: "barrel" });
      }
    }
  });
  // Дорожки: клетки «p» получают материал path, чтобы земля читалась
  // как протоптанная тропа, а не как газон.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (parsed.chars[y][x] === "p" && !mat[y][x]) mat[y][x] = "path";
    }
  }
  return { mat: mat, roofKind: roofKind, roofColor: roofColor, props: props };
}

// Комнаты внутри домов. Та же легенда; дверь внизу возвращает в деревню.
// Комната нарочно маленькая: в ней только НПС и пара предметов, а не ещё
// одно подземелье — игрок заходит поговорить и выходит.
//
// Обстановка ставится так, чтобы НИЧЕГО не перекрывало проход: мебель
// прижата к стенам и одиночными клетками. Сплошная линия поперёк комнаты
// перед дверью однажды уже замуровала вход в дом наставника — игрок
// появлялся в двери и не мог шагнуть никуда. Проверка в checks.js следит,
// чтобы из двери был шаг и все клетки комнаты оставались достижимы.
const HOUSE_MAPS = {
  trader: [
    "#########",
    "#siiiirr#",
    "#rii1iis#",
    "#inninni#",
    "#iciiiti#",
    "#iiiiiii#",
    "####X####"
  ],
  elder: [
    "#########",
    "#siiiiib#",
    "#iiiiiii#",
    "#i1tttii#",
    "#ficicis#",
    "#iiiiiii#",
    "####X####"
  ],
  bank: [
    "#########",
    "#siiii#r#",
    "#tci1i#r#",
    "#inninni#",
    "#iiiiiii#",
    "#riiiiic#",
    "####X####"
  ],
  // Амбар: кладовка. Полки вдоль стен, к ним и подходят за припасами.
  barn: [
    "#########",
    "#riririr#",
    "#siiiiir#",
    "#iiitiii#",
    "#iii1iii#",
    "#risiirs#",
    "####X####"
  ],
  // Кузница: горн и наковальня рядом, кузнец между ними.
  forge: [
    "#########",
    "#wiiiiir#",
    "#ifi1ais#",
    "#iiiiiii#",
    "#ikiiiri#",
    "#iiiiiii#",
    "####X####"
  ],
  // Мастерская: верстак за спиной мастера, стол и ящики по краям.
  smith: [
    "#########",
    "#siiiiir#",
    "#riiiiis#",
    "#iiiwiii#",
    "#iti1iri#",
    "#iiiiiii#",
    "####X####"
  ],
  // Школа: книги вдоль стен, стол учителя и свободный проход к двери.
  school: [
    "#########",
    "#siiiiir#",
    "#iiiiiii#",
    "#i1tttBi#",
    "#iiiiiii#",
    "#iiiiiii#",
    "####X####"
  ]
};

// НПС деревни. Место задаётся маркером на карте или символом 'G'.
// Ключ — короткое имя, по нему открывается окно (см. openDialog в game.js).
// Маркер «1» в комнатах ставится там, где стоит житель: сам он берётся отсюда,
// поэтому координаты жителя и маркера должны совпадать.
const VILLAGE_NPCS = [
  { key: "guard", name: "Страж входа", place: "village", at: { x: 14, y: 3 } },
  { key: "trader", name: "Торговец", place: "trader", at: { x: 4, y: 2 } },
  { key: "elder", name: "Староста", place: "elder", at: { x: 2, y: 3 } },
  { key: "mentor", name: "Наставник", place: "village", at: { x: 10, y: 8 } },
  { key: "banker", name: "Казначей", place: "bank", at: { x: 4, y: 2 } },
  { key: "blacksmith", name: "Кузнец", place: "forge", at: { x: 4, y: 2 } },
  { key: "master", name: "Мастер", place: "smith", at: { x: 4, y: 4 } },
  { key: "storekeeper", name: "Кладовщик", place: "barn", at: { x: 4, y: 4 } },
  { key: "teacher", name: "Учитель", place: "school", at: { x: 2, y: 3 } }
];

// Первая глава — знакомство. Считаем тех, кто на виду с самого начала:
// кузнец, мастер и кладовщик сидят в запертых постройках и здороваются
// уже в своих главах, когда деревня их откроет.
const VILLAGE_MEET_NPCS = ["guard", "elder", "trader", "banker", "mentor", "teacher"];

// Приветствия жителей: первая встреча — короткая сцена из двух реплик,
// после неё открывается обычное окно жителя. При повторном разговоре
// сцену не показываем, иначе лавка начиналась бы с двух «Далее».
const NPC_GREETINGS = {
  guard: [
    "Стой, герой. Я страж входа — дальше начинается подземелье.",
    "Спуск открыт, но сначала обойди деревню. Здесь тебя должны знать в лицо."
  ],
  elder: [
    "А, новый герой. Я староста. Деревня держится на четырёх опорах, и одна из них уже просит ремонта.",
    "Познакомься с жителями, а потом возвращайся: дам первое дело."
  ],
  trader: [
    "Заходи, герой! Я торговец. Зелья, амулеты возврата и снаряжение — всё, что нужно перед спуском.",
    "Без зелья в подземелье не суйся. Заглядывай перед каждым походом."
  ],
  banker: [
    "Я казначей. Здесь хранится твоё золото, материалы и рекорд походов.",
    "Банк не тратится сам: перед спуском можно взять часть золота и зелий с собой."
  ],
  mentor: [
    "Я наставник. Учу читать ошибки и не сдаваться после первого провала.",
    "Ошибаться не страшно. Страшно не понять, где именно ошибся."
  ],
  teacher: [
    "Здравствуй! Я учитель. В школе идёт курс Python — девять модулей, практика и экзамены.",
    "Начнёшь с синтаксиса, а потом дойдёшь до функций и модулей. Дверь всегда открыта."
  ],
  // Эти трое живут в запертых домах: приветствие слышно уже после постройки,
  // поэтому говорят о восстановленном, а не о том, что ещё предстоит.
  blacksmith: [
    "Я кузнец. Горн снова горит — твоя руда и дерево пошли в дело.",
    "За золото подниму характеристики героя, и они останутся в каждом походе."
  ],
  master: [
    "Я мастер. Верстак снова в деле — ключ и обломки вернули дом к жизни.",
    "Кузнец поднимет улучшения до третьего уровня, а мой дом — до пятого и со скидкой."
  ],
  storekeeper: [
    "Я кладовщик. Амбар поднят, и припасам теперь есть где лежать.",
    "Меняю руду, дерево и обломки на зелья и снаряжение — не больше пары раз за поход."
  ]
};

// Разбор раскладки в ту же форму, что отдаёт generateMap в game.js:
// { w, h, grid, decor, objects }. objects — всё, что стоит на клетке:
// двери, вход, деревья, колодец и НПС-маркеры.
function villageParseMap(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("деревня: пустая раскладка");
  const h = rows.length;
  const w = rows[0].length;
  const grid = [];
  const decor = [];
  const chars = [];
  const objects = [];
  for (let y = 0; y < h; y++) {
    if (typeof rows[y] !== "string" || rows[y].length !== w) {
      throw new Error("деревня: строка " + y + " длиной " + rows[y].length + ", а ждём " + w);
    }
    const gr = [];
    const dr = [];
    for (let x = 0; x < w; x++) {
      const tile = VILLAGE_TILES[rows[y][x]];
      if (!tile) throw new Error("деревня: незнакомый символ «" + rows[y][x] + "» в " + x + "," + y);
      gr.push(tile.floor);
      dr.push(tile.decor || 0);
      if (tile.kind) {
        const obj = { x: x, y: y, kind: tile.kind, blocked: !!tile.blocked };
        // Табличка без текста — это опечатка в карте: лучше упасть сразу.
        if (tile.kind === "sign") {
          const sign = VILLAGE_SIGNS.filter((s) => s.x === x && s.y === y)[0];
          if (!sign) {
            throw new Error("деревня: у таблички в " + x + "," + y + " нет текста");
          }
          obj.title = sign.title;
          obj.subtitle = sign.subtitle;
          obj.text = sign.text;
          obj.building = sign.building;
          obj.builtTitle = sign.builtTitle;
          obj.builtSubtitle = sign.builtSubtitle;
          obj.builtText = sign.builtText;
        }
        objects.push(obj);
      }
    }
    grid.push(gr);
    decor.push(dr);
    // Символы нужны, чтобы сверить прямоугольники домов с раскладкой: по ним
    // villageMaterials ловит расхождение и говорит, где именно оно.
    chars.push(rows[y].split(""));
  }
  return { w: w, h: h, grid: grid, decor: decor, chars: chars, objects: objects };
}

// Дом, которому принадлежит дверь. null — если двери там нет.
function villageHouseAtDoor(x, y) {
  const keys = Object.keys(VILLAGE_HOUSES);
  for (let i = 0; i < keys.length; i++) {
    const h = VILLAGE_HOUSES[keys[i]];
    if (h.door.x === x && h.door.y === y) return keys[i];
  }
  return null;
}

// Постройка, которой принадлежит дверь, — включая те, что деревня ещё не
// восстановила (амбар, кузница, дом мастера). Дверь запертой постройки тоже
// должна знать, чья она: по этому ключу открывается окно восстановления.
function villageBuildingAtDoor(x, y) {
  const houses = villageHouseAtDoor(x, y);
  if (houses) return houses;
  for (let i = 0; i < VILLAGE_SEALED.length; i++) {
    const s = VILLAGE_SEALED[i];
    if (s.door.x === x && s.door.y === y) return s.key;
  }
  return null;
}

// Постройка по ключу — из общего списка (дома и невосстановленные).
function villageBuildingByKey(key) {
  return villageBuildingList().filter((b) => b.key === key)[0] || null;
}
