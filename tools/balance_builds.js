// Баланс предельных сборок: крит, вампиризм, золото, шипы и блок.
// Герой бессмертен, поэтому бой всегда доигрывается: сравниваются не
// выживание, а число вопросов до победы, полученный урон и золото.
// Запуск: node tools/balance_builds.js [--battles 40] [--skill 0.75]
"use strict";

const path = require("path");
const { API } = require(path.join(__dirname, "game_harness.js"));
const G = API.G;

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] != null ? Number(args[i + 1]) : def;
}
const BATTLES = Math.max(1, Math.min(500, arg("--battles", 40)));
const SKILL = Math.max(0, Math.min(1, arg("--skill", 0.75)));

// Детерминированный rng: одинаковые сборки сравниваются на одних боях.
let seed = 1;
function srand(n) { seed = n >>> 0; }
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
Math.random = rnd;

const OVERLAYS = ["end-overlay", "shop-overlay", "battle-overlay", "blessing-overlay", "forge-overlay",
  "level-loading", "entrance-overlay", "calibration-overlay", "dialog-overlay"];
const IMMORTAL = 1000000;

function setupFloor(floorIdx, level) {
  G.running = true;
  G.name = "Баланс";
  G.difficulty = "normal";
  G.omen = "steady";
  G.startedAt = Date.now();
  G.floorIndex = floorIdx;
  G.visited = new Set([floorIdx]);
  G.missed = [];
  G.uid = 0;
  G.cache = {};
  G.player = {
    hp: IMMORTAL, baseMaxHp: IMMORTAL, maxHp: IMMORTAL, level: level,
    xp: 0, xpNext: 999999, dmgBase: 12 + (level - 1) * 3,
    atkBonus: 0, defBonus: 0, gold: 0,
    poison: 0, freeHints: 0, snared: false, cursedNext: false, _lastHp: null
  };
  G.equipment = { weapon: null, shield: null, armor: null, accessory: null };
  G.inventory = [];
  G.stats = {
    correct: 0, wrong: 0, codePassed: 0, codeTried: 0, copyPassed: 0, copyTried: 0,
    hintsUsed: 0, goldEarned: 0, topicStats: {}, floorsCleared: 0, kills: 0, streak: 0
  };
  G.battle = null;
  G.shopTrader = false;
  G.finishedVictory = false;
  G.victoryBanked = false;
  G.victoryBankedAmount = 0;
  G.hazard = null;
  G.blessings = {};
  G.blessingOffer = null;
  G.ability = { key: "breath", left: 0 };
  OVERLAYS.forEach((id) => { const n = globalThis.document.getElementById(id); if (n) n.classList.add("hidden"); });
  API.activateFloor(floorIdx);
}

function item(id) {
  const it = API.ITEM_POOL.find((i) => i.id === id);
  if (!it) throw new Error("нет предмета " + id);
  return Object.assign({}, it);
}

function equip(ids) {
  G.equipment = {
    weapon: ids.weapon ? item(ids.weapon) : null,
    shield: ids.shield ? item(ids.shield) : null,
    armor: ids.armor ? item(ids.armor) : null,
    accessory: ids.accessory ? item(ids.accessory) : null
  };
  API.recalcStats();
  G.player.maxHp = IMMORTAL;
  G.player.hp = IMMORTAL;
}

function fight(floorIdx, enemyKey, boss) {
  const enemy = API.makeEnemy(enemyKey, floorIdx, false, 0, 0, !!boss);
  enemy.x = G.playerPos.x;
  enemy.y = G.playerPos.y;
  G.enemies = [enemy];
  G.battle = null;
  G.player.hp = IMMORTAL;
  G.player.poison = 0;
  const gold0 = G.player.gold;
  API.openBattle(enemy);
  let steps = 0;
  let questions = 0;
  while (G.battle && steps < 400) {
    steps += 1;
    const b = G.battle;
    if (b.phase !== "question") {
      API.continueBattle();
      continue;
    }
    questions += 1;
    const c = b.challenge;
    if (!c) { API.continueBattle(); continue; }
    const view = c.view || c.question || c.task;
    if (c.type === "copy") {
      c.code = rnd() < SKILL ? c.task.code : "";
      API.checkCopy();
    } else if (c.type === "code") {
      const total = Math.max(1, (c.task.tests || []).length);
      const solved = rnd() < SKILL;
      API.applyCodeResult({ ok: true, passed: solved ? total : 0, total }, b);
    } else {
      const right = view.answer;
      const ok = rnd() < SKILL;
      let chosen = right;
      if (!ok && view.options.length > 1) {
        do { chosen = view.options[Math.floor(rnd() * view.options.length)]; } while (chosen === right);
      }
      API.answerMC(chosen);
    }
  }
  const out = {
    won: enemy.hp <= 0,
    questions,
    taken: IMMORTAL - G.player.hp,
    gold: G.player.gold - gold0
  };
  G.battle = null;
  return out;
}

const avg = (list, f) => list.reduce((s, x) => s + f(x), 0) / (list.length || 1);

function runBuild(name, ids, floorIdx, level, enemyKey, boss) {
  setupFloor(floorIdx, level);
  equip(ids);
  const res = [];
  for (let i = 0; i < BATTLES; i += 1) {
    srand(1000 + i * 7919 + floorIdx * 31);
    res.push(fight(floorIdx, enemyKey, boss));
  }
  console.log([
    name.padEnd(30),
    String(res.filter((r) => r.won).length).padStart(3) + "/" + BATTLES,
    "вопросов " + avg(res, (r) => r.questions).toFixed(2),
    "урон " + Math.round(avg(res, (r) => r.taken)),
    "золото " + avg(res, (r) => r.gold).toFixed(1)
  ].join(" · "));
}

const BUILDS = [
  ["сталь (база)", { weapon: "steel_sword", shield: "steel_shield", armor: "chainmail", accessory: "guard_amulet" }],
  ["крит: трезубец+тень", { weapon: "trident_precise", shield: "spiked_shield", armor: "chainmail", accessory: "lucky_charm" }],
  ["крит: рассвет+медаль", { weapon: "dawn_blade", shield: "steel_shield", armor: "chainmail", accessory: "hero_medal" }],
  ["вампиризм: кровь (3)", { weapon: "vampiric_blade", shield: "steel_shield", armor: "leather_armor", accessory: "serpent_ward" }],
  ["шипы: латы+щит (50%)", { weapon: "steel_sword", shield: "warden_shield", armor: "warden_plate", accessory: "guard_amulet" }],
  ["блок: панцирь+эгида (3)", { weapon: "steel_sword", shield: "aegis", armor: "mirror_plate", accessory: "guard_amulet" }],
  ["золото: фарт (70%)", { weapon: "bone_dagger", shield: "steel_shield", armor: "cloth_robe", accessory: "ledger_amulet" }],
  ["золото: корона (50%)", { weapon: "steel_sword", shield: "steel_shield", armor: "chainmail", accessory: "crown" }],
  ["пепел (3) + эгида", { weapon: "ash_blade", shield: "aegis", armor: "ash_mantle", accessory: "ash_eye" }],
  ["предел: бездна", { weapon: "dawn_blade", shield: "aegis", armor: "warden_plate", accessory: "heart_abyss" }],
  ["предел: корона", { weapon: "dawn_blade", shield: "aegis", armor: "warden_plate", accessory: "crown" }],
  ["голый герой", {}]
];

const SCENARIOS = [
  ["Этаж 5, скелет", 4, 5, "skeleton", false],
  ["Этаж 10, волк", 9, 12, "wolf", false],
  ["Этаж 13, волк", 12, 15, "wolf", false],
  ["Дракон, 15", 14, 20, "dragon", true]
];

console.log("Предельные сборки: бессмертный герой, точность " + Math.round(SKILL * 100) +
  "%, " + BATTLES + " боёв на сборку");
SCENARIOS.forEach(([title, floorIdx, level, enemyKey, boss]) => {
  console.log("\n=== " + title + " · уровень " + level + " ===");
  BUILDS.forEach(([name, ids]) => runBuild(name, ids, floorIdx, level, enemyKey, boss));
});
