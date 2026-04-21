import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import shipperService from "../services/shipperService";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function AvailableOrdersScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await shipperService.getAvailableOrders();
      setOrders(data?.content ?? data ?? []);
    } catch {
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh list whenever screen comes into focus (e.g. after scanning)
  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{item.id || item.orderId}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Chờ nhận</Text>
        </View>
      </View>
      <Text style={styles.storeName}>🏪 {item.storeName || "—"}</Text>
      <Text style={styles.meta}>
        📅 Yêu cầu giao: {formatDate(item.requestedDate)}
      </Text>
      {item.items?.length > 0 && (
        <Text style={styles.meta} numberOfLines={2}>
          📦{" "}
          {item.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn chờ nhận</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutBtn}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color="#FF6B35"
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id || item.orderId)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetch(true)}
              colors={["#FF6B35"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Không có đơn hàng nào đang chờ</Text>
          }
        />
      )}

      {/* Floating QR scan button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Text style={styles.fabText}>📷 Quét QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#FF6B35",
    padding: 16,
    paddingTop: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  logoutBtn: { color: "#fff", fontSize: 13, opacity: 0.9 },
  list: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderId: { fontSize: 15, fontWeight: "700", color: "#FF6B35" },
  badge: {
    backgroundColor: "#FFF3E0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },
  storeName: { fontSize: 14, color: "#333", marginBottom: 4 },
  meta: { fontSize: 13, color: "#666", marginBottom: 2 },
  empty: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 60,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#FF6B35",
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#FF6B35",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
