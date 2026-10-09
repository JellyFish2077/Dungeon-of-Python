// Предметы подземелья: оружие, броня, амулеты и зелья.
// slot: weapon | armor | accessory | potion
// atk — бонус к урону, hp — бонус к максимуму здоровья, def — снижение урона,
// heal — сколько здоровья восстанавливает зелье, tier — с какого этажа может выпасть.
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

const ITEM_POOL = [
  // Оружие
  { id: "rusty_sword", name: "Ржавый меч", slot: "weapon", atk: 3, rarity: "common", tier: 0 },
  { id: "short_sword", name: "Короткий меч", slot: "weapon", atk: 6, rarity: "uncommon", tier: 1 },
  { id: "steel_sword", name: "Стальной меч", slot: "weapon", atk: 10, rarity: "rare", tier: 2 },
  { id: "dragon_blade", name: "Клинок дракона", slot: "weapon", atk: 16, rarity: "epic", tier: 3 },

  // Броня
  { id: "cloth_robe", name: "Тканевая роба", slot: "armor", hp: 10, def: 0, rarity: "common", tier: 0 },
  { id: "leather_armor", name: "Кожаная броня", slot: "armor", hp: 20, def: 1, rarity: "uncommon", tier: 1 },
  { id: "chainmail", name: "Кольчуга", slot: "armor", hp: 35, def: 3, rarity: "rare", tier: 2 },
  { id: "dragon_scale", name: "Чешуя дракона", slot: "armor", hp: 55, def: 6, rarity: "epic", tier: 3 },

  // Амулеты
  { id: "ring_power", name: "Кольцо силы", slot: "accessory", atk: 4, rarity: "uncommon", tier: 1 },
  { id: "guard_amulet", name: "Амулет защиты", slot: "accessory", def: 3, rarity: "uncommon", tier: 1 },
  { id: "lucky_charm", name: "Талисман удачи", slot: "accessory", atk: 2, def: 2, rarity: "rare", tier: 2 },
  { id: "hero_medal", name: "Медаль героя", slot: "accessory", atk: 6, hp: 20, rarity: "epic", tier: 3 },

  // Артефакты поздних этажей
  { id: "frost_blade", name: "Морозный клинок", slot: "weapon", atk: 20, rarity: "epic", tier: 4 },
  { id: "aegis", name: "Эгида", slot: "armor", hp: 75, def: 9, rarity: "epic", tier: 4 },
  { id: "crown", name: "Корона власти", slot: "accessory", atk: 8, hp: 40, def: 3, rarity: "epic", tier: 4 },

  // Зелья
  { id: "small_potion", name: "Малое зелье", slot: "potion", heal: 30, rarity: "common", tier: 0 },
  { id: "big_potion", name: "Большое зелье", slot: "potion", heal: 70, rarity: "uncommon", tier: 1 },
  { id: "elixir", name: "Эликсир жизни", slot: "potion", heal: 9999, rarity: "rare", tier: 2 }
];

function itemById(id) {
  return ITEM_POOL.find((i) => i.id === id) || null;
}

function itemsForFloor(floorIndex, slot) {
  return ITEM_POOL.filter(
    (i) => i.tier <= Math.min(floorIndex + 1, 4) && (!slot || i.slot === slot)
  );
}
