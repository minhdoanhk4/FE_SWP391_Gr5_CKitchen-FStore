import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Package,
  Layers,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Badge, Button, Drawer } from "../../components/ui";
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

function expiryColor(date, nearExpiry) {
  if (isExpired(date)) return "var(--danger)";
  if (isExpiringSoon(date) || nearExpiry) return "var(--warning)";
  return "var(--text-primary)";
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

  // Ingredient tab state
  const [inventory, setInventory] = useState([]);
  const [ingLoading, setIngLoading] = useState(true);
  const [ingPage, setIngPage] = useState(0);
  const [ingTotalPages, setIngTotalPages] = useState(0);
  const [ingTotalElements, setIngTotalElements] = useState(0);
  const [expandedIngIds, setExpandedIngIds] = useState(new Set());

  // Product tab state
  const [productInventory, setProductInventory] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodPage, setProdPage] = useState(0);
  const [prodTotalPages, setProdTotalPages] = useState(0);
  const [prodTotalElements, setProdTotalElements] = useState(0);
  const [expandedProdIds, setExpandedProdIds] = useState(new Set());
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

  // ── Toggle expand ──────────────────────────────────────────────────────────
  const toggleIngredient = (id) => {
    setExpandedIngIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProduct = (id) => {
    setExpandedProdIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const lowStockCount = inventory.filter((i) => i.lowStock).length;

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <PageWrapper
      title="Quản lý kho"
      subtitle="Xem tồn kho nguyên liệu và thành phẩm"
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
                  <th style={{ width: "32px" }} />
                  <th>Nguyên liệu</th>
                  <th>Mã NL</th>
                  <th>Tồn kho</th>
                  <th>Tối thiểu</th>
                  <th>Số lô</th>
                  <th>Hạn SD gần nhất</th>
                  <th>Trạng thái</th>
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
                  inventory.map((item) => {
                    const isExpanded = expandedIngIds.has(item.ingredientId || item.id);
                    const batches = item.batches || [];
                    const earliestExpiry = batches
                      .filter((b) => b.expiryDate)
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                      ?.expiryDate;
                    const hasNearExpiry = batches.some((b) => b.nearExpiry);

                    return (
                      <IngredientRow
                        key={item.ingredientId || item.id}
                        item={item}
                        isExpanded={isExpanded}
                        onToggle={() => toggleIngredient(item.ingredientId || item.id)}
                        batches={batches}
                        earliestExpiry={earliestExpiry}
                        hasNearExpiry={hasNearExpiry}
                      />
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
                  <th style={{ width: "32px" }} />
                  <th>Sản phẩm</th>
                  <th>Mã SP</th>
                  <th>Tồn kho</th>
                  <th>Số lô</th>
                  <th>Hạn SD gần nhất</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "40px" }} />
                </tr>
              </thead>
              <tbody>
                {prodLoading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="inv-loading">Đang tải...</div>
                    </td>
                  </tr>
                ) : productInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
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
                  productInventory.map((item) => {
                    const isExpanded = expandedProdIds.has(item.productId);
                    const batches = item.batches || [];
                    const earliestExpiry = batches
                      .filter((b) => b.expiryDate)
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                      ?.expiryDate;

                    return (
                      <ProductRow
                        key={item.productId}
                        item={item}
                        isExpanded={isExpanded}
                        onToggle={() => toggleProduct(item.productId)}
                        batches={batches}
                        earliestExpiry={earliestExpiry}
                        onViewDetail={() => setDrawerProduct(item)}
                      />
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

      {/* Product detail drawer */}
      <ProductDetailDrawer
        item={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INGREDIENT ROW (with expandable batch details)
// ═══════════════════════════════════════════════════════════════════════════════
function IngredientRow({ item, isExpanded, onToggle, batches, earliestExpiry, hasNearExpiry }) {
  return (
    <>
      <tr
        className={`inv-row ${isExpanded ? "inv-row--expanded" : ""} ${item.lowStock ? "inv-row--warning" : ""}`}
        onClick={onToggle}
        style={{ cursor: "pointer" }}
      >
        <td>
          <span className={`inv-expand-icon ${isExpanded ? "inv-expand-icon--open" : ""}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </td>
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
      </tr>

      {/* Expanded batch detail rows */}
      {isExpanded && batches.length > 0 && (
        <tr className="inv-expand-row">
          <td colSpan={8} style={{ padding: 0 }}>
            <div className="inv-batch-panel">
              <div className="inv-batch-panel__header">
                <Layers size={14} />
                Chi tiết {batches.length} lô — {item.ingredientName}
              </div>
              <div className="inv-batch-grid">
                {batches.map((b) => (
                  <div key={b.id} className="inv-batch-card">
                    <div className="inv-batch-card__top">
                      <div className="inv-batch-card__id">
                        <span className="font-mono">{b.batchNo || b.id}</span>
                        <StatusBadge status={b.status} expiryDate={b.expiryDate} nearExpiry={b.nearExpiry} />
                      </div>
                    </div>
                    <div className="inv-batch-card__body">
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">SL ban đầu</span>
                        <span>{formatQty(b.initialQuantity, b.unit)}</span>
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Còn lại</span>
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                          {formatQty(b.remainingQuantity, b.unit)}
                        </span>
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Hạn SD</span>
                        <ExpiryIndicator date={b.expiryDate} nearExpiry={b.nearExpiry} />
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Nhà cung cấp</span>
                        <span>{b.supplier || "—"}</span>
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Giá nhập</span>
                        <span>{formatCurrency(b.importPrice)}</span>
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Ngày nhập</span>
                        <span>{formatDate(b.importDate)}</span>
                      </div>
                      {b.notes && b.notes !== "null" && b.notes !== "string" && (
                        <div className="inv-batch-card__row">
                          <span className="inv-batch-card__label">Ghi chú</span>
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                            {b.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT ROW (with expandable batch details)
// ═══════════════════════════════════════════════════════════════════════════════
function ProductRow({ item, isExpanded, onToggle, batches, earliestExpiry, onViewDetail }) {
  const totalQty = item.totalRemainingQuantity ?? 0;

  return (
    <>
      <tr
        className={`inv-row ${isExpanded ? "inv-row--expanded" : ""} ${totalQty === 0 ? "inv-row--muted" : ""}`}
        onClick={onToggle}
        style={{ cursor: "pointer" }}
      >
        <td>
          <span className={`inv-expand-icon ${isExpanded ? "inv-expand-icon--open" : ""}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </td>
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
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail();
            }}
            title="Xem chi tiết đầy đủ"
          >
            <Eye size={16} />
          </button>
        </td>
      </tr>

      {/* Expanded batch detail rows */}
      {isExpanded && batches.length > 0 && (
        <tr className="inv-expand-row">
          <td colSpan={8} style={{ padding: 0 }}>
            <div className="inv-batch-panel">
              <div className="inv-batch-panel__header">
                <Layers size={14} />
                Chi tiết {batches.length} lô — {item.productName}
              </div>
              <div className="inv-batch-grid">
                {batches.map((b) => (
                  <div key={b.batchId || b.id} className="inv-batch-card">
                    <div className="inv-batch-card__top">
                      <div className="inv-batch-card__id">
                        <span className="font-mono">{b.batchId || b.id}</span>
                        <StatusBadge status={b.status} expiryDate={b.expiryDate} />
                      </div>
                    </div>
                    <div className="inv-batch-card__body">
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Còn lại</span>
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                          {formatQty(b.remainingQuantity, item.unit || "phần")}
                        </span>
                      </div>
                      <div className="inv-batch-card__row">
                        <span className="inv-batch-card__label">Hạn SD</span>
                        <ExpiryIndicator date={b.expiryDate} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
