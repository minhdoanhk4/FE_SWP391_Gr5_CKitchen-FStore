import { useState, useEffect } from "react";
import { Plus, Edit } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import {
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Card,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Vô hiệu/Bảo trì" },
];

export default function StoreManagement() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    address: "",
    phone: "",
    manager: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storesData, usersData] = await Promise.all([
        adminService.catalog.getStores(),
        adminService.users.getAll({ roleName: "MANAGER" }),
      ]);
      setStores(storesData.content || []);
      // Map users to select options
      const managerList = (usersData.content || []).map((u) => ({
        value: u.username,
        label: `${u.fullName} (${u.username})`,
      }));
      setManagers(managerList);
    } catch (err) {
      toast.error("Không thể tải dữ liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    // Auto-generate ID: ST + (max_number + 1)
    const maxNum = stores.reduce((max, s) => {
      const num = parseInt(s.id?.replace("ST", "") || "0");
      return !isNaN(num) ? Math.max(max, num) : max;
    }, 0);
    const nextId = `ST${String(maxNum + 1).padStart(3, "0")}`;

    setForm({
      id: nextId,
      name: "",
      address: "",
      phone: "",
      manager: "",
      status: "ACTIVE",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleViewDetails = async (item) => {
    setViewItem(item); // show modal immediately with row data
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const fresh = await adminService.catalog.getStoreById(item.id);
      setViewItem(fresh);
    } catch {
      toast.error("Không thể tải chi tiết cửa hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      id: item.id,
      name: item.name,
      address: item.address,
      phone: item.phone,
      manager: item.manager,
      status: item.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.id?.trim() && !editItem) errs.id = "Vui lòng nhập mã định danh";
    if (!form.name?.trim()) errs.name = "Vui lòng nhập tên cửa hàng";
    if (!form.address?.trim()) errs.address = "Vui lòng nhập địa chỉ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editItem) {
        await adminService.catalog.updateStore(editItem.id, form);
        toast.success("Cập nhật cửa hàng thành công");
      } else {
        await adminService.catalog.createStore({
          ...form,
          openDate: new Date().toISOString().split("T")[0],
        });
        toast.success("Thêm cửa hàng thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      header: "Mã",
      accessor: "id",
      width: "80px",
      render: (r) => <span className="font-mono">{r.id}</span>,
    },
    { header: "Tên cửa hàng", accessor: "name", sortable: true },
    { header: "Địa chỉ", accessor: "address" },
    { header: "Quản lý", accessor: "manager" },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "warning"} dot>
          {r.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
        </Badge>
      ),
    },
    {
      header: "Thao tác",
      width: "80px",
      render: (row) => (
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
      ),
    },
  ];

  return (
    <PageWrapper
      title="Quản lý Cửa hàng Franchise"
      subtitle="Danh mục các điểm bán hàng trong hệ thống (Click hàng để xem chi tiết)"
      actions={
        <Button icon={Plus} onClick={handleOpenAdd}>
          Thêm cửa hàng
        </Button>
      }
    >
      <Card>
        <DataTable
          columns={columns}
          data={stores}
          loading={loading}
          searchPlaceholder="Tìm cửa hàng..."
          onRowClick={handleViewDetails}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? `Sửa: ${editItem.name}` : "Thêm cửa hàng mới"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editItem ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Identifier is now auto-generated and read-only */}
          <Input
            label="Mã định danh (Tự động)"
            value={form.id}
            disabled
            placeholder="Sẽ được tự động tạo..."
          />
          <Input
            label="Tên cửa hàng"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="CKitchen..."
            error={errors.name}
          />
          <Input
            label="Địa chỉ"
            required
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="Địa chỉ chi tiết..."
            error={errors.address}
          />

          <div className="grid grid--2">
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <Select
              label="Quản lý cửa hàng"
              options={managers}
              value={form.manager}
              onChange={(e) =>
                setForm((f) => ({ ...f, manager: e.target.value }))
              }
              placeholder="Chọn quản lý..."
            />
          </div>

          <Select
            label="Trạng thái"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setViewItem(null);
        }}
        title={`Chi tiết cửa hàng: ${viewItem?.name}`}
        size="lg"
      >
        {detailLoading && (
          <p style={{ color: "var(--text-muted)", padding: "8px 0 16px" }}>
            Đang tải dữ liệu mới nhất...
          </p>
        )}
        {viewItem && (
          <div style={{ display: "grid", gap: "24px" }}>
            <div className="grid grid--2">
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Mã cửa hàng
                </label>
                <p style={{ fontWeight: 600 }}>{viewItem.id}</p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Trạng thái
                </label>
                <p>
                  <Badge
                    variant={
                      viewItem.status === "ACTIVE" ? "success" : "warning"
                    }
                  >
                    {viewItem.status}
                  </Badge>
                </p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Địa chỉ
                </label>
                <p>{viewItem.address}</p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Liên hệ
                </label>
                <p>{viewItem.phone || "N/A"}</p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Quản lý
                </label>
                <p>{viewItem.manager || "Chưa có"}</p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--surface-border)",
                paddingTop: "16px",
              }}
            >
              <h4 style={{ marginBottom: "12px" }}>
                Lịch sử hoạt động & Đơn hàng
              </h4>
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  background: "var(--surface-sub)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p style={{ color: "var(--text-muted)" }}>
                  Tính năng xem lịch sử đơn hàng chi tiết đang được đồng bộ từ
                  Backend...
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
