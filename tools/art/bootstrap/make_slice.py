"""Starter art for the PyDungeon vertical slice.

One-time bootstrap: writes editable `.aseprite` sources into
`tools/art/aseprite/` and the shared palette `tools/art/palette.gpl`.
After that the `.aseprite` files are the source of truth: edit them in Aseprite,
then run `python tools/art/export_aseprite.py`.

Usage:
    python tools/art/bootstrap/make_slice.py --preview tools/art/_slice_preview.png
    python tools/art/bootstrap/make_slice.py --aseprite C:\\tools\\aseprite\\aseprite.exe --force
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    sys.exit("Нужен Pillow: pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ART = os.path.join(ROOT, "tools", "art")
OUT = os.path.join(ART, "aseprite")

# Shared palette. Keep in sync with palette.gpl and STYLE.md.
PALETTE = {
    ".": None,
    "O": "#05070d",  # outline
    "0": "#0a0f1a",
    "1": "#121b2b",
    "2": "#1b2a44",
    "3": "#29405f",
    "4": "#3f5f88",
    "5": "#6e8fb8",
    "6": "#a9c1de",
    "7": "#e8f0fa",
    "8": "#6b4a1e",
    "9": "#b9822f",
    "A": "#e8b75b",
    "B": "#ffe1a0",
    "C": "#4a121b",
    "D": "#8e2233",
    "E": "#d94a50",
    "F": "#102a1b",
    "G": "#2f6b3f",
    "H": "#6fae5a",
    "I": "#6e6653",
    "J": "#b8ae94",
    "K": "#e4dcc4",
    "L": "#291a3b",
    "M": "#553477",
    "N": "#9366b8",
    "P": "#2e2014",
    "Q": "#5c3f27",
    "R": "#8f6642",
    "S": "#b0824c",
    "T": "#2a2f38",
    "U": "#4a525e",
    "V": "#7c8794",
    "t": "#3b424c",
    "u": "#5a6270",
    "W": "#c97a82",
    "X": "#7a8f3a",
    "Y": "#a3b34f",
    "Z": "#3a4a1c",
}

PALETTE_NAMES = {
    "O": "outline", "0": "ink", "1": "navy-deep", "2": "navy-shadow", "3": "navy",
    "4": "steel", "5": "steel-light", "6": "pale-steel", "7": "white",
    "8": "gold-shadow", "9": "gold", "A": "gold-light", "B": "gold-highlight",
    "C": "red-shadow", "D": "red", "E": "red-light",
    "F": "green-shadow", "G": "green", "H": "green-light",
    "I": "bone-shadow", "J": "bone", "K": "bone-light",
    "L": "purple-shadow", "M": "purple", "N": "purple-light",
    "P": "brown-shadow", "Q": "brown", "R": "brown-light", "S": "leather",
    "T": "stone-shadow", "U": "stone", "V": "stone-light", "t": "stone-deep", "u": "stone-mid",
    "W": "pink",
    "X": "olive", "Y": "olive-light", "Z": "olive-shadow",
}

BEVELS = {
    "2": ("1", "3"), "3": ("2", "4"), "4": ("3", "5"), "5": ("4", "6"), "6": ("5", "7"),
    "G": ("F", "H"), "H": ("G", "7"), "X": ("Z", "Y"), "Y": ("X", "H"),
    "J": ("I", "K"), "K": ("J", "7"), "Q": ("P", "R"), "R": ("Q", "S"), "S": ("R", "W"),
    "M": ("L", "N"), "N": ("M", "7"), "T": ("0", "U"), "U": ("T", "V"), "V": ("U", "6"),
    "t": ("T", "U"), "u": ("t", "V"),
    "9": ("8", "A"), "A": ("9", "B"), "D": ("C", "E"), "E": ("D", "7"),
}

SOLID_BG = (11, 17, 32, 255)


def rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgba(ch: str) -> tuple[int, int, int, int] | None:
    hex_color = PALETTE.get(ch)
    if not hex_color:
        return None
    return rgb(hex_color) + (255,)


class Px:
    """Tiny 32x32 pixel canvas with character layers, bevel and outline."""

    def __init__(self) -> None:
        self.im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.im)
        self.map = [["." for _ in range(32)] for _ in range(32)]

    def set(self, x: int, y: int, ch: str) -> None:
        if not (0 <= x < 32 and 0 <= y < 32):
            return
        self.map[y][x] = ch
        c = rgba(ch)
        if c:
            self.im.putpixel((x, y), c)

    def get(self, x: int, y: int) -> str:
        if 0 <= x < 32 and 0 <= y < 32:
            return self.map[y][x]
        return "."

    def rect(self, x0: int, y0: int, x1: int, y1: int, ch: str) -> None:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, ch)

    def ellipse(self, x0: int, y0: int, x1: int, y1: int, ch: str) -> None:
        c = rgba(ch)
        if c:
            self.draw.ellipse([x0, y0, x1, y1], fill=c)
            for y in range(max(0, y0), min(31, y1) + 1):
                for x in range(max(0, x0), min(31, x1) + 1):
                    if self.im.getpixel((x, y))[3] and self.map[y][x] == ".":
                        self.map[y][x] = ch

    def poly(self, points: list[tuple[int, int]], ch: str) -> None:
        c = rgba(ch)
        if not c:
            return
        self.draw.polygon(points, fill=c)
        # map the bounding box
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        for y in range(max(0, min(ys)), min(31, max(ys)) + 1):
            for x in range(max(0, min(xs)), min(31, max(xs)) + 1):
                if self.im.getpixel((x, y))[3]:
                    self.map[y][x] = ch

    def line(self, points: list[tuple[int, int]], ch: str, width: int = 1) -> None:
        c = rgba(ch)
        if not c:
            return
        self.draw.line(points, fill=c, width=width)
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        pad = width + 1
        for y in range(max(0, min(ys) - pad), min(31, max(ys) + pad) + 1):
            for x in range(max(0, min(xs) - pad), min(31, max(xs) + pad) + 1):
                if self.im.getpixel((x, y))[3] and self.map[y][x] == ".":
                    self.map[y][x] = ch

    def _solid(self, x: int, y: int) -> bool:
        return 0 <= x < 32 and 0 <= y < 32 and self.im.getpixel((x, y))[3] > 0

    def bevel(self) -> None:
        old = [row[:] for row in self.map]
        for y in range(32):
            for x in range(32):
                ch = old[y][x]
                if ch not in BEVELS:
                    continue
                dark, light = BEVELS[ch]
                if (not self._solid(x, y + 1)) or (not self._solid(x + 1, y)):
                    self.set(x, y, dark)
                elif (not self._solid(x, y - 1)) or (not self._solid(x - 1, y)):
                    self.set(x, y, light)

    def outline(self, ch: str = "O") -> None:
        old = [row[:] for row in self.map]
        for y in range(32):
            for x in range(32):
                if old[y][x] != ".":
                    continue
                if any(0 <= x + dx < 32 and 0 <= y + dy < 32 and old[y + dy][x + dx] not in (".", "O")
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.set(x, y, ch)

    def mirror(self) -> None:
        """Mirror the left half onto the right half around x=15.5."""
        for y in range(32):
            for x in range(16):
                self.set(31 - x, y, self.get(x, y))

    def image(self) -> Image.Image:
        return self.im


def quantize(im: Image.Image) -> Image.Image:
    """Приводит картинку к общей палитре: Aseprite-исходник и игра видят
    одни и те же цвета, а не десятки случайных оттенков от шума."""
    colors = [(rgb(h), ch) for ch, h in PALETTE.items() if h]
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    src = im.load()
    dst = out.load()
    cache: dict[tuple[int, int, int], tuple[int, int, int, int]] = {}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            if not a:
                continue
            key = (r, g, b)
            if key not in cache:
                best = min(colors, key=lambda c: (c[0][0] - r) ** 2 + (c[0][1] - g) ** 2 + (c[0][2] - b) ** 2)
                cache[key] = best[0] + (255,)
            dst[x, y] = cache[key]
    return out


# ------------------------------------------------------------------ creatures
def player() -> Px:
    p = Px()
    # staff: shaft and crystal
    p.rect(27, 8, 28, 30, "Q")
    p.set(27, 8, "R")
    p.poly([(28, 1), (31, 5), (28, 9), (25, 5)], "A")
    p.poly([(28, 2), (30, 5), (28, 8), (26, 5)], "B")
    p.set(28, 5, "8")
    # cloak silhouette
    p.poly([(10, 15), (22, 15), (26, 28), (23, 29), (6, 29), (8, 22)], "3")
    p.rect(9, 16, 23, 27, "3")
    # shoulders
    p.ellipse(7, 14, 24, 20, "3")
    # hood, with a pointed wizard peak
    p.poly([(16, 1), (12, 7), (20, 7)], "2")
    p.ellipse(9, 4, 22, 18, "2")
    p.poly([(10, 14), (12, 5), (16, 2), (20, 5), (22, 14)], "2")
    # hood rim
    p.line([(16, 2), (12, 7)], "4")
    p.line([(11, 5), (16, 3), (21, 5)], "4")
    # face opening
    p.ellipse(12, 9, 20, 17, "1")
    # face
    p.ellipse(13, 10, 19, 16, "S")
    p.rect(13, 15, 19, 16, "R")
    # eyes
    p.set(15, 12, "O")
    p.set(17, 12, "O")
    p.set(15, 13, "1")
    p.set(17, 13, "1")
    # gold clasp at the hood
    p.rect(15, 17, 17, 18, "9")
    p.set(16, 17, "B")
    # arms: left sleeve, right arm to staff
    p.poly([(8, 16), (11, 17), (10, 23), (7, 22)], "3")
    p.poly([(21, 17), (25, 19), (27, 22), (24, 23), (22, 21)], "3")
    p.rect(25, 21, 27, 23, "S")
    # belt and buckle
    p.rect(10, 21, 22, 22, "9")
    p.rect(10, 22, 22, 22, "8")
    p.rect(14, 20, 18, 23, "A")
    p.rect(15, 21, 17, 22, "B")
    # cloak opening and gold trim
    p.line([(16, 23), (16, 28)], "2")
    p.line([(9, 23), (8, 28)], "9")
    p.line([(23, 23), (24, 28)], "9")
    # boots
    p.rect(10, 28, 14, 30, "2")
    p.rect(18, 28, 22, 30, "2")
    p.rect(10, 30, 14, 30, "1")
    p.rect(18, 30, 22, 30, "1")
    p.bevel()
    p.outline()
    # re-apply details that the bevel/outline may have touched
    p.set(27, 8, "R")
    return p


def slime() -> Px:
    p = Px()
    p.ellipse(4, 13, 27, 29, "G")
    p.ellipse(7, 9, 24, 23, "G")
    # uneven bottom
    p.rect(5, 27, 8, 29, ".")
    p.set(4, 27, ".")
    p.set(5, 28, ".")
    p.ellipse(23, 25, 29, 30, "G")
    # inner glow
    p.ellipse(9, 13, 20, 22, "H")
    p.ellipse(11, 14, 15, 18, "7")
    # eyes
    p.rect(12, 19, 14, 22, "O")
    p.rect(19, 19, 21, 22, "O")
    p.set(13, 20, "E")
    p.set(20, 20, "E")
    p.set(13, 21, "D")
    p.set(20, 21, "D")
    # mouth
    p.line([(14, 25), (16, 26), (18, 25)], "O")
    # drip
    p.ellipse(25, 27, 27, 30, "G")
    p.set(26, 27, "H")
    p.bevel()
    p.outline()
    # keep the eyes crisp on top
    p.rect(12, 19, 14, 22, "O")
    p.rect(19, 19, 21, 22, "O")
    p.set(13, 20, "E")
    p.set(20, 20, "E")
    p.set(13, 21, "D")
    p.set(20, 21, "D")
    return p


def rat() -> Px:
    p = Px()
    # tail
    p.line([(7, 25), (3, 24), (2, 20), (4, 17), (7, 18)], "W")
    p.set(6, 24, "W")
    # body
    p.ellipse(6, 18, 23, 28, "Q")
    # head and snout
    p.ellipse(17, 15, 28, 25, "Q")
    p.poly([(25, 19), (30, 21), (27, 24), (24, 23)], "Q")
    # ears
    p.ellipse(18, 12, 23, 18, "R")
    p.ellipse(19, 14, 22, 17, "W")
    # eye, nose
    p.rect(24, 18, 25, 19, "E")
    p.set(24, 18, "7")
    p.set(29, 22, "W")
    # legs
    p.rect(10, 27, 13, 30, "Q")
    p.rect(18, 27, 21, 30, "Q")
    p.rect(10, 30, 13, 30, "P")
    p.rect(18, 30, 21, 30, "P")
    # belly highlight
    p.ellipse(11, 22, 20, 26, "R")
    # whiskers
    p.set(29, 20, "J")
    p.set(30, 20, "J")
    p.set(29, 23, "J")
    p.bevel()
    p.outline()
    p.rect(24, 18, 25, 19, "E")
    p.set(29, 22, "W")
    return p


def bat() -> Px:
    p = Px()
    # left wing
    p.poly([(15, 13), (9, 8), (2, 10), (5, 15), (2, 21), (8, 20), (12, 25), (15, 20)], "M")
    # mirror to right wing
    p.mirror()
    # body
    p.ellipse(12, 12, 20, 26, "M")
    # ears
    p.poly([(12, 13), (10, 6), (15, 11)], "M")
    p.poly([(19, 13), (21, 6), (16, 11)], "M")
    # inner wing bones
    p.line([(9, 9), (7, 19)], "L")
    p.line([(7, 19), (4, 21)], "L")
    p.line([(22, 9), (24, 19)], "L")
    p.line([(24, 19), (27, 21)], "L")
    # eyes and fangs
    p.rect(13, 16, 14, 17, "E")
    p.rect(18, 16, 19, 17, "E")
    p.set(13, 16, "7")
    p.set(18, 16, "7")
    p.set(15, 21, "7")
    p.set(17, 21, "7")
    p.line([(14, 23), (16, 24), (18, 23)], "L")
    p.bevel()
    p.outline()
    p.rect(13, 16, 14, 17, "E")
    p.rect(18, 16, 19, 17, "E")
    p.set(15, 21, "7")
    p.set(17, 21, "7")
    return p


def skeleton() -> Px:
    p = Px()
    # skull
    p.ellipse(9, 3, 22, 15, "J")
    p.rect(12, 12, 19, 17, "J")
    # jaw shadow
    p.rect(12, 16, 19, 17, "I")
    # eye sockets
    p.rect(12, 7, 15, 11, "O")
    p.rect(17, 7, 20, 11, "O")
    p.set(13, 8, "E")
    p.set(19, 8, "E")
    # nose
    p.poly([(16, 11), (15, 14), (17, 14)], "O")
    # teeth
    p.rect(13, 14, 18, 15, "1")
    p.set(14, 14, "J")
    p.set(16, 14, "J")
    p.set(18, 14, "J")
    # spine and ribs
    p.rect(15, 17, 17, 25, "I")
    for y in (18, 21, 24):
        p.line([(11, y), (21, y)], "J")
        p.line([(11, y + 1), (11, y + 2)], "J")
        p.line([(21, y + 1), (21, y + 2)], "J")
    # arms
    p.line([(10, 18), (7, 22), (8, 25)], "J")
    p.line([(22, 18), (25, 22), (24, 25)], "J")
    # pelvis
    p.ellipse(11, 24, 21, 28, "J")
    p.rect(14, 26, 18, 27, "I")
    # legs
    p.rect(11, 27, 13, 30, "J")
    p.rect(18, 27, 20, 30, "J")
    p.rect(11, 30, 13, 30, "I")
    p.rect(18, 30, 20, 30, "I")
    # skull crack
    p.line([(12, 5), (14, 7), (13, 9)], "I")
    p.bevel()
    p.outline()
    p.rect(12, 7, 15, 11, "O")
    p.rect(17, 7, 20, 11, "O")
    p.set(13, 8, "E")
    p.set(19, 8, "E")
    return p


def goblin() -> Px:
    p = Px()
    # ears
    p.poly([(10, 8), (2, 5), (4, 13), (9, 14)], "X")
    p.poly([(21, 8), (29, 5), (27, 13), (22, 14)], "X")
    # head
    p.ellipse(8, 5, 23, 20, "X")
    # skin light
    p.ellipse(11, 8, 20, 16, "Y")
    # eyes
    p.rect(11, 10, 14, 13, "A")
    p.rect(18, 10, 21, 13, "A")
    p.rect(12, 11, 13, 12, "O")
    p.rect(19, 11, 20, 12, "O")
    # brows
    p.line([(10, 9), (14, 10)], "Z")
    p.line([(21, 9), (17, 10)], "Z")
    # nose and mouth
    p.set(16, 14, "Z")
    p.line([(12, 16), (16, 17), (20, 16)], "O")
    p.rect(14, 17, 18, 17, "1")
    # body / leather vest
    p.poly([(11, 18), (21, 18), (23, 27), (9, 27)], "R")
    p.rect(12, 19, 20, 26, "Q")
    # vest straps
    p.line([(12, 19), (10, 26)], "S")
    p.line([(20, 19), (22, 26)], "S")
    p.rect(15, 22, 17, 23, "A")
    # arms
    p.poly([(9, 18), (6, 20), (6, 24), (10, 23)], "X")
    p.poly([(23, 18), (26, 20), (26, 24), (22, 23)], "X")
    # legs
    p.rect(10, 27, 14, 30, "X")
    p.rect(18, 27, 22, 30, "X")
    p.rect(10, 30, 14, 30, "Z")
    p.rect(18, 30, 22, 30, "Z")
    # dagger
    p.line([(25, 19), (28, 27)], "5", 2)
    p.line([(25, 19), (28, 27)], "4")
    p.rect(24, 22, 28, 23, "9")
    p.rect(26, 24, 27, 26, "Q")
    p.bevel()
    p.outline()
    # keep face details on top
    p.rect(11, 10, 14, 13, "A")
    p.rect(18, 10, 21, 13, "A")
    p.rect(12, 11, 13, 12, "O")
    p.rect(19, 11, 20, 12, "O")
    p.line([(12, 16), (16, 17), (20, 16)], "O")
    return p


# ----------------------------------------------------------------------- items
def short_sword() -> Px:
    p = Px()
    # blade
    p.poly([(9, 23), (23, 8), (26, 11), (12, 26)], "5")
    p.poly([(11, 23), (23, 10), (24, 11), (12, 25)], "6")
    p.line([(23, 8), (26, 11)], "7")
    # guard
    p.line([(7, 23), (13, 29)], "9", 2)
    p.line([(8, 23), (13, 28)], "A")
    # grip
    p.line([(7, 26), (10, 29)], "Q", 2)
    p.line([(7, 27), (9, 29)], "R")
    # pommel
    p.rect(5, 28, 7, 30, "9")
    p.set(6, 29, "B")
    p.bevel()
    p.outline()
    # edge highlight on top
    p.line([(10, 22), (23, 8)], "7")
    return p


def small_potion() -> Px:
    p = Px()
    # flask body
    p.ellipse(9, 11, 23, 28, "6")
    # liquid
    p.ellipse(10, 16, 22, 27, "D")
    p.ellipse(12, 19, 19, 25, "E")
    # neck and rim
    p.rect(13, 5, 19, 12, "6")
    p.rect(12, 5, 20, 6, "9")
    # cork
    p.rect(14, 2, 18, 5, "Q")
    p.rect(14, 2, 18, 3, "R")
    # glass highlight
    p.line([(11, 15), (11, 23)], "7")
    p.line([(12, 14), (13, 16)], "7")
    # outline inner rim
    p.rect(12, 6, 20, 6, "9")
    p.bevel()
    p.outline()
    p.line([(11, 15), (11, 23)], "7")
    p.line([(14, 2), (18, 2)], "R")
    return p


def rusty_sword() -> Px:
    p = Px()
    # pitted blade
    p.poly([(9, 23), (22, 9), (25, 12), (12, 26)], "R")
    p.poly([(11, 23), (22, 11), (23, 12), (12, 25)], "Q")
    # nicks
    p.set(18, 14, ".")
    p.set(19, 13, ".")
    p.set(14, 20, ".")
    p.set(15, 21, ".")
    # edge rust light
    p.line([(10, 22), (22, 10)], "S")
    # guard
    p.line([(7, 23), (13, 29)], "8", 2)
    p.line([(8, 23), (13, 28)], "9")
    # grip
    p.line([(7, 26), (10, 29)], "P", 2)
    p.line([(8, 26), (9, 28)], "Q")
    # pommel
    p.rect(5, 28, 7, 30, "8")
    p.set(6, 29, "9")
    p.bevel()
    p.outline()
    p.line([(10, 22), (22, 10)], "S")
    return p


def leather_armor() -> Px:
    p = Px()
    # torso
    p.poly([(10, 7), (22, 7), (25, 12), (23, 27), (9, 27), (7, 12)], "Q")
    # neck opening
    p.ellipse(13, 5, 19, 10, ".")
    # shoulder pads
    p.ellipse(6, 8, 12, 14, "R")
    p.ellipse(20, 8, 26, 14, "R")
    # straps
    p.line([(11, 9), (9, 26)], "S", 2)
    p.line([(21, 9), (23, 26)], "S", 2)
    # belt
    p.rect(10, 20, 22, 22, "P")
    p.rect(14, 19, 18, 23, "9")
    p.rect(15, 20, 17, 22, "A")
    # stitching
    for y in range(10, 20, 3):
        p.set(12, y, "S")
        p.set(20, y, "S")
    p.bevel()
    p.outline()
    # neck opening on top of outline
    p.ellipse(13, 5, 19, 10, ".")
    p.ellipse(14, 6, 18, 9, "1")
    p.rect(14, 20, 18, 22, "9")
    p.rect(15, 20, 17, 22, "A")
    return p


def lucky_charm() -> Px:
    p = Px()
    # chain
    p.arc = None
    p.line([(8, 5), (12, 9)], "9")
    p.line([(23, 5), (19, 9)], "9")
    p.line([(8, 4), (12, 8)], "A")
    p.line([(23, 4), (19, 8)], "A")
    # four-leaf clover
    p.ellipse(12, 8, 19, 15, "G")
    p.ellipse(8, 12, 15, 19, "G")
    p.ellipse(16, 12, 23, 19, "G")
    p.ellipse(12, 16, 19, 23, "G")
    p.ellipse(13, 9, 17, 13, "H")
    p.ellipse(9, 13, 13, 17, "H")
    p.ellipse(19, 13, 23, 17, "H")
    p.ellipse(13, 17, 17, 21, "H")
    # center and stem
    p.rect(15, 15, 16, 16, "F")
    p.line([(16, 21), (18, 27), (16, 29)], "G")
    # gold loop
    p.rect(15, 3, 17, 5, "9")
    p.set(16, 4, "B")
    p.bevel()
    p.outline()
    # clover highlights on top
    p.rect(15, 10, 16, 11, "H")
    p.rect(10, 14, 11, 15, "H")
    p.rect(20, 14, 21, 15, "H")
    p.rect(15, 18, 16, 19, "H")
    return p


def scout_lens() -> Px:
    p = Px()
    # barrel
    p.line([(8, 27), (24, 9)], "9", 5)
    p.line([(8, 27), (24, 9)], "A", 3)
    p.line([(8, 27), (24, 9)], "8")
    # rings
    p.line([(13, 20), (16, 17)], "8", 6)
    p.line([(20, 13), (23, 10)], "8", 6)
    # eyepiece
    p.rect(5, 26, 10, 30, "Q")
    p.rect(6, 27, 9, 29, "R")
    # lens
    p.ellipse(20, 4, 29, 13, "9")
    p.ellipse(21, 5, 28, 12, "6")
    p.ellipse(22, 6, 26, 10, "5")
    p.set(23, 6, "7")
    p.set(24, 6, "7")
    p.bevel()
    p.outline()
    p.ellipse(21, 5, 28, 12, "6")
    p.ellipse(22, 6, 26, 10, "5")
    p.set(23, 6, "7")
    p.set(24, 6, "7")
    return p


# --------------------------------------------------------------------- object
def chest() -> Px:
    p = Px()
    # body
    p.rect(4, 15, 27, 29, "Q")
    # lid
    p.poly([(4, 16), (6, 9), (25, 9), (27, 16)], "R")
    p.rect(4, 14, 27, 16, "Q")
    # iron bands
    p.rect(7, 9, 9, 29, "U")
    p.rect(22, 9, 24, 29, "U")
    p.rect(7, 9, 7, 29, "T")
    p.rect(22, 9, 22, 29, "T")
    # band studs
    for y in (12, 18, 24):
        p.set(8, y, "V")
        p.set(23, y, "V")
    # lock plate
    p.rect(13, 17, 18, 25, "9")
    p.rect(14, 18, 17, 24, "A")
    p.rect(15, 20, 16, 22, "O")
    p.set(15, 23, "O")
    p.set(16, 23, "O")
    # lid highlight
    p.line([(6, 10), (25, 10)], "S")
    # body plank lines
    p.line([(11, 18), (11, 29)], "P")
    p.line([(20, 18), (20, 29)], "P")
    p.bevel()
    p.outline()
    # lock on top
    p.rect(13, 17, 18, 25, "9")
    p.rect(14, 18, 17, 24, "A")
    p.rect(15, 20, 16, 22, "O")
    p.set(15, 23, "O")
    p.set(16, 23, "O")
    return p


# ---------------------------------------------------------------------- tiles
def _hash(x: int, y: int, seed: int) -> int:
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


def _shade(color: tuple[int, int, int], k: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, round(c * k))) for c in color)


def make_wall(variant: int) -> Image.Image:
    """Dark dungeon masonry: two large courses, staggered joints, cracks, moss.

    The pattern repeats exactly every 32 px horizontally and vertically, so a
    wall of random variants tiles without visible seams.
    """
    im = Image.new("RGBA", (32, 32), rgb("#121b2b") + (255,))
    px = im.load()
    stone = rgb("#343b47")
    light = rgb("#4c5868")
    dark = rgb("#1e242d")
    mortar = rgb("#0e1520")
    for y in range(32):
        row = y // 16
        offset = 8 if row % 2 else 0
        # Odd variants flip the running bond; neighbouring wall tiles then do
        # not line up into one giant grid.
        if variant % 2:
            offset = 8 - offset
        by = y % 16
        for x in range(32):
            bx = (x + offset) % 32
            if by in (0, 1) or bx % 16 in (0, 1):
                px[x, y] = mortar + (255,)
                continue
            n = _hash(x // 3, y // 3, 41 + variant * 7 + row * 3)
            k = 0.86 + (n % 19) / 100.0
            col = _shade(stone, k)
            if by in (2, 3) or bx % 16 in (2, 3):
                col = _shade(light, 0.92 + (n % 8) / 100.0)
            elif by in (14, 15) or bx % 16 in (14, 15):
                col = _shade(dark, 1.0)
            px[x, y] = col + (255,)
    # cracks: short, wandering, inside one block
    for c in range(3):
        x = 3 + (_hash(c, variant, 70) % 26)
        y = 3 + (_hash(c, variant, 90) % 26)
        for step in range(4):
            if 0 <= x < 32 and 0 <= y < 32:
                px[x, y] = _shade(mortar, 0.9) + (255,)
            x += 1 if _hash(x, y, variant + step) % 2 else 0
            y += 1
    # moss / damp at the bottom of some variants
    if variant in (2, 5):
        for x in range(32):
            n = _hash(x, 30, 300 + variant)
            if n % 5 == 0:
                px[x, 30] = rgb("#3a4a1c") + (255,)
                px[x, 29] = rgb("#2f3f1a") + (255,)
    # a single gold fleck in variant 3
    if variant == 3:
        for x, y in ((7, 6), (8, 6), (7, 7)):
            px[x, y] = rgb("#6b4a1e") + (255,)
    return im


def make_floor(variant: int) -> Image.Image:
    """Irregular flagstones via a wrapping Voronoi diagram: no tile seams."""
    seed_count = 5 + (variant % 3)
    seeds = []
    for i in range(seed_count):
        x = (_hash(i + 1, variant, 101) % 32) + 0.5
        y = (_hash(i + 1, variant, 202) % 32) + 0.5
        seeds.append((x, y))
    base = rgb("#5a6270")
    grout = rgb("#3b424c")
    light = rgb("#7c8794")
    dark = rgb("#3b424c")
    im = Image.new("RGBA", (32, 32), grout + (255,))
    px = im.load()
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
            # 1.6 px grout reads as a joint without eating the stones
            if (second ** 0.5) - (best ** 0.5) < 1.6:
                cells[y][x] = -1
            else:
                cells[y][x] = best_i
                n = _hash(x // 3, y // 3, 500 + variant * 17 + best_i * 31)
                px[x, y] = _shade(base, 0.90 + (n % 19) / 100.0) + (255,)
    # bevel each stone against grout or a neighbouring stone
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
                px[x, y] = light + (255,)
            elif down != c or right != c:
                px[x, y] = dark + (255,)
    # cracks and pebbles
    for k in range(3):
        x = 5 + (_hash(k, variant, 610) % 22)
        y = 5 + (_hash(k, variant, 620) % 22)
        for step in range(4):
            if 0 <= x < 32 and 0 <= y < 32 and cells[y][x] >= 0:
                px[x, y] = dark + (255,)
            x += 1
            y += 1 if _hash(x, y, variant + step) % 2 else 0
    for k in range(6):
        x = _hash(k, variant, 710) % 32
        y = _hash(k, variant, 720) % 32
        if cells[y][x] >= 0:
            px[x, y] = _shade(dark, 0.8) + (255,)
    # one damp/mossy variant and one with a gold fleck
    if variant == 4:
        for k in range(8):
            x = _hash(k, variant, 810) % 32
            y = 20 + (_hash(k, variant, 820) % 10)
            if cells[y][x] >= 0:
                px[x, y] = rgb("#3a4a1c") + (255,)
    return im


# ------------------------------------------------------------------- manifest
def assets() -> dict[str, list[tuple[str, Image.Image]]]:
    def q(im: Image.Image) -> Image.Image:
        return quantize(im)

    return {
        "creatures": [
            ("player", q(player().image())),
            ("slime", q(slime().image())),
            ("rat", q(rat().image())),
            ("bat", q(bat().image())),
            ("skeleton", q(skeleton().image())),
            ("goblin", q(goblin().image())),
        ],
        "items": [
            ("short_sword", q(short_sword().image())),
            ("small_potion", q(small_potion().image())),
            ("rusty_sword", q(rusty_sword().image())),
            ("leather_armor", q(leather_armor().image())),
            ("lucky_charm", q(lucky_charm().image())),
            ("scout_lens", q(scout_lens().image())),
        ],
        "objects": [("chest", q(chest().image()))],
        "terrain_01": (
            [("wall_%d" % i, q(make_wall(i))) for i in range(6)]
            + [("floor_%d" % i, q(make_floor(i))) for i in range(6)]
        ),
    }


def preview(groups: dict[str, list[tuple[str, Image.Image]]], path: str) -> None:
    cell = 96
    cols = 6
    rows = (sum(len(v) for v in groups.values()) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell + 16, rows * (cell + 18) + 16), SOLID_BG)
    draw = ImageDraw.Draw(sheet)
    i = 0
    for name, items in groups.items():
        for tag, im in items:
            x = 8 + (i % cols) * cell
            y = 8 + (i // cols) * (cell + 18)
            for cy in range(3):
                for cx in range(3):
                    c = (24, 32, 48) if (cx + cy) % 2 == 0 else (16, 22, 34)
                    draw.rectangle([x + cx * 32, y + cy * 32, x + cx * 32 + 31, y + cy * 32 + 31], fill=c + (255,))
            sheet.alpha_composite(im.resize((cell, cell), Image.NEAREST), (x, y))
            draw.text((x + 2, y + cell + 2), tag, fill=(232, 183, 91, 255))
            i += 1
    sheet.save(path)
    print("preview:", path)


# -------------------------------------------------------------------- Aseprite
def find_aseprite(explicit: str | None) -> str:
    candidates = [
        explicit,
        os.environ.get("ASEPRITE"),
        shutil.which("aseprite"),
        r"C:\tools\aseprite\aseprite.exe",
        os.path.join(os.path.expanduser("~"), "src", "aseprite", "build", "bin", "aseprite.exe"),
        os.path.join(os.environ.get("ProgramFiles", ""), "Aseprite", "Aseprite.exe"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Aseprite", "Aseprite.exe"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    raise SystemExit("Aseprite не найден. Укажите --aseprite PATH или переменную ASEPRITE.")


def lua_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def lua_script(groups: dict[str, list[tuple[str, Image.Image]]]) -> str:
    lines = [
        "local outDir = %s" % lua_str(OUT.replace("\\", "\\\\")),
        "local palette = {}",
    ]
    for ch in PALETTE:
        if PALETTE[ch]:
            r, g, b = rgb(PALETTE[ch])
            lines.append("palette[%s] = Color(%d, %d, %d, 255)" % (lua_str(ch), r, g, b))
    lines += [
        "local function toPixels(s)",
        "  local rows = {}",
        "  for row in string.gmatch(s, '[^\\n]+') do rows[#rows+1] = row end",
        "  return rows",
        "end",
        "",
        "local function makeSprite(fileName, frames)",
        "  local spr = Sprite(32, 32, ColorMode.RGB)",
        "  local layer = spr.layers[1]",
        "  layer.name = 'art'",
        "  local order = {}",
        "  for ch, col in pairs(palette) do order[#order+1] = {ch, col} end",
        "  table.sort(order, function(a,b) return a[1] < b[1] end)",
        "  local pal = Palette(#order)",
        "  for i, item in ipairs(order) do pal:setColor(i - 1, item[2]) end",
        "  spr:setPalette(pal)",
        "  local first = true",
        "  for _, item in ipairs(frames) do",
        "    local f",
        "    if first then f = spr.frames[1]; first = false else f = spr:newEmptyFrame() end",
        "    local cel = spr:newCel(layer, f)",
        "    local img = cel.image",
        "    local rows = toPixels(item.pixels)",
        "    for y = 1, #rows do",
        "      local row = rows[y]",
        "      for x = 1, #row do",
        "        local ch = string.sub(row, x, x)",
        "        local col = palette[ch]",
        "        if col then img:drawPixel(x - 1, y - 1, col) end",
        "      end",
        "    end",
        "  end",
        "  -- Tags are added only after all frames exist: Aseprite extends a tag",
        "  -- that ends on the last frame when a new frame is appended.",
        "  for i, item in ipairs(frames) do",
        "    local tag = spr:newTag(i, i)",
        "    tag.name = item.tag",
        "  end",
        "  local path = outDir .. '\\\\' .. fileName",
        "  spr:saveAs(path)",
        "  print('saved ' .. path)",
        "end",
        "",
    ]
    for family, items in groups.items():
        lines.append("makeSprite(%s, {" % lua_str(family + ".aseprite"))
        for tag, im in items:
            px = im.load()
            rows = []
            for y in range(32):
                chars = []
                for x in range(32):
                    r, g, b, a = px[x, y]
                    if not a:
                        chars.append(".")
                        continue
                    found = "."
                    for ch, hex_color in PALETTE.items():
                        if hex_color and rgb(hex_color) == (r, g, b):
                            found = ch
                            break
                    chars.append(found)
                rows.append("".join(chars))
            lines.append("  { tag = %s, pixels = %s }," % (lua_str(tag), lua_str("\n".join(rows))))
        lines.append("})")
    return "\n".join(lines) + "\n"


def write_palette_gpl(path: str) -> None:
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("GIMP Palette\nName: PyDungeon\nColumns: 8\n#\n")
        for ch, hex_color in PALETTE.items():
            if not hex_color:
                continue
            r, g, b = rgb(hex_color)
            fh.write("%3d %3d %3d\t%s\n" % (r, g, b, PALETTE_NAMES.get(ch, ch)))


def write_manifest(groups: dict[str, list[tuple[str, Image.Image]]], path: str,
                   dest_map: dict[str, str] | None = None) -> None:
    data = {
        "about": "Вертикальный срез графики PyDungeon. Источник — .aseprite в tools/art/aseprite; сборка — python tools/art/export_aseprite.py && python tools/art/build_art.py",
        "style": "тёмное фэнтези, 32x32, контур #05070d, свет сверху-слева, ограниченная палитра",
        "style_guide": "tools/art/STYLE.md",
        "palette": "tools/art/palette.gpl",
        "license": "MIT (оригинальная графика проекта)",
        "canvas": [32, 32],
        "pipeline": {
            "source": "tools/art/aseprite/*.aseprite",
            "export": "python tools/art/export_aseprite.py",
            "build": "python tools/art/build_art.py",
            "check": "python tools/art/export_aseprite.py --check && python tools/art/build_art.py --check",
        },
        "families": {},
    }
    # Семейства добавляются партиями (срез, окружение, …). Не теряем те,
    # что уже описаны в манифесте.
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as fh:
                old = json.load(fh)
            if isinstance(old.get("families"), dict):
                data["families"] = old["families"]
        except (OSError, ValueError):
            pass
    dest = dest_map or {
        "creatures": "creatures",
        "items": "items",
        "objects": "objects",
        "terrain_01": "floors/01",
    }
    for family, items in groups.items():
        data["families"][family] = {
            "source": "tools/art/aseprite/%s.aseprite" % family,
            "destination": "tools/art/src_custom/" + dest[family],
            "assets": [{"tag": tag, "file": tag + ".png", "size": [32, 32], "status": "in-game review"} for tag, _ in items],
        }
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


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

    write_palette_gpl(os.path.join(ART, "palette.gpl"))
    write_manifest(groups, os.path.join(ART, "asset-manifest.json"))

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
