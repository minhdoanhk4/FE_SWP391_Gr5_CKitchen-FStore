import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Package,
  Layers,
  Eye,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Badge, Button, Drawer, Input } from "../../components/ui";
import kitchenService from "../../services/kitchenService";
import "./Inventory.css";

const PAGE_SIZE = 20;

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

function formatCurrency(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v);
}

function formatQty(qty, unit) {
  if (qty == null) return "—";
  return `${Number(qty).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${unit || ""}`;
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

function daysUntilExpiry(date) {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function StatusBadge({ status, expiryDate, nearExpiry, lowStock }) {
  if (isExpired(expiryDate))
    return (
      <Badge variant="danger" dot>
        Hết hạn
      </Badge>
    );
  if (lowStock)
    return (
      <Badge variant="danger" dot>
        Cần bổ sung
      </Badge>
    );
  if (isExpiringSoon(expiryDate) || nearExpiry)
    return (
      <Badge variant="warning" dot>
        Sắp hết hạn
      </Badge>
    );

  const statusMap = {
    ACTIVE: { label: "Còn hàng", variant: "success" },
    AVAILABLE: { label: "Có hàng", variant: "success" },
    DEPLETED: { label: "Hết hàng", variant: "neutral" },
    EXPIRED: { label: "Hết hạn", variant: "danger" },
  };
  const cfg = statusMap[status] || { label: status || "Bình thường", variant: "success" };
  return (
    <Badge variant={cfg.variant} dot>
      {cfg.label}
    </Badge>
  );
}

// ── Expiry indicator pill ────────────────────────────────────────────────────
function ExpiryIndicator({ date, nearExpiry }) {
  const days = daysUntilExpiry(date);
  if (days == null) return <span style={{ color: "var(--text-muted)" }}>—</span>;

  const expired = days < 0;
  const soon = (days >= 0 && days <= 7) || nearExpiry;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: expired
          ? "var(--danger)"
          : soon
            ? "var(--warning)"
            : "var(--text-primary)",
        fontWeight: expired || soon ? 600 : 400,
      }}
    >
      {expired && <AlertTriangle size={12} />}
      {formatDate(date)}
      {!expired && days <= 30 && (
        <span
          style={{
            fontSize: "11px",
            color: soon ? "var(--warning)" : "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          ({days}d)
        </span>
      )}
    </span>
  );
}

// ── TAB STYLES ───────────────────────────────────────────────────────────────
const TAB_STYLES = {
  base: {
    padding: "8px 20px",
    borderRadius: "var(--radius-full)",
    border: "1.5px solid var(--surface-border)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 200ms ease",
    background: "var(--surface-card)",
    color: "var(--text-secondary)",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  active: {
    background: "var(--primary-bg)",
    color: "var(--primary)",
    borderColor: "var(--primary)",
  },
};

// ── Simple pagination ────────────────────────────────────────────────────────
function SimplePagination({ page, totalPages, totalElements, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);
  return (
    <div className="inv-pagination">
      <span className="inv-pagination__info">
        Hiển thị {start}–{end} / {totalElements}
      </span>
      <div className="inv-pagination__controls">
        <button
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="inv-pagination__btn"
        >
          ‹ Trước
        </button>
        <span className="inv-pagination__page">
          Trang {page + 1} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="inv-pagination__btn"
        >
          Sau ›
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INGREDIENT DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function IngredientDetailDrawer({ item, isOpen, onClose }) {
  if (!item) return null;

  const batches = item.batches || [];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={item.ingredientName || "Chi tiết nguyên liệu"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Summary */}
        <section>
          <h4 className="inv-drawer-section-title">Thông tin tổng quan</h4>
          <div className="inv-drawer-info-grid">
            {[
              ["Mã nguyên liệu", item.ingredientId],
              ["Tên nguyên liệu", item.ingredientName],
              ["Tồn kho", formatQty(item.totalQuantity, item.unit)],
              ["Tối thiểu", formatQty(item.minStock, item.unit)],
              ["Số lô", `${batches.length} lô`],
              ["Trạng thái", item.lowStock ? "⚠️ Dưới mức tối thiểu" : "✅ Bình thường"],
            ].map(([label, value]) => (
              <div key={label} className="inv-drawer-info-row">
                <span className="inv-drawer-info-label">{label}:</span>
                <span className="inv-drawer-info-value">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Batch list */}
        {batches.length > 0 && (
          <section>
            <h4 className="inv-drawer-section-title">
              Chi tiết lô ({batches.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {batches.map((b) => (
                <div key={b.id || b.batchNo} className="inv-drawer-batch-card">
                  <div className="inv-drawer-batch-header">
                    <span className="font-mono" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {b.batchNo || b.id}
                    </span>
                    <StatusBadge status={b.status} expiryDate={b.expiryDate} nearExpiry={b.nearExpiry} />
                  </div>
                  <div className="inv-drawer-batch-details">
                    <div>
                      <span className="inv-drawer-detail-label">SL ban đầu:</span>{" "}
                      <strong>{formatQty(b.initialQuantity, b.unit || item.unit)}</strong>
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Còn lại:</span>{" "}
                      <strong style={{ color: "var(--primary)" }}>
                        {formatQty(b.remainingQuantity, b.unit || item.unit)}
                      </strong>
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Hạn SD:</span>{" "}
                      <ExpiryIndicator date={b.expiryDate} nearExpiry={b.nearExpiry} />
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Nhà cung cấp:</span>{" "}
                      {b.supplier || "—"}
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Giá nhập:</span>{" "}
                      {formatCurrency(b.importPrice)}
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Ngày nhập:</span>{" "}
                      {formatDate(b.importDate)}
                    </div>
                    {b.notes && b.notes !== "null" && b.notes !== "string" && (
                      <div>
                        <span className="inv-drawer-detail-label">Ghi chú:</span>{" "}
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                          {b.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function ProductDetailDrawer({ item, isOpen, onClose }) {
  if (!item) return null;

  const batches = item.batches || [];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={item.productName || "Chi tiết sản phẩm"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Summary */}
        <section>
          <h4 className="inv-drawer-section-title">Thông tin tổng quan</h4>
          <div className="inv-drawer-info-grid">
            {[
              ["Mã sản phẩm", item.productId],
              ["Tên sản phẩm", item.productName],
              ["Tồn kho", formatQty(item.totalRemainingQuantity, item.unit)],
              ["Số lô", `${batches.length} lô`],
            ].map(([label, value]) => (
              <div key={label} className="inv-drawer-info-row">
                <span className="inv-drawer-info-label">{label}:</span>
                <span className="inv-drawer-info-value">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Batch list */}
        {batches.length > 0 && (
          <section>
            <h4 className="inv-drawer-section-title">
              Chi tiết lô ({batches.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {batches.map((b) => (
                <div key={b.batchId || b.id} className="inv-drawer-batch-card">
                  <div className="inv-drawer-batch-header">
                    <span className="font-mono" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {b.batchId || b.id}
                    </span>
                    <StatusBadge status={b.status} expiryDate={b.expiryDate} />
                  </div>
                  <div className="inv-drawer-batch-details">
                    <div>
                      <span className="inv-drawer-detail-label">Còn lại:</span>{" "}
                      <strong>{formatQty(b.remainingQuantity, item.unit)}</strong>
                    </div>
                    <div>
                      <span className="inv-drawer-detail-label">Hạn SD:</span>{" "}
                      <ExpiryIndicator date={b.expiryDate} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function KitchenInventory() {
  const [tab, setTab] = useState("ingredient"); // "ingredient" | "product"
  const [searchTerm, setSearchTerm] = useState("");

  // Ingredient tab state
  const [inventory, setInventory] = useState([]);
  const [ingLoading, setIngLoading] = useState(true);
  const [ingPage, setIngPage] = useState(0);
  const [ingTotalPages, setIngTotalPages] = useState(0);
  const [ingTotalElements, setIngTotalElements] = useState(0);
  const [drawerIngredient, setDrawerIngredient] = useState(null);

  // Product tab state
  const [productInventory, setProductInventory] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodPage, setProdPage] = useState(0);
  const [prodTotalPages, setProdTotalPages] = useState(0);
  const [prodTotalElements, setProdTotalElements] = useState(0);
  const [drawerProduct, setDrawerProduct] = useState(null);

  // ── Fetch ingredient inventory ─────────────────────────────────────────────
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

  // ── Fetch product inventory ────────────────────────────────────────────────
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

  const lowStockCount = inventory.filter((i) => i.lowStock).length;

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <PageWrapper
      title="Quản lý kho"
      subtitle="Xem tồn kho nguyên liệu và thành phẩm"
      actions={
        <div style={{ width: "250px" }}>
           <Input 
             placeholder={tab === "ingredient" ? "Tìm nguyên liệu..." : "Tìm thành phẩm..."}
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
             icon={Search}
           />
        </div>
      }
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { key: "ingredient", label: "Nguyên liệu", icon: Package },
          { key: "product", label: "Thành phẩm", icon: Layers },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            style={{
              ...TAB_STYLES.base,
              ...(tab === key ? TAB_STYLES.active : {}),
            }}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── INGREDIENT TAB ──────────────────────────────────────────────────── */}
      {tab === "ingredient" && (
        <>
          {lowStockCount > 0 && (
            <div className="inv-alert inv-alert--danger">
              <AlertTriangle size={16} />
              {lowStockCount} nguyên liệu dưới mức tối thiểu — cần bổ sung ngay.
            </div>
          )}

          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Nguyên liệu</th>
                  <th>Mã NL</th>
                  <th>Tồn kho</th>
                  <th>Tối thiểu</th>
                  <th>Số lô</th>
                  <th>Hạn SD gần nhất</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "60px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ingLoading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="inv-loading">Đang tải...</div>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="inv-empty">
                        <Package size={40} style={{ opacity: 0.3 }} />
                        <p style={{ fontWeight: 600 }}>Không có nguyên liệu</p>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          Kho nguyên liệu trống.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventory.filter((i) => i.ingredientName?.toLowerCase().includes(searchTerm.toLowerCase()) || i.ingredientId?.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                    const batches = item.batches || [];
                    const earliestExpiry = batches
                      .filter((b) => b.expiryDate)
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                      ?.expiryDate;
                    const hasNearExpiry = batches.some((b) => b.nearExpiry);

                    return (
                      <tr
                        key={item.ingredientId || item.id}
                        className={`inv-row ${item.lowStock ? "inv-row--warning" : ""}`}
                      >
                        <td>
                          <span style={{ fontWeight: 600 }}>{item.ingredientName}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {item.ingredientId}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: item.lowStock ? "var(--danger)" : "var(--text-primary)",
                            }}
                          >
                            {formatQty(item.totalQuantity, item.unit)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {formatQty(item.minStock, item.unit)}
                          </span>
                        </td>
                        <td>
                          <span className="inv-batch-count">
                            <Layers size={12} />
                            {batches.length} lô
                          </span>
                        </td>
                        <td>
                          <ExpiryIndicator date={earliestExpiry} nearExpiry={hasNearExpiry} />
                        </td>
                        <td>
                          <StatusBadge
                            expiryDate={earliestExpiry}
                            nearExpiry={hasNearExpiry}
                            lowStock={item.lowStock}
                          />
                        </td>
                        <td>
                          <button
                            className="inv-view-btn"
                            onClick={() => setDrawerIngredient(item)}
                            title="Xem chi tiết đầy đủ"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <SimplePagination
            page={ingPage}
            totalPages={ingTotalPages}
            totalElements={ingTotalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setIngPage}
          />
        </>
      )}

      {/* ── PRODUCT TAB ─────────────────────────────────────────────────────── */}
      {tab === "product" && (
        <>
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Mã SP</th>
                  <th>Tồn kho</th>
                  <th>Số lô</th>
                  <th>Hạn SD gần nhất</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "60px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {prodLoading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="inv-loading">Đang tải...</div>
                    </td>
                  </tr>
                ) : productInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="inv-empty">
                        <Layers size={40} style={{ opacity: 0.3 }} />
                        <p style={{ fontWeight: 600 }}>Không có thành phẩm</p>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          Kho thành phẩm trống.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productInventory.filter((i) => i.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || i.productId?.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                    const totalQty = item.totalRemainingQuantity ?? 0;
                    const batches = item.batches || [];
                    const earliestExpiry = batches
                      .filter((b) => b.expiryDate)
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                      ?.expiryDate;

                    return (
                      <tr
                        key={item.productId}
                        className={`inv-row ${totalQty === 0 ? "inv-row--muted" : ""}`}
                      >
                        <td>
                          <span style={{ fontWeight: 600 }}>{item.productName}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {item.productId}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: totalQty === 0 ? "var(--danger)" : "var(--text-primary)",
                            }}
                          >
                            {formatQty(totalQty, item.unit || "phần")}
                          </span>
                        </td>
                        <td>
                          <span className="inv-batch-count">
                            <Layers size={12} />
                            {batches.length} lô
                          </span>
                        </td>
                        <td>
                          <ExpiryIndicator date={earliestExpiry} />
                        </td>
                        <td>
                          {totalQty === 0 ? (
                            <Badge variant="neutral" dot>
                              Hết hàng
                            </Badge>
                          ) : isExpired(earliestExpiry) ? (
                            <Badge variant="danger" dot>
                              Hết hạn
                            </Badge>
                          ) : isExpiringSoon(earliestExpiry) ? (
                            <Badge variant="warning" dot>
                              Sắp hết hạn
                            </Badge>
                          ) : (
                            <Badge variant="success" dot>
                              Có hàng
                            </Badge>
                          )}
                        </td>
                        <td>
                          <button
                            className="inv-view-btn"
                            onClick={() => setDrawerProduct(item)}
                            title="Xem chi tiết đầy đủ"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <SimplePagination
            page={prodPage}
            totalPages={prodTotalPages}
            totalElements={prodTotalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setProdPage}
          />
        </>
      )}

      {/* Ingredient detail drawer */}
      <IngredientDetailDrawer
        item={drawerIngredient}
        isOpen={!!drawerIngredient}
        onClose={() => setDrawerIngredient(null)}
      />

      {/* Product detail drawer */}
      <ProductDetailDrawer
        item={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />
    </PageWrapper>
  );
}
