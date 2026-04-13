import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import { useData } from "../../../contexts/DataContext";

export default function ManagerInventory() {
  const {
    storeInventory,
    kitchenInventory,
    stores,
    formatDate,
    isExpiringSoon,
    isExpired,
  } = useData();

  // Enrich store inventory with store name
  const enrichedStoreInv = storeInventory.map((item) => {
    const store = stores.find((s) => s.id === item.storeId);
    return { ...item, storeName: store ? store.name : item.storeId };
  });

  const storeColumns = [
    {
      header: "Cửa hàng",
      accessor: "storeName",
      sortable: true,
    },
    { header: "Sản phẩm", accessor: "productName", sortable: true },
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
      header: "Mức tối thiểu",
      accessor: "minStock",
      render: (r) => `${r.minStock} ${r.unit}`,
    },
    {
      header: "Hạn sử dụng",
      accessor: "expiryDate",
      sortable: true,
      render: (row) => {
        if (!row.expiryDate)
          return <span style={{ color: "var(--text-muted)" }}>—</span>;
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
      accessor: "status",
      render: (row) => {
        if (row.quantity === 0)
          return (
            <Badge variant="danger" dot>
              Hết hàng
            </Badge>
          );
        if (row.quantity <= row.minStock)
          return (
            <Badge variant="warning" dot>
              Sắp hết
            </Badge>
          );
        return (
          <Badge variant="success" dot>
            Đủ hàng
          </Badge>
        );
      },
    },
  ];

  const kitchenColumns = [
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
      title="Tồn kho hệ thống"
      subtitle="Tổng quan tồn kho tất cả cửa hàng và kho nguyên liệu"
    >
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
            color: "var(--text-primary)",
          }}
        >
          Tồn kho cửa hàng
        </h3>
        <DataTable
          columns={storeColumns}
          data={enrichedStoreInv}
          searchPlaceholder="Tìm sản phẩm, cửa hàng..."
        />
      </div>

      <div>
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
      </div>
    </PageWrapper>
  );
}
