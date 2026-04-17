import api from "../api/axiosConfig";

const authService = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (credentials) =>
    api.post("/login", credentials).then((r) => {
      const { token, refreshToken } = r.data.data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refreshToken);
      return r.data.data;
    }),

  register: (payload) => api.post("/register", payload).then((r) => r.data),

  logout: () =>
    api.post("/session/logout").then((r) => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return r.data;
    }),

  logoutAll: () =>
    api.post("/session/logout-all").then((r) => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return r.data;
    }),

  googleLogin: (idToken) =>
    api.post("/google-login", { idToken }).then((r) => {
      const { token, refreshToken } = r.data.data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refreshToken);
      return r.data.data;
    }),

  facebookLogin: (accessToken) =>
    api.post("/facebook-login", { accessToken }).then((r) => {
      const { token, refreshToken } = r.data.data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refreshToken);
      return r.data.data;
    }),

  getMe: () => api.get("/admin/users/me").then((r) => r.data.data),

  // ── OTP / Email ───────────────────────────────────────────────────────────
  sendVerification: (email) =>
    api.post("/email/send-verification", { email }).then((r) => r.data),

  verifyEmail: (email, otp) =>
    api.post("/email/verify", { email, otp }).then((r) => r.data),

  forgotPassword: (email) =>
    api.post("/email/forgot-password", { email }).then((r) => r.data),

  resetPassword: (payload) =>
    api.post("/email/reset-password", payload).then((r) => r.data),

  resendOtp: (email) =>
    api.post("/email/resend", { email }).then((r) => r.data),
};

export default authService;
