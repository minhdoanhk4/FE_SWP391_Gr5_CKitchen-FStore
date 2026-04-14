import { useState } from "react";
import { CheckCircle, Star } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { Card, Button, Badge } from "../../../components/ui";
import { Textarea } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export default function ReceiveGoods() {
  const { user } = useAuth();
  const {
    orders,
    updateOrder,
    storeInventory,
    updateStoreInventory,
    addStoreInventoryItem,
    addAuditLog,
    STATUS_LABELS,
    STATUS_COLORS,
    formatCurrency,
    formatDate,
  } = useData();
  const [feedback, setFeedback] = useState({});
  const [confirmedOrders, setConfirmedOrders] = useState([]);

  const shippingOrders = orders.filter(
    (o) =>
      o.storeId === user.store &&
      (o.status === "shipping" || o.status === "delivered"),
  );

  const handleConfirm = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    const orderFeedback = feedback[orderId] || {};
    updateOrder(orderId, {
      status: "delivered",
      qualityRating: orderFeedback.rating || null,
      qualityComment: orderFeedback.comment || null,
    });

    // Auto-add received items to store inventory
    if (order) {
      order.items.forEach((item) => {
        const existing = storeInventory.find(
          (i) => i.storeId === user.store && i.productId === item.productId,
        );
        if (existing) {
          updateStoreInventory(existing.id, {
            quantity: existing.quantity + item.quantity,
          });
        } else {
          addStoreInventoryItem({
            id: Date.now() + Math.random(),
            storeId: user.store,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            minStock: 10,
            expiryDate: null,
          });
        }
      });

      addAuditLog(
        "goods_received",
        user.name,
        `Nhận hàng đơn ${orderId} (${order.items.length} SP) - tồn kho đã cập nhật`,
        "inventory",
      );
    }

    setConfirmedOrders((prev) => [...prev, orderId]);
    toast.success(`Đã xác nhận nhận hàng cho đơn ${orderId}! Tồn kho đã được cập nhật.`);
  };

  return (
    <PageWrapper
      title="Nhận hàng"
      subtitle="Xác nhận nhận hàng và phản hồi chất lượng"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {shippingOrders.length === 0 && (
          <Card>
            <p
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted)",
              }}
            >
              Hiện tại không có đơn hàng nào cần nhận.
            </p>
          </Card>
        )}
        {shippingOrders.map((order) => (
          <Card key={order.id} className="animate-fade-in-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
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
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Ngày yêu cầu: {formatDate(order.requestedDate)}
                </p>
              </div>
              <span
                className="font-mono"
                style={{ fontWeight: 600, fontSize: "15px" }}
              >
                {formatCurrency(order.total)}
              </span>
            </div>

            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              {order.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    padding: "4px 0",
                  }}
                >
                  <span>{item.productName}</span>
                  <span className="font-mono">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            {order.status === "shipping" &&
              !confirmedOrders.includes(order.id) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <Star size={16} color="var(--accent-warm)" />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      Đánh giá chất lượng:
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Star
                          size={20}
                          fill={
                            star <= (feedback[order.id]?.rating || 0)
                              ? "#E9C46A"
                              : "none"
                          }
                          color="#E9C46A"
                          onClick={() =>
                            setFeedback((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], rating: star },
                            }))
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Nhận xét về chất lượng hàng hóa..."
                    value={feedback[order.id]?.comment || ""}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          comment: e.target.value,
                        },
                      }))
                    }
                  />
                  <Button
                    icon={CheckCircle}
                    onClick={() => handleConfirm(order.id)}
                  >
                    Xác nhận nhận hàng
                  </Button>
                </div>
              )}

            {(order.status === "delivered" ||
              confirmedOrders.includes(order.id)) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <Badge variant="success" dot>
                  Đã xác nhận nhận hàng
                </Badge>
                {(order.qualityRating || feedback[order.id]?.rating) && (
                  <span style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={
                          s <=
                          (order.qualityRating || feedback[order.id]?.rating)
                            ? "#E9C46A"
                            : "none"
                        }
                        color="#E9C46A"
                      />
                    ))}
                  </span>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
