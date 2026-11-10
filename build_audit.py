#!/usr/bin/env python3
"""Аудит публичной сборки PyDungeon.

Проверяет, что в standalone/build не попали секреты, DEV-флаги, серверные
файлы и битые ссылки на ассеты. Сборка пересобирается в публичном режиме,
поэтому аудит не зависит от того, что лежало в папке до него.

Запуск:
    python build_audit.py
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, "standalone", "build")
TEXT_EXT = {".js", ".mjs", ".html", ".css", ".json", ".txt", ".md", ".svg"}
FORBIDDEN_NAMES = {".secret", ".admin-secret", "social.db", "users.json",
                   "game-config.json", "game-config.backup.json"}
FORBIDDEN_TEXT = [
    "window.__PYQUIZ_FEATURES = { code: true, dev: true",
    "__ADMIN_SECRET",
    "tools/unionepro-helper",
]

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def fail(errors, message):
    errors.append(message)


def main():
    errors = []
    code = subprocess.call(
        [sys.executable, os.path.join(ROOT, "tools", "build_web.py")],
        cwd=ROOT,
    )
    if code != 0:
        print("Сбой: публичная сборка не собралась.")
        return 1

    # Pyodide нужен для проверки кода в офлайне. Если его нет, сборка
    # останется рабочей, но будет тянуть runtime с CDN.
    fetch = subprocess.call(
        [sys.executable, os.path.join(ROOT, "tools", "fetch_pyodide.py")],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if fetch != 0:
        print("  предупреждение: Pyodide не скачан, сборка будет тянуть runtime с CDN")

    if not os.path.isdir(BUILD):
        print("Сбой: нет папки standalone/build.")
        return 1

    for name in ("index.html", "game.html", ".nojekyll"):
        if not os.path.isfile(os.path.join(BUILD, name)):
            fail(errors, "нет обязательного файла " + name)

    web_boot = os.path.join(BUILD, "static", "web-boot.js")
    if not os.path.isfile(web_boot):
        fail(errors, "нет static/web-boot.js")
    else:
        text = open(web_boot, "r", encoding="utf-8", errors="replace").read()
        if "dev: false" not in text:
            fail(errors, "web-boot.js: DEV не выключен в публичной сборке")
        package = json.load(open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8"))
        version = re.search(r'version:\s*"([^"]+)-web"', text)
        if not version:
            fail(errors, "web-boot.js: не найдена версия сборки")
        elif not version.group(1).startswith(package.get("version", "")):
            fail(errors, "web-boot.js: версия %s не совпадает с package.json %s" %
                 (version.group(1), package.get("version")))

    files = []
    for dirpath, _, names in os.walk(BUILD):
        for name in names:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, BUILD).replace("\\", "/")
            files.append(rel)
            if name in FORBIDDEN_NAMES:
                fail(errors, "в сборке есть запрещённый файл " + rel)
            if name != ".nojekyll" and not os.path.getsize(full):
                fail(errors, "пустой файл " + rel)

    if not any(name.startswith("static/pyodide/") for name in files):
        print("  предупреждение: Pyodide не скачан, сборка будет тянуть runtime с CDN")

    # Все относительные ссылки из HTML должны существовать.
    for name in ("index.html", "game.html"):
        full = os.path.join(BUILD, name)
        if not os.path.isfile(full):
            continue
        html = open(full, "r", encoding="utf-8", errors="replace").read()
        for match in re.finditer(r'(?:src|href)="([^"]+)"', html):
            link = match.group(1).split("?")[0].split("#")[0]
            if not link or link.startswith(("http://", "https://", "data:", "#", "/api/")):
                continue
            target = os.path.normpath(os.path.join(BUILD, link))
            if not os.path.isfile(target):
                fail(errors, "%s: битая ссылка %s" % (name, link))

    # Запрещённые строки в текстовых файлах.
    for rel in files:
        if os.path.splitext(rel)[1].lower() not in TEXT_EXT:
            continue
        full = os.path.join(BUILD, rel)
        try:
            text = open(full, "r", encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        for needle in FORBIDDEN_TEXT:
            if needle in text:
                fail(errors, "%s: найдено «%s»" % (rel, needle))

    print("Аудит публичной сборки")
    print("  файлов: %d, размер: %.1f МБ" %
          (len(files), sum(os.path.getsize(os.path.join(BUILD, f)) for f in files) / 1048576))
    if errors:
        for message in errors:
            print("  СБОЙ: " + message)
        print("Итог: %d ошибок сборки." % len(errors))
        return 1
    print("Итог: публичная сборка чистая.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
