#!/usr/bin/env python3
"""Обложка 630×500 для страницы Itch.io: тёмное подземелье.

    python tools/make_itch_cover.py

Фон — настоящий кадр из игры: скрипт сам запускает standalone/build,
начинает поход и берёт центральный кусок карты, затемнённый до текстуры.
Заголовок — Handjet, текст — Golos Text, служебные подписи — Consolas.
Разрез подземелья, цифры и версия берутся из игры, поэтому обложка
не расходится со сборкой.
"""
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

FLOORS = 15
BIOMES = 5
PER_BIOME = FLOORS // BIOMES


def sprite(name: str) -> str:
    match = re.search(rf'{name}:\s*"data:image/png;base64,([^"]+)"', SRC)
    if not match:
        raise SystemExit(f"sprite not found: {name}")
    return "data:image/png;base64," + match.group(1)


def font(name: str) -> str:
    data = base64.b64encode((ROOT / "static" / "fonts" / name).read_bytes()).decode("ascii")
    return "data:font/ttf;base64," + data


def version() -> str:
    text = (ROOT / "static" / "web-boot.js").read_text(encoding="utf-8")
    match = re.search(r'version:\s*"([^"]+)"', text)
    return match.group(1).replace("-web", "") if match else "0.0.0"


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


def rows() -> str:
    """Пять полос разреза: три этажа на биом, босс в конце каждого."""
    bosses = ("goblin", "necromancer", "golem", "demon", "dragon")
    names = ("Пещеры", "Катакомбы", "Лёд", "Демоны", "Дракон")
    classes = ("caves", "catacombs", "ice", "demons", "lair")
    parts = []
    for i in range(BIOMES):
        first = i * PER_BIOME + 1
        last = first + PER_BIOME - 1
        player = ('<img class="sprite player" src="%s" alt="">' % sprite("player")
                  if i == 0 else "")
        boss = "dragon" if i == BIOMES - 1 else "boss"
        parts.append(
            '<div class="stratum %s">'
            '<div class="stratum-line"></div>'
            '<div class="stratum-label"><b>%02d–%02d</b><span>%s</span></div>'
            '%s<img class="sprite %s" src="%s" alt=""><span class="torch"></span>'
            "</div>"
            % (classes[i], first, last, names[i], player, boss, sprite(bosses[i]))
        )
    return "".join(parts)


HTML = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: "Handjet"; src: url("__HJ_BOLD__") format("truetype"); font-weight: 700; font-display: block; }
  @font-face { font-family: "Handjet"; src: url("__HJ_BLACK__") format("truetype"); font-weight: 900; font-display: block; }
  @font-face { font-family: "Golos Text"; src: url("__GT_REG__") format("truetype"); font-weight: 400; font-display: block; }
  @font-face { font-family: "Golos Text"; src: url("__GT_BOLD__") format("truetype"); font-weight: 700; font-display: block; }

  :root {
    --void: #07090c;
    --stone-3: #2a343e;
    --ash: #8e9aa6;
    --bone: #ded7c8;
    --torch: #f2a24a;
    --ember: #c65a33;
    --python: #6fb7a8;
    --line: rgba(222,215,200,.14);
    --display: "Handjet", "Arial Black", sans-serif;
    --sans: "Golos Text", system-ui, sans-serif;
    --mono: Consolas, "Courier New", monospace;
    --noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.09'/%3E%3C/svg%3E");
  }
  * { box-sizing: border-box; }
  html, body { width: 630px; height: 500px; margin: 0; overflow: hidden; }
  body {
    position: relative; color: var(--bone); background: var(--void);
    font-family: var(--sans);
    overflow: hidden;
  }
  /* Фон — кадр из игры, притемнённый до текстуры камня. */
  .map {
    position: absolute; inset: 0;
    background: url("__BG__") center / cover no-repeat;
    opacity: .72; filter: saturate(.75) brightness(.85);
  }
  .veil {
    position: absolute; inset: 0;
    background:
      radial-gradient(420px 380px at 77% 52%, rgba(198,90,51,.20), transparent 68%),
      radial-gradient(360px 300px at 9% 8%, rgba(111,183,168,.10), transparent 70%),
      linear-gradient(180deg, rgba(7,9,12,.6), rgba(7,9,12,.8) 55%, rgba(7,9,12,.92));
  }
  .grain {
    position: absolute; inset: 0; background: var(--noise); pointer-events: none;
  }
  body::after {
    content: ""; position: absolute; inset: 10px; border: 1px solid var(--line); pointer-events: none;
  }
  .topline {
    position: absolute; left: 32px; right: 32px; top: 24px; z-index: 3;
    display: flex; justify-content: space-between; gap: 12px;
    padding-bottom: 7px; border-bottom: 1px solid var(--line);
    font-family: var(--mono); font-size: 7px; letter-spacing: .14em;
    text-transform: uppercase; color: var(--ash);
  }
  h1 {
    position: absolute; left: 30px; top: 52px; margin: 0; z-index: 3;
    font-family: var(--display); font-weight: 900; font-size: 92px;
    line-height: .82; letter-spacing: -.01em;
    color: var(--bone); text-shadow: 0 0 26px rgba(242,162,74,.18), 0 3px 0 #040608;
    white-space: nowrap;
  }
  h1 span { color: var(--torch); }
  .subtitle {
    position: absolute; left: 33px; top: 143px; z-index: 3;
    font-family: var(--mono); font-size: 9px; letter-spacing: .22em;
    text-transform: uppercase; color: var(--ash);
  }
  .lead {
    position: absolute; left: 33px; top: 168px; width: 322px; margin: 0; z-index: 3;
    color: #b8c1cb; font-size: 13px; line-height: 1.55;
  }
  .lead b { color: var(--bone); font-weight: 700; }
  .facts {
    position: absolute; left: 33px; top: 254px; z-index: 3;
    display: flex; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  }
  .fact { padding: 7px 13px; border-right: 1px solid var(--line); }
  .fact:first-child { padding-left: 0; }
  .fact:last-child { border-right: 0; }
  .fact b { display: block; font-family: var(--display); font-size: 22px; font-weight: 700; line-height: 1; color: var(--torch); }
  .fact span { display: block; margin-top: 2px; font-family: var(--mono); font-size: 6.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ash); }
  .dragon-glow {
    position: absolute; left: 18px; bottom: 32px; width: 150px; height: 150px; z-index: 2;
    background: radial-gradient(circle, rgba(198,90,51,.26), transparent 66%);
    pointer-events: none;
  }
  .dragon-art {
    position: absolute; left: 38px; bottom: 56px; width: 96px; height: 96px; z-index: 3;
    image-rendering: pixelated;
    filter: drop-shadow(0 0 18px rgba(198,90,51,.4)) drop-shadow(0 8px 0 rgba(0,0,0,.35));
  }
  .dragon-caption {
    position: absolute; left: 142px; bottom: 74px; z-index: 3;
    font-family: var(--mono); font-size: 6.5px; line-height: 1.7;
    letter-spacing: .12em; text-transform: uppercase; color: var(--ash);
  }
  .dragon-caption b { display: block; color: var(--torch); font-weight: 500; }
  .bottom {
    position: absolute; left: 33px; right: 33px; bottom: 24px; z-index: 3;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding-top: 8px; border-top: 1px solid var(--line);
    font-family: var(--mono); font-size: 7.5px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--ash);
  }
  .bottom .code { color: var(--python); font-size: 9px; letter-spacing: .02em; text-transform: none; }
  .bottom .ver { color: var(--torch); }

  .shaft {
    position: absolute; right: 33px; top: 52px; width: 196px; z-index: 3;
    border: 2px solid var(--stone-3); background: rgba(10,13,17,.92);
    box-shadow: 0 18px 34px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.035);
  }
  .shaft-head, .shaft-foot {
    display: flex; justify-content: space-between; align-items: center;
    height: 25px; padding: 0 8px;
    font-family: var(--mono); font-size: 6px; letter-spacing: .12em;
    text-transform: uppercase; color: var(--ash); background: #080b0f;
  }
  .shaft-head { border-bottom: 1px solid var(--line); }
  .shaft-foot { border-top: 1px solid var(--line); }
  .shaft-foot span:last-child { color: var(--torch); }
  .stratum {
    position: relative; height: 66px; overflow: hidden;
    border-bottom: 1px solid rgba(0,0,0,.65);
  }
  .stratum:last-child { border-bottom: 0; }
  .stratum::before {
    content: ""; position: absolute; inset: 0;
    background: var(--noise), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 6px);
    opacity: .8;
  }
  .stratum.caves { background: linear-gradient(180deg,#221b13,#120e0a); }
  .stratum.catacombs { background: linear-gradient(180deg,#151d25,#0c1116); }
  .stratum.ice { background: linear-gradient(180deg,#162832,#0d171e); }
  .stratum.demons { background: linear-gradient(180deg,#261616,#130c0d); }
  .stratum.lair { background: linear-gradient(180deg,#221512,#0f0a09); }
  .stratum-label { position: absolute; left: 8px; top: 7px; z-index: 2; }
  .stratum-label b { display: block; font-family: var(--display); font-size: 15px; font-weight: 700; line-height: 1; color: var(--torch); white-space: nowrap; }
  .stratum-label span { display: block; margin-top: 2px; font-family: var(--mono); font-size: 6px; letter-spacing: .07em; text-transform: uppercase; color: var(--ash); }
  .stratum-line {
    position: absolute; left: 56px; top: 0; bottom: 0; width: 1px;
    background: repeating-linear-gradient(180deg, rgba(222,215,200,.22) 0 2px, transparent 2px 7px);
  }
  .sprite { position: absolute; right: 8px; bottom: 5px; width: 22px; height: 22px; image-rendering: pixelated; z-index: 2; filter: drop-shadow(0 3px 0 rgba(0,0,0,.45)); }
  .sprite.player { left: 62px; top: 4px; right: auto; bottom: auto; width: 24px; height: 24px; }
  .sprite.boss { width: 28px; height: 28px; right: 7px; bottom: 4px; }
  .sprite.dragon { width: 36px; height: 36px; right: 5px; bottom: 2px; filter: drop-shadow(0 0 9px rgba(198,90,51,.3)); }
  .torch { position: absolute; right: 7px; top: 7px; width: 3px; height: 10px; background: #3a281b; z-index: 4; }
  .torch::before {
    content: ""; position: absolute; left: -4px; top: -10px; width: 11px; height: 15px;
    background: radial-gradient(ellipse at 50% 76%, #fff5c8 0 14%, #ffd07a 27%, #f2a24a 51%, #c65a33 74%, transparent 76%);
    clip-path: polygon(51% 0, 73% 27%, 87% 52%, 71% 76%, 49% 100%, 27% 86%, 11% 57%, 29% 30%);
    filter: drop-shadow(0 0 6px rgba(242,162,74,.55));
  }
  .torch::after {
    content: ""; position: absolute; left: -24px; top: -29px; width: 53px; height: 53px; border-radius: 50%;
    background: radial-gradient(circle, rgba(242,162,74,.18), transparent 68%);
  }
</style>
</head>
<body>
  <div class="map"></div>
  <div class="veil"></div>
  <div class="grain"></div>

  <div class="topline"><span>Печати глубины</span><span>__FLOORS__ этажей · __BIOMES__ боссов</span></div>

  <h1>Py<span>Dungeon</span></h1>
  <div class="subtitle">Спуск в подземелье Python</div>
  <p class="lead">Каждый бой — <b>вопрос по Python</b>. Пять боссов, дракон на пятнадцатом этаже и деревня, которая остаётся между забегами.</p>

  <div class="facts">
    <div class="fact"><b>__FLOORS__</b><span>этажей</span></div>
    <div class="fact"><b>__BIOMES__</b><span>боссов</span></div>
    <div class="fact"><b>2 ч</b><span>на поход</span></div>
  </div>

  <div class="dragon-glow"></div>
  <img class="dragon-art" src="__DRAGON__" alt="">
  <div class="dragon-caption"><b>Финал · этаж __FLOORS__</b><span>Дракон</span></div>

  <aside class="shaft" aria-label="Разрез подземелья">
    <div class="shaft-head"><span>Разрез</span><span>__FLOORS__ этажей</span></div>
    __ROWS__
    <div class="shaft-foot"><span>Вход</span><span>Дракон</span></div>
  </aside>

  <div class="bottom">
    <span class="code">&gt;&gt;&gt; descend(__FLOORS__)</span>
    <span>HTML5 · браузер</span>
    <span class="ver">v__VERSION__</span>
  </div>
</body></html>
"""


def main():
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
            .replace("__ROWS__", rows())
            .replace("__DRAGON__", sprite("dragon"))
            .replace("__FLOORS__", str(FLOORS))
            .replace("__BIOMES__", str(BIOMES))
            .replace("__VERSION__", version())
        )

        out = OUT / "cover-630x500.png"
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
