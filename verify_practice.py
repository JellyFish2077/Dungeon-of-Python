"""Прогон генератора практических заданий подземелья через настоящий Python.

static/practice-variants.js собирает задания «вставь пропущенное», «найди
ошибку», «повтори код» и «напиши функцию» из шаблонов со случайными именами и
числами. Ответы и пояснения в шаблонах написаны руками, поэтому здесь каждый
вариант выполняется по-настоящему:

- «вставь пропущенное»: с верным вариантом код печатает ровно expect, а с
  каждым неверным падает или печатает другое;
- «найди ошибку»: код падает именно с ошибкой raises (а если ошибка в логике —
  печатает не то, что expect), а исправленный код fix работает;
- «повтори код»: код выполняется без ошибок;
- «напиши функцию»: эталон solution проходит все тесты, а заготовка starter —
  нет (иначе задачу решает пустая функция).

Плюс форма: четыре разных варианта, ровно один пропуск ___, подсказка
«# выведет: …» в коде совпадает с настоящим выводом, в тексте нет разметки.

Запуск:  python verify_practice.py [вариантов на шаблон, по умолчанию 40]
"""
import ast
import json
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent

# ---------- Варианты из practice-variants.js через node ----------
PROBE = r"""
const fs = require("fs"), vm = require("vm");
const ctx = vm.createContext({ console, Math, JSON, Array, Object, String, Number, Set, Map });
ctx.window = ctx; ctx.globalThis = ctx;
vm.runInContext(fs.readFileSync("static/questions.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync("static/practice-variants.js", "utf8"), ctx);
const api = ctx.PracticeVariants;
const n = Number(process.argv[1]) || 40;
const out = { list: api.list, topics: Object.keys(vm.runInContext("TOPICS", ctx)), tasks: [] };
api.list.forEach((t) => {
  for (let i = 0; i < n; i++) out.tasks.push({ key: t.key, kind: t.kind, task: api.make(t.key) });
});
process.stdout.write("__JSON__" + JSON.stringify(out));
"""

# ---------- Исполнитель: все фрагменты в одном процессе Python ----------
# По подпроцессу на фрагмент — это тысячи запусков и минуты ожидания. Здесь
# фрагменты выполняются по очереди в чистом пространстве имён, вывод
# перехватывается, ошибка запоминается по имени класса. Тесты «напиши
# функцию» считаются так же, как на сервере: eval(call) == eval(expected).
# Номер фрагмента пишется в stderr: если что-то зациклится, по таймауту
# видно, что именно.
RUNNER = r'''
import contextlib, io, json, sys, warnings

jobs = json.load(open(sys.argv[1], encoding="utf-8"))
out = []
for i, job in enumerate(jobs):
    print(i, file=sys.stderr, flush=True)
    buf = io.StringIO()
    err = None
    passed = 0
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        try:
            ns = {"__name__": "__main__"}
            compiled = compile(job["code"], "<task>", "exec")
            with contextlib.redirect_stdout(buf):
                exec(compiled, ns)
                for t in job.get("tests") or []:
                    try:
                        if eval(t["call"], ns) == eval(t["expected"], ns):
                            passed += 1
                    except Exception:
                        pass
        except Exception as e:
            err = type(e).__name__
    out.append({"out": buf.getvalue(), "err": err, "warn": [w.category.__name__ for w in caught],
                "passed": passed})
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
'''

# Подсказка о выводе прямо в коде задания.
SAYS = re.compile(r"# (?:выведет|выведет только|нужно получить): (.*)$", re.M)
# Название и пояснение игра вставляет как разметку: тегов и & там быть не должно.
MARKUP = re.compile(r"<[A-Za-z/!?]|&")
# Столько знаков кода влезает в строку на экране телефона; длиннее — строка
# прокручивается вбок, и её конец (а там подсказка о выводе) не виден.
MAX_LINE = 38


def probe(n):
    # Кодировка вывода node на Windows — cp866/cp1251, поэтому читаем байты.
    res = subprocess.run(["node", "-e", PROBE, str(n)], cwd=ROOT, capture_output=True)
    if res.returncode != 0:
        print("не удалось получить задания из node:",
              res.stderr.decode("utf-8", "replace").strip()[:800])
        return None
    raw = res.stdout.decode("utf-8", "replace")
    if "__JSON__" not in raw:
        print("node не отдал JSON:", raw[:300])
        return None
    return json.loads(raw.split("__JSON__", 1)[1])


def run_all(jobs):
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / "runner.py").write_text(RUNNER, encoding="utf-8")
        (tmp / "jobs.json").write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
        try:
            # -I: фрагменты не должны видеть ни файлов проекта, ни окружения.
            subprocess.run([sys.executable, "-I", "-X", "utf8", str(tmp / "runner.py"),
                            str(tmp / "jobs.json"), str(tmp / "out.json")],
                           cwd=tmp, capture_output=True, timeout=300, check=True)
        except subprocess.TimeoutExpired as e:
            done = (e.stderr or b"").decode("utf-8", "replace").split()
            last = int(done[-1]) if done else 0
            print("ТАЙМАУТ: фрагмент, похоже, зациклился:\n" + jobs[last]["code"])
            return None
        except subprocess.CalledProcessError as e:
            print("исполнитель упал:", e.stderr.decode("utf-8", "replace")[-800:])
            return None
        return json.loads((tmp / "out.json").read_text(encoding="utf-8"))


def shown(r):
    return r["out"].rstrip("\n")


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    data = probe(n)
    if not data:
        return 1
    problems = []

    def fail(item, msg):
        t = item.get("task") or {}
        problems.append(f"{item['key']}: {msg}\n    " + str(t.get("code", "")).replace("\n", "\n    "))

    keys = [t["key"] for t in data["list"]]
    if len(keys) != len(set(keys)):
        problems.append("повторяются ключи шаблонов")
    topics = set(data["topics"])
    for topic in sorted(topics):
        kinds = {t["kind"] for t in data["list"] if t["topic"] == topic}
        missing = {"fill", "error", "copy"} - kinds
        if missing:
            problems.append(f"тема {topic}: нет шаблонов вида {', '.join(sorted(missing))}")

    # Форма заданий и план запусков.
    jobs = []
    index = {}

    def job(code, tests=None):
        k = code + "\0" + json.dumps(tests, ensure_ascii=False)
        if k not in index:
            index[k] = len(jobs)
            jobs.append({"code": code, "tests": tests})
        return index[k]

    plan = []
    for item in data["tasks"]:
        t = item["task"]
        kind = item["kind"]
        if not t:
            fail(item, "шаблон не собрал задание")
            continue
        need = ("id", "title", "task", "starter", "solution", "topic", "level", "explanation") if kind == "code" \
            else ("id", "title", "code", "topic", "level", "explanation")
        for field in need:
            if t.get(field) in (None, ""):
                fail(item, f"нет поля {field}")
        shown_code = t.get("starter" if kind == "code" else "code") or ""
        long_lines = [line for line in shown_code.split("\n") if len(line) > MAX_LINE]
        if long_lines:
            fail(item, f"строка длиннее {MAX_LINE} знаков не влезет в экран телефона: {long_lines[0]!r}")
        if kind == "code":
            tests = t.get("tests") or []
            names = set(re.findall(r"^def (\w+)\(", t.get("starter", ""), re.M))
            if len(tests) < 2 or len({x.get("call") for x in tests}) != len(tests):
                fail(item, "нужно хотя бы два разных теста")
                continue
            for x in tests:
                if not isinstance(x.get("call"), str) or x["call"].split("(", 1)[0] not in names:
                    fail(item, f"тест вызывает функцию не из заготовки: {x.get('call')!r}")
                try:
                    ast.literal_eval(x.get("expected"))
                except (ValueError, SyntaxError):
                    fail(item, f"expected не литерал Python: {x.get('expected')!r}")
            for field in ("title", "task", "explanation"):
                if MARKUP.search(str(t.get(field, ""))):
                    fail(item, f"в {field} похоже на разметку: {t.get(field)!r}")
            plan.append((item, [job(t["solution"], tests), job(t["starter"], tests)]))
            continue
        if t.get("topic") not in topics:
            fail(item, f"неизвестная тема {t.get('topic')!r}")
        if t.get("level") not in (1, 2, 3, 4):
            fail(item, f"неверный уровень {t.get('level')!r}")
        for field in ("title", "explanation"):
            if MARKUP.search(str(t.get(field, ""))):
                fail(item, f"в {field} похоже на разметку: {t.get(field)!r}")
        code = t.get("code", "")
        if kind in ("fill", "error"):
            opts = t.get("options") or []
            if len(opts) != 4 or len(set(opts)) != 4:
                fail(item, f"нужно 4 разных варианта: {opts}")
                continue
            if t.get("answer") != 0:
                fail(item, "верный ответ должен стоять первым (answer 0)")
        if kind == "fill":
            if code.count("___") != 1:
                fail(item, "пропуск ___ должен быть ровно один")
                continue
            if "expect" not in t:
                fail(item, "нет expect")
                continue
            runs = [job(code.replace("___", opt, 1)) for opt in t["options"]]
        elif kind == "error":
            if "___" in code:
                fail(item, "в коде «найди ошибку» не должно быть ___")
            if bool(t.get("raises")) == ("expect" in t):
                fail(item, "нужно ровно одно из двух: raises (код падает) или expect (ошибка в логике)")
                continue
            if "expect" in t and not t.get("fix"):
                fail(item, "у ошибки в логике должен быть fix")
            runs = [job(code)] + ([job(t["fix"])] if t.get("fix") else [])
        else:
            if "___" in code:
                fail(item, "в коде «повтори код» не должно быть ___")
            if not t.get("task"):
                fail(item, "нет текста условия task")
            lines = code.split("\n")
            if any(line == "" for line in lines):
                fail(item, "в «повтори код» не должно быть пустых строк")
            if any(line != line.rstrip() or "\t" in line for line in lines):
                fail(item, "пробелы в конце строки или табуляция")
            runs = [job(code)]
        plan.append((item, runs))

    results = run_all(jobs)
    if results is None:
        return 1

    for item, runs in plan:
        t = item["task"]
        kind = item["kind"]
        first = results[runs[0]]
        if kind == "code":
            total = len(t["tests"])
            if first["err"] or first["warn"]:
                fail(item, f"эталон не запускается: {first['err'] or first['warn']}\n    " +
                     t["solution"].replace("\n", "\n    "))
            elif first["passed"] != total:
                fail(item, f"эталон проходит {first['passed']} тестов из {total}: {t['tests']}")
            blank = results[runs[1]]
            if blank["err"]:
                fail(item, f"заготовка не запускается: {blank['err']}")
            elif blank["passed"] == total:
                fail(item, "пустая заготовка проходит все тесты")
            continue
        said = SAYS.search(t["code"])
        if kind == "fill":
            want = t["expect"]
            if first["err"] or first["warn"]:
                fail(item, f"с верным ответом {t['options'][0]!r}: {first['err'] or first['warn']}")
            elif shown(first) != want:
                fail(item, f"с верным ответом печатает {shown(first)!r}, а ждём {want!r}")
            for opt, rid in zip(t["options"][1:], runs[1:]):
                r = results[rid]
                if not r["err"] and shown(r) == want:
                    fail(item, f"неверный вариант {opt!r} тоже даёт {want!r}")
                elif not said and not r["err"]:
                    # Без подсказки о выводе ученик не знает, чего ждать, —
                    # тогда неверный вариант обязан ломать программу.
                    fail(item, f"нет подсказки «# выведет», а вариант {opt!r} работает: {shown(r)!r}")
            if said and said.group(1) != want:
                fail(item, f"подсказка в коде {said.group(1)!r}, а вывод {want!r}")
        elif kind == "error":
            if t.get("raises"):
                if first["err"] != t["raises"]:
                    fail(item, f"ждём {t['raises']}, а вышло {first['err'] or 'без ошибки: ' + repr(shown(first))}")
                if said:
                    fail(item, "у падающего кода не нужна подсказка о выводе")
            else:
                if first["err"]:
                    fail(item, f"ошибка в логике, а код падает: {first['err']}")
                elif shown(first) == t["expect"]:
                    fail(item, "код с ошибкой уже печатает то, что нужно")
                if said and said.group(1) != t["expect"]:
                    fail(item, f"подсказка в коде {said.group(1)!r}, а нужно {t['expect']!r}")
            if t.get("fix"):
                r = results[runs[1]]
                if r["err"] or r["warn"]:
                    fail(item, f"исправленный код не работает: {r['err'] or r['warn']}")
                elif "expect" in t and shown(r) != t["expect"]:
                    fail(item, f"исправленный код печатает {shown(r)!r}, а нужно {t['expect']!r}")
        else:
            if first["err"] or first["warn"]:
                fail(item, f"код для переписывания не работает: {first['err'] or first['warn']}")

    # Разнообразие: шаблон, который всегда выдаёт одно и то же, — не генератор.
    variety = {}
    for item in data["tasks"]:
        t = item["task"]
        if t:
            body = t.get("code") or (t.get("starter", "") + json.dumps(t.get("tests"), ensure_ascii=False))
            variety.setdefault(item["key"], set()).add(body + "|" + "|".join(t.get("options", [])))
    flat = sorted((len(v), k) for k, v in variety.items())
    for count, key in flat:
        if count < 2:
            problems.append(f"{key}: за {n} вызовов ни одного нового варианта")

    by_kind = {}
    for t in data["list"]:
        by_kind[t["kind"]] = by_kind.get(t["kind"], 0) + 1
    print(f"шаблонов: {len(data['list'])} (вставь пропущенное {by_kind.get('fill', 0)}, "
          f"найди ошибку {by_kind.get('error', 0)}, повтори код {by_kind.get('copy', 0)}, "
          f"напиши функцию {by_kind.get('code', 0)})")
    print(f"собрано заданий: {len(data['tasks'])}, разных: {sum(len(v) for v in variety.values())}, "
          f"фрагментов выполнено: {len(jobs)}")
    print("меньше всего вариантов у: " + ", ".join(f"{k} ({c})" for c, k in flat[:3]))
    if problems:
        print(f"ПРОБЛЕМ: {len(problems)}")
        for p in problems[:40]:
            print("--- " + p)
        if len(problems) > 40:
            print(f"... и ещё {len(problems) - 40}")
        return 1
    print("Все задания генератора проверены настоящим Python.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
