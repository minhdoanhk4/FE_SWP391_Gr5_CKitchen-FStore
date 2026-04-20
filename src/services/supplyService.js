import api from "../api/axiosConfig";

const supplyService = {
  // ── Overview / Dashboard ──────────────────────────────────────────────────
  getOverview: ({ fromDate, toDate } = {}) =>
    api
      .get("/supply-coordinator/overview", { params: { fromDate, toDate } })
      .then((r) => r.data.data),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: ({
    status,
    priority,
    storeId,
    kitchenId,
    fromDate,
    toDate,
    page = 0,
    size = 20,
  } = {}) =>
    api
      .get("/supply-coordinator/orders", {
        params: {
          status,
          priority,
          storeId,
          kitchenId,
          fromDate,
          toDate,
          page,
          size,
        },
      })
      .then((r) => r.data.data),

  getOrderById: (orderId) =>
    api.get(`/supply-coordinator/orders/${orderId}`).then((r) => r.data.data),

  assignKitchen: (orderId, { kitchenId, notes }) =>
    api
      .patch(`/supply-coordinator/orders/${orderId}/assign-kitchen`, {
        kitchenId,
        notes,
      })
      .then((r) => r.data.data),

  getOrderStatuses: () =>
    api.get("/supply-coordinator/order-statuses").then((r) => r.data.data),

  // ── Deliveries ────────────────────────────────────────────────────────────
  createDelivery: ({ orderId, status, assignedAt, notes }) =>
    api
      .post("/supply-coordinator/deliveries", {
        orderId,
        status,
        assignedAt,
        notes,
      })
      .then((r) => r.data.data),

  getDeliveries: ({ status, page = 0, size = 20 } = {}) =>
    api
      .get("/supply-coordinator/deliveries", { params: { status, page, size } })
      .then((r) => r.data.data),

  updateDeliveryStatus: (deliveryId, { status, notes }) =>
    api
      .patch(`/supply-coordinator/deliveries/${deliveryId}/status`, {
        status,
        notes,
      })
      .then((r) => r.data.data),

  getDeliveryStatuses: () =>
    api.get("/supply-coordinator/delivery-statuses").then((r) => r.data.data),

  // ── Issues ────────────────────────────────────────────────────────────────
  createIssue: (orderId, { issueType, description, cancelOrder }) =>
    api
      .post(`/supply-coordinator/orders/${orderId}/issues`, {
        issueType,
        description,
        cancelOrder,
      })
      .then((r) => r.data.data),
};

export default supplyService;
