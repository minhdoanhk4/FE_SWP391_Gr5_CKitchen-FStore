import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  Activity,
  Box,
  ShoppingCart,
  TrendingUp,
  BarChart3 as ChartIcon,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import {
  StatCard,
  DataTable,
  Badge,
  Card,
  Button,
  LoadingScreen,
} from "../../components/ui";
import { useAuth, ROLE_INFO } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import adminService from "../../services/adminService";
import managerService from "../../services/managerService";
import "../Dashboard.css";

const ORDER_STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  ASSIGNED: "Đã gán bếp",
  IN_PROGRESS: "Đang SX",
  PACKED_WAITING_SHIPPER: "Chờ shipper",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { formatDateTime, AUDIT_ACTION_LABELS, auditLogs, formatCurrency } =
    useData();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [storeRevenueData, setStoreRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, usersData] = await Promise.all([
          adminService.reports.getSystemOverview(),
          adminService.users.getAll({ size: 10 }),
        ]);
        setOverview(overviewData);
        setUsers(usersData.content || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }

      // Revenue by store — requires SALES_REPORT_VIEW; gracefully skip if forbidden
      try {
        const salesData = await managerService.sales.getTotal();
        const rows = (salesData?.stores ?? []).map((s) => ({
          name: s.storeName || s.storeId,
          revenue: s.totalReportRevenue ?? 0,
        }));
        setStoreRevenueData(rows);
      } catch {
        // permission not granted for this admin account — leave chart empty
      }
    };
    fetchData();
  }, []);

  const userColumns = [
    {
      header: "Tên",
      accessor: "fullName",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--primary-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {r.fullName?.charAt(0) || "U"}
          </div>
          {r.fullName}
        </div>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      accessor: "role",
      render: (r) => (
        <Badge variant={ROLE_INFO[r.role]?.color || "neutral"}>
          {ROLE_INFO[r.role]?.label || r.role}
        </Badge>
      ),
    },
  ];

  if (loading) return <LoadingScreen />;

  const stats = overview || {};

  // Order status chart — built from real API data
  const orderStatusChartData = Object.entries(stats.orderStatusCounts || {})
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: ORDER_STATUS_LABELS[status] || status,
      value: count,
    }));

  return (
    <PageWrapper
      title="Hệ thống Quản trị Tập trung"
      subtitle={`Phiên làm việc của ${user?.name}`}
    >
      {/* Metrics Row */}
      <div
        className="dashboard-stats"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: "32px",
          gap: "20px",
        }}
      >
        <StatCard
          label="Tài khoản"
          value={stats.totalUsers || 0}
          icon={Users}
          color="primary"
          style={{
            background: "linear-gradient(to bottom right, #eff6ff, #fff)",
          }}
        />
        <StatCard
          label="Danh mục SP"
          value={stats.totalProducts || 0}
          icon={Box}
          color="accent"
          style={{
            background: "linear-gradient(to bottom right, #fdf4ff, #fff)",
          }}
        />
        <StatCard
          label="Cơ sở hạ tầng"
          value={(stats.totalStores || 0) + (stats.totalKitchens || 0)}
          icon={Store}
          color="info"
          style={{
            background: "linear-gradient(to bottom right, #f0fdf4, #fff)",
          }}
        />
        <StatCard
          label="Yêu cầu hệ thống"
          value={stats.totalOrders || 0}
          icon={ShoppingCart}
          color="warning"
          style={{
            background: "linear-gradient(to bottom right, #fffbeb, #fff)",
          }}
        />
      </div>

      {/* Charts Section */}
      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="var(--primary)" /> Doanh thu theo Cửa
              hàng
            </h4>
            <Badge variant="primary">Tổng cộng</Badge>
          </div>
          <div style={{ height: 300 }}>
            {storeRevenueData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Chưa có dữ liệu doanh thu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeRevenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--surface-border)"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--surface-border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ChartIcon size={18} color="var(--warning)" /> Phân bố trạng thái
              đơn hàng
            </h4>
            <Badge variant="warning">Thực tế</Badge>
          </div>
          <div style={{ height: 300 }}>
            {orderStatusChartData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Chưa có dữ liệu đơn hàng
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--surface-border)"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--surface-border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Đơn hàng"
                    fill="var(--warning)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: "2.5fr 1fr", gap: "24px" }}
      >
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">
              Người dùng mới gia nhập
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/users")}
            >
              Xem tất cả
            </Button>
          </div>
          <div className="dashboard-section__body--flush">
            <DataTable
              columns={userColumns}
              data={users.slice(0, 8)}
              searchable={false}
            />
          </div>
        </div>

        {/* Sidebar Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card style={{ borderLeft: "4px solid var(--primary)" }}>
            <h4
              style={{
                marginBottom: "16px",
                fontSize: "12px",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                fontWeight: 700,
              }}
            >
              TRUY CẬP NHANH
            </h4>
            <div style={{ display: "grid", gap: "10px" }}>
              <Button
                variant="ghost"
                block
                style={{
                  justifyContent: "flex-start",
                  background: "var(--surface-sub)",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/products")}
              >
                Quản lý sản phẩm
              </Button>
              <Button
                variant="ghost"
                block
                style={{
                  justifyContent: "flex-start",
                  background: "var(--surface-sub)",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/stores")}
              >
                QL Cửa hàng
              </Button>
              <Button
                variant="ghost"
                block
                style={{
                  justifyContent: "flex-start",
                  background: "var(--surface-sub)",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/kitchens")}
              >
                QL Bếp
              </Button>
              <Button
                variant="ghost"
                block
                style={{
                  justifyContent: "flex-start",
                  background: "var(--surface-sub)",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/notifications")}
              >
                Gửi thông báo
              </Button>
            </div>
          </Card>

          <Card
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ color: "white", fontSize: "14px" }}>
                Tình trạng vận hành
              </h4>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                }}
              ></div>
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, lineHeight: "1.5" }}>
              Hệ thống đang hoạt động tốt. Thời gian phản hồi trung bình: 42ms.
            </div>
            <div
              style={{
                marginTop: "16px",
                height: "4px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
              }}
            >
              <div
                style={{
                  width: "98%",
                  height: "100%",
                  background: "#22c55e",
                  borderRadius: "2px",
                }}
              ></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Audit Logs */}
      <div
        className="dashboard-section"
        style={{ marginTop: "var(--space-8)" }}
      >
        <div
          className="dashboard-section__header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 className="dashboard-section__title">
            Nhật ký hoạt động hệ thống
          </h3>
          <Activity size={18} color="var(--text-muted)" />
        </div>
        <div className="dashboard-section__body--flush">
          <DataTable
            columns={[
              {
                header: "Thời gian",
                accessor: "timestamp",
                render: (row) => (
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    {formatDateTime(row.timestamp)}
                  </span>
                ),
              },
              {
                header: "Hành động",
                accessor: "action",
                render: (row) => (
                  <Badge
                    variant={
                      row.action.includes("DELETE") ? "danger" : "neutral"
                    }
                    size="sm"
                  >
                    {AUDIT_ACTION_LABELS?.[row.action] || row.action}
                  </Badge>
                ),
              },
              {
                header: "Người thực hiện",
                accessor: "user",
                render: (r) => (
                  <span style={{ fontWeight: 600 }}>{r.user}</span>
                ),
              },
              { header: "Chi tiết sự kiện", accessor: "details" },
              {
                header: "Phân hệ",
                accessor: "module",
                render: (row) => (
                  <Badge
                    variant="info"
                    size="sm"
                    style={{ textTransform: "uppercase" }}
                  >
                    {row.module}
                  </Badge>
                ),
              },
            ]}
            data={auditLogs.slice(0, 10)}
            searchable={false}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
