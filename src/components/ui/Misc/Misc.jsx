import './Misc.css';

const COLORS = ['primary', 'accent', 'info', 'warning'];

export function Avatar({ name, src, size, color, className = '' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const autoColor = color || COLORS[name ? name.charCodeAt(0) % COLORS.length : 0];

  return (
    <div className={`avatar avatar--${autoColor} ${size ? `avatar--${size}` : ''} ${className}`}>
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4 }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className="avatar-group">
      {shown.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.avatar} size="sm" />
      ))}
      {extra > 0 && (
        <div className="avatar avatar--sm" style={{ background: 'var(--text-muted)', fontSize: '10px' }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={64} className="empty-state__icon" />}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {children}
    </div>
  );
}

export function Spinner({ size, text, className = '' }) {
  return (
    <div className={`spinner ${size ? `spinner--${size}` : ''} ${className}`}>
      <div className="spinner__container">
        <div className="spinner__circle" />
        <div className="spinner__inner-circle" />
        <img src="/images/products/logo.png" alt="CKitchen" className="spinner__logo" />
      </div>
      {text && <p className="spinner__text">{text}</p>}
    </div>
  );
}

export function LoadingScreen({ text = 'Đang tải hệ thống...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-screen__bg" />
      <Spinner size="lg" text={text} />
    </div>
  );
}


export function Skeleton({ variant = 'text', width, height, className = '' }) {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
    />
  );
}
