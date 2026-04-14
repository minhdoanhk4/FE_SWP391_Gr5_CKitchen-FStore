import { useState } from "react";
import { Truck, Package, MapPin, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { useData } from "../../contexts/DataContext";

export default function DeliverySchedule() {
  const {
    orders,
    updateOrder,
    STATUS_LABELS,
    STATUS_COLORS,
    formatCurrency,
    formatDate,
    formatDateTime,
  } = useData();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const readyOrders = orders.filter((o) => o.status === "ready");
  const shippingOrders = orders.filter((o) => o.status === "shipping");

  const handleAssignShipping = (order) => {
    updateOrder(order.id, { status: "shipping" });
    setSelectedOrder(null);
    toast.success(`${order.id} đã chuyển sang trạng thái giao hàng`);
  };

  const progressWidth = (status) => {
    if (status === "ready") return "60%";
    if (status === "shipping") return "80%";
    return "40%";
  };

  return (
    <PageWrapper
      title="Lịch giao hàng"
      subtitle="Quản lý và điều phối giao hàng cho các đơn sẵn sàng"
    >
      {/* Ready to ship section */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h3
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-semibold)",
            color: "var(--text-primary)",
            marginBottom: "var(--space-3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Package size={18} style={{ color: "var(--primary)" }} />
          Sẵn sàng giao ({readyOrders.length})
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          {readyOrders.map((order) => (
            <Card key={order.id} hoverable>
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
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "15px",
                    }}
                  >
                    {order.id}
                  </span>
                  <Badge variant={STATUS_COLORS[order.status]} dot>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                  {order.priority === "high" && (
                    <Badge variant="danger">Gấp</Badge>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <MapPin size={14} /> {order.storeName}
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Calendar size={14} /> Yêu cầu:{" "}
                  {formatDate(order.requestedDate)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                {order.items.map((item, i) => (
                  <span
                    key={i}
                    style={{
                      background: "var(--surface-hover)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {item.productName} × {item.quantity}
                  </span>
                ))}
              </div>
              {order.notes && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {order.notes}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Xác nhận</span>
                    <span>Sản xuất</span>
                    <span>Sẵn sàng</span>
                    <span>Giao hàng</span>
                    <span>Hoàn thành</span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--surface-hover)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--primary), var(--primary-lighter))",
                        borderRadius: "3px",
                        width: progressWidth(order.status),
                        transition: "width 500ms ease",
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Truck}
                  onClick={() => handleAssignShipping(order)}
                >
                  Giao hàng
                </Button>
              </div>
            </Card>
          ))}
          {readyOrders.length === 0 && (
            <Card>
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "20px",
                }}
              >
                Không có đơn nào sẵn sàng giao
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Shipping section */}
      <div>
        <h3
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-semibold)",
            color: "var(--text-primary)",
            marginBottom: "var(--space-3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Truck size={18} style={{ color: "var(--info)" }} />
          Đang giao ({shippingOrders.length})
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          {shippingOrders.map((order) => (
            <Card key={order.id} hoverable>
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
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "15px",
                    }}
                  >
                    {order.id}
                  </span>
                  <Badge variant={STATUS_COLORS[order.status]} dot>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                  {order.priority === "high" && (
                    <Badge variant="danger">Gấp</Badge>
                  )}
                </div>
                <span className="font-mono" style={{ fontWeight: 600 }}>
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <MapPin size={14} /> {order.storeName}
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Calendar size={14} /> Yêu cầu:{" "}
                  {formatDate(order.requestedDate)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                {order.items.map((item, i) => (
                  <span
                    key={i}
                    style={{
                      background: "var(--surface-hover)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {item.productName} × {item.quantity}
                  </span>
                ))}
              </div>
              {order.notes && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {order.notes}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Xác nhận</span>
                    <span>Sản xuất</span>
                    <span>Sẵn sàng</span>
                    <span>Giao hàng</span>
                    <span>Hoàn thành</span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--surface-hover)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--primary), var(--primary-lighter))",
                        borderRadius: "3px",
                        width: progressWidth(order.status),
                        transition: "width 500ms ease",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  marginTop: "8px",
                }}
              >
                Chờ cửa hàng xác nhận nhận hàng
              </p>
            </Card>
          ))}
          {shippingOrders.length === 0 && (
            <Card>
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "20px",
                }}
              >
                Không có đơn nào đang giao
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
