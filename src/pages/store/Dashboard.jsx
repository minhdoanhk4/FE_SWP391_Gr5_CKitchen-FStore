import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  Plus,
  ClipboardList,
  AlertCircle,
  Receipt,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { StatCard } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";
import "../Dashboard.css";

export default function StoreDashboard() {
  const { user } = useAuth();
  const { recentActivity = [], weeklyOrders = [], formatCurrency } = useData();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingOrders: 0,
    inTransitOrders: 0,
    todayRevenue: 0,
  });
  const [storeName, setStoreName] = useState("");
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [overviewResp, inventoryResp, myStoreResp, salesResp] = await Promise.all([
          storeService.getOverview(),
          storeService.getStoreInventory({ size: 100 }),
          storeService.getMyStore().catch(() => null),
          storeService.getSalesDaily({ fromDate: today, toDate: today, size: 1 }).catch(() => null),
        ]);

        const salesRows = salesResp?.content ?? salesResp ?? [];
        const todayRow = salesRows.find((r) => r.reportDate === today);

        setStats({
          pendingOrders: overviewResp.pendingOrders || 0,
          inTransitOrders: overviewResp.activeDeliveries || 0,
          todayRevenue: todayRow?.totalRevenue ?? 0,
        });

        if (myStoreResp?.name) setStoreName(myStoreResp.name);

        const low = (inventoryResp.content || []).filter((i) => i.lowStock);
        setLowStock(low);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <PageWrapper>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <p className="welcome-banner__greeting">Xin chào,</p>
        <h2 className="welcome-banner__name">{user?.name} 👋</h2>
        <p className="welcome-banner__summary">
          {storeName && <span>{storeName} — </span>}
          Bạn có {stats.pendingOrders} đơn đang chờ xử lý và {lowStock.length}{" "}
          sản phẩm sắp hết hàng.
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <StatCard
          label="Đơn chờ xử lý"
          value={stats.pendingOrders}
          icon={Clock}
          color="warning"
          trend="up"
          trendValue="+1 hôm nay"
        />
        <StatCard
          label="Đang vận chuyển"
          value={stats.inTransitOrders}
          icon={ShoppingCart}
          color="info"
        />
        <StatCard
          label="Sản phẩm thiếu hàng"
          value={lowStock.length}
          icon={Package}
          color="accent"
          trend="down"
          trendValue="Cần đặt hàng"
        />
        <StatCard
          label="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          icon={TrendingUp}
          color="primary"
          trend="up"
          trendValue="+12%"
        />
      </div>

      <div className="dashboard-grid">
        {/* Chart */}
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Đơn hàng trong tuần</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyOrders}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--surface-border)"
                />
                <XAxis
                  dataKey="day"
                  fontSize={12}
                  tick={{ fill: "var(--text-secondary)" }}
                />
                <YAxis fontSize={12} tick={{ fill: "var(--text-secondary)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Số đơn"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions + Low Stock */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <div className="dashboard-section">
            <div className="dashboard-section__header">
              <h3 className="dashboard-section__title">Thao tác nhanh</h3>
            </div>
            <div className="dashboard-section__body">
              <div className="quick-actions">
                <button
                  className="quick-action-btn"
                  onClick={() => navigate("/store/orders/new")}
                >
                  <div className="quick-action-btn__icon">
                    <Plus size={20} />
                  </div>
                  <span className="quick-action-btn__label">Tạo đơn hàng</span>
                </button>
                <button
                  className="quick-action-btn"
                  onClick={() => navigate("/store/orders")}
                >
                  <div className="quick-action-btn__icon">
                    <ClipboardList size={20} />
                  </div>
                  <span className="quick-action-btn__label">Xem đơn hàng</span>
                </button>
                <button
                  className="quick-action-btn"
                  onClick={() => navigate("/store/inventory")}
                >
                  <div className="quick-action-btn__icon">
                    <Package size={20} />
                  </div>
                  <span className="quick-action-btn__label">Tồn kho</span>
                </button>
                <button
                  className="quick-action-btn"
                  onClick={() => navigate("/store/receiving")}
                >
                  <div className="quick-action-btn__icon">
                    <Receipt size={20} />
                  </div>
                  <span className="quick-action-btn__label">Nhận hàng</span>
                </button>
              </div>
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="dashboard-section">
            <div className="dashboard-section__header">
              <h3 className="dashboard-section__title">⚠️ Cảnh báo tồn kho</h3>
            </div>
            <div className="dashboard-section__body--flush">
              {lowStock.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-item__icon activity-item__icon--warning">
                    <AlertCircle size={16} />
                  </div>
                  <div className="activity-item__content">
                    <p className="activity-item__message">{item.productName}</p>
                    <p className="activity-item__time">
                      Còn {item.quantity} {item.unit} / tối thiểu{" "}
                      {item.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <h3 className="dashboard-section__title">Hoạt động gần đây</h3>
        </div>
        <div className="dashboard-section__body--flush">
          <div className="activity-feed">
            {recentActivity.slice(0, 5).map((act) => (
              <div key={act.id} className="activity-item">
                <div
                  className={`activity-item__icon activity-item__icon--${act.type.includes("order") ? "order" : act.type.includes("delivery") || act.type.includes("batch") ? "delivery" : "warning"}`}
                >
                  <ShoppingCart size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__message">{act.message}</p>
                  <p className="activity-item__time">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
