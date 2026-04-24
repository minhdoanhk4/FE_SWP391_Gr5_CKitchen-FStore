import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, RotateCcw, Eye, ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Drawer } from "../../components/ui";
import { Input } from "../../components/ui";
import kitchenService from "../../services/kitchenService";

const PAGE_SIZE = 20;

const STATUS_CONFIG = {
  ACTIVE:     { label: "Còn hàng", variant: "success" },   // backend primary value
  AVAILABLE:  { label: "Còn hàng", variant: "success" },   // fallback alias
  DEPLETED:   { label: "Hết hàng", variant: "neutral" },
  EXPIRED:    { label: "Hết hạn",  variant: "danger"  },
};

const STATUS_TABS = [
  { value: "",         label: "Tất cả"   },
  { value: "ACTIVE",   label: "Còn hàng" },
  { value: "DEPLETED", label: "Hết hàng" },
  { value: "EXPIRED",  label: "Hết hạn"  },
];

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

function isExpired(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function isExpiringSoon(date) {
  if (!date) return false;
  const diff = new Date(date) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

// ── Ingredient Combobox ─────────────────────────────────────────────────────
// Better UX than a search table: inline autocomplete that loads from /inventory
function IngredientCombobox({ value, onChange, label, error, placeholder = "Tìm nguyên liệu..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const containerRef = useRef(null);

  // Load full inventory list once (up to 200 items for dropdown)
  useEffect(() => {
    setLoadingOpts(true);
    kitchenService
      .getInventory({ size: 200 })
      .then((d) => setOptions(d.content || d || []))
      .catch(() => {})
      .finally(() => setLoadingOpts(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.ingredientId === value);
  const displayValue = open ? query : (selected ? selected.ingredientName : "");

  const filtered = options.filter((o) => {
    const q = query.toLowerCase();
    return (
      !q ||
      o.ingredientName?.toLowerCase().includes(q) ||
      o.ingredientId?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (opt) => {
    onChange(opt.ingredientId);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label className="input-label" style={{ display: "block", marginBottom: "6px" }}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          className={`input-field${error ? " input-field--error" : ""}`}
          style={{ paddingRight: "36px" }}
          placeholder={selected && !open ? "" : placeholder}
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
          {value ? (
            <X size={14} style={{ color: "var(--text-muted)", cursor: "pointer" }} onClick={handleClear} />
          ) : (
            <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>
      {error && <span className="input-error">{error}</span>}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface-card)",
            border: "1.5px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            zIndex: 100,
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {loadingOpts && (
            <div style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text-muted)" }}>
              Đang tải...
            </div>
          )}
          {!loadingOpts && filtered.length === 0 && (
            <div style={{ padding: "10px 14px", fontSize: "13px", color: "var(--text-muted)" }}>
              Không tìm thấy
            </div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.ingredientId}
              onMouseDown={() => handleSelect(opt)}
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                cursor: "pointer",
                background: opt.ingredientId === value ? "var(--primary-bg)" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover, var(--surface-sub))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = opt.ingredientId === value ? "var(--primary-bg)" : "transparent")}
            >
              <span>{opt.ingredientName}</span>
              <span style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: "12px" }}>
                {opt.ingredientId}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Batch Detail Drawer ─────────────────────────────────────────────────────
function BatchDetailDrawer({ batchId, isOpen, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !batchId) return;
    setDetail(null);
    setLoading(true);
    kitchenService
      .getIngredientBatchById(batchId)
      .then((d) => setDetail(d))
      .catch(() => toast.error("Không thể tải chi tiết lô"))
      .finally(() => setLoading(false));
  }, [batchId, isOpen]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Chi tiết lô: ${batchId}`}>
      {loading && (
        <p style={{ color: "var(--text-muted)", padding: "20px" }}>
          Đang tải...
        </p>
      )}
      {!loading && detail && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section>
            <h4
              style={{
                fontWeight: 600,
                marginBottom: "12px",
                fontSize: "14px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Thông tin lô
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[
                ["Mã lô", detail.id],
                ["Số lô (Batch No)", detail.batchNo || "—"],
                ["Nguyên liệu", detail.ingredientName || detail.ingredientId],
                ["Mã nguyên liệu", detail.ingredientId],
                ["Số lượng ban đầu", `${detail.quantity} ${detail.unit || ""}`],
                [
                  "Còn lại",
                  `${detail.remainingQuantity ?? detail.quantity} ${detail.unit || ""}`,
                ],
                ["Nhà cung cấp", detail.supplier || "—"],
                ["Giá nhập", formatCurrency(detail.importPrice)],
                ["Ngày hết hạn", formatDate(detail.expiryDate)],
                ["Nhập lúc", formatDateTime(detail.createdAt)],
                ["Cập nhật", formatDateTime(detail.updatedAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    fontSize: "14px",
                  }}
                >
                  <span
                    style={{ color: "var(--text-secondary)", flexShrink: 0 }}
                  >
                    {label}:
                  </span>
                  <span style={{ textAlign: "right" }}>{value}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
                  Trạng thái:
                </span>
                <Badge
                  variant={
                    isExpired(detail.expiryDate) &&
                    (detail.remainingQuantity ?? detail.quantity) > 0
                      ? "danger"
                      : (STATUS_CONFIG[detail.status] || { variant: "neutral" })
                          .variant
                  }
                  dot
                >
                  {isExpired(detail.expiryDate) &&
                  (detail.remainingQuantity ?? detail.quantity) > 0
                    ? "Hết hạn"
                    : (STATUS_CONFIG[detail.status] || { label: detail.status })
                        .label}
                </Badge>
              </div>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}

export default function IngredientBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterIngredientId, setFilterIngredientId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ingredientId: "",
    batchNo: "",
    quantity: "",
    expiryDate: "",
    supplier: "",
    importPrice: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getIngredientBatches({
        status: filterStatus || undefined,
        ingredientId: filterIngredientId || undefined,
        page,
        size: PAGE_SIZE,
      });
      setBatches(data.content || []);
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải lô nguyên liệu",
      );
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterIngredientId]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleOpenNew = () => {
    setForm({
      ingredientId: "",
      batchNo: "",
      quantity: "",
      expiryDate: "",
      supplier: "",
      importPrice: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.ingredientId.trim())
      errs.ingredientId = "Vui lòng nhập mã nguyên liệu";
    if (!form.batchNo.trim()) errs.batchNo = "Vui lòng nhập số lô";
    if (!form.quantity || parseFloat(form.quantity) <= 0)
      errs.quantity = "Vui lòng nhập số lượng hợp lệ";
    if (!form.expiryDate) errs.expiryDate = "Vui lòng chọn ngày hết hạn";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await kitchenService.createIngredientBatch({
        ingredientId: form.ingredientId.trim(),
        batchNo: form.batchNo.trim(),
        quantity: parseFloat(form.quantity),
        expiryDate: form.expiryDate,
        supplier: form.supplier || undefined,
        importPrice: form.importPrice
          ? parseFloat(form.importPrice)
          : undefined,
      });
      toast.success("Nhập lô nguyên liệu thành công");
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể nhập lô nguyên liệu",
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Mã lô",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.id}
        </span>
      ),
    },
    { header: "Số lô (Batch No)", accessor: "batchNo" },
    { header: "Nguyên liệu", accessor: "ingredientName" },
    {
      header: "Số lượng còn",
      render: (r) => `${r.remainingQuantity ?? r.quantity} ${r.unit || ""}`,
    },
    { header: "Nhà cung cấp", render: (r) => r.supplier || "—" },
    {
      header: "Hạn SD",
      render: (r) => {
        const expired = isExpired(r.expiryDate);
        const expiring = isExpiringSoon(r.expiryDate);
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
            {formatDate(r.expiryDate)}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      render: (r) => {
        if (isExpired(r.expiryDate) && (r.remainingQuantity ?? r.quantity) > 0)
          return (
            <Badge variant="danger" dot>
              Hết hạn
            </Badge>
          );
        const cfg = STATUS_CONFIG[r.status] || {
          label: r.status,
          variant: "neutral",
        };
        return (
          <Badge variant={cfg.variant} dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      header: "",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={Eye}
          title="Xem chi tiết"
          onClick={() => setSelectedBatchId(r.id)}
        />
      ),
    },
  ];

  return (
    <PageWrapper
      title="Lô nguyên liệu"
      subtitle="Quản lý các lô nguyên liệu nhập kho"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Nhập lô mới
        </Button>
      }
    >
      {/* Status pill tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilterStatus(tab.value); setPage(0); }}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: `1.5px solid ${filterStatus === tab.value ? "var(--primary)" : "var(--surface-border)"}`,
              background: filterStatus === tab.value ? "var(--primary-bg)" : "var(--surface-card)",
              color: filterStatus === tab.value ? "var(--primary)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ingredient combobox filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: "240px", flex: "1 1 240px", maxWidth: "320px" }}>
          <IngredientCombobox
            value={filterIngredientId}
            onChange={(id) => { setFilterIngredientId(id); setPage(0); }}
            placeholder="Lọc theo nguyên liệu..."
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={() => {
            setFilterStatus("");
            setFilterIngredientId("");
            setPage(0);
          }}
        >
          Đặt lại
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        loading={loading}
        searchable={false}
        emptyTitle="Không có lô nguyên liệu"
        emptyDesc="Chưa có lô nguyên liệu nào được nhập."
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          total: totalElements,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Create modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nhập lô nguyên liệu mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Nhập lô"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <IngredientCombobox
              label="Nguyên liệu"
              required
              value={form.ingredientId}
              onChange={(id) => setForm((f) => ({ ...f, ingredientId: id }))}
              error={errors.ingredientId}
              placeholder="Tìm và chọn nguyên liệu..."
            />
            <Input
              label="Số lô (Batch No)"
              required
              placeholder="VD: B-2024-001"
              value={form.batchNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, batchNo: e.target.value }))
              }
              error={errors.batchNo}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Số lượng"
              required
              type="number"
              min="0"
              placeholder="50"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              error={errors.quantity}
            />
            <Input
              label="Ngày hết hạn"
              required
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
              error={errors.expiryDate}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Nhà cung cấp"
              placeholder="Tên nhà cung cấp"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
            />
            <Input
              label="Giá nhập (VNĐ)"
              type="number"
              min="0"
              placeholder="0"
              value={form.importPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, importPrice: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      <BatchDetailDrawer
        batchId={selectedBatchId}
        isOpen={!!selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />
    </PageWrapper>
  );
}
