import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../widgets/Alert';
import './PaymentPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function PaymentPage({ recordingType, musicStyle, onNavigate }) {
  const { user, token } = useAuth();
  const summaryOnly = typeof window !== 'undefined' && localStorage.getItem('paymentPageSummaryOnly') === '1';
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mockPaid, setMockPaid] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [purchasedBeats, setPurchasedBeats] = useState([]);
  const [selectedBeatId, setSelectedBeatId] = useState(null);
  const [showBeatDropdown, setShowBeatDropdown] = useState(false);
  const beatDropdownRef = useRef(null);
  const [loadingDiscount, setLoadingDiscount] = useState(true);
  const [alert, setAlert] = useState(null);

  // Получаем данные из localStorage или пропсов
  const recordingData = JSON.parse(localStorage.getItem('recordingData') || '{}');
  const finalType = recordingType || recordingData.recordingType || 'unknown';
  const finalStyle = musicStyle || recordingData.musicStyle || 'unknown';
  const purchasedBeatIdFromStorage = recordingData.purchasedBeatId || null;
  const studioBookingIdFromStorage = recordingData.studioBookingId || null;

  const musicStylesNames = {
    'hyperpop': 'Хайпер поп',
    'pop-rock': 'Поп рок',
    'indie': 'Инди',
    'lofi': 'Low-fi',
    'russian-rap': 'Русский реп',
    'funk': 'Фонк',
    'video-clip': 'Видеоклип'
  };

  const recordingTypesNames = {
    'own-music': 'Запись на свою музыку',
    'with-music': 'Запись с покупкой музыки',
    'home-recording': 'Запись на дому',
    'video-clip': 'Съёмка видеоклипа'
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
    'home-recording': [
      'Выбор стиля музыки для сводки трека',
      'Загрузка вашей демо-записи',
      'Анализ трека нашим продюсером',
      'Создание профессиональной сводки по жанру',
      'Получение обработанного трека',
      'Возможность дальнейшей записи в студии'
    ],
    'video-clip': [
      'Создание сценария клипа под вашу песню',
      'Подбор локаций и реквизита',
      'Профессиональная видеосъёмка',
      'Постпродакшн и цветокоррекция',
      'Синхронизация видео с вашим треком',
      'Финальная сдача клипа'
    ]
  };

  const priceByType = {
    'home-recording': 3500,
    'own-music': 5000,
    'with-music': 7000,
    'video-clip': 15000
  };

  // Загрузка информации о скидке и купленных битах
  useEffect(() => {
    if (!user || !token) {
      setLoadingDiscount(false);
      return;
    }

    const loadData = async () => {
      try {
        const [discountRes, beatsRes] = await Promise.all([
          fetch(`${API_URL}/payments/discount-info`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          finalType === 'with-music' ? fetch(`${API_URL}/beats/purchased`, {
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ ok: false })
        ]);

        if (discountRes.ok) {
          const discountData = await discountRes.json();
          setDiscountInfo(discountData);
        }

        if (beatsRes.ok) {
          const beatsData = await beatsRes.json();
          setPurchasedBeats(beatsData);
          // Устанавливаем выбранный бит из localStorage если есть
          if (purchasedBeatIdFromStorage) {
            const beatId = Number(purchasedBeatIdFromStorage);
            const beatExists = beatsData.find(b => b.id === beatId);
            if (beatExists) {
              setSelectedBeatId(beatId);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoadingDiscount(false);
      }
    };

    loadData();
  }, [user, token, finalType, purchasedBeatIdFromStorage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (beatDropdownRef.current && !beatDropdownRef.current.contains(e.target)) {
        setShowBeatDropdown(false);
      }
    };
    if (showBeatDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBeatDropdown]);

  const basePrice = priceByType[finalType] || 5000;
  const discountPercent = discountInfo?.discount_percent || 0;
  const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));

  const handlePayment = async () => {
    if (!user || !token) return;
    if (!finalType || !finalStyle || finalType === 'unknown' || finalStyle === 'unknown') {
      setAlert({ message: 'Не выбраны тип записи или стиль. Вернитесь назад и выберите их.', type: 'error' });
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
          music_style: finalStyle,
          purchased_beat_id: finalType === 'with-music' ? (selectedBeatId || null) : null,
          studio_booking_id: finalType === 'with-music' ? studioBookingIdFromStorage || null : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      setSaved(true);
      localStorage.removeItem('recordingData');

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else if (data.mock) {
        setMockPaid(true);
        setAlert({ message: 'Оплата проведена в тестовом режиме.', type: 'success' });
      } else {
        setAlert({ message: 'Платеж создан, но нет ссылки на оплату. Проверьте настройки YooKassa.', type: 'error' });
      }
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка оплаты', type: 'error' });
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

  const selectedBeat = purchasedBeats.find((b) => b.id === selectedBeatId);

  return (
    <div className="payment-page">
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="payment-container">
        <div className="payment-header">
          <h1>Оформление записи</h1>
          {saved && (
            <div className="saved-badge">Сохранено в личном кабинете</div>
          )}
          {mockPaid && (
            <div className="saved-badge">Оплачено в тестовом режиме</div>
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

        {/* Выбор купленного бита только для with-music */}
        {finalType === 'with-music' && purchasedBeats.length > 0 && (
          <div className="purchased-beats-section">
            <h2>Использовать купленный бит</h2>
            <p className="section-description">
              Вы можете использовать один из ваших купленных битов для этой записи
            </p>
            <div className="payment-beats-selector" ref={beatDropdownRef}>
              <label className="payment-beats-label">Купленные биты</label>
              <div className="payment-beats-dropdown">
                <button
                  type="button"
                  className="payment-beats-dropdown-btn"
                  onClick={() => setShowBeatDropdown((v) => !v)}
                >
                  {selectedBeat ? selectedBeat.title : 'Выберите бит'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showBeatDropdown && (
                  <div className="payment-beats-dropdown-menu" role="listbox" aria-label="Купленные биты">
                    <button
                      type="button"
                      className={`payment-beats-dropdown-item ${!selectedBeatId ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedBeatId(null);
                        setShowBeatDropdown(false);
                      }}
                    >
                      <div className="payment-beats-dropdown-placeholder">—</div>
                      <div className="payment-beats-dropdown-info">
                        <div className="payment-beats-dropdown-title">Не использовать купленный бит</div>
                        <div className="payment-beats-dropdown-meta">Запись будет оформлена без выбора бита</div>
                      </div>
                    </button>
                    {purchasedBeats.map((beat) => (
                      <button
                        key={beat.id}
                        type="button"
                        className={`payment-beats-dropdown-item ${selectedBeatId === beat.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedBeatId(beat.id);
                          setShowBeatDropdown(false);
                        }}
                      >
                        <div className="payment-beats-dropdown-cover">
                          {beat.cover_url ? (
                            <img src={beat.cover_url} alt={beat.title} />
                          ) : (
                            <div className="payment-beats-dropdown-placeholder">—</div>
                          )}
                        </div>
                        <div className="payment-beats-dropdown-info">
                          <div className="payment-beats-dropdown-title">{beat.title}</div>
                          <div className="payment-beats-dropdown-meta">{beat.genre} • BPM {beat.bpm}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pricing-section">
          <h2>Стоимость</h2>
          <div className="price-card">
            <div className="price-amount">
              <span className="price-label">От</span>
              {discountPercent > 0 ? (
                <div className="price-with-discount">
                  <span className="price-old">
                    {basePrice.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="price-value">
                    {finalPrice.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="discount-badge">-{discountPercent}%</span>
                </div>
              ) : (
                <span className="price-value">
                  {basePrice.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <p className="discount-info">
                У вас скидка {discountPercent}% за {discountInfo?.paid_recordings_count} оплаченных записей!
              </p>
            )}
            {discountPercent === 0 && discountInfo && discountInfo.records_needed_for_discount > 0 && (
              <p className="discount-hint">
                Осталось {discountInfo.records_needed_for_discount} {discountInfo.records_needed_for_discount === 1 ? 'запись' : 'записи'} до скидки 50%!
              </p>
            )}
            <p className="price-note">
              Точная стоимость зависит от выбранного типа услуги и деталей проекта.
              С вами свяжется менеджер для уточнения деталей.
            </p>
          </div>
        </div>

        <div className="payment-actions">
          {summaryOnly ? (
            <>
              <p className="payment-summary-hint">
                Оплату можно оформить в личном кабинете — там отображаются скидки и кнопка «Оплатить».
              </p>
              <div className="payment-summary-links">
                {onNavigate && (
                  <>
                    <button
                      type="button"
                      className="payment-summary-link payment-summary-link-home"
                      onClick={() => {
                        localStorage.removeItem('paymentPageSummaryOnly');
                        onNavigate('home');
                      }}
                    >
                      На главную
                    </button>
                    <button
                      type="button"
                      className="payment-summary-link payment-summary-link-profile"
                      onClick={() => {
                        localStorage.removeItem('paymentPageSummaryOnly');
                        onNavigate('profile');
                      }}
                    >
                      В личный кабинет
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="asos-payment-button"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Обработка...' : 'Перейти к оплате'}
              </button>
              <p className="payment-note">
                После оплаты с вами свяжется менеджер для согласования времени записи
              </p>
            </>
          )}
        </div>

        <div className="info-section">
          <h3>Дополнительная информация</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">Tel</span>
              <div>
                <strong>Телефон</strong>
                <p>+7 (495) 123-45-67</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">@</span>
              <div>
                <strong>Email</strong>
                <p>info@notastudio.ru</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">Addr</span>
              <div>
                <strong>Адрес</strong>
                <p>г. Москва, ул. Тверская, д. 10</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">Time</span>
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
