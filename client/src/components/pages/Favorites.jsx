import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Favorites.css';
import BeatsPlayer from '../widgets/BeatsPlayer';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Favorites() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBeat, setActiveBeat] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (beatId) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${beatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFavorites(favorites.filter(item => item.beat_id !== beatId));
      } else {
        setAlert({ message: 'Ошибка удаления из избранного', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const handleAddToCart = async (beatId) => {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          beat_id: beatId
        })
      });

      if (response.ok) {
        setAlert({ message: 'Бит добавлен в корзину', type: 'success' });
        window.dispatchEvent(new Event('nota:cart-updated'));
      } else {
        const data = await response.json();
        setAlert({ message: data.error || 'Ошибка добавления в корзину', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const downloadBeat = async (item) => {
    if (!token) return setAlert({ message: 'Войдите, чтобы скачать', type: 'warning' });
    if (!item.purchased && Number(item.price) > 0) return setAlert({ message: 'Скачивание доступно только после покупки', type: 'warning' });
    try {
      const r = await fetch(`${API_URL}/beats/${item.beat_id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        return setAlert({ message: data.error || 'Ошибка скачивания', type: 'error' });
      }
      const blob = await r.blob();
      const disp = r.headers.get('content-disposition');
      const match = /filename\*?=(?:UTF-8''|\"?)([^\";]+)/i.exec(disp || '');
      const filename = match?.[1] ? decodeURIComponent(match[1].replace(/\"/g, '')) : `${item.title}.mp3`;
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
      setAlert({ message: 'Ошибка скачивания', type: 'error' });
    }
  };

  if (loading) {
    return <div className="favorites-container loading">Загрузка избранного...</div>;
  }

  return (
    <div className="favorites-container">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <h2>Избранное</h2>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <p>У вас пока нет избранных битов</p>
          <span className="favorite-icon">Fav</span>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(item => {
            return (
              <div key={item.beat_id} className="favorite-item">
                <div className="favorite-placeholder" style={{ overflow: 'hidden' }}>
                  {item.cover_url ? (
                    <img src={item.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="favorite-item-icon">—</span>
                  )}
                </div>
                <div className="favorite-info">
                  <div className="favorite-header">
                    <h3>{item.title}</h3>
                    <button
                      className="remove-favorite-btn"
                      onClick={() => handleRemove(item.beat_id)}
                      title="Удалить из избранного"
                    >
                      Fav
                    </button>
                  </div>
                  <p className="favorite-description">Жанр: {item.genre} • BPM: {item.bpm}</p>
                  <div className="favorite-footer">
                    <div className="favorite-price">{item.price} ₽</div>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(item.beat_id)}
                    >
                      В корзину
                    </button>
                    <button className="add-to-cart-btn" onClick={() => setActiveBeat(item)}>
                      Плеер
                    </button>
                    {item.purchased || Number(item.price) === 0 ? (
                      <button className="add-to-cart-btn" onClick={() => downloadBeat(item)}>
                        Скачать
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BeatsPlayer beat={activeBeat} />
    </div>
  );
}

export default Favorites;
