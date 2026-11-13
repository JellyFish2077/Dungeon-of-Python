#!/usr/bin/env python3
"""Обложка 630×500 для страницы Itch.io: тёмное подземелье.

    python tools/make_itch_cover.py [--lang ru|en]

Фон — настоящий кадр из игры: скрипт сам запускает standalone/build,
начинает поход и берёт центральный кусок карты, затемнённый до текстуры.
На обложке только логотип и дракон — без описаний, цифр и подписей.
Заголовок набран Handjet; фон и спрайт берутся из сборки, поэтому обложка
не расходится с игрой.

Основная страница Itch — английская: для неё --lang en, обложка
сохраняется рядом как cover-630x500-en.png. Русская остаётся без суффикса.
"""
import argparse
import base64
import io
import re
import sys
import tempfile
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "itch"
OUT.mkdir(parents=True, exist_ok=True)
SRC = (ROOT / "static" / "sprites.js").read_text(encoding="utf-8")

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))
import verify_web  # noqa: E402
from shot_itch import new_page, start_dungeon  # noqa: E402

LANG = "ru"


def sprite(name: str) -> str:
    match = re.search(rf'{name}:\s*"data:image/png;base64,([^"]+)"', SRC)
    if not match:
        raise SystemExit(f"sprite not found: {name}")
    return "data:image/png;base64," + match.group(1)


def font(name: str) -> str:
    data = base64.b64encode((ROOT / "static" / "fonts" / name).read_bytes()).decode("ascii")
    return "data:font/ttf;base64," + data


def dungeon_background(browser, base) -> str:
    """Центральный кадр подземелья без HUD: только тайлы, пол и стены."""
    page = new_page(browser)
    try:
        start_dungeon(page, base)
        # Оставляем только карту: HUD и панели в обложке ни к чему.
        page.evaluate(
            """() => {
                const hide = document.createElement("style");
                hide.textContent = ".site-head,#game-dock,#hero-hud,#minimap-dock,"
                    + "#log,.action-btn,.toast,.story-hud,.campaign-hud{display:none!important}";
                document.head.appendChild(hide);
            }"""
        )
        page.wait_for_timeout(500)
        shot = Image.open(io.BytesIO(page.screenshot()))
    finally:
        page.close()
    left = (shot.width - 630) // 2
    top = (shot.height - 500) // 2
    crop = shot.crop((left, top, left + 630, top + 500)).convert("RGB")
    buffer = io.BytesIO()
    crop.save(buffer, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


HTML = """<!doctype html>
<html lang="__LANG__">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: "Handjet"; src: url("__HJ_BOLD__") format("truetype"); font-weight: 700; font-display: block; }
  @font-face { font-family: "Handjet"; src: url("__HJ_BLACK__") format("truetype"); font-weight: 900; font-display: block; }
  @font-face { font-family: "Golos Text"; src: url("__GT_REG__") format("truetype"); font-weight: 400; font-display: block; }
  @font-face { font-family: "Golos Text"; src: url("__GT_BOLD__") format("truetype"); font-weight: 700; font-display: block; }

  :root {
    --void: #07090c;
    --ash: #8e9aa6;
    --bone: #ded7c8;
    --torch: #f2a24a;
    --python: #6fb7a8;
    --line: rgba(222,215,200,.16);
    --display: "Handjet", "Arial Black", sans-serif;
    --sans: "Golos Text", system-ui, sans-serif;
    --mono: Consolas, "Courier New", monospace;
    --noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.09'/%3E%3C/svg%3E");
  }
  * { box-sizing: border-box; }
  html, body { width: 630px; height: 500px; margin: 0; overflow: hidden; }
  body {
    position: relative; color: var(--bone); background: var(--void);
    font-family: var(--sans); overflow: hidden;
  }

  /* Фон — настоящий кадр игры, притемнённый под текст. */
  .map {
    position: absolute; inset: 0;
    background: url("__BG__") center / cover no-repeat;
    opacity: .80; filter: saturate(.72) brightness(.82);
  }
  .veil {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(7,9,12,.97) 0%, rgba(7,9,12,.88) 36%,
                      rgba(7,9,12,.40) 64%, rgba(7,9,12,.16) 100%),
      linear-gradient(180deg, rgba(7,9,12,.38), transparent 42%, rgba(7,9,12,.58));
  }
  .grain { position: absolute; inset: 0; background: var(--noise); pointer-events: none; }
  body::after {
    content: ""; position: absolute; inset: 12px; border: 1px solid var(--line);
    pointer-events: none;
  }

  .brand { position: absolute; left: 40px; top: 172px; z-index: 3; }
  h1 {
    margin: 0; font-family: var(--display); font-weight: 900; font-size: 96px;
    line-height: .80; letter-spacing: -.01em;
    color: var(--bone);
    text-shadow: 0 0 30px rgba(242,162,74,.20), 0 3px 0 #040608;
    white-space: nowrap;
  }
  h1 span { color: var(--torch); }

  .dragon-glow {
    position: absolute; right: 8px; bottom: 58px; width: 310px; height: 310px;
    background: radial-gradient(circle, rgba(198,90,51,.24), transparent 66%);
    pointer-events: none;
  }
  .dragon {
    position: absolute; right: 38px; bottom: 100px; width: 202px; height: 202px;
    image-rendering: pixelated;
    filter: drop-shadow(0 0 24px rgba(198,90,51,.32))
            drop-shadow(0 10px 0 rgba(0,0,0,.32));
  }
</style>
</head>
<body>
  <div class="map"></div>
  <div class="veil"></div>
  <div class="grain"></div>

  <div class="brand">
    <h1>Py<span>Dungeon</span></h1>
  </div>

  <div class="dragon-glow"></div>
  <img class="dragon" src="__DRAGON__" alt="">
</body></html>
"""


def main():
    global LANG
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=("ru", "en"), default="ru")
    args = parser.parse_args()
    LANG = args.lang
    import shot_itch
    shot_itch.LANG = LANG

    with tempfile.TemporaryDirectory() as tmp:
        server, base = verify_web.serve()
        try:
            with sync_playwright() as pw:
                browser = verify_web.launch(pw, "msedge") or pw.chromium.launch(headless=True)
                try:
                    background = dungeon_background(browser, base)
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()

        html = (
            HTML.replace("__BG__", background)
            .replace("__HJ_BOLD__", font("Handjet-Bold.ttf"))
            .replace("__HJ_BLACK__", font("Handjet-Black.ttf"))
            .replace("__GT_REG__", font("GolosText-Regular.ttf"))
            .replace("__GT_BOLD__", font("GolosText-Bold.ttf"))
            .replace("__DRAGON__", sprite("dragon"))
            .replace("__LANG__", LANG)
        )

        out = OUT / ("cover-630x500" + ("" if LANG == "ru" else "-" + LANG) + ".png")
        raw = Path(tmp) / "cover@2x.png"
        with sync_playwright() as pw:
            browser = verify_web.launch(pw, "msedge") or pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 630, "height": 500}, device_scale_factor=2)
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(700)
            page.screenshot(path=str(raw))
            browser.close()

        im = Image.open(raw).convert("RGB")
        im = im.resize((630, 500), Image.LANCZOS)
        im.save(out, optimize=True)
        print(out, out.stat().st_size)


if __name__ == "__main__":
    sys.exit(main())
