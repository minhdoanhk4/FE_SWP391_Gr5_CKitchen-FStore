import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Upload } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import managerService from "../../services/managerService";

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
  const { ingredients, formatCurrency } = useData();

  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const setImages = (files) => {
    if (!files || files.length === 0) {
      setImagePreviews((prev) => { prev.forEach(URL.revokeObjectURL); return []; });
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
    ])
      .then(([prod, rec, cats]) => {
        if (!mounted) return;
        setProducts(Array.isArray(prod) ? prod : (prod?.content ?? []));
        setRecipes(Array.isArray(rec) ? rec : (rec?.content ?? []));
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
      .catch(() => { if (mounted) toast.error("Không thể tải dữ liệu sản phẩm"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
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

  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

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
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await managerService.products.delete(confirmDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      toast.success(`Đã xóa sản phẩm ${confirmDelete.name}`);
      setConfirmDelete(null);
    } catch {
      toast.error("Xóa sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRecipe = (product) => {
    const existing = recipes.find(
      (r) =>
        r.productId === product.id || r.productId === product.id?.toString(),
    );
    setRecipeItems(
      existing?.ingredients?.length
        ? existing.ingredients.map((i) => ({ ...i }))
        : [{ ingredientId: "", quantity: "", unit: "kg" }],
    );
    setShowRecipeModal(product);
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
      const existing = recipes.find(
        (r) =>
          r.productId === showRecipeModal.id ||
          r.productId === showRecipeModal.id?.toString(),
      );
      const payload = {
        productId: showRecipeModal.id,
        ingredients: validItems,
      };
      if (existing) {
        const updated = await managerService.recipes.update(
          existing.id,
          payload,
        );
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === existing.id ? (updated ?? { ...r, ...payload }) : r,
          ),
        );
      } else {
        const created = await managerService.recipes.create(payload);
        setRecipes((prev) => [...prev, created]);
      }
      toast.success(`Đã lưu công thức cho ${showRecipeModal.name}`);
      setShowRecipeModal(null);
    } catch {
      toast.error("Lưu công thức thất bại");
    } finally {
      setSaving(false);
    }
  };

  const recipe = viewProduct
    ? recipes.find(
        (r) =>
          r.productId === viewProduct.id ||
          r.productId === viewProduct.id?.toString(),
      )
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
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm sản phẩm
        </Button>
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
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Hình ảnh sản phẩm
            </label>
            {imagePreviews.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--surface-border)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(src);
                        const newPreviews = imagePreviews.filter((_, idx) => idx !== i);
                        const dt = new DataTransfer();
                        Array.from(imageFiles).filter((_, idx) => idx !== i).forEach((f) => dt.items.add(f));
                        setImagePreviews(newPreviews);
                        setImageFiles(dt.files.length > 0 ? dt.files : null);
                      }}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--danger)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "11px",
                        lineHeight: "18px",
                        textAlign: "center",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div
              style={{
                border: "1px dashed var(--surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} color="var(--text-muted)" style={{ marginBottom: 2 }} />
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                {imagePreviews.length > 0 ? "Thêm ảnh khác" : "Nhấp để chọn ảnh"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => setImages(e.target.files)}
            />
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
            {viewProduct.images?.length > 0 && (
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
                  {viewProduct.images.map((url, i) => (
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
                  {recipe.ingredients?.map((ing, i) => {
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
        onClose={() => setShowRecipeModal(null)}
        title={showRecipeModal ? `Công thức: ${showRecipeModal.name}` : ""}
        size="lg"
        footer={
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
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Định mức nguyên liệu cho 1 {showRecipeModal?.unit || "phần"} sản
            phẩm
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
