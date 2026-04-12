/**
 * EtherBound Idle — Bot Load Testing Runner
 *
 * Simulates realistic player behavior:
 *   1. Register / login
 *   2. Create character (if none)
 *   3. Connect Socket.IO + select character
 *   4. Periodic combat (fight endpoint)
 *   5. Periodic idle progress claims
 *   6. Occasional chat messages
 *   7. Occasional party create / invite / leave
 *
 * Usage:
 *   node bot-runner.js                          # 10 bots, default
 *   node bot-runner.js --bots 100               # 100 bots
 *   node bot-runner.js --bots 500 --ramp        # ramp up 500 bots over time
 *   node bot-runner.js --bots 1000 --ramp --ramp-delay 200  # 200ms between each bot
 *   node bot-runner.js --url http://1.2.3.4:3000  # custom server URL
 *
 * Environment:
 *   SERVER_URL  — base URL (default http://localhost:3000)
 */

import { io as ioClient } from "socket.io-client";

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  if (typeof fallback === "boolean") return true;
  return args[i + 1] ?? fallback;
}

const SERVER_URL = getArg("url", process.env.SERVER_URL || "http://localhost:3000");
const BOT_COUNT = parseInt(getArg("bots", "10"), 10);
// Auto-ramp when > 20 bots to avoid hitting auth rate limits
const RAMP = getArg("ramp", BOT_COUNT > 20 ? true : false);
const RAMP_DELAY_MS = parseInt(getArg("ramp-delay", BOT_COUNT > 50 ? "1000" : "500"), 10);
const FIGHT_INTERVAL_MS = parseInt(getArg("fight-interval", "5000"), 10);
const IDLE_CLAIM_INTERVAL_MS = parseInt(getArg("idle-interval", "60000"), 10);
const CHAT_INTERVAL_MS = parseInt(getArg("chat-interval", "30000"), 10);
const DURATION_MS = parseInt(getArg("duration", "300000"), 10); // 5 min default
const VERBOSE = getArg("verbose", false);

const CLASSES = ["warrior", "mage", "ranger", "rogue"];
const REGIONS = [
  "verdant_forest", "scorched_desert", "frozen_peaks",
  "shadow_realm", "celestial_spire",
];
const ENEMIES_BY_REGION = {
  verdant_forest: ["forest_wolf", "goblin_scout", "giant_spider", "wild_boar", "moss_golem", "vine_serpent", "forest_bandit", "poison_frog"],
  scorched_desert: ["sand_scorpion", "desert_bandit", "sand_golem", "fire_lizard", "cactus_wraith", "dune_raider", "tomb_scarab", "desert_cobra"],
  frozen_peaks: ["frost_wolf", "ice_elemental", "yeti", "glacial_golem", "snow_harpy", "frozen_knight", "ice_witch", "frost_troll"],
  shadow_realm: ["shadow_wraith", "demon_knight", "void_walker", "soul_harvester", "nightmare_hound", "cursed_revenant", "dark_sorcerer", "abyssal_fiend"],
  celestial_spire: ["celestial_guardian", "seraph_warrior", "titan", "star_phantom", "nova_knight", "divine_construct", "astral_wyrm", "cosmic_sentinel"],
};

// ─── Metrics ─────────────────────────────────────────────────────────────────
const metrics = {
  botsActive: 0,
  botsConnected: 0,
  totalRequests: 0,
  totalErrors: 0,
  totalFights: 0,
  totalChats: 0,
  totalIdleClaims: 0,
  latencies: [],       // last 1000
  socketsConnected: 0,
  startTime: Date.now(),
};

function recordLatency(ms) {
  metrics.latencies.push(ms);
  if (metrics.latencies.length > 1000) metrics.latencies.shift();
}

function getStats() {
  const lats = metrics.latencies;
  if (lats.length === 0) return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...lats].sort((a, b) => a - b);
  return {
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    max: sorted[sorted.length - 1],
  };
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function api(method, path, body, cookie) {
  const url = `${SERVER_URL}/api${path}`;
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = `sid=${cookie}`;
  const start = Date.now();
  metrics.totalRequests++;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const elapsed = Date.now() - start;
    recordLatency(elapsed);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { error: text.slice(0, 300) }; }
    if (!res.ok || json.success === false) {
      metrics.totalErrors++;
      if (VERBOSE) console.error(`  [ERR] ${method} ${path}: ${json.error || json.message || res.status}`);
      return { ok: false, error: json.error || json.message || `HTTP ${res.status}`, headers: res.headers };
    }
    return { ok: true, data: json.data ?? json, headers: res.headers };
  } catch (e) {
    metrics.totalErrors++;
    recordLatency(Date.now() - start);
    if (VERBOSE) console.error(`  [ERR] ${method} ${path}: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

function extractSid(headers) {
  const setCookie = headers?.getSetCookie?.() || [];
  for (const c of setCookie) {
    const m = c.match(/sid=([a-f0-9]+)/);
    if (m) return m[1];
  }
  return null;
}

// ─── Bot class ───────────────────────────────────────────────────────────────
class Bot {
  constructor(index) {
    this.index = index;
    this.email = `bot${index}_${Date.now()}@loadtest.com`;
    this.password = "loadtest123";
    this.sid = null;
    this.userId = null;
    this.characterId = null;
    this.characterName = `Bot${index}_${Math.random().toString(36).slice(2, 6)}`;
    this.characterClass = CLASSES[index % CLASSES.length];
    this.region = REGIONS[0]; // start in verdant_forest
    this.socket = null;
    this.timers = [];
    this.alive = true;
  }

  log(msg) {
    if (VERBOSE) console.log(`  [Bot ${this.index}] ${msg}`);
  }

  async start() {
    try {
      // 1. Try login first (faster if bots already registered from previous run)
      let login = await api("POST", "/auth/login", {
        email: this.email,
        password: this.password,
      });
      if (login.ok) {
        this.sid = extractSid(login.headers);
        this.userId = login.data?.user?.id;
        this.log(`Logged in`);
      } else {
        // Login failed — could be "Invalid login", fetch error, rate limit, etc.
        // If it was a connection error, wait briefly before trying register
        if (login.error?.includes("fetch failed") || login.error?.includes("ECONNREFUSED")) {
          this.log(`Connection error: ${login.error}, retrying in 3s...`);
          await sleep(3000);
        }
        // Always try to register (new email each run, account won't exist)
        const reg = await api("POST", "/auth/register", {
          email: this.email,
          password: this.password,
          username: this.characterName,
        });
        if (reg.ok) {
          this.sid = extractSid(reg.headers);
          this.userId = reg.data?.user?.id;
          this.log(`Registered: ${this.email}`);
        } else if (reg.error?.includes("duplicate") || reg.error?.includes("already")) {
          // Account exists from previous run with same email — retry login
          this.log(`Already registered, retrying login...`);
          await sleep(1000);
          login = await api("POST", "/auth/login", {
            email: this.email,
            password: this.password,
          });
          if (!login.ok) { this.log(`Login retry failed: ${login.error}`); return; }
          this.sid = extractSid(login.headers);
          this.userId = login.data?.user?.id;
          this.log(`Logged in (retry)`);
        } else {
          this.log(`Register failed: ${reg.error}`);
          return;
        }
      }
      if (!this.sid) { this.log("No session cookie"); return; }

      // 2. List characters or create one
      const chars = await api("GET", "/entities/Character", null, this.sid);
      if (chars.ok && chars.data?.length > 0) {
        const char = chars.data[0];
        this.characterId = char.id;
        this.characterName = char.name;
        this.region = char.current_region || REGIONS[0];
        this.log(`Using existing character: ${char.name}`);
      } else {
        const create = await api("POST", "/entities/Character", {
          name: this.characterName,
          class: this.characterClass,
        }, this.sid);
        if (!create.ok) { this.log(`Char create failed: ${create.error}`); return; }
        this.characterId = create.data?.id;
        this.log(`Created character: ${this.characterName}`);
      }

      // 3. Connect Socket.IO
      this.connectSocket();

      // 4. Start game loops
      metrics.botsActive++;
      this.startGameLoops();
    } catch (e) {
      this.log(`Start error: ${e.message}`);
    }
  }

  connectSocket() {
    this.socket = ioClient(SERVER_URL, {
      transports: ["websocket"],
      auth: { token: this.sid },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });
    this.socket.on("connect", () => {
      metrics.socketsConnected++;
      metrics.botsConnected++;
      this.socket.emit("character:select", this.characterId);
      this.log("Socket connected");
    });
    this.socket.on("disconnect", () => {
      metrics.socketsConnected--;
      metrics.botsConnected--;
    });
    this.socket.on("connect_error", (err) => {
      if (VERBOSE) this.log(`Socket error: ${err.message}`);
    });
    // Listen for events (just count them, don't process)
    this.socket.onAny(() => {});
  }

  startGameLoops() {
    // Fight loop — variable interval with jitter
    const fightLoop = () => {
      if (!this.alive) return;
      this.doFight();
      const jitter = Math.random() * FIGHT_INTERVAL_MS * 0.5;
      const timer = setTimeout(fightLoop, FIGHT_INTERVAL_MS + jitter);
      this.timers.push(timer);
    };
    const t1 = setTimeout(fightLoop, Math.random() * FIGHT_INTERVAL_MS);
    this.timers.push(t1);

    // Idle progress claim loop
    const idleLoop = () => {
      if (!this.alive) return;
      this.doIdleClaim();
      const timer = setTimeout(idleLoop, IDLE_CLAIM_INTERVAL_MS + Math.random() * 10000);
      this.timers.push(timer);
    };
    const t2 = setTimeout(idleLoop, Math.random() * IDLE_CLAIM_INTERVAL_MS);
    this.timers.push(t2);

    // Chat loop
    const chatLoop = () => {
      if (!this.alive) return;
      this.doChat();
      const timer = setTimeout(chatLoop, CHAT_INTERVAL_MS + Math.random() * 20000);
      this.timers.push(timer);
    };
    const t3 = setTimeout(chatLoop, 10000 + Math.random() * CHAT_INTERVAL_MS);
    this.timers.push(t3);
  }

  async doFight() {
    if (!this.characterId || !this.sid) return;
    const enemies = ENEMIES_BY_REGION[this.region] || ENEMIES_BY_REGION.verdant_forest;
    const enemyKey = enemies[Math.floor(Math.random() * enemies.length)];
    const res = await api("POST", "/functions/fight", {
      characterId: this.characterId,
      enemyKey,
      regionKey: this.region,
      isElite: false,
      isBoss: false,
      isEmpowered: false,
      partySize: 1,
    }, this.sid);
    if (res.ok) {
      metrics.totalFights++;
      // Occasionally change region (every ~20 fights)
      if (Math.random() < 0.05) {
        this.region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
        this.log(`Moved to ${this.region}`);
      }
    }
  }

  async doIdleClaim() {
    if (!this.characterId || !this.sid) return;
    const res = await api("POST", "/functions/catchUpOfflineProgress", {
      characterId: this.characterId,
    }, this.sid);
    if (res.ok) metrics.totalIdleClaims++;
  }

  async doChat() {
    if (!this.characterId || !this.sid) return;
    const messages = [
      "Hello everyone!", "Looking for party", "Anyone farming?",
      "GG!", "Nice loot!", "brb", "What level are you?",
      "Anyone want to group?", "This zone is tough!", "lol",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const res = await api("POST", "/entities/ChatMessage", {
      sender_id: this.characterId,
      sender_name: this.characterName,
      message: msg,
      channel: "global",
    }, this.sid);
    if (res.ok) metrics.totalChats++;
  }

  stop() {
    this.alive = false;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    metrics.botsActive--;
  }
}

// ─── Runner ──────────────────────────────────────────────────────────────────
async function run() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  EtherBound Idle — Load Test Bot Runner");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Server:          ${SERVER_URL}`);
  console.log(`  Bots:            ${BOT_COUNT}`);
  console.log(`  Ramp:            ${RAMP ? `yes (${RAMP_DELAY_MS}ms between bots)` : "no (all at once)"}`);
  console.log(`  Fight interval:  ${FIGHT_INTERVAL_MS}ms`);
  console.log(`  Duration:        ${DURATION_MS / 1000}s`);
  console.log(`  Verbose:         ${VERBOSE}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const bots = [];

  // Spawn bots
  if (RAMP) {
    console.log(`Ramping up ${BOT_COUNT} bots (${RAMP_DELAY_MS}ms between each)...\n`);
    for (let i = 0; i < BOT_COUNT; i++) {
      const bot = new Bot(i);
      bots.push(bot);
      bot.start(); // don't await — fire and forget
      if (i < BOT_COUNT - 1) {
        await sleep(RAMP_DELAY_MS);
      }
    }
  } else {
    console.log(`Launching ${BOT_COUNT} bots simultaneously...\n`);
    for (let i = 0; i < BOT_COUNT; i++) {
      const bot = new Bot(i);
      bots.push(bot);
      bot.start();
    }
  }

  // Metrics reporting every 5s
  const metricsInterval = setInterval(() => {
    const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
    const stats = getStats();
    const rps = metrics.totalRequests / (elapsed || 1);
    console.log(
      `[${elapsed}s] ` +
      `Bots: ${metrics.botsActive} active, ${metrics.botsConnected} ws | ` +
      `Req: ${metrics.totalRequests} (${rps.toFixed(1)}/s) | ` +
      `Err: ${metrics.totalErrors} | ` +
      `Fights: ${metrics.totalFights} | ` +
      `Lat: avg=${stats.avg}ms p95=${stats.p95}ms p99=${stats.p99}ms max=${stats.max}ms`
    );
  }, 5000);

  // Run for duration, then stop
  await sleep(DURATION_MS);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  STOPPING — Final Report");
  console.log("═══════════════════════════════════════════════════════════");

  clearInterval(metricsInterval);
  for (const bot of bots) bot.stop();
  await sleep(2000); // let sockets close

  const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
  const stats = getStats();
  const rps = (metrics.totalRequests / elapsed).toFixed(1);

  console.log(`  Duration:             ${elapsed}s`);
  console.log(`  Total bots:           ${BOT_COUNT}`);
  console.log(`  Total requests:       ${metrics.totalRequests}`);
  console.log(`  Total errors:         ${metrics.totalErrors} (${((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  Avg RPS:              ${rps}`);
  console.log(`  Fights:               ${metrics.totalFights}`);
  console.log(`  Idle claims:          ${metrics.totalIdleClaims}`);
  console.log(`  Chat messages:        ${metrics.totalChats}`);
  console.log(`  Latency avg:          ${stats.avg}ms`);
  console.log(`  Latency p50:          ${stats.p50}ms`);
  console.log(`  Latency p95:          ${stats.p95}ms`);
  console.log(`  Latency p99:          ${stats.p99}ms`);
  console.log(`  Latency max:          ${stats.max}ms`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(0);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((e) => {
  console.error("Runner failed:", e);
  process.exit(1);
});
