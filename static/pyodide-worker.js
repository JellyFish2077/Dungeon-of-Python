// Web Worker с Pyodide: проверка Python-кода в браузере.
// Никакого сервера и ОС: код живёт в песочнице браузера, а зависший
// студенческий цикл убивается terminate() со стороны страницы.
"use strict";

const PYODIDE_VERSION = "0.27.7";
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";
const PYODIDE_LOCAL = new URL("pyodide/", self.location).href;

let pyodide = null;
let testsBank = null;

const RUNNER = String.raw`
import json

def _canon(v):
    t = type(v)
    if v is None:
        return ["z"]
    if t is bool:
        return ["b", v]
    if t is int:
        return ["n", v]
    if t is float:
        if v != v or v in (float("inf"), float("-inf")):
            raise ValueError("нечисловое значение")
        return ["n", int(v)] if v.is_integer() else ["n", v]
    if t is str:
        return ["s", v]
    if t is list:
        return ["l", [_canon(x) for x in v]]
    if t is tuple:
        return ["t", [_canon(x) for x in v]]
    if t is dict:
        return ["d", sorted([[_canon(k), _canon(val)] for k, val in v.items()],
                            key=lambda pair: json.dumps(pair[0], ensure_ascii=False, sort_keys=True))]
    raise TypeError("неподдерживаемый тип результата")

def _short(v):
    r = repr(v)
    return r if len(r) <= 1000 else r[:1000] + "…"

def run_task(source, tests_json):
    ns = {"__name__": "task", "__builtins__": __builtins__}
    try:
        exec(compile(source, "<task>", "exec"), ns)
    except Exception as e:
        return json.dumps({"ok": False, "error": type(e).__name__ + ": " + str(e),
                           "results": []}, ensure_ascii=False)
    tests = json.loads(tests_json)
    out = []
    for t in tests:
        try:
            actual = eval(t["call"], ns)
            expected = eval(t["expected"], {})
            ok = (json.dumps(_canon(actual), ensure_ascii=False, sort_keys=True) ==
                  json.dumps(_canon(expected), ensure_ascii=False, sort_keys=True))
            out.append({"ok": ok, "actual": _short(actual), "expected": _short(expected)})
        except Exception as e:
            out.append({"ok": False, "actual": "Ошибка: " + str(e),
                        "expected": t.get("expected", "")})
    return json.dumps({"ok": True, "results": out,
                       "passed": sum(1 for x in out if x["ok"]), "total": len(out)},
                      ensure_ascii=False)
`;

function resolveBase() {
  // Офлайн-сборка Itch.io: если рядом лежит public/static/pyodide, берём её.
  // Пробуем загрузить локальный скрипт; при 404 откатываемся на CDN.
  try {
    importScripts(PYODIDE_LOCAL + "pyodide.js");
    return PYODIDE_LOCAL;
  } catch (e) {
    importScripts(PYODIDE_CDN + "pyodide.js");
    return PYODIDE_CDN;
  }
}

const ready = (async () => {
  const base = resolveBase();
  pyodide = await loadPyodide({ indexURL: base });
  pyodide.runPython(RUNNER);
  testsBank = await fetch(new URL("code-tasks-tests.json", self.location).href, {
    cache: "no-store"
  }).then((r) => {
    if (!r.ok) throw new Error("code-tasks-tests.json: " + r.status);
    return r.json();
  });
  self.postMessage({ ready: true });
})().catch((err) => {
  self.postMessage({ fatal: String((err && err.message) || err) });
});

self.onmessage = async (event) => {
  const msg = event.data || {};
  const id = msg.id;
  try {
    await ready;
    const taskId = String(msg.taskId || "");
    const tests = testsBank && testsBank[taskId];
    if (!tests) {
      self.postMessage({
        id: id,
        result: {
          ok: false,
          unavailable: true,
          staleTask: taskId.indexOf("gen.") === 0,
          error: "Задание не найдено в банке проверок",
          results: []
        }
      });
      return;
    }
    pyodide.globals.set("__code", String(msg.code || ""));
    pyodide.globals.set("__tests", JSON.stringify(tests));
    const raw = pyodide.runPython("run_task(__code, __tests)");
    self.postMessage({ id: id, result: JSON.parse(raw) });
  } catch (err) {
    self.postMessage({
      id: id,
      result: {
        ok: false,
        error: String((err && err.message) || err),
        results: []
      }
    });
  }
};
