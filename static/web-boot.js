// Публичная веб-сборка (Itch.io): без Python-сервера, аккаунтов и панели
// учителя. Профиль и сохранения — в localStorage, проверка кода — Pyodide.
//
// Этот файл подключается после profile.js/auth.js и до game.js. Он не меняет
// серверную сборку: там window.__PYQUIZ_WEB не выставлен.
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  window.__PYQUIZ_WEB = true;
  window.__PYQUIZ_VERSION = { version: "1.6.0-web", date: "2026-10-21", commit: "" };
  window.__PYQUIZ_FEATURES = { code: true, dev: false, generatedCode: false };

  const saved = (typeof getLastName === "function" && getLastName()) || "Игрок";
  const session = (typeof getSession === "function") ? getSession() : null;
  const name = (session && session.name) || saved;
  // Токен сервера в публичной сборке не нужен и только мешал бы syncProfile.
  if (typeof setSession === "function") {
    setSession({ name: name, role: "student" }, "");
  }

  // Локальный «вход»: без PIN, сервера и сети. Этого достаточно для игры.
  window.registerAccount = function (localName) {
    const clean = String(localName || "").trim().slice(0, 60);
    if (!clean) return Promise.resolve({ ok: false, error: "Введите имя" });
    if (typeof setSession === "function") setSession({ name: clean, role: "student" }, "");
    if (typeof getProfile === "function") getProfile(clean);
    return Promise.resolve({ ok: true, user: { name: clean, role: "student" } });
  };
  window.loginAccount = function (localName) {
    return window.registerAccount(localName);
  };
  window.syncProfile = function () {};
  window.accountFetch = function () { return Promise.resolve({ ok: true }); };

  // Ссылки «в меню» в публичной сборке ведут на локальный index.html.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href="/"], a[href="/game"]').forEach(function (a) {
      a.setAttribute("href", a.getAttribute("href") === "/game" ? "index.html" : "index.html");
    });
    document.querySelectorAll("#nav-teacher, #nav-friends, #nav-profile").forEach(function (n) {
      n.style.display = "none";
    });

    // Подсказка для первого запуска на Itch.io. Не блокирует карту: её можно
    // закрыть, а после закрытия она не возвращается.
    try {
      if (!localStorage.getItem("pyquiz_web_hint")) {
        const hint = document.createElement("div");
        hint.id = "web-controls-hint";
        hint.style.cssText =
          "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:999;" +
          "max-width:min(92vw,560px);padding:8px 12px;border:1px solid #334155;" +
          "border-radius:10px;background:rgba(15,23,42,.94);color:#e2e8f0;" +
          "font:13px/1.35 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);" +
          "pointer-events:none;text-align:center";
        hint.innerHTML =
          "Стрелки/WASD — ходить · E — действие · Пробел — ждать " +
          "<button type='button' aria-label='Скрыть подсказку' " +
          "style='pointer-events:auto;margin-left:8px;border:0;background:transparent;" +
          "color:#94a3b8;font-size:16px;cursor:pointer'>×</button>";
        hint.querySelector("button").addEventListener("click", function () {
          try { localStorage.setItem("pyquiz_web_hint", "1"); } catch (e) {}
          hint.remove();
        });
        document.body.appendChild(hint);
      }
    } catch (e) {
      // localStorage может быть недоступен — подсказка не критична.
    }

    // «Продолжить поход» со стартового экрана: игра уже инициализирована,
    // поэтому просто просим её поднять сохранение.
    try {
      if (new URLSearchParams(window.location.search).get("resume") === "1") {
        setTimeout(function () {
          const api = window.__PYQUIZ_WEB_API;
          if (api && typeof api.resume === "function") api.resume();
          // Меню открыто поверх игры и должно показать «Поход продолжается»,
          // а не «Ты в деревне»: обновляем статус после загрузки этажа.
          if (window.PyMenu && typeof window.PyMenu.render === "function") {
            setTimeout(function () { window.PyMenu.render(); }, 800);
          }
        }, 500);
      }
    } catch (e) {}
  });
})();
