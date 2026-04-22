import { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  BookOpen,
  FlaskConical,
  ClipboardList,
  Layers,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { StatCard, Badge, Spinner } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import managerService from "../../services/managerService";
import "../Dashboard.css";

function formatCurrency(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v);
}

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [kitchenLowStock, setKitchenLowStock] = useState([]);
  const [storeLowStock, setStoreLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.dashboard.getOverview(),
      managerService.dashboard.getKitchenLowStock(),
      managerService.dashboard.getStoreLowStock(),
    ])
      .then(([ov, kitchen, store]) => {
        if (!mounted) return;
        setOverview(ov);
        setKitchenLowStock(
          Array.isArray(kitchen) ? kitchen : (kitchen?.content ?? []),
        );
        setStoreLowStock(Array.isArray(store) ? store : (store?.content ?? []));
      })
      .catch(() => {
        if (mounted) toast.error("Không thể tải dữ liệu tổng quan");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totalRevenue = overview?.totalRevenue ?? 0;
  const totalProducts = overview?.totalProducts ?? 0;
  const totalIngredients = overview?.totalIngredients ?? 0;
  const totalRecipes = overview?.totalRecipes ?? 0;
  const activeProductionPlans = overview?.activeProductionPlans ?? 0;
  const inProgressBatches = overview?.inProgressBatches ?? 0;
  const pendingOrders = overview?.pendingOrders ?? 0;
  const lowStockKitchenItems = overview?.lowStockKitchenItems ?? 0;
  const lowStockStoreItems = overview?.lowStockStoreItems ?? 0;
  const totalDisposedQuantity = overview?.totalDisposedQuantity ?? 0;

  const productionChartData = [
    { name: "Sản phẩm", value: totalProducts },
    { name: "Nguyên liệu", value: totalIngredients },
    { name: "Công thức", value: totalRecipes },
    { name: "KH sản xuất", value: activeProductionPlans },
    { name: "Lô đang SX", value: inProgressBatches },
    { name: "Đơn chờ", value: pendingOrders },
  ];

  const inventoryRadarData = [
    { subject: "Hàng tồn bếp", value: lowStockKitchenItems, max: Math.max(lowStockKitchenItems, 20) },
    { subject: "Hàng tồn CH", value: lowStockStoreItems, max: Math.max(lowStockStoreItems, 20) },
    { subject: "Lô đang SX", value: inProgressBatches, max: Math.max(inProgressBatches, 10) },
    { subject: "KH hoạt động", value: activeProductionPlans, max: Math.max(activeProductionPlans, 10) },
    { subject: "Đơn chờ", value: pendingOrders, max: Math.max(pendingOrders, 10) },
  ];

  return (
    <PageWrapper>
      <div
        className="welcome-banner bg-gradient-primary"
      >
        <p className="welcome-banner__greeting">Báo cáo tổng quan,</p>
        <h2 className="welcome-banner__name">{user?.name}</h2>
        <p className="welcome-banner__summary">
          {loading ? (
            <Spinner size="sm" className="inline-spinner" />
          ) : (
            `Tổng doanh thu: ${formatCurrency(totalRevenue)} · ${pendingOrders} đơn đang chờ · ${inProgressBatches} lô đang sản xuất`
          )}
        </p>
      </div>

      {/* Row 1 stats */}
      <div className="dashboard-stats">
        <StatCard
          label="Tổng doanh thu"
          value={loading ? "..." : formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          label="Đơn hàng chờ xử lý"
          value={loading ? "..." : pendingOrders}
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label="Lô đang sản xuất"
          value={loading ? "..." : inProgressBatches}
          icon={Layers}
          color="info"
        />
        <StatCard
          label="KH sản xuất đang chạy"
          value={loading ? "..." : activeProductionPlans}
          icon={FlaskConical}
          color="accent"
        />
      </div>

      {/* Row 2 stats */}
      <div className="dashboard-stats" style={{ marginTop: "var(--space-3)" }}>
        <StatCard
          label="Tổng sản phẩm"
          value={loading ? "..." : totalProducts}
          icon={Package}
          color="primary"
        />
        <StatCard
          label="Công thức nấu ăn"
          value={loading ? "..." : totalRecipes}
          icon={BookOpen}
          color="info"
        />
        <StatCard
          label="Hàng sắp hết (bếp + CH)"
          value={loading ? "..." : lowStockKitchenItems + lowStockStoreItems}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          label="Tổng số thanh lý"
          value={loading ? "..." : totalDisposedQuantity}
          icon={Trash2}
          color="danger"
        />
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--space-5)",
          marginTop: "var(--space-5)",
          marginBottom: "var(--space-5)",
        }}
      >
        {/* Bar chart: production overview */}
        <div className="dashboard-section card-gradient">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Tổng quan sản xuất & đơn hàng</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productionChartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: "var(--text-secondary)" }} />
                <YAxis fontSize={12} tick={{ fill: "var(--text-secondary)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" name="Số lượng" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart: operational health */}
        <div className="dashboard-section card-gradient">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Sức khỏe vận hành</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={inventoryRadarData}>
                <PolarGrid stroke="var(--surface-border)" />
                <PolarAngleAxis dataKey="subject" fontSize={11} tick={{ fill: "var(--text-secondary)" }} />
                <Radar
                  name="Số lượng"
                  dataKey="value"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {(kitchenLowStock.length > 0 || storeLowStock.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-5)",
          }}
        >
          {kitchenLowStock.length > 0 && (
            <div className="dashboard-section card-gradient">
              <div className="dashboard-section__header">
                <h3
                  className="dashboard-section__title"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <AlertTriangle size={16} color="var(--warning)" />
                  Nguyên liệu bếp sắp hết ({kitchenLowStock.length})
                </h3>
              </div>
              <div className="dashboard-section__body">
                {kitchenLowStock.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--surface-border)",
                      fontSize: 13,
                    }}
                  >
                    <span>{item.ingredientName || item.name}</span>
                    <Badge variant="warning">
                      {item.quantity ?? item.currentStock} / {item.minStock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {storeLowStock.length > 0 && (
            <div className="dashboard-section card-gradient">
              <div className="dashboard-section__header">
                <h3
                  className="dashboard-section__title"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <AlertTriangle size={16} color="var(--danger)" />
                  Sản phẩm cửa hàng sắp hết ({storeLowStock.length})
                </h3>
              </div>
              <div className="dashboard-section__body">
                {storeLowStock.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--surface-border)",
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.productName || item.name}</span>
                      {item.storeName && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
                          {item.storeName}
                        </span>
                      )}
                    </div>
                    <Badge variant="danger">
                      {item.quantity ?? item.currentStock} / {item.minStock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
