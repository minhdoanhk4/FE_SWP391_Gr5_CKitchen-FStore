import { useState, useEffect } from "react";
import {
  ClipboardList,
  ChefHat,
  Package,
  Truck,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { StatCard } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import kitchenService from "../../services/kitchenService";
import "../Dashboard.css";

export default function KitchenDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, inv, kit] = await Promise.all([
          kitchenService.getOverview(),
          kitchenService.getInventory({ size: 100 }),
          kitchenService.getMyKitchen(),
        ]);
        setOverview(ov);
        setKitchen(kit);
        // Filter low stock from inventory response
        const items = inv?.content || [];
        setLowStock(items.filter((i) => i.lowStock));
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Đang tải dữ liệu...
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div
        className="welcome-banner"
        style={{ background: "linear-gradient(135deg, #9B2335, #E76F51)" }}
      >
        <p className="welcome-banner__greeting">Xin chào,</p>
        <h2 className="welcome-banner__name">{user?.name} 🍳</h2>
        <p className="welcome-banner__summary">
          {kitchen && <span>{kitchen.name} — </span>}
          Có {overview?.pendingUnassignedOrders ?? 0} đơn chờ tiếp nhận
          {lowStock.length > 0 && ` và ${lowStock.length} nguyên liệu dưới mức tối thiểu`}.
        </p>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Đơn chờ tiếp nhận"
          value={overview?.pendingUnassignedOrders ?? 0}
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label="Đã gán cho bếp"
          value={overview?.assignedToMyKitchen ?? 0}
          icon={ChefHat}
          color="info"
        />
        <StatCard
          label="Đang sản xuất"
          value={overview?.inProgressOrders ?? 0}
          icon={Package}
          color="accent"
        />
        <StatCard
          label="Chờ shipper"
          value={overview?.packedWaitingShipperOrders ?? 0}
          icon={Truck}
          color="primary"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">📊 Tổng quan trạng thái</h3>
          </div>
          <div className="dashboard-section__body">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Đang giao hàng</span>
                <strong>{overview?.shippingOrders ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  <Clock size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Đơn quá hạn
                </span>
                <strong style={{ color: overview?.overdueOrders > 0 ? "var(--danger)" : "inherit" }}>
                  {overview?.overdueOrders ?? 0}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">
              ⚠️ Nguyên liệu cần bổ sung
            </h3>
          </div>
          <div className="dashboard-section__body--flush">
            {lowStock.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-item__icon activity-item__icon--warning">
                  <AlertCircle size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__message">{item.ingredientName}</p>
                  <p className="activity-item__time">
                    Còn {item.quantity} {item.unit} / tối thiểu {item.minStock}
                  </p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="activity-item">
                <div className="activity-item__content">
                  <p
                    className="activity-item__message"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Tất cả nguyên liệu đủ hàng ✓
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
