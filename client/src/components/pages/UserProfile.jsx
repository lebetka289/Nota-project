import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserProfile.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function UserProfile() {
  const { user, token } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingRecordingId, setPayingRecordingId] = useState(null);

  const musicStylesNames = {
    'hyperpop': 'Хайпер поп',
    'pop-rock': 'Поп рок',
    'indie': 'Инди',
    'lofi': 'Low-fi',
    'russian-rap': 'Русский реп',
    'funk': 'Фонк'
  };

  const recordingTypesNames = {
    'own-music': 'Запись на свою музыку',
    'with-music': 'Запись с покупкой музыки',
    'buy-music': 'Покупка музыки',
    'home-recording': 'Запись из дома',
    'video-clip': 'Съёмка видеоклипа'
  };

  const statusNames = {
    'pending': 'Ожидает оплаты',
    'paid': 'Оплачено',
    'in-progress': 'В работе',
    'completed': 'Завершено',
    'cancelled': 'Отменено'
  };

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  const fetchData = async () => {
    if (!user || !user.id) return;
    
    try {
      const [recordingsRes, purchasesRes] = await Promise.all([
        fetch(`${API_URL}/recordings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/users/${user.id}/purchases`)
      ]);

      if (recordingsRes.ok) {
        const recordingsData = await recordingsRes.json();
        setRecordings(recordingsData);
      }

      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData);
      } else if (purchasesRes.status === 404) {
        setPurchases([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayRecording = async (recording) => {
    if (!token) return;
    
    try {
      setPayingRecordingId(recording.id);
      const response = await fetch(`${API_URL}/payments/yookassa/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_id: recording.id,
          recording_type: recording.recording_type,
          music_style: recording.music_style
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      if (data.mock) {
        alert('✅ Оплата проведена в тестовом режиме');
        fetchData();
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        alert('Платеж создан, но нет ссылки на оплату');
      }
    } catch (error) {
      alert(error.message || 'Ошибка оплаты');
    } finally {
      setPayingRecordingId(null);
    }
  };

  const resolveCoverUrl = (coverPath) => {
    if (!coverPath) return null;
    if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
      return coverPath;
    }
    const baseUrl = API_URL.replace('/api', '');
    const normalized = coverPath.startsWith('/uploads/')
      ? coverPath
      : coverPath.startsWith('uploads/')
        ? `/${coverPath}`
        : `/uploads/${coverPath}`;
    return `${baseUrl}${normalized}`;
  };

  const paidRecordings = recordings.filter(r => r.status === 'paid' || r.status === 'in-progress' || r.status === 'completed');
  const pendingRecordings = recordings.filter(r => r.status === 'pending');

  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-container">
          <div className="auth-required">
            <h2>Требуется авторизация</h2>
            <p>Войдите в аккаунт, чтобы просмотреть личный кабинет</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Личный кабинет</h1>
          <div className="user-info-card">
            <h2>{user.name}</h2>
            <p className="user-email">{user.email}</p>
            <p className="user-role">
              {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </p>
          </div>
        </div>

        {pendingRecordings.length > 0 && (
          <div className="recordings-section">
            <h2>Записи, ожидающие оплаты</h2>
            <div className="recordings-list">
              {pendingRecordings.map(recording => (
                <div key={recording.id} className="recording-card">
                  <div className="recording-header">
                    <h3>{recordingTypesNames[recording.recording_type] || recording.recording_type}</h3>
                    <span className={`status-badge status-${recording.status}`}>
                      {statusNames[recording.status] || recording.status}
                    </span>
                  </div>
                  <div className="recording-details">
                    <div className="detail-item">
                      <span className="detail-label">Стиль музыки:</span>
                      <span className="detail-value">
                        {musicStylesNames[recording.music_style] || recording.music_style}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата создания:</span>
                      <span className="detail-value">
                        {new Date(recording.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {recording.price && (
                      <div className="detail-item">
                        <span className="detail-label">Стоимость:</span>
                        <span className="detail-value price">
                          {parseFloat(recording.price).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className="pay-recording-btn"
                    onClick={() => handlePayRecording(recording)}
                    disabled={payingRecordingId === recording.id}
                  >
                    {payingRecordingId === recording.id ? 'Обработка...' : 'Оплатить'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="recordings-section">
          <h2>Оплаченные записи</h2>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : paidRecordings.length === 0 ? (
            <div className="empty-recordings">
              <p>У вас пока нет оплаченных записей</p>
              <span className="empty-icon">📝</span>
            </div>
          ) : (
            <div className="recordings-list">
              {paidRecordings.map(recording => (
                <div key={recording.id} className="recording-card">
                  <div className="recording-header">
                    <h3>{recordingTypesNames[recording.recording_type] || recording.recording_type}</h3>
                    <span className={`status-badge status-${recording.status}`}>
                      {statusNames[recording.status] || recording.status}
                    </span>
                  </div>
                  <div className="recording-details">
                    <div className="detail-item">
                      <span className="detail-label">Стиль музыки:</span>
                      <span className="detail-value">
                        {musicStylesNames[recording.music_style] || recording.music_style}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата оплаты:</span>
                      <span className="detail-value">
                        {recording.paid_at ? new Date(recording.paid_at).toLocaleDateString('ru-RU') : '-'}
                      </span>
                    </div>
                    {recording.price && (
                      <div className="detail-item">
                        <span className="detail-label">Стоимость:</span>
                        <span className="detail-value price">
                          {parseFloat(recording.price).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="purchases-section">
          <h2>Купленные биты</h2>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : purchases.length === 0 ? (
            <div className="empty-recordings">
              <p>У вас пока нет купленных битов</p>
              <span className="empty-icon">🎵</span>
            </div>
          ) : (
            <div className="purchases-list">
              {purchases.map(purchase => (
                <div key={purchase.purchase_id} className="purchase-card">
                  <div className="purchase-cover">
                    {resolveCoverUrl(purchase.cover_path) ? (
                      <img
                        src={resolveCoverUrl(purchase.cover_path)}
                        alt={purchase.title}
                      />
                    ) : (
                      <div className="purchase-cover-placeholder">🎵</div>
                    )}
                  </div>
                  <div className="purchase-info">
                    <div className="purchase-title">{purchase.title}</div>
                    <div className="purchase-meta">
                      <span className="purchase-chip">{purchase.genre}</span>
                      <span className="purchase-chip">{purchase.bpm} BPM</span>
                      <span className="purchase-chip">
                        {Number(purchase.price).toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="purchase-date">
                        {new Date(purchase.paid_at || purchase.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
