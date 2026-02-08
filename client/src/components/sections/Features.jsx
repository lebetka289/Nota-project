import { useState, useEffect } from 'react';
import './Features.css';

function Features() {
  const features = [
    { title: 'Профессиональное оборудование', description: 'Современная техника от ведущих производителей для качественной записи', image: '/features/feature1.png' },
    { title: 'Опытные звукорежиссеры', description: 'Команда профессионалов с многолетним опытом работы в индустрии', image: '/features/feature2.png' },
    { title: 'Сведение и мастеринг', description: 'Полный цикл обработки треков от записи до финального мастеринга', image: '/features/feature3.png' },
    { title: 'Гибкий график', description: 'Работаем в удобное для вас время, включая выходные дни', image: '/features/feature4.png' },
    { title: 'Доступные цены', description: 'Честные цены без скрытых доплат и прозрачная система скидок', image: '/features/feature5.png' },
    { title: 'Быстрая работа', description: 'Оперативная обработка заказов и соблюдение всех сроков', image: '/features/feature6.png' }
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
                <div
                  className={`feature-slide-content ${feature.image ? 'feature-slide-content--with-image' : ''}`}
                  style={feature.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.5)), url(${feature.image})` } : undefined}
                >
                
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
