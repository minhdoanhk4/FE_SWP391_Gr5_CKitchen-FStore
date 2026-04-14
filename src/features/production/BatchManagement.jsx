import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../components/ui";
import { useData } from "../../contexts/DataContext";

const BATCH_STATUS = {
  confirmed: { label: "Đã xác nhận", variant: "info" },
  planned: { label: "Đã lên kế hoạch", variant: "info" },
  in_progress: { label: "Đang sản xuất", variant: "accent" },
  completed: { label: "Hoàn thành", variant: "success" },
};

export default function BatchManagement() {
  const { batches, formatDateTime } = useData();

  const columns = [
    {
      header: "Mã lô",
      accessor: "id",
      render: (r) => (
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--primary)" }}
        >
          {r.id}
        </span>
      ),
    },
    { header: "Sản phẩm", accessor: "productName", sortable: true },
    {
      header: "Số lượng",
      accessor: "quantity",
      render: (r) => `${r.quantity} ${r.unit}`,
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (r) => {
        const s = BATCH_STATUS[r.status] || {
          label: r.status,
          variant: "neutral",
        };
        return (
          <Badge variant={s.variant} dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      header: "Bắt đầu",
      accessor: "startDate",
      render: (r) => formatDateTime(r.startDate),
    },
    {
      header: "Kết thúc",
      accessor: "endDate",
      render: (r) => (r.endDate ? formatDateTime(r.endDate) : "\u2014"),
    },
    { header: "Phụ trách", accessor: "staff" },
    {
      header: "KH liên kết",
      accessor: "planId",
      render: (r) =>
        r.planId ? (
          <span className="font-mono" style={{ fontSize: "12px" }}>
            {r.planId}
          </span>
        ) : (
          "\u2014"
        ),
    },
    {
      header: "Đơn hàng",
      accessor: "orderId",
      render: (r) =>
        r.orderId ? (
          <span className="font-mono" style={{ fontSize: "12px" }}>
            {r.orderId}
          </span>
        ) : (
          "\u2014"
        ),
    },
  ];

  return (
    <PageWrapper
      title="Quản lý lô sản xuất"
      subtitle="Theo dõi tiến độ các lô sản xuất"
    >
      <DataTable
        columns={columns}
        data={batches}
        searchPlaceholder="Tìm theo mã lô, sản phẩm..."
      />
    </PageWrapper>
  );
}
