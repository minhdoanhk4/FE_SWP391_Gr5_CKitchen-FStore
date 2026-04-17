import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  Store,
  Percent,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { StatCard, Badge } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import managerService from "../../../services/managerService";
import "../Dashboard.css";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { revenueData, categoryDistribution, formatCurrency, ordersByStore } =
    useData();

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
      .catch(() => { if (mounted) toast.error("Không thể tải dữ liệu tổng quan"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const totalRevenue = overview?.totalRevenue ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const activeStores = overview?.activeStores ?? 0;
  const wastageRate = overview?.wastageRate ?? 0;
  const avgFulfillment = overview?.avgFulfillment ?? 0;

  return (
    <PageWrapper>
      <div
        className="welcome-banner"
        style={{ background: "linear-gradient(135deg, #1D3557, #457B9D)" }}
      >
        <p className="welcome-banner__greeting">Báo cáo tổng quan,</p>
        <h2 className="welcome-banner__name">{user?.name} 📊</h2>
        <p className="welcome-banner__summary">
          {loading
            ? "Đang tải dữ liệu..."
            : `Doanh thu tháng này đạt ${formatCurrency(totalRevenue)} với ${totalOrders} đơn hàng. Tỷ lệ hoàn thành ${avgFulfillment}%.`}
        </p>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Tổng doanh thu"
          value={loading ? "..." : formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="primary"
          trend="up"
          trendValue="+15% so với tháng trước"
        />
        <StatCard
          label="Tổng đơn hàng"
          value={loading ? "..." : totalOrders}
          icon={ShoppingCart}
          color="info"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          label="Cửa hàng hoạt động"
          value={loading ? "..." : activeStores}
          icon={Store}
          color="accent"
        />
        <StatCard
          label="Tỷ lệ hao hụt"
          value={loading ? "..." : `${wastageRate}%`}
          icon={Percent}
          color="warning"
          trend="down"
          trendValue="-0.5%"
        />
      </div>

      {/* Low stock alerts */}
      {(kitchenLowStock.length > 0 || storeLowStock.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-5)",
            marginBottom: "var(--space-5)",
          }}
        >
          {kitchenLowStock.length > 0 && (
            <div className="dashboard-section">
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
                {kitchenLowStock.slice(0, 5).map((item, i) => (
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
                    <span>{item.name || item.ingredientName}</span>
                    <Badge variant="warning">
                      {item.quantity ?? item.currentStock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {storeLowStock.length > 0 && (
            <div className="dashboard-section">
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
                {storeLowStock.slice(0, 5).map((item, i) => (
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
                    <span>{item.name || item.productName}</span>
                    <Badge variant="danger">
                      {item.quantity ?? item.currentStock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="dashboard-grid--equal"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-5)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Doanh thu theo tháng</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--surface-border)"
                />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tick={{ fill: "var(--text-secondary)" }}
                />
                <YAxis
                  fontSize={12}
                  tick={{ fill: "var(--text-secondary)" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                  formatter={(v) => formatCurrency(v)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Phân bổ theo danh mục</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {categoryDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <h3 className="dashboard-section__title">Hiệu suất theo cửa hàng</h3>
        </div>
        <div className="dashboard-section__body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ordersByStore}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--surface-border)"
              />
              <XAxis
                dataKey="name"
                fontSize={12}
                tick={{ fill: "var(--text-secondary)" }}
              />
              <YAxis
                yAxisId="left"
                fontSize={12}
                tick={{ fill: "var(--text-secondary)" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={12}
                tick={{ fill: "var(--text-secondary)" }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "10px",
                  fontSize: "13px",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="orders"
                name="Số đơn"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                name="Doanh thu"
                fill="var(--accent-light)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
