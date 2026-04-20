import { useState, useEffect } from "react";
import {
  ClipboardList,
  Truck,
  AlertTriangle,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
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
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { StatCard } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import supplyService from "../../services/supplyService";
import "../Dashboard.css";

export default function SupplyDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ov, orders] = await Promise.all([
          supplyService.getOverview(),
          supplyService.getOrders({ size: 5 }),
        ]);
        setOverview(ov);
        setRecentOrders(orders?.content || []);
      } catch (err) {
        toast.error("Không thể tải dữ liệu tổng quan");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          <Loader2
            size={32}
            className="spin"
            style={{ color: "var(--warning)" }}
          />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div
        className="welcome-banner"
        style={{ background: "linear-gradient(135deg, #8B6914, #F4A261)" }}
      >
        <p className="welcome-banner__greeting">Xin chào,</p>
        <h2 className="welcome-banner__name">{user?.name}</h2>
        <p className="welcome-banner__summary">
          Có {overview?.pendingOrders ?? 0} đơn chờ phân phối và{" "}
          {overview?.overdueOrders ?? 0} đơn quá hạn.
        </p>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Đơn chờ phân phối"
          value={overview?.pendingOrders ?? 0}
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label="Đang vận chuyển"
          value={overview?.shippingOrders ?? 0}
          icon={Truck}
          color="info"
        />
        <StatCard
          label="Chưa gán bếp"
          value={overview?.unassignedOrders ?? 0}
          icon={AlertTriangle}
          color="accent"
        />
        <StatCard
          label="Giao hàng đang hoạt động"
          value={overview?.activeDeliveries ?? 0}
          icon={Calendar}
          color="primary"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Tổng quan trạng thái</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { name: "Chờ xử lý", value: overview?.pendingOrders ?? 0 },
                  { name: "Đã gán bếp", value: overview?.assignedOrders ?? 0 },
                  { name: "Đang SX", value: overview?.inProgressOrders ?? 0 },
                  {
                    name: "Chờ shipper",
                    value: overview?.packedWaitingShipperOrders ?? 0,
                  },
                  { name: "Đang giao", value: overview?.shippingOrders ?? 0 },
                  { name: "Đã giao", value: overview?.deliveredOrders ?? 0 },
                  { name: "Đã hủy", value: overview?.cancelledOrders ?? 0 },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--surface-border)"
                />
                <XAxis
                  dataKey="name"
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
                  dataKey="value"
                  name="Số đơn"
                  fill="var(--warning)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Đơn hàng gần đây</h3>
          </div>
          <div className="dashboard-section__body--flush">
            {recentOrders.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "20px",
                }}
              >
                Không có đơn hàng nào
              </p>
            )}
            {recentOrders.map((order) => (
              <div key={order.orderId || order.id} className="activity-item">
                <div className="activity-item__icon activity-item__icon--delivery">
                  <Package size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__message">
                    {order.orderId || order.id} — {order.status}
                  </p>
                  <p className="activity-item__time">
                    {order.storeName || order.storeId || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginTop: "var(--space-4)" }}>
        <StatCard
          label="Tổng đơn"
          value={overview?.totalOrders ?? 0}
          icon={Package}
          color="neutral"
        />
        <StatCard
          label="Đã giao"
          value={overview?.deliveredOrders ?? 0}
          icon={CheckCircle}
          color="primary"
        />
        <StatCard
          label="Quá hạn"
          value={overview?.overdueOrders ?? 0}
          icon={Clock}
          color="accent"
        />
        <StatCard
          label="Đã hủy"
          value={overview?.cancelledOrders ?? 0}
          icon={XCircle}
          color="danger"
        />
      </div>
    </PageWrapper>
  );
}
