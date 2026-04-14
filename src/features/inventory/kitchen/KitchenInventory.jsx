import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../../components/ui";
import { Input, Select } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export default function KitchenInventory() {
  const { user } = useAuth();
  const {
    kitchenInventory,
    ingredients,
    updateKitchenInventory,
    addKitchenInventoryItem,
    addAuditLog,
    formatDate,
    isExpiringSoon,
    isExpired,
  } = useData();

  const [showImport, setShowImport] = useState(false);
  const [confirmDispose, setConfirmDispose] = useState(null);
  const [form, setForm] = useState({
    ingredientId: "",
    quantity: "",
    batchNo: "",
    expiryDate: "",
    supplier: "",
  });
  const [errors, setErrors] = useState({});

  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const existingBatchCodes = useMemo(() => {
    const codes = new Set(kitchenInventory.map((i) => i.batchNo).filter(Boolean));
    return [...codes].sort();
  }, [kitchenInventory]);

  const handleOpenImport = () => {
    setForm({
      ingredientId: "",
      quantity: "",
      batchNo: `LO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(kitchenInventory.length + 1).padStart(2, "0")}`,
      expiryDate: "",
      supplier: "",
    });
    setErrors({});
    setShowImport(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.ingredientId) errs.ingredientId = "Vui lòng chọn nguyên liệu";
    if (!form.quantity || parseInt(form.quantity) <= 0)
      errs.quantity = "Vui lòng nhập số lượng";
    if (!form.expiryDate) errs.expiryDate = "Vui lòng nhập hạn sử dụng";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const ing = ingredients.find((i) => i.id === form.ingredientId);
    const qty = parseInt(form.quantity);

    // Check if this ingredient already exists in inventory — add to quantity
    const existing = kitchenInventory.find(
      (i) => i.ingredientId === form.ingredientId,
    );

    if (existing) {
      updateKitchenInventory(existing.id, {
        quantity: existing.quantity + qty,
        batchNo: form.batchNo || existing.batchNo,
        expiryDate: form.expiryDate || existing.expiryDate,
        supplier: form.supplier || existing.supplier,
      });
    } else {
      addKitchenInventoryItem({
        id: Date.now(),
        ingredientId: form.ingredientId,
        name: ing?.name || form.ingredientId,
        quantity: qty,
        unit: ing?.unit || "kg",
        minStock: ing?.minStock || 10,
        batchNo: form.batchNo,
        expiryDate: form.expiryDate,
        supplier: form.supplier || ing?.supplier || "",
      });
    }

    addAuditLog(
      "inventory_import",
      user.name,
      `Nhập ${qty}${ing?.unit || "kg"} ${ing?.name || form.ingredientId} (${form.batchNo})`,
      "inventory",
    );

    toast.success(
      `Nhập kho ${qty}${ing?.unit || "kg"} ${ing?.name || form.ingredientId}`,
    );
    setShowImport(false);
  };

  const handleDispose = (item) => {
    setConfirmDispose(item);
  };

  const handleDisposeConfirm = () => {
    if (!confirmDispose) return;
    const item = confirmDispose;
    updateKitchenInventory(item.id, { quantity: 0 });
    addAuditLog(
      "ingredient_disposed",
      user.name,
      `Hủy ${item.quantity}${item.unit} ${item.name} (lô ${item.batchNo}) - hết hạn SD`,
      "inventory",
    );
    toast.success(`Đã hủy ${item.quantity}${item.unit} ${item.name}`);
    setConfirmDispose(null);
  };

  const columns = [
    { header: "Nguyên liệu", accessor: "name", sortable: true },
    {
      header: "Lô",
      accessor: "batchNo",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.batchNo}
        </span>
      ),
    },
    { header: "Nhà cung cấp", accessor: "supplier" },
    {
      header: "Tồn kho",
      accessor: "quantity",
      sortable: true,
      render: (row) => {
        const isLow = row.quantity <= row.minStock;
        return (
          <span
            style={{
              fontWeight: 600,
              color: isLow ? "var(--danger)" : "var(--text-primary)",
            }}
          >
            {row.quantity} {row.unit}
          </span>
        );
      },
    },
    {
      header: "Tối thiểu",
      accessor: "minStock",
      render: (r) => `${r.minStock} ${r.unit}`,
    },
    {
      header: "Hạn SD",
      accessor: "expiryDate",
      sortable: true,
      render: (row) => {
        const expired = isExpired(row.expiryDate);
        const expiring = isExpiringSoon(row.expiryDate);
        return (
          <span
            style={{
              color: expired
                ? "var(--danger)"
                : expiring
                  ? "var(--warning)"
                  : "var(--text-primary)",
            }}
          >
            {formatDate(row.expiryDate)}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      render: (row) => {
        if (isExpired(row.expiryDate))
          return (
            <Badge variant="danger" dot>
              Hết hạn
            </Badge>
          );
        if (row.quantity <= row.minStock)
          return (
            <Badge variant="danger" dot>
              Cần bổ sung
            </Badge>
          );
        if (isExpiringSoon(row.expiryDate))
          return (
            <Badge variant="warning" dot>
              Sắp hết hạn
            </Badge>
          );
        return (
          <Badge variant="success" dot>
            Bình thường
          </Badge>
        );
      },
    },
    {
      header: "Hành động",
      width: "100px",
      render: (row) => {
        if (row.quantity === 0) return "\u2014";
        const expired = isExpired(row.expiryDate);
        const expiring = isExpiringSoon(row.expiryDate);
        if (expired || expiring) {
          return (
            <Button
              size="sm"
              variant={expired ? "danger" : "warning"}
              icon={Trash2}
              onClick={() => handleDispose(row)}
            >
              Hủy
            </Button>
          );
        }
        return "\u2014";
      },
    },
  ];

  const lowStockCount = kitchenInventory.filter(
    (i) => i.quantity <= i.minStock,
  ).length;

  const expiredCount = kitchenInventory.filter(
    (i) => isExpired(i.expiryDate) && i.quantity > 0,
  ).length;

  return (
    <PageWrapper
      title="Kho nguyên liệu"
      subtitle="Quản lý nguyên liệu đầu vào, hạn sử dụng và lô hàng"
      actions={
        <Button icon={Plus} onClick={handleOpenImport}>
          Nhập nguyên liệu
        </Button>
      }
    >
      {expiredCount > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--danger-bg, #fef2f2)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
            fontSize: "14px",
            color: "var(--danger)",
            fontWeight: 600,
          }}
        >
          {expiredCount} nguyên liệu hết hạn cần xử lý. Vui lòng hủy bỏ các nguyên liệu hết hạn.
        </div>
      )}

      {lowStockCount > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--danger-bg, #fef2f2)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
            fontSize: "14px",
            color: "var(--danger)",
          }}
        >
          {lowStockCount} nguyên liệu dưới mức tối thiểu. Vui lòng nhập thêm.
        </div>
      )}

      <DataTable
        columns={columns}
        data={kitchenInventory}
        searchPlaceholder="Tìm nguyên liệu..."
      />

      {/* Import modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Nhập nguyên liệu vào kho"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowImport(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Xác nhận nhập kho</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select
            label="Nguyên liệu"
            required
            options={ingredientOptions}
            value={form.ingredientId}
            onChange={(e) =>
              setForm((f) => ({ ...f, ingredientId: e.target.value }))
            }
            error={errors.ingredientId}
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
              min="1"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              placeholder="100"
              error={errors.quantity}
            />
            <div>
              <Input
                label="Mã lô hàng"
                value={form.batchNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, batchNo: e.target.value }))
                }
                placeholder="Chọn hoặc nhập mã lô mới..."
                list="batchno-suggestions"
                hint="Chọn mã lô có sẵn hoặc nhập mã mới"
              />
              <datalist id="batchno-suggestions">
                {existingBatchCodes.map((code) => (
                  <option key={code} value={code} />
                ))}
              </datalist>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Hạn sử dụng"
              required
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
              error={errors.expiryDate}
            />
            <Input
              label="Nhà cung cấp"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
              placeholder="Vissan, CP Foods..."
            />
          </div>

          {form.ingredientId && (
            <div
              style={{
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
              }}
            >
              {(() => {
                const existing = kitchenInventory.find(
                  (i) => i.ingredientId === form.ingredientId,
                );
                if (existing) {
                  return (
                    <>
                      Tồn kho hiện tại:{" "}
                      <strong>
                        {existing.quantity} {existing.unit}
                      </strong>
                      {form.quantity && (
                        <>
                          {" "}
                          &rarr; Sau nhập:{" "}
                          <strong style={{ color: "var(--success)" }}>
                            {existing.quantity + parseInt(form.quantity)}{" "}
                            {existing.unit}
                          </strong>
                        </>
                      )}
                    </>
                  );
                }
                return "Nguyên liệu mới - sẽ tạo mục kho mới.";
              })()}
            </div>
          )}
        </div>
      </Modal>

      {/* Dispose confirmation modal */}
      <Modal
        isOpen={!!confirmDispose}
        onClose={() => setConfirmDispose(null)}
        title="Xác nhận hủy nguyên liệu"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDispose(null)}>
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={handleDisposeConfirm}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        {confirmDispose && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <p>
              Bạn có chắc muốn hủy toàn bộ nguyên liệu này?
            </p>
            <div
              style={{
                padding: "12px",
                background: "var(--danger-bg, #fef2f2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--danger)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Nguyên liệu:</span>
                <strong>{confirmDispose.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Số lượng hủy:</span>
                <strong>{confirmDispose.quantity} {confirmDispose.unit}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Lô hàng:</span>
                <span className="font-mono">{confirmDispose.batchNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Hạn SD:</span>
                <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                  {formatDate(confirmDispose.expiryDate)}
                </span>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Số lượng sẽ được đặt về 0. Thao tác này không thể hoàn tác.
            </p>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
