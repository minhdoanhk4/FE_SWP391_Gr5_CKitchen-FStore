import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import managerService from "../../services/managerService";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lít", label: "lít" },
  { value: "ml", label: "ml" },
  { value: "cái", label: "cái" },
];

export default function RecipeManagement() {
  const { ingredients } = useData();

  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({ productId: "", name: "" });
  const [recipeItems, setRecipeItems] = useState([
    { ingredientId: "", quantity: "", unit: "kg" },
  ]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      managerService.recipes.getAll({ size: 200 }),
      managerService.products.getAll({ size: 200 }),
    ])
      .then(([rec, prod]) => {
        if (!mounted) return;
        setRecipes(Array.isArray(rec) ? rec : (rec?.content ?? []));
        setProducts(Array.isArray(prod) ? prod : (prod?.content ?? []));
      })
      .catch(() => { if (mounted) toast.error("Không thể tải dữ liệu công thức"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const getProductName = (productId) =>
    products.find(
      (p) => p.id === productId || p.id?.toString() === productId?.toString(),
    )?.name ??
    productId ??
    "—";

  const handleOpenNew = () => {
    setEditRecipe(null);
    setForm({ productId: "", name: "" });
    setRecipeItems([{ ingredientId: "", quantity: "", unit: "kg" }]);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (recipe) => {
    setEditRecipe(recipe);
    setForm({ productId: recipe.productId ?? "", name: recipe.name ?? "" });
    setRecipeItems(
      recipe.ingredients?.length
        ? recipe.ingredients.map((i) => ({ ...i }))
        : [{ ingredientId: "", quantity: "", unit: "kg" }],
    );
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.productId) errs.productId = "Vui lòng chọn sản phẩm";
    const valid = recipeItems.filter(
      (i) => i.ingredientId && parseFloat(i.quantity) > 0,
    );
    if (valid.length === 0)
      errs.ingredients = "Vui lòng thêm ít nhất 1 nguyên liệu";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const validItems = recipeItems.filter(
        (i) => i.ingredientId && parseFloat(i.quantity) > 0,
      );
      const payload = {
        productId: form.productId,
        ...(form.name ? { name: form.name } : {}),
        ingredients: validItems,
      };
      if (editRecipe) {
        const updated = await managerService.recipes.update(
          editRecipe.id,
          payload,
        );
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editRecipe.id ? (updated ?? { ...r, ...payload }) : r,
          ),
        );
        toast.success("Đã cập nhật công thức");
      } else {
        const created = await managerService.recipes.create(payload);
        setRecipes((prev) => [...prev, created]);
        toast.success("Đã tạo công thức");
      }
      setShowModal(false);
    } catch {
      toast.error("Lưu công thức thất bại");
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
      toast.success("Đã xóa công thức");
      setConfirmDelete(null);
    } catch {
      toast.error("Xóa công thức thất bại");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Sản phẩm",
      accessor: "productId",
      sortable: true,
      render: (r) => (
        <span style={{ fontWeight: 500 }}>
          {r.name || getProductName(r.productId)}
        </span>
      ),
    },
    {
      header: "Mã SP",
      accessor: "productId",
      width: "90px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.productId}
        </span>
      ),
    },
    {
      header: "Số nguyên liệu",
      render: (r) => (
        <Badge variant="info">{r.ingredients?.length ?? 0} NL</Badge>
      ),
    },
    {
      header: "Nguyên liệu chính",
      render: (r) => {
        const first = r.ingredients?.[0];
        if (!first)
          return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const ing = ingredients.find((i) => i.id === first.ingredientId);
        return (
          <span style={{ fontSize: "13px" }}>
            {ing?.name || first.ingredientId}{" "}
            <span style={{ color: "var(--text-muted)" }}>
              {first.quantity} {first.unit}
            </span>
          </span>
        );
      },
    },
    {
      header: "",
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
              setViewRecipe(row);
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
        searchPlaceholder="Tìm công thức..."
        toolbar={<Badge variant="primary">{recipes.length} công thức</Badge>}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editRecipe ? "Sửa công thức" : "Thêm công thức mới"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {editRecipe ? "Lưu thay đổi" : "Tạo công thức"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
          <Input
            label="Tên công thức (tùy chọn)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Công thức Phở Bò Hà Nội"
          />

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
                color: "var(--text-secondary)",
              }}
            >
              Nguyên liệu <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            {errors.ingredients && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--danger)",
                  marginBottom: "8px",
                }}
              >
                {errors.ingredients}
              </p>
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {recipeItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 90px 36px",
                    gap: "8px",
                    alignItems: "end",
                  }}
                >
                  <Select
                    label={idx === 0 ? "Tên nguyên liệu" : ""}
                    options={ingredientOptions}
                    value={item.ingredientId}
                    onChange={(e) =>
                      setRecipeItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, ingredientId: e.target.value }
                            : r,
                        ),
                      )
                    }
                  />
                  <Input
                    label={idx === 0 ? "Định mức" : ""}
                    type="number"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) =>
                      setRecipeItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                quantity: parseFloat(e.target.value) || "",
                              }
                            : r,
                        ),
                      )
                    }
                    placeholder="0.15"
                  />
                  <Select
                    label={idx === 0 ? "Đơn vị" : ""}
                    options={UNIT_OPTIONS}
                    value={item.unit}
                    onChange={(e) =>
                      setRecipeItems((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, unit: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  {recipeItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={Trash2}
                      onClick={() =>
                        setRecipeItems((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              style={{ marginTop: "8px" }}
              onClick={() =>
                setRecipeItems((prev) => [
                  ...prev,
                  { ingredientId: "", quantity: "", unit: "kg" },
                ])
              }
            >
              + Thêm nguyên liệu
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewRecipe}
        onClose={() => setViewRecipe(null)}
        title={
          viewRecipe
            ? `Công thức: ${viewRecipe.name || getProductName(viewRecipe.productId)}`
            : ""
        }
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setViewRecipe(null)}>
            Đóng
          </Button>
        }
      >
        {viewRecipe && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Sản phẩm:
              </span>
              <Badge variant="neutral">
                {getProductName(viewRecipe.productId)}
              </Badge>
            </div>
            <div
              style={{
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 80px",
                  padding: "8px 12px",
                  background: "var(--surface-hover)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  gap: "8px",
                }}
              >
                <span>Nguyên liệu</span>
                <span>Định mức</span>
                <span>Đơn vị</span>
              </div>
              {viewRecipe.ingredients?.map((ing, i) => {
                const ingredient = ingredients.find(
                  (ig) => ig.id === ing.ingredientId,
                );
                return (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 80px",
                      padding: "8px 12px",
                      borderTop: "1px solid var(--surface-border)",
                      fontSize: "14px",
                      gap: "8px",
                    }}
                  >
                    <span>{ingredient?.name || ing.ingredientId}</span>
                    <span className="font-mono">{ing.quantity}</span>
                    <span>{ing.unit}</span>
                  </div>
                );
              })}
              {(!viewRecipe.ingredients ||
                viewRecipe.ingredients.length === 0) && (
                <div
                  style={{
                    padding: "16px 12px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Chưa có nguyên liệu
                </div>
              )}
            </div>
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
              Xóa công thức
            </Button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa công thức cho sản phẩm{" "}
          <strong>
            {confirmDelete ? getProductName(confirmDelete.productId) : ""}
          </strong>
          ? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </PageWrapper>
  );
}
