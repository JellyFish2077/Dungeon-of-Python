/* PyDungeon — локализация.
 *
 * Русский — исходный язык: игра собирает русские строки. В английском
 * режиме переводятся уже готовые строки на границе DOM, поэтому игровая
 * логика не знает о языках и не обрастает ветками if (lang).
 *
 * Три слоя:
 *   1. DICT — точный словарь «строка → строка» (меню, HUD, диалоги);
 *   2. RULES — правила для строк с числами и вставками;
 *   3. MutationObserver — переводит всё, что игра дописала в DOM после
 *      перерисовки.
 *
 * Язык: ?lang=en в адресе, сохранённый выбор (localStorage), иначе
 * navigator.languages. Ячейки кода (<pre>, <code>, textarea) не трогаем.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "pydungeon.lang";
  var LANG = "ru";

  /* ------------------------------------------------------------------ */
  /* Выбор языка                                                         */
  /* ------------------------------------------------------------------ */

  function normalize(code) {
    code = String(code || "").toLowerCase();
    if (code.indexOf("en") === 0) return "en";
    if (code.indexOf("ru") === 0) return "ru";
    // Соседние языки читают русскую версию лучше английской.
    if (/^(uk|be|kk|ky|tg|uz|az|hy|ka)$/.test(code)) return "ru";
    return "";
  }

  function detectLanguage() {
    var forced = "";
    try {
      forced = normalize(new URLSearchParams(location.search).get("lang"));
    } catch (e) { /* старый браузер */ }
    if (forced) return forced;

    var saved = "";
    try { saved = normalize(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    if (saved) return saved;

    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ""];
    for (var i = 0; i < list.length; i++) {
      var code = normalize(String(list[i]).split("-")[0]);
      if (code) return code;
    }
    return "en";
  }

  function setLanguage(code) {
    code = normalize(code) || "ru";
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    LANG = code;
    if (code === "ru") {
      // Перезагрузка возвращает исходные русские строки: обратный перевод
      // из DOM не нужен, а игра восстанавливает состояние из автосейва.
      if (currentIsEnglish()) reload();
      return;
    }
    translateDocument();
    syncSwitch();
  }

  function currentIsEnglish() {
    return document.documentElement.lang === "en";
  }

  function reload() {
    try { location.reload(); } catch (e) {}
  }

  /* ------------------------------------------------------------------ */
  /* Словарь                                                             */
  /* ------------------------------------------------------------------ */

  var DICT = {
    /* --- главное меню и пауза --- */
    "подземелье, где код — оружие": "a dungeon where code is the weapon",
    "Продолжить": "Continue",
    "последний поход": "last expedition",
    "Новая игра": "New game",
    "стража у входа": "the gate warden",
    "Загрузить": "Load",
    "нет сохранения": "no save",
    "Справочник": "Codex",
    "управление и бестиарий": "controls and bestiary",
    "Обновления": "Updates",
    "что нового в игре": "what's new",
    "Настройки": "Settings",
    "звук и экран": "sound and display",
    "Профиль": "Profile",
    "гость": "guest",
    "Об игре": "About",
    "Пауза": "Paused",
    "Поход приостановлен": "Expedition paused",
    "Здесь стена.": "There's a wall here.",
    "Ящик наугад": "Random crate",
    "Цены этого этажа": "Prices on this floor",
    "Сумка:": "Bag:",
    "вещей · зелий": "items · potions",
    "вернуться в игру": "back to the game",
    "Сохранить": "Save",
    "записать поход": "record the expedition",
    "вернуться в бой": "back to the battle",
    "В деревню": "To the village",
    "поход сохранится": "the expedition will be saved",
    "Выход в Меню": "Exit to menu",
    "Поход сохраняется автоматически.": "The expedition saves automatically.",
    "Главное меню": "Main menu",
    "Меню паузы": "Pause menu",
    "Игровое меню": "Game menu",

    /* --- нижняя панель и HUD --- */
    "Этаж": "Floor",
    "Первый спуск": "First Descent",
    "Глубина пещер": "Depths of the Caves",
    "Костяные коридоры": "Bone Corridors",
    "Склепы": "Crypts",
    "Ледяные залы": "Ice Halls",
    "Замёрзшая река": "Frozen River",
    "Разлом": "The Rift",
    "Острова": "The Islands",
    "Тёмная анфилада": "Dark Enfilade",
    "Сокровищница": "Treasure Vault",
    "Пещеры новичка": "Novice Caves",
    "Забытые катакомбы": "Forgotten Catacombs",
    "Обитель демонов": "Demon Abode",
    "Логово дракона": "Dragon's Lair",
    "Гоблин-вожак": "Goblin Leader",
    "Некромант": "Necromancer",
    "Король големов": "Golem King",
    "Владыка демонов": "Demon Lord",
    "Дракон": "Dragon",
    "Генерация и проверка карты…": "Generating and checking the map…",
    "Генерация этажа упала": "Floor generation failed",
    "Карта": "Map",
    "Мини-карта": "Minimap",
    "Инвентарь": "Inventory",
    "Журнал": "Journal",
    "Герой": "Hero",
    "Уровень": "Level",
    "Ур.": "Lv.",
    "Золото:": "Gold:",
    "Здоровье:": "Health:",
    "Защита:": "Defence:",
    "Урон:": "Damage:",
    "Взаимодействовать": "Interact",
    "Пропустить ход": "Skip turn",
    "Спуститься": "Descend",
    "Статы": "Stats",
    "Бонусы": "Bonuses",
    "Достижения": "Achievements",
    "Оружие": "Weapon",
    "Броня": "Armor",
    "Щит": "Shield",
    "Урон": "Damage",
    "Амулет": "Amulet",
    "Умение похода": "Expedition skill",
    "Знамение похода": "Expedition omen",
    "Состояние героя": "Hero status",
    "Здоровье героя": "Hero health",
    "Кузница": "Forge",
    "Лавка": "Shop",
    "Колодец": "Well",
    "Деревня": "Village",
    "Локация": "Location",
    "Место": "Place",
    "Путь героя": "Hero's path",
    "Кошелёк и награды": "Purse and rewards",
    "Крыша для амбара": "Roof for the barn",
    "Взять золото и зелья из банка в этот поход":
      "Take gold and potions from the village bank on this expedition",

    /* --- настройки --- */
    "Звук": "Sound",
    "Громкость": "Volume",
    "Размер мини-карты": "Minimap size",
    "Меньше анимации": "Reduce motion",
    "На весь экран": "Fullscreen",
    "На весь экран (F11)": "Fullscreen (F11)",
    "Сбросить подсказки": "Reset hints",
    "Сбросить прогресс кампании": "Reset campaign progress",
    "Настройки хранятся в этом браузере. Управление — в «Справочнике».":
      "Settings are stored in this browser. Controls are in the Codex.",
    "Экран": "Display",
    "Язык": "Language",
    "Язык игры": "Game language",
    "Интерфейс и вопросы": "Interface and questions",
    "Язык интерфейса, вопросов и подсказок.":
      "Language of the interface, questions and hints.",
    "Управление": "Controls",
    "Версия": "Version",
    "Назад": "Back",
    "← Назад": "← Back",
    "Закрыть": "Close",
    "Скрыть": "Hide",
    "Показать": "Show",
    "Отмена": "Cancel",
    "Подтвердить": "Confirm",
    "Подтверждение": "Confirmation",
    "ОК": "OK",
    "Далее": "Next",
    "Готово": "Done",
    "Копировать": "Copy",
    "Показать JSON": "Show JSON",
    "Резервная копия": "Backup",
    "Содержимое резервной копии": "Backup contents",
    "Экспорт": "Export",
    "Импорт": "Import",

    /* --- подсказки элементов --- */
    "Карта подземелья": "Dungeon map",
    "Ячейки сохранений": "Save slots",
    "Закрыть сохранения": "Close saves",
    "Масштаб мини-карты": "Minimap zoom",
    "Увеличить масштаб мини-карты": "Zoom minimap in",
    "Уменьшить масштаб мини-карты": "Zoom minimap out",
    "Этаж в подземелье или деревня: где ты и что делать дальше.":
      "Your floor in the dungeon or the village: where you are and what to do next.",
    "Мини-карта этажа: где герой, лестница и живые монстры. Клавиша M.":
      "Floor minimap: the hero, the stairs and living monsters. Key M.",
    "Панель героя.": "Hero panel.",
    "Открыть журнал кампании.": "Open the campaign journal.",
    "Вернуться в деревню.": "Return to the village.",
    "Взаимодействовать с тем, что рядом: сундук, торговец, лестница. Клавиша E.":
      "Interact with what's nearby: chest, trader, stairs. Key E.",
    "Пропустить ход: герой стоит, монстры ходят. Клавиша Пробел.":
      "Skip a turn: the hero stands still, monsters move. Key Space.",
    "Закрыть. Клавиша Escape.": "Close. Key Escape.",
    "Золото в кошельке похода.": "Gold in the expedition purse.",
    "Кошелёк, снаряжение и сумка в одном окне.":
      "Purse, equipment and bag in one window.",
    "Кузница: улучшения героя у кузнеца в деревне.":
      "Forge: hero upgrades at the village smith.",
    "Лавка: зелья, снаряжение этажа и ящик наугад.":
      "Shop: potions, floor gear and a random crate.",
    "Журнал кампании: главы сюжета, поручения и архив.":
      "Campaign journal: story chapters, quests and archive.",
    "Показать или скрыть мини-карту.": "Show or hide the minimap.",

    /* --- окно входа в подземелье --- */
    "Уровень сложности": "Difficulty",
    "Режим похода": "Expedition mode",
    "Лёгкий": "Easy",
    "Обычный": "Normal",
    "Сложный": "Hard",
    "Обычный спуск": "Normal descent",
    "Бесконечное подземелье": "Endless dungeon",
    "Внизу ждут вопросы и задачи по Python. Выбери сложность и режим.":
      "Questions and Python tasks await below. Choose a difficulty and a mode.",
    "Вопросы, «повтори код» и «вставь пропущенное». Без def":
      "Questions, “repeat the code” and “fill the gap”. No def",
    "Плюс «найди ошибку» и иногда написание функции (def)":
      "Also “find the bug” and occasional function writing (def)",
    "Много заданий на код и функций, сильные монстры":
      "Many code tasks and functions, stronger monsters",
    "15 этажей до дракона. Победа закрывает поход":
      "15 floors to the dragon. Victory ends the expedition",
    "После дракона этажи не кончаются — спуск идёт, пока герой жив":
      "Floors don't end after the dragon — the descent lasts while the hero lives",
    "Страж входа": "Gate warden",
    "Спуск в подземелье": "Descent into the dungeon",
    "Начать поход": "Start expedition",
    "Начать спуск": "Begin the descent",
    "Сюжетная кампания": "Story campaign",
    "Бесконечный режим": "Endless mode",
    "Повторить код": "Repeat code",
    "Написать функцию": "Write a function",
    "Найти ошибку": "Find the bug",
    "Вставить пропущенное": "Fill the gap",

    /* --- сохранения --- */
    "Сохранения": "Saves",
    "Ячейка": "Slot",
    "Выбери ячейку": "Choose a slot",
    "Скриншот сохранения": "Save screenshot",
    "Название сохранения": "Save name",
    "Скриншот недоступен": "Screenshot unavailable",
    "Записать новое сохранение": "Write a new save",
    "Удалить": "Delete",
    "Перезаписать": "Overwrite",
    "Переименовать": "Rename",
    "Сохранить поход": "Save expedition",
    "Загрузить поход": "Load expedition",
    "Удалить сохранение?": "Delete this save?",
    "Название не может быть пустым.": "The name can't be empty.",
    "Резервная копия:": "Backup:",
    "Скопировано. Вставь текст в файл .json.":
      "Copied. Paste the text into a .json file.",
    "Выдели текст и скопируй вручную.": "Select the text and copy it manually.",
    "Файл не скачался — копия открыта текстом.":
      "The file didn't download — the backup is open as text.",
    "Импортировать": "Import",
    "Импортировать сохранения?": "Import saves?",
    "Это не файл резервной копии PyDungeon.":
      "This isn't a PyDungeon backup file.",
    "В файле нет сохранений.": "The file contains no saves.",
    "В файле нет подходящих сохранений.": "The file contains no matching saves.",
    "Не удалось прочитать файл.": "Couldn't read the file.",
    "Не удалось загрузить это сохранение.": "Couldn't load this save.",
    "Не хватает места в браузере для сохранения.":
      "Not enough browser storage for the save.",
    "Сначала начни игру: сохранять пока нечего.":
      "Start a game first: there's nothing to save yet.",
    "Сначала войди в профиль.": "Sign in to your profile first.",
    "Поход": "Expedition",
    "Деревня ·": "Village ·",
    "пуста": "is empty",
    "Сохранить имя": "Save name",
    "Сохранение переименовано.": "Save renamed.",
    "Сохранение удалено.": "Save deleted.",
    "Сохранено:": "Saved:",
    "Текущие слоты будут заменены.": "The current slots will be replaced.",
    "Если файл не появился, нажми «Показать JSON».":
      "If the file didn't appear, press “Show JSON”.",
    "» будет удалено. Это действие нельзя отменить.":
      "» will be deleted. This can't be undone.",

    /* --- профиль и аккаунт --- */
    "Имя": "Name",
    "Игрок": "Player",
    "Русский": "Russian",
    "Введи имя": "Enter a name",
    "Введите имя": "Enter a name",
    "PIN минимум 3 символа": "PIN: at least 3 characters",
    "Минимум 3 символа": "At least 3 characters",
    "Как тебя зовут?": "What's your name?",
    "Сохранить имя": "Save name",
    "Изменить имя": "Change name",
    "Сменить игрока": "Switch player",
    "Войти": "Sign in",
    "Выйти": "Sign out",
    "Выйти из аккаунта?": "Sign out of your account?",
    "Создать аккаунт": "Create account",
    "Вход недоступен": "Sign-in unavailable",
    "Сервер недоступен": "Server unavailable",
    "Проверяем…": "Checking…",
    "Не получилось": "Something went wrong",
    "Не получилось сохранить имя": "Couldn't save the name",
    "Не удалось переименовать профиль": "Couldn't rename the profile",
    "Не удалось сохранить имя": "Couldn't save the name",
    "Профиль не найден": "Profile not found",
    "У этого имени уже есть сохранение": "This name already has a save",
    "Это имя уже занято": "This name is taken",
    "Не удалось перенести сохранение": "Couldn't transfer the save",
    "Профиль и сохранения хранятся в этом браузере.":
      "Your profile and saves are stored in this browser.",
    "Профиль и уровень знаний синхронизируются с сервером.":
      "Your profile and knowledge level sync with the server.",
    "Панель учителя": "Teacher dashboard",
    "преподаватель": "teacher",
    "ученик": "student",
    "локальный профиль": "local profile",
    "Остаться": "Stay",
    "Начать заново": "Start over",
    "Сбросить": "Reset",
    "Начать новую игру?": "Start a new game?",
    "Сбросить прогресс кампании?": "Reset campaign progress?",
    "Сюжетная кампания начнётся заново: главы, журнал и печати.":
      "The story campaign will start over: chapters, journal and seals.",
    "Главы, журнал и печати начнутся заново. Деревня, материалы, постройки и текущий поход останутся.":
      "Chapters, journal and seals will start over. The village, materials, buildings and the current expedition remain.",
    "Деревня, материалы и постройки останутся. Текущий поход будет потерян.":
      "The village, materials and buildings remain. The current expedition will be lost.",
    "Поход сохранится. Вернуться можно будет через «Загрузить».":
      "The expedition will be saved. You can return via “Load”.",
    "Подсказки и вид панели сброшены: после перезагрузки они вернутся к обычным.":
      "Hints and the panel layout were reset: after a reload they return to the defaults.",
    "Сначала войди": "Sign in first",
    "сначала заверши бой": "finish the battle first",
    "игра ещё грузится": "the game is still loading",
    "ячейки сохранений": "save slots",
    "этаж": "floor",
    "Выйти из полного экрана": "Exit fullscreen",
    "Полный экран": "Fullscreen",

    /* --- достижения профиля --- */
    "10 верных ответов подряд": "10 correct answers in a row",
    "100% верных ответов в походе": "100% correct answers in an expedition",
    "Безупречно": "Flawless",
    "Выживший": "Survivor",
    "Глубинный странник": "Deep Wanderer",
    "Дойти до 5 этажа": "Reach floor 5",
    "Дойти до 7 этажа": "Reach floor 7",
    "Дойти до 9 этажа": "Reach floor 9",
    "Завершить первый поход": "Complete your first expedition",
    "Играть 3 дня подряд": "Play 3 days in a row",
    "Кодер": "Coder",
    "На волне": "On a Roll",
    "Опытный следопыт": "Seasoned Pathfinder",
    "Первый шаг": "First Step",
    "Победить дракона": "Defeat the dragon",
    "Постоянство": "Persistence",
    "Решить 10 задач на код": "Solve 10 code tasks",
    "Убийца драконов": "Dragonslayer",
    "больших зелий:": "large potions:",
    "малых зелий:": "small potions:",
    "древесина": "wood",
    "обломки": "scraps",
    "руда": "ore",
    "золота": "gold",
    "пусто": "empty",

    /* --- бой --- */
    "Ход врага": "Enemy turn",
    "Атака": "Attack",
    "Действие": "Action",
    "Попадание": "Hit",
    "Крит ×": "Crit ×",
    "Проверить": "Check",
    "Решение": "Solution",
    "Проверка уровня": "Level check",
    "Дракон": "Dragon",
    "Некромант": "Necromancer",
    "Владыка демонов": "Demon lord",
    "Король големов": "Golem king",
    "Гоблин-вожак": "Goblin chief",
    "Пещеры новичка": "Novice caves",
    "Забытые катакомбы": "Forgotten catacombs",
    "Ледяные залы": "Ice halls",
    "Обитель демонов": "Demon lair",
    "Логово дракона": "Dragon's lair",
    "Сокровищница": "Treasury",
    "Призрак ошибки": "Ghost of error",
    "Торговец": "Trader",
    "Рычаг": "Lever",
    "Табличка": "Plaque",
    "препятствие": "obstacle",
    "вкл": "on",
    "выкл": "off",
    "Новичок": "Novice",
    "В работе": "In progress",
    "Впереди": "Ahead",
    "Пройден": "Cleared",
    "Пройдено": "Cleared",
    "Готово к сдаче": "Ready to turn in",
    "Добыча": "Loot",
    "Трофей": "Trophy",
    "Сюжет": "Story",
    "Награда": "Reward",
    "Награда:": "Reward:",
    "Победа": "Victory",
    "Поражение": "Defeat",
    "Ты пал в бою": "You fell in battle",
    "Поход окончен": "The expedition is over",
    "Итог похода": "Run summary",
    "Золото за поход": "Gold earned",
    "Золото сейчас": "Gold now",
    "В банк": "To the bank",
    "Ответы": "Answers",
    "Монстры": "Monsters",
    "Код": "Code",
    "Повторение кода": "Code retyping",
    "Дань дракону": "Dragon tribute",
    "Использовать амулет": "Use the amulet",
    "Материалы и ключи остаются в деревне: следующий поход начнётся с ними.":
      "Materials and keys stay in the village: the next expedition starts with them.",
    "Снаряжение, зелья, уровни и кузница этого похода потеряны. Материалы и ключи остались в деревне.":
      "The gear, potions, levels and forge of this run are lost. The materials and keys remain in the village.",
    "Что забрать с собой?": "What will you take with you?",
    "Темы ещё не проверены — сыграй ещё.": "No topics tested yet — play another run.",
    "Разбор по темам": "Topic breakdown",
    "Дракон повержен!": "The dragon is defeated!",
    "Дракон повержен. Можно спуститься в бездну или вернуться в деревню.":
      "The dragon is defeated. You can descend into the abyss or return to the village.",
    "Амулет вернёт героя на этот этаж. Материалы и ключи уже в деревне.":
      "The amulet will bring the hero back to this floor. Materials and keys are already in the village.",
    "Вернись в деревню: золото в банке, материалы и ключи сохранены. Купи улучшение или повтори слабую тему.":
      "Return to the village: your gold is in the bank, materials and keys are safe. Buy an upgrade or review a weak topic.",
    "В деревню": "To the village",
    "Спуститься глубже": "Descend deeper",
    "Печати глубины": "Seals of the Depths",
    "Печати глубины.": "Seals of the Depths.",
    "Печати на месте. Деревня переживёт ещё одну зиму. За последней дверью — тишина, и теперь только тебе решать, стоит ли её открывать.":
      "The seals are in place. The village will survive another winter. Beyond the last door there is silence — and now only you can decide whether to open it.",
    "Задание:": "Task:",
    "Найдено:": "Found:",
    "Найден ключ:": "Key found:",
    "Рекорд: этаж": "Record: floor",
    "Подсказка": "Hint",
    "Подсказка уже взята": "The hint has already been taken",
    "Подсказка не работает": "The hint doesn't work",
    "Нужен свиток подсказки": "A hint scroll is required",
    "Свиток подсказки использован": "Hint scroll used",
    "Мало золота": "Not enough gold",
    "Не хватает золота": "Not enough gold",
    "Нет свободной клетки рядом": "No free tile nearby",
    "Нет активного повторяемого задания": "No active repeatable task",
    "Нет похода, который можно свернуть": "No expedition to collapse",
    "Дверь заперта": "The door is locked",
    "Сейчас нет боя": "There's no battle right now",
    "Сейчас:": "Now:",
    "Особый приём": "Special move",
    "Отряд повержен.": "The squad is defeated.",
    "Враг впадает в ярость!": "The enemy flies into a rage!",
    "Враг ошибся. Действие не сработало.": "The enemy missed. The action failed.",
    "Цепь держит: сорви её в бою или пережди.":
      "The chain holds: break it in battle or wait it out.",
    "Яд снят": "Poison cured",
    "Копирование запрещено — набери код руками":
      "Copying is disabled — type the code by hand",
    "Восстанавливает здоровье в бою.": "Restores health in battle.",
    "Лечит сильнее малого.": "Heals more than the small one.",
    "Зелье сейчас бесполезно": "The potion is useless right now",
    "Склад": "Storehouse",
    "Склады": "Storehouses",

    /* --- деревня и кампания --- */
    "Амбар": "Barn",
    "Дом мастера": "Master's house",
    "Староста": "Elder",
    "Страж": "Warden",
    "Печати глубины": "Seals of the Deep",
    "Поручения": "Quests",
    "Архив": "Archive",
    "Карта": "Map",
    "Глава": "Chapter",
    "Портал в деревню открыт": "The village portal is open",
    "Портал в деревню": "Village portal",
    "Войти в портал в деревню": "Enter the village portal",
    "Выйти на улицу": "Go outside",
    "поднята до конца — можно спускаться в бездну.":
      "is fully raised — you can descend into the abyss.",
    "тогда золото и амулеты будут копиться между походами.":
      "then gold and amulets will accumulate between expeditions.",
    "поговори со старостой": "talk to the elder",
    "награда ждёт у старосты": "the reward awaits at the elder",
    "Проклятие лича: подсказка не работает":
      "Lich's curse: hints don't work",
    "Оберег глубины": "Depth ward",
    "Печать мастера": "Master's seal",

    /* --- панель деревни и городской HUD --- */
    "· опыт": "· experience",
    "Защита": "Defence",
    "Зелий": "Potions",
    "Зелий:": "Potions:",
    "Заряды": "Charges",
    "Подземелье": "Dungeon",
    "Подземелье:": "Dungeon:",
    "Характеристики": "Stats",
    "Сумка": "Bag",
    "Пробел": "Space",
    "· дракон в конце": "· dragon at the end",
    "Свернуть поход": "Collapse expedition",
    "сначала войди": "sign in first",
    "знакомство": "introduction",
    "Поговори с жителями →": "Talk to the villagers →",
    "Пока пусто. Ищи сундуки и побеждай монстров.":
      "Empty for now. Look for chests and defeat monsters.",
    "Загрузка этажа…": "Loading floor…",
    "Готовим карту…": "Preparing the map…",
    "Генерация и проверка проходимости идут на этом компьютере.":
      "Generation and reachability checks run on this computer.",
    "Войди в аккаунт на главной странице — тогда золото и амулеты будут копиться между походами.":
      "Sign in on the main page — then gold and amulets will accumulate between expeditions.",
    "Дома отмечены дверьми: подойди и нажми E. У стража у входа — спуск в подземелье.":
      "Houses are marked by doors: walk up and press E. The gate warden has the descent into the dungeon.",
    "PyDungeon — рогалик-экспедиция: спускайся по этажам, отвечай на вопросы по Python и пиши функции. Золото, материалы и ключи остаются в деревне даже после поражения.":
      "PyDungeon is a roguelike expedition: descend floor by floor, answer Python questions and write functions. Gold, materials and keys stay in the village even after a defeat.",
    "Каждый поход начинается у стража: он показывает сложность и режим. Пятнадцать этажей, пять боссов и дракон в конце. Управление и звук — в настройках.":
      "Every expedition starts with the gate warden: he shows the difficulty and mode. Fifteen floors, five bosses and a dragon at the end. Controls and sound are in the settings.",
    ". Публичная сборка работает без сервера: профиль и сохранения лежат в этом браузере.":
      ". The public build runs without a server: your profile and saves live in this browser.",
    "Код, тексты и часть идей созданы при участии ИИ. Графика — Aseprite и открытые тайлы DCSS (CC0), без AI-генерации.":
      "Code, texts and some of the ideas were made with AI assistance. Art is Aseprite and open DCSS tiles (CC0), with no AI generation.",
    "Скопируй текст и сохрани его в файл. Импорт примет его обратно.":
      "Copy the text and save it to a file. Import will take it back.",
    "WASD или стрелки — идти · E — действие · Пробел — пропустить ход.":
      "WASD or arrows — move · E — act · Space — skip a turn.",
    "Кузница: вложить золото в урон, защиту или здоровье.":
      "Forge: invest gold in damage, defence or health.",
    "Пауза: сохранить, загрузить, настройки, выйти в меню.":
      "Pause: save, load, settings, exit to menu.",
    "<b>Оружие: пусто</b><br>Вещь из сумки встанет сюда. Сумка открывается клавишей I.":
      "<b>Weapon: empty</b><br>An item from the bag goes here. Open the bag with I.",
    "<b>Броня: пусто</b><br>Вещь из сумки встанет сюда. Сумка открывается клавишей I.":
      "<b>Armor: empty</b><br>An item from the bag goes here. Open the bag with I.",
    "<b>Щит: пусто</b><br>Вещь из сумки встанет сюда. Сумка открывается клавишей I.":
      "<b>Shield: empty</b><br>An item from the bag goes here. Open the bag with I.",
    "<b>Амулет: пусто</b><br>Вещь из сумки встанет сюда. Сумка открывается клавишей I.":
      "<b>Amulet: empty</b><br>An item from the bag goes here. Open the bag with I.",
    "<b>Бонусы снаряжения</b><br>+0 урон · +0 защита":
      "<b>Equipment bonuses</b><br>+0 damage · +0 defence",
    "Фильтр сумки": "Bag filter",
    "Имя и фамилия": "First and last name",

    /* --- знамения похода --- */
    "Ровный спуск": "Steady descent",
    "Кровавая луна": "Blood moon",
    "Тихий спуск": "Quiet descent",
    "Без изменений. Обычные элиты, золото и урон.":
      "No changes. Standard elites, gold and damage.",
    "Элиты чаще, +50% золота с монстров. Монстры бьют на 10% сильнее.":
      "More elites, +50% gold from monsters. Monsters hit 10% harder.",
    "Элит нет, +1 привал и +25% материалов. Золота с монстров на 15% меньше.":
      "No elites, +1 camp and +25% materials. 15% less gold from monsters.",
    "Без изменений.": "No changes.",
    "Обычные элиты, золото и урон.": "Standard elites, gold and damage.",
    "Элиты чаще, +50% золота с монстров.": "More elites, +50% gold from monsters.",
    "Монстры бьют на 10% сильнее.": "Monsters hit 10% harder.",
    "Элит нет, +1 привал и +25% материалов.": "No elites, +1 camp and +25% materials.",
    "Золота с монстров на 15% меньше.": "15% less gold from monsters.",
    "Знамение действует весь поход и не меняет сложность боя.":
      "The omen lasts the whole expedition and doesn't change battle difficulty.",
    "WASD — идти · E — действие · клик по карте — маршрут":
      "WASD — move · E — act · click the map — route",

    /* --- журнал: каркас --- */
    "Поручение": "Quest",
    "Учитель": "Teacher",
    "Готово": "Ready",
    "Побеждён": "Defeated",
    "Встречен": "Encountered",
    "Путь кампании": "Campaign path",
    "Стражи глубины": "Guardians of the Deep",
    "Сюжет, поручения, архив и хроника": "Story, quests, archive and chronicle",
    "Esc — закрыть": "Esc — close",
    "Цель": "Objective",
    "Цель выполнена — вернись к старосте": "Objective complete — return to the elder",
    "Цель в работе": "Objective in progress",
    "Кампания завершена · печати на месте": "Campaign complete · the seals are in place",
    "Кампания «Печати глубины»": "Campaign “Seals of the Deep”",
    "Новая игра: сюжет начат заново. Обойди деревню и познакомься с жителями.":
      "New game: the story has restarted. Walk around the village and meet the residents.",
    "Печати на месте": "The seals are in place",
    "Кампания": "Campaign",
    "Сейчас": "Now",
    "События": "Events",
    "Всё": "All",
    "Находки": "Loot",
    "Бои": "Battles",
    "Раны": "Wounds",
    "Этажи": "Floors",
    "Фильтр хроники": "Chronicle filter",
    "Поручений нет. Староста выдаёт их в деревне, учитель — домашние задания в школе.":
      "No quests. The elder gives them out in the village, the teacher — homework at the school.",
    "Архив пока пуст.": "The archive is empty for now.",
    "Событий пока нет. Они появятся, как только герой сделает первый шаг.":
      "No events yet. They will appear as soon as the hero takes the first step.",
    "Событий такого рода пока нет. Выбери другой фильтр или продолжай поход.":
      "No events of this kind yet. Pick another filter or keep exploring.",
    "арена": "arena",

    /* --- журнал: сюжет --- */
    "Знакомство": "Introduction",
    "Крыша для амбара": "A Roof for the Barn",
    "Вода для деревни": "Water for the Village",
    "Разжечь горн": "Light the Forge",
    "Дверь мастера": "The Master's Door",
    "Деревня · дома и площадь": "Village · houses and square",
    "Деревня · амбар": "Village · barn",
    "Деревня · колодец": "Village · well",
    "Деревня · кузница": "Village · forge",
    "Деревня · дом мастера": "Village · master's house",
    "Подземелье · последний спуск": "Dungeon · the last descent",
    "Деревня держится на четырёх опорах: амбар, колодец, кузня и дом мастера. Под ними — старый спуск. Когда-то здесь учили первых писцов, а потом заперли то, что не смогли объяснить. Между опорами стоят стражи: гоблин-вожак, некромант, король големов и владыка демонов. За ними — дракон, последний хранитель двери.":
      "The village stands on four pillars: the barn, the well, the forge and the master's house. Beneath them lies the old descent. The first scribes were once taught here, and then they locked away what they could not explain. Between the pillars stand the guardians: the goblin chief, the necromancer, the golem king and the demon lord. Beyond them waits the dragon, the last keeper of the door.",
    "Печати на месте. Деревня переживёт ещё одну зиму. За последней дверью — тишина, и теперь только тебе решать, стоит ли её открывать.":
      "The seals are in place. The village will survive another winter. Behind the last door there is silence, and now only you can decide whether to open it.",
    "Обойти деревню и поговорить с жителями.":
      "Walk around the village and talk to the villagers.",
    "Прежде чем спускаться в подземелье, староста просит обойти деревню. Страж входа, сам староста, торговец, казначей, наставник и учитель должны знать героя в лицо: без этого деревня не доверит ему свои опоры. Кузнец, мастер и кладовщик ждут за запертыми дверями — с ними герой познакомится, когда деревня откроет их постройки.":
      "Before descending into the dungeon, the elder asks you to walk the village. The gate warden, the elder himself, the trader, the treasurer, the mentor and the teacher must know the hero by sight: without that the village will not entrust him with its pillars. The blacksmith, the master and the storekeeper wait behind locked doors — the hero will meet them when the village opens their buildings.",
    "Поговорить с шестью жителями, которые сейчас в деревне.":
      "Talk to the six villagers who are in the village now.",
    "Деревня узнала героя. Теперь у каждого жителя найдётся для него слово, товар или совет. Староста кивает: «Пора браться за амбар».":
      "The village has met the hero. Now every villager has a word, a ware or a piece of advice for him. The elder nods: “Time to take on the barn.”",
    "Вернуть деревне склад и найти первую печать.":
      "Return the storehouse to the village and find the first seal.",
    "Амбар заколочен с прошлой зимы, и деревня держится на честном слове. В подполе спрятана первая печать; ключ от двери висит на поясе стража лестницы, а доски разбросаны по сундукам подземелья.":
      "The barn has been boarded up since last winter, and the village runs on its word alone. The first seal is hidden under the floor; the door key hangs on the belt of the stair warden, and the planks are scattered across the dungeon chests.",
    "Восстановить амбар и вернуться к старосте.":
      "Restore the barn and return to the elder.",
    "Амбар снова стоит. Под старым полом нашлась печать — тёплая, будто её только что держали в руках. Староста долго молчит, прежде чем сказать: «Одной опорой больше».":
      "The barn stands again. Beneath the old floor a seal was found — warm, as if someone had just held it. The elder is silent for a long time before saying: “One more pillar.”",
    "Расчистить колодец и услышать, что говорит глубина.":
      "Clear the well and hear what the deep says.",
    "Колодец засыпан камнем. Беда не в воде: через него деревня слушает глубину и узнаёт, когда просыпаются старые замки. На расчистку нужна руда.":
      "The well is filled with stone. The trouble is not the water: through it the village listens to the deep and learns when old locks wake. Clearing it takes ore.",
    "Восстановить колодец и вернуться к старосте.":
      "Restore the well and return to the elder.",
    "Вода пошла. В её шуме ясно слышен чужой голос: «Не спускайся дальше». Староста делает вид, что не слышит.":
      "Water flows again. In its murmur a strange voice is clearly heard: “Do not go deeper.” The elder pretends not to hear.",
    "Восстановить кузницу и получить оберег глубины.":
      "Restore the forge and receive the depth ward.",
    "Кузница стоит холодной. Пока горн не горит, герой не может укрепить снаряжение, а спуск после шестого этажа закрыт без оберега глубины. Нужны руда и древесина.":
      "The forge stands cold. Until the fire burns, the hero cannot strengthen equipment, and the descent past the sixth floor is sealed without the depth ward. Ore and wood are needed.",
    "Восстановить кузницу и вернуться к старосте.":
      "Restore the forge and return to the elder.",
    "Горн зажжён. Староста вручает оберег глубины: «Это не ключ. Это обещание вернуться».":
      "The forge is lit. The elder hands over the depth ward: “This is not a key. It is a promise to come back.”",
    "Открыть дом мастера и снять вторую печать.":
      "Open the master's house and take down the second seal.",
    "Дом мастера заперт. Внутри — верстак, старые чертежи и вторая печать. Ключ держит страж в ледяных залах; на ремонт нужны обломки.":
      "The master's house is locked. Inside are a workbench, old drawings and the second seal. The key is held by the warden in the ice halls; repairs take shards.",
    "Открыть дом мастера и вернуться к старосте.":
      "Open the master's house and return to the elder.",
    "Дверь открыта. Мастер долго смотрит на печать, потом говорит: «Значит, дракон ещё спит». Он отдаёт печать мастера — пропуск к последнему спуску.":
      "The door is open. The master looks at the seal for a long time, then says: “So the dragon still sleeps.” He gives up the master's seal — a pass to the last descent.",
    "Спуститься к дракону и закрыть старый круг.":
      "Descend to the dragon and close the old circle.",
    "Опоры стоят, печати собраны. Внизу остался дракон — последний страж старого спуска. Он ждёт не меча, а ответа: достоин ли герой закрыть за собой дверь.":
      "The pillars stand, the seals are gathered. Below only the dragon remains — the last guardian of the old descent. He waits not for a sword but for an answer: is the hero worthy to close the door behind him?",
    "Победить дракона и вернуться в деревню.":
      "Defeat the dragon and return to the village.",
    "Дракон падает. За его спиной нет сокровищ — только дверь, которую больше некому охранять. Ты возвращаешься в деревню с правом закрыть её или открыть.":
      "The dragon falls. Behind him there are no treasures — only a door no one is left to guard. You return to the village with the right to close it or open it.",

    /* --- бой и инвентарь --- */
    "Ход героя": "Hero's turn",
    "Побег": "Flee",
    "Выбери один правильный вариант.": "Choose one correct option.",
    "Выпить": "Drink",
    "Убрать": "Remove",
    "Первый спуск": "First descent",
    "Кошелёк: пусто. Подземелье ещё не пройдено.":
      "Purse: empty. The dungeon has not been cleared yet.",
    "Управление: WASD или стрелки — идти · E — действие · Пробел — пропустить ход.":
      "Controls: WASD or arrows — move · E — act · Space — skip a turn.",
    "Слизь": "Slime",
    "Крыса": "Rat",
    "Летучая мышь": "Bat",
    "Скелет": "Skeleton",
    "Гоблин": "Goblin",
    "Паук": "Spider",
    "Орк": "Orc",
    "Тролль": "Troll",
    "Призрак": "Ghost",
    "Волк": "Wolf",
    "Зомби": "Zombie",
    "Голем": "Golem",
    "Демон": "Demon",
    "Минотавр": "Minotaur",
    "Вампир": "Vampire",
    "Лич": "Lich",
    "Щитоносец": "Shieldman",
    "Жрица": "Priestess",
    "Паук кусает ядовито": "The spider bites with venom",
    "Тролль затягивает раны прямо в бою": "The troll closes its wounds mid-battle",
    "Призрак иногда проходит сквозь стены": "The ghost sometimes phases through walls",
    "Каменная броня гасит часть урона": "Stone armor absorbs part of the damage",
    "Демон поджигает: урон растёт с каждым боем":
      "The demon sets you alight: damage grows with each battle",
    "Минотавр бьёт сильнее, когда ты ответил верно":
      "The minotaur hits harder when you answer correctly",
    "Вампир пьёт твоё здоровье": "The vampire drinks your health",
    "Лич накладывает проклятие на твои ответы":
      "The lich curses your answers",
    "Щит гасит часть урона и не даёт отступить":
      "The shield absorbs part of the damage and prevents retreat",
    "Жрица лечит раненых врагов этажа": "The priestess heals wounded enemies on the floor",
    "Некромант поднимает мелких врагов на твоих ошибках":
      "The necromancer raises small enemies on your mistakes",
    "Дракон впадает в ярость и усиливает удары":
      "The dragon flies into a rage and strengthens its blows",

    /* --- деревня: общее и жители --- */
    "Банк деревни:": "Village bank:",
    "золота": "gold",
    "зол.": "gold",
    "Деревня помнит твои походы": "The village remembers your expeditions",
    "Банк, рекорд и амулеты — у казначея, в доме на другой стороне площади.":
      "The bank, the record and amulets are at the treasurer's, in the house across the square.",
    "Амулеты возврата, зелья и снаряжение в дорогу.":
      "Return amulets, potions and gear for the road.",
    "Войди в аккаунт на главной — тогда будет чем платить.":
      "Sign in on the main page — then you'll have something to pay with.",
    "Кампания · Печати глубины": "Campaign · Seals of the Deep",
    "готова": "ready",
    "в работе": "in progress",
    "Где:": "Where:",
    "цель ещё не выполнена": "objective not complete yet",
    "Завершить главу": "Complete the chapter",
    "Забрать награду": "Claim the reward",
    "Отказаться от задания": "Abandon the quest",
    "Без задания тоже можно: в подземелье пускают всегда. С заданием деревня платит.":
      "You can go without a quest too: the dungeon always lets you in. With a quest the village pays.",
    "Взять задание": "Take the quest",
    "выполнено раз:": "completed:",
    "ничего": "nothing",
    "«Печати на месте, герой. Осталась только дорога вниз».":
      "“The seals are in place, hero. Only the road down remains.”",
    "Страж на пути": "Warden in the Way",
    "Срази стража лестницы — того, что охраняет спуск.":
      "Defeat the stair warden — the one guarding the descent.",
    "Руда для деревни": "Ore for the Village",
    "Подними три руды за один поход.":
      "Bring up three ore in one expedition.",
    "Без единой ошибки": "Without a Single Mistake",
    "Пройди два этажа подряд, не ошибившись ни разу.":
      "Clear two floors in a row without a single wrong answer.",
    "стражей побеждено": "wardens defeated",
    "руды найдено": "ore found",
    "этажей пройдено чисто": "floors cleared clean",
    "ключ от амбара": "barn key",
    "ключ от дома мастера": "master's house key",
    "оберег глубины": "depth ward",
    "печать мастера": "master's seal",

    /* --- банк и постройки --- */
    "Золото и материалы:": "Gold and materials:",
    "Амулеты возврата:": "Return amulets:",
    "Рекорд:": "Record:",
    "Следующий шаг:": "Next step:",
    "подземелье ещё не пройдено": "the dungeon has not been cleared yet",
    "План деревни": "Village plan",
    "Постройки остаются навсегда. Строка «материалы уже собраны» значит, что уровень можно оплатить прямо здесь.":
      "Buildings stay forever. The line “materials already gathered” means the level can be paid for right here.",
    "Даёт:": "Gives:",
    "Нужно:": "Needs:",
    "Сейчас:": "Now:",
    "Следующий уровень:": "Next level:",
    "построено до конца": "fully built",
    "Улучшить:": "Upgrade:",
    "Восстановить:": "Restore:",
    "Постройка деревни": "Village building",
    "Дверь": "Door",
    "Дверь заперта — хозяев нет дома.": "The door is locked — nobody is home.",
    "+50% находок материалов": "+50% material finds",
    "+10 здоровья в каждом походе": "+10 health on every expedition",
    "улучшения героя до 3 уровня": "hero upgrades up to level 3",
    "потолок улучшений героя — 5": "hero upgrade cap — 5",
    "Сюжет пройден.": "The story is complete.",
    "Дракон побеждён, деревня поднята до конца — можно спускаться в бездну.":
      "The dragon is defeated, the village is fully raised — you can descend into the abyss.",

    /* --- наставник --- */
    "Наставник": "Mentor",
    "Как играть": "How to play",
    "Ходы": "Turns",
    "Бой": "Battle",
    "Смерть": "Death",
    "Мини-карта": "Minimap",
    "— стрелки или WASD. Можно кликнуть по клетке: герой пойдёт сам.":
      "— arrows or WASD. You can click a tile: the hero will walk there himself.",
    "— клавиша E или кнопка внизу: двери, сундуки, торговец, лестницы.":
      "— the E key or the button below: doors, chests, the trader, stairs.",
    "— это урок: сначала вопрос по теме, потом задача на ту же тему. Верный ответ бьёт врага, ошибка — тебя.":
      "— it is a lesson: first a question on the topic, then a task on the same topic. A correct answer hits the enemy, a mistake hits you.",
    "— поход кончается, но материалы и ключи доходят до деревни целиком. Золото — на 50%, а если вместо него взять разбор ошибок — на 25% и три первых боя по слабым темам.":
      "— the expedition ends, but materials and keys reach the village intact. Gold — at 50%, and if you take a mistake review instead — at 25% and three first battles on weak topics.",
    "— колодец, амбар, кузницу и дом мастера восстанавливают за материалы из подземелья. Кузница даёт улучшения героя, и без неё глубоко не спуститься.":
      "— the well, barn, forge and master's house are restored with materials from the dungeon. The forge gives hero upgrades, and without it you won't get deep.",
    "— второй шанс: поднимет на месте и сохранит поход. Унести можно не больше 3.":
      "— a second chance: revives you on the spot and keeps the expedition. You can carry no more than 3.",
    "— клавиша M, зум — колесо мыши.":
      "— the M key, zoom — the mouse wheel.",

    /* --- торговец и склад --- */
    "Амулет возврата": "Return amulet",
    "максимум": "maximum",
    "Купить": "Buy",
    "на этот поход взято": "taken for this expedition",
    "Взять": "Take",
    "На складе:": "In storage:",
    "Снаряжение в дорогу": "Gear for the road",
    "Снаряжение из склада": "Gear from the storage",
    "Материалы можно обменять на припасы. Обмен ограничен на один поход: новый поход — новая партия.":
      "Materials can be traded for supplies. The exchange is limited per expedition: a new expedition brings a new batch.",
    "Малое зелье": "Small potion",
    "Большое зелье": "Large potion",
    "Случайная крепкая вещь в дорогу.": "A random sturdy item for the road.",
    "Сначала восстанови амбар": "Restore the barn first",
    "На этот поход запас уже взят": "This supply has already been taken for the expedition",
    "Склад пуст: всё снаряжение уже в дороге":
      "The storage is empty: all the gear is already on the road",
    "Со склада:": "From the storage:",

    /* --- кузница и мастер --- */
    "Кузнец": "Blacksmith",
    "Горн ещё не разожжён — улучшать нечего. Восстанови кузницу, и я примусь за работу.":
      "The forge is not lit yet — there is nothing to upgrade. Restore the forge and I'll get to work.",
    "Улучшения остаются навсегда и действуют в каждом походе. Кузница открывает ":
      "Upgrades stay forever and work in every expedition. The forge opens ",
    ", дом мастера поднимет потолок до пятого и удешевит работу.":
      ", the master's house will raise the cap to five and make the work cheaper.",
    " Дом мастера II уступает ": " Master's house II gives ",
    "% цены.": "% off the price.",
    "уровня": "levels",
    "Улучшения героя:": "Hero upgrades:",
    "Мастер": "Master",
    "Мастерская": "Workshop",
    "«Ключ нашёлся — и верстак снова в деле. Твои улучшения я подниму до пятого уровня, а за работу уступлю в цене».":
      "“The key turned up — and the workbench is back in business. I'll raise your upgrades to the fifth level and knock down the price for the work.”",
    "Здоровье": "Health",
    "Сила": "Strength",
    "Зелья": "Potions",
    "Добыча": "Loot",
    "Броня": "Armor",
    "здоровья": "health",
    "урона": "damage",
    "зелье на старте": "potion at the start",
    "% золота": "% gold",
    "% гасимого урона": "% damage absorbed",
    "выше не поднять": "cannot go higher",
    "хватает золота": "enough gold",
    "Улучшить": "Upgrade",

    /* --- достижения --- */
    "Первый шаг": "First Step",
    "Опытный следопыт": "Seasoned Pathfinder",
    "Кодер": "Coder",
    "Постоянство": "Persistence",
    "На волне": "On a Roll",
    "Глубинный странник": "Deep Wanderer",
    "Выживший": "Survivor",
    "Убийца драконов": "Dragon Slayer",
    "Завершить первый поход": "Complete the first expedition",
    "100% верных ответов в походе": "100% correct answers in an expedition",
    "Дойти до 7 этажа": "Reach floor 7",
    "Решить 10 задач на код": "Solve 10 code tasks",
    "Играть 3 дня подряд": "Play 3 days in a row",
    "10 верных ответов подряд": "10 correct answers in a row",
    "Дойти до 9 этажа": "Reach floor 9",
    "Дойти до 5 этажа": "Reach floor 5",
    "Победить дракона": "Defeat the dragon",
    "Казначей": "Treasurer",
    "Банк деревни": "Village bank",
    "Припасы деревни": "Village supplies",
    "Кладовщик": "Storekeeper",
    "«Здравствуй, герой!»": "“Hello, hero!”",

    /* --- школа: каркас и модули --- */
    "Курс Python · банк:": "Python course · bank:",
    "Курс Python: 9 модулей, по три урока. Первый урок в модуле — теория, второй — практика, третий — экзамен. После экзамена учитель даёт домашнее задание.":
      "Python course: 9 modules, three lessons each. The first lesson is theory, the second is practice, the third is the exam. After the exam the teacher gives homework.",
    "Бонус к следующему походу:": "Bonus for the next expedition:",
    "и": "and",
    "Доска задач: практика": "Task board: practice",
    "Доска задач": "Task board",
    "← К учителю": "← Back to the teacher",
    "← К доске": "← Back to the board",
    "Вставь пропущенное": "Fill in the blank",
    "Найди ошибку": "Find the error",
    "Повтори код": "Retype the code",
    "Напиши функцию": "Write a function",
    "10 золота": "10 gold",
    "Практика по темам курса. Каждое задание можно выполнять отдельно от урока; за первое прохождение — 10 золота.":
      "Practice by course topic. Each task can be done separately from a lesson; the first completion is worth 10 gold.",
    "Пока нет практических заданий.": "No practice tasks yet.",
    "Оплачен": "Paid",
    "Сначала предыдущий урок": "The previous lesson comes first",
    "Начать практику": "Start practice",
    "Модуль пройден. Следующий откроется сразу.":
      "Module complete. The next one opens right away.",
    "Сейчас домашнего задания нет.": "There is no homework right now.",
    "Задание учителя": "The teacher's assignment",
    "Забрать награду и открыть следующий модуль":
      "Claim the reward and unlock the next module",
    "Выполняй задание в подземелье — прогресс придёт сам.":
      "Do the assignment in the dungeon — progress comes by itself.",
    "← К модулям": "← Back to the modules",
    "← К урокам": "← Back to the lessons",
    "К уроку": "To the lesson",
    "К модулю": "To the module",
    "Повторить": "Repeat",
    "Почти: проверь отступы и лишние пробелы.":
      "Almost: check the indentation and extra spaces.",
    "Пока не совпадает. Сравни с образцом и попробуй снова.":
      "Not matching yet. Compare with the sample and try again.",
    "Проверяю код...": "Checking the code…",
    "Проверка кода недоступна. Попробуй ещё раз.":
      "Code checking is unavailable. Try again.",
    "Проверка кода не отвечает. Попробуй ещё раз.":
      "Code checking is not responding. Try again.",
    "Это задание больше не проверяется — выдано другое. Ход не потерян.":
      "This task is no longer checked — you've been given another one. Your turn isn't lost.",
    "Проверка кода на сервере выключена — вместо задачи на код другое задание. Ход не потерян.":
      "Code checking is disabled on the server — here's a different task instead. Your turn isn't lost.",
    "У этой задачи нет проверок — напиши решение и нажми «Проверить».":
      "This task has no checks — write a solution and press “Check”.",
    "Не удалось проверить код": "Couldn't check the code",
    "Отлично!": "Excellent!",
    "Попробуй ещё.": "Try again.",
    "Задание не найдено": "Task not found",
    "Сначала пройди предыдущий модуль": "Complete the previous module first",
    "Зачёт.": "Passed.",
    "Здесь появится скриншот, описание и кнопки сохранения.":
      "The screenshot, description and save buttons will appear here.",
    "← К теории": "← Back to the theory",
    "Экзамен": "Exam",
    "Урок": "Lesson",
    "Практика": "Practice",
    "Ещё раз": "Try again",
    "Проверяю...": "Checking…",
    "Перепиши код в точности, соблюдая отступы:":
      "Retype the code exactly, keeping the indentation:",
    "Напиши функцию целиком. Проверка запускает Python и прогоняет тесты.":
      "Write the whole function. Checking runs Python and passes the tests.",
    "Закрыт": "Locked",
    "Профиль не найден.": "Profile not found.",
    "Esc — закрыть · домашнее задание выполняется в подземелье":
      "Esc — close · homework is done in the dungeon",
    "Домашнее задание": "Homework",
    "Домашнее задание:": "Homework:",
    "Синтаксис и основы": "Syntax and Basics",
    "Первые команды, переменные и отступы.":
      "First commands, variables and indentation.",
    "Первая программа": "The First Program",
    "Переменные": "Variables",
    "Ввод, числа и отступы": "Input, Numbers and Indentation",
    "Типы данных": "Data Types",
    "Числа, строки, логика и None.": "Numbers, strings, logic and None.",
    "Числа": "Numbers",
    "Строки": "Strings",
    "bool и None": "bool and None",
    "Операторы и выражения": "Operators and Expressions",
    "Арифметика, сравнения и логика.": "Arithmetic, comparisons and logic.",
    "Арифметика": "Arithmetic",
    "Сравнения": "Comparisons",
    "Логические операторы": "Logical Operators",
    "Текст, срезы и форматирование.": "Text, slices and formatting.",
    "Индексы и срезы": "Indices and Slices",
    "Методы строк": "String Methods",
    "f-строки": "f-strings",
    "Условия и циклы": "Conditions and Loops",
    "Ветвления, for и while.": "Branches, for and while.",
    "if, elif, else": "if, elif, else",
    "Цикл for": "The for Loop",
    "Цикл while": "The while Loop",
    "Списки, словари, множества": "Lists, Dicts, Sets",
    "Хранить не одно значение, а много.": "Store many values instead of one.",
    "Списки": "Lists",
    "Словари": "Dictionaries",
    "Множества и кортежи": "Sets and Tuples",
    "Функции": "Functions",
    "Разбивать программу на понятные шаги.":
      "Split a program into understandable steps.",
    "def и return": "def and return",
    "Аргументы": "Arguments",
    "Область видимости": "Scope",
    "Исключения": "Exceptions",
    "Читать ошибки и обрабатывать их.": "Read errors and handle them.",
    "Какие бывают ошибки": "Kinds of Errors",
    "try и except": "try and except",
    "Свои ошибки": "Custom Errors",
    "Модули и импорт": "Modules and Imports",
    "Пользоваться готовым кодом и своим.": "Use ready-made code and your own.",
    "import": "import",
    "Стандартная библиотека": "Standard Library",
    "Свои модули": "Your Own Modules",

    /* --- справочник --- */
    "Справочник": "Codex",
    "Управление, предметы, НПС и мобы": "Controls, items, NPCs and mobs",
    "НПС": "NPCs",
    "Мобы": "Mobs",
    "Боссы": "Bosses",
    "Предметы": "Items",
    "Знания героя": "Hero's knowledge",
    "WASD / стрелки": "WASD / arrows",
    "ходить по карте": "walk around the map",
    "действие: сундук, дверь, торговец, лестница":
      "act: chest, door, trader, stairs",
    "пропустить ход — монстры ходят без тебя":
      "skip a turn — monsters move without you",
    "открыть инвентарь": "open the inventory",
    "показать или скрыть мини-карту": "show or hide the minimap",
    "Колесо мыши": "Mouse wheel",
    "приблизить или отдалить карту": "zoom the map in or out",
    "пауза или закрыть открытое окно": "pause or close the open window",
    "улучшения героя у кузнеца в деревне":
      "hero upgrades at the village blacksmith",
    "Спуск в подземелье": "The dungeon descent",
    "Лавка и товары": "Shop and goods",
    "Сюжетные задания": "Story quests",
    "Банк, рекорд и амулеты": "Bank, record and amulets",
    "Обучение": "Training",
    "Курс Python": "Python course",
    "Кузница и улучшения героя": "The forge and hero upgrades",
    "Потолок улучшений и скидка": "Upgrade cap and discount",
    "Амбар и припасы": "Barn and supplies",
    "Деревня": "Village",
    "Житель деревни.": "A village resident.",
    "Изученных предметов пока нет: подбери что-нибудь в подземелье.":
      "No items studied yet: pick something up in the dungeon.",
    "Ты ещё не встретил ни одного жителя деревни.":
      "You have not met a single villager yet.",
    "Ты ещё не встретил ни одного противника.":
      "You have not met a single enemy yet.",
    "Ты ещё не встретил ни одного босса.":
      "You have not met a single boss yet.",
    "Обычный противник подземелья.": "An ordinary dungeon enemy.",
    "трофей получен": "trophy earned",
    "ещё не побеждён": "not defeated yet",
    "босс": "boss",
    "урон": "damage",
    "Закрыть справочник. Клавиша Escape.": "Close the codex. Escape key.",

    /* --- бой: панель и результат --- */
    "Точный ответ": "Precise answer",
    "Ошибка": "Mistake",
    "Ты пал": "You have fallen",
    "Следующий вопрос": "Next question",
    "Промах": "Miss",
    "Пояснение:": "Explanation:",
    "Пояснение": "Explanation",
    "Скрыть пояснение": "Hide explanation",
    "пройден": "passed",
    "провален": "failed",
    "Продолжить": "Continue",
    "Идти за боссом": "Follow the boss",
    "Проверить и атаковать": "Check and attack",
    "Выбери, что вставить вместо ___": "Choose what to insert instead of ___",
    "Выбери, что не так в коде.": "Choose what is wrong in the code.",
    "Проклятая плита: варианты идут по алфавиту — читай внимательнее.":
      "Cursed tile: the options are in alphabetical order — read carefully.",
    "Копирование запрещено — перепиши код вручную.":
      "Copying is disabled — rewrite the code by hand.",
    "Напиши код здесь...": "Type the code here...",
    "Примеры": "Examples",
    "Отправить написанный код на проверку. Ответ решает силу удара.":
      "Send the code for checking. The answer decides the blow's power.",
    "Проклятие лича: подсказка не работает, и тратить на неё здоровье не нужно.":
      "Lich's curse: hints don't work, and you don't need to spend health on one.",
    "Свиток подсказки: покажет первую проверку без потери здоровья.":
      "Hint scroll: shows the first check without losing health.",
    "Свиток подсказки: убирает два неверных варианта без потери здоровья.":
      "Hint scroll: removes two wrong options without losing health.",
    "Нужен свиток подсказки — его покупают у торговца или находят в подземелье.":
      "A hint scroll is required — buy one from the trader or find one in the dungeon.",
    "Проклятая плита: следующий вопрос будет труднее":
      "Cursed tile: the next question will be harder",
    "Верно!": "Correct!",
    "Неверно!": "Wrong!",
    "Победа!": "Victory!",
    "Поражение!": "Defeat!"
  };

  /* ------------------------------------------------------------------ */
  /* Правила для строк с числами и вставками                            */
  /* ------------------------------------------------------------------ */

  var RULES = [
    [/^(.*?)\s+шанс\s+(\d+)%$/, function (m, text, pct) {
      return translateString(text) + " · chance " + pct + "%";
    }],
    [/^Этаж\s+(\d+)$/, function (m, n) { return "Floor " + n; }],
    [/^Ур\.\s*(\d+)$/, function (m, n) { return "Lv. " + n; }],
    [/^Уровень\s+(\d+)$/, function (m, n) { return "Level " + n; }],
    [/^Глава\s+(\d+)$/, function (m, n) { return "Chapter " + n; }],
    [/^Ячейка\s+(\d+)$/, function (m, n) { return "Slot " + n; }],
    [/^Сохранение\s+(\d+)$/, function (m, n) { return "Save " + n; }],
    [/^Сохранений:\s*(\d+)$/, function (m, n) { return "Saves: " + n; }],
    [/^Импортировано сохранений:\s*(\d+)$/, function (m, n) {
      return "Saves imported: " + n;
    }],
    [/^Монстров:\s*(.+)$/, function (m, rest) {
      return "Monsters: " + translateString(rest);
    }],
    [/^Герой:\s*(.+)$/, function (m, name) {
      // Имя героя — не текст интерфейса, но имя по умолчанию переводим.
      return "Hero: " + (name === "Герой" ? "Hero" : name);
    }],
    [/^<b>(.+): пусто<\/b><br>Вещь из сумки встанет сюда\. Сумка открывается клавишей I\.$/, function (m, slot) {
      return "<b>" + slot + ": empty</b><br>An item from the bag goes here. Open the bag with I.";
    }],
    [/^(Вставь пропущенное|Найди ошибку|Повтори код|Напиши функцию): (.+)$/, function (m, kind, rest) {
      var names = {
        "Вставь пропущенное": "Fill in the blank",
        "Найди ошибку": "Find the error",
        "Повтори код": "Retype the code",
        "Напиши функцию": "Write a function"
      };
      return names[kind] + ": " + translateString(rest);
    }],
    [/^Верно\. (.+)$/, function (m, rest) {
      return "Correct. " + translateString(rest);
    }],
    [/^Неверно\. Правильный вариант подсвечен\. ?(.+)$/, function (m, rest) {
      return "Incorrect. The right answer is highlighted. " + translateString(rest);
    }],
    [/^Неверно\. Правильный ответ: «(.+)»\.$/, function (m, answer) {
      return "Wrong. The correct answer: “" + translateString(answer) + "”.";
    }],
    [/^Неверно\. Правильный ответ: см\. разбор\.$/, function () {
      return "Wrong. See the explanation.";
    }],
    [/^Правильный ответ: ([A-D])\.$/, function (m, letter) {
      return "Correct answer: " + letter + ".";
    }],
    [/^Правильный ответ: см\. разбор\.$/, function () {
      return "Correct answer: see the explanation.";
    }],
    [/^Ты не написал код\.$/, function () {
      return "You haven't written any code.";
    }],
    [/^(Проверка вернула неполный результат\.|Проверка кода не отвечает\.|Python в браузере не запустился\.|Сервер проверки кода недоступен\.) Ход не засчитан — нажми «Проверить» ещё раз\.$/, function (m, reason) {
      var en = {
        "Проверка вернула неполный результат.": "The checker returned an incomplete result.",
        "Проверка кода не отвечает.": "The code checker isn't responding.",
        "Python в браузере не запустился.": "Python failed to start in the browser.",
        "Сервер проверки кода недоступен.": "The code checking server is unavailable."
      }[reason] || "The code check failed.";
      return en + " The turn doesn't count — press “Check” again.";
    }],
    [/^Первый запуск Python в браузере может занять до 30 секунд$/, function () {
      return "The first Python run in the browser can take up to 30 seconds";
    }],
    [/^Код совпал\. ?(.+)$/, function (m, rest) {
      return "The code matches. " + translateString(rest);
    }],
    [/^Пройдено (\d+) из (\d+) проверок\. ?(.*)$/, function (m, passed, total, rest) {
      return "Passed " + passed + " of " + total + " checks. " + translateString(rest);
    }],
    [/^Ошибка: (.+)$/, function (m, rest) {
      return "Error: " + translateString(rest);
    }],
    [/^Модуль: (.+) · прогресс: (\d+)\/(\d+)$/, function (m, title, done, need) {
      return "Module: " + translateString(title) + " · progress: " + done + "/" + need;
    }],
    [/^Урок пройден: «(.+)»\. \+(\d+) золота\.$/, function (m, title, gold) {
      return "Lesson complete: “" + translateString(title) + "”. +" + gold + " gold.";
    }],
    [/^Практика пройдена: \+(\d+) золота$/, function (m, gold) {
      return "Practice complete: +" + gold + " gold";
    }],
    [/^Практика: «(.+)» пройдена\. \+(\d+) золота\.$/, function (m, title, gold) {
      return "Practice: “" + translateString(title) + "” complete. +" + gold + " gold.";
    }],
    [/^Экзамен · (\d+) золота$/, function (m, gold) {
      return "Exam · " + gold + " gold";
    }],
    [/^Оплатить и начать · (\d+) золота$/, function (m, gold) {
      return "Pay and start · " + gold + " gold";
    }],
    [/^Пройден · (\d+) верных$/, function (m, n) {
      return "Completed · " + n + " correct";
    }],
    [/^Верно: (\d+) из (\d+)\. (.+)$/, function (m, score, total, rest) {
      return "Correct: " + score + " of " + total + ". " + translateString(rest);
    }],
    [/^Нужно хотя бы (\d+)\. Попробуй ещё\.$/, function (m, need) {
      return "You need at least " + need + ". Try again.";
    }],
    [/^(\d+) вещей · зелий (\d+)$/, function (m, items, potions) {
      function word(n, one, many) { return n === "1" ? one : many; }
      return items + " " + word(items, "item", "items") +
        " · " + potions + " " + word(potions, "potion", "potions");
    }],
    [/^Наценка лавки \+(\d+)% — у торговца на этаже дешевле, найди его!$/, function (m, mark) {
      return "Shop markup +" + mark + "% — the trader on the floor is cheaper, find him!";
    }],
    [/^Снаряжение этажа (\d+)$/, function (m, floor) {
      return "Floor " + floor + " gear";
    }],
    [/^🎁 Ящик этажа (\d+)$/, function (m, floor) {
      return "🎁 Floor " + floor + " crate";
    }],
    [/^Одна случайная вещь: оружие, броня или амулет · цена$/, function () {
      return "One random item: weapon, armor or amulet · price";
    }],
    [/^Продать \(выкуп (\d+)%\)$/, function (m, percent) {
      return "Sell (buyback " + percent + "%)";
    }],
    [/^Продать \+(\d+)$/, function (m, gold) {
      return "Sell +" + gold;
    }],
    [/^Не хватает (\d+) золота\. Продай лишнее или поищи золото на этаже\.$/, function (m, gold) {
      return "Not enough gold: " + gold + ". Sell something spare or look for gold on the floor.";
    }],
    [/^Получить (\d+) золота за «(.+)»\.$/, function (m, gold, name) {
      return "Get " + gold + " gold for “" + translateString(name) + "”.";
    }],
    [/^Закрыть лавку\. Клавиша Escape\.$/, function () {
      return "Close the shop. Escape key.";
    }],
    [/^\+(\d+) урон$/, function (m, n) { return "+" + n + " damage"; }],
    [/^▲ \+(\d+) урон$/, function (m, n) { return "▲ +" + n + " damage"; }],
    [/^▲ \+(\d+) здоровье$/, function (m, n) { return "▲ +" + n + " health"; }],
    [/^▲ \+(\d+) защита$/, function (m, n) { return "▲ +" + n + " defence"; }],
    [/^(атака|HP|защита|оборона|лечение) \+.+,\s*(?:атака|HP|защита|оборона|лечение) \+.+$/, function (m) {
      return m.split(", ").map(function (part) {
        return part
          .replace(/^атака /, "attack ")
          .replace(/^защита /, "defence ")
          .replace(/^оборона /, "guard ")
          .replace(/^лечение /, "healing ");
      }).join(", ");
    }],
    [/^атака \+(\d+)$/, function (m, n) { return "attack +" + n; }],
    [/^защита \+(\d+)$/, function (m, n) { return "defence +" + n; }],
    [/^оборона \+(\d+)%$/, function (m, n) { return "guard +" + n + "%"; }],
    [/^лечение \+(.+)$/, function (m, n) { return "healing +" + n; }],
    [/^(Common|Uncommon|Rare|Epic|Legendary) · (.+) · цена$/, function (m, rarity, rest) {
      return rarity + " · " + translateString(rest) + " · price";
    }],
    [/^(\d+) из (\d+)$/, function (m, a, b) { return a + " of " + b; }],
    [/^В деревню \((\d+) зол\.\)$/, function (m, gold) {
      return "To the village (" + gold + " gold)";
    }],
    [/^Забрать золото \((\d+)\)$/, function (m, gold) {
      return "Take the gold (" + gold + ")";
    }],
    [/^Забрать знания \((\d+) золота \+ разбор\)$/, function (m, gold) {
      return "Take the knowledge (" + gold + " gold + review)";
    }],
    [/^У тебя (\d+) (амулет|амулета|амулетов) возврата\. Использовать — герой встанет на этом же этаже, поход продолжится\.$/, function (m, n, word) {
      var one = n === "1";
      return "You have " + n + " return amulet" + (one ? "" : "s") +
        ". Use it and the hero will get up on this same floor; the expedition continues.";
    }],
    [/^В деревню перенесено (\d+) золота \((\d+)% походной казны\)\.$/, function (m, gold, percent) {
      return gold + " gold was carried to the village (" + percent + "% of the run's treasury).";
    }],
    [/^— (\d+)% походной казны\.$/, function (m, percent) {
      return "— " + percent + "% of the run's treasury.";
    }],
    [/^— (\d+)% и три первых боя следующего похода по слабым темам: (.+)\.$/, function (m, percent, topics) {
      return "— " + percent + "% and the first three battles of the next run on your weak topics: " +
        translateString(topics) + ".";
    }],
    [/^Слабое место — «(.+)»\. Вернись к нему в разделе «Повторение» перед новым походом\.$/, function (m, topic) {
      return "Weak spot: “" + translateString(topic) +
        "”. Return to it in the “Review” section before a new expedition.";
    }],
    [/^Достижение: (.+)$/, function (m, names) {
      return "Achievement: " + translateString(names);
    }],
    [/^Этаж (\d+) начинается заново\. Здоровье восстановлено, опыт этого этажа потерян\.$/, function (m, n) {
      return "Floor " + n + " starts over. Health is restored; this floor's experience is lost.";
    }],
    [/^Дракон мёртв, но подземелье не кончилось\. Бездна ждёт\.$/, function () {
      return "The dragon is dead, but the dungeon is not over. The abyss waits.";
    }],
    [/^Бесконечный спуск: этажей больше нет, есть только глубина\.$/, function () {
      return "Endless descent: there are no more floors, only depth.";
    }],
    [/^Ячейка (\d+) пуста$/, function (m, n) {
      return "Slot " + n + " is empty";
    }],
    [/^Ячейка (\d+) · (Поход|Деревня)$/, function (m, n, kind) {
      return "Slot " + n + " · " + (kind === "Поход" ? "Expedition" : "Village");
    }],
    [/^Этаж (\d+) · (\d+) зол\.$/, function (m, floor, gold) {
      return "Floor " + floor + " · " + gold + " gold";
    }],
    [/^Деревня · (\d+) зол\.$/, function (m, gold) {
      return "Village · " + gold + " gold";
    }],
    [/^Сохранено: (.+)\.$/, function (m, name) {
      return "Saved: " + translateString(name) + ".";
    }],
    [/^«(.+)» будет удалено\. Это действие нельзя отменить\.$/, function (m, name) {
      return "“" + translateString(name) + "” will be deleted. This can't be undone.";
    }],
    [/^Импортировано сохранений: (\d+)\.$/, function (m, count) {
      return "Imported saves: " + count + ".";
    }],
    [/^Резервная копия: (.+)\. Если файл не появился, нажми «Показать JSON»\.$/, function (m, file) {
      return "Backup: " + file + ". If the file didn't appear, press “Show JSON”.";
    }],
    [/^(Экзамен|Урок|Практика): (.+)$/, function (m, kind, rest) {
      var names = { "Экзамен": "Exam", "Урок": "Lesson", "Практика": "Practice" };
      return names[kind] + ": " + translateString(rest);
    }],
    [/^(\d+) золота$/, function (m, gold) {
      return gold + " gold";
    }],
    [/^Этаж (\d+) · (.+)$/, function (m, n, name) {
      return "Floor " + n + " · " + translateString(name);
    }],
    [/^Этаж (\d+): (.+)$/, function (m, n, name) {
      return "Floor " + n + ": " + translateString(name);
    }],
    [/^Этаж (\d+)$/, function (m, n) {
      return "Floor " + n;
    }],
    [/^Бездна · глубина (\d+)$/, function (m, depth) {
      return "Abyss · depth " + depth;
    }],
    [/^Страж лестницы (.+)$/, function (m, name) {
      return "Stair guardian " + translateString(name);
    }],
    [/^Глава\s+([IVXLC]+)\s*·\s*(.+)$/, function (m, num, rest) {
      return "Chapter " + num + " · " + translateString(rest);
    }],
    [/^\+(\d+)\s+урон\s*·\s*\+(\d+)\s+защита$/, function (m, a, b) {
      return "+" + a + " damage · +" + b + " defence";
    }],
    [/^Всё\s+(\d+)$/, function (m, n) { return "All " + n; }],
    [/^Снаряжение\s+(\d+)$/, function (m, n) { return "Equipment " + n; }],
    [/^Зелья\s+(\d+)$/, function (m, n) { return "Potions " + n; }],
    [/^(\d+)\s*зол\.$/, function (m, n) { return n + " gold"; }],
    [/^(\d+)\s*\/\s*(\d+)\s*очков$/, function (m, a, b) {
      return a + " / " + b + " points";
    }],
    [/^(\d+)\s*из\s*(\d+)$/, function (m, a, b) { return a + " of " + b; }],
    [/^Этаж\s+(\d+)\s*·\s*(.+)$/, function (m, n, rest) {
      return "Floor " + n + " · " + translateString(rest);
    }],
    [/^Деревня\s*·\s*(.+)$/, function (m, rest) {
      return "Village · " + translateString(rest);
    }],
    [/^Сохранено:\s*(.+)$/, function (m, rest) {
      return "Saved: " + translateString(rest);
    }],
    [/^Награда:\s*(.+)$/, function (m, rest) {
      return "Reward: " + translateString(rest);
    }],
    [/^Задание:\s*(.+)$/, function (m, rest) {
      return "Task: " + translateString(rest);
    }],
    [/^Босс:\s*(.+)$/, function (m, rest) {
      return "Boss: " + translateString(rest);
    }],
    [/^Найдено:\s*(.+)$/, function (m, rest) {
      return "Found: " + translateString(rest);
    }],
    [/^Фаза\s+(\d+)$/, function (m, n) { return "Phase " + n; }],
    [/^(\d+)\s*этаж$/, function (m, n) { return "floor " + n; }],
    [/^(\d+)\s*уровень$/, function (m, n) { return "level " + n; }],
    [/^(\d+)\s*этажей$/, function (m, n) { return n + " floors"; }],

    /* --- журнал: собранные строки --- */
    [/^Кампания «(.+)» · глава ([IVXLC]+) из (\d+) · (.+)$/,
      function (m, title, num, total, step) {
        return "Campaign “" + translateString(title) + "” · chapter " + num +
          " of " + total + " · " + translateString(step);
      }],
    [/^Глава ([IVXLC]+) из (\d+) · (.+)$/,
      function (m, num, total, place) {
        return "Chapter " + num + " of " + total + " · " + translateString(place);
      }],
    [/^Глава ([IVXLC]+) · знакомство$/,
      function (m, num) { return "Chapter " + num + " · introduction"; }],
    [/^Глава ([IVXLC]+) · к старосте$/,
      function (m, num) { return "Chapter " + num + " · to the elder"; }],
    [/^Финал · (\d+) из (\d+)$/,
      function (m, a, b) { return "Finale · " + a + " of " + b; }],
    [/^знакомства (\d+)\/(\d+)$/,
      function (m, a, b) { return "introductions " + a + "/" + b; }],
    [/^(.+) · этаж (\d+) · (.+)$/,
      function (m, name, n, phases) {
        return translateString(name) + " · floor " + n + " · " +
          translateString(phases);
      }],
    [/^(.+) · этаж (\d+)$/,
      function (m, name, n) {
        return translateString(name) + " · floor " + n;
      }],
    [/^(.+) преграждает путь$/,
      function (m, name) { return translateString(name) + " blocks the way"; }],

    /* --- награды и материалы --- */
    [/^(\d+) золота(?: и (.+))?$/, function (m, gold, rest) {
      return gold + " gold" + (rest ? " and " + translateString(rest) : "");
    }],
    [/^(\d+)\s+руды?$/, function (m, n) { return n + " ore"; }],
    [/^(\d+)\s+древесины$/, function (m, n) { return n + " wood"; }],
    [/^(\d+)\s+обломков?$/, function (m, n) { return n + " shards"; }],
    [/^руда (\d+)\/(\d+)((?: · (?:руда|древесина|обломки) \d+\/\d+)*)$/,
      function (m, have, need, rest) {
        var line = "ore " + have + "/" + need;
        var parts = rest.split(" · ");
        for (var i = 1; i < parts.length; i += 1) {
          line += " · " + translateString(parts[i]);
        }
        return line;
      }],
    [/^древесина (\d+)\/(\d+)((?: · (?:руда|древесина|обломки) \d+\/\d+)*)$/,
      function (m, have, need, rest) {
        var line = "wood " + have + "/" + need;
        var parts = rest.split(" · ");
        for (var i = 1; i < parts.length; i += 1) {
          line += " · " + translateString(parts[i]);
        }
        return line;
      }],
    [/^обломки (\d+)\/(\d+)((?: · (?:руда|древесина|обломки) \d+\/\d+)*)$/,
      function (m, have, need, rest) {
        var line = "shards " + have + "/" + need;
        var parts = rest.split(" · ");
        for (var i = 1; i < parts.length; i += 1) {
          line += " · " + translateString(parts[i]);
        }
        return line;
      }],
    [/^(.+) · лечение \+(\d+)$/,
      function (m, rarity, n) {
        return translateString(rarity) + " · healing +" + n;
      }],
    [/^лечение \+(\d+)$/, function (m, n) { return "healing +" + n; }],

    /* --- деревня: числа и составные строки --- */
    [/^Глава ([IVXLC]+)\. (.+)$/, function (m, num, title) {
      return "Chapter " + num + ". " + translateString(title);
    }],
    [/^уровень (\d+) из (\d+)$/, function (m, a, b) {
      return "level " + a + " of " + b;
    }],
    [/^Уровень (\d+) из (\d+): (.+)$/, function (m, a, b, rest) {
      return "Level " + a + " of " + b + ": " + translateString(rest);
    }],
    [/^Уровень (\d+) из (\d+)$/, function (m, a, b) {
      return "Level " + a + " of " + b;
    }],
    [/^Сейчас: (.+)$/, function (m, rest) {
      return "Now: " + translateString(rest);
    }],
    [/^Даёт: (.+)$/, function (m, rest) {
      return "Gives: " + translateString(rest);
    }],
    [/^Нужно: (.+)$/, function (m, rest) {
      return "Needs: " + rest.split(" · ").map(function (part) {
        return translateString(part.trim());
      }).join(" · ");
    }],
    [/^Улучшить: (.+)$/, function (m, rest) {
      return "Upgrade: " + translateString(rest);
    }],
    [/^Восстановить: (.+)$/, function (m, rest) {
      return "Restore: " + translateString(rest);
    }],
    [/^([✗✓])\s*(руда|древесина|обломки) (\d+)\/(\d+)$/,
      function (m, mark, kind, have, need) {
        return mark + " " + translateString(kind) + " " + have + "/" + need;
      }],
    [/^([✗✓])\s*(.+)$/, function (m, mark, rest) {
      if (rest.indexOf(" · ") >= 0) {
        return mark + " " + rest.split(" · ").map(function (part) {
          return translateString(part.trim());
        }).join(" · ");
      }
      return mark + " " + translateString(rest);
    }],
    [/^в запасе: (\d+) из (\d+)$/, function (m, a, b) {
      return "in stock: " + a + " of " + b;
    }],
    [/^в кошельке: (\d+)$/, function (m, n) {
      return "in purse: " + n;
    }],
    [/^ещё (\d+) из (\d+)$/, function (m, a, b) {
      return a + " of " + b + " left";
    }],
    [/^максимум (\d+)$/, function (m, n) { return "maximum " + n; }],
    [/^выполнено раз: (\d+)$/, function (m, n) {
      return "completed: " + n;
    }],
    [/^(\d+) раз$/, function (m, n) { return n + " time"; }],
    [/^(\d+) раза$/, function (m, n) { return n + " times"; }],
    [/^Второй шанс: возрождает героя на месте\. Уносить можно не больше (\d+)\.$/,
      function (m, n) {
        return "Second chance: revives the hero on the spot. You can carry no more than " +
          n + ".";
      }],
    [/^Со склада: (.+)$/, function (m, rest) {
      return "From the storage: " + translateString(rest);
    }],
    [/^этаж (\d+), (\d+)%( — победа над драконом)?$/,
      function (m, n, pct, win) {
        return "floor " + n + ", " + pct + "%" +
          (win ? " — victory over the dragon" : "");
      }],
    [/^(.+) — (знакомства \d+\/\d+)\.$/, function (m, title, progress) {
      return translateString(title) + " — " + translateString(progress) + ".";
    }],
    [/^(руда|древесина|обломки) (\d+)$/, function (m, kind, n) {
      return translateString(kind) + " " + n;
    }],
    [/^руда (\d+) · древесина (\d+) · обломки (\d+)$/,
      function (m, a, b, c) {
        return "ore " + a + " · wood " + b + " · shards " + c;
      }],
    [/^([✗✓].*·.*)$/, function (m, line) {
      return line.split(" · ").map(function (part) {
        return translateString(part.trim());
      }).join(" · ");
    }],
    [/^☆ (.+)$/, function (m, rest) {
      return "☆ " + translateString(rest);
    }],
    [/^\((\d+) из (\d+)\)$/, function (m, a, b) {
      return "(" + a + " of " + b + ")";
    }],
    [/^(\d+)\/3 уроков$/, function (m, n) { return n + "/3 lessons"; }],
    [/^\+(\d+) урона$/, function (m, n) { return "+" + n + " damage"; }],
    [/^\+(\d+)% золота$/, function (m, n) { return "+" + n + "% gold"; }],
    [/^HP (\d+) · урон (\d+)( · босс)?$/, function (m, hp, dmg, boss) {
      return "HP " + hp + " · damage " + dmg + (boss ? " · boss" : "");
    }],
    [/^Фазы: (.+)$/, function (m, rest) {
      return "Phases: " + translateString(rest);
    }],
    [/^([●○]+) \((\d+) из (\d+)\)$/, function (m, dots, a, b) {
      return dots + " (" + a + " of " + b + ")";
    }],
    [/^Дистанция (\d+)$/, function (m, n) { return "Range " + n; }],
    [/^Серия (\d+) · ×([\d,.]+)$/, function (m, n, mult) {
      return "Streak " + n + " · ×" + mult;
    }],
    [/^Ошибки (\d+) · ×([\d,.]+)$/, function (m, n, mult) {
      return "Errors " + n + " · ×" + mult;
    }],
    [/^Отряд: осталось монстров — (\d+)$/, function (m, n) {
      return "Squad: monsters left — " + n;
    }],
    [/^Фаза (\d+) из (\d+): (.+)$/, function (m, n, total, name) {
      return "Phase " + n + " of " + total + ": " + translateString(name);
    }],
    [/^(.+) · фаза (\d+) из (\d+)$/, function (m, name, n, total) {
      return translateString(name) + " · phase " + n + " of " + total;
    }],
    [/^Фаза (\d+) · (.+)$/, function (m, n, name) {
      return "Phase " + n + " · " + translateString(name);
    }],
    [/^Тебя тошнит от яда\. Осталось (\d+) ходов\.$/, function (m, n) {
      return "You are sick with poison. " + n + " turns left.";
    }],
    [/^(\d+) урона$/, function (m, n) { return n + " damage"; }],
    [/^ожидалось (.+), получено (.+)$/, function (m, want, got) {
      return "expected " + want + ", got " + got;
    }],
    [/^#(\d+) (пройден|провален) · ожидалось (.+), получено (.+)$/,
      function (m, i, state, want, got) {
        return "#" + i + " " + translateString(state) + " · expected " +
          want + ", got " + got;
      }],
    [/^В бой с (.+)$/, function (m, name) {
      return "Fight " + translateString(name);
    }],
    [/^Ошибок подряд: (\d+)\. Следующая ошибка ударит сильнее — ×([\d,.]+)\. Верный ответ сбросит счёт\.$/,
      function (m, n, mult) {
        return "Mistakes in a row: " + n +
          ". The next mistake will hit harder — ×" + mult +
          ". A correct answer resets the count.";
      }],
    [/^Бьёт с расстояния (\d+) клеток\. Урон слабее, но подойти вплотную не выйдет\.$/,
      function (m, n) {
        return "Strikes from " + n +
          " tiles away. The damage is weaker, but you won't get close.";
      }],
    [/^Точный ответ · удар ×([\d.,]+)$/, function (m, mult) {
      return "Precise answer · strike ×" + mult;
    }],
    [/^Ошибка · удар ×([\d.,]+)$/, function (m, mult) {
      return "Mistake · strike ×" + mult;
    }]
  ];

  /* ------------------------------------------------------------------ */
  /* Перевод строки                                                      */
  /* ------------------------------------------------------------------ */

  var CYRILLIC = /[А-Яа-яЁё]/;

  function translateString(raw) {
    if (LANG !== "en" || raw == null) return raw;
    var text = String(raw);
    if (!CYRILLIC.test(text)) return text;

    var lead = text.match(/^\s*/)[0];
    var tail = text.match(/\s*$/)[0];
    var core = text.slice(lead.length, text.length - tail.length);
    if (!core) return text;

    var hit = DICT[core];
    if (hit != null) return lead + hit + tail;

    // Переносы строк и двойные пробелы в тексте не мешают словарю.
    var flat = core.replace(/\s+/g, " ");
    if (flat !== core) {
      hit = DICT[flat];
      if (hit != null) return lead + hit + tail;
    }

    for (var i = 0; i < RULES.length; i++) {
      var m = RULES[i][0].exec(core);
      if (m) return lead + RULES[i][1].apply(null, m) + tail;
    }
    return text;
  }

  /* ------------------------------------------------------------------ */
  /* Обход DOM                                                           */
  /* ------------------------------------------------------------------ */

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, PRE: 1, CODE: 1, KBD: 1 };
  var ATTRS = ["placeholder", "title", "aria-label", "alt", "data-tip"];

  function shouldSkip(element) {
    return !!(element && SKIP_TAGS[element.tagName]);
  }

  function translateTextNode(node, parent) {
    if (shouldSkip(parent)) return;
    var value = node.nodeValue;
    if (!value || !CYRILLIC.test(value)) return;
    // Аватар профиля показывает первую букву имени по умолчанию. После
    // перевода имени «Игрок» → «Player» буква должна стать английской.
    if (parent && parent.classList && parent.classList.contains("menu-avatar") &&
        value.trim() === "И") {
      node.nodeValue = value.replace("И", "P");
      return;
    }
    var next = translateString(value);
    if (next !== value) node.nodeValue = next;
  }

  function translateElement(element) {
    // Атрибуты безопасно переводить и у <textarea>/<pre>: подписи не код.
    var i, attr;
    for (i = 0; i < ATTRS.length; i++) {
      attr = ATTRS[i];
      var val = element.getAttribute && element.getAttribute(attr);
      if (val && CYRILLIC.test(val)) {
        var next = translateString(val);
        if (next !== val) element.setAttribute(attr, next);
      }
    }
  }

  function walk(root, includeSelf) {
    if (!root) return;
    if (root.nodeType === 3) {
      translateTextNode(root, root.parentElement);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (includeSelf && root.nodeType === 1) translateElement(root);

    if (root.nodeType === 1 && shouldSkip(root)) return;

    // Сначала собираем узлы, потом переводим: правка текста прямо во время
    // обхода сбивает TreeWalker и часть дерева остаётся непереведённой.
    var walker = document.createTreeWalker(
      root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false
    );
    var nodes = [];
    var node = walker.nextNode();
    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType === 3) translateTextNode(nodes[i], nodes[i].parentElement);
      else translateElement(nodes[i]);
    }
  }

  function translateTitle() {
    if (document.title && CYRILLIC.test(document.title)) {
      var next = translateString(document.title);
      if (next !== document.title) document.title = next;
    }
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      var content = desc.getAttribute("content") || "";
      if (CYRILLIC.test(content)) desc.setAttribute("content", translateString(content));
    }
  }

  function translateDocument() {
    if (LANG !== "en") return;
    walk(document.body, false);
    translateTitle();
    document.documentElement.lang = "en";
  }

  /* ------------------------------------------------------------------ */
  /* Наблюдатель за перерисовками                                        */
  /* ------------------------------------------------------------------ */

  var pending = false;
  var queue = [];

  function collect(records) {
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      if (rec.type === "characterData") {
        translateTextNode(rec.target, rec.target.parentElement);
        continue;
      }
      if (rec.type === "attributes") {
        translateElement(rec.target);
        continue;
      }
      for (var j = 0; j < rec.addedNodes.length; j++) {
        walk(rec.addedNodes[j], true);
      }
    }
  }

  var observer = new MutationObserver(function (records) {
    if (LANG !== "en") return;
    // Несколько пачек мутаций за кадр склеиваем: если обрабатывать только
    // первую, остальные узлы так и останутся русскими.
    for (var i = 0; i < records.length; i++) queue.push(records[i]);
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var batch = queue;
      queue = [];
      collect(batch);
    });
  });

  function startObserver() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  /* ------------------------------------------------------------------ */
  /* Переключатель в настройках                                          */
  /* ------------------------------------------------------------------ */

  function syncSwitch() {
    var buttons = document.querySelectorAll("[data-lang-switch]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-lang-switch") === LANG;
      buttons[i].classList.toggle("is-active", on);
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function bindSwitch() {
    document.addEventListener("click", function (event) {
      var btn = event.target.closest && event.target.closest("[data-lang-switch]");
      if (!btn) return;
      var code = btn.getAttribute("data-lang-switch");
      if (code && code !== LANG) {
        event.preventDefault();
        setLanguage(code);
      }
    });
    syncSwitch();
  }

  /* ------------------------------------------------------------------ */
  /* Запуск                                                              */
  /* ------------------------------------------------------------------ */

  LANG = detectLanguage();
  window.PyI18n = {
    get language() { return LANG; },
    setLanguage: setLanguage,
    t: translateString,
    tr: translateString,
    translate: translateString
  };
  // Короткий алиас для контентных файлов и игрового кода.
  window.tr = translateString;
  window.t = translateString;

  function boot() {
    if (LANG === "en") {
      document.documentElement.lang = "en";
      translateDocument();
      startObserver();
    }
    bindSwitch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
