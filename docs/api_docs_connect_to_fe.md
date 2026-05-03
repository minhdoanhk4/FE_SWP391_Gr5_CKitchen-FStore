# PRODUCTION\_AND\_BATCH\_SYSTEM

**\# Production & Batch System \- Bakery Inventory Architecture**

Tài liệu này đặc tả kiến trúc hệ thống sản xuất và quản lý tồn kho theo lô (Batch) tại Bếp Trung Tâm (Central Kitchen), tập trung vào quy trình vận hành tiệm bánh.

**\#\# 1\) Quy tắc định danh và Phạm vi dữ liệu**  
Hệ thống hiện tại được tối ưu hóa cho ngành bánh:  
\- **\*\*ID Nguyên liệu\*\***: Luôn bắt đầu bằng tiền tố \`BAKE\` (ví dụ: \`BAKE001\` \- Bột mì).  
\- **\*\*ID Kế hoạch sản xuất\*\***: Bắt đầu bằng \`PLN\` kèm ngày tháng (ví dụ: \`PLN0423001\`).  
\- **\*\*ID Lô thành phẩm\*\***: Bắt đầu bằng \`PB\` (Product Batch).  
\- **\*\*ID Lô nguyên liệu\*\***: Bắt đầu bằng \`B-\` hoặc \`BOOST-\`.

\---

**\#\# 2\) Quy trình Sản xuất (Production Lifecycle)**

**\#\#\# 2.1) Lập kế hoạch (DRAFT)**  
\- **\*\*API\*\***: \`POST /api/central-kitchen/production-plans\`  
\- **\*\*Hành vi\*\***:  
    1\. Kiểm tra công thức (Recipe) của sản phẩm.  
    2\. Chạy thuật toán **\*\*FEFO (First-Expiry-First-Out)\*\*** ảo để kiểm tra tồn kho nguyên liệu.  
    3\. Nếu đủ nguyên liệu, tạo kế hoạch ở trạng thái \`DRAFT\`.  
    4\. **\*\*Lưu ý\*\***: Giai đoạn này chỉ là "giữ chỗ" (Reserve), chưa trừ tồn kho thật.

**\#\#\# 2.2) Kiểm tra nguyên liệu (Recipe Check)**  
\- **\*\*API\*\***: \`GET /api/central-kitchen/production-plans/recipe-check?productId=...\&quantity=...\`  
\- **\*\*Mục đích\*\***: Cho phép FE kiểm tra nhanh xem có đủ nguyên liệu để sản xuất mục tiêu hay không trước khi bấm tạo kế hoạch chính thức.

**\#\#\# 2.3) Bắt đầu sản xuất (IN\_PRODUCTION)**  
\- **\*\*API\*\***: \`PATCH /api/central-kitchen/production-plans/{planId}/start\`  
\- **\*\*Hành vi\*\***:  
    1\. Trừ trực tiếp \`remainingQuantity\` của các lô nguyên liệu (\`IngredientBatch\`) đã được FEFO chỉ định.  
    2\. Trừ \`totalQuantity\` trong kho tổng (\`KitchenInventory\`).  
    3\. Chuyển trạng thái sang \`IN\_PRODUCTION\`.  
\- **\*\*Thất bại\*\***: Nếu tại thời điểm bấm start, tồn kho thực tế bị thay đổi (do kế hoạch khác dùng trước), hệ thống sẽ báo lỗi và yêu cầu tạo lại kế hoạch.

**\#\#\# 2.4) Hoàn thành sản xuất (COMPLETED)**  
\- **\*\*API\*\***: \`PATCH /api/central-kitchen/production-plans/{planId}/complete\`  
\- **\*\*Hành vi\*\***:  
    1\. Yêu cầu nhập \`expiryDate\` cho thành phẩm.  
    2\. Chuyển trạng thái sang \`COMPLETED\`.  
    3\. Tự động sinh ra 1 **\*\*Lô thành phẩm (Product Batch)\*\*** mới với số lượng tương ứng.

**\#\#\# 2.5) Hủy kế hoạch (CANCELLED)**  
\- **\*\*API\*\***: \`PATCH /api/central-kitchen/production-plans/{planId}/cancel\`  
\- **\*\*Hành vi\*\***:  
    1\. Nếu kế hoạch đang \`IN\_PRODUCTION\`: Hệ thống tự động **\*\*Hoàn trả (Rollback)\*\*** số lượng nguyên liệu về đúng các lô ban đầu.  
    2\. Nếu đang \`DRAFT\`: Xóa các bản ghi dự kiến sử dụng (Reserve).

\---

**\#\# 3\) Quản lý Tồn kho & FEFO Tự động**

**\#\#\# 3.1) Cơ chế FEFO (First-Expiry-First-Out)**  
Hệ thống ưu tiên sử dụng các lô hàng có **\*\*ngày hết hạn (\`expiryDate\`) gần nhất\*\***. Cơ chế này áp dụng cho 2 công đoạn:  
1\. **\*\*Sản xuất\*\***: Chọn lô nguyên liệu để làm bánh.  
2\. **\*\*Xuất hàng cho Cửa hàng\*\***: Chọn lô thành phẩm để đóng gói đơn hàng.

**\#\#\# 3.2) Tự động trừ kho khi xử lý Đơn hàng (Order Sync)**  
Đây là điểm cực kỳ quan trọng trong kiến trúc mới:  
\- Khi Nhân viên bếp chuyển trạng thái đơn hàng sang **\*\*\`PACKED\_WAITING\_SHIPPER\`\*\***:  
    1\. Hệ thống tự động quét các lô thành phẩm (\`ProductBatch\`) đang có trong kho của bếp.  
    2\. Áp dụng FEFO để trừ số lượng sản phẩm tương ứng trong đơn hàng.  
    3\. Giảm \`remainingQuantity\` của lô và cập nhật trạng thái lô nếu hết hàng (\`DEPLETED\`).  
\- **\*\*Lợi ích\*\***: Đảm bảo số liệu tồn kho thành phẩm luôn khớp với thực tế vận hành mà không cần thao tác thủ công.

\---

**\#\# 4\) Danh sách API Quan trọng**

**\#\#\# 4.1 Quản lý Nguyên liệu & Kho**  
\- \`GET /api/central-kitchen/inventory\`: Xem tồn kho tổng hợp (Hỗ trợ lọc \`lowStock=true\`).  
\- \`GET /api/central-kitchen/ingredient-batches\`: Danh sách chi tiết từng lô nguyên liệu đang có.  
\- \`POST /api/central-kitchen/ingredient-batches\`: Nhập lô nguyên liệu mới vào kho.

**\#\#\# 4.2 Lập kế hoạch & Sản xuất**  
\- \`GET /api/central-kitchen/production-plans\`: Danh sách kế hoạch (Hỗ trợ phân trang).  
\- \`POST /api/central-kitchen/production-plans\`: Tạo kế hoạch mới (Status \`DRAFT\`).  
\- \`PATCH /api/central-kitchen/production-plans/{id}/start\`: Bắt đầu (Trừ kho nguyên liệu).  
\- \`PATCH /api/central-kitchen/production-plans/{id}/complete\`: Hoàn tất (Tạo lô thành phẩm).

**\#\#\# 4.3 Quản lý Lô thành phẩm**  
\- \`GET /api/central-kitchen/product-batches\`: Danh sách các lô bánh đã sản xuất thành công.  
\- \`GET /api/central-kitchen/product-batches/{id}\`: Xem chi tiết lô (bao gồm cả truy vết nguyên liệu \- Traceability).

\---

**\#\# 5\) Sơ đồ Chuyển trạng thái (State Machine)**

\`\`\`mermaid  
stateDiagram-v2  
    \[\*\] \--\> DRAFT: Create Plan  
    DRAFT \--\> IN\_PRODUCTION: Start (Deduct Inventory)  
    DRAFT \--\> CANCELLED: Cancel  
    IN\_PRODUCTION \--\> COMPLETED: Complete (Create Product Batch)  
    IN\_PRODUCTION \--\> CANCELLED: Cancel (Rollback Inventory)  
    COMPLETED \--\> \[\*\]  
    CANCELLED \--\> \[\*\]  
\`\`\`

\---

**\#\# 6\) Ghi chú cho Frontend (FE Integration)**  
\- **\*\*Auth\*\***: Cần có quyền \`PRODUCTION\_PLAN\_UPDATE\` để gọi các lệnh \`start/complete/cancel\`.  
\- **\*\*Validation\*\***: Luôn kiểm tra \`sufficient\` trong response của detail plan để cảnh báo người dùng nếu thiếu hàng.  
\- **\*\*Traceability\*\***: Tại màn hình chi tiết lô thành phẩm, sử dụng mảng \`ingredientBatchUsages\` để hiển thị cho người dùng biết ổ bánh này được làm từ lô bột mì/trứng/bơ nào.

# kitchen-staff

**\# Central Kitchen Staff API Master Documentation (Full & 100% Accurate)**

Tài liệu này là bản đặc tả kỹ thuật đầy đủ và chính xác nhất cho module Bếp Trung Tâm (Central Kitchen). Toàn bộ API đều được ánh chiếu trực tiếp từ mã nguồn hệ thống.

\---

**\#\# 1\. Thông tin Vận hành & Quy ước**  
\- **\*\*Base URL\*\***: \`/api/central-kitchen\`  
\- **\*\*Xác thực\*\***: \`Authorization: Bearer \<JWT\_TOKEN\>\` (Role: \`CENTRAL\_KITCHEN\_STAFF\`).  
\- **\*\*Response chuẩn\*\***:  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Thông báo thành công",  
  "data": { ... }  
}  
\`\`\`

\---

**\#\# 2\. Module QUẢN LÝ ĐƠN HÀNG (Order Management)**

Dành cho việc tiếp nhận và xử lý đơn đặt hàng từ các Franchise Store.

**\#\#\# 2.1 Lấy danh sách đơn hàng**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/orders\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`  
\- **\*\*Query Params\*\***:  
  \- \`status\`: Lọc theo trạng thái (\`PENDING\`, \`ASSIGNED\`, \`IN\_PROGRESS\`, \`PACKED\_WAITING\_SHIPPER\`, \`SHIPPING\`, \`DELIVERED\`, \`CANCELLED\`).  
  \- \`storeId\`: Lọc theo ID cửa hàng.  
  \- \`page\` (Mặc định 0), \`size\` (Mặc định 20).

**\#\#\# 2.2 Xem chi tiết đơn hàng**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/orders/{orderId}\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`

**\#\#\# 2.3 Tiếp nhận đơn hàng (Assign)**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/orders/{orderId}/assign\`  
\- **\*\*Permission\*\***: \`ORDER\_ASSIGN\`  
\- **\*\*Nghiệp vụ\*\***: Hệ thống tự động gán đơn vào bếp của nhân viên đang đăng nhập và đổi trạng thái sang \`ASSIGNED\`.

**\#\#\# 2.4 Cập nhật trạng thái đơn hàng**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/orders/{orderId}/status\`  
\- **\*\*Permission\*\***: \`ORDER\_STATUS\_UPDATE\`  
\- **\*\*Body\*\***: \`{"status": "...", "notes": "..."}\`  
\- **\*\*Quan trọng\*\***: Khi chuyển sang \`PACKED\_WAITING\_SHIPPER\`, hệ thống sẽ tự động trừ tồn kho các lô thành phẩm theo FEFO.

**\#\#\# 2.5 Lấy danh sách Trạng thái hợp lệ**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/order-statuses\`  
\- **\*\*Permission\*\***: \`ORDER\_STATUS\_UPDATE\`

\---

**\#\# 3\. Module SẢN XUẤT (Production Planning)**

Quy trình từ lập kế hoạch đến khi bánh ra lò vào kho.

**\#\#\# 3.1 Kiểm tra khả năng sản xuất (Recipe Check)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/products/{productId}/recipe-check\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_CREATE\`  
\- **\*\*Query Params\*\***: \`quantity\` (Số lượng muốn sản xuất).  
\- **\*\*Hành vi\*\***: Kiểm tra xem kho nguyên liệu hiện tại có đủ để sản xuất số lượng này không.

**\#\#\# 3.2 Tạo kế hoạch sản xuất**  
\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/production-plans\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_CREATE\`  
\- **\*\*Body\*\***: \`{"productId": "...", "quantity": 100, "startDate": "...", "endDate": "...", "notes": "..."}\`

**\#\#\# 3.3 Danh sách kế hoạch sản xuất**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/production-plans\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_VIEW\`  
\- **\*\*Query Params\*\***: \`page\`, \`size\`.

**\#\#\# 3.4 Bắt đầu sản xuất (Start)**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/production-plans/{planId}/start\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_UPDATE\`  
\- **\*\*Hành vi\*\***: Trừ kho nguyên liệu thật sự tại các lô đã được chỉ định.

**\#\#\# 3.5 Hoàn thành sản xuất (Complete)**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/production-plans/{planId}/complete\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_UPDATE\`  
\- **\*\*Body\*\***: \`{"notes": "...", "expiryDate": "yyyy-MM-dd"}\`  
\- **\*\*Hành vi\*\***: Sinh ra Lô thành phẩm (\`ProductBatch\`) mới trong kho.

**\#\#\# 3.6 Hủy kế hoạch sản xuất (Cancel)**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/production-plans/{planId}/cancel\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_UPDATE\`  
\- **\*\*Hành vi\*\***: Hoàn trả nguyên liệu về các lô cũ nếu kế hoạch đã Start.

\---

**\#\# 4\. Module QUẢN LÝ KHO THÀNH PHẨM (Product Inventory & Batches)**

Dành cho nhân viên kiểm soát lượng bánh đã sản xuất xong.

**\#\#\# 4.1 Xem tồn kho thành phẩm (Tổng hợp)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/inventory/products\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_VIEW\`  
\- **\*\*Query Params\*\***: \`productId\`, \`productName\`, \`page\`, \`size\`.  
\- **\*\*Dữ liệu trả về\*\***: Tổng số lượng từng loại bánh hiện có tại bếp.

**\#\#\# 4.2 Danh sách các lô thành phẩm (Chi tiết lô)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/product-batches\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_VIEW\`  
\- **\*\*Query Params\*\***: \`productId\`, \`status\` (\`AVAILABLE\`, \`DEPLETED\`), \`page\`, \`size\`.

**\#\#\# 4.3 Xem chi tiết một lô thành phẩm**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/product-batches/{batchId}\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_VIEW\`  
\- **\*\*Hành vi\*\***: Xem thông tin lô và danh sách các lô nguyên liệu (\`ingredientBatchUsages\`) cấu thành nên lô bánh này.

**\#\#\# 4.4 Cập nhật thông tin lô thành phẩm**  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/product-batches/{batchId}\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_UPDATE\`  
\- **\*\*Body\*\***: \`{"expiryDate": "...", "status": "...", "notes": "..."}\`

\---

**\#\# 5\. Module QUẢN LÝ KHO NGUYÊN LIỆU (Ingredient Inventory & Batches)**

Kiểm soát nguyên liệu đầu vào.

**\#\#\# 5.1 Xem tồn kho nguyên liệu (Tổng hợp)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/inventory\`  
\- **\*\*Permission\*\***: \`KITCHEN\_INVENTORY\_VIEW\`  
\- **\*\*Query Params\*\***: \`ingredientId\`, \`ingredientName\`, \`lowStock\` (boolean), \`page\`, \`size\`.

**\#\#\# 5.2 Nhập lô nguyên liệu mới**  
\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/ingredient-batches\`  
\- **\*\*Permission\*\***: \`KITCHEN\_INVENTORY\_CREATE\`  
\- **\*\*Body\*\***: \`ImportIngredientBatchRequest\` (Chi tiết: \`ingredientId\`, \`batchNo\`, \`quantity\`, \`expiryDate\`, \`supplier\`, \`importPrice\`).

**\#\#\# 5.3 Danh sách các lô nguyên liệu**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/ingredient-batches\`  
\- **\*\*Permission\*\***: \`KITCHEN\_INVENTORY\_VIEW\`  
\- **\*\*Query Params\*\***: \`ingredientId\`, \`ingredientName\`, \`status\`, \`page\`, \`size\`.

**\#\#\# 5.4 Xem chi tiết một lô nguyên liệu**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/ingredient-batches/{id}\`  
\- **\*\*Permission\*\***: \`KITCHEN\_INVENTORY\_VIEW\`

\---

**\#\# 6\. Module TIỆN ÍCH & TỔNG QUAN (Utility & Overview)**

**\#\#\# 6.1 Tổng quan vận hành bếp (Dashboard)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/overview\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`  
\- **\*\*Query Params\*\***: \`fromDate\`, \`toDate\`.  
\- **\*\*Dữ liệu\*\***: Số lượng đơn chờ, đơn đang làm, đơn quá hạn...

**\#\#\# 6.2 Thông tin Bếp của tôi**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/my-kitchen\`  
\- **\*\*Permission\*\***: \`KITCHEN\_INVENTORY\_VIEW\`

**\#\#\# 6.3 Tra cứu danh sách Sản phẩm (Để lập kế hoạch)**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/products\`  
\- **\*\*Permission\*\***: \`PRODUCTION\_PLAN\_VIEW\`  
\- **\*\*Query Params\*\***: \`search\`, \`category\`, \`page\`, \`size\`.

**\#\#\# 6.4 Tra cứu danh sách Cửa hàng**  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/central-kitchen/stores\`  
\- **\*\*Permission\*\***: \`STORE\_VIEW\`  
\- **\*\*Query Params\*\***: \`name\`, \`status\`, \`page\`, \`size\`.

\---

**\#\# 7\. Checklist Tích hợp FE (Nghiệp vụ Quan trọng)**  
\- \[ \] **\*\*Lập kế hoạch\*\***: Gọi \`GET /products/{id}/recipe-check\` để kiểm tra tồn kho ảo trước khi gọi \`POST /production-plans\`.  
\- \[ \] **\*\*Sản xuất\*\***: Nút "Bắt đầu" gọi API \`/start\`, nút "Hoàn tất" gọi API \`/complete\` (Bắt buộc truyền \`expiryDate\`).  
\- \[ \] **\*\*Đóng gói đơn hàng\*\***: Khi đổi status đơn sang \`PACKED\_WAITING\_SHIPPER\`, nếu Backend trả lỗi 400, hãy hiển thị thông báo "Thiếu tồn kho thành phẩm" để nhân viên biết cần đi sản xuất thêm.  
\- \[ \] **\*\*Truy vết (Traceability)\*\***: Trong màn hình chi tiết lô thành phẩm (\`PB...\`), luôn hiển thị danh sách \`ingredientBatchUsages\` để minh bạch nguồn gốc nguyên liệu.

# manager-api

**\# Manager Role API (FE Integration Guide)**

Tài liệu này dành cho frontend tích hợp các API thuộc manager role.

**\#\# 1\) Auth và Permission**

\- Tất cả endpoint trong tài liệu này yêu cầu:  
  \- Authorization header: Bearer access\_token  
\- Tài khoản test mặc định:  
  \- username: manager  
  \- password: manager123

**\#\#\# Permission map**

\- Product API: PRODUCT\_MANAGE  
\- Recipe API: RECIPE\_MANAGE  
\- Dashboard overview: MANAGER\_DASHBOARD\_VIEW  
\- Low stock inventory: INVENTORY\_VIEW

**\#\# 2\) Response format chuẩn**

Phần lớn endpoint dùng wrapper chung:

{  
  "statusCode": 200,  
  "message": "...",  
  "data": { ... }  
}

Các endpoint list có pagination sẽ trả data theo PageResponse:

{  
  "statusCode": 200,  
  "message": "...",  
  "data": {  
    "content": \[ ... \],  
    "pageNumber": 0,  
    "pageSize": 20,  
    "totalElements": 10,  
    "totalPages": 1,  
    "last": true  
  }  
}

Chi tiết lỗi dùng chuẩn chung tại file error-response.md.

**\#\# 3\) Product APIs**

Base path: /api/manager/products

**\#\#\# 3.1 GET /api/manager/products**

Mục đích: lấy danh sách product có phân trang.

Query params:  
\- page: number, mặc định 0  
\- size: number, mặc định 20  
\- search: string, optional  
  \- Hiện tại search theo name (contains, không phân biệt hoa thường)  
\- category: string, optional  
  \- Enum hiện tại: BAKERY, BEVERAGE, SNACK, FROZEN, OTHER

Ví dụ request:  
\- /api/manager/products?page=0\&size=20\&search=bread\&category=BAKERY

Ví dụ data.content item:

{  
  "id": "PROD000001",  
  "name": "Banh mi bo",  
  "category": "BAKERY",  
  "unit": "piece",  
  "price": 25000,  
  "cost": 12000,  
  "imageUrl": \[  
    "https://minio-server-swp.onrender.com/products/PROD000001/abc.jpg"  
  \],  
  "createdAt": "2026-04-16T10:30:00",  
  "updatedAt": "2026-04-16T10:30:00"  
}

**\#\#\# 3.2 GET /api/manager/products/categories**

Mục đích: lấy toàn bộ category enum để FE render filter/dropdown.

Ví dụ data:

\[  
  "BAKERY",  
  "BEVERAGE",  
  "SNACK",  
  "FROZEN",  
  "OTHER"  
\]

**\#\#\# 3.3 GET /api/manager/products/{id}**

Mục đích: lấy chi tiết 1 product.

Path param:  
\- id: string (ví dụ PROD000001)

**\#\#\# 3.4 POST /api/manager/products**

Mục đích: tạo product mới, có thể upload nhiều ảnh ngay khi tạo.

Content-Type: multipart/form-data

Form fields:  
\- name: string, required  
\- category: string, required (BAKERY | BEVERAGE | SNACK | FROZEN | OTHER)  
\- unit: string, required  
\- price: number \> 0, required  
\- cost: number \> 0, required  
\- images: file\[\], optional

**\#\#\# 3.5 PUT /api/manager/products/{id}**

Mục đích: update product, có thể gửi lại images để thay toàn bộ danh sách ảnh.

Content-Type: multipart/form-data

Form fields giống create.

**\#\#\# 3.6 POST /api/manager/products/{id}/images**

Mục đích: upload thêm nhiều ảnh và append vào imageUrl.

Content-Type: multipart/form-data

Form fields:  
\- images: file\[\], required

Lưu ý FE:  
\- Key phải là images  
\- Có thể gửi nhiều file cùng key images

**\#\#\# 3.7 POST /api/manager/products/{id}/image**

Mục đích: endpoint tương thích cũ, upload 1 ảnh.

Content-Type: multipart/form-data

Form fields:  
\- image: file, required

**\#\#\# 3.8 DELETE /api/manager/products/{id}/images**

Mục đích: xóa 1 ảnh khỏi product và xóa object trong MinIO.

Query params:  
\- imageUrl: string, required

Ví dụ:  
\- /api/manager/products/PROD000001/images?imageUrl=https://minio-server-swp.onrender.com/products/PROD000001/abc.jpg

**\#\#\# 3.9 DELETE /api/manager/products/{id}**

Mục đích: xóa product.

**\#\# 4\) Recipe APIs**

Base path: /api/manager/recipes

**\#\#\# 4.1 GET /api/manager/recipes**

Mục đích: list recipe có phân trang.

Query params:  
\- page: number, mặc định 0  
\- size: number, mặc định 20

content item:

{  
  "id": 1,  
  "productId": "PROD000001",  
  "productName": "Banh mi bo",  
  "ingredientId": "ING000001",  
  "ingredientName": "Bot mi",  
  "quantity": 0.5,  
  "unit": "kg",  
  "createdAt": "2026-04-16T10:30:00"  
}

**\#\#\# 4.2 POST /api/manager/recipes**

Mục đích: tạo định mức nguyên liệu cho sản phẩm.

Body JSON:

{  
  "productId": "PROD000001",  
  "ingredientId": "ING000001",  
  "quantity": 0.5,  
  "unit": "kg"  
}

**\#\#\# 4.3 PUT /api/manager/recipes/{id}**

Mục đích: update quantity và unit.

Body JSON:

{  
  "quantity": 0.8,  
  "unit": "kg"  
}

**\#\#\# 4.4 DELETE /api/manager/recipes/{id}**

Mục đích: xóa recipe.

**\#\# 5\) Manager Dashboard APIs**

Base path: /api/manager/dashboard

**\#\#\# 5.1 GET /api/manager/dashboard/overview**

Mục đích: số liệu tổng quan cho dashboard manager.

Ví dụ data:

{  
  "totalProducts": 120,  
  "totalIngredients": 64,  
  "totalRecipes": 210,  
  "activeProductionPlans": 3,  
  "inProgressBatches": 2,  
  "pendingOrders": 7,  
  "lowStockKitchenItems": 4,  
  "lowStockStoreItems": 9,  
  "totalRevenue": 15200000,  
  "totalDisposedQuantity": 35  
}

**\#\#\# 5.2 GET /api/manager/dashboard/inventory/kitchen-low-stock**

Mục đích: danh sách nguyên liệu low stock ở bếp trung tâm.

data item:

{  
  "inventoryId": 1,  
  "ingredientId": "ING000001",  
  "ingredientName": "Bot mi",  
  "quantity": 1.2,  
  "minStock": 5,  
  "unit": "kg"  
}

**\#\#\# 5.3 GET /api/manager/dashboard/inventory/store-low-stock**

Mục đích: danh sách sản phẩm low stock ở cửa hàng.

data item:

{  
  "inventoryId": 10,  
  "storeId": "ST001",  
  "storeName": "Store District 1",  
  "productId": "PROD000001",  
  "productName": "Banh mi bo",  
  "quantity": 2,  
  "minStock": 8,  
  "unit": "piece"  
}

**\#\# 6\) FE test checklist nhanh**

\- Login bằng manager, lưu access token.  
\- Gọi GET /api/manager/products/categories để bind dropdown category.  
\- Gọi GET /api/manager/products với:  
  \- không filter  
  \- search=bread  
  \- category=BAKERY  
  \- search \+ category cùng lúc  
\- Test upload ảnh:  
  \- POST /api/manager/products/{id}/images với key images, nhiều file  
  \- Mở imageUrl trả về để verify public access  
\- Test dashboard:  
  \- overview  
  \- kitchen-low-stock  
  \- store-low-stock  
\- Test lỗi thường gặp:  
  \- 401 token hết hạn/thiếu token  
  \- 403 thiếu quyền  
  \- 400 validate lỗi payload

# franchise store staff-api

**\# Store Staff API Integration Guide (FE)**

Tài liệu này dành cho Frontend tích hợp API cho role \`FRANCHISE\_STORE\_STAFF\`.

Mục tiêu: FE có thể nối API nhanh, đúng luồng nghiệp vụ, biết rõ request/response, trạng thái và lỗi thường gặp.

\---

**\#\# 1\) Tổng quan**

\- **\*\*Prefix API Store Staff\*\***: \`/api/store\`  
\- **\*\*Content-Type\*\***: \`application/json\`  
\- **\*\*Auth\*\***: JWT Bearer token trong header:  
  \- \`Authorization: Bearer \<access\_token\>\`

\> Lưu ý: toàn bộ API trong tài liệu này yêu cầu user đăng nhập và có quyền tương ứng của Store Staff.

\---

**\#\# 2\) Quy ước response (cực kỳ quan trọng cho FE)**

Backend đang dùng \`@ApiResponse\`, vì vậy response thành công theo format:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

**\#\#\# 2.1) HTTP status thành công**  
\- \`GET\`: thường \`200\`  
\- \`POST\`: thường \`201\` (vì \`@PostMapping\`)

**\#\#\# 2.2) Response lỗi chuẩn**  
Khi lỗi, backend trả:

\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

Hoặc với lỗi validation body:

\`\`\`json  
{  
  "statusCode": 400,  
  "message": "Validation failed",  
  "data": {  
    "fieldName": "error message"  
  }  
}  
\`\`\`

**\#\#\# 2.3) API phân trang**  
Các API list có \`page\` \+ \`size\` và nằm trong \`data\`.

Ở tầng controller, API được đánh dấu phân trang (\`@PageResponse\`) và trả object phân trang. FE nên đọc theo các key phổ biến:  
\- \`content\`  
\- \`pageNumber\`  
\- \`pageSize\`  
\- \`totalElements\`  
\- \`totalPages\`  
\- \`last\`

\---

**\#\# 3\) Enum/giá trị chuẩn FE phải dùng**

**\#\# 3.1) OrderStatus**  
Danh sách status backend hỗ trợ (trả về qua API statuses):

\- \`PENDING\`  
\- \`ASSIGNED\`  
\- \`IN\_PROGRESS\`  
\- \`PACKED\_WAITING\_SHIPPER\`  
\- \`SHIPPING\`  
\- \`DELIVERED\`  
\- \`CANCELLED\`  
\- \`PROCESSING\` *\*(legacy)\**  
\- \`APPROVED\` *\*(legacy)\**

\> FE nên ưu tiên hiển thị 7 status chính đầu tiên cho flow mới.

**\#\#\# 3.2) ProductCategory**  
\- \`BAKERY\`  
\- \`BEVERAGE\`  
\- \`SNACK\`  
\- \`FROZEN\`  
\- \`OTHER\`

**\#\#\# 3.3) Delivery status (dùng cho filter)**  
Backend hiện dùng string status cho Delivery:  
\- \`ASSIGNED\`  
\- \`SHIPPING\`  
\- \`DELIVERED\`

\---

**\#\# 4\) Luồng tích hợp khuyến nghị cho FE**

1\. Login lấy access token.  
2\. Màn hình dashboard: gọi \`GET /api/store/overview\`.  
3\. Màn hình tạo đơn:  
   \- gọi \`GET /api/store/products\` để chọn hàng.  
   \- gửi \`POST /api/store/orders\`.  
4\. Màn hình quản lý đơn:  
   \- gọi \`GET /api/store/orders\` (lọc status nếu cần).  
   \- gọi \`GET /api/store/orders/{orderId}\` xem chi tiết.  
   \- gọi \`GET /api/store/orders/{orderId}/timeline\` hiển thị tiến trình.  
5\. Màn hình giao hàng:  
   \- gọi \`GET /api/store/deliveries\`.  
   \- khi nhận hàng xong: \`POST /api/store/deliveries/{deliveryId}/confirm\`.  
6\. Màn hình tồn kho:  
   \- gọi \`GET /api/store/inventory\`.  
7\. Màn hình profile cửa hàng:  
   \- gọi \`GET /api/store/my-store\`.

\---

**\#\# 5\) Danh sách endpoint chi tiết**

**\#\# 5.1) Tạo đơn hàng**

\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/store/orders\`  
\- **\*\*Permission\*\***: \`ORDER\_CREATE\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "requestedDate": "2026-04-20",  
  "notes": "Giao trước 10h sáng",  
  "items": \[  
    {  
      "productId": "PROD001",  
      "quantity": 10  
    },  
    {  
      "productId": "PROD002",  
      "quantity": 5  
    }  
  \]  
}  
\`\`\`

**\#\#\# Validate request**  
\- \`requestedDate\`: bắt buộc  
\- \`items\`: bắt buộc, không rỗng  
\- \`items\[\].productId\`: bắt buộc  
\- \`items\[\].quantity\`: bắt buộc, \`\>= 1\`, \`\<= 9,999,999\`

**\#\#\# Response thành công (\`201\`)**  
\`data\` là \`OrderResponse\`:

\`\`\`json  
{  
  "statusCode": 201,  
  "message": "Order created successfully",  
  "data": {  
    "id": "ORD0418001",  
    "storeId": "ST001",  
    "storeName": "Store 1",  
    "kitchenId": null,  
    "kitchenName": null,  
    "status": "PENDING",  
    "priority": "NORMAL",  
    "createdAt": "2026-04-18T21:00:00",  
    "requestedDate": "2026-04-20",  
    "notes": "Giao trước 10h sáng",  
    "createdBy": "store\_staff\_01",  
    "total": 250000,  
    "updatedAt": "2026-04-18T21:00:00",  
    "items": \[  
      {  
        "id": 1,  
        "productId": "PROD001",  
        "productName": "Bread",  
        "quantity": 10,  
        "unit": "piece",  
        "createdAt": "2026-04-18T21:00:00"  
      }  
    \]  
  }  
}  
\`\`\`

**\#\#\# Lỗi thường gặp**  
\- \`404 Product not found: \<id\>\`  
\- \`400 Validation failed\`  
\- \`403 Permission denied\`

\---

**\#\# 5.2) Danh sách đơn hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/orders\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`status\` *\*(optional)\**: ví dụ \`PENDING\`, \`SHIPPING\`...  
  \- \`page\` *\*(default=0)\**  
  \- \`size\` *\*(default=20)\**

**\#\#\# Ví dụ**  
\`GET /api/store/orders?status=SHIPPING\&page=0\&size=20\`

**\#\#\# Response thành công (\`200\`)**  
\`data\` là object phân trang, \`content\` gồm \`OrderResponse\[\]\`.

\---

**\#\# 5.3) Chi tiết đơn hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/orders/{orderId}\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`

**\#\#\# Response**  
\`data\` là \`OrderResponse\` (full items).

**\#\#\# Lỗi**  
\- \`404 Order not found: {orderId}\`

\---

**\#\# 5.4) Timeline trạng thái đơn hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/orders/{orderId}/timeline\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`

**\#\#\# Response (\`200\`)**  
\`data\` là \`OrderTimelineResponse\`:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Order timeline retrieved successfully",  
  "data": {  
    "orderId": "ORD0418001",  
    "currentStatus": "IN\_PROGRESS",  
    "createdAt": "2026-04-18T10:00:00",  
    "assignedAt": "2026-04-18T10:10:00",  
    "inProgressAt": "2026-04-18T10:20:00",  
    "packedWaitingShipperAt": null,  
    "shippingAt": null,  
    "deliveredAt": null,  
    "cancelledAt": null,  
    "updatedAt": "2026-04-18T10:20:00"  
  }  
}  
\`\`\`

**\#\#\# FE mapping gợi ý**  
\- Mốc chưa diễn ra \=\> \`null\`  
\- Hiển thị stepper theo thứ tự:  
  \`PENDING\` \-\> \`ASSIGNED\` \-\> \`IN\_PROGRESS\` \-\> \`PACKED\_WAITING\_SHIPPER\` \-\> \`SHIPPING\` \-\> \`DELIVERED\`  
\- Nếu \`CANCELLED\`, hiển thị nhánh hủy theo \`cancelledAt\`.

\---

**\#\# 5.5) Danh sách trạng thái đơn hàng (cho filter/badge)**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/orders/statuses\`  
\- **\*\*Permission\*\***: \`ORDER\_VIEW\`

**\#\#\# Response**  
\`data\` là \`string\[\]\` gồm toàn bộ status enum backend.

Ví dụ:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Order statuses retrieved successfully",  
  "data": \[  
    "PENDING",  
    "ASSIGNED",  
    "IN\_PROGRESS",  
    "PACKED\_WAITING\_SHIPPER",  
    "SHIPPING",  
    "DELIVERED",  
    "CANCELLED",  
    "PROCESSING",  
    "APPROVED"  
  \]  
}  
\`\`\`

\---

**\#\# 5.6) Danh sách delivery của cửa hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/deliveries\`  
\- **\*\*Permission\*\***: \`DELIVERY\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`status\` *\*(optional)\**: \`ASSIGNED | SHIPPING | DELIVERED\`  
  \- \`page\` *\*(default=0)\**  
  \- \`size\` *\*(default=20)\**

**\#\#\# Ví dụ**  
\`GET /api/store/deliveries?status=SHIPPING\&page=0\&size=20\`

**\#\#\# Response**  
\`data\` là phân trang \`DeliveryResponse\[\]\`.

\`DeliveryResponse\` fields:  
\- \`id\`  
\- \`orderId\`  
\- \`coordinatorName\`  
\- \`status\`  
\- \`assignedAt\`  
\- \`deliveredAt\`  
\- \`notes\`  
\- \`receiverName\`  
\- \`temperatureOk\`  
\- \`createdAt\`  
\- \`updatedAt\`

\> Lưu ý: API cũ \`GET /api/store/orders/{orderId}/delivery\` đã được bỏ, FE không dùng endpoint này nữa.

\---

**\#\# 5.7) Xác nhận nhận hàng**

\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/store/deliveries/{deliveryId}/confirm\`  
\- **\*\*Permission\*\***: \`DELIVERY\_CONFIRM\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "receiverName": "Nguyen Van A",  
  "temperatureOk": true,  
  "notes": "Hàng đủ, bao bì ổn"  
}  
\`\`\`

**\#\#\# Validate**  
\- \`receiverName\`: bắt buộc  
\- \`temperatureOk\`: bắt buộc  
\- \`notes\`: optional

**\#\#\# Response**  
\`data\` là \`DeliveryResponse\` đã cập nhật sang \`DELIVERED\`.

**\#\#\# Side effect nghiệp vụ**  
\- Delivery status \-\> \`DELIVERED\`  
\- Order status \-\> \`DELIVERED\`

\---

**\#\# 5.8) Xem tồn kho cửa hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/inventory\`  
\- **\*\*Permission\*\***: \`STORE\_INVENTORY\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`productId\` *\*(optional)\**  
  \- \`productName\` *\*(optional, tìm gần đúng)\**  
  \- \`page\` *\*(default=0)\**  
  \- \`size\` *\*(default=20)\**

**\#\#\# Response**  
\`data\` là phân trang \`StoreInventoryResponse\[\]\`.

\`StoreInventoryResponse\`:  
\- \`id\`  
\- \`storeId\`  
\- \`storeName\`  
\- \`productId\`  
\- \`productName\`  
\- \`quantity\`  
\- \`unit\`  
\- \`minStock\`  
\- \`expiryDate\`  
\- \`updatedAt\`  
\- \`lowStock\` (backend tự tính \`quantity \<= minStock\`)

**\#\#\# Lỗi**  
\- Nếu truyền \`productId\` không tồn tại: \`404 Product not found: \<id\>\`

\---

**\#\# 5.9) Lấy thông tin cửa hàng hiện tại**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/my-store\`  
\- **\*\*Permission\*\***: \`STORE\_VIEW\`

**\#\#\# Response**  
\`data\` là \`StoreResponse\`:  
\- \`id\`, \`name\`, \`address\`, \`phone\`, \`manager\`, \`status\`, \`openDate\`, \`createdAt\`, \`updatedAt\`

\---

**\#\# 5.10) Tổng quan vận hành cửa hàng**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/overview\`  
\- **\*\*Permission\*\***: \`STORE\_VIEW\`

**\#\#\# Response**  
\`data\` là \`StoreOverviewResponse\`:

\- \`storeId\`  
\- \`storeName\`  
\- \`totalOrders\`  
\- \`pendingOrders\`  
\- \`inProgressOrders\`  
\- \`shippingOrders\`  
\- \`deliveredOrders\`  
\- \`cancelledOrders\`  
\- \`lowStockItems\`  
\- \`activeDeliveries\`

\`activeDeliveries\` hiện được tính theo delivery status: \`ASSIGNED\` \+ \`SHIPPING\`.

\---

**\#\# 5.11) Danh sách sản phẩm có thể đặt**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/store/products\`  
\- **\*\*Permission\*\***: \`ORDER\_CREATE\`  
\- **\*\*Query\*\***:  
  \- \`name\` *\*(optional, partial match)\**  
  \- \`category\` *\*(optional: \`BAKERY | BEVERAGE | SNACK | FROZEN | OTHER\`)\**  
  \- \`page\` *\*(default=0)\**  
  \- \`size\` *\*(default=20)\**

**\#\#\# Response**  
\`data\` là phân trang \`ProductResponse\[\]\`.

\`ProductResponse\`:  
\- \`id\`  
\- \`name\`  
\- \`category\`  
\- \`unit\`  
\- \`price\`  
\- \`cost\`  
\- \`imageUrl\` (\`string\[\]\`)  
\- \`createdAt\`  
\- \`updatedAt\`

**\#\#\# Lỗi**  
\- \`400 Invalid product category: \<value\>\`

\---

**\#\# 6\) Permission mapping theo endpoint**

| Endpoint | Permission |  
|---|---|  
| \`POST /api/store/orders\` | \`ORDER\_CREATE\` |  
| \`GET /api/store/orders\` | \`ORDER\_VIEW\` |  
| \`GET /api/store/orders/{orderId}\` | \`ORDER\_VIEW\` |  
| \`GET /api/store/orders/{orderId}/timeline\` | \`ORDER\_VIEW\` |  
| \`GET /api/store/orders/statuses\` | \`ORDER\_VIEW\` |  
| \`GET /api/store/deliveries\` | \`DELIVERY\_VIEW\` |  
| \`POST /api/store/deliveries/{deliveryId}/confirm\` | \`DELIVERY\_CONFIRM\` |  
| \`GET /api/store/inventory\` | \`STORE\_INVENTORY\_VIEW\` |  
| \`GET /api/store/my-store\` | \`STORE\_VIEW\` |  
| \`GET /api/store/overview\` | \`STORE\_VIEW\` |  
| \`GET /api/store/products\` | \`ORDER\_CREATE\` |

\---

**\#\# 7\) FE checklist để nối nhanh và ít lỗi**

\- \[ \] Luôn gửi \`Authorization: Bearer \<token\>\`.  
\- \[ \] Parse response theo \`statusCode/message/data\`.  
\- \[ \] Với list API, đọc phân trang từ \`data\` (\`content\`, \`pageNumber\`, \`totalElements\`...).  
\- \[ \] Dùng \`GET /api/store/orders/statuses\` để render dropdown filter status.  
\- \[ \] Timeline phải handle \`null timestamp\`.  
\- \[ \] Màn hình confirm receipt bắt buộc \`receiverName\`, \`temperatureOk\`.  
\- \[ \] Không gọi endpoint đã bỏ: \`/api/store/orders/{orderId}/delivery\`.

\---

**\#\# 8\) Gợi ý typing (TypeScript)**

\`\`\`ts  
export type ApiEnvelope\<T\> \= {  
  statusCode: number;  
  message: string;  
  data: T;  
};

export type Paged\<T\> \= {  
  content: T\[\];  
  pageNumber: number;  
  pageSize: number;  
  totalElements: number;  
  totalPages: number;  
  last: boolean;  
};

export type OrderStatus \=  
  | "PENDING"  
  | "ASSIGNED"  
  | "IN\_PROGRESS"  
  | "PACKED\_WAITING\_SHIPPER"  
  | "SHIPPING"  
  | "DELIVERED"  
  | "CANCELLED"  
  | "PROCESSING"  
  | "APPROVED";  
\`\`\`

\---

**\#\# 9\) Chú ý nghiệp vụ thực tế**

\- API store chủ yếu tự suy ra store từ user đăng nhập (không truyền \`storeId\` từ FE).  
\- \`priority\` của order backend tự tính theo \`requestedDate\`.  
\- Khi confirm delivery, order chuyển \`DELIVERED\` ngay.  
\- Timeline giúp FE hiển thị trải nghiệm tracking kiểu stepper.

\---

Nếu cần, mình có thể viết thêm bản “FE-ready” gồm luôn:  
\- collection JSON cho Postman,  
\- sample service code Axios,  
\- mapping trạng thái sang label tiếng Việt \+ màu UI.

# admin

**\# Admin API Integration Guide**

Tài liệu này tổng hợp đầy đủ các API admin hiện tại để FE tích hợp nhanh và đúng payload.

**\#\# 1\. Base URL và Authentication**

\- Tất cả API trong tài liệu này đều cần Bearer token admin hợp lệ.

Header mẫu:  
\`\`\`http  
Authorization: Bearer \<access\_token\>  
Content-Type: application/json  
\`\`\`

**\#\# 2\. Chuẩn response**

Phần lớn endpoint có \`@ApiResponse\` nên backend wrap theo \`ResponseObject\`:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

Với endpoint trả phân trang (\`@PageResponse\`), \`data\` sẽ có dạng:

\`\`\`json  
{  
  "content": \[\],  
  "pageNumber": 0,  
  "pageSize": 20,  
  "totalElements": 100,  
  "totalPages": 5,  
  "last": false  
}  
\`\`\`

**\#\# 3\. Enum dùng trong Admin APIs**

\- \`UserStatus\`: \`ACTIVE\`, \`DISABLED\`  
\- Store/Kitchen status: \`ACTIVE\`, \`INACTIVE\`  
\- Priority code: \`HIGH\`, \`NORMAL\`, \`LOW\`

**\#\# 4\. User Management (\`/api/admin/users\`)**

Permission: \`USER\_MANAGE\`

**\#\#\# 4.1 Lấy danh sách user (phân trang \+ filter)**  
\- \`GET /api/admin/users?roleName=ADMIN\&status=ACTIVE\&page=0\&size=20\`

Query params:  
\- \`roleName\` (optional): tên role  
\- \`status\` (optional): \`ACTIVE|DISABLED\`  
\- \`page\` (optional, default \`0\`)  
\- \`size\` (optional, default \`20\`)

Response mẫu:  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Users retrieved successfully",  
  "data": {  
    "content": \[  
      {  
        "userId": 1,  
        "username": "admin",  
        "email": "admin@example.com",  
        "identity\_Card": null,  
        "fullName": "System Admin",  
        "phone": null,  
        "address": null,  
        "dateOfBirth": null,  
        "status": "ACTIVE",  
        "role": "ADMIN"  
      }  
    \],  
    "pageNumber": 0,  
    "pageSize": 20,  
    "totalElements": 1,  
    "totalPages": 1,  
    "last": true  
  }  
}  
\`\`\`

**\#\#\# 4.2 Lấy chi tiết user**  
\- \`GET /api/admin/users/{id}\`

Response: \`MemberResponse\` trong \`data\`.

**\#\#\# 4.3 Tạo user**  
\- \`POST /api/admin/users\`

Body:  
\`\`\`json  
{  
  "username": "staff\_01",  
  "password": "Aa@123456",  
  "fullName": "Store Staff 01",  
  "email": "staff01@example.com",  
  "roleName": "FRANCHISE\_STORE\_STAFF",  
  "status": "ACTIVE",  
  "verify": true  
}  
\`\`\`

Lưu ý:  
\- \`username\` và \`email\` không được trùng.  
\- \`password\` áp dụng rule strong password.  
\- Trả về object \`MemberResponse\`.

**\#\#\# 4.4 Cập nhật user**  
\- \`PUT /api/admin/users/{id}\`

Body (gửi field nào cần update):  
\`\`\`json  
{  
  "fullName": "Updated Name",  
  "email": "updated@example.com",  
  "roleName": "MANAGER",  
  "status": "ACTIVE",  
  "verify": true,  
  "locked": false  
}  
\`\`\`

**\#\#\# 4.5 Xóa user**  
\- \`DELETE /api/admin/users/{id}\`

Response:  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "User deleted successfully",  
  "data": null  
}  
\`\`\`

**\#\#\# 4.6 Lấy profile hiện tại**  
\- \`GET /api/admin/users/me\`  
\- API này chỉ cần authenticated, không bắt buộc \`USER\_MANAGE\`.

**\---**

**\#\# 5\. Role Management (\`/api/admin/roles\`)**

Lưu ý bảo mật hiện tại: **\*\*không có create role / delete role\*\***.

**\#\#\# 5.1 Lấy danh sách role**  
\- \`GET /api/admin/roles\`  
\- Permission: \`ROLE\_VIEW\`

**\#\#\# 5.2 Lấy role theo id**  
\- \`GET /api/admin/roles/{id}\`  
\- Permission: \`ROLE\_VIEW\`

**\#\#\# 5.3 Cập nhật tên role**  
\- \`PUT /api/admin/roles/{id}\`  
\- Permission: \`ROLE\_UPDATE\`

Body:  
\`\`\`json  
{  
  "name": "SUPERVISOR"  
}  
\`\`\`

**\#\#\# 5.4 Cập nhật permission cho role**  
\- \`PUT /api/admin/roles/{id}/permissions\`  
\- Permission: \`ROLE\_UPDATE\_PERMISSIONS\`

Body:  
\`\`\`json  
{  
  "permissionIds": \[1, 2, 3\]  
}  
\`\`\`

**\---**

**\#\# 6\. Permission Management (\`/api/admin/permissions\`)**

**\#\#\# 6.1 Lấy danh sách permission**  
\- \`GET /api/admin/permissions\`  
\- Permission: \`PERMISSION\_VIEW\`

**\#\#\# 6.2 Cập nhật tên permission**  
\- \`PUT /api/admin/permissions/{id}\`  
\- Permission: \`PERMISSION\_UPDATE\`

Body:  
\`\`\`json  
{  
  "name": "Permission Name Updated"  
}  
\`\`\`

**\---**

**\#\# 7\. Catalog Management (\`/api/admin/catalog\`)**

**\#\#\# 7.1 Stores**

**\#\#\#\# 7.1.1 Danh sách stores**  
\- \`GET /api/admin/catalog/stores?name=District\&status=ACTIVE\&page=0\&size=20\`  
\- Permission: \`FRANCHISE\_STORE\_MANAGE\`

**\#\#\#\# 7.1.2 Chi tiết store**  
\- \`GET /api/admin/catalog/stores/{id}\`  
\- Permission: \`FRANCHISE\_STORE\_MANAGE\`

**\#\#\#\# 7.1.3 Tạo store**  
\- \`POST /api/admin/catalog/stores\`  
\- Permission: \`FRANCHISE\_STORE\_MANAGE\`

Body:  
\`\`\`json  
{  
  "id": "ST010",  
  "name": "Store District 10",  
  "address": "10 Nguyen Trai, HCM",  
  "phone": "0900000000",  
  "manager": "Manager A",  
  "status": "ACTIVE",  
  "openDate": "2026-04-01"  
}  
\`\`\`

**\#\#\#\# 7.1.4 Cập nhật store**  
\- \`PUT /api/admin/catalog/stores/{id}\`  
\- Permission: \`FRANCHISE\_STORE\_MANAGE\`

Body:  
\`\`\`json  
{  
  "name": "Store District 10 Updated",  
  "address": "10 Nguyen Trai, HCM",  
  "phone": "0900000001",  
  "manager": "Manager B",  
  "status": "ACTIVE",  
  "openDate": "2026-04-02"  
}  
\`\`\`

**\#\#\#\# 7.1.5 Cập nhật status store**  
\- \`PATCH /api/admin/catalog/stores/{id}/status?status=INACTIVE\`  
\- Permission: \`FRANCHISE\_STORE\_MANAGE\`

**\#\#\# 7.2 Kitchens**

**\#\#\#\# 7.2.1 Danh sách kitchens**  
\- \`GET /api/admin/catalog/kitchens?name=Central\&status=ACTIVE\&page=0\&size=20\`  
\- Permission: \`CENTRAL\_KITCHEN\_MANAGE\`

**\#\#\#\# 7.2.2 Chi tiết kitchen**  
\- \`GET /api/admin/catalog/kitchens/{id}\`  
\- Permission: \`CENTRAL\_KITCHEN\_MANAGE\`

**\#\#\#\# 7.2.3 Tạo kitchen**  
\- \`POST /api/admin/catalog/kitchens\`  
\- Permission: \`CENTRAL\_KITCHEN\_MANAGE\`

Body:  
\`\`\`json  
{  
  "id": "KIT010",  
  "name": "Central Kitchen 10",  
  "address": "100 Le Loi, HCM",  
  "phone": "0911111111",  
  "capacity": 500,  
  "status": "ACTIVE"  
}  
\`\`\`

**\#\#\#\# 7.2.4 Cập nhật kitchen**  
\- \`PUT /api/admin/catalog/kitchens/{id}\`  
\- Permission: \`CENTRAL\_KITCHEN\_MANAGE\`

Body:  
\`\`\`json  
{  
  "name": "Central Kitchen 10 Updated",  
  "address": "100 Le Loi, HCM",  
  "phone": "0911111112",  
  "capacity": 600,  
  "status": "ACTIVE"  
}  
\`\`\`

**\#\#\#\# 7.2.5 Cập nhật status kitchen**  
\- \`PATCH /api/admin/catalog/kitchens/{id}/status?status=INACTIVE\`  
\- Permission: \`CENTRAL\_KITCHEN\_MANAGE\`

**\---**

**\#\# 8\. System Config (\`/api/admin/system-config\`)**

Permission chung: \`SYSTEM\_CONFIG\_MANAGE\`

**\#\#\# 8.1 Lấy danh sách cấu hình priority**  
\- \`GET /api/admin/system-config/order-priority\`

Response \`data\`:  
\`\`\`json  
\[  
  {  
    "id": 1,  
    "priorityCode": "HIGH",  
    "minDays": 0,  
    "maxDays": 0,  
    "description": "Gấp: Giao trong ngày"  
  }  
\]  
\`\`\`

**\#\#\# 8.2 Tạo cấu hình priority**  
\- \`POST /api/admin/system-config/order-priority\`

Body:  
\`\`\`json  
{  
  "priorityCode": "NORMAL",  
  "minDays": 1,  
  "maxDays": 2,  
  "description": "Vừa: Giao trong 1-2 ngày"  
}  
\`\`\`

**\#\#\# 8.3 Cập nhật cấu hình priority**  
\- \`PUT /api/admin/system-config/order-priority/{id}\`

Body:  
\`\`\`json  
{  
  "priorityCode": "LOW",  
  "minDays": 3,  
  "maxDays": 5,  
  "description": "Thấp: Giao trong 3-5 ngày"  
}  
\`\`\`

Validation:  
\- \`maxDays \>= minDays\`  
\- \`priorityCode\` chỉ nhận \`HIGH|NORMAL|LOW\`  
\- Nếu \`fromDate \> toDate\` ở report sẽ trả lỗi 400 (xem mục reports)

**\---**

**\#\# 9\. Reports (\`/api/admin/reports\`)**

**\#\#\# 9.1 System overview**  
\- \`GET /api/admin/reports/system-overview\`  
\- \`GET /api/admin/reports/system-overview?fromDate=2026-04-01\&toDate=2026-04-30\`  
\- Permission: \`SYSTEM\_REPORT\_VIEW\`

Query params:  
\- \`fromDate\` (optional): \`yyyy-MM-dd\`  
\- \`toDate\` (optional): \`yyyy-MM-dd\`

Ý nghĩa filter ngày:  
\- Filter áp dụng cho phần đơn hàng: \`totalOrders\` và \`orderStatusCounts\` (theo \`orders.createdAt\`).  
\- Nếu chỉ truyền \`fromDate\`: lấy từ ngày đó trở đi.  
\- Nếu chỉ truyền \`toDate\`: lấy đến hết ngày đó.  
\- Nếu \`fromDate \> toDate\`: trả 400\.

Response mẫu:  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "System overview report retrieved successfully",  
  "data": {  
    "totalUsers": 12,  
    "totalRoles": 6,  
    "totalStores": 3,  
    "activeStores": 2,  
    "totalKitchens": 2,  
    "activeKitchens": 2,  
    "totalProducts": 25,  
    "totalOrders": 120,  
    "orderStatusCounts": {  
      "PENDING": 10,  
      "ASSIGNED": 8,  
      "IN\_PROGRESS": 7,  
      "PACKED\_WAITING\_SHIPPER": 3,  
      "SHIPPING": 6,  
      "DELIVERED": 80,  
      "CANCELLED": 2,  
      "PROCESSING": 2,  
      "APPROVED": 2  
    }  
  }  
}  
\`\`\`

**\---**

**\#\# 10\. Lỗi thường gặp cho FE**

**\#\#\# 400 \- Bad Request**  
Ví dụ:  
\- \`fromDate\` lớn hơn \`toDate\`  
\- Status truyền sai enum  
\- Payload thiếu field bắt buộc

**\#\#\# 401 \- Unauthorized**  
\- Không có token  
\- Token hết hạn

**\#\#\# 403 \- Forbidden**  
\- Token hợp lệ nhưng thiếu permission (\`USER\_MANAGE\`, \`SYSTEM\_REPORT\_VIEW\`, ...)

**\#\#\# 404 \- Not Found**  
\- User/Role/Store/Kitchen/Config id không tồn tại

**\#\#\# 409 \- Conflict**  
\- Username hoặc email bị trùng  
\- Priority code bị trùng

# Supply Coordinator role

**\# Supply Coordinator API Integration Guide (FE)**

Tai lieu nay danh cho Frontend tich hop API cho role \`SUPPLY\_COORDINATOR\`.

Muc tieu: FE co the tong hop don, dieu phoi bep, lap lich giao hang va xu ly su co nhanh theo dung flow van hanh.

**\---**

**\#\# 1\) Tong quan**

\- **\*\*Prefix API\*\***: \`/api/supply-coordinator\`  
\- **\*\*Content-Type\*\***: \`application/json\`  
\- **\*\*Auth\*\***: JWT Bearer token  
  \- \`Authorization: Bearer \<access\_token\>\`

\> Toan bo endpoint trong tai lieu nay yeu cau login \+ dung permission cua Supply Coordinator.

**\---**

**\#\# 2\) Quy uoc response**

Response thanh cong duoc wrap theo format chung:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

Response loi:

\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

API list su dung \`page\` \+ \`size\`, du lieu tra ve trong \`data.content\` va cac truong paging.

**\---**

**\#\# 3\) Danh sach endpoint**

**\#\# 3.1) Tong hop va phan loai don hang**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/orders\`  
\- **\*\*Permission\*\***: \`SUPPLY\_ORDER\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`status\` (optional)  
  \- \`priority\` (optional)  
  \- \`storeId\` (optional)  
  \- \`kitchenId\` (optional)  
  \- \`fromDate\` (optional, yyyy-MM-dd)  
  \- \`toDate\` (optional, yyyy-MM-dd)  
  \- \`page\` (default=0)  
  \- \`size\` (default=20)

**\---**

**\#\# 3.2) Chi tiet don hang**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/orders/{orderId}\`  
\- **\*\*Permission\*\***: \`SUPPLY\_ORDER\_VIEW\`

**\---**

**\#\# 3.3) Dieu phoi don sang bep**

\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/orders/{orderId}/assign-kitchen\`  
\- **\*\*Permission\*\***: \`SUPPLY\_ORDER\_ASSIGN\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "kitchenId": "KIT001",  
  "notes": "Dieu phoi cho bep trung tam 1"  
}  
\`\`\`

**\---**

**\#\# 3.4) Tong quan dieu phoi**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/overview\`  
\- **\*\*Permission\*\***: \`SUPPLY\_ORDER\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`fromDate\` (optional)  
  \- \`toDate\` (optional)

Response \`data\` gom cac chi so chinh:  
\- \`totalOrders\`  
\- \`pendingOrders\`  
\- \`assignedOrders\`  
\- \`inProgressOrders\`  
\- \`packedWaitingShipperOrders\`  
\- \`shippingOrders\`  
\- \`deliveredOrders\`  
\- \`cancelledOrders\`  
\- \`overdueOrders\`  
\- \`unassignedOrders\`  
\- \`activeDeliveries\`

**\---**

**\#\# 3.5) Lap lich giao hang**

\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/deliveries\`  
\- **\*\*Permission\*\***: \`SUPPLY\_DELIVERY\_SCHEDULE\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "orderId": "ORD0419001",  
  "status": "ASSIGNED",  
  "assignedAt": "2026-04-19T10:30:00",  
  "notes": "Uu tien giao truoc 12h"  
}  
\`\`\`

\`status\` cho luc tao chi nhan: \`ASSIGNED\`, \`SHIPPING\`.

**\---**

**\#\# 3.6) Theo doi tien do giao hang**

\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/deliveries\`  
\- **\*\*Permission\*\***: \`SUPPLY\_DELIVERY\_VIEW\`  
\- **\*\*Query\*\***:  
  \- \`status\` (optional): \`ASSIGNED\`, \`SHIPPING\`, \`DELAYED\`, \`DELIVERED\`, \`CANCELLED\`  
  \- \`page\` (default=0)  
  \- \`size\` (default=20)

**\---**

**\#\# 3.7) Cap nhat trang thai giao hang**

\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/deliveries/{deliveryId}/status\`  
\- **\*\*Permission\*\***: \`SUPPLY\_DELIVERY\_UPDATE\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "status": "SHIPPING",  
  "notes": "Da roi kho luc 09:00"  
}  
\`\`\`

Status hop le:  
\- \`ASSIGNED\`  
\- \`SHIPPING\`  
\- \`DELAYED\`  
\- \`DELIVERED\`  
\- \`CANCELLED\`

**\---**

**\#\# 3.8) Xu ly su co phat sinh**

\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/orders/{orderId}/issues\`  
\- **\*\*Permission\*\***: \`SUPPLY\_ISSUE\_MANAGE\`  
\- **\*\*Body\*\***:

\`\`\`json  
{  
  "issueType": "DELAY",  
  "description": "Xe gap su co tren duong Nguyen Van Linh",  
  "cancelOrder": false  
}  
\`\`\`

\`issueType\` hop le:  
\- \`SHORTAGE\`  
\- \`DELAY\`  
\- \`CANCELLATION\`  
\- \`OTHER\`

Neu \`cancelOrder=true\` hoac \`issueType=CANCELLATION\`, backend se huy don.

**\---**

**\#\# 3.9) Danh sach trang thai cho UI**

\- \`GET /api/supply-coordinator/order-statuses\`  
  \- Permission: \`SUPPLY\_ORDER\_VIEW\`  
\- \`GET /api/supply-coordinator/delivery-statuses\`  
  \- Permission: \`SUPPLY\_DELIVERY\_VIEW\`

**\---**

**\#\# 4\) Flow FE khuyen nghi**

1\. Goi \`GET /overview\` de hien thi dashboard dieu phoi.  
2\. Tai man hinh xu ly don: goi \`GET /orders\` va filter theo status/priority.  
3\. Don chua gan bep: goi \`PATCH /orders/{orderId}/assign-kitchen\`.  
4\. Don san sang giao: goi \`POST /deliveries\` de lap lich.  
5\. Theo doi giao van bang \`GET /deliveries\`, cap nhat tien do qua \`PATCH /deliveries/{deliveryId}/status\`.  
6\. Khi phat sinh thieu hang, tre giao, huy don: goi \`POST /orders/{orderId}/issues\`.

# sale-revenue

**\# Sales & Revenue API Integration Guide (Store Staff \+ Store Manager)**

Tài liệu này dành cho Frontend tích hợp đầy đủ nhóm API doanh số bán hàng và doanh thu.

Phạm vi tài liệu:  
\- Store Staff: upload/import doanh số theo ngày, clear báo cáo, xem lịch sử doanh số của chính cửa hàng.  
\- Store Manager: xem doanh thu theo ngày, tổng doanh thu theo cửa hàng, lấy danh sách store/kitchen để filter, export Excel doanh thu.

Mục tiêu:  
\- Nối API đúng payload/request format.  
\- Hiểu rõ validate và lỗi nghiệp vụ để xử lý UX chuẩn.  
\- Tránh sai lệch số liệu do quy ước ngày, filter và import lại.

**\---**  
S  
**\#\#\# 1.2 Authentication**  
Tất cả API trong tài liệu này cần JWT Bearer token.

Header mẫu:  
\`\`\`http  
Authorization: Bearer \<access\_token\>  
\`\`\`

**\#\#\# 1.3 Chuẩn response thành công**  
Hầu hết endpoint trả về dạng:  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

**\#\#\# 1.4 Chuẩn response lỗi**  
\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

Tham chiếu thêm: \`api-docs/error-response.md\`.

**\---**

**\#\# 2\. Permission Matrix**

**\#\#\# 2.1 Store Staff**  
\- \`SALES\_REPORT\_TEMPLATE\_DOWNLOAD\`: tải file template Excel  
\- \`SALES\_REPORT\_IMPORT\`: import báo cáo doanh số  
\- \`SALES\_REPORT\_CLEAR\`: xóa báo cáo đã import (để import lại)  
\- \`SALES\_REPORT\_VIEW\_OWN\`: xem doanh số của chính store staff

**\#\#\# 2.2 Store Manager**  
\- \`SALES\_REPORT\_VIEW\`: xem báo cáo doanh thu manager, export, danh sách filter

Lưu ý:  
\- Endpoint được kiểm soát bởi \`@SecuredEndpoint\`, thiếu quyền sẽ trả 403\.

**\---**

**\#\# 3\. Tổng quan Endpoint**

**\#\# 3.1 Store Staff APIs (prefix \`/api/store/sales\`)**  
\- \`GET /template\`: download Excel template  
\- \`POST /import\`: import file Excel doanh số theo ngày  
\- \`DELETE ?date=yyyy-MM-dd\`: clear báo cáo doanh số ngày cụ thể  
\- \`GET /daily\`: danh sách báo cáo doanh số theo ngày (có phân trang)  
\- \`GET /daily/detail\`: chi tiết item bán theo một ngày (phân trang item)

**\#\# 3.2 Manager APIs (prefix \`/api/manager/sales\`)**  
\- \`GET /daily\`: doanh thu theo từng ngày, tách theo store  
\- \`GET /total\`: tổng doanh thu trong khoảng ngày, có breakdown theo store  
\- \`GET /stores\`: lấy toàn bộ cửa hàng cho filter  
\- \`GET /kitchens\`: lấy toàn bộ bếp cho filter UI  
\- \`GET /daily/export\`: xuất Excel báo cáo doanh thu theo ngày

**\---**

**\#\# 4\. Store Staff \- API Chi Tiết**

**\#\# 4.1 Download Sales Template**

\- Method: \`GET\`  
\- URL: \`/api/store/sales/template\`  
\- Permission: \`SALES\_REPORT\_TEMPLATE\_DOWNLOAD\`  
\- Response: file nhị phân \`.xlsx\`

**\#\#\# Content-Disposition**  
\`\`\`http  
attachment; filename=sales\_report\_template.xlsx  
\`\`\`

**\#\#\# Cấu trúc sheet template**  
Sheet \`sales\_report\` có 4 cột:  
1\. \`product\_id\`  
2\. \`quantity\`  
3\. \`unit\`  
4\. \`unit\_price\`

Sheet \`notes\` mô tả rule.

**\#\#\# Rule quan trọng**  
\- Không truyền \`store\_id\` trong Excel.  
\- Không truyền \`sale\_date\` trong Excel.  
\- Ngày báo cáo lấy từ query param \`date\` khi gọi API import.  
\- Store lấy từ account store staff đang đăng nhập.

**\---**

**\#\# 4.2 Import Sales Report**

\- Method: \`POST\`  
\- URL: \`/api/store/sales/import\`  
\- Permission: \`SALES\_REPORT\_IMPORT\`  
\- Content-Type: \`multipart/form-data\`  
\- Form fields:  
  \- \`file\`: file \`.xlsx\`  
  \- \`date\`: định dạng \`yyyy-MM-dd\`

**\#\#\# cURL mẫu**  
\`\`\`bash  
curl \-X POST "http://localhost:8080/api/store/sales/import?date=2026-04-20" \\  
  \-H "Authorization: Bearer \<token\>" \\  
  \-H "Content-Type: multipart/form-data" \\  
  \-F "file=@sales\_report.xlsx"  
\`\`\`

**\#\#\# Response thành công**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Sales report imported successfully",  
  "data": {  
    "reportId": "SR0123",  
    "storeId": "ST001",  
    "reportDate": "2026-04-20",  
    "itemCount": 10,  
    "totalQuantity": 78,  
    "totalRevenue": 2150000,  
    "importedBy": "store\_staff\_01",  
    "importedAt": "2026-04-20T22:13:30"  
  }  
}  
\`\`\`

**\#\#\# Validate & nghiệp vụ anti-fraud**  
1\. File bắt buộc, không rỗng.  
2\. \`date\` bắt buộc.  
3\. Không cho import trùng cùng store \+ cùng date (phải clear trước).  
4\. Mỗi dòng Excel:  
   \- \`product\_id\` bắt buộc, phải tồn tại trong catalog.  
   \- \`quantity\` phải là số nguyên dương.  
   \- \`unit\` bắt buộc.  
   \- \`unit\_price\` phải \>= 0\.  
5\. Tất cả product trong Excel phải có trong inventory của store hiện tại.  
6\. Tổng quantity bán theo từng sản phẩm không được vượt quá tồn kho hiện tại.  
7\. \`unit\` trong Excel phải trùng với unit trong inventory sản phẩm.

**\#\#\# Tác động dữ liệu khi import thành công**  
\- Tạo 1 record trong \`sales\_records\`.  
\- Tạo nhiều record trong \`sale\_items\`.  
\- Trừ tồn kho \`store\_inventory\` theo tổng lượng bán từng sản phẩm.

**\#\#\# Lỗi thường gặp**  
\- 400 \`Excel file is required\`  
\- 400 \`Report date is required\`  
\- 400 \`No valid sale item rows found in Excel file\`  
\- 400 \`Unknown product\_id: ...\`  
\- 400 \`Store inventory not found for product\_id: ...\`  
\- 400 \`Invalid sales report data: product\_id ... sold ... but stock is only ...\`  
\- 400 \`Invalid Excel format. Please upload a valid .xlsx file\`  
\- 409 \`Sales report for this date already exists. Please clear it before re-importing.\`

**\---**

**\#\# 4.3 Clear Sales Report By Date**

\- Method: \`DELETE\`  
\- URL: \`/api/store/sales?date=yyyy-MM-dd\`  
\- Permission: \`SALES\_REPORT\_CLEAR\`

**\#\#\# Response thành công**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Sales report cleared successfully",  
  "data": {  
    "reportId": "SR0123",  
    "storeId": "ST001",  
    "reportDate": "2026-04-20",  
    "restoredItems": 10,  
    "restoredQuantity": 78,  
    "clearedAt": "2026-04-20T23:05:00"  
  }  
}  
\`\`\`

**\#\#\# Nghiệp vụ khi clear**  
\- Xóa toàn bộ \`sale\_items\` của report đó.  
\- Xóa \`sales\_records\` của ngày đó.  
\- Hoàn lại số lượng đã bán vào \`store\_inventory\`.

Nếu inventory của product chưa tồn tại ở store (case dữ liệu thiếu), backend có thể tạo mới inventory record để restore số lượng.

**\#\#\# Lỗi thường gặp**  
\- 400 \`Report date is required\`  
\- 404 \`No sales report found for this date\`

**\---**

**\#\# 4.4 Get My Daily Sales (Paginated)**

\- Method: \`GET\`  
\- URL: \`/api/store/sales/daily\`  
\- Permission: \`SALES\_REPORT\_VIEW\_OWN\`  
\- Query:  
  \- \`fromDate\` (optional, \`yyyy-MM-dd\`)  
  \- \`toDate\` (optional, \`yyyy-MM-dd\`)  
  \- \`page\` (default 0\)  
  \- \`size\` (default 20\)

**\#\#\# Rule filter**  
\- Nếu truyền cả \`fromDate\` và \`toDate\` thì \`fromDate \<= toDate\`.  
\- Sắp xếp mặc định: ngày giảm dần (\`date DESC\`).

**\#\#\# Response mẫu**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Daily sales reports retrieved successfully",  
  "data": {  
    "content": \[  
      {  
        "reportId": "SR0123",  
        "reportDate": "2026-04-20",  
        "totalRevenue": 2150000,  
        "itemCount": 10,  
        "totalQuantity": 78,  
        "recordedBy": "store\_staff\_01",  
        "recordedAt": "2026-04-20T22:13:30"  
      }  
    \],  
    "pageNumber": 0,  
    "pageSize": 20,  
    "totalElements": 1,  
    "totalPages": 1,  
    "last": true  
  }  
}  
\`\`\`

**\#\#\# Lỗi thường gặp**  
\- 400 \`fromDate must be before or equal to toDate\`  
\- 400 \`page must be \>= 0\`  
\- 400 \`size must be \> 0\`

**\---**

**\#\# 4.5 Get My Daily Sales Detail (Paginated Items)**

\- Method: \`GET\`  
\- URL: \`/api/store/sales/daily/detail\`  
\- Permission: \`SALES\_REPORT\_VIEW\_OWN\`  
\- Query:  
  \- \`date\` (required, \`yyyy-MM-dd\`)  
  \- \`page\` (default 0\)  
  \- \`size\` (default 20\)

**\#\#\# Response mẫu**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Daily sales detail retrieved successfully",  
  "data": {  
    "reportId": "SR0123",  
    "storeId": "ST001",  
    "storeName": "Store District 1",  
    "reportDate": "2026-04-20",  
    "totalRevenue": 2150000,  
    "itemCount": 10,  
    "totalQuantity": 78,  
    "recordedBy": "store\_staff\_01",  
    "recordedAt": "2026-04-20T22:13:30",  
    "page": 0,  
    "size": 20,  
    "totalItems": 10,  
    "totalPages": 1,  
    "hasNext": false,  
    "items": \[  
      {  
        "productId": "PROD001",  
        "productName": "Croissant",  
        "quantity": 5,  
        "unit": "pcs",  
        "unitPrice": 25000,  
        "lineTotal": 125000  
      }  
    \]  
  }  
}  
\`\`\`

**\#\#\# Lỗi thường gặp**  
\- 400 \`Report date is required\`  
\- 400 \`page must be \>= 0\`  
\- 400 \`size must be \> 0\`  
\- 404 \`No sales report found for this date\`

**\---**

**\#\# 5\. Store Manager \- API Chi Tiết**

**\#\# 5.1 Get Daily Revenue By Date Range**

\- Method: \`GET\`  
\- URL: \`/api/manager/sales/daily\`  
\- Permission: \`SALES\_REPORT\_VIEW\`  
\- Query:  
  \- \`fromDate\` (optional)  
  \- \`toDate\` (optional)  
  \- \`storeId\` (optional)

Nếu truyền \`storeId\` thì dữ liệu trong \`days\[\].stores\` chỉ còn store đó.

**\#\#\# Response mẫu**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Daily revenue report retrieved successfully",  
  "data": {  
    "fromDate": "2026-04-01",  
    "toDate": "2026-04-30",  
    "totalRevenue": 25000,  
    "dayCount": 1,  
    "days": \[  
      {  
        "reportDate": "2026-04-20",  
        "totalRevenue": 25000,  
        "storeCount": 1,  
        "stores": \[  
          {  
            "storeId": "ST001",  
            "storeName": "Store District 1",  
            "totalRevenue": 25000,  
            "reportCount": 1  
          }  
        \]  
      }  
    \]  
  }  
}  
\`\`\`

**\#\#\# Lỗi thường gặp**  
\- 400 \`fromDate must be before or equal to toDate\`

**\---**

**\#\# 5.2 Get Total Revenue (Store Breakdown)**

\- Method: \`GET\`  
\- URL: \`/api/manager/sales/total\`  
\- Permission: \`SALES\_REPORT\_VIEW\`  
\- Query:  
  \- \`fromDate\` (optional)  
  \- \`toDate\` (optional)  
  \- \`storeId\` (optional)

**\#\#\# Hành vi quan trọng**  
\- Không truyền \`storeId\`:  
  \- Trả tổng doanh thu toàn hệ theo range.  
  \- Trả breakdown theo từng store trong \`stores\`.  
\- Có truyền \`storeId\`:  
  \- Vẫn trả \`stores\` dạng list, nhưng list chỉ có 1 store.  
  \- Phù hợp FE giữ một model dữ liệu thống nhất.

**\#\#\# Response mẫu (không truyền storeId)**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Store total revenue retrieved successfully",  
  "data": {  
    "fromDate": "2026-04-01",  
    "toDate": "2026-04-30",  
    "totalReportRevenue": 6025000,  
    "storeCount": 2,  
    "stores": \[  
      {  
        "storeId": "ST001",  
        "storeName": "Store District 1",  
        "totalReportRevenue": 25000  
      },  
      {  
        "storeId": "ST002",  
        "storeName": "Store District 2",  
        "totalReportRevenue": 6000000  
      }  
    \]  
  }  
}  
\`\`\`

**\#\#\# Response mẫu (có storeId=ST001)**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "Store total revenue retrieved successfully",  
  "data": {  
    "fromDate": "2026-04-01",  
    "toDate": "2026-04-30",  
    "totalReportRevenue": 25000,  
    "storeCount": 1,  
    "stores": \[  
      {  
        "storeId": "ST001",  
        "storeName": "Store District 1",  
        "totalReportRevenue": 25000  
      }  
    \]  
  }  
}  
\`\`\`

**\#\#\# Lỗi thường gặp**  
\- 400 \`fromDate must be before or equal to toDate\`

**\---**

**\#\# 5.3 Get All Stores For Filter**

\- Method: \`GET\`  
\- URL: \`/api/manager/sales/stores\`  
\- Permission: \`SALES\_REPORT\_VIEW\`

**\#\#\# Response**  
\`data\` là array \`StoreResponse\` (id, name, address, phone, manager, status, openDate, createdAt, updatedAt).

Mục đích FE:  
\- Populate dropdown store filter cho màn hình doanh thu.

**\---**

**\#\# 5.4 Get All Kitchens For Filter**

\- Method: \`GET\`  
\- URL: \`/api/manager/sales/kitchens\`  
\- Permission: \`SALES\_REPORT\_VIEW\`

**\#\#\# Response**  
\`data\` là array \`KitchenResponse\` (id, name, address, phone, capacity, status, createdAt, updatedAt).

Mục đích FE:  
\- Đồng bộ filter UI (nếu màn hình doanh thu dùng bộ lọc chung với màn hình khác).

**\---**

**\#\# 5.5 Export Daily Revenue Report (Excel)**

\- Method: \`GET\`  
\- URL: \`/api/manager/sales/daily/export\`  
\- Permission: \`SALES\_REPORT\_VIEW\`  
\- Query:  
  \- \`fromDate\` (optional)  
  \- \`toDate\` (optional)  
  \- \`storeId\` (optional)

**\#\#\# Response**  
\- Content-Type:  
  \- \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\`  
\- File name:  
  \- \`manager\_daily\_revenue\_yyyyMMdd\_HHmmss.xlsx\`

**\#\#\# Workbook layout**  
\- Sheet \`summary\`:  
  \- from\_date, to\_date, store\_filter, day\_count, total\_revenue  
  \- bảng ngang \`Store Revenue Breakdown\` (mỗi cột là 1 store)  
\- Sheet \`daily\_details\`:  
  \- \`report\_date\`, \`store\_id\`, \`store\_name\`, \`store\_total\_revenue\`

**\#\#\# Lỗi thường gặp**  
\- 400 \`fromDate must be before or equal to toDate\`  
\- 500 \`Cannot export manager revenue report\`

**\---**

**\#\# 6\. Frontend Integration Flow Khuyến Nghị**

**\#\# 6.1 Store Staff (cuối ngày)**  
1\. Tải template từ \`/api/store/sales/template\` (nếu cần).  
2\. Người dùng điền Excel đúng cột/rule.  
3\. Gọi \`/api/store/sales/import?date=...\`.  
4\. Nếu cần sửa dữ liệu:  
   \- Gọi \`/api/store/sales?date=...\` để clear.  
   \- Import lại file đã sửa.  
5\. Hiển thị lịch sử từ \`/api/store/sales/daily\` và chi tiết từ \`/api/store/sales/daily/detail\`.

**\#\# 6.2 Store Manager (theo dõi)**  
1\. Load dropdown store bằng \`/api/manager/sales/stores\`.  
2\. Khi user chọn range/store:  
   \- Gọi \`/api/manager/sales/total\` để lấy KPI tổng \+ breakdown store.  
   \- Gọi \`/api/manager/sales/daily\` để render chart theo ngày.  
3\. Khi bấm export, gọi \`/api/manager/sales/daily/export\`.

**\---**

**\#\# 7\. Edge Cases FE Cần Xử Lý**

1\. Dữ liệu rỗng:  
\- \`days: \[\]\` hoặc \`stores: \[\]\` là bình thường khi chưa có report trong range.

2\. Không truyền from/to date:  
\- Backend cho phép null, FE có thể dùng default range theo UX.

3\. Định dạng ngày:  
\- Luôn gửi ISO date \`yyyy-MM-dd\`.

4\. Đồng bộ timezone:  
\- Backend xử lý theo Asia/Ho\_Chi\_Minh cho mốc ghi nhận.  
\- FE nên hiển thị date/time nhất quán timezone VN.

5\. Idempotency import:  
\- Cùng store \+ cùng date chỉ có 1 report.  
\- Muốn import lại bắt buộc clear trước.

6\. Token/permission lỗi:  
\- 401 khi token sai/hết hạn.  
\- 403 khi user thiếu quyền tương ứng.

**\---**

**\#\# 8\. Quick Test Checklist (QA/UAT)**

**\#\#\# Store Staff**  
\- \[ \] Download template thành công.  
\- \[ \] Import file hợp lệ thành công.  
\- \[ \] Import trùng ngày báo 409\.  
\- \[ \] Import quantity vượt stock báo 400\.  
\- \[ \] Clear report thành công và có thể import lại cùng ngày.  
\- \[ \] Daily list phân trang đúng.  
\- \[ \] Daily detail phân trang item đúng.

**\#\#\# Manager**  
\- \[ \] \`/daily\` trả đúng \`days\[\].stores\` theo range.  
\- \[ \] \`/total\` không truyền storeId trả breakdown nhiều store.  
\- \[ \] \`/total\` có storeId vẫn trả list \`stores\` gồm đúng 1 phần tử.  
\- \[ \] \`/stores\` và \`/kitchens\` trả danh sách đầy đủ.  
\- \[ \] Export Excel mở được và đúng số liệu.

**\---**

**\#\# 9\. Ghi chú cho team**

\- API \`GET /api/manager/sales/total\` hiện đã bỏ field top-level \`storeId\` và \`storeName\` trong \`data\`.  
\- FE nên lấy thông tin store hoàn toàn từ \`data.stores\[\]\` để tránh null handling không cần thiết.  
\- Nếu cần mở rộng filter theo kitchen thật sự ở doanh thu, hiện tại API doanh thu chưa nhận \`kitchenId\`; cần bổ sung backend riêng.

# delivery-flow-e2e

**\# Shipper QR Delivery Flow API Integration Guide (FE)**

Tai lieu nay mo ta day du luong giao nhan moi:  
\- Dieu phoi vien sinh QR nhan don theo order  
\- QR duoc dan len thung hang de shipper quet  
\- He thong tu sinh deliveryId (ma van don) neu chua co  
\- Shipper danh dau da giao thanh cong (cho cua hang xac nhan)  
\- Store staff xac nhan da nhan don de chot don hoan tat

Muc tieu: FE noi API theo dung thu tu, de hieu, khong can doan nghiep vu.

\---

**\#\# 1\) Tong quan va pham vi**

\- Prefix Supply Coordinator: /api/supply-coordinator  
\- Prefix Shipper: /api/shipper  
\- Prefix Store Staff: /api/store  
\- Auth: JWT Bearer token  
\- Content-Type: application/json

Response thanh cong:

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

Response loi:

\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

\---

**\#\# 2\) Trang thai chinh can map o FE**

**\#\#\# 2.1) Delivery status**  
\- ASSIGNED  
\- SHIPPING  
\- DELAYED  
\- WAITING\_CONFIRM  
\- DELIVERED  
\- CANCELLED

**\#\#\# 2.2) Order status lien quan luong giao nhan**  
\- PACKED\_WAITING\_SHIPPER  
\- SHIPPING  
\- DELIVERED  
\- CANCELLED

**\#\#\# 2.3) Y nghia moc thoi gian**  
\- pickedUpAt: luc shipper nhan don sau khi quet QR  
\- deliveredAt: luc shipper bao da giao thanh cong (mark-success)  
\- Store confirm KHONG ghi de deliveredAt neu da co

\---

**\#\# 3\) End-to-end flow cho FE**

**\#\# Buoc 1: Dieu phoi vien sinh QR theo order**

Endpoint:  
\- Method: GET  
\- URL: /api/supply-coordinator/orders/{orderId}/pickup-qr  
\- Permission: SUPPLY\_DELIVERY\_VIEW

Muc dich:  
\- Lay ma QR de dan len thung hang  
\- Neu order chua co delivery thi backend tu tao delivery  
\- deliveryId duoc sinh tai buoc nay neu can

Dieu kien sinh moi delivery:  
\- Order status phai la PACKED\_WAITING\_SHIPPER hoac SHIPPING

Response data:

\`\`\`json  
{  
  "orderId": "ORD002",  
  "deliveryId": "DEL0421008",  
  "pickupQrCode": "PK-ORD002-3D451097",  
  "deliveryStatus": "ASSIGNED"  
}  
\`\`\`

Goi y FE:  
\- In pickupQrCode thanh QR image  
\- Hien deliveryId tren label van don  
\- Luu mapping orderId \<-\> deliveryId de tra cuu nhanh

\---

**\#\# Buoc 2: (Optional) Shipper xem don dang cho nhan**

Endpoint:  
\- Method: GET  
\- URL: /api/shipper/orders/available?page=0\&size=20  
\- Permission: SHIPPER\_DELIVERY\_VIEW

Muc dich:  
\- Hien list don da dong goi, co delivery va chua co shipper cam

\---

**\#\# Buoc 3: Shipper quet QR de nhan don**

Endpoint:  
\- Method: POST  
\- URL: /api/shipper/deliveries/scan-qr  
\- Permission: SHIPPER\_DELIVERY\_CLAIM  
\- Body:

\`\`\`json  
{  
  "qrCode": "PK-ORD002-3D451097"  
}  
\`\`\`

Backend cap nhat:  
\- delivery.shipper \= current shipper  
\- delivery.pickedUpAt \= now (neu chua co)  
\- delivery.status \= SHIPPING  
\- order.status \= SHIPPING  
\- order.shippingAt \= now (neu chua co)

\---

**\#\# Buoc 4: Shipper bao da giao thanh cong (cho store confirm)**

Endpoint:  
\- Method: PATCH  
\- URL: /api/shipper/deliveries/{deliveryId}/mark-success  
\- Permission: SHIPPER\_DELIVERY\_UPDATE  
\- Body (optional):

\`\`\`json  
{  
  "notes": "Da ban giao tai cua hang"  
}  
\`\`\`

Backend cap nhat:  
\- delivery.status \= WAITING\_CONFIRM  
\- delivery.deliveredAt \= now (neu chua co)  
\- order.status \= SHIPPING (van cho store staff xac nhan)

Response data se co deliveredAt da duoc set.

\---

**\#\# Buoc 5: Store staff xac nhan da nhan don**

Co 2 cach goi API, tuy context man hinh FE:

**\#\#\# Cach A \- Xac nhan theo order detail**  
\- Method: POST  
\- URL: /api/store/orders/{orderId}/confirm-receipt  
\- Permission: DELIVERY\_CONFIRM

**\#\#\# Cach B \- Xac nhan theo delivery**  
\- Method: POST  
\- URL: /api/store/deliveries/{deliveryId}/confirm  
\- Permission: DELIVERY\_CONFIRM

Body (bat buoc):

\`\`\`json  
{  
  "receiverName": "Nguyen Van A",  
  "temperatureOk": true,  
  "notes": "Nhan du so luong"  
}  
\`\`\`

Dieu kien backend cho xac nhan:  
\- delivery.status phai la SHIPPING hoac WAITING\_CONFIRM

Backend cap nhat:  
\- delivery.status \= DELIVERED  
\- order.status \= DELIVERED  
\- deliveredAt giu nguyen neu da co tu buoc mark-success

\---

**\#\# 4\) API tra cuu ai dang cam don (holder)**

**\#\#\# 4.1) Cho dieu phoi vien**  
\- Method: GET  
\- URL: /api/supply-coordinator/orders/{orderId}/holder  
\- Permission: SUPPLY\_DELIVERY\_VIEW

**\#\#\# 4.2) Cho shipper**  
\- Method: GET  
\- URL: /api/shipper/orders/{orderId}/holder  
\- Permission: SHIPPER\_DELIVERY\_VIEW

Response data:

\`\`\`json  
{  
  "orderId": "ORD002",  
  "deliveryId": "DEL0421008",  
  "orderStatus": "SHIPPING",  
  "deliveryStatus": "WAITING\_CONFIRM",  
  "pickupQrCode": "PK-ORD002-3D451097",  
  "holderUserId": 12,  
  "holderUsername": "shipper",  
  "holderFullName": "shipper Fullname",  
  "pickedUpAt": "2026-04-21T09:43:19.234103"  
}  
\`\`\`

\---

**\#\# 5\) Sequence goi API de FE noi nhanh**

1\. Supply UI: GET /api/supply-coordinator/orders/{orderId}/pickup-qr  
2\. In/dan QR \+ hien deliveryId tren thung hang  
3\. Shipper app: POST /api/shipper/deliveries/scan-qr  
4\. Shipper app: PATCH /api/shipper/deliveries/{deliveryId}/mark-success  
5\. Store app: POST /api/store/orders/{orderId}/confirm-receipt (hoac /deliveries/{deliveryId}/confirm)

\---

**\#\# 6\) Loi thuong gap va cach xu ly FE**

**\#\#\# 6.1) 400 Cannot generate pickup QR when order status is ...**  
Nguyen nhan:  
\- Order chua den PACKED\_WAITING\_SHIPPER/SHIPPING

Xu ly FE:  
\- Disable nut Sinh QR khi order status khong hop le

**\#\#\# 6.2) 400 This order is already claimed by another shipper**  
Nguyen nhan:  
\- QR da duoc shipper khac quet nhan

Xu ly FE:  
\- Show modal don da co nguoi nhan, refresh holder

**\#\#\# 6.3) 400 Delivery is not ready for store confirmation**  
Nguyen nhan:  
\- Store confirm sai trang thai (khong phai SHIPPING/WAITING\_CONFIRM)

Xu ly FE:  
\- Chi hien thi nut Xac nhan nhan hang khi status hop le

**\#\#\# 6.4) 404 Delivery not found for order**  
Nguyen nhan:  
\- orderId sai hoac order chua co delivery

Xu ly FE:  
\- Goi lai API pickup-qr de tao delivery neu order du dieu kien

\---

**\#\# 7\) Checklist UI/UX de de van hanh**

\- Hien thi ca orderId, deliveryId, pickupQrCode tren man hinh dieu phoi  
\- Co nut Copy QR code text de backup khi camera loi  
\- Sau scan thanh cong, refresh holder panel ngay  
\- Store dashboard co tab WAITING\_CONFIRM de xu ly nhanh  
\- Khi store confirm xong, disable nut confirm tranh double submit

\---

**\#\# 8\) Tinh tuong thich**

Flow nay da backward-compatible:  
\- Store van co the confirm tu SHIPPING  
\- Neu da co delivery truoc do, pickup-qr se tai su dung delivery hien tai va bo sung QR neu thieu

# manager\_inventory

**\# Manager Inventory API Integration Guide (FE)**

Tai lieu nay danh cho Frontend tich hop nhom API manager quan ly ton kho bep trung tam.

Pham vi:  
\- Danh sach ton kho theo nhom kitchen (kitchen chua list items).  
\- Tao / cap nhat / xoa item ton kho.  
\- Lay danh sach kitchen, ingredient, supplier de build filter/dropdown.

**\---**

**\#\# 1\) Base URL, Auth, Response Wrapper**

**\#\# 1.1 Base URL**  
\- Production: theo bien moi truong FE (\`VITE\_API\_BASE\_URL\`)

**\#\# 1.2 Authentication**  
Tat ca endpoint ben duoi deu can JWT Bearer token.

Header mau:  
\`\`\`http  
Authorization: Bearer \<access\_token\>  
\`\`\`

**\#\# 1.3 Success response wrapper**  
\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

**\#\# 1.4 Error response wrapper**  
\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

Tham chieu them: \`api-docs/error-response.md\`.

**\---**

**\#\# 2\) Permission Matrix**

\- \`INVENTORY\_VIEW\`  
  \- Xem danh sach ton kho manager  
  \- Xem danh sach kitchen  
  \- Xem danh sach ingredient  
  \- Xem danh sach supplier

\- \`INVENTORY\_MANAGE\`  
  \- Tao item ton kho  
  \- Cap nhat item ton kho  
  \- Xoa item ton kho

Luu y: endpoint duoc bao ve boi \`@SecuredEndpoint\`, thieu quyen se tra \`403\`.

**\---**

**\#\# 3\) Endpoint Overview (Prefix: \`/api/manager/inventory\`)**

\- \`GET /kitchen\`: danh sach ton kho theo nhom kitchen (phan trang)  
\- \`POST /kitchen\`: tao item ton kho  
\- \`PUT /kitchen/{id}\`: cap nhat item ton kho  
\- \`DELETE /kitchen/{id}\`: xoa item ton kho  
\- \`GET /kitchens\`: lay toan bo kitchen  
\- \`GET /ingredients\`: lay ingredient \+ unit chuan  
\- \`GET /suppliers\`: lay supplier distinct tu du lieu ton kho

**\---**

**\#\# 4\) API Details**

**\#\# 4.1 GET /api/manager/inventory/kitchen**

\- Permission: \`INVENTORY\_VIEW\`  
\- Query params:  
  \- \`kitchenId\` (optional)  
  \- \`lowStock\` (optional): \`true\` hoac \`false\`  
  \- \`page\` (default \`0\`)  
  \- \`size\` (default \`20\`)

**\#\#\# Logic quan trong**  
\- Response la danh sach **\*\*kitchen group\*\***, moi group co \`items\[\]\`.  
\- Pagination ap dung tren so luong kitchen group, **\*\*khong\*\*** ap dung tren so luong item trong tung kitchen.  
\- Neu khong truyen \`kitchenId\`: backend lay tat ca kitchen, sau do loai bo kitchen co \`items\` rong.  
\- \`lowStock=true\`: chi lay item co \`quantity \<= minStock\`.  
\- \`lowStock=false\`: chi lay item co \`quantity \> minStock\`.

**\#\#\# Response data shape**  
\`\`\`json  
{  
  "content": \[  
    {  
      "kitchenId": "KIT001",  
      "kitchenName": "Central Kitchen HCM",  
      "items": \[  
        {  
          "id": 1,  
          "ingredientId": "ING001",  
          "ingredientName": "Bột mì",  
          "quantity": 4,  
          "unit": "kg",  
          "minStock": 10,  
          "batchNo": "KINV-001",  
          "expiryDate": null,  
          "supplier": "Cong ty Bot Mi",  
          "updatedAt": "2026-04-16T11:27:48.484321",  
          "lowStock": true  
        }  
      \]  
    }  
  \],  
  "page": {  
    "size": 20,  
    "number": 0,  
    "totalElements": 1,  
    "totalPages": 1  
  }  
}  
\`\`\`

**\#\#\# Error thuong gap**  
\- \`404 Kitchen not found with id: \<kitchenId\>\` (khi truyen kitchenId khong ton tai)

**\---**

**\#\# 4.2 POST /api/manager/inventory/kitchen**

\- Permission: \`INVENTORY\_MANAGE\`  
\- Body: \`KitchenInventoryUpsertRequest\`

\`\`\`json  
{  
  "kitchenId": "KIT001",  
  "ingredientId": "ING001",  
  "quantity": 25,  
  "minStock": 10,  
  "batchNo": "BATCH-APR-001",  
  "expiryDate": "2026-05-15",  
  "supplier": "ABC Supplier"  
}  
\`\`\`

**\#\#\# Validation**  
\- \`kitchenId\`: bat buoc, toi da 10 ky tu  
\- \`ingredientId\`: bat buoc, toi da 10 ky tu  
\- \`quantity\`: bat buoc, \`\>= 0\`  
\- \`minStock\`: bat buoc, \`\>= 0\`  
\- \`batchNo\`: optional, toi da 30 ky tu  
\- \`expiryDate\`: optional (\`yyyy-MM-dd\`)  
\- \`supplier\`: optional, toi da 100 ky tu

**\#\#\# Unit handling (important)**  
\- Request **\*\*khong can gui unit\*\***.  
\- Backend tu lay \`unit\` chuan tu ingredient va save vao \`kitchen\_inventory.unit\`.  
\- FE can lay unit chuan qua API \`GET /api/manager/inventory/ingredients\`.

**\#\#\# Response data shape**  
\`data\` la \`KitchenInventoryResponse\`:  
\- \`id\`  
\- \`kitchenId\`  
\- \`kitchenName\`  
\- \`ingredientId\`  
\- \`ingredientName\`  
\- \`quantity\`  
\- \`unit\`  
\- \`minStock\`  
\- \`batchNo\`  
\- \`expiryDate\`  
\- \`supplier\`  
\- \`updatedAt\`  
\- \`lowStock\`

**\#\#\# Error thuong gap**  
\- \`404 Kitchen not found with id: ...\`  
\- \`404 Ingredient not found with id: ...\`  
\- \`400\` loi validate body

**\---**

**\#\# 4.3 PUT /api/manager/inventory/kitchen/{id}**

\- Permission: \`INVENTORY\_MANAGE\`  
\- Path param:  
  \- \`id\`: inventory id  
\- Body: giong \`KitchenInventoryUpsertRequest\`

**\#\#\# Response**  
\`data\` la \`KitchenInventoryResponse\` sau khi cap nhat.

**\#\#\# Error thuong gap**  
\- \`404 Kitchen inventory not found with id: ...\`  
\- \`404 Kitchen not found with id: ...\`  
\- \`404 Ingredient not found with id: ...\`  
\- \`400\` loi validate body

**\---**

**\#\# 4.4 DELETE /api/manager/inventory/kitchen/{id}**

\- Permission: \`INVENTORY\_MANAGE\`  
\- Path param:  
  \- \`id\`: inventory id

**\#\#\# Response**  
\- Message: \`Kitchen inventory item deleted successfully\`  
\- \`data\` thuong la \`null\`

**\#\#\# Error thuong gap**  
\- \`404 Kitchen inventory not found with id: ...\`

**\---**

**\#\# 4.5 GET /api/manager/inventory/kitchens**

\- Permission: \`INVENTORY\_VIEW\`  
\- Response: \`data\` la array \`KitchenResponse\`

\`KitchenResponse\` fields:  
\- \`id\`, \`name\`, \`address\`, \`phone\`, \`capacity\`, \`status\`, \`createdAt\`, \`updatedAt\`

**\---**

**\#\# 4.6 GET /api/manager/inventory/ingredients**

\- Permission: \`INVENTORY\_VIEW\`  
\- Response: \`data\` la array \`IngredientFilterOptionResponse\`

\`IngredientFilterOptionResponse\` fields:  
\- \`id\`  
\- \`name\`  
\- \`unit\`  \<- day la unit chuan FE nen dung khi hien thi form create/update

**\---**

**\#\# 4.7 GET /api/manager/inventory/suppliers**

\- Permission: \`INVENTORY\_VIEW\`  
\- Response: \`data\` la array \`string\`  
\- Nguon du lieu: supplier distinct trong bang \`kitchen\_inventory\`, sap xep tang dan.

**\---**

**\#\# 5\) FE Integration Flow (de noi nhanh)**

1\. Load dropdown kitchen: \`GET /api/manager/inventory/kitchens\`.  
2\. Load dropdown ingredient \+ unit chuan: \`GET /api/manager/inventory/ingredients\`.  
3\. (Optional) Load dropdown supplier: \`GET /api/manager/inventory/suppliers\`.  
4\. Load grid ton kho: \`GET /api/manager/inventory/kitchen?...\`.  
5\. Khi tao/sua item:  
   \- Gui \`kitchenId\`, \`ingredientId\`, \`quantity\`, \`minStock\`, ...  
   \- **\*\*Khong gui unit\*\***.  
   \- Hien thi unit tren UI tu ingredient da chon.

**\---**

**\#\# 6\) Permission Mapping theo Endpoint**

| Endpoint | Permission |  
|---|---|  
| \`GET /api/manager/inventory/kitchen\` | \`INVENTORY\_VIEW\` |  
| \`POST /api/manager/inventory/kitchen\` | \`INVENTORY\_MANAGE\` |  
| \`PUT /api/manager/inventory/kitchen/{id}\` | \`INVENTORY\_MANAGE\` |  
| \`DELETE /api/manager/inventory/kitchen/{id}\` | \`INVENTORY\_MANAGE\` |  
| \`GET /api/manager/inventory/kitchens\` | \`INVENTORY\_VIEW\` |  
| \`GET /api/manager/inventory/ingredients\` | \`INVENTORY\_VIEW\` |  
| \`GET /api/manager/inventory/suppliers\` | \`INVENTORY\_VIEW\` |

**\---**

**\#\# 7\) FE Checklist**

\- \[ \] Luon gui \`Authorization: Bearer \<token\>\`.  
\- \[ \] Parse response theo \`statusCode/message/data\`.  
\- \[ \] O list API \`/kitchen\`, hieu dung data: kitchen group \-\> \`items\[\]\`.  
\- \[ \] Khong hardcode unit tay; luon lay unit tu \`/ingredients\`.  
\- \[ \] Payload create/update khong gui field \`unit\`.  
\- \[ \] Xu ly 404 cho kitchen/ingredient/inventory khong ton tai.

**\---**

**\#\# 8\) API Support Matrix theo Tung Tac Vu FE**

Bang nay tra loi truc tiep: "manager can goi API nao de ho tro create/update/filter/quan ly?"

| Tac vu FE | API can goi | Bat buoc/Optional | Muc dich |  
|---|---|---|---|  
| Load trang manager inventory | \`GET /api/manager/inventory/kitchens\` | Bat buoc | Lay dropdown kitchen filter |  
| Load trang manager inventory | \`GET /api/manager/inventory/ingredients\` | Bat buoc | Lay ingredient \+ unit chuan cho form create/update |  
| Load trang manager inventory | \`GET /api/manager/inventory/suppliers\` | Optional | Lay danh sach supplier de filter UI |  
| Load grid mac dinh | \`GET /api/manager/inventory/kitchen?page=0\&size=20\` | Bat buoc | Lay data grid dang grouped theo kitchen |  
| Filter theo kitchen | \`GET /api/manager/inventory/kitchen?kitchenId=KIT001\&page=0\&size=20\` | Bat buoc neu co kitchen filter | Loc du lieu theo kitchen |  
| Filter low stock | \`GET /api/manager/inventory/kitchen?lowStock=true\&page=0\&size=20\` | Optional | Loc item sap can bo sung |  
| Create item | \`POST /api/manager/inventory/kitchen\` | Bat buoc | Tao item ton kho moi |  
| Update item | \`PUT /api/manager/inventory/kitchen/{id}\` | Bat buoc | Cap nhat item ton kho |  
| Delete item | \`DELETE /api/manager/inventory/kitchen/{id}\` | Bat buoc | Xoa item ton kho |  
| Refresh grid sau create/update/delete | Goi lai \`GET /api/manager/inventory/kitchen?...\` theo filter hien tai | Bat buoc | Dong bo UI voi du lieu moi |

**\---**

**\#\# 9\) Call Flow Chuan Cho Tung Chuc Nang**

**\#\# 9.1 Flow Load Trang**

1\. Goi song song:  
   \- \`GET /api/manager/inventory/kitchens\`  
   \- \`GET /api/manager/inventory/ingredients\`  
   \- \`GET /api/manager/inventory/suppliers\` (neu UI co supplier filter)  
2\. Goi grid lan dau:  
   \- \`GET /api/manager/inventory/kitchen?page=0\&size=20\`

Ket qua mong doi:  
\- Dropdown kitchen co du lieu  
\- Dropdown ingredient co \`id/name/unit\`  
\- Grid ton kho render theo nhom kitchen \-\> items

**\#\# 9.2 Flow Create Item Ton Kho**

API ho tro bat buoc truoc khi bam Save:  
\- \`GET /api/manager/inventory/kitchens\`  
\- \`GET /api/manager/inventory/ingredients\`

Thu tu xu ly FE:  
1\. User chon \`kitchenId\` tu dropdown kitchen.  
2\. User chon \`ingredientId\` tu dropdown ingredient.  
3\. FE hien thi unit read-only theo ingredient da chon (\`unit\` lay tu API ingredients).  
4\. FE submit:

\`\`\`json  
POST /api/manager/inventory/kitchen  
{  
  "kitchenId": "KIT001",  
  "ingredientId": "ING001",  
  "quantity": 25,  
  "minStock": 10,  
  "batchNo": "BATCH-APR-001",  
  "expiryDate": "2026-05-15",  
  "supplier": "ABC Supplier"  
}  
\`\`\`

5\. Sau khi 200, FE goi lai grid theo filter hien tai:  
   \- \`GET /api/manager/inventory/kitchen?...\`

Luu y:  
\- Khong gui field \`unit\` trong payload create.  
\- Neu gui kitchenId/ingredientId khong ton tai \-\> 404\.

**\#\# 9.3 Flow Update Item Ton Kho**

API ho tro bat buoc:  
\- \`GET /api/manager/inventory/ingredients\` de cap nhat dropdown ingredient va unit chuan.

Thu tu xu ly FE:  
1\. Tu item tren grid lay \`id\` de update.  
2\. User chinh sua cac truong cho phep: kitchen, ingredient, quantity, minStock, batchNo, expiryDate, supplier.  
3\. FE submit:

\`\`\`json  
PUT /api/manager/inventory/kitchen/{*id*}  
{  
  "kitchenId": "KIT001",  
  "ingredientId": "ING002",  
  "quantity": 18,  
  "minStock": 8,  
  "batchNo": "BATCH-APR-002",  
  "expiryDate": "2026-06-01",  
  "supplier": "ABC Supplier"  
}  
\`\`\`

4\. Sau khi 200, goi lai list:  
   \- \`GET /api/manager/inventory/kitchen?...\`

Luu y:  
\- Khong gui field \`unit\` trong payload update.  
\- Neu \`{id}\` khong ton tai \-\> 404 Kitchen inventory not found.

**\#\# 9.4 Flow Delete Item**

Thu tu xu ly FE:  
1\. User bam delete tren item co \`id\`.  
2\. Goi:  
   \- \`DELETE /api/manager/inventory/kitchen/{id}\`  
3\. Sau khi 200, refresh list:  
   \- \`GET /api/manager/inventory/kitchen?...\`

**\#\# 9.5 Flow Filter**

Manager inventory list hien chi support filter:  
\- \`kitchenId\`  
\- \`lowStock\`  
\- \`page\`, \`size\`

Vi du:  
\- Theo kitchen: \`GET /api/manager/inventory/kitchen?kitchenId=KIT001\&page=0\&size=20\`  
\- Theo low stock: \`GET /api/manager/inventory/kitchen?lowStock=true\&page=0\&size=20\`  
\- Ket hop: \`GET /api/manager/inventory/kitchen?kitchenId=KIT001\&lowStock=true\&page=0\&size=20\`

Luu y quan trong:  
\- API list hien KHONG support query \`ingredientId\`, \`ingredientName\`, \`supplier\`.  
\- Neu FE muon loc UI theo ingredient/supplier thi can loc client-side tren du lieu \`items\[\]\` sau khi nhan response.

**\---**

**\#\# 10\) Payload Contract Cho Form Create/Update**

\`KitchenInventoryUpsertRequest\` chinh xac hien tai:

\`\`\`json  
{  
  "kitchenId": "string (required, max 10)",  
  "ingredientId": "string (required, max 10)",  
  "quantity": "number \>= 0 (required)",  
  "minStock": "integer \>= 0 (required)",  
  "batchNo": "string (optional, max 30)",  
  "expiryDate": "yyyy-MM-dd (optional)",  
  "supplier": "string (optional, max 100)"  
}  
\`\`\`

Khong co field \`unit\` trong request.

**\---**

**\#\# 11\) FE Error Handling Nhanh**

\- \`400\`:  
  \- Loi validate input (\`quantity\`, \`minStock\`, max length, ...)  
\- \`403\`:  
  \- Thieu permission (\`INVENTORY\_VIEW\` hoac \`INVENTORY\_MANAGE\`)  
\- \`404\`:  
  \- Kitchen/Ingredient/Inventory item khong ton tai

Khuyen nghi UX:  
1\. Neu \`403\`: hien thong bao "Ban khong co quyen thao tac ton kho".  
2\. Neu \`404\` sau khi update/delete: dong modal \+ refresh list de tranh stale data.  
3\. Neu \`400\`: hien loi ngay duoi field theo message backend.

# env-be

SPRING\_APPLICATION\_NAME=demo-login

\#SPRING\_DATASOURCE\_URL=jdbc:postgresql://ep-purple-lake-aer3je2g-pooler.c-2.us-east-2.aws.neon.tech:5432/demo?sslmode=require\&channelBinding=require  
\#SPRING\_DATASOURCE\_USERNAME=neondb\_owner  
\#SPRING\_DATASOURCE\_PASSWORD=npg\_r4nWhIyJNX3s

SPRING\_DATASOURCE\_URL=jdbc:mysql://demo-caovanducanh24012004-2533.h.aivencloud.com:19084/swp?sslMode=REQUIRED  
SPRING\_DATASOURCE\_USERNAME=avnadmin  
SPRING\_DATASOURCE\_PASSWORD=AVNS\_BTEvaJD57VIz6QmLQfV

\#SPRING\_DATASOURCE\_URL=jdbc:mysql://localhost:3306/demo  
\#SPRING\_DATASOURCE\_USERNAME=root  
\#SPRING\_DATASOURCE\_PASSWORD=

JWT\_SECRET=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90  
JWT\_EXPIRATION\_MS=36000000  
JWT\_REFRESH\_EXPIRATION\_MS=86400000

SPRING\_MAIL\_HOST=smtp.gmail.com  
SPRING\_MAIL\_PORT=587  
SPRING\_MAIL\_USERNAME=movie.theater.group5@gmail.com  
SPRING\_MAIL\_PASSWORD=lkki ahll hvzp rnox  
SPRING\_MAIL\_PROPERTIES\_MAIL\_SMTP\_AUTH=true  
SPRING\_MAIL\_PROPERTIES\_MAIL\_SMTP\_STARTTLS\_ENABLE=true

SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_CLIENT\_ID=810672600397-diud313oig8vvnm3qismm1fr0s873kin.apps.googleusercontent.com  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_CLIENT\_SECRET=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  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_SCOPE=email,profile  
\#\# Avoid hardcoding redirect URIs here (use dynamic {baseUrl} template in application.properties)  
\#SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_REDIRECT\_URI=http://localhost:8080/login/oauth2/code/google

SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_CLIENT\_ID=1208464637168510  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_CLIENT\_SECRET=25b722e9705128634e7b3f212fc61c24  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_SCOPE=email,public\_profile  
\#\# Avoid hardcoding redirect URIs here (use dynamic {baseUrl} template in application.properties)  
\#SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_REDIRECT\_URI=http://localhost:8080/login/oauth2/code/facebook  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_TOKEN\_URI=https://graph.facebook.com/oauth/access\_token  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_USER\_INFO\_URI=https://graph.facebook.com/me?fields=id,name,email  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_AUTHORIZATION\_URI=https://www.facebook.com/v12.0/dialog/oauth

FRONTEND\_BASE\_URL=http://localhost:3000/

\# Mobile deep link for OAuth2 mobile flows  
FRONTEND\_MOBILE\_BASE\_URL=bestie://login?

\# LiveKit Configuration  
LIVEKIT\_URL=wss://mozenith-8m25cc8l.livekit.cloud  
LIVEKIT\_API\_KEY=APIZGcQvwWGvGTx  
LIVEKIT\_API\_SECRET=5fFy3hVH6EQqBY6U8Wc2AG1qfBTzmhRidtjdS7XeCKaB

\# PayOS configuration (https://my.payos.vn/)  
PAYOS\_CLIENT\_ID=e9e4e228-7a80-4ebd-a207-167a87cb2c85  
PAYOS\_API\_KEY=c9a6fd8d-3af4-4f65-8601-c4f9a982b11f  
PAYOS\_CHECKSUM\_KEY=f940853eaff4d07a059feb6894b5cdd42390db3733f3dff66b017356a4607c1b

PAYOS\_WEBHOOK\_URL=https://be.ducanhvipro.dpdns.org/api/payment/webhook  
PAYOS\_RETURN\_URL=https://be.ducanhvipro.dpdns.org/api/payment/success  
PAYOS\_CANCEL\_URL=https://be.ducanhvipro.dpdns.org/api/payment/cancel

\# MinIO (Render)  
MINIO\_ENDPOINT=https://minio-server-swp.onrender.com  
MINIO\_ACCESS\_KEY=admin  
MINIO\_SECRET\_KEY=admin123  
MINIO\_BUCKET\_NAME=products  
MINIO\_PUBLIC\_URL=https://minio-server-swp.onrender.com

SPRING\_APPLICATION\_NAME=demo-login

\#SPRING\_DATASOURCE\_URL=jdbc:postgresql://ep-purple-lake-aer3je2g-pooler.c-2.us-east-2.aws.neon.tech:5432/demo?sslmode=require\&channelBinding=require  
\#SPRING\_DATASOURCE\_USERNAME=neondb\_owner  
\#SPRING\_DATASOURCE\_PASSWORD=npg\_r4nWhIyJNX3s

SPRING\_DATASOURCE\_URL=jdbc:mysql://demo-caovanducanh24012004-2533.h.aivencloud.com:19084/swp?sslMode=REQUIRED  
SPRING\_DATASOURCE\_USERNAME=avnadmin  
SPRING\_DATASOURCE\_PASSWORD=AVNS\_BTEvaJD57VIz6QmLQfV

\#SPRING\_DATASOURCE\_URL=jdbc:mysql://localhost:3306/demo  
\#SPRING\_DATASOURCE\_USERNAME=root  
\#SPRING\_DATASOURCE\_PASSWORD=

JWT\_SECRET=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90  
JWT\_EXPIRATION\_MS=36000000  
JWT\_REFRESH\_EXPIRATION\_MS=86400000

SPRING\_MAIL\_HOST=smtp.gmail.com  
SPRING\_MAIL\_PORT=587  
SPRING\_MAIL\_USERNAME=movie.theater.group5@gmail.com  
SPRING\_MAIL\_PASSWORD=lkki ahll hvzp rnox  
SPRING\_MAIL\_PROPERTIES\_MAIL\_SMTP\_AUTH=true  
SPRING\_MAIL\_PROPERTIES\_MAIL\_SMTP\_STARTTLS\_ENABLE=true

SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_CLIENT\_ID=810672600397-diud313oig8vvnm3qismm1fr0s873kin.apps.googleusercontent.com  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_CLIENT\_SECRET=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  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_SCOPE=email,profile  
\#\# Avoid hardcoding redirect URIs here (use dynamic {baseUrl} template in application.properties)  
\#SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_GOOGLE\_REDIRECT\_URI=http://localhost:8080/login/oauth2/code/google

SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_CLIENT\_ID=1208464637168510  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_CLIENT\_SECRET=25b722e9705128634e7b3f212fc61c24  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_SCOPE=email,public\_profile  
\#\# Avoid hardcoding redirect URIs here (use dynamic {baseUrl} template in application.properties)  
\#SPRING\_SECURITY\_OAUTH2\_CLIENT\_REGISTRATION\_FACEBOOK\_REDIRECT\_URI=http://localhost:8080/login/oauth2/code/facebook  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_TOKEN\_URI=https://graph.facebook.com/oauth/access\_token  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_USER\_INFO\_URI=https://graph.facebook.com/me?fields=id,name,email  
SPRING\_SECURITY\_OAUTH2\_CLIENT\_PROVIDER\_FACEBOOK\_AUTHORIZATION\_URI=https://www.facebook.com/v12.0/dialog/oauth

FRONTEND\_BASE\_URL=http://localhost:3000/

\# Mobile deep link for OAuth2 mobile flows  
FRONTEND\_MOBILE\_BASE\_URL=bestie://login?

\# LiveKit Configuration  
LIVEKIT\_URL=wss://mozenith-8m25cc8l.livekit.cloud  
LIVEKIT\_API\_KEY=APIZGcQvwWGvGTx  
LIVEKIT\_API\_SECRET=5fFy3hVH6EQqBY6U8Wc2AG1qfBTzmhRidtjdS7XeCKaB

\# PayOS configuration (https://my.payos.vn/)  
PAYOS\_CLIENT\_ID=e9e4e228-7a80-4ebd-a207-167a87cb2c85  
PAYOS\_API\_KEY=c9a6fd8d-3af4-4f65-8601-c4f9a982b11f  
PAYOS\_CHECKSUM\_KEY=f940853eaff4d07a059feb6894b5cdd42390db3733f3dff66b017356a4607c1b

PAYOS\_WEBHOOK\_URL=https://be.ducanhvipro.dpdns.org/api/payment/webhook  
PAYOS\_RETURN\_URL=https://be.ducanhvipro.dpdns.org/api/payment/success  
PAYOS\_CANCEL\_URL=https://be.ducanhvipro.dpdns.org/api/payment/cancel

\# MinIO (Render)  
MINIO\_ENDPOINT=https://minio-server-swp.onrender.com  
MINIO\_ACCESS\_KEY=admin  
MINIO\_SECRET\_KEY=admin123  
MINIO\_BUCKET\_NAME=products  
MINIO\_PUBLIC\_URL=https://minio-server-swp.onrender.com

# shipper-distance

**\# Hướng dẫn tích hợp API Luồng giao nhận hàng qua mã QR cho Shipper (FE)**

Tài liệu này mô tả đầy đủ luồng giao nhận hàng mới:  
\- Điều phối viên sinh mã QR nhận đơn theo từng đơn hàng (Order).  
\- Mã QR được dán lên thùng hàng để Shipper quét nhận đơn.  
\- Hệ thống tự động sinh mã vận đơn (deliveryId) nếu chưa có.  
\- Shipper đánh dấu đã giao hàng thành công (chờ cửa hàng xác nhận).  
\- Nhân viên cửa hàng (Store Staff) xác nhận đã nhận đơn để hoàn tất quy trình.

**\*\*Mục tiêu\*\***: Đội ngũ Frontend (FE) kết nối API theo đúng thứ tự, dễ hiểu và không cần phải đoán nghiệp vụ.

\---

**\#\# 1\) Tổng quan và Phạm vi**

\- **\*\*Prefix Điều phối viên (Supply Coordinator)\*\***: \`/api/supply-coordinator\`  
\- **\*\*Prefix Shipper\*\***: \`/api/shipper\`  
\- **\*\*Prefix Nhân viên cửa hàng (Store Staff)\*\***: \`/api/store\`  
\- **\*\*Xác thực (Auth)\*\***: JWT Bearer token  
\- **\*\*Content-Type\*\***: \`application/json\`

**\*\*Phản hồi thành công (Success Response):\*\***

\`\`\`json  
{  
  "statusCode": 200,  
  "message": "...",  
  "data": {}  
}  
\`\`\`

**\*\*Phản hồi lỗi (Error Response):\*\***

\`\`\`json  
{  
  "statusCode": 400,  
  "message": "...",  
  "data": null  
}  
\`\`\`

\---

**\#\# 2\) Các trạng thái chính cần ánh xạ (Map) ở FE**

**\#\#\# 2.1) Trạng thái Vận đơn (Delivery status)**  
\- \`ASSIGNED\`: Đã được tạo, đang chờ shipper nhận.  
\- \`SHIPPING\`: Shipper đang đi giao hàng.  
\- \`DELAYED\`: Gặp sự cố (tùy chọn).  
\- \`WAITING\_CONFIRM\`: Shipper đã giao tới nơi, chờ cửa hàng xác nhận.  
\- \`DELIVERED\`: Hoàn tất giao nhận.  
\- \`CANCELLED\`: Đã hủy.

**\#\#\# 2.2) Trạng thái Đơn hàng (Order status) liên quan**  
\- \`PACKED\_WAITING\_SHIPPER\`: Đã đóng gói, chờ shipper.  
\- \`SHIPPING\`: Đang trong quá trình vận chuyển.  
\- \`DELIVERED\`: Đã giao hàng xong.  
\- \`CANCELLED\`: Đã hủy đơn.

**\#\#\# 2.3) Ý nghĩa các mốc thời gian**  
\- \`pickedUpAt\`: Lúc shipper nhận đơn sau khi quét mã QR thành công.  
\- \`deliveredAt\`: Lúc shipper báo đã giao hàng thành công (qua nút mark-success).

\---

**\#\# 3\) Quy trình tích hợp chi tiết cho FE**

**\#\#\# Bước 1: Điều phối viên sinh mã QR theo đơn hàng**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/supply-coordinator/orders/{orderId}/pickup-qr\`  
\- **\*\*Quyền (Permission)\*\***: \`SUPPLY\_DELIVERY\_VIEW\`

**\*\*Mục đích:\*\***  
\- Lấy mã QR để dán lên thùng hàng.  
\- Nếu đơn hàng chưa có bản ghi giao hàng (delivery), backend sẽ tự động tạo mới.

**\*\*Dữ liệu phản hồi:\*\***  
\`\`\`json  
{  
  "orderId": "ORD002",  
  "deliveryId": "DEL0421008",  
  "pickupQrCode": "PK-ORD002-3D451097",  
  "deliveryStatus": "ASSIGNED"  
}  
\`\`\`

\---

**\#\#\# Bước 2: (Tùy chọn) Shipper xem các đơn đang chờ nhận**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/shipper/orders/available?page=0\&size=20\&lat=10.77\&lon=106.7\`  
\- **\*\*Quyền\*\***: \`SHIPPER\_DELIVERY\_VIEW\`

**\*\*Mục đích:\*\***  
\- Hiển thị danh sách các đơn đã đóng gói, có thông tin giao hàng nhưng chưa có người nhận.  
\- **\*\*Tính toán Khoảng cách\*\***: Nếu truyền \`lat\` và \`lon\`, hệ thống sẽ tính khoảng cách (km) từ vị trí của shipper đến kho (Central Kitchen) và tự động sắp xếp đơn gần nhất lên đầu.

\---

**\#\#\# Bước 3: Shipper quét mã QR để nhận đơn**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/shipper/deliveries/scan-qr\`  
\- **\*\*Quyền\*\***: \`SHIPPER\_DELIVERY\_CLAIM\`  
\- **\*\*Body\*\***:  
\`\`\`json  
{  
  "qrCode": "PK-ORD002-3D451097"  
}  
\`\`\`

\---

**\#\#\# Bước 3.5: Shipper xem danh sách đơn mình đang nhận (My Deliveries)**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/shipper/deliveries/my?page=0\&size=20\&lat=10.77\&lon=106.7\`  
\- **\*\*Quyền\*\***: \`SHIPPER\_DELIVERY\_VIEW\`

**\*\*Mục đích:\*\***  
\- Xem lại các đơn hàng đã nhận và đang trong quá trình đi giao.  
\- **\*\*Khoảng cách & Lộ trình\*\***: Nếu truyền \`lat\` và \`lon\`, hệ thống sẽ tính khoảng cách thực tế (km) đến **\*\*Cửa hàng đích (Store)\*\***.  
\- **\*\*Thông tin chi tiết\*\***: Mỗi mục trong danh sách bao gồm:  
    \- \`distance\`: Khoảng cách thực tế đến cửa hàng (km).  
    \- \`storeName\`, \`storeAddress\`: Tên và địa chỉ chi tiết nơi giao hàng.  
    \- \`storeLatitude\`, \`storeLongitude\`: Tọa độ cửa hàng để mở bản đồ (Google Maps).

\---

**\#\#\# Bước 3.6: Xem chi tiết một vận đơn**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`GET\`  
\- **\*\*URL\*\***: \`/api/shipper/deliveries/{deliveryId}\`  
\- **\*\*Quyền\*\***: \`SHIPPER\_DELIVERY\_VIEW\`

**\*\*Mục đích:\*\***  
\- Tra cứu nhanh thông tin chi tiết của một vận đơn cụ thể, bao gồm đầy đủ địa chỉ và tọa độ cửa hàng.

\---

**\#\#\# Bước 4: Shipper báo đã giao hàng thành công (Chờ cửa hàng xác nhận)**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`PATCH\`  
\- **\*\*URL\*\***: \`/api/shipper/deliveries/{deliveryId}/mark-success\`  
\- **\*\*Quyền\*\***: \`SHIPPER\_DELIVERY\_UPDATE\`  
\- **\*\*Body (Tùy chọn)\*\***:  
\`\`\`json  
{  
  "notes": "Đã bàn giao hàng tại cửa hàng"  
}  
\`\`\`

\---

**\#\#\# Bước 5: Nhân viên cửa hàng xác nhận đã nhận hàng**

**\*\*Endpoint:\*\***  
\- **\*\*Method\*\***: \`POST\`  
\- **\*\*URL\*\***: \`/api/store/orders/{orderId}/confirm-receipt\`  
\- **\*\*Quyền\*\***: \`STORE\_ORDER\_UPDATE\`

**\*\*Mô tả:\*\***  
\- Nhân viên tại cửa hàng kiểm tra hàng hóa và bấm nút xác nhận trên Dashboard của cửa hàng.  
\- Thao tác này sẽ chuyển trạng thái của cả đơn hàng (Order) và vận đơn (Delivery) sang \`DELIVERED\`.

