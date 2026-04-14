import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động" },
  { value: "maintenance", label: "Bảo trì" },
];

export default function StoreManagement() {
  const { user } = useAuth();
  const {
    stores: storeList,
    kitchens: kitchenList,
    formatDate,
    addStore,
    updateStore,
    deleteStore,
    addAuditLog,
  } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    manager: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});

  const handleOpenNew = () => {
    setEditItem(null);
    setForm({
      name: "",
      address: "",
      phone: "",
      manager: "",
      status: "active",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (store) => {
    setEditItem(store);
    setForm({
      name: store.name,
      address: store.address,
      phone: store.phone,
      manager: store.manager,
      status: store.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập tên cửa hàng";
    if (!form.address.trim()) errs.address = "Vui lòng nhập địa chỉ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editItem) {
      updateStore(editItem.id, form);
      addAuditLog("store_updated", user.name, `Cập nhật CH ${form.name}`, "stores");
      toast.success(`Đã cập nhật cửa hàng ${form.name}`);
    } else {
      const maxNum = storeList.reduce((max, s) => {
        const num = parseInt(s.id.replace("CH", ""));
        return num > max ? num : max;
      }, 0);
      addStore({
        id: `CH${String(maxNum + 1).padStart(3, "0")}`,
        ...form,
        openDate: new Date().toISOString().split("T")[0],
      });
      addAuditLog("store_created", user.name, `Tạo CH ${form.name}`, "stores");
      toast.success(`Đã thêm cửa hàng ${form.name}`);
    }
    setShowModal(false);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteStore(confirmDelete.id);
    addAuditLog("store_deleted", user.name, `Xóa CH ${confirmDelete.name}`, "stores");
    toast.success("Đã xóa cửa hàng");
    setConfirmDelete(null);
  };

  const storeColumns = [
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
        <Badge variant={r.status === "active" ? "success" : "warning"} dot>
          {r.status === "active" ? "Hoạt động" : "Bảo trì"}
        </Badge>
      ),
    },
    {
      header: "Ngày mở",
      accessor: "openDate",
      render: (r) => formatDate(r.openDate),
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
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(row);
            }}
          />
        </div>
      ),
    },
  ];

  const kitchenColumns = [
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
        <Badge variant={r.status === "active" ? "success" : "warning"} dot>
          {r.status === "active" ? "Hoạt động" : "Không hoạt động"}
        </Badge>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Quản lý cửa hàng & bếp"
      subtitle="Danh mục cửa hàng franchise và bếp trung tâm"
      actions={
        <Button icon={Plus} onClick={handleOpenNew}>
          Thêm cửa hàng
        </Button>
      }
    >
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
          }}
        >
          🏪 Cửa hàng Franchise ({storeList.length})
        </h3>
        <DataTable
          columns={storeColumns}
          data={storeList}
          searchPlaceholder="Tìm cửa hàng..."
        />
      </div>

      <div>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
          }}
        >
          🍳 Bếp Trung Tâm ({kitchenList.length})
        </h3>
        <DataTable
          columns={kitchenColumns}
          data={kitchenList}
          searchable={false}
        />
      </div>

      {/* Add/Edit Store Modal */}
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
              {editItem ? "Lưu thay đổi" : "Tạo cửa hàng"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Tên cửa hàng"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="CKitchen Quận..."
            error={errors.name}
          />
          <Input
            label="Địa chỉ"
            required
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
            error={errors.address}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="028 3812 xxxx"
            />
            <Input
              label="Quản lý"
              value={form.manager}
              onChange={(e) =>
                setForm((f) => ({ ...f, manager: e.target.value }))
              }
              placeholder="Tên quản lý"
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
              Xóa cửa hàng
            </Button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa cửa hàng{" "}
          <strong>{confirmDelete?.name}</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </PageWrapper>
  );
}
