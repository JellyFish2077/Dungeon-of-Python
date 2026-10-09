#!/usr/bin/env python3
"""Проверка банка контента игры: вопросы, задания, монстры, предметы.

Запуск:  python3 check.py
Проверяет структуру данных, синтаксис кода и проходимость заданий
эталонными решениями. Код завершения 0 — всё хорошо.
"""

import ast
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from server import run_code  # noqa: E402

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
    print(f"CODE: {len(CODE)}, все проходимы эталонами")

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

    # Сложности
    for name, d in DIFF.items():
        total = sum(d.get(k, 0) for k in ("wMc", "wCopy", "wFill", "wError", "wCode"))
        if abs(total - 1.0) > 0.001:
            err(f"сложность {name}: веса суммируются в {total}, а не 1.0")
    print("веса сложностей: ok")

    # Предметы
    for it in ITEMS:
        if it.get("slot") not in ("weapon", "armor", "accessory", "potion"):
            err(f"предмет {it.get('id')!r}: неверный slot")
        if it.get("rarity") not in ("common", "uncommon", "rare", "epic"):
            err(f"предмет {it.get('id')!r}: неверный rarity")
    if not any(it["id"] == "small_potion" for it in ITEMS):
        err("нет стартового small_potion")
    print(f"предметы: {len(ITEMS)}")

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
