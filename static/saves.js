// Сохранения PyDungeon: список ячеек и карточка выбранной.
//
// Меню не хранит игровое состояние само: снимок делает PyGameMenuAPI
// (buildSaveData / captureSnapshot), а здесь только localStorage, названия,
// скриншоты и кнопки. Поэтому одинаково работает в деревне и в подземелье.
(function () {
  "use strict";

  const SLOT_COUNT = 3;
  const KEY_PREFIX = "pyquiz_save_slots_v1";

  let inited = false;
  let isOpen = false;
  let mode = "save";
  let slots = [];
  let selected = 0;
  let renaming = -1;
  let focusBefore = null;

  function $(id) {
    return typeof document !== "undefined" ? document.getElementById(id) : null;
  }

  function user() {
    try {
      return typeof currentUser === "function" ? currentUser() : null;
    } catch (e) {
      return null;
    }
  }

  function userName() {
    const u = user();
    return u && u.name ? String(u.name) : "";
  }

  function api() {
    return typeof window !== "undefined" ? window.PyGameMenuAPI : null;
  }

  function sound(name) {
    if (!window.PySound) return;
    try { window.PySound.play(name); } catch (e) {}
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function storageKey() {
    const me = userName();
    return me ? KEY_PREFIX + ":" + me : KEY_PREFIX;
  }

  function emptySlots() {
    return new Array(SLOT_COUNT).fill(null);
  }

  function normalize(raw) {
    let data = null;
    try { data = JSON.parse(raw || "null"); } catch (e) {}
    const out = emptySlots();
    if (!Array.isArray(data)) return out;
    for (let i = 0; i < SLOT_COUNT; i += 1) {
      const item = data[i];
      if (item && item.snapshot && item.snapshot.v === 1) out[i] = item;
    }
    return out;
  }

  function readSlots() {
    if (!userName()) return emptySlots();
    let raw = null;
    try { raw = localStorage.getItem(storageKey()); } catch (e) {}
    if (raw !== null) return normalize(raw);
    // Первый запуск: переносим старый одиночный сейв/деревню в первую ячейку.
    slots = emptySlots();
    const legacy = api() && typeof api().exportLegacy === "function"
      ? api().exportLegacy() : null;
    if (legacy) {
      slots[0] = makeSlot(legacy, "Сохранение 1", 0);
    }
    persist(true);
    return slots;
  }

  function persist(quiet) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(slots));
      return true;
    } catch (e) {
      if (!quiet) setStatus("Не хватает места в браузере для сохранения.", "error");
      return false;
    }
  }

  function makeSlot(snapshot, name, index) {
    const now = Date.now();
    return {
      id: "slot-" + (index + 1),
      name: name || "Сохранение " + (index + 1),
      createdAt: now,
      updatedAt: now,
      snapshot: snapshot
    };
  }

  function slotMeta(slot) {
    const s = slot && slot.snapshot ? slot.snapshot : {};
    const meta = s.meta || {};
    if (s.kind === "dungeon") {
      return "Этаж " + (meta.floor || 1) + " · " + (meta.gold || 0) + " зол.";
    }
    return "Деревня · " + (meta.gold || 0) + " зол.";
  }

  function slotKind(slot) {
    return slot && slot.snapshot && slot.snapshot.kind === "dungeon"
      ? "Поход" : "Деревня";
  }

  function slotDate(slot) {
    const stamp = slot && (slot.updatedAt || slot.createdAt);
    if (!stamp) return "";
    try {
      return new Date(stamp).toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  }

  function shot(slot) {
    return slot && slot.snapshot && slot.snapshot.thumb ? slot.snapshot.thumb : "";
  }

  function setStatus(text, kind) {
    const box = $("saves-status");
    if (!box) return;
    box.textContent = text || "";
    box.classList.toggle("is-error", kind === "error");
    box.classList.toggle("is-ok", kind === "ok");
  }

  function renderList() {
    const list = $("saves-list");
    if (!list) return;
    list.innerHTML = "";
    slots.forEach((slot, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "save-slot" + (slot ? "" : " is-empty") +
        (slot && index === selected ? " is-selected" : "");
      btn.dataset.slot = String(index);
      if (!slot) {
        btn.innerHTML =
          '<span class="save-slot-plus" aria-hidden="true">+</span>' +
          '<span class="save-slot-write">Записать новое сохранение</span>' +
          '<span class="save-slot-num">Ячейка ' + (index + 1) + '</span>';
      } else {
        const thumb = shot(slot);
        btn.innerHTML =
          (thumb
            ? '<img class="save-slot-shot" src="' + esc(thumb) + '" alt="">'
            : '<span class="save-slot-shot save-slot-fallback">' +
              esc(slotKind(slot)) + '</span>') +
          '<span class="save-slot-body">' +
          '<span class="save-slot-name">' + esc(slot.name) + '</span>' +
          '<span class="save-slot-meta">' + esc(slotMeta(slot)) + '</span>' +
          '<span class="save-slot-date">' + esc(slotDate(slot)) + '</span>' +
          '</span>';
      }
      list.appendChild(btn);
    });
  }

  function renderDetail() {
    const box = $("saves-detail");
    if (!box) return;
    const slot = slots[selected];
    if (!slot) {
      box.innerHTML =
        '<div class="saves-detail-empty">' +
        '<strong>Ячейка ' + (selected + 1) + ' пуста</strong>' +
        'Здесь появится скриншот, описание и кнопки сохранения.' +
        '<div class="save-detail-actions">' +
        '<button class="saves-btn primary" type="button" data-do="write">' +
        'Записать новое сохранение</button></div></div>';
      return;
    }
    const thumb = shot(slot);
    const isRename = renaming === selected;
    box.innerHTML =
      (thumb
        ? '<img class="save-detail-shot" src="' + esc(thumb) +
          '" alt="Скриншот сохранения">'
        : '<div class="save-detail-placeholder">Скриншот недоступен</div>') +
      '<div>' +
      '<div class="save-detail-kicker">Ячейка ' + (selected + 1) +
      ' · ' + esc(slotKind(slot)) + '</div>' +
      (isRename
        ? '<div class="save-rename">' +
          '<input id="save-rename-input" type="text" maxlength="40" value="' +
          esc(slot.name) + '" aria-label="Название сохранения">' +
          '<button class="saves-btn primary" type="button" data-do="rename-save">ОК</button>' +
          '<button class="saves-btn ghost" type="button" data-do="rename-cancel">Отмена</button>' +
          '</div>'
        : '<h3 class="save-detail-title">' + esc(slot.name) + '</h3>') +
      '<p class="save-detail-meta">' + esc(slotMeta(slot)) + '</p>' +
      '<p class="save-detail-date">' + esc(slotDate(slot)) + '</p>' +
      '</div>' +
      '<div class="save-detail-actions">' +
      (mode === "load"
        ? '<button class="saves-btn primary" type="button" data-do="load">Загрузить</button>'
        : '<button class="saves-btn primary" type="button" data-do="overwrite">Перезаписать</button>') +
      (mode === "load"
        ? '<button class="saves-btn" type="button" data-do="overwrite">Перезаписать</button>'
        : '') +
      '<button class="saves-btn" type="button" data-do="rename">Переименовать</button>' +
      '<button class="saves-btn danger" type="button" data-do="delete">Удалить</button>' +
      '</div>';
    if (isRename) {
      const input = $("save-rename-input");
      if (input) {
        setTimeout(() => {
          try {
            input.focus();
            input.select();
          } catch (e) {}
        }, 20);
      }
    }
  }

  function render() {
    renderList();
    renderDetail();
    const sub = $("saves-subtitle");
    if (sub) {
      sub.textContent = mode === "load" ? "Загрузить поход" : "Сохранить поход";
    }
  }

  function selectedIndex() {
    const first = slots.findIndex(Boolean);
    return first >= 0 ? first : 0;
  }

  function writeSlot(index) {
    const snapshot = api() && typeof api().captureSnapshot === "function"
      ? api().captureSnapshot() : null;
    if (!snapshot) {
      setStatus("Сначала начни игру: сохранять пока нечего.", "error");
      return;
    }
    const previous = slots[index];
    if (!previous) {
      slots[index] = makeSlot(snapshot, "Сохранение " + (index + 1), index);
    } else {
      slots[index] = Object.assign({}, previous, {
        updatedAt: Date.now(),
        snapshot: snapshot
      });
    }
    selected = index;
    if (!persist()) {
      slots[index] = previous;
      render();
      return;
    }
    renaming = -1;
    sound("correct");
    setStatus("Сохранено: " + slots[index].name + ".", "ok");
    render();
  }

  function loadSelected() {
    const slot = slots[selected];
    if (!slot) return;
    const ok = api() && typeof api().loadSnapshot === "function"
      ? api().loadSnapshot(slot.snapshot) : false;
    if (!ok) {
      setStatus("Не удалось загрузить это сохранение.", "error");
      sound("wrong");
      return;
    }
    sound("correct");
    close();
    if (window.PyMenu && typeof window.PyMenu.close === "function") {
      window.PyMenu.close();
    }
  }

  function beginRename() {
    if (!slots[selected]) return;
    renaming = selected;
    render();
  }

  function commitRename() {
    const input = $("save-rename-input");
    if (!input) return;
    const name = String(input.value || "").trim().slice(0, 40);
    if (!name) {
      setStatus("Название не может быть пустым.", "error");
      return;
    }
    slots[selected].name = name;
    if (!persist()) return;
    renaming = -1;
    setStatus("Сохранение переименовано.", "ok");
    render();
  }

  function cancelRename() {
    renaming = -1;
    render();
  }

  function removeSelected() {
    const slot = slots[selected];
    if (!slot) return;
    if (!window.confirm("Удалить «" + slot.name + "»? Это действие нельзя отменить.")) {
      return;
    }
    slots[selected] = null;
    persist();
    selected = selectedIndex();
    renaming = -1;
    setStatus("Сохранение удалено.", "ok");
    render();
  }

  function onDetailClick(e) {
    const button = e.target && e.target.closest
      ? e.target.closest("[data-do]") : null;
    if (!button) return;
    const action = button.dataset.do;
    if (action === "write") writeSlot(selected);
    else if (action === "overwrite") writeSlot(selected);
    else if (action === "load") loadSelected();
    else if (action === "rename") beginRename();
    else if (action === "rename-save") commitRename();
    else if (action === "rename-cancel") cancelRename();
    else if (action === "delete") removeSelected();
  }

  function onListClick(e) {
    const item = e.target && e.target.closest
      ? e.target.closest("[data-slot]") : null;
    if (!item) return;
    const index = Number(item.dataset.slot);
    if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT) return;
    sound("click");
    if (!slots[index]) {
      writeSlot(index);
      return;
    }
    selected = index;
    renaming = -1;
    render();
  }

  function focusSelected() {
    const item = document.querySelector(
      '#saves-list [data-slot="' + selected + '"]');
    if (item) {
      try { item.focus(); } catch (e) {}
    }
  }

  function moveSelected(delta) {
    if (!slots.length) return;
    selected = (selected + delta + SLOT_COUNT) % SLOT_COUNT;
    renaming = -1;
    render();
    focusSelected();
  }

  function focusables() {
    const box = $("saves-overlay");
    if (!box) return [];
    return Array.prototype.slice.call(
      box.querySelectorAll("button, input, [href], [tabindex]:not([tabindex='-1'])")
    ).filter((node) => !node.disabled && node.offsetParent !== null);
  }

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const box = $("saves-overlay");
      if (!box || !box.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.target && e.target.id === "save-rename-input") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSelected(e.key === "ArrowDown" ? 1 : -1);
    }
  }

  // Экспорт и импорт — страховка для itch.io и GitHub Pages: localStorage
  // легко потерять при очистке браузера. Один файл хранит все три слота.
  function backupData() {
    return {
      app: "pydungeon",
      kind: "saves-backup",
      v: 1,
      profile: userName(),
      exportedAt: new Date().toISOString(),
      slots: slots.map((slot) => slot ? {
        id: slot.id,
        name: slot.name,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        snapshot: slot.snapshot
      } : null)
    };
  }

  function exportBackup() {
    if (!userName()) {
      setStatus("Сначала войди в профиль.", "error");
      return;
    }
    const text = JSON.stringify(backupData(), null, 2);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = "pydungeon-saves-" + stamp + ".json";
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      sound("correct");
      setStatus("Резервная копия: " + filename + ".", "ok");
    } catch (e) {
      try {
        navigator.clipboard.writeText(text);
        sound("correct");
        setStatus("Файл не скачался — копия сохранена в буфер обмена.", "ok");
      } catch (err) {
        sound("wrong");
        setStatus("Не удалось сохранить резервную копию.", "error");
      }
    }
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed = null;
      try {
        parsed = JSON.parse(String(reader.result || ""));
      } catch (e) {
        sound("wrong");
        setStatus("Это не файл резервной копии PyDungeon.", "error");
        return;
      }
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && Array.isArray(parsed.slots) ? parsed.slots : null);
      if (!incoming) {
        sound("wrong");
        setStatus("В файле нет сохранений.", "error");
        return;
      }
      const next = emptySlots();
      let count = 0;
      for (let i = 0; i < SLOT_COUNT && i < incoming.length; i += 1) {
        const item = incoming[i];
        if (!item || !item.snapshot || item.snapshot.v !== 1) continue;
        next[i] = {
          id: "slot-" + (i + 1),
          name: String(item.name || "Сохранение " + (i + 1)).slice(0, 40),
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: Number(item.updatedAt) || Date.now(),
          snapshot: item.snapshot
        };
        count += 1;
      }
      if (!count) {
        sound("wrong");
        setStatus("В файле нет подходящих сохранений.", "error");
        return;
      }
      const who = parsed && parsed.profile ? " («" + parsed.profile + "»)" : "";
      if (!window.confirm("Импортировать " + count + " сохранений" + who +
          "? Текущие слоты будут заменены.")) {
        return;
      }
      slots = next;
      selected = selectedIndex();
      renaming = -1;
      persist();
      sound("correct");
      setStatus("Импортировано сохранений: " + count + ".", "ok");
      render();
    };
    reader.onerror = () => {
      sound("wrong");
      setStatus("Не удалось прочитать файл.", "error");
    };
    reader.readAsText(file);
  }

  function init() {
    if (inited) return;
    inited = true;
    const overlay = $("saves-overlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });
    }
    const closeBtn = $("saves-close");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const back = $("saves-back");
    if (back) back.addEventListener("click", close);
    const exportBtn = $("saves-export");
    if (exportBtn) exportBtn.addEventListener("click", exportBackup);
    const importBtn = $("saves-import");
    const importFile = $("saves-import-file");
    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => importFile.click());
      importFile.addEventListener("change", () => {
        const file = importFile.files && importFile.files[0];
        importBackup(file);
        importFile.value = "";
      });
    }
    const list = $("saves-list");
    if (list) list.addEventListener("click", onListClick);
    const detail = $("saves-detail");
    if (detail) detail.addEventListener("click", onDetailClick);
    document.addEventListener("keydown", onKey);
  }

  function open(opts) {
    init();
    if (!userName()) {
      return false;
    }
    mode = opts && opts.mode === "load" ? "load" : "save";
    slots = readSlots();
    selected = selectedIndex();
    renaming = -1;
    focusBefore = document.activeElement;
    isOpen = true;
    const overlay = $("saves-overlay");
    if (overlay) overlay.classList.remove("hidden");
    document.body.classList.add("saves-open");
    setStatus("");
    render();
    setTimeout(focusSelected, 30);
    return true;
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    renaming = -1;
    const overlay = $("saves-overlay");
    if (overlay) overlay.classList.add("hidden");
    document.body.classList.remove("saves-open");
    if (focusBefore && typeof focusBefore.focus === "function") {
      try { focusBefore.focus(); } catch (e) {}
    }
    focusBefore = null;
  }

  window.PySaves = {
    open: open,
    close: close,
    isOpen: function () { return isOpen; }
  };
})();
