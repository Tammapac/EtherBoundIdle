const MODE_KEY = 'eb_connection_mode';
const API_URL_KEY = 'eb_api_url';

function getMode() {
  try { return localStorage.getItem(MODE_KEY) || 'local'; } catch { return 'local'; }
}

function setMode(mode) {
  try { localStorage.setItem(MODE_KEY, mode); } catch {}
}

function getApiUrl() {
  try { return localStorage.getItem(API_URL_KEY) || ''; } catch { return ''; }
}

function setApiUrl(url) {
  try { localStorage.setItem(API_URL_KEY, url); } catch {}
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const subscribers = {};

function notifySubscribers(entityName, event) {
  const subs = subscribers[entityName];
  if (!subs) return;
  for (const cb of subs) {
    try { cb(event); } catch {}
  }
}

function getStore(entityName) {
  const key = `eb_${entityName}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStore(entityName, data) {
  const key = `eb_${entityName}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function matchesFilter(record, filter) {
  for (const [key, value] of Object.entries(filter)) {
    const recordVal = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$in' in value) {
        if (!value.$in.includes(recordVal)) return false;
      }
      if ('$ne' in value) {
        if (recordVal === value.$ne) return false;
      }
      if ('$gt' in value) {
        if (!(recordVal > value.$gt)) return false;
      }
      if ('$lt' in value) {
        if (!(recordVal < value.$lt)) return false;
      }
      if ('$gte' in value) {
        if (!(recordVal >= value.$gte)) return false;
      }
      if ('$lte' in value) {
        if (!(recordVal <= value.$lte)) return false;
      }
    } else {
      if (recordVal !== value) return false;
    }
  }
  return true;
}

function applySortAndLimit(records, sort, limit) {
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    records.sort((a, b) => {
      const av = a[camel] ?? a[field] ?? '';
      const bv = b[camel] ?? b[field] ?? '';
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  if (limit) records = records.slice(0, Number(limit));
  return records;
}

function createLocalEntityProxy(entityName) {
  return {
    async create(data) {
      const records = getStore(entityName);
      const now = new Date().toISOString();
      const record = {
        id: generateId(),
        ...data,
        created_date: now,
        updated_date: now,
        createdAt: now,
        updatedAt: now,
      };
      records.push(record);
      setStore(entityName, records);
      notifySubscribers(entityName, { type: 'create', id: record.id, data: record });
      return record;
    },

    async get(id) {
      const records = getStore(entityName);
      const record = records.find(r => r.id === id);
      if (!record) throw new Error(`${entityName} not found: ${id}`);
      return record;
    },

    async filter(query = {}, sort, limit) {
      let records = getStore(entityName);
      if (query && Object.keys(query).length) {
        records = records.filter(r => matchesFilter(r, query));
      }
      return applySortAndLimit([...records], sort, limit);
    },

    async list(sort, limit) {
      const records = getStore(entityName);
      return applySortAndLimit([...records], sort, limit);
    },

    async update(id, data) {
      const records = getStore(entityName);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`${entityName} not found: ${id}`);
      const now = new Date().toISOString();
      records[idx] = { ...records[idx], ...data, updated_date: now, updatedAt: now };
      setStore(entityName, records);
      notifySubscribers(entityName, { type: 'update', id, data: records[idx] });
      return records[idx];
    },

    async delete(id) {
      let records = getStore(entityName);
      records = records.filter(r => r.id !== id);
      setStore(entityName, records);
      notifySubscribers(entityName, { type: 'delete', id });
      return { success: true };
    },

    subscribe(callback) {
      if (!subscribers[entityName]) subscribers[entityName] = new Set();
      subscribers[entityName].add(callback);

      let active = true;
      let timeout;
      const poll = () => {
        if (!active) return;
        try { callback({ type: 'poll' }); } catch {}
        timeout = setTimeout(poll, 30000);
      };
      timeout = setTimeout(poll, 30000);

      return () => {
        active = false;
        if (timeout) clearTimeout(timeout);
        subscribers[entityName]?.delete(callback);
      };
    },
  };
}

async function apiFetch(path, options = {}) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/api${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

function createRemoteEntityProxy(entityName) {
  return {
    async create(data) {
      return apiFetch(`/entities/${entityName}`, { method: 'POST', body: JSON.stringify(data) });
    },
    async get(id) {
      return apiFetch(`/entities/${entityName}/${id}`);
    },
    async filter(query = {}, sort, limit) {
      const params = new URLSearchParams();
      if (query && Object.keys(query).length) params.set('filter', JSON.stringify(query));
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return apiFetch(`/entities/${entityName}${qs ? '?' + qs : ''}`);
    },
    async list(sort, limit) {
      return this.filter({}, sort, limit);
    },
    async update(id, data) {
      return apiFetch(`/entities/${entityName}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async delete(id) {
      return apiFetch(`/entities/${entityName}/${id}`, { method: 'DELETE' });
    },
    subscribe(callback) {
      if (!subscribers[entityName]) subscribers[entityName] = new Set();
      subscribers[entityName].add(callback);
      let active = true;
      let timeout;
      const poll = () => {
        if (!active) return;
        try { callback({ type: 'poll' }); } catch {}
        timeout = setTimeout(poll, 15000);
      };
      timeout = setTimeout(poll, 15000);
      return () => {
        active = false;
        if (timeout) clearTimeout(timeout);
        subscribers[entityName]?.delete(callback);
      };
    },
  };
}

const entityNames = [
  'Character', 'Item', 'Guild', 'Quest', 'Trade',
  'Party', 'PartyActivity', 'PartyInvite', 'Presence',
  'PlayerSession', 'ChatMessage', 'Mail', 'Resource',
  'FriendRequest', 'Friendship', 'TradeSession',
  'DungeonSession', 'GemLab', 'PrivateMessage',
];

const localProxies = {};
const remoteProxies = {};
entityNames.forEach(name => {
  localProxies[name] = createLocalEntityProxy(name);
  remoteProxies[name] = createRemoteEntityProxy(name);
});

function createHybridEntityProxy(entityName) {
  const methods = ['create', 'get', 'filter', 'list', 'update', 'delete', 'subscribe'];
  const proxy = {};
  methods.forEach(method => {
    proxy[method] = (...args) => {
      const driver = getMode() === 'server' ? remoteProxies[entityName] : localProxies[entityName];
      return driver[method](...args);
    };
  });
  return proxy;
}

const entities = {};
entityNames.forEach(name => {
  entities[name] = createHybridEntityProxy(name);
});

function getLocalUser() {
  try {
    const raw = localStorage.getItem('eb_local_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const LIFE_SKILL_DROPS = {
  mining: [
    { resource: 'iron_ore', label: 'Iron Ore', rarity: 'common', weight: 60 },
    { resource: 'copper_ore', label: 'Copper Ore', rarity: 'uncommon', weight: 25 },
    { resource: 'silver_ore', label: 'Silver Ore', rarity: 'rare', weight: 10 },
    { resource: 'gold_ore', label: 'Gold Ore', rarity: 'epic', weight: 3.5 },
    { resource: 'platinum_ore', label: 'Platinum Ore', rarity: 'legendary', weight: 1 },
    { resource: 'void_ore', label: 'Void Ore', rarity: 'mythic', weight: 0.4 },
    { resource: 'crystal_ore', label: 'Crystal Ore', rarity: 'shiny', weight: 0.1 },
  ],
  fishing: [
    { resource: 'carp', label: 'Carp', rarity: 'common', weight: 60 },
    { resource: 'salmon', label: 'Salmon', rarity: 'uncommon', weight: 25 },
    { resource: 'tuna', label: 'Tuna', rarity: 'rare', weight: 10 },
    { resource: 'swordfish', label: 'Swordfish', rarity: 'epic', weight: 3.5 },
    { resource: 'dragonfish', label: 'Dragonfish', rarity: 'legendary', weight: 1 },
    { resource: 'leviathan_fish', label: 'Leviathan Fish', rarity: 'mythic', weight: 0.4 },
    { resource: 'golden_fish', label: 'Golden Fish', rarity: 'shiny', weight: 0.1 },
  ],
  herbalism: [
    { resource: 'common_herb', label: 'Common Herb', rarity: 'common', weight: 60 },
    { resource: 'greenleaf', label: 'Greenleaf', rarity: 'uncommon', weight: 25 },
    { resource: 'blue_herb', label: 'Blue Herb', rarity: 'rare', weight: 10 },
    { resource: 'shadow_herb', label: 'Shadow Herb', rarity: 'epic', weight: 3.5 },
    { resource: 'sun_blossom', label: 'Sun Blossom', rarity: 'legendary', weight: 1 },
    { resource: 'ether_plant', label: 'Ether Plant', rarity: 'mythic', weight: 0.4 },
    { resource: 'spirit_herb', label: 'Spirit Herb', rarity: 'shiny', weight: 0.1 },
  ],
};

const PROCESSING_RECIPES = {
  smelting: {
    icon: '🔥', label: 'Smelting', description: 'Smelt ores into bars',
    requires_skill: 'mining', requires_level: 30,
    recipes: [
      { input: 'iron_ore', input_label: 'Iron Ore', output: 'iron_bar', output_label: 'Iron Bar', rarity: 'common' },
      { input: 'copper_ore', input_label: 'Copper Ore', output: 'copper_bar', output_label: 'Copper Bar', rarity: 'uncommon' },
      { input: 'silver_ore', input_label: 'Silver Ore', output: 'silver_bar', output_label: 'Silver Bar', rarity: 'rare' },
      { input: 'gold_ore', input_label: 'Gold Ore', output: 'gold_bar', output_label: 'Gold Bar', rarity: 'epic' },
      { input: 'platinum_ore', input_label: 'Platinum Ore', output: 'platinum_bar', output_label: 'Platinum Bar', rarity: 'legendary' },
      { input: 'void_ore', input_label: 'Void Ore', output: 'void_bar', output_label: 'Void Bar', rarity: 'mythic' },
      { input: 'crystal_ore', input_label: 'Crystal Ore', output: 'crystal_bar', output_label: 'Crystal Bar', rarity: 'shiny' },
    ],
  },
  cooking: {
    icon: '🍳', label: 'Cooking', description: 'Cook fish into food',
    requires_skill: 'fishing', requires_level: 30,
    recipes: [
      { input: 'carp', input_label: 'Carp', output: 'grilled_carp', output_label: 'Grilled Carp', rarity: 'common' },
      { input: 'salmon', input_label: 'Salmon', output: 'salmon_steak', output_label: 'Salmon Steak', rarity: 'uncommon' },
      { input: 'tuna', input_label: 'Tuna', output: 'tuna_soup', output_label: 'Tuna Soup', rarity: 'rare' },
      { input: 'swordfish', input_label: 'Swordfish', output: 'swordfish_feast', output_label: 'Swordfish Feast', rarity: 'epic' },
      { input: 'dragonfish', input_label: 'Dragonfish', output: 'dragon_broth', output_label: 'Dragon Broth', rarity: 'legendary' },
      { input: 'leviathan_fish', input_label: 'Leviathan Fish', output: 'leviathan_stew', output_label: 'Leviathan Stew', rarity: 'mythic' },
      { input: 'golden_fish', input_label: 'Golden Fish', output: 'golden_banquet', output_label: 'Golden Banquet', rarity: 'shiny' },
    ],
  },
  alchemy: {
    icon: '⚗️', label: 'Alchemy', description: 'Brew herbs into potions',
    requires_skill: 'herbalism', requires_level: 30,
    recipes: [
      { input: 'common_herb', input_label: 'Common Herb', output: 'healing_salve', output_label: 'Healing Salve', rarity: 'common' },
      { input: 'greenleaf', input_label: 'Greenleaf', output: 'mana_elixir', output_label: 'Mana Elixir', rarity: 'uncommon' },
      { input: 'blue_herb', input_label: 'Blue Herb', output: 'strength_brew', output_label: 'Strength Brew', rarity: 'rare' },
      { input: 'shadow_herb', input_label: 'Shadow Herb', output: 'sun_tincture', output_label: 'Sun Tincture', rarity: 'epic' },
      { input: 'sun_blossom', input_label: 'Sun Blossom', output: 'ether_draught', output_label: 'Ether Draught', rarity: 'legendary' },
      { input: 'ether_plant', input_label: 'Ether Plant', output: 'spirit_essence', output_label: 'Spirit Essence', rarity: 'mythic' },
      { input: 'spirit_herb', input_label: 'Spirit Herb', output: 'minor_potion', output_label: 'Minor Potion', rarity: 'shiny' },
    ],
  },
  forging: {
    icon: '⚔️', label: 'Forging', description: 'Forge bars into equipment',
    requires_skill: 'mining', requires_level: 50,
    recipes: [
      { input: 'iron_bar', input_label: 'Iron Bar', output: 'iron_sword', output_label: 'Iron Sword', rarity: 'common' },
      { input: 'copper_bar', input_label: 'Copper Bar', output: 'steel_armor', output_label: 'Steel Armor', rarity: 'uncommon' },
      { input: 'silver_bar', input_label: 'Silver Bar', output: 'silver_blade', output_label: 'Silver Blade', rarity: 'rare' },
      { input: 'gold_bar', input_label: 'Gold Bar', output: 'gold_shield', output_label: 'Gold Shield', rarity: 'epic' },
      { input: 'platinum_bar', input_label: 'Platinum Bar', output: 'platinum_helm', output_label: 'Platinum Helm', rarity: 'legendary' },
      { input: 'void_bar', input_label: 'Void Bar', output: 'void_weapon', output_label: 'Void Weapon', rarity: 'mythic' },
      { input: 'crystal_bar', input_label: 'Crystal Bar', output: 'crystal_relic', output_label: 'Crystal Relic', rarity: 'shiny' },
    ],
  },
};

const SKILL_TYPES = ['mining', 'fishing', 'herbalism'];

function rollDrop(dropTable, luckBonus) {
  const totalWeight = dropTable.reduce((sum, d) => sum + d.weight * (d.rarity !== 'common' ? luckBonus : 1), 0);
  let roll = Math.random() * totalWeight;
  for (const drop of dropTable) {
    const adjustedWeight = drop.weight * (drop.rarity !== 'common' ? luckBonus : 1);
    roll -= adjustedWeight;
    if (roll <= 0) return drop;
  }
  return dropTable[0];
}

function ensureLifeSkills(lifeSkills) {
  for (const st of SKILL_TYPES) {
    if (!lifeSkills[st]) {
      lifeSkills[st] = { level: 1, exp: 0, speed_level: 1, luck_level: 1, is_active: false, gather_progress: 0 };
    }
  }
  return lifeSkills;
}

function buildSkillResponse(lifeSkills, skillType, charId) {
  const s = lifeSkills[skillType];
  const baseCycle = 20;
  const speedReduction = 1 - ((s.speed_level || 1) - 1) * 0.08;
  const cycleDuration = Math.max(5, baseCycle * speedReduction);
  const expToNext = s.level * 100;
  return {
    id: `${skillType}_${charId}`,
    skill_type: skillType,
    level: s.level,
    exp: s.exp || 0,
    exp_to_next: expToNext,
    gather_progress: s.gather_progress || 0,
    cycle_duration: Math.round(cycleDuration * 10) / 10,
    xp_per_cycle: 15 + s.level * 2,
    speed_level: s.speed_level || 1,
    luck_level: s.luck_level || 1,
    speed_upgrade_cost: (s.speed_level || 1) * 50,
    luck_upgrade_cost: (s.luck_level || 1) * 80,
    is_active: s.is_active || false,
  };
}

function buildProcessingResponse(lifeSkills) {
  const result = {};
  for (const [key, data] of Object.entries(PROCESSING_RECIPES)) {
    const reqSkill = data.requires_skill;
    const reqLevel = data.requires_level;
    const skillLevel = (lifeSkills[reqSkill]?.level) || 1;
    result[key] = { ...data, is_unlocked: skillLevel >= reqLevel };
  }
  return result;
}

async function handleLocalFunction(functionName, params) {
  const characterId = params.characterId || params.character_id;

  switch (functionName) {
    case 'getCurrentUser': {
      const user = getLocalUser();
      return { data: user || { id: 'local', email: 'player@local', role: 'admin' } };
    }

    case 'registerUser':
      return { data: { success: true } };

    case 'getAllUsers': {
      const user = getLocalUser();
      return { data: [user || { id: 'local', email: 'player@local', role: 'admin' }] };
    }

    case 'getAllCharacters': {
      const chars = getStore('Character');
      return { data: chars };
    }

    case 'updateUserRole':
      return { data: { success: true } };

    case 'managePlayer': {
      if (params.characterId && params.action) {
        const chars = getStore('Character');
        const idx = chars.findIndex(c => c.id === params.characterId);
        if (idx !== -1) {
          if (params.action === 'ban') chars[idx].is_banned = true;
          else if (params.action === 'unban') chars[idx].is_banned = false;
          else if (params.action === 'mute') chars[idx].is_muted = true;
          else if (params.action === 'unmute') chars[idx].is_muted = false;
          setStore('Character', chars);
          return { data: chars[idx] };
        }
      }
      return { data: { success: true } };
    }

    case 'claimDailyLogin': {
      const chars = getStore('Character');
      const idx = chars.findIndex(c => c.id === characterId);
      if (idx === -1) return { data: { streak: 1, rewards: { gold: 100, gems: 0 } } };
      const char = chars[idx];
      const now = new Date();
      const lastLogin = char.last_daily_login ? new Date(char.last_daily_login) : null;
      const isConsecutive = lastLogin && (now.getTime() - lastLogin.getTime()) < 48 * 60 * 60 * 1000;
      const streak = isConsecutive ? (char.daily_login_streak || 0) + 1 : 1;
      const goldReward = 100 + (streak * 50);
      const gemReward = streak >= 7 ? 5 : (streak >= 3 ? 2 : 0);
      chars[idx] = {
        ...char,
        daily_login_streak: streak,
        last_daily_login: now.toISOString(),
        gold: (char.gold || 0) + goldReward,
        gems: (char.gems || 0) + gemReward,
      };
      setStore('Character', chars);
      notifySubscribers('Character', { type: 'update', id: characterId, data: chars[idx] });
      return { data: { streak, rewards: { gold: goldReward, gems: gemReward }, character: chars[idx] } };
    }

    case 'sellItem': {
      const { itemId } = params;
      const items = getStore('Item');
      const itemIdx = items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return { data: { success: false, message: 'Item not found' } };
      const item = items[itemIdx];
      const rarityMultiplier = { common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25, mythic: 50, shiny: 100 };
      const goldValue = (item.level || 1) * 10 * (rarityMultiplier[item.rarity] || 1);
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === item.owner_id);
      if (charIdx !== -1) {
        chars[charIdx].gold = (chars[charIdx].gold || 0) + goldValue;
        setStore('Character', chars);
        notifySubscribers('Character', { type: 'update', id: chars[charIdx].id, data: chars[charIdx] });
      }
      items.splice(itemIdx, 1);
      setStore('Item', items);
      notifySubscribers('Item', { type: 'delete', id: itemId });
      return { data: { success: true, gold_earned: goldValue } };
    }

    case 'upgradeItemSafe': {
      const { itemId } = params;
      const items = getStore('Item');
      const itemIdx = items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return { data: { success: false, message: 'Item not found' } };
      const item = items[itemIdx];
      const cost = ((item.upgrade_level || 0) + 1) * 100;
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === item.owner_id);
      if (charIdx === -1 || (chars[charIdx].gold || 0) < cost) {
        return { data: { success: false, message: 'Not enough gold' } };
      }
      items[itemIdx].upgrade_level = (item.upgrade_level || 0) + 1;
      chars[charIdx].gold = (chars[charIdx].gold || 0) - cost;
      setStore('Item', items);
      setStore('Character', chars);
      notifySubscribers('Item', { type: 'update', id: itemId, data: items[itemIdx] });
      return { data: { success: true, item: items[itemIdx], gold_spent: cost } };
    }

    case 'starUpgradeItem': {
      const { itemId } = params;
      const items = getStore('Item');
      const itemIdx = items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return { data: { success: false, message: 'Item not found' } };
      const item = items[itemIdx];
      const cost = ((item.star_level || 0) + 1) * 200;
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === item.owner_id);
      if (charIdx === -1 || (chars[charIdx].gold || 0) < cost) {
        return { data: { success: false, message: 'Not enough gold' } };
      }
      chars[charIdx].gold = (chars[charIdx].gold || 0) - cost;
      const successChance = Math.max(0.3, 1 - (item.star_level || 0) * 0.1);
      const success = Math.random() < successChance;
      if (success) {
        items[itemIdx].star_level = (item.star_level || 0) + 1;
        setStore('Item', items);
        setStore('Character', chars);
        notifySubscribers('Item', { type: 'update', id: itemId, data: items[itemIdx] });
        return { data: { success: true, item: items[itemIdx], gold_spent: cost } };
      }
      setStore('Character', chars);
      return { data: { success: false, message: 'Star upgrade failed!', gold_spent: cost } };
    }

    case 'awakenItem': {
      const { itemId } = params;
      const items = getStore('Item');
      const itemIdx = items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return { data: { success: false, message: 'Item not found' } };
      const cost = 1000;
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === (items[itemIdx].owner_id));
      if (charIdx === -1 || (chars[charIdx].gems || 0) < cost) {
        return { data: { success: false, message: 'Not enough gems' } };
      }
      items[itemIdx].awakened = true;
      chars[charIdx].gems = (chars[charIdx].gems || 0) - cost;
      setStore('Item', items);
      setStore('Character', chars);
      return { data: { success: true, item: items[itemIdx], gems_spent: cost } };
    }

    case 'getShopRotation': {
      const now = new Date();
      const seed = Math.floor(now.getTime() / (6 * 60 * 60 * 1000));
      const shopItems = [
        { id: `shop_${seed}_1`, name: 'Health Potion', type: 'consumable', price: 50, currency: 'gold' },
        { id: `shop_${seed}_2`, name: 'Mana Potion', type: 'consumable', price: 50, currency: 'gold' },
        { id: `shop_${seed}_3`, name: 'Mystery Box', type: 'lootbox', price: 100, currency: 'gems' },
        { id: `shop_${seed}_4`, name: 'EXP Boost', type: 'boost', price: 200, currency: 'gold' },
        { id: `shop_${seed}_5`, name: 'Gold Boost', type: 'boost', price: 150, currency: 'gold' },
      ];
      return { data: { items: shopItems, refreshes_at: new Date((seed + 1) * 6 * 60 * 60 * 1000).toISOString() } };
    }

    case 'manageDailyQuests': {
      const existing = getStore('Quest').filter(q => q.character_id === characterId);
      const activeQuests = existing.filter(q => q.status === 'active');
      if (activeQuests.length >= 3) return { data: { quests: existing } };
      const questTemplates = [
        { title: 'Monster Slayer', description: 'Kill 10 enemies', type: 'daily', target: 10, reward: { gold: 200, exp: 100 } },
        { title: 'Gold Hoarder', description: 'Earn 500 gold', type: 'daily', target: 500, reward: { gold: 300, gems: 1 } },
        { title: 'Level Up', description: 'Gain a level', type: 'daily', target: 1, reward: { gold: 500, gems: 2 } },
      ];
      const quests = getStore('Quest');
      const newQuests = [];
      for (const template of questTemplates.slice(0, 3 - activeQuests.length)) {
        const quest = {
          id: generateId(),
          character_id: characterId,
          type: template.type,
          title: template.title,
          description: template.description,
          target: template.target,
          progress: 0,
          reward: template.reward,
          status: 'active',
          created_date: new Date().toISOString(),
        };
        quests.push(quest);
        newQuests.push(quest);
      }
      setStore('Quest', quests);
      return { data: { quests: [...existing, ...newQuests] } };
    }

    case 'updateQuestProgress': {
      const { questType, amount } = params;
      const quests = getStore('Quest');
      let changed = false;
      for (let i = 0; i < quests.length; i++) {
        if (quests[i].character_id === characterId && quests[i].status === 'active') {
          quests[i].progress = Math.min((quests[i].progress || 0) + (amount || 1), quests[i].target);
          if (quests[i].progress >= quests[i].target) quests[i].status = 'completed';
          changed = true;
        }
      }
      if (changed) {
        setStore('Quest', quests);
        notifySubscribers('Quest', { type: 'update' });
      }
      return { data: { success: true } };
    }

    case 'lifeSkills': {
      const action = params.action;
      const skillType = params.skill_type || params.skillType;
      const charId = params.character_id || characterId;

      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === charId);
      if (charIdx === -1) return { data: { skills: [], resources: [], processing: {} } };
      const char = chars[charIdx];
      const lifeSkills = ensureLifeSkills(char.life_skills || {});

      if (action === 'get_skills' || action === 'getState') {
        const resources = getStore('Resource').filter(r => r.character_id === charId);
        chars[charIdx].life_skills = lifeSkills;
        setStore('Character', chars);
        return {
          data: {
            skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
            resources,
            processing: buildProcessingResponse(lifeSkills),
          },
        };
      }

      if (action === 'start') {
        for (const st of SKILL_TYPES) lifeSkills[st].is_active = false;
        if (lifeSkills[skillType]) {
          lifeSkills[skillType].is_active = true;
          lifeSkills[skillType].gather_progress = 0;
        }
        chars[charIdx].life_skills = lifeSkills;
        setStore('Character', chars);
        return {
          data: {
            success: true,
            skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
          },
        };
      }

      if (action === 'stop') {
        if (lifeSkills[skillType]) {
          lifeSkills[skillType].is_active = false;
          lifeSkills[skillType].gather_progress = 0;
        }
        chars[charIdx].life_skills = lifeSkills;
        setStore('Character', chars);
        return {
          data: {
            success: true,
            skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
          },
        };
      }

      if (action === 'tick') {
        const skill = lifeSkills[skillType];
        if (!skill || !skill.is_active) return { data: { success: false, message: 'Skill not active' } };

        const dropTable = LIFE_SKILL_DROPS[skillType] || [];
        const luckBonus = 1 + ((skill.luck_level || 1) - 1) * 0.15;
        const droppedResources = [];

        const numDrops = 1 + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.1 ? 1 : 0);
        for (let i = 0; i < numDrops; i++) {
          const drop = rollDrop(dropTable, luckBonus);
          if (drop) droppedResources.push(drop);
        }

        const resources = getStore('Resource');
        for (const drop of droppedResources) {
          const existing = resources.find(r =>
            r.character_id === charId && r.resource_type === drop.resource && r.rarity === drop.rarity
          );
          if (existing) {
            existing.quantity = (existing.quantity || 0) + 1;
          } else {
            resources.push({
              id: generateId(),
              character_id: charId,
              resource_type: drop.resource,
              rarity: drop.rarity,
              quantity: 1,
            });
          }
        }
        setStore('Resource', resources);
        notifySubscribers('Resource', { type: 'update' });

        const xpGain = 15 + skill.level * 2;
        skill.exp = (skill.exp || 0) + xpGain;
        const expToNext = skill.level * 100;
        let leveledUp = false;
        let newLevel = skill.level;
        if (skill.exp >= expToNext) {
          skill.level += 1;
          skill.exp = skill.exp - expToNext;
          leveledUp = true;
          newLevel = skill.level;
        }

        skill.gather_progress = 0;
        lifeSkills[skillType] = skill;
        chars[charIdx].life_skills = lifeSkills;
        setStore('Character', chars);

        return {
          data: {
            success: true,
            resources: droppedResources,
            leveled_up: leveledUp,
            new_level: newLevel,
          },
        };
      }

      if (action === 'upgrade') {
        const upgradeType = params.upgrade_type || params.upgradeType;
        const skill = lifeSkills[skillType];
        if (!skill) return { data: { success: false, message: 'Unknown skill' } };

        if (upgradeType === 'speed') {
          if ((skill.speed_level || 1) >= 10) return { data: { success: false, message: 'Max speed level' } };
          const cost = (skill.speed_level || 1) * 50;
          if ((char.gold || 0) < cost) return { data: { success: false, message: 'Not enough gold' } };
          skill.speed_level = (skill.speed_level || 1) + 1;
          chars[charIdx].gold = (char.gold || 0) - cost;
          lifeSkills[skillType] = skill;
          chars[charIdx].life_skills = lifeSkills;
          setStore('Character', chars);
          notifySubscribers('Character', { type: 'update', id: charId, data: chars[charIdx] });
          return { data: { success: true, gold_spent: cost, new_speed_level: skill.speed_level } };
        }

        if (upgradeType === 'luck') {
          if ((skill.luck_level || 1) >= 10) return { data: { success: false, message: 'Max luck level' } };
          const cost = (skill.luck_level || 1) * 80;
          if ((char.gold || 0) < cost) return { data: { success: false, message: 'Not enough gold' } };
          skill.luck_level = (skill.luck_level || 1) + 1;
          chars[charIdx].gold = (char.gold || 0) - cost;
          lifeSkills[skillType] = skill;
          chars[charIdx].life_skills = lifeSkills;
          setStore('Character', chars);
          notifySubscribers('Character', { type: 'update', id: charId, data: chars[charIdx] });
          return { data: { success: true, gold_spent: cost, new_luck_level: skill.luck_level } };
        }

        return { data: { success: false, message: 'Unknown upgrade type' } };
      }

      if (action === 'process') {
        const processType = params.process_type;
        const recipeInput = params.recipe_input;
        const quantity = params.quantity || 1;

        const recipeGroup = PROCESSING_RECIPES[processType];
        if (!recipeGroup) return { data: { success: false, message: 'Unknown process type' } };

        const recipe = recipeGroup.recipes.find(r => r.input === recipeInput);
        if (!recipe) return { data: { success: false, message: 'Recipe not found' } };

        const resources = getStore('Resource');
        const inputRes = resources.find(r =>
          r.character_id === charId && r.resource_type === recipe.input && r.rarity === recipe.rarity
        );
        if (!inputRes || inputRes.quantity < quantity) {
          return { data: { success: false, message: 'Not enough resources' } };
        }

        inputRes.quantity -= quantity;

        const outputRes = resources.find(r =>
          r.character_id === charId && r.resource_type === recipe.output && r.rarity === recipe.rarity
        );
        if (outputRes) {
          outputRes.quantity += quantity;
        } else {
          resources.push({
            id: generateId(),
            character_id: charId,
            resource_type: recipe.output,
            rarity: recipe.rarity,
            quantity,
          });
        }

        setStore('Resource', resources);
        notifySubscribers('Resource', { type: 'update' });
        return { data: { success: true } };
      }

      return { data: { life_skills: lifeSkills } };
    }

    case 'processGemLab': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { gem_lab: { level: 1, gems_stored: 0 }, gems_generated: 0 } };
      const char = chars[charIdx];
      const gemLab = char.gem_lab || { level: 1, gems_stored: 0 };
      const gemsGenerated = gemLab.level || 1;
      gemLab.gems_stored = (gemLab.gems_stored || 0) + gemsGenerated;
      chars[charIdx].gem_lab = gemLab;
      setStore('Character', chars);
      return { data: { gem_lab: gemLab, gems_generated: gemsGenerated } };
    }

    case 'claimGemLabGems': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { gems_claimed: 0, gem_lab: { level: 1, gems_stored: 0 } } };
      const char = chars[charIdx];
      const gemLab = char.gem_lab || { level: 1, gems_stored: 0 };
      const gemsToAdd = gemLab.gems_stored || 0;
      gemLab.gems_stored = 0;
      chars[charIdx].gem_lab = gemLab;
      chars[charIdx].gems = (char.gems || 0) + gemsToAdd;
      setStore('Character', chars);
      return { data: { gems_claimed: gemsToAdd, gem_lab: gemLab } };
    }

    case 'upgradeGemLab': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { success: false, message: 'Character not found' } };
      const char = chars[charIdx];
      const gemLab = char.gem_lab || { level: 1, gems_stored: 0 };
      const cost = gemLab.level * 500;
      if ((char.gold || 0) < cost) return { data: { success: false, message: 'Not enough gold' } };
      gemLab.level = (gemLab.level || 1) + 1;
      chars[charIdx].gem_lab = gemLab;
      chars[charIdx].gold = (char.gold || 0) - cost;
      setStore('Character', chars);
      return { data: { success: true, gem_lab: gemLab, gold_spent: cost } };
    }

    case 'transmuteGold': {
      const { amount } = params;
      if (!characterId) return { data: { rate: 1000, description: '1000 gold = 1 gem' } };
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { success: false, message: 'Character not found' } };
      const goldCost = (amount || 1) * 1000;
      if ((chars[charIdx].gold || 0) < goldCost) return { data: { success: false, message: 'Not enough gold' } };
      chars[charIdx].gold = (chars[charIdx].gold || 0) - goldCost;
      chars[charIdx].gems = (chars[charIdx].gems || 0) + (amount || 1);
      setStore('Character', chars);
      return { data: { success: true, gold_spent: goldCost, gems_gained: amount || 1 } };
    }

    case 'completeTrade': {
      const { trade_id, action: rawAction } = params;
      const action = rawAction || 'accept';
      let trades = getStore('TradeSession');
      let idx = trades.findIndex(t => t.id === trade_id);
      if (idx === -1) {
        trades = getStore('Trade');
        idx = trades.findIndex(t => t.id === trade_id);
        if (idx === -1) return { data: { success: false, message: 'Trade not found' } };
        if (action === 'accept') { trades[idx].status = 'completed'; setStore('Trade', trades); }
        else if (action === 'decline' || action === 'cancel') { trades[idx].status = 'cancelled'; setStore('Trade', trades); }
        return { data: { success: true, trade_id, status: trades[idx].status } };
      }
      if (action === 'accept') {
        trades[idx].status = 'completed';
        setStore('TradeSession', trades);
        notifySubscribers('TradeSession', { type: 'update', id: trade_id, data: trades[idx] });
        return { data: { success: true, trade_id, status: 'completed' } };
      }
      if (action === 'decline' || action === 'cancel') {
        trades[idx].status = 'cancelled';
        setStore('TradeSession', trades);
        notifySubscribers('TradeSession', { type: 'update', id: trade_id, data: trades[idx] });
        return { data: { success: true, trade_id, status: 'cancelled' } };
      }
      return { data: { success: true, trade_id } };
    }

    case 'manageParty': {
      const { action, partyId, targetCharacterId } = params;
      if (action === 'create') {
        const chars = getStore('Character');
        const char = chars.find(c => c.id === characterId);
        const party = {
          id: generateId(),
          leader_id: characterId,
          leader_name: char?.name || 'Unknown',
          members: [{ id: characterId, name: char?.name || 'Unknown' }],
          status: 'active',
          max_members: 4,
          created_date: new Date().toISOString(),
        };
        const parties = getStore('Party');
        parties.push(party);
        setStore('Party', parties);
        notifySubscribers('Party', { type: 'create', id: party.id, data: party });
        return { data: { success: true, party } };
      }
      if (action === 'invite' && partyId && targetCharacterId) {
        const invite = {
          id: generateId(),
          party_id: partyId,
          from_character_id: characterId,
          from_character_name: params.characterName || 'Unknown',
          to_character_id: targetCharacterId,
          status: 'pending',
          created_date: new Date().toISOString(),
        };
        const invites = getStore('PartyInvite');
        invites.push(invite);
        setStore('PartyInvite', invites);
        notifySubscribers('PartyInvite', { type: 'create', id: invite.id, data: invite });
        return { data: { success: true, invite } };
      }
      if (action === 'join' && partyId) {
        const parties = getStore('Party');
        const pIdx = parties.findIndex(p => p.id === partyId);
        if (pIdx === -1) return { data: { success: false, message: 'Party not found' } };
        const members = parties[pIdx].members || [];
        if (members.length >= (parties[pIdx].max_members || 4)) {
          return { data: { success: false, message: 'Party is full' } };
        }
        const chars = getStore('Character');
        const char = chars.find(c => c.id === characterId);
        members.push({ id: characterId, name: char?.name || 'Unknown' });
        parties[pIdx].members = members;
        setStore('Party', parties);
        return { data: { success: true, party: parties[pIdx] } };
      }
      if (action === 'leave' && partyId) {
        const parties = getStore('Party');
        const pIdx = parties.findIndex(p => p.id === partyId);
        if (pIdx !== -1) {
          parties[pIdx].members = (parties[pIdx].members || []).filter(m => m.id !== characterId);
          if (parties[pIdx].members.length === 0) {
            parties.splice(pIdx, 1);
          }
          setStore('Party', parties);
        }
        return { data: { success: true } };
      }
      if (action === 'disband' && partyId) {
        let parties = getStore('Party');
        parties = parties.filter(p => p.id !== partyId);
        setStore('Party', parties);
        return { data: { success: true } };
      }
      return { data: { success: true } };
    }

    case 'manageFriends': {
      const { action, targetCharacterId, requestId } = params;
      if (action === 'send') {
        const req = {
          id: generateId(),
          from_character_id: characterId,
          to_character_id: targetCharacterId,
          status: 'pending',
          created_date: new Date().toISOString(),
        };
        const requests = getStore('FriendRequest');
        requests.push(req);
        setStore('FriendRequest', requests);
        notifySubscribers('FriendRequest', { type: 'create', id: req.id, data: req });
        return { data: { success: true, request: req } };
      }
      if (action === 'accept' && requestId) {
        const requests = getStore('FriendRequest');
        const rIdx = requests.findIndex(r => r.id === requestId);
        if (rIdx === -1) return { data: { success: false, message: 'Request not found' } };
        requests[rIdx].status = 'accepted';
        setStore('FriendRequest', requests);
        const friendship = {
          id: generateId(),
          character_id_1: requests[rIdx].from_character_id,
          character_id_2: requests[rIdx].to_character_id,
          created_date: new Date().toISOString(),
        };
        const friendships = getStore('Friendship');
        friendships.push(friendship);
        setStore('Friendship', friendships);
        notifySubscribers('Friendship', { type: 'create', id: friendship.id, data: friendship });
        return { data: { success: true, friendship } };
      }
      if (action === 'decline' && requestId) {
        const requests = getStore('FriendRequest');
        const rIdx = requests.findIndex(r => r.id === requestId);
        if (rIdx !== -1) {
          requests[rIdx].status = 'declined';
          setStore('FriendRequest', requests);
        }
        return { data: { success: true } };
      }
      if (action === 'remove') {
        let friendships = getStore('Friendship');
        friendships = friendships.filter(f =>
          !((f.character_id_1 === characterId && f.character_id_2 === targetCharacterId) ||
            (f.character_id_2 === characterId && f.character_id_1 === targetCharacterId))
        );
        setStore('Friendship', friendships);
        return { data: { success: true } };
      }
      return { data: { success: true } };
    }

    case 'getLeaderboard': {
      const chars = getStore('Character');
      const sorted = [...chars].sort((a, b) => (b.level || 1) - (a.level || 1));
      const leaderboard = sorted.slice(0, 50).map((c, i) => ({
        rank: i + 1,
        id: c.id,
        name: c.name,
        class: c.class,
        level: c.level || 1,
        total_kills: c.total_kills || 0,
        prestige_level: c.prestige_level || 0,
        guild_name: c.guild_name || null,
      }));
      return { data: { leaderboard } };
    }

    case 'dungeonAction': {
      const { action, dungeonId } = params;
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { success: false, message: 'Character not found' } };
      const char = chars[charIdx];

      if (action === 'enter') {
        const session = {
          id: generateId(),
          character_id: characterId,
          dungeon_id: dungeonId || 'cave_of_shadows',
          status: 'active',
          floor: 1,
          enemies_defeated: 0,
          boss_hp: 500 + (char.level || 1) * 50,
          boss_max_hp: 500 + (char.level || 1) * 50,
          created_date: new Date().toISOString(),
        };
        const sessions = getStore('DungeonSession');
        sessions.push(session);
        setStore('DungeonSession', sessions);
        return { data: { success: true, session } };
      }

      if (action === 'attack') {
        const sessions = getStore('DungeonSession');
        const sIdx = sessions.findIndex(s => s.character_id === characterId && s.status === 'active');
        if (sIdx === -1) return { data: { success: false, message: 'No active dungeon' } };

        const session = sessions[sIdx];
        const playerDmg = (char.strength || 10) * (1 + Math.random() * 0.5);
        const enemyDmg = Math.floor(10 + session.floor * 5 * Math.random());
        session.boss_hp = Math.max(0, (session.boss_hp || 0) - Math.floor(playerDmg));

        let result = { player_damage: Math.floor(playerDmg), enemy_damage: enemyDmg };

        if (session.boss_hp <= 0) {
          session.enemies_defeated = (session.enemies_defeated || 0) + 1;
          session.floor = (session.floor || 1) + 1;
          session.boss_hp = 500 + (char.level || 1) * 50 * session.floor;
          session.boss_max_hp = session.boss_hp;
          const goldReward = 50 * session.floor;
          const expReward = 30 * session.floor;
          chars[charIdx].gold = (char.gold || 0) + goldReward;
          chars[charIdx].exp = (char.exp || 0) + expReward;
          setStore('Character', chars);
          result.floor_cleared = true;
          result.rewards = { gold: goldReward, exp: expReward };
          result.new_floor = session.floor;
        }

        setStore('DungeonSession', sessions);
        return { data: { success: true, session, ...result } };
      }

      if (action === 'flee' || action === 'leave') {
        const sessions = getStore('DungeonSession');
        const sIdx = sessions.findIndex(s => s.character_id === characterId && s.status === 'active');
        if (sIdx !== -1) {
          sessions[sIdx].status = 'completed';
          setStore('DungeonSession', sessions);
        }
        return { data: { success: true } };
      }

      return { data: { success: true, result: params } };
    }

    case 'catchUpOfflineProgress': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { rewards: null, hours: 0 } };
      const char = chars[charIdx];
      const lastClaim = char.last_idle_claim ? new Date(char.last_idle_claim).getTime() : Date.now();
      const offlineMs = Date.now() - lastClaim;
      const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), 8);
      if (offlineHours < 0.1) return { data: { rewards: null, hours: 0 } };
      const goldReward = Math.floor(offlineHours * (char.level || 1) * 50);
      const expReward = Math.floor(offlineHours * (char.level || 1) * 20);
      chars[charIdx].gold = (char.gold || 0) + goldReward;
      chars[charIdx].exp = (char.exp || 0) + expReward;
      chars[charIdx].last_idle_claim = new Date().toISOString();
      setStore('Character', chars);
      return { data: { rewards: { gold: goldReward, exp: expReward }, hours: Math.round(offlineHours * 10) / 10 } };
    }

    case 'processServerProgression': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { success: true } };
      const char = chars[charIdx];
      if (char.idle_mode) {
        const goldGain = Math.floor((char.level || 1) * 5);
        const expGain = Math.floor((char.level || 1) * 2);
        chars[charIdx].gold = (char.gold || 0) + goldGain;
        chars[charIdx].exp = (char.exp || 0) + expGain;
        const expToNext = char.exp_to_next || (char.level || 1) * 100;
        if (chars[charIdx].exp >= expToNext) {
          chars[charIdx].level = (char.level || 1) + 1;
          chars[charIdx].exp = chars[charIdx].exp - expToNext;
          chars[charIdx].exp_to_next = chars[charIdx].level * 100;
          chars[charIdx].stat_points = (char.stat_points || 0) + 3;
        }
        setStore('Character', chars);
        return { data: { success: true, gold_gained: goldGain, exp_gained: expGain, character: chars[charIdx] } };
      }
      return { data: { success: true } };
    }

    case 'unifiedPlayerProgression': {
      const chars = getStore('Character');
      const charIdx = chars.findIndex(c => c.id === characterId);
      if (charIdx === -1) return { data: { success: true } };
      const char = chars[charIdx];
      const expToNext = char.exp_to_next || (char.level || 1) * 100;
      if ((char.exp || 0) >= expToNext) {
        chars[charIdx].level = (char.level || 1) + 1;
        chars[charIdx].exp = (char.exp || 0) - expToNext;
        chars[charIdx].exp_to_next = chars[charIdx].level * 100;
        chars[charIdx].stat_points = (char.stat_points || 0) + 3;
        chars[charIdx].skill_points = (char.skill_points || 0) + 1;
        setStore('Character', chars);
        return { data: { success: true, leveled_up: true, new_level: chars[charIdx].level, character: chars[charIdx] } };
      }
      return { data: { success: true, leveled_up: false } };
    }

    case 'gameConfigManager': {
      const configKey = 'eb_gameConfig';
      if (params._method === 'POST' || params.action === 'update') {
        const configData = params.config || {};
        const id = params.id || 'global';
        localStorage.setItem(configKey, JSON.stringify({ id, config: configData }));
        return { data: { success: true, id, config: configData } };
      }
      try {
        const raw = localStorage.getItem(configKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { data: { success: true, id: parsed.id || 'global', config: parsed.config || parsed } };
        }
        return { data: { success: true, id: 'global', config: {} } };
      } catch {
        return { data: { success: true, id: 'global', config: {} } };
      }
    }

    default:
      console.warn(`[base44Client] Unknown function: ${functionName}`, params);
      return { data: { success: true } };
  }
}

async function handleRemoteFunction(functionName, params) {
  const result = await apiFetch(`/functions/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return { data: result.data || result };
}

export const base44 = {
  entities,

  functions: {
    async invoke(functionName, params = {}) {
      if (getMode() === 'server') {
        return handleRemoteFunction(functionName, params);
      }
      return handleLocalFunction(functionName, params);
    },
  },

  auth: {
    async me() {
      if (getMode() === 'server') {
        try {
          const res = await apiFetch('/auth/me');
          return res;
        } catch {
          return null;
        }
      }
      return getLocalUser() || { id: 'local-player', email: 'player@local', name: 'Player', role: 'admin' };
    },
  },

  getMode,
  setMode,
  getApiUrl,
  setApiUrl,
};

export default base44;
