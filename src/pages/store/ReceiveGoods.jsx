import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Star } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Button, Badge } from "../../components/ui";
import { Textarea } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";

export default function ReceiveGoods() {
  const { user } = useAuth();
  const { STATUS_LABELS, STATUS_COLORS, formatCurrency, formatDate } =
    useData();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [confirmedOrders, setConfirmedOrders] = useState([]);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const [resShipping, resWaiting] = await Promise.all([
        storeService.getDeliveries({ status: "SHIPPING", size: 50 }),
        storeService.getDeliveries({ status: "WAITING_CONFIRM", size: 50 }),
      ]);
      const rows = [
        ...(resShipping.content || []),
        ...(resWaiting.content || []),
      ];
      // Augment each delivery with order items + total
      const enriched = await Promise.all(
        rows.map(async (d) => {
          if (!d.orderId) return d;
          try {
            const order = await storeService.getOrderById(d.orderId);
            return {
              ...d,
              items: order.items ?? order.orderItems ?? [],
              total: order.total ?? order.totalAmount ?? 0,
            };
          } catch {
            return d;
          }
        }),
      );
      setDeliveries(enriched);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn giao hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleConfirm = async (deliveryId, orderId) => {
    const orderFeedback = feedback[orderId] || {};
    const ratingNote = orderFeedback.rating
      ? ` | Đánh giá: ${orderFeedback.rating}/5 sao`
      : "";
    try {
      await storeService.confirmReceipt(deliveryId, {
        notes: (orderFeedback.comment || "Đã nhận đủ") + ratingNote,
        temperatureOk: true,
        receiverName: user?.name || user?.username || "Store Staff",
      });
      setConfirmedOrders((prev) => [...prev, orderId]);
      toast.success(
        `Đã xác nhận nhận hàng cho đơn ${orderId}! Tồn kho đã được cập nhật.`,
      );
      fetchDeliveries();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Xác nhận nhận hàng thất bại",
      );
    }
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
        {deliveries.length === 0 && !loading && (
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
        {deliveries.length > 0 &&
          deliveries.map((delivery) => {
            const orderId = delivery.orderId || delivery.id; // API structure might be direct or nested
            const orderTotal = delivery.total || 0;
            const items = delivery.items || [];
            const status = delivery.status?.toLowerCase() || "shipping";
            return (
              <Card key={delivery.id} className="animate-fade-in-up">
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
                        {orderId}
                      </span>
                      <Badge variant={STATUS_COLORS[status] || "info"} dot>
                        {STATUS_LABELS[status] || "Đang giao"}
                      </Badge>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Mã vận chuyển: {delivery.id}
                    </p>
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontWeight: 600, fontSize: "15px" }}
                  >
                    {formatCurrency(orderTotal)}
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
                  {items.map((item, i) => (
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

                {status === "waiting_confirm" &&
                  !confirmedOrders.includes(orderId) && (
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
                                star <= (feedback[orderId]?.rating || 0)
                                  ? "#E9C46A"
                                  : "none"
                              }
                              color="#E9C46A"
                              onClick={() =>
                                setFeedback((prev) => ({
                                  ...prev,
                                  [orderId]: { ...prev[orderId], rating: star },
                                }))
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Nhận xét về chất lượng hàng hóa..."
                        value={feedback[orderId]?.comment || ""}
                        onChange={(e) =>
                          setFeedback((prev) => ({
                            ...prev,
                            [orderId]: {
                              ...prev[orderId],
                              comment: e.target.value,
                            },
                          }))
                        }
                      />
                      <Button
                        icon={CheckCircle}
                        onClick={() => handleConfirm(delivery.id, orderId)}
                      >
                        Xác nhận nhận hàng
                      </Button>
                    </div>
                  )}

                {(status === "delivered" ||
                  confirmedOrders.includes(orderId)) && (
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
                    {feedback[orderId]?.rating && (
                      <span style={{ display: "flex", gap: "2px" }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={
                              s <= (feedback[orderId]?.rating || 0)
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
            );
          })}
      </div>
    </PageWrapper>
  );
}
