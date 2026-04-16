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
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button } from "../../../components/ui";
import { useData } from "../../../contexts/DataContext";
import "./OrderDetail.css";

const TIMELINE_STEPS = [
  { status: "pending", label: "Tạo đơn", icon: FileText },
  { status: "confirmed", label: "Xác nhận", icon: CheckCircle },
  { status: "producing", label: "Sản xuất", icon: Clock },
  { status: "ready", label: "Sẵn sàng", icon: CheckCircle },
  { status: "shipping", label: "Giao hàng", icon: Truck },
  { status: "delivered", label: "Hoàn thành", icon: CheckCircle },
];

const STATUS_ORDER = [
  "pending",
  "confirmed",
  "producing",
  "ready",
  "shipping",
  "delivered",
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    orders,
    products,
    updateOrder,
    STATUS_LABELS,
    STATUS_COLORS,
    formatCurrency,
    formatDate,
    formatDateTime,
  } = useData();
  const order = orders.find((o) => o.id === id);

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

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

  const handleCancel = () => {
    updateOrder(order.id, { status: "cancelled" });
    toast.success(`Đã hủy đơn hàng ${order.id}`);
  };

  return (
    <PageWrapper
      title={`Chi tiết đơn hàng ${order.id}`}
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
          <Badge variant={STATUS_COLORS[order.status]} dot>
            {STATUS_LABELS[order.status]}
          </Badge>
          {order.priority === "high" && (
            <Badge variant="danger">Ưu tiên cao</Badge>
          )}
        </div>
        <div className="order-detail__timeline">
          {TIMELINE_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isCompleted =
              i <= currentStepIndex && order.status !== "cancelled";
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={step.status}
                className={`timeline-step ${isCompleted ? "timeline-step--completed" : ""} ${isCurrent ? "timeline-step--current" : ""}`}
              >
                <div className="timeline-step__dot">
                  <StepIcon size={16} />
                </div>
                <span className="timeline-step__label">{step.label}</span>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`timeline-step__line ${isCompleted && i < currentStepIndex ? "timeline-step__line--filled" : ""}`}
                  />
                )}
              </div>
            );
          })}
        </div>
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
                  {order.id}
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
              <span style={{ textAlign: "right" }}>Đơn giá</span>
              <span style={{ textAlign: "right" }}>Số lượng</span>
              <span style={{ textAlign: "right" }}>Thành tiền</span>
            </div>
            {order.items.map((item, i) => {
              const unitPrice =
                item.unitPrice ??
                products.find((p) => p.id === item.productId)?.price ??
                0;
              const subtotal = unitPrice * item.quantity;
              return (
                <div key={i} className="order-detail__item-row">
                  <div>
                    <p className="order-detail__item-name">
                      {item.productName}
                    </p>
                    <p className="order-detail__item-id font-mono">
                      {item.productId}
                    </p>
                  </div>
                  <span
                    className="order-detail__item-qty font-mono"
                    style={{ textAlign: "right" }}
                  >
                    {formatCurrency(unitPrice)}
                  </span>
                  <span
                    className="order-detail__item-qty font-mono"
                    style={{ textAlign: "right" }}
                  >
                    {item.quantity} {item.unit}
                  </span>
                  <span
                    className="order-detail__item-qty font-mono"
                    style={{ textAlign: "right" }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              );
            })}
            <div className="order-detail__items-total">
              <span>Tổng cộng</span>
              <span className="font-mono">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action buttons */}
      {order.status === "pending" && (
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <Button variant="danger" onClick={handleCancel}>
            Hủy đơn
          </Button>
        </div>
      )}
    </PageWrapper>
  );
}
