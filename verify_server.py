#!/usr/bin/env python3
"""Проверка серверной части, которую не видят остальные проверки.

Запуск:  python verify_server.py
- /api/submit: в результаты учителя попадают только известные поля нужных типов
  (строка-скрипт вместо числа не доедет до страницы учителя), а поход
  подземелья с несколькими итогами остаётся одной строкой (runId);
- результат с токеном входа отмечен аккаунтом (verified / account), отметку
  нельзя прислать самому, а строку из аккаунта не перезапишет итог без входа;
  CSV показывает режим и отметку;
- /api/check: сбой сервера (--no-code, нет тестов, очередь) помечен
  unavailable — игра не наказывает за него ученика; очередь проверок
  не теряет запросы и освобождает слоты;
- /api/game-config сообщает игре, включена ли проверка кода;
- /api/profile/save больше не пускает по имени и PIN в обход лимита входа;
- тело-не-объект (список, строка, null) ни на одном POST-адресе не роняет
  обработчик: ответ — ошибка с JSON, а не оборванное соединение.

Сервер поднимается в этом же процессе на свободном порту, results.json,
users.json и social.db подменяются временными файлами: настоящие данные
класса не трогаются.
"""
import json
import os
import shutil
import socket
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import server as S  # noqa: E402

results = []


def check(ok, name, extra=""):
    results.append(bool(ok))
    mark = "  ok  " if ok else " СБОЙ "
    tail = ("   -> " if not ok else "   (") + str(extra) + ("" if not ok else ")") if extra != "" else ""
    print("[%s] %s%s" % (mark, name, tail))


def _call_once(root, path, body, raw):
    data = raw if raw is not None else (json.dumps(body).encode("utf-8") if body is not None else None)
    req = urllib.request.Request(root + path, data=data,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        except ValueError:
            return exc.code, {}


def call(root, path, body=None, raw=None):
    # Windows изредка рвёт уже установленное локальное соединение (10053),
    # особенно когда рядом работает WSL. Один повтор не скрывает настоящий
    # сбой сервера: второй такой же обрыв всё равно уронит проверку.
    for attempt in range(2):
        try:
            return _call_once(root, path, body, raw)
        except (ConnectionError, urllib.error.URLError):
            if attempt:
                raise
            time.sleep(0.15)


def _call_no_ctype_once(root, path, body):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(root + path, data=data)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        except ValueError:
            return exc.code, {}


def call_no_ctype(root, path, body):
    """Тот же POST, но без Content-Type — так приходит подделка с чужой страницы."""
    for attempt in range(2):
        try:
            return _call_no_ctype_once(root, path, body)
        except (ConnectionError, urllib.error.URLError):
            if attempt:
                raise
            time.sleep(0.15)


def check_code_cache():
    # В классе один и тот же верный ответ пишут двадцать пять человек.
    # Без кэша это двадцать пять процессов и очередь; с кэшем — один.
    tests = [{"call": "double(5)", "expected": "10"}]
    code = "def double(x):\n    return x * 2"
    first = S.run_code(code, tests)
    second = S.run_code(code, tests)
    check(first.get("ok") and first.get("passed") == 1 and not first.get("cached"),
          "кэш: первая проверка считается по-настоящему", first)
    check(second.get("ok") and second.get("passed") == 1 and second.get("cached"),
          "кэш: повтор того же кода отвечает без запуска", second)

    other = S.run_code(code, [{"call": "double(6)", "expected": "12"}])
    check(other.get("ok") and other.get("passed") == 1 and not other.get("cached"),
          "кэш: те же строки кода с другими тестами — другой ключ", other)

    wrong = S.run_code("def double(x):\n    return x * 3", tests)
    check(wrong.get("ok") and wrong.get("passed") == 0,
          "кэш: неверное решение честно возвращает провал", wrong)
    again = S.run_code("def double(x):\n    return x * 3", tests)
    check(again.get("cached"), "кэш: неверное решение тоже запоминается — оно детерминировано", again)

    broken = "def double(x)\n    return x"
    for _ in range(2):
        res = S.run_code(broken, tests)
    check(not res.get("cached"),
          "кэш: недопустимый код каждый раз проверяется заново, а не кэшируется", res)
    with S._code_cache_lock:
        S._code_cache.clear()


def check_env_number():
    saved = dict(os.environ)
    try:
        os.environ.pop("PYQUIZ_TEST_NUM", None)
        check(S._env_number("PYQUIZ_TEST_NUM", 4, int) == 4, "число из окружения: без переменной берётся запасное")
        os.environ["PYQUIZ_TEST_NUM"] = "9"
        check(S._env_number("PYQUIZ_TEST_NUM", 4, int) == 9, "число из окружения: значение читается")
        os.environ["PYQUIZ_TEST_NUM"] = "не число"
        check(S._env_number("PYQUIZ_TEST_NUM", 4, int) == 4, "число из окружения: мусор не роняет сервер")
        os.environ["PYQUIZ_TEST_NUM"] = "0"
        check(S._env_number("PYQUIZ_TEST_NUM", 4, int) == 4, "число из окружения: ноль или меньше игнорируется")
        check(S.CODE_WORKERS >= 4 and S.CODE_QUEUE_WAIT >= 10,
              "очередь проверки кода рассчитана на класс (%d слотов, %.0f с ожидания)"
              % (S.CODE_WORKERS, S.CODE_QUEUE_WAIT))
    finally:
        os.environ.clear()
        os.environ.update(saved)


def check_resource_limits():
    # Огромный stdout раньше целиком собирался в память сервера.
    noisy = "for i in range(50000):\n    print('x' * 100)"
    res = S.run_code(noisy, [{"call": "1 + 1", "expected": "2"}])
    check(res.get("ok") is True and res.get("passed") == 1,
          "песочница: огромный вывод не ломает проверку", res.get("error", ""))

    # Мегабайтный результат не должен оставаться в кэше.
    with S._code_cache_lock:
        S._code_cache.clear()
    S._cache_put("big-result", {"ok": True, "results": [{"actual": "x" * 200000}]})
    with S._code_cache_lock:
        cached = "big-result" in S._code_cache
        S._code_cache.clear()
    check(not cached, "кэш проверок не хранит мегабайтные результаты")


def check_users_race(tmp):
    # Ученики регистрируются одновременно на старте занятия. Раньше файл
    # читался вне замка, и второй из писавших затирал первого: «профиль
    # потерялся» без всякой ошибки. Пауза внутри правки делает окно гонки
    # гарантированным, а не случайным.
    S.USERS_FILE = os.path.join(tmp, "users-race.json")
    names = ["ученик%02d" % i for i in range(8)]
    errors = []

    def work(name):
        def register(all_users):
            all_users[name] = {"name": name, "profile": {}}
            # Пауза внутри правки делает окно гонки гарантированным:
            # без общего замка читатель успевает уйти с пустым файлом.
            time.sleep(0.05)
            return None

        try:
            _, error = S.update_user(name, register)
            if error:
                errors.append(error)
        except Exception as exc:  # noqa: BLE001
            errors.append("%s: %s" % (type(exc).__name__, exc))

    threads = [threading.Thread(target=work, args=(n,)) for n in names]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    stored = S.load_users()
    check(not errors and sorted(stored) == names,
          "регистрация восьми учеников разом: ни один профиль не потерялся",
          "ошибки: %s; осталось: %d из %d" % (errors[:3], len(stored), len(names)))

    taken = []

    def claim(all_users):
        if "одинаковый" in all_users:
            return "уже есть"
        all_users["одинаковый"] = {"name": "одинаковый"}
        time.sleep(0.05)
        return None

    def work2():
        _, error = S.update_user("одинаковый", claim)
        taken.append(error)

    threads = [threading.Thread(target=work2) for _ in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    check(taken.count(None) == 1, "при одновременной регистрации одного имени проходит ровно один",
          "прошло: %d из 6" % taken.count(None))


def check_clean_result():
    evil = {
        "name": "  Вася  ", "mode": "<b>", "date": "<img src=x onerror=alert(1)>",
        "percent": "<img src=x onerror=alert(1)>", "correctCount": 99, "total": 10,
        "seconds": float("nan"), "level": {"key": "god", "title": "<script>" * 20},
        "topicStats": {"syntax": {"correct": 50, "total": 3}, "<b>": {"correct": 1, "total": 1}, "x": 5},
        "reward": {"gold": 10 ** 9}, "junk": "x" * 1000, "runId": "1760000000000",
        "dungeon": {"kills": "много", "victory": "yes", "floorsCleared": 3.7, "junk": 1},
    }
    r = S.clean_result(evil)
    check(r["name"] == "Вася" and r["mode"] == "test", "имя обрезано, неизвестный режим — «test»")
    check(r["percent"] == 0 and r["seconds"] == 0, "строка и NaN вместо чисел — нули")
    check(r["correctCount"] == 10, "верных не больше, чем всего")
    check("<" not in r["date"] and r["date"][:2] == "20", "дата-скрипт заменена временем сервера", r["date"])
    check(r["level"] == {"key": "", "title": ("<script>" * 5)}, "уровень: ключ из списка, заголовок до 40 знаков")
    check(r["topicStats"] == {"syntax": {"correct": 3, "total": 3}}, "темы: только разумные ключи и числа", r["topicStats"])
    check("reward" not in r and "junk" not in r, "незнакомые поля отброшены")
    check(r["dungeon"] == {"kills": 0, "floorsCleared": 3, "victory": False}, "поля подземелья — числа", r["dungeon"])
    check(r["runId"] == "1760000000000", "номер похода сохраняется")
    check(S.clean_result({"name": "  "}) is None and S.clean_result([1]) is None,
          "без имени или не объект — отказ")
    quiz = {"name": "Оля", "mode": "practice", "date": "2026-10-14T10:11:12.345Z", "percent": 87,
            "correctCount": 9, "total": 10, "weighted": 20, "maxWeighted": 23, "seconds": 312,
            "level": {"key": "advanced", "title": "Продвинутый"}, "bestStreak": 5,
            "topicStats": {"lists": {"correct": 2, "total": 2}}, "levelStats": {"1": {"correct": 3, "total": 3}},
            "wrong": [{"kind": "mc", "id": "q12", "topic": "lists", "level": 2, "chosen": 1, "correct": False,
                       "chosenLetter": "B", "answerLetter": "C", "chosenText": "x", "answerText": "y"}]}
    q = S.clean_result(quiz)
    check(q["date"] == quiz["date"] and q["percent"] == 87 and q["weighted"] == 20 and q["bestStreak"] == 5
          and q["levelStats"] == quiz["levelStats"] and q["wrong"][0]["chosenText"] == "x"
          and q["level"]["key"] == "advanced", "честный результат теста доезжает без потерь")


def check_one_row_per_run(tmp):
    S.RESULTS_FILE = os.path.join(tmp, "results-unit.json")
    for item in (
        {"name": "Петя", "mode": "dungeon", "runId": "111", "dungeon": {"floorsCleared": 2}},
        {"name": "Оля", "mode": "test", "percent": 70},
        {"name": "Петя", "mode": "dungeon", "runId": "111", "dungeon": {"floorsCleared": 5}},
        {"name": "Петя", "mode": "dungeon", "runId": "222"},
        {"name": "Оля", "mode": "test", "percent": 70},
        {"name": "Вася", "mode": "dungeon", "runId": "111"},
    ):
        S.save_result(S.clean_result(item))
    rows = S.load_results()
    same = [x for x in rows if x["name"] == "Петя" and x.get("runId") == "111"]
    check(len(same) == 1 and same[0]["dungeon"]["floorsCleared"] == 5,
          "поход с двумя итогами — одна строка, последняя", len(same))
    check(len(rows) == 5, "другие походы, тесты и чужой поход с тем же номером не склеиваются", len(rows))


def check_results_limit(tmp):
    """Файл результатов не растёт без предела: лишняя строка не пишется."""
    S.RESULTS_FILE = os.path.join(tmp, "results-limit.json")
    old_max = S.RESULTS_MAX
    try:
        S.RESULTS_MAX = 1
        first = S.save_result(S.clean_result(
            {"name": "Первый", "total": 1, "correctCount": 1, "percent": 100}))
        second = S.save_result(S.clean_result(
            {"name": "Второй", "total": 1, "correctCount": 1, "percent": 100}))
        rows = S.load_results()
        check(first == 1 and second is None and len(rows) == 1,
              "потолок файла результатов: лишняя строка не записывается",
              "первый=%s, второй=%s, строк=%d" % (first, second, len(rows)))
    finally:
        S.RESULTS_MAX = old_max


def check_account_mark(tmp):
    S.USERS_FILE = os.path.join(tmp, "users-mark.json")
    S.save_users({"вася пупкин": {"name": "Вася Пупкин", "salt": "", "hash": ""}})
    good = S.new_token("вася пупкин")
    ghost = S.new_token("никто")

    r = S.mark_account(S.clean_result({"name": "  вАся пупкин "}), good)
    check(r.get("verified") is True and r["name"] == "Вася Пупкин" and "account" not in r,
          "имя аккаунта с токеном — отметка «из аккаунта», имя как в аккаунте", r)
    r = S.mark_account(S.clean_result({"name": "Петя"}), good)
    check(r.get("account") == "Вася Пупкин" and "verified" not in r and r["name"] == "Петя",
          "вошёл Вася, а имя набрано другое — строка помнит, из чьего аккаунта", r)
    r = S.mark_account(S.clean_result({"name": "Вася Пупкин"}), None)
    check("verified" not in r and "account" not in r, "без токена — без отметки")
    r = S.mark_account(S.clean_result({"name": "Вася Пупкин"}), good[:-4] + "AAAA")
    check("verified" not in r and "account" not in r, "испорченный токен — без отметки")
    r = S.mark_account(S.clean_result({"name": "Никто"}), ghost)
    check("verified" not in r and "account" not in r, "токен удалённого аккаунта — без отметки")
    r = S.clean_result({"name": "Вася Пупкин", "verified": True, "account": "Учитель"})
    check("verified" not in r and "account" not in r, "отметку нельзя прислать в самом результате")

    # Строку похода из аккаунта не перезапишет итог без входа с тем же
    # именем и номером: иначе чужой поход затирался бы, зная номер.
    S.RESULTS_FILE = os.path.join(tmp, "results-mark.json")
    run = {"name": "Вася Пупкин", "mode": "dungeon", "runId": "777", "dungeon": {"floorsCleared": 6}}
    S.save_result(S.mark_account(S.clean_result(run), good))
    fake = dict(run, dungeon={"floorsCleared": 0})
    S.save_result(S.mark_account(S.clean_result(fake), None))
    rows = [x for x in S.load_results() if x.get("runId") == "777"]
    check(len(rows) == 2 and any(x.get("verified") and x["dungeon"]["floorsCleared"] == 6 for x in rows),
          "итог без входа не затирает строку похода из аккаунта", rows)
    later = dict(run, dungeon={"floorsCleared": 8})
    S.save_result(S.mark_account(S.clean_result(later), good))
    rows = [x for x in S.load_results() if x.get("runId") == "777"]
    check(len(rows) == 1 and rows[0].get("verified") and rows[0]["dungeon"]["floorsCleared"] == 8,
          "новый итог из того же аккаунта заменяет строку похода, а заодно и подделку", rows)


def check_run_code():
    task_tests = [{"call": "attack_power(10, 5)", "expected": "15"},
                  {"call": "attack_power(0, 0)", "expected": "0"}]
    good_code = "def attack_power(base, bonus):\n    return base + bonus"
    S.ALLOW_CODE = False
    off = S.run_code(good_code, task_tests)
    check(off.get("unavailable") and off.get("disabled"), "--no-code: «недоступно», а не ошибка ученика")
    S.ALLOW_CODE = True
    check(S.run_code(good_code, []).get("unavailable"), "задание без тестов — не вина ученика")
    check(not S.run_code("   ", task_tests).get("unavailable"), "пустой код — ошибка ученика")
    syntax = S.run_code("def attack_power(base, bonus)\n    return 1", task_tests)
    check(not syntax["ok"] and not syntax.get("unavailable") and "SyntaxError" in syntax["error"],
          "SyntaxError — ошибка ученика", syntax.get("error"))
    wait = S.CODE_QUEUE_WAIT
    S.CODE_QUEUE_WAIT = 0.2
    for _ in range(S.CODE_WORKERS):
        S._CODE_SLOTS.acquire()
    try:
        busy = S.run_code(good_code, task_tests)
    finally:
        for _ in range(S.CODE_WORKERS):
            S._CODE_SLOTS.release()
        S.CODE_QUEUE_WAIT = wait
    check(busy.get("unavailable") and busy.get("busy"), "все слоты заняты — «сервер занят», а не провал")
    out = []
    threads = [threading.Thread(target=lambda: out.append(S.run_code(good_code, task_tests)))
               for _ in range(S.CODE_WORKERS * 2 + 1)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    check(len(out) == len(threads) and all(r.get("ok") and r.get("passed") == 2 for r in out),
          "проверки разом сверх числа слотов: все дождались очереди и прошли",
          "%d из %d" % (sum(1 for r in out if r.get("ok")), len(threads)))
    check(S._CODE_SLOTS._value == S.CODE_WORKERS, "после проверок все слоты свободны")


# Регрессия: песочница исполняла код ученика в глобалах серверного прелюдия,
# где лежала сохранённая ссылка на настоящий open. Через неё ученик читал
# .secret и .admin-secret, подделывал админ-токен и переписывал server.py
# (open(path, "w") проверку проходил). Теперь код выполняется в отдельном
# пространстве имён, а файловые режимы проверяются в обе стороны.
SECRET = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".secret"))


def _escaped(code):
    """True, если код выполнился целиком — то есть песочница его пропустила.

    Проба в тестах должна быть заведомо верной: print(1) возвращает None,
    и с ним сравнение 1 != None даёт «ошибку» даже при полном успехе —
    на такой пробе все попытки выхода выглядели бы как отказы.
    """
    r = S.run_code(code, [{"call": "1 + 1", "expected": "2"}])
    if not r.get("ok"):
        return False
    return bool(r.get("results", [{}])[0].get("ok"))


def check_sandbox():
    root = os.path.dirname(SECRET)
    # В WSL настоящий путь к секрету — /mnt/c/…; после маскирования /mnt
    # он обязан быть недоступен. На Linux путь уже свой, а в режиме process —
    # обычный путь Windows.
    if S.sandbox_backend() == "wsl" and os.name == "nt":
        secret_in_sandbox = S.wsl_path(SECRET)
    else:
        secret_in_sandbox = SECRET
    marker_file = os.path.join(root, "pwn.txt")
    # Зачистка: иначе остаток прошлого прогона (или прогона на старой
    # песочнице) валил бы эту проверку навсегда, и её перестали бы читать.
    try:
        os.remove(marker_file)
    except OSError:
        pass
    escapes = [
        ("сохранённый open из прелюдии", "_orig_open(%r).read()" % SECRET),
        ("низкоуровневый os.open из прелюдии", "_orig_os_open(%r, os.O_RDONLY)" % SECRET),
        ("запись вне папки задачи", "open(%r, 'w').write('x')" % os.path.join(root, "pwn.txt")),
        ("дозапись вне папки задачи", "open(%r, 'a').write('x')" % os.path.join(root, "pwn.txt")),
        ("чтение и запись (r+) вне папки", "open(%r, 'r+')" % os.path.join(root, "pwn.txt")),
        ("чтение самого server.py", "open(%r).read()" % os.path.abspath(__file__)),
        ("PIN админки", "_orig_open(%r).read()" % os.path.join(root, ".admin-secret")),
        ("globals()['_orig_open']", "globals()['_orig_open']"),
        ("import os", "import os"),
        ("import sys", "import sys"),
        ("import subprocess", "import subprocess"),
        ("import socket", "import socket"),
        ("import ctypes", "import ctypes"),
        ("import builtins", "import builtins"),
        ("встроенный eval", "eval('1+1')"),
        ("встроенный exec", "exec('x=1')"),
        ("встроенный input", "input()"),
        ("подмена print через globals", "globals()"),
        # Четыре реальных выхода, найденных адверсариальным ревью. Белый
        # список модулей их не закрывает: это не «теоретические» векторы,
        # а команды, которые действительно читают файлы и запускают процессы.
        ("random._os", "import random\nrandom._os.path.getsize(%r)" % secret_in_sandbox),
        ("statistics.sys.modules['os']",
         "import statistics\nstatistics.sys.modules['os'].path.getsize(%r)" % secret_in_sandbox),
        ("().__subclasses__() -> FileLoader.get_data",
         "[c for c in ().__class__.__bases__[0].__subclasses__() "
         "if c.__name__ == 'FileLoader'][0]('x', %r).get_data(%r)"
         % (secret_in_sandbox, secret_in_sandbox)),
        ("BuiltinImporter.load_module('os')",
         "[c for c in ().__class__.__bases__[0].__subclasses__() "
         "if c.__name__ == 'BuiltinImporter'][0].load_module('os')"
         ".path.getsize(%r)" % secret_in_sandbox),
    ]
    bad = [name for name, code in escapes if _escaped(code)]
    check(not bad, "песочница: %d способов выйти наружу закрыто" % len(escapes),
          "прорвались: " + ", ".join(bad))
    check(not os.path.exists(marker_file), "песочница: файлы вне папки задачи не создаются")

    # Позитивные проверки: закрывая доступ, нельзя сломать рабочие задания.
    works = [
        ("функция", "def attack_power(base, bonus):\n    return base + bonus",
         "attack_power(10, 5)", "15"),
        ("print", "print('привет')", "1 + 1", "2"),
        ("import math", "import math", "math.sqrt(81)", "9.0"),
        ("import random", "import random", "random.randint(5, 5)", "5"),
        ("from math import pi", "from math import pi", "round(pi, 2)", "3.14"),
        ("список и генератор", "def f(xs):\n    return [x * 2 for x in xs]",
         "f([1, 2, 3])", "[2, 4, 6]"),
        ("try/except", "def f(d):\n    try:\n        return d['k']\n    except KeyError:\n        return 0",
         "f({})", "0"),
        ("свой класс", "class A:\n    def __init__(self, v):\n        self.v = v\n    def get(self):\n        return self.v",
         "A(7).get()", "7"),
        ("свой текст", "def f(xs):\n    return ', '.join(xs)", "f(['a', 'b'])", repr("a, b")),
    ]
    broken = []
    for name, code, call, expected in works:
        r = S.run_code(code, [{"call": call, "expected": expected}])
        if not (r.get("ok") and r.get("results", [{}])[0].get("ok")):
            broken.append("%s (%s)" % (name, r.get("error") or "тест не прошёл"))
    check(not broken, "песочница: %d обычных заданий выполняются как раньше" % len(works),
          "; ".join(broken))


POST_PATHS = [
    "/api/register", "/api/login", "/api/profile/update", "/api/profile/save",
    "/api/friends/request", "/api/friends/accept", "/api/friends/remove",
    "/api/messages", "/api/invites", "/api/invites/clear",
    "/api/admin/login", "/api/admin/save", "/api/admin/reset",
    "/api/check", "/api/submit",
]


def check_profile_save_race(root):
    """Одновременные сохранения профилей не должны затирать друг друга.

    Старый обработчик читал users.json вне замка, правил свою копию и
    записывал её целиком: последний сохранивший затирал профили остальных.
    Задержка внутри load_users делает окно гонки гарантированным, а не
    случайным.
    """
    keys = ["профиль%02d" % i for i in range(8)]
    S.save_users({k: {"name": k, "salt": "", "hash": "", "profile": {}} for k in keys})
    real_load = S.load_users

    def slow_load():
        data = real_load()
        time.sleep(0.05)
        return data

    S.load_users = slow_load
    errors = []

    def work(index, key):
        status, res = call(root, "/api/profile/save", {
            "token": S.new_token(key),
            "profile": {"wallet": {"gold": index + 1}},
        })
        if status != 200 or not res.get("ok"):
            errors.append("%s: %s %s" % (key, status, res.get("error")))

    try:
        threads = [threading.Thread(target=work, args=(i, key))
                   for i, key in enumerate(keys)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
    finally:
        S.load_users = real_load

    stored = S.load_users()
    lost = []
    for i, key in enumerate(keys):
        gold = (((stored.get(key) or {}).get("profile") or {}).get("wallet") or {}).get("gold")
        if gold != i + 1:
            lost.append("%s: %s вместо %d" % (key, gold, i + 1))
    check(not errors and not lost,
          "одновременное сохранение профилей: ни одна правка не потерялась",
          "; ".join(errors[:2] + lost[:4]))


def check_http(tmp):
    S.RESULTS_FILE = os.path.join(tmp, "results-http.json")
    S.USERS_FILE = os.path.join(tmp, "users-http.json")
    S.DB_FILE = os.path.join(tmp, "social-http.db")
    S.TEACHER_PIN = "verify-pin"
    S.Handler.log_message = lambda *args: None
    httpd = S.ReuseServer(("127.0.0.1", 0), S.Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    root = "http://127.0.0.1:%d" % httpd.server_address[1]
    try:
        S.ALLOW_CODE = True
        _, cfg = call(root, "/api/game-config")
        check(cfg.get("features", {}).get("code") is True, "game-config: проверка кода включена")
        _, ver = call(root, "/api/version")
        check(ver.get("version") == S.VERSION and ver.get("date"),
              "/api/version отдаёт ту же версию, что стоит в коде", ver)
        with urllib.request.urlopen(root + "/api/version.js", timeout=30) as resp:
            script = resp.read().decode("utf-8")
        check(S.VERSION in script and "data-app-version" in script,
              "/api/version.js подставляет версию в страницы", script[:60])
        S.ALLOW_CODE = False
        _, cfg = call(root, "/api/game-config")
        check(cfg.get("features", {}).get("code") is False, "game-config: --no-code видно игре")
        _, res = call(root, "/api/check", {"code": "print(1)", "tests": [{"call": "1", "expected": "1"}]})
        check(res.get("unavailable") and res.get("disabled"), "/api/check при --no-code: unavailable + disabled")
        S.ALLOW_CODE = True
        status, _ = call(root, "/api/check", [1, 2])
        check(status == 400, "/api/check: не объект — 400, а не падение обработчика", status)

        # Тесты задания банка берутся на сервере, а не из тела запроса.
        good_code = "def attack_power(base, bonus):\n    return base + bonus"
        status, res = call(root, "/api/check", {"code": good_code, "taskId": "attack_power"})
        check(status == 200 and res.get("ok") is True and res.get("passed") == 3,
              "/api/check по taskId: серверные тесты задания банка", res)
        status, res = call(root, "/api/check", {
            "code": good_code, "taskId": "attack_power",
            "tests": [{"call": "1", "expected": "1"}],
        })
        check(status == 200 and res.get("passed") == 3,
              "/api/check: присланные клиентом tests игнорируются", res.get("passed"))

        # Пользовательский __eq__ больше не проходит проверку.
        evil_code = (
            "class Always:\n"
            "    def __eq__(self, other):\n"
            "        return True\n"
            "    def __repr__(self):\n"
            "        return 'Always()'\n"
            "def attack_power(base, bonus):\n"
            "    return Always()"
        )
        status, res = call(root, "/api/check", {"code": evil_code, "taskId": "attack_power"})
        check(status == 200 and res.get("ok") is True and res.get("passed") == 0,
              "/api/check: __eq__ ученика не подменяет сравнение", res)

        # Задания генератора не имеют серверных тестов — игра их не выдаёт.
        status, res = call(root, "/api/check", {
            "code": good_code, "taskId": "gen.code.operators.multiply.abc",
        })
        check(status == 200 and res.get("ok") is False and res.get("staleTask") is True,
              "/api/check: задание генератора помечено staleTask, а не проверено", res)
        status, res = call(root, "/api/check", {"code": good_code, "taskId": "нет-такого"})
        check(status == 200 and res.get("ok") is False and res.get("unavailable") is True
              and not res.get("staleTask"), "/api/check: неизвестное задание не проверяется", res)

        # Подделка с чужой страницы: браузер шлёт text/plain без
        # предварительного согласования, поэтому такой POST обязан быть отбит.
        bad_ctype = []
        for path in POST_PATHS:
            status, _ = call_no_ctype(root, path, {"name": "Кто-то чужой", "pin": "1234"})
            if status != 415:
                bad_ctype.append("%s -> %s" % (path, status))
        check(not bad_ctype, "POST без application/json отбит на всех адресах (защита от подделки)",
              "; ".join(bad_ctype[:5]))

        status, _ = call(root, "/api/submit", {"name": "Тест", "percent": "<img src=x onerror=alert(1)>",
                                                "runId": "r1", "evil": "x"})
        stored = S.load_results()
        check(status == 200 and stored and stored[-1]["percent"] == 0 and "evil" not in stored[-1],
              "/api/submit сохраняет очищенный результат", stored[-1] if stored else status)
        call(root, "/api/submit", {"name": "Тест", "percent": 50, "total": 10,
                                    "correctCount": 5, "runId": "r1"})
        stored = S.load_results()
        check(len(stored) == 1 and stored[0]["percent"] == 50, "/api/submit: второй итог того же похода заменил первый")

        # Итог похода без входа — подделка: в подземелье без аккаунта не войти.
        status, _ = call(root, "/api/submit", {"name": "Гость", "mode": "dungeon",
                                                "percent": 100, "total": 10, "correctCount": 10})
        stored = S.load_results()
        check(status == 401 and len(stored) == 1,
              "/api/submit: итог похода без токена отбит и не попал в файл", status)

        # Процент, не сходящийся с числом верных ответов, — не результат.
        status, _ = call(root, "/api/submit", {"name": "Тест", "percent": 100,
                                                "total": 10, "correctCount": 1})
        stored = S.load_results()
        check(status == 400 and len(stored) == 1,
              "/api/submit: поддельный процент отбит", status)

        # С токеном входа строка отмечена аккаунтом; CSV показывает режим и отметку.
        S.save_users({"оля": {"name": "Оля", "salt": "", "hash": ""}})
        status, _ = call(root, "/api/submit", {"name": "оля", "mode": "practice", "percent": 90,
                                                "total": 10, "correctCount": 9,
                                                "weighted": 18, "maxWeighted": 20,
                                                "token": S.new_token("оля")})
        stored = S.load_results()
        check(status == 200 and stored[-1].get("verified") is True and stored[-1]["name"] == "Оля"
              and "token" not in stored[-1], "/api/submit с токеном: отметка аккаунта, токен не хранится",
              stored[-1])
        call(root, "/api/submit", {"name": "Гость", "percent": 10, "total": 10,
                                   "correctCount": 1, "verified": True})
        stored = S.load_results()
        check(stored[-1]["name"] == "Гость" and "verified" not in stored[-1],
              "/api/submit без токена: «verified» из запроса не принят")
        with urllib.request.urlopen(root + "/api/export.csv?pin=" + S.TEACHER_PIN, timeout=30) as resp:
            csv_text = resp.read().decode("utf-8-sig")
        lines = csv_text.splitlines()
        check(lines[0].endswith(";Режим;Из аккаунта") and any(l.startswith("Оля;") and l.endswith(";Тренажёр;да")
                                                               for l in lines)
              and any(l.startswith("Гость;") and l.endswith(";Тест;нет") for l in lines),
              "CSV: новые столбцы в конце — режим и отметка аккаунта", lines[:1] + lines[-2:])

        status, _ = call(root, "/api/submit", raw=b"{" + b" " * 300001 + b"}")
        check(status == 413, "/api/submit: огромное тело — 413", status)

        # Content-Length: -1 старый код принимал и читал до закрытия
        # соединения: один запрос навсегда занимал поток.
        try:
            with socket.create_connection(("127.0.0.1", httpd.server_address[1]),
                                          timeout=5) as sock:
                sock.sendall(
                    b"POST /api/submit HTTP/1.1\r\nHost: test\r\n"
                    b"Content-Type: application/json\r\nContent-Length: -1\r\n\r\n")
                raw = sock.recv(4096)
            check(b" 413 " in raw, "отрицательный Content-Length отбит", raw[:80])
        except OSError as exc:
            check(False, "отрицательный Content-Length отбит", str(exc))
        status, _ = call(root, "/api/submit", ["name"])
        check(status == 400, "/api/submit: не объект — 400", status)

        status, res = call(root, "/api/profile/save", {"name": "кто-то", "pin": "1234", "profile": {}})
        check(status == 401, "/api/profile/save по имени и PIN без токена — 401", status)

        # Профиль ученика санитизируется: клиент не может записать произвольный
        # объект, а счётчик амулетов возврата зажат потолком админки.
        evil = {
            "name": "Хакер",
            "wallet": {"gold": "много", "small_potion": -3},
            "hub": {"revive": 99, "gear": ["x" * 200] + [5] * 30},
            "evil": {"junk": 1},
            "wrongPool": "не список",
            # Постоянная прогрессия: уровни выше потолка, числа вместо строк,
            # ключи-простыни и отрицательная цепочка квестов. Сервер обязан
            # всё это срезать — иначе панель учителя разрешит то, чего не
            # бывает в игре, а клиент запишет в профиль мусор.
            "hero": {"hp": 999, "dmg": -5, "potions": "много"},
            "village": {"forge": 7, "barn": "да"},
            "loot": {"ore": 10 ** 12, "wood": 1, "shard": -2,
                     "keys": ["seal"] + ["x" * 300] * 20},
            "quests": {"story": -4, "done": ["ok"] + [5] * 100, "repeat": {"ore": 9999999999},
                       "progress": "не объект", "active": "о" * 200},
            "ability": {"pick": "п" * 100, "used": -1},
        }
        status, reg = call(root, "/api/register", {"name": "Хакер", "pin": "123", "profile": evil})
        prof = reg.get("profile", {})
        check(status == 200 and prof.get("hub", {}).get("revive") == 3,
              "профиль: счётчик амулетов зажат потолком", prof.get("hub"))
        check("evil" not in prof and "wrongPool" not in prof,
              "профиль: посторонние поля отброшены", list(prof.keys()))
        gear = prof.get("hub", {}).get("gear", [])
        check(len(gear) <= 20 and all(isinstance(g, str) and len(g) <= 60 for g in gear),
              "профиль: снаряжение ограничено и очищено", gear)
        check(prof.get("wallet", {}).get("small_potion") == 0
              and prof.get("wallet", {}).get("gold") == 0,
              "профиль: мусор вместо чисел не проходит", prof.get("wallet"))
        # Потолки прогрессии — те же числа, что в static/profile.js: если
        # сервер срежет уровень, который игра разрешила, прогресс героя
        # молча потеряется при синхронизации.
        hero = prof.get("hero", {})
        check(hero.get("hp") == 5 and hero.get("dmg") == 0 and hero.get("potions") == 0,
              "профиль: уровни улучшений зажаты потолком", hero)
        village = prof.get("village", {})
        check(village.get("forge") == 2 and village.get("barn") == 0,
              "профиль: уровни построек зажаты потолком", village)
        loot = prof.get("loot", {})
        check(loot.get("ore") == 10 ** 7 and loot.get("shard") == 0
              and len(loot.get("keys", [])) <= 12 and all(len(k) <= 40 for k in loot.get("keys", [])),
              "профиль: материалы и ключи обрезаны", loot)
        quests = prof.get("quests", {})
        check(quests.get("story") == 0 and len(quests.get("active", "")) <= 40
              and quests.get("progress") == {} and len(quests.get("done", [])) <= 60,
              "профиль: квесты очищены и обрезаны", quests)
        check(prof.get("ability", {}).get("pick") == "п" * 20
              and prof.get("ability", {}).get("used") == 0,
              "профиль: умение обрезано, счётчик зарядов не отрицательный",
              prof.get("ability"))

        status, _ = call(root, "/api/profile/save",
                         {"token": reg["token"], "profile": {"hub": {"revive": 7}, "junk": 1}})
        _, me = call(root, "/api/me?token=" + reg["token"])
        check(status == 200 and me.get("profile", {}).get("hub", {}).get("revive") == 3
              and "junk" not in me.get("profile", {}),
              "профиль: сохранение тоже чистит и зажимает", me.get("profile"))

        # Упавший обработчик не отвечает вовсе: браузер видит оборванное
        # соединение, а в консоли сервера — трассировку на каждый запрос.
        bad = []
        for path in POST_PATHS:
            for body in ([1, 2], "строка", 7, None):
                raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
                try:
                    status, res = call(root, path, raw=raw)
                except Exception as exc:  # noqa: BLE001
                    bad.append("%s %s: %s" % (path, raw.decode("utf-8"), type(exc).__name__))
                    continue
                if status < 400 or res.get("ok") is not False:
                    bad.append("%s %s: %s" % (path, raw.decode("utf-8"), status))
        check(not bad, "тело-не-объект на любом POST-адресе — ошибка с JSON, а не обрыв",
              "; ".join(bad[:6]) + (" … ещё %d" % (len(bad) - 6) if len(bad) > 6 else ""))
        check_profile_save_race(root)
    finally:
        httpd.shutdown()
        httpd.server_close()


def main():
    tmp = tempfile.mkdtemp(prefix="pyquiz-verify-")
    saved = (S.RESULTS_FILE, S.USERS_FILE, S.DB_FILE, S.ALLOW_CODE, S.TEACHER_PIN)
    try:
        for part in (check_clean_result, lambda: check_one_row_per_run(tmp),
                     lambda: check_results_limit(tmp), lambda: check_account_mark(tmp),
                     check_run_code, check_sandbox, check_resource_limits,
                     check_code_cache, check_env_number,
                     lambda: check_users_race(tmp), lambda: check_http(tmp)):
            # Упавшая часть — это сбой проверки, а не конец отчёта.
            try:
                part()
            except Exception as exc:  # noqa: BLE001
                check(False, "часть проверки упала", "%s: %s" % (type(exc).__name__, exc))
    finally:
        S.RESULTS_FILE, S.USERS_FILE, S.DB_FILE, S.ALLOW_CODE, S.TEACHER_PIN = saved
        shutil.rmtree(tmp, ignore_errors=True)
    ok = sum(results)
    print()
    print("Итог: %d/%d проверок пройдено." % (ok, len(results)))
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
