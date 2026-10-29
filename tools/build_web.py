#!/usr/bin/env python3
"""Собрать одиночную веб-игру в standalone/build/.

Серверная классная версия не меняется. В сборку входят:
  * HTML с относительными путями (Itch.io отдаёт игру не с корня домена);
  * локальные профили и сохранения (web-boot.js);
  * проверка Python через Pyodide в Web Worker.

Запуск:
    python tools/build_web.py
    python -m http.server 8080 --directory standalone/build

Для Itch.io загружается содержимое standalone/build/ (zip или HTML-игра).
Pyodide берётся с CDN, пока не запущен tools/fetch_pyodide.py.
"""
import pathlib
import re
import shutil
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
PUBLIC = ROOT / "standalone" / "build"


def rewrite_html(text, stamp):
    text = text.replace('href="/static/', 'href="static/')
    text = text.replace('src="/static/', 'src="static/')
    text = text.replace('<script src="/api/features.js"></script>\n', '')
    text = text.replace('<script src="/api/features.js"></script>', '')
    text = text.replace('<script src="/api/version.js"></script>\n', '')
    text = text.replace('<script src="/api/version.js"></script>', '')
    text = text.replace('href="/"', 'href="index.html"')
    text = text.replace('href="/game"', 'href="index.html"')
    # Локальная инициализация должна идти после auth.js/profile.js и до game.js.
    text = text.replace(
        '<script src="static/auth.js"></script>',
        '<script src="static/auth.js"></script>\n'
        '  <script src="static/web-boot.js"></script>\n'
        '  <script src="static/pyodide-check.js"></script>',
    )
    # GitHub Pages кэширует JS/CSS на 10 минут. Ссылка с версией сборки — это
    # новый URL, поэтому после деплоя браузер не запускает старый game.js.
    text = re.sub(
        r'((?:href|src)=")(static/[^"?#]+\.(?:css|js))(")',
        lambda m: m.group(1) + m.group(2) + "?v=" + stamp + m.group(3),
        text,
    )
    return text


def rewrite_worker_loader(text, stamp):
    return text.replace(
        'static/pyodide-worker.js',
        'static/pyodide-worker.js?v=' + stamp,
    )


def main():
    stamp = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    if not STATIC.is_dir():
        print("нет папки static/", file=sys.stderr)
        return 1
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir(parents=True)
    (PUBLIC / "static").mkdir()

    # Игровые ассеты. Серверные страницы (admin/results/friends/profile)
    # в публичную сборку не входят: у них нет сервера.
    for name in ("style.css", "game.css", "menu.css", "saves.css", "game.html"):
        src = STATIC / name
        if not src.exists():
            continue
        if name.endswith(".html"):
            (PUBLIC / name).write_text(
                rewrite_html(src.read_text(encoding="utf-8"), stamp), encoding="utf-8")
        else:
            # CSS лежит рядом с game.html в static/; HTML ссылается на static/.
            shutil.copy2(src, PUBLIC / "static" / name)

    # Корень сайта — сразу игра. game.html остаётся для старых ссылок
    # и прямого входа в меню.
    shutil.copy2(PUBLIC / "game.html", PUBLIC / "index.html")

    for name in (
        "questions.js", "variants.js", "code-tasks.js", "code-tasks-tests.json",
        "task-meta.js", "practice-variants.js", "items.js", "icons.js",
        "sprites.js", "terrain.js", "dungeon-content.js", "village-content.js",
        "profile.js", "auth.js", "web-boot.js", "pyodide-check.js",
        "pyodide-worker.js", "audio.js", "menu-bg.js", "confirm.js", "menu.js",
        "saves.js", "game.js", "fullscreen.js",
    ):
        src = STATIC / name
        if not src.exists():
            print("нет static/" + name, file=sys.stderr)
            return 1
        if name == "pyodide-check.js":
            (PUBLIC / "static" / name).write_text(
                rewrite_worker_loader(src.read_text(encoding="utf-8"), stamp),
                encoding="utf-8",
            )
        else:
            shutil.copy2(src, PUBLIC / "static" / name)

    # Шрифты игры. Отдельного лендинга больше нет: корень — сама игра.
    fonts_assets = STATIC / "fonts"
    if fonts_assets.is_dir():
        shutil.copytree(fonts_assets, PUBLIC / "static" / "fonts")

    # Рисованный интерфейс (Aseprite): 9-slice панели, кнопки, полосы.
    ui_assets = STATIC / "ui"
    if ui_assets.is_dir():
        shutil.copytree(ui_assets, PUBLIC / "static" / "ui")

    (PUBLIC / "ITCH.txt").write_text(
        "PyDungeon — веб-сборка.\n"
        "Загрузите содержимое этой папки как HTML-игру Itch.io.\n"
        "Профили и сохранения локальные (localStorage), сервер не нужен.\n"
        "Python-код проверяется через Pyodide.\n"
        "Офлайн-вариант: python tools/fetch_pyodide.py после сборки.\n",
        encoding="utf-8",
    )
    print("готово: %s" % PUBLIC)
    # GitHub Pages не должен прогонять файлы через Jekyll: иначе он
    # выбрасывает часть статики и ломает пути к Pyodide.
    (PUBLIC / ".nojekyll").write_text("", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
