import { apiFetch } from "./client";

export const base44 = {
  getApiUrl() {
    return "";
  },

  entities: new Proxy({}, {
    get(_, entity) {
      return {
        async create(data) {
          return apiFetch(`/entities/${entity}`, {
            method: "POST",
            body: JSON.stringify(data),
          });
        },
        async update(id, data) {
          return apiFetch(`/entities/${entity}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          });
        },
        async delete(id) {
          return apiFetch(`/entities/${entity}/${id}`, {
            method: "DELETE",
          });
        },
        async list() {
          return apiFetch(`/entities/${entity}`);
        },
        async filter(query = {}, sort, limit) {
          const params = new URLSearchParams();
          if (Object.keys(query).length > 0) {
            params.set("filter", JSON.stringify(query));
          }
          if (sort) params.set("sort", sort);
          if (limit) params.set("limit", String(limit));
          const qs = params.toString();
          return apiFetch(`/entities/${entity}${qs ? `?${qs}` : ""}`);
        },
        async get(id) {
          return apiFetch(`/entities/${entity}/${id}`);
        },
        subscribe() {
          return () => {}; // dummy
        }
      };
    }
  }),

  auth: {
    async me() {
      return apiFetch("/auth/user");
    },
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
    async logout() {
      return apiFetch("/auth/logout", {
        method: "POST",
      });
    },
  },

  functions: {
    async invoke(name, data) {
      return apiFetch(`/functions/${name}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
};

export default base44;
