import { useState } from "react";
import { User, Mail, Shield, Phone, MapPin, Camera, Save } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { Card, Input, Button, Badge } from "../../components/ui";
import { useAuth, ROLE_INFO } from "../../contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "0901234567", // Mock data
    address: "123 Đường ABC, Quận 1, TP.HCM", // Mock data
  });
  
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success("Cập nhật thông tin cá nhân thành công!");
      setSaving(false);
    }, 1000);
  };

  const roleInfo = ROLE_INFO[user?.role] || {};

  return (
    <PageWrapper title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản của bạn">
      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Left Column: Avatar & Role */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 20px" }}>
              <div style={{ 
                width: "100%", 
                height: "100%", 
                borderRadius: "50%", 
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 700,
                color: "white"
              }}>
                {user?.name?.charAt(0) || "U"}
              </div>
              <button style={{ 
                position: "absolute", 
                bottom: "0", 
                right: "0", 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                background: "white", 
                border: "1px solid var(--surface-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer"
              }}>
                <Camera size={18} color="var(--primary)" />
              </button>
            </div>
            
            <h3 style={{ marginBottom: "8px" }}>{user?.name}</h3>
            <Badge variant={roleInfo.color || "neutral"}>{roleInfo.label}</Badge>
            
            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--surface-border)", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  <Mail size={16} /> <span>{user?.email}</span>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  <Shield size={16} /> <span>Quyền hạn: {user?.role}</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <Card style={{ padding: "32px" }}>
          <h4 style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={20} color="var(--primary)" /> Thông tin chi tiết
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Input 
                label="Họ và tên" 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
              />
              <Input 
                label="Email" 
                value={form.email} 
                disabled 
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Input 
                label="Số điện thoại" 
                icon={Phone}
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})} 
              />
              <Input 
                label="Địa chỉ" 
                icon={MapPin}
                value={form.address} 
                onChange={(e) => setForm({...form, address: e.target.value})} 
              />
            </div>

            <div style={{ marginTop: "12px", paddingTop: "24px", borderTop: "1px solid var(--surface-border)", display: "flex", justifyContent: "flex-end" }}>
              <Button icon={Save} onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
