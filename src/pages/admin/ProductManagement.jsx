import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Upload, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Input, Select, Card } from "../../components/ui";
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
  category: "OTHER",
  unit: "phần",
  price: "",
  cost: "",
};

export default function ProductManagement() {
  const { formatCurrency } = useData();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prod, cats] = await Promise.all([
        managerService.products.getAll({ size: 200 }),
        managerService.products.getCategories(),
      ]);
      setProducts(Array.isArray(prod) ? prod : (prod?.content ?? []));
      setCategories(
        Array.isArray(cats)
          ? cats.map((c) => ({ value: c, label: c }))
          : []
      );
    } catch (err) {
      toast.error("Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const incoming = Array.from(files);
    
    // Update imageFiles (appending to existing if multiple calls)
    const dt = new DataTransfer();
    if (imageFiles) Array.from(imageFiles).forEach(f => dt.items.add(f));
    incoming.forEach(f => dt.items.add(f));
    setImageFiles(dt.files);

    // Update previews
    const newPreviews = incoming.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index]);
    
    // Update previews
    const nextPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(nextPreviews);

    // Update imageFiles
    const dt = new DataTransfer();
    Array.from(imageFiles).filter((_, i) => i !== index).forEach(f => dt.items.add(f));
    setImageFiles(dt.files.length > 0 ? dt.files : null);
  };

  const handleSelectAll = (e) => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setIsBulkDelete(true);
    setConfirmDelete({ name: `${selectedIds.length} sản phẩm đã chọn` });
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      if (isBulkDelete) {
        // Sequential delete as BE lacks batch endpoint
        await Promise.all(selectedIds.map(id => managerService.products.delete(id)));
        toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
        setSelectedIds([]);
      } else {
        await managerService.products.delete(confirmDelete.id);
        toast.success(`Đã xóa sản phẩm ${confirmDelete.name}`);
      }
      setConfirmDelete(null);
      setIsBulkDelete(false);
      fetchData();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập tên";
    if (!form.price) errs.price = "Vui lòng nhập giá";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const fields = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: parseInt(form.price),
        cost: parseInt(form.cost || 0),
        ...(imageFiles ? { images: imageFiles } : {}),
      };

      if (editProduct) {
        await managerService.products.update(editProduct.id, fields);
        toast.success("Cập nhật thành công");
      } else {
        await managerService.products.create(fields);
        toast.success("Tạo mới thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error("Lưu sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: (
        <div onClick={(e) => { e.stopPropagation(); handleSelectAll(); }} style={{ cursor: "pointer" }}>
          {selectedIds.length === products.length && products.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
        </div>
      ),
      width: "40px",
      render: (r) => (
        <div onClick={(e) => { e.stopPropagation(); handleSelectOne(r.id); }} style={{ cursor: "pointer" }}>
          {selectedIds.includes(r.id) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
        </div>
      )
    },
    {
      header: "Sản phẩm",
      accessor: "name",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--surface-sub)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
             {r.imageUrl?.[0] ? <img src={r.imageUrl[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍽"}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.category}</div>
          </div>
        </div>
      )
    },
    { header: "Đơn vị", accessor: "unit" },
    { header: "Giá bán", accessor: "price", render: (r) => formatCurrency(r.price) },
    { header: "Giá vốn", accessor: "cost", render: (r) => formatCurrency(r.cost) },
    {
      header: "Thao tác",
      width: "100px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button variant="ghost" size="sm" iconOnly icon={Edit} onClick={() => {
            setEditProduct(row);
            setForm({ name: row.name, category: row.category, unit: row.unit, price: row.price, cost: row.cost });
            setShowModal(true);
          }} />
          <Button variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => {
            setIsBulkDelete(false);
            setConfirmDelete(row);
          }} />
        </div>
      )
    }
  ];

  return (
    <PageWrapper
      title="Quản lý sản phẩm hệ thống"
      subtitle="Quản trị danh mục sản phẩm toàn hệ thống"
      actions={
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedIds.length > 0 && (
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>
              Xóa {selectedIds.length} mục
            </Button>
          )}
          <Button icon={Plus} onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); }}>
            Thêm sản phẩm
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Tìm kiếm sản phẩm..."
        toolbar={<Badge variant="primary">{products.length} sản phẩm</Badge>}
      />

      {/* CRUD Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Xác nhận"}</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
           <Input label="Tên sản phẩm" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} error={errors.name} />
           <div className="grid grid--2">
              <Select label="Danh mục" options={categories} value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
              <Select label="Đơn vị" options={UNIT_OPTIONS} value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} />
           </div>
           <div className="grid grid--2">
              <Input label="Giá bán" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} error={errors.price} />
              <Input label="Giá vốn" type="number" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} />
           </div>
           <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Hình ảnh sản phẩm</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "var(--border)";
                  if (e.dataTransfer.files) handleImageChange({ target: { files: e.dataTransfer.files } });
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
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>Nhấn để tải lên</span> hoặc kéo thả
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  PNG, JPG, JPEG (Tối đa 10MB)
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
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
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
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

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xác nhận xóa"
        variant="danger"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={saving}>Xóa ngay</Button>
          </>
        }
      >
        <p>Bạn có chắc chắn muốn xóa <strong>{confirmDelete?.name}</strong>? Thao tác này không thể hoàn tác.</p>
      </Modal>
    </PageWrapper>
  );
}
