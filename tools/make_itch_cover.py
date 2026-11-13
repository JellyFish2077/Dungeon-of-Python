#!/usr/bin/env python3
"""Обложка 630×500 для страницы Itch.io: «полевой журнал» с печатью.

    python tools/make_itch_cover.py

Числа на обложке берутся из самой игры: схема спуска строится по 15 этажам
и 5 биомам, версия — из static/web-boot.js. Обложка не устаревает отдельно
от сборки. Типографика — системные Georgia и Consolas: лендинговые Literata
и IBM Plex Mono из проекта убраны вместе с лендингом.
"""
import base64
import re
import tempfile
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "itch"
OUT.mkdir(parents=True, exist_ok=True)
SRC = (ROOT / "static" / "sprites.js").read_text(encoding="utf-8")


def sprite(name: str) -> str:
    match = re.search(rf'{name}:\s*"data:image/png;base64,([^"]+)"', SRC)
    if not match:
        raise SystemExit(f"sprite not found: {name}")
    return "data:image/png;base64," + match.group(1)


HERO = sprite("player")
DRAGON = sprite("dragon")

HTML = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<style>

  * { box-sizing: border-box; }
  html, body { width: 630px; height: 500px; margin: 0; overflow: hidden; }
  body {
    position: relative;
    background-color: #080a09;
    background-image:
      radial-gradient(circle at 20% 10%, rgba(79,111,98,.14), transparent 46%),
      radial-gradient(circle at 86% 92%, rgba(138,74,50,.12), transparent 48%),
      repeating-linear-gradient(112deg, rgba(216,203,178,.028) 0 1px, transparent 1px 9px);
    font-family: Georgia, "Times New Roman", serif;
    color: #1c1a16;
  }

  .sheet {
    position: absolute;
    inset: 14px;
    transform: rotate(-.55deg);
    background-color: #d9cbb0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.1'/%3E%3C/svg%3E");
    border: 1px solid #1c1a16;
    box-shadow: 0 20px 38px rgba(0,0,0,.66), 0 2px 0 rgba(255,255,255,.1) inset;
  }
  .sheet::before {
    content: "";
    position: absolute;
    inset: 9px;
    border: 1px solid rgba(28,26,22,.2);
    pointer-events: none;
  }
  .grain {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(0deg, rgba(28,26,22,.028) 0 1px, transparent 1px 4px);
    opacity: .45;
    pointer-events: none;
  }

  .topline {
    position: absolute;
    top: 25px; left: 33px; right: 33px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 7px;
    border-bottom: 1px solid rgba(28,26,22,.3);
    font-family: Consolas, "Courier New", monospace;
    font-size: 8px;
    letter-spacing: .13em;
    text-transform: uppercase;
    color: #4a463c;
  }

  .title {
    position: absolute;
    top: 70px; left: 32px;
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 84px;
    font-weight: 700;
    line-height: .93;
    letter-spacing: -.055em;
    color: #1c1a16;
    white-space: nowrap;
  }
  .title span { color: #8a4a32; }

  .subtitle {
    position: absolute;
    top: 166px; left: 35px;
    font-family: Consolas, "Courier New", monospace;
    font-size: 11px;
    letter-spacing: .19em;
    text-transform: uppercase;
    color: #395247;
  }

  .lead {
    position: absolute;
    top: 198px; left: 35px;
    width: 410px;
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15.5px;
    line-height: 1.5;
    color: #48443a;
  }

  .chips {
    position: absolute;
    top: 257px; left: 34px;
    display: flex;
    gap: 7px;
  }
  .chip {
    padding: 4px 7px;
    border: 1px solid #8a4a32;
    color: #713823;
    font-family: Consolas, "Courier New", monospace;
    font-size: 7.5px;
    letter-spacing: .1em;
    text-transform: uppercase;
    background: rgba(217,203,176,.4);
    transform: rotate(-.6deg);
  }
  .chip:nth-child(2) { border-color: #4f6f62; color: #395247; transform: rotate(.4deg); }
  .chip:nth-child(3) { transform: rotate(-1deg); }

  .seal {
    position: absolute;
    top: 2px; right: -4px;
    width: 110px; height: 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px double #8a4a32;
    border-radius: 50%;
    color: #713823;
    transform: rotate(10deg);
    opacity: .93;
  }
  .seal::before {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px dashed currentColor;
    border-radius: 50%;
  }
  .seal b {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 25px;
    line-height: 1;
  }
  .seal span {
    font-family: Consolas, "Courier New", monospace;
    font-size: 6px;
    line-height: 1.35;
    letter-spacing: .11em;
    text-align: center;
    text-transform: uppercase;
  }

  .route {
    position: absolute;
    left: 34px; right: 34px; bottom: 54px;
  }
  .route-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(28,26,22,.3);
    font-family: Consolas, "Courier New", monospace;
    font-size: 8px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #4a463c;
  }
  .route-map {
    position: relative;
    height: 44px;
    margin-top: 7px;
  }
  .route-map svg {
    position: absolute;
    left: 30px; right: 38px; top: 0;
    width: calc(100% - 68px);
    height: 34px;
    overflow: visible;
  }
  .mark {
    position: absolute;
    image-rendering: pixelated;
    width: 30px; height: 30px;
  }
  .mark.hero { left: 0; top: 4px; }
  .mark.dragon { right: 0; top: 0; width: 36px; height: 36px; }
  .route-labels {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    color: #4a463c;
    font-family: Consolas, "Courier New", monospace;
    font-size: 7px;
    letter-spacing: .07em;
    text-transform: uppercase;
    text-align: center;
  }

  .bottom {
    position: absolute;
    left: 34px; right: 34px; bottom: 22px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-top: 7px;
    border-top: 1px solid rgba(28,26,22,.3);
    color: #4a463c;
    font-family: Consolas, "Courier New", monospace;
    font-size: 8px;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .bottom b { color: #713823; font-weight: 500; }
</style></head>
<body>
  <div class="sheet">
    <div class="grain"></div>
    <div class="topline">
      <span>Полевой журнал · дело № 1 · лист 01</span>
    </div>

    <div class="seal" aria-hidden="true">
      <span>Печать</span>
      <b>Py</b>
      <span>глубины<br>2026</span>
    </div>

    <h1 class="title">Py<span>Dungeon</span></h1>
    <div class="subtitle">Печати глубины</div>
    <p class="lead">Спуск в подземелье, где каждый бой — вопрос по Python. Пятнадцать этажей, пять боссов, один дракон.</p>

    <div class="chips">
      <span class="chip">15 этажей</span>
      <span class="chip">5 боссов</span>
      <span class="chip">около 2 часов</span>
    </div>

    <div class="route">
      <div class="route-head">
        <span>Схема спуска</span>
        <span>Пять биомов</span>
      </div>
      <div class="route-map">
        <svg viewBox="0 0 500 34" preserveAspectRatio="none" aria-hidden="true">
          <path d="M__X0__ 17H__XLAST__" fill="none" stroke="#1c1a16" stroke-opacity=".32" stroke-width="1" stroke-dasharray="2 5"/>
          <g stroke="#1c1a16" stroke-width="1">__TICKS__</g>
          <g fill="#8a4a32" stroke="#673523" stroke-width="1">__BOSSES__</g>
        </svg>
        <img class="mark hero" src="__HERO__" alt="">
        <img class="mark dragon" src="__DRAGON__" alt="">
      </div>
      <div class="route-labels">
        <span>пещеры</span>
        <span>катакомбы</span>
        <span>лёд</span>
        <span>демоны</span>
        <span>дракон</span>
      </div>
    </div>

    <div class="bottom">
      <span><b>Python</b> · браузер · без сервера</span>
      <span>v__VERSION__</span>
    </div>
  </div>
</body></html>"""

# 15 этажей: пять биомов по три; ромб — босс на третьем этаже биома.
FLOORS = 15
BIOMES = 5
TRACK_X0, TRACK_W = 2.0, 496.0
SEG = TRACK_W / BIOMES


def tick_x(index: int) -> float:
    group, offset = divmod(index, FLOORS // BIOMES)
    return TRACK_X0 + SEG * group + SEG * (offset + 0.5) / 3


TICKS = "".join('<path d="M%.1f 14v6"/>' % tick_x(i) for i in range(FLOORS))
BOSSES = "".join('<path d="M%.1f 13l4 4-4 4-4-4z"/>' % tick_x(i) for i in range(2, FLOORS, 3))
VERSION = re.search(
    r'version:\s*"([^"]+)"', (ROOT / "static" / "web-boot.js").read_text(encoding="utf-8")
).group(1).replace("-web", "")

html = (
    HTML.replace("__HERO__", HERO)
    .replace("__DRAGON__", DRAGON)
    .replace("__TICKS__", TICKS)
    .replace("__BOSSES__", BOSSES)
    .replace("__X0__", "%.1f" % tick_x(0))
    .replace("__XLAST__", "%.1f" % tick_x(FLOORS - 1))
    .replace("__VERSION__", VERSION)
)

out = OUT / "cover-630x500.png"
# Кадр рендерится в 2× и уменьшается — так текст и печать остаются резкими.
with tempfile.TemporaryDirectory() as tmp:
    raw = Path(tmp) / "cover@2x.png"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 630, "height": 500}, device_scale_factor=2)
        page.set_content(html, wait_until="load")
        page.wait_for_timeout(500)
        page.screenshot(path=str(raw))
        browser.close()

    im = Image.open(raw).convert("RGB")
    im = im.resize((630, 500), Image.LANCZOS)
    im.save(out, optimize=True)
print(out, out.stat().st_size)
