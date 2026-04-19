import api from "../api/axiosConfig";

const storeService = {
  // ── Overview / My Store ───────────────────────────────────────────────────
  getOverview: () =>
    api.get("/store/overview").then((r) => r.data.data),

  getMyStore: () =>
    api.get("/store/my-store").then((r) => r.data.data),

  // ── Products (Catalog for Ordering) ───────────────────────────────────────
  getAvailableProducts: ({ name, category, page = 0, size = 20 } = {}) =>
    api
      .get("/store/products", { params: { name, category, page, size } })
      .then((r) => r.data.data),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: ({ status, page = 0, size = 20 } = {}) =>
    api
      .get("/store/orders", { params: { status, page, size } })
      .then((r) => r.data.data),

  getOrderById: (orderId) =>
    api.get(`/store/orders/${orderId}`).then((r) => r.data.data),

  getOrderTimeline: (orderId) =>
    api.get(`/store/orders/${orderId}/timeline`).then((r) => r.data.data),

  getOrderStatuses: () =>
    api.get("/store/orders/statuses").then((r) => r.data.data),

  createOrder: (data) =>
    api
      .post("/store/orders", data)
      .then((r) => r.data.data),

  // ── Deliveries & Receipt ──────────────────────────────────────────────────
  getDeliveries: ({ status, page = 0, size = 20 } = {}) =>
    api
      .get("/store/deliveries", { params: { status, page, size } })
      .then((r) => r.data.data),

  confirmReceipt: (deliveryId, data) =>
    api
      .post(`/store/deliveries/${deliveryId}/confirm`, data)
      .then((r) => r.data.data),

  // ── Inventory ─────────────────────────────────────────────────────────────
  getStoreInventory: ({ productId, productName, page = 0, size = 20 } = {}) =>
    api
      .get("/store/inventory", {
        params: { productId, productName, page, size },
      })
      .then((r) => r.data.data),
};

export default storeService;
