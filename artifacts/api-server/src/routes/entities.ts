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
  presencesTable,
  playerSessionsTable,
  chatMessagesTable,
  mailTable,
  resourcesTable,
  friendRequestsTable,
  friendshipsTable,
  tradeSessionsTable,
  dungeonSessionsTable,
  gemLabsTable,
  privateMessagesTable,
} from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware";
import { sendSuccess, sendError } from "../lib/response";

const router: IRouter = Router();

const tableMap: Record<string, any> = {
  Character: charactersTable,
  Item: itemsTable,
  Guild: guildsTable,
  Quest: questsTable,
  Trade: tradesTable,
  Party: partiesTable,
  PartyActivity: partyActivitiesTable,
  PartyInvite: partyInvitesTable,
  Presence: presencesTable,
  PlayerSession: playerSessionsTable,
  ChatMessage: chatMessagesTable,
  Mail: mailTable,
  Resource: resourcesTable,
  FriendRequest: friendRequestsTable,
  Friendship: friendshipsTable,
  TradeSession: tradeSessionsTable,
  DungeonSession: dungeonSessionsTable,
  GemLab: gemLabsTable,
  PrivateMessage: privateMessagesTable,
};

const fieldMappings: Record<string, Record<string, string>> = {
  Character: {
    created_by: "createdBy",
    exp_to_next: "expToNext",
    max_hp: "maxHp",
    max_mp: "maxMp",
    stat_points: "statPoints",
    skill_points: "skillPoints",
    current_region: "currentRegion",
    hotbar_skills: "hotbarSkills",
    idle_mode: "idleMode",
    total_kills: "totalKills",
    total_damage: "totalDamage",
    prestige_level: "prestigeLevel",
    daily_quests_completed: "dailyQuestsCompleted",
    weekly_quests_completed: "weeklyQuestsCompleted",
    last_idle_claim: "lastIdleClaim",
    guild_id: "guildId",
    is_banned: "isBanned",
    is_muted: "isMuted",
    life_skills: "lifeSkills",
    gem_lab: "gemLab",
    daily_login_streak: "dailyLoginStreak",
    last_daily_login: "lastDailyLogin",
    dungeon_data: "dungeonData",
    skill_tree_data: "skillTreeData",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
    updated_date: "updatedAt",
  },
  Item: {
    owner_id: "ownerId",
    item_level: "level",
    set_id: "setId",
    upgrade_level: "upgradeLevel",
    star_level: "starLevel",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Guild: {
    leader_id: "leaderId",
    leader_name: "leaderName",
    member_count: "memberCount",
    guild_tokens: "guildTokens",
    boss_active: "bossActive",
    boss_name: "bossName",
    boss_hp: "bossHp",
    boss_max_hp: "bossMaxHp",
    boss_expires_at: "bossExpiresAt",
    shop_items: "shopItems",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Quest: {
    character_id: "characterId",
    expires_at: "expiresAt",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Trade: {
    from_character_id: "fromCharacterId",
    from_character_name: "fromCharacterName",
    to_character_id: "toCharacterId",
    to_character_name: "toCharacterName",
    offered_items: "offeredItems",
    requested_gold: "requestedGold",
    offered_gold: "offeredGold",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Party: {
    leader_id: "leaderId",
    leader_name: "leaderName",
    max_members: "maxMembers",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  PartyActivity: {
    party_id: "partyId",
    character_id: "characterId",
    character_name: "characterName",
    created_at: "createdAt",
  },
  PartyInvite: {
    party_id: "partyId",
    from_character_id: "fromCharacterId",
    from_character_name: "fromCharacterName",
    to_character_id: "toCharacterId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Presence: {
    character_id: "characterId",
    character_name: "characterName",
    current_zone: "currentZone",
    last_seen: "lastSeen",
    extra_data: "extraData",
  },
  PlayerSession: {
    character_id: "characterId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  ChatMessage: {
    sender_id: "senderId",
    sender_name: "senderName",
    extra_data: "extraData",
    created_at: "createdAt",
  },
  Mail: {
    from_character_id: "fromCharacterId",
    from_character_name: "fromCharacterName",
    to_character_id: "toCharacterId",
    extra_data: "extraData",
    created_at: "createdAt",
  },
  Resource: {
    character_id: "characterId",
    resource_type: "type",
    rarity: "name",
    extra_data: "extraData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  FriendRequest: {
    from_character_id: "fromCharacterId",
    to_character_id: "toCharacterId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Friendship: {
    character_id_1: "characterId1",
    character_id_2: "characterId2",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  TradeSession: {
    initiator_id: "initiatorId",
    receiver_id: "receiverId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  DungeonSession: {
    character_id: "characterId",
    dungeon_id: "dungeonId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  GemLab: {
    character_id: "characterId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  PrivateMessage: {
    from_character_id: "fromCharacterId",
    to_character_id: "toCharacterId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
};

const timestampFields = new Set([
  "createdAt", "updatedAt", "lastIdleClaim", "lastDailyLogin",
  "expiresAt", "lastSeen", "bossExpiresAt",
]);

function getTableColumns(entityName: string): Set<string> | null {
  const table = tableMap[entityName];
  if (!table) return null;
  // Drizzle tables expose column names as object keys
  const cols = new Set<string>();
  for (const key of Object.keys(table)) {
    if (key.startsWith("_") || key === "getSQL" || key === "$inferInsert" || key === "$inferSelect") continue;
    cols.add(key);
  }
  return cols;
}

function toDb(entityName: string, data: Record<string, any>): Record<string, any> {
  const mappings = fieldMappings[entityName] || {};
  const columns = getTableColumns(entityName);
  const result: Record<string, any> = {};
  const extraFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = mappings[key] || key;
    if (timestampFields.has(mappedKey) && value !== null && value !== undefined && !(value instanceof Date)) {
      result[mappedKey] = new Date(value);
    } else if (columns && !columns.has(mappedKey)) {
      // Unknown field: store in extraData so it's not lost
      extraFields[key] = value;
    } else {
      result[mappedKey] = value;
    }
  }
  // Merge unknown fields into extraData
  if (Object.keys(extraFields).length > 0) {
    const existing = (result.extraData && typeof result.extraData === "object") ? result.extraData : {};
    result.extraData = { ...existing, ...extraFields };
  }
  delete result.createdAt;
  delete result.updatedAt;
  return result;
}

function toClient(entityName: string, row: Record<string, any>): Record<string, any> {
  const mappings = fieldMappings[entityName] || {};
  const reverseMappings: Record<string, string> = {};
  for (const [clientKey, dbKey] of Object.entries(mappings)) {
    reverseMappings[dbKey] = clientKey;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const clientKey = reverseMappings[key] || key;
    result[clientKey] = value;
  }
  return result;
}

const ownerFieldMap: Record<string, string> = {
  Character: "createdBy",
  Item: "ownerId",
  Quest: "characterId",
  Resource: "characterId",
  PlayerSession: "characterId",
};

async function verifyOwnership(req: Request, entity: string, recordId: string): Promise<boolean> {
  const ownerField = ownerFieldMap[entity];
  if (!ownerField) return true;
  const table = tableMap[entity];
  const [row] = await db.select().from(table).where(eq((table as any).id, recordId));
  if (!row) return true;
  if (ownerField === "createdBy") return (row as any).createdBy === req.user!.id;
  const charId = (row as any)[ownerField];
  if (!charId) return true;
  const [char] = await db.select({ createdBy: charactersTable.createdBy }).from(charactersTable).where(eq(charactersTable.id, charId));
  return char?.createdBy === req.user!.id;
}

router.get("/entities/:entity", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { entity } = req.params;
  const table = tableMap[entity];
  if (!table) {
    sendError(res, 404, `Entity ${entity} not found`);
    return;
  }

  try {
    const filterParam = req.query.filter as string | undefined;
    const sortParam = req.query.sort as string | undefined;
    const limitParam = req.query.limit as string | undefined;

    let query = db.select().from(table);

    if (filterParam) {
      const filters = JSON.parse(filterParam);
      const conditions = Object.entries(filters).map(([key, value]) => {
        const dbKey = (fieldMappings[entity] || {})[key] || key;
        const col = (table as any)[dbKey];
        if (!col) return null;
        return eq(col, value as any);
      }).filter(Boolean);

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0]! : and(...conditions as any));
      }
    }

    if (sortParam) {
      const descending = sortParam.startsWith("-");
      const sortField = descending ? sortParam.slice(1) : sortParam;
      const dbSortField = (fieldMappings[entity] || {})[sortField] || sortField;
      const col = (table as any)[dbSortField];
      if (col) {
        query = query.orderBy(descending ? desc(col) : asc(col));
      }
    }

    if (limitParam) {
      query = (query as any).limit(Number(limitParam));
    }

    const rows = await query;
    sendSuccess(res, rows.map((r: any) => toClient(entity, r)));
  } catch (err: any) {
    req.log.error({ err }, "Entity list error");
    sendError(res, 500, err.message);
  }
});

router.get("/entities/:entity/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { entity, id } = req.params;
  const table = tableMap[entity];
  if (!table) {
    sendError(res, 404, `Entity ${entity} not found`);
    return;
  }

  try {
    const [row] = await db.select().from(table).where(eq((table as any).id, id));
    if (!row) {
      sendError(res, 404, "Not found");
      return;
    }
    sendSuccess(res, toClient(entity, row));
  } catch (err: any) {
    req.log.error({ err }, "Entity get error");
    sendError(res, 500, err.message);
  }
});

router.post("/entities/:entity", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { entity } = req.params;
  const table = tableMap[entity];
  if (!table) {
    sendError(res, 404, `Entity ${entity} not found`);
    return;
  }

  try {
    const dbData = toDb(entity, req.body);

    if (entity === "Character") {
      dbData.createdBy = req.user!.id;
    }

    if (entity === "Presence" && dbData.characterId) {
      const [existing] = await db.select().from(table).where(eq((table as any).characterId, dbData.characterId));
      if (existing) {
        const [updated] = await db.update(table).set(dbData).where(eq((table as any).id, (existing as any).id)).returning();
        sendSuccess(res, toClient(entity, updated));
        return;
      }
    }

    const [row] = await db.insert(table).values(dbData).returning();
    sendSuccess(res, toClient(entity, row));
  } catch (err: any) {
    req.log.error({ err }, "Entity create error");
    sendError(res, 500, err.message);
  }
});

router.patch("/entities/:entity/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { entity, id } = req.params;
  const table = tableMap[entity];
  if (!table) {
    sendError(res, 404, `Entity ${entity} not found`);
    return;
  }

  try {
    if (!(await verifyOwnership(req, entity, id))) {
      sendError(res, 403, "Not authorized to modify this record");
      return;
    }
    const dbData = toDb(entity, req.body);
    const [row] = await db.update(table).set(dbData).where(eq((table as any).id, id)).returning();
    if (!row) {
      sendError(res, 404, "Not found");
      return;
    }
    sendSuccess(res, toClient(entity, row));
  } catch (err: any) {
    req.log.error({ err }, "Entity update error");
    sendError(res, 500, err.message);
  }
});

router.delete("/entities/:entity/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { entity, id } = req.params;
  const table = tableMap[entity];
  if (!table) {
    sendError(res, 404, `Entity ${entity} not found`);
    return;
  }

  try {
    if (!(await verifyOwnership(req, entity, id))) {
      sendError(res, 403, "Not authorized to delete this record");
      return;
    }
    await db.delete(table).where(eq((table as any).id, id));
    sendSuccess(res, null);
  } catch (err: any) {
    req.log.error({ err }, "Entity delete error");
    sendError(res, 500, err.message);
  }
});

export default router;
