// Генератор практических заданий подземелья: «вставь пропущенное», «найди
// ошибку», «повтори код» и «напиши функцию». В банке code-tasks.js таких
// заданий 46, и за долгий поход (три-четыре урока) они шли по кругу: одно и
// то же задание выпадало по восемь-десять раз, на тему «Синтаксис» их было
// три, а на «Модули» — ни одного. Здесь каждое задание — шаблон: имена,
// числа и предметы меняются при каждом вызове, и у каждой темы есть задания
// тех уровней, которые просят этажи.
//
// Шаблон знает, что должно получиться: expect — что напечатает верный код,
// raises — какую ошибку бросит код с ошибкой, fix — исправленный код,
// solution — эталонное решение «напиши функцию». Игре эти поля не нужны: их
// читает verify_practice.py и прогоняет варианты через настоящий Python —
// верный ответ работает, неверные нет, эталон проходит проверки.
//
// Задания создаются по требованию (PracticeVariants.make), при загрузке
// страницы генератор ничего не делает.
(function () {
  "use strict";

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  };
  // n разных элементов arr в случайном порядке.
  const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);
  const distinct = (arr) => new Set(arr.map(String)).size === arr.length;

  // Код задания собирается построчно.
  const L = (...rows) => rows.join("\n");
  // Строка Python в двойных кавычках.
  const str = (s) => '"' + s + '"';
  // Список строк так, как он записан в коде, и так, как его печатает Python.
  const strList = (arr) => "[" + arr.map(str).join(", ") + "]";
  const shownList = (arr) => "[" + arr.map((s) => "'" + s + "'").join(", ") + "]";
  const numList = (arr) => "[" + arr.join(", ") + "]";
  // Дробное число так, как его печатает Python: 5.0, а не 5.
  const pyFloat = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));
  // Что напечатает программа — прямо в коде. Без этого у «вставь
  // пропущенное» бывает два рабочих ответа, а нужен ровно один.
  const says = (s) => "  # выведет: " + s;
  // Что должна была напечатать программа с ошибкой в логике.
  const wants = (s) => "  # нужно получить: " + s;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  // Слово после числа: 1 шаг, 3 шага, 5 шагов.
  const plural = (n, one, few, many) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  const HEROES = ["Маг", "Рыцарь", "Лучник", "Воин", "Друид", "Странник"];
  // Все слова длиннее двух букв: шаблоны со словарями рассчитывают, что
  // ключ не распакуется в две переменные.
  const MONSTERS = ["гоблин", "скелет", "тролль", "зомби", "призрак", "дракон", "вампир", "голем", "паук", "орк"];
  const ITEMS = ["меч", "щит", "лук", "факел", "ключ", "топор", "свиток", "зелье", "кирка", "посох", "плащ", "шлем"];
  // Для списков в коде — короткие слова: на телефоне в строку кода влезает
  // около 40 знаков, и длинный список уезжал за край.
  const SHORT_ITEMS = ITEMS.filter((w) => w.length <= 4);
  const NUMVARS = ["hp", "gold", "mana", "arrows", "keys", "xp", "armor", "power"];

  const TEMPLATES = [];
  function add(kind, topic, level, name, title, make) {
    TEMPLATES.push({
      key: kind + "." + topic + "." + name,
      kind: kind,
      topic: topic,
      level: level,
      title: title,
      make: make
    });
  }
  // Вариант fill и error: options[0] — верный ответ, игра перемешивает сама.
  const fill = (topic, level, name, title, make) => add("fill", topic, level, name, title, make);
  const bug = (topic, level, name, title, make) => add("error", topic, level, name, title, make);
  const copy = (topic, level, name, title, make) => add("copy", topic, level, name, title, make);

  // ================= Синтаксис и основы =================

  fill("syntax", 1, "print_var", "Выведи переменную", () => {
    const v = pick([["hero", HEROES], ["weapon", ITEMS], ["monster", MONSTERS]]);
    const name = v[0];
    const value = pick(v[1]);
    return {
      code: L(`${name} = ${str(value)}`, "print(___)" + says(value)),
      options: [name, str(name), cap(name), "print"],
      expect: value,
      explanation: `Имя переменной пишут без кавычек: print(${name}) выводит её значение «${value}». ` +
        `А ${str(name)} в кавычках — просто слово ${name}.`
    };
  });

  fill("syntax", 1, "assign", "Запиши значение", () => {
    const name = pick(NUMVARS);
    const value = rnd(3, 99);
    return {
      code: L(`${name} ___ ${value}`, `print(${name})` + says(value)),
      options: ["=", "==", "->", ":="],
      expect: String(value),
      explanation: `Один знак = записывает значение в переменную: ${name} = ${value}. ` +
        "Два знака == только сравнивают и ничего не записывают."
    };
  });

  fill("syntax", 1, "comment", "Заметка на полях", () => {
    const note = pick(["здесь начинается бой", "герой входит в пещеру", "считаем золото", "заметка для себя"]);
    const msg = pick(["Вперёд!", "В бой!", "Готов!", "Факел зажжён"]);
    return {
      code: L(`___ ${note}`, `print(${str(msg)})` + says(msg)),
      options: ["#", "//", "--", "/*"],
      expect: msg,
      explanation: "Комментарий в Python начинается с #: всё, что дальше до конца строки, Python пропускает. " +
        "// и /* — комментарии других языков."
    };
  });

  fill("syntax", 1, "print_two", "Два значения в одной строке", () => {
    const a = pick(["hp", "gold", "level"]);
    const b = pick(["mana", "keys", "arrows"]);
    const x = rnd(10, 90);
    const y = rnd(2, 9);
    return {
      code: L(`${a} = ${x}`, `${b} = ${y}`, `print(${a} ___ ${b})` + says(x + " " + y)),
      options: [",", "+", "and", "-"],
      expect: x + " " + y,
      explanation: `Значения в print перечисляют через запятую, а Python ставит между ними пробел: ${x} ${y}. ` +
        "Знак + сложил бы числа."
    };
  });

  fill("syntax", 2, "case", "Два похожих имени", () => {
    const names = sample(HEROES, 2);
    const base = pick(["hero", "name", "boss"]);
    return {
      code: L(`${cap(base)} = ${str(names[0])}`, `${base} = ${str(names[1])}`, "print(___)" + says(names[0])),
      options: [cap(base), base, str(base), base.toUpperCase()],
      expect: names[0],
      explanation: `Python различает регистр: ${cap(base)} и ${base} — две разные переменные. ` +
        `«${names[0]}» лежит в ${cap(base)}.`
    };
  });

  bug("syntax", 1, "open_quote", "Свиток не читается", () => {
    const msg = pick(["Привет, путник", "В бой", "Сундук открыт", "Дверь заперта"]);
    return {
      code: `print("${msg})`,
      options: [
        "Строка не закрыта: в конце не хватает кавычки",
        "Скобка в конце лишняя",
        "Слово print написано с ошибкой",
        "Текст нельзя печатать через print"
      ],
      raises: "SyntaxError",
      fix: `print("${msg}")`,
      explanation: `Строка начинается с кавычки и должна ей же заканчиваться: print("${msg}").`
    };
  });

  bug("syntax", 1, "open_paren", "Счётчик сломался", () => {
    const v = pick(NUMVARS);
    const n = rnd(5, 50);
    const k = rnd(2, 9);
    return {
      code: L(`${v} = ${n}`, `print(${v} + ${k}`),
      options: [
        "Не закрыта скобка у print(",
        "Число нельзя прибавлять к переменной",
        `Имя ${v} нужно взять в кавычки`,
        "В конце строки нужно двоеточие"
      ],
      raises: "SyntaxError",
      fix: L(`${v} = ${n}`, `print(${v} + ${k})`),
      explanation: `Каждая открытая скобка должна закрыться: print(${v} + ${k}).`
    };
  });

  bug("syntax", 1, "big_print", "Заклинание не срабатывает", () => {
    const msg = pick(["В бой!", "Привет!", "Сундук!", "Ура!"]);
    const wrong = pick(["Print", "PRINT"]);
    return {
      code: `${wrong}(${str(msg)})`,
      options: [
        `${wrong} написано ${wrong === "PRINT" ? "большими буквами" : "с большой буквы"}: Python различает регистр, нужно print`,
        "В конце строки не хватает точки с запятой",
        "Текст нужно писать без кавычек",
        "Восклицательный знак нельзя печатать"
      ],
      raises: "NameError",
      fix: `print(${str(msg)})`,
      explanation: `Для Python print и ${wrong} — разные имена. Функция вывода пишется маленькими буквами: print.`
    };
  });

  bug("syntax", 1, "before_assign", "Пустой счётчик", () => {
    const v = pick(NUMVARS);
    const n = rnd(10, 100);
    return {
      code: L(`print(${v})`, `${v} = ${n}`),
      options: [
        `Переменную ${v} печатают раньше, чем ей дали значение`,
        `Число ${n} нужно взять в кавычки`,
        `Переменную нельзя называть ${v}`,
        "print не может стоять первой строкой"
      ],
      raises: "NameError",
      fix: L(`${v} = ${n}`, `print(${v})`),
      explanation: `Python выполняет строки сверху вниз. На первой строке переменной ${v} ещё нет: ` +
        `сначала ${v} = ${n}, потом print(${v}).`
    };
  });

  bug("syntax", 1, "space_name", "Дневник героя", () => {
    const pair = pick([["max", "hp"], ["hero", "name"], ["gold", "bag"], ["magic", "power"]]);
    const n = rnd(10, 99);
    return {
      code: L(`${pair[0]} ${pair[1]} = ${n}`, `print(${pair[0]} ${pair[1]})`),
      options: [
        `В имени переменной не бывает пробела: нужно ${pair[0]}_${pair[1]}`,
        "Нужно два знака ==",
        `Число ${n} нужно взять в кавычки`,
        "print нельзя писать после присваивания"
      ],
      raises: "SyntaxError",
      fix: L(`${pair[0]}_${pair[1]} = ${n}`, `print(${pair[0]}_${pair[1]})`),
      explanation: `Имя переменной — одно слово без пробелов. Слова соединяют подчёркиванием: ${pair[0]}_${pair[1]}.`
    };
  });

  bug("syntax", 2, "digit_name", "Второй герой", () => {
    const hero = pick(HEROES);
    const name = pick(["2hero", "1hero", "2nd_hero"]);
    return {
      code: L(`${name} = ${str(hero)}`, `print(${name})`),
      options: [
        "Имя переменной не может начинаться с цифры",
        "Строку нужно писать в одинарных кавычках",
        "В одном имени нельзя смешивать буквы и цифры",
        "Сначала нужно вызвать print, а потом присваивать"
      ],
      raises: "SyntaxError",
      fix: L(`hero2 = ${str(hero)}`, "print(hero2)"),
      explanation: "Имя переменной начинается с буквы или подчёркивания. Цифры можно ставить дальше: hero2 — правильное имя."
    };
  });

  bug("syntax", 2, "extra_indent", "Кривой свиток", () => {
    const v = pick(NUMVARS);
    const n = rnd(5, 60);
    return {
      code: L(`${v} = ${n}`, `    print(${v})`),
      options: [
        "Лишний отступ перед print: здесь нет блока, которому он нужен",
        `После ${v} = ${n} не хватает двоеточия`,
        `Переменная ${v} не задана`,
        "print нельзя писать после присваивания"
      ],
      raises: "IndentationError",
      fix: L(`${v} = ${n}`, `print(${v})`),
      explanation: "Отступ в Python — часть синтаксиса: он нужен только внутри блока (после if, for, def). " +
        "Обычные строки пишут от края."
    };
  });

  bug("syntax", 2, "case_var", "Пропавшее значение", () => {
    const v = pick([["weapon", ITEMS], ["hero", HEROES], ["monster", MONSTERS]]);
    const value = pick(v[1]);
    return {
      code: L(`${v[0]} = ${str(value)}`, `print(${cap(v[0])})`),
      options: [
        `${cap(v[0])} и ${v[0]} — разные имена: Python различает регистр`,
        "Строку нельзя хранить в переменной",
        "Нужны одинарные кавычки",
        "print здесь не нужен"
      ],
      raises: "NameError",
      fix: L(`${v[0]} = ${str(value)}`, `print(${v[0]})`),
      explanation: `Python различает большие и маленькие буквы: переменная называется ${v[0]}, а ${cap(v[0])} он не знает.`
    };
  });

  copy("syntax", 1, "two_vars", "Заводим героя", () => {
    const a = pick(["hp", "gold", "level"]);
    const b = pick(["mana", "keys", "arrows"]);
    return {
      code: L(`${a} = ${rnd(10, 100)}`, `${b} = ${rnd(1, 20)}`, `print(${a}, ${b})`),
      explanation: `Две переменные получают значения, а print(${a}, ${b}) выводит оба через пробел.`
    };
  });

  copy("syntax", 1, "comment_hello", "Первое заклинание", () => {
    const note = pick(["# приветствие героя", "# герой входит в пещеру", "# моя первая программа"]);
    return {
      code: L(note, `name = ${str(pick(HEROES))}`, 'print("Привет,", name)'),
      explanation: "Строка с # — комментарий, Python её пропускает. print выводит текст и значение переменной через пробел."
    };
  });

  // ================= Типы данных =================

  fill("types", 1, "to_int", "Строка в число", () => {
    const n = rnd(10, 60);
    const k = rnd(2, 9);
    const v = pick(["coins", "age", "level", "arrows"]);
    return {
      code: L(`${v} = ___(${str(n)})`, `print(${v} + ${k})` + says(n + k)),
      options: ["int", "str", "len", "list"],
      expect: String(n + k),
      explanation: `int("${n}") превращает строку в число ${n}, и его уже можно складывать: ${n} + ${k} = ${n + k}.`
    };
  });

  fill("types", 1, "to_str", "Число в строку", () => {
    const v = pick([["gold", "Золото: "], ["hp", "Здоровье: "], ["xp", "Опыт: "]]);
    const n = rnd(5, 200);
    return {
      code: L(`${v[0]} = ${n}`, `print(${str(v[1])} + ___(${v[0]}))` + says(v[1] + n)),
      options: ["str", "int", "float", "len"],
      expect: v[1] + n,
      explanation: `Склеивать через + можно только строки, поэтому число сначала превращают в строку: str(${v[0]}).`
    };
  });

  fill("types", 2, "to_float", "Дробная цена", () => {
    const x = pick([0.5, 1.5, 2.5, 3.5, 4.5, 1.25, 2.25]);
    const k = pick([2, 4]);
    const s = String(x);
    return {
      code: L("price = float(___)", `print(price * ${k})` + says(pyFloat(x * k))),
      options: [str(s), str(s.replace(".", ",")), str(s + " монеты"), s + ".0"],
      expect: pyFloat(x * k),
      explanation: `Дробную часть в Python отделяют точкой: float("${s}") — это ${s}. ` +
        `Строку с запятой "${s.replace(".", ",")}" float не поймёт.`
    };
  });

  fill("types", 2, "type_of", "Какого типа значение", () => {
    const n = rnd(2, 99);
    const v = pick([
      { cls: "int", right: `${n}`, wrong: [`${n}.0`, str(n), `[${n}]`], why: "Целое число без точки — int." },
      { cls: "float", right: `${n}.5`, wrong: [`${n}`, str(n + ".5"), `[${n}.5]`], why: "Число с точкой — дробное, float." },
      { cls: "str", right: str(n), wrong: [`${n}`, `${n}.0`, `[${n}]`], why: "Всё, что в кавычках, — строка str, даже цифры." },
      { cls: "bool", right: pick(["True", "False"]), wrong: [str("True"), "1", "None"], why: "True и False — логический тип bool." },
      { cls: "list", right: `[${n}]`, wrong: [`${n}`, str(`[${n}]`), `(${n})`], why: "Квадратные скобки — список list. Круглые скобки вокруг числа ничего не меняют." }
    ]);
    return {
      code: "print(type(___))" + says(`<class '${v.cls}'>`),
      options: [v.right].concat(v.wrong),
      expect: `<class '${v.cls}'>`,
      explanation: "type() показывает тип значения. " + v.why
    };
  });

  fill("types", 2, "round", "Округли урон", () => {
    const whole = rnd(2, 30);
    const x = whole + "." + pick([6, 7, 8, 9]);
    return {
      code: `print(___(${x}))` + says(whole + 1),
      options: ["round", "int", "float", "str"],
      expect: String(whole + 1),
      explanation: `round() округляет до ближайшего целого: ${x} → ${whole + 1}. ` +
        `А int() просто отбрасывает дробную часть и дал бы ${whole}.`
    };
  });

  fill("types", 3, "truthy", "Истина или ложь", () => {
    const v = pick([
      { want: "False", right: "0", wrong: ["1", str("0"), "-1"],
        why: "Ноль — ложь, любое другое число — истина. А \"0\" в кавычках — непустая строка, тоже истина." },
      { want: "False", right: str(""), wrong: [str(" "), str("False"), str("0")],
        why: "Ложна только пустая строка \"\". Даже строка из пробела или из слова False — истина." },
      { want: "False", right: "[]", wrong: ["[0]", str("[]"), "[[]]"],
        why: "Пустой список [] — ложь. Список [0] не пустой: в нём есть элемент." },
      { want: "True", right: str("0"), wrong: ["0", str(""), "[]"],
        why: "Строка \"0\" не пустая, поэтому она истина. Ложь — это 0, пустая строка и пустой список." }
    ]);
    return {
      code: "print(bool(___))" + says(v.want),
      options: [v.right].concat(v.wrong),
      expect: v.want,
      explanation: v.why
    };
  });

  fill("types", 4, "isinstance", "Проверка типа", () => {
    const n = rnd(2, 99);
    const item = pick(ITEMS);
    const v = pick([
      { cls: "int", right: `${n}`, wrong: [str(n), `${n}.0`, `[${n}]`] },
      { cls: "str", right: str(item), wrong: [`${n}`, `[${str(item)}]`, "None"] },
      { cls: "float", right: `${n}.5`, wrong: [`${n}`, str(n + ".5"), `[${n}.5]`] },
      { cls: "list", right: `[${n}]`, wrong: [`${n}`, str(`[${n}]`), `(${n})`] }
    ]);
    return {
      code: `print(isinstance(___, ${v.cls}))` + says("True"),
      options: [v.right].concat(v.wrong),
      expect: "True",
      explanation: `isinstance(x, ${v.cls}) отвечает True, только если x — значение типа ${v.cls}.`
    };
  });

  bug("types", 2, "str_plus_int", "Счёт не печатается", () => {
    const v = pick([["gold", "Золото: "], ["hp", "Здоровье: "], ["xp", "Опыт: "]]);
    const n = rnd(5, 99);
    return {
      code: L(`${v[0]} = ${n}`, `print(${str(v[1])} + ${v[0]})`),
      options: [
        `Нельзя складывать строку и число: нужно str(${v[0]})`,
        `Переменная ${v[0]} не задана`,
        "Строку нужно взять в одинарные кавычки",
        "print не умеет печатать числа"
      ],
      raises: "TypeError",
      fix: L(`${v[0]} = ${n}`, `print(${str(v[1])} + str(${v[0]}))`),
      explanation: `Строку и число сложить нельзя: Python не знает, что из них получить. Число превращают в строку: str(${v[0]}).`
    };
  });

  bug("types", 2, "int_word", "Уровень словами", () => {
    const pair = pick([["пять", 5], ["десять", 10], ["три", 3], ["сто", 100]]);
    const v = pick(["level", "gold", "arrows"]);
    return {
      code: L(`${v} = int(${str(pair[0])})`, `print(${v})`),
      options: [
        `int() не понимает слова: нужна строка из цифр, например "${pair[1]}"`,
        "int пишется с большой буквы",
        "Строку нельзя передавать в функцию",
        "Не хватает закрывающей скобки"
      ],
      raises: "ValueError",
      fix: L(`${v} = int(${str(pair[1])})`, `print(${v})`),
      explanation: `int() превращает в число только строку из цифр: int("${pair[1]}") = ${pair[1]}. ` +
        `Слово «${pair[0]}» он не поймёт — будет ValueError.`
    };
  });

  bug("types", 3, "str_times_float", "Слишком громкий клич", () => {
    const w = pick(["ха", "ур", "бум"]);
    const k = pick(["2.5", "1.5", "3.0"]);
    return {
      code: L(`cry = ${str(w)} * ${k}`, "print(cry)"),
      options: [
        "Строку можно умножать только на целое число",
        "Строку вообще нельзя умножать",
        "Нужны одинарные кавычки",
        "Переменную нельзя называть cry"
      ],
      raises: "TypeError",
      fix: L(`cry = ${str(w)} * ${parseInt(k, 10)}`, "print(cry)"),
      explanation: `Строка, умноженная на целое число, повторяется: ${str(w)} * 2 — это «${w}${w}». ` +
        "На дробное число умножить нельзя, даже на 3.0."
    };
  });

  bug("types", 3, "len_of_int", "Сколько цифр", () => {
    const n = rnd(100, 9999);
    return {
      code: L(`gold = ${n}`, "print(len(gold))"),
      options: [
        "У числа нет длины: len() работает со строками и списками",
        "Число слишком большое для len()",
        "Нужно писать length вместо len",
        "Переменную gold нельзя печатать"
      ],
      raises: "TypeError",
      fix: L(`gold = ${n}`, "print(len(str(gold)))"),
      explanation: "len() считает элементы строки или списка, а у числа их нет. " +
        "Чтобы узнать, сколько в числе цифр, его сначала превращают в строку: len(str(gold))."
    };
  });

  bug("types", 3, "str_compare", "Возраст из input()", () => {
    const n = rnd(12, 40);
    const lim = rnd(10, 18);
    return {
      code: L(`age = ${str(n)}  # так возвращает input()`, `if age > ${lim}:`, '    print("Проходи")'),
      options: [
        `Строку "${n}" сравнивают с числом: нужно int(age)`,
        "После if двоеточие не ставят",
        "input() всегда возвращает число",
        "Знак > в Python пишут как =>"
      ],
      raises: "TypeError",
      fix: L(`age = ${str(n)}  # так возвращает input()`, `if int(age) > ${lim}:`, '    print("Проходи")'),
      explanation: "input() всегда возвращает строку. Строку с числом сравнить нельзя — сначала int(age)."
    };
  });

  copy("types", 2, "convert", "Монеты из сундука", () => {
    const n = rnd(10, 90);
    const k = rnd(2, 5);
    return {
      code: L(`text = ${str(n)}`, "coins = int(text)", `print(coins * ${k})`),
      explanation: `int(text) превращает строку "${n}" в число, и его можно умножить: ${n * k}.`
    };
  });

  copy("types", 3, "label", "Подпись к здоровью", () => ({
    code: L(`hp = ${rnd(10, 99)}`, 'line = "Здоровье: " + str(hp)', "print(line)"),
    explanation: "str(hp) делает из числа строку, и её можно склеить с текстом через +."
  }));

  // ================= Операторы и выражения =================

  fill("operators", 1, "arith", "Подбери знак", () => {
    let a;
    let b;
    let res;
    do {
      b = rnd(2, 5);
      a = b * rnd(2, 6);
      res = { "+": a + b, "-": a - b, "*": a * b, "/": a / b };
    } while (!distinct([res["+"], res["-"], res["*"], res["/"]]));
    const names = pick([["damage", "bonus"], ["gold", "price"], ["hp", "heal"]]);
    const op = pick(["+", "-", "*", "/"]);
    const shown = op === "/" ? pyFloat(res[op]) : String(res[op]);
    return {
      code: L(`${names[0]} = ${a}`, `${names[1]} = ${b}`, `print(${names[0]} ___ ${names[1]})` + says(shown)),
      options: [op].concat(["+", "-", "*", "/"].filter((o) => o !== op)),
      expect: shown,
      explanation: `${a} ${op} ${b} = ${shown}.` + (op === "/" ? " Деление / всегда даёт дробное число, даже без остатка." : "")
    };
  });

  fill("operators", 2, "divmod", "Делим добычу", () => {
    let a;
    let b;
    do {
      a = rnd(11, 47);
      b = rnd(3, 7);
    } while (a % b === 0 || !distinct([Math.floor(a / b), a % b, a - b]));
    const op = pick(["//", "%"]);
    const whole = Math.floor(a / b);
    const val = op === "//" ? whole : a % b;
    return {
      code: L(`coins = ${a}`, `heroes = ${b}`, "print(coins ___ heroes)" + says(val)),
      options: [op, op === "//" ? "%" : "//", "/", "-"],
      expect: String(val),
      explanation: op === "//"
        ? `// — целая часть деления: ${a} // ${b} = ${whole}, каждому герою по ${whole}. Остаток ${a % b} дал бы знак %.`
        : `% — остаток от деления: ${a} = ${b} · ${whole} + ${val}, поэтому ${a} % ${b} = ${val}. Знак // дал бы ${whole}.`
    };
  });

  fill("operators", 2, "augmented", "Короткая запись", () => {
    const v = pick(["hp", "gold", "mana"]);
    const n = rnd(30, 90);
    const k = rnd(5, 25);
    const minus = Math.random() < 0.5;
    const val = minus ? n - k : n + k;
    const sign = minus ? "-" : "+";
    return {
      code: L(`${v} = ${n}`, `${v} ___ ${k}`, `print(${v})` + says(val)),
      options: minus ? ["-=", "+=", "=-", "=="] : ["+=", "-=", "=+", "=="],
      expect: String(val),
      explanation: `${v} ${sign}= ${k} — короткая запись ${v} = ${v} ${sign} ${k}. ` +
        `Осторожно: ${v} =${sign} ${k} просто запишет в ${v} число ${minus ? "-" : ""}${k}.`
    };
  });

  fill("operators", 2, "compare", "Правда или ложь", () => {
    const v = pick(["hp", "gold", "level"]);
    const x = rnd(0, 30);
    const lim = Math.random() < 0.3 ? x : rnd(0, 30);
    const test = {
      "==": x === lim, "!=": x !== lim, ">": x > lim, "<": x < lim, ">=": x >= lim, "<=": x <= lim
    };
    const want = Math.random() < 0.5;
    const ops = Object.keys(test);
    const op = pick(ops.filter((o) => test[o] === want));
    const word = want ? "True" : "False";
    return {
      code: L(`${v} = ${x}`, `print(${v} ___ ${lim})` + says(word)),
      // Из шести сравнений ровно три дают True и три False.
      options: [op].concat(ops.filter((o) => test[o] !== want)),
      expect: word,
      explanation: `${v} = ${x}, и сравнение ${x} ${op} ${lim} ${want ? "верно" : "неверно"} — это ${word}.`
    };
  });

  fill("operators", 3, "logic", "И или ИЛИ", () => {
    const pair = pick([["has_key", "has_torch"], ["is_brave", "is_tired"], ["has_map", "has_boat"]]);
    const firstTrue = Math.random() < 0.5;
    const want = Math.random() < 0.5;
    return {
      code: L(
        `${pair[0]} = ${firstTrue ? "True" : "False"}`,
        `${pair[1]} = ${firstTrue ? "False" : "True"}`,
        `print(${pair[0]} ___ ${pair[1]})` + says(want ? "True" : "False")
      ),
      options: want ? ["or", "and", "==", "is"] : ["and", "or", "!=", "is not"],
      expect: want ? "True" : "False",
      explanation: want
        ? "or даёт True, если правда хотя бы одна часть. Здесь одна из двух — True."
        : "and даёт True, только если правдивы обе части. Здесь одна ложна — получится False."
    };
  });

  fill("operators", 3, "not", "Наоборот", () => {
    const pair = pick([["alive", "Герой пал"], ["has_key", "Нужен ключ"], ["is_day", "Наступила ночь"]]);
    return {
      code: L(`${pair[0]} = False`, `if ___ ${pair[0]}:`, `    print(${str(pair[1])})` + says(pair[1])),
      options: ["not", "!", "no", "non"],
      expect: pair[1],
      explanation: "not переворачивает значение: not False — это True, поэтому print выполняется. Знака ! в Python для этого нет."
    };
  });

  fill("operators", 3, "minutes", "Минуты и секунды", () => {
    let s;
    do {
      s = rnd(65, 400);
    } while (s % 60 === 0 || s % 60 === Math.floor(s / 60));
    const m = Math.floor(s / 60);
    return {
      code: L(`seconds = ${s}`, "minutes = seconds ___ 60", "print(minutes)" + says(m)),
      options: ["//", "/", "%", "-"],
      expect: String(m),
      explanation: `// отбрасывает остаток: ${s} // 60 = ${m} — столько полных минут. ` +
        `/ дало бы дробное число, а % — остаток в секундах: ${s % 60}.`
    };
  });

  fill("operators", 4, "precedence", "Порядок действий", () => {
    let a;
    let b;
    let c;
    let vals;
    do {
      a = rnd(1, 6);
      b = rnd(2, 4);
      c = rnd(2, 3);
      vals = [a + Math.pow(b, c), a + b * c, a + b + c, a + b - c];
    } while (!distinct(vals));
    return {
      code: `print(${a} + ${b} ___ ${c})` + says(vals[0]),
      options: ["**", "*", "+", "-"],
      expect: String(vals[0]),
      explanation: `Сначала выполняется степень: ${b} ** ${c} = ${Math.pow(b, c)}, потом сложение: ` +
        `${a} + ${Math.pow(b, c)} = ${vals[0]}.`
    };
  });

  bug("operators", 2, "assign_in_if", "Проверка не работает", () => {
    const v = pick([["hp", "Поражение"], ["gold", "Кошелёк пуст"], ["keys", "Дверь не открыть"]]);
    return {
      code: L(`${v[0]} = 0`, `if ${v[0]} = 0:`, `    print(${str(v[1])})`),
      options: [
        "В условии нужно сравнение ==, а не присваивание =",
        "После if не ставят двоеточие",
        "С нулём сравнивать нельзя",
        "print должен стоять без отступа"
      ],
      raises: "SyntaxError",
      fix: L(`${v[0]} = 0`, `if ${v[0]} == 0:`, `    print(${str(v[1])})`),
      explanation: "Один знак = записывает значение, а сравнивают двумя: ==. В условии if нужно сравнение."
    };
  });

  bug("operators", 2, "lost_result", "Урон не проходит", () => {
    const hp = rnd(60, 120);
    const d = rnd(10, 40);
    return {
      code: L(`hp = ${hp}`, `damage = ${d}`, "hp - damage", "print(hp)" + wants(hp - d)),
      options: [
        "Результат hp - damage никуда не записан: нужно hp = hp - damage",
        "Переменные нельзя вычитать друг из друга",
        "print нужно поставить выше",
        "damage должен быть больше hp"
      ],
      expect: String(hp - d),
      fix: L(`hp = ${hp}`, `damage = ${d}`, "hp = hp - damage", "print(hp)"),
      explanation: `Строка hp - damage считает ${hp - d}, но никуда не сохраняет — hp остаётся ${hp}. ` +
        "Результат нужно записать: hp = hp - damage."
    };
  });

  bug("operators", 2, "slash_half", "Делим поровну", () => {
    let a;
    do {
      a = rnd(7, 41);
    } while (a % 2 === 0);
    const want = Math.floor(a / 2);
    return {
      code: L(`arrows = ${a}`, "each = arrows / 2", "print(each)" + wants(want)),
      options: [
        `/ даёт дробное ${a / 2}, а целую часть даёт //`,
        "На 2 делить нельзя",
        "Нужно умножать, а не делить",
        "print не печатает дроби"
      ],
      expect: String(want),
      fix: L(`arrows = ${a}`, "each = arrows // 2", "print(each)"),
      explanation: `${a} / 2 = ${a / 2} — дробное число. Целое число стрел на каждого даёт деление с отбрасыванием остатка: ` +
        `${a} // 2 = ${want}.`
    };
  });

  bug("operators", 3, "eq_minus", "Кошелёк странно худеет", () => {
    const n = rnd(40, 90);
    const k = rnd(5, 30);
    return {
      code: L(`gold = ${n}`, `gold =- ${k}`, "print(gold)" + wants(n - k)),
      options: [
        `Знаки перепутаны: =- ${k} записывает -${k}, нужно -=`,
        "Из переменной нельзя вычитать",
        "print не видит переменную gold",
        `Число ${k} нужно взять в кавычки`
      ],
      expect: String(n - k),
      fix: L(`gold = ${n}`, `gold -= ${k}`, "print(gold)"),
      explanation: `gold =- ${k} читается как gold = -${k}: старое значение пропадает. Уменьшить на ${k} — это gold -= ${k}.`
    };
  });

  copy("operators", 1, "crit", "Критический удар", () => {
    const d = rnd(5, 30);
    const k = pick([2, 3]);
    return {
      code: L(`damage = ${d}`, `crit = damage * ${k}`, "print(crit)"),
      explanation: `crit = damage * ${k} — урон, умноженный на ${k}: ${d * k}.`
    };
  });

  copy("operators", 2, "spend", "Покупка в лавке", () => {
    const n = rnd(60, 150);
    const p = rnd(10, 50);
    return {
      code: L(`gold = ${n}`, `gold -= ${p}`, "print(gold)"),
      explanation: `gold -= ${p} — то же, что gold = gold - ${p}. Останется ${n - p}.`
    };
  });

  copy("operators", 2, "quivers", "Колчаны", () => {
    const a = rnd(11, 40);
    const b = pick([3, 4, 5]);
    return {
      code: L(`arrows = ${a}`, `print(arrows // ${b}, arrows % ${b})`),
      explanation: `// — сколько полных колчанов, если в каждом ${b}: ${Math.floor(a / b)}, а % — сколько стрел останется: ${a % b}.`
    };
  });

  copy("operators", 4, "ternary", "Состояние героя", () => {
    const hp = rnd(10, 90);
    const lim = pick([30, 50]);
    return {
      code: L(`hp = ${hp}`, `state = "ранен" if hp < ${lim} else "бодр"`, "print(state)"),
      explanation: `Выражение «A if условие else B» выбирает одно из двух значений: здесь «${hp < lim ? "ранен" : "бодр"}».`
    };
  });

  // ================= Строки =================

  fill("strings", 2, "case", "Регистр букв", () => {
    const m = pick(MONSTERS);
    const mode = pick(["upper", "lower", "title"]);
    const src = mode === "lower" ? m.toUpperCase() : m;
    const want = mode === "upper" ? m.toUpperCase() : mode === "lower" ? m : cap(m);
    const why = {
      upper: "upper() делает все буквы заглавными.",
      lower: "lower() делает все буквы строчными.",
      title: "title() делает заглавной первую букву каждого слова."
    };
    return {
      code: `print(${str(src)}.___)` + says(want),
      options: [mode + "()"].concat(["upper()", "lower()", "title()", "strip()"].filter((o) => o !== mode + "()")),
      expect: want,
      explanation: why[mode]
    };
  });

  fill("strings", 2, "len", "Длина имени", () => {
    const m = pick(MONSTERS);
    return {
      code: L(`monster = ${str(m)}`, "print(___(monster))" + says(m.length)),
      options: ["len", "int", "str", "type"],
      expect: String(m.length),
      explanation: `len() считает символы строки: в слове «${m}» их ${m.length}.`
    };
  });

  fill("strings", 2, "index", "Буква по номеру", () => {
    const words = MONSTERS.filter((w) => w.length >= 4 && distinct([w[0], w[1], w[2], w[w.length - 1]]));
    const w = pick(words);
    const at = { "0": w[0], "1": w[1], "2": w[2], "-1": w[w.length - 1] };
    const right = pick(Object.keys(at));
    return {
      code: L(`word = ${str(w)}`, "print(word[___])" + says(at[right])),
      options: [right].concat(Object.keys(at).filter((i) => i !== right)),
      expect: at[right],
      explanation: `Номера символов считаются с нуля: word[0] — «${w[0]}», word[1] — «${w[1]}», ` +
        `а word[-1] — последняя буква «${w[w.length - 1]}».`
    };
  });

  fill("strings", 2, "concat", "Приветствие", () => {
    const hero = pick(HEROES);
    const greet = pick(["Привет, ", "Слава, ", "Удачи, "]);
    return {
      code: L(`name = ${str(hero)}`, `print(${str(greet)} ___ name)` + says(greet + hero)),
      options: ["+", "-", "*", "/"],
      expect: greet + hero,
      explanation: "Строки склеивают знаком +. Вычитать, умножать друг на друга и делить строки нельзя."
    };
  });

  fill("strings", 2, "repeat", "Боевой клич", () => {
    const w = pick(["ха", "ур", "бум", "ой"]);
    const n = rnd(2, 4);
    return {
      code: `print(${str(w)} ___ ${n})` + says(w.repeat(n)),
      options: ["*", "+", "**", "/"],
      expect: w.repeat(n),
      explanation: `Строка, умноженная на число, повторяется: ${str(w)} * ${n} — это «${w.repeat(n)}».`
    };
  });

  fill("strings", 3, "fstring", "Подстановка в строку", () => {
    const v = pick([["hp", "Здоровье"], ["gold", "Золото"], ["xp", "Опыт"]]);
    const n = rnd(5, 99);
    return {
      code: L(`${v[0]} = ${n}`, `print(___"${v[1]}: {${v[0]}}")` + says(v[1] + ": " + n)),
      options: ["f", "s", "r", "u"],
      expect: v[1] + ": " + n,
      explanation: `Буква f перед кавычками включает подстановку: {${v[0]}} заменяется значением ${n}. ` +
        "Без неё напечатались бы сами фигурные скобки."
    };
  });

  fill("strings", 3, "split", "Разбери строку", () => {
    const items = sample(SHORT_ITEMS, 3);
    return {
      code: L(`line = ${str(items.join(","))}`, 'items = line.___(",")', "print(items)" + says(shownList(items))),
      options: ["split", "strip", "find", "count"],
      expect: shownList(items),
      explanation: `split(",") режет строку по запятым и возвращает список: ${shownList(items)}.`
    };
  });

  fill("strings", 3, "join", "Собери строку", () => {
    const items = sample(ITEMS, 3);
    const sep = pick([", ", " и ", " + "]);
    return {
      code: L(`items = ${strList(items)}`, `print(${str(sep)}.___(items))` + says(items.join(sep))),
      options: ["join", "split", "append", "add"],
      expect: items.join(sep),
      explanation: `join склеивает элементы списка в одну строку и ставит между ними ${str(sep)}.`
    };
  });

  fill("strings", 3, "in", "Есть ли слово", () => {
    const m = pick(MONSTERS);
    const text = pick(["в пещере спит", "за дверью ждёт", "в болоте живёт"]) + " " + m;
    return {
      code: L(`text = ${str(text)}`, `print(${str(m)} ___ text)` + says("True")),
      options: ["in", "not in", "==", "+"],
      expect: "True",
      explanation: `Оператор in проверяет, есть ли кусок внутри строки: «${m}» в тексте есть, поэтому True.`
    };
  });

  fill("strings", 3, "replace", "Замена слова", () => {
    const pair = sample(MONSTERS, 2);
    const verb = pick(["атакует", "убегает", "спит"]);
    return {
      code: L(`msg = ${str(pair[0] + " " + verb)}`, `print(msg.replace(${str(pair[0])}, ___))` + says(pair[1] + " " + verb)),
      options: [str(pair[1]), pair[1], str(pair[0]), str("")],
      expect: pair[1] + " " + verb,
      explanation: `replace(старое, новое) заменяет кусок строки. Новое слово — тоже строка, поэтому в кавычках: ${str(pair[1])}.`
    };
  });

  fill("strings", 4, "slice", "Срез строки", () => {
    const words = ["подземелье", "сокровище", "заклинание", "лабиринт", "катакомбы"];
    let w;
    let k;
    let head;
    let opts;
    let vals;
    do {
      w = pick(words);
      k = pick([3, 4]);
      head = Math.random() < 0.5;
      const cut = (a, b) => w.slice(a, b);
      opts = head
        ? [`0:${k}`, `1:${k}`, `0:${k - 1}`, `${k}`]
        : [`-${k}:`, `${k}:`, `-${k - 1}:`, `:${k}`];
      vals = head
        ? [cut(0, k), cut(1, k), cut(0, k - 1), w[k]]
        : [cut(-k), cut(k), cut(-(k - 1)), cut(0, k)];
    } while (!distinct(vals));
    return {
      code: L(`word = ${str(w)}`, "print(word[___])" + says(vals[0])),
      options: opts,
      expect: vals[0],
      explanation: head
        ? `Срез [0:${k}] берёт символы с номерами от 0 до ${k - 1}: правая граница в срез не входит. Получается «${vals[0]}».`
        : `Срез [-${k}:] берёт последние ${k} символа строки: «${vals[0]}».`
    };
  });

  bug("strings", 2, "no_call", "Монстр не кричит", () => {
    const m = pick(MONSTERS);
    return {
      code: L(`monster = ${str(m)}`, "print(monster.upper)" + wants(m.toUpperCase())),
      options: [
        "upper вызван без скобок: нужно monster.upper()",
        "У строк нет метода upper",
        "UPPER нужно писать большими буквами",
        "Слово нужно взять в одинарные кавычки"
      ],
      expect: m.toUpperCase(),
      fix: L(`monster = ${str(m)}`, "print(monster.upper())"),
      explanation: "Метод — это функция, её вызывают со скобками: monster.upper(). Без скобок print покажет сам метод, а не результат."
    };
  });

  bug("strings", 2, "mixed_quotes", "Кривая надпись", () => {
    const msg = pick(["Привет, маг", "Стой, орк", "Эй, путник"]);
    return {
      code: `print("${msg}')`,
      options: [
        `Кавычки разные: строка открыта ", а закрыта '`,
        "В конце строки нужна точка",
        "Запятая внутри строки запрещена",
        "Скобку закрыли лишний раз"
      ],
      raises: "SyntaxError",
      fix: `print("${msg}")`,
      explanation: "Строку открывают и закрывают одинаковыми кавычками: \"...\" или '...'. Смешивать их нельзя."
    };
  });

  bug("strings", 3, "immutable", "Имя с большой буквы", () => {
    const m = pick(MONSTERS);
    const big = m[0].toUpperCase();
    return {
      code: L(`name = ${str(m)}`, `name[0] = ${str(big)}`, "print(name)"),
      options: [
        "Строку нельзя менять по индексу: она неизменяемая",
        "У строки нет символа с номером 0",
        "Большую букву нельзя хранить в строке",
        "Нужны одинарные кавычки"
      ],
      raises: "TypeError",
      fix: L(`name = ${str(m)}`, `name = ${str(big)} + name[1:]`, "print(name)"),
      explanation: `Строки в Python неизменяемые: букву внутри заменить нельзя. Собирают новую строку: name = "${big}" + name[1:].`
    };
  });

  bug("strings", 3, "no_f", "Счётчик без чисел", () => {
    const v = pick([["hp", "HP"], ["gold", "Золото"], ["xp", "Опыт"]]);
    const n = rnd(10, 99);
    return {
      code: L(`${v[0]} = ${n}`, `print("${v[1]}: {${v[0]}}")` + wants(v[1] + ": " + n)),
      options: [
        "Забыта буква f перед строкой",
        "Фигурные скобки можно писать только в функциях",
        "print не умеет печатать фигурные скобки",
        "Двоеточие внутри строки запрещено"
      ],
      expect: v[1] + ": " + n,
      fix: L(`${v[0]} = ${n}`, `print(f"${v[1]}: {${v[0]}}")`),
      explanation: `Подстановку {${v[0]}} делает только f-строка — с буквой f перед кавычками. Без неё скобки печатаются как есть.`
    };
  });

  bug("strings", 3, "index_out", "Лишняя буква", () => {
    const m = pick(MONSTERS.filter((w) => w.length <= 6));
    const n = m.length;
    return {
      code: L(`word = ${str(m)}`, `print(word[${n}])`),
      options: [
        `Длина слова — ${n}, номера букв от 0 до ${n - 1}: индекса ${n} нет`,
        "Номера букв в строке начинаются с 1",
        "Строку нельзя брать по индексу",
        `Нужно писать word(${n})`
      ],
      raises: "IndexError",
      fix: L(`word = ${str(m)}`, `print(word[${n - 1}])`),
      explanation: `Номера символов идут с нуля, поэтому последний — ${n - 1} (или -1). Индекс ${n} уже за концом строки.`
    };
  });

  copy("strings", 2, "upper", "Клич монстра", () => ({
    code: L(`monster = ${str(pick(MONSTERS))}`, "print(monster.upper())"),
    explanation: "Метод upper() возвращает строку заглавными буквами."
  }));

  copy("strings", 2, "greet", "Приветствие", () => ({
    code: L(`name = ${str(pick(HEROES))}`, 'print("Привет, " + name + "!")'),
    explanation: "Знак + склеивает строки: текст, имя и восклицательный знак."
  }));

  copy("strings", 3, "fstring", "Карточка героя", () => ({
    code: L(`hero = ${str(pick(HEROES))}`, `hp = ${rnd(40, 100)}`, 'print(f"{hero}: {hp} HP")'),
    explanation: "f-строка подставляет значения переменных из фигурных скобок."
  }));

  copy("strings", 3, "split", "Список из строки", () => ({
    code: L(`line = ${str(sample(ITEMS, 3).join(","))}`, 'items = line.split(",")', "print(items)"),
    explanation: "split(\",\") режет строку по запятым и возвращает список."
  }));

  // ================= Условия и циклы =================

  fill("control", 2, "else", "Иначе", () => {
    const c = pick([
      { v: "hp", val: 0, cond: "hp > 0", yes: "Жив", no: "Пал" },
      { v: "gold", val: rnd(1, 9), cond: "gold >= 10", yes: "Покупаю меч", no: "Не хватает золота" },
      { v: "keys", val: 0, cond: "keys > 0", yes: "Открываю дверь", no: "Дверь заперта" }
    ]);
    return {
      code: L(`${c.v} = ${c.val}`, `if ${c.cond}:`, `    print(${str(c.yes)})`, "___:", `    print(${str(c.no)})` + says(c.no)),
      options: ["else", "elif", "if", "then"],
      expect: c.no,
      explanation: `Условие ${c.cond} ложно, поэтому выполняется ветка else. elif и if требуют своего условия, а слова then в Python нет.`
    };
  });

  fill("control", 2, "range_count", "Сколько шагов", () => {
    const n = rnd(3, 7);
    return {
      code: L("steps = 0", "for i in range(___):", "    steps += 1", "print(steps)" + says(n)),
      options: [String(n), String(n - 1), String(n + 1), "0"],
      expect: String(n),
      explanation: `range(${n}) даёт ${n} ${plural(n, "число", "числа", "чисел")} — от 0 до ${n - 1}. ` +
        `Значит, цикл сделает ${n} ${plural(n, "шаг", "шага", "шагов")}.`
    };
  });

  fill("control", 2, "for_in", "Перебор сумки", () => {
    const items = sample(ITEMS, rnd(2, 3));
    return {
      code: L(`bag = ${strList(items)}`, "for item ___ bag:", "    print(item)"),
      options: ["in", "of", "from", "="],
      expect: items.join("\n"),
      explanation: "Цикл for перебирает элементы так: for элемент in список. Слово in обязательно."
    };
  });

  fill("control", 3, "range_from", "Числа не с нуля", () => {
    const s = rnd(1, 3);
    const t = s + rnd(2, 3);
    const nums = [];
    for (let i = s; i <= t; i++) nums.push(i);
    return {
      code: L("nums = []", "for i in range(___):", "    nums.append(i)", "print(nums)" + says(numList(nums))),
      options: [`${s}, ${t + 1}`, `${s}, ${t}`, `${t + 1}`, `${s + 1}, ${t + 1}`],
      expect: numList(nums),
      explanation: `range(${s}, ${t + 1}) начинает с ${s} и останавливается перед ${t + 1}: второе число в range не входит.`
    };
  });

  fill("control", 3, "while", "Пока горят факелы", () => {
    const n = rnd(2, 6);
    const v = pick(["torches", "potions", "arrows"]);
    return {
      code: L(`${v} = ${n}`, `while ${v} ___ 0:`, `    ${v} -= 1`, `print(${v})` + says(0)),
      options: [">", "<", ">=", "=="],
      expect: "0",
      explanation: `Цикл идёт, пока ${v} > 0, и на каждом шаге отнимает 1. Когда станет 0, условие ложно и цикл кончается.`
    };
  });

  fill("control", 3, "break", "Нашёл — стоп", () => {
    const k = rnd(2, 6);
    const n = rnd(k + 3, 10);
    return {
      code: L(`for room in range(${n}):`, `    if room == ${k}:`, "        ___", "print(room)" + says(k)),
      options: ["break", "continue", "pass", "return"],
      expect: String(k),
      explanation: `break сразу прерывает цикл: на комнате ${k} перебор останавливается. С continue и pass цикл дошёл бы до ${n - 1}.`
    };
  });

  fill("control", 3, "continue", "Обойди ловушку", () => {
    const n = rnd(4, 6);
    const k = rnd(2, n - 1);
    const total = (n * (n + 1)) / 2 - k;
    return {
      code: L("total = 0", `for x in range(1, ${n + 1}):`, `    if x == ${k}:`, "        ___", "    total += x", "print(total)" + says(total)),
      options: ["continue", "break", "pass", "else"],
      expect: String(total),
      explanation: `continue пропускает остаток шага: число ${k} не прибавляется, а цикл идёт дальше. break остановил бы его совсем.`
    };
  });

  fill("control", 3, "elif", "Цепочка условий", () => {
    const hp = rnd(75, 100);
    return {
      code: L(
        "# выведет только: Бодр",
        `hp = ${hp}`,
        "if hp > 70:",
        '    print("Бодр")',
        "___ hp > 30:",
        '    print("Ранен")',
        "else:",
        '    print("При смерти")'
      ),
      options: ["elif", "if", "else", "else if"],
      expect: "Бодр",
      explanation: "elif продолжает ту же цепочку и проверяется, только если первое условие ложно. " +
        "С отдельным if программа проверила бы hp > 30 заново и напечатала бы ещё и «Ранен»."
    };
  });

  fill("control", 3, "accumulate", "Копим золото", () => {
    const nums = [rnd(2, 9), rnd(2, 9), rnd(2, 9)];
    const sum = nums[0] + nums[1] + nums[2];
    return {
      code: L("total = 0", `for coins in ${numList(nums)}:`, "    total ___ coins", "print(total)" + says(sum)),
      options: ["+=", "=", "-=", "*="],
      expect: String(sum),
      explanation: "total += coins прибавляет каждую кучку к сумме. Простое = каждый раз затирало бы её, и осталась бы только последняя."
    };
  });

  fill("control", 4, "nested", "Комнаты и сундуки", () => {
    const a = rnd(2, 4);
    const b = rnd(2, 4);
    const wrong = [b + 1, b - 1, a * b, b + 2].filter((x, i, arr) => x !== b && arr.indexOf(x) === i).slice(0, 3);
    return {
      code: L("count = 0", `for room in range(${a}):`, "    for chest in range(___):", "        count += 1", "print(count)" + says(a * b)),
      options: [String(b)].concat(wrong.map(String)),
      expect: String(a * b),
      explanation: `Внутренний цикл проходит целиком на каждом шаге внешнего: ${a} · ${b} = ${a * b}.`
    };
  });

  bug("control", 2, "if_colon", "Лавка не работает", () => {
    const v = pick([["gold", "Покупаю меч"], ["hp", "Иду дальше"], ["keys", "Открываю дверь"]]);
    const n = rnd(10, 50);
    return {
      code: L(`${v[0]} = ${n}`, `if ${v[0]} >= 10`, `    print(${str(v[1])})`),
      options: [
        "Забыто двоеточие после условия if",
        "Знак >= в Python пишут как =>",
        "После if обязательно нужен else",
        "Текст в print пишут без кавычек"
      ],
      raises: "SyntaxError",
      fix: L(`${v[0]} = ${n}`, `if ${v[0]} >= 10:`, `    print(${str(v[1])})`),
      explanation: "Строка с if заканчивается двоеточием: оно открывает блок, который выполнится, если условие верно."
    };
  });

  bug("control", 2, "no_indent", "Условие не срабатывает", () => {
    const v = pick(["hp", "gold", "keys"]);
    const n = rnd(1, 9);
    return {
      code: L(`${v} = ${n}`, `if ${v} > 0:`, 'print("Есть")'),
      options: [
        "Строку внутри if нужно сдвинуть отступом на 4 пробела",
        "После if не нужно двоеточие",
        "В условии нужно ==",
        "print нельзя писать внутри if"
      ],
      raises: "IndentationError",
      fix: L(`${v} = ${n}`, `if ${v} > 0:`, '    print("Есть")'),
      explanation: "Тело if — строки с отступом. Без отступа Python не понимает, что входит в блок, и падает с IndentationError."
    };
  });

  bug("control", 2, "for_colon", "Обход комнат", () => {
    const n = rnd(3, 6);
    return {
      code: L(`for i in range(${n})`, '    print("Комната", i)'),
      options: [
        "Забыто двоеточие в конце строки с for",
        "range пишется с большой буквы",
        "Вместо for нужен while",
        "Переменную i нужно создать заранее"
      ],
      raises: "SyntaxError",
      fix: L(`for i in range(${n}):`, '    print("Комната", i)'),
      explanation: "Строка с for, как и с if, заканчивается двоеточием."
    };
  });

  bug("control", 3, "range_end", "Не хватает числа", () => {
    const s = rnd(1, 2);
    const t = rnd(4, 6);
    const want = [];
    for (let i = s; i <= t; i++) want.push(i);
    return {
      code: L(`# нужно вывести числа от ${s} до ${t}`, `for i in range(${s}, ${t}):`, "    print(i)"),
      options: [
        `range(${s}, ${t}) не включает ${t}: нужно range(${s}, ${t + 1})`,
        "Счёт в range всегда начинается с 0",
        "print нужно писать без отступа",
        "В конце строки for не нужно двоеточие"
      ],
      expect: want.join("\n"),
      fix: L(`# нужно вывести числа от ${s} до ${t}`, `for i in range(${s}, ${t + 1}):`, "    print(i)"),
      explanation: `range останавливается перед вторым числом: range(${s}, ${t}) даёт числа только до ${t - 1}. ` +
        `Чтобы вывелось и ${t}, пишут range(${s}, ${t + 1}).`
    };
  });

  bug("control", 3, "elif_after_else", "Состояние героя", () => {
    const hp = rnd(31, 69);
    return {
      code: L(`hp = ${hp}`, "if hp > 70:", '    print("Бодр")', "else:", '    print("При смерти")', "elif hp > 30:", '    print("Ранен")'),
      options: [
        "elif не может стоять после else: else всегда последний",
        "В одной программе нельзя три раза вызывать print",
        "Сравнивать нужно знаком ==",
        "После else нужно написать условие"
      ],
      raises: "SyntaxError",
      fix: L(`hp = ${hp}`, "if hp > 70:", '    print("Бодр")', "elif hp > 30:", '    print("Ранен")', "else:", '    print("При смерти")'),
      explanation: "Цепочка всегда идёт так: if, потом сколько угодно elif, и в самом конце — else."
    };
  });

  bug("control", 3, "never_runs", "Тренировка не началась", () => {
    const t = rnd(3, 7);
    return {
      code: L("n = 0", `while n > ${t}:`, "    n += 1", "print(n)" + wants(t)),
      options: [
        `Условие n > ${t} сразу ложно, и цикл не выполнится ни разу: нужно n < ${t}`,
        "while нельзя использовать с числами",
        "n += 1 нужно написать до цикла",
        "print должен стоять внутри цикла"
      ],
      expect: String(t),
      fix: L("n = 0", `while n < ${t}:`, "    n += 1", "print(n)"),
      explanation: `Перед первым шагом n = 0, а 0 > ${t} — ложь, поэтому тело цикла не выполняется ни разу. ` +
        `Чтобы досчитать до ${t}, условие должно быть n < ${t}.`
    };
  });

  bug("control", 3, "break_outside", "Побег из боя", () => {
    const hp = rnd(5, 19);
    return {
      code: L(`hp = ${hp}`, "if hp < 20:", '    print("Бегу!")', "    break"),
      options: [
        "break работает только внутри цикла, а здесь цикла нет",
        "После if не ставят двоеточие",
        "print нельзя писать перед break",
        "Знак < нужно заменить на =<"
      ],
      raises: "SyntaxError",
      fix: L(`hp = ${hp}`, "if hp < 20:", '    print("Бегу!")'),
      explanation: "break прерывает цикл for или while. В обычном if без цикла его писать нельзя."
    };
  });

  bug("control", 3, "uneven_indent", "Обход сундуков", () => {
    const n = rnd(2, 4);
    return {
      code: L(`for i in range(${n}):`, '    print("Сундук", i)', '      print("Открыт")'),
      options: [
        "Отступы в блоке разные: у всех строк внутри for он одинаковый",
        "В цикле нельзя печатать два раза",
        `range(${n}) вызовет ошибку`,
        "Не хватает двоеточия после for"
      ],
      raises: "IndentationError",
      fix: L(`for i in range(${n}):`, '    print("Сундук", i)', '    print("Открыт")'),
      explanation: "Все строки одного блока начинаются с одинакового отступа — обычно 4 пробела."
    };
  });

  copy("control", 2, "if_else", "Проверка здоровья", () => ({
    code: L(`hp = ${rnd(0, 50)}`, "if hp > 0:", '    print("Жив")', "else:", '    print("Пал")'),
    explanation: "if проверяет условие, а else срабатывает, когда оно ложно. Тела веток пишут с отступом."
  }));

  copy("control", 2, "for_range", "Шаги по коридору", () => {
    const n = rnd(3, 5);
    return {
      code: L(`for i in range(${n}):`, '    print("Шаг", i)'),
      explanation: `range(${n}) даёт числа от 0 до ${n - 1}, и цикл печатает каждое.`
    };
  });

  copy("control", 3, "countdown", "Обратный отсчёт", () => ({
    code: L(`n = ${rnd(3, 5)}`, "while n > 0:", "    print(n)", "    n -= 1", 'print("В бой!")'),
    explanation: "while повторяет тело, пока n > 0, а n -= 1 уменьшает счётчик, чтобы цикл закончился."
  }));

  copy("control", 4, "search", "Поиск ключа", () => ({
    code: L("for room in range(1, 10):", `    if room == ${rnd(2, 6)}:`, '        print("Ключ в комнате", room)', "        break"),
    explanation: "Цикл перебирает комнаты, а break останавливает его, как только ключ найден."
  }));

  // ================= Списки, словари, множества =================

  fill("collections", 2, "append", "Пополни сумку", () => {
    const items = sample(SHORT_ITEMS, 3);
    const bag = items.slice(0, rnd(1, 2));
    const added = bag.concat([items[2]]);
    return {
      code: L(`bag = ${strList(bag)}`, `bag.___(${str(items[2])})`, "print(bag)" + says(shownList(added))),
      options: ["append", "add", "push", "extend"],
      expect: shownList(added),
      explanation: `append() добавляет элемент в конец списка. extend() разобрал бы строку ${str(items[2])} на отдельные буквы.`
    };
  });

  fill("collections", 2, "len", "Сколько предметов", () => {
    const bag = sample(SHORT_ITEMS, rnd(2, 4));
    return {
      code: L(`bag = ${strList(bag)}`, "print(___(bag))" + says(bag.length)),
      options: ["len", "sum", "max", "count"],
      expect: String(bag.length),
      explanation: `len() считает элементы списка: их ${bag.length}.`
    };
  });

  fill("collections", 2, "index", "Предмет по номеру", () => {
    const bag = sample(SHORT_ITEMS, 4);
    const at = { "0": bag[0], "1": bag[1], "2": bag[2], "-1": bag[3] };
    const right = pick(Object.keys(at));
    return {
      code: L(`bag = ${strList(bag)}`, "print(bag[___])" + says(at[right])),
      options: [right].concat(Object.keys(at).filter((i) => i !== right)),
      expect: at[right],
      explanation: `Номера элементов списка считаются с нуля: bag[0] — «${bag[0]}», bag[1] — «${bag[1]}», ` +
        `а bag[-1] — последний, «${bag[3]}».`
    };
  });

  fill("collections", 3, "last", "Последний предмет", () => {
    const bag = sample(SHORT_ITEMS, rnd(3, 4));
    const n = bag.length;
    return {
      code: L(`bag = ${strList(bag)}`, "print(bag[___])" + says(bag[n - 1])),
      options: ["-1", String(n), "len(bag)", "0"],
      expect: bag[n - 1],
      explanation: `Последний элемент — bag[-1]. Индекс ${n} (он же len(bag)) уже за концом списка: номера идут от 0 до ${n - 1}.`
    };
  });

  fill("collections", 3, "dict_key", "Запись героя", () => {
    const hp = rnd(50, 100);
    const gold = rnd(5, 40);
    const key = pick(["hp", "gold"]);
    return {
      code: L(`hero = {"hp": ${hp}, "gold": ${gold}}`, "print(hero[___])" + says(key === "hp" ? hp : gold)),
      options: [str(key), key, str(key === "hp" ? "gold" : "hp"), "0"],
      expect: String(key === "hp" ? hp : gold),
      explanation: `Значение в словаре берут по ключу: hero[${str(key)}]. Ключ здесь — строка, поэтому в кавычках.`
    };
  });

  fill("collections", 3, "dict_get", "Безопасное чтение", () => {
    const d = rnd(0, 5) * 10;
    return {
      code: L(`hero = {"hp": ${rnd(50, 99)}}`, `print(hero.get("mana", ___))` + says(d)),
      options: [String(d), str("mana"), "None", "mana"],
      expect: String(d),
      explanation: `get(ключ, запасное) возвращает запасное значение, если ключа нет. Ключа "mana" нет — получаем ${d}.`
    };
  });

  fill("collections", 3, "in_list", "Есть ли ключ", () => {
    const bag = shuffle(sample(ITEMS.filter((x) => x !== "ключ"), 2).concat(["ключ"]));
    return {
      code: L(`bag = ${strList(bag)}`, 'if "ключ" ___ bag:', '    print("Дверь открыта")' + says("Дверь открыта")),
      options: ["in", "not in", "==", "of"],
      expect: "Дверь открыта",
      explanation: "in проверяет, есть ли элемент в списке. Ключ в сумке есть — условие верно."
    };
  });

  fill("collections", 3, "pop", "Достань последнее", () => {
    const bag = sample(ITEMS, 3);
    return {
      code: L(`bag = ${strList(bag)}`, "last = bag.___()", "print(last)" + says(bag[2])),
      options: ["pop", "remove", "clear", "copy"],
      expect: bag[2],
      explanation: "pop() убирает из списка последний элемент и возвращает его."
    };
  });

  fill("collections", 3, "dict_change", "Лечение героя", () => {
    const hp = rnd(30, 60);
    const k = rnd(10, 30);
    return {
      code: L(`hero = {"hp": ${hp}}`, `hero["hp"] ___ ${k}`, 'print(hero["hp"])' + says(hp + k)),
      options: ["+=", "=", "-=", "=="],
      expect: String(hp + k),
      explanation: `hero["hp"] += ${k} прибавляет ${k} к значению по ключу: ${hp} + ${k} = ${hp + k}.`
    };
  });

  fill("collections", 3, "dict_new_key", "Новая запись", () => {
    const hp = rnd(30, 90);
    const m = rnd(10, 50);
    const shown = `{'hp': ${hp}, 'mana': ${m}}`;
    return {
      code: L(`hero = {"hp": ${hp}}`, `hero[___] = ${m}`, "print(hero)" + says(shown)),
      options: [str("mana"), "mana", str("hp"), "1"],
      expect: shown,
      explanation: `Новый ключ появляется в словаре, когда ему присваивают значение: hero["mana"] = ${m}.`
    };
  });

  fill("collections", 3, "sum", "Общий урон", () => {
    let d;
    do {
      d = [rnd(3, 15), rnd(3, 15), rnd(3, 15)];
    } while (!distinct([d[0] + d[1] + d[2], 3, Math.max(d[0], d[1], d[2]), Math.min(d[0], d[1], d[2])]));
    const s = d[0] + d[1] + d[2];
    return {
      code: L(`hits = ${numList(d)}`, "print(___(hits))" + says(s)),
      options: ["sum", "len", "max", "min"],
      expect: String(s),
      explanation: `sum() складывает все числа списка: ${d.join(" + ")} = ${s}.`
    };
  });

  fill("collections", 4, "comprehension", "Список одной строкой", () => {
    const ops = ["**", "*", "+", "//"];
    const calc = { "**": (x) => x * x, "*": (x) => x * 2, "+": (x) => x + 2, "//": (x) => Math.floor(x / 2) };
    let nums;
    let lists;
    do {
      nums = sample([1, 2, 3, 4, 5, 6, 7], 3).sort((a, b) => a - b);
      lists = ops.map((o) => numList(nums.map(calc[o])));
    } while (!distinct(lists));
    const right = pick(["**", "*"]);
    const want = lists[ops.indexOf(right)];
    return {
      code: L(`nums = ${numList(nums)}`, "res = [x ___ 2 for x in nums]", "print(res)" + says(want)),
      options: [right].concat(ops.filter((o) => o !== right)),
      expect: want,
      explanation: right === "**"
        ? "x ** 2 — квадрат числа. Генератор списка применяет выражение к каждому x."
        : "x * 2 удваивает число. Генератор списка применяет выражение к каждому x."
    };
  });

  fill("collections", 4, "items", "Цены в лавке", () => {
    const goods = sample(ITEMS, 2);
    const p = [rnd(10, 60), rnd(10, 60)];
    return {
      code: L(`prices = {${str(goods[0])}: ${p[0]}, ${str(goods[1])}: ${p[1]}}`, "for name, price in prices.___():", "    print(name, price)"),
      options: ["items", "keys", "values", "get"],
      expect: `${goods[0]} ${p[0]}\n${goods[1]} ${p[1]}`,
      explanation: "items() отдаёт пары «ключ, значение», и их раскладывают в две переменные: name и price."
    };
  });

  fill("collections", 4, "enumerate", "Нумерация", () => {
    const bag = sample(ITEMS, 2);
    return {
      code: L(`bag = ${strList(bag)}`, "for i, item in ___(bag, 1):", "    print(i, item)"),
      options: ["enumerate", "range", "zip", "len"],
      expect: `1 ${bag[0]}\n2 ${bag[1]}`,
      explanation: "enumerate(bag, 1) даёт пары «номер, элемент», и нумерация начинается с 1."
    };
  });

  fill("collections", 4, "sort", "Упорядочь удары", () => {
    let nums;
    let sorted;
    do {
      nums = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
      sorted = nums.slice().sort((a, b) => a - b);
    } while (!distinct([numList(nums), numList(sorted), numList(nums.slice().reverse())]));
    return {
      code: L(`hits = ${numList(nums)}`, "hits.___()", "print(hits)" + says(numList(sorted))),
      options: ["sort", "reverse", "sorted", "order"],
      expect: numList(sorted),
      explanation: "Метод sort() упорядочивает сам список по возрастанию. sorted — отдельная функция: sorted(hits), а не hits.sorted()."
    };
  });

  fill("collections", 4, "set", "Без повторов", () => {
    const two = sample(ITEMS, 2);
    return {
      code: L(`loot = ${strList([two[0], two[1], two[0]])}`, "print(len(___(loot)))" + says(2)),
      options: ["set", "list", "str", "dict"],
      expect: "2",
      explanation: "set() убирает повторы: из трёх находок разных только две."
    };
  });

  bug("collections", 2, "index_out", "Где мой предмет?", () => {
    const bag = sample(ITEMS, 2);
    return {
      code: L(`bag = ${strList(bag)}`, "print(bag[2])"),
      options: [
        "В списке два элемента, их номера 0 и 1: индекса 2 нет",
        "Список нельзя читать по индексу",
        "Нужны круглые скобки: bag(2)",
        "Номера в списке считаются с 1"
      ],
      raises: "IndexError",
      fix: L(`bag = ${strList(bag)}`, "print(bag[1])"),
      explanation: "Номера считаются с нуля: у списка из двух элементов есть только bag[0] и bag[1]."
    };
  });

  bug("collections", 3, "missing_key", "Мана героя", () => {
    const hero = `hero = {"hp": ${rnd(50, 99)}, "gold": ${rnd(5, 50)}}`;
    return {
      code: L(hero, 'print(hero["mana"])'),
      options: [
        'Ключа "mana" в словаре нет',
        "Словарь нельзя читать по ключу",
        "Ключ пишут без кавычек",
        "Нужно писать hero.mana"
      ],
      raises: "KeyError",
      fix: L(hero, 'print(hero.get("mana", 0))'),
      explanation: 'Чтение несуществующего ключа даёт KeyError. Если ключа может не быть, берут get: hero.get("mana", 0).'
    };
  });

  bug("collections", 3, "append_none", "Пропала сумка", () => {
    const items = sample(SHORT_ITEMS, 2);
    return {
      code: L(`bag = ${strList([items[0]])}`, `bag = bag.append(${str(items[1])})`, "print(bag)" + wants(shownList(items))),
      options: [
        "append меняет сам список и возвращает None: присваивать результат не нужно",
        "append можно вызвать только один раз",
        "Нужно писать bag.add",
        "Список нельзя печатать через print"
      ],
      expect: shownList(items),
      fix: L(`bag = ${strList([items[0]])}`, `bag.append(${str(items[1])})`, "print(bag)"),
      explanation: "append меняет список на месте и возвращает None. Строка bag = bag.append(...) затирает сумку этим None."
    };
  });

  bug("collections", 3, "list_plus_str", "Новая находка", () => {
    const items = sample(ITEMS, 2);
    return {
      code: L(`bag = ${strList([items[0]])}`, `bag = bag + ${str(items[1])}`, "print(bag)"),
      options: [
        `К списку можно прибавить только список: нужно bag + [${str(items[1])}]`,
        "Списки нельзя складывать",
        "Сначала нужно вызвать print",
        "В списке может быть только один элемент"
      ],
      raises: "TypeError",
      fix: L(`bag = ${strList([items[0]])}`, `bag = bag + [${str(items[1])}]`, "print(bag)"),
      explanation: "Список складывают только со списком. Один предмет добавляют так: bag + [предмет] или bag.append(предмет)."
    };
  });

  bug("collections", 3, "remove_missing", "Выброси лишнее", () => {
    const items = sample(ITEMS, 3);
    return {
      code: L(`bag = ${strList(items.slice(0, 2))}`, `bag.remove(${str(items[2])})`, "print(bag)"),
      options: [
        `Удалить можно только то, что есть в списке, а «${items[2]}» там нет`,
        "remove удаляет только последний элемент",
        "Нужно писать bag.delete",
        "Список нельзя менять после создания"
      ],
      raises: "ValueError",
      fix: L(`bag = ${strList(items.slice(0, 2))}`, `if ${str(items[2])} in bag:`, `    bag.remove(${str(items[2])})`, "print(bag)"),
      explanation: `remove ищет элемент и падает с ValueError, если его нет. Сначала можно проверить: if ${str(items[2])} in bag.`
    };
  });

  bug("collections", 4, "dict_pairs", "Прайс-лист", () => {
    const goods = sample(ITEMS, 2);
    const prices = `prices = {${str(goods[0])}: ${rnd(10, 60)}, ${str(goods[1])}: ${rnd(10, 60)}}`;
    return {
      code: L(prices, "for name, price in prices:", "    print(name, price)"),
      options: [
        "Перебор словаря даёт только ключи: для пар нужен prices.items()",
        "Словарь нельзя перебирать в цикле",
        "Переменная в for может быть только одна",
        "Цены нужно писать в кавычках"
      ],
      raises: "ValueError",
      fix: L(prices, "for name, price in prices.items():", "    print(name, price)"),
      explanation: "for x in prices перебирает только ключи. Пары «ключ, значение» отдаёт prices.items()."
    };
  });

  bug("collections", 4, "tuple_set", "Координаты героя", () => {
    const x = rnd(1, 9);
    const y = rnd(1, 9);
    const nx = rnd(10, 20);
    return {
      code: L(`pos = (${x}, ${y})`, `pos[0] = ${nx}`, "print(pos)"),
      options: [
        `Кортеж нельзя изменять: нужно создать новый, pos = (${nx}, ${y})`,
        "У кортежа нет элемента с номером 0",
        "print не умеет печатать кортежи",
        "Числа в кортеже должны быть разными"
      ],
      raises: "TypeError",
      fix: L(`pos = (${x}, ${y})`, `pos = (${nx}, ${y})`, "print(pos)"),
      explanation: "Кортеж в круглых скобках — неизменяемый: его элементы не перезаписывают. Нужен новый кортеж."
    };
  });

  copy("collections", 2, "append", "Сумка героя", () => {
    const items = sample(ITEMS, 3);
    return {
      code: L(`bag = ${strList(items.slice(0, 2))}`, `bag.append(${str(items[2])})`, "print(bag)"),
      explanation: "append() добавляет предмет в конец списка."
    };
  });

  copy("collections", 3, "dict", "Запись героя", () => ({
    code: L(`hero = {"hp": ${rnd(50, 99)}, "gold": ${rnd(5, 50)}}`, 'print(hero["gold"])'),
    explanation: "Словарь хранит пары «ключ: значение», а значение берут по ключу в квадратных скобках."
  }));

  copy("collections", 3, "loop", "Обход сумки", () => ({
    code: L(`for item in ${strList(sample(SHORT_ITEMS, 3))}:`, "    print(item)"),
    explanation: "Цикл for по очереди берёт каждый элемент списка."
  }));

  copy("collections", 4, "items", "Лавка", () => {
    const goods = sample(ITEMS, 2);
    return {
      code: L(`prices = {${str(goods[0])}: ${rnd(10, 60)}, ${str(goods[1])}: ${rnd(10, 60)}}`,
        "for name, price in prices.items():", "    print(name, price)"),
      explanation: "items() даёт пары «ключ, значение» для цикла."
    };
  });

  copy("collections", 4, "squares", "Квадраты", () => ({
    code: L(`nums = ${numList(sample([1, 2, 3, 4, 5, 6], 4).sort((a, b) => a - b))}`, "squares = [x * x for x in nums]", "print(squares)"),
    explanation: "Генератор списка применяет выражение x * x к каждому элементу."
  }));

  // ================= Функции =================

  fill("functions", 3, "def", "Объяви функцию", () => {
    const hero = pick(HEROES);
    return {
      code: L("___ greet(name):", '    print("Привет,", name)', "", `greet(${str(hero)})` + says("Привет, " + hero)),
      options: ["def", "function", "func", "fun"],
      expect: "Привет, " + hero,
      explanation: "Функцию в Python объявляют словом def: def имя(параметры):"
    };
  });

  fill("functions", 3, "return", "Верни результат", () => {
    const f = pick([
      { name: "double", body: "x * 2", calc: (x) => x * 2 },
      { name: "triple", body: "x * 3", calc: (x) => x * 3 },
      { name: "add_ten", body: "x + 10", calc: (x) => x + 10 }
    ]);
    const n = rnd(2, 12);
    return {
      code: L(`def ${f.name}(x):`, `    ___ ${f.body}`, "", `print(${f.name}(${n}))` + says(f.calc(n))),
      options: ["return", "print", "pass", "yield"],
      expect: String(f.calc(n)),
      explanation: "return отдаёт результат туда, где функцию вызвали. print, pass и yield этого не делают."
    };
  });

  fill("functions", 3, "argument", "Подлечи героя", () => {
    const n = rnd(20, 60);
    const k = pick([10, 20, 30]);
    return {
      code: L("def heal(hp):", `    return hp + ${k}`, "", "print(heal(___))" + says(n + k)),
      options: [String(n), String(n + k), String(k), "hp"],
      expect: String(n + k),
      explanation: `Аргумент ${n} попадает в параметр hp, и функция возвращает ${n} + ${k} = ${n + k}.`
    };
  });

  fill("functions", 3, "param", "Параметр урона", () => {
    const hp = rnd(60, 120);
    const d = rnd(10, 40);
    return {
      code: L("def hit(hp, ___):", "    return hp - damage", "", `print(hit(${hp}, ${d}))` + says(hp - d)),
      options: ["damage", "hp", String(d), "dmg"],
      expect: String(hp - d),
      explanation: "Внутри функции используется имя damage, значит, так и должен называться второй параметр."
    };
  });

  fill("functions", 3, "call", "Вызови функцию", () => {
    const f = pick([["roar", "Р-р-р!"], ["battle_cry", "За короля!"], ["hello", "Привет!"]]);
    return {
      code: L(`def ${f[0]}():`, `    return ${str(f[1])}`, "", "print(___)" + says(f[1])),
      options: [`${f[0]}()`, f[0], str(f[0]), `${f[0]}[]`],
      expect: f[1],
      explanation: `Чтобы функция выполнилась, её вызывают со скобками: ${f[0]}(). Без скобок print покажет саму функцию.`
    };
  });

  fill("functions", 4, "default", "Значение по умолчанию", () => {
    const p = rnd(5, 20);
    const b = rnd(2, 9);
    return {
      code: L("def attack(power, bonus=___):", "    return power + bonus", "", `print(attack(${p}))` + says(p + b)),
      options: [String(b), String(p + b), String(p), "0"],
      expect: String(p + b),
      explanation: `bonus при вызове не передали, поэтому берётся значение по умолчанию: ${p} + ${b} = ${p + b}.`
    };
  });

  fill("functions", 4, "keyword", "Аргументы по имени", () => {
    const w = rnd(6, 12);
    const h = rnd(1, 5);
    return {
      code: L("def room(w, h):", "    return w - h", "", `print(room(h=${h}, ___=${w}))` + says(w - h)),
      options: ["w", "h", "x", "room"],
      expect: String(w - h),
      explanation: `Аргументы можно передавать по имени в любом порядке: h=${h}, w=${w}, и функция считает ${w} - ${h} = ${w - h}.`
    };
  });

  fill("functions", 4, "return_bool", "Жив ли герой", () => {
    const hp = rnd(5, 60);
    return {
      code: L("def is_alive(hp):", "    return hp ___ 0", "", `print(is_alive(${hp}))` + says("True")),
      options: [">", "<", "==", "<="],
      expect: "True",
      explanation: `Герой жив, пока здоровье больше нуля: hp > 0. Для ${hp} это True.`
    };
  });

  bug("functions", 3, "def_colon", "Заклинание не работает", () => {
    const f = pick([["heal", "hp", "hp + 20"], ["double", "x", "x * 2"], ["greet", "name", '"Привет, " + name']]);
    return {
      code: L(`def ${f[0]}(${f[1]})`, `    return ${f[2]}`),
      options: [
        `Забыто двоеточие после def ${f[0]}(${f[1]})`,
        "return нельзя писать внутри функции",
        `Параметр ${f[1]} нужно взять в кавычки`,
        `Функцию нельзя называть ${f[0]}`
      ],
      raises: "SyntaxError",
      fix: L(`def ${f[0]}(${f[1]}):`, `    return ${f[2]}`),
      explanation: "Строка с def заканчивается двоеточием: за ним идёт тело функции с отступом."
    };
  });

  bug("functions", 3, "call_before_def", "Приветствие не работает", () => {
    const hero = pick(HEROES);
    return {
      code: L(`greet(${str(hero)})`, "", "def greet(name):", '    print("Привет,", name)'),
      options: [
        "Функцию вызывают раньше, чем её объявили",
        "Имя функции должно начинаться с большой буквы",
        "У функции должно быть два параметра",
        "Внутри функции нельзя вызывать print"
      ],
      raises: "NameError",
      fix: L("def greet(name):", '    print("Привет,", name)', "", `greet(${str(hero)})`),
      explanation: "Python читает программу сверху вниз: в первой строке функции greet ещё нет. Сначала def, потом вызов."
    };
  });

  bug("functions", 3, "missing_arg", "Зелье не действует", () => {
    const k = pick([10, 20, 30]);
    return {
      code: L("def heal(hp):", `    return hp + ${k}`, "", "print(heal())"),
      options: [
        "heal ждёт аргумент hp, а её вызвали без него",
        "return должен стоять перед def",
        "Функцию нельзя вызывать внутри print",
        "У функции не может быть параметров"
      ],
      raises: "TypeError",
      fix: L("def heal(hp):", `    return hp + ${k}`, "", "print(heal(50))"),
      explanation: "У heal есть параметр hp, поэтому при вызове нужно передать значение, например heal(50)."
    };
  });

  bug("functions", 3, "print_not_return", "Удвоенный урон", () => {
    const n = rnd(3, 12);
    return {
      code: L("def double(x):", "    print(x * 2)", "", `result = double(${n})`, "print(result + 1)"),
      options: [
        "Функция печатает результат, но не возвращает его: нужен return",
        "x нельзя умножать на 2",
        "Переменную result нельзя складывать с числом",
        "Имя double занято самим Python"
      ],
      raises: "TypeError",
      fix: L("def double(x):", "    return x * 2", "", `result = double(${n})`, "print(result + 1)"),
      explanation: "Без return функция возвращает None, и в result попадает None. None + 1 — ошибка. print только показывает число на экране."
    };
  });

  bug("functions", 3, "body_indent", "Монстр молчит", () => {
    const f = pick([["roar", "Р-р-р!"], ["cheer", "Ура!"], ["warn", "Осторожно!"]]);
    return {
      code: L(`def ${f[0]}():`, `print(${str(f[1])})`, "", `${f[0]}()`),
      options: [
        "Тело функции нужно писать с отступом",
        "После def не ставят двоеточие",
        "У функции обязательно должен быть параметр",
        "Функцию нельзя вызывать без print"
      ],
      raises: "IndentationError",
      fix: L(`def ${f[0]}():`, `    print(${str(f[1])})`, "", `${f[0]}()`),
      explanation: "Всё, что входит в функцию, пишут с отступом под строкой def."
    };
  });

  bug("functions", 4, "early_return", "Сумма добычи", () => {
    const nums = [rnd(2, 9), rnd(2, 9), rnd(2, 9)];
    const s = nums[0] + nums[1] + nums[2];
    return {
      code: L("def total(nums):", "    s = 0", "    for x in nums:", "        s += x", "        return s", "",
        `print(total(${numList(nums)}))` + wants(s)),
      options: [
        "return стоит внутри цикла: функция выходит после первого числа",
        "s = 0 нужно писать вне функции",
        "Список нельзя передавать в функцию",
        "Вместо s += x нужно s = x"
      ],
      expect: String(s),
      fix: L("def total(nums):", "    s = 0", "    for x in nums:", "        s += x", "    return s", "",
        `print(total(${numList(nums)}))`),
      explanation: "return сразу завершает функцию, поэтому внутри цикла он срабатывает на первом же числе. " +
        "Его сдвигают на уровень for — тогда он выполнится после цикла."
    };
  });

  bug("functions", 4, "extra_arg", "Зелье с сюрпризом", () => ({
    code: L("def heal(hp):", "    return hp + 20", "", `print(heal(${rnd(30, 60)}, ${rnd(5, 15)}))`),
    options: [
      "heal принимает один аргумент, а ей передали два",
      "Числа нужно передавать в кавычках",
      "print не может вызывать функции",
      "return должен стоять в конце программы"
    ],
    raises: "TypeError",
    fix: L("def heal(hp):", "    return hp + 20", "", "print(heal(50))"),
    explanation: "Сколько параметров в def, столько аргументов и передают при вызове. У heal параметр один — hp."
  }));

  bug("functions", 4, "local_var", "Золото из функции", () => {
    const n = rnd(10, 90);
    return {
      code: L("def find_gold():", `    gold = ${n}`, "", "find_gold()", "print(gold)"),
      options: [
        "gold создана внутри функции и снаружи не видна: её нужно вернуть через return",
        "Функцию нужно вызывать с аргументом",
        "Переменную нельзя называть gold",
        "Число нужно взять в кавычки"
      ],
      raises: "NameError",
      fix: L("def find_gold():", `    return ${n}`, "", "gold = find_gold()", "print(gold)"),
      explanation: "Переменные, созданные внутри функции, живут только в ней. Наружу значение передают через return."
    };
  });

  // ----- Добавлено под лекцию «Python: основы до ООП»: две ловушки -----
  // Изменяемое значение по умолчанию создаётся один раз, при определении функции.
  bug("functions", 4, "default_list", "Мешок не пустеет", () => {
    const items = sample(ITEMS, 2);
    return {
      code: L(
        "def take(item, bag=[]):",
        "    bag.append(item)",
        "    return bag",
        "",
        `take(${str(items[0])})`,
        `print(len(take(${str(items[1])})))`
      ) + wants("1"),
      options: [
        "Пустой список в значении по умолчанию создаётся один раз, поэтому мешок общий: нужно bag=None и список внутри",
        "append добавляет предмет дважды",
        "Нужно вернуть bag[:] вместо bag",
        "len считает вызовы функции, а не предметы"
      ],
      expect: "1",
      fix: L(
        "def take(item, bag=None):",
        "    if bag is None:",
        "        bag = []",
        "    bag.append(item)",
        "    return bag",
        "",
        `take(${str(items[0])})`,
        `print(len(take(${str(items[1])})))`
      ),
      explanation: `Значение по умолчанию создаётся один раз, при определении функции, поэтому «${items[0]}» остаётся в мешке и второй вызов его видит. ` +
        "Безопасный образец: bag=None, а внутри функции if bag is None: bag = []."
    };
  });

  // return items отдаёт ту же ссылку, а не копию.
  bug("collections", 4, "alias_copy", "Двойной инвентарь", () => {
    const items = sample(ITEMS, 2);
    const extra = pick(ITEMS.filter((w) => !items.includes(w)));
    const list = `[${items.map(str).join(", ")}]`;
    return {
      code: L(
        "def clone(items):",
        "    return items",
        "",
        `old = ${list}`,
        "new = clone(old)",
        `new.append(${str(extra)})`,
        "print(len(old))"
      ) + wants("2"),
      options: [
        "clone возвращает тот же список: копию делает return items[:]",
        "append добавляет предмет сразу в оба списка",
        "Список нельзя передавать в функцию",
        "Нужно печатать old, а не len(old)"
      ],
      expect: "2",
      fix: L(
        "def clone(items):",
        "    return items[:]",
        "",
        `old = ${list}`,
        "new = clone(old)",
        `new.append(${str(extra)})`,
        "print(len(old))"
      ),
      explanation: "return items отдаёт ту же ссылку, поэтому new и old — один список, и предмет из new попал в old. " +
        "Копию делает return items[:] или items.copy()."
    };
  });

  copy("functions", 3, "heal", "Заклинание лечения", () => {
    const k = pick([10, 20, 25]);
    return {
      code: L("def heal(hp):", `    return hp + ${k}`, `print(heal(${rnd(30, 70)}))`),
      explanation: `def объявляет функцию, return возвращает hp + ${k}, а print выводит результат вызова.`
    };
  });

  copy("functions", 3, "greet", "Приветствие", () => ({
    code: L("def greet(name):", '    print("Привет,", name)', `greet(${str(pick(HEROES))})`),
    explanation: "Функция принимает имя и печатает приветствие."
  }));

  copy("functions", 4, "default", "Удар с бонусом", () => {
    const b = rnd(2, 6);
    const p = rnd(8, 20);
    return {
      code: L(`def attack(power, bonus=${b}):`, "    return power + bonus", `print(attack(${p}))`, `print(attack(${p}, 1))`),
      explanation: `Если bonus не передать, берётся значение по умолчанию ${b}.`
    };
  });

  copy("functions", 4, "total", "Сумма добычи", () => ({
    code: L("def total(nums):", "    s = 0", "    for x in nums:", "        s += x", "    return s",
      `print(total(${numList([rnd(2, 9), rnd(2, 9), rnd(2, 9)])}))`),
    explanation: "Функция складывает числа в цикле и возвращает сумму после него."
  }));

  // ================= Исключения =================

  // Что ломает программу: код, название ошибки и её смысл.
  const EXC = [
    { name: "ZeroDivisionError", what: "деление на ноль",
      code: () => L("players = 0", `print(${rnd(10, 90)} / players)`) },
    { name: "IndexError", what: "в списке нет элемента с таким номером",
      code: () => L(`bag = ${strList(sample(ITEMS, 2))}`, `print(bag[${rnd(2, 5)}])`) },
    { name: "KeyError", what: "в словаре нет такого ключа",
      code: () => L(`hero = {"hp": ${rnd(40, 99)}}`, 'print(hero["gold"])') },
    { name: "ValueError", what: "строку не превратить в число",
      code: () => L(`level = int(${str(pick(["пять", "три", "много"]))})`) },
    { name: "TypeError", what: "строку и число не сложить",
      code: () => L(`print("HP: " + ${rnd(10, 99)})`) },
    { name: "NameError", what: "такого имени нет",
      code: () => L(`health = ${rnd(10, 99)}`, "print(helth)") }
  ];

  fill("errors", 4, "except", "Поймай ошибку", () => {
    const e = pick([
      { body: `print(${rnd(10, 50)} / 0)`, exc: "ZeroDivisionError", msg: "На ноль делить нельзя" },
      { body: `n = int(${str(pick(["пять", "много"]))})`, exc: "ValueError", msg: "Это не число" }
    ]);
    return {
      code: L("try:", "    " + e.body, `___ ${e.exc}:`, `    print(${str(e.msg)})` + says(e.msg)),
      options: ["except", "catch", "else", "finally"],
      expect: e.msg,
      explanation: "Ошибку ловят парой try и except: опасный код — в try, а что делать при ошибке — в except."
    };
  });

  fill("errors", 4, "which_except", "Какую ошибку ловить", () => {
    const pool = EXC.filter((x) => x.name !== "NameError");
    const e = pick(pool);
    const msg = pick(["Ошибка поймана", "Герой цел", "Обошлось"]);
    return {
      code: L("try:", ...e.code().split("\n").map((row) => "    " + row), "except ___:", `    print(${str(msg)})` + says(msg)),
      options: [e.name].concat(sample(pool.filter((x) => x !== e), 3).map((x) => x.name)),
      expect: msg,
      explanation: `Код в try бросает ${e.name} (${e.what}). except ловит только ту ошибку, которую в нём назвали.`
    };
  });

  fill("errors", 4, "try", "Начало ловушки", () => ({
    code: L("___:", `    hp = int(${str(pick(["сто", "десять", "много"]))})`, "except ValueError:", "    hp = 0", "print(hp)" + says(0)),
    options: ["try", "if", "do", "with"],
    expect: "0",
    explanation: "Блок, где может случиться ошибка, начинают словом try. Если там ошибка, выполняется except."
  }));

  bug("errors", 3, "which", "Что сломается?", () => {
    const e = pick(EXC);
    return {
      code: e.code(),
      options: [e.name + ": " + e.what].concat(sample(EXC.filter((x) => x !== e), 3).map((x) => x.name + ": " + x.what)),
      raises: e.name,
      explanation: `Здесь будет ${e.name}: ${e.what}.`
    };
  });

  bug("errors", 4, "wrong_except", "Ловушка не сработала", () => {
    const e = pick([
      { body: [`print(${rnd(10, 50)} / 0)`], real: "ZeroDivisionError", caught: "ValueError" },
      { body: [`n = int(${str(pick(["пять", "много"]))})`], real: "ValueError", caught: "ZeroDivisionError" },
      { body: ["bag = []", "print(bag[0])"], real: "IndexError", caught: "KeyError" }
    ]);
    const body = e.body.map((row) => "    " + row);
    return {
      code: L("try:", ...body, `except ${e.caught}:`, '    print("Ошибка!")'),
      options: [
        `except ловит ${e.caught}, а случится ${e.real}`,
        "После try не ставят двоеточие",
        "Внутри try нельзя вызывать print",
        "После except не пишут имя ошибки"
      ],
      raises: e.real,
      fix: L("try:", ...body, `except ${e.real}:`, '    print("Ошибка!")'),
      explanation: `except ловит только ту ошибку, которую в нём назвали. Здесь случится ${e.real}, а ловят ${e.caught} — программа всё равно упадёт.`
    };
  });

  bug("errors", 4, "try_alone", "Осторожное превращение", () => {
    const word = str(pick(["сто", "много"]));
    return {
      code: L("try:", `    hp = int(${word})`, "print(hp)"),
      options: [
        "После try обязательно нужен блок except",
        "int нельзя писать внутри try",
        "print должен стоять с отступом",
        "try пишут с большой буквы"
      ],
      raises: "SyntaxError",
      fix: L("try:", `    hp = int(${word})`, "except ValueError:", "    hp = 0", "print(hp)"),
      explanation: "try не живёт один: за ним идёт except (или finally), где сказано, что делать при ошибке."
    };
  });

  copy("errors", 4, "try_int", "Защита от ошибки", () => ({
    code: L("try:", `    n = int(${str(pick(["десять", "сто", "много"]))})`, "except ValueError:", '    print("Это не число")'),
    explanation: "try пробует выполнить код, а except ловит ValueError, если строку не превратить в число."
  }));

  copy("errors", 4, "try_div", "Делёж добычи", () => ({
    code: L("players = 0", "try:", `    print(${rnd(20, 90)} / players)`, "except ZeroDivisionError:", '    print("Некому делить")'),
    explanation: "Деление на ноль бросает ZeroDivisionError, а except её ловит."
  }));

  // ================= Модули и импорт =================

  fill("modules", 4, "import", "Подключи модуль", () => {
    const n = rnd(2, 12);
    return {
      code: L("___ math", `print(math.sqrt(${n * n}))` + says(n + ".0")),
      options: ["import", "include", "using", "require"],
      expect: n + ".0",
      explanation: "Модуль подключают словом import: import math. После этого доступны math.sqrt, math.pi и другие."
    };
  });

  fill("modules", 4, "math_func", "Нужная функция", () => {
    const mode = pick(["sqrt", "floor", "ceil"]);
    const why = {
      sqrt: "math.sqrt — квадратный корень, он всегда дробный: 16 даёт 4.0.",
      floor: "math.floor округляет вниз, до ближайшего меньшего целого.",
      ceil: "math.ceil округляет вверх, до ближайшего большего целого."
    };
    let arg;
    let want;
    if (mode === "sqrt") {
      const n = rnd(2, 12);
      arg = String(n * n);
      want = n + ".0";
    } else {
      const whole = rnd(2, 20);
      arg = whole + "." + rnd(1, 9);
      want = String(mode === "floor" ? whole : whole + 1);
    }
    return {
      code: L("import math", `print(math.___(${arg}))` + says(want)),
      options: [mode].concat(["sqrt", "floor", "ceil", "fabs"].filter((f) => f !== mode)),
      expect: want,
      explanation: why[mode]
    };
  });

  fill("modules", 4, "from_import", "Число пи", () => {
    const k = pick([2, 3]);
    const want = k === 2 ? "3.14" : "3.142";
    return {
      code: L("from math import ___", `print(round(pi, ${k}))` + says(want)),
      options: ["pi", "PI", "sqrt", "e"],
      expect: want,
      explanation: "from math import pi берёт из модуля только pi, и тогда его пишут без math. перед именем."
    };
  });

  fill("modules", 4, "random", "Бросок кубика", () => {
    const sides = pick([6, 12, 20]);
    return {
      code: L("import random", `roll = random.___(1, ${sides})`, `print(1 <= roll <= ${sides})` + says("True")),
      options: ["randint", "random", "choice", "shuffle"],
      expect: "True",
      explanation: `random.randint(1, ${sides}) — случайное целое число от 1 до ${sides} включительно, как бросок кубика.`
    };
  });

  bug("modules", 4, "no_import", "Квадратный корень", () => {
    const n = rnd(2, 12);
    return {
      code: `print(math.sqrt(${n * n}))`,
      options: [
        "Модуль math не подключён: в начале нужно import math",
        "sqrt пишется с большой буквы",
        "Корень можно взять только из 4",
        "math.sqrt пишут без точки"
      ],
      raises: "NameError",
      fix: L("import math", `print(math.sqrt(${n * n}))`),
      explanation: "Перед тем как пользоваться модулем, его подключают: import math."
    };
  });

  bug("modules", 4, "bad_name", "Корень из урона", () => {
    const n = rnd(2, 12);
    const wrong = pick(["squareroot", "root", "sqr"]);
    return {
      code: L("import math", `print(math.${wrong}(${n * n}))`),
      options: [
        `В модуле math нет функции ${wrong}: корень считает sqrt`,
        "import пишут с большой буквы",
        "Модуль подключают после print",
        "Число в скобках должно быть дробным"
      ],
      raises: "AttributeError",
      fix: L("import math", `print(math.sqrt(${n * n}))`),
      explanation: "Python ищет имя внутри модуля и не находит: функция корня в math называется sqrt."
    };
  });

  bug("modules", 4, "module_call", "Кубик не бросается", () => {
    const sides = pick([6, 12, 20]);
    return {
      code: L("import random", `print(random(1, ${sides}))`),
      options: [
        `random — модуль, а не функция: нужно random.randint(1, ${sides})`,
        "random пишут с большой буквы",
        "Числа должны быть в кавычках",
        "import random нужно писать в конце"
      ],
      raises: "TypeError",
      fix: L("import random", `print(random.randint(1, ${sides}))`),
      explanation: "Модуль — это набор функций, сам он не вызывается. Случайное число даёт функция модуля: random.randint."
    };
  });

  copy("modules", 4, "sqrt", "Модуль math", () => ({
    code: L("import math", `print(math.sqrt(${Math.pow(rnd(2, 12), 2)}))`),
    explanation: "import math подключает модуль, а math.sqrt считает квадратный корень."
  }));

  copy("modules", 4, "dice", "Кубик", () => ({
    code: L("import random", `roll = random.randint(1, ${pick([6, 12, 20])})`, 'print("Выпало", roll)'),
    explanation: "random.randint(a, b) даёт случайное целое число от a до b."
  }));

  copy("modules", 4, "circle", "Площадь круга", () => ({
    code: L("from math import pi", `r = ${rnd(2, 6)}`, "print(round(pi * r ** 2, 1))"),
    explanation: "from math import pi берёт число пи, а round(..., 1) округляет до десятых."
  }));

  // ================= «Напиши функцию» =================
  // Код проверяет сервер (/api/check) по проверкам задания: call — вызов,
  // expected — ожидаемое значение, оба на Python. solution — эталон для
  // verify_practice.py, игра его не показывает. В банке таких задач 11, и на
  // «Сложном», где это треть практики, они шли по кругу.

  const code = (topic, level, name, title, make) => add("code", topic, level, name, title, make);
  // Проверка: вызов функции и ожидаемое значение.
  const test = (call, expected) => ({ call: call, expected: String(expected) });
  const py = (v) => (typeof v === "string" ? str(v) : typeof v === "boolean" ? (v ? "True" : "False") : String(v));
  // Аргументы вызова через запятую: строки в кавычках, списки как в Python.
  const args = (...vals) => vals.map((v) => (Array.isArray(v) ? (typeof v[0] === "number" ? numList(v) : strList(v)) : py(v))).join(", ");
  const starter = (sig) => `def ${sig}:\n    pass`;
  // Три разных набора входных данных.
  const inputs = (makeOne) => {
    const out = [];
    const seen = {};
    for (let i = 0; i < 40 && out.length < 3; i++) {
      const v = makeOne(i);
      const k = JSON.stringify(v);
      if (!seen[k]) {
        seen[k] = true;
        out.push(v);
      }
    }
    return out;
  };

  code("operators", 2, "multiply", "Удар с множителем", () => {
    const k = rnd(2, 5);
    return {
      task: `Напиши функцию power_hit(damage), которая возвращает урон, умноженный на ${k}.`,
      starter: starter("power_hit(damage)"),
      tests: inputs(() => rnd(1, 40)).map((d) => test(`power_hit(${d})`, d * k)),
      solution: `def power_hit(damage):\n    return damage * ${k}`,
      explanation: `Функция возвращает произведение: return damage * ${k}.`
    };
  });

  code("operators", 2, "armor", "Урон сквозь броню", () => ({
    task: "Напиши функцию damage_after(damage, armor), которая возвращает урон, оставшийся после брони: урон минус броня.",
    starter: starter("damage_after(damage, armor)"),
    tests: inputs(() => [rnd(20, 60), rnd(1, 19)]).map((v) => test(`damage_after(${v[0]}, ${v[1]})`, v[0] - v[1])),
    solution: "def damage_after(damage, armor):\n    return damage - armor",
    explanation: "Нужно вернуть разность: return damage - armor."
  }));

  code("operators", 3, "share", "Делёж добычи", () => ({
    task: "Напиши функцию share(gold, heroes), которая возвращает, сколько целых монет достанется каждому герою, если золото поделить поровну.",
    starter: starter("share(gold, heroes)"),
    tests: inputs(() => [rnd(10, 99), rnd(2, 6)]).map((v) => test(`share(${v[0]}, ${v[1]})`, Math.floor(v[0] / v[1]))),
    solution: "def share(gold, heroes):\n    return gold // heroes",
    explanation: "Целую часть от деления даёт //: return gold // heroes. Обычное / вернуло бы дробное число."
  }));

  code("operators", 3, "leftover", "Остаток добычи", () => ({
    task: "Напиши функцию leftover(gold, heroes), которая возвращает, сколько монет останется, если поделить золото поровну между героями.",
    starter: starter("leftover(gold, heroes)"),
    tests: inputs(() => [rnd(10, 99), rnd(2, 6)]).map((v) => test(`leftover(${v[0]}, ${v[1]})`, v[0] % v[1])),
    solution: "def leftover(gold, heroes):\n    return gold % heroes",
    explanation: "Остаток от деления даёт %: return gold % heroes."
  }));

  code("types", 3, "parse_gold", "Золото из записки", () => {
    const k = rnd(2, 20);
    return {
      task: `В записке число золота записано строкой, например "15". Напиши функцию parse_gold(text), которая возвращает это число, увеличенное на ${k}.`,
      starter: starter("parse_gold(text)"),
      tests: inputs(() => rnd(1, 300)).map((n) => test(`parse_gold(${str(n)})`, n + k)),
      solution: `def parse_gold(text):\n    return int(text) + ${k}`,
      explanation: `Строку сначала превращают в число: return int(text) + ${k}. Иначе "15" + ${k} — ошибка.`
    };
  });

  code("types", 3, "hp_text", "Надпись над героем", () => ({
    task: 'Напиши функцию hp_text(hp), которая возвращает строку вида "HP: 30" для любого числа hp.',
    starter: starter("hp_text(hp)"),
    tests: inputs(() => rnd(0, 200)).map((n) => test(`hp_text(${n})`, str("HP: " + n))),
    solution: 'def hp_text(hp):\n    return "HP: " + str(hp)',
    explanation: 'Число превращают в строку и склеивают: return "HP: " + str(hp).'
  }));

  code("strings", 2, "shout", "Боевой клич", () => ({
    task: 'Напиши функцию shout(word), которая возвращает слово заглавными буквами и с восклицательным знаком: "орк" → "ОРК!".',
    starter: starter("shout(word)"),
    tests: inputs(() => pick(MONSTERS)).map((w) => test(`shout(${str(w)})`, str(w.toUpperCase() + "!"))),
    solution: 'def shout(word):\n    return word.upper() + "!"',
    explanation: 'upper() делает буквы заглавными, а + добавляет знак: return word.upper() + "!".'
  }));

  code("strings", 3, "initial", "Подпись на свитке", () => ({
    task: 'Напиши функцию initial(name), которая возвращает первую букву имени с точкой: "Маг" → "М.".',
    starter: starter("initial(name)"),
    tests: inputs(() => pick(HEROES)).map((h) => test(`initial(${str(h)})`, str(h[0] + "."))),
    solution: 'def initial(name):\n    return name[0] + "."',
    explanation: 'Первая буква — name[0], к ней приклеиваем точку: return name[0] + ".".'
  }));

  code("strings", 3, "count_letter", "Сколько букв", () => ({
    task: "Напиши функцию count_letter(word, letter), которая возвращает, сколько раз буква letter встречается в слове word.",
    starter: starter("count_letter(word, letter)"),
    tests: inputs(() => {
      const w = pick(["подземелье", "заклинание", "сокровище", "катакомбы", "лабиринт"]);
      return [w, pick(w.split(""))];
    }).map((v) => test(`count_letter(${str(v[0])}, ${str(v[1])})`, v[0].split(v[1]).length - 1)),
    solution: "def count_letter(word, letter):\n    return word.count(letter)",
    explanation: "У строки есть метод count: return word.count(letter)."
  }));

  code("control", 2, "can_open", "Тяжёлая дверь", () => {
    const k = rnd(2, 5);
    return {
      task: `Дверь открывается, если у героя не меньше ${k} ключей. Напиши функцию can_open(keys), которая возвращает True или False.`,
      starter: starter("can_open(keys)"),
      tests: [k - 1, k, k + rnd(1, 4)].map((n) => test(`can_open(${n})`, py(n >= k))),
      solution: `def can_open(keys):\n    return keys >= ${k}`,
      explanation: `«Не меньше» — это >=: return keys >= ${k}. Сравнение само даёт True или False.`
    };
  });

  code("control", 3, "heal_cap", "Лечение до предела", () => {
    const top = pick([100, 120, 150]);
    return {
      task: `Напиши функцию heal(hp, amount): здоровье растёт на amount, но не может быть больше ${top}. Верни новое здоровье.`,
      starter: starter("heal(hp, amount)"),
      tests: [[top - 50, 20], [top - 10, 30], [top - 5, 5]].map((v) => test(`heal(${v[0]}, ${v[1]})`, Math.min(top, v[0] + v[1]))),
      solution: `def heal(hp, amount):\n    return min(hp + amount, ${top})`,
      explanation: `Если сумма больше ${top}, вернуть ${top}: return min(hp + amount, ${top}) или то же через if.`
    };
  });

  code("control", 3, "rank", "Звание героя", () => {
    const a = pick([50, 100]);
    const b = a * pick([2, 3]);
    const rank = (xp) => (xp < a ? "новичок" : xp < b ? "воин" : "герой");
    return {
      task: `Напиши функцию rank(xp): если опыта меньше ${a}, вернуть "новичок", если меньше ${b} — "воин", иначе "герой".`,
      starter: starter("rank(xp)"),
      tests: [rnd(0, a - 1), rnd(a, b - 1), rnd(b, b + 100)].map((x) => test(`rank(${x})`, str(rank(x)))),
      solution: `def rank(xp):\n    if xp < ${a}:\n        return "новичок"\n    elif xp < ${b}:\n        return "воин"\n    else:\n        return "герой"`,
      explanation: "Цепочка if — elif — else проверяет условия по порядку и возвращает первое подходящее звание."
    };
  });

  code("control", 4, "turns", "Сколько ударов", () => ({
    task: "Напиши функцию turns(hp, damage), которая возвращает, сколько ударов по damage нужно, чтобы здоровье врага hp стало 0 или меньше.",
    starter: starter("turns(hp, damage)"),
    tests: inputs(() => [rnd(10, 90), rnd(3, 15)]).map((v) => test(`turns(${v[0]}, ${v[1]})`, Math.ceil(v[0] / v[1]))),
    solution: "def turns(hp, damage):\n    count = 0\n    while hp > 0:\n        hp -= damage\n        count += 1\n    return count",
    explanation: "Цикл while бьёт, пока hp > 0, и считает удары. Можно и формулой: (hp + damage - 1) // damage."
  }));

  code("collections", 3, "has_item", "Есть ли в сумке", () => ({
    task: "Напиши функцию has_item(bag, item), которая возвращает True, если предмет item есть в списке bag, и False, если нет.",
    starter: starter("has_item(bag, item)"),
    tests: (() => {
      const bag = sample(ITEMS, 3);
      const other = pick(ITEMS.filter((x) => bag.indexOf(x) < 0));
      return [test(`has_item(${args(bag, bag[0])})`, "True"), test(`has_item(${args(bag, other)})`, "False"),
        test(`has_item(${args([bag[1]], bag[1])})`, "True")];
    })(),
    solution: "def has_item(bag, item):\n    return item in bag",
    explanation: "Оператор in сам отвечает True или False: return item in bag."
  }));

  code("collections", 3, "bag_full", "Полная сумка", () => {
    const limit = rnd(3, 5);
    return {
      task: `Сумка вмещает ${limit} ${plural(limit, "предмет", "предмета", "предметов")}. Напиши функцию bag_full(bag), ` +
        `которая возвращает True, если в списке bag уже ${limit} ${plural(limit, "предмет", "предмета", "предметов")} или больше.`,
      starter: starter("bag_full(bag)"),
      tests: [limit - 1, limit, limit + 1].map((n) => test(`bag_full(${strList(sample(ITEMS, n))})`, py(n >= limit))),
      solution: `def bag_full(bag):\n    return len(bag) >= ${limit}`,
      explanation: `len(bag) — число предметов. Сумка полна, когда len(bag) >= ${limit}.`
    };
  });

  code("collections", 4, "count_kind", "Перепись монстров", () => ({
    task: "Напиши функцию count_kind(monsters, kind), которая возвращает, сколько раз монстр kind встречается в списке monsters.",
    starter: starter("count_kind(monsters, kind)"),
    tests: inputs(() => {
      const kinds = sample(MONSTERS, 3);
      const list = [];
      for (let i = 0; i < rnd(4, 6); i++) list.push(pick(kinds));
      return [list, pick(kinds)];
    }).map((v) => test(`count_kind(${args(v[0], v[1])})`, v[0].filter((m) => m === v[1]).length)),
    solution: "def count_kind(monsters, kind):\n    return monsters.count(kind)",
    explanation: "У списка есть метод count: return monsters.count(kind). Можно и циклом со счётчиком."
  }));

  code("collections", 4, "price_of", "Цена в лавке", () => {
    const goods = sample(ITEMS, 3);
    const prices = goods.slice(0, 2).map(() => rnd(10, 90));
    const dict = `{${str(goods[0])}: ${prices[0]}, ${str(goods[1])}: ${prices[1]}}`;
    return {
      task: "Напиши функцию price_of(prices, item): верни цену предмета из словаря prices, а если такого предмета нет — 0.",
      starter: starter("price_of(prices, item)"),
      tests: [test(`price_of(${dict}, ${str(goods[0])})`, prices[0]), test(`price_of(${dict}, ${str(goods[1])})`, prices[1]),
        test(`price_of(${dict}, ${str(goods[2])})`, 0)],
      solution: "def price_of(prices, item):\n    return prices.get(item, 0)",
      explanation: "get возвращает запасное значение, если ключа нет: return prices.get(item, 0)."
    };
  });

  code("collections", 4, "weakest", "Слабейший удар", () => ({
    task: "Напиши функцию weakest(hits), которая возвращает самый слабый удар — наименьшее число в списке hits.",
    starter: starter("weakest(hits)"),
    tests: inputs(() => [rnd(5, 40), rnd(5, 40), rnd(5, 40), rnd(5, 40)]).map((v) => test(`weakest(${numList(v)})`, Math.min.apply(null, v))),
    solution: "def weakest(hits):\n    return min(hits)",
    explanation: "Наименьшее число в списке даёт min: return min(hits)."
  }));

  code("functions", 4, "default_bonus", "Удар с бонусом", () => {
    const k = rnd(2, 9);
    return {
      task: `Напиши функцию attack(power, bonus=${k}), которая возвращает power + bonus. Если bonus не передали, он равен ${k}.`,
      starter: starter(`attack(power, bonus=${k})`),
      tests: (() => {
        const p = rnd(5, 30);
        const b = rnd(1, 9);
        return [test(`attack(${p})`, p + k), test(`attack(${p}, ${b})`, p + b), test(`attack(0)`, k)];
      })(),
      solution: `def attack(power, bonus=${k}):\n    return power + bonus`,
      explanation: `Значение по умолчанию уже записано в def, остаётся вернуть сумму: return power + bonus.`
    };
  });

  code("functions", 4, "heal_twice", "Двойное зелье", () => {
    const k = pick([10, 15, 20]);
    return {
      task: `Функция heal уже есть: она добавляет ${k} здоровья. Напиши функцию heal_twice(hp), которая лечит дважды — вызывает heal два раза.`,
      starter: `def heal(hp):\n    return hp + ${k}\n\n\ndef heal_twice(hp):\n    pass`,
      tests: inputs(() => rnd(10, 80)).map((n) => test(`heal_twice(${n})`, n + 2 * k)),
      solution: `def heal(hp):\n    return hp + ${k}\n\n\ndef heal_twice(hp):\n    return heal(heal(hp))`,
      explanation: "Функция может вызывать другую функцию: return heal(heal(hp)) — результат первого лечения идёт во второе."
    };
  });

  // ================= Сборка задания =================

  // В блоке кода на телефоне помещается около 40 знаков, дальше строка
  // прокручивается вбок, и подсказка «# выведет» в её конце пряталась за
  // краем. Длинную строку делим: код остаётся, подсказка встаёт под ним.
  const MAX_LINE = 38;
  function fitLines(code) {
    return code.split("\n").map((line) => {
      const m = /^(\s*)(.*?)  (# (?:выведет|выведет только|нужно получить): .*)$/.exec(line);
      if (!m || line.length <= MAX_LINE) return line;
      return m[1] + m[2] + "\n" + m[1] + m[3];
    }).join("\n");
  }

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  // Задание в том же виде, что и в банке code-tasks.js. Шаблон со
  // случайными числами иногда даёт два одинаковых варианта ответа — такой
  // вариант выбрасываем и собираем заново.
  function build(t) {
    for (let tries = 0; tries < 30; tries++) {
      const v = t.make();
      if ((t.kind === "fill" || t.kind === "error") && (!v.options || v.options.length !== 4 || !distinct(v.options))) continue;
      if (t.kind === "code" && (!v.tests || v.tests.length < 2)) continue;
      // Номер задания — по тому, что ученик узнаёт в лицо: по коду, а у
      // «напиши функцию» — по условию (проверки он не видит). Тот же код с
      // другими вариантами ответа для него то же самое задание.
      const body = t.kind === "code" ? v.task + "|" + v.starter : v.code;
      const task = {
        id: "gen." + t.key + "." + hash(body),
        title: t.title,
        topic: t.topic,
        level: t.level,
        explanation: v.explanation,
        generated: true,
        template: t.key
      };
      if (t.kind === "code") {
        task.task = v.task;
        task.starter = v.starter;
        task.tests = v.tests;
        task.solution = v.solution;
      } else {
        task.code = fitLines(v.code);
      }
      if (t.kind === "copy") {
        task.task = "Перепиши код в точности так, как он написан." + (/\n /.test(v.code) ? " Соблюдай отступы!" : "");
      } else if (t.kind !== "code") {
        task.options = v.options.slice();
        task.answer = 0;
      }
      if (v.expect !== undefined) task.expect = String(v.expect);
      if (v.raises) task.raises = v.raises;
      if (v.fix) task.fix = v.fix;
      return task;
    }
    return null;
  }

  const BY_KEY = {};
  TEMPLATES.forEach((t) => {
    BY_KEY[t.key] = t;
  });

  const api = {
    // Каталог шаблонов: вид, тема и уровень, без самих заданий.
    list: TEMPLATES.map((t) => ({ key: t.key, kind: t.kind, topic: t.topic, level: t.level })),
    // Новое задание по ключу шаблона или null, если такого шаблона нет.
    make: (key) => (BY_KEY[key] ? build(BY_KEY[key]) : null)
  };

  if (typeof window !== "undefined") window.PracticeVariants = api;
})();
