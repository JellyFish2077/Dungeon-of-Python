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
    code: "import math\nprint(math.isclose(0.1 + 0.2, 0.3))",
    options: ["True", "False", "0.30000000000000004", "Ошибка: isclose не существует"],
    answer: 0,
    explanation: "0.1 + 0.2 не равно 0.3 точно из-за двоичных дробей, но math.isclose сравнивает с допуском и возвращает True."
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
  // ----- Добавлено после ревизии банка: пустые клетки тем и уровней -----
  {
    id: 92,
    topic: "syntax",
    level: 2,
    text: "Что произойдёт при запуске этого кода?",
    code: "if True:\nprint(\"да\")",
    options: ["Ошибка отступа: print должен быть сдвинут вправо", "Напечатает «да»", "Напечатает True", "Ничего не выведет"],
    answer: 0,
    explanation: "Тело if задаётся отступом. Без отступа print не входит в блок, и Python сообщает IndentationError."
  },
  {
    id: 93,
    topic: "syntax",
    level: 3,
    text: "Что выведет этот код?",
    code: "a, b = 1, 2\na, b = b, a\nprint(a, b)",
    options: ["2 1", "1 2", "1 1", "Ошибка: так нельзя"],
    answer: 0,
    explanation: "Справа сначала вычисляется кортеж (b, a), затем он распаковывается в a и b. Поэтому значения меняются местами."
  },
  {
    id: 94,
    topic: "syntax",
    level: 4,
    text: "Что выведет этот код?",
    code: "x = 10\nprint(\"много\" if x > 5 else \"мало\")",
    options: ["много", "мало", "True", "Ошибка синтаксиса"],
    answer: 0,
    explanation: "Тернарное выражение выбирает значение: условие x > 5 истинно, поэтому берётся «много»."
  },
  {
    id: 95,
    topic: "errors",
    level: 1,
    text: "Какая ошибка в этом коде?",
    code: "print(\"привет\"",
    options: ["SyntaxError: не закрыта скобка", "NameError: нет print", "TypeError: строка не подходит", "Код сработает и напечатает привет"],
    answer: 0,
    explanation: "У print не закрыта скобка. Python не может разобрать строку и выдаёт SyntaxError ещё до выполнения."
  },
  {
    id: 96,
    topic: "errors",
    level: 2,
    text: "Что произойдёт при запуске?",
    code: "print(10 / 0)",
    options: ["ZeroDivisionError", "Напечатает 0", "Напечатает 10", "SyntaxError"],
    answer: 0,
    explanation: "Делить на ноль нельзя: Python выбрасывает ZeroDivisionError. Деление стоит проверять условием или try/except."
  },
  {
    id: 97,
    topic: "errors",
    level: 3,
    text: "Что произойдёт при запуске?",
    code: "number = int(\"12a\")\nprint(number)",
    options: ["ValueError: строку нельзя превратить в число", "Напечатает 12", "Напечатает 12a", "TypeError: int не функция"],
    answer: 0,
    explanation: "int() понимает только строку, целиком состоящую из числа. «12a» содержит букву, поэтому возникает ValueError."
  },
  {
    id: 98,
    topic: "functions",
    level: 1,
    text: "Что выведет этот код?",
    code: "def answer():\n    return 42\n\nprint(answer())",
    options: ["42", "answer", "None", "Ошибка: функция не вызвана"],
    answer: 0,
    explanation: "def создаёт функцию, а answer() вызывает её. return 42 возвращает число, и print выводит 42."
  },
  {
    id: 99,
    topic: "functions",
    level: 2,
    text: "Что выведет этот код?",
    code: "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
    options: ["5", "23", "a + b", "None"],
    answer: 0,
    explanation: "В функцию передаются 2 и 3: a=2, b=3. return возвращает их сумму 5, её и печатает print."
  },
  {
    id: 100,
    topic: "functions",
    level: 2,
    text: "Что выведет этот код?",
    code: "def greet(name=\"мир\"):\n    return \"привет, \" + name\n\nprint(greet())",
    options: ["привет, мир", "привет, name", "Ошибка: name не передан", "None"],
    answer: 0,
    explanation: "У параметра name есть значение по умолчанию «мир». При вызове без аргумента используется оно."
  },
  {
    id: 101,
    topic: "modules",
    level: 1,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.sqrt(49))",
    options: ["7.0", "7", "49", "Ошибка: sqrt не подключён"],
    answer: 0,
    explanation: "import math подключает модуль, а math.sqrt(49) вызывает функцию из него. sqrt возвращает float — 7.0."
  },
  {
    id: 102,
    topic: "modules",
    level: 1,
    text: "Что выведет этот код?",
    code: "from math import pi\nprint(round(pi, 2))",
    options: ["3.14", "3.1", "3.14159", "Ошибка: pi не число"],
    answer: 0,
    explanation: "from math import pi берёт только число pi. round(pi, 2) округляет до двух знаков после запятой — 3.14."
  },
  {
    id: 103,
    topic: "strings",
    level: 1,
    text: "Что выведет этот код?",
    code: "word = \"кот\"\nprint(word[1])",
    options: ["о", "к", "т", "кот"],
    answer: 0,
    explanation: "Индексы начинаются с нуля: word[0] — «к», word[1] — «о», word[2] — «т»."
  },
  {
    id: 104,
    topic: "control",
    level: 1,
    text: "Что выведет этот код?",
    code: "age = 12\nif age >= 18:\n    print(\"взрослый\")\nelse:\n    print(\"ребёнок\")",
    options: ["ребёнок", "взрослый", "12", "Ничего"],
    answer: 0,
    explanation: "12 меньше 18, поэтому условие ложно и выполняется ветка else — «ребёнок»."
  },
  {
    id: 105,
    topic: "collections",
    level: 1,
    text: "Что выведет этот код?",
    code: "items = [10, 20, 30]\nprint(len(items))",
    options: ["3", "30", "2", "[10, 20, 30]"],
    answer: 0,
    explanation: "len() возвращает количество элементов в списке. В списке три числа, поэтому 3."
  },
  {
    id: 106,
    topic: "operators",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(2 ** 3 ** 2)",
    options: ["512", "64", "36", "8"],
    answer: 0,
    explanation: "Возведение в степень выполняется справа налево: сначала 3 ** 2 = 9, затем 2 ** 9 = 512."
  },
  {
    id: 107,
    topic: "strings",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(\"a,b,c\".split(\",\")[1])",
    options: ["b", "a", "c", "['a', 'b', 'c']"],
    answer: 0,
    explanation: "split(\",\") возвращает список ['a', 'b', 'c'], а индекс [1] берёт второй элемент — b."
  },
  // ----- Вторая партия: синтаксис и исключения до трёх вопросов на уровень -----
  {
    id: 108,
    topic: "syntax",
    level: 2,
    text: "Что выведет этот код?",
    code: "x = 4\nx += 3\nprint(x)",
    options: ["7", "43", "3", "Ошибка: += не существует"],
    answer: 0,
    explanation: "x += 3 — короткая запись x = x + 3. К 4 прибавляется 3, получается 7."
  },
  {
    id: 109,
    topic: "syntax",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(\"a\", \"b\", sep=\"-\")",
    options: ["a-b", "a b", "ab", "Ошибка: sep не существует"],
    answer: 0,
    explanation: "Параметр sep задаёт разделитель между аргументами print. По умолчанию там пробел, а здесь — дефис."
  },
  {
    id: 110,
    topic: "syntax",
    level: 3,
    text: "Что выведет этот код?",
    code: "point = (3, 4)\nx, y = point\nprint(x + y)",
    options: ["7", "34", "3 4", "Ошибка: кортеж нельзя распаковать"],
    answer: 0,
    explanation: "Кортеж (3, 4) распаковывается в x и y: x=3, y=4. Сумма равна 7."
  },
  {
    id: 111,
    topic: "syntax",
    level: 3,
    text: "Что выведет этот код?",
    code: "x = 10\ndef f():\n    x = 5\nf()\nprint(x)",
    options: ["10", "5", "15", "Ошибка: x не видна"],
    answer: 0,
    explanation: "Присваивание x = 5 внутри функции создаёт локальную переменную. Глобальная x остаётся 10; чтобы её изменить, нужно global x."
  },
  {
    id: 112,
    topic: "syntax",
    level: 4,
    text: "Что выведет этот код?",
    code: "print((n := 3) + n)",
    options: ["6", "3", "33", "Ошибка: := не существует"],
    answer: 0,
    explanation: "Оператор := (walrus) присваивает значение и сразу возвращает его. n становится 3, выражение даёт 3 + 3 = 6."
  },
  {
    id: 113,
    topic: "syntax",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(1 < 2 < 3)",
    options: ["True", "False", "Ошибка: две операции сравнения", "1"],
    answer: 0,
    explanation: "В Python сравнения можно объединять в цепочку: 1 < 2 < 3 означает (1 < 2) and (2 < 3). Оба условия истинны."
  },
  {
    id: 114,
    topic: "errors",
    level: 1,
    text: "Что произойдёт при запуске?",
    code: "print(score)",
    options: ["NameError: переменная score не определена", "Напечатает 0", "Напечатает score", "SyntaxError: нет скобок"],
    answer: 0,
    explanation: "Python ищет score среди переменных и не находит. Пока переменной нет, обращение к ней даёт NameError."
  },
  {
    id: 115,
    topic: "errors",
    level: 1,
    text: "Что произойдёт при запуске?",
    code: "print(\"5\" + 5)",
    options: ["TypeError: строку и число нельзя сложить", "Напечатает 10", "Напечатает 55", "ValueError: строка не число"],
    answer: 0,
    explanation: "Оператор + у строки означает склейку, а число 5 — не строка. Python не угадывает, что нужно превратить 5 в \"5\", и выбрасывает TypeError."
  },
  {
    id: 116,
    topic: "errors",
    level: 2,
    text: "Что произойдёт при запуске?",
    code: "items = [1, 2]\nprint(items[3])",
    options: ["IndexError: в списке нет индекса 3", "Напечатает 2", "Напечатает 3", "Напечатает None"],
    answer: 0,
    explanation: "Индексы списка из двух элементов — 0 и 1. Обращение к items[3] выходит за границы и даёт IndexError."
  },
  {
    id: 117,
    topic: "errors",
    level: 2,
    text: "Что произойдёт при запуске?",
    code: "hero = {\"hp\": 10}\nprint(hero[\"gold\"])",
    options: ["KeyError: ключа gold нет", "Напечатает 10", "Напечатает None", "Напечатает 0"],
    answer: 0,
    explanation: "В словаре есть только ключ hp. Обращение к отсутствующему ключу даёт KeyError; безопаснее hero.get(\"gold\")."
  },
  {
    id: 118,
    topic: "errors",
    level: 3,
    text: "Что выведет этот код?",
    code: "try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print(\"поймали\")",
    options: ["поймали", "Ошибка ZeroDivisionError", "0", "Ничего"],
    answer: 0,
    explanation: "Деление на ноль попадает в except ZeroDivisionError, поэтому программа не падает и печатает «поймали»."
  },
  {
    id: 119,
    topic: "errors",
    level: 3,
    text: "Что выведет этот код?",
    code: "try:\n    x = 10 / 2\nexcept ZeroDivisionError:\n    print(\"ошибка\")\nelse:\n    print(\"ок\")",
    options: ["ок", "ошибка", "5", "Ничего"],
    answer: 0,
    explanation: "Исключения не было, поэтому блок except пропускается, а else выполняется — печатается «ок»."
  },
  // ----- Третья партия: функции L1–L2 и модули L1–L3 -----
  {
    id: 120,
    topic: "functions",
    level: 1,
    text: "Что выведет этот код?",
    code: "def hello():\n    print(\"привет\")\n\nhello()",
    options: ["привет", "hello", "None", "Ошибка: функция не вызвана"],
    answer: 0,
    explanation: "def объявляет функцию, а строка hello() вызывает её. Внутри стоит print, поэтому на экране будет «привет»."
  },
  {
    id: 121,
    topic: "functions",
    level: 1,
    text: "Что выведет этот код?",
    code: "def square(x):\n    return x * x\n\nprint(square(4))",
    options: ["16", "8", "4", "None"],
    answer: 0,
    explanation: "В функцию передаётся 4: x=4. return возвращает 4 * 4 = 16, и print выводит результат."
  },
  {
    id: 122,
    topic: "functions",
    level: 2,
    text: "Что выведет этот код?",
    code: "def greet(name):\n    return \"привет, \" + name\n\nprint(greet(\"Аня\"))",
    options: ["привет, Аня", "привет, name", "Аня", "None"],
    answer: 0,
    explanation: "Аргумент «Аня» попадает в параметр name. Функция склеивает строки и возвращает «привет, Аня»."
  },
  {
    id: 123,
    topic: "modules",
    level: 1,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.floor(3.7))",
    options: ["3", "4", "3.7", "Ошибка: floor не подключён"],
    answer: 0,
    explanation: "import math подключает модуль, а math.floor() округляет вниз до целого. Для 3.7 это 3."
  },
  {
    id: 124,
    topic: "modules",
    level: 2,
    text: "Что выведет этот код?",
    code: "from math import ceil\nprint(ceil(2.1))",
    options: ["3", "2", "2.1", "Ошибка: ceil не подключён"],
    answer: 0,
    explanation: "from math import ceil берёт из модуля только функцию ceil. Она округляет вверх: 2.1 превращается в 3."
  },
  {
    id: 125,
    topic: "modules",
    level: 3,
    text: "Что выведет этот код?",
    code: "import math as m\nprint(m.sqrt(36))",
    options: ["6.0", "6", "36", "Ошибка: m не модуль"],
    answer: 0,
    explanation: "import math as m даёт модулю короткое имя m. Дальше функции вызывают через m, а sqrt возвращает float — 6.0."
  },
  {
    id: 126,
    topic: "modules",
    level: 3,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.pow(2, 3))",
    options: ["8.0", "8", "6", "9"],
    answer: 0,
    explanation: "math.pow(2, 3) возводит 2 в третью степень и возвращает float: 8.0, а не 8."
  },
  // ----- Четвёртая партия: последние тонкие клетки -----
  {
    id: 127,
    topic: "operators",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(10 % 4 + 2 ** 2)",
    options: ["6", "8", "4", "14"],
    answer: 0,
    explanation: "Сначала выполняются % и **: 10 % 4 = 2, 2 ** 2 = 4. Затем сложение: 2 + 4 = 6."
  },
  {
    id: 128,
    topic: "strings",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(\"кот\"[0])",
    options: ["к", "о", "т", "кот"],
    answer: 0,
    explanation: "Индексы начинаются с нуля: [0] — первый символ строки, то есть «к»."
  },
  {
    id: 129,
    topic: "strings",
    level: 1,
    text: "Что выведет этот код?",
    code: "print(\"да\" * 2)",
    options: ["дада", "да да", "2", "Ошибка: строку нельзя умножать"],
    answer: 0,
    explanation: "Умножение строки на число повторяет её: «да» * 2 даёт «дада»."
  },
  {
    id: 130,
    topic: "strings",
    level: 4,
    text: "Что выведет этот код?",
    code: "print(\"abcdef\"[1:4])",
    options: ["bcd", "abcd", "bcde", "abc"],
    answer: 0,
    explanation: "Срез [1:4] берёт символы с индексом 1 включительно до 4 не включая: b, c, d."
  },
  {
    id: 131,
    topic: "control",
    level: 1,
    text: "Что выведет этот код?",
    code: "x = 3\nif x > 0:\n    print(\"плюс\")",
    options: ["плюс", "3", "True", "Ничего"],
    answer: 0,
    explanation: "3 больше нуля, поэтому условие истинно и выполняется тело if — печатается «плюс»."
  },
  {
    id: 132,
    topic: "control",
    level: 1,
    text: "Что выведет этот код?",
    code: "x = 0\nif x:\n    print(\"да\")\nelse:\n    print(\"нет\")",
    options: ["нет", "да", "0", "Ничего"],
    answer: 0,
    explanation: "Ноль в условии считается ложью, поэтому выполняется ветка else — печатается «нет»."
  },
  {
    id: 133,
    topic: "collections",
    level: 1,
    text: "Что выведет этот код?",
    code: "print([10, 20, 30][2])",
    options: ["30", "20", "10", "Ошибка: у списка нет индексов"],
    answer: 0,
    explanation: "Индексы списка начинаются с нуля: [0] — 10, [1] — 20, [2] — 30."
  },
  {
    id: 134,
    topic: "collections",
    level: 1,
    text: "Что выведет этот код?",
    code: "items = [\"меч\", \"щит\"]\nprint(items[0])",
    options: ["меч", "щит", "0", "['меч', 'щит']"],
    answer: 0,
    explanation: "Первый элемент списка имеет индекс 0. Поэтому items[0] — это «меч»."
  },
  {
    id: 135,
    topic: "types",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(isinstance(True, int))",
    options: ["True", "False", "TypeError", "None"],
    answer: 0,
    explanation: "bool — подкласс int: True и False ведут себя как 1 и 0. Поэтому isinstance(True, int) возвращает True."
  },

  // ----- Пятая партия: ключевые темы L2–L3 до пяти вопросов -----
  {
    id: 136,
    topic: "syntax",
    level: 2,
    text: "Какой отступ на один уровень вложенности принят по стандарту PEP 8?",
    options: ["Четыре пробела", "Один символ табуляции", "Два пробела", "Отступа нет"],
    answer: 0,
    explanation: "PEP 8 требует четыре пробела на уровень. Python примет и другие отступы, если в блоке они одинаковы, но смешивать пробелы с табуляцией нельзя."
  },
  {
    id: 137,
    topic: "syntax",
    level: 2,
    text: "Что выведет этот код?",
    code: "print(\"Урон:\", 15)",
    options: ["Урон: 15", "Урон:15", "Урон:,15", "Ошибка: запятая внутри print"],
    answer: 0,
    explanation: "print принимает несколько аргументов и по умолчанию разделяет их пробелом (sep=\" \"). Поэтому между двоеточием и числом появится пробел."
  },
  {
    id: 138,
    topic: "syntax",
    level: 3,
    text: "Что выведет этот код?",
    code: "hp = 10\nprint(f\"HP: {hp}\")",
    options: ["HP: 10", "HP: {hp}", "HP: hp", "Ошибка: буквы f перед строкой не бывает"],
    answer: 0,
    explanation: "Буква f перед кавычками делает строку f-строкой: имя в фигурных скобках заменяется его значением."
  },
  {
    id: 139,
    topic: "syntax",
    level: 3,
    text: "Что выведет этот код?",
    code: "a = b = 3\nprint(a + b)",
    options: ["6", "3", "33", "Ошибка: так присваивать нельзя"],
    answer: 0,
    explanation: "Присваивание идёт справа налево: оба имени получают одно и то же значение 3, поэтому 3 + 3 = 6."
  },
  {
    id: 140,
    topic: "types",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(int(3.9))",
    options: ["3", "4", "3.9", "Ошибка: float нельзя превратить в int"],
    answer: 0,
    explanation: "int() отбрасывает дробную часть, а не округляет: int(3.9) — это 3. Для округления до ближайшего целого есть round()."
  },
  {
    id: 141,
    topic: "types",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(1 == 1.0)",
    options: ["True", "False", "1", "Ошибка: сравнивать int и float нельзя"],
    answer: 0,
    explanation: "Python сравнивает числа по значению, а не по типу: 1 и 1.0 равны, поэтому получается True."
  },
  {
    id: 142,
    topic: "operators",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(7 // 2, 7 % 2)",
    options: ["3 1", "3.5 1", "1 3", "3 3.5"],
    answer: 0,
    explanation: "// даёт целую часть деления: 7 // 2 = 3. % даёт остаток: 7 % 2 = 1. print через запятую выводит оба значения через пробел."
  },
  {
    id: 143,
    topic: "operators",
    level: 3,
    text: "Что выведет этот код?",
    code: "print(0.1 + 0.2 == 0.3)",
    options: ["False", "True", "0.3", "Ошибка"],
    answer: 0,
    explanation: "Дробные числа хранятся приближённо: 0.1 + 0.2 даёт 0.30000000000000004, а не ровно 0.3, поэтому сравнение — False. Для таких случаев есть math.isclose()."
  },
  {
    id: 144,
    topic: "functions",
    level: 2,
    text: "Что выведет этот код?",
    code: "def hit():\n    return 7\n\nprint(hit() + hit())",
    options: ["14", "7", "77", "None"],
    answer: 0,
    explanation: "Функция возвращает 7, и вызов можно использовать как число: 7 + 7 = 14."
  },
  {
    id: 145,
    topic: "functions",
    level: 2,
    text: "Что выведет этот код?",
    code: "def heal(hp):\n    return hp + 5\n\nhp = heal(10)\nprint(hp)",
    options: ["15", "10", "5", "None"],
    answer: 0,
    explanation: "Вызов возвращает 15, и это значение записывается в переменную hp. Параметр внутри функции — отдельное имя, оно не меняет внешнюю переменную само по себе."
  },
  {
    id: 146,
    topic: "functions",
    level: 3,
    text: "Что выведет этот код?",
    code: "def diff(a, b):\n    return a - b\n\nprint(diff(b=1, a=5))",
    options: ["4", "-4", "6", "Ошибка: аргументы переданы не по порядку"],
    answer: 0,
    explanation: "Именованные аргументы связываются по имени, а не по порядку: a = 5, b = 1, значит 5 − 1 = 4."
  },
  {
    id: 147,
    topic: "functions",
    level: 3,
    text: "Что выведет этот код?",
    code: "def stats():\n    return 3, 4\n\natk, hp = stats()\nprint(atk)",
    options: ["3", "4", "(3, 4)", "Ошибка: функция вернула два значения"],
    answer: 0,
    explanation: "return 3, 4 возвращает кортеж из двух чисел. Он распаковывается в atk и hp, поэтому atk = 3."
  },
  {
    id: 148,
    topic: "errors",
    level: 2,
    text: "Какая ошибка возникнет?",
    code: "print(\"меч\" + 5)",
    options: ["TypeError", "ValueError", "NameError", "Ошибки не будет: получится «меч5»"],
    answer: 0,
    explanation: "Складывать строку и число нельзя: Python не догадывается, что 5 нужно превратить в \"5\". Это TypeError; сначала нужен str(5)."
  },
  {
    id: 149,
    topic: "errors",
    level: 2,
    text: "Что произойдёт при запуске?",
    code: "hp = 10\nprint(hpp)",
    options: ["NameError: имени hpp нет", "TypeError: hpp — не число", "Напечатает 10", "Напечатает None"],
    answer: 0,
    explanation: "В имени опечатка: переменная hpp нигде не определена. Python ищет имена во время выполнения и падает с NameError."
  },
  {
    id: 150,
    topic: "errors",
    level: 3,
    text: "Что выведет этот код?",
    code: "try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print(\"спас\")\nfinally:\n    print(\"конец\")",
    options: ["спас, затем конец — двумя строками", "только спас", "только конец", "Ошибку не поймать, программа упадёт"],
    answer: 0,
    explanation: "except ловит ZeroDivisionError и печатает «спас», а finally выполняется всегда — после него печатается «конец»."
  },
  {
    id: 151,
    topic: "errors",
    level: 3,
    text: "Что выведет этот код?",
    code: "try:\n    int(\"abc\")\nexcept ValueError:\n    print(\"не число\")",
    options: ["не число", "Traceback: ValueError", "0", "abc"],
    answer: 0,
    explanation: "int() не может превратить «abc» в число и бросает ValueError. Его ловит except, поэтому на экране «не число»."
  },
  {
    id: 152,
    topic: "modules",
    level: 2,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.floor(-2.5))",
    options: ["-3", "-2", "-2.5", "Ошибка: floor не берёт отрицательные"],
    answer: 0,
    explanation: "math.floor() округляет вниз по числовой оси, а не к нулю: −2.5 → −3. Для округления к нулю есть int(), для ближайшего целого — round()."
  },
  {
    id: 153,
    topic: "modules",
    level: 2,
    text: "Что выведет этот код?",
    code: "import random\nprint(random.randint(1, 1))",
    options: ["1", "0", "Ошибка: границы должны различаться", "Случайное число от 0 до 1"],
    answer: 0,
    explanation: "randint(a, b) возвращает целое от a до b включительно. Когда a и b равны, выбирать не из чего — всегда 1."
  },
  {
    id: 154,
    topic: "modules",
    level: 3,
    text: "Что выведет этот код?",
    code: "from math import sqrt\nprint(type(sqrt(16)))",
    options: ["<class 'float'>", "<class 'int'>", "4", "Ошибка: sqrt не импортирован"],
    answer: 0,
    explanation: "math.sqrt() всегда возвращает float, даже когда корень целый: sqrt(16) — это 4.0, тип — float."
  },
  {
    id: 155,
    topic: "modules",
    level: 3,
    text: "Что выведет этот код?",
    code: "import math\nprint(math.ceil(math.sqrt(17)))",
    options: ["5", "4", "4.123", "17"],
    answer: 0,
    explanation: "math.sqrt(17) — примерно 4.123, а math.ceil() округляет вверх до целого: 5. Вложенные вызовы выполняются изнутри наружу."
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
