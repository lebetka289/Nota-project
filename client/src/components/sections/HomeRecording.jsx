import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './HomeRecording.css';
import Alert from '../widgets/Alert';

function HomeRecording({ onNavigate }) {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);

  const handleCardClick = () => {
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы использовать запись из дома', type: 'warning' });
      if (onNavigate) onNavigate('auth');
      return;
    }
    if (onNavigate) onNavigate('recording');
  };

  return (
    <div className="home-recording-section">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="home-recording-card" onClick={handleCardClick}>
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

    </div>
  );
}

export default HomeRecording;
