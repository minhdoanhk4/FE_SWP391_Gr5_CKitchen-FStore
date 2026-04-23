import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge } from "../../components/ui";
import kitchenService from "../../services/kitchenService";

const PAGE_SIZE = 20;

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
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export default function KitchenInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getInventory({ page, size: PAGE_SIZE });
      setInventory(data.content || []);
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Không thể tải kho nguyên liệu",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const columns = [
    {
      header: "Nguyên liệu",
      accessor: "ingredientName",
      sortable: true,
    },
    {
      header: "Lô",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.batches?.[0]?.batchNo || "—"}
        </span>
      ),
    },
    {
      header: "Nhà cung cấp",
      render: (r) => r.batches?.[0]?.supplier || "—",
    },
    {
      header: "Tồn kho",
      accessor: "totalQuantity",
      sortable: true,
      render: (row) => (
        <span
          style={{
            fontWeight: 600,
            color: row.lowStock ? "var(--danger)" : "var(--text-primary)",
          }}
        >
          {row.totalQuantity} {row.unit}
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
      render: (row) => {
        const expiry = row.batches?.[0]?.expiryDate;
        const expired = isExpired(expiry);
        const expiring = isExpiringSoon(expiry);
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
            {formatDate(expiry)}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      render: (row) => {
        const expiry = row.batches?.[0]?.expiryDate;
        if (isExpired(expiry) && row.totalQuantity > 0)
          return (
            <Badge variant="danger" dot>
              Hết hạn
            </Badge>
          );
        if (row.lowStock)
          return (
            <Badge variant="danger" dot>
              Cần bổ sung
            </Badge>
          );
        if (isExpiringSoon(expiry))
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

  const lowStockCount = inventory.filter((i) => i.lowStock).length;

  return (
    <PageWrapper
      title="Kho nguyên liệu"
      subtitle="Xem tồn kho nguyên liệu, hạn sử dụng và lô hàng"
    >
      {lowStockCount > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
            fontSize: "14px",
            color: "var(--danger)",
          }}
        >
          {lowStockCount} nguyên liệu dưới mức tối thiểu.
        </div>
      )}

      <DataTable
        columns={columns}
        data={inventory}
        loading={loading}
        searchable={false}
        emptyTitle="Không có nguyên liệu"
        emptyDesc="Kho nguyên liệu trống."
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          total: totalElements,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />
    </PageWrapper>
  );
}
