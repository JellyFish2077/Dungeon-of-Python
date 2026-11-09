"""Action badge icons for battle overlays.

Every icon is a 32x32 transparent badge with a 1 px outline and a symbol
that reads at in-game battle scale. Source of truth is
`tools/art/aseprite/actions.aseprite`; this script only bootstraps it.

Usage:
    python tools/art/bootstrap/make_actions.py --preview tools/art/_actions_preview.png
    python tools/art/bootstrap/make_actions.py --force
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

DEST = {"actions": "actions"}


def badge() -> Px:
    """Dark round badge with a 1 px outline and a soft top-left rim."""
    p = Px()
    p.ellipse(1, 1, 30, 30, "O")
    p.ellipse(2, 2, 29, 29, "0")
    p.line([(7, 9), (9, 7)], "1")
    return p


def attack() -> Px:
    p = badge()
    # Blade goes up-right; the dark line underneath keeps it readable.
    p.line([(9, 23), (23, 9)], "O", 5)
    p.line([(9, 23), (23, 9)], "5", 3)
    p.line([(10, 22), (22, 10)], "6", 1)
    p.set(23, 8, "7")
    # Crossguard is perpendicular to the blade.
    p.line([(5, 19), (13, 27)], "O", 4)
    p.line([(5, 19), (13, 27)], "9", 2)
    p.line([(6, 19), (13, 26)], "A", 1)
    # Grip and pommel.
    p.line([(9, 23), (5, 27)], "O", 4)
    p.line([(9, 23), (5, 27)], "Q", 2)
    p.set(4, 28, "A")
    return p


def defend() -> Px:
    p = badge()
    p.poly([(16, 3), (27, 7), (26, 20), (16, 29), (6, 20), (5, 7)], "O")
    p.poly([(16, 5), (25, 8), (24, 19), (16, 27), (8, 19), (7, 8)], "3")
    p.poly([(16, 8), (22, 10), (21, 18), (16, 24), (11, 18), (10, 10)], "4")
    p.line([(16, 8), (16, 24)], "5", 1)
    p.line([(11, 10), (16, 13), (21, 10)], "5", 1)
    # Gold boss.
    p.ellipse(13, 13, 18, 18, "O")
    p.ellipse(14, 14, 17, 17, "A")
    p.set(15, 14, "B")
    p.set(16, 14, "B")
    return p


def potion() -> Px:
    p = badge()
    # Cork and neck.
    p.rect(13, 4, 18, 7, "O")
    p.rect(14, 5, 17, 6, "Q")
    p.set(14, 5, "R")
    p.rect(13, 7, 18, 12, "O")
    p.rect(14, 8, 17, 11, "7")
    # Round body with green liquid.
    p.ellipse(8, 11, 23, 27, "O")
    p.ellipse(9, 12, 22, 26, "G")
    p.ellipse(10, 14, 21, 25, "H")
    p.line([(11, 17), (20, 17)], "G", 1)
    # Glass highlight and a bubble.
    p.set(12, 15, "K")
    p.set(13, 15, "K")
    p.set(15, 20, "7")
    p.set(16, 21, "7")
    return p


def ability() -> Px:
    p = badge()
    p.poly([(16, 1), (20, 12), (31, 16), (20, 20), (16, 31), (12, 20), (1, 16), (12, 12)], "O")
    p.poly([(16, 4), (19, 13), (28, 16), (19, 19), (16, 28), (13, 19), (4, 16), (13, 13)], "A")
    p.poly([(16, 8), (18, 14), (24, 16), (18, 18), (16, 24), (14, 18), (8, 16), (14, 14)], "B")
    p.set(16, 16, "7")
    p.set(15, 14, "9")
    p.set(16, 13, "9")
    return p


def flee() -> Px:
    p = badge()
    p.poly([(10, 7), (18, 7), (18, 17), (25, 17), (25, 25), (8, 25), (8, 15), (10, 15)], "O")
    p.poly([(11, 8), (17, 8), (17, 18), (24, 18), (24, 24), (9, 24), (9, 16), (11, 16)], "S")
    p.rect(9, 22, 24, 24, "Q")
    p.line([(9, 22), (24, 22)], "R", 1)
    p.line([(11, 12), (16, 12)], "R", 1)
    # Speed lines.
    p.line([(3, 11), (7, 11)], "5", 1)
    p.line([(3, 15), (7, 15)], "5", 1)
    p.line([(3, 19), (7, 19)], "5", 1)
    return p


def poison() -> Px:
    p = badge()
    p.poly([(16, 3), (24, 15), (23, 21), (16, 28), (9, 21), (8, 15)], "O")
    p.poly([(16, 6), (22, 15), (21, 20), (16, 26), (11, 20), (10, 15)], "G")
    p.poly([(16, 9), (20, 15), (19, 19), (16, 23), (13, 19), (12, 15)], "H")
    # Skull eyes and jaw.
    p.set(13, 16, "0")
    p.set(14, 16, "0")
    p.set(18, 16, "0")
    p.set(19, 16, "0")
    p.set(15, 20, "0")
    p.set(16, 20, "0")
    p.set(17, 20, "0")
    p.set(15, 21, "0")
    # Bubbles.
    p.set(20, 9, "H")
    p.set(22, 12, "H")
    return p


def fire() -> Px:
    p = badge()
    p.poly([(16, 2), (22, 11), (21, 18), (26, 23), (20, 30), (12, 30), (6, 24), (9, 17), (7, 13), (12, 14)], "O")
    p.poly([(16, 5), (20, 12), (19, 18), (23, 22), (18, 27), (13, 27), (9, 23), (11, 17), (10, 14), (13, 15)], "D")
    p.poly([(16, 9), (19, 14), (18, 19), (21, 22), (17, 25), (14, 25), (11, 22), (12, 18), (12, 16), (14, 17)], "E")
    p.poly([(16, 14), (18, 17), (17, 20), (19, 21), (16, 23), (14, 21), (14, 18)], "A")
    p.set(16, 16, "B")
    p.set(16, 17, "B")
    return p


def curse() -> Px:
    p = badge()
    p.ellipse(4, 9, 27, 23, "O")
    p.ellipse(6, 11, 25, 21, "7")
    p.ellipse(12, 10, 20, 22, "O")
    p.ellipse(13, 11, 19, 21, "M")
    p.rect(15, 11, 16, 21, "0")
    p.set(14, 14, "N")
    p.set(13, 15, "N")
    p.line([(8, 8), (11, 11)], "M", 1)
    p.line([(24, 8), (21, 11)], "M", 1)
    return p


def summon() -> Px:
    p = badge()
    p.ellipse(4, 4, 27, 27, "O")
    p.ellipse(6, 6, 25, 25, "M")
    p.ellipse(8, 8, 23, 23, "0")
    p.poly([(16, 7), (25, 22), (7, 22)], "O")
    p.poly([(16, 9), (23, 21), (9, 21)], "N")
    p.poly([(16, 12), (20, 20), (12, 20)], "0")
    for x, y in ((16, 7), (25, 22), (7, 22)):
        p.set(x, y, "B")
        p.set(x - 1, y, "A")
        p.set(x + 1, y, "A")
    return p


def heal() -> Px:
    p = badge()
    p.rect(12, 5, 19, 26, "O")
    p.rect(5, 12, 26, 19, "O")
    p.rect(13, 7, 18, 24, "G")
    p.rect(7, 13, 24, 18, "G")
    p.line([(13, 7), (18, 7)], "H", 1)
    p.line([(7, 13), (7, 18)], "H", 1)
    p.set(15, 10, "H")
    p.set(16, 10, "H")
    return p


def charge() -> Px:
    p = badge()
    p.poly([(19, 2), (7, 17), (14, 17), (10, 30), (25, 13), (17, 13)], "O")
    p.poly([(18, 5), (10, 16), (15, 16), (12, 26), (22, 14), (16, 14)], "A")
    p.poly([(17, 8), (12, 15), (16, 15), (14, 22), (20, 14), (16, 14)], "B")
    p.set(16, 9, "7")
    return p


def ranged() -> Px:
    p = badge()
    p.rect(5, 14, 21, 17, "O")
    p.rect(6, 15, 21, 16, "Q")
    p.poly([(20, 9), (29, 16), (20, 23)], "O")
    p.poly([(21, 12), (27, 16), (21, 20)], "5")
    p.poly([(22, 14), (25, 16), (22, 18)], "6")
    p.poly([(3, 11), (9, 15), (3, 19)], "O")
    p.poly([(4, 12), (8, 15), (4, 18)], "E")
    p.line([(5, 15), (8, 15)], "D", 1)
    return p


def hint() -> Px:
    p = badge()
    p.rect(8, 6, 23, 25, "O")
    p.rect(9, 7, 22, 24, "K")
    p.rect(6, 4, 25, 7, "O")
    p.rect(7, 5, 24, 6, "J")
    p.rect(6, 24, 25, 27, "O")
    p.rect(7, 25, 24, 26, "J")
    p.rect(15, 7, 17, 24, "4")
    p.set(16, 8, "5")
    p.set(15, 24, "5")
    p.set(17, 24, "5")
    # Gold question mark on the parchment.
    p.set(16, 11, "A")
    p.set(15, 11, "9")
    p.set(17, 11, "9")
    p.set(18, 12, "A")
    p.set(18, 13, "9")
    p.set(17, 14, "A")
    p.set(16, 15, "A")
    p.set(16, 17, "A")
    p.set(16, 19, "A")
    return p


def crit() -> Px:
    p = badge()
    p.poly([(16, 1), (19, 11), (29, 8), (21, 16), (29, 24), (19, 21), (16, 31), (13, 21), (3, 24), (11, 16), (3, 8), (13, 11)], "O")
    p.poly([(16, 4), (18, 12), (26, 10), (20, 16), (26, 22), (18, 20), (16, 28), (14, 20), (6, 22), (12, 16), (6, 10), (14, 12)], "D")
    p.poly([(16, 7), (18, 13), (23, 12), (19, 16), (23, 20), (18, 19), (16, 25), (14, 19), (9, 20), (13, 16), (9, 12), (14, 13)], "E")
    p.poly([(16, 12), (18, 15), (19, 16), (18, 17), (16, 20), (14, 17), (13, 16), (14, 15)], "A")
    p.set(16, 16, "B")
    return p


def execute() -> Px:
    p = badge()
    p.ellipse(6, 5, 25, 24, "O")
    p.ellipse(7, 6, 24, 23, "J")
    p.rect(10, 20, 21, 26, "O")
    p.rect(11, 20, 20, 25, "J")
    p.ellipse(10, 10, 15, 16, "0")
    p.ellipse(17, 10, 22, 16, "0")
    p.set(12, 12, "D")
    p.set(13, 12, "E")
    p.set(19, 12, "D")
    p.set(20, 12, "E")
    p.set(16, 17, "0")
    p.set(15, 18, "0")
    p.set(17, 18, "0")
    p.line([(12, 23), (12, 25)], "0", 1)
    p.line([(15, 23), (15, 25)], "0", 1)
    p.line([(18, 23), (18, 25)], "0", 1)
    # Finishing slash.
    p.line([(5, 27), (27, 5)], "O", 3)
    p.line([(6, 27), (27, 6)], "E", 1)
    return p


def drain() -> Px:
    p = badge()
    p.poly([(16, 3), (23, 14), (22, 21), (16, 28), (10, 21), (9, 14)], "O")
    p.poly([(16, 6), (21, 14), (20, 20), (16, 26), (12, 20), (11, 14)], "D")
    p.poly([(16, 9), (19, 14), (18, 19), (16, 23), (14, 19), (13, 14)], "E")
    # Fangs at the top.
    p.poly([(13, 6), (13, 12), (11, 9)], "O")
    p.poly([(19, 6), (19, 12), (21, 9)], "O")
    p.set(15, 14, "7")
    p.set(16, 15, "7")
    return p


def thorns() -> Px:
    p = badge()
    for x, top in ((10, 5), (16, 3), (22, 5)):
        p.poly([(x - 3, 24), (x, top), (x + 3, 24)], "O")
        p.poly([(x - 2, 23), (x, top + 3), (x + 2, 23)], "Q")
        p.line([(x, top + 5), (x, 22)], "R", 1)
    p.rect(6, 23, 25, 26, "O")
    p.rect(7, 24, 24, 25, "U")
    return p


def armor() -> Px:
    p = badge()
    p.poly([(10, 6), (16, 4), (22, 6), (25, 10), (23, 25), (16, 28), (9, 25), (7, 10)], "O")
    p.poly([(11, 8), (16, 6), (21, 8), (23, 11), (21, 23), (16, 26), (11, 23), (9, 11)], "3")
    p.poly([(12, 10), (16, 8), (20, 10), (21, 12), (20, 22), (16, 24), (12, 22), (11, 12)], "4")
    p.line([(12, 8), (16, 12), (20, 8)], "5", 1)
    for x, y in ((11, 12), (21, 12), (11, 20), (21, 20)):
        p.set(x, y, "A")
    p.set(16, 16, "A")
    p.set(16, 17, "B")
    return p


def phasing() -> Px:
    p = badge()
    p.ellipse(8, 5, 23, 20, "O")
    p.poly([(8, 14), (8, 27), (11, 24), (14, 28), (17, 24), (20, 28), (23, 24), (23, 14)], "O")
    p.ellipse(9, 6, 22, 19, "5")
    p.poly([(9, 14), (9, 25), (11, 22), (14, 26), (17, 22), (20, 26), (22, 22), (22, 14)], "5")
    p.ellipse(11, 10, 15, 15, "0")
    p.ellipse(17, 10, 21, 15, "0")
    p.set(12, 12, "D")
    p.set(19, 12, "D")
    p.set(16, 17, "0")
    return p


def bossrage() -> Px:
    p = badge()
    p.poly([(16, 2), (21, 10), (20, 16), (26, 20), (20, 29), (12, 29), (6, 20), (12, 16), (11, 10)], "O")
    p.poly([(16, 5), (19, 11), (18, 16), (23, 20), (18, 26), (14, 26), (9, 20), (14, 16), (13, 11)], "D")
    p.ellipse(9, 12, 23, 21, "0")
    p.ellipse(11, 13, 21, 20, "E")
    p.ellipse(14, 12, 18, 21, "0")
    p.rect(15, 13, 16, 20, "0")
    p.set(16, 16, "B")
    p.line([(8, 11), (13, 14)], "9", 2)
    p.line([(24, 11), (19, 14)], "9", 2)
    return p


def miss() -> Px:
    p = badge()
    p.line([(9, 9), (23, 23)], "O", 5)
    p.line([(23, 9), (9, 23)], "O", 5)
    p.line([(9, 9), (23, 23)], "E", 3)
    p.line([(23, 9), (9, 23)], "E", 3)
    p.line([(10, 10), (22, 22)], "D", 1)
    p.line([(22, 10), (10, 22)], "D", 1)
    return p


def fail() -> Px:
    p = badge()
    p.ellipse(7, 7, 24, 24, "O")
    p.ellipse(9, 9, 22, 22, "U")
    p.ellipse(12, 12, 19, 19, "O")
    p.ellipse(13, 13, 18, 18, "T")
    for x, y in ((15, 3), (15, 27), (3, 15), (27, 15), (7, 6), (24, 7), (7, 24), (24, 24)):
        p.set(x, y, "U")
        p.set(x + 1, y, "V")
    p.line([(16, 6), (14, 13), (18, 16), (15, 23), (17, 26)], "E", 2)
    p.line([(16, 6), (14, 13), (18, 16), (15, 23), (17, 26)], "D", 1)
    return p


def block() -> Px:
    p = badge()
    p.poly([(16, 3), (27, 7), (26, 20), (16, 29), (6, 20), (5, 7)], "O")
    p.poly([(16, 5), (25, 8), (24, 19), (16, 27), (8, 19), (7, 8)], "3")
    p.poly([(16, 8), (22, 10), (21, 18), (16, 24), (11, 18), (10, 10)], "4")
    p.poly([(16, 9), (18, 14), (23, 16), (18, 18), (16, 23), (14, 18), (9, 16), (14, 14)], "O")
    p.poly([(16, 11), (17, 15), (21, 16), (17, 17), (16, 21), (15, 17), (11, 16), (15, 15)], "7")
    p.set(16, 16, "B")
    return p


def no_effect() -> Px:
    p = badge()
    p.rect(13, 4, 18, 7, "O")
    p.rect(14, 5, 17, 6, "Q")
    p.rect(13, 7, 18, 12, "O")
    p.rect(14, 8, 17, 11, "7")
    p.ellipse(8, 11, 23, 27, "O")
    p.ellipse(9, 12, 22, 26, "U")
    p.ellipse(10, 14, 21, 25, "T")
    p.line([(7, 26), (25, 8)], "O", 4)
    p.line([(7, 26), (25, 8)], "E", 2)
    return p


def flee_fail() -> Px:
    p = badge()
    p.poly([(10, 7), (18, 7), (18, 17), (25, 17), (25, 25), (8, 25), (8, 15), (10, 15)], "O")
    p.poly([(11, 8), (17, 8), (17, 18), (24, 18), (24, 24), (9, 24), (9, 16), (11, 16)], "S")
    p.rect(9, 22, 24, 24, "Q")
    p.line([(9, 22), (24, 22)], "R", 1)
    p.line([(6, 8), (14, 20)], "O", 3)
    p.line([(6, 8), (14, 20)], "E", 1)
    p.line([(14, 8), (6, 20)], "O", 3)
    p.line([(14, 8), (6, 20)], "E", 1)
    return p


ICONS = [
    ("attack", attack),
    ("defend", defend),
    ("potion", potion),
    ("ability", ability),
    ("flee", flee),
    ("poison", poison),
    ("fire", fire),
    ("curse", curse),
    ("summon", summon),
    ("heal", heal),
    ("charge", charge),
    ("ranged", ranged),
    ("hint", hint),
    ("crit", crit),
    ("execute", execute),
    ("drain", drain),
    ("thorns", thorns),
    ("armor", armor),
    ("phasing", phasing),
    ("bossrage", bossrage),
    ("miss", miss),
    ("fail", fail),
    ("block", block),
    ("no_effect", no_effect),
    ("flee_fail", flee_fail),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"actions": [(name, quantize(maker().image())) for name, maker in ICONS]}


def preview(groups, path: str) -> None:
    items = groups["actions"]
    cell = 96
    cols = 4
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        cx = i % cols
        cy = i // cols
        x0 = cx * cell
        y0 = cy * cell
        bg = (24, 32, 48, 255) if (cx + cy) % 2 == 0 else (16, 22, 34, 255)
        draw.rectangle([x0, y0, x0 + cell - 1, y0 + cell - 1], fill=bg)
        sheet.alpha_composite(im.resize((72, 72), Image.NEAREST), (x0 + 12, y0 + 12))
        draw.text((x0 + 4, y0 + 4), name, fill=(169, 193, 222, 255))
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
    target = os.path.join(OUT, "actions.aseprite")
    if os.path.exists(target) and not args.force:
        print("actions.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
