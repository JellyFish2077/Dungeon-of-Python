"""Village entrance batch: dungeon descent and packed-earth path tiles.

The descent stands next to the entrance guard at the top of the village; the
path tiles replace the plain ground under the «p» map cells so the roads from
the houses to the square read as trodden earth.

Usage:
    python tools/art/bootstrap/make_village_extra.py --preview tools/art/_village_extra.png
    python tools/art/bootstrap/make_village_extra.py --force
"""
from __future__ import annotations

import argparse
import os
import random
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
    rgba,
    write_manifest,
)

DEST = {"village_extra": "village"}


def descent() -> Image.Image:
    """Спуск в подземелье: деревянная рама вокруг каменных ступеней."""
    p = Px()
    # Деревянная рама: в деревне камень холодный, а рама тёплая.
    p.rect(1, 1, 30, 30, "P")
    p.rect(2, 2, 29, 29, "Q")
    p.rect(3, 3, 28, 28, "R")
    # Сама дыра.
    p.rect(4, 4, 27, 27, "0")
    # Ступени: сверху светлее, к низу уходят в темноту.
    bands = [(5, 8, "V"), (9, 12, "U"), (13, 16, "t"), (17, 20, "u"), (21, 24, "1")]
    for y0, y1, ch in bands:
        p.rect(5, y0, 26, y1, ch)
        p.rect(5, y0, 26, y0, "6")
        p.rect(5, y1, 26, y1, "0")
    # Боковые стенки колодца.
    p.rect(4, 4, 5, 27, "u")
    p.rect(26, 4, 27, 27, "1")
    # Доски рамы: стыки по углам.
    for x, y in ((3, 3), (28, 3), (3, 28), (28, 28)):
        p.set(x, y, "P")
    p.line([(3, 12), (6, 10), (8, 11)], "P")
    p.line([(28, 19), (25, 21), (24, 24)], "P")
    p.bevel()
    p.outline()
    return p.image()


def path_tile(seed: int) -> Image.Image:
    """Утоптанная земля: светлее газона, с камешками и редкой травой."""
    rng = random.Random(seed)
    im = Image.new("RGBA", (32, 32), rgba("R"))
    px = im.load()
    for _ in range(110):
        x, y = rng.randrange(32), rng.randrange(32)
        px[x, y] = rgba(rng.choice(["S", "S", "R", "Q"]))
    for _ in range(4):
        x, y = rng.randrange(3, 29), rng.randrange(3, 29)
        px[x, y] = rgba("I")
        px[x + 1, y] = rgba("J")
        px[x, y + 1] = rgba("Q")
    for _ in range(3):
        x, y = rng.randrange(1, 31), rng.randrange(1, 31)
        px[x, y] = rgba("G")
    return im


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {
        "village_extra": [
            ("descent", quantize(descent())),
            ("path_0", quantize(path_tile(11))),
            ("path_1", quantize(path_tile(23))),
            ("path_2", quantize(path_tile(37))),
        ]
    }


def preview(groups, path):
    items = groups["village_extra"]
    cell = 96
    cols = 2
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        cx = (i % cols) * cell
        cy = (i // cols) * cell
        for gy in range(3):
            for gx in range(3):
                c = (24, 32, 48) if (gx + gy) % 2 == 0 else (16, 22, 34)
                draw.rectangle(
                    [cx + gx * 32, cy + gy * 32, cx + gx * 32 + 31, cy + gy * 32 + 31],
                    fill=c + (255,),
                )
        sheet.alpha_composite(im.resize((96, 96), Image.NEAREST), (cx, cy))
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
    existing = [f for f in groups if os.path.exists(os.path.join(OUT, f + ".aseprite"))]
    if existing and not args.force:
        print("Уже есть: " + ", ".join(f + ".aseprite" for f in existing))
        print("Не трогаю — правьте в Aseprite. Пересоздать: --force")
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
