// Полный курс Python в школе деревни. Данные отделены от интерфейса:
// teacher-панель читает модули, уроки, теорию и параметры проверки.
//
// У модуля три урока. Первые два — теория и короткая практика, третий —
// экзамен модуля. После экзамена учитель даёт домашнее задание; пока оно
// не выполнено, следующий модуль закрыт.
const PY_COURSE = [
  {
    key: "syntax",
    title: "Синтаксис и основы",
    icon: "⌨",
    note: "Первые команды, переменные и отступы.",
    cheat: [
      "print() выводит значение, input() читает строку.",
      "Одно = — присваивание, два == — сравнение.",
      "Тело условия или цикла сдвигается на 4 пробела."
    ],
    lessons: [
      {
        key: "syntax-1",
        title: "Первая программа",
        level: 1,
        goal: "Научиться выводить текст и числа.",
        theory: [
          "Программа на Python — это последовательность команд. Самая первая команда — <code>print()</code>: она выводит значение на экран.",
          "Строка заключается в кавычки: <code>\"Привет\"</code> или <code>'Привет'</code>. Числа пишутся без кавычек: <code>print(2 + 3)</code>.",
          "Комментарий начинается с <code>#</code>. Всё после него Python не выполняет — это заметка для человека."
        ],
        example: "print(\"Привет, подземелье!\")\nprint(2 + 3)\n# это комментарий"
      },
      {
        key: "syntax-2",
        title: "Переменные",
        level: 1,
        goal: "Запоминать значения и давать им понятные имена.",
        theory: [
          "Переменная — это имя для значения. Присваивание делается одним знаком <code>=</code>: <code>hp = 100</code>.",
          "Имя начинается с буквы или <code>_</code>, может содержать цифры и не должно совпадать с ключевыми словами вроде <code>if</code> или <code>for</code>.",
          "Одно <code>=</code> — присваивание, два <code>==</code> — сравнение. Это разные операции."
        ],
        example: "hp = 100\ndamage = 15\nprint(hp - damage)"
      },
      {
        key: "syntax-3",
        title: "Ввод, числа и отступы",
        level: 2,
        exam: true,
        goal: "Читать ввод и собирать простые блоки кода.",
        theory: [
          "<code>input()</code> возвращает строку. Чтобы получить число, строку преобразуют: <code>int(input())</code> или <code>float(input())</code>.",
          "Блок кода в Python задаётся отступом. После <code>if</code>, <code>for</code> и <code>def</code> ставится двоеточие, а тело сдвигается на четыре пробела.",
          "Одинаковые отступы обязательны: именно по ним Python понимает, какие строки относятся к блоку."
        ],
        example: "age = int(input(\"Возраст: \"))\nif age >= 18:\n    print(\"Можно в подземелье\")\nelse:\n    print(\"Сначала подрасти\")"
      }
    ]
  },
  {
    key: "types",
    title: "Типы данных",
    icon: "◈",
    note: "Числа, строки, логика и None.",
    cheat: [
      "int — целое, float — с точкой, str — строка, bool — True/False.",
      "int() отбрасывает дробную часть, round() округляет.",
      "len() возвращает длину строки или списка."
    ],
    lessons: [
      {
        key: "types-1",
        title: "Числа",
        level: 1,
        goal: "Различать int и float и переводить одно в другое.",
        theory: [
          "<code>int</code> — целое число, <code>float</code> — число с точкой. <code>3</code> и <code>3.0</code> выглядят похоже, но это разные типы.",
          "<code>int(3.9)</code> отбрасывает дробную часть, а <code>round(3.9)</code> округляет. <code>float(3)</code> превращает целое в дробное.",
          "Деление <code>/</code> всегда даёт <code>float</code>, даже если делится нацело."
        ],
        example: "print(7 / 2)\nprint(7 // 2)\nprint(int(3.9), round(3.9))"
      },
      {
        key: "types-2",
        title: "Строки",
        level: 1,
        goal: "Собирать текст из частей и считать его длину.",
        theory: [
          "<code>str</code> — строка, последовательность символов в кавычках. Строки можно складывать: <code>\"hp: \" + str(10)</code>.",
          "<code>len(s)</code> возвращает количество символов. Пустая строка <code>\"\"</code> имеет длину 0.",
          "Строку с числом нельзя просто сложить с числом: сначала нужно привести одно к типу другого."
        ],
        example: "name = \"Герой\"\nhp = 100\nprint(name + \": \" + str(hp) + \" HP\")\nprint(len(name))"
      },
      {
        key: "types-3",
        title: "bool и None",
        level: 2,
        exam: true,
        goal: "Понимать истину, ложь и отсутствие значения.",
        theory: [
          "<code>bool</code> принимает два значения: <code>True</code> и <code>False</code>. Они пишутся с большой буквы.",
          "Пустые значения часто считаются ложными: <code>0</code>, <code>\"\"</code>, <code>[]</code>, <code>None</code>. Непустые — истинными.",
          "<code>None</code> — «значения нет». Это не ноль и не пустая строка, а отдельный тип."
        ],
        example: "alive = True\npoison = 0\nprint(bool(poison))\nprint(bool(\"\"))\nprint(None is None)"
      }
    ]
  },
  {
    key: "operators",
    title: "Операторы и выражения",
    icon: "±",
    note: "Арифметика, сравнения и логика.",
    cheat: [
      "// — целая часть, % — остаток, ** — степень.",
      "Скобки меняют порядок: (2 + 3) * 4.",
      "not выполняется раньше and, and — раньше or."
    ],
    lessons: [
      {
        key: "operators-1",
        title: "Арифметика",
        level: 1,
        goal: "Считать урон, золото и проценты.",
        theory: [
          "Основные операторы: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>. Деление с остатком — <code>%</code>, целая часть — <code>//</code>, степень — <code>**</code>.",
          "Умножение и деление выполняются раньше сложения. Скобки меняют порядок: <code>(2 + 3) * 4</code>.",
          "<code>%</code> часто проверяет чётность: <code>n % 2 == 0</code>."
        ],
        example: "gold = 100\nprice = 30\nprint(gold - price)\nprint(7 // 2, 7 % 2, 2 ** 3)"
      },
      {
        key: "operators-2",
        title: "Сравнения",
        level: 2,
        goal: "Проверять условия и не путать = и ==.",
        theory: [
          "Сравнения возвращают <code>True</code> или <code>False</code>: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>.",
          "Сравнения можно объединять цепочкой: <code>0 &lt; hp &lt;= 100</code> означает «hp больше нуля и не больше ста».",
          "Строки сравниваются посимвольно, поэтому <code>\"2\" &gt; \"10\"</code> — это сравнение текста, а не чисел."
        ],
        example: "hp = 40\nprint(hp > 0)\nprint(0 < hp <= 100)\nprint(\"2\" > \"10\")"
      },
      {
        key: "operators-3",
        title: "Логические операторы",
        level: 2,
        exam: true,
        goal: "Собирать сложные условия из простых.",
        theory: [
          "<code>and</code> истинно, когда истинны оба условия. <code>or</code> истинно, когда истинно хотя бы одно. <code>not</code> переворачивает значение.",
          "<code>not</code> выполняется раньше <code>and</code>, а <code>and</code> раньше <code>or</code>. Скобки делают порядок явным.",
          "Python вычисляет логику лениво: в <code>a and b</code> правая часть не выполняется, если <code>a</code> ложно."
        ],
        example: "hp = 30\npoison = 0\nprint(hp > 0 and poison == 0)\nprint(hp > 50 or poison > 0)\nprint(not poison)"
      }
    ]
  },
  {
    key: "strings",
    title: "Строки",
    icon: "✎",
    note: "Текст, срезы и форматирование.",
    cheat: [
      "s[0] — первый символ, s[-1] — последний.",
      "Срез s[1:4] берёт символы с 1 по 3, не включая 4.",
      "upper/lower/strip/split/join/replace меняют или делят строку."
    ],
    lessons: [
      {
        key: "strings-1",
        title: "Индексы и срезы",
        level: 2,
        goal: "Доставать символы и подстроки.",
        theory: [
          "Символы строки нумеруются с нуля. <code>s[0]</code> — первый, <code>s[-1]</code> — последний.",
          "Срез <code>s[start:end]</code> берёт символы с <code>start</code> до <code>end</code>, не включая <code>end</code>.",
          "Шаг задаётся третьим числом: <code>s[::-1]</code> переворачивает строку."
        ],
        example: "word = \"подземелье\"\nprint(word[0], word[-1])\nprint(word[2:6])\nprint(word[::-1])"
      },
      {
        key: "strings-2",
        title: "Методы строк",
        level: 2,
        goal: "Чистить и делить текст.",
        theory: [
          "<code>upper()</code> и <code>lower()</code> меняют регистр, <code>strip()</code> убирает пробелы по краям.",
          "<code>split()</code> делит строку на список, <code>join()</code> собирает список обратно в строку.",
          "<code>replace()</code> заменяет одну подстроку на другую, не меняя исходную строку: строки неизменяемы."
        ],
        example: "line = \"  меч, щит, зелье  \"\nprint(line.strip().split(\", \"))\nprint(\"-\".join([\"a\", \"b\"]))\nprint(line.replace(\"зелье\", \"ключ\"))"
      },
      {
        key: "strings-3",
        title: "f-строки",
        level: 2,
        exam: true,
        goal: "Собирать читаемый текст с числами.",
        theory: [
          "f-строка начинается с <code>f</code>: <code>f\"HP: {hp}\"</code>. В фигурных скобках можно писать выражения.",
          "Внутри скобок работают формат-спецификации: <code>{value:.2f}</code> — два знака после точки, <code>{n:&gt;5}</code> — выравнивание.",
          "f-строки читаются лучше, чем склейка через <code>+</code> и <code>str()</code>."
        ],
        example: "name = \"Герой\"\nhp = 87.5\nprint(f\"{name}: {hp:.1f} HP\")\nprint(f\"{hp / 100:.0%} здоровья\")"
      }
    ]
  },
  {
    key: "control",
    title: "Условия и циклы",
    icon: "⟳",
    note: "Ветвления, for и while.",
    cheat: [
      "После if/elif/else ставится двоеточие и отступ.",
      "for перебирает элементы, range(n) даёт 0…n-1.",
      "В while условие должно меняться, иначе цикл вечный."
    ],
    lessons: [
      {
        key: "control-1",
        title: "if, elif, else",
        level: 1,
        goal: "Выбирать одно действие из нескольких.",
        theory: [
          "<code>if</code> выполняет блок, если условие истинно. <code>elif</code> проверяет следующее условие, <code>else</code> срабатывает, когда не подошло ничего.",
          "Проверки идут сверху вниз, поэтому важные частные случаи ставят раньше общих.",
          "Тело каждого блока выделяется отступом. Двоеточие после условия обязательно."
        ],
        example: "hp = 25\nif hp <= 0:\n    print(\"Поражение\")\nelif hp < 30:\n    print(\"Опасно\")\nelse:\n    print(\"Можно идти\")"
      },
      {
        key: "control-2",
        title: "Цикл for",
        level: 1,
        goal: "Повторять действие для каждого элемента.",
        theory: [
          "<code>for x in items:</code> перебирает элементы. <code>range(n)</code> даёт числа от 0 до <code>n-1</code>.",
          "<code>break</code> завершает цикл досрочно, <code>continue</code> пропускает текущий шаг и переходит к следующему.",
          "Для счётчика удобно <code>for i in range(1, 6)</code>: числа 1–5."
        ],
        example: "total = 0\nfor coin in [1, 2, 5]:\n    total += coin\nprint(total)\nfor i in range(3):\n    print(i)"
      },
      {
        key: "control-3",
        title: "Цикл while",
        level: 2,
        exam: true,
        goal: "Повторять действие, пока условие истинно.",
        theory: [
          "<code>while condition:</code> повторяется, пока условие истинно. Внутри нужно менять переменную условия, иначе цикл станет вечным.",
          "Счётчик — типичный пример: <code>while hp &gt; 0: hp -= damage</code>.",
          "Если цикл нужен хотя бы один раз, условие проверяют после тела, но в Python для этого чаще пишут <code>while True</code> и <code>break</code>."
        ],
        example: "hp = 20\ndamage = 7\nwhile hp > 0:\n    hp -= damage\n    print(\"HP:\", hp)"
      }
    ]
  },
  {
    key: "collections",
    title: "Списки, словари, множества",
    icon: "▤",
    note: "Хранить не одно значение, а много.",
    cheat: [
      "Список хранит порядок и допускает повторы; append добавляет в конец.",
      "Словарь хранит пары ключ: значение; get не падает без ключа.",
      "Множество хранит только уникальные элементы, кортеж неизменяем."
    ],
    lessons: [
      {
        key: "collections-1",
        title: "Списки",
        level: 1,
        goal: "Хранить упорядоченный набор значений.",
        theory: [
          "Список — это <code>[1, 2, 3]</code>. Он хранит порядок и допускает повторы.",
          "<code>append()</code> добавляет элемент в конец, <code>len()</code> возвращает длину, индексы и срезы работают как у строк.",
          "Список изменяемый: <code>items[0] = \"меч\"</code> заменяет элемент."
        ],
        example: "bag = [\"меч\", \"зелье\"]\nbag.append(\"щит\")\nprint(bag, len(bag))\nprint(bag[0], bag[-1])"
      },
      {
        key: "collections-2",
        title: "Словари",
        level: 2,
        goal: "Связывать ключи со значениями.",
        theory: [
          "Словарь хранит пары <code>ключ: значение</code>: <code>{\"hp\": 100, \"gold\": 20}</code>.",
          "Доступ идёт по ключу: <code>hero[\"hp\"]</code>. <code>get()</code> не падает, если ключа нет, и может вернуть значение по умолчанию.",
          "<code>keys()</code>, <code>values()</code> и <code>items()</code> дают ключи, значения и пары."
        ],
        example: "hero = {\"hp\": 100, \"gold\": 20}\nprint(hero[\"hp\"])\nprint(hero.get(\"mana\", 0))\nfor key, value in hero.items():\n    print(key, value)"
      },
      {
        key: "collections-3",
        title: "Множества и кортежи",
        level: 2,
        exam: true,
        goal: "Выбирать контейнер под задачу.",
        theory: [
          "<code>set</code> хранит только уникальные элементы и не гарантирует порядок. Он хорош для проверки «есть ли уже».",
          "<code>tuple</code> похож на список, но неизменяемый: <code>(x, y)</code>. Его удобно использовать для координат.",
          "Список — порядок и изменения, множество — уникальность, словарь — связи, кортеж — неизменяемая запись."
        ],
        example: "seen = set()\nseen.add(\"orc\")\nseen.add(\"orc\")\nprint(seen, len(seen))\npoint = (3, 5)\nprint(point[0], point[1])"
      }
    ]
  },
  {
    key: "functions",
    title: "Функции",
    icon: "ƒ",
    note: "Разбивать программу на понятные шаги.",
    cheat: [
      "def name(args): объявляет функцию, return возвращает результат.",
      "Аргументы бывают позиционные, именованные и со значением по умолчанию.",
      "Локальные переменные не видны снаружи; лучше возвращать результат, чем менять global."
    ],
    lessons: [
      {
        key: "functions-1",
        title: "def и return",
        level: 2,
        goal: "Объявлять функцию и возвращать результат.",
        theory: [
          "Функция объявляется через <code>def name(args):</code>. Тело — с отступом.",
          "<code>return</code> возвращает значение и завершает функцию. Без <code>return</code> функция возвращает <code>None</code>.",
          "Функцию вызывают по имени: <code>damage(10, 3)</code>."
        ],
        example: "def damage(atk, defense):\n    return max(1, atk - defense)\n\nprint(damage(15, 4))"
      },
      {
        key: "functions-2",
        title: "Аргументы",
        level: 2,
        goal: "Передавать данные в функцию удобно.",
        theory: [
          "Позиционные аргументы передаются по порядку, именованные — по имени: <code>damage(atk=15, defense=4)</code>.",
          "Значение по умолчанию задаётся в объявлении: <code>def heal(amount=10):</code>.",
          "Не ставьте изменяемые значения по умолчанию вроде <code>[]</code>: они сохраняются между вызовами."
        ],
        example: "def heal(amount=10):\n    return amount * 2\n\nprint(heal())\nprint(heal(25))"
      },
      {
        key: "functions-3",
        title: "Область видимости",
        level: 3,
        exam: true,
        goal: "Понимать, где живут переменные.",
        theory: [
          "Переменные внутри функции локальны: снаружи их не видно. Параметры тоже локальны.",
          "Глобальную переменную можно прочитать, но менять её через <code>global</code> стоит только при необходимости.",
          "Лучше возвращать результат, чем менять глобальное состояние: так функцию проще проверить и использовать повторно."
        ],
        example: "hp = 100\ndef show_hp():\n    print(hp)\n\ndef hurt(amount):\n    return hp - amount\n\nshow_hp()\nprint(hurt(30))"
      }
    ]
  },
  {
    key: "errors",
    title: "Исключения",
    icon: "⚠",
    note: "Читать ошибки и обрабатывать их.",
    cheat: [
      "SyntaxError — код не разобрался; NameError — имя не определено.",
      "TypeError — неподходящий тип; ValueError — неподходящее значение.",
      "try/except ловит конкретную ошибку, finally выполняется всегда."
    ],
    lessons: [
      {
        key: "errors-1",
        title: "Какие бывают ошибки",
        level: 2,
        goal: "Отличать синтаксис от ошибки выполнения.",
        theory: [
          "<code>SyntaxError</code> — код не разобрался: забыли двоеточие, кавычку или скобку.",
          "<code>NameError</code> — имя не определено. <code>TypeError</code> — операция не подходит к типу. <code>ValueError</code> — тип верный, значение нет.",
          "Внизу traceback написано имя ошибки и сообщение: с них и начинают разбор."
        ],
        example: "age = int(\"двадцать\")\n# ValueError: invalid literal for int()\n# print(mana)\n# NameError: name 'mana' is not defined"
      },
      {
        key: "errors-2",
        title: "try и except",
        level: 2,
        goal: "Не давать ошибке уронить программу.",
        theory: [
          "Код в <code>try</code> выполняется под защитой. Если возникает указанная ошибка, управление переходит в <code>except</code>.",
          "<code>else</code> выполняется, если ошибки не было, <code>finally</code> — всегда.",
          "Ловите конкретные исключения, а не всё подряд: иначе настоящие ошибки спрячутся."
        ],
        example: "try:\n    gold = int(input(\"Золото: \"))\nexcept ValueError:\n    gold = 0\n    print(\"Это не число\")\nprint(\"Золото:\", gold)"
      },
      {
        key: "errors-3",
        title: "Свои ошибки",
        level: 3,
        exam: true,
        goal: "Сообщать о неверных данных понятно.",
        theory: [
          "<code>raise ValueError(\"сообщение\")</code> явно выбрасывает ошибку.",
          "Своя ошибка уместна, когда данные нарушают правило: отрицательное здоровье, пустое имя, неизвестный предмет.",
          "Сообщение должно объяснять, что именно не так, а не просто «ошибка»."
        ],
        example: "def set_hp(value):\n    if value < 0:\n        raise ValueError(\"HP не может быть отрицательным\")\n    return value\n\ntry:\n    set_hp(-5)\nexcept ValueError as err:\n    print(err)"
      }
    ]
  },
  {
    key: "modules",
    title: "Модули и импорт",
    icon: "⤓",
    note: "Пользоваться готовым кодом и своим.",
    cheat: [
      "import math подключает модуль целиком, from math import sqrt — одну функцию.",
      "math, random и datetime уже входят в стандартную библиотеку.",
      "Свой модуль — это файл .py; код запуска отделяют через if __name__ == \"__main__\"."
    ],
    lessons: [
      {
        key: "modules-1",
        title: "import",
        level: 2,
        goal: "Подключать чужие функции.",
        theory: [
          "<code>import math</code> подключает модуль целиком: функции вызываются как <code>math.sqrt(9)</code>.",
          "<code>from math import sqrt</code> импортирует только нужную функцию: <code>sqrt(9)</code>.",
          "Псевдоним <code>import random as rnd</code> сокращает длинное имя."
        ],
        example: "import math\nfrom random import randint\n\nprint(math.sqrt(16))\nprint(randint(1, 6))"
      },
      {
        key: "modules-2",
        title: "Стандартная библиотека",
        level: 2,
        goal: "Знать, где искать готовые инструменты.",
        theory: [
          "<code>math</code> — корни, округление, константы. <code>random</code> — случайные числа и выбор.",
          "<code>datetime</code> — даты и время. <code>collections</code> — удобные контейнеры вроде <code>Counter</code>.",
          "Стандартная библиотека уже установлена вместе с Python: её не нужно скачивать."
        ],
        example: "from random import choice\nfrom datetime import date\n\nprint(choice([\"меч\", \"щит\", \"зелье\"]))\nprint(date.today())"
      },
      {
        key: "modules-3",
        title: "Свои модули",
        level: 3,
        exam: true,
        goal: "Выносить код в отдельный файл.",
        theory: [
          "Файл <code>hero.py</code> с функциями можно импортировать: <code>import hero</code>, затем <code>hero.damage(10, 3)</code>.",
          "Имя файла без <code>.py</code> становится именем модуля. Файл должен лежать рядом с программой или в пути импорта.",
          "<code>if __name__ == \"__main__\":</code> отделяет запуск файла от его импорта: код внутри выполняется только при прямом запуске."
        ],
        example: "# hero.py\ndef damage(atk, defense):\n    return max(1, atk - defense)\n\n# main.py\nimport hero\nprint(hero.damage(15, 4))"
      }
    ]
  }
];

// Цены и награды курса. Золото списывается из банка деревни.
const PY_COURSE_RULES = {
  lessonPrice: 35,
  examPrice: 50,
  lessonReward: 10,
  moduleReward: 120,
  modulePotion: "big_potion",
  bonusHp: 2,
  bonusDmgEvery: 3,
  bonusGoldPct: 0.01
};

// Домашнее задание после экзамена модуля. progress считает teacher-код.
const PY_COURSE_QUESTS = {
  syntax: { kind: "kills", need: 3, text: "Победи 3 монстров" },
  types: { kind: "correct", need: 5, text: "Ответь верно на 5 вопросов" },
  operators: { kind: "ore", need: 5, text: "Собери 5 руды" },
  strings: { kind: "correct", need: 10, text: "Ответь верно на 10 вопросов" },
  control: { kind: "kills", need: 6, text: "Победи 6 монстров" },
  collections: { kind: "materials", need: 10, text: "Собери 10 материалов" },
  functions: { kind: "correct", need: 15, text: "Ответь верно на 15 вопросов" },
  errors: { kind: "kills", need: 8, text: "Победи 8 монстров" },
  modules: { kind: "boss", need: 1, text: "Победи дракона" }
};
