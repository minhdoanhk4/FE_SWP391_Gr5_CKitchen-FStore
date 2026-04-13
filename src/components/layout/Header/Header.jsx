import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, ShoppingCart, ChefHat, AlertTriangle, CheckCircle, Truck, Package, Menu } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useAuth, ROLE_INFO } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import './Header.css';

const ROUTE_LABELS = {
  store: 'Cửa hàng',
  kitchen: 'Bếp trung tâm',
  supply: 'Điều phối',
  manager: 'Quản lý',
  admin: 'Quản trị',
  dashboard: 'Tổng quan',
  orders: 'Đơn hàng',
  new: 'Tạo mới',
  inventory: 'Tồn kho',
  receiving: 'Nhận hàng',
  production: 'Sản xuất',
  batches: 'Lô sản xuất',
  delivery: 'Giao hàng',
  issues: 'Vấn đề phát sinh',
  products: 'Sản phẩm',
  reports: 'Báo cáo',
  performance: 'Hiệu suất',
  users: 'Người dùng',
  stores: 'Cửa hàng & Bếp',
  config: 'Cấu hình',
};

const ACTIVITY_ICONS = {
  order_created: ShoppingCart,
  order_confirmed: CheckCircle,
  production_started: ChefHat,
  delivery_shipped: Truck,
  issue_reported: AlertTriangle,
  stock_low: AlertTriangle,
  batch_completed: CheckCircle,
  order_delivered: Package,
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const parts = location.pathname.split('/').filter(Boolean);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const { user } = useAuth();
  const { toggleSidebar } = useTheme();
  const { orders, products, users, stores, recentActivity } = useData();

  const rolePrefix = user ? (ROLE_INFO[user.role]?.path || '') : '';

  const breadcrumbs = parts.map((part, i) => ({
    label: ROUTE_LABELS[part] || part,
    path: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }));

  const unreadCount = recentActivity.length - readNotifs.length;

  const handleMarkRead = (id) => {
    setReadNotifs(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleMarkAllRead = () => {
    setReadNotifs(recentActivity.map(a => a.id));
  };

  // Search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results = [];

    orders.forEach(o => {
      if (o.id.toLowerCase().includes(q) || (o.storeName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Đơn hàng', label: `${o.id} — ${o.storeName || ''}`, path: `${rolePrefix}/orders` });
      }
    });

    products.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
        results.push({ type: 'Sản phẩm', label: `${p.id} — ${p.name}`, path: rolePrefix === '/manager' ? '/manager/products' : `${rolePrefix}/inventory` });
      }
    });

    users.forEach(u => {
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({ type: 'Người dùng', label: `${u.name} — ${u.email}`, path: '/admin/users' });
      }
    });

    stores.forEach(s => {
      if (s.name.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q)) {
        results.push({ type: 'Cửa hàng', label: s.name, path: '/admin/stores' });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, orders, products, users, stores, rolePrefix]);

  const handleSearchSelect = (path) => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(path);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button className="app-header__menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <nav className="app-header__breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {i > 0 && <ChevronRight size={14} className="app-header__breadcrumb-sep" />}
              {crumb.isLast ? (
                <span className="app-header__breadcrumb-current">{crumb.label}</span>
              ) : (
                <Link to={crumb.path}>{crumb.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="app-header__right">
        <div className="app-header__search" ref={searchRef}>
          <Search size={16} className="app-header__search-icon" />
          <input
            type="text"
            className="app-header__search-input"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
          />
          {searchOpen && searchResults.length > 0 && (
            <div className="search-dropdown">
              {Object.entries(
                searchResults.reduce((acc, r) => {
                  (acc[r.type] = acc[r.type] || []).push(r);
                  return acc;
                }, {})
              ).map(([type, items]) => (
                <div key={type} className="search-result-group">
                  <div className="search-result-group__label">{type}</div>
                  {items.map((item, idx) => (
                    <button
                      key={idx}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(item.path)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="app-header__icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="app-header__notif-dot">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <h4>Thông báo</h4>
                <button className="notif-dropdown__mark-all" onClick={handleMarkAllRead}>
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
              <div className="notif-dropdown__list">
                {recentActivity.map(act => {
                  const Icon = ACTIVITY_ICONS[act.type] || Bell;
                  const isRead = readNotifs.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      className={`notif-item ${isRead ? 'notif-item--read' : ''}`}
                      onClick={() => handleMarkRead(act.id)}
                    >
                      <div className={`notif-item__icon notif-item__icon--${act.type.includes('issue') || act.type.includes('stock') ? 'warning' : act.type.includes('delivery') || act.type.includes('batch') ? 'success' : 'primary'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="notif-item__content">
                        <p className="notif-item__message">{act.message}</p>
                        <p className="notif-item__time">{act.time}</p>
                      </div>
                      {!isRead && <span className="notif-item__unread-dot" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
