import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import T from "../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    animatePress();
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Kiểm tra lại thông tin.";
      Alert.alert("Đăng nhập thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={T.colors.primaryDark} />

      {/* Top hero section */}
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Text style={styles.logoEmoji}>🚚</Text>
        </View>
        <Text style={styles.appName}>CKitchen Shipper</Text>
        <Text style={styles.appTagline}>Nền tảng giao hàng thông minh</Text>
        {/* Decorative dots */}
        <View style={styles.decorRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Bottom sheet card */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Đăng nhập</Text>
        <Text style={styles.sheetSub}>Chào mừng bạn trở lại!</Text>

        {/* Username */}
        <View style={[styles.inputRow, focusedField === "user" && styles.inputRowFocused]}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Tên đăng nhập"
            placeholderTextColor={T.colors.textMuted}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setFocusedField("user")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Password */}
        <View style={[styles.inputRow, focusedField === "pass" && styles.inputRowFocused]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Mật khẩu"
            placeholderTextColor={T.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("pass")}
            onBlur={() => setFocusedField(null)}
            onSubmitEditing={handleLogin}
          />
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Đăng nhập  →</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>CKitchen Chain · Phiên bản 1.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.primaryDark },

  // Hero
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  decorRow: { flexDirection: "row", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: T.colors.accentLight, width: 18 },

  // Sheet
  sheet: {
    backgroundColor: T.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    ...T.shadows.card,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.colors.textDark,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    color: T.colors.textMuted,
    marginBottom: 28,
  },

  // Inputs
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: T.radius.md,
    borderWidth: 1.5,
    borderColor: T.colors.surfaceBorder,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputRowFocused: { borderColor: T.colors.primary },
  inputIcon: { fontSize: 16, marginRight: 10 },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: T.colors.textDark,
  },

  // Button
  btn: {
    backgroundColor: T.colors.accent,
    borderRadius: T.radius.lg,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
    ...T.shadows.fab,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },

  footerText: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 11,
    color: T.colors.textMuted,
    letterSpacing: 0.3,
  },
});
