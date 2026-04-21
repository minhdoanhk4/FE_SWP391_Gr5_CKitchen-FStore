import api from "../api/axiosConfig";

// ── helpers ──────────────────────────────────────────────────────────────────
const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

/**
 * Build a FormData from a plain object.
 * Arrays (e.g. images: FileList | File[]) are appended as multiple entries
 * under the same key so Spring can bind them as List<MultipartFile>.
 */
function toFormData(fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value == null) return;
    if (value instanceof FileList || Array.isArray(value)) {
      Array.from(value).forEach((v) => fd.append(key, v));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}

const managerService = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    getOverview: () =>
      api.get("/manager/dashboard/overview").then((r) => r.data.data),

    getKitchenLowStock: () =>
      api
        .get("/manager/dashboard/inventory/kitchen-low-stock")
        .then((r) => r.data.data),

    getStoreLowStock: () =>
      api
        .get("/manager/dashboard/inventory/store-low-stock")
        .then((r) => r.data.data),
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    getAll: ({ pageNum = 0, size = 20, search, category } = {}) =>
      api
        .get("/manager/products", {
          params: { page: pageNum, size, search, category },
        })
        .then((r) => r.data.data),

    getById: (id) =>
      api.get(`/manager/products/${id}`).then((r) => r.data.data),

    getCategories: () =>
      api.get("/manager/products/categories").then((r) => r.data.data),

    /**
     * @param {{ name, category, unit, price, cost, images?: FileList|File[] }} fields
     */
    create: (fields) =>
      api
        .post("/manager/products", toFormData(fields), MULTIPART)
        .then((r) => r.data.data),

    /**
     * @param {string} id
     * @param {{ name?, category?, unit?, price?, cost?, images?: FileList|File[] }} fields
     */
    update: (id, fields) =>
      api
        .put(`/manager/products/${id}`, toFormData(fields), MULTIPART)
        .then((r) => r.data.data),

    delete: (id) => api.delete(`/manager/products/${id}`).then((r) => r.data),

    // ── Images
    /** @param {FileList|File[]} files */
    addImages: (id, files) =>
      api
        .post(
          `/manager/products/${id}/images`,
          toFormData({ images: files }),
          MULTIPART,
        )
        .then((r) => r.data.data),

    /** @param {File} file */
    addImage: (id, file) =>
      api
        .post(
          `/manager/products/${id}/image`,
          toFormData({ image: file }),
          MULTIPART,
        )
        .then((r) => r.data.data),

    deleteImage: (id, imageUrl) =>
      api
        .delete(`/manager/products/${id}/images`, { params: { imageUrl } })
        .then((r) => r.data),
  },

  // ── Recipes ───────────────────────────────────────────────────────────────
  recipes: {
    getAll: ({ pageNum = 0, size = 20 } = {}) =>
      api
        .get("/manager/recipes", { params: { page: pageNum, size } })
        .then((r) => r.data.data),

    create: (payload) =>
      api.post("/manager/recipes", payload).then((r) => r.data.data),

    update: (id, payload) =>
      api.put(`/manager/recipes/${id}`, payload).then((r) => r.data.data),

    delete: (id) => api.delete(`/manager/recipes/${id}`).then((r) => r.data),
  },

  // ── Sales (Manager view) ──────────────────────────────────────────────────
  sales: {
    getDaily: ({ fromDate, toDate, storeId } = {}) =>
      api
        .get("/manager/sales/daily", { params: { fromDate, toDate, storeId } })
        .then((r) => r.data.data),

    getTotal: ({ fromDate, toDate, storeId } = {}) =>
      api
        .get("/manager/sales/total", { params: { fromDate, toDate, storeId } })
        .then((r) => r.data.data),

    getStores: () => api.get("/manager/sales/stores").then((r) => r.data.data),

    getKitchens: () =>
      api.get("/manager/sales/kitchens").then((r) => r.data.data),

    exportDaily: ({ fromDate, toDate, storeId } = {}) =>
      api
        .get("/manager/sales/daily/export", {
          params: { fromDate, toDate, storeId },
          responseType: "blob",
        })
        .then((r) => r.data),
  },
};

export default managerService;
