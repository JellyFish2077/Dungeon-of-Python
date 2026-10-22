// Единый профиль ученика для квиза, учёбы и подземелья.
// Хранится локально в браузере. Кошелёк наград тратится в подземелье.
const PROFILE_KEY = "pyquiz_profiles_v1";
const LAST_NAME_KEY = "pyquiz_last_name";
// Ключи сейва и метки места дублируют game.js: профиль не должен зависеть от
// загруженной игры, но переименование обязано перенести обе записи вместе
// с профилем. Это строки формата localStorage, а не игровая логика.
const SAVE_STORAGE_PREFIX = "pyquiz_save_v1";
const PLACE_STORAGE_PREFIX = "pyquiz_place_v1";
const VILLAGE_STORAGE_PREFIX = "pyquiz_village_v1";
const SAVE_SLOTS_STORAGE_PREFIX = "pyquiz_save_slots_v1";
// Потолок амулетов возврата. Значение по умолчанию: точное число задаёт
// админка (hub.amuletMax в game.js), но профиль хранит счётчик сам и должен
// уметь зажать его и без загруженной игры. Держим эти два числа в согласии.
const HUB_AMULET_MAX = 3;

function profileKey(name) {
  return String(name || "").trim().toLowerCase();
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === "object" ? data : {};
  } catch (e) {
    return {};
  }
}

function saveProfiles(all) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
  } catch (e) {
    // ignore
  }
}

function setLastName(name) {
  try {
    if (name) localStorage.setItem(LAST_NAME_KEY, String(name).trim());
  } catch (e) {
    // ignore
  }
}

function getLastName() {
  try {
    return localStorage.getItem(LAST_NAME_KEY) || "";
  } catch (e) {
    return "";
  }
}

// --- Постоянная прогрессия между походами ---
// Поход обнуляется целиком (см. begin() в game.js): уровень, кузница, сумка.
// А это остаётся навсегда: улучшения героя, постройки деревни, найденные
// материалы и ключи, пройденные квесты и выбранное умение. Форма одна для
// профиля, сервера и страницы профиля, поэтому описание формы живёт здесь.
//
// Потолки уровней продублированы на сервере (clean_profile): если клиент
// разрешит уровень, который сервер срежет, прогресс героя будет молча
// теряться при синхронизации. Совпадение чисел проверяет checks.js.
const HERO_CAPS = { hp: 5, dmg: 5, potions: 3, loot: 3, armor: 3 };
const VILLAGE_CAPS = { well: 2, barn: 2, forge: 2, smith: 2 };
const LOOT_KINDS = ["ore", "wood", "shard"];
const LOOT_NAMES = { ore: "руда", wood: "древесина", shard: "обломки" };
const KEYS_MAX = 12;

function progressEmpty() {
  return {
    hero: { hp: 0, dmg: 0, potions: 0, loot: 0, armor: 0 },
    village: { well: 0, barn: 0, forge: 0, smith: 0 },
    loot: { ore: 0, wood: 0, shard: 0, keys: [] },
    quests: { story: 0, done: [], repeat: {}, progress: {}, active: "" },
    ability: { pick: "", used: 0 }
  };
}

function progressLevel(v, cap) {
  const n = Math.floor(Number(v) || 0);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(cap, n);
}

// Приводит прогрессию к известной форме: любые дыры и мусор из localStorage,
// сервера или старой версии игры чинятся здесь, а не в каждой точке чтения.
function normalizeProgress(p) {
  const blank = progressEmpty();
  if (!p.hero || typeof p.hero !== "object") p.hero = blank.hero;
  Object.keys(HERO_CAPS).forEach((k) => { p.hero[k] = progressLevel(p.hero[k], HERO_CAPS[k]); });
  if (!p.village || typeof p.village !== "object") p.village = blank.village;
  Object.keys(VILLAGE_CAPS).forEach((k) => { p.village[k] = progressLevel(p.village[k], VILLAGE_CAPS[k]); });
  if (!p.loot || typeof p.loot !== "object") p.loot = blank.loot;
  LOOT_KINDS.forEach((k) => {
    const n = Math.floor(Number(p.loot[k]) || 0);
    p.loot[k] = isFinite(n) && n > 0 ? Math.min(999999, n) : 0;
  });
  if (!Array.isArray(p.loot.keys)) p.loot.keys = [];
  p.loot.keys = p.loot.keys.filter((k) => typeof k === "string" && k).slice(0, KEYS_MAX);
  if (!p.quests || typeof p.quests !== "object") p.quests = blank.quests;
  if (!Array.isArray(p.quests.done)) p.quests.done = [];
  p.quests.done = p.quests.done.filter((k) => typeof k === "string" && k).slice(0, 60);
  if (!p.quests.repeat || typeof p.quests.repeat !== "object") p.quests.repeat = {};
  if (!p.quests.progress || typeof p.quests.progress !== "object") p.quests.progress = {};
  // Взятое повторяемое задание: оно живёт между походами, потому что цель
  // бывает и на несколько спусков («принеси руду»).
  p.quests.active = typeof p.quests.active === "string" ? p.quests.active.slice(0, 40) : "";
  const step = Math.floor(Number(p.quests.story) || 0);
  p.quests.story = isFinite(step) && step > 0 ? Math.min(60, step) : 0;
  if (!p.ability || typeof p.ability !== "object") p.ability = blank.ability;
  p.ability.pick = typeof p.ability.pick === "string" ? p.ability.pick.slice(0, 20) : "";
  const used = Math.floor(Number(p.ability.used) || 0);
  p.ability.used = isFinite(used) && used > 0 ? Math.min(99, used) : 0;
  return p;
}

// Уровни и материалы только растут: серверная копия может быть старше
// локальной, и складывать их нельзя (иначе повторная синхронизация удвоила бы
// находки). Берём большую из двух — так же, как уже сделано для амулетов.
function progressMerge(local, remote) {
  const l = normalizeProgress(JSON.parse(JSON.stringify(local || progressEmpty())));
  const r = normalizeProgress(JSON.parse(JSON.stringify(remote || progressEmpty())));
  const out = progressEmpty();
  Object.keys(HERO_CAPS).forEach((k) => { out.hero[k] = Math.max(l.hero[k], r.hero[k]); });
  Object.keys(VILLAGE_CAPS).forEach((k) => { out.village[k] = Math.max(l.village[k], r.village[k]); });
  LOOT_KINDS.forEach((k) => { out.loot[k] = Math.max(l.loot[k], r.loot[k]); });
  const keys = l.loot.keys.concat(r.loot.keys.filter((k) => l.loot.keys.indexOf(k) < 0));
  out.loot.keys = keys.slice(0, KEYS_MAX);
  out.quests.story = Math.max(l.quests.story, r.quests.story);
  const done = l.quests.done.concat(r.quests.done.filter((k) => l.quests.done.indexOf(k) < 0));
  out.quests.done = done.slice(0, 60);
  out.quests.repeat = Object.assign({}, r.quests.repeat, l.quests.repeat);
  out.quests.progress = Object.assign({}, r.quests.progress, l.quests.progress);
  out.quests.active = l.quests.active || r.quests.active;
  out.ability.pick = l.ability.pick || r.ability.pick;
  out.ability.used = Math.max(l.ability.used, r.ability.used);
  return out;
}

// --- Стартовый уровень знаний (калибровка) ---
// Уровень 0 — калибровка ещё не пройдена; 1–3 — ступень, которую ученик
// показал на шести вопросах. Это не оценка за поход, а стартовая настройка
// выдачи заданий, поэтому она живёт отдельно от процентов и достижений.
const KNOWLEDGE_LEVELS = 3;
const KNOWLEDGE_QUESTIONS = 6;
const KNOWLEDGE_MAX_SCORE = 12;

function knowledgeEmpty() {
  return { level: 0, source: "", date: "", correct: 0, total: 0, score: 0 };
}

function clampKnowledgeInt(value, max) {
  const n = Math.floor(Number(value) || 0);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
}

// Приводит запись калибровки к известной форме. Правила те же, что на
// сервере в clean_profile: клиент не должен записать уровень 9 или счёт 999.
function normalizeKnowledge(raw) {
  const out = knowledgeEmpty();
  if (!raw || typeof raw !== "object") return out;
  const level = Math.floor(Number(raw.level) || 0);
  // Как и на сервере, слишком большое значение зажимаем потолком, а не
  // обнуляем: иначе рассинхрон клиента и сервера выглядел бы как «ученик
  // никогда не проходил калибровку».
  out.level = level >= 1 ? Math.min(KNOWLEDGE_LEVELS, level) : 0;
  out.source = typeof raw.source === "string" ? raw.source.slice(0, 20) : "";
  out.date = typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(raw.date)
    ? raw.date.slice(0, 40) : "";
  out.correct = clampKnowledgeInt(raw.correct, KNOWLEDGE_QUESTIONS);
  out.total = clampKnowledgeInt(raw.total, KNOWLEDGE_QUESTIONS);
  out.score = clampKnowledgeInt(raw.score, KNOWLEDGE_MAX_SCORE);
  return out;
}

// При входе на другом компьютере у сервера может быть свежее прохождение
// калибровки, а локально — старее. Берём запись с более поздней датой;
// если даты нет, доверяем серверу. Ноль (не пройдена) не затирает уровень.
function pickKnowledge(local, remote) {
  const l = normalizeKnowledge(local);
  const r = normalizeKnowledge(remote);
  if (!r.level) return l;
  if (!l.level) return r;
  return (r.date || "") >= (l.date || "") ? r : l;
}

function getProfile(name) {
  const key = profileKey(name);
  if (!key) return null;
  const all = loadProfiles();
  if (!all[key]) {
    all[key] = {
      name: String(name).trim(),
      created: new Date().toISOString(),
      quizRuns: [],
      wallet: { gold: 0, small_potion: 0, big_potion: 0 },
      // Деревня — постоянная часть профиля: амулеты возврата (жёсткий потолок
      // HUB_AMULET_MAX) и купленное стартовое снаряжение. Походное снаряжение
      // живёт в сейве и гибнет вместе с походом, а это переживает смерть.
      hub: { revive: 0, gear: [] },
      dungeonBest: null,
      wrongPool: [],
      badges: {},
      knowledge: knowledgeEmpty(),
      stats: { correct: 0, codeSolved: 0, runs: 0, days: [], bestStreak: 0, studyTotal: 0, studyStreak: 0, studyBestStreak: 0 }
    };
    Object.assign(all[key], progressEmpty());
    saveProfiles(all);
  }
  const p = all[key];
  if (!p.wrongPool) p.wrongPool = [];
  if (!p.badges) p.badges = {};
  if (!p.stats) p.stats = { correct: 0, codeSolved: 0, runs: 0, days: [], bestStreak: 0 };
  if (typeof p.stats.bestStreak !== "number") p.stats.bestStreak = 0;
  if (typeof p.stats.studyTotal !== "number") p.stats.studyTotal = 0;
  if (typeof p.stats.studyStreak !== "number") p.stats.studyStreak = 0;
  if (typeof p.stats.studyBestStreak !== "number") p.stats.studyBestStreak = 0;
  if (!p.study || typeof p.study !== "object") p.study = { day: "", good: 0, total: 0, topics: {} };
  if (!p.study.topics || typeof p.study.topics !== "object") p.study.topics = {};
  if (!p.hub || typeof p.hub !== "object") p.hub = { revive: 0, gear: [] };
  if (typeof p.hub.revive !== "number" || !isFinite(p.hub.revive)) p.hub.revive = 0;
  p.hub.revive = Math.max(0, Math.min(HUB_AMULET_MAX, Math.floor(p.hub.revive)));
  if (!Array.isArray(p.hub.gear)) p.hub.gear = [];
  p.knowledge = normalizeKnowledge(p.knowledge);
  normalizeProgress(p);
  return p;
}

function putProfile(name, profile) {
  const key = profileKey(name);
  if (!key) return;
  const all = loadProfiles();
  all[key] = profile;
  saveProfiles(all);
}

// Переименование локального профиля в веб-сборке. Профиль лежит под ключом
// в нижнем регистре, а сохранение похода и метка места — под точным именем.
// Раньше «Изменить имя» просто создавало новый профиль: поход оставался под
// старым именем и становился недоступен. Здесь переезжают все три записи.
function renameProfile(oldName, newName) {
  const from = String(oldName || "").trim();
  const to = String(newName || "").trim().slice(0, 60);
  if (!from || !to) return { ok: false, error: "Введи имя" };
  if (from === to) return { ok: true, name: to };

  const fromKey = profileKey(from);
  const toKey = profileKey(to);
  if (!fromKey) return { ok: false, error: "Профиль не найден" };

  const all = loadProfiles();
  const source = all[fromKey];
  if (!source) return { ok: false, error: "Профиль не найден" };
  if (fromKey !== toKey && all[toKey]) {
    return { ok: false, error: "Это имя уже занято" };
  }

  const saveFrom = SAVE_STORAGE_PREFIX + ":" + from;
  const saveTo = SAVE_STORAGE_PREFIX + ":" + to;
  const placeFrom = PLACE_STORAGE_PREFIX + ":" + from;
  const placeTo = PLACE_STORAGE_PREFIX + ":" + to;
  const villageFrom = VILLAGE_STORAGE_PREFIX + ":" + from;
  const villageTo = VILLAGE_STORAGE_PREFIX + ":" + to;
  const slotsFrom = SAVE_SLOTS_STORAGE_PREFIX + ":" + from;
  const slotsTo = SAVE_SLOTS_STORAGE_PREFIX + ":" + to;

  try {
    // Не затираем чужое сохранение, даже если профиля с таким именем нет.
    if (saveFrom !== saveTo && localStorage.getItem(saveTo) != null) {
      return { ok: false, error: "У этого имени уже есть сохранение" };
    }
    if (placeFrom !== placeTo && localStorage.getItem(placeTo) != null) {
      return { ok: false, error: "У этого имени уже есть сохранение" };
    }
    if (villageFrom !== villageTo && localStorage.getItem(villageTo) != null) {
      return { ok: false, error: "У этого имени уже есть сохранение" };
    }
    if (slotsFrom !== slotsTo && localStorage.getItem(slotsTo) != null) {
      return { ok: false, error: "У этого имени уже есть сохранение" };
    }

    all[toKey] = Object.assign({}, source, { name: to });
    if (fromKey !== toKey) delete all[fromKey];
    saveProfiles(all);

    if (saveFrom !== saveTo) {
      const save = localStorage.getItem(saveFrom);
      if (save != null) {
        // Внутри сейва тоже лежит имя владельца: game.js сверяет его при
        // загрузке, поэтому одного переноса ключа мало.
        let data = null;
        try { data = JSON.parse(save); } catch (e) {}
        if (data && typeof data === "object") {
          data.name = to;
          localStorage.setItem(saveTo, JSON.stringify(data));
        } else {
          localStorage.setItem(saveTo, save);
        }
        localStorage.removeItem(saveFrom);
      }
    }
    if (placeFrom !== placeTo) {
      const place = localStorage.getItem(placeFrom);
      if (place != null) {
        localStorage.setItem(placeTo, place);
        localStorage.removeItem(placeFrom);
      }
    }
    if (villageFrom !== villageTo) {
      const village = localStorage.getItem(villageFrom);
      if (village != null) {
        let data = null;
        try { data = JSON.parse(village); } catch (e) {}
        if (data && typeof data === "object") {
          data.name = to;
          localStorage.setItem(villageTo, JSON.stringify(data));
        } else {
          localStorage.setItem(villageTo, village);
        }
        localStorage.removeItem(villageFrom);
      }
    }
    if (slotsFrom !== slotsTo) {
      const rawSlots = localStorage.getItem(slotsFrom);
      if (rawSlots != null) {
        let data = null;
        try { data = JSON.parse(rawSlots); } catch (e) {}
        if (Array.isArray(data)) {
          data.forEach((slot) => {
            if (!slot || !slot.snapshot) return;
            slot.snapshot.name = to;
            if (slot.snapshot.data && typeof slot.snapshot.data === "object") {
              slot.snapshot.data.name = to;
            }
          });
          localStorage.setItem(slotsTo, JSON.stringify(data));
        } else {
          localStorage.setItem(slotsTo, rawSlots);
        }
        localStorage.removeItem(slotsFrom);
      }
    }
  } catch (e) {
    return { ok: false, error: "Не удалось перенести сохранение" };
  }

  setLastName(to);
  return { ok: true, name: to };
}

function rewardForRun(percent, mode, bestStreak) {
  const mult = mode === "practice" ? 0.5 : 1;
  // Серия верных подряд — маленькая надбавка к золоту: она про азарт, а не про процент.
  const streakBonus = bestStreak >= 3 ? Math.min(bestStreak, 10) : 0;
  return {
    gold: Math.round(percent * mult) + streakBonus,
    streak_bonus: streakBonus,
    small_potion: percent >= 60 ? 1 : 0,
    big_potion: percent >= 85 ? 1 : 0
  };
}

function walletText(w) {
  const parts = [];
  if (w.gold > 0) parts.push(w.gold + " золота");
  if (w.small_potion > 0) parts.push("малых зелий: " + w.small_potion);
  if (w.big_potion > 0) parts.push("больших зелий: " + w.big_potion);
  return parts.length ? parts.join(", ") : "пусто";
}

function walletEmpty(w) {
  return !w || (w.gold <= 0 && w.small_potion <= 0 && w.big_potion <= 0);
}

// --- Достижения ---
const ACHIEVEMENTS = [
  { id: "first_step", title: "Первый шаг", desc: "Пройти тест или тренажёр" },
  { id: "perfectionist", title: "Безупречно", desc: "100% в тесте" },
  { id: "scholar", title: "Усердный ученик", desc: "Пройти 5 тестов" },
  { id: "coder", title: "Кодер", desc: "Решить 10 задач на код" },
  { id: "regular", title: "Постоянство", desc: "Заниматься 3 дня подряд" },
  { id: "streak10", title: "На волне", desc: "10 верных ответов подряд" },
  { id: "marathon", title: "Марафонец", desc: "50 заданий в самоподготовке" },
  { id: "survivor", title: "Выживший", desc: "Дойти до 5 этажа" },
  { id: "dragonslayer", title: "Убийца драконов", desc: "Пройти подземелье" }
];

function earnBadges(profile) {
  const s = profile.stats || { correct: 0, codeSolved: 0, runs: 0, days: [] };
  const best = (profile.quizRuns || []).reduce((m, r) => Math.max(m, r.percent || 0), 0);
  const floors = profile.dungeonBest ? profile.dungeonBest.floors : 0;
  const victory = !!(profile.dungeonBest && profile.dungeonBest.victory);
  const check = {
    first_step: (profile.quizRuns || []).length >= 1,
    perfectionist: best >= 100,
    scholar: (profile.quizRuns || []).length >= 5,
    coder: s.codeSolved >= 10,
    regular: (s.days || []).length >= 3,
    streak10: (s.bestStreak || 0) >= 10,
    marathon: (s.studyTotal || 0) >= 50,
    survivor: floors >= 5,
    dragonslayer: victory
  };
  const earned = [];
  ACHIEVEMENTS.forEach((a) => {
    if (check[a.id] && !profile.badges[a.id]) {
      profile.badges[a.id] = new Date().toISOString();
      earned.push(a);
    }
  });
  return earned;
}

// --- Занятия в самоподготовке ---
// Каждый ответ в «быстрой практике» доезжает до профиля: счёт дня, серия,
// разбивка по темам и достижение за число решённых заданий. Раньше страница
// самоподготовки не писала в профиль вообще — счёт жил до перезагрузки.
function studyDay() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}

function recordStudy(name, opts) {
  if (!name) return null;
  const o = opts || {};
  const prof = getProfile(name);
  const s = prof.stats;
  const day = studyDay();
  if (!s.days) s.days = [];
  if (s.days.indexOf(day) < 0) s.days.push(day);
  s.studyTotal = (s.studyTotal || 0) + 1;
  if (o.ok) {
    s.correct = (s.correct || 0) + 1;
    if (o.kind === "code") s.codeSolved = (s.codeSolved || 0) + 1;
    s.studyStreak = (s.studyStreak || 0) + 1;
    if (s.studyStreak > (s.studyBestStreak || 0)) s.studyBestStreak = s.studyStreak;
    // Серия подряд считается и в тесте, и в практике: достижение одно.
    if (s.studyStreak > (s.bestStreak || 0)) s.bestStreak = s.studyStreak;
  } else {
    s.studyStreak = 0;
  }
  if (!prof.study || prof.study.day !== day) {
    prof.study = { day: day, good: 0, total: 0, topics: {} };
  }
  prof.study.total += 1;
  if (o.ok) prof.study.good += 1;
  if (o.topic) {
    const t = prof.study.topics[o.topic] || (prof.study.topics[o.topic] = { ok: 0, total: 0 });
    t.total += 1;
    if (o.ok) t.ok += 1;
  }
  earnBadges(prof);
  putProfile(name, prof);
  return prof;
}

// --- Синхронизация профиля с сервером (вход — в auth.js, по токену) ---

// Старая версия самоподготовки хранила PIN в localStorage открытым текстом:
// его видел любой, кто садился за тот же компьютер. Вход теперь по токену
// сессии (auth.js), а оставшийся PIN стираем при первой загрузке страницы.
try { localStorage.removeItem("pyquiz_pin"); } catch (e) {}

function accountFetch(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then((r) => r.json());
}

// Сохранить текущий профиль на сервер, если вход выполнен. Без ожидания.
function syncProfile(name) {
  if (!name) return;
  const prof = getProfile(name);
  if (!prof) return;
  const session = (typeof currentUser === "function") ? currentUser() : null;
  if (session && session.token) {
    accountFetch("/api/profile/save", { token: session.token, profile: prof }).catch(() => {});
  }
}

function applyServerProfile(name, profile) {
  const local = getProfile(name) || { name: name };
  let merged = Object.assign({}, local, profile);
  merged.name = name;
  merged.wallet = profile.wallet || local.wallet || { gold: 0, small_potion: 0, big_potion: 0 };
  merged.wrongPool = profile.wrongPool || local.wrongPool || [];
  merged.badges = profile.badges || local.badges || {};
  // Поля складываем, а не заменяем: серверная копия может быть старше
  // локальной и тогда сотрёт счёт самоподготовки.
  merged.stats = Object.assign({}, local.stats || {}, profile.stats || {});
  merged.study = profile.study || local.study || { day: "", good: 0, total: 0, topics: {} };
  // Калибровка переезжает между компьютерами вместе с профилем. Дату
  // сравниваем, чтобы старый вход не затёр свежее прохождение.
  merged.knowledge = pickKnowledge(local.knowledge, profile.knowledge);
  // Амулеты — редкая валюта: берём большую из двух копий (серверная могла
  // отстать), но не выше потолка. Снаряжение — по приоритету сервера.
  const lhub = local.hub || { revive: 0, gear: [] };
  const shub = profile.hub || { revive: 0, gear: [] };
  const revive = Math.max(Number(lhub.revive) || 0, Number(shub.revive) || 0);
  merged.hub = {
    revive: Math.max(0, Math.min(HUB_AMULET_MAX, Math.floor(revive))),
    gear: Array.isArray(shub.gear) && shub.gear.length ? shub.gear
      : (Array.isArray(lhub.gear) ? lhub.gear : [])
  };
  // Прогрессия героя и деревни складывается только вверх — см. progressMerge.
  merged = Object.assign(merged, progressMerge(local, profile));
  putProfile(name, merged);
  return merged;
}

function badgesHtml(profile) {
  return ACHIEVEMENTS.map((a) => {
    const on = !!(profile.badges && profile.badges[a.id]);
    return "<span title='" + a.desc + "' style='display:inline-block;margin:2px 6px 2px 0;padding:3px 9px;" +
      "border-radius:999px;font-size:12px;border:1px solid " + (on ? "#f6c453" : "#334155") + ";" +
      "color:" + (on ? "#f6c453" : "#64748b") + "'>" + (on ? "★ " : "☆ ") + a.title + "</span>";
  }).join("");
}
