/* PyDungeon — английские тексты контента.
 *
 * Подключается после файлов с данными и до game.js. Английский текст
 * подменяет поля в тех же объектах, поэтому игровая логика, тултипы,
 * журнал и сохранения работают без изменений.
 *
 * Ключи — id предметов, вопросы, индексы этажей. Перевод интерфейса
 * (кнопки, подписи, диалоги) живёт в i18n.js.
 */
(function () {
  "use strict";
  if (!window.PyI18n || window.PyI18n.language !== "en") return;

  var items = {
    rusty_sword: ["Rusty Sword", "A heavy lump of iron. Rusty, but better than nothing."],
    bone_dagger: ["Bone Dagger", "Sharper than it looks. Finishes wounded enemies with particular cruelty."],
    short_sword: ["Short Blade", "A reliable blade that is hard to break."],
    vampiric_blade: ["Leech Blade", "Draws life from the enemy. Your health grows with every hit."],
    steel_sword: ["Steel Blade", "Solid, straight, without needless ornament."],
    trident_precise: ["Trident of Precision", "Three prongs, three chances to strike true. Every fifth hit deals double damage."],
    dragon_blade: ["Dragon Blade", "A blade of dragon bone. When it finds its mark, it deals double damage."],
    ash_blade: ["Ash Blade", "Dark steel with smouldering cracks. Finishes those barely standing."],
    frost_blade: ["Blade of Eternal Winter", "An ice blade from the last hall. Kills the wounded in a single strike."],
    dawn_blade: ["Dawn Blade", "A bright blade where morning light never fades, even underground."],
    wooden_shield: ["Wooden Shield", "Nailed together from oak planks. Takes a hit, but unreliable against fire."],
    round_shield: ["Round Shield", "A leather-covered disc with an iron boss. Good for catching arrows."],
    steel_shield: ["Steel Shield", "Heavy steel with a gilt rim. Blocks a noticeable share of a blow when defending."],
    spiked_shield: ["Spiked Shield", "The back of the shield is studded with spikes: anyone who strikes it gets hurt."],
    mirror_shield: ["Mirror Shield", "Polished steel catches the blow and fully absorbs it the first time."],
    warden_shield: ["Warden's Shield", "The dungeon warden's heavy shield: it both guards and wounds the attacker."],
    aegis: ["Aegis", "Athena's shield. Absorbs the enemy's first two attacks each battle and holds defence best of all."],
    cloth_robe: ["Novice's Robe", "A little better than walking naked. At least it's loose."],
    leather_armor: ["Leather Armor", "Stitched from four layers. Creaks when you walk."],
    chainmail: ["Chainmail", "Thousands of little rings. Heavy, but nothing gets through."],
    mirror_plate: ["Mirror Plate", "Reflects the blow back. Fully absorbs the enemy's first attack in battle."],
    dragon_scale: ["Dragon Scale", "Scales from a shed dragon. Heavy, but honest."],
    ash_mantle: ["Ash Mantle", "Burnt cloth woven with coal shards. Whoever hits it gets burned."],
    warden_plate: ["Warden's Plate", "Heavy plate studded with spikes inside and out. Every blow at you is a blow at the enemy."],
    ring_power: ["Ring of Power", "A simple ring that makes the hand stronger."],
    guard_amulet: ["Warden's Charm", "A heavy pendant. Soft, but reliable."],
    ledger_amulet: ["Treasurer's Amulet", "Counts every coin earned. Gives a third more gold."],
    lucky_charm: ["Lucky Charm", "Sometimes a hit becomes twice as strong — if you're lucky."],
    scout_lens: ["Scout's Lens", "Every monster on the floor is visible at once — on the map and in the fog."],
    serpent_ward: ["Serpent Ward", "Spider and marsh venom no longer affects you."],
    hero_medal: ["Hero's Medal", "A reward for deeds. Gives strength and a little luck in a strike."],
    ash_eye: ["Ash Eye", "An obsidian eye with a coal-black pupil. Sees the weak spot."],
    crown: ["Crown of the Throne Hall", "A golden circlet from the throne hall. Half the loot is yours."],
    heart_abyss: ["Heart of the Abyss", "A dark amulet that beats in time with someone else's fear. Returns part of the damage as health."],
    small_potion: ["Small Potion", "Restores 30 HP. Drinkable right in battle."],
    big_potion: ["Large Potion", "Restores 70 HP. Bitter, but it works."],
    antidote: ["Antidote", "Cures poison. Adds no health — it only cleanses."],
    elixir: ["Dawn Elixir", "Restores all health. More expensive than it looks."],
    greater_elixir: ["Elixir of Last Resort", "Full health and cures poison. There won't be a second chance."],
    purifying_draught: ["Purifying Draught", "Heals 45 HP and washes away poison already in the blood."],
    hint_scroll: ["Hint Scroll", "Gives one hint in battle without costing health."]
  };

  var sets = {
    forge: "Smith's Gear",
    shadow: "Shadow's Attire",
    dragon: "Dragon's Legacy",
    blood: "Living Blood",
    luck: "Lucky Share",
    ash: "Ash"
  };

  if (typeof ITEM_POOL !== "undefined") {
    ITEM_POOL.forEach(function (item) {
      var en = items[item.id];
      if (!en) return;
      item.name = en[0];
      item.desc = en[1];
    });
  }
  if (typeof ITEM_SETS !== "undefined") {
    Object.keys(sets).forEach(function (key) {
      if (ITEM_SETS[key]) ITEM_SETS[key].name = sets[key];
    });
  }
  if (typeof SLOT_NAMES !== "undefined") {
    SLOT_NAMES.weapon = "Weapon";
    SLOT_NAMES.shield = "Shield";
    SLOT_NAMES.armor = "Armor";
    SLOT_NAMES.accessory = "Amulet";
    SLOT_NAMES.potion = "Potion";
  }
  if (typeof RARITY !== "undefined") {
    RARITY.common.name = "Common";
    RARITY.uncommon.name = "Uncommon";
    RARITY.rare.name = "Rare";
    RARITY.epic.name = "Epic";
  }
  if (typeof EFFECT_NAMES !== "undefined") {
    var effects = {
      lifesteal: "Heals with part of the damage dealt",
      crit: "Sometimes deals double damage",
      block: "Absorbs the enemy's first attacks",
      thorns: "Spikes hit harder on a correct answer",
      hintFree: "Free hints without −10 HP",
      hint: "One hint in battle without losing health",
      goldBonus: "More gold for correct answers",
      poisonImmune: "Immune to poison",
      reveal: "All enemies on the floor are visible",
      execute: "Finishes wounded enemies harder",
      cleanse: "Cures poison",
      fullHeal: "Restores all health",
      antidote: "Cures poison"
    };
    Object.keys(effects).forEach(function (key) {
      if (EFFECT_NAMES[key]) EFFECT_NAMES[key] = effects[key];
    });
  }

  /* ------------------------------------------------------------------ */
  /* Подземелье: этажи, враги, боссы, ловушки и среда                   */
  /* ------------------------------------------------------------------ */

  var epilogues = [
    ["The stone here still remembers the sun: dry streaks on the walls look like letters.",
      "Slime fears fire. Glue Python together the same way — simply, without anything extra."],
    ["The chief sits on a pile of planks. Each bears a fragment of someone else's program, and they all argue with each other.",
      "Check brackets and indentation: they are lost most often in a hurry."],
    ["Someone left signatures next to the code on the wall. The handwriting is nervous, the letters stumble.",
      "There is plenty of list and string work here — look closely at indices."],
    ["The necromancer builds servants out of errors. The more misses, the tighter it gets in the crypt.",
      "Watch indices and list bounds: a mistake comes back as a ghost."],
    ["Frost on the walls draws branching schemes — if, elif, else. Branches leading nowhere.",
      "Conditions and loops: watch the colon and the indentation after it."],
    ["The golem king is assembled from blocks, like neatly written code. Every block stands in its place.",
      "Functions follow rules: def, colon, indent. Assemble them correctly."],
    ["Demons wrote a contract on the wall in small letters. No one read this contract before you.",
      "Some tasks here ask you to write functions. Take your time and check the solution."],
    ["The demon lord holds a contract in the fire. Its terms are written so they cannot be fulfilled.",
      "Break the function down step by step: arguments, body, return."],
    ["The lair smells of sulphur and old paper. The dragon sleeps on a mountain of printouts, and not one is scorched.",
      "Everything matters here: types, strings and sequences. Take your time."],
    ["The dragon breathes fire and knows arithmetic remarkably well. Do not underestimate the enemy.",
      "The dragon flies into a rage at 40% health. Keep potions ready."]
  ];
  if (typeof FLOOR_EPILOGUES_V1 !== "undefined") {
    FLOOR_EPILOGUES_V1.forEach(function (item, i) {
      if (!epilogues[i]) return;
      item.text = epilogues[i][0];
      item.hint = epilogues[i][1];
    });
  }

  var events = [
    "Somewhere ahead there is a knock — as if someone is counting lines of code.",
    "A draught carries the smell of iron and old paper.",
    "A quiet echo repeats your last question and answers it incorrectly.",
    "Below, something heavy tears away from the wall and falls into the dark.",
    "Water drips. Exactly beat after beat — as if someone is counting time.",
    "Torches light up on the walls — someone prepared this hall for a visitor.",
    "A seal is burned into the floor: a circle, and inside it a niche and nothing.",
    "Bones are stacked in a neat pyramid. It looks like someone's textbook.",
    "The air burns your throat. The dragon knows you are coming.",
    "A muffled roar rolls through the walls. The last battle lies ahead."
  ];
  function applyList(list, values) {
    if (!list) return;
    list.forEach(function (item, i) {
      if (values[i] != null) list[i] = values[i];
    });
  }
  if (typeof FLOOR_EVENTS_V1 !== "undefined") applyList(FLOOR_EVENTS_V1, events);
  if (typeof FLOOR_EVENTS_V2 !== "undefined") applyList(FLOOR_EVENTS_V2, events);

  var entranceTips = [
    "The first monsters are weak. Answer confidently — it builds experience.",
    "The goblin chief hits hard. Don't approach him with an empty potion slot.",
    "The catacombs are full of lists and strings: watch the indices.",
    "The necromancer raises servants on your mistakes. Don't give him a reason.",
    "The ice halls: on ice monsters get an extra step. Don't linger.",
    "The golem king withstands blows. Stock up on potions and take your time.",
    "Demons flare up from battle to battle, and lava burns every turn.",
    "The demon lord is the strongest thing below. Check your gear.",
    "The dragon's lair is dark: stick to the minimap and don't lose the stairs.",
    "The dragon flies into a rage at 40% health. Save the large potion."
  ];
  if (typeof FLOOR_ENTRANCE_TIPS_V1 !== "undefined") {
    applyList(FLOOR_ENTRANCE_TIPS_V1, entranceTips);
  }
  if (typeof FLOOR_ENTRANCE_TIPS_V2 !== "undefined") {
    applyList(FLOOR_ENTRANCE_TIPS_V2, entranceTips);
  }

  var quips = {
    shieldman: ["My shield is older than your task.", "You shall not pass: this post is mine."],
    priest: ["My squad's wounds are none of your business.", "Prove your strength first, then make a wish."],
    necromancer: ["An error is already a servant.", "Every mistake of yours I will raise to its feet."],
    slime: ["Squelch… squelch…", "The stone sticks to my hands…"],
    rat: ["Squeak! Squeak!", "Rustle… behind you!"],
    bat: ["Beep! Beep!", "I can hear your breathing."],
    skeleton: ["Don't… poke… the bones…", "A programmer… is required…"],
    goblin: ["That's my gold!", "Don't look, don't pick it up."],
    spider: ["Caught in my web?", "One step — and venom."],
    orc: ["Grrr! This is not your food!", "First prove you're a hero!"],
    troll: ["I grow when I'm angry!", "Hit me all you like — I only get stronger."],
    ghost: ["You have an error… and it's my dinner.", "I surface from your failed answers."],
    wolf: ["Wolf laughter in the dark.", "I'm not angry. I'm just hungry."],
    zombie: ["Boo… is this still code?", "My last print didn't work."],
    golem: ["Thick code protects better than a thick wall.", "I'm in no hurry. I have no timer."],
    demon: ["Fire doesn't ask permission.", "Every answer of yours lights a new fuse."],
    minotaur: ["HORNS! HOLD THE HORNS!", "I hit harder when you answer."],
    vampire: ["Your health smells interesting.", "Don't ask where I get the blood."],
    lich: ["Your function will never return a result… neither will I.", "I remember the first loop. It was infinite."],
    dragon: ["I HAVE WAITED LONG. WRITE CODE.", "One break in the code — and you're in a puddle."]
  };
  if (typeof ENEMY_QUIPS !== "undefined") {
    Object.keys(quips).forEach(function (key) {
      if (ENEMY_QUIPS[key]) ENEMY_QUIPS[key] = quips[key];
    });
  }

  var defeat = {
    shieldman: "The shield fell, and the post stood empty.",
    priest: "The priestess lowered her hands — no one left to heal.",
    necromancer: "The necromancer crumbled on his own, and his servants lay down with him.",
    slime: "The slime spread out, leaving a sticky puddle.",
    rat: "The rat darted under a stone and never came out again.",
    bat: "The bat flew into the dark, promising to return.",
    skeleton: "The skeleton scattered into separate bones. The program terminated successfully.",
    goblin: "The goblin dropped his sack of pancakes and went off to complain.",
    spider: "The spider curled into a ball of thread and stopped weaving.",
    orc: "The orc dropped his club and sat down to nurse his finger.",
    troll: "The troll settled into a puddle and became an ordinary bump.",
    ghost: "The ghost dispersed, leaving behind a feeling of a completed def.",
    wolf: "The wolf retreated into the dark without looking back.",
    zombie: "The zombie sat on the wall for a minute and hugged his knees.",
    golem: "The golem crumbled into sand. The sand was washed away by water.",
    demon: "The demon went out like a snuffed candle.",
    minotaur: "The minotaur sat on the floor and looked at his horns with respect.",
    vampire: "The vampire crumbled into grey dust.",
    lich: "The lich closed his eyes. No infinite retreat system.",
    dragon: "The dragon collapsed. Its last fuse went out."
  };
  if (typeof ENEMY_DEFEAT_QUIPS !== "undefined") {
    Object.keys(defeat).forEach(function (key) {
      if (ENEMY_DEFEAT_QUIPS[key]) ENEMY_DEFEAT_QUIPS[key] = defeat[key];
    });
  }

  var bosses = {
    goblin: {
      name: "Goblin Chief", title: "Master of the First Descent",
      intro: "The chief is already dividing your gear — and he really dislikes being counted.",
      rule: "Don't chase the chief through the spikes: there is a way around the barricade along the edge.",
      phases: ["Open Circle", "Barricade", "Collapse"],
      taunts: ["My gold! My questions!", "You came with empty pockets? Then I'll take your health.",
        "You can't hide behind a barricade from a correct answer."],
      phaseQuips: {
        2: "The chief whistles — his kin crawl out of the niches.",
        3: "The barricade falls, but the chief is already calling for help."
      },
      defeat: "The chief's banner falls, and the caves fall silent for the first time.",
      trophyName: "Chief's Banner",
      trophyText: "First trophy: the village learns that the descent no longer belongs to goblins."
    },
    necromancer: {
      name: "Necromancer", title: "Collector of Errors",
      intro: "He remembers every mistake of yours — and has already raised them to their feet.",
      rule: "In the dark, rely on the torches and the minimap, not your memory.",
      phases: ["Bright Hall", "Darkness", "Altar"],
      taunts: ["An error is already a servant.", "Every mistake of yours I will raise to its feet.",
        "The light will go out before your confidence does."],
      phaseQuips: {
        2: "The light dies. Only the torches glow in the niches.",
        3: "The necromancer goes to the altar and raises the dead."
      },
      defeat: "The necromancer crumbled on his own, and his servants lay down with him.",
      trophyName: "Necromancer's Seal",
      trophyText: "A trophy from the catacombs: a sign that mistakes can be taken apart."
    },
    golem: {
      name: "Golem King", title: "Stone Guardian of the Deep",
      intro: "The hall trembles: the golem king rises from his throne.",
      rule: "Stay on solid floor: ice costs you turns of sliding.",
      phases: ["Solid Center", "Cracks", "Columns"],
      taunts: ["Thick code protects better than a thick wall.", "I'm in no hurry. I have no timer."],
      phaseQuips: {
        2: "Ice creeps from the walls, two columns collapse.",
        3: "The king pulls the cracks shut with stone — and advances again."
      },
      defeat: "The king crumbled into sand. The sand was washed away by water.",
      trophyName: "Golem's Heart",
      trophyText: "A stone heart that is still colder than ice."
    },
    demon: {
      name: "Demon Lord", title: "Master of the Rift",
      intro: "The bridges over the lava tremble under his steps.",
      rule: "Pick your bridge in advance and don't get greedy for the last chest.",
      phases: ["Two Bridges", "One Bridge", "Rift"],
      taunts: ["Fire doesn't ask permission.", "Every answer of yours lights a new fuse."],
      phaseQuips: {
        2: "One bridge collapses: a narrow passage remains between the fires.",
        3: "The rift widens, the lord retreats to the far island."
      },
      defeat: "The demon went out like a snuffed candle.",
      trophyName: "Lord's Horn",
      trophyText: "A horn that still echoes with the crackle of lava."
    },
    dragon: {
      name: "Dragon", title: "The Last Guardian",
      intro: "The dragon was waiting not for a sword, but for an answer.",
      rule: "Every pile of gold you take strengthens the dragon in the third phase.",
      phases: ["Dark Hall", "Treasury", "Final Darkness"],
      taunts: ["I HAVE WAITED LONG. WRITE CODE.", "One break in the code — and you're in a puddle."],
      phaseQuips: {
        2: "The dragon goes to the treasury; the darkness thickens.",
        3: "Two columns collapse, the darkness closes to three steps."
      },
      defeat: "The dragon collapsed. Its last fuse went out.",
      trophyName: "Dragon's Heart",
      trophyText: "The last trophy: there is no one left to guard the door behind the dragon."
    }
  };
  if (typeof BOSS_INFO !== "undefined") {
    Object.keys(bosses).forEach(function (key) {
      var info = BOSS_INFO[key];
      var en = bosses[key];
      if (!info) return;
      info.name = en.name;
      info.title = en.title;
      info.intro = en.intro;
      info.rule = en.rule;
      info.phases = en.phases;
      info.taunts = en.taunts;
      info.phaseQuips = en.phaseQuips;
      info.defeat = en.defeat;
      if (info.trophy) {
        info.trophy.name = en.trophyName;
        info.trophy.text = en.trophyText;
      }
    });
  }

  var eliteText = {
    poison: "Poison lasts longer and bites harder",
    phasing: "The ghost phases through walls more often: 40% of turns instead of 25%",
    armor: "Stone armor absorbs 30% of damage",
    fire: "Every battle makes the demon burn hotter",
    charge: "Every correct answer enrages the minotaur more than usual",
    drain: "The vampire returns 70% of the damage dealt, not half",
    curse: "The curse lands more often: in 60% of battles instead of 35%",
    bossrage: "In a rage the boss heals more: 12% health per blow instead of 8%",
    heal: "The priestess heals the floor for 45% health instead of 30%",
    summon: "The necromancer raises up to three servants instead of two",
    bulwark: "The shield absorbs 45% of damage instead of 35%",
    regen: "The troll regrows 14% health per blow instead of 8%"
  };
  if (typeof ELITE_ABILITY_TEXT !== "undefined") {
    Object.keys(eliteText).forEach(function (key) {
      if (ELITE_ABILITY_TEXT[key]) ELITE_ABILITY_TEXT[key] = eliteText[key];
    });
  }

  var eliteTitles = {
    slime: "Miring", rat: "Restless", bat: "Blind", skeleton: "Bone Warden",
    goblin: "Greedy", spider: "Spitting", orc: "Brown", troll: "Petrified",
    ghost: "Disembodied", wolf: "Hungry", zombie: "Swamp", golem: "Stone Warden",
    demon: "Flaming", minotaur: "Fierce", vampire: "Bloody", lich: "Eternal",
    dragon: "Ancient", shieldman: "Forged", priest: "Radiant", necromancer: "Dark"
  };
  if (typeof ELITE_TITLES !== "undefined") {
    Object.keys(eliteTitles).forEach(function (key) {
      if (ELITE_TITLES[key]) ELITE_TITLES[key] = eliteTitles[key];
    });
  }

  var traps = {
    spikes: ["Floor Spikes", "Spikes grow out of the floor!",
      "Spikes deal damage every time you step on a tile."],
    pit: ["Pit", "The tile gives way — you fall into a pit!",
      "The pit takes more health, but your gold is safe."],
    mushroom_spore: ["Mushroom Spores", "A cloud of spores! Your eyes double.",
      "Spores are weak but common."],
    crystal_shard: ["Crystal Shards", "The crystal shatters into sharp shards!",
      "Shards hurt more than they look."],
    chain_snare: ["Chain Snare", "A chain whips around your legs — you cannot move!",
      "The trap doesn't wound you, but a beast comes closer: the chain holds until the battle ends."],
    curse_tile: ["Cursed Tile", "The tile under your feet flashes red.",
      "The next question will be harder — ordinary damage won't help."]
  };
  if (typeof TRAP_TYPES !== "undefined") {
    TRAP_TYPES.forEach(function (trap) {
      var en = traps[trap.key];
      if (!en) return;
      trap.name = en[0];
      trap.text = en[1];
      trap.hint = en[2];
    });
  }

  var hazards = {
    frost: ["Ice Crust", "The floor is covered with ice. You slide — and monsters gain ground.",
      "On an ice tile enemies get an extra step until you leave it."],
    dark: ["Thick Darkness", "Torches cannot pierce this dark: you see barely two steps.",
      "In the dark your sight is halved — rely on the minimap (M)."],
    lava: ["Lava Rifts", "Lava seeps from cracks in the floor. Standing on it burns.",
      "Lava takes health every turn you stand on it."]
  };
  if (typeof HAZARD_TYPES !== "undefined") {
    Object.keys(hazards).forEach(function (key) {
      var h = HAZARD_TYPES[key];
      if (!h) return;
      h.name = hazards[key][0];
      h.text = hazards[key][1];
      h.hint = hazards[key][2];
    });
  }

  var blessings = {
    curse: ["Dark Bargain", "All monsters on the floor hit 35% harder.",
      "Instantly +60 gold, and gold from monsters is doubled."],
    blessing: ["Stone Gift", "+40 max health for this floor and a full heal.",
      "Monsters on the floor restore 10% of the damage you deal."],
    pass: ["Walk Past", "Change nothing.",
      "The floor stays ordinary: no gift and no bargain."]
  };
  if (typeof BLESSINGS !== "undefined") {
    Object.keys(blessings).forEach(function (key) {
      var b = BLESSINGS[key];
      if (!b) return;
      b.name = blessings[key][0];
      b.good = blessings[key][1];
      b.extra = blessings[key][2];
    });
  }

  var signTips = [
    "The slice s[1:3] takes characters from the first through the second: the right edge is not included.",
    "len(x) is the length of a string or list, not the number of items in a dictionary.",
    "A list changes, a tuple doesn't: t[0] = 5 will fail with an error.",
    "print(2 ** 3) prints 8: two asterisks mean exponentiation.",
    "Input is always a string: int(input()) is needed before counting.",
    "range(5) gives 0, 1, 2, 3, 4 — there is no five in it.",
    "An indent of four spaces is not decoration but the body of the loop.",
    "Adding strings glues them: \"2\" + \"3\" gives \"23\", not 5.",
    "A dictionary is looked up by key: d[\"name\"], not d[0].",
    "In a loop it is better to iterate a list directly: for x in items, without indices.",
    "A ZeroDivisionError means division by zero — check the divisor.",
    "A function returns None if it has no return."
  ];
  if (typeof SIGN_TIPS !== "undefined") applyList(SIGN_TIPS, signTips);

  /* ------------------------------------------------------------------ */
  /* Деревня                                                             */
  /* ------------------------------------------------------------------ */

  var signs = {
    "Указатель": ["Signpost", "Village",
      "Bank ↑ · Elder ↖ · Trader ↙ · School ↓ · Dungeon ←"],
    "Деревня": [null, "Village", null],
    "Строится": ["Under construction", null, null],
    "Открыто": ["Open", null, null]
  };
  var signBodies = [
    ["Barn", "The barn is boarded up: planks and the key from the stair warden are needed.",
      "Barn", "The barn is open again: materials are in the storehouse."],
    ["Forge", "The forge waits for ore and wood — then hammers will ring there again.",
      "Forge", "The forge works: the fire is lit."],
    ["Master's house", "The master's house is empty: first raise the forge and find the master's seal.",
      "Master's house", "The master is back at his workbench."]
  ];
  if (typeof VILLAGE_SIGNS !== "undefined") {
    VILLAGE_SIGNS.forEach(function (sign, i) {
      if (sign.title && signs[sign.title]) sign.title = signs[sign.title][0];
      if (sign.subtitle && signs[sign.subtitle]) sign.subtitle = signs[sign.subtitle][1] || sign.subtitle;
      if (sign.text && signs[sign.text]) sign.text = signs[sign.text][2] || sign.text;
      if (i > 0 && signBodies[i - 1]) {
        var body = signBodies[i - 1];
        sign.subtitle = body[0];
        sign.text = body[1];
        sign.builtSubtitle = body[2];
        sign.builtText = body[3];
        if (sign.builtTitle && signs[sign.builtTitle]) {
          sign.builtTitle = signs[sign.builtTitle][0];
        }
      }
    });
  }

  var houses = {
    "Дом старосты": "Elder's house",
    "Банк": "Bank",
    "Дом торговца": "Trader's house",
    "Школа": "School",
    "Амбар": "Barn",
    "Кузница": "Forge",
    "Дом мастера": "Master's house"
  };
  if (typeof VILLAGE_HOUSES !== "undefined") {
    Object.keys(VILLAGE_HOUSES).forEach(function (key) {
      var house = VILLAGE_HOUSES[key];
      if (house && houses[house.name]) house.name = houses[house.name];
    });
  }
  if (typeof VILLAGE_SEALED !== "undefined") {
    VILLAGE_SEALED.forEach(function (building) {
      if (building && houses[building.name]) building.name = houses[building.name];
    });
  }

  var npcs = {
    guard: "Gate warden", trader: "Trader", elder: "Elder", mentor: "Mentor",
    banker: "Treasurer", blacksmith: "Blacksmith", master: "Master",
    storekeeper: "Storekeeper", teacher: "Teacher"
  };
  if (typeof VILLAGE_NPCS !== "undefined") {
    VILLAGE_NPCS.forEach(function (npc) {
      if (npcs[npc.key]) npc.name = npcs[npc.key];
    });
  }

  var greetings = {
    guard: [
      "Halt, hero. I am the gate warden — the dungeon begins beyond me.",
      "The descent is open, but first walk the village. Here you must be known by sight."
    ],
    elder: [
      "Ah, a new hero. I am the elder. The village stands on four pillars, and one already needs repair.",
      "Meet the villagers, then come back: I'll give you your first task."
    ],
    trader: [
      "Come in, hero! I'm the trader. Potions, return amulets and gear — everything you need before a descent.",
      "Don't go into the dungeon without a potion. Stop by before every expedition."
    ],
    banker: [
      "I am the treasurer. Your gold, materials and expedition record are kept here.",
      "The bank doesn't spend itself: before a descent you can take some gold and potions with you."
    ],
    mentor: [
      "I am the mentor. I teach you to read errors and not give up after the first failure.",
      "Making mistakes is not scary. Not understanding where you went wrong is."
    ],
    teacher: [
      "Hello! I am the teacher. The school runs a Python course — nine modules, practice and exams.",
      "You'll start with syntax, then reach functions and modules. The door is always open."
    ],
    blacksmith: [
      "I am the blacksmith. The forge burns again — your ore and wood went to good use.",
      "For gold I'll raise the hero's stats, and they'll stay for every expedition."
    ],
    master: [
      "I am the master. The workbench is in business again — the key and the fragments brought the house back to life.",
      "The blacksmith raises upgrades to the third level, and my house — to the fifth, with a discount."
    ],
    storekeeper: [
      "I am the storekeeper. The barn is raised, and supplies finally have a place to rest.",
      "I trade ore, wood and fragments for potions and gear — no more than a couple of times per expedition."
    ]
  };
  if (typeof NPC_GREETINGS !== "undefined") {
    Object.keys(greetings).forEach(function (key) {
      if (NPC_GREETINGS[key]) NPC_GREETINGS[key] = greetings[key];
    });
  }

  /* --- школа: курс Python --- */
  // Уроки читаются teacher-панелью напрямую из PY_COURSE, поэтому
  // переводим поля на месте. Примеры кода тоже английские: строки внутри
  // print() — это текст для игрока, а не проверяемый ответ.
  var course = [
    {
      title: "Syntax Basics",
      note: "First commands, variables and indentation.",
      cheat: [
        "print() prints a value, input() reads a line.",
        "One = is assignment, two == are comparison.",
        "The body of a condition or loop is indented by 4 spaces."
      ],
      lessons: [
        {
          title: "Your First Program",
          goal: "Learn to print text and numbers.",
          theory: [
            "A Python program is a sequence of commands. The very first command is <code>print()</code>: it prints a value to the screen.",
            "A string is wrapped in quotes: <code>\"Hello\"</code> or <code>'Hello'</code>. Numbers are written without quotes: <code>print(2 + 3)</code>.",
            "A comment starts with <code>#</code>. Python does not execute anything after it — it is a note for a human."
          ],
          example: "print(\"Hello, dungeon!\")\nprint(2 + 3)\n# this is a comment"
        },
        {
          title: "Variables",
          goal: "Store values and give them clear names.",
          theory: [
            "A variable is a name for a value. Assignment uses a single <code>=</code>: <code>hp = 100</code>.",
            "A name starts with a letter or <code>_</code>, may contain digits and must not match keywords like <code>if</code> or <code>for</code>.",
            "One <code>=</code> is assignment, two <code>==</code> are comparison. These are different operations."
          ],
          example: "hp = 100\ndamage = 15\nprint(hp - damage)"
        },
        {
          title: "Input, Numbers and Indentation",
          goal: "Read input and assemble simple code blocks.",
          theory: [
            "<code>input()</code> returns a string. To get a number, convert the string: <code>int(input())</code> or <code>float(input())</code>.",
            "A code block in Python is defined by indentation. After <code>if</code>, <code>for</code> and <code>def</code> a colon is placed, and the body is shifted by four spaces.",
            "The same indentation is mandatory: it is how Python knows which lines belong to a block."
          ],
          example: "age = int(input(\"Age: \"))\nif age >= 18:\n    print(\"You may enter the dungeon\")\nelse:\n    print(\"Grow up first\")"
        }
      ]
    },
    {
      title: "Data Types",
      note: "Numbers, strings, logic and None.",
      cheat: [
        "int is a whole number, float has a dot, str is a string, bool is True/False.",
        "int() drops the fractional part, round() rounds.",
        "len() returns the length of a string or list."
      ],
      lessons: [
        {
          title: "Numbers",
          goal: "Tell int and float apart and convert between them.",
          theory: [
            "<code>int</code> is a whole number, <code>float</code> is a number with a dot. <code>3</code> and <code>3.0</code> look similar, but they are different types.",
            "<code>int(3.9)</code> drops the fractional part, while <code>round(3.9)</code> rounds. <code>float(3)</code> turns a whole number into a decimal.",
            "Division <code>/</code> always gives a <code>float</code>, even when it divides evenly."
          ],
          example: "print(7 / 2)\nprint(7 // 2)\nprint(int(3.9), round(3.9))"
        },
        {
          title: "Strings",
          goal: "Build text from parts and count its length.",
          theory: [
            "<code>str</code> is a string, a sequence of characters in quotes. Strings can be added: <code>\"hp: \" + str(10)</code>.",
            "<code>len(s)</code> returns the number of characters. The empty string <code>\"\"</code> has length 0.",
            "A string with a number cannot simply be added to a number: first convert one to the other's type."
          ],
          example: "name = \"Hero\"\nhp = 100\nprint(name + \": \" + str(hp) + \" HP\")\nprint(len(name))"
        },
        {
          title: "bool and None",
          goal: "Understand truth, falsehood and the absence of a value.",
          theory: [
            "<code>bool</code> takes two values: <code>True</code> and <code>False</code>. They are written with a capital letter.",
            "Empty values are often considered false: <code>0</code>, <code>\"\"</code>, <code>[]</code>, <code>None</code>. Non-empty ones are true.",
            "<code>None</code> means “there is no value”. It is not zero and not an empty string, but a separate type."
          ],
          example: "alive = True\npoison = 0\nprint(bool(poison))\nprint(bool(\"\"))\nprint(None is None)"
        }
      ]
    },
    {
      title: "Operators and Expressions",
      note: "Arithmetic, comparisons and logic.",
      cheat: [
        "// is the whole part, % is the remainder, ** is the power.",
        "Parentheses change the order: (2 + 3) * 4.",
        "not runs before and, and runs before or."
      ],
      lessons: [
        {
          title: "Arithmetic",
          goal: "Calculate damage, gold and percentages.",
          theory: [
            "The basic operators are <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>. Remainder division is <code>%</code>, the whole part is <code>//</code>, the power is <code>**</code>.",
            "Multiplication and division run before addition. Parentheses change the order: <code>(2 + 3) * 4</code>.",
            "<code>%</code> is often used to check evenness: <code>n % 2 == 0</code>."
          ],
          example: "gold = 100\nprice = 30\nprint(gold - price)\nprint(7 // 2, 7 % 2, 2 ** 3)"
        },
        {
          title: "Comparisons",
          goal: "Check conditions without confusing = and ==.",
          theory: [
            "Comparisons return <code>True</code> or <code>False</code>: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>.",
            "Comparisons can be chained: <code>0 &lt; hp &lt;= 100</code> means “hp is greater than zero and no more than one hundred”.",
            "Strings are compared character by character, so <code>\"2\" &gt; \"10\"</code> compares text, not numbers."
          ],
          example: "hp = 40\nprint(hp > 0)\nprint(0 < hp <= 100)\nprint(\"2\" > \"10\")"
        },
        {
          title: "Logical Operators",
          goal: "Build complex conditions from simple ones.",
          theory: [
            "<code>and</code> is true when both conditions are true. <code>or</code> is true when at least one is true. <code>not</code> flips the value.",
            "<code>not</code> runs before <code>and</code>, and <code>and</code> runs before <code>or</code>. Parentheses make the order explicit.",
            "Python evaluates logic lazily: in <code>a and b</code> the right side is not evaluated when <code>a</code> is false."
          ],
          example: "hp = 30\npoison = 0\nprint(hp > 0 and poison == 0)\nprint(hp > 50 or poison > 0)\nprint(not poison)"
        }
      ]
    },
    {
      title: "Strings",
      note: "Text, slices and formatting.",
      cheat: [
        "s[0] is the first character, s[-1] is the last.",
        "The slice s[1:4] takes characters 1 through 3, not including 4.",
        "upper/lower/strip/split/join/replace change or split a string."
      ],
      lessons: [
        {
          title: "Indexes and Slices",
          goal: "Extract characters and substrings.",
          theory: [
            "Characters in a string are numbered from zero. <code>s[0]</code> is the first, <code>s[-1]</code> is the last.",
            "The slice <code>s[start:end]</code> takes characters from <code>start</code> up to but not including <code>end</code>.",
            "The step is set by a third number: <code>s[::-1]</code> reverses the string."
          ],
          example: "word = \"dungeon\"\nprint(word[0], word[-1])\nprint(word[2:6])\nprint(word[::-1])"
        },
        {
          title: "String Methods",
          goal: "Clean and split text.",
          theory: [
            "<code>upper()</code> and <code>lower()</code> change the case, <code>strip()</code> removes spaces at the edges.",
            "<code>split()</code> splits a string into a list, <code>join()</code> joins a list back into a string.",
            "<code>replace()</code> replaces one substring with another without changing the original string: strings are immutable."
          ],
          example: "line = \"  sword, shield, potion  \"\nprint(line.strip().split(\", \"))\nprint(\"-\".join([\"a\", \"b\"]))\nprint(line.replace(\"potion\", \"key\"))"
        },
        {
          title: "f-strings",
          goal: "Build readable text with numbers.",
          theory: [
            "An f-string starts with <code>f</code>: <code>f\"HP: {hp}\"</code>. Expressions can be written inside braces.",
            "Format specifications work inside the braces: <code>{value:.2f}</code> — two digits after the dot, <code>{n:&gt;5}</code> — alignment.",
            "f-strings read better than concatenation with <code>+</code> and <code>str()</code>."
          ],
          example: "name = \"Hero\"\nhp = 87.5\nprint(f\"{name}: {hp:.1f} HP\")\nprint(f\"{hp / 100:.0%} health\")"
        }
      ]
    },
    {
      title: "Conditions and Loops",
      note: "Branches, for and while.",
      cheat: [
        "After if/elif/else a colon and indentation are required.",
        "for iterates over elements, range(n) gives 0…n-1.",
        "In while the condition must change, or the loop runs forever."
      ],
      lessons: [
        {
          title: "if, elif, else",
          goal: "Choose one action out of several.",
          theory: [
            "<code>if</code> runs a block when the condition is true. <code>elif</code> checks the next condition, <code>else</code> runs when nothing else matched.",
            "Checks run top to bottom, so important special cases go before general ones.",
            "The body of each block is marked by indentation. The colon after the condition is mandatory."
          ],
          example: "hp = 25\nif hp <= 0:\n    print(\"Defeat\")\nelif hp < 30:\n    print(\"Danger\")\nelse:\n    print(\"You may go\")"
        },
        {
          title: "The for Loop",
          goal: "Repeat an action for each element.",
          theory: [
            "<code>for x in items:</code> iterates over elements. <code>range(n)</code> gives numbers from 0 to <code>n-1</code>.",
            "<code>break</code> ends the loop early, <code>continue</code> skips the current step and moves to the next.",
            "For a counter, <code>for i in range(1, 6)</code> is convenient: the numbers 1–5."
          ],
          example: "total = 0\nfor coin in [1, 2, 5]:\n    total += coin\nprint(total)\nfor i in range(3):\n    print(i)"
        },
        {
          title: "The while Loop",
          goal: "Repeat an action while the condition is true.",
          theory: [
            "<code>while condition:</code> repeats while the condition is true. Inside, the condition variable must change, or the loop becomes infinite.",
            "A counter is a typical example: <code>while hp &gt; 0: hp -= damage</code>.",
            "If the loop must run at least once, the condition is checked after the body, but in Python it is more common to write <code>while True</code> and <code>break</code>."
          ],
          example: "hp = 20\ndamage = 7\nwhile hp > 0:\n    hp -= damage\n    print(\"HP:\", hp)"
        }
      ]
    },
    {
      title: "Lists, Dictionaries, Sets",
      note: "Store not one value, but many.",
      cheat: [
        "A list keeps order and allows duplicates; append adds to the end.",
        "A dictionary stores key: value pairs; get does not fail without a key.",
        "A set stores only unique elements, a tuple is immutable."
      ],
      lessons: [
        {
          title: "Lists",
          goal: "Store an ordered collection of values.",
          theory: [
            "A list is <code>[1, 2, 3]</code>. It keeps order and allows duplicates.",
            "<code>append()</code> adds an element to the end, <code>len()</code> returns the length, indexes and slices work like on strings.",
            "A list is mutable: <code>items[0] = \"sword\"</code> replaces an element."
          ],
          example: "bag = [\"sword\", \"potion\"]\nbag.append(\"shield\")\nprint(bag, len(bag))\nprint(bag[0], bag[-1])"
        },
        {
          title: "Dictionaries",
          goal: "Link keys to values.",
          theory: [
            "A dictionary stores <code>key: value</code> pairs: <code>{\"hp\": 100, \"gold\": 20}</code>.",
            "Access is by key: <code>hero[\"hp\"]</code>. <code>get()</code> does not fail when the key is missing and can return a default value.",
            "<code>keys()</code>, <code>values()</code> and <code>items()</code> give keys, values and pairs."
          ],
          example: "hero = {\"hp\": 100, \"gold\": 20}\nprint(hero[\"hp\"])\nprint(hero.get(\"mana\", 0))\nfor key, value in hero.items():\n    print(key, value)"
        },
        {
          title: "Sets and Tuples",
          goal: "Choose the container that fits the task.",
          theory: [
            "<code>set</code> stores only unique elements and does not guarantee order. It is good for checking “is it already here”.",
            "<code>tuple</code> is like a list but immutable: <code>(x, y)</code>. It is handy for coordinates.",
            "A list is order and change, a set is uniqueness, a dictionary is links, a tuple is an immutable record."
          ],
          example: "seen = set()\nseen.add(\"orc\")\nseen.add(\"orc\")\nprint(seen, len(seen))\npoint = (3, 5)\nprint(point[0], point[1])"
        }
      ]
    },
    {
      title: "Functions",
      note: "Break a program into clear steps.",
      cheat: [
        "def name(args): declares a function, return returns the result.",
        "Arguments can be positional, named and have default values.",
        "Local variables are not visible outside; return a result instead of changing a global."
      ],
      lessons: [
        {
          title: "def and return",
          goal: "Declare a function and return its result.",
          theory: [
            "A function is declared with <code>def name(args):</code>. The body is indented.",
            "<code>return</code> returns a value and ends the function. Without <code>return</code> the function returns <code>None</code>.",
            "A function is called by name: <code>damage(10, 3)</code>."
          ],
          example: "def damage(atk, defense):\n    return max(1, atk - defense)\n\nprint(damage(15, 4))"
        },
        {
          title: "Arguments",
          goal: "Pass data into a function conveniently.",
          theory: [
            "Positional arguments are passed in order, named ones by name: <code>damage(atk=15, defense=4)</code>.",
            "A default value is set in the declaration: <code>def heal(amount=10):</code>.",
            "Do not use mutable default values such as <code>[]</code>: they are kept between calls."
          ],
          example: "def heal(amount=10):\n    return amount * 2\n\nprint(heal())\nprint(heal(25))"
        },
        {
          title: "Scope",
          goal: "Understand where variables live.",
          theory: [
            "Variables inside a function are local: they are not visible outside. Parameters are local too.",
            "A global variable can be read, but changing it through <code>global</code> should only be done when necessary.",
            "It is better to return a result than to change global state: that makes a function easier to test and reuse."
          ],
          example: "hp = 100\ndef show_hp():\n    print(hp)\n\ndef hurt(amount):\n    return hp - amount\n\nshow_hp()\nprint(hurt(30))"
        }
      ]
    },
    {
      title: "Exceptions",
      note: "Read errors and handle them.",
      cheat: [
        "SyntaxError — the code did not parse; NameError — the name is not defined.",
        "TypeError — the wrong type; ValueError — the wrong value.",
        "try/except catches a specific error, finally always runs."
      ],
      lessons: [
        {
          title: "What Kinds of Errors Exist",
          goal: "Tell a syntax error from a runtime error.",
          theory: [
            "<code>SyntaxError</code> — the code did not parse: a colon, quote or bracket is missing.",
            "<code>NameError</code> — the name is not defined. <code>TypeError</code> — the operation does not fit the type. <code>ValueError</code> — the type is right, the value is not.",
            "At the bottom of the traceback the error name and message are written: that is where debugging starts."
          ],
          example: "age = int(\"twenty\")\n# ValueError: invalid literal for int()\n# print(mana)\n# NameError: name 'mana' is not defined"
        },
        {
          title: "try and except",
          goal: "Keep an error from crashing the program.",
          theory: [
            "Code in <code>try</code> runs under protection. If the specified error occurs, control passes to <code>except</code>.",
            "<code>else</code> runs if there was no error, <code>finally</code> always runs.",
            "Catch specific exceptions, not everything: otherwise real errors hide."
          ],
          example: "try:\n    gold = int(input(\"Gold: \"))\nexcept ValueError:\n    gold = 0\n    print(\"That is not a number\")\nprint(\"Gold:\", gold)"
        },
        {
          title: "Your Own Errors",
          goal: "Report invalid data clearly.",
          theory: [
            "<code>raise ValueError(\"message\")</code> explicitly raises an error.",
            "A custom error is appropriate when data violates a rule: negative health, an empty name, an unknown item.",
            "The message should explain what exactly is wrong, not just “error”."
          ],
          example: "def set_hp(value):\n    if value < 0:\n        raise ValueError(\"HP cannot be negative\")\n    return value\n\ntry:\n    set_hp(-5)\nexcept ValueError as err:\n    print(err)"
        }
      ]
    },
    {
      title: "Modules and Imports",
      note: "Use code written by others and your own.",
      cheat: [
        "import math loads the whole module, from math import sqrt — one function.",
        "math, random and datetime are part of the standard library.",
        "Your own module is a .py file; separate run code with if __name__ == \"__main__\"."
      ],
      lessons: [
        {
          title: "import",
          goal: "Plug in someone else's functions.",
          theory: [
            "<code>import math</code> loads the whole module: functions are called as <code>math.sqrt(9)</code>.",
            "<code>from math import sqrt</code> imports only the function you need: <code>sqrt(9)</code>.",
            "An alias <code>import random as rnd</code> shortens a long name."
          ],
          example: "import math\nfrom random import randint\n\nprint(math.sqrt(16))\nprint(randint(1, 6))"
        },
        {
          title: "The Standard Library",
          goal: "Know where to look for ready-made tools.",
          theory: [
            "<code>math</code> — roots, rounding, constants. <code>random</code> — random numbers and choices.",
            "<code>datetime</code> — dates and time. <code>collections</code> — convenient containers such as <code>Counter</code>.",
            "The standard library is already installed with Python: it does not need to be downloaded."
          ],
          example: "from random import choice\nfrom datetime import date\n\nprint(choice([\"sword\", \"shield\", \"potion\"]))\nprint(date.today())"
        },
        {
          title: "Your Own Modules",
          goal: "Move code into a separate file.",
          theory: [
            "A file <code>hero.py</code> with functions can be imported: <code>import hero</code>, then <code>hero.damage(10, 3)</code>.",
            "The file name without <code>.py</code> becomes the module name. The file must be next to the program or on the import path.",
            "<code>if __name__ == \"__main__\":</code> separates running a file from importing it: the code inside runs only on direct launch."
          ],
          example: "# hero.py\ndef damage(atk, defense):\n    return max(1, atk - defense)\n\n# main.py\nimport hero\nprint(hero.damage(15, 4))"
        }
      ]
    }
  ];
  if (typeof PY_COURSE !== "undefined" && PY_COURSE.length === course.length) {
    PY_COURSE.forEach(function (module, mi) {
      var en = course[mi];
      module.title = en.title;
      module.note = en.note;
      module.cheat = en.cheat;
      if (module.lessons && module.lessons.length === en.lessons.length) {
        module.lessons.forEach(function (lesson, li) {
          var lessonEn = en.lessons[li];
          lesson.title = lessonEn.title;
          lesson.goal = lessonEn.goal;
          lesson.theory = lessonEn.theory;
          if (lessonEn.example) lesson.example = lessonEn.example;
        });
      }
    });
  }

  /* --- школа: домашние задания --- */
  var courseQuests = {
    syntax: "Defeat 3 monsters",
    types: "Answer 5 questions correctly",
    operators: "Gather 5 ore",
    strings: "Answer 10 questions correctly",
    control: "Defeat 6 monsters",
    collections: "Gather 10 materials",
    functions: "Answer 15 questions correctly",
    errors: "Defeat 8 monsters",
    modules: "Defeat the dragon"
  };
  if (typeof PY_COURSE_QUESTS !== "undefined") {
    Object.keys(courseQuests).forEach(function (key) {
      if (PY_COURSE_QUESTS[key]) PY_COURSE_QUESTS[key].text = courseQuests[key];
    });
  }

  /* --- школа: банк практических заданий --- */
  // Задания статического банка показываются на доске и в уроках. Код
  // переводится вместе с заданием: строки внутри print() — часть условия,
  // а проверки «напиши функцию» сверяют результат с ожидаемым.
  var taskBanks = {
    code: {
      attack_power: {
        title: "Strike Power",
        task: "Write a function attack_power(base, bonus) that returns the total strike power.",
        explanation: "The function must return the sum of its two arguments: return base + bonus."
      },
      health_after_hit: {
        title: "Health After a Hit",
        task: "Write a function health_after_hit(hp, damage) that returns the hero's health after taking damage.",
        explanation: "Return the difference between health and damage: return hp - damage."
      },
      is_alive: {
        title: "Is the Hero Alive",
        task: "Write a function is_alive(hp) that returns True if health is greater than zero, otherwise False.",
        explanation: "The function returns the result of a comparison: return hp > 0."
      },
      heal: {
        title: "Healing Potion",
        task: "Write a function heal(hp, amount) that returns health after a healing potion.",
        explanation: "Add the current health and the healing amount: return hp + amount."
      },
      double_gold: {
        title: "Double Gold",
        task: "Write a function double_gold(gold) that returns the amount of gold multiplied by two.",
        explanation: "Multiply the value by two: return gold * 2."
      },
      total_hp: {
        title: "Hero Party",
        task: "Write a function total_hp(heroes_hp) that returns the total health of all heroes in the list.",
        explanation: "Add up all elements of the list: return sum(heroes_hp) or a loop with accumulation will do."
      },
      max_damage: {
        title: "Strongest Strike",
        task: "Write a function max_damage(damages) that returns the largest damage in the list.",
        explanation: "The largest element is found with max(damages)."
      },
      count_monsters: {
        title: "Monster Census",
        task: "Write a function count_monsters(monsters) that returns the number of monsters in the list.",
        explanation: "The number of elements is the length of the list: return len(monsters).",
        tests: [
          { call: "count_monsters([\"orc\", \"slime\", \"spider\"])", expected: "3" },
          { call: "count_monsters([])", expected: "0" },
          { call: "count_monsters([\"dragon\"])", expected: "1" }
        ]
      },
      greet: {
        title: "Hero Greeting",
        task: "Write a function greet(name) that returns a string like “Hello, Hero!”.",
        explanation: "Join the greeting, the name and an exclamation mark: return \"Hello, \" + name + \"!\".",
        tests: [
          { call: "greet(\"Hero\")", expected: "\"Hello, Hero!\"" },
          { call: "greet(\"Orc\")", expected: "\"Hello, Orc!\"" }
        ]
      },
      count_even: {
        title: "Even Damage",
        task: "Write a function count_even(nums) that counts how many even numbers are in the list.",
        explanation: "An even number divides by 2 without a remainder: x % 2 == 0."
      },
      average: {
        title: "Average Health",
        task: "Write a function average(nums) that returns the arithmetic mean of the numbers in the list.",
        explanation: "The mean is the sum divided by the count: sum(nums) / len(nums)."
      },
      player_name: {
        title: "Hero Name",
        task: "Write a function player_name(name) that returns the string “Hero: ” + name.",
        explanation: "Strings are joined with +: return \"Hero: \" + name.",
        tests: [
          { call: "player_name(\"Ada\")", expected: "\"Hero: Ada\"" },
          { call: "player_name(\"\")", expected: "\"Hero: \"" }
        ]
      },
      double: {
        title: "Doubled Damage",
        task: "Write a function double(n) that returns n * 2.",
        explanation: "Multiply by 2: return n * 2."
      },
      safe_int: {
        title: "Safe Number",
        task: "Write a function safe_int(text) that returns int(text), and 0 on ValueError.",
        explanation: "Catch only ValueError: try: return int(text), except ValueError: return 0.",
        tests: [
          { call: "safe_int(\"10\")", expected: "10" },
          { call: "safe_int(\"two\")", expected: "0" }
        ]
      },
      circle_area: {
        title: "Circle Area",
        task: "Write a function circle_area(r) that returns the area of a circle rounded to 2 decimal places.",
        explanation: "The area of a circle is math.pi * r * r; rounding is round(value, 2)."
      }
    },
    copy: {
      copy_hello: {
        title: "Greeting",
        task: "Retype the code exactly as written.",
        explanation: "print() outputs the text inside the quotes.",
        code: "print(\"Hello, dungeon!\")"
      },
      copy_hp: {
        title: "Creating a Hero",
        task: "Retype the code exactly as written.",
        explanation: "First the variable hp is created with the value 100, then print(hp) outputs it."
      },
      copy_damage: {
        title: "Taking Damage",
        task: "Retype the code exactly as written.",
        explanation: "The line hp = hp - damage reduces health: the new value is computed on the right and written into hp."
      },
      copy_name: {
        title: "Hero Name",
        task: "Retype the code exactly as written.",
        explanation: "The string in quotes is assigned to the variable name and then printed.",
        code: "name = \"Hero\"\nprint(name)"
      },
      copy_if: {
        title: "Health Check",
        task: "Retype the code exactly as written. Keep the indentation!",
        explanation: "if checks the condition hp <= 0, and the body of the condition is written with a 4-space indent.",
        code: "hp = 0\nif hp <= 0:\n    print(\"Defeat\")"
      },
      copy_for: {
        title: "Steps Through the Dungeon",
        task: "Retype the code exactly as written. Keep the indentation!",
        explanation: "The for loop takes values from range(3) — 0, 1, 2 — and prints each one indented."
      },
      copy_list: {
        title: "Inventory",
        task: "Retype the code exactly as written.",
        explanation: "A list is written in square brackets, and inventory[0] takes the first element.",
        code: "inventory = [\"sword\", \"shield\", \"potion\"]\nprint(inventory[0])"
      },
      copy_upper: {
        title: "Monster Shout",
        task: "Retype the code exactly as written.",
        explanation: "The .upper() method returns the string in capital letters.",
        code: "monster = \"orc\"\nprint(monster.upper())"
      },
      copy_def: {
        title: "Healing Spell",
        task: "Retype the code exactly as written. Keep the indentation!",
        explanation: "def declares a function, and return returns the result hp + 20."
      },
      copy_sum: {
        title: "Counting Gold",
        task: "Retype the code exactly as written.",
        explanation: "print() adds the values of two variables: gold + bonus."
      },
      copy_while: {
        title: "while Loop",
        task: "Retype the code exactly as written. Keep the indentation!",
        explanation: "while repeats the body while the condition is true."
      },
      copy_fstring: {
        title: "A Phrase for the Hero",
        task: "Retype the code exactly as written.",
        explanation: "An f-string inserts the value of a variable inside curly braces.",
        code: "name = \"Hero\"\nprint(f\"Hello, {name}!\")"
      },
      copy_float: {
        title: "Fractional Number",
        task: "Retype the code exactly as written.",
        explanation: "int(price) drops the fractional part, so 9 is printed."
      },
      copy_try: {
        title: "Catching an Error",
        task: "Retype the code exactly as written. Keep the indentation!",
        explanation: "try protects the conversion, and except ValueError sets a fallback value."
      },
      copy_import: {
        title: "Square Root",
        task: "Retype the code exactly as written.",
        explanation: "math.sqrt(16) returns 4.0; after import math the function is available through the dot."
      }
    },
    fill: {
      fill_minus: {
        title: "Damage to Health",
        explanation: "hp = hp - damage reduces health by the amount of damage."
      },
      fill_var: {
        title: "Printing a Variable",
        code: "name = \"Hero\"\nprint(___)",
        options: ["name", "\"name\"", "print", "\"Hero\""],
        explanation: "Without quotes name is a variable, so its value is printed."
      },
      fill_range: {
        title: "Three-Step Loop",
        explanation: "range(3) gives the numbers 0, 1, 2."
      },
      fill_le: {
        title: "Defeat Condition",
        code: "hp = 0\nif hp ___ 0:\n    print(\"Defeat\")",
        explanation: "hp <= 0 — health is no more than zero."
      },
      fill_append: {
        title: "Stocking the Inventory",
        code: "inventory = [\"sword\", \"shield\"]\ninventory.___(\"potion\")\nprint(inventory)",
        explanation: "The append() method adds an element to the end of the list."
      },
      fill_floor_div: {
        title: "Integer Division",
        explanation: "// is integer division: 10 // 3 = 3."
      },
      fill_upper: {
        title: "Loud Shout",
        code: "print(\"sword\".___)",
        explanation: "The .upper() method returns the string in capital letters."
      },
      fill_return: {
        title: "Healing Function",
        explanation: "return returns the result from a function."
      },
      fill_get: {
        title: "Reading a Dictionary",
        explanation: "get() returns the value for a dictionary key."
      },
      fill_pow: {
        title: "Powerful Strike",
        explanation: "** raises to a power: 2 ** 3 = 8."
      },
      fill_fstring: {
        title: "A Phrase for the Hero",
        code: "name = \"Hero\"\nprint(f\"___ {name}\")",
        options: ["Hello,", "Bye,", "print", "name"],
        explanation: "An f-string inserts the value of a variable from curly braces."
      },
      fill_while: {
        title: "while Loop",
        explanation: "A while loop repeats while the condition is true."
      },
      fill_import: {
        title: "Importing a Module",
        explanation: "math.sqrt(81) is the square root, the result is 9.0. A module function is accessed through a dot: math.sqrt."
      },
      fill_int: {
        title: "String to Number",
        code: "age = ___(input(\"Age: \"))",
        explanation: "input() returns a string, and int() turns it into a whole number."
      },
      fill_except: {
        title: "Catching an Error",
        code: "try:\n    gold = int(\"two\")\n___ ValueError:\n    gold = 0",
        explanation: "An error is caught by except ValueError: — only that exception type."
      }
    },
    error: {
      err_paren: {
        title: "Find the Error",
        code: "print(\"Hello\"",
        options: ["print() is missing a closing bracket", "An extra quote",
          "The def keyword is needed", "All correct"],
        explanation: "print() is missing a closing bracket."
      },
      err_if_colon: {
        title: "Find the Error",
        code: "if hp > 0\n    print(\"alive\")",
        options: ["A colon after if is missing", "Wrong indentation",
          "else is needed", "print must be capitalized"],
        explanation: "A colon goes after an if condition."
      },
      err_for_colon: {
        title: "Find the Error",
        options: ["A colon after range(3) is missing", "while is needed instead of for",
          "range does not exist", "print without arguments"],
        explanation: "The for loop line also ends with a colon."
      },
      err_mixed: {
        title: "Find the Error",
        options: ["You cannot add a string and a number", "The number needs quotes",
          "A minus sign is needed", "The quotes around 10 are extra"],
        explanation: "A string and a number cannot be added — the types must be converted."
      },
      err_def_colon: {
        title: "Find the Error",
        options: ["A colon after def heal(hp) is missing", "The word pass is needed",
          "return is not allowed in a function", "hp + 20 needs quotes"],
        explanation: "A def declaration ends with a colon."
      },
      err_case: {
        title: "Find the Error",
        code: "name = \"Orc\"\nprint(Name)",
        options: ["The variable Name is not defined — case matters",
          "Name needs quotes", "The word Orc should be lowercase", "print is extra here"],
        explanation: "Python is case-sensitive: name and Name are different variables."
      },
      err_zero: {
        title: "Find the Error",
        options: ["ZeroDivisionError: you cannot divide by zero",
          "All correct, it will be 0", "SyntaxError", "NameError"],
        explanation: "Division by zero is forbidden — it raises ZeroDivisionError."
      },
      err_index: {
        title: "Find the Error",
        options: ["IndexError: the list is empty", "All correct, it will be None",
          "KeyError", "TypeError"],
        explanation: "An empty list has no element at index 0 — IndexError."
      },
      err_default: {
        title: "Find the Error",
        options: ["The default value is created once: you need bag=None and a list inside",
          "No error, it is intended", "You need to return bag[:] instead of bag",
          "append cannot be called inside a function"],
        explanation: "The empty list in the default value is shared by all calls, so items pile up between calls. Write bag=None, and inside the function: if bag is None: bag = []."
      },
      err_alias: {
        title: "Find the Error",
        options: ["clone returns the same reference: return items[:] makes a copy",
          "No error: b is a copy of list a", "You need print(b) instead of b.append(3)",
          "A list cannot be passed to a function"],
        explanation: "return items gives back the same list, so b.append(3) also changes a. A copy is made by return items[:] or items.copy()."
      },
      err_divzero: {
        title: "Find the Error",
        options: ["Division by zero: this will raise ZeroDivisionError",
          "No error, it prints 0", "You need // instead of /", "print cannot divide"],
        explanation: "You cannot divide by zero: Python raises ZeroDivisionError. // gives the whole part, but it also cannot divide by zero."
      },
      err_quote: {
        title: "Find the Error",
        code: "print(\"sword')",
        options: ["The quotes are not closed: a double quote is opened, a single one closes",
          "No error", "You need print(sword) without quotes", "The string is too long"],
        explanation: "A string must be closed with the same quote it was opened with: \"sword\" or 'sword'."
      },
      err_import: {
        title: "Find the Error",
        options: ["sqrt is not imported: you need math.sqrt(9)", "No error",
          "You need import sqrt", "math is not in Python"],
        explanation: "import math loads the module, not the individual functions. After it, write math.sqrt, or separately: from math import sqrt."
      }
    }
  };
  function translateTaskBank(bank, catalog) {
    if (typeof bank === "undefined" || !bank) return;
    bank.forEach(function (task) {
      var en = catalog[task.id];
      if (!en) return;
      if (en.title) task.title = en.title;
      if (en.task) task.task = en.task;
      if (en.explanation) task.explanation = en.explanation;
      if (en.code) task.code = en.code;
      if (en.options) task.options = en.options;
      if (en.tests) task.tests = en.tests;
    });
  }
  translateTaskBank(typeof CODE_TASKS !== "undefined" ? CODE_TASKS : null, taskBanks.code);
  translateTaskBank(typeof COPY_TASKS !== "undefined" ? COPY_TASKS : null, taskBanks.copy);
  translateTaskBank(typeof FILL_TASKS !== "undefined" ? FILL_TASKS : null, taskBanks.fill);
  translateTaskBank(typeof ERROR_TASKS !== "undefined" ? ERROR_TASKS : null, taskBanks.error);

  /* --- генераторы --- */
  // variants.js и practice-variants.js собирают задания из русских
  // шаблонов. Английский банк вопросов и практики переведён целиком,
  // генераторы — отдельная фаза: пока они выключены, в английской версии
  // не появится ни одной русской строки.
  if (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS)) {
    for (var qi = QUESTIONS.length - 1; qi >= 0; qi--) {
      if (QUESTIONS[qi] && QUESTIONS[qi].generated) QUESTIONS.splice(qi, 1);
    }
  }
  if (typeof window.PracticeVariants !== "undefined" && window.PracticeVariants) {
    window.PracticeVariants.list = [];
  }

  /* --- лента обновлений --- */
  // История правок длиннее двухсот строк и остаётся русской: для английской
  // сборки показываем короткую английскую сводку вместо машинного перевода.
  function localizeUpdates() {
    var api = window.PyUpdates;
    if (!api || api.__enWrapped) return;
    var original = api.open;
    api.open = function () {
      original.apply(api, arguments);
      var box = document.getElementById("updates-box");
      if (!box) return;
      var info = window.__PYQUIZ_VERSION;
      var version = ((info && info.version) || "1.55.1").replace("-web", "");
      box.innerHTML =
        "<div class='battle-head'><div>" +
        "<div class='enemy-name'>Updates</div>" +
        "<div class='hud-num'>What's new · v" + version + "</div>" +
        "</div><button class='exit-btn' id='updates-close' type='button' " +
        "data-tip='Close updates. Escape.'>Close</button></div>" +
        "<div class='battle-mid updates-body'>" +
        "<article class='update-entry'>" +
        "<div class='update-entry-head'><h3>Settings: language first</h3>" +
        "<span class='update-version'>v1.55.1</span></div>" +
        "<div class='update-date'>November 13, 2026</div>" +
        "<ul>" +
        "<li>The Game language block is now the first item in Settings, with a short explanation.</li>" +
        "<li>Fixed the boss phase label in English battles: “PHASE 1 OF 3”.</li>" +
        "<li>New game icon: a monitor with a Python prompt.</li>" +
        "</ul></article>" +
        "<article class='update-entry'>" +
        "<div class='update-entry-head'><h3>English edition</h3>" +
        "<span class='update-version'>v" + version + "</span></div>" +
        "<div class='update-date'>November 13, 2026</div>" +
        "<ul>" +
        "<li>The whole game is now available in English: interface, campaign, village, codex, school and practice tasks.</li>" +
        "<li>You can switch languages at any time in Settings.</li>" +
        "<li>The Russian build keeps the full historical changelog.</li>" +
        "</ul></article>" +
        "<article class='update-entry'>" +
        "<div class='update-entry-head'><h3>Balance: victory is now within reach</h3>" +
        "<span class='update-version'>v1.55.0</span></div>" +
        "<div class='update-date'>November 12, 2026</div>" +
        "<ul>" +
        "<li>Campaign boss health is reduced by 30%: the Demon Lord no longer eats a third of your runs.</li>" +
        "<li>Healing from a new level grows with the hero: 10% of the maximum, but at least 30.</li>" +
        "<li>Damage from a new level is up from 3 to 6: the second half of a run no longer falls behind.</li>" +
        "<li>Defeating the dragon is now achievable with confident play, but still rare.</li>" +
        "</ul></article>" +
        "</div>" +
        "<div class='battle-foot'><span class='foot-note'>Game news</span>" +
        "<span class='win-chip'>Esc — close</span></div>";
      var close = document.getElementById("updates-close");
      if (close) close.addEventListener("click", api.close);
    };
    api.__enWrapped = true;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", localizeUpdates);
  } else {
    localizeUpdates();
  }
})();
