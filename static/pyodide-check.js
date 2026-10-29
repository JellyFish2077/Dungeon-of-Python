// Мост между game.js и Pyodide-воркером. Контракт тот же, что у /api/check:
// {ok, passed, total, results} либо {ok:false, unavailable, error}.
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof Worker === "undefined") return;

  let worker = null;
  let booted = false;
  let fatal = "";
  let seq = 0;
  const pending = new Map();
  const bootWaiters = [];
  // Флаг для интерфейса: первый запуск Pyodide долгий, повторные — быстрые.
  window.__PYQUIZ_CODE_WARM = false;

  function settleBoot(ok, reason) {
    booted = ok;
    if (ok) window.__PYQUIZ_CODE_WARM = true;
    if (!ok) fatal = reason || "Pyodide не загрузился";
    while (bootWaiters.length) bootWaiters.shift()(booted);
  }

  // Сброс после неудачной загрузки: без него fatal оставался навсегда,
  // и «Проверить» до перезагрузки страницы только повторял ошибку.
  function reset() {
    booted = false;
    fatal = "";
    window.__PYQUIZ_CODE_WARM = false;
    pending.forEach(function (resolve) {
      resolve({ ok: false, unavailable: true,
        error: "Проверка Python перезапущена", results: [] });
    });
    pending.clear();
    while (bootWaiters.length) bootWaiters.shift()(false);
    try { if (worker) worker.terminate(); } catch (e) {}
    worker = null;
  }

  function ensureWorker() {
    if (worker) return worker;
    try {
      worker = new Worker("static/pyodide-worker.js?v=20261029155842");
    } catch (err) {
      settleBoot(false, String((err && err.message) || err));
      return null;
    }
    worker.onmessage = function (event) {
      const msg = event.data || {};
      if (msg.ready) {
        settleBoot(true);
        return;
      }
      if (msg.fatal) {
        settleBoot(false, msg.fatal);
        return;
      }
      if (msg.id == null) return;
      const resolve = pending.get(msg.id);
      if (!resolve) return;
      pending.delete(msg.id);
      resolve(msg.result || { ok: false, error: "Пустой ответ проверки", results: [] });
    };
    worker.onerror = function (event) {
      const reason = (event && event.message) || "Ошибка Pyodide-воркера";
      settleBoot(false, reason);
      pending.forEach(function (resolve) {
        resolve({ ok: false, unavailable: true, error: reason, results: [] });
      });
      pending.clear();
      try { worker.terminate(); } catch (e) {}
      worker = null;
    };
    return worker;
  }

  function boot() {
    if (booted) return Promise.resolve(true);
    // Прошлая попытка не удалась: даём мосту второй шанс, иначе кнопка
    // «Проверить» навсегда возвращала бы ту же ошибку.
    if (fatal) reset();
    ensureWorker();
    if (!worker) return Promise.resolve(false);
    return new Promise(function (resolve) {
      bootWaiters.push(resolve);
      // Первая загрузка Pyodide может быть долгой (локальный Pyodide на
      // медленном канале — десятки секунд); дальше проверки ограничены
      // восемью секундами.
      setTimeout(function () {
        if (booted || fatal) return;
        settleBoot(false, "Pyodide не загрузился за 45 секунд");
        try { if (worker) worker.terminate(); } catch (e) {}
        worker = null;
      }, 45000);
    });
  }

  function check(code, taskId) {
    return boot().then(function (ok) {
      if (!ok) {
        return {
          ok: false,
          unavailable: true,
          error: fatal || "Проверка Python в браузере недоступна",
          results: []
        };
      }
      return new Promise(function (resolve) {
        const id = ++seq;
        pending.set(id, resolve);
        worker.postMessage({ id: id, code: String(code || ""), taskId: String(taskId || "") });
        setTimeout(function () {
          if (!pending.has(id)) return;
          pending.delete(id);
          // Зависший код убиваем вместе с воркером; следующий запрос поднимет
          // новый. Для ученика это обычный таймаут, а не ошибка ответа.
          try { worker.terminate(); } catch (e) {}
          worker = null;
          booted = false;
          resolve({
            ok: false,
            error: "Превышено время выполнения (возможно, бесконечный цикл)",
            results: []
          });
        }, 8000);
      });
    });
  }

  window.__PYQUIZ_CHECK_CODE = check;
  window.__PYQUIZ_RESET_CODE_CHECK = reset;
})();
