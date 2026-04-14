import { useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Card } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const CATEGORY_OPTIONS = [
  { value: "Phở", label: "Phở" },
  { value: "Bún", label: "Bún" },
  { value: "Cơm", label: "Cơm" },
  { value: "Bánh mì", label: "Bánh mì" },
  { value: "Khai vị", label: "Khai vị" },
  { value: "Gia vị", label: "Gia vị" },
  { value: "Bán thành phẩm", label: "Bán thành phẩm" },
];

const UNIT_OPTIONS = [
  { value: "phần", label: "Phần" },
  { value: "ổ", label: "Ổ" },
  { value: "lít", label: "Lít" },
  { value: "kg", label: "Kg" },
];

export default function ProductCatalog() {
  const { user } = useAuth();
  const {
    products,
    ingredients,
    recipes,
    formatCurrency,
    addProduct,
    updateProduct,
    deleteProduct,
    addRecipe,
    updateRecipe,
    addAuditLog,
  } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "phần",
    price: "",
    cost: "",
  });
  const [errors, setErrors] = useState({});

  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const handleOpenNew = () => {
    setEditProduct(null);
    setForm({ name: "", category: "", unit: "phần", price: "", cost: "" });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price.toString(),
      cost: product.cost.toString(),
    });
    setErrors({});
    setShowModal(true);
  };

  const handleView = (product) => {
    setViewProduct(product);
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

  const handleSave = () => {
    if (!validate()) return;
    if (editProduct) {
      updateProduct(editProduct.id, {
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: parseInt(form.price) || 0,
        cost: parseInt(form.cost) || 0,
      });
      addAuditLog("product_updated", user.name, `Cập nhật sản phẩm ${form.name}`, "products");
      toast.success(`Đã cập nhật sản phẩm ${form.name}`);
    } else {
      const maxNum = products.reduce((max, p) => {
        const num = parseInt(p.id.replace("SP", ""));
        return num > max ? num : max;
      }, 0);
      addProduct({
        id: `SP${String(maxNum + 1).padStart(3, "0")}`,
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: parseInt(form.price) || 0,
        cost: parseInt(form.cost) || 0,
        image: null,
      });
      addAuditLog("product_created", user.name, `Tạo sản phẩm ${form.name}`, "products");
      toast.success(`Đã tạo sản phẩm ${form.name}`);
    }
    setShowModal(false);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteProduct(confirmDelete.id);
    addAuditLog("product_deleted", user.name, `Xóa sản phẩm ${confirmDelete.name}`, "products");
    toast.success(`Đã xóa sản phẩm ${confirmDelete.name}`);
    setConfirmDelete(null);
  };

  // Recipe CRUD
  const handleOpenRecipe = (product) => {
    const existing = recipes.find((r) => r.productId === product.id);
    setRecipeItems(
      existing
        ? existing.ingredients.map((i) => ({ ...i }))
        : [{ ingredientId: "", quantity: "", unit: "kg" }],
    );
    setShowRecipeModal(product);
  };

  const handleSaveRecipe = () => {
    const validItems = recipeItems.filter(
      (i) => i.ingredientId && parseFloat(i.quantity) > 0,
    );
    if (validItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 nguyên liệu");
      return;
    }
    const existing = recipes.find((r) => r.productId === showRecipeModal.id);
    if (existing) {
      updateRecipe(showRecipeModal.id, { ingredients: validItems });
    } else {
      addRecipe({ productId: showRecipeModal.id, ingredients: validItems });
    }
    addAuditLog(
      "recipe_updated",
      user.name,
      `Cập nhật công thức ${showRecipeModal.name} (${validItems.length} NL)`,
      "products",
    );
    toast.success(`Đã lưu công thức cho ${showRecipeModal.name}`);
    setShowRecipeModal(null);
  };

  const recipe = viewProduct
    ? recipes.find((r) => r.productId === viewProduct.id)
    : null;

  const columns = [
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
      accessor: "profit",
      render: (r) => {
        const profit =
          r.price > 0
            ? (((r.price - r.cost) / r.price) * 100).toFixed(0)
            : "0";
        return (
          <Badge variant={profit > 50 ? "success" : "warning"}>{profit}%</Badge>
        );
      },
    },
    {
      header: "Công thức",
      render: (row) => {
        const hasRecipe = recipes.some((r) => r.productId === row.id);
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
              handleView(row);
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
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm sản phẩm
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={products}
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
            <Button onClick={handleSave}>
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
              options={CATEGORY_OPTIONS}
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

            {recipe && (
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
                  {recipe.ingredients.map((ing, i) => {
                    const ingredient = ingredients.find(
                      (ig) => ig.id === ing.ingredientId,
                    );
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--surface-border)",
                          fontSize: "14px",
                        }}
                      >
                        <span>{ingredient?.name || ing.ingredientId}</span>
                        <span className="font-mono">
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!recipe && (
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
            >
              Xóa sản phẩm
            </Button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa sản phẩm{" "}
          <strong>{confirmDelete?.name}</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>

      {/* Recipe Editor Modal */}
      <Modal
        isOpen={!!showRecipeModal}
        onClose={() => setShowRecipeModal(null)}
        title={
          showRecipeModal
            ? `Công thức: ${showRecipeModal.name}`
            : ""
        }
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRecipeModal(null)}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveRecipe}>Lưu công thức</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Định mức nguyên liệu cho 1 {showRecipeModal?.unit || "phần"} sản phẩm
          </p>
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
                options={ingredientOptions}
                value={item.ingredientId}
                onChange={(e) =>
                  setRecipeItems((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, ingredientId: e.target.value } : r,
                    ),
                  )
                }
              />
              <Input
                label={idx === 0 ? "Định mức" : ""}
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) =>
                  setRecipeItems((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, quantity: parseFloat(e.target.value) || "" } : r,
                    ),
                  )
                }
                placeholder="0.15"
              />
              <Select
                label={idx === 0 ? "Đơn vị" : ""}
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lít", label: "lít" },
                  { value: "g", label: "g" },
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
              {recipeItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={Trash2}
                  onClick={() =>
                    setRecipeItems((prev) => prev.filter((_, i) => i !== idx))
                  }
                  style={{ marginTop: idx === 0 ? "24px" : "0" }}
                />
              )}
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
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
      </Modal>
    </PageWrapper>
  );
}
