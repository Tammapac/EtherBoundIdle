/**
 * Runtime database optimizations — creates missing indexes on startup.
 * Uses IF NOT EXISTS so it's safe to run repeatedly.
 */
import { pool } from "@workspace/db";
import { logger } from "./logger.js";

const INDEXES = [
  // Items: fast lookup for equipped items by owner
  `CREATE INDEX IF NOT EXISTS idx_items_owner_equipped ON items (owner_id) WHERE equipped = true`,
  // Quests: fast lookup for active quests by character
  `CREATE INDEX IF NOT EXISTS idx_quests_char_status ON quests (character_id, status)`,
  // Parties: fast lookup for active parties
  `CREATE INDEX IF NOT EXISTS idx_parties_status ON parties (status) WHERE status != 'disbanded'`,
  // Party invites: fast lookup for pending invites to a character
  `CREATE INDEX IF NOT EXISTS idx_party_invites_to_status ON party_invites (to_character_id, status) WHERE status = 'pending'`,
  // Chat messages: recent messages by channel
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages (channel, created_at DESC)`,
  // Presences: fast lookup by character
  `CREATE INDEX IF NOT EXISTS idx_presences_character ON presences (character_id)`,
  // Season missions: active missions by character
  `CREATE INDEX IF NOT EXISTS idx_season_missions_char ON season_missions (character_id) WHERE status = 'active'`,
  // Friend requests: pending requests
  `CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status ON friend_requests (to_character_id) WHERE status = 'pending'`,
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of INDEXES) {
      try {
        await client.query(sql);
      } catch (e: any) {
        // Non-fatal: index creation can fail if column names differ
        logger.warn({ err: e.message, sql: sql.slice(0, 80) }, "Index creation skipped");
      }
    }
    logger.info(`Applied ${INDEXES.length} index migrations`);
  } finally {
    client.release();
  }
}
