#!/usr/bin/env python3
"""Локальный сервер для игры-теста по Python.

Запуск:
    python3 server.py                # локальная сеть (0.0.0.0:8000), студенты заходят по IP
    python3 server.py --local        # только этот компьютер (127.0.0.1)
    python3 server.py --port 8080    # другой начальный порт
    python3 server.py --no-code      # без выполнения кода студентов (безопаснее)
    python3 server.py --dev          # панель разработчика в подземелье

Если порт занят, сервер автоматически берёт следующий.
Не требует сторонних библиотек — только стандартная библиотека Python.
"""

import argparse
import base64
import contextlib
import copy
import csv
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import shlex
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Каталог изменяемых данных: users.json, results.json, social.db, настройки
# учителя, секреты и _backup. В обычном запуске это папка проекта. Проверки
# (verify_admin.py) подставляют сюда временный каталог через PYQUIZ_DATA_DIR,
# чтобы не читать и не переписывать настоящие данные класса.
DATA_DIR = os.path.abspath(os.environ.get("PYQUIZ_DATA_DIR") or BASE_DIR)

# Версия приложения: одна на сервер и на страницы. Показывается в шапке игры,
# на главной и в панелях учителя, печатается при запуске и отдаётся
# /api/version. Поднимаем её только вместе с записью в CHANGELOG.md: номер,
# за которым нет записи, ничего не сообщает. Правило:
#   PATCH — исправления, не меняющие правила игры;
#   MINOR — новые возможности и изменения поведения/баланса;
#   MAJOR — несовместимые изменения (формат сохранения, API).
# Формат сохранения G (data.v = 1) версией приложения не является.
VERSION = "1.8.0"
VERSION_DATE = "2026-10-24"

VERSION_CLIENT_JS = """
(function () {
  var info = window.__PYQUIZ_VERSION || {};
  var text = "v" + (info.version || "?") + (info.commit ? " · " + info.commit : "");
  function fill() {
    var nodes = document.querySelectorAll("[data-app-version]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = text;
      nodes[i].title = "Версия " + (info.version || "?") +
        (info.date ? " от " + info.date : "") +
        (info.commit ? ", коммит " + info.commit : "");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fill);
  } else {
    fill();
  }
  try {
    console.info("PyDungeon " + text + (info.date ? " (" + info.date + ")" : ""));
  } catch (e) {}
})();
"""

_VERSION_COMMIT = None


def version_commit():
    """Короткий хеш коммита, если рядом есть git. Без git — пустая строка."""
    global _VERSION_COMMIT
    if _VERSION_COMMIT is None:
        _VERSION_COMMIT = ""
        try:
            proc = subprocess.run(
                ["git", "rev-parse", "--short", "HEAD"],
                cwd=BASE_DIR, capture_output=True, text=True, timeout=2,
            )
            if proc.returncode == 0:
                _VERSION_COMMIT = proc.stdout.strip()
        except (OSError, subprocess.SubprocessError):
            pass
    return _VERSION_COMMIT


def version_payload():
    return {"version": VERSION, "date": VERSION_DATE, "commit": version_commit()}
STATIC_DIR = os.path.join(BASE_DIR, "static")
RESULTS_FILE = os.path.join(DATA_DIR, "results.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
# RLock, а не Lock: обновление пользователя читает и пишет файл одним же
# замком, а save_users внутри него тоже берёт замок.
_lock = threading.RLock()

# Копии перед занятием. Ученик может испортить вопрос через админ-панель,
# а код — и подавно: раньше ученический код мог переписать server.py.
# Снимок делается при старте сервера, откат — копированием файла обратно.
BACKUP_DIR = os.path.join(DATA_DIR, "_backup")
BACKUP_KEEP = 5
BACKUP_FILES = ("server.py", "questions.js", "code-tasks.js", "code-tasks-tests.json",
                "practice-variants.js", "variants.js", "users.json", "results.json",
                "game-config.json", "game-config.backup.json", "items.js",
                "dungeon-content.js", "village-content.js")


def make_backup():
    """Снимок файлов проекта и данных в _backup/<дата-время>/, с ротацией.

    Молча переживает ошибку: занятие не должно падать из-за бэкапа.
    Возвращает путь к свежему снимку или None.
    """
    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    target = os.path.join(BACKUP_DIR, stamp)
    try:
        os.makedirs(target, exist_ok=True)
        saved = 0
        for name in BACKUP_FILES:
            # Данные класса лежат в DATA_DIR, код и банки — в папке проекта.
            # При подменённом DATA_DIR снимок не должен утаскивать настоящие
            # users.json/results.json учителя во временный каталог.
            src = os.path.join(DATA_DIR, name)
            if not os.path.isfile(src):
                src = os.path.join(BASE_DIR, name)
            if not os.path.isfile(src) and (name.endswith(".js") or
                                            name == "code-tasks-tests.json"):
                # Банк вопросов, заданий и серверные тесты лежат в static/.
                src = os.path.join(STATIC_DIR, name)
            if not os.path.isfile(src):
                continue
            shutil.copyfile(src, os.path.join(target, name))
            saved += 1
        if not saved:
            shutil.rmtree(target, ignore_errors=True)
            return None
        olds = sorted(d for d in os.listdir(BACKUP_DIR)
                      if os.path.isdir(os.path.join(BACKUP_DIR, d)))
        for old in olds[:-BACKUP_KEEP]:
            shutil.rmtree(os.path.join(BACKUP_DIR, old), ignore_errors=True)
        return target
    except OSError:
        return None


def _hash_pin(pin, salt=None):
    import hashlib
    import secrets
    if salt is None:
        salt = secrets.token_hex(8)
    dk = hashlib.pbkdf2_hmac("sha256", str(pin).encode("utf-8"), salt.encode("utf-8"), 100000)
    return salt, dk.hex()


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def save_users(users):
    with _lock:
        tmp = USERS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
        os.replace(tmp, USERS_FILE)


def update_user(key, change):
    """Читает список пользователей, правит запись и сохраняет — под одним замком.

    Раньше файл читался вне замка, а замок брался только внутри save_users.
    Пара «прочитал → поправил → сохранил» не была атомарной, и два
    одновременных входа учеников теряли один из профилей: второй перезаписывал
    файл своей копией. change(users) возвращает текст ошибки, если запись
    трогать нельзя, и None, если всё прошло.
    """
    with _lock:
        users = load_users()
        error = change(users)
        if error is None:
            save_users(users)
        return users, error


AVATAR_COLORS = ["#2563eb", "#16a34a", "#db2777", "#f59e0b", "#7c3aed", "#0891b2", "#dc2626"]

SECRET_FILE = os.path.join(DATA_DIR, ".secret")
TOKEN_TTL = 60 * 60 * 24 * 30  # 30 дней


def _load_secret():
    env = os.environ.get("PYQUIZ_SECRET", "").strip()
    if env:
        return env.encode("utf-8")
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE, "rb") as f:
            return f.read().strip()
    val = secrets.token_hex(32).encode("utf-8")
    try:
        with open(SECRET_FILE, "wb") as f:
            f.write(val)
        os.chmod(SECRET_FILE, 0o600)
    except OSError:
        pass
    return val


SECRET = _load_secret()


def new_token(key):
    exp = int(time.time()) + TOKEN_TTL
    payload = "%s|%d" % (key, exp)
    sig = hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
    raw = (payload + "|" + sig).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def token_key(token):
    try:
        raw = base64.urlsafe_b64decode(str(token or "").encode("ascii")).decode("utf-8")
        key, exp_s, sig = raw.rsplit("|", 2)
        payload = "%s|%s" % (key, exp_s)
        good = hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, good):
            return None
        if int(exp_s) < int(time.time()):
            return None
        return key
    except (ValueError, TypeError):
        return None


# --- Админ-панель: числа баланса без редактирования кода ---
# Учитель открывает /admin, вводит пароль и правит числа игры. Значения
# ложатся в game-config.json рядом с server.py, поэтому их видят все ученики
# сразу после обновления страницы, а код остаётся нетронутым.
ADMIN_SECRET_FILE = os.path.join(DATA_DIR, ".admin-secret")
CONFIG_FILE = os.path.join(DATA_DIR, "game-config.json")
CONFIG_BACKUP_FILE = os.path.join(DATA_DIR, "game-config.backup.json")


def load_admin_pin():
    env = os.environ.get("PYQUIZ_ADMIN_PIN", "").strip()
    if env:
        return env
    try:
        with open(ADMIN_SECRET_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def ensure_admin_pin():
    """Без пароля панель была бы открыта всему классу, поэтому при первом
    запуске пароль генерируется и кладётся в .admin-secret — учитель найдёт
    его там же, где лежит .secret."""
    global ADMIN_PIN
    if ADMIN_PIN:
        return ADMIN_PIN
    pin = "%06d" % secrets.randbelow(1000000)
    try:
        with open(ADMIN_SECRET_FILE, "w", encoding="utf-8") as f:
            f.write(pin + "\n")
        os.chmod(ADMIN_SECRET_FILE, 0o600)
    except OSError:
        return ""
    ADMIN_PIN = pin
    return pin


ADMIN_PIN = load_admin_pin()
ensure_admin_pin()

ADMIN_TTL = 60 * 60 * 12  # 12 часов: смена урока переживёт, месяц — нет


def new_admin_token():
    exp = int(time.time()) + ADMIN_TTL
    payload = "admin-panel|%d" % exp
    sig = hmac.new(SECRET, (payload + "|panel").encode("utf-8"),
                   hashlib.sha256).hexdigest()[:32]
    raw = (payload + "|" + sig).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def admin_token_ok(token):
    try:
        raw = base64.urlsafe_b64decode(str(token or "").encode("ascii")).decode("utf-8")
        payload, sig = raw.rsplit("|", 1)
        if not payload.startswith("admin-panel|"):
            return False
        good = hmac.new(SECRET, (payload + "|panel").encode("utf-8"),
                        hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, good):
            return False
        return int(payload.split("|")[1]) >= int(time.time())
    except (ValueError, TypeError):
        return False


def admin_pin_ok(got):
    if not ADMIN_PIN:
        return False
    return hmac.compare_digest(str(got).encode("utf-8"), ADMIN_PIN.encode("utf-8"))


# Схема правок: ключ, раздел, подпись, границы и значение по умолчанию.
# Ключи совпадают с BALANCE_KEYS в static/game.js — игра и панель говорят на
# одном языке, а неизвестный ключ игра просто игнорирует.
BALANCE_FIELDS = [
    ("enemy.hpPerFloor", "Враги", "Здоровье врага: доля за этаж", 0.0, 1.0, 0.01, 0.10),
    ("enemy.dmgFlat", "Враги", "Урон врага: прибавка за этаж", 0.0, 3.0, 0.01, 0.32),
    ("enemy.dmgPct", "Враги", "Урон врага: доля за этаж", 0.0, 3.0, 0.01, 0.28),
    ("enemy.hpMul", "Враги", "Здоровье врагов: общий множитель (длина боя)", 0.5, 6.0, 0.05, 3.8),
    ("enemy.hpStart", "Враги", "Мягкий вход: доля здоровья на 1-м этаже", 0.1, 1.0, 0.05, 0.45),
    ("elite.hpMul", "Враги", "Элита: множитель здоровья", 1.0, 5.0, 0.05, 1.6),
    ("elite.dmgMul", "Враги", "Элита: множитель урона", 1.0, 5.0, 0.05, 1.25),
    ("elite.chanceBase", "Враги", "Элита: шанс на первом этаже", 0.0, 1.0, 0.01, 0.1),
    ("elite.chanceStep", "Враги", "Элита: прибавка шанса за этаж", 0.0, 0.5, 0.01, 0.02),
    ("elite.gold", "Враги", "Элита: золото сверху", 0.0, 500.0, 5.0, 45.0),
    ("squad.from", "Враги", "Отряды: с какого этажа", 1.0, 10.0, 1.0, 3.0),
    ("squad.chance", "Враги", "Отряды: шанс", 0.0, 1.0, 0.01, 0.22),
    ("squad.maxSize", "Враги", "Отряды: максимум монстров", 1.0, 6.0, 1.0, 3.0),
    ("endless.depthDmg", "Враги", "Бесконечность: урон за глубину", 0.0, 0.05, 0.001, 0.005),
    ("combat.aggro", "Бой и обзор", "Радиус, с которого враг замечает героя", 1.0, 12.0, 0.5, 3.0),
    ("combat.view", "Бой и обзор", "Радиус обзора героя", 1.0, 12.0, 0.2, 4.4),
    ("combat.darkView", "Бой и обзор", "Обзор в «Густой тьме»", 1.0, 12.0, 0.2, 2.6),
    ("combat.hazardDmg", "Бой и обзор", "Урон лавы за ход", 0.0, 60.0, 1.0, 7.0),
    ("combat.rangedDmg", "Бой и обзор", "Урон дальнобойных: множитель", 0.1, 2.0, 0.05, 0.55),
    ("combat.hintCap", "Бой и обзор", "Потолок силы удара с подсказкой", 0.5, 3.0, 0.05, 1.15),
    ("combat.streakStep", "Бой и обзор", "Прибавка за серию верных ответов", 0.0, 1.0, 0.05, 0.15),
    ("combat.streakCap", "Бой и обзор", "Предел серии верных ответов", 0.0, 20.0, 1.0, 5.0),
    ("combat.missStep", "Бой и обзор", "Ошибка подряд: прибавка к удару врага", 0.0, 2.0, 0.05, 0.5),
    ("combat.missCap", "Бой и обзор", "Ошибка подряд: потолок удара врага", 1.0, 5.0, 0.05, 2.5),
    ("player.levelDmg", "Герой", "Урон за новый уровень", 0.0, 50.0, 1.0, 3.0),
    ("player.levelHp", "Герой", "Здоровье за новый уровень", 0.0, 200.0, 5.0, 22.0),
    ("player.xpBase", "Герой", "Опыт до уровня: 50 × уровень", 5.0, 500.0, 5.0, 50.0),
    ("econ.goldBase", "Экономика", "Золото за обычного монстра", 0.0, 500.0, 5.0, 15.0),
    ("econ.goldDepth", "Экономика", "Награда: доля за этаж", 0.0, 3.0, 0.01, 0.32),
    ("econ.bossGold", "Экономика", "Золото за дракона", 0.0, 2000.0, 10.0, 100.0),
    ("econ.priceDepth", "Экономика", "Цены и ценности: доля за этаж", 0.0, 3.0, 0.01, 0.22),
    ("econ.sellRate", "Экономика", "Доля цены при продаже", 0.05, 1.0, 0.05, 0.5),
    ("econ.shopMarkup", "Экономика", "Наценка без торговца", 1.0, 5.0, 0.1, 1.5),
    ("econ.forgeBase", "Кузница", "Цена первого улучшения", 0.0, 2000.0, 10.0, 60.0),
    ("econ.forgeStep", "Кузница", "Во сколько раз дороже каждый уровень", 1.0, 4.0, 0.05, 1.35),
    ("econ.forgeDepth", "Кузница", "Кузница: доля за этаж", 0.0, 3.0, 0.01, 0.3),
    ("econ.forgeAtk", "Кузница", "Урон за уровень заточки", 0.0, 50.0, 1.0, 3.0),
    ("econ.forgeDef", "Кузница", "Защита за уровень брони", 0.0, 50.0, 1.0, 2.0),
    ("econ.forgeHp", "Кузница", "Здоровье за уровень закалки", 0.0, 200.0, 5.0, 15.0),
    ("difficulty.easy.enemyScale", "Сложность", "Лёгкий: множитель врагов", 0.1, 3.0, 0.05, 0.85),
    ("difficulty.normal.enemyScale", "Сложность", "Обычный: множитель врагов", 0.1, 3.0, 0.05, 1.0),
    ("difficulty.hard.enemyScale", "Сложность", "Сложный: множитель врагов", 0.1, 3.0, 0.05, 1.5),
    ("difficulty.easy.qBonus", "Сложность", "Лёгкий: сдвиг уровня вопросов", -3.0, 3.0, 1.0, -1.0),
    ("difficulty.normal.qBonus", "Сложность", "Обычный: сдвиг уровня вопросов", -3.0, 3.0, 1.0, 0.0),
    ("difficulty.hard.qBonus", "Сложность", "Сложный: сдвиг уровня вопросов", -3.0, 3.0, 1.0, 1.0),
    ("hazard.frost", "Среда", "Ледяная корка: плотность", 0.0, 0.6, 0.01, 0.1),
    ("hazard.lava", "Среда", "Лавовые разломы: плотность", 0.0, 0.6, 0.01, 0.07),
    ("guard.hpMul", "Страж этажа", "Страж: множитель здоровья", 1.0, 5.0, 0.05, 1.5),
    ("guard.dmgMul", "Страж этажа", "Страж: множитель урона", 1.0, 5.0, 0.05, 1.1),
    ("learn.reviewChance", "Обучение", "Доля боёв-повторений с 3-го этажа", 0.0, 1.0, 0.05, 0.3),
    ("learn.floorTopic", "Обучение", "Доля боёв на тему этажа", 0.0, 1.0, 0.05, 0.4),
    ("hub.deathGoldShare", "Деревня", "Смерть: доля золота, уцелевшая в деревне", 0.0, 1.0, 0.05, 1.0),
    ("hub.amuletPrice", "Деревня", "Амулет возврата: цена в лавке деревни", 0.0, 2000.0, 10.0, 150.0),
    ("hub.amuletFindChance", "Деревня", "Амулет возврата: шанс найти в сундуке", 0.0, 1.0, 0.01, 0.02),
    ("hub.amuletMax", "Деревня", "Амулет возврата: потолок у героя", 0.0, 10.0, 1.0, 3.0),
    ("village.view", "Деревня", "Радиус обзора в деревне", 2.0, 20.0, 0.5, 9.0),
    ("combat.skipShare", "Бой и обзор", "Пропуск вопроса: доля здоровья", 0.05, 0.6, 0.05, 0.2),
    ("deep.from", "Глубина", "С какого этажа начинается глубинная тяжесть", 1.0, 10.0, 1.0, 5.0),
    ("deep.hpMul", "Глубина", "Глубина: прибавка здоровья врага за этаж", 0.0, 1.0, 0.01, 0.08),
    ("deep.dmgMul", "Глубина", "Глубина: прибавка урона врага за этаж", 0.0, 1.0, 0.01, 0.06),
    ("hero.hpStep", "Улучшения героя", "Здоровье: прибавка за уровень", 0.0, 100.0, 1.0, 12.0),
    ("hero.dmgStep", "Улучшения героя", "Сила: прибавка урона за уровень", 0.0, 20.0, 0.5, 2.0),
    ("hero.lootStep", "Улучшения героя", "Добыча: прибавка золота за уровень", 0.0, 0.5, 0.01, 0.12),
    ("hero.armorStep", "Улучшения героя", "Броня: доля гасимого урона за уровень", 0.0, 0.3, 0.01, 0.08),
    ("hero.hpPrice", "Улучшения героя", "Здоровье: цена первого уровня", 0.0, 2000.0, 5.0, 40.0),
    ("hero.dmgPrice", "Улучшения героя", "Сила: цена первого уровня", 0.0, 2000.0, 5.0, 50.0),
    ("hero.potionsPrice", "Улучшения героя", "Зелья: цена первого уровня", 0.0, 2000.0, 5.0, 60.0),
    ("hero.lootPrice", "Улучшения героя", "Добыча: цена первого уровня", 0.0, 2000.0, 5.0, 55.0),
    ("hero.armorPrice", "Улучшения героя", "Броня: цена первого уровня", 0.0, 2000.0, 5.0, 70.0),
    ("hero.priceStep", "Улучшения героя", "Во сколько раз дороже каждый уровень", 1.0, 4.0, 0.05, 1.55),
    ("village.wellHp", "Развитие деревни", "Колодец: здоровье за уровень постройки", 0.0, 100.0, 5.0, 10.0),
    ("village.barnBonus", "Развитие деревни", "Амбар: прибавка к находкам материалов", 0.0, 2.0, 0.05, 0.5),
    ("village.costMul", "Развитие деревни", "Во сколько раз дороже постройки", 0.2, 3.0, 0.05, 1.0),
    ("loot.oreChance", "Материалы", "Руда: шанс находки", 0.0, 1.0, 0.01, 0.45),
    ("loot.woodChance", "Материалы", "Древесина: шанс находки", 0.0, 1.0, 0.01, 0.45),
    ("loot.shardChance", "Материалы", "Обломки: шанс находки с шестого этажа", 0.0, 1.0, 0.01, 0.35),
    ("quest.gold", "Квесты", "Награда за квест: золото", 0.0, 2000.0, 10.0, 60.0),
    ("quest.material", "Квесты", "Награда за квест: материалов", 0.0, 20.0, 1.0, 2.0),
    ("combat.braceCut", "Действия в бою", "Оборона: доля урона, которая проходит", 0.0, 1.0, 0.05, 0.5),
    ("combat.fleeHit", "Действия в бою", "Отступление: доля прощального удара", 0.0, 1.5, 0.05, 1.0),
    ("ability.charges", "Действия в бою", "Умение: зарядов на поход", 0.0, 6.0, 1.0, 2.0),
    ("ability.strikeMul", "Действия в бою", "«Точный удар»: множитель урона", 1.0, 4.0, 0.25, 2.0),
    ("ability.breath", "Действия в бою", "«Второе дыхание»: доля возвращённого здоровья", 0.1, 1.0, 0.05, 0.4),
    ("rest.heal", "Привал", "Костёр: доля возвращённого здоровья", 0.0, 1.0, 0.05, 0.35),
    ("rest.perRun", "Привал", "Костёр: сколько привалов на поход", 0.0, 6.0, 1.0, 2.0),
]

# Пояснения к числам баланса: панель показывает их во всплывающем окне,
# когда учитель наводит мышь на подпись поля. Ключи те же, что выше,
# поэтому таблица границ остаётся ровно семиэлементной.
BALANCE_HINTS = {
    "enemy.hpPerFloor": "Здоровье врага растёт с этажом: базовое × (1 + доля × номер этажа). При 0,10 на шестом этаже враг примерно на четверть толще, чем на первом.",
    "enemy.dmgFlat": "Сколько урона прибавляется врагу за каждый этаж, в единицах урона. Складывается с базовым уроном вида.",
    "enemy.dmgPct": "Вторая прибавка к урону за этаж, но в долях от собственного урона врага: сильные виды растут быстрее слабых.",
    "enemy.hpStart": "Какую долю от полной толщины получает враг на первом этаже: к седьмому этажу доля доходит до единицы. Чем меньше, тем короче бои в начале — а именно длина боя решает, пройдёт ли слабый ученик первые этажи.",
    "enemy.hpMul": "Во сколько раз все враги толще базового. Задаёт длину боя: бой идёт несколько заданий — вопрос и практика на одну тему. Опыт за врага от этого множителя не растёт.",
    "elite.hpMul": "Во сколько раз элитный враг здоровее обычного.",
    "elite.dmgMul": "Во сколько раз элитный враг бьёт сильнее обычного.",
    "elite.chanceBase": "Вероятность, что монстр окажется элитным на первом этаже: 0,1 — примерно каждый десятый.",
    "elite.chanceStep": "Насколько вероятность элиты прибавляется с каждым следующим этажом.",
    "elite.gold": "Сколько золота сверх обычной награды даёт элитный враг.",
    "squad.from": "С какого этажа монстры начинают ходить отрядами. Раньше этого этажа они попадаются поодиночке.",
    "squad.chance": "Вероятность, что вместо одиночки появится отряд.",
    "squad.maxSize": "Сколько монстров бывает в отряде: от двух до этого числа.",
    "combat.aggro": "С какого расстояния враг замечает героя: дальше он стоит на месте, ближе — идёт к герою или начинает обстрел.",
    "combat.view": "Сколько клеток вокруг героя открыто на карте. Всё за этим радиусом остаётся неисследованным.",
    "combat.darkView": "Радиус обзора на этажах с опасной средой «Густая тьма»: там видно меньше обычного.",
    "combat.hazardDmg": "Урон лавы за один ход: к этому числу прибавляется номер этажа, а затем урон уменьшает броня.",
    "combat.rangedDmg": "Множитель урона дальнобойных врагов (летучая мышь, паук, призрак) вместо их обычного удара.",
    "combat.hintCap": "Выше этого множителя удар не разогнать, если ответ был с подсказкой: подсказка стоит здоровья и силы не даёт.",
    "combat.streakStep": "Прибавка к силе удара за каждый верный ответ подряд: 0,15 — это +15 % за ответ в серии.",
    "combat.streakCap": "Сколько верных ответов подряд считается в серии: дальше прибавка не растёт.",
    "combat.missStep": "Насколько сильнее бьёт враг за каждую ошибку подряд в одном бою: 0,5 — вторая ошибка ×1,5, третья ×2. Верный ответ сбрасывает счёт. Тыкать наугад становится опасно, а редкая ошибка почти ничего не стоит.",
    "combat.missCap": "Выше этого множителя удар за ошибки подряд не растёт.",
    "player.levelDmg": "Насколько растёт базовый урон героя с каждым новым уровнем.",
    "player.levelHp": "Насколько растёт максимальное здоровье героя с каждым новым уровнем.",
    "player.xpBase": "Опыт до следующего уровня: это число умножается на текущий уровень героя.",
    "econ.goldBase": "Золото за обычного монстра на первом этаже, до поправки на глубину.",
    "econ.goldDepth": "Поправка награды на глубину: золото × (1 + доля × номер этажа).",
    "econ.bossGold": "Золото за победу над драконом.",
    "econ.priceDepth": "Поправка цен на глубину: цена вещи в лавке × (1 + доля × номер этажа).",
    "econ.sellRate": "Какую долю цены предмета возвращает торговец, когда герой продаёт вещь.",
    "econ.shopMarkup": "Во сколько раз дороже покупка на этаже, где нет торговца.",
    "econ.forgeBase": "Цена первого улучшения в кузнице.",
    "econ.forgeStep": "Во сколько раз дорожает каждое следующее улучшение в кузнице.",
    "econ.forgeDepth": "Поправка цен кузницы на глубину: цена × (1 + доля × номер этажа).",
    "econ.forgeAtk": "Сколько урона даёт каждый уровень заточки оружия.",
    "econ.forgeDef": "Сколько защиты даёт каждый уровень укрепления брони.",
    "econ.forgeHp": "Сколько здоровья даёт каждый уровень закалки тела.",
    "difficulty.easy.enemyScale": "Множитель здоровья и урона врагов на лёгком уровне сложности.",
    "difficulty.normal.enemyScale": "Множитель здоровья и урона врагов на обычном уровне сложности.",
    "difficulty.hard.enemyScale": "Множитель здоровья и урона врагов на сложном уровне сложности.",
    "difficulty.easy.qBonus": "Сдвиг уровня вопросов на лёгком уровне: −1 значит вопросы на ступень проще.",
    "difficulty.normal.qBonus": "Сдвиг уровня вопросов на обычном уровне: 0 — вопросы берутся как есть.",
    "difficulty.hard.qBonus": "Сдвиг уровня вопросов на сложном уровне: +1 значит вопросы на ступень сложнее.",
    "hazard.frost": "Доля клеток карты под ледяной коркой. На льду герой скользит, и монстры успевают сделать лишний шаг.",
    "hazard.lava": "Доля клеток карты с лавовыми разломами. На лаве герой получает урон за каждый ход (см. «Урон лавы за ход»).",
    "guard.hpMul": "Во сколько раз страж лестницы здоровее обычного врага своего вида. Пока страж жив, спуститься на следующий этаж нельзя.",
    "guard.dmgMul": "Во сколько раз страж лестницы бьёт сильнее обычного врага своего вида.",
    "learn.reviewChance": "Доля боёв, начиная с третьего этажа, по теме прошлых этажей: сначала той, где больше ошибок и что дольше не встречалась.",
    "learn.floorTopic": "Доля боёв на «Тему этажа» из планки входа, если по ней есть вопросы уровня этажа. Остальные бои берут темы по уровню вопросов этажа.",
    "hub.deathGoldShare": "Сколько походного золота переходит в деревню после гибели героя. Единица — герой не теряет ничего: найденное копится на улучшения, а стена впереди держится силой врагов, а не потерей ресурсов.",
    "hub.amuletPrice": "Сколько золота стоит амулет возврата в лавке деревни. Амулет даёт второй шанс: возрождает героя на месте, сохраняя поход.",
    "hub.amuletFindChance": "С каким шансом в сундуке вместо предмета лежит амулет возврата. С элит и дракона он падает отдельным розыгрышем.",
    "hub.amuletMax": "Сколько амулетов возврата герой может унести. В деревне дороже этого числа не продают, а находки сверх потолка не копятся.",
    "village.view": "На сколько клеток вокруг героя видно в деревне. В подземелье обзор мал (там фонарь), а в деревне большой: уровень открывают по мере обхода, но вслепую искать дома в хабе незачем.",
    "endless.depthDmg": "Надбавка к урону врагов в бесконечном режиме: урон умножается на (1 + надбавка × глубину²), где глубина — число этажей за десятым. Ноль — бесконечность снова становится прогулкой.",
    "combat.skipShare": "Сколько здоровья стоит пропустить вопрос в бою — доля от максимума героя. Пропуск засчитывается как пробел по теме и возвращается призраком ошибки, а враг при этом не бьёт.",
    "deep.from": "Этаж, с которого начинается глубинная тяжесть. Всё, что глубже, получает прибавку к здоровью и урону врагов (два следующих числа). Именно здесь кончается первый поход новичка.",
    "deep.hpMul": "Прибавка к здоровью врагов за каждый этаж глубже указанного, в долях: здоровье множится на (1 + прибавка) в степени глубины. При 0,08 на двадцатом этаже враги примерно втрое толще номинальных — и это окупается прокачкой героя.",
    "deep.dmgMul": "Прибавка к урону врагов за каждый этаж глубже указанного, в долях, так же как здоровье. Растёт медленнее здоровья: бой должен удлиняться, а не убивать с одного удара.",
    "hero.hpStep": "Сколько здоровья добавляет каждый уровень улучшения «Здоровье» в кузнице. Действует в каждом походе.",
    "hero.dmgStep": "Сколько урона добавляет каждый уровень улучшения «Сила».",
    "hero.lootStep": "Какая доля золота добавляется за уровень улучшения «Добыча». 0,12 — плюс 12% к каждой находке, включая награды за квесты.",
    "hero.armorStep": "Какую долю входящего урона гасит каждый уровень улучшения «Броня». 0,08 — минус 8% урона от каждого удара.",
    "hero.hpPrice": "Цена первого уровня улучшения «Здоровье» в золоте. Дальше цена растёт ступенью (см. «Во сколько раз дороже каждый уровень»).",
    "hero.dmgPrice": "Цена первого уровня улучшения «Сила».",
    "hero.potionsPrice": "Цена первого уровня улучшения «Зелья»: +1 зелье на старте каждого похода.",
    "hero.lootPrice": "Цена первого уровня улучшения «Добыча».",
    "hero.armorPrice": "Цена первого уровня улучшения «Броня».",
    "hero.priceStep": "Во сколько раз дороже каждый следующий уровень улучшения. Задаёт, за сколько походов копится улучшение: чем больше ступень, тем длиннее путь к последнему уровню.",
    "village.wellHp": "Сколько здоровья даёт восстановленный колодец на каждый поход. Второй уровень постройки удваивает прибавку.",
    "village.barnBonus": "На сколько больше материалов находит герой, когда амбар восстановлен. 0,5 — плюс половина к каждой находке материалов.",
    "village.costMul": "Во сколько раз дороже (или дешевле) восстановление любой постройки деревни. Один общий множитель скорости развития деревни.",
    "loot.oreChance": "С каким шансом находка в подземелье оказывается рудой. Руда встречается на жилах с третьего этажа, её требуют колодец, кузница и часть квестов.",
    "loot.woodChance": "С каким шансом находка оказывается древесиной: она идёт на амбар и кузницу и попадается на мелких этажах.",
    "loot.shardChance": "С каким шансом находка оказывается обломком. Обломки появляются только с шестого этажа и нужны для второго уровня кузницы и для дома мастера — они и есть причина спускаться глубже.",
    "quest.gold": "Сколько золота даёт староста за выполненное повторяемое задание. К сюжетным наградам это не относится.",
    "quest.material": "Сколько материалов даёт староста за выполненное повторяемое задание.",
    "combat.braceCut": "Какую долю удара врага пропускает оборона. 0,5 — защита ослабляет удар вдвое, но ход пропущен и враг бьёт: переждать выгодно не всегда, а враги с «огнём» и «натиском» за время защиты только крепнут.",
    "combat.fleeHit": "Какую долю своего удара враг наносит, когда герой отступает из боя. 1,0 — полный удар: убежать можно, но не бесплатно.",
    "ability.charges": "Сколько раз за поход можно применить умение. Заряды пополняются у костра.",
    "ability.strikeMul": "Во сколько раз сильнее бьёт «Точный удар» — умение, которое награждает верный ответ.",
    "ability.breath": "Какую долю здоровья возвращает «Второе дыхание» и заодно снимает яд.",
    "rest.heal": "Какую долю здоровья возвращает привал у костра.",
    "rest.perRun": "Сколько раз за поход можно отдохнуть у костров. 0 — привалов нет вовсе. Амбар в деревне добавляет один отдых.",
}

BALANCE_SPEC = {}
for _key, _group, _label, _lo, _hi, _step, _default in BALANCE_FIELDS:
    BALANCE_SPEC[_key] = {
        "key": _key, "group": _group, "label": _label,
        "min": _lo, "max": _hi, "step": _step, "default": _default,
        "kind": "number", "optional": False, "hint": BALANCE_HINTS.get(_key, ""),
    }

# --- Содержимое игры: предметы, виды врагов, этажи ---
# Учителю мало чисел баланса: нужно переименовать предмет, поправить его урон,
# ослабить конкретный вид врага или сузить пул монстров на этаже. Поэтому
# каталог ниже перечисляет, какие поля контента вообще существуют, а
# стандартное значение у них не хранится — пустое поле значит «как в коде».
# Список сверяется с настоящими таблицами static/*.js проверкой check.py:
# если предмет переименуют в коде, а каталог забудут, тест это покажет.
#
# Формат: (id в коде, подпись в панели, поля). "~" отмечает текстовое поле.
ITEM_FIELDS = [
    ("rusty_sword", "Ржавый меч", "~name|~desc|atk"),
    ("bone_dagger", "Костяной кинжал", "~name|~desc|atk|eff.pct"),
    ("short_sword", "Короткий меч", "~name|~desc|atk"),
    ("vampiric_blade", "Пиявка-лезвие", "~name|~desc|atk|eff.pct"),
    ("steel_sword", "Стальной меч", "~name|~desc|atk"),
    ("trident_precise", "Тройник", "~name|~desc|atk|eff.chance|eff.mul"),
    ("dragon_blade", "Клинок дракона", "~name|~desc|atk|eff.chance|eff.mul"),
    ("frost_blade", "Морозный клинок", "~name|~desc|atk|eff.pct"),
    ("cloth_robe", "Тканевая роба", "~name|~desc|def|hp"),
    ("leather_armor", "Кожаная броня", "~name|~desc|def|hp"),
    ("spiked_shield", "Шипастый щит", "~name|~desc|def|hp|eff.pct"),
    ("chainmail", "Кольчуга", "~name|~desc|def|hp"),
    ("mirror_plate", "Зеркальный панцирь", "~name|~desc|def|hp|eff.charges"),
    ("dragon_scale", "Чешуя дракона", "~name|~desc|def|hp"),
    ("aegis", "Эгида", "~name|~desc|def|hp|eff.charges"),
    ("ring_power", "Кольцо силы", "~name|~desc|atk"),
    ("guard_amulet", "Амулет защиты", "~name|~desc|def"),
    ("ledger_amulet", "Амулет-бухгалтер", "~name|~desc|atk|def|eff.pct"),
    ("lucky_charm", "Талисман удачи", "~name|~desc|atk|def|eff.charges"),
    ("scout_lens", "Линза разведчика", "~name|~desc|def"),
    ("serpent_ward", "Оберег от змей", "~name|~desc|hp"),
    ("hero_medal", "Медаль героя", "~name|~desc|atk|hp|eff.chance|eff.mul"),
    ("crown", "Корона власти", "~name|~desc|atk|def|hp|eff.pct"),
    ("small_potion", "Малое зелье", "~name|~desc"),
    ("big_potion", "Большое зелье", "~name|~desc"),
    ("antidote", "Противоядие", "~name|~desc"),
    ("elixir", "Эликсир жизни", "~name|~desc"),
    ("greater_elixir", "Великий эликсир", "~name|~desc"),
    ("purifying_draught", "Очищающий настой", "~name|~desc"),
]

ENEMY_FIELDS = [
    ("slime", "Слизь", "~name|hp|dmg"),
    ("rat", "Крыса", "~name|hp|dmg"),
    ("bat", "Летучая мышь", "~name|hp|dmg|range"),
    ("skeleton", "Скелет", "~name|hp|dmg"),
    ("goblin", "Гоблин", "~name|hp|dmg"),
    ("spider", "Паук", "~name|hp|dmg|range"),
    ("orc", "Орк", "~name|hp|dmg"),
    ("troll", "Тролль", "~name|hp|dmg"),
    ("ghost", "Призрак", "~name|hp|dmg|range"),
    ("wolf", "Волк", "~name|hp|dmg"),
    ("zombie", "Зомби", "~name|hp|dmg"),
    ("golem", "Голем", "~name|hp|dmg"),
    ("demon", "Демон", "~name|hp|dmg"),
    ("minotaur", "Минотавр", "~name|hp|dmg"),
    ("vampire", "Вампир", "~name|hp|dmg"),
    ("lich", "Лич", "~name|hp|dmg"),
    ("shieldman", "Щитоносец", "~name|hp|dmg"),
    ("priest", "Жрица", "~name|hp|dmg"),
    ("necromancer", "Некромант", "~name|hp|dmg"),
    ("dragon", "Дракон", "~name|hp|dmg"),
]

FLOOR_FIELDS = [
    ("Пещеры новичка", "~name|~pool|count|w|h|qmin|qmax"),
    ("Пещеры новичка", "~name|~pool|count|w|h|qmin|qmax"),
    ("Пещеры новичка", "~name|~pool|count|w|h|qmin|qmax"),
    ("Гоблин-вожак", "~name|~pool|count|w|h|qmin|qmax"),
    ("Забытые катакомбы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Забытые катакомбы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Забытые катакомбы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Некромант", "~name|~pool|count|w|h|qmin|qmax"),
    ("Ледяные залы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Ледяные залы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Ледяные залы", "~name|~pool|count|w|h|qmin|qmax"),
    ("Король големов", "~name|~pool|count|w|h|qmin|qmax"),
    ("Обитель демонов", "~name|~pool|count|w|h|qmin|qmax"),
    ("Обитель демонов", "~name|~pool|count|w|h|qmin|qmax"),
    ("Обитель демонов", "~name|~pool|count|w|h|qmin|qmax"),
    ("Владыка демонов", "~name|~pool|count|w|h|qmin|qmax"),
    ("Логово дракона", "~name|~pool|count|w|h|qmin|qmax"),
    ("Логово дракона", "~name|~pool|count|w|h|qmin|qmax"),
    ("Логово дракона", "~name|~pool|count|w|h|qmin|qmax"),
    ("Дракон", "~name|~pool|count|w|h|qmin|qmax"),
]

# Подписи и границы числовых полей контента: поле -> (подпись, от, до, шаг).
CONTENT_LIMITS = {
    "atk": ("урон", 0.0, 999.0, 1.0),
    "def": ("защита", 0.0, 999.0, 1.0),
    "hp": ("здоровье", 0.0, 9999.0, 5.0),
    "dmg": ("урон", 0.0, 999.0, 1.0),
    "eff.pct": ("эффект, процент", 0.0, 200.0, 5.0),
    "eff.charges": ("заряды эффекта", 0.0, 9.0, 1.0),
    "eff.chance": ("шанс эффекта, доля", 0.0, 1.0, 0.05),
    "eff.mul": ("множитель эффекта", 1.0, 10.0, 0.5),
    "range": ("дальность атаки", 1.0, 9.0, 1.0),
    "count": ("монстров на этаже", 0.0, 60.0, 1.0),
    "w": ("ширина карты", 20.0, 80.0, 2.0),
    "h": ("высота карты", 16.0, 60.0, 2.0),
    "qmin": ("уровень вопросов от", 1.0, 4.0, 1.0),
    "qmax": ("уровень вопросов до", 1.0, 4.0, 1.0),
}

# Текстовые поля: имя -> (подпись, предельная длина).
CONTENT_TEXT = {
    "name": ("название", 120),
    "desc": ("описание", 400),
    "pool": ("пул монстров через запятую", 240),
}

# Пояснения к полям содержимого: то же, что у чисел баланса, но общее для всех
# записей — поле «урон» у любого меча значит одно и то же.
CONTENT_HINTS = {
    "name": "Название: под ним запись показывается в игре. Пусто — остаётся имя из кода.",
    "desc": "Описание: строка под предметом в сумке и в лавке. Пусто — описание из кода.",
    "pool": "Ключи видов монстров через запятую (slime, rat, bat). Пусто — пул из кода.",
    "atk": "Сколько урона прибавляет предмет, когда он надет.",
    "def": "Сколько защиты прибавляет предмет, когда он надет.",
    "hp": "Сколько здоровья прибавляет предмет, когда он надет.",
    "dmg": "Базовый урон этого вида врага — до поправок на этаж и сложность.",
    "eff.pct": "Процент особого свойства предмета: добивание раненых, золото за верные ответы и подобное.",
    "eff.charges": "Сколько зарядов у особого свойства предмета.",
    "eff.chance": "Вероятность срабатывания особого свойства: доля от 1 (0,5 — каждый второй раз).",
    "eff.mul": "Во сколько раз особое свойство усиливает эффект.",
    "range": "Дальность атаки: с какого расстояния враг бьёт, не подходя вплотную.",
    "count": "Сколько монстров живёт на этаже.",
    "w": "Ширина карты этажа в клетках.",
    "h": "Высота карты этажа в клетках.",
    "qmin": "Нижняя граница уровня вопросов на этаже.",
    "qmax": "Верхняя граница уровня вопросов на этаже.",
}

CONTENT_SPEC = {}


def _add_content_field(key, group, label, kind, lo, hi, step, limit, hint=""):
    CONTENT_SPEC[key] = {
        "key": key, "group": group, "label": label,
        "min": lo, "max": hi, "step": step, "default": None,
        "kind": kind, "optional": True, "maxlen": limit, "hint": hint,
    }


def _build_content_spec():
    for iid, label, fields in ITEM_FIELDS:
        for field in fields.split("|"):
            if field.startswith("~"):
                name = field[1:]
                caption, limit = CONTENT_TEXT[name]
                _add_content_field("item.%s.%s" % (iid, name), "Предметы",
                                   "%s: %s" % (label, caption), "text",
                                   1.0, float(limit), 1.0, limit,
                                   CONTENT_HINTS.get(name, ""))
            else:
                caption, lo, hi, step = CONTENT_LIMITS[field]
                _add_content_field("item.%s.%s" % (iid, field), "Предметы",
                                   "%s: %s" % (label, caption), "number", lo, hi, step, 0,
                                   CONTENT_HINTS.get(field, ""))
    for ekey, label, fields in ENEMY_FIELDS:
        for field in fields.split("|"):
            if field.startswith("~"):
                name = field[1:]
                caption, limit = CONTENT_TEXT[name]
                _add_content_field("enemy.%s.%s" % (ekey, name), "Враги по видам",
                                   "%s: %s" % (label, caption), "text",
                                   1.0, float(limit), 1.0, limit,
                                   CONTENT_HINTS.get(name, ""))
            else:
                caption, lo, hi, step = CONTENT_LIMITS[field]
                _add_content_field("enemy.%s.%s" % (ekey, field), "Враги по видам",
                                   "%s: %s" % (label, caption), "number", lo, hi, step, 0,
                                   CONTENT_HINTS.get(field, ""))
    for index, (label, fields) in enumerate(FLOOR_FIELDS, start=1):
        for field in fields.split("|"):
            if field.startswith("~"):
                name = field[1:]
                caption, limit = CONTENT_TEXT[name]
                _add_content_field("floor.%d.%s" % (index, name), "Этажи",
                                   "Этаж %d (%s): %s" % (index, label, caption), "text",
                                   1.0, float(limit), 1.0, limit,
                                   CONTENT_HINTS.get(name, ""))
            else:
                caption, lo, hi, step = CONTENT_LIMITS[field]
                _add_content_field("floor.%d.%s" % (index, field), "Этажи",
                                   "Этаж %d (%s): %s" % (index, label, caption), "number",
                                   lo, hi, step, 0, CONTENT_HINTS.get(field, ""))


_build_content_spec()

# --- Вопросы и задания ---
# Банк вопросов и заданий переписывать в каталог нельзя: 85 вопросов и 43
# задания — это сотни полей, которые разъедутся с static/*.js на первой же
# правке. Поэтому здесь заданы только ИМЕНА полей и их границы, а сам список
# вопросов страница берёт из настоящих файлов и строит ключи
# «q.<id>.<поле>» и «t.<id>.<поле>». Мусор всё равно не пройдёт: имя поля
# сверяется с таблицей ниже, а id — с образцом.
QUESTION_FIELDS = {
    "text": ("текст вопроса", "text", 400),
    "a0": ("вариант A", "text", 160),
    "a1": ("вариант B", "text", 160),
    "a2": ("вариант C", "text", 160),
    "a3": ("вариант D", "text", 160),
    "right": ("номер верного варианта", "number", 0.0, 3.0, 1.0),
    "explain": ("разбор ответа", "text", 600),
    "level": ("уровень", "number", 1.0, 4.0, 1.0),
    "topic": ("тема", "text", 40),
}

TASK_FIELDS = {
    "title": ("название", "text", 120),
    "task": ("условие", "text", 700),
    "explain": ("разбор", "text", 700),
    "code": ("код задания", "text", 700),
    "starter": ("заготовка кода", "text", 700),
    "right": ("номер верного варианта", "number", 0.0, 3.0, 1.0),
    "level": ("уровень", "number", 1.0, 4.0, 1.0),
    "topic": ("тема", "text", 40),
}

CONTENT_ID_RE = re.compile(r"^[a-z0-9_]{1,32}$")
_QUESTION_GROUP = "Вопросы"
_TASK_GROUP = "Задания"


def content_pattern_spec(key):
    """Описание поля вопроса или задания по образцу ключа.

    Ключ вопроса — «q.<номер>.<поле>», задания — «t.<имя>.<поле>». Возвращает
    такое же описание, как у остальных полей, или None, если ключ не подходит.
    """
    parts = str(key).split(".")
    if len(parts) != 3:
        return None
    table, obj_id, field = parts
    if table == "q":
        fields, group, what = QUESTION_FIELDS, _QUESTION_GROUP, "Вопрос"
    elif table == "t":
        fields, group, what = TASK_FIELDS, _TASK_GROUP, "Задание"
    else:
        return None
    if not CONTENT_ID_RE.match(obj_id):
        return None
    info = fields.get(field)
    if not info:
        return None
    caption, kind = info[0], info[1]
    spec = {
        "key": key, "group": group,
        "label": "%s %s: %s" % (what, obj_id, caption),
        "kind": kind, "optional": True, "default": None, "maxlen": 0,
    }
    if kind == "text":
        spec.update(min=1.0, max=float(info[2]), step=1.0, maxlen=info[2])
    else:
        spec.update(min=float(info[2]), max=float(info[3]), step=float(info[4]))
    return spec


def field_spec(key):
    """Описание поля: сначала точный каталог, затем образец вопросов и заданий."""
    spec = FIELD_SPEC.get(key)
    if spec:
        return spec
    return content_pattern_spec(key)

# Всё, что вообще можно править: 42 числа баланса и поля содержимого.
FIELD_SPEC = {}
FIELD_KEYS = []
for _spec in list(BALANCE_SPEC.values()) + list(CONTENT_SPEC.values()):
    FIELD_SPEC[_spec["key"]] = _spec
    FIELD_KEYS.append(_spec["key"])


def balance_schema():
    return [FIELD_SPEC[key] for key in FIELD_KEYS]


def clean_balance_values(values):
    """Пропускает только известные поля: числа в границах схемы и тексты
    разумной длины. Неизвестный ключ отбивается — так в game-config.json не
    попадёт мусор от чужой страницы с чужим токеном."""
    if not isinstance(values, dict):
        return {}, ["Значения должны быть объектом"]
    if len(values) > 4000:
        return {}, ["Слишком много полей сразу"]
    out, bad = {}, []
    for key, raw in values.items():
        spec = field_spec(key)
        if not spec:
            bad.append("неизвестное поле: %s" % key)
            continue
        if spec["kind"] == "text":
            if not isinstance(raw, str):
                bad.append("%s: нужен текст" % key)
                continue
            text = raw.strip()
            if not text:
                bad.append("%s: пусто" % key)
                continue
            if len(text) > spec["max"]:
                bad.append("%s: длиннее %d символов" % (key, spec["max"]))
                continue
            if any(ord(ch) < 32 and ch != "\n" for ch in text):
                bad.append("%s: управляющие символы недопустимы" % key)
                continue
            out[key] = text
            continue
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            bad.append("%s: нужно число" % key)
            continue
        val = float(raw)
        if val != val or val in (float("inf"), float("-inf")):
            bad.append("%s: нужно конечное число" % key)
            continue
        if val < spec["min"] or val > spec["max"]:
            bad.append("%s: допустимо от %s до %s" % (key, spec["min"], spec["max"]))
            continue
        out[key] = round(val, 4)
    return out, bad


def load_balance_overrides():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    values, _bad = clean_balance_values(data.get("values"))
    return values


def load_balance_meta():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {"updated": str(data.get("updated", "")), "version": data.get("v", 1)}


def _backup_config():
    if not os.path.exists(CONFIG_FILE):
        return False
    try:
        with open(CONFIG_FILE, "rb") as src, open(CONFIG_BACKUP_FILE, "wb") as dst:
            dst.write(src.read())
        return True
    except OSError:
        return False


def save_balance_overrides(values):
    clean, bad = clean_balance_values(values)
    if bad:
        return None, bad
    previous = load_balance_overrides()
    clean = dict(previous, **clean)
    _backup_config()
    payload = {
        "v": 1,
        "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "values": clean,
    }
    tmp = CONFIG_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, CONFIG_FILE)
    return payload, []


def backup_meta():
    """Что лежит в резервной копии: её метка времени. Панель показывает
    «прошлая версия от …», иначе учитель не знает, что именно вернёт."""
    try:
        with open(CONFIG_BACKUP_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return {"has_backup": True, "updated": str(data.get("updated", ""))}
    except (OSError, json.JSONDecodeError):
        return {"has_backup": False, "updated": ""}


def restore_backup():
    """Меняет местами текущие настройки и резервную копию.

    Кнопка «вернуть прошлую версию» возвращает прежние числа, а повторное
    нажатие — обратно: неудачный откат тоже откатывается, и ни одна версия
    не теряется."""
    if not os.path.exists(CONFIG_BACKUP_FILE):
        return False
    try:
        current = None
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "rb") as f:
                current = f.read()
        with open(CONFIG_BACKUP_FILE, "rb") as f:
            backup = f.read()
        with open(CONFIG_FILE + ".tmp", "wb") as f:
            f.write(backup)
        os.replace(CONFIG_FILE + ".tmp", CONFIG_FILE)
        # Текущую версию кладём на место копии — но только если она есть:
        # пустой файл вместо копии сделал бы откат необратимым.
        if current:
            with open(CONFIG_BACKUP_FILE + ".tmp", "wb") as f:
                f.write(current)
            os.replace(CONFIG_BACKUP_FILE + ".tmp", CONFIG_BACKUP_FILE)
        else:
            os.remove(CONFIG_BACKUP_FILE)
        return True
    except OSError:
        return False


def reset_balance_overrides():
    _backup_config()
    try:
        os.remove(CONFIG_FILE)
    except OSError:
        pass
    return {"v": 1, "updated": time.strftime("%Y-%m-%d %H:%M:%S"), "values": {}}


# --- SQLite для социальных данных (друзья, сообщения, приглашения) ---
DB_FILE = os.path.join(DATA_DIR, "social.db")


@contextlib.contextmanager
def db():
    # Контекстный менеджер соединения sqlite3 делает commit/rollback, но НЕ
    # закрывает его: без явного close() файл social.db держался бы за счёт
    # сборщика мусора, а не по-настоящему. Здесь закрываем всегда.
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS friends (
                a TEXT NOT NULL, b TEXT NOT NULL,
                created TEXT NOT NULL, PRIMARY KEY (a, b)
            );
            CREATE TABLE IF NOT EXISTS requests (
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                created TEXT NOT NULL, PRIMARY KEY (frm, to_)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                body TEXT NOT NULL, created TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                kind TEXT NOT NULL, payload TEXT, created TEXT NOT NULL
            );
            """
        )


# --- ограничение попыток входа ---
_RATE = {}
_RATE_LOCK = threading.Lock()


def rate_ok(ip, limit=20, window=60):
    now = time.time()
    with _RATE_LOCK:
        arr = _RATE.get(ip, [])
        arr = [t for t in arr if now - t < window]
        if len(arr) >= limit:
            _RATE[ip] = arr
            return False
        arr.append(now)
        _RATE[ip] = arr
        return True


def public_user(acc, key):
    avatar = acc.get("avatar")
    if avatar not in AVATAR_COLORS:
        avatar = AVATAR_COLORS[0]
    return {
        "name": acc.get("name", key),
        "role": acc.get("role", "student"),
        "about": acc.get("about", ""),
        "avatar": avatar,
        "created": acc.get("created", ""),
    }


ALLOW_CODE = True
# Панель разработчика в подземелье: прыжок по этажам, пропуск боёв, выдача
# предметов. Включается только ключом --dev, то есть решением преподавателя:
# из адресной строки ученик её не включит.
DEV_TOOLS = False
TEACHER_PIN = os.environ.get("PYQUIZ_TEACHER_PIN", "").strip()
MAX_CODE_LEN = 20000
MAX_TESTS = 50
CODE_TIMEOUT = 5
MAX_MEMORY = 512 * 1024 * 1024

# Тесты заданий банка лежат на сервере, а не приходят от клиента. JSON
# собран из static/code-tasks.js (tools/art/... не нужен): клиент по-прежнему
# получает банк для показа, но проверять себя сам не может.
CODE_TESTS_FILE = os.path.join(STATIC_DIR, "code-tasks-tests.json")
_CODE_TASK_TESTS = None


def code_task_tests():
    """Проверки банка «напиши функцию», загруженные один раз."""
    global _CODE_TASK_TESTS
    if _CODE_TASK_TESTS is None:
        out = {}
        try:
            with open(CODE_TESTS_FILE, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                for task_id, raw in data.items():
                    if not isinstance(task_id, str) or not isinstance(raw, list):
                        continue
                    tests = []
                    for t in raw[:MAX_TESTS]:
                        if not isinstance(t, dict):
                            continue
                        call, expected = t.get("call"), t.get("expected")
                        if isinstance(call, str) and isinstance(expected, str) and call and expected:
                            tests.append({"call": call[:500], "expected": expected[:500]})
                    if tests:
                        out[task_id] = tests
        except (OSError, json.JSONDecodeError):
            out = {}
        _CODE_TASK_TESTS = out
    return _CODE_TASK_TESTS


def resolve_code_tests(task_id):
    """Проверки по номеру задания. None и причина — если номера нет в банке.

    Задания генератора (gen.*) сюда не входят: их тесты рождаются на клиенте
    вместе с заданием, и доверять им нельзя. Пока серверного генератора нет,
    такие задания игре не выдаются (features.generatedCode = false).
    """
    if not isinstance(task_id, str) or not task_id.strip():
        return None, "Нет номера задания"
    task_id = task_id.strip()[:120]
    tests = code_task_tests().get(task_id)
    if tests:
        return tests, None
    if task_id.startswith("gen."):
        return None, "Задание генератора больше не проверяется — выдано другое"
    return None, "Неизвестное задание"

# Изоляция кода на уровне ОС. Внутри процесса Python обойти белый список
# модулей можно цепочкой классов, поэтому на Windows по умолчанию берём WSL:
# пользовательские пространства имён (unshare -Urmpf -n) дают отдельные
# mount/pid/net, а /mnt с проектом и секретами маскируется tmpfs. Если WSL
# недоступен, остаётся старый процесс — и это честно пишется при старте.
SANDBOX_MODE = (os.environ.get("PYQUIZ_SANDBOX") or "auto").strip().lower()
if SANDBOX_MODE not in ("auto", "process", "wsl"):
    SANDBOX_MODE = "auto"
WSL_EXE = shutil.which("wsl.exe") if os.name == "nt" else None
if os.name == "nt" and not WSL_EXE:
    _system_wsl = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"),
                               "System32", "wsl.exe")
    if os.path.isfile(_system_wsl):
        WSL_EXE = _system_wsl
_WSL_READY = None
_LOCAL_NS_READY = None


def local_ns_ready():
    """Есть ли на этой Linux-машине unprivileged namespaces (локальный аналог WSL).

    Нужно, чтобы сервер на Linux не оставался без изоляции, а полный набор
    проверок можно было прогнать из WSL: снаружи wsl.exe недоступен, и режим
    auto честно падал в process.
    """
    global _LOCAL_NS_READY
    if _LOCAL_NS_READY is None:
        _LOCAL_NS_READY = False
        if os.name != "nt" and shutil.which("bash") and shutil.which("unshare"):
            try:
                probe = subprocess.run(
                    ["bash", "-lc", "unshare -Urmpf --mount-proc -n true"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    timeout=10,
                )
                _LOCAL_NS_READY = probe.returncode == 0
            except (OSError, subprocess.SubprocessError):
                _LOCAL_NS_READY = False
    return _LOCAL_NS_READY


def wsl_ready():
    """Есть ли WSL с python3 и unprivileged namespaces. Ответ кэшируется."""
    global _WSL_READY
    if _WSL_READY is None:
        _WSL_READY = False
        if WSL_EXE:
            try:
                probe = subprocess.run(
                    [WSL_EXE, "-e", "bash", "-lc",
                     "command -v python3 >/dev/null 2>&1 && "
                     "command -v unshare >/dev/null 2>&1 && "
                     "unshare -Urmpf --mount-proc -n true"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    # Первый запуск после простоя WSL может быть холодным:
                    # восьми секунд не хватало, и сервер навсегда оставался
                    # на небезопасном backend.
                    timeout=30,
                )
                _WSL_READY = probe.returncode == 0
            except (OSError, subprocess.SubprocessError):
                _WSL_READY = False
    return _WSL_READY


def sandbox_backend():
    """Куда запускать код: wsl (изоляция), process (старый режим) или нет.

    «wsl» — это namespaces: на Windows через wsl.exe, на Linux локально.
    Скрипт изоляции один и тот же (_wsl_script).
    """
    if SANDBOX_MODE == "process":
        return "process"
    if SANDBOX_MODE == "wsl":
        if os.name == "nt":
            return "wsl" if wsl_ready() else "unavailable"
        return "wsl" if local_ns_ready() else "unavailable"
    if os.name == "nt":
        return "wsl" if wsl_ready() else "process"
    return "wsl" if local_ns_ready() else "process"


def wsl_path(path):
    """C:\\Users\\... → /mnt/c/Users/... для аргументов WSL."""
    path = os.path.abspath(path)
    drive, rest = os.path.splitdrive(path)
    if not drive:
        raise ValueError("WSL понимает только пути с буквой диска")
    return "/mnt/" + drive[0].lower() + rest.replace("\\", "/")


def _wsl_script(src):
    """Скрипт для WSL: task во временном каталоге, /mnt и /home скрыты.

    Код запускается в отдельных user/mount/pid/net namespaces. Внутри
    виден только каталог задачи (bind-mount), Python из /usr и пустые
    заглушки вместо /mnt, /home, /tmp и /root. Секреты проекта лежат на
    /mnt/c и после маскирования недоступны.
    """
    return r'''set -eu
TASK=$(mktemp -d "${XDG_RUNTIME_DIR:-/dev/shm}/pyquiz.XXXXXX" 2>/dev/null || mktemp -d /dev/shm/pyquiz.XXXXXX)
trap 'rm -rf "$TASK"' EXIT
SRC=%s
export TASK SRC
/usr/bin/env -i PATH=/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 PYTHONIOENCODING=utf-8 \
  PYTHONDONTWRITEBYTECODE=1 TASK="$TASK" SRC="$SRC" \
  unshare -Urmpf --mount-proc -n --kill-child bash -c '
    set -eu
    mount --bind "$SRC" "$TASK"
    mount -t tmpfs tmpfs /mnt
    mount -t tmpfs tmpfs /home 2>/dev/null || true
    mount -t tmpfs tmpfs /tmp 2>/dev/null || true
    mount -t tmpfs tmpfs /root 2>/dev/null || true
    case "$TASK" in
      /run/*) mount -t tmpfs tmpfs /dev/shm 2>/dev/null || true ;;
    esac
    ulimit -t 3
    ulimit -v 524288
    ulimit -f 4096
    ulimit -n 64
    ulimit -u 64
    timeout -k 1 5 python3 -I "$TASK/runner.py" "$TASK/student.py" "$TASK/tests.json" "$TASK/results.json"
  '
''' % shlex.quote(src)


SANDBOX_RUNNER = r"""
# Этот файл пишет сервер, ученик его не видит и не редактирует.
# Код ученика НЕ исполняется в этом файле: он лежит отдельно, в student.py,
# и выполняется в отдельном пространстве имён без доступа к глобалам отсюда.
# Старый вариант склеивал прелюдию, код ученика и эпилог в один файл, поэтому
# код выполнялся в глобалах серверной прелюдии и доставал сохранённую
# ссылку на настоящий open — то есть читал .secret сервера и переписывал
# server.py. Теперь файлов три, и ученический код видит только белый список.
import builtins, json, os, sys

try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
    resource.setrlimit(resource.RLIMIT_AS, (536870912, 536870912))
    resource.setrlimit(resource.RLIMIT_FSIZE, (2097152, 2097152))
except Exception:
    pass

_student_path, _tests_path, _out_path = sys.argv[1], sys.argv[2], sys.argv[3]
_tmproot = os.path.realpath(os.path.dirname(os.path.abspath(_student_path)))

# Модули, которые встречаются в учебных заданиях и которые не дают доступа
# к файлам, сети и процессам. Всё остальное — в том числе os, sys,
# subprocess, socket, ctypes — ученику недоступно.
ALLOWED_MODULES = frozenset((
    "math", "cmath", "random", "statistics", "decimal", "fractions", "numbers",
    "string", "textwrap", "unicodedata", "re", "datetime", "time", "calendar",
    "collections", "itertools", "functools", "operator", "bisect", "heapq",
    "array", "copy", "json", "enum", "dataclasses", "typing", "abc",
))

# Встроенные функции, нужные для решения заданий. Намеренно отсутствуют
# open (заменён на _safe_open), __import__ (заменён на _safe_import), eval,
# exec, compile, globals, locals, vars, getattr, input, breakpoint, help, exit.
SAFE_BUILTINS = (
    "abs", "all", "any", "ascii", "bin", "bool", "bytearray", "bytes",
    "callable", "chr", "classmethod", "complex", "dict", "divmod", "enumerate",
    "filter", "float", "format", "frozenset", "hash", "hex", "id", "int",
    "isinstance", "issubclass", "iter", "len", "list", "map", "max", "min",
    "next", "object", "oct", "ord", "pow", "print", "property", "range", "repr",
    "reversed", "round", "set", "slice", "sorted", "staticmethod", "str",
    "sum", "super", "tuple", "type", "zip",
    "ArithmeticError", "AssertionError", "AttributeError", "EOFError",
    "Exception", "IndexError", "KeyError", "LookupError", "MemoryError",
    "NameError", "NotImplementedError", "OverflowError", "RecursionError",
    "RuntimeError", "StopIteration", "TypeError", "ValueError",
    "ZeroDivisionError", "__build_class__",
)


def _inside_tmp(path):
    try:
        rp = os.path.realpath(os.fspath(path))
    except Exception:
        return False
    return rp == _tmproot or rp.startswith(_tmproot + os.sep)


def _safe_open(file, mode="r", *a, **kw):
    # Читать можно только свою папку задачи, писать запрещено полностью.
    # Раньше проверялся только режим чистого чтения, поэтому open(path, "w")
    # писал куда угодно, включая server.py и users.json.
    if not _inside_tmp(file):
        raise PermissionError("Доступ к файлам вне папки задачи запрещён")
    if any(ch in mode for ch in "wax+"):
        raise PermissionError("Запись файлов в задаче не нужна и запрещена")
    return open(file, mode, *a, **kw)


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = name.split(".")[0]
    if root not in ALLOWED_MODULES:
        raise ImportError("Модуль «%s» в заданиях не используется" % root)
    return __import__(name, globals, locals, fromlist, level)


_safe = {}
for _name in SAFE_BUILTINS:
    _safe[_name] = getattr(builtins, _name, None)
_safe["open"] = _safe_open
_safe["__import__"] = _safe_import
# Ожидаемые значения проверок считаются в отдельной копии builtins: иначе
# ученик мог переопределить имя в своём пространстве и подменить ожидание.
_expect_safe = dict(_safe)

with open(_student_path, encoding="utf-8") as _f:
    _source = _f.read()
with open(_tests_path, encoding="utf-8") as _f:
    _tests = json.load(_f)

# Пространство имён ученика пустое, без __builtins__ по умолчанию.
# Синтаксическая ошибка и любое исключение на верхнем уровне уходят в stderr,
# и сервер показывает ученику последнюю строку трейсбека — как раньше.
_ns = {"__name__": "задание", "__builtins__": _safe}
exec(compile(_source, "<задание>", "exec"), _ns)

# Сравнение без пользовательского __eq__: результат сначала приводится к
# каноническому JSON из точных типов (bool, int, float, str, list, tuple,
# dict), а потом сравниваются строки. Иначе класс ученика с __eq__ == True
# проходил любую проверку, а repr() мог выполнить его код.
def _short(_v):
    _r = repr(_v)
    return _r if len(_r) <= 1000 else _r[:1000] + "…"


def _canon_key(_k):
    _tk = type(_k)
    if _tk is str:
        return ["s", _k]
    if _tk is bool:
        return ["b", _k]
    if _tk is int:
        return ["n", _k]
    if _tk is float:
        if _k != _k or _k in (float("inf"), float("-inf")):
            raise ValueError("нечисловое значение в ключе")
        return ["n", int(_k)] if _k.is_integer() else ["n", _k]
    raise TypeError("неподдерживаемый ключ")


def _canon(_v):
    _tv = type(_v)
    if _v is None:
        return ["z"]
    if _tv is bool:
        return ["b", _v]
    if _tv is int:
        return ["n", _v]
    if _tv is float:
        if _v != _v or _v in (float("inf"), float("-inf")):
            raise ValueError("нечисловое значение")
        # 15.0 и 15 в Python равны — канонизируем к одному виду.
        return ["n", int(_v)] if _v.is_integer() else ["n", _v]
    if _tv is str:
        return ["s", _v]
    if _tv is list:
        return ["l", [_canon(_x) for _x in _v]]
    if _tv is tuple:
        return ["t", [_canon(_x) for _x in _v]]
    if _tv is dict:
        return ["d", sorted([_canon_key(_k), _canon(_val)] for _k, _val in _v.items())]
    raise TypeError("неподдерживаемый тип результата")


_results = []
for _t in _tests:
    try:
        _actual = eval(_t["call"], _ns)
        # Ожидание — в своей копии builtins, а не в пространстве ученика.
        _expected = eval(_t["expected"], {"__builtins__": _expect_safe})
        _ok = (json.dumps(_canon(_actual), ensure_ascii=False, sort_keys=True) ==
               json.dumps(_canon(_expected), ensure_ascii=False, sort_keys=True))
        _results.append({
            "ok": _ok,
            "actual": _short(_actual),
            "expected": _short(_expected),
        })
    except Exception as _e:
        _results.append({
            "ok": False,
            "actual": "Ошибка: " + str(_e),
            "expected": _t["expected"],
        })

with open(_out_path, "w", encoding="utf-8") as _f:
    json.dump(_results, _f, ensure_ascii=False)
"""


def _limit_windows_process(proc):
    """Ограничивает память процесса на Windows (на Linux это делает resource).

    На Windows модуля resource нет, поэтому лимиты из RUNNER_PRELUDE не действовали
    вообще: bytearray на пару гигабайт выполнялся успешно. Job Object работает.
    Возвращает True, если ограничение применено.
    """
    if os.name != "nt":
        return False
    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [(n, ctypes.c_ulonglong) for n in
                        ("ReadOperationCount", "WriteOperationCount",
                         "OtherOperationCount", "ReadTransferCount",
                         "WriteTransferCount", "OtherTransferCount")]

        class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", ctypes.c_longlong),
                ("PerJobUserTimeLimit", ctypes.c_longlong),
                ("LimitFlags", wintypes.DWORD),
                ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t),
                ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t),
                ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD),
            ]

        class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                ("IoInfo", IO_COUNTERS),
                ("ProcessMemoryLimit", ctypes.c_size_t),
                ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryUsed", ctypes.c_size_t),
                ("PeakJobMemoryUsed", ctypes.c_size_t),
            ]

        job = kernel32.CreateJobObjectW(None, None)
        if not job:
            return False
        info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        # JOB_OBJECT_LIMIT_PROCESS_MEMORY = 0x00000100
        info.BasicLimitInformation.LimitFlags = 0x00000100
        info.ProcessMemoryLimit = MAX_MEMORY
        ok = kernel32.SetInformationJobObject(
            job, 9, ctypes.byref(info), ctypes.sizeof(info))
        if not ok:
            kernel32.CloseHandle(job)
            return False
        #AssignProcessToJobObject умеет только с правами PROCESS_SET_QUOTA|PROCESS_TERMINATE
        handle = wintypes.HANDLE(int(proc._handle))
        ok = kernel32.AssignProcessToJobObject(job, handle)
        kernel32.CloseHandle(job)
        return bool(ok)
    except Exception:
        return False


def _env_number(name, default, cast):
    """Число из переменной окружения, с запасным значением при мусоре.

    Нужно, чтобы размер класса подгонялся без правки кода: PYQUIZ_CODE_WORKERS
    и PYQUIZ_CODE_WAIT.
    """
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        value = cast(raw)
    except ValueError:
        print("Значение %s=%s не число, беру %s" % (name, raw, default))
        return default
    return value if value > 0 else default


# Сколько программ учеников проверяется одновременно. Каждая — отдельный
# процесс Python с потолком в 512 МБ, но обычная задача съедает десятки
# мегабайт, так что шесть процессов — это не 3 ГБ, а примерно 250 МБ.
# Остальные ждут очередь CODE_QUEUE_WAIT секунд: при 25 учениках и
# 5-секундных задачах очередь на 10 секунд заканчивалась очень быстро.
CODE_WORKERS = _env_number("PYQUIZ_CODE_WORKERS", 6, int)
CODE_QUEUE_WAIT = _env_number("PYQUIZ_CODE_WAIT", 30, float)
_CODE_SLOTS = threading.BoundedSemaphore(CODE_WORKERS)
# Очередь ожидающих ограничена: иначе сотня запросов занимает сотню потоков
# на 30 секунд. Лишние сразу получают «сервер занят», а не копятся.
_CODE_WAITERS = threading.BoundedSemaphore(max(CODE_WORKERS, CODE_WORKERS * 4))

# Кэш результатов проверки. В классе двадцать пять человек решают одно и то
# же задание, и верное решение у них совпадает до пробела: раньше каждый
# запускал свой процесс, и очередь росла в разы. Ключ — код и тесты вместе,
# поэтому чужим кодом из чужого задания результат не подменить.
CODE_CACHE_TTL = 300
CODE_CACHE_MAX = 256
# Одна запись не должна весить мегабайты: иначе 256 «удачных» ответов с
# огромным repr забирают сотни мегабайт памяти сервера.
CODE_CACHE_MAX_BYTES = 128 * 1024
_code_cache = {}
_code_cache_lock = threading.Lock()


def _cache_key(code, tests):
    payload = code + "\n" + json.dumps(tests, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _cache_get(key):
    with _code_cache_lock:
        item = _code_cache.get(key)
        if item is None:
            return None
        stamp, value = item
        if time.time() - stamp > CODE_CACHE_TTL:
            _code_cache.pop(key, None)
            return None
        return copy.deepcopy(value)


def _cache_put(key, value):
    try:
        size = len(json.dumps(value, ensure_ascii=False).encode("utf-8"))
    except (TypeError, ValueError):
        return
    if size > CODE_CACHE_MAX_BYTES:
        # Большой результат не кэшируем: память дороже повторного запуска.
        return
    with _code_cache_lock:
        if len(_code_cache) >= CODE_CACHE_MAX:
            # Словарь хранит ключи в порядке добавления, поэтому сносим
            # самые старые записи, а не ищем самые старые по времени.
            for old in list(_code_cache)[:len(_code_cache) - CODE_CACHE_MAX + 1]:
                _code_cache.pop(old, None)
        _code_cache[key] = (time.time(), copy.deepcopy(value))


def _unavailable(error, **extra):
    """Код не проверен по вине сервера, а не ученика. Поле unavailable
    говорит игре: ход не засчитывать и героя не наказывать."""
    out = {"ok": False, "unavailable": True, "error": error, "results": []}
    out.update(extra)
    return out


def run_code(code, tests):
    """Выполняет код студента в отдельном процессе и проверяет тесты."""
    if not ALLOW_CODE:
        return _unavailable("Проверка кода отключена на сервере", disabled=True)
    if not isinstance(code, str) or not code.strip():
        return {"ok": False, "error": "Пустой код", "results": []}
    if len(code) > MAX_CODE_LEN:
        return {"ok": False, "error": "Код слишком длинный", "results": []}
    if not isinstance(tests, list) or not tests:
        # Задание без тестов — ошибка в банке заданий, а не ученика.
        return _unavailable("Нет тестов")
    # Повтор с тем же решением отвечает из кэша и не занимает слот: ради
    # этого кэш и сделан, ведь весь класс решает одно задание.
    key = _cache_key(code, tests)
    cached = _cache_get(key)
    if cached is not None:
        cached["cached"] = True
        return cached
    if not _CODE_WAITERS.acquire(timeout=1):
        return _unavailable("Сервер проверки занят — нажми «Проверить» ещё раз", busy=True)
    try:
        if not _CODE_SLOTS.acquire(timeout=CODE_QUEUE_WAIT):
            return _unavailable("Сервер проверки занят — нажми «Проверить» ещё раз", busy=True)
        try:
            result = _run_tests(code, tests[:MAX_TESTS])
            # В кэш идёт только завершённая проверка. Ошибка ученика тоже
            # попадает (упавшая программа детерминирована), а вот таймаут и
            # «сервер не смог выполнить» зависят от загрузки машины — их
            # повторять надо заново, иначе ученик так и не увидит успех.
            if result.get("ok"):
                _cache_put(key, result)
            return result
        finally:
            _CODE_SLOTS.release()
    finally:
        _CODE_WAITERS.release()


def _child_env(tmpdir):
    """Минимальное окружение для проверки кода.

    Раньше процесс наследовал всё окружение сервера, то есть ученический код
    мог читать PYQUIZ_TEACHER_PIN и прочие переменные. Оставляем только
    то, без чего Python на Windows не стартует.
    """
    env = {
        "PATH": "",
        "TEMP": tmpdir,
        "TMP": tmpdir,
        "TMPDIR": tmpdir,
        "PYTHONIOENCODING": "utf-8",
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    for name in ("SYSTEMROOT", "WINDIR", "SystemRoot", "COMSPEC"):
        value = os.environ.get(name)
        if value:
            env[name] = value
    return env


def _drain_limited(stream, limit):
    """Читает поток, оставляя только последние limit байт.

    Последние, а не первые: у stderr нужна последняя строка с ошибкой.
    Хвост ограничен, поэтому print в миллион строк не съедает память.
    """
    buf = bytearray()
    while True:
        chunk = stream.read(8192)
        if not chunk:
            break
        if len(chunk) >= limit:
            buf = bytearray(chunk[-limit:])
        else:
            buf.extend(chunk)
            if len(buf) > limit:
                del buf[:len(buf) - limit]
    return bytes(buf)


def _communicate_limited(proc, timeout, limit=65536):
    """wait + чтение stdout/stderr с потолком вместо communicate().

    communicate() сначала собирает весь вывод в память: ученик мог напечатать
    гигабайты и уронить сервер ещё до проверки. Потоки читаются параллельно,
    иначе полный pipe останавливает процесс.
    """
    captured = {}

    def drain(name, stream):
        try:
            captured[name] = _drain_limited(stream, limit)
        except (OSError, ValueError):
            captured[name] = b""

    threads = [
        threading.Thread(target=drain, args=("stdout", proc.stdout), daemon=True),
        threading.Thread(target=drain, args=("stderr", proc.stderr), daemon=True),
    ]
    for t in threads:
        t.start()
    timed_out = False
    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        proc.kill()
        proc.wait()
    for t in threads:
        t.join(timeout=2)
    return captured.get("stdout", b""), captured.get("stderr", b""), timed_out


def _run_tests(code, tests):
    try:
        tmpdir = tempfile.mkdtemp(prefix="pyquiz-")
    except OSError as exc:
        return _unavailable(str(exc))
    try:
        runner_path = os.path.join(tmpdir, "runner.py")
        code_path = os.path.join(tmpdir, "student.py")
        tests_path = os.path.join(tmpdir, "tests.json")
        out_path = os.path.join(tmpdir, "results.json")
        # Код ученика пишется отдельным файлом и запускается не как
        # __main__, а через exec из runner.py — поэтому он не видит
        # ни глобалов runner, ни его настоящего open.
        with open(runner_path, "w", encoding="utf-8") as f:
            f.write(SANDBOX_RUNNER)
        with open(code_path, "w", encoding="utf-8") as f:
            f.write(code)
        with open(tests_path, "w", encoding="utf-8") as f:
            json.dump(tests, f, ensure_ascii=False)

        backend = sandbox_backend()
        if backend == "unavailable":
            if os.name == "nt":
                message = ("WSL включён в PYQUIZ_SANDBOX, но недоступен. "
                           "Запустите сервер с --no-code или установите WSL.")
            else:
                message = ("PYQUIZ_SANDBOX требует unshare, но локальные namespaces "
                           "недоступны. Запустите с --no-code или разрешите "
                           "unprivileged user namespaces.")
            return _unavailable(message)
        try:
            if backend == "wsl":
                script_path = os.path.join(tmpdir, "run.sh")
                # На Windows путь переводится в /mnt/..., на Linux он уже свой.
                src_path = wsl_path(tmpdir) if os.name == "nt" else os.path.abspath(tmpdir)
                with open(script_path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(_wsl_script(src_path))
                if os.name == "nt":
                    command = [WSL_EXE, "-e", "bash", wsl_path(script_path)]
                else:
                    # Абсолютный путь: у процесса проверки PATH пустой.
                    command = [shutil.which("bash") or "/bin/bash", script_path]
            else:
                command = [sys.executable, "-I", runner_path, code_path, tests_path, out_path]
            run_env = _child_env(tmpdir)
            if backend == "wsl" and os.name != "nt":
                # Внешнему скрипту нужны mktemp/unshare/mount из PATH. Это
                # доверенный код сервера; ученик запускается внутри него
                # через `env -i`, и его окружение остаётся пустым.
                run_env["PATH"] = "/usr/bin:/bin"
            proc = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=tmpdir,
                env=run_env,
            )
        except (OSError, ValueError) as exc:
            # Сервер не смог запустить Python/WSL — ученик тут ни при чём.
            return _unavailable(str(exc))

        # WSL уже ограничивает память через ulimit и RLIMIT_AS; Job Object
        # на wsl.exe мог бы убить саму оболочку WSL, а не код ученика.
        limited = _limit_windows_process(proc) if backend == "process" else False
        if backend == "process" and os.name == "nt" and not limited:
            # Job Object не применился — лимита памяти нет. Молча выполнять
            # код в таком режиме нельзя: bytearray на пару гигабайт кладёт
            # сервер. Честно говорим «недоступно», как при занятой очереди.
            proc.kill()
            proc.wait()
            return _unavailable(
                "Не удалось включить ограничение памяти Windows. "
                "Установите WSL или запустите сервер с --no-code."
            )
        stdout, stderr, timed_out = _communicate_limited(proc, CODE_TIMEOUT)
        if timed_out:
            return {
                "ok": False,
                "error": "Превышено время выполнения (возможно, бесконечный цикл)",
                "results": [],
            }

        if not os.path.exists(out_path):
            err = stderr.decode("utf-8", "replace").strip().splitlines()
            last = err[-1] if err else ""
            if "MemoryError" in last or "не хватает памяти" in last:
                return {
                    "ok": False,
                    "error": "Программа запросила слишком много памяти (максимум 512 МБ)",
                    "results": [],
                }
            if proc.returncode is not None and proc.returncode < 0:
                return {
                    "ok": False,
                    "error": "Превышено время выполнения или программа аварийно завершилась",
                    "results": [],
                }
            if err:
                # понятная ошибка самого кода студента (SyntaxError, NameError, ...)
                return {"ok": False, "error": last, "results": []}
            if limited:
                return {
                    "ok": False,
                    "error": "Программа превысила лимит памяти или была прервана",
                    "results": [],
                }
            return {
                "ok": False,
                "error": "Не удалось выполнить код",
                "results": [],
            }

        with open(out_path, encoding="utf-8") as f:
            results = json.load(f)
        if not isinstance(results, list):
            raise ValueError("Результаты должны быть списком")
        passed = sum(1 for r in results if isinstance(r, dict) and r.get("ok"))
        return {"ok": True, "results": results, "passed": passed, "total": len(results)}
    except OSError as exc:
        # Диск, права, временная папка — сбой сервера.
        return _unavailable(str(exc))
    except ValueError as exc:
        # Файл результатов испорчен — его пишет программа ученика.
        return {"ok": False, "error": str(exc), "results": []}
    finally:
        # WSL иногда отпускает cwd/хендлы на миллисекунды позже выхода
        # процесса: один os.rmdir оставлял пустой pyquiz-* навсегда.
        for _ in range(5):
            if not os.path.exists(tmpdir):
                break
            shutil.rmtree(tmpdir, ignore_errors=True)
            if not os.path.exists(tmpdir):
                break
            time.sleep(0.1)

def _cell(value):
    """Приводит значение к строке для CSV и гасит формулы Excel."""
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return ""
    text = str(value)
    if text[:1] in ("=", "+", "-", "@"):
        text = "'" + text
    return text


CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".svg": "image/svg+xml",
}

LEVEL_ORDER = ["novice", "basic", "confident", "advanced"]


def load_results():
    if not os.path.exists(RESULTS_FILE):
        return []
    try:
        with open(RESULTS_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


RESULT_MODES = ("dungeon", "practice", "test")
# Потолки файла результатов: без них гость мог прислать тысячи строк и
# раздуть results.json, который учитель потом читает и выгружает целиком.
RESULTS_MAX = 10000
RESULTS_MAX_BYTES = 8 * 1024 * 1024
DUNGEON_INTS = ("floorsCleared", "kills", "codePassed", "codeTried", "copyPassed",
                "copyTried", "hintsUsed", "goldEarned")
ANSWER_TEXTS = ("kind", "topic", "chosenLetter", "answerLetter", "chosenText", "answerText")
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$")
_STAT_KEY = re.compile(r"^[A-Za-z0-9_-]{1,40}$")
_RUN_ID = re.compile(r"^[A-Za-z0-9_.:-]{1,40}$")


def _int(value, lo=0, hi=10 ** 9):
    """Целое в границах. Строка, null, true, NaN и бесконечность — нижняя
    граница: json.loads пропускает и NaN, и Infinity."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return lo
    if value != value or value in (float("inf"), float("-inf")):
        return lo
    return max(lo, min(hi, int(value)))


def _text(value, limit):
    return value.strip()[:limit] if isinstance(value, str) else ""


def _stats(value, max_keys=60):
    """{тема: {correct, total}}: только числа, верных не больше, чем всего."""
    out = {}
    if not isinstance(value, dict):
        return out
    for k, v in list(value.items())[:max_keys]:
        if not isinstance(k, str) or not _STAT_KEY.match(k) or not isinstance(v, dict):
            continue
        total = _int(v.get("total"), 0, 100000)
        out[k] = {"correct": min(total, _int(v.get("correct"), 0, 100000)), "total": total}
    return out


def _answers(value, limit=200):
    """Ошибки теста для разбора: короткие строки и числа, не больше limit."""
    out = []
    if not isinstance(value, list):
        return out
    for a in value[:limit]:
        if not isinstance(a, dict):
            continue
        item = {k: _text(a.get(k), 300) for k in ANSWER_TEXTS if isinstance(a.get(k), str)}
        for k in ("id", "chosen"):
            v = a.get(k)
            if isinstance(v, str):
                item[k] = v[:80]
            elif isinstance(v, (int, float)) and not isinstance(v, bool):
                item[k] = _int(v, -1)
        item["level"] = _int(a.get("level"), 0, 10)
        item["correct"] = a.get("correct") is True
        out.append(item)
    return out


def amulet_cap():
    """Потолок амулетов возврата для проверки профиля. Берём то же число, что
    задано в админке (hub.amuletMax), иначе панель и сервер разошлись бы:
    учитель поднял бы потолок до 5, а сервер резал бы профиль до 3."""
    try:
        n = int(float(load_balance_overrides().get("hub.amuletMax", 3)))
    except (TypeError, ValueError):
        n = 3
    return max(0, min(20, n))


PROFILE_NUM = 10 ** 7

# Потолки постоянной прогрессии. Те же числа стоят в static/profile.js
# (HERO_CAPS/VILLAGE_CAPS/KEYS_MAX): сервер обязан принимать ровно столько,
# сколько игра может выдать, иначе прогресс героя молча теряется при
# сохранении профиля. Совпадение чисел проверяет verify_dungeon.py.
HERO_CAPS = {"hp": 5, "dmg": 5, "potions": 3, "loot": 3, "armor": 3}
VILLAGE_CAPS = {"well": 2, "barn": 2, "forge": 2, "smith": 2}
KEYS_MAX = 12


def clean_profile(data):
    """Профиль ученика из /api/register и /api/profile/save → известные поля.

    Раньше профиль принимался как есть: клиент мог положить в users.json
    объект любой формы и любого размера. Здесь тот же приём, что у
    clean_result: белый список полей и границы чисел; незнакомое отбрасываем.
    Амулет возврата — редкая валюта, поэтому его счётчик зажат потолком
    админки, а не доверием к клиенту."""
    if not isinstance(data, dict):
        return {}
    out = {}
    for key, limit in (("name", 60), ("created", 40), ("dungeonName", 30)):
        val = _text(data.get(key), limit)
        if val:
            out[key] = val

    wallet = data.get("wallet")
    if isinstance(wallet, dict):
        out["wallet"] = {
            "gold": _int(wallet.get("gold"), 0, PROFILE_NUM),
            "small_potion": _int(wallet.get("small_potion"), 0, 999),
            "big_potion": _int(wallet.get("big_potion"), 0, 999),
        }

    hub = data.get("hub")
    if isinstance(hub, dict):
        gear = []
        raw_gear = hub.get("gear")
        if isinstance(raw_gear, list):
            for g in raw_gear[:20]:
                gid = _text(g, 60)
                if gid:
                    gear.append(gid)
        out["hub"] = {"revive": _int(hub.get("revive"), 0, amulet_cap()), "gear": gear}

    # Стартовый уровень из калибровки. Числа те же, что в static/profile.js:
    # шесть вопросов, максимум 12 баллов, уровни 0–3. Ноль — «ещё не проходил».
    knowledge = data.get("knowledge")
    if isinstance(knowledge, dict):
        out["knowledge"] = {
            "level": _int(knowledge.get("level"), 0, 3),
            "source": _text(knowledge.get("source"), 20),
            "date": _text(knowledge.get("date"), 40),
            "correct": _int(knowledge.get("correct"), 0, 6),
            "total": _int(knowledge.get("total"), 0, 6),
            "score": _int(knowledge.get("score"), 0, 12),
        }

    stats = data.get("stats")
    if isinstance(stats, dict):
        days = []
        raw_days = stats.get("days")
        if isinstance(raw_days, list):
            for d in raw_days[:400]:
                ds = _text(d, 20)
                if ds:
                    days.append(ds)
        out["stats"] = {
            "correct": _int(stats.get("correct"), 0, PROFILE_NUM),
            "codeSolved": _int(stats.get("codeSolved"), 0, PROFILE_NUM),
            "runs": _int(stats.get("runs"), 0, PROFILE_NUM),
            "days": days,
            "bestStreak": _int(stats.get("bestStreak"), 0, 10000),
            "studyTotal": _int(stats.get("studyTotal"), 0, PROFILE_NUM),
            "studyStreak": _int(stats.get("studyStreak"), 0, 10000),
            "studyBestStreak": _int(stats.get("studyBestStreak"), 0, 10000),
        }

    badges = data.get("badges")
    if isinstance(badges, dict):
        clean_badges = {}
        for k, v in list(badges.items())[:40]:
            bk = _text(k, 40)
            if bk:
                clean_badges[bk] = _text(v, 40)
        out["badges"] = clean_badges

    runs = data.get("quizRuns")
    if isinstance(runs, list):
        clean_runs = []
        for r in runs[:100]:
            if not isinstance(r, dict):
                continue
            clean_runs.append({
                "date": _text(r.get("date"), 40),
                "mode": _text(r.get("mode"), 20),
                "percent": _int(r.get("percent"), 0, 100),
                "level": _text(r.get("level"), 40),
                "correct": _int(r.get("correct"), 0, 100000),
                "total": _int(r.get("total"), 0, 100000),
                "topicStats": _stats(r.get("topicStats")),
                "bestStreak": _int(r.get("bestStreak"), 0, 10000),
            })
        out["quizRuns"] = clean_runs

    wrong = _answers(data.get("wrongPool"), 200)
    if wrong:
        out["wrongPool"] = wrong

    study = data.get("study")
    if isinstance(study, dict):
        topics = {}
        raw_topics = study.get("topics")
        if isinstance(raw_topics, dict):
            for k, v in list(raw_topics.items())[:60]:
                tk = _text(k, 40)
                if tk and isinstance(v, dict):
                    topics[tk] = {"ok": _int(v.get("ok"), 0, PROFILE_NUM),
                                  "total": _int(v.get("total"), 0, PROFILE_NUM)}
        out["study"] = {
            "day": _text(study.get("day"), 20),
            "good": _int(study.get("good"), 0, PROFILE_NUM),
            "total": _int(study.get("total"), 0, PROFILE_NUM),
            "topics": topics,
        }

    best = data.get("dungeonBest")
    if isinstance(best, dict):
        out["dungeonBest"] = {
            "percent": _int(best.get("percent"), 0, 100),
            "floors": _int(best.get("floors"), 0, 100000),
            "victory": best.get("victory") is True,
            "date": _text(best.get("date"), 40),
        }

    # Постоянная прогрессия между походами: улучшения героя, постройки деревни,
    # найденные материалы и ключи, квесты, выбранное умение. Потолки уровней —
    # те же числа, что в static/profile.js (HERO_CAPS/VILLAGE_CAPS): если сервер
    # срежет уровень, который игра разрешила, прогресс героя молча потеряется.
    hero = data.get("hero")
    if isinstance(hero, dict):
        out["hero"] = {key: _int(hero.get(key), 0, cap) for key, cap in HERO_CAPS.items()}

    village = data.get("village")
    if isinstance(village, dict):
        out["village"] = {key: _int(village.get(key), 0, cap)
                          for key, cap in VILLAGE_CAPS.items()}

    loot = data.get("loot")
    if isinstance(loot, dict):
        keys = []
        raw_keys = loot.get("keys")
        if isinstance(raw_keys, list):
            for k in raw_keys[:KEYS_MAX]:
                ks = _text(k, 40)
                if ks and ks not in keys:
                    keys.append(ks)
        out["loot"] = {
            "ore": _int(loot.get("ore"), 0, PROFILE_NUM),
            "wood": _int(loot.get("wood"), 0, PROFILE_NUM),
            "shard": _int(loot.get("shard"), 0, PROFILE_NUM),
            "keys": keys,
        }

    quests = data.get("quests")
    if isinstance(quests, dict):
        done = []
        raw_done = quests.get("done")
        if isinstance(raw_done, list):
            for k in raw_done[:60]:
                ks = _text(k, 40)
                if ks and ks not in done:
                    done.append(ks)
        repeat = {}
        raw_repeat = quests.get("repeat")
        if isinstance(raw_repeat, dict):
            for k, v in list(raw_repeat.items())[:20]:
                rk = _text(k, 40)
                if rk:
                    repeat[rk] = _int(v, 0, PROFILE_NUM)
        progress = {}
        raw_progress = quests.get("progress")
        if isinstance(raw_progress, dict):
            for k, v in list(raw_progress.items())[:20]:
                pk = _text(k, 40)
                if pk:
                    progress[pk] = _int(v, 0, PROFILE_NUM)
        out["quests"] = {
            "story": _int(quests.get("story"), 0, 60),
            "done": done,
            "repeat": repeat,
            "progress": progress,
            "active": _text(quests.get("active"), 40),
        }

    ability = data.get("ability")
    if isinstance(ability, dict):
        out["ability"] = {
            "pick": _text(ability.get("pick"), 20),
            "used": _int(ability.get("used"), 0, 99),
        }
    return out


def clean_result(data):
    """Результат из /api/submit → только известные поля нужных типов.

    Страница учителя вставляет эти поля в таблицу. Строка-скрипт вместо числа
    в «percent» исполнилась бы у учителя (а в адресе страницы — его пароль),
    а произвольный объект любого размера раздувал results.json.
    None — если результата нет: не объект или без имени."""
    if not isinstance(data, dict):
        return None
    name = _text(data.get("name"), 60)
    if not name:
        return None
    date = data.get("date")
    if not (isinstance(date, str) and _ISO_DATE.match(date)):
        date = datetime.now().isoformat(timespec="seconds")
    level = data.get("level") if isinstance(data.get("level"), dict) else {}
    total = _int(data.get("total"), 0, 100000)
    out = {
        "name": name,
        "mode": data.get("mode") if data.get("mode") in RESULT_MODES else "test",
        "date": date,
        "percent": _int(data.get("percent"), 0, 100),
        "correctCount": min(total, _int(data.get("correctCount"), 0, 100000)),
        "total": total,
        "seconds": _int(data.get("seconds"), 0, 10 ** 7),
        "level": {
            "key": level.get("key") if level.get("key") in LEVEL_ORDER else "",
            "title": _text(level.get("title"), 40),
        },
        "topicStats": _stats(data.get("topicStats")),
    }
    if "knowledgeLevel" in data:
        out["knowledgeLevel"] = _int(data.get("knowledgeLevel"), 0, 3)
    for k in ("weighted", "maxWeighted", "bestStreak"):
        if k in data:
            out[k] = _int(data.get(k), 0, 10 ** 6)
    if "levelStats" in data:
        out["levelStats"] = _stats(data.get("levelStats"), 10)
    if "wrong" in data:
        out["wrong"] = _answers(data.get("wrong"))
    run = data.get("runId")
    if isinstance(run, str) and _RUN_ID.match(run):
        out["runId"] = run
    dungeon = data.get("dungeon")
    if isinstance(dungeon, dict):
        d = {k: _int(dungeon.get(k), 0, 10 ** 7) for k in DUNGEON_INTS if k in dungeon}
        d["victory"] = dungeon.get("victory") is True
        out["dungeon"] = d
    return out


def result_problem(result):
    """Серверные инварианты результата: что клиент не мог получить честно.

    Это не доказательство, что ученик ответил сам (для этого нужна сессия
    вопросов на сервере), а защита от заведомо поддельных строк: 100% при
    нулевом числе вопросов, верных больше, чем всего, процент, не сходящийся
    с weighted/maxWeighted, бесконечное время.
    """
    total = result.get("total", 0)
    correct = result.get("correctCount", 0)
    if total > 1000:
        return "слишком много вопросов в одном результате"
    if correct > total:
        return "верных ответов больше, чем вопросов"
    percent = result.get("percent", 0)
    weighted = result.get("weighted")
    max_weighted = result.get("maxWeighted")
    if isinstance(max_weighted, int) and max_weighted > 0:
        if not isinstance(weighted, int) or weighted > max_weighted:
            return "вес верных ответов больше максимального"
        if max_weighted > max(1, total) * 3:
            return "максимальный вес не сходится с числом вопросов"
        expected = round(weighted / max_weighted * 100)
    else:
        expected = round(correct / total * 100) if total else 0
    # Один процент — запас на округление в разных браузерах.
    if abs(percent - expected) > 1:
        return "процент не сходится с числом верных ответов"
    if result.get("seconds", 0) > max(3600, total * 600):
        return "слишком долгий результат"
    return None


def mark_account(result, token):
    """Отметка аккаунта на результате из /api/submit.

    Имя в результате ученик пишет сам: тест открыт и гостям, а за общим
    компьютером ничего не мешает набрать чужое имя. Токен сессии подделать
    нельзя, поэтому по нему сервер и отмечает строку:
    verified — прислано из аккаунта с этим именем (имя пишется так, как
    в аккаунте); account — вошёл один ученик, а имя набрано другое.
    Без токена отметки нет — как и у записей, присланных до этой проверки."""
    key = token_key(token)
    if not key:
        return result
    acc = load_users().get(key)
    if not isinstance(acc, dict):
        return result
    shown = _text(acc.get("name"), 60) or key[:60]
    if result["name"].lower() == shown.lower():
        result["name"] = shown
        result["verified"] = True
    else:
        result["account"] = shown
    return result


def save_result(result):
    with _lock:
        data = load_results()
        result["serverTime"] = datetime.now().isoformat(timespec="seconds")
        run = result.get("runId")
        if run:
            # Подземелье шлёт итог при каждой смерти и при победе, а это один
            # и тот же поход. Раньше у учителя он лежал строкой на каждую
            # смерть; теперь остаётся одна — последняя, самая полная.
            # Строку из аккаунта заменяет только итог из аккаунта: иначе её
            # перезаписал бы кто угодно без входа, зная имя и номер похода.
            data = [r for r in data
                    if not (isinstance(r, dict) and r.get("runId") == run
                            and r.get("name") == result.get("name")
                            and (result.get("verified") or not r.get("verified")))]
        data.append(result)
        if len(data) > RESULTS_MAX:
            return None
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        if len(payload.encode("utf-8")) > RESULTS_MAX_BYTES:
            return None
        tmp = RESULTS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(payload)
        os.replace(tmp, RESULTS_FILE)
        return len(data)


class Handler(BaseHTTPRequestHandler):
    server_version = "PythonQuiz/1.0"
    # Клиент, который открыл соединение и молчит, не должен держать поток
    # вечно: BaseHTTPRequestHandler ставит этот таймаут на сокет.
    timeout = 15

    def log_message(self, fmt, *args):
        # Пароль учителя и токены приходят в строке запроса (?pin=, ?token=),
        # и раньше целиком попадали в консоль и в файл лога. Путь печатаем,
        # значения — нет.
        message = fmt % args
        message = re.sub(r"(?i)([?&](?:pin|token|secret|admin)=)[^\s&\"']*", r"\1…", message)
        print("[%s] %s" % (self.log_date_time_string(), message))

    def _client_ip(self):
        # сервер локальный, за прокси нет: X-Forwarded-For игнорируем,
        # иначе заголовок подделывается и лимит попыток обходится
        return self.client_address[0] if self.client_address else "?"

    def _send(self, status, body=b"", content_type="text/plain; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _serve_file(self, path):
        # startswith пропускал /static-соседа: «C:\...\static_evil» тоже
        # начинается с «C:\...\static». Сравниваем каталоги, а не строки.
        root = os.path.normcase(os.path.realpath(STATIC_DIR))
        target = os.path.normcase(os.path.realpath(path))
        try:
            inside = os.path.commonpath([root, target]) == root
        except ValueError:
            inside = False
        if not inside:
            self._send(403, b"403 Forbidden")
            return
        if not os.path.isfile(path):
            self._send(404, b"404 Not Found")
            return
        ext = os.path.splitext(path)[1].lower()
        with open(path, "rb") as f:
            body = f.read()
        self._send(200, body, CONTENT_TYPES.get(ext, "application/octet-stream"))

    def _pin_ok(self, query):
        if not TEACHER_PIN:
            # без PIN панель была открыта всему классу: /results отдавал 200
            return False
        values = dict()
        for pair in query.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                values[unquote(k)] = unquote(v)
        got = values.get("pin", "")
        # compare_digest не принимает не-ASCII строки, сравниваем байты
        if hmac.compare_digest(got.encode("utf-8"), TEACHER_PIN.encode("utf-8")):
            return True
        if not rate_ok("pin:" + self._client_ip(), limit=30, window=60):
            self._send(429, "Слишком много попыток ввода пароля, подождите минуту".encode("utf-8"))
            return False
        return False

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/results", "/api/results", "/api/export.csv"):
            if not self._pin_ok(parsed.query):
                hint = (
                    "403. Нужен пароль: откройте /results?pin=ваш_пароль\n"
                    "Пароль задаётся при запуске: "
                    "set PYQUIZ_TEACHER_PIN=ваш_пароль (Windows) "
                    "или PYQUIZ_TEACHER_PIN=ваш_пароль python3 server.py (Linux/macOS)"
                    if not TEACHER_PIN else
                    "403. Неверный пароль. Откройте /results?pin=ваш_пароль"
                )
                self._send(403, hint.encode("utf-8"))
                return

        if path in ("/", "/home", "/home.html"):
            self._serve_file(os.path.join(STATIC_DIR, "home.html"))
        elif path in ("/quiz", "/quiz.html", "/index.html"):
            self._serve_file(os.path.join(STATIC_DIR, "index.html"))
        elif path in ("/game", "/game.html"):
            self._serve_file(os.path.join(STATIC_DIR, "game.html"))
        elif path in ("/study", "/study.html"):
            self._serve_file(os.path.join(STATIC_DIR, "study.html"))
        elif path in ("/profile", "/profile.html"):
            self._serve_file(os.path.join(STATIC_DIR, "profile.html"))
        elif path in ("/friends", "/friends.html"):
            self._serve_file(os.path.join(STATIC_DIR, "friends.html"))
        elif path == "/results":
            self._serve_file(os.path.join(STATIC_DIR, "results.html"))
        elif path in ("/admin", "/admin.html"):
            self._serve_file(os.path.join(STATIC_DIR, "admin.html"))
        elif path == "/api/version":
            self._send_json(200, dict({"ok": True}, **version_payload()))
        elif path == "/api/version.js":
            # Тем же способом, что и /api/features.js: обычный скрипт
            # выполняется до остальных и заполняет [data-app-version] на
            # странице, поэтому отдельный запрос из каждого раздела не нужен.
            payload = json.dumps(version_payload(), ensure_ascii=False)
            body = ("window.__PYQUIZ_VERSION = " + payload + ";\n" +
                    VERSION_CLIENT_JS).encode("utf-8")
            self._send(200, body, "application/javascript; charset=utf-8")
        elif path == "/api/features.js":
            # Настройки одним скриптом, а не JSON: обычный <script src="...">
            # выполняется до остальных скриптов страницы, поэтому флаг вроде
            # «проверка кода выключена» известен к моменту сборки заданий.
            # С fetch это была бы гонка: банк успевал собраться до ответа.
            body = ("window.__PYQUIZ_FEATURES = " +
                    json.dumps({"code": ALLOW_CODE, "dev": DEV_TOOLS,
                                "generatedCode": False}) +
                    ";\n").encode("utf-8")
            self._send(200, body, "application/javascript; charset=utf-8")
        elif path == "/api/game-config":
            # Публичный: игре нужно знать баланс, но не пароль админа.
            # features.code: при запуске с --no-code игра не даёт задач на
            # код — проверить их некому, а наказывать ученика не за что.
            self._send_json(200, {
                "ok": True,
                "values": load_balance_overrides(),
                "features": {"code": ALLOW_CODE, "dev": DEV_TOOLS,
                             "generatedCode": False},
            })
        elif path == "/api/admin/schema":
            self._api_admin_schema(parsed.query)
        elif path.startswith("/static/"):
            rel = path[len("/static/"):]
            self._serve_file(os.path.join(STATIC_DIR, rel))
        elif path == "/api/results":
            self._send_json(200, load_results())
        elif path == "/api/me":
            self._api_me(parsed.query)
        elif path == "/api/user":
            self._api_user(parsed.query)
        elif path in ("/api/users", "/api/friends", "/api/messages", "/api/invites"):
            self._social_get(path, parsed.query)
        elif path == "/api/export.csv":
            self._export_csv()
        else:
            self._send(404, b"404 Not Found")

    def do_HEAD(self):
        self.do_GET()

    def _read_body(self, max_len=300000):
        """Читает JSON-тело запроса. Возвращает (данные, ошибка).

        Content-Type обязателен: без него любой сайт мог отправить серверу
        POST с текстом text/plain — такой запрос браузер делает без
        предварительного согласования, то есть подделать его могла чужая
        страница, открытая у ученика. С application/json браузер сначала
        спрашивает разрешение, а CORS-серверов здесь нет.
        """
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype != "application/json":
            self._send_json(415, {"ok": False,
                                  "error": "Ожидается application/json"})
            return None, True
        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return None, True
        # Content-Length: -1 раньше проходил проверку и превращался в
        # read(-1) — чтение до закрытия соединения, то есть вечное ожидание.
        if length < 0 or length > max_len:
            self._send_json(413, {"ok": False, "error": "Слишком большой запрос"})
            return None, True
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return None, True
        # Список или строка вместо объекта роняли обработчик на data.get():
        # браузер получал оборванное соединение вместо ответа.
        if not isinstance(data, dict):
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return None, True
        return data, False

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/check":
            self._handle_check()
            return
        if path in ("/api/register", "/api/login"):
            self._handle_account(path)
            return
        if path in ("/api/profile/update", "/api/profile/save"):
            data, failed = self._read_body()
            if failed:
                return
            self._handle_profile(path, data)
            return
        if path in ("/api/friends/request", "/api/friends/accept", "/api/friends/remove",
                    "/api/messages", "/api/invites", "/api/invites/clear"):
            data, failed = self._read_body()
            if failed:
                return
            self._social_post(path, data)
            return
        if path in ("/api/admin/login", "/api/admin/save", "/api/admin/reset",
                    "/api/admin/restore"):
            data, failed = self._read_body()
            if failed:
                return
            self._handle_admin(path, data)
            return
        if path != "/api/submit":
            self._send(404, b"404 Not Found")
            return

        data, failed = self._read_body()
        if failed:
            return

        # Один ученик за урок отправляет единицы результатов; шестьдесят
        # в минуту с адреса — уже не урок, а попытка забить файл.
        if not rate_ok(self._client_ip(), limit=60, window=60):
            self._send_json(429, {"ok": False, "error": "Слишком много результатов подряд"})
            return

        result = clean_result(data)
        if result is None:
            self._send_json(400, {"ok": False, "error": "Нет имени"})
            return
        problem = result_problem(result)
        if problem:
            self._send_json(400, {"ok": False, "error": problem})
            return
        # В подземелье без входа не начать, поэтому итог похода без токена —
        # не гость, а подделка. Тест и тренажёр по-прежнему открыты гостям.
        if result["mode"] == "dungeon" and not token_key(data.get("token")):
            self._send_json(401, {"ok": False, "error": "Для итога похода нужен вход"})
            return

        mark_account(result, data.get("token"))
        total = save_result(result)
        if total is None:
            self._send_json(413, {"ok": False, "error": "Файл результатов переполнен"})
            return
        self._send_json(200, {"ok": True, "saved": total})

    def _api_admin_schema(self, query):
        token = ""
        for pair in query.split("&"):
            if pair.startswith("token="):
                token = unquote(pair[len("token="):])
        if not admin_token_ok(token):
            self._send_json(401, {"ok": False, "error": "Нужен вход в админ-панель"})
            return
        meta = load_balance_meta()
        self._send_json(200, {
            "ok": True,
            "fields": balance_schema(),
            "values": load_balance_overrides(),
            "updated": meta.get("updated", ""),
            "backup_meta": backup_meta(),
            "config": os.path.basename(CONFIG_FILE),
            "backup": os.path.basename(CONFIG_BACKUP_FILE),
            "pin_source": "переменная PYQUIZ_ADMIN_PIN" if os.environ.get("PYQUIZ_ADMIN_PIN", "").strip()
                          else os.path.basename(ADMIN_SECRET_FILE),
        })

    def _handle_admin(self, path, data):
        if not isinstance(data, dict):
            data = {}
        if path == "/api/admin/login":
            if not ADMIN_PIN:
                self._send_json(503, {"ok": False,
                                      "error": "Админ-панель закрыта: пароль не задан "
                                               "(нужен PYQUIZ_ADMIN_PIN или файл .admin-secret)"})
                return
            if admin_pin_ok(data.get("pin", "")):
                self._send_json(200, {"ok": True, "token": new_admin_token()})
                return
            if not rate_ok("admin:" + self._client_ip(), limit=10, window=60):
                self._send_json(429, {"ok": False,
                                      "error": "Слишком много попыток, подождите минуту"})
                return
            self._send_json(401, {"ok": False, "error": "Неверный пароль"})
            return

        if not admin_token_ok(data.get("token", "")):
            self._send_json(401, {"ok": False, "error": "Нужен вход в админ-панель"})
            return

        if path == "/api/admin/save":
            payload, bad = save_balance_overrides(data.get("values"))
            if bad:
                self._send_json(400, {"ok": False, "error": "; ".join(bad[:5]),
                                      "problems": bad})
                return
            self._send_json(200, {"ok": True, "values": payload["values"],
                                  "updated": payload["updated"],
                                  "backup": os.path.basename(CONFIG_BACKUP_FILE)})
            return

        if path == "/api/admin/restore":
            if not restore_backup():
                self._send_json(400, {"ok": False,
                                      "error": "Резервной копии нет — возвращать нечего"})
                return
            meta = load_balance_meta()
            self._send_json(200, {"ok": True, "values": load_balance_overrides(),
                                  "updated": meta.get("updated", ""),
                                  "backup_meta": backup_meta()})
            return

        reset_balance_overrides()
        self._send_json(200, {"ok": True, "values": {}, "updated": "",
                              "backup_meta": backup_meta(),
                              "backup": os.path.basename(CONFIG_BACKUP_FILE)})

    def _handle_account(self, path):
        data, failed = self._read_body()
        if failed:
            return
        ip = self._client_ip()
        name = str(data.get("name", "")).strip()
        pin = str(data.get("pin", "")).strip()
        if not name or len(pin) < 3:
            self._send_json(400, {"ok": False, "error": "Нужны имя и PIN (минимум 3 символа)"})
            return
        key = name.lower()
        users = load_users()

        if path == "/api/register":
            salt, h = _hash_pin(pin)
            avatar = AVATAR_COLORS[secrets.randbelow(len(AVATAR_COLORS))]
            profile = clean_profile(data.get("profile"))
            now = datetime.now().isoformat(timespec="seconds")

            def register(all_users):
                if key in all_users:
                    return "Имя уже занято"
                all_users[key] = {
                    "name": name,
                    "salt": salt,
                    "hash": h,
                    "role": "student",
                    "about": "",
                    "avatar": avatar,
                    "profile": profile,
                    "created": now,
                    "updated": now,
                }
                return None

            # Проверка «занято» и запись идут под одним замком: раньше
            # между ними мог вклиниться второй регистрирующийся.
            users, error = update_user(key, register)
            if error:
                self._send_json(409, {"ok": False, "error": error})
                return
            tok = new_token(key)
            self._send_json(200, {
                "ok": True,
                "token": tok,
                "user": public_user(users[key], key),
                "profile": users[key]["profile"],
            })
            return

        if key not in users:
            # лимит считаем только за неудачи, чтобы весь класс за одним IP не блокировался
            if not rate_ok(ip, limit=20, window=60):
                self._send_json(429, {"ok": False, "error": "Слишком много попыток, подождите"})
                return
            self._send_json(404, {"ok": False, "error": "Аккаунт не найден"})
            return
        _, h = _hash_pin(pin, users[key]["salt"])
        # Раньше здесь было обычное !=, единственное непостоянное сравнение
        # в проекте: соседние четыре места уже сравнивают через compare_digest.
        if not hmac.compare_digest(h.encode("utf-8"), users[key]["hash"].encode("utf-8")):
            if not rate_ok(ip, limit=20, window=60):
                self._send_json(429, {"ok": False, "error": "Слишком много попыток, подождите"})
                return
            self._send_json(401, {"ok": False, "error": "Неверный PIN"})
            return

        if path == "/api/login":
            tok = new_token(key)
            self._send_json(200, {
                "ok": True,
                "token": tok,
                "user": public_user(users[key], key),
                "profile": users[key].get("profile", {}),
            })
            return

        profile = clean_profile(data.get("profile"))
        now = datetime.now().isoformat(timespec="seconds")

        def save_profile(all_users):
            if key not in all_users:
                return "Аккаунт не найден"
            all_users[key]["profile"] = profile
            all_users[key]["updated"] = now
            return None

        _, error = update_user(key, save_profile)
        if error:
            self._send_json(404, {"ok": False, "error": error})
            return
        self._send_json(200, {"ok": True})

    def _query(self, query):
        out = {}
        for pair in query.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                out[unquote(k)] = unquote(v)
        return out

    def _api_me(self, query):
        q = self._query(query)
        key = token_key(q.get("token"))
        if not key:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
            return
        users = load_users()
        acc = users.get(key)
        if not acc:
            self._send_json(404, {"ok": False, "error": "Аккаунт не найден"})
            return
        self._send_json(200, {"ok": True, "user": public_user(acc, key), "profile": acc.get("profile", {})})

    def _api_user(self, query):
        q = self._query(query)
        key = str(q.get("name", "")).strip().lower()
        users = load_users()
        acc = users.get(key)
        if not acc:
            self._send_json(404, {"ok": False, "error": "Не найдено"})
            return
        self._send_json(200, {"ok": True, "user": public_user(acc, key)})

    def _handle_profile(self, path, data):
        if not isinstance(data, dict):
            data = {}
        # Только по токену сессии. Прежний запасной вход «имя + PIN» обходил
        # лимит попыток /api/login: PIN можно было перебирать здесь без счёта.
        key = token_key(data.get("token"))
        if not key:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
            return
        now = datetime.now().isoformat(timespec="seconds")
        if path == "/api/profile/update":
            _avatar = None
            if "avatar" in data:
                _avatar = str(data.get("avatar") or "").strip()
                if _avatar and _avatar not in AVATAR_COLORS:
                    self._send_json(
                        400,
                        {"ok": False, "error": "Такого цвета аватарки нет"},
                    )
                    return
            about = data.get("about") if "about" in data else None

            def change(users):
                # Чтение, правка и запись — под одним замком update_user.
                # Иначе два одновременных сохранения читали один файл и
                # второе затирало правку первого: профили терялись молча.
                acc = users.get(key)
                if not acc:
                    return "Нужен вход"
                if about is not None:
                    acc["about"] = str(about)[:300]
                if _avatar:
                    acc["avatar"] = _avatar
                acc["updated"] = now
                return None

            users, error = update_user(key, change)
            if error:
                self._send_json(401, {"ok": False, "error": error})
                return
            self._send_json(200, {"ok": True, "user": public_user(users[key], key)})
            return

        profile = clean_profile(data.get("profile")) if data.get("profile") is not None else None

        def save_profile(users):
            acc = users.get(key)
            if not acc:
                return "Нужен вход"
            if profile is not None:
                acc["profile"] = profile
            acc["updated"] = now
            return None

        _, error = update_user(key, save_profile)
        if error:
            self._send_json(401, {"ok": False, "error": error})
            return
        self._send_json(200, {"ok": True})

    def _key_or_401(self, token):
        key = token_key(token)
        if not key:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
        return key

    def _display(self, users, key):
        acc = users.get(key)
        if not acc:
            return {"name": key, "avatar": AVATAR_COLORS[0], "role": "student", "about": ""}
        d = public_user(acc, key)
        d["key"] = key
        return d

    def _social_get(self, path, query):
        q = self._query(query)
        key = self._key_or_401(q.get("token"))
        if not key:
            return
        users = load_users()
        with db() as conn:
            if path == "/api/users":
                term = str(q.get("q", "")).strip().lower()
                out = []
                for k in users:
                    if k == key:
                        continue
                    if term and term not in k:
                        continue
                    out.append(self._display(users, k))
                self._send_json(200, {"ok": True, "users": out[:50]})
                return
            if path == "/api/friends":
                friends = [r["b"] for r in conn.execute("SELECT b FROM friends WHERE a=?", (key,))]
                inc = [r["frm"] for r in conn.execute("SELECT frm FROM requests WHERE to_=?", (key,))]
                outg = [r["to_"] for r in conn.execute("SELECT to_ FROM requests WHERE frm=?", (key,))]
                self._send_json(200, {
                    "ok": True,
                    "friends": [self._display(users, k) for k in friends],
                    "incoming": [self._display(users, k) for k in inc],
                    "outgoing": [self._display(users, k) for k in outg],
                })
                return
            if path == "/api/messages":
                other = str(q.get("with", "")).strip().lower()
                try:
                    since = int(q.get("since", 0) or 0)
                except ValueError:
                    since = 0
                rows = conn.execute(
                    "SELECT id, frm, to_, body, created FROM messages "
                    "WHERE ((frm=? AND to_=?) OR (frm=? AND to_=?)) AND id>? ORDER BY id",
                    (key, other, other, key, since),
                ).fetchall()
                self._send_json(200, {"ok": True, "messages": [dict(r) for r in rows]})
                return
            if path == "/api/invites":
                rows = conn.execute(
                    "SELECT id, frm, to_, kind, payload, created FROM invites WHERE to_=? ORDER BY id DESC",
                    (key,),
                ).fetchall()
                out = []
                for r in rows:
                    d = dict(r)
                    d["from"] = self._display(users, r["frm"])["name"]
                    out.append(d)
                self._send_json(200, {"ok": True, "invites": out})
                return
        self._send_json(404, {"ok": False, "error": "Неизвестный запрос"})

    def _social_post(self, path, data):
        if not isinstance(data, dict):
            data = {}
        key = self._key_or_401(data.get("token"))
        if not key:
            return
        users = load_users()
        now = datetime.now().isoformat(timespec="seconds")

        def other_key():
            return str(data.get("to", data.get("name", data.get("from", "")))).strip().lower()

        with db() as conn:
            if path == "/api/friends/request":
                to = other_key()
                if not to or to == key or to not in users:
                    self._send_json(404, {"ok": False, "error": "Пользователь не найден"})
                    return
                conn.execute("INSERT OR IGNORE INTO requests (frm,to_,created) VALUES (?,?,?)", (key, to, now))
                # если вторая сторона уже отправила заявку — сразу подружиться
                inv = conn.execute("SELECT 1 FROM requests WHERE frm=? AND to_=?", (to, key)).fetchone()
                if inv:
                    self._add_friends(conn, key, to, now)
                    conn.execute("DELETE FROM requests WHERE (frm=? AND to_=?) OR (frm=? AND to_=?)", (key, to, to, key))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/friends/accept":
                frm = other_key()
                conn.execute("DELETE FROM requests WHERE frm=? AND to_=?", (frm, key))
                self._add_friends(conn, key, frm, now)
                self._send_json(200, {"ok": True})
                return
            if path == "/api/friends/remove":
                nm = other_key()
                conn.execute("DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)", (key, nm, nm, key))
                conn.execute("DELETE FROM requests WHERE (frm=? AND to_=?) OR (frm=? AND to_=?)", (key, nm, nm, key))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/messages":
                to = str(data.get("to", "")).strip().lower()
                body = str(data.get("body", "")).strip()[:1000]
                if not to or to not in users or not body:
                    self._send_json(400, {"ok": False, "error": "Пустое сообщение"})
                    return
                conn.execute("INSERT INTO messages (frm,to_,body,created) VALUES (?,?,?,?)", (key, to, body, now))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/invites":
                to = str(data.get("to", "")).strip().lower()
                kind = str(data.get("kind", "friend"))[:20]
                payload = json.dumps(data.get("payload", {}), ensure_ascii=False)[:1000]
                if not to or to not in users:
                    self._send_json(404, {"ok": False, "error": "Пользователь не найден"})
                    return
                conn.execute("INSERT INTO invites (frm,to_,kind,payload,created) VALUES (?,?,?,?,?)", (key, to, kind, payload, now))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/invites/clear":
                try:
                    iid = int(data.get("id", 0))
                except (TypeError, ValueError):
                    iid = 0
                conn.execute("DELETE FROM invites WHERE id=? AND to_=?", (iid, key))
                self._send_json(200, {"ok": True})
                return
        self._send_json(404, {"ok": False, "error": "Неизвестный запрос"})

    @staticmethod
    def _add_friends(conn, a, b, now):
        conn.execute("INSERT OR IGNORE INTO friends (a,b,created) VALUES (?,?,?)", (a, b, now))
        conn.execute("INSERT OR IGNORE INTO friends (a,b,created) VALUES (?,?,?)", (b, a, now))

    def _handle_check(self):
        # Проверка кода — самая дорогая ручка: без лимита ею можно забить
        # очередь и потоки. Уроку хватает сотни проверок в минуту с адреса.
        if not rate_ok(self._client_ip(), limit=120, window=60):
            self._send_json(429, {"ok": False, "error": "Слишком много проверок подряд"})
            return
        data, failed = self._read_body(max_len=200000)
        if failed:
            return
        code = data.get("code", "")
        # Выключенная проверка отвечает раньше разбора задания: иначе старый
        # клиент без taskId получил бы «неизвестное задание» вместо disabled.
        if not ALLOW_CODE:
            self._send_json(200, run_code(code, []))
            return
        tests, problem = resolve_code_tests(data.get("taskId"))
        if problem:
            # Не ошибка ученика: ход не засчитывать. staleTask говорит игре,
            # что задание надо заменить, а не показывать «сервер недоступен».
            self._send_json(200, {
                "ok": False,
                "unavailable": True,
                "staleTask": str(data.get("taskId", "")).startswith("gen."),
                "error": problem,
                "results": [],
            })
            return
        self._send_json(200, run_code(code, tests))

    def _export_csv(self):
        data = load_results()
        buf = io.StringIO()
        writer = csv.writer(buf, delimiter=";")
        # Новые столбцы — в конце: таблицы, собранные по старой выгрузке,
        # не съезжают.
        writer.writerow(
            ["Имя", "Дата", "Процент", "Уровень", "Правильно", "Всего", "Секунды",
             "Режим", "Из аккаунта"]
        )
        modes = {"dungeon": "Подземелье", "practice": "Тренажёр", "test": "Тест"}
        for r in data:
            if not isinstance(r, dict):
                continue
            date = r.get("date")
            date = date[:19].replace("T", " ") if isinstance(date, str) else ""
            level = r.get("level")
            title = level.get("title", "") if isinstance(level, dict) else ""
            writer.writerow(
                [
                    _cell(r.get("name")),
                    date,
                    _cell(r.get("percent")),
                    _cell(title),
                    _cell(r.get("correctCount")),
                    _cell(r.get("total")),
                    _cell(r.get("seconds")),
                    modes.get(r.get("mode"), "Тест"),
                    "да" if r.get("verified") is True else
                    _cell("нет, вход: " + r["account"]) if isinstance(r.get("account"), str) else "нет",
                ]
            )
        # BOM, чтобы Excel корректно открыл кириллицу
        body = ("\ufeff" + buf.getvalue()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header(
            "Content-Disposition", 'attachment; filename="python-quiz-results.csv"'
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def local_ips():
    """Возвращает список локальных IPv4-адресов этой машины (для доступа по сети)."""
    ips = []

    def add(ip):
        if ip and not ip.startswith("127.") and ip not in ips:
            ips.append(ip)

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.connect(("8.8.8.8", 80))
            add(sock.getsockname()[0])
        finally:
            sock.close()
    except OSError:
        pass

    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            add(ip)
    except OSError:
        pass

    return ips


class ReuseServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def bind_server(host, port, tries=25):
    """Пробует занять порт; если занят — перебирает следующие."""
    last = None
    for p in range(port, port + tries):
        try:
            return ReuseServer((host, p), Handler), p
        except OSError as exc:
            last = exc
            if exc.errno in (98, 48, 10048):  # Linux / macOS / Windows: адрес занят
                continue
            raise
    raise last


def main():
    global ALLOW_CODE, DEV_TOOLS
    parser = argparse.ArgumentParser(description="Сервер игры-теста по Python")
    parser.add_argument(
        "--host", default=None, help="адрес привязки (по умолчанию 0.0.0.0 — локальная сеть)"
    )
    parser.add_argument("--port", type=int, default=8000, help="порт (по умолчанию 8000)")
    parser.add_argument(
        "--local", action="store_true", help="только этот компьютер (127.0.0.1)"
    )
    parser.add_argument(
        "--no-code", action="store_true", help="отключить проверку написанного кода"
    )
    parser.add_argument(
        "--dev", action="store_true",
        help="панель разработчика в подземелье (прыжки по этажам, пропуск боёв)"
    )
    args = parser.parse_args()
    ALLOW_CODE = not args.no_code
    DEV_TOOLS = args.dev
    init_db()
    # Проверки поднимают сервер на временных данных: снимок _backup им не
    # нужен, а на рабочей папке он ротирует настоящие снимки учителя.
    snapshot = None if os.environ.get("PYQUIZ_NO_BACKUP", "").strip() else make_backup()

    host = "127.0.0.1" if args.local else (args.host or "0.0.0.0")
    try:
        server, port = bind_server(host, args.port)
    except OSError as exc:
        print("Не удалось запустить сервер на %s:%d" % (host, args.port))
        print("Причина: %s" % exc)
        sys.exit(1)

    lan = host == "0.0.0.0"
    if port != args.port:
        print("Порт %d занят — использую %d." % (args.port, port))

    print("=" * 62)
    print("  Подземелье Python — сервер запущен")
    print("  Версия %s от %s%s" % (
        VERSION, VERSION_DATE,
        (", коммит " + version_commit()) if version_commit() else ""))
    print()
    if lan:
        ips = local_ips()
        print("  Режим: локальная сеть (студенты заходят по IP)")
        print("  Игра для студентов:")
        if ips:
            for ip in ips:
                print("      http://%s:%d/game" % (ip, port))
        else:
            print("      http://<IP-компьютера>:%d/game" % port)
        print()
        print("  На этом компьютере:   http://localhost:%d/game" % port)
        print("  Самоподготовка:       http://localhost:%d/study" % port)
        print(
            "  Панель преподавателя: http://%s:%d/results"
            % (ips[0] if ips else "localhost", port)
        )
    else:
        print("  Режим: только этот компьютер")
        print("  Тест:      http://localhost:%d/" % port)
        print("  Подземелье:http://localhost:%d/game" % port)
        print("  Учёба:     http://localhost:%d/study" % port)
        print("  Результаты:http://localhost:%d/results" % port)
        print()
        print("  Для доступа по сети просто запустите:  python3 server.py")
    print()
    print("  Проверка кода: %s" % ("включена" if ALLOW_CODE else "выключена"))
    if ALLOW_CODE:
        backend = sandbox_backend()
        if backend == "wsl":
            where = "WSL" if os.name == "nt" else "локальные namespaces"
            print("  Изоляция кода: %s (отдельные mount/pid/net namespaces, файлы проекта скрыты)" % where)
        elif backend == "unavailable":
            if os.name == "nt":
                need = "WSL"
            else:
                need = "unprivileged user namespaces (unshare)"
            print("  ВНИМАНИЕ: PYQUIZ_SANDBOX требует изоляцию, но %s "
                  "недоступны — проверка кода не работает." % need)
        else:
            print("  ВНИМАНИЕ: песочница без изоляции ОС. Для занятий с кодом")
            print("            включите WSL/namespaces или запускайте с --no-code.")
    if DEV_TOOLS:
        print("  Инструменты разработчика: ВКЛЮЧЕНЫ (панель DEV в подземелье, F2)")
        print("            Результаты такого запуска не стоит считать учебными.")
    if lan and ALLOW_CODE:
        print("  ВНИМАНИЕ: код студентов выполняется на этом компьютере.")
        print("            Запускайте только в доверенной сети или с --no-code.")
    if snapshot:
        print("  Снимок перед занятием: %s" % os.path.relpath(snapshot, BASE_DIR))
        print("  Откат: скопировать оттуда файлы обратно в папку проекта.")
    if TEACHER_PIN:
        print("  Панель преподавателя закрыта паролем (открывайте /results?pin=...)")
    else:
        print("  Панель преподавателя закрыта: пароль не задан.")
        print("  Чтобы открыть её: set PYQUIZ_TEACHER_PIN=пароль && python server.py")
    print()
    print("  Админ-панель игры:   http://localhost:%d/admin" % port)
    if ADMIN_PIN:
        print("      Пароль взят из переменной PYQUIZ_ADMIN_PIN.")
    else:
        print("      Пароль: %s" % ADMIN_SECRET_FILE)
        print("      (файл создан автоматически, смените его при желании)")
    print("      Числа игры хранятся в: %s" % CONFIG_FILE)
    print("  Остановка: Ctrl+C")
    print("=" * 62)
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
