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
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
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

function formatFullDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  const [coords, setCoords] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const c = coords ?? (await getCoords());
        const data = await shipperService.getMyActiveOrders(c ?? {});
        setOrders(data?.content ?? data ?? []);
      } catch {
        Alert.alert("Lỗi", "Không thể tải danh sách đơn đang giao");
      } finally {
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

  const openMaps = (item) => {
    const lat = item.storeLatitude;
    const lon = item.storeLongitude;
    if (!lat || !lon) {
      Alert.alert("Không có tọa độ", "Cửa hàng này chưa có vị trí GPS.");
      return;
    }
    const label = encodeURIComponent(item.storeName || "Cửa hàng");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${label}`;
    Linking.openURL(url).catch(() => Alert.alert("Lỗi", "Không thể mở bản đồ"));
  };

  const openDetail = async (item) => {
    setDetailItem(item); // show immediately with list data
    setDetailLoading(true);
    try {
      const fresh = await shipperService.getDeliveryById(item.id);
      setDetailItem(fresh);
    } catch {
      // keep list data — detail endpoint may not exist
    } finally {
      setDetailLoading(false);
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openDetail(item)}
        style={styles.card}
      >
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <View style={styles.badgeRow}>
              {item.distance != null && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>
                    📍 {Number(item.distance).toFixed(1)} km
                  </Text>
                </View>
              )}
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
          </View>

          {/* Delivery ID */}
          {item.id && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>Vận đơn: {item.id}</Text>
            </View>
          )}

          {/* Store */}
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🏪</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.storeName || "-"}
            </Text>
          </View>

          {/* Coordinator */}
          {item.coordinatorName && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>👔</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                ĐPV: {item.coordinatorName}
              </Text>
            </View>
          )}

          {/* Pickup time */}
          {item.pickedUpAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaText}>
                Nhận lúc: {formatDateTime(item.pickedUpAt)}
              </Text>
            </View>
          )}

          {/* Open Maps button (if coords available) */}
          {(item.storeLatitude || item.storeLongitude) && (
            <TouchableOpacity
              style={styles.mapsBtn}
              onPress={() => openMaps(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.mapsBtnText}>🗺️ Mở bản đồ</Text>
            </TouchableOpacity>
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
      </TouchableOpacity>
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
          keyExtractor={(item) => item.id || String(item.orderId)}
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
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Không có đơn nào đang giao</Text>
              <Text style={styles.emptySub}>Quét QR để nhận đơn mới</Text>
            </View>
          }
        />
      )}

      {/* ── Bottom-sheet confirm modal ──────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.overlayBg}
              onPress={() => !submitting && setModalVisible(false)}
            />
            <View style={styles.modalSheet}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Detail bottom sheet ─────────────────────────────────────────────── */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => setDetailItem(null)}
          />
          <View style={[styles.modalSheet, { maxHeight: "85%" }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Chi tiết vận đơn</Text>
            {detailItem && (
              <Text style={styles.sheetSub}>
                Đơn hàng:{" "}
                <Text style={{ fontWeight: "700", color: T.colors.textDark }}>
                  #{detailItem.orderId}
                </Text>
              </Text>
            )}

            {detailLoading && (
              <ActivityIndicator
                color={T.colors.primary}
                style={{ marginVertical: 16 }}
              />
            )}

            {detailItem && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ marginTop: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Status badge */}
                {detailItem.status && (
                  <View style={styles.statusRow}>
                    {(() => {
                      const meta = STATUS_META[detailItem.status] ?? {
                        label: detailItem.status,
                        color: T.colors.textMuted,
                        dot: "⚪",
                      };
                      return (
                        <View
                          style={[
                            styles.statusBadgeLg,
                            {
                              backgroundColor: meta.color + "14",
                              borderColor: meta.color + "40",
                            },
                          ]}
                        >
                          <Text
                            style={[styles.statusBadgeLgText, { color: meta.color }]}
                          >
                            {meta.dot} {meta.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* ── Delivery info section ─── */}
                <Text style={styles.detailSection}>Thông tin giao hàng</Text>
                {[
                  ["Vận đơn", detailItem.id],
                  ["Cửa hàng", detailItem.storeName],
                  ["Địa chỉ", detailItem.storeAddress],
                  [
                    "Khoảng cách",
                    detailItem.distance != null
                      ? `${Number(detailItem.distance).toFixed(1)} km`
                      : null,
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}

                {/* ── People section ─── */}
                <Text style={styles.detailSection}>Nhân sự</Text>
                {[
                  ["Điều phối viên", detailItem.coordinatorName],
                  ["Shipper", detailItem.shipperName],
                  ["Người nhận", detailItem.receiverName],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}
                {/* Show placeholder if no people info */}
                {!detailItem.coordinatorName &&
                  !detailItem.shipperName &&
                  !detailItem.receiverName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Chưa có thông tin nhân sự
                      </Text>
                    </View>
                  )}

                {/* ── Timeline section ─── */}
                <Text style={styles.detailSection}>Mốc thời gian</Text>
                {[
                  ["Tạo lúc", detailItem.createdAt],
                  ["Phân công", detailItem.assignedAt],
                  ["Nhận hàng", detailItem.pickedUpAt],
                  ["Giao hàng", detailItem.deliveredAt],
                  ["Cập nhật", detailItem.updatedAt],
                ]
                  .filter(([, v]) => v)
                  .map(([label, dateVal]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>
                        {formatFullDateTime(dateVal)}
                      </Text>
                    </View>
                  ))}

                {/* ── Quality check ─── */}
                {detailItem.temperatureOk != null && (
                  <>
                    <Text style={styles.detailSection}>Kiểm tra chất lượng</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nhiệt độ</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: detailItem.temperatureOk
                              ? T.colors.success
                              : T.colors.danger,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {detailItem.temperatureOk ? "✅ Đạt" : "❌ Không đạt"}
                      </Text>
                    </View>
                  </>
                )}

                {/* Items */}
                {detailItem.items?.length > 0 && (
                  <>
                    <Text style={styles.detailSection}>Sản phẩm</Text>
                    {detailItem.items.map((it, i) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {it.productName}
                        </Text>
                        <Text style={styles.itemQty}>x{it.quantity}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Notes */}
                {detailItem.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesBoxText}>
                      📝 {detailItem.notes}
                    </Text>
                  </View>
                )}

                {/* Spacer at bottom for safe scroll */}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 12 }]}
              onPress={() => setDetailItem(null)}
            >
              <Text style={styles.cancelBtnText}>Đóng</Text>
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

  divider: {
    height: 1,
    backgroundColor: T.colors.surfaceBorder,
    marginVertical: 12,
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: T.colors.primary,
    borderRadius: T.radius.md,
    paddingVertical: 8,
    marginTop: 10,
  },
  mapsBtnText: { color: T.colors.primary, fontWeight: "700", fontSize: 13 },
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

  // Modal / Sheets
  overlay: { flex: 1, justifyContent: "flex-end" },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,67,50,0.45)",
  },
  modalSheet: {
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

  // Detail sheet
  statusRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadgeLg: {
    borderRadius: T.radius.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1.5,
    alignSelf: "center",
  },
  statusBadgeLgText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  detailSection: {
    fontSize: 11,
    fontWeight: "700",
    color: T.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceBorder,
    gap: 12,
  },
  detailLabel: { fontSize: 13, color: T.colors.textMuted, flexShrink: 0 },
  detailValue: {
    fontSize: 13,
    color: T.colors.textDark,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceBorder,
  },
  itemName: { fontSize: 13, color: T.colors.textDark, flex: 1 },
  itemQty: {
    fontSize: 13,
    color: T.colors.accent,
    fontWeight: "700",
    marginLeft: 12,
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: T.colors.surfaceBorder,
    borderRadius: T.radius.md,
  },
  notesBoxText: { fontSize: 13, color: T.colors.textMid },
});
