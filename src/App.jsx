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

// Kitchen features
import KanbanBoard from "./features/orders/kanban/KanbanBoard";
import KitchenInventory from "./features/inventory/kitchen/KitchenInventory";
import ProductionPlan from "./features/production/ProductionPlan";
import BatchManagement from "./features/production/BatchManagement";

// Supply features
import DeliverySchedule from "./features/delivery/DeliverySchedule";
import IssueManagement from "./features/issues/IssueManagement";

// Manager features
import ProductCatalog from "./features/products/ProductCatalog";
import ManagerInventory from "./features/inventory/manager/ManagerInventory";
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
    return <Navigate to={`${roleInfo?.path || ""}/dashboard`} replace />;
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
          isAuthenticated ? (
            <Navigate
              to={`/${user?.role === "store_staff" ? "store" : user?.role === "kitchen_staff" ? "kitchen" : user?.role === "supply_coordinator" ? "supply" : user?.role === "manager" ? "manager" : "admin"}/dashboard`}
              replace
            />
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
        <Route element={<ProtectedRoute allowedRoles={["store_staff"]} />}>
          <Route path="/store/dashboard" element={<StoreDashboard />} />
          <Route path="/store/orders" element={<StoreOrders />} />
          <Route path="/store/orders/new" element={<NewOrder />} />
          <Route path="/store/orders/:id" element={<OrderDetail />} />
          <Route path="/store/inventory" element={<StoreInventory />} />
          <Route path="/store/receiving" element={<ReceiveGoods />} />
        </Route>

        {/* Kitchen Staff */}
        <Route element={<ProtectedRoute allowedRoles={["kitchen_staff"]} />}>
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
          <Route
            path="/kitchen/orders"
            element={
              <KanbanBoard
                title="Đơn hàng cần xử lý"
                subtitle="Kéo thả để cập nhật trạng thái đơn hàng"
              />
            }
          />
          <Route path="/kitchen/production" element={<ProductionPlan />} />
          <Route path="/kitchen/inventory" element={<KitchenInventory />} />
          <Route path="/kitchen/batches" element={<BatchManagement />} />
        </Route>

        {/* Supply Coordinator */}
        <Route
          element={<ProtectedRoute allowedRoles={["supply_coordinator"]} />}
        >
          <Route path="/supply/dashboard" element={<SupplyDashboard />} />
          <Route path="/supply/delivery" element={<DeliverySchedule />} />
          <Route path="/supply/issues" element={<IssueManagement />} />
        </Route>

        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/products" element={<ProductCatalog />} />
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
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
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
