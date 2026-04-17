import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import { useData } from "../../../contexts/DataContext";
import managerService from "../../../services/managerService";

export default function ManagerInventory() {
  const { formatDate, isExpiringSoon, isExpired } = useData();

  const [kitchenStock, setKitchenStock] = useState([]);
  const [storeStock, setStoreStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.dashboard.getKitchenLowStock(),
      managerService.dashboard.getStoreLowStock(),
    ])
      .then(([kitchen, store]) => {
        if (!mounted) return;
        setKitchenStock(
          Array.isArray(kitchen) ? kitchen : (kitchen?.content ?? []),
        );
        setStoreStock(Array.isArray(store) ? store : (store?.content ?? []));
      })
      .catch(() => { if (mounted) toast.error("Không thể tải dữ liệu tồn kho"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const kitchenColumns = [
    { header: "Nguyên liệu", accessor: "name", sortable: true },
    {
      header: "Lô",
      accessor: "batchNo",
      render: (r) =>
        r.batchNo ? (
          <span className="font-mono" style={{ fontSize: "12px" }}>
            {r.batchNo}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        ),
    },
    {
      header: "Nhà cung cấp",
      accessor: "supplier",
      render: (r) => r.supplier ?? "—",
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
      render: (r) => (r.minStock != null ? `${r.minStock} ${r.unit}` : "—"),
    },
    {
      header: "Hạn SD",
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
      render: (row) => {
        if (row.expiryDate && isExpired(row.expiryDate))
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
        if (row.expiryDate && isExpiringSoon(row.expiryDate))
          return (
            <Badge variant="warning" dot>
              Sắp hết hạn
            </Badge>
          );
        return (
          <Badge variant="warning" dot>
            Tồn kho thấp
          </Badge>
        );
      },
    },
  ];

  const storeColumns = [
    { header: "Sản phẩm", accessor: "name", sortable: true },
    {
      header: "Cửa hàng",
      accessor: "storeName",
      render: (r) => r.storeName ?? "—",
    },
    {
      header: "Tồn kho",
      accessor: "quantity",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--danger)" }}>
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      header: "Tối thiểu",
      accessor: "minStock",
      render: (r) => (r.minStock != null ? `${r.minStock} ${r.unit}` : "—"),
    },
    {
      header: "Trạng thái",
      render: () => (
        <Badge variant="danger" dot>
          Cần bổ sung
        </Badge>
      ),
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
        Kho nguyên liệu (Bếp trung tâm) — cần bổ sung{" "}
        {kitchenStock.length > 0 && `(${kitchenStock.length})`}
      </h3>
      <DataTable
        columns={kitchenColumns}
        data={kitchenStock}
        loading={loading}
        searchPlaceholder="Tìm nguyên liệu..."
      />

      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          margin: "var(--space-6) 0 var(--space-4)",
          color: "var(--text-primary)",
        }}
      >
        Tồn kho cửa hàng — cần bổ sung{" "}
        {storeStock.length > 0 && `(${storeStock.length})`}
      </h3>
      <DataTable
        columns={storeColumns}
        data={storeStock}
        loading={loading}
        searchPlaceholder="Tìm sản phẩm..."
      />
    </PageWrapper>
  );
}
