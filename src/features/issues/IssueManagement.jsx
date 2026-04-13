import { useState } from "react";
import {
  Plus,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Badge, Button, Modal } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui";
import { useData } from "../../contexts/DataContext";

const TYPE_LABELS = {
  late_delivery: "Giao trễ",
  shortage: "Thiếu hàng",
  quality: "Chất lượng",
  other: "Khác",
};
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const PRIORITY_COLORS = { high: "danger", medium: "warning", low: "neutral" };
const PRIORITY_OPTIONS = [
  { value: "high", label: "Cao" },
  { value: "medium", label: "Trung bình" },
  { value: "low", label: "Thấp" },
];
const STATUS_ICONS = {
  open: Clock,
  in_progress: AlertTriangle,
  resolved: CheckCircle,
};

export default function IssueManagement() {
  const { issues, addIssue, updateIssue, formatDateTime } = useData();
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [response, setResponse] = useState("");
  const [form, setForm] = useState({
    type: "other",
    priority: "medium",
    title: "",
    description: "",
    orderId: "",
  });
  const [errors, setErrors] = useState({});

  const filtered =
    filter === "all" ? issues : issues.filter((i) => i.status === filter);

  const handleOpenNew = () => {
    setForm({
      type: "other",
      priority: "medium",
      title: "",
      description: "",
      orderId: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Vui lòng nhập tiêu đề";
    if (!form.description.trim()) errs.description = "Vui lòng nhập mô tả";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const newIssue = {
      id: `IS${String(issues.length + 1).padStart(3, "0")}`,
      orderId: form.orderId || null,
      type: form.type,
      title: form.title,
      description: form.description,
      status: "open",
      priority: form.priority,
      createdAt: new Date().toISOString(),
      assignee: "Le Minh Chau",
      responses: [],
    };
    addIssue(newIssue);
    setShowModal(false);
    toast.success("Đã tạo vấn đề mới!");
  };

  const handleStatusChange = (id, newStatus) => {
    updateIssue(id, { status: newStatus });
    toast.success(
      `Đã cập nhật trạng thái thành "${newStatus === "in_progress" ? "Đang xử lý" : "Đã giải quyết"}"`,
    );
  };

  const handleAddResponse = (id) => {
    if (!response.trim()) return;
    const issue = issues.find((i) => i.id === id);
    updateIssue(id, {
      responses: [
        ...(issue.responses || []),
        { text: response, time: new Date().toISOString(), by: "Le Minh Chau" },
      ],
    });
    setResponse("");
    toast.success("Đã thêm phản hồi!");
  };

  return (
    <PageWrapper
      title="Xử lý vấn đề phát sinh"
      subtitle="Quản lý các vấn đề: thiếu hàng, giao trễ, hủy đơn"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Báo cáo vấn đề
        </Button>
      }
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid",
              borderColor:
                filter === s ? "var(--primary)" : "var(--surface-border)",
              background:
                filter === s ? "var(--primary-bg)" : "var(--surface-card)",
              color: filter === s ? "var(--primary)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {s === "all"
              ? `Tất cả (${issues.length})`
              : s === "open"
                ? `Đang mở (${issues.filter((i) => i.status === "open").length})`
                : s === "in_progress"
                  ? `Đang xử lý (${issues.filter((i) => i.status === "in_progress").length})`
                  : `Đã giải quyết (${issues.filter((i) => i.status === "resolved").length})`}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {filtered.map((issue) => {
          const StatusIcon = STATUS_ICONS[issue.status];
          const isExpanded = selectedIssue === issue.id;
          return (
            <Card
              key={issue.id}
              hoverable
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedIssue(isExpanded ? null : issue.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 600,
                      color: "var(--accent)",
                      fontSize: "13px",
                    }}
                  >
                    {issue.id}
                  </span>
                  <Badge variant={PRIORITY_COLORS[issue.priority]}>
                    {issue.priority === "high"
                      ? "Cao"
                      : issue.priority === "medium"
                        ? "TB"
                        : "Thấp"}
                  </Badge>
                  <Badge variant="neutral">{TYPE_LABELS[issue.type]}</Badge>
                </div>
                <Badge
                  variant={
                    issue.status === "open"
                      ? "warning"
                      : issue.status === "in_progress"
                        ? "info"
                        : "success"
                  }
                  dot
                >
                  {issue.status === "open"
                    ? "Đang mở"
                    : issue.status === "in_progress"
                      ? "Đang xử lý"
                      : "Đã giải quyết"}
                </Badge>
              </div>
              <h4
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {issue.title}
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                {issue.description}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <span>📋 {issue.orderId || "N/A"}</span>
                <span>👤 {issue.assignee}</span>
                <span>🕐 {formatDateTime(issue.createdAt)}</span>
              </div>

              {/* Expanded actions & responses */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--surface-border)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Status actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {issue.status === "open" && (
                      <Button
                        size="sm"
                        variant="accent"
                        icon={AlertTriangle}
                        onClick={() =>
                          handleStatusChange(issue.id, "in_progress")
                        }
                      >
                        Bắt đầu xử lý
                      </Button>
                    )}
                    {issue.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={CheckCircle}
                        onClick={() => handleStatusChange(issue.id, "resolved")}
                      >
                        Đánh dấu đã giải quyết
                      </Button>
                    )}
                    {issue.status === "resolved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Clock}
                        onClick={() => handleStatusChange(issue.id, "open")}
                      >
                        Mở lại
                      </Button>
                    )}
                  </div>

                  {/* Response history */}
                  {issue.responses?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <h5
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        💬 Phản hồi
                      </h5>
                      {issue.responses.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 12px",
                            background: "var(--surface)",
                            borderRadius: "var(--radius-md)",
                            marginBottom: "6px",
                            fontSize: "13px",
                          }}
                        >
                          <p>{r.text}</p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            {r.by} — {formatDateTime(r.time)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add response */}
                  {issue.status !== "resolved" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Textarea
                        placeholder="Thêm phản hồi..."
                        value={selectedIssue === issue.id ? response : ""}
                        onChange={(e) => setResponse(e.target.value)}
                        style={{ flex: 1, minHeight: "60px" }}
                      />
                      <Button
                        size="sm"
                        icon={MessageSquare}
                        onClick={() => handleAddResponse(issue.id)}
                      >
                        Gửi
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Create Issue Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Báo cáo vấn đề mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo báo cáo</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Tiêu đề"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Mô tả ngắn gọn vấn đề"
            error={errors.title}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Select
              label="Loại vấn đề"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
            <Select
              label="Mức độ ưu tiên"
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
            />
          </div>
          <Input
            label="Mã đơn hàng liên quan (nếu có)"
            value={form.orderId}
            onChange={(e) =>
              setForm((f) => ({ ...f, orderId: e.target.value }))
            }
            placeholder="DH001"
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
        </div>
      </Modal>
    </PageWrapper>
  );
}
