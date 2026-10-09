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
import base64
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

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


AVATAR_COLORS = ["#2563eb", "#16a34a", "#db2777", "#f59e0b", "#7c3aed", "#0891b2", "#dc2626"]

SECRET_FILE = os.path.join(BASE_DIR, ".secret")
TOKEN_TTL = 60 * 60 * 24 * 30  # 30 дней


def _load_secret():
    env = os.environ.get("PYQUIZ_SECRET", "").strip()
    if env:
        return env.encode("utf-8")
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE, "rb") as f:
            return f.read().strip()
    val = secrets.token_hex(32).encode("utf-8")
    try:
        with open(SECRET_FILE, "wb") as f:
            f.write(val)
        os.chmod(SECRET_FILE, 0o600)
    except OSError:
        pass
    return val


SECRET = _load_secret()


def new_token(key):
    exp = int(time.time()) + TOKEN_TTL
    payload = "%s|%d" % (key, exp)
    sig = hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
    raw = (payload + "|" + sig).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def token_key(token):
    try:
        raw = base64.urlsafe_b64decode(str(token or "").encode("ascii")).decode("utf-8")
        key, exp_s, sig = raw.rsplit("|", 2)
        payload = "%s|%s" % (key, exp_s)
        good = hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, good):
            return None
        if int(exp_s) < int(time.time()):
            return None
        return key
    except (ValueError, TypeError):
        return None


# --- SQLite для социальных данных (друзья, сообщения, приглашения) ---
DB_FILE = os.path.join(BASE_DIR, "social.db")


def db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS friends (
                a TEXT NOT NULL, b TEXT NOT NULL,
                created TEXT NOT NULL, PRIMARY KEY (a, b)
            );
            CREATE TABLE IF NOT EXISTS requests (
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                created TEXT NOT NULL, PRIMARY KEY (frm, to_)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                body TEXT NOT NULL, created TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frm TEXT NOT NULL, to_ TEXT NOT NULL,
                kind TEXT NOT NULL, payload TEXT, created TEXT NOT NULL
            );
            """
        )


# --- ограничение попыток входа ---
_RATE = {}
_RATE_LOCK = threading.Lock()


def rate_ok(ip, limit=20, window=60):
    now = time.time()
    with _RATE_LOCK:
        arr = _RATE.get(ip, [])
        arr = [t for t in arr if now - t < window]
        if len(arr) >= limit:
            _RATE[ip] = arr
            return False
        arr.append(now)
        _RATE[ip] = arr
        return True


def public_user(acc, key):
    return {
        "name": acc.get("name", key),
        "role": acc.get("role", "student"),
        "about": acc.get("about", ""),
        "avatar": acc.get("avatar", AVATAR_COLORS[0]),
        "created": acc.get("created", ""),
    }


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

    def _client_ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        if fwd:
            return fwd.split(",")[0].strip()
        return self.client_address[0] if self.client_address else "?"

    def _send(self, status, body=b"", content_type="text/plain; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
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

        if path in ("/", "/home", "/home.html"):
            self._serve_file(os.path.join(STATIC_DIR, "home.html"))
        elif path in ("/quiz", "/quiz.html", "/index.html"):
            self._serve_file(os.path.join(STATIC_DIR, "index.html"))
        elif path in ("/game", "/game.html"):
            self._serve_file(os.path.join(STATIC_DIR, "game.html"))
        elif path in ("/study", "/study.html"):
            self._serve_file(os.path.join(STATIC_DIR, "study.html"))
        elif path in ("/profile", "/profile.html"):
            self._serve_file(os.path.join(STATIC_DIR, "profile.html"))
        elif path in ("/friends", "/friends.html"):
            self._serve_file(os.path.join(STATIC_DIR, "friends.html"))
        elif path == "/results":
            self._serve_file(os.path.join(STATIC_DIR, "results.html"))
        elif path.startswith("/static/"):
            rel = path[len("/static/"):]
            self._serve_file(os.path.join(STATIC_DIR, rel))
        elif path == "/api/results":
            self._send_json(200, load_results())
        elif path == "/api/me":
            self._api_me(parsed.query)
        elif path == "/api/user":
            self._api_user(parsed.query)
        elif path in ("/api/users", "/api/friends", "/api/messages", "/api/invites"):
            self._social_get(path, parsed.query)
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
        if path in ("/api/register", "/api/login"):
            self._handle_account(path)
            return
        if path in ("/api/profile/update", "/api/profile/save"):
            try:
                length = int(self.headers.get("Content-Length", 0))
                data = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, json.JSONDecodeError):
                data = {}
            self._handle_profile(path, data)
            return
        if path in ("/api/friends/request", "/api/friends/accept", "/api/friends/remove",
                    "/api/messages", "/api/invites", "/api/invites/clear"):
            try:
                length = int(self.headers.get("Content-Length", 0))
                data = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, json.JSONDecodeError):
                data = {}
            self._social_post(path, data)
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
        if not rate_ok(self._client_ip(), limit=30, window=60):
            self._send_json(429, {"ok": False, "error": "Слишком много попыток, подождите"})
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
            import secrets
            users[key] = {
                "name": name,
                "salt": salt,
                "hash": h,
                "role": "student",
                "about": "",
                "avatar": AVATAR_COLORS[secrets.randbelow(len(AVATAR_COLORS))],
                "profile": data.get("profile", {}),
                "created": datetime.now().isoformat(timespec="seconds"),
                "updated": datetime.now().isoformat(timespec="seconds"),
            }
            save_users(users)
            tok = new_token(key)
            self._send_json(200, {
                "ok": True,
                "token": tok,
                "user": public_user(users[key], key),
                "profile": users[key]["profile"],
            })
            return

        if key not in users:
            self._send_json(404, {"ok": False, "error": "Аккаунт не найден"})
            return
        _, h = _hash_pin(pin, users[key]["salt"])
        if h != users[key]["hash"]:
            self._send_json(401, {"ok": False, "error": "Неверный PIN"})
            return

        if path == "/api/login":
            tok = new_token(key)
            self._send_json(200, {
                "ok": True,
                "token": tok,
                "user": public_user(users[key], key),
                "profile": users[key].get("profile", {}),
            })
            return

        users[key]["profile"] = data.get("profile", {})
        users[key]["updated"] = datetime.now().isoformat(timespec="seconds")
        save_users(users)
        self._send_json(200, {"ok": True})

    def _query(self, query):
        out = {}
        for pair in query.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                out[unquote(k)] = unquote(v)
        return out

    def _api_me(self, query):
        q = self._query(query)
        key = token_key(q.get("token"))
        if not key:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
            return
        users = load_users()
        acc = users.get(key)
        if not acc:
            self._send_json(404, {"ok": False, "error": "Аккаунт не найден"})
            return
        self._send_json(200, {"ok": True, "user": public_user(acc, key), "profile": acc.get("profile", {})})

    def _api_user(self, query):
        q = self._query(query)
        key = str(q.get("name", "")).strip().lower()
        users = load_users()
        acc = users.get(key)
        if not acc:
            self._send_json(404, {"ok": False, "error": "Не найдено"})
            return
        self._send_json(200, {"ok": True, "user": public_user(acc, key)})

    def _handle_profile(self, path, data):
        data = data or {}
        users = load_users()
        key = token_key(data.get("token"))
        if not key:
            # запасной вариант: имя + PIN
            name = str(data.get("name", "")).strip().lower()
            pin = str(data.get("pin", "")).strip()
            if name in users and pin:
                _, h = _hash_pin(pin, users[name]["salt"])
                if h == users[name]["hash"]:
                    key = name
        if not key or key not in users:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
            return
        acc = users[key]
        if path == "/api/profile/update":
            if "about" in data:
                acc["about"] = str(data.get("about", ""))[:300]
            if "avatar" in data and data.get("avatar"):
                acc["avatar"] = str(data.get("avatar"))[:20]
            acc["updated"] = datetime.now().isoformat(timespec="seconds")
            save_users(users)
            self._send_json(200, {"ok": True, "user": public_user(acc, key)})
            return
        acc["profile"] = data.get("profile", acc.get("profile", {}))
        acc["updated"] = datetime.now().isoformat(timespec="seconds")
        save_users(users)
        self._send_json(200, {"ok": True})

    def _key_or_401(self, token):
        key = token_key(token)
        if not key:
            self._send_json(401, {"ok": False, "error": "Нужен вход"})
        return key

    def _display(self, users, key):
        acc = users.get(key)
        if not acc:
            return {"name": key, "avatar": AVATAR_COLORS[0], "role": "student", "about": ""}
        d = public_user(acc, key)
        d["key"] = key
        return d

    def _social_get(self, path, query):
        q = self._query(query)
        key = self._key_or_401(q.get("token"))
        if not key:
            return
        users = load_users()
        with db() as conn:
            if path == "/api/users":
                term = str(q.get("q", "")).strip().lower()
                out = []
                for k in users:
                    if k == key:
                        continue
                    if term and term not in k:
                        continue
                    out.append(self._display(users, k))
                self._send_json(200, {"ok": True, "users": out[:50]})
                return
            if path == "/api/friends":
                friends = [r["b"] for r in conn.execute("SELECT b FROM friends WHERE a=?", (key,))]
                inc = [r["frm"] for r in conn.execute("SELECT frm FROM requests WHERE to_=?", (key,))]
                outg = [r["to_"] for r in conn.execute("SELECT to_ FROM requests WHERE frm=?", (key,))]
                with db() as c2:
                    pass
                self._send_json(200, {
                    "ok": True,
                    "friends": [self._display(users, k) for k in friends],
                    "incoming": [self._display(users, k) for k in inc],
                    "outgoing": [self._display(users, k) for k in outg],
                })
                return
            if path == "/api/messages":
                other = str(q.get("with", "")).strip().lower()
                try:
                    since = int(q.get("since", 0) or 0)
                except ValueError:
                    since = 0
                rows = conn.execute(
                    "SELECT id, frm, to_, body, created FROM messages "
                    "WHERE ((frm=? AND to_=?) OR (frm=? AND to_=?)) AND id>? ORDER BY id",
                    (key, other, other, key, since),
                ).fetchall()
                self._send_json(200, {"ok": True, "messages": [dict(r) for r in rows]})
                return
            if path == "/api/invites":
                rows = conn.execute(
                    "SELECT id, frm, to_, kind, payload, created FROM invites WHERE to_=? ORDER BY id DESC",
                    (key,),
                ).fetchall()
                out = []
                for r in rows:
                    d = dict(r)
                    d["from"] = self._display(users, r["frm"])["name"]
                    out.append(d)
                self._send_json(200, {"ok": True, "invites": out})
                return
        self._send_json(404, {"ok": False, "error": "Неизвестный запрос"})

    def _social_post(self, path, data):
        key = self._key_or_401(data.get("token"))
        if not key:
            return
        users = load_users()
        now = datetime.now().isoformat(timespec="seconds")

        def other_key():
            return str(data.get("to", data.get("name", data.get("from", "")))).strip().lower()

        with db() as conn:
            if path == "/api/friends/request":
                to = other_key()
                if not to or to == key or to not in users:
                    self._send_json(404, {"ok": False, "error": "Пользователь не найден"})
                    return
                conn.execute("INSERT OR IGNORE INTO requests (frm,to_,created) VALUES (?,?,?)", (key, to, now))
                # если вторая сторона уже отправила заявку — сразу подружиться
                inv = conn.execute("SELECT 1 FROM requests WHERE frm=? AND to_=?", (to, key)).fetchone()
                if inv:
                    self._add_friends(conn, key, to, now)
                    conn.execute("DELETE FROM requests WHERE (frm=? AND to_=?) OR (frm=? AND to_=?)", (key, to, to, key))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/friends/accept":
                frm = other_key()
                conn.execute("DELETE FROM requests WHERE frm=? AND to_=?", (frm, key))
                self._add_friends(conn, key, frm, now)
                self._send_json(200, {"ok": True})
                return
            if path == "/api/friends/remove":
                nm = other_key()
                conn.execute("DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)", (key, nm, nm, key))
                conn.execute("DELETE FROM requests WHERE (frm=? AND to_=?) OR (frm=? AND to_=?)", (key, nm, nm, key))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/messages":
                to = str(data.get("to", "")).strip().lower()
                body = str(data.get("body", "")).strip()[:1000]
                if not to or to not in users or not body:
                    self._send_json(400, {"ok": False, "error": "Пустое сообщение"})
                    return
                conn.execute("INSERT INTO messages (frm,to_,body,created) VALUES (?,?,?,?)", (key, to, body, now))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/invites":
                to = str(data.get("to", "")).strip().lower()
                kind = str(data.get("kind", "friend"))[:20]
                payload = json.dumps(data.get("payload", {}), ensure_ascii=False)[:1000]
                if not to or to not in users:
                    self._send_json(404, {"ok": False, "error": "Пользователь не найден"})
                    return
                conn.execute("INSERT INTO invites (frm,to_,kind,payload,created) VALUES (?,?,?,?,?)", (key, to, kind, payload, now))
                self._send_json(200, {"ok": True})
                return
            if path == "/api/invites/clear":
                try:
                    iid = int(data.get("id", 0))
                except (TypeError, ValueError):
                    iid = 0
                conn.execute("DELETE FROM invites WHERE id=? AND to_=?", (iid, key))
                self._send_json(200, {"ok": True})
                return
        self._send_json(404, {"ok": False, "error": "Неизвестный запрос"})

    @staticmethod
    def _add_friends(conn, a, b, now):
        conn.execute("INSERT OR IGNORE INTO friends (a,b,created) VALUES (?,?,?)", (a, b, now))
        conn.execute("INSERT OR IGNORE INTO friends (a,b,created) VALUES (?,?,?)", (b, a, now))

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
    init_db()

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
