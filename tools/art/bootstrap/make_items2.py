"""Second item batch: the remaining 23 equipment and potion sprites.

Saved as `items2.aseprite`; export_aseprite.py writes the PNGs into
`src_custom/items/` next to the first six.

Usage:
    python tools/art/bootstrap/make_items2.py --preview tools/art/_items2_preview.png
    python tools/art/bootstrap/make_items2.py --force
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

DEST = {"items2": "items"}


# ------------------------------------------------------------------- weapons
def sword(base: str, light: str, edge: str, guard_d: str, guard_l: str,
          grip: str, pommel: str, length: int = 18, curved: bool = False) -> Image.Image:
    p = Px()
    tip = (24, 7) if not curved else (25, 8)
    blade = [(7, 26), (tip[0] - 1, tip[1]), (tip[0] + 1, tip[1] + 2), (10, 28)]
    p.poly(blade, base)
    p.line([(8, 25), (tip[0] - 1, tip[1])], light)
    p.line([(tip[0] - 1, tip[1]), (tip[0] + 1, tip[1] + 2)], edge)
    # guard and grip
    p.line([(4, 22), (12, 30)], guard_d, 2)
    p.line([(5, 22), (12, 29)], guard_l)
    p.line([(4, 26), (8, 30)], grip, 2)
    p.rect(2, 29, 5, 31, pommel)
    p.bevel()
    p.outline()
    p.line([(8, 25), (tip[0] - 1, tip[1])], light)
    p.line([(tip[0] - 1, tip[1]), (tip[0] + 1, tip[1] + 2)], edge)
    return p


def bone_dagger() -> Image.Image:
    p = Px()
    # narrow jagged bone blade
    p.poly([(12, 24), (23, 8), (25, 10), (14, 27)], "J")
    p.poly([(13, 23), (23, 10), (24, 11), (14, 25)], "K")
    for x, y in ((16, 22), (19, 18), (22, 14)):
        p.set(x, y, "I")
        p.set(x + 1, y + 1, "J")
    # crossguard
    p.line([(8, 22), (14, 28)], "I", 2)
    p.line([(9, 22), (14, 27)], "J")
    # grip and pommel
    p.line([(8, 26), (11, 29)], "Q", 2)
    p.line([(9, 26), (11, 28)], "R")
    p.rect(6, 28, 8, 30, "J")
    p.bevel()
    p.outline()
    p.poly([(13, 23), (23, 10), (24, 11), (14, 25)], "K")
    p.line([(9, 22), (14, 27)], "J")
    return p.image()


def steel_sword() -> Image.Image:
    return sword("5", "6", "7", "8", "A", "2", "9", length=20).image()


def frost_blade() -> Image.Image:
    p = sword("5", "6", "7", "4", "5", "2", "6", length=20)
    # a few ice shards at the guard
    p.poly([(3, 20), (1, 16), (5, 18)], "6")
    p.poly([(12, 20), (15, 16), (13, 21)], "7")
    p.set(2, 15, "7")
    p.set(14, 15, "6")
    return p.image()


def vampiric_blade() -> Image.Image:
    p = sword("C", "D", "E", "P", "Q", "1", "E", length=18, curved=True)
    # bat-wing guard and a red gem
    p.poly([(2, 22), (6, 20), (7, 25)], "P")
    p.poly([(12, 29), (14, 28), (16, 31)], "P")
    p.rect(5, 27, 7, 29, "E")
    p.set(6, 27, "B")
    return p.image()


def dragon_blade() -> Image.Image:
    p = sword("D", "E", "9", "8", "A", "P", "9", length=20)
    # dragon-wing guard and gold flame
    p.poly([(1, 20), (5, 17), (9, 20), (6, 24), (2, 22)], "9")
    p.line([(2, 20), (5, 18)], "B")
    p.line([(5, 24), (8, 20)], "A")
    p.line([(9, 24), (21, 10)], "E")
    p.line([(10, 26), (22, 12)], "9")
    p.poly([(10, 17), (13, 13), (16, 17)], "A")
    p.set(13, 14, "B")
    p.set(2, 22, "B")
    return p.image()


def trident() -> Image.Image:
    p = Px()
    # shaft
    p.line([(7, 28), (20, 13)], "Q", 2)
    p.line([(8, 28), (20, 14)], "R")
    # gold collar
    p.line([(18, 15), (22, 11)], "9", 2)
    p.line([(19, 15), (22, 12)], "A")
    # three prongs
    p.line([(20, 12), (25, 6)], "5", 2)
    p.line([(22, 11), (27, 5)], "6")
    p.line([(19, 13), (18, 6)], "5", 2)
    p.line([(18, 13), (17, 5)], "6")
    p.line([(21, 14), (28, 10)], "5", 2)
    p.line([(22, 14), (29, 11)], "6")
    p.set(25, 6, "7")
    p.set(18, 6, "7")
    p.set(28, 10, "7")
    p.bevel()
    p.outline()
    p.set(25, 6, "7")
    p.set(18, 6, "7")
    p.set(28, 10, "7")
    return p.image()


# ------------------------------------------------------------------- potions
def potion(liquid: str, liquid_light: str, glass: str, cork: str,
           big: bool = False, extra: str = "") -> Image.Image:
    p = Px()
    if big:
        p.ellipse(7, 14, 25, 29, glass)
        p.ellipse(8, 17, 24, 28, liquid)
        p.ellipse(10, 19, 20, 26, liquid_light)
        p.rect(14, 7, 18, 15, glass)
        p.rect(13, 5, 19, 7, "9")
        p.rect(15, 2, 17, 6, cork)
    else:
        p.ellipse(9, 12, 23, 28, glass)
        p.ellipse(10, 16, 22, 27, liquid)
        p.ellipse(12, 18, 19, 25, liquid_light)
        p.rect(13, 5, 19, 13, glass)
        p.rect(12, 5, 20, 6, "9")
        p.rect(14, 2, 18, 5, cork)
    p.line([(11, 15), (11, 24)], "7")
    p.bevel()
    p.outline()
    p.line([(11, 15), (11, 24)], "7")
    if extra == "leaf":
        p.ellipse(16, 0, 21, 4, "G")
        p.set(18, 1, "H")
    elif extra == "star":
        p.line([(16, 18), (16, 23)], "7")
        p.line([(13, 21), (19, 21)], "7")
    elif extra == "band":
        p.line([(8, 22), (24, 22)], "9")
        p.set(16, 22, "B")
    return p.image()


def antidote() -> Image.Image:
    return potion("G", "H", "6", "Q", extra="leaf")


def big_potion() -> Image.Image:
    return potion("D", "E", "6", "Q", big=True, extra="band")


def elixir() -> Image.Image:
    return potion("9", "A", "6", "Q", extra="star")


def greater_elixir() -> Image.Image:
    return potion("M", "N", "6", "9", big=True, extra="band")


def purifying() -> Image.Image:
    return potion("4", "5", "6", "7", extra="star")


# -------------------------------------------------------------------- armor
def armor_body(body: str, light: str, dark: str, trim: str) -> Px:
    p = Px()
    p.poly([(10, 6), (22, 6), (25, 12), (23, 28), (9, 28), (7, 12)], body)
    p.ellipse(13, 4, 19, 9, "1")
    p.ellipse(6, 8, 12, 14, light)
    p.ellipse(20, 8, 26, 14, light)
    p.line([(10, 6), (22, 6)], light)
    p.line([(7, 12), (9, 28)], dark)
    p.line([(25, 12), (23, 28)], dark)
    p.rect(10, 22, 22, 23, trim)
    p.bevel()
    p.outline()
    p.ellipse(13, 4, 19, 9, "1")
    p.rect(10, 22, 22, 23, trim)
    return p


def cloth_robe() -> Image.Image:
    p = Px()
    # long robe with sleeves and a hood
    p.poly([(10, 6), (22, 6), (26, 14), (24, 30), (8, 30), (6, 14)], "2")
    p.rect(9, 15, 23, 28, "2")
    p.poly([(8, 10), (3, 14), (4, 22), (9, 20)], "3")
    p.poly([(24, 10), (29, 14), (28, 22), (23, 20)], "3")
    p.ellipse(12, 2, 20, 10, "3")
    p.ellipse(13, 4, 19, 9, "1")
    # rope belt and clasp
    p.rect(9, 20, 23, 21, "Q")
    p.rect(15, 20, 17, 22, "9")
    p.set(16, 20, "A")
    p.line([(16, 22), (16, 28)], "1")
    p.bevel()
    p.outline()
    p.rect(15, 20, 17, 22, "9")
    p.set(16, 20, "A")
    return p.image()


def chainmail() -> Image.Image:
    p = armor_body("T", "U", "1", "P")
    for y in range(10, 21, 3):
        for x in range(10 + (y % 2), 23, 4):
            p.set(x, y, "V")
            p.set(x + 1, y + 1, "T")
    p.rect(15, 22, 17, 24, "9")
    return p.image()


def dragon_scale() -> Image.Image:
    p = armor_body("C", "D", "P", "9")
    for y in range(10, 21, 3):
        for x in range(10 + (y % 2), 23, 4):
            p.set(x, y, "E")
            p.set(x + 1, y + 2, "D")
    p.poly([(6, 9), (9, 5), (12, 9)], "J")
    p.poly([(20, 9), (23, 5), (26, 9)], "J")
    p.rect(15, 22, 17, 24, "B")
    return p.image()


def mirror_plate() -> Image.Image:
    p = armor_body("5", "6", "3", "9")
    p.line([(11, 10), (15, 18), (12, 25)], "7")
    p.line([(20, 10), (17, 17)], "6")
    p.rect(15, 22, 17, 24, "B")
    return p.image()


# ------------------------------------------------------------------ shields
def aegis() -> Image.Image:
    p = Px()
    p.ellipse(2, 3, 29, 29, "9")
    p.ellipse(4, 5, 27, 27, "A")
    p.ellipse(6, 7, 25, 25, "3")
    p.ellipse(8, 9, 23, 23, "4")
    # star
    p.line([(16, 9), (16, 23)], "7")
    p.line([(9, 16), (23, 16)], "7")
    p.line([(11, 11), (21, 21)], "6")
    p.line([(21, 11), (11, 21)], "6")
    p.set(16, 16, "B")
    p.bevel()
    p.outline()
    p.line([(16, 9), (16, 23)], "7")
    p.line([(9, 16), (23, 16)], "7")
    p.set(16, 16, "B")
    return p.image()


def spiked_shield() -> Image.Image:
    p = Px()
    p.poly([(4, 4), (28, 4), (27, 20), (16, 30), (5, 20)], "T")
    p.poly([(6, 6), (26, 6), (25, 19), (16, 27), (7, 19)], "U")
    p.poly([(11, 7), (16, 2), (21, 7)], "5")
    p.poly([(11, 23), (16, 29), (21, 23)], "5")
    p.line([(12, 7), (16, 3)], "7")
    p.set(16, 2, "7")
    p.set(16, 29, "7")
    p.ellipse(13, 13, 20, 20, "9")
    p.ellipse(14, 14, 19, 19, "A")
    p.set(16, 16, "B")
    p.bevel()
    p.outline()
    p.poly([(11, 7), (16, 2), (21, 7)], "5")
    p.poly([(11, 23), (16, 29), (21, 23)], "5")
    p.ellipse(13, 13, 20, 20, "9")
    p.ellipse(14, 14, 19, 19, "A")
    p.set(16, 16, "B")
    return p.image()


# ---------------------------------------------------------------- accessories
def chain() -> Px:
    p = Px()
    p.line([(7, 4), (12, 9)], "9")
    p.line([(8, 4), (12, 8)], "A")
    p.line([(24, 4), (19, 9)], "9")
    p.line([(23, 4), (19, 8)], "A")
    return p


def guard_amulet() -> Image.Image:
    p = chain()
    p.poly([(16, 10), (23, 13), (22, 23), (16, 28), (10, 23), (9, 13)], "9")
    p.poly([(16, 12), (21, 14), (20, 22), (16, 26), (12, 22), (11, 14)], "3")
    p.poly([(16, 15), (19, 16), (18, 21), (16, 23), (14, 21), (13, 16)], "4")
    p.set(16, 18, "A")
    p.bevel()
    p.outline()
    p.set(16, 18, "A")
    return p.image()


def ledger_amulet() -> Image.Image:
    p = chain()
    # small book pendant
    p.rect(10, 10, 22, 25, "Q")
    p.rect(11, 11, 21, 24, "R")
    p.rect(11, 11, 12, 24, "S")
    p.line([(14, 14), (20, 14)], "9")
    p.line([(14, 17), (20, 17)], "9")
    p.line([(14, 20), (18, 20)], "9")
    p.set(16, 26, "A")
    p.bevel()
    p.outline()
    p.line([(14, 14), (20, 14)], "9")
    p.line([(14, 17), (20, 17)], "9")
    return p.image()


def serpent_ward() -> Image.Image:
    p = chain()
    # coiled serpent around a fang
    p.ellipse(10, 10, 22, 24, "G")
    p.ellipse(12, 12, 20, 22, "F")
    p.line([(12, 13), (16, 12), (20, 15), (19, 19), (15, 21), (12, 19)], "H")
    p.poly([(16, 22), (18, 28), (14, 28)], "J")
    p.set(17, 13, "E")
    p.set(16, 12, "7")
    p.bevel()
    p.outline()
    p.poly([(16, 22), (18, 28), (14, 28)], "J")
    p.set(17, 13, "E")
    return p.image()


def hero_medal() -> Image.Image:
    p = Px()
    # ribbon
    p.poly([(10, 2), (16, 10), (22, 2), (20, 2), (16, 7), (12, 2)], "D")
    p.poly([(12, 2), (16, 7), (20, 2), (18, 2), (16, 5), (14, 2)], "E")
    # medal
    p.ellipse(7, 9, 25, 27, "9")
    p.ellipse(9, 11, 23, 25, "A")
    # star
    p.line([(16, 12), (16, 24)], "B")
    p.line([(11, 18), (21, 18)], "B")
    p.line([(13, 14), (19, 22)], "9")
    p.line([(19, 14), (13, 22)], "9")
    p.set(16, 18, "7")
    p.bevel()
    p.outline()
    p.ellipse(7, 9, 25, 27, "9")
    p.ellipse(9, 11, 23, 25, "A")
    p.line([(16, 12), (16, 24)], "B")
    p.line([(11, 18), (21, 18)], "B")
    return p.image()


def ring_power() -> Image.Image:
    p = Px()
    # thick gold band with a transparent hole
    for y in range(10, 31):
        for x in range(5, 27):
            dx = (x - 16) / 9.0
            dy = (y - 21) / 7.5
            d = dx * dx + dy * dy
            if 0.52 <= d <= 1.0:
                p.set(x, y, "A" if d > 0.8 else "9")
    # red gem on top
    p.poly([(16, 3), (21, 9), (16, 14), (11, 9)], "9")
    p.poly([(16, 5), (19, 9), (16, 12), (13, 9)], "D")
    p.set(16, 9, "E")
    p.set(14, 7, "7")
    p.bevel()
    p.outline()
    p.poly([(16, 4), (20, 9), (16, 13), (12, 9)], "9")
    p.poly([(16, 6), (18, 9), (16, 11), (14, 9)], "D")
    p.set(16, 9, "E")
    return p.image()


def crown() -> Image.Image:
    p = Px()
    # base band
    p.rect(6, 20, 26, 28, "9")
    p.rect(7, 21, 25, 27, "A")
    p.line([(7, 24), (25, 24)], "8")
    # points
    p.poly([(6, 20), (8, 8), (12, 18)], "9")
    p.poly([(12, 18), (16, 5), (20, 18)], "9")
    p.poly([(20, 18), (24, 8), (26, 20)], "9")
    p.line([(8, 8), (12, 18)], "A")
    p.line([(16, 5), (20, 18)], "A")
    p.line([(24, 8), (20, 18)], "A")
    # jewels
    p.set(10, 22, "D")
    p.set(16, 22, "4")
    p.set(22, 22, "D")
    p.set(16, 17, "E")
    p.bevel()
    p.outline()
    p.rect(8, 21, 24, 27, "A")
    p.set(10, 22, "D")
    p.set(16, 22, "4")
    p.set(22, 22, "D")
    return p.image()


ITEMS = [
    ("aegis", aegis()),
    ("antidote", antidote()),
    ("big_potion", big_potion()),
    ("bone_dagger", bone_dagger()),
    ("chainmail", chainmail()),
    ("cloth_robe", cloth_robe()),
    ("crown", crown()),
    ("dragon_blade", dragon_blade()),
    ("dragon_scale", dragon_scale()),
    ("elixir", elixir()),
    ("frost_blade", frost_blade()),
    ("greater_elixir", greater_elixir()),
    ("guard_amulet", guard_amulet()),
    ("hero_medal", hero_medal()),
    ("ledger_amulet", ledger_amulet()),
    ("mirror_plate", mirror_plate()),
    ("purifying_draught", purifying()),
    ("ring_power", ring_power()),
    ("serpent_ward", serpent_ward()),
    ("spiked_shield", spiked_shield()),
    ("steel_sword", steel_sword()),
    ("trident_precise", trident()),
    ("vampiric_blade", vampiric_blade()),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"items2": [(name, quantize(im)) for name, im in ITEMS]}


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    cols = 8
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
    ap.add_argument("--force", action="store_true", help="перезаписать существующий .aseprite")
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
