import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  ChefHat,
  Truck,
  AlertTriangle,
  BarChart3,
  Users,
  Store,
  Settings,
  Box,
  Receipt,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  DollarSign,
  ScrollText,
  PackagePlus,
  Bell,
  User,
} from "lucide-react";
import { useAuth, ROLES, ROLE_INFO } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import Logo from "../../ui/Logo/Logo";
import "./Sidebar.css";

const NAV_CONFIG = {
  [ROLES.STORE_STAFF]: [
    {
      section: "Cửa hàng",
      items: [
        { to: "/store/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
        { to: "/store/orders", icon: ShoppingCart, label: "Đơn đặt hàng" },
        {
          to: "/store/orders/new",
          icon: ClipboardList,
          label: "Yêu cầu đặt hàng",
        },
        { to: "/store/inventory", icon: Package, label: "Tồn kho" },
        { to: "/store/sales", icon: DollarSign, label: "Ghi nhận bán hàng" },
        { to: "/store/receiving", icon: Receipt, label: "Nhận hàng" },
      ],
    },
  ],
  [ROLES.KITCHEN_STAFF]: [
    {
      section: "Bếp trung tâm",
      items: [
        { to: "/kitchen/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
        {
          to: "/kitchen/orders",
          icon: ClipboardList,
          label: "Quản lý đơn hàng",
        },
        {
          to: "/kitchen/production",
          icon: ChefHat,
          label: "Kế hoạch sản xuất",
        },
        { to: "/kitchen/inventory", icon: Package, label: "Kho" },
        {
          to: "/kitchen/ingredient-batches",
          icon: PackagePlus,
          label: "Lô nguyên liệu",
        },
        { to: "/kitchen/product-batches", icon: Box, label: "Lô thành phẩm" },
      ],
    },
  ],
  [ROLES.SUPPLY_COORDINATOR]: [
    {
      section: "Điều phối",
      items: [
        { to: "/supply/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
        { to: "/supply/orders", icon: ClipboardList, label: "Đơn hàng" },
        { to: "/supply/delivery", icon: Truck, label: "Giao hàng" },
        {
          to: "/supply/issues",
          icon: AlertTriangle,
          label: "Vấn đề phát sinh",
        },
      ],
    },
  ],
  [ROLES.MANAGER]: [
    {
      section: "Quản lý",
      items: [
        { to: "/manager/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
        { to: "/manager/products", icon: Box, label: "Sản phẩm" },
        { to: "/manager/recipes", icon: ChefHat, label: "Công thức" },
        { to: "/manager/inventory", icon: Package, label: "Tồn kho hệ thống" },
        { to: "/manager/reports", icon: BarChart3, label: "Báo cáo" },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    {
      section: "Quản trị",
      items: [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
        { to: "/admin/users", icon: Users, label: "Người dùng" },
        { to: "/admin/products", icon: Box, label: "Sản phẩm" },
        { to: "/admin/stores", icon: Store, label: "Cửa hàng Franchise" },
        { to: "/admin/kitchens", icon: ChefHat, label: "Bếp Trung Tâm" },
        { to: "/admin/config", icon: Settings, label: "Cấu hình" },
        { to: "/admin/reports", icon: BarChart3, label: "Báo cáo hệ thống" },
        {
          to: "/admin/activity-logs",
          icon: ScrollText,
          label: "Nhật ký hoạt động",
        },
      ],
    },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const navSections = NAV_CONFIG[user.role] || [];
  const roleInfo = ROLE_INFO[user.role];
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}
    >
      {/* Floating Collapse Button */}
      <button
        className="sidebar__collapse-btn"
        onClick={toggleSidebar}
        aria-label={
          sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
        }
        title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {sidebarCollapsed ? (
          <ChevronsRight size={14} />
        ) : (
          <ChevronsLeft size={14} />
        )}
      </button>

      {/* Brand */}
      <div className="sidebar__brand">
        <Logo size={32} className="sidebar__logo-img" />
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">CKitchen</span>
          <span className="sidebar__brand-sub">Franchise Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navSections.map((section, si) => (
          <div key={si} className="sidebar__nav-section">
            <div className="sidebar__nav-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                end
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__nav-item ${isActive ? "sidebar__nav-item--active" : ""}`
                }
              >
                <item.icon size={20} className="sidebar__nav-icon" />
                <span className="sidebar__nav-text">{item.label}</span>
                {item.badge && (
                  <span className="sidebar__nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <Link to="/profile" className="sidebar__user" title="Xem hồ sơ cá nhân">
          <div className="sidebar__user-avatar">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user.name}</div>
            <div className="sidebar__user-role">{roleInfo?.label}</div>
          </div>
          <User
            size={14}
            className="sidebar__user-arrow"
            style={{ opacity: 0.5, marginLeft: "auto" }}
          />
        </Link>

        <button
          className="sidebar__toggle"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          style={{ color: "var(--danger)" }}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
