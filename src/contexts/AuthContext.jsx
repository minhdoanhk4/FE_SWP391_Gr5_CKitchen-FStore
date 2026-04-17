import { createContext, useContext, useReducer, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

const ROLES = {
  STORE_STAFF: "FRANCHISE_STORE_STAFF",
  KITCHEN_STAFF: "KITCHEN_STAFF",
  SUPPLY_COORDINATOR: "SUPPLY_COORDINATOR",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
};

const ROLE_INFO = {
  [ROLES.STORE_STAFF]: {
    label: "Nhân viên cửa hàng",
    path: "/store",
    color: "primary",
    description: "Quản lý đơn hàng và tồn kho cửa hàng",
  },
  [ROLES.KITCHEN_STAFF]: {
    label: "Nhân viên bếp trung tâm",
    path: "/kitchen",
    color: "accent",
    description: "Xử lý sản xuất và xuất kho",
  },
  [ROLES.SUPPLY_COORDINATOR]: {
    label: "Điều phối cung ứng",
    path: "/supply",
    color: "warning",
    description: "Tổng hợp và điều phối đơn hàng",
  },
  [ROLES.MANAGER]: {
    label: "Quản lý vận hành",
    path: "/manager",
    color: "info",
    description: "Giám sát hiệu suất toàn chuỗi",
  },
  [ROLES.ADMIN]: {
    label: "Quản trị hệ thống",
    path: "/admin",
    color: "neutral",
    description: "Quản lý người dùng và cấu hình",
  },
};

// Decode a JWT and return its payload (no verification)
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Extract role string from various API response shapes
function extractRole(data) {
  if (!data) return null;
  // Plain string field
  if (data.role) return data.role;
  if (data.roleName) return data.roleName;
  if (data.userRole) return data.userRole;
  // Array field — take first element
  if (Array.isArray(data.roles) && data.roles.length)
    return typeof data.roles[0] === "string" ? data.roles[0] : data.roles[0]?.name ?? data.roles[0]?.authority;
  // Spring Security authorities array: [{ authority: "ROLE_MANAGER" }]
  if (Array.isArray(data.authorities) && data.authorities.length)
    return typeof data.authorities[0] === "string" ? data.authorities[0] : data.authorities[0]?.authority;
  return null;
}

function normalizeRole(role) {
  if (!role) return null;
  // Strip "ROLE_" prefix if present (Spring Security style)
  return role.toString().toUpperCase().replace(/^ROLE_/, "");
}

const initialState = { user: null, isAuthenticated: false };

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload, isAuthenticated: true };
    case "LOGOUT":
      return { ...initialState };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState, () => {
    try {
      const saved = localStorage.getItem("ckitchen_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { user: parsed, isAuthenticated: true };
      }
    } catch {
      /* ignore */
    }
    return initialState;
  });

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem("ckitchen_auth", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("ckitchen_auth");
    }
  }, [state.isAuthenticated, state.user]);

  // Returns the user object on success, throws on failure
  const login = async (username, password) => {
    // Authenticate and store tokens
    const tokenData = await authService.login({ username, password });

    // Fetch full profile (role, name, etc.)
    let profile;
    try {
      profile = await authService.getMe();
    } catch {
      profile = tokenData;
    }

    // Debug: inspect what the API actually returns
    console.log("[auth] tokenData:", tokenData);
    console.log("[auth] profile:", profile);

    // Extract role from JWT payload (source of truth)
    const jwtPayload = parseJwt(tokenData.token);
    const role = normalizeRole(extractRole(jwtPayload));
    console.log("[auth] role:", role);

    if (!role) {
      console.warn("[auth] Could not determine role. jwtPayload:", jwtPayload);
    }

    const user = {
      id: profile.id ?? profile.userId ?? tokenData.id,
      name: profile.name ?? profile.fullName ?? profile.username ?? tokenData.name ?? username,
      email: profile.email ?? tokenData.email ?? null,
      role,
      avatar: profile.avatar ?? tokenData.avatar ?? null,
    };

    dispatch({ type: "LOGIN", payload: user });
    return user;
  };

  const logout = () => {
    // Clear local state immediately so UI redirects right away
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    dispatch({ type: "LOGOUT" });
    // Notify server in background — ignore result
    authService.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, ROLES, ROLE_INFO }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ROLES, ROLE_INFO };
