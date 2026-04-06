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
  petsTable,
  petExpeditionsTable,
  petEquipmentTable,
  runesTable,
  portalSessionsTable,
  worldBossSessionsTable,
  fieldSessionsTable,
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

// Lookup a player by name (case-insensitive) — for whispers, mail, social features
router.post("/functions/lookupPlayerByName", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      sendError(res, 400, "Name is required"); return;
    }
    const trimmed = name.trim();
    // Exact match first (case-insensitive)
    let matches = await db.select({
      id: charactersTable.id,
      name: charactersTable.name,
      level: charactersTable.level,
      class: charactersTable.class,
    }).from(charactersTable).where(sql`LOWER(${charactersTable.name}) = LOWER(${trimmed})`);
    // Fallback to partial match
    if (matches.length === 0) {
      const pattern = `%${trimmed}%`;
      matches = await db.select({
        id: charactersTable.id,
        name: charactersTable.name,
        level: charactersTable.level,
        class: charactersTable.class,
      }).from(charactersTable).where(sql`LOWER(${charactersTable.name}) LIKE LOWER(${pattern})`).limit(10);
    }
    sendSuccess(res, matches.map(r => ({
      id: r.id, name: r.name, level: r.level, class: r.class,
    })));
  } catch (err: any) {
    req.log.error({ err }, "lookupPlayerByName error");
    sendError(res, 500, err.message);
  }
});

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
    if (action === "grant_item" && characterId) {
      const { itemData } = req.body;
      if (!itemData || !itemData.name || !itemData.type) { sendError(res, 400, "itemData with name and type required"); return; }
      const [inserted] = await db.insert(itemsTable).values({
        ownerId: characterId,
        name: itemData.name,
        type: itemData.type,
        rarity: itemData.rarity || "common",
        level: itemData.level || 1,
        stats: itemData.stats || {},
        extraData: itemData.extraData || {},
      }).returning();
      sendSuccess(res, { granted: inserted }); return;
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

// === USE CONSUMABLE ITEM ===
router.post("/functions/useItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { sendError(res, 404, "Item not found"); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { sendError(res, 403, "Not your item"); return; }
    if (item.type !== "consumable") { sendError(res, 400, "Item is not consumable"); return; }

    const extra = (item.extraData as any) || {};
    const consumableType = extra.consumableType || "";
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const charExtra = (char.extraData as any) || {};
    let message = "";
    let effectApplied: any = null;

    // --- SCROLLS: apply timed buff ---
    if (consumableType.startsWith("scroll_")) {
      const stats = (item.stats as any) || {};
      const bonus = stats.bonus_value || 25;
      const duration = (stats.duration || 7200) * 1000; // convert seconds to ms
      const buffTypeMap: Record<string, string> = {
        scroll_exp: "exp_bonus",
        scroll_gold: "gold_bonus",
        scroll_dmg: "dmg_bonus",
        scroll_loot: "loot_bonus",
      };
      const buffType = buffTypeMap[consumableType] || "exp_bonus";
      const activeBuffs = (charExtra.active_buffs || []).filter(
        (b: any) => new Date(b.expires_at).getTime() > Date.now()
      );
      activeBuffs.push({
        type: buffType,
        value: bonus,
        expires_at: new Date(Date.now() + duration).toISOString(),
        source: item.name,
      });
      await db.update(charactersTable).set({ extraData: { ...charExtra, active_buffs: activeBuffs } }).where(eq(charactersTable.id, char.id));
      const durationMin = Math.round(duration / 60000);
      message = `${item.name} activated! +${bonus}% ${buffType.replace("_bonus", "").toUpperCase()} for ${durationMin} minutes.`;
      effectApplied = { type: buffType, value: bonus, duration: durationMin };
    }
    // --- HOURGLASS: refill dungeon entries ---
    else if (consumableType === "hourglass") {
      // Reset dungeon entries
      const dungeonConfigKey = `dungeon_entries_${char.id}`;
      await db.insert(gameConfigTable).values({ id: dungeonConfigKey, config: { entries: [], windowStart: Date.now() } })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: { entries: [], windowStart: Date.now() } } });
      // Reset guild boss attack cooldown
      const guildBossKey = `guild_boss_attacks_${char.id}`;
      await db.insert(gameConfigTable).values({ id: guildBossKey, config: { attacks: [], windowStart: Date.now() } })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: { attacks: [], windowStart: Date.now() } } });
      message = "Hourglass of Eternity used! All timed entries have been reset (Dungeons, Guild Raids).";
      effectApplied = { type: "dungeon_reset" };
    }
    // --- DUNGEON TICKET: refill 1 dungeon entry ---
    else if (consumableType === "dungeon_ticket") {
      const dungeonConfigKey = `dungeon_entries_${char.id}`;
      const [dungeonEntry] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, dungeonConfigKey));
      let entryData: any = dungeonEntry?.config || { entries: [], windowStart: Date.now() };
      if (entryData.entries.length > 0) {
        entryData.entries.pop(); // Remove one entry to free up a slot
      }
      await db.insert(gameConfigTable).values({ id: dungeonConfigKey, config: entryData })
        .onConflictDoUpdate({ target: gameConfigTable.id, set: { config: entryData } });
      const entriesUsed = entryData.entries.length;
      const entriesLeft = Math.max(0, 5 - entriesUsed);
      message = `Dungeon Ticket used! You now have ${entriesLeft}/5 entries available.`;
      effectApplied = { type: "dungeon_entry", entriesLeft };
    }
    // --- PET EGG: start incubation (requires incubator item) ---
    else if (consumableType === "pet_egg" || consumableType === "pet_egg_shiny") {
      // Check if player has an incubator
      const [incubator] = await db.select().from(itemsTable).where(
        and(eq(itemsTable.ownerId, char.id), sql`extra_data->>'consumableType' = 'pet_incubator'`)
      );
      if (!incubator) {
        sendError(res, 400, "You need a Pet Incubator to hatch eggs! Incubators drop from World Bosses.");
        return;
      }
      // Check if already incubating
      const activeIncubation = charExtra.incubating_egg;
      if (activeIncubation && activeIncubation.hatches_at) {
        sendError(res, 400, "Already incubating an egg! Wait for it to hatch first.");
        return;
      }
      const isShiny = consumableType === "pet_egg_shiny" || extra.guaranteed_shiny;
      const eggRarity = isShiny ? "shiny" : (extra.eggRarity || item.rarity || "common");
      // Hatch time: 1h common, 2h uncommon, 3h rare, 4h epic, 6h legendary, 8h shiny/mythic
      const hatchHours: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 6, mythic: 8, shiny: 8 };
      const hours = hatchHours[eggRarity] || 2;
      const hatchesAt = new Date(Date.now() + hours * 3600000).toISOString();
      // Consume incubator
      await db.delete(itemsTable).where(eq(itemsTable.id, incubator.id));
      // Start incubation
      await db.update(charactersTable).set({
        extraData: { ...charExtra, incubating_egg: { eggRarity, isShiny, hatches_at: hatchesAt, speedups_used: 0, egg_name: item.name } },
      }).where(eq(charactersTable.id, char.id));
      message = `${item.name} is now incubating! It will hatch in ${hours} hours. Check the Pets tab!`;
      effectApplied = { type: "incubation_started", eggRarity, hatchesAt, hours };
    }
    // --- HEALTH / MANA POTIONS ---
    else if (consumableType === "health_potion" || consumableType === "mana_potion") {
      const stats = (item.stats as any) || {};
      const healAmount = stats.heal_amount || 200;
      if (consumableType === "health_potion") {
        const newHp = Math.min((char.maxHp || char.max_hp || 1000), (char.hp || 0) + healAmount);
        await db.update(charactersTable).set({ hp: newHp }).where(eq(charactersTable.id, char.id));
        message = `${item.name} used! Restored ${healAmount} HP.`;
        effectApplied = { type: "heal_hp", amount: healAmount, newHp };
      } else {
        const newMp = Math.min((char.maxMp || char.max_mp || 500), (char.mp || 0) + healAmount);
        await db.update(charactersTable).set({ mp: newMp }).where(eq(charactersTable.id, char.id));
        message = `${item.name} used! Restored ${healAmount} MP.`;
        effectApplied = { type: "heal_mp", amount: healAmount, newMp };
      }
    }
    else {
      sendError(res, 400, `Unknown consumable type: ${consumableType}`);
      return;
    }

    // Delete the consumed item (or reduce stack if stacked)
    await db.delete(itemsTable).where(eq(itemsTable.id, itemId));

    sendSuccess(res, { success: true, message, effect: effectApplied });
  } catch (err: any) {
    req.log.error({ err }, "useItem error");
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
    const activeDailyCount = activeQuests.filter(q => (q as any).type === "daily").length;
    const activeWeeklyCount = activeQuests.filter(q => (q as any).type === "weekly").length;
    if (activeDailyCount >= 5 && activeWeeklyCount >= 2) {
      sendSuccess(res, { quests: activeQuests }); return;
    }

    // Calculate next midnight UTC for daily expiry
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    // Daily quest pool — randomly pick 5 per day
    const dailyPool = [
      { title: "Monster Slayer", description: "Kill 10 enemies", objectiveType: "combat_kills", target: 10, reward: { gold: 200, exp: 100 } },
      { title: "Gold Hoarder", description: "Earn 500 gold", objectiveType: "gold_earned", target: 500, reward: { gold: 300, gems: 1 } },
      { title: "Level Up", description: "Gain a level", objectiveType: "level_up", target: 1, reward: { gold: 500, gems: 2 } },
      { title: "Elite Hunter", description: "Kill 3 bosses or elites", objectiveType: "boss_kills", target: 3, reward: { gold: 400, gems: 2, exp: 200 } },
      { title: "Dungeon Crawler", description: "Complete 2 dungeons", objectiveType: "dungeon_complete", target: 2, reward: { gold: 600, gems: 3 } },
      { title: "Potion Brewer", description: "Craft 3 items in Life Skills", objectiveType: "craft_items", target: 3, reward: { gold: 300, exp: 150 } },
      { title: "Rune Collector", description: "Obtain 2 runes", objectiveType: "rune_drops", target: 2, reward: { gold: 250, gems: 1 } },
      { title: "Tower Climber", description: "Clear 5 tower floors", objectiveType: "tower_floors", target: 5, reward: { gold: 500, gems: 2, exp: 300 } },
      { title: "Portal Explorer", description: "Survive 3 portal waves", objectiveType: "portal_waves", target: 3, reward: { gold: 400, gems: 2 } },
      { title: "Skill Master", description: "Use 10 skills in combat", objectiveType: "skills_used", target: 10, reward: { gold: 200, exp: 200 } },
    ];

    // Weekly quest pool — check for weeklies too
    const nextWeek = new Date(now);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + (7 - nextWeek.getUTCDay()));
    nextWeek.setUTCHours(0, 0, 0, 0);
    const weeklyPool = [
      { title: "Weekly Slaughter", description: "Kill 100 enemies this week", objectiveType: "combat_kills", target: 100, reward: { gold: 2000, gems: 10, exp: 1000 } },
      { title: "Weekly Wealth", description: "Earn 10,000 gold this week", objectiveType: "gold_earned", target: 10000, reward: { gold: 5000, gems: 5 } },
      { title: "Weekly Dungeoneer", description: "Complete 10 dungeons this week", objectiveType: "dungeon_complete", target: 10, reward: { gold: 3000, gems: 8 } },
      { title: "Weekly Tower Master", description: "Clear 25 tower floors this week", objectiveType: "tower_floors", target: 25, reward: { gold: 3000, gems: 10, exp: 2000 } },
    ];

    const existingTitles = new Set(activeQuests.map(q => q.title));
    const activeDailies = activeQuests.filter(q => (q as any).type === "daily").length;
    const activeWeeklies = activeQuests.filter(q => (q as any).type === "weekly").length;
    const newQuests = [];

    // Generate dailies (up to 5)
    const shuffledDaily = [...dailyPool].sort(() => Math.random() - 0.5);
    for (const template of shuffledDaily) {
      if (activeDailies + newQuests.filter(q => q.type === "daily").length >= 5) break;
      if (existingTitles.has(template.title)) continue;
      const [quest] = await db.insert(questsTable).values({
        characterId, type: "daily", title: template.title, description: template.description,
        objective: { type: template.objectiveType }, target: template.target, reward: template.reward,
        status: "active", expiresAt: tomorrow,
      }).returning();
      newQuests.push(quest);
    }

    // Generate weeklies (up to 2)
    const shuffledWeekly = [...weeklyPool].sort(() => Math.random() - 0.5);
    for (const template of shuffledWeekly) {
      if (activeWeeklies + newQuests.filter(q => q.type === "weekly").length >= 2) break;
      if (existingTitles.has(template.title)) continue;
      const [quest] = await db.insert(questsTable).values({
        characterId, type: "weekly", title: template.title, description: template.description,
        objective: { type: template.objectiveType }, target: template.target, reward: template.reward,
        status: "active", expiresAt: nextWeek,
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

      // Update quest progress: craft_items
      try {
        const craftQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, charId), eq(questsTable.status, "active")));
        for (const q of craftQuests) {
          if ((q.objective as any)?.type === "craft_items") {
            const np = Math.min((q.progress || 0) + qty, q.target);
            await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
          }
        }
      } catch {}

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

// ── Get my party: reliable server-side lookup (GET to avoid cache invalidation) ──
router.get("/functions/getMyParty", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const characterId = req.query.characterId as string;
    if (!characterId) { sendError(res, 400, "characterId required"); return; }
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const allActive = await db.select().from(partiesTable).where(sql`${partiesTable.status} != 'disbanded'`);
    const myParty = allActive.find(p => {
      if (p.leaderId === characterId) return true;
      const members = (p.members as any[]) || [];
      return members.some((m: any) => m.character_id === characterId);
    }) || null;
    // Set no-cache headers so browsers/proxies don't cache stale party state
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    if (myParty) {
      sendSuccess(res, {
        id: myParty.id,
        leader_id: myParty.leaderId,
        leader_name: myParty.leaderName,
        members: myParty.members,
        status: myParty.status,
        max_members: myParty.maxMembers,
        extra_data: myParty.extraData,
        created_at: myParty.createdAt,
        updated_at: myParty.updatedAt,
      });
    } else {
      sendSuccess(res, null);
    }
  } catch (err: any) {
    req.log.error({ err }, "getMyParty error");
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
            await db.update(partiesTable).set({ status: "disbanded", members: [], updatedAt: new Date() }).where(eq(partiesTable.id, oldParty.id));
          } else {
            const updateData: any = { members: filtered, updatedAt: new Date() };
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
      const now = new Date();
      await db.update(partiesTable).set({ members, updatedAt: now }).where(eq(partiesTable.id, inv.partyId));
      await db.update(partyInvitesTable).set({ status: "accepted" }).where(eq(partyInvitesTable.id, inviteId));
      // Return the full party so the frontend can update its cache immediately
      const [updatedParty] = await db.select().from(partiesTable).where(eq(partiesTable.id, inv.partyId));
      sendSuccess(res, { success: true, party: updatedParty });
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
      await db.update(partiesTable).set({ members, updatedAt: new Date() }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true });
      return;
    }

    if (action === "leave" && partyId) {
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (party) {
        const members = ((party.members as any[]) || []).filter((m: any) => m.character_id !== characterId);
        if (members.length === 0) {
          await db.update(partiesTable).set({ status: "disbanded", members: [], updatedAt: new Date() }).where(eq(partiesTable.id, partyId));
        } else {
          const updateData: any = { members, updatedAt: new Date() };
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
      await db.update(partiesTable).set({ status: "disbanded", members: [], updatedAt: new Date() }).where(eq(partiesTable.id, partyId));
      sendSuccess(res, { success: true });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "manageParty error");
    sendError(res, 500, err.message);
  }
});

// ── GET shared enemy state (lightweight, no cache invalidation) ──────────
router.get("/functions/getSharedEnemy", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const partyId = req.query.partyId as string;
    if (!partyId) { sendError(res, 400, "partyId required"); return; }
    const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
    if (!party) { sendError(res, 404, "Party not found"); return; }
    const extra = (party.extraData as any) || {};
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    sendSuccess(res, {
      shared_enemy: extra.shared_enemy || null,
      last_killed_enemy: extra.last_killed_enemy || null,
    });
  } catch (err: any) {
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
        await db.update(partiesTable).set({ status: "disbanded", members: [], updatedAt: new Date() }).where(eq(partiesTable.id, party.id));
      } else {
        const updateData: any = { members, updatedAt: new Date() };
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
const SKILL_DATA: Record<string, { damage: number; mp: number; element?: string }> = {
  // ── Warrior ──
  w_basic_strike: { damage: 1.3, mp: 18, element: "physical" }, w_shield_block: { damage: 0, mp: 22 },
  w_power_strike: { damage: 1.8, mp: 32, element: "physical" }, w_flame_slash: { damage: 1.5, mp: 35, element: "fire" },
  w_shield_bash: { damage: 1.5, mp: 42, element: "physical" }, w_war_cry: { damage: 0, mp: 40 },
  w_rage: { damage: 2.2, mp: 55, element: "physical" }, w_blood_rage: { damage: 1.7, mp: 48, element: "blood" },
  w_whirlwind: { damage: 1.7, mp: 65, element: "physical" }, w_taunt: { damage: 0, mp: 45 },
  w_ground_slam: { damage: 2.5, mp: 75, element: "physical" }, w_thunder_strike: { damage: 2.0, mp: 70, element: "lightning" },
  w_bulwark: { damage: 0, mp: 85 }, w_avatar: { damage: 3.0, mp: 110, element: "physical" },
  w_juggernaut: { damage: 2.8, mp: 100, element: "physical" }, w_sand_veil: { damage: 1.5, mp: 90, element: "sand" },
  w_titan_form: { damage: 0, mp: 140 }, w_armageddon: { damage: 5.0, mp: 160, element: "fire" },
  w_eternal_guard: { damage: 3.5, mp: 130, element: "physical" },
  w_cleave: { damage: 1.6, mp: 40, element: "physical" }, w_iron_skin: { damage: 0, mp: 35 },
  w_execute: { damage: 2.0, mp: 60, element: "physical" }, w_earthquake: { damage: 2.2, mp: 80, element: "sand" },
  w_battle_shout: { damage: 0, mp: 50 }, w_blood_sacrifice: { damage: 3.2, mp: 95, element: "blood" },
  w_tremor: { damage: 2.8, mp: 100, element: "physical" }, w_inferno_blade: { damage: 4.5, mp: 145, element: "fire" },
  w_godslayer: { damage: 8.0, mp: 200, element: "physical" }, w_warlord_aura: { damage: 0, mp: 180 },
  w_ragnarok: { damage: 10.0, mp: 250, element: "fire" },
  // ── Mage ──
  m_magic_bolt: { damage: 1.4, mp: 22, element: "arcane" }, m_frost_armor: { damage: 0, mp: 28 },
  m_fireball: { damage: 1.9, mp: 38, element: "fire" }, m_poison_bolt: { damage: 1.2, mp: 30, element: "poison" },
  m_ice_lance: { damage: 1.6, mp: 48, element: "ice" }, m_mana_shield: { damage: 0, mp: 55 },
  m_arcane_burst: { damage: 2.4, mp: 65, element: "arcane" }, m_lightning_bolt: { damage: 1.8, mp: 45, element: "lightning" },
  m_blizzard: { damage: 2.0, mp: 85, element: "ice" }, m_flame_wall: { damage: 1.8, mp: 80, element: "fire" },
  m_time_warp: { damage: 0, mp: 75 }, m_meteor: { damage: 3.0, mp: 100, element: "fire" },
  m_black_hole: { damage: 2.5, mp: 110, element: "arcane" }, m_arcane_nova: { damage: 3.2, mp: 130, element: "arcane" },
  m_blood_pact: { damage: 2.0, mp: 95, element: "blood" }, m_chrono_rift: { damage: 0, mp: 100 },
  m_ice_prison: { damage: 2.2, mp: 105, element: "ice" },
  m_singularity: { damage: 4.0, mp: 150, element: "arcane" }, m_genesis: { damage: 3.5, mp: 140, element: "arcane" },
  m_apocalypse: { damage: 6.0, mp: 180, element: "fire" },
  m_arcane_shield: { damage: 0, mp: 55 }, m_chain_lightning: { damage: 2.0, mp: 60, element: "lightning" },
  m_poison_cloud: { damage: 1.5, mp: 55, element: "poison" }, m_frost_nova: { damage: 1.8, mp: 70, element: "ice" },
  m_mana_burn: { damage: 1.6, mp: 65, element: "arcane" }, m_infernal_pact: { damage: 2.5, mp: 90, element: "fire" },
  m_sandstorm: { damage: 2.0, mp: 80, element: "sand" }, m_arcane_god: { damage: 5.0, mp: 160, element: "arcane" },
  m_supernova: { damage: 7.0, mp: 200, element: "fire" }, m_absolute_zero: { damage: 5.5, mp: 170, element: "ice" },
  // ── Ranger ──
  r_quick_shot: { damage: 1.2, mp: 15, element: "physical" }, r_dodge_roll: { damage: 0, mp: 20 },
  r_poison_shot: { damage: 1.0, mp: 22, element: "poison" }, r_fire_arrow: { damage: 1.4, mp: 28, element: "fire" },
  r_triple_shot: { damage: 1.5, mp: 40, element: "physical" }, r_frost_arrow: { damage: 1.3, mp: 35, element: "ice" },
  r_multishot: { damage: 2.2, mp: 60, element: "physical" }, r_lightning_arrow: { damage: 1.8, mp: 52, element: "lightning" },
  r_eagle_eye: { damage: 0, mp: 45 }, r_traps: { damage: 1.5, mp: 55, element: "physical" },
  r_sand_trap: { damage: 1.4, mp: 50, element: "sand" }, r_arrow_rain: { damage: 2.5, mp: 80, element: "physical" },
  r_hunters_mark: { damage: 0, mp: 70 }, r_blood_arrow: { damage: 2.0, mp: 75, element: "blood" },
  r_volley: { damage: 2.8, mp: 100, element: "physical" }, r_shadow_step: { damage: 1.8, mp: 85, element: "physical" },
  r_death_arrow: { damage: 4.0, mp: 130, element: "poison" }, r_storm_bow: { damage: 4.5, mp: 150, element: "lightning" },
  r_wrath_of_hunt: { damage: 5.0, mp: 160, element: "physical" },
  r_nature_bond: { damage: 0, mp: 55 }, r_explosive_arrow: { damage: 1.6, mp: 35, element: "fire" },
  r_wind_walk: { damage: 0, mp: 30 }, r_venom_rain: { damage: 2.2, mp: 75, element: "poison" },
  r_snipe: { damage: 2.5, mp: 65, element: "physical" }, r_elemental_quiver: { damage: 0, mp: 80 },
  // ── Rogue ──
  ro_quick_slash: { damage: 1.3, mp: 16, element: "physical" }, ro_smoke_bomb: { damage: 0, mp: 22 },
  ro_poison_blade: { damage: 1.1, mp: 20, element: "poison" }, ro_backstab: { damage: 2.0, mp: 32, element: "physical" },
  ro_open_wounds: { damage: 1.5, mp: 38, element: "blood" }, ro_pickpocket: { damage: 0, mp: 30 },
  ro_frost_strike: { damage: 1.4, mp: 35, element: "ice" }, ro_lightning_step: { damage: 1.8, mp: 48, element: "lightning" },
  ro_blade_dance: { damage: 1.8, mp: 60, element: "physical" }, ro_garrote: { damage: 1.6, mp: 55, element: "blood" },
  ro_sand_blind: { damage: 1.3, mp: 50, element: "sand" }, ro_shadow_strike: { damage: 2.5, mp: 75, element: "physical" },
  ro_blood_frenzy: { damage: 2.2, mp: 85, element: "blood" }, ro_death_mark: { damage: 2.0, mp: 80, element: "poison" },
  ro_assassinate: { damage: 3.5, mp: 110, element: "physical" }, ro_shadow_realm_entry: { damage: 2.0, mp: 90, element: "physical" },
  ro_oblivion: { damage: 4.0, mp: 130, element: "physical" }, ro_phantom: { damage: 3.5, mp: 125, element: "physical" },
  ro_reaper: { damage: 5.5, mp: 170, element: "physical" },
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

  // Rune bonuses (socketed runes — those with an itemId)
  const RUNE_STAT_MAP: Record<string, string> = {
    attack_pct: "damage", crit_chance: "crit_chance", crit_dmg_pct: "crit_dmg_pct",
    attack_speed: "attack_speed", lifesteal: "lifesteal", defense_pct: "defense",
    block_chance: "block_chance", evasion: "evasion", hp_flat: "hp_bonus", mp_flat: "mp_bonus",
    fire_dmg: "fire_dmg", ice_dmg: "ice_dmg", lightning_dmg: "lightning_dmg",
    poison_dmg: "poison_dmg", blood_dmg: "blood_dmg", sand_dmg: "sand_dmg",
    boss_dmg_pct: "boss_dmg_pct",
  };
  let bossDmgPct = 0;
  try {
    const runes = await db.select().from(runesTable).where(
      and(eq(runesTable.characterId, String(charId)), sql`${runesTable.itemId} IS NOT NULL`)
    );
    for (const rune of runes) {
      const mainKey = RUNE_STAT_MAP[rune.mainStat];
      if (mainKey) {
        if (mainKey === "damage") dmgBonus += rune.mainValue || 0;
        else if (mainKey === "defense") totalDef += rune.mainValue || 0;
        else if (mainKey === "hp_bonus") hpBonus += rune.mainValue || 0;
        else if (mainKey === "mp_bonus") mpBonus += rune.mainValue || 0;
        else if (mainKey === "crit_chance") critChance += rune.mainValue || 0;
        else if (mainKey === "crit_dmg_pct") critDmgPct += rune.mainValue || 0;
        else if (mainKey === "attack_speed") atkSpeed += rune.mainValue || 0;
        else if (mainKey === "lifesteal") lifesteal += rune.mainValue || 0;
        else if (mainKey === "evasion") evasion += rune.mainValue || 0;
        else if (mainKey === "block_chance") blockChance += rune.mainValue || 0;
        else if (mainKey === "boss_dmg_pct") bossDmgPct += rune.mainValue || 0;
        else if (ELEM_KEYS.includes(mainKey)) elemDmg[mainKey] = (elemDmg[mainKey] || 0) + (rune.mainValue || 0);
      }
      // Sub-stats
      const subs = (rune.subStats as any[]) || [];
      for (const sub of subs) {
        const subKey = RUNE_STAT_MAP[sub.stat];
        if (subKey === "damage") dmgBonus += sub.value || 0;
        else if (subKey === "defense") totalDef += sub.value || 0;
        else if (subKey === "crit_chance") critChance += sub.value || 0;
        else if (subKey === "crit_dmg_pct") critDmgPct += sub.value || 0;
        else if (subKey === "lifesteal") lifesteal += sub.value || 0;
        else if (subKey === "boss_dmg_pct") bossDmgPct += sub.value || 0;
        else if (subKey && ELEM_KEYS.includes(subKey)) elemDmg[subKey] = (elemDmg[subKey] || 0) + (sub.value || 0);
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
    boss_dmg_pct: bossDmgPct,
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
        sendError(res, 400, `Dungeon limit reached (${DUNGEON_MAX_ENTRIES} per 8 hours). Resets in ${minutesLeft} minutes. Use a Dungeon Ticket to refill!`);
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
        // Pet egg drop chance from dungeon boss (10% per member)
        for (const m of members) {
          try {
            if (Math.random() < 0.10) {
              const eggRarity = rollPetEggRarity(0);
              const eggDef = PET_EGG_TIERS[eggRarity] || PET_EGG_TIERS.common;
              await db.insert(itemsTable).values({
                ownerId: m.character_id, name: eggDef.name, type: "consumable", rarity: eggRarity,
                level: 1, stats: {}, extraData: { consumableType: "pet_egg", eggRarity, source: "dungeon" },
              });
              d.combat_log.push({ type: "system", text: `${m.name} found a ${eggDef.name}!` });
            }
          } catch {}
        }
        await db.update(dungeonSessionsTable).set({ status: "completed", data: d }).where(eq(dungeonSessionsTable.id, session.id));

        // Update quest progress: dungeon_complete
        try {
          const dungQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of dungQuests) {
            if ((q.objective as any)?.type === "dungeon_complete") {
              const np = Math.min((q.progress || 0) + 1, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
            }
          }
        } catch {}

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
        // Tower dust drops: every 5 floors, higher floors = better dust
        const towerFloor = floor;
        if (towerFloor % 5 === 0) {
          let tDustType = "magic_dust";
          let tDustAmt = 2;
          if (towerFloor >= 80) { tDustType = "void_dust"; tDustAmt = 2 + Math.floor(towerFloor / 50); }
          else if (towerFloor >= 40) { tDustType = "heavens_dust"; tDustAmt = 2 + Math.floor(towerFloor / 30); }
          else { tDustAmt = 2 + Math.floor(towerFloor / 20); }
          extraData[tDustType] = (extraData[tDustType] || 0) + tDustAmt;
        }

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

        // Update quest progress: tower_floors
        try {
          const towerQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of towerQuests) {
            if ((q.objective as any)?.type === "tower_floors") {
              const np = Math.min((q.progress || 0) + 1, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
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
                level: loot.item_level || Math.max(1, Math.floor(floor / 10)),
                stats: loot.stats || {},
                extraData: {
                  source: "tower", floor,
                  subtype: loot.subtype || null,
                  level_req: loot.level_req || Math.max(1, Math.floor(floor / 10)),
                  sell_price: loot.sell_price || 0,
                  proc_effects: loot.proc_effects || null,
                  rune_slots: loot.rune_slots || 0,
                  set_name: loot.set_name || null,
                  class_restriction: loot.class_restriction || null,
                  is_unique: loot.is_unique || false,
                  uniqueEffect: loot.uniqueEffect || null,
                  lore: loot.lore || null,
                },
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

// ── Pet Evolution System ──
const PET_EVOLUTION_STAGES = [
  { stage: 0, name: "Baby", prefix: "", levelReq: 0, statMult: 1.0 },
  { stage: 1, name: "Adult", prefix: "Elder ", levelReq: 15, statMult: 1.5 },
  { stage: 2, name: "Elder", prefix: "Ancient ", levelReq: 35, statMult: 2.5 },
];

const EVOLUTION_MATERIAL_COST: Record<string, number> = {
  common: 1000, uncommon: 3000, rare: 8000, epic: 20000, legendary: 50000, mythic: 100000,
};

// ── Pet Skill Tree ──
const PET_SKILL_TREES = {
  combat: {
    damage_boost: { name: "Damage Boost", desc: "+2% damage per point", maxPoints: 5, effect: { damage: 0.02 } },
    crit_mastery: { name: "Crit Mastery", desc: "+1% crit chance per point", maxPoints: 5, effect: { critChance: 0.01 } },
    lethal_strikes: { name: "Lethal Strikes", desc: "+3% boss damage per point", maxPoints: 5, effect: { bossDamage: 0.03 } },
    berserker: { name: "Berserker", desc: "+2% attack speed per point", maxPoints: 5, effect: { attackSpeed: 0.02 } },
  },
  resource: {
    gold_finder: { name: "Gold Finder", desc: "+2% gold gain per point", maxPoints: 5, effect: { goldGain: 0.02 } },
    exp_seeker: { name: "EXP Seeker", desc: "+2% exp gain per point", maxPoints: 5, effect: { expGain: 0.02 } },
    lucky_looter: { name: "Lucky Looter", desc: "+2% drop rate per point", maxPoints: 5, effect: { luck: 0.02 } },
    treasure_sense: { name: "Treasure Sense", desc: "+3% expedition loot per point", maxPoints: 5, effect: { expeditionLoot: 0.03 } },
  },
  utility: {
    quick_learner: { name: "Quick Learner", desc: "+3% pet XP gain per point", maxPoints: 5, effect: { petXpGain: 0.03 } },
    bond_master: { name: "Bond Master", desc: "+3% bond gain per point", maxPoints: 5, effect: { bondGain: 0.03 } },
    expedition_pro: { name: "Expedition Pro", desc: "+3% expedition speed per point", maxPoints: 5, effect: { expeditionSpeed: 0.03 } },
    aura_amplifier: { name: "Aura Amplifier", desc: "+2% aura strength per point", maxPoints: 5, effect: { auraStrength: 0.02 } },
  },
};

const SKILL_POINTS_PER_LEVEL = 1; // Gain 1 skill point per pet level
const SKILL_RESET_COST = 2000; // Gold cost to reset skill tree

// ── Pet Aura/Synergy System ──
const PET_AURAS: Record<string, { name: string; desc: string; effect: Record<string, number> }> = {
  Wolf: { name: "Pack Howl", desc: "+2% party damage", effect: { partyDamage: 0.02 } },
  Phoenix: { name: "Rebirth Glow", desc: "+3% healing", effect: { healing: 0.03 } },
  Dragon: { name: "Dragon's Might", desc: "+3% all damage", effect: { damage: 0.03 } },
  Turtle: { name: "Shell Guard", desc: "+3% defense", effect: { defense: 0.03 } },
  Cat: { name: "Fortune Purr", desc: "+3% luck", effect: { luck: 0.03 } },
  Owl: { name: "Sage Wisdom", desc: "+3% exp gain", effect: { expGain: 0.03 } },
  Slime: { name: "Golden Ooze", desc: "+3% gold gain", effect: { goldGain: 0.03 } },
  Fairy: { name: "Fairy Dust", desc: "+1% all stats", effect: { allStats: 0.01 } },
  Serpent: { name: "Venom Aura", desc: "+2% crit damage", effect: { critDamage: 0.02 } },
  Golem: { name: "Stone Fortitude", desc: "+4% HP", effect: { hp: 0.04 } },
};

const SET_BONUSES = [
  { name: "Fire Fury", required: ["Phoenix", "Dragon"], bonus: { damage: 0.15, critChance: 0.05 }, desc: "+15% damage, +5% crit" },
  { name: "Nature's Grace", required: ["Cat", "Owl"], bonus: { expGain: 0.15, luck: 0.05 }, desc: "+15% exp, +5% luck" },
  { name: "Iron Wall", required: ["Turtle", "Golem"], bonus: { defense: 0.20, hp: 0.10 }, desc: "+20% defense, +10% HP" },
  { name: "Shadow Dance", required: ["Wolf", "Serpent"], bonus: { critChance: 0.10, damage: 0.10 }, desc: "+10% crit, +10% damage" },
  { name: "Mystic Harmony", required: ["Fairy", "Owl", "Phoenix"], bonus: { allStats: 0.08, healing: 0.15 }, desc: "+8% all, +15% healing" },
  { name: "Beast Trio", required: ["Wolf", "Cat", "Serpent"], bonus: { luck: 0.12, goldGain: 0.12 }, desc: "+12% luck, +12% gold" },
];

// ── Pet Bond System ──
const BOND_LEVELS = [
  { level: 0, name: "Stranger", xpReq: 0, bonus: 0 },
  { level: 1, name: "Acquainted", xpReq: 200, bonus: 0.01 },
  { level: 2, name: "Friendly", xpReq: 600, bonus: 0.02 },
  { level: 3, name: "Trusted", xpReq: 1500, bonus: 0.04 },
  { level: 4, name: "Bonded", xpReq: 3000, bonus: 0.06 },
  { level: 5, name: "Soulbound", xpReq: 6000, bonus: 0.10 },
];

const FEED_BOND_GAIN = 5;
const FEED_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours between feeds
const COMBAT_BOND_GAIN = 1;
const EXPEDITION_BOND_GAIN = 3;

// ── Breeding System ──
const BREEDING_COST = 5000; // base gold cost
const BREEDING_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between breeds

const MUTATION_TRAITS = [
  { key: "double_strike", name: "Double Strike", desc: "Chance to attack twice", effects: { doubleAttack: 0.10 } },
  { key: "gold_aura", name: "Gold Aura", desc: "+30% gold from all sources", effects: { goldGain: 0.30 } },
  { key: "exp_overflow", name: "EXP Overflow", desc: "+25% exp to party members", effects: { partyExp: 0.25 } },
  { key: "iron_skin", name: "Iron Skin", desc: "+25% defense", effects: { defense: 0.25 } },
  { key: "lucky_star", name: "Lucky Star", desc: "+20% rare drop chance", effects: { luck: 0.20 } },
  { key: "vampiric", name: "Vampiric", desc: "Heals 5% of damage dealt", effects: { lifesteal: 0.05 } },
];

const SECRET_COMBOS: Record<string, { species: string; name: string; rarity: string }> = {
  "Dragon+Phoenix": { species: "Phoenix", name: "Infernal Phoenix", rarity: "legendary" },
  "Wolf+Cat": { species: "Wolf", name: "Shadow Fox", rarity: "epic" },
  "Golem+Turtle": { species: "Golem", name: "Mountain Titan", rarity: "legendary" },
  "Fairy+Slime": { species: "Fairy", name: "Crystal Sprite", rarity: "epic" },
  "Serpent+Dragon": { species: "Dragon", name: "Wyrm Lord", rarity: "mythic" },
  "Owl+Fairy": { species: "Owl", name: "Starweaver", rarity: "legendary" },
};

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
    let buffDmgBonus = 0;
    let buffLootBonus = 0;
    const charExtra = (char.extraData as any) || {};

    // Load equipped pet buffs
    let petExpBonus = 0;
    let petGoldBonus = 0;
    let petCritBonus = 0;
    let petDmgBonus = 0;
    let petLuckBonus = 0;
    let equippedPet: any = null;
    try {
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.characterId, characterId), eq(petsTable.equipped, true))
      );
      if (pet) {
        equippedPet = pet;
        const pv = pet.passiveValue || 0;
        if (pet.passiveType === "exp_gain") petExpBonus = pv / 100;
        else if (pet.passiveType === "gold_gain") petGoldBonus = pv / 100;
        else if (pet.passiveType === "crit_chance") petCritBonus = pv;
        else if (pet.passiveType === "damage") petDmgBonus = pv / 100;
        else if (pet.passiveType === "luck") petLuckBonus = pv;
        else if (pet.passiveType === "defense") {} // defense applies in dungeon/tower only

        // Apply pet skill tree bonuses
        const st = (pet.skillTree as any) || {};
        for (const branchKey of Object.keys(st)) {
          const branch = st[branchKey] || {};
          for (const [skillKey, points] of Object.entries(branch)) {
            if (typeof points !== "number" || points <= 0) continue;
            const skillDef = (PET_SKILL_TREES as any)[branchKey]?.[skillKey];
            if (!skillDef?.effect) continue;
            for (const [effectKey, effectVal] of Object.entries(skillDef.effect)) {
              const bonus = (effectVal as number) * points;
              if (effectKey === "damage") petDmgBonus += bonus;
              else if (effectKey === "critChance") petCritBonus += bonus * 100; // convert to flat %
              else if (effectKey === "bossDamage") { /* applied separately below */ }
              else if (effectKey === "goldGain") petGoldBonus += bonus;
              else if (effectKey === "expGain") petExpBonus += bonus;
              else if (effectKey === "luck") petLuckBonus += bonus * 100;
            }
          }
        }
      }
    } catch {}

    // Calculate pet skill tree boss damage bonus
    let petBossDmgBonus = 0;
    if (equippedPet) {
      const st = (equippedPet.skillTree as any) || {};
      const lethalPts = st.combat?.lethal_strikes || 0;
      if (lethalPts > 0) {
        const skillDef = PET_SKILL_TREES.combat.lethal_strikes;
        petBossDmgBonus = skillDef.effect.bossDamage * lethalPts;
      }
    }

    const activeBuffs = charExtra.active_buffs || [];
    const nowMs = Date.now();
    for (const buff of activeBuffs) {
      if (new Date(buff.expires_at).getTime() > nowMs) {
        if (buff.type === "exp_bonus") buffExpBonus += (buff.value || 0) / 100;
        if (buff.type === "gold_bonus") buffGoldBonus += (buff.value || 0) / 100;
        if (buff.type === "dmg_bonus") buffDmgBonus += (buff.value || 0) / 100;
        if (buff.type === "loot_bonus") buffLootBonus += (buff.value || 0) / 100;
      }
    }

    // Load equipped items' shiny unique proc bonuses
    let shinyExpBonus = 0;
    let shinyGoldBonus = 0;
    let shinyDmgBonus = 0;
    let shinyLootBonus = 0;
    let shinyLifestealPct = 0;
    const triggeredShinyProcs: Array<{ id: string; name: string; description: string }> = [];
    try {
      const equippedItems = await db.select().from(itemsTable).where(
        and(eq(itemsTable.ownerId, characterId), eq((itemsTable as any).equipped, true))
      );
      for (const item of equippedItems) {
        const extra = (item.extraData as any) || {};
        const procs = extra.proc_effects || [];
        for (const proc of procs) {
          if (!proc.unique) continue; // only process shiny unique effects
          switch (proc.id) {
            case "elemental_amplifier": shinyDmgBonus += 0.30; break;
            case "cleave_strike": shinyDmgBonus += 0.20; break; // simplified: bonus damage representing AoE
            case "executioner": shinyDmgBonus += 0.25; break; // avg bonus across fight
            case "berserker_fury": shinyDmgBonus += 0.10; break; // avg HP missing bonus
            case "parry_master": shinyDmgBonus += 0.15; break; // reflected damage as avg bonus
            case "undying_will": break; // survival effect — no direct bonus
            case "fortification": break; // defense effect — no direct bonus
            case "wisdom_aura": shinyExpBonus += 0.25; break;
            case "third_eye": shinyLootBonus += 0.15; break;
            case "rapid_strikes": shinyDmgBonus += 0.20; break; // 20% double-hit
            case "mana_siphon": break; // mana regen
            case "phantom_step": break; // evasion buff
            case "gold_magnet": shinyGoldBonus += 0.30; break;
            case "soul_collector": shinyLifestealPct += 0.08; break;
            case "lucky_star": shinyLootBonus += 0.10; break;
            case "life_link": shinyLifestealPct += 0.05; break;
            case "elemental_shield": break; // defense effect
          }
          triggeredShinyProcs.push({ id: proc.id, name: proc.name || proc.id, description: proc.description || "" });
        }
      }
    } catch {}

    const expGain = Math.round(enemyData.expReward * empoweredMult * (combatCfg.EXP_GAIN_MULTIPLIER || 1) * (1 + partyExpBonus + guildExpBonus + buffExpBonus + petExpBonus + shinyExpBonus));
    const goldGain = Math.round(enemyData.goldReward * empoweredMult * (combatCfg.GOLD_GAIN_MULTIPLIER || 1) * (1 + partyGoldBonus + guildGoldBonus + buffGoldBonus + petGoldBonus + shinyGoldBonus));

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
    const damageDealt = Math.floor((enemyData.hp || Math.floor((char.strength || 10) * 2)) * (1 + buffDmgBonus + shinyDmgBonus + petDmgBonus));
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

    // Dust drops from combat (boss/elite = guaranteed, normal = small chance)
    try {
      const dustDropChance = serverIsBoss ? 0.40 : serverIsElite ? 0.20 : 0.05;
      if (Math.random() < dustDropChance) {
        const charExtra = (updated.extraData as any) || {};
        const cLvl = updated.level || 1;
        // Determine dust type based on character level
        let dustType = "magic_dust";
        let dustAmt = 1;
        if (cLvl >= 70) {
          const r = Math.random();
          dustType = r < 0.3 ? "void_dust" : r < 0.7 ? "heavens_dust" : "magic_dust";
          dustAmt = serverIsBoss ? 3 : serverIsElite ? 2 : 1;
        } else if (cLvl >= 40) {
          const r = Math.random();
          dustType = r < 0.5 ? "heavens_dust" : "magic_dust";
          dustAmt = serverIsBoss ? 2 : 1;
        } else {
          dustAmt = serverIsBoss ? 2 : 1;
        }
        charExtra[dustType] = (charExtra[dustType] || 0) + dustAmt;
        await db.update(charactersTable).set({ extraData: charExtra }).where(eq(charactersTable.id, characterId));
      }
    } catch {}

    // Award pet XP from combat
    if (equippedPet) {
      try {
        let petXp = (equippedPet.xp || 0) + 5;
        let petLevel = equippedPet.level || 1;
        while (petXp >= PET_XP_PER_LEVEL && petLevel < PET_MAX_LEVEL) {
          petXp -= PET_XP_PER_LEVEL;
          petLevel++;
        }
        const newPassiveValue = getPetPassiveValue(petLevel, equippedPet.rarity);
        const newSkillValue = getPetSkillValue(petLevel, equippedPet.rarity);
        // Award bond from combat
        const newBond = (equippedPet.bond || 0) + COMBAT_BOND_GAIN;
        let newBondLevel = equippedPet.bondLevel || 0;
        while (newBondLevel < BOND_LEVELS.length - 1 && newBond >= BOND_LEVELS[newBondLevel + 1].xpReq) {
          newBondLevel++;
        }
        await db.update(petsTable).set({
          xp: petXp, level: petLevel,
          passiveValue: newPassiveValue, skillValue: newSkillValue,
          bond: newBond, bondLevel: newBondLevel,
        }).where(eq(petsTable.id, equippedPet.id));
      } catch {}
    }

    // Pet active skill trigger
    let petSkillResult: any = null;
    if (equippedPet && equippedPet.skillType) {
      const triggerChance = 0.25 + (equippedPet.level || 1) * 0.005; // 25% base + 0.5% per level
      if (Math.random() < triggerChance) {
        const sv = equippedPet.skillValue || 10;
        if (equippedPet.skillType === "heal") {
          const healAmt = Math.floor(sv * (1 + (equippedPet.level || 1) * 0.1));
          petSkillResult = { type: "heal", value: healAmt, message: `${equippedPet.species} healed you for ${healAmt} HP!` };
        } else if (equippedPet.skillType === "shield") {
          const shieldAmt = Math.floor(sv * (1 + (equippedPet.level || 1) * 0.08));
          petSkillResult = { type: "shield", value: shieldAmt, message: `${equippedPet.species} shielded you for ${shieldAmt}!` };
        } else if (equippedPet.skillType === "extra_attack") {
          const dmgAmt = Math.floor(sv * (1 + (equippedPet.level || 1) * 0.12));
          petSkillResult = { type: "extra_attack", value: dmgAmt, message: `${equippedPet.species} attacked for ${dmgAmt} bonus damage!` };
        }
      }
    }

    let lootItem = null;
    let droppedRune: any = null;
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

      // 3. Normal loot generation (loot_bonus increases luck for better drops)
      if (!loot) {
        loot = generateLoot(
          char.level || 1,
          charLuck + Math.floor((buffLootBonus + shinyLootBonus) * 50),
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
            rune_slots: loot.rune_slots || 0,
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

      // 4a. Rune drop chance (boss/elite = higher chance)
      try {
        const runeDropChance = serverIsBoss ? 0.08 : serverIsElite ? 0.03 : 0.005;
        if (Math.random() < runeDropChance) {
          const rarity = rollRuneRarity(char.level || 1, charLuck + petLuckBonus);
          const runeData = generateRune(char.level || 1, rarity);
          const [inserted] = await db.insert(runesTable).values({ characterId, ...runeData }).returning();
          droppedRune = inserted;
        }
      } catch {}

      // 4b. Health/Mana potion drops (small chance from any enemy)
      try {
        const potionDropChance = serverIsBoss ? 0.25 : 0.04;
        if (Math.random() < potionDropChance) {
          const isHealthPotion = Math.random() < 0.6;
          const charLevel = char.level || 1;
          const potionTier = charLevel < 15 ? "Minor" : charLevel < 35 ? "Standard" : charLevel < 60 ? "Greater" : "Supreme";
          const healAmount = { Minor: 200, Standard: 600, Greater: 1500, Supreme: 4000 }[potionTier] || 200;
          const potionRarity = { Minor: "common", Standard: "uncommon", Greater: "rare", Supreme: "epic" }[potionTier] || "common";
          const potionName = isHealthPotion ? `${potionTier} Health Potion` : `${potionTier} Mana Potion`;
          const potionType = isHealthPotion ? "health_potion" : "mana_potion";
          await db.insert(itemsTable).values({
            ownerId: characterId, name: potionName, type: "consumable", rarity: potionRarity,
            level: 1, stats: { heal_amount: healAmount },
            extraData: { consumableType: potionType, potionTier, source: "enemy_drop" },
          });
        }
      } catch {}

      // Pet eggs do NOT drop from normal battles — only from Dungeons, World Boss, Portal, Fields
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
        else if (m.missionKey === "use_skills") inc = 1;
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

    // Return minimal delta instead of full character to reduce egress
    sendSuccess(res, {
        success: true,
        rewards: { exp: expGain, gold: goldGain },
        partyBonuses: partyMembers > 0 ? { expPct: Math.round(partyExpBonus * 100), goldPct: Math.round(partyGoldBonus * 100) } : null,
        delta: {
          exp: newExp, level: newLevel, exp_to_next: newExpToNext,
          gold: newGold, stat_points: newStatPoints, skill_points: newSkillPoints,
          total_kills: newTotalKills, total_damage: newTotalDamage,
          max_hp: newMaxHp, max_mp: newMaxMp,
        },
        levelsGained,
        loot: lootItem,
        droppedRune,
        petSkillResult,
        shinyProcs: triggeredShinyProcs.length > 0 ? triggeredShinyProcs : null,
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

      // Auto-generate missing dailies/weeklies independently
      const currentDailies = currentMissions.filter(m => m.type === "daily");
      // For weekly generation check: count claimed weeklies that haven't expired too (prevents mid-week replacement)
      const allWeekliesThisPeriod = missions.filter(m =>
        m.type === "weekly" &&
        (m.status === "active" || m.status === "completed" || m.status === "claimed") &&
        (!m.expiresAt || new Date(m.expiresAt) >= now)
      );
      const currentWeeklies = currentMissions.filter(m => m.type === "weekly");
      const newMissions: any[] = [];

      if (currentDailies.length < 3) {
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const usedKeys = new Set(currentDailies.map(m => m.missionKey));
        const available = DAILY_MISSION_POOL.filter(m => !usedKeys.has(m.key));
        const picks = pickRandom(available, 3 - currentDailies.length);
        for (const p of picks) {
          const [m] = await db.insert(seasonMissionsTable).values({
            characterId, season, type: "daily", missionKey: p.key, title: p.title, description: p.description,
            progress: 0, target: p.target, xpReward: p.xp, status: "active", expiresAt: tomorrow,
          }).returning();
          newMissions.push(m);
        }
      }

      if (allWeekliesThisPeriod.length < 3) {
        const nextWeek = new Date(now);
        nextWeek.setUTCDate(nextWeek.getUTCDate() + (7 - nextWeek.getUTCDay()));
        nextWeek.setUTCHours(0, 0, 0, 0);
        if (nextWeek <= now) nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
        const usedKeys = new Set(currentWeeklies.map(m => m.missionKey));
        const available = WEEKLY_MISSION_POOL.filter(m => !usedKeys.has(m.key));
        const picks = pickRandom(available, 3 - currentWeeklies.length);
        for (const p of picks) {
          const [m] = await db.insert(seasonMissionsTable).values({
            characterId, season, type: "weekly", missionKey: p.key, title: p.title, description: p.description,
            progress: 0, target: p.target, xpReward: p.xp, status: "active", expiresAt: nextWeek,
          }).returning();
          newMissions.push(m);
        }
      }

      const allMissions = [...currentMissions, ...newMissions];

      sendSuccess(res, {
        pass: { id: pass.id, tier: pass.tier, xp: pass.xp, isPremium: pass.isPremium, claimedFree: pass.claimedFree, claimedPremium: pass.claimedPremium },
        missions: allMissions.map(m => ({ id: m.id, type: m.type, title: m.title, description: m.description, progress: m.progress, target: m.target, xpReward: m.xpReward, status: m.status, expiresAt: m.expiresAt })),
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

// ========== PET / COMPANION SYSTEM ==========
const PET_SPECIES = [
  { species: "Wolf", passiveType: "crit_chance", skillType: "extra_attack", desc: "A loyal wolf companion" },
  { species: "Phoenix", passiveType: "exp_gain", skillType: "heal", desc: "A blazing phoenix" },
  { species: "Dragon", passiveType: "damage", skillType: "extra_attack", desc: "A fearsome dragon whelp" },
  { species: "Turtle", passiveType: "defense", skillType: "shield", desc: "An ancient turtle guardian" },
  { species: "Cat", passiveType: "luck", skillType: "extra_attack", desc: "A mischievous feline" },
  { species: "Owl", passiveType: "exp_gain", skillType: "heal", desc: "A wise owl familiar" },
  { species: "Slime", passiveType: "gold_gain", skillType: "shield", desc: "A friendly slime buddy" },
  { species: "Fairy", passiveType: "crit_chance", skillType: "heal", desc: "A sparkling fairy" },
  { species: "Serpent", passiveType: "damage", skillType: "extra_attack", desc: "A venomous serpent" },
  { species: "Golem", passiveType: "defense", skillType: "shield", desc: "A sturdy stone golem" },
];

const PET_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
const PET_RARITY_MULT: Record<string, number> = { common: 1, uncommon: 1.3, rare: 1.6, epic: 2.0, legendary: 2.5, mythic: 3.2 };
const PET_XP_PER_LEVEL = 500;
const PET_MAX_LEVEL = 50;

const PET_TRAITS = [
  { key: "aggressive", name: "Aggressive", desc: "+15% damage, -10% defense", effects: { damage: 0.15, defense: -0.10 } },
  { key: "lazy", name: "Lazy", desc: "-20% expedition speed, +25% loot quality", effects: { expeditionSpeed: -0.20, lootQuality: 0.25 } },
  { key: "lucky", name: "Lucky", desc: "+20% drop rates", effects: { luck: 0.20 } },
  { key: "brave", name: "Brave", desc: "+10% all stats in boss fights", effects: { bossBonus: 0.10 } },
  { key: "timid", name: "Timid", desc: "+15% defense, -10% damage", effects: { defense: 0.15, damage: -0.10 } },
  { key: "greedy", name: "Greedy", desc: "+25% gold gain", effects: { goldGain: 0.25 } },
  { key: "wise", name: "Wise", desc: "+20% XP gain", effects: { expGain: 0.20 } },
  { key: "swift", name: "Swift", desc: "+25% expedition speed", effects: { expeditionSpeed: 0.25 } },
  { key: "sturdy", name: "Sturdy", desc: "+20% defense, +10% HP", effects: { defense: 0.20, hp: 0.10 } },
  { key: "charismatic", name: "Charismatic", desc: "+15% bond gain", effects: { bondGain: 0.15 } },
  { key: "gluttonous", name: "Gluttonous", desc: "+30% healing received", effects: { healing: 0.30 } },
  { key: "energetic", name: "Energetic", desc: "+10% crit chance, +10% expedition speed", effects: { critChance: 0.10, expeditionSpeed: 0.10 } },
];

const TRAIT_SLOTS_BY_RARITY: Record<string, number> = { common: 1, uncommon: 1, rare: 2, epic: 2, legendary: 3, mythic: 3 };

function rollTraits(rarity: string): any[] {
  const slots = TRAIT_SLOTS_BY_RARITY[rarity] || 1;
  const picked: any[] = [];
  const available = [...PET_TRAITS];
  for (let i = 0; i < slots && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    picked.push(available.splice(idx, 1)[0]);
  }
  return picked.map(t => ({ key: t.key, name: t.name, desc: t.desc }));
}

// === PET EGG TIERS ===
// Eggs come in different rarities — each hatches into a pet of that rarity
// Species pool narrows by rarity: common eggs hatch common pets, legendary eggs hatch powerful pets
const PET_EGG_TIERS: Record<string, { name: string; species: string[] }> = {
  common:    { name: "Cracked Egg",     species: ["Slime", "Cat"] },
  uncommon:  { name: "Spotted Egg",     species: ["Wolf", "Owl", "Cat"] },
  rare:      { name: "Glowing Egg",     species: ["Turtle", "Fairy", "Serpent"] },
  epic:      { name: "Radiant Egg",     species: ["Phoenix", "Golem", "Fairy"] },
  legendary: { name: "Celestial Egg",   species: ["Dragon", "Phoenix"] },
  mythic:    { name: "Primordial Egg",  species: ["Dragon"] },
  shiny:     { name: "Shiny Pet Egg",   species: ["Dragon", "Phoenix", "Fairy", "Wolf"] },
};

function rollPetEggRarity(luck: number): string {
  const roll = Math.random() * 100 + luck * 0.5;
  if (roll > 99) return "legendary";
  if (roll > 95) return "epic";
  if (roll > 85) return "rare";
  if (roll > 65) return "uncommon";
  return "common";
}

function hatchPetFromEgg(eggRarity: string, characterId: string, isShiny: boolean): any {
  const tier = PET_EGG_TIERS[eggRarity] || PET_EGG_TIERS.common;
  const speciesName = tier.species[Math.floor(Math.random() * tier.species.length)];
  const speciesData = PET_SPECIES.find(s => s.species === speciesName) || PET_SPECIES[0];
  const petRarity = isShiny ? "mythic" : eggRarity;
  const petLevel = 1;
  return {
    characterId,
    name: speciesData.species,
    species: speciesData.species,
    rarity: petRarity,
    level: petLevel,
    xp: 0,
    passiveType: speciesData.passiveType,
    passiveValue: getPetPassiveValue(petLevel, petRarity),
    skillType: speciesData.skillType,
    skillValue: getPetSkillValue(petLevel, petRarity),
    traits: rollTraits(petRarity),
  };
}

const EXPEDITION_REGIONS = [
  { key: "forest", name: "Enchanted Forest", element: "nature", minLevel: 1, baseRewards: { gold: 200, exp: 100 }, rareDrop: "herb_bundle" },
  { key: "volcano", name: "Volcanic Depths", element: "fire", minLevel: 5, baseRewards: { gold: 400, exp: 200 }, rareDrop: "fire_crystal" },
  { key: "glacier", name: "Frozen Glacier", element: "ice", minLevel: 10, baseRewards: { gold: 500, exp: 250 }, rareDrop: "frost_shard" },
  { key: "shadow", name: "Shadow Realm", element: "dark", minLevel: 15, baseRewards: { gold: 600, exp: 300 }, rareDrop: "shadow_essence" },
  { key: "sky", name: "Sky Citadel", element: "wind", minLevel: 20, baseRewards: { gold: 800, exp: 400 }, rareDrop: "sky_feather" },
  { key: "abyss", name: "The Abyss", element: "void", minLevel: 30, baseRewards: { gold: 1200, exp: 600 }, rareDrop: "void_crystal" },
];

const EXPEDITION_DURATIONS = [
  { key: "quick", name: "Quick Run", seconds: 300, multiplier: 0.5 },
  { key: "short", name: "Short Expedition", seconds: 1800, multiplier: 1 },
  { key: "medium", name: "Standard Expedition", seconds: 7200, multiplier: 2.5 },
  { key: "long", name: "Long Expedition", seconds: 28800, multiplier: 5 },
  { key: "epic", name: "Epic Expedition", seconds: 86400, multiplier: 12 },
];

const ELEMENT_SPECIES_BONUS: Record<string, string[]> = {
  fire: ["Phoenix", "Dragon"],
  nature: ["Cat", "Owl"],
  ice: ["Turtle", "Golem"],
  dark: ["Serpent", "Wolf"],
  wind: ["Fairy", "Phoenix"],
  void: ["Slime", "Dragon"],
};

function calculateExpeditionRewards(region: any, duration: any, pet: any, traits: any[]): any {
  const base = region.baseRewards;
  const mult = duration.multiplier;
  const levelBonus = 1 + (pet.level || 1) * 0.02;
  const rarityMult = PET_RARITY_MULT[pet.rarity] || 1;

  // Element match bonus
  const matchingSpecies = ELEMENT_SPECIES_BONUS[region.element] || [];
  const elementBonus = matchingSpecies.includes(pet.species) ? 1.5 : 1;

  // Trait bonuses
  let lootQualityBonus = 1;
  for (const t of traits) {
    const traitDef = PET_TRAITS.find(pt => pt.key === t.key);
    if (traitDef?.effects.lootQuality) lootQualityBonus += traitDef.effects.lootQuality;
    if (traitDef?.effects.goldGain) lootQualityBonus += traitDef.effects.goldGain;
  }

  const gold = Math.round(base.gold * mult * levelBonus * rarityMult * elementBonus * lootQualityBonus);
  const exp = Math.round(base.exp * mult * levelBonus * rarityMult * elementBonus);
  const petXp = Math.round(30 * mult * levelBonus);

  // Rare drop chance
  const rareDropChance = 0.05 * mult * lootQualityBonus * (rarityMult * 0.5);
  const hasRareDrop = Math.random() < Math.min(rareDropChance, 0.5);

  // Bonus pet egg chance (small)
  const eggChance = 0.02 * mult * lootQualityBonus;
  const hasEgg = Math.random() < Math.min(eggChance, 0.15);

  return {
    gold, exp, petXp,
    rareDrop: hasRareDrop ? region.rareDrop : null,
    petEgg: hasEgg,
  };
}

const PET_EQUIPMENT_SLOTS = ["collar", "claws", "charm"];

const PET_EQUIPMENT_POOL = {
  collar: [
    { name: "Iron Collar", statType: "defense", baseValue: 5 },
    { name: "Vitality Collar", statType: "hp", baseValue: 10 },
    { name: "Swift Collar", statType: "speed", baseValue: 3 },
    { name: "Guardian Collar", statType: "defense", baseValue: 8 },
  ],
  claws: [
    { name: "Steel Claws", statType: "damage", baseValue: 5 },
    { name: "Venom Claws", statType: "damage", baseValue: 7 },
    { name: "Precision Claws", statType: "crit_chance", baseValue: 3 },
    { name: "Fury Claws", statType: "damage", baseValue: 10 },
  ],
  charm: [
    { name: "Lucky Charm", statType: "luck", baseValue: 5 },
    { name: "Wealth Charm", statType: "gold_gain", baseValue: 8 },
    { name: "Wisdom Charm", statType: "exp_gain", baseValue: 6 },
    { name: "Mystic Charm", statType: "crit_chance", baseValue: 4 },
  ],
};

const SECONDARY_STATS = ["damage", "defense", "hp", "luck", "crit_chance", "exp_gain", "gold_gain", "speed"];

function generatePetEquipment(slot: string, rarity: string, level: number): any {
  const pool = PET_EQUIPMENT_POOL[slot as keyof typeof PET_EQUIPMENT_POOL] || PET_EQUIPMENT_POOL.collar;
  const base = pool[Math.floor(Math.random() * pool.length)];
  const rarityMult = PET_RARITY_MULT[rarity] || 1;
  const levelMult = 1 + level * 0.05;
  const statValue = Math.round(base.baseValue * rarityMult * levelMult);

  // Secondary stat for rare+
  let secondaryStat = null;
  let secondaryValue = 0;
  const rarityIdx = PET_RARITY_ORDER.indexOf(rarity);
  if (rarityIdx >= 2) { // rare or above
    const available = SECONDARY_STATS.filter(s => s !== base.statType);
    secondaryStat = available[Math.floor(Math.random() * available.length)];
    secondaryValue = Math.round(statValue * 0.4);
  }

  return {
    slot, name: `${rarity === "common" ? "" : rarity.charAt(0).toUpperCase() + rarity.slice(1) + " "}${base.name}`,
    rarity, statType: base.statType, statValue, secondaryStat, secondaryValue,
  };
}

function getPetPassiveValue(level: number, rarity: string): number {
  // Balanced: mythic lvl 50 = (1 + 10) * 3.2 = ~35%
  const base = 1 + Math.floor(level * 0.2);
  return Math.floor(base * (PET_RARITY_MULT[rarity] || 1));
}

function getPetSkillValue(level: number, rarity: string): number {
  const base = 2 + Math.floor(level * 0.3);
  return Math.floor(base * (PET_RARITY_MULT[rarity] || 1));
}

router.post("/functions/petAction", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, petId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    // === LIST PETS (pets only, no static data — saves ~1MB per call) ===
    if (action === "list") {
      const pets = await db.select().from(petsTable).where(eq(petsTable.characterId, characterId));
      sendSuccess(res, { pets });
      return;
    }

    // === GET PET META (static data — cache on client, never changes) ===
    if (action === "get_meta") {
      sendSuccess(res, {
        skillTrees: PET_SKILL_TREES,
        bondLevels: BOND_LEVELS,
        evolutionStages: PET_EVOLUTION_STAGES,
        auras: PET_AURAS,
        setBonuses: SET_BONUSES,
        mutationTraits: MUTATION_TRAITS,
        secretCombos: Object.entries(SECRET_COMBOS).map(([key, val]) => {
          const [parent1, parent2] = key.split("+");
          return { parent1, parent2, result: val.species, resultName: val.name, rarity: val.rarity };
        }),
      });
      return;
    }

    // === EQUIP PET ===
    if (action === "equip") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      // Unequip all first
      await db.update(petsTable).set({ equipped: false }).where(
        and(eq(petsTable.characterId, characterId), eq(petsTable.equipped, true))
      );
      // Equip selected
      const [pet] = await db.update(petsTable).set({ equipped: true }).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      ).returning();
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      sendSuccess(res, { pet });
      return;
    }

    // === UNEQUIP PET ===
    if (action === "unequip") {
      await db.update(petsTable).set({ equipped: false }).where(
        and(eq(petsTable.characterId, characterId), eq(petsTable.equipped, true))
      );
      sendSuccess(res, { success: true });
      return;
    }

    // === FUSE PETS (3 same species + rarity → 1 higher rarity) ===
    if (action === "fuse") {
      const { species, rarity } = req.body;
      if (!species || !rarity) { sendError(res, 400, "species and rarity required"); return; }
      const rarityIdx = PET_RARITY_ORDER.indexOf(rarity);
      if (rarityIdx < 0 || rarityIdx >= PET_RARITY_ORDER.length - 1) {
        sendError(res, 400, "Cannot fuse this rarity"); return;
      }
      // Find 3 matching pets (unequipped)
      const candidates = await db.select().from(petsTable).where(
        and(
          eq(petsTable.characterId, characterId),
          eq(petsTable.species, species),
          eq(petsTable.rarity, rarity),
          eq(petsTable.equipped, false)
        )
      );
      if (candidates.length < 3) {
        sendError(res, 400, `Need 3 ${rarity} ${species} pets (have ${candidates.length})`); return;
      }
      const fuseCosts: Record<string, number> = { common: 2000, uncommon: 8000, rare: 25000, epic: 75000, legendary: 200000, mythic: 500000 };
      const fuseCost = fuseCosts[rarity] || 5000;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gold || 0) < fuseCost) { sendError(res, 400, `Need ${fuseCost.toLocaleString()} gold to fuse ${rarity} pets`); return; }
      await db.update(charactersTable).set({ gold: (char.gold || 0) - fuseCost }).where(eq(charactersTable.id, characterId));
      // Fuse success chance based on rarity
      const fuseChance: Record<string, number> = { common: 0.80, uncommon: 0.65, rare: 0.50, epic: 0.35, legendary: 0.20, mythic: 0.10 };
      const fuseProbability = fuseChance[rarity] || 0.80;
      if (Math.random() > fuseProbability) {
        // Failed - lose all 3 pets
        const toDeleteFailed = candidates.slice(0, 3);
        for (const p of toDeleteFailed) {
          await db.delete(petsTable).where(eq(petsTable.id, p.id));
        }
        sendSuccess(res, { success: false, failed: true, lostCount: 3, chance: Math.round(fuseProbability * 100), goldCost: fuseCost });
        return;
      }
      // Delete 3
      const toDelete = candidates.slice(0, 3);
      for (const p of toDelete) {
        await db.delete(petsTable).where(eq(petsTable.id, p.id));
      }
      // Create new higher rarity pet
      const newRarity = PET_RARITY_ORDER[rarityIdx + 1];
      const speciesData = PET_SPECIES.find(s => s.species === species) || PET_SPECIES[0];
      const avgLevel = Math.max(1, Math.floor(toDelete.reduce((s, p) => s + p.level, 0) / 3));
      const [newPet] = await db.insert(petsTable).values({
        characterId,
        name: `${species}`,
        species,
        rarity: newRarity,
        level: avgLevel,
        xp: 0,
        passiveType: speciesData.passiveType,
        passiveValue: getPetPassiveValue(avgLevel, newRarity),
        skillType: speciesData.skillType,
        skillValue: getPetSkillValue(avgLevel, newRarity),
        traits: rollTraits(newRarity),
      }).returning();
      sendSuccess(res, { pet: newPet, fusedFrom: toDelete.map(p => p.id), goldCost: fuseCost });
      return;
    }

    // === RELEASE PET (delete) ===
    if (action === "release") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      if (pet.equipped) { sendError(res, 400, "Cannot release equipped pet"); return; }
      await db.delete(petsTable).where(eq(petsTable.id, petId));
      sendSuccess(res, { released: petId });
      return;
    }

    // === SELL PET ===
    if (action === "sell") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      if (pet.equipped) { sendError(res, 400, "Cannot sell equipped pet"); return; }
      const sellPrices: Record<string, number> = { common: 100, uncommon: 300, rare: 800, epic: 2000, legendary: 5000, mythic: 15000 };
      const goldGain = sellPrices[pet.rarity] || 100;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      await db.update(charactersTable).set({ gold: (char?.gold || 0) + goldGain }).where(eq(charactersTable.id, characterId));
      await db.delete(petsTable).where(eq(petsTable.id, petId));
      sendSuccess(res, { sold: petId, goldGain });
      return;
    }

    // === REROLL TRAITS (costs gold) ===
    if (action === "reroll_traits" || action === "rerollTraits") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      const cost = ({ common: 500, uncommon: 1000, rare: 2500, epic: 5000, legendary: 10000, mythic: 25000 } as Record<string, number>)[pet.rarity] || 1000;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gold || 0) < cost) { sendError(res, 400, `Need ${cost} gold to reroll traits`); return; }
      await db.update(charactersTable).set({ gold: (char.gold || 0) - cost }).where(eq(charactersTable.id, characterId));
      const newTraits = rollTraits(pet.rarity);
      const [updated] = await db.update(petsTable).set({ traits: newTraits }).where(eq(petsTable.id, petId)).returning();
      sendSuccess(res, { pet: updated, cost });
      return;
    }

    // === EVOLVE PET ===
    if (action === "evolve") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      const currentEvo = pet.evolution || 0;
      if (currentEvo >= 2) { sendError(res, 400, "Pet is already at max evolution"); return; }
      const nextStage = PET_EVOLUTION_STAGES[currentEvo + 1];
      if ((pet.level || 1) < nextStage.levelReq) {
        sendError(res, 400, `Pet needs level ${nextStage.levelReq} to evolve (currently ${pet.level})`); return;
      }
      const evolveGemCost: Record<string, number> = { common: 200, uncommon: 350, rare: 500, epic: 800, legendary: 1500, mythic: 3000 };
      const gemCost = evolveGemCost[pet.rarity] || 500;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gems || 0) < gemCost) { sendError(res, 400, `Need ${gemCost} gems to evolve`); return; }
      await db.update(charactersTable).set({ gems: (char.gems || 0) - gemCost }).where(eq(charactersTable.id, characterId));
      // Evolve success chance based on rarity — gems always consumed
      const evolveChance: Record<string, number> = { common: 0.75, uncommon: 0.60, rare: 0.45, epic: 0.30, legendary: 0.20, mythic: 0.10 };
      const evolveProbability = evolveChance[pet.rarity] || 0.80;
      if (Math.random() > evolveProbability) {
        sendSuccess(res, { success: false, failed: true, pet, gemCost, chance: Math.round(evolveProbability * 100) });
        return;
      }
      const newName = `${nextStage.prefix}${pet.species}`;
      const newPassive = Math.floor(getPetPassiveValue(pet.level, pet.rarity) * nextStage.statMult);
      const newSkill = Math.floor(getPetSkillValue(pet.level, pet.rarity) * nextStage.statMult);
      const [updated] = await db.update(petsTable).set({
        evolution: currentEvo + 1, name: newName,
        passiveValue: newPassive, skillValue: newSkill,
      }).where(eq(petsTable.id, petId)).returning();
      sendSuccess(res, { pet: updated, gemCost, stage: nextStage.name });
      return;
    }

    // === ALLOCATE SKILL POINT ===
    if (action === "allocate_skill" || action === "allocateSkill") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const { branch, skill } = req.body;
      if (!branch || !skill) { sendError(res, 400, "branch and skill required"); return; }
      const treeBranch = PET_SKILL_TREES[branch as keyof typeof PET_SKILL_TREES];
      if (!treeBranch) { sendError(res, 400, "Invalid branch"); return; }
      const skillDef = treeBranch[skill as keyof typeof treeBranch];
      if (!skillDef) { sendError(res, 400, "Invalid skill"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      const totalSpent = Object.values((pet.skillTree as any) || {}).reduce((sum: number, b: any) =>
        sum + Object.values(b || {}).reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0), 0) as number;
      const available = (pet.level || 1) * SKILL_POINTS_PER_LEVEL - totalSpent;
      if (available <= 0) { sendError(res, 400, "No skill points available"); return; }
      const tree = { ...((pet.skillTree as any) || {}) };
      if (!tree[branch]) tree[branch] = {};
      const current = tree[branch][skill] || 0;
      if (current >= skillDef.maxPoints) { sendError(res, 400, `${skillDef.name} is maxed out`); return; }
      tree[branch][skill] = current + 1;
      const [updated] = await db.update(petsTable).set({ skillTree: tree }).where(eq(petsTable.id, petId)).returning();
      sendSuccess(res, { pet: updated, allocated: { branch, skill, newLevel: current + 1 } });
      return;
    }

    // === RESET SKILL TREE ===
    if (action === "reset_skills" || action === "resetSkills") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gold || 0) < SKILL_RESET_COST) { sendError(res, 400, `Need ${SKILL_RESET_COST} gold`); return; }
      await db.update(charactersTable).set({ gold: (char.gold || 0) - SKILL_RESET_COST }).where(eq(charactersTable.id, characterId));
      const [updated] = await db.update(petsTable).set({ skillTree: {} }).where(eq(petsTable.id, petId)).returning();
      sendSuccess(res, { pet: updated, goldCost: SKILL_RESET_COST });
      return;
    }

    // === FEED PET (bond gain) ===
    if (action === "feed") {
      if (!petId) { sendError(res, 400, "petId required"); return; }
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }
      const feedCost = 200;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gold || 0) < feedCost) { sendError(res, 400, `Need ${feedCost} gold for pet food`); return; }
      const now = new Date();
      if (pet.lastFedAt && (now.getTime() - new Date(pet.lastFedAt).getTime()) < FEED_COOLDOWN_MS) {
        const remaining = Math.ceil((FEED_COOLDOWN_MS - (now.getTime() - new Date(pet.lastFedAt).getTime())) / 60000);
        sendError(res, 400, `Pet was fed recently. Try again in ${remaining} minutes`);
        return;
      }
      await db.update(charactersTable).set({ gold: (char.gold || 0) - feedCost }).where(eq(charactersTable.id, characterId));
      let newBond = (pet.bond || 0) + FEED_BOND_GAIN;
      let newBondLevel = pet.bondLevel || 0;
      while (newBondLevel < BOND_LEVELS.length - 1 && newBond >= BOND_LEVELS[newBondLevel + 1].xpReq) {
        newBondLevel++;
      }
      const [updated] = await db.update(petsTable).set({
        bond: newBond, bondLevel: newBondLevel, lastFedAt: now,
      }).where(eq(petsTable.id, petId)).returning();
      sendSuccess(res, { pet: updated, bondGain: FEED_BOND_GAIN, goldCost: feedCost, bondLevelName: BOND_LEVELS[newBondLevel].name });
      return;
    }

    // === GET AURAS / SYNERGIES ===
    if (action === "get_auras" || action === "getAuras") {
      const pets = await db.select().from(petsTable).where(eq(petsTable.characterId, characterId));
      const ownedSpecies = [...new Set(pets.map(p => p.species))];
      const activeAuras = ownedSpecies.filter(s => PET_AURAS[s]).map(s => {
        const aura = PET_AURAS[s];
        return { species: s, name: aura.name, desc: aura.desc, effect: aura.desc };
      });
      const allSets = SET_BONUSES.map(sb => ({
        name: sb.name, requiredSpecies: sb.required, bonus: sb.desc, description: sb.desc,
        isActive: sb.required.every(sp => ownedSpecies.includes(sp)),
      }));
      sendSuccess(res, { auras: activeAuras, setBonuses: allSets, ownedSpecies });
      return;
    }

    // === BREED PETS ===
    if (action === "breed") {
      const { pet1Id, pet2Id } = req.body;
      if (!pet1Id || !pet2Id) { sendError(res, 400, "pet1Id and pet2Id required"); return; }
      if (pet1Id === pet2Id) { sendError(res, 400, "Cannot breed a pet with itself"); return; }
      const [p1] = await db.select().from(petsTable).where(and(eq(petsTable.id, pet1Id), eq(petsTable.characterId, characterId)));
      const [p2] = await db.select().from(petsTable).where(and(eq(petsTable.id, pet2Id), eq(petsTable.characterId, characterId)));
      if (!p1 || !p2) { sendError(res, 404, "Pet not found"); return; }
      if (p1.equipped || p2.equipped) { sendError(res, 400, "Cannot breed equipped pets"); return; }
      // Breed cooldown & daily limit check
      const [charForBreed] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const breedExtra = (charForBreed?.extraData as any) || {};
      const breedData = breedExtra.breeding || {};
      const today = new Date().toISOString().slice(0, 10);

      // Reset daily count if it's a new day
      const breedDay = breedData.date || "";
      const breedCountToday = breedDay === today ? (breedData.count || 0) : 0;

      // 4-hour cooldown between breeds (also check old format for migration)
      const lastBreedAt = breedData.last_at ? new Date(breedData.last_at).getTime()
        : breedExtra.last_breed_at ? new Date(breedExtra.last_breed_at).getTime() : 0;
      const breedCooldownRemaining = BREEDING_COOLDOWN_MS - (Date.now() - lastBreedAt);
      if (breedCooldownRemaining > 0) {
        const hoursLeft = Math.ceil(breedCooldownRemaining / (60 * 60 * 1000));
        const minsLeft = Math.ceil(breedCooldownRemaining / (60 * 1000));
        sendError(res, 400, `Breed on cooldown. ${minsLeft < 60 ? minsLeft + " min" : hoursLeft + "h"} remaining.`); return;
      }
      // Daily breed limit: 3 per day (only counts actual breeds, not all pet sources)
      if (breedCountToday >= 3) {
        sendError(res, 400, "Daily breed limit reached (3/day). Resets at midnight."); return;
      }

      const goldCost = 5000;
      const gemCost = 100;
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char || (char.gold || 0) < goldCost || (char.gems || 0) < gemCost) { sendError(res, 400, `Need ${goldCost} gold and ${gemCost} gems to breed`); return; }
      await db.update(charactersTable).set({ gold: (char.gold || 0) - goldCost, gems: (char.gems || 0) - gemCost }).where(eq(charactersTable.id, characterId));

      // Check for secret combo
      const comboKey1 = `${p1.species}+${p2.species}`;
      const comboKey2 = `${p2.species}+${p1.species}`;
      const secret = SECRET_COMBOS[comboKey1] || SECRET_COMBOS[comboKey2];

      let childSpecies: string;
      let childName: string;
      let childRarity: string;
      let isMutation = false;
      let mutationTrait: any = null;

      if (secret && Math.random() < 0.25) {
        // Secret combo triggered!
        childSpecies = secret.species;
        childName = secret.name;
        childRarity = secret.rarity;
      } else {
        // Normal breeding: random species from parents
        childSpecies = Math.random() < 0.5 ? p1.species : p2.species;
        childName = childSpecies;
        // Child rarity: usually same as lower parent, small chance of higher
        const r1 = PET_RARITY_ORDER.indexOf(p1.rarity);
        const r2 = PET_RARITY_ORDER.indexOf(p2.rarity);
        const baseRarityIdx = Math.min(r1, r2);
        const rarityBoost = Math.random() < 0.15 ? 1 : 0;
        childRarity = PET_RARITY_ORDER[Math.min(baseRarityIdx + rarityBoost, PET_RARITY_ORDER.length - 1)];
      }

      // Mutation chance (10% base, higher with rarer parents)
      const mutationChance = 0.10 + (PET_RARITY_ORDER.indexOf(p1.rarity) + PET_RARITY_ORDER.indexOf(p2.rarity)) * 0.02;
      if (Math.random() < mutationChance) {
        isMutation = true;
        mutationTrait = MUTATION_TRAITS[Math.floor(Math.random() * MUTATION_TRAITS.length)];
      }

      const speciesData = PET_SPECIES.find(s => s.species === childSpecies) || PET_SPECIES[0];
      const childLevel = 1;
      const childTraits = rollTraits(childRarity);
      if (mutationTrait) childTraits.push({ key: mutationTrait.key, name: mutationTrait.name, desc: mutationTrait.desc });

      const [child] = await db.insert(petsTable).values({
        characterId, name: childName, species: childSpecies, rarity: childRarity,
        level: childLevel, xp: 0,
        passiveType: speciesData.passiveType,
        passiveValue: getPetPassiveValue(childLevel, childRarity),
        skillType: speciesData.skillType,
        skillValue: getPetSkillValue(childLevel, childRarity),
        traits: childTraits,
      }).returning();

      // Save breed timestamp and daily count
      const latestExtra = (charForBreed?.extraData as any) || {};
      // Re-read extraData to avoid overwriting concurrent changes
      const [freshChar] = await db.select({ extraData: charactersTable.extraData }).from(charactersTable).where(eq(charactersTable.id, characterId));
      const freshExtra = (freshChar?.extraData as any) || latestExtra;
      freshExtra.breeding = { last_at: new Date().toISOString(), date: today, count: breedCountToday + 1 };
      // Migrate: remove old last_breed_at if present
      delete freshExtra.last_breed_at;
      await db.update(charactersTable).set({ extraData: freshExtra }).where(eq(charactersTable.id, characterId));

      sendSuccess(res, {
        child,
        parents: [{ id: p1.id, species: p1.species, rarity: p1.rarity }, { id: p2.id, species: p2.species, rarity: p2.rarity }],
        isSecretCombo: !!secret && childName !== childSpecies,
        isMutation,
        mutationTrait: mutationTrait ? { name: mutationTrait.name, desc: mutationTrait.desc } : null,
        goldCost,
        gemCost,
        nextBreedAt: new Date(Date.now() + BREEDING_COOLDOWN_MS).toISOString(),
      });
      return;
    }

    // === SELL ALL PETS BY RARITY ===
    if (action === "sell_all" || action === "sellAll") {
      const { rarity: targetRarity } = req.body;
      if (!targetRarity) { sendError(res, 400, "rarity required"); return; }
      const sellPrices: Record<string, number> = { common: 100, uncommon: 300, rare: 800, epic: 2000, legendary: 5000, mythic: 15000 };
      const price = sellPrices[targetRarity] || 100;

      // Find all unequipped pets of this rarity
      const petsToSell = await db.select().from(petsTable).where(
        and(eq(petsTable.characterId, characterId), eq(petsTable.rarity, targetRarity), eq(petsTable.equipped, false))
      );

      if (petsToSell.length === 0) { sendError(res, 400, `No unequipped ${targetRarity} pets to sell`); return; }

      const totalGold = petsToSell.length * price;

      // Delete all
      for (const p of petsToSell) {
        await db.delete(petsTable).where(eq(petsTable.id, p.id));
      }

      // Add gold
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      await db.update(charactersTable).set({ gold: (char?.gold || 0) + totalGold }).where(eq(charactersTable.id, characterId));

      sendSuccess(res, { soldCount: petsToSell.length, goldGain: totalGold, rarity: targetRarity });
      return;
    }

    // === GRANT PET (for testing / admin) ===
    if (action === "grant_pet") {
      const { species: reqSpecies, rarity: reqRarity } = req.body;
      const speciesData = PET_SPECIES.find(s => s.species === (reqSpecies || "Wolf")) || PET_SPECIES[0];
      const rarity = reqRarity || "rare";
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const petLevel = 1;
      const [pet] = await db.insert(petsTable).values({
        characterId, name: speciesData.species, species: speciesData.species,
        rarity, level: petLevel, xp: 0,
        passiveType: speciesData.passiveType,
        passiveValue: getPetPassiveValue(petLevel, rarity),
        skillType: speciesData.skillType,
        skillValue: getPetSkillValue(petLevel, rarity),
        traits: rollTraits(rarity),
      }).returning();
      sendSuccess(res, { pet });
      return;
    }

    // === HATCHERY: check incubation status ===
    if (action === "hatchery_status") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const charExtra = (char?.extraData as any) || {};
      const incubating = charExtra.incubating_egg || null;
      // Count incubator items
      const incubators = await db.select().from(itemsTable).where(
        and(eq(itemsTable.ownerId, characterId), sql`extra_data->>'consumableType' = 'pet_incubator'`)
      );
      // Count egg items
      const eggs = await db.select().from(itemsTable).where(
        and(eq(itemsTable.ownerId, characterId), sql`extra_data->>'consumableType' IN ('pet_egg', 'pet_egg_shiny')`)
      );
      sendSuccess(res, { incubating, incubatorCount: incubators.length, eggs: eggs.map(e => ({ id: e.id, name: e.name, rarity: e.rarity, extraData: e.extraData })) });
      return;
    }

    // === HATCHERY: speed up incubation with gems ===
    if (action === "hatchery_speedup") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const charExtra = (char?.extraData as any) || {};
      const incubating = charExtra.incubating_egg;
      if (!incubating || !incubating.hatches_at) { sendError(res, 400, "Nothing incubating"); return; }
      if ((incubating.speedups_used || 0) >= 5) { sendError(res, 400, "Max 5 speedups reached"); return; }
      const gemCost = 50;
      if ((char.gems || 0) < gemCost) { sendError(res, 400, "Not enough gems (50 required)"); return; }
      // Subtract 30 minutes from hatch time
      const newHatchTime = new Date(new Date(incubating.hatches_at).getTime() - 30 * 60000).toISOString();
      incubating.hatches_at = newHatchTime;
      incubating.speedups_used = (incubating.speedups_used || 0) + 1;
      await db.update(charactersTable).set({
        gems: (char.gems || 0) - gemCost,
        extraData: { ...charExtra, incubating_egg: incubating },
      }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, { incubating, gemsLeft: (char.gems || 0) - gemCost });
      return;
    }

    // === HATCHERY: claim hatched pet ===
    if (action === "hatchery_claim") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const charExtra = (char?.extraData as any) || {};
      const incubating = charExtra.incubating_egg;
      if (!incubating || !incubating.hatches_at) { sendError(res, 400, "Nothing incubating"); return; }
      if (new Date(incubating.hatches_at).getTime() > Date.now()) { sendError(res, 400, "Egg hasn't hatched yet!"); return; }
      // Hatch the pet
      const petData = hatchPetFromEgg(incubating.eggRarity, characterId, incubating.isShiny);
      const [newPet] = await db.insert(petsTable).values(petData).returning();
      // Clear incubation
      delete charExtra.incubating_egg;
      await db.update(charactersTable).set({ extraData: charExtra }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, { pet: newPet, hatched: true });
      return;
    }

    sendError(res, 400, `Unknown action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "petAction error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/petExpedition", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, petId, region, duration } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    // === LIST EXPEDITIONS ===
    if (action === "list") {
      const expeditions = await db.select().from(petExpeditionsTable).where(
        and(eq(petExpeditionsTable.characterId, characterId), eq(petExpeditionsTable.status, "active"))
      );
      const regions = EXPEDITION_REGIONS;
      const durations = EXPEDITION_DURATIONS;
      sendSuccess(res, { expeditions, regions, durations });
      return;
    }

    // === START EXPEDITION ===
    if (action === "start") {
      if (!petId || !region || !duration) { sendError(res, 400, "petId, region, and duration required"); return; }

      // Check pet exists and isn't already on expedition
      const [pet] = await db.select().from(petsTable).where(
        and(eq(petsTable.id, petId), eq(petsTable.characterId, characterId))
      );
      if (!pet) { sendError(res, 404, "Pet not found"); return; }

      const activeExp = await db.select().from(petExpeditionsTable).where(
        and(eq(petExpeditionsTable.petId, petId), eq(petExpeditionsTable.status, "active"))
      );
      if (activeExp.length > 0) { sendError(res, 400, "Pet is already on an expedition"); return; }

      const regionData = EXPEDITION_REGIONS.find(r => r.key === region);
      if (!regionData) { sendError(res, 400, "Invalid region"); return; }
      if ((pet.level || 1) < regionData.minLevel) { sendError(res, 400, `Pet needs level ${regionData.minLevel} for this region`); return; }

      const durationData = EXPEDITION_DURATIONS.find(d => d.key === duration);
      if (!durationData) { sendError(res, 400, "Invalid duration"); return; }

      // Apply trait speed bonuses
      const traits = (pet.traits as any[]) || [];
      let speedMult = 1;
      for (const t of traits) {
        const traitDef = PET_TRAITS.find(pt => pt.key === t.key);
        if (traitDef?.effects.expeditionSpeed) speedMult += traitDef.effects.expeditionSpeed;
      }
      const actualDuration = Math.max(60, Math.round(durationData.seconds * (1 / Math.max(0.5, speedMult))));

      const now = new Date();
      const completesAt = new Date(now.getTime() + actualDuration * 1000);

      // Pre-calculate rewards
      const rewards = calculateExpeditionRewards(regionData, durationData, pet, traits);

      const [expedition] = await db.insert(petExpeditionsTable).values({
        characterId, petId, region, duration: actualDuration,
        startedAt: now, completesAt, status: "active", rewards,
      }).returning();

      sendSuccess(res, { expedition });
      return;
    }

    // === CLAIM EXPEDITION REWARDS ===
    if (action === "claim") {
      const { expeditionId } = req.body;
      if (!expeditionId) { sendError(res, 400, "expeditionId required"); return; }

      const [expedition] = await db.select().from(petExpeditionsTable).where(
        and(eq(petExpeditionsTable.id, expeditionId), eq(petExpeditionsTable.characterId, characterId))
      );
      if (!expedition) { sendError(res, 404, "Expedition not found"); return; }
      if (expedition.status !== "active") { sendError(res, 400, "Expedition already claimed"); return; }

      const now = new Date();
      if (now < new Date(expedition.completesAt)) { sendError(res, 400, "Expedition not finished yet"); return; }

      await db.update(petExpeditionsTable).set({ status: "claimed" }).where(eq(petExpeditionsTable.id, expeditionId));

      const rewards = expedition.rewards as any;

      // Apply gold + exp to character
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) {
        await db.update(charactersTable).set({
          gold: (char.gold || 0) + (rewards.gold || 0),
          exp: (char.exp || 0) + (rewards.exp || 0),
        }).where(eq(charactersTable.id, characterId));
      }

      // Apply pet XP
      const [pet] = await db.select().from(petsTable).where(eq(petsTable.id, expedition.petId));
      if (pet) {
        let petXp = (pet.xp || 0) + (rewards.petXp || 0);
        let petLevel = pet.level || 1;
        while (petXp >= PET_XP_PER_LEVEL && petLevel < PET_MAX_LEVEL) {
          petXp -= PET_XP_PER_LEVEL;
          petLevel++;
        }
        const newPassiveValue = getPetPassiveValue(petLevel, pet.rarity);
        const newSkillValue = getPetSkillValue(petLevel, pet.rarity);
        await db.update(petsTable).set({
          xp: petXp, level: petLevel,
          passiveValue: newPassiveValue, skillValue: newSkillValue,
        }).where(eq(petsTable.id, pet.id));
      }

      // Pet eggs no longer drop from expeditions — only from Dungeons, World Boss, Portal, Fields

      // Equipment drop — chance based on expedition duration
      const equipDropChance = 0.1 + (expedition.duration / 86400) * 0.3; // 10% base + up to 30% for 24h
      if (Math.random() < Math.min(equipDropChance, 0.5)) {
        const equipSlot = PET_EQUIPMENT_SLOTS[Math.floor(Math.random() * PET_EQUIPMENT_SLOTS.length)];
        const equipRarity = Math.random() > 0.9 ? "epic" : Math.random() > 0.7 ? "rare" : Math.random() > 0.4 ? "uncommon" : "common";
        const equipData = generatePetEquipment(equipSlot, equipRarity, pet?.level || 1);
        await db.insert(petEquipmentTable).values({
          characterId, ...equipData,
        });
        rewards.equipmentDrop = equipData;
      }

      sendSuccess(res, { rewards, expedition });
      return;
    }

    // === CANCEL EXPEDITION (get pet back, no rewards) ===
    if (action === "cancel") {
      const { expeditionId } = req.body;
      if (!expeditionId) { sendError(res, 400, "expeditionId required"); return; }
      const [expedition] = await db.select().from(petExpeditionsTable).where(
        and(eq(petExpeditionsTable.id, expeditionId), eq(petExpeditionsTable.characterId, characterId))
      );
      if (!expedition) { sendError(res, 404, "Expedition not found"); return; }
      if (expedition.status !== "active") { sendError(res, 400, "Expedition not active"); return; }
      await db.update(petExpeditionsTable).set({ status: "cancelled" }).where(eq(petExpeditionsTable.id, expeditionId));
      sendSuccess(res, { cancelled: true });
      return;
    }

    sendError(res, 400, `Unknown expedition action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "petExpedition error");
    sendError(res, 500, err.message);
  }
});

router.post("/functions/petEquipment", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, equipmentId, petId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    // === LIST EQUIPMENT (inventory + equipped) ===
    if (action === "list") {
      const equipment = await db.select().from(petEquipmentTable).where(eq(petEquipmentTable.characterId, characterId));
      sendSuccess(res, { equipment });
      return;
    }

    // === EQUIP TO PET ===
    if (action === "equip") {
      if (!equipmentId || !petId) { sendError(res, 400, "equipmentId and petId required"); return; }
      const [item] = await db.select().from(petEquipmentTable).where(
        and(eq(petEquipmentTable.id, equipmentId), eq(petEquipmentTable.characterId, characterId))
      );
      if (!item) { sendError(res, 404, "Equipment not found"); return; }

      // Unequip any item in same slot on target pet
      await db.update(petEquipmentTable).set({ petId: null }).where(
        and(eq(petEquipmentTable.petId, petId), eq(petEquipmentTable.slot, item.slot))
      );

      // Equip
      const [updated] = await db.update(petEquipmentTable).set({ petId }).where(eq(petEquipmentTable.id, equipmentId)).returning();
      sendSuccess(res, { equipment: updated });
      return;
    }

    // === UNEQUIP ===
    if (action === "unequip") {
      if (!equipmentId) { sendError(res, 400, "equipmentId required"); return; }
      const [updated] = await db.update(petEquipmentTable).set({ petId: null }).where(
        and(eq(petEquipmentTable.id, equipmentId), eq(petEquipmentTable.characterId, characterId))
      ).returning();
      if (!updated) { sendError(res, 404, "Equipment not found"); return; }
      sendSuccess(res, { equipment: updated });
      return;
    }

    // === SALVAGE (delete for gold) ===
    if (action === "salvage") {
      if (!equipmentId) { sendError(res, 400, "equipmentId required"); return; }
      const [item] = await db.select().from(petEquipmentTable).where(
        and(eq(petEquipmentTable.id, equipmentId), eq(petEquipmentTable.characterId, characterId))
      );
      if (!item) { sendError(res, 404, "Equipment not found"); return; }
      if (item.petId) { sendError(res, 400, "Unequip before salvaging"); return; }

      const goldValue = Math.round((item.statValue + (item.secondaryValue || 0)) * 10 * (PET_RARITY_MULT[item.rarity] || 1));
      await db.delete(petEquipmentTable).where(eq(petEquipmentTable.id, equipmentId));

      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) {
        await db.update(charactersTable).set({ gold: (char.gold || 0) + goldValue }).where(eq(charactersTable.id, characterId));
      }

      sendSuccess(res, { salvaged: true, goldGained: goldValue });
      return;
    }

    sendError(res, 400, `Unknown equipment action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "petEquipment error");
    sendError(res, 500, err.message);
  }
});

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  RUNE SYSTEM  (equipment-socketed, dust-based upgrades)                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const RUNE_STATS: Record<string, { label: string; category: string }> = {
  // Offensive
  attack_pct:     { label: "ATK%",           category: "offensive" },
  crit_chance:    { label: "Crit Chance%",   category: "offensive" },
  crit_dmg_pct:   { label: "Crit DMG%",     category: "offensive" },
  boss_dmg_pct:   { label: "Boss DMG%",     category: "offensive" },
  attack_speed:   { label: "ATK Speed%",    category: "offensive" },
  lifesteal:      { label: "Lifesteal%",    category: "offensive" },
  // Defensive
  defense_pct:    { label: "DEF%",           category: "defensive" },
  block_chance:   { label: "Block%",         category: "defensive" },
  evasion:        { label: "Evasion%",       category: "defensive" },
  hp_flat:        { label: "HP",             category: "defensive" },
  mp_flat:        { label: "MP",             category: "defensive" },
  hp_regen:       { label: "HP Regen",       category: "defensive" },
  mp_regen:       { label: "MP Regen",       category: "defensive" },
  // Utility
  exp_pct:        { label: "EXP%",           category: "utility" },
  gold_pct:       { label: "Gold%",          category: "utility" },
  drop_chance:    { label: "Drop%",          category: "utility" },
  // Elemental
  fire_dmg:       { label: "Fire DMG%",      category: "elemental" },
  ice_dmg:        { label: "Ice DMG%",       category: "elemental" },
  lightning_dmg:  { label: "Lightning DMG%", category: "elemental" },
  poison_dmg:     { label: "Poison DMG%",    category: "elemental" },
  blood_dmg:      { label: "Blood DMG%",     category: "elemental" },
  sand_dmg:       { label: "Sand DMG%",      category: "elemental" },
};

const RUNE_STAT_KEYS = Object.keys(RUNE_STATS);

// Main stat base values per rarity (at level 1)
const RUNE_MAIN_STAT_BASE: Record<string, number> = {
  common: 3, uncommon: 5, rare: 8, epic: 12, legendary: 18, mythic: 25,
};

// Sub-stat count by rarity
const RUNE_SUB_COUNT: Record<string, number> = {
  common: 1, uncommon: 1, rare: 2, epic: 3, legendary: 3, mythic: 4,
};

// Sub-stat value ranges per rarity
const RUNE_SUB_VALUE: Record<string, [number, number]> = {
  common: [1, 2], uncommon: [1, 3], rare: [2, 4], epic: [2, 5], legendary: [3, 6], mythic: [4, 8],
};

// Each rune name maps to a FIXED main stat — so players can "build" their character
const RUNE_NAME_STAT_MAP: Record<string, { name: string; mainStat: string }[]> = {
  offensive: [
    { name: "Fury Rune", mainStat: "attack_pct" },
    { name: "Wrath Rune", mainStat: "crit_chance" },
    { name: "Rage Rune", mainStat: "crit_dmg_pct" },
    { name: "Storm Rune", mainStat: "attack_speed" },
    { name: "Havoc Rune", mainStat: "boss_dmg_pct" },
    { name: "Slayer Rune", mainStat: "lifesteal" },
  ],
  defensive: [
    { name: "Ward Rune", mainStat: "defense_pct" },
    { name: "Bastion Rune", mainStat: "hp_flat" },
    { name: "Aegis Rune", mainStat: "block_chance" },
    { name: "Fortitude Rune", mainStat: "hp_regen" },
    { name: "Sentinel Rune", mainStat: "evasion" },
    { name: "Guardian Rune", mainStat: "mp_flat" },
  ],
  utility: [
    { name: "Fortune Rune", mainStat: "gold_pct" },
    { name: "Insight Rune", mainStat: "exp_pct" },
    { name: "Prosperity Rune", mainStat: "drop_chance" },
  ],
  elemental: [
    { name: "Ember Rune", mainStat: "fire_dmg" },
    { name: "Frost Rune", mainStat: "ice_dmg" },
    { name: "Spark Rune", mainStat: "lightning_dmg" },
    { name: "Venom Rune", mainStat: "poison_dmg" },
    { name: "Crimson Rune", mainStat: "blood_dmg" },
    { name: "Dust Rune", mainStat: "sand_dmg" },
  ],
};

// Max rune level: base 1 + 6 upgrades = level 7
const RUNE_MAX_LEVEL = 7;

// Dust types per upgrade bracket
// Level 1→2, 2→3: Magic Dust | 3→4, 4→5: Heavens Dust | 5→6, 6→7: Void Dust
const RUNE_DUST_TYPE: Record<number, string> = {
  1: "magic_dust", 2: "magic_dust",
  3: "heavens_dust", 4: "heavens_dust",
  5: "void_dust", 6: "void_dust",
};
const RUNE_DUST_COST: Record<number, number> = {
  1: 10, 2: 20, 3: 35, 4: 50, 5: 75, 6: 100,
};
// Success rates decrease with level — failure drops 1 level (min 1)
const RUNE_UPGRADE_RATE: Record<number, number> = {
  1: 90, 2: 75, 3: 60, 4: 45, 5: 30, 6: 20,
};
// Minimal stat increase per level: +8% of base value per level
const RUNE_LEVEL_STAT_MULT = 0.08;

function generateRune(characterLevel: number, rarity: string): any {
  // Pick random category, then a random rune from that category (each name has a fixed main stat)
  const categories = Object.keys(RUNE_NAME_STAT_MAP);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const runePool = RUNE_NAME_STAT_MAP[category];
  const pick = runePool[Math.floor(Math.random() * runePool.length)];
  const mainStat = pick.mainStat;
  const name = pick.name;

  const mainBase = RUNE_MAIN_STAT_BASE[rarity] || 3;
  const levelScale = 1 + characterLevel * 0.02;
  const mainValue = Math.round(mainBase * levelScale);

  // Generate sub-stats (different from main stat)
  const subCount = RUNE_SUB_COUNT[rarity] || 1;
  const available = RUNE_STAT_KEYS.filter(s => s !== mainStat);
  const subStats: { stat: string; value: number }[] = [];
  for (let i = 0; i < subCount && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const stat = available.splice(idx, 1)[0];
    const [min, max] = RUNE_SUB_VALUE[rarity] || [1, 2];
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    subStats.push({ stat, value });
  }

  return { runeType: category, mainStat, mainValue, subStats, rarity, level: 1, name };
}

function rollRuneRarity(characterLevel: number, luck: number = 0): string {
  const roll = Math.random() * 100;
  const luckBonus = Math.min(luck * 0.1, 15);
  if (roll < 2 + luckBonus * 0.1)   return "mythic";
  if (roll < 8 + luckBonus * 0.3)   return "legendary";
  if (roll < 20 + luckBonus * 0.5)  return "epic";
  if (roll < 40 + luckBonus)        return "rare";
  if (roll < 65 + luckBonus)        return "uncommon";
  return "common";
}

router.post("/functions/runes", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, runeId, itemId, count } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;

    // === LIST ===
    // Returns all runes + equipped items with their rune slot info
    if (action === "list") {
      const runes = await db.select().from(runesTable).where(eq(runesTable.characterId, characterId));
      // Also fetch equipped items so frontend knows which have rune slots
      const items = await db.select().from(itemsTable).where(
        and(eq(itemsTable.ownerId, characterId), eq(itemsTable.equipped, true))
      );
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const extra = (char?.extraData as any) || {};
      const dust = {
        magic_dust: extra.magic_dust || 0,
        heavens_dust: extra.heavens_dust || 0,
        void_dust: extra.void_dust || 0,
      };
      sendSuccess(res, { runes, equippedItems: items, dust });
      return;
    }

    // === GENERATE (drop from combat/dungeon) ===
    if (action === "generate") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char) { sendError(res, 404, "Character not found"); return; }
      const numRunes = Math.min(count || 1, 3);
      const generated: any[] = [];
      for (let i = 0; i < numRunes; i++) {
        const rarity = rollRuneRarity(char.level || 1, char.luck || 0);
        const runeData = generateRune(char.level || 1, rarity);
        const [inserted] = await db.insert(runesTable).values({
          characterId,
          ...runeData,
        }).returning();
        generated.push(inserted);
      }
      sendSuccess(res, { runes: generated });
      return;
    }

    // === SOCKET RUNE INTO EQUIPMENT ===
    if (action === "socket") {
      if (!runeId || !itemId) { sendError(res, 400, "runeId and itemId required"); return; }

      // Validate rune belongs to character and is not already socketed
      const [rune] = await db.select().from(runesTable).where(
        and(eq(runesTable.id, runeId), eq(runesTable.characterId, characterId))
      );
      if (!rune) { sendError(res, 404, "Rune not found"); return; }
      if (rune.itemId) { sendError(res, 400, "Rune is already socketed — unsocket it first"); return; }

      // Validate item belongs to character and has available rune slots
      const [item] = await db.select().from(itemsTable).where(
        and(eq(itemsTable.id, itemId), eq(itemsTable.ownerId, characterId))
      );
      if (!item) { sendError(res, 404, "Item not found"); return; }
      const extraData = (item.extraData as any) || {};
      const maxSlots = extraData.rune_slots || 0;
      if (maxSlots === 0) { sendError(res, 400, "This item has no rune slots"); return; }

      // Count runes already socketed in this item
      const socketedRunes = await db.select().from(runesTable).where(
        and(eq(runesTable.characterId, characterId), eq(runesTable.itemId, itemId))
      );
      if (socketedRunes.length >= maxSlots) {
        sendError(res, 400, `All ${maxSlots} rune slot(s) are full`); return;
      }

      // Socket the rune
      const [updated] = await db.update(runesTable).set({ itemId }).where(eq(runesTable.id, runeId)).returning();
      sendSuccess(res, { rune: updated });
      return;
    }

    // === UNSOCKET RUNE FROM EQUIPMENT ===
    if (action === "unsocket") {
      if (!runeId) { sendError(res, 400, "runeId required"); return; }
      const [rune] = await db.select().from(runesTable).where(
        and(eq(runesTable.id, runeId), eq(runesTable.characterId, characterId))
      );
      if (!rune) { sendError(res, 404, "Rune not found"); return; }
      if (!rune.itemId) { sendError(res, 400, "Rune is not socketed"); return; }

      const [updated] = await db.update(runesTable).set({ itemId: null }).where(eq(runesTable.id, runeId)).returning();
      sendSuccess(res, { rune: updated });
      return;
    }

    // === UPGRADE RUNE (dust-based RNG) ===
    if (action === "upgrade") {
      if (!runeId) { sendError(res, 400, "runeId required"); return; }
      const [rune] = await db.select().from(runesTable).where(
        and(eq(runesTable.id, runeId), eq(runesTable.characterId, characterId))
      );
      if (!rune) { sendError(res, 404, "Rune not found"); return; }
      const currentLevel = rune.level || 1;
      if (currentLevel >= RUNE_MAX_LEVEL) { sendError(res, 400, "Rune is max level (7)"); return; }

      // Determine dust type & cost
      const dustType = RUNE_DUST_TYPE[currentLevel];
      const dustCost = RUNE_DUST_COST[currentLevel];
      const successRate = RUNE_UPGRADE_RATE[currentLevel];

      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!char) { sendError(res, 404, "Character not found"); return; }
      const extra = (char.extraData as any) || {};
      const currentDust = extra[dustType] || 0;
      if (currentDust < dustCost) {
        const dustLabel = dustType.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        sendError(res, 400, `Need ${dustCost} ${dustLabel} (have ${currentDust})`);
        return;
      }

      // Deduct dust
      const newExtra = { ...extra, [dustType]: currentDust - dustCost };
      await db.update(charactersTable).set({ extraData: newExtra }).where(eq(charactersTable.id, characterId));

      // RNG roll
      const roll = Math.random() * 100;
      const success = roll < successRate;

      if (success) {
        const newLevel = currentLevel + 1;
        // Minimal stat increase: +8% per level on main stat
        const baseValue = RUNE_MAIN_STAT_BASE[rune.rarity || "common"] || 3;
        const charLevelScale = 1 + (char.level || 1) * 0.02;
        const newMainValue = Math.round(baseValue * charLevelScale * (1 + (newLevel - 1) * RUNE_LEVEL_STAT_MULT));

        // Every 2 levels, slightly boost a random sub-stat
        let newSubStats = [...((rune.subStats as any[]) || [])];
        if (newLevel % 2 === 0 && newSubStats.length > 0) {
          const subIdx = Math.floor(Math.random() * newSubStats.length);
          newSubStats[subIdx] = { ...newSubStats[subIdx], value: newSubStats[subIdx].value + 1 };
        }

        const [updated] = await db.update(runesTable).set({
          level: newLevel,
          mainValue: newMainValue,
          subStats: newSubStats,
        }).where(eq(runesTable.id, runeId)).returning();

        sendSuccess(res, { rune: updated, success: true, newLevel, dustUsed: dustType, dustCost });
      } else {
        // Failure: drop 1 level (minimum 1)
        const newLevel = Math.max(1, currentLevel - 1);
        let newMainValue = rune.mainValue;
        if (newLevel < currentLevel) {
          const baseValue = RUNE_MAIN_STAT_BASE[rune.rarity || "common"] || 3;
          const charLevelScale = 1 + (char.level || 1) * 0.02;
          newMainValue = Math.round(baseValue * charLevelScale * (1 + (newLevel - 1) * RUNE_LEVEL_STAT_MULT));
        }

        const [updated] = await db.update(runesTable).set({
          level: newLevel,
          mainValue: newMainValue,
        }).where(eq(runesTable.id, runeId)).returning();

        sendSuccess(res, { rune: updated, success: false, newLevel, dustUsed: dustType, dustCost });
      }
      return;
    }

    // === SALVAGE RUNE (destroy for dust) ===
    if (action === "salvage") {
      if (!runeId) { sendError(res, 400, "runeId required"); return; }
      const [rune] = await db.select().from(runesTable).where(
        and(eq(runesTable.id, runeId), eq(runesTable.characterId, characterId))
      );
      if (!rune) { sendError(res, 404, "Rune not found"); return; }
      if (rune.itemId) { sendError(res, 400, "Unsocket rune before salvaging"); return; }

      // Salvage gives dust based on rune rarity
      const dustReward: Record<string, Record<string, number>> = {
        common:    { magic_dust: 2 },
        uncommon:  { magic_dust: 4 },
        rare:      { magic_dust: 6, heavens_dust: 1 },
        epic:      { magic_dust: 8, heavens_dust: 3 },
        legendary: { heavens_dust: 6, void_dust: 1 },
        mythic:    { heavens_dust: 8, void_dust: 3 },
      };
      const rewards = dustReward[rune.rarity || "common"] || { magic_dust: 1 };
      // Bonus dust for leveled runes
      const levelBonus = Math.floor(((rune.level || 1) - 1) * 1.5);
      if (levelBonus > 0) {
        const primaryDust = Object.keys(rewards)[0];
        rewards[primaryDust] = (rewards[primaryDust] || 0) + levelBonus;
      }

      await db.delete(runesTable).where(eq(runesTable.id, runeId));

      // Award dust to character
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) {
        const extra = (char.extraData as any) || {};
        const newExtra = { ...extra };
        for (const [dustKey, amount] of Object.entries(rewards)) {
          newExtra[dustKey] = (newExtra[dustKey] || 0) + amount;
        }
        await db.update(charactersTable).set({ extraData: newExtra }).where(eq(charactersTable.id, characterId));
      }

      sendSuccess(res, { salvaged: true, dustGained: rewards });
      return;
    }

    // === SALVAGE ALL RUNES BY RARITY ===
    if (action === "salvage_all") {
      const { rarity: targetRarity } = req.body;
      if (!targetRarity) { sendError(res, 400, "rarity required"); return; }
      const runesToSalvage = await db.select().from(runesTable).where(
        and(eq(runesTable.characterId, characterId), eq(runesTable.rarity, targetRarity), sql`${runesTable.itemId} IS NULL`)
      );
      if (runesToSalvage.length === 0) { sendError(res, 400, `No unsocketed ${targetRarity} runes to salvage`); return; }

      const dustReward: Record<string, Record<string, number>> = {
        common:    { magic_dust: 2 },
        uncommon:  { magic_dust: 4 },
        rare:      { magic_dust: 6, heavens_dust: 1 },
        epic:      { magic_dust: 8, heavens_dust: 3 },
        legendary: { heavens_dust: 6, void_dust: 1 },
        mythic:    { heavens_dust: 8, void_dust: 3 },
      };
      const totalDust: Record<string, number> = {};
      for (const rune of runesToSalvage) {
        const rewards = { ...(dustReward[rune.rarity || "common"] || { magic_dust: 1 }) };
        const levelBonus = Math.floor(((rune.level || 1) - 1) * 1.5);
        if (levelBonus > 0) {
          const primaryDust = Object.keys(rewards)[0];
          rewards[primaryDust] = (rewards[primaryDust] || 0) + levelBonus;
        }
        for (const [k, v] of Object.entries(rewards)) totalDust[k] = (totalDust[k] || 0) + v;
      }

      for (const rune of runesToSalvage) {
        await db.delete(runesTable).where(eq(runesTable.id, rune.id));
      }

      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) {
        const extra = (char.extraData as any) || {};
        for (const [k, v] of Object.entries(totalDust)) extra[k] = (extra[k] || 0) + v;
        await db.update(charactersTable).set({ extraData: extra }).where(eq(charactersTable.id, characterId));
      }
      sendSuccess(res, { salvaged: runesToSalvage.length, dustGained: totalDust }); return;
    }

    sendError(res, 400, `Unknown rune action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "runes error");
    sendError(res, 500, err.message);
  }
});

// ========== INFINITE PORTAL ==========
// Infinite wave dungeon with escalating difficulty, up to 4-player party, portal shard upgrades.
// Portal level 1-100, enemies 1.25x stronger per level. Rewards: magic dust, portal shards, unique gear.

const PORTAL_MAX_LEVEL = 100;
const PORTAL_ENEMY_SCALE = 1.25; // per portal level
const PORTAL_MAX_DAILY_ENTRIES = 5;
const PORTAL_ENTRY_RESET_GEM_COST = 500;
const PORTAL_MIN_LEVEL = 50; // minimum character level to enter portal
const PORTAL_SHARD_UPGRADE_COST: Record<number, number> = {};
// Upgrade costs: level 1→2 = 10 shards, scaling up to level 99→100 = ~500 shards
for (let i = 1; i <= PORTAL_MAX_LEVEL; i++) {
  PORTAL_SHARD_UPGRADE_COST[i] = Math.floor(10 + (i - 1) * 5 + Math.pow(i, 1.3));
}

const PORTAL_ENEMY_POOLS = [
  { maxWave: 10, names: ["Portal Wisp", "Rift Crawler", "Void Beetle", "Phase Spider", "Warp Shade"] },
  { maxWave: 25, names: ["Rift Stalker", "Dimensional Horror", "Chaos Imp", "Void Hound", "Phase Knight"] },
  { maxWave: 50, names: ["Abyss Warden", "Rift Titan", "Void Executioner", "Chaos Golem", "Dimension Reaper"] },
  { maxWave: 100, names: ["Omega Rift Lord", "Void Emperor", "Chaos Archon", "Dimension Shatter", "Abyssal Colossus"] },
  { maxWave: Infinity, names: ["Eternal Void Walker", "Infinity Sentinel", "Rift God", "Chaos Incarnate", "The Boundless"] },
];

function getPortalEnemyPool(wave: number) {
  return PORTAL_ENEMY_POOLS.find(p => wave <= p.maxWave) || PORTAL_ENEMY_POOLS[PORTAL_ENEMY_POOLS.length - 1];
}

function generatePortalWave(wave: number, portalLevel: number) {
  const pool = getPortalEnemyPool(wave);
  const levelMult = Math.pow(PORTAL_ENEMY_SCALE, portalLevel - 1); // 1.25^(level-1)
  const waveMult = 1 + (wave - 1) * 0.15; // 15% stronger per wave
  const baseHp = Math.floor((300 + wave * 40 + Math.pow(wave, 1.3) * 3) * levelMult * waveMult);
  const baseDmg = Math.floor((15 + wave * 4 + Math.pow(wave, 1.15) * 0.8) * levelMult * waveMult);
  const baseArmor = Math.floor((5 + wave * 2 + Math.pow(wave, 0.9)) * levelMult);

  const isBossWave = wave % 10 === 0;
  const enemyCount = isBossWave ? 1 : Math.min(3, 1 + Math.floor(wave / 15));
  const elements = ["fire", "ice", "lightning", "poison", "blood", "sand"];
  const element = wave >= 5 ? elements[(wave - 5) % elements.length] : null;

  const enemies: any[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const name = pool.names[(wave + i) % pool.names.length];
    const hpMult = isBossWave ? 4.0 : (enemyCount > 1 ? 0.7 : 1.0);
    const dmgMult = isBossWave ? 2.0 : (enemyCount > 1 ? 0.7 : 1.0);
    enemies.push({
      name: isBossWave ? `${name} [BOSS]` : name,
      hp: Math.floor(baseHp * hpMult),
      max_hp: Math.floor(baseHp * hpMult),
      dmg: Math.floor(baseDmg * dmgMult),
      armor: Math.floor(baseArmor * (isBossWave ? 2.0 : 1.0)),
      element,
      isBoss: isBossWave,
    });
  }
  return { enemies, isBossWave };
}

function getPortalWaveRewards(wave: number, portalLevel: number) {
  const isBoss = wave % 10 === 0;
  const baseGold = 20 + wave * 5 + portalLevel * 2;
  const baseExp = 15 + wave * 4 + portalLevel * 1.5;
  // Portal shards: rare on normal, small amount on boss waves
  const portalShards = isBoss ? Math.max(1, Math.floor(wave / 30)) : (Math.random() < 0.03 ? 1 : 0);
  // Magic dust: every 5th wave (less frequent)
  const dustTypes = ["magic_dust", "heavens_dust", "void_dust"];
  const dustType = wave % 5 === 0 ? dustTypes[Math.min(Math.floor(portalLevel / 35), 2)] : null;
  const dustAmount = dustType ? Math.floor(1 + wave / 15) : 0;
  // Unique gear only drops — portal is the unique gear farming ground
  const hasLoot = isBoss ? Math.random() < 0.15 : Math.random() < 0.04;
  return {
    gold: Math.floor(baseGold * (isBoss ? 3 : 1)),
    exp: Math.floor(baseExp * (isBoss ? 3 : 1)),
    portalShards,
    dustType,
    dustAmount,
    hasLoot,
    hasUniqueLoot: hasLoot, // all portal drops are unique/legendary
  };
}

router.post("/functions/portalAction", async (req: Request, res: Response) => {
  try {
    const { characterId, action, sessionId, skillId, targetIndex } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }
    const extraData = (char.extraData as any) || {};
    const portalData = extraData.portal || { level: 1, shards: 0, highest_wave: 0 };

    // === GET STATUS ===
    if (action === "get_status") {
      const activeSessions = await db.select().from(portalSessionsTable).where(
        and(eq(portalSessionsTable.ownerId, characterId), sql`${portalSessionsTable.status} IN ('waiting', 'combat')`)
      );
      // Also find sessions where this character is a member
      const memberSessions = await db.select().from(portalSessionsTable).where(
        sql`${portalSessionsTable.status} IN ('waiting', 'combat') AND ${portalSessionsTable.members}::jsonb @> ${JSON.stringify([{ characterId }])}::jsonb`
      );
      let activeSession = activeSessions[0] || memberSessions[0] || null;
      // Clean stuck sessions: combat with all enemies dead, or stuck > 2 hours
      if (activeSession) {
        const sd = (activeSession.data as any) || {};
        const enemies = sd.enemies || [];
        const allEnemiesDead = enemies.length > 0 && enemies.every((e: any) => e.hp <= 0);
        const isOld = activeSession.createdAt && (Date.now() - new Date(activeSession.createdAt).getTime() > 2 * 60 * 60 * 1000);
        if ((activeSession.status === "combat" && allEnemiesDead) || isOld) {
          await db.update(portalSessionsTable).set({ status: "abandoned" }).where(eq(portalSessionsTable.id, activeSession.id));
          activeSession = null;
        }
      }
      const nextUpgradeCost = portalData.level < PORTAL_MAX_LEVEL ? PORTAL_SHARD_UPGRADE_COST[portalData.level] : null;
      // Daily entry tracking
      const today = new Date().toISOString().slice(0, 10);
      const dailyEntries = portalData.daily_entries || {};
      const usedToday = dailyEntries[today] || 0;
      sendSuccess(res, {
        portalLevel: portalData.level || 1,
        portalShards: portalData.shards || 0,
        highestWave: portalData.highest_wave || 0,
        nextUpgradeCost,
        maxLevel: PORTAL_MAX_LEVEL,
        entriesUsed: usedToday,
        maxEntries: PORTAL_MAX_DAILY_ENTRIES,
        entryResetGemCost: PORTAL_ENTRY_RESET_GEM_COST,
        characterGems: char.gems || 0,
        minLevel: PORTAL_MIN_LEVEL,
        activeSession: activeSession ? { id: activeSession.id, wave: activeSession.wave, status: activeSession.status, ...(activeSession.data as any), members: activeSession.members } : null,
      });
      return;
    }

    // === RESET ENTRIES: spend gems to reset daily portal entries ===
    if (action === "reset_entries") {
      const gems = char.gems || 0;
      if (gems < PORTAL_ENTRY_RESET_GEM_COST) {
        sendError(res, 400, `Not enough gems (need ${PORTAL_ENTRY_RESET_GEM_COST}, have ${gems})`);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      portalData.daily_entries = { [today]: 0 };
      extraData.portal = portalData;
      await db.update(charactersTable).set({
        extraData,
        gems: gems - PORTAL_ENTRY_RESET_GEM_COST,
      }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, {
        success: true,
        entriesUsed: 0,
        maxEntries: PORTAL_MAX_DAILY_ENTRIES,
        gemsSpent: PORTAL_ENTRY_RESET_GEM_COST,
        gemsRemaining: gems - PORTAL_ENTRY_RESET_GEM_COST,
      });
      return;
    }

    // === LIST ACTIVE: show all active portal sessions anyone can join ===
    if (action === "list_active") {
      const sessions = await db.select().from(portalSessionsTable).where(
        sql`${portalSessionsTable.status} IN ('waiting', 'combat') AND ${portalSessionsTable.createdAt} > NOW() - INTERVAL '2 hours'`
      );
      const activeSessions = sessions.map(s => {
        const members = (s.members as any[]) || [];
        const d = (s.data as any) || {};
        return {
          id: s.id,
          ownerId: s.ownerId,
          ownerName: members[0]?.name || "Unknown",
          wave: s.wave || d.wave || 1,
          portalLevel: s.portalLevel || d.portalLevel || 1,
          memberCount: members.length,
          maxMembers: 4,
          members: members.map((m: any) => ({ name: m.name, class: m.class, level: m.level })),
          status: d.status || s.status,
        };
      });
      sendSuccess(res, { sessions: activeSessions });
      return;
    }

    // === START: leader starts combat from waiting lobby ===
    if (action === "start") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(portalSessionsTable).where(eq(portalSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      if (session.ownerId !== characterId) { sendError(res, 403, "Only the leader can start the portal"); return; }
      if (session.status !== "waiting") { sendError(res, 400, "Session already started"); return; }
      const d = (session.data as any) || {};
      const members = (session.members as any[]) || [];
      const level = session.portalLevel || d.portalLevel || 1;
      const waveData = generatePortalWave(1, level);
      d.enemies = waveData.enemies;
      d.isBossWave = waveData.isBossWave;
      d.wave = 1;
      d.status = "combat";
      d.currentEnemyIndex = 0;
      // Turn-based only for groups (2+ players)
      if (members.length > 1) {
        d.current_turn_index = 0;
        d.turn_deadline = new Date(Date.now() + 3000).toISOString();
      }
      d.totalRewards = { gold: 0, exp: 0, portalShards: 0, dust: {}, loot: [] };
      d.combat_log = [{ type: "system", text: `The Infinite Portal (Lv.${level}) opens! Wave 1 begins! ${members.length} player${members.length > 1 ? "s" : ""} enter the rift!` }];
      await db.update(portalSessionsTable).set({ status: "combat", wave: 1, data: d }).where(eq(portalSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, wave: 1, status: "combat", ...d, members } });
      return;
    }

    // === PORTAL LEADERBOARD ===
    if (action === "leaderboard") {
      const { leaderboardType } = req.body;
      // Fetch all characters with portal data
      const allChars = await db.select({
        id: charactersTable.id,
        name: charactersTable.name,
        class: charactersTable.class,
        level: charactersTable.level,
        extraData: charactersTable.extraData,
      }).from(charactersTable).limit(500);

      const entries = allChars
        .map(c => {
          const ed = (c.extraData as any) || {};
          const pd = ed.portal || {};
          return {
            id: c.id,
            name: c.name,
            class: c.class,
            level: c.level,
            portalLevel: pd.level || 1,
            highestWave: pd.highest_wave || 0,
            highestWaveSolo: pd.highest_wave_solo || 0,
            highestWave2p: pd.highest_wave_2p || 0,
            highestWave3p: pd.highest_wave_3p || 0,
            highestWave4p: pd.highest_wave_4p || 0,
          };
        });

      // Filter & sort by leaderboard type
      const waveKey = leaderboardType === "solo" ? "highestWaveSolo"
        : leaderboardType === "2p" ? "highestWave2p"
        : leaderboardType === "3p" ? "highestWave3p"
        : leaderboardType === "4p" ? "highestWave4p"
        : leaderboardType === "wave" ? "highestWave"
        : null;

      let filtered;
      if (waveKey) {
        filtered = entries.filter(e => (e as any)[waveKey] > 0);
        filtered.sort((a, b) => ((b as any)[waveKey] || 0) - ((a as any)[waveKey] || 0));
      } else {
        // "level" type
        filtered = entries.filter(e => e.portalLevel > 1);
        filtered.sort((a, b) => b.portalLevel - a.portalLevel || b.highestWave - a.highestWave);
      }

      sendSuccess(res, { leaderboard: filtered.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1, waveValue: waveKey ? (e as any)[waveKey] : undefined })) });
      return;
    }

    // === UPGRADE PORTAL ===
    if (action === "upgrade") {
      const level = portalData.level || 1;
      if (level >= PORTAL_MAX_LEVEL) { sendError(res, 400, "Portal is already at max level!"); return; }
      const cost = PORTAL_SHARD_UPGRADE_COST[level];
      const shards = portalData.shards || 0;
      if (shards < cost) { sendError(res, 400, `Not enough Portal Shards (need ${cost}, have ${shards})`); return; }
      portalData.shards = shards - cost;
      portalData.level = level + 1;
      extraData.portal = portalData;
      await db.update(charactersTable).set({ extraData }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, {
        success: true,
        newLevel: portalData.level,
        shardsRemaining: portalData.shards,
        nextUpgradeCost: portalData.level < PORTAL_MAX_LEVEL ? PORTAL_SHARD_UPGRADE_COST[portalData.level] : null,
      });
      return;
    }

    // === RESET PORTAL LEVEL TO 1 ===
    if (action === "reset_level") {
      if ((portalData.level || 1) <= 1) { sendError(res, 400, "Portal is already at level 1"); return; }
      // Refund half of shards spent (rounded down)
      const shardRefund = Math.floor((portalData.shards_spent || 0) * 0.5);
      portalData.level = 1;
      portalData.shards = (portalData.shards || 0) + shardRefund;
      portalData.shards_spent = 0;
      extraData.portal = portalData;
      await db.update(charactersTable).set({ extraData }).where(eq(charactersTable.id, characterId));
      sendSuccess(res, { success: true, newLevel: 1, shardsRefunded: shardRefund, shardsRemaining: portalData.shards });
      return;
    }

    // === ENTER: create or join a portal session ===
    if (action === "enter") {
      // Level requirement check
      if ((char.level || 1) < PORTAL_MIN_LEVEL) {
        sendError(res, 400, `You must be at least level ${PORTAL_MIN_LEVEL} to enter the Infinite Portal! (Current: Lv.${char.level || 1})`);
        return;
      }
      // Clean old stuck sessions (> 2 hours)
      await db.update(portalSessionsTable).set({ status: "abandoned" }).where(
        and(sql`${portalSessionsTable.status} IN ('waiting', 'combat')`,
          sql`${portalSessionsTable.createdAt} < NOW() - INTERVAL '2 hours'`)
      );
      // Check if already in a session
      const existing = await db.select().from(portalSessionsTable).where(
        and(eq(portalSessionsTable.ownerId, characterId), sql`${portalSessionsTable.status} IN ('waiting', 'combat')`)
      );
      if (existing.length > 0) {
        const s = existing[0];
        // Clean stuck sessions (combat but all enemies dead)
        const sd = (s.data as any) || {};
        const sEnemies = sd.enemies || [];
        if (s.status === "combat" && sEnemies.length > 0 && sEnemies.every((e: any) => e.hp <= 0)) {
          await db.update(portalSessionsTable).set({ status: "abandoned" }).where(eq(portalSessionsTable.id, s.id));
        } else {
          sendSuccess(res, { success: true, session: { id: s.id, wave: s.wave, status: s.status, ...sd, members: s.members } });
          return;
        }
      }
      // Also check if member of another session
      const memberOf = await db.select().from(portalSessionsTable).where(
        sql`${portalSessionsTable.status} IN ('waiting', 'combat') AND ${portalSessionsTable.members}::jsonb @> ${JSON.stringify([{ characterId }])}::jsonb`
      );
      if (memberOf.length > 0) {
        const s = memberOf[0];
        const sd2 = (s.data as any) || {};
        const sEnemies2 = sd2.enemies || [];
        if (s.status === "combat" && sEnemies2.length > 0 && sEnemies2.every((e: any) => e.hp <= 0)) {
          await db.update(portalSessionsTable).set({ status: "abandoned" }).where(eq(portalSessionsTable.id, s.id));
        } else {
          sendSuccess(res, { success: true, session: { id: s.id, wave: s.wave, status: s.status, ...sd2, members: s.members } });
          return;
        }
      }

      // Check daily entry limit
      const today = new Date().toISOString().slice(0, 10);
      const dailyEntries = portalData.daily_entries || {};
      const usedToday = dailyEntries[today] || 0;
      if (usedToday >= PORTAL_MAX_DAILY_ENTRIES) {
        sendError(res, 400, `Daily portal entries exhausted (${PORTAL_MAX_DAILY_ENTRIES}/${PORTAL_MAX_DAILY_ENTRIES}). Try again tomorrow!`);
        return;
      }
      // Increment daily entry count
      dailyEntries[today] = usedToday + 1;
      // Clean old dates to prevent bloat
      for (const k of Object.keys(dailyEntries)) { if (k !== today) delete dailyEntries[k]; }
      portalData.daily_entries = dailyEntries;
      extraData.portal = portalData;
      await db.update(charactersTable).set({ extraData }).where(eq(charactersTable.id, characterId));

      const memberStats = await calculateDungeonMemberStats(characterId, char);
      const level = portalData.level || 1;
      const member = { characterId, name: char.name, class: char.class, level: char.level, ...memberStats };

      const sessionData = {
        portalLevel: level,
        wave: 0,
        status: "waiting",
        combat_log: [{ type: "system", text: `${char.name} created a portal lobby (Lv.${level}). Waiting for players...` }],
      };

      const [session] = await db.insert(portalSessionsTable).values({
        ownerId: characterId,
        members: [member],
        portalLevel: level,
        wave: 0,
        status: "waiting",
        data: sessionData,
      }).returning();

      sendSuccess(res, { success: true, session: { id: session.id, wave: 0, status: "waiting", ...sessionData, members: [member] } });
      return;
    }

    // === JOIN: join an existing portal session (party) ===
    if (action === "join") {
      if ((char.level || 1) < PORTAL_MIN_LEVEL) {
        sendError(res, 400, `You must be at least level ${PORTAL_MIN_LEVEL} to enter the Infinite Portal!`);
        return;
      }
      const { targetSessionId } = req.body;
      if (!targetSessionId) { sendError(res, 400, "targetSessionId required"); return; }
      const [session] = await db.select().from(portalSessionsTable).where(eq(portalSessionsTable.id, targetSessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      if (session.status !== "waiting" && session.status !== "combat") { sendError(res, 400, "Session not joinable"); return; }
      const members = (session.members as any[]) || [];
      if (members.length >= 4) { sendError(res, 400, "Portal is full (max 4 players)"); return; }
      if (members.some((m: any) => m.characterId === characterId)) {
        sendSuccess(res, { success: true, session: { id: session.id, wave: session.wave, status: session.status, ...(session.data as any), members } });
        return;
      }
      const memberStats = await calculateDungeonMemberStats(characterId, char);
      const newMember = { characterId, name: char.name, class: char.class, level: char.level, ...memberStats };
      members.push(newMember);
      const d = (session.data as any) || {};
      d.combat_log = d.combat_log || [];
      d.combat_log.push({ type: "system", text: `${char.name} has joined the portal!` });
      await db.update(portalSessionsTable).set({ members, data: d }).where(eq(portalSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, wave: session.wave, status: session.status, ...d, members } });
      return;
    }

    // === GET PARTY SESSIONS: find portal sessions from party members ===
    if (action === "get_party_sessions") {
      const party = await db.select().from(partiesTable).where(
        sql`${partiesTable.members}::jsonb @> ${JSON.stringify([{ character_id: characterId }])}::jsonb AND ${partiesTable.status} = 'open'`
      );
      if (party.length === 0) { sendSuccess(res, { sessions: [] }); return; }
      const partyMembers = ((party[0].members as any[]) || []).map((m: any) => m.character_id).filter(Boolean);
      if (partyMembers.length === 0) { sendSuccess(res, { sessions: [] }); return; }
      const sessions = await db.select().from(portalSessionsTable).where(
        sql`${portalSessionsTable.status} IN ('waiting', 'combat') AND ${portalSessionsTable.ownerId} = ANY(ARRAY[${sql.join(partyMembers.map((id: string) => sql`${id}`), sql`, `)}]::varchar[])`
      );
      sendSuccess(res, { sessions: sessions.map(s => ({ id: s.id, owner: s.ownerId, wave: s.wave, memberCount: ((s.members as any[]) || []).length, portalLevel: s.portalLevel })) });
      return;
    }

    // === ATTACK / SKILL ===
    if (action === "attack" || action === "skill") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(portalSessionsTable).where(eq(portalSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      const d = (session.data as any) || {};
      if (d.status !== "combat") { sendError(res, 400, "Not in combat"); return; }
      const members = (session.members as any[]) || [];
      const meIdx = members.findIndex((m: any) => m.characterId === characterId);
      if (meIdx < 0) { sendError(res, 403, "Not in this portal session"); return; }
      const me = members[meIdx];
      if (!me || me.hp <= 0) { sendError(res, 400, "You are KO'd"); return; }

      // Turn-based enforcement: only the current turn player can act (groups only)
      if (members.length > 1 && d.current_turn_index !== undefined) {
        // If current turn player is dead/invalid, auto-advance to next alive
        const turnHolder = members[d.current_turn_index];
        if (!turnHolder || turnHolder.hp <= 0) {
          let fixIdx = 0;
          for (let i = 0; i < members.length; i++) {
            if (members[i].hp > 0) { fixIdx = i; break; }
          }
          d.current_turn_index = fixIdx;
          d.turn_deadline = new Date(Date.now() + 3000).toISOString();
        }
        if (d.current_turn_index !== meIdx) {
          sendSuccess(res, { success: false, error: "Not your turn" });
          return;
        }
      }

      const enemies = d.enemies || [];
      let tIdx = typeof targetIndex === "number" ? targetIndex : (d.currentEnemyIndex || 0);
      if (!enemies[tIdx] || enemies[tIdx].hp <= 0) {
        tIdx = enemies.findIndex((e: any) => e.hp > 0);
        if (tIdx < 0) tIdx = 0;
      }
      const enemy = enemies[tIdx];
      if (!enemy || enemy.hp <= 0) {
        // All dead — advance wave
        d.status = "wave_clear";
        await db.update(portalSessionsTable).set({ data: d }).where(eq(portalSessionsTable.id, session.id));
        const _ta1 = { ...d, combat_log: (d.combat_log || []).slice(-10) };
        sendSuccess(res, { success: true, session: { id: session.id, wave: session.wave, status: session.status, ..._ta1, members } });
        return;
      }

      // Calculate player damage (same as tower combat)
      const totalStr = me.strength || 10;
      const totalDex = me.dexterity || 8;
      const totalInt = me.intelligence || 5;
      const totalLuck = me.luck || 5;
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + (me.damage || 0);

      if (char.guildId) {
        try {
          const [g] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
          if (g?.buffs && typeof g.buffs === "object") baseDmg *= (1 + ((g.buffs as any).damage_bonus || 0) / 100);
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
      const ELEM_MAP: Record<string, string> = { fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg", poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg" };
      let elemBonusDmg = 0;
      for (const [elem, statKey] of Object.entries(ELEM_MAP)) {
        const val = memberElemDmg[statKey] || 0;
        if (val <= 0) continue;
        const weakness = getElementWeakness(enemy.element);
        let elemMult = elem === weakness ? 1.5 : elem === enemy.element ? 0.5 : 1.0;
        elemBonusDmg += Math.floor(val * elemMult);
      }
      if (elemBonusDmg > 0) playerDmg += elemBonusDmg;

      // Crit
      const effectiveCritChance = Math.min(0.5, ((me.crit_chance || 0) + totalLuck * 0.3 + totalDex * 0.1) / 100);
      const isCrit = Math.random() < effectiveCritChance;
      const critMultiplier = 1.5 + ((me.crit_dmg_pct || 0) / 100);
      const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;

      enemy.hp = Math.max(0, enemy.hp - finalDmg);
      d.combat_log.push({
        type: "player_attack",
        text: `${me.name} uses ${skillName} on ${enemy.name} for ${finalDmg}${isCrit ? " (CRIT!)" : ""}${elemBonusDmg > 0 ? ` (+${elemBonusDmg} elem)` : ""}!`,
      });

      // Lifesteal
      if ((me.lifesteal || 0) > 0 && finalDmg > 0) {
        const rawHeal = Math.floor(finalDmg * me.lifesteal / 100);
        const maxHeal = Math.floor(me.max_hp * 0.10);
        const healAmt = Math.min(rawHeal, maxHeal);
        if (healAmt > 0) {
          me.hp = Math.min(me.max_hp, me.hp + healAmt);
          d.combat_log.push({ type: "heal", text: `${me.name} leeches ${healAmt} HP!` });
        }
      }

      if (enemy.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${enemy.name} defeated!` });
      }

      // Check if all enemies are dead — wave clear
      const allDead = enemies.every((e: any) => e.hp <= 0);
      if (allDead) {
        const wave = session.wave || d.wave || 1;
        const portalLevel = session.portalLevel || d.portalLevel || 1;
        const rewards = getPortalWaveRewards(wave, portalLevel);
        d.rewards = rewards;
        d.combat_log.push({ type: "victory", text: `Wave ${wave} cleared!` });

        // Apply rewards to the attacking character (owner gets rewards)
        const updateSet: any = {
          gold: sql`COALESCE(gold, 0) + ${rewards.gold}`,
          exp: sql`COALESCE(exp, 0) + ${rewards.exp}`,
        };
        await db.update(charactersTable).set(updateSet).where(eq(charactersTable.id, characterId));

        // Portal shards + dust go to extraData
        const charExtra = (char.extraData as any) || {};
        const pData = charExtra.portal || { level: 1, shards: 0, highest_wave: 0 };
        if (rewards.portalShards > 0) pData.shards = (pData.shards || 0) + rewards.portalShards;
        if (wave > (pData.highest_wave || 0)) pData.highest_wave = wave;
        // Track highest wave per group size for rankings
        const groupSize = members.length;
        const groupKey = groupSize === 1 ? "highest_wave_solo" : `highest_wave_${groupSize}p`;
        if (wave > (pData[groupKey] || 0)) pData[groupKey] = wave;
        if (rewards.dustType && rewards.dustAmount > 0) {
          charExtra[rewards.dustType] = (charExtra[rewards.dustType] || 0) + rewards.dustAmount;
        }
        charExtra.portal = pData;
        await db.update(charactersTable).set({ extraData: charExtra }).where(eq(charactersTable.id, characterId));

        // Also give rewards to other party members
        for (const m of members) {
          if (m.characterId === characterId) continue;
          try {
            await db.update(charactersTable).set({
              gold: sql`COALESCE(gold, 0) + ${rewards.gold}`,
              exp: sql`COALESCE(exp, 0) + ${rewards.exp}`,
            }).where(eq(charactersTable.id, m.characterId));
            // Give shards/dust to members too
            const [memberChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, m.characterId));
            if (memberChar) {
              const mExtra = (memberChar.extraData as any) || {};
              const mPortal = mExtra.portal || { level: 1, shards: 0, highest_wave: 0 };
              if (rewards.portalShards > 0) mPortal.shards = (mPortal.shards || 0) + rewards.portalShards;
              if (wave > (mPortal.highest_wave || 0)) mPortal.highest_wave = wave;
              const mGroupKey = groupSize === 1 ? "highest_wave_solo" : `highest_wave_${groupSize}p`;
              if (wave > (mPortal[mGroupKey] || 0)) mPortal[mGroupKey] = wave;
              if (rewards.dustType && rewards.dustAmount > 0) {
                mExtra[rewards.dustType] = (mExtra[rewards.dustType] || 0) + rewards.dustAmount;
              }
              mExtra.portal = mPortal;
              await db.update(charactersTable).set({ extraData: mExtra }).where(eq(charactersTable.id, m.characterId));
            }
          } catch {}
        }

        // Update quest progress: portal_waves
        try {
          const portalQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of portalQuests) {
            if ((q.objective as any)?.type === "portal_waves") {
              const np = Math.min((q.progress || 0) + 1, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
            }
          }
        } catch {}

        // Generate loot for owner
        if (rewards.hasLoot) {
          try {
            const loot = generateLoot(wave + portalLevel * 2, char.luck || 5, true, null, char.class);
            if (loot) {
              const portalRarity = loot.rarity === "mythic" || loot.rarity === "shiny" ? loot.rarity : "legendary";
              await db.insert(itemsTable).values({
                ownerId: characterId,
                name: loot.name,
                type: loot.type,
                rarity: portalRarity,
                level: loot.item_level || Math.max(1, Math.floor((wave + portalLevel) / 5)),
                stats: loot.stats || {},
                extraData: {
                  source: "portal", wave, portal_level: portalLevel,
                  subtype: loot.subtype || null,
                  level_req: loot.level_req || Math.max(1, Math.floor((wave + portalLevel) / 5)),
                  sell_price: loot.sell_price || 0,
                  proc_effects: loot.proc_effects || null,
                  rune_slots: loot.rune_slots || 0,
                  is_unique: loot.is_unique || false,
                  uniqueEffect: loot.uniqueEffect || null,
                  lore: loot.lore || null,
                  class_restriction: loot.class_restriction || null,
                },
              });
              d.combat_log.push({ type: "system", text: `Unique Loot: ${loot.name} (${portalRarity})` });
              d.totalRewards.loot.push(loot.name);
            }
          } catch {}
        }

        // Pet egg drop on boss waves (every 10th wave)
        if (rewards.gold > 0) {
          try {
            const isBossWaveForEgg = wave % 10 === 0;
            const eggChance = isBossWaveForEgg ? 0.20 : 0.05;
            if (Math.random() < eggChance) {
              const eggRarity = rollPetEggRarity(char.luck || 5);
              const eggDef = PET_EGG_TIERS[eggRarity];
              await db.insert(itemsTable).values({
                ownerId: characterId, name: eggDef.name, type: "consumable", rarity: eggRarity,
                level: 1, stats: {}, extraData: { consumableType: "pet_egg", eggRarity, source: "portal" },
              });
              d.combat_log.push({ type: "system", text: `Pet Egg drop: ${eggDef.name}!` });
            }
          } catch {}
        }

        // Reward summary
        let rewardText = `+${rewards.gold}g, +${rewards.exp} exp`;
        if (rewards.portalShards > 0) rewardText += `, +${rewards.portalShards} Portal Shards`;
        if (rewards.dustType) rewardText += `, +${rewards.dustAmount} ${rewards.dustType.replace(/_/g, " ")}`;
        d.combat_log.push({ type: "system", text: rewardText });

        // Accumulate totals (init if missing — for sessions created before totalRewards was added)
        if (!d.totalRewards) d.totalRewards = { gold: 0, exp: 0, portalShards: 0, dust: {}, loot: [] };
        if (!d.totalRewards.dust) d.totalRewards.dust = {};
        if (!d.totalRewards.loot) d.totalRewards.loot = [];
        d.totalRewards.gold = (d.totalRewards.gold || 0) + rewards.gold;
        d.totalRewards.exp = (d.totalRewards.exp || 0) + rewards.exp;
        d.totalRewards.portalShards = (d.totalRewards.portalShards || 0) + rewards.portalShards;
        if (rewards.dustType) {
          d.totalRewards.dust[rewards.dustType] = (d.totalRewards.dust[rewards.dustType] || 0) + rewards.dustAmount;
        }

        // Auto-advance to next wave
        const nextWave = wave + 1;
        const nextWaveData = generatePortalWave(nextWave, portalLevel);
        d.enemies = nextWaveData.enemies;
        d.isBossWave = nextWaveData.isBossWave;
        d.wave = nextWave;
        d.status = "combat";
        d.currentEnemyIndex = 0;
        // Reset turn to first alive member for new wave (groups only)
        if (members.length > 1) {
          let startIdx = 0;
          while (startIdx < members.length && members[startIdx].hp <= 0) startIdx++;
          d.current_turn_index = startIdx < members.length ? startIdx : 0;
          d.turn_deadline = new Date(Date.now() + 3000).toISOString();
        }
        d.combat_log.push({ type: "system", text: `Wave ${nextWave} begins!${nextWaveData.isBossWave ? " ⚠️ BOSS WAVE!" : ""}` });

        members[meIdx] = me;
        await db.update(portalSessionsTable).set({ wave: nextWave, data: d, members }).where(eq(portalSessionsTable.id, session.id));
        const _ta2 = { ...d, combat_log: (d.combat_log || []).slice(-10) };
        sendSuccess(res, { success: true, session: { id: session.id, wave: nextWave, status: "combat", ..._ta2, members } });
        return;
      }

      // Enemies counter-attack the current turn player only
      for (let ei = 0; ei < enemies.length; ei++) {
        const e = enemies[ei];
        if (e.hp <= 0) continue;
        if (me.hp <= 0) break; // already dead, skip further attacks
        const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
        const memberDef = me.defense || 0;
        const memberVit = me.vitality || 8;
        const totalDefense = memberDef + memberVit * 0.5;
        const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
        const evaded = Math.random() < memberEvasion;
        const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);
        const blocked = !evaded && Math.random() < memberBlock;

        if (evaded) {
          d.combat_log.push({ type: "boss_attack", text: `${me.name} evaded ${e.name}'s attack!` });
        } else {
          const mitigated = Math.max(1, eDmg - Math.floor(totalDefense * 0.3));
          const actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
          me.hp = Math.max(0, me.hp - actualDmg);
          d.combat_log.push({ type: "boss_attack", text: `${e.name} hits ${me.name} for ${actualDmg}${blocked ? " (BLOCKED!)" : ""}` });
        }
      }

      if (me.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${me.name} has been knocked out!` });
      }

      members[meIdx] = me;

      // Check if ALL members are dead
      const allMembersDead = members.every((m: any) => m.hp <= 0);
      if (allMembersDead) {
        const wave = session.wave || d.wave || 1;
        d.combat_log.push({ type: "defeat", text: `All players have fallen on Wave ${wave}! The portal collapses...` });
        d.status = "defeat";
        d.finalWave = wave;
        await db.update(portalSessionsTable).set({ status: "defeat", data: d, members }).where(eq(portalSessionsTable.id, session.id));
        const _ta3 = { ...d, combat_log: (d.combat_log || []).slice(-10) };
        sendSuccess(res, { success: true, session: { id: session.id, wave, status: "defeat", ..._ta3, members } });
        return;
      }

      // Advance turn to next alive member (turn-based for groups)
      if (members.length > 1) {
        let nextIdx = (meIdx + 1) % members.length;
        let attempts = 0;
        while (members[nextIdx].hp <= 0 && attempts < members.length) {
          nextIdx = (nextIdx + 1) % members.length;
          attempts++;
        }
        d.current_turn_index = nextIdx;
        d.turn_deadline = new Date(Date.now() + 3000).toISOString();
      }

      d.currentEnemyIndex = enemies.findIndex((e: any) => e.hp > 0);
      if (d.currentEnemyIndex < 0) d.currentEnemyIndex = 0;
      d.enemies = enemies;

      await db.update(portalSessionsTable).set({ data: d, members }).where(eq(portalSessionsTable.id, session.id));
      const _ta4 = { ...d, combat_log: (d.combat_log || []).slice(-10) };
      sendSuccess(res, { success: true, session: { id: session.id, wave: session.wave, status: session.status, ..._ta4, members } });
      return;
    }

    // === LEAVE ===
    if (action === "leave") {
      if (sessionId) {
        const [session] = await db.select().from(portalSessionsTable).where(eq(portalSessionsTable.id, sessionId));
        if (session) {
          const members = (session.members as any[]) || [];
          const leavingMember = members.find((m: any) => m.characterId === characterId);
          const remaining = members.filter((m: any) => m.characterId !== characterId);
          const d = (session.data as any) || {};
          d.combat_log = d.combat_log || [];
          d.combat_log.push({ type: "system", text: `${leavingMember?.name || "A player"} has left the portal.` });
          if (remaining.length === 0 || session.ownerId === characterId) {
            d.combat_log.push({ type: "system", text: "The portal has been abandoned." });
            await db.update(portalSessionsTable).set({ status: "abandoned", data: d }).where(eq(portalSessionsTable.id, sessionId));
          } else {
            // Adjust turn index after member removal
            if (d.current_turn_index !== undefined && remaining.length > 1) {
              const leavingIdx = members.findIndex((m: any) => m.characterId === characterId);
              if (d.current_turn_index >= remaining.length) {
                d.current_turn_index = 0;
              }
              if (leavingIdx === d.current_turn_index || d.current_turn_index >= remaining.length) {
                d.current_turn_index = d.current_turn_index % remaining.length;
                d.turn_deadline = new Date(Date.now() + 3000).toISOString();
              } else if (leavingIdx < d.current_turn_index) {
                d.current_turn_index--;
              }
            } else if (remaining.length <= 1) {
              delete d.current_turn_index;
              delete d.turn_deadline;
            }
            // Check if all remaining members are dead
            const allDead = remaining.every((m: any) => m.hp <= 0);
            if (allDead && d.status === "combat") {
              const wave = session.wave || d.wave || 1;
              d.combat_log.push({ type: "defeat", text: `All remaining players have fallen on Wave ${wave}!` });
              d.status = "defeat";
              d.finalWave = wave;
              await db.update(portalSessionsTable).set({ status: "defeat", members: remaining, data: d }).where(eq(portalSessionsTable.id, sessionId));
            } else {
              await db.update(portalSessionsTable).set({ members: remaining, data: d }).where(eq(portalSessionsTable.id, sessionId));
            }
          }
        }
      } else {
        await db.update(portalSessionsTable).set({ status: "abandoned" }).where(
          and(eq(portalSessionsTable.ownerId, characterId), sql`${portalSessionsTable.status} IN ('waiting', 'combat')`)
        );
      }
      sendSuccess(res, { success: true });
      return;
    }

    // === POLL: get updated session state (for party members) ===
    if (action === "poll") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [s] = await db.select().from(portalSessionsTable).where(eq(portalSessionsTable.id, sessionId));
      if (!s) { sendSuccess(res, { success: false, error: "Session ended" }); return; }
      const pd = (s.data as any) || {};
      const pMembers = (s.members as any[]) || [];

      // AFK auto-attack: if turn deadline has passed and combat is active, auto-attack for the AFK player
      if (pd.status === "combat" && pd.turn_deadline && pMembers.length > 1) {
        const deadline = new Date(pd.turn_deadline).getTime();
        if (Date.now() > deadline) {
          const turnIdx = pd.current_turn_index || 0;
          const afkMember = pMembers[turnIdx];
          if (afkMember && afkMember.hp > 0) {
            // Find first alive enemy
            const enemies = pd.enemies || [];
            const tIdx = enemies.findIndex((e: any) => e.hp > 0);
            if (tIdx >= 0) {
              const enemy = enemies[tIdx];
              // Simple auto-attack: use member stats for basic attack
              const aStr = afkMember.strength || 10;
              const aDex = afkMember.dexterity || 8;
              const aInt = afkMember.intelligence || 5;
              const aScaling: Record<string, { primary: string; mult: number }> = {
                warrior: { primary: "strength", mult: 1.3 }, mage: { primary: "intelligence", mult: 1.4 },
                ranger: { primary: "dexterity", mult: 1.2 }, rogue: { primary: "dexterity", mult: 1.2 },
              };
              const aScale = aScaling[afkMember.class || "warrior"] || aScaling.warrior;
              const aPrimary = aScale.primary === "strength" ? aStr : aScale.primary === "intelligence" ? aInt : aDex;
              const aBaseDmg = aPrimary * aScale.mult + (afkMember.damage || 0);
              const aRawDmg = Math.max(1, Math.floor(aBaseDmg * (0.85 + Math.random() * 0.3)));
              const aPlayerDmg = Math.max(1, aRawDmg - Math.floor((enemy.armor || 0) * 0.4));
              enemy.hp = Math.max(0, enemy.hp - aPlayerDmg);
              pd.combat_log = pd.combat_log || [];
              pd.combat_log.push({ type: "player_attack", text: `${afkMember.name} auto-attacks ${enemy.name} for ${aPlayerDmg}! (AFK)` });

              if (enemy.hp <= 0) {
                pd.combat_log.push({ type: "system", text: `${enemy.name} defeated!` });
              }

              // Check all enemies dead — wave clear
              const allEnemiesDead = enemies.every((e: any) => e.hp <= 0);
              if (allEnemiesDead) {
                // Wave clear! Generate rewards and next wave
                const wave = s.wave || pd.wave || 1;
                const portalLevel = s.portalLevel || pd.portalLevel || 1;
                const rewards = getPortalWaveRewards(wave, portalLevel);
                pd.rewards = rewards;
                pd.combat_log.push({ type: "victory", text: `Wave ${wave} cleared!` });

                // Give rewards to all members
                for (const m of pMembers) {
                  try {
                    await db.update(charactersTable).set({
                      gold: sql`COALESCE(gold, 0) + ${rewards.gold}`,
                      exp: sql`COALESCE(exp, 0) + ${rewards.exp}`,
                    }).where(eq(charactersTable.id, m.characterId));
                    const [mc] = await db.select().from(charactersTable).where(eq(charactersTable.id, m.characterId));
                    if (mc) {
                      const mExtra = (mc.extraData as any) || {};
                      const mPortal = mExtra.portal || { level: 1, shards: 0, highest_wave: 0 };
                      if (rewards.portalShards > 0) mPortal.shards = (mPortal.shards || 0) + rewards.portalShards;
                      if (wave > (mPortal.highest_wave || 0)) mPortal.highest_wave = wave;
                      const gKey = pMembers.length === 1 ? "highest_wave_solo" : `highest_wave_${pMembers.length}p`;
                      if (wave > (mPortal[gKey] || 0)) mPortal[gKey] = wave;
                      if (rewards.dustType && rewards.dustAmount > 0) {
                        mExtra[rewards.dustType] = (mExtra[rewards.dustType] || 0) + rewards.dustAmount;
                      }
                      mExtra.portal = mPortal;
                      await db.update(charactersTable).set({ extraData: mExtra }).where(eq(charactersTable.id, m.characterId));
                    }
                  } catch {}
                }

                // Reward summary
                let rewardText = `+${rewards.gold}g, +${rewards.exp} exp`;
                if (rewards.portalShards > 0) rewardText += `, +${rewards.portalShards} Portal Shards`;
                if (rewards.dustType) rewardText += `, +${rewards.dustAmount} ${rewards.dustType.replace(/_/g, " ")}`;
                pd.combat_log.push({ type: "system", text: rewardText });

                if (!pd.totalRewards) pd.totalRewards = { gold: 0, exp: 0, portalShards: 0, dust: {}, loot: [] };
                if (!pd.totalRewards.dust) pd.totalRewards.dust = {};
                if (!pd.totalRewards.loot) pd.totalRewards.loot = [];
                pd.totalRewards.gold = (pd.totalRewards.gold || 0) + rewards.gold;
                pd.totalRewards.exp = (pd.totalRewards.exp || 0) + rewards.exp;
                pd.totalRewards.portalShards = (pd.totalRewards.portalShards || 0) + rewards.portalShards;

                // Advance to next wave
                const nextWave = wave + 1;
                const nextWaveData = generatePortalWave(nextWave, portalLevel);
                pd.enemies = nextWaveData.enemies;
                pd.isBossWave = nextWaveData.isBossWave;
                pd.wave = nextWave;
                pd.status = "combat";
                pd.currentEnemyIndex = 0;
                // Reset turn
                let startIdx = 0;
                while (startIdx < pMembers.length && pMembers[startIdx].hp <= 0) startIdx++;
                pd.current_turn_index = startIdx < pMembers.length ? startIdx : 0;
                pd.turn_deadline = new Date(Date.now() + 3000).toISOString();
                pd.combat_log.push({ type: "system", text: `Wave ${nextWave} begins!${nextWaveData.isBossWave ? " ⚠️ BOSS WAVE!" : ""}` });

                pMembers[turnIdx] = afkMember;
                await db.update(portalSessionsTable).set({ wave: nextWave, data: pd, members: pMembers }).where(eq(portalSessionsTable.id, s.id));
                const _tp1 = { ...pd, combat_log: (pd.combat_log || []).slice(-10) };
                sendSuccess(res, { success: true, session: { id: s.id, wave: nextWave, status: "combat", ..._tp1, members: pMembers } });
                return;
              } else {
                // Enemy counter-attacks the AFK player
                for (let ei = 0; ei < enemies.length; ei++) {
                  const e = enemies[ei];
                  if (e.hp <= 0 || afkMember.hp <= 0) continue;
                  const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
                  const mDef = afkMember.defense || 0;
                  const mVit = afkMember.vitality || 8;
                  const tDef = mDef + mVit * 0.5;
                  const evaded = Math.random() < Math.min(0.4, (afkMember.evasion || 0) / 100);
                  const blocked = !evaded && Math.random() < Math.min(0.35, (afkMember.block_chance || 0) / 100);
                  if (evaded) {
                    pd.combat_log.push({ type: "boss_attack", text: `${afkMember.name} evaded ${e.name}'s attack!` });
                  } else {
                    const mitigated = Math.max(1, eDmg - Math.floor(tDef * 0.3));
                    const actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
                    afkMember.hp = Math.max(0, afkMember.hp - actualDmg);
                    pd.combat_log.push({ type: "boss_attack", text: `${e.name} hits ${afkMember.name} for ${actualDmg}${blocked ? " (BLOCKED!)" : ""} (AFK)` });
                  }
                }
                if (afkMember.hp <= 0) {
                  pd.combat_log.push({ type: "system", text: `${afkMember.name} has been knocked out!` });
                }
                pMembers[turnIdx] = afkMember;

                // Check all dead
                const allDead = pMembers.every((m: any) => m.hp <= 0);
                if (allDead) {
                  const wave = s.wave || pd.wave || 1;
                  pd.combat_log.push({ type: "defeat", text: `All players have fallen on Wave ${wave}! The portal collapses...` });
                  pd.status = "defeat";
                  pd.finalWave = wave;
                  await db.update(portalSessionsTable).set({ status: "defeat", data: pd, members: pMembers }).where(eq(portalSessionsTable.id, s.id));
                  const _tp2 = { ...pd, combat_log: (pd.combat_log || []).slice(-10) };
                  sendSuccess(res, { success: true, session: { id: s.id, wave: s.wave, status: "defeat", ..._tp2, members: pMembers } });
                  return;
                }
              }

              // Advance turn to next alive member
              let nextIdx = (turnIdx + 1) % pMembers.length;
              let att = 0;
              while (pMembers[nextIdx].hp <= 0 && att < pMembers.length) {
                nextIdx = (nextIdx + 1) % pMembers.length;
                att++;
              }
              pd.current_turn_index = nextIdx;
              pd.turn_deadline = new Date(Date.now() + 3000).toISOString();
              pd.enemies = enemies;
              pMembers[turnIdx] = afkMember;
              await db.update(portalSessionsTable).set({ data: pd, members: pMembers }).where(eq(portalSessionsTable.id, s.id));
              const _tp3 = { ...pd, combat_log: (pd.combat_log || []).slice(-10) };
              sendSuccess(res, { success: true, session: { id: s.id, wave: s.wave, status: s.status, ..._tp3, members: pMembers } });
              return;
            }
          }
        }
      }

      // Trim combat_log to last 10 entries to reduce payload (was 28kB+)
      const trimmedPd = { ...pd, combat_log: (pd.combat_log || []).slice(-10) };
      sendSuccess(res, { success: true, session: { id: s.id, wave: s.wave, status: s.status, ...trimmedPd, members: pMembers } });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "portalAction error");
    sendError(res, 500, err.message);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// WORLD BOSS — server-wide bosses per zone, all players attack simultaneously
// ══════════════════════════════════════════════════════════════════════════════

const WORLD_BOSS_SPAWN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const WORLD_BOSS_DURATION_MS = 3.5 * 60 * 60 * 1000;     // 3.5 hours active
const WORLD_BOSS_MAX_ATTACKS = 50;                        // per player per cycle

const WORLD_BOSSES: Record<string, { name: string; hp: number; dmg: number; armor: number; element: string; minLevel: number; icon: string }> = {
  verdant_forest:  { name: "Gaia, Ancient Guardian",  hp: 500_000_000,   dmg: 150,  armor: 50,   element: "earth",    minLevel: 1,  icon: "🌳" },
  scorched_desert: { name: "Ignis, Desert Inferno",   hp: 1_000_000_000, dmg: 400,  armor: 120,  element: "fire",     minLevel: 10, icon: "🔥" },
  frozen_peaks:    { name: "Cryos, Frost Sovereign",   hp: 2_000_000_000, dmg: 800,  armor: 250,  element: "ice",      minLevel: 25, icon: "❄️" },
  shadow_realm:    { name: "Nyx, Void Empress",        hp: 5_000_000_000, dmg: 1500, armor: 500,  element: "shadow",   minLevel: 45, icon: "🌑" },
  celestial_spire: { name: "Solaris, Cosmic Arbiter",  hp: 10_000_000_000,dmg: 3000, armor: 1000, element: "celestial", minLevel: 70, icon: "✨" },
};

const WORLD_BOSS_ZONE_ORDER = ["verdant_forest", "scorched_desert", "frozen_peaks", "shadow_realm", "celestial_spire"];

function getWorldBossSpawnCycle(): number {
  return Math.floor(Date.now() / WORLD_BOSS_SPAWN_INTERVAL_MS);
}

function getActiveWorldBossZone(): string {
  const cycle = getWorldBossSpawnCycle();
  return WORLD_BOSS_ZONE_ORDER[cycle % WORLD_BOSS_ZONE_ORDER.length];
}

function formatHp(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// Boss-specific unique gear definitions — class_restriction limits who can equip
const WORLD_BOSS_GEAR: Record<string, Array<{ name: string; type: string; stats: any; class_restriction?: string[]; subtype?: string }>> = {
  verdant_forest: [
    // Weapons per class
    { name: "Gaia's Verdant Blade", type: "weapon", subtype: "sword", class_restriction: ["warrior"], stats: { damage: 120, strength: 40, vitality: 25, hp_bonus: 500 } },
    { name: "Gaia's Nature Staff", type: "weapon", subtype: "staff", class_restriction: ["mage"], stats: { damage: 100, intelligence: 50, vitality: 20, mp_bonus: 400 } },
    { name: "Gaia's Thornbow", type: "weapon", subtype: "bow", class_restriction: ["ranger"], stats: { damage: 110, dexterity: 45, vitality: 20, crit_chance: 5 } },
    { name: "Gaia's Root Dagger", type: "weapon", subtype: "dagger", class_restriction: ["rogue"], stats: { damage: 115, dexterity: 40, crit_chance: 8, lifesteal: 3 } },
    // Shared armor/accessories
    { name: "Bark of the Ancient", type: "armor", stats: { defense: 80, vitality: 50, hp_bonus: 800, evasion: 5 } },
    { name: "Canopy Crown", type: "helmet", stats: { defense: 40, intelligence: 30, mp_bonus: 200, hp_bonus: 300 } },
    { name: "Ring of Roots", type: "ring", stats: { vitality: 35, defense: 25, hp_bonus: 400, lifesteal: 3 } },
  ],
  scorched_desert: [
    { name: "Ignis Flamecleaver", type: "weapon", subtype: "sword", class_restriction: ["warrior"], stats: { damage: 250, strength: 60, fire_dmg: 40, crit_chance: 8 } },
    { name: "Ignis Blazestaff", type: "weapon", subtype: "staff", class_restriction: ["mage"], stats: { damage: 200, intelligence: 80, fire_dmg: 55, mp_bonus: 300 } },
    { name: "Ignis Scorchbow", type: "weapon", subtype: "bow", class_restriction: ["ranger"], stats: { damage: 230, dexterity: 65, fire_dmg: 35, crit_chance: 10 } },
    { name: "Ignis Emberfang", type: "weapon", subtype: "dagger", class_restriction: ["rogue"], stats: { damage: 240, dexterity: 55, fire_dmg: 45, crit_dmg_pct: 15 } },
    { name: "Inferno Carapace", type: "armor", stats: { defense: 130, vitality: 65, fire_dmg: 20, hp_bonus: 1000 } },
    { name: "Scorched Diadem", type: "helmet", stats: { defense: 60, intelligence: 50, fire_dmg: 30, mp_bonus: 350 } },
    { name: "Ember Loop", type: "ring", stats: { fire_dmg: 35, crit_dmg_pct: 15, damage: 80, strength: 30 } },
  ],
  frozen_peaks: [
    { name: "Cryos Frostfang", type: "weapon", subtype: "sword", class_restriction: ["warrior"], stats: { damage: 400, strength: 90, ice_dmg: 40, block_chance: 5 } },
    { name: "Cryos Blizzard Orb", type: "weapon", subtype: "staff", class_restriction: ["mage"], stats: { damage: 350, intelligence: 100, ice_dmg: 60, mp_bonus: 500 } },
    { name: "Cryos Icicle Longbow", type: "weapon", subtype: "bow", class_restriction: ["ranger"], stats: { damage: 380, dexterity: 85, ice_dmg: 50, crit_chance: 12 } },
    { name: "Cryos Frost Stiletto", type: "weapon", subtype: "dagger", class_restriction: ["rogue"], stats: { damage: 390, dexterity: 80, ice_dmg: 45, crit_dmg_pct: 20 } },
    { name: "Glacial Aegis", type: "armor", stats: { defense: 200, vitality: 90, ice_dmg: 30, block_chance: 10 } },
    { name: "Frostmantle Hood", type: "helmet", stats: { defense: 90, intelligence: 70, ice_dmg: 40, mp_bonus: 500 } },
    { name: "Permafrost Seal", type: "ring", stats: { ice_dmg: 45, defense: 50, evasion: 8, hp_bonus: 600 } },
  ],
  shadow_realm: [
    { name: "Nyx Voidreaver", type: "weapon", subtype: "sword", class_restriction: ["warrior"], stats: { damage: 650, strength: 110, poison_dmg: 50, lifesteal: 5 } },
    { name: "Nyx Shadow Scepter", type: "weapon", subtype: "staff", class_restriction: ["mage"], stats: { damage: 580, intelligence: 130, poison_dmg: 60, blood_dmg: 30 } },
    { name: "Nyx Whisper Bow", type: "weapon", subtype: "bow", class_restriction: ["ranger"], stats: { damage: 620, dexterity: 110, poison_dmg: 55, crit_dmg_pct: 25 } },
    { name: "Nyx Phantom Blade", type: "weapon", subtype: "dagger", class_restriction: ["rogue"], stats: { damage: 640, dexterity: 100, poison_dmg: 60, crit_chance: 12 } },
    { name: "Umbral Vestments", type: "armor", stats: { defense: 300, vitality: 120, evasion: 12, poison_dmg: 35 } },
    { name: "Crown of Shadows", type: "helmet", stats: { defense: 130, intelligence: 90, blood_dmg: 45, mp_bonus: 700 } },
    { name: "Voidheart Band", type: "ring", stats: { blood_dmg: 55, lifesteal: 8, crit_chance: 10, damage: 200 } },
  ],
  celestial_spire: [
    { name: "Solaris, Light Eternal", type: "weapon", subtype: "sword", class_restriction: ["warrior"], stats: { damage: 1000, strength: 150, lightning_dmg: 80, crit_chance: 15, crit_dmg_pct: 30 } },
    { name: "Solaris, Cosmic Catalyst", type: "weapon", subtype: "staff", class_restriction: ["mage"], stats: { damage: 900, intelligence: 180, lightning_dmg: 90, mp_bonus: 800, crit_dmg_pct: 20 } },
    { name: "Solaris, Starfall Bow", type: "weapon", subtype: "bow", class_restriction: ["ranger"], stats: { damage: 950, dexterity: 160, lightning_dmg: 75, crit_chance: 18, crit_dmg_pct: 25 } },
    { name: "Solaris, Eclipse Fang", type: "weapon", subtype: "dagger", class_restriction: ["rogue"], stats: { damage: 980, dexterity: 140, lightning_dmg: 85, crit_chance: 15, lifesteal: 6 } },
    { name: "Radiant Divinity Plate", type: "armor", stats: { defense: 450, vitality: 180, hp_bonus: 3000, block_chance: 12 } },
    { name: "Halo of the Cosmos", type: "helmet", stats: { defense: 200, intelligence: 130, lightning_dmg: 60, mp_bonus: 1000 } },
    { name: "Stellar Convergence", type: "ring", stats: { damage: 350, crit_chance: 12, crit_dmg_pct: 35, lightning_dmg: 70, lifesteal: 5 } },
  ],
};

async function getOrCreateWorldBossSession(zone: string) {
  const boss = WORLD_BOSSES[zone];
  if (!boss) return null;
  const cycle = getWorldBossSpawnCycle();
  const expiresAt = new Date((cycle + 1) * WORLD_BOSS_SPAWN_INTERVAL_MS - 30 * 60 * 1000); // 30 min before next cycle

  // Try to find existing
  const [existing] = await db.select().from(worldBossSessionsTable).where(
    and(
      eq(worldBossSessionsTable.zone, zone),
      eq(worldBossSessionsTable.spawnCycle, cycle),
    )
  );
  if (existing) return existing;

  // Create new session
  try {
    const [session] = await db.insert(worldBossSessionsTable).values({
      zone,
      bossKey: `wb_${zone}`,
      status: "active",
      participants: [],
      data: {
        boss_hp: boss.hp,
        boss_max_hp: boss.hp,
        boss_name: boss.name,
        boss_dmg: boss.dmg,
        boss_armor: boss.armor,
        boss_element: boss.element,
        boss_icon: boss.icon,
        combat_log: [{ type: "system", text: `${boss.name} has appeared in the ${zone.replace(/_/g, " ")}!` }],
      },
      spawnCycle: cycle,
      expiresAt,
    }).returning();
    return session;
  } catch {
    // Race condition — another player created it first
    const [s] = await db.select().from(worldBossSessionsTable).where(
      and(eq(worldBossSessionsTable.zone, zone), eq(worldBossSessionsTable.spawnCycle, cycle))
    );
    return s || null;
  }
}

router.post("/functions/worldBossAction", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, zone, skillId } = req.body;
    if (!characterId || !action) { sendError(res, 400, "characterId and action required"); return; }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    // === GET STATUS: overview of all world bosses ===
    if (action === "get_status") {
      const cycle = getWorldBossSpawnCycle();
      const cycleEnd = (cycle + 1) * WORLD_BOSS_SPAWN_INTERVAL_MS;
      const activeZone = getActiveWorldBossZone();

      // Only create/fetch session for the currently active zone
      const activeSession = await getOrCreateWorldBossSession(activeZone);
      const activeBoss = WORLD_BOSSES[activeZone];
      const d = activeSession ? (activeSession.data as any) || {} : {};
      const participants = activeSession ? (activeSession.participants as any[]) || [] : [];
      const myEntry = participants.find((p: any) => p.characterId === characterId);

      // Build info for all bosses (show which is active, others show next rotation time)
      const bosses = WORLD_BOSS_ZONE_ORDER.map((z, idx) => {
        const boss = WORLD_BOSSES[z];
        const isCurrentBoss = z === activeZone;

        // Calculate when this boss will next be active
        const currentIdx = cycle % WORLD_BOSS_ZONE_ORDER.length;
        const stepsUntil = (idx - currentIdx + WORLD_BOSS_ZONE_ORDER.length) % WORLD_BOSS_ZONE_ORDER.length;
        const nextActiveAt = stepsUntil === 0 ? 0 : stepsUntil * WORLD_BOSS_SPAWN_INTERVAL_MS + (cycleEnd - Date.now());

        if (isCurrentBoss && activeSession) {
          const sessionStatus = activeSession.status === "active" && Date.now() > new Date(activeSession.expiresAt).getTime() ? "expired" : activeSession.status;
          return {
            zone: z, bossName: boss.name, bossIcon: boss.icon,
            bossHp: d.boss_hp ?? boss.hp, bossMaxHp: boss.hp,
            bossDmg: boss.dmg, bossArmor: boss.armor, bossElement: boss.element,
            minLevel: boss.minLevel,
            status: sessionStatus, isCurrentBoss: true,
            participantCount: participants.length,
            myDamage: myEntry?.totalDamage || 0,
            myClaimed: myEntry?.claimed || false,
            sessionId: activeSession.id,
            timeRemaining: Math.max(0, cycleEnd - 30 * 60 * 1000 - Date.now()),
            nextActiveAt: 0,
            meetsLevel: (char.level || 1) >= boss.minLevel,
          };
        }
        return {
          zone: z, bossName: boss.name, bossIcon: boss.icon,
          bossHp: boss.hp, bossMaxHp: boss.hp,
          bossDmg: boss.dmg, bossArmor: boss.armor, bossElement: boss.element,
          minLevel: boss.minLevel,
          status: "inactive", isCurrentBoss: false,
          participantCount: 0, myDamage: 0, myClaimed: false, sessionId: null,
          timeRemaining: 0, nextActiveAt,
          meetsLevel: (char.level || 1) >= boss.minLevel,
        };
      });

      sendSuccess(res, { bosses, currentCycle: cycle, activeZone });
      return;
    }

    // === JOIN: enter world boss fight ===
    if (action === "join") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      const boss = WORLD_BOSSES[zone];
      if (!boss) { sendError(res, 400, "Invalid zone"); return; }
      if ((char.level || 1) < boss.minLevel) { sendError(res, 400, `Level ${boss.minLevel} required`); return; }

      const session = await getOrCreateWorldBossSession(zone);
      if (!session) { sendError(res, 500, "Failed to create boss session"); return; }
      if (session.status !== "active") { sendError(res, 400, "Boss is not active"); return; }
      if (Date.now() > new Date(session.expiresAt).getTime()) { sendError(res, 400, "Boss has expired"); return; }

      const participants = (session.participants as any[]) || [];
      const existing = participants.find((p: any) => p.characterId === characterId);
      if (existing) {
        // Already joined — return session state
        const d = (session.data as any) || {};
        sendSuccess(res, {
          success: true,
          session: { id: session.id, zone, status: session.status, ...d, participants },
          myEntry: existing,
        });
        return;
      }

      const memberStats = await calculateDungeonMemberStats(characterId, char);
      const newParticipant = {
        characterId,
        name: char.name,
        class: char.class,
        level: char.level,
        hp: memberStats.hp,
        maxHp: memberStats.max_hp,
        totalDamage: 0,
        attacks: 0,
        claimed: false,
        ...memberStats,
      };
      participants.push(newParticipant);

      const d = (session.data as any) || {};
      d.combat_log = d.combat_log || [];
      d.combat_log.push({ type: "system", text: `${char.name} (Lv.${char.level}) joined the fight!` });
      // Keep log trimmed
      if (d.combat_log.length > 50) d.combat_log = d.combat_log.slice(-50);

      await db.update(worldBossSessionsTable).set({ participants, data: d }).where(eq(worldBossSessionsTable.id, session.id));
      sendSuccess(res, {
        success: true,
        session: { id: session.id, zone, status: session.status, ...d, participants },
        myEntry: newParticipant,
      });
      return;
    }

    // === ATTACK / SKILL ===
    if (action === "attack" || action === "skill") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      const boss = WORLD_BOSSES[zone];
      if (!boss) { sendError(res, 400, "Invalid zone"); return; }

      const session = await getOrCreateWorldBossSession(zone);
      if (!session || session.status !== "active") { sendError(res, 400, "Boss not active"); return; }
      if (Date.now() > new Date(session.expiresAt).getTime()) {
        await db.update(worldBossSessionsTable).set({ status: "expired" }).where(eq(worldBossSessionsTable.id, session.id));
        sendError(res, 400, "Boss expired");
        return;
      }

      const d = (session.data as any) || {};
      const participants = (session.participants as any[]) || [];
      const meIdx = participants.findIndex((p: any) => p.characterId === characterId);
      if (meIdx < 0) { sendError(res, 400, "Join the boss fight first"); return; }
      const me = participants[meIdx];
      if (me.hp <= 0) { sendError(res, 400, "You are KO'd. Wait for the boss to reset or use a revive."); return; }
      const myMaxAttacks = me.maxAttacks || WORLD_BOSS_MAX_ATTACKS;
      if ((me.attacks || 0) >= myMaxAttacks) { sendError(res, 400, `Max ${myMaxAttacks} attacks reached. Buy more with gems!`); return; }

      let bossHp = d.boss_hp ?? boss.hp;
      if (bossHp <= 0) { sendError(res, 400, "Boss already defeated"); return; }

      // Calculate player damage (same formula as portal/dungeon)
      const totalStr = me.strength || 10;
      const totalDex = me.dexterity || 8;
      const totalInt = me.intelligence || 5;
      const totalLuck = me.luck || 5;
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + (me.damage || 0);

      // Guild damage bonus
      if (char.guildId) {
        try {
          const [g] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
          if (g?.buffs && typeof g.buffs === "object") baseDmg *= (1 + ((g.buffs as any).damage_bonus || 0) / 100);
        } catch {}
      }

      let dmgMult = 1.0;
      let skillName = "Basic Attack";
      let skillElement: string | undefined;
      if (action === "skill" && skillId && SKILL_DATA[skillId]) {
        // Match battle formula: skill multiplier is applied twice (once for base scaling, once for skill power)
        const skillBase = SKILL_DATA[skillId].damage || 1.0;
        dmgMult = skillBase * skillBase;
        skillName = skillId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        skillElement = SKILL_DATA[skillId].element;
      }

      // Elemental multiplier (multiplicative, matching battle rollDamage formula)
      const memberElemDmg = me.elemental_damage || {};
      const ELEM_MAP: Record<string, string> = { fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg", poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg" };
      let elementalMult = 1.0;
      if (skillElement && ELEM_MAP[skillElement]) {
        const elemPct = memberElemDmg[ELEM_MAP[skillElement]] || 0;
        if (elemPct > 0) elementalMult = 1 + elemPct / 100;
      }

      // Boss damage bonus from runes
      const bossDmgMult = 1 + ((me.boss_dmg_pct || 0) / 100);

      const rawDmg = Math.max(1, Math.floor(baseDmg * dmgMult * elementalMult * bossDmgMult * (0.85 + Math.random() * 0.3)));
      let playerDmg = Math.max(1, rawDmg - Math.floor((d.boss_armor || boss.armor) * 0.4));

      // Crit (matching battle formula: BASE_CRIT_DMG_PCT=115, CRIT_DMG_LUK_RATE=0.1)
      const effectiveCritChance = Math.min(0.5, ((me.crit_chance || 0) + totalLuck * 0.3 + totalDex * 0.1) / 100);
      const isCrit = Math.random() < effectiveCritChance;
      const critMultiplier = (115 + totalLuck * 0.1 + (me.crit_dmg_pct || 0)) / 100;
      const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;

      // Apply damage to boss
      bossHp = Math.max(0, bossHp - finalDmg);
      d.boss_hp = bossHp;

      d.combat_log = d.combat_log || [];
      const skillTag = skillName !== "Basic Attack" ? ` [${skillName}]` : "";
      d.combat_log.push({
        type: "player_attack",
        text: `${me.name}${skillTag} hits ${d.boss_name || boss.name} for ${formatHp(finalDmg)}${isCrit ? " (CRIT!)" : ""}!`,
      });

      // Lifesteal
      if ((me.lifesteal || 0) > 0 && finalDmg > 0) {
        const healAmt = Math.min(Math.floor(finalDmg * me.lifesteal / 100), Math.floor(me.maxHp * 0.10));
        if (healAmt > 0) {
          me.hp = Math.min(me.maxHp, me.hp + healAmt);
        }
      }

      // Track damage
      me.totalDamage = (me.totalDamage || 0) + finalDmg;
      me.attacks = (me.attacks || 0) + 1;

      // Boss counter-attacks this player
      const bossDmgBase = d.boss_dmg || boss.dmg;
      const bossDmg = Math.max(1, Math.floor(bossDmgBase * (0.8 + Math.random() * 0.4)));
      const memberDef = me.defense || 0;
      const memberVit = me.vitality || 8;
      const totalDefense = memberDef + memberVit * 0.5;
      const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
      const evaded = Math.random() < memberEvasion;
      const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);
      const blocked = !evaded && Math.random() < memberBlock;

      if (evaded) {
        d.combat_log.push({ type: "boss_attack", text: `${me.name} evaded ${d.boss_name || boss.name}'s attack!` });
      } else {
        const mitigated = Math.max(1, bossDmg - Math.floor(totalDefense * 0.3));
        const actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
        me.hp = Math.max(0, me.hp - actualDmg);
        d.combat_log.push({ type: "boss_attack", text: `${d.boss_name || boss.name} hits ${me.name} for ${actualDmg}${blocked ? " (BLOCKED!)" : ""}` });
      }

      if (me.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${me.name} has been knocked out!` });
      }

      participants[meIdx] = me;

      // Trim combat log
      if (d.combat_log.length > 50) d.combat_log = d.combat_log.slice(-50);

      // Check boss defeated
      if (bossHp <= 0) {
        d.boss_hp = 0;
        d.combat_log.push({ type: "victory", text: `${d.boss_name || boss.name} has been defeated! All participants can claim rewards!` });
        await db.update(worldBossSessionsTable).set({ status: "defeated", data: d, participants }).where(eq(worldBossSessionsTable.id, session.id));
        sendSuccess(res, {
          success: true,
          session: { id: session.id, zone, status: "defeated", ...d, participants },
          myEntry: me,
          bossDefeated: true,
        });
        return;
      }

      await db.update(worldBossSessionsTable).set({ data: d, participants }).where(eq(worldBossSessionsTable.id, session.id));
      sendSuccess(res, {
        success: true,
        session: { id: session.id, zone, status: "active", ...d, participants },
        myEntry: me,
      });
      return;
    }

    // === POLL: lightweight state check ===
    if (action === "poll") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      const cycle = getWorldBossSpawnCycle();
      const [s] = await db.select().from(worldBossSessionsTable).where(
        and(eq(worldBossSessionsTable.zone, zone), eq(worldBossSessionsTable.spawnCycle, cycle))
      );
      if (!s) { sendSuccess(res, { success: false, error: "No active boss" }); return; }

      // Check expiry
      if (s.status === "active" && Date.now() > new Date(s.expiresAt).getTime()) {
        await db.update(worldBossSessionsTable).set({ status: "expired" }).where(eq(worldBossSessionsTable.id, s.id));
        sendSuccess(res, { success: true, session: { id: s.id, zone, status: "expired", ...(s.data as any), participants: s.participants } });
        return;
      }

      const d = (s.data as any) || {};
      const participants = (s.participants as any[]) || [];
      const myEntry = participants.find((p: any) => p.characterId === characterId);
      // Top 10 damagers
      const topDamagers = [...participants]
        .sort((a: any, b: any) => (b.totalDamage || 0) - (a.totalDamage || 0))
        .slice(0, 10)
        .map((p: any) => ({ name: p.name, class: p.class, level: p.level, totalDamage: p.totalDamage || 0 }));

      sendSuccess(res, {
        success: true,
        session: { id: s.id, zone, status: s.status, ...d, participants },
        myEntry,
        topDamagers,
      });
      return;
    }

    // === CLAIM REWARDS ===
    if (action === "claim_rewards") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      const boss = WORLD_BOSSES[zone];
      if (!boss) { sendError(res, 400, "Invalid zone"); return; }
      const cycle = getWorldBossSpawnCycle();

      // Also check previous cycle (boss defeated recently)
      const sessions = await db.select().from(worldBossSessionsTable).where(
        and(eq(worldBossSessionsTable.zone, zone), sql`${worldBossSessionsTable.spawnCycle} >= ${cycle - 1}`)
      );
      const session = sessions.find(s => s.status === "defeated" || s.status === "expired");
      if (!session) { sendError(res, 400, "No defeated boss to claim from"); return; }

      const participants = (session.participants as any[]) || [];
      const meIdx = participants.findIndex((p: any) => p.characterId === characterId);
      if (meIdx < 0) { sendError(res, 400, "You didn't participate"); return; }
      const me = participants[meIdx];
      if (me.claimed) { sendError(res, 400, "Already claimed"); return; }

      // Calculate reward tier based on damage rank
      const sorted = [...participants].sort((a: any, b: any) => (b.totalDamage || 0) - (a.totalDamage || 0));
      const myRank = sorted.findIndex((p: any) => p.characterId === characterId);
      const totalParticipants = sorted.length;
      const percentile = totalParticipants > 0 ? (myRank / totalParticipants) : 1;
      const myDamage = me.totalDamage || 0;
      const damageRatio = myDamage / (boss.hp || 1);

      // Zone tier multiplier (1-5)
      const zoneTiers: Record<string, number> = { verdant_forest: 1, scorched_desert: 2, frozen_peaks: 3, shadow_realm: 4, celestial_spire: 5 };
      const tier = zoneTiers[zone] || 1;

      // Base rewards (everyone gets these)
      const goldBase = [10000, 50000, 200000, 500000, 1000000][tier - 1];
      const expBase = [1000, 5000, 20000, 50000, 100000][tier - 1];
      const gemsBase = [5, 15, 30, 60, 100][tier - 1];
      // Scale by damage contribution (min 20%, max 300%)
      const dmgScale = Math.max(0.2, Math.min(3.0, damageRatio * 1000 + 0.5));

      const goldReward = Math.floor(goldBase * dmgScale);
      const expReward = Math.floor(expBase * dmgScale);
      const gemsReward = Math.floor(gemsBase * dmgScale);

      // Apply gold/exp/gems
      await db.update(charactersTable).set({
        gold: sql`COALESCE(gold, 0) + ${goldReward}`,
        exp: sql`COALESCE(exp, 0) + ${expReward}`,
        gems: sql`COALESCE(gems, 0) + ${gemsReward}`,
      }).where(eq(charactersTable.id, characterId));

      const rewardItems: string[] = [];
      const extraData = (char.extraData as any) || {};

      // Hourglass — top 25% get one
      if (percentile < 0.25) {
        await db.insert(itemsTable).values({
          ownerId: characterId, name: "Hourglass of Eternity", type: "consumable", rarity: "epic",
          level: 1, stats: {}, extraData: { consumableType: "hourglass", source: "world_boss" },
        });
        rewardItems.push("Hourglass of Eternity");
      }

      // Scrolls — random scroll for top 50%
      if (percentile < 0.5) {
        const scrollTypes = [
          { name: "Scroll of Experience", subtype: "scroll_exp", bonus: 50, duration: 7200 },
          { name: "Scroll of Wealth", subtype: "scroll_gold", bonus: 50, duration: 7200 },
          { name: "Scroll of Power", subtype: "scroll_dmg", bonus: 25, duration: 7200 },
          { name: "Scroll of Fortune", subtype: "scroll_loot", bonus: 25, duration: 7200 },
        ];
        const scroll = scrollTypes[Math.floor(Math.random() * scrollTypes.length)];
        await db.insert(itemsTable).values({
          ownerId: characterId, name: scroll.name, type: "consumable", rarity: "rare",
          level: 1, stats: { bonus_value: scroll.bonus, duration: scroll.duration },
          extraData: { consumableType: scroll.subtype, source: "world_boss" },
        });
        rewardItems.push(scroll.name);
      }

      // Upgrade Stone — top 50%
      if (percentile < 0.5) {
        await db.insert(itemsTable).values({
          ownerId: characterId, name: "Upgrade Stone", type: "material", rarity: "epic",
          level: 1, stats: {}, extraData: { materialType: "upgrade_stone", source: "world_boss" },
        });
        rewardItems.push("Upgrade Stone");
      }

      // Dungeon Ticket — everyone
      await db.insert(itemsTable).values({
        ownerId: characterId, name: "Dungeon Ticket", type: "consumable", rarity: "uncommon",
        level: 1, stats: {}, extraData: { consumableType: "dungeon_ticket", source: "world_boss" },
      });
      rewardItems.push("Dungeon Ticket");

      // Pet Incubator — medium drop chance (40%) for all participants
      if (Math.random() < 0.4) {
        await db.insert(itemsTable).values({
          ownerId: characterId, name: "Pet Incubator", type: "consumable", rarity: "rare",
          level: 1, stats: {}, extraData: { consumableType: "pet_incubator", source: "world_boss" },
        });
        rewardItems.push("Pet Incubator");
      }

      // Boss Gear — top 10% get unique boss gear (shiny for top 3 MVP, mythic for rest)
      if (percentile < 0.1) {
        const gearPool = WORLD_BOSS_GEAR[zone] || [];
        const playerClass = char.class || "warrior";
        // Filter: class-restricted items must match player class, non-restricted items available to all
        const eligible = gearPool.filter((g: any) => !g.class_restriction || g.class_restriction.includes(playerClass));
        if (eligible.length > 0) {
          const gear = eligible[Math.floor(Math.random() * eligible.length)] as any;
          const isTopMVP = myRank < 3;
          const gearRarity = isTopMVP ? "shiny" : "mythic";
          const statMult = isTopMVP ? 2.0 : 1.4;
          const boostedStats: Record<string, number> = {};
          for (const [k, v] of Object.entries(gear.stats)) {
            boostedStats[k] = Math.floor((v as number) * statMult);
          }
          const gearLevel = Math.max(char.level || 1, tier * 15);
          await db.insert(itemsTable).values({
            ownerId: characterId, name: gear.name, type: gear.type, rarity: gearRarity,
            level: gearLevel, stats: boostedStats,
            extraData: {
              source: "world_boss", boss: zone, unique: true, is_unique: true,
              rune_slots: isTopMVP ? 3 : 2,
              subtype: gear.subtype || undefined,
              class_restriction: gear.class_restriction || null,
              level_req: gearLevel,
            },
          });
          rewardItems.push(`${gear.name} (${gearRarity})`);
        }
      }

      // Runes — top 25%, higher rarity for higher rank
      if (percentile < 0.25) {
        const runeRarity = myRank < 3 ? "legendary" : myRank < 10 ? "epic" : "rare";
        const runeTypes = ["offensive", "defensive", "utility", "elemental"];
        const runeType = runeTypes[Math.floor(Math.random() * runeTypes.length)];
        const runeStats: Record<string, string[]> = {
          offensive: ["damage", "crit_chance", "crit_dmg_pct"],
          defensive: ["defense", "vitality", "hp_bonus", "block_chance"],
          utility: ["evasion", "lifesteal", "luck"],
          elemental: ["fire_dmg", "ice_dmg", "lightning_dmg", "poison_dmg"],
        };
        const statPool = runeStats[runeType] || ["damage"];
        const mainStat = statPool[Math.floor(Math.random() * statPool.length)];
        const rarityMult = { rare: 1, epic: 1.5, legendary: 2.5 }[runeRarity] || 1;
        const mainValue = Math.floor((10 + tier * 5) * rarityMult);
        await db.insert(runesTable).values({
          characterId, runeType, rarity: runeRarity, level: tier * 3,
          mainStat, mainValue, subStats: {},
          name: `${runeRarity.charAt(0).toUpperCase() + runeRarity.slice(1)} ${runeType.charAt(0).toUpperCase() + runeType.slice(1)} Rune`,
        });
        rewardItems.push(`${runeRarity} ${runeType} rune`);
      }

      // Shiny Pet Egg — top 3 MVP only
      if (myRank < 3) {
        await db.insert(itemsTable).values({
          ownerId: characterId, name: "Shiny Pet Egg", type: "consumable", rarity: "shiny",
          level: 1, stats: {}, extraData: { consumableType: "pet_egg_shiny", source: "world_boss", guaranteed_shiny: true },
        });
        rewardItems.push("Shiny Pet Egg");
      }

      // Celestial Stone — top 10%
      if (percentile < 0.1) {
        const stoneCount = myRank < 3 ? 3 : 1;
        extraData.celestial_stones = (extraData.celestial_stones || 0) + stoneCount;
        rewardItems.push(`${stoneCount}x Celestial Stone`);
      }

      // Ascension Mark — top 3 MVP only
      if (myRank < 3) {
        extraData.ascension_marks = (extraData.ascension_marks || 0) + 1;
        rewardItems.push("Ascension Mark");
      }

      // Save extraData updates
      await db.update(charactersTable).set({ extraData }).where(eq(charactersTable.id, characterId));

      // Mark as claimed
      me.claimed = true;
      participants[meIdx] = me;
      await db.update(worldBossSessionsTable).set({ participants }).where(eq(worldBossSessionsTable.id, session.id));

      sendSuccess(res, {
        success: true,
        rewards: {
          gold: goldReward,
          exp: expReward,
          gems: gemsReward,
          items: rewardItems,
          rank: myRank + 1,
          totalParticipants,
          damageDealt: myDamage,
          damageFormatted: formatHp(myDamage),
        },
      });
      return;
    }

    // === BULK ATTACK (x10/x50/x100) — costs gems, executes multiple attacks at once ===
    if (action === "bulk_attack") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      const { pack } = req.body;
      const BULK_PACKS: Record<string, { attacks: number; gems: number }> = {
        x10:  { attacks: 10,  gems: 50 },
        x50:  { attacks: 50,  gems: 250 },
        x100: { attacks: 100, gems: 500 },
      };
      const chosen = BULK_PACKS[pack];
      if (!chosen) { sendError(res, 400, "Invalid pack"); return; }

      const session = await getOrCreateWorldBossSession(zone);
      if (!session || session.status !== "active") { sendError(res, 400, "Boss not active"); return; }
      if (Date.now() > new Date(session.expiresAt).getTime()) {
        await db.update(worldBossSessionsTable).set({ status: "expired" }).where(eq(worldBossSessionsTable.id, session.id));
        sendError(res, 400, "Boss expired"); return;
      }

      const d = (session.data as any) || {};
      const participants = (session.participants as any[]) || [];
      const meIdx = participants.findIndex((p: any) => p.characterId === characterId);
      if (meIdx < 0) { sendError(res, 400, "Join the boss fight first"); return; }
      const me = participants[meIdx];
      if (me.hp <= 0) { sendError(res, 400, "You are KO'd"); return; }

      // Check gems
      if (char.gems < chosen.gems) { sendError(res, 400, `Not enough gems. Need ${chosen.gems}, have ${char.gems}`); return; }

      // Deduct gems
      await db.update(charactersTable).set({ gems: char.gems - chosen.gems }).where(eq(charactersTable.id, characterId));

      // Get player's skills for cycling
      const charSkillIds = (char.hotbarSkills as string[] || char.skills as string[] || []).filter(
        (sid: string) => SKILL_DATA[sid] && SKILL_DATA[sid].damage > 0
      );

      // Pre-calc constants
      const totalStr = me.strength || 10;
      const totalDex = me.dexterity || 8;
      const totalInt = me.intelligence || 5;
      const totalLuck = me.luck || 5;
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + (me.damage || 0);

      // Guild bonus
      if (char.guildId) {
        try {
          const [g] = await db.select({ buffs: guildsTable.buffs }).from(guildsTable).where(eq(guildsTable.id, char.guildId));
          if (g?.buffs && typeof g.buffs === "object") baseDmg *= (1 + ((g.buffs as any).damage_bonus || 0) / 100);
        } catch {}
      }

      const memberElemDmg = me.elemental_damage || {};
      const ELEM_MAP: Record<string, string> = { fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg", poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg" };
      const effectiveCritChance = Math.min(0.5, ((me.crit_chance || 0) + totalLuck * 0.3 + totalDex * 0.1) / 100);
      const critMultiplier = (115 + totalLuck * 0.1 + (me.crit_dmg_pct || 0)) / 100;
      const bossDmgMult = 1 + ((me.boss_dmg_pct || 0) / 100);
      const bossDmgBase = d.boss_dmg || boss.dmg;
      const memberDef = me.defense || 0;
      const memberVit = me.vitality || 8;
      const totalDefense = memberDef + memberVit * 0.5;
      const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
      const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);

      let bossHp = d.boss_hp ?? boss.hp;
      let totalDmgDealt = 0;
      let crits = 0;
      let attacksDone = 0;
      let bossDefeated = false;
      d.combat_log = d.combat_log || [];

      for (let i = 0; i < chosen.attacks; i++) {
        if (bossHp <= 0 || me.hp <= 0) break;

        // Cycle through skills, fall back to basic attack
        let dmgMult = 1.0;
        let skillElement: string | undefined;
        if (charSkillIds.length > 0) {
          const sid = charSkillIds[i % charSkillIds.length];
          const skillBase = SKILL_DATA[sid].damage || 1.0;
          dmgMult = skillBase * skillBase;
          skillElement = SKILL_DATA[sid].element;
        }

        // Elemental multiplier (multiplicative, matching battle)
        let elementalMult = 1.0;
        if (skillElement && ELEM_MAP[skillElement]) {
          const elemPct = memberElemDmg[ELEM_MAP[skillElement]] || 0;
          if (elemPct > 0) elementalMult = 1 + elemPct / 100;
        }

        const rawDmg = Math.max(1, Math.floor(baseDmg * dmgMult * elementalMult * bossDmgMult * (0.85 + Math.random() * 0.3)));
        let playerDmg = Math.max(1, rawDmg - Math.floor((d.boss_armor || boss.armor) * 0.4));

        const isCrit = Math.random() < effectiveCritChance;
        const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;
        if (isCrit) crits++;

        bossHp = Math.max(0, bossHp - finalDmg);
        totalDmgDealt += finalDmg;
        me.totalDamage = (me.totalDamage || 0) + finalDmg;
        me.attacks = (me.attacks || 0) + 1;
        attacksDone++;

        // Lifesteal
        if ((me.lifesteal || 0) > 0 && finalDmg > 0) {
          const healAmt = Math.min(Math.floor(finalDmg * me.lifesteal / 100), Math.floor(me.maxHp * 0.10));
          if (healAmt > 0) me.hp = Math.min(me.maxHp, me.hp + healAmt);
        }

        // Boss counter-attack
        const bDmg = Math.max(1, Math.floor(bossDmgBase * (0.8 + Math.random() * 0.4)));
        const evaded = Math.random() < memberEvasion;
        if (!evaded) {
          const blocked = Math.random() < memberBlock;
          const mitigated = Math.max(1, bDmg - Math.floor(totalDefense * 0.3));
          const actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
          me.hp = Math.max(0, me.hp - actualDmg);
        }

        if (bossHp <= 0) { bossDefeated = true; break; }
      }

      // Summary log entry
      d.combat_log.push({
        type: "player_attack",
        text: `${me.name} unleashes x${attacksDone} attacks for ${formatHp(totalDmgDealt)} total damage! (${crits} crits)`,
      });
      if (me.hp <= 0) {
        d.combat_log.push({ type: "system", text: `${me.name} has been knocked out!` });
      }

      d.boss_hp = bossHp;
      if (d.combat_log.length > 50) d.combat_log = d.combat_log.slice(-50);
      participants[meIdx] = me;

      if (bossDefeated) {
        d.boss_hp = 0;
        d.combat_log.push({ type: "victory", text: `${d.boss_name || boss.name} has been defeated! All participants can claim rewards!` });
        await db.update(worldBossSessionsTable).set({ status: "defeated", data: d, participants }).where(eq(worldBossSessionsTable.id, session.id));
        sendSuccess(res, {
          success: true,
          message: `x${attacksDone} attacks — ${formatHp(totalDmgDealt)} total damage (${crits} crits)! Boss defeated!`,
          session: { id: session.id, zone, status: "defeated", ...d, participants },
          myEntry: me, bossDefeated: true, newGems: char.gems - chosen.gems,
        });
        return;
      }

      await db.update(worldBossSessionsTable).set({ data: d, participants }).where(eq(worldBossSessionsTable.id, session.id));
      sendSuccess(res, {
        success: true,
        message: `x${attacksDone} attacks — ${formatHp(totalDmgDealt)} total damage (${crits} crits)!`,
        session: { id: session.id, zone, status: "active", ...d, participants },
        myEntry: me, newGems: char.gems - chosen.gems,
      });
      return;
    }

    if (action === "leaderboard") {
      if (!zone) { sendError(res, 400, "zone required"); return; }
      // Get recent defeated sessions for this zone
      const sessions = await db.select().from(worldBossSessionsTable).where(
        and(eq(worldBossSessionsTable.zone, zone), eq(worldBossSessionsTable.status, "defeated"))
      ).orderBy(desc(worldBossSessionsTable.createdAt)).limit(5);

      const allTimeDamage: Record<string, { name: string; class: string; level: number; totalDamage: number }> = {};
      for (const s of sessions) {
        for (const p of (s.participants as any[]) || []) {
          if (!allTimeDamage[p.characterId]) {
            allTimeDamage[p.characterId] = { name: p.name, class: p.class, level: p.level, totalDamage: 0 };
          }
          allTimeDamage[p.characterId].totalDamage += p.totalDamage || 0;
        }
      }
      const leaderboard = Object.values(allTimeDamage)
        .sort((a, b) => b.totalDamage - a.totalDamage)
        .slice(0, 50);

      sendSuccess(res, { leaderboard });
      return;
    }

    sendSuccess(res, { success: true, action });
  } catch (err: any) {
    req.log.error({ err }, "worldBossAction error");
    sendError(res, 500, err.message);
  }
});

// ── Batched player state endpoint (replaces 3-5 separate API calls) ─────────
router.post("/functions/getPlayerFullState", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { sendError(res, 400, "characterId required"); return; }

    // Fetch character with only needed columns
    const [char] = await db.select({
      id: charactersTable.id,
      name: charactersTable.name,
      class: charactersTable.class,
      level: charactersTable.level,
      exp: charactersTable.exp,
      expToNext: charactersTable.expToNext,
      gold: charactersTable.gold,
      gems: charactersTable.gems,
      hp: charactersTable.hp,
      maxHp: charactersTable.maxHp,
      mp: charactersTable.mp,
      maxMp: charactersTable.maxMp,
      strength: charactersTable.strength,
      dexterity: charactersTable.dexterity,
      intelligence: charactersTable.intelligence,
      vitality: charactersTable.vitality,
      luck: charactersTable.luck,
      statPoints: charactersTable.statPoints,
      skillPoints: charactersTable.skillPoints,
      skills: charactersTable.skills,
      hotbarSkills: charactersTable.hotbarSkills,
      currentRegion: charactersTable.currentRegion,
      idleMode: charactersTable.idleMode,
      guildId: charactersTable.guildId,
      prestigeLevel: charactersTable.prestigeLevel,
      extraData: charactersTable.extraData,
      updatedAt: charactersTable.updatedAt,
    }).from(charactersTable).where(eq(charactersTable.id, characterId));

    if (!char) { sendError(res, 404, "Character not found"); return; }

    // Fetch equipped items with only needed columns
    const items = await db.select({
      id: itemsTable.id,
      name: itemsTable.name,
      type: itemsTable.type,
      rarity: itemsTable.rarity,
      stats: itemsTable.stats,
      equipped: itemsTable.equipped,
      level: itemsTable.level,
      upgradeLevel: itemsTable.upgradeLevel,
      starLevel: itemsTable.starLevel,
      awakened: itemsTable.awakened,
    }).from(itemsTable).where(
      and(eq(itemsTable.ownerId, characterId), eq(itemsTable.equipped, true))
    );

    sendSuccess(res, { character: char, equippedItems: items });
  } catch (err: any) {
    sendError(res, 500, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// THE FIELDS — Multiplayer endless battle mode
// ═══════════════════════════════════════════════════════════════════════════════

const FIELD_ELEMENTS = ["fire", "ice", "lightning", "poison", "blood", "sand", "neutral"] as const;
const FIELD_MAX_PLAYERS = 10;
const FIELD_SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours

const FIELD_ENEMY_TEMPLATES: Record<string, any[]> = {
  neutral: [
    { name: "Wild Boar", element: null },
    { name: "Forest Wolf", element: null },
    { name: "Bandit Scout", element: null },
    { name: "Cave Bat", element: null },
    { name: "Stone Golem", element: null },
  ],
  fire: [
    { name: "Flame Imp", element: "fire" },
    { name: "Lava Hound", element: "fire" },
    { name: "Fire Elemental", element: "fire" },
    { name: "Infernal Warrior", element: "fire" },
    { name: "Magma Serpent", element: "fire" },
  ],
  ice: [
    { name: "Frost Sprite", element: "ice" },
    { name: "Ice Golem", element: "ice" },
    { name: "Snow Wraith", element: "ice" },
    { name: "Glacial Knight", element: "ice" },
    { name: "Frozen Revenant", element: "ice" },
  ],
  lightning: [
    { name: "Spark Wisp", element: "lightning" },
    { name: "Thunder Hawk", element: "lightning" },
    { name: "Storm Elemental", element: "lightning" },
    { name: "Volt Sentinel", element: "lightning" },
    { name: "Lightning Drake", element: "lightning" },
  ],
  poison: [
    { name: "Toxic Slime", element: "poison" },
    { name: "Plague Rat", element: "poison" },
    { name: "Venom Spider", element: "poison" },
    { name: "Swamp Horror", element: "poison" },
    { name: "Toxic Shaman", element: "poison" },
  ],
  blood: [
    { name: "Blood Bat", element: "blood" },
    { name: "Crimson Ghoul", element: "blood" },
    { name: "Hemomancer", element: "blood" },
    { name: "Blood Wraith", element: "blood" },
    { name: "Sanguine Knight", element: "blood" },
  ],
  sand: [
    { name: "Sand Scorpion", element: "sand" },
    { name: "Dust Devil", element: "sand" },
    { name: "Desert Mummy", element: "sand" },
    { name: "Sandstone Colossus", element: "sand" },
    { name: "Sand Worm", element: "sand" },
  ],
};

const FIELD_ELITE_PREFIXES = ["Empowered", "Savage", "Corrupted", "Ancient", "Dreadful"];
const FIELD_BOSS_SUFFIXES = ["Overlord", "Tyrant", "Devourer", "Colossus", "Harbinger"];

const FIELD_MODIFIERS_POOL = {
  buffs: [
    { id: "dmg_up", name: "+20% Player Damage", description: "All players deal 20% more damage", effect: { player_dmg_mult: 1.2 } },
    { id: "crit_up", name: "+15% Crit Chance", description: "All players gain 15% crit chance", effect: { player_crit_bonus: 15 } },
    { id: "heal_on_kill", name: "Bloodthirst", description: "Killing an enemy heals 10% HP", effect: { heal_on_kill_pct: 0.10 } },
    { id: "gold_up", name: "+50% Gold", description: "Enemies drop 50% more gold", effect: { gold_mult: 1.5 } },
    { id: "exp_up", name: "+30% EXP", description: "Enemies give 30% more experience", effect: { exp_mult: 1.3 } },
    { id: "defense_up", name: "+25% Defense", description: "All players take 25% less damage", effect: { player_def_mult: 0.75 } },
    { id: "regen", name: "Rejuvenation", description: "Players regenerate 3% HP each turn", effect: { regen_pct: 0.03 } },
    { id: "dublon_up", name: "+40% Dublons", description: "Earn 40% more Dublons", effect: { dublon_mult: 1.4 } },
  ],
  debuffs: [
    { id: "enemy_hp_up", name: "Fortified Enemies", description: "Enemies have 200% more HP", effect: { enemy_hp_mult: 3.0 } },
    { id: "enemy_dmg_up", name: "Enraged Enemies", description: "Enemies deal 50% more damage", effect: { enemy_dmg_mult: 1.5 } },
    { id: "explode_on_death", name: "Volatile Enemies", description: "Enemies explode on death, dealing AoE damage", effect: { explode_on_death: true, explode_pct: 0.15 } },
    { id: "skill_limit", name: "Skill Restriction", description: "You can only use 3 skills this run", effect: { max_skills: 3 } },
    { id: "elem_only_fire", name: "Fire Domain", description: "Only fire skills deal damage", effect: { element_lock: "fire" } },
    { id: "elem_only_ice", name: "Ice Domain", description: "Only ice skills deal damage", effect: { element_lock: "ice" } },
    { id: "no_heal", name: "Cursed Ground", description: "All healing is reduced by 50%", effect: { heal_reduction: 0.5 } },
    { id: "no_crit", name: "Suppressed Fate", description: "Critical hit chance reduced by 50%", effect: { crit_reduction: 0.5 } },
    { id: "bleed", name: "Bleeding Thorns", description: "Players take 2% max HP damage each turn", effect: { bleed_pct: 0.02 } },
    { id: "enemy_armor_up", name: "Hardened Enemies", description: "Enemies have 50% more armor", effect: { enemy_armor_mult: 1.5 } },
  ],
};

function generateFieldEnemies(fieldNumber: number, element: string, isRiskPath: boolean, modifiers: any[]): any[] {
  const count = Math.min(10, 3 + Math.floor(fieldNumber / 3) + (isRiskPath ? 1 : 0));
  const templates = FIELD_ENEMY_TEMPLATES[element] || FIELD_ENEMY_TEMPLATES.neutral;
  const enemies: any[] = [];

  // Apply enemy modifiers
  let hpMult = 1.0;
  let dmgMult = 1.0;
  let armorMult = 1.0;
  for (const mod of modifiers) {
    const eff = mod.effect || {};
    if (eff.enemy_hp_mult) hpMult *= eff.enemy_hp_mult;
    if (eff.enemy_dmg_mult) dmgMult *= eff.enemy_dmg_mult;
    if (eff.enemy_armor_mult) armorMult *= eff.enemy_armor_mult;
  }

  const baseHp = 200 + fieldNumber * 80;
  const baseDmg = 15 + fieldNumber * 6;
  const baseArmor = 5 + fieldNumber * 3;

  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const isElite = isRiskPath ? Math.random() < 0.30 : Math.random() < 0.12;
    const isBoss = !isElite && fieldNumber >= 5 && (fieldNumber % 5 === 0) && i === 0;
    const eliteMult = isElite ? 2.5 : isBoss ? 4.0 : 1.0;
    const prefix = isElite ? FIELD_ELITE_PREFIXES[Math.floor(Math.random() * FIELD_ELITE_PREFIXES.length)] + " " : "";
    const suffix = isBoss ? " " + FIELD_BOSS_SUFFIXES[Math.floor(Math.random() * FIELD_BOSS_SUFFIXES.length)] : "";
    const hp = Math.floor(baseHp * eliteMult * hpMult * (0.85 + Math.random() * 0.3));
    enemies.push({
      id: `enemy_${i}`,
      name: `${prefix}${template.name}${suffix}`,
      element: template.element,
      hp,
      max_hp: hp,
      dmg: Math.floor(baseDmg * eliteMult * dmgMult * (0.85 + Math.random() * 0.3)),
      armor: Math.floor(baseArmor * armorMult * (isElite ? 1.5 : isBoss ? 2.0 : 1.0)),
      isElite,
      isBoss,
      attackers: [], // track who attacked this enemy
    });
  }
  return enemies;
}

function pickFieldModifiers(fieldNumber: number, isRiskPath: boolean): any[] {
  const numBuffs = 2;
  const numDebuffs = Math.min(4, 2 + Math.floor(fieldNumber / 5));
  const buffPool = [...FIELD_MODIFIERS_POOL.buffs];
  const debuffPool = [...FIELD_MODIFIERS_POOL.debuffs];
  const mods: any[] = [];
  for (let i = 0; i < numBuffs && buffPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * buffPool.length);
    mods.push({ ...buffPool.splice(idx, 1)[0], type: "buff" });
  }
  for (let i = 0; i < numDebuffs && debuffPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * debuffPool.length);
    mods.push({ ...debuffPool.splice(idx, 1)[0], type: "debuff" });
  }
  // Risk path adds an extra debuff but also an extra buff
  if (isRiskPath && buffPool.length > 0 && debuffPool.length > 0) {
    const bi = Math.floor(Math.random() * buffPool.length);
    mods.push({ ...buffPool.splice(bi, 1)[0], type: "buff" });
    const di = Math.floor(Math.random() * debuffPool.length);
    mods.push({ ...debuffPool.splice(di, 1)[0], type: "debuff" });
  }
  return mods;
}

function getFieldRewards(fieldNumber: number, memberCount: number, isRiskPath: boolean, modifiers: any[]): any {
  const riskMult = isRiskPath ? 1.5 : 1.0;
  let goldMult = 1.0;
  let expMult = 1.0;
  let dublonMult = 1.0;
  for (const mod of modifiers) {
    const eff = mod.effect || {};
    if (eff.gold_mult) goldMult *= eff.gold_mult;
    if (eff.exp_mult) expMult *= eff.exp_mult;
    if (eff.dublon_mult) dublonMult *= eff.dublon_mult;
  }
  const coopBonus = 1 + (memberCount - 1) * 0.05; // 5% per extra player
  return {
    gold: Math.floor((80 + fieldNumber * 30) * riskMult * goldMult * coopBonus),
    exp: Math.floor((60 + fieldNumber * 25) * riskMult * expMult * coopBonus),
    dublons: Math.floor((5 + fieldNumber * 2) * riskMult * dublonMult * coopBonus),
    crystals: fieldNumber >= 10 && fieldNumber % 5 === 0 ? Math.floor(1 + fieldNumber / 10) : 0,
    ascension_shards: fieldNumber >= 8 && Math.random() < 0.15 ? 1 : 0,
    celestial_stones: fieldNumber >= 15 && fieldNumber % 10 === 0 ? 1 : 0,
    incubators: Math.random() < (0.05 + fieldNumber * 0.003) ? 1 : 0,
    sqrizzscrolls: fieldNumber >= 12 && fieldNumber % 6 === 0 ? 1 : 0,
    rune_drop: fieldNumber >= 5 && Math.random() < 0.08 + fieldNumber * 0.002,
    loot_drop: Math.random() < 0.10 + fieldNumber * 0.005,
    boss_stone: fieldNumber >= 20 && fieldNumber % 10 === 0 && Math.random() < 0.25 ? 1 : 0,
  };
}

router.post("/functions/fieldAction", async (req: Request, res: Response) => {
  try {
    const { characterId, action, sessionId, skillId, targetEnemyId, pathChoice, selectedBuffIds, selectedDebuffIds } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { sendError(res, 404, "Character not found"); return; }

    // === GET STATUS ===
    if (action === "get_status") {
      // Find active sessions where character is a member
      const memberSessions = await db.select().from(fieldSessionsTable).where(
        sql`${fieldSessionsTable.status} IN ('waiting', 'combat', 'field_clear') AND ${fieldSessionsTable.members}::jsonb @> ${JSON.stringify([{ characterId }])}::jsonb`
      );
      let activeSession = memberSessions[0] || null;
      // Clean stuck sessions
      if (activeSession && activeSession.createdAt && (Date.now() - new Date(activeSession.createdAt).getTime() > FIELD_SESSION_MAX_AGE_MS)) {
        await db.update(fieldSessionsTable).set({ status: "abandoned" }).where(eq(fieldSessionsTable.id, activeSession.id));
        activeSession = null;
      }
      sendSuccess(res, { session: activeSession ? { id: activeSession.id, status: activeSession.status, fieldNumber: activeSession.fieldNumber, element: activeSession.element, members: activeSession.members, enemies: activeSession.enemies, modifiers: activeSession.modifiers, rewards: activeSession.rewards, combatLog: ((activeSession.combatLog as any[]) || []).slice(-30), data: activeSession.data } : null });
      return;
    }

    // === LIST ACTIVE SESSIONS ===
    if (action === "list_active") {
      const sessions = await db.select().from(fieldSessionsTable).where(
        sql`${fieldSessionsTable.status} IN ('waiting', 'combat', 'field_clear') AND ${fieldSessionsTable.createdAt} > NOW() - INTERVAL '3 hours'`
      );
      sendSuccess(res, {
        sessions: sessions.map(s => ({
          id: s.id,
          fieldNumber: s.fieldNumber,
          element: s.element,
          memberCount: ((s.members as any[]) || []).length,
          maxPlayers: FIELD_MAX_PLAYERS,
          status: s.status,
          members: ((s.members as any[]) || []).map((m: any) => ({ name: m.name, class: m.class, level: m.level })),
        })),
      });
      return;
    }

    // === ENTER (create new session) ===
    if (action === "enter") {
      // Check not already in a session
      const existing = await db.select().from(fieldSessionsTable).where(
        sql`${fieldSessionsTable.status} IN ('waiting', 'combat', 'field_clear') AND ${fieldSessionsTable.members}::jsonb @> ${JSON.stringify([{ characterId }])}::jsonb`
      );
      if (existing.length > 0) { sendError(res, 400, "Already in a Fields session"); return; }

      const memberStats = await calculateDungeonMemberStats(characterId, char);
      const element = FIELD_ELEMENTS[Math.floor(Math.random() * FIELD_ELEMENTS.length)];
      const modifiers = pickFieldModifiers(1, false);
      const enemies = generateFieldEnemies(1, element, false, modifiers);

      const [session] = await db.insert(fieldSessionsTable).values({
        status: "waiting",
        fieldNumber: 1,
        element,
        members: [{ ...memberStats, characterId, alive: true, reviveTimer: 0, skillsUsed: 0 }],
        enemies,
        modifiers,
        rewards: { dublons: 0, gold: 0, exp: 0, crystals: 0, ascension_shards: 0, celestial_stones: 0, incubators: 0, sqrizzscrolls: 0, boss_stones: 0, loot: [] },
        combatLog: [{ type: "system", text: `${char.name} enters The Fields! Element: ${element}`, ts: Date.now() }],
        data: { pathHistory: [] },
      }).returning();

      sendSuccess(res, { session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members: session.members, enemies: session.enemies, modifiers: session.modifiers, rewards: session.rewards, combatLog: session.combatLog, data: session.data } });
      return;
    }

    // === JOIN ===
    if (action === "join") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      const members = (session.members as any[]) || [];
      if (members.length >= FIELD_MAX_PLAYERS) { sendError(res, 400, "Session is full"); return; }
      if (members.some((m: any) => m.characterId === characterId || m.character_id === characterId)) { sendError(res, 400, "Already in this session"); return; }
      if (!["waiting", "combat", "field_clear"].includes(session.status)) { sendError(res, 400, "Session not joinable"); return; }

      // Check not already in another session
      const existing = await db.select().from(fieldSessionsTable).where(
        sql`${fieldSessionsTable.status} IN ('waiting', 'combat', 'field_clear') AND ${fieldSessionsTable.id} != ${sessionId} AND ${fieldSessionsTable.members}::jsonb @> ${JSON.stringify([{ characterId }])}::jsonb`
      );
      if (existing.length > 0) { sendError(res, 400, "Already in another Fields session"); return; }

      const memberStats = await calculateDungeonMemberStats(characterId, char);
      members.push({ ...memberStats, characterId, alive: true, reviveTimer: 0, skillsUsed: 0 });
      const combatLog = (session.combatLog as any[]) || [];
      combatLog.push({ type: "system", text: `${char.name} has joined The Fields!`, ts: Date.now() });

      await db.update(fieldSessionsTable).set({ members, combatLog }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members, enemies: session.enemies, modifiers: session.modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data: session.data } });
      return;
    }

    // === START (begin combat) ===
    if (action === "start") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      if (session.status !== "waiting") { sendError(res, 400, "Session already started"); return; }

      const combatLog = (session.combatLog as any[]) || [];
      const members = (session.members as any[]) || [];
      combatLog.push({ type: "system", text: `The battle begins! Field 1 — ${members.length} players enter the fray!`, ts: Date.now() });

      await db.update(fieldSessionsTable).set({ status: "combat", combatLog }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, status: "combat", fieldNumber: session.fieldNumber, element: session.element, members, enemies: session.enemies, modifiers: session.modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data: session.data } });
      return;
    }

    // === POLL ===
    if (action === "poll") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session) { sendSuccess(res, { session: null }); return; }
      sendSuccess(res, { session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members: session.members, enemies: session.enemies, modifiers: session.modifiers, rewards: session.rewards, combatLog: ((session.combatLog as any[]) || []).slice(-30), data: session.data } });
      return;
    }

    // === ATTACK / SKILL ===
    if (action === "attack" || action === "skill") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }
      if (session.status !== "combat") { sendError(res, 400, "Not in combat"); return; }

      const members = (session.members as any[]) || [];
      const meIdx = members.findIndex((m: any) => m.characterId === characterId || m.character_id === characterId);
      if (meIdx < 0) { sendError(res, 403, "Not in this session"); return; }
      const me = members[meIdx];
      if (!me.alive || me.hp <= 0) { sendError(res, 400, "You are KO'd — wait to be revived"); return; }

      const enemies = (session.enemies as any[]) || [];
      const combatLog = (session.combatLog as any[]) || [];
      const modifiers = (session.modifiers as any[]) || [];
      const data = (session.data as any) || {};

      // Find target enemy
      let target = enemies.find((e: any) => e.id === targetEnemyId && e.hp > 0);
      if (!target) target = enemies.find((e: any) => e.hp > 0);
      if (!target) {
        // All enemies dead — shouldn't happen but handle gracefully
        await db.update(fieldSessionsTable).set({ status: "field_clear", combatLog }).where(eq(fieldSessionsTable.id, session.id));
        sendSuccess(res, { success: true, session: { id: session.id, status: "field_clear", fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data } });
        return;
      }

      // Apply modifiers
      let playerDmgMult = 1.0;
      let playerCritBonus = 0;
      let healOnKillPct = 0;
      let regenPct = 0;
      let healReduction = 1.0;
      let critReduction = 1.0;
      let bleedPct = 0;
      for (const mod of modifiers) {
        const eff = mod.effect || {};
        if (eff.player_dmg_mult) playerDmgMult *= eff.player_dmg_mult;
        if (eff.player_crit_bonus) playerCritBonus += eff.player_crit_bonus;
        if (eff.heal_on_kill_pct) healOnKillPct += eff.heal_on_kill_pct;
        if (eff.regen_pct) regenPct += eff.regen_pct;
        if (eff.heal_reduction) healReduction *= (1 - eff.heal_reduction);
        if (eff.crit_reduction) critReduction *= (1 - eff.crit_reduction);
        if (eff.bleed_pct) bleedPct += eff.bleed_pct;
      }

      // Calculate damage (same formula as portal)
      const totalStr = me.strength || 10;
      const totalDex = me.dexterity || 8;
      const totalInt = me.intelligence || 5;
      const totalLuck = me.luck || 5;
      const classScaling: Record<string, { primary: string; mult: number }> = {
        warrior: { primary: "strength", mult: 1.3 },
        mage: { primary: "intelligence", mult: 1.4 },
        ranger: { primary: "dexterity", mult: 1.2 },
        rogue: { primary: "dexterity", mult: 1.2 },
      };
      const scaling = classScaling[char.class || "warrior"] || classScaling.warrior;
      const primaryStat = scaling.primary === "strength" ? totalStr : scaling.primary === "intelligence" ? totalInt : totalDex;
      let baseDmg = primaryStat * scaling.mult + (me.damage || 0);

      let dmgSkillMult = 1.0;
      let skillName = "Basic Attack";
      if (action === "skill" && skillId && SKILL_DATA[skillId]) {
        dmgSkillMult = SKILL_DATA[skillId].damage || 1.0;
        skillName = skillId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        me.skillsUsed = (me.skillsUsed || 0) + 1;
      }

      const rawDmg = Math.max(1, Math.floor(baseDmg * dmgSkillMult * playerDmgMult * (0.85 + Math.random() * 0.3)));
      let playerDmg = Math.max(1, rawDmg - Math.floor((target.armor || 0) * 0.4));

      // Elemental bonus
      const memberElemDmg = me.elemental_damage || {};
      const ELEM_MAP: Record<string, string> = { fire: "fire_dmg", ice: "ice_dmg", lightning: "lightning_dmg", poison: "poison_dmg", blood: "blood_dmg", sand: "sand_dmg" };
      let elemBonusDmg = 0;
      for (const [elem, statKey] of Object.entries(ELEM_MAP)) {
        const val = memberElemDmg[statKey] || 0;
        if (val <= 0) continue;
        const weakness = getElementWeakness(target.element);
        let elemMult = elem === weakness ? 1.5 : elem === target.element ? 0.5 : 1.0;
        elemBonusDmg += Math.floor(val * elemMult);
      }
      if (elemBonusDmg > 0) playerDmg += elemBonusDmg;

      // Field element bonus: matching element enemies deal more dmg TO players but also take more FROM matching element attacks
      if (session.element && target.element === session.element) {
        // Enemies in their home element are slightly tankier
        playerDmg = Math.floor(playerDmg * 0.9);
      }

      // Crit
      const effectiveCritChance = Math.min(0.6, ((me.crit_chance || 0) + playerCritBonus + totalLuck * 0.3 + totalDex * 0.1) / 100 * critReduction);
      const isCrit = Math.random() < effectiveCritChance;
      const critMultiplier = 1.5 + ((me.crit_dmg_pct || 0) / 100);
      const finalDmg = isCrit ? Math.floor(playerDmg * critMultiplier) : playerDmg;

      // 3+ players attacking same enemy = better loot bonus
      if (!target.attackers.includes(characterId)) target.attackers.push(characterId);

      target.hp = Math.max(0, target.hp - finalDmg);
      combatLog.push({
        type: "player_attack",
        actor: me.name,
        target: target.name,
        damage: finalDmg,
        isCrit,
        text: `${me.name} uses ${skillName} on ${target.name} for ${finalDmg}${isCrit ? " (CRIT!)" : ""}${elemBonusDmg > 0 ? ` (+${elemBonusDmg} elem)` : ""}!`,
        ts: Date.now(),
      });

      // Lifesteal
      if ((me.lifesteal || 0) > 0 && finalDmg > 0) {
        const rawHeal = Math.floor(finalDmg * me.lifesteal / 100);
        const healAmt = Math.floor(Math.min(rawHeal, me.max_hp * 0.10) * healReduction);
        if (healAmt > 0) {
          me.hp = Math.min(me.max_hp, me.hp + healAmt);
        }
      }

      // Regen from modifier
      if (regenPct > 0) {
        const regenAmt = Math.floor(me.max_hp * regenPct * healReduction);
        if (regenAmt > 0) me.hp = Math.min(me.max_hp, me.hp + regenAmt);
      }

      // Track skill usage for quests
      if (action === "skill" && skillId) {
        try {
          const skillQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of skillQuests) {
            if ((q.objective as any)?.type === "skills_used") {
              const np = Math.min((q.progress || 0) + 1, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
            }
          }
        } catch {}
      }

      // Enemy killed
      if (target.hp <= 0) {
        combatLog.push({ type: "system", text: `${target.name} defeated!`, ts: Date.now() });

        // Update quest progress: combat_kills and boss_kills
        try {
          const killQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of killQuests) {
            const objType = (q.objective as any)?.type;
            let inc = 0;
            if (objType === "combat_kills") inc = 1;
            else if (objType === "boss_kills" && (target.isBoss || target.isElite)) inc = 1;
            if (inc > 0) {
              const np = Math.min((q.progress || 0) + inc, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
            }
          }
        } catch {}

        // Heal on kill modifier
        if (healOnKillPct > 0) {
          const healAmt = Math.floor(me.max_hp * healOnKillPct * healReduction);
          me.hp = Math.min(me.max_hp, me.hp + healAmt);
        }

        // Explode on death modifier — AoE damage to all players
        const explodeMod = modifiers.find((m: any) => m.effect?.explode_on_death);
        if (explodeMod) {
          const explodeDmg = Math.floor(target.max_hp * (explodeMod.effect.explode_pct || 0.15));
          for (const m of members) {
            if (!m.alive || m.hp <= 0) continue;
            m.hp = Math.max(0, m.hp - explodeDmg);
            if (m.hp <= 0) {
              m.alive = false;
              combatLog.push({ type: "system", text: `${m.name} was killed by ${target.name}'s explosion!`, ts: Date.now() });
            }
          }
          combatLog.push({ type: "system", text: `${target.name} explodes for ${explodeDmg} AoE damage!`, ts: Date.now() });
        }
      }

      // Bleed modifier — damage to acting player
      if (bleedPct > 0 && me.alive && me.hp > 0) {
        const bleedDmg = Math.floor(me.max_hp * bleedPct);
        me.hp = Math.max(0, me.hp - bleedDmg);
        if (me.hp <= 0) {
          me.alive = false;
          combatLog.push({ type: "system", text: `${me.name} succumbed to bleeding!`, ts: Date.now() });
        }
      }

      // Enemies counter-attack this player
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (!me.alive || me.hp <= 0) break;

        // Warrior aggro: if a warrior used aggro skill, enemies prefer them
        const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
        // Field element bonus: enemies in their home element deal 30% more damage
        const elemDmgMult = (session.element && e.element === session.element) ? 1.3 : 1.0;
        const playerDefMult = modifiers.reduce((acc: number, m: any) => (m.effect?.player_def_mult ? acc * m.effect.player_def_mult : acc), 1.0);
        const memberDef = me.defense || 0;
        const memberVit = me.vitality || 8;
        const totalDefense = memberDef + memberVit * 0.5;
        const memberEvasion = Math.min(0.4, (me.evasion || 0) / 100);
        const evaded = Math.random() < memberEvasion;
        const memberBlock = Math.min(0.35, (me.block_chance || 0) / 100);
        const blocked = !evaded && Math.random() < memberBlock;

        if (evaded) {
          combatLog.push({ type: "enemy_attack", text: `${me.name} evaded ${e.name}'s attack!`, ts: Date.now() });
        } else {
          const mitigated = Math.max(1, Math.floor(eDmg * elemDmgMult * playerDefMult - totalDefense * 0.3));
          const actualDmg = blocked ? Math.floor(mitigated * 0.4) : mitigated;
          me.hp = Math.max(0, me.hp - actualDmg);
          if (actualDmg > 0) {
            combatLog.push({ type: "enemy_attack", text: `${e.name} hits ${me.name} for ${actualDmg}${blocked ? " (BLOCKED!)" : ""}`, ts: Date.now() });
          }
        }
      }

      if (me.hp <= 0) {
        me.alive = false;
        combatLog.push({ type: "system", text: `${me.name} has been knocked out!`, ts: Date.now() });
      }

      members[meIdx] = me;

      // Check if all enemies dead — field clear
      const allEnemiesDead = enemies.every((e: any) => e.hp <= 0);
      if (allEnemiesDead) {
        const fieldNum = session.fieldNumber || 1;
        const memberCount = members.filter((m: any) => m.alive || m.hp > 0).length || 1;
        const isRiskPath = (data.pathHistory || []).includes("risk");
        const fieldRewards = getFieldRewards(fieldNum, memberCount, isRiskPath, modifiers);
        const totalRewards = (session.rewards as any) || {};

        // Accumulate rewards
        totalRewards.dublons = (totalRewards.dublons || 0) + fieldRewards.dublons;
        totalRewards.gold = (totalRewards.gold || 0) + fieldRewards.gold;
        totalRewards.exp = (totalRewards.exp || 0) + fieldRewards.exp;
        totalRewards.crystals = (totalRewards.crystals || 0) + fieldRewards.crystals;
        totalRewards.ascension_shards = (totalRewards.ascension_shards || 0) + fieldRewards.ascension_shards;
        totalRewards.celestial_stones = (totalRewards.celestial_stones || 0) + fieldRewards.celestial_stones;
        totalRewards.incubators = (totalRewards.incubators || 0) + fieldRewards.incubators;
        totalRewards.sqrizzscrolls = (totalRewards.sqrizzscrolls || 0) + fieldRewards.sqrizzscrolls;
        totalRewards.boss_stones = (totalRewards.boss_stones || 0) + fieldRewards.boss_stone;

        // Cooperative bonus: 3+ attackers on same enemy
        const coopEnemies = enemies.filter((e: any) => (e.attackers || []).length >= 3);
        if (coopEnemies.length > 0) {
          const coopBonusDublons = coopEnemies.length * 3;
          totalRewards.dublons += coopBonusDublons;
          combatLog.push({ type: "system", text: `Cooperative bonus! +${coopBonusDublons} Dublons from teamwork!`, ts: Date.now() });
        }

        let rewardText = `Field ${fieldNum} cleared! +${fieldRewards.gold}g, +${fieldRewards.exp} exp, +${fieldRewards.dublons} Dublons`;
        if (fieldRewards.crystals > 0) rewardText += `, +${fieldRewards.crystals} Crystals`;
        if (fieldRewards.ascension_shards > 0) rewardText += `, +1 Ascension Shard`;
        if (fieldRewards.sqrizzscrolls > 0) rewardText += `, +1 Sqrizzscroll`;
        if (fieldRewards.boss_stone > 0) rewardText += `, +1 Boss Stone`;
        combatLog.push({ type: "victory", text: rewardText, ts: Date.now() });

        // Update gold_earned quests for the player
        try {
          const goldQuests = await db.select().from(questsTable).where(and(eq(questsTable.characterId, characterId), eq(questsTable.status, "active")));
          for (const q of goldQuests) {
            const objType = (q.objective as any)?.type;
            let inc = 0;
            if (objType === "gold_earned") inc = fieldRewards.gold;
            if (inc > 0) {
              const np = Math.min((q.progress || 0) + inc, q.target);
              await db.update(questsTable).set({ progress: np, status: np >= q.target ? "completed" : "active" }).where(eq(questsTable.id, q.id));
            }
          }
        } catch {}

        // Apply gold and exp to all alive members
        for (const m of members) {
          try {
            await db.update(charactersTable).set({
              gold: sql`COALESCE(gold, 0) + ${fieldRewards.gold}`,
              exp: sql`COALESCE(exp, 0) + ${fieldRewards.exp}`,
            }).where(eq(charactersTable.id, m.characterId || m.character_id));
            // Store dublons, crystals, etc. in extraData
            const [mc] = await db.select().from(charactersTable).where(eq(charactersTable.id, m.characterId || m.character_id));
            if (mc) {
              const mExtra = (mc.extraData as any) || {};
              mExtra.dublons = (mExtra.dublons || 0) + fieldRewards.dublons;
              if (fieldRewards.crystals > 0) mExtra.crystals = (mExtra.crystals || 0) + fieldRewards.crystals;
              if (fieldRewards.ascension_shards > 0) mExtra.ascension_shards = (mExtra.ascension_shards || 0) + fieldRewards.ascension_shards;
              if (fieldRewards.celestial_stones > 0) mExtra.celestial_stones = (mExtra.celestial_stones || 0) + fieldRewards.celestial_stones;
              if (fieldRewards.incubators > 0) mExtra.incubators = (mExtra.incubators || 0) + fieldRewards.incubators;
              if (fieldRewards.sqrizzscrolls > 0) mExtra.sqrizzscrolls = (mExtra.sqrizzscrolls || 0) + fieldRewards.sqrizzscrolls;
              if (fieldRewards.boss_stone > 0) mExtra.boss_stones = (mExtra.boss_stones || 0) + fieldRewards.boss_stone;
              await db.update(charactersTable).set({ extraData: mExtra }).where(eq(charactersTable.id, m.characterId || m.character_id));
            }
          } catch {}
        }

        // Generate loot drop
        if (fieldRewards.loot_drop) {
          try {
            const loot = generateLoot(char.level || 1, char.luck || 5, true, null, char.class);
            if (loot) {
              await db.insert(itemsTable).values({
                ownerId: characterId, name: loot.name, type: loot.type, rarity: loot.rarity,
                level: loot.item_level || 1, stats: loot.stats || {},
                extraData: { source: "fields", field_number: fieldNum, subtype: loot.subtype || null, level_req: loot.level_req || 1, sell_price: loot.sell_price || 0, proc_effects: loot.proc_effects || null, rune_slots: loot.rune_slots || 0, is_unique: loot.is_unique || false, uniqueEffect: loot.uniqueEffect || null, lore: loot.lore || null },
              });
              combatLog.push({ type: "system", text: `Loot: ${loot.name} (${loot.rarity})`, ts: Date.now() });
              if (!totalRewards.loot) totalRewards.loot = [];
              totalRewards.loot.push(loot.name);
            }
          } catch {}
        }

        // Pet egg drop from fields (higher chance on risk path)
        try {
          const eggChance = isRiskPath ? 0.12 : 0.06;
          if (Math.random() < eggChance) {
            const eggRarity = rollPetEggRarity(char.luck || 5);
            const eggDef = PET_EGG_TIERS[eggRarity];
            await db.insert(itemsTable).values({
              ownerId: characterId, name: eggDef.name, type: "consumable", rarity: eggRarity,
              level: 1, stats: {}, extraData: { consumableType: "pet_egg", eggRarity, source: "fields" },
            });
            combatLog.push({ type: "system", text: `Pet Egg drop: ${eggDef.name}!`, ts: Date.now() });
          }
        } catch {}

        combatLog.push({ type: "system", text: "Choose your path: Risk (harder, better rewards) or Safe (easier). Select your modifiers!", ts: Date.now() });

        // Pre-generate available modifiers for player to choose from
        const nextFieldNum = (session.fieldNumber || 1) + 1;
        const availableBuffs = [...FIELD_MODIFIERS_POOL.buffs].sort(() => Math.random() - 0.5).slice(0, 4);
        const availableDebuffs = [...FIELD_MODIFIERS_POOL.debuffs].sort(() => Math.random() - 0.5).slice(0, 5);
        const pathData = { ...data, pendingPathChoice: true, availableBuffs, availableDebuffs };

        await db.update(fieldSessionsTable).set({
          status: "field_clear", enemies, members, rewards: totalRewards, combatLog,
          data: pathData,
        }).where(eq(fieldSessionsTable.id, session.id));

        sendSuccess(res, { success: true, session: { id: session.id, status: "field_clear", fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: totalRewards, combatLog: combatLog.slice(-30), data: pathData } });
        return;
      }

      // Check if ALL members are dead — defeat
      const allMembersDead = members.every((m: any) => !m.alive || m.hp <= 0);
      if (allMembersDead) {
        const totalRewards = (session.rewards as any) || {};
        combatLog.push({ type: "defeat", text: `All players have fallen on Field ${session.fieldNumber}! The Fields claim another party...`, ts: Date.now() });

        await db.update(fieldSessionsTable).set({
          status: "defeated", members, enemies, combatLog,
          data: { ...data, finalField: session.fieldNumber },
        }).where(eq(fieldSessionsTable.id, session.id));

        sendSuccess(res, { success: true, session: { id: session.id, status: "defeated", fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: totalRewards, combatLog: combatLog.slice(-30), data: { ...data, finalField: session.fieldNumber } } });
        return;
      }

      await db.update(fieldSessionsTable).set({ enemies, members, combatLog }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data } });
      return;
    }

    // === REVIVE ===
    if (action === "revive") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const { targetCharacterId } = req.body;
      if (!targetCharacterId) { sendError(res, 400, "targetCharacterId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session || session.status !== "combat") { sendError(res, 400, "Not in combat"); return; }

      const members = (session.members as any[]) || [];
      const meIdx = members.findIndex((m: any) => m.characterId === characterId || m.character_id === characterId);
      const targetIdx = members.findIndex((m: any) => m.characterId === targetCharacterId || m.character_id === targetCharacterId);
      if (meIdx < 0 || targetIdx < 0) { sendError(res, 400, "Player not found"); return; }
      const me = members[meIdx];
      const target = members[targetIdx];
      if (!me.alive || me.hp <= 0) { sendError(res, 400, "You are KO'd"); return; }
      if (target.alive && target.hp > 0) { sendError(res, 400, "Target is not KO'd"); return; }

      // Reviving costs 3 turns (the reviver can't attack while reviving)
      target.reviveTimer = (target.reviveTimer || 0) + 1;
      const combatLog = (session.combatLog as any[]) || [];

      if (target.reviveTimer >= 3) {
        // Revive complete
        target.alive = true;
        target.hp = Math.floor(target.max_hp * 0.3); // Revive with 30% HP
        target.reviveTimer = 0;
        combatLog.push({ type: "system", text: `${me.name} revived ${target.name}! (30% HP)`, ts: Date.now() });
      } else {
        combatLog.push({ type: "system", text: `${me.name} is reviving ${target.name}... (${target.reviveTimer}/3)`, ts: Date.now() });
      }

      // Reviver still takes enemy hits
      const enemies = (session.enemies as any[]) || [];
      const modifiers = (session.modifiers as any[]) || [];
      for (const e of enemies) {
        if (e.hp <= 0 || !me.alive || me.hp <= 0) continue;
        const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
        const elemDmgMult = (session.element && e.element === session.element) ? 1.3 : 1.0;
        const playerDefMult = modifiers.reduce((acc: number, m: any) => (m.effect?.player_def_mult ? acc * m.effect.player_def_mult : acc), 1.0);
        const memberDef = me.defense || 0;
        const totalDefense = memberDef + (me.vitality || 8) * 0.5;
        const evaded = Math.random() < Math.min(0.4, (me.evasion || 0) / 100);
        if (!evaded) {
          const mitigated = Math.max(1, Math.floor(eDmg * elemDmgMult * playerDefMult - totalDefense * 0.3));
          me.hp = Math.max(0, me.hp - mitigated);
          if (me.hp <= 0) {
            me.alive = false;
            combatLog.push({ type: "system", text: `${me.name} was knocked out while reviving!`, ts: Date.now() });
          }
        }
      }

      members[meIdx] = me;
      members[targetIdx] = target;
      await db.update(fieldSessionsTable).set({ members, combatLog, enemies }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data: session.data } });
      return;
    }

    // === CHOOSE PATH ===
    if (action === "choose_path") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      if (!pathChoice || !["risk", "safe"].includes(pathChoice)) { sendError(res, 400, "pathChoice must be 'risk' or 'safe'"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session || session.status !== "field_clear") { sendError(res, 400, "Not in field_clear state"); return; }

      const data = (session.data as any) || {};
      const nextField = (session.fieldNumber || 1) + 1;
      const isRisk = pathChoice === "risk";

      // Pick new element (may change every 3-5 fields)
      let newElement = session.element || "neutral";
      if (nextField % 4 === 0 || Math.random() < 0.2) {
        newElement = FIELD_ELEMENTS[Math.floor(Math.random() * FIELD_ELEMENTS.length)];
      }

      const pathHistory = [...(data.pathHistory || []), pathChoice];

      // Use player-selected modifiers if provided, otherwise fall back to random
      let modifiers: any[];
      const availBuffs = data.availableBuffs || [];
      const availDebuffs = data.availableDebuffs || [];
      if (selectedBuffIds && selectedDebuffIds && Array.isArray(selectedBuffIds) && Array.isArray(selectedDebuffIds)) {
        modifiers = [
          ...availBuffs.filter((b: any) => selectedBuffIds.includes(b.id)).map((b: any) => ({ ...b, type: "buff" })),
          ...availDebuffs.filter((d: any) => selectedDebuffIds.includes(d.id)).map((d: any) => ({ ...d, type: "debuff" })),
        ];
        // Ensure minimum debuffs based on field difficulty
        const minDebuffs = Math.min(4, 1 + Math.floor(nextField / 5));
        if (modifiers.filter((m: any) => m.type === "debuff").length < minDebuffs) {
          // Add random debuffs to meet minimum
          const existingDebuffIds = modifiers.filter((m: any) => m.type === "debuff").map((m: any) => m.id);
          const pool = availDebuffs.filter((d: any) => !existingDebuffIds.includes(d.id));
          while (modifiers.filter((m: any) => m.type === "debuff").length < minDebuffs && pool.length > 0) {
            const d = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            modifiers.push({ ...d, type: "debuff" });
          }
        }
      } else {
        modifiers = pickFieldModifiers(nextField, isRisk);
      }
      const enemies = generateFieldEnemies(nextField, newElement, isRisk, modifiers);

      const members = (session.members as any[]) || [];
      const combatLog = (session.combatLog as any[]) || [];
      combatLog.push({ type: "system", text: `Advancing to Field ${nextField} via ${isRisk ? "RISK" : "SAFE"} path! Element: ${newElement}`, ts: Date.now() });

      await db.update(fieldSessionsTable).set({
        status: "combat",
        fieldNumber: nextField,
        element: newElement,
        enemies,
        modifiers,
        members,
        combatLog,
        pathChoice,
        data: { ...data, pathHistory, pendingPathChoice: false },
      }).where(eq(fieldSessionsTable.id, session.id));

      sendSuccess(res, { success: true, session: { id: session.id, status: "combat", fieldNumber: nextField, element: newElement, members, enemies, modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data: { ...data, pathHistory, pendingPathChoice: false } } });
      return;
    }

    // === LEAVE ===
    if (action === "leave") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session) { sendError(res, 404, "Session not found"); return; }

      const members = (session.members as any[]) || [];
      const combatLog = (session.combatLog as any[]) || [];
      const newMembers = members.filter((m: any) => m.characterId !== characterId && m.character_id !== characterId);
      combatLog.push({ type: "system", text: `${char.name} has left The Fields.`, ts: Date.now() });

      if (newMembers.length === 0) {
        await db.update(fieldSessionsTable).set({ status: "abandoned", members: newMembers, combatLog }).where(eq(fieldSessionsTable.id, session.id));
      } else {
        await db.update(fieldSessionsTable).set({ members: newMembers, combatLog }).where(eq(fieldSessionsTable.id, session.id));
      }
      sendSuccess(res, { success: true });
      return;
    }

    // === WARRIOR AGGRO ===
    if (action === "aggro") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      if (char.class !== "warrior") { sendError(res, 400, "Only warriors can use aggro"); return; }
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session || session.status !== "combat") { sendError(res, 400, "Not in combat"); return; }

      const members = (session.members as any[]) || [];
      const combatLog = (session.combatLog as any[]) || [];
      const data = (session.data as any) || {};
      data.aggro_target = characterId;
      combatLog.push({ type: "system", text: `${char.name} taunts all enemies! (Aggro active)`, ts: Date.now() });

      await db.update(fieldSessionsTable).set({ combatLog, data }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true });
      return;
    }

    // === MAGE HEAL ===
    if (action === "heal_ally") {
      if (!sessionId) { sendError(res, 400, "sessionId required"); return; }
      if (char.class !== "mage") { sendError(res, 400, "Only mages can heal allies"); return; }
      const { targetCharacterId } = req.body;
      const [session] = await db.select().from(fieldSessionsTable).where(eq(fieldSessionsTable.id, sessionId));
      if (!session || session.status !== "combat") { sendError(res, 400, "Not in combat"); return; }

      const members = (session.members as any[]) || [];
      const meIdx = members.findIndex((m: any) => m.characterId === characterId || m.character_id === characterId);
      const targetIdx = members.findIndex((m: any) => m.characterId === targetCharacterId || m.character_id === targetCharacterId);
      if (meIdx < 0) { sendError(res, 403, "Not in session"); return; }
      if (targetIdx < 0) { sendError(res, 400, "Target not found"); return; }
      const me = members[meIdx];
      const target = members[targetIdx];
      if (!me.alive || me.hp <= 0) { sendError(res, 400, "You are KO'd"); return; }
      if (!target.alive || target.hp <= 0) { sendError(res, 400, "Target is KO'd — use revive instead"); return; }

      const combatLog = (session.combatLog as any[]) || [];
      const modifiers = (session.modifiers as any[]) || [];
      let healReduction = 1.0;
      for (const mod of modifiers) { if (mod.effect?.heal_reduction) healReduction *= (1 - mod.effect.heal_reduction); }

      const healAmt = Math.floor((me.intelligence || 10) * 2 * healReduction);
      target.hp = Math.min(target.max_hp, target.hp + healAmt);
      combatLog.push({ type: "system", text: `${me.name} heals ${target.name} for ${healAmt} HP!`, ts: Date.now() });

      // Mage also takes hits while healing
      const enemies = (session.enemies as any[]) || [];
      for (const e of enemies) {
        if (e.hp <= 0 || !me.alive || me.hp <= 0) continue;
        const eDmg = Math.max(1, Math.floor((e.dmg || 10) * (0.8 + Math.random() * 0.4)));
        const evaded = Math.random() < Math.min(0.4, (me.evasion || 0) / 100);
        if (!evaded) {
          const mitigated = Math.max(1, Math.floor(eDmg - ((me.defense || 0) + (me.vitality || 8) * 0.5) * 0.3));
          me.hp = Math.max(0, me.hp - mitigated);
          if (me.hp <= 0) {
            me.alive = false;
            combatLog.push({ type: "system", text: `${me.name} was knocked out while healing!`, ts: Date.now() });
          }
        }
      }

      members[meIdx] = me;
      members[targetIdx] = target;
      await db.update(fieldSessionsTable).set({ members, combatLog }).where(eq(fieldSessionsTable.id, session.id));
      sendSuccess(res, { success: true, session: { id: session.id, status: session.status, fieldNumber: session.fieldNumber, element: session.element, members, enemies, modifiers, rewards: session.rewards, combatLog: combatLog.slice(-30), data: session.data } });
      return;
    }

    sendError(res, 400, `Unknown field action: ${action}`);
  } catch (err: any) {
    req.log.error({ err }, "fieldAction error");
    sendError(res, 500, err.message);
  }
});

// Catch-all for unknown functions — MUST be the last route
router.post("/functions/:name", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  req.log.warn({ functionName: req.params.name }, "Unhandled function call");
  sendSuccess(res, { success: true, message: `Function ${req.params.name} stub` });
});

export default router;
