import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserProfile.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function UserProfile() {
  const { user, token } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    'home-recording': 'Запись из дома'
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
      fetchRecordings();
    }
  }, [user, token]);

  const fetchRecordings = async () => {
    try {
      const response = await fetch(`${API_URL}/recordings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="recordings-section">
          <h2>Мои записи</h2>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : recordings.length === 0 ? (
            <div className="empty-recordings">
              <p>У вас пока нет записей</p>
              <span className="empty-icon">📝</span>
            </div>
          ) : (
            <div className="recordings-list">
              {recordings.map(recording => (
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
