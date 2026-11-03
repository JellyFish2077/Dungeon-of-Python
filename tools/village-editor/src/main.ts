import rawData from "virtual:village-data";
import type { Box, House, Point, Sign, TileInfo, VillageData } from "./types";
import "./style.css";

const data = rawData as unknown as VillageData;
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Не найден контейнер #app");
const root: HTMLDivElement = app;

const CELL = 28;

const TILE_INFO: Record<string, TileInfo> = {
  "#": { label: "Стена дома", color: "#3b4250", symbol: "#" },
  D: { label: "Открытая дверь", color: "#3d6ea8", symbol: "D" },
  d: { label: "Запертая дверь", color: "#b66a2a", symbol: "d" },
  p: { label: "Дорожка", color: "#4a3524", symbol: "·" },
  ".": { label: "Трава", color: "#26351f", symbol: "·" },
  T: { label: "Дерево", color: "#2f6f3a", symbol: "T" },
  F: { label: "Забор", color: "#6b4a2a", symbol: "F" },
  W: { label: "Колодец", color: "#2b6f8a", symbol: "W" },
  C: { label: "Костёр", color: "#c96b3b", symbol: "C" },
  S: { label: "Табличка", color: "#d8a24a", symbol: "S" },
  o: { label: "Бочка", color: "#7a4b2a", symbol: "o" },
  l: { label: "Поленница", color: "#8a5a2a", symbol: "l" },
  t: { label: "Стол", color: "#5a6472", symbol: "t" },
  c: { label: "Стул", color: "#5a6472", symbol: "c" },
  r: { label: "Ящик", color: "#5a6472", symbol: "r" },
  a: { label: "Наковальня", color: "#6b7280", symbol: "a" }
};

const PALETTE = Object.keys(TILE_INFO);
const WALKABLE = new Set([".", "p", "C", "S"]);
const BLOCKED = new Set(["#", "D", "d", "T", "F", "W", "o", "l", "t", "c", "r", "a"]);

function normalizeHouses(v: VillageData): House[] {
  const open = Object.keys(v.houses).map((key) => {
    const h = v.houses[key];
    return {
      key,
      name: h.name,
      roof: h.roof,
      box: { ...h.box },
      door: { ...h.door },
      exit: { ...h.exit },
      locked: false,
      sealed: false
    };
  });
  const sealed = (v.sealed || []).map((h) => ({
    key: h.key,
    name: h.name,
    roof: h.roof,
    box: { ...h.box },
    door: { ...h.door },
    exit: { ...h.exit },
    locked: !!h.locked,
    sealed: true
  }));
  return open.concat(sealed);
}

const state = {
  width: data.map[0]?.length ?? 30,
  height: data.map.length,
  map: data.map.map((row) => row.split("")),
  houses: normalizeHouses(data),
  signs: data.signs.map((s) => ({ ...s })),
  npcs: data.npcs,
  spawn: { ...data.spawn },
  selectedChar: "p",
  selectedHouse: null as string | null,
  cursor: { x: 0, y: 0 },
  painting: false,
  exportOpen: false
};

function esc(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tileInfo(ch: string): TileInfo {
  return TILE_INFO[ch] || TILE_INFO["."];
}

function at(x: number, y: number): string {
  return state.map[y]?.[x] ?? "";
}

function selectedHouse(): House | undefined {
  return state.houses.find((h) => h.key === state.selectedHouse);
}

function point(p: Point): string {
  return `{ x: ${p.x}, y: ${p.y} }`;
}

function box(b: Box): string {
  return `{ x0: ${b.x0}, y0: ${b.y0}, x1: ${b.x1}, y1: ${b.y1} }`;
}

function renderPalette(): string {
  return PALETTE.map((ch) => {
    const info = tileInfo(ch);
    const active = ch === state.selectedChar ? " active" : "";
    return `<button type="button" class="palette-button${active}" data-char="${esc(ch)}" title="${esc(
      info.label
    )}" style="--tile:${info.color}"><b>${esc(info.symbol)}</b><span>${esc(info.label)}</span></button>`;
  }).join("");
}

function renderMap(): string {
  const cells: string[] = [];
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const ch = at(x, y) || ".";
      const info = tileInfo(ch);
      const selected = ch === state.selectedChar ? " selected-char" : "";
      cells.push(
        `<button type="button" class="cell${selected}" data-x="${x}" data-y="${y}" data-tile="${esc(
          ch
        )}" style="--tile:${info.color}" title="${x},${y} · ${esc(info.label)}">${esc(
          info.symbol
        )}</button>`
      );
    }
  }
  const boxes = state.houses
    .map((h) => {
      const cls = [
        "house-box",
        h.locked ? "locked" : "",
        h.key === state.selectedHouse ? "selected" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `<div class="${cls}" style="left:${h.box.x0 * CELL}px;top:${h.box.y0 * CELL}px;width:${
        (h.box.x1 - h.box.x0 + 1) * CELL
      }px;height:${(h.box.y1 - h.box.y0 + 1) * CELL}px"></div>`;
    })
    .join("");
  return `<div class="map-wrap" style="width:${state.width * CELL}px;height:${
    state.height * CELL
  }px"><div class="grid" style="grid-template-columns:repeat(${state.width}, ${CELL}px)">${cells.join(
    ""
  )}</div><div class="overlay">${boxes}</div></div>`;
}

function renderHouseList(): string {
  return state.houses
    .map((h) => {
      const active = h.key === state.selectedHouse ? " active" : "";
      return `<button type="button" class="house-row${active}" data-house="${esc(h.key)}">
        <span>${esc(h.name)}</span>
        <small>${esc(h.key)}${h.locked ? " · заперт" : ""}</small>
      </button>`;
    })
    .join("");
}

function renderHouseForm(): string {
  const h = selectedHouse();
  if (!h) return `<p class="muted">Выбери дом в списке, чтобы поправить его рамку и дверь.</p>`;
  return `<div class="form-grid">
    <label>Имя<input data-house-field="name" value="${esc(h.name)}" /></label>
    <label>Крыша<select data-house-field="roof">
      ${["red", "blue", "green", "brown"]
        .map((r) => `<option value="${r}"${r === h.roof ? " selected" : ""}>${r}</option>`)
        .join("")}
    </select></label>
    <label>x0<input type="number" data-house-field="x0" value="${h.box.x0}" /></label>
    <label>y0<input type="number" data-house-field="y0" value="${h.box.y0}" /></label>
    <label>x1<input type="number" data-house-field="x1" value="${h.box.x1}" /></label>
    <label>y1<input type="number" data-house-field="y1" value="${h.box.y1}" /></label>
    <label>Дверь x<input type="number" data-house-field="doorX" value="${h.door.x}" /></label>
    <label>Дверь y<input type="number" data-house-field="doorY" value="${h.door.y}" /></label>
  </div>
  <div class="row">
    <button type="button" class="button" data-action="outline">Обвести стены</button>
    <span class="badge${h.locked ? " locked" : ""}">${h.locked ? "заперт" : "открыт"}</span>
  </div>`;
}

function renderSigns(): string {
  if (!state.signs.length) return `<p class="muted">Табличек нет.</p>`;
  return state.signs
    .map(
      (s, i) => `<div class="sign-row" data-sign-index="${i}">
        <input type="number" data-sign-field="x" value="${s.x}" title="x" />
        <input type="number" data-sign-field="y" value="${s.y}" title="y" />
        <input data-sign-field="title" value="${esc(s.title)}" title="Заголовок" />
        <input data-sign-field="text" value="${esc(s.text)}" title="Текст" />
        <button type="button" class="icon-button" data-action="place-sign" data-index="${i}" title="Поставить S">S</button>
        <button type="button" class="icon-button danger" data-action="remove-sign" data-index="${i}" title="Удалить">×</button>
      </div>`
    )
    .join("");
}

function renderNpcs(): string {
  return state.npcs
    .map(
      (n) =>
        `<div class="npc-row"><span>${esc(n.name)}</span><small>${esc(n.place)} · ${n.at.x},${
          n.at.y
        }</small></div>`
    )
    .join("");
}

function validate(): string[] {
  const errors: string[] = [];
  const seenDoors = new Set<string>();
  const seenSigns = new Set<string>();

  state.map.forEach((row, y) => {
    if (row.length !== state.width) {
      errors.push(`Строка ${y}: длина ${row.length}, а ждём ${state.width}.`);
    }
  });

  state.houses.forEach((h) => {
    const b = h.box;
    if (b.x0 > b.x1 || b.y0 > b.y1) errors.push(`${h.name}: x0/y0 больше x1/y1.`);
    if (b.x0 < 0 || b.y0 < 0 || b.x1 >= state.width || b.y1 >= state.height) {
      errors.push(`${h.name}: рамка выходит за карту.`);
    }
    if (h.door.x < b.x0 || h.door.x > b.x1 || h.door.y < b.y0 || h.door.y > b.y1) {
      errors.push(`${h.name}: дверь вне рамки.`);
    }
    if (h.door.y !== b.y1) {
      errors.push(`${h.name}: дверь должна быть на нижней стене (y = y1).`);
    }
    const expectedDoor = h.locked ? "d" : "D";
    for (let y = b.y0; y <= b.y1; y += 1) {
      for (let x = b.x0; x <= b.x1; x += 1) {
        const ch = at(x, y);
        if (x === h.door.x && y === h.door.y) {
          if (ch !== expectedDoor) {
            errors.push(`${h.name}: в двери ${x},${y} стоит «${ch}», а ждём «${expectedDoor}».`);
          }
        } else if (ch !== "#") {
          errors.push(`${h.name}: в рамке ${x},${y} стоит «${ch}», а ждём стену «#».`);
        }
      }
    }
    const front = at(h.door.x, h.door.y + 1);
    if (!WALKABLE.has(front)) {
      errors.push(`${h.name}: перед дверью ${h.door.x},${h.door.y + 1} не проходимо.`);
    }
    if (seenDoors.has(`${h.door.x},${h.door.y}`)) {
      errors.push(`${h.name}: дверь ${h.door.x},${h.door.y} уже занята другим домом.`);
    }
    seenDoors.add(`${h.door.x},${h.door.y}`);
  });

  state.signs.forEach((s) => {
    if (at(s.x, s.y) !== "S") errors.push(`Табличка ${s.x},${s.y}: на карте нет «S».`);
    if (!s.title.trim()) errors.push(`Табличка ${s.x},${s.y}: пустой заголовок.`);
    if (seenSigns.has(`${s.x},${s.y}`)) errors.push(`Табличка ${s.x},${s.y}: дубль.`);
    seenSigns.add(`${s.x},${s.y}`);
  });

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      if (at(x, y) === "S" && !state.signs.some((s) => s.x === x && s.y === y)) {
        errors.push(`В ${x},${y} стоит «S», но записи в VILLAGE_SIGNS нет.`);
      }
    }
  }

  if (!WALKABLE.has(at(state.spawn.x, state.spawn.y))) {
    errors.push(`Точка появления ${state.spawn.x},${state.spawn.y} не проходима.`);
  }

  // Достижимость от точки появления: двери и таблички.
  if (WALKABLE.has(at(state.spawn.x, state.spawn.y))) {
    const seen = new Set([`${state.spawn.x},${state.spawn.y}`]);
    const queue: Point[] = [{ ...state.spawn }];
    for (let head = 0; head < queue.length; head += 1) {
      const p = queue[head];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x < 0 || y < 0 || x >= state.width || y >= state.height) continue;
        const k = `${x},${y}`;
        if (seen.has(k) || !WALKABLE.has(at(x, y))) continue;
        seen.add(k);
        queue.push({ x, y });
      }
    }
    state.houses.forEach((h) => {
      const k = `${h.door.x},${h.door.y + 1}`;
      if (WALKABLE.has(at(h.door.x, h.door.y + 1)) && !seen.has(k)) {
        errors.push(`${h.name}: перед дверью ${k} недостижимо от входа.`);
      }
    });
    state.signs.forEach((s) => {
      const k = `${s.x},${s.y}`;
      if (WALKABLE.has(at(s.x, s.y)) && !seen.has(k)) {
        errors.push(`Табличка ${k}: недостижима от входа.`);
      }
    });
  }

  return errors;
}

function renderValidation(): string {
  const errors = validate();
  if (!errors.length) {
    return `<div id="validation" class="validation good"><b>Ошибок нет.</b> Карта, дома и таблички сходятся.</div>`;
  }
  return `<div id="validation" class="validation bad"><b>${errors.length} ${
    errors.length === 1 ? "ошибка" : "ошибок"
  }:</b><ul>${errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`;
}

function refreshValidation(): void {
  const boxEl = document.querySelector<HTMLDivElement>("#validation");
  if (boxEl) boxEl.outerHTML = renderValidation();
}

function formatSign(s: Sign): string {
  const parts = [`x: ${s.x}`, `y: ${s.y}`, `title: ${JSON.stringify(s.title)}`];
  if (s.subtitle) parts.push(`subtitle: ${JSON.stringify(s.subtitle)}`);
  parts.push(`text: ${JSON.stringify(s.text)}`);
  if (s.building) parts.push(`building: ${JSON.stringify(s.building)}`);
  if (s.builtTitle) parts.push(`builtTitle: ${JSON.stringify(s.builtTitle)}`);
  if (s.builtSubtitle) parts.push(`builtSubtitle: ${JSON.stringify(s.builtSubtitle)}`);
  if (s.builtText) parts.push(`builtText: ${JSON.stringify(s.builtText)}`);
  return `  { ${parts.join(", ")} }`;
}

function exportText(): string {
  const map = state.map.map((row) => `  ${JSON.stringify(row.join(""))}`).join(",\n");
  const open = state.houses
    .filter((h) => !h.sealed)
    .map(
      (h) => `  ${JSON.stringify(h.key)}: {
    name: ${JSON.stringify(h.name)}, roof: ${JSON.stringify(h.roof)},
    box: ${box(h.box)}, door: ${point(h.door)}, exit: ${point(h.exit)}
  }`
    )
    .join(",\n");
  const sealed = state.houses
    .filter((h) => h.sealed)
    .map(
      (h) => `  {
    key: ${JSON.stringify(h.key)}, name: ${JSON.stringify(h.name)}, roof: ${JSON.stringify(
      h.roof
    )}, locked: true,
    box: ${box(h.box)}, door: ${point(h.door)}, exit: ${point(h.exit)}
  }`
    )
    .join(",\n");
  const signs = state.signs.map(formatSign).join(",\n");

  return `// Фрагмент деревни. Замени соответствующие блоки в static/village-content.js.
const VILLAGE_MAP = [
${map}
];

const VILLAGE_HOUSES = {
${open}
};

const VILLAGE_SEALED = [
${sealed}
];

const VILLAGE_SIGNS = [
${signs}
];
`;
}

function renderExport(): string {
  if (!state.exportOpen) return "";
  return `<div class="modal-backdrop">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Экспорт деревни">
      <div class="modal-head"><h2>Экспорт</h2><button type="button" class="icon-button" data-action="close-export" aria-label="Закрыть">×</button></div>
      <p class="muted">Скопируй блоки в <code>static/village-content.js</code>. Жителей и интерьеры правь отдельно.</p>
      <textarea id="export-text" readonly>${esc(exportText())}</textarea>
      <div class="row">
        <button type="button" class="button primary" data-action="copy-export">Копировать</button>
        <button type="button" class="button" data-action="download-export">Скачать .js</button>
      </div>
    </div>
  </div>`;
}

function render(): void {
  const errors = validate();
  root.innerHTML = `<header class="topbar">
    <div>
      <p class="eyebrow">PyDungeon · инструменты</p>
      <h1>Редактор деревни</h1>
      <p class="subtitle">Источник: <code>static/village-content.js</code> · ${state.width}×${state.height}</p>
    </div>
    <div class="top-actions">
      <button type="button" class="button" data-action="reload">Перезагрузить</button>
      <button type="button" class="button primary" data-action="export">Экспорт</button>
    </div>
  </header>
  <div class="layout">
    <main class="map-column">
      <div class="palette">${renderPalette()}</div>
      ${renderMap()}
      <p class="hint">Крась клетки: выбери тайл и веди мышью. Точка появления: ${state.spawn.x},${state.spawn.y}.</p>
    </main>
    <aside class="side">
      <section class="panel">
        <h2>Дома</h2>
        <div class="house-list">${renderHouseList()}</div>
        ${renderHouseForm()}
      </section>
      <section class="panel">
        <h2>Таблички</h2>
        ${renderSigns()}
        <button type="button" class="button" data-action="add-sign">Добавить табличку</button>
      </section>
      <section class="panel">
        <h2>Жители</h2>
        <p class="muted">Пока только для справки: координаты и интерьеры правятся в коде.</p>
        <div class="npc-list">${renderNpcs()}</div>
      </section>
      <section class="panel">
        <h2>Проверка</h2>
        ${renderValidation()}
      </section>
    </aside>
  </div>
  ${
    errors.length
      ? `<p class="status bad">Экспорт лучше делать после исправления ошибок.</p>`
      : `<p class="status good">Можно экспортировать.</p>`
  }
  ${renderExport()}`;
}

function updateCell(cell: HTMLButtonElement, ch: string): void {
  const info = tileInfo(ch);
  cell.dataset.tile = ch;
  cell.style.setProperty("--tile", info.color);
  cell.textContent = info.symbol;
  cell.title = `${cell.dataset.x},${cell.dataset.y} · ${info.label}`;
  cell.classList.toggle("selected-char", ch === state.selectedChar);
}

function paintCell(x: number, y: number): void {
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
  if (!state.map[y]) state.map[y] = [];
  state.map[y][x] = state.selectedChar;
  const cell = root.querySelector<HTMLButtonElement>(`button.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) updateCell(cell, state.selectedChar);
  state.cursor = { x, y };
  refreshValidation();
}

function outlineHouse(): void {
  const h = selectedHouse();
  if (!h) return;
  for (let y = h.box.y0; y <= h.box.y1; y += 1) {
    if (!state.map[y]) state.map[y] = [];
    for (let x = h.box.x0; x <= h.box.x1; x += 1) state.map[y][x] = "#";
  }
  state.map[h.door.y][h.door.x] = h.locked ? "d" : "D";
  render();
}

function copyExport(): void {
  const area = document.querySelector<HTMLTextAreaElement>("#export-text");
  if (!area) return;
  area.select();
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(area.value);
  } else {
    document.execCommand("copy");
  }
}

function downloadExport(): void {
  const blob = new Blob([exportText()], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "village-content.patch.js";
  a.click();
  URL.revokeObjectURL(url);
}

root.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const palette = target.closest<HTMLButtonElement>("[data-char]");
  if (palette?.dataset.char) {
    state.selectedChar = palette.dataset.char;
    render();
    return;
  }

  const house = target.closest<HTMLButtonElement>("[data-house]");
  if (house?.dataset.house) {
    state.selectedHouse = house.dataset.house;
    render();
    return;
  }

  const cell = target.closest<HTMLButtonElement>("button.cell");
  if (cell) {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    state.cursor = { x, y };
    paintCell(x, y);
    return;
  }

  const action = target.closest<HTMLButtonElement>("[data-action]");
  if (!action) return;
  const kind = action.dataset.action;
  if (kind === "outline") outlineHouse();
  else if (kind === "export") {
    state.exportOpen = true;
    render();
  } else if (kind === "close-export") {
    state.exportOpen = false;
    render();
  } else if (kind === "copy-export") copyExport();
  else if (kind === "download-export") downloadExport();
  else if (kind === "reload") location.reload();
  else if (kind === "place-sign") {
    const index = Number(action.dataset.index);
    const sign = state.signs[index];
    if (sign) {
      if (!state.map[sign.y]) state.map[sign.y] = [];
      state.map[sign.y][sign.x] = "S";
      render();
    }
  } else if (kind === "remove-sign") {
    const index = Number(action.dataset.index);
    state.signs.splice(index, 1);
    render();
  } else if (kind === "add-sign") {
    const { x, y } = state.cursor;
    state.signs.push({ x, y, title: "Табличка", subtitle: "", text: "Новая табличка." });
    if (!state.map[y]) state.map[y] = [];
    state.map[y][x] = "S";
    render();
  }
});

root.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const cell = target.closest<HTMLButtonElement>("button.cell");
  if (!cell) return;
  state.painting = true;
  paintCell(Number(cell.dataset.x), Number(cell.dataset.y));
});

root.addEventListener("pointerover", (event) => {
  if (!state.painting) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const cell = target.closest<HTMLButtonElement>("button.cell");
  if (!cell) return;
  paintCell(Number(cell.dataset.x), Number(cell.dataset.y));
});

window.addEventListener("pointerup", () => {
  state.painting = false;
});

root.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  const houseField = target.closest<HTMLInputElement | HTMLSelectElement>("[data-house-field]");
  if (houseField?.dataset.houseField) {
    const h = selectedHouse();
    if (!h) return;
    const field = houseField.dataset.houseField;
    if (field === "name") h.name = houseField.value;
    else if (field === "roof") h.roof = houseField.value;
    else if (field === "x0") h.box.x0 = Number(houseField.value);
    else if (field === "y0") h.box.y0 = Number(houseField.value);
    else if (field === "x1") h.box.x1 = Number(houseField.value);
    else if (field === "y1") h.box.y1 = Number(houseField.value);
    else if (field === "doorX") h.door.x = Number(houseField.value);
    else if (field === "doorY") h.door.y = Number(houseField.value);
    render();
    return;
  }

  const signField = target.closest<HTMLInputElement>("[data-sign-field]");
  const signRow = target.closest<HTMLElement>("[data-sign-index]");
  if (signField?.dataset.signField && signRow) {
    const index = Number(signRow.dataset.signIndex);
    const sign = state.signs[index];
    if (!sign) return;
    const field = signField.dataset.signField;
    if (field === "x") sign.x = Number(signField.value);
    else if (field === "y") sign.y = Number(signField.value);
    else if (field === "title") sign.title = signField.value;
    else if (field === "text") sign.text = signField.value;
    render();
  }
});

render();
