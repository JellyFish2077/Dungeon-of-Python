"""House furniture batch.

Tables, chairs, beds, shelves, crates, anvil, fireplace, workbench, cauldron
and a shop counter. Saved as `furniture.aseprite`; export writes them into
`src_custom/objects/`, and house maps place them as props.

Usage:
    python tools/art/bootstrap/make_furniture.py --preview tools/art/_furniture_preview.png
    python tools/art/bootstrap/make_furniture.py --force
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

DEST = {"furniture": "objects"}


def table() -> Image.Image:
    p = Px()
    p.rect(4, 10, 28, 17, "Q")
    p.rect(5, 11, 27, 15, "R")
    p.line([(4, 10), (28, 10)], "S")
    p.line([(4, 17), (28, 17)], "P")
    p.rect(6, 18, 9, 29, "Q")
    p.rect(23, 18, 26, 29, "Q")
    p.line([(6, 18), (6, 29)], "P")
    p.line([(23, 18), (23, 29)], "P")
    p.line([(9, 18), (9, 29)], "R")
    p.line([(26, 18), (26, 29)], "R")
    # a candle and a mug
    p.rect(11, 6, 13, 10, "U")
    p.rect(12, 4, 12, 6, "9")
    p.set(12, 3, "B")
    p.rect(20, 8, 23, 11, "8")
    p.set(21, 8, "A")
    p.bevel()
    p.outline()
    p.rect(12, 4, 12, 6, "9")
    p.set(12, 3, "B")
    return p.image()


def chair() -> Image.Image:
    p = Px()
    p.rect(9, 9, 14, 23, "Q")
    p.rect(10, 10, 13, 12, "R")
    p.rect(9, 18, 23, 23, "Q")
    p.rect(10, 19, 22, 21, "R")
    p.rect(10, 23, 12, 29, "Q")
    p.rect(20, 23, 22, 29, "Q")
    p.line([(10, 23), (10, 29)], "P")
    p.line([(20, 23), (20, 29)], "P")
    p.bevel()
    p.outline()
    return p.image()


def bed() -> Image.Image:
    p = Px()
    # frame
    p.rect(3, 8, 28, 29, "Q")
    p.rect(4, 9, 27, 28, "R")
    # headboard
    p.rect(3, 6, 28, 10, "Q")
    p.line([(3, 6), (28, 6)], "S")
    # mattress and pillow
    p.rect(5, 11, 26, 27, "6")
    p.rect(6, 12, 13, 17, "7")
    p.line([(5, 19), (26, 19)], "5")
    # blanket
    p.rect(5, 19, 26, 27, "C")
    p.rect(5, 20, 26, 26, "D")
    p.line([(5, 19), (26, 19)], "E")
    p.set(9, 22, "9")
    p.set(16, 24, "9")
    p.bevel()
    p.outline()
    p.rect(6, 12, 13, 17, "7")
    return p.image()


def shelf() -> Image.Image:
    p = Px()
    p.rect(4, 3, 28, 29, "Q")
    p.rect(5, 4, 27, 28, "R")
    for y in (10, 17, 24):
        p.rect(5, y, 27, y + 1, "P")
        p.line([(5, y), (27, y)], "S")
    # books and bottles
    for x, y, ch in ((7, 6, "4"), (10, 6, "D"), (13, 6, "G"), (19, 6, "9"), (23, 6, "M")):
        p.rect(x, y, x + 2, y + 4, ch)
    for x, y, ch in ((7, 13, "D"), (11, 13, "9"), (17, 13, "4"), (22, 13, "H")):
        p.rect(x, y, x + 2, y + 3, ch)
    for x, y, ch in ((8, 20, "G"), (14, 20, "9"), (21, 20, "M")):
        p.rect(x, y, x + 2, y + 3, ch)
    p.bevel()
    p.outline()
    return p.image()


def crate() -> Image.Image:
    p = Px()
    p.rect(6, 9, 26, 29, "Q")
    p.rect(7, 10, 25, 28, "R")
    p.line([(7, 10), (25, 28)], "P", 2)
    p.line([(25, 10), (7, 28)], "P", 2)
    p.line([(6, 9), (26, 9)], "S")
    p.line([(6, 29), (26, 29)], "P")
    for x, y in ((8, 11), (24, 11), (8, 27), (24, 27)):
        p.set(x, y, "U")
    p.bevel()
    p.outline()
    return p.image()


def anvil() -> Image.Image:
    p = Px()
    # wooden stump
    p.ellipse(7, 22, 25, 30, "Q")
    p.ellipse(9, 23, 23, 28, "R")
    # anvil body
    p.poly([(6, 12), (25, 12), (28, 16), (25, 19), (20, 19), (18, 23), (12, 23), (10, 19), (6, 19)], "T")
    p.rect(9, 13, 24, 16, "U")
    p.line([(7, 12), (25, 12)], "V")
    p.poly([(6, 12), (2, 13), (6, 16)], "T")
    p.line([(3, 13), (6, 13)], "V")
    p.bevel()
    p.outline()
    p.rect(9, 13, 24, 16, "U")
    p.line([(7, 12), (25, 12)], "V")
    return p.image()


def fireplace() -> Image.Image:
    p = Px()
    # stone hearth
    p.rect(3, 8, 28, 30, "T")
    p.rect(4, 9, 27, 29, "U")
    p.rect(6, 13, 25, 29, "1")
    p.rect(7, 14, 24, 29, "0")
    # mantle
    p.rect(2, 7, 29, 11, "Q")
    p.line([(2, 7), (29, 7)], "R")
    p.line([(2, 11), (29, 11)], "P")
    # fire
    p.poly([(16, 15), (10, 24), (12, 28), (16, 26), (20, 28), (22, 24)], "D")
    p.poly([(16, 18), (13, 24), (16, 27), (19, 24)], "E")
    p.poly([(16, 21), (15, 25), (16, 26), (17, 24)], "A")
    p.set(16, 19, "B")
    p.bevel()
    p.outline()
    p.poly([(16, 18), (13, 24), (16, 27), (19, 24)], "E")
    p.poly([(16, 21), (15, 25), (16, 26), (17, 24)], "A")
    return p.image()


def workbench() -> Image.Image:
    p = Px()
    p.rect(3, 12, 29, 19, "Q")
    p.rect(4, 13, 28, 17, "R")
    p.line([(3, 12), (29, 12)], "S")
    p.rect(5, 20, 8, 30, "Q")
    p.rect(24, 20, 27, 30, "Q")
    p.line([(5, 20), (5, 30)], "P")
    p.line([(24, 20), (24, 30)], "P")
    # tools
    p.rect(8, 8, 17, 10, "5")
    p.line([(8, 9), (17, 9)], "7")
    p.rect(19, 6, 21, 10, "9")
    p.rect(20, 4, 20, 6, "A")
    p.set(20, 3, "B")
    p.bevel()
    p.outline()
    return p.image()


def cauldron() -> Image.Image:
    p = Px()
    p.ellipse(7, 12, 25, 28, "T")
    p.ellipse(9, 14, 23, 26, "U")
    p.ellipse(9, 13, 23, 19, "G")
    p.ellipse(11, 14, 21, 18, "H")
    p.set(14, 15, "7")
    p.set(18, 16, "G")
    p.line([(7, 20), (25, 20)], "P")
    # legs
    p.rect(9, 26, 11, 30, "T")
    p.rect(21, 26, 23, 30, "T")
    p.bevel()
    p.outline()
    p.ellipse(9, 13, 23, 19, "G")
    p.ellipse(11, 14, 21, 18, "H")
    return p.image()


def counter() -> Image.Image:
    p = Px()
    p.rect(3, 11, 29, 18, "Q")
    p.rect(4, 12, 28, 16, "R")
    p.line([(3, 11), (29, 11)], "S")
    p.rect(4, 18, 28, 30, "Q")
    for x in (8, 14, 20, 26):
        p.line([(x, 18), (x, 30)], "P")
    p.line([(4, 24), (28, 24)], "P")
    # coin and bottle on top
    p.ellipse(9, 7, 14, 11, "9")
    p.set(11, 8, "B")
    p.rect(20, 5, 23, 10, "D")
    p.rect(20, 4, 23, 5, "8")
    p.bevel()
    p.outline()
    return p.image()


FURNITURE = [
    ("table", table()),
    ("chair", chair()),
    ("bed", bed()),
    ("shelf", shelf()),
    ("crate", crate()),
    ("anvil", anvil()),
    ("fireplace", fireplace()),
    ("workbench", workbench()),
    ("cauldron", cauldron()),
    ("counter", counter()),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"furniture": [(name, quantize(im)) for name, im in FURNITURE]}


def preview(groups, path):
    cell = 112
    items = [(tag, im) for family in groups.values() for tag, im in family]
    cols = 5
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * (cell + 18)), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (tag, im) in enumerate(items):
        x = (i % cols) * cell
        y = (i // cols) * (cell + 18)
        for cy in range(3):
            for cx in range(3):
                c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
                draw.rectangle([x + cx * 32, y + cy * 32, x + cx * 32 + 31, y + cy * 32 + 31], fill=c + (255,))
        sheet.alpha_composite(im.resize((cell, cell), Image.NEAREST), (x, y))
        draw.text((x + 4, y + cell + 2), tag, fill=(232, 183, 91, 255))
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
    if os.path.exists(os.path.join(OUT, "furniture.aseprite")) and not args.force:
        print("furniture.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
