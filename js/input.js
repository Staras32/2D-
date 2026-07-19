/* Aden Chronicles - input handling: click-to-move, targeting, keyboard */
var Game = window.Game || {};
(function () {

function dist(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

Game.initInput = function () {
  var canvas = Game.getCanvas();

  canvas.addEventListener('click', function (e) {
    var player = Game.state.player;
    if (!player || player.hp <= 0) return;
    var camera = Game.state.camera;
    var worldX = e.clientX + camera.x;
    var worldY = e.clientY + camera.y;

    var clickedMonster = Game.state.monsters.find(function (m) {
      if (m.dead) return false;
      return dist(worldX, worldY, m.x, m.y) <= (m.type.id === 'golem' ? 22 : 16);
    });
    var clickedNpc = Game.state.zone.def.npcs.find(function (n) {
      var nx = n.x * Game.TILE_SIZE, ny = n.y * Game.TILE_SIZE;
      return dist(worldX, worldY, nx, ny) <= 20;
    });

    if (clickedMonster) {
      Game.state.target = clickedMonster;
      player.destX = null; player.destY = null;
      player.autoAttackTarget = clickedMonster;
    } else if (clickedNpc) {
      player.destX = null; player.destY = null;
      if (clickedNpc.type === 'shop') Game.openShop(clickedNpc.shopId);
      else if (clickedNpc.type === 'lore') {
        var line = clickedNpc.lines[Math.floor(Math.random() * clickedNpc.lines.length)];
        Game.log(clickedNpc.name + ': "' + line + '"', 'system');
      }
    } else if (Game.isWalkable(worldX, worldY)) {
      player.destX = worldX;
      player.destY = worldY;
      player.autoAttackTarget = null;
      Game.state.target = null;
    }
  });

  window.addEventListener('keydown', function (e) {
    if (e.key >= '1' && e.key <= '4') {
      var idx = parseInt(e.key, 10) - 1;
      var player = Game.state.player;
      if (player && player.skills[idx]) {
        Game.playerUseSkill(player.skills[idx], performance.now() / 1000);
      }
    } else if (e.key === 'i' || e.key === 'I') {
      Game.toggleWindow('inventory-window');
    } else if (e.key === 'c' || e.key === 'C') {
      Game.toggleWindow('character-window');
    }
  });

  document.querySelectorAll('.hotbar-slot').forEach(function (slot) {
    slot.addEventListener('click', function () {
      var s = slot.getAttribute('data-slot');
      if (s === 'i') Game.toggleWindow('inventory-window');
      else if (s === 'c') Game.toggleWindow('character-window');
      else {
        var idx = parseInt(s, 10) - 1;
        var player = Game.state.player;
        if (player && player.skills[idx]) {
          Game.playerUseSkill(player.skills[idx], performance.now() / 1000);
        }
      }
    });
  });
};

window.Game = Game;
})();
