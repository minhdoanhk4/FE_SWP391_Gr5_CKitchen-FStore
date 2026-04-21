import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import shipperService from "../services/shipperService";

export default function ScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const lastScan = useRef(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>Cần quyền truy cập camera</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Cấp quyền</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    // Debounce: ignore re-scans within 3 seconds
    if (scanning || lastScan.current === data) return;
    lastScan.current = data;
    setScanning(true);

    try {
      const result = await shipperService.scanQr(data);
      Alert.alert(
        "✅ Nhận đơn thành công",
        `Đơn ${result?.orderId || ""}  đã được tiếp nhận.\nMã vận đơn: ${result?.deliveryId || ""}`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Quét QR thất bại";
      const alreadyClaimed = msg.toLowerCase().includes("claimed");
      Alert.alert(alreadyClaimed ? "⚠️ Đơn đã có người nhận" : "❌ Lỗi", msg, [
        {
          text: "Đóng",
          onPress: () => {
            lastScan.current = null;
            setScanning(false);
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Quét mã QR trên thùng hàng</Text>
        <View style={styles.frame} />
        {scanning && (
          <ActivityIndicator
            color="#fff"
            size="large"
            style={{ marginTop: 24 }}
          />
        )}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 32,
    textShadowColor: "#000",
    textShadowRadius: 4,
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FF6B35",
  },
  cancelBtn: {
    marginTop: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  cancelBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  permText: { color: "#fff", fontSize: 16, textAlign: "center", padding: 24 },
  permBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 40,
    alignItems: "center",
  },
  permBtnText: { color: "#fff", fontWeight: "700" },
  cancelText: { color: "#aaa", textAlign: "center", marginTop: 16 },
});
