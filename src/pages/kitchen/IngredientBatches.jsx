import { useState, useEffect, useCallback } from "react";
import { Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input } from "../../components/ui";
import kitchenService from "../../services/kitchenService";

const PAGE_SIZE = 20;

const STATUS_CONFIG = {
  AVAILABLE: { label: "Còn hàng", variant: "success" },
  DEPLETED: { label: "Hết hàng", variant: "neutral" },
  EXPIRED: { label: "Hết hạn", variant: "danger" },
};

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

export default function IngredientBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");

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
  }, [page, filterStatus]);

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
      {/* Filter row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <select
          style={{
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-primary)",
            fontSize: "14px",
          }}
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn hàng</option>
          <option value="DEPLETED">Hết hàng</option>
        </select>
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
            <Input
              label="Mã nguyên liệu (Ingredient ID)"
              required
              placeholder="VD: BAKE001"
              value={form.ingredientId}
              onChange={(e) =>
                setForm((f) => ({ ...f, ingredientId: e.target.value }))
              }
              error={errors.ingredientId}
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
    </PageWrapper>
  );
}
