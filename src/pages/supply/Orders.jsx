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
  Building2,
  Loader2,
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
  Input,
  Select,
} from "../../components/ui";
import supplyService from "../../services/supplyService";

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  ASSIGNED: "Đã gán bếp",
  IN_PROGRESS: "Đang sản xuất",
  PACKED_WAITING_SHIPPER: "Chờ shipper",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const STATUS_COLORS = {
  PENDING: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "accent",
  PACKED_WAITING_SHIPPER: "primary",
  SHIPPING: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const STATUS_FLOW = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PACKED_WAITING_SHIPPER",
  "SHIPPING",
  "DELIVERED",
];

const statusTabs = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "ASSIGNED", label: "Đã gán bếp" },
  { value: "IN_PROGRESS", label: "Đang sản xuất" },
  { value: "PACKED_WAITING_SHIPPER", label: "Chờ shipper" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
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
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v);
}

// ── Order Detail Drawer ─────────────────────────────────────────────────────
function OrderDetailDrawer({ order, isOpen, onClose }) {
  if (!order) return null;
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng ${order.orderId || order.id}`}
    >
      <div className="order-drawer">
        <div className="order-drawer__status">
          <Badge variant={STATUS_COLORS[order.status]} dot>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>

        <div className="order-drawer__timeline">
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s}
              className={`order-drawer__step ${i <= currentIndex ? "order-drawer__step--done" : ""} ${i === currentIndex ? "order-drawer__step--current" : ""}`}
            >
              <div className="order-drawer__step-dot" />
              <span className="order-drawer__step-label">
                {STATUS_LABELS[s]}
              </span>
              {i < STATUS_FLOW.length - 1 && (
                <div
                  className={`order-drawer__step-line ${i < currentIndex ? "order-drawer__step-line--filled" : ""}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="order-drawer__section">
          <h4 className="order-drawer__section-title">Thông tin đơn hàng</h4>
          <div className="order-drawer__info-grid">
            <div className="order-drawer__info-item">
              <FileText size={14} />
              <div>
                <span className="order-drawer__info-label">Mã đơn</span>
                <span className="order-drawer__info-value font-mono">
                  {order.orderId || order.id}
                </span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <MapPin size={14} />
              <div>
                <span className="order-drawer__info-label">Cửa hàng</span>
                <span className="order-drawer__info-value">
                  {order.storeName || order.storeId}
                </span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <Building2 size={14} />
              <div>
                <span className="order-drawer__info-label">Bếp</span>
                <span className="order-drawer__info-value">
                  {order.kitchenName || order.kitchenId || "Chưa gán"}
                </span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <Calendar size={14} />
              <div>
                <span className="order-drawer__info-label">
                  Ngày yêu cầu giao
                </span>
                <span className="order-drawer__info-value">
                  {formatDate(order.requestedDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {order.items?.length > 0 && (
          <div className="order-drawer__section">
            <h4 className="order-drawer__section-title">Sản phẩm</h4>
            <div className="order-drawer__items">
              {order.items.map((item, i) => (
                <div key={i} className="order-drawer__item-row">
                  <span>{item.productName}</span>
                  <span className="font-mono">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
              {order.total != null && (
                <div className="order-drawer__item-total">
                  <span>Tổng cộng</span>
                  <span className="font-mono">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="order-drawer__section">
            <h4 className="order-drawer__section-title">Ghi chú</h4>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {order.notes}
            </pre>
          </div>
        )}

        <div className="order-drawer__meta">
          {order.createdAt && <>Tạo lúc {formatDateTime(order.createdAt)}</>}
        </div>
      </div>
    </Drawer>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function SupplyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Assign kitchen modal
  const [assignTarget, setAssignTarget] = useState(null);
  const [kitchenId, setKitchenId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplyService.getOrders({
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tải danh sách đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Assign kitchen ──────────────────────────────────────────────────────
  const openAssignKitchen = (e, order) => {
    e.stopPropagation();
    setAssignTarget(order);
    setKitchenId("");
    setAssignNotes("");
  };

  const handleAssignKitchen = async () => {
    if (!assignTarget || !kitchenId.trim()) {
      toast.error("Vui lòng nhập mã bếp");
      return;
    }
    try {
      await supplyService.assignKitchen(
        assignTarget.orderId || assignTarget.id,
        {
          kitchenId: kitchenId.trim(),
          notes: assignNotes || undefined,
        },
      );
      toast.success(
        `Đã điều phối đơn ${assignTarget.orderId || assignTarget.id} cho bếp ${kitchenId}`,
      );
      setAssignTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể điều phối đơn hàng",
      );
    }
  };

  // ── View detail ─────────────────────────────────────────────────────────
  const handleViewDetail = async (order) => {
    try {
      const detail = await supplyService.getOrderById(
        order.orderId || order.id,
      );
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
      width: "130px",
      render: (row) => (
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--primary)" }}
        >
          {row.orderId || row.id}
        </span>
      ),
    },
    {
      header: "Cửa hàng",
      accessor: "storeName",
      sortable: true,
      render: (row) => row.storeName || row.storeId || "—",
    },
    {
      header: "Bếp",
      accessor: "kitchenName",
      sortable: true,
      render: (row) => row.kitchenName || row.kitchenId || "—",
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
      width: "200px",
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
              handleViewDetail(row);
            }}
          />
          {(row.status === "PENDING" || !row.kitchenId) && (
            <Button
              variant="accent"
              size="sm"
              icon={Building2}
              onClick={(e) => openAssignKitchen(e, row)}
            >
              Gán bếp
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Quản lý đơn hàng"
      subtitle="Tổng hợp, phân loại và điều phối đơn hàng"
    >
      {/* Status tabs */}
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

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Tìm theo mã đơn, cửa hàng..."
        onRowClick={(row) => handleViewDetail(row)}
        emptyTitle="Không có đơn hàng"
        emptyDesc="Chưa có đơn hàng nào ở trạng thái này."
      />

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

      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Assign kitchen modal */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Điều phối đơn sang bếp"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignTarget(null)}>
              Hủy
            </Button>
            <Button onClick={handleAssignKitchen}>Xác nhận</Button>
          </>
        }
      >
        {assignTarget && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Điều phối đơn{" "}
              <strong>{assignTarget.orderId || assignTarget.id}</strong> cho bếp
              trung tâm.
            </p>
            <Input
              label="Mã bếp (Kitchen ID)"
              required
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              placeholder="VD: KIT001"
            />
            <Textarea
              label="Ghi chú (tùy chọn)"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
            />
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
