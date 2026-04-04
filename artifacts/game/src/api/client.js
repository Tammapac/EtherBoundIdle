const API_URL = "";

// ---------------------
// Request deduplication
// ---------------------
// In-flight promises keyed by method+url+body. Prevents duplicate concurrent
// requests (e.g. two components calling list() at the same time).
const inflightRequests = new Map();

// ---------------------
// Short-term GET cache
// ---------------------
// Caches GET responses for CACHE_TTL_MS. Keyed by url (includes query string).
const responseCache = new Map();
const CACHE_TTL_MS = 10_000; // 10 seconds

function buildCacheKey(path, options) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body || "";
  return `${method}:${path}:${body}`;
}

// Extract entity name from path like /entities/Player/123 -> Player
function extractEntityType(path) {
  const match = path.match(/^\/entities\/([^/?]+)/);
  return match ? match[1] : null;
}

function invalidateCacheForEntity(entityType) {
  if (!entityType) return;
  for (const key of responseCache.keys()) {
    if (key.includes(`/entities/${entityType}`)) {
      responseCache.delete(key);
    }
  }
}

async function rawApiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || "API Error");
  }

  return data.data ?? data;
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isRead = method === "GET";
  const cacheKey = buildCacheKey(path, options);

  // 1. For GET requests, check the short-term cache first
  if (isRead) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Request deduplication — return existing in-flight promise if one exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  // 3. Execute the request
  const promise = rawApiFetch(path, options)
    .then((data) => {
      // Cache GET responses
      if (isRead) {
        responseCache.set(cacheKey, { data, timestamp: Date.now() });
      } else {
        // Mutation — invalidate cached entries for this entity type
        invalidateCacheForEntity(extractEntityType(path));
      }
      return data;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, promise);
  return promise;
}

// ------------------
// AUTH
// ------------------

export const auth = {
  async login(email, password) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email, password) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async me() {
    try {
      return await apiFetch("/auth/user");
    } catch {
      return null;
    }
  },

  async logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.reload();
  },
};

// ------------------
// API
// ------------------

export const api = {
  async callFunction(name, params = {}) {
    return apiFetch(`/functions/${name}`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async getEntity(name, id) {
    return apiFetch(`/entities/${name}/${id}`);
  },

  async listEntities(name) {
    return apiFetch(`/entities/${name}`);
  },

  async createEntity(name, body) {
    return apiFetch(`/entities/${name}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async updateEntity(name, id, body) {
    return apiFetch(`/entities/${name}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async deleteEntity(name, id) {
    return apiFetch(`/entities/${name}/${id}`, {
      method: "DELETE",
    });
  },

  async filterEntities(name, query = {}, sort, limit) {
    const params = new URLSearchParams();
    if (Object.keys(query).length) {
      params.set("filter", JSON.stringify(query));
    }
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));

    return apiFetch(`/entities/${name}?${params.toString()}`);
  },
};
