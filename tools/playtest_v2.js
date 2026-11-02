// Пять автоматических прогонов кампании v2: этажи, содержимое, отказы.
// Запуск: node tools/playtest_v2.js
const { API, freshRun } = require("./game_harness.js");

const RUNS = 5;

function runOne(run) {
  freshRun(0);
  API.setCampaign(2);
  API.setGenV2(true);
  const rows = [];
  let fallback = 0;
  let invalid = 0;
  let enemies = 0;
  let rooms = 0;
  let traps = 0;
  let camps = 0;
  for (let i = 0; i < API.FLOORS_V2.length; i += 1) {
    const state = API.buildCheckedFloor(i);
    const f = API.floorDef(i);
    const problems = API.validateFloorState(state);
    if (problems.length) invalid += 1;
    if (state.checked && state.checked.fallback) fallback += 1;
    if (!f.boss && !state.plan) invalid += 1;
    if (f.boss && state.plan) invalid += 1;
    rooms += state.plan ? state.plan.rooms.length : 0;
    enemies += state.enemies.length;
    traps += state.traps.length;
    camps += state.camps.length;
    rows.push({
      floor: i + 1,
      name: f.name,
      rooms: state.plan ? state.plan.rooms.length : "—",
      enemies: state.enemies.length,
      traps: state.traps.length,
      camps: state.camps.length,
      attempts: state.checked ? state.checked.attempts : 1,
      fallback: state.checked && state.checked.fallback ? "legacy" : ""
    });
  }
  API.setGenV2(false);
  API.setCampaign(1);
  return { run, rows, rooms, enemies, traps, camps, fallback, invalid };
}

const results = [];
for (let run = 1; run <= RUNS; run += 1) results.push(runOne(run));

for (const result of results) {
  console.log("Прогон " + result.run + ": комнат " + result.rooms +
    ", врагов " + result.enemies + ", ловушек " + result.traps +
    ", костров " + result.camps +
    ", отказов " + result.fallback + ", ошибок " + result.invalid);
  for (const row of result.rows) {
    console.log("  " + row.floor + ". " + row.name +
      " · комнат " + row.rooms + " · врагов " + row.enemies +
      " · ловушек " + row.traps + " · костров " + row.camps +
      " · попыток " + row.attempts + (row.fallback ? " · " + row.fallback : ""));
  }
}

const bad = results.filter((r) => r.invalid || r.fallback).length;
console.log("Итого: " + (RUNS - bad) + "/" + RUNS + " прогонов без отказов и ошибок");
process.exit(bad ? 1 : 0);
