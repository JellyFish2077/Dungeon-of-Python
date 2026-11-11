"""Enemy state badges for the dungeon map: calm, alert, search.

Every icon is a 32x32 transparent badge with a 1 px outline and a symbol
that stays readable above an enemy on the map. Source of truth is
`tools/art/aseprite/states.aseprite`; this script only bootstraps it.

Usage:
    python tools/art/bootstrap/make_states.py --preview tools/art/_states_preview.png
    python tools/art/bootstrap/make_states.py --force
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

DEST = {"states": "states"}


def badge(rim: str) -> Px:
    """Dark round badge with a 1 px outline, a soft rim and a tinted ring."""
    p = Px()
    p.ellipse(1, 1, 30, 30, "O")
    p.ellipse(2, 2, 29, 29, "0")
    p.line([(7, 9), (9, 7)], "1")
    # Цветное кольцо у края: три состояния различаются не только знаком,
    # но и цветом — на карте значок висит близко к клетке врага.
    cx = cy = 15.5
    for y in range(32):
        for x in range(32):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if 11.8 ** 2 <= d2 <= 12.9 ** 2:
                p.set(x, y, rim)
    return p


def calm() -> Px:
    p = badge("3")
    # Три точки: враг занят своим делом и героя не заметил.
    for x in (9, 14, 19):
        p.rect(x, 14, x + 3, 17, "4")
        p.rect(x, 16, x + 3, 17, "3")
    return p


def alert() -> Px:
    p = badge("D")
    # Восклицательный знак с сужением к низу: силуэт читается даже в 16 px.
    p.rect(13, 7, 18, 15, "D")
    p.rect(14, 16, 17, 18, "D")
    p.rect(15, 19, 16, 20, "D")
    p.rect(13, 7, 14, 15, "E")
    p.rect(14, 16, 15, 18, "E")
    p.rect(13, 24, 18, 28, "D")
    p.rect(13, 24, 14, 28, "E")
    return p


def search() -> Px:
    p = badge("9")
    # Вопросительный знак: верхняя дуга, короткий хвост и точка.
    p.rect(10, 7, 21, 10, "9")
    p.rect(19, 10, 22, 15, "9")
    p.rect(14, 12, 19, 15, "9")
    p.rect(15, 15, 18, 19, "9")
    p.rect(10, 7, 21, 8, "A")
    p.rect(10, 9, 11, 10, "A")
    p.rect(20, 10, 21, 12, "A")
    p.rect(14, 15, 15, 19, "A")
    p.rect(15, 24, 18, 27, "9")
    p.rect(15, 24, 18, 25, "A")
    return p


ICONS = [
    ("calm", calm),
    ("alert", alert),
    ("search", search),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"states": [(name, quantize(maker().image())) for name, maker in ICONS]}


def preview(groups, path: str) -> None:
    items = groups["states"]
    cell = 128
    sheet = Image.new("RGBA", (cell * len(items) + 16, cell + 32), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        x0 = 8 + i * cell
        draw.rectangle([x0, 8, x0 + cell - 8, cell], fill=(24, 32, 48, 255))
        sheet.alpha_composite(im.resize((96, 96), Image.NEAREST), (x0 + 16, 20))
        draw.text((x0 + 16, cell + 8), name, fill=(169, 193, 222, 255))
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
    target = os.path.join(OUT, "states.aseprite")
    if os.path.exists(target) and not args.force:
        print("states.aseprite уже есть — правьте его в Aseprite. Перезаписать: --force")
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
