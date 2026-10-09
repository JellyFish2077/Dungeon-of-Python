// Единый профиль ученика для квиза, учёбы и подземелья.
// Хранится локально в браузере. Кошелёк наград тратится в подземелье.
const PROFILE_KEY = "pyquiz_profiles_v1";
const LAST_NAME_KEY = "pyquiz_last_name";

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
      dungeonBest: null,
      wrongPool: [],
      badges: {},
      stats: { correct: 0, codeSolved: 0, runs: 0, days: [] }
    };
    saveProfiles(all);
  }
  const p = all[key];
  if (!p.wrongPool) p.wrongPool = [];
  if (!p.badges) p.badges = {};
  if (!p.stats) p.stats = { correct: 0, codeSolved: 0, runs: 0, days: [] };
  return p;
}

function putProfile(name, profile) {
  const key = profileKey(name);
  if (!key) return;
  const all = loadProfiles();
  all[key] = profile;
  saveProfiles(all);
}

function rewardForRun(percent, mode) {
  const mult = mode === "practice" ? 0.5 : 1;
  return {
    gold: Math.round(percent * mult),
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

// --- Серверные аккаунты (логин по имени + PIN, синхронизация профиля) ---
const PIN_KEY = "pyquiz_pin";

function getPin() {
  try { return localStorage.getItem(PIN_KEY) || ""; } catch (e) { return ""; }
}
function setPin(pin) {
  try { if (pin) localStorage.setItem(PIN_KEY, pin); else localStorage.removeItem(PIN_KEY); } catch (e) {}
}

function accountFetch(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then((r) => r.json());
}

function serverRegister(name, pin, profile) {
  return accountFetch("/api/register", { name: name, pin: pin, profile: profile || {} });
}
function serverLogin(name, pin) {
  return accountFetch("/api/login", { name: name, pin: pin });
}
function serverSave(name, pin, profile) {
  return accountFetch("/api/profile/save", { name: name, pin: pin, profile: profile });
}

// Сохранить текущий профиль на сервер, если вход выполнен. Без ожидания.
function syncProfile(name) {
  const pin = getPin();
  if (!pin || !name) return;
  const prof = getProfile(name);
  if (prof) serverSave(name, pin, prof).catch(() => {});
}

function applyServerProfile(name, profile) {
  const local = getProfile(name) || { name: name };
  const merged = Object.assign({}, local, profile);
  merged.name = name;
  merged.wallet = profile.wallet || local.wallet || { gold: 0, small_potion: 0, big_potion: 0 };
  merged.wrongPool = profile.wrongPool || local.wrongPool || [];
  merged.badges = profile.badges || local.badges || {};
  merged.stats = profile.stats || local.stats || { correct: 0, codeSolved: 0, runs: 0, days: [] };
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
