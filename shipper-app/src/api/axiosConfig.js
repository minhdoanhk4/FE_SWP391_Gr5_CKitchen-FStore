import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://swp391-ckitchen.up.railway.app";

// In-memory token cache so sync interceptors can read it
let _accessToken = null;
let _refreshToken = null;

export async function loadTokens() {
  _accessToken = await AsyncStorage.getItem("access_token");
  _refreshToken = await AsyncStorage.getItem("refresh_token");
}

export async function saveTokens(access, refresh) {
  _accessToken = access;
  _refreshToken = refresh;
  await AsyncStorage.setItem("access_token", access);
  await AsyncStorage.setItem("refresh_token", refresh);
}

export async function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  await AsyncStorage.removeItem("access_token");
  await AsyncStorage.removeItem("refresh_token");
}

// Navigation ref — set from AppNavigator so we can redirect on auth failure
export let navigationRef = null;
export function setNavigationRef(ref) {
  navigationRef = ref;
}

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach token synchronously from in-memory cache
api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;

      if (!_refreshToken) {
        isRefreshing = false;
        await clearTokens();
        navigationRef?.navigate("Login");
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/refresh-token`, {
          refreshToken: _refreshToken,
        });
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        await saveTokens(newAccess, newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        await clearTokens();
        navigationRef?.navigate("Login");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
