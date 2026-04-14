import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export default function StoreInventory() {
  const { user } = useAuth();
  const {
    storeInventory,
    updateStoreInventory,
    addAuditLog,
    formatDate,
    isExpiringSoon,
    isExpired,
  } = useData();
  const location = useLocation();

  const [confirmDispose, setConfirmDispose] = useState(null);

  // If rendered under /store, filter by user's store. Under /manager, show all.
  const isManagerView = location.pathname.startsWith("/manager");
  const data = isManagerView
    ? storeInventory
    : storeInventory.filter((i) => i.storeId === user.store);

  const handleDispose = (item) => {
    setConfirmDispose(item);
  };

  const handleDisposeConfirm = () => {
    if (!confirmDispose) return;
    const item = confirmDispose;
    updateStoreInventory(item.id, { quantity: 0 });
    addAuditLog(
      "product_disposed",
      user.name,
      `Hủy ${item.quantity}${item.unit} ${item.productName} - hết hạn SD`,
      "inventory",
    );
    toast.success(`Đã hủy ${item.quantity}${item.unit} ${item.productName}`);
    setConfirmDispose(null);
  };

  const columns = [
    { header: "Sản phẩm", accessor: "productName", sortable: true },
    {
      header: "Mã SP",
      accessor: "productId",
      width: "80px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.productId}
        </span>
      ),
    },
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
              color: isLow
                ? "var(--danger)"
                : row.quantity === 0
                  ? "var(--danger)"
                  : "var(--text-primary)",
            }}
          >
            {row.quantity} {row.unit}
          </span>
        );
      },
    },
    {
      header: "Mức tối thiểu",
      accessor: "minStock",
      render: (r) => `${r.minStock} ${r.unit}`,
    },
    {
      header: "Hạn sử dụng",
      accessor: "expiryDate",
      sortable: true,
      render: (row) => {
        if (!row.expiryDate)
          return <span style={{ color: "var(--text-muted)" }}>—</span>;
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
        if (isExpired(row.expiryDate) && row.quantity > 0)
          return (
            <Badge variant="danger" dot>
              Hết hạn
            </Badge>
          );
        if (row.quantity === 0)
          return (
            <Badge variant="danger" dot>
              Hết hàng
            </Badge>
          );
        if (row.quantity <= row.minStock)
          return (
            <Badge variant="warning" dot>
              Sắp hết
            </Badge>
          );
        return (
          <Badge variant="success" dot>
            Đủ hàng
          </Badge>
        );
      },
    },
    {
      header: "Hành động",
      width: "100px",
      render: (row) => {
        if (!row.expiryDate || row.quantity === 0) return "\u2014";
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

  const expiredCount = data.filter(
    (i) => i.expiryDate && isExpired(i.expiryDate) && i.quantity > 0,
  ).length;

  return (
    <PageWrapper
      title="Tồn kho cửa hàng"
      subtitle="Theo dõi số lượng tồn kho và hạn sử dụng tại cửa hàng"
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
          {expiredCount} sản phẩm hết hạn cần xử lý. Vui lòng hủy bỏ các sản phẩm hết hạn.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Tìm sản phẩm..."
        emptyTitle="Chưa có dữ liệu tồn kho"
      />

      {/* Dispose confirmation modal */}
      <Modal
        isOpen={!!confirmDispose}
        onClose={() => setConfirmDispose(null)}
        title="Xác nhận hủy sản phẩm"
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
              Bạn có chắc muốn hủy toàn bộ sản phẩm này?
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
                <span>Sản phẩm:</span>
                <strong>{confirmDispose.productName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Số lượng hủy:</span>
                <strong>{confirmDispose.quantity} {confirmDispose.unit}</strong>
              </div>
              {confirmDispose.expiryDate && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Hạn SD:</span>
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                    {formatDate(confirmDispose.expiryDate)}
                  </span>
                </div>
              )}
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
