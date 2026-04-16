import { useState, useMemo, useRef } from "react";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Card } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

export default function StoreSales() {
  const { user } = useAuth();
  const {
    salesRecords,
    storeInventory,
    products,
    addSale,
    updateStoreInventory,
    addAuditLog,
    formatCurrency,
    formatDate,
    formatDateTime,
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [saleItems, setSaleItems] = useState([{ productId: "", quantity: "" }]);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);

  // Filter sales for this store
  const storeSales = salesRecords.filter((s) => s.storeId === user.store);

  // Products available in this store's inventory
  const storeProducts = useMemo(() => {
    const inv = storeInventory.filter((i) => i.storeId === user.store);
    return inv.map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return {
        value: i.productId,
        label: `${i.productName} (tồn: ${i.quantity} ${i.unit})`,
        stock: i.quantity,
        unit: i.unit,
        price: product?.price || 0,
        inventoryId: i.id,
        productName: i.productName,
      };
    });
  }, [storeInventory, products, user.store]);

  const handleAddItem = () => {
    setSaleItems((prev) => [...prev, { productId: "", quantity: "" }]);
  };

  const handleRemoveItem = (idx) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setSaleItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const totalRevenue = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const prod = storeProducts.find((p) => p.value === item.productId);
      if (!prod || !item.quantity) return sum;
      return sum + prod.price * parseInt(item.quantity);
    }, 0);
  }, [saleItems, storeProducts]);

  const validate = () => {
    const errs = {};
    if (!saleDate) errs.date = "Vui lòng chọn ngày";
    const validItems = saleItems.filter(
      (i) => i.productId && parseInt(i.quantity) > 0,
    );
    if (validItems.length === 0)
      errs.items = "Vui lòng thêm ít nhất 1 sản phẩm";
    validItems.forEach((item, idx) => {
      const prod = storeProducts.find((p) => p.value === item.productId);
      if (prod && parseInt(item.quantity) > prod.stock) {
        errs[`item_${idx}`] = `Vượt tồn kho (còn ${prod.stock})`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const validItems = saleItems
      .filter((i) => i.productId && parseInt(i.quantity) > 0)
      .map((item) => {
        const prod = storeProducts.find((p) => p.value === item.productId);
        return {
          productId: item.productId,
          productName: prod?.productName || item.productId,
          quantity: parseInt(item.quantity),
          unit: prod?.unit || "phần",
          unitPrice: prod?.price || 0,
        };
      });

    const revenue = validItems.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );

    const saleId = `SR${Date.now().toString().slice(-6)}`;
    addSale({
      id: saleId,
      storeId: user.store,
      date: saleDate,
      items: validItems,
      totalRevenue: revenue,
      recordedBy: user.name,
      recordedAt: new Date().toISOString(),
    });

    // Auto-deduct from store inventory
    validItems.forEach((item) => {
      const inv = storeInventory.find(
        (i) => i.storeId === user.store && i.productId === item.productId,
      );
      if (inv) {
        updateStoreInventory(inv.id, {
          quantity: Math.max(0, inv.quantity - item.quantity),
        });
      }
    });

    addAuditLog(
      "sale_recorded",
      user.name,
      `Ghi nhận doanh thu ${formatCurrency(revenue)} (${validItems.length} SP)`,
      "sales",
    );

    toast.success(`Ghi nhận doanh thu ${formatCurrency(revenue)}`);
    setShowModal(false);
    setSaleItems([{ productId: "", quantity: "" }]);
  };

  const handleDownloadTemplate = () => {
    const header = "Ngay ban,Ma san pham,Ten san pham,So luong";
    const today = new Date().toISOString().split("T")[0];
    const rows = storeProducts.map(
      (p) => `${today},${p.value},"${p.label.split(" (")[0]}",0`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mau_ghi_nhan_ban_hang_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result.replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("File không có dữ liệu");
        return;
      }
      const parsed = lines.slice(1).map((line, idx) => {
        // Handle quoted fields
        const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
        const clean = cols.map((c) => c.replace(/^"|"$/g, "").trim());
        const [date, productId, , qty] = clean;
        const prod = storeProducts.find(
          (p) =>
            p.value === productId ||
            p.label.split(" (")[0].toLowerCase() === (productId || "").toLowerCase(),
        );
        const quantity = parseInt(qty);
        let error = null;
        if (!date) error = "Thiếu ngày bán";
        else if (!prod) error = `Không tìm thấy sản phẩm "${productId}"`;
        else if (!quantity || quantity <= 0) error = "Số lượng không hợp lệ";
        else if (quantity > prod.stock) error = `Vượt tồn kho (còn ${prod.stock})`;
        return {
          rowNum: idx + 2,
          date,
          productId: prod?.value || productId,
          productName: prod?.label.split(" (")[0] || productId,
          quantity: isNaN(quantity) ? 0 : quantity,
          unitPrice: prod?.price || 0,
          unit: prod?.unit || "",
          stock: prod?.stock || 0,
          error,
        };
      });
      setImportPreview(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportConfirm = () => {
    const validRows = importPreview.filter((r) => !r.error && r.quantity > 0);
    if (validRows.length === 0) {
      toast.error("Không có dòng hợp lệ để nhập");
      return;
    }

    // Group by date
    const byDate = {};
    validRows.forEach((r) => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });

    let totalRev = 0;
    Object.entries(byDate).forEach(([date, items]) => {
      const saleId = `SR${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
      const revenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      totalRev += revenue;
      addSale({
        id: saleId,
        storeId: user.store,
        date,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
        })),
        totalRevenue: revenue,
        recordedBy: user.name,
        recordedAt: new Date().toISOString(),
      });

      items.forEach((item) => {
        const inv = storeInventory.find(
          (i) => i.storeId === user.store && i.productId === item.productId,
        );
        if (inv) {
          updateStoreInventory(inv.id, {
            quantity: Math.max(0, inv.quantity - item.quantity),
          });
        }
      });
    });

    addAuditLog(
      "sale_recorded",
      user.name,
      `Import ${validRows.length} dòng, doanh thu ${formatCurrency(totalRev)}`,
      "sales",
    );

    toast.success(`Đã nhập ${validRows.length} dòng — ${formatCurrency(totalRev)}`);
    setShowImportModal(false);
    setImportPreview([]);
  };

  const columns = [
    {
      header: "Mã",
      accessor: "id",
      width: "100px",
      render: (r) => <span className="font-mono">{r.id}</span>,
    },
    {
      header: "Ngày",
      accessor: "date",
      sortable: true,
      render: (r) => formatDate(r.date),
    },
    {
      header: "Sản phẩm",
      accessor: "items",
      render: (r) => (
        <div>
          {r.items.map((item, i) => (
            <div key={i} style={{ fontSize: "13px" }}>
              {item.productName} x {item.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Doanh thu",
      accessor: "totalRevenue",
      sortable: true,
      render: (r) => (
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--success)" }}
        >
          {formatCurrency(r.totalRevenue)}
        </span>
      ),
    },
    {
      header: "Ghi nhận bởi",
      accessor: "recordedBy",
    },
    {
      header: "Thời gian",
      accessor: "recordedAt",
      render: (r) => formatDateTime(r.recordedAt),
    },
  ];

  // Summary stats
  const todayRevenue = storeSales
    .filter((s) => s.date === new Date().toISOString().split("T")[0])
    .reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalAllRevenue = storeSales.reduce(
    (sum, s) => sum + s.totalRevenue,
    0,
  );

  return (
    <PageWrapper
      title="Ghi nhận bán hàng"
      subtitle="Cập nhật doanh thu bán hàng hàng ngày"
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Button variant="secondary" icon={Download} onClick={handleDownloadTemplate}>
            Tải mẫu Excel
          </Button>
          <Button variant="secondary" icon={Upload} onClick={handleImportClick}>
            Import Excel
          </Button>
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Ghi nhận bán hàng
          </Button>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Doanh thu hôm nay
          </span>
          <p
            className="font-mono"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--success)",
            }}
          >
            {formatCurrency(todayRevenue)}
          </p>
        </Card>
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Tổng doanh thu
          </span>
          <p
            className="font-mono"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--primary)",
            }}
          >
            {formatCurrency(totalAllRevenue)}
          </p>
        </Card>
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Số lượt ghi nhận
          </span>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>
            {storeSales.length}
          </p>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={storeSales}
        searchPlaceholder="Tìm theo mã, ngày..."
        emptyTitle="Chưa có dữ liệu bán hàng"
        emptyDesc="Bấm 'Ghi nhận bán hàng' để bắt đầu."
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ghi nhận bán hàng"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu doanh thu</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Ngày bán"
            type="date"
            required
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            error={errors.date}
          />

          {errors.items && (
            <p style={{ color: "var(--danger)", fontSize: "13px" }}>
              {errors.items}
            </p>
          )}

          {saleItems.map((item, idx) => {
            const prod = storeProducts.find((p) => p.value === item.productId);
            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 40px",
                  gap: "8px",
                  alignItems: "start",
                }}
              >
                <Select
                  label={idx === 0 ? "Sản phẩm" : ""}
                  options={storeProducts}
                  value={item.productId}
                  onChange={(e) =>
                    handleItemChange(idx, "productId", e.target.value)
                  }
                />
                <Input
                  label={idx === 0 ? "Số lượng" : ""}
                  type="number"
                  min="1"
                  max={prod?.stock || 9999}
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", e.target.value)
                  }
                  error={errors[`item_${idx}`]}
                />
                {saleItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={Trash2}
                    onClick={() => handleRemoveItem(idx)}
                    style={{ marginTop: idx === 0 ? "24px" : "0" }}
                  />
                )}
              </div>
            );
          })}

          <Button variant="secondary" size="sm" onClick={handleAddItem}>
            + Thêm sản phẩm
          </Button>

          {totalRevenue > 0 && (
            <div
              style={{
                padding: "12px",
                background: "var(--primary-bg)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
              }}
            >
              Tổng doanh thu:{" "}
              <strong style={{ color: "var(--success)" }}>
                {formatCurrency(totalRevenue)}
              </strong>
            </div>
          )}
        </div>
      </Modal>

      {/* Import preview modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportPreview([]); }}
        title="Xem trước dữ liệu import"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowImportModal(false); setImportPreview([]); }}>
              Hủy
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={importPreview.every((r) => r.error)}
            >
              Nhập {importPreview.filter((r) => !r.error).length} dòng hợp lệ
            </Button>
          </>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-hover)" }}>
                {["Dòng", "Ngày bán", "Sản phẩm", "Số lượng", "Trạng thái"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importPreview.map((row) => (
                <tr
                  key={row.rowNum}
                  style={{ borderTop: "1px solid var(--surface-border)", background: row.error ? "rgba(var(--danger-rgb,220,53,69),0.05)" : undefined }}
                >
                  <td style={{ padding: "6px 10px", color: "var(--text-muted)" }}>{row.rowNum}</td>
                  <td style={{ padding: "6px 10px" }}>{row.date || "—"}</td>
                  <td style={{ padding: "6px 10px" }}>{row.productName}</td>
                  <td style={{ padding: "6px 10px" }}>{row.quantity}</td>
                  <td style={{ padding: "6px 10px" }}>
                    {row.error
                      ? <span style={{ color: "var(--danger)", fontSize: "12px" }}>{row.error}</span>
                      : <span style={{ color: "var(--success)", fontSize: "12px" }}>Hợp lệ</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </PageWrapper>
  );
}
