# PyDungeon

Тёмное фэнтези-подземелье, где бой — это проверка знаний Python.
Десять этажей, деревня-хаб, кампания, боссы и сохранения в браузере.

**Играть онлайн:** https://jellyfish2077.github.io/Dungeon-of-Python/

## Что внутри

- Кампания «Печати глубины»: пять глав, журнал, пролог и финал.
- Деревня: амбар, колодец, кузница, дом мастера, торговец и жители.
- Пошаговые бои: вопрос по Python, затем задача на ту же тему.
- Десять этажей и пять биомов: пещеры, катакомбы, лёд, демоны, логово дракона.
- Снаряжение, редкости, комплекты, зелья, амулеты возврата.
- Постоянный HUD: здоровье, опыт, золото, сила, защита и текущая глава.
- Журнал кампании: сюжет, поручения и архив.
- Пиксель-арт 32×32, нарисованный в Aseprite.
- Работает без сервера: профиль и сохранения лежат в `localStorage`.

## Управление

| Клавиша | Действие |
|---|---|
| `WASD` / стрелки | ходьба по карте |
| `E` | действие: дверь, сундук, лестница, житель |
| `Пробел` | пропустить ход |
| `I` | инвентарь |
| `M` | мини-карта |
| `Esc` | пауза или закрыть окно |
| колесо мыши | зум карты |

## Локальный запуск

Нужен Python 3.10+.

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
python launch_standalone.py
```

`launch_standalone.py` поднимет локальный сервер и откроет игру в браузере.
Без Pyodide игра запустится, но проверка кода будет тянуть runtime с CDN.

Можно запустить и вручную:

```bash
python -m http.server 8080 --directory standalone/build
```

## Сборка для Itch.io

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
python tools/package_web.py
```

Готовый архив появится в `dist/pydungeon-standalone-*.zip`. В корне архива
лежит `index.html`; загружать его нужно как HTML-игру.

## Публикация на GitHub Pages

Публичная сборка лежит в ветке `gh-pages`, в корне ветки. После обновления:

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
```

Содержимое `standalone/build/` копируется в `gh-pages`, затем ветка пушится.
В настройках Pages выбран источник **Deploy from a branch** → `gh-pages` /
`/ (root)`. Файл `.nojekyll` обязателен.

## Проверки

```bash
python run_all_checks.py --quick   # контент и генераторы, нужен Node.js
python verify_web.py --browser msedge
```

`verify_web.py` собирает standalone-версию и проверяет игру в браузере:
меню, сохранения, Pyodide, HUD, журнал, отсутствие запросов к API.

## Структура

```text
static/
  game.html game.js game.css    подземелье и интерфейс
  menu.js menu.css              главное меню и пауза
  saves.js saves.css            сохранения
  dungeon-content.js            этажи, события, ловушки
  village-content.js            деревня и дома
  questions.js                  банк вопросов
  variants.js practice-variants.js
  code-tasks.js code-tasks-tests.json
  items.js icons.js
  sprites.js terrain.js         пиксель-арт
  profile.js auth.js web-boot.js
tools/
  build_web.py                  сборка standalone/build
  fetch_pyodide.py              офлайн-Pyodide
  package_web.py                zip для Itch.io
  art/                          Aseprite-исходники и сборка графики
standalone/
  build/                        публичная сборка
```

## Лицензия

См. [LICENSE](LICENSE).
