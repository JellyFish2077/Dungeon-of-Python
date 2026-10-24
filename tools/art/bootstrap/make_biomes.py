"""Biome tile batch for the PyDungeon art slice.

Replaces the remaining dungeon floors 02–10 with 32x32 wall and floor tiles:
mossy caves, catacombs, sunken crypts, ice, deep ice, demon realm, infernal
forge, obsidian halls and the dragon lair. Each family has six wall and six
floor variants, exactly like floor 01.

Usage:
    python tools/art/bootstrap/make_biomes.py --preview tools/art/_biomes_preview.png
    python tools/art/bootstrap/make_biomes.py --force
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

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

# theme index -> palette. wall = (base, light, dark, mortar),
# floor = (stone, light, dark, grout). Details are applied after the bevel.
THEMES = {
    1: dict(name="Мшистые пещеры", detail="moss",
            wall=("T", "U", "1", "0"), floor=("u", "V", "t", "T")),
    2: dict(name="Забытые катакомбы", detail="bones",
            wall=("Q", "R", "P", "O"), floor=("R", "S", "Q", "P")),
    3: dict(name="Затонувшие склепы", detail="water",
            wall=("2", "3", "1", "0"), floor=("3", "4", "2", "1")),
    4: dict(name="Ледяные залы", detail="ice",
            wall=("3", "4", "2", "1"), floor=("5", "6", "4", "3")),
    5: dict(name="Стылые глубины", detail="ice",
            wall=("2", "3", "1", "0"), floor=("4", "5", "3", "2")),
    6: dict(name="Обитель демонов", detail="ember",
            wall=("P", "Q", "C", "0"), floor=("C", "D", "P", "O")),
    7: dict(name="Кузни преисподней", detail="ember",
            wall=("P", "Q", "0", "O"), floor=("Q", "R", "P", "O")),
    8: dict(name="Обсидиановые чертоги", detail="obsidian",
            wall=("L", "M", "1", "O"), floor=("M", "N", "2", "1")),
    9: dict(name="Логово дракона", detail="gold",
            wall=("P", "Q", "0", "O"), floor=("C", "D", "P", "O")),
}

DEST = {"terrain_%02d" % n: os.path.join("floors", "%02d" % n) for n in range(2, 11)}


def _hash(x: int, y: int, seed: int) -> int:
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


# ---------------------------------------------------------------------- wall
def wall(theme: int, variant: int) -> Image.Image:
    t = THEMES[theme]
    base, light, dark, mortar = t["wall"]
    p = Px()
    p.rect(0, 0, 31, 31, mortar)
    # two large courses; odd variants flip the running bond
    for row in range(2):
        y0 = row * 16
        off = 8 if (row + variant) % 2 else 0
        for x0 in range(-16, 48, 16):
            bx = x0 + off
            for y in range(y0 + 1, y0 + 15):
                for x in range(max(0, bx + 1), min(31, bx + 14) + 1):
                    n = _hash(x // 2, y // 2, 41 + theme * 17 + variant)
                    ch = base
                    if n % 13 == 0:
                        ch = dark
                    elif n % 17 == 0:
                        ch = light
                    p.set(x, y, ch)
            # bevel
            for y in range(y0 + 1, y0 + 15):
                for x in range(max(0, bx + 1), min(31, bx + 14) + 1):
                    if y == y0 + 1 or x == bx + 1:
                        p.set(x, y, light)
                    elif y == y0 + 14 or x == bx + 14:
                        p.set(x, y, dark)
    _wall_detail(p, theme, variant)
    return quantize(p.image())


def _wall_detail(p: Px, theme: int, variant: int) -> None:
    detail = THEMES[theme]["detail"]
    if detail == "moss":
        for k in range(5):
            x = 3 + (_hash(k, theme, 310) % 26)
            y = 20 + (_hash(k, theme, 320) % 10)
            p.set(x, y, "G")
            p.set(x + 1, y, "F")
            p.set(x, y - 1, "F")
    elif detail == "bones":
        for k in range(3):
            x = 4 + (_hash(k, theme, 330) % 24)
            y = 6 + (_hash(k, theme, 340) % 22)
            p.set(x, y, "J")
            p.set(x + 1, y, "I")
            p.set(x + 2, y, "J")
    elif detail == "water":
        for k in range(4):
            x = 2 + (_hash(k, theme, 350) % 28)
            y = 4 + (_hash(k, theme, 360) % 24)
            p.set(x, y, "2")
            p.set(x, y + 1, "3")
            if k % 2:
                p.set(x + 1, y + 1, "4")
    elif detail == "ice":
        for k in range(4):
            x = 3 + (_hash(k, theme, 370) % 25)
            y = 4 + (_hash(k, theme, 380) % 23)
            p.line([(x, y), (x + 3, y + 2), (x + 4, y + 5)], "6")
            p.set(x + 1, y + 1, "7")
    elif detail == "ember":
        for k in range(3):
            x = 4 + (_hash(k, theme, 390) % 23)
            y = 4 + (_hash(k, theme, 400) % 22)
            p.line([(x, y), (x + 1, y + 3), (x, y + 6)], "D")
            p.set(x, y + 1, "9")
    elif detail == "obsidian":
        for k in range(3):
            x = 4 + (_hash(k, theme, 410) % 23)
            y = 4 + (_hash(k, theme, 420) % 22)
            p.line([(x, y), (x + 4, y + 3)], "N")
            p.set(x + 2, y + 1, "6")
    elif detail == "gold":
        for k in range(3):
            x = 5 + (_hash(k, theme, 430) % 21)
            y = 5 + (_hash(k, theme, 440) % 21)
            p.set(x, y, "9")
            p.set(x + 1, y, "A")
            if k % 2:
                p.set(x, y + 1, "8")


# --------------------------------------------------------------------- floor
def floor(theme: int, variant: int) -> Image.Image:
    t = THEMES[theme]
    stone, light, dark, grout = t["floor"]
    im = Image.new("RGBA", (32, 32), rgb(_hex(grout)) + (255,))
    px = im.load()
    seeds = []
    for i in range(5 + variant % 3):
        seeds.append((
            (_hash(i + 1, theme, 510 + variant) % 32) + 0.5,
            (_hash(i + 1, theme, 520 + variant) % 32) + 0.5,
        ))
    cells = [[-1] * 32 for _ in range(32)]
    for y in range(32):
        for x in range(32):
            best, second, best_i = 1e9, 1e9, -1
            for i, (sx, sy) in enumerate(seeds):
                dx = abs(x + 0.5 - sx)
                dy = abs(y + 0.5 - sy)
                dx = min(dx, 32 - dx)
                dy = min(dy, 32 - dy)
                d = dx * dx + dy * dy
                if d < best:
                    second = best
                    best, best_i = d, i
                elif d < second:
                    second = d
            if (second ** 0.5) - (best ** 0.5) < 1.5:
                cells[y][x] = -1
            else:
                cells[y][x] = best_i
                n = _hash(x // 3, y // 3, 530 + theme * 31 + best_i * 7 + variant)
                ch = stone
                if n % 15 == 0:
                    ch = dark
                elif n % 19 == 0:
                    ch = light
                px[x, y] = rgb(_hex(ch)) + (255,)
    # bevel against grout / neighbouring stones
    old = [row[:] for row in cells]
    for y in range(32):
        for x in range(32):
            c = old[y][x]
            if c < 0:
                continue
            up = old[(y - 1) % 32][x]
            down = old[(y + 1) % 32][x]
            left = old[y][(x - 1) % 32]
            right = old[y][(x + 1) % 32]
            if up != c or left != c:
                px[x, y] = rgb(_hex(light)) + (255,)
            elif down != c or right != c:
                px[x, y] = rgb(_hex(dark)) + (255,)
    p = Px()
    p.im = im
    p.map = [[_closest_char(px[x, y][:3]) for x in range(32)] for y in range(32)]
    _floor_detail(p, theme, variant, cells)
    return quantize(im)


def _floor_detail(p: Px, theme: int, variant: int, cells: list[list[int]]) -> None:
    detail = THEMES[theme]["detail"]
    if detail == "moss":
        for k in range(10):
            x = _hash(k, theme, 610) % 32
            y = _hash(k, theme, 620) % 32
            if cells[y][x] >= 0:
                p.set(x, y, "G" if k % 3 else "F")
    elif detail == "bones":
        for k in range(5):
            x = 4 + (_hash(k, theme, 630) % 24)
            y = 4 + (_hash(k, theme, 640) % 24)
            p.set(x, y, "J")
            p.set(x + 1, y, "I")
            p.set(x + 2, y, "J")
    elif detail == "water":
        for k in range(5):
            x = _hash(k, theme, 650) % 30
            y = _hash(k, theme, 660) % 30
            for dx in range(2):
                for dy in range(2):
                    if cells[(y + dy) % 32][(x + dx) % 32] >= 0:
                        p.set((x + dx) % 32, (y + dy) % 32, "2" if k % 2 else "3")
        for k in range(3):
            x = _hash(k, theme, 670) % 30
            y = _hash(k, theme, 680) % 30
            p.set(x, y, "4")
    elif detail == "ice":
        for k in range(4):
            x = 4 + (_hash(k, theme, 690) % 23)
            y = 4 + (_hash(k, theme, 700) % 23)
            p.line([(x, y), (x + 3, y + 2), (x + 2, y + 6)], "6")
            p.set(x + 1, y + 1, "7")
    elif detail == "ember":
        for k in range(3):
            x = 5 + (_hash(k, theme, 710) % 21)
            y = 5 + (_hash(k, theme, 720) % 21)
            p.line([(x, y), (x + 2, y + 3), (x + 1, y + 7)], "D")
            p.set(x + 1, y + 1, "9")
            if k == 0:
                p.set(x + 2, y + 4, "A")
    elif detail == "obsidian":
        for k in range(3):
            x = 5 + (_hash(k, theme, 730) % 21)
            y = 5 + (_hash(k, theme, 740) % 21)
            p.line([(x, y), (x + 5, y + 3), (x + 7, y + 6)], "M")
            p.set(x + 3, y + 2, "N")
    elif detail == "gold":
        for k in range(4):
            x = 4 + (_hash(k, theme, 750) % 24)
            y = 4 + (_hash(k, theme, 760) % 24)
            p.set(x, y, "9")
            p.set(x + 1, y, "A")
            if k % 2:
                p.set(x, y + 1, "8")


def _hex(ch: str) -> str:
    from make_slice import PALETTE
    return PALETTE[ch]


def _closest_char(rgb_value: tuple[int, int, int]) -> str:
    from make_slice import PALETTE
    best, best_d = ".", 1e9
    for ch, h in PALETTE.items():
        if not h:
            continue
        c = rgb(h)
        d = sum((c[i] - rgb_value[i]) ** 2 for i in range(3))
        if d < best_d:
            best, best_d = ch, d
    return best


# ------------------------------------------------------------------- assets
def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    out = {}
    for theme in range(1, 10):
        n = theme + 1
        items = [("wall_%d" % i, wall(theme, i)) for i in range(6)]
        items += [("floor_%d" % i, floor(theme, i)) for i in range(6)]
        out["terrain_%02d" % n] = items
    return out


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    themes = list(range(1, 10))
    sheet = Image.new("RGBA", (len(themes) * cell + 8, 2 * (cell + 20) + 8), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 11)
    except OSError:
        font = ImageFont.load_default()
    short = {1: "пещеры", 2: "катакомбы", 3: "склепы", 4: "лёд", 5: "глубины",
             6: "демоны", 7: "кузни", 8: "обсидиан", 9: "дракон"}
    for i, theme in enumerate(themes):
        family = "terrain_%02d" % (theme + 1)
        items = dict(groups[family])
        for row, kind in enumerate(("wall_0", "floor_0")):
            x = 4 + i * cell
            y = 4 + row * (cell + 20)
            tiled = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
            for ty in range(2):
                for tx in range(2):
                    tiled.alpha_composite(items[kind], (tx * 32, ty * 32))
            sheet.alpha_composite(tiled.resize((cell, cell), Image.NEAREST), (x, y))
            draw.text((x + 2, y + cell + 2), "%d %s" % (theme, short[theme]),
                      fill=(232, 183, 91, 255), font=font)
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
