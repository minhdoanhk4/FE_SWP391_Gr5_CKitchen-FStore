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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import shipperService from "../services/shipperService";

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

const STATUS_LABEL = {
  SHIPPING: "Đang giao",
  WAITING_CONFIRM: "Chờ cửa hàng xác nhận",
  DELIVERED: "Đã giao",
};

const STATUS_COLOR = {
  SHIPPING: "#FF6B35",
  WAITING_CONFIRM: "#2196F3",
  DELIVERED: "#4CAF50",
};

export default function ActiveDeliveriesScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mark success modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async (isRefresh = false) => {
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
      fetch();
    }, [fetch]),
  );

  const openMarkSuccess = (item) => {
    setSelectedDelivery(item);
    setNotes("");
    setModalVisible(true);
  };

  const handleMarkSuccess = async () => {
    if (!selectedDelivery?.deliveryId && !selectedDelivery?.id) return;
    const deliveryId = selectedDelivery.deliveryId || selectedDelivery.id;
    setSubmitting(true);
    try {
      await shipperService.markSuccess(deliveryId, notes);
      setModalVisible(false);
      Alert.alert("✅ Thành công", "Đã báo giao hàng. Chờ cửa hàng xác nhận.");
      fetch();
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const canMarkSuccess = item.deliveryStatus === "SHIPPING";
    const statusColor = STATUS_COLOR[item.deliveryStatus] || "#888";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>{item.id || item.orderId}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABEL[item.deliveryStatus] ||
                item.deliveryStatus ||
                "Đang giao"}
            </Text>
          </View>
        </View>

        {item.deliveryId && (
          <Text style={styles.meta}>🆔 Mã vận đơn: {item.deliveryId}</Text>
        )}
        <Text style={styles.storeName}>🏪 {item.storeName || "—"}</Text>
        {item.pickedUpAt && (
          <Text style={styles.meta}>
            ⏰ Nhận lúc: {formatDateTime(item.pickedUpAt)}
          </Text>
        )}

        {canMarkSuccess && (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => openMarkSuccess(item)}
          >
            <Text style={styles.doneBtnText}>✅ Đã giao hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn đang giao</Text>
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
            <Text style={styles.empty}>Không có đơn nào đang giao</Text>
          }
        />
      )}

      {/* Mark success modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận đã giao hàng</Text>
            <Text style={styles.modalSub}>
              Đơn: {selectedDelivery?.id || selectedDelivery?.orderId}
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Ghi chú (tùy chọn)"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.btnDisabled]}
                onPress={handleMarkSuccess}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#FF6B35",
    padding: 16,
    paddingTop: 52,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  list: { padding: 16 },
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
  orderId: { fontSize: 15, fontWeight: "700", color: "#333" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  storeName: { fontSize: 14, color: "#333", marginBottom: 4 },
  meta: { fontSize: 13, color: "#666", marginBottom: 2 },
  doneBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", fontSize: 14, marginTop: 60 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  modalSub: { fontSize: 13, color: "#666", marginBottom: 16 },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#555", fontWeight: "600" },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
