import { useLocation } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export default function StoreInventory() {
  const { user } = useAuth();
  const { storeInventory, formatDate, isExpiringSoon, isExpired } = useData();
  const location = useLocation();

  // If rendered under /store, filter by user's store. Under /manager, show all.
  const isManagerView = location.pathname.startsWith("/manager");
  const data = isManagerView
    ? storeInventory
    : storeInventory.filter((i) => i.storeId === user.store);

  const columns = [
    { header: "Sản phẩm", accessor: "productName", sortable: true },
    {
      header: "Mã SP",
      accessor: "productId",
      width: "80px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.productId}
        </span>
      ),
    },
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
              color: isLow
                ? "var(--danger)"
                : row.quantity === 0
                  ? "var(--danger)"
                  : "var(--text-primary)",
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

  return (
    <PageWrapper
      title="Tồn kho cửa hàng"
      subtitle="Theo dõi số lượng tồn kho và hạn sử dụng tại cửa hàng"
    >
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Tìm sản phẩm..."
        emptyTitle="Chưa có dữ liệu tồn kho"
      />
    </PageWrapper>
  );
}
