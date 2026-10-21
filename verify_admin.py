#!/usr/bin/env python3
"""Сквозная проверка админ-панели: живой сервер, живой HTTP, живая кириллица.

Запуск:  python verify_admin.py
Проверяет то, чего не видит check.py и verify_dungeon.py: маршруты /admin и
/api/admin/*, вход по паролю из .admin-secret, сохранение правок в
game-config.json в UTF-8, отказ на мусор и выход за границы, резервную копию и
сброс к стандарту.

Скрипт поднимает СВОЙ сервер на свободном порту и гасит его в конце, поэтому
сервер учеников на 8000 не затрагивается. Настоящие настройки учителя
(game-config.json) сохраняются в памяти и возвращаются на место после
проверки: запускать можно в любой момент.
"""
import json
import os
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Все изменяемые данные проверки (настройки, резервная копия, секрет, users,
# results, social.db, _backup) живут во временном каталоге. Раньше проверка
# работала в корне проекта: удаляла game-config.backup.json учителя и ротировала
# настоящие снимки _backup. Теперь рабочая папка только читается.
DATA_DIR = ""
CONFIG_FILE = ""
BACKUP_FILE = ""
SECRET_FILE = ""

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

STATE = {"bad": 0}


def check(cond, name, extra=""):
    if not cond:
        STATE["bad"] += 1
    tail = (" — " + str(extra)) if extra else ""
    print(("  ok  " if cond else " ПЛОХО ") + name + tail)
    return bool(cond)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def call(root, path, data=None, method=None):
    body = None
    headers = {}
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
        method = method or "POST"
    req = urllib.request.Request(root + path, data=body, headers=headers,
                                 method=method or "GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as exc:
        # Отказ сервера — тоже результат проверки, а не сбой скрипта.
        raw = exc.read()
    try:
        return json.loads(raw.decode("utf-8")), raw
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}, raw


def start_server(port, env):
    proc = subprocess.Popen(
        [sys.executable, "server.py", "--port", str(port), "--local"],
        cwd=BASE_DIR, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    root = "http://127.0.0.1:%d" % port
    deadline = time.time() + 20
    while time.time() < deadline:
        if proc.poll() is not None:
            raise RuntimeError("сервер завершился сразу, код %s" % proc.returncode)
        try:
            with urllib.request.urlopen(root + "/api/game-config", timeout=2) as resp:
                resp.read()
            return proc, root
        except Exception:
            time.sleep(0.3)
    proc.terminate()
    raise RuntimeError("сервер не поднялся за 20 секунд")


def main():
    global DATA_DIR, CONFIG_FILE, BACKUP_FILE, SECRET_FILE
    # Временный каталог на весь прогон: рабочая папка проекта не меняется.
    DATA_DIR = tempfile.mkdtemp(prefix="pyquiz-admin-")
    CONFIG_FILE = os.path.join(DATA_DIR, "game-config.json")
    BACKUP_FILE = os.path.join(DATA_DIR, "game-config.backup.json")
    SECRET_FILE = os.path.join(DATA_DIR, ".admin-secret")

    # Свой PIN в своём файле: проверяется именно путь «пароль из
    # .admin-secret», а не переменная окружения с машины разработчика.
    pin = "verify-%06d" % secrets.randbelow(1000000)
    with open(SECRET_FILE, "w", encoding="utf-8") as fh:
        fh.write(pin + "\n")

    env = os.environ.copy()
    env["PYQUIZ_DATA_DIR"] = DATA_DIR
    env["PYQUIZ_NO_BACKUP"] = "1"
    env.pop("PYQUIZ_ADMIN_PIN", None)
    env.pop("PYQUIZ_SECRET", None)

    port = free_port()
    proc = None
    try:
        proc, root = start_server(port, env)
        print("сервер проверки: %s (порт %d, данные: %s)" % (root, port, DATA_DIR))

        login, _ = call(root, "/api/admin/login", {"pin": pin})
        check(login.get("ok") is True, "вход по паролю из .admin-secret или окружения")
        token = login.get("token", "")

        bad_pin, _ = call(root, "/api/admin/login", {"pin": "000000"})
        check(bad_pin.get("ok") is False, "неверный пароль отбит")

        no_token, _ = call(root, "/api/admin/save", {"values": {"enemy.rat.hp": 5}})
        check(no_token.get("ok") is False, "без токена сохранять нельзя")

        _, raw_page = call(root, "/admin")
        check(b"<html" in raw_page.lower(), "страница /admin отдаётся")
        check(b"charset" in raw_page.lower(), "страница объявляет кодировку")

        want = {
            "item.steel_sword.name": "Меч-кладенец «Проверка»",
            "item.steel_sword.desc": "Описание с кириллицей и «кавычками».",
            "enemy.rat.hp": 55,
            "enemy.rat.name": "Крыса-переросток",
            "floor.1.name": "Проверочная пещера",
            "floor.1.pool": "golem, troll",
            "floor.1.count": 7,
            "econ.goldBase": 42,
        }
        saved, _ = call(root, "/api/admin/save", {"token": token, "values": want})
        check(saved.get("ok") is True, "сохранение принято", saved.get("error", ""))
        check(saved.get("values", {}).get("item.steel_sword.name") == want["item.steel_sword.name"],
              "имя предмета вернулось без порчи кодировки",
              saved.get("values", {}).get("item.steel_sword.name"))

        cfg, raw_cfg = call(root, "/api/game-config")
        values = cfg.get("values", {})
        check(values.get("item.steel_sword.name") == want["item.steel_sword.name"],
              "кириллица едет клиенту в UTF-8", values.get("item.steel_sword.name"))
        check(b"\\u" not in raw_cfg, "в ответе нет экранированных \\uXXXX")
        check(values.get("enemy.rat.hp") == 55, "число врага доехало",
              values.get("enemy.rat.hp"))
        check(values.get("floor.1.pool") == "golem, troll", "пул этажа доехал",
              values.get("floor.1.pool"))
        check(values.get("econ.goldBase") == 42, "число баланса доехало",
              values.get("econ.goldBase"))

        with open(CONFIG_FILE, encoding="utf-8") as fh:
            disk = json.load(fh)
        check(disk.get("values", {}).get("item.steel_sword.name") == want["item.steel_sword.name"],
              "файл на диске в UTF-8 без порчи")
        check(disk.get("v") == 1 and disk.get("updated"),
              "в файле есть версия и время", disk.get("updated"))

        schema, _ = call(root, "/api/admin/schema?token=" + urllib.parse.quote(token))
        fields = {f["key"]: f for f in schema.get("fields", [])}
        check(len(fields) >= 270, "схема отдаёт все поля", len(fields))
        check(fields.get("item.steel_sword.name", {}).get("kind") == "text",
              "имя предмета помечено текстом")
        check(fields.get("item.steel_sword.name", {}).get("maxlen") == 120,
              "у текста есть предел длины",
              fields.get("item.steel_sword.name", {}).get("maxlen"))
        check(fields.get("item.steel_sword.atk", {}).get("optional") is True,
              "поля контента необязательные (пусто = как в коде)")
        check(fields.get("enemy.rat.hp", {}).get("group") == "Враги по видам",
              "группа врагов названа по-русски")
        check(fields.get("econ.goldBase", {}).get("kind") == "number",
              "числа баланса на месте")
        check(set(fields) == {f["key"] for f in schema.get("fields", [])},
              "в схеме нет повторяющихся ключей")

        junk, _ = call(root, "/api/admin/save", {
            "token": token,
            "values": {"нет.такого.поля": 1, "enemy.rat.hp": 99999,
                       "item.steel_sword.name": "x" * 500}})
        problems = junk.get("problems") or []
        check(junk.get("ok") is False and len(problems) == 3,
              "мусор, выход за границы и длинный текст отбиты", problems)

        # Вопросы и задания: ключ строится по образцу, но имя поля сверяется.
        bank, _ = call(root, "/api/admin/save", {
            "token": token,
            "values": {"q.1.text": "Правленый вопрос из админки",
                       "q.1.a0": "Правленый вариант",
                       "q.1.right": 2,
                       "t.copy_hello.title": "Правленое название задания",
                       "t.copy_hello.code": "print(\"Привет!\")"}})
        check(bank.get("ok") is True, "правка вопроса и задания принята",
              bank.get("error", ""))
        bank_cfg, _ = call(root, "/api/game-config")
        bank_values = bank_cfg.get("values", {})
        check(bank_values.get("q.1.text") == "Правленый вопрос из админки",
              "текст вопроса доехал до клиента", bank_values.get("q.1.text"))
        check(bank_values.get("q.1.right") == 2, "номер верного варианта доехал",
              bank_values.get("q.1.right"))
        check(bank_values.get("t.copy_hello.code") == "print(\"Привет!\")",
              "код задания доехал", bank_values.get("t.copy_hello.code"))

        bank_junk, _ = call(root, "/api/admin/save", {
            "token": token,
            "values": {"q.1.нет_поля": "x", "t.copy_hello.tests": "x",
                       "q.1.right": 9, "t.copy_hello.text": "x"}})
        bank_problems = bank_junk.get("problems") or []
        check(bank_junk.get("ok") is False and len(bank_problems) == 4,
              "чужие поля вопроса и задания отбиты", bank_problems)
        still, _ = call(root, "/api/game-config")
        check(still.get("values", {}).get("q.1.text") == "Правленый вопрос из админки",
              "неудачная правка банка не сбила прежнюю")

        after_junk, _ = call(root, "/api/game-config")
        check(after_junk.get("values", {}).get("enemy.rat.hp") == 55,
              "неудачное сохранение не испортило прежние настройки")

        call(root, "/api/admin/save", {"token": token, "values": {"enemy.rat.hp": 60}})
        check(os.path.exists(BACKUP_FILE), "перед записью создаётся резервная копия")
        with open(BACKUP_FILE, encoding="utf-8") as fh:
            old = json.load(fh)
        check(isinstance(old, dict), "резервная копия — читаемый JSON")

        schema2, _ = call(root, "/api/admin/schema?token=" + urllib.parse.quote(token))
        meta = schema2.get("backup_meta") or {}
        check(meta.get("has_backup") is True, "схема сообщает о резервной копии", meta)
        check(bool(meta.get("updated")), "у копии есть метка времени", meta)

        # Кнопка «вернуть прошлую версию» меняет файл и копию местами. В файле
        # сейчас враг с 60 хитами, в копии — версия до этой правки, с 55.
        back1, _ = call(root, "/api/admin/restore", {"token": token})
        check(back1.get("ok") is True, "прошлая версия вернулась", back1.get("error", ""))
        back1_values = back1.get("values", {})
        check(back1_values.get("enemy.rat.hp") == 55,
              "вернулось прежнее число врага", back1_values.get("enemy.rat.hp"))
        check(back1_values.get("q.1.text") == "Правленый вопрос из админки",
              "вместе с числом вернулась и правка банка")
        after_restore, _ = call(root, "/api/game-config")
        check(after_restore.get("values", {}).get("enemy.rat.hp") == 55,
              "игру тоже вернуло к прошлой версии")

        # Повторный откат возвращает вперёд: неудачное нажатие обратимо.
        back2, _ = call(root, "/api/admin/restore", {"token": token})
        check(back2.get("ok") is True, "повторный откат принят")
        check(back2.get("values", {}).get("enemy.rat.hp") == 60,
              "повторный откат возвращает вперёд", back2.get("values", {}).get("enemy.rat.hp"))
        check((back2.get("backup_meta") or {}).get("has_backup") is True,
              "после отката копия осталась", back2.get("backup_meta"))

        naked, _ = call(root, "/api/admin/restore", {})
        check(naked.get("ok") is False, "откат без токена отбит")

        reset, _ = call(root, "/api/admin/reset", {"token": token})
        check(reset.get("ok") is True and reset.get("values") == {}, "сброс к стандарту")
        cleared, _ = call(root, "/api/game-config")
        check(cleared.get("values") == {}, "после сброса настроек нет")
        check(not os.path.exists(CONFIG_FILE), "сброс убирает файл настроек")

        # Без копии откатывать нечего — и панель должна объяснить это, а не
        # молчать: учитель нажимает кнопку и не понимает, что произошло.
        for path in (CONFIG_FILE, BACKUP_FILE):
            if os.path.exists(path):
                os.remove(path)
        nothing, _ = call(root, "/api/admin/restore", {"token": token})
        check(nothing.get("ok") is False, "откат без копии отбит")
        check("копии нет" in (nothing.get("error") or "").lower(),
              "и объясняет, почему", nothing.get("error"))
    finally:
        if proc is not None:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
        # Временные данные проверки никому не нужны; рабочая папка не тронута.
        shutil.rmtree(DATA_DIR, ignore_errors=True)

    if STATE["bad"]:
        print("\nРАСХОЖДЕНИЙ: %d" % STATE["bad"])
        return 1
    print("\nАдмин-панель: всё сходится.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
