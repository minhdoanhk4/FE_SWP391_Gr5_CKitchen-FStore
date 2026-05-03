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
      .get("/central-kitchen/orders", {
        params: { status, storeId, page, size },
      })
      .then((r) => r.data.data),

  getOrderById: (orderId) =>
    api.get(`/central-kitchen/orders/${orderId}`).then((r) => r.data.data),

  assignOrder: (orderId) =>
    api
      .patch(`/central-kitchen/orders/${orderId}/assign`)
      .then((r) => r.data.data),

  updateOrderStatus: (orderId, { status, notes }) =>
    api
      .patch(`/central-kitchen/orders/${orderId}/status`, { status, notes })
      .then((r) => r.data.data),

  getOrderStatuses: () =>
    api.get("/central-kitchen/order-statuses").then((r) => r.data.data),

  // ── Products (for production planning) ───────────────────────────────────
  getProducts: ({ search, category, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/products", {
        params: { search, category, page, size },
      })
      .then((r) => r.data.data),

  recipeCheck: (productId, quantity) =>
    api
      .get(`/central-kitchen/products/${productId}/recipe-check`, {
        params: { quantity },
      })
      .then((r) => r.data.data),

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

  startProductionPlan: (planId) =>
    api
      .patch(`/central-kitchen/production-plans/${planId}/start`)
      .then((r) => r.data.data),

  completeProductionPlan: (planId, { expiryDate, notes }) =>
    api
      .patch(`/central-kitchen/production-plans/${planId}/complete`, {
        expiryDate,
        notes,
      })
      .then((r) => r.data.data),

  cancelProductionPlan: (planId, notes = "") =>
    api
      .patch(`/central-kitchen/production-plans/${planId}/cancel`, { notes })
      .then((r) => r.data.data),

  // ── Ingredient Inventory & Batches ────────────────────────────────────────
  getInventory: ({
    ingredientId,
    ingredientName,
    lowStock,
    page = 0,
    size = 20,
  } = {}) =>
    api
      .get("/central-kitchen/inventory", {
        params: { ingredientId, ingredientName, lowStock, page, size },
      })
      .then((r) => r.data.data),

  getIngredientBatches: ({
    ingredientId,
    ingredientName,
    status,
    page = 0,
    size = 20,
  } = {}) =>
    api
      .get("/central-kitchen/ingredient-batches", {
        params: { ingredientId, ingredientName, status, page, size },
      })
      .then((r) => r.data.data),

  createIngredientBatch: ({
    ingredientId,
    batchNo,
    quantity,
    expiryDate,
    supplier,
    importPrice,
  }) =>
    api
      .post("/central-kitchen/ingredient-batches", {
        ingredientId,
        batchNo,
        quantity,
        expiryDate,
        supplier,
        importPrice,
      })
      .then((r) => r.data.data),

  getIngredientBatchById: (id) =>
    api
      .get(`/central-kitchen/ingredient-batches/${id}`)
      .then((r) => r.data.data),

  // ── Product Inventory & Batches ───────────────────────────────────────────
  getProductInventory: ({ productId, productName, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/inventory/products", {
        params: { productId, productName, page, size },
      })
      .then((r) => r.data.data),

  getProductBatches: ({ productId, status, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/product-batches", {
        params: { productId, status, page, size },
      })
      .then((r) => r.data.data),

  getProductBatchById: (batchId) =>
    api
      .get(`/central-kitchen/product-batches/${batchId}`)
      .then((r) => r.data.data),

  updateProductBatch: (batchId, { expiryDate, status, notes }) =>
    api
      .patch(`/central-kitchen/product-batches/${batchId}`, {
        expiryDate,
        status,
        notes,
      })
      .then((r) => r.data.data),

  // ── Stores ────────────────────────────────────────────────────────────────
  getStores: ({ name, status, page = 0, size = 20 } = {}) =>
    api
      .get("/central-kitchen/stores", { params: { name, status, page, size } })
      .then((r) => r.data.data),
};

export default kitchenService;
