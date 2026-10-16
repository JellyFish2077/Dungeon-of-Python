#!/usr/bin/env python3
"""Запуск сервера перед занятием — двойной клик по файлу.

Спрашивает пароль преподавателя (если он ещё не задан в переменной
PYQUIZ_TEACHER_PIN) и запускает сервер в локальной сети.
"""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.join(BASE_DIR, "server.py")


def ask_pin():
    pin = os.environ.get("PYQUIZ_TEACHER_PIN", "").strip()
    if pin:
        return pin
    print()
    print("  Панель преподавателя закрыта паролем.")
    try:
        pin = input("  Введите пароль (введите Enter — панель останется закрытой): ").strip()
    except (EOFError, KeyboardInterrupt):
        pin = ""
    if not pin:
        print("  Пароль не задан: панель преподавателя будет недоступна.")
    return pin


def main():
    if not os.path.exists(SERVER):
        print("Не найден server.py рядом с этим файлом.")
        input("Нажмите Enter, чтобы закрыть.")
        return 1

    os.environ["PYTHONIOENCODING"] = "utf-8"
    pin = ask_pin()
    if pin:
        os.environ["PYQUIZ_TEACHER_PIN"] = pin

    args = sys.argv[1:]
    cmd = [sys.executable, SERVER] + args
    print()
    print("  Запускаю сервер" + (" с параметрами: " + " ".join(args) if args else ""))
    print("  Остановка: Ctrl+C в этом окне")
    print()
    try:
        return subprocess.call(cmd, cwd=BASE_DIR)
    except KeyboardInterrupt:
        print("\n  Сервер остановлен.")
        return 0
    finally:
        print()
        input("  Нажмите Enter, чтобы закрыть окно.")


if __name__ == "__main__":
    sys.exit(main())
