import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { sendSuccess, sendError } from "../lib/response";
import { ENEMIES, calculateExpToLevel, generateLoot, RARITY_SELL_PRICES, RARITY_MULTIPLIER } from "../lib/gameData";
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
  chatMessagesTable,
  presencesTable,
  gemLabsTable,
} from "@workspace/db";
import { eq, desc, and, or, sql } from "drizzle-orm";

const router: IRouter = Router();


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
      const [updated] = await db.update(charactersTable).set({ isBanned: true }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "unban" && characterId) {
      const [updated] = await db.update(charactersTable).set({ isBanned: false }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "mute" && characterId) {
      const [updated] = await db.update(charactersTable).set({ isMuted: true }).where(eq(charactersTable.id, characterId)).returning();
      sendSuccess(res, updated ? toClientCharacter(updated) : null); return;
    }
    if (action === "unmute" && characterId) {
      const [updated] = await db.update(charactersTable).set({ isMuted: false }).where(eq(charactersTable.id, characterId)).returning();
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
    if (action === "update_stats" && characterId && stats) {
      const allowedFields: Record<string, string> = {
        level: "level", gold: "gold", gems: "gems", stat_points: "statPoints",
        skill_points: "skillPoints", prestige_level: "prestigeLevel",
        strength: "strength", dexterity: "dexterity", intelligence: "intelligence",
        vitality: "vitality", luck: "luck", total_kills: "totalKills",
      };
      const updateData: Record<string, any> = {};
      for (const [key, val] of Object.entries(stats)) {
        const dbField = allowedFields[key];
        if (dbField && typeof val === "number") updateData[dbField] = val;
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
    const extraData = (item.extraData as any) || {};
    const goldValue = extraData.sell_price || Math.floor((RARITY_SELL_PRICES[item.rarity] || 10) * (1 + (item.level || 1) * 0.08));
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
    const currentUpgrade = item.upgradeLevel || 0;
    if (currentUpgrade >= 20) { sendSuccess(res, { success: false, message: "Already at max upgrade level (20)" }); return; }
    const rarityMult: Record<string, number> = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 2.8, mythic: 4, set: 3.2, shiny: 6 };
    const cost = Math.floor(300 * (currentUpgrade + 1) * (rarityMult[item.rarity] || 1));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gold || 0) < cost) {
      sendSuccess(res, { success: false, message: "Not enough gold" }); return;
    }
    const newLevel = currentUpgrade + 1;
    const itemStats = (item.stats as Record<string, number>) || {};
    const boostedStats: Record<string, number> = {};
    for (const [stat, val] of Object.entries(itemStats)) {
      boostedStats[stat] = Math.round(val * 1.05);
    }
    const [updated] = await db.update(itemsTable).set({ upgradeLevel: newLevel, stats: boostedStats }).where(eq(itemsTable.id, itemId)).returning();
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
    const currentStar = item.starLevel || 0;
    if (currentStar >= 7) { sendSuccess(res, { success: false, message: "Already at max star level (7)" }); return; }
    const rarityMult: Record<string, number> = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 2.8, mythic: 4, set: 3.2, shiny: 6 };
    const cost = Math.ceil(5 * Math.pow(1.5, currentStar) * (rarityMult[item.rarity] || 1));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gems || 0) < cost) {
      sendSuccess(res, { success: false, message: `Not enough gems (need ${cost})` }); return;
    }
    const successChance = Math.max(0.3, 1 - currentStar * 0.1);
    const success = Math.random() < successChance;
    await db.update(charactersTable).set({ gems: (char.gems || 0) - cost }).where(eq(charactersTable.id, char.id));
    if (success) {
      const itemStats = (item.stats as Record<string, number>) || {};
      const boostedStats: Record<string, number> = {};
      for (const [stat, val] of Object.entries(itemStats)) {
        boostedStats[stat] = Math.round(val * 1.15);
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
    if ((item.starLevel || 0) < 7) { sendSuccess(res, { success: false, message: "Item must be Star 7 to awaken" }); return; }
    const cost = 50;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gems || 0) < cost) {
      sendSuccess(res, { success: false, message: `Not enough gems (need ${cost})` }); return;
    }
    const itemStats = (item.stats as Record<string, number>) || {};
    const awakenedStats: Record<string, number> = {};
    for (const [stat, val] of Object.entries(itemStats)) {
      awakenedStats[stat] = Math.round(val * 1.5);
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
    if (characterId) {
      const [char] = await db.select({ level: charactersTable.level }).from(charactersTable).where(eq(charactersTable.id, characterId));
      if (char) charLevel = char.level || 1;
    }

    let gemsSpent = 0;
    if (forceRefresh && characterId) {
      const REFRESH_COST = 5;
      const [charData] = await db.select({ gems: charactersTable.gems }).from(charactersTable).where(eq(charactersTable.id, characterId));
      if (!charData || (charData.gems || 0) < REFRESH_COST) {
        return sendError(res, 400, "Not enough gems to refresh shop");
      }
      await db.update(charactersTable).set({ gems: (charData.gems || 0) - REFRESH_COST }).where(eq(charactersTable.id, characterId));
      gemsSpent = REFRESH_COST;
    }

    const rng = mulberry32(seed + charLevel);
    const TYPES = ["weapon", "armor", "helmet", "boots", "ring", "amulet"];
    const RARITIES = ["common", "uncommon", "rare", "epic"];
    const RARITY_WEIGHTS = [40, 30, 20, 10];
    const STAT_KEYS = ["strength", "dexterity", "intelligence", "vitality", "luck"];
    const CONSUMABLES = [
      { name: "Health Potion", type: "consumable", stats: { hp_bonus: 50 }, rarity: "common" },
      { name: "Mana Potion", type: "consumable", stats: { mp_bonus: 30 }, rarity: "common" },
      { name: "Greater Health Potion", type: "consumable", stats: { hp_bonus: 150 }, rarity: "uncommon" },
    ];

    function pickRarity(): string {
      const roll = rng() * 100;
      let sum = 0;
      for (let i = 0; i < RARITIES.length; i++) {
        sum += RARITY_WEIGHTS[i];
        if (roll < sum) return RARITIES[i];
      }
      return "common";
    }

    const items: any[] = [];
    for (let i = 0; i < 6; i++) {
      const type = TYPES[Math.floor(rng() * TYPES.length)];
      const rarity = pickRarity();
      const itemLevel = Math.max(1, charLevel + Math.floor((rng() - 0.5) * 6));
      const rarityMult = rarity === "epic" ? 3 : rarity === "rare" ? 2 : rarity === "uncommon" ? 1.5 : 1;
      const stats: Record<string, number> = {};
      const numStats = rarity === "epic" ? 3 : rarity === "rare" ? 2 : 1;
      const shuffled = [...STAT_KEYS].sort(() => rng() - 0.5);
      for (let s = 0; s < numStats; s++) {
        stats[shuffled[s]] = Math.floor((3 + itemLevel * 0.5) * rarityMult * (0.8 + rng() * 0.4));
      }
      const buyPrice = Math.floor((50 + itemLevel * 20) * rarityMult);
      const sellPrice = Math.floor(buyPrice * 0.3);
      const namePrefix = rarity === "epic" ? "Superior" : rarity === "rare" ? "Fine" : rarity === "uncommon" ? "Sturdy" : "";
      const typeNames: Record<string, string> = { weapon: "Blade", armor: "Chestplate", helmet: "Helm", boots: "Greaves", ring: "Ring", amulet: "Amulet" };
      items.push({
        id: `shop_${seed}_${i}`,
        name: `${namePrefix} ${typeNames[type] || type}`.trim(),
        type,
        rarity,
        item_level: itemLevel,
        level_req: Math.max(1, itemLevel - 2),
        stats,
        buy_price: buyPrice,
        sell_price: sellPrice,
        description: `Level ${itemLevel} ${rarity} ${type}`,
      });
    }
    for (let c = 0; c < 2; c++) {
      const con = CONSUMABLES[Math.floor(rng() * CONSUMABLES.length)];
      const price = Math.floor((30 + charLevel * 5) * (con.rarity === "uncommon" ? 2 : 1));
      items.push({
        id: `shop_${seed}_con_${c}`,
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

      if (uType === "luck") {
        if ((skill.luck_level || 1) >= 10) { sendSuccess(res, { success: false, message: "Max luck level" }); return; }
        const cost = (skill.luck_level || 1) * 80;
        if ((char.gold || 0) < cost) { sendSuccess(res, { success: false, message: "Not enough gold" }); return; }
        skill.luck_level = (skill.luck_level || 1) + 1;
        lifeSkills[sType] = skill;
        await db.update(charactersTable).set({
          lifeSkills,
          gold: (char.gold || 0) - cost,
        }).where(eq(charactersTable.id, charId));
        sendSuccess(res, { success: true, gold_spent: cost, new_luck_level: skill.luck_level });
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
    const labData = (lab.data as any) || {};
    const BASE_PRODUCTION = 0.001;
    const prodMult = 1 + (labData.production_level || 0) * 0.05;
    const speedMult = 1 + (labData.speed_level || 0) * 0.02;
    const effMult = 1 + (labData.efficiency_level || 0) * 0.03;
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
    const { characterId, upgradeType } = req.body;
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
    const cost = Math.floor(1000 * Math.pow(1.15, currentLevel));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char || (char.gold || 0) < cost) {
      sendSuccess(res, { success: false, error: "Not enough gold" }); return;
    }
    labData[levelKey] = currentLevel + 1;
    await db.update(gemLabsTable).set({ data: labData }).where(eq(gemLabsTable.id, lab.id));
    await db.update(charactersTable).set({ gold: (char.gold || 0) - cost }).where(eq(charactersTable.id, char.id));
    sendSuccess(res, { success: true, upgradeType, goldRemaining: (char.gold || 0) - cost });
  } catch (err: any) {
    req.log.error({ err }, "upgradeGemLab error");
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

    if (action === "invite" && partyId) {
      const [fromChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      let resolvedTargetId = targetCharacterId;
      if (targetName) {
        const matches = await db.select().from(charactersTable).where(eq(charactersTable.name, targetName));
        if (matches.length > 0) resolvedTargetId = matches[0].id;
        else { sendError(res, 404, `Player "${targetName}" not found`); return; }
      }
      if (!resolvedTargetId) { sendError(res, 400, "No target specified"); return; }
      if (resolvedTargetId === characterId) { sendError(res, 400, "Cannot invite yourself"); return; }
      const [targetChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, resolvedTargetId));
      if (!targetChar) { sendError(res, 404, "Player not found"); return; }
      const [invite] = await db.insert(partyInvitesTable).values({
        partyId,
        fromCharacterId: characterId,
        fromCharacterName: fromChar?.name || "Unknown",
        toCharacterId: resolvedTargetId,
        status: "pending",
      }).returning();
      sendSuccess(res, { success: true, invite });
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
      total_kills: c.totalKills,
      prestige_level: c.prestigeLevel,
      guild_id: c.guildId,
      created_by: c.createdBy,
    }));
    sendSuccess(res, { leaderboard });
  } catch (err: any) {
    req.log.error({ err }, "getLeaderboard error");
    sendError(res, 500, err.message);
  }
});

// Dungeon boss data keyed by dungeon ID
const DUNGEON_BOSSES: Record<string, { name: string; hpBase: number; hpPerLevel: number; dmgBase: number; dmgPerLevel: number; dungeonName: string }> = {
  inferno_keep: { name: "Flame Tyrant", hpBase: 800, hpPerLevel: 40, dmgBase: 15, dmgPerLevel: 3, dungeonName: "Inferno Keep" },
  frost_citadel: { name: "Frost Warden", hpBase: 1500, hpPerLevel: 60, dmgBase: 25, dmgPerLevel: 5, dungeonName: "Frost Citadel" },
  void_sanctum: { name: "Void Reaper", hpBase: 3000, hpPerLevel: 100, dmgBase: 40, dmgPerLevel: 8, dungeonName: "Void Sanctum" },
  storm_peak: { name: "Storm Colossus", hpBase: 5000, hpPerLevel: 150, dmgBase: 60, dmgPerLevel: 12, dungeonName: "Storm Peak" },
  poison_swamp: { name: "Plague Matriarch", hpBase: 2000, hpPerLevel: 80, dmgBase: 30, dmgPerLevel: 6, dungeonName: "Plague Swamp" },
  sand_tomb: { name: "Sand King", hpBase: 4000, hpPerLevel: 120, dmgBase: 50, dmgPerLevel: 10, dungeonName: "Sand Tomb of Kings" },
};

// Skill data for damage multipliers (mirrored from frontend gameData)
const SKILL_DATA: Record<string, { damage: number; mp: number }> = {
  power_strike: { damage: 1.5, mp: 10 }, shield_bash: { damage: 1.2, mp: 8 },
  war_cry: { damage: 0, mp: 15 }, berserker_rage: { damage: 2.5, mp: 25 },
  fireball: { damage: 1.8, mp: 12 }, ice_lance: { damage: 1.4, mp: 10 },
  arcane_shield: { damage: 0, mp: 20 }, meteor: { damage: 3.0, mp: 30 },
  arrow_rain: { damage: 1.6, mp: 12 }, poison_shot: { damage: 1.0, mp: 8 },
  eagle_eye: { damage: 0, mp: 10 }, multishot: { damage: 2.2, mp: 20 },
  backstab: { damage: 2.0, mp: 10 }, smoke_bomb: { damage: 0, mp: 12 },
  blade_dance: { damage: 1.8, mp: 15 }, assassinate: { damage: 3.5, mp: 30 },
};

function buildSessionResponse(session: any): any {
  const d = (session.data as any) || {};
  return {
    id: session.id,
    dungeon_name: d.dungeon_name || "Unknown Dungeon",
    boss_name: d.boss_name || "Boss",
    boss_hp: d.boss_hp ?? 0,
    boss_max_hp: d.boss_max_hp ?? 0,
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

    // === CREATE: make a new dungeon session in "waiting" state ===
    if (action === "enter" || action === "create") {
      // Check for existing active/waiting session
      const existing = await db.select().from(dungeonSessionsTable).where(
        and(eq(dungeonSessionsTable.characterId, characterId),
          sql`${dungeonSessionsTable.status} IN ('active', 'waiting')`)
      );
      if (existing.length > 0) {
        sendSuccess(res, { success: true, session: buildSessionResponse(existing[0]) }); return;
      }

      const boss = DUNGEON_BOSSES[dungeonId] || DUNGEON_BOSSES.inferno_keep;
      const bossHp = boss.hpBase + (char.level || 1) * boss.hpPerLevel;
      const memberHp = 100 + (char.vitality || 8) * 10 + (char.level || 1) * 5;
      const sessionData = {
        dungeon_name: boss.dungeonName,
        boss_name: boss.name,
        boss_hp: bossHp,
        boss_max_hp: bossHp,
        boss_dmg_base: boss.dmgBase,
        boss_dmg_per_level: boss.dmgPerLevel,
        status: "waiting",
        leader_id: characterId,
        members: [{
          character_id: characterId,
          name: char.name || "Unknown",
          class: char.class || "warrior",
          level: char.level || 1,
          hp: memberHp,
          max_hp: memberHp,
        }],
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
      const memberHp = 100 + (char.vitality || 8) * 10 + (char.level || 1) * 5;
      members.push({
        character_id: characterId,
        name: char.name || "Unknown",
        class: char.class || "warrior",
        level: char.level || 1,
        hp: memberHp,
        max_hp: memberHp,
      });
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

      // Calculate player damage
      const baseDmg = (char.strength || 10) + (char.dexterity || 8) * 0.5 + (char.intelligence || 5) * 0.3;
      let dmgMult = 1.0;
      let skillName = "Basic Attack";
      if (action === "skill" && skillId && SKILL_DATA[skillId]) {
        dmgMult = SKILL_DATA[skillId].damage || 1.0;
        skillName = skillId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      const playerDmg = Math.max(1, Math.floor(baseDmg * dmgMult * (0.85 + Math.random() * 0.3)));
      const isCrit = Math.random() < (char.luck || 5) * 0.02;
      const finalDmg = isCrit ? Math.floor(playerDmg * 1.5) : playerDmg;
      d.boss_hp = Math.max(0, d.boss_hp - finalDmg);
      d.combat_log.push({
        type: "player_attack",
        text: `${me.name} uses ${skillName} for ${finalDmg} damage${isCrit ? " (CRIT!)" : ""}!`,
      });

      // Check victory
      if (d.boss_hp <= 0) {
        d.status = "victory";
        d.combat_log.push({ type: "victory", text: `${d.boss_name} has been defeated! Victory!` });
        // Reward all members
        const goldReward = 100 + (char.level || 1) * 20;
        const expReward = 80 + (char.level || 1) * 15;
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
      const defense = (char.defense || 0) + (char.vitality || 8) * 0.5;
      const actualBossDmg = Math.max(1, bossDmg - Math.floor(defense * 0.3));
      me.hp = Math.max(0, me.hp - actualBossDmg);
      d.combat_log.push({
        type: "boss_attack",
        text: `${d.boss_name} strikes ${me.name} for ${actualBossDmg} damage!`,
      });
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
      const expToNext = char.expToNext || (char.level || 1) * 100;
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
        expToNext: newLevel * 100,
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
    const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), 8);
    if (offlineHours < 0.1) {
      sendSuccess(res, { rewards: null, hours: 0 }); return;
    }
    const goldReward = Math.floor(offlineHours * char.level * 50);
    const expReward = Math.floor(offlineHours * char.level * 20);
    await db.update(charactersTable).set({
      gold: (char.gold || 0) + goldReward,
      exp: (char.exp || 0) + expReward,
      lastIdleClaim: new Date(),
    }).where(eq(charactersTable.id, characterId));
    sendSuccess(res, {
        rewards: { gold: goldReward, exp: expReward },
        hours: Math.round(offlineHours * 10) / 10,
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
    const expToNext = char.expToNext || (char.level || 1) * 100;
    if ((char.exp || 0) >= expToNext) {
      const newLevel = (char.level || 1) + 1;
      const [updated] = await db.update(charactersTable).set({
        level: newLevel,
        exp: (char.exp || 0) - expToNext,
        expToNext: newLevel * 100,
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
      sendSuccess(res, { success: true, id: configId, config: newConfig || {} });
      return;
    }

    const [configRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, "global"));
    sendSuccess(res, { success: true, id: configRow?.id || "global", config: configRow?.config || {} });
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

    const empoweredMult = isEmpowered ? 3 : 1;
    const partyMembers = Math.max(0, (partySize || 1) - 1);
    const partyExpBonus = partyMembers * 0.05;
    const partyGoldBonus = partyMembers * 0.10;
    const expGain = Math.round(enemyData.expReward * empoweredMult * (1 + partyExpBonus));
    const goldGain = Math.round(enemyData.goldReward * empoweredMult * (1 + partyGoldBonus));

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
      newStatPoints += 3;
      newSkillPoints += 1;
      levelsGained.push(newLevel);
    }

    const levelDiff = newLevel - (char.level || 1);
    const newMaxHp = (char.maxHp || 100) + levelDiff * 5;
    const newMaxMp = (char.maxMp || 50) + levelDiff * 3;
    const newGold = (char.gold || 0) + goldGain;
    const newTotalKills = (char.totalKills || 0) + 1;

    const [updated] = await db.update(charactersTable).set({
      exp: newExp,
      level: newLevel,
      expToNext: newExpToNext,
      gold: newGold,
      statPoints: newStatPoints,
      skillPoints: newSkillPoints,
      totalKills: newTotalKills,
      maxHp: newMaxHp,
      maxMp: newMaxMp,
    }).where(eq(charactersTable.id, characterId)).returning();

    let lootItem = null;
    try {
      const charLuck = char.luck || 0;
      const loot = generateLoot(
        char.level || 1,
        charLuck,
        serverIsBoss,
        serverRegionKey,
        char.class || null
      );
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
          },
        }).returning();
        lootItem = inserted;
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

export default router;
