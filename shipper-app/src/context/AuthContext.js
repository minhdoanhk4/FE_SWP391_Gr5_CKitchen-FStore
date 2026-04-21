import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { loadTokens, saveTokens, clearTokens } from "../api/axiosConfig";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://swp391-ckitchen.up.railway.app";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      await loadTokens();
      const saved = await AsyncStorage.getItem("shipper_user");
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
    })();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${BASE_URL}/api/login`, {
      username,
      password,
    });
    const { token, refreshToken, ...userData } = res.data.data;
    await saveTokens(token, refreshToken);
    await AsyncStorage.setItem("shipper_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await clearTokens();
    await AsyncStorage.removeItem("shipper_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
