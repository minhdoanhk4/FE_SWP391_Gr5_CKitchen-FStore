import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
  Calendar,
  User,
  FileText,
  ChevronRight,
  Eye,
  ArrowRight,
  UserPlus,
  Flag,
  PackageCheck,
  PackageX,
  Loader2,
  XCircle,
  ChefHat,
  Package,
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
  ASSIGNED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang chuẩn bị hàng",
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

// Fallback transition map — used when BE /order-statuses is unavailable
// Kitchen owns: PENDING → ASSIGNED (via assign endpoint), ASSIGNED → IN_PROGRESS → PACKED_WAITING_SHIPPER
// Shipper owns: PACKED_WAITING_SHIPPER → SHIPPING (via QR scan)
// Store owns:   SHIPPING/WAITING_CONFIRM → DELIVERED (via confirm receipt)
const DEFAULT_NEXT_STATUSES = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PACKED_WAITING_SHIPPER", "CANCELLED"],
  PACKED_WAITING_SHIPPER: ["CANCELLED"],
};

// Build a transition map from the flat list returned by GET /order-statuses.
// The BE returns statuses valid for the /status update endpoint (no PENDING/ASSIGNED).
// We preserve the ordering by filtering DEFAULT_NEXT_STATUSES against the allowed set.
function buildNextStatusMap(allowedStatuses) {
  if (!allowedStatuses?.length) return DEFAULT_NEXT_STATUSES;
  const allowed = new Set(allowedStatuses);
  const result = {};
  Object.entries(DEFAULT_NEXT_STATUSES).forEach(([from, targets]) => {
    const filtered = targets.filter((t) => allowed.has(t) || t === "CANCELLED");
    if (filtered.length) result[from] = filtered;
  });
  return result;
}

const PRIORITY_LABELS = { HIGH: "Cao", NORMAL: "Thường", LOW: "Thấp" };
const PRIORITY_COLORS = { HIGH: "danger", NORMAL: "info", LOW: "neutral" };

const statusTabs = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ tiếp nhận" },
  { value: "ASSIGNED", label: "Đã tiếp nhận" },
  { value: "IN_PROGRESS", label: "Đang chuẩn bị hàng" },
  { value: "PACKED_WAITING_SHIPPER", label: "Chờ shipper" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

// Returns icon component, background color, icon color, and modal title for each target status
function getConfirmMeta(toStatus) {
  switch (toStatus) {
    case "CANCELLED":
      return {
        Icon: XCircle,
        bg: "var(--danger-bg)",
        color: "var(--danger)",
        title: "Hủy đơn hàng",
      };
    case "IN_PROGRESS":
      return {
        Icon: ChefHat,
        bg: "var(--accent-bg, var(--primary-bg))",
        color: "var(--accent, var(--primary))",
        title: "Bắt đầu sản xuất",
      };
    case "PACKED_WAITING_SHIPPER":
      return {
        Icon: Package,
        bg: "var(--primary-bg)",
        color: "var(--primary)",
        title: "Đóng gói & chờ shipper",
      };
    default:
      return {
        Icon: ArrowRight,
        bg: "var(--primary-bg)",
        color: "var(--primary)",
        title: "Chuyển trạng thái",
      };
  }
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
      title={`Chi tiết đơn hàng ${order.id}`}
    >
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

        {/* Info */}
        <div className="order-drawer__section">
          <h4 className="order-drawer__section-title">Thông tin đơn hàng</h4>
          <div className="order-drawer__info-grid">
            <div className="order-drawer__info-item">
              <FileText size={14} />
              <div>
                <span className="order-drawer__info-label">Mã đơn</span>
                <span className="order-drawer__info-value font-mono">
                  {order.id}
                </span>
              </div>
            </div>
            <div className="order-drawer__info-item">
              <MapPin size={14} />
              <div>
                <span className="order-drawer__info-label">Cửa hàng</span>
                <span className="order-drawer__info-value">
                  {order.storeName}
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
            <div className="order-drawer__info-item">
              <User size={14} />
              <div>
                <span className="order-drawer__info-label">Người tạo</span>
                <span className="order-drawer__info-value">
                  {order.createdBy}
                </span>
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
              className="order-drawer__notes"
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
          {order.assignedAt && (
            <> · Gán lúc {formatDateTime(order.assignedAt)}</>
          )}
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
  const [totalElements, setTotalElements] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [validStatuses, setValidStatuses] = useState([]);
  const [stockCheck, setStockCheck] = useState(null); // null | { loading, rows: [{name, needed, available, unit, ok}] }
  const [myKitchen, setMyKitchen] = useState(null);

  // ── Fetch valid order statuses from BE ────────────────────────────────
  useEffect(() => {
    kitchenService
      .getOrderStatuses()
      .then((statuses) => setValidStatuses(statuses || []))
      .catch(() => {}); // fallback to DEFAULT_NEXT_STATUSES
    kitchenService
      .getMyKitchen()
      .then((k) => setMyKitchen(k))
      .catch(() => {});
  }, []);

  // Build transition map — dynamic when BE responds, static fallback otherwise
  const nextStatusMap = useMemo(
    () => buildNextStatusMap(validStatuses),
    [validStatuses],
  );

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
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setTotalElements(data.page?.totalElements ?? data.totalElements ?? 0);
    } catch (err) {
      console.error(err);
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

  // ── Assign order ──────────────────────────────────────────────────────────
  const handleAssign = async (e, order) => {
    e.stopPropagation();
    try {
      await kitchenService.assignOrder(order.id);
      toast.success(`Đã tiếp nhận đơn ${order.id}`);
      fetchOrders();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể tiếp nhận đơn hàng",
      );
    }
  };

  // ── Status advance ────────────────────────────────────────────────────────
  const closeStatusModal = () => {
    setPendingChange(null);
    setStockCheck(null);
  };

  const openStatusChange = (e, order, targetStatus) => {
    e.stopPropagation();
    setPendingChange({
      orderId: order.id,
      storeName: order.storeName,
      fromStatus: order.status,
      toStatus: targetStatus,
    });
    setStatusNotes("");
    setStockCheck(null);

    // Pre-check product stock before packing — FEFO deduction happens at this transition
    if (targetStatus === "PACKED_WAITING_SHIPPER" && order.items?.length) {
      setStockCheck({ loading: true, rows: [] });
      kitchenService
        .getProductInventory({ size: 200 })
        .then((data) => {
          const inv = data.content || [];
          const rows = order.items.map((item) => {
            const found = inv.find(
              (p) =>
                p.productId === item.productId ||
                p.productName === item.productName,
            );
            const available =
              found?.totalRemainingQuantity ?? found?.totalQuantity ?? 0;
            return {
              name: item.productName,
              needed: item.quantity,
              available,
              unit: item.unit || found?.unit || "cái",
              ok: available >= item.quantity,
            };
          });
          setStockCheck({ loading: false, rows });
        })
        .catch(() => setStockCheck({ loading: false, rows: [] }));
    }
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
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái",
      );
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
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--primary)" }}
        >
          {row.id}
        </span>
      ),
    },
    {
      header: "Bếp tiếp nhận",
      accessor: "kitchenName",
      sortable: true,
      render: (row) => row.kitchenName || "—",
    },
    {
      header: "Sản phẩm",
      accessor: "items",
      render: (row) => {
        if (!row.items?.length) return "—";
        const display = row.items
          .map((i) => `${i.productName} x${i.quantity}`)
          .join(", ");
        return (
          <span
            title={display}
            style={{
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {display}
          </span>
        );
      },
    },
    {
      header: "Ngày yêu cầu",
      accessor: "requestedDate",
      sortable: true,
      width: "120px",
      render: (row) => formatDate(row.requestedDate),
    },
    {
      header: "Ưu tiên",
      accessor: "priority",
      width: "90px",
      render: (row) =>
        row.priority ? (
          <Badge variant={PRIORITY_COLORS[row.priority] || "neutral"}>
            <Flag size={10} style={{ marginRight: 3 }} />
            {PRIORITY_LABELS[row.priority] || row.priority}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      width: "150px",
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
      render: (row) => {
        const nextStatuses = nextStatusMap[row.status] || [];
        // PENDING: only show "Tiếp nhận" — kitchen must accept before advancing
        const canAssign = row.status === "PENDING";
        // Only allow status actions on orders belonging to this kitchen
        const isMyOrder = row.kitchenId === myKitchen?.id;
        const primaryNext =
          canAssign || !isMyOrder
            ? null
            : nextStatuses.find((s) => s !== "CANCELLED");
        const canCancel = isMyOrder && nextStatuses.includes("CANCELLED");

        return (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {/* View detail */}
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

            {/* Accept (PENDING only) */}
            {canAssign && (
              <Button
                variant="accent"
                size="sm"
                icon={UserPlus}
                onClick={(e) => handleAssign(e, row)}
                title="Tiếp nhận đơn"
              >
                Tiếp nhận
              </Button>
            )}

            {/* Primary status advance */}
            {primaryNext && (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={(e) => openStatusChange(e, row, primaryNext)}
                title={`Chuyển sang: ${STATUS_LABELS[primaryNext]}`}
              >
                {STATUS_LABELS[primaryNext]}
              </Button>
            )}

            {/* Cancel — text button matching project convention */}
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                title="Hủy đơn"
                onClick={(e) => openStatusChange(e, row, "CANCELLED")}
                style={{ color: "var(--danger)" }}
              >
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
        serverPagination={{
          page,
          pageSize: 20,
          total: totalElements,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Order detail drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Status change confirmation modal */}
      {pendingChange &&
        (() => {
          const meta = getConfirmMeta(pendingChange.toStatus);
          const isCancel = pendingChange.toStatus === "CANCELLED";
          const isPacking = pendingChange.toStatus === "PACKED_WAITING_SHIPPER";
          return (
            <Modal
              isOpen
              onClose={closeStatusModal}
              title={meta.title}
              footer={
                <div className="order-confirm__actions">
                  <Button variant="ghost" onClick={closeStatusModal}>
                    Hủy
                  </Button>
                  <Button
                    variant={isCancel ? "danger" : "primary"}
                    onClick={handleConfirmChange}
                    disabled={isPacking && stockCheck?.rows?.some((r) => !r.ok)}
                  >
                    {isCancel ? "Xác nhận hủy" : "Xác nhận"}
                  </Button>
                </div>
              }
            >
              <div className="order-confirm">
                {/* Centered header: icon + message + status flow */}
                <div className="order-confirm__header">
                  <div
                    className="order-confirm__icon"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <meta.Icon size={24} />
                  </div>
                  <p className="order-confirm__message">
                    {isCancel
                      ? "Bạn có chắc chắn muốn hủy đơn hàng "
                      : "Chuyển đơn hàng "}
                    <strong>{pendingChange.orderId}</strong>
                    {pendingChange.storeName && ` (${pendingChange.storeName})`}
                    {isCancel ? "? Thao tác này không thể hoàn tác." : "."}
                  </p>
                  <div className="order-confirm__status-flow">
                    <Badge
                      variant={STATUS_COLORS[pendingChange.fromStatus]}
                      dot
                    >
                      {STATUS_LABELS[pendingChange.fromStatus]}
                    </Badge>
                    {isCancel ? (
                      <XCircle
                        size={16}
                        className="order-confirm__arrow"
                        style={{ color: "var(--danger)" }}
                      />
                    ) : (
                      <ChevronRight
                        size={20}
                        className="order-confirm__arrow"
                      />
                    )}
                    <Badge variant={STATUS_COLORS[pendingChange.toStatus]} dot>
                      {STATUS_LABELS[pendingChange.toStatus]}
                    </Badge>
                  </div>
                </div>

                {/* Stock check — full width, left-aligned */}
                {isPacking && stockCheck && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "var(--surface)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {stockCheck.loading ? (
                        <Loader2 size={12} className="spin" />
                      ) : stockCheck.rows.every((r) => r.ok) ? (
                        <PackageCheck
                          size={12}
                          style={{ color: "var(--success)" }}
                        />
                      ) : (
                        <PackageX
                          size={12}
                          style={{ color: "var(--danger)" }}
                        />
                      )}
                      Kiểm tra tồn kho thành phẩm
                    </div>
                    {!stockCheck.loading && stockCheck.rows.length > 0 && (
                      <div style={{ padding: "8px 0" }}>
                        {stockCheck.rows.map((row, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 12px",
                              fontSize: "13px",
                              background: row.ok
                                ? "transparent"
                                : "var(--danger-bg)",
                              gap: "12px",
                            }}
                          >
                            <span style={{ flex: 1 }}>{row.name}</span>
                            <span
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                              }}
                            >
                              Cần: <strong>{row.needed}</strong> · Tồn:{" "}
                              <strong
                                style={{
                                  color: row.ok
                                    ? "var(--success)"
                                    : "var(--danger)",
                                }}
                              >
                                {row.available}
                              </strong>{" "}
                              {row.unit}
                            </span>
                            {row.ok ? (
                              <PackageCheck
                                size={14}
                                style={{
                                  color: "var(--success)",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <PackageX
                                size={14}
                                style={{
                                  color: "var(--danger)",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                        ))}
                        {stockCheck.rows.some((r) => !r.ok) && (
                          <div
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              color: "var(--danger)",
                              borderTop: "1px solid var(--border)",
                              marginTop: "4px",
                            }}
                          >
                            Không đủ tồn kho. Hãy tạo kế hoạch sản xuất mới
                            trước.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes textarea — always full width */}
                <Textarea
                  label="Ghi chú (tùy chọn)"
                  placeholder="Ghi chú thêm về lý do chuyển trạng thái..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>
            </Modal>
          );
        })()}
    </PageWrapper>
  );
}
