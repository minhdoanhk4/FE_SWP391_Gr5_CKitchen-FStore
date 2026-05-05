// ── Formatters ────────────────────────────────────────────────────────────────

export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Expiry Helpers ────────────────────────────────────────────────────────────

export function isExpiringSoon(dateStr, daysThreshold = 2) {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < daysThreshold * 86400000;
}

export function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Status Labels & Colors ────────────────────────────────────────────────────

export const STATUS_LABELS = {
  pending: "Chờ xử lý",
  assigned: "Đã xác nhận",
  in_progress: "Đang sản xuất",
  packed_waiting_shipper: "Sẵn sàng giao",
  shipping: "Đang giao",
  waiting_confirm: "Chờ xác nhận",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export const STATUS_COLORS = {
  pending: "warning",
  assigned: "info",
  in_progress: "accent",
  packed_waiting_shipper: "primary",
  shipping: "info",
  waiting_confirm: "warning",
  delivered: "success",
  cancelled: "danger",
};

export const AUDIT_ACTION_LABELS = {
  // Authentication
  REGISTRATION: "Đăng ký",
  LOGIN_ATTEMPT: "Thử đăng nhập",
  LOGIN_SUCCESS: "Đăng nhập",
  LOGIN_FAILED: "Đăng nhập thất bại",
  LOGOUT: "Đăng xuất",
  // Security
  PASSWORD_CHANGE: "Đổi mật khẩu",
  TOKEN_REFRESH: "Làm mới token",
  OTP_VERIFICATION: "Xác minh OTP",
  EMAIL_VERIFICATION: "Xác minh email",
  // Profile
  PROFILE_UPDATE: "Cập nhật hồ sơ",
  PROFILE_VIEW: "Xem hồ sơ",
  // Admin
  ADMIN_ACTION: "Thao tác admin",
  // System
  SYSTEM_LOGIN: "Đăng nhập hệ thống",
  SYSTEM_LOGOUT: "Đăng xuất hệ thống",
  OTHER: "Khác",
};
