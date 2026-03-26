import { Router, type IRouter, type Request, type Response } from "express";
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
} from "@workspace/db";
import { eq, desc, and, or, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  if (!requireAuth(req, res)) return false;
  const [roleRow] = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, req.user!.id));
  if (!roleRow || (roleRow.role !== "admin" && roleRow.role !== "moderator")) {
    res.status(403).json({ error: "Admin access required" });
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
  if (!characterId) { res.status(400).json({ error: "characterId is required" }); return false; }
  const isOwner = await verifyCharacterOwner(req, characterId);
  if (!isOwner) { res.status(403).json({ error: "Not your character" }); return false; }
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
    res.json({
      data: {
        id: req.user!.id,
        email: req.user!.email,
        role: roleRow?.role || "player",
      },
    });
  } catch (err: any) {
    res.json({ data: { id: req.user!.id, email: req.user!.email, role: "player" } });
  }
});

router.post("/functions/getAllUsers", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const users = await db.select().from(usersTable);
    const roles = await db.select().from(userRolesTable);
    const roleMap = Object.fromEntries(roles.map(r => [r.userId, r.role]));
    res.json({
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
        role: roleMap[u.id] || "player",
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "getAllUsers error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/getAllCharacters", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const chars = await db.select().from(charactersTable).orderBy(desc(charactersTable.level));
    res.json({ data: chars.map(c => toClientCharacter(c)) });
  } catch (err: any) {
    req.log.error({ err }, "getAllCharacters error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/updateUserRole", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { userId, role } = req.body;
    await db.insert(userRolesTable).values({ userId, role }).onConflictDoUpdate({
      target: userRolesTable.userId,
      set: { role, updatedAt: new Date() },
    });
    res.json({ data: { success: true } });
  } catch (err: any) {
    req.log.error({ err }, "updateUserRole error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/managePlayer", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { characterId, action, ...rest } = req.body;
    if (characterId) {
      const updateData: Record<string, any> = {};
      if (action === "ban") updateData.isBanned = true;
      else if (action === "unban") updateData.isBanned = false;
      else if (action === "mute") updateData.isMuted = true;
      else if (action === "unmute") updateData.isMuted = false;
      else Object.assign(updateData, rest);
      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(charactersTable).set(updateData).where(eq(charactersTable.id, characterId)).returning();
        res.json({ data: updated ? toClientCharacter(updated) : null });
        return;
      }
    }
    res.json({ data: { success: true } });
  } catch (err: any) {
    req.log.error({ err }, "managePlayer error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/registerUser", async (req: Request, res: Response) => {
  res.json({ data: { success: true, message: "Use Replit Auth to register" } });
});

router.post("/functions/claimDailyLogin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
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
    res.json({
      data: {
        streak,
        rewards: { gold: goldReward, gems: gemReward },
        character: updated ? toClientCharacter(updated) : null,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "claimDailyLogin error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/sellItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { res.status(403).json({ error: "Not your item" }); return; }
    const rarityMultiplier: Record<string, number> = {
      common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25, mythic: 50, shiny: 100,
    };
    const goldValue = (item.level || 1) * 10 * (rarityMultiplier[item.rarity] || 1);
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (char) {
      await db.update(charactersTable).set({ gold: (char.gold || 0) + goldValue }).where(eq(charactersTable.id, char.id));
    }
    await db.delete(itemsTable).where(eq(itemsTable.id, itemId));
    res.json({ data: { success: true, gold_earned: goldValue } });
  } catch (err: any) {
    req.log.error({ err }, "sellItem error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/upgradeItemSafe", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { res.status(403).json({ error: "Not your item" }); return; }
    const cost = (item.upgradeLevel + 1) * 100;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gold || 0) < cost) {
      res.json({ data: { success: false, message: "Not enough gold" } }); return;
    }
    const newLevel = (item.upgradeLevel || 0) + 1;
    const [updated] = await db.update(itemsTable).set({ upgradeLevel: newLevel }).where(eq(itemsTable.id, itemId)).returning();
    await db.update(charactersTable).set({ gold: char.gold - cost }).where(eq(charactersTable.id, char.id));
    res.json({ data: { success: true, item: updated, gold_spent: cost } });
  } catch (err: any) {
    req.log.error({ err }, "upgradeItemSafe error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/starUpgradeItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { res.status(403).json({ error: "Not your item" }); return; }
    const cost = ((item.starLevel || 0) + 1) * 200;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gold || 0) < cost) {
      res.json({ data: { success: false, message: "Not enough gold" } }); return;
    }
    const successChance = Math.max(0.3, 1 - (item.starLevel || 0) * 0.1);
    const success = Math.random() < successChance;
    if (success) {
      const [updated] = await db.update(itemsTable).set({ starLevel: (item.starLevel || 0) + 1 }).where(eq(itemsTable.id, itemId)).returning();
      await db.update(charactersTable).set({ gold: char.gold - cost }).where(eq(charactersTable.id, char.id));
      res.json({ data: { success: true, item: updated, gold_spent: cost } });
    } else {
      await db.update(charactersTable).set({ gold: char.gold - cost }).where(eq(charactersTable.id, char.id));
      res.json({ data: { success: false, message: "Star upgrade failed!", gold_spent: cost } });
    }
  } catch (err: any) {
    req.log.error({ err }, "starUpgradeItem error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/awakenItem", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { itemId } = req.body;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    if (!(await verifyCharacterOwner(req, item.ownerId))) { res.status(403).json({ error: "Not your item" }); return; }
    const cost = 1000;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.ownerId));
    if (!char || (char.gems || 0) < cost) {
      res.json({ data: { success: false, message: "Not enough gems" } }); return;
    }
    const [updated] = await db.update(itemsTable).set({ awakened: true }).where(eq(itemsTable.id, itemId)).returning();
    await db.update(charactersTable).set({ gems: (char.gems || 0) - cost }).where(eq(charactersTable.id, char.id));
    res.json({ data: { success: true, item: updated, gems_spent: cost } });
  } catch (err: any) {
    req.log.error({ err }, "awakenItem error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/getShopRotation", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const now = new Date();
  const seed = Math.floor(now.getTime() / (6 * 60 * 60 * 1000));
  const shopItems = [
    { id: `shop_${seed}_1`, name: "Health Potion", type: "consumable", price: 50, currency: "gold" },
    { id: `shop_${seed}_2`, name: "Mana Potion", type: "consumable", price: 50, currency: "gold" },
    { id: `shop_${seed}_3`, name: "Mystery Box", type: "lootbox", price: 100, currency: "gems" },
    { id: `shop_${seed}_4`, name: "EXP Boost", type: "boost", price: 200, currency: "gold" },
    { id: `shop_${seed}_5`, name: "Gold Boost", type: "boost", price: 150, currency: "gold" },
  ];
  res.json({ data: { items: shopItems, refreshes_at: new Date((seed + 1) * 6 * 60 * 60 * 1000).toISOString() } });
});

router.post("/functions/manageDailyQuests", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const existing = await db.select().from(questsTable).where(eq(questsTable.characterId, characterId));
    const activeQuests = existing.filter(q => q.status === "active");
    if (activeQuests.length >= 3) {
      res.json({ data: { quests: existing } }); return;
    }
    const questTemplates = [
      { title: "Monster Slayer", description: "Kill 10 enemies", type: "daily", target: 10, reward: { gold: 200, exp: 100 } },
      { title: "Gold Hoarder", description: "Earn 500 gold", type: "daily", target: 500, reward: { gold: 300, gems: 1 } },
      { title: "Level Up", description: "Gain a level", type: "daily", target: 1, reward: { gold: 500, gems: 2 } },
    ];
    const newQuests = [];
    for (const template of questTemplates.slice(0, 3 - activeQuests.length)) {
      const [quest] = await db.insert(questsTable).values({
        characterId,
        type: template.type,
        title: template.title,
        description: template.description,
        target: template.target,
        reward: template.reward,
        status: "active",
      }).returning();
      newQuests.push(quest);
    }
    res.json({ data: { quests: [...existing, ...newQuests] } });
  } catch (err: any) {
    req.log.error({ err }, "manageDailyQuests error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/updateQuestProgress", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, questType, amount } = req.body;
    const quests = await db.select().from(questsTable).where(eq(questsTable.characterId, characterId));
    const active = quests.filter(q => q.status === "active");
    for (const quest of active) {
      const newProgress = Math.min((quest.progress || 0) + (amount || 1), quest.target);
      const newStatus = newProgress >= quest.target ? "completed" : "active";
      await db.update(questsTable).set({ progress: newProgress, status: newStatus }).where(eq(questsTable.id, quest.id));
    }
    res.json({ data: { success: true } });
  } catch (err: any) {
    req.log.error({ err }, "updateQuestProgress error");
    res.status(500).json({ error: err.message });
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
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }

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
      res.json({
        data: {
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
          resources: clientResources,
          processing: buildProcessingResponse(lifeSkills),
        },
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
      res.json({
        data: {
          success: true,
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
        },
      });
      return;
    }

    if (action === "stop") {
      if (lifeSkills[sType]) {
        lifeSkills[sType].is_active = false;
        lifeSkills[sType].gather_progress = 0;
      }
      await db.update(charactersTable).set({ lifeSkills }).where(eq(charactersTable.id, charId));
      res.json({
        data: {
          success: true,
          skills: SKILL_TYPES.map(st => buildSkillResponse(lifeSkills, st, charId)),
        },
      });
      return;
    }

    if (action === "tick") {
      const skill = lifeSkills[sType];
      if (!skill || !skill.is_active) {
        res.json({ data: { success: false, message: "Skill not active" } }); return;
      }

      const cooldownKey = `${charId}_${sType}`;
      const lastTick = TICK_COOLDOWNS.get(cooldownKey) || 0;
      const now = Date.now();
      if (now - lastTick < MIN_TICK_INTERVAL_MS) {
        res.json({ data: { success: false, message: "Too fast" } }); return;
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

      res.json({
        data: {
          success: true,
          resources: droppedResources,
          leveled_up: leveledUp,
          new_level: newLevel,
        },
      });
      return;
    }

    if (action === "upgrade") {
      const skill = lifeSkills[sType];
      if (!skill) { res.json({ data: { success: false, message: "Unknown skill" } }); return; }

      if (uType === "speed") {
        if ((skill.speed_level || 1) >= 10) { res.json({ data: { success: false, message: "Max speed level" } }); return; }
        const cost = (skill.speed_level || 1) * 50;
        if ((char.gold || 0) < cost) { res.json({ data: { success: false, message: "Not enough gold" } }); return; }
        skill.speed_level = (skill.speed_level || 1) + 1;
        lifeSkills[sType] = skill;
        await db.update(charactersTable).set({
          lifeSkills,
          gold: (char.gold || 0) - cost,
        }).where(eq(charactersTable.id, charId));
        res.json({ data: { success: true, gold_spent: cost, new_speed_level: skill.speed_level } });
        return;
      }

      if (uType === "luck") {
        if ((skill.luck_level || 1) >= 10) { res.json({ data: { success: false, message: "Max luck level" } }); return; }
        const cost = (skill.luck_level || 1) * 80;
        if ((char.gold || 0) < cost) { res.json({ data: { success: false, message: "Not enough gold" } }); return; }
        skill.luck_level = (skill.luck_level || 1) + 1;
        lifeSkills[sType] = skill;
        await db.update(charactersTable).set({
          lifeSkills,
          gold: (char.gold || 0) - cost,
        }).where(eq(charactersTable.id, charId));
        res.json({ data: { success: true, gold_spent: cost, new_luck_level: skill.luck_level } });
        return;
      }

      res.json({ data: { success: false, message: "Unknown upgrade type" } });
      return;
    }

    if (action === "process") {
      const recipeGroup = PROCESSING_RECIPES[process_type];
      if (!recipeGroup) { res.json({ data: { success: false, message: "Unknown process type" } }); return; }

      const reqSkill = recipeGroup.requires_skill;
      const reqLevel = recipeGroup.requires_level;
      if ((lifeSkills[reqSkill]?.level || 1) < reqLevel) {
        res.json({ data: { success: false, message: `Requires ${reqSkill} level ${reqLevel}` } }); return;
      }

      const recipe = recipeGroup.recipes.find((r: any) => r.input === recipe_input);
      if (!recipe) { res.json({ data: { success: false, message: "Recipe not found" } }); return; }
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      if (!Number.isFinite(qty) || qty < 1 || qty > 9999) {
        res.json({ data: { success: false, message: "Invalid quantity" } }); return;
      }

      const inputRows = await db.select().from(resourcesTable).where(and(
        eq(resourcesTable.characterId, charId),
        eq(resourcesTable.type, recipe.input),
        eq(resourcesTable.name, recipe.rarity),
      ));
      if (inputRows.length === 0 || inputRows[0].quantity < qty) {
        res.json({ data: { success: false, message: "Not enough resources" } }); return;
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

      res.json({ data: { success: true } });
      return;
    }

    res.json({ data: { life_skills: lifeSkills } });
  } catch (err: any) {
    req.log.error({ err }, "lifeSkills error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/processGemLab", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
    const gemLab = (char.gemLab as any) || { level: 1, gems_stored: 0 };
    const gemsGenerated = gemLab.level || 1;
    gemLab.gems_stored = (gemLab.gems_stored || 0) + gemsGenerated;
    await db.update(charactersTable).set({ gemLab }).where(eq(charactersTable.id, characterId));
    res.json({ data: { gem_lab: gemLab, gems_generated: gemsGenerated } });
  } catch (err: any) {
    req.log.error({ err }, "processGemLab error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/claimGemLabGems", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
    const gemLab = (char.gemLab as any) || { level: 1, gems_stored: 0 };
    const gemsToAdd = gemLab.gems_stored || 0;
    gemLab.gems_stored = 0;
    await db.update(charactersTable).set({ gemLab, gems: (char.gems || 0) + gemsToAdd }).where(eq(charactersTable.id, characterId));
    res.json({ data: { gems_claimed: gemsToAdd, gem_lab: gemLab } });
  } catch (err: any) {
    req.log.error({ err }, "claimGemLabGems error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/upgradeGemLab", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
    const gemLab = (char.gemLab as any) || { level: 1, gems_stored: 0 };
    const cost = gemLab.level * 500;
    if ((char.gold || 0) < cost) {
      res.json({ data: { success: false, message: "Not enough gold" } }); return;
    }
    gemLab.level = (gemLab.level || 1) + 1;
    await db.update(charactersTable).set({ gemLab, gold: (char.gold || 0) - cost }).where(eq(charactersTable.id, characterId));
    res.json({ data: { success: true, gem_lab: gemLab, gold_spent: cost } });
  } catch (err: any) {
    req.log.error({ err }, "upgradeGemLab error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/transmuteGold", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, amount } = req.body;
    if (!characterId) {
      res.json({ data: { rate: 1000, description: "1000 gold = 1 gem" } }); return;
    }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
    const goldCost = (amount || 1) * 1000;
    if ((char.gold || 0) < goldCost) {
      res.json({ data: { success: false, message: "Not enough gold" } }); return;
    }
    await db.update(charactersTable).set({
      gold: (char.gold || 0) - goldCost,
      gems: (char.gems || 0) + (amount || 1),
    }).where(eq(charactersTable.id, characterId));
    res.json({ data: { success: true, gold_spent: goldCost, gems_gained: amount || 1 } });
  } catch (err: any) {
    req.log.error({ err }, "transmuteGold error");
    res.status(500).json({ error: err.message });
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
      if (!legacyTrade) { res.json({ data: { success: false, message: "Trade not found" } }); return; }
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
      res.json({ data: { success: true, trade_id, status: action === "accept" ? "completed" : "cancelled" } });
      return;
    }

    const newStatus = action === "accept" ? "completed" : "cancelled";
    await db.update(tradeSessionsTable).set({ status: newStatus }).where(eq(tradeSessionsTable.id, trade_id));
    res.json({ data: { success: true, trade_id, status: newStatus } });
  } catch (err: any) {
    req.log.error({ err }, "completeTrade error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/manageParty", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId, action, partyId, targetCharacterId, characterName } = req.body;

    if (action === "create") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      const [party] = await db.insert(partiesTable).values({
        leaderId: characterId,
        leaderName: char?.name || "Unknown",
        members: [{ id: characterId, name: char?.name || "Unknown" }],
        status: "open",
      }).returning();
      res.json({ data: { success: true, party } });
      return;
    }

    if (action === "invite" && partyId && targetCharacterId) {
      const [invite] = await db.insert(partyInvitesTable).values({
        partyId,
        fromCharacterId: characterId,
        fromCharacterName: characterName || "Unknown",
        toCharacterId: targetCharacterId,
        status: "pending",
      }).returning();
      res.json({ data: { success: true, invite } });
      return;
    }

    if (action === "join" && partyId) {
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (!party) { res.json({ data: { success: false, message: "Party not found" } }); return; }
      const members = (party.members as any[]) || [];
      if (members.length >= (party.maxMembers || 4)) {
        res.json({ data: { success: false, message: "Party is full" } }); return;
      }
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
      members.push({ id: characterId, name: char?.name || "Unknown" });
      await db.update(partiesTable).set({ members }).where(eq(partiesTable.id, partyId));
      res.json({ data: { success: true } });
      return;
    }

    if (action === "leave" && partyId) {
      const [party] = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));
      if (party) {
        const members = ((party.members as any[]) || []).filter((m: any) => m.id !== characterId);
        if (members.length === 0) {
          await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, partyId));
        } else {
          await db.update(partiesTable).set({ members }).where(eq(partiesTable.id, partyId));
        }
      }
      res.json({ data: { success: true } });
      return;
    }

    if (action === "disband" && partyId) {
      await db.update(partiesTable).set({ status: "disbanded", members: [] }).where(eq(partiesTable.id, partyId));
      res.json({ data: { success: true } });
      return;
    }

    res.json({ data: { success: true, action } });
  } catch (err: any) {
    req.log.error({ err }, "manageParty error");
    res.status(500).json({ error: err.message });
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
        res.json({ data: { success: false, message: "Request already pending" } }); return;
      }
      const [request] = await db.insert(friendRequestsTable).values({
        fromCharacterId: characterId,
        toCharacterId: targetCharacterId,
        status: "pending",
      }).returning();
      res.json({ data: { success: true, request } });
      return;
    }

    if (action === "accept" && requestId) {
      const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, requestId));
      if (!request) { res.json({ data: { success: false, message: "Request not found" } }); return; }
      await db.update(friendRequestsTable).set({ status: "accepted" }).where(eq(friendRequestsTable.id, requestId));
      const [friendship] = await db.insert(friendshipsTable).values({
        characterId1: request.fromCharacterId!,
        characterId2: request.toCharacterId!,
      }).returning();
      res.json({ data: { success: true, friendship } });
      return;
    }

    if (action === "decline" && requestId) {
      await db.update(friendRequestsTable).set({ status: "declined" }).where(eq(friendRequestsTable.id, requestId));
      res.json({ data: { success: true } });
      return;
    }

    if (action === "remove" && targetCharacterId) {
      await db.delete(friendshipsTable).where(
        or(
          and(eq(friendshipsTable.characterId1, characterId), eq(friendshipsTable.characterId2, targetCharacterId)),
          and(eq(friendshipsTable.characterId2, characterId), eq(friendshipsTable.characterId1, targetCharacterId)),
        )
      );
      res.json({ data: { success: true } });
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
      res.json({ data: { friends } });
      return;
    }

    res.json({ data: { success: true } });
  } catch (err: any) {
    req.log.error({ err }, "manageFriends error");
    res.status(500).json({ error: err.message });
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
      total_kills: c.totalKills,
      prestige_level: c.prestigeLevel,
      guild_id: c.guildId,
    }));
    res.json({ data: { leaderboard } });
  } catch (err: any) {
    req.log.error({ err }, "getLeaderboard error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/dungeonAction", async (req: Request, res: Response) => {
  try {
    const { characterId, action, dungeonId } = req.body;
    if (!(await requireCharacterOwner(req, res, characterId))) return;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }

    if (action === "enter") {
      const activeSessions = await db.select().from(dungeonSessionsTable).where(
        and(eq(dungeonSessionsTable.characterId, characterId), eq(dungeonSessionsTable.status, "active"))
      );
      if (activeSessions.length > 0) {
        res.json({ data: { success: true, session: activeSessions[0] } }); return;
      }
      const bossHp = 500 + (char.level || 1) * 50;
      const [session] = await db.insert(dungeonSessionsTable).values({
        characterId,
        dungeonId: dungeonId || "cave_of_shadows",
        status: "active",
        data: { floor: 1, enemies_defeated: 0, boss_hp: bossHp, boss_max_hp: bossHp },
      }).returning();
      res.json({ data: { success: true, session } });
      return;
    }

    if (action === "attack") {
      const [session] = await db.select().from(dungeonSessionsTable).where(
        and(eq(dungeonSessionsTable.characterId, characterId), eq(dungeonSessionsTable.status, "active"))
      );
      if (!session) { res.json({ data: { success: false, message: "No active dungeon" } }); return; }

      const sData = (session.data as any) || { floor: 1, boss_hp: 500, boss_max_hp: 500, enemies_defeated: 0 };
      const playerDmg = Math.floor((char.strength || 10) * (1 + Math.random() * 0.5));
      const enemyDmg = Math.floor(10 + (sData.floor || 1) * 5 * Math.random());
      sData.boss_hp = Math.max(0, (sData.boss_hp || 0) - playerDmg);

      const result: any = { player_damage: playerDmg, enemy_damage: enemyDmg };

      if (sData.boss_hp <= 0) {
        sData.enemies_defeated = (sData.enemies_defeated || 0) + 1;
        sData.floor = (sData.floor || 1) + 1;
        const newBossHp = 500 + (char.level || 1) * 50 * sData.floor;
        sData.boss_hp = newBossHp;
        sData.boss_max_hp = newBossHp;
        const goldReward = 50 * sData.floor;
        const expReward = 30 * sData.floor;
        await db.update(charactersTable).set({
          gold: (char.gold || 0) + goldReward,
          exp: (char.exp || 0) + expReward,
        }).where(eq(charactersTable.id, characterId));
        result.floor_cleared = true;
        result.rewards = { gold: goldReward, exp: expReward };
        result.new_floor = sData.floor;
      }

      await db.update(dungeonSessionsTable).set({ data: sData }).where(eq(dungeonSessionsTable.id, session.id));
      res.json({ data: { success: true, session: { ...session, data: sData }, ...result } });
      return;
    }

    if (action === "flee" || action === "leave") {
      await db.update(dungeonSessionsTable).set({ status: "completed" })
        .where(and(eq(dungeonSessionsTable.characterId, characterId), eq(dungeonSessionsTable.status, "active")));
      res.json({ data: { success: true } });
      return;
    }

    res.json({ data: { success: true, action, character: toClientCharacter(char) } });
  } catch (err: any) {
    req.log.error({ err }, "dungeonAction error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/processServerProgression", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { res.json({ data: { success: true } }); return; }

    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.json({ data: { success: true } }); return; }

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
      res.json({ data: { success: true, gold_gained: goldGain, exp_gained: expGain, character: toClientCharacter(updated) } });
      return;
    }
    res.json({ data: { success: true } });
  } catch (err: any) {
    req.log.error({ err }, "processServerProgression error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/catchUpOfflineProgress", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.status(404).json({ error: "Character not found" }); return; }
    const lastClaim = char.lastIdleClaim ? new Date(char.lastIdleClaim).getTime() : Date.now();
    const offlineMs = Date.now() - lastClaim;
    const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), 8);
    if (offlineHours < 0.1) {
      res.json({ data: { rewards: null, hours: 0 } }); return;
    }
    const goldReward = Math.floor(offlineHours * char.level * 50);
    const expReward = Math.floor(offlineHours * char.level * 20);
    await db.update(charactersTable).set({
      gold: (char.gold || 0) + goldReward,
      exp: (char.exp || 0) + expReward,
      lastIdleClaim: new Date(),
    }).where(eq(charactersTable.id, characterId));
    res.json({
      data: {
        rewards: { gold: goldReward, exp: expReward },
        hours: Math.round(offlineHours * 10) / 10,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "catchUpOfflineProgress error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/unifiedPlayerProgression", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { characterId } = req.body;
    if (!characterId) { res.json({ data: { success: true } }); return; }
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId));
    if (!char) { res.json({ data: { success: true } }); return; }
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
      res.json({ data: { success: true, leveled_up: true, new_level: newLevel, character: toClientCharacter(updated) } });
      return;
    }
    res.json({ data: { success: true, leveled_up: false } });
  } catch (err: any) {
    req.log.error({ err }, "unifiedPlayerProgression error");
    res.status(500).json({ error: err.message });
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
      res.json({ data: { success: true, id: configId, config: newConfig || {} } });
      return;
    }

    const [configRow] = await db.select().from(gameConfigTable).where(eq(gameConfigTable.id, "global"));
    res.json({ data: { success: true, id: configRow?.id || "global", config: configRow?.config || {} } });
  } catch (err: any) {
    req.log.error({ err }, "gameConfigManager error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/functions/:name", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  req.log.warn({ functionName: req.params.name }, "Unhandled function call");
  res.json({ data: { success: true, message: `Function ${req.params.name} stub` } });
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
