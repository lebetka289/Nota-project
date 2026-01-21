import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PaymentPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function PaymentPage({ recordingType, musicStyle }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Получаем данные из localStorage или пропсов
  const recordingData = JSON.parse(localStorage.getItem('recordingData') || '{}');
  const finalType = recordingType || recordingData.recordingType || 'unknown';
  const finalStyle = musicStyle || recordingData.musicStyle || 'unknown';

  const musicStylesNames = {
    'hyperpop': 'Хайпер поп',
    'pop-rock': 'Поп рок',
    'indie': 'Инди',
    'lofi': 'Low-fi',
    'russian-rap': 'Русский реп',
    'funk': 'Фонк'
  };

  const recordingTypesNames = {
    'own-music': 'Запись на свою музыку',
    'with-music': 'Запись с покупкой музыки',
    'buy-music': 'Покупка музыки',
    'home-recording': 'Запись из дома'
  };

  const processSteps = {
    'own-music': [
      'Загрузите свою музыку в формате WAV, MP3 или FLAC',
      'Наш звукорежиссер прослушает материал и подготовит студию',
      'Вы приезжаете в студию в назначенное время',
      'Профессиональная запись вокала на вашу музыку',
      'Сведение и мастеринг готового трека',
      'Получение финального результата в высоком качестве'
    ],
    'with-music': [
      'Выбор бита из нашей библиотеки в выбранном стиле',
      'Прослушивание и утверждение бита',
      'Запись вокала в студии на выбранный бит',
      'Сведение вокала с битом',
      'Мастеринг финального трека',
      'Получение готового трека'
    ],
    'buy-music': [
      'Просмотр каталога битов в выбранном стиле',
      'Выбор и покупка понравившегося бита',
      'Получение бита в высоком качестве (WAV, MP3)',
      'Лицензия на использование бита',
      'Возможность записи вокала на купленный бит'
    ],
    'home-recording': [
      'Выбор стиля музыки для сводки трека',
      'Загрузка вашей демо-записи',
      'Анализ трека нашим продюсером',
      'Создание профессиональной сводки по жанру',
      'Получение обработанного трека',
      'Возможность дальнейшей записи в студии'
    ]
  };

  const handlePayment = async () => {
    if (!user || !token) return;
    if (!finalType || !finalStyle || finalType === 'unknown' || finalStyle === 'unknown') {
      alert('Не выбраны тип записи или стиль. Вернитесь назад и выберите их.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/payments/yookassa/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_type: finalType,
          music_style: finalStyle
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // пометим, что выбор сохранён (по факту запись создаст сервер при создании платежа)
      setSaved(true);
      localStorage.removeItem('recordingData');

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        alert('Платеж создан, но нет ссылки на оплату. Проверьте настройки YooKassa.');
      }
    } catch (e) {
      alert(e.message || 'Ошибка оплаты');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="auth-required">
            <h2>Требуется авторизация</h2>
            <p>Войдите в аккаунт, чтобы продолжить оформление записи</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Оформление записи</h1>
          {saved && (
            <div className="saved-badge">
              ✓ Сохранено в личном кабинете
            </div>
          )}
        </div>

        <div className="recording-summary">
          <div className="summary-card">
            <h3>Тип записи</h3>
            <p>{recordingTypesNames[finalType] || finalType}</p>
          </div>
          <div className="summary-card">
            <h3>Стиль музыки</h3>
            <p>{musicStylesNames[finalStyle] || finalStyle}</p>
          </div>
        </div>

        <div className="process-section">
          <h2>Как проходит процесс записи</h2>
          <div className="process-steps">
            {(processSteps[finalType] || processSteps['own-music']).map((step, index) => (
              <div key={index} className="process-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <p>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-section">
          <h2>Стоимость</h2>
          <div className="price-card">
            <div className="price-amount">
              <span className="price-label">От</span>
              <span className="price-value">5 000 ₽</span>
            </div>
            <p className="price-note">
              Точная стоимость зависит от выбранного типа записи и стиля музыки.
              С вами свяжется менеджер для уточнения деталей.
            </p>
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="payment-button"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Обработка...' : 'Перейти к оплате'}
          </button>
          <p className="payment-note">
            После оплаты с вами свяжется менеджер для согласования времени записи
          </p>
        </div>

        <div className="info-section">
          <h3>Дополнительная информация</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">📞</span>
              <div>
                <strong>Телефон</strong>
                <p>+7 (495) 123-45-67</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">✉️</span>
              <div>
                <strong>Email</strong>
                <p>info@notastudio.ru</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div>
                <strong>Адрес</strong>
                <p>г. Москва, ул. Тверская, д. 10</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🕐</span>
              <div>
                <strong>Время работы</strong>
                <p>Пн-Пт: 10:00 - 22:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
