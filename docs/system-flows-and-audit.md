# CKitchen FStore — System Flows & DB Audit

---

## 1. Main Flow

```
Store Staff         Supply Coordinator       Kitchen Staff            Shipper              Store Staff
    │                      │                      │                      │                      │
    ├─ Tạo đơn hàng ──────→│                      │                      │                      │
    │  [pending]            │                      │                      │                      │
    │                       ├─ Xác nhận đơn ──────→│                      │                      │
    │                       │  [confirmed]          │                      │                      │
    │                       │                       ├─ Lên kế hoạch SX     │                      │
    │                       │                       ├─ Sản xuất            │                      │
    │                       │                       │  [producing]         │                      │
    │                       │                       ├─ Hoàn thành          │                      │
    │                       │                       │  [ready]             │                      │
    │                       ├─ Gán shipper ────────────────────────────────→│                      │
    │                       │  [shipping]           │                      │                      │
    │                       │                       │                      ├─ Lấy hàng             │
    │                       │                       │                      ├─ Giao hàng ──────────→│
    │                       │                       │                      │                      ├─ Nhận & xác nhận
    │                       │                       │                      │                      │  [delivered]
```

**Order status:** `pending → confirmed → producing → ready → shipping → delivered`

**Delivery status:** `assigned → picked_up → in_transit → delivered`

**Batch status:** `planned → in_progress → completed`

---

## 2. Alternative Flows

**ALT 1 — Hủy đơn:** Store/Supply hủy khi `pending` hoặc `confirmed` → status = `cancelled`

**ALT 2 — Thiếu NL:** Kho không đủ nguyên liệu → tạo issue `shortage` → chờ bổ sung → tiếp tục SX

**ALT 3 — Giao thất bại:** Shipper báo failed → tạo issue `late_delivery` → gán shipper mới → giao lại

**ALT 4 — Hàng hỏng:** Store kiểm tra thấy hỏng/sai nhiệt độ → tạo issue `quality`/`damaged` → bếp SX bù

**ALT 5 — Tồn kho thấp:** `store_inventory.quantity < min_stock` → cảnh báo → Store tạo đơn mới

**ALT 6 — NL sắp hết hạn:** Hệ thống quét `expiry_date` hàng ngày → ưu tiên dùng trước → nếu quá hạn tạo issue

---

## 3. UI vs DB Gaps

### DB tables chưa có UI

| Table | Vấn đề |
|---|---|
| `shippers` | Chưa có trang quản lý, chưa có mock data |
| `deliveries` | Chưa có UI. DeliverySchedule chỉ đổi order.status trực tiếp |

### UI features chưa có DB

| Feature | Vấn đề |
|---|---|
| Issue responses (thread trả lời) | Cần thêm bảng `issue_responses` |
| SystemConfig (cài đặt hệ thống) | Cần thêm bảng `system_config` |
| ReceiveGoods rating (đánh giá sao) | Cần thêm cột rating vào `deliveries` hoặc bảng mới |
| Recipe CRUD | Hiện chỉ xem, chưa thêm/sửa/xóa được |

### Field mismatches

| UI field | DB field | Fix |
|---|---|---|
| `users.store` | `users.store_id` | Đổi tên mock |
| `audit_logs.user` | `audit_logs.user_name` | Đổi tên mock |
| `issues.type = 'defective'` | `issues.type = 'damaged'` | Thống nhất enum |
| `batches.kitchen_id` | Required NOT NULL | Thêm vào mock data |
| `stores.status = 'closed'` | Có trong DB | Thêm vào UI dropdown |
