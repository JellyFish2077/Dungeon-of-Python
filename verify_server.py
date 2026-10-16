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
import sys
import tempfile
import threading
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


def call(root, path, body=None, raw=None):
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


POST_PATHS = [
    "/api/register", "/api/login", "/api/profile/update", "/api/profile/save",
    "/api/friends/request", "/api/friends/accept", "/api/friends/remove",
    "/api/messages", "/api/invites", "/api/invites/clear",
    "/api/admin/login", "/api/admin/save", "/api/admin/reset",
    "/api/check", "/api/submit",
]


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
        S.ALLOW_CODE = False
        _, cfg = call(root, "/api/game-config")
        check(cfg.get("features", {}).get("code") is False, "game-config: --no-code видно игре")
        _, res = call(root, "/api/check", {"code": "print(1)", "tests": [{"call": "1", "expected": "1"}]})
        check(res.get("unavailable") and res.get("disabled"), "/api/check при --no-code: unavailable + disabled")
        S.ALLOW_CODE = True
        status, _ = call(root, "/api/check", [1, 2])
        check(status == 400, "/api/check: не объект — 400, а не падение обработчика", status)

        status, _ = call(root, "/api/submit", {"name": "Тест", "percent": "<img src=x onerror=alert(1)>",
                                                "runId": "r1", "evil": "x"})
        stored = S.load_results()
        check(status == 200 and stored and stored[-1]["percent"] == 0 and "evil" not in stored[-1],
              "/api/submit сохраняет очищенный результат", stored[-1] if stored else status)
        call(root, "/api/submit", {"name": "Тест", "percent": 50, "runId": "r1"})
        stored = S.load_results()
        check(len(stored) == 1 and stored[0]["percent"] == 50, "/api/submit: второй итог того же похода заменил первый")
        # С токеном входа строка отмечена аккаунтом; CSV показывает режим и отметку.
        S.save_users({"оля": {"name": "Оля", "salt": "", "hash": ""}})
        status, _ = call(root, "/api/submit", {"name": "оля", "mode": "practice", "percent": 90,
                                                "token": S.new_token("оля")})
        stored = S.load_results()
        check(status == 200 and stored[-1].get("verified") is True and stored[-1]["name"] == "Оля"
              and "token" not in stored[-1], "/api/submit с токеном: отметка аккаунта, токен не хранится",
              stored[-1])
        call(root, "/api/submit", {"name": "Гость", "percent": 10, "verified": True})
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
    finally:
        httpd.shutdown()
        httpd.server_close()


def main():
    tmp = tempfile.mkdtemp(prefix="pyquiz-verify-")
    saved = (S.RESULTS_FILE, S.USERS_FILE, S.DB_FILE, S.ALLOW_CODE, S.TEACHER_PIN)
    try:
        for part in (check_clean_result, lambda: check_one_row_per_run(tmp),
                     lambda: check_account_mark(tmp), check_run_code, lambda: check_http(tmp)):
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
