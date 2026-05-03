import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  PackagePlus,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import managerService from "../../services/managerService";
import { suggestIngredients } from "../../services/aiService";

function formatCurrency(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v);
}

const UNIT_OPTIONS = [
  { value: "phần", label: "Phần" },
  { value: "ổ", label: "Ổ" },
  { value: "lít", label: "Lít" },
  { value: "kg", label: "Kg" },
];

const EMPTY_FORM = {
  name: "",
  category: "",
  unit: "phần",
  price: "",
  cost: "",
};

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Recipe AI state ────────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [selectedAiIdxs, setSelectedAiIdxs] = useState(new Set());
  const [suggestionQtys, setSuggestionQtys] = useState({});
  const [suggestionUnits, setSuggestionUnits] = useState({});

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const setImages = (files) => {
    if (!files || files.length === 0) {
      setImagePreviews((prev) => {
        prev.forEach(URL.revokeObjectURL);
        return [];
      });
      setImageFiles(null);
      return;
    }
    const incoming = Array.from(files);
    const dt = new DataTransfer();
    Array.from(imageFiles ?? []).forEach((f) => dt.items.add(f));
    incoming.forEach((f) => dt.items.add(f));
    setImageFiles(dt.files);
    setImagePreviews((prev) => [...prev, ...incoming.map(URL.createObjectURL)]);
  };

  // Load products, recipes, categories on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.products.getAll({ size: 200 }),
      managerService.recipes.getAll({ size: 200 }),
      managerService.products.getCategories(),
      managerService.inventory.getIngredients(),
    ])
      .then(([prod, rec, cats, ings]) => {
        if (!mounted) return;
        setProducts(Array.isArray(prod) ? prod : (prod?.content ?? []));
        setRecipes(Array.isArray(rec) ? rec : (rec?.content ?? []));
        setIngredients(Array.isArray(ings) ? ings : (ings?.content ?? []));
        setCategories(
          Array.isArray(cats)
            ? cats.map((c) =>
                typeof c === "string"
                  ? { value: c, label: c }
                  : { value: c.name ?? c.id, label: c.name ?? c.id },
              )
            : [],
        );
      })
      .catch(() => {
        if (mounted) toast.error("Không thể tải dữ liệu sản phẩm");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = categories.length
    ? categories
    : [
        { value: "Phở", label: "Phở" },
        { value: "Bún", label: "Bún" },
        { value: "Cơm", label: "Cơm" },
        { value: "Bánh mì", label: "Bánh mì" },
        { value: "Khai vị", label: "Khai vị" },
        { value: "Gia vị", label: "Gia vị" },
        { value: "Bán thành phẩm", label: "Bán thành phẩm" },
      ];

  // Derive known ingredients from loaded recipes (no dedicated BE endpoint)
  const ingredientOptions = useMemo(() => {
    const seen = new Map();
    recipes.forEach((r) => {
      if (r.ingredientId && !seen.has(r.ingredientId)) {
        seen.set(r.ingredientId, {
          value: r.ingredientId,
          label: r.ingredientName
            ? `${r.ingredientName} (${r.unit ?? ""})`
            : r.ingredientId,
        });
      }
    });
    return Array.from(seen.values());
  }, [recipes]);

  const handleOpenNew = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setImages(null);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price?.toString() ?? "",
      cost: product.cost?.toString() ?? "",
    });
    setImages(null);
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập tên sản phẩm";
    if (!form.category) errs.category = "Vui lòng chọn danh mục";
    if (!form.price) errs.price = "Vui lòng nhập giá bán";
    if (!form.cost) errs.cost = "Vui lòng nhập giá vốn";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fields = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: parseInt(form.price) || 0,
        cost: parseInt(form.cost) || 0,
        ...(imageFiles && imageFiles.length > 0 ? { images: imageFiles } : {}),
      };
      if (editProduct) {
        const updated = await managerService.products.update(
          editProduct.id,
          fields,
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editProduct.id ? (updated ?? { ...p, ...fields }) : p,
          ),
        );
        toast.success(`Đã cập nhật sản phẩm ${form.name}`);
      } else {
        const created = await managerService.products.create(fields);
        setProducts((prev) => [...prev, created]);
        toast.success(`Đã tạo sản phẩm ${form.name}`);
      }
      setShowModal(false);
    } catch {
      toast.error("Lưu sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      if (isBulkDelete) {
        await Promise.all(
          selectedIds.map((id) => managerService.products.delete(id)),
        );
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
        setSelectedIds([]);
      } else {
        await managerService.products.delete(confirmDelete.id);
        setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
        toast.success(`Đã xóa sản phẩm ${confirmDelete.name}`);
      }
      setConfirmDelete(null);
      setIsBulkDelete(false);
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleOpenRecipe = (product) => {
    const productRecipes = recipes.filter(
      (r) =>
        r.productId === product.id || r.productId === product.id?.toString(),
    );
    setRecipeItems(
      productRecipes.length > 0
        ? productRecipes.map((r) => ({
            id: r.id,
            ingredientId: r.ingredientId,
            quantity: String(r.quantity),
            unit: r.unit,
          }))
        : [{ id: null, ingredientId: "", quantity: "", unit: "kg" }],
    );
    setAiSuggestions([]);
    setSelectedAiIdxs(new Set());
    setSuggestionQtys({});
    setSuggestionUnits({});
    setShowRecipeModal(product);
  };

  // ── Recipe AI handlers ─────────────────────────────────────────────────────
  const handleRecipeAiSuggest = async () => {
    if (!showRecipeModal) return;
    setAiLoading(true);
    setAiSuggestions([]);
    setSelectedAiIdxs(new Set());
    try {
      const results = await suggestIngredients(
        showRecipeModal.name,
        ingredients,
      );
      if (!results.length) {
        toast("Kho hiện tại không có nguyên liệu phù hợp cho món này", {
          icon: "⚠️",
        });
        return;
      }
      setAiSuggestions(results);
      setSelectedAiIdxs(new Set(results.map((_, i) => i)));
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

  const handleToggleAiSuggestion = (idx) => {
    setSelectedAiIdxs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSelectAllAi = () => {
    if (selectedAiIdxs.size === aiSuggestions.length) {
      setSelectedAiIdxs(new Set());
    } else {
      setSelectedAiIdxs(new Set(aiSuggestions.map((_, i) => i)));
    }
  };

  const handleAddAiSelected = async () => {
    const selected = aiSuggestions.filter((_, i) => selectedAiIdxs.has(i));
    if (!selected.length) {
      toast.error("Không có nguyên liệu nào được chọn");
      return;
    }
    setSaving(true);
    const results = await Promise.allSettled(
      selected.map((s) => {
        const origIdx = aiSuggestions.indexOf(s);
        const catalogUnit =
          ingredients.find((ing) => ing.id === s.ingredientId)?.unit || s.unit;
        return managerService.recipes.create({
          productId: showRecipeModal.id,
          ingredientId: s.ingredientId,
          quantity:
            parseFloat(suggestionQtys[origIdx] ?? s.quantity) || s.quantity,
          unit: suggestionUnits[origIdx] || catalogUnit,
        });
      }),
    );
    const added = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value)
      .filter(Boolean)
      .map((raw) => ({
        ...raw,
        productName: raw.productName || showRecipeModal.name,
        ingredientName: raw.ingredientName || raw.ingredientId,
      }));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (added.length > 0) {
      setRecipes((prev) => [...prev, ...added]);
      setRecipeItems((prev) => [
        ...prev.filter((r) => r.ingredientId),
        ...added.map((r) => ({
          id: r.id,
          ingredientId: r.ingredientId,
          quantity: String(r.quantity),
          unit: r.unit,
        })),
      ]);
      toast.success(`Đã thêm ${added.length} nguyên liệu vào công thức`);
    }
    if (failed > 0)
      toast.error(`${failed} nguyên liệu thêm thất bại (có thể đã tồn tại)`);
    setSaving(false);
    setAiSuggestions([]);
    setSelectedAiIdxs(new Set());
  };

  const handleSaveRecipe = async () => {
    const validItems = recipeItems.filter(
      (i) => i.ingredientId && parseFloat(i.quantity) > 0,
    );
    if (validItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 nguyên liệu");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        validItems.map(async (item) => {
          if (item.id) {
            // Update existing entry
            const updated = await managerService.recipes.update(item.id, {
              quantity: parseFloat(item.quantity),
              unit: item.unit,
            });
            return updated ?? { ...item, quantity: parseFloat(item.quantity) };
          } else {
            // Create new entry
            return managerService.recipes.create({
              productId: showRecipeModal.id,
              ingredientId: item.ingredientId,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
            });
          }
        }),
      );
      // Refresh recipes state: replace entries for this product
      setRecipes((prev) => [
        ...prev.filter(
          (r) =>
            r.productId !== showRecipeModal.id &&
            r.productId !== showRecipeModal.id?.toString(),
        ),
        ...results.filter(Boolean),
      ]);
      toast.success(`Đã lưu công thức cho ${showRecipeModal.name}`);
      setShowRecipeModal(null);
    } catch {
      toast.error("Lưu công thức thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Remove a recipe item: if it has a BE id, delete immediately
  const handleRemoveRecipeItem = async (idx) => {
    const item = recipeItems[idx];
    if (item.id) {
      try {
        await managerService.recipes.delete(item.id);
        setRecipes((prev) => prev.filter((r) => r.id !== item.id));
      } catch {
        toast.error("Không thể xóa nguyên liệu");
        return;
      }
    }
    setRecipeItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const productRecipes = viewProduct
    ? recipes.filter(
        (r) =>
          r.productId === viewProduct.id ||
          r.productId === viewProduct.id?.toString(),
      )
    : [];

  const columns = [
    {
      header: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll();
          }}
          style={{ cursor: "pointer" }}
        >
          {selectedIds.length === products.length && products.length > 0 ? (
            <CheckSquare size={18} />
          ) : (
            <Square size={18} />
          )}
        </div>
      ),
      width: "40px",
      render: (r) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleSelectOne(r.id);
          }}
          style={{ cursor: "pointer" }}
        >
          {selectedIds.includes(r.id) ? (
            <CheckSquare size={18} color="var(--primary)" />
          ) : (
            <Square size={18} />
          )}
        </div>
      ),
    },
    {
      header: "Thao tác",
      width: "48px",
      render: (r) =>
        r.imageUrl?.[0] ? (
          <img
            src={r.imageUrl[0]}
            alt={r.name}
            style={{
              width: 36,
              height: 36,
              objectFit: "cover",
              borderRadius: "var(--radius-sm)",
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: "var(--text-muted)",
            }}
          >
            🍽
          </div>
        ),
    },
    {
      header: "Mã SP",
      accessor: "id",
      width: "80px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.id}
        </span>
      ),
    },
    { header: "Tên sản phẩm", accessor: "name", sortable: true },
    {
      header: "Danh mục",
      accessor: "category",
      sortable: true,
      render: (r) => <Badge variant="neutral">{r.category}</Badge>,
    },
    { header: "Đơn vị", accessor: "unit" },
    {
      header: "Giá bán",
      accessor: "price",
      sortable: true,
      render: (r) => (
        <span className="font-mono">{formatCurrency(r.price)}</span>
      ),
    },
    {
      header: "Giá vốn",
      accessor: "cost",
      sortable: true,
      render: (r) => (
        <span className="font-mono">{formatCurrency(r.cost)}</span>
      ),
    },
    {
      header: "Lợi nhuận",
      render: (r) => {
        const profit =
          r.price > 0 ? (((r.price - r.cost) / r.price) * 100).toFixed(0) : "0";
        return (
          <Badge variant={profit > 50 ? "success" : "warning"}>{profit}%</Badge>
        );
      },
    },
    {
      header: "Công thức",
      render: (row) => {
        const hasRecipe = recipes.some(
          (r) => r.productId === row.id || r.productId === row.id?.toString(),
        );
        return (
          <Badge
            variant={hasRecipe ? "success" : "neutral"}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenRecipe(row);
            }}
          >
            {hasRecipe ? "Có" : "Chưa có"}
          </Badge>
        );
      },
    },
    {
      header: "Thao tác",
      width: "100px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Eye}
            title="Xem chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              setViewProduct(row);
            }}
          />
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
      ),
    },
  ];

  return (
    <PageWrapper
      title="Danh mục sản phẩm"
      subtitle="Quản lý sản phẩm, công thức và định mức nguyên liệu"
      actions={
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                setIsBulkDelete(true);
                setConfirmDelete({
                  name: `${selectedIds.length} sản phẩm đã chọn`,
                });
              }}
            >
              Xóa {selectedIds.length} mục
            </Button>
          )}
          <Button icon={Plus} onClick={handleOpenNew}>
            Thêm sản phẩm
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Tìm sản phẩm..."
        toolbar={<Badge variant="primary">{products.length} sản phẩm</Badge>}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? `Sửa: ${editProduct.name}` : "Thêm sản phẩm mới"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {editProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Tên sản phẩm"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Phở Bò Truyền Thống"
            error={errors.name}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Select
              label="Danh mục"
              required
              options={categoryOptions}
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              error={errors.category}
            />
            <Select
              label="Đơn vị"
              required
              options={UNIT_OPTIONS}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
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
              label="Giá bán (VND)"
              required
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="45000"
              error={errors.price}
            />
            <Input
              label="Giá vốn (VND)"
              required
              type="number"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              placeholder="18000"
              error={errors.cost}
            />
          </div>
          {form.price && form.cost && (
            <div
              style={{
                padding: "12px",
                background: "var(--primary-bg)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
              }}
            >
              Lợi nhuận:{" "}
              <strong>
                {(
                  ((parseInt(form.price) - parseInt(form.cost)) /
                    parseInt(form.price)) *
                  100
                ).toFixed(1)}
                %
              </strong>{" "}
              ({formatCurrency(parseInt(form.price) - parseInt(form.cost))} /
              sản phẩm)
            </div>
          )}
          {/* Image upload */}
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Hình ảnh sản phẩm</label>
            
            {/* Existing server images (edit mode) */}
            {editProduct?.imageUrl?.length > 0 && (
              <div style={{ marginBottom: "16px", padding: "12px", background: "var(--surface-sub)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Ảnh hiện tại trên hệ thống:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {editProduct.imageUrl.map((url, i) => (
                    <div key={i} style={{ width: 60, height: 60, borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img src={url} alt={`existing-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--border)";
                if (e.dataTransfer.files) setImages(e.dataTransfer.files);
              }}
              style={{ 
                border: "2px dashed var(--border)", 
                borderRadius: "12px", 
                padding: "24px", 
                textAlign: "center", 
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: "var(--surface-sub)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <Upload size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--primary)" }}>Nhấn để tải lên</span> hoặc kéo thả ảnh mới
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                PNG, JPG, JPEG (Tối đa 10MB)
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setImages(e.target.files)} 
                multiple 
                accept="image/*" 
                style={{ display: "none" }} 
              />
            </div>

            {imagePreviews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "12px", marginTop: "16px" }}>
                {imagePreviews.map((url, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        URL.revokeObjectURL(url);
                        const nextPreviews = imagePreviews.filter((_, idx) => idx !== i);
                        const dt = new DataTransfer();
                        Array.from(imageFiles).filter((_, idx) => idx !== i).forEach(f => dt.items.add(f));
                        setImagePreviews(nextPreviews);
                        setImageFiles(dt.files.length > 0 ? dt.files : null);
                      }}
                      style={{ 
                        position: "absolute", 
                        top: "4px", 
                        right: "4px", 
                        background: "rgba(0,0,0,0.5)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "50%", 
                        width: "20px", 
                        height: "20px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title={viewProduct ? `Chi tiết: ${viewProduct.name}` : ""}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setViewProduct(null)}>
            Đóng
          </Button>
        }
      >
        {viewProduct && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Mã SP
                </span>
                <p className="font-mono" style={{ fontWeight: 600 }}>
                  {viewProduct.id}
                </p>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Danh mục
                </span>
                <p>
                  <Badge variant="neutral">{viewProduct.category}</Badge>
                </p>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Giá bán
                </span>
                <p
                  className="font-mono"
                  style={{ fontWeight: 600, color: "var(--primary)" }}
                >
                  {formatCurrency(viewProduct.price)}
                </p>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Giá vốn
                </span>
                <p className="font-mono" style={{ fontWeight: 600 }}>
                  {formatCurrency(viewProduct.cost)}
                </p>
              </div>
            </div>

            {/* Product images */}
            {viewProduct.imageUrl?.length > 0 && (
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Hình ảnh
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {viewProduct.imageUrl.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={viewProduct.name}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: "var(--radius-md)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {productRecipes.length > 0 && (
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Công thức & Định mức nguyên liệu
                </h4>
                <div
                  style={{
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--surface-hover)",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Nguyên liệu</span>
                    <span>Định mức</span>
                  </div>
                  {productRecipes.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--surface-border)",
                        fontSize: "14px",
                      }}
                    >
                      <span>{r.ingredientName || r.ingredientId}</span>
                      <span className="font-mono">
                        {r.quantity} {r.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productRecipes.length === 0 && (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                Chưa có công thức cho sản phẩm này.{" "}
                <span
                  style={{
                    color: "var(--primary)",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    setViewProduct(null);
                    handleOpenRecipe(viewProduct);
                  }}
                >
                  Thêm công thức
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
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
              Xóa sản phẩm
            </Button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa sản phẩm <strong>{confirmDelete?.name}</strong>?
          Hành động này không thể hoàn tác.
        </p>
      </Modal>

      {/* Recipe Editor Modal */}
      <Modal
        isOpen={!!showRecipeModal}
        onClose={() => {
          setShowRecipeModal(null);
          setAiSuggestions([]);
        }}
        title={showRecipeModal ? `Công thức: ${showRecipeModal.name}` : ""}
        size="lg"
        footer={
          aiSuggestions.length > 0 ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setAiSuggestions([]);
                  setSelectedAiIdxs(new Set());
                }}
              >
                ← Nhập thủ công
              </Button>
              <Button
                onClick={handleAddAiSelected}
                disabled={saving || selectedAiIdxs.size === 0}
                icon={PackagePlus}
              >
                {saving
                  ? "Đang thêm…"
                  : `Thêm ${selectedAiIdxs.size} nguyên liệu đã chọn`}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowRecipeModal(null)}
              >
                Hủy
              </Button>
              <Button onClick={handleSaveRecipe} disabled={saving}>
                Lưu công thức
              </Button>
            </>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Định mức nguyên liệu cho 1 {showRecipeModal?.unit || "phần"} sản
            phẩm
          </p>

          {/* Existing recipe rows */}
          {recipeItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px 40px",
                gap: "8px",
                alignItems: "start",
              }}
            >
              <Select
                label={idx === 0 ? "Nguyên liệu" : ""}
                options={ingredients.map((i) => ({
                  value: i.id,
                  label: `${i.ingredientName || i.name} (${i.id})`,
                }))}
                value={item.ingredientId}
                disabled={!!item.id}
                onChange={(e) =>
                  setRecipeItems((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, ingredientId: e.target.value } : r,
                    ),
                  )
                }
                placeholder="Chọn nguyên liệu…"
              />
              <Input
                label={idx === 0 ? "Định mức" : ""}
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) =>
                  setRecipeItems((prev) =>
                    prev.map((r, i) =>
                      i === idx
                        ? { ...r, quantity: parseFloat(e.target.value) || "" }
                        : r,
                    ),
                  )
                }
                placeholder="0.15"
              />
              <Select
                label={idx === 0 ? "Đơn vị" : ""}
                options={[
                  { value: "kg", label: "kg" },
                  { value: "g", label: "g" },
                  { value: "lít", label: "lít" },
                  { value: "l", label: "l" },
                  { value: "ml", label: "ml" },
                  { value: "cái", label: "cái" },
                  { value: "quả", label: "quả" },
                  { value: "gói", label: "gói" },
                ]}
                value={item.unit}
                onChange={(e) =>
                  setRecipeItems((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, unit: e.target.value } : r,
                    ),
                  )
                }
              />
              {(recipeItems.length > 1 || item.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={Trash2}
                  onClick={() => handleRemoveRecipeItem(idx)}
                  style={{ marginTop: idx === 0 ? "24px" : "0" }}
                />
              )}
            </div>
          ))}

          {/* AI + add new section */}
          {!aiSuggestions.length && !aiLoading && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: recipeItems.length > 0 ? "4px" : "0",
                  borderTop:
                    recipeItems.length > 0
                      ? "1px solid var(--surface-border)"
                      : "none",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setRecipeItems((prev) => [
                      ...prev,
                      { id: null, ingredientId: "", quantity: "", unit: "kg" },
                    ])
                  }
                >
                  + Thêm nguyên liệu
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleRecipeAiSuggest}
                >
                  ✨ AI Gợi ý
                </Button>
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
                ✨ Đang phân tích nguyên liệu cho "{showRecipeModal?.name}"…
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0 12px",
                  borderTop: "1px solid var(--surface-border)",
                }}
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
                <button
                  onClick={handleSelectAllAi}
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
                  {selectedAiIdxs.size === aiSuggestions.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>
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
                  const isSelected = selectedAiIdxs.has(idx);
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
                      onClick={() => handleToggleAiSuggestion(idx)}
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
                            {[
                              "kg",
                              "g",
                              "lít",
                              "l",
                              "ml",
                              "cái",
                              "quả",
                              "gói",
                            ].map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
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
    </PageWrapper>
  );
}
