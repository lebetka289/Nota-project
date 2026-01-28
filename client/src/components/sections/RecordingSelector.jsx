import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RecordingSelector.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function RecordingSelector({ onNavigate }) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [alert, setAlert] = useState(null);

  const tabs = [
    {
      id: 'own-music',
      title: 'Запись на свою музыку',
      description: 'Запишите свой вокал на уже готовую музыку'
    },
    {
      id: 'with-music',
      title: 'Запись с покупкой музыки',
      description: 'Выберите бит и запишите на него свой вокал'
    },
    {
      id: 'buy-music',
      title: 'Покупка музыки',
      description: 'Приобретите готовые биты для ваших проектов'
    }
  ];

  const musicStyles = [
    { id: 'hyperpop', name: 'Хайпер поп', icon: 'HP', color: '#FF6B9D' },
    { id: 'pop-rock', name: 'Поп рок', icon: 'PR', color: '#4ECDC4' },
    { id: 'indie', name: 'Инди', icon: 'IN', color: '#95E1D3' },
    { id: 'lofi', name: 'Low-fi', icon: 'LF', color: '#F38181' },
    { id: 'russian-rap', name: 'Русский реп', icon: 'RR', color: '#AA96DA' },
    { id: 'funk', name: 'Фонк', icon: 'FN', color: '#FCBAD3' }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsPopupOpen(true);
    setSelectedStyle(null);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setActiveTab(null);
    setSelectedStyle(null);
    document.body.style.overflow = 'auto';
  };

  const openPopup = () => {
    setIsPopupOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleStyleSelect = async (styleId) => {
    setSelectedStyle(styleId);
    
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы продолжить', type: 'warning' });
      if (onNavigate) {
        onNavigate('auth');
      }
      closePopup();
      return;
    }

    const style = musicStyles.find(s => s.id === styleId);
    
    // Сохраняем данные в localStorage для передачи на страницу оплаты
    localStorage.setItem('recordingData', JSON.stringify({
      recordingType: activeTab,
      musicStyle: styleId,
      styleName: style.name
    }));

    // Сохраняем в БД
    try {
      await fetch(`${API_URL}/recordings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_type: activeTab,
          music_style: styleId
        })
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    // Переход на страницу оплаты
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('payment');
      }
      closePopup();
    }, 500);
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="recording-selector-section">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="recording-selector-header">
        <h2>Выбор записи</h2>
        <p className="recording-subtitle">Выберите тип записи, который вам подходит</p>
      </div>

      <div className="recording-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`recording-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(tab.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={tab.title}
          >
            <div className="tab-content">
              <h3 className="tab-title">{tab.title}</h3>
              <p className="tab-description">{tab.description}</p>
            </div>
            <div className="tab-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Попап окно */}
      {isPopupOpen && (
        <div
          className="recording-popup-overlay"
          onClick={closePopup}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePopup();
          }}
          tabIndex={-1}
        >
          <div
            className="recording-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="recording-popup-close"
              onClick={closePopup}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="popup-header-content">
              <h2 className="popup-title">{currentTab?.title}</h2>
              <p className="popup-description">{currentTab?.description}</p>
            </div>

            <div className="music-styles-container">
              <h3 className="styles-title">Выберите стиль музыки</h3>
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

export default RecordingSelector;
