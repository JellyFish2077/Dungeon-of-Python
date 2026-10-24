"""Third object batch: dungeon interactables that were still SVG.

Ore vein, rubble pile, lever, sign and loot bag. They replace the SVG
fallbacks in icons.js through TERRAIN_ICONS.

Usage:
    python tools/art/bootstrap/make_objects3.py --preview tools/art/_objects3_preview.png
    python tools/art/bootstrap/make_objects3.py --force
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

DEST = {"objects3": "objects"}


def ore() -> Image.Image:
    p = Px()
    p.poly([(3, 27), (5, 13), (12, 5), (22, 6), (29, 14), (27, 28), (20, 31), (8, 30)], "T")
    p.poly([(6, 25), (8, 15), (14, 9), (21, 10), (26, 16), (24, 26), (19, 29), (9, 28)], "U")
    # gold veins
    p.line([(10, 24), (14, 18), (13, 12)], "9", 2)
    p.line([(14, 18), (20, 20), (23, 15)], "A")
    p.set(13, 12, "B")
    p.set(15, 18, "B")
    p.set(23, 15, "7")
    # a few blue shards
    p.poly([(18, 25), (17, 17), (21, 20)], "4")
    p.set(18, 17, "6")
    p.poly([(22, 26), (24, 20), (26, 23)], "5")
    p.set(24, 20, "7")
    p.bevel()
    p.outline()
    p.line([(10, 24), (14, 18), (13, 12)], "9", 2)
    p.line([(14, 18), (20, 20), (23, 15)], "A")
    p.poly([(18, 25), (17, 17), (21, 20)], "4")
    return p.image()


def rubble() -> Image.Image:
    p = Px()
    rocks = [
        [(5, 28), (7, 20), (13, 18), (16, 25), (12, 30)],
        [(14, 27), (15, 16), (22, 14), (25, 21), (21, 29)],
        [(4, 23), (8, 15), (13, 17), (11, 23)],
        [(21, 25), (24, 17), (29, 19), (28, 27)],
    ]
    for i, pts in enumerate(rocks):
        p.poly(pts, "T" if i % 2 else "U")
        p.line([pts[0], pts[1]], "V")
        p.line([pts[2], pts[3]], "T")
    p.line([(5, 24), (13, 29)], "Q")
    p.line([(18, 19), (24, 24)], "Q")
    p.set(10, 20, "V")
    p.set(22, 22, "V")
    p.bevel()
    p.outline()
    return p.image()


def lever() -> Image.Image:
    p = Px()
    # stone base
    p.ellipse(6, 22, 25, 30, "T")
    p.ellipse(8, 23, 23, 28, "U")
    # post
    p.rect(14, 10, 17, 24, "Q")
    p.line([(14, 10), (14, 24)], "P")
    p.line([(17, 10), (17, 24)], "R")
    # handle and gold knob
    p.line([(16, 12), (23, 5)], "Q", 2)
    p.line([(16, 12), (23, 5)], "R")
    p.ellipse(21, 1, 28, 8, "9")
    p.ellipse(22, 2, 27, 7, "A")
    p.set(24, 4, "B")
    p.bevel()
    p.outline()
    p.ellipse(21, 1, 28, 8, "9")
    p.ellipse(22, 2, 27, 7, "A")
    p.set(24, 4, "B")
    return p.image()


def sign() -> Image.Image:
    p = Px()
    # post
    p.rect(14, 12, 17, 31, "Q")
    p.line([(14, 12), (14, 31)], "P")
    p.line([(17, 12), (17, 31)], "R")
    # board
    p.rect(3, 3, 28, 16, "Q")
    p.rect(5, 5, 26, 14, "R")
    p.line([(3, 3), (28, 3)], "S")
    p.line([(3, 16), (28, 16)], "P")
    # carved lines
    p.line([(8, 8), (23, 8)], "P")
    p.line([(8, 11), (19, 11)], "P")
    p.set(6, 5, "U")
    p.set(25, 14, "U")
    # little roof over the board
    p.poly([(2, 4), (16, 0), (29, 4)], "P")
    p.line([(2, 4), (16, 0)], "Q")
    p.bevel()
    p.outline()
    return p.image()


def loot_bag() -> Image.Image:
    p = Px()
    # bag
    p.ellipse(7, 11, 24, 29, "Q")
    p.ellipse(9, 13, 22, 27, "R")
    # neck and drawstring
    p.rect(13, 7, 19, 14, "Q")
    p.line([(12, 12), (20, 12)], "P")
    p.line([(13, 7), (19, 7)], "S")
    p.set(15, 6, "R")
    p.set(18, 6, "R")
    # coins
    p.ellipse(3, 23, 10, 30, "9")
    p.ellipse(4, 24, 9, 29, "A")
    p.set(6, 25, "B")
    p.ellipse(21, 22, 29, 30, "9")
    p.ellipse(22, 23, 28, 29, "A")
    p.set(24, 24, "B")
    p.bevel()
    p.outline()
    p.ellipse(3, 23, 10, 30, "9")
    p.ellipse(4, 24, 9, 29, "A")
    p.set(6, 25, "B")
    p.ellipse(21, 22, 29, 30, "9")
    p.ellipse(22, 23, 28, 29, "A")
    p.set(24, 24, "B")
    return p.image()


OBJECTS = [
    ("ore", ore()),
    ("rubble", rubble()),
    ("lever", lever()),
    ("sign", sign()),
    ("lootBag", loot_bag()),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"objects3": [(name, quantize(im)) for name, im in OBJECTS]}


def preview(groups, path):
    cell = 112
    items = [(tag, im) for family in groups.values() for tag, im in family]
    sheet = Image.new("RGBA", (len(items) * cell, cell + 18), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (tag, im) in enumerate(items):
        x = i * cell
        for cy in range(3):
            for cx in range(3):
                c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
                draw.rectangle([x + cx * 32, cy * 32, x + cx * 32 + 31, cy * 32 + 31], fill=c + (255,))
        sheet.alpha_composite(im.resize((cell, cell), Image.NEAREST), (x, 0))
        draw.text((x + 4, cell + 2), tag, fill=(232, 183, 91, 255))
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
    if os.path.exists(os.path.join(OUT, "objects3.aseprite")) and not args.force:
        print("objects3.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
