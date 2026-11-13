#!/usr/bin/env python3
"""Логотип-иконка PyDungeon: монитор с Python-приглашением.

    python tools/make_logo.py

Источник — assets/logo/PyDungeon-icon.svg (пиксельная сетка 32×32).
Скрипт рендерит мастер 1024×1024, PNG-размеры и многомасштабный
assets/PyDungeon.ico для ярлыка на рабочем столе.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import verify_web  # noqa: E402

LOGO = ROOT / "assets" / "logo"
SRC = LOGO / "PyDungeon-icon.svg"
ICO = ROOT / "assets" / "PyDungeon.ico"
VIEW = 1024


def render_master() -> Image.Image:
    svg = SRC.read_text(encoding="utf-8")
    html = (
        "<!doctype html><meta charset='utf-8'>"
        "<style>html,body{margin:0;background:transparent}"
        "svg{width:%dpx;height:%dpx;display:block}</style>" % (VIEW, VIEW)
        + svg
    )
    with sync_playwright() as pw:
        browser = verify_web.launch(pw, "msedge") or pw.chromium.launch(headless=True)
        try:
            page = browser.new_page(
                viewport={"width": VIEW, "height": VIEW},
                device_scale_factor=1,
            )
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(200)
            raw = page.screenshot(omit_background=True)
        finally:
            browser.close()
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert("RGBA")


def preview(master: Image.Image) -> None:
    """Превью на тёмном и светлом фоне: видно, как значок читается."""
    width, height = 1280, 360
    sheet = Image.new("RGBA", (width, height), (7, 9, 12, 255))
    draw = ImageDraw.Draw(sheet)
    draw.rectangle((width // 2, 0, width, height), fill=(236, 232, 224, 255))
    sizes = (192, 96, 48, 32, 16)
    x = 24
    for size in sizes:
        icon = master.resize((size, size), Image.Resampling.LANCZOS)
        y = (height - size) // 2
        sheet.alpha_composite(icon, (x, y))
        x += size + 20
    x = width // 2 + 24
    for size in sizes:
        icon = master.resize((size, size), Image.Resampling.LANCZOS)
        y = (height - size) // 2
        sheet.alpha_composite(icon, (x, y))
        x += size + 20
    sheet.convert("RGB").save(LOGO / "preview.png", optimize=True)


def main() -> int:
    LOGO.mkdir(parents=True, exist_ok=True)
    master = render_master()
    master.save(LOGO / "PyDungeon-icon-1024.png", optimize=True)
    for size in (512, 256):
        master.resize((size, size), Image.Resampling.LANCZOS).save(
            LOGO / ("PyDungeon-icon-%d.png" % size), optimize=True
        )

    base = master.resize((256, 256), Image.Resampling.LANCZOS)
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base.save(ICO, format="ICO", sizes=sizes)
    (LOGO / "PyDungeon-icon.ico").write_bytes(ICO.read_bytes())

    preview(master)
    for path in (
        LOGO / "PyDungeon-icon-1024.png",
        LOGO / "PyDungeon-icon-512.png",
        LOGO / "PyDungeon-icon-256.png",
        ICO,
        LOGO / "preview.png",
    ):
        print(path.relative_to(ROOT), path.stat().st_size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
