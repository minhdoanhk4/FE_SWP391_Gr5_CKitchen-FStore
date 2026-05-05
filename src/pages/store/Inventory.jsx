import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Drawer } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";

const BATCH_STATUS_LABELS = {
  AVAILABLE: "Còn hàng",
  PART_DIST: "Phân phối một phần",
  DISTRIBUTED: "Đã phân phối",
  DEPLETED: "Hết hàng",
  EXPIRED: "Hết hạn",
};

export default function StoreInventory() {
  const { formatDate, formatCurrency, isExpiringSoon, isExpired } = useData();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch detail drawer
  const [batchDrawer, setBatchDrawer] = useState(null); // { productId, productName }
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const openBatches = async (row) => {
    setBatchDrawer({ productId: row.productId, productName: row.productName });
    setBatches([]);
    setBatchLoading(true);
    try {
      const resp = await storeService.getInventoryBatches(row.productId, {
        size: 50,
      });
      setBatches(resp?.content ?? resp ?? []);
    } catch {
      toast.error("Không thể tải chi tiết lô");
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const resp = await storeService.getStoreInventory({ size: 100 });
        setData(resp.content || []);
      } catch (err) {
        toast.error("Không thể tải tồn kho");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

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
      header: "Giá bán",
      accessor: "price",
      render: (r) => (
        <span className="font-mono">{formatCurrency(r.price ?? 0)}</span>
      ),
    },
    {
      header: "Tồn kho",
      accessor: "quantity",
      sortable: true,
      render: (row) => {
        const isLow = row.lowStock || row.quantity === 0;
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
        if (row.lowStock)
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
      header: "Cập nhật",
      accessor: "updatedAt",
      render: (r) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {r.updatedAt ? formatDate(r.updatedAt) : "—"}
        </span>
      ),
    },
    {
      header: "Chi tiết lô",
      width: "90px",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          iconOnly
          title="Xem chi tiết lô"
          onClick={() => openBatches(row)}
        />
      ),
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
          {expiredCount} sản phẩm hết hạn cần xử lý. Vui lòng hủy bỏ các sản
          phẩm hết hạn.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Tìm sản phẩm..."
        emptyTitle="Chưa có dữ liệu tồn kho"
      />

      <Drawer
        isOpen={!!batchDrawer}
        onClose={() => setBatchDrawer(null)}
        title={`Chi tiết lô: ${batchDrawer?.productName || ""}`}
      >
        {batchLoading ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>
            Đang tải...
          </p>
        ) : batches.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>
            Không có lô nào.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "4px",
            }}
          >
            {batches.map((b, i) => {
              const expired = isExpired(b.expiryDate);
              const expiring = !expired && isExpiringSoon(b.expiryDate);
              return (
              <div
                key={b.id ?? i}
                style={{
                  border: "1px solid var(--surface-border)",
                  borderLeft: expired
                    ? "3px solid var(--danger)"
                    : expiring
                      ? "3px solid var(--warning)"
                      : "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  background: expired
                    ? "color-mix(in srgb, var(--danger) 5%, var(--surface-card))"
                    : expiring
                      ? "color-mix(in srgb, var(--warning) 5%, var(--surface-card))"
                      : "var(--surface-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>Mã lô</span>
                  <strong className="font-mono">
                    {b.batchId ?? b.id ?? `#${i + 1}`}
                  </strong>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Số lượng
                  </span>
                  <strong>
                    {b.quantity ?? b.remainingQuantity ?? 0} {b.unit || ""}
                  </strong>
                </div>
                {b.expiryDate && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Hạn sử dụng
                    </span>
                    <span
                      style={{
                        color: isExpired(b.expiryDate)
                          ? "var(--danger)"
                          : isExpiringSoon(b.expiryDate)
                            ? "var(--warning)"
                            : "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(b.expiryDate)}
                    </span>
                  </div>
                )}
                {b.receivedDate && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Ngày nhập
                    </span>
                    <span>{formatDate(b.receivedDate)}</span>
                  </div>
                )}
                {b.status && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Trạng thái
                    </span>
                    <Badge
                      variant={
                        isExpired(b.expiryDate)
                          ? "danger"
                          : b.quantity === 0
                            ? "neutral"
                            : "success"
                      }
                    >
                      {BATCH_STATUS_LABELS[b.status] ?? b.status}
                    </Badge>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </Drawer>
    </PageWrapper>
  );
}
