import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import managerService from "../../services/managerService";

const EMPTY_FORM = {
  kitchenId: "",
  ingredientId: "",
  quantity: "",
  minStock: "",
  batchNo: "",
  expiryDate: "",
  supplier: "",
};

export default function ManagerInventory() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [groupPages, setGroupPages] = useState({});
  const GROUP_PAGE_SIZE = 20;

  const getGroupPage = (kitchenId) => groupPages[kitchenId] ?? 0;
  const setGroupPage = (kitchenId, p) =>
    setGroupPages((prev) => ({ ...prev, [kitchenId]: p }));

  // Dropdowns
  const [kitchens, setKitchens] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Filters
  const [filterKitchenId, setFilterKitchenId] = useState("");
  const [filterLowStock, setFilterLowStock] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load dropdowns once
  useEffect(() => {
    Promise.all([
      managerService.inventory.getKitchens(),
      managerService.inventory.getIngredients(),
      managerService.inventory.getSuppliers(),
    ])
      .then(([k, i, s]) => {
        setKitchens(k ?? []);
        setIngredients(i ?? []);
        setSuppliers(s ?? []);
      })
      .catch(() => {});
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 20,
        ...(filterKitchenId ? { kitchenId: filterKitchenId } : {}),
        ...(filterLowStock !== ""
          ? { lowStock: filterLowStock === "true" }
          : {}),
      };
      const data = await managerService.inventory.getKitchen(params);
      setGroups(data?.content ?? []);
      setTotalPages(data?.page?.totalPages ?? 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải tồn kho");
    } finally {
      setLoading(false);
    }
  }, [page, filterKitchenId, filterLowStock]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const totalItems = groups.reduce((sum, g) => sum + (g.items?.length ?? 0), 0);
  const lowStockCount = groups.reduce(
    (sum, g) => sum + (g.items?.filter((i) => i.lowStock).length ?? 0),
    0,
  );

  const handleOpenNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (item, kitchenId) => {
    setEditItem(item);
    setForm({
      kitchenId,
      ingredientId: item.ingredientId,
      quantity: String(item.totalQuantity),
      minStock: String(item.minStock),
      batchNo: "",
      expiryDate: "",
      supplier: "",
    });
    setErrors({});
    setShowModal(true);
  };

  // Derive unit from selected ingredient
  const selectedIngredientUnit =
    ingredients.find((i) => i.id === form.ingredientId)?.unit ?? "";

  const validate = () => {
    const errs = {};
    if (!form.kitchenId) errs.kitchenId = "Vui lòng chọn bếp";
    if (!form.ingredientId) errs.ingredientId = "Vui lòng chọn nguyên liệu";
    if (form.quantity === "" || parseFloat(form.quantity) < 0)
      errs.quantity = "Số lượng phải >= 0";
    if (form.minStock === "" || parseFloat(form.minStock) < 0)
      errs.minStock = "Mức tối thiểu phải >= 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // Note: do NOT send unit — backend derives from ingredient
    const payload = {
      kitchenId: form.kitchenId,
      ingredientId: form.ingredientId,
      quantity: parseFloat(form.quantity),
      minStock: parseFloat(form.minStock),
      ...(form.batchNo ? { batchNo: form.batchNo } : {}),
      ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
      ...(form.supplier ? { supplier: form.supplier } : {}),
    };
    try {
      if (editItem) {
        await managerService.inventory.update(editItem.id, payload);
        toast.success("Đã cập nhật tồn kho");
      } else {
        await managerService.inventory.create(payload);
        toast.success("Đã thêm mục tồn kho");
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await managerService.inventory.delete(confirmDelete.id);
      toast.success("Đã xóa");
      setConfirmDelete(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  const kitchenOptions = kitchens.map((k) => ({ value: k.id, label: k.name }));
  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));
  const supplierOptions = [
    { value: "", label: "— Chọn nhà cung cấp —" },
    ...suppliers.map((s) => ({ value: s, label: s })),
  ];

  return (
    <PageWrapper
      title="Tồn kho bếp trung tâm"
      subtitle="Quản lý nguyên liệu theo từng bếp"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm nguyên liệu
        </Button>
      }
    >
      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            background: "var(--surface-card)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Tổng mục: </span>
          <strong>{totalItems}</strong>
        </div>
        <div
          style={{
            padding: "10px 16px",
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "var(--danger)" }}>Cần bổ sung: </span>
          <strong style={{ color: "var(--danger)" }}>{lowStockCount}</strong>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ minWidth: "200px" }}>
          <Select
            label="Lọc theo bếp"
            value={filterKitchenId}
            onChange={(e) => {
              setFilterKitchenId(e.target.value);
              setPage(0);
            }}
            options={[{ value: "", label: "Tất cả bếp" }, ...kitchenOptions]}
          />
        </div>
        <div style={{ minWidth: "180px" }}>
          <Select
            label="Tình trạng tồn kho"
            value={filterLowStock}
            onChange={(e) => {
              setFilterLowStock(e.target.value);
              setPage(0);
            }}
            options={[
              { value: "", label: "Tất cả" },
              { value: "true", label: "Cần bổ sung" },
              { value: "false", label: "Đủ hàng" },
            ]}
          />
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={fetchInventory}>
          Làm mới
        </Button>
      </div>

      {/* Grouped inventory */}
      {loading ? (
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "40px",
          }}
        >
          Đang tải...
        </p>
      ) : groups.length === 0 ? (
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "40px",
          }}
        >
          Không có dữ liệu tồn kho.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {groups.map((group) => (
            <div
              key={group.kitchenId}
              style={{
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              {/* Kitchen header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "var(--surface-hover)",
                  borderBottom: "1px solid var(--surface-border)",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "15px" }}>
                  {group.kitchenName}
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: "12px", color: "var(--text-muted)" }}
                >
                  {group.kitchenId}
                </span>
                <Badge variant="neutral" style={{ marginLeft: "auto" }}>
                  {group.items?.length ?? 0} nguyên liệu
                </Badge>
                {group.items?.some((i) => i.lowStock) && (
                  <Badge variant="danger" dot>
                    Cần bổ sung
                  </Badge>
                )}
              </div>

              {/* Items table */}
              {(() => {
                const gPage = getGroupPage(group.kitchenId);
                const gItems = group.items ?? [];
                const gTotalPages = Math.ceil(gItems.length / GROUP_PAGE_SIZE);
                const pagedItems = gItems.slice(
                  gPage * GROUP_PAGE_SIZE,
                  (gPage + 1) * GROUP_PAGE_SIZE,
                );
                return (
                  <>
                    <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    {[
                      "Nguyên liệu",
                      "Tồn kho",
                      "Tối thiểu",
                      "Trạng thái",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid var(--surface-border)" }}
                    >
                      <td style={{ padding: "10px 16px", fontWeight: 500 }}>
                        {item.ingredientName}
                        <div
                          className="font-mono"
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.ingredientId}
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 600,
                            color: item.lowStock
                              ? "var(--danger)"
                              : "var(--text-primary)",
                          }}
                        >
                          {item.totalQuantity} {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span
                          className="font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.minStock} {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {item.lowStock ? (
                          <Badge variant="danger" dot>
                            Cần bổ sung
                          </Badge>
                        ) : (
                          <Badge variant="success" dot>
                            Đủ hàng
                          </Badge>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={Edit}
                            title="Sửa"
                            onClick={() => handleEdit(item, group.kitchenId)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={Trash2}
                            title="Xóa"
                            onClick={() => setConfirmDelete(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gTotalPages > 1 && (
                <div
                  className="data-table-pagination"
                  style={{ borderTop: "1px solid var(--surface-border)" }}
                >
                  <div className="data-table-pagination__left">
                    <span className="data-table-pagination__info">
                      Hiển thị {gPage * GROUP_PAGE_SIZE + 1}–
                      {Math.min((gPage + 1) * GROUP_PAGE_SIZE, gItems.length)} /{" "}
                      {gItems.length}
                    </span>
                  </div>
                  <div className="data-table-pagination__controls">
                    <button
                      className="data-table-pagination__btn"
                      onClick={() => setGroupPage(group.kitchenId, 0)}
                      disabled={gPage === 0}
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      className="data-table-pagination__btn"
                      onClick={() => setGroupPage(group.kitchenId, gPage - 1)}
                      disabled={gPage === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, gTotalPages) }, (_, i) => {
                      let p;
                      if (gTotalPages <= 5) p = i + 1;
                      else if (gPage + 1 <= 3) p = i + 1;
                      else if (gPage + 1 >= gTotalPages - 2)
                        p = gTotalPages - 4 + i;
                      else p = gPage - 1 + i;
                      return (
                        <button
                          key={p}
                          className={`data-table-pagination__btn ${p === gPage + 1 ? "data-table-pagination__btn--active" : ""}`}
                          onClick={() => setGroupPage(group.kitchenId, p - 1)}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      className="data-table-pagination__btn"
                      onClick={() => setGroupPage(group.kitchenId, gPage + 1)}
                      disabled={gPage >= gTotalPages - 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="data-table-pagination__btn"
                      onClick={() =>
                        setGroupPage(group.kitchenId, gTotalPages - 1)
                      }
                      disabled={gPage >= gTotalPages - 1}
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="data-table-pagination" style={{ marginTop: "16px" }}>
          <div className="data-table-pagination__left">
            <span className="data-table-pagination__info">
              Trang {page + 1} / {totalPages}
            </span>
          </div>
          <div className="data-table-pagination__controls">
            <button
              className="data-table-pagination__btn"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="data-table-pagination__btn"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page + 1 <= 3) p = i + 1;
              else if (page + 1 >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 1 + i;
              return (
                <button
                  key={p}
                  className={`data-table-pagination__btn ${p === page + 1 ? "data-table-pagination__btn--active" : ""}`}
                  onClick={() => setPage(p - 1)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="data-table-pagination__btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="data-table-pagination__btn"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Cập nhật tồn kho" : "Thêm nguyên liệu vào kho"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : editItem ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Select
            label="Bếp trung tâm *"
            value={form.kitchenId}
            onChange={(e) =>
              setForm((f) => ({ ...f, kitchenId: e.target.value }))
            }
            options={[{ value: "", label: "— Chọn bếp —" }, ...kitchenOptions]}
            error={errors.kitchenId}
            disabled={!!editItem}
          />
          <Select
            label={`Nguyên liệu *${selectedIngredientUnit ? ` (đơn vị: ${selectedIngredientUnit})` : ""}`}
            value={form.ingredientId}
            onChange={(e) =>
              setForm((f) => ({ ...f, ingredientId: e.target.value }))
            }
            options={[
              { value: "", label: "— Chọn nguyên liệu —" },
              ...ingredientOptions,
            ]}
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
              label="Số lượng *"
              type="number"
              min="0"
              step="0.001"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              error={errors.quantity}
            />
            <Input
              label="Mức tối thiểu *"
              type="number"
              min="0"
              step="0.001"
              value={form.minStock}
              onChange={(e) =>
                setForm((f) => ({ ...f, minStock: e.target.value }))
              }
              error={errors.minStock}
            />
          </div>
          <Input
            label="Số lô (Batch No)"
            value={form.batchNo}
            onChange={(e) =>
              setForm((f) => ({ ...f, batchNo: e.target.value }))
            }
            placeholder="VD: BATCH-APR-001"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <Input
              label="Hạn sử dụng"
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
            />
            <Select
              label="Nhà cung cấp"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
              options={supplierOptions}
            />
          </div>
          {form.supplier === "" && suppliers.length === 0 && (
            <Input
              label="Nhà cung cấp (nhập tay)"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
              placeholder="Tên nhà cung cấp"
            />
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xác nhận xóa"
        size="sm"
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
        <p style={{ fontSize: "14px" }}>
          Xóa <strong>{confirmDelete?.ingredientName}</strong> khỏi kho?
        </p>
      </Modal>
    </PageWrapper>
  );
}
