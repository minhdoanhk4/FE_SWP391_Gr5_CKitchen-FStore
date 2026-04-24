import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  User as UserIcon,
  LogOut,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import {
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Select,
} from "../../components/ui";
import { useAuth, ROLE_INFO } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
    if (!editUser && !form.password?.trim())
      errs.password = "Vui lòng nhập mật khẩu";
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
      toast.success("Đã xóa người dùng");
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error("Không thể xóa người dùng");
    }
  };

  const handleForceLogout = async (row) => {
    const id = row.userId || row.id;
    const currentId = currentUser?.id || currentUser?.userId;
    if (id === currentId) {
      toast.error("Không thể ép đăng xuất tài khoản của chính bạn!");
      return;
    }
    try {
      await adminService.session.forceLogout(id);
      toast.success(`Đã đăng xuất toàn bộ phiên của ${row.fullName}`);
    } catch {
      toast.error("Không thể ép đăng xuất người dùng này");
    }
  };

  const handleViewDetails = async (row) => {
    const id = row.userId || row.id;
    setViewUser(row);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const fresh = await adminService.users.getById(id);
      setViewUser(fresh);
    } catch {
      toast.error("Không thể tải chi tiết người dùng");
    } finally {
      setDetailLoading(false);
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
      header: "Thao tác",
      width: "110px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Eye}
            title="Xem chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
          />
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
            icon={LogOut}
            title="Ép đăng xuất"
            onClick={(e) => {
              e.stopPropagation();
              handleForceLogout(row);
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
        onRowClick={handleViewDetails}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          editUser
            ? `Sửa thông tin: ${editUser.fullName}`
            : "Thêm người dùng mới"
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
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              placeholder="admin_01"
              error={errors.username}
            />
            {!editUser && (
              <Input
                label="Mật khẩu"
                required
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                error={errors.password}
              />
            )}
            {editUser && (
              <Input
                label="Mật khẩu mới"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
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
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
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
          <strong>{confirmDelete?.fullName}</strong>? Hành động này không thể
          hoàn tác.
        </p>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setViewUser(null);
        }}
        title="Chi tiết người dùng"
        size="lg"
      >
        {detailLoading && (
          <p style={{ color: "var(--text-muted)", paddingBottom: "16px" }}>
            Đang tải...
          </p>
        )}
        {viewUser && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Header: avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                  flexShrink: 0,
                }}
              >
                <UserIcon size={28} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>
                  {viewUser.fullName}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  @{viewUser.username}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {[
                ["Email", viewUser.email],
                [
                  "Mã người dùng",
                  <span className="font-mono" style={{ fontSize: "12px" }}>
                    {viewUser.userId || viewUser.id}
                  </span>,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontWeight: 500 }}>{value}</div>
                </div>
              ))}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Vai trò
                </div>
                <Badge variant={ROLE_INFO[viewUser.role]?.color || "neutral"}>
                  {ROLE_INFO[viewUser.role]?.label || viewUser.role}
                </Badge>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Trạng thái
                </div>
                <Badge
                  variant={viewUser.status === "ACTIVE" ? "success" : "danger"}
                  dot
                >
                  {viewUser.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
                </Badge>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Xác thực
                </div>
                <Badge variant={viewUser.verify ? "success" : "warning"} dot>
                  {viewUser.verify ? "Đã xác thực" : "Chưa xác thực"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
