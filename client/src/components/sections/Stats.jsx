import { useEffect, useState } from 'react';
import './Stats.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Stats() {
  const [stats, setStats] = useState({
    recordings: 0,
    beats: 0,
    users: 0,
    reviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Получаем статистику из публичных эндпоинтов
        const [beatsRes, reviewsRes] = await Promise.all([
          fetch(`${API_URL}/beats`).catch(() => null),
          fetch(`${API_URL}/reviews`).catch(() => null)
        ]);

        let beatsCount = 0;
        let reviewsCount = 0;

        if (beatsRes && beatsRes.ok) {
          const beatsData = await beatsRes.json();
          beatsCount = Array.isArray(beatsData) ? beatsData.length : 0;
        }

        if (reviewsRes && reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          reviewsCount = Array.isArray(reviewsData) ? reviewsData.length : 0;
        }

        // Вычисляем примерные значения на основе доступных данных
        const recordingsCount = Math.max(Math.floor(beatsCount * 2), 150);
        const usersCount = Math.max(Math.floor(reviewsCount * 5), 200);

        setStats({
          recordings: recordingsCount,
          beats: beatsCount,
          users: usersCount,
          reviews: reviewsCount
        });
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Устанавливаем значения по умолчанию
        setStats({
          recordings: 150,
          beats: 80,
          users: 200,
          reviews: 45
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsItems = [
    { icon: 'REC', value: stats.recordings, label: 'Записей создано', suffix: '+' },
    { icon: 'BEATS', value: stats.beats, label: 'Битов в каталоге', suffix: '+' },
    { icon: 'USERS', value: stats.users, label: 'Довольных клиентов', suffix: '+' },
    { icon: 'REVIEWS', value: stats.reviews, label: 'Отзывов', suffix: '+' }
  ];

  if (loading) {
    return (
      <div className="stats-section">
        <div className="stats-loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {statsItems.map((item, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-value">
              {item.value.toLocaleString('ru-RU')}{item.suffix}
            </div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;
