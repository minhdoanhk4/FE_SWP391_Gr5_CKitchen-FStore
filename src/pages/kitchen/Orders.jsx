import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Calendar,
  User,
  FileText,
  ChevronRight,
  AlertTriangle,
  Eye,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import {
  Badge,
  Drawer,
  Modal,
  Button,
  DataTable,
  Textarea,
} from "../../components/ui";
import kitchenService from "../../services/kitchenService";
import "./Orders.css";

// ── Backend enum statuses ───────────────────────────────────────────────────
const STATUS_LABELS = {
  PENDING: "Chờ tiếp nhận",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang sản xuất",
  PACKED_WAITING_SHIPPER: "Chờ shipper",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  PROCESSING: "Đang xử lý",
  APPROVED: "Đã duyệt",
};

const STATUS_COLORS = {
  PENDING: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "accent",
  PACKED_WAITING_SHIPPER: "primary",
  SHIPPING: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  PROCESSING: "accent",
  APPROVED: "info",
};

const STATUS_FLOW = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PACKED_WAITING_SHIPPER",
  "SHIPPING",
  "DELIVERED",
];

// Fallback next statuses — overridden by dynamic fetch from BE
const DEFAULT_NEXT_STATUSES = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PACKED_WAITING_SHIPPER", "CANCELLED"],
  PACKED_WAITING_SHIPPER: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
};

const statusTabs = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ tiếp nhận" },
  { value: "ASSIGNED", label: "Đã gán" },
  { value: "IN_PROGRESS", label: "Đang sản xuất" },
  { value: "PACKED_WAITING_SHIPPER", label: "Chờ shipper" },
  { value: "SHIPPING", label: "Đang giao" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}
function formatCurrency(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

// ── Order Detail Drawer ─────────────────────────────────────────────────────
function OrderDetailDrawer({ order, isOpen, onClose }) {
  if (!order) return null;
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Chi tiết đơn hàng ${order.id}`}>
      <div className="order-drawer">
        <div className="order-drawer__status">
          <Badge variant={STATUS_COLORS[order.status]} dot>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="order-drawer__timeline">
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s}
              className={`order-drawer__step ${i <= currentIndex ? "order-drawer__step--done" : ""} ${i === currentIndex ? "order-drawer__step--current" : ""}`}
            >
              <div className="order-drawer__step-dot" />
              <span className="order-drawer__step-label">{STATUS_LABELS[s]}</span>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`order-drawer__step-line ${i < currentIndex ? "order-drawer__step-line--filled" : ""}`} />
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="order-drawer__section">
          <h4 className="order-drawer__section-title">Thông tin đơn hàng</h4>
          <div className="order-drawer__info-grid">
            <div className="order-drawer__info-item">
              <FileText size={14} />
              <div>
                <span className="order-drawer__info-label">Mã đơn</span>
                <span className="order-drawer__info-value font-mono">{order.id}</span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <MapPin size={14} />
              <div>
                <span className="order-drawer__info-label">Cửa hàng</span>
                <span className="order-drawer__info-value">{order.storeName}</span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <Calendar size={14} />
              <div>
                <span className="order-drawer__info-label">Ngày yêu cầu giao</span>
                <span className="order-drawer__info-value">{formatDate(order.requestedDate)}</span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <User size={14} />
              <div>
                <span className="order-drawer__info-label">Người tạo</span>
                <span className="order-drawer__info-value">{order.createdBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items?.length > 0 && (
          <div className="order-drawer__section">
            <h4 className="order-drawer__section-title">Sản phẩm đặt hàng</h4>
            <div className="order-drawer__items">
              {order.items.map((item, i) => (
                <div key={i} className="order-drawer__item-row">
                  <span>{item.productName}</span>
                  <span className="font-mono">{item.quantity} {item.unit}</span>
                </div>
              ))}
              {order.total != null && (
                <div className="order-drawer__item-total">
                  <span>Tổng cộng</span>
                  <span className="font-mono">{formatCurrency(order.total)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="order-drawer__section">
            <h4 className="order-drawer__section-title">Ghi chú</h4>
            <pre className="order-drawer__notes" style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              {order.notes}
            </pre>
          </div>
        )}

        <div className="order-drawer__meta">
          {order.createdAt && <>Tạo lúc {formatDateTime(order.createdAt)}</>}
          {order.assignedAt && <> · Gán lúc {formatDateTime(order.assignedAt)}</>}
        </div>
      </div>
    </Drawer>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function KitchenOrders({
  title = "Quản lý đơn hàng",
  subtitle,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [validStatuses, setValidStatuses] = useState([]);

  // ── Fetch valid order statuses from BE ────────────────────────────────
  useEffect(() => {
    kitchenService.getOrderStatuses()
      .then((statuses) => setValidStatuses(statuses || []))
      .catch(() => {}); // fallback to DEFAULT_NEXT_STATUSES
  }, []);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getOrders({
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Assign order ──────────────────────────────────────────────────────────
  const handleAssign = async (e, order) => {
    e.stopPropagation();
    try {
      await kitchenService.assignOrder(order.id);
      toast.success(`Đã tiếp nhận đơn ${order.id}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tiếp nhận đơn hàng");
    }
  };

  // ── Status advance ────────────────────────────────────────────────────────
  const openStatusChange = (e, order, targetStatus) => {
    e.stopPropagation();
    setPendingChange({
      orderId: order.id,
      storeName: order.storeName,
      fromStatus: order.status,
      toStatus: targetStatus,
    });
    setStatusNotes("");
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;
    try {
      await kitchenService.updateOrderStatus(pendingChange.orderId, {
        status: pendingChange.toStatus,
        notes: statusNotes || undefined,
      });
      toast.success(
        `${pendingChange.orderId}: ${STATUS_LABELS[pendingChange.fromStatus]} ➜ ${STATUS_LABELS[pendingChange.toStatus]}`,
        { duration: 3000 },
      );
      setPendingChange(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  // ── View order detail ─────────────────────────────────────────────────────
  const handleViewDetail = async (order) => {
    try {
      const detail = await kitchenService.getOrderById(order.id);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(order);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Mã đơn",
      accessor: "id",
      sortable: true,
      width: "120px",
      render: (row) => (
        <span className="font-mono" style={{ fontWeight: 600, color: "var(--primary)" }}>
          {row.id}
        </span>
      ),
    },
    { header: "Cửa hàng", accessor: "storeName", sortable: true },
    {
      header: "Sản phẩm",
      accessor: "items",
      render: (row) => {
        if (!row.items?.length) return "—";
        const display = row.items.map((i) => `${i.productName} x${i.quantity}`).join(", ");
        return (
          <span title={display} style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
            {display}
          </span>
        );
      },
    },
    {
      header: "Ngày yêu cầu",
      accessor: "requestedDate",
      sortable: true,
      width: "130px",
      render: (row) => formatDate(row.requestedDate),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      width: "160px",
      render: (row) => (
        <Badge variant={STATUS_COLORS[row.status] || "neutral"} dot>
          {STATUS_LABELS[row.status] || row.status}
        </Badge>
      ),
    },
    {
      header: "Thao tác",
      accessor: "actions",
      width: "220px",
      render: (row) => {
        const nextStatuses = DEFAULT_NEXT_STATUSES[row.status] || [];
        const canAssign = row.status === "PENDING";
        const primaryNext = nextStatuses.find((s) => s !== "CANCELLED");

        return (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" iconOnly icon={Eye} title="Xem chi tiết"
              onClick={(e) => { e.stopPropagation(); handleViewDetail(row); }} />
            {canAssign && (
              <Button variant="accent" size="sm" icon={UserPlus}
                onClick={(e) => handleAssign(e, row)} title="Tiếp nhận đơn">
                Tiếp nhận
              </Button>
            )}
            {primaryNext && (
              <Button variant="primary" size="sm" icon={ArrowRight}
                onClick={(e) => openStatusChange(e, row, primaryNext)}
                title={`Chuyển sang: ${STATUS_LABELS[primaryNext]}`}>
                {STATUS_LABELS[primaryNext]}
              </Button>
            )}
            {nextStatuses.includes("CANCELLED") && (
              <Button variant="ghost" size="sm"
                onClick={(e) => openStatusChange(e, row, "CANCELLED")}
                title="Hủy đơn" style={{ color: "var(--danger)" }}>
                Hủy
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper title={title} subtitle={subtitle}>
      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid",
              borderColor: statusFilter === tab.value ? "var(--primary)" : "var(--surface-border)",
              background: statusFilter === tab.value ? "var(--primary-bg)" : "var(--surface-card)",
              color: statusFilter === tab.value ? "var(--primary)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Tìm theo mã đơn, cửa hàng..."
        onRowClick={(row) => handleViewDetail(row)}
        emptyTitle="Không có đơn hàng"
        emptyDesc="Chưa có đơn hàng nào ở trạng thái này."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          <Button variant="ghost" size="sm" disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span style={{ lineHeight: "32px", fontSize: "13px", color: "var(--text-secondary)" }}>
            Trang {page + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}

      {/* Order detail drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Status change confirmation modal */}
      <Modal
        isOpen={!!pendingChange}
        onClose={() => setPendingChange(null)}
        title="Xác nhận chuyển trạng thái"
        footer={
          <div className="order-confirm__actions">
            <Button variant="ghost" onClick={() => setPendingChange(null)}>Hủy</Button>
            <Button
              variant={pendingChange?.toStatus === "CANCELLED" ? "danger" : "primary"}
              onClick={handleConfirmChange}>
              Xác nhận
            </Button>
          </div>
        }
      >
        {pendingChange && (
          <div className="order-confirm">
            <div className="order-confirm__icon">
              <AlertTriangle size={32} />
            </div>
            <p className="order-confirm__message">
              Bạn có chắc chắn muốn chuyển đơn hàng{" "}
              <strong>{pendingChange.orderId}</strong>
              {pendingChange.storeName && ` (${pendingChange.storeName})`}
            </p>
            <div className="order-confirm__status-flow">
              <Badge variant={STATUS_COLORS[pendingChange.fromStatus]} dot>
                {STATUS_LABELS[pendingChange.fromStatus]}
              </Badge>
              <ChevronRight size={20} className="order-confirm__arrow" />
              <Badge variant={STATUS_COLORS[pendingChange.toStatus]} dot>
                {STATUS_LABELS[pendingChange.toStatus]}
              </Badge>
            </div>
            <div style={{ marginTop: "16px" }}>
              <Textarea
                label="Ghi chú (tùy chọn)"
                placeholder="Ghi chú thêm về lý do chuyển trạng thái..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
