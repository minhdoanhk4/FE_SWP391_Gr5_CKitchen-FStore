import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button, Modal } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import supplyService from "../../services/supplyService";

const ISSUE_TYPE_LABELS = {
  SHORTAGE: "Thiếu hàng",
  DELAY: "Giao trễ",
  CANCELLATION: "Hủy đơn",
  OTHER: "Khác",
};

const ISSUE_TYPE_OPTIONS = Object.entries(ISSUE_TYPE_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));

export default function IssueManagement() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    issueType: "OTHER",
    description: "",
    orderId: "",
    cancelOrder: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load active deliveries to pick from
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const [all] = await Promise.all([
          supplyService.getDeliveries({ size: 50 }),
        ]);
        const items = all.content || all || [];
        // Sort: DELAYED first, then SHIPPING, then others
        items.sort((a, b) => {
          const order = { DELAYED: 0, SHIPPING: 1 };
          return (order[a.status] ?? 2) - (order[b.status] ?? 2);
        });
        setRecentDeliveries(items);
      } catch {
        // silent
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchDeliveries();
  }, []);

  const handleOpenNew = () => {
    setForm({
      issueType: "OTHER",
      description: "",
      orderId: "",
      cancelOrder: false,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.orderId.trim()) errs.orderId = "Vui lòng nhập mã đơn hàng";
    if (!form.description.trim()) errs.description = "Vui lòng nhập mô tả";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await supplyService.createIssue(form.orderId.trim(), {
        issueType: form.issueType,
        description: form.description,
        cancelOrder: form.cancelOrder || form.issueType === "CANCELLATION",
      });
      setShowModal(false);
      toast.success("Đã báo cáo sự cố thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể báo cáo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="Xử lý vấn đề phát sinh"
      subtitle="Báo cáo sự cố: thiếu hàng, giao trễ, hủy đơn"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Báo cáo sự cố
        </Button>
      }
    >
      {/* Explanation card */}
      <Card style={{ marginBottom: "20px" }}>
        <div
          style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
        >
          <AlertTriangle
            size={20}
            style={{
              color: "var(--warning)",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
          <div>
            <h4
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Hướng dẫn báo cáo sự cố
            </h4>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Sử dụng chức năng này để báo cáo các vấn đề phát sinh trong quá
              trình điều phối và giao hàng. Các loại sự cố hỗ trợ:{" "}
              <strong>Thiếu hàng</strong>, <strong>Giao trễ</strong>,{" "}
              <strong>Hủy đơn</strong>, <strong>Khác</strong>. Khi chọn "Hủy
              đơn" hoặc loại sự cố là "CANCELLATION", hệ thống sẽ tự động hủy
              đơn hàng liên quan.
            </p>
          </div>
        </div>
      </Card>

      {/* Recent orders for reference */}
      {!loadingOrders && recentDeliveries.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{
              fontSize: "var(--text-base)",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            Lịch giao hàng đang hoạt động (nhấn để chọn nhanh)
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {recentDeliveries.slice(0, 6).map((delivery) => (
              <Card
                key={delivery.deliveryId || delivery.id}
                hoverable
                style={{ cursor: "pointer", border: delivery.status === "DELAYED" ? "1px solid var(--warning)" : undefined }}
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    orderId: delivery.orderId || delivery.order?.orderId || delivery.order?.id || "",
                  }));
                  setShowModal(true);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 600,
                      color: "var(--primary)",
                      fontSize: "13px",
                    }}
                  >
                    {delivery.orderId || delivery.order?.orderId || delivery.order?.id || delivery.deliveryId || delivery.id}
                  </span>
                  <Badge
                    variant={
                      delivery.status === "DELAYED"
                        ? "warning"
                        : delivery.status === "SHIPPING"
                          ? "info"
                          : "neutral"
                    }
                    dot
                  >
                    {delivery.status}
                  </Badge>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                  }}
                >
                  {delivery.storeName || delivery.order?.storeName || ""}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loadingOrders && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <Loader2
            size={24}
            className="spin"
            style={{ color: "var(--primary)" }}
          />
        </div>
      )}

      {/* Create Issue Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Báo cáo sự cố mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select
            label="Mã đơn hàng"
            required
            value={form.orderId}
            onChange={(e) =>
              setForm((f) => ({ ...f, orderId: e.target.value }))
            }
            error={errors.orderId}
            options={[
              { value: "", label: "-- Chọn đơn hàng --" },
              ...recentDeliveries.map((d) => {
                const oid = d.orderId || d.order?.orderId || d.order?.id || "";
                const store = d.storeName || d.order?.storeName || "";
                return {
                  value: oid,
                  label: `${oid}${store ? " — " + store : ""} [Giao hàng: ${d.status}]`,
                };
              }),
            ]}
          />
          <Select
            label="Loại sự cố"
            options={ISSUE_TYPE_OPTIONS}
            value={form.issueType}
            onChange={(e) =>
              setForm((f) => ({ ...f, issueType: e.target.value }))
            }
          />
          <Textarea
            label="Mô tả chi tiết"
            required
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Mô tả chi tiết vấn đề phát sinh..."
            error={errors.description}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.cancelOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, cancelOrder: e.target.checked }))
              }
            />
            Hủy đơn hàng này
          </label>
          {(form.cancelOrder || form.issueType === "CANCELLATION") && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--danger)",
                fontStyle: "italic",
              }}
            >
              Đơn hàng sẽ bị hủy khi gửi báo cáo này.
            </p>
          )}
        </div>
      </Modal>
    </PageWrapper>
  );
}
