import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import shipperService from "../services/shipperService";
import T from "../theme";

// Corner tick helper — four L-shaped corners around the scan frame
function ScanCorner({ position }) {
  const base = {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: T.colors.primaryLighter,
    borderWidth: 3,
  };
  const corners = {
    topLeft:     { top: 0,    left: 0,    borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
    topRight:    { top: 0,    right: 0,   borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 6 },
    bottomLeft:  { bottom: 0, left: 0,    borderRightWidth: 0, borderTopWidth: 0,    borderBottomLeftRadius: 6 },
    bottomRight: { bottom: 0, right: 0,   borderLeftWidth: 0,  borderTopWidth: 0,    borderBottomRightRadius: 6 },
  };
  return <View style={[base, corners[position]]} />;
}

export default function ScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [scanMessage, setScanMessage] = useState("");
  const lastScan = useRef(null);

  // Pulse animation for the scan frame
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permWrap}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Cần quyền truy cập camera</Text>
          <Text style={styles.permSub}>
            Ứng dụng cần camera để quét mã QR trên thùng hàng
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Cấp quyền camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permCancel} onPress={() => navigation.goBack()}>
            <Text style={styles.permCancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanning || lastScan.current === data) return;
    lastScan.current = data;
    setScanning(true);

    try {
      const result = await shipperService.scanQr(data);
      setScanResult("success");
      setScanMessage(
        `Đơn #${result?.orderId || ""} đã tiếp nhận\nMã vận đơn: ${result?.deliveryId || ""}`
      );
      setTimeout(() => navigation.goBack(), 2200);
    } catch (err) {
      const msg = err.response?.data?.message || "Quét QR thất bại";
      const alreadyClaimed = msg.toLowerCase().includes("claimed");
      setScanResult("error");
      setScanMessage(alreadyClaimed ? "⚠️ Đơn này đã có người nhận" : msg);
      // Allow retry after 2.5s
      setTimeout(() => {
        setScanResult(null);
        setScanMessage("");
        lastScan.current = null;
        setScanning(false);
      }, 2500);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
      />

      {/* Dark frosted overlay */}
      <View style={styles.overlay}>
        {/* Top instruction */}
        <View style={styles.instructionWrap}>
          <Text style={styles.instructionTitle}>Quét mã QR</Text>
          <Text style={styles.instructionSub}>
            Đặt mã QR trên thùng hàng vào khung bên dưới
          </Text>
        </View>

        {/* Scan frame */}
        <Animated.View style={[styles.frameOuter, { transform: [{ scale: pulse }] }]}>
          <View style={styles.frame}>
            <ScanCorner position="topLeft" />
            <ScanCorner position="topRight" />
            <ScanCorner position="bottomLeft" />
            <ScanCorner position="bottomRight" />
            {/* Scan line hint */}
            <View style={styles.scanLine} />
          </View>
        </Animated.View>

        {/* Status overlay (result toast) */}
        {scanResult && (
          <View style={[
            styles.resultBadge,
            scanResult === "success" ? styles.resultSuccess : styles.resultError,
          ]}>
            <Text style={styles.resultText}>
              {scanResult === "success" ? "✅ " : "❌ "}
              {scanMessage}
            </Text>
          </View>
        )}

        {/* Spinner while processing */}
        {scanning && !scanResult && (
          <View style={styles.processingWrap}>
            <ActivityIndicator color={T.colors.primaryLighter} size="large" />
            <Text style={styles.processingText}>Đang xử lý…</Text>
          </View>
        )}

        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>✕  Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Instruction
  instructionWrap: {
    alignItems: "center",
    marginBottom: 36,
    paddingHorizontal: 32,
  },
  instructionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  instructionSub: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  // Frame
  frameOuter: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(82,183,136,0.08)",
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 14,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: "48%",
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(82,183,136,0.55)",
  },

  // Result badge
  resultBadge: {
    marginTop: 28,
    borderRadius: T.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 22,
    maxWidth: 300,
  },
  resultSuccess: { backgroundColor: "rgba(22,163,74,0.85)" },
  resultError:   { backgroundColor: "rgba(220,38,38,0.85)" },
  resultText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Processing
  processingWrap: { alignItems: "center", marginTop: 28 },
  processingText: { color: "rgba(255,255,255,0.70)", marginTop: 10, fontSize: 13 },

  // Cancel
  cancelBtn: {
    position: "absolute",
    bottom: 52,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: T.radius.full,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  cancelBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  // Permission screen
  permWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  permEmoji: { fontSize: 56, marginBottom: 16 },
  permTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  permSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 28,
  },
  permBtn: {
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.lg,
    padding: 14,
    paddingHorizontal: 28,
    marginBottom: 12,
    ...T.shadows.primaryGlow,
  },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  permCancel: { padding: 12 },
  permCancelText: { color: "rgba(255,255,255,0.50)", fontSize: 14 },
});
