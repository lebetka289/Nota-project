import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Auth({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const { login, register, user } = useAuth();

  useEffect(() => {
    if (user && onSuccess) {
      onSuccess('home');
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        if (result.requiresVerification) {
          setShowVerification(true);
          setPendingUserId(result.userId);
        } else {
          setError(result.error);
        }
      }
    } else {
      if (!name.trim()) {
        setError('Имя обязательно');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await response.json();
        setLoading(false);
        if (response.ok && data.requiresVerification) {
          setShowVerification(true);
          setPendingUserId(data.userId);
          // Если SMTP не настроен, показываем код на экране
          if (data.mock && data.verificationCode) {
            setVerificationCode(data.verificationCode);
            setError(`⚠️ SMTP не настроен. Используйте код: ${data.verificationCode}`);
          }
        } else {
          setError(data.error || 'Ошибка регистрации');
        }
      } catch (err) {
        setLoading(false);
        setError('Ошибка подключения к серверу');
      }
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Код должен содержать 6 цифр');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setLoading(false);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (data.mock && data.verificationCode) {
          setVerificationCode(data.verificationCode);
          setError(`⚠️ SMTP не настроен. Используйте код: ${data.verificationCode}`);
        } else {
          setError('');
          alert('Код подтверждения отправлен на email');
        }
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch (err) {
      setLoading(false);
      setError('Ошибка подключения к серверу');
    }
  };

  if (showVerification) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Подтверждение email</h2>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', textAlign: 'center' }}>
            Код подтверждения отправлен на <strong>{email}</strong>
          </p>
          {error && error.includes('SMTP не настроен') && (
            <div style={{ 
              background: '#ff6b6b20', 
              border: '1px solid #ff6b6b', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ff6b6b', margin: 0, fontSize: '0.9rem' }}>
                ⚠️ SMTP не настроен. Проверьте консоль сервера или настройте SMTP в .env файле.
              </p>
            </div>
          )}
          
          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label>Код подтверждения</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                required
                placeholder="000000"
                maxLength={6}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading || verificationCode.length !== 6}>
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="switch-button"
                style={{ background: 'none', border: 'none', color: '#aaa', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Отправить код повторно
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Введите ваше имя"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите email"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введите пароль"
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          </span>
          <button onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setEmail('');
            setPassword('');
            setName('');
            setShowVerification(false);
            setVerificationCode('');
          }} className="switch-button">
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
