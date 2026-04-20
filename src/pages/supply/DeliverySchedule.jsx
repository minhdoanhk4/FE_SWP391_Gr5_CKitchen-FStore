import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Package,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import {
  Card,
  Badge,
  Button,
  Modal,
  Input,
  Textarea,
  Select,
} from "../../components/ui";
import supplyService from "../../services/supplyService";

const DELIVERY_STATUS_LABELS = {
  ASSIGNED: "Đã lên lịch",
  SHIPPING: "Đang giao",
  DELAYED: "Bị trễ",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const DELIVERY_STATUS_COLORS = {
  ASSIGNED: "info",
  SHIPPING: "accent",
  DELAYED: "warning",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const DELIVERY_STATUS_ICONS = {
  ASSIGNED: Clock,
  SHIPPING: Truck,
  DELAYED: AlertTriangle,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

const statusTabs = [
  { value: "", label: "Tất cả" },
  { value: "ASSIGNED", label: "Đã lên lịch" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELAYED", label: "Bị trễ" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const NEXT_STATUS_OPTIONS = {
  ASSIGNED: [
    { value: "SHIPPING", label: "Bắt đầu giao" },
    { value: "CANCELLED", label: "Hủy" },
  ],
  SHIPPING: [
    { value: "DELIVERED", label: "Đã giao thành công" },
    { value: "DELAYED", label: "Bị trễ" },
    { value: "CANCELLED", label: "Hủy" },
  ],
  DELAYED: [
    { value: "SHIPPING", label: "Tiếp tục giao" },
    { value: "CANCELLED", label: "Hủy" },
  ],
};

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

export default function DeliverySchedule() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Create delivery modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    orderId: "",
    status: "ASSIGNED",
    assignedAt: "",
    notes: "",
  });

  // Update status modal
  const [updateTarget, setUpdateTarget] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplyService.getDeliveries({
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setDeliveries(data.content || data || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error("Không thể tải danh sách giao hàng");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ── Create delivery ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.orderId.trim()) {
      toast.error("Vui lòng nhập mã đơn hàng");
      return;
    }
    try {
      await supplyService.createDelivery({
        orderId: createForm.orderId.trim(),
        status: createForm.status,
        assignedAt: createForm.assignedAt || undefined,
        notes: createForm.notes || undefined,
      });
      toast.success("Đã tạo lịch giao hàng!");
      setShowCreate(false);
      setCreateForm({
        orderId: "",
        status: "ASSIGNED",
        assignedAt: "",
        notes: "",
      });
      fetchDeliveries();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tạo lịch giao hàng",
      );
    }
  };

  // ── Update status ───────────────────────────────────────────────────────
  const openUpdate = (delivery) => {
    setUpdateTarget(delivery);
    setUpdateStatus("");
    setUpdateNotes("");
  };

  const handleUpdateStatus = async () => {
    if (!updateTarget || !updateStatus) {
      toast.error("Vui lòng chọn trạng thái mới");
      return;
    }
    try {
      await supplyService.updateDeliveryStatus(
        updateTarget.deliveryId || updateTarget.id,
        { status: updateStatus, notes: updateNotes || undefined },
      );
      toast.success(
        `Đã cập nhật trạng thái giao hàng thành ${DELIVERY_STATUS_LABELS[updateStatus]}`,
      );
      setUpdateTarget(null);
      fetchDeliveries();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  if (loading && deliveries.length === 0) {
    return (
      <PageWrapper
        title="Lịch giao hàng"
        subtitle="Quản lý và điều phối giao hàng"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          <Loader2
            size={32}
            className="spin"
            style={{ color: "var(--primary)" }}
          />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Lịch giao hàng"
      subtitle="Quản lý và điều phối giao hàng cho các đơn sẵn sàng"
      actions={
        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          Tạo lịch giao
        </Button>
      }
    >
      {/* Status filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(0);
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid",
              borderColor:
                statusFilter === tab.value
                  ? "var(--primary)"
                  : "var(--surface-border)",
              background:
                statusFilter === tab.value
                  ? "var(--primary-bg)"
                  : "var(--surface-card)",
              color:
                statusFilter === tab.value
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Delivery list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {deliveries.map((delivery) => {
          const StatusIcon = DELIVERY_STATUS_ICONS[delivery.status] || Package;
          const nextOptions = NEXT_STATUS_OPTIONS[delivery.status] || [];

          return (
            <Card key={delivery.deliveryId || delivery.id} hoverable>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <StatusIcon
                    size={18}
                    style={{
                      color: `var(--${DELIVERY_STATUS_COLORS[delivery.status] || "text-secondary"})`,
                    }}
                  />
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "15px",
                    }}
                  >
                    {delivery.deliveryId || delivery.id}
                  </span>
                  <Badge
                    variant={
                      DELIVERY_STATUS_COLORS[delivery.status] || "neutral"
                    }
                    dot
                  >
                    {DELIVERY_STATUS_LABELS[delivery.status] || delivery.status}
                  </Badge>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Package size={14} /> Đơn: {delivery.orderId || "—"}
                </span>
                {delivery.assignedAt && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar size={14} /> Lên lịch:{" "}
                    {formatDateTime(delivery.assignedAt)}
                  </span>
                )}
              </div>

              {delivery.notes && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {delivery.notes}
                </p>
              )}

              {nextOptions.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {nextOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={opt.value === "CANCELLED" ? "ghost" : "primary"}
                      size="sm"
                      style={
                        opt.value === "CANCELLED"
                          ? { color: "var(--danger)" }
                          : {}
                      }
                      onClick={() => {
                        setUpdateTarget(delivery);
                        setUpdateStatus(opt.value);
                        setUpdateNotes("");
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {deliveries.length === 0 && (
          <Card>
            <p
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                padding: "20px",
              }}
            >
              Không có lịch giao hàng nào
            </p>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </Button>
          <span
            style={{
              lineHeight: "32px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </Button>
        </div>
      )}

      {/* Create delivery modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo lịch giao hàng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Mã đơn hàng"
            required
            value={createForm.orderId}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, orderId: e.target.value }))
            }
            placeholder="VD: ORD0419001"
          />
          <Input
            label="Thời gian bắt đầu (tùy chọn)"
            type="datetime-local"
            value={createForm.assignedAt}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, assignedAt: e.target.value }))
            }
          />
          <Textarea
            label="Ghi chú"
            value={createForm.notes}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, notes: e.target.value }))
            }
            placeholder="VD: Ưu tiên giao trước 12h"
          />
        </div>
      </Modal>

      {/* Update status modal */}
      <Modal
        isOpen={!!updateTarget && !!updateStatus}
        onClose={() => setUpdateTarget(null)}
        title="Cập nhật trạng thái giao hàng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpdateTarget(null)}>
              Hủy
            </Button>
            <Button
              variant={updateStatus === "CANCELLED" ? "danger" : "primary"}
              onClick={handleUpdateStatus}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        {updateTarget && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <p style={{ fontSize: "14px" }}>
              Cập nhật giao hàng{" "}
              <strong>{updateTarget.deliveryId || updateTarget.id}</strong> sang{" "}
              <Badge variant={DELIVERY_STATUS_COLORS[updateStatus]}>
                {DELIVERY_STATUS_LABELS[updateStatus]}
              </Badge>
            </p>
            <Textarea
              label="Ghi chú (tùy chọn)"
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="VD: Đã rời kho lúc 09:00"
            />
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
