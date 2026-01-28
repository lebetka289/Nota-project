import { useState, useEffect } from 'react';
import './Features.css';

function Features() {
  const features = [
    { icon: 'REC', title: 'Профессиональное оборудование', description: 'Современная техника от ведущих производителей для качественной записи' },
    { icon: 'MIC', title: 'Опытные звукорежиссеры', description: 'Команда профессионалов с многолетним опытом работы в индустрии' },
    { icon: 'MIX', title: 'Сведение и мастеринг', description: 'Полный цикл обработки треков от записи до финального мастеринга' },
    { icon: 'TIME', title: 'Гибкий график', description: 'Работаем в удобное для вас время, включая выходные дни' },
    { icon: 'PRICE', title: 'Доступные цены', description: 'Честные цены без скрытых доплат и прозрачная система скидок' },
    { icon: 'FAST', title: 'Быстрая работа', description: 'Оперативная обработка заказов и соблюдение всех сроков' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Автоплей каждые 5 секунд
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, isAutoPlaying, features.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Возобновить автоплей через 10 сек
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const getSlidePosition = (index) => {
    const total = features.length;
    let diff = index - currentIndex;
    
    // Нормализуем разницу для циклического массива
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === -1) return 'left';
    if (diff === 2) return 'right-back';
    if (diff === -2) return 'left-back';
    return 'hidden';
  };

  return (
    <div className="features-section">
      <div className="section-header">
        <h2>Почему выбирают нас</h2>
        <p className="section-subtitle">Преимущества Nota Studio</p>
      </div>
      
      <div className="features-carousel">
        <button className="carousel-btn carousel-btn-prev" onClick={prevSlide} aria-label="Предыдущий">
          ‹
        </button>
        
        <div className="carousel-container">
          {features.map((feature, index) => {
            const position = getSlidePosition(index);
            return (
              <div
                key={index}
                className={`feature-slide feature-slide-${position}`}
                onClick={() => goToSlide(index)}
              >
                <div className="feature-slide-content">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <button className="carousel-btn carousel-btn-next" onClick={nextSlide} aria-label="Следующий">
          ›
        </button>
      </div>

      <div className="carousel-dots">
        {features.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Перейти к слайду ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Features;
