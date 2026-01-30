import { useState } from 'react';
import './StudioInfo.css';

function StudioInfo({ onNavigate }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Данные о студии
  const studioData = {
    name: 'Nota Studio',
    address: 'г. Москва, ул. Тверская, д. 10, офис 205',
    workingHours: {
      weekdays: 'Пн-Пт: 10:00 - 22:00',
      weekend: 'Сб-Вс: 12:00 - 20:00'
    },
    phone: '+7 (495) 123-45-67',
    email: 'info@notastudio.ru'
  };

  // Фотографии студии (заглушки - можно заменить на реальные URL)
  const studioImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      title: 'Главный зал студии',
      description: 'Просторный зал с профессиональным оборудованием'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      title: 'Зона записи',
      description: 'Современная звукозаписывающая студия'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      title: 'Микшерный пульт',
      description: 'Профессиональное оборудование для сведения'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      title: 'Вокальная кабина',
      description: 'Изолированная кабина для записи вокала'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      title: 'Релакс зона',
      description: 'Комфортная зона отдыха для артистов'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      title: 'Оборудование',
      description: 'Современные инструменты и техника'
    }
  ];

  const openPopup = (index = 0) => {
    setSelectedImageIndex(index);
    setIsPopupOpen(true);
    document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    document.body.style.overflow = 'auto'; // Восстанавливаем скролл
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % studioImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + studioImages.length) % studioImages.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closePopup();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  };

  return (
    <div className="studio-info-section">
      <div className="studio-info-header">
        <h2>Наша студия</h2>
        <p className="studio-subtitle">Ознакомьтесь с нашими помещениями и оборудованием</p>
      </div>

      <div className="studio-gallery">
        {studioImages.map((image, index) => (
          <div
            key={image.id}
            className="studio-image-card"
            onClick={() => openPopup(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openPopup(index);
            }}
            tabIndex={0}
            role="button"
            aria-label={`Открыть ${image.title}`}
          >
            <div className="image-wrapper">
              <img
                src={image.url}
                alt={image.title}
                className="studio-image"
                loading="lazy"
              />
              <div className="image-overlay">
                <div className="overlay-content">
                  <h3 className="image-title">{image.title}</h3>
                  <p className="image-description">{image.description}</p>
                  <span className="view-more">Нажмите для просмотра</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Попап окно */}
      {isPopupOpen && (
        <div
          className="studio-popup-overlay"
          onClick={closePopup}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div
            className="studio-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="popup-close-btn"
              onClick={closePopup}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="popup-header">
              <h2 className="popup-studio-name">{studioData.name}</h2>
              <div className="popup-studio-info">
                <div className="info-item">
                  <span className="info-icon">Addr</span>
                  <span className="info-text">{studioData.address}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">Time</span>
                  <span className="info-text">
                    {studioData.workingHours.weekdays}<br />
                    {studioData.workingHours.weekend}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-icon">Tel</span>
                  <span className="info-text">{studioData.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">@</span>
                  <span className="info-text">{studioData.email}</span>
                </div>
              </div>
            </div>

            <div className="popup-image-container">
              <button
                className="popup-nav-btn prev"
                onClick={prevImage}
                aria-label="Предыдущее фото"
              >
                ‹
              </button>

              <div className="popup-main-image">
                <img
                  src={studioImages[selectedImageIndex].url}
                  alt={studioImages[selectedImageIndex].title}
                  className="popup-image"
                />
                <div className="popup-image-info">
                  <h3>{studioImages[selectedImageIndex].title}</h3>
                  <p>{studioImages[selectedImageIndex].description}</p>
                </div>
              </div>

              <button
                className="popup-nav-btn next"
                onClick={nextImage}
                aria-label="Следующее фото"
              >
                ›
              </button>
            </div>

            <div className="popup-thumbnails">
              {studioImages.map((image, index) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.title}
                  className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>

            <div className="popup-counter">
              {selectedImageIndex + 1} / {studioImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioInfo;
