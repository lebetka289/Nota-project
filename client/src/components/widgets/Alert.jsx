import { useEffect } from 'react';
import './Alert.css';

function Alert({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`asos-alert asos-alert-${type}`}>
      <div className="asos-alert-content">
        <div className="asos-alert-message">{message}</div>
        {onClose && (
          <button
            type="button"
            className="asos-alert-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
