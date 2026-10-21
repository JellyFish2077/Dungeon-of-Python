"""Ставит pre-commit hook, который прогоняет проверки перед каждым коммитом.

Зачем: песочница, схема админки и 900+ проверок подземелья уже написаны,
но запускались вручную. Хук делает прогон частью коммита, поэтому сломанная
песочница или рассинхронизированная схема не попадут в историю молча.

    python tools/install_hooks.py

Хук гоняет быстрый набор (check.py и verify_server.py, около пяти секунд,
чистый Python без node). Полный прогон с проверками подземелья перед
занятием запускается руками:

    python run_all_checks.py
"""
import os
import stat
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOOKS_DIR = os.path.join(ROOT, ".git", "hooks")

HOOK = r"""#!/bin/sh
# Проверки проекта перед коммитом. Ставится скриптом tools/install_hooks.py.
# Отключить: python tools/install_hooks.py --remove
cd "$(git rev-parse --show-toplevel)" || exit 1

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
    echo "Пропуск: не найден python" >&2
    exit 0
fi

PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python

STAGED=$(git diff --cached --name-only)
# Проверки имеет смысл гонять только когда менялся код, а не, скажем, README.
case "$STAGED" in
    *.py|*.js|*.html|*.json) ;;
    *) exit 0 ;;
esac

"$PY" run_all_checks.py --quick || {
    echo ""
    echo "Коммит отменён: проверки не прошли. Исправить или запустить" >&2
    echo "python run_all_checks.py --quick --only check.py --only verify_server" >&2
    echo "и убедиться, что дело не в самих проверках." >&2
    exit 1
}
exit 0
"""


def main():
    remove = "--remove" in sys.argv
    path = os.path.join(HOOKS_DIR, "pre-commit")
    if remove:
        if os.path.exists(path):
            os.remove(path)
            print("Хук удалён: %s" % path)
        else:
            print("Хука и не было: %s" % path)
        return 0
    if not os.path.isdir(HOOKS_DIR):
        print("Это не git-репозиторий: нет папки %s" % HOOKS_DIR)
        return 1
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            if f.read() == HOOK:
                print("Хук уже установлен: %s" % path)
                return 0
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(HOOK)
    os.chmod(path, os.stat(path).st_mode | stat.S_IXUSR | stat.S_IXGRP)
    print("Хук установлен: %s" % path)
    print("Теперь каждый коммит прогоняет check.py и verify_server.py.")
    return 0


if __name__ == "__main__":
    sys.exit(main())