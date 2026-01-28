import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';
import BeatsPlayer from '../widgets/BeatsPlayer';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Cart() {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBeat, setActiveBeat] = useState(null);
  const [paying, setPaying] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/cart/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCartItems(cartItems.filter(item => item.id !== id));
        window.dispatchEvent(new Event('nota:cart-updated'));
      } else {
        setAlert({ message: 'Ошибка удаления бита', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const handleClear = async () => {
    if (!confirm('Вы уверены, что хотите очистить корзину?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCartItems([]);
        window.dispatchEvent(new Event('nota:cart-updated'));
      } else {
        setAlert({ message: 'Ошибка очистки корзины', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const checkout = async () => {
    if (!token) return setAlert({ message: 'Войдите, чтобы оплатить', type: 'warning' });
    try {
      setPaying(true);
      const r = await fetch(`${API_URL}/cart/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return setAlert({ message: data.error || 'Ошибка оплаты', type: 'error' });

      if (data.free) {
        setAlert({ message: 'Биты отмечены как купленные.', type: 'success' });
        window.dispatchEvent(new Event('nota:cart-updated'));
        return fetchCart();
      }
      if (data.mock) {
        setAlert({ message: 'Оплата проведена в тестовом режиме.', type: 'success' });
        window.dispatchEvent(new Event('nota:cart-updated'));
        return fetchCart();
      }
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setAlert({ message: 'Платеж создан, но нет ссылки на оплату', type: 'error' });
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="cart-container loading">Загрузка корзины...</div>;
  }

  return (
    <div className="cart-container">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="cart-header">
        <h2>Корзина</h2>
        {cartItems.length > 0 && (
          <button onClick={handleClear} className="clear-button">
            Очистить корзину
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Ваша корзина пуста</p>
          <span className="cart-icon">Cart</span>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-icon">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    '—'
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.title}</h3>
                  <p className="cart-item-description">Жанр: {item.genre} • BPM: {item.bpm}</p>
                </div>
                <div className="cart-item-price">
                  <div className="item-total">{Number(item.price).toFixed(2)} ₽</div>
                  <div className="item-unit-price">
                    <button className="remove-button" onClick={() => setActiveBeat(item)} style={{ marginRight: 10 }}>
                      Плеер
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 12 }}>
                      Скачивание будет доступно после оплаты
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="remove-button"
                  title="Удалить из корзины"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total-section">
              <div className="total-label">Итого:</div>
              <div className="total-amount">{total.toFixed(2)} ₽</div>
            </div>
            <button className="checkout-button" onClick={checkout} disabled={paying || cartItems.length === 0}>
              {paying ? 'Обработка…' : 'Перейти к оплате'}
            </button>
          </div>
        </>
      )}

      <BeatsPlayer beat={activeBeat} />
    </div>
  );
}

export default Cart;
