import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { Modal } from "../../components/ui";
import { Input, Textarea } from "../../components/ui";
import kitchenService from "../../services/kitchenService";
import "./ProductionPlan.css";

const STATUS_CONFIG = {
  DRAFT: { label: "Bản nháp", variant: "info" },
  IN_PRODUCTION: { label: "Đang sản xuất", variant: "accent" },
  COMPLETED: { label: "Hoàn thành", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "neutral" },
};

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function ProductionPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [recipeCheck, setRecipeCheck] = useState(null); // { sufficient, missing: [] }
  const [checkingRecipe, setCheckingRecipe] = useState(false);

  // Complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    expiryDate: "",
    notes: "",
  });
  const [completeErrors, setCompleteErrors] = useState({});

  const recipeDebounce = useRef(null);

  // ── Fetch plans ───────────────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getProductionPlans({ page, size: 20 });
      setPlans(data.content || []);
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải kế hoạch sản xuất",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Load products for dropdown ────────────────────────────────────────────
  useEffect(() => {
    kitchenService
      .getProducts({ size: 100 })
      .then((d) => setProducts(d.content || []))
      .catch(() => {});
  }, []);

  // ── Recipe check (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    setRecipeCheck(null);
    if (!form.productId || !form.quantity || parseInt(form.quantity) <= 0)
      return;
    clearTimeout(recipeDebounce.current);
    recipeDebounce.current = setTimeout(async () => {
      setCheckingRecipe(true);
      try {
        const result = await kitchenService.recipeCheck(
          form.productId,
          parseInt(form.quantity),
        );
        setRecipeCheck(result);
      } catch {
        setRecipeCheck(null);
      } finally {
        setCheckingRecipe(false);
      }
    }, 600);
  }, [form.productId, form.quantity]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleOpenNew = () => {
    setForm({
      productId: "",
      quantity: "",
      startDate: "",
      endDate: "",
      notes: "",
    });
    setErrors({});
    setRecipeCheck(null);
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.productId) errs.productId = "Vui lòng chọn sản phẩm";
    if (!form.quantity || parseInt(form.quantity) <= 0)
      errs.quantity = "Vui lòng nhập số lượng hợp lệ";
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
        productId: form.productId,
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

  // ── Actions (Start / Cancel) ──────────────────────────────────────────────
  const handleStart = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      await kitchenService.startProductionPlan(selectedPlan.id);
      toast.success("Đã bắt đầu sản xuất");
      fetchPlans();
      setSelectedPlan((p) => ({ ...p, status: "IN_PRODUCTION" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể bắt đầu sản xuất");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedPlan) return;
    if (
      !window.confirm(
        "Xác nhận hủy kế hoạch sản xuất? Nguyên liệu đã trừ sẽ được hoàn trả.",
      )
    )
      return;
    setActionLoading(true);
    try {
      await kitchenService.cancelProductionPlan(selectedPlan.id);
      toast.success("Đã hủy kế hoạch");
      fetchPlans();
      setSelectedPlan(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể hủy kế hoạch");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Complete ──────────────────────────────────────────────────────────────
  const handleOpenComplete = () => {
    setCompleteForm({ expiryDate: "", notes: "" });
    setCompleteErrors({});
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (!completeForm.expiryDate) {
      setCompleteErrors({
        expiryDate: "Vui lòng nhập ngày hết hạn thành phẩm",
      });
      return;
    }
    setActionLoading(true);
    try {
      await kitchenService.completeProductionPlan(selectedPlan.id, {
        expiryDate: completeForm.expiryDate,
        notes: completeForm.notes || undefined,
      });
      toast.success("Hoàn tất sản xuất — lô thành phẩm đã được tạo");
      setShowCompleteModal(false);
      fetchPlans();
      setSelectedPlan((p) => ({ ...p, status: "COMPLETED" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể hoàn tất sản xuất");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === form.productId);

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
      <div className="production-layout">
        {/* Plan list */}
        <div className="production-list">
          {loading && plans.length === 0 && (
            <p
              style={{
                color: "var(--text-muted)",
                padding: "20px",
                textAlign: "center",
              }}
            >
              Đang tải...
            </p>
          )}
          {!loading && plans.length === 0 && (
            <p
              style={{
                color: "var(--text-muted)",
                padding: "20px",
                textAlign: "center",
              }}
            >
              Chưa có kế hoạch sản xuất nào.
            </p>
          )}
          {plans.map((plan) => {
            const config = STATUS_CONFIG[plan.status] || {
              label: plan.status,
              variant: "neutral",
            };
            return (
              <div
                key={plan.id}
                className={`production-card ${selectedPlan?.id === plan.id ? "production-card--selected" : ""}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="production-card__header">
                  <span className="production-card__id font-mono">
                    {plan.id}
                  </span>
                  <Badge variant={config.variant} dot>
                    {config.label}
                  </Badge>
                </div>
                <h4 className="production-card__name">
                  {plan.productName || plan.productId}
                </h4>
                <div className="production-card__meta">
                  <span>
                    <Package size={14} /> {plan.quantity} {plan.unit || "phần"}
                  </span>
                </div>
                <div className="production-card__meta">
                  <span>
                    <Clock size={14} /> {formatDateTime(plan.startDate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedPlan && (
          <div className="production-detail">
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: "var(--text-lg)",
                  }}
                >
                  {selectedPlan.productName || selectedPlan.productId}
                </h3>
                <Badge
                  variant={
                    (
                      STATUS_CONFIG[selectedPlan.status] || {
                        variant: "neutral",
                      }
                    ).variant
                  }
                  dot
                >
                  {
                    (
                      STATUS_CONFIG[selectedPlan.status] || {
                        label: selectedPlan.status,
                      }
                    ).label
                  }
                </Badge>
              </div>

              <div className="production-detail__info">
                <div className="production-detail__row">
                  <span>Mã KH:</span>
                  <span className="font-mono">{selectedPlan.id}</span>
                </div>
                <div className="production-detail__row">
                  <span>Sản phẩm:</span>
                  <span>
                    {selectedPlan.productName || selectedPlan.productId}
                  </span>
                </div>
                <div className="production-detail__row">
                  <span>Số lượng:</span>
                  <span>
                    {selectedPlan.quantity} {selectedPlan.unit || "phần"}
                  </span>
                </div>
                <div className="production-detail__row">
                  <span>Bắt đầu:</span>
                  <span>{formatDateTime(selectedPlan.startDate)}</span>
                </div>
                {selectedPlan.endDate && (
                  <div className="production-detail__row">
                    <span>Kết thúc:</span>
                    <span>{formatDateTime(selectedPlan.endDate)}</span>
                  </div>
                )}
                {selectedPlan.createdAt && (
                  <div className="production-detail__row">
                    <span>Tạo lúc:</span>
                    <span>{formatDateTime(selectedPlan.createdAt)}</span>
                  </div>
                )}
                {selectedPlan.sufficient === false && (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "var(--danger-bg)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--danger)",
                      fontSize: "13px",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <AlertTriangle size={14} /> Thiếu nguyên liệu để sản xuất
                  </div>
                )}
              </div>

              {selectedPlan.notes && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  💬 {selectedPlan.notes}
                </div>
              )}

              {/* Action buttons */}
              {(selectedPlan.status === "DRAFT" ||
                selectedPlan.status === "IN_PRODUCTION") && (
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedPlan.status === "DRAFT" && (
                    <Button
                      icon={PlayCircle}
                      onClick={handleStart}
                      disabled={actionLoading}
                    >
                      Bắt đầu sản xuất
                    </Button>
                  )}
                  {selectedPlan.status === "IN_PRODUCTION" && (
                    <Button
                      icon={CheckCircle}
                      onClick={handleOpenComplete}
                      disabled={actionLoading}
                    >
                      Hoàn tất sản xuất
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    Hủy kế hoạch
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </Button>
          <span
            style={{
              lineHeight: "32px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </Button>
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
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (recipeCheck && !recipeCheck.canProduce && !recipeCheck.sufficient)}
            >
              {saving ? "Đang tạo..." : "Tạo kế hoạch"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Product dropdown */}
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "6px",
                display: "block",
              }}
            >
              Sản phẩm <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${errors.productId ? "var(--danger)" : "var(--border)"}`,
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({ ...f, productId: e.target.value }))
              }
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            {errors.productId && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {errors.productId}
              </p>
            )}
          </div>

          <Input
            label="Số lượng"
            required
            type="number"
            min="1"
            placeholder="100"
            value={form.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: e.target.value }))
            }
            error={errors.quantity}
          />

          {/* ── Live Recipe Check Panel ───────────────────────────────── */}
          {checkingRecipe && (
            <div className="recipe-check-loading">
              <div className="recipe-check-spinner" />
              <span>Đang kiểm tra nguyên liệu trong kho...</span>
            </div>
          )}
          {!checkingRecipe && recipeCheck && (() => {
            const canProduce = recipeCheck.canProduce ?? recipeCheck.sufficient;
            const ingredients = recipeCheck.ingredients || recipeCheck.missing || [];
            const suffCount = ingredients.filter((i) => i.isSufficient ?? i.sufficient).length;
            const totalCount = ingredients.length;

            return (
              <div className="recipe-panel" data-status={canProduce ? "ok" : "fail"}>
                {/* Summary header */}
                <div className="recipe-panel__header">
                  <div className="recipe-panel__status">
                    {canProduce ? (
                      <CheckCircle size={18} style={{ color: "var(--success)" }} />
                    ) : (
                      <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
                    )}
                    <div>
                      <strong style={{ fontSize: "14px" }}>
                        {canProduce ? "Đủ nguyên liệu ✓" : "Không đủ nguyên liệu"}
                      </strong>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {recipeCheck.productName || selectedProduct?.name || form.productId}
                        {" · "}{form.quantity} phần
                        {" · "}{suffCount}/{totalCount} nguyên liệu đạt
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredient detail list */}
                {ingredients.length > 0 && (
                  <div className="recipe-panel__list">
                    {ingredients.map((ing) => {
                      const ok = ing.isSufficient ?? ing.sufficient ?? true;
                      const required = Number(ing.requiredQuantity ?? 0);
                      const available = Number(ing.availableQuantity ?? 0);
                      const shortage = Number(ing.shortage ?? 0);
                      const pct = required > 0 ? Math.min((available / required) * 100, 100) : 100;

                      return (
                        <div
                          key={ing.ingredientId}
                          className={`recipe-item ${!ok ? "recipe-item--fail" : ""}`}
                        >
                          <div className="recipe-item__top">
                            <span className="recipe-item__name">
                              {ok ? "✅" : "❌"} {ing.ingredientName || ing.ingredientId}
                            </span>
                            <span className="recipe-item__unit" style={{ color: ok ? "var(--success)" : "var(--danger)" }}>
                              {available.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} / {required.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} {ing.unit || ""}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="recipe-item__bar-track">
                            <div
                              className="recipe-item__bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: ok
                                  ? "var(--success)"
                                  : pct > 50
                                    ? "var(--warning)"
                                    : "var(--danger)",
                              }}
                            />
                          </div>
                          {!ok && shortage > 0 && (
                            <div className="recipe-item__shortage">
                              Thiếu: {shortage.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} {ing.unit || ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Ngày bắt đầu"
              required
              type="datetime-local"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              error={errors.startDate}
            />
            <Input
              label="Ngày kết thúc"
              required
              type="datetime-local"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
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

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Hoàn tất sản xuất"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCompleteModal(false)}
            >
              Hủy
            </Button>
            <Button
              icon={CheckCircle}
              onClick={handleComplete}
              disabled={actionLoading}
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận hoàn tất"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Nhập ngày hết hạn cho lô thành phẩm sắp tạo.
          </p>
          <Input
            label="Ngày hết hạn thành phẩm"
            required
            type="date"
            value={completeForm.expiryDate}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, expiryDate: e.target.value }))
            }
            error={completeErrors.expiryDate}
          />
          <Textarea
            label="Ghi chú"
            placeholder="Ghi chú (tùy chọn)..."
            value={completeForm.notes}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, notes: e.target.value }))
            }
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
