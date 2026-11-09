"""Altar sprite for the optional deal room.

Usage:
    python tools/art/bootstrap/make_altar.py --preview tools/art/_altar_preview.png
    python tools/art/bootstrap/make_altar.py --force
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

DEST = {"objects4": "objects"}


def altar() -> Px:
    p = Px()
    # Base plinth.
    p.rect(5, 25, 26, 30, "T")
    p.rect(7, 26, 24, 29, "U")
    p.line([(5, 25), (26, 25)], "V")
    # Pedestal.
    p.rect(10, 18, 21, 26, "T")
    p.rect(11, 19, 20, 25, "U")
    p.line([(10, 18), (21, 18)], "V")
    # Top slab.
    p.rect(3, 14, 28, 19, "T")
    p.rect(4, 15, 27, 18, "U")
    p.line([(3, 14), (28, 14)], "V")
    p.line([(4, 18), (27, 18)], "T")
    # Gold trim.
    p.line([(3, 16), (3, 18)], "9")
    p.line([(28, 16), (28, 18)], "9")
    p.line([(6, 16), (26, 16)], "9")
    # Carved stone bowl: no glow, only dark stone with a gold inlay.
    p.ellipse(11, 7, 21, 14, "O")
    p.ellipse(12, 8, 20, 13, "T")
    p.ellipse(13, 9, 19, 12, "U")
    p.ellipse(15, 10, 17, 11, "T")
    p.set(9, 8, "A")
    p.set(23, 8, "A")
    # Unlit candles: wax and a dark wick, no flame.
    p.rect(7, 20, 8, 24, "Q")
    p.rect(24, 20, 25, 24, "Q")
    p.set(7, 19, "R")
    p.set(24, 19, "R")
    p.bevel()
    p.outline()
    return p


ICONS = [("altar", altar)]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"objects4": [(name, quantize(maker().image())) for name, maker in ICONS]}


def preview(groups, path: str) -> None:
    items = groups["objects4"]
    cell = 96
    sheet = Image.new("RGBA", (cell * len(items), cell), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        x0 = i * cell
        draw.rectangle([x0, 0, x0 + cell - 1, cell - 1],
                       fill=(24, 32, 48, 255) if i % 2 == 0 else (16, 22, 34, 255))
        sheet.alpha_composite(im.resize((72, 72), Image.NEAREST), (x0 + 12, 12))
        draw.text((x0 + 4, 2), name, fill=(169, 193, 222, 255))
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
    target = os.path.join(OUT, "objects4.aseprite")
    if os.path.exists(target) and not args.force:
        print("objects4.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
