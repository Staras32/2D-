/* Aden Chronicles - game state, save/load, stat formulas */
var Game = window.Game || {};
(function () {

var SAVE_KEY = 'aden_chronicles_save_v1';

Game.state = {
  player: null,
  zone: null,
  zoneId: null,
  monsters: [],
  target: null,
  camera: { x: 0, y: 0 },
  keys: {},
  lastTime: 0,
  paused: false
};

Game.computeDerived = function (player) {
  var race = Game.RACES.find(function (r) { return r.id === player.raceId; });
  var arch = Game.ARCHETYPES[player.archetypeId];
  var s = player.stats;

  var weaponBonusP = 0, weaponBonusM = 0, armorP = 0, armorM = 0;
  if (player.equipment.weapon) {
    var w = Game.ITEMS[player.equipment.weapon];
    weaponBonusP = w.pAtk || 0; weaponBonusM = w.mAtk || 0;
  }
  if (player.equipment.armor) {
    var a = Game.ITEMS[player.equipment.armor];
    armorP = a.pDef || 0; armorM = a.mDef || 0;
  }

  player.maxHp = Math.floor(arch.hpBase + arch.hpPerLevel * (player.level - 1) + s.con * 2.2);
  player.maxMp = Math.floor(arch.mpBase + arch.mpPerLevel * (player.level - 1) + s.men * 2.0);
  player.maxCp = Math.floor(arch.cpBase + arch.cpPerLevel * (player.level - 1) + s.con * 1.4);

  var buffMult = (player.buffs && player.buffs.pAtk) ? player.buffs.pAtk.mult : 1;
  player.pAtk = Math.floor((arch.pAtkBase + s.str * 0.9 + weaponBonusP) * buffMult);
  player.mAtk = Math.floor(arch.mAtkBase + s.int_ * 0.9 + weaponBonusM);
  player.pDef = Math.floor(arch.pDefBase + s.con * 0.6 + armorP);
  player.mDef = Math.floor(arch.mDefBase + s.men * 0.6 + armorM);
  player.attackSpeed = 1.0 + s.dex * 0.01;

  if (player.hp > player.maxHp) player.hp = player.maxHp;
  if (player.mp > player.maxMp) player.mp = player.maxMp;
  if (player.cp > player.maxCp) player.cp = player.maxCp;
};

Game.createPlayer = function (name, raceId, archetypeId) {
  var race = Game.RACES.find(function (r) { return r.id === raceId; });
  var arch = Game.ARCHETYPES[archetypeId];
  var className = arch.classNames[raceId];

  var player = {
    name: name, raceId: raceId, archetypeId: archetypeId, className: className,
    level: 1, xp: 0,
    stats: Object.assign({}, race.base),
    hp: 0, mp: 0, cp: 0,
    x: Game.ZONES.village.playerSpawn.x * Game.TILE_SIZE + Game.TILE_SIZE / 2,
    y: Game.ZONES.village.playerSpawn.y * Game.TILE_SIZE + Game.TILE_SIZE / 2,
    destX: null, destY: null,
    zoneId: 'village',
    inventory: [
      { item: 'healing_potion', qty: 3 },
      { item: 'mana_potion', qty: 2 }
    ],
    equipment: {
      weapon: archetypeId === 'fighter' ? 'short_sword' : 'wooden_wand',
      armor: null
    },
    gold: 50,
    skills: arch.skills.slice(),
    cooldowns: {},
    buffs: {},
    lastAttackTime: 0,
    color: race.id === 'human' ? '#c9a24a' : race.id === 'elf' ? '#6ac97a' :
           race.id === 'darkelf' ? '#8a4ac9' : race.id === 'orc' ? '#c95a4a' : '#a8946a'
  };
  Game.computeDerived(player);
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.cp = player.maxCp;
  return player;
};

Game.saveGame = function () {
  try {
    var data = {
      player: Game.state.player,
      timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable */ }
};

Game.loadGame = function () {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};

Game.hasSave = function () {
  return !!Game.loadGame();
};

window.Game = Game;
})();
