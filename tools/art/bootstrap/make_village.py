"""Village batch for the PyDungeon art slice.

House wall and window, twelve roof tiles (four colours × ridge/slope/eave),
the four yard objects and one villager base that build_art recolours into
the seven NPCs.

Usage:
    python tools/art/bootstrap/make_village.py --preview tools/art/_village_preview.png
    python tools/art/bootstrap/make_village.py --force
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
    quantize,
    rgb,
    write_manifest,
)

DEST = {"village": "village"}
ROOF_COLORS = {
    "red": {"base": "C", "dark": "8", "light": "D", "line": "P"},
    "blue": {"base": "2", "dark": "1", "light": "3", "line": "1"},
    "green": {"base": "F", "dark": "Z", "light": "G", "line": "Z"},
    "brown": {"base": "Q", "dark": "P", "light": "R", "line": "P"},
}


def _hash(x: int, y: int, seed: int) -> int:
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


# --------------------------------------------------------------------- wall
def wall() -> Image.Image:
    """Warm plaster with a dark timber frame; tiles as a half-timbered wall."""
    p = Px()
    p.rect(0, 0, 31, 31, "S")
    for y in range(32):
        for x in range(32):
            n = _hash(x // 2, y // 2, 810)
            if n % 13 == 0:
                p.set(x, y, "R")
            elif n % 17 == 0:
                p.set(x, y, "Q")
            elif n % 29 == 0:
                p.set(x, y, "P")
    # timber top and left post; neighbouring tiles repeat it into a frame
    p.rect(0, 0, 31, 2, "P")
    p.line([(0, 0), (31, 0)], "Q")
    p.line([(0, 2), (31, 2)], "P")
    p.rect(0, 0, 1, 31, "P")
    p.line([(1, 0), (1, 31)], "Q")
    # a couple of plaster cracks
    p.line([(12, 7), (15, 12), (14, 18)], "Q")
    p.line([(22, 20), (20, 25)], "Q")
    p.set(15, 12, "P")
    p.set(20, 25, "P")
    return p.image()


def window(wall_img: Image.Image) -> Image.Image:
    """A lit window in the same wall, with a sill and a flower box."""
    im = wall_img.copy()
    p = Px()
    p.im = im
    p.map = [[_closest_char(im.getpixel((x, y))[:3]) for x in range(32)] for y in range(32)]
    # dark timber frame
    p.rect(5, 7, 26, 24, "P")
    p.rect(7, 9, 24, 22, "8")
    # warm panes
    p.rect(8, 10, 23, 21, "9")
    p.rect(9, 11, 22, 20, "A")
    # mullions
    p.line([(15, 9), (15, 22)], "P")
    p.line([(7, 15), (24, 15)], "P")
    p.line([(16, 9), (16, 22)], "8")
    p.line([(7, 16), (24, 16)], "8")
    # glass glints
    p.line([(10, 12), (13, 12)], "B")
    p.line([(18, 17), (21, 17)], "B")
    # sill and flower box
    p.rect(4, 24, 27, 25, "Q")
    p.line([(4, 24), (27, 24)], "R")
    p.rect(7, 26, 24, 28, "P")
    p.rect(8, 27, 23, 28, "Q")
    p.line([(9, 26), (9, 28)], "G")
    p.line([(13, 26), (13, 28)], "G")
    p.line([(19, 26), (19, 28)], "G")
    p.line([(22, 26), (22, 28)], "G")
    p.set(9, 25, "H")
    p.set(14, 25, "H")
    p.set(20, 25, "H")
    return im


def _closest_char(rgb_value: tuple[int, int, int]) -> str:
    """Map an existing wall pixel back to a palette character for Px edits."""
    from make_slice import PALETTE
    best, best_d = ".", 1e9
    for ch, hex_color in PALETTE.items():
        if not hex_color:
            continue
        c = rgb(hex_color)
        d = sum((c[i] - rgb_value[i]) ** 2 for i in range(3))
        if d < best_d:
            best, best_d = ch, d
    return best


# --------------------------------------------------------------------- roof
def roof(color: str, kind: str, seed: int) -> Image.Image:
    p = Px()
    pal = ROOF_COLORS[color]
    # four courses of staggered shingles; the 8px grid wraps at 32
    for row in range(4):
        y0 = row * 8
        off = 4 if row % 2 else 0
        for x0 in range(-8, 40, 8):
            x = x0 + off
            p.rect(x, y0, x + 7, y0 + 7, pal["base"])
            p.line([(x, y0), (x + 7, y0)], pal["light"])
            p.line([(x, y0), (x, y0 + 7)], pal["dark"])
            # scalloped lower edge: reads as a roof tile, not as a brick
            p.line([(x, y0 + 7), (x + 7, y0 + 7)], pal["dark"])
            p.set(x + 2, y0 + 7, pal["base"])
            p.set(x + 5, y0 + 7, pal["base"])
            p.set(x + 3, y0 + 7, pal["light"])
            p.set(x + 4, y0 + 7, pal["light"])
            p.set(x + 3, y0 + 6, pal["light"])
            n = _hash(x, y0, 900 + seed)
            if n % 5 == 0:
                p.set(x + 2 + (n % 4), y0 + 3, pal["dark"])
            if n % 7 == 0:
                p.set(x + 1 + (n % 3), y0 + 2, pal["light"])
    if kind == "ridge":
        p.rect(0, 0, 31, 3, pal["dark"])
        p.line([(0, 0), (31, 0)], pal["light"])
        p.line([(0, 3), (31, 3)], pal["line"])
        p.line([(0, 4), (31, 4)], pal["light"])
    elif kind == "eave":
        p.line([(0, 24), (31, 24)], pal["light"])
        p.rect(0, 25, 31, 27, pal["base"])
        p.rect(0, 28, 31, 29, pal["dark"])
        p.rect(0, 30, 31, 31, pal["line"])
        for x in range(0, 32, 4):
            p.set(x, 29, pal["dark"])
    return p.image()


# ------------------------------------------------------------------- objects
def barrel() -> Image.Image:
    p = Px()
    p.rect(9, 8, 22, 28, "Q")
    p.rect(8, 9, 23, 27, "Q")
    p.ellipse(9, 5, 22, 12, "Q")
    p.ellipse(11, 6, 20, 10, "R")
    for y in (12, 19, 25):
        p.rect(8, y, 23, y + 1, "T")
        p.line([(8, y), (23, y)], "U")
    p.line([(10, 10), (10, 26)], "R")
    p.line([(21, 10), (21, 26)], "P")
    p.bevel()
    p.outline()
    return p.image()


def woodpile() -> Image.Image:
    p = Px()
    for row, y in enumerate((9, 16, 23)):
        for x in range(5 + row * 2, 27 - row * 2, 7):
            p.ellipse(x, y, x + 6, y + 6, "Q")
            p.ellipse(x + 2, y + 2, x + 4, y + 4, "R")
            p.set(x + 3, y + 3, "P")
    p.bevel()
    p.outline()
    return p.image()


def chimney() -> Image.Image:
    p = Px()
    p.rect(10, 9, 22, 28, "T")
    p.rect(11, 10, 21, 27, "U")
    for y in (13, 17, 21, 25):
        p.line([(11, y), (21, y)], "T")
    p.rect(8, 6, 24, 11, "U")
    p.rect(9, 7, 23, 10, "V")
    p.rect(12, 7, 20, 9, "O")
    p.line([(9, 6), (23, 6)], "V")
    p.bevel()
    p.outline()
    return p.image()


def fence() -> Image.Image:
    p = Px()
    for y in (12, 20):
        p.rect(2, y, 29, y + 3, "Q")
        p.line([(2, y), (29, y)], "R")
        p.line([(2, y + 3), (29, y + 3)], "P")
    for x in (5, 15, 25):
        p.rect(x, 7, x + 3, 28, "Q")
        p.line([(x, 9), (x, 28)], "R")
        p.line([(x + 3, 9), (x + 3, 28)], "P")
        p.poly([(x - 1, 8), (x + 2, 4), (x + 5, 8)], "Q")
        p.line([(x - 1, 8), (x + 2, 4)], "R")
    p.bevel()
    p.outline()
    return p.image()


# -------------------------------------------------------------------- ground
def ground(seed: int) -> Image.Image:
    """Packed earth with grass and a few stones; the village floor."""
    p = Px()
    p.rect(0, 0, 31, 31, "R")
    for y in range(32):
        for x in range(32):
            n = _hash(x // 2, y // 2, 1100 + seed)
            if n % 19 == 0:
                p.set(x, y, "Q")
            elif n % 29 == 0:
                p.set(x, y, "S")
            elif n % 53 == 0:
                p.set(x, y, "P")
    # small stones
    for k in range(3):
        x = 4 + (_hash(k, seed, 1200) % 24)
        y = 4 + (_hash(k, seed, 1210) % 24)
        p.rect(x, y, x + 1, y + 1, "T")
        p.set(x, y, "U")
        p.set(x + 1, y + 1, "P")
    # grass tufts
    for k in range(2):
        x = 4 + (_hash(k, seed, 1300) % 23)
        y = 6 + (_hash(k, seed, 1310) % 20)
        p.set(x, y, "G")
        p.set(x - 1, y - 1, "G")
        p.set(x + 1, y - 1, "H")
        p.set(x, y - 2, "H")
        p.set(x, y + 1, "F")
    # a hairline crack in half the variants
    if seed % 2 == 0:
        x = 6 + (_hash(seed, 0, 1400) % 18)
        for y in range(8, 22):
            x += 1 if _hash(x, y, seed) % 2 else 0
            p.set(x, y, "Q")
    return p.image()


# ---------------------------------------------------------------------- tree
def tree() -> Image.Image:
    p = Px()
    # trunk and roots
    p.rect(14, 19, 17, 30, "Q")
    p.line([(14, 19), (14, 30)], "P")
    p.line([(17, 19), (17, 30)], "R")
    p.line([(12, 29), (14, 30)], "Q")
    p.line([(17, 30), (19, 29)], "Q")
    # canopy
    p.ellipse(4, 3, 27, 23, "F")
    p.ellipse(6, 4, 25, 21, "G")
    p.ellipse(9, 5, 22, 18, "H")
    p.ellipse(9, 6, 15, 11, "H")
    p.ellipse(17, 8, 23, 14, "G")
    p.ellipse(12, 13, 19, 18, "G")
    p.set(10, 8, "H")
    p.set(20, 10, "H")
    p.set(14, 15, "H")
    p.bevel()
    p.outline()
    return p.image()


# ---------------------------------------------------------------------- NPC
def npc_base() -> Image.Image:
    """Ordinary villager; build_art recolours the blue tunic into seven hues."""
    p = Px()
    # boots and legs
    p.rect(11, 27, 14, 30, "T")
    p.rect(18, 27, 21, 30, "T")
    p.rect(11, 30, 14, 30, "P")
    p.rect(18, 30, 21, 30, "P")
    # tunic
    p.poly([(10, 15), (22, 15), (24, 26), (9, 26)], "4")
    p.rect(10, 16, 22, 25, "4")
    # belt
    p.rect(10, 21, 22, 22, "Q")
    p.rect(15, 21, 17, 23, "9")
    p.set(16, 21, "A")
    # arms and hands
    p.poly([(9, 16), (6, 19), (7, 24), (11, 23)], "4")
    p.poly([(23, 16), (26, 19), (25, 24), (21, 23)], "4")
    p.rect(6, 23, 8, 25, "S")
    p.rect(24, 23, 26, 25, "S")
    # head
    p.ellipse(11, 5, 21, 16, "S")
    p.rect(11, 13, 21, 15, "R")
    # hair / simple cap
    p.rect(10, 4, 22, 7, "Q")
    p.rect(11, 3, 21, 5, "R")
    p.line([(10, 7), (22, 7)], "P")
    # eyes and mouth
    p.set(14, 10, "O")
    p.set(18, 10, "O")
    p.set(14, 11, "O")
    p.set(18, 11, "O")
    p.set(16, 12, "R")
    p.set(15, 14, "R")
    p.set(16, 14, "W")
    p.set(17, 14, "R")
    # a small collar
    p.line([(13, 15), (16, 17), (19, 15)], "Q")
    p.bevel()
    return p.image()


# ------------------------------------------------------------------- assets
def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    wall_img = quantize(wall())
    return {
        "village": (
            [("wall", wall_img), ("window", quantize(window(wall_img))), ("npc_base", quantize(npc_base())),
             ("tree", quantize(tree()))]
            + [("ground_%d" % i, quantize(ground(i))) for i in range(4)]
            + [("roof_%s_%s" % (c, k), quantize(roof(c, k, 1)))
               for c in ("red", "blue", "green", "brown")
               for k in ("ridge", "slope", "eave")]
            + [("barrel", quantize(barrel())), ("woodpile", quantize(woodpile())),
               ("chimney", quantize(chimney())), ("fence", quantize(fence()))]
        )
    }


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    cols = 6
    items = [(tag, im) for family in groups.values() for tag, im in family]
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell + 16, rows * (cell + 18) + 16), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (tag, im) in enumerate(items):
        x = 8 + (i % cols) * cell
        y = 8 + (i // cols) * (cell + 18)
        for cy in range(3):
            for cx in range(3):
                c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
                draw.rectangle([x + cx * 32, y + cy * 32, x + cx * 32 + 31, y + cy * 32 + 31], fill=c + (255,))
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
