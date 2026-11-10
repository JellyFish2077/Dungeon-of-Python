// Проверка ссылок и обязательных полей контента. Не гоняет бой и не
// строит этажи: ловит опечатки в id, пустые награды и забытые данные.
// Запуск: node tools/content_lint.js
const fs = require("fs");
const path = require("path");
const { API } = require("./game_harness.js");

const ROOT = path.join(__dirname, "..");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function unique(list, name) {
  const seen = new Set();
  list.forEach((value, index) => {
    if (!value) fail(name + ": пустой ключ в позиции " + index);
    else if (seen.has(value)) fail(name + ": дубликат «" + value + "»");
    seen.add(value);
  });
  return seen;
}

function object(value) {
  return value && typeof value === "object" ? value : {};
}

const items = API.ITEM_POOL || [];
const itemIds = unique(items.map((item) => item.id), "предметы");
const enemies = API.ENEMY_TYPES || [];
const enemyKeys = unique(enemies.map((type) => type.key), "враги");
const lootKinds = API.LOOT_KINDS || [];
const keyDefs = object(API.KEY_DEFS);
const topics = object(API.TOPICS);
const bossInfo = API.BOSS_INFO || {};
const bossKeys = Object.keys(bossInfo);

// Предметы.
items.forEach((item) => {
  if (!item.name) fail("предмет " + item.id + ": нет имени");
  if (!["weapon", "shield", "armor", "accessory", "potion"].includes(item.slot)) {
    fail("предмет " + item.id + ": неизвестный слот " + item.slot);
  }
});

// Боссы: титул, три фазы, трофей, лут и слуги должны существовать.
const trophyKeys = new Set();
bossKeys.forEach((key) => {
  const info = bossInfo[key];
  if (!enemyKeys.has(key)) fail("босс " + key + ": нет в ENEMY_TYPES");
  if (!info.name || !info.title) fail("босс " + key + ": нет имени или титула");
  if (!Array.isArray(info.phases) || info.phases.length !== 3) {
    fail("босс " + key + ": должно быть ровно три фазы");
  }
  if (!info.trophy || !info.trophy.key || !info.trophy.name) {
    fail("босс " + key + ": нет трофея");
  } else if (trophyKeys.has(info.trophy.key)) {
    fail("босс " + key + ": трофей «" + info.trophy.key + "» уже занят");
  } else {
    trophyKeys.add(info.trophy.key);
  }
  (info.loot || []).forEach((id) => {
    if (!itemIds.has(id)) fail("босс " + key + ": лут «" + id + "» не найден");
  });
  (info.minions || []).forEach((id) => {
    if (!enemyKeys.has(id)) fail("босс " + key + ": слуга «" + id + "» не найден");
  });
  (info.taunts || []).forEach((line, index) => {
    if (!line) fail("босс " + key + ": пустая реплика " + index);
  });
});

// Этажи v2: пять боссов и ссылки на существующих боссов.
const floors = API.FLOORS_V2 || [];
if (floors.length !== 15) fail("FLOORS_V2: ожидалось 15 этажей, найдено " + floors.length);
const bossFloors = floors.filter((floor) => floor.boss);
if (bossFloors.length !== 5) fail("FLOORS_V2: ожидалось 5 боссов, найдено " + bossFloors.length);
bossFloors.forEach((floor) => {
  if (!bossInfo[floor.bossKey]) fail("этаж " + floor.name + ": неизвестный босс " + floor.bossKey);
  if (floor.bossName !== (bossInfo[floor.bossKey] || {}).name) {
    fail("этаж " + floor.name + ": имя босса не совпадает с BOSS_INFO");
  }
});

// Сюжет и повторяемые задания.
const storyKeys = unique((API.STORY_QUESTS || []).map((quest) => quest.key), "сюжет");
(API.STORY_QUESTS || []).forEach((quest) => {
  if (!quest.title || !quest.goal || !quest.brief) fail("сюжет " + quest.key + ": не хватает полей");
  if (quest.goal !== "meet" && quest.goal !== "victory" &&
      !(API.VILLAGE_CAPS && Object.prototype.hasOwnProperty.call(API.VILLAGE_CAPS, quest.goal))) {
    fail("сюжет " + quest.key + ": неизвестная цель " + quest.goal);
  }
  const reward = quest.reward || {};
  Object.keys(reward).forEach((key) => {
    if (key === "gold" || key === "key") return;
    if (!lootKinds.includes(key) && !Object.prototype.hasOwnProperty.call(keyDefs, key)) {
      fail("сюжет " + quest.key + ": неизвестная награда " + key);
    }
  });
  if (reward.key && !Object.prototype.hasOwnProperty.call(keyDefs, reward.key)) {
    fail("сюжет " + quest.key + ": неизвестный ключ " + reward.key);
  }
});

(API.REPEAT_KEYS || []).forEach((key) => {
  const quest = API.REPEAT_QUESTS[key];
  if (!quest) fail("повторяемое задание " + key + ": нет описания");
});

// Жители, дома и знакомства.
const npcKeys = unique((API.VILLAGE_NPCS || []).map((npc) => npc.key), "жители");
(API.VILLAGE_NPCS || []).forEach((npc) => {
  if (!npc.name) fail("житель " + npc.key + ": нет имени");
  if (npc.place !== "village" && !(API.HOUSE_MAPS && API.HOUSE_MAPS[npc.place])) {
    fail("житель " + npc.key + ": неизвестное место " + npc.place);
  }
});
(API.VILLAGE_MEET_NPCS || []).forEach((key) => {
  if (!npcKeys.has(key)) fail("знакомство: неизвестный житель " + key);
});
Object.keys(API.NPC_GREETINGS || {}).forEach((key) => {
  if (!npcKeys.has(key)) fail("приветствие: неизвестный житель " + key);
  if (!Array.isArray(API.NPC_GREETINGS[key]) || !API.NPC_GREETINGS[key].length) {
    fail("приветствие " + key + ": пустой список реплик");
  }
});

// Вопросы.
const questionIds = unique((API.QUESTIONS || []).map((q) => q.id), "вопросы");
(API.QUESTIONS || []).forEach((q) => {
  if (!q.text) fail("вопрос " + q.id + ": нет текста");
  if (!topics[q.topic]) fail("вопрос " + q.id + ": неизвестная тема " + q.topic);
  if (!(q.level >= 1 && q.level <= 4)) fail("вопрос " + q.id + ": уровень вне 1..4");
  if (!Array.isArray(q.options) || q.options.length < 2) {
    fail("вопрос " + q.id + ": меньше двух вариантов");
  } else if (!(q.answer >= 0 && q.answer < q.options.length)) {
    fail("вопрос " + q.id + ": ответ вне списка вариантов");
  }
});

// Практические банки.
function lintTaskBank(name, list, hasAnswer) {
  const ids = unique((list || []).map((task) => task.id), name);
  (list || []).forEach((task) => {
    if (!task.title) fail(name + " " + task.id + ": нет заголовка");
    if (hasAnswer && (!Array.isArray(task.options) || task.options.length < 2)) {
      fail(name + " " + task.id + ": меньше двух вариантов");
    }
    if (hasAnswer && !(task.answer >= 0 && task.answer < task.options.length)) {
      fail(name + " " + task.id + ": ответ вне списка вариантов");
    }
    if (!task.code && !task.task) fail(name + " " + task.id + ": нет кода и задания");
  });
  return ids;
}
lintTaskBank("fill", API.FILL_TASKS, true);
lintTaskBank("error", API.ERROR_TASKS, true);
lintTaskBank("copy", API.COPY_TASKS, false);
const codeIds = lintTaskBank("code", API.CODE_TASKS, false);

// Тестовый банк кода должен совпадать с заданиями.
try {
  const bank = JSON.parse(fs.readFileSync(path.join(ROOT, "static", "code-tasks-tests.json"), "utf8"));
  codeIds.forEach((id) => {
    if (!Array.isArray(bank[id]) || !bank[id].length) {
      fail("code " + id + ": нет тестов в code-tasks-tests.json");
    } else if (!bank[id].every((t) => t.call && t.expected !== undefined)) {
      fail("code " + id + ": тест без call/expected");
    }
  });
  Object.keys(bank).forEach((id) => {
    if (!codeIds.has(id)) fail("code-tasks-tests.json: лишний id " + id);
  });
} catch (err) {
  fail("code-tasks-tests.json: " + err.message);
}

// Курс.
const course = API.PY_COURSE || [];
if (course.length !== 9) fail("курс: ожидалось 9 модулей, найдено " + course.length);
const moduleKeys = unique(course.map((module) => module.key), "модули курса");
course.forEach((module) => {
  if (!topics[module.key]) fail("курс " + module.key + ": нет темы в TOPICS");
  if (!Array.isArray(module.lessons) || module.lessons.length !== 3) {
    fail("курс " + module.key + ": должно быть три урока");
  } else {
    module.lessons.forEach((lesson, index) => {
      if (!lesson.key || !lesson.title || !lesson.goal) {
        fail("курс " + module.key + ": неполный урок " + index);
      }
      if (!!lesson.exam !== (index === 2)) {
        fail("курс " + module.key + ": экзамен должен быть третьим уроком");
      }
    });
  }
  if (!API.PY_COURSE_QUESTS || !API.PY_COURSE_QUESTS[module.key]) {
    fail("курс " + module.key + ": нет домашнего задания");
  }
});

// Деревня.
Object.keys(object(API.VILLAGE_BUILDINGS)).forEach((key) => {
  if (!API.VILLAGE_CAPS || !Object.prototype.hasOwnProperty.call(API.VILLAGE_CAPS, key)) {
    fail("деревня: постройка " + key + " без лимита уровня");
  }
});

console.log("Проверка контента");
console.log("  предметов: " + items.length + ", врагов: " + enemies.length +
  ", боссов: " + bossKeys.length + ", вопросов: " + questionIds.size +
  ", задач: " + (API.FILL_TASKS.length + API.ERROR_TASKS.length +
    API.COPY_TASKS.length + API.CODE_TASKS.length));
warnings.forEach((message) => console.log("  предупреждение: " + message));
if (errors.length) {
  errors.forEach((message) => console.log("  СБОЙ: " + message));
  console.log("Итог: " + errors.length + " ошибок контента.");
  process.exit(1);
}
console.log("Итог: ошибок контента нет.");
