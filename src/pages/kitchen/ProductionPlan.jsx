import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar,
  User,
  Package,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { Modal } from "../../components/ui";
import { Input, Textarea } from "../../components/ui";
import kitchenService from "../../services/kitchenService";
import "./ProductionPlan.css";

const STATUS_CONFIG = {
  PLANNED: { label: "Đã lên kế hoạch", variant: "info" },
  IN_PROGRESS: { label: "Đang sản xuất", variant: "accent" },
  COMPLETED: { label: "Hoàn thành", variant: "success" },
  // fallback for any other BE status
};

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

export default function ProductionPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Fetch plans ───────────────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getProductionPlans({ page, size: 20 });
      setPlans(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tải kế hoạch sản xuất");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleOpenNew = () => {
    setForm({ productId: "", quantity: "", startDate: "", endDate: "", notes: "" });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.productId.trim()) errs.productId = "Vui lòng nhập mã sản phẩm";
    if (!form.quantity || parseInt(form.quantity) <= 0) errs.quantity = "Vui lòng nhập số lượng hợp lệ";
    if (!form.startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate) errs.endDate = "Vui lòng chọn ngày kết thúc";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await kitchenService.createProductionPlan({
        productId: form.productId.trim(),
        quantity: parseInt(form.quantity),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Tạo kế hoạch sản xuất thành công");
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tạo kế hoạch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Kế hoạch sản xuất"
      subtitle="Lập kế hoạch và theo dõi tiến độ sản xuất"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Lập kế hoạch mới
        </Button>
      }
    >
      {/* Plans grid + detail */}
      <div className="production-layout">
        <div className="production-list">
          {loading && plans.length === 0 && (
            <p style={{ color: "var(--text-muted)", padding: "20px", textAlign: "center" }}>Đang tải...</p>
          )}
          {!loading && plans.length === 0 && (
            <p style={{ color: "var(--text-muted)", padding: "20px", textAlign: "center" }}>Chưa có kế hoạch sản xuất nào.</p>
          )}
          {plans.map((plan) => {
            const config = STATUS_CONFIG[plan.status] || { label: plan.status, variant: "neutral" };
            return (
              <div
                key={plan.id}
                className={`production-card ${selectedPlan?.id === plan.id ? "production-card--selected" : ""}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="production-card__header">
                  <span className="production-card__id font-mono">{plan.id}</span>
                  <Badge variant={config.variant} dot>{config.label}</Badge>
                </div>
                <h4 className="production-card__name">{plan.productName || plan.productId}</h4>
                <div className="production-card__meta">
                  <span><Package size={14} /> {plan.quantity} {plan.unit || "phần"}</span>
                  {plan.staff && <span><User size={14} /> {plan.staff}</span>}
                </div>
                <div className="production-card__meta">
                  <span><Clock size={14} /> {formatDateTime(plan.startDate)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedPlan && (
          <div className="production-detail">
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "var(--text-lg)" }}>
                  {selectedPlan.productName || selectedPlan.productId}
                </h3>
                <Badge variant={(STATUS_CONFIG[selectedPlan.status] || { variant: "neutral" }).variant} dot>
                  {(STATUS_CONFIG[selectedPlan.status] || { label: selectedPlan.status }).label}
                </Badge>
              </div>

              <div className="production-detail__info">
                <div className="production-detail__row"><span>Mã KH:</span><span className="font-mono">{selectedPlan.id}</span></div>
                <div className="production-detail__row"><span>Sản phẩm:</span><span>{selectedPlan.productName || selectedPlan.productId}</span></div>
                <div className="production-detail__row"><span>Số lượng:</span><span>{selectedPlan.quantity} {selectedPlan.unit || "phần"}</span></div>
                {selectedPlan.staff && <div className="production-detail__row"><span>Phụ trách:</span><span>{selectedPlan.staff}</span></div>}
                <div className="production-detail__row"><span>Bắt đầu:</span><span>{formatDateTime(selectedPlan.startDate)}</span></div>
                {selectedPlan.endDate && <div className="production-detail__row"><span>Kết thúc:</span><span>{formatDateTime(selectedPlan.endDate)}</span></div>}
                {selectedPlan.createdAt && <div className="production-detail__row"><span>Tạo lúc:</span><span>{formatDateTime(selectedPlan.createdAt)}</span></div>}
              </div>

              {selectedPlan.notes && (
                <div style={{ marginTop: "16px", padding: "12px", background: "var(--surface)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--text-secondary)" }}>
                  💬 {selectedPlan.notes}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span style={{ lineHeight: "32px", fontSize: "13px", color: "var(--text-secondary)" }}>Trang {page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Lập kế hoạch sản xuất mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Đang tạo..." : "Tạo kế hoạch"}</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Mã sản phẩm (Product ID)"
            required
            placeholder="VD: PROD-001"
            value={form.productId}
            onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
            error={errors.productId}
          />
          <Input
            label="Số lượng"
            required
            type="number"
            placeholder="100"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            error={errors.quantity}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Input
              label="Ngày bắt đầu"
              required
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              error={errors.startDate}
            />
            <Input
              label="Ngày kết thúc"
              required
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              error={errors.endDate}
            />
          </div>
          <Textarea
            label="Ghi chú"
            placeholder="Ghi chú về quy trình sản xuất..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
