#!/usr/bin/env python3
"""Сборка графики подземелья: tools/art/src → static/sprites.js и static/terrain.js.

Запуск из корня проекта:
    python tools/art/build_art.py            собрать и записать
    python tools/art/build_art.py --check    только проверить, что файлы игры
                                             совпадают с исходниками
    python tools/art/build_art.py --sheet листы.png   лист тайлов после обработки

Нужен Pillow (pip install pillow) — только для сборки; игре и серверу он не нужен.

Исходники — PNG 32×32 в tools/art/src, по папкам: существа, предметы, этажи,
вода, лава, декор, лестницы, ловушки, двери. Параметры и происхождение каждой
картинки — в tools/art/art.json. В файлах игры заменяется только блок между
метками <art:...>; код вокруг него сборка не трогает.

Что делает обработка (числа — в art.json):
  * стены каждого этажа темнее и спокойнее, пол ровный и светлее стен: проход
    читается сразу, а насыщенные стены не спорят с героем и монстрами;
  * декор на полу и вода приведены к тому же тону; лава не меняется — это
    опасность, она должна оставаться самой яркой;
  * у существ тёмный контур в один пиксель — их видно на любом полу;
  * мантия героя синяя: красный в игре — цвет врагов.
"""
import argparse
import base64
import colorsys
import io
import json
import os
import re
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    sys.exit("Нужен Pillow: pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "tools", "art")
SRC = os.path.join(ART, "src")
# Оверрайды вертикального среза: PNG, экспортированные из .aseprite.
# Файл с тем же относительным путём перекрывает исходник из src/.
CUSTOM = os.path.join(ART, "src_custom")
STATIC = os.path.join(ROOT, "static")

DECOR_ORDER = ["grass", "moss", "bones", "crystal", "rubble", "lamp", "mushroom", "pike", "fire"]
TRAP_ORDER = ["spikes", "pit", "net", "gas", "blade", "magical"]
WAVE_ORDER = ["E", "N", "S", "W"]


# ---------------------------------------------------------------- картинки
def load(rel):
    for root in (CUSTOM, SRC):
        path = os.path.join(root, *rel.split("/"))
        if os.path.isfile(path):
            return Image.open(path).convert("RGBA")
    raise FileNotFoundError(os.path.join(SRC, *rel.split("/")))


def has_custom(rel):
    return os.path.isfile(os.path.join(CUSTOM, *rel.split("/")))


def source_files(folder):
    """Все PNG в папке из обоих слоёв, без дублей (custom перекрывает src)."""
    names = set()
    for root in (SRC, CUSTOM):
        path = os.path.join(root, *folder.split("/"))
        if os.path.isdir(path):
            names.update(n for n in os.listdir(path) if n.lower().endswith(".png"))
    return sorted(names)


def numbered(folder, prefix=""):
    """Файлы prefix_0.png, prefix_1.png … (или 0.png, 1.png …) по порядку номеров."""
    pattern = (re.escape(prefix) + "_" if prefix else "") + r"(\d+)\.png"
    found = []
    for name in source_files(folder):
        m = re.fullmatch(pattern, name)
        if m:
            found.append((int(m.group(1)), folder + "/" + name))
    return [rel for _, rel in sorted(found)]


def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def pixels(im):
    return im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()


def luma_stats(images):
    """Средняя яркость и её разброс (насколько заметен рисунок текстуры)."""
    vals = [luma(r, g, b) / 255 for im in images for r, g, b, a in pixels(im) if a]
    if not vals:
        return 0.0, 0.0
    mean = sum(vals) / len(vals)
    return mean, (sum((v - mean) ** 2 for v in vals) / len(vals)) ** 0.5


def mean_luma(images):
    return luma_stats(images)[0]


def tone_group(images, p):
    """Тон группы картинок (стены этажа, пол этажа, декор): средняя яркость →
    p["target"], разброс → p["texture"] (рисунок одинаково заметен на всех
    этажах), насыщенность × p["saturation"]."""
    mean, std = luma_stats(images)
    contrast = max(0.4, min(2.5, p["texture"] / std)) if std > 1e-4 else 1.0
    return [tone(im, mean, p["target"], contrast, p["saturation"]) for im in images]


def tone(im, mean, target, contrast, saturation):
    """Сдвигает яркость к target (сохраняя рисунок с силой contrast) и
    приглушает цвет до saturation. Оттенок не меняется.

    Яркость сдвигается сложением, а не умножением: тёмно-красный пол при
    умножении вспыхивал бы чистым красным, а так он светлеет к серому."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            r, g, b = r / 255, g / 255, b / 255
            y0 = luma(r, g, b)
            r, g, b = (y0 + (c - y0) * saturation for c in (r, g, b))
            y1 = min(0.98, max(0.02, target + (y0 - mean) * contrast))
            r, g, b = (c + (y1 - y0) for c in (r, g, b))
            px[x, y] = tuple(max(0, min(255, round(c * 255))) for c in (r, g, b)) + (a,)
    return out


def outline(im, color):
    """Тёмный контур в один пиксель вокруг силуэта (по четырём соседям)."""
    w, h = im.size
    src = im.load()
    solid = [[src[x, y][3] >= 128 for x in range(w)] for y in range(h)]
    out = im.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            if solid[y][x]:
                continue
            if any(0 <= x + dx < w and 0 <= y + dy < h and solid[y + dy][x + dx]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = color + (255,)
    return out


def recolor_hero(im, hue_from, min_sat, shift):
    """Красное в мантии героя → синее: красный в игре означает врага."""
    lo, hi = hue_from[1], hue_from[0]
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > min_sat and (hh < lo or hh > hi):
                rr, gg, bb = colorsys.hsv_to_rgb((hh + shift) % 1.0, s * 0.95, min(1, v * 1.08))
                px[x, y] = (round(rr * 255), round(gg * 255), round(bb * 255), a)
    return out


# ------------------------------------------------------- деревня
# Деревню рисуем своими силами, без чужих тайлов: в наборе DCSS нет ни
# черепицы, ни бочек. Зато участок, которого нет, здесь — регулярная
# геометрия (ряды пластин, обручи бочки), и её честно рисует скрипт в той же
# палитре, что и остальная игра. Стиль поэтому не рассыпается, а лицензия не
# меняется: всё, что не взято из набора, нарисовано здесь.

def rng(seed):
    """Свой генератор случайных чисел: сборка обязана повторяться побайтово,
    иначе --check будет ругаться на каждый запуск. Поэтому никакого random и
    никакого hash() — только явное зерно."""
    state = (seed * 2654435761 + 1013904223) & 0xFFFFFFFF

    def nxt():
        nonlocal state
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF
        return state / 0x7FFFFFFF

    return nxt


def hsv(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0.0, min(1.0, s)), max(0.0, min(1.0, v)))
    return (round(r * 255), round(g * 255), round(b * 255))


def image_difference(a, b):
    """Сколько пикселей различаются. Для окна это и есть мера «его видно»:
    средняя яркость не годится — кладка сама пёстрая, и окно тонет в её
    разбросе, хотя глазом оно читается сразу."""
    pa, pb = a.load(), b.load()
    n = 0
    for y in range(a.height):
        for x in range(a.width):
            if pa[x, y] != pb[x, y]:
                n += 1
    return n


def luma_of(im):
    vals = [luma(r, g, b) / 255 for r, g, b, a in pixels(im) if a]
    return sum(vals) / len(vals) if vals else 0.0


def recolor_range(im, span, target_hue, min_sat=0.25):
    """Перекрашивает пиксели, чей оттенок попал в span, в target_hue, сохраняя
    насыщенность и яркость. Так из одного спрайта получаются разные жители:
    меняется цвет кафтана, а лицо, волосы и штаны остаются как были."""
    lo, hi = span
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s >= min_sat and lo <= hh <= hi:
                px[x, y] = hsv(target_hue, s, v) + (a,)
    return out


def make_roof(hue, kind, seed, sat=0.30, base=0.40):
    """Черепица: ряды перекрывающихся пластин со сдвигом через ряд.
    kind: "ridge" — конёк с гребнем, "slope" — скат, "eave" — свес с тенью
    под кромкой. Ряды темнеют книзу, поэтому крыша читается сверху вниз."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    rnd = rng(seed)
    row = 8
    for i, y0 in enumerate(range(0, 32, row)):
        depth = max(0.55, 1.0 - i * 0.12)
        offset = 0 if i % 2 == 0 else row // 2
        for x0 in range(-row, 32 + row, row):
            x = x0 + offset
            v = (base + (rnd() - 0.5) * 0.06) * depth
            draw.rectangle([x, y0, x + row - 1, y0 + row - 1],
                           fill=hsv(hue, sat, v) + (255,))
            # блик по верхнему краю пластины и тень по нижнему — отсюда объём
            draw.line([x, y0, x + row - 1, y0],
                      fill=hsv(hue, sat * 0.6, min(0.95, v + 0.15)) + (255,))
            draw.line([x, y0 + row - 1, x + row - 1, y0 + row - 1],
                      fill=hsv(hue, sat * 0.8, max(0.05, v - 0.13)) + (255,))
            draw.line([x, y0, x, y0 + row - 1],
                      fill=hsv(hue, sat * 0.8, max(0.05, v - 0.09)) + (255,))
    if kind == "ridge":
        draw.rectangle([0, 0, 31, 3], fill=hsv(hue, sat * 0.85, max(0.05, base - 0.13)) + (255,))
        draw.line([0, 4, 31, 4], fill=hsv(hue, sat * 0.5, min(0.95, base + 0.20)) + (255,))
    elif kind == "eave":
        # Тень под свесом: крыша «нависает» над фасадом.
        for y in range(25, 32):
            alpha = int(30 + (y - 25) * 22)
            draw.rectangle([0, y, 31, y], fill=(0, 0, 0, alpha))
        draw.line([0, 25, 31, 25], fill=hsv(hue, sat * 0.8, max(0.05, base - 0.16)) + (255,))
    return im


def make_window(wall, pane_hue=0.11):
    """Окно: в кладке прорезан проём с тонкой рамой и тёплым стеклом — дом
    сразу читается как жилой, а не как сарай без проёмов. Стекло занимает
    почти весь проём: широкая тёмная рама съедала свет, и окно выходило
    темнее самой стены (проверка сборки это и поймала)."""
    im = wall.copy()
    draw = ImageDraw.Draw(im)
    x0, y0, x1, y1 = 7, 7, 24, 22
    draw.rectangle([x0, y0, x1, y1], fill=(30, 21, 12, 255))
    draw.rectangle([x0 + 1, y0 + 1, x1 - 1, y1 - 1], fill=hsv(pane_hue, 0.62, 0.82) + (255,))
    mx, my = (x0 + x1) // 2, (y0 + y1) // 2
    draw.line([mx, y0 + 1, mx, y1 - 1], fill=(38, 26, 14, 255))
    draw.line([x0 + 1, my, x1 - 1, my], fill=(38, 26, 14, 255))
    # Блик по верхней кромке стекла: окно «блестит» на солнце.
    draw.line([x0 + 1, y0 + 2, x1 - 1, y0 + 2], fill=hsv(pane_hue, 0.30, 0.95) + (255,))
    return im


def make_barrel(seed):
    """Бочка: клёпки и обручи. В наборе её нет, а двор без мелочи пустой."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    body = hsv(0.07, 0.40, 0.44)
    draw.rounded_rectangle([8, 6, 23, 27], radius=5, fill=body + (255,))
    for y in (11, 17, 23):
        draw.line([8, y, 23, y], fill=(74, 76, 84, 255))
    draw.line([10, 7, 10, 26], fill=hsv(0.07, 0.30, 0.54) + (255,))
    draw.line([21, 7, 21, 26], fill=hsv(0.07, 0.48, 0.30) + (255,))
    draw.ellipse([9, 5, 22, 10], fill=hsv(0.07, 0.34, 0.52) + (255,))
    draw.ellipse([11, 6, 20, 9], fill=hsv(0.07, 0.28, 0.40) + (255,))
    return im


def make_woodpile(seed):
    """Поленница: штабель кругляшей — двор становится обжитым."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    rnd = rng(seed)
    for row, y in enumerate((9, 15, 21)):
        for x in range(5 + row * 2, 28 - row * 2, 7):
            v = 0.28 + rnd() * 0.20
            draw.ellipse([x, y, x + 6, y + 6], fill=hsv(0.07, 0.46, v) + (255,))
            draw.ellipse([x + 2, y + 2, x + 4, y + 4], fill=hsv(0.06, 0.30, min(0.9, v + 0.22)) + (255,))
    return im


def make_chimney():
    """Труба: её ставят на крышу, и дом перестаёт быть плоским прямоугольником."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw.rectangle([9, 8, 22, 26], fill=hsv(0.04, 0.24, 0.34) + (255,))
    for y in (12, 16, 20):
        draw.line([9, y, 22, y], fill=hsv(0.04, 0.20, 0.26) + (255,))
    draw.rectangle([7, 5, 24, 10], fill=hsv(0.04, 0.22, 0.44) + (255,))
    draw.rectangle([9, 6, 22, 9], fill=(22, 18, 14, 255))
    return im


def make_fence(seed):
    """Забор: столбы с двумя перекладинами. Схематичный значок из icons.js
    рядом с настоящими тайлами выглядел заплаткой, поэтому забор рисуем
    здесь же — форма простая и в палитре проекта."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    rnd = rng(seed)
    wood = hsv(0.09, 0.38, 0.46)
    wood_dark = hsv(0.09, 0.42, 0.30)
    wood_lite = hsv(0.09, 0.26, 0.58)
    for y in (13, 21):
        draw.rectangle([2, y, 30, y + 3], fill=wood + (255,))
        draw.line([2, y, 30, y], fill=wood_lite + (255,))
        draw.line([2, y + 3, 30, y + 3], fill=wood_dark + (255,))
        for x in range(4, 30):
            if rnd() < 0.12:
                draw.point((x, y + 1), fill=wood_dark + (255,))
    for x in (6, 16, 26):
        draw.rectangle([x, 8, x + 3, 27], fill=wood + (255,))
        draw.line([x, 10, x, 27], fill=wood_lite + (255,))
        draw.line([x + 3, 10, x + 3, 27], fill=wood_dark + (255,))
        draw.polygon([(x - 1, 9), (x + 2, 5), (x + 5, 9)], fill=wood + (255,))
        draw.line([(x - 1, 9), (x + 2, 5)], fill=wood_lite + (255,))
    return im


def build_village(manifest, report):
    """Материалы деревни: кастомные PNG из src_custom/village, иначе —
    прежние сгенерированные стены, окна, крыши и двор."""
    v = manifest["village"]
    pal = v["palette"]
    if has_custom("village/wall.png"):
        wall = load("village/wall.png")
    else:
        wall = tone_group([load(v["wall_source"])], pal["wall"])[0]
    if has_custom("village/window.png"):
        window = load("village/window.png")
    else:
        window = make_window(wall, v["pane_hue"])
    roofs = {}
    for i, name in enumerate(v["roofs"]):
        roofs[name] = {}
        for n, kind in enumerate(("ridge", "slope", "eave")):
            rel = "village/roof_%s_%s.png" % (name, kind)
            if has_custom(rel):
                ims = [load(rel)]
            else:
                ims = [make_roof(v["roof_hues"][name], kind, seed=700 + i * 10 + n)]
            roofs[name][kind] = [png_uri(im) for im in ims]
    makers = {
        "barrel": lambda: make_barrel(seed=41),
        "woodpile": lambda: make_woodpile(seed=42),
        "chimney": make_chimney,
        "fence": lambda: make_fence(seed=43),
    }
    objects = {}
    for name, maker in makers.items():
        rel = "village/%s.png" % name
        objects[name] = png_uri(load(rel) if has_custom(rel) else maker())
    # Жители: один базовый спрайт, разные кафтаны. В срезе база — свой
    # крестьянин из village/npc_base.png, иначе берём прежнего торговца.
    sprites = {}
    base_rel = "village/npc_base.png" if has_custom("village/npc_base.png") else v["npc_source"]
    base = load(base_rel)
    oc = hex_rgb(manifest["outline"]["color"])
    for key, hue in v["npcs"].items():
        sprites["npc_" + key] = png_uri(outline(recolor_range(base, v["tunic_span"], hue), oc))
    # Числа для проверок: крыша обязана быть темнее фасада, иначе дом
    # выглядит плоским пятном, а окно — заметно отличаться от стены.
    roof_meta = {}
    for name in v["roofs"]:
        rel = "village/roof_%s_slope.png" % name
        roof_meta[name] = luma_of(load(rel) if has_custom(rel) else make_roof(v["roof_hues"][name], "slope", 1))
    meta = {"wall": luma_of(wall), "window_diff": image_difference(window, wall), "roof": roof_meta}
    ground = [png_uri(load("village/ground_%d.png" % i)) for i in range(4)
              if has_custom("village/ground_%d.png" % i)]
    interior = {}
    for kind, count in (("wall", 2), ("floor", 4)):
        pics = []
        for i in range(count):
            rel = "village/%s_%d.png" % (kind, i)
            if has_custom(rel):
                pics.append(png_uri(load(rel)))
        interior[kind] = pics
    return {"wall": [png_uri(wall)], "window": [png_uri(window)], "roofs": roofs,
            "objects": objects, "ground": ground, "interior": interior}, sprites, meta


def png_uri(im):
    """PNG в data-URI. До 256 цветов — точная палитра с прозрачностью:
    втрое меньше, чем RGBA, и без потерь."""
    colors = im.getcolors(256)
    buf = io.BytesIO()
    if colors is not None:
        order = sorted(c for _, c in colors)
        index = {c: i for i, c in enumerate(order)}
        pal = Image.new("P", im.size)
        pal.putpalette([v for c in order for v in c], rawmode="RGBA")
        pal.putdata([index[c] for c in pixels(im)])
        pal.save(buf, format="PNG", optimize=True)
    else:
        im.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def hex_rgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


# ---------------------------------------------------------------- сборка
def palette_for(manifest, floor_no, part):
    base = dict(manifest["palette"][part])
    base.update(manifest["palette"].get("by_floor", {}).get(str(floor_no), {}).get(part, {}))
    return base


def build(manifest):
    report = []
    # Существа: контур всем, герою — синяя мантия.
    hero = manifest["hero"]
    oc = hex_rgb(manifest["outline"]["color"])
    sprites = {}
    recolors = manifest.get("creature_recolors", {})
    for key in manifest["creatures"]:
        # Вид без своего рисунка берётся из готового спрайта и перекрашивается:
        # так у нового врага есть лицо, а не серый прямоугольник.
        rec = recolors.get(key)
        im = load("creatures/%s.png" % (rec["from"] if rec else key))
        if rec:
            im = recolor_range(im, rec["span"], rec["hue"])
        if key == hero["key"]:
            im = recolor_hero(im, hero["hue_from"], hero["min_saturation"], hero["hue_shift"])
        if key not in manifest["outline"].get("except", []):
            im = outline(im, oc)
        sprites[key] = png_uri(im)

    items = {}
    for name in source_files("items"):
        items[name[:-4]] = png_uri(load("items/" + name))

    # Этажи: стены и пол каждого этажа — к своим целевым тонам.
    floors = []
    dirs = set()
    for root in (SRC, CUSTOM):
        path = os.path.join(root, "floors")
        if os.path.isdir(path):
            dirs.update(d for d in os.listdir(path) if d.isdigit())
    floor_dirs = sorted(dirs)
    for d in floor_dirs:
        no = int(d)
        walls = [load(r) for r in numbered("floors/" + d, "wall")]
        grounds = [load(r) for r in numbered("floors/" + d, "floor")]
        mw, mf = mean_luma(walls), mean_luma(grounds)
        walls = tone_group(walls, palette_for(manifest, no, "wall"))
        grounds = tone_group(grounds, palette_for(manifest, no, "floor"))
        after_w, after_f = mean_luma(walls), mean_luma(grounds)
        report.append((no, mw, mf, after_w, after_f))
        floors.append({"wall": [png_uri(im) for im in walls], "floor": [png_uri(im) for im in grounds]})

    # Вода и декор пола общие для всех этажей — один тон на всех.
    pwat, pdec = manifest["palette"]["water"], manifest["palette"]["decor"]
    base = tone_group([load(r) for r in numbered("water", "base")], pwat)
    water = {"base": [png_uri(im) for im in base],
             # Волны — белые штрихи поверх воды: их не трогаем.
             "waves": {d: [png_uri(load(r)) for r in numbered("water", "wave_" + d)] for d in WAVE_ORDER}}
    lava = [png_uri(load(r)) for r in numbered("lava")]
    flat = {"grass", "moss", "bones", "crystal"}          # лежат на полу и красят клетку
    decor = {}
    for n in DECOR_ORDER:
        rels = numbered("decor", n)
        if n in flat:
            # У каждого вида свой разброс, но общий тон: трава, мох и кристаллы
            # ложатся на пол любого этажа одинаково спокойно.
            decor[n] = [png_uri(im) for im in tone_group([load(r) for r in rels], pdec)]
        else:
            # Предметы (колонны, фонтан, грибы, колья, огонь) рисуются своим
            # приглушённым слоем — см. .tile.has-obj в game.css.
            decor[n] = [png_uri(load(r)) for r in rels]
    stairs = {d: [png_uri(load(r)) for r in numbered("stairs", d)] for d in ("down", "up")}
    traps = {t: png_uri(load("traps/%s.png" % t)) for t in TRAP_ORDER}
    doors = [png_uri(load(r)) for r in numbered("doors")]
    objects = {"chest": png_uri(load("objects/chest.png"))}
    if has_custom("objects/portal.png"):
        objects["portal"] = png_uri(load("objects/portal.png"))
    for key in ("ore", "rubble", "lever", "sign", "lootBag",
                "table", "chair", "bed", "shelf", "crate", "anvil",
                "fireplace", "workbench", "cauldron", "counter"):
        if has_custom("objects/%s.png" % key):
            objects[key] = png_uri(load("objects/%s.png" % key))
    # Дерево — не «предмет» подземелья, но иконка деревни. Кладётся в тот же
    # словарь, чтобы terrain.js мог взять её через TERRAIN_ICONS.tree.
    if has_custom("village/tree.png"):
        objects["tree"] = png_uri(load("village/tree.png"))
    # Деревня: материалы зданий и двор (генерируются) плюс спрайты жителей.
    village, npc_sprites, village_meta = build_village(manifest, report)
    sprites.update(npc_sprites)
    return {"sprites": sprites, "items": items, "floors": floors, "water": water, "lava": lava,
            "decor": decor, "stairs": stairs, "traps": traps, "doors": doors, "objects": objects,
            "village": village, "village_meta": village_meta}, report


# ---------------------------------------------------------------- вывод в JS
def js_str(s):
    return '"' + s + '"'


def js_list(items, indent):
    pad = " " * indent
    return "[\n" + ",\n".join(pad + "  " + js_str(s) for s in items) + "\n" + pad + "]"


def js_map(d, indent=0, order=None):
    pad = " " * indent
    keys = order or list(d.keys())
    rows = []
    for k in keys:
        v = d[k]
        if isinstance(v, str):
            rows.append(pad + "  " + k + ": " + js_str(v))
        elif isinstance(v, list):
            rows.append(pad + "  " + k + ": " + js_list(v, indent + 2))
        else:
            rows.append(pad + "  " + k + ": " + js_map(v, indent + 2))
    return "{\n" + ",\n".join(rows) + "\n" + pad + "}"


SPRITES_HEAD = """// СОБРАНО tools/art/build_art.py — правьте картинки в tools/art/src,
// tools/art/src_custom (вертикальный срез из Aseprite) и параметры в
// tools/art/art.json, а не этот блок: следующая сборка его перезапишет.
// Вертикальный срез — оригинальная графика проекта (Aseprite, MIT).
// Остальные картинки — Dungeon Crawl Stone Soup (rltiles, CC0), кадр 32×32,
// вшиты как data-URI: отдельных файлов в static не нужно.
"""

TERRAIN_HEAD = """// СОБРАНО tools/art/build_art.py — правьте картинки в tools/art/src,
// tools/art/src_custom (вертикальный срез из Aseprite) и параметры в
// tools/art/art.json, а не этот блок: следующая сборка его перезапишет.
// Вертикальный срез — оригинальная графика проекта (Aseprite, MIT).
// Остальные тайлы — Dungeon Crawl Stone Soup (rltiles, CC0), кадр 32×32:
// 10 этажей (стены и пол уже приведены к тону этажа), вода с кадрами волн,
// лава, декор, лестницы, ловушки, двери и сундук. Внешних файлов нет: всё data-URI.
"""


def sprites_block(art):
    return (SPRITES_HEAD +
            "const SPRITES = " + js_map(art["sprites"]) + ";\n\n"
            "// Предметы: у каждой вещи своя картинка, ключ — id из items.js.\n"
            "const ITEM_SPRITES = " + js_map(art["items"]) + ";\n")


def terrain_block(art):
    floors = "[\n" + ",\n".join(
        "  { wall: " + js_list(f["wall"], 2) + ", floor: " + js_list(f["floor"], 2) + " }"
        for f in art["floors"]) + "\n]"
    return (TERRAIN_HEAD +
            "const TERRAIN_FLOORS = " + floors + ";\n\n"
            "const TERRAIN_WATER = " + js_map(art["water"]) + ";\n\n"
            "const TERRAIN_LAVA = " + js_list(art["lava"], 0) + ";\n\n"
            "const TERRAIN_DECOR = " + js_map(art["decor"], order=DECOR_ORDER) + ";\n\n"
            "const TERRAIN_STAIRS = " + js_map(art["stairs"]) + ";\n\n"
            "const TERRAIN_TRAPS = " + js_map(art["traps"], order=TRAP_ORDER) + ";\n\n"
            "const TERRAIN_DOORS = " + js_list(art["doors"], 0) + ";\n\n"
            "// Объекты карты: сундук.\n"
            "const TERRAIN_OBJECTS = " + js_map(art["objects"]) + ";\n\n"
            "// Деревня: стена дома из набора, окно, крыши по цветам дома и двор.\n"
            "// Крыши и предметы двора нарисованы сборкой — см. build_village().\n"
            "const TERRAIN_VILLAGE = " + js_map(art["village"]) + ";\n")


def splice(path, tag, block):
    """Подставляет block между // <art:tag> и // </art:tag>, сохраняя
    окончания строк файла (часть файлов проекта — CRLF)."""
    raw = open(path, "rb").read().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    start, end = "// <art:%s>\n" % tag, "// </art:%s>\n" % tag
    i, j = text.find(start), text.find(end)
    if i < 0 or j < i:
        sys.exit("%s: нет меток %s … %s" % (path, start.strip(), end.strip()))
    new = text[:i + len(start)] + block + text[j:]
    if crlf:
        new = new.replace("\n", "\r\n")
    return raw, new


def check_custom():
    """Оверрайды должны быть 32×32 RGBA: иначе build_art молча вставит
    картинку другого размера, и карта поедет."""
    errors = []
    if not os.path.isdir(CUSTOM):
        return errors
    for dirpath, _, files in os.walk(CUSTOM):
        for name in sorted(files):
            if not name.lower().endswith(".png"):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, CUSTOM).replace("\\", "/")
            with Image.open(path) as im:
                if im.size != (32, 32):
                    errors.append("src_custom/%s: %dx%d вместо 32×32" % (rel, *im.size))
                if im.mode not in ("RGBA", "P"):
                    errors.append("src_custom/%s: режим %s, нужен RGBA" % (rel, im.mode))
    return errors


def check_rules(art, report):
    errors = check_custom()
    for no, mw, mf, aw, af in report:
        if af - aw < 0.1:
            errors.append("этаж %d: пол (%.2f) не светлее стен (%.2f) хотя бы на 0.1" % (no, af, aw))
    items_js = open(os.path.join(STATIC, "items.js"), encoding="utf-8").read()
    ids = re.findall(r'\{\s*id:\s*"([a-z0-9_]+)",[^\n]*slot:', items_js)
    missing = [i for i in ids if i not in art["items"]]
    if missing:
        errors.append("нет картинок предметов: " + ", ".join(missing))
    game_js = open(os.path.join(STATIC, "game.js"), encoding="utf-8").read()
    enemies = re.findall(r'\{\s*key:\s*"([a-z_]+)",\s*name:\s*"[^"]*",\s*color:', game_js)
    lost = [k for k in enemies + ["player", "trader"] if k not in art["sprites"]]
    if lost:
        errors.append("нет спрайтов существ: " + ", ".join(lost))
    # Деревня: все цвета крыш на месте, крыша темнее фасада, окно отличается
    # от стены, у каждого жителя свой спрайт.
    meta = art.get("village_meta", {})
    v_js = open(os.path.join(STATIC, "village-content.js"), encoding="utf-8").read()
    need_roofs = re.findall(r'roof:\s*"([a-z]+)"', v_js)
    for name in sorted(set(need_roofs)):
        if name not in art["village"]["roofs"]:
            errors.append("нет крыши цвета «%s»" % name)
    for name, kinds in art["village"]["roofs"].items():
        for kind in ("ridge", "slope", "eave"):
            pics = kinds.get(kind)
            if (not isinstance(pics, list) or not pics
                    or not isinstance(pics[0], str) or not pics[0].startswith("data:image/png")):
                errors.append("крыша «%s»: %s — не список картинок (рендер ждёт список)" % (name, kind))
    for name, l in meta.get("roof", {}).items():
        if l >= meta.get("wall", 0):
            errors.append("крыша «%s» (%.2f) не темнее фасада (%.2f)" % (name, l, meta.get("wall", 0)))
    if meta.get("window_diff", 0) < 200:
        errors.append("окно почти не отличается от стены: изменено %d пикселей из 1024"
                      % meta.get("window_diff", 0))
    npcs = re.findall(r'key:\s*"([a-z]+)",\s*name:\s*"[^"]*",\s*place:', v_js)
    for key in npcs:
        if "npc_" + key not in art["sprites"]:
            errors.append("нет спрайта жителя: npc_" + key)
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="только проверить, что файлы игры собраны из исходников")
    ap.add_argument("--sheet", metavar="PNG", help="сохранить лист тайлов этажей после обработки")
    args = ap.parse_args()

    manifest = json.load(open(os.path.join(ART, "art.json"), encoding="utf-8"))
    art, report = build(manifest)
    for no, mw, mf, aw, af in report:
        print("этаж %2d: стены %.2f → %.2f, пол %.2f → %.2f" % (no, mw, aw, mf, af))
    errors = check_rules(art, report)

    targets = [(os.path.join(STATIC, "sprites.js"), "sprites", sprites_block(art)),
               (os.path.join(STATIC, "terrain.js"), "terrain", terrain_block(art))]
    stale = []
    for path, tag, block in targets:
        old, new = splice(path, tag, block)
        if old != new:
            stale.append(path)
            if not args.check and not errors:
                with open(path, "wb") as fh:
                    fh.write(new.encode("utf-8"))
    if args.sheet:
        sheet(art, args.sheet)
    if errors:
        print("\nОШИБКИ:\n - " + "\n - ".join(errors))
        return 1
    if args.check:
        if stale:
            print("\nУстарели (пересоберите): " + ", ".join(os.path.relpath(p, ROOT) for p in stale))
            return 1
        print("\nФайлы игры совпадают с исходниками.")
        return 0
    print("\nЗаписано: " + (", ".join(os.path.relpath(p, ROOT) for p in stale) or "ничего не изменилось"))
    return 0


def sheet(art, path):
    def img(uri):
        return Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))).convert("RGBA")
    rows = art["floors"]
    w = max(len(f["wall"]) + len(f["floor"]) for f in rows) * 64 + 24
    out = Image.new("RGBA", (w, len(rows) * 68 + 4), (11, 17, 32, 255))
    for i, f in enumerate(rows):
        x = 4
        for uri in f["wall"] + [None] + f["floor"]:
            if uri is None:
                x += 16
                continue
            out.alpha_composite(img(uri).resize((64, 64), Image.NEAREST), (x, 4 + i * 68))
            x += 64
    out.save(path)
    print("лист:", path)


if __name__ == "__main__":
    sys.exit(main())
