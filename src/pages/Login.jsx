import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { IconLock, IconUser } from '../components/Icons';

export default function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Nhập tên đăng nhập và mật khẩu.');
      return;
    }
    if (login(username, password)) navigate('/', { replace: true });
    else setError('Sai tên đăng nhập hoặc mật khẩu. Kiểm tra lại rồi thử lần nữa.');
  };

  return (
    <div className="login-page">
      <form className="panel login-card" onSubmit={submit} noValidate>
        <div className="brand login-brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-name">IoT</div>
            <div className="brand-sub">Phòng thông minh</div>
          </div>
        </div>
        <h1>Đăng nhập</h1>
        <p className="muted small">Theo dõi cảm biến và điều khiển LED trong phòng.</p>

        <label className="field">
          <span>Tên đăng nhập</span>
          <div className="input-icon">
            <IconUser />
            <input autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="tuan_admin" />
          </div>
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <div className="input-icon">
            <IconLock />
            <input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••" />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>{showPw ? 'Ẩn' : 'Hiện'}</button>
          </div>
        </label>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button type="submit" className="btn-primary">Đăng nhập</button>
        <p className="muted small demo-hint">Tài khoản demo: <span className="mono">tuan_admin</span> / <span className="mono">123456</span></p>
      </form>
    </div>
  );
}
