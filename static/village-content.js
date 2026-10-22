// Деревня — хаб между походами, но не экран-анкета, а настоящий уровень:
// та же карта из тайлов, что и подземелье, герой ходит по ней, у домов стоят
// НПС. Раскладка задана текстом, а не кодом: её видно и можно править, не
// разбираясь в движке.
//
// Легенда (совпадает с VILLAGE_TILES ниже):
//   #  стена дома (не пройти)      .  трава                  p  дорожка
//   T  дерево (не пройти)          F  забор (не пройти)      W  колодец (не пройти)
//   C  костёр (пройти можно)       D  дверь в дом            d  запертая дверь
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
  "TTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T........................T",
  "T........................T",
  "T.#####..#####...####....T",
  "T.#####..#####...####....T",
  "T.#####..#####...####....T",
  "T.##D##..##D##...#d##....T",
  "Tppppppppppppppppppppppp#T",
  "TpppppppppppWppCpppppppp#T",
  "T..#####..#####.####.....T",
  "T..#####..#####.####TTT..T",
  "T..#####..#####.#d##.....T",
  "T..##D##..##d##.l........T",
  "Tppppppppppppppppppppppp#T",
  "T..FFF...................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTT"
];

// Где герой появляется в деревне (после загрузки, смерти и победы).
const VILLAGE_SPAWN = { x: 4, y: 8 };

// Тема земли деревни: индекс темы из TERRAIN_FLOORS. Взята каменная
// («Древние руины»): стены домов выходят каменными, а дорожки — плитами.
// Трава кладётся отдельным слоем декора поверх.
const VILLAGE_GROUND = 5;

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
  "G": { floor: 1, decor: 1, kind: "guard" },
  "E": { floor: 1, decor: 1, kind: "entrance" },
  // Маркеры НПС в раскладках: «1» — место жителя. Кто именно там стоит —
  // в VILLAGE_NPCS; маркер нужен, чтобы позиция была видна прямо в тексте.
  "1": { floor: 1, kind: "npc" },
  "2": { floor: 1, kind: "npc" },
  "3": { floor: 1, kind: "npc" },
  "4": { floor: 1, kind: "npc" }
};

// Дома деревни. Раньше дом был просто блоком стен — отсюда и «набор
// коробок» вместо зданий. Теперь по прямоугольнику строится настоящий вид
// дома: крыша (конёк, скат, свес), фасад с окнами и дверь.
// Стены в раскладке остаются: они задают непроходимость, и прямоугольник
// обязан с ними совпадать — это проверяется при загрузке, поэтому опечатка
// падает сразу и с понятным текстом, а не тихо рисует дом мимо.
//   door — координаты двери; она же задаёт, где фасад (с той стороны дом
//   выходит на улицу). exit — клетка двери внутри комнаты.
const VILLAGE_HOUSES = {
  trader: {
    name: "Дом торговца", roof: "red",
    box: { x0: 2, y0: 3, x1: 6, y1: 6 },
    door: { x: 4, y: 6 }, exit: { x: 4, y: 6 }
  },
  elder: {
    name: "Дом старосты", roof: "blue",
    box: { x0: 9, y0: 3, x1: 13, y1: 6 },
    door: { x: 11, y: 6 }, exit: { x: 4, y: 6 }
  },
  mentor: {
    name: "Дом наставника", roof: "green",
    box: { x0: 3, y0: 9, x1: 7, y1: 12 },
    door: { x: 5, y: 12 }, exit: { x: 4, y: 6 }
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
    box: { x0: 17, y0: 3, x1: 20, y1: 6 }, door: { x: 18, y: 6 }, exit: { x: 4, y: 6 }
  },
  {
    key: "smith", name: "Дом мастера", roof: "brown", locked: true,
    box: { x0: 10, y0: 9, x1: 14, y1: 12 }, door: { x: 12, y: 12 }, exit: { x: 4, y: 6 }
  },
  {
    key: "forge", name: "Кузница", roof: "brown", locked: true,
    box: { x0: 16, y0: 9, x1: 19, y1: 11 }, door: { x: 17, y: 11 }, exit: { x: 4, y: 6 }
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
function villageMaterials(parsed) {
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
  });
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
    "#i#iii#i#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#iiiiiii#",
    "#iiiiiii#",
    "####X####"
  ],
  elder: [
    "#########",
    "#iiiiiii#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#i###iii#",
    "#iiiiiii#",
    "####X####"
  ],
  mentor: [
    "#########",
    "#iiiiiii#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#ii###ii#",
    "#iiiiiii#",
    "####X####"
  ],
  // Амбар: кладовка. Полки вдоль стен, к ним и подходят за припасами.
  barn: [
    "#########",
    "#i#i#i#i#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#iiiiiii#",
    "#iii#iii#",
    "####X####"
  ],
  // Кузница: горн стоит отдельно, чтобы он не перекрывал проход от двери.
  forge: [
    "#########",
    "#ii#iiii#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#iiii#ii#",
    "#iiiiiii#",
    "####X####"
  ],
  // Мастерская: верстак в углу, у стены.
  smith: [
    "#########",
    "#i###iii#",
    "#i1iiiii#",
    "#iiiiiii#",
    "#iiii#ii#",
    "#iiiiiii#",
    "####X####"
  ]
};

// НПС деревни. Место задаётся маркером на карте или символом 'G'.
// Ключ — короткое имя, по нему открывается окно (см. openDialog в game.js).
// Маркер «1» в комнатах ставится там, где стоит житель: сам он берётся отсюда,
// поэтому координаты жителя и маркера должны совпадать.
const VILLAGE_NPCS = [
  { key: "guard", name: "Страж входа", place: "village", at: { x: 21, y: 7 } },
  { key: "trader", name: "Торговец", place: "trader", at: { x: 2, y: 3 } },
  { key: "elder", name: "Староста", place: "elder", at: { x: 2, y: 2 } },
  { key: "mentor", name: "Наставник", place: "mentor", at: { x: 2, y: 2 } },
  { key: "blacksmith", name: "Кузнец", place: "forge", at: { x: 2, y: 2 } },
  { key: "master", name: "Мастер", place: "smith", at: { x: 2, y: 2 } },
  { key: "storekeeper", name: "Кладовщик", place: "barn", at: { x: 2, y: 2 } }
];

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
      if (tile.kind) objects.push({ x: x, y: y, kind: tile.kind, blocked: !!tile.blocked });
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
