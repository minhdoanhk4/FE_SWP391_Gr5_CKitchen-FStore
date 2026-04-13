import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import { useData } from "../../../contexts/DataContext";

export default function KitchenInventory() {
  const { kitchenInventory, formatDate, isExpiringSoon, isExpired } = useData();

  const columns = [
    { header: "Nguyên liệu", accessor: "name", sortable: true },
    {
      header: "Lo",
      accessor: "batchNo",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.batchNo}
        </span>
      ),
    },
    { header: "Nhà cung cấp", accessor: "supplier" },
    {
      header: "Tồn kho",
      accessor: "quantity",
      sortable: true,
      render: (row) => {
        const isLow = row.quantity <= row.minStock;
        return (
          <span
            style={{
              fontWeight: 600,
              color: isLow ? "var(--danger)" : "var(--text-primary)",
            }}
          >
            {row.quantity} {row.unit}
          </span>
        );
      },
    },
    {
      header: "Tối thiểu",
      accessor: "minStock",
      render: (r) => `${r.minStock} ${r.unit}`,
    },
    {
      header: "Hạn SD",
      accessor: "expiryDate",
      sortable: true,
      render: (row) => {
        const expired = isExpired(row.expiryDate);
        const expiring = isExpiringSoon(row.expiryDate);
        return (
          <span
            style={{
              color: expired
                ? "var(--danger)"
                : expiring
                  ? "var(--warning)"
                  : "var(--text-primary)",
            }}
          >
            {formatDate(row.expiryDate)}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      render: (row) => {
        if (row.quantity <= row.minStock)
          return (
            <Badge variant="danger" dot>
              Cần bổ sung
            </Badge>
          );
        if (isExpiringSoon(row.expiryDate))
          return (
            <Badge variant="warning" dot>
              Sắp hết hạn
            </Badge>
          );
        return (
          <Badge variant="success" dot>
            Bình thường
          </Badge>
        );
      },
    },
  ];

  return (
    <PageWrapper
      title="Kho nguyên liệu"
      subtitle="Quản lý nguyên liệu đầu vào, hạn sử dụng và lô hàng"
    >
      <DataTable
        columns={columns}
        data={kitchenInventory}
        searchPlaceholder="Tìm nguyên liệu..."
      />
    </PageWrapper>
  );
}
