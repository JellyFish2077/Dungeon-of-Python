# tools/art — графика

Два слоя исходников:

| Слой | Что это | Кто главный |
|---|---|---|
| `src/` | базовый набор DCSS rltiles (CC0), 32×32 | исходник для всего, что ещё не перерисовано |
| `src_custom/` | PNG, экспортированные из Aseprite | перекрывает `src/` при совпадении пути |

`src_custom/` генерируется, вручную его не правят. Источник истины —
`aseprite/*.aseprite`.

## Быстрый цикл

```powershell
# после правки .aseprite
python tools/art/export_aseprite.py
python tools/art/build_art.py

# проверить, что PNG и static/*.js не устарели
python tools/art/export_aseprite.py --check
python tools/art/build_art.py --check
```

`build_art.py` заменяет только блоки между `// <art:...>` и `// </art:...>`
в `static/sprites.js` и `static/terrain.js`. Код вокруг не трогается.

## Где что лежит

```
art.json                 параметры тона, контуры, происхождение
STYLE.md                 стиль, палитра, правила и чек-лист
palette.gpl              палитра для Aseprite (Palette → Load Palette)
asset-manifest.json      список ассетов среза и их статус
aseprite/                редактируемые исходники
src_custom/              экспорт PNG (не править руками)
bootstrap/make_slice.py  одноразовый генератор стартового среза
bootstrap/make_environment.py  одноразовый генератор воды, лавы, ловушек, лестниц и дверей
bootstrap/make_decor.py  одноразовый генератор травы, мха, костей, кристаллов, обломков и костра
bootstrap/make_village.py  одноразовый генератор стен, крыш, двора, дерева и NPC-базы
bootstrap/make_biomes.py  одноразовый генератор остальных 9 тем подземелья
bootstrap/make_creatures2.py  одноразовый генератор оставшихся 16 существ
bootstrap/make_items2.py  одноразовый генератор оставшихся 23 предметов
bootstrap/make_portal.py  одноразовый генератор портала
bootstrap/make_interior.py  одноразовый генератор интерьеров домов
bootstrap/make_objects3.py  одноразовый генератор жилы, обломков, рычага, таблички и мешочка
bootstrap/make_furniture.py  одноразовый генератор мебели домов
export_aseprite.py       Aseprite CLI → src_custom
build_art.py             src + src_custom → static/sprites.js, static/terrain.js
```

## Анимации

Анимации покоя, выпада, вспышки урона и падения живут в `static/game.css`
(`enemyIdle`, `strikeRight/Left`, `fighterFlash`, `fighterDown`). Задержки
покоя считаются из координат клетки в `place()`; `prefers-reduced-motion`
и `body.reduce-motion` отключают их.

## Aseprite

Каждый ассет — кадр с тегом, имя тега = имя PNG. Семейство
`terrain_01` раскладывается в `floors/01`, остальные — в одноимённые папки.

```powershell
python tools/art/bootstrap/make_slice.py --preview tools/art/_preview.png
python tools/art/bootstrap/make_slice.py --force

python tools/art/bootstrap/make_environment.py --preview tools/art/_env_preview.png
python tools/art/bootstrap/make_environment.py --force

python tools/art/bootstrap/make_decor.py --preview tools/art/_decor_preview.png
python tools/art/bootstrap/make_decor.py --force

python tools/art/bootstrap/make_village.py --preview tools/art/_village_preview.png
python tools/art/bootstrap/make_village.py --force

python tools/art/bootstrap/make_biomes.py --preview tools/art/_biomes_preview.png
python tools/art/bootstrap/make_biomes.py --force

python tools/art/bootstrap/make_creatures2.py --preview tools/art/_creatures2_preview.png
python tools/art/bootstrap/make_creatures2.py --force

python tools/art/bootstrap/make_items2.py --preview tools/art/_items2_preview.png
python tools/art/bootstrap/make_items2.py --force

python tools/art/bootstrap/make_portal.py --preview tools/art/_portal_preview.png
python tools/art/bootstrap/make_portal.py --force

python tools/art/bootstrap/make_interior.py --preview tools/art/_interior_preview.png
python tools/art/bootstrap/make_interior.py --force

python tools/art/bootstrap/make_objects3.py --preview tools/art/_objects3_preview.png
python tools/art/bootstrap/make_objects3.py --force

python tools/art/bootstrap/make_furniture.py --preview tools/art/_furniture_preview.png
python tools/art/bootstrap/make_furniture.py --force
```

`bootstrap/make_slice.py`, `bootstrap/make_environment.py`,
`bootstrap/make_decor.py`, `bootstrap/make_village.py`,
`bootstrap/make_biomes.py`, `bootstrap/make_creatures2.py`,
`bootstrap/make_items2.py`, `bootstrap/make_portal.py`,
`bootstrap/make_interior.py`, `bootstrap/make_objects3.py` и
`bootstrap/make_furniture.py` перезаписывают `.aseprite` и нужны только для
старта нового набора. После начала ручной работы их не запускают: они
затрут правки.
