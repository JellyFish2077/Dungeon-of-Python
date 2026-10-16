// Предметы подземелья: оружие, броня, амулеты и зелья.
// slot: weapon | armor | accessory | potion
// atk — бонус к урону, hp — бонус к максимуму здоровья, def — снижение урона,
// heal — сколько здоровья восстанавливает зелье, tier — с какого этажа может выпасть.
// effect — особое действие предмета (см.game.js, applyItemEffect):
//   { kind: "lifesteal", pct }      — лечит героя на pct% нанесённого урона
//   { kind: "crit", chance, mul }   — шанс chance Crit ×mul
//   { kind: "block", charges }      — блокирует первые charges ударов полностью
//   { kind: "thorns", pct }         — +pct% урона к твоему верному удару
//   { kind: "hintFree", charges }   — charges бесплатных подсказок без −10 HP
//   { kind: "goldBonus", pct }      — +pct% золота за верный ответ
//   { kind: "poisonImmune" }        — яд врага не действует
//   { kind: "reveal" }              — враги видны на всём этаже
//   { kind: "execute", pct }        — +pct% урона, если у врага меньше 30% HP
//   { kind: "cleanse" }             — зелье снимает яд
//   { kind: "fullHeal" }            — зелье восстанавливает всё здоровье
//   { kind: "antidote" }            — зелье снимает только яд
const SLOT_NAMES = {
  weapon: "Оружие",
  armor: "Броня",
  accessory: "Амулет",
  potion: "Зелье"
};

const RARITY = {
  common: { name: "Обычный", color: "#94a3b8" },
  uncommon: { name: "Необычный", color: "#22c55e" },
  rare: { name: "Редкий", color: "#3b82f6" },
  epic: { name: "Эпический", color: "#a855f7" }
};

// Комплекты-семейства: у части предметов есть поле set, и если надеть две
// вещи одной семьи — работает малый бонус, если все три — сильный.
// Поле setBonus на игроке считает game.js (recalcStats), здесь только данные.
const ITEM_SETS = {
  forge: {
    key: "forge",
    name: "Снаряжение кузнеца",
    icon: "⚒",
    color: "#94a3b8",
    two: { def: 4 },
    three: { def: 9, hp: 30 },
    twoText: "+4 к защите",
    threeText: "+9 к защите и +30 к здоровью"
  },
  shadow: {
    key: "shadow",
    name: "Убор тени",
    icon: "☾",
    color: "#a78bfa",
    two: { crit: 0.08 },
    three: { crit: 0.18, lifesteal: 10 },
    twoText: "+8% к шансу крита",
    threeText: "+18% к шансу крита и +10% вампиризма"
  },
  dragon: {
    key: "dragon",
    name: "Наследие дракона",
    icon: "✦",
    color: "#f97316",
    two: { atk: 5 },
    three: { atk: 12, hp: 60 },
    twoText: "+5 к урону",
    threeText: "+12 к урону и +60 к здоровью"
  },
  blood: {
    key: "blood",
    name: "Живая кровь",
    icon: "❦",
    color: "#f87171",
    two: { lifesteal: 8 },
    three: { lifesteal: 20, hp: 25 },
    twoText: "+8% вампиризма",
    threeText: "+20% вампиризма и +25 к здоровью"
  },
  luck: {
    key: "luck",
    name: "Фартовая доля",
    icon: "✧",
    color: "#facc15",
    two: { gold: 15 },
    three: { gold: 40, atk: 3 },
    twoText: "+15% золота",
    threeText: "+40% золота и +3 к урону"
  }
};

function setByKey(key) {
  return key && ITEM_SETS[key] ? ITEM_SETS[key] : null;
}

function itemSetKey(item) {
  return item && item.set && ITEM_SETS[item.set] ? item.set : null;
}

const ITEM_POOL = [
  // ---------- Оружие ----------
  { id: "rusty_sword", name: "Ржавый меч", slot: "weapon", atk: 3, rarity: "common", tier: 0,
    desc: "Тяжёлый кусок железа. Ржавчина, но хоть что-то." },
  { id: "bone_dagger", name: "Костяной кинжал", slot: "weapon", atk: 5, rarity: "uncommon", tier: 1, set: "luck",
    effect: { kind: "execute", pct: 25 },
    desc: "Острее, чем кажется. Добивает раненых врагов особенно жестоко." },
  { id: "short_sword", name: "Короткий меч", slot: "weapon", atk: 6, rarity: "uncommon", tier: 1,
    desc: "Надёжный клинок, который тяжело сломать." },
  { id: "vampiric_blade", name: "Пиявка-лезвие", slot: "weapon", atk: 7, rarity: "rare", tier: 2, set: "blood",
    effect: { kind: "lifesteal", pct: 30 },
    desc: "Тянет жизнь из противника. Твоё здоровье растёт от каждого удара." },
  { id: "steel_sword", name: "Стальной меч", slot: "weapon", atk: 10, rarity: "rare", tier: 2, set: "forge",
    desc: "Прочный, прямой, без лишних украшений." },
  { id: "trident_precise", name: "Тройник", slot: "weapon", atk: 11, rarity: "rare", tier: 2, set: "shadow",
    effect: { kind: "crit", chance: 0.2, mul: 2 },
    desc: "Три острия — три шанса попасть точно. Каждый пятый удар вдвое сильнее." },
  { id: "dragon_blade", name: "Клинок дракона", slot: "weapon", atk: 16, rarity: "epic", tier: 3, set: "dragon",
    effect: { kind: "crit", chance: 0.25, mul: 2 },
    desc: "Клинок из кости дракона. Если он нацелен, наносит двойной урон." },
  { id: "frost_blade", name: "Морозный клинок", slot: "weapon", atk: 20, rarity: "epic", tier: 4,
    effect: { kind: "execute", pct: 35 },
    desc: "Ледяной клинок из последнего зала. Убивает с одного удара раненых." },

  // ---------- Броня ----------
  { id: "cloth_robe", name: "Тканевая роба", slot: "armor", hp: 10, def: 0, rarity: "common", tier: 0, set: "luck",
    desc: "Чуть лучше, чем идти голым. Зато свободно." },
  { id: "leather_armor", name: "Кожаная броня", slot: "armor", hp: 20, def: 1, rarity: "uncommon", tier: 1, set: "blood",
    desc: "Прошитая из четырёх пластов. Скрипит при ходьбе." },
  { id: "spiked_shield", name: "Шипастый щит", slot: "armor", hp: 22, def: 1, rarity: "rare", tier: 2, set: "shadow",
    effect: { kind: "thorns", pct: 25 },
    desc: "Обратная сторона щита покрыта шипами: враг ранится обо что ударит." },
  { id: "chainmail", name: "Кольчуга", slot: "armor", hp: 35, def: 3, rarity: "rare", tier: 2, set: "forge",
    desc: "Тысячи колечек. Тяжёлая, зато не пробьёт." },
  { id: "mirror_plate", name: "Зеркальный панцирь", slot: "armor", hp: 30, def: 3, rarity: "epic", tier: 3,
    effect: { kind: "block", charges: 1 },
    desc: "Отражает удар обратно. Полностью гасит первую атаку врага в бою." },
  { id: "dragon_scale", name: "Чешуя дракона", slot: "armor", hp: 55, def: 6, rarity: "epic", tier: 3, set: "dragon",
    desc: "Пластины чешуи сброшенного дракона. Тяжело, зато честно." },
  { id: "aegis", name: "Эгида", slot: "armor", hp: 75, def: 9, rarity: "epic", tier: 4,
    effect: { kind: "block", charges: 2 },
    desc: "Щит Афины. Гасит первые две атаки врага в каждом бою." },

  // ---------- Амулеты ----------
  { id: "ring_power", name: "Кольцо силы", slot: "accessory", atk: 4, rarity: "uncommon", tier: 1,
    desc: "Простое кольцо, которое делает руку сильнее." },
  { id: "guard_amulet", name: "Амулет защиты", slot: "accessory", def: 3, rarity: "uncommon", tier: 1, set: "forge",
    desc: "Тяжёлый кулон. Мягкий, но надёжный." },
  { id: "ledger_amulet", name: "Амулет-бухгалтер", slot: "accessory", atk: 1, def: 1, rarity: "uncommon", tier: 1, set: "luck",
    effect: { kind: "goldBonus", pct: 30 },
    desc: "Считает каждый заработанный грош. Золота даёт на треть больше." },
  { id: "lucky_charm", name: "Талисман удачи", slot: "accessory", atk: 2, def: 2, rarity: "rare", tier: 2, set: "shadow",
    effect: { kind: "hintFree", charges: 2 },
    desc: "Две подсказки без потери здоровья за весь поход." },
  { id: "scout_lens", name: "Линза разведчика", slot: "accessory", def: 1, rarity: "rare", tier: 2,
    effect: { kind: "reveal" },
    desc: "Все монстры этажа видны сразу — и на карте, и в тумане." },
  { id: "serpent_ward", name: "Оберег от змей", slot: "accessory", hp: 25, rarity: "rare", tier: 3, set: "blood",
    effect: { kind: "poisonImmune" },
    desc: "Яд пауков и болотных тварей на тебя больше не действует." },
  { id: "hero_medal", name: "Медаль героя", slot: "accessory", atk: 6, hp: 20, rarity: "epic", tier: 3,
    effect: { kind: "crit", chance: 0.15, mul: 2 },
    desc: "Награда за подвиги. Даёт силу и немного везения в ударе." },
  { id: "crown", name: "Корона власти", slot: "accessory", atk: 8, hp: 40, def: 3, rarity: "epic", tier: 4, set: "dragon",
    effect: { kind: "goldBonus", pct: 50 },
    desc: "Золотой ободок тронного зала. Половина добычи — твоя." },

  // ---------- Зелья ----------
  { id: "small_potion", name: "Малое зелье", slot: "potion", heal: 30, rarity: "common", tier: 0,
    desc: "Восстанавливает 30 HP. Пьётся прямо в бою." },
  { id: "big_potion", name: "Большое зелье", slot: "potion", heal: 70, rarity: "uncommon", tier: 1,
    desc: "Восстанавливает 70 HP. Горькое, но работает." },
  { id: "antidote", name: "Противоядие", slot: "potion", heal: 0, rarity: "uncommon", tier: 1,
    effect: { kind: "antidote" },
    desc: "Снимает яд. Здоровья не добавляет — только чистит." },
  { id: "elixir", name: "Эликсир жизни", slot: "potion", heal: 9999, rarity: "rare", tier: 2,
    effect: { kind: "fullHeal" },
    desc: "Восстанавливает всё здоровье. Дороже, чем кажется." },
  { id: "greater_elixir", name: "Великий эликсир", slot: "potion", heal: 9999, rarity: "epic", tier: 3,
    effect: { kind: "fullHeal", cleanse: true },
    desc: "Полное здоровье и снимает яд. Второго шанса не будет." },
  { id: "purifying_draught", name: "Очищающий настой", slot: "potion", heal: 45, rarity: "rare", tier: 3,
    effect: { kind: "cleanse" },
    desc: "Лечит 45 HP и смывает яд, который уже попал в кровь." }
];

function itemById(id) {
  return ITEM_POOL.find((i) => i.id === id) || null;
}

function itemsForFloor(floorIndex, slot) {
  return ITEM_POOL.filter(
    (i) => i.tier <= Math.min(floorIndex + 1, 4) && (!slot || i.slot === slot)
  );
}

// Текст особого действия — для инвентаря, лавки и подсказки в бою.
const EFFECT_NAMES = {
  lifesteal: "Лечит частью нанесённого урона",
  crit: "Иногда наносит двойной урон",
  block: "Гасит первые атаки врага",
  thorns: "Шипы бьют сильнее при верном ответе",
  hintFree: "Бесплатные подсказки без −10 HP",
  goldBonus: "Больше золота за верные ответы",
  poisonImmune: "Не действует яд",
  reveal: "Все враги видны на этаже",
  execute: "Сильнее добивает раненых",
  cleanse: "Снимает яд",
  fullHeal: "Восстанавливает всё здоровье",
  antidote: "Снимает яд"
};

function effectText(item) {
  const e = item && item.effect;
  if (!e) return "";
  const name = EFFECT_NAMES[e.kind];
  if (!name) return "";
  const parts = [name];
  if (e.pct) parts.push("(" + e.pct + "%)");
  if (e.charges) parts.push("×" + e.charges);
  if (e.chance) parts.push("шанс " + Math.round(e.chance * 100) + "%");
  return parts.join(" ");
}