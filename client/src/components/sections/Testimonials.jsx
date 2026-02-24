import { useEffect, useState } from 'react';
import './Testimonials.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/reviews`);
        if (response.ok) {
          const data = await response.json();
          // Берем последние 6 отзывов
          setReviews(data.slice(0, 6));
        }
      } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`testimonial-star ${index < rating ? 'filled' : ''}`}>*</span>
    ));
  };

  if (loading) {
    return (
      <div className="testimonials-section">
        <div className="section-header">
          <h2>Отзывы клиентов</h2>
          <p className="section-subtitle">Что говорят о нас</p>
        </div>
        <div className="testimonials-loading">Загрузка...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="testimonials-section">
      <div className="section-header">
        <h2>Отзывы клиентов</h2>
        <p className="section-subtitle">Что говорят о нас</p>
      </div>
      <div className="testimonials-grid">
        {reviews.map((review) => (
          <div key={review.id} className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar">
                {(review.user_name || 'П').charAt(0).toUpperCase()}
              </div>
              <div className="testimonial-user-info">
                <div className="testimonial-name">{review.user_name || 'Клиент'}</div>
                <div className="testimonial-date">
                  {new Date(review.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <div className="testimonial-rating">
              {renderStars(review.rating)}
            </div>
            <p className="testimonial-text">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Testimonials;
