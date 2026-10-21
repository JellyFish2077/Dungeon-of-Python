#!/usr/bin/env python3
"""Smoke-проверка публичной веб-сборки PyDungeon в настоящем браузере.

Проверяется то, чего не видят node-проверки и серверные тесты:
  * стартовый экран и переход в игру;
  * карта рисуется, а не остаётся пустой;
  * проверка Python-кода через Pyodide: верное решение 3/3, неверное — меньше;
  * поход создаёт локальный сейв, а «Продолжить поход» поднимает его;
  * за весь прогон нет ни одного запроса к /api/* (сборка без сервера);
  * в консоли нет ошибок.

Запуск:
    python verify_web.py
    python verify_web.py --browser msedge   # Edge вместо Chromium
    python verify_web.py --rebuild          # пересобрать standalone/build

Нужен Playwright:
    pip install playwright
    playwright install chromium
На Windows Chromium можно не скачивать: --browser msedge использует
установленный Edge.

Код возврата: 0 — зелёный, 1 — есть сбои, 3 — проверка не выполнена
(нет Playwright или браузера). 3 в run_all_checks.py считается
необязательным пропуском, а не провалом.
"""
import argparse
import functools
import http.server
import os
import re
import socketserver
import subprocess
import sys
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, "standalone", "build")

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

RESULTS = []


def check(ok, name, extra=""):
    RESULTS.append(bool(ok))
    mark = "  ok  " if ok else " СБОЙ "
    detail = ("   -> " + str(extra)) if (extra and not ok) else (
        ("   (" + str(extra) + ")") if extra else "")
    print("[%s] %s%s" % (mark, name, detail))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Статика сборки с правильными типами для Pyodide."""

    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
    })

    def log_message(self, fmt, *args):
        pass


def ensure_build(rebuild):
    index = os.path.join(BUILD, "index.html")
    if rebuild or not os.path.isfile(index):
        print("Сборка standalone/build…")
        code = subprocess.call(
            [sys.executable, os.path.join(ROOT, "tools", "build_web.py")],
            cwd=ROOT,
        )
        if code != 0:
            return False
    pyodide = os.path.join(BUILD, "static", "pyodide", "pyodide.js")
    if not os.path.isfile(pyodide):
        print("Pyodide локально не найден: первая проверка кода пойдёт через CDN.")
        print("Для офлайн-прогона: python tools/fetch_pyodide.py")
    return os.path.isfile(os.path.join(BUILD, "index.html"))


def serve():
    handler = functools.partial(QuietHandler, directory=BUILD)
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, "http://127.0.0.1:%d" % server.server_address[1]


def launch(pw, name):
    """Браузер для проверки. None — Playwright есть, но браузера нет."""
    if name in ("msedge", "edge"):
        return pw.chromium.launch(channel="msedge", headless=True)
    try:
        return pw.chromium.launch(headless=True)
    except Exception:
        # На Windows без `playwright install` остаётся системный Edge.
        try:
            return pw.chromium.launch(channel="msedge", headless=True)
        except Exception:
            return None


GOOD_CODE = "def attack_power(base, bonus):\n    return base + bonus"
BAD_CODE = "def attack_power(base, bonus):\n    return 0"
TASK_ID = "attack_power"


def main():
    ap = argparse.ArgumentParser(description="Smoke-проверка веб-сборки PyDungeon")
    ap.add_argument("--browser", default="chromium",
                    choices=["chromium", "msedge", "edge"],
                    help="какой браузер запускать (по умолчанию Chromium)")
    ap.add_argument("--rebuild", action="store_true",
                    help="пересобрать standalone/build перед проверкой")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Пропуск: не установлен Playwright.")
        print("  python -m pip install playwright")
        print("  python -m playwright install chromium   # или --browser msedge")
        return 3

    if not ensure_build(args.rebuild):
        print("Сбой: не удалось собрать standalone/build.")
        return 1

    server, base = serve()
    try:
        with sync_playwright() as pw:
            try:
                browser = launch(pw, args.browser)
            except Exception as exc:  # noqa: BLE001
                print("Пропуск: браузер не запускается: %s" % exc)
                return 3
            if browser is None:
                print("Пропуск: нет ни Chromium от Playwright, ни Edge.")
                print("  python -m playwright install chromium   # или --browser msedge")
                return 3
            try:
                run_checks(browser, base)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()

    ok = sum(RESULTS)
    print()
    print("Итог: %d/%d проверок пройдено." % (ok, len(RESULTS)))
    return 0 if ok == len(RESULTS) else 1


def run_checks(browser, base):
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    api_requests = []
    console_errors = []
    page.on("request", lambda r: api_requests.append(r.url) if "/api/" in r.url else None)
    page.on("console",
            lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # 1. Стартовый экран.
    page.goto(base + "/", wait_until="domcontentloaded")
    check("PyDungeon" in page.title(), "стартовый экран открывается", page.title())
    check(page.locator("#new-game").is_visible(), "на старте есть «Новая игра»")

    # 2. «Новая игра» сразу открывает деревню: стартовый экран уже собрал имя,
    #    поэтому игровое меню не дублируется.
    page.fill("#player-name", "Смоук")
    page.click("#new-game")
    page.wait_for_url(re.compile(r".*/game\.html\?play=1$"), timeout=15000)
    page.wait_for_function(
        "() => document.querySelectorAll('#map .tile').length > 0", timeout=15000)
    check(not page.locator("#menu-overlay").is_visible(),
          "«Новая игра» открывает деревню без лишнего меню")
    # Дожидаемся загрузки крупных ассетов (спрайты, рельеф, иконки), прежде
    # чем уходить на ?menu=1: иначе браузер обрывает их загрузку и в консоли
    # появляются сетевые ошибки, не связанные с игрой.
    page.wait_for_load_state("load", timeout=15000)

    # 3. Меню по ?menu=1: вход подставлен локальным именем, «Играть» отдаёт карту.
    page.goto(base + "/game.html?menu=1", wait_until="load")
    page.wait_for_function(
        "() => window.PyMenu && window.PyMenu.isOpen()", timeout=15000)
    check(page.locator("#menu-overlay").is_visible(), "стартовое меню игры открывается")
    account = page.locator("#menu-account").inner_text()
    check("Смоук" in account, "меню видит имя игрока", account)
    page.click("#menu-play")
    page.wait_for_timeout(250)
    check(not page.locator("#menu-overlay").is_visible(), "«Играть» закрывает меню")

    page.wait_for_function(
        "() => document.querySelectorAll('#map .tile').length > 0", timeout=15000)
    tiles = page.evaluate("() => document.querySelectorAll('#map .tile').length")
    check(tiles > 0, "карта рисуется", "плиток: %s" % tiles)
    check(page.evaluate("() => window.__PYQUIZ_WEB === true"),
          "сборка запущена в веб-режиме (без сервера)")

    # 4. Python-код через Pyodide. Первый вызов грузит runtime (несколько секунд).
    good = page.evaluate(
        "async ({code, task}) => await window.__PYQUIZ_CHECK_CODE(code, task)",
        {"code": GOOD_CODE, "task": TASK_ID})
    check(good.get("ok") and good.get("passed") == good.get("total") == 3,
          "верное решение проходит 3/3", good)
    bad = page.evaluate(
        "async ({code, task}) => await window.__PYQUIZ_CHECK_CODE(code, task)",
        {"code": BAD_CODE, "task": TASK_ID})
    check(bad.get("ok") and 0 < bad.get("passed", 0) < bad.get("total", 1),
          "неверное решение не проходит всё", bad)

    # 5. Поход создаёт сейв, «Продолжить» его поднимает.
    page.evaluate("() => window.__PYQUIZ_WEB_API.begin()")
    page.wait_for_function(
        "() => Object.keys(localStorage).some(k => k.startsWith('pyquiz_save_v1'))",
        timeout=15000)
    check(True, "поход создаёт локальный сейв")

    page.goto(base + "/", wait_until="domcontentloaded")
    page.wait_for_selector("#continue-game:not(.hidden)", timeout=10000)
    check(page.locator("#continue-game").is_visible(), "появилась «Продолжить поход»")
    page.click("#continue-game")
    page.wait_for_url(re.compile(r".*/game\.html\?resume=1.*"), timeout=10000)
    page.wait_for_function(
        "() => ((document.getElementById('log') || {}).textContent || '')"
        ".includes('Продолжение игры')", timeout=15000)
    check(True, "продолжение поднимает сохранённый поход")

    # 6. Сборка без сервера.
    check(not api_requests, "нет запросов к /api/*", ", ".join(api_requests[:3]))

    # favicon — не ошибка сборки, его отсутствие допустимо.
    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check(not real_errors, "в консоли нет ошибок", " | ".join(real_errors[:3]))


if __name__ == "__main__":
    sys.exit(main())
