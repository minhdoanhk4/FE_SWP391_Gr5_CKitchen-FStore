import api from "../api/axiosConfig";

const kitchenService = {
  // ── Overview / Dashboard ──────────────────────────────────────────────────
  getOverview: ({ fromDate, toDate } = {}) =>
    api
      .get("/central-kitchen/overview", { params: { fromDate, toDate } })
      .then((r) => r.data.data),

  // ── My Kitchen ────────────────────────────────────────────────────────────
  getMyKitchen: () =>
    api.get("/central-kitchen/my-kitchen").then((r) => r.data.data),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: ({ status, storeId, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/orders", { params: { status, storeId, page, size } })
      .then((r) => r.data.data),

  getOrderById: (orderId) =>
    api.get(`/central-kitchen/orders/${orderId}`).then((r) => r.data.data),

  assignOrder: (orderId) =>
    api.patch(`/central-kitchen/orders/${orderId}/assign`).then((r) => r.data.data),

  updateOrderStatus: (orderId, { status, notes }) =>
    api
      .patch(`/central-kitchen/orders/${orderId}/status`, { status, notes })
      .then((r) => r.data.data),

  getOrderStatuses: () =>
    api.get("/central-kitchen/order-statuses").then((r) => r.data.data),

  // ── Production Plans ──────────────────────────────────────────────────────
  getProductionPlans: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/production-plans", { params: { page, size } })
      .then((r) => r.data.data),

  createProductionPlan: ({ productId, quantity, startDate, endDate, notes }) =>
    api
      .post("/central-kitchen/production-plans", {
        productId,
        quantity,
        startDate,
        endDate,
        notes,
      })
      .then((r) => r.data.data),

  // ── Inventory ─────────────────────────────────────────────────────────────
  getInventory: ({ ingredientId, ingredientName, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/inventory", {
        params: { ingredientId, ingredientName, page, size },
      })
      .then((r) => r.data.data),

  // ── Stores ────────────────────────────────────────────────────────────────
  getStores: ({ name, status, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/stores", { params: { name, status, page, size } })
      .then((r) => r.data.data),
};

export default kitchenService;
