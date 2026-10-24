"""Portal object for boss-to-village travel.

Usage:
    python tools/art/bootstrap/make_portal.py --preview tools/art/_portal_preview.png
    python tools/art/bootstrap/make_portal.py --force
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from make_slice import (  # noqa: E402
    ART,
    OUT,
    Px,
    SOLID_BG,
    find_aseprite,
    lua_script,
    quantize,
    write_manifest,
)

DEST = {"objects2": "objects"}


def portal() -> Image.Image:
    p = Px()
    # stone arch
    p.ellipse(1, 1, 30, 30, "T")
    p.ellipse(3, 3, 28, 28, "U")
    p.ellipse(5, 5, 26, 26, "1")
    # cracks in the arch
    p.line([(4, 12), (7, 9), (6, 6)], "1")
    p.line([(26, 19), (24, 23), (27, 27)], "1")
    p.set(7, 9, "V")
    p.set(24, 23, "V")
    # vortex
    p.ellipse(7, 7, 24, 24, "2")
    p.ellipse(9, 9, 22, 22, "3")
    p.ellipse(11, 11, 20, 20, "M")
    p.ellipse(13, 13, 18, 18, "N")
    p.ellipse(15, 15, 16, 16, "7")
    p.bevel()
    p.outline()
    # magic drawn on top so the bevel/outline do not eat it
    p.ellipse(8, 8, 23, 23, "3")
    p.ellipse(10, 10, 21, 21, "M")
    p.ellipse(12, 12, 19, 19, "N")
    p.ellipse(14, 14, 17, 17, "6")
    p.ellipse(15, 15, 16, 16, "7")
    p.line([(8, 16), (13, 9), (20, 10), (23, 17), (19, 23)], "4")
    p.line([(11, 22), (18, 24), (22, 19)], "5")
    p.set(16, 16, "B")
    # runes
    for x, y in ((5, 8), (27, 8), (5, 24), (27, 24)):
        p.set(x, y, "A")
        p.set(x + (1 if x < 16 else -1), y, "9")
    p.set(16, 4, "A")
    p.set(16, 29, "A")
    return p.image()


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"objects2": [("portal", quantize(portal()))]}


def preview(groups, path):
    sheet = Image.new("RGBA", (240, 240), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for cy in range(3):
        for cx in range(3):
            c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
            draw.rectangle([cx * 80, cy * 80, cx * 80 + 79, cy * 80 + 79], fill=c + (255,))
    im = groups["objects2"][0][1]
    sheet.alpha_composite(im.resize((216, 216), Image.NEAREST), (12, 12))
    sheet.save(path)
    print("preview:", path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--preview", metavar="PNG")
    ap.add_argument("--aseprite", metavar="PATH")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    groups = assets()
    if args.preview:
        preview(groups, args.preview)
        return 0

    os.makedirs(OUT, exist_ok=True)
    if os.path.exists(os.path.join(OUT, "objects2.aseprite")) and not args.force:
        print("objects2.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
        return 1

    write_manifest(groups, os.path.join(ART, "asset-manifest.json"), DEST)
    script = lua_script(groups)
    fd, lua_path = tempfile.mkstemp(suffix=".lua", text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(script)
        exe = find_aseprite(args.aseprite)
        print("Aseprite:", exe)
        proc = subprocess.run([exe, "--batch", "--script", lua_path], text=True)
        if proc.returncode != 0:
            return proc.returncode
    finally:
        os.unlink(lua_path)
    print("\nГотово. Дальше:")
    print("  python tools/art/export_aseprite.py")
    print("  python tools/art/build_art.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
