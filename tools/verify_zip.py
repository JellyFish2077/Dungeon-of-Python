#!/usr/bin/env python3
"""Проверка готового архива для Itch.io: распаковать и запустить как игру.

    python tools/verify_zip.py [--browser msedge] [--keep]

Проверяется не сборка, а именно zip из dist/: в нём index.html в корне,
LICENSE и CREDITS.md, локальный Pyodide, старт меню, первый поход и
проверка Python-кода. Отдельно — запуск внутри iframe с sandbox как у
Itch.io: там ломается скачивание сейва, и это надо знать до публикации,
а не по жалобе игрока.
"""
import argparse
import re
import shutil
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import verify_web

GOOD_CODE = "def attack_power(base, bonus):\n    return base + bonus"
TASK_ID = "attack_power"

# Так Itch.io вставляет HTML5-игры: без allow-downloads скачивание файлов
# из iframe блокируется, а с allow-fullscreen работает полноэкранный режим.
HOST = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>embed</title>
<style>html,body{margin:0;background:#000}iframe{border:0;display:block}</style>
</head><body>
<iframe id="game" src="index.html" width="1280" height="800"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="autoplay; fullscreen; gamepad"></iframe>
</body></html>
"""


def find_archive():
    # Версии сравниваются как числа: иначе 1.9.8 считается новее 1.55.0.
    def version_key(path):
        return tuple(int(part) for part in re.findall(r"\d+", path.stem))

    archives = sorted((ROOT / "dist").glob("pydungeon-standalone-*.zip"), key=version_key)
    if not archives:
        raise SystemExit("в dist/ нет архива: сначала python tools/package_web.py")
    return archives[-1]


def unpack(zip_path, target):
    with ZipFile(zip_path) as zf:
        zf.extractall(target)
    names = set(zf.namelist())
    return names


def report(ok, text, detail=""):
    print(("[  ok  ] " if ok else "[ FAIL ] ") + text + ((" (%s)" % detail) if detail else ""))
    return ok


def warn(text, detail=""):
    print("[ warn ] " + text + ((" (%s)" % detail) if detail else ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="msedge")
    parser.add_argument("--keep", action="store_true", help="оставить распакованную папку")
    args = parser.parse_args()

    zip_path = find_archive()
    print("архив: %s (%.1f МБ)" % (zip_path, zip_path.stat().st_size / 1024 / 1024))
    target = Path(tempfile.mkdtemp(prefix="pydungeon-zip-"))
    passed = True
    try:
        names = unpack(zip_path, target)
        passed &= report("index.html" in names, "index.html в корне архива")
        passed &= report((target / "LICENSE").is_file(), "LICENSE в корне архива")
        passed &= report((target / "CREDITS.md").is_file(), "CREDITS.md в корне архива")
        passed &= report((target / "static" / "pyodide" / "pyodide.asm.wasm").is_file(),
                         "Pyodide лежит в архиве")

        (target / "embed-host.html").write_text(HOST, encoding="utf-8")
        server, base = verify_web.serve(directory=str(target))
        try:
            with sync_playwright() as pw:
                browser = verify_web.launch(pw, args.browser)
                if browser is None:
                    raise SystemExit("браузер не найден")
                try:
                    passed &= check_direct(browser, base)
                    passed &= check_embed(browser, base)
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()
    finally:
        if args.keep:
            print("распаковано в %s" % target)
        else:
            shutil.rmtree(target, ignore_errors=True)

    print("\nИтог: %s" % ("архив готов к загрузке" if passed else "есть проблемы"))
    return 0 if passed else 1


def open_game(page, base, query="?menu=1"):
    page.goto(base + "/index.html" + query, wait_until="domcontentloaded")
    page.wait_for_function("() => window.PyMenu && window.PyMenu.isOpen()", timeout=40000)


def check_direct(browser, base):
    page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    ok = True
    try:
        open_game(page, base)
        ok &= report(True, "меню стартует из index.html")

        page.click("#menu-new")
        page.wait_for_timeout(400)
        if page.locator("#confirm-overlay").is_visible():
            page.click("#confirm-ok")
        page.wait_for_function(
            "() => document.querySelectorAll('#map .tile').length > 0", timeout=30000
        )
        page.evaluate("() => window.PyGameMenuAPI.openGuard()")
        page.wait_for_timeout(400)
        page.click("#begin-btn")
        page.wait_for_timeout(2800)
        tiles = page.evaluate("() => document.querySelectorAll('#map .tile').length")
        ok &= report(tiles > 100, "первый поход строит карту", "клеток: %d" % tiles)

        result = page.evaluate(
            "async ({code, task}) => await window.__PYQUIZ_CHECK_CODE(code, task)",
            {"code": GOOD_CODE, "task": TASK_ID},
        )
        ok &= report(bool(result and result.get("ok") and result.get("passed") == result.get("total")),
                     "проверка Python-кода через Pyodide",
                     "пройдено %s/%s" % (result.get("passed"), result.get("total")))
        ok &= report(not errors, "игра без ошибок в консоли", "; ".join(errors[:2]))
    finally:
        page.close()
    return ok


def check_embed(browser, base):
    page = browser.new_context(viewport={"width": 1280, "height": 900}).new_page()
    ok = True
    try:
        page.goto(base + "/embed-host.html", wait_until="domcontentloaded")
        frame = page.frame_locator("#game")
        frame.locator("#menu-new").wait_for(timeout=40000)
        ok &= report(True, "игра стартует внутри sandbox-iframe")

        fullscreen = page.evaluate(
            "() => document.getElementById('game').contentDocument.fullscreenEnabled"
        )
        ok &= report(bool(fullscreen), "полноэкранный режим доступен в embed")

        frame.locator("#menu-load").click()
        frame.locator("#saves-export").wait_for(timeout=15000)
        try:
            with page.expect_download(timeout=4000):
                frame.locator("#saves-export").click()
            ok &= report(True, "экспорт сейва в embed скачивает файл")
        except Exception:
            warn("скачивание сейва в embed блокирует sandbox — работает текстовая копия")

        # Запасной путь: тот же сейв текстом, который можно скопировать вручную.
        frame.locator("#saves-text").click()
        frame.locator("#backup-overlay:not(.hidden)").wait_for(timeout=10000)
        text = frame.locator("#backup-text").input_value()
        ok &= report(text.startswith("{") and '"slots"' in text,
                     "«Показать JSON» отдаёт резервную копию",
                     "%d символов" % len(text))
        frame.locator("#backup-copy").click()
        frame.locator("#backup-status").filter(has_text="Скопировано").wait_for(timeout=5000)
        ok &= report(True, "кнопка «Копировать» подтверждает копирование")
    finally:
        page.close()
    return ok


if __name__ == "__main__":
    sys.exit(main())
