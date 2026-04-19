import api from "../api/axiosConfig";

const PREFIX = "/central-kitchen";

const kitchenService = {
  // ── Overview / Dashboard ──────────────────────────────────────────────────
  getOverview: ({ fromDate, toDate } = {}) =>
    api
      .get(`${PREFIX}/overview`, { params: { fromDate, toDate } })
      .then((r) => r.data.data),

  // ── My Kitchen ────────────────────────────────────────────────────────────
  getMyKitchen: () =>
    api.get(`${PREFIX}/my-kitchen`).then((r) => r.data.data),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: ({ status, storeId, page = 0, size = 20 } = {}) =>
    api
      .get(`${PREFIX}/orders`, { params: { status, storeId, page, size } })
      .then((r) => r.data.data),

  getOrderById: (orderId) =>
    api.get(`${PREFIX}/orders/${orderId}`).then((r) => r.data.data),

  assignOrder: (orderId) =>
    api.patch(`${PREFIX}/orders/${orderId}/assign`).then((r) => r.data.data),

  updateOrderStatus: (orderId, { status, notes }) =>
    api
      .patch(`${PREFIX}/orders/${orderId}/status`, { status, notes })
      .then((r) => r.data.data),

  getOrderStatuses: () =>
    api.get(`${PREFIX}/order-statuses`).then((r) => r.data.data),

  // ── Production Plans ──────────────────────────────────────────────────────
  getProductionPlans: ({ page = 0, size = 20 } = {}) =>
    api
      .get(`${PREFIX}/production-plans`, { params: { page, size } })
      .then((r) => r.data.data),

  createProductionPlan: ({ productId, quantity, startDate, endDate, notes }) =>
    api
      .post(`${PREFIX}/production-plans`, {
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
      .get(`${PREFIX}/inventory`, {
        params: { ingredientId, ingredientName, page, size },
      })
      .then((r) => r.data.data),

  // ── Stores ────────────────────────────────────────────────────────────────
  getStores: ({ name, status, page = 0, size = 20 } = {}) =>
    api
      .get(`${PREFIX}/stores`, { params: { name, status, page, size } })
      .then((r) => r.data.data),
};

export default kitchenService;
