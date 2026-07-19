/* Aden Chronicles - UI wiring: character creation, HUD, inventory, character sheet, shop */
var Game = window.Game || {};
(function () {

var creation = { name: '', race: null, archetype: null };

Game.log = function (msg, cls) {
  var box = document.getElementById('log-content');
  if (!box) return;
  var line = document.createElement('div');
  line.className = 'log-' + (cls || 'system');
  line.textContent = msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
  while (box.children.length > 100) box.removeChild(box.firstChild);
};

/* ---------------- Character creation screen ---------------- */
Game.initCreationScreen = function (onCreate) {
  var raceBox = document.getElementById('cc-races');
  var archBox = document.getElementById('cc-archetypes');
  var nameInput = document.getElementById('cc-name');
  var summary = document.getElementById('cc-summary');
  var createBtn = document.getElementById('btn-create');
  var continueBtn = document.getElementById('btn-continue');

  Game.RACES.forEach(function (race) {
    var card = document.createElement('div');
    card.className = 'cc-card';
    card.innerHTML = '<span class="cc-icon">' + race.icon + '</span>' +
      '<span class="cc-title">' + race.name + '</span>' +
      '<span class="cc-desc">' + race.desc + '</span>';
    card.addEventListener('click', function () {
      creation.race = race.id;
      if (!race.archetypes.includes(creation.archetype)) creation.archetype = null;
      renderArchetypes(race);
      Array.from(raceBox.children).forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      updateSummary();
    });
    raceBox.appendChild(card);
  });

  function renderArchetypes(race) {
    archBox.innerHTML = '';
    race.archetypes.forEach(function (archId) {
      var arch = Game.ARCHETYPES[archId];
      var card = document.createElement('div');
      card.className = 'cc-card';
      if (creation.archetype === archId) card.classList.add('selected');
      card.innerHTML = '<span class="cc-icon">' + arch.icon + '</span>' +
        '<span class="cc-title">' + arch.classNames[race.id] + '</span>' +
        '<span class="cc-desc">' + arch.desc + '</span>';
      card.addEventListener('click', function () {
        creation.archetype = archId;
        Array.from(archBox.children).forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        updateSummary();
      });
      archBox.appendChild(card);
    });
  }

  function updateSummary() {
    createBtn.disabled = !(creation.name && creation.race && creation.archetype);
    if (!creation.race || !creation.archetype) {
      summary.textContent = 'Pasirink rasę ir kelią, kad pamatytum savo personažo aprašymą.';
      return;
    }
    var race = Game.RACES.find(function (r) { return r.id === creation.race; });
    var arch = Game.ARCHETYPES[creation.archetype];
    summary.textContent =
      arch.classNames[race.id] + '\n' +
      'STR ' + race.base.str + '  DEX ' + race.base.dex + '  CON ' + race.base.con +
      '  INT ' + race.base.int_ + '  WIT ' + race.base.wit + '  MEN ' + race.base.men + '\n' +
      'Pradiniai įgūdžiai: ' + arch.skills.map(function (s) { return Game.SKILLS[s].name; }).join(', ');
  }

  nameInput.addEventListener('input', function () {
    creation.name = nameInput.value.trim();
    updateSummary();
  });

  createBtn.addEventListener('click', function () {
    if (!creation.name || !creation.race || !creation.archetype) return;
    onCreate(creation.name, creation.race, creation.archetype);
  });

  if (Game.hasSave()) {
    continueBtn.style.display = 'inline-block';
    continueBtn.addEventListener('click', function () {
      var data = Game.loadGame();
      if (data && data.player) onCreate(null, null, null, data.player);
    });
  }

  updateSummary();
};

/* ---------------- HUD ---------------- */
Game.updateHUD = function (now) {
  var player = Game.state.player;
  if (!player) return;

  document.getElementById('st-name').textContent = player.name;
  document.getElementById('st-classlevel').textContent = player.className + ' · Lv.' + player.level;
  document.getElementById('bar-cp').style.width = (100 * player.cp / player.maxCp) + '%';
  document.getElementById('bar-hp').style.width = (100 * Math.max(0, player.hp) / player.maxHp) + '%';
  document.getElementById('bar-mp').style.width = (100 * player.mp / player.maxMp) + '%';
  var need = Game.xpToNextLevel(player.level);
  document.getElementById('bar-xp').style.width = (100 * player.xp / need) + '%';

  var zoneDef = Game.state.zone ? Game.state.zone.def : null;
  document.getElementById('zone-name').textContent = zoneDef ? zoneDef.name : '';

  var targetWin = document.getElementById('target-window');
  var target = Game.state.target;
  if (target && !target.dead) {
    targetWin.style.display = 'block';
    document.getElementById('tg-name').textContent = target.type.name;
    document.getElementById('tg-level').textContent = 'Lv.' + target.type.level;
    document.getElementById('bar-tg-hp').style.width = (100 * target.hp / target.type.hp) + '%';
  } else {
    targetWin.style.display = 'none';
  }

  player.skills.forEach(function (skillId, idx) {
    var slot = document.querySelector('.hotbar-slot[data-slot="' + (idx + 1) + '"]');
    if (!slot) return;
    var skill = Game.SKILLS[skillId];
    slot.querySelector('.skill-name').textContent = skill.name;
    var remaining = Game.getSkillCooldownRemaining(player, skillId, now);
    var locked = player.level < skill.minLevel;
    slot.classList.toggle('on-cooldown', remaining > 0);
    slot.classList.toggle('disabled', locked);
  });
};

/* ---------------- Window management ---------------- */
function openWindow(id) {
  document.getElementById(id).style.display = 'block';
}
function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
}
Game.toggleWindow = function (id) {
  var el = document.getElementById(id);
  el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  if (el.style.display === 'block') {
    if (id === 'inventory-window') Game.renderInventory();
    if (id === 'character-window') Game.renderCharacterSheet();
  }
};

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('close-x')) {
    closeWindow(e.target.getAttribute('data-close'));
  }
});

/* ---------------- Inventory ---------------- */
Game.renderInventory = function () {
  var player = Game.state.player;
  var grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  player.inventory.forEach(function (entry) {
    var item = Game.ITEMS[entry.item];
    var div = document.createElement('div');
    div.className = 'inv-item';
    div.innerHTML = item.name + (entry.qty > 1 ? '<div class="inv-qty">x' + entry.qty + '</div>' : '');
    div.title = itemTooltip(item);
    div.addEventListener('click', function () {
      if (item.type === 'weapon' || item.type === 'armor') {
        equipItem(player, item);
      } else if (item.type === 'potion') {
        usePotion(player, item);
      }
      Game.renderInventory();
    });
    grid.appendChild(div);
  });

  var weaponSlot = document.querySelector('#equip-slots [data-eq="weapon"] .eq-item');
  var armorSlot = document.querySelector('#equip-slots [data-eq="armor"] .eq-item');
  weaponSlot.textContent = player.equipment.weapon ? Game.ITEMS[player.equipment.weapon].name : '(tuščia)';
  armorSlot.textContent = player.equipment.armor ? Game.ITEMS[player.equipment.armor].name : '(tuščia)';
  document.getElementById('gold-amount').textContent = player.gold;
};

function itemTooltip(item) {
  var parts = [];
  if (item.pAtk) parts.push('P.Atk +' + item.pAtk);
  if (item.mAtk) parts.push('M.Atk +' + item.mAtk);
  if (item.pDef) parts.push('P.Def +' + item.pDef);
  if (item.mDef) parts.push('M.Def +' + item.mDef);
  if (item.heal) parts.push('Atkuria ' + item.heal + ' HP');
  if (item.mana) parts.push('Atkuria ' + item.mana + ' MP');
  return parts.join(', ');
}

function equipItem(player, item) {
  if (item.archetype && item.archetype !== player.archetypeId) {
    Game.log('Šis daiktas netinka tavo klasei.', 'system');
    return;
  }
  var slotKey = item.type;
  var previous = player.equipment[slotKey];
  Game.removeItemFromInventory(player, item.id, 1);
  if (previous) Game.addItemToInventory(player, previous, 1);
  player.equipment[slotKey] = item.id;
  Game.computeDerived(player);
  Game.log('Užsidėjai: ' + item.name, 'system');
}

function usePotion(player, item) {
  if (item.heal) {
    player.hp = Math.min(player.maxHp, player.hp + item.heal);
    Game.spawnFloatingText(player.x, player.y, '+' + item.heal, '#6fe86f');
  }
  if (item.mana) {
    player.mp = Math.min(player.maxMp, player.mp + item.mana);
    Game.spawnFloatingText(player.x, player.y, '+' + item.mana, '#6a9ff2');
  }
  Game.removeItemFromInventory(player, item.id, 1);
}

/* ---------------- Character sheet ---------------- */
Game.renderCharacterSheet = function () {
  var player = Game.state.player;
  var box = document.getElementById('character-stats');
  var s = player.stats;
  box.innerHTML =
    '<h3>' + player.className + ' — Lv.' + player.level + '</h3>' +
    statRow('STR', s.str) + statRow('DEX', s.dex) + statRow('CON', s.con) +
    statRow('INT', s.int_) + statRow('WIT', s.wit) + statRow('MEN', s.men) +
    '<h3>Kovos rodikliai</h3>' +
    statRow('P.Atk', player.pAtk) + statRow('M.Atk', player.mAtk) +
    statRow('P.Def', player.pDef) + statRow('M.Def', player.mDef) +
    '<h3>Ištekliai</h3>' +
    statRow('HP', Math.round(player.hp) + ' / ' + player.maxHp) +
    statRow('MP', Math.round(player.mp) + ' / ' + player.maxMp) +
    statRow('CP', Math.round(player.cp) + ' / ' + player.maxCp);
};

function statRow(label, value) {
  return '<div class="stat-row"><span>' + label + '</span><span>' + value + '</span></div>';
}

/* ---------------- Shop ---------------- */
Game.openShop = function (shopId) {
  var shop = Game.SHOPS[shopId];
  var player = Game.state.player;
  var win = document.getElementById('shop-window');
  win.style.display = 'block';
  var list = document.getElementById('shop-list');
  list.innerHTML = '';
  shop.stock.forEach(function (itemId) {
    var item = Game.ITEMS[itemId];
    var row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = '<span>' + item.name + ' <em>(' + item.price + 'g)</em></span>';
    var btn = document.createElement('button');
    btn.textContent = 'Pirkti';
    btn.addEventListener('click', function () {
      if (player.gold < item.price) { Game.log('Nepakanka aukso.', 'system'); return; }
      player.gold -= item.price;
      Game.addItemToInventory(player, itemId, 1);
      Game.log('Nusipirkai: ' + item.name, 'loot');
      document.getElementById('shop-gold-amount').textContent = player.gold;
    });
    row.appendChild(btn);
    list.appendChild(row);
  });
  document.getElementById('shop-gold-amount').textContent = player.gold;
};

window.Game = Game;
})();
