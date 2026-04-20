import { useState } from "react";
import { Bell, Send, Trash2, History, Users, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Button, Input, Select, DataTable, Badge } from "../../components/ui";

const TARGET_OPTIONS = [
  { value: "ALL", label: "Tất cả người dùng" },
  { value: "STORE", label: "Nhân viên Cửa hàng" },
  { value: "KITCHEN", label: "Nhân viên Bếp" },
  { value: "MANAGER", label: "Quản lý / Điều phối" },
];

const TYPE_OPTIONS = [
  { value: "info", label: "Thông tin (Xanh dương)" },
  { value: "warning", label: "Cảnh báo (Vàng)" },
  { value: "error", label: "Khẩn cấp (Đỏ)" },
];

export default function NotificationManagement() {
  const [history, setHistory] = useState([
    {
      id: 1,
      title: "Bảo trì hệ thống định kỳ",
      message: "Hệ thống sẽ bảo trì vào lúc 23:00 tối nay. Vui lòng hoàn tất các đơn hàng trước 22:30.",
      target: "ALL",
      type: "warning",
      sentAt: "2024-04-20 10:00",
      sender: "admin",
    },
    {
      id: 2,
      title: "Cập nhật menu quý 2",
      message: "Danh mục sản phẩm mới đã được cập nhật. Vui lòng kiểm tra mục Sản phẩm.",
      target: "MANAGER",
      type: "info",
      sentAt: "2024-04-18 14:20",
      sender: "admin",
    },
  ]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "ALL",
    type: "info",
  });

  const handleSend = () => {
    if (!form.title || !form.message) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo");
      return;
    }

    const newNotify = {
      id: Date.now(),
      ...form,
      sentAt: new Date().toLocaleString(),
      sender: "admin",
    };

    setHistory([newNotify, ...history]);
    toast.success("Thông báo đã được gửi đi thành công!");
    setForm({ title: "", message: "", target: "ALL", type: "info" });
  };

  const columns = [
    { header: "Ngày gửi", accessor: "sentAt", width: "150px" },
    { 
        header: "Tiêu đề", 
        accessor: "title",
        render: (r) => (
            <div style={{ fontWeight: 600 }}>
                {r.title}
            </div>
        )
    },
    { 
        header: "Đối tượng", 
        accessor: "target",
        render: (r) => {
            const target = TARGET_OPTIONS.find(o => o.value === r.target);
            return <Badge variant="neutral">{target?.label || r.target}</Badge>;
        }
    },
    { 
        header: "Loại", 
        accessor: "type",
        render: (r) => {
            const variantMap = { info: "primary", warning: "warning", error: "danger" };
            return <Badge variant={variantMap[r.type]}>{r.type.toUpperCase()}</Badge>;
        }
    },
    {
        header: "Thao tác",
        width: "60px",
        render: (r) => (
            <Button variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => setHistory(history.filter(h => h.id !== r.id))} />
        )
    }
  ];

  return (
    <PageWrapper
      title="Thông báo hệ thống"
      subtitle="Gửi thông báo và cảnh báo tới toàn bộ nhân viên trong hệ thống"
    >
      <div className="grid grid--3-1">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card>
            <h4 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={18} /> Lịch sử thông báo đã gửi
            </h4>
            <DataTable
              columns={columns}
              data={history}
              searchPlaceholder="Tìm kiếm thông báo..."
            />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card>
            <h4 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Megaphone size={18} /> Soạn thông báo mới
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Tiêu đề"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ví dụ: Thông báo bảo trì..."
              />
              <Select
                label="Đối tượng nhận"
                options={TARGET_OPTIONS}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
              <Select
                label="Loại thông báo"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Nội dung chi tiết
                </label>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--surface-border)",
                    background: "var(--surface-sub)",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Nhập nội dung thông báo tại đây..."
                />
              </div>
              <Button icon={Send} onClick={handleSend} block>
                Gửi thông báo ngay
              </Button>
            </div>
          </Card>

          <Card style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", color: "white" }}>
             <h4 style={{ color: "white", marginBottom: "12px" }}>Mẹo nhỏ</h4>
             <ul style={{ fontSize: "12px", paddingLeft: "16px", opacity: 0.9 }}>
                <li>Dùng <b>Warning</b> cho các kế hoạch bảo trì.</li>
                <li>Dùng <b>Error</b> cho các vấn đề kỹ thuật khẩn cấp.</li>
                <li>Thông báo sẽ xuất hiện ngay trên Dashboard của các nhân viên được chọn.</li>
             </ul>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
