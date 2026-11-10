#!/usr/bin/env python3
"""Сценарные E2E-проверки поверх DEV-сборки.

Проверяются три сценария, которые неудобно гонять в node:
  * все пять боссов: запуск, фазы 1→2→3, победа и трофей;
  * первый диалог учителя: приветствие, «Далее» и открытие школы;
  * удержание клавиши: один шаг сразу, автоповтор после паузы.

Скрипт сам собирает DEV-сборку, потому что сценарии используют `?debug=1`,
`window.__setFloor` и панель разработчика. После него build_audit.py
пересобирает публичную сборку.

Запуск:
    python verify_scenarios.py
    python verify_scenarios.py --browser msedge
"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

from verify_web import RESULTS, check, launch, serve  # noqa: E402

BOSSES = [
    (2, "goblin", "Гоблин-вожак"),
    (5, "necromancer", "Некромант"),
    (8, "golem", "Король големов"),
    (11, "demon", "Владыка демонов"),
    (14, "dragon", "Дракон"),
]


def ensure_dev_build():
    print("DEV-сборка для сценарных проверок…")
    code = subprocess.call(
        [sys.executable, os.path.join(ROOT, "tools", "build_web.py"), "--dev"],
        cwd=ROOT,
    )
    return code == 0 and os.path.isfile(os.path.join(ROOT, "standalone", "build", "index.html"))


def close_menu(page):
    page.evaluate("() => window.PyMenu && window.PyMenu.close && window.PyMenu.close()")


def start_game(page, base):
    page.goto(base + "/?debug=1")
    page.wait_for_timeout(700)
    page.evaluate("() => document.getElementById('menu-new').click()")
    page.wait_for_timeout(350)
    if page.evaluate("() => !document.getElementById('confirm-overlay').classList.contains('hidden')"):
        page.click("#confirm-ok")
        page.wait_for_timeout(350)
    page.evaluate("() => window.__PYQUIZ_WEB_API.begin()")
    close_menu(page)
    page.wait_for_selector(".ent-player", timeout=30000)
    page.wait_for_function(
        "() => document.getElementById('level-loading').classList.contains('hidden')",
        timeout=30000)


def open_dev(page):
    page.evaluate("() => { const b=document.getElementById('dev-toggle'); if (b) b.click(); }")
    page.wait_for_timeout(150)


def click_dev(page, selector):
    page.evaluate("(sel) => { const n=document.querySelector(sel); if (n) n.click(); }", selector)
    page.wait_for_timeout(120)


def wait_floor(page):
    page.wait_for_function(
        "() => document.getElementById('level-loading').classList.contains('hidden')",
        timeout=30000)
    page.wait_for_timeout(300)


def stored_trophies(page):
    raw = page.evaluate("() => localStorage.getItem('pyquiz_profiles_v1')")
    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return set()
    out = set()
    for profile in data.values():
        if isinstance(profile, dict):
            out.update(profile.get("trophies") or [])
    return out


def boss_scenarios(page):
    open_dev(page)
    for floor, key, name in BOSSES:
        page.evaluate("(i) => window.__setFloor(i)", floor)
        wait_floor(page)
        click_dev(page, "#dev-panel [data-dev-tab='world']")
        click_dev(page, "#dev-panel [data-dev='boss-start'][data-key='" + key + "']")
        page.wait_for_function("() => !!window.__pyquiz.battle", timeout=10000)
        page.wait_for_timeout(200)
        state = page.evaluate(
            "() => ({ name: window.__pyquiz.battle.enemy.name, phase: window.__pyquiz.battle.enemy.bossPhase })")
        check(state.get("name") == name and state.get("phase") == 1,
              "босс %s: имя и первая фаза" % key, state)
        click_dev(page, "#dev-panel [data-dev-tab='battle']")
        click_dev(page, "#dev-panel [data-dev='battle-phase']")
        phase2 = page.evaluate("() => window.__pyquiz.battle && window.__pyquiz.battle.enemy.bossPhase")
        click_dev(page, "#dev-panel [data-dev='battle-phase']")
        phase3 = page.evaluate("() => window.__pyquiz.battle && window.__pyquiz.battle.enemy.bossPhase")
        check(phase2 == 2 and phase3 == 3,
              "босс %s: фазы 2 и 3" % key, "%s -> %s" % (phase2, phase3))
        click_dev(page, "#dev-panel [data-dev='enemy-hp'][data-pct='1']")
        click_dev(page, "#dev-panel [data-dev='battle-win']")
        page.wait_for_timeout(500)
        check(not page.evaluate("() => !!window.__pyquiz.battle"),
              "босс %s: бой завершается победой" % key)
        # Финальный дракон может открыть экран победы: для следующего
        # сценария убираем его, но трофей уже записан в профиль.
        page.evaluate("""() => {
          const end = document.getElementById('end-overlay');
          if (end) end.classList.add('hidden');
          if (window.__pyquiz) window.__pyquiz.finishedVictory = false;
        }""")
    trophies = stored_trophies(page)
    expected = {"goblin_banner", "necro_seal", "golem_core", "demon_horn", "dragon_heart"}
    check(expected.issubset(trophies), "все трофеи боссов записались в профиль",
          sorted(trophies))


def reload_scenario(page, base):
    # Профиль и трофеи должны пережить перезагрузку страницы. Новую игру
    # начинаем уже после reload: сюжет сбрасывается, коллекция — нет.
    page.goto(base + "/?debug=1")
    page.wait_for_function("() => window.PyMenu && window.PyMenu.isOpen()", timeout=20000)
    page.wait_for_timeout(400)
    start_game(page, base)
    open_dev(page)
    click_dev(page, "#dev-panel [data-dev-tab='world']")
    click_dev(page, "#dev-panel [data-dev='village']")
    page.wait_for_timeout(500)
    bank = page.evaluate("() => document.getElementById('village-bank').innerText")
    check("Знамя вожака" in bank and "Сердце дракона" in bank,
          "трофеи боссов переживают перезагрузку", bank[:160])


def dialogue_scenario(page):
    page.evaluate("() => window.__setFloor(0)")
    wait_floor(page)
    click_dev(page, "#dev-panel [data-dev-tab='world']")
    click_dev(page, "#dev-panel [data-dev='village']")
    page.wait_for_timeout(500)
    click_dev(page, "#dev-panel [data-dev='school']")
    page.wait_for_function("() => window.__pyquiz && window.__pyquiz.place === 'house'", timeout=10000)
    page.wait_for_timeout(250)
    page.evaluate("() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true, cancelable: true }))")
    page.wait_for_timeout(250)
    greeting = page.evaluate("() => ({ visible: !document.getElementById('talk-overlay').classList.contains('hidden'), speaker: document.getElementById('talk-speaker').textContent })")
    check(greeting.get("visible") and "Учитель" in greeting.get("speaker", ""),
          "учитель здоровается при первом разговоре", greeting)
    page.evaluate("() => document.getElementById('talk-next').click()")
    page.wait_for_timeout(150)
    page.evaluate("() => document.getElementById('talk-next').click()")
    page.wait_for_timeout(300)
    school = page.evaluate("() => ({ talk: document.getElementById('talk-overlay').classList.contains('hidden'), school: !document.getElementById('school-overlay').classList.contains('hidden') })")
    check(school.get("talk") and school.get("school"),
          "после приветствия открывается школа", school)


def hold_scenario(page):
    page.evaluate("() => document.getElementById('school-overlay').classList.add('hidden')")
    page.evaluate("() => { if (window.PyMenu) window.PyMenu.close(); }")
    click_dev(page, "#dev-panel [data-dev='village']")
    page.wait_for_timeout(500)
    if page.evaluate("() => !document.getElementById('school-overlay').classList.contains('hidden')"):
        page.evaluate("() => document.getElementById('school-overlay').classList.add('hidden')")
    start = page.evaluate("() => ({ ...window.__pyquiz.playerPos })")
    page.keyboard.down("a")
    page.wait_for_timeout(850)
    one = page.evaluate("() => ({ ...window.__pyquiz.playerPos })")
    page.wait_for_timeout(1600)
    auto = page.evaluate("() => ({ ...window.__pyquiz.playerPos })")
    page.keyboard.up("a")
    page.wait_for_timeout(250)
    stopped = page.evaluate("() => ({ ...window.__pyquiz.playerPos })")
    check(one.get("x") != start.get("x") or one.get("y") != start.get("y"),
          "удержание: первый шаг сразу", "%s -> %s" % (start, one))
    check(auto.get("x") != one.get("x") or auto.get("y") != one.get("y"),
          "удержание: после паузы включается автоповтор", "%s -> %s" % (one, auto))
    check(stopped == auto, "удержание: после отпускания движение стоит", "%s -> %s" % (auto, stopped))


def run_scenarios(browser, base):
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.on("pageerror", lambda error: check(False, "нет JS-исключений", str(error)))
    try:
        start_game(page, base)
        boss_scenarios(page)
        reload_scenario(page, base)
        dialogue_scenario(page)
        hold_scenario(page)
    finally:
        page.close()


def main():
    ap = argparse.ArgumentParser(description="Сценарные E2E-проверки PyDungeon")
    ap.add_argument("--browser", default="chromium",
                    choices=["chromium", "msedge", "edge", "firefox", "ff",
                             "webkit", "safari"])
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Пропуск: не установлен Playwright.")
        return 3

    if not ensure_dev_build():
        print("Сбой: не удалось собрать DEV-версию.")
        return 1

    server, base = serve()
    try:
        with sync_playwright() as pw:
            try:
                browser = launch(pw, args.browser)
            except Exception as exc:  # noqa: BLE001
                print("Пропуск: браузер не запускается: %s" % exc)
                return 3
            if browser is None:
                print("Пропуск: браузер Playwright не найден.")
                return 3
            try:
                run_scenarios(browser, base)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()

    ok = sum(RESULTS)
    print()
    print("Итог: %d/%d проверок пройдено." % (ok, len(RESULTS)))
    return 0 if ok == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
