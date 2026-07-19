/* Aden Chronicles - world/tilemap building, camera, rendering */
var Game = window.Game || {};
(function () {

var TILE_COLORS = {
  grass: '#2f4a24',
  path: '#5a4a30',
  plaza: '#4a4030',
  water: '#1c3a5a',
  wall: '#2a231a',
  tree: '#1c3016',
  dfloor: '#2a2622',
  dwall: '#141210'
};

Game.state.zoneMonsters = Game.state.zoneMonsters || {};

function buildGrid(zoneDef) {
  var w = zoneDef.width, h = zoneDef.height;
  var grid = [];
  for (var y = 0; y < h; y++) {
    var row = [];
    for (var x = 0; x < w; x++) row.push(zoneDef.base);
    grid.push(row);
  }
  zoneDef.rects.forEach(function (r) {
    for (var y = r.y1; y <= r.y2; y++) {
      for (var x = r.x1; x <= r.x2; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = r.tile;
      }
    }
  });
  return grid;
}

function spawnMonstersForZone(zoneId) {
  var zoneDef = Game.ZONES[zoneId];
  var list = [];
  var uid = 0;
  zoneDef.monsterSpawns.forEach(function (spawn) {
    var type = Game.MONSTER_TYPES[spawn.typeId];
    for (var i = 0; i < spawn.count; i++) {
      list.push(Game.createMonster(type, spawn, zoneId, uid++));
    }
  });
  return list;
}

Game.getZoneMonsters = function (zoneId) {
  if (!Game.state.zoneMonsters[zoneId]) {
    Game.state.zoneMonsters[zoneId] = spawnMonstersForZone(zoneId);
  }
  return Game.state.zoneMonsters[zoneId];
};

Game.loadZone = function (zoneId, spawnX, spawnY) {
  var zoneDef = Game.ZONES[zoneId];
  var grid = buildGrid(zoneDef);
  Game.state.zoneId = zoneId;
  Game.state.zone = { def: zoneDef, grid: grid };
  Game.state.monsters = Game.getZoneMonsters(zoneId);
  Game.state.target = null;

  var player = Game.state.player;
  if (player) {
    player.zoneId = zoneId;
    if (spawnX !== undefined) {
      player.x = spawnX * Game.TILE_SIZE + Game.TILE_SIZE / 2;
      player.y = spawnY * Game.TILE_SIZE + Game.TILE_SIZE / 2;
    }
    player.destX = null; player.destY = null;
  }
  if (Game.onZoneLoaded) Game.onZoneLoaded(zoneDef);
};

Game.isWalkable = function (px, py) {
  var zone = Game.state.zone;
  if (!zone) return false;
  var tx = Math.floor(px / Game.TILE_SIZE);
  var ty = Math.floor(py / Game.TILE_SIZE);
  if (ty < 0 || ty >= zone.grid.length || tx < 0 || tx >= zone.grid[0].length) return false;
  var tile = zone.grid[ty][tx];
  return Game.WALKABLE[tile] === true;
};

Game.checkPortals = function () {
  var player = Game.state.player;
  var zone = Game.state.zone;
  if (!player || !zone) return;
  var ptx = player.x / Game.TILE_SIZE;
  var pty = player.y / Game.TILE_SIZE;
  zone.def.portals.forEach(function (p) {
    var dx = ptx - p.x, dy = pty - p.y;
    if (Math.sqrt(dx * dx + dy * dy) <= p.r) {
      Game.loadZone(p.toZone, p.toX, p.toY);
      Game.log('Įžengei į zoną: ' + Game.ZONES[p.toZone].name, 'system');
    }
  });
};

/* ---------------- Rendering ---------------- */
var canvas, ctx;

Game.initRenderer = function () {
  canvas = document.getElementById('world-canvas');
  ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
};

Game.getCanvas = function () { return canvas; };
Game.getCtx = function () { return ctx; };

function drawEntitySprite(ctx, entity, screenX, screenY, radius, color, isDead) {
  ctx.save();
  if (isDead) ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.stroke();
  ctx.restore();
}

function drawHealthBar(ctx, screenX, screenY, radius, ratio, tinted) {
  var w = radius * 2.4, h = 5;
  var x = screenX - w / 2, y = screenY - radius - 12;
  ctx.fillStyle = 'rgba(10,8,6,0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tinted || '#c53030';
  ctx.fillRect(x, y, w * Math.max(0, ratio), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.strokeRect(x, y, w, h);
}

Game.render = function () {
  if (!ctx || !Game.state.zone) return;
  var W = canvas.width, H = canvas.height;
  var zone = Game.state.zone;
  var player = Game.state.player;
  var TS = Game.TILE_SIZE;

  var camX = player.x - W / 2;
  var camY = player.y - H / 2;
  var zoneWpx = zone.def.width * TS, zoneHpx = zone.def.height * TS;
  camX = Math.max(0, Math.min(camX, Math.max(0, zoneWpx - W)));
  camY = Math.max(0, Math.min(camY, Math.max(0, zoneHpx - H)));
  Game.state.camera.x = camX; Game.state.camera.y = camY;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  var startCol = Math.max(0, Math.floor(camX / TS));
  var endCol = Math.min(zone.def.width - 1, Math.ceil((camX + W) / TS));
  var startRow = Math.max(0, Math.floor(camY / TS));
  var endRow = Math.min(zone.def.height - 1, Math.ceil((camY + H) / TS));

  for (var ty = startRow; ty <= endRow; ty++) {
    for (var tx = startCol; tx <= endCol; tx++) {
      var tile = zone.grid[ty][tx];
      ctx.fillStyle = TILE_COLORS[tile] || '#222';
      var sx = tx * TS - camX, sy = ty * TS - camY;
      ctx.fillRect(sx, sy, TS, TS);
      if (tile === 'grass' || tile === 'plaza') {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        if ((tx + ty) % 2 === 0) ctx.fillRect(sx, sy, TS, TS);
      }
    }
  }

  zone.def.portals.forEach(function (p) {
    var sx = p.x * TS - camX, sy = p.y * TS - camY;
    ctx.beginPath();
    ctx.arc(sx, sy, p.r * TS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212,175,106,0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(242,217,161,0.6)';
    ctx.stroke();
  });

  zone.def.npcs.forEach(function (npc) {
    var sx = npc.x * TS - camX, sy = npc.y * TS - camY;
    drawEntitySprite(ctx, npc, sx, sy, 14, npc.color, false);
    ctx.fillStyle = '#f2d9a1';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx, sy - 20);
  });

  Game.state.monsters.forEach(function (m) {
    if (m.dead && m.respawnAt) return;
    var sx = m.x - camX, sy = m.y - camY;
    if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return;
    drawEntitySprite(ctx, m, sx, sy, m.type.id === 'golem' ? 20 : 14, m.type.color, m.dead);
    if (!m.dead) {
      drawHealthBar(ctx, sx, sy, m.type.id === 'golem' ? 20 : 14, m.hp / m.type.hp);
      ctx.fillStyle = m === Game.state.target ? '#f2d9a1' : '#cbb98a';
      ctx.font = '11px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(m.type.name + ' Lv.' + m.type.level, sx, sy - (m.type.id === 'golem' ? 30 : 24));
    }
  });

  var psx = player.x - camX, psy = player.y - camY;
  drawEntitySprite(ctx, player, psx, psy, 15, player.color, player.hp <= 0);
  drawHealthBar(ctx, psx, psy, 15, player.hp / player.maxHp, '#4aa04a');
  ctx.fillStyle = '#f2d9a1';
  ctx.font = 'bold 12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, psx, psy - 24);
};

Game.renderMinimap = function () {
  var mc = document.getElementById('minimap');
  if (!mc || !Game.state.zone) return;
  var mctx = mc.getContext('2d');
  var zone = Game.state.zone;
  var scaleX = mc.width / (zone.def.width * Game.TILE_SIZE);
  var scaleY = mc.height / (zone.def.height * Game.TILE_SIZE);
  mctx.fillStyle = '#0a0806';
  mctx.fillRect(0, 0, mc.width, mc.height);

  var player = Game.state.player;
  mctx.fillStyle = '#4aa04a';
  mctx.beginPath();
  mctx.arc(player.x * scaleX, player.y * scaleY, 3, 0, Math.PI * 2);
  mctx.fill();

  Game.state.monsters.forEach(function (m) {
    if (m.dead) return;
    mctx.fillStyle = '#c53030';
    mctx.fillRect(m.x * scaleX - 1, m.y * scaleY - 1, 2, 2);
  });

  zone.def.portals.forEach(function (p) {
    mctx.fillStyle = 'rgba(242,217,161,0.8)';
    mctx.beginPath();
    mctx.arc(p.x * Game.TILE_SIZE * scaleX, p.y * Game.TILE_SIZE * scaleY, 3, 0, Math.PI * 2);
    mctx.fill();
  });
};

window.Game = Game;
})();
