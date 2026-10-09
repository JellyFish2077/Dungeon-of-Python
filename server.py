#!/usr/bin/env python3
"""Локальный сервер для игры-теста по Python.

Запуск:
    python3 server.py                # локальная сеть (0.0.0.0:8000), студенты заходят по IP
    python3 server.py --local        # только этот компьютер (127.0.0.1)
    python3 server.py --port 8080    # другой начальный порт
    python3 server.py --no-code      # без выполнения кода студентов (безопаснее)

Если порт занят, сервер автоматически берёт следующий.
Не требует сторонних библиотек — только стандартная библиотека Python.
"""

import argparse
import csv
import io
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
RESULTS_FILE = os.path.join(BASE_DIR, "results.json")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
_lock = threading.Lock()


def _hash_pin(pin, salt=None):
    import hashlib
    import secrets
    if salt is None:
        salt = secrets.token_hex(8)
    dk = hashlib.pbkdf2_hmac("sha256", str(pin).encode("utf-8"), salt.encode("utf-8"), 100000)
    return salt, dk.hex()


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def save_users(users):
    with _lock:
        tmp = USERS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
        os.replace(tmp, USERS_FILE)

ALLOW_CODE = True
TEACHER_PIN = os.environ.get("PYQUIZ_TEACHER_PIN", "").strip()
MAX_CODE_LEN = 20000
MAX_TESTS = 50
CODE_TIMEOUT = 5

RUNNER_PRELUDE = """import json, sys
try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
    resource.setrlimit(resource.RLIMIT_AS, (536870912, 536870912))
    resource.setrlimit(resource.RLIMIT_FSIZE, (2097152, 2097152))
except Exception:
    pass
with open(sys.argv[1], encoding="utf-8") as _f:
    _tests = json.load(_f)
"""

RUNNER_EPILOGUE = """
_results = []
for _t in _tests:
    try:
        _actual = eval(_t["call"], globals())
        _expected = eval(_t["expected"], globals())
        _results.append({"ok": _actual == _expected, "actual": repr(_actual), "expected": repr(_expected)})
    except Exception as _e:
        _results.append({"ok": False, "actual": "\\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: " + str(_e), "expected": _t["expected"]})
print("__RESULTS__" + json.dumps(_results, ensure_ascii=False))
"""


def run_code(code, tests):
    """Выполняет код студента в отдельном процессе и проверяет тесты."""
    if not ALLOW_CODE:
        return {"ok": False, "error": "Проверка кода отключена на сервере", "results": []}
    if not isinstance(code, str) or not code.strip():
        return {"ok": False, "error": "Пустой код", "results": []}
    if len(code) > MAX_CODE_LEN:
        return {"ok": False, "error": "Код слишком длинный", "results": []}
    if not isinstance(tests, list) or not tests:
        return {"ok": False, "error": "Нет тестов", "results": []}
    tests = tests[:MAX_TESTS]

    script = RUNNER_PRELUDE + "\n" + code + "\n" + RUNNER_EPILOGUE
    tmpdir = tempfile.mkdtemp(prefix="pyquiz-")
    try:
        code_path = os.path.join(tmpdir, "student.py")
        tests_path = os.path.join(tmpdir, "tests.json")
        with open(code_path, "w", encoding="utf-8") as f:
            f.write(script)
        with open(tests_path, "w", encoding="utf-8") as f:
            json.dump(tests, f, ensure_ascii=False)

        try:
            proc = subprocess.run(
                [sys.executable, "-I", code_path, tests_path],
                capture_output=True,
                timeout=CODE_TIMEOUT,
                cwd=tmpdir,
            )
        except subprocess.TimeoutExpired:
            return {
                "ok": False,
                "error": "Превышено время выполнения (возможно, бесконечный цикл)",
                "results": [],
            }

        stdout = proc.stdout.decode("utf-8", "replace")
        marker = "__RESULTS__"
        line = ""
        for candidate in stdout.splitlines():
            if candidate.startswith(marker):
                line = candidate[len(marker):]
        if not line:
            if proc.returncode is not None and proc.returncode < 0:
                return {
                    "ok": False,
                    "error": "Превышено время выполнения или программа аварийно завершилась",
                    "results": [],
                }
            err = proc.stderr.decode("utf-8", "replace").strip().splitlines()
            return {
                "ok": False,
                "error": err[-1] if err else "Не удалось выполнить код",
                "results": [],
            }

        results = json.loads(line)
        passed = sum(1 for r in results if r.get("ok"))
        return {"ok": True, "results": results, "passed": passed, "total": len(results)}
    except (OSError, ValueError) as exc:
        return {"ok": False, "error": str(exc), "results": []}
    finally:
        try:
            for name in os.listdir(tmpdir):
                os.remove(os.path.join(tmpdir, name))
            os.rmdir(tmpdir)
        except OSError:
            pass

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".svg": "image/svg+xml",
}

LEVEL_ORDER = ["novice", "basic", "confident", "advanced"]


def load_results():
    if not os.path.exists(RESULTS_FILE):
        return []
    try:
        with open(RESULTS_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_result(result):
    with _lock:
        data = load_results()
        result["serverTime"] = datetime.now().isoformat(timespec="seconds")
        data.append(result)
        tmp = RESULTS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, RESULTS_FILE)
        return len(data)


class Handler(BaseHTTPRequestHandler):
    server_version = "PythonQuiz/1.0"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _send(self, status, body=b"", content_type="text/plain; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _serve_file(self, path):
        if not os.path.abspath(path).startswith(os.path.abspath(STATIC_DIR)):
            self._send(403, b"403 Forbidden")
            return
        if not os.path.isfile(path):
            self._send(404, b"404 Not Found")
            return
        ext = os.path.splitext(path)[1].lower()
        with open(path, "rb") as f:
            body = f.read()
        self._send(200, body, CONTENT_TYPES.get(ext, "application/octet-stream"))

    def _pin_ok(self, query):
        if not TEACHER_PIN:
            return True
        values = dict()
        for pair in query.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                values[k] = v
        return values.get("pin") == TEACHER_PIN

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/results", "/api/results", "/api/export.csv"):
            if not self._pin_ok(parsed.query):
                self._send(403, "403. Нужен пароль: /results?pin=...".encode("utf-8"))
                return

        if path in ("/", "/index.html"):
            self._serve_file(os.path.join(STATIC_DIR, "index.html"))
        elif path in ("/game", "/game.html"):
            self._serve_file(os.path.join(STATIC_DIR, "game.html"))
        elif path in ("/study", "/study.html"):
            self._serve_file(os.path.join(STATIC_DIR, "study.html"))
        elif path == "/results":
            self._serve_file(os.path.join(STATIC_DIR, "results.html"))
        elif path.startswith("/static/"):
            rel = path[len("/static/"):]
            self._serve_file(os.path.join(STATIC_DIR, rel))
        elif path == "/api/results":
            self._send_json(200, load_results())
        elif path == "/api/export.csv":
            self._export_csv()
        else:
            self._send(404, b"404 Not Found")

    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/check":
            self._handle_check()
            return
        if path in ("/api/register", "/api/login", "/api/profile/save"):
            self._handle_account(path)
            return
        if path != "/api/submit":
            self._send(404, b"404 Not Found")
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return

        if not isinstance(data, dict) or "name" not in data:
            self._send_json(400, {"ok": False, "error": "Нет имени"})
            return

        total = save_result(data)
        self._send_json(200, {"ok": True, "saved": total})

    def _handle_account(self, path):
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return
        name = str(data.get("name", "")).strip()
        pin = str(data.get("pin", "")).strip()
        if not name or len(pin) < 3:
            self._send_json(400, {"ok": False, "error": "Нужны имя и PIN (минимум 3 символа)"})
            return
        key = name.lower()
        users = load_users()

        if path == "/api/register":
            if key in users:
                self._send_json(409, {"ok": False, "error": "Имя уже занято"})
                return
            salt, h = _hash_pin(pin)
            users[key] = {
                "name": name,
                "salt": salt,
                "hash": h,
                "profile": data.get("profile", {}),
                "updated": datetime.now().isoformat(timespec="seconds"),
            }
            save_users(users)
            self._send_json(200, {"ok": True, "profile": users[key]["profile"]})
            return

        if key not in users:
            self._send_json(404, {"ok": False, "error": "Аккаунт не найден"})
            return
        _, h = _hash_pin(pin, users[key]["salt"])
        if h != users[key]["hash"]:
            self._send_json(401, {"ok": False, "error": "Неверный PIN"})
            return

        if path == "/api/login":
            self._send_json(200, {"ok": True, "profile": users[key].get("profile", {})})
            return

        users[key]["profile"] = data.get("profile", {})
        users[key]["updated"] = datetime.now().isoformat(timespec="seconds")
        save_users(users)
        self._send_json(200, {"ok": True})

    def _handle_check(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > 200000:
                self._send_json(413, {"ok": False, "error": "Слишком большой запрос"})
                return
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "Некорректные данные"})
            return

        code = data.get("code", "")
        tests = data.get("tests", [])
        self._send_json(200, run_code(code, tests))

    def _export_csv(self):
        data = load_results()
        buf = io.StringIO()
        writer = csv.writer(buf, delimiter=";")
        writer.writerow(
            ["Имя", "Дата", "Процент", "Уровень", "Правильно", "Всего", "Секунды"]
        )
        for r in data:
            writer.writerow(
                [
                    r.get("name", ""),
                    r.get("date", "")[:19].replace("T", " "),
                    r.get("percent", ""),
                    (r.get("level") or {}).get("title", ""),
                    r.get("correctCount", ""),
                    r.get("total", ""),
                    r.get("seconds", ""),
                ]
            )
        # BOM, чтобы Excel корректно открыл кириллицу
        body = ("\ufeff" + buf.getvalue()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header(
            "Content-Disposition", 'attachment; filename="python-quiz-results.csv"'
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def local_ips():
    """Возвращает список локальных IPv4-адресов этой машины (для доступа по сети)."""
    ips = []

    def add(ip):
        if ip and not ip.startswith("127.") and ip not in ips:
            ips.append(ip)

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.connect(("8.8.8.8", 80))
            add(sock.getsockname()[0])
        finally:
            sock.close()
    except OSError:
        pass

    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            add(ip)
    except OSError:
        pass

    return ips


class ReuseServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def bind_server(host, port, tries=25):
    """Пробует занять порт; если занят — перебирает следующие."""
    last = None
    for p in range(port, port + tries):
        try:
            return ReuseServer((host, p), Handler), p
        except OSError as exc:
            last = exc
            if exc.errno in (98, 48, 10048):  # Linux / macOS / Windows: адрес занят
                continue
            raise
    raise last


def main():
    global ALLOW_CODE
    parser = argparse.ArgumentParser(description="Сервер игры-теста по Python")
    parser.add_argument(
        "--host", default=None, help="адрес привязки (по умолчанию 0.0.0.0 — локальная сеть)"
    )
    parser.add_argument("--port", type=int, default=8000, help="порт (по умолчанию 8000)")
    parser.add_argument(
        "--local", action="store_true", help="только этот компьютер (127.0.0.1)"
    )
    parser.add_argument(
        "--no-code", action="store_true", help="отключить проверку написанного кода"
    )
    args = parser.parse_args()
    ALLOW_CODE = not args.no_code

    host = "127.0.0.1" if args.local else (args.host or "0.0.0.0")
    try:
        server, port = bind_server(host, args.port)
    except OSError as exc:
        print("Не удалось запустить сервер на %s:%d" % (host, args.port))
        print("Причина: %s" % exc)
        sys.exit(1)

    lan = host == "0.0.0.0"
    if port != args.port:
        print("Порт %d занят — использую %d." % (args.port, port))

    print("=" * 62)
    print("  Подземелье Python — сервер запущен")
    print()
    if lan:
        ips = local_ips()
        print("  Режим: локальная сеть (студенты заходят по IP)")
        print("  Игра для студентов:")
        if ips:
            for ip in ips:
                print("      http://%s:%d/game" % (ip, port))
        else:
            print("      http://<IP-компьютера>:%d/game" % port)
        print()
        print("  На этом компьютере:   http://localhost:%d/game" % port)
        print("  Самоподготовка:       http://localhost:%d/study" % port)
        print(
            "  Панель преподавателя: http://%s:%d/results"
            % (ips[0] if ips else "localhost", port)
        )
    else:
        print("  Режим: только этот компьютер")
        print("  Тест:      http://localhost:%d/" % port)
        print("  Подземелье:http://localhost:%d/game" % port)
        print("  Учёба:     http://localhost:%d/study" % port)
        print("  Результаты:http://localhost:%d/results" % port)
        print()
        print("  Для доступа по сети просто запустите:  python3 server.py")
    print()
    print("  Проверка кода: %s" % ("включена" if ALLOW_CODE else "выключена"))
    if lan and ALLOW_CODE:
        print("  ВНИМАНИЕ: код студентов выполняется на этом компьютере.")
        print("            Запускайте только в доверенной сети или с --no-code.")
    print("  Остановка: Ctrl+C")
    print("=" * 62)
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
