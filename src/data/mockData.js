/* ============================================
   MOCK DATA — CKitchen FStore
   Comprehensive mock data for UI demo
   ============================================ */

// ---- Stores ----
export const stores = [
  {
    id: "CH001",
    name: "CKitchen Quận 1",
    address: "123 Nguyễn Huệ, Q.1, TP.HCM",
    phone: "028 3812 1234",
    manager: "Nguyễn Văn An",
    status: "active",
    openDate: "2024-01-15",
  },
  {
    id: "CH002",
    name: "CKitchen Quận 3",
    address: "456 Võ Văn Tần, Q.3, TP.HCM",
    phone: "028 3812 5678",
    manager: "Trần Minh Tuấn",
    status: "active",
    openDate: "2024-03-20",
  },
  {
    id: "CH003",
    name: "CKitchen Quận 7",
    address: "789 Nguyễn Thị Thập, Q.7, TP.HCM",
    phone: "028 3812 9012",
    manager: "Lê Thị Hoa",
    status: "active",
    openDate: "2024-06-10",
  },
  {
    id: "CH004",
    name: "CKitchen Thủ Đức",
    address: "321 Võ Văn Ngân, TP.Thủ Đức",
    phone: "028 3812 3456",
    manager: "Phạm Đức Anh",
    status: "active",
    openDate: "2024-09-01",
  },
  {
    id: "CH005",
    name: "CKitchen Bình Thạnh",
    address: "654 Điện Biên Phủ, Q.Bình Thạnh",
    phone: "028 3812 7890",
    manager: "Hoàng Thu Hà",
    status: "maintenance",
    openDate: "2025-01-05",
  },
];

export const kitchens = [
  {
    id: "BT001",
    name: "Bếp Trung Tâm HCM",
    address: "100 KCN Tân Bình, TP.HCM",
    phone: "028 3900 1234",
    capacity: 500,
    status: "active",
  },
  {
    id: "BT002",
    name: "Bếp Trung Tâm HN",
    address: "200 KCN Gia Lâm, Hà Nội",
    phone: "024 3900 5678",
    capacity: 300,
    status: "active",
  },
];

// ---- Products & Ingredients ----
export const products = [
  {
    id: "SP001",
    name: "Phở Bò Truyền Thống",
    category: "Phở",
    unit: "phần",
    price: 45000,
    cost: 18000,
    image: "/images/products/pho-bo.png",
  },
  {
    id: "SP002",
    name: "Phở Gà Đặc Biệt",
    category: "Phở",
    unit: "phần",
    price: 50000,
    cost: 20000,
    image: "/images/products/pho-bo.png",
  },
  {
    id: "SP003",
    name: "Bún Bò Huế",
    category: "Bún",
    unit: "phần",
    price: 48000,
    cost: 22000,
    image: "/images/products/bun-bo-hue.png",
  },
  {
    id: "SP004",
    name: "Cơm Tấm Sườn Bì Chả",
    category: "Cơm",
    unit: "phần",
    price: 42000,
    cost: 16000,
    image: "/images/products/com-tam.png",
  },
  {
    id: "SP005",
    name: "Bánh Mì Thịt Nướng",
    category: "Bánh mì",
    unit: "ổ",
    price: 25000,
    cost: 10000,
    image: "/images/products/banh-mi.png",
  },
  {
    id: "SP006",
    name: "Gỏi Cuốn Tôm Thịt",
    category: "Khai vị",
    unit: "phần",
    price: 35000,
    cost: 14000,
    image: "/images/products/goi-cuon.png",
  },
  {
    id: "SP007",
    name: "Chả Giò Hải Sản",
    category: "Khai vị",
    unit: "phần",
    price: 38000,
    cost: 15000,
    image: "/images/products/cha-gio.png",
  },
  {
    id: "SP008",
    name: "Nước Mắm Pha Sẵn",
    category: "Gia vị",
    unit: "lít",
    price: 30000,
    cost: 12000,
    image: null,
  },
  {
    id: "SP009",
    name: "Nước Dùng Phở (cô đặc)",
    category: "Bán thành phẩm",
    unit: "lít",
    price: 60000,
    cost: 25000,
    image: null,
  },
  {
    id: "SP010",
    name: "Sốt Bún Bò Huế",
    category: "Bán thành phẩm",
    unit: "lít",
    price: 55000,
    cost: 23000,
    image: null,
  },
];

export const ingredients = [
  {
    id: "NL001",
    name: "Thịt Bò Thăn",
    unit: "kg",
    price: 280000,
    supplier: "Vissan",
    minStock: 50,
  },
  {
    id: "NL002",
    name: "Xương Bò",
    unit: "kg",
    price: 80000,
    supplier: "Vissan",
    minStock: 100,
  },
  {
    id: "NL003",
    name: "Thịt Gà Ta",
    unit: "kg",
    price: 95000,
    supplier: "CP Foods",
    minStock: 40,
  },
  {
    id: "NL004",
    name: "Bánh Phở Tươi",
    unit: "kg",
    price: 18000,
    supplier: "Nhà máy Phở An",
    minStock: 200,
  },
  {
    id: "NL005",
    name: "Bún Tươi",
    unit: "kg",
    price: 15000,
    supplier: "Nhà máy Phở An",
    minStock: 150,
  },
  {
    id: "NL006",
    name: "Rau Sống Tổng Hợp",
    unit: "kg",
    price: 25000,
    supplier: "Rau Sạch Đà Lạt",
    minStock: 30,
  },
  {
    id: "NL007",
    name: "Hành Tím",
    unit: "kg",
    price: 35000,
    supplier: "Chợ Đầu Mối",
    minStock: 20,
  },
  {
    id: "NL008",
    name: "Gừng Tươi",
    unit: "kg",
    price: 40000,
    supplier: "Chợ Đầu Mối",
    minStock: 10,
  },
  {
    id: "NL009",
    name: "Quế, Hồi, Thảo Quả",
    unit: "kg",
    price: 150000,
    supplier: "Gia vị Bắc",
    minStock: 5,
  },
  {
    id: "NL010",
    name: "Nước Mắm Phú Quốc",
    unit: "lít",
    price: 85000,
    supplier: "NM Phú Quốc",
    minStock: 50,
  },
  {
    id: "NL011",
    name: "Đường Phèn",
    unit: "kg",
    price: 45000,
    supplier: "Tổng kho",
    minStock: 20,
  },
  {
    id: "NL012",
    name: "Tôm Sú",
    unit: "kg",
    price: 220000,
    supplier: "Hải sản Cà Mau",
    minStock: 15,
  },
];

export const recipes = [
  {
    productId: "SP001",
    ingredients: [
      { ingredientId: "NL001", quantity: 0.15, unit: "kg" },
      { ingredientId: "NL002", quantity: 0.1, unit: "kg" },
      { ingredientId: "NL004", quantity: 0.2, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.02, unit: "kg" },
      { ingredientId: "NL009", quantity: 0.005, unit: "kg" },
      { ingredientId: "NL010", quantity: 0.02, unit: "lít" },
    ],
  },
  {
    productId: "SP002",
    ingredients: [
      { ingredientId: "NL003", quantity: 0.2, unit: "kg" },
      { ingredientId: "NL004", quantity: 0.2, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.02, unit: "kg" },
      { ingredientId: "NL008", quantity: 0.01, unit: "kg" },
    ],
  },
  {
    productId: "SP003",
    ingredients: [
      { ingredientId: "NL001", quantity: 0.15, unit: "kg" },
      { ingredientId: "NL005", quantity: 0.2, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.03, unit: "kg" },
      { ingredientId: "NL010", quantity: 0.02, unit: "lít" },
    ],
  },
  {
    productId: "SP004",
    ingredients: [
      { ingredientId: "NL001", quantity: 0.12, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.03, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.01, unit: "kg" },
      { ingredientId: "NL010", quantity: 0.02, unit: "lít" },
    ],
  },
  {
    productId: "SP005",
    ingredients: [
      { ingredientId: "NL001", quantity: 0.08, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.03, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.01, unit: "kg" },
    ],
  },
  {
    productId: "SP006",
    ingredients: [
      { ingredientId: "NL012", quantity: 0.06, unit: "kg" },
      { ingredientId: "NL001", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL006", quantity: 0.08, unit: "kg" },
      { ingredientId: "NL010", quantity: 0.02, unit: "lít" },
    ],
  },
  {
    productId: "SP007",
    ingredients: [
      { ingredientId: "NL012", quantity: 0.08, unit: "kg" },
      { ingredientId: "NL001", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.02, unit: "kg" },
    ],
  },
  {
    productId: "SP008",
    ingredients: [
      { ingredientId: "NL010", quantity: 0.5, unit: "lít" },
      { ingredientId: "NL011", quantity: 0.1, unit: "kg" },
      { ingredientId: "NL008", quantity: 0.02, unit: "kg" },
    ],
  },
  {
    productId: "SP009",
    ingredients: [
      { ingredientId: "NL002", quantity: 2.0, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.3, unit: "kg" },
      { ingredientId: "NL008", quantity: 0.15, unit: "kg" },
      { ingredientId: "NL009", quantity: 0.05, unit: "kg" },
      { ingredientId: "NL011", quantity: 0.1, unit: "kg" },
    ],
  },
  {
    productId: "SP010",
    ingredients: [
      { ingredientId: "NL001", quantity: 1.0, unit: "kg" },
      { ingredientId: "NL002", quantity: 1.5, unit: "kg" },
      { ingredientId: "NL007", quantity: 0.2, unit: "kg" },
      { ingredientId: "NL008", quantity: 0.1, unit: "kg" },
      { ingredientId: "NL010", quantity: 0.3, unit: "lít" },
    ],
  },
];

// ---- Orders ----
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "producing",
  "ready",
  "shipping",
  "delivered",
  "cancelled",
];

export const STATUS_LABELS = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  producing: "Đang sản xuất",
  ready: "Sẵn sàng giao",
  shipping: "Đang giao hàng",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  producing: "accent",
  ready: "primary",
  shipping: "info",
  delivered: "success",
  cancelled: "danger",
};

export const orders = [];

// ---- Inventory (Store) ----
export const storeInventory = [
  {
    id: 1,
    storeId: "CH001",
    productId: "SP001",
    productName: "Phở Bò Truyền Thống",
    quantity: 25,
    unit: "phần",
    minStock: 10,
    expiryDate: "2026-04-14",
  },
  {
    id: 2,
    storeId: "CH001",
    productId: "SP002",
    productName: "Phở Gà Đặc Biệt",
    quantity: 15,
    unit: "phần",
    minStock: 8,
    expiryDate: "2026-04-14",
  },
  {
    id: 3,
    storeId: "CH001",
    productId: "SP004",
    productName: "Cơm Tấm Sườn Bì Chả",
    quantity: 5,
    unit: "phần",
    minStock: 10,
    expiryDate: "2026-04-13",
  },
  {
    id: 4,
    storeId: "CH001",
    productId: "SP005",
    productName: "Bánh Mì Thịt Nướng",
    quantity: 30,
    unit: "ổ",
    minStock: 15,
    expiryDate: "2026-04-13",
  },
  {
    id: 5,
    storeId: "CH001",
    productId: "SP006",
    productName: "Gỏi Cuốn Tôm Thịt",
    quantity: 0,
    unit: "phần",
    minStock: 10,
    expiryDate: null,
  },
  {
    id: 6,
    storeId: "CH001",
    productId: "SP008",
    productName: "Nước Mắm Pha Sẵn",
    quantity: 8,
    unit: "lít",
    minStock: 3,
    expiryDate: "2026-06-01",
  },
  {
    id: 7,
    storeId: "CH001",
    productId: "SP009",
    productName: "Nước Dùng Phở (cô đặc)",
    quantity: 3,
    unit: "lít",
    minStock: 5,
    expiryDate: "2026-04-15",
  },
];

// ---- Kitchen Inventory ----
export const kitchenInventory = [
  {
    id: 1,
    ingredientId: "NL001",
    name: "Thịt Bò Thăn",
    quantity: 120,
    unit: "kg",
    minStock: 50,
    batchNo: "LO-240412-01",
    expiryDate: "2026-04-16",
    supplier: "Vissan",
  },
  {
    id: 2,
    ingredientId: "NL002",
    name: "Xương Bò",
    quantity: 200,
    unit: "kg",
    minStock: 100,
    batchNo: "LO-240412-02",
    expiryDate: "2026-04-17",
    supplier: "Vissan",
  },
  {
    id: 3,
    ingredientId: "NL003",
    name: "Thịt Gà Ta",
    quantity: 35,
    unit: "kg",
    minStock: 40,
    batchNo: "LO-240411-01",
    expiryDate: "2026-04-14",
    supplier: "CP Foods",
  },
  {
    id: 4,
    ingredientId: "NL004",
    name: "Bánh Phở Tươi",
    quantity: 300,
    unit: "kg",
    minStock: 200,
    batchNo: "LO-240413-01",
    expiryDate: "2026-04-14",
    supplier: "Nhà máy Phở An",
  },
  {
    id: 5,
    ingredientId: "NL005",
    name: "Bún Tươi",
    quantity: 180,
    unit: "kg",
    minStock: 150,
    batchNo: "LO-240413-02",
    expiryDate: "2026-04-14",
    supplier: "Nhà máy Phở An",
  },
  {
    id: 6,
    ingredientId: "NL006",
    name: "Rau Sống Tổng Hợp",
    quantity: 45,
    unit: "kg",
    minStock: 30,
    batchNo: "LO-240413-03",
    expiryDate: "2026-04-14",
    supplier: "Rau Sạch Đà Lạt",
  },
  {
    id: 7,
    ingredientId: "NL007",
    name: "Hành Tím",
    quantity: 25,
    unit: "kg",
    minStock: 20,
    batchNo: "LO-240410-01",
    expiryDate: "2026-04-20",
    supplier: "Chợ Đầu Mối",
  },
  {
    id: 8,
    ingredientId: "NL010",
    name: "Nước Mắm Phú Quốc",
    quantity: 60,
    unit: "lít",
    minStock: 50,
    batchNo: "LO-240405-01",
    expiryDate: "2026-10-01",
    supplier: "NM Phú Quốc",
  },
  {
    id: 9,
    ingredientId: "NL012",
    name: "Tôm Sú",
    quantity: 8,
    unit: "kg",
    minStock: 15,
    batchNo: "LO-240412-05",
    expiryDate: "2026-04-14",
    supplier: "Hải sản Cà Mau",
  },
];

// ---- Production Batches ----
export const batches = [
  {
    id: "LO-SX-001",
    orderId: null,
    orderItemIndex: null,
    planId: "KH-001",
    productId: "SP009",
    productName: "Nước Dùng Phở (cô đặc)",
    quantity: 100,
    unit: "lít",
    status: "completed",
    startDate: "2026-04-12T06:00:00",
    endDate: "2026-04-12T14:00:00",
    staff: "Trần Thị Bình",
  },
  {
    id: "LO-SX-002",
    orderId: null,
    orderItemIndex: null,
    planId: "KH-002",
    productId: "SP010",
    productName: "Sốt Bún Bò Huế",
    quantity: 50,
    unit: "lít",
    status: "in_progress",
    startDate: "2026-04-13T06:00:00",
    endDate: null,
    staff: "Trần Thị Bình",
  },
  {
    id: "LO-SX-003",
    orderId: null,
    orderItemIndex: null,
    planId: "KH-003",
    productId: "SP007",
    productName: "Chả Giò Hải Sản",
    quantity: 300,
    unit: "phần",
    status: "planned",
    startDate: "2026-04-14T06:00:00",
    endDate: null,
    staff: "Nguyễn Văn Hùng",
  },
];

// ---- Issues ----
export const issues = [
  {
    id: "IS001",
    orderId: "DH005",
    type: "late_delivery",
    title: "Giao hàng trễ 2 tiếng",
    description: "Đơn DH005 yêu cầu giao trước 10h nhưng xe gặp kẹt đường",
    status: "open",
    priority: "high",
    createdAt: "2026-04-13T10:30:00",
    assignee: "Lê Minh Châu",
  },
  {
    id: "IS002",
    orderId: "DH003",
    type: "shortage",
    title: "Thiếu nguyên liệu tôm sú",
    description: "Kho chỉ còn 8kg tôm sú, cần 12kg cho đơn DH003",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-04-12T15:00:00",
    assignee: "Lê Minh Châu",
  },
  {
    id: "IS003",
    orderId: null,
    type: "quality",
    title: "Lô rau sống không đạt chuẩn",
    description: "Lô rau ngày 12/04 từ Rau Sạch Đà Lạt bị héo, cần trả lại",
    status: "resolved",
    priority: "low",
    createdAt: "2026-04-12T08:00:00",
    assignee: "Lê Minh Châu",
  },
];

// ---- Users ----
export const users = [
  {
    id: "u1",
    name: "Nguyễn Văn An",
    email: "an.nv@ckitchen.vn",
    role: "store_staff",
    store: "CH001",
    status: "active",
    lastLogin: "2026-04-13T06:00:00",
  },
  {
    id: "u2",
    name: "Trần Thị Bình",
    email: "binh.tt@ckitchen.vn",
    role: "kitchen_staff",
    store: null,
    status: "active",
    lastLogin: "2026-04-13T05:30:00",
  },
  {
    id: "u3",
    name: "Lê Minh Châu",
    email: "chau.lm@ckitchen.vn",
    role: "supply_coordinator",
    store: null,
    status: "active",
    lastLogin: "2026-04-13T07:00:00",
  },
  {
    id: "u4",
    name: "Phạm Quốc Đạt",
    email: "dat.pq@ckitchen.vn",
    role: "manager",
    store: null,
    status: "active",
    lastLogin: "2026-04-13T08:00:00",
  },
  {
    id: "u5",
    name: "Hoàng Thùy Dung",
    email: "dung.ht@ckitchen.vn",
    role: "admin",
    store: null,
    status: "active",
    lastLogin: "2026-04-13T09:00:00",
  },
  {
    id: "u6",
    name: "Trần Minh Tuấn",
    email: "tuan.tm@ckitchen.vn",
    role: "store_staff",
    store: "CH002",
    status: "active",
    lastLogin: "2026-04-12T18:00:00",
  },
  {
    id: "u7",
    name: "Lê Thị Hoa",
    email: "hoa.lt@ckitchen.vn",
    role: "store_staff",
    store: "CH003",
    status: "active",
    lastLogin: "2026-04-12T17:00:00",
  },
  {
    id: "u8",
    name: "Phạm Đức Anh",
    email: "anh.pd@ckitchen.vn",
    role: "store_staff",
    store: "CH004",
    status: "active",
    lastLogin: "2026-04-12T19:00:00",
  },
  {
    id: "u9",
    name: "Hoàng Thu Hà",
    email: "ha.ht@ckitchen.vn",
    role: "store_staff",
    store: "CH005",
    status: "inactive",
    lastLogin: "2026-04-08T10:00:00",
  },
  {
    id: "u10",
    name: "Nguyễn Văn Hùng",
    email: "hung.nv@ckitchen.vn",
    role: "kitchen_staff",
    store: null,
    status: "active",
    lastLogin: "2026-04-13T05:00:00",
  },
];

// ---- Dashboard Stats ----
export const dashboardStats = {
  store: {
    pendingOrders: 2,
    inTransitOrders: 1,
    lowStockItems: 3,
    todayRevenue: 12500000,
  },
  kitchen: {
    pendingOrders: 3,
    producingOrders: 2,
    readyToShip: 1,
    lowStockIngredients: 2,
    todayOutput: 450,
  },
  supply: {
    totalPending: 3,
    totalInTransit: 1,
    openIssues: 2,
    deliveriesToday: 4,
  },
  manager: {
    totalRevenue: 125000000,
    totalOrders: 156,
    avgFulfillment: 94.5,
    activeStores: 4,
    wastageRate: 3.2,
  },
  admin: {
    totalUsers: 10,
    activeUsers: 9,
    totalStores: 5,
    systemUptime: 99.8,
  },
};

// ---- Chart Data ----
export const revenueData = [
  { month: "T1", revenue: 95000000, orders: 120 },
  { month: "T2", revenue: 102000000, orders: 135 },
  { month: "T3", revenue: 118000000, orders: 148 },
  { month: "T4", revenue: 125000000, orders: 156 },
];

export const ordersByStore = [
  { name: "Q.1", orders: 45, revenue: 38000000 },
  { name: "Q.3", orders: 32, revenue: 28000000 },
  { name: "Q.7", orders: 38, revenue: 32000000 },
  { name: "Thủ Đức", orders: 28, revenue: 22000000 },
  { name: "B.Thạnh", orders: 13, revenue: 5000000 },
];

export const categoryDistribution = [
  { name: "Phở", value: 42, color: "#2D6A4F" },
  { name: "Bún", value: 18, color: "#E76F51" },
  { name: "Cơm", value: 22, color: "#F4A261" },
  { name: "Bánh mì", value: 10, color: "#457B9D" },
  { name: "Khai vị", value: 8, color: "#E9C46A" },
];

export const weeklyOrders = [
  { day: "T2", count: 18 },
  { day: "T3", count: 22 },
  { day: "T4", count: 26 },
  { day: "T5", count: 24 },
  { day: "T6", count: 32 },
  { day: "T7", count: 38 },
  { day: "CN", count: 35 },
];

// ---- Activity Log ----
export const recentActivity = [
  {
    id: 1,
    type: "order_created",
    message: "Đơn DH009 được tạo bởi Nguyễn Văn An",
    time: "7 phút trước",
    icon: "ShoppingCart",
  },
  {
    id: 2,
    type: "order_confirmed",
    message: "Đơn DH010 đã được xác nhận",
    time: "30 phút trước",
    icon: "CheckCircle",
  },
  {
    id: 3,
    type: "production_started",
    message: "Bắt đầu sản xuất lô LO-SX-002 (Sốt Bún Bò Huế)",
    time: "1 giờ trước",
    icon: "ChefHat",
  },
  {
    id: 4,
    type: "delivery_shipped",
    message: "Đơn DH005 đang giao đến CKitchen Thủ Đức",
    time: "2 giờ trước",
    icon: "Truck",
  },
  {
    id: 5,
    type: "issue_reported",
    message: "Vấn đề IS001: Giao hàng trễ 2 tiếng",
    time: "3 giờ trước",
    icon: "AlertTriangle",
  },
  {
    id: 6,
    type: "stock_low",
    message: "Cảnh báo: Tôm Sú còn 8kg (dưới mức tối thiểu 15kg)",
    time: "4 giờ trước",
    icon: "AlertCircle",
  },
  {
    id: 7,
    type: "batch_completed",
    message: "Hoàn thành lô LO-SX-001 (Nước Dùng Phở)",
    time: "5 giờ trước",
    icon: "CheckCircle",
  },
  {
    id: 8,
    type: "order_delivered",
    message: "Đơn DH006 đã giao thành công đến CKitchen Quận 3",
    time: "1 ngày trước",
    icon: "Package",
  },
];

// ---- Production Plans ----
export const productionPlans = [
  {
    id: "KH-001",
    productId: "SP009",
    productName: "Nước Dùng Phở (cô đặc)",
    quantity: 100,
    unit: "lít",
    status: "completed",
    startDate: "2026-04-12T06:00:00",
    endDate: "2026-04-12T14:00:00",
    staff: "Trần Thị Bình",
    notes: "Nấu theo công thức chuẩn, lọc kỹ",
    ingredients: [
      { name: "Xương Bò", qty: "50kg" },
      { name: "Hành Tím", qty: "5kg" },
      { name: "Gừng", qty: "3kg" },
    ],
  },
  {
    id: "KH-002",
    productId: "SP010",
    productName: "Sốt Bún Bò Huế",
    quantity: 50,
    unit: "lít",
    status: "in_progress",
    startDate: "2026-04-13T06:00:00",
    endDate: null,
    staff: "Trần Thị Bình",
    notes: "Dùng sả tươi, không dùng sả khô",
    ingredients: [
      { name: "Thịt Bò Thăn", qty: "20kg" },
      { name: "Sả", qty: "3kg" },
      { name: "Ớt Bột", qty: "1kg" },
    ],
  },
  {
    id: "KH-003",
    productId: "SP007",
    productName: "Chả Giò Hải Sản",
    quantity: 300,
    unit: "phần",
    status: "planned",
    startDate: "2026-04-14T06:00:00",
    endDate: null,
    staff: "Nguyễn Văn Hùng",
    notes: "Chuẩn bị nhân trước 1 ngày",
    ingredients: [
      { name: "Tôm Sú", qty: "10kg" },
      { name: "Thịt Heo", qty: "15kg" },
      { name: "Bánh Tráng", qty: "5kg" },
    ],
  },
  {
    id: "KH-004",
    productId: "SP001",
    productName: "Phở Bò Truyền Thống",
    quantity: 200,
    unit: "phần",
    status: "planned",
    startDate: "2026-04-14T08:00:00",
    endDate: null,
    staff: "Trần Thị Bình",
    notes: "Đơn hàng lớn cho sự kiện Thủ Đức",
    ingredients: [
      { name: "Thịt Bò", qty: "30kg" },
      { name: "Bánh Phở", qty: "40kg" },
      { name: "Rau Sống", qty: "10kg" },
    ],
  },
];

// ---- Audit Logs ----
export const auditLogs = [
  {
    id: "AL001",
    action: "user_login",
    user: "Nguyễn Văn An",
    userId: "u1",
    details: "Đăng nhập hệ thống",
    timestamp: "2026-04-13T06:00:00",
    module: "auth",
  },
  {
    id: "AL002",
    action: "order_created",
    user: "Nguyễn Văn An",
    userId: "u1",
    details: "Tạo đơn hàng DH009",
    timestamp: "2026-04-13T07:30:00",
    module: "orders",
  },
  {
    id: "AL003",
    action: "order_confirmed",
    user: "Trần Thị Bình",
    userId: "u2",
    details: "Xác nhận đơn hàng DH010",
    timestamp: "2026-04-12T15:30:00",
    module: "orders",
  },
  {
    id: "AL004",
    action: "production_started",
    user: "Trần Thị Bình",
    userId: "u2",
    details: "Bắt đầu sản xuất lô KH-002",
    timestamp: "2026-04-13T06:00:00",
    module: "production",
  },
  {
    id: "AL005",
    action: "delivery_shipped",
    user: "Lê Minh Châu",
    userId: "u3",
    details: "Giao đơn DH005 đến Thủ Đức",
    timestamp: "2026-04-13T08:00:00",
    module: "delivery",
  },
  {
    id: "AL006",
    action: "issue_created",
    user: "Lê Minh Châu",
    userId: "u3",
    details: "Tạo vấn đề IS001 - Giao trễ",
    timestamp: "2026-04-13T10:30:00",
    module: "issues",
  },
  {
    id: "AL007",
    action: "product_updated",
    user: "Phạm Quốc Đạt",
    userId: "u4",
    details: "Cập nhật giá Phở Bò SP001",
    timestamp: "2026-04-12T09:00:00",
    module: "products",
  },
  {
    id: "AL008",
    action: "user_created",
    user: "Hoàng Thùy Dung",
    userId: "u5",
    details: "Tạo tài khoản Nguyễn Văn Hùng",
    timestamp: "2026-04-11T14:00:00",
    module: "users",
  },
  {
    id: "AL009",
    action: "config_updated",
    user: "Hoàng Thùy Dung",
    userId: "u5",
    details: "Cập nhật cài đặt thông báo",
    timestamp: "2026-04-11T10:00:00",
    module: "config",
  },
  {
    id: "AL010",
    action: "store_updated",
    user: "Hoàng Thùy Dung",
    userId: "u5",
    details: "Cập nhật trạng thái CH005 - Bảo trì",
    timestamp: "2026-04-10T16:00:00",
    module: "stores",
  },
];

export const AUDIT_ACTION_LABELS = {
  user_login: "Đăng nhập",
  order_created: "Tạo đơn hàng",
  order_confirmed: "Xác nhận đơn",
  production_started: "Bắt đầu SX",
  delivery_shipped: "Giao hàng",
  issue_created: "Tạo vấn đề",
  product_updated: "Cập nhật SP",
  user_created: "Tạo tài khoản",
  config_updated: "Cập nhật cấu hình",
  store_updated: "Cập nhật CH",
  order_updated: "Cập nhật đơn",
  user_updated: "Cập nhật TK",
  product_created: "Tạo SP",
  store_created: "Tạo CH",
  issue_updated: "Cập nhật vấn đề",
  sale_recorded: "Ghi nhận bán hàng",
  goods_received: "Nhận hàng",
  inventory_import: "Nhập kho NL",
  product_deleted: "Xóa SP",
  user_deleted: "Xóa TK",
  store_deleted: "Xóa CH",
  recipe_updated: "Cập nhật công thức",
  batch_created: "Tạo lô SX",
  batch_completed: "Hoàn thành lô SX",
  production_planned: "Tạo KH sản xuất",
  production_completed: "Hoàn thành SX",
  ingredient_disposed: "Hủy nguyên liệu hết hạn",
  product_disposed: "Hủy sản phẩm hết hạn",
};

// ---- Sales Records ----
export const salesRecords = [
  {
    id: "SR001",
    storeId: "CH001",
    date: "2026-04-13",
    items: [
      {
        productId: "SP001",
        productName: "Phở Bò Truyền Thống",
        quantity: 45,
        unit: "phần",
        unitPrice: 45000,
      },
      {
        productId: "SP002",
        productName: "Phở Gà Đặc Biệt",
        quantity: 30,
        unit: "phần",
        unitPrice: 50000,
      },
      {
        productId: "SP005",
        productName: "Bánh Mì Thịt Nướng",
        quantity: 60,
        unit: "ổ",
        unitPrice: 25000,
      },
    ],
    totalRevenue: 4525000,
    recordedBy: "Nguyễn Văn An",
    recordedAt: "2026-04-13T18:00:00",
  },
  {
    id: "SR002",
    storeId: "CH001",
    date: "2026-04-12",
    items: [
      {
        productId: "SP001",
        productName: "Phở Bò Truyền Thống",
        quantity: 38,
        unit: "phần",
        unitPrice: 45000,
      },
      {
        productId: "SP004",
        productName: "Cơm Tấm Sườn Bì Chả",
        quantity: 25,
        unit: "phần",
        unitPrice: 42000,
      },
    ],
    totalRevenue: 2760000,
    recordedBy: "Nguyễn Văn An",
    recordedAt: "2026-04-12T18:30:00",
  },
];

// ---- Helpers ----
export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isExpiringSoon(dateStr, daysThreshold = 2) {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < daysThreshold * 86400000;
}

export function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
