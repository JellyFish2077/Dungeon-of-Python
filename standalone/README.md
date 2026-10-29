# PyDungeon Standalone

Одиночная браузерная версия: без сервера, аккаунтов, друзей, панели учителя
и админки. Профиль и сохранения — в `localStorage`, Python-код проверяется
через Pyodide в Web Worker.

## Сборка

```bash
python tools/build_web.py
python tools/fetch_pyodide.py      # офлайн-вариант, ~5.5 МБ
python tools/package_web.py        # dist/pydungeon-standalone-<версия>.zip
```

Проверка локально:

```bash
python launch_standalone.py
# или
python -m http.server 8080 --directory standalone/build
```

## Что где

- `static/game.html` — игра; при сборке она же становится корневым
  `index.html`, поэтому сайт открывается сразу в главном меню.
- `standalone/build/` — генерируемая сборка; в git не входит.
- `static/` — общий игровой движок и контент; его же использует классный
  серверный режим.
- `launch_standalone.py` — локальный статический сервер + браузер.
- `tools/build_web.py` — сборка.
- `tools/fetch_pyodide.py` — локальный Pyodide.
- `tools/package_web.py` — zip для Itch.io.
- `RELEASE.md` — чек-лист релиза.

Классная версия (`server.py`, аккаунты, результаты, `/admin`) остаётся
отдельной и в standalone-сборку не входит.
