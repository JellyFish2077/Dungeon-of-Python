// Банк вопросов для квиза и подземелья. Всё оформлено в тематике подземелья.
// level: 1 — новичок, 2 — база, 3 — уверенный, 4 — продвинутый.
// answer: индекс правильного варианта (с нуля).
const QUESTIONS = [
  // ----- Уровень 1: самые основы -----
  {
    id: 1,
    topic: "syntax",
    level: 1,
    text: "Какая команда выводит текст на экран?",
    options: ["print()", "input()", "echo()", "output()"],
    answer: 0,
    explanation: "print() — команда вывода. input() наоборот, считывает данные с клавиатуры."
  },
  {
    id: 2,
    topic: "syntax",
    level: 1,
    text: "Какой символ начинает комментарий в Python?",
    options: ["//", "#", "/* */", "--"],
    answer: 1,
    explanation: "Комментарий начинается с #. Всё после него Python не выполняет."
  },
  {
    id: 3,
    topic: "syntax",
    level: 1,
    text: "Как записать в переменную hp значение 100?",
    options: ["hp == 100", "hp = 100", "let hp = 100", "hp := 100"],
    answer: 1,
    explanation: "Присваивание — один знак =. Двойное == это сравнение."
  },
  {
    id: 4,
    topic: "types",
    level: 1,
    text: "Какой тип у значения 3.14?",
    options: ["int", "float", "str", "bool"],
    answer: 1,
    explanation: "Число с точкой — это float. int — целое число, str — строка."
  },
  {
    id: 5,
    topic: "types",
    level: 1,
    text: "Какой тип у значения 100?",
    options: ["int", "float", "str", "bool"],
    answer: 0,
    explanation: "Целое число без точки — это int."
  },
  {
    id: 6,
    topic: "operators",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(2 + 3)",
    options: ["5", "23", "6", "1"],
    answer: 0,
    explanation: "Знак + складывает числа: 2 + 3 = 5."
  },
  {
    id: 7,
    topic: "operators",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(10 - 4)",
    options: ["6", "14", "-6", "4"],
    answer: 0,
    explanation: "Знак - вычитает: 10 - 4 = 6."
  },
  {
    id: 8,
    topic: "types",
    level: 1,
    text: "Что выведет этот код?",
    code: 'print("Дракон")',
    options: ["Дракон", "дракон", "Ошибка", "\"Дракон\""],
    answer: 0,
    explanation: "print() выводит текст, который стоит в кавычках."
  },

  // ----- Уровень 2: база -----
  {
    id: 9,
    topic: "strings",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print(len("меч"))',
    options: ["2", "3", "4", "Ошибка"],
    answer: 1,
    explanation: "len() считает длину строки. В слове «меч» 3 буквы."
  },
  {
    id: 10,
    topic: "types",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(type(5))",
    options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"],
    answer: 0,
    explanation: "type() показывает тип значения. 5 — это int."
  },
  {
    id: 11,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(10 // 3)",
    options: ["3", "3.33", "4", "1"],
    answer: 0,
    explanation: "// — целочисленное деление, берётся только целая часть."
  },
  {
    id: 12,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(10 % 3)",
    options: ["3", "1", "3.33", "0"],
    answer: 1,
    explanation: "% — остаток от деления. 10 = 3 * 3 + 1, остаток равен 1."
  },
  {
    id: 13,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(2 ** 3)",
    options: ["6", "8", "9", "23"],
    answer: 1,
    explanation: "** — возведение в степень: 2 * 2 * 2 = 8."
  },
  {
    id: 14,
    topic: "strings",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("дракон".upper())',
    options: ["дракон", "ДРАКОН", "Дракон", "Ошибка"],
    answer: 1,
    explanation: "Метод .upper() делает все буквы заглавными."
  },
  {
    id: 15,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("10" + "5")',
    options: ["15", "105", "10 5", "Ошибка"],
    answer: 1,
    explanation: "Кавычки делают значения строками, поэтому + склеивает их: 105."
  },
  {
    id: 16,
    topic: "control",
    level: 2,
    text: "С помощью какого слова пишется ветка «иначе»?",
    options: ["elif", "else", "otherwise", "default"],
    answer: 1,
    explanation: "else выполняется, когда условие if ложно. elif проверяет ещё одно условие."
  },
  {
    id: 17,
    topic: "collections",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(list(range(3)))",
    options: ["[1, 2, 3]", "[0, 1, 2]", "[0, 1, 2, 3]", "[3]"],
    answer: 1,
    explanation: "range(3) даёт числа 0, 1, 2 — последнее не включается."
  },

  // ----- Уровень 3: уверенный -----
  {
    id: 18,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'inventory = ["меч"]\ninventory.append("щит")\nprint(inventory)',
    options: ['["меч"]', '["меч", "щит"]', '["щит", "меч"]', "Ошибка"],
    answer: 1,
    explanation: "append() добавляет элемент в конец списка."
  },
  {
    id: 19,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'hero = {"hp": 100}\nprint(hero.get("mp", 0))',
    options: ["None", "0", "100", "Ошибка"],
    answer: 1,
    explanation: "get() вернёт второй аргумент (0), если ключа нет — без ошибки."
  },
  {
    id: 20,
    topic: "control",
    level: 3,
    text: "Что выведет этот код?",
    code: 'for i in range(2):\n    print(i, end="")\nprint()',
    options: ["01", "12", "0 1", "02"],
    answer: 0,
    explanation: "range(2) даёт 0 и 1. end=\"\" печатает без перевода строки: 01."
  },
  {
    id: 21,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'loot = ["меч", "щит", "зелье"]\nprint(loot[-1])',
    options: ["меч", "щит", "зелье", "Ошибка"],
    answer: 2,
    explanation: "Индекс -1 — это последний элемент списка."
  },
  {
    id: 22,
    topic: "strings",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print("меч"[::-1])',
    options: ["меч", "чем", "м", "Ошибка"],
    answer: 1,
    explanation: "Срез [::-1] разворачивает строку: «меч» превращается в «чем»."
  },
  {
    id: 23,
    topic: "functions",
    level: 3,
    text: "Что вернёт функция без команды return?",
    code: "def hit():\n    x = 10\n\nprint(hit())",
    options: ["0", "None", "10", "Ошибка"],
    answer: 1,
    explanation: "Если в функции нет return, она возвращает None."
  },
  {
    id: 24,
    topic: "control",
    level: 3,
    text: "Что выведет этот код?",
    code: "hp = 0\nif hp > 0:\n    print(\"жив\")\nelse:\n    print(\"поражение\")",
    options: ["жив", "поражение", "0", "Ничего"],
    answer: 1,
    explanation: "Условие hp > 0 ложно (0 не больше 0), поэтому выполняется ветка else."
  },

  // ----- Уровень 4: продвинутый -----
  {
    id: 25,
    topic: "types",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(bool([]))",
    options: ["True", "False", "None", "Ошибка"],
    answer: 1,
    explanation: "Пустая коллекция считается ложной — False. Непустая — True."
  },
  {
    id: 26,
    topic: "types",
    level: 4,
    text: "Что выведет этот код?",
    code: "a = [1, 2]\nb = a\nb.append(3)\nprint(a)",
    options: ["[1, 2]", "[1, 2, 3]", "[3]", "Ошибка"],
    answer: 1,
    explanation: "b = a не копирует список, а ссылается на тот же объект. Поэтому a тоже изменится."
  },
  {
    id: 27,
    topic: "collections",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(len({1, 2, 2, 3}))",
    options: ["4", "3", "2", "Ошибка"],
    answer: 1,
    explanation: "Фигурные скобки без двоеточий — множество. Оно хранит только уникальные элементы: {1, 2, 3}."
  },
  {
    id: 28,
    topic: "functions",
    level: 4,
    text: "Что выведет этот код?",
    code: "def loot(*items):\n    return len(items)\n\nprint(loot(\"меч\", \"щит\", \"зелье\"))",
    options: ["1", "3", "Ошибка", "None"],
    answer: 1,
    explanation: "*items собирает все аргументы в кортеж. Их три, поэтому результат 3."
  },
  {
    id: 29,
    topic: "errors",
    level: 4,
    text: "Какой блок выполнится всегда, даже при ошибке?",
    code: "try:\n    mission()\nexcept Exception:\n    retreat()\nfinally:\n    rest()",
    options: ["try", "except", "finally", "else"],
    answer: 2,
    explanation: "Блок finally выполняется всегда — и при ошибке, и без неё."
  },
  {
    id: 30,
    topic: "control",
    level: 4,
    text: "Что выведет этот код?",
    code: "print([x for x in range(4) if x % 2 == 0])",
    options: ["[0, 2]", "[1, 3]", "[0, 1, 2, 3]", "[2, 4]"],
    answer: 0,
    explanation: "Берём x от 0 до 3 и оставляем только чётные: [0, 2]."
  },
  {
    id: 31,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(5 // 2)",
    options: ["2", "2.5", "3", "1"],
    answer: 0,
    explanation: "// отбрасывает дробную часть: 5 // 2 = 2."
  },
  {
    id: 32,
    topic: "types",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(True and False)",
    options: ["True", "False", "None", "Ошибка"],
    answer: 1,
    explanation: "Оператор and истинен, только если истинны оба значения."
  },
  {
    id: 33,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(len([1, 2, 3, 4]))",
    options: ["3", "4", "5", "Ошибка"],
    answer: 1,
    explanation: "len() возвращает количество элементов списка."
  },
  {
    id: 34,
    topic: "strings",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print("подземелье"[0])',
    options: ["п", "подземелье", "ь", "Ошибка"],
    answer: 0,
    explanation: "Индекс 0 — это первый символ строки."
  },
  {
    id: 35,
    topic: "control",
    level: 3,
    text: "Сколько раз выполнится тело цикла?",
    code: "for i in range(1, 4):\n    print(i)",
    options: ["2", "3", "4", "1"],
    answer: 1,
    explanation: "range(1, 4) даёт числа 1, 2, 3 — три раза."
  },
  {
    id: 36,
    topic: "functions",
    level: 4,
    text: "Что выведет этот код?",
    code: "def f(x):\n    return x * 2\n\nprint(f(3) - 1)",
    options: ["5", "6", "3", "4"],
    answer: 0,
    explanation: "f(3) возвращает 6, затем 6 - 1 = 5."
  },
  {
    id: 37,
    topic: "collections",
    level: 4,
    text: "Что выведет этот код?",
    code: 'print({"a": 1, "b": 2}.get("c", 9))',
    options: ["None", "9", "1", "Ошибка"],
    answer: 1,
    explanation: "Ключа c нет, поэтому get() вернёт второй аргумент — 9."
  },
  {
    id: 38,
    topic: "types",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(7 % 2 == 1)",
    options: ["True", "False", "1", "0"],
    answer: 0,
    explanation: "7 % 2 = 1, а 1 == 1 — истина, поэтому True."
  },
  {
    id: 39,
    topic: "control",
    level: 4,
    text: "Что выведет этот код?",
    code: "print([i * i for i in range(3)])",
    options: ["[0, 1, 4]", "[1, 2, 3]", "[0, 1, 2]", "[1, 4, 9]"],
    answer: 0,
    explanation: "i принимает 0, 1, 2, и каждый возводится в квадрат: [0, 1, 4]."
  },
  {
    id: 40,
    topic: "errors",
    level: 4,
    text: "Какая конструкция ловит ошибки во время выполнения?",
    code: "try:\n    ...\nexcept Exception:\n    ...",
    options: ["try / except", "if / else", "for / in", "def / return"],
    answer: 0,
    explanation: "try/except перехватывает исключения и не даёт программе упасть."
  },
  {
    id: 41,
    topic: "syntax",
    level: 1,
    text: "Что делает команда input()?",
    options: ["Считывает текст с клавиатуры", "Выводит текст на экран", "Закрывает программу", "Создаёт переменную"],
    answer: 0,
    explanation: "input() ждёт ввода пользователя и возвращает строку."
  },
  {
    id: 42,
    topic: "operators",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(7 - 4)",
    options: ["3", "11", "28", "2"],
    answer: 0,
    explanation: "Знак - вычитает: 7 - 4 = 3."
  },
  {
    id: 43,
    topic: "operators",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(3 * 4)",
    options: ["7", "12", "34", "1"],
    answer: 1,
    explanation: "Знак * умножает: 3 * 4 = 12."
  },
  {
    id: 44,
    topic: "types",
    level: 1,
    text: "Какой тип у значения True?",
    options: ["int", "bool", "str", "float"],
    answer: 1,
    explanation: "True и False — это логический тип bool."
  },
  {
    id: 45,
    topic: "types",
    level: 1,
    text: "Какой тип у значения \"100\"?",
    options: ["int", "float", "str", "bool"],
    answer: 2,
    explanation: "Кавычки делают значение строкой str, даже если внутри цифры."
  },
  {
    id: 46,
    topic: "types",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print(int("5") + 2)',
    options: ["52", "7", "Ошибка", "5"],
    answer: 1,
    explanation: "int(\"5\") превращает строку в число 5, затем 5 + 2 = 7."
  },
  {
    id: 47,
    topic: "types",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print(str(10) + "!")',
    options: ["10!", "11", "Ошибка", "10 !"],
    answer: 0,
    explanation: "str(10) превращает число в строку, затем строки склеиваются: 10!."
  },
  {
    id: 48,
    topic: "strings",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("дракон"[0])',
    options: ["д", "о", "н", "Ошибка"],
    answer: 0,
    explanation: "Индекс 0 — это первый символ строки."
  },
  {
    id: 49,
    topic: "strings",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("ха" * 3)',
    options: ["хахаха", "ха ха ха", "9", "Ошибка"],
    answer: 0,
    explanation: "Умножение строки на число повторяет её: хахаха."
  },
  {
    id: 50,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(5 == 5)",
    options: ["True", "False", "5", "\"5\""],
    answer: 0,
    explanation: "== сравнивает значения. Они равны, поэтому True."
  },
  {
    id: 51,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(3 != 4)",
    options: ["True", "False", "34", "7"],
    answer: 0,
    explanation: "!= означает «не равно». 3 и 4 разные, поэтому True."
  },
  {
    id: 52,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(10 > 3 and 2 < 5)",
    options: ["True", "False", "TrueFalse", "Ошибка"],
    answer: 0,
    explanation: "Оба сравнения истинны, а and требует истинности обоих."
  },
  {
    id: 53,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(not False)",
    options: ["True", "False", "None", "0"],
    answer: 0,
    explanation: "not переворачивает значение: не False это True."
  },
  {
    id: 54,
    topic: "control",
    level: 2,
    text: "Что выведет этот код?",
    code: "hp = 100\nhp = hp - 150\nif hp < 0:\n    print(\"повержен\")\nelse:\n    print(\"жив\")",
    options: ["повержен", "жив", "-50", "Ошибка"],
    answer: 0,
    explanation: "После урона hp = -50. Условие hp < 0 истинно."
  },
  {
    id: 55,
    topic: "collections",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print(["меч", "щит", "зелье"][1])',
    options: ["меч", "щит", "зелье", "Ошибка"],
    answer: 1,
    explanation: "Нумерация начинается с нуля, поэтому [1] это второй элемент."
  },
  {
    id: 56,
    topic: "collections",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(len([10, 20]))",
    options: ["1", "2", "3", "[10, 20]"],
    answer: 1,
    explanation: "len() считает элементы списка. Их два."
  },
  {
    id: 57,
    topic: "collections",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("щит" in ["меч", "щит"])',
    options: ["True", "False", "\"щит\"", "1"],
    answer: 0,
    explanation: "Оператор in проверяет наличие элемента в списке."
  },
  {
    id: 58,
    topic: "strings",
    level: 2,
    text: "Что выведет этот код?",
    code: 'print("Герой".lower())',
    options: ["герой", "ГЕРОЙ", "Герой", "Ошибка"],
    answer: 0,
    explanation: "Метод .lower() делает все буквы строчными."
  },
  {
    id: 59,
    topic: "control",
    level: 2,
    text: "Сколько строк выведет этот код?",
    code: 'for letter in "орк":\n    print(letter)',
    options: ["1", "2", "3", "4"],
    answer: 2,
    explanation: "Цикл проходит по каждой букве. В слове «орк» 3 буквы."
  },
  {
    id: 60,
    topic: "operators",
    level: 2,
    text: "Что выведет этот код?",
    code: "x = 5\nx += 3\nprint(x)",
    options: ["5", "8", "53", "3"],
    answer: 1,
    explanation: "Запись x += 3 означает x = x + 3."
  },
  {
    id: 61,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print(["меч", "щит", "зелье"][0:2])',
    options: ['["меч"]', '["меч", "щит"]', '["щит", "зелье"]', '["меч", "щит", "зелье"]'],
    answer: 1,
    explanation: "Срез [0:2] берёт элементы с 0 по 1, последний не включается."
  },
  {
    id: 62,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'inventory = []\ninventory.append("меч")\ninventory.append("щит")\nprint(len(inventory))',
    options: ["0", "1", "2", "3"],
    answer: 2,
    explanation: "После двух append() в списке два элемента."
  },
  {
    id: 63,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: 'hero = {"hp": 100}\nprint("hp" in hero)',
    options: ["True", "False", "\"hp\"", "100"],
    answer: 0,
    explanation: "Оператор in проверяет наличие ключа в словаре."
  },
  {
    id: 64,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: "t = (10, 20)\nprint(t[1])",
    options: ["10", "20", "(10, 20)", "Ошибка"],
    answer: 1,
    explanation: "Кортеж читается по индексу так же, как список."
  },
  {
    id: 65,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(sorted([3, 1, 2]))",
    options: ["[3, 1, 2]", "[1, 2, 3]", "[2, 1, 3]", "[1, 3, 2]"],
    answer: 1,
    explanation: "Функция sorted() возвращает список по возрастанию."
  },
  {
    id: 66,
    topic: "strings",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print("меч,щит".split(","))',
    options: ["мечщит", "['меч', 'щит']", "меч, щит", "Ошибка"],
    answer: 1,
    explanation: "Метод .split() разрезает строку по разделителю в список."
  },
  {
    id: 67,
    topic: "strings",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print("-".join(["a", "b"]))',
    options: ["ab", "a-b", "a, b", "Ошибка"],
    answer: 1,
    explanation: "Метод .join() склеивает список через указанный разделитель."
  },
  {
    id: 68,
    topic: "control",
    level: 3,
    text: "Сколько строк выведет этот код?",
    code: "i = 0\nwhile i < 3:\n    print(i)\n    i += 1",
    options: ["2", "3", "4", "1"],
    answer: 1,
    explanation: "Цикл while повторяется, пока i < 3: для 0, 1 и 2."
  },
  {
    id: 69,
    topic: "control",
    level: 3,
    text: "Что выведет этот код?",
    code: "for i in range(5):\n    if i == 2:\n        break\n    print(i, end=\"\")",
    options: ["01", "012", "01234", "2"],
    answer: 0,
    explanation: "Команда break прерывает цикл, когда i становится равно 2."
  },
  {
    id: 70,
    topic: "functions",
    level: 3,
    text: "Что выведет этот код?",
    code: "def heal(hp, amount=10):\n    return hp + amount\n\nprint(heal(100))",
    options: ["100", "110", "10", "Ошибка"],
    answer: 1,
    explanation: "Если аргумент не передан, используется значение по умолчанию 10."
  },
  {
    id: 71,
    topic: "functions",
    level: 3,
    text: "Что выведет print(x)?",
    code: 'def attack():\n    print("удар")\n\nx = attack()\nprint(x)',
    options: ["удар", "None", "0", "Ошибка"],
    answer: 1,
    explanation: "Функция печатает «удар», но возвращает None, которое и записано в x."
  },
  {
    id: 72,
    topic: "types",
    level: 3,
    text: "Что выведет этот код?",
    code: 'print(bool("орк"))',
    options: ["True", "False", "\"орк\"", "0"],
    answer: 0,
    explanation: "Непустая строка считается истинной."
  },
  {
    id: 73,
    topic: "types",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(bool(0))",
    options: ["True", "False", "\"0\"", "None"],
    answer: 1,
    explanation: "Число 0 считается ложным."
  },
  {
    id: 74,
    topic: "operators",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(2 < 5 < 10)",
    options: ["True", "False", "25", "Ошибка"],
    answer: 0,
    explanation: "Python проверяет цепочку: 2 меньше 5 и 5 меньше 10."
  },
  {
    id: 75,
    topic: "collections",
    level: 3,
    text: "Что выведет этот код?",
    code: "loot = [1, 2, 3]\nloot.remove(2)\nprint(loot)",
    options: ["[1, 2, 3]", "[1, 3]", "[2]", "[1, 2]"],
    answer: 1,
    explanation: "Метод .remove() удаляет первое вхождение значения."
  },
  {
    id: 76,
    topic: "functions",
    level: 4,
    text: "Что выведет этот код?",
    code: "x = 5\n\ndef f():\n    x = 10\n\nf()\nprint(x)",
    options: ["5", "10", "None", "Ошибка"],
    answer: 0,
    explanation: "Переменная x внутри функции — локальная, внешняя не меняется."
  },
  {
    id: 77,
    topic: "collections",
    level: 4,
    text: "Что произойдёт при выполнении?",
    code: "t = (1, 2)\nt[0] = 5",
    options: ["TypeError: кортеж изменить нельзя", "Получится [5, 2]", "Ничего не изменится", "ValueError"],
    answer: 0,
    explanation: "Кортеж — неизменяемый тип, элементы присваивать нельзя."
  },
  {
    id: 78,
    topic: "types",
    level: 4,
    text: "Что выведет этот код?",
    code: "x = None\nprint(x is None)",
    options: ["True", "False", "None", "Ошибка"],
    answer: 0,
    explanation: "Проверку на None принято делать через is."
  },
  {
    id: 79,
    topic: "errors",
    level: 4,
    text: "Какая ошибка возникнет?",
    code: 'print(int("abc"))',
    options: ["ValueError", "TypeError", "0", "Никакая"],
    answer: 0,
    explanation: "Строку «abc» нельзя превратить в число — будет ValueError."
  },
  {
    id: 80,
    topic: "errors",
    level: 4,
    text: "Какая ошибка возникнет?",
    code: "print([1, 2][5])",
    options: ["IndexError", "KeyError", "None", "Никакая"],
    answer: 0,
    explanation: "Индекса 5 в списке нет — будет IndexError."
  },
  {
    id: 81,
    topic: "functions",
    level: 4,
    text: "Что выведет этот код?",
    code: "f = lambda x: x * 2\nprint(f(4))",
    options: ["6", "8", "f(4)", "Ошибка"],
    answer: 1,
    explanation: "lambda создаёт короткую функцию: 4 * 2 = 8."
  },
  {
    id: 82,
    topic: "modules",
    level: 4,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.sqrt(16))",
    options: ["4", "4.0", "16", "Ошибка"],
    answer: 1,
    explanation: "Функция sqrt() из модуля math возвращает float: 4.0."
  },
  {
    id: 83,
    topic: "collections",
    level: 4,
    text: "Что выведет этот код?",
    code: "a = [1, 2, 3]\nb = a[:]\nb.append(4)\nprint(len(a))",
    options: ["3", "4", "[1, 2, 3, 4]", "Ошибка"],
    answer: 0,
    explanation: "Срез a[:] создаёт копию списка, поэтому a не меняется."
  },
  {
    id: 84,
    topic: "control",
    level: 4,
    text: "Что выведет этот код?",
    code: "for i in range(3):\n    if i == 1:\n        continue\n    print(i, end=\"\")",
    options: ["01", "02", "012", "12"],
    answer: 1,
    explanation: "Команда continue пропускает итерацию, когда i равно 1."
  },
  {
    id: 85,
    topic: "strings",
    level: 4,
    text: "Что выведет этот код?",
    code: 'name = "Герой"\nprint(f"Привет, {name}!")',
    options: ["Привет, {name}!", "Привет, Герой!", "Привет, name!", "Ошибка"],
    answer: 1,
    explanation: "Буква f перед строкой подставляет значения переменных из фигурных скобок."
   },
  // ----- Добавлено под лекцию «Python: основы до ООП»: модули и ловушки -----
  {
    id: 86,
    topic: "modules",
    level: 2,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.sqrt(16))",
    options: ["4.0", "4", "16", "Ошибка: math не подключён"],
    answer: 0,
    explanation: "Модуль сначала подключают через import, а потом берут из него функции с точкой. sqrt() возвращает float, поэтому 4.0, а не 4."
  },
  {
    id: 87,
    topic: "modules",
    level: 3,
    text: "Что даёт строка from math import sqrt?",
    code: "from math import sqrt\nprint(sqrt(25))",
    options: ["Подключает только sqrt: вызывать как sqrt(25)", "Подключает весь модуль math", "Переименовывает sqrt в math", "Так писать нельзя"],
    answer: 0,
    explanation: "from модуль import имя берёт из модуля одно имя, и обращаться к нему нужно без точки. Весь модуль подключает обычный import math."
  },
  {
    id: 88,
    topic: "modules",
    level: 2,
    text: "Как поставить сторонний пакет, например requests?",
    options: ["pip install requests", "import pip requests", "python install requests", "pip get requests"],
    answer: 0,
    explanation: "pip — установщик пакетов: pip install requests ставит пакет из PyPI, после чего его подключают обычным import requests."
  },
  {
    id: 89,
    topic: "modules",
    level: 4,
    text: "Что делает блок if __name__ == \"__main__\":?",
    code: "if __name__ == \"__main__\":\n    print(\"старт\")",
    options: ["Выполняется только при прямом запуске файла, а не при импорте", "Выполняется всегда", "Объявляет функцию main", "Запускает файл заново"],
    answer: 0,
    explanation: "При прямом запуске __name__ равно \"__main__\", при импорте — имени модуля. Блок защищает код запуска: чужой import его не выполнит."
  },
  {
    id: 90,
    topic: "strings",
    level: 3,
    text: "Что выведет этот код?",
    code: "name = \"герой\"\nname[0] = \"Г\"\nprint(name)",
    options: ["TypeError: строку изменить нельзя", "Герой", "герой", "Пустую строку"],
    answer: 0,
    explanation: "Строка неизменяема, поэтому присваивание по индексу вызывает TypeError. Нужную строку собирают заново: name = \"Г\" + name[1:]."
  },
  {
    id: 91,
    topic: "functions",
    level: 4,
    text: "Что выведет этот код?",
    code: "def add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nprint(add(\"меч\"))\nprint(add(\"щит\"))",
    options: ["['меч'] и ['меч', 'щит']", "['меч'] и ['щит']", "['меч', 'щит'] в обоих вызовах", "Ошибка: список в аргументе"],
    answer: 0,
    explanation: "Значение по умолчанию создаётся один раз, при определении функции, поэтому список один и тот же во всех вызовах. Безопасно: bag=None, а внутри if bag is None: bag = []."
  },
];

// Понятные названия тем для отчёта
const TOPICS = {
  syntax: "Синтаксис и основы",
  types: "Типы данных",
  operators: "Операторы и выражения",
  strings: "Строки",
  control: "Условия и циклы",
  collections: "Списки, словари, множества",
  functions: "Функции",
  errors: "Исключения",
  modules: "Модули и импорт"
};
