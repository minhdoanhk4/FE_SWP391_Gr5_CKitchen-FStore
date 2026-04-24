import api from "../api/axiosConfig";

const shipperService = {
  // Step 2: List orders available to pick up (PACKED_WAITING_SHIPPER)
  // Pass lat/lon to get backend distance-sorted results with `distance` field
  getAvailableOrders: ({ page = 0, size = 20, lat, lon } = {}) =>
    api
      .get("/shipper/orders/available", {
        params: {
          page,
          size,
          ...(lat != null && lon != null ? { lat, lon } : {}),
        },
      })
      .then((r) => r.data.data),

  // List deliveries currently held by this shipper (SHIPPING / WAITING_CONFIRM)
  // Pass lat/lon to get distance + storeLatitude/storeLongitude in response
  getMyActiveOrders: ({ page = 0, size = 20, lat, lon } = {}) =>
    api
      .get("/shipper/deliveries/my", {
        params: {
          page,
          size,
          ...(lat != null && lon != null ? { lat, lon } : {}),
        },
      })
      .then((r) => r.data.data),

  // Step 3: Scan QR to claim order
  scanQr: (qrCode) =>
    api
      .post("/shipper/deliveries/scan-qr", { qrCode })
      .then((r) => r.data.data),

  // Step 4: Mark delivery as delivered (moves to WAITING_CONFIRM)
  markSuccess: (deliveryId, notes) =>
    api
      .patch(`/shipper/deliveries/${deliveryId}/mark-success`, {
        notes: notes || undefined,
      })
      .then((r) => r.data.data),

  // Get full delivery details (items, timeline, notes)
  getDeliveryById: (deliveryId) =>
    api
      .get(`/shipper/deliveries/${deliveryId}`)
      .then((r) => r.data.data),

  // Check who holds an order
  getHolder: (orderId) =>
    api.get(`/shipper/orders/${orderId}/holder`).then((r) => r.data.data),
};

export default shipperService;
