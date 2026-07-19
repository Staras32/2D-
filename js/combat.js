/* Aden Chronicles - combat resolution: attacks, skills, damage application */
var Game = window.Game || {};
(function () {

function variance(base) {
  return base * (0.85 + Math.random() * 0.3);
}

function rollCrit() {
  return Math.random() < 0.10;
}

Game.applyDamageToMonster = function (m, rawDamage, now) {
  var dmg = Math.max(1, Math.round(rawDamage));
  m.hp -= dmg;
  Game.spawnFloatingText(m.x, m.y, '-' + dmg, '#ffcf5e');
  if (m.hp <= 0) {
    Game.killMonster(m, now);
  }
};

Game.applyDamageToPlayer = function (player, rawDamage) {
  var dmg = Math.max(1, Math.round(rawDamage));
  if (player.cp > 0) {
    var fromCp = Math.min(player.cp, dmg);
    player.cp -= fromCp;
    dmg -= fromCp;
  }
  if (dmg > 0) player.hp -= dmg;
  Game.spawnFloatingText(player.x, player.y, '-' + Math.max(1, Math.round(rawDamage)), '#ff6a6a');
  if (player.hp <= 0) {
    player.hp = 0;
    Game.onPlayerDeath();
  }
};

Game.monsterAttack = function (m, player) {
  var dmg = variance(m.type.pAtk - player.pDef * 0.4);
  Game.applyDamageToPlayer(player, dmg);
  Game.log(m.type.name + ' atakuoja ir padaro ' + Math.max(1, Math.round(dmg)) + ' žalos.', 'combat');
};

Game.playerBasicAttack = function (target, now) {
  var player = Game.state.player;
  var isMystic = player.archetypeId === 'mystic';
  var atkPower = isMystic ? player.mAtk * 0.7 : player.pAtk;
  var def = isMystic ? target.type.mDef : target.type.pDef;
  var dmg = variance(atkPower - def * 0.5);
  var crit = rollCrit();
  if (crit) dmg *= 1.8;
  Game.applyDamageToMonster(target, dmg, now);
  Game.log('Atakuoji ' + target.type.name + (crit ? ' (Kritinis!) ' : ' ') + '-' + Math.max(1, Math.round(dmg)) + ' žalos.', 'combat');
};

Game.getSkillCooldownRemaining = function (player, skillId, now) {
  var readyAt = player.cooldowns[skillId] || 0;
  return Math.max(0, readyAt - now);
};

Game.playerUseSkill = function (skillId, now) {
  var player = Game.state.player;
  var skill = Game.SKILLS[skillId];
  if (!skill) return;
  if (player.level < skill.minLevel) { Game.log('Įgūdis dar neatrakintas.', 'system'); return; }
  if (Game.getSkillCooldownRemaining(player, skillId, now) > 0) { Game.log('Įgūdis dar atsigauna.', 'system'); return; }
  if (player.mp < skill.mpCost) { Game.log('Nepakanka manos.', 'system'); return; }

  var target = Game.state.target;

  if (skill.type === 'physical' || skill.type === 'magic') {
    if (!target || target.dead) { Game.log('Nėra pasirinkto taikinio.', 'system'); return; }
    var d = dist(player.x, player.y, target.x, target.y);
    if (d > skill.range) { Game.log('Taikinys per toli.', 'system'); return; }
    player.mp -= skill.mpCost;
    player.cooldowns[skillId] = now + skill.cooldown;
    var atkPower = skill.type === 'magic' ? player.mAtk : player.pAtk;
    var def = skill.type === 'magic' ? target.type.mDef : target.type.pDef;
    var dmg = variance(atkPower * skill.power - def * 0.5);
    Game.applyDamageToMonster(target, dmg, now);
    Game.log('Panaudoji „' + skill.name + '“: -' + Math.max(1, Math.round(dmg)) + ' žalos.', 'combat');
  } else if (skill.type === 'heal') {
    player.mp -= skill.mpCost;
    player.cooldowns[skillId] = now + skill.cooldown;
    var healAmount = Math.round(player.mAtk * skill.power + player.stats.men);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    Game.spawnFloatingText(player.x, player.y, '+' + healAmount, '#6fe86f');
    Game.log('Panaudoji „' + skill.name + '“: atkurta ' + healAmount + ' HP.', 'combat');
  } else if (skill.type === 'buff_self') {
    player.mp -= skill.mpCost;
    player.cooldowns[skillId] = now + skill.cooldown;
    player.buffs[skill.stat] = { mult: skill.mult, expiresAt: now + skill.duration };
    Game.computeDerived(player);
    Game.log('Panaudoji „' + skill.name + '“.', 'combat');
  }
};

Game.updateBuffs = function (player, now) {
  var changed = false;
  Object.keys(player.buffs).forEach(function (key) {
    if (player.buffs[key].expiresAt <= now) {
      delete player.buffs[key];
      changed = true;
    }
  });
  if (changed) Game.computeDerived(player);
};

Game.onPlayerDeath = function () {
  Game.log('Žuvai kovoje... Grįžti į kaimą.', 'system');
  var player = Game.state.player;
  player.xp = Math.max(0, player.xp - Math.floor(Game.xpToNextLevel(player.level) * 0.05));
  Game.loadZone('village', Game.ZONES.village.playerSpawn.x, Game.ZONES.village.playerSpawn.y);
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.cp = player.maxCp;
};

function dist(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

window.Game = Game;
})();
