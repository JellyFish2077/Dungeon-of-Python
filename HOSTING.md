# Публикация PyDungeon

Публичная версия — это статическая игра из `standalone/build/`. Сервер,
аккаунты и база данных для неё не нужны: профиль и сохранения лежат в
`localStorage`, Python-код выполняется через Pyodide в браузере.

Один и тот же билд публикуется в двух местах:

| Канал | Что загружается |
|---|---|
| GitHub Pages | содержимое `standalone/build/` в ветку `gh-pages` |
| Itch.io | zip из `standalone/build/` с `index.html` в корне |

## Сборка

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
```

`fetch_pyodide.py` кладёт Pyodide в сборку. Без него игра работает, но тянет
runtime с CDN.

## GitHub Pages

Источник Pages: **Deploy from a branch** → `gh-pages` → `/ (root)`.
Файл `.nojekyll` должен лежать в корне ветки.

Обновление вручную:

1. Собрать `standalone/build/`.
2. Заменить содержимое `gh-pages` содержимым сборки.
3. Добавить `.nojekyll`.
4. Закоммитить и запушить ветку.

Или через GitHub Actions: workflow **deploy-pages** (`workflow_dispatch`).
Он прогоняет `run_all_checks.py --quick`, собирает `standalone/build`,
скачивает Pyodide и публикует ветку `gh-pages`. Автозапуска по push нет:
до закрытия P0 публикация остаётся ручной.

Workflow **verify** запускается на push и pull request и гоняет быстрые
проверки.

Адрес: https://jellyfish2077.github.io/Dungeon-of-Python/

## Itch.io

```bash
python tools/package_web.py
```

Архив `dist/pydungeon-standalone-*.zip` загружается как HTML-игра. В корне
архива — `index.html`, все пути относительные. Размер сборки с локальным
Pyodide — около 15 МБ.

## Проверка перед публикацией

```bash
python verify_web.py --browser msedge
python verify_web.py --browser firefox
python verify_web.py --browser webkit   # Safari/WebKit
```

Проверка собирает standalone-версию и проходит игру в браузере: меню,
сохранения, Pyodide, HUD, журнал. Отдельно проверяется, что игра не делает
запросов к `/api/*`.
