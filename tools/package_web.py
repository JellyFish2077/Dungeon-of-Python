#!/usr/bin/env python3
"""Упаковать standalone-сборку в zip для Itch.io.

    python tools/build_web.py
    python tools/fetch_pyodide.py     # офлайн-вариант
    python tools/package_web.py

Архив: dist/pydungeon-standalone-<версия>.zip, index.html в корне.
"""
import hashlib
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "standalone" / "build"
DIST = ROOT / "dist"


def version():
    text = (ROOT / "static" / "web-boot.js").read_text(encoding="utf-8")
    match = re.search(r'version:\s*"([^"]+)"', text)
    return match.group(1).replace("-web", "") if match else "0.0.0"


def main():
    if not (PUBLIC / "index.html").is_file():
        print("сначала соберите веб-версию: python tools/build_web.py", file=sys.stderr)
        return 1
    required = (
        "index.html", "game.html", "static/game.js", "static/profile.js",
        "static/auth.js", "static/web-boot.js", "static/pyodide-check.js",
        "static/pyodide-worker.js", "static/code-tasks-tests.json",
    )
    missing = [name for name in required if not (PUBLIC / name).is_file()]
    if missing:
        print("в public/ нет файлов: %s" % ", ".join(missing), file=sys.stderr)
        return 1

    DIST.mkdir(exist_ok=True)
    target = DIST / ("pydungeon-standalone-%s.zip" % version())
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in sorted(PUBLIC.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(PUBLIC).as_posix())

    data = target.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    offline = (PUBLIC / "static" / "pyodide" / "pyodide.js").is_file()
    print("архив: %s" % target)
    print("размер: %.1f МБ" % (len(data) / 1024 / 1024))
    print("sha256: %s" % digest)
    print("Pyodide: %s" % ("локально" if offline else "CDN (офлайн не будет)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
