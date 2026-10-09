// Задания «напиши функцию». Все в тематике подземелья.
// Проверяются на сервере реальным запуском Python.
// tests: вызовы и ожидаемые результаты (Python-выражения).
const CODE_TASKS = [
  {
    id: "attack_power",
    title: "Сила удара",
    task: "Напиши функцию attack_power(base, bonus), которая возвращает суммарную силу удара.",
    explanation: "Функция должна вернуть сумму двух аргументов: return base + bonus.",
    starter: "def attack_power(base, bonus):\n    pass",
    tests: [
      { call: "attack_power(10, 5)", expected: "15" },
      { call: "attack_power(0, 0)", expected: "0" },
      { call: "attack_power(7, 3)", expected: "10" }
    ]
  },
  {
    id: "health_after_hit",
    title: "Здоровье после удара",
    task: "Напиши функцию health_after_hit(hp, damage), которая возвращает здоровье героя после полученного урона.",
    explanation: "Нужно вернуть разность здоровья и урона: return hp - damage.",
    starter: "def health_after_hit(hp, damage):\n    pass",
    tests: [
      { call: "health_after_hit(100, 30)", expected: "70" },
      { call: "health_after_hit(50, 50)", expected: "0" },
      { call: "health_after_hit(10, 5)", expected: "5" }
    ]
  },
  {
    id: "is_alive",
    title: "Жив ли герой",
    task: "Напиши функцию is_alive(hp), которая возвращает True, если здоровье больше нуля, иначе False.",
    explanation: "Функция возвращает результат сравнения: return hp > 0.",
    starter: "def is_alive(hp):\n    pass",
    tests: [
      { call: "is_alive(10)", expected: "True" },
      { call: "is_alive(0)", expected: "False" },
      { call: "is_alive(-5)", expected: "False" }
    ]
  },
  {
    id: "heal",
    title: "Зелье лечения",
    task: "Напиши функцию heal(hp, amount), которая возвращает здоровье после лечения зельем.",
    explanation: "Сложи текущее здоровье и величину лечения: return hp + amount.",
    starter: "def heal(hp, amount):\n    pass",
    tests: [
      { call: "heal(100, 20)", expected: "120" },
      { call: "heal(0, 5)", expected: "5" },
      { call: "heal(50, 0)", expected: "50" }
    ]
  },
  {
    id: "double_gold",
    title: "Двойное золото",
    task: "Напиши функцию double_gold(gold), которая возвращает количество золота, умноженное на два.",
    explanation: "Умножь значение на два: return gold * 2.",
    starter: "def double_gold(gold):\n    pass",
    tests: [
      { call: "double_gold(5)", expected: "10" },
      { call: "double_gold(0)", expected: "0" },
      { call: "double_gold(12)", expected: "24" }
    ]
  },
  {
    id: "total_hp",
    title: "Отряд героев",
    task: "Напиши функцию total_hp(heroes_hp), которая возвращает суммарное здоровье всех героев в списке.",
    explanation: "Сложи все элементы списка: подойдёт return sum(heroes_hp) или цикл с накоплением.",
    starter: "def total_hp(heroes_hp):\n    pass",
    tests: [
      { call: "total_hp([100, 80, 50])", expected: "230" },
      { call: "total_hp([])", expected: "0" },
      { call: "total_hp([40])", expected: "40" }
    ]
  },
  {
    id: "max_damage",
    title: "Самый сильный удар",
    task: "Напиши функцию max_damage(damages), которая возвращает наибольший урон из списка.",
    explanation: "Наибольший элемент находится через max(damages).",
    starter: "def max_damage(damages):\n    pass",
    tests: [
      { call: "max_damage([5, 20, 12])", expected: "20" },
      { call: "max_damage([7])", expected: "7" },
      { call: "max_damage([-1, -2])", expected: "-1" }
    ]
  },
  {
    id: "count_monsters",
    title: "Перепись монстров",
    task: "Напиши функцию count_monsters(monsters), которая возвращает количество монстров в списке.",
    explanation: "Количество элементов — это длина списка: return len(monsters).",
    starter: "def count_monsters(monsters):\n    pass",
    tests: [
      { call: "count_monsters([\"орк\", \"слизь\", \"паук\"])", expected: "3" },
      { call: "count_monsters([])", expected: "0" },
      { call: "count_monsters([\"дракон\"])", expected: "1" }
    ]
  },
  {
    id: "greet",
    title: "Приветствие героя",
    task: "Напиши функцию greet(name), которая возвращает строку вида «Привет, Герой!».",
    explanation: "Склей приветствие, имя и восклицательный знак: return \"Привет, \" + name + \"!\".",
    starter: "def greet(name):\n    pass",
    tests: [
      { call: "greet(\"Герой\")", expected: "\"Привет, Герой!\"" },
      { call: "greet(\"Орк\")", expected: "\"Привет, Орк!\"" }
    ]
  },
  {
    id: "count_even",
    title: "Чётный урон",
    task: "Напиши функцию count_even(nums), которая считает, сколько чётных чисел в списке.",
    explanation: "Чётное число делится на 2 без остатка: x % 2 == 0.",
    starter: "def count_even(nums):\n    pass",
    tests: [
      { call: "count_even([1, 2, 3, 4])", expected: "2" },
      { call: "count_even([])", expected: "0" },
      { call: "count_even([1, 3])", expected: "0" }
    ]
  },
  {
    id: "average",
    title: "Среднее здоровье",
    task: "Напиши функцию average(nums), которая возвращает среднее арифметическое чисел списка.",
    explanation: "Среднее — это сумма, делённая на количество: sum(nums) / len(nums).",
    starter: "def average(nums):\n    pass",
    tests: [
      { call: "average([10, 20])", expected: "15.0" },
      { call: "average([4])", expected: "4.0" }
    ]
  }
];

// Задания «повтори код». Студент переписывает код в точности.
// Проверяются прямо в браузере, без сервера.
const COPY_TASKS = [
  {
    id: "copy_hello",
    title: "Приветствие",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "print() выводит текст, который стоит в кавычках.",
    code: 'print("Привет, подземелье!")'
  },
  {
    id: "copy_hp",
    title: "Заводим героя",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "Сначала создаётся переменная hp со значением 100, затем print(hp) выводит её.",
    code: "hp = 100\nprint(hp)"
  },
  {
    id: "copy_damage",
    title: "Получаем урон",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "Строка hp = hp - damage уменьшает здоровье: справа считается новое значение и записывается в hp.",
    code: "hp = 100\ndamage = 25\nhp = hp - damage\nprint(hp)"
  },
  {
    id: "copy_name",
    title: "Имя героя",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "Строка в кавычках присваивается переменной name, а затем выводится.",
    code: 'name = "Герой"\nprint(name)'
  },
  {
    id: "copy_if",
    title: "Проверка здоровья",
    task: "Перепиши код в точности так, как он написан. Соблюдай отступы!",
    explanation: "if проверяет условие hp <= 0, а тело условия пишется с отступом в 4 пробела.",
    code: 'hp = 0\nif hp <= 0:\n    print("Поражение")'
  },
  {
    id: "copy_for",
    title: "Шаги по подземелью",
    task: "Перепиши код в точности так, как он написан. Соблюдай отступы!",
    explanation: "Цикл for берёт значения из range(3) — это 0, 1, 2 — и печатает каждое с отступом.",
    code: "for i in range(3):\n    print(i)"
  },
  {
    id: "copy_list",
    title: "Инвентарь",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "Список задаётся в квадратных скобках, а inventory[0] берёт первый элемент.",
    code: 'inventory = ["меч", "щит", "зелье"]\nprint(inventory[0])'
  },
  {
    id: "copy_upper",
    title: "Клич монстра",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "Метод .upper() возвращает строку заглавными буквами.",
    code: 'monster = "орк"\nprint(monster.upper())'
  },
  {
    id: "copy_def",
    title: "Заклинание лечения",
    task: "Перепиши код в точности так, как он написан. Соблюдай отступы!",
    explanation: "def объявляет функцию, а return возвращает результат hp + 20.",
    code: "def heal(hp):\n    return hp + 20"
  },
  {
    id: "copy_sum",
    title: "Считаем золото",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "В print() складываются значения двух переменных: gold + bonus.",
    code: "gold = 5\nbonus = 10\nprint(gold + bonus)"
  },
  {
    id: "copy_while",
    title: "Цикл пока",
    task: "Перепиши код в точности так, как он написан. Соблюдай отступы!",
    explanation: "while повторяет тело, пока условие истинно.",
    code: "hp = 3\nwhile hp > 0:\n    hp = hp - 1"
  },
  {
    id: "copy_fstring",
    title: "Фраза герою",
    task: "Перепиши код в точности так, как он написан.",
    explanation: "f-строка подставляет значение переменной в фигурных скобках.",
    code: 'name = "Герой"\nprint(f"Привет, {name}!")'
  }
];

// Задания «вставь пропущенное». В коде есть пропуск ___ — выбери нужное.
const FILL_TASKS = [
  {
    id: "fill_minus",
    title: "Урон по здоровью",
    code: "hp = 100\ndamage = 30\nhp = hp ___ damage\nprint(hp)",
    options: ["-", "+", "*", "/"],
    answer: 0,
    topic: "operators",
    level: 1,
    explanation: "hp = hp - damage уменьшает здоровье на величину урона."
  },
  {
    id: "fill_var",
    title: "Вывод переменной",
    code: 'name = "Герой"\nprint(___)',
    options: ["name", '"name"', "print", '"Герой"'],
    answer: 0,
    topic: "syntax",
    level: 1,
    explanation: "Без кавычек name — это переменная, её значение и выводится."
  },
  {
    id: "fill_range",
    title: "Цикл из трёх шагов",
    code: "for i in ___(3):\n    print(i)",
    options: ["range", "len", "list", "for"],
    answer: 0,
    topic: "control",
    level: 1,
    explanation: "range(3) даёт числа 0, 1, 2."
  },
  {
    id: "fill_le",
    title: "Условие поражения",
    code: 'hp = 0\nif hp ___ 0:\n    print("Поражение")',
    options: ["<=", "<", ">=", "=="],
    answer: 0,
    topic: "control",
    level: 2,
    explanation: "hp <= 0 — здоровье не больше нуля."
  },
  {
    id: "fill_append",
    title: "Пополняем инвентарь",
    code: 'inventory = ["меч", "щит"]\ninventory.___("зелье")\nprint(inventory)',
    options: ["append", "add", "push", "insert"],
    answer: 0,
    topic: "collections",
    level: 2,
    explanation: "Метод append() добавляет элемент в конец списка."
  },
  {
    id: "fill_floor_div",
    title: "Целое деление",
    code: "print(10 ___ 3)",
    options: ["//", "/", "%", "**"],
    answer: 0,
    topic: "operators",
    level: 2,
    explanation: "// — целочисленное деление: 10 // 3 = 3."
  },
  {
    id: "fill_upper",
    title: "Громкий клич",
    code: 'print("меч".___)',
    options: ["upper()", "lower()", "len()", "title()"],
    answer: 0,
    topic: "strings",
    level: 2,
    explanation: "Метод .upper() возвращает строку заглавными буквами."
  },
  {
    id: "fill_return",
    title: "Функция лечения",
    code: "def heal(hp):\n    ___ hp + 20",
    options: ["return", "print", "def", "yield"],
    answer: 0,
    topic: "functions",
    level: 3,
    explanation: "return возвращает результат из функции."
  },
  {
    id: "fill_get",
    title: "Чтение словаря",
    code: 'hero = {"hp": 100}\nprint(hero.___("hp"))',
    options: ["get", "find", "value", "take"],
    answer: 0,
    topic: "collections",
    level: 3,
    explanation: "get() возвращает значение по ключу словаря."
  },
  {
    id: "fill_pow",
    title: "Мощный удар",
    code: "print(2 ___ 3)",
    options: ["**", "*", "+", "//"],
    answer: 0,
    topic: "operators",
    level: 3,
    explanation: "** — возведение в степень: 2 ** 3 = 8."
  },
  {
    id: "fill_fstring",
    title: "Фраза герою",
    code: 'name = "Герой"\nprint(f"___ {name}")',
    options: ["Привет,", "Пока,", "print", "name"],
    answer: 0,
    topic: "strings",
    level: 3,
    explanation: "f-строка подставляет значение переменной из фигурных скобок."
  },
  {
    id: "fill_while",
    title: "Цикл пока",
    code: "i = 0\n___ i < 3:\n    i += 1",
    options: ["while", "for", "if", "until"],
    answer: 0,
    topic: "control",
    level: 3,
    explanation: "Цикл while повторяется, пока условие истинно."
  }
];

// Задания «найди ошибку». В коде есть ошибка — выбери, в чём она.
const ERROR_TASKS = [
  {
    id: "err_paren",
    title: "Найди ошибку",
    code: 'print("Привет"',
    options: [
      "Не закрыта скобка print()",
      "Лишняя кавычка",
      "Нужно ключевое слово def",
      "Всё верно"
    ],
    answer: 0,
    topic: "syntax",
    level: 1,
    explanation: "У print() не хватает закрывающей скобки."
  },
  {
    id: "err_if_colon",
    title: "Найди ошибку",
    code: 'if hp > 0\n    print("жив")',
    options: [
      "Забыто двоеточие после if",
      "Неверный отступ",
      "Нужно else",
      "print пишется с большой буквы"
    ],
    answer: 0,
    topic: "control",
    level: 2,
    explanation: "После условия if ставится двоеточие."
  },
  {
    id: "err_for_colon",
    title: "Найди ошибку",
    code: "for i in range(3)\n    print(i)",
    options: [
      "Забыто двоеточие после range(3)",
      "Вместо for нужно while",
      "range не существует",
      "print без аргументов"
    ],
    answer: 0,
    topic: "control",
    level: 2,
    explanation: "Строка цикла for тоже заканчивается двоеточием."
  },
  {
    id: "err_mixed",
    title: "Найди ошибку",
    code: 'print("10" + 5)',
    options: [
      "Нельзя складывать строку и число",
      "Число нужно в кавычки",
      "Нужен знак минус",
      "Кавычки лишние у 10"
    ],
    answer: 0,
    topic: "types",
    level: 2,
    explanation: "Строку и число складывать нельзя — нужно привести типы."
  },
  {
    id: "err_def_colon",
    title: "Найди ошибку",
    code: "def heal(hp)\n    return hp + 20",
    options: [
      "Забыто двоеточие после def heal(hp)",
      "Нужно слово pass",
      "return нельзя в функции",
      "hp + 20 нужно в кавычки"
    ],
    answer: 0,
    topic: "functions",
    level: 3,
    explanation: "Объявление def завершается двоеточием."
  },
  {
    id: "err_case",
    title: "Найди ошибку",
    code: 'name = "Орк"\nprint(Name)',
    options: [
      "Переменная Name не определена — важен регистр",
      "Нужны кавычки вокруг Name",
      "Слово Орк с маленькой буквы",
      "print здесь лишний"
    ],
    answer: 0,
    topic: "types",
    level: 3,
    explanation: "Python различает регистр: name и Name — разные переменные."
  },
  {
    id: "err_zero",
    title: "Найди ошибку",
    code: "print(10 / 0)",
    options: [
      "ZeroDivisionError: делить на ноль нельзя",
      "Всё верно, будет 0",
      "SyntaxError",
      "NameError"
    ],
    answer: 0,
    topic: "errors",
    level: 3,
    explanation: "Деление на ноль запрещено — будет ZeroDivisionError."
  },
  {
    id: "err_index",
    title: "Найди ошибку",
    code: "loot = []\nprint(loot[0])",
    options: [
      "IndexError: список пуст",
      "Всё верно, будет None",
      "KeyError",
      "TypeError"
    ],
    answer: 0,
    topic: "errors",
    level: 3,
    explanation: "В пустом списке нет элемента с индексом 0 — будет IndexError."
  }
];
