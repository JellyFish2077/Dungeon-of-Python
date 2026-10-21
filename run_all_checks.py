"""Прогон всех проверок проекта одной командой.

Зачем это нужно: проверок в проекте около тысячи, но они разбросаны по семи
скриптам и запускались вручную. Из-за этого легко закоммитить регрессию,
не прогнав нужный скрипт. Этот раннер запускает их все, печатает итог по
каждому и возвращает ненулевой код, если что-то упало.

    python run_all_checks.py            # всё, что доступно в этой системе
    python run_all_checks.py --quick    # только проверки на чистом Python
    python run_all_checks.py --only verify_server check

Проверки, которым нужен node (verify_variants, verify_practice,
verify_dungeon), без него пропускаются с явной пометкой, а прогон получает
ненулевой код: пропуск — не то же самое, что успех. Опечатка в --only тоже
ошибка, а не «ноль проверок, всё хорошо».

Проверка веб-сборки (verify_web.py) необязательная: без Playwright или
браузера она печатает причину и не валит прогон. В --quick не входит.
"""
import argparse
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))

# Консоль Windows по умолчанию cp1251 и падает на «×», «→» и кириллице из
# отчётов проверок. Печатаем UTF-8, иначе раннер сам становится ошибкой.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

# Порядок важен: сперва быстрые и не поднимающие сервер, потом тяжёлые.
# needs: None — чистый Python (входит в --quick), "node" — нужен Node.js,
# "browser" — нужен Playwright (необязательная проверка).
ALL_CHECKS = [
    ("check.py", "банк контента и синхронность схемы админки", None),
    ("verify_server.py", "сервер, профили, песочница", None),
    ("verify_variants.py", "генератор вариантов вопросов", "node"),
    ("verify_practice.py", "генератор практики, прогон кода на Python", "node"),
    ("verify_dungeon.py", "подземелье: 900+ проверок в node", "node"),
    ("verify_admin.py", "админ-панель: вход, правка, откат", None),
    ("verify_web.py", "публичная веб-сборка (Playwright)", "browser"),
]


def has_node():
    return shutil.which("node") is not None


def run(script, quiet=False):
    """Запускает проверку, печатает её вывод, возвращает (код, секунды)."""
    started = time.time()
    proc = subprocess.run(
        [sys.executable, script],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        encoding="utf-8",
        errors="replace",
    )
    elapsed = time.time() - started
    out = proc.stdout or ""
    tail = out.strip().splitlines()
    summary = [ln for ln in tail if "Итог" in ln or "хорошо" in ln or "СБОЙ" in ln]
    if proc.returncode == 0:
        if not quiet:
            for line in summary[-1:]:
                print("      " + line.strip())
    elif proc.returncode == 3:
        # Необязательная проверка не выполнена (нет Playwright/браузера).
        # Печатаем только причину, без «скрипт упал».
        reason = next((ln.strip() for ln in tail if "Пропуск" in ln), tail[0] if tail else "")
        if reason:
            print("      " + reason)
    else:
        print(out.rstrip())
        if not summary:
            print("(скрипт завершился с кодом %d)" % proc.returncode)
    return proc.returncode, elapsed


def main():
    ap = argparse.ArgumentParser(description="Прогон всех проверок проекта")
    ap.add_argument("--quick", action="store_true",
                    help="только проверки на чистом Python, без node")
    ap.add_argument("--only", nargs="*", default=None,
                    help="запустить только перечисленные скрипты")
    args = ap.parse_args()

    checks = ALL_CHECKS
    if args.quick:
        checks = [c for c in checks if c[2] is None]
    if args.only is not None:
        # nargs="*" разрешает `--only` без имён. Раньше пустой список был
        # ложным и молча запускал ВСЕ проверки, а опечатка в имени давала
        # ноль проверок и код 0 — то есть «всё зелёное».
        if not args.only:
            print("Ошибка: --only требует хотя бы одно имя проверки.")
            print("Доступно: %s" % ", ".join(c[0] for c in ALL_CHECKS))
            return 2
        wanted = {s if s.endswith(".py") else s + ".py" for s in args.only}
        known = {c[0] for c in ALL_CHECKS}
        unknown = sorted(wanted - known)
        if unknown:
            print("Ошибка: неизвестная проверка: %s" % ", ".join(unknown))
            print("Доступно: %s" % ", ".join(c[0] for c in ALL_CHECKS))
            return 2
        checks = [c for c in checks if c[0] in wanted]
        if not checks:
            print("Ошибка: выбранные проверки не входят в --quick.")
            return 2

    node = has_node()
    print("=" * 62)
    print("  Проверки проекта")
    if not node:
        print("  node не найден: verify_variants, verify_practice, verify_dungeon")
        print("  будут пропущены (это не считается успехом)")
    print("=" * 62)

    failed, skipped, optional_skipped, done = [], [], [], 0
    for script, what, needs in checks:
        if needs == "node" and not node:
            skipped.append(script)
            print("  пропущен  %-20s нужен node" % script)
            continue
        print("  запущено  %-20s %s" % (script, what))
        code, elapsed = run(script)
        done += 1
        if code == 0:
            print("  зелёный   %-20s %.1f с" % (script, elapsed))
        elif code == 3 and needs == "browser":
            # Необязательная проверка: нет Playwright/браузера. Это не провал,
            # но и не «зелено» — печатаем отдельно и не считаем в done.
            optional_skipped.append(script)
            done -= 1
            print("  пропущен  %-20s необязательная" % script)
        else:
            failed.append(script)
            print("  УПАЛ      %-20s %.1f с (код %d)" % (script, elapsed, code))

    print()
    print("=" * 62)
    print("  Прогнано: %d, зелёных: %d, упало: %d, пропущено: %d"
          % (done, done - len(failed), len(failed), len(skipped) + len(optional_skipped)))
    if skipped:
        print("  Пропущены (нужен node): %s" % ", ".join(skipped))
    if optional_skipped:
        print("  Пропущены (необязательные): %s" % ", ".join(optional_skipped))
    if failed:
        print("  УПАЛИ: %s" % ", ".join(failed))
        return 1
    if skipped:
        # Полностью «зелёным» считать прогон, в котором что-то пропустили,
        # нельзя: тихо пропущенная проверка выглядит как пройденная.
        print("  ОСТОРОЖНО: часть проверок не выполнялась из-за отсутствия node")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())