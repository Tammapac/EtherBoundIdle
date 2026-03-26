import base44 from '@/api/base44Client';
import { supabaseSync } from '@/lib/supabaseSync';

const TICK_INTERVALS = {
  fight: 4000,
  lifeSkills: 20000,
  gemLab: 30000,
  shopRotation: 60000,
  guildBoss: 30000,
  save: 15000,
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
let _intervals = {};
let _running = false;
let _lastFightEnemy = null;
let _fightPaused = false;
let _lifeSkillsPaused = false;
let _inFlight = { fight: false, lifeSkills: false, gemLab: false, guildBoss: false, save: false };

function getCharacter() {
  try {
    const raw = localStorage.getItem('eb_Character');
    const chars = raw ? JSON.parse(raw) : [];
    return chars.find(c => c.id === _characterId) || null;
  } catch { return null; }
}

function updateCharacter(updates) {
  try {
    const raw = localStorage.getItem('eb_Character');
    let chars = raw ? JSON.parse(raw) : [];
    const idx = chars.findIndex(c => c.id === _characterId);
    if (idx === -1) return null;
    chars[idx] = { ...chars[idx], ...updates };
    localStorage.setItem('eb_Character', JSON.stringify(chars));
    return chars[idx];
  } catch { return null; }
}

async function fightTick() {
  if (_fightPaused || !_characterId || _inFlight.fight) return;
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
    const res = await base44.functions.invoke('fight', {
      characterId: _characterId,
      enemyKey,
      regionKey: region,
      _fallbackCharacter: char,
    });
    const result = res?.data;
    if (result?.success) {
      emit('fightResult', {
        enemyKey,
        rewards: result.rewards,
        loot: result.loot,
        levelsGained: result.levelsGained,
        character: result.character,
      });

      if (supabaseSync.isEnabled()) {
        supabaseSync.storeTimestamp(_characterId, 'last_idle_fight', Date.now()).catch(() => {});
      }
    }
  } catch {}
}

async function lifeSkillsTick() {
  if (_lifeSkillsPaused || !_characterId || _inFlight.lifeSkills) return;
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
    const res = await base44.functions.invoke('lifeSkills', {
      characterId: _characterId,
      action: 'tick',
      skillType: activeSkill,
    });
    const result = res?.data;
    if (result?.success) {
      emit('lifeSkillTick', {
        skillType: activeSkill,
        resources: result.resources,
        leveled_up: result.leveled_up,
        new_level: result.new_level,
      });

      if (supabaseSync.isEnabled()) {
        supabaseSync.storeTimestamp(_characterId, 'last_lifeskill_tick', Date.now()).catch(() => {});
      }
    }
  } catch {}
}

async function gemLabTick() {
  if (!_characterId || _inFlight.gemLab) return;
  _inFlight.gemLab = true;
  try {
    const res = await base44.functions.invoke('processGemLab', {
      characterId: _characterId,
    });
    const result = res?.data;
    if (result?.success) {
      emit('gemLabTick', {
        gemsGenerated: result.gemsGenerated,
        gemsPerCycle: result.gemsPerCycle,
        cycleSeconds: result.cycleSeconds,
        offlineHours: result.offlineHours,
      });

      if (result.gemsGenerated > 0 && supabaseSync.isEnabled()) {
        supabaseSync.storeTimestamp(_characterId, 'gem_lab_last_collection', Date.now()).catch(() => {});
      }
    }
  } catch {} finally { _inFlight.gemLab = false; }
}

async function shopRotationTick() {
  if (!_characterId) return;
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

  if (supabaseSync.isEnabled()) {
    supabaseSync.storeTimestamp(_characterId, 'shop_rotation_seed', currentSeed).catch(() => {});
  }
}

const BOSS_MAX_ATTACKS = 10;
const BOSS_WINDOW_MS = 8 * 60 * 60 * 1000;

function getBossAttackData(characterId) {
  try {
    const raw = localStorage.getItem(`eb_guild_boss_attacks_${characterId}`);
    if (!raw) return { attacks: [], windowStart: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (now - (data.windowStart || 0) >= BOSS_WINDOW_MS) {
      return { attacks: [], windowStart: now };
    }
    return data;
  } catch { return { attacks: [], windowStart: Date.now() }; }
}

async function guildBossTick() {
  if (!_characterId) return;
  try {
    const data = getBossAttackData(_characterId);
    const now = Date.now();
    const windowRemaining = Math.max(0, BOSS_WINDOW_MS - (now - (data.windowStart || 0)));
    const attacksUsed = data.attacks.length;
    const attacksLeft = Math.max(0, BOSS_MAX_ATTACKS - attacksUsed);

    emit('guildBossStatus', {
      ready: attacksLeft > 0,
      attacksUsed,
      attacksLeft,
      maxAttacks: BOSS_MAX_ATTACKS,
      windowRemaining,
      windowFormatted: attacksLeft > 0 ? `${attacksLeft}/${BOSS_MAX_ATTACKS} attacks left` : `Resets in ${formatTime(windowRemaining)}`,
    });
  } catch {}
}

async function saveTick() {
  if (!_characterId || _inFlight.save) return;
  _inFlight.save = true;
  try {
    const char = getCharacter();
    if (!char) return;
    if (supabaseSync.isEnabled()) {
      supabaseSync.syncCharacter(char).catch(() => {});
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
  start(characterId) {
    if (_running && _characterId === characterId) return;
    this.stop();
    _characterId = characterId;
    _running = true;
    _fightPaused = false;
    _lifeSkillsPaused = false;

    fightTick();
    lifeSkillsTick();
    gemLabTick();
    shopRotationTick();
    guildBossTick();

    _intervals.fight = setInterval(fightTick, TICK_INTERVALS.fight);
    _intervals.lifeSkills = setInterval(lifeSkillsTick, TICK_INTERVALS.lifeSkills);
    _intervals.gemLab = setInterval(gemLabTick, TICK_INTERVALS.gemLab);
    _intervals.shopRotation = setInterval(shopRotationTick, TICK_INTERVALS.shopRotation);
    _intervals.guildBoss = setInterval(guildBossTick, TICK_INTERVALS.guildBoss);
    _intervals.save = setInterval(saveTick, TICK_INTERVALS.save);

    emit('started', { characterId });
  },

  stop() {
    _running = false;
    for (const key of Object.keys(_intervals)) {
      clearInterval(_intervals[key]);
    }
    _intervals = {};
    _characterId = null;
    _inFlight = { fight: false, lifeSkills: false, gemLab: false, guildBoss: false, save: false };
    emit('stopped', {});
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

  recordGuildBossAttack(characterId) {
    const now = Date.now();
    const data = getBossAttackData(characterId);
    if (data.attacks.length === 0 || now - (data.windowStart || 0) >= BOSS_WINDOW_MS) {
      data.windowStart = now;
      data.attacks = [now];
    } else {
      data.attacks.push(now);
    }
    localStorage.setItem(`eb_guild_boss_attacks_${characterId}`, JSON.stringify(data));
    if (supabaseSync.isEnabled()) {
      supabaseSync.recordBossAttack(characterId).catch(() => {});
    }
    const attacksLeft = Math.max(0, BOSS_MAX_ATTACKS - data.attacks.length);
    const windowRemaining = Math.max(0, BOSS_WINDOW_MS - (now - data.windowStart));
    emit('guildBossStatus', {
      ready: attacksLeft > 0,
      attacksUsed: data.attacks.length,
      attacksLeft,
      maxAttacks: BOSS_MAX_ATTACKS,
      windowRemaining,
      windowFormatted: attacksLeft > 0 ? `${attacksLeft}/${BOSS_MAX_ATTACKS} attacks left` : `Resets in ${formatTime(windowRemaining)}`,
    });
  },

  getBossAttackStatus(characterId) {
    const data = getBossAttackData(characterId);
    const now = Date.now();
    const windowRemaining = Math.max(0, BOSS_WINDOW_MS - (now - (data.windowStart || 0)));
    const attacksLeft = Math.max(0, BOSS_MAX_ATTACKS - data.attacks.length);
    return {
      ready: attacksLeft > 0,
      attacksUsed: data.attacks.length,
      attacksLeft,
      maxAttacks: BOSS_MAX_ATTACKS,
      windowRemaining,
      windowFormatted: attacksLeft > 0 ? `${attacksLeft}/${BOSS_MAX_ATTACKS} attacks left` : `Resets in ${formatTime(windowRemaining)}`,
    };
  },

  async validateGuildBossAttack(characterId) {
    if (supabaseSync.isEnabled()) {
      try {
        const serverResult = await supabaseSync.validateBossAttackLimit(characterId);
        if (!serverResult.valid) {
          return {
            ready: false,
            attacksUsed: serverResult.attacksUsed,
            attacksLeft: 0,
            maxAttacks: BOSS_MAX_ATTACKS,
            windowRemaining: serverResult.windowRemaining || 0,
            windowFormatted: `Resets in ${formatTime(serverResult.windowRemaining || 0)}`,
          };
        }
        return {
          ready: true,
          attacksUsed: serverResult.attacksUsed || 0,
          attacksLeft: serverResult.attacksLeft || BOSS_MAX_ATTACKS,
          maxAttacks: BOSS_MAX_ATTACKS,
          windowRemaining: serverResult.windowRemaining || 0,
          windowFormatted: `${serverResult.attacksLeft || BOSS_MAX_ATTACKS}/${BOSS_MAX_ATTACKS} attacks left`,
        };
      } catch {}
    }
    return this.getBossAttackStatus(characterId);
  },

  async validateWithSupabase(characterId, key) {
    if (!supabaseSync.isEnabled()) return null;
    return supabaseSync.getTimestamp(characterId, key);
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
