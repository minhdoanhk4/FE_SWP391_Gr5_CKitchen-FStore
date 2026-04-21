import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Sparkles, RefreshCw, CheckSquare, Square, PackagePlus } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import managerService from "../../services/managerService";
import { suggestIngredients } from "../../services/aiService";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lít", label: "lít" },
  { value: "ml", label: "ml" },
  { value: "cái", label: "cái" },
];

const EMPTY_FORM = { productId: "", ingredientId: "", quantity: "", unit: "kg" };

export default function RecipeManagement() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── AI suggestion state ────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]); // [{ name, quantity, unit, ingredientId }]
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.recipes.getAll({ size: 200 }),
      managerService.products.getAll({ size: 200 }),
    ])
      .then(([rec, prod]) => {
        if (!mounted) return;
        const rawRecipes = Array.isArray(rec) ? rec : (rec?.content ?? []);
        const prodList   = Array.isArray(prod) ? prod : (prod?.content ?? []);
        // Enrich recipes with productName from the products list (in case API omits it)
        const productMap = Object.fromEntries(prodList.map((p) => [String(p.id), p.name]));
        const enriched = rawRecipes.map((r) => ({
          ...r,
          productName:    r.productName    || productMap[String(r.productId)]    || r.productId,
          ingredientName: r.ingredientName || r.ingredientId,
        }));
        setRecipes(enriched);
        setProducts(prodList);
      })
      .catch(() => { if (mounted) toast.error("Không thể tải dữ liệu công thức"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }));

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
    if (!editItem && !form.ingredientId) errs.ingredientId = "Vui lòng chọn nguyên liệu";
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
        const updated = await managerService.recipes.update(editItem.id, payload);
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editItem.id
              ? { ...r, ...payload, ...(updated ?? {}), productName: r.productName, ingredientName: r.ingredientName }
              : r
          )
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
        const productName = products.find((p) => String(p.id) === String(payload.productId))?.name;
        const enrichedCreated = {
          ...created,
          productName:    created?.productName    || productName || payload.productId,
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
    const selectedProduct = products.find((p) => String(p.id) === String(form.productId));
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm trước khi dùng AI gợi ý");
      return;
    }
    setAiLoading(true);
    setAiSuggestions([]);
    setSelectedIdxs(new Set());
    try {
      const results = await suggestIngredients(selectedProduct.name, []);
      setAiSuggestions(results);
      // Auto-select all suggestions by default
      setSelectedIdxs(new Set(results.map((_, i) => i)));
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
      selected.map((s) =>
        managerService.recipes.create({
          productId: form.productId,
          ingredientId: s.ingredientId,
          quantity: s.quantity,
          unit: s.unit,
        })
      )
    );

    const added = results
      .filter((r) => r.status === "fulfilled")
      .map((r, i) => {
        const raw = r.value;
        const src = selected[i];
        const productName = products.find((p) => String(p.id) === String(form.productId))?.name;
        return raw ? {
          ...raw,
          productName:    raw.productName    || productName || form.productId,
          ingredientName: raw.ingredientName || src?.name   || src?.ingredientId,
        } : null;
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
  };

  const columns = [
    {
      header: "Sản phẩm",
      accessor: "productName",
      sortable: true,
      render: (r) => <span style={{ fontWeight: 500 }}>{r.productName || r.productId}</span>,
    },
    {
      header: "Mã SP",
      accessor: "productId",
      width: "100px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>{r.productId}</span>
      ),
    },
    {
      header: "Nguyên liệu",
      accessor: "ingredientName",
      sortable: true,
      render: (r) => r.ingredientName || r.ingredientId,
    },
    {
      header: "Định mức",
      accessor: "quantity",
      width: "100px",
      render: (r) => (
        <span className="font-mono">
          {r.quantity} <span style={{ color: "var(--text-muted)" }}>{r.unit}</span>
        </span>
      ),
    },
    {
      header: "",
      width: "80px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Edit}
            title="Sửa"
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Trash2}
            title="Xóa"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
          />
        </div>
      ),
    },
  ];

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
      <DataTable
        columns={columns}
        data={recipes}
        loading={loading}
        searchPlaceholder="Tìm theo sản phẩm hoặc nguyên liệu..."
        toolbar={<Badge variant="primary">{recipes.length} dòng công thức</Badge>}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Sửa công thức" : "Thêm công thức"}
        size={aiSuggestions.length > 0 ? "lg" : "md"}
        footer={
          editItem ? (
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>Lưu thay đổi</Button>
            </>
          ) : aiSuggestions.length > 0 ? (
            <>
              <Button variant="secondary" onClick={() => { setAiSuggestions([]); setSelectedIdxs(new Set()); }}>
                ← Nhập thủ công
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={saving || selectedIdxs.size === 0}
                icon={PackagePlus}
              >
                {saving ? "Đang thêm…" : `Thêm ${selectedIdxs.size} nguyên liệu đã chọn`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>Thêm</Button>
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
                style={{ whiteSpace: "nowrap", flexShrink: 0, marginBottom: errors.productId ? "22px" : "0" }}
              >
                {aiLoading ? "Đang phân tích…" : "✨ AI Gợi ý"}
              </Button>
            )}
          </div>

          {/* Manual entry — shown when no AI tray active */}
          {!aiSuggestions.length && (
            <>
              <Input
                label="Mã nguyên liệu"
                required
                value={form.ingredientId}
                onChange={(e) => setForm((f) => ({ ...f, ingredientId: e.target.value }))}
                placeholder="Nhập mã nguyên liệu (VD: ING001)"
                error={errors.ingredientId}
                disabled={!!editItem}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Input
                  label="Định mức"
                  required
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0.20"
                  error={errors.quantity}
                />
                <Select
                  label="Đơn vị"
                  required
                  options={UNIT_OPTIONS}
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  error={errors.unit}
                />
              </div>
            </>
          )}

          {/* AI Loading skeleton */}
          {aiLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                ✨ Đang phân tích nguyên liệu cho "{products.find(p => String(p.id) === String(form.productId))?.name}"…
              </p>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  height: "54px",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg, var(--surface-hover) 25%, var(--surface) 50%, var(--surface-hover) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                  opacity: 1 - i * 0.12,
                }} />
              ))}
              <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            </div>
          )}

          {/* AI Suggestion tray */}
          {!aiLoading && aiSuggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {/* Tray header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0 12px",
                borderTop: "1px solid var(--surface-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
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
                  {selectedIdxs.size === aiSuggestions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
              </div>

              {/* Suggestion cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "340px", overflowY: "auto", paddingRight: "2px" }}>
                {aiSuggestions.map((s, idx) => {
                  const isSelected = selectedIdxs.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleSuggestion(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: isSelected
                          ? "2px solid var(--primary)"
                          : "1.5px solid var(--surface-border)",
                        backgroundColor: isSelected ? "var(--primary-bg)" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        userSelect: "none",
                      }}
                    >
                      {/* Checkbox icon */}
                      <span style={{ color: isSelected ? "var(--primary)" : "var(--surface-border)", flexShrink: 0, fontSize: "16px" }}>
                        {isSelected ? "☑" : "☐"}
                      </span>

                      {/* Name + qty */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontWeight: "600",
                          color: "var(--text-dark)",
                          fontSize: "14px",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {s.name}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          {s.quantity} {s.unit}
                        </span>
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
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={saving}>
              Xóa
            </Button>
          </>
        }
      >
        <p>
          Xóa công thức{" "}
          <strong>{confirmDelete?.ingredientName || confirmDelete?.ingredientId}</strong>{" "}
          cho sản phẩm <strong>{confirmDelete?.productName || confirmDelete?.productId}</strong>?
        </p>
      </Modal>
    </PageWrapper>
  );
}
