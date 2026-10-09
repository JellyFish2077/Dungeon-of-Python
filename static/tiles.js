// Процедурный SVG-атлас: пол, стены и декор под 10 тем этажей.
// Тайлы векторные — резкие на любом зуме, внешних файлов нет.
const TILE_THEMES = [
  { floor: ["#22345a", "#14213c"], wall: ["#5a6c8f", "#232f4a"], mortar: "#0b1220" },
  { floor: ["#40341f", "#251d0d"], wall: ["#7a6540", "#332913"], mortar: "#120d06" },
  { floor: ["#37411f", "#20260f"], wall: ["#6d7a35", "#2a3013"], mortar: "#0e1106" },
  { floor: ["#214536", "#122a1f"], wall: ["#3f7460", "#1a3329"], mortar: "#070f0b" },
  { floor: ["#2a4c6c", "#16304a"], wall: ["#4f87a8", "#1e3a52"], mortar: "#080f16" },
  { floor: ["#46432a", "#2b2813"], wall: ["#7d7448", "#38351a"], mortar: "#0f0d05" },
  { floor: ["#4a2323", "#2b1212"], wall: ["#7d3d3d", "#381919"], mortar: "#0f0606" },
  { floor: ["#36365c", "#1d1d34"], wall: ["#5c5c8f", "#262640"], mortar: "#0a0a14" },
  { floor: ["#422a6e", "#261747"], wall: ["#6d4aa8", "#332058"], mortar: "#0c0714" },
  { floor: ["#572020", "#330e0f"], wall: ["#8f3838", "#421818"], mortar: "#100505" }
];

const DECOR_NAMES = { 1: "grass", 2: "water", 3: "rubble", 4: "bones", 5: "mushroom" };

const _tileCache = new Map();

function _uri(svg) {
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
}

function _speckles(seed, n, color) {
  let s = "";
  let x = (seed * 7 + 3) % 13 + 1;
  let y = (seed * 11 + 5) % 13 + 1;
  for (let i = 0; i < n; i++) {
    s += "<rect x='" + x + "' y='" + y + "' width='1' height='1' fill='" + color + "'/>";
    x = (x * 5 + 3) % 14 + 1;
    y = (y * 7 + 2) % 14 + 1;
  }
  return s;
}

function _floorSvg(theme, v) {
  const t = TILE_THEMES[theme % TILE_THEMES.length];
  const crack = v === 3
    ? "<path d='M3 2 L6 6 L5 10 L9 14' stroke='" + t.floor[1] + "' stroke-width='1' fill='none'/>"
    : "";
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>" +
    "<rect width='16' height='16' fill='" + t.floor[0] + "'/>" +
    "<rect width='16' height='8' fill='" + t.floor[1] + "' opacity='0.25'/>" +
    _speckles(theme * 4 + v, 5, t.floor[1]) + crack + "</svg>";
}

function _wallSvg(theme, v) {
  const t = TILE_THEMES[theme % TILE_THEMES.length];
  const off = (v % 2) * 3;
  const b0 = t.wall[0];
  const b1 = t.wall[1];
  const m = t.mortar;
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>" +
    "<rect width='16' height='16' fill='" + m + "'/>" +
    "<g>" +
    "<rect x='0' y='0' width='" + (8 - off) + "' height='7' fill='" + b0 + "'/>" +
    "<rect x='" + (9 - off) + "' y='0' width='" + (7 + off) + "' height='7' fill='" + b0 + "'/>" +
    "<rect x='0' y='9' width='" + (6 + off) + "' height='7' fill='" + b1 + "'/>" +
    "<rect x='" + (7 + off) + "' y='9' width='" + (9 - off) + "' height='7' fill='" + b1 + "'/>" +
    "</g>" +
    "<g fill='#ffffff' opacity='0.14'>" +
    "<rect x='0' y='0' width='" + (8 - off) + "' height='1'/>" +
    "<rect x='" + (9 - off) + "' y='0' width='" + (7 + off) + "' height='1'/>" +
    "<rect x='0' y='9' width='" + (6 + off) + "' height='1'/>" +
    "<rect x='" + (7 + off) + "' y='9' width='" + (9 - off) + "' height='1'/>" +
    "</g>" +
    "<g fill='#000000' opacity='0.3'>" +
    "<rect x='0' y='6' width='" + (8 - off) + "' height='1'/>" +
    "<rect x='" + (9 - off) + "' y='6' width='" + (7 + off) + "' height='1'/>" +
    "<rect x='0' y='15' width='" + (6 + off) + "' height='1'/>" +
    "<rect x='" + (7 + off) + "' y='15' width='" + (9 - off) + "' height='1'/>" +
    "</g></svg>";
}

function _decorSvg(theme, name) {
  const t = TILE_THEMES[theme % TILE_THEMES.length];
  let inner = "";
  if (name === "grass") {
    inner = "<path d='M4 12 L5 7 L6 12 M7 12 L8 6 L9 12 M10 12 L11 8 L12 12' stroke='#4ade80' stroke-width='1.2' fill='none' stroke-linecap='round'/>";
  } else if (name === "water") {
    inner = "<ellipse cx='8' cy='9' rx='5' ry='3.4' fill='#38bdf8' opacity='0.8'/>" +
      "<ellipse cx='7' cy='8.4' rx='2' ry='1.1' fill='#bae6fd' opacity='0.8'/>";
  } else if (name === "rubble") {
    inner = "<circle cx='5' cy='6' r='1.6' fill='#94a3b8'/><circle cx='10' cy='10' r='2' fill='#64748b'/><circle cx='12.5' cy='5' r='1.3' fill='#94a3b8'/>";
  } else if (name === "bones") {
    inner = "<path d='M4 5 L12 11 M12 5 L4 11' stroke='#e2e8f0' stroke-width='1.4' stroke-linecap='round'/>";
  } else if (name === "mushroom") {
    inner = "<rect x='7.4' y='8' width='1.2' height='4' fill='#e7e5e4'/>" +
      "<path d='M4 8.5 A4 3.4 0 0 1 12 8.5 Z' fill='#dc2626'/>" +
      "<circle cx='6.4' cy='7' r='0.7' fill='#fecaca'/><circle cx='9.6' cy='7.4' r='0.5' fill='#fecaca'/>";
  }
  void t;
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>" + inner + "</svg>";
}

function tileBackground(themeIdx, floorIdx, x, y, isFloor, decorCode) {
  const theme = ((themeIdx % TILE_THEMES.length) + TILE_THEMES.length) % TILE_THEMES.length;
  const fv = (x * 7 + y * 13 + (floorIdx + 1) * 3) % 4;
  const wv = (x + y) % 3;
  const fk = theme + "|f|" + fv;
  const wk = theme + "|w|" + wv;
  if (!_tileCache.has(fk)) _tileCache.set(fk, _uri(_floorSvg(theme, fv)));
  if (!_tileCache.has(wk)) _tileCache.set(wk, _uri(_wallSvg(theme, wv)));
  let bg = _tileCache.get(isFloor ? fk : wk);
  const dname = DECOR_NAMES[decorCode];
  if (isFloor && dname) {
    const dk = theme + "|d|" + dname;
    if (!_tileCache.has(dk)) _tileCache.set(dk, _uri(_decorSvg(theme, dname)));
    bg = _tileCache.get(dk) + ", " + bg;
  }
  return bg;
}
