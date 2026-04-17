import { createContext, useContext, useReducer, useCallback } from "react";
import {
  orders as mockOrders,
  products as mockProducts,
  ingredients as mockIngredients,
  recipes as mockRecipes,
  storeInventory as mockStoreInventory,
  kitchenInventory as mockKitchenInventory,
  batches as mockBatches,
  issues as mockIssues,
  users as mockUsers,
  stores as mockStores,
  kitchens as mockKitchens,
  productionPlans as mockProductionPlans,
  auditLogs as mockAuditLogs,
  salesRecords as mockSalesRecords,
  dashboardStats,
  revenueData,
  ordersByStore,
  categoryDistribution,
  weeklyOrders,
  recentActivity,
  formatCurrency,
  formatDate,
  formatDateTime,
  isExpiringSoon,
  isExpired,
  STATUS_LABELS,
  STATUS_COLORS,
  AUDIT_ACTION_LABELS,
} from "../data/mockData";

const DataContext = createContext(null);

const initialState = {
  orders: [...mockOrders],
  products: [...mockProducts],
  ingredients: [...mockIngredients],
  recipes: [...mockRecipes],
  storeInventory: [...mockStoreInventory],
  kitchenInventory: [...mockKitchenInventory],
  batches: [...mockBatches],
  issues: [...mockIssues],
  users: [...mockUsers],
  stores: [...mockStores],
  kitchens: [...mockKitchens],
  productionPlans: [...mockProductionPlans],
  auditLogs: [...mockAuditLogs],
  salesRecords: [...mockSalesRecords],
  cart: [],
  systemConfig: {
    systemName: "Kizuna Restaurant",
    email: "support@kizuna.vn",
    timezone: "UTC+7",
    currency: "VND",
    massUnit: "kg",
    volumeUnit: "lít",
    countUnit: "phần",
    expiryWarningDays: "2",
    lowStockAlert: "yes",
    newOrderAlert: "yes",
    notifMethod: "in-app",
    maxProcessingHours: "24",
    maxRetries: "2",
    autoConfirm: "no",
  },
};

function dataReducer(state, action) {
  switch (action.type) {
    // Cart
    case "ADD_TO_CART": {
      const existing = state.cart.find((item) => item.productId === action.payload.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.productId === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            productId: action.payload.id,
            productName: action.payload.name,
            quantity: 1,
            unit: action.payload.unit,
            price: action.payload.price,
          },
        ],
      };
    }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.productId !== action.payload),
      };
    case "UPDATE_CART_QTY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.productId === action.payload.id
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };

    // Orders
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? { ...o, ...action.payload.changes } : o,
        ),
      };
    case "DELETE_ORDER":
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };

    // Products
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.changes } : p,
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };

    // Store Inventory
    case "UPDATE_STORE_INVENTORY":
      return {
        ...state,
        storeInventory: state.storeInventory.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.changes } : i,
        ),
      };

    // Kitchen Inventory
    case "UPDATE_KITCHEN_INVENTORY":
      return {
        ...state,
        kitchenInventory: state.kitchenInventory.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.changes } : i,
        ),
      };

    // Batches
    case "ADD_BATCH":
      return { ...state, batches: [...state.batches, action.payload] };
    case "UPDATE_BATCH":
      return {
        ...state,
        batches: state.batches.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload.changes } : b,
        ),
      };

    // Issues
    case "ADD_ISSUE":
      return { ...state, issues: [...state.issues, action.payload] };
    case "UPDATE_ISSUE":
      return {
        ...state,
        issues: state.issues.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.changes } : i,
        ),
      };

    // Users
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? { ...u, ...action.payload.changes } : u,
        ),
      };
    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };

    // Stores
    case "ADD_STORE":
      return { ...state, stores: [...state.stores, action.payload] };
    case "UPDATE_STORE":
      return {
        ...state,
        stores: state.stores.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.changes } : s,
        ),
      };
    case "DELETE_STORE":
      return {
        ...state,
        stores: state.stores.filter((s) => s.id !== action.payload),
      };

    // Production Plans
    case "ADD_PRODUCTION_PLAN":
      return {
        ...state,
        productionPlans: [...state.productionPlans, action.payload],
      };
    case "UPDATE_PRODUCTION_PLAN":
      return {
        ...state,
        productionPlans: state.productionPlans.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.changes } : p,
        ),
      };
    case "DELETE_PRODUCTION_PLAN":
      return {
        ...state,
        productionPlans: state.productionPlans.filter(
          (p) => p.id !== action.payload,
        ),
      };

    // Audit Logs
    case "ADD_AUDIT_LOG":
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] };

    // Sales Records
    case "ADD_SALE":
      return {
        ...state,
        salesRecords: [...state.salesRecords, action.payload],
      };

    // Store Inventory — add new item
    case "ADD_STORE_INVENTORY":
      return {
        ...state,
        storeInventory: [...state.storeInventory, action.payload],
      };

    // Kitchen Inventory — add new item
    case "ADD_KITCHEN_INVENTORY":
      return {
        ...state,
        kitchenInventory: [...state.kitchenInventory, action.payload],
      };

    // Recipes
    case "ADD_RECIPE":
      return { ...state, recipes: [...state.recipes, action.payload] };
    case "UPDATE_RECIPE":
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.productId === action.payload.productId
            ? { ...r, ...action.payload.changes }
            : r,
        ),
      };
    case "DELETE_RECIPE":
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.productId !== action.payload),
      };

    // System Config
    case "UPDATE_CONFIG":
      return {
        ...state,
        systemConfig: { ...state.systemConfig, ...action.payload },
      };

    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const addAuditLog = useCallback(
    (action, user, details, module) => {
      dispatch({
        type: "ADD_AUDIT_LOG",
        payload: {
          id: `AL${String(state.auditLogs.length + Date.now()).slice(-6)}`,
          action,
          user: user || "Hệ thống",
          userId: null,
          details,
          timestamp: new Date().toISOString(),
          module,
        },
      });
    },
    [state.auditLogs.length],
  );

  // Cart
  const addToCart = useCallback((product) => {
    dispatch({ type: "ADD_TO_CART", payload: product });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: productId });
  }, []);

  const updateCartQty = useCallback((id, quantity) => {
    dispatch({ type: "UPDATE_CART_QTY", payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  // Orders
  const addOrder = useCallback((order) => {
    dispatch({ type: "ADD_ORDER", payload: order });
  }, []);

  const updateOrder = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_ORDER", payload: { id, changes } });
  }, []);

  const deleteOrder = useCallback((id) => {
    dispatch({ type: "DELETE_ORDER", payload: id });
  }, []);

  // Products
  const addProduct = useCallback((product) => {
    dispatch({ type: "ADD_PRODUCT", payload: product });
  }, []);

  const updateProduct = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_PRODUCT", payload: { id, changes } });
  }, []);

  const deleteProduct = useCallback((id) => {
    dispatch({ type: "DELETE_PRODUCT", payload: id });
  }, []);

  // Inventory
  const updateStoreInventory = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_STORE_INVENTORY", payload: { id, changes } });
  }, []);

  const updateKitchenInventory = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_KITCHEN_INVENTORY", payload: { id, changes } });
  }, []);

  // Batches
  const addBatch = useCallback((batch) => {
    dispatch({ type: "ADD_BATCH", payload: batch });
  }, []);

  const updateBatch = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_BATCH", payload: { id, changes } });
  }, []);

  // Issues
  const addIssue = useCallback((issue) => {
    dispatch({ type: "ADD_ISSUE", payload: issue });
  }, []);

  const updateIssue = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_ISSUE", payload: { id, changes } });
  }, []);

  // Users
  const addUser = useCallback((user) => {
    dispatch({ type: "ADD_USER", payload: user });
  }, []);

  const updateUser = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_USER", payload: { id, changes } });
  }, []);

  const deleteUser = useCallback((id) => {
    dispatch({ type: "DELETE_USER", payload: id });
  }, []);

  // Stores
  const addStore = useCallback((store) => {
    dispatch({ type: "ADD_STORE", payload: store });
  }, []);

  const updateStore = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_STORE", payload: { id, changes } });
  }, []);

  const deleteStore = useCallback((id) => {
    dispatch({ type: "DELETE_STORE", payload: id });
  }, []);

  // Production Plans
  const addProductionPlan = useCallback((plan) => {
    dispatch({ type: "ADD_PRODUCTION_PLAN", payload: plan });
  }, []);

  const updateProductionPlan = useCallback((id, changes) => {
    dispatch({ type: "UPDATE_PRODUCTION_PLAN", payload: { id, changes } });
  }, []);

  const deleteProductionPlan = useCallback((id) => {
    dispatch({ type: "DELETE_PRODUCTION_PLAN", payload: id });
  }, []);

  // Sales
  const addSale = useCallback((sale) => {
    dispatch({ type: "ADD_SALE", payload: sale });
  }, []);

  // Inventory — add items
  const addStoreInventoryItem = useCallback((item) => {
    dispatch({ type: "ADD_STORE_INVENTORY", payload: item });
  }, []);

  const addKitchenInventoryItem = useCallback((item) => {
    dispatch({ type: "ADD_KITCHEN_INVENTORY", payload: item });
  }, []);

  // Recipes
  const addRecipe = useCallback((recipe) => {
    dispatch({ type: "ADD_RECIPE", payload: recipe });
  }, []);

  const updateRecipe = useCallback((productId, changes) => {
    dispatch({ type: "UPDATE_RECIPE", payload: { productId, changes } });
  }, []);

  const deleteRecipe = useCallback((productId) => {
    dispatch({ type: "DELETE_RECIPE", payload: productId });
  }, []);

  // System Config
  const updateConfig = useCallback((changes) => {
    dispatch({ type: "UPDATE_CONFIG", payload: changes });
  }, []);

  const value = {
    // State
    ...state,

    // CRUD functions
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    addOrder,
    updateOrder,
    deleteOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStoreInventory,
    updateKitchenInventory,
    addBatch,
    updateBatch,
    addIssue,
    updateIssue,
    addUser,
    updateUser,
    deleteUser,
    addStore,
    updateStore,
    deleteStore,
    addProductionPlan,
    updateProductionPlan,
    deleteProductionPlan,
    addAuditLog,
    addSale,
    addStoreInventoryItem,
    addKitchenInventoryItem,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    updateConfig,

    // Read-only chart/stats data
    dashboardStats,
    revenueData,
    ordersByStore,
    categoryDistribution,
    weeklyOrders,
    recentActivity,

    // Helpers
    formatCurrency,
    formatDate,
    formatDateTime,
    isExpiringSoon,
    isExpired,
    STATUS_LABELS,
    STATUS_COLORS,
    AUDIT_ACTION_LABELS,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
