"""New shield item icons for the shield equipment slot.

Usage:
    python tools/art/bootstrap/make_shields.py --preview tools/art/_shields_preview.png
    python tools/art/bootstrap/make_shields.py --force
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

DEST = {"items4": "items", "equipment2": "equipment"}


def wooden_shield() -> Px:
    p = Px()
    p.ellipse(5, 3, 26, 28, "O")
    p.ellipse(6, 4, 25, 27, "Q")
    p.ellipse(8, 6, 23, 25, "R")
    for x in (10, 15, 21):
        p.line([(x, 5), (x, 26)], "P", 1)
    for x, y in ((6, 15), (25, 15), (15, 4), (15, 27)):
        p.set(x, y, "V")
    p.ellipse(13, 12, 18, 17, "O")
    p.ellipse(14, 13, 17, 16, "9")
    p.set(15, 14, "A")
    p.bevel()
    p.outline()
    return p


def round_shield() -> Px:
    p = Px()
    p.ellipse(4, 4, 27, 27, "O")
    p.ellipse(5, 5, 26, 26, "D")
    p.ellipse(7, 7, 24, 24, "S")
    p.ellipse(10, 10, 21, 21, "R")
    p.ellipse(13, 13, 18, 18, "O")
    p.ellipse(14, 14, 17, 17, "5")
    p.set(15, 15, "6")
    for x, y in ((6, 15), (25, 15), (15, 6), (15, 25)):
        p.set(x, y, "A")
    p.bevel()
    p.outline()
    return p


def steel_shield() -> Px:
    p = Px()
    p.poly([(16, 2), (27, 6), (26, 20), (16, 30), (6, 20), (5, 6)], "O")
    p.poly([(16, 4), (25, 7), (24, 19), (16, 27), (8, 19), (7, 7)], "4")
    p.poly([(16, 7), (23, 9), (22, 18), (16, 24), (10, 18), (9, 9)], "5")
    p.line([(16, 5), (16, 26)], "A", 1)
    p.line([(9, 10), (16, 14), (23, 10)], "A", 1)
    p.ellipse(14, 14, 17, 17, "O")
    p.ellipse(15, 15, 16, 16, "B")
    p.bevel()
    p.outline()
    return p


def mirror_shield() -> Px:
    p = Px()
    p.poly([(16, 2), (27, 6), (26, 20), (16, 30), (6, 20), (5, 6)], "O")
    p.poly([(16, 4), (25, 7), (24, 19), (16, 27), (8, 19), (7, 7)], "6")
    p.poly([(16, 7), (23, 9), (22, 18), (16, 24), (10, 18), (9, 9)], "7")
    p.line([(10, 10), (16, 16), (22, 10)], "5", 1)
    p.line([(11, 13), (16, 18), (21, 13)], "5", 1)
    p.set(16, 16, "B")
    p.set(14, 9, "A")
    p.bevel()
    p.outline()
    return p


def warden_shield() -> Px:
    p = Px()
    p.poly([(16, 2), (27, 6), (26, 20), (16, 30), (6, 20), (5, 6)], "O")
    p.poly([(16, 4), (25, 7), (24, 19), (16, 27), (8, 19), (7, 7)], "T")
    p.poly([(16, 7), (23, 9), (22, 18), (16, 24), (10, 18), (9, 9)], "U")
    p.line([(16, 5), (16, 26)], "V", 1)
    for x, y in ((9, 7), (23, 7), (18, 20), (14, 20)):
        p.poly([(x, y - 2), (x + 2, y + 2), (x - 2, y + 2)], "9")
    p.ellipse(13, 13, 18, 18, "O")
    p.ellipse(14, 14, 17, 17, "A")
    p.set(15, 15, "B")
    p.bevel()
    p.outline()
    return p


# --------------------------------------------------------------- worn layers
def worn_frame(draw_shield) -> Px:
    """Small shield on the hero's left arm plus a leather strap."""
    p = Px()
    p.line([(13, 20), (27, 24)], "O", 5)
    p.line([(13, 20), (27, 24)], "Q", 3)
    p.line([(14, 19), (26, 23)], "R", 1)
    draw_shield(p)
    p.outline()
    return p


def worn_wooden() -> Px:
    def shield(p):
        p.ellipse(3, 8, 15, 26, "O")
        p.ellipse(4, 9, 14, 25, "Q")
        p.ellipse(5, 10, 13, 24, "R")
        p.line([(9, 10), (9, 24)], "P", 1)
        p.ellipse(7, 15, 11, 19, "O")
        p.ellipse(8, 16, 10, 18, "9")
    return worn_frame(shield)


def worn_round() -> Px:
    def shield(p):
        p.ellipse(3, 8, 15, 26, "O")
        p.ellipse(4, 9, 14, 25, "D")
        p.ellipse(5, 10, 13, 24, "S")
        p.ellipse(7, 14, 11, 20, "O")
        p.ellipse(8, 15, 10, 19, "5")
        p.set(9, 17, "6")
    return worn_frame(shield)


def worn_steel() -> Px:
    def shield(p):
        p.poly([(9, 7), (16, 10), (15, 21), (9, 27), (3, 21), (2, 10)], "O")
        p.poly([(9, 9), (14, 11), (13, 20), (9, 24), (5, 20), (4, 11)], "4")
        p.line([(9, 10), (9, 23)], "A", 1)
        p.set(9, 16, "B")
    return worn_frame(shield)


def worn_mirror() -> Px:
    def shield(p):
        p.poly([(9, 7), (16, 10), (15, 21), (9, 27), (3, 21), (2, 10)], "O")
        p.poly([(9, 9), (14, 11), (13, 20), (9, 24), (5, 20), (4, 11)], "6")
        p.poly([(9, 11), (12, 12), (11, 19), (9, 22), (7, 19), (6, 12)], "7")
        p.set(9, 16, "B")
    return worn_frame(shield)


def worn_warden() -> Px:
    def shield(p):
        p.poly([(9, 7), (16, 10), (15, 21), (9, 27), (3, 21), (2, 10)], "O")
        p.poly([(9, 9), (14, 11), (13, 20), (9, 24), (5, 20), (4, 11)], "T")
        p.line([(9, 10), (9, 23)], "V", 1)
        for x, y in ((6, 10), (12, 20)):
            p.poly([(x, y - 2), (x + 2, y + 2), (x - 2, y + 2)], "9")
        p.ellipse(7, 15, 11, 19, "O")
        p.ellipse(8, 16, 10, 18, "A")
    return worn_frame(shield)


ICONS = [
    ("wooden_shield", wooden_shield),
    ("round_shield", round_shield),
    ("steel_shield", steel_shield),
    ("mirror_shield", mirror_shield),
    ("warden_shield", warden_shield),
]

WORN_ICONS = [
    ("wooden_shield", worn_wooden),
    ("round_shield", worn_round),
    ("steel_shield", worn_steel),
    ("mirror_shield", worn_mirror),
    ("warden_shield", worn_warden),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {
        "items4": [(name, quantize(maker().image())) for name, maker in ICONS],
        "equipment2": [(name, quantize(maker().image())) for name, maker in WORN_ICONS],
    }


def preview(groups, path: str) -> None:
    items = groups["items4"]
    cell = 80
    sheet = Image.new("RGBA", (cell * len(items), cell), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        x0 = i * cell
        bg = (24, 32, 48, 255) if i % 2 == 0 else (16, 22, 34, 255)
        draw.rectangle([x0, 0, x0 + cell - 1, cell - 1], fill=bg)
        sheet.alpha_composite(im.resize((56, 56), Image.NEAREST), (x0 + 12, 12))
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
    targets = ["items4.aseprite", "equipment2.aseprite"]
    if not args.force and any(os.path.exists(os.path.join(OUT, name)) for name in targets):
        print("items4/equipment2 уже есть — правьте их в Aseprite. Перезаписать: --force")
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
