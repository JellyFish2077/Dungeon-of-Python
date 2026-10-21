#!/usr/bin/env python3
"""Запуск одиночной PyDungeon: статический сервер + браузер.

Двойной клик по ярлыку PyDungeon. Классный server.py здесь не нужен:
игра работает в браузере, профиль локальный, код проверяет Pyodide.

Если сборки ещё нет — она создаётся автоматически. Pyodide при первой
сборке скачивается локально (~5.5 МБ); без него игра пойдёт через CDN.
"""
import argparse
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(BASE_DIR, "standalone", "build")
PORTS = range(8080, 8100)


def build_if_needed():
    if os.path.isfile(os.path.join(BUILD, "index.html")):
        return True
    print("Сборка standalone-версии…")
    code = subprocess.call([sys.executable, os.path.join(BASE_DIR, "tools", "build_web.py")],
                           cwd=BASE_DIR)
    if code != 0:
        return False
    if not os.path.isfile(os.path.join(BUILD, "static", "pyodide", "pyodide.js")):
        print("Скачиваю Pyodide для офлайн-режима…")
        subprocess.call([sys.executable, os.path.join(BASE_DIR, "tools", "fetch_pyodide.py")],
                        cwd=BASE_DIR)
    return os.path.isfile(os.path.join(BUILD, "index.html"))


def looks_like_game(port):
    try:
        with urllib.request.urlopen(
            "http://127.0.0.1:%d/index.html" % port, timeout=0.4
        ) as resp:
            head = resp.read(800).decode("utf-8", "replace")
        return "PyDungeon" in head
    except Exception:
        return False


def find_running():
    for port in PORTS:
        if looks_like_game(port):
            return port
    return None


def free_port():
    for port in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return 8080


def wait_ready(port, proc, timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            return False
        if looks_like_game(port):
            return True
        time.sleep(0.2)
    return False


def browser_candidates():
    """Chromium-браузеры, которые умеют стартовать в полноэкранном окне."""
    roots = [
        os.environ.get("ProgramFiles(x86)"),
        os.environ.get("ProgramFiles"),
        os.environ.get("LOCALAPPDATA"),
    ]
    rel = [
        ("Microsoft", "Edge", "Application", "msedge.exe"),
        ("Google", "Chrome", "Application", "chrome.exe"),
        ("BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
    ]
    out = []
    for root in roots:
        if not root:
            continue
        for parts in rel:
            path = os.path.join(root, *parts)
            if os.path.isfile(path) and path not in out:
                out.append(path)
    for name in ("msedge.exe", "chrome.exe", "brave.exe"):
        found = shutil.which(name)
        if found and found not in out:
            out.append(found)
    return out


def open_game(url, windowed=False):
    """Открыть игру в отдельном полноэкранном окне браузера."""
    if not windowed:
        for exe in browser_candidates():
            try:
                subprocess.Popen(
                    [exe, "--new-window", "--start-fullscreen", url],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                return True
            except OSError:
                continue
    try:
        webbrowser.open(url)
        return True
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="Запустить одиночную PyDungeon")
    parser.add_argument("--no-browser", action="store_true", help="не открывать браузер")
    parser.add_argument("--windowed", action="store_true", help="обычное окно, без fullscreen")
    parser.add_argument("--port", type=int, default=None, help="порт (по умолчанию 8080+)")
    args = parser.parse_args()

    if not build_if_needed():
        print("Не удалось собрать игру. Запустите: python tools/build_web.py")
        input("Нажмите Enter, чтобы закрыть.")
        return 1

    running = find_running()
    if running:
        print("Игра уже запущена: http://127.0.0.1:%d/index.html" % running)
        if not args.no_browser:
            open_game("http://127.0.0.1:%d/index.html" % running, args.windowed)
        return 0

    port = args.port or free_port()
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    print("Запускаю одиночную PyDungeon на http://127.0.0.1:%d/index.html" % port)
    print("Остановка: Ctrl+C в этом окне.")
    print()
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1",
         "--directory", BUILD],
        cwd=BASE_DIR, env=env,
    )
    try:
        if not wait_ready(port, proc):
            print("\nСтатический сервер не поднялся за 15 секунд.")
            return 1
        print("\nОткрываю игру в браузере" +
              ("" if args.windowed else " (полноэкранное окно)") + "…")
        if not args.no_browser:
            open_game("http://127.0.0.1:%d/index.html" % port, args.windowed)
        proc.wait()
        return proc.returncode or 0
    except KeyboardInterrupt:
        print("\nОстанавливаю игру…")
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
