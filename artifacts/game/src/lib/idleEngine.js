import base44 from '@/api/base44Client';

const TICK_INTERVALS = {
  fight: 120000,
  lifeSkills: 300000,
  gemLab: 300000,
  shopRotation: 300000,
  guildBoss: 600000,
  save: 300000,
  presence: 600000,
};

const listeners = {};

function emit(event, data) {
  const cbs = listeners[event];
  if (!cbs) return;
  for (const cb of cbs) {
    try { cb(data); } catch {}
  }
}

let _characterId = null;
let _characterData = null;
let _intervals = {};
let _running = false;
let _lastFightEnemy = null;
let _fightPaused = false;
let _lifeSkillsPaused = false;
let _inFlight = { fight: false, lifeSkills: false, gemLab: false, guildBoss: false, save: false, presence: false };
let _visibilityHandler = null;

function getCharacter() {
  return _characterData;
}

function _isBackgroundTab() {
  return typeof document !== 'undefined' && document.visibilityState !== 'visible';
}

async function fightTick() {
  if (_isBackgroundTab() || _fightPaused || !_characterId || _inFlight.fight) return;
  _inFlight.fight = true;
  try { await _fightTickInner(); } finally { _inFlight.fight = false; }
}
async function _fightTickInner() {
  const char = getCharacter();
  if (!char || !char.idle_mode) return;

  const region = char.current_region || 'enchanted_forest';
  let enemyKeys;
  try {
    const { REGIONS, ENEMIES } = await import('@/lib/gameData');
    const regionData = REGIONS?.[region];
    enemyKeys = regionData?.enemies || Object.keys(ENEMIES || {}).slice(0, 3);
    if (!enemyKeys.length) return;
  } catch { return; }

  const enemyKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
  _lastFightEnemy = enemyKey;

  try {
    const result = await base44.functions.invoke('fight', {
      characterId: _characterId,
      enemyKey,
      regionKey: region,
    });
    if (result) {
      // Merge minimal delta into local character data (no full character sync)
      if (result.delta) {
        _characterData = { ..._characterData, ...result.delta };
      } else if (result.character) {
        _characterData = result.character;
      }
      emit('fightResult', {
        enemyKey,
        rewards: result.rewards,
        loot: result.loot,
        levelsGained: result.levelsGained,
        character: _characterData,
      });
    }
  } catch {}
}

async function lifeSkillsTick() {
  if (_isBackgroundTab() || _lifeSkillsPaused || !_characterId || _inFlight.lifeSkills) return;
  _inFlight.lifeSkills = true;
  try { await _lifeSkillsTickInner(); } finally { _inFlight.lifeSkills = false; }
}
async function _lifeSkillsTickInner() {
  const char = getCharacter();
  if (!char) return;

  const lifeSkills = char.life_skills || {};
  const SKILL_TYPES = ['mining', 'fishing', 'herbalism'];
  const activeSkill = SKILL_TYPES.find(s => lifeSkills[s]?.is_active);
  if (!activeSkill) return;

  try {
    const result = await base44.functions.invoke('lifeSkills', {
      characterId: _characterId,
      action: 'tick',
      skillType: activeSkill,
    });
    if (result?.success !== false) {
      emit('lifeSkillTick', {
        skillType: activeSkill,
        resources: result.resources,
        leveled_up: result.leveled_up,
        new_level: result.new_level,
      });
    }
  } catch {}
}

async function gemLabTick() {
  if (_isBackgroundTab() || !_characterId || _inFlight.gemLab) return;
  _inFlight.gemLab = true;
  try {
    const result = await base44.functions.invoke('processGemLab', {
      characterId: _characterId,
    });
    if (result) {
      emit('gemLabTick', {
        gemsGenerated: result.gemsGenerated,
        gemsPerCycle: result.gemsPerCycle,
        cycleSeconds: result.cycleSeconds,
        offlineHours: result.offlineHours,
      });
    }
  } catch {} finally { _inFlight.gemLab = false; }
}

let _presenceId = null;
async function presenceTick() {
  if (_isBackgroundTab() || !_characterId || _inFlight.presence) return;
  _inFlight.presence = true;
  try {
    const char = getCharacter();
    if (!char) return;
    const status = char.idle_mode ? "idle" : "online";
    const zone = char.current_region || "enchanted_forest";
    if (_presenceId) {
      await base44.entities.Presence.update(_presenceId, {
        status, current_zone: zone, character_level: char.level,
      });
    } else {
      const existing = await base44.entities.Presence.filter({ character_id: _characterId });
      if (existing.length > 0) {
        _presenceId = existing[0].id;
        await base44.entities.Presence.update(_presenceId, {
          status, current_zone: zone, character_level: char.level,
        });
      } else {
        const created = await base44.entities.Presence.create({
          character_id: _characterId,
          character_name: char.name,
          character_class: char.class,
          character_level: char.level,
          status, current_zone: zone,
        });
        _presenceId = created.id;
      }
    }
  } catch {} finally { _inFlight.presence = false; }
}

async function shopRotationTick() {
  if (_isBackgroundTab() || !_characterId) return;
  const ROTATION_MS = 4 * 60 * 60 * 1000;
  const now = Date.now();
  const currentSeed = Math.floor(now / ROTATION_MS);
  const nextRefreshAt = (currentSeed + 1) * ROTATION_MS;
  const timeLeft = nextRefreshAt - now;

  emit('shopRotation', {
    seed: currentSeed,
    nextRefreshAt: new Date(nextRefreshAt).toISOString(),
    timeLeftMs: timeLeft,
    timeLeftFormatted: formatTime(timeLeft),
  });
}

const BOSS_MAX_ATTACKS = 10;

async function guildBossTick() {
  if (_isBackgroundTab() || !_characterId) return;
  try {
    const result = await base44.functions.invoke('guildBossAttack', {
      characterId: _characterId,
      action: 'status',
    });
    const attacksLeft = result.attacksLeft ?? 0;
    const windowRemaining = result.windowRemaining ?? 0;
    emit('guildBossStatus', {
      ready: attacksLeft > 0,
      attacksUsed: result.attacksUsed ?? 0,
      attacksLeft,
      maxAttacks: result.maxAttacks ?? BOSS_MAX_ATTACKS,
      windowRemaining,
      windowFormatted: attacksLeft > 0
        ? `${attacksLeft}/${result.maxAttacks ?? BOSS_MAX_ATTACKS} attacks left`
        : `Resets in ${formatTime(windowRemaining)}`,
    });
  } catch {}
}

async function saveTick() {
  if (_isBackgroundTab() || !_characterId || _inFlight.save) return;
  _inFlight.save = true;
  try {
    const char = getCharacter();
    if (char?.id) {
      try {
        const data = {};
        // MINIMAL save — only fields that the client controls directly.
        // Combat stats (gold, exp, gems, level, hp, mp, strength, etc.) are
        // updated server-side by fight/lifeSkills/shop handlers and synced back
        // via their responses.  Saving stale cached copies here overwrites
        // server-side changes (e.g. offline progression rewards, life-skill
        // upgrades, shop purchases).
        const fields = [
          'current_region', 'idle_mode',
          'total_kills', 'total_damage',
        ];
        fields.forEach(f => { if (char[f] !== undefined) data[f] = char[f]; });
        await base44.entities.Character.update(char.id, data);
      } catch {}
    }
    emit('autoSave', { timestamp: Date.now() });
  } finally { _inFlight.save = false; }
}

function formatTime(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const idleEngine = {
  start(characterId, characterData = null) {
    if (_running && _characterId === characterId) return;
    this.stop();
    _characterId = characterId;
    _characterData = characterData;
    _running = true;
    _fightPaused = false;
    _lifeSkillsPaused = false;

    fightTick();
    lifeSkillsTick();
    gemLabTick();
    shopRotationTick();
    guildBossTick();
    presenceTick();

    _intervals.fight = setInterval(fightTick, TICK_INTERVALS.fight);
    _intervals.lifeSkills = setInterval(lifeSkillsTick, TICK_INTERVALS.lifeSkills);
    _intervals.gemLab = setInterval(gemLabTick, TICK_INTERVALS.gemLab);
    _intervals.shopRotation = setInterval(shopRotationTick, TICK_INTERVALS.shopRotation);
    _intervals.guildBoss = setInterval(guildBossTick, TICK_INTERVALS.guildBoss);
    _intervals.save = setInterval(saveTick, TICK_INTERVALS.save);
    _intervals.presence = setInterval(presenceTick, TICK_INTERVALS.presence);

    // Only emit event on tab resume — do NOT re-trigger server calls
    // (the intervals will fire on their own schedule)
    if (_visibilityHandler) document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = () => {
      if (document.visibilityState === 'visible' && _running) {
        shopRotationTick(); // local-only, no server call
        emit('tabResumed', { characterId: _characterId });
      }
    };
    document.addEventListener('visibilitychange', _visibilityHandler);

    emit('started', { characterId });
  },

  stop() {
    _running = false;
    for (const key of Object.keys(_intervals)) {
      clearInterval(_intervals[key]);
    }
    _intervals = {};
    if (_visibilityHandler) {
      document.removeEventListener('visibilitychange', _visibilityHandler);
      _visibilityHandler = null;
    }
    _characterId = null;
    _characterData = null;
    _inFlight = { fight: false, lifeSkills: false, gemLab: false, guildBoss: false, save: false, presence: false };
    _presenceId = null;
    emit('stopped', {});
  },

  setCharacterData(data) {
    if (data) {
      _characterData = { ..._characterData, ...data };
    }
  },

  isRunning() { return _running; },
  getCharacterId() { return _characterId; },

  pauseFight() { _fightPaused = true; },
  resumeFight() { _fightPaused = false; },
  isFightPaused() { return _fightPaused; },

  pauseLifeSkills() { _lifeSkillsPaused = true; },
  resumeLifeSkills() { _lifeSkillsPaused = false; },

  on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => {
      listeners[event] = listeners[event].filter(fn => fn !== cb);
    };
  },

  off(event, cb) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(fn => fn !== cb);
  },

  async recordGuildBossAttack(characterId) {
    try {
      const result = await base44.functions.invoke('guildBossAttack', {
        characterId,
        action: 'record',
      });
      const attacksLeft = result.attacksLeft ?? 0;
      const windowRemaining = result.windowRemaining ?? 0;
      emit('guildBossStatus', {
        ready: attacksLeft > 0,
        attacksUsed: result.attacksUsed ?? 0,
        attacksLeft,
        maxAttacks: result.maxAttacks ?? BOSS_MAX_ATTACKS,
        windowRemaining,
        windowFormatted: attacksLeft > 0
          ? `${attacksLeft}/${result.maxAttacks ?? BOSS_MAX_ATTACKS} attacks left`
          : `Resets in ${formatTime(windowRemaining)}`,
      });
      return result;
    } catch (e) {
      console.warn('[GuildBoss] record failed:', e.message);
      return { ready: false, attacksLeft: 0 };
    }
  },

  async getBossAttackStatus(characterId) {
    try {
      const result = await base44.functions.invoke('guildBossAttack', {
        characterId,
        action: 'status',
      });
      const attacksLeft = result.attacksLeft ?? 0;
      const windowRemaining = result.windowRemaining ?? 0;
      return {
        ready: attacksLeft > 0,
        attacksUsed: result.attacksUsed ?? 0,
        attacksLeft,
        maxAttacks: result.maxAttacks ?? BOSS_MAX_ATTACKS,
        windowRemaining,
        windowFormatted: attacksLeft > 0
          ? `${attacksLeft}/${result.maxAttacks ?? BOSS_MAX_ATTACKS} attacks left`
          : `Resets in ${formatTime(windowRemaining)}`,
      };
    } catch {
      return { ready: false, attacksUsed: 0, attacksLeft: 0, maxAttacks: BOSS_MAX_ATTACKS, windowRemaining: 0 };
    }
  },

  async validateGuildBossAttack(characterId) {
    return this.getBossAttackStatus(characterId);
  },

  triggerFightNow() {
    if (_running) fightTick();
  },
  triggerLifeSkillNow() {
    if (_running) lifeSkillsTick();
  },
  triggerGemLabNow() {
    if (_running) gemLabTick();
  },
};

export default idleEngine;
export { idleEngine };
