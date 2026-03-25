const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/../api';

async function apiFetch(path, options = {}) {
  const url = API_BASE + path;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    err.status = res.status;
    try { err.data = await res.json(); } catch {}
    throw err;
  }
  return res.json();
}

function createEntityProxy(entityName) {
  const basePath = `/entities/${entityName}`;

  return {
    async create(data) {
      return apiFetch(basePath, { method: 'POST', body: JSON.stringify(data) });
    },

    async get(id) {
      return apiFetch(`${basePath}/${id}`);
    },

    async filter(query = {}, sort, limit) {
      const params = new URLSearchParams();
      if (query && Object.keys(query).length) params.set('filter', JSON.stringify(query));
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return apiFetch(`${basePath}${qs ? '?' + qs : ''}`);
    },

    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return apiFetch(`${basePath}${qs ? '?' + qs : ''}`);
    },

    async update(id, data) {
      return apiFetch(`${basePath}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },

    async delete(id) {
      return apiFetch(`${basePath}/${id}`, { method: 'DELETE' });
    },

    subscribe(callback) {
      let active = true;
      let timeout;

      const poll = async () => {
        if (!active) return;
        try {
          callback({ type: 'poll' });
        } catch {}
        timeout = setTimeout(poll, 30000);
      };

      timeout = setTimeout(poll, 30000);

      return () => {
        active = false;
        if (timeout) clearTimeout(timeout);
      };
    },
  };
}

const entityNames = [
  'Character', 'Item', 'Guild', 'Quest', 'Trade',
  'Party', 'PartyActivity', 'PartyInvite', 'Presence',
  'PlayerSession', 'ChatMessage', 'Mail', 'Resource',
  'FriendRequest', 'Friendship', 'TradeSession',
  'DungeonSession', 'GemLab', 'PrivateMessage',
];

const entities = {};
entityNames.forEach(name => {
  entities[name] = createEntityProxy(name);
});

export const base44 = {
  auth: {
    async me() {
      const res = await apiFetch('/auth/user');
      if (res.user) return res.user;
      throw new Error('Not authenticated');
    },

    logout(redirectUrl) {
      window.location.href = API_BASE + '/logout';
    },

    redirectToLogin(returnTo) {
      window.location.href = API_BASE + '/login?returnTo=' + encodeURIComponent(returnTo || '/');
    },
  },

  entities,

  functions: {
    async invoke(functionName, params = {}) {
      const result = await apiFetch(`/functions/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return result;
    },
  },
};

export default base44;
