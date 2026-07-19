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

function shadeColor(hex, percent) {
  var f = parseInt(hex.slice(1), 16);
  var t = percent < 0 ? 0 : 255;
  var p = percent < 0 ? -percent : percent;
  var R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
  return '#' + (0x1000000 +
    (Math.round((t - R) * p) + R) * 0x10000 +
    (Math.round((t - G) * p) + G) * 0x100 +
    (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawShadow(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.ellipse(x, y + radius * 0.9, radius * 0.85, radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
}

/* ---------------- Pixel-art humanoid sprite ----------------
   Small (20x22) blocky sprite built from hard-edged rects, drawn to an
   offscreen bitmap with smoothing disabled and cached per (archetype,
   color, direction, frame) so the per-frame cost is just a drawImage
   blit. Reads as a classic indie top-down RPG sprite instead of a
   smooth vector blob. */
var PW = 20, PH = 22;
var pixelSpriteCache = {};

function paintPixelFigure(pctx, cloth, cloth2, archetypeId, facingDir, walkFrame) {
  var outline = '#1a130c';
  var hair = '#3a2a1a';
  var skin = '#e0b088';
  var pants = '#3a3226';
  var boot = '#1c1712';
  var belt = '#4a3826';

  var legShift = walkFrame === 1 ? 1 : 0;
  var showFace = facingDir !== 'up';

  var shapes = [];
  shapes.push({ x: 5, y: 0, w: 10, h: 4, c: hair });
  if (showFace) {
    shapes.push({ x: 6, y: 3, w: 8, h: 6, c: skin });
    shapes.push({ x: 5, y: 3, w: 1, h: 4, c: hair });
    shapes.push({ x: 14, y: 3, w: 1, h: 4, c: hair });
  } else {
    shapes.push({ x: 5, y: 3, w: 10, h: 6, c: hair });
  }
  shapes.push({ x: 2, y: 10 - legShift, w: 2, h: 5, c: cloth2 });
  shapes.push({ x: 16, y: 10 + legShift, w: 2, h: 5, c: cloth2 });
  shapes.push({ x: 4, y: 9, w: 12, h: 6, c: cloth });
  shapes.push({ x: 4, y: 9, w: 12, h: 2, c: cloth2 });
  shapes.push({ x: 4, y: 14, w: 12, h: 1, c: belt });
  shapes.push({ x: 6, y: 16 + legShift, w: 3, h: 4, c: pants });
  shapes.push({ x: 11, y: 16 - legShift, w: 3, h: 4, c: pants });
  shapes.push({ x: 6, y: 19 + legShift, w: 3, h: 2, c: boot });
  shapes.push({ x: 11, y: 19 - legShift, w: 3, h: 2, c: boot });

  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (o) {
    shapes.forEach(function (s) {
      pctx.fillStyle = outline;
      pctx.fillRect(s.x + o[0], s.y + o[1], s.w, s.h);
    });
  });
  shapes.forEach(function (s) {
    pctx.fillStyle = s.c;
    pctx.fillRect(s.x, s.y, s.w, s.h);
  });

  if (showFace) {
    pctx.fillStyle = outline;
    pctx.fillRect(8, 7, 1, 1);
    pctx.fillRect(11, 7, 1, 1);
  }

  if (archetypeId === 'mystic') {
    pctx.fillStyle = outline;
    pctx.fillRect(15, 1, 3, 11);
    pctx.fillStyle = '#7a5a35';
    pctx.fillRect(16, 2, 1, 9);
    pctx.fillStyle = outline;
    pctx.fillRect(14, -1, 5, 5);
    var orbGrad = pctx.createRadialGradient(16.5, 1.5, 0, 16.5, 1.5, 2.6);
    orbGrad.addColorStop(0, '#dff0ff');
    orbGrad.addColorStop(1, '#5a9ae0');
    pctx.fillStyle = orbGrad;
    pctx.beginPath(); pctx.arc(16.5, 1.5, 2.2, 0, Math.PI * 2); pctx.fill();
  } else {
    pctx.fillStyle = outline;
    pctx.fillRect(15, 8, 4, 2);
    pctx.fillRect(16, 2, 2, 7);
    pctx.fillStyle = '#8a6a3a';
    pctx.fillRect(15, 9, 3, 1);
    pctx.fillStyle = '#d9dfe6';
    pctx.fillRect(16.5, 3, 1, 6);
  }
}

function getPixelFigure(cloth, archetypeId, facingDir, walkFrame) {
  var key = cloth + '|' + archetypeId + '|' + facingDir + '|' + walkFrame;
  if (pixelSpriteCache[key]) return pixelSpriteCache[key];
  var off = document.createElement('canvas');
  off.width = PW; off.height = PH;
  var pctx = off.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  paintPixelFigure(pctx, cloth, shadeColor(cloth, -0.35), archetypeId, facingDir, walkFrame);
  pixelSpriteCache[key] = off;
  return off;
}

function facingToDir(facing) {
  var deg = facing;
  if (deg > -Math.PI * 0.75 && deg < -Math.PI * 0.25) return 'up';
  if (deg > Math.PI * 0.25 && deg < Math.PI * 0.75) return 'down';
  return 'side';
}

function drawHumanoid(ctx, x, y, radius, baseColor, archetypeId, facing, bob, isDead, isMoving, now) {
  var cx = x, cy = y - bob;
  ctx.save();
  if (isDead) ctx.globalAlpha = 0.35;
  drawShadow(ctx, x, y, radius);

  var dir = facingToDir(facing);
  var mirror = dir === 'side' && Math.cos(facing) < 0;
  var walkFrame = isMoving ? Math.floor((now || 0) * 6.5) % 2 : 0;
  var sprite = getPixelFigure(baseColor, archetypeId, dir, walkFrame);

  var scale = (radius * 2) / PW;
  var destW = PW * scale, destH = PH * scale;
  var prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(cx, cy - destH * 0.62);
  if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(sprite, -destW / 2, 0, destW, destH);
  ctx.restore();
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.restore();
}

/* Distinct silhouettes per monster type so the world doesn't read as
   uniform dots: a squat beast, a low wolf with a snout/tail, a spider
   with radiating legs, and a chunky glowing-core golem. */
function drawMonster(ctx, m, x, y, radius, facing, bob, isDead, now) {
  var cx = x, cy = y - bob;
  var color = m.type.color;
  var light = shadeColor(color, 0.22);
  var dark = shadeColor(color, -0.3);
  ctx.save();
  if (isDead) ctx.globalAlpha = 0.35;
  drawShadow(ctx, x, y, radius);

  if (m.type.id === 'skeleton') {
    drawHumanoid(ctx, x, y, radius, color, 'fighter', facing, bob, false, m.moving, now);
    ctx.restore();
    return;
  }

  if (m.type.id === 'spider') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
      var a = facing + Math.PI / 2 + (i - 1.5) * 0.35;
      for (var side = -1; side <= 1; side += 2) {
        var legAngle = a * side + (side < 0 ? Math.PI : 0);
        var lx = cx + Math.cos(a) * radius * 1.6 * side;
        var ly = cy + Math.sin(a) * radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + Math.cos(a) * radius * side, cy + Math.sin(a) * radius * 0.6, lx, ly);
        ctx.stroke();
      }
    }
    var grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    grad.addColorStop(0, light); grad.addColorStop(1, dark);
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 0.85, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    var hx = cx + Math.cos(facing) * radius * 0.6, hy = cy + Math.sin(facing) * radius * 0.5;
    ctx.beginPath(); ctx.ellipse(hx, hy, radius * 0.4, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = dark; ctx.fill();
    ctx.fillStyle = '#c53030';
    ctx.beginPath(); ctx.arc(hx + Math.cos(facing) * 3 - 2, hy + Math.sin(facing) * 3, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + Math.cos(facing) * 3 + 2, hy + Math.sin(facing) * 3, 1.3, 0, Math.PI * 2); ctx.fill();
  } else if (m.type.id === 'wolf' || m.type.id === 'keltir') {
    var tailA = facing + Math.PI;
    ctx.strokeStyle = dark; ctx.lineWidth = radius * 0.28; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(tailA) * radius * 0.7, cy + Math.sin(tailA) * radius * 0.4);
    ctx.lineTo(cx + Math.cos(tailA) * radius * 1.4, cy + Math.sin(tailA) * radius * 0.9 - radius * 0.3);
    ctx.stroke();

    var bodyGrad = ctx.createLinearGradient(cx, cy - radius * 0.6, cx, cy + radius * 0.6);
    bodyGrad.addColorStop(0, light); bodyGrad.addColorStop(1, dark);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(facing);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (m.type.id === 'wolf' ? 1.1 : 0.85), radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(radius * 0.7, -radius * 0.3);
    ctx.lineTo(radius * 1.5, 0);
    ctx.lineTo(radius * 0.7, radius * 0.3);
    ctx.closePath();
    ctx.fillStyle = dark;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#14100c';
    ctx.beginPath(); ctx.arc(radius * 1.3, 0, 1.4, 0, Math.PI * 2); ctx.fill();

    var earSize = radius * 0.32;
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(radius * 0.1, s * radius * 0.55);
      ctx.lineTo(radius * 0.1 + earSize, s * (radius * 0.55 + earSize));
      ctx.lineTo(radius * 0.1 - earSize * 0.4, s * (radius * 0.55 + earSize * 0.35));
      ctx.closePath();
      ctx.fillStyle = dark;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = '#c53030';
    ctx.beginPath(); ctx.arc(radius * 0.85, -radius * 0.15, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(radius * 0.85, radius * 0.15, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    var s = radius * 1.15;
    ctx.save();
    ctx.translate(cx, cy);
    var blockGrad = ctx.createLinearGradient(0, -s, 0, s);
    blockGrad.addColorStop(0, light); blockGrad.addColorStop(1, dark);
    roundRect(ctx, -s, -s * 0.9, s * 2, s * 1.8, s * 0.35);
    ctx.fillStyle = blockGrad;
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.6); ctx.lineTo(-s * 0.1, s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.4); ctx.lineTo(s * 0.2, s * 0.6); ctx.stroke();
    var coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.45);
    coreGrad.addColorStop(0, '#ffdca0');
    coreGrad.addColorStop(1, 'rgba(255,150,40,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawHealthBar(ctx, screenX, screenY, radius, ratio, tinted) {
  var w = radius * 2.4, h = 5;
  var x = screenX - w / 2, y = screenY - radius * 1.7 - 8;
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

  var now = performance.now() / 1000;

  zone.def.npcs.forEach(function (npc) {
    var sx = npc.x * TS - camX, sy = npc.y * TS - camY;
    drawHumanoid(ctx, sx, sy, 16, npc.color, npc.weaponless ? 'mystic' : 'fighter', Math.PI / 2, 0, false, false, now);
    ctx.fillStyle = '#f2d9a1';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx, sy - 16 * 1.7 - 12);
  });

  Game.state.monsters.forEach(function (m) {
    if (m.dead && m.respawnAt) return;
    var sx = m.x - camX, sy = m.y - camY;
    if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return;
    var radius = m.type.id === 'golem' ? 22 : 16;
    var bob = (!m.dead && m.moving && m.type.id !== 'skeleton') ? Math.sin(now * 9 + m.uid.length) * radius * 0.08 : 0;
    drawMonster(ctx, m, sx, sy, radius, m.facing || 0, bob, m.dead, now);
    if (!m.dead) {
      drawHealthBar(ctx, sx, sy, radius, m.hp / m.type.hp);
      ctx.fillStyle = m === Game.state.target ? '#f2d9a1' : '#cbb98a';
      ctx.font = '11px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(m.type.name + ' Lv.' + m.type.level, sx, sy - radius * 1.7 - 12);
    }
  });

  var psx = player.x - camX, psy = player.y - camY;
  var pRadius = 17;
  drawHumanoid(ctx, psx, psy, pRadius, player.color, player.archetypeId, player.facing || Math.PI / 2, 0, player.hp <= 0, player.moving, now);
  drawHealthBar(ctx, psx, psy, pRadius, player.hp / player.maxHp, '#4aa04a');
  ctx.fillStyle = '#f2d9a1';
  ctx.font = 'bold 12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, psx, psy - pRadius * 1.7 - 12);
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
