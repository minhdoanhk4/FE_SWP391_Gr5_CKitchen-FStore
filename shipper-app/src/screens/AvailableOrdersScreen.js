import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import shipperService from "../services/shipperService";
import T from "../theme";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AvailableOrdersScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState(null);

  const loadingRef = useRef(false);

  const getCoords = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setCoords(c);
      return c;
    } catch {
      return null;
    }
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const c = coords ?? (await getCoords());
        const data = await shipperService.getAvailableOrders(c ?? {});
        setOrders(data?.content ?? data ?? []);
      } catch (err) {
        console.error(err);
        Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coords, getCoords],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id || item.orderId}</Text>
          <View style={styles.badgeRow}>
            {item.distance != null && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>
                  📍 {Number(item.distance).toFixed(1)} km
                </Text>
              </View>
            )}
            <View style={styles.waitBadge}>
              <Text style={styles.waitBadgeText}>● Chờ nhận</Text>
            </View>
          </View>
        </View>

        {/* Store */}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>{""}</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {item.storeName || "-"}
          </Text>
        </View>

        {/* Date */}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>{""}</Text>
          <Text style={styles.metaText}>
            Yêu cầu giao: {formatDate(item.requestedDate)}
          </Text>
        </View>

        {/* Item chips */}
        {item.items?.length > 0 && (
          <View style={styles.chipsRow}>
            {item.items.slice(0, 3).map((i, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {i.productName} x{i.quantity}
                </Text>
              </View>
            ))}
            {item.items.length > 3 && (
              <View style={styles.chipMore}>
                <Text style={styles.chipMoreText}>
                  +{item.items.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={T.colors.primaryDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>CKITCHEN SHIPPER</Text>
          <Text style={styles.headerTitle}>Đơn chờ nhận</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutPill}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.colors.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng…</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[T.colors.primary]}
              tintColor={T.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{""}</Text>
              <Text style={styles.emptyTitle}>Không có đơn nào</Text>
              <Text style={styles.emptySub}>Kéo xuống để làm mới</Text>
            </View>
          }
        />
      )}

      {/* FAB - QR Scanner */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Scanner")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>{""}</Text>
        <Text style={styles.fabText}>Quét QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.background },

  // Header
  header: {
    backgroundColor: T.colors.primaryDark,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  logoutPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: T.radius.full,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  logoutText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },

  // List
  list: { padding: 16, paddingBottom: 110 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: T.radius.lg,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    ...T.shadows.card,
  },
  cardAccent: {
    width: 5,
    backgroundColor: T.colors.primary,
  },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: T.colors.textDark,
    letterSpacing: 0.3,
  },
  waitBadge: {
    backgroundColor: T.colors.primaryBg,
    borderRadius: T.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: T.colors.primaryLighter,
  },
  waitBadgeText: { color: T.colors.primary, fontSize: 11, fontWeight: "700" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distanceBadge: {
    backgroundColor: T.colors.accentBg,
    borderRadius: T.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(231,111,81,0.22)",
  },
  distanceBadgeText: {
    color: T.colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  metaIcon: { fontSize: 13, marginRight: 8, width: 18 },
  metaText: { fontSize: 13, color: T.colors.textMid, flex: 1 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: T.colors.accentBg,
    borderRadius: T.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(231,111,81,0.22)",
    maxWidth: 160,
  },
  chipText: { fontSize: 11, color: T.colors.accent, fontWeight: "600" },
  chipMore: {
    backgroundColor: T.colors.surfaceBorder,
    borderRadius: T.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipMoreText: { fontSize: 11, color: T.colors.textMuted, fontWeight: "600" },

  // States
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: T.colors.textMuted, marginTop: 12, fontSize: 13 },
  emptyWrap: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.colors.textDark,
    marginBottom: 6,
  },
  emptySub: { fontSize: 13, color: T.colors.textMuted, textAlign: "center" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: T.colors.accent,
    borderRadius: T.radius.full,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...T.shadows.fab,
  },
  fabIcon: { fontSize: 16 },
  fabText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
