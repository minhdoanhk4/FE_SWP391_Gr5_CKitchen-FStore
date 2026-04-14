import { useState, useMemo } from "react";
import {
  Plus,
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  User,
  Package,
  Edit,
  Trash2,
} from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { Modal } from "../../components/ui";
import { Input, Select, Textarea } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import "./ProductionPlan.css";

const STATUS_CONFIG = {
  planned: { label: "Đã lên kế hoạch", variant: "info", icon: Calendar },
  in_progress: { label: "Đang sản xuất", variant: "accent", icon: Play },
  completed: { label: "Hoàn thành", variant: "success", icon: CheckCircle },
};

export default function ProductionPlan() {
  const {
    products,
    recipes,
    ingredients: ingredientsList,
    orders,
    productionPlans: plans,
    formatDateTime,
    addProductionPlan,
    updateProductionPlan,
    deleteProductionPlan,
  } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    staff: "",
    startDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  // Compute ingredients from recipe based on selected product + quantity
  const computedIngredients = useMemo(() => {
    if (!form.productId) return [];
    const recipe = recipes.find((r) => r.productId === form.productId);
    if (!recipe) return [];
    const qty = parseInt(form.quantity) || 0;
    return recipe.ingredients.map((ri) => {
      const ing = ingredientsList.find((i) => i.id === ri.ingredientId);
      const totalQty = Math.round(ri.quantity * qty * 100) / 100;
      return {
        name: ing?.name || ri.ingredientId,
        qty: `${totalQty}${ri.unit}`,
      };
    });
  }, [form.productId, form.quantity, recipes, ingredientsList]);

  // Aggregate pending/confirmed order demand by product
  const orderDemand = useMemo(() => {
    const demandMap = {};
    orders
      .filter((o) => o.status === "pending" || o.status === "confirmed")
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!demandMap[item.productId]) {
            demandMap[item.productId] = {
              productName: item.productName,
              totalQty: 0,
              unit: item.unit,
              orderCount: 0,
              orderIds: new Set(),
            };
          }
          demandMap[item.productId].totalQty += item.quantity;
          if (!demandMap[item.productId].orderIds.has(order.id)) {
            demandMap[item.productId].orderIds.add(order.id);
            demandMap[item.productId].orderCount += 1;
          }
        });
      });
    return Object.entries(demandMap).map(([productId, d]) => ({
      productId,
      productName: d.productName,
      totalQty: d.totalQty,
      unit: d.unit,
      orderCount: d.orderCount,
    }));
  }, [orders]);

  const filtered =
    filter === "all" ? plans : plans.filter((p) => p.status === filter);

  const handleOpenNew = () => {
    setEditPlan(null);
    setForm({
      productId: "",
      quantity: "",
      staff: "",
      startDate: "",
      notes: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditPlan(plan);
    setForm({
      productId: plan.productId,
      quantity: plan.quantity.toString(),
      staff: plan.staff,
      startDate: plan.startDate?.slice(0, 16) || "",
      notes: plan.notes || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.productId) errs.productId = "Vui lòng chọn sản phẩm";
    if (!form.quantity) errs.quantity = "Vui lòng nhập số lượng";
    if (!form.staff.trim()) errs.staff = "Vui lòng nhập nhân viên phụ trách";
    if (!form.startDate) errs.startDate = "Vui lòng chọn thời gian bắt đầu";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const product = products.find((p) => p.id === form.productId);
    if (editPlan) {
      updateProductionPlan(editPlan.id, {
        productId: form.productId,
        productName: product?.name || editPlan.productName,
        quantity: parseInt(form.quantity) || editPlan.quantity,
        unit: product?.unit || editPlan.unit,
        staff: form.staff,
        startDate: form.startDate,
        notes: form.notes,
      });
    } else {
      const newPlan = {
        id: `KH-${String(plans.length + 1).padStart(3, "0")}`,
        productId: form.productId,
        productName: product?.name || "Sản phẩm",
        quantity: parseInt(form.quantity) || 0,
        unit: product?.unit || "phần",
        status: "planned",
        startDate: form.startDate,
        endDate: null,
        staff: form.staff,
        notes: form.notes,
        ingredients: computedIngredients,
      };
      addProductionPlan(newPlan);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Bạn có chắc muốn xóa kế hoạch này?")) {
      deleteProductionPlan(id);
      if (selectedPlan?.id === id) setSelectedPlan(null);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateProductionPlan(id, {
      status: newStatus,
      endDate: newStatus === "completed" ? new Date().toISOString() : undefined,
    });
  };

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  return (
    <PageWrapper
      title="Kế hoạch sản xuất"
      subtitle="Lập kế hoạch và theo dõi tiến độ sản xuất theo nhu cầu tổng hợp"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Lập kế hoạch mới
        </Button>
      }
    >
      {/* Stats summary */}
      <div className="production-stats">
        <div className="production-stat">
          <Calendar size={20} />
          <div>
            <span className="production-stat__value">
              {plans.filter((p) => p.status === "planned").length}
            </span>
            <span className="production-stat__label">Đã lên KH</span>
          </div>
        </div>
        <div className="production-stat production-stat--active">
          <Play size={20} />
          <div>
            <span className="production-stat__value">
              {plans.filter((p) => p.status === "in_progress").length}
            </span>
            <span className="production-stat__label">Đang SX</span>
          </div>
        </div>
        <div className="production-stat production-stat--done">
          <CheckCircle size={20} />
          <div>
            <span className="production-stat__value">
              {plans.filter((p) => p.status === "completed").length}
            </span>
            <span className="production-stat__label">Hoàn thành</span>
          </div>
        </div>
        <div className="production-stat production-stat--total">
          <Package size={20} />
          <div>
            <span className="production-stat__value">
              {plans.reduce((s, p) => s + p.quantity, 0)}
            </span>
            <span className="production-stat__label">Tổng SL</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="production-filters">
        {["all", "planned", "in_progress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`production-filter-btn ${filter === s ? "production-filter-btn--active" : ""}`}
          >
            {s === "all" ? "Tất cả" : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Plans grid + detail */}
      <div className="production-layout">
        <div className="production-list">
          {filtered.map((plan) => {
            const config = STATUS_CONFIG[plan.status];
            const StatusIcon = config.icon;
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
                <h4 className="production-card__name">{plan.productName}</h4>
                <div className="production-card__meta">
                  <span>
                    <Package size={14} /> {plan.quantity} {plan.unit}
                  </span>
                  <span>
                    <User size={14} /> {plan.staff}
                  </span>
                </div>
                <div className="production-card__meta">
                  <span>
                    <Clock size={14} /> {formatDateTime(plan.startDate)}
                  </span>
                </div>
                <div className="production-card__actions">
                  {plan.status === "planned" && (
                    <Button
                      size="sm"
                      variant="accent"
                      icon={Play}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(plan.id, "in_progress");
                      }}
                    >
                      Bắt đầu SX
                    </Button>
                  )}
                  {plan.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={CheckCircle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(plan.id, "completed");
                      }}
                    >
                      Hoàn thành
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    icon={Edit}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(plan);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(plan.id);
                    }}
                  />
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
                  {selectedPlan.productName}
                </h3>
                <Badge variant={STATUS_CONFIG[selectedPlan.status].variant} dot>
                  {STATUS_CONFIG[selectedPlan.status].label}
                </Badge>
              </div>

              <div className="production-detail__info">
                <div className="production-detail__row">
                  <span>Mã KH:</span>
                  <span className="font-mono">{selectedPlan.id}</span>
                </div>
                <div className="production-detail__row">
                  <span>Số lượng:</span>
                  <span>
                    {selectedPlan.quantity} {selectedPlan.unit}
                  </span>
                </div>
                <div className="production-detail__row">
                  <span>Phụ trách:</span>
                  <span>{selectedPlan.staff}</span>
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
              </div>

              {selectedPlan.notes && (
                <div
                  style={{
                    marginTop: "16px",
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

              {selectedPlan.ingredients?.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    🧂 Nguyên liệu cần dùng
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {selectedPlan.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 12px",
                          background: "var(--surface)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "13px",
                        }}
                      >
                        <span>{ing.name}</span>
                        <span className="font-mono" style={{ fontWeight: 600 }}>
                          {ing.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          editPlan ? `Sửa kế hoạch ${editPlan.id}` : "Lập kế hoạch sản xuất mới"
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editPlan ? "Lưu thay đổi" : "Tạo kế hoạch"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Pending order demand summary */}
          {orderDemand.length > 0 && (
            <div
              style={{
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text-secondary)",
                }}
              >
                Nhu cầu hiện tại (đơn chờ xử lý + đã xác nhận)
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "13px",
                }}
              >
                {orderDemand.map((d) => (
                  <div
                    key={d.productId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      background:
                        d.productId === form.productId
                          ? "var(--primary-bg)"
                          : "transparent",
                    }}
                  >
                    <span>{d.productName}</span>
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {d.totalQty} {d.unit} ({d.orderCount} đơn)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Select
            label="Sản phẩm"
            required
            options={productOptions}
            value={form.productId}
            onChange={(e) =>
              setForm((f) => ({ ...f, productId: e.target.value }))
            }
            error={errors.productId}
          />
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
              placeholder="100"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              error={errors.quantity}
            />
            <Input
              label="Nhân viên phụ trách"
              required
              placeholder="Trần Thị Bình"
              value={form.staff}
              onChange={(e) =>
                setForm((f) => ({ ...f, staff: e.target.value }))
              }
              error={errors.staff}
            />
          </div>
          <Input
            label="Thời gian bắt đầu"
            required
            type="datetime-local"
            value={form.startDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, startDate: e.target.value }))
            }
            error={errors.startDate}
          />
          <Textarea
            label="Ghi chú"
            placeholder="Ghi chú về quy trình sản xuất..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {/* Ingredient preview from recipe */}
          {computedIngredients.length > 0 && (
            <div
              style={{
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text-secondary)",
                }}
              >
                Nguyên liệu cần dùng (tự động từ công thức)
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {computedIngredients.map((ing, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      fontSize: "13px",
                      background: "var(--surface-hover)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <span>{ing.name}</span>
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {ing.qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </PageWrapper>
  );
}
