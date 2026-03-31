import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const charactersTable = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").notNull().references(() => usersTable.id),
  name: varchar("name").notNull(),
  class: varchar("class").notNull(),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  expToNext: integer("exp_to_next").notNull().default(100),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  mp: integer("mp").notNull().default(50),
  maxMp: integer("max_mp").notNull().default(50),
  strength: integer("strength").notNull().default(10),
  dexterity: integer("dexterity").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  vitality: integer("vitality").notNull().default(10),
  luck: integer("luck").notNull().default(5),
  statPoints: integer("stat_points").notNull().default(0),
  skillPoints: integer("skill_points").notNull().default(0),
  gold: integer("gold").notNull().default(100),
  gems: integer("gems").notNull().default(10),
  currentRegion: varchar("current_region").notNull().default("verdant_forest"),
  equipment: jsonb("equipment").notNull().default({}),
  skills: jsonb("skills").notNull().default([]),
  hotbarSkills: jsonb("hotbar_skills").notNull().default([]),
  idleMode: boolean("idle_mode").notNull().default(false),
  totalKills: integer("total_kills").notNull().default(0),
  totalDamage: integer("total_damage").notNull().default(0),
  prestigeLevel: integer("prestige_level").notNull().default(0),
  achievements: jsonb("achievements").notNull().default([]),
  dailyQuestsCompleted: integer("daily_quests_completed").notNull().default(0),
  weeklyQuestsCompleted: integer("weekly_quests_completed").notNull().default(0),
  lastIdleClaim: timestamp("last_idle_claim", { withTimezone: true }).defaultNow(),
  guildId: varchar("guild_id"),
  isBanned: boolean("is_banned").notNull().default(false),
  isMuted: boolean("is_muted").notNull().default(false),
  title: varchar("title"),
  lifeSkills: jsonb("life_skills").default({}),
  gemLab: jsonb("gem_lab").default({}),
  dailyLoginStreak: integer("daily_login_streak").notNull().default(0),
  lastDailyLogin: timestamp("last_daily_login", { withTimezone: true }),
  dungeonData: jsonb("dungeon_data").default({}),
  skillTreeData: jsonb("skill_tree_data").default({}),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_characters_created_by").on(table.createdBy),
  index("idx_characters_guild_id").on(table.guildId),
]);

export const itemsTable = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => charactersTable.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  rarity: varchar("rarity").notNull().default("common"),
  level: integer("level").notNull().default(1),
  equipped: boolean("equipped").notNull().default(false),
  stats: jsonb("stats").default({}),
  setId: varchar("set_id"),
  upgradeLevel: integer("upgrade_level").notNull().default(0),
  starLevel: integer("star_level").notNull().default(0),
  awakened: boolean("awakened").notNull().default(false),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_items_owner_id").on(table.ownerId),
]);

export const guildsTable = pgTable("guilds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  leaderId: varchar("leader_id").notNull(),
  leaderName: varchar("leader_name"),
  members: jsonb("members").notNull().default([]),
  memberCount: integer("member_count").notNull().default(1),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  guildTokens: integer("guild_tokens").notNull().default(0),
  perks: jsonb("perks").default({}),
  buffs: jsonb("buffs").default({}),
  buildings: jsonb("buildings").default({}),
  bossActive: boolean("boss_active").notNull().default(false),
  bossName: varchar("boss_name"),
  bossHp: integer("boss_hp"),
  bossMaxHp: integer("boss_max_hp"),
  bossExpiresAt: timestamp("boss_expires_at", { withTimezone: true }),
  shopItems: jsonb("shop_items").default([]),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const questsTable = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => charactersTable.id),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  objective: jsonb("objective").default({}),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(1),
  reward: jsonb("reward").default({}),
  status: varchar("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_quests_character_id").on(table.characterId),
]);

export const tradesTable = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCharacterId: varchar("from_character_id").notNull(),
  fromCharacterName: varchar("from_character_name"),
  toCharacterId: varchar("to_character_id"),
  toCharacterName: varchar("to_character_name"),
  offeredItems: jsonb("offered_items").default([]),
  requestedGold: integer("requested_gold").notNull().default(0),
  offeredGold: integer("offered_gold").notNull().default(0),
  status: varchar("status").notNull().default("pending"),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const partiesTable = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderId: varchar("leader_id").notNull(),
  leaderName: varchar("leader_name"),
  members: jsonb("members").notNull().default([]),
  maxMembers: integer("max_members").notNull().default(4),
  status: varchar("status").notNull().default("open"),
  region: varchar("region"),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const partyActivitiesTable = pgTable("party_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id"),
  characterId: varchar("character_id"),
  characterName: varchar("character_name"),
  type: varchar("type").notNull(),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partyInvitesTable = pgTable("party_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  fromCharacterId: varchar("from_character_id").notNull(),
  fromCharacterName: varchar("from_character_name"),
  toCharacterId: varchar("to_character_id").notNull(),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_party_invites_to").on(table.toCharacterId),
]);

export const presencesTable = pgTable("presences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().unique(),
  characterName: varchar("character_name"),
  status: varchar("status").notNull().default("online"),
  currentZone: varchar("current_zone"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  extraData: jsonb("extra_data").default({}),
});

export const playerSessionsTable = pgTable("player_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_player_sessions_character_id").on(table.characterId),
]);

export const chatMessagesTable = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: varchar("channel").notNull().default("global"),
  senderId: varchar("sender_id").notNull(),
  senderName: varchar("sender_name"),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("chat"),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mailTable = pgTable("mail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCharacterId: varchar("from_character_id"),
  fromCharacterName: varchar("from_character_name"),
  toCharacterId: varchar("to_character_id").notNull(),
  subject: varchar("subject"),
  body: text("body"),
  attachments: jsonb("attachments").default([]),
  read: boolean("read").notNull().default(false),
  claimed: boolean("claimed").notNull().default(false),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_mail_to").on(table.toCharacterId),
]);

export const resourcesTable = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  type: varchar("type").notNull(),
  name: varchar("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  extraData: jsonb("extra_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_resources_character_id").on(table.characterId),
]);

export const gameConfigTable = pgTable("game_config", {
  id: varchar("id").primaryKey().default("global"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const friendRequestsTable = pgTable("friend_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCharacterId: varchar("from_character_id"),
  toCharacterId: varchar("to_character_id"),
  status: varchar("status").default("pending"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_friend_requests_from").on(table.fromCharacterId),
  index("idx_friend_requests_to").on(table.toCharacterId),
]);

export const friendshipsTable = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId1: varchar("character_id_1"),
  characterId2: varchar("character_id_2"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tradeSessionsTable = pgTable("trade_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiatorId: varchar("initiator_id"),
  receiverId: varchar("receiver_id"),
  status: varchar("status").default("pending"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_trade_sessions_initiator").on(table.initiatorId),
  index("idx_trade_sessions_receiver").on(table.receiverId),
]);

export const dungeonSessionsTable = pgTable("dungeon_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: varchar("character_id"),
  dungeonId: varchar("dungeon_id"),
  status: varchar("status").default("active"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_dungeon_sessions_character").on(table.characterId),
]);

export const gemLabsTable = pgTable("gem_labs", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: varchar("character_id"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_gem_labs_character").on(table.characterId),
]);

export const privateMessagesTable = pgTable("private_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCharacterId: varchar("from_character_id"),
  toCharacterId: varchar("to_character_id"),
  message: text("message"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_private_messages_from").on(table.fromCharacterId),
  index("idx_private_messages_to").on(table.toCharacterId),
]);

export const towerSessionsTable = pgTable("tower_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: varchar("character_id"),
  floor: integer("floor").notNull().default(1),
  status: varchar("status").default("active"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_tower_sessions_character").on(table.characterId),
]);

export const userRolesTable = pgTable("user_roles", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id),
  role: varchar("role").notNull().default("player"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
