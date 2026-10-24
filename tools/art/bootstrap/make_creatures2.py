"""Second creature batch: the remaining 16 dungeon inhabitants.

All sprites are 32x32, transparent, with a 1px outline and the same light
direction as the first six. Saved as `creatures2.aseprite`; export_aseprite.py
writes them into `src_custom/creatures/` next to the first batch.

Usage:
    python tools/art/bootstrap/make_creatures2.py --preview tools/art/_creatures2_preview.png
    python tools/art/bootstrap/make_creatures2.py --force
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

DEST = {"creatures2": "creatures"}


# -------------------------------------------------------------------- spider
def spider() -> Image.Image:
    p = Px()
    # eight jointed legs
    for side in (-1, 1):
        for k in range(4):
            x0 = 16 + side * 2
            y0 = 15 + k * 3
            x1 = 16 + side * (9 + k)
            y1 = 11 + k * 4
            x2 = 16 + side * (14 + (k % 2))
            y2 = 17 + k * 3
            p.line([(x0, y0), (x1, y1), (x2, y2)], "L")
            p.set(x1, y1, "M")
    # abdomen and head
    p.ellipse(11, 14, 21, 27, "M")
    p.ellipse(13, 8, 20, 16, "M")
    p.ellipse(13, 17, 19, 23, "N")
    # eyes and fangs
    p.rect(14, 10, 15, 11, "E")
    p.rect(18, 10, 19, 11, "E")
    p.set(13, 13, "E")
    p.set(20, 13, "E")
    p.line([(14, 15), (14, 17)], "J")
    p.line([(19, 15), (19, 17)], "J")
    # hourglass marking
    p.poly([(14, 19), (17, 23), (20, 19), (17, 21)], "D")
    p.bevel()
    p.outline()
    for x, y in ((14, 10), (18, 10), (13, 13), (20, 13)):
        p.set(x, y, "E")
    return p.image()


# ----------------------------------------------------------------------- orc
def orc() -> Image.Image:
    p = Px()
    # ears
    p.poly([(9, 8), (3, 5), (5, 13)], "X")
    p.poly([(22, 8), (28, 5), (26, 13)], "X")
    # head
    p.ellipse(8, 5, 23, 18, "X")
    p.ellipse(10, 8, 21, 16, "Y")
    # tusks
    p.rect(12, 14, 13, 17, "K")
    p.rect(18, 14, 19, 17, "K")
    p.set(12, 17, "I")
    p.set(19, 17, "I")
    # eyes and brow
    p.rect(11, 10, 14, 12, "A")
    p.rect(17, 10, 20, 12, "A")
    p.rect(12, 11, 13, 12, "O")
    p.rect(18, 11, 19, 12, "O")
    p.line([(10, 9), (14, 10)], "Z")
    p.line([(21, 9), (17, 10)], "Z")
    # body and shoulders
    p.poly([(9, 18), (22, 18), (24, 28), (7, 28)], "Q")
    p.rect(9, 19, 22, 27, "Q")
    p.rect(6, 17, 10, 22, "T")
    p.rect(22, 17, 26, 22, "T")
    p.line([(6, 17), (10, 17)], "U")
    p.line([(22, 17), (26, 17)], "U")
    # arms
    p.poly([(7, 20), (4, 23), (6, 27), (9, 25)], "X")
    p.poly([(24, 20), (27, 23), (25, 27), (22, 25)], "X")
    # belt
    p.rect(9, 22, 22, 23, "P")
    p.rect(14, 22, 17, 24, "9")
    # axe
    p.line([(26, 10), (26, 29)], "Q", 2)
    p.poly([(24, 10), (29, 8), (29, 16), (24, 14)], "5")
    p.line([(25, 9), (28, 9)], "7")
    p.line([(24, 14), (29, 16)], "6")
    p.bevel()
    p.outline()
    # keep the axe blade bright over the outline
    p.poly([(24, 10), (29, 8), (29, 16), (24, 14)], "5")
    p.line([(25, 9), (28, 9)], "7")
    return p.image()


# --------------------------------------------------------------------- troll
def troll() -> Image.Image:
    p = Px()
    # head
    p.ellipse(9, 3, 23, 15, "F")
    p.ellipse(11, 6, 21, 14, "G")
    # eyes
    p.rect(12, 8, 14, 10, "A")
    p.rect(18, 8, 20, 10, "A")
    p.rect(13, 9, 14, 10, "O")
    p.rect(18, 9, 19, 10, "O")
    # mouth and tusk
    p.line([(13, 12), (16, 13), (19, 12)], "Z")
    p.set(12, 13, "K")
    p.set(20, 13, "K")
    # massive body
    p.poly([(8, 15), (22, 15), (26, 29), (6, 29)], "G")
    p.ellipse(10, 17, 22, 26, "H")
    p.ellipse(12, 19, 20, 25, "Y")
    # long arms
    p.poly([(7, 17), (2, 20), (3, 27), (8, 25)], "G")
    p.poly([(23, 17), (28, 20), (27, 27), (22, 25)], "G")
    p.rect(2, 25, 5, 28, "H")
    p.rect(26, 25, 29, 28, "H")
    # club
    p.line([(25, 8), (25, 28)], "Q", 2)
    p.ellipse(22, 4, 29, 12, "Q")
    p.ellipse(23, 5, 28, 10, "R")
    p.set(24, 7, "T")
    p.set(27, 9, "T")
    # belt
    p.rect(9, 25, 22, 26, "P")
    p.bevel()
    p.outline()
    p.ellipse(22, 4, 29, 12, "Q")
    p.ellipse(23, 5, 28, 10, "R")
    return p.image()


# --------------------------------------------------------------------- ghost
def ghost() -> Image.Image:
    p = Px()
    # tattered wraith
    p.poly([(16, 2), (9, 6), (8, 14), (5, 22), (7, 28), (11, 25),
            (14, 30), (16, 26), (18, 30), (21, 25), (25, 28), (27, 22),
            (24, 14), (23, 6)], "3")
    p.poly([(16, 5), (11, 8), (10, 15), (8, 21), (10, 25), (13, 23),
            (16, 26), (19, 23), (22, 25), (24, 21), (22, 15), (21, 8)], "4")
    # hood shadow and eyes
    p.ellipse(11, 5, 21, 15, "2")
    p.rect(13, 9, 15, 12, "O")
    p.rect(17, 9, 19, 12, "O")
    p.set(14, 10, "7")
    p.set(18, 10, "7")
    # mouth and highlights
    p.line([(14, 14), (16, 15), (18, 14)], "1")
    p.line([(10, 18), (8, 23)], "5")
    p.line([(22, 18), (24, 23)], "5")
    p.bevel()
    p.outline()
    p.rect(13, 9, 15, 12, "O")
    p.rect(17, 9, 19, 12, "O")
    p.set(14, 10, "7")
    p.set(18, 10, "7")
    return p.image()


# ---------------------------------------------------------------------- wolf
def wolf() -> Image.Image:
    p = Px()
    # tail
    p.line([(7, 22), (3, 18), (2, 14)], "U")
    p.line([(7, 23), (4, 20), (3, 16)], "T")
    # body
    p.ellipse(6, 16, 23, 28, "T")
    p.ellipse(8, 18, 21, 26, "U")
    # head
    p.ellipse(19, 11, 30, 23, "U")
    p.poly([(26, 18), (31, 20), (28, 24), (24, 22)], "U")
    # ears
    p.poly([(20, 12), (19, 6), (24, 11)], "T")
    p.poly([(26, 11), (29, 5), (30, 13)], "T")
    p.set(21, 11, "V")
    p.set(28, 11, "V")
    # eye, nose, fangs
    p.rect(25, 16, 26, 17, "E")
    p.set(25, 16, "7")
    p.set(30, 20, "P")
    p.set(27, 22, "7")
    p.line([(25, 23), (28, 22)], "P")
    # legs
    p.rect(9, 27, 12, 30, "T")
    p.rect(18, 27, 21, 30, "T")
    p.rect(9, 30, 12, 30, "P")
    p.rect(18, 30, 21, 30, "P")
    # belly
    p.ellipse(10, 22, 20, 26, "V")
    p.bevel()
    p.outline()
    p.rect(25, 16, 26, 17, "E")
    p.set(25, 16, "7")
    return p.image()


# -------------------------------------------------------------------- zombie
def zombie() -> Image.Image:
    p = Px()
    # legs
    p.rect(10, 26, 14, 30, "T")
    p.rect(18, 26, 22, 30, "T")
    p.rect(10, 30, 14, 30, "P")
    p.rect(18, 30, 22, 30, "P")
    # torn tunic
    p.poly([(9, 15), (23, 15), (24, 26), (21, 24), (18, 27), (15, 24), (12, 27), (8, 26)], "Q")
    p.poly([(11, 16), (21, 16), (22, 24), (18, 22), (15, 25), (12, 22), (10, 24)], "P")
    # arms reaching forward
    p.poly([(9, 16), (4, 19), (3, 23), (8, 23)], "G")
    p.poly([(23, 16), (28, 19), (29, 23), (24, 23)], "G")
    p.rect(2, 22, 6, 25, "H")
    p.rect(26, 22, 30, 25, "H")
    # head, tilted
    p.ellipse(10, 4, 22, 16, "G")
    p.ellipse(12, 6, 20, 14, "H")
    p.rect(12, 13, 20, 15, "F")
    # eyes and jaw
    p.rect(12, 9, 14, 11, "O")
    p.rect(18, 9, 20, 11, "O")
    p.set(13, 9, "E")
    p.set(19, 9, "E")
    p.line([(12, 14), (20, 14)], "O")
    p.set(14, 14, "J")
    p.set(17, 14, "J")
    # exposed bone
    p.line([(20, 18), (22, 22)], "J")
    p.line([(21, 18), (23, 22)], "I")
    p.bevel()
    p.outline()
    p.rect(12, 9, 14, 11, "O")
    p.rect(18, 9, 20, 11, "O")
    return p.image()


# --------------------------------------------------------------------- golem
def golem() -> Image.Image:
    p = Px()
    # blocky body
    p.rect(8, 12, 24, 29, "T")
    p.rect(9, 13, 23, 28, "U")
    # head
    p.rect(11, 4, 21, 12, "U")
    p.rect(12, 5, 20, 11, "V")
    # arms
    p.rect(3, 13, 8, 26, "T")
    p.rect(24, 13, 29, 26, "T")
    p.rect(4, 14, 7, 25, "U")
    p.rect(25, 14, 28, 25, "U")
    # legs
    p.rect(9, 27, 14, 30, "T")
    p.rect(18, 27, 23, 30, "T")
    # eyes and core
    p.rect(13, 7, 15, 9, "A")
    p.rect(17, 7, 19, 9, "A")
    p.set(14, 8, "B")
    p.set(18, 8, "B")
    p.poly([(16, 15), (20, 19), (16, 23), (12, 19)], "A")
    p.poly([(16, 17), (18, 19), (16, 21), (14, 19)], "B")
    # runes
    p.set(10, 18, "9")
    p.set(22, 21, "9")
    p.line([(10, 24), (13, 24)], "9")
    p.line([(19, 26), (22, 26)], "9")
    p.bevel()
    p.outline()
    p.poly([(16, 16), (19, 19), (16, 22), (13, 19)], "A")
    p.poly([(16, 17), (18, 19), (16, 21), (14, 19)], "B")
    return p.image()


# --------------------------------------------------------------------- demon
def demon() -> Image.Image:
    p = Px()
    # horns
    p.poly([(10, 7), (5, 1), (8, 10)], "J")
    p.poly([(22, 7), (27, 1), (24, 10)], "J")
    p.line([(6, 2), (9, 7)], "K")
    p.line([(26, 2), (23, 7)], "K")
    # head
    p.ellipse(9, 4, 23, 16, "D")
    p.ellipse(11, 6, 21, 14, "E")
    # eyes
    p.rect(12, 8, 15, 10, "A")
    p.rect(17, 8, 20, 10, "A")
    p.set(13, 9, "O")
    p.set(18, 9, "O")
    # mouth and fangs
    p.line([(12, 13), (16, 14), (20, 13)], "O")
    p.set(13, 13, "7")
    p.set(19, 13, "7")
    # body
    p.poly([(9, 16), (23, 16), (25, 28), (7, 28)], "C")
    p.rect(10, 17, 22, 27, "D")
    # chest ridge
    p.line([(16, 17), (16, 26)], "C")
    # arms and claws
    p.poly([(8, 17), (4, 20), (5, 26), (9, 24)], "C")
    p.poly([(24, 17), (28, 20), (27, 26), (23, 24)], "C")
    p.rect(3, 25, 6, 27, "J")
    p.rect(26, 25, 29, 27, "J")
    # tail
    p.line([(16, 28), (20, 31), (25, 30)], "C")
    p.set(26, 29, "D")
    # belt
    p.rect(10, 23, 22, 24, "P")
    p.rect(15, 23, 18, 25, "9")
    p.bevel()
    p.outline()
    p.rect(12, 8, 15, 10, "A")
    p.rect(17, 8, 20, 10, "A")
    p.set(13, 9, "O")
    p.set(18, 9, "O")
    return p.image()


# ---------------------------------------------------------------- minotaur
def minotaur() -> Image.Image:
    p = Px()
    # horns
    p.line([(9, 7), (4, 4), (2, 8)], "J", 2)
    p.line([(23, 7), (28, 4), (30, 8)], "J", 2)
    p.set(3, 5, "K")
    p.set(29, 5, "K")
    # bull head
    p.ellipse(9, 4, 23, 17, "Q")
    p.ellipse(11, 6, 21, 15, "R")
    # muzzle
    p.ellipse(12, 11, 20, 18, "S")
    p.set(14, 14, "P")
    p.set(18, 14, "P")
    # eyes
    p.rect(11, 8, 14, 10, "A")
    p.rect(18, 8, 21, 10, "A")
    p.set(12, 9, "O")
    p.set(19, 9, "O")
    # body
    p.poly([(8, 18), (24, 18), (26, 29), (6, 29)], "Q")
    p.ellipse(10, 19, 22, 27, "R")
    # arms
    p.poly([(7, 18), (3, 21), (4, 27), (8, 25)], "R")
    p.poly([(25, 18), (29, 21), (28, 27), (24, 25)], "R")
    # axe
    p.line([(27, 10), (27, 29)], "Q", 2)
    p.poly([(25, 10), (31, 8), (31, 16), (25, 14)], "5")
    p.line([(26, 9), (30, 9)], "7")
    # belt
    p.rect(10, 24, 22, 25, "P")
    p.bevel()
    p.outline()
    p.poly([(25, 10), (31, 8), (31, 16), (25, 14)], "5")
    p.line([(26, 9), (30, 9)], "7")
    return p.image()


# ------------------------------------------------------------------- vampire
def vampire() -> Image.Image:
    p = Px()
    # cape
    p.poly([(16, 12), (7, 16), (4, 29), (28, 29), (25, 16)], "1")
    p.poly([(16, 14), (9, 18), (7, 28), (25, 28), (23, 18)], "2")
    p.line([(8, 17), (6, 28)], "C")
    p.line([(24, 17), (26, 28)], "C")
    # body
    p.poly([(12, 14), (20, 14), (22, 27), (10, 27)], "P")
    p.rect(13, 15, 19, 26, "Q")
    # collar
    p.poly([(11, 14), (16, 18), (21, 14)], "C")
    # head
    p.ellipse(11, 4, 21, 15, "J")
    p.ellipse(12, 5, 20, 13, "K")
    # hair
    p.rect(10, 3, 22, 6, "P")
    p.line([(10, 6), (12, 11)], "P")
    p.line([(22, 6), (20, 11)], "P")
    # eyes and fangs
    p.rect(13, 8, 15, 10, "E")
    p.rect(17, 8, 19, 10, "E")
    p.line([(13, 12), (19, 12)], "C")
    p.set(14, 13, "7")
    p.set(18, 13, "7")
    p.bevel()
    p.outline()
    p.rect(13, 8, 15, 10, "E")
    p.rect(17, 8, 19, 10, "E")
    p.set(14, 13, "7")
    p.set(18, 13, "7")
    return p.image()


# ---------------------------------------------------------------------- lich
def lich() -> Image.Image:
    p = Px()
    # robe
    p.poly([(16, 12), (8, 17), (6, 29), (26, 29), (24, 17)], "L")
    p.poly([(16, 15), (10, 19), (9, 28), (23, 28), (22, 19)], "M")
    # skull
    p.ellipse(11, 3, 21, 14, "J")
    p.ellipse(12, 4, 20, 13, "K")
    p.rect(13, 7, 15, 10, "O")
    p.rect(17, 7, 19, 10, "O")
    p.set(14, 8, "E")
    p.set(18, 8, "E")
    p.line([(14, 12), (18, 12)], "I")
    p.set(15, 12, "J")
    p.set(17, 12, "J")
    # crown
    p.rect(11, 1, 21, 3, "9")
    p.set(12, 0, "A")
    p.set(16, 0, "B")
    p.set(20, 0, "A")
    # staff
    p.line([(27, 6), (27, 30)], "Q", 2)
    p.ellipse(24, 3, 30, 9, "F")
    p.ellipse(25, 4, 29, 8, "G")
    p.set(27, 5, "H")
    # bone hand
    p.set(24, 18, "J")
    p.set(25, 19, "J")
    p.bevel()
    p.outline()
    p.ellipse(24, 3, 30, 9, "F")
    p.ellipse(25, 4, 29, 8, "G")
    p.set(27, 5, "H")
    return p.image()


# --------------------------------------------------------------------- dragon
def dragon() -> Image.Image:
    p = Px()
    # wings
    p.poly([(14, 12), (2, 6), (4, 14), (1, 20), (10, 18), (14, 22)], "P")
    p.poly([(18, 12), (30, 6), (28, 14), (31, 20), (22, 18), (18, 22)], "P")
    p.line([(13, 13), (5, 10), (3, 17)], "Q")
    p.line([(19, 13), (27, 10), (29, 17)], "Q")
    # body
    p.ellipse(10, 15, 23, 29, "C")
    p.ellipse(12, 17, 21, 27, "D")
    # neck and head
    p.poly([(18, 16), (22, 8), (27, 6), (29, 12), (24, 15), (22, 19)], "D")
    p.ellipse(23, 4, 30, 12, "D")
    p.poly([(27, 5), (31, 7), (29, 11), (26, 10)], "E")
    # horns
    p.line([(24, 4), (21, 1)], "J")
    p.line([(27, 3), (26, 0)], "J")
    # eye
    p.rect(26, 6, 27, 7, "A")
    p.set(27, 6, "B")
    # legs and tail
    p.rect(10, 26, 14, 30, "C")
    p.rect(18, 26, 22, 30, "C")
    p.line([(10, 28), (4, 31), (1, 29)], "C", 2)
    p.set(2, 30, "D")
    # belly scales
    p.line([(13, 20), (20, 20)], "A")
    p.line([(13, 23), (20, 23)], "A")
    p.bevel()
    p.outline()
    p.rect(26, 6, 27, 7, "A")
    p.set(27, 6, "B")
    return p.image()


# --------------------------------------------------------------------- trader
def trader() -> Image.Image:
    p = Px()
    # backpack
    p.rect(22, 12, 29, 27, "P")
    p.rect(23, 13, 28, 26, "Q")
    p.line([(23, 16), (28, 16)], "R")
    p.line([(23, 22), (28, 22)], "R")
    # legs
    p.rect(11, 26, 14, 30, "T")
    p.rect(18, 26, 21, 30, "T")
    p.rect(11, 30, 14, 30, "P")
    p.rect(18, 30, 21, 30, "P")
    # tunic
    p.poly([(10, 14), (22, 14), (24, 27), (8, 27)], "4")
    p.rect(11, 15, 21, 26, "4")
    p.rect(10, 21, 22, 22, "Q")
    p.rect(15, 21, 17, 23, "9")
    # arms
    p.poly([(9, 15), (5, 18), (6, 23), (10, 22)], "4")
    p.poly([(22, 15), (26, 18), (25, 23), (21, 22)], "4")
    p.rect(5, 22, 7, 24, "S")
    p.rect(24, 22, 26, 24, "S")
    # head and cap
    p.ellipse(11, 4, 21, 15, "S")
    p.rect(11, 12, 21, 14, "R")
    p.rect(10, 3, 22, 6, "Q")
    p.rect(11, 2, 21, 4, "R")
    p.set(14, 9, "O")
    p.set(18, 9, "O")
    p.set(15, 12, "R")
    p.set(16, 12, "W")
    p.set(17, 12, "R")
    # gold pouch
    p.ellipse(24, 24, 29, 29, "9")
    p.set(26, 25, "B")
    p.bevel()
    p.outline()
    p.ellipse(24, 24, 29, 29, "9")
    p.set(26, 25, "B")
    return p.image()


# --------------------------------------------------------------------- priest
def priest() -> Image.Image:
    p = Px()
    # robe
    p.poly([(16, 11), (8, 16), (6, 29), (26, 29), (24, 16)], "V")
    p.poly([(16, 14), (10, 18), (9, 28), (23, 28), (22, 18)], "6")
    p.line([(9, 18), (7, 28)], "9")
    p.line([(23, 18), (25, 28)], "9")
    # hood
    p.ellipse(10, 2, 22, 15, "7")
    p.ellipse(12, 4, 20, 13, "6")
    p.ellipse(13, 7, 19, 13, "S")
    p.set(14, 9, "O")
    p.set(18, 9, "O")
    p.set(16, 12, "R")
    # collar
    p.line([(12, 14), (16, 17), (20, 14)], "9")
    # staff with sun symbol
    p.line([(27, 7), (27, 30)], "Q", 2)
    p.ellipse(24, 3, 30, 9, "9")
    p.ellipse(25, 4, 29, 8, "A")
    p.line([(27, 3), (27, 9)], "B")
    p.line([(24, 6), (30, 6)], "B")
    p.bevel()
    p.outline()
    p.ellipse(24, 3, 30, 9, "9")
    p.ellipse(25, 4, 29, 8, "A")
    p.line([(27, 3), (27, 9)], "B")
    p.line([(24, 6), (30, 6)], "B")
    return p.image()


# ---------------------------------------------------------------- necromancer
def necromancer() -> Image.Image:
    p = Px()
    # robe
    p.poly([(16, 10), (8, 16), (6, 29), (26, 29), (24, 16)], "L")
    p.poly([(16, 13), (10, 18), (9, 28), (23, 28), (22, 18)], "M")
    p.line([(9, 18), (7, 28)], "N")
    p.line([(23, 18), (25, 28)], "N")
    # hood
    p.ellipse(10, 2, 22, 15, "L")
    p.ellipse(12, 4, 20, 14, "M")
    p.ellipse(13, 6, 19, 13, "1")
    # skull face
    p.rect(14, 8, 15, 10, "J")
    p.rect(17, 8, 18, 10, "J")
    p.rect(14, 9, 15, 10, "E")
    p.rect(17, 9, 18, 10, "E")
    p.rect(14, 12, 18, 13, "I")
    # staff with green orb
    p.line([(27, 7), (27, 30)], "Q", 2)
    p.ellipse(24, 3, 30, 9, "F")
    p.ellipse(25, 4, 29, 8, "G")
    p.set(27, 5, "H")
    p.bevel()
    p.outline()
    p.ellipse(24, 3, 30, 9, "F")
    p.ellipse(25, 4, 29, 8, "G")
    p.set(27, 5, "H")
    return p.image()


# ------------------------------------------------------------------ shieldman
def shieldman() -> Image.Image:
    p = Px()
    # legs
    p.rect(11, 26, 14, 30, "T")
    p.rect(18, 26, 21, 30, "T")
    p.rect(11, 30, 14, 30, "P")
    p.rect(18, 30, 21, 30, "P")
    # body armor
    p.poly([(10, 13), (22, 13), (24, 27), (8, 27)], "T")
    p.rect(11, 14, 21, 26, "U")
    p.line([(16, 14), (16, 26)], "T")
    # shoulders
    p.rect(7, 13, 11, 18, "U")
    p.rect(21, 13, 25, 18, "U")
    # helmet
    p.ellipse(11, 3, 21, 14, "U")
    p.rect(12, 4, 20, 12, "V")
    p.rect(13, 8, 19, 10, "1")
    p.rect(14, 8, 15, 9, "E")
    p.rect(17, 8, 18, 9, "E")
    p.line([(16, 3), (16, 12)], "T")
    # shield
    p.poly([(3, 12), (11, 14), (11, 27), (7, 30), (3, 27)], "2")
    p.poly([(4, 14), (10, 16), (10, 26), (7, 28), (4, 26)], "3")
    p.ellipse(4, 18, 10, 24, "4")
    p.ellipse(6, 20, 8, 22, "A")
    # sword
    p.line([(25, 10), (25, 28)], "Q", 2)
    p.line([(24, 10), (24, 26)], "5")
    p.line([(24, 26), (24, 10)], "6")
    p.rect(23, 26, 26, 27, "9")
    p.bevel()
    p.outline()
    # shield boss and sword edge over the outline
    p.ellipse(4, 18, 10, 24, "4")
    p.ellipse(6, 20, 8, 22, "A")
    p.line([(24, 26), (24, 10)], "6")
    return p.image()


CREATURES = [
    ("spider", spider()),
    ("orc", orc()),
    ("troll", troll()),
    ("ghost", ghost()),
    ("wolf", wolf()),
    ("zombie", zombie()),
    ("golem", golem()),
    ("demon", demon()),
    ("minotaur", minotaur()),
    ("vampire", vampire()),
    ("lich", lich()),
    ("dragon", dragon()),
    ("trader", trader()),
    ("priest", priest()),
    ("necromancer", necromancer()),
    ("shieldman", shieldman()),
]


def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    return {"creatures2": [(name, quantize(im)) for name, im in CREATURES]}


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
