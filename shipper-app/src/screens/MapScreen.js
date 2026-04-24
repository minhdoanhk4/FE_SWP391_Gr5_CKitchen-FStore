import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import shipperService from "../services/shipperService";
import T from "../theme";

// Estimate travel time: city average ~25 km/h
function estimateMinutes(distanceKm) {
  if (distanceKm == null || distanceKm <= 0) return null;
  return Math.ceil((distanceKm / 25) * 60);
}

function formatMinutes(mins) {
  if (mins == null) return "";
  if (mins < 60) return `~${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h${m}p` : `~${h}h`;
}

const STATUS_META = {
  SHIPPING: { label: "Đang giao", color: "#e76f51" },
  WAITING_CONFIRM: { label: "Chờ xác nhận", color: "#457b9d" },
  DELIVERED: { label: "Đã giao", color: "#16a34a" },
};

export default function MapScreen() {
  const [deliveries, setDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [viewMode, setViewMode] = useState("active"); // "active" | "available"
  const webViewRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords = null;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
        setUserCoords(coords);
      }

      // Load both datasets in parallel
      const [active, available] = await Promise.allSettled([
        shipperService.getMyActiveOrders(coords ?? {}),
        shipperService.getAvailableOrders(coords ?? {}),
      ]);

      if (active.status === "fulfilled") {
        const data = active.value;
        setDeliveries(data?.content ?? data ?? []);
      }
      if (available.status === "fulfilled") {
        const data = available.value;
        setAvailableOrders(data?.content ?? data ?? []);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể tải dữ liệu bản đồ");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Build markers for the selected view
  const markers =
    viewMode === "active"
      ? deliveries
          .filter((d) => d.storeLatitude && d.storeLongitude)
          .map((d) => ({
            lat: d.storeLatitude,
            lon: d.storeLongitude,
            name: d.storeName || "Cửa hàng",
            address: d.storeAddress || "",
            orderId: d.orderId,
            distance: d.distance,
            status: d.status,
            color: STATUS_META[d.status]?.color || "#e76f51",
            label: STATUS_META[d.status]?.label || d.status,
          }))
      : availableOrders
          .filter((o) => o.storeLatitude && o.storeLongitude)
          .map((o) => ({
            lat: o.storeLatitude,
            lon: o.storeLongitude,
            name: o.storeName || "Cửa hàng",
            address: o.storeAddress || "",
            orderId: o.id || o.orderId,
            distance: o.distance,
            status: "AVAILABLE",
            color: "#2d6a4f",
            label: "Chờ nhận",
          }));

  const totalActive = deliveries.filter(
    (d) => d.storeLatitude && d.storeLongitude,
  ).length;
  const totalAvailable = availableOrders.filter(
    (o) => o.storeLatitude && o.storeLongitude,
  ).length;

  // Generate Leaflet HTML
  const mapHtml = generateMapHtml(userCoords, markers);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={T.colors.primaryDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>CKITCHEN SHIPPER</Text>
        <Text style={styles.headerTitle}>Bản đồ giao hàng</Text>
      </View>

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "active" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("active")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "active" && styles.toggleTextActive,
            ]}
          >
            🚚 Đang giao ({totalActive})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "available" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("available")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "available" && styles.toggleTextActive,
            ]}
          >
            📦 Chờ nhận ({totalAvailable})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.colors.primary} />
          <Text style={styles.loadingText}>Đang tải bản đồ…</Text>
        </View>
      ) : markers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>Không có điểm giao nào</Text>
          <Text style={styles.emptySub}>
            {viewMode === "active"
              ? "Bạn chưa có đơn đang giao"
              : "Không có đơn chờ nhận"}
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webview}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="small" color={T.colors.primary} />
              </View>
            )}
          />

          {/* Summary strip */}
          <View style={styles.summaryStrip}>
            <Text style={styles.summaryText}>
              📍 {markers.length} điểm giao
              {markers.some((m) => m.distance != null) && (
                <>
                  {" · "}Gần nhất:{" "}
                  {Number(
                    Math.min(
                      ...markers
                        .filter((m) => m.distance != null)
                        .map((m) => m.distance),
                    ),
                  ).toFixed(1)}{" "}
                  km
                </>
              )}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generate Leaflet HTML (OpenStreetMap — no API key needed)
// ═══════════════════════════════════════════════════════════════════════════════
function generateMapHtml(userCoords, markers) {
  // Default center: HCM City
  const center = userCoords
    ? { lat: userCoords.lat, lon: userCoords.lon }
    : markers.length > 0
      ? { lat: markers[0].lat, lon: markers[0].lon }
      : { lat: 10.7769, lon: 106.7009 };

  const markersJson = JSON.stringify(
    markers.map((m) => ({
      ...m,
      estTime: formatMinutes(estimateMinutes(m.distance)),
      distStr:
        m.distance != null ? `${Number(m.distance).toFixed(1)} km` : null,
    })),
  );

  const userJson = userCoords ? JSON.stringify(userCoords) : "null";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; }
    .popup-card {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-width: 200px;
    }
    .popup-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #264653;
      margin-bottom: 6px;
    }
    .popup-card .meta {
      font-size: 12px;
      color: #57534e;
      margin-bottom: 3px;
    }
    .popup-card .meta strong {
      color: #264653;
    }
    .popup-card .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 6px;
    }
    .popup-card .distance-row {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e8e0c8;
    }
    .popup-card .dist-item {
      text-align: center;
      flex: 1;
    }
    .popup-card .dist-value {
      font-size: 16px;
      font-weight: 800;
      color: #2d6a4f;
    }
    .popup-card .dist-label {
      font-size: 10px;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .user-marker {
      background: #2d6a4f;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      box-shadow: 0 0 0 4px rgba(45,106,79,0.25), 0 2px 8px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lon}], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    var markers = ${markersJson};
    var user = ${userJson};
    var bounds = [];

    // User location marker
    if (user) {
      var userIcon = L.divIcon({
        className: '',
        html: '<div class="user-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([user.lat, user.lon], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<div class="popup-card"><h3>📍 Vị trí của bạn</h3></div>');
      bounds.push([user.lat, user.lon]);
    }

    // Delivery markers
    markers.forEach(function(m, i) {
      var popupHtml = '<div class="popup-card">' +
        '<h3>🏪 ' + m.name + '</h3>' +
        (m.address ? '<div class="meta">' + m.address + '</div>' : '') +
        '<div class="meta">Đơn: <strong>#' + m.orderId + '</strong></div>' +
        '<div class="badge" style="background:' + m.color + '18;color:' + m.color + ';border:1px solid ' + m.color + '40">' + m.label + '</div>';
      
      if (m.distStr || m.estTime) {
        popupHtml += '<div class="distance-row">';
        if (m.distStr) {
          popupHtml += '<div class="dist-item"><div class="dist-value">' + m.distStr + '</div><div class="dist-label">Khoảng cách</div></div>';
        }
        if (m.estTime) {
          popupHtml += '<div class="dist-item"><div class="dist-value">' + m.estTime + '</div><div class="dist-label">Ước tính</div></div>';
        }
        popupHtml += '</div>';
      }
      popupHtml += '</div>';

      var markerIcon = L.divIcon({
        className: '',
        html: '<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:' + m.color + ';transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:800">' + (i+1) + '</span></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      L.marker([m.lat, m.lon], { icon: markerIcon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 260 });

      bounds.push([m.lat, m.lon]);
    });

    // Fit all markers in view
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.background },

  header: {
    backgroundColor: T.colors.primaryDark,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },

  toggleRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: T.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceBorder,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: T.radius.lg,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.colors.surfaceBorder,
    backgroundColor: "#fff",
  },
  toggleBtnActive: {
    backgroundColor: T.colors.primaryBg,
    borderColor: T.colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.colors.textMuted,
  },
  toggleTextActive: {
    color: T.colors.primary,
  },

  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.colors.background,
  },

  summaryStrip: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(254,250,224,0.95)",
    borderRadius: T.radius.lg,
    padding: 14,
    ...T.shadows.card,
    borderWidth: 1,
    borderColor: T.colors.surfaceBorder,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.colors.textDark,
    textAlign: "center",
  },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: T.colors.textMuted, marginTop: 12, fontSize: 13 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.colors.textDark,
    marginBottom: 6,
  },
  emptySub: { fontSize: 13, color: T.colors.textMuted, textAlign: "center" },
});
