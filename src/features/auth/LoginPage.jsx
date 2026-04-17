import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { useAuth, ROLE_INFO } from "../../contexts/AuthContext";
import Logo from "../../components/ui/Logo/Logo";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      const roleInfo = ROLE_INFO[user.role];
      if (!roleInfo) {
        setError("Vai trò không được hỗ trợ: " + user.role);
        return;
      }
      navigate(roleInfo.path + "/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "";
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-card__brand">
          <Logo size={48} className="login-card__logo-img" />
          <h1 className="login-card__brand-name">CKitchen</h1>
        </div>
        <p className="login-card__subtitle">
          Hệ thống Quản lý Bếp Trung Tâm & Cửa hàng Franchise
        </p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-form__error">{error}</div>}

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="username">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              className="login-form__input"
              placeholder="username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="password">
              Mật khẩu
            </label>
            <div className="login-form__input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="login-form__input login-form__input--with-icon"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-form__toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="login-form__spinner" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="login-card__footer">
          © 2025 CKitchen — Hệ thống quản lý bếp trung tâm
        </div>
      </div>
    </div>
  );
}
