/* Полноэкранный режим по кнопке.
 *
 * Автоматически ничего не открываем: браузеры разрешают requestFullscreen
 * только из жеста пользователя, а навязывать режим при первом клике не нужно.
 * Кнопка есть на лендинге, в шапке игры и в настройках.
 *
 * На телефоне после ручного входа в fullscreen просим горизонтальную
 * ориентацию. iOS Safari не умеет element fullscreen — там остаётся обычный
 * полноэкранный лейаут страницы.
 */
(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  let pending = false;
  let wasOn = !!doc.fullscreenElement;

  function supported() {
    return !!(doc.fullscreenEnabled && root.requestFullscreen);
  }

  function isOn() {
    return !!doc.fullscreenElement;
  }

  function syncUI() {
    const on = isOn();
    const can = supported();
    doc.querySelectorAll("[data-fullscreen-label]").forEach((node) => {
      node.textContent = on ? "Выйти из полного экрана" : "Полный экран";
    });
    doc.querySelectorAll("[data-fullscreen-toggle]").forEach((node) => {
      node.style.display = can ? "" : "none";
      node.setAttribute("aria-pressed", on ? "true" : "false");
      node.setAttribute("aria-label", on ? "Выйти из полного экрана" : "Полный экран");
    });
  }

  function lockLandscape() {
    try {
      const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      if (!coarse || window.innerWidth > 950) return;
      if (screen.orientation && typeof screen.orientation.lock === "function") {
        const p = screen.orientation.lock("landscape");
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {
      // Ориентация не блокируется — CSS всё равно разложит интерфейс.
    }
  }

  function unlockOrientation() {
    try {
      if (screen.orientation && typeof screen.orientation.unlock === "function") {
        screen.orientation.unlock();
      }
    } catch (e) {
      // ignore
    }
  }

  async function enter() {
    if (!supported() || isOn() || pending) return false;
    pending = true;
    try {
      await root.requestFullscreen({ navigationUI: "hide" });
      lockLandscape();
      return true;
    } catch (e) {
      return false;
    } finally {
      pending = false;
    }
  }

  async function exit() {
    if (!isOn()) return false;
    try {
      await doc.exitFullscreen();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function toggle() {
    return isOn() ? exit() : enter();
  }

  doc.addEventListener("fullscreenchange", () => {
    const on = isOn();
    if (!on && wasOn) unlockOrientation();
    wasOn = on;
    if (on) lockLandscape();
    syncUI();
    doc.dispatchEvent(new CustomEvent("pyfullscreenchange", { detail: { on: on } }));
  });

  doc.addEventListener("click", (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest("[data-fullscreen-toggle]") : null;
    if (!btn) return;
    ev.preventDefault();
    toggle();
  });

  syncUI();
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", syncUI);
  }

  window.PyFullscreen = {
    enter: enter,
    exit: exit,
    toggle: toggle,
    isOn: isOn,
    supported: supported
  };
})();
