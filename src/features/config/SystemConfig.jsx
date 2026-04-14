import { Save } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Button } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

export default function SystemConfig() {
  const { user } = useAuth();
  const { systemConfig: configs, updateConfig, addAuditLog } = useData();

  const handleChange = (key) => (e) => {
    updateConfig({ [key]: e.target.value });
  };

  const handleSave = (section) => {
    addAuditLog(
      "config_updated",
      user.name,
      `Cập nhật cài đặt ${section}`,
      "config",
    );
    toast.success(`Đã lưu cài đặt ${section} thành công!`);
  };

  return (
    <PageWrapper
      title="Cấu hình hệ thống"
      subtitle="Thiết lập đơn vị tính, quy trình và tham số vận hành"
    >
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
            <Button icon={Save} onClick={() => handleSave("chung")}>
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
            <Button icon={Save} onClick={() => handleSave("đơn vị tính")}>
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
            Thông báo
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Select
              label="Gửi cảnh báo tồn kho thấp"
              options={[
                { value: "yes", label: "Có" },
                { value: "no", label: "Không" },
              ]}
              value={configs.lowStockAlert}
              onChange={handleChange("lowStockAlert")}
            />
            <Select
              label="Gửi thông báo đơn mới"
              options={[
                { value: "yes", label: "Có" },
                { value: "no", label: "Không" },
              ]}
              value={configs.newOrderAlert}
              onChange={handleChange("newOrderAlert")}
            />
            <Select
              label="Phương thức thông báo"
              options={[
                { value: "in-app", label: "Trong ứng dụng" },
                { value: "email", label: "Email" },
                { value: "both", label: "Cả hai" },
              ]}
              value={configs.notifMethod}
              onChange={handleChange("notifMethod")}
            />
            <Button icon={Save} onClick={() => handleSave("thông báo")}>
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
            Vận hành
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Input
              label="Thời gian xử lý đơn tối đa (giờ)"
              type="number"
              value={configs.maxProcessingHours}
              onChange={handleChange("maxProcessingHours")}
            />
            <Input
              label="Số lần giao lại tối đa"
              type="number"
              value={configs.maxRetries}
              onChange={handleChange("maxRetries")}
            />
            <Select
              label="Tự động xác nhận đơn"
              options={[
                { value: "no", label: "Không" },
                { value: "yes", label: "Có" },
              ]}
              value={configs.autoConfirm}
              onChange={handleChange("autoConfirm")}
            />
            <Button icon={Save} onClick={() => handleSave("vận hành")}>
              Lưu thay đổi
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
