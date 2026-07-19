/* Aden Chronicles - monster entities, AI, floating combat text */
var Game = window.Game || {};
(function () {

var RESPAWN_TIME = 20;

Game.createMonster = function (type, spawn, zoneId, uid) {
  var homeX = spawn.x * Game.TILE_SIZE + Game.TILE_SIZE / 2;
  var homeY = spawn.y * Game.TILE_SIZE + Game.TILE_SIZE / 2;
  var offX = (Math.random() * 2 - 1) * spawn.radius * Game.TILE_SIZE;
  var offY = (Math.random() * 2 - 1) * spawn.radius * Game.TILE_SIZE;
  return {
    uid: zoneId + '_' + type.id + '_' + uid,
    type: type,
    homeX: homeX, homeY: homeY, spawnRadius: spawn.radius * Game.TILE_SIZE,
    x: homeX + offX, y: homeY + offY,
    hp: type.hp,
    state: 'idle',
    wanderTargetX: null, wanderTargetY: null,
    wanderTimer: Math.random() * 3,
    lastAttackTime: 0,
    dead: false,
    respawnAt: null
  };
};

function dist(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

Game.updateMonsters = function (dt, now) {
  var player = Game.state.player;
  Game.state.monsters.forEach(function (m) {
    if (m.dead) {
      if (m.respawnAt && now >= m.respawnAt) {
        m.dead = false;
        m.hp = m.type.hp;
        m.x = m.homeX; m.y = m.homeY;
        m.state = 'idle';
        m.respawnAt = null;
      }
      return;
    }
    if (!player || player.zoneId !== Game.state.zoneId || player.hp <= 0) {
      m.state = 'idle';
      return;
    }

    var dToPlayer = dist(m.x, m.y, player.x, player.y);

    if (m.state !== 'chase' && dToPlayer <= m.type.aggroRange) {
      m.state = 'chase';
    }

    if (m.state === 'chase') {
      if (dToPlayer > m.type.attackRange) {
        var dx = player.x - m.x, dy = player.y - m.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = m.x + (dx / len) * m.type.moveSpeed * dt;
        var ny = m.y + (dy / len) * m.type.moveSpeed * dt;
        if (Game.isWalkable(nx, m.y)) m.x = nx;
        if (Game.isWalkable(m.x, ny)) m.y = ny;
      } else {
        if (now - m.lastAttackTime >= 1 / m.type.attackSpeed) {
          m.lastAttackTime = now;
          Game.monsterAttack(m, player);
        }
      }
      if (dist(m.x, m.y, m.homeX, m.homeY) > m.spawnRadius * 3) {
        m.state = 'return';
      }
    } else if (m.state === 'return') {
      var d2 = dist(m.x, m.y, m.homeX, m.homeY);
      if (d2 < 8) { m.state = 'idle'; }
      else {
        var dx2 = m.homeX - m.x, dy2 = m.homeY - m.y;
        var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
        m.x += (dx2 / len2) * m.type.moveSpeed * dt;
        m.y += (dy2 / len2) * m.type.moveSpeed * dt;
      }
    } else {
      m.wanderTimer -= dt;
      if (m.wanderTimer <= 0) {
        m.wanderTimer = 2 + Math.random() * 3;
        m.wanderTargetX = m.homeX + (Math.random() * 2 - 1) * m.spawnRadius;
        m.wanderTargetY = m.homeY + (Math.random() * 2 - 1) * m.spawnRadius;
      }
      if (m.wanderTargetX !== null) {
        var dx3 = m.wanderTargetX - m.x, dy3 = m.wanderTargetY - m.y;
        var d3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
        if (d3 > 4) {
          var nx3 = m.x + (dx3 / d3) * (m.type.moveSpeed * 0.4) * dt;
          var ny3 = m.y + (dy3 / d3) * (m.type.moveSpeed * 0.4) * dt;
          if (Game.isWalkable(nx3, m.y)) m.x = nx3;
          if (Game.isWalkable(m.x, ny3)) m.y = ny3;
        }
      }
    }
  });
};

Game.killMonster = function (m, now) {
  m.dead = true;
  m.respawnAt = now + RESPAWN_TIME;
  if (Game.state.target === m) Game.state.target = null;

  var player = Game.state.player;
  var xpGain = m.type.xp;
  var goldGain = m.type.gold[0] + Math.floor(Math.random() * (m.type.gold[1] - m.type.gold[0] + 1));
  player.gold += goldGain;
  Game.log(m.type.name + ' nugalėtas. Gauta ' + xpGain + ' XP, ' + goldGain + ' aukso.', 'loot');
  Game.grantXp(player, xpGain);

  m.type.loot.forEach(function (l) {
    if (Math.random() < l.chance) {
      Game.addItemToInventory(player, l.item, 1);
      Game.log('Rasta: ' + Game.ITEMS[l.item].name, 'loot');
    }
  });
};

Game.grantXp = function (player, amount) {
  player.xp += amount;
  var need = Game.xpToNextLevel(player.level);
  while (player.xp >= need) {
    player.xp -= need;
    player.level++;
    player.stats.str += 2; player.stats.dex += 1; player.stats.con += 2;
    player.stats.int_ += 1; player.stats.wit += 1; player.stats.men += 1;
    Game.computeDerived(player);
    player.hp = player.maxHp; player.mp = player.maxMp; player.cp = player.maxCp;
    Game.log('Pasiektas ' + player.level + ' lygis!', 'levelup');
    need = Game.xpToNextLevel(player.level);
  }
};

Game.addItemToInventory = function (player, itemId, qty) {
  var entry = player.inventory.find(function (i) { return i.item === itemId; });
  if (entry) entry.qty += qty;
  else player.inventory.push({ item: itemId, qty: qty });
};

Game.removeItemFromInventory = function (player, itemId, qty) {
  var entry = player.inventory.find(function (i) { return i.item === itemId; });
  if (!entry) return false;
  entry.qty -= qty;
  if (entry.qty <= 0) player.inventory = player.inventory.filter(function (i) { return i !== entry; });
  return true;
};

/* ---------------- Floating combat text ---------------- */
Game.spawnFloatingText = function (worldX, worldY, text, color) {
  var camera = Game.state.camera;
  var el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.color = color || '#fff';
  el.style.left = (worldX - camera.x) + 'px';
  el.style.top = (worldY - camera.y - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 950);
};

window.Game = Game;
})();
