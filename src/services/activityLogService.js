import api from "../api/axiosConfig";

const activityLogService = {
  getAll: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/user-activity-logs", { params: { page, size } })
      .then((r) => r.data.data),

  getByUserId: (userId, { page = 0, size = 20 } = {}) =>
    api
      .get(`/user-activity-logs/user/${userId}`, { params: { page, size } })
      .then((r) => r.data.data),

  getByType: (actionType, { page = 0, size = 20 } = {}) =>
    api
      .get(`/user-activity-logs/type/${actionType}`, { params: { page, size } })
      .then((r) => r.data.data),

  getByDateRange: (startDate, endDate, { page = 0, size = 20 } = {}) =>
    api
      .get("/user-activity-logs/date-range", {
        params: { startDate, endDate, page, size },
      })
      .then((r) => r.data.data),

  getMyLoginHistory: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/user-activity-logs/my-login-history", { params: { page, size } })
      .then((r) => r.data.data),

  delete: (id) => api.delete(`/user-activity-logs/${id}`).then((r) => r.data),
};

export default activityLogService;
