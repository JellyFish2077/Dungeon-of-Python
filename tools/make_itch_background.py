#!/usr/bin/env python3
"""Фон для страницы Itch.io: коллаж из подземелья и боёв.

    python tools/make_itch_background.py [--browser msedge]

Скрипт сам запускает standalone/build, снимает несколько этажей, боёв
и деревню, затем собирает тёмный коллаж 1920×1080 и 2560×1440.
Кадры не содержат HUD и кнопки DEV; панели притемнены, чтобы поверх
читался текст страницы.
"""
import argparse
import base64
import io
import re
import shutil
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))
import verify_web  # noqa: E402
import shot_itch  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

OUT = ROOT / "assets" / "itch"
W, H = 1920, 1080

MAP_FLOORS = (0, 4, 8, 11, 14)
BATTLE_FLOORS = (1, 5, 14)

HIDE_CSS = """
.site-head,#game-dock,#hero-hud,#minimap-dock,#log,.action-btn,.toast,
.story-hud,.campaign-hud,.floor-arrival,#level-loading,#blessing-overlay,
#altar-overlay,#dev-toggle,#dev-panel{display:none!important}
"""


def capture(browser, base, tmp: Path) -> None:
    page = shot_itch.new_page(browser, dev=True)
    try:
        shot_itch.start_dungeon(page, base, dev=True)
        page.add_style_tag(content=HIDE_CSS)
        page.wait_for_timeout(500)

        for index in MAP_FLOORS:
            page.evaluate("(n) => window.__setFloor(n)", index)
            page.wait_for_timeout(1100)
            shot_itch.tidy(page)
            page.screenshot(path=str(tmp / ("map-%02d.png" % index)))

        for index in BATTLE_FLOORS:
            page.evaluate("(n) => window.__setFloor(n)", index)
            page.wait_for_timeout(700)
            opened = page.evaluate(
                """() => {
                    const g = window.__pyquiz;
                    const p = g.playerPos;
                    const alive = (g.enemies || []).filter((e) => e.hp > 0);
                    alive.sort((a, b) =>
                        (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) -
                        (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
                    const foe = alive[0];
                    if (!foe) return false;
                    const free = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                        .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
                        .find((c) => g.map.grid[c.y] && g.map.grid[c.y][c.x] === 1);
                    if (free) { foe.x = free.x; foe.y = free.y; }
                    window.__openBattle(foe);
                    return true;
                }"""
            )
            if not opened:
                continue
            page.wait_for_timeout(1700)
            shot_itch.tidy(page)
            page.screenshot(path=str(tmp / ("battle-%02d.png" % index)))
            page.evaluate(
                "() => { const o = document.querySelector('#battle-overlay');"
                " if (o) o.classList.add('hidden'); }"
            )
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
    finally:
        page.close()


def sprite(name: str) -> Image.Image:
    text = (ROOT / "static" / "sprites.js").read_text(encoding="utf-8")
    match = re.search(rf'{name}:\s*"data:image/png;base64,([^"]+)"', text)
    if not match:
        raise SystemExit("sprite not found: " + name)
    return Image.open(io.BytesIO(base64.b64decode(match.group(1)))).convert("RGBA")


def frame(path: Path, size, angle: float, crop_map=False) -> Image.Image:
    im = Image.open(path).convert("RGB")
    if crop_map:
        # У карты много пустого фона по краям и служебная полоса снизу.
        box_h = 660
        box_w = int(box_h * size[0] / size[1])
        left = max(0, (im.width - box_w) // 2)
        im = im.crop((left, 0, left + box_w, box_h))
    im = im.resize(size, Image.Resampling.LANCZOS)

    pad = 3
    panel = Image.new("RGBA", (size[0] + pad * 2, size[1] + pad * 2), (18, 26, 34, 255))
    panel.paste(im, (pad, pad))
    panel = panel.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    return panel


def shadowed(panel: Image.Image, blur=18, offset=12, alpha=190) -> Image.Image:
    shadow = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    shadow.putalpha(panel.getchannel("A").point(lambda a: alpha if a else 0))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas = Image.new("RGBA", panel.size, (0, 0, 0, 0))
    canvas.alpha_composite(shadow, (0, offset))
    canvas.alpha_composite(panel)
    return canvas


def compose(tmp: Path, scale: float) -> Image.Image:
    width, height = int(W * scale), int(H * scale)
    canvas = Image.new("RGBA", (width, height), (7, 9, 12, 255))

    # Большой дракон едва проступает за центральной колонкой.
    dragon = sprite("dragon").resize((int(640 * scale), int(640 * scale)),
                                     Image.Resampling.LANCZOS)
    dragon = dragon.filter(ImageFilter.GaussianBlur(26 * scale))
    tint = Image.new("RGBA", dragon.size, (198, 90, 51, 255))
    tint.putalpha(dragon.getchannel("A").point(lambda a: int(a * 0.10)))
    canvas.alpha_composite(tint, (int(660 * scale), int(300 * scale)))

    # file, x, y, w, h, angle, crop_map
    layout = [
        ("map-08.png", -40, 40, 540, 338, -3, True),
        ("battle-05.png", -80, 390, 480, 300, 2.0, False),
        ("map-00.png", -110, 710, 430, 269, -2, True),
        ("map-11.png", 1420, 30, 540, 338, 3.0, True),
        ("battle-14.png", 1450, 380, 490, 306, -2.0, False),
        ("village-en.png", 1480, 720, 440, 275, 2.0, False),
        ("map-04.png", 590, -170, 740, 463, -1.0, True),
        ("battle-01.png", 640, 810, 680, 425, 1.0, False),
    ]
    for name, x, y, w, h, angle, crop_map in layout:
        path = tmp / name
        if not path.exists():
            continue
        panel = frame(path, (int(w * scale), int(h * scale)), angle, crop_map)
        canvas.alpha_composite(shadowed(panel), (int(x * scale), int(y * scale)))

    # Общий тёмный тон: фон не должен спорить с текстом страницы.
    canvas = canvas.convert("RGB")
    canvas = ImageEnhance.Brightness(canvas).enhance(0.74)
    canvas = ImageEnhance.Color(canvas).enhance(0.86)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.05)

    # Центр темнее краёв: там стоит колонка с текстом.
    mask = Image.radial_gradient("L").resize((width, height))
    dark = Image.new("RGB", (width, height), (4, 6, 9))
    alpha = mask.point(lambda v: int(105 - v * 0.34))
    canvas = Image.composite(dark, canvas, alpha)

    # Тёплое свечение у левого и правого края.
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for cx in (int(width * 0.03), int(width * 0.97)):
        gd.ellipse((cx - 340 * scale, height * 0.20, cx + 340 * scale,
                    height * 0.80), fill=(198, 90, 51, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(120 * scale))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), glow).convert("RGB")

    # Мягкое затемнение по краям.
    vignette = Image.new("L", (width, height), 0)
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, width, height), fill=70)
    vd.rectangle((int(width * 0.06), int(height * 0.06),
                  int(width * 0.94), int(height * 0.94)), fill=0)
    vignette = vignette.filter(ImageFilter.GaussianBlur(90 * scale))
    canvas = Image.composite(Image.new("RGB", (width, height), (3, 5, 8)),
                             canvas, vignette)

    return canvas


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="msedge")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    # Английские боевые кадры: основная страница — английская.
    shot_itch.LANG = "en"
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        server, base = verify_web.serve()
        try:
            with sync_playwright() as pw:
                browser = verify_web.launch(pw, args.browser)
                if browser is None:
                    print("браузер не найден", file=sys.stderr)
                    return 1
                try:
                    capture(browser, base, tmp_path)
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()

        village = OUT / "screenshots" / "village-en.png"
        if village.exists():
            shutil.copy2(village, tmp_path / "village-en.png")

        big = compose(tmp_path, 2560 / W)
        big.save(OUT / "background-2560x1440.png", optimize=True)
        big.resize((W, H), Image.Resampling.LANCZOS).save(
            OUT / "background-1920x1080.png", optimize=True
        )

    for name in ("background-1920x1080.png", "background-2560x1440.png"):
        path = OUT / name
        print(path.relative_to(ROOT), path.stat().st_size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
