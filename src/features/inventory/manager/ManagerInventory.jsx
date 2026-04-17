import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../../components/ui";
import managerService from "../../../services/managerService";

export default function ManagerInventory() {
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
    {
      header: "Nguyên liệu",
      accessor: "ingredientName",
      sortable: true,
      render: (r) => r.ingredientName ?? "—",
    },
    {
      header: "Mã NL",
      accessor: "ingredientId",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.ingredientId}
        </span>
      ),
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

  const storeColumns = [
    {
      header: "Sản phẩm",
      accessor: "productName",
      sortable: true,
      render: (r) => r.productName ?? "—",
    },
    {
      header: "Mã SP",
      accessor: "productId",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.productId}
        </span>
      ),
    },
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
