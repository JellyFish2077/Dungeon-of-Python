# Редактор деревни

Отдельное приложение на Vite + TypeScript. Оно не входит в игровую сборку
и не меняет `static/village-content.js` само: результат копируется или
скачивается и вставляется вручную.

## Запуск

```powershell
npm install
npm run dev
```

Открой `http://localhost:5174/`.

## Что умеет

- читает живые данные из `static/village-content.js` через Vite-плагин;
- красит карту 30×18 выбранным тайлом;
- показывает дома и их рамки, позволяет менять имя, крышу, `box` и дверь;
- кнопка «Обвести стены» расставляет `#` по рамке и `D`/`d` в двери;
- редактирует таблички и ставит `S` на карту;
- проверяет длину строк, рамки домов, двери на нижней стене, проходимость
  перед дверью, таблички и достижимость от точки появления;
- экспортирует готовые блоки `VILLAGE_MAP`, `VILLAGE_HOUSES`,
  `VILLAGE_SEALED`, `VILLAGE_SIGNS`.

Жителей и интерьеры редактор пока показывает только для справки: они
правятся в `static/village-content.js` вручную.

## Проверки

```powershell
npm run check        # TypeScript + checkJs для village-content.js
npm run lint         # ESLint по инструментам
npm run format:check # Prettier для редактора и конфигов
npm run build:editor # сборка в dist/village-editor
npm run test:quick   # быстрые проверки игры
```

Полный прогон игры:

```powershell
npm test
```
