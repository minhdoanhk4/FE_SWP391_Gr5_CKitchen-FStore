import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import shipperService from "../services/shipperService";
import T from "../theme";

function formatDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_META = {
  SHIPPING: { label: "Đang giao", color: T.colors.accent, dot: "🟠" },
  WAITING_CONFIRM: { label: "Chờ xác nhận", color: T.colors.info, dot: "🔵" },
  DELIVERED: { label: "Đã giao", color: T.colors.success, dot: "🟢" },
  CANCELLED: { label: "Đã hủy", color: T.colors.textMuted, dot: "⚪" },
  FAILED: { label: "Giao thất bại", color: T.colors.textMuted, dot: "🔴" },
};

export default function ActiveDeliveriesScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await shipperService.getMyActiveOrders();
      setOrders(data?.content ?? data ?? []);
    } catch {
      Alert.alert("Lỗi", "Không thể tải danh sách đơn đang giao");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openConfirm = (item) => {
    setSelectedDelivery(item);
    setNotes("");
    setModalVisible(true);
  };

  const handleMarkSuccess = async () => {
    const deliveryId = selectedDelivery?.id;
    if (!deliveryId) return;
    setSubmitting(true);
    try {
      await shipperService.markSuccess(deliveryId, notes);
      setModalVisible(false);
      Alert.alert("Giao hàng thành công", "Đang chờ cửa hàng xác nhận.");
      load();
    } catch (err) {
      Alert.alert("Lỗi", err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const meta = STATUS_META[item.status] ?? {
      label: item.status,
      color: T.colors.textMuted,
      dot: "⚪",
    };
    const canMarkSuccess = item.status === "SHIPPING";

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: meta.color + "18",
                  borderColor: meta.color + "40",
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: meta.color }]}>
                {meta.dot} {meta.label}
              </Text>
            </View>
          </View>

          {/* Delivery ID */}
          {item.id && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>{""}</Text>
              <Text style={styles.metaText}>Vận đơn: {item.id}</Text>
            </View>
          )}

          {/* Store */}
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>{""}</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.storeName || "-"}
            </Text>
          </View>

          {/* Pickup time */}
          {item.pickedUpAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>{""}</Text>
              <Text style={styles.metaText}>
                Nhận lúc: {formatDateTime(item.pickedUpAt)}
              </Text>
            </View>
          )}

          {/* Divider + CTA */}
          {canMarkSuccess && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => openConfirm(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>✅ Xác nhận đã giao hàng</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={T.colors.primaryDark}
      />

      <View style={styles.header}>
        <Text style={styles.headerLabel}>CKITCHEN SHIPPER</Text>
        <Text style={styles.headerTitle}>Đơn đang giao</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.colors.primary} />
          <Text style={styles.loadingText}>Đang tải…</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) =>
            item.id || String(item.orderId)
          }
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
              <Text style={styles.emptyTitle}>Không có đơn nào đang giao</Text>
              <Text style={styles.emptySub}>Quét QR để nhận đơn mới</Text>
            </View>
          }
        />
      )}

      {/* Bottom-sheet confirm modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => !submitting && setModalVisible(false)}
          />
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Xác nhận đã giao hàng</Text>
            <Text style={styles.sheetSub}>
              Đơn hàng:{" "}
              <Text style={{ fontWeight: "700", color: T.colors.textDark }}>
                #{selectedDelivery?.orderId}
              </Text>
            </Text>

            <TextInput
              style={styles.notesInput}
              placeholder="Ghi chú giao hàng (tùy chọn)…"
              placeholderTextColor={T.colors.textMuted}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={handleMarkSuccess}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  ✅ Xác nhận giao thành công
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },

  // List
  list: { padding: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: T.radius.lg,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    ...T.shadows.card,
  },
  cardAccent: { width: 5 },
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
  badge: {
    borderRadius: T.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  metaIcon: { fontSize: 13, marginRight: 8, width: 18 },
  metaText: { fontSize: 13, color: T.colors.textMid, flex: 1 },

  divider: {
    height: 1,
    backgroundColor: T.colors.surfaceBorder,
    marginVertical: 12,
  },
  doneBtn: {
    backgroundColor: T.colors.accent,
    borderRadius: T.radius.md,
    padding: 13,
    alignItems: "center",
    ...T.shadows.fab,
  },
  doneBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

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

  // Modal
  overlay: { flex: 1, justifyContent: "flex-end" },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,67,50,0.45)",
  },
  sheet: {
    backgroundColor: T.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    ...T.shadows.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.colors.surfaceBorder,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.colors.textDark,
    marginBottom: 4,
  },
  sheetSub: { fontSize: 13, color: T.colors.textMuted, marginBottom: 18 },
  notesInput: {
    borderWidth: 1.5,
    borderColor: T.colors.surfaceBorder,
    borderRadius: T.radius.md,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    color: T.colors.textDark,
    marginBottom: 16,
    minHeight: 80,
  },
  confirmBtn: {
    backgroundColor: T.colors.accent,
    borderRadius: T.radius.lg,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
    ...T.shadows.fab,
  },
  confirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: T.colors.surfaceBorder,
    borderRadius: T.radius.lg,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: T.colors.textMid, fontWeight: "600", fontSize: 14 },
});
