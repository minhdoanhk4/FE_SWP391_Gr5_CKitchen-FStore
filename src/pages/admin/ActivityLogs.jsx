import { useState, useEffect } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import activityLogService from "../../services/activityLogService";

const ACTION_COLORS = {
  LOGIN: "success",
  LOGOUT: "neutral",
  REGISTER: "primary",
  FAILED_LOGIN: "danger",
  PASSWORD_RESET: "warning",
  FORCE_LOGOUT: "danger",
};

export default function ActivityLogs() {
  const { formatDateTime } = useData();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Date range filter
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let resp;
      if (fromDate && toDate) {
        resp = await activityLogService.getByDateRange(fromDate, toDate, {
          size: 100,
        });
      } else {
        resp = await activityLogService.getAll({ size: 100 });
      }
      setLogs(resp?.content ?? resp ?? []);
    } catch {
      toast.error("Không thể tải nhật ký hoạt động");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []); // manual refresh only

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await activityLogService.delete(confirmDelete.id);
      toast.success("Đã xóa bản ghi");
      setConfirmDelete(null);
      setLogs((prev) => prev.filter((l) => l.id !== confirmDelete.id));
    } catch {
      toast.error("Không thể xóa bản ghi");
    }
  };

  const columns = [
    {
      header: "ID",
      accessor: "id",
      width: "70px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.id}
        </span>
      ),
    },
    {
      header: "Người dùng",
      accessor: "username",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.fullName ?? r.username}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            @{r.username}
          </div>
        </div>
      ),
    },
    {
      header: "Hành động",
      accessor: "actionType",
      render: (r) => (
        <Badge variant={ACTION_COLORS[r.actionType] ?? "neutral"}>
          {r.actionType}
        </Badge>
      ),
    },
    {
      header: "Mô tả",
      accessor: "description",
      render: (r) => (
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {r.description ?? r.message ?? "—"}
        </span>
      ),
    },
    {
      header: "IP",
      accessor: "ipAddress",
      width: "130px",
      render: (r) => (
        <span className="font-mono" style={{ fontSize: "12px" }}>
          {r.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      header: "Thời gian",
      accessor: "createdAt",
      sortable: true,
      render: (r) => (
        <span style={{ fontSize: "13px" }}>
          {formatDateTime(r.createdAt ?? r.timestamp)}
        </span>
      ),
    },
    {
      header: "",
      width: "50px",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={Trash2}
          title="Xóa"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(row);
          }}
        />
      ),
    },
  ];

  return (
    <PageWrapper
      title="Nhật ký hoạt động"
      subtitle="Theo dõi lịch sử đăng nhập và hoạt động người dùng"
      actions={
        <Button icon={RefreshCw} variant="secondary" onClick={fetchLogs}>
          Làm mới
        </Button>
      }
    >
      {/* Date filter */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Từ ngày
        </label>
        <input
          type="date"
          value={fromDate}
          max={toDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        />
        <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Đến ngày
        </label>
        <input
          type="date"
          value={toDate}
          min={fromDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        />
        <Button size="sm" onClick={fetchLogs}>
          Tìm kiếm
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Tìm theo username, hành động..."
        emptyTitle="Không có nhật ký nào"
        emptyDesc="Chưa có hoạt động nào được ghi nhận trong khoảng thời gian này."
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xóa bản ghi"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </>
        }
      >
        <p style={{ fontSize: "14px" }}>
          Xóa bản ghi nhật ký #{confirmDelete?.id} của{" "}
          <strong>{confirmDelete?.username}</strong>?
        </p>
      </Modal>
    </PageWrapper>
  );
}
