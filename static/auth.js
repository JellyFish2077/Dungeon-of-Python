// Аккаунты на сервере: вход по имени и PIN, токен сессии.
// Профиль хранится и на сервере (users.json), и локально для статистики игры.
const SESSION_KEY = "pyquiz_session_v1";

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(user, token) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name: user.name, role: user.role || "student", token: token
    }));
  } catch (e) {}
  if (typeof setLastName === "function") setLastName(user.name);
}

function currentUser() {
  return getSession();
}

function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function isTeacher() {
  const u = currentUser();
  return !!u && u.role === "teacher";
}

function authPost(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then((r) => r.json());
}

function registerAccount(name, pass) {
  name = String(name || "").trim();
  if (!name) return Promise.resolve({ ok: false, error: "Введите имя" });
  if (String(pass).length < 3) return Promise.resolve({ ok: false, error: "PIN минимум 3 символа" });
  const prof = typeof getProfile === "function" ? getProfile(name) : {};
  return authPost("/api/register", { name: name, pin: pass, profile: prof })
    .then((res) => {
      if (!res.ok) return res;
      setSession(res.user, res.token);
      if (typeof applyServerProfile === "function") applyServerProfile(res.user.name, res.profile || {});
      return { ok: true, user: res.user };
    })
    .catch(() => ({ ok: false, error: "Сервер недоступен" }));
}

function loginAccount(name, pass) {
  name = String(name || "").trim();
  return authPost("/api/login", { name: name, pin: pass })
    .then((res) => {
      if (!res.ok) return res;
      setSession(res.user, res.token);
      if (typeof applyServerProfile === "function") applyServerProfile(res.user.name, res.profile || {});
      return { ok: true, user: res.user };
    })
    .catch(() => ({ ok: false, error: "Сервер недоступен" }));
}

// Показывает пункт «Панель учителя» в навигации только преподавателю.
function initNavAuth() {
  const nav = document.getElementById("nav-teacher");
  if (!nav) return;
  nav.style.display = isTeacher() ? "" : "none";
  const logged = !!currentUser();
  const plink = document.getElementById("nav-profile");
  if (plink) plink.style.display = logged ? "" : "none";
  const flink = document.getElementById("nav-friends");
  if (flink) flink.style.display = logged ? "" : "none";
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavAuth);
  } else {
    initNavAuth();
  }
}
