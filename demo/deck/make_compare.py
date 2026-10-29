"""Контактный лист: PPTX сверху, HTML снизу — по три слайда в ряд."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R = HERE / "render"
FONT = ROOT / "static" / "landing" / "fonts" / "IBMPlexMono-Regular.ttf"

TW, TH = 640, 360
MARGIN, GAP = 28, 18
LABEL_H = 34
ROW_GAP = 26

canvas_w = MARGIN * 2 + TW * 3 + GAP * 2
canvas_h = MARGIN * 2 + (LABEL_H + TH) * 2 + ROW_GAP
img = Image.new("RGB", (canvas_w, canvas_h), (0x0F, 0x14, 0x11))
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(str(FONT), 15)
small = ImageFont.truetype(str(FONT), 12)


def tracked(draw, xy, text, fill, font, tracking=2):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def tracked_w(draw, text, font, tracking=2):
    return sum(draw.textlength(ch, font=font) for ch in text) + tracking * (len(text) - 1)


def row(files, title, note, top):
    tracked(draw, (MARGIN, top), title, (0xD3, 0x9A, 0x74), font, 2)
    nx = canvas_w - MARGIN - tracked_w(draw, note, small, 1)
    tracked(draw, (nx, top + 2), note, (0x8F, 0x88, 0x7A), small, 1)
    y = top + LABEL_H
    for i, path in enumerate(files):
        x = MARGIN + i * (TW + GAP)
        with Image.open(path) as im:
            im = im.convert("RGB").resize((TW, TH), Image.LANCZOS)
        img.paste(im, (x, y))
        draw.rectangle([x - 1, y - 1, x + TW, y + TH], outline=(0x32, 0x2F, 0x28))
    return y + TH


y = row(sorted(R.glob("slide-*.png")), "POWERPOINT · .PPTX", "РЕНДЕР: LIBREOFFICE → PDF → PNG", MARGIN)
row(sorted(R.glob("html-*.png")), "HTML · КОЛОДА", "СКРИНШОТ: EDGE / PLAYWRIGHT · 1280×720", y + ROW_GAP)

out = R / "compare.png"
img.save(out)
print(f"saved: {out}  ({img.size[0]}x{img.size[1]})")
