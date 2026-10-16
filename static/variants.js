// Генератор вариаций вопросов: код, переменные и значения меняются каждый раз.
// Дополняет статический банк QUESTIONS динамическими вариантами.
(function () {
  "use strict";

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const pyList = (arr) => "[" + arr.map((x) => '"' + x + '"').join(", ") + "]";

  function numWrongs(c, count) {
    const pool = [c + 1, c - 1, c + 2, c - 2, c + 3, c * 2, c - 3];
    const out = [];
    for (const v of pool) {
      if (v !== c && !out.includes(v)) out.push(v);
      if (out.length >= (count || 3)) break;
    }
    let k = 4;
    while (out.length < (count || 3)) {
      if (!out.includes(c + k)) out.push(c + k);
      k++;
    }
    return out;
  }

  function options(correct, wrongs) {
    const c = String(correct);
    const opts = [];
    const seen = { };
    seen[c] = true;
    for (const w of wrongs || []) {
      const s = String(w);
      if (!seen[s]) { seen[s] = true; opts.push(s); }
      if (opts.length === 3) break;
    }
    let k = 1;
    while (opts.length < 3) {
      const s = c + " #" + k;
      if (!seen[s]) { seen[s] = true; opts.push(s); }
      k++;
    }
    const at = rnd(0, 3);
    const full = opts.slice(0, 3);
    full.splice(at, 0, c);
    return { options: full, answer: at };
  }

  // Строгий вариант options(): все три неверных варианта обязаны отличаться
  // от правильного. Обычный options() в таком случае подставляет заглушки
  // вида «12 #1», которые никто не назовёт ответом на вопрос о списках.
  function mcOptions(correct, wrongs, filler) {
    const seen = {};
    seen[String(correct)] = true;
    const pool = [];
    (wrongs || []).forEach((w) => {
      const s = String(w);
      if (!seen[s]) {
        seen[s] = true;
        pool.push(s);
      }
    });
    for (let i = 1; pool.length < 3 && i < 40 && filler; i++) {
      const s = String(filler(i));
      if (!seen[s]) {
        seen[s] = true;
        pool.push(s);
      }
    }
    const opts = pool.slice(0, 3);
    const at = rnd(0, 3);
    opts.splice(at, 0, String(correct));
    return { options: opts, answer: at };
  }

  const NAME = ["Герой", "Орк", "Путник", "Стрелок", "Маг"];
  const WEAPON = ["меч", "щит", "зелье", "лук", "копьё", "топор"];
  const WORD = ["дракон", "орк", "слизь", "скелет", "тролль", "гоблин"];

  // Каждая функция возвращает один случайный вопрос.
  const TEMPLATES = [
    // 1. Арифметика
    () => {
      const a = rnd(2, 9), b = rnd(2, 9), op = pick(["+", "-", "*"]);
      const val = op === "+" ? a + b : op === "-" ? a - b : a * b;
      const q = options(val, numWrongs(val));
      return { topic: "operators", level: op === "*" ? 2 : 1, text: "Что выведет этот код?",
        code: "print(" + a + " " + op + " " + b + ")",
        options: q.options, answer: q.answer,
        explanation: "Порядок и знак: " + a + " " + op + " " + b + " = " + val + "." };
    },
    // 2. Целочисленное деление / остаток
    () => {
      const a = rnd(7, 30), b = rnd(2, 6), op = pick(["//", "%"]);
      const div = Math.floor(a / b), mod = a % b;
      const val = op === "//" ? div : mod;
      const wrongs = op === "//" ? [mod, a * b, Math.round(a / b)] : [div, a + b, b];
      const q = options(val, wrongs.concat(numWrongs(val)));
      return { topic: "operators", level: 2, text: "Что выведет этот код?",
        code: "print(" + a + " " + op + " " + b + ")",
        options: q.options, answer: q.answer,
        explanation: (op === "//" ? "// — целая часть деления" : "% — остаток от деления") +
          ": " + a + " " + op + " " + b + " = " + val + "." };
    },
    // 3. Степень
    () => {
      const a = rnd(2, 6), b = rnd(2, 3);
      const val = Math.pow(a, b);
      const q = options(val, [a * b, a + b, Math.pow(b, a)]);
      return { topic: "operators", level: 2, text: "Что выведет этот код?",
        code: "print(" + a + " ** " + b + ")",
        options: q.options, answer: q.answer,
        explanation: "** — возведение в степень: " + a + " ** " + b + " = " + val + "." };
    },
    // 4. Склейка строк
    () => {
      const a = rnd(1, 9), b = rnd(1, 9);
      const correct = "" + a + b;
      const q = options(correct, [a + b, a + " " + b, b + "" + a]);
      return { topic: "types", level: 2, text: "Что выведет этот код?",
        code: 'print(str(' + a + ") + str(" + b + "))",
        options: q.options, answer: q.answer,
        explanation: "str() делает строки, а + их склеивает: получится " + correct + "." };
    },
    // 5. Повтор строки
    () => {
      const w = pick(["ха", "ау", "но"]), n = rnd(2, 4);
      const correct = w.repeat(n);
      const q = options(correct, [w.repeat(n - 1), w + " " + n, w.repeat(n) + w]);
      return { topic: "strings", level: 2, text: "Что выведет этот код?",
        code: 'print("' + w + '" * ' + n + ")",
        options: q.options, answer: q.answer,
        explanation: "Умножение строки на число повторяет её " + n + " раз: " + correct + "." };
    },
    // 6. Длина строки
    () => {
      const w = pick(WORD);
      const val = w.length;
      const q = options(val, numWrongs(val));
      return { topic: "strings", level: 2, text: "Что выведет этот код?",
        code: 'print(len("' + w + '"))',
        options: q.options, answer: q.answer,
        explanation: "len() считает число символов: в слове «" + w + "» их " + val + "." };
    },
    // 7. Индекс списка
    () => {
      const arr = shuffle(WEAPON.slice()).slice(0, 5);
      const i = rnd(0, 4);
      const correct = arr[i];
      const q = options(correct, arr.filter((x) => x !== correct));
      return { topic: "collections", level: 2, text: "Что выведет этот код?",
        code: "print(" + pyList(arr) + "[" + i + "])",
        options: q.options, answer: q.answer,
        explanation: "Индекс " + i + " — это элемент номер " + (i + 1) + ", то есть «" + correct + "»." };
    },
    // 8. Отрицательный индекс
    () => {
      const arr = shuffle(WEAPON.slice()).slice(0, 4);
      const k = rnd(1, 3);
      const correct = arr[arr.length - k];
      const q = options(correct, arr.filter((x) => x !== correct));
      return { topic: "collections", level: 3, text: "Что выведет этот код?",
        code: "print(" + pyList(arr) + "[-" + k + "])",
        options: q.options, answer: q.answer,
        explanation: "Индекс -" + k + " считает с конца: «" + correct + "»." };
    },
    // 9. Срез списка
    () => {
      const arr = shuffle(WEAPON.slice()).slice(0, 5);
      const start = rnd(0, 1), take = rnd(2, 3);
      const correct = pyList(arr.slice(start, start + take));
      const q = options(correct, [
        pyList(arr.slice(start, start + take - 1)),
        pyList(arr.slice(start + 1, start + 1 + take)),
        pyList(arr.slice(start, start + take + 1))
      ]);
      return { topic: "collections", level: 3, text: "Что выведет этот код?",
        code: "print(" + pyList(arr) + "[" + start + ":" + (start + take) + "])",
        options: q.options, answer: q.answer,
        explanation: "Срез берёт элементы с " + start + " по " + (start + take - 1) + ", последний не включается." };
    },
    // 10. Сколько раз выполнится for range(n)
    () => {
      const n = rnd(2, 6);
      const q = options(n, numWrongs(n));
      return { topic: "control", level: 2, text: "Сколько чисел выведет этот код?",
        code: "for i in range(" + n + "):\n    print(i)",
        options: q.options, answer: q.answer,
        explanation: "range(" + n + ") даёт числа от 0 до " + (n - 1) + " — всего " + n + "." };
    },
    // 11. range(a, b)
    () => {
      const a = rnd(1, 3), b = a + rnd(2, 4);
      const val = b - a;
      const q = options(val, numWrongs(val));
      return { topic: "control", level: 3, text: "Сколько чисел выведет этот код?",
        code: "for i in range(" + a + ", " + b + "):\n    print(i)",
        options: q.options, answer: q.answer,
        explanation: "range(" + a + ", " + b + ") даёт числа с " + a + " по " + (b - 1) + " — это " + val + "." };
    },
    // 12. while
    () => {
      const start = rnd(3, 6);
      const q = options(start, numWrongs(start));
      return { topic: "control", level: 3, text: "Сколько чисел выведет этот код?",
        code: "i = " + start + "\nwhile i > 0:\n    print(i)\n    i = i - 1",
        options: q.options, answer: q.answer,
        explanation: "Цикл идёт от " + start + " до 1 — всего " + start + " повторений." };
    },
    // 13. bool
    () => {
      const cases = [
        { v: "0", b: false, code: "print(bool(0))" },
        { v: "1", b: true, code: "print(bool(1))" },
        { v: '"орк"', b: true, code: 'print(bool("орк"))' },
        { v: '""', b: false, code: 'print(bool(""))' },
        { v: "[]", b: false, code: "print(bool([]))" },
        { v: "[1, 2]", b: true, code: "print(bool([1, 2]))" }
      ];
      const c = pick(cases);
      const correct = c.b ? "True" : "False";
      const q = options(correct, [c.b ? "False" : "True", "None", "0"]);
      return { topic: "types", level: 3, text: "Что выведет этот код?",
        code: c.code, options: q.options, answer: q.answer,
        explanation: "Пустое и ноль — ложь, остальное — истина: результат " + correct + "." };
    },
    // 14. Сравнение
    () => {
      const a = rnd(1, 9), b = rnd(1, 9), op = pick(["==", "!=", ">", "<"]);
      let val;
      if (op === "==") val = a === b;
      else if (op === "!=") val = a !== b;
      else if (op === ">") val = a > b;
      else val = a < b;
      const correct = val ? "True" : "False";
      const q = options(correct, [val ? "False" : "True", "" + a + b, "Ошибка"]);
      return { topic: "operators", level: 2, text: "Что выведет этот код?",
        code: "print(" + a + " " + op + " " + b + ")",
        options: q.options, answer: q.answer,
        explanation: "Сравнение " + a + " " + op + " " + b + " — это " + correct + "." };
    },
    // 15. Методы строк
    () => {
      const w = pick(["меч", "щит", "орк", "лук"]);
      const up = pick([true, false]);
      const correct = up ? w.toUpperCase() : w.toUpperCase().toLowerCase();
      const q = options(correct, [up ? w.toUpperCase().toLowerCase() : w.toUpperCase(), w + "!", w.length]);
      return { topic: "strings", level: 2, text: "Что выведет этот код?",
        code: 'print("' + w + '".' + (up ? "upper" : "lower") + "())",
        options: q.options, answer: q.answer,
        explanation: "." + (up ? "upper()" : "lower()") + " меняет регистр букв: " + correct + "." };
    },
    // 16. max / min
    () => {
      const nums = [rnd(1, 40), rnd(1, 40), rnd(1, 40), rnd(1, 40)];
      const up = pick([true, false]);
      const val = up ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
      const others = nums.filter((x) => x !== val);
      const q = options(val, others.concat(numWrongs(val)));
      return { topic: "collections", level: 3, text: "Что выведет этот код?",
        code: "print(" + (up ? "max" : "min") + "([" + nums.join(", ") + "]))",
        options: q.options, answer: q.answer,
        explanation: (up ? "max()" : "min()") + " возвращает " +
          (up ? "наибольшее" : "наименьшее") + " число: " + val + "." };
    },
    // 17. f-строка
    () => {
      const nm = pick(NAME), hp = rnd(10, 99);
      const correct = "У " + nm + " " + hp + " HP";
      const q = options(correct, [
        "У " + nm + " hp HP",
        "У {nm} " + hp + " HP",
        "У " + nm + " " + hp
      ]);
      return { topic: "strings", level: 3, text: "Что выведет этот код?",
        code: 'name = "' + nm + '"\nhp = ' + hp + '\nprint(f"У {name} {hp} HP")',
        options: q.options, answer: q.answer,
        explanation: "f-строка подставляет значения переменных из {…}." };
    },
    // 18. Словарь
    () => {
      const has = pick([true, false]);
      const correct = "" + (has ? 42 : 0);
      const q = options(correct, has ? ["0", "None", "Ошибка"] : ["42", "None", "Ошибка"]);
      const code = 'hero = {"hp": 42}\nprint(hero.get("' + (has ? "hp" : "mp") + '", 0))';
      return { topic: "collections", level: 3, text: "Что выведет этот код?",
        code: code, options: q.options, answer: q.answer,
        explanation: has ? "Ключ есть — вернётся значение 42."
          : "Ключа нет — get() вернёт второй аргумент, 0." };
    },

    // ================= Строгие задания (level 4) =================
    // Последние этажи (Проклятый склеп, Тронный зал, Логово дракона) просят
    // qmin: 4. Раньше для них не было НИ ОДНОГО вариативного вопроса —
    // только 21 статический, и они повторялись до приторности.

    // 19. Сортировка и разворот
    () => {
      const arr = shuffle(WEAPON.slice()).slice(0, 4);
      const up = pick([true, false]);
      const correct = pyList(up ? arr.slice().sort() : arr.slice().reverse());
      const src = pyList(arr);
      const q = mcOptions(correct, [
        pyList(arr),
        pyList(up ? arr.slice().reverse() : arr.slice().sort()),
        pyList(arr.slice(1).concat([arr[0]]))
      ], (i) => pyList(arr.slice(i).concat(arr.slice(0, i))));
      return { topic: "collections", level: 4, text: "Что выведет этот код?",
        code: "a = " + src + "\nprint(" + (up ? "sorted(a)" : "a[::-1]") + ")",
        options: q.options, answer: q.answer,
        explanation: up ? "sorted() возвращает новый отсортированный список, исходный не меняется."
          : "Срез с шагом −1 разворачивает список." };
    },
    // 20. Перебор словаря
    () => {
      const names = shuffle(NAME.concat(["Тролль", "Кобольд"])).slice(0, 3);
      const which = rnd(0, 2);
      const dict = names.map((n, i) => '"' + n + '": ' + (i + 2) * 5).join(", ");
      const correct = String((which + 2) * 5);
      const q = mcOptions(correct, names.map((_, i) => String((i + 2) * 5 + 5)),
        (i) => String((which + 2) * 5 + 10 * (i + 1)));
      return { topic: "collections", level: 4, text: "Что выведет этот код?",
        code: "h = {" + dict + "}\nprint(h['" + names[which] + "'])",
        options: q.options, answer: q.answer,
        explanation: "Ключ «" + names[which] + "» хранит значение " + correct + "." };
    },
    // 21. Генераторное выражение
    () => {
      const n = rnd(3, 6);
      const val = n * (n - 1); // сумма 2·x при x от 0 до n−1
      const q = options(val, numWrongs(val), (i) => n + i);
      return { topic: "collections", level: 4, text: "Что выведет этот код?",
        code: "print(sum(x * 2 for x in range(" + n + ")))",
        options: q.options, answer: q.answer,
        explanation: "Сумма чисел от 0 до " + (n - 1) + ", удвоенных: 2 × " +
          (n * (n - 1) / 2) + " = " + val + "." };
    },
    // 22. Вложенный цикл
    () => {
      const a = rnd(2, 4), b = rnd(2, 4);
      const val = a * b;
      const q = options(val, numWrongs(val));
      return { topic: "control", level: 4, text: "Сколько чисел выведет этот код?",
        code: "for i in range(" + a + "):\n    for j in range(" + b + "):\n        print(i, j)",
        options: q.options, answer: q.answer,
        explanation: "Внутренний цикл выполнится " + a + " раз, по " + b + " шага каждый: " + val + "." };
    },
    // 23. break в цикле
    () => {
      const arr = shuffle(WEAPON.concat(["кирка", "факел"])).slice(0, 5);
      const i = rnd(1, 3);
      // break стоит ДО print, поэтому напечатаны элементы до arr[i],
      // а сам arr[i] уже не выводится.
      const correct = pyList(arr.slice(0, i));
      const q = mcOptions(correct, [
        pyList(arr.slice(0, i + 1)),
        pyList(arr),
        pyList(arr.slice(i))
      ], () => pyList(arr.slice(1).concat([arr[0]])));
      return { topic: "control", level: 4, text: "Что выведет этот код?",
        // Собираем результат в список: иначе print(x) даёт по строке на
        // элемент, и ответ «список» не совпадает с настоящим выводом.
        code: "a = " + pyList(arr) + "\nout = []\nfor x in a:\n    if x == '" +
          arr[i] + "':\n        break\n    out.append(x)\nprint(out)",
        options: q.options, answer: q.answer,
        explanation: "break выходит из цикла ДО append, поэтому «" + arr[i] +
          "» в список не попадает." };
    },
    // 24. Функция с возвратом
    () => {
      const n = rnd(2, 9);
      const sq = n * n;
      const q = options(sq, [n + 2, n * 3, n + n + 1].concat(numWrongs(sq)),
        (i) => sq + i);
      return { topic: "functions", level: 4, text: "Что выведет этот код?",
        code: "def f(x):\n    return x * x\n\nprint(f(" + n + "))",
        options: q.options, answer: q.answer,
        explanation: "return отдаёт результат, f(" + n + ") = " + sq + "." };
    },
    // 25. Значение по умолчанию и вызов по имени
    () => {
      const d = rnd(2, 5), mul = rnd(2, 4);
      const val = d * mul;
      const q = options(val, [d + mul, d, mul, d * mul + 1].concat(numWrongs(val)), (i) => val + i);
      return { topic: "functions", level: 4, text: "Что выведет этот код?",
        code: "def f(a, b=" + d + "):\n    return a * b\n\nprint(f(" + mul + "))",
        options: q.options, answer: q.answer,
        explanation: "Аргумент b не передан — берётся значение по умолчанию " + d +
          ", поэтому " + mul + " × " + d + " = " + val + "." };
    },
    // 26. Изменение списка в цикле
    () => {
      // Числа пишем БЕЗ кавычек: pyList оборачивает в строки, и тогда
      // вместо квадратов получается склейка символов.
      const src = shuffle([2, 3, 4, 5, 6, 7]).slice(0, 4);
      const pyNums = (a) => "[" + a.join(", ") + "]";
      const correct = pyNums(src.map((x) => x * x));
      const q = mcOptions(correct, [
        pyNums(src.map((x) => x + 1)),
        pyNums(src.map((x) => x * 2)),
        pyNums(src.slice(1).concat([src[0]]).map((x) => x * x))
      ], (i) => pyNums(src.slice(i).concat(src.slice(0, i)).map((x) => x * x)));
      return { topic: "collections", level: 4, text: "Что выведет этот код?",
        code: "a = " + pyNums(src) + "\nfor i in range(len(a)):\n    a[i] = a[i] * a[i]\nprint(a)",
        options: q.options, answer: q.answer,
        explanation: "Изменение элемента на месте меняет сам список — все числа возводятся в квадрат." };
    },
    // 27. Итерация по enumerate
    () => {
      const src = shuffle(WEAPON.slice()).slice(0, 4);
      const which = rnd(0, 3);
      const correct = src[which] + " " + (which + 1);
      const q = mcOptions(correct, src.filter((_, i) => i !== which)
        .map((w) => w + " " + (which + 1)),
        (i) => src[which] + " " + (which + 1 + i));
      return { topic: "collections", level: 4, text: "Что выведет этот код?",
        code: "for i, x in enumerate(" + pyList(src) + ", 1):\n    if i == " + (which + 1) + ":\n        print(x, i)",
        options: q.options, answer: q.answer,
        explanation: "enumerate даёт пары «элемент, номер». Нумерация с 1: «" +
          src[which] + "» имеет номер " + (which + 1) + "." };
    },
    // 28. Модуль и точка
    () => {
      const d = rnd(2, 6);
      // math.sqrt всегда возвращает float: 6.0, а не 6. Ответ должен
      // совпадать с тем, что напечатает настоящий Python.
      const correct = d + ".0";
      const q = mcOptions(correct, [String(d + 1), String(d * 2), (d + 1) + ".0"],
        (i) => (d + i) + ".0");
      return { topic: "modules", level: 4, text: "Что выведет этот код?",
        code: "import math\nprint(math.sqrt(" + d * d + "))",
        options: q.options, answer: q.answer,
        explanation: "math.sqrt(" + d * d + ") = " + d +
          ", и это число типа float — поэтому печатается «" + correct + "»." };
    },
    // 29. Именованный аргумент и порядок
    () => {
      const a = rnd(2, 6), b = rnd(7, 12);
      const val = a * b;
      const q = options(val, [a + b, b - a, a * b + 1].concat(numWrongs(val)), (i) => val + i);
      return { topic: "functions", level: 4, text: "Что выведет этот код?",
        code: "def box(w, h):\n    return w * h\n\nprint(box(h=" + b + ", w=" + a + "))",
        options: q.options, answer: q.answer,
        explanation: "Имена аргументов разрешают передавать их в любом порядке: " +
          a + " × " + b + " = " + val + "." };
    },
    // 30. Условное выражение
    () => {
      const a = rnd(3, 20), b = rnd(3, 20);
      const up = a > b;
      const correct = String(up ? a : b);
      const q = mcOptions(correct, [String(up ? b : a), String(a + b), String(Math.abs(a - b))],
        (i) => String(Math.max(a, b) + i));
      return { topic: "operators", level: 4, text: "Что выведет этот код?",
        code: "a = " + a + "\nb = " + b + "\nprint(a if a > b else b)",
        options: q.options, answer: q.answer,
        explanation: "Тернарное выражение берёт " + (up ? "a" : "b") +
          ", потому что " + (up ? a + " > " + b : a + " ≤ " + b) + "." };
    }
  ];

  function makeVariant(seq) {
    const q = pick(TEMPLATES)();
    q.id = "g" + seq;
    q.generated = true;
    return q;
  }

  // Индексы 18.. — это 12 строгих шаблонов четвёртого уровня.
  const HARD_FROM = 18;

  function generate(count) {
    const out = [];
    const seen = {};
    let guard = 0;
    while (out.length < count && guard++ < count * 30) {
      const q = makeVariant(out.length + 1);
      if (seen[q.code]) continue;
      seen[q.code] = true;
      out.push(q);
    }
    return out;
  }

  // Дополнительный пул строгих вопросов: генерируем, пока не наберём
  // нужное количество уникальных заданий четвёртого уровня.
  function generateHard(count) {
    const hard = [];
    const seen = {};
    let guard = 0;
    while (hard.length < count && guard++ < count * 40) {
      const q = pick(TEMPLATES.slice(HARD_FROM))();
      if (q.level !== 4) continue;
      if (seen[q.code]) continue;
      seen[q.code] = true;
      q.id = "h" + (hard.length + 1);
      q.generated = true;
      q.hard = true;
      hard.push(q);
    }
    return hard;
  }

  if (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS)) {
    for (const q of generate(96)) QUESTIONS.push(q);
    // Нижние этажи (qmin: 4) получают собственный запас строгих заданий.
    for (const q of generateHard(72)) QUESTIONS.push(q);
  }

  // Перемешивает варианты ответа. Возвращает новый порядок:
  // options — перемешанные варианты, answer — новый индекс правильного,
  // order — соответствие новым индексам исходных.
  function shuffleChoices(options, answer) {
    const order = options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    return {
      options: order.map((i) => options[i]),
      answer: order.indexOf(answer),
      order: order
    };
  }

  if (typeof window !== "undefined") {
    window.shuffleChoices = shuffleChoices;
    window.QuestionVariants = { generate: generate, templates: TEMPLATES.length, shuffleChoices: shuffleChoices };
  }
})();
