import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { sendSuccess, sendError } from "../lib/response";
import { ENEMIES, calculateExpToLevel, generateLoot, RARITY_SELL_PRICES, RARITY_MULTIPLIER, rollUniqueDrop as rollUnique, rollStoneDrop as rollStone, generateShopItem } from "../lib/gameData";
import { db } from "@workspace/db";
import {
  charactersTable,
  itemsTable,
  guildsTable,
  questsTable,
  tradesTable,
  partiesTable,
  partyActivitiesTable,
  partyInvitesTable,
  userRolesTable,
  usersTable,
  gameConfigTable,
  resourcesTable,
  friendRequestsTable,
  friendshipsTable,
  tradeSessionsTable,
  dungeonSessionsTable,
  towerSessionsTable,
  chatMessagesTable,
  presencesTable,
  gemLabsTable,
  seasonPassTable,
  seasonMissionsTable,
} from "@workspace/db";
import { eq, desc, and, or, sql } from "drizzle-orm";

const router: IRouter = Router();

// ── Game Config loader (DB-backed, cached 60s) ────────────────────────────
let _configCache: { config: Record<string, any>; ts: number } | null = null;
const CONFIG_CACHE_MS = 60_000; // refresh every 60s

const CONFIG_DEFAULTS: Record<string, any> = {
  PROGRESSION: { BASE_EXP: 100, EXP_GROWTH: 1.18, STAT_POINTS_PER_LEVEL: 3, SKILL_POINTS_PER_LEVEL: 1, HP_PER_LEVEL: 5, MP_PER_LEVEL: 3, MAX_LEVEL: 100 },
  COMBAT: { BASE_ATTACK_INTERVAL_MS: 1000, BASE_CRIT_CHANCE: 0.05, CRIT_DAMAGE_MULTIPLIER: 1.5, BASE_EVASION: 0.05, BASE_BLOCK: 0.05, BLOCK_REDUCTION: 0.5, DEFENSE_TO_REDUCTION: 0.002, MAX_DAMAGE_REDUCTION: 0.6, MAX_LIFESTEAL: 50, ENEMY_DMG_VARIANCE: 0.4, IDLE_REWARD_MULTIPLIER: 0.5, AUTO_POTION_THRESHOLD: 0.4, EXP_GAIN_MULTIPLIER: 1.0, GOLD_GAIN_MULTIPLIER: 1.0, MONSTER_DMG_MULTIPLIER: 1.0 },
  ECONOMY: { STARTING_GOLD: 100, STARTING_GEMS: 10, MAX_OFFLINE_HOURS: 168, TRANSMUTE_COST_BASE: 1000, TRANSMUTE_COST_SCALING: 1.5, TRANSMUTE_GEMS_REWARD: 1, GEM_LAB_BASE_RATE: 0.01, GEM_LAB_PRODUCTION_BONUS: 0.05, GEM_LAB_SPEED_REDUCTION: 0.1, GEM_LAB_EFFICIENCY_BONUS: 0.1, SHOP_ROTATION_HOURS: 4 },
  LOOT: { BASE_DROP_CHANCE: 0.01, MAX_DROP_CHANCE: 0.04, LUCK_DROP_BONUS: 0.0003, BOSS_DROP_CHANCE: 0.25, SMART_LOOT_CHANCE: 0.65, SMART_LOOT_WEAPON_CHANCE: 0.40, SMART_LOOT_ARMOR_CHANCE: 0.35, LUCK_RARITY_BONUS_PER_POINT: 0.1 },
  UPGRADES: { SAFE_GOLD_BASE: 1000, SAFE_GOLD_SCALING: 1.5, SAFE_ORE_BASE: 5, SAFE_ORE_SCALING: 2, SAFE_STAT_BONUS_PER_LEVEL: 0.05, SAFE_MAX_LEVEL: 20, STAR_SUCCESS_CHANCES: [90, 75, 50, 35, 12, 8, 2], STAR_GEM_BASE: 50, STAR_GEM_GROWTH: 2.0, STAR_STAT_BONUS_PER_STAR: 0.15, STAR_MAX_LEVEL: 7, AWAKEN_GEM_COST: 5000, AWAKEN_STAT_BONUS: 1.0 },
  GUILDS: { MAX_MEMBERS: 20, MAX_LEVEL: 30, BASE_EXP_TO_NEXT: 1000, EXP_GROWTH: 1.3, PERK_BONUS_PER_LEVEL: 0.05, MAX_PERK_LEVEL: 10, BOSS_RESPAWN_HOURS: 24, BOSS_HP_BASE: 10000, BOSS_HP_PER_GUILD_LEVEL: 5000, TOKEN_REWARD_PER_BOSS_DAMAGE: 0.01 },
  PARTIES: { MAX_SIZE: 6, EXP_BONUS_PER_MEMBER: 0.05, GOLD_BONUS_PER_MEMBER: 0.05, INVITE_EXPIRY_MINUTES: 5 },
  DAILY_LOGIN: { BASE_GOLD: 100, BASE_GEMS: 2, STREAK_GOLD_MULTIPLIER: 1.1, MAX_STREAK_BONUS_DAYS: 30 },
  LIFE_SKILLS: { BASE_GATHER_TICKS_PER_ITEM: 5, SPEED_REDUCTION_PER_LEVEL: 0.1, LUCK_RARE_BONUS_PER_LEVEL: 0.05, MAX_GATHER_LEVEL: 99, EXP_GROWTH: 1.12 },
  RARITY_MULTIPLIERS: { common: 1.0, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3.0, mythic: 4.0, set: 3.5, shiny: 5.0 },
  SELL_PRICES: { common: 5, uncommon: 20, rare: 60, epic: 200, legendary: 600, mythic: 2000, set: 800, shiny: 3000 },
};

async function getGameConfig(): Promise<Record<string, any>> {
  if (_configCache && Date.now() - _configCache.ts < CONFIG_CACHE_MS) {
    return _configCache.config;
  }
  try {
    const [row] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, "global"));
    const dbConfig = (row?.config as Record<string, any>) || {};
    // Merge: DB values override defaults, section by section
    const merged: Record<string, any> = {};
    for (const [section, defaults] of Object.entries(CONFIG_DEFAULTS)) {
      merged[section] = { ...(defaults as Record<string, any>), ...(dbConfig[section] || {}) };
    }
    _configCache = { config: merged, ts: Date.now() };
    return merged;
  } catch {
    return CONFIG_DEFAULTS;
  }
}


async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  if (!requireAuth(req, res)) return false;
  const [roleRow] = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, req.user!.id));
  if (!roleRow || !["admin", "moderator", "superadmin"].includes(roleRow.role)) {
    sendError(res, 403, "Admin access required");
    return false;
  }
  return true;
}

async function verifyCharacterOwner(req: Request, characterId: string): Promise<boolean> {
  if (!characterId) return false;
  const [char] = await db.select({ createdBy: charactersTable.createdBy }).from(charactersTable).where(eq(charactersTable.id, characterId));
  return char?.createdBy === req.user!.id;
}

async function requireCharacterOwner(req: Request, res: Response, characterId: string): Promise<boolean> {
  if (!requireAuth(req, res)) return false;
  if (!characterId) { sendError(res, 400, "characterId is required"); return false; }
  const isOwner = await verifyCharacterOwner(req, characterId);
  if (!isOwner) { sendError(res, 403, "Not your character"); return false; }
  return true;
}

// Public profile lookup — returns basic info for any character IDs (no ownership check)
router.post("/functions/getPublicProfiles", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterIds } = req.body;
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      sendSuccess(res, { profiles: [] }); return;
    }
    const ids = characterIds.slice(0, 20); // limit to 20
    const rows = await db.select({
      id: charactersTable.id,
      name: charactersTable.name,
      level: charactersTable.level,
      class: charactersTable.class,
      currentRegion: charactersTable.currentRegion,
    }).from(charactersTable).where(sql`${charactersTable.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    const profiles = rows.map(r => ({
      id: r.id, name: r.name, level: r.level, class: r.class, current_region: r.currentRegion,
    }));
    sendSuccess(res, { profiles });
  } catch (err: any) {
    req.log.error({ err }, "getPublicProfiles error");
    sendError(res, 500, err.message);
  }
});

const TICK_COOLDOWNS = new Map<string, number>();
const MIN_TICK_INTERVAL_MS = 3000;

const LIFE_SKILL_DROPS: Record<string, Array<{ resource: string; label: string; rarity: string; weight: number }>> = {
  mining: [
    { resource: "iron_ore", label: "Iron Ore", rarity: "common", weight: 60 },
    { resource: "copper_ore", label: "Copper Ore", rarity: "uncommon", weight: 25 },
    { resource: "silver_ore", label: "Silver Ore", rarity: "rare", weight: 10 },
    { resource: "gold_ore", label: "Gold Ore", rarity: "epic", weight: 3.5 },
    { resource: "platinum_ore", label: "Platinum Ore", rarity: "legendary", weight: 1 },
    { resource: "void_ore", label: "Void Ore", rarity: "mythic", weight: 0.4 },
    { resource: "crystal_ore", label: "Crystal Ore", rarity: "shiny", weight: 0.1 },
  ],
  fishing: [
    { resource: "carp", label: "Carp", rarity: "common", weight: 60 },
    { resource: "salmon", label: "Salmon", rarity: "uncommon", weight: 25 },
    { resource: "tuna", label: "Tuna", rarity: "rare", weight: 10 },
    { resource: "swordfish", label: "Swordfish", rarity: "epic", weight: 3.5 },
    { resource: "dragonfish", label: "Dragonfish", rarity: "legendary", weight: 1 },
    { resource: "leviathan_fish", label: "Leviathan Fish", rarity: "mythic", weight: 0.4 },
    { resource: "golden_fish", label: "Golden Fish", rarity: "shiny", weight: 0.1 },
  ],
  herbalism: [
    { resource: "common_herb", label: "Common Herb", rarity: "common", weight: 60 },
    { resource: "greenleaf", label: "Greenleaf", rarity: "uncommon", weight: 25 },
    { resource: "blue_herb", label: "Blue Herb", rarity: "rare", weight: 10 },
    { resource: "shadow_herb", label: "Shadow Herb", rarity: "epic", weight: 3.5 },
    { resource: "sun_blossom", label: "Sun Blossom", rarity: "legendary", weight: 1 },
    { resource: "ether_plant", label: "Ether Plant", rarity: "mythic", weight: 0.4 },
    { resource: "spirit_herb", label: "Spirit Herb", rarity: "shiny", weight: 0.1 },
  ],
};

const PROCESSING_RECIPES: Record<string, any> = {
  smelting: {
    icon: "🔥", label: "Smelting", description: "Smelt ores into bars",
    requires_skill: "mining", requires_level: 30,
    recipes: [
      { input: "iron_ore", input_label: "Iron Ore", output: "iron_bar", output_label: "Iron Bar", rarity: "common" },
      { input: "copper_ore", input_label: "Copper Ore", output: "copper_bar", output_label: "Copper Bar", rarity: "uncommon" },
      { input: "silver_ore", input_label: "Silver Ore", output: "silver_bar", output_label: "Silver Bar", rarity: "rare" },
      { input: "gold_ore", input_label: "Gold Ore", output: "gold_bar", output_label: "Gold Bar", rarity: "epic" },
      { input: "platinum_ore", input_label: "Platinum Ore", output: "platinum_bar", output_label: "Platinum Bar", rarity: "legendary" },
      { input: "void_ore", input_label: "Void Ore", output: "void_bar", output_label: "Void Bar", rarity: "mythic" },
      { input: "crystal_ore", input_label: "Crystal Ore", output: "crystal_bar", output_label: "Crystal Bar", rarity: "shiny" },
    ],
  },
  cooking: {
    icon: "🍳", label: "Cooking", description: "Cook fish into food",
    requires_skill: "fishing", requires_level: 30,
    recipes: [
      { input: "carp", input_label: "Carp", output: "grilled_carp", output_label: "Grilled Carp", rarity: "common" },
      { input: "salmon", input_label: "Salmon", output: "salmon_steak", output_label: "Salmon Steak", rarity: "uncommon" },
      { input: "tuna", input_label: "Tuna", output: "tuna_soup", output_label: "Tuna Soup", rarity: "rare" },
      { input: "swordfish", input_label: "Swordfish", output: "swordfish_feast", output_label: "Swordfish Feast", rarity: "epic" },
      { input: "dragonfish", input_label: "Dragonfish", output: "dragon_broth", output_label: "Dragon Broth", rarity: "legendary" },
      { input: "leviathan_fish", input_label: "Leviathan Fish", output: "leviathan_stew", output_label: "Leviathan Stew", rarity: "mythic" },
      { input: "golden_fish", input_label: "Golden Fish", output: "golden_banquet", output_label: "Golden Banquet", rarity: "shiny" },
    ],
  },
  alchemy: {
    icon: "⚗️", label: "Alchemy", description: "Brew herbs into potions",
    requires_skill: "herbalism", requires_level: 30,
    recipes: [
      { input: "common_herb", input_label: "Common Herb", output: "healing_salve", output_label: "Healing Salve", rarity: "common" },
      { input: "greenleaf", input_label: "Greenleaf", output: "mana_elixir", output_label: "Mana Elixir", rarity: "uncommon" },
      { input: "blue_herb", input_label: "Blue Herb", output: "strength_brew", output_label: "Strength Brew", rarity: "rare" },
      { input: "shadow_herb", input_label: "Shadow Herb", output: "sun_tincture", output_label: "Sun Tincture", rarity: "epic" },
      { input: "sun_blossom", input_label: "Sun Blossom", output: "ether_draught", output_label: "Ether Draught", rarity: "legendary" },
      { input: "ether_plant", input_label: "Ether Plant", output: "spirit_essence", output_label: "Spirit Essence", rarity: "mythic" },
      { input: "spirit_herb", input_label: "Spirit Herb", output: "minor_potion", output_label: "Minor Potion", rarity: "shiny" },
    ],
  },
  forging: {
    icon: "⚔️", label: "Forging", description: "Forge bars into equipment",
    requires_skill: "mining", requires_level: 50,
    recipes: [
      { input: "iron_bar", input_label: "Iron Bar", output: "iron_sword", output_label: "Iron Sword", rarity: "common" },
      { input: "copper_bar", input_label: "Copper Bar", output: "steel_armor", output_label: "Steel Armor", rarity: "uncommon" },
      { input: "silver_bar", input_label: "Silver Bar", output: "silver_blade", output_label: "Silver Blade", rarity: "rare" },
      { input: "gold_bar", input_label: "Gold Bar", output: "gold_shield", output_label: "Gold Shield", rarity: "epic" },
      { input: "platinum_bar", input_label: "Platinum Bar", output: "platinum_helm", output_label: "Platinum Helm", rarity: "legendary" },
      { input: "void_bar", input_label: "Void Bar", output: "void_weapon", output_label: "Void Weapon", rarity: "mythic" },
      { input: "crystal_bar", input_label: "Crystal Bar", output: "crystal_relic", output_label: "Crystal Relic", rarity: "shiny" },
    ],
  },
};

const SKILL_TYPES = ["mining", "fishing", "herbalism"];

function rollDrop(dropTable: any[], luckBonus: number) {
  const totalWeight = dropTable.reduce((sum: number, d: any) => sum + d.weight * (d.rarity !== "common" ? luckBonus : 1), 0);
  let roll = Math.random() * totalWeight;
  for (const drop of dropTable) {
    const adjustedWeight = drop.weight * (drop.rarity !== "common" ? luckBonus : 1);
    roll -= adjustedWeight;
    if (roll <= 0) return drop;
  }
  return dropTable[0];
}

function ensureLifeSkills(lifeSkills: any) {
  for (const st of SKILL_TYPES) {
    if (!lifeSkills[st]) {
      lifeSkills[st] = { level: 1, exp: 0, speed_level: 1, luck_level: 1, is_active: false, gather_progress: 0 };
    }
  }
  return lifeSkills;
}

function buildSkillResponse(lifeSkills: any, skillType: string, charId: string) {
  const s = lifeSkills[skillType];
  const baseCycle = 20;
  const speedReduction = 1 - ((s.speed_level || 1) - 1) * 0.08;
  const cycleDuration = Math.max(5, baseCycle * speedReduction);
  const expToNext = s.level * 100; // life skill EXP is separate from character EXP
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
    xp_boost_level: s.luck_level || 1,
    speed_upgrade_cost: (s.speed_level || 1) * 50,
    luck_upgrade_cost: (s.luck_level || 1) * 80,
    xp_boost_upgrade_cost: (s.luck_level || 1) * 80,
    is_active: s.is_active || false,
  };
}

function buildProcessingResponse(lifeSkills: any) {
  const result: Record<string, any> = {};
  for (const [key, data] of Object.entries(PROCESSING_RECIPES)) {
    const d = data as any;
    const reqSkill = d.requires_skill;
    const reqLevel = d.requires_level;
    const skillLevel = lifeSkills[reqSkill]?.level || 1;
    result[key] = { ...d, is_unlocked: skillLevel >= reqLevel };
  }
  return result;
}

router.post("/functions/getCurrentUser", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const [roleRow] = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, req.user!.id));
    sendSuccess(res, {
        id: req.user!.id,
        email: req.user!.email,
        role: roleRow?.role || "player",
      });
  } catch (err: any) {
    sendSuccess(res, { id: req.user!.id, email: req.user!.email, role: "player" });
  }
});

// Public endpoint for role/title data (used by leaderboard, chat)
router.post("/functions/getPlayerRoles", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const roles = await db.select().from(userRolesTable);
    const chars = await db.select({
      id: charactersTable.id,
      createdBy: charactersTable.createdBy,
      title: charactersTable.title,
    }).from(charactersTable);

    const roleMap: Record<string, string> = {};
    for (const r of roles) { roleMap[r.userId] = r.role; }

    const result: Record<string, { role: string; title: string | null }> = {};
    for (const c of chars) {
      result[c.createdBy] = { role: roleMap[c.createdBy] || "player", title: c.title || null };
    }

    sendSuccess(res, result);
  } catch (err: any) {
    req.log.error({ err }, "getPlayerRoles error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/getAllUsers", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const users = await db.select().from(usersTable);
    const roles = await db.select().from(userRolesTable);
    const roleMap = Object.fromEntries(roles.map(r => [r.userId, r.role]));
    sendSuccess(res, users.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
        full_name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
        role: roleMap[u.id] || "player",
      })));
  } catch (err: any) {
    req.log.error({ err }, "getAllUsers error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/getAllCharacters", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.level));
    sendSuccess(res, chars.map(c => toClientCharacter(c)));
  } catch (err: any) {
    req.log.error({ err }, "getAllCharacters error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/updateUserRole", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const userId = req.body.userId || req.body.target_user_id;
    const role = req.body.role || req.body.new_role;
    await db.insert(userRolesTable).values({ userId, role }).onConflictDoUpdate({
      target: userRolesTable.userId,
      set: { role, updatedAt: new Date() },
    });
    sendSuccess(res, { success: true });
  } catch (err: any) {
    req.log.error({ err }, "updateUserRole error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/managePlayer", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { action, stats, ...rest } = req.body;
    const characterId = req.body.characterId || req.body.target_character_id;
    const guildId = req.body.guildId || req.body.guild_id;

    if (action === "ban" && characterId) {
      const hours = rest.data?.hours;
      const banUntil = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char) { sendError(res, 404, "Character not found"); return; }
      const extraData = (char.extraData as any) || {};
      extraData.ban_until = banUntil;
      const [updated] = await db.update(charactersTable).set({ isBanned: true, extraData }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "unban" && characterId) {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const extraData = (char?.extraData as any) || {};
      delete extraData.ban_until;
      const [updated] = await db.update(charactersTable).set({ isBanned: false, extraData }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "mute" && characterId) {
      const hours = rest.data?.hours || 24;
      const muteUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char) { sendError(res, 404, "Character not found"); return; }
      const extraData = (char.extraData as any) || {};
      extraData.mute_until = muteUntil;
      const [updated] = await db.update(charactersTable).set({ isMuted: true, extraData }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "unmute" && characterId) {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const extraData = (char?.extraData as any) || {};
      delete extraData.mute_until;
      const [updated] = await db.update(charactersTable).set({ isMuted: false, extraData }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "kick" && characterId) {
      const [updated] = await db.update(charactersTable).set({ guildId: null }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "delete" && characterId) {
      await db.delete(itemsTable).where(eq(itemsTable.ownerId, characterId));
      await db.delete(questsTable).where(eq(questsTable.characterId, characterId));
      await db.delete(resourcesTable).where(eq(resourcesTable.characterId, characterId));
      await db.delete(gemLabsTable).where(eq(gemLabsTable.characterId, characterId));
      await db.delete(charactersTable).where(eq(charactersTable.id, characterId));
      sendSuccess(res, { success: true, deleted: characterId }); return;
    }
    const statsData = stats || rest.data;
    if (action === "update_stats" && characterId && statsData) {
      const allowedFields: Record<string, string> = {
        level: "level", gold: "gold", gems: "gems", stat_points: "statPoints",
        skill_points: "skillPoints", prestige_level: "prestigeLevel",
        strength: "strength", dexterity: "dexterity", intelligence: "intelligence",
        vitality: "vitality", luck: "luck", total_kills: "totalKills",
        total_damage: "totalDamage", hp: "hp", mp: "mp", max_hp: "maxHp", max_mp: "maxMp",
      };
      const updateData: Record<string, any> = {};
      for (const [key, val] of Object.entries(statsData)) {
        const dbField = allowedFields[key];
        if (dbField) {
          const numVal = typeof val === "number" ? val : Number(val);
          if (!isNaN(numVal)) updateData[dbField] = numVal;
        }
      }
      // When admin changes level, auto-recalculate expToNext and add stat/skill points
      if (updateData.level) {
        const [oldChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
        const oldLevel = oldChar?.level || 1;
        const newLevel = updateData.level;
        updateData.expToNext = calculateExpToLevel(newLevel);
        updateData.exp = 0; // Reset current exp to avoid instant level-up
        if (newLevel > oldLevel) {
          const levelDiff = newLevel - oldLevel;
          updateData.statPoints = (oldChar?.statPoints || 0) + levelDiff * 3;
          updateData.skillPoints = (oldChar?.skillPoints || 0) + levelDiff * 1;
          updateData.maxHp = (oldChar?.maxHp || 100) + levelDiff * 5;
          updateData.maxMp = (oldChar?.maxMp || 50) + levelDiff * 3;
        }
      }
      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(charactersTable).set(updateData).where(eq(charactersTable.id, characterId)).returning();
        sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
      }
      sendSuccess(res, { success: false, message: "No valid stats to update" }); return;
    }
    if (action === "delete_guild" && guildId) {
      await db.update(charactersTable).set({ guildId: null }).where(eq(charactersTable.guildId, guildId));
      await db.delete(guildsTable).where(eq(guildsTable.id, guildId));
      sendSuccess(res, { success: true, deletedGuild: guildId }); return;
    }
    if (action === "leaderboard") {
      const chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.level)).limit(100);
      sendSuccess(res, chars.map((c, i) => ({ rank: i + 1, ...toClientCharacter(c) }))); return;
    }

    if (characterId) {
      const updateData: Record<string, any> = {};
      Object.assign(updateData, rest);
      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(charactersTable).set(updateData).where(eq(charactersTable.id, characterId)).returning();
        sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
      }
    }
    sendSuccess(res, { success: true });
  } catch (err: any) {
    req.log.error({ err }, "managePlayer error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/registerUser", async (req: Request, res: Response) => {
  sendSuccess(res, { success: true, message: "Use Replit Auth to register" });
});

router.post("/functions/claimDailyLogin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const now = new Date();
    const lastLogin = char.lastDailyLogin ? new Date(char.lastDailyLogin) : null;
    const isConsecutive = lastLogin && (now.getTime() - lastLogin.getTime()) < 48 * 60 * 60 * 1000;
    const streak = isConsecutive ? (char.dailyLoginStreak || 0) + 1 : 1;
    const goldReward = 100 + (streak * 50);
    const gemReward = streak >= 7 ? 5 : (streak >= 3 ? 2 : 0);
    const [updated] = await db.update(charactersTable).set({
      dailyLoginStreak: streak,
      lastDailyLogin: now,
      gold: (char.gold || 0) + goldReward,
      gems: (char.gems || 0) + gemReward,
    }).where(eq(charactersTable.id, characterId)).returning();
    sendSuccess(res, {
        streak,
        rewards: { gold: goldReward, gems: gemReward },
        character: updated ? toClientCharacter(updated) : null,
      });
  } catch (err: any) {
    req.log.error({ err }, "claimDailyLogin error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/sellItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { sendError(res, 404, "Item not found"); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { sendError(res, 403, "Not your item"); return; }
    const cfg = await getGameConfig();
    const sellPrices = cfg.SELL_PRICES || {};
    const extraData = (item.extraData as any) || {};
    const goldValue = extraData.sell_price || Math.floor((sellPrices[item.rarity] || RARITY_SELL_PRICES[item.rarity] || 10) * (1 + (item.level || 1) * 0.08));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (char) {
      await db.update(charactersTable).set({ gold: (char.gold || 0) + goldValue }).where(eq(charactersTable.id, char.id));
    }
    await db.delete(itemsTable).where(eq(itemsTable.id, itemId));
    const newGold = (char?.gold || 0) + goldValue;
    sendSuccess(res, { success: true, gold_earned: goldValue, newGold, sellPrice: goldValue });
  } catch (err: any) {
    req.log.error({ err }, "sellItem error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/upgradeItemSafe", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { sendError(res, 404, "Item not found"); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { sendError(res, 403, "Not your item"); return; }
    const cfg = await getGameConfig();
    const upgCfg = cfg.UPGRADES;
    const currentUpgrade = item.upgradeLevel || 0;
    if (currentUpgrade >= (upgCfg.SAFE_MAX_LEVEL || 20)) { sendSuccess(res, { success: false, message: `Already at max upgrade level (${upgCfg.SAFE_MAX_LEVEL || 20})` }); return; }
    const rarityMult = cfg.RARITY_MULTIPLIERS || {};
    const goldBase = upgCfg.SAFE_GOLD_BASE || 1000;
    const goldScaling = upgCfg.SAFE_GOLD_SCALING || 1.5;
    const cost = Math.floor(goldBase * Math.pow(goldScaling, currentUpgrade) * ((rarityMult as any)[item.rarity] || 1));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gold || 0) < cost) {
      sendSuccess(res, { success: false, message: "Not enough gold" }); return;
    }
    const statBonusPerLevel = upgCfg.SAFE_STAT_BONUS_PER_LEVEL || 0.05;
    const newLevel = currentUpgrade + 1;
    const extraData = (item.extraData as Record<string, any>) || {};
    // Store base stats on first upgrade so we can use cumulative formula (no rounding drift)
    const baseStats: Record<string, number> = extraData.base_stats || {};
    if (!extraData.base_stats) {
      const currentMult = 1 + currentUpgrade * statBonusPerLevel;
      for (const [stat, val] of Object.entries((item.stats as Record<string, number>) || {})) {
        baseStats[stat] = Math.round((val as number) / currentMult);
      }
    }
    const boostedStats: Record<string, number> = {};
    for (const [stat, val] of Object.entries(baseStats)) {
      boostedStats[stat] = Math.round((val as number) * (1 + newLevel * statBonusPerLevel));
    }
    const newExtraData = { ...extraData, base_stats: baseStats };
    const [updated] = await db.update(itemsTable).set({ upgradeLevel: newLevel, stats: boostedStats, extraData: newExtraData }).where(eq(itemsTable.id, itemId)).returning();
    await db.update(charactersTable).set({ gold: (char.gold || 0) - cost }).where(eq(charactersTable.id, char.id));
    sendSuccess(res, { success: true, item: updated, gold_spent: cost });
  } catch (err: any) {
    req.log.error({ err }, "upgradeItemSafe error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/starUpgradeItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { sendError(res, 404, "Item not found"); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { sendError(res, 403, "Not your item"); return; }
    const cfg = await getGameConfig();
    const upgCfg = cfg.UPGRADES;
    const currentStar = item.starLevel || 0;
    const maxStar = upgCfg.STAR_MAX_LEVEL || 7;
    if (currentStar >= maxStar) { sendSuccess(res, { success: false, message: `Already at max star level (${maxStar})` }); return; }
    const rarityMult = cfg.RARITY_MULTIPLIERS || {};
    const cost = Math.ceil((upgCfg.STAR_GEM_BASE || 50) * Math.pow(upgCfg.STAR_GEM_GROWTH || 2.0, currentStar) * ((rarityMult as any)[item.rarity] || 1));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gems || 0) < cost) {
      sendSuccess(res, { success: false, message: `Not enough gems (need ${cost})` }); return;
    }
    const chances = upgCfg.STAR_SUCCESS_CHANCES || [90, 75, 50, 35, 12, 8, 2];
    const successPct = chances[currentStar] ?? 50;
    const success = Math.random() * 100 < successPct;
    await db.update(charactersTable).set({ gems: (char.gems || 0) - cost }).where(eq(charactersTable.id, char.id));
    if (success) {
      const itemStats = (item.stats as Record<string, number>) || {};
      const boostedStats: Record<string, number> = {};
      const starBonus = upgCfg.STAR_STAT_BONUS_PER_STAR || 0.05;
      for (const [stat, val] of Object.entries(itemStats)) {
        boostedStats[stat] = Math.round(val * (1 + starBonus));
      }
      const [updated] = await db.update(itemsTable).set({ starLevel: currentStar + 1, stats: boostedStats }).where(eq(itemsTable.id, itemId)).returning();
      sendSuccess(res, { success: true, item: updated, gems_spent: cost });
    } else {
      await db.delete(itemsTable).where(eq(itemsTable.id, itemId));
      sendSuccess(res, { success: false, message: "Star upgrade failed! Item destroyed.", gems_spent: cost, itemDestroyed: true });
    }
  } catch (err: any) {
    req.log.error({ err }, "starUpgradeItem error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/awakenItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { sendError(res, 404, "Item not found"); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { sendError(res, 403, "Not your item"); return; }
    if (item.awakened) { sendSuccess(res, { success: false, message: "Item already awakened" }); return; }
    const cfg = await getGameConfig();
    const upgCfg = cfg.UPGRADES;
    const maxStar = upgCfg.STAR_MAX_LEVEL || 7;
    if ((item.starLevel || 0) < maxStar) { sendSuccess(res, { success: false, message: `Item must be Star ${maxStar} to awaken` }); return; }
    const cost = upgCfg.AWAKEN_GEM_COST || 5000;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gems || 0) < cost) {
      sendSuccess(res, { success: false, message: `Not enough gems (need ${cost})` }); return;
    }
    const itemStats = (item.stats as Record<string, number>) || {};
    const awakenedStats: Record<string, number> = {};
    const awakenBonus = upgCfg.AWAKEN_STAT_BONUS || 1.0;
    for (const [stat, val] of Object.entries(itemStats)) {
      awakenedStats[stat] = Math.round(val * (1 + awakenBonus));
    }
    const [updated] = await db.update(itemsTable).set({ awakened: true, stats: awakenedStats }).where(eq(itemsTable.id, itemId)).returning();
    await db.update(charactersTable).set({ gems: (char.gems || 0) - cost }).where(eq(charactersTable.id, char.id));
    sendSuccess(res, { success: true, item: updated, gems_spent: cost });
  } catch (err: any) {
    req.log.error({ err }, "awakenItem error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/getShopRotation", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, forceRefresh } = req.body;
    const now = new Date();
    const ROTATION_MS = 4 * 60 * 60 * 1000;
    const seed = Math.floor(now.getTime() / ROTATION_MS);
    const refreshesAt = new Date((seed + 1) * ROTATION_MS).toISOString();

    let charLevel = 1;
    let charClass = "warrior";
    if (characterId) {
      const [char] = await db.select({ level: charactersTable.level, class: charactersTable.class }).from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) {
        charLevel = char.level || 1;
        charClass = char.class || "warrior";
      }
    }

    let gemsSpent = 0;
    let actualSeed = seed;
    if (forceRefresh && characterId) {
      const REFRESH_COST = 5;
      const [charData] = await db.select({ gems: charactersTable.gems }).from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!charData || (charData.gems || 0) < REFRESH_COST) {
        return sendError(res, 400, "Not enough gems to refresh shop");
      }
      await db.update(charactersTable).set({ gems: (charData.gems || 0) - REFRESH_COST }).where(eq(charactersTable.id, characterId));
      gemsSpent = REFRESH_COST;
      // Use a unique seed so forced refresh generates different items
      actualSeed = seed * 1000 + Date.now() % 100000;
    }

    const rng = mulberry32(actualSeed + charLevel);
    // Include legendary/mythic at higher levels with low chances
    const RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
    // Weights shift with level: higher level = better chance at rare+ items
    const levelBonus = Math.min(charLevel / 10, 5); // 0-5 bonus based on level
    const RARITY_WEIGHTS = [
      Math.max(15, 50 - levelBonus * 3),   // common
      Math.max(10, 30 - levelBonus),        // uncommon
      15 + levelBonus,                       // rare
      5 + levelBonus,                        // epic
      Math.min(3 + levelBonus * 0.5, 7),    // legendary
      Math.min(0.5 + levelBonus * 0.2, 2.5),// mythic
    ];
    const CONSUMABLES = [
      { name: "Health Potion", type: "consumable", stats: { hp_bonus: 50 }, rarity: "common" },
      { name: "Mana Potion", type: "consumable", stats: { mp_bonus: 30 }, rarity: "common" },
      { name: "Greater Health Potion", type: "consumable", stats: { hp_bonus: 150 }, rarity: "uncommon" },
      { name: "Elixir of Power", type: "consumable", stats: { hp_bonus: 300, mp_bonus: 100 }, rarity: "rare" },
    ];

    function pickRarity(): string {
      const totalWeight = RARITY_WEIGHTS.reduce((a, b) => a + b, 0);
      const roll = rng() * totalWeight;
      let sum = 0;
      for (let i = 0; i < RARITIES.length; i++) {
        sum += RARITY_WEIGHTS[i];
        if (roll < sum) return RARITIES[i];
      }
      return "common";
    }

    const items: any[] = [];
    for (let i = 0; i < 6; i++) {
      const rarity = pickRarity();
      const item = generateShopItem(charLevel, charClass, rarity, rng);
      items.push({
        id: `shop_${actualSeed}_${i}`,
        ...item,
        description: `Level ${item.item_level} ${rarity} ${item.type}`,
      });
    }
    for (let c = 0; c < 2; c++) {
      const con = CONSUMABLES[Math.floor(rng() * CONSUMABLES.length)];
      const price = Math.floor((30 + charLevel * 5) * (con.rarity === "uncommon" ? 2 : 1));
      items.push({
        id: `shop_${actualSeed}_con_${c}`,
        name: con.name,
        type: con.type,
        rarity: con.rarity,
        stats: con.stats,
        buy_price: price,
        sell_price: Math.floor(price * 0.3),
        description: con.name,
      });
    }

    sendSuccess(res, { items, refreshes_at: refreshesAt, gemsSpent });
  } catch (err: any) {
    req.log.error({ err }, "getShopRotation error");
    sendError(res, 500, err.message);
  }
});

function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

router.post("/functions/manageDailyQuests", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const now = new Date();

    // Expire old daily quests that have passed their expiry or are older than 24h without expiry
    const existing = await db.select().from(questsTable).where(
      and(eq(questsTable.characterId, characterId), eq(questsTable.type, "daily"))
    );
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    for (const q of existing) {
      if (q.status !== "active") continue;
      const expired = q.expiresAt ? new Date(q.expiresAt) < now : new Date(q.createdAt) < oneDayAgo;
      if (expired) {
        await db.update(questsTable).set({ status: "expired" }).where(eq(questsTable.id, q.id));
        q.status = "expired";
      }
    }

    const activeQuests = existing.filter(q => q.status === "active");
    if (activeQuests.length >= 3) {
      sendSuccess(res, { quests: activeQuests }); return;
    }

    // Calculate next midnight UTC for daily expiry
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const questTemplates = [
      { title: "Monster Slayer", description: "Kill 10 enemies", type: "daily", objectiveType: "combat_kills", target: 10, reward: { gold: 200, exp: 100 } },
      { title: "Gold Hoarder", description: "Earn 500 gold", type: "daily", objectiveType: "gold_earned", target: 500, reward: { gold: 300, gems: 1 } },
      { title: "Level Up", description: "Gain a level", type: "daily", objectiveType: "level_up", target: 1, reward: { gold: 500, gems: 2 } },
    ];
    const existingTitles = new Set(activeQuests.map(q => q.title));
    const newQuests = [];
    for (const template of questTemplates) {
      if (activeQuests.length + newQuests.length >= 3) break;
      if (existingTitles.has(template.title)) continue;
      const [quest] = await db.insert(questsTable).values({
        characterId,
        type: template.type,
        title: template.title,
        description: template.description,
        objective: { type: template.objectiveType },
        target: template.target,
        reward: template.reward,
        status: "active",
        expiresAt: tomorrow,
      }).returning();
      newQuests.push(quest);
    }
    sendSuccess(res, { quests: [...activeQuests, ...newQuests] });
  } catch (err: any) {
    req.log.error({ err }, "manageDailyQuests error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/updateQuestProgress", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, questType, objectiveType, amount } = req.body;
    const quests = await db.select().from(questsTable).where(eq(questsTable.characterId, characterId));
    const active = quests.filter(q => q.status === "active");
    const targetType = objectiveType || questType;
    for (const quest of active) {
      const objType = (quest.objective as any)?.type || quest.type;
      if (targetType && objType !== targetType) continue;
      const newProgress = Math.min((quest.progress || 0) + (amount || 1), quest.target);
      const newStatus = newProgress >= quest.target ? "completed" : "active";
      await db.update(questsTable).set({ progress: newProgress, status: newStatus }).where(eq(questsTable.id, quest.id));
    }
    sendSuccess(res, { success: true });
  } catch (err: any) {
    req.log.error({ err }, "updateQuestProgress error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/lifeSkills", async (req: Request, res: Response) => {
  try {
    const { characterId, character_id, action, skillType, skill_type, upgradeType, upgrade_type, process_type, recipe_input, quantity } = req.body;
    const charId = characterId || character_id;
    const sType = skill_type || skillType;
    const uType = upgrade_type || upgradeType;

    if (!(await requireCharacterOwner(req, res, charId))) return;

    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, charId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    const lifeSkills = ensureLifeSkills((char.lifeSkills as any) || {});

    if (action === "get_skills" || action === "getState") {
      const resources = await db.select().from(resourcesTable).where(eq(resourcesTable.characterId, charId));
      const clientResources = resources.map(r => ({
        id: r.id,
        resource_type: r.type,
        rarity: r.name,
        quantity: r.quantity,
        character_id: r.characterId,
      }));
      await db.update(charactersTable).set({ lifeSkills }).where(eq(charactersTable.id, charId));
      sendSuccess(res, {
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
          resources: clientResources,
          processing: buildProcessingResponse(lifeSkills),
        });
      return;
    }

    if (action === "start") {
      for (const st of SKILL_TYPES) lifeSkills[st].is_active = false;
      if (lifeSkills[sType]) {
        lifeSkills[sType].is_active = true;
        lifeSkills[sType].gather_progress = 0;
      }
      await db.update(charactersTable).set({ lifeSkills }).where(eq(charactersTable.id, charId));
      sendSuccess(res, {
          success: true,
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
        });
      return;
    }

    if (action === "stop") {
      if (lifeSkills[sType]) {
        lifeSkills[sType].is_active = false;
        lifeSkills[sType].gather_progress = 0;
      }
      await db.update(charactersTable).set({ lifeSkills }).where(eq(charactersTable.id, charId));
      sendSuccess(res, {
          success: true,
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
        });
      return;
    }

    if (action === "tick") {
      const skill = lifeSkills[sType];
      if (!skill || !skill.is_active) {
        sendSuccess(res, { success: false, message: "Skill not active" }); return;
      }

      const cooldownKey = `${charId}_${sType}`;
      const lastTick = TICK_COOLDOWNS.get(cooldownKey) || 0;
      const now = Date.now();
      if (now - lastTick < MIN_TICK_INTERVAL_MS) {
        sendSuccess(res, { success: false, message: "Too fast" }); return;
      }
      TICK_COOLDOWNS.set(cooldownKey, now);

      const dropTable = LIFE_SKILL_DROPS[sType] || [];
      const luckBonus = 1 + ((skill.luck_level || 1) - 1) * 0.15;
      const droppedResources: any[] = [];

      const numDrops = 1 + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.1 ? 1 : 0);
      for (let i = 0; i < numDrops; i++) {
        const drop = rollDrop(dropTable, luckBonus);
        if (drop) droppedResources.push(drop);
      }

      for (const drop of droppedResources) {
        const existing = await db.select().from(resourcesTable)
          .where(and(
            eq(resourcesTable.characterId, charId),
            eq(resourcesTable.type, drop.resource),
            eq(resourcesTable.name, drop.rarity),
          ));
        if (existing.length > 0) {
          await db.update(resourcesTable)
            .set({ quantity: (existing[0].quantity || 0) + 1 })
            .where(eq(resourcesTable.id, existing[0].id));
        } else {
          await db.insert(resourcesTable).values({
            characterId: charId,
            type: drop.resource,
            name: drop.rarity,
            quantity: 1,
          });
        }
      }

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
      lifeSkills[sType] = skill;
      await db.update(charactersTable).set({ lifeSkills }).where(eq(charactersTable.id, charId));

      sendSuccess(res, {
          success: true,
          resources: droppedResources,
          leveled_up: leveledUp,
          new_level: newLevel,
        });
      return;
    }

    if (action === "upgrade") {
      const skill = lifeSkills[sType];
      if (!skill) { sendSuccess(res, { success: false, message: "Unknown skill" }); return; }

      if (uType === "speed") {
        if ((skill.speed_level || 1) >= 10) { sendSuccess(res, { success: false, message: "Max speed level" }); return; }
        const cost = (skill.speed_level || 1) * 50;
        if ((char.gold || 0) < cost) { sendSuccess(res, { success: false, message: "Not enough gold" }); return; }
        skill.speed_level = (skill.speed_level || 1) + 1;
        lifeSkills[sType] = skill;
        await db.update(charactersTable).set({
          lifeSkills,
          gold: (char.gold || 0) - cost,
        }).where(eq(charactersTable.id, charId));
        sendSuccess(res, { success: true, gold_spent: cost, new_speed_level: skill.speed_level });
        return;
      }

      if (uType === "luck" || uType === "xp_boost") {
        if ((skill.luck_level || 1) >= 10) { sendSuccess(res, { success: false, message: "Max level" }); return; }
        const cost = (skill.luck_level || 1) * 80;
        if ((char.gold || 0) < cost) { sendSuccess(res, { success: false, message: "Not enough gold" }); return; }
        skill.luck_level = (skill.luck_level || 1) + 1;
        lifeSkills[sType] = skill;
        await db.update(charactersTable).set({
          lifeSkills,
          gold: (char.gold || 0) - cost,
        }).where(eq(charactersTable.id, charId));
        sendSuccess(res, { success: true, gold_spent: cost, new_luck_level: skill.luck_level, new_xp_boost_level: skill.luck_level });
        return;
      }

      sendSuccess(res, { success: false, message: "Unknown upgrade type" });
      return;
    }

    if (action === "process") {
      const recipeGroup = PROCESSING_RECIPES[process_type];
      if (!recipeGroup) { sendSuccess(res, { success: false, message: "Unknown process type" }); return; }

      const reqSkill = recipeGroup.requires_skill;
      const reqLevel = recipeGroup.requires_level;
      if ((lifeSkills[reqSkill]?.level || 1) < reqLevel) {
        sendSuccess(res, { success: false, message: `Requires ${reqSkill} level ${reqLevel}` }); return;
      }

      const recipe = recipeGroup.recipes.find((r: any) => r.input === recipe_input);
      if (!recipe) { sendSuccess(res, { success: false, message: "Recipe not found" }); return; }
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      if (!Number.isFinite(qty) || qty < 1 || qty > 9999) {
        sendSuccess(res, { success: false, message: "Invalid quantity" }); return;
      }

      const inputRows = await db.select().from(resourcesTable).where(and(
        eq(resourcesTable.characterId, charId),
        eq(resourcesTable.type, recipe.input),
        eq(resourcesTable.name, recipe.rarity),
      ));
      if (inputRows.length === 0 || inputRows[0].quantity < qty) {
        sendSuccess(res, { success: false, message: "Not enough resources" }); return;
      }

      await db.update(resourcesTable)
        .set({ quantity: inputRows[0].quantity - qty })
        .where(eq(resourcesTable.id, inputRows[0].id));

      const outputRows = await db.select().from(resourcesTable).where(and(
        eq(resourcesTable.characterId, charId),
        eq(resourcesTable.type, recipe.output),
        eq(resourcesTable.name, recipe.rarity),
      ));
      if (outputRows.length > 0) {
        await db.update(resourcesTable)
          .set({ quantity: (outputRows[0].quantity || 0) + qty })
          .where(eq(resourcesTable.id, outputRows[0].id));
      } else {
        await db.insert(resourcesTable).values({
          characterId: charId,
          type: recipe.output,
          name: recipe.rarity,
          quantity: qty,
        });
      }

      sendSuccess(res, { success: true });
      return;
    }

    sendSuccess(res, { life_skills: lifeSkills });
  } catch (err: any) {
    req.log.error({ err }, "lifeSkills error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/processGemLab", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    let [lab] = await db.select().from(gemLabsTable).where(eq(gemLabsTable.characterId, characterId));
    if (!lab) {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const legacy = (char?.gemLab as any) || {};
      [lab] = await db.insert(gemLabsTable).values({
        characterId,
        data: {
          production_level: legacy?.level ? Math.max(0, legacy.level - 1) : 0,
          speed_level: 0, efficiency_level: 0,
          pending_gems: legacy?.gems_stored || 0,
          total_gems_generated: legacy?.gems_stored || 0,
          last_collection_time: new Date().toISOString(),
        },
      }).returning();
    }
    const cfg = await getGameConfig();
    const ecoCfg = cfg.ECONOMY;
    const labData = (lab.data as any) || {};
    const BASE_PRODUCTION = ecoCfg.GEM_LAB_BASE_RATE || 0.001;
    const prodMult = 1 + (labData.production_level || 0) * (ecoCfg.GEM_LAB_PRODUCTION_BONUS || 0.05);
    const speedMult = 1 + (labData.speed_level || 0) * (ecoCfg.GEM_LAB_SPEED_REDUCTION || 0.02);
    const effMult = 1 + (labData.efficiency_level || 0) * (ecoCfg.GEM_LAB_EFFICIENCY_BONUS || 0.03);
    const gemsPerCycle = BASE_PRODUCTION * prodMult * effMult;
    const cycleSeconds = (10 / speedMult) * 60;
    const now = Date.now();
    const lastProcess = labData.last_collection_time ? new Date(labData.last_collection_time).getTime() : now;
    const elapsedSeconds = Math.min((now - lastProcess) / 1000, 480 * 60);
    const completedCycles = Math.floor(elapsedSeconds / cycleSeconds);
    const gemsGenerated = gemsPerCycle * completedCycles;
    if (completedCycles > 0) {
      labData.pending_gems = (labData.pending_gems || 0) + gemsGenerated;
      labData.total_gems_generated = (labData.total_gems_generated || 0) + gemsGenerated;
      const advanceMs = completedCycles * cycleSeconds * 1000;
      labData.last_collection_time = new Date(lastProcess + advanceMs).toISOString();
      await db.update(gemLabsTable).set({ data: labData }).where(eq(gemLabsTable.id, lab.id));
    }
    sendSuccess(res, { success: true, gemsGenerated, gemsPerCycle, cycleSeconds, offlineHours: (elapsedSeconds / 3600).toFixed(1) });
  } catch (err: any) {
    req.log.error({ err }, "processGemLab error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/claimGemLabGems", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [lab] = await db.select().from(gemLabsTable).where(eq(gemLabsTable.characterId, characterId));
    if (!lab) { sendSuccess(res, { success: false, claimedGems: 0, newTotal: 0 }); return; }
    const labData = (lab.data as any) || {};
    const gemsToAdd = Math.floor(labData.pending_gems || 0);
    if (gemsToAdd <= 0) { sendSuccess(res, { success: false, claimedGems: 0, newTotal: 0 }); return; }
    labData.pending_gems = 0;
    labData.last_collection_time = new Date().toISOString();
    await db.update(gemLabsTable).set({ data: labData }).where(eq(gemLabsTable.id, lab.id));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    const newTotal = (char?.gems || 0) + gemsToAdd;
    await db.update(charactersTable).set({ gems: newTotal }).where(eq(charactersTable.id, characterId));
    sendSuccess(res, { success: true, claimedGems: gemsToAdd, newTotal });
  } catch (err: any) {
    req.log.error({ err }, "claimGemLabGems error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/upgradeGemLab", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, upgradeType, count: rawCount } = req.body;
    const count = Math.min(Math.max(1, rawCount || 1), 100);
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    let [lab] = await db.select().from(gemLabsTable).where(eq(gemLabsTable.characterId, characterId));
    if (!lab) {
      [lab] = await db.insert(gemLabsTable).values({
        characterId,
        data: { production_level: 0, speed_level: 0, efficiency_level: 0, pending_gems: 0, total_gems_generated: 0, last_collection_time: new Date().toISOString() },
      }).returning();
    }
    const labData = (lab.data as any) || {};
    const levelKey = upgradeType === "production" ? "production_level" : upgradeType === "speed" ? "speed_level" : "efficiency_level";
    const currentLevel = labData[levelKey] || 0;
    // Calculate total cost for buying `count` levels
    let totalCost = 0;
    for (let i = 0; i < count; i++) {
      totalCost += Math.floor(1000 * Math.pow(1.15, currentLevel + i));
    }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char || (char.gold || 0) < totalCost) {
      sendSuccess(res, { success: false, error: "Not enough gold" }); return;
    }
    labData[levelKey] = currentLevel + count;
    await db.update(gemLabsTable).set({ data: labData }).where(eq(gemLabsTable.id, lab.id));
    await db.update(charactersTable).set({ gold: (char.gold || 0) - totalCost }).where(eq(charactersTable.id, char.id));
    sendSuccess(res, { success: true, upgradeType, levelsGained: count, goldRemaining: (char.gold || 0) - totalCost });
  } catch (err: any) {
    req.log.error({ err }, "upgradeGemLab error");
    sendError(res, 500, err.message);
  }
});

// Reset stat/skill points for gems
router.post("/functions/resetStatPoints", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, resetType } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const cost = resetType === "skills" ? 50 : 100;
    if ((char.gems || 0) < cost) {
      sendSuccess(res, { success: false, error: `Not enough gems (need ${cost})` }); return;
    }
    const updates: any = { gems: (char.gems || 0) - cost };
    if (resetType === "skills") {
      // Refund all skill points — reset skills array and restore skill points
      const totalSkillPoints = 3 * ((char.level || 1) - 1);
      updates.skillPoints = totalSkillPoints;
      updates.skills = [];
    } else {
      // Reset stat points — return all allocated stat points
      const totalStatPoints = 3 * ((char.level || 1) - 1);
      updates.statPoints = totalStatPoints;
      updates.strength = 10;
      updates.dexterity = 10;
      updates.intelligence = 10;
      updates.vitality = 10;
      updates.luck = 10;
      // Recalculate maxHp/maxMp with base stats
      updates.maxHp = Math.floor(100 + 10 * 8);
      updates.maxMp = Math.floor(50 + 10 * 3);
    }
    await db.update(charactersTable).set(updates).where(eq(charactersTable.id, characterId));
    const [updated] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    sendSuccess(res, { success: true, character: updated, gemsRemaining: (char.gems || 0) - cost });
  } catch (err: any) {
    req.log.error({ err }, "resetStatPoints error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/transmuteGold", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, amount } = req.body;
    if (!characterId) {
      sendSuccess(res, { rate: 1000, description: "1000 gold = 1 gem" }); return;
    }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const goldCost = (amount || 1) * 1000;
    if ((char.gold || 0) < goldCost) {
      sendSuccess(res, { success: false, message: "Not enough gold" }); return;
    }
    await db.update(charactersTable).set({
      gold: (char.gold || 0) - goldCost,
      gems: (char.gems || 0) + (amount || 1),
    }).where(eq(charactersTable.id, characterId));
    sendSuccess(res, { success: true, gold_spent: goldCost, gems_gained: amount || 1 });
  } catch (err: any) {
    req.log.error({ err }, "transmuteGold error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/completeTrade", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { trade_id, action: rawAction } = req.body;
    const action = rawAction || "accept";
    let tradeTable = tradeSessionsTable;
    let [trade] = await db.select().from(tradeSessionsTable).where(eq(tradeSessionsTable.id, trade_id));
    if (!trade) {
      const [legacyTrade] = await db.select().from(tradesTable).where(eq(tradesTable.id, trade_id));
      if (!legacyTrade) { sendSuccess(res, { success: false, message: "Trade not found" }); return; }
      const newStatus = action === "accept" ? "completed" : "cancelled";
      await db.update(tradesTable).set({ status: newStatus }).where(eq(tradesTable.id, trade_id));
      if (action === "accept") {
        const fromChar = await db.select().from(charactersTable).where(eq(charactersTable.id, legacyTrade.fromCharacterId));
        const toChar = legacyTrade.toCharacterId ? await db.select().from(charactersTable).where(eq(charactersTable.id, legacyTrade.toCharacterId)) : [];
        if (fromChar[0] && toChar[0]) {
          await db.update(charactersTable).set({
            gold: (fromChar[0].gold || 0) + (legacyTrade.requestedGold || 0) - (legacyTrade.offeredGold || 0),
          }).where(eq(charactersTable.id, legacyTrade.fromCharacterId));
          await db.update(charactersTable).set({
            gold: (toChar[0].gold || 0) - (legacyTrade.requestedGold || 0) + (legacyTrade.offeredGold || 0),
          }).where(eq(charactersTable.id, legacyTrade.toCharacterId!));
        }
      }
      sendSuccess(res, { success: true, trade_id, status: action === "accept" ? "completed" : "cancelled" });
      return;
    }

    const newStatus = action === "accept" ? "completed" : "cancelled";
    await db.update(tradeSessionsTable).set({ status: newStatus }).where(eq(tradeSessionsTable.id, trade_id));
    sendSuccess(res, { success: true, trade_id, status: newStatus });
  } catch (err: any) {
    req.log.error({ err }, "completeTrade error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/manageParty", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, partyId, targetCharacterId, targetName, inviteId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    if (action === "create") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const [party] = await db.insert(partiesTable).values({
        leaderId: characterId,
        leaderName: char?.name || "Unknown",
        members: [{ character_id: characterId, name: char?.name || "Unknown", class: char?.class, level: char?.level }],
        status: "open",
      }).returning();
      sendSuccess(res, { success: true, party });
      return;
    }

    if (action === "invite") {
      const [fromChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      let resolvedTargetId = targetCharacterId;
      const trimmedName = targetName?.trim();
      if (trimmedName) {
        // Try exact match first, then partial match
        let matches = await db.select().from(charactersTable).where(sql`LOWER(${charactersTable.name}) = LOWER(${trimmedName})`);
        if (matches.length === 0) {
          const pattern = `%${trimmedName}%`;
          matches = await db.select().from(charactersTable).where(sql`LOWER(${charactersTable.name}) LIKE LOWER(${pattern})`);
        }
        if (matches.length > 0) resolvedTargetId = matches[0].id;
        else { sendError(res, 404, `Player "${trimmedName}" not found`); return; }
      }
      if (!resolvedTargetId) { sendError(res, 400, "No target specified"); return; }
      if (resolvedTargetId === characterId) { sendError(res, 400, "Cannot invite yourself"); return; }
      const [targetChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, resolvedTargetId));
      if (!targetChar) { sendError(res, 404, "Player not found"); return; }

      // Auto-find or auto-create a party if partyId not provided
      let resolvedPartyId = partyId;
      if (!resolvedPartyId) {
        // Look for an existing active party led by this player
        const ledParties = await db.select().from(partiesTable).where(
          sql`${partiesTable.leaderId} = ${characterId} AND ${partiesTable.status} != 'disbanded'`
        );
        if (ledParties.length > 0) {
          resolvedPartyId = ledParties[0].id;
        } else {
          // Check if player is a member of any active party
          const allParties = await db.select().from(partiesTable).where(sql`${partiesTable.status} != 'disbanded'`);
          const memberParty = allParties.find((p: any) => (p.members as any[])?.some((m: any) => m.character_id === characterId));
          if (memberParty) {
            resolvedPartyId = memberParty.id;
          } else {
            // Auto-create a party for the inviter
            const [newParty] = await db.insert(partiesTable).values({
              leaderId: characterId,
              leaderName: fromChar?.name || "Unknown",
              members: [{ character_id: characterId, name: fromChar?.name || "Unknown", class: fromChar?.class, level: fromChar?.level }],
              status: "open",
            }).returning();
            resolvedPartyId = newParty.id;
          }
        }
      }

      const [invite] = await db.insert(partyInvitesTable).values({
        partyId: resolvedPartyId,
        fromCharacterId: characterId,
        fromCharacterName: fromChar?.name || "Unknown",
        toCharacterId: resolvedTargetId,
        status: "pending",
      }).returning();
      sendSuccess(res, { success: true, invite, partyId: resolvedPartyId });
      return;
    }

    if (action === "accept" && inviteId) {
      const [inv] = await db.select().from(partyInvitesTable).where(eq(partyInvitesTable.id, inviteId));
      if (!inv || inv.status !== "pending") { sendSuccess(res, { success: false, message: "Invite not found or expired" }); return; }
      if (inv.toCharacterId !== characterId) { sendSuccess(res, { success: false, message: "This invite is not for you" }); return; }
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, inv.partyId));
      if (!party) { sendSuccess(res, { success: false, message: "Party no longer exists" }); return; }
      const members = (party.members as any[]) || [];
      if (members.length >= (party.maxMembers || 6)) {
        await db.update(partyInvitesTable).set({ status: "expired" }).where(eq(partyInvitesTable.id, inviteId));
        sendSuccess(res, { success: false, message: "Party is full" }); return;
      }
      if (members.some((m: any) => m.character_id === characterId)) {
        await db.update(partyInvitesTable).set({ status: "accepted" }).where(eq(partyInvitesTable.id, inviteId));
        sendSuccess(res, { success: true, message: "Already in party" }); return;
      }

      // Remove player from any existing party before joining the new one
      const allActiveParties = await db.select().from(partiesTable).where(sql`${partiesTable.status} != 'disbanded'`);
      for (const oldParty of allActiveParties) {
        if (oldParty.id === inv.partyId) continue;
        const oldMembers = (oldParty.members as any[]) || [];
        if (oldMembers.some((m: any) => m.character_id === characterId)) {
          const filtered = oldMembers.filter((m: any) => m.character_id !== characterId);
          if (filtered.length === 0) {
            await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, oldParty.id));
          } else {
            const updateData: any = { members: filtered };
            if (oldParty.leaderId === characterId) {
              updateData.leaderId = filtered[0].character_id;
              updateData.leaderName = filtered[0].name;
            }
            await db.update(partiesTable).set(updateData).where(eq(partiesTable.id, oldParty.id));
          }
        }
      }

      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      members.push({ character_id: characterId, name: char?.name || "Unknown", class: char?.class, level: char?.level });
      await db.update(partiesTable).set({ members }).where(eq(partiesTable.id, inv.partyId));
      await db.update(partyInvitesTable).set({ status: "accepted" }).where(eq(partyInvitesTable.id, inviteId));
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "decline" && inviteId) {
      const [inv] = await db.select().from(partyInvitesTable).where(eq(partyInvitesTable.id, inviteId));
      if (inv && inv.toCharacterId !== characterId) { sendSuccess(res, { success: false, message: "This invite is not for you" }); return; }
      await db.update(partyInvitesTable).set({ status: "declined" }).where(eq(partyInvitesTable.id, inviteId));
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "join" && partyId) {
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { sendSuccess(res, { success: false, message: "Party not found" }); return; }
      const members = (party.members as any[]) || [];
      if (members.length >= (party.maxMembers || 6)) {
        sendSuccess(res, { success: false, message: "Party is full" }); return;
      }
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      members.push({ character_id: characterId, name: char?.name || "Unknown", class: char?.class, level: char?.level });
      await db.update(partiesTable).set({ members }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "leave" && partyId) {
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (party) {
        const members = ((party.members as any[]) || []).filter((m: any) => m.character_id !== characterId);
        if (members.length === 0) {
          await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, partyId));
        } else {
          const updateData: any = { members };
          if (party.leaderId === characterId) {
            updateData.leaderId = members[0].character_id;
            updateData.leaderName = members[0].name;
          }
          await db.update(partiesTable).set(updateData).where(eq(partiesTable.id, partyId));
        }
      }
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "disband" && partyId) {
      await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "manageParty error");
    sendError(res, 500, err.message);
  }
});

// ── Shared Party Battle: sync enemy HP across party members ──────────────
router.post("/functions/partyBattleAction", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { action, partyId, characterId, enemyData, damage, characterName, skillName, isCrit } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    if (action === "spawn_enemy" && partyId) {
      // Leader spawns a shared enemy — store in party extraData
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { sendError(res, 404, "Party not found"); return; }
      if (party.leaderId !== characterId) { sendError(res, 403, "Only the leader can spawn enemies"); return; }
      const extra = (party.extraData as any) || {};
      // Preserve killed enemy so non-leaders can still claim rewards after new spawn
      if (extra.shared_enemy?.killed_by) {
        extra.last_killed_enemy = extra.shared_enemy;
      }
      extra.shared_enemy = {
        ...enemyData,
        currentHp: enemyData.maxHp,
        spawned_at: new Date().toISOString(),
        killed_by: null,
        claimed_by: [],
      };
      await db.update(partiesTable).set({ extraData: extra }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true, shared_enemy: extra.shared_enemy });
      return;
    }

    if (action === "report_damage" && partyId) {
      // Member reports damage dealt — atomically decrement shared enemy HP
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { sendError(res, 404, "Party not found"); return; }
      const extra = (party.extraData as any) || {};
      if (!extra.shared_enemy || extra.shared_enemy.killed_by) {
        sendSuccess(res, { success: false, message: "No active shared enemy" });
        return;
      }
      const oldHp = extra.shared_enemy.currentHp;
      const newHp = Math.max(0, oldHp - (damage || 0));
      extra.shared_enemy.currentHp = newHp;
      if (newHp <= 0) {
        extra.shared_enemy.killed_by = characterId;
        // Look up killer's name for display
        const [killer] = await db.select({ name: charactersTable.name }).from(charactersTable).where(eq(charactersTable.id, characterId));
        extra.shared_enemy.killed_by_name = killer?.name || "Unknown";
      }
      await db.update(partiesTable).set({ extraData: extra }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, {
        success: true,
        currentHp: newHp,
        killed: newHp <= 0,
        shared_enemy: extra.shared_enemy,
      });
      return;
    }

    if (action === "get_enemy" && partyId) {
      // Poll current shared enemy state
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { sendError(res, 404, "Party not found"); return; }
      const extra = (party.extraData as any) || {};
      sendSuccess(res, {
        success: true,
        shared_enemy: extra.shared_enemy || null,
        last_killed_enemy: extra.last_killed_enemy || null,
      });
      return;
    }

    if (action === "claim_reward" && partyId) {
      // Party member claims reward after shared enemy killed
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { sendError(res, 404, "Party not found"); return; }
      const extra = (party.extraData as any) || {};
      // Check current shared_enemy first, then last_killed_enemy as fallback
      // (leader may have already spawned next enemy, overwriting shared_enemy)
      let target = null;
      let targetKey = "";
      if (extra.shared_enemy?.killed_by) {
        target = extra.shared_enemy;
        targetKey = "shared_enemy";
      } else if (extra.last_killed_enemy?.killed_by) {
        target = extra.last_killed_enemy;
        targetKey = "last_killed_enemy";
      }
      if (!target) {
        sendSuccess(res, { success: false, message: "Enemy not killed yet" });
        return;
      }
      const claimed = target.claimed_by || [];
      if (claimed.includes(characterId)) {
        sendSuccess(res, { success: false, message: "Already claimed" });
        return;
      }
      claimed.push(characterId);
      target.claimed_by = claimed;
      (extra as any)[targetKey] = target;
      await db.update(partiesTable).set({ extraData: extra }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true, claimed: true });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "partyBattleAction error");
    sendError(res, 500, err.message);
  }
});

// ── Cleanup on disconnect (called via sendBeacon on tab close) ──────────
router.post("/functions/cleanupOnDisconnect", async (req: Request, res: Response) => {
  try {
    const { characterId, token } = req.body;
    if (!characterId || !token) { sendSuccess(res, { ok: true }); return; }

    // Verify token ownership (lightweight check)
    // For sendBeacon, auth middleware may not work — we pass token in body
    // Just do basic validation: character must exist
    const [char] = await db.select({ id: charactersTable.id }).from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendSuccess(res, { ok: true }); return; }

    // Set presence to offline
    await db.update(presencesTable).set({ status: "offline" }).where(eq(presencesTable.characterId, characterId));

    // Remove from any active party
    const allParties = await db.select().from(partiesTable).where(sql`${partiesTable.status} != 'disbanded'`);
    for (const party of allParties) {
      const members = (party.members as any[]) || [];
      const idx = members.findIndex((m: any) => m.character_id === characterId);
      if (idx === -1) continue;

      members.splice(idx, 1);
      if (members.length === 0) {
        await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, party.id));
      } else {
        const updateData: any = { members };
        if (party.leaderId === characterId) {
          updateData.leaderId = members[0].character_id;
        }
        await db.update(partiesTable).set(updateData).where(eq(partiesTable.id, party.id));
      }
      break; // A character can only be in one party
    }

    sendSuccess(res, { ok: true });
  } catch (err: any) {
    // Don't fail beacon requests — just log
    console.error("cleanupOnDisconnect error:", err?.message);
    sendSuccess(res, { ok: true });
  }
});

router.post("/functions/manageFriends", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, targetCharacterId, requestId } = req.body;

    if (action === "send") {
      const existing = await db.select().from(friendRequestsTable).where(and(
        eq(friendRequestsTable.fromCharacterId, characterId),
        eq(friendRequestsTable.toCharacterId, targetCharacterId),
      ));
      if (existing.length > 0 && existing[0].status === "pending") {
        sendSuccess(res, { success: false, message: "Request already pending" }); return;
      }
      const [request] = await db.insert(friendRequestsTable).values({
        fromCharacterId: characterId,
        toCharacterId: targetCharacterId,
        status: "pending",
      }).returning();
      sendSuccess(res, { success: true, request });
      return;
    }

    if (action === "accept" && requestId) {
      const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, requestId));
      if (!request) { sendSuccess(res, { success: false, message: "Request not found" }); return; }
      await db.update(friendRequestsTable).set({ status: "accepted" }).where(eq(friendRequestsTable.id, requestId));
      const [friendship] = await db.insert(friendshipsTable).values({
        characterId1: request.fromCharacterId!,
        characterId2: request.toCharacterId!,
      }).returning();
      sendSuccess(res, { success: true, friendship });
      return;
    }

    if (action === "decline" && requestId) {
      await db.update(friendRequestsTable).set({ status: "declined" }).where(eq(friendRequestsTable.id, requestId));
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "remove" && targetCharacterId) {
      await db.delete(friendshipsTable).where(
        or(
          and(eq(friendshipsTable.characterId1, characterId), eq(friendshipsTable.characterId2, targetCharacterId)),
          and(eq(friendshipsTable.characterId2, characterId), eq(friendshipsTable.characterId1, targetCharacterId)),
        )
      );
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "list") {
      const friendships = await db.select().from(friendshipsTable).where(
        or(eq(friendshipsTable.characterId1, characterId), eq(friendshipsTable.characterId2, characterId))
      );
      const friendIds = friendships.map(f =>
        f.characterId1 === characterId ? f.characterId2 : f.characterId1
      ).filter(Boolean);
      const friends = [];
      for (const fid of friendIds) {
        const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, fid!));
        if (char) friends.push(toClientCharacter(char));
      }
      sendSuccess(res, { friends });
      return;
    }

    sendSuccess(res, { success: true });
  } catch (err: any) {
    req.log.error({ err }, "manageFriends error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/getLeaderboard", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { type } = req.body;
    let chars;
    if (type === "kills") {
      chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.totalKills)).limit(50);
    } else if (type === "prestige") {
      chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.prestigeLevel)).limit(50);
    } else {
      chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.level)).limit(50);
    }
    const leaderboard = chars.map((c, i) => ({
      rank: i + 1,
      id: c.id,
      name: c.name,
      class: c.class,
      level: c.level,
      gold: c.gold,
      gems: c.gems,
      title: c.title,
      hp: c.hp,
      max_hp: c.maxHp,
      strength: c.strength,
      dexterity: c.dexterity,
      intelligence: c.intelligence,
      vitality: c.vitality,
      luck: c.luck,
      total_kills: c.totalKills,
      total_damage: c.totalDamage,
      prestige_level: c.prestigeLevel,
      guild_id: c.guildId,
      created_by: c.createdBy,
      equipment: c.equipment,
      is_banned: c.isBanned,
      is_muted: c.isMuted,
    }));
    sendSuccess(res, { leaderboard });
  } catch (err: any) {
    req.log.error({ err }, "getLeaderboard error");
    sendError(res, 500, err.message);
  }
});

// Dungeon boss data keyed by dungeon ID — bosses have meaningful HP pools,
// armor/resistance to make fights last longer, and elemental affinities
const DUNGEON_BOSSES: Record<string, {
  name: string; hpBase: number; hpPerLevel: number; dmgBase: number; dmgPerLevel: number;
  armor: number; armorPerLevel: number; dungeonName: string;
  element: string; weakness: string; resistance: string;
}> = {
  inferno_keep: { name: "Flame Tyrant", hpBase: 5000, hpPerLevel: 300, dmgBase: 25, dmgPerLevel: 5, armor: 5, armorPerLevel: 2, dungeonName: "Inferno Keep", element: "fire", weakness: "ice", resistance: "fire" },
  frost_citadel: { name: "Frost Warden", hpBase: 10000, hpPerLevel: 500, dmgBase: 40, dmgPerLevel: 8, armor: 10, armorPerLevel: 3, dungeonName: "Frost Citadel", element: "ice", weakness: "fire", resistance: "ice" },
  void_sanctum: { name: "Void Reaper", hpBase: 20000, hpPerLevel: 800, dmgBase: 60, dmgPerLevel: 12, armor: 15, armorPerLevel: 4, dungeonName: "Void Sanctum", element: "blood", weakness: "lightning", resistance: "blood" },
  storm_peak: { name: "Storm Colossus", hpBase: 35000, hpPerLevel: 1200, dmgBase: 80, dmgPerLevel: 16, armor: 20, armorPerLevel: 5, dungeonName: "Storm Peak", element: "lightning", weakness: "poison", resistance: "lightning" },
  poison_swamp: { name: "Plague Matriarch", hpBase: 15000, hpPerLevel: 600, dmgBase: 50, dmgPerLevel: 10, armor: 12, armorPerLevel: 3, dungeonName: "Plague Swamp", element: "poison", weakness: "fire", resistance: "poison" },
  sand_tomb: { name: "Sand King", hpBase: 28000, hpPerLevel: 1000, dmgBase: 70, dmgPerLevel: 14, armor: 18, armorPerLevel: 4, dungeonName: "Sand Tomb of Kings", element: "sand", weakness: "ice", resistance: "sand" },
};

// Dungeon entry limits: 5 entries per 8 hours
const DUNGEON_MAX_ENTRIES = 5;
const DUNGEON_RESET_COST = 500;
const DUNGEON_WINDOW_MS = 8 * 60 * 60 * 1000;

// Skill data for damage multipliers (mirrored from frontend skillData.js)
const SKILL_DATA: Record<string, { damage: number; mp: number }> = {
  // ── Warrior ──
  w_basic_strike: { damage: 1.3, mp: 18 }, w_shield_block: { damage: 0, mp: 22 },
  w_power_strike: { damage: 1.8, mp: 32 }, w_flame_slash: { damage: 1.5, mp: 35 },
  w_shield_bash: { damage: 1.5, mp: 42 }, w_war_cry: { damage: 0, mp: 40 },
  w_rage: { damage: 2.2, mp: 55 }, w_blood_rage: { damage: 1.7, mp: 48 },
  w_whirlwind: { damage: 1.7, mp: 65 }, w_taunt: { damage: 0, mp: 45 },
  w_ground_slam: { damage: 2.5, mp: 75 }, w_thunder_strike: { damage: 2.0, mp: 70 },
  w_bulwark: { damage: 0, mp: 85 }, w_avatar: { damage: 3.0, mp: 110 },
  w_juggernaut: { damage: 2.8, mp: 100 }, w_sand_veil: { damage: 1.5, mp: 90 },
  w_titan_form: { damage: 0, mp: 140 }, w_armageddon: { damage: 5.0, mp: 160 },
  w_eternal_guard: { damage: 3.5, mp: 130 },
  // ── Mage ──
  m_magic_bolt: { damage: 1.4, mp: 22 }, m_frost_armor: { damage: 0, mp: 28 },
  m_fireball: { damage: 1.9, mp: 38 }, m_poison_bolt: { damage: 1.2, mp: 30 },
  m_ice_lance: { damage: 1.6, mp: 48 }, m_mana_shield: { damage: 0, mp: 55 },
  m_arcane_burst: { damage: 2.4, mp: 65 }, m_lightning_bolt: { damage: 1.8, mp: 45 },
  m_blizzard: { damage: 2.0, mp: 85 }, m_flame_wall: { damage: 1.8, mp: 80 },
  m_time_warp: { damage: 0, mp: 75 }, m_meteor: { damage: 3.0, mp: 100 },
  m_black_hole: { damage: 2.5, mp: 110 }, m_arcane_nova: { damage: 3.2, mp: 130 },
  m_blood_pact: { damage: 2.0, mp: 95 }, m_chrono_rift: { damage: 0, mp: 100 },
  m_ice_prison: { damage: 2.2, mp: 105 },
  m_singularity: { damage: 4.0, mp: 150 }, m_genesis: { damage: 3.5, mp: 140 },
  m_apocalypse: { damage: 6.0, mp: 180 },
  // ── Ranger ──
  r_quick_shot: { damage: 1.2, mp: 15 }, r_dodge_roll: { damage: 0, mp: 20 },
  r_poison_shot: { damage: 1.0, mp: 22 }, r_fire_arrow: { damage: 1.4, mp: 28 },
  r_triple_shot: { damage: 1.5, mp: 40 }, r_frost_arrow: { damage: 1.3, mp: 35 },
  r_multishot: { damage: 2.2, mp: 60 }, r_lightning_arrow: { damage: 1.8, mp: 52 },
  r_eagle_eye: { damage: 0, mp: 45 }, r_traps: { damage: 1.5, mp: 55 },
  r_sand_trap: { damage: 1.4, mp: 50 }, r_arrow_rain: { damage: 2.5, mp: 80 },
  r_hunters_mark: { damage: 0, mp: 70 }, r_blood_arrow: { damage: 2.0, mp: 75 },
  r_volley: { damage: 2.8, mp: 100 }, r_shadow_step: { damage: 1.8, mp: 85 },
  r_death_arrow: { damage: 4.0, mp: 130 }, r_storm_bow: { damage: 4.5, mp: 150 },
  r_wrath_of_hunt: { damage: 5.0, mp: 160 },
  // ── Rogue ──
  ro_quick_slash: { damage: 1.3, mp: 16 }, ro_smoke_bomb: { damage: 0, mp: 22 },
  ro_poison_blade: { damage: 1.1, mp: 20 }, ro_backstab: { damage: 2.0, mp: 32 },
  ro_open_wounds: { damage: 1.5, mp: 38 }, ro_pickpocket: { damage: 0, mp: 30 },
  ro_frost_strike: { damage: 1.4, mp: 35 }, ro_lightning_step: { damage: 1.8, mp: 48 },
  ro_blade_dance: { damage: 1.8, mp: 60 }, ro_garrote: { damage: 1.6, mp: 55 },
  ro_sand_blind: { damage: 1.3, mp: 50 }, ro_shadow_strike: { damage: 2.5, mp: 75 },
  ro_blood_frenzy: { damage: 2.2, mp: 85 }, ro_death_mark: { damage: 2.0, mp: 80 },
  ro_assassinate: { damage: 3.5, mp: 110 }, ro_shadow_realm_entry: { damage: 2.0, mp: 90 },
  ro_oblivion: { damage: 4.0, mp: 130 }, ro_phantom: { damage: 3.5, mp: 125 },
  ro_reaper: { damage: 5.5, mp: 170 },
};

// Calculate full member stats including equipment for dungeon sessions
async function calculateDungeonMemberStats(charId: number, char: any) {
  let totalStr = char.strength || 10;
  let totalDex = char.dexterity || 8;
  let totalInt = char.intelligence || 5;
  let totalVit = char.vitality || 8;
  let totalLuck = char.luck || 5;
  let totalDef = char.defense || 0;
  let hpBonus = 0, mpBonus = 0, critChance = 0, critDmgPct = 0;
  let dmgBonus = 0, atkSpeed = 0, lifesteal = 0, evasion = 0, blockChance = 0;
  // Track elemental damage from gear
  const elemDmg: Record<string, number> = {};
  const ELEM_KEYS = ["fire_dmg", "ice_dmg", "lightning_dmg", "poison_dmg", "blood_dmg", "sand_dmg"];

  try {
    const equippedItems = await db.select().from(itemsTable).where(
      and(eq(itemsTable.ownerId, charId), eq((itemsTable as any).equipped, true))
    );
    for (const item of equippedItems) {
      const s = (item.stats as any) || {};
      totalStr += s.strength || 0;
      totalDex += s.dexterity || 0;
      totalInt += s.intelligence || 0;
      totalVit += s.vitality || 0;
      totalLuck += s.luck || 0;
      totalDef += s.defense || 0;
      hpBonus += s.hp_bonus || 0;
      mpBonus += s.mp_bonus || 0;
      critChance += s.crit_chance || 0;
      critDmgPct += s.crit_dmg_pct || 0;
      dmgBonus += s.damage || 0;
      atkSpeed += s.attack_speed || 0;
      lifesteal += s.lifesteal || 0;
      evasion += s.evasion || 0;
      blockChance += s.block_chance || 0;
      for (const ek of ELEM_KEYS) {
        if (s[ek]) elemDmg[ek] = (elemDmg[ek] || 0) + s[ek];
      }
    }
  } catch {}

  const level = char.level || 1;
  // HP formula mirrors frontend statSystem: base + vit scaling + hp_bonus + level
  const maxHp = Math.floor(100 + totalVit * 12 + hpBonus + level * 8);
  const maxMp = Math.floor(50 + totalInt * 5 + mpBonus + level * 3);

  return {
    character_id: charId,
    name: char.name || "Unknown",
    class: char.class || "warrior",
    level,
    hp: maxHp,
    max_hp: maxHp,
    mp: maxMp,
    max_mp: maxMp,
    strength: totalStr,
    dexterity: totalDex,
    intelligence: totalInt,
    vitality: totalVit,
    luck: totalLuck,
    defense: totalDef,
    damage: dmgBonus,
    crit_chance: critChance,
    crit_dmg_pct: critDmgPct,
    attack_speed: atkSpeed,
    lifesteal,
    evasion,
    block_chance: blockChance,
    elemental_damage: elemDmg,
  };
}

function buildSessionResponse(session: any): any {
  const d = (session.data as any) || {};
  return {
    id: session.id,
    dungeon_name: d.dungeon_name || "Unknown Dungeon",
    boss_name: d.boss_name || "Boss",
    boss_hp: d.boss_hp ?? 0,
    boss_max_hp: d.boss_max_hp ?? 0,
    boss_armor: d.boss_armor ?? 0,
    boss_element: d.boss_element || null,
    boss_weakness: d.boss_weakness || null,
    boss_resistance: d.boss_resistance || null,
    status: d.status || session.status || "waiting",
    members: d.members || [],
    current_turn_index: d.current_turn_index ?? 0,
    leader_id: d.leader_id || session.characterId,
    turn_deadline: d.turn_deadline || null,
    combat_log: d.combat_log || [],
  };
}

router.post("/functions/dungeonAction", async (req: Request, res: Response) => {
  try {
    const { characterId, action, dungeonId, sessionId, skillId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    // === RESET ENTRIES: spend gems to reset dungeon entry count ===
    if (action === "reset_entries") {
      const dungeonConfigKey = `dungeon_entries_${characterId}`;
      if ((char.gems || 0) < DUNGEON_RESET_COST) {
        sendError(res, 400, `Not enough gems. Need ${DUNGEON_RESET_COST} gems to reset dungeon entries.`);
        return;
      }
      const now = Date.now();
      const entryData = { entries: [], windowStart: now };
      await db.insert(gameConfigTable).values({ id: dungeonConfigKey, config: entryData })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: entryData } });
      await db.update(charactersTable).set({
        gems: (char.gems || 0) - DUNGEON_RESET_COST,
      }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, { success: true, entries_remaining: DUNGEON_MAX_ENTRIES, gems_spent: DUNGEON_RESET_COST });
      return;
    }

    // === GET ENTRIES: check how many dungeon entries remain ===
    if (action === "get_entries") {
      const dungeonConfigKey = `dungeon_entries_${characterId}`;
      const [dungeonEntry] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, dungeonConfigKey));
      let data: any = dungeonEntry?.config || { entries: [], windowStart: 0 };
      const now = Date.now();
      if (now - (data.windowStart || 0) >= DUNGEON_WINDOW_MS) {
        data = { entries: [], windowStart: now };
      }
      const remaining = DUNGEON_MAX_ENTRIES - data.entries.length;
      const windowEnd = (data.windowStart || now) + DUNGEON_WINDOW_MS;
      sendSuccess(res, {
        entries_remaining: remaining,
        max_entries: DUNGEON_MAX_ENTRIES,
        reset_cost: DUNGEON_RESET_COST,
        window_resets_at: new Date(windowEnd).toISOString(),
      });
      return;
    }

    // === GET_SESSION: fetch session by ID (for polling) ===
    if (action === "get_session") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(dungeonSessionsTable).where(eq(dungeonSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      sendSuccess(res, { success: true, session: buildSessionResponse(session) });
      return;
    }

    // === CREATE: make a new dungeon session in "waiting" state ===
    if (action === "enter" || action === "create") {
      // Clean up old stuck sessions (older than 1 hour)
      await db.update(dungeonSessionsTable).set({ status: "defeat" }).where(
        and(eq(dungeonSessionsTable.characterId, characterId),
          sql`${dungeonSessionsTable.status} IN ('active', 'waiting')`,
          sql`${dungeonSessionsTable.createdAt} < NOW() - INTERVAL '1 hour'`)
      );
      // Check for existing active/waiting session
      const existing = await db.select().from(dungeonSessionsTable).where(
        and(eq(dungeonSessionsTable.characterId, characterId),
          sql`${dungeonSessionsTable.status} IN ('active', 'waiting')`)
      );
      if (existing.length > 0) {
        sendSuccess(res, { success: true, session: buildSessionResponse(existing[0]) }); return;
      }

      // Enforce dungeon entry limit: 5 entries per 8 hours
      const dungeonConfigKey = `dungeon_entries_${characterId}`;
      const [dungeonEntry] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, dungeonConfigKey));
      let entryData: any = dungeonEntry?.config || { entries: [], windowStart: 0 };
      const now = Date.now();
      if (now - (entryData.windowStart || 0) >= DUNGEON_WINDOW_MS) {
        entryData = { entries: [], windowStart: now };
      }
      if (entryData.entries.length >= DUNGEON_MAX_ENTRIES) {
        const windowRemaining = Math.max(0, DUNGEON_WINDOW_MS - (now - (entryData.windowStart || 0)));
        const minutesLeft = Math.ceil(windowRemaining / 60000);
        sendError(res, 400, `Dungeon limit reached (${DUNGEON_MAX_ENTRIES} per 8 hours). Resets in ${minutesLeft} minutes.`);
        return;
      }
      entryData.entries.push(now);
      await db.insert(gameConfigTable).values({ id: dungeonConfigKey, config: entryData })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: entryData } });

      const boss = DUNGEON_BOSSES[dungeonId] || DUNGEON_BOSSES.inferno_keep;
      const bossHp = boss.hpBase + (char.level || 1) * boss.hpPerLevel;
      const memberStats = await calculateDungeonMemberStats(characterId, char);
      const sessionData = {
        dungeon_name: boss.dungeonName,
        boss_name: boss.name,
        boss_hp: bossHp,
        boss_max_hp: bossHp,
        boss_dmg_base: boss.dmgBase,
        boss_dmg_per_level: boss.dmgPerLevel,
        boss_armor: boss.armor + (char.level || 1) * boss.armorPerLevel,
        boss_element: boss.element,
        boss_weakness: boss.weakness,
        boss_resistance: boss.resistance,
        status: "waiting",
        leader_id: characterId,
        members: [memberStats],
        current_turn_index: 0,
        turn_deadline: null,
        combat_log: [{ type: "system", text: `${char.name} entered ${boss.dungeonName}.` }],
      };
      const [session] = await db.insert(dungeonSessionsTable).values({
        characterId,
        dungeonId: dungeonId || "inferno_keep",
        status: "waiting",
        data: sessionData,
      }).returning();
      sendSuccess(res, { success: true, session: buildSessionResponse(session) });
      return;
    }

    // === JOIN: add player to an existing session ===
    if (action === "join") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(dungeonSessionsTable).where(eq(dungeonSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      const d = (session.data as any) || {};
      if (d.status !== "waiting") { sendSuccess(res, { success: false, error: "Session already started or ended" }); return; }
      const members = d.members || [];
      if (members.length >= 6) { sendSuccess(res, { success: false, error: "Session is full" }); return; }
      if (members.some((m: any) => m.character_id === characterId)) {
        sendSuccess(res, { success: true, session: buildSessionResponse(session) }); return;
      }
      const joinMemberStats = await calculateDungeonMemberStats(characterId, char);
      members.push(joinMemberStats);
      d.members = members;
      d.combat_log = d.combat_log || [];
      d.combat_log.push({ type: "system", text: `${char.name} joined the party.` });
      await db.update(dungeonSessionsTable).set({ data: d }).where(eq(dungeonSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: buildSessionResponse({ ...session, data: d }) });
      return;
    }

    // === START: leader starts the boss fight ===
    if (action === "start") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(dungeonSessionsTable).where(eq(dungeonSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      const d = (session.data as any) || {};
      if (d.leader_id !== characterId) { sendSuccess(res, { success: false, error: "Only the leader can start" }); return; }
      if (d.status !== "waiting") { sendSuccess(res, { success: false, error: "Session already started" }); return; }
      d.status = "active";
      d.current_turn_index = 0;
      d.turn_deadline = new Date(Date.now() + 8000).toISOString();
      d.combat_log.push({ type: "system", text: `Battle begins! ${d.boss_name} appears!` });
      await db.update(dungeonSessionsTable).set({ status: "active", data: d }).where(eq(dungeonSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: buildSessionResponse({ ...session, data: d }) });
      return;
    }

    // === ATTACK / SKILL: player takes their turn ===
    if (action === "attack" || action === "skill") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(dungeonSessionsTable).where(eq(dungeonSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      const d = (session.data as any) || {};
      if (d.status !== "active") { sendSuccess(res, { success: false, error: "Combat not active" }); return; }
      const members = d.members || [];
      const myIdx = members.findIndex((m: any) => m.character_id === characterId);
      if (myIdx < 0) { sendSuccess(res, { success: false, error: "Not in this session" }); return; }
      if (d.current_turn_index !== myIdx) { sendSuccess(res, { success: false, error: "Not your turn" }); return; }
      const me = members[myIdx];
      if (me.hp <= 0) { sendSuccess(res, { success: false, error: "You are KO'd" }); return; }

      // Calculate player damage — use stored member stats (already includes equipment)
      const totalStr = me.strength || char.strength || 10;
      const totalDex = me.dexterity || char.dexterity || 8;
      const totalInt = me.intelligence || char.intelligence || 5;
      const totalLuck = me.luck || char.luck || 5;
      const memberDmgBonus = me.damage || 0;
      const memberCritChance = me.crit_chance || 0;
      const memberCritDmgPct = me.crit_dmg_pct || 0;
      const memberLifesteal = me.lifesteal || 0;
      // Class-based damage scaling (mirrors frontend statSystem)
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + memberDmgBonus;
      // Apply guild damage bonus
      if (char.guildId) {
        try {
          const [g] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
          if (g?.buffs && typeof g.buffs === "object") {
            const dmgBonus = ((g.buffs as any).damage_bonus || 0) / 100;
            baseDmg *= (1 + dmgBonus);
          }
        } catch {}
      }
      let dmgMult = 1.0;
      let skillName = "Basic Attack";
      if (action === "skill" && skillId && SKILL_DATA[skillId]) {
        dmgMult = SKILL_DATA[skillId].damage || 1.0;
        skillName = skillId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      const rawDmg = Math.max(1, Math.floor(baseDmg * dmgMult * (0.85 + Math.random() * 0.3)));
      // Boss armor reduces incoming damage
      const bossArmor = d.boss_armor || 0;
      let playerDmg = Math.max(1, rawDmg - Math.floor(bossArmor * 0.4));

      // Elemental damage bonus from gear vs boss weakness/resistance
      const memberElemDmg = me.elemental_damage || {};
      const bossWeakness = d.boss_weakness || null;
      const bossResistance = d.boss_resistance || null;
      // Map element names to their _dmg stat keys
      const ELEM_TO_STAT: Record<string, string> = {
        fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg",
        poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg",
      };
      let elemBonusDmg = 0;
      let elemText = "";
      for (const [elem, statKey] of Object.entries(ELEM_TO_STAT)) {
        const val = memberElemDmg[statKey] || 0;
        if (val <= 0) continue;
        // Each point of elemental damage adds flat bonus, scaled by weakness/resistance
        let elemMult = 1.0;
        if (elem === bossWeakness) elemMult = 1.5;
        else if (elem === bossResistance) elemMult = 0.5;
        elemBonusDmg += Math.floor(val * elemMult);
      }
      if (elemBonusDmg > 0) {
        playerDmg += elemBonusDmg;
        elemText = ` (+${elemBonusDmg} elemental)`;
      }

      // Crit uses gear crit_chance + luck scaling (mirrors frontend)
      const effectiveCritChance = Math.min(0.5, (memberCritChance + totalLuck * 0.3 + totalDex * 0.1) / 100);
      const isCrit = Math.random() < effectiveCritChance;
      const critMultiplier = 1.5 + (memberCritDmgPct / 100);
      const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;
      d.boss_hp = Math.max(0, d.boss_hp - finalDmg);
      d.combat_log.push({
        type: "player_attack",
        text: `${me.name} uses ${skillName} for ${finalDmg} damage${isCrit ? " (CRIT!)" : ""}${elemText}!`,
      });

      // Check victory
      if (d.boss_hp <= 0) {
        d.status = "victory";
        d.combat_log.push({ type: "victory", text: `${d.boss_name} has been defeated! Victory!` });
        // Reward all members — dungeon bosses give substantial rewards
        const lvl = char.level || 1;
        // Apply guild exp/gold bonuses
        let dGuildExpBonus = 0, dGuildGoldBonus = 0;
        if (char.guildId) {
          try {
            const [dg] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
            if (dg?.buffs && typeof dg.buffs === "object") {
              dGuildExpBonus = ((dg.buffs as any).exp_bonus || 0) / 100;
              dGuildGoldBonus = ((dg.buffs as any).gold_bonus || 0) / 100;
            }
          } catch {}
        }
        const goldReward = Math.floor((500 + lvl * 80 + Math.pow(lvl, 1.3) * 10) * (1 + dGuildGoldBonus));
        const expReward = Math.floor((400 + lvl * 60 + Math.pow(lvl, 1.3) * 8) * (1 + dGuildExpBonus));
        for (const m of members) {
          try {
            await db.update(charactersTable).set({
              gold: sql`COALESCE(gold, 0) + ${goldReward}`,
              exp: sql`COALESCE(exp, 0) + ${expReward}`,
            }).where(eq(charactersTable.id, m.character_id));
          } catch {}
        }
        d.combat_log.push({ type: "system", text: `Each player earned ${goldReward} gold and ${expReward} exp!` });
        await db.update(dungeonSessionsTable).set({ status: "completed", data: d }).where(eq(dungeonSessionsTable.id, session.id));
        sendSuccess(res, { success: true, session: buildSessionResponse({ ...session, data: d }) });
        return;
      }

      // Boss counter-attack on the acting player
      const bossDmgBase = d.boss_dmg_base || 15;
      const bossDmgPerLvl = d.boss_dmg_per_level || 3;
      const bossDmg = Math.max(1, Math.floor((bossDmgBase + (char.level || 1) * bossDmgPerLvl * 0.3) * (0.8 + Math.random() * 0.4)));
      // Use member's full defense (includes gear) for damage reduction
      const memberDef = me.defense || (char.defense || 0);
      const memberVit = me.vitality || (char.vitality || 8);
      const totalDefense = memberDef + memberVit * 0.5;
      // Evasion check (mirrors frontend)
      const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
      const evaded = Math.random() < memberEvasion;
      // Block check (60% damage reduction)
      const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);
      const blocked = !evaded && Math.random() < memberBlock;
      let actualBossDmg = 0;
      if (evaded) {
        actualBossDmg = 0;
      } else {
        const mitigated = Math.max(1, bossDmg - Math.floor(totalDefense * 0.3));
        actualBossDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
      }
      // Lifesteal from player attack
      if (memberLifesteal > 0 && finalDmg > 0) {
        const healAmt = Math.floor(finalDmg * memberLifesteal / 100);
        if (healAmt > 0) {
          me.hp = Math.min(me.max_hp, me.hp + healAmt);
          d.combat_log.push({ type: "heal", text: `${me.name} leeches ${healAmt} HP!` });
        }
      }
      me.hp = Math.max(0, me.hp - actualBossDmg);
      if (evaded) {
        d.combat_log.push({ type: "boss_attack", target: me.name, text: `🛡️ ${me.name} evaded ${d.boss_name}'s attack!` });
      } else {
        d.combat_log.push({
          type: "boss_attack",
          target: me.name,
          text: `⚔️ ${d.boss_name} → ${me.name}: ${actualBossDmg} damage${blocked ? " (BLOCKED!)" : ""}`,
        });
      }
      if (me.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${me.name} has been knocked out!` });
      }
      members[myIdx] = me;

      // Check defeat (all members KO'd)
      const allDead = members.every((m: any) => m.hp <= 0);
      if (allDead) {
        d.status = "defeat";
        d.combat_log.push({ type: "defeat", text: `All party members have fallen. Defeat.` });
        await db.update(dungeonSessionsTable).set({ status: "completed", data: d }).where(eq(dungeonSessionsTable.id, session.id));
        sendSuccess(res, { success: true, session: buildSessionResponse({ ...session, data: d }) });
        return;
      }

      // Advance to next alive member
      let nextIdx = (myIdx + 1) % members.length;
      let attempts = 0;
      while (members[nextIdx].hp <= 0 && attempts < members.length) {
        nextIdx = (nextIdx + 1) % members.length;
        attempts++;
      }
      d.current_turn_index = nextIdx;
      d.turn_deadline = new Date(Date.now() + 8000).toISOString();
      d.members = members;

      await db.update(dungeonSessionsTable).set({ data: d }).where(eq(dungeonSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: buildSessionResponse({ ...session, data: d }) });
      return;
    }

    // === LEAVE: exit the dungeon ===
    if (action === "flee" || action === "leave") {
      if (sessionId) {
        const [session] = await db.select().from(dungeonSessionsTable).where(eq(dungeonSessionsTable.id, sessionId));
        if (session) {
          const d = (session.data as any) || {};
          const members = (d.members || []).filter((m: any) => m.character_id !== characterId);
          if (members.length === 0) {
            d.status = "completed";
            d.members = [];
            await db.update(dungeonSessionsTable).set({ status: "completed", data: d }).where(eq(dungeonSessionsTable.id, session.id));
          } else {
            d.members = members;
            if (d.leader_id === characterId) d.leader_id = members[0].character_id;
            if (d.current_turn_index >= members.length) d.current_turn_index = 0;
            d.combat_log.push({ type: "system", text: `${char.name} left the dungeon.` });
            await db.update(dungeonSessionsTable).set({ data: d }).where(eq(dungeonSessionsTable.id, session.id));
          }
        }
      } else {
        await db.update(dungeonSessionsTable).set({ status: "completed" })
          .where(and(eq(dungeonSessionsTable.characterId, characterId),
            sql`${dungeonSessionsTable.status} IN ('active', 'waiting')`));
      }
      sendSuccess(res, { success: true });
      return;
    }

    sendSuccess(res, { success: true, action, character: toClientCharacter(char) });
  } catch (err: any) {
    req.log.error({ err }, "dungeonAction error");
    sendError(res, 500, err.message);
  }
});

// ========== TOWER OF TRIALS ==========
const TOWER_MAX_FLOOR = 1000;
const TOWER_MAX_ENTRIES = 3;
const TOWER_ENTRY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const TOWER_ENTRY_GEM_COST = 1000;
const TOWER_MULTI_ENEMY_FLOOR = 200;

const TOWER_ENEMY_TIERS = [
  { maxFloor: 50, names: ["Tower Rat", "Stone Imp", "Dust Golem", "Trial Shade", "Rusted Guardian"], element: null },
  { maxFloor: 100, names: ["Flame Sprite", "Inferno Hound", "Lava Crawler", "Ember Knight", "Fire Wraith"], element: "fire" },
  { maxFloor: 200, names: ["Frost Sentinel", "Ice Phantom", "Glacial Horror", "Crystal Fiend", "Frozen Abomination"], element: "ice" },
  { maxFloor: 350, names: ["Void Stalker", "Shadow Beast", "Dark Reaper", "Abyssal Crawler", "Nightmare Golem"], element: "blood" },
  { maxFloor: 500, names: ["Storm Herald", "Thunder Titan", "Lightning Wraith", "Voltaic Golem", "Storm Djinn"], element: "lightning" },
  { maxFloor: 700, names: ["Plague Horror", "Toxic Behemoth", "Venom Drake", "Corrosion Elemental", "Blight Warden"], element: "poison" },
  { maxFloor: 900, names: ["Sandstorm Colossus", "Desert Phantom", "Dune Overlord", "Mirage Assassin", "Tomb Emperor"], element: "sand" },
  { maxFloor: 1000, names: ["Celestial Aberration", "Divine Construct", "Genesis Sentinel", "Astral Devourer", "Omega Wraith"], element: null },
];

const TOWER_BOSS_NAMES = [
  "Guardian of the First Gate", "Warden of Flames", "Keeper of Frost", "Shadow Arbiter",
  "Stormcaller Vex", "Plaguebringer Mord", "Sand Pharaoh Khet", "Void Archon",
  "Celestial Judge", "Titan of the Spire", "Dread Champion", "Infernal Overseer",
  "Glacial Monarch", "Eclipse Wraith", "Tempest King", "Rot Sovereign",
  "Dune Tyrant", "Star Devourer", "Omega Sentinel", "The Watcher",
];

const TOWER_CENTENNIAL_BOSSES: Record<number, string> = {
  100: "The Iron Colossus", 200: "Abyssal Warlord", 300: "Frost Emperor Glacius",
  400: "Void Empress Nyx", 500: "Storm God Tempestus", 600: "Plague Lord Morthos",
  700: "Sand King Anubarak", 800: "Celestial Dragon Aethon", 900: "The Omega Sentinel",
  1000: "Tammapac, The Final Trial",
};

function getTowerEnemyTier(floor: number) {
  return TOWER_ENEMY_TIERS.find(t => floor <= t.maxFloor) || TOWER_ENEMY_TIERS[TOWER_ENEMY_TIERS.length - 1];
}

function generateTowerFloor(floor: number) {
  const isBoss = floor % 10 === 0;
  const isCentennial = floor % 100 === 0;
  const tier = getTowerEnemyTier(floor);
  const multiEnemy = floor >= TOWER_MULTI_ENEMY_FLOOR && !isBoss;
  const baseHp = 200 + floor * 50 + Math.pow(floor, 1.4) * 2;
  const baseDmg = 10 + floor * 3 + Math.pow(floor, 1.2) * 0.5;
  const baseArmor = Math.floor(floor * 0.5 + Math.pow(floor, 0.8));

  if (isCentennial) {
    return {
      type: "centennial_boss",
      enemies: [{ name: TOWER_CENTENNIAL_BOSSES[floor] || `Tower Boss Floor ${floor}`, hp: Math.floor(baseHp * 8), max_hp: Math.floor(baseHp * 8), dmg: Math.floor(baseDmg * 3), armor: Math.floor(baseArmor * 2.5), element: tier.element, isBoss: true }],
    };
  }
  if (isBoss) {
    const bossIdx = Math.floor((floor / 10 - 1) % TOWER_BOSS_NAMES.length);
    return {
      type: "boss",
      enemies: [{ name: TOWER_BOSS_NAMES[bossIdx], hp: Math.floor(baseHp * 4), max_hp: Math.floor(baseHp * 4), dmg: Math.floor(baseDmg * 2), armor: Math.floor(baseArmor * 1.5), element: tier.element, isBoss: true }],
    };
  }
  const enemyCount = multiEnemy ? Math.min(4, 2 + Math.floor((floor - 200) / 150)) : 1;
  const enemies: any[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const nameIdx = (floor + i) % tier.names.length;
    const hpMult = multiEnemy ? 0.6 : 1.0;
    enemies.push({ name: tier.names[nameIdx], hp: Math.floor(baseHp * hpMult), max_hp: Math.floor(baseHp * hpMult), dmg: Math.floor(baseDmg * (multiEnemy ? 0.7 : 1.0)), armor: Math.floor(baseArmor * (multiEnemy ? 0.5 : 1.0)), element: tier.element, isBoss: false });
  }
  return { type: "normal", enemies };
}

function getTowerRewards(floor: number) {
  const isBoss = floor % 10 === 0;
  const isCentennial = floor % 100 === 0;
  const baseGold = 50 + floor * 10 + Math.pow(floor, 1.2) * 2;
  const baseExp = 30 + floor * 8 + Math.pow(floor, 1.15) * 1.5;
  return {
    gold: Math.floor(baseGold * (isCentennial ? 5 : isBoss ? 2.5 : 1)),
    exp: Math.floor(baseExp * (isCentennial ? 5 : isBoss ? 2.5 : 1)),
    gems: isCentennial ? Math.floor(5 + floor / 100) : (isBoss ? Math.floor(1 + floor / 200) : 0),
    tammablocks: isCentennial ? Math.floor(2 + floor / 200) : (isBoss && floor >= 50 ? 1 : 0),
    towershards: isCentennial ? Math.floor(1 + floor / 300) : (isBoss && floor >= 100 ? 1 : 0),
    hasLoot: isBoss || Math.random() < 0.15,
    hasSpecialGear: isCentennial,
  };
}

router.post("/functions/towerAction", async (req: Request, res: Response) => {
  try {
    const { characterId, action, sessionId, skillId, targetIndex } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    // === GET STATUS: tower progress + entry info ===
    if (action === "get_status") {
      const extraData = (char.extraData as any) || {};
      const towerData = extraData.tower || { highestFloor: 0, tammablocks: 0, towershards: 0 };
      const entryKey = `tower_entries_${characterId}`;
      const [entryRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, entryKey));
      let entryData: any = entryRow?.config || { entries: [], windowStart: 0 };
      const now = Date.now();
      if (now - (entryData.windowStart || 0) >= TOWER_ENTRY_WINDOW_MS) {
        entryData = { entries: [], windowStart: now };
      }
      // Check for active session
      const activeSessions = await db.select().from(towerSessionsTable).where(
        and(eq(towerSessionsTable.characterId, characterId), sql`${towerSessionsTable.status} IN ('active', 'combat')`)
      );
      sendSuccess(res, {
        highestFloor: towerData.highestFloor || 0,
        tammablocks: towerData.tammablocks || 0,
        towershards: towerData.towershards || 0,
        entriesRemaining: TOWER_MAX_ENTRIES - entryData.entries.length,
        maxEntries: TOWER_MAX_ENTRIES,
        windowResetsAt: new Date((entryData.windowStart || now) + TOWER_ENTRY_WINDOW_MS).toISOString(),
        activeSession: activeSessions.length > 0 ? activeSessions[0] : null,
        entryGemCost: TOWER_ENTRY_GEM_COST,
      });
      return;
    }

    // === BUY ENTRY: purchase an extra tower entry for gems ===
    if (action === "buy_entry") {
      const gems = char.gems || 0;
      if (gems < TOWER_ENTRY_GEM_COST) {
        sendError(res, 400, `Not enough gems (need ${TOWER_ENTRY_GEM_COST}, have ${gems})`);
        return;
      }
      const entryKey = `tower_entries_${characterId}`;
      const [entryRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, entryKey));
      let entryData: any = entryRow?.config || { entries: [], windowStart: 0 };
      const now = Date.now();
      if (now - (entryData.windowStart || 0) >= TOWER_ENTRY_WINDOW_MS) {
        entryData = { entries: [], windowStart: now };
      }
      // Remove one entry from the list to free up a slot
      if (entryData.entries.length > 0) {
        entryData.entries.pop();
      }
      await db.insert(gameConfigTable).values({ id: entryKey, config: entryData })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: entryData } });
      // Deduct gems
      await db.update(charactersTable).set({ gems: gems - TOWER_ENTRY_GEM_COST }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, {
        success: true,
        gemsSpent: TOWER_ENTRY_GEM_COST,
        gemsRemaining: gems - TOWER_ENTRY_GEM_COST,
        entriesRemaining: TOWER_MAX_ENTRIES - entryData.entries.length,
      });
      return;
    }

    // === ENTER: start a new tower run from the next floor ===
    if (action === "enter") {
      // Clean old stuck sessions
      await db.update(towerSessionsTable).set({ status: "abandoned" }).where(
        and(eq(towerSessionsTable.characterId, characterId),
          sql`${towerSessionsTable.status} IN ('active', 'combat')`,
          sql`${towerSessionsTable.createdAt} < NOW() - INTERVAL '1 hour'`)
      );
      // Check existing
      const existing = await db.select().from(towerSessionsTable).where(
        and(eq(towerSessionsTable.characterId, characterId), sql`${towerSessionsTable.status} IN ('active', 'combat')`)
      );
      if (existing.length > 0) {
        const s = existing[0];
        sendSuccess(res, { success: true, session: { id: s.id, floor: s.floor, status: s.status, ...(s.data as any) } });
        return;
      }
      // Check entry limits
      const entryKey = `tower_entries_${characterId}`;
      const [entryRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, entryKey));
      let entryData: any = entryRow?.config || { entries: [], windowStart: 0 };
      const now = Date.now();
      if (now - (entryData.windowStart || 0) >= TOWER_ENTRY_WINDOW_MS) {
        entryData = { entries: [], windowStart: now };
      }
      if (entryData.entries.length >= TOWER_MAX_ENTRIES) {
        const remaining = Math.max(0, TOWER_ENTRY_WINDOW_MS - (now - (entryData.windowStart || 0)));
        sendError(res, 400, `Tower limit reached (${TOWER_MAX_ENTRIES} per hour). Resets in ${Math.ceil(remaining / 60000)} minutes.`);
        return;
      }
      entryData.entries.push(now);
      await db.insert(gameConfigTable).values({ id: entryKey, config: entryData })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: entryData } });

      // Determine floor
      const extraData = (char.extraData as any) || {};
      const towerProgress = extraData.tower || { highestFloor: 0 };
      const nextFloor = Math.min((towerProgress.highestFloor || 0) + 1, TOWER_MAX_FLOOR);
      const floorData = generateTowerFloor(nextFloor);
      const memberStats = await calculateDungeonMemberStats(characterId, char);

      const sessionData = {
        floor: nextFloor,
        floorType: floorData.type,
        enemies: floorData.enemies,
        member: memberStats,
        status: "combat",
        combat_log: [{ type: "system", text: `Entering Floor ${nextFloor} of the Tower of Trials...` }],
        currentEnemyIndex: 0,
      };

      const [session] = await db.insert(towerSessionsTable).values({
        characterId,
        floor: nextFloor,
        status: "combat",
        data: sessionData,
      }).returning();

      sendSuccess(res, { success: true, session: { id: session.id, floor: session.floor, status: session.status, ...sessionData } });
      return;
    }

    // === GET_SESSION ===
    if (action === "get_session") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [s] = await db.select().from(towerSessionsTable).where(eq(towerSessionsTable.id, sessionId));
      if (!s) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      sendSuccess(res, { success: true, session: { id: s.id, floor: s.floor, status: s.status, ...(s.data as any) } });
      return;
    }

    // === ATTACK / SKILL ===
    if (action === "attack" || action === "skill") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(towerSessionsTable).where(eq(towerSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      const d = (session.data as any) || {};
      if (d.status !== "combat") { sendSuccess(res, { success: false, error: "Not in combat" }); return; }
      const me = d.member;
      if (!me || me.hp <= 0) { sendSuccess(res, { success: false, error: "You are KO'd" }); return; }

      // Select target enemy
      const enemies = d.enemies || [];
      let tIdx = typeof targetIndex === "number" ? targetIndex : (d.currentEnemyIndex || 0);
      // Find first alive enemy if target is dead
      if (!enemies[tIdx] || enemies[tIdx].hp <= 0) {
        tIdx = enemies.findIndex((e: any) => e.hp > 0);
        if (tIdx < 0) tIdx = 0;
      }
      const enemy = enemies[tIdx];
      if (!enemy || enemy.hp <= 0) {
        // All enemies dead already, shouldn't happen
        d.status = "floor_clear";
        await db.update(towerSessionsTable).set({ data: d }).where(eq(towerSessionsTable.id, session.id));
        sendSuccess(res, { success: true, session: { id: session.id, floor: session.floor, status: session.status, ...d } });
        return;
      }

      // Calculate player damage (mirrors dungeonAction)
      const totalStr = me.strength || 10;
      const totalDex = me.dexterity || 8;
      const totalInt = me.intelligence || 5;
      const totalLuck = me.luck || 5;
      const memberDmgBonus = me.damage || 0;
      const memberCritChance = me.crit_chance || 0;
      const memberCritDmgPct = me.crit_dmg_pct || 0;
      const memberLifesteal = me.lifesteal || 0;
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + memberDmgBonus;

      // Guild bonus
      if (char.guildId) {
        try {
          const [g] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
          if (g?.buffs && typeof g.buffs === "object") {
            baseDmg *= (1 + ((g.buffs as any).damage_bonus || 0) / 100);
          }
        } catch {}
      }

      let dmgMult = 1.0;
      let skillName = "Basic Attack";
      if (action === "skill" && skillId && SKILL_DATA[skillId]) {
        dmgMult = SKILL_DATA[skillId].damage || 1.0;
        skillName = skillId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      const rawDmg = Math.max(1, Math.floor(baseDmg * dmgMult * (0.85 + Math.random() * 0.3)));
      let playerDmg = Math.max(1, rawDmg - Math.floor((enemy.armor || 0) * 0.4));

      // Elemental bonus
      const memberElemDmg = me.elemental_damage || {};
      const ELEM_TO_STAT: Record<string, string> = {
        fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg",
        poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg",
      };
      let elemBonusDmg = 0;
      for (const [elem, statKey] of Object.entries(ELEM_TO_STAT)) {
        const val = memberElemDmg[statKey] || 0;
        if (val <= 0) continue;
        // Weak/resist based on enemy element
        let elemMult = 1.0;
        const weakness = getElementWeakness(enemy.element);
        const resistance = enemy.element;
        if (elem === weakness) elemMult = 1.5;
        else if (elem === resistance) elemMult = 0.5;
        elemBonusDmg += Math.floor(val * elemMult);
      }
      if (elemBonusDmg > 0) playerDmg += elemBonusDmg;

      // Crit
      const effectiveCritChance = Math.min(0.5, (memberCritChance + totalLuck * 0.3 + totalDex * 0.1) / 100);
      const isCrit = Math.random() < effectiveCritChance;
      const critMultiplier = 1.5 + (memberCritDmgPct / 100);
      const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;

      enemy.hp = Math.max(0, enemy.hp - finalDmg);
      d.combat_log.push({
        type: "player_attack",
        text: `You use ${skillName} on ${enemy.name} for ${finalDmg}${isCrit ? " (CRIT!)" : ""}${elemBonusDmg > 0 ? ` (+${elemBonusDmg} elem)` : ""}!`,
      });

      // Lifesteal (capped at 10% of max HP per hit)
      if (memberLifesteal > 0 && finalDmg > 0) {
        const rawHeal = Math.floor(finalDmg * memberLifesteal / 100);
        const maxHeal = Math.floor(me.max_hp * 0.10);
        const healAmt = Math.min(rawHeal, maxHeal);
        if (healAmt > 0) {
          me.hp = Math.min(me.max_hp, me.hp + healAmt);
          d.combat_log.push({ type: "heal", text: `You leech ${healAmt} HP!` });
        }
      }

      // Check if this enemy died
      if (enemy.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${enemy.name} defeated!` });
      }

      // Check if all enemies are dead
      const allDead = enemies.every((e: any) => e.hp <= 0);
      if (allDead) {
        // Floor cleared!
        d.status = "floor_clear";
        const floor = session.floor || d.floor;
        const rewards = getTowerRewards(floor);
        d.rewards = rewards;
        d.combat_log.push({ type: "victory", text: `Floor ${floor} cleared!` });

        // Apply rewards
        const updateSet: any = {
          gold: sql`COALESCE(gold, 0) + ${rewards.gold}`,
          exp: sql`COALESCE(exp, 0) + ${rewards.exp}`,
        };
        if (rewards.gems > 0) updateSet.gems = sql`COALESCE(gems, 0) + ${rewards.gems}`;
        await db.update(charactersTable).set(updateSet).where(eq(charactersTable.id, characterId));

        // Update tower progress in extraData
        const extraData = (char.extraData as any) || {};
        const towerProgress = extraData.tower || { highestFloor: 0, tammablocks: 0, towershards: 0 };
        if (floor > (towerProgress.highestFloor || 0)) towerProgress.highestFloor = floor;
        towerProgress.tammablocks = (towerProgress.tammablocks || 0) + (rewards.tammablocks || 0);
        towerProgress.towershards = (towerProgress.towershards || 0) + (rewards.towershards || 0);
        extraData.tower = towerProgress;
        await db.update(charactersTable).set({ extraData }).where(eq(charactersTable.id, characterId));

        // Update season mission progress for tower floors
        try {
          const seasonMissions = await db.select().from(seasonMissionsTable).where(
            and(eq(seasonMissionsTable.characterId, characterId), eq(seasonMissionsTable.status, "active"))
          );
          const nowMs = new Date();
          for (const m of seasonMissions) {
            if (m.expiresAt && new Date(m.expiresAt) < nowMs) continue;
            if (m.missionKey === "tower_floors" || m.missionKey === "tower_floors_w") {
              const newProg = Math.min((m.progress || 0) + 1, m.target);
              const newSt = newProg >= m.target ? "completed" : "active";
              await db.update(seasonMissionsTable).set({ progress: newProg, status: newSt }).where(eq(seasonMissionsTable.id, m.id));
            }
          }
        } catch {}

        // Generate loot if applicable
        if (rewards.hasLoot) {
          try {
            const loot = generateLoot(floor, char.luck || 5, enemies[0]?.isBoss || false, null, char.class);
            if (loot) {
              await db.insert(itemsTable).values({
                ownerId: characterId,
                name: loot.name,
                type: loot.type,
                rarity: loot.rarity,
                level: Math.max(1, Math.floor(floor / 10)),
                stats: loot.stats || {},
                extraData: { source: "tower", floor },
              });
              d.combat_log.push({ type: "system", text: `Loot: ${loot.name} (${loot.rarity})` });
            }
          } catch {}
        }

        d.combat_log.push({ type: "system", text: `+${rewards.gold} gold, +${rewards.exp} exp${rewards.gems ? `, +${rewards.gems} gems` : ""}${rewards.tammablocks ? `, +${rewards.tammablocks} tammablocks` : ""}${rewards.towershards ? `, +${rewards.towershards} towershards` : ""}` });

        await db.update(towerSessionsTable).set({ status: "floor_clear", data: d }).where(eq(towerSessionsTable.id, session.id));
        sendSuccess(res, { success: true, session: { id: session.id, floor: session.floor, status: "floor_clear", ...d } });
        return;
      }

      // Enemies still alive — all alive enemies counter-attack
      for (let ei = 0; ei < enemies.length; ei++) {
        const e = enemies[ei];
        if (e.hp <= 0) continue;

        const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
        const memberDef = me.defense || 0;
        const memberVit = me.vitality || 8;
        const totalDefense = memberDef + memberVit * 0.5;
        const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
        const evaded = Math.random() < memberEvasion;
        const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);
        const blocked = !evaded && Math.random() < memberBlock;

        let actualDmg = 0;
        if (evaded) {
          d.combat_log.push({ type: "boss_attack", text: `You evaded ${e.name}'s attack!` });
        } else {
          const mitigated = Math.max(1, eDmg - Math.floor(totalDefense * 0.3));
          actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
          me.hp = Math.max(0, me.hp - actualDmg);
          d.combat_log.push({ type: "boss_attack", text: `${e.name} hits you for ${actualDmg}${blocked ? " (BLOCKED!)" : ""}` });
        }

        if (me.hp <= 0) {
          d.combat_log.push({ type: "defeat", text: `You have fallen on Floor ${session.floor}!` });
          d.status = "defeat";
          d.member = me;
          d.enemies = enemies;
          await db.update(towerSessionsTable).set({ status: "defeat", data: d }).where(eq(towerSessionsTable.id, session.id));
          sendSuccess(res, { success: true, session: { id: session.id, floor: session.floor, status: "defeat", ...d } });
          return;
        }
      }

      // Advance to next alive enemy for targeting
      d.currentEnemyIndex = enemies.findIndex((e: any) => e.hp > 0);
      if (d.currentEnemyIndex < 0) d.currentEnemyIndex = 0;
      d.member = me;
      d.enemies = enemies;

      await db.update(towerSessionsTable).set({ data: d }).where(eq(towerSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, floor: session.floor, status: session.status, ...d } });
      return;
    }

    // === NEXT_FLOOR: after clearing, advance to next floor ===
    if (action === "next_floor") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(towerSessionsTable).where(eq(towerSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { success: false, error: "Session not found" }); return; }
      const d = (session.data as any) || {};
      if (d.status !== "floor_clear") { sendSuccess(res, { success: false, error: "Floor not yet cleared" }); return; }

      const nextFloor = Math.min((session.floor || 1) + 1, TOWER_MAX_FLOOR);
      if (nextFloor > TOWER_MAX_FLOOR) {
        sendSuccess(res, { success: false, error: "You have reached the top of the Tower!" });
        return;
      }

      const floorData = generateTowerFloor(nextFloor);
      // Keep member HP/MP from previous floor (persistent through the run)
      const me = d.member;

      const newData = {
        floor: nextFloor,
        floorType: floorData.type,
        enemies: floorData.enemies,
        member: me,
        status: "combat",
        combat_log: [{ type: "system", text: `Ascending to Floor ${nextFloor}...` }],
        currentEnemyIndex: 0,
      };

      await db.update(towerSessionsTable).set({
        floor: nextFloor,
        status: "combat",
        data: newData,
      }).where(eq(towerSessionsTable.id, session.id));

      sendSuccess(res, { success: true, session: { id: session.id, floor: nextFloor, status: "combat", ...newData } });
      return;
    }

    // === FLEE: leave the tower ===
    if (action === "flee" || action === "leave") {
      if (sessionId) {
        await db.update(towerSessionsTable).set({ status: "abandoned" }).where(eq(towerSessionsTable.id, sessionId));
      } else {
        await db.update(towerSessionsTable).set({ status: "abandoned" }).where(
          and(eq(towerSessionsTable.characterId, characterId), sql`${towerSessionsTable.status} IN ('active', 'combat', 'floor_clear')`)
        );
      }
      sendSuccess(res, { success: true });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "towerAction error");
    sendError(res, 500, err.message);
  }
});

// Helper: element weakness mapping for tower
function getElementWeakness(element: string | null): string | null {
  const weaknesses: Record<string, string> = { fire: "ice", ice: "fire", lightning: "poison", poison: "fire", blood: "lightning", sand: "ice" };
  return element ? weaknesses[element] || null : null;
}

router.post("/functions/processServerProgression", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { sendSuccess(res, { success: true }); return; }

    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendSuccess(res, { success: true }); return; }

    if (char.idleMode) {
      const goldGain = Math.floor((char.level || 1) * 5);
      const expGain = Math.floor((char.level || 1) * 2);
      let newExp = (char.exp || 0) + expGain;
      let newLevel = char.level;
      let newStatPoints = char.statPoints || 0;
      const expToNext = char.expToNext || calculateExpToLevel(char.level || 1);
      if (newExp >= expToNext) {
        newLevel += 1;
        newExp -= expToNext;
        newStatPoints += 3;
      }
      const [updated] = await db.update(charactersTable).set({
        gold: (char.gold || 0) + goldGain,
        exp: newExp,
        level: newLevel,
        statPoints: newStatPoints,
        expToNext: calculateExpToLevel(newLevel),
      }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, { success: true, gold_gained: goldGain, exp_gained: expGain, character: toClientCharacter(updated) });
      return;
    }
    sendSuccess(res, { success: true });
  } catch (err: any) {
    req.log.error({ err }, "processServerProgression error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/catchUpOfflineProgress", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const lastClaim = char.lastIdleClaim ? new Date(char.lastIdleClaim).getTime() : Date.now();
    const offlineMs = Date.now() - lastClaim;
    const cfg = await getGameConfig();
    const ecoCfg = cfg.ECONOMY;
    const combatCfg = cfg.COMBAT;
    const maxOfflineHours = ecoCfg.MAX_OFFLINE_HOURS || 168;
    const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), maxOfflineHours);
    if (offlineHours < 0.1) {
      sendSuccess(res, { success: true, hours_offline: 0, results: {} }); return;
    }
    const idleMult = combatCfg.IDLE_REWARD_MULTIPLIER || 0.5;
    const goldReward = Math.floor(offlineHours * (char.level || 1) * 50 * idleMult);
    const expReward = Math.floor(offlineHours * (char.level || 1) * 20 * idleMult);

    // Calculate life skill XP for active skills during offline time
    const lifeSkills = ensureLifeSkills((char.lifeSkills as any) || {});
    const lifeSkillRewards: Record<string, number> = {};
    for (const st of SKILL_TYPES) {
      const skill = lifeSkills[st];
      if (skill.is_active) {
        const xpPerCycle = 15 + skill.level * 2;
        const baseCycle = 20;
        const speedReduction = 1 - ((skill.speed_level || 1) - 1) * 0.08;
        const cycleDuration = Math.max(5, baseCycle * speedReduction);
        const offlineSeconds = offlineHours * 3600;
        const completedCycles = Math.floor(offlineSeconds / cycleDuration);
        const xpGained = completedCycles * xpPerCycle;
        if (xpGained > 0) {
          skill.exp = (skill.exp || 0) + xpGained;
          const expToNext = skill.level * 100;
          while (skill.exp >= expToNext && skill.level < 99) {
            skill.exp -= expToNext;
            skill.level += 1;
          }
          lifeSkillRewards[st] = xpGained;
        }
      }
    }

    // Process gem lab offline gains
    let gemLabGains = 0;
    try {
      const [lab] = await db.select().from(gemLabsTable).where(eq(gemLabsTable.characterId, characterId));
      if (lab) {
        const labData = (lab.data as any) || {};
        const prodMult = 1 + (labData.production_level || 0) * (ecoCfg.GEM_LAB_PRODUCTION_BONUS || 0.05);
        const speedMult = 1 + (labData.speed_level || 0) * (ecoCfg.GEM_LAB_SPEED_REDUCTION || 0.02);
        const effMult = 1 + (labData.efficiency_level || 0) * (ecoCfg.GEM_LAB_EFFICIENCY_BONUS || 0.03);
        const gemsPerCycle = (ecoCfg.GEM_LAB_BASE_RATE || 0.001) * prodMult * effMult;
        const cycleSeconds = (10 / speedMult) * 60;
        const completedCycles = Math.floor((offlineHours * 3600) / cycleSeconds);
        gemLabGains = gemsPerCycle * completedCycles;
        if (gemLabGains > 0) {
          labData.pending_gems = (labData.pending_gems || 0) + gemLabGains;
          labData.total_gems_generated = (labData.total_gems_generated || 0) + gemLabGains;
          labData.last_collection_time = new Date().toISOString();
          await db.update(gemLabsTable).set({ data: labData }).where(eq(gemLabsTable.id, lab.id));
        }
      }
    } catch {}

    await db.update(charactersTable).set({
      gold: (char.gold || 0) + goldReward,
      exp: (char.exp || 0) + expReward,
      lifeSkills,
      lastIdleClaim: new Date(),
    }).where(eq(charactersTable.id, characterId));
    sendSuccess(res, {
        success: true,
        hours_offline: (Math.round(offlineHours * 10) / 10).toString(),
        results: {
          gold: goldReward,
          exp: expReward,
          life_skills: lifeSkillRewards,
          gemLab: { gems_gained: gemLabGains },
        },
      });
  } catch (err: any) {
    req.log.error({ err }, "catchUpOfflineProgress error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/unifiedPlayerProgression", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { sendSuccess(res, { success: true }); return; }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendSuccess(res, { success: true }); return; }
    const expToNext = char.expToNext || calculateExpToLevel(char.level || 1);
    if ((char.exp || 0) >= expToNext) {
      const newLevel = (char.level || 1) + 1;
      const [updated] = await db.update(charactersTable).set({
        level: newLevel,
        exp: (char.exp || 0) - expToNext,
        expToNext: calculateExpToLevel(newLevel),
        statPoints: (char.statPoints || 0) + 3,
        skillPoints: (char.skillPoints || 0) + 1,
      }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, { success: true, leveled_up: true, new_level: newLevel, character: toClientCharacter(updated) });
      return;
    }
    sendSuccess(res, { success: true, leveled_up: false });
  } catch (err: any) {
    req.log.error({ err }, "unifiedPlayerProgression error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/gameConfigManager", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { _method, action, config: newConfig, id } = req.body;

    if (_method === "POST" || action === "update") {
      if (!(await requireAdmin(req, res))) return;
      const configId = id || "global";
      await db.insert(gameConfigTable).values({ id: configId, config: newConfig || {} }).onConflictDoUpdate({
        target: gameConfigTable.id,
        set: { config: newConfig || {}, updatedAt: new Date() },
      });
      // Invalidate cache so changes take effect immediately
      _configCache = null;
      sendSuccess(res, { success: true, id: configId, config: newConfig || {} });
      return;
    }

    const [configRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, "global"));
    let config = configRow?.config || {};

    // Initialize with defaults if empty
    if (Object.keys(config as Record<string, any>).length === 0) {
      config = {
        PROGRESSION: { BASE_EXP: 100, EXP_GROWTH: 1.18, STAT_POINTS_PER_LEVEL: 3, SKILL_POINTS_PER_LEVEL: 1, HP_PER_LEVEL: 5, MP_PER_LEVEL: 3, MAX_LEVEL: 100 },
        COMBAT: { BASE_ATTACK_INTERVAL_MS: 1000, BASE_CRIT_CHANCE: 0.05, CRIT_DAMAGE_MULTIPLIER: 1.5, BASE_EVASION: 0.05, BASE_BLOCK: 0.05, BLOCK_REDUCTION: 0.5, DEFENSE_TO_REDUCTION: 0.002, MAX_DAMAGE_REDUCTION: 0.6, MAX_LIFESTEAL: 50, ENEMY_DMG_VARIANCE: 0.4, IDLE_REWARD_MULTIPLIER: 0.5, AUTO_POTION_THRESHOLD: 0.4, EXP_GAIN_MULTIPLIER: 1.0, GOLD_GAIN_MULTIPLIER: 1.0, MONSTER_DMG_MULTIPLIER: 1.0 },
        ECONOMY: { STARTING_GOLD: 100, STARTING_GEMS: 10, MAX_OFFLINE_HOURS: 168, TRANSMUTE_COST_BASE: 1000, TRANSMUTE_COST_SCALING: 1.5, TRANSMUTE_GEMS_REWARD: 1, GEM_LAB_BASE_RATE: 0.01, GEM_LAB_PRODUCTION_BONUS: 0.05, GEM_LAB_SPEED_REDUCTION: 0.1, GEM_LAB_EFFICIENCY_BONUS: 0.1, SHOP_ROTATION_HOURS: 4 },
        LOOT: { BASE_DROP_CHANCE: 0.01, MAX_DROP_CHANCE: 0.04, LUCK_DROP_BONUS: 0.0003, BOSS_DROP_CHANCE: 0.25, SMART_LOOT_CHANCE: 0.65, SMART_LOOT_WEAPON_CHANCE: 0.40, SMART_LOOT_ARMOR_CHANCE: 0.35, LUCK_RARITY_BONUS_PER_POINT: 0.1 },
        UPGRADES: { SAFE_GOLD_BASE: 1000, SAFE_GOLD_SCALING: 1.5, SAFE_ORE_BASE: 5, SAFE_ORE_SCALING: 2, SAFE_STAT_BONUS_PER_LEVEL: 0.05, SAFE_MAX_LEVEL: 20, STAR_SUCCESS_CHANCES: [90, 75, 50, 35, 12, 8, 2], STAR_GEM_BASE: 50, STAR_GEM_GROWTH: 2.0, STAR_STAT_BONUS_PER_STAR: 0.15, STAR_MAX_LEVEL: 7, AWAKEN_GEM_COST: 5000, AWAKEN_STAT_BONUS: 1.0 },
        GUILDS: { MAX_MEMBERS: 20, MAX_LEVEL: 30, BASE_EXP_TO_NEXT: 1000, EXP_GROWTH: 1.3, PERK_BONUS_PER_LEVEL: 0.05, MAX_PERK_LEVEL: 10, BOSS_RESPAWN_HOURS: 24, BOSS_HP_BASE: 10000, BOSS_HP_PER_GUILD_LEVEL: 5000, TOKEN_REWARD_PER_BOSS_DAMAGE: 0.01 },
        PARTIES: { MAX_SIZE: 6, EXP_BONUS_PER_MEMBER: 0.05, GOLD_BONUS_PER_MEMBER: 0.05, INVITE_EXPIRY_MINUTES: 5 },
        DAILY_LOGIN: { BASE_GOLD: 100, BASE_GEMS: 2, STREAK_GOLD_MULTIPLIER: 1.1, MAX_STREAK_BONUS_DAYS: 30 },
        LIFE_SKILLS: { BASE_GATHER_TICKS_PER_ITEM: 5, SPEED_REDUCTION_PER_LEVEL: 0.1, LUCK_RARE_BONUS_PER_LEVEL: 0.05, MAX_GATHER_LEVEL: 99, EXP_GROWTH: 1.12 },
        RARITY_MULTIPLIERS: { common: 1.0, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 3.0, mythic: 4.0, set: 3.5, shiny: 5.0 },
        SELL_PRICES: { common: 5, uncommon: 20, rare: 60, epic: 200, legendary: 600, mythic: 2000, set: 800, shiny: 3000 },
      };
      // Persist the defaults
      await db.insert(gameConfigTable).values({ id: "global", config }).onConflictDoUpdate({
        target: gameConfigTable.id,
        set: { config, updatedAt: new Date() },
      });
    }

    sendSuccess(res, { success: true, id: configRow?.id || "global", config });
  } catch (err: any) {
    req.log.error({ err }, "gameConfigManager error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/fight", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, enemyKey, regionKey, isElite, isBoss, isEmpowered, partySize } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    const enemyData = ENEMIES[enemyKey];
    if (!enemyData) { sendError(res, 400, "Unknown enemy"); return; }

    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    const serverIsBoss = !!enemyData.isBoss;
    const serverIsElite = !!enemyData.isElite;
    const serverRegionKey = char.currentRegion || regionKey || null;

    const cfg = await getGameConfig();
    const progCfg = cfg.PROGRESSION;
    const combatCfg = cfg.COMBAT;
    const partyCfg = cfg.PARTIES;

    const empoweredMult = isEmpowered ? 2 : 1;
    const partyMembers = Math.max(0, (partySize || 1) - 1);
    const partyExpBonus = partyMembers * (partyCfg.EXP_BONUS_PER_MEMBER || 0.05);
    const partyGoldBonus = partyMembers * (partyCfg.GOLD_BONUS_PER_MEMBER || 0.05);

    // Apply guild perk bonuses (exp_bonus, gold_bonus as percentages)
    let guildExpBonus = 0;
    let guildGoldBonus = 0;
    if (char.guildId) {
      try {
        const [guild] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
        if (guild?.buffs && typeof guild.buffs === "object") {
          guildExpBonus = ((guild.buffs as any).exp_bonus || 0) / 100;
          guildGoldBonus = ((guild.buffs as any).gold_bonus || 0) / 100;
        }
      } catch {}
    }

    // Apply active character buffs (from guild shop scrolls/runes)
    let buffExpBonus = 0;
    let buffGoldBonus = 0;
    const charExtra = (char.extraData as any) || {};
    const activeBuffs = charExtra.active_buffs || [];
    const nowMs = Date.now();
    for (const buff of activeBuffs) {
      if (new Date(buff.expires_at).getTime() > nowMs) {
        if (buff.type === "exp_bonus") buffExpBonus += (buff.value || 0) / 100;
        if (buff.type === "gold_bonus") buffGoldBonus += (buff.value || 0) / 100;
      }
    }

    const expGain = Math.round(enemyData.expReward * empoweredMult * (combatCfg.EXP_GAIN_MULTIPLIER || 1) * (1 + partyExpBonus + guildExpBonus + buffExpBonus));
    const goldGain = Math.round(enemyData.goldReward * empoweredMult * (combatCfg.GOLD_GAIN_MULTIPLIER || 1) * (1 + partyGoldBonus + guildGoldBonus + buffGoldBonus));

    let newExp = (char.exp || 0) + expGain;
    let newLevel = char.level || 1;
    let newExpToNext = char.expToNext || calculateExpToLevel(newLevel);
    let newStatPoints = char.statPoints || 0;
    let newSkillPoints = char.skillPoints || 0;
    const levelsGained: number[] = [];

    while (newExp >= newExpToNext) {
      newExp -= newExpToNext;
      newLevel++;
      newExpToNext = calculateExpToLevel(newLevel);
      newStatPoints += progCfg.STAT_POINTS_PER_LEVEL || 3;
      newSkillPoints += progCfg.SKILL_POINTS_PER_LEVEL || 1;
      levelsGained.push(newLevel);
    }

    const levelDiff = newLevel - (char.level || 1);
    const newMaxHp = (char.maxHp || 100) + levelDiff * (progCfg.HP_PER_LEVEL || 5);
    const newMaxMp = (char.maxMp || 50) + levelDiff * (progCfg.MP_PER_LEVEL || 3);
    const newGold = (char.gold || 0) + goldGain;
    const newTotalKills = (char.totalKills || 0) + 1;
    const damageDealt = enemyData.hp || Math.floor((char.strength || 10) * 2);
    const newTotalDamage = (char.totalDamage || 0) + damageDealt;

    const [updated] = await db.update(charactersTable).set({
      exp: newExp,
      level: newLevel,
      expToNext: newExpToNext,
      gold: newGold,
      statPoints: newStatPoints,
      skillPoints: newSkillPoints,
      totalKills: newTotalKills,
      totalDamage: newTotalDamage,
      maxHp: newMaxHp,
      maxMp: newMaxMp,
    }).where(eq(charactersTable.id, characterId)).returning();

    let lootItem = null;
    try {
      const charLuck = char.luck || 0;
      const enemyKeyStr = req.body.enemyKey || "";

      // 1. Try unique item drop first (from boss/elite kills)
      let loot = null;
      if (serverIsBoss || serverIsElite) {
        const uniqueDrop = rollUnique(enemyKeyStr, char.class || null, charLuck);
        if (uniqueDrop) {
          loot = uniqueDrop;
        }
      }

      // 2. Try celestial stone drop (from bosses only)
      let stoneLoot = null;
      if (serverIsBoss) {
        stoneLoot = rollStone(enemyKeyStr, charLuck);
      }

      // 3. Normal loot generation
      if (!loot) {
        loot = generateLoot(
          char.level || 1,
          charLuck,
          serverIsBoss,
          serverRegionKey,
          char.class || null
        );
      }

      if (loot) {
        const [inserted] = await db.insert(itemsTable).values({
          ownerId: characterId,
          name: loot.name,
          type: loot.type,
          rarity: loot.rarity,
          level: loot.item_level || 1,
          stats: loot.stats || {},
          setId: loot.set_key || null,
          extraData: {
            subtype: loot.subtype || null,
            level_req: loot.level_req || 1,
            sell_price: loot.sell_price || 0,
            set_name: loot.set_name || null,
            class_restriction: loot.class_restriction || null,
            proc_effects: loot.proc_effects || null,
            is_unique: loot.is_unique || false,
            lore: loot.lore || null,
            uniqueEffect: loot.uniqueEffect || null,
          },
        }).returning();
        lootItem = inserted;
      }

      // Insert celestial stone as separate item
      if (stoneLoot) {
        await db.insert(itemsTable).values({
          ownerId: characterId,
          name: stoneLoot.name,
          type: stoneLoot.type,
          rarity: stoneLoot.rarity,
          level: 1,
          stats: {},
          extraData: {
            is_unique: true,
            sell_price: 0,
            level_req: 1,
          },
        });
      }
    } catch (lootErr: any) {
      req.log.error({ err: lootErr }, "fight loot generation error");
    }

    try {
      const activeQuests = await db.select().from(questsTable).where(
        and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active"))
      );
      for (const q of activeQuests) {
        const objType = (q.objective as any)?.type || q.type;
        let increment = 0;
        if (objType === "combat_kills") increment = 1;
        else if (objType === "gold_earned") increment = goldGain;
        else if (objType === "level_up" && levelDiff > 0) increment = levelDiff;
        if (increment > 0) {
          const newProgress = Math.min((q.progress || 0) + increment, q.target || 1);
          const newStatus = newProgress >= (q.target || 1) ? "completed" : "active";
          await db.update(questsTable).set({ progress: newProgress, status: newStatus }).where(eq(questsTable.id, q.id));
        }
      }
    } catch (questErr: any) {
      req.log.error({ err: questErr }, "fight quest update error");
    }

    // Update season pass mission progress
    try {
      const seasonMissions = await db.select().from(seasonMissionsTable).where(
        and(eq(seasonMissionsTable.characterId, characterId), eq(seasonMissionsTable.status, "active"))
      );
      const now = new Date();
      for (const m of seasonMissions) {
        if (m.expiresAt && new Date(m.expiresAt) < now) continue;
        let inc = 0;
        if (m.missionKey === "kill_enemies" || m.missionKey === "kill_enemies_w") inc = 1;
        else if (m.missionKey === "earn_gold" || m.missionKey === "earn_gold_w") inc = goldGain;
        else if (m.missionKey === "earn_exp" || m.missionKey === "earn_exp_w") inc = expGain;
        else if (m.missionKey === "win_battles") inc = 1;
        else if (m.missionKey === "collect_items" && lootItem) inc = 1;
        else if (m.missionKey === "boss_kills" && (serverIsBoss || serverIsElite)) inc = 1;
        if (inc > 0) {
          const newProg = Math.min((m.progress || 0) + inc, m.target);
          const newSt = newProg >= m.target ? "completed" : "active";
          await db.update(seasonMissionsTable).set({ progress: newProg, status: newSt }).where(eq(seasonMissionsTable.id, m.id));
        }
      }
    } catch (smErr: any) {
      req.log.error({ err: smErr }, "fight season mission update error");
    }

    sendSuccess(res, {
        success: true,
        rewards: { exp: expGain, gold: goldGain },
        partyBonuses: partyMembers > 0 ? { expPct: Math.round(partyExpBonus * 100), goldPct: Math.round(partyGoldBonus * 100) } : null,
        character: toClientCharacter(updated),
        levelsGained,
        loot: lootItem,
        newLevel,
        newExp,
        newGold,
      });
  } catch (err: any) {
    req.log.error({ err }, "fight error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/getPlayer", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    const lastClaim = char.lastIdleClaim ? new Date(char.lastIdleClaim as string).getTime() : Date.now();
    const offlineMs = Date.now() - lastClaim;
    const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), 8);
    let idleGold = 0;
    let idleExp = 0;

    if (offlineHours >= 0.1) {
      idleGold = Math.floor(offlineHours * (char.level || 1) * 50);
      idleExp = Math.floor(offlineHours * (char.level || 1) * 20);

      let newExp = (char.exp || 0) + idleExp;
      let newLevel = char.level || 1;
      let newExpToNext = char.expToNext || calculateExpToLevel(newLevel);
      let newStatPoints = char.statPoints || 0;
      let newSkillPoints = char.skillPoints || 0;

      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = calculateExpToLevel(newLevel);
        newStatPoints += 3;
        newSkillPoints += 1;
      }

      const levelDiff = newLevel - (char.level || 1);
      const newMaxHp = (char.maxHp || 100) + levelDiff * 5;
      const newMaxMp = (char.maxMp || 50) + levelDiff * 3;

      const [updated] = await db.update(charactersTable).set({
        gold: (char.gold || 0) + idleGold,
        exp: newExp,
        level: newLevel,
        expToNext: newExpToNext,
        statPoints: newStatPoints,
        skillPoints: newSkillPoints,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        lastIdleClaim: new Date().toISOString(),
      }).where(eq(charactersTable.id, characterId)).returning();

      sendSuccess(res, {
          success: true,
          character: toClientCharacter(updated),
          idleRewards: { gold: idleGold, exp: idleExp, hours: offlineHours.toFixed(1) },
        });
      return;
    }

    sendSuccess(res, {
        success: true,
        character: toClientCharacter(char),
        idleRewards: null,
      });
  } catch (err: any) {
    req.log.error({ err }, "getPlayer error");
    sendError(res, 500, err.message);
  }
});

// Dungeon entry status — how many entries remain for this character
router.post("/functions/dungeonEntryStatus", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) return sendError(res, 400, "characterId required");
    const dungeonConfigKey = `dungeon_entries_${characterId}`;
    const [entry] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, dungeonConfigKey));
    let data: any = entry?.config || { entries: [], windowStart: 0 };
    const now = Date.now();
    if (now - (data.windowStart || 0) >= DUNGEON_WINDOW_MS) {
      data = { entries: [], windowStart: now };
    }
    const entriesUsed = data.entries.length;
    const entriesLeft = Math.max(0, DUNGEON_MAX_ENTRIES - entriesUsed);
    const windowRemaining = Math.max(0, DUNGEON_WINDOW_MS - (now - (data.windowStart || 0)));
    sendSuccess(res, { entriesUsed, entriesLeft, maxEntries: DUNGEON_MAX_ENTRIES, windowRemaining });
  } catch (err: any) {
    sendError(res, 500, err.message);
  }
});

router.post("/functions/guildBossAttack", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action } = req.body;
    if (!characterId) return sendError(res, 400, "characterId required");

    const [char] = await db.select({ createdBy: charactersTable.createdBy })
      .from(charactersTable)
      .where(eq(charactersTable.id, characterId));
    if (!char || char.createdBy !== (req as any).user.id) {
      return sendError(res, 403, "Not your character");
    }

    const BOSS_MAX_ATTACKS = 10;
    const BOSS_WINDOW_MS = 8 * 60 * 60 * 1000;
    const configKey = `guild_boss_attacks_${characterId}`;

    const [existing] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, configKey));
    let data: any = existing?.config || { attacks: [], windowStart: 0 };
    const now = Date.now();

    if (now - (data.windowStart || 0) >= BOSS_WINDOW_MS) {
      data = { attacks: [], windowStart: now };
    }

    if (action === "record") {
      if (data.attacks.length >= BOSS_MAX_ATTACKS) {
        return sendError(res, 400, "No attacks remaining in this window");
      }
      data.attacks.push(now);
      await db.insert(gameConfigTable)
        .values({ id: configKey, config: data })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: data } });
    }

    const attacksLeft = Math.max(0, BOSS_MAX_ATTACKS - data.attacks.length);
    const windowRemaining = Math.max(0, BOSS_WINDOW_MS - (now - (data.windowStart || 0)));

    sendSuccess(res, {
      ready: attacksLeft > 0,
      attacksUsed: data.attacks.length,
      attacksLeft,
      maxAttacks: BOSS_MAX_ATTACKS,
      windowRemaining,
    });
  } catch (err: any) {
    req.log.error({ err }, "guildBossAttack error");
    sendError(res, 500, err.message);
  }
});

// Rebalance all items for a character — caps overpowered stats from old shop formula
router.post("/functions/rebalanceItems", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { sendError(res, 400, "characterId required"); return; }
    if (!(await verifyCharacterOwner(req, characterId))) { sendError(res, 403, "Not your character"); return; }

    const items = await db.select().from(itemsTable).where(eq(itemsTable.ownerId, characterId));
    let rebalanced = 0;

    // New balanced formula caps: (1 + itemLevel * 0.08) * rarityMult
    const RARITY_CAPS: Record<string, number> = {
      common: 1, uncommon: 1.15, rare: 1.4, epic: 1.8, legendary: 2.3, mythic: 3, set: 3.2, shiny: 4,
    };

    for (const item of items) {
      if (!item.stats || typeof item.stats !== "object") continue;
      const itemLevel = item.itemLevel || item.levelReq || 1;
      const rarityMult = RARITY_CAPS[item.rarity] || 1;
      const maxStatValue = Math.max(1, Math.floor((1 + itemLevel * 0.12) * rarityMult * 1.3));

      let changed = false;
      const newStats: Record<string, number> = {};
      for (const [k, v] of Object.entries(item.stats as Record<string, number>)) {
        if (typeof v === "number" && v > maxStatValue) {
          newStats[k] = maxStatValue;
          changed = true;
        } else {
          newStats[k] = v;
        }
      }

      if (changed) {
        await db.update(itemsTable).set({ stats: newStats }).where(eq(itemsTable.id, item.id));
        rebalanced++;
      }
    }

    sendSuccess(res, { success: true, rebalanced, total: items.length });
  } catch (err: any) {
    req.log.error({ err }, "rebalanceItems error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/:name", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  req.log.warn({ functionName: req.params.name }, "Unhandled function call");
  sendSuccess(res, { success: true, message: `Function ${req.params.name} stub` });
});

function toClientCharacter(c: any) {
  return {
    id: c.id,
    created_by: c.createdBy,
    name: c.name,
    class: c.class,
    level: c.level,
    exp: c.exp,
    exp_to_next: c.expToNext,
    hp: c.hp,
    max_hp: c.maxHp,
    mp: c.mp,
    max_mp: c.maxMp,
    strength: c.strength,
    dexterity: c.dexterity,
    intelligence: c.intelligence,
    vitality: c.vitality,
    luck: c.luck,
    stat_points: c.statPoints,
    skill_points: c.skillPoints,
    gold: c.gold,
    gems: c.gems,
    current_region: c.currentRegion,
    equipment: c.equipment,
    skills: c.skills,
    hotbar_skills: c.hotbarSkills,
    idle_mode: c.idleMode,
    total_kills: c.totalKills,
    total_damage: c.totalDamage,
    prestige_level: c.prestigeLevel,
    achievements: c.achievements,
    daily_quests_completed: c.dailyQuestsCompleted,
    weekly_quests_completed: c.weeklyQuestsCompleted,
    last_idle_claim: c.lastIdleClaim,
    guild_id: c.guildId,
    is_banned: c.isBanned,
    is_muted: c.isMuted,
    title: c.title,
    life_skills: c.lifeSkills,
    gem_lab: c.gemLab,
    daily_login_streak: c.dailyLoginStreak,
    last_daily_login: c.lastDailyLogin,
    dungeon_data: c.dungeonData,
    skill_tree_data: c.skillTreeData,
    extra_data: c.extraData,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

// ========== SEASON / BATTLE PASS ==========
const SEASON_CONFIG = {
  CURRENT_SEASON: 1,
  SEASON_NAME: "Season 1: Dawn of Trials",
  MAX_TIER: 50,
  XP_PER_TIER: 1000,
  PREMIUM_COST_GEMS: 2000,
  // Season start: April 1, 2026. Season end: 30 days later.
  SEASON_START: new Date("2026-04-01T00:00:00Z").getTime(),
  SEASON_DURATION_MS: 30 * 24 * 60 * 60 * 1000,
};

// Rewards per tier. Even tiers = free, all tiers = premium.
function getSeasonRewards() {
  const rewards: Record<number, { free?: any; premium?: any }> = {};
  for (let t = 1; t <= SEASON_CONFIG.MAX_TIER; t++) {
    const r: any = {};
    // Free track: every 2nd tier
    if (t % 2 === 0 || t === 1 || t === SEASON_CONFIG.MAX_TIER) {
      const freeGold = 100 + t * 50;
      const freeReward: any = { gold: freeGold };
      if (t % 10 === 0) freeReward.gems = t;
      if (t === SEASON_CONFIG.MAX_TIER) { freeReward.gems = 200; freeReward.tammablocks = 50; }
      r.free = freeReward;
    }
    // Premium track: every tier
    const premGold = 200 + t * 80;
    const premReward: any = { gold: premGold };
    if (t % 5 === 0) premReward.gems = Math.floor(t * 1.5);
    if (t % 10 === 0) premReward.tammablocks = Math.floor(t / 2);
    if (t === 25) premReward.towershards = 10;
    if (t === SEASON_CONFIG.MAX_TIER) { premReward.gems = 500; premReward.tammablocks = 100; premReward.towershards = 25; }
    r.premium = premReward;
    rewards[t] = r;
  }
  return rewards;
}

const SEASON_REWARDS = getSeasonRewards();

const DAILY_MISSION_POOL = [
  { key: "kill_enemies", title: "Monster Slayer", description: "Kill 30 enemies", target: 30, xp: 100 },
  { key: "earn_gold", title: "Gold Rush", description: "Earn 2,000 gold", target: 2000, xp: 100 },
  { key: "tower_floors", title: "Tower Climber", description: "Clear 3 tower floors", target: 3, xp: 120 },
  { key: "use_skills", title: "Skilled Fighter", description: "Use 15 skills in combat", target: 15, xp: 80 },
  { key: "earn_exp", title: "Seeker of Knowledge", description: "Earn 1,000 EXP", target: 1000, xp: 90 },
  { key: "win_battles", title: "Victorious", description: "Win 10 battles", target: 10, xp: 100 },
];

const WEEKLY_MISSION_POOL = [
  { key: "kill_enemies_w", title: "Warmonger", description: "Kill 200 enemies", target: 200, xp: 400 },
  { key: "earn_gold_w", title: "Treasure Hunter", description: "Earn 15,000 gold", target: 15000, xp: 400 },
  { key: "tower_floors_w", title: "Tower Master", description: "Clear 15 tower floors", target: 15, xp: 500 },
  { key: "collect_items", title: "Collector", description: "Collect 20 items", target: 20, xp: 350 },
  { key: "earn_exp_w", title: "Scholar", description: "Earn 10,000 EXP", target: 10000, xp: 450 },
  { key: "boss_kills", title: "Boss Hunter", description: "Defeat 5 bosses", target: 5, xp: 500 },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

router.post("/functions/seasonPassAction", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    const season = SEASON_CONFIG.CURRENT_SEASON;
    const seasonEnd = SEASON_CONFIG.SEASON_START + SEASON_CONFIG.SEASON_DURATION_MS;

    // === GET STATUS ===
    if (action === "get_status") {
      let [pass] = await db.select().from(seasonPassTable).where(
        and(eq(seasonPassTable.characterId, characterId), eq(seasonPassTable.season, season))
      );
      if (!pass) {
        [pass] = await db.insert(seasonPassTable).values({ characterId, season, tier: 0, xp: 0, isPremium: false, claimedFree: [], claimedPremium: [] }).returning();
      }
      // Get missions
      const missions = await db.select().from(seasonMissionsTable).where(
        and(eq(seasonMissionsTable.characterId, characterId), eq(seasonMissionsTable.season, season))
      );
      const now = new Date();
      const activeMissions = missions.filter(m => m.status === "active" || m.status === "completed");
      const expiredMissions = activeMissions.filter(m => m.expiresAt && new Date(m.expiresAt) < now);
      // Expire old missions
      for (const m of expiredMissions) {
        await db.update(seasonMissionsTable).set({ status: "expired" }).where(eq(seasonMissionsTable.id, m.id));
      }
      const currentMissions = activeMissions.filter(m => !m.expiresAt || new Date(m.expiresAt) >= now);

      sendSuccess(res, {
        pass: { id: pass.id, tier: pass.tier, xp: pass.xp, isPremium: pass.isPremium, claimedFree: pass.claimedFree, claimedPremium: pass.claimedPremium },
        missions: currentMissions.map(m => ({ id: m.id, type: m.type, title: m.title, description: m.description, progress: m.progress, target: m.target, xpReward: m.xpReward, status: m.status, expiresAt: m.expiresAt })),
        config: { season, seasonName: SEASON_CONFIG.SEASON_NAME, maxTier: SEASON_CONFIG.MAX_TIER, xpPerTier: SEASON_CONFIG.XP_PER_TIER, premiumCost: SEASON_CONFIG.PREMIUM_COST_GEMS, seasonEnd: new Date(seasonEnd).toISOString() },
        rewards: SEASON_REWARDS,
      });
      return;
    }

    // === GENERATE MISSIONS (daily + weekly) ===
    if (action === "generate_missions") {
      const now = new Date();
      const existing = await db.select().from(seasonMissionsTable).where(
        and(eq(seasonMissionsTable.characterId, characterId), eq(seasonMissionsTable.season, season))
      );
      const activeDailies = existing.filter(m => m.type === "daily" && (m.status === "active" || m.status === "completed") && m.expiresAt && new Date(m.expiresAt) >= now);
      const activeWeeklies = existing.filter(m => m.type === "weekly" && (m.status === "active" || m.status === "completed") && m.expiresAt && new Date(m.expiresAt) >= now);

      const newMissions: any[] = [];

      // Generate dailies (3 per day)
      if (activeDailies.length < 3) {
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const usedKeys = new Set(activeDailies.map(m => m.missionKey));
        const available = DAILY_MISSION_POOL.filter(m => !usedKeys.has(m.key));
        const picks = pickRandom(available, 3 - activeDailies.length);
        for (const p of picks) {
          const [m] = await db.insert(seasonMissionsTable).values({
            characterId, season, type: "daily", missionKey: p.key, title: p.title, description: p.description,
            progress: 0, target: p.target, xpReward: p.xp, status: "active", expiresAt: tomorrow,
          }).returning();
          newMissions.push(m);
        }
      }

      // Generate weeklies (3 per week)
      if (activeWeeklies.length < 3) {
        const nextWeek = new Date(now);
        nextWeek.setUTCDate(nextWeek.getUTCDate() + (7 - nextWeek.getUTCDay()));
        nextWeek.setUTCHours(0, 0, 0, 0);
        if (nextWeek <= now) nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
        const usedKeys = new Set(activeWeeklies.map(m => m.missionKey));
        const available = WEEKLY_MISSION_POOL.filter(m => !usedKeys.has(m.key));
        const picks = pickRandom(available, 3 - activeWeeklies.length);
        for (const p of picks) {
          const [m] = await db.insert(seasonMissionsTable).values({
            characterId, season, type: "weekly", missionKey: p.key, title: p.title, description: p.description,
            progress: 0, target: p.target, xpReward: p.xp, status: "active", expiresAt: nextWeek,
          }).returning();
          newMissions.push(m);
        }
      }

      sendSuccess(res, { generated: newMissions.length, missions: [...activeDailies, ...activeWeeklies, ...newMissions].map(m => ({ id: m.id, type: m.type, title: m.title, description: m.description, progress: m.progress, target: m.target, xpReward: m.xpReward, status: m.status, expiresAt: m.expiresAt })) });
      return;
    }

    // === UPDATE MISSION PROGRESS ===
    if (action === "update_progress") {
      const { missionKey, amount } = req.body;
      if (!missionKey || !amount) { sendError(res, 400, "missionKey and amount required"); return; }
      const now = new Date();
      const missions = await db.select().from(seasonMissionsTable).where(
        and(eq(seasonMissionsTable.characterId, characterId), eq(seasonMissionsTable.season, season))
      );
      const active = missions.filter(m => m.status === "active" && m.missionKey === missionKey && (!m.expiresAt || new Date(m.expiresAt) >= now));
      let updated = 0;
      for (const m of active) {
        const newProgress = Math.min((m.progress || 0) + amount, m.target);
        const newStatus = newProgress >= m.target ? "completed" : "active";
        await db.update(seasonMissionsTable).set({ progress: newProgress, status: newStatus }).where(eq(seasonMissionsTable.id, m.id));
        updated++;
      }
      sendSuccess(res, { success: true, updated });
      return;
    }

    // === CLAIM MISSION (get season XP) ===
    if (action === "claim_mission") {
      const { missionId } = req.body;
      if (!missionId) { sendError(res, 400, "missionId required"); return; }
      const [mission] = await db.select().from(seasonMissionsTable).where(eq(seasonMissionsTable.id, missionId));
      if (!mission || mission.characterId !== characterId) { sendError(res, 404, "Mission not found"); return; }
      if (mission.status !== "completed") { sendError(res, 400, "Mission not completed yet"); return; }
      await db.update(seasonMissionsTable).set({ status: "claimed" }).where(eq(seasonMissionsTable.id, missionId));

      // Add XP to season pass
      let [pass] = await db.select().from(seasonPassTable).where(
        and(eq(seasonPassTable.characterId, characterId), eq(seasonPassTable.season, season))
      );
      if (!pass) {
        [pass] = await db.insert(seasonPassTable).values({ characterId, season }).returning();
      }
      const newXp = (pass.xp || 0) + mission.xpReward;
      const newTier = Math.min(Math.floor(newXp / SEASON_CONFIG.XP_PER_TIER), SEASON_CONFIG.MAX_TIER);
      await db.update(seasonPassTable).set({ xp: newXp, tier: newTier }).where(eq(seasonPassTable.id, pass.id));

      sendSuccess(res, { success: true, xpGained: mission.xpReward, newXp, newTier, tierUp: newTier > (pass.tier || 0) });
      return;
    }

    // === CLAIM TIER REWARD ===
    if (action === "claim_reward") {
      const { tier, track } = req.body; // track: "free" or "premium"
      if (!tier || !track) { sendError(res, 400, "tier and track required"); return; }

      let [pass] = await db.select().from(seasonPassTable).where(
        and(eq(seasonPassTable.characterId, characterId), eq(seasonPassTable.season, season))
      );
      if (!pass) { sendError(res, 404, "No season pass found"); return; }
      if ((pass.tier || 0) < tier) { sendError(res, 400, `Haven't reached tier ${tier} yet (current: ${pass.tier})`); return; }

      const tierRewards = SEASON_REWARDS[tier];
      if (!tierRewards) { sendError(res, 400, "Invalid tier"); return; }

      const claimedFree = (pass.claimedFree as number[]) || [];
      const claimedPremium = (pass.claimedPremium as number[]) || [];

      if (track === "free") {
        if (!tierRewards.free) { sendError(res, 400, "No free reward at this tier"); return; }
        if (claimedFree.includes(tier)) { sendError(res, 400, "Already claimed"); return; }
        // Grant reward
        const reward = tierRewards.free;
        const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
        const updates: any = {};
        if (reward.gold) updates.gold = (char.gold || 0) + reward.gold;
        if (reward.gems) updates.gems = (char.gems || 0) + reward.gems;
        if (reward.tammablocks || reward.towershards) {
          const extraData = (char.extraData as any) || {};
          const tower = extraData.tower || {};
          if (reward.tammablocks) tower.tammablocks = (tower.tammablocks || 0) + reward.tammablocks;
          if (reward.towershards) tower.towershards = (tower.towershards || 0) + reward.towershards;
          updates.extraData = { ...extraData, tower };
        }
        if (Object.keys(updates).length > 0) await db.update(charactersTable).set(updates).where(eq(charactersTable.id, characterId));
        claimedFree.push(tier);
        await db.update(seasonPassTable).set({ claimedFree }).where(eq(seasonPassTable.id, pass.id));
        sendSuccess(res, { success: true, reward, track: "free", tier });
      } else if (track === "premium") {
        if (!pass.isPremium) { sendError(res, 400, "Premium pass required"); return; }
        if (!tierRewards.premium) { sendError(res, 400, "No premium reward at this tier"); return; }
        if (claimedPremium.includes(tier)) { sendError(res, 400, "Already claimed"); return; }
        const reward = tierRewards.premium;
        const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
        const updates: any = {};
        if (reward.gold) updates.gold = (char.gold || 0) + reward.gold;
        if (reward.gems) updates.gems = (char.gems || 0) + reward.gems;
        if (reward.tammablocks || reward.towershards) {
          const extraData = (char.extraData as any) || {};
          const tower = extraData.tower || {};
          if (reward.tammablocks) tower.tammablocks = (tower.tammablocks || 0) + reward.tammablocks;
          if (reward.towershards) tower.towershards = (tower.towershards || 0) + reward.towershards;
          updates.extraData = { ...extraData, tower };
        }
        if (Object.keys(updates).length > 0) await db.update(charactersTable).set(updates).where(eq(charactersTable.id, characterId));
        claimedPremium.push(tier);
        await db.update(seasonPassTable).set({ claimedPremium }).where(eq(seasonPassTable.id, pass.id));
        sendSuccess(res, { success: true, reward, track: "premium", tier });
      } else {
        sendError(res, 400, "track must be 'free' or 'premium'");
      }
      return;
    }

    // === UNLOCK PREMIUM ===
    if (action === "unlock_premium") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char) { sendError(res, 404, "Character not found"); return; }
      const gems = char.gems || 0;
      if (gems < SEASON_CONFIG.PREMIUM_COST_GEMS) {
        sendError(res, 400, `Not enough gems (need ${SEASON_CONFIG.PREMIUM_COST_GEMS}, have ${gems})`);
        return;
      }
      let [pass] = await db.select().from(seasonPassTable).where(
        and(eq(seasonPassTable.characterId, characterId), eq(seasonPassTable.season, season))
      );
      if (!pass) {
        [pass] = await db.insert(seasonPassTable).values({ characterId, season }).returning();
      }
      if (pass.isPremium) { sendError(res, 400, "Already premium"); return; }
      await db.update(charactersTable).set({ gems: gems - SEASON_CONFIG.PREMIUM_COST_GEMS }).where(eq(charactersTable.id, characterId));
      await db.update(seasonPassTable).set({ isPremium: true }).where(eq(seasonPassTable.id, pass.id));
      sendSuccess(res, { success: true, gemsSpent: SEASON_CONFIG.PREMIUM_COST_GEMS, gemsRemaining: gems - SEASON_CONFIG.PREMIUM_COST_GEMS });
      return;
    }

    sendError(res, 400, `Unknown action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "seasonPassAction error");
    sendError(res, 500, err.message);
  }
});

export default router;
