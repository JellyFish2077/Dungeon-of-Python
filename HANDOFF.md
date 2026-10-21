# Передача работы (handoff)

Состояние на 2026-10-21, версия **1.4.0**. Файл для продолжения в новом
терминале: только то, что нужно знать до первого действия.

## Где и что

- Проект: `C:\Users\JellyFish\Downloads\python-quiz-dev` (рабочая копия).
  Клон `C:\Users\JellyFish\python-quiz-dev` — устаревший, не использовать.
- Ветка `progression-and-battle-ui`, последний коммит до 1.4.0 — `f2334c0`.
- Версия приложения: `server.py`, константа `VERSION` (`1.4.0`).
- Два продукта в одном репозитории:
  1. **Классная версия** — `server.py`, аккаунты, результаты, `/admin`;
  2. **Standalone PyDungeon** — `standalone/build/`, без сервера, для Itch.io,
     Python-код проверяется через Pyodide в Web Worker.
- `standalone/build/` и `dist/` — генерируются и в git не входят.
  `*.lnk` тоже в gitignore.

## Срочное

1. **Без изоляции ОС код ученика не запускать.** На Windows нужен WSL:
   при `PYQUIZ_SANDBOX=auto` сервер сам выберет namespaces, если WSL есть.
   Если WSL нет — сервер предупреждает при старте; на занятии используйте
   `--no-code`.
2. Не запускать `verify_admin.py` на рабочей папке без нужды: он теперь
   изолирован (`tempfile` + `PYQUIZ_NO_BACKUP=1`), но пусть так и остаётся.
3. `pre-commit` гоняет `run_all_checks.py --quick` (check, server, admin).
   Полный набор с node — перед занятием/релизом.

## Команды

```
python server.py --local             # только этот компьютер
python server.py --local --dev       # панель разработчика, F2
python server.py --no-code           # без выполнения кода учеников

python run_all_checks.py             # всё, включая node
python run_all_checks.py --quick     # без node
python run_all_checks.py --only verify_server check
python verify_dungeon.py             # подземелье; при сбое код 1
node play_dungeon.js --games=20      # бот проходит подземелье

python launch_game.py                # классная версия + браузер
python launch_standalone.py          # standalone + полноэкранный браузер
python tools/build_web.py            # собрать standalone/build/
python tools/fetch_pyodide.py        # локальный Pyodide (офлайн)
python tools/package_web.py          # dist/pydungeon-standalone-<версия>.zip
```

`?debug=1` открывает `window.__pyquiz`, `__setFloor`, `__validateFloor`,
`__buildFloor` — только при запуске с `--dev`.

## Что сделано в 1.4.0

- Песочница изолирована namespaces: на Windows через WSL, на Linux локально
  через `unshare`; `/mnt`, `/home`, `/tmp`, `/root` скрыты, сети нет.
- `/api/check` берёт тесты из серверного банка по `taskId`, присланные
  клиентом игнорирует; сравнение без `__eq__` ученика.
- `/api/submit`: токен, проверка инвариантов, лимиты, потолок `results.json`.
- `update_user` для профиля; `verify_admin` изолирован; `?debug=1` только
  с `--dev`; лимиты stdout/кэша/сокета.
- Игра: смерть через перезагрузку, `claimRepeat`, цепь в деревне, развилка,
  `nomiss`, привалы, побег из боя, улучшения с паузы, банк золота при победе,
  битый сейв.
- Standalone: `build_web.py` (относительные пути, без `/api/*`),
  `web-boot.js` (локальный профиль), Pyodide в Web Worker, локальный Pyodide,
  `package_web.py`, лаунчеры, ярлык.
- Проверки: 82 в `verify_server`, 964 в `verify_dungeon`; полный прогон
  зелёный.

## Где остановились

Прототип публичной сборки 1.4.0 собран (`standalone/build`, zip 6 МБ,
Pyodide 14 МБ), изменения закоммичены (`22befb5`, `9f9a8fc`, `0b2342e`),
рабочее дерево чистое.

- **`verify_web.py` пройден на Windows в Edge: 11/11**
  (`python verify_web.py --browser msedge`); в `run_all_checks.py` проверка
  необязательная, в `--quick` не входит.
- в `RELEASE.md` **22 пункта не отмечены** (0 checked): осталось вручную
  Firefox, кнопка `⛶`, окно стража и «следующий шаг», touch, Itch-iframe;
- из M1 не сделаны: touch-управление, туториал (бой/сундук/костёр),
  полноценный итог похода, выбор сложности на стартовом экране;
- нумерация: `RELEASE.md` говорит про публичный **1.0.0**, приложение уже
  `1.4.0` — решить, что считать публичной версией.

## План (из ROADMAP.md)

Следующий спринт — **M0 + M1**. Балансные числа до M1–M2 не менять.

**M0:**
1. `verify_web.py` на Windows — пройден 21.10.2026 в Edge, 11/11.
2. Пройти `RELEASE.md` руками: Edge, Firefox, офлайн (заблокировать CDN),
   `localStorage.clear()`, битый сейв, 390×844, fullscreen, Itch-iframe.
3. Проверить, что zip воспроизводится одной командой и печатает sha256.

**M1:**
4. Touch-управление (ходьба/действие).
5. Туториал: один бой, один сундук, один костёр.
6. Итог похода: этаж, золото, материалы, что потеряно, что купить дальше.
7. Выбор сложности на стартовом экране.

**M2 (после плейтестов):** журнал забегов, 10–20 плейтестов, сокращение
гриндилки, смягчение ранних этажей, 100+ кампаний бота, таблица до/после.

## Проверить только на Windows

- `sandbox_backend()` должен вернуть `wsl` при установленном WSL. Если WSL
  нет — сервер честно скажет «песочница без изоляции ОС».
- Job Object: при `process`-режиме без WSL `server.py` отказывается выполнять
  код, если не удалось применить лимит памяти (fail-closed).

## Заметки

- `.claude/` (только `launch.json`) не коммитится — локальный конфиг.
- `_backup/` может содержать снимки от автотестов; перед коммитом не мешает
  удалить свежие, но настоящий снимок перед занятием не трогать.
- Число проверок подземелья зависит от случайной генерации (в 1.4.0 — 964);
  управляемого seed пока нет.
- `SECURITY.md` описывает границы песочницы актуально для 1.4.0.
