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
import LoginPage from "./features/auth/LoginPage";

// Dashboards
import StoreDashboard from "./features/dashboard/store/StoreDashboard";
import KitchenDashboard from "./features/dashboard/kitchen/KitchenDashboard";
import SupplyDashboard from "./features/dashboard/supply/SupplyDashboard";
import ManagerDashboard from "./features/dashboard/manager/ManagerDashboard";
import AdminDashboard from "./features/dashboard/admin/AdminDashboard";

// Store features
import StoreOrders from "./features/orders/store/StoreOrders";
import NewOrder from "./features/orders/store/NewOrder";
import OrderDetail from "./features/orders/store/OrderDetail";
import ReceiveGoods from "./features/orders/store/ReceiveGoods";
import StoreInventory from "./features/inventory/store/StoreInventory";
import StoreSales from "./features/sales/StoreSales";

// Kitchen features
import KitchenOrders from "./features/orders/kitchen/KitchenOrders";
import KitchenInventory from "./features/inventory/kitchen/KitchenInventory";
import ProductionPlan from "./features/production/ProductionPlan";
import BatchManagement from "./features/production/BatchManagement";

// Supply features
import DeliverySchedule from "./features/delivery/DeliverySchedule";
import IssueManagement from "./features/issues/IssueManagement";

// Manager features
import ProductCatalog from "./features/products/ProductCatalog";
import ManagerInventory from "./features/inventory/manager/ManagerInventory";
import RecipeManagement from "./features/recipes/RecipeManagement";
import Reports from "./features/reports/Reports";

// Admin features
import UserManagement from "./features/users/UserManagement";
import StoreManagement from "./features/stores/StoreManagement";
import SystemConfig from "./features/config/SystemConfig";

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
        <Route element={<ProtectedRoute allowedRoles={["STORE_STAFF"]} />}>
          <Route path="/store/dashboard" element={<StoreDashboard />} />
          <Route path="/store/orders" element={<StoreOrders />} />
          <Route path="/store/orders/new" element={<NewOrder />} />
          <Route path="/store/orders/:id" element={<OrderDetail />} />
          <Route path="/store/inventory" element={<StoreInventory />} />
          <Route path="/store/sales" element={<StoreSales />} />
          <Route path="/store/receiving" element={<ReceiveGoods />} />
        </Route>

        {/* Kitchen Staff */}
        <Route element={<ProtectedRoute allowedRoles={["KITCHEN_STAFF"]} />}>
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
          <Route path="/kitchen/batches" element={<BatchManagement />} />
        </Route>

        {/* Supply Coordinator */}
        <Route
          element={<ProtectedRoute allowedRoles={["SUPPLY_COORDINATOR"]} />}
        >
          <Route path="/supply/dashboard" element={<SupplyDashboard />} />
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
