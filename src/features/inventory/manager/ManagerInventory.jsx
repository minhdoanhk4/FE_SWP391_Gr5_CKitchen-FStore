import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import { useData } from "../../../contexts/DataContext";

export default function ManagerInventory() {
  const { kitchenInventory, formatDate, isExpiringSoon, isExpired } = useData();
  const kitchenColumns = [
    { header: "Nguyên liệu", accessor: "name", sortable: true },
    {
      header: "Lô",
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
        if (isExpired(row.expiryDate))
          return (
            <Badge variant="danger" dot>
              Hết hạn
            </Badge>
          );
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
      title="Tồn kho hệ thống"
      subtitle="Tổng quan tồn kho tất cả cửa hàng và kho nguyên liệu"
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          marginBottom: "var(--space-4)",
          color: "var(--text-primary)",
        }}
      >
        Kho nguyên liệu (Bếp trung tâm)
      </h3>
      <DataTable
        columns={kitchenColumns}
        data={kitchenInventory}
        searchPlaceholder="Tìm nguyên liệu..."
      />
    </PageWrapper>
  );
}
