import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button } from "../../components/ui";
import kitchenService from "../../services/kitchenService";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function isExpired(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function isExpiringSoon(date) {
  if (!date) return false;
  const diff = new Date(date) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
}

export default function KitchenInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getInventory({
        ingredientName: search || undefined,
        page,
        size: 20,
      });
      setInventory(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tải kho nguyên liệu");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const columns = [
    {
      header: "Nguyên liệu",
      accessor: "ingredientName",
      sortable: true,
    },
    {
      header: "Lô",
      accessor: "batchNo",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>{r.batchNo || "—"}</span>
      ),
    },
    {
      header: "Nhà cung cấp",
      accessor: "supplier",
      render: (r) => r.supplier || "—",
    },
    {
      header: "Tồn kho",
      accessor: "quantity",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: row.lowStock ? "var(--danger)" : "var(--text-primary)" }}>
          {row.quantity} {row.unit}
        </span>
      ),
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
          <span style={{ color: expired ? "var(--danger)" : expiring ? "var(--warning)" : "var(--text-primary)" }}>
            {formatDate(row.expiryDate)}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      render: (row) => {
        if (isExpired(row.expiryDate) && row.quantity > 0)
          return <Badge variant="danger" dot>Hết hạn</Badge>;
        if (row.lowStock)
          return <Badge variant="danger" dot>Cần bổ sung</Badge>;
        if (isExpiringSoon(row.expiryDate))
          return <Badge variant="warning" dot>Sắp hết hạn</Badge>;
        return <Badge variant="success" dot>Bình thường</Badge>;
      },
    },
  ];

  const lowStockCount = inventory.filter((i) => i.lowStock).length;

  return (
    <PageWrapper
      title="Kho nguyên liệu"
      subtitle="Xem tồn kho nguyên liệu, hạn sử dụng và lô hàng"
    >
      {lowStockCount > 0 && (
        <div style={{
          padding: "12px 16px",
          background: "var(--danger-bg, #fef2f2)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius-md)",
          marginBottom: "16px",
          fontSize: "14px",
          color: "var(--danger)",
        }}>
          {lowStockCount} nguyên liệu dưới mức tối thiểu.
        </div>
      )}

      <DataTable
        columns={columns}
        data={inventory}
        loading={loading}
        searchPlaceholder="Tìm nguyên liệu..."
        emptyTitle="Không có nguyên liệu"
        emptyDesc="Kho nguyên liệu trống."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span style={{ lineHeight: "32px", fontSize: "13px", color: "var(--text-secondary)" }}>Trang {page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}
    </PageWrapper>
  );
}
