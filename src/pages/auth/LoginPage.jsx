import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { useAuth, ROLES, ROLE_INFO } from '../../contexts/AuthContext';
import Logo from '../../components/ui/Logo/Logo';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) { setError('Vui lòng nhập tên đăng nhập.'); return; }
    if (!formData.password) { setError('Vui lòng nhập mật khẩu.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const user = await login(formData.username, formData.password);
      const rolePath = ROLE_INFO[user.role]?.path || '/admin';
      navigate(rolePath + '/dashboard');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
      } else if (status >= 500) {
        setError('Lỗi máy chủ. Vui lòng thử lại sau.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <Logo size={40} className="login-card__logo-img" />
          <h1 className="login-card__brand-name">Kizuna Chain</h1>
        </div>
        <p className="login-card__subtitle">
          Hệ thống Quản lý Bếp Trung Tâm & Cửa hàng Franchise
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>


          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            {!isLoading && <LogIn size={18} />}
          </button>
        </form>

        <div className="login-divider">
          <span>Hoặc đăng nhập với</span>
        </div>

        <div className="social-login">
          <button className="social-btn">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        </div>

        <div className="login-card__footer">
          Bản quyền thuộc về Kizuna Chain &copy; 2024
        </div>
      </div>
    </div>
  );
}
