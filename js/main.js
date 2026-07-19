/* Aden Chronicles - main game loop and bootstrap */
var Game = window.Game || {};
(function () {

var PLAYER_BASE_SPEED = 140;
var PLAYER_ATTACK_RANGE = 46;

function dist(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function updatePlayerMovement(dt) {
  var player = Game.state.player;
  if (player.hp <= 0) return;
  var speed = PLAYER_BASE_SPEED + player.stats.dex * 0.6;

  if (player.autoAttackTarget && !player.autoAttackTarget.dead) {
    var target = player.autoAttackTarget;
    var d = dist(player.x, player.y, target.x, target.y);
    if (d > PLAYER_ATTACK_RANGE) {
      moveToward(player, target.x, target.y, speed, dt);
    }
    return;
  }

  if (player.destX !== null && player.destY !== null) {
    var d2 = dist(player.x, player.y, player.destX, player.destY);
    if (d2 < 4) {
      player.destX = null; player.destY = null;
    } else {
      moveToward(player, player.destX, player.destY, speed, dt);
    }
  }
}

function moveToward(entity, tx, ty, speed, dt) {
  var dx = tx - entity.x, dy = ty - entity.y;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var nx = entity.x + (dx / len) * speed * dt;
  var ny = entity.y + (dy / len) * speed * dt;
  if (Game.isWalkable(nx, entity.y)) entity.x = nx;
  if (Game.isWalkable(entity.x, ny)) entity.y = ny;
}

function updateAutoAttack(now) {
  var player = Game.state.player;
  if (player.hp <= 0) return;
  var target = player.autoAttackTarget;
  if (!target || target.dead) { player.autoAttackTarget = null; return; }
  var d = dist(player.x, player.y, target.x, target.y);
  if (d <= PLAYER_ATTACK_RANGE) {
    var interval = 1 / player.attackSpeed;
    if (now - player.lastAttackTime >= interval) {
      player.lastAttackTime = now;
      Game.playerBasicAttack(target, now);
    }
  }
}

var lastSaveTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);
  var now = timestamp / 1000;
  var dt = Game.state.lastTime ? Math.min(0.1, now - Game.state.lastTime) : 0;
  Game.state.lastTime = now;

  var player = Game.state.player;
  if (!player) return;

  updatePlayerMovement(dt);
  updateAutoAttack(now);
  Game.checkPortals();
  Game.updateMonsters(dt, now);
  Game.updateBuffs(player, now);

  Game.render();
  Game.renderMinimap();
  Game.updateHUD(now);

  if (now - lastSaveTime > 5) {
    lastSaveTime = now;
    Game.saveGame();
  }
}

function startGame(name, raceId, archetypeId, restoredPlayer) {
  document.getElementById('creation-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  Game.state.player = restoredPlayer ? restoredPlayer : Game.createPlayer(name, raceId, archetypeId);
  if (restoredPlayer) {
    Game.computeDerived(Game.state.player);
    Game.log('Sveikas sugrįžęs, ' + Game.state.player.name + '!', 'system');
  } else {
    Game.log('Sveikas atvykęs į Adeno žemes, ' + Game.state.player.name + '!', 'system');
  }

  Game.initRenderer();
  Game.initInput();
  Game.loadZone(Game.state.player.zoneId,
    Game.state.player.x / Game.TILE_SIZE, Game.state.player.y / Game.TILE_SIZE);

  requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', function () {
  Game.initCreationScreen(startGame);
});

window.addEventListener('beforeunload', function () {
  if (Game.state.player) Game.saveGame();
});

window.Game = Game;
})();
