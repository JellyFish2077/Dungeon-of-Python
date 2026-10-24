// Публичная веб-сборка (Itch.io): без Python-сервера, аккаунтов и панели
// учителя. Профиль и сохранения — в localStorage, проверка кода — Pyodide.
//
// Этот файл подключается после profile.js/auth.js и до game.js. Он не меняет
// серверную сборку: там window.__PYQUIZ_WEB не выставлен.
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  window.__PYQUIZ_WEB = true;
  window.__PYQUIZ_VERSION = { version: "1.7.2-web", date: "2026-10-24", commit: "" };
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

    // Подсказки управления больше не висят поверх карты: они живут
    // в «Справочнике» главного меню и паузы.

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
