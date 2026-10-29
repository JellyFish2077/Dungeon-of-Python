// Внутреннее подтверждение вместо window.confirm.
// Возвращает Promise<boolean>; run(opts, onYes) — удобная обёртка для
// обработчиков, которым нужен только «да» и побочное действие.
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  let resolveAsk = null;
  let lastFocus = null;

  function node(id) {
    return document.getElementById(id);
  }

  function isOpen() {
    const overlay = node("confirm-overlay");
    return !!(overlay && !overlay.classList.contains("hidden"));
  }

  function setBusy(busy) {
    const ok = node("confirm-ok");
    const cancel = node("confirm-cancel");
    if (ok) ok.disabled = !!busy;
    if (cancel) cancel.disabled = !!busy;
  }

  function finish(result) {
    const overlay = node("confirm-overlay");
    if (!overlay || !resolveAsk) return;
    const resolve = resolveAsk;
    resolveAsk = null;
    overlay.classList.add("hidden");
    document.body.classList.remove("confirm-open");
    setBusy(false);
    const restore = lastFocus;
    lastFocus = null;
    if (restore && typeof restore.focus === "function") {
      try { restore.focus(); } catch (e) {}
    }
    resolve(!!result);
  }

  function ask(opts) {
    opts = opts || {};
    const overlay = node("confirm-overlay");
    if (!overlay) return Promise.resolve(true);
    // Если окно уже открыто, прошлый запрос считаем отменённым.
    if (resolveAsk) {
      const previous = resolveAsk;
      resolveAsk = null;
      previous(false);
    }
    lastFocus = document.activeElement;
    const title = node("confirm-title");
    const text = node("confirm-text");
    const ok = node("confirm-ok");
    const cancel = node("confirm-cancel");
    if (title) title.textContent = opts.title || "Подтверждение";
    if (text) text.textContent = opts.text || "";
    if (ok) {
      ok.textContent = opts.confirmLabel || "Подтвердить";
      ok.classList.toggle("danger", !!opts.danger);
      ok.disabled = false;
    }
    if (cancel) {
      cancel.textContent = opts.cancelLabel || "Отмена";
      cancel.disabled = false;
    }
    overlay.classList.remove("hidden");
    document.body.classList.add("confirm-open");
    return new Promise(function (resolve) {
      resolveAsk = resolve;
      setTimeout(function () {
        if (isOpen() && ok) {
          try { ok.focus(); } catch (e) {}
        }
      }, 30);
    });
  }

  function run(opts, onYes) {
    if (typeof onYes !== "function") return;
    ask(opts).then(function (ok) {
      if (ok) onYes();
    });
  }

  function init() {
    const overlay = node("confirm-overlay");
    if (!overlay) return;
    const ok = node("confirm-ok");
    const cancel = node("confirm-cancel");
    if (ok) ok.addEventListener("click", function () { finish(true); });
    if (cancel) cancel.addEventListener("click", function () { finish(false); });
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay) finish(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (!isOpen()) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        ev.stopPropagation();
        finish(false);
        return;
      }
      if (ev.key !== "Tab") return;
      // Две кнопки — держим фокус внутри окна.
      const focusables = [cancel, ok].filter(function (n) {
        return n && !n.disabled;
      });
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.PyConfirm = { ask: ask, run: run, isOpen: isOpen };
})();
