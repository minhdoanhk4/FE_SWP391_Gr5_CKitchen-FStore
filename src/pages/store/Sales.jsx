import { useState, useEffect, useRef } from "react";
import { Download, Upload, Eye, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import PageWrapper from "../../components/layout/PageWrapper/PageWrapper";
import { DataTable, Badge, Button, Modal, Card } from "../../components/ui";
import { Input } from "../../components/ui";
import { useData } from "../../contexts/DataContext";
import storeService from "../../services/storeService";

export default function StoreSales() {
  const { formatCurrency, formatDate } = useData();
  const fileInputRef = useRef(null);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDate, setImportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Detail modal
  const [detailDate, setDetailDate] = useState(null);
  const [detail, setDetail] = useState([]);
  const [detailSummary, setDetailSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const resp = await storeService.getSalesDaily({ size: 100 });
      const rows = resp?.content ?? resp ?? [];
      setSales(rows);
      const total = rows.reduce((s, r) => s + (r.totalRevenue ?? 0), 0);
      setTotalRevenue(total);
    } catch {
      toast.error("Không thể tải dữ liệu bán hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // ── Template download ────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const blob = await storeService.downloadSalesTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales_report_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải mẫu báo cáo");
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setImportFile(file);
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!importFile) {
      toast.error("Vui lòng chọn file Excel");
      return;
    }
    if (!importDate) {
      toast.error("Vui lòng chọn ngày báo cáo");
      return;
    }
    setImporting(true);
    try {
      await storeService.importSales(importFile, importDate);
      toast.success("Import báo cáo bán hàng thành công");
      setShowImportModal(false);
      setImportFile(null);
      fetchSales();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Import thất bại";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────
  const handleViewDetail = async (date) => {
    setDetailDate(date);
    setDetail([]);
    setDetailSummary(null);
    setDetailLoading(true);
    try {
      const resp = await storeService.getSalesDailyDetail(date, { size: 100 });
      setDetailSummary(resp);
      setDetail(resp?.items ?? []);
    } catch {
      toast.error("Không thể tải chi tiết");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await storeService.clearSales(confirmDelete);
      toast.success(`Đã xóa báo cáo ngày ${confirmDelete}`);
      setConfirmDelete(null);
      fetchSales();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Không thể xóa báo cáo";
      toast.error(msg);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const todayRow = sales.find((s) => s.reportDate === today);
  const todayRevenue = todayRow?.totalRevenue ?? 0;

  const columns = [
    {
      header: "Ngày",
      accessor: "reportDate",
      sortable: true,
      render: (r) => (
        <span className="font-mono">{formatDate(r.reportDate)}</span>
      ),
    },
    {
      header: "Doanh thu",
      accessor: "totalRevenue",
      sortable: true,
      render: (r) => (
        <span
          className="font-mono"
          style={{ fontWeight: 600, color: "var(--success)" }}
        >
          {formatCurrency(r.totalRevenue ?? 0)}
        </span>
      ),
    },
    {
      header: "Số lượng SP",
      accessor: "itemCount",
      render: (r) => <Badge variant="neutral">{r.itemCount ?? "—"}</Badge>,
    },
    {
      header: "",
      width: "100px",
      render: (row) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Eye}
            title="Chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(row.reportDate);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Trash2}
            title="Xóa báo cáo"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(row.reportDate);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Báo cáo bán hàng"
      subtitle="Nhập và theo dõi doanh thu bán hàng hàng ngày"
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <Button variant="secondary" icon={RefreshCw} onClick={fetchSales}>
            Làm mới
          </Button>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleDownloadTemplate}
          >
            Tải mẫu Excel
          </Button>
          <Button icon={Upload} onClick={() => setShowImportModal(true)}>
            Nhập báo cáo
          </Button>
        </>
      }
    >
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Doanh thu hôm nay
          </span>
          <p
            className="font-mono"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--success)",
            }}
          >
            {formatCurrency(todayRevenue)}
          </p>
        </Card>
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Tổng doanh thu
          </span>
          <p
            className="font-mono"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--primary)",
            }}
          >
            {formatCurrency(totalRevenue)}
          </p>
        </Card>
        <Card>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Số ngày có báo cáo
          </span>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>{sales.length}</p>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        searchPlaceholder="Tìm theo ngày..."
        emptyTitle="Chưa có báo cáo bán hàng"
        emptyDesc="Tải mẫu Excel, điền dữ liệu và nhập báo cáo hàng ngày."
      />

      {/* Import modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        title="Nhập báo cáo bán hàng"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleImportConfirm} disabled={importing}>
              {importing ? "Đang nhập..." : "Xác nhận nhập"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Ngày báo cáo"
            type="date"
            required
            value={importDate}
            onChange={(e) => setImportDate(e.target.value)}
          />
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "var(--text-secondary)",
              }}
            >
              File Excel (.xlsx)
            </p>
            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%" }}
            >
              {importFile ? importFile.name : "Chọn file Excel..."}
            </Button>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              Sử dụng mẫu tải về từ nút "Tải mẫu Excel" ở trên.
            </p>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        isOpen={!!detailDate}
        onClose={() => {
          setDetailDate(null);
          setDetail([]);
          setDetailSummary(null);
        }}
        title={`Chi tiết bán hàng — ${detailDate ? formatDate(detailDate) : ""}`}
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setDetailDate(null);
              setDetail([]);
              setDetailSummary(null);
            }}
          >
            Đóng
          </Button>
        }
      >
        {detailLoading ? (
          <p
            style={{
              textAlign: "center",
              padding: "32px",
              color: "var(--text-muted)",
            }}
          >
            Đang tải...
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {detailSummary && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 24px",
                  padding: "12px 16px",
                  background: "var(--surface-hover)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Cửa hàng: </span>
                  {detailSummary.storeName}
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>
                    Mã báo cáo:{" "}
                  </span>
                  <span className="font-mono">{detailSummary.reportId}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>
                    Doanh thu:{" "}
                  </span>
                  <strong style={{ color: "var(--success)" }}>
                    {formatCurrency(detailSummary.totalRevenue ?? 0)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>
                    Ghi nhận bởi:{" "}
                  </span>
                  {detailSummary.recordedBy}
                </div>
              </div>
            )}
            {detail.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "24px",
                  color: "var(--text-muted)",
                }}
              >
                Không có dữ liệu chi tiết sản phẩm
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: "var(--surface-hover)" }}>
                    {["Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {detail.map((item, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid var(--surface-border)" }}
                    >
                      <td style={{ padding: "8px 12px" }}>
                        {item.productName}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: "8px 12px" }} className="font-mono">
                        {formatCurrency(item.unitPrice ?? 0)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          color: "var(--success)",
                        }}
                        className="font-mono"
                      >
                        {formatCurrency(
                          item.lineTotal ??
                            (item.quantity ?? 0) * (item.unitPrice ?? 0),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xác nhận xóa báo cáo"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa báo cáo
            </Button>
          </>
        }
      >
        <p style={{ fontSize: "14px" }}>
          Bạn có chắc muốn xóa báo cáo ngày{" "}
          <strong>{confirmDelete ? formatDate(confirmDelete) : ""}</strong>?
          <br />
          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Tồn kho sẽ được khôi phục tương ứng.
          </span>
        </p>
      </Modal>
    </PageWrapper>
  );
}
