"""Environment batch for the PyDungeon art slice.

Generates editable Aseprite sources for water, lava, stairs, traps and doors.
These are the pieces that clashed most with the new floor-1 stonework: the
old DCSS water was bright teal and the traps were red/orange.

Usage:
    python tools/art/bootstrap/make_environment.py --preview tools/art/_env_preview.png
    python tools/art/bootstrap/make_environment.py --force

After the first run the `.aseprite` files are the source of truth; edit them
in Aseprite, then run export_aseprite.py and build_art.py.
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
    PALETTE,
    Px,
    SOLID_BG,
    find_aseprite,
    lua_script,
    quantize,
    rgb,
    write_manifest,
)

DEST = {
    "water": "water",
    "lava": "lava",
    "stairs": "stairs",
    "traps": "traps",
    "doors": "doors",
}


def _hash(x: int, y: int, seed: int) -> int:
    """Same deterministic hash as make_slice: builds must be repeatable."""
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


def _im() -> Image.Image:
    return Image.new("RGBA", (32, 32), (0, 0, 0, 0))


def _set(px, x: int, y: int, ch: str) -> None:
    if 0 <= x < 32 and 0 <= y < 32:
        px[x % 32, y % 32] = rgb(PALETTE[ch]) + (255,)


# ------------------------------------------------------------------- water
def water_base(phase: int) -> Image.Image:
    """Deep blue water: calm base, three horizontal ripples, four frames."""
    im = _im()
    px = im.load()
    for y in range(32):
        for x in range(32):
            n = _hash(x, y, 120 + phase)
            if n % 17 == 0:
                ch = "1"
            elif n % 5 == 0:
                ch = "2"
            else:
                ch = "3"
            _set(px, x, y, ch)
    # three long ripples; the sine keeps them connected across tile edges
    for k, base_y in enumerate((5, 15, 25)):
        for x in range(32):
            yy = base_y + round(math.sin(2 * math.pi * x / 32 + phase * math.pi / 2 + k * 0.7) * 1.6)
            _set(px, x, yy, "5" if k != 1 else "4")
            _set(px, x, yy + 1, "4" if k != 1 else "3")
            _set(px, x, yy - 1, "2")
        # foam highlights on a few crests, shifted by the frame
        for d in range(3):
            x = (_hash(k, d, 900 + phase) % 30) + 1
            yy = base_y + round(math.sin(2 * math.pi * x / 32 + phase * math.pi / 2 + k * 0.7) * 1.6)
            _set(px, x, yy, "6")
            _set(px, x + 1, yy, "5")
    return quantize(im)


def water_wave(direction: str, frame: int) -> Image.Image:
    """Transparent foam overlay. The game stacks it over a water base tile."""
    im = _im()
    px = im.load()
    shift = frame  # 0 or 1

    def bead(x: int, y: int, bright: bool = False) -> None:
        _set(px, x, y, "6" if bright else "5")

    if direction in ("E", "W"):
        sign = 1 if direction == "E" else -1
        base_x = 25 if direction == "E" else 3
        for k, (y, length) in enumerate(((8, 5), (16, 4), (23, 6))):
            x0 = base_x - sign * (k % 2) * 2 + sign * shift
            for i in range(length):
                x = x0 + sign * i
                bead(x, y + (i % 2), i in (1, length - 1))
            bead(x0, y + 2, False)
    else:
        sign = 1 if direction == "S" else -1
        base_y = 25 if direction == "S" else 3
        for k, (x, length) in enumerate(((8, 5), (16, 4), (23, 6))):
            y0 = base_y - sign * (k % 2) * 2 + sign * shift
            for i in range(length):
                y = y0 + sign * i
                bead(x + (i % 2), y, i in (1, length - 1))
            bead(x + 2, y0, False)
    return quantize(im)


# -------------------------------------------------------------------- lava
def lava(frame: int) -> Image.Image:
    """Dark crust split by a wrapping network of glowing veins and bubbles."""
    im = _im()
    px = im.load()
    # Five to seven cells: the boundaries read as cracks, not as a pattern.
    seeds = []
    for i in range(6):
        seeds.append((
            (_hash(i + 1, 1, 510) % 32) + 0.5,
            (_hash(i + 1, 2, 520) % 32) + 0.5,
        ))
    pulse = 0.15 * math.sin(frame * math.pi / 3)
    for y in range(32):
        for x in range(32):
            best, second = 1e9, 1e9
            for sx, sy in seeds:
                dx = abs(x + 0.5 - sx)
                dy = abs(y + 0.5 - sy)
                dx = min(dx, 32 - dx)
                dy = min(dy, 32 - dy)
                d = dx * dx + dy * dy
                if d < best:
                    second = best
                    best = d
                elif d < second:
                    second = d
            gap = (second ** 0.5) - (best ** 0.5) + pulse
            if gap < 0.45:
                ch = "B"
            elif gap < 0.85:
                ch = "A"
            elif gap < 1.45:
                ch = "9"
            elif gap < 2.15:
                ch = "D"
            elif gap < 2.85:
                ch = "C"
            else:
                n = _hash(x // 2, y // 2, 600 + frame)
                if n % 17 == 0:
                    ch = "1"
                elif n % 7 == 0:
                    ch = "Q"
                else:
                    ch = "P"
            _set(px, x, y, ch)
    # bubbles: a dark rim, a hot center and a tiny white glint
    for k in range(3):
        cx = (_hash(k, frame, 410) + frame * 7) % 32
        cy = (_hash(k, frame, 420) + frame * 11) % 32
        r = 2 + (k + frame) % 2
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                d = dx * dx + dy * dy
                if d <= r * r:
                    _set(px, cx + dx, cy + dy, "C" if d > (r - 1) ** 2 else ("A" if d > 1 else "B"))
        _set(px, cx - 1, cy - 1, "7")
    return quantize(im)


# ------------------------------------------------------------------- stairs
def stairs_down(frame: int) -> Image.Image:
    p = Px()
    # stone surround
    p.rect(2, 2, 29, 30, "T")
    p.rect(3, 3, 28, 29, "U")
    p.rect(4, 4, 27, 29, "1")
    # side walls, lighter on the left
    p.rect(4, 4, 7, 29, "T")
    p.rect(24, 4, 27, 29, "T")
    p.rect(5, 5, 6, 28, "V")
    p.rect(25, 5, 26, 28, "t")
    # four steps, each one darker and narrower than the last
    steps = [
        (8, 11, 7, 24, "V", "6"),
        (13, 16, 8, 23, "U", "V"),
        (18, 21, 9, 22, "t", "U"),
        (23, 25, 10, 21, "T", "t"),
    ]
    for y0, y1, x0, x1, body, top in steps:
        p.rect(x0, y0, x1, y1, body)
        p.line([(x0, y0), (x1, y0)], top)
        p.line([(x0, y1), (x1, y1)], "0")
    # the hole at the bottom
    p.rect(12, 26, 19, 28, "O")
    p.line([(13, 27), (18, 27)], "3")
    p.set(15, 27, "6" if frame == 0 else "5")
    p.set(3, 3, "A")
    p.set(4, 3, "9")
    p.bevel()
    p.outline()
    # keep the glow visible over the bevel
    p.line([(13, 27), (18, 27)], "3")
    p.set(15, 27, "6" if frame == 0 else "5")
    return p.image()


def stairs_up(frame: int) -> Image.Image:
    p = Px()
    p.rect(2, 2, 29, 30, "T")
    p.rect(3, 3, 28, 29, "U")
    p.rect(4, 4, 27, 29, "1")
    p.rect(4, 4, 7, 29, "T")
    p.rect(24, 4, 27, 29, "T")
    p.rect(5, 5, 6, 28, "V")
    p.rect(25, 5, 26, 28, "t")
    # four steps rising toward the pale opening
    steps = [
        (22, 25, 10, 21, "T", "t"),
        (17, 20, 9, 22, "t", "U"),
        (12, 15, 8, 23, "U", "V"),
        (7, 10, 7, 24, "V", "6"),
    ]
    for y0, y1, x0, x1, body, top in steps:
        p.rect(x0, y0, x1, y1, body)
        p.line([(x0, y0), (x1, y0)], top)
        p.line([(x0, y1), (x1, y1)], "0")
    # light at the top
    p.rect(9, 5, 22, 7, "6")
    p.line([(11, 5), (20, 5)], "7")
    p.set(15, 6, "B" if frame == 0 else "A")
    p.set(3, 3, "A")
    p.set(4, 3, "9")
    p.bevel()
    p.outline()
    p.rect(10, 6, 21, 7, "6")
    p.line([(12, 5), (19, 5)], "7")
    p.set(15, 6, "B" if frame == 0 else "A")
    return p.image()


# -------------------------------------------------------------------- traps
def trap_spikes() -> Image.Image:
    p = Px()
    # low iron plate
    p.rect(3, 23, 28, 30, "T")
    p.rect(4, 24, 27, 29, "U")
    p.line([(4, 24), (27, 24)], "V")
    # three large spikes read even at 15 px and 30% opacity
    for x, h in ((8, 12), (16, 15), (24, 12)):
        p.poly([(x - 4, 28), (x + 4, 28), (x, 28 - h)], "5")
        p.line([(x, 28 - h), (x + 2, 28)], "6")
        p.set(x, 28 - h, "7")
        p.set(x, 28 - h + 1, "7")
    p.bevel()
    p.outline()
    for x, h in ((8, 12), (16, 15), (24, 12)):
        p.set(x, 28 - h, "7")
        p.set(x, 28 - h + 1, "7")
    return p.image()


def trap_pit() -> Image.Image:
    p = Px()
    # bold jagged rim: at 15 px it must read as a hole, not as a texture
    p.poly([(2, 6), (8, 3), (16, 4), (24, 3), (30, 8), (28, 16),
            (30, 24), (24, 29), (16, 27), (8, 29), (2, 24), (4, 16)], "U")
    p.poly([(4, 8), (9, 5), (16, 6), (23, 5), (27, 9), (26, 16),
            (27, 22), (22, 26), (16, 25), (10, 26), (5, 22), (6, 16)], "T")
    p.poly([(7, 9), (15, 7), (23, 9), (26, 16), (24, 23),
            (16, 26), (8, 23), (5, 16)], "O")
    p.poly([(9, 11), (15, 9), (21, 11), (23, 16), (21, 21),
            (15, 23), (9, 21), (7, 16)], "1")
    for x, y in ((6, 7), (12, 5), (20, 5), (26, 8), (5, 20), (27, 20), (11, 27), (21, 26)):
        p.set(x, y, "V")
    p.line([(12, 14), (16, 17), (15, 21)], "2")
    p.set(16, 15, "3")
    p.bevel()
    p.outline()
    p.set(16, 15, "3")
    return p.image()


def trap_net() -> Image.Image:
    p = Px()
    # four thick ropes: two diagonals each way, plus knots
    for offset in (-7, 0, 7):
        p.line([(2 + offset, 2), (30 + offset, 30)], "Q", 2)
        p.line([(30 + offset, 2), (2 + offset, 30)], "Q", 2)
    for offset in (-7, 0, 7):
        for t in (0.25, 0.5, 0.75):
            x = int(16 + offset + (t - 0.5) * 28)
            y = int(16 + (t - 0.5) * 28)
            if 5 <= x <= 26 and 5 <= y <= 26:
                p.rect(x - 1, y - 1, x + 1, y + 1, "S")
                p.set(x, y, "R")
    # one metal hook
    p.line([(22, 6), (25, 9)], "5", 2)
    p.set(26, 10, "6")
    p.bevel()
    p.outline()
    return p.image()


def trap_gas() -> Image.Image:
    p = Px()
    # vent
    p.rect(7, 25, 24, 30, "T")
    p.rect(8, 26, 23, 29, "U")
    for x in range(9, 23, 4):
        p.rect(x, 27, x + 1, 28, "1")
    # one large mushroom: a strong silhouette at small size
    p.rect(15, 19, 17, 25, "R")
    p.ellipse(8, 14, 24, 22, "S")
    p.ellipse(11, 16, 21, 20, "R")
    p.set(12, 17, "Q")
    p.set(19, 18, "Q")
    p.bevel()
    p.outline()
    # loose spores, drawn last so they stay green
    for k in range(14):
        x = 5 + (_hash(k, 1, 610) % 23)
        y = 5 + (_hash(k, 2, 620) % 12)
        p.set(x, y, "H" if k % 3 == 0 else "G")
    return p.image()


def trap_blade() -> Image.Image:
    p = Px()
    p.rect(3, 24, 28, 30, "T")
    p.rect(4, 25, 27, 29, "U")
    # three bold crystal shards
    p.poly([(8, 27), (5, 13), (12, 20)], "M")
    p.poly([(14, 27), (14, 6), (20, 20)], "N")
    p.poly([(22, 27), (26, 11), (27, 21)], "M")
    p.line([(5, 13), (10, 21)], "N")
    p.line([(14, 6), (17, 20)], "6")
    p.line([(26, 11), (24, 21)], "N")
    p.set(14, 6, "7")
    p.set(5, 13, "6")
    p.set(26, 11, "6")
    p.bevel()
    p.outline()
    p.line([(14, 7), (17, 20)], "6")
    p.set(14, 7, "7")
    return p.image()


def trap_magical() -> Image.Image:
    p = Px()
    p.rect(3, 3, 28, 29, "T")
    p.rect(4, 4, 27, 28, "U")
    p.bevel()
    p.outline()
    # a thick rune circle and four bright cardinal marks
    for i in range(36):
        ang = 2 * math.pi * i / 36
        x = 16 + round(math.cos(ang) * 9)
        y = 16 + round(math.sin(ang) * 9)
        p.set(x, y, "N" if i % 3 else "M")
    for x, y in ((16, 5), (27, 16), (16, 27), (5, 16)):
        p.rect(x - 1, y - 1, x + 1, y + 1, "A")
    p.line([(16, 10), (16, 22)], "N")
    p.line([(10, 16), (22, 16)], "N")
    p.set(16, 16, "7")
    p.set(16, 15, "A")
    return p.image()


# -------------------------------------------------------------------- doors
def door(locked: bool) -> Image.Image:
    p = Px()
    # stone frame
    p.rect(2, 2, 29, 30, "T")
    p.rect(3, 3, 28, 29, "U")
    p.rect(4, 4, 27, 29, "0")
    # wood
    body = "Q"
    p.rect(6, 5, 25, 29, body)
    for x in (9, 13, 17, 21, 24):
        p.line([(x, 6), (x, 28)], "P")
    # iron bands
    for y in (10, 20):
        p.rect(6, y, 25, y + 1, "U")
        p.line([(6, y), (25, y)], "V")
        p.line([(6, y + 1), (25, y + 1)], "T")
    # handle
    p.rect(20, 16, 22, 18, "9")
    p.set(21, 16, "B")
    if locked:
        # chain and a compact padlock, so the door still reads as a door
        p.line([(5, 7), (26, 25)], "T")
        p.line([(26, 7), (5, 25)], "T")
        p.rect(13, 15, 18, 21, "9")
        p.rect(14, 16, 17, 20, "A")
        p.rect(15, 17, 16, 19, "O")
        p.set(15, 20, "O")
        p.set(16, 20, "O")
        p.set(6, 10, "E")
    p.bevel()
    p.outline()
    if locked:
        p.rect(13, 15, 18, 21, "9")
        p.rect(14, 16, 17, 20, "A")
        p.rect(15, 17, 16, 19, "O")
        p.set(15, 20, "O")
        p.set(16, 20, "O")
    return p.image()


# ------------------------------------------------------------------- assets
def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    water = [("base_%d" % i, water_base(i)) for i in range(4)]
    for d in ("E", "N", "S", "W"):
        water += [("wave_%s_%d" % (d, i), water_wave(d, i)) for i in range(2)]
    return {
        "water": water,
        "lava": [("%d" % i, lava(i)) for i in range(6)],
        "stairs": [
            ("down_0", stairs_down(0)),
            ("down_1", stairs_down(1)),
            ("up_0", stairs_up(0)),
            ("up_1", stairs_up(1)),
        ],
        "traps": [
            ("spikes", trap_spikes()),
            ("pit", trap_pit()),
            ("net", trap_net()),
            ("gas", trap_gas()),
            ("blade", trap_blade()),
            ("magical", trap_magical()),
        ],
        "doors": [("0", door(False)), ("1", door(True))],
    }


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    cols = 6
    rows = (sum(len(v) for v in groups.values()) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell + 16, rows * (cell + 18) + 16), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    i = 0
    for family, items in groups.items():
        for tag, im in items:
            x = 8 + (i % cols) * cell
            y = 8 + (i // cols) * (cell + 18)
            for cy in range(3):
                for cx in range(3):
                    c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
                    draw.rectangle([x + cx * 32, y + cy * 32, x + cx * 32 + 31, y + cy * 32 + 31], fill=c + (255,))
            # show the actual 32x32 frame; water/lava also get a 2x2 tiling pass
            if family in ("water", "lava") and not tag.startswith("wave_"):
                tiled = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
                for ty in range(2):
                    for tx in range(2):
                        tiled.alpha_composite(im, (tx * 32, ty * 32))
                sheet.alpha_composite(tiled.resize((cell, cell), Image.NEAREST), (x, y))
            else:
                sheet.alpha_composite(im.resize((cell, cell), Image.NEAREST), (x, y))
            draw.text((x + 2, y + cell + 2), family + "/" + tag, fill=(232, 183, 91, 255))
            i += 1
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
