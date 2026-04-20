import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth, ROLE_INFO } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";

// Layout
import AppLayout from "./components/layout/AppLayout/AppLayout";

// Auth
import LoginPage from "./pages/auth/LoginPage";

// Dashboards
import StoreDashboard from "./pages/store/Dashboard";
import KitchenDashboard from "./pages/kitchen/Dashboard";
import SupplyDashboard from "./pages/supply/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";

// Store pages
import StoreOrders from "./pages/store/Orders";
import NewOrder from "./pages/store/NewOrder";
import OrderDetail from "./pages/store/OrderDetail";
import ReceiveGoods from "./pages/store/ReceiveGoods";
import StoreInventory from "./pages/store/Inventory";
import StoreSales from "./pages/store/Sales";

// Kitchen pages
import KitchenOrders from "./pages/kitchen/Orders";
import KitchenInventory from "./pages/kitchen/Inventory";
import ProductionPlan from "./pages/kitchen/ProductionPlan";

// Supply pages
import SupplyOrders from "./pages/supply/Orders";
import DeliverySchedule from "./pages/supply/DeliverySchedule";
import IssueManagement from "./pages/supply/IssueManagement";

// Manager pages
import ProductCatalog from "./pages/manager/ProductCatalog";
import ManagerInventory from "./pages/manager/Inventory";
import RecipeManagement from "./pages/manager/RecipeManagement";
import Reports from "./pages/shared/Reports";

// Admin pages
import UserManagement from "./pages/admin/UserManagement";
import StoreManagement from "./pages/admin/StoreManagement";
import KitchenManagement from "./pages/admin/KitchenManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import NotificationManagement from "./pages/admin/NotificationManagement";
import SystemConfig from "./pages/admin/SystemConfig";
import Profile from "./pages/shared/Profile";

// Styles
import "./styles/global.css";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const roleInfo = ROLE_INFO[user?.role];
    // Unknown/invalid role — send to login to re-authenticate
    if (!roleInfo) return <Navigate to="/login" replace />;
    return <Navigate to={`${roleInfo.path}/dashboard`} replace />;
  }
  return children || <Outlet />;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isAuthenticated && ROLE_INFO[user?.role] ? (
            <Navigate to={`${ROLE_INFO[user.role].path}/dashboard`} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Protected Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Store Staff */}
        <Route
          element={<ProtectedRoute allowedRoles={["FRANCHISE_STORE_STAFF"]} />}
        >
          <Route path="/store/dashboard" element={<StoreDashboard />} />
          <Route path="/store/orders" element={<StoreOrders />} />
          <Route path="/store/orders/new" element={<NewOrder />} />
          <Route path="/store/orders/:id" element={<OrderDetail />} />
          <Route path="/store/inventory" element={<StoreInventory />} />
          <Route path="/store/sales" element={<StoreSales />} />
          <Route path="/store/receiving" element={<ReceiveGoods />} />
        </Route>

        {/* Kitchen Staff */}
        <Route
          element={<ProtectedRoute allowedRoles={["CENTRAL_KITCHEN_STAFF"]} />}
        >
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
          <Route
            path="/kitchen/orders"
            element={
              <KitchenOrders
                title="Quản lý đơn hàng"
                subtitle="Xử lý và theo dõi đơn hàng từ các cửa hàng"
              />
            }
          />
          <Route path="/kitchen/production" element={<ProductionPlan />} />
          <Route path="/kitchen/inventory" element={<KitchenInventory />} />
        </Route>

        {/* Supply Coordinator */}
        <Route
          element={<ProtectedRoute allowedRoles={["SUPPLY_COORDINATOR"]} />}
        >
          <Route path="/supply/dashboard" element={<SupplyDashboard />} />
          <Route path="/supply/orders" element={<SupplyOrders />} />
          <Route path="/supply/delivery" element={<DeliverySchedule />} />
          <Route path="/supply/issues" element={<IssueManagement />} />
        </Route>

        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/products" element={<ProductCatalog />} />
          <Route path="/manager/recipes" element={<RecipeManagement />} />
          <Route path="/manager/inventory" element={<ManagerInventory />} />
          <Route path="/manager/reports" element={<Reports />} />
          <Route
            path="/manager/performance"
            element={
              <Reports
                title="Hiệu suất vận hành"
                subtitle="Phân tích hiệu suất sản xuất, phân phối và bán hàng"
              />
            }
          />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/stores" element={<StoreManagement />} />
          <Route path="/admin/kitchens" element={<KitchenManagement />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/notifications" element={<NotificationManagement />} />
          <Route path="/admin/config" element={<SystemConfig />} />
          <Route
            path="/admin/reports"
            element={
              <Reports
                title="Báo cáo hệ thống"
                subtitle="Số liệu tổng hợp toàn hệ thống"
              />
            }
          />
        </Route>

        {/* Global Protected Routes */}
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: "var(--font-body)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--surface-border)",
                },
              }}
            />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
