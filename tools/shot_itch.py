#!/usr/bin/env python3
"""Свежие скриншоты для страницы Itch.io: меню, деревня, журнал, бой.

    python tools/shot_itch.py [--browser msedge] [--lang ru|en]

Снимается не макет, а настоящая сборка из standalone/build — та самая,
из которой tools/package_web.py собирает архив. Поэтому кадры не устаревают
отдельно от игры: перед запуском пересоберите веб-версию.

Основная страница Itch — английская, для неё запускайте с --lang en:
кадры получат суффикс -en (menu-en.png и т.д.), русские останутся нетронутыми.

Картинки кладутся в assets/itch/screenshots/ в размере 1280×800 — ровно
тот viewport, что указан в настройках страницы Itch.
"""
import argparse
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import verify_web

OUT = ROOT / "assets" / "itch" / "screenshots"
VIEW = {"width": 1280, "height": 800}
LANG = "ru"


def out_path(name):
    """menu.png для русского, menu-en.png для английского набора."""
    return OUT / (name + ("" if LANG == "ru" else "-" + LANG) + ".png")


def patch_game(route):
    """Открывает бой напрямую: иначе до врага пришлось бы идти по карте."""
    resp = route.fetch()
    body = resp.text().replace(
        "window.__pyquiz = G;",
        "window.__pyquiz = G; window.__openBattle = openBattle;",
    )
    route.fulfill(
        status=resp.status,
        content_type="text/javascript; charset=utf-8",
        body=body,
    )


def patch_boot(route):
    resp = route.fetch()
    body = resp.text().replace("dev: false", "dev: true")
    route.fulfill(
        status=resp.status,
        content_type="text/javascript; charset=utf-8",
        body=body,
    )


def new_page(browser, dev=False):
    """Страница на настоящей сборке. dev — только для кадра с боем.

    DEV-режим даёт доступ к состоянию игры, но рисует в углу кнопку «DEV»,
    поэтому в кадр он попадать не должен: см. tidy().
    """
    page = browser.new_context(viewport=VIEW).new_page()
    page.on("pageerror", lambda exc: print("  ! %s" % exc, file=sys.stderr))
    page.route(re.compile(r".*/static/game\.js.*"), patch_game)
    if dev:
        page.route(re.compile(r".*/static/web-boot\.js.*"), patch_boot)
    return page


def tidy(page):
    """Убирает служебные элементы: кнопку DEV и суффикс -web у версии."""
    page.evaluate(
        """() => {
            document.getElementById("dev-toggle")?.remove();
            document.getElementById("dev-panel")?.remove();
            const stamp = window.__PYQUIZ_VERSION
                ? "v" + window.__PYQUIZ_VERSION.version : "";
            if (!stamp) return;
            document.querySelectorAll("body *").forEach((node) => {
                if (!node.children.length && node.textContent.trim() === stamp) {
                    node.textContent = node.textContent.replace("-web", "");
                }
            });
        }"""
    )


def lang_query():
    return "" if LANG == "ru" else "&lang=" + LANG


def start_dungeon(page, base, dev=False):
    page.goto(base + "/game.html?menu=1" + lang_query() + ("&debug=1" if dev else ""),
              wait_until="domcontentloaded")
    page.wait_for_function("() => window.PyMenu && window.PyMenu.isOpen()", timeout=30000)
    page.click("#menu-new")
    # «Новая игра» спрашивает подтверждение: сюжет начнётся заново.
    page.wait_for_timeout(400)
    if page.locator("#confirm-overlay").is_visible():
        page.click("#confirm-ok")
    page.wait_for_function(
        "() => document.querySelectorAll('#map .tile').length > 0", timeout=30000
    )
    page.wait_for_timeout(900)
    page.evaluate("() => window.PyGameMenuAPI.openGuard()")
    page.wait_for_timeout(400)
    page.click("#begin-btn")
    page.wait_for_timeout(2800)
    page.evaluate(
        "() => { const b = document.querySelector('#floor-arrival-close'); if (b) b.click(); }"
    )
    page.wait_for_timeout(500)
    bless = page.locator("#blessing-box [data-bless]")
    if bless.count() and bless.first.is_visible():
        bless.first.click(force=True)
        page.wait_for_timeout(600)


def shot_menu(page, base):
    page.goto(base + "/game.html?menu=1" + lang_query(), wait_until="domcontentloaded")
    page.wait_for_function("() => window.PyMenu && window.PyMenu.isOpen()", timeout=30000)
    page.wait_for_timeout(1400)
    tidy(page)
    page.screenshot(path=str(out_path("menu")))


def shot_battle(page, base):
    start_dungeon(page, base, dev=True)
    page.evaluate(
        """() => {
            const g = window.__pyquiz;
            const p = g.playerPos;
            const alive = (g.enemies || []).filter((e) => e.hp > 0);
            alive.sort((a, b) => (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) -
                                (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
            const foe = alive[0];
            if (!foe) throw new Error("на этаже нет врагов");
            const free = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
                .find((c) => g.map.grid[c.y] && g.map.grid[c.y][c.x] === 1);
            if (free) { foe.x = free.x; foe.y = free.y; }
            window.__openBattle(foe);
        }"""
    )
    page.wait_for_timeout(2200)
    tidy(page)
    page.screenshot(path=str(out_path("battle")))


def shot_journal(page, base):
    start_dungeon(page, base)
    page.click("#log-toggle")
    page.wait_for_function(
        "() => !document.getElementById('journal-overlay').classList.contains('hidden')",
        timeout=15000,
    )
    page.wait_for_timeout(700)
    tidy(page)
    page.screenshot(path=str(out_path("journal")))


def shot_village(page, base):
    start_dungeon(page, base)
    ok = page.evaluate("() => window.PyGameMenuAPI.village()")
    if not ok:
        raise SystemExit("не удалось вернуться в деревню")
    page.wait_for_function(
        "() => window.PyGameMenuAPI.status().place === 'village'", timeout=15000
    )
    # Ждём, пока уйдёт служебный тост «Поход сохранён».
    page.wait_for_timeout(3400)
    tidy(page)
    page.screenshot(path=str(out_path("village")))


def main():
    global LANG
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="msedge")
    parser.add_argument("--lang", choices=("ru", "en"), default="ru")
    args = parser.parse_args()
    LANG = args.lang
    OUT.mkdir(parents=True, exist_ok=True)

    server, base = verify_web.serve()
    try:
        with sync_playwright() as pw:
            browser = verify_web.launch(pw, args.browser)
            if browser is None:
                print("браузер не найден: playwright install или Edge", file=sys.stderr)
                return 1
            try:
                for name, shot in (
                    ("menu", shot_menu),
                    ("battle", shot_battle),
                    ("journal", shot_journal),
                    ("village", shot_village),
                ):
                    page = new_page(browser, dev=(name == "battle"))
                    shot(page, base)
                    page.close()
                    path = out_path(name)
                    print("%-8s %s  %.0f КБ" % (path.stem, path, path.stat().st_size / 1024))
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
