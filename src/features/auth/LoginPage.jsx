import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChefHat, Truck, BarChart3, Shield, ChevronRight } from 'lucide-react';
import { useAuth, ROLES, ROLE_INFO } from '../../contexts/AuthContext';
import Logo from '../../components/ui/Logo/Logo';
import './LoginPage.css';

const ROLE_ICONS = {
  [ROLES.STORE_STAFF]: ShoppingBag,
  [ROLES.KITCHEN_STAFF]: ChefHat,
  [ROLES.SUPPLY_COORDINATOR]: Truck,
  [ROLES.MANAGER]: BarChart3,
  [ROLES.ADMIN]: Shield,
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    login(role);
    navigate(ROLE_INFO[role].path + '/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <Logo size={48} className="login-card__logo-img" />
          <h1 className="login-card__brand-name">CKitchen</h1>
        </div>
        <p className="login-card__subtitle">
          Hệ thống Quản lý Bếp Trung Tâm & Cửa hàng Franchise
        </p>

        <p className="login-card__section-title">Chọn vai trò để đăng nhập</p>

        <div className="login-roles">
          {Object.values(ROLES).map((role) => {
            const info = ROLE_INFO[role];
            const Icon = ROLE_ICONS[role];
            return (
              <button
                key={role}
                className="login-role-btn"
                onClick={() => handleRoleSelect(role)}
              >
                <div className={`login-role-btn__icon login-role-btn__icon--${info.color}`}>
                  <Icon size={22} />
                </div>
                <div className="login-role-btn__content">
                  <div className="login-role-btn__name">{info.label}</div>
                  <div className="login-role-btn__desc">{info.description}</div>
                </div>
                <ChevronRight size={18} className="login-role-btn__arrow" />
              </button>
            );
          })}
        </div>

        <div className="login-card__footer">
          Demo Mode — Chọn vai trò để trải nghiệm hệ thống
        </div>
      </div>
    </div>
  );
}
