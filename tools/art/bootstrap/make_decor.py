"""Decor batch for the PyDungeon art slice.

Grass, moss, bones, crystals, rubble and the three object-decor pieces:
the well/lamp, wooden pikes and the campfire. These are drawn as separate
32x32 sprites and override the old DCSS tiles by the same names.

Usage:
    python tools/art/bootstrap/make_decor.py --preview tools/art/_decor_preview.png
    python tools/art/bootstrap/make_decor.py --force
"""
from __future__ import annotations

import argparse
import math
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
    make_floor,
    quantize,
    rgb,
    write_manifest,
)

DEST = {"decor": "decor"}


def _hash(x: int, y: int, seed: int) -> int:
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


# --------------------------------------------------------------- flat decor
def grass(seed: int) -> Image.Image:
    p = Px()
    for k in range(5 + seed % 2):
        x = 7 + (_hash(k, seed, 100) % 18)
        h = 4 + (_hash(k, seed, 200) % 5)
        lean = 1 if _hash(k, seed, 300) % 2 else -1
        for i in range(h):
            yy = 28 - i
            xx = x + (lean if i > h // 2 else 0)
            p.set(xx, yy, "G" if i < h - 1 else "H")
            if i == h - 1:
                p.set(xx + 1, yy, "G")
        p.set(x, 28, "F")
    for k in range(3):
        x = 8 + (_hash(k, seed, 400) % 16)
        p.set(x, 29, "Z")
    return quantize(p.image())


def moss(seed: int) -> Image.Image:
    p = Px()
    cx = 12 + (_hash(seed, 0, 500) % 8)
    cy = 17 + (_hash(seed, 1, 510) % 6)
    for k in range(38):
        x = cx + (_hash(k, seed, 520) % 13) - 6
        y = cy + (_hash(k, seed, 530) % 9) - 4
        p.set(x, y, "G" if k % 3 else "F")
        if _hash(k, seed, 540) % 3 == 0:
            p.set(x + 1, y, "G")
        if _hash(k, seed, 550) % 5 == 0:
            p.set(x, y - 1, "H")
    for k in range(8):
        x = cx - 7 + (_hash(k, seed, 560) % 15)
        y = cy - 5 + (_hash(k, seed, 570) % 11)
        p.set(x, y, "F")
    return quantize(p.image())


def bones(seed: int) -> Image.Image:
    p = Px()
    if seed % 3 == 0:
        # small skull
        p.ellipse(10, 12, 21, 23, "J")
        p.rect(12, 21, 19, 25, "J")
        p.rect(12, 15, 14, 18, "O")
        p.rect(17, 15, 19, 18, "O")
        p.set(15, 20, "I")
        p.rect(13, 23, 18, 24, "I")
        p.set(14, 23, "J")
        p.set(16, 23, "J")
        p.set(18, 23, "J")
        p.bevel()
        p.outline()
    elif seed % 3 == 1:
        # crossed bones
        p.line([(7, 22), (25, 9)], "J", 3)
        p.line([(8, 9), (25, 22)], "J", 3)
        for x, y in ((6, 23), (25, 8), (7, 8), (26, 23)):
            p.ellipse(x - 2, y - 2, x + 2, y + 2, "J")
        p.line([(8, 22), (24, 10)], "K")
        p.line([(9, 10), (24, 21)], "I")
        p.outline()
    else:
        # ribs
        p.rect(15, 8, 17, 27, "I")
        for y in (10, 14, 18, 22):
            p.line([(9, y), (23, y)], "J")
            p.line([(9, y + 1), (23, y + 1)], "K")
            p.set(8, y + 2, "J")
        p.bevel()
        p.outline()
    return quantize(p.image())


def crystal(seed: int) -> Image.Image:
    p = Px()
    p.rect(5, 25, 27, 29, "T")
    p.rect(6, 26, 26, 28, "U")
    shards = [
        (8, 24, 6, 13, "M"),
        (14, 24, 8, 9, "N"),
        (19, 24, 6, 15, "M"),
        (24, 24, 5, 11, "N"),
    ]
    for i, (x, y, w, h, body) in enumerate(shards):
        if (seed + i) % 3 == 0 and i:
            continue
        p.poly([(x - w, y), (x + w, y), (x + (w // 2), y - h)], body)
        p.line([(x, y - h), (x + w - 1, y - 1)], "N" if body == "M" else "6")
        p.set(x + (w // 2), y - h, "7")
    p.bevel()
    p.outline()
    return quantize(p.image())


def rubble(seed: int) -> Image.Image:
    p = Px()
    for k in range(4 + seed % 3):
        x = 6 + (_hash(k, seed, 700) % 20)
        y = 18 + (_hash(k, seed, 710) % 10)
        w = 2 + (_hash(k, seed, 720) % 4)
        h = 1 + (_hash(k, seed, 730) % 3)
        p.rect(x, y, x + w, y + h, "U")
        p.line([(x, y), (x + w, y)], "V")
        p.line([(x, y + h), (x + w, y + h)], "T")
    p.bevel()
    p.outline()
    return quantize(p.image())


# ------------------------------------------------------------- object decor
def well(seed: int) -> Image.Image:
    p = Px()
    # stone rim
    p.ellipse(3, 19, 28, 30, "T")
    p.ellipse(5, 20, 26, 28, "U")
    p.ellipse(8, 22, 23, 27, "3")
    p.ellipse(10, 23, 20, 26, "4")
    p.line([(11, 24), (14, 24)], "5")
    p.line([(17, 25), (20, 25)], "5")
    # posts and roof
    p.rect(9, 9, 10, 22, "Q")
    p.rect(22, 9, 23, 22, "Q")
    p.line([(9, 9), (9, 22)], "R")
    p.poly([(5, 10), (16, 3), (27, 10)], "P")
    p.poly([(7, 10), (16, 5), (25, 10)], "Q")
    p.line([(5, 10), (16, 3)], "R")
    p.line([(16, 3), (27, 10)], "P")
    # hanging lantern
    p.line([(16, 10), (16, 13)], "9")
    p.rect(14, 13, 18, 17, "T")
    p.rect(15, 14, 17, 16, "A")
    p.set(16, 15, "B")
    p.bevel()
    p.outline()
    p.rect(15, 14, 17, 16, "A")
    p.set(16, 15, "B")
    return p.image()


def pike(seed: int) -> Image.Image:
    p = Px()
    # three angled stakes with steel tips
    for i, (x, lean) in enumerate(((10, -2), (16, 0), (22, 2))):
        h = 14 + (i + seed) % 4
        p.line([(x, 29), (x + lean, 29 - h)], "Q", 2)
        p.line([(x, 29), (x + lean, 29 - h)], "R")
        tip_x, tip_y = x + lean, 29 - h
        p.poly([(tip_x - 1, tip_y + 2), (tip_x + 1, tip_y + 2), (tip_x, tip_y - 2)], "5")
        p.set(tip_x, tip_y - 2, "7")
    # rope binding
    p.line([(9, 24), (23, 24)], "S", 2)
    p.bevel()
    p.outline()
    return p.image()


def fire(seed: int) -> Image.Image:
    p = Px()
    # logs
    p.line([(5, 27), (26, 22)], "Q", 3)
    p.line([(6, 22), (26, 27)], "P", 3)
    p.line([(7, 27), (25, 22)], "R")
    # flames
    p.poly([(16, 6), (10, 17), (12, 22), (16, 25), (20, 22), (22, 16)], "D")
    p.poly([(16, 9), (12, 18), (13, 22), (16, 24), (19, 21), (20, 17)], "E")
    p.poly([(16, 12), (14, 19), (16, 23), (18, 19)], "9")
    p.poly([(16, 15), (15, 20), (16, 22), (17, 19)], "B")
    p.set(14, 13, "A")
    p.set(18, 14, "A")
    p.set(16, 10, "7")
    p.bevel()
    p.outline()
    # bright core on top of the outline
    p.poly([(16, 13), (15, 19), (16, 22), (17, 19)], "B")
    p.set(16, 12, "7")
    return p.image()


# ------------------------------------------------------------------- assets
def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {
        "decor": (
            [("grass_%d" % i, grass(i)) for i in range(6)]
            + [("moss_%d" % i, moss(i)) for i in range(4)]
            + [("bones_%d" % i, bones(i)) for i in range(3)]
            + [("crystal_%d" % i, crystal(i)) for i in range(4)]
            + [("rubble_%d" % i, rubble(i)) for i in range(6)]
            + [("lamp_0", well(0))]
            + [("pike_%d" % i, pike(i)) for i in range(2)]
            + [("fire_0", fire(0))]
        )
    }


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    cols = 7
    items = [(tag, im) for family in groups.values() for tag, im in family]
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell + 16, rows * (cell + 18) + 16), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    floor = quantize(make_floor(0))
    for i, (tag, im) in enumerate(items):
        x = 8 + (i % cols) * cell
        y = 8 + (i // cols) * (cell + 18)
        # 3x3 floor behind the decor, so it is judged on a real background
        for ty in range(3):
            for tx in range(3):
                draw.rectangle([x + tx * 32, y + ty * 32, x + tx * 32 + 31, y + ty * 32 + 31],
                               fill=(24, 32, 48, 255))
                sheet.alpha_composite(floor, (x + tx * 32, y + ty * 32))
        sheet.alpha_composite(im.resize((cell, cell), Image.NEAREST), (x, y))
        draw.text((x + 2, y + cell + 2), tag, fill=(232, 183, 91, 255))
    sheet.save(path)
    print("preview:", path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--preview", metavar="PNG", help="сохранить контактный лист и выйти")
    ap.add_argument("--aseprite", metavar="PATH", help="путь к aseprite.exe")
    ap.add_argument("--force", action="store_true", help="перезаписать существующие .aseprite")
    args = ap.parse_args()

    groups = assets()
    if args.preview:
        preview(groups, args.preview)
        return 0

    os.makedirs(OUT, exist_ok=True)
    existing = [f for f in groups if os.path.exists(os.path.join(OUT, f + ".aseprite"))]
    if existing and not args.force:
        print("Уже есть: " + ", ".join(f + ".aseprite" for f in existing))
        print("Это исходники — правьте их в Aseprite. Перезаписать: --force")
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
