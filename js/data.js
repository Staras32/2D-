/* Aden Chronicles - static game data (races, classes, skills, items, monsters, zones) */
var Game = window.Game || {};
(function () {

Game.TILE_SIZE = 32;

Game.TILE = {
  GRASS: 'grass',
  PATH: 'path',
  PLAZA: 'plaza',
  WATER: 'water',
  WALL: 'wall',
  TREE: 'tree',
  DUNGEON_FLOOR: 'dfloor',
  DUNGEON_WALL: 'dwall'
};

Game.WALKABLE = {
  grass: true, path: true, plaza: true, dfloor: true,
  water: false, wall: false, tree: false, dwall: false
};

/* ---------------- Races ---------------- */
Game.RACES = [
  {
    id: 'human', name: 'Žmogus', icon: '🗡️',
    desc: 'Universalūs ir prisitaikantys, stiprūs tiek kalaviju, tiek magija.',
    base: { str: 40, dex: 30, con: 40, int_: 35, wit: 25, men: 30 },
    archetypes: ['fighter', 'mystic']
  },
  {
    id: 'elf', name: 'Elfas', icon: '🏹',
    desc: 'Grakštūs miško gyventojai, greiti ir gabūs magijai.',
    base: { str: 35, dex: 40, con: 30, int_: 35, wit: 35, men: 25 },
    archetypes: ['fighter', 'mystic']
  },
  {
    id: 'darkelf', name: 'Tamsos elfas', icon: '🗡️',
    desc: 'Šešėlių medžiotojai, mirtini kovoje iš arti ir iš toli.',
    base: { str: 38, dex: 42, con: 30, int_: 30, wit: 30, men: 30 },
    archetypes: ['fighter', 'mystic']
  },
  {
    id: 'orc', name: 'Orkas', icon: '🪓',
    desc: 'Galingi kariai su gamtos šamanų palaikymu.',
    base: { str: 45, dex: 28, con: 45, int_: 20, wit: 30, men: 32 },
    archetypes: ['fighter', 'mystic']
  },
  {
    id: 'dwarf', name: 'Dvarfas', icon: '⚒️',
    desc: 'Tvirti amatininkai ir kariai, atsparūs bet kokiam smūgiui.',
    base: { str: 42, dex: 32, con: 48, int_: 25, wit: 22, men: 21 },
    archetypes: ['fighter']
  }
];

/* ---------------- Archetypes / starting classes ---------------- */
Game.ARCHETYPES = {
  fighter: {
    id: 'fighter',
    label: 'Kovotojas',
    icon: '⚔️',
    desc: 'Kovoja iš arti kalaviju ir kirviu, atsparus žalai.',
    classNames: {
      human: 'Žmogaus kovotojas', elf: 'Elfų kovotojas', darkelf: 'Tamsos kovotojas',
      orc: 'Orkų kovotojas', dwarf: 'Dvarfų kovotojas'
    },
    hpBase: 90, mpBase: 25, cpBase: 60,
    hpPerLevel: 14, mpPerLevel: 2, cpPerLevel: 9,
    pAtkBase: 10, mAtkBase: 2, pDefBase: 12, mDefBase: 4,
    skills: ['power_strike', 'guts']
  },
  mystic: {
    id: 'mystic',
    label: 'Mistikas',
    icon: '🔮',
    desc: 'Naudoja magiją puolimui bei gydymui, trapus arti.',
    classNames: {
      human: 'Žmogaus mistikas', elf: 'Elfų mistikas', darkelf: 'Tamsos mistikas',
      orc: 'Orkų šamanas'
    },
    hpBase: 65, mpBase: 55, cpBase: 30,
    hpPerLevel: 8, mpPerLevel: 6, cpPerLevel: 4,
    pAtkBase: 4, mAtkBase: 12, pDefBase: 6, mDefBase: 10,
    skills: ['wind_strike', 'heal']
  }
};

/* ---------------- Skills ---------------- */
Game.SKILLS = {
  power_strike: {
    id: 'power_strike', name: 'Galingas smūgis', type: 'physical',
    mpCost: 8, cooldown: 3, power: 1.8, range: 48,
    minLevel: 1, desc: 'Stiprus fizinis smūgis taikiniui.'
  },
  guts: {
    id: 'guts', name: 'Ryžtas', type: 'buff_self',
    mpCost: 12, cooldown: 30, duration: 20, stat: 'pAtk', mult: 1.25,
    minLevel: 3, desc: 'Laikinai padidina fizinę ataką.'
  },
  wind_strike: {
    id: 'wind_strike', name: 'Vėjo smūgis', type: 'magic',
    mpCost: 10, cooldown: 2.5, power: 2.0, range: 220,
    minLevel: 1, desc: 'Magiškas vėjo pliūpsnis priešui.'
  },
  heal: {
    id: 'heal', name: 'Gydymas', type: 'heal',
    mpCost: 14, cooldown: 6, power: 1.6, range: 0,
    minLevel: 3, desc: 'Atkuria savo gyvybės taškus.'
  }
};

/* ---------------- Items ---------------- */
Game.ITEMS = {
  short_sword: { id: 'short_sword', name: 'Trumpas kalavijas', type: 'weapon', archetype: 'fighter', pAtk: 8, price: 40 },
  battle_axe: { id: 'battle_axe', name: 'Kovos kirvis', type: 'weapon', archetype: 'fighter', pAtk: 14, price: 120 },
  wooden_wand: { id: 'wooden_wand', name: 'Medinė lazdelė', type: 'weapon', archetype: 'mystic', mAtk: 8, price: 40 },
  apprentice_staff: { id: 'apprentice_staff', name: 'Mokinio lazda', type: 'weapon', archetype: 'mystic', mAtk: 14, price: 120 },

  leather_armor: { id: 'leather_armor', name: 'Odiniai šarvai', type: 'armor', pDef: 6, mDef: 2, price: 50 },
  studded_armor: { id: 'studded_armor', name: 'Kniedėti šarvai', type: 'armor', pDef: 12, mDef: 4, price: 140 },
  mystic_robe: { id: 'mystic_robe', name: 'Mistiko apdaras', type: 'armor', pDef: 3, mDef: 10, price: 90 },

  healing_potion: { id: 'healing_potion', name: 'Gydomasis eliksyras', type: 'potion', heal: 60, price: 15 },
  mana_potion: { id: 'mana_potion', name: 'Manos eliksyras', type: 'potion', mana: 50, price: 15 }
};

/* ---------------- Shops ---------------- */
Game.SHOPS = {
  village_shop: {
    id: 'village_shop', name: 'Aldono prekyba',
    stock: ['short_sword', 'battle_axe', 'wooden_wand', 'apprentice_staff',
            'leather_armor', 'studded_armor', 'mystic_robe',
            'healing_potion', 'mana_potion']
  }
};

/* ---------------- Monster types ---------------- */
Game.MONSTER_TYPES = {
  keltir: {
    id: 'keltir', name: 'Keltyras', level: 2, color: '#8a6a3a',
    hp: 45, pAtk: 7, pDef: 4, mDef: 2, xp: 12, gold: [1, 4],
    aggroRange: 90, attackRange: 40, attackSpeed: 1.4, moveSpeed: 55,
    loot: [{ item: 'healing_potion', chance: 0.15 }]
  },
  wolf: {
    id: 'wolf', name: 'Pilkasis vilkas', level: 4, color: '#6a6a6a',
    hp: 70, pAtk: 11, pDef: 6, mDef: 4, xp: 22, gold: [2, 6],
    aggroRange: 110, attackRange: 40, attackSpeed: 1.2, moveSpeed: 75,
    loot: [{ item: 'healing_potion', chance: 0.2 }, { item: 'short_sword', chance: 0.03 }]
  },
  spider: {
    id: 'spider', name: 'Urvinis vorius', level: 6, color: '#3a2a1a',
    hp: 95, pAtk: 14, pDef: 8, mDef: 6, xp: 34, gold: [3, 8],
    aggroRange: 100, attackRange: 40, attackSpeed: 1.3, moveSpeed: 60,
    loot: [{ item: 'mana_potion', chance: 0.2 }, { item: 'leather_armor', chance: 0.04 }]
  },
  skeleton: {
    id: 'skeleton', name: 'Kapų skeletas', level: 8, color: '#c9c2a8',
    hp: 130, pAtk: 18, pDef: 10, mDef: 8, xp: 50, gold: [4, 10],
    aggroRange: 110, attackRange: 44, attackSpeed: 1.1, moveSpeed: 50,
    loot: [{ item: 'studded_armor', chance: 0.05 }, { item: 'healing_potion', chance: 0.25 }]
  },
  golem: {
    id: 'golem', name: 'Akmens golemas', level: 12, color: '#5a5a66',
    hp: 240, pAtk: 26, pDef: 16, mDef: 10, xp: 95, gold: [8, 18],
    aggroRange: 90, attackRange: 46, attackSpeed: 0.8, moveSpeed: 40,
    loot: [{ item: 'battle_axe', chance: 0.06 }, { item: 'apprentice_staff', chance: 0.06 }]
  }
};

/* ---------------- XP curve ---------------- */
Game.xpToNextLevel = function (level) {
  return Math.floor(40 * level * level + 60 * level);
};

/* ---------------- Zones ---------------- */
Game.ZONES = {
  village: {
    id: 'village', name: 'Talkynės kaimas', width: 22, height: 15,
    base: Game.TILE.PLAZA,
    rects: [
      { x1: 0, y1: 0, x2: 21, y2: 0, tile: Game.TILE.WALL },
      { x1: 0, y1: 14, x2: 21, y2: 14, tile: Game.TILE.WALL },
      { x1: 0, y1: 0, x2: 0, y2: 14, tile: Game.TILE.WALL },
      { x1: 21, y1: 0, x2: 21, y2: 14, tile: Game.TILE.WALL },
      { x1: 2, y1: 2, x2: 5, y2: 4, tile: Game.TILE.WALL },
      { x1: 16, y1: 2, x2: 19, y2: 4, tile: Game.TILE.WALL },
      { x1: 2, y1: 10, x2: 5, y2: 12, tile: Game.TILE.WALL },
      { x1: 16, y1: 10, x2: 19, y2: 12, tile: Game.TILE.WALL }
    ],
    playerSpawn: { x: 11, y: 7 },
    npcs: [
      { id: 'shop_aldon', name: 'Aldonas', type: 'shop', shopId: 'village_shop', x: 8, y: 7, color: '#c9a24a' },
      { id: 'guard', name: 'Sargybinis Bertas', type: 'lore', x: 14, y: 7, color: '#7a8a9a',
        lines: ['Laukai už vartų knibžda nuo padarų — būk atsargus, keliauninke.',
                'Urvas rytuose slepia dar pavojingesnius priešus.'] }
    ],
    portals: [
      { x: 20, y: 7, r: 1.3, toZone: 'fields', toX: 3, toY: 12 }
    ],
    monsterSpawns: []
  },

  fields: {
    id: 'fields', name: 'Elmorės laukai', width: 36, height: 26,
    base: Game.TILE.GRASS,
    rects: [
      { x1: 0, y1: 0, x2: 35, y2: 0, tile: Game.TILE.WALL },
      { x1: 0, y1: 25, x2: 35, y2: 25, tile: Game.TILE.WALL },
      { x1: 0, y1: 0, x2: 0, y2: 25, tile: Game.TILE.WALL },
      { x1: 35, y1: 0, x2: 35, y2: 25, tile: Game.TILE.WALL },
      { x1: 0, y1: 10, x2: 2, y2: 15, tile: Game.TILE.PATH },
      { x1: 8, y1: 4, x2: 10, y2: 6, tile: Game.TILE.TREE },
      { x1: 22, y1: 3, x2: 25, y2: 5, tile: Game.TILE.TREE },
      { x1: 4, y1: 18, x2: 7, y2: 21, tile: Game.TILE.WATER },
      { x1: 28, y1: 16, x2: 32, y2: 20, tile: Game.TILE.WATER },
      { x1: 16, y1: 12, x2: 19, y2: 14, tile: Game.TILE.TREE },
      { x1: 30, y1: 1, x2: 34, y2: 3, tile: Game.TILE.PATH }
    ],
    playerSpawn: { x: 2, y: 12 },
    npcs: [],
    portals: [
      { x: 1, y: 12, r: 1.3, toZone: 'village', toX: 18, toY: 7 },
      { x: 33, y: 2, r: 1.3, toZone: 'dungeon', toX: 5, toY: 9 }
    ],
    monsterSpawns: [
      { typeId: 'keltir', x: 6, y: 8, radius: 3, count: 3 },
      { typeId: 'keltir', x: 12, y: 18, radius: 3, count: 3 },
      { typeId: 'wolf', x: 20, y: 6, radius: 4, count: 3 },
      { typeId: 'wolf', x: 26, y: 14, radius: 4, count: 2 },
      { typeId: 'spider', x: 14, y: 10, radius: 3, count: 2 }
    ]
  },

  dungeon: {
    id: 'dungeon', name: 'Pamirštas urvas', width: 26, height: 20,
    base: Game.TILE.DUNGEON_FLOOR,
    rects: [
      { x1: 0, y1: 0, x2: 25, y2: 0, tile: Game.TILE.DUNGEON_WALL },
      { x1: 0, y1: 19, x2: 25, y2: 19, tile: Game.TILE.DUNGEON_WALL },
      { x1: 0, y1: 0, x2: 0, y2: 19, tile: Game.TILE.DUNGEON_WALL },
      { x1: 25, y1: 0, x2: 25, y2: 19, tile: Game.TILE.DUNGEON_WALL },
      { x1: 6, y1: 5, x2: 8, y2: 8, tile: Game.TILE.DUNGEON_WALL },
      { x1: 14, y1: 10, x2: 17, y2: 13, tile: Game.TILE.DUNGEON_WALL },
      { x1: 18, y1: 3, x2: 20, y2: 5, tile: Game.TILE.DUNGEON_WALL }
    ],
    playerSpawn: { x: 2, y: 9 },
    npcs: [],
    portals: [
      { x: 2, y: 9, r: 1.3, toZone: 'fields', toX: 30, toY: 2 }
    ],
    monsterSpawns: [
      { typeId: 'skeleton', x: 10, y: 6, radius: 3, count: 3 },
      { typeId: 'skeleton', x: 20, y: 14, radius: 3, count: 3 },
      { typeId: 'spider', x: 6, y: 15, radius: 3, count: 2 },
      { typeId: 'golem', x: 22, y: 8, radius: 2, count: 1 }
    ]
  }
};

window.Game = Game;
})();
