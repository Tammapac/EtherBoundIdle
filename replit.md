# Ether Bound Idle

## Overview

Full-featured idle MMORPG with a clean split architecture using a pnpm monorepo. React+Vite frontend and Express 5+TypeScript backend with Drizzle ORM.

## Stack

- **Frontend**: React + Vite + Tailwind CSS v3 (dark sci-fi theme)
- **Backend**: Express 5 + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Supabase-hosted)
- **Node.js**: 24
- **Monorepo**: pnpm workspaces
- **External Server**: `http://46.224.121.242:3000`

## Structure

```text
/
├── artifacts/
│   ├── api-server/              # Express API server
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point (port 8080)
│   │   │   ├── app.ts           # Express app setup, middleware, routes
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts      # Session management (cookie sid)
│   │   │   │   ├── response.ts  # sendSuccess/sendError response helpers
│   │   │   │   ├── gameData.ts  # Game constants, loot gen, enemy data
│   │   │   │   └── logger.ts    # Pino logger
│   │   │   ├── middlewares/
│   │   │   │   └── authMiddleware.ts  # Auth middleware + requireAuth helper
│   │   │   ├── routes/
│   │   │   │   ├── index.ts     # Route registration
│   │   │   │   ├── auth.ts      # /api/auth/* endpoints
│   │   │   │   ├── entities.ts  # Generic CRUD /api/entities/:entity
│   │   │   │   ├── functions.ts # All game logic /api/functions/*
│   │   │   │   └── health.ts    # /api/healthz
│   │   │   └── services/
│   │   │       └── authHelpers.ts
│   │   ├── build.mjs
│   │   └── package.json
│   └── game/                    # React + Vite client
│       ├── src/
│       │   ├── api/
│       │   │   └── base44Client.js  # Server-only API client (~120 lines)
│       │   ├── components/      # UI components
│       │   ├── hooks/           # React hooks
│       │   ├── lib/
│       │   │   ├── AuthContext.jsx   # Auth provider (uses base44 client)
│       │   │   ├── idleEngine.js     # Client-side idle tick engine
│       │   │   └── gameData.js       # Client game constants
│       │   ├── pages/           # Route pages
│       │   ├── App.jsx          # Root app with routing
│       │   └── main.jsx         # React entry point
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   └── db/                      # Shared Drizzle schema + DB connection
└── replit.md
```

## API Response Format

All API endpoints return a consistent format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Error message" }
```

The frontend `base44Client.js` unwraps responses automatically — `apiFetch()` returns `data` directly on success and throws on error.

## API Endpoints

All under `/api`:
- `GET /api/healthz` — Health check
- Auth: `GET /api/auth/user`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- Entities: `GET/POST /api/entities/:entity`, `GET/PATCH/DELETE /api/entities/:entity/:id`
- Functions: `POST /api/functions/:name` — fight, getPlayer, sellItem, upgradeItemSafe, upgradeItemStar, awakenItem, lifeSkills, processGemLab, claimGemLabGems, upgradeGemLab, transmuteGold, completeTrade, manageParty, manageFriends, getLeaderboard, dungeonAction, processServerProgression, catchUpOfflineProgress, unifiedPlayerProgression, gameConfigManager, claimDailyLogin, etc.

## Entity Names

Character, Item, Guild, Quest, Trade, Party, PartyActivity, PartyInvite, Presence, PlayerSession, ChatMessage, Mail, Resource, FriendRequest, Friendship, TradeSession, DungeonSession, GemLab, PrivateMessage

## Key Design Decisions

- **Server-authoritative**: All game logic (combat, loot, upgrades) validated on backend
- **Server-persistent**: All game data saved to Supabase PostgreSQL via backend API. localStorage used only for auth session token (`eb_session_id`) and transient client-side cache (`hybridPersistence`)
- **Items schema**: No subtype/levelReq/sellPrice/setName columns — stored in `extraData` JSONB; `setId` column holds setKey
- **GemLab**: Uses `gem_labs` table (characterId, data JSONB) — NOT character.gemLab JSONB. Frontend reads `gemLab.data.production_level` etc.
- **IdleEngine**: `start(characterId, characterData)` takes initial char; `setCharacterData(char)` syncs updates from App.jsx
- **Quest fields**: `type` (daily/weekly/story), `progress`, `target`, `reward` (singular object)
- **Shop**: Backend generates seeded level-based items (weapon/armor/etc) with rarity/stats; `buy_price`/`sell_price` fields; force refresh costs 5 gems server-side
- **AutoSave**: `useCharacterAutoSave` hook saves character data to server every 10s (delta-only); `idleEngine.saveTick` also saves every 15s
- **Guild Boss Attacks**: Tracked server-side in `game_config` table via `guildBossAttack` function (NOT localStorage)
- **Gear upgrades**: Safe = 300*(upgrade+1)*rarityMult gold, +5%; Star = ceil(5*1.5^star*rarityMult) gems, +15%/destroy, max 7; Awaken = 50 gems (star 7), +50%
- **Fight**: regionKey from char.currentRegion, isBoss/isElite from ENEMIES definition
- **Auth**: Custom bcrypt email/password auth (NOT Supabase Auth). Passwords hashed with bcrypt (12 rounds). Sessions stored in `sessions` table, cookie `sid` set httpOnly. Frontend calls backend via `fetch` with `credentials: 'include'`. Cookie `secure` flag is env-aware (true in production only).
- **Users table**: has `password_hash` and `username` columns
- **Admin**: requireAdmin checks userRolesTable (role "admin" or "moderator")

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (via Supabase)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `PORT` — Server port (default 8080 for backend)
