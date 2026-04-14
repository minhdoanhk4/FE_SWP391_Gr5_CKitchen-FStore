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
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card } from "../../components/ui";
import { useData } from "../../contexts/DataContext";

export default function Reports({
  title = "Báo cáo & Thống kê",
  subtitle = "Tổng hợp báo cáo hiệu quả vận hành toàn chuỗi",
}) {
  const {
    revenueData,
    ordersByStore,
    categoryDistribution,
    weeklyOrders,
    formatCurrency,
  } = useData();
  return (
    <PageWrapper title={title} subtitle={subtitle}>
      <div className="grid grid--2" style={{ marginBottom: "var(--space-6)" }}>
        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            📈 Doanh thu theo tháng
          </h4>
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
                }}
                formatter={(v) => formatCurrency(v)}
              />
              <Legend />
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
        </Card>

        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            🍲 Phân bổ danh mục
          </h4>
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
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid--2">
        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            🏪 Đơn hàng theo cửa hàng
          </h4>
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
                fill="var(--accent)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            📊 Đơn hàng trong tuần
          </h4>
          <ResponsiveContainer width="100%" height={280}>
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
                }}
              />
              <Bar
                dataKey="count"
                name="Số đơn"
                fill="var(--accent)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </PageWrapper>
  );
}
