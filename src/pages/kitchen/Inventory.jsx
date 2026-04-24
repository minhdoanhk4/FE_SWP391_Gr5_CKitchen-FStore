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

const TAB_STYLES = {
  base: {
    padding: "8px 20px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.15s",
    background: "transparent",
    color: "var(--text-secondary)",
  },
  active: {
    background: "var(--primary)",
    color: "#fff",
    borderColor: "var(--primary)",
  },
};

export default function KitchenInventory() {
  const [tab, setTab] = useState("ingredient"); // "ingredient" | "product"

  // Ingredient tab state
  const [inventory, setInventory] = useState([]);
  const [ingLoading, setIngLoading] = useState(true);
  const [ingPage, setIngPage] = useState(0);
  const [ingTotalPages, setIngTotalPages] = useState(0);
  const [ingTotalElements, setIngTotalElements] = useState(0);

  // Product tab state
  const [productInventory, setProductInventory] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodPage, setProdPage] = useState(0);
  const [prodTotalPages, setProdTotalPages] = useState(0);
  const [prodTotalElements, setProdTotalElements] = useState(0);

  // ── Ingredient inventory ──────────────────────────────────────────────────
  const fetchIngredients = useCallback(async () => {
    setIngLoading(true);
    try {
      const data = await kitchenService.getInventory({
        page: ingPage,
        size: PAGE_SIZE,
      });
      setInventory(data.content || []);
      setIngTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setIngTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải kho nguyên liệu",
      );
    } finally {
      setIngLoading(false);
    }
  }, [ingPage]);

  useEffect(() => {
    if (tab === "ingredient") fetchIngredients();
  }, [fetchIngredients, tab]);

  // ── Product inventory ─────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const data = await kitchenService.getProductInventory({
        page: prodPage,
        size: PAGE_SIZE,
      });
      setProductInventory(data.content || []);
      setProdTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setProdTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải kho thành phẩm",
      );
    } finally {
      setProdLoading(false);
    }
  }, [prodPage]);

  useEffect(() => {
    if (tab === "product") fetchProducts();
  }, [fetchProducts, tab]);

  // ── Ingredient columns ────────────────────────────────────────────────────
  const ingredientColumns = [
    { header: "Nguyên liệu", accessor: "ingredientName", sortable: true },
    {
      header: "Lô",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.batches?.[0]?.batchNo || "—"}
        </span>
      ),
    },
    { header: "Nhà cung cấp", render: (r) => r.batches?.[0]?.supplier || "—" },
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

  // ── Product columns ───────────────────────────────────────────────────────
  const productColumns = [
    { header: "Sản phẩm", accessor: "productName", sortable: true },
    {
      header: "Mã SP",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.productId}
        </span>
      ),
    },
    {
      header: "Tồn kho",
      accessor: "totalQuantity",
      sortable: true,
      render: (row) => (
        <span
          style={{
            fontWeight: 600,
            color:
              row.totalQuantity === 0 ? "var(--danger)" : "var(--text-primary)",
          }}
        >
          {row.totalQuantity} {row.unit || "cái"}
        </span>
      ),
    },
    {
      header: "Lô gần nhất hết hạn",
      render: (r) => {
        const expiry = r.nearestExpiryDate || r.batches?.[0]?.expiryDate;
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
        if (row.totalQuantity === 0)
          return (
            <Badge variant="neutral" dot>
              Hết hàng
            </Badge>
          );
        const expiry = row.nearestExpiryDate || row.batches?.[0]?.expiryDate;
        if (isExpired(expiry))
          return (
            <Badge variant="danger" dot>
              Hết hạn
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
            Có hàng
          </Badge>
        );
      },
    },
  ];

  const lowStockCount = inventory.filter((i) => i.lowStock).length;

  return (
    <PageWrapper
      title="Quản lý kho"
      subtitle="Xem tồn kho nguyên liệu và thành phẩm"
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { key: "ingredient", label: "Nguyên liệu" },
          { key: "product", label: "Thành phẩm" },
        ].map(({ key, label }) => (
          <button
            key={key}
            style={{
              ...TAB_STYLES.base,
              ...(tab === key ? TAB_STYLES.active : {}),
            }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ingredient tab */}
      {tab === "ingredient" && (
        <>
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
            columns={ingredientColumns}
            data={inventory}
            loading={ingLoading}
            searchable={false}
            emptyTitle="Không có nguyên liệu"
            emptyDesc="Kho nguyên liệu trống."
            serverPagination={{
              page: ingPage,
              pageSize: PAGE_SIZE,
              total: ingTotalElements,
              totalPages: ingTotalPages,
              onPageChange: (p) => setIngPage(p),
            }}
          />
        </>
      )}

      {/* Product tab */}
      {tab === "product" && (
        <DataTable
          columns={productColumns}
          data={productInventory}
          loading={prodLoading}
          searchable={false}
          emptyTitle="Không có thành phẩm"
          emptyDesc="Kho thành phẩm trống."
          serverPagination={{
            page: prodPage,
            pageSize: PAGE_SIZE,
            total: prodTotalElements,
            totalPages: prodTotalPages,
            onPageChange: (p) => setProdPage(p),
          }}
        />
      )}
    </PageWrapper>
  );
}
