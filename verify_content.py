#!/usr/bin/env python3
"""Обёртка для tools/content_lint.js: проверка ссылок и обязательных полей."""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def main():
    if not shutil.which("node"):
        print("Пропуск: для проверки контента нужен Node.js.")
        return 3
    proc = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "content_lint.js")],
        cwd=ROOT,
        encoding="utf-8",
        errors="replace",
    )
    return proc.returncode


if __name__ == "__main__":
    sys.exit(main())
