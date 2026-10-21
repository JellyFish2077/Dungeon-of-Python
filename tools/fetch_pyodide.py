#!/usr/bin/env python3
"""Скачать Pyodide core в standalone/build/static/pyodide.

Запускать после tools/build_web.py:

    python tools/build_web.py
    python tools/fetch_pyodide.py

Без этой папки standalone-сборка работает, но тянет Pyodide с CDN.
"""
import os
import pathlib
import sys
import tarfile
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "standalone" / "build" / "static" / "pyodide"
VERSION = "0.27.7"
URL = ("https://github.com/pyodide/pyodide/releases/download/%s/"
       "pyodide-core-%s.tar.bz2" % (VERSION, VERSION))


def main():
    if not (ROOT / "standalone" / "build" / "static").is_dir():
        print("сначала соберите standalone-версию: python tools/build_web.py", file=sys.stderr)
        return 1
    archive = pathlib.Path(tempfile.gettempdir()) / ("pyodide-core-%s.tar.bz2" % VERSION)
    if not archive.exists() or archive.stat().st_size < 1000000:
        print("скачиваю Pyodide %s (~5.5 МБ)…" % VERSION)
        urllib.request.urlretrieve(URL, archive)

    TARGET.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r:bz2") as tf:
        members = []
        for member in tf.getmembers():
            name = member.name
            if name == "pyodide":
                continue
            if not name.startswith("pyodide/"):
                continue
            member.name = name[len("pyodide/"):]
            members.append(member)
        # data_filter появился в Python 3.12; на старом Python просто
        # распаковываем проверенные имена из официального архива.
        try:
            tf.extractall(TARGET, members=members, filter="data")
        except TypeError:
            tf.extractall(TARGET, members=members)

    needed = ("pyodide.js", "pyodide.asm.wasm", "python_stdlib.zip",
              "pyodide-lock.json")
    missing = [name for name in needed if not (TARGET / name).exists()]
    if missing:
        print("в архиве нет файлов: %s" % ", ".join(missing), file=sys.stderr)
        return 1
    total = sum(f.stat().st_size for f in TARGET.rglob("*") if f.is_file())
    print("Pyodide: %s (%.1f МБ)" % (TARGET, total / 1024 / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
