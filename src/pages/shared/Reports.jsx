import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Button, Select } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import managerService from "../../services/managerService";

// Get ISO date string N days ago
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// Group daily rows [{date, storeName, totalRevenue, totalItems}] by month
function groupByMonth(rows) {
  const map = {};
  rows.forEach((r) => {
    const d = new Date(r.date);
    const key = `Th${d.getMonth() + 1}/${d.getFullYear()}`;
    if (!map[key]) map[key] = { month: key, revenue: 0 };
    map[key].revenue += r.totalRevenue ?? 0;
  });
  return Object.values(map).sort((a, b) => {
    const [ma, ya] = a.month.replace("Th", "").split("/").map(Number);
    const [mb, yb] = b.month.replace("Th", "").split("/").map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });
}

// Group by store: [{name, revenue, orders}]
function groupByStore(rows) {
  const map = {};
  rows.forEach((r) => {
    const key = r.storeName ?? r.storeId ?? "Không xác định";
    if (!map[key]) map[key] = { name: key, revenue: 0, orders: 0 };
    map[key].revenue += r.totalRevenue ?? 0;
    map[key].orders += r.totalItems ?? 1;
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

// Group last-7-days rows by day-of-week
function groupLast7Days(rows) {
  const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const map = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = DAY_NAMES[d.getDay()];
    map[key] = { day: label, count: 0, revenue: 0 };
  }
  rows.forEach((r) => {
    if (map[r.date]) {
      map[r.date].count += r.totalItems ?? 0;
      map[r.date].revenue += r.totalRevenue ?? 0;
    }
  });
  return Object.values(map);
}

export default function Reports({
  title = "Báo cáo & Thống kê",
  subtitle = "Tổng hợp báo cáo hiệu quả vận hành toàn chuỗi",
}) {
  const { formatCurrency } = useData();

  const [fromDate, setFromDate] = useState(daysAgo(90));
  const [toDate, setToDate] = useState(daysAgo(0));
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [storeRevenue, setStoreRevenue] = useState([]);
  const [weeklyOrders, setWeeklyOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dailyResp, totalResp, weeklyResp] = await Promise.all([
        managerService.sales.getDaily({ fromDate, toDate, storeId: storeId || undefined }),
        managerService.sales.getTotal({ fromDate, toDate, storeId: storeId || undefined }),
        managerService.sales.getDaily({
          fromDate: daysAgo(6),
          toDate: daysAgo(0),
          storeId: storeId || undefined,
        }),
      ]);

      const dailyRows = dailyResp?.content ?? dailyResp ?? [];
      const weeklyRows = weeklyResp?.content ?? weeklyResp ?? [];

      setMonthlyRevenue(groupByMonth(dailyRows));
      setStoreRevenue(groupByStore(dailyRows));
      setWeeklyOrders(groupLast7Days(weeklyRows));
      setTotalRevenue(totalResp);
    } catch (err) {
      // Not a manager/admin — fall back to empty charts silently
      if (err?.response?.status !== 403) {
        toast.error("Không thể tải dữ liệu báo cáo");
      }
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    managerService.sales.getStores()
      .then((list) => setStores(list ?? []))
      .catch(() => {}); // non-manager roles (e.g. admin) may get 403 — silently ignore
  }, []);

  const handleExport = async () => {
    try {
      const blob = await managerService.sales.exportDaily({ fromDate, toDate, storeId: storeId || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `doanh_thu_${fromDate}_${toDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Xuất báo cáo thất bại");
    }
  };

  const tooltipStyle = {
    contentStyle: {
      background: "var(--surface-card)",
      border: "1px solid var(--surface-border)",
      borderRadius: "10px",
    },
  };

  // Grand total for summary
  const grandTotal =
    totalRevenue?.totalRevenue ??
    monthlyRevenue.reduce((s, r) => s + r.revenue, 0);

  return (
    <PageWrapper
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>
            Làm mới
          </Button>
          <Button icon={Download} onClick={handleExport}>
            Xuất Excel
          </Button>
        </>
      }
    >
      {/* Date filter */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Từ ngày
        </label>
        <input
          type="date"
          value={fromDate}
          max={toDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        />
        <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Đến ngày
        </label>
        <input
          type="date"
          value={toDate}
          min={fromDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        />
        {[
          { label: "7 ngày", days: 7 },
          { label: "30 ngày", days: 30 },
          { label: "90 ngày", days: 90 },
        ].map(({ label, days }) => (
          <Button
            key={label}
            variant="secondary"
            size="sm"
            onClick={() => {
              setFromDate(daysAgo(days - 1));
              setToDate(daysAgo(0));
            }}
          >
            {label}
          </Button>
        ))}
        {stores.length > 0 && (
          <>
            <span style={{ width: "1px", height: "24px", background: "var(--surface-border)" }} />
            <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Cửa hàng
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-card)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            >
              <option value="">Tất cả cửa hàng</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Summary */}
      {grandTotal > 0 && (
        <Card style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Tổng doanh thu trong khoảng thời gian đã chọn
          </span>
          <p
            className="font-mono"
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--success)",
            }}
          >
            {formatCurrency(grandTotal)}
          </p>
        </Card>
      )}

      <div className="grid grid--2" style={{ marginBottom: "var(--space-6)" }}>
        {/* Monthly revenue line chart */}
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
          {loading ? (
            <div
              style={{
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              Đang tải...
            </div>
          ) : monthlyRevenue.length === 0 ? (
            <div
              style={{
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              Không có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRevenue}>
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
                  {...tooltipStyle}
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
          )}
        </Card>

        {/* Weekly orders bar chart */}
        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            📊 Doanh thu 7 ngày gần đây
          </h4>
          {loading ? (
            <div
              style={{
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              Đang tải...
            </div>
          ) : (
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
                <YAxis
                  fontSize={12}
                  tick={{ fill: "var(--text-secondary)" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => formatCurrency(v)}
                />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="var(--accent)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Store revenue bar chart */}
      <Card>
        <h4
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          🏪 Doanh thu theo cửa hàng
        </h4>
        {loading ? (
          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            Đang tải...
          </div>
        ) : storeRevenue.length === 0 ? (
          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={storeRevenue}>
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
                fontSize={12}
                tick={{ fill: "var(--text-secondary)" }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Doanh thu"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </PageWrapper>
  );
}
