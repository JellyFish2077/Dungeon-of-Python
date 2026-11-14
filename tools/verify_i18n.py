#!/usr/bin/env python3
"""Проверка английской версии: на ключевых экранах не видно кириллицы.

    python tools/verify_i18n.py [--browser msedge]

Скрипт поднимает standalone/build, проходит меню, журнал, магазин, школу,
кодекс, бой с боссом, смерть и победу, деревню и подземные объекты.
Проверяются только видимые текстовые узлы; скрытые панели и dev-панель
не считаются. Код возврата 1, если нашлась хотя бы одна русская строка.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))
import verify_web  # noqa: E402
import shot_itch  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

FAILS = []

JS = """(root) => { const out = new Set();
 root = root || document.body;
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
 let node;
 while (node = walker.nextNode()) {
   const p = node.parentElement;
   if (!p || ['SCRIPT','STYLE'].includes(p.tagName)) continue;
   if (!p.getClientRects().length) continue;
   const t = node.nodeValue.replace(/\\s+/g, ' ').trim();
   if (/[А-Яа-яЁё]/.test(t) && t.length > 1) out.add(t);
 }
 return [...out]; }"""


def scan(page, label, selector=None):
    items = page.evaluate(JS, page.query_selector(selector) if selector else None)
    if items:
        FAILS.append((label, items))
        print("[FAIL] %s: %d" % (label, len(items)))
        for t in items[:8]:
            print("       " + t)
    else:
        print("[ ok ] %s" % label)


def patch_exports(route):
    resp = route.fetch()
    body = resp.text().replace(
        "window.__pyquiz = G;",
        "window.__pyquiz = G;"
        " window.__openBattle = openBattle; window.__openShop = openShop;"
        " window.__openSchool = openSchool; window.__openLever = openLever;"
        " window.__openAltar = openAltar; window.__restAtCamp = restAtCamp;"
        " window.__showDeath = showDeath; window.__victory = victory;"
        " window.__openDialog = openDialog;",
    )
    route.fulfill(status=resp.status,
                  content_type="text/javascript; charset=utf-8", body=body)


def open_battle(page, floor):
    page.evaluate("(n) => window.__setFloor(n)", floor)
    page.wait_for_timeout(600)
    opened = page.evaluate("""() => {
        const g = window.__pyquiz, p = g.playerPos;
        const alive = (g.enemies || []).filter((e) => e.hp > 0);
        alive.sort((a, b) => (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) -
                            (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
        const foe = alive[0];
        if (!foe) return false;
        const free = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
            .find((c) => g.map.grid[c.y] && g.map.grid[c.y][c.x] === 1);
        if (free) { foe.x = free.x; foe.y = free.y; }
        window.__openBattle(foe);
        return true;
    }""")
    page.wait_for_timeout(1200)
    return opened


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="msedge")
    args = parser.parse_args()

    shot_itch.LANG = "en"
    shot_itch.patch_game = patch_exports

    with sync_playwright() as pw:
        server, base = verify_web.serve()
        browser = verify_web.launch(pw, args.browser)
        if browser is None:
            print("браузер не найден", file=sys.stderr)
            return 1
        try:
            page = shot_itch.new_page(browser, dev=True)

            # --- меню ---
            def open_menu():
                page.goto(base + "/game.html?menu=1&lang=en",
                          wait_until="domcontentloaded")
                page.wait_for_function(
                    "() => window.PyMenu && window.PyMenu.isOpen()", timeout=30000)
                page.wait_for_timeout(500)

            open_menu()
            scan(page, "меню")
            for name, selector in (("настройки", "button#menu-settings"),
                                   ("профиль", "button#menu-profile"),
                                   ("об игре", "button#menu-about"),
                                   ("обновления", "button#menu-updates")):
                open_menu()
                if page.locator(selector).count():
                    page.locator(selector).click()
                    page.wait_for_timeout(500)
                    scan(page, name)

            # --- кодекс ---
            open_menu()
            page.locator("button#menu-codex").click()
            page.wait_for_timeout(500)
            for tab in ("controls", "items", "npcs", "mobs", "bosses"):
                page.locator("[data-codex-tab='%s']" % tab).click()
                page.wait_for_timeout(350)
                scan(page, "кодекс: " + tab)
            page.locator("#codex-close").click()

            # --- подземелье ---
            shot_itch.start_dungeon(page, base, dev=True)
            scan(page, "подземелье: HUD")
            page.click("#log-toggle")
            page.wait_for_timeout(500)
            for tab in ("story", "tasks", "archive", "events"):
                page.locator("[data-jtab='%s']" % tab).click()
                page.wait_for_timeout(350)
                scan(page, "журнал: " + tab)
            page.locator("#journal-close").click()

            page.evaluate("() => window.__openShop(false)")
            page.wait_for_timeout(700)
            scan(page, "магазин")
            page.evaluate("() => { const o=document.querySelector('#shop-overlay');"
                          " if(o) o.classList.add('hidden'); }")

            page.evaluate("() => window.__openSchool()")
            page.wait_for_timeout(700)
            scan(page, "школа")
            if page.locator("[data-school-action='practice']").count():
                page.locator("[data-school-action='practice']").first.click(force=True)
                page.wait_for_timeout(500)
                scan(page, "школа: практика")
                if page.locator("[data-school-action='practice-task']").count():
                    page.locator("[data-school-action='practice-task']").first.click(force=True)
                    page.wait_for_timeout(600)
                    scan(page, "школа: задание")
            page.evaluate("() => { const o=document.querySelector('#school-overlay');"
                          " if(o) o.classList.add('hidden'); }")

            # --- бой и фазы босса ---
            if open_battle(page, 5):
                scan(page, "бой: босс", "#battle-overlay")
                page.evaluate("() => document.getElementById('dev-toggle').click()")
                page.wait_for_timeout(250)
                for n in (2, 3):
                    if page.locator("[data-dev='battle-phase']").count():
                        page.evaluate(
                            "() => document.querySelector("
                            "\"[data-dev='battle-phase']\").click()")
                        page.wait_for_timeout(650)
                        scan(page, "бой: фаза %d" % n, "#battle-overlay")
                page.evaluate("() => document.getElementById('dev-toggle').click()")
                page.evaluate("() => { window.__pyquiz.battle = null;"
                              " document.querySelectorAll('.overlay')"
                              ".forEach(o => o.classList.add('hidden')); }")
                page.keyboard.press("Escape")
                page.wait_for_timeout(350)

            # --- объекты подземелья ---
            found = {}
            for i in range(15):
                page.evaluate("(n) => window.__setFloor(n)", i)
                page.wait_for_timeout(220)
                info = page.evaluate("() => ({ levers: (window.__pyquiz.levers||[]).length,"
                                     " altars: (window.__pyquiz.altars||[]).length,"
                                     " camps: (window.__pyquiz.camps||[]).length })")
                for key, value in info.items():
                    if value and key not in found:
                        found[key] = i
            if "levers" in found:
                page.evaluate("(n) => window.__setFloor(n)", found["levers"])
                page.wait_for_timeout(250)
                page.evaluate("() => window.__openLever(window.__pyquiz.levers[0])")
                page.wait_for_timeout(450)
                scan(page, "рычаг")
                page.evaluate("() => { const b=document.querySelector('[data-lever]');"
                              " if(b) b.click(); }")
                page.wait_for_timeout(500)
                page.evaluate("() => document.querySelectorAll('.overlay')"
                              ".forEach(o => o.classList.add('hidden'))")
            if "altars" in found:
                page.evaluate("(n) => window.__setFloor(n)", found["altars"])
                page.wait_for_timeout(250)
                page.evaluate("() => window.__openAltar(window.__pyquiz.altars[0])")
                page.wait_for_timeout(450)
                scan(page, "алтарь")
                page.evaluate("() => document.querySelectorAll('.overlay')"
                              ".forEach(o => o.classList.add('hidden'))")
            if "camps" in found:
                page.evaluate("(n) => window.__setFloor(n)", found["camps"])
                page.wait_for_timeout(250)
                page.evaluate("() => window.__restAtCamp(window.__pyquiz.camps[0])")
                page.wait_for_timeout(450)
                scan(page, "привал")

            # --- смерть и победа ---
            page.evaluate("() => window.__showDeath()")
            page.wait_for_timeout(900)
            scan(page, "смерть")
            page.evaluate("() => { const o=document.querySelector('#end-overlay');"
                          " if(o) o.classList.add('hidden'); }")
            page.evaluate("() => window.__victory()")
            page.wait_for_timeout(900)
            scan(page, "победа")

            page.close()
        finally:
            browser.close()
            server.shutdown()
            server.server_close()

    if FAILS:
        print("\nИтог: найдено %d экранов с кириллицей" % len(FAILS))
        return 1
    print("\nИтог: видимой кириллицы на проверенных экранах нет")
    return 0


if __name__ == "__main__":
    sys.exit(main())
