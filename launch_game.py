#!/usr/bin/env python3
"""Запуск игры на этом компьютере: сервер + браузер.

Двойной клик по ярлыку PyDungeon. Скрипт:
  * если игра уже запущена на 8000–8019, просто открывает её;
  * иначе поднимает server.py --local на свободном порту;
  * ждёт /api/version и открывает /game в браузере.

Остановка — Ctrl+C в этом окне (или закрыть окно).
"""
import argparse
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.join(BASE_DIR, "server.py")
PORTS = range(8000, 8020)


def find_running_game():
    for port in PORTS:
        try:
            with urllib.request.urlopen(
                "http://127.0.0.1:%d/api/version" % port, timeout=0.4
            ) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok"):
                return port
        except Exception:
            continue
    return None


def free_port():
    for port in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return 8000


def game_url(port):
    return "http://127.0.0.1:%d/game" % port


def wait_ready(port, proc, timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            return False
        try:
            with urllib.request.urlopen(
                "http://127.0.0.1:%d/api/version" % port, timeout=0.5
            ) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.25)
    return False


def main():
    parser = argparse.ArgumentParser(description="Запустить PyDungeon локально")
    parser.add_argument("--dev", action="store_true", help="панель разработчика (F2)")
    parser.add_argument("--no-browser", action="store_true", help="не открывать браузер")
    parser.add_argument("--port", type=int, default=None, help="порт (по умолчанию 8000+)")
    args = parser.parse_args()

    if not os.path.isfile(SERVER):
        print("Не найден server.py рядом с launch_game.py")
        input("Нажмите Enter, чтобы закрыть.")
        return 1

    running = find_running_game()
    if running:
        print("Игра уже запущена: %s" % game_url(running))
        if not args.no_browser:
            webbrowser.open(game_url(running))
        return 0

    port = args.port or free_port()
    cmd = [sys.executable, SERVER, "--local", "--port", str(port)]
    if args.dev:
        cmd.append("--dev")

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    print("Запускаю PyDungeon на %s" % game_url(port))
    print("Остановка: Ctrl+C в этом окне.")
    print()
    proc = subprocess.Popen(cmd, cwd=BASE_DIR, env=env)
    try:
        if not wait_ready(port, proc):
            print("\nСервер не поднялся за 20 секунд.")
            if proc.poll() is None:
                proc.terminate()
            return 1
        print("\nОткрываю игру в браузере…")
        if not args.no_browser:
            webbrowser.open(game_url(port))
        proc.wait()
        return proc.returncode or 0
    except KeyboardInterrupt:
        print("\nОстанавливаю сервер…")
        proc.terminate()
        try:
            proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()
        return 0
    finally:
        if proc.poll() is None:
            proc.terminate()


if __name__ == "__main__":
    code = main()
    if code and sys.stdin and sys.stdin.isatty():
        try:
            input("Нажмите Enter, чтобы закрыть окно…")
        except (EOFError, KeyboardInterrupt):
            pass
    sys.exit(code)
