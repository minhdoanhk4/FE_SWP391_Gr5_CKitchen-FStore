import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Square,
  PackagePlus,
  ChevronDown,
  ChefHat,
  Scale,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Badge, Button, Modal, Input, Select } from "../../components/ui";
import managerService from "../../services/managerService";
import "./RecipeManagement.css";
import { suggestIngredients } from "../../services/aiService";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lít", label: "lít" },
  { value: "l", label: "l" },
  { value: "ml", label: "ml" },
  { value: "cái", label: "cái" },
  { value: "quả", label: "quả" },
  { value: "gói", label: "gói" },
];

const EMPTY_FORM = {
  productId: "",
  ingredientId: "",
  quantity: "",
  unit: "kg",
};

export default function RecipeManagement() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── AI suggestion state ────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());
  const [suggestionQtys, setSuggestionQtys] = useState({});
  const [suggestionUnits, setSuggestionUnits] = useState({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.recipes.getAll({ size: 200 }),
      managerService.products.getAll({ size: 200 }),
      managerService.inventory.getIngredients(),
    ])
      .then(([rec, prod, ings]) => {
        if (!mounted) return;
        const rawRecipes = Array.isArray(rec) ? rec : (rec?.content ?? []);
        const prodList = Array.isArray(prod) ? prod : (prod?.content ?? []);
        const ingList = Array.isArray(ings) ? ings : (ings?.content ?? []);
        // Enrich recipes with productName from the products list (in case API omits it)
        const productMap = Object.fromEntries(
          prodList.map((p) => [String(p.id), p.name]),
        );
        const enriched = rawRecipes.map((r) => ({
          ...r,
          productName:
            r.productName || productMap[String(r.productId)] || r.productId,
          ingredientName: r.ingredientName || r.ingredientId,
        }));
        setRecipes(enriched);
        setProducts(prodList);
        setIngredients(ingList);
      })
      .catch(() => {
        if (mounted) toast.error("Không thể tải dữ liệu công thức");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.id})`,
  }));

  const handleOpenNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setAiSuggestions([]);
    setSelectedIdxs(new Set());
    setShowModal(true);
  };

  const handleEdit = (row) => {
    setEditItem(row);
    setForm({
      productId: row.productId ?? "",
      ingredientId: row.ingredientId ?? "",
      quantity: row.quantity ?? "",
      unit: row.unit ?? "kg",
    });
    setErrors({});
    setAiSuggestions([]);
    setSelectedIdxs(new Set());
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!editItem && !form.productId) errs.productId = "Vui lòng chọn sản phẩm";
    if (!editItem && !form.ingredientId)
      errs.ingredientId = "Vui lòng chọn nguyên liệu";
    if (!form.quantity || parseFloat(form.quantity) <= 0)
      errs.quantity = "Định mức phải lớn hơn 0";
    if (!form.unit) errs.unit = "Vui lòng chọn đơn vị";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        const payload = {
          quantity: parseFloat(form.quantity),
          unit: form.unit,
        };
        const updated = await managerService.recipes.update(
          editItem.id,
          payload,
        );
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editItem.id
              ? {
                  ...r,
                  ...payload,
                  ...(updated ?? {}),
                  productName: r.productName,
                  ingredientName: r.ingredientName,
                }
              : r,
          ),
        );
        toast.success("Đã cập nhật công thức");
      } else {
        const payload = {
          productId: form.productId,
          ingredientId: form.ingredientId,
          quantity: parseFloat(form.quantity),
          unit: form.unit,
        };
        const created = await managerService.recipes.create(payload);
        const productName = products.find(
          (p) => String(p.id) === String(payload.productId),
        )?.name;
        const enrichedCreated = {
          ...created,
          productName: created?.productName || productName || payload.productId,
          ingredientName: created?.ingredientName || payload.ingredientId,
        };
        setRecipes((prev) => [...prev, enrichedCreated]);
        toast.success("Đã thêm công thức");
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Lưu công thức thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroupConfirm = async () => {
    if (!confirmDeleteGroup) return;
    setSaving(true);
    try {
      await Promise.all(
        confirmDeleteGroup.items.map((r) =>
          managerService.recipes.delete(r.id),
        ),
      );
      setRecipes((prev) =>
        prev.filter((r) => r.productId !== confirmDeleteGroup.productId),
      );
      toast.success(
        `Đã xóa tất cả công thức của ${confirmDeleteGroup.productName}`,
      );
      setConfirmDeleteGroup(null);
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await managerService.recipes.delete(confirmDelete.id);
      setRecipes((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      toast.success("Đã xóa");
      setConfirmDelete(null);
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ── AI Suggestion handlers ─────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    const selectedProduct = products.find(
      (p) => String(p.id) === String(form.productId),
    );
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm trước khi dùng AI gợi ý");
      return;
    }
    setAiLoading(true);
    setAiSuggestions([]);
    setSelectedIdxs(new Set());
    try {
      const results = await suggestIngredients(
        selectedProduct.name,
        ingredients,
      );
      if (!results.length) {
        toast("Kho hiện tại không có nguyên liệu phù hợp cho món này", {
          icon: "⚠️",
        });
        return;
      }
      setAiSuggestions(results);
      setSelectedIdxs(new Set(results.map((_, i) => i)));
      setSuggestionQtys(
        Object.fromEntries(results.map((s, i) => [i, s.quantity])),
      );
      setSuggestionUnits(
        Object.fromEntries(
          results.map((s, i) => {
            const cat = ingredients.find((ing) => ing.id === s.ingredientId);
            return [i, cat?.unit || s.unit || "kg"];
          }),
        ),
      );
    } catch (err) {
      toast.error(err.message || "AI gợi ý thất bại, vui lòng thử lại");
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleSuggestion = (idx) => {
    setSelectedIdxs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIdxs.size === aiSuggestions.length) {
      setSelectedIdxs(new Set());
    } else {
      setSelectedIdxs(new Set(aiSuggestions.map((_, i) => i)));
    }
  };

  const handleAddSelected = async () => {
    if (!form.productId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    const selected = aiSuggestions.filter((_, i) => selectedIdxs.has(i));

    if (selected.length === 0) {
      toast.error("Không có nguyên liệu nào được chọn");
      return;
    }

    setSaving(true);
    const results = await Promise.allSettled(
      selected.map((s, i) => {
        const origIdx = aiSuggestions.indexOf(s);
        const catalogUnit =
          ingredients.find((ing) => ing.id === s.ingredientId)?.unit || s.unit;
        return managerService.recipes.create({
          productId: form.productId,
          ingredientId: s.ingredientId,
          quantity:
            parseFloat(suggestionQtys[origIdx] ?? s.quantity) || s.quantity,
          unit: suggestionUnits[origIdx] || catalogUnit,
        });
      }),
    );

    const added = results
      .filter((r) => r.status === "fulfilled")
      .map((r, i) => {
        const raw = r.value;
        const src = selected[i];
        const productName = products.find(
          (p) => String(p.id) === String(form.productId),
        )?.name;
        return raw
          ? {
              ...raw,
              productName: raw.productName || productName || form.productId,
              ingredientName:
                raw.ingredientName || src?.name || src?.ingredientId,
            }
          : null;
      })
      .filter(Boolean);
    const failed = results.filter((r) => r.status === "rejected").length;

    if (added.length > 0) {
      setRecipes((prev) => [...prev, ...added]);
      toast.success(`Đã thêm ${added.length} nguyên liệu vào công thức`);
    }
    if (failed > 0) {
      toast.error(`${failed} nguyên liệu thêm thất bại (có thể đã tồn tại)`);
    }

    setSaving(false);
    setShowModal(false);
    setAiSuggestions([]);
    setSelectedIdxs(new Set());
    setSuggestionQtys({});
    setSuggestionUnits({});
  };

  const grouped = useMemo(() => {
    const map = {};
    recipes.forEach((r) => {
      const key = r.productId;
      if (!map[key])
        map[key] = {
          productId: r.productId,
          productName: r.productName,
          items: [],
        };
      map[key].items.push(r);
    });
    return Object.values(map);
  }, [recipes]);

  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (productId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  return (
    <PageWrapper
      title="Quản lý công thức"
      subtitle="Định mức nguyên liệu cho từng sản phẩm"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm công thức
        </Button>
      }
    >
      {!loading && grouped.length > 0 && (
        <div className="recipe-stats">
          <div className="recipe-stat-card">
            <div className="recipe-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)" }}>
              <ChefHat size={24} />
            </div>
            <div className="recipe-stat-info">
              <span className="recipe-stat-value">{grouped.length}</span>
              <span className="recipe-stat-label">Sản phẩm có công thức</span>
            </div>
          </div>
          <div className="recipe-stat-card">
            <div className="recipe-stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--info)" }}>
              <Scale size={24} />
            </div>
            <div className="recipe-stat-info">
              <span className="recipe-stat-value">{recipes.length}</span>
              <span className="recipe-stat-label">Tổng số định mức</span>
            </div>
          </div>
          <div className="recipe-stat-card hide-mobile">
            <div className="recipe-stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
              <Sparkles size={24} />
            </div>
            <div className="recipe-stat-info">
              <span className="recipe-stat-value">AI Ready</span>
              <span className="recipe-stat-label">Hỗ trợ gợi ý thông minh</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
          <RefreshCw className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="recipe-empty">
          <div className="recipe-empty-icon">
            <Inbox size={32} />
          </div>
          <h3>Chưa có công thức nào</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "320px" }}>
            Hãy bắt đầu bằng việc thêm công thức cho sản phẩm đầu tiên của bạn.
          </p>
          <Button icon={Plus} onClick={handleOpenNew} style={{ marginTop: "8px" }}>
            Thêm công thức ngay
          </Button>
        </div>
      ) : (
        <div className="recipe-accordion">
          {grouped.map((group) => {
            const isExpanded = expandedGroups.has(group.productId);
            
            // Refined product icon logic
            const getProductIcon = (name) => {
              const n = name.toLowerCase();
              if (n.includes("bánh") || n.includes("cake")) return "🍰";
              if (n.includes("nước") || n.includes("trà") || n.includes("drink")) return "🥤";
              if (n.includes("mì") || n.includes("phở") || n.includes("noodle")) return "🍜";
              if (n.includes("cơm") || n.includes("rice")) return "🍛";
              if (n.includes("café") || n.includes("cà phê") || n.includes("coffee")) return "☕";
              if (n.includes("sữa") || n.includes("milk")) return "🥛";
              return "🍽️";
            };

            const productIcon = getProductIcon(group.productName || "");

            return (
              <div
                key={group.productId}
                className={`recipe-group ${isExpanded ? "recipe-group--expanded" : ""}`}
              >
                {/* Product header (Clickable) */}
                <div
                  className="recipe-header"
                  onClick={() => toggleGroup(group.productId)}
                >
                  <div className="recipe-product-icon">
                    {productIcon}
                  </div>
                  <div className="recipe-info-main">
                    <span className="recipe-product-name">
                      {group.productName}
                    </span>
                    <span className="recipe-product-id">
                      ID: {group.productId}
                    </span>
                  </div>
                  
                  <div className="recipe-meta">
                    <Badge variant="primary" style={{ borderRadius: "6px" }}>
                      {group.items.length} nguyên liệu
                    </Badge>
                    <div className="recipe-actions hide-mobile">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={Trash2}
                        title="Xóa tất cả công thức của sản phẩm này"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteGroup(group);
                        }}
                      />
                    </div>
                    <div className="recipe-chevron">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* Ingredients table (Collapsible) */}
                <div
                  className="recipe-content"
                  style={{
                    maxHeight: isExpanded ? "2000px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="recipe-table-wrapper">
                    <div className="table-responsive">
                      <table className="recipe-table">
                        <thead>
                          <tr>
                            <th>Nguyên liệu</th>
                            <th style={{ width: "140px" }}>Mã NL</th>
                            <th style={{ width: "160px" }}>Định mức</th>
                            <th style={{ width: "100px", textAlign: "right" }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <div className="recipe-ing-name">
                                  {row.ingredientName || row.ingredientId}
                                </div>
                              </td>
                              <td>
                                <span className="recipe-ing-id">
                                  {row.ingredientId}
                                </span>
                              </td>
                              <td>
                                <div className="recipe-quantity-badge">
                                  {row.quantity}
                                  <span style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 500 }}>
                                    {row.unit}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="recipe-actions">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                    icon={Edit}
                                    title="Sửa"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(row);
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                    icon={Trash2}
                                    title="Xóa"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(row);
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Sửa công thức" : "Thêm công thức"}
        size={aiSuggestions.length > 0 ? "lg" : "md"}
        footer={
          editItem ? (
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                Lưu thay đổi
              </Button>
            </>
          ) : aiSuggestions.length > 0 ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setAiSuggestions([]);
                  setSelectedIdxs(new Set());
                }}
              >
                ← Nhập thủ công
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={saving || selectedIdxs.size === 0}
                icon={PackagePlus}
              >
                {saving
                  ? "Đang thêm…"
                  : `Thêm ${selectedIdxs.size} nguyên liệu đã chọn`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                Thêm
              </Button>
            </>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Product selector + AI button row */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Sản phẩm"
                required
                options={productOptions}
                value={form.productId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, productId: e.target.value }));
                  setAiSuggestions([]);
                  setSelectedIdxs(new Set());
                }}
                error={errors.productId}
                disabled={!!editItem}
              />
            </div>
            {!editItem && (
              <Button
                variant="secondary"
                icon={aiLoading ? RefreshCw : Sparkles}
                onClick={handleAiSuggest}
                disabled={aiLoading || !form.productId}
                title="Dùng AI để gợi ý nguyên liệu dựa trên kho hiện có"
                style={{
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginBottom: errors.productId ? "22px" : "0",
                }}
              >
                {aiLoading ? "Đang phân tích…" : "✨ AI Gợi ý"}
              </Button>
            )}
          </div>

          {/* Manual entry — shown when no AI tray active */}
          {!aiSuggestions.length && (
            <>
              <Select
                label="Mã nguyên liệu"
                required
                value={form.ingredientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ingredientId: e.target.value }))
                }
                options={ingredients.map((i) => ({
                  value: i.id,
                  label: `${i.id} — ${i.ingredientName || i.name}`,
                }))}
                placeholder="Chọn nguyên liệu…"
                error={errors.ingredientId}
                disabled={!!editItem}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <Input
                  label="Định mức"
                  required
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder="0.20"
                  error={errors.quantity}
                />
                <Select
                  label="Đơn vị"
                  required
                  options={UNIT_OPTIONS}
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  error={errors.unit}
                />
              </div>
            </>
          )}

          {/* AI Loading skeleton */}
          {aiLoading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                ✨ Đang phân tích nguyên liệu cho "
                {
                  products.find((p) => String(p.id) === String(form.productId))
                    ?.name
                }
                "…
              </p>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "54px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(90deg, var(--surface-hover) 25%, var(--surface) 50%, var(--surface-hover) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                    opacity: 1 - i * 0.12,
                  }}
                />
              ))}
              <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            </div>
          )}

          {/* AI Suggestion tray */}
          {!aiLoading && aiSuggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {/* Tray header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0 12px",
                  borderTop: "1px solid var(--surface-border)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ✨ GỢI Ý AI ({aiSuggestions.length})
                  </span>
                </div>
                <button
                  onClick={handleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--primary)",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {selectedIdxs.size === aiSuggestions.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>

              {/* Suggestion cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "340px",
                  overflowY: "auto",
                  paddingRight: "2px",
                }}
              >
                {aiSuggestions.map((s, idx) => {
                  const isSelected = selectedIdxs.has(idx);
                  const catalogMatch = ingredients.find(
                    (i) => i.id === s.ingredientId,
                  );
                  const displayName =
                    s.name ||
                    catalogMatch?.ingredientName ||
                    catalogMatch?.name ||
                    s.ingredientId;
                  const displayUnit = catalogMatch?.unit || s.unit;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleSuggestion(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: isSelected
                          ? "2px solid var(--primary)"
                          : "1.5px solid var(--surface-border)",
                        backgroundColor: isSelected
                          ? "var(--primary-bg)"
                          : "var(--surface-card)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        userSelect: "none",
                      }}
                    >
                      <span
                        style={{
                          color: isSelected
                            ? "var(--primary)"
                            : "var(--surface-border)",
                          flexShrink: 0,
                          fontSize: "16px",
                        }}
                      >
                        {isSelected ? "☑" : "☐"}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                              color: "var(--text-dark)",
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {displayName}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {s.ingredientId}
                          </span>
                        </div>
                        {s.reason && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              marginTop: "3px",
                              fontStyle: "italic",
                            }}
                          >
                            {s.reason}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "2px",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={suggestionQtys[idx] ?? s.quantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setSuggestionQtys((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            style={{
                              width: "70px",
                              fontSize: "12px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid var(--surface-border)",
                              background: "var(--surface)",
                              color: "var(--text-dark)",
                              fontFamily: "var(--font-mono, monospace)",
                            }}
                          />
                          <select
                            value={suggestionUnits[idx] ?? displayUnit}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setSuggestionUnits((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            style={{
                              fontSize: "12px",
                              padding: "2px 4px",
                              borderRadius: "4px",
                              border: "1px solid var(--surface-border)",
                              background: "var(--surface)",
                              color: "var(--text-dark)",
                            }}
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>{" "}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xác nhận xóa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={saving}
            >
              Xóa
            </Button>
          </>
        }
      >
        <p>
          Xóa công thức{" "}
          <strong>
            {confirmDelete?.ingredientName || confirmDelete?.ingredientId}
          </strong>{" "}
          cho sản phẩm{" "}
          <strong>
            {confirmDelete?.productName || confirmDelete?.productId}
          </strong>
          ?
        </p>
      </Modal>
      {/* Delete Group Confirmation */}
      <Modal
        isOpen={!!confirmDeleteGroup}
        onClose={() => setConfirmDeleteGroup(null)}
        title="Xóa tất cả công thức"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteGroup(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteGroupConfirm}
              disabled={saving}
            >
              Xóa tất cả
            </Button>
          </>
        }
      >
        <p>
          Xóa toàn bộ{" "}
          <strong>{confirmDeleteGroup?.items.length} công thức</strong> của sản
          phẩm <strong>{confirmDeleteGroup?.productName}</strong>? Hành động này
          không thể hoàn tác.
        </p>
      </Modal>
    </PageWrapper>
  );
}
