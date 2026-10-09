// Локальная авторизация: ученики и преподаватели.
// Данные хранятся только в браузере (localStorage).
const AUTH_KEY = "pyquiz_accounts_v1";
const SESSION_KEY = "pyquiz_session_v1";

function _hashPass(pass) {
  let h = 5381;
  const s = "pyquiz::" + String(pass);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const d = raw ? JSON.parse(raw) : null;
    return d && typeof d === "object" ? d : {};
  } catch (e) {
    return {};
  }
}

function saveAccounts(all) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(all)); } catch (e) {}
}

function registerAccount(name, pass, role) {
  name = String(name || "").trim();
  role = role === "teacher" ? "teacher" : "student";
  if (!name) return { ok: false, error: "Введите имя" };
  if (String(pass).length < 3) return { ok: false, error: "Пароль минимум 3 символа" };
  const key = name.toLowerCase();
  const all = loadAccounts();
  if (all[key]) return { ok: false, error: "Такое имя уже занято" };
  all[key] = { name, pass: _hashPass(pass), role, created: new Date().toISOString() };
  saveAccounts(all);
  if (typeof getProfile === "function") getProfile(name); // создаёт профиль
  return { ok: true, user: { name, role } };
}

function loginAccount(name, pass, role) {
  name = String(name || "").trim();
  const key = name.toLowerCase();
  const all = loadAccounts();
  const acc = all[key];
  if (!acc) return { ok: false, error: "Аккаунт не найден" };
  if (acc.pass !== _hashPass(pass)) return { ok: false, error: "Неверный пароль" };
  if (role && acc.role !== role) return { ok: false, error: "Другая роль у аккаунта" };
  setSession(acc.name, acc.role);
  return { ok: true, user: { name: acc.name, role: acc.role } };
}

function setSession(name, role) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ name, role })); } catch (e) {}
  if (typeof setLastName === "function") setLastName(name);
}

function currentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function accountsByRole(role) {
  const all = loadAccounts();
  return Object.keys(all)
    .map((k) => all[k])
    .filter((a) => !role || a.role === role);
}
