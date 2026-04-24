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

export default function KitchenManagement() {
  const { user } = useAuth();
  const [kitchens, setKitchens] = useState([]);
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
    status: "ACTIVE",
    capacity: 500,
  });
  const [errors, setErrors] = useState({});

  const fetchKitchens = async () => {
    setLoading(true);
    try {
      const data = await adminService.catalog.getKitchens();
      setKitchens(data.content || []);
    } catch (err) {
      toast.error("Không thể tải danh sách bếp");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchens();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    // Auto-generate ID: KT + (max_number + 1)
    const maxNum = kitchens.reduce((max, k) => {
      const num = parseInt(k.id?.replace("KT", "") || "0");
      return !isNaN(num) ? Math.max(max, num) : max;
    }, 0);
    const nextId = `KT${String(maxNum + 1).padStart(3, "0")}`;

    setForm({
      id: nextId,
      name: "",
      address: "",
      phone: "",
      status: "ACTIVE",
      capacity: 500,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      id: item.id,
      name: item.name,
      address: item.address,
      phone: item.phone,
      status: item.status,
      capacity: item.capacity || 0,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleViewDetails = async (item) => {
    setViewItem(item); // show modal immediately with row data
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const fresh = await adminService.catalog.getKitchenById(item.id);
      setViewItem(fresh);
    } catch {
      toast.error("Không thể tải chi tiết bếp");
    } finally {
      setDetailLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Vui lòng nhập tên bếp";
    if (!form.address?.trim()) errs.address = "Vui lòng nhập địa chỉ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editItem) {
        await adminService.catalog.updateKitchen(editItem.id, form);
        toast.success("Cập nhật bếp thành công");
      } else {
        await adminService.catalog.createKitchen(form);
        toast.success("Thêm bếp thành công");
      }
      setShowModal(false);
      fetchKitchens();
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
    { header: "Tên bếp", accessor: "name", sortable: true },
    { header: "Địa chỉ", accessor: "address" },
    {
      header: "Công suất",
      accessor: "capacity",
      render: (r) => `${r.capacity} phần/ngày`,
    },
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
      title="Quản lý Bếp Trung Tâm"
      subtitle="Hệ thống cơ sở sản xuất tập trung (Click hàng để xem chi tiết)"
      actions={
        <Button icon={Plus} onClick={handleOpenAdd}>
          Thêm bếp mới
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={kitchens}
        loading={loading}
        searchPlaceholder="Tìm kiếm bếp..."
        onRowClick={handleViewDetails}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? `Sửa: ${editItem.name}` : "Thêm bếp mới"}
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
          <Input
            label="Mã bếp (Tự động)"
            value={form.id}
            disabled
            placeholder="Sẽ được tự động tạo..."
          />
          <Input
            label="Tên bếp"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Bếp CKitchen..."
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
            <Input
              label="Công suất (phần/ngày)"
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: parseInt(e.target.value) }))
              }
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
        title={`Chi tiết bếp: ${viewItem?.name}`}
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
                  Mã bếp
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
                  Công suất
                </label>
                <p>{viewItem.capacity} phần/ngày</p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Liên hệ
                </label>
                <p>{viewItem.phone || "N/A"}</p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--surface-border)",
                paddingTop: "16px",
              }}
            >
              <h4 style={{ marginBottom: "12px" }}>
                Kế hoạch sản xuất & Lịch sử
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
                  Dữ liệu hoạt động chi tiết của bếp đang được đồng bộ từ
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
