// Интеграционная схема: генератор v2 уже внутри createFloorState.
// Запуск: node tools/integrated_preview.js
// Результат: docs/integrated-preview.html
const fs = require("fs");
const path = require("path");
const { API, freshRun } = require("./game_harness.js");

const SAMPLES = [0, 6, 12];

const COLORS = {
  entry: "#256b3e",
  gate: "#7a2f3a",
  junction: "#8a6d1f",
  combat: "#39424f",
  lore: "#2f5d7a",
  crossing: "#1f6b6b",
  hazard_hall: "#7a3d1f",
  treasure: "#8a6a1f",
  resource: "#5a4a2a",
  rest: "#2f6b4a",
  secret: "#5b3a7a",
  elite: "#7a2f2f",
  vault: "#6b3a5a",
  ambush: "#7a4a1f"
};

function esc(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[ch]));
}

function buildCard(index) {
  const state = API.buildCheckedFloor(index);
  const f = API.floorDef(index);
  const w = state.map.w;
  const h = state.map.h;
  const roleAt = {};
  if (state.plan) {
    state.plan.rooms.forEach((room) => {
      const r = room.rect;
      for (let y = r.y; y < r.y + r.h; y += 1) {
        for (let x = r.x; x < r.x + r.w; x += 1) {
          if (state.map.grid[y][x] === 1) roleAt[x + "," + y] = room.role;
        }
      }
    });
  }
  const objects = new Map();
  const put = (list, kind) => (list || []).forEach((obj) => {
    if (obj && obj.x != null) objects.set(obj.x + "," + obj.y, kind);
  });
  put(state.enemies, "enemy");
  put(state.treasures, "treasure");
  put(state.lootBags, "loot");
  put(state.traps, "trap");
  put(state.camps, "camp");
  put(state.nodes, "node");
  put(state.signs, "sign");
  if (state.portal) put([state.portal], "portal");
  (state.vaults || []).forEach((v) => {
    if (v && v.door) objects.set(v.door.x + "," + v.door.y, "door");
  });

  const cells = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (state.map.grid[y][x] !== 1) {
        cells.push('<div class="t wall"></div>');
        continue;
      }
      const role = roleAt[x + "," + y];
      const isEntry = state.playerPos.x === x && state.playerPos.y === y;
      const isGate = state.stairsDown && state.stairsDown.x === x &&
        state.stairsDown.y === y;
      const color = isEntry ? COLORS.entry : isGate ? COLORS.gate
        : (role ? COLORS[role] : "#2b3440");
      const obj = objects.get(x + "," + y);
      cells.push('<div class="t" style="background:' + color + '" title="' +
        (role || "коридор") + '"><span class="o ' + (obj || "") +
        '"></span></div>');
    }
  }
  const checked = state.checked || {};
  return '<section class="card"><h2>' +
    esc(f.name + " · этаж " + (index + 1)) + "</h2>" +
    '<p class="stats">' + w + "×" + h + " · комнат " +
    (state.plan ? state.plan.rooms.length : "—") +
    " · врагов " + (state.enemies || []).length +
    " · сундуков " + (state.treasures || []).length +
    " · ловушек " + (state.traps || []).length +
    " · костров " + (state.camps || []).length +
    " · попыток " + (checked.attempts || 1) +
    (checked.fallback ? " · fallback " + checked.fallback : "") +
    "</p>" +
    '<div class="map" style="grid-template-columns:repeat(' + w +
    ',8px)">' + cells.join("") + "</div></section>";
}

freshRun(0);
API.setCampaign(2);
API.setGenV2(true);
let cards = [];
try {
  cards = SAMPLES.map(buildCard);
} finally {
  API.setGenV2(false);
  API.setCampaign(1);
}

const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
  "<title>Интеграция v2</title><style>" +
  "body{margin:0;padding:24px;background:#0f1115;color:#dbe2ea;" +
  "font:13px/1.4 system-ui,Segoe UI,sans-serif}" +
  "h1{margin:0 0 6px;font-size:20px}h2{margin:0 0 4px;font-size:14px}" +
  ".lead{margin:0 0 14px;color:#93a1b3}" +
  ".legend{display:flex;flex-wrap:wrap;gap:10px 14px;margin:0 0 18px;" +
  "color:#93a1b3;font-size:11px}.legend i{display:inline-block;width:8px;" +
  "height:8px;border-radius:50%;margin-right:4px;vertical-align:0}" +
  ".list{display:flex;flex-wrap:wrap;gap:18px}" +
  ".card{background:#171b22;border:1px solid #2a3140;border-radius:10px;" +
  "padding:14px 16px 10px}.stats{margin:0 0 10px;color:#8593a6;font-size:11px}" +
  ".map{display:grid;gap:1px}.t{position:relative;width:8px;height:8px}" +
  ".wall{background:#0b0d11}.o{position:absolute;left:2px;top:2px;width:4px;" +
  "height:4px;border-radius:50%;display:none}.o.enemy{display:block;background:#ef4444}" +
  ".o.treasure{display:block;background:#facc15}.o.loot{display:block;background:#a16207}" +
  ".o.trap{display:block;background:#c084fc}.o.camp{display:block;background:#22c55e}" +
  ".o.node{display:block;background:#d97706}.o.sign{display:block;background:#e5e7eb}" +
  ".o.door{display:block;background:#f8fafc;border-radius:1px}" +
  ".o.portal{display:block;background:#38bdf8}" +
  "</style></head><body><h1>Интеграция v2</h1>" +
  '<p class="lead">Этажи собраны через createFloorState с GEN_V2. ' +
  "Цвет комнаты — роль, точки — объекты.</p>" +
  '<div class="legend">' +
  '<span><i style="background:#ef4444"></i>враг</span>' +
  '<span><i style="background:#facc15"></i>сундук</span>' +
  '<span><i style="background:#c084fc"></i>ловушка</span>' +
  '<span><i style="background:#22c55e"></i>костёр</span>' +
  '<span><i style="background:#d97706"></i>жила</span>' +
  '<span><i style="background:#f8fafc"></i>дверь</span></div>' +
  '<div class="list">' + cards.join("") + "</div></body></html>";

const out = path.join(__dirname, "..", "docs", "integrated-preview.html");
fs.writeFileSync(out, html, "utf8");
console.log(out);
