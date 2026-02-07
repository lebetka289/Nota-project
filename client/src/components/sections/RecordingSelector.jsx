import './RecordingSelector.css';

function RecordingSelector({ onNavigate }) {
  const tabs = [
    {
      id: 'own-music',
      title: 'Запись на свою музыку',
      description: 'Запишите свой вокал на уже готовую музыку',
      page: 'recording'
    },
    {
      id: 'with-music',
      title: 'Запись с покупкой музыки',
      description: 'Выберите бит и запишите на него свой вокал',
      page: 'recording'
    },
    {
      id: 'buy-music',
      title: 'Покупка музыки',
      description: 'Приобретите готовые биты для ваших проектов',
      page: 'shop'
    }
  ];

  const handleTabClick = (tab) => {
    if (onNavigate) onNavigate(tab.page);
  };

  return (
    <div className="recording-selector-section">
      <div className="recording-selector-header">
        <h2>Выбор записи</h2>
        <p className="recording-subtitle">Выберите тип записи, который вам подходит</p>
      </div>

      <div className="recording-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className="recording-tab"
            onClick={() => handleTabClick(tab)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(tab);
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
    </div>
  );
}

export default RecordingSelector;
