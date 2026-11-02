// Схемы вырезанной геометрии для визуальной проверки этапов 1.5–1.6.
// Запуск: node tools/geometry_preview.js
// Результат: docs/geometry-preview.html
const fs = require("fs");
const path = require("path");
const { API } = require("./game_harness.js");

const SAMPLES = [
  { index: 0, seed: 3 },
  { index: 6, seed: 7 },
  { index: 12, seed: 11 }
];

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

function buildCard(sample) {
  const f = API.FLOORS_V2[sample.index];
  const coarse = API.genCoarse(f.w, f.h);
  const target = Math.max(4, Math.round(f.roomTarget * (1 - f.optionalShare)));
  const ends = API.genPickEnds(coarse.cw, coarse.ch, API.genRng(sample.seed));
  const spine = API.genSpinePath(ends.entry, ends.gate, target,
    coarse.cw, coarse.ch, API.genRng(sample.seed + 101));
  const branches = API.genGrowBranches(spine, f.roomTarget - target,
    coarse.cw, coarse.ch, API.genRng(sample.seed + 202));
  const plan = {
    version: 2, biome: f.biome, campaign: f.campaign,
    w: f.w, h: f.h, rooms: [], edges: [], spine: []
  };
  API.genBuildRooms(plan, spine, branches);
  API.genAssignRoles(plan, f, sample.index, API.genRng(sample.seed + 303));
  API.genAddLoops(plan, API.genRng(sample.seed + 404));
  const geo = API.genCarve(plan, f.w, f.h, sample.index, API.genRng(sample.seed + 505));

  const roleAt = {};
  plan.rooms.forEach((room) => {
    const r = room.rect;
    for (let y = r.y; y < r.y + r.h; y += 1) {
      for (let x = r.x; x < r.x + r.w; x += 1) {
        if (geo.grid[y][x] === 1) roleAt[x + "," + y] = room.role;
      }
    }
  });

  const cells = [];
  let floor = 0;
  for (let y = 0; y < f.h; y += 1) {
    for (let x = 0; x < f.w; x += 1) {
      if (geo.grid[y][x] !== 1) {
        cells.push('<div class="t wall"></div>');
        continue;
      }
      floor += 1;
      const role = roleAt[x + "," + y];
      const isEntry = geo.start.x === x && geo.start.y === y;
      const isGate = geo.end.x === x && geo.end.y === y;
      const color = isEntry ? COLORS.entry : isGate ? COLORS.gate
        : (role ? COLORS[role] : "#2b3440");
      const label = isEntry ? "S" : isGate ? "G" : "";
      cells.push('<div class="t" style="background:' + color + '" title="' +
        (role || "коридор") + " (" + x + "," + y + ')"' +
        '>' + label + "</div>");
    }
  }

  const roles = {};
  plan.rooms.forEach((room) => { roles[room.role] = (roles[room.role] || 0) + 1; });
  const roleLine = Object.keys(roles).sort()
    .map((role) => role + ":" + roles[role]).join(" · ");
  const loops = plan.edges.filter((edge) => edge.kind === "loop").length;
  return '<section class="card"><h2>' +
    esc(f.name + " · этаж " + (sample.index + 1)) + "</h2>" +
    '<p class="stats">' + f.w + "×" + f.h + " · комнат " + plan.rooms.length +
    " · пол " + Math.round(floor / (f.w * f.h) * 100) + "% · петли " + loops +
    "</p>" +
    '<div class="map" style="grid-template-columns:repeat(' + f.w +
    ',9px)">' + cells.join("") + "</div>" +
    '<p class="roles">' + esc(roleLine) + "</p></section>";
}

const legend = Object.keys(COLORS).map((role) =>
  '<span><i style="background:' + COLORS[role] + '"></i>' + role + "</span>"
).join("");

const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
  "<title>Геометрия этажа</title><style>" +
  "body{margin:0;padding:24px;background:#0f1115;color:#dbe2ea;" +
  "font:13px/1.4 system-ui,Segoe UI,sans-serif}" +
  "h1{margin:0 0 6px;font-size:20px}h2{margin:0 0 4px;font-size:14px}" +
  ".lead{margin:0 0 14px;color:#93a1b3}" +
  ".legend{display:flex;flex-wrap:wrap;gap:8px 12px;margin:0 0 18px;" +
  "color:#93a1b3;font-size:10px}.legend i{display:inline-block;width:10px;" +
  "height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}" +
  ".list{display:flex;flex-wrap:wrap;gap:18px}" +
  ".card{background:#171b22;border:1px solid #2a3140;border-radius:10px;" +
  "padding:14px 16px 10px}.stats{margin:0 0 10px;color:#8593a6;font-size:11px}" +
  ".map{display:grid;gap:1px}.t{width:9px;height:9px;display:flex;" +
  "align-items:center;justify-content:center;font-size:7px;font-weight:700;" +
  "color:#fff}.wall{background:#0b0d11}" +
  ".roles{margin:9px 0 0;color:#8593a6;font-size:10px;max-width:520px}" +
  "</style></head><body><h1>Геометрия этажа</h1>" +
  '<p class="lead">Цвет комнаты — её роль. Серый — коридор. S — вход, G — врата.</p>' +
  '<div class="legend">' + legend + "</div>" +
  '<div class="list">' + SAMPLES.map(buildCard).join("") + "</div>" +
  "</body></html>";

const out = path.join(__dirname, "..", "docs", "geometry-preview.html");
fs.writeFileSync(out, html, "utf8");
console.log(out);
