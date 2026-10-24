"""House interiors: warm wooden walls and plank floors.

Saved as `interior.aseprite`; export_aseprite.py writes the PNGs into
`src_custom/village/` as `wall_0…1.png` and `floor_0…3.png`. build_art.py
puts them into TERRAIN_VILLAGE.interior, and house maps use ground theme 11.

Usage:
    python tools/art/bootstrap/make_interior.py --preview tools/art/_interior_preview.png
    python tools/art/bootstrap/make_interior.py --force
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

DEST = {"interior": "village"}


def _hash(x: int, y: int, seed: int) -> int:
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


def wall(variant: int) -> Image.Image:
    p = Px()
    p.rect(0, 0, 31, 31, "Q")
    # vertical planks
    for x in (0, 8, 16, 24):
        p.line([(x, 0), (x, 31)], "P")
        p.line([(x + 1, 0), (x + 1, 31)], "R")
    # top beam
    p.rect(0, 0, 31, 2, "P")
    p.line([(0, 2), (31, 2)], "R")
    # wood grain and a couple of knots
    for y in range(4, 32):
        for x in range(32):
            n = _hash(x // 2, y // 3, 1700 + variant)
            if n % 17 == 0:
                p.set(x, y, "P")
            elif n % 23 == 0:
                p.set(x, y, "S")
    for k in range(2):
        x = 4 + (_hash(k, variant, 1710) % 24)
        y = 6 + (_hash(k, variant, 1720) % 20)
        p.set(x, y, "P")
        p.set(x + 1, y, "Q")
        p.set(x, y + 1, "Q")
    return p.image()


def floor(variant: int) -> Image.Image:
    p = Px()
    p.rect(0, 0, 31, 31, "R")
    # four horizontal planks
    for row in range(4):
        y0 = row * 8
        p.line([(0, y0), (31, y0)], "Q")
        p.line([(0, y0 + 1), (31, y0 + 1)], "S")
        # staggered butt joint
        x = (4 + row * 11 + variant * 5) % 32
        p.line([(x, y0), (x, y0 + 7)], "Q")
        p.set(x + 1, y0 + 2, "P")
    # grain and knots
    for y in range(32):
        for x in range(32):
            n = _hash(x // 3, y // 2, 1800 + variant)
            if n % 19 == 0:
                p.set(x, y, "Q")
            elif n % 29 == 0:
                p.set(x, y, "S")
    for k in range(3):
        x = 3 + (_hash(k, variant, 1810) % 26)
        y = 3 + (_hash(k, variant, 1820) % 26)
        p.set(x, y, "P")
        p.set(x + 1, y, "Q")
    return p.image()


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {
        "interior": (
            [("wall_%d" % i, quantize(wall(i))) for i in range(2)]
            + [("floor_%d" % i, quantize(floor(i))) for i in range(4)]
        )
    }


def preview(groups, path):
    cell = 128
    items = [(tag, im) for family in groups.values() for tag, im in family]
    sheet = Image.new("RGBA", (4 * cell, 2 * cell), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (tag, im) in enumerate(items):
        x = (i % 4) * cell
        y = (i // 4) * cell
        tiled = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        for ty in range(2):
            for tx in range(2):
                tiled.alpha_composite(im, (tx * 32, ty * 32))
        sheet.alpha_composite(tiled.resize((cell, cell), Image.NEAREST), (x, y))
        draw.text((x + 4, y + cell - 14), tag, fill=(232, 183, 91, 255))
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
    if os.path.exists(os.path.join(OUT, "interior.aseprite")) and not args.force:
        print("interior.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
