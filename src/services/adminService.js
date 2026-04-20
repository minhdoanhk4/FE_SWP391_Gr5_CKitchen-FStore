import api from "../api/axiosConfig";

const adminService = {
  // ── User Management ────────────────────────────────────────────────────────
  users: {
    getAll: ({ roleName, status, page = 0, size = 20 } = {}) =>
      api
        .get("/admin/users", { params: { roleName, status, page, size } })
        .then((r) => r.data.data),

    getById: (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data),

    create: (payload) =>
      api.post("/admin/users", payload).then((r) => r.data.data),

    update: (id, payload) =>
      api.put(`/admin/users/${id}`, payload).then((r) => r.data.data),

    delete: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),

    getMe: () => api.get("/admin/users/me").then((r) => r.data.data),
  },

  // ── Role & Permission Management ───────────────────────────────────────────
  roles: {
    getAll: () => api.get("/admin/roles").then((r) => r.data.data),
    getById: (id) => api.get(`/admin/roles/${id}`).then((r) => r.data.data),
    update: (id, payload) =>
      api.put(`/admin/roles/${id}`, payload).then((r) => r.data.data),
    updatePermissions: (id, permissionIds) =>
      api
        .put(`/admin/roles/${id}/permissions`, { permissionIds })
        .then((r) => r.data.data),
  },

  permissions: {
    getAll: () => api.get("/admin/permissions").then((r) => r.data.data),
    update: (id, name) =>
      api.put(`/admin/permissions/${id}`, { name }).then((r) => r.data.data),
  },

  // ── Catalog Management ─────────────────────────────────────────────────────
  catalog: {
    // Stores
    getStores: ({ name, status, page = 0, size = 20 } = {}) =>
      api
        .get("/admin/catalog/stores", { params: { name, status, page, size } })
        .then((r) => r.data.data),
    getStoreById: (id) =>
      api.get(`/admin/catalog/stores/${id}`).then((r) => r.data.data),
    createStore: (payload) =>
      api.post("/admin/catalog/stores", payload).then((r) => r.data.data),
    updateStore: (id, payload) =>
      api.put(`/admin/catalog/stores/${id}`, payload).then((r) => r.data.data),
    updateStoreStatus: (id, status) =>
      api
        .patch(`/admin/catalog/stores/${id}/status`, null, { params: { status } })
        .then((r) => r.data.data),

    // Kitchens
    getKitchens: ({ name, status, page = 0, size = 20 } = {}) =>
      api
        .get("/admin/catalog/kitchens", { params: { name, status, page, size } })
        .then((r) => r.data.data),
    getKitchenById: (id) =>
      api.get(`/admin/catalog/kitchens/${id}`).then((r) => r.data.data),
    createKitchen: (payload) =>
      api.post("/admin/catalog/kitchens", payload).then((r) => r.data.data),
    updateKitchen: (id, payload) =>
      api.put(`/admin/catalog/kitchens/${id}`, payload).then((r) => r.data.data),
    updateKitchenStatus: (id, status) =>
      api
        .patch(`/admin/catalog/kitchens/${id}/status`, null, {
          params: { status },
        })
        .then((r) => r.data.data),
  },

  // ── System Config ──────────────────────────────────────────────────────────
  systemConfig: {
    getPriorities: () =>
      api.get("/admin/system-config/order-priority").then((r) => r.data.data),
    createPriority: (payload) =>
      api
        .post("/admin/system-config/order-priority", payload)
        .then((r) => r.data.data),
    updatePriority: (id, payload) =>
      api
        .put(`/admin/system-config/order-priority/${id}`, payload)
        .then((r) => r.data.data),
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  reports: {
    getSystemOverview: (fromDate, toDate) =>
      api
        .get("/admin/reports/system-overview", { params: { fromDate, toDate } })
        .then((r) => r.data.data),
  },
};

export default adminService;
