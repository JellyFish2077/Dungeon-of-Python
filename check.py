#!/usr/bin/env python3
"""Проверка банка контента игры: вопросы, задания, монстры, предметы.

Запуск:  python3 check.py
Проверяет структуру данных, синтаксис кода и проходимость заданий
эталонными решениями. Код завершения 0 — всё хорошо.
"""

import ast
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from server import (  # noqa: E402
    run_code, ITEM_FIELDS, ENEMY_FIELDS, FLOOR_FIELDS, CONTENT_LIMITS,
    CONTENT_TEXT, balance_schema,
)

REFERENCE = {
    "attack_power": "def attack_power(base, bonus):\n    return base + bonus",
    "health_after_hit": "def health_after_hit(hp, damage):\n    return hp - damage",
    "is_alive": "def is_alive(hp):\n    return hp > 0",
    "heal": "def heal(hp, amount):\n    return hp + amount",
    "double_gold": "def double_gold(gold):\n    return gold * 2",
    "total_hp": "def total_hp(heroes_hp):\n    return sum(heroes_hp)",
    "max_damage": "def max_damage(damages):\n    return max(damages)",
    "count_monsters": "def count_monsters(monsters):\n    return len(monsters)",
    "greet": "def greet(name):\n    return \"Привет, \" + name + \"!\"",
    "count_even": "def count_even(nums):\n    return sum(1 for x in nums if x % 2 == 0)",
    "average": "def average(nums):\n    return sum(nums) / len(nums)",
}


class P:
    def __init__(self, s):
        self.s = s
        self.i = 0
        self.n = len(s)

    def skip(self):
        while self.i < self.n:
            c = self.s[self.i]
            if c in " \t\r\n":
                self.i += 1
            elif c == "/" and self.i + 1 < self.n and self.s[self.i + 1] == "/":
                while self.i < self.n and self.s[self.i] != "\n":
                    self.i += 1
            elif c == "/" and self.i + 1 < self.n and self.s[self.i + 1] == "*":
                self.i += 2
                while self.i + 1 < self.n and not (
                    self.s[self.i] == "*" and self.s[self.i + 1] == "/"
                ):
                    self.i += 1
                self.i += 2
            else:
                break

    def parse(self):
        self.skip()
        v = self.value()
        self.skip()
        return v

    def value(self):
        self.skip()
        c = self.s[self.i]
        if c == "{":
            return self.obj()
        if c == "[":
            return self.arr()
        if c in "\"'`":
            return self.str()
        if self.s.startswith("true", self.i):
            self.i += 4
            return True
        if self.s.startswith("false", self.i):
            self.i += 5
            return False
        if self.s.startswith("null", self.i):
            self.i += 4
            return None
        m = re.match(r"-?\d+(\.\d+)?([eE][+-]?\d+)?", self.s[self.i :])
        if m:
            self.i += len(m.group(0))
            t = m.group(0)
            return float(t) if ("." in t or "e" in t or "E" in t) else int(t)
        raise ValueError(f"bad value at {self.i}: {self.s[self.i:self.i+20]!r}")

    def str(self):
        q = self.s[self.i]
        self.i += 1
        out = []
        mp = {"n": "\n", "t": "\t", "r": "\r", "\\": "\\", "'": "'", '"': '"'}
        while True:
            c = self.s[self.i]
            if c == "\\":
                out.append(mp.get(self.s[self.i + 1], self.s[self.i + 1]))
                self.i += 2
                continue
            if c == q:
                self.i += 1
                return "".join(out)
            out.append(c)
            self.i += 1

    def arr(self):
        self.i += 1
        a = []
        while True:
            self.skip()
            if self.s[self.i] == "]":
                self.i += 1
                return a
            a.append(self.value())
            self.skip()
            if self.s[self.i] == ",":
                self.i += 1

    def obj(self):
        self.i += 1
        o = {}
        while True:
            self.skip()
            if self.s[self.i] == "}":
                self.i += 1
                return o
            if self.s[self.i] in "\"'":
                k = self.str()
            else:
                m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", self.s[self.i :])
                k = m.group(0)
                self.i += len(k)
            self.skip()
            if self.s[self.i] != ":":
                raise ValueError(f"expected : at {self.i}")
            self.i += 1
            o[k] = self.value()
            self.skip()
            if self.s[self.i] == ",":
                self.i += 1


def load_const(path, name):
    s = open(os.path.join(BASE, path), encoding="utf-8").read()
    m = re.search(r"(?:const|let|var)\s+" + re.escape(name) + r"\s*=", s)
    if not m:
        raise ValueError(f"{name} не найден в {path}")
    p = P(s)
    p.i = m.end()
    return p.parse()


def main():
    errors = []
    warns = []

    def err(msg):
        errors.append(msg)

    Q = load_const("static/questions.js", "QUESTIONS")
    TOPICS = load_const("static/questions.js", "TOPICS")
    CODE = load_const("static/code-tasks.js", "CODE_TASKS")
    COPY = load_const("static/code-tasks.js", "COPY_TASKS")
    FILL = load_const("static/code-tasks.js", "FILL_TASKS")
    ERROR = load_const("static/code-tasks.js", "ERROR_TASKS")
    ETYPES = load_const("static/game.js", "ENEMY_TYPES")
    FLOORS = load_const("static/game.js", "FLOORS")
    DIFF = load_const("static/game.js", "DIFFICULTY")
    ICONS = load_const("static/icons.js", "ICONS")
    ITEMS = load_const("static/items.js", "ITEM_POOL")
    TRAPS = load_const("static/dungeon-content.js", "TRAP_TYPES")
    EVENTS = load_const("static/dungeon-content.js", "FLOOR_EVENTS")
    EPILOGUES = load_const("static/dungeon-content.js", "FLOOR_EPILOGUES")
    QUAIPS = load_const("static/dungeon-content.js", "ENEMY_QUIPS")
    ELITE_TITLES = load_const("static/dungeon-content.js", "ELITE_TITLES")
    ELITE_ABILITY = load_const("static/dungeon-content.js", "ELITE_ABILITY_TEXT")
    HAZARDS = load_const("static/dungeon-content.js", "HAZARD_TYPES")
    FLOOR_HAZARD = load_const("static/dungeon-content.js", "FLOOR_HAZARD")
    HAZARD_DENSITY = load_const("static/dungeon-content.js", "HAZARD_DENSITY")
    BLESSINGS = load_const("static/dungeon-content.js", "BLESSINGS")
    BLESS = load_const("static/dungeon-content.js", "BLESS")

    # Вопросы
    ids = [q.get("id") for q in Q]
    if len(ids) != len(set(ids)):
        err("в QUESTIONS есть повторяющиеся id")
    for q in Q:
        tag = f"вопрос id={q.get('id')}"
        if not isinstance(q.get("options"), list) or len(q["options"]) != 4:
            err(f"{tag}: должно быть 4 варианта")
        if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < 4:
            err(f"{tag}: неверный answer")
        if q.get("topic") not in TOPICS:
            err(f"{tag}: неизвестная тема {q.get('topic')!r}")
        if q.get("level") not in (1, 2, 3, 4):
            err(f"{tag}: неверный level")
        if not q.get("explanation"):
            err(f"{tag}: пустое explanation")
        if q.get("code"):
            try:
                compile(q["code"], "<q>", "exec")
            except SyntaxError as e:
                err(f"{tag}: код не компилируется: {e}")
    print(f"вопросы: {len(Q)} шт, id уникальны, темы: {sorted(TOPICS)}")

    def check_choice(items, kind, need_blank):
        for t in items:
            tag = f"{kind} id={t.get('id')}"
            if not isinstance(t.get("options"), list) or len(t["options"]) != 4:
                err(f"{tag}: должно быть 4 варианта")
            if not isinstance(t.get("answer"), int) or not 0 <= t["answer"] < 4:
                err(f"{tag}: неверный answer")
            if not t.get("explanation"):
                err(f"{tag}: пустое explanation")
            if not t.get("code"):
                err(f"{tag}: нет кода")
            has_blank = "___" in (t.get("code") or "")
            if need_blank and not has_blank:
                err(f"{tag}: нет пропуска ___")
            if not need_blank and has_blank:
                warns.append(f"{tag}: лишний ___ в коде")
            if t.get("level") not in (1, 2, 3, 4):
                err(f"{tag}: неверный level")

    check_choice(FILL, "FILL", True)
    check_choice(ERROR, "ERROR", False)
    print(f"FILL: {len(FILL)}, ERROR: {len(ERROR)}")

    # Задания на функции: синтаксис, тесты и проходимость эталоном
    for t in CODE:
        tag = f"CODE id={t.get('id')}"
        m = re.search(r"def\s+(\w+)\s*\(", t.get("starter", ""))
        if not m:
            err(f"{tag}: в starter нет функции")
            continue
        func = m.group(1)
        try:
            compile(t["starter"], "<starter>", "exec")
        except SyntaxError as e:
            err(f"{tag}: starter не компилируется: {e}")
        if not t.get("explanation"):
            err(f"{tag}: пустое explanation")
        for test in t.get("tests", []):
            if not test.get("call", "").startswith(func + "("):
                err(f"{tag}: тест вызывает не ту функцию: {test.get('call')!r}")
            try:
                ast.literal_eval(test["expected"])
            except (ValueError, SyntaxError):
                err(f"{tag}: expected не литерал: {test.get('expected')!r}")
        ref = REFERENCE.get(t["id"])
        if not ref:
            warns.append(f"{tag}: нет эталонного решения для проверки")
            continue
        res = run_code(ref, t["tests"])
        if not res.get("ok") or res.get("passed") != res.get("total"):
            err(f"{tag}: эталон не проходит тесты: {res}")
    # Сервер проверяет банк по taskId, а не по тестам клиента. Копия тестов
    # для сервера должна совпадать с банком; иначе задание «напиши функцию»
    # либо не проверяется, либо проверяется не тем.
    try:
        with open(os.path.join(BASE, "static", "code-tasks-tests.json"),
                  encoding="utf-8") as f:
            SERVER_TESTS = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        err(f"static/code-tasks-tests.json не читается: {e}")
        SERVER_TESTS = {}
    bank_ids = {t["id"] for t in CODE}
    if set(SERVER_TESTS) != bank_ids:
        err("code-tasks-tests.json: набор заданий не совпадает с CODE_TASKS "
            f"(лишние: {sorted(set(SERVER_TESTS) - bank_ids)}, "
            f"нет: {sorted(bank_ids - set(SERVER_TESTS))})")
    for t in CODE:
        want = [{"call": x["call"], "expected": x["expected"]}
                for x in t.get("tests", [])]
        if SERVER_TESTS.get(t["id"]) != want:
            err(f"code-tasks-tests.json: тесты {t['id']} разошлись с банком")
    print(f"CODE: {len(CODE)}, все проходимы эталонами, серверные тесты синхронны")

    for t in COPY:
        try:
            compile(t["code"], "<copy>", "exec")
        except SyntaxError as e:
            err(f"COPY id={t.get('id')}: код не компилируется: {e}")
    print(f"COPY: {len(COPY)}")

    # Монстры, этажи, иконки
    ekeys = {e["key"] for e in ETYPES}
    if len(ekeys) != len(ETYPES):
        err("повторяющиеся key в ENEMY_TYPES")
    for f in FLOORS:
        if not (1 <= f.get("qmin", 0) <= f.get("qmax", 0) <= 4):
            err(f"этаж {f.get('name')!r}: неверный диапазон уровней")
        for key in f.get("pool", []):
            if key not in ekeys:
                err(f"этаж {f.get('name')!r}: монстра {key!r} нет в ENEMY_TYPES")
    if not FLOORS or not FLOORS[-1].get("boss"):
        err("последний этаж должен быть боссом")
    need_icons = ekeys | {"player", "treasure", "stairs", "stairsUp"}
    missing = need_icons - set(ICONS)
    if missing:
        err(f"нет иконок: {sorted(missing)}")
    print(f"монстры: {len(ETYPES)}, этажи: {len(FLOORS)}, иконки: ok")

    # Атмосфера: эпиграф, событие и реплики на каждый этаж и каждого врага
    if len(EPILOGUES) != len(FLOORS):
        err(f"эпиграфов {len(EPILOGUES)}, а этажей {len(FLOORS)}")
    if len(EVENTS) != len(FLOORS):
        err(f"событий {len(EVENTS)}, а этажей {len(FLOORS)}")
    for e in EPILOGUES:
        if not (e.get("text") or "").strip():
            err("пустой эпиграф этажа")
        if e.get("topic") not in TOPICS:
            err(f"эпиграф: тема {e.get('topic')!r} есть не в TOPICS")
    for ev in EVENTS:
        if not (ev.get("text") or "").strip():
            err(f"событие {ev.get('key')!r}: пустой текст")
    for k in ekeys:
        if k not in QUAIPS:
            err(f"у врага {k!r} нет ни одной реплики")
        else:
            for q in QUAIPS[k]:
                if not (q or "").strip():
                    err(f"у врага {k!r} пустая реплика")
    print(f"эпиграфы: {len(EPILOGUES)}, события: {len(EVENTS)}, реплики: {len(QUAIPS)}")

    # Элиты: эпитет у каждого вида и текст у каждой способности.
    # Способность элиты наследует вид, поэтому ключ текста — это key
    # способности (poison, armor, …), а не key врага.
    abilities = {e.get("ability") for e in ETYPES if e.get("ability")}
    if not ELITE_TITLES:
        err("в dungeon-content.js нет ELITE_TITLES — элиты останутся без эпитетов")
    else:
        missing_titles = sorted(ekeys - set(ELITE_TITLES))
        if missing_titles:
            err("нет эпитета элиты для: " + ", ".join(missing_titles))
        extra_titles = sorted(set(ELITE_TITLES) - ekeys)
        if extra_titles:
            warn("эпитет есть для неизвестного врага: " + ", ".join(extra_titles))
    if not ELITE_ABILITY:
        err("в dungeon-content.js нет ELITE_ABILITY_TEXT — игрок не увидит усиления")
    else:
        missing_texts = sorted(abilities - set(ELITE_ABILITY))
        if missing_texts:
            err("нет текста усиленной способности: " + ", ".join(missing_texts))
        for k, v in ELITE_ABILITY.items():
            if not (v or "").strip():
                err(f"усиленная способность {k!r}: пустой текст")
    print(f"элиты: эпитетов {len(ELITE_TITLES)}, текстов способностей {len(ELITE_ABILITY)}")

    # Ловушки
    trap_keys = {t.get("key") for t in TRAPS}
    if len(trap_keys) != len(TRAPS):
        err("повторяющиеся key в TRAP_TYPES")
    for t in TRAPS:
        if t.get("icon") not in ICONS:
            err(f"ловушка {t.get('key')!r}: нет иконки {t.get('icon')!r}")
        if not (t.get("text") or "").strip():
            err(f"ловушка {t.get('key')!r}: пустой текст")
        if not isinstance(t.get("damage"), int) or t["damage"] < 0:
            err(f"ловушка {t.get('key')!r}: некорректный damage")
    print(f"ловушки: {len(TRAPS)}")

    # Опасная среда этажей и сделки на входе.
    if len(FLOOR_HAZARD) != len(FLOORS):
        err(f"FLOOR_HAZARD длиной {len(FLOOR_HAZARD)}, а этажей {len(FLOORS)}")
    for i, key in enumerate(FLOOR_HAZARD):
        if key is None:
            continue
        if key not in HAZARDS:
            err(f"этаж {i + 1}: неизвестная среда {key!r}")
        if key == "dark":
            # Тьма накрывает этаж целиком и клеток не занимает — проверять
            # её плотность бессмысленно, игре нужна только запись в таблице.
            continue
        if not 0 < HAZARD_DENSITY.get(key, 0) < 1:
            err(f"среда {key!r}: плотность {HAZARD_DENSITY.get(key)!r} вне (0, 1)")
    for key, h in HAZARDS.items():
        for field in ("key", "name", "icon", "text", "hint"):
            if not str(h.get(field) or "").strip():
                err(f"среда {key!r}: пустое поле {field!r}")
        if h.get("key") != key:
            err(f"среда {key!r}: поле key = {h.get('key')!r}")
        # Значок среды — текстовый символ (❄, ☾, ✹): он печатается прямо в
        # планке этажа. Это не ключ из ICONS, в отличие от ловушек.
    if not (0 <= BLESS.get("from", -1) < len(FLOORS)):
        err(f"BLESS.from = {BLESS.get('from')!r} вне этажей")
    for key, b in BLESSINGS.items():
        if b.get("key") != key:
            err(f"сделка {key!r}: поле key = {b.get('key')!r}")
        for field in ("name", "icon", "good", "extra"):
            if not (b.get(field) or "").strip():
                err(f"сделка {key!r}: пустое поле {field!r}")
    for key, field in (("curseEnemyDmg", "урон монстров"), ("curseGold", "золото"),
                       ("curseGoldMul", "множитель золота"), ("blessingHp", "здоровье"),
                       ("blessingEnemyRegen", "регенерация")):
        if not isinstance(BLESS.get(key), (int, float)) or BLESS[key] <= 0:
            err(f"BLESS.{key} ({field}): некорректное значение {BLESS.get(key)!r}")
    if BLESS.get("curseEnemyDmg", 0) <= 1:
        err("BLESS.curseEnemyDmg не поднимает урон — сделка без цены")
    if not 0 < BLESS.get("blessingEnemyRegen", 0) < 1:
        err(f"BLESS.blessingEnemyRegen = {BLESS.get('blessingEnemyRegen')!r} вне (0, 1)")
    print(f"среда: {sum(1 for k in FLOOR_HAZARD if k)} этажей, сделок: {len(BLESSINGS)}")

    # Сложности
    for name, d in DIFF.items():
        total = sum(d.get(k, 0) for k in ("wMc", "wCopy", "wFill", "wError", "wCode"))
        if abs(total - 1.0) > 0.001:
            err(f"сложность {name}: веса суммируются в {total}, а не 1.0")
    print("веса сложностей: ok")

    # Предметы
    item_ids = [it.get("id") for it in ITEMS]
    if len(item_ids) != len(set(item_ids)):
        err("в ITEM_POOL есть повторяющиеся id")
    effects = {"lifesteal", "crit", "block", "thorns", "hintFree", "goldBonus",
               "poisonImmune", "reveal", "execute", "cleanse", "fullHeal", "antidote"}
    for it in ITEMS:
        if it.get("slot") not in ("weapon", "armor", "accessory", "potion"):
            err(f"предмет {it.get('id')!r}: неверный slot")
        if it.get("rarity") not in ("common", "uncommon", "rare", "epic"):
            err(f"предмет {it.get('id')!r}: неверный rarity")
        if not (it.get("desc") or "").strip():
            warns.append(f"у предмета {it.get('id')!r} нет описания")
        eff = it.get("effect")
        if eff:
            if eff.get("kind") not in effects:
                err(f"предмет {it.get('id')!r}: неизвестный эффект {eff.get('kind')!r}")
            if it["slot"] == "potion" and "heal" in it and eff["kind"] == "fullHeal":
                pass  # полное лечение, heal=9999 — это норма
    if not any(it["id"] == "small_potion" for it in ITEMS):
        err("нет стартового small_potion")
    n_eff = sum(1 for it in ITEMS if it.get("effect"))
    print(f"предметы: {len(ITEMS)}, с особым эффектом: {n_eff}")

    # Админ-панель: каталог правок на сервере обязан совпадать с таблицами
    # игры. Иначе учитель видит поле, правка которого ни на что не влияет, или
    # не видит нового предмета вовсе — и то и другое выясняется уже в бою.
    schema = balance_schema()
    keys = [f["key"] for f in schema]
    if len(keys) != len(set(keys)):
        err("в схеме админки повторяются ключи")
    for f in schema:
        if not str(f.get("group") or "").strip():
            err(f"поле админки {f['key']!r}: пустая группа")
        if not str(f.get("label") or "").strip():
            err(f"поле админки {f['key']!r}: пустая подпись")
        if f.get("kind") == "text":
            if not f.get("maxlen"):
                err(f"поле админки {f['key']!r}: у текста нет предела длины")
        elif f.get("kind") == "number":
            if not all(isinstance(f.get(k), (int, float))
                       for k in ("min", "max", "step")):
                err(f"поле админки {f['key']!r}: границы не числа")
            elif not f["min"] <= f["max"] or f["step"] <= 0:
                err(f"поле админки {f['key']!r}: бессмысленные границы")
            elif f.get("default") is not None and not f["min"] <= f["default"] <= f["max"]:
                err(f"поле админки {f['key']!r}: стандарт {f['default']} "
                    f"вне [{f['min']}, {f['max']}]")
        else:
            err(f"поле админки {f['key']!r}: незнакомый вид {f.get('kind')!r}")

    item_by_id = {it["id"]: it for it in ITEMS}
    catalog_items = [iid for iid, _label, _fields in ITEM_FIELDS]
    if len(catalog_items) != len(set(catalog_items)):
        err("в ITEM_FIELDS повторяются id")
    for iid, label, fields in ITEM_FIELDS:
        item = item_by_id.get(iid)
        if item is None:
            err(f"каталог админки ссылается на несуществующий предмет {iid!r}")
            continue
        if not label.strip():
            err(f"каталог админки: у предмета {iid!r} пустая подпись")
        for field in fields.split("|"):
            if field.startswith("~"):
                if field[1:] not in CONTENT_TEXT:
                    err(f"предмет {iid!r}: неизвестное текстовое поле {field[1:]!r}")
                continue
            if field not in CONTENT_LIMITS:
                err(f"предмет {iid!r}: неизвестное поле {field!r}")
                continue
            if field.startswith("eff."):
                eff = item.get("effect") or {}
                if field.split(".", 1)[1] not in eff:
                    err(f"предмет {iid!r}: поле {field!r} есть в панели, "
                        f"но у предмета нет такого эффекта")
            elif field not in item:
                err(f"предмет {iid!r}: поле {field!r} есть в панели, "
                    f"но у предмета его нет")
    for iid in item_by_id:
        if iid not in catalog_items:
            err(f"предмет {iid!r} нельзя править из админки — нет в ITEM_FIELDS")

    catalog_enemies = [k for k, _l, _f in ENEMY_FIELDS]
    if len(catalog_enemies) != len(set(catalog_enemies)):
        err("в ENEMY_FIELDS повторяются ключи")
    # ENEMY_TYPES — список словарей, а не карта.
    etypes_by_key = {t.get("key"): t for t in ETYPES}
    for ekey, label, fields in ENEMY_FIELDS:
        etype = etypes_by_key.get(ekey)
        if etype is None:
            err(f"каталог админки ссылается на несуществующий вид {ekey!r}")
            continue
        if not label.strip():
            err(f"каталог админки: у вида {ekey!r} пустая подпись")
        for field in fields.split("|"):
            if field.startswith("~"):
                if field[1:] not in CONTENT_TEXT:
                    err(f"вид {ekey!r}: неизвестное текстовое поле {field[1:]!r}")
            elif field not in CONTENT_LIMITS:
                err(f"вид {ekey!r}: неизвестное поле {field!r}")
            elif field not in etype:
                err(f"вид {ekey!r}: поле {field!r} есть в панели, "
                    f"но у вида его нет")
    for ekey in etypes_by_key:
        if ekey not in catalog_enemies:
            err(f"вид врага {ekey!r} нельзя править из админки — нет в ENEMY_FIELDS")

    if len(FLOOR_FIELDS) != len(FLOORS):
        err(f"FLOOR_FIELDS описывает {len(FLOOR_FIELDS)} этажей, "
            f"а в игре их {len(FLOORS)}")
    for index, (label, fields) in enumerate(FLOOR_FIELDS):
        if index >= len(FLOORS):
            break
        floor = FLOORS[index]
        if label != floor.get("name"):
            err(f"этаж {index + 1}: в панели подпись {label!r}, "
                f"а в игре {floor.get('name')!r}")
        for field in fields.split("|"):
            if field.startswith("~"):
                if field[1:] not in CONTENT_TEXT:
                    err(f"этаж {index + 1}: неизвестное текстовое поле {field[1:]!r}")
                continue
            if field not in CONTENT_LIMITS:
                err(f"этаж {index + 1}: неизвестное поле {field!r}")
            elif field == "pool":
                continue
            elif field not in floor:
                err(f"этаж {index + 1}: поле {field!r} есть в панели, "
                    f"но у этажа его нет")
    n_text = sum(1 for f in schema if f.get("kind") == "text")
    print(f"админ-панель: полей {len(schema)}, из них текстовых {n_text}, "
          f"правимых предметов {len(catalog_items)}, видов {len(catalog_enemies)}, "
          f"этажей {len(FLOOR_FIELDS)}")

    for w in warns:
        print("ПРЕДУПРЕЖДЕНИЕ:", w)
    if errors:
        print(f"\nОШИБОК: {len(errors)}")
        for e in errors:
            print(" -", e)
        return 1
    print("\nВсё хорошо: контент корректен.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
