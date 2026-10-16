"""Проверка боевой логики подземелья без браузера.

Склеивает статические JS-файлы в один скрипт, выполняет его в Node с
минимальными заглушками DOM и прогоняет сценарии: ловушки, яд,
особые эффекты предметов, сохранение/загрузку, экраны конца партии.

Заглушки DOM и приёмники лежат отдельно — в tools/game_harness.js, их же
использует play_dungeon.py, чтобы бот и проверка гоняли один и тот же код.
"""
import json
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).parent
DRIVER = BASE / "_verify_dungeon.js"
HARNESS = BASE / "tools" / "game_harness.js"
CHECKS = BASE / "tools" / "checks.js"

DRIVER_SRC = (
    HARNESS.read_text(encoding='utf-8')
    + '\n' + CHECKS.read_text(encoding='utf-8')
)

DRIVER.write_text(DRIVER_SRC, encoding="utf-8")

# Консоль Windows по умолчанию живёт в cp1251 и падает на «×», «→» и прочих
# знаках из пояснений. Печатать отчёт в UTF-8 надёжнее, чем вычищать символы.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

proc = subprocess.run(
    ["node", str(DRIVER)],
    cwd=str(BASE),
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
)

stdout = proc.stdout or ""
marker = "__JSON__"
if marker not in stdout:
    sys.stdout.write(stdout)
    if proc.stderr:
        sys.stderr.write("--- stderr ---\n" + proc.stderr)
    print("\nПРОБА НЕ ДОШЛА ДО ОТЧЁТА")
    DRIVER.unlink(missing_ok=True)
    sys.exit(1)

payload = stdout.split(marker, 1)[1]
results = json.loads(payload.strip().splitlines()[0])

failed = [r for r in results if not r["ok"]]
for r in results:
    mark = "  ok  " if r["ok"] else " СБОЙ "
    detail = ("   -> " + r["extra"]) if (r["extra"] and not r["ok"]) else (
        ("   (" + r["extra"] + ")") if r["extra"] else "")
    print(f"[{mark}] {r['name']}{detail}")

if proc.stderr:
    err = proc.stderr.strip()
    if err:
        sys.stderr.write("--- stderr ---\n" + err + "\n")

print()
print(f"Итог: {len(results) - len(failed)}/{len(results)} проверок пройдено.")
DRIVER.unlink(missing_ok=True)