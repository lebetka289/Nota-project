import { useState } from 'react';
import './Auth.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ResetPassword({ token, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = password.length >= 6 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        setAlert({ message: 'Пароль успешно изменён. Войдите с новым паролем.', type: 'success' });
        setTimeout(() => {
          if (onSuccess) onSuccess('auth');
          window.history.replaceState({}, '', window.location.pathname || '/');
        }, 2000);
      } else {
        setError(data.error || 'Ошибка смены пароля');
      }
    } catch (err) {
      setLoading(false);
      setError('Ошибка подключения к серверу');
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Смена пароля</h2>
          <p className="auth-hint">Ссылка недействительна или отсутствует. Запросите сброс пароля снова на странице входа.</p>
          {onSuccess && (
            <button type="button" className="auth-button" onClick={() => onSuccess('auth')}>
              Перейти к входу
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="auth-card">
        <h2>Смена пароля</h2>
        <p className="auth-hint">Введите новый пароль и повторите его</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Новый пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Не менее 6 символов"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Повтор пароля</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <div className="error-message">Пароли не совпадают</div>
          )}
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="auth-button"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
