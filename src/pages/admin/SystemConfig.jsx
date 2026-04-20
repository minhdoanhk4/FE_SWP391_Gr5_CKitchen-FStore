import { useState, useEffect } from "react";
import { Save, Clock, Plus, Edit } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Button, Input, Select, DataTable, Badge, Modal } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import adminService from "../../services/adminService";

export default function SystemConfig() {
  const { user } = useAuth();
  const { systemConfig: configs, updateConfig, addAuditLog } = useData();

  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    priorityCode: "",
    description: "",
    minDays: 0,
    maxDays: 0,
  });

  const fetchPriorities = async () => {
    setLoading(true);
    try {
      const data = await adminService.systemConfig.getPriorities();
      setPriorities(data || []);
    } catch (err) {
      console.error("Failed to fetch priorities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ priorityCode: "", description: "", minDays: 1, maxDays: 2 });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      priorityCode: item.priorityCode,
      description: item.description,
      minDays: item.minDays,
      maxDays: item.maxDays,
    });
    setShowModal(true);
  };

  const handleSavePriority = async () => {
    if (!form.priorityCode || !form.description) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      if (editItem) {
        await adminService.systemConfig.updatePriority(editItem.id || editItem.idPriority, form);
        toast.success("Cập nhật thành công!");
      } else {
        await adminService.systemConfig.createPriority(form);
        toast.success("Thêm mới thành công!");
      }
      setShowModal(false);
      fetchPriorities();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleChange = (key) => (e) => {
    updateConfig({ [key]: e.target.value });
  };

  const handleSaveConfig = (section) => {
    addAuditLog(
      "config_updated",
      user.name,
      `Cập nhật cài đặt ${section}`,
      "config",
    );
    toast.success(`Đã lưu cài đặt ${section} thành công!`);
  };

  const priorityColumns = [
    { header: "Mã ưu tiên", accessor: "priorityCode", render: (r) => <Badge variant="neutral">{r.priorityCode}</Badge> },
    { header: "Mô tả", accessor: "description" },
    { header: "Tối thiểu", accessor: "minDays", render: (r) => `${r.minDays} ngày` },
    { header: "Tối đa", accessor: "maxDays", render: (r) => `${r.maxDays} ngày` },
    {
      header: "Thao tác",
      width: "80px",
      render: (r) => (
        <Button variant="ghost" size="sm" iconOnly icon={Edit} onClick={() => handleEdit(r)} />
      ),
    },
  ];

  return (
    <PageWrapper
      title="Cấu hình hệ thống"
      subtitle="Thiết lập đơn vị tính, quy trình và tham số vận hành"
    >
      <div style={{ marginBottom: "var(--space-8)" }}>
         <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, margin: 0 }}>
              <Clock size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
              Cấu hình thời gian giao hàng (Order Priority)
            </h4>
            <div style={{ display: "flex", gap: "10px" }}>
               <Badge variant="primary">Live API</Badge>
               <Button size="sm" icon={Plus} onClick={handleOpenAdd}>Thêm mới</Button>
            </div>
          </div>
          <DataTable
            columns={priorityColumns}
            data={priorities}
            loading={loading}
            searchable={false}
          />
        </Card>
      </div>

      <div className="grid grid--2">
        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            Cài đặt chung
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Input
              label="Tên hệ thống"
              value={configs.systemName}
              onChange={handleChange("systemName")}
            />
            <Input
              label="Email hỗ trợ"
              value={configs.email}
              onChange={handleChange("email")}
            />
            <Select
              label="Múi giờ"
              options={[
                { value: "UTC+7", label: "UTC+7 (Việt Nam)" },
                { value: "UTC+8", label: "UTC+8 (Singapore)" },
              ]}
              value={configs.timezone}
              onChange={handleChange("timezone")}
            />
            <Select
              label="Đơn vị tiền tệ"
              options={[
                { value: "VND", label: "VND - Việt Nam Đồng" },
                { value: "USD", label: "USD - Đô la Mỹ" },
              ]}
              value={configs.currency}
              onChange={handleChange("currency")}
            />
            <Button icon={Save} onClick={() => handleSaveConfig("chung")}>
              Lưu thay đổi
            </Button>
          </div>
        </Card>

        <Card>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            Đơn vị tính
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Input
              label="Đơn vị khối lượng mặc định"
              value={configs.massUnit}
              onChange={handleChange("massUnit")}
            />
            <Input
              label="Đơn vị thể tích mặc định"
              value={configs.volumeUnit}
              onChange={handleChange("volumeUnit")}
            />
            <Input
              label="Đơn vị đếm mặc định"
              value={configs.countUnit}
              onChange={handleChange("countUnit")}
            />
            <Input
              label="Thời gian cảnh báo hết hạn (ngày)"
              type="number"
              value={configs.expiryWarningDays}
              onChange={handleChange("expiryWarningDays")}
            />
            <Button icon={Save} onClick={() => handleSaveConfig("đơn vị tính")}>
              Lưu thay đổi
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Sửa độ ưu tiên" : "Thêm độ ưu tiên mới"}
        footer={
          <>
             <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
             <Button onClick={handleSavePriority}>Lưu cấu hình</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input
              label="Mã ưu tiên (Code)"
              value={form.priorityCode}
              disabled={!!editItem}
              onChange={(e) => setForm(f => ({...f, priorityCode: e.target.value}))}
              placeholder="Ví dụ: HIGH, NORMAL..."
            />
            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              placeholder="Mô tả cho mức độ này"
            />
            <div className="grid grid--2">
               <Input
                 label="Số ngày tối thiểu"
                 type="number"
                 value={form.minDays}
                 onChange={(e) => setForm(f => ({...f, minDays: parseInt(e.target.value)}))}
               />
               <Input
                 label="Số ngày tối đa"
                 type="number"
                 value={form.maxDays}
                 onChange={(e) => setForm(f => ({...f, maxDays: parseInt(e.target.value)}))}
               />
            </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
