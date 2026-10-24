#!/usr/bin/env python3
"""Экспорт Aseprite-исходников в PNG-оверрайды для tools/art/build_art.py.

Запуск из корня проекта:
    python tools/art/export_aseprite.py
    python tools/art/export_aseprite.py --check   только проверить, что PNG
                                                  совпадают с .aseprite

Источник истины — tools/art/aseprite/*.aseprite. Каждый кадр имеет тег,
имя тега = имя будущего PNG. Семейство terrain_01 раскладывается в
src_custom/floors/01, остальные — в одноимённые папки.

Aseprite ищется в ASEPRITE, C:\\tools\\aseprite\\aseprite.exe,
C:\\Users\\<user>\\src\\aseprite\\build\\bin\\aseprite.exe и стандартных
местах установки. Нужен Pillow — только для проверки размеров.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Нужен Pillow: pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "tools", "art")
SRC = os.path.join(ART, "aseprite")
OUT = os.path.join(ART, "src_custom")

FAMILIES = {
    "creatures": "creatures",
    "creatures2": "creatures",
    "items": "items",
    "items2": "items",
    "objects": "objects",
    "objects2": "objects",
    "objects3": "objects",
    "furniture": "objects",
    "terrain_01": os.path.join("floors", "01"),
    "water": "water",
    "lava": "lava",
    "stairs": "stairs",
    "traps": "traps",
    "doors": "doors",
    "decor": "decor",
    "village": "village",
    "interior": "village",
}
for _n in range(2, 11):
    FAMILIES["terrain_%02d" % _n] = os.path.join("floors", "%02d" % _n)


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


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def export_family(exe: str, family: str, dest: str, target_root: str,
                  old_files: set[str] | None = None) -> list[dict]:
    source = os.path.join(SRC, family + ".aseprite")
    if not os.path.isfile(source):
        raise SystemExit("Нет исходника: " + source)
    target = os.path.join(target_root, dest)
    os.makedirs(target, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="pydungeon-art-") as tmp:
        pattern = os.path.join(tmp, "{tag}.png")
        cmd = [
            exe, "--batch", source,
            "--split-tags",
            "--filename-format", "{tag}.png",
            "--save-as", pattern,
        ]
        proc = subprocess.run(cmd, text=True)
        if proc.returncode != 0:
            raise SystemExit("Aseprite вернул %d на %s" % (proc.returncode, source))
        files = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
        if not files:
            raise SystemExit("Aseprite не экспортировал ни одного кадра из " + source)
        exported = []
        for name in files:
            src = os.path.join(tmp, name)
            with Image.open(src) as im:
                if im.size != (32, 32):
                    raise SystemExit("%s/%s: %s вместо 32x32" % (family, name, im.size))
                if im.mode not in ("RGBA", "LA", "P"):
                    raise SystemExit("%s/%s: режим %s, нужен RGBA" % (family, name, im.mode))
                if im.mode == "P":
                    im = im.convert("RGBA")
                alpha = im.getchannel("A")
                if alpha.getextrema()[1] == 0:
                    raise SystemExit("%s/%s: полностью прозрачный кадр" % (family, name))
            shutil.copyfile(src, os.path.join(target, name))
            exported.append({"tag": name[:-4], "file": name, "sha256": sha256(src)})
        # PNG удалённого тега иначе остался бы в src_custom и продолжал
        # перекрывать базовый спрайт. Удаляем только файлы, которые этот
        # же family экспортировал в прошлый раз: в одной папке могут жить
        # несколько семейств (creatures + creatures2).
        keep = {name for name in files}
        for name in sorted(old_files or ()):
            if name not in keep and os.path.isfile(os.path.join(target, name)):
                os.remove(os.path.join(target, name))
                print("удалён устаревший:", os.path.relpath(os.path.join(target, name), ROOT))
    return exported


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="не писать файлы, только сравнить")
    ap.add_argument("--aseprite", metavar="PATH", help="путь к aseprite.exe")
    args = ap.parse_args()

    exe = find_aseprite(args.aseprite)
    print("Aseprite:", exe)

    manifest = {
        "about": "Экспортировано из tools/art/aseprite. Не правьте PNG вручную.",
        "aseprite": subprocess.run(
            [exe, "--version"], capture_output=True, text=True
        ).stdout.strip(),
        "families": {},
        "files": {},
    }
    old_manifest = {}
    manifest_path = os.path.join(OUT, "export-manifest.json")
    if os.path.isfile(manifest_path):
        try:
            with open(manifest_path, encoding="utf-8") as fh:
                old_manifest = json.load(fh)
        except (OSError, ValueError):
            old_manifest = {}
    old_by_family = {}
    for fam, data in (old_manifest.get("families") or {}).items():
        old_by_family[fam] = {item.get("file") for item in (data.get("assets") or []) if item.get("file")}
    stale = []
    target_root = OUT
    if args.check:
        target_root = tempfile.mkdtemp(prefix="pydungeon-art-check-")
    try:
        for family, dest in FAMILIES.items():
            old_files = old_by_family.get(family, set())
            exported = export_family(exe, family, dest, target_root, old_files)
            manifest["families"][family] = {"destination": dest, "assets": exported}
            expected_names = {item["file"] for item in exported}
            if args.check:
                dest_dir = os.path.join(OUT, dest)
                for name in sorted(old_files - expected_names):
                    if os.path.isfile(os.path.join(dest_dir, name)):
                        stale.append(os.path.relpath(os.path.join(dest_dir, name), ROOT))
            for item in exported:
                expected = os.path.join(OUT, dest, item["file"])
                actual = os.path.join(target_root, dest, item["file"])
                if args.check:
                    if not os.path.isfile(expected) or sha256(expected) != item["sha256"]:
                        stale.append(os.path.relpath(expected, ROOT))
                    else:
                        manifest["files"][os.path.join(dest, item["file"]).replace("\\", "/")] = item["sha256"]
                else:
                    manifest["files"][os.path.join(dest, item["file"]).replace("\\", "/")] = item["sha256"]
    finally:
        if args.check:
            shutil.rmtree(target_root, ignore_errors=True)

    if args.check:
        if stale:
            print("Устарели PNG (запустите python tools/art/export_aseprite.py):")
            for path in stale:
                print("  " + path)
            return 1
        print("PNG в src_custom совпадают с .aseprite.")
        return 0

    with open(os.path.join(OUT, "export-manifest.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("Экспортировано:", os.path.relpath(OUT, ROOT))
    print("Дальше: python tools/art/build_art.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
