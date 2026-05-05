import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Button, DataTable, Badge } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";

export default function StoreOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { STATUS_LABELS, STATUS_COLORS, formatCurrency, formatDateTime } =
    useData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const queryParams = { size: 100 };
        if (statusFilter !== "all") {
          queryParams.status = statusFilter;
        }
        const resp = await storeService.getOrders(queryParams);
        setData(resp.content || []);
      } catch (err) {
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [statusFilter]);

  const columns = [
    {
      header: "Mã đơn",
      accessor: "id",
      sortable: true,
      width: "100px",
      render: (row) => (
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--primary)" }}
        >
          {row.id}
        </span>
      ),
    },
    {
      header: "Sản phẩm",
      accessor: "items",
      render: (row) => (
        <div>
          {row.items.map((item, i) => (
            <div key={i} style={{ fontSize: "13px" }}>
              {item.productName} x {item.quantity}
            </div>
          ))}
        </div>
      ),
    },
    { header: "Ngày yêu cầu", accessor: "requestedDate", sortable: true },
    {
      header: "Tổng tiền",
      accessor: "total",
      sortable: true,
      render: (row) => (
        <span className="font-mono">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      render: (row) => {
        const s = row.status?.toLowerCase() || "";
        return (
          <Badge variant={STATUS_COLORS[s]} dot>
            {STATUS_LABELS[s]}
          </Badge>
        );
      },
    },
    {
      header: "Tạo lúc",
      accessor: "createdAt",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      header: "Thao tác",
      accessor: "actions",
      width: "60px",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/store/orders/${row.id}`);
          }}
          title="Xem chi tiết"
        />
      ),
    },
  ];

  const statusTabs = [
    { value: "all", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "ASSIGNED", label: "Đã xác nhận" },
    { value: "IN_PROGRESS", label: "Đang sản xuất" },
    { value: "PACKED_WAITING_SHIPPER", label: "Sẵn sàng giao" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <PageWrapper
      title="Đơn đặt hàng"
      subtitle="Quản lý đơn đặt hàng nguyên liệu từ bếp trung tâm"
      actions={
        <Button icon={Plus} onClick={() => navigate("/store/orders/new")}>
          Tạo đơn mới
        </Button>
      }
    >
      {/* Status filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid",
              borderColor:
                statusFilter === tab.value
                  ? "var(--primary)"
                  : "var(--surface-border)",
              background:
                statusFilter === tab.value
                  ? "var(--primary-bg)"
                  : "var(--surface-card)",
              color:
                statusFilter === tab.value
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Tìm theo mã đơn, sản phẩm..."
        emptyTitle="Chưa có đơn hàng"
        emptyDesc="Bấm 'Tạo đơn mới' để bắt đầu đặt hàng từ bếp trung tâm."
      />
    </PageWrapper>
  );
}
