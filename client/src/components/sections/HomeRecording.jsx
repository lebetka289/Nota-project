import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './HomeRecording.css';
import Alert from '../widgets/Alert';

function HomeRecording({ onNavigate }) {
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [alert, setAlert] = useState(null);

  const musicStyles = [
    { id: 'hyperpop', name: 'Хайпер поп', icon: 'HP', color: '#FF6B9D', description: 'Современный электронный поп с яркими синтезаторами' },
    { id: 'pop-rock', name: 'Поп рок', icon: 'PR', color: '#4ECDC4', description: 'Энергичный поп с элементами рока' },
    { id: 'indie', name: 'Инди', icon: 'IN', color: '#95E1D3', description: 'Независимая музыка с уникальным звучанием' },
    { id: 'lofi', name: 'Low-fi', icon: 'LF', color: '#F38181', description: 'Расслабляющая музыка с винтажным звуком' },
    { id: 'russian-rap', name: 'Русский реп', icon: 'RR', color: '#AA96DA', description: 'Русскоязычный хип-хоп и рэп' },
    { id: 'funk', name: 'Фонк', icon: 'FN', color: '#FCBAD3', description: 'Фанк-музыка с грувом и басовыми линиями' }
  ];

  const handleOpenPopup = () => {
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы использовать запись из дома', type: 'warning' });
      if (onNavigate) {
        onNavigate('auth');
      }
      return;
    }
    setIsPopupOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedStyle(null);
    document.body.style.overflow = 'auto';
  };

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
    const style = musicStyles.find(s => s.id === styleId);
    
    // Сохраняем данные в localStorage
    localStorage.setItem('recordingData', JSON.stringify({
      recordingType: 'home-recording',
      musicStyle: styleId,
      styleName: style.name
    }));

    // Переход на страницу оплаты
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('payment');
      }
      closePopup();
    }, 500);
  };

  return (
    <div className="home-recording-section">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="home-recording-card" onClick={handleOpenPopup}>
        <div className="card-content">
          <div className="card-icon">HOME</div>
          <h3 className="card-title">Запись из дома</h3>
          <p className="card-description">
            Профессиональная сводка трека по жанрам. 
            Загрузите свою демо-запись и получите качественную обработку.
          </p>
          <div className="card-features">
            <span className="feature">Сводка по жанру</span>
            <span className="feature">Обработка вокала</span>
            <span className="feature">Мастеринг</span>
          </div>
        </div>
        <div className="card-arrow">→</div>
      </div>

      {/* Попап окно */}
      {isPopupOpen && (
        <div
          className="home-recording-popup-overlay"
          onClick={closePopup}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePopup();
          }}
          tabIndex={-1}
        >
          <div
            className="home-recording-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="home-recording-popup-close"
              onClick={closePopup}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="popup-header-content">
              <h2 className="popup-title">Запись из дома</h2>
              <p className="popup-description">
                Выберите стиль музыки для сводки вашего трека
              </p>
            </div>

            <div className="music-styles-container">
              <h3 className="styles-title">Выберите жанр для сводки</h3>
              <div className="music-styles-grid">
                {musicStyles.map(style => (
                  <div
                    key={style.id}
                    className={`music-style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => handleStyleSelect(style.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStyleSelect(style.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Выбрать стиль ${style.name}`}
                    style={{ '--style-color': style.color }}
                  >
                    <div className="style-icon">{style.icon}</div>
                    <div className="style-name">{style.name}</div>
                    <div className="style-description">{style.description}</div>
                    {selectedStyle === style.id && (
                      <div className="style-check">OK</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeRecording;
