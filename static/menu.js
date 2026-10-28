// Классическое главное меню PyDungeon.
//
// Два режима одного оверлея: главное меню (непрозрачное, без карты) и пауза
// (поверх приглушённой игры). В главном — «Новая игра», «Загрузить»,
// «Настройки», «Профиль», «Об игре», «Выход»; в паузе — «Продолжить»,
// «Сохранить», «Загрузить», «Настройки», «Выход в Меню». Настройки, профиль
// и справка — такие же пункты списка, а не отдельные кнопки. Меню живёт поверх
// уже загруженной игры, поэтому классная и публичная сборки используют один
// экран; различается только способ входа (PIN или локальное имя).
//
// Модуль не знает внутренностей игры: состояние, продолжение, новую игру и
// выход он спрашивает у window.PyGameMenuAPI, который выставляет game.js.
(function () {
  "use strict";

  const SETTINGS_KEY = "pyquiz_settings_v1";
  const AUTOPLAY_KEY = "pyquiz_menu_autoplay";
  const DEFAULTS = { sound: true, volume: 0.6, reduceMotion: false };

  let settings = loadSettings();
  let inited = false;
  let isOpen = false;
  let view = "main";
  let mode = "main";
  let returnView = "main";
  let editingName = false;
  let focusBefore = null;
  let activeItem = null;

  function $(id) {
    return document.getElementById(id);
  }

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ESC[ch]);
  }

  function isWeb() {
    return !!(typeof window !== "undefined" && window.__PYQUIZ_WEB);
  }

  function current() {
    try {
      return typeof currentUser === "function" ? currentUser() : null;
    } catch (e) {
      return null;
    }
  }

  function hasUser() {
    return !!current();
  }

  function api() {
    return typeof window !== "undefined" ? window.PyGameMenuAPI : null;
  }

  function sound(name) {
    if (typeof window === "undefined" || !window.PySound) return;
    try {
      window.PySound.play(name);
    } catch (e) {
      // Звук — необязательная часть: ошибка аудио не должна ломать меню.
    }
  }

  function clampVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULTS.volume;
    return Math.max(0, Math.min(1, n));
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const data = raw ? JSON.parse(raw) : null;
      const out = Object.assign({}, DEFAULTS);
      if (data && typeof data === "object") {
        if (typeof data.sound === "boolean") out.sound = data.sound;
        if (data.volume != null) out.volume = clampVolume(data.volume);
        if (typeof data.reduceMotion === "boolean") out.reduceMotion = data.reduceMotion;
      }
      return out;
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      // Приватный режим может запрещать localStorage — настройки просто
      // не переживут перезагрузку, меню продолжает работать.
    }
    applySettings();
  }

  function applySettings() {
    if (typeof document === "undefined" || !document.body) return;
    document.body.classList.toggle("reduce-motion", !!settings.reduceMotion);
    const soundBox = $("set-sound");
    if (soundBox) soundBox.checked = settings.sound !== false;
    const volume = $("set-volume");
    if (volume) {
      volume.value = String(Math.round(settings.volume * 100));
      volume.disabled = settings.sound === false;
    }
    const out = $("set-volume-out");
    if (out) out.textContent = Math.round(settings.volume * 100) + "%";
    const motion = $("set-motion");
    if (motion) motion.checked = !!settings.reduceMotion;
  }

  function savedName() {
    try {
      return typeof getLastName === "function" ? (getLastName() || "") : "";
    } catch (e) {
      return "";
    }
  }

  function query(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function takeAutoplay() {
    try {
      const on = sessionStorage.getItem(AUTOPLAY_KEY) === "1";
      sessionStorage.removeItem(AUTOPLAY_KEY);
      return on;
    } catch (e) {
      return false;
    }
  }

  function setAutoplay() {
    try {
      sessionStorage.setItem(AUTOPLAY_KEY, "1");
    } catch (e) {
      // Без sessionStorage просто вернёмся в меню после перезагрузки.
    }
  }

  function showError(text) {
    const box = $("menu-error");
    if (box) box.textContent = text || "";
  }

  function afterAuth() {
    setAutoplay();
    window.location.reload();
  }

  function renderVersion() {
    const info = typeof window !== "undefined" ? window.__PYQUIZ_VERSION : null;
    if (!info || !info.version) return;
    const text = "v" + info.version;
    document.querySelectorAll("[data-app-version]").forEach((node) => {
      if (node.textContent) return;
      node.textContent = text;
      node.title = "Версия " + info.version + (info.date ? " от " + info.date : "");
    });
  }

  function gameStatus() {
    try {
      return api() && typeof api().status === "function" ? api().status() : null;
    } catch (e) {
      return null;
    }
  }

  // ---------- Вертикальное меню и клавиатура ----------

  function mainItems() {
    const list = document.querySelectorAll("#menu-list .menu-item");
    return Array.prototype.slice.call(list).filter((node) =>
      !node.classList.contains("hidden") && !node.classList.contains("is-disabled")
    );
  }

  function pauseItems() {
    const list = document.querySelectorAll("#pause-list .menu-item");
    return Array.prototype.slice.call(list).filter((node) =>
      !node.classList.contains("hidden") && !node.classList.contains("is-disabled")
    );
  }

  function activeItems() {
    return mode === "pause" && view === "pause" ? pauseItems() : mainItems();
  }

  function setActive(item, focus) {
    document.querySelectorAll("#menu-list .menu-item, #pause-list .menu-item")
      .forEach((node) => node.classList.toggle("is-active", node === item));
    activeItem = item;
    if (focus && item && typeof item.focus === "function") {
      try { item.focus(); } catch (e) {}
    }
  }

  function ensureActive() {
    const list = activeItems();
    if (!list.includes(activeItem)) setActive(list[0] || null, false);
  }

  function moveActive(delta) {
    const list = activeItems();
    if (!list.length) return;
    let index = list.indexOf(activeItem);
    if (index < 0) index = delta > 0 ? -1 : 0;
    const next = list[(index + delta + list.length) % list.length];
    setActive(next, true);
  }

  function isTypingTarget(node) {
    if (!node) return false;
    const tag = String(node.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!node.isContentEditable;
  }

  function focusables() {
    const box = $("menu-overlay");
    if (!box) return [];
    return Array.prototype.slice.call(box.querySelectorAll(
      "button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])"
    )).filter((node) => node.offsetParent !== null || node === document.activeElement);
  }

  function focusLater(node) {
    if (!node) return;
    setTimeout(() => {
      try { node.focus(); } catch (e) {}
    }, 30);
  }

  function setView(name) {
    view = name;
    const screen = $("menu-screen");
    if (screen) screen.dataset.view = name;
    const views = {
      main: $("menu-view-main"),
      pause: $("menu-view-pause"),
      settings: $("menu-view-settings"),
      account: $("menu-view-account"),
      about: $("menu-view-about")
    };
    Object.keys(views).forEach((key) => {
      if (views[key]) views[key].classList.toggle("hidden", key !== name);
    });

    if (name === "main") {
      renderMain();
      ensureActive();
      setActive(activeItem || mainItems()[0] || null, true);
      return;
    }
    if (name === "pause") {
      renderPause();
      ensureActive();
      setActive(activeItem || pauseItems()[0] || null, true);
      return;
    }
    if (name === "account") {
      renderAccountView();
      focusLater($("menu-name") || $("menu-back-account"));
      return;
    }
    if (name === "settings") {
      applySettings();
      updateFullscreenLabel();
      focusLater($("menu-back-settings") || $("set-sound"));
      return;
    }
    if (name === "about") {
      renderVersion();
      focusLater($("menu-back-about"));
    }
  }

  // ---------- Главный экран ----------

  function renderNew() {
    const item = $("menu-new");
    if (!item) return;
    const note = $("menu-new-note");
    const state = gameStatus();
    const battle = !!(state && state.battle);
    item.classList.toggle("is-disabled", battle);
    item.setAttribute("aria-disabled", battle ? "true" : "false");
    if (note) {
      if (!hasUser()) note.textContent = "сначала войди";
      else if (battle) note.textContent = "сначала заверши бой";
      else note.textContent = "стража у входа";
    }
  }

  function renderLoad() {
    const item = $("menu-load");
    if (!item) return;
    const state = gameStatus();
    const note = $("menu-load-note");
    const can = hasUser() && !!state;
    item.classList.toggle("is-disabled", !can);
    item.setAttribute("aria-disabled", can ? "false" : "true");
    if (!note) return;
    if (!hasUser()) {
      note.textContent = "сначала войди";
    } else if (!state) {
      note.textContent = "игра ещё грузится";
    } else {
      note.textContent = "ячейки сохранений";
    }
  }

  function renderProfile() {
    const note = $("menu-profile-note");
    if (!note) return;
    const user = current();
    if (!user) note.textContent = "гость";
    else if (isWeb()) note.textContent = "локальный профиль";
    else note.textContent = user.role === "teacher" ? "преподаватель" : "ученик";
  }

  function renderMain() {
    renderNew();
    renderLoad();
    renderProfile();
    renderVersion();
    ensureActive();
  }

  function renderPause() {
    const state = gameStatus();
    const load = $("pause-load");
    const note = $("pause-load-note");
    const can = !!state;
    if (load) {
      load.classList.toggle("is-disabled", !can);
      load.setAttribute("aria-disabled", can ? "false" : "true");
    }
    if (note) {
      note.textContent = can ? "ячейки сохранений" : "игра ещё грузится";
    }
  }

  function render() {
    renderMain();
    renderAccountView();
    renderPause();
    applySettings();
    updateFullscreenLabel();
    renderVersion();
    if (view === "main" || view === "pause") ensureActive();
  }

  // ---------- Экран аккаунта ----------

  function renderAccountView() {
    const panel = $("menu-account-panel");
    if (!panel) return;
    const user = current();
    if (user && !(isWeb() && editingName)) {
      const initial = String(user.name || "?").slice(0, 1).toUpperCase();
      const role = isWeb()
        ? "локальный профиль"
        : user.role === "teacher" ? "преподаватель" : "ученик";
      const teacher = !isWeb() && typeof isTeacher === "function" && isTeacher();
      panel.innerHTML =
        "<div class='menu-profile'>" +
        "<div class='menu-avatar' aria-hidden='true'>" + esc(initial) + "</div>" +
        "<div class='menu-profile-text'><b>" + esc(user.name) + "</b>" +
        "<span>" + role + "</span></div>" +
        "</div>" +
        "<div class='menu-profile-actions'>" +
        (isWeb()
          ? "<button class='menu-btn' id='menu-edit-name' type='button'>Изменить имя</button>"
          : "<button class='menu-btn' id='menu-logout' type='button'>Сменить игрока</button>") +
        (teacher
          ? "<a class='menu-btn ghost' href='/results'>Панель учителя</a>"
          : "") +
        "</div>" +
        "<p class='menu-note'>" +
        (isWeb()
          ? "Профиль и сохранения хранятся в этом браузере."
          : "Профиль и уровень знаний синхронизируются с сервером.") +
        "</p>";
      const edit = $("menu-edit-name");
      if (edit) {
        edit.addEventListener("click", () => {
          editingName = true;
          renderAccountView();
          focusLater($("menu-name"));
        });
      }
      const out = $("menu-logout");
      if (out) out.addEventListener("click", onLogout);
      return;
    }
    if (isWeb()) {
      renderWebNameForm(panel, user);
    } else {
      renderLoginForm(panel);
    }
  }

  function renderWebNameForm(box, user) {
    const value = user ? user.name : savedName();
    box.innerHTML =
      "<form class='menu-form' id='menu-name-form' novalidate>" +
      "<label class='menu-field' for='menu-name'>Как тебя зовут?</label>" +
      "<input class='menu-input' id='menu-name' maxlength='60' autocomplete='nickname'" +
      " placeholder='Игрок' value='" + esc(value) + "' />" +
      "<div class='menu-row'>" +
      "<button class='menu-btn primary' id='menu-name-save' type='submit'>Сохранить имя</button>" +
      (user ? "<button class='menu-btn ghost' id='menu-name-cancel' type='button'>Отмена</button>" : "") +
      "</div>" +
      "<p class='menu-error' id='menu-error'></p>" +
      "</form>";
    const form = $("menu-name-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitName();
      });
    }
    const cancel = $("menu-name-cancel");
    if (cancel) {
      cancel.addEventListener("click", () => {
        editingName = false;
        renderAccountView();
        focusLater($("menu-edit-name"));
      });
    }
  }

  function renderLoginForm(box) {
    box.innerHTML =
      "<form class='menu-form' id='menu-auth-form' novalidate>" +
      "<label class='menu-field' for='menu-name'>Имя</label>" +
      "<input class='menu-input' id='menu-name' maxlength='60' autocomplete='username'" +
      " placeholder='Имя и фамилия' />" +
      "<label class='menu-field' for='menu-pin'>PIN</label>" +
      "<input class='menu-input' id='menu-pin' type='password' maxlength='40'" +
      " autocomplete='current-password' placeholder='Минимум 3 символа' />" +
      "<div class='menu-row'>" +
      "<button class='menu-btn primary' id='menu-login' type='submit'>Войти</button>" +
      "<button class='menu-btn ghost' id='menu-register' type='button'>Создать аккаунт</button>" +
      "</div>" +
      "<p class='menu-error' id='menu-error'></p>" +
      "</form>";
    const form = $("menu-auth-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitAuth(false);
      });
    }
    const register = $("menu-register");
    if (register) register.addEventListener("click", () => submitAuth(true));
  }

  function onLogout() {
    if (!window.confirm("Выйти из аккаунта? Поход сохранится.")) return;
    if (typeof logout === "function") logout();
    editingName = false;
    try {
      sessionStorage.removeItem(AUTOPLAY_KEY);
    } catch (e) {}
    window.location.reload();
  }

  function submitName() {
    const input = $("menu-name");
    const name = String((input && input.value) || "").trim().slice(0, 60) || "Игрок";
    sound("click");
    const user = current();
    // В веб-сборке профиль, сейв и метка места лежат под именем. Без переноса
    // «Изменить имя» создаёт пустой профиль, а поход остаётся под старым.
    if (isWeb() && user && typeof renameProfile === "function") {
      const moved = renameProfile(user.name, name);
      if (!moved || !moved.ok) {
        showError((moved && moved.error) || "Не удалось переименовать профиль");
        sound("wrong");
        return;
      }
    }
    if (typeof registerAccount !== "function") {
      afterAuth();
      return;
    }
    registerAccount(name)
      .then((res) => {
        if (!res || !res.ok) {
          showError((res && res.error) || "Не получилось сохранить имя");
          sound("wrong");
          return;
        }
        editingName = false;
        sound("correct");
        afterAuth();
      })
      .catch(() => {
        showError("Не удалось сохранить имя");
        sound("wrong");
      });
  }

  function submitAuth(register) {
    const nameEl = $("menu-name");
    const pinEl = $("menu-pin");
    const name = String((nameEl && nameEl.value) || "").trim().slice(0, 60);
    const pin = String((pinEl && pinEl.value) || "");
    if (!name) {
      showError("Введи имя");
      if (nameEl) nameEl.focus();
      return;
    }
    if (pin.length < 3) {
      showError("PIN минимум 3 символа");
      if (pinEl) pinEl.focus();
      return;
    }
    sound("click");
    showError("Проверяем…");
    const fn = register ? registerAccount : loginAccount;
    if (typeof fn !== "function") {
      showError("Вход недоступен");
      return;
    }
    fn(name, pin)
      .then((res) => {
        if (!res || !res.ok) {
          showError((res && res.error) || "Не получилось");
          sound("wrong");
          return;
        }
        sound("correct");
        afterAuth();
      })
      .catch(() => {
        showError("Сервер недоступен");
        sound("wrong");
      });
  }

  // ---------- Действия меню ----------

  function onNew() {
    sound("click");
    if (!hasUser()) {
      setView("account");
      return;
    }
    const state = gameStatus();
    if (state && state.battle) return;
    const game = api();
    if (game && typeof game.newRun === "function") {
      let ok = true;
      try {
        ok = game.newRun();
      } catch (e) {
        ok = false;
      }
      // Не закрываем меню, если игра не смогла открыть стража: иначе игрок
      // остался бы в пустой деревне без окна спуска.
      if (ok === false) return;
    }
    // Стража открывает newRun(); меню закрываем после, чтобы close() не успел
    // вернуть фокус раньше окна стража.
    close();
  }

  function openSaves(nextMode) {
    if (!hasUser()) {
      setView("account");
      return false;
    }
    if (window.PySaves && typeof window.PySaves.open === "function") {
      return window.PySaves.open({ mode: nextMode });
    }
    sound("wrong");
    return false;
  }

  function onLoad() {
    sound("click");
    openSaves("load");
  }

  function onExit() {
    sound("click");
    const game = api();
    if (game && typeof game.leave === "function") {
      try { game.leave(); } catch (e) {}
      return;
    }
    window.location.href = isWeb() ? "index.html?exit=1" : "/";
  }

  function openSub(name) {
    returnView = mode === "pause" ? "pause" : "main";
    setView(name);
  }

  function onPauseSave() {
    sound("click");
    openSaves("save");
  }

  function onPauseLoad() {
    sound("click");
    openSaves("load");
  }

  function onPauseExit() {
    sound("click");
    const game = api();
    if (game && typeof game.save === "function") {
      try { game.save(); } catch (e) {}
    }
    // Поход остаётся на паузе за непрозрачным главным меню; «Загрузить»
    // в нём сразу доступна.
    mode = "main";
    setMode("main");
  }

  function activateAction(action) {
    switch (action) {
      case "new": onNew(); break;
      case "load": onLoad(); break;
      case "codex":
        sound("click");
        if (window.PyCodex && typeof window.PyCodex.open === "function") window.PyCodex.open();
        break;
      case "updates":
        sound("click");
        if (window.PyUpdates && typeof window.PyUpdates.open === "function") window.PyUpdates.open();
        break;
      case "settings": sound("click"); openSub("settings"); break;
      case "profile": sound("click"); openSub("account"); break;
      case "about": sound("click"); openSub("about"); break;
      case "exit": onExit(); break;
      default: break;
    }
  }

  function activatePause(action) {
    switch (action) {
      case "resume": sound("click"); close(); break;
      case "save": onPauseSave(); break;
      case "load": onPauseLoad(); break;
      case "settings": sound("click"); openSub("settings"); break;
      case "codex":
        sound("click");
        if (window.PyCodex && typeof window.PyCodex.open === "function") window.PyCodex.open();
        break;
      case "exit": onPauseExit(); break;
      default: break;
    }
  }

  // ---------- Открытие и закрытие ----------

  function setMode(next) {
    mode = next === "pause" ? "pause" : "main";
    const box = $("menu-overlay");
    if (box) {
      box.classList.toggle("menu-main", mode === "main");
      box.classList.toggle("menu-pause", mode === "pause");
      box.dataset.mode = mode;
    }
    const screen = $("menu-screen");
    if (screen) screen.dataset.mode = mode;
    if (window.PyMenuBackground) {
      try {
        if (mode === "main" && isOpen) window.PyMenuBackground.show();
        else window.PyMenuBackground.hide();
      } catch (e) {}
    }
    if (mode === "pause") {
      const note = $("pause-note");
      if (note) note.textContent = "Поход сохраняется автоматически.";
    }
    activeItem = null;
    view = mode === "pause" ? "pause" : "main";
    render();
    setView(view);
  }

  function openMode(next) {
    init();
    const box = $("menu-overlay");
    if (!box) return;
    if (isOpen) {
      setMode(next);
      return;
    }
    focusBefore = document.activeElement;
    isOpen = true;
    editingName = false;
    activeItem = null;
    box.classList.remove("hidden");
    document.body.classList.add("menu-open");
    const stage = $("stage");
    if (stage) stage.setAttribute("aria-hidden", "true");
    setMode(next);
  }

  function openMain() {
    openMode("main");
  }

  function openPause() {
    const state = gameStatus();
    if (state && state.battle) return;
    openMode("pause");
  }

  // Совместимость со старым вызовом: открыть главное меню.
  function open() {
    openMain();
  }

  function close() {
    const box = $("menu-overlay");
    if (!isOpen || !box) return;
    isOpen = false;
    mode = "main";
    view = "main";
    editingName = false;
    box.classList.add("hidden");
    box.classList.remove("menu-main", "menu-pause");
    if (window.PyMenuBackground) {
      try { window.PyMenuBackground.hide(); } catch (e) {}
    }
    document.body.classList.remove("menu-open");
    const stage = $("stage");
    if (stage) stage.removeAttribute("aria-hidden");
    if (focusBefore && typeof focusBefore.focus === "function") {
      try { focusBefore.focus(); } catch (e) {}
    }
    focusBefore = null;
  }

  function boot() {
    init();
    render();
    const forced = query("menu") === "1";
    const play = query("play") === "1";
    const autoplay = takeAutoplay();
    // После входа страница перезагружается: не показываем меню второй раз,
    // если игрок уже нажал «Играть» или пришёл со стартового экрана веб-сборки.
    if (hasUser() && !forced && (autoplay || play)) return;
    openMain();
  }

  // ---------- Клавиатура ----------

  function onKey(e) {
    if (!isOpen) return;
    // Меню сохранений — отдельный модальный слой: его Esc/Tab не должны
    // закрывать паузу или главное меню под ним.
    if (window.PySaves && typeof window.PySaves.isOpen === "function" &&
        window.PySaves.isOpen()) {
      return;
    }

    if (e.key === "Tab") {
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const box = $("menu-overlay");
      const active = document.activeElement;
      if (!box || !box.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    if (view === "pause") {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(e.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }

    if (view !== "main") {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (view === "account" && editingName) {
        editingName = false;
        renderAccountView();
        focusLater($("menu-edit-name"));
        return;
      }
      setView(returnView || "main");
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (isTypingTarget(e.target)) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(e.key === "ArrowDown" ? 1 : -1);
    }
  }

  // ---------- Привязки ----------

  function bind() {
    const list = $("menu-list");
    if (list) {
      list.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".menu-item") : null;
        if (!item || item.classList.contains("is-disabled")) return;
        e.preventDefault();
        activateAction(item.dataset.action);
      });
      list.addEventListener("mousemove", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".menu-item") : null;
        if (!item || item.classList.contains("hidden") || item.classList.contains("is-disabled")) return;
        if (item !== activeItem) setActive(item, false);
      });
    }

    const pauseList = $("pause-list");
    if (pauseList) {
      pauseList.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".menu-item") : null;
        if (!item || item.classList.contains("is-disabled")) return;
        e.preventDefault();
        activatePause(item.dataset.pause);
      });
      pauseList.addEventListener("mousemove", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".menu-item") : null;
        if (!item || item.classList.contains("hidden") || item.classList.contains("is-disabled")) return;
        if (item !== activeItem) setActive(item, false);
      });
    }

    // Tab ходит по списку, а когда фокус уходит в подэкран, золотая строка
    // списка снимается: иначе на экране два акцента.
    const overlay = $("menu-overlay");
    if (overlay) {
      overlay.addEventListener("focusin", (e) => {
        const target = e.target;
        const item = target && target.closest
          ? target.closest("#menu-list .menu-item, #pause-list .menu-item") : null;
        if (item) setActive(item, false);
      });
    }

    ["settings", "account", "about"].forEach((name) => {
      const back = $("menu-back-" + name);
      if (back) {
        back.addEventListener("click", () => {
          sound("click");
          editingName = false;
          setView(returnView || "main");
        });
      }
    });

    const soundBox = $("set-sound");
    if (soundBox) {
      soundBox.addEventListener("change", (e) => {
        settings.sound = !!e.target.checked;
        saveSettings();
        if (settings.sound) sound("click");
      });
    }
    const volume = $("set-volume");
    if (volume) {
      volume.addEventListener("input", (e) => {
        settings.volume = clampVolume(Number(e.target.value) / 100);
        saveSettings();
      });
      volume.addEventListener("change", () => {
        if (settings.sound) sound("click");
      });
    }
    const motion = $("set-motion");
    if (motion) {
      motion.addEventListener("change", (e) => {
        settings.reduceMotion = !!e.target.checked;
        saveSettings();
      });
    }
    const fullscreen = $("set-fullscreen");
    if (fullscreen) fullscreen.addEventListener("click", toggleFullscreen);
    const hints = $("set-reset-hints");
    if (hints) hints.addEventListener("click", resetHints);
    document.addEventListener("fullscreenchange", updateFullscreenLabel);
    document.addEventListener("keydown", onKey);
    window.addEventListener("storage", (e) => {
      if (e.key === SETTINGS_KEY) {
        settings = loadSettings();
        applySettings();
      }
    });
  }

  function updateFullscreenLabel() {
    const btn = $("set-fullscreen");
    if (!btn) return;
    if (!document.fullscreenEnabled) {
      btn.classList.add("hidden");
      return;
    }
    btn.classList.remove("hidden");
    btn.textContent = document.fullscreenElement
      ? "Выйти из полного экрана" : "На весь экран";
  }

  function toggleFullscreen() {
    sound("click");
    if (window.PyFullscreen) {
      window.PyFullscreen.toggle();
      return;
    }
    try {
      if (document.fullscreenElement) {
        const p = document.exitFullscreen();
        if (p && p.catch) p.catch(() => {});
      } else {
        const p = document.documentElement.requestFullscreen({ navigationUI: "hide" });
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {
      // Встроенные браузеры могут запрещать Fullscreen API — игра остаётся
      // в обычном окне.
    }
  }

  function resetHints() {
    sound("click");
    try {
      localStorage.removeItem("pyquiz_web_hint");
      localStorage.removeItem("pyquiz_hud_collapsed");
    } catch (e) {}
    const note = $("set-note");
    if (note) {
      note.textContent = "Подсказки и вид панели сброшены: после перезагрузки они вернутся к обычным.";
    }
  }

  function init() {
    if (inited) return;
    inited = true;
    bind();
    applySettings();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // game.js зовёт boot() после загрузки деревни или продолжения похода.
  // isOpen() нужен игре, чтобы не пропускать ходы и клавиши под меню.
  window.PyMenu = {
    boot: boot,
    open: open,
    openMain: openMain,
    openPause: openPause,
    close: close,
    isOpen: () => isOpen,
    render: render
  };
})();
