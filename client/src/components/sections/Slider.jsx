import { useState, useEffect } from 'react';
import './Slider.css';

function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: 'Профессиональная звукозапись',
      description: 'Современное оборудование и опытные звукорежиссеры'
    },
    {
      title: 'Сведение и мастеринг',
      description: 'Качественная обработка ваших треков'
    },
    {
      title: 'Студийное время',
      description: 'Аренда студии для ваших проектов'
    }
  ];

  // Автоплей каждые 5 секунд (всегда работает)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="slider-container">
      <div className="slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
          >
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
          </div>
        ))}
      </div>
      
      {/* Навигация справа снизу */}
      <div className="slider-controls">
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            >
              {index === currentSlide && (
                <svg className="dot-progress" viewBox="0 0 36 36">
                  <circle
                    className="progress-ring"
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="rgba(225, 6, 47, 1)"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="slider-buttons">
          <button className="slider-btn prev" onClick={prevSlide}>
            ‹
          </button>
          <button className="slider-btn next" onClick={nextSlide}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default Slider;
