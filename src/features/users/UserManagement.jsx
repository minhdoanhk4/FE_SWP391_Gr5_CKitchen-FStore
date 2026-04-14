import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useAuth, ROLES, ROLE_INFO } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { users, stores, formatDateTime, addUser, updateUser, deleteUser, addAuditLog } =
    useData();

  const ROLE_OPTIONS = Object.values(ROLES).map((r) => ({
    value: r,
    label: ROLE_INFO[r].label,
  }));
  const STORE_OPTIONS = stores.map((s) => ({ value: s.id, label: s.name }));
  const STATUS_OPTIONS = [
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Vô hiệu" },
  ];

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    store: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});

  const handleOpenNew = () => {
    setEditUser(null);
    setForm({ name: "", email: "", role: "", store: "", status: "active" });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store || "",
      status: user.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email";
    if (!form.role) errs.role = "Vui lòng chọn vai trò";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editUser) {
      updateUser(editUser.id, form);
      addAuditLog("user_updated", currentUser.name, `Cập nhật TK ${form.name}`, "users");
      toast.success(`Đã cập nhật thông tin người dùng ${form.name}`);
    } else {
      const maxNum = users.reduce((max, u) => {
        const num = parseInt(u.id.replace("u", ""));
        return num > max ? num : max;
      }, 0);
      addUser({
        id: `u${maxNum + 1}`,
        ...form,
        lastLogin: new Date().toISOString(),
      });
      addAuditLog("user_created", currentUser.name, `Tạo TK ${form.name}`, "users");
      toast.success(`Đã tạo người dùng ${form.name}`);
    }
    setShowModal(false);
  };

  const handleDelete = (userToDelete) => {
    if (userToDelete.id === currentUser.id) {
      toast.error("Không thể xóa tài khoản của chính bạn!");
      return;
    }
    setConfirmDelete(userToDelete);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteUser(confirmDelete.id);
    addAuditLog("user_deleted", currentUser.name, `Xóa TK ${confirmDelete.name}`, "users");
    toast.success("Đã xóa người dùng");
    setConfirmDelete(null);
  };

  const columns = [
    { header: "Tên", accessor: "name", sortable: true },
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
      header: "Cửa hàng",
      accessor: "store",
      render: (r) => {
        if (!r.store) return "—";
        const s = stores.find((st) => st.id === r.store);
        return s ? s.name : r.store;
      },
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (r) => (
        <Badge variant={r.status === "active" ? "success" : "danger"} dot>
          {r.status === "active" ? "Hoạt động" : "Vô hiệu"}
        </Badge>
      ),
    },
    {
      header: "Đăng nhập cuối",
      accessor: "lastLogin",
      render: (r) => formatDateTime(r.lastLogin),
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
        searchPlaceholder="Tìm theo tên, email..."
        toolbar={<Badge variant="primary">{users.length} người dùng</Badge>}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          editUser ? `Sửa thông tin: ${editUser.name}` : "Thêm người dùng mới"
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
              label="Họ và tên"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A"
              error={errors.name}
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
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value,
                  store: e.target.value === "store_staff" ? f.store : "",
                }))
              }
              error={errors.role}
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
          {form.role === "store_staff" && (
            <Select
              label="Cửa hàng"
              options={STORE_OPTIONS}
              value={form.store}
              onChange={(e) =>
                setForm((f) => ({ ...f, store: e.target.value }))
              }
            />
          )}
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
          <strong>{confirmDelete?.name}</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </PageWrapper>
  );
}
