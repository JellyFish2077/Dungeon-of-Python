// Инструмент разработчика: быстрый обзор этажей, боссов и баланса.
// Запуск:
//   node tools/dev_toolkit.js floors
//   node tools/dev_toolkit.js bosses
//   node tools/dev_toolkit.js balance
//   node tools/dev_toolkit.js floor 3
const { API, freshRun } = require("./game_harness.js");

function pad(value, width) {
  const text = String(value);
  return text + " ".repeat(Math.max(0, width - text.length));
}

function floors() {
  API.setCampaign(2);
  freshRun(0);
  console.log("Этажи кампании v2");
  console.log(pad("#", 4) + pad("Название", 24) + pad("Биом", 20) +
    pad("Размер", 10) + pad("Врагов", 8) + pad("Ловушек", 9) + "Босс");
  API.FLOORS_V2.forEach((f, i) => {
    const st = API.createFloorState(i);
    console.log(pad(i + 1, 4) + pad(f.name || f.bossName, 24) +
      pad(f.biomeName || "-", 20) + pad(f.w + "×" + f.h, 10) +
      pad(st.enemies.length, 8) + pad(st.traps.length, 9) +
      (f.boss ? (f.bossName || f.bossKey) : "-"));
  });
}

function bosses() {
  console.log("Боссы");
  Object.keys(API.BOSS_INFO).forEach((key) => {
    const info = API.BOSS_INFO[key];
    console.log("");
    console.log(info.name + " — " + info.title);
    console.log("  Фазы: " + info.phases.join(" → "));
    console.log("  Правило: " + info.rule);
    console.log("  Реплика: «" + info.taunts[0] + "»");
    console.log("  Трофей: " + info.trophy.name);
    console.log("  Добыча: " + info.loot.join(", "));
    console.log("  Слуги: " + info.minions.join(", "));
  });
}

function balance() {
  freshRun(0);
  API.setCampaign(2);
  console.log("Ориентир баланса: обычный враг и босс на каждом этаже");
  console.log("Тестовый герой: ур. 5, HP 200, урон 40 (фикстура harness)");
  console.log(pad("Этаж", 6) + pad("Обычный HP", 12) + pad("Обычный урон", 14) +
    pad("Босс HP", 10) + "Босс урон");
  API.FLOORS_V2.forEach((f, i) => {
    const pool = !f.boss && f.pool && f.pool.length ? f.pool : null;
    const mob = pool ? API.makeEnemy(pool[0], i, false) : null;
    const boss = f.boss ? API.makeEnemy(f.bossKey, i, false, 0, 0, true) : null;
    console.log(pad(i + 1, 6) + pad(mob ? mob.maxHp : "-", 12) +
      pad(mob ? mob.dmg : "-", 14) + pad(boss ? boss.maxHp : "-", 10) +
      pad(boss ? boss.dmg : "-", 11));
  });
}

function floor(index) {
  API.setCampaign(2);
  freshRun(0);
  const i = Math.max(0, Math.min(API.FLOORS_V2.length - 1, Number(index) - 1 || 0));
  const state = API.createFloorState(i);
  const f = API.floorDef(i);
  console.log("Этаж " + (i + 1) + ": " + (f.name || f.bossName));
  console.log(JSON.stringify({
    boss: !!f.boss,
    biome: f.biome,
    size: f.w + "×" + f.h,
    rooms: state.plan ? state.plan.rooms.length : 0,
    enemies: state.enemies.length,
    traps: state.traps.length,
    camps: state.camps.length,
    treasures: state.treasures.length,
    nodes: state.nodes.length,
    arena: state.arena ? {
      key: state.arena.key,
      anchors: state.arena.anchors.length,
      sealed: state.arena.sealed
    } : null,
    checked: state.checked
  }, null, 2));
}

const cmd = process.argv[2] || "floors";
if (cmd === "floors") floors();
else if (cmd === "bosses") bosses();
else if (cmd === "balance") balance();
else if (cmd === "floor") floor(process.argv[3]);
else {
  console.log("Команды: floors | bosses | balance | floor <номер>");
  process.exit(2);
}
