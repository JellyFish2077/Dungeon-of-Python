// Схемы веток и ролей для визуальной проверки этапов 1.3–1.4.
// Запуск: node tools/branch_preview.js
// Результат: docs/branch-preview.html
const fs = require("fs");
const path = require("path");
const { API } = require("./game_harness.js");

const SAMPLES = [
  { index: 0, seed: 3 },   // пещеры, первый спуск
  { index: 3, seed: 5 },   // катакомбы
  { index: 6, seed: 7 },   // лёд
  { index: 9, seed: 9 },   // демоны
  { index: 12, seed: 11 }  // логово
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

const LABELS = {
  entry: "S",
  gate: "G",
  junction: "J",
  combat: "C",
  lore: "L",
  crossing: "X",
  hazard_hall: "H",
  treasure: "T",
  resource: "R",
  rest: "P",
  secret: "?",
  elite: "E",
  vault: "V",
  ambush: "A"
};

function esc(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[ch]));
}

function buildCard(sample) {
  const f = API.FLOORS_V2[sample.index];
  const coarse = API.genCoarse(f.w, f.h);
  const spineLen = Math.max(4, Math.round(f.roomTarget * (1 - f.optionalShare)));
  const ends = API.genPickEnds(coarse.cw, coarse.ch, API.genRng(sample.seed));
  const spine = API.genSpinePath(ends.entry, ends.gate, spineLen,
    coarse.cw, coarse.ch, API.genRng(sample.seed + 101));
  const branches = API.genGrowBranches(spine, f.roomTarget - spineLen,
    coarse.cw, coarse.ch, API.genRng(sample.seed + 202));
  const plan = { rooms: [], edges: [], spine: [] };
  API.genBuildRooms(plan, spine, branches);
  API.genAssignRoles(plan, f, sample.index, API.genRng(sample.seed + 303));

  const byCell = {};
  plan.rooms.forEach((room) => {
    byCell[room.cell.cx + "," + room.cell.cy] = room;
  });
  const cells = [];
  for (let cy = 0; cy < coarse.ch; cy += 1) {
    for (let cx = 0; cx < coarse.cw; cx += 1) {
      const room = byCell[cx + "," + cy];
      if (!room) {
        cells.push('<div class="cell empty"></div>');
        continue;
      }
      const isSpine = room.kind === "spine";
      const label = isSpine ? String(room.spineIndex + 1) : (LABELS[room.role] || "?");
      cells.push('<div class="cell ' + (isSpine ? "spine" : "branch") +
        '" style="background:' + (COLORS[room.role] || "#39424f") +
        '" title="' + esc(room.role) + " (" + cx + "," + cy + ')' +
        '">' + esc(label) + "</div>");
    }
  }
  const roles = {};
  plan.rooms.forEach((room) => { roles[room.role] = (roles[room.role] || 0) + 1; });
  const roleLine = Object.keys(roles).sort()
    .map((role) => role + ":" + roles[role]).join(" · ");
  return '<section class="card"><h2>' +
    esc(f.name + " · этаж " + (sample.index + 1)) + "</h2>" +
    '<p class="stats">' + f.w + "×" + f.h + " · сетка " + coarse.cw + "×" +
    coarse.ch + " · комнат " + plan.rooms.length + " · веток " +
    (plan.rooms.length - spine.length) + " · стеблей " + branches.length + "</p>" +
    '<div class="grid" style="grid-template-columns:repeat(' + coarse.cw +
    ',34px)">' + cells.join("") + "</div>" +
    '<p class="roles">' + esc(roleLine) + "</p></section>";
}

const legend = Object.keys(COLORS).map((role) =>
  '<span><i style="background:' + COLORS[role] + '"></i>' + role + "</span>"
).join("");

const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
  "<title>Ветки и роли</title><style>" +
  "body{margin:0;padding:24px;background:#0f1115;color:#dbe2ea;" +
  "font:13px/1.4 system-ui,Segoe UI,sans-serif}" +
  "h1{margin:0 0 6px;font-size:20px}h2{margin:0 0 4px;font-size:14px}" +
  ".lead{margin:0 0 14px;color:#93a1b3}" +
  ".legend{display:flex;flex-wrap:wrap;gap:10px 14px;margin:0 0 18px;" +
  "color:#93a1b3;font-size:11px}.legend i{display:inline-block;width:10px;" +
  "height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}" +
  ".list{display:flex;flex-wrap:wrap;gap:16px}" +
  ".card{background:#171b22;border:1px solid #2a3140;border-radius:10px;" +
  "padding:14px 16px 12px}.stats{margin:0 0 10px;color:#8593a6;font-size:11px}" +
  ".grid{display:grid;gap:3px}.cell{width:34px;height:34px;border-radius:4px;" +
  "display:flex;align-items:center;justify-content:center;color:#eef3f8;" +
  "font-size:10px;font-weight:700}.cell.empty{background:#202633}" +
  ".cell.spine{outline:1px solid #6f8a86}.roles{margin:9px 0 0;" +
  "color:#8593a6;font-size:10px;max-width:260px}" +
  "</style></head><body><h1>Ветки и роли</h1>" +
  '<p class="lead">S — вход, G — врата, J — развилка. На хребте числа — ' +
  "порядок; в ветках буквы — роль (наведи курсор).</p>" +
  '<div class="legend">' + legend + "</div>" +
  '<div class="list">' + SAMPLES.map(buildCard).join("") + "</div>" +
  "</body></html>";

const out = path.join(__dirname, "..", "docs", "branch-preview.html");
fs.writeFileSync(out, html, "utf8");
console.log(out);
