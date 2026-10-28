/* Полноэкранный режим по умолчанию.
 *
 * Браузер разрешает requestFullscreen только из жеста пользователя, поэтому
 * на первой странице мы ждём первый тап/клик/клавишу и разворачиваем игру.
 * Если человек сам вышел из полного экрана, на этой странице больше не
 * навязываем режим: следующая страница снова попробует один раз.
 *
 * На телефоне после входа в fullscreen просим горизонтальную ориентацию.
 * iOS Safari не умеет element fullscreen — там просто остаётся обычный
 * полноэкранный лейаут страницы.
 */
(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  // Playwright и другие автопроверки не должны неожиданно уходить в fullscreen:
  // ручная кнопка остаётся, а автоматический вход отключаем только для них.
  const automated = !!(navigator && navigator.webdriver);
  let pending = false;
  let wasOn = !!doc.fullscreenElement;
  let optedOut = false;
  let listenersOn = false;

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
    if (!supported() || isOn() || pending || optedOut) return false;
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
    if (isOn()) {
      optedOut = true;
      return exit();
    }
    optedOut = false;
    return enter();
  }

  function explicitTarget(ev) {
    const t = ev && ev.target;
    if (!t || !t.closest) return false;
    return !!t.closest("#fullscreen-btn, #set-fullscreen, [data-fullscreen-toggle]");
  }

  function firstGesture(ev) {
    if (explicitTarget(ev)) {
      // Кнопка полного экрана сама вызовет toggle; не входим и не выходим дважды.
      detach();
      return;
    }
    if (optedOut || isOn()) return;
    enter().then((ok) => {
      if (ok || optedOut) detach();
    });
  }

  function attach() {
    if (listenersOn || !supported()) return;
    listenersOn = true;
    window.addEventListener("pointerdown", firstGesture, true);
    window.addEventListener("keydown", firstGesture, true);
  }

  function detach() {
    if (!listenersOn) return;
    listenersOn = false;
    window.removeEventListener("pointerdown", firstGesture, true);
    window.removeEventListener("keydown", firstGesture, true);
  }

  doc.addEventListener("fullscreenchange", () => {
    const on = isOn();
    if (!on && wasOn) {
      // Вышли через Esc или системную кнопку: уважаем выбор до перезагрузки.
      optedOut = true;
      unlockOrientation();
    }
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

  // Первый жест на странице. Дальше слушатели снимаются.
  if (!automated) attach();
  syncUI();
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", () => {
      if (!automated) attach();
      syncUI();
    });
  }

  window.PyFullscreen = {
    enter: enter,
    exit: exit,
    toggle: toggle,
    isOn: isOn,
    supported: supported
  };
})();
