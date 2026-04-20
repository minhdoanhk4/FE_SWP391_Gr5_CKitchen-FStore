import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Input, Select } from "../../components/ui";
import { useAuth, ROLES, ROLE_INFO } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import adminService from "../../services/adminService";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { stores, formatDateTime, addAuditLog } = useData();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    roleName: "",
    status: "ACTIVE",
    verify: true,
  });
  const [errors, setErrors] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.users.getAll();
      setUsers(data.content || []);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const ROLE_OPTIONS = Object.entries(ROLE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const STORE_OPTIONS = stores.map((s) => ({ value: s.id, label: s.name }));
  const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "DISABLED", label: "Vô hiệu" },
  ];

  const handleOpenNew = () => {
    setEditUser(null);
    setForm({
      username: "",
      password: "",
      fullName: "",
      email: "",
      roleName: "",
      status: "ACTIVE",
      verify: true,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleName: user.role,
      password: "", // Luôn reset password khi edit
      status: user.status,
      verify: true,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.username?.trim()) errs.username = "Vui lòng nhập tên đăng nhập";
    if (!editUser && !form.password?.trim()) errs.password = "Vui lòng nhập mật khẩu";
    if (!form.fullName?.trim()) errs.fullName = "Vui lòng nhập họ và tên";
    if (!form.email?.trim()) errs.email = "Vui lòng nhập email";
    if (!form.roleName) errs.roleName = "Vui lòng chọn vai trò";
    
    setErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const id = editUser?.userId || editUser?.id;
      const currentId = currentUser?.id || currentUser?.userId;

      if (editUser && id) {
        // Clean payload for update
        const updatePayload = {
          fullName: form.fullName,
          email: form.email,
          roleName: form.roleName,
          status: form.status,
          verify: form.verify,
        };
        // Only send password if it was entered
        if (form.password) {
          updatePayload.password = form.password;
        }

        await adminService.users.update(id, updatePayload);
        addAuditLog("user_updated", currentUser.name, `Cập nhật TK ${form.username}`, "users");
        toast.success(`Đã cập nhật thông tin người dùng ${form.fullName}`);
      } else {
        // Clean payload for creation
        const createPayload = {
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          roleName: form.roleName,
          status: form.status,
          verify: form.verify,
        };
        
        await adminService.users.create(createPayload);
        addAuditLog("user_created", currentUser.name, `Tạo TK ${form.username}`, "users");
        toast.success(`Đã tạo người dùng ${form.fullName}`);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        // Show specific validation errors from the backend map
        const detailMsgs = Object.entries(responseData.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("\n");
        toast.error(`Lỗi xác thực:\n${detailMsgs}`);
      } else {
        const msg = responseData?.message || "Có lỗi xảy ra khi lưu";
        toast.error(msg);
      }
      console.error("Save error details:", responseData || err.message);
    }
  };

  const handleDelete = (userToDelete) => {
    const id = userToDelete.userId || userToDelete.id;
    const currentId = currentUser?.id || currentUser?.userId;
    
    if (id === currentId) {
      toast.error("Không thể xóa tài khoản của chính bạn!");
      return;
    }
    setConfirmDelete(userToDelete);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete?.userId || confirmDelete?.id;
    try {
      await adminService.users.delete(id);
      addAuditLog("user_deleted", currentUser.name, `Xóa TK ${confirmDelete.username}`, "users");
      toast.success("Đã xóa người dùng");
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error("Không thể xóa người dùng");
    }
  };

  const columns = [
    {
      header: "Người dùng",
      accessor: "fullName",
      sortable: true,
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <UserIcon size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.fullName}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              @{r.username}
            </div>
          </div>
        </div>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      accessor: "role",
      sortable: true,
      render: (r) => (
        <Badge variant={ROLE_INFO[r.role]?.color || "neutral"}>
          {ROLE_INFO[r.role]?.label || r.role}
        </Badge>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "danger"} dot>
          {r.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
        </Badge>
      ),
    },
    {
      header: "",
      width: "80px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Edit}
            title="Sửa"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Trash2}
            title="Xóa"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Quản lý người dùng"
      subtitle="Quản lý tài khoản và phân quyền theo vai trò"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm người dùng
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Tìm theo tên, username, email..."
        toolbar={<Badge variant="primary">{users.length} người dùng</Badge>}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          editUser ? `Sửa thông tin: ${editUser.fullName}` : "Thêm người dùng mới"
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editUser ? "Lưu thay đổi" : "Tạo người dùng"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Tên đăng nhập"
              required
              disabled={!!editUser}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="admin_01"
              error={errors.username}
            />
            {!editUser && (
              <Input
                label="Mật khẩu"
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                error={errors.password}
              />
            )}
            {editUser && (
               <Input
               label="Mật khẩu mới"
               type="password"
               value={form.password}
               onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
               placeholder="Để trống nếu không đổi"
             />
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Nguyễn Văn A"
              error={errors.fullName}
            />
            <Input
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="email@ckitchen.vn"
              error={errors.email}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Select
              label="Vai trò"
              required
              options={ROLE_OPTIONS}
              value={form.roleName}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  roleName: e.target.value,
                }))
              }
              error={errors.roleName}
            />
            <Select
              label="Trạng thái"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xác nhận xóa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa người dùng
            </Button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa người dùng{" "}
          <strong>{confirmDelete?.fullName}</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </PageWrapper>
  );
}
