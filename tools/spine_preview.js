// Схемы хребта для визуальной проверки этапа 1.2.
// Запуск: node tools/spine_preview.js
// Результат: docs/spine-preview.html
const fs = require("fs");
const path = require("path");
const { API } = require("./game_harness.js");

const SAMPLES = [
  { w: 40, h: 28, target: 7, seed: 1 },
  { w: 40, h: 28, target: 7, seed: 2 },
  { w: 44, h: 30, target: 9, seed: 3 },
  { w: 44, h: 30, target: 9, seed: 4 },
  { w: 50, h: 32, target: 10, seed: 5 },
  { w: 50, h: 32, target: 10, seed: 6 },
  { w: 56, h: 36, target: 11, seed: 7 },
  { w: 56, h: 36, target: 11, seed: 8 },
  { w: 32, h: 23, target: 5, seed: 9 },
  { w: 32, h: 23, target: 5, seed: 10 }
];

function esc(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[ch]));
}

function diagram(sample) {
  const coarse = API.genCoarse(sample.w, sample.h);
  const ends = API.genPickEnds(coarse.cw, coarse.ch, API.genRng(sample.seed));
  const spine = API.genSpinePath(
    ends.entry, ends.gate, sample.target,
    coarse.cw, coarse.ch, API.genRng(sample.seed ^ 0x9E3779B9)
  );
  const pathKeys = new Set(spine.map(API.genCellKey));
  const entryKey = API.genCellKey(ends.entry);
  const gateKey = API.genCellKey(ends.gate);
  const cells = [];
  for (let cy = 0; cy < coarse.ch; cy += 1) {
    for (let cx = 0; cx < coarse.cw; cx += 1) {
      const k = cx + "," + cy;
      const classes = ["cell"];
      let label = "";
      if (pathKeys.has(k)) classes.push("path");
      if (k === entryKey) {
        classes.push("entry");
        label = "S";
      } else if (k === gateKey) {
        classes.push("gate");
        label = "G";
      } else if (pathKeys.has(k)) {
        const order = spine.findIndex((cell) => API.genCellKey(cell) === k) + 1;
        label = String(order);
      }
      cells.push(
        '<div class="' + classes.join(" ") + '" title="' +
        (cx + "," + cy) + '">' + label + "</div>"
      );
    }
  }
  const stats =
    sample.w + "×" + sample.h + " · сетка " + coarse.cw + "×" + coarse.ch +
    " · цель " + sample.target + " · факт " + spine.length +
    " · S(" + ends.entry.cx + "," + ends.entry.cy + ")" +
    " → G(" + ends.gate.cx + "," + ends.gate.cy + ")";
  return '<section class="card">' +
    '<h2>Карта ' + sample.w + "×" + sample.h + ", сид " + sample.seed + "</h2>" +
    '<p class="stats">' + esc(stats) + "</p>" +
    '<div class="grid" style="grid-template-columns:repeat(' + coarse.cw +
    ',30px)">' + cells.join("") + "</div></section>";
}

const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
  "<title>Хребет: схемы</title><style>" +
  "body{margin:0;padding:24px;background:#0f1115;color:#dbe2ea;" +
  "font:14px/1.4 system-ui,Segoe UI,sans-serif}" +
  "h1{margin:0 0 6px;font-size:20px}h2{margin:0 0 4px;font-size:15px}" +
  ".lead{margin:0 0 18px;color:#93a1b3}" +
  ".legend{display:flex;gap:16px;margin:0 0 18px;color:#93a1b3}" +
  ".legend i{display:inline-block;width:12px;height:12px;border-radius:3px;" +
  "margin-right:5px;vertical-align:-2px}" +
  ".list{display:flex;flex-wrap:wrap;gap:16px}" +
  ".card{background:#171b22;border:1px solid #2a3140;border-radius:10px;" +
  "padding:14px 16px 16px;min-width:210px}" +
  ".stats{color:#8593a6;margin:0 0 12px;font-size:12px}" +
  ".grid{display:grid;gap:3px}" +
  ".cell{width:30px;height:30px;border-radius:4px;background:#202633;" +
  "display:flex;align-items:center;justify-content:center;color:#5b687a;" +
  "font-size:11px;font-weight:600}" +
  ".cell.path{background:#1f4d4a;color:#9fe3d8}" +
  ".cell.entry{background:#256b3e;color:#d7ffe4}" +
  ".cell.gate{background:#7a2f3a;color:#ffd9df}" +
  "</style></head><body>" +
  "<h1>Хребет: вход → врата</h1>" +
  '<p class="lead">Клетки крупной сетки 7×5. Числа — порядок на хребте. ' +
  "Проверяем, что путь не липнет к краю и не выглядит одной прямой.</p>" +
  '<div class="legend"><span><i style="background:#256b3e"></i>вход</span>' +
  '<span><i style="background:#1f4d4a"></i>хребет</span>' +
  '<span><i style="background:#7a2f3a"></i>врата</span></div>' +
  '<div class="list">' + SAMPLES.map(diagram).join("") + "</div>" +
  "</body></html>";

const out = path.join(__dirname, "..", "docs", "spine-preview.html");
fs.writeFileSync(out, html, "utf8");
console.log(out);
