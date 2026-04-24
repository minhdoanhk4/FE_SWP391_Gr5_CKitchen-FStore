import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Search, Edit } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Drawer, Modal } from "../../components/ui";
import { Input } from "../../components/ui";
import kitchenService from "../../services/kitchenService";

const PAGE_SIZE = 20;

const STATUS_CONFIG = {
  AVAILABLE: { label: "Còn hàng", variant: "success" },
  PART_DIST: { label: "Phân phối một phần", variant: "warning" },
  DISTRIBUTED: { label: "Đã phân phối", variant: "primary" },
  DEPLETED: { label: "Hết hàng", variant: "neutral" },
  EXPIRED: { label: "Hết hạn", variant: "danger" },
};

const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "AVAILABLE", label: "Còn hàng" },
  { value: "PART_DIST", label: "Phân phối một phần" },
  { value: "DISTRIBUTED", label: "Đã phân phối" },
  { value: "DEPLETED", label: "Hết hàng" },
  { value: "EXPIRED", label: "Hết hạn" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
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

// ── Batch Detail Drawer ─────────────────────────────────────────────────────
function BatchDetailDrawer({ batchId, isOpen, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !batchId) return;
    setLoading(true);
    kitchenService
      .getProductBatchById(batchId)
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
          {/* Basic info */}
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
                ["Sản phẩm", detail.productName || detail.productId],
                [
                  "Số lượng ban đầu",
                  `${detail.quantity} ${detail.unit || "cái"}`,
                ],
                [
                  "Còn lại",
                  `${detail.remainingQuantity ?? detail.quantity} ${detail.unit || "cái"}`,
                ],
                ["Ngày hết hạn", formatDate(detail.expiryDate)],
                ["Tạo lúc", formatDateTime(detail.createdAt)],
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
                    (STATUS_CONFIG[detail.status] || { variant: "neutral" })
                      .variant
                  }
                  dot
                >
                  {
                    (STATUS_CONFIG[detail.status] || { label: detail.status })
                      .label
                  }
                </Badge>
              </div>
            </div>
          </section>

          {/* Ingredient traceability */}
          {detail.ingredientBatchUsages?.length > 0 && (
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
                Truy vết nguyên liệu ({detail.ingredientBatchUsages.length} lô)
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {detail.ingredientBatchUsages.map((usage, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      fontSize: "13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {usage.ingredientName || usage.ingredientId}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: "var(--text-muted)", fontSize: "12px" }}
                      >
                        {usage.batchId}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span>
                        Đã dùng:{" "}
                        <strong>
                          {usage.quantityUsed ?? usage.usedQuantity} {usage.unit || ""}
                        </strong>
                      </span>
                      <span>Lô số: {usage.batchNo || "—"}</span>
                    </div>
                    {usage.expiryDate && (
                      <span
                        style={{
                          color: isExpired(usage.expiryDate)
                            ? "var(--danger)"
                            : isExpiringSoon(usage.expiryDate)
                              ? "var(--warning)"
                              : "var(--text-muted)",
                        }}
                      >
                        Hạn SD: {formatDate(usage.expiryDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {detail.notes && (
            <div
              style={{
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              💬 {detail.notes}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProductBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    expiryDate: "",
    status: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getProductBatches({
        status: filterStatus || undefined,
        page,
        size: PAGE_SIZE,
      });
      setBatches(data.content || []);
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải lô thành phẩm");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const openEdit = (batch) => {
    setEditTarget(batch);
    setEditForm({
      expiryDate: batch.expiryDate ? batch.expiryDate.slice(0, 10) : "",
      status: batch.status || "",
      notes: batch.notes || "",
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await kitchenService.updateProductBatch(editTarget.id, {
        expiryDate: editForm.expiryDate || undefined,
        status: editForm.status || undefined,
        notes: editForm.notes || undefined,
      });
      toast.success("Đã cập nhật lô thành phẩm");
      setEditTarget(null);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật lô");
    } finally {
      setEditSaving(false);
    }
  };

  const columns = [
    {
      header: "Mã lô",
      render: (r) => (
        <span
          className="font-mono"
          style={{
            fontSize: "12px",
            color: "var(--primary)",
            cursor: "pointer",
          }}
          onClick={() => setSelectedBatchId(r.id)}
        >
          {r.id}
        </span>
      ),
    },
    { header: "Sản phẩm", accessor: "productName" },
    {
      header: "SL còn lại",
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {r.remainingQuantity ?? r.quantity} / {r.quantity} {r.unit || "cái"}
        </span>
      ),
    },
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
    { header: "Tạo lúc", render: (r) => formatDateTime(r.createdAt) },
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
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Search}
            title="Truy vết nguồn gốc"
            onClick={() => setSelectedBatchId(r.id)}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Edit}
            title="Sửa"
            onClick={() => openEdit(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Lô thành phẩm"
      subtitle="Danh sách các lô bánh đã sản xuất — click Truy vết để xem nguồn gốc nguyên liệu"
    >
      {/* Status pill tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setFilterStatus(tab.value);
              setPage(0);
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: `1.5px solid ${filterStatus === tab.value ? "var(--primary)" : "var(--surface-border)"}`,
              background:
                filterStatus === tab.value
                  ? "var(--primary-bg)"
                  : "var(--surface-card)",
              color:
                filterStatus === tab.value
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {tab.label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={() => {
            setFilterStatus("");
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
        emptyTitle="Không có lô thành phẩm"
        emptyDesc="Chưa có lô thành phẩm nào."
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          total: totalElements,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      <BatchDetailDrawer
        batchId={selectedBatchId}
        isOpen={!!selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Sửa lô: ${editTarget?.id || ""}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              Hủy
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Ngày hết hạn"
            type="date"
            value={editForm.expiryDate}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, expiryDate: e.target.value }))
            }
          />
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Trạng thái
            </label>
            <select
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">-- Giữ nguyên --</option>
              <option value="AVAILABLE">Còn hàng</option>
              <option value="PART_DIST">Phân phối một phần</option>
              <option value="DISTRIBUTED">Đã phân phối</option>
              <option value="DEPLETED">Hết hàng</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </div>
          <Input
            label="Ghi chú"
            placeholder="Ghi chú tùy chọn..."
            value={editForm.notes}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, notes: e.target.value }))
            }
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
