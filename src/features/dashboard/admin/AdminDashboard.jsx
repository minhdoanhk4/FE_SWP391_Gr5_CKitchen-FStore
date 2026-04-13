import { Users, Store, Activity, Shield } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { StatCard, DataTable, Badge } from "../../../components/ui";
import { useAuth, ROLE_INFO } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import "../Dashboard.css";

const roleDist = [
  { name: "Cửa hàng", value: 5, color: "#2D6A4F" },
  { name: "Bếp", value: 2, color: "#E76F51" },
  { name: "Điều phối", value: 1, color: "#F4A261" },
  { name: "Quản lý", value: 1, color: "#457B9D" },
  { name: "Admin", value: 1, color: "#6B7280" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    dashboardStats,
    users: allUsers,
    stores,
    auditLogs,
    formatDateTime,
    AUDIT_ACTION_LABELS,
  } = useData();
  const stats = dashboardStats.admin;

  const userColumns = [
    { header: "Tên", accessor: "name", sortable: true },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      accessor: "role",
      sortable: true,
      render: (row) => (
        <Badge variant={ROLE_INFO[row.role]?.color || "neutral"}>
          {ROLE_INFO[row.role]?.label || row.role}
        </Badge>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "danger"} dot>
          {row.status === "active" ? "Hoạt động" : "Vô hiệu"}
        </Badge>
      ),
    },
  ];

  return (
    <PageWrapper>
      <div
        className="welcome-banner"
        style={{ background: "linear-gradient(135deg, #374151, #6B7280)" }}
      >
        <p className="welcome-banner__greeting">Quản trị viên,</p>
        <h2 className="welcome-banner__name">{user?.name} ⚙️</h2>
        <p className="welcome-banner__summary">
          Hệ thống có {stats.totalUsers} người dùng, {stats.totalStores} cửa
          hàng. Uptime: {stats.systemUptime}%.
        </p>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Đang hoạt động"
          value={stats.activeUsers}
          icon={Activity}
          color="accent"
        />
        <StatCard
          label="Cửa hàng"
          value={stats.totalStores}
          icon={Store}
          color="info"
        />
        <StatCard
          label="System Uptime"
          value={`${stats.systemUptime}%`}
          icon={Shield}
          color="warning"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Người dùng gần đây</h3>
          </div>
          <div className="dashboard-section__body--flush">
            <DataTable
              columns={userColumns}
              data={allUsers.slice(0, 6)}
              searchable={false}
            />
          </div>
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h3 className="dashboard-section__title">Phân bổ vai trò</h3>
          </div>
          <div className="dashboard-section__body">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roleDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {roleDist.map((entry, i) => (
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

      {/* Audit Log Section */}
      <div
        className="dashboard-section"
        style={{ marginTop: "var(--space-6)" }}
      >
        <div className="dashboard-section__header">
          <h3 className="dashboard-section__title">Nhật ký hoạt động</h3>
        </div>
        <div className="dashboard-section__body--flush">
          <DataTable
            columns={[
              {
                header: "Thời gian",
                accessor: "timestamp",
                render: (row) => formatDateTime(row.timestamp),
              },
              {
                header: "Hành động",
                accessor: "action",
                render: (row) => (
                  <Badge variant="neutral">
                    {AUDIT_ACTION_LABELS?.[row.action] || row.action}
                  </Badge>
                ),
              },
              { header: "Người dùng", accessor: "user" },
              { header: "Chi tiết", accessor: "details" },
              {
                header: "Module",
                accessor: "module",
                render: (row) => <Badge variant="info">{row.module}</Badge>,
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
