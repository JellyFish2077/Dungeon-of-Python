"""Прогон всех генерируемых вариантов вопросов через настоящий Python.

Каждый шаблон hand-written: значение «правильного» ответа вычислено
вручную, и ошибка в арифметике не повредит ни игроку, ни чекеру. Здесь мы
выполняем код каждого сгенерированного задания тем же способом, что и
сервер (подпроцесс с таймаутом), и сверяем вывод с отмеченным ответом.
"""
import json
import os
import subprocess
import sys
import tempfile
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
STATIC = ROOT / "static"

# ---------- Достаём варианты из variants.js через node ----------
PROBE = r"""
const fs = require("fs"), vm = require("vm");
const ctx = vm.createContext({ console, Math, JSON, Array, Object, String, Number });
ctx.window = ctx; ctx.globalThis = ctx;
vm.runInContext(fs.readFileSync("static/questions.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync("static/variants.js", "utf8"), ctx);
const out = vm.runInContext("QUESTIONS.filter(function (q) { return q.generated; })", ctx);
process.stdout.write("__JSON__" + JSON.stringify(out));
"""

def generated_questions():
    # Кодировка вывода node на Windows — cp866/cp1251, поэтому читаем
    # вывод как utf-8 байты, а не через текстовый режим subprocess.
    res = subprocess.run(["node", "-e", PROBE], cwd=ROOT, capture_output=True)
    if res.returncode != 0:
        print("не удалось получить варианты из node:",
              res.stderr.decode("utf-8", "replace").strip()[:500])
        return []
    raw = res.stdout.decode("utf-8", "replace")
    marker = "__JSON__"
    if marker not in raw:
        print("node не отдал JSON:", raw[:300])
        return []
    return json.loads(raw.split(marker, 1)[1])

def run_python(code, timeout=5):
    with tempfile.TemporaryDirectory() as tmp:
        p = pathlib.Path(tmp) / "s.py"
        p.write_text(code, encoding="utf-8")
        try:
            # -X utf8, а не PYTHONIOENCODING: ключ -I включает -E, который
            # переменные окружения игнорирует, и русские слова в stdout
            # превращались в «кракозябры».
            r = subprocess.run([sys.executable, "-I", "-X", "utf8", str(p)],
                               capture_output=True, timeout=timeout, cwd=tmp)
        except subprocess.TimeoutExpired:
            return None
    return r.stdout.decode("utf-8", "replace").replace("\r\n", "\n").strip()

def normalize(s):
    # Python печатает списки с одинарными кавычками, а шаблоны пишут
    # варианты с двойными — приводим к одному виду.
    return s.replace('"', "'").strip()

def matches(out, expected):
    """Сравнивает вывод программы с отмеченным ответом.

    Вопросы «Сколько чисел выведет этот код?» ждут не сам вывод, а его
    размер — для них сверяем число строк.
    """
    want = normalize(str(expected))
    got = normalize(out)
    if got == want:
        return True
    lines = [x for x in got.split("\n") if x != ""]
    return len(lines) == int(want) if want.isdigit() and len(lines) > 1 else False

def main():
    qs = generated_questions()
    if not qs:
        print("НЕТ ВАРИАНТОВ — проверка не выполнена")
        return 1
    bad = []
    unparsed = []
    for q in qs:
        code = q.get("code")
        opts = q.get("options") or []
        ans = q.get("answer")
        if not code or not isinstance(ans, int) or not (0 <= ans < len(opts)):
            unparsed.append(q.get("id"))
            continue
        out = run_python(code)
        if out is None:
            bad.append((q, "таймаут", opts[ans]))
            continue
        if not matches(out, opts[ans]):
            bad.append((q, out, opts[ans]))

    print(f"проверено заданий: {len(qs)}")
    print(f"не разобрано: {len(unparsed)}")
    if bad:
        print(f"РАСХОЖДЕНИЙ: {len(bad)}")
        for q, got, want in bad:
            # Код обязателен: варианты генерируются заново при каждом
            # запуске node, и без него непонятно, какой именно шаблон сломался.
            print(f"--- {q['id']} L{q['level']} {q['topic']}")
            print("    " + q["code"].replace("\n", "\n    "))
            print(f"    python={got!r}")
            print(f"    ожидалось={want!r}")
        return 1
    print("Все генерируемые задания совпадают с настоящим Python.")
    return 0

if __name__ == "__main__":
    sys.exit(main())