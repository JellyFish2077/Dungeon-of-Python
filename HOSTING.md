# Хостинг на GitHub

У проекта две разные вещи, и хостятся они по-разному.

| Что | Где живёт | Можно ли на GitHub Pages |
|---|---|---|
| Классная версия: `server.py`, аккаунты, `/results`, панель учителя | Python-сервер и его данные | **Нет**: Pages отдаёт только статические файлы |
| Публичная версия: `standalone/build`, Pyodide, `localStorage` | статические HTML/JS/WASM | **Да** |

GitHub Pages публикует только `standalone/build`. Там нет `server.py`, аккаунтов,
`/results` и проверки кода на сервере: код выполняется в браузере через Pyodide,
профиль и сейв лежат в `localStorage`.

## Один раз настроить Pages

1. Перенесите свежий код в ветку `main`. Сейчас удалённая `main` старая, а
   работа лежит в `progression-and-battle-ui`; запушьте её и влейте через PR
   или смержите локально.
2. На GitHub: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**. Не выбирайте «Deploy from a branch»: сборку делает workflow.
3. Запушьте `.github/workflows/pages.yml` в `main`. Workflow сам:
   - собирает `standalone/build`;
   - скачивает Pyodide в `standalone/build/static/pyodide`;
   - прогоняет `verify_web.py` в Chromium;
   - загружает папку как Pages artifact и публикует.
4. Дождитесь зелёного workflow во вкладке **Actions**. Адрес будет:
   `https://<username>.github.io/<repo>/`
   для этого репозитория — `https://jellyfish2077.github.io/Dungeon-of-Python/`.

Если репозиторий **приватный**, GitHub Pages требует платный план (Pro/Team)
или публичный репозиторий. Данные учеников в git не попадают: `results.json`,
`users.json`, `.secret`, `_backup/`, `dist/` и `standalone/build/` в
`.gitignore`. Но исходники при публикации репозитория станут видны.

## Как проверять

После деплоя откройте адрес и пройдите короткий сценарий:

- стартовый экран, имя, «Новая игра»;
- меню: «Начать поход» открывает стража, фокус в окне;
- «Спуститься», один бой, проверка кода 3/3;
- сохранение и «Продолжить поход» после перезагрузки;
- 390×844: нет горизонтальной прокрутки, кнопки нажимаются;
- консоль без ошибок, запросов к `/api/*` нет.

Быстрая проверка сборки без деплоя:

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
python verify_web.py --browser msedge   # Windows
python verify_web.py                    # Chromium, в том числе в CI
```

Workflow можно запустить вручную: **Actions → Build and deploy web build →
Run workflow**. Он всегда сначала гоняет smoke-тест и только потом публикует.

### Что не проверяется на GitHub

`run_all_checks.py` рассчитан на Windows/WSL: серверные проверки используют
песочницу и локальные особенности. В Actions на Ubuntu запускается только
веб-сборка. Полный прогон и `verify_server` делайте локально:

```bash
python run_all_checks.py
```

## Классная версия

GitHub Pages для неё не подходит. Варианты:

- **Ноутбук учителя + школьная сеть** — основной вариант: `python server.py`,
  ученики заходят по `http://<ip>:8000/`. Данные лежат в `PYQUIZ_DATA_DIR`.
- **Codespaces/временная VM** — только для проверки: поднять
  `python server.py --local --no-code`, открыть forwarded-порт. Данные
  эфемерные, для реального урока не подходит.
- **Публичный сервер** — только с HTTPS, отдельным `PYQUIZ_DATA_DIR`,
  `--no-code` на первый раз и пониманием, что sandbox не равен полноценной
  изоляции. См. `SECURITY.md`; не выставляйте выполнение кода учеников в
  интернет «как есть».

Для Itch.io вместо Pages удобнее готовый архив:
`dist/pydungeon-standalone-<версия>.zip` — загружается как HTML-игра.

## Если что-то не работает

- **404 после деплоя** — Pages Source не «GitHub Actions», workflow упал или
  деплой ещё идёт. Проверьте вкладку Actions и Settings → Pages.
- **Старая версия** — кэш Pages/браузера; сделайте hard refresh или добавьте
  `?v=2` к URL.
- **Пустая страница** — откройте artifact `github-pages` в Actions и проверьте,
  что в корне есть `index.html`, а не папка `build/`.
- **Pyodide не загружается** — workflow должен скачать его локально
  (`tools/fetch_pyodide.py`); без этого сборка тянет CDN.
- **Workflow падает на Playwright** — `python -m playwright install --with-deps
  chromium` уже есть в workflow; смотрите лог шага.
- **Нет Pages в настройках** — приватный репозиторий без Pro либо Pages
  отключён организацией.
