import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  Package,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button, LoadingScreen } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";
import "./OrderDetail.css";

// Backend statuses: PENDING → ASSIGNED → IN_PROGRESS → PACKED_WAITING_SHIPPER → SHIPPING → DELIVERED / CANCELLED
const TIMELINE_STEPS = [
  { status: "PENDING", label: "Tạo đơn", icon: FileText },
  { status: "ASSIGNED", label: "Đã nhận", icon: CheckCircle },
  { status: "IN_PROGRESS", label: "Sản xuất", icon: Clock },
  { status: "PACKED_WAITING_SHIPPER", label: "Đóng gói", icon: Package },
  { status: "SHIPPING", label: "Giao hàng", icon: Truck },
  { status: "DELIVERED", label: "Hoàn thành", icon: CheckCircle },
];

const STATUS_ORDER = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PACKED_WAITING_SHIPPER",
  "SHIPPING",
  "DELIVERED",
];

// Map timeline field names to statuses
const TIMELINE_FIELD_MAP = {
  PENDING: "createdAt",
  ASSIGNED: "assignedAt",
  IN_PROGRESS: "inProgressAt",
  PACKED_WAITING_SHIPPER: "packedWaitingShipperAt",
  SHIPPING: "shippingAt",
  DELIVERED: "deliveredAt",
};

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  ASSIGNED: "Đã nhận",
  IN_PROGRESS: "Đang sản xuất",
  PACKED_WAITING_SHIPPER: "Chờ giao",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const STATUS_COLORS = {
  PENDING: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "primary",
  PACKED_WAITING_SHIPPER: "accent",
  SHIPPING: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency, formatDate, formatDateTime } = useData();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [orderResp, timelineResp] = await Promise.all([
          storeService.getOrderById(id),
          storeService.getOrderTimeline(id).catch(() => null),
        ]);
        setOrder(orderResp);
        setTimeline(timelineResp);
      } catch {
        toast.error("Không tìm thấy thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <LoadingScreen />;

  if (!order) {
    return (
      <PageWrapper title="Không tìm thấy đơn hàng">
        <Card>
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            Đơn hàng {id} không tồn tại.
          </p>
          <div style={{ textAlign: "center" }}>
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  const orderStatus = order.status?.toUpperCase() ?? "PENDING";
  const isCancelled = orderStatus === "CANCELLED";
  const currentStepIndex = isCancelled ? -1 : STATUS_ORDER.indexOf(orderStatus);

  return (
    <PageWrapper
      title={`Chi tiết đơn hàng ${order.id ?? order.orderId}`}
      subtitle={`Tạo bởi ${order.createdBy} — ${formatDateTime(order.createdAt)}`}
      actions={
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    >
      {/* Status & Timeline */}
      <Card className="order-detail__timeline-card">
        <div className="order-detail__status-bar">
          <Badge variant={STATUS_COLORS[orderStatus] ?? "neutral"} dot>
            {STATUS_LABELS[orderStatus] ?? orderStatus}
          </Badge>
          {isCancelled && (
            <Badge variant="danger" icon={XCircle}>
              Đã hủy
            </Badge>
          )}
          {order.priority === "HIGH" || order.priority === "high" ? (
            <Badge variant="danger">Ưu tiên cao</Badge>
          ) : null}
        </div>

        {!isCancelled && (
          <div className="order-detail__timeline">
            {TIMELINE_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const timestampField = TIMELINE_FIELD_MAP[step.status];
              const ts = timeline?.[timestampField];
              return (
                <div
                  key={step.status}
                  className={`timeline-step ${isCompleted ? "timeline-step--completed" : ""} ${isCurrent ? "timeline-step--current" : ""}`}
                >
                  <div className="timeline-step__dot">
                    <StepIcon size={16} />
                  </div>
                  <span className="timeline-step__label">{step.label}</span>
                  {ts && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      {formatDateTime(ts)}
                    </span>
                  )}
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`timeline-step__line ${isCompleted && i < currentStepIndex ? "timeline-step__line--filled" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="order-detail__grid">
        {/* Order Info */}
        <Card>
          <h3 className="order-detail__section-title">Thông tin đơn hàng</h3>
          <div className="order-detail__info-grid">
            <div className="order-detail__info-item">
              <FileText size={16} />
              <div>
                <span className="order-detail__info-label">Mã đơn</span>
                <span className="order-detail__info-value font-mono">
                  {order.id ?? order.orderId}
                </span>
              </div>
            </div>
            <div className="order-detail__info-item">
              <MapPin size={16} />
              <div>
                <span className="order-detail__info-label">Cửa hàng</span>
                <span className="order-detail__info-value">
                  {order.storeName}
                </span>
              </div>
            </div>
            <div className="order-detail__info-item">
              <Calendar size={16} />
              <div>
                <span className="order-detail__info-label">
                  Ngày yêu cầu giao
                </span>
                <span className="order-detail__info-value">
                  {formatDate(order.requestedDate)}
                </span>
              </div>
            </div>
            <div className="order-detail__info-item">
              <User size={16} />
              <div>
                <span className="order-detail__info-label">Người tạo</span>
                <span className="order-detail__info-value">
                  {order.createdBy}
                </span>
              </div>
            </div>
          </div>
          {order.notes && (
            <div className="order-detail__notes">
              <span className="order-detail__info-label">Ghi chú:</span>
              <p>{order.notes}</p>
            </div>
          )}
        </Card>

        {/* Items */}
        <Card>
          <h3 className="order-detail__section-title">Sản phẩm đặt hàng</h3>
          <div className="order-detail__items">
            <div className="order-detail__items-header">
              <span>Sản phẩm</span>
              <span style={{ textAlign: "right" }}>Số lượng</span>
            </div>
            {(order.items ?? order.orderItems ?? []).map((item, i) => (
              <div key={i} className="order-detail__item-row">
                <div>
                  <p className="order-detail__item-name">{item.productName}</p>
                  <p className="order-detail__item-id font-mono">{item.productId}</p>
                </div>
                <span className="order-detail__item-qty font-mono" style={{ textAlign: "right" }}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            <div className="order-detail__items-total">
              <span>Tổng cộng</span>
              <span className="font-mono">
                {formatCurrency(order.total ?? order.totalAmount ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
