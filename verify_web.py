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


class QuietServer(socketserver.ThreadingTCPServer):
    """Сервер с запасом очереди: Chromium открывает много соединений сразу.

    У ThreadingTCPServer по умолчанию request_queue_size = 5. При загрузке
    восемнадцати скриптов и картинок часть запросов получала
    ERR_CONNECTION_REFUSED, из-за чего падала то карта, то консоль.
    """

    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 128


def serve():
    handler = functools.partial(QuietHandler, directory=BUILD)
    server = QuietServer(("127.0.0.1", 0), handler)
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
    page.on("dialog", lambda d: d.accept())

    # 1. Корень сайта сразу ведёт в главное меню: отдельного landing больше нет.
    page.goto(base + "/", wait_until="domcontentloaded")
    page.wait_for_url(re.compile(r".*/game\.html\?menu=1(?:&.*)?$"), timeout=15000)
    page.wait_for_function(
        "() => window.PyMenu && window.PyMenu.isOpen()", timeout=15000)
    check("PyDungeon" in page.title(), "стартовый экран открывается", page.title())
    check(page.locator("#menu-overlay").is_visible(),
          "корень открывает главное меню")
    labels = page.locator("#menu-list .menu-item-label").all_inner_texts()
    check(labels == ["Новая игра", "Загрузить", "Справочник", "Обновления",
                     "Настройки", "Профиль", "Об игре", "Выход"],
          "главное меню — один вертикальный список", labels)
    check(page.locator("#menu-dungeon-bg").is_visible(),
          "фон главного меню — подземелье")
    check(page.locator("#menu-view-main .menu-logo").count() == 0,
          "логотип в главном меню убран")
    check(page.locator("#menu-view-main .menu-tagline").count() == 0 and
          page.locator("#menu-hint").count() == 0,
          "под заголовком и внизу нет подписей")
    menu_box = page.locator("#menu-list").bounding_box()
    menu_notes = page.evaluate(
        "() => Array.from(document.querySelectorAll('#menu-list .menu-item-note'))"
        ".filter((n) => n.offsetParent !== null).length")
    check(menu_box and menu_box["x"] < 240 and menu_notes == 0,
          "кнопки главного меню без подписей, меню слева",
          menu_box and menu_box["x"])
    check(page.locator("#menu-load").get_attribute("aria-disabled") == "false",
          "«Загрузить» открывает меню сохранений")
    page.click("#menu-load")
    page.wait_for_function(
        "() => window.PySaves && window.PySaves.isOpen()", timeout=10000)
    check(page.locator("#saves-title").inner_text() == "Сохранения",
          "меню сохранений открывается из главного меню")
    page.click("#saves-back")
    page.wait_for_timeout(200)
    check(page.locator("#menu-view-main").is_visible(),
          "закрытие сохранений возвращает в меню")

    page.click("#menu-updates")
    updates_text = page.locator("#updates-box").inner_text()
    check(page.locator("#updates-overlay").is_visible() and
          "Пять биомов" in updates_text and "1.7.0" in updates_text,
          "«Обновления» открывают ленту новостей")
    page.click("#updates-close")
    page.wait_for_timeout(200)
    check(not page.locator("#updates-overlay").is_visible() and
          page.locator("#menu-view-main").is_visible(),
          "закрытие обновлений возвращает в главное меню")

    # Профиль, справка и настройки — пункты списка, а не отдельные кнопки.
    page.click("#menu-profile")
    page.wait_for_function(
        "() => (document.getElementById('menu-account-panel') || {}).textContent"
        ".includes('Игрок')", timeout=10000)
    check(True, "«Профиль» открывает игрока")
    page.click("#menu-back-account")
    page.click("#menu-about")
    check(page.locator("#menu-about-title").inner_text() == "Об игре",
          "«Об игре» открывает справку")
    page.click("#menu-back-about")
    page.click("#menu-settings")
    check(page.locator("#menu-settings-title").inner_text() == "Настройки",
          "«Настройки» открывают настройки")
    page.click("#menu-back-settings")

    # Дожидаемся крупных ассетов, прежде чем уходить в деревню.
    page.wait_for_load_state("load", timeout=15000)
    page.click("#menu-new")
    page.wait_for_timeout(400)
    check(not page.locator("#menu-overlay").is_visible(), "«Новая игра» закрывает меню")
    check(not page.locator("#entrance-overlay").is_visible(),
          "«Новая игра» не открывает стража автоматически")

    page.wait_for_function(
        "() => document.querySelectorAll('#map .tile').length > 0", timeout=15000)
    opened = page.evaluate("() => window.PyGameMenuAPI.openGuard()")
    page.wait_for_timeout(350)
    check(opened and page.locator("#entrance-overlay").is_visible(),
          "страж открывается отдельным действием")
    focused = page.evaluate("() => document.activeElement && document.activeElement.id")
    check(focused in ("begin-btn", "resume-btn"), "фокус в окне стража", focused)
    page.click("#entrance-close")
    page.wait_for_timeout(200)

    page.wait_for_function(
        "() => document.querySelectorAll('#map .tile').length > 0", timeout=15000)
    tiles = page.evaluate("() => document.querySelectorAll('#map .tile').length")
    check(tiles > 0, "карта рисуется", "плиток: %s" % tiles)
    check(page.evaluate("() => window.__PYQUIZ_WEB === true"),
          "сборка запущена в веб-режиме (без сервера)")

    # 3. Пауза: ESC, пять пунктов, сохранение и возврат в игру.
    page.evaluate(
        "() => { const l = document.getElementById('log');"
        " if (l) l.classList.add('collapsed'); }")
    page.keyboard.press("Escape")
    page.wait_for_function(
        "() => window.PyMenu && window.PyMenu.isOpen()", timeout=10000)
    pause_labels = page.locator("#pause-list .menu-item-label").all_inner_texts()
    check(page.locator("#menu-view-pause").is_visible(),
          "ESC открывает паузу", pause_labels)
    check(not page.locator("#menu-dungeon-bg").is_visible(),
          "в паузе фон подземелья скрыт")
    pause_notes = page.evaluate(
        "() => Array.from(document.querySelectorAll('#pause-list .menu-item-note'))"
        ".filter((n) => n.offsetParent !== null).length")
    check(pause_notes == 0, "кнопки паузы без подписей")
    check(pause_labels == ["Продолжить", "Сохранить", "Загрузить",
                           "Настройки", "Справочник", "Выход в Меню"],
          "меню паузы — шесть пунктов", pause_labels)
    page.click("#pause-save")
    page.wait_for_function(
        "() => window.PySaves && window.PySaves.isOpen()", timeout=10000)
    check("сохранить поход" in page.locator("#saves-subtitle").inner_text().lower(),
          "«Сохранить» открывает меню сохранений")
    empty_text = page.locator("#saves-list .save-slot.is-empty").first.inner_text()
    check("Записать новое сохранение" in empty_text,
          "пустая ячейка предлагает записать сохранение", empty_text)
    page.locator("#saves-list .save-slot.is-empty").first.click()
    page.wait_for_timeout(250)
    filled = page.locator("#saves-list .save-slot:not(.is-empty)")
    check(filled.count() == 1, "сохранение появляется в списке")
    filled.first.click()
    page.wait_for_timeout(150)
    check(page.locator("#saves-detail .save-detail-shot").is_visible(),
          "у сохранения есть скриншот")
    check("Деревня" in page.locator("#saves-detail .save-detail-meta").inner_text(),
          "у сохранения есть описание")
    action_labels = page.locator("#saves-detail .saves-btn").all_inner_texts()
    check(action_labels == ["Перезаписать", "Переименовать", "Удалить"],
          "кнопки ячейки: перезаписать, переименовать, удалить", action_labels)
    page.click("#saves-detail [data-do='rename']")
    page.fill("#save-rename-input", "Тестовая ячейка")
    page.click("#saves-detail [data-do='rename-save']")
    page.wait_for_timeout(200)
    check(page.locator("#saves-detail .save-detail-title").inner_text() == "Тестовая ячейка",
          "сохранение переименовывается")
    # Вторая ячейка: проверяем удаление, не теряя первую.
    page.locator("#saves-list .save-slot.is-empty").first.click()
    page.wait_for_timeout(200)
    page.locator("#saves-list .save-slot:not(.is-empty)").nth(1).click()
    page.click("#saves-detail [data-do='delete']")
    page.wait_for_timeout(250)
    check(page.locator("#saves-list .save-slot:not(.is-empty)").count() == 1,
          "сохранение удаляется")
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    check(page.locator("#menu-view-pause").is_visible(),
          "закрытие сохранений возвращает в паузу")
    page.click("#pause-load")
    page.wait_for_function(
        "() => window.PySaves && window.PySaves.isOpen()", timeout=10000)
    check("загрузить поход" in page.locator("#saves-subtitle").inner_text().lower(),
          "«Загрузить» открывает меню сохранений")
    page.locator("#saves-list .save-slot:not(.is-empty)").first.click()
    page.click("#saves-detail [data-do='load']")
    page.wait_for_timeout(400)
    check(not page.locator("#saves-overlay").is_visible() and
          not page.locator("#menu-overlay").is_visible(),
          "«Загрузить» возвращает в сохранённую деревню")
    page.click("#menu-btn")
    page.wait_for_timeout(300)
    page.click("#pause-settings")
    page.wait_for_timeout(200)
    check(page.locator("#menu-settings-title").inner_text() == "Настройки",
          "настройки из паузы открываются")
    page.click("#menu-back-settings")
    page.wait_for_timeout(200)
    check(page.locator("#menu-view-pause").is_visible(),
          "из настроек возвращаемся в паузу")
    page.click("#pause-resume")
    page.wait_for_timeout(250)
    check(not page.locator("#menu-overlay").is_visible(),
          "«Продолжить» возвращает в игру")
    page.click("#menu-btn")
    page.wait_for_timeout(250)
    check(page.locator("#menu-view-pause").is_visible(),
          "кнопка «Пауза» открывает паузу")
    page.click("#pause-resume")
    page.wait_for_timeout(200)

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
    page.wait_for_function(
        "() => document.getElementById('tutorial-panel') &&"
        " !document.getElementById('tutorial-panel').classList.contains('hidden')",
        timeout=15000)
    check(page.locator("#tutorial-steps [data-step]").count() == 4,
          "первый спуск показывает обучение")
    page.click("#tutorial-skip")
    page.wait_for_timeout(250)
    check(not page.locator("#tutorial-panel").is_visible(),
          "обучение можно пропустить")
    check(page.evaluate(
        "() => { const u = currentUser();"
        " return !!(u && getProfile(u.name).tutorialDone); }"),
        "пропуск обучения запоминается")

    page.goto(base + "/", wait_until="domcontentloaded")
    page.wait_for_url(re.compile(r".*/game\.html\?menu=1(?:&.*)?$"), timeout=15000)
    page.wait_for_function(
        "() => window.PyMenu && window.PyMenu.isOpen()", timeout=15000)
    check(page.locator("#menu-load").get_attribute("aria-disabled") == "false",
          "«Загрузить» доступна при сохранении")
    page.click("#menu-load")
    page.wait_for_function(
        "() => window.PySaves && window.PySaves.isOpen()", timeout=10000)
    page.locator("#saves-list .save-slot:not(.is-empty)").first.click()
    page.click("#saves-detail [data-do='load']")
    page.wait_for_timeout(400)
    check(not page.locator("#menu-overlay").is_visible(),
          "«Загрузить» поднимает сохранение из списка")

    # 6. «Выход в Меню» из паузы и «Выход» из главного меню.
    page.click("#menu-btn")
    page.wait_for_function(
        "() => window.PyMenu && window.PyMenu.isOpen()", timeout=10000)
    check(page.locator("#menu-view-pause").is_visible(),
          "из игры открывается пауза")
    page.click("#pause-exit")
    page.wait_for_timeout(250)
    check(page.locator("#menu-view-main").is_visible(),
          "«Выход в Меню» возвращает главное меню")
    page.click("#menu-exit")
    page.wait_for_url(re.compile(r".*/index\.html\?exit=1$"), timeout=10000)
    check("Вы вышли" in page.locator("#exit-text").inner_text(),
          "«Выход» ведёт на страницу завершения")

    # 7. Сборка без сервера.
    check(not api_requests, "нет запросов к /api/*", ", ".join(api_requests[:3]))

    # favicon — не ошибка сборки, его отсутствие допустимо.
    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check(not real_errors, "в консоли нет ошибок", " | ".join(real_errors[:3]))


if __name__ == "__main__":
    sys.exit(main())
