import { useState, useEffect } from 'react';
import Alert from '../widgets/Alert';
import './StudioBookingPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const resolveAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const base = (API_URL || '').replace(/\/api\/?$/, '');
  const path = avatarPath.startsWith('/') ? avatarPath : `/uploads/${avatarPath}`;
  return `${base}${path}`;
};

const RECORDING_TYPES = [
  { id: 'home-recording', label: 'Запись на дому' },
  { id: 'with-music', label: 'Запись с покупкой музыки' }
];

function StudioBookingPage({ onNavigate }) {
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [beatmakers, setBeatmakers] = useState([]);
  const [selectedBeatmakerId, setSelectedBeatmakerId] = useState(null);
  const [busyPeriods, setBusyPeriods] = useState([]);
  const [recordingType, setRecordingType] = useState('with-music');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [intlPrefix, setIntlPrefix] = useState('+7');
  const [musicGenre, setMusicGenre] = useState('');

  const [songsCount, setSongsCount] = useState('');
  const [musicDetails, setMusicDetails] = useState('');

  const [selectedBookingDates, setSelectedBookingDates] = useState([]);

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [workingDaysBeatmaker, setWorkingDaysBeatmaker] = useState([]);
  const [workingDaysLoading, setWorkingDaysLoading] = useState(false);

  const [hasMusicians, setHasMusicians] = useState('');
  const [needSessionMusicians, setNeedSessionMusicians] = useState('');
  const [needProducer, setNeedProducer] = useState('');
  const [needEngineer, setNeedEngineer] = useState('');

  const [additionalInfo, setAdditionalInfo] = useState('');

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    const beatmakerId = sessionStorage.getItem('studioBookingSelectedBeatmakerId');
    if (beatmakerId) {
      const id = Number(beatmakerId);
      if (Number.isInteger(id)) setSelectedBeatmakerId(id);
      sessionStorage.removeItem('studioBookingSelectedBeatmakerId');
    }
    const type = sessionStorage.getItem('studioBookingRecordingType');
    if (type && ['home-recording', 'with-music'].includes(type)) setRecordingType(type);
    const style = sessionStorage.getItem('studioBookingMusicStyle');
    if (style) setMusicGenre(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/studio-booking/beatmakers`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBeatmakers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setBeatmakers([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedBeatmakerId) {
      setBusyPeriods([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/studio-booking/availability/${selectedBeatmakerId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBusyPeriods(Array.isArray(data.busy) ? data.busy : []);
        } else if (!cancelled) setBusyPeriods([]);
      } catch (e) {
        if (!cancelled) setBusyPeriods([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedBeatmakerId]);

  useEffect(() => {
    if (!selectedBeatmakerId) {
      setWorkingDaysBeatmaker([]);
      return;
    }
    let cancelled = false;
    setWorkingDaysLoading(true);
    fetch(
      `${API_URL}/studio-booking/working-days/beatmaker/${selectedBeatmakerId}?year=${calendarYear}&month=${calendarMonth}`
    )
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data.dates) ? data.dates : [];
        const normalized = raw.map((d) => (typeof d === 'string' ? d.slice(0, 10) : (d && new Date(d).toISOString ? new Date(d).toISOString().slice(0, 10) : ''))).filter(Boolean);
        if (!cancelled) setWorkingDaysBeatmaker(normalized);
      })
      .catch(() => {
        if (!cancelled) setWorkingDaysBeatmaker([]);
      })
      .finally(() => {
        if (!cancelled) setWorkingDaysLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBeatmakerId, calendarYear, calendarMonth]);

  const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const getCalendarDays = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(dateStr);
    }
    return cells;
  };

  const isDateBusy = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00').getTime();
    return busyPeriods.some((p) => {
      const start = new Date(p.date_start + 'T00:00:00').getTime();
      const end = new Date((p.date_end || p.date_start) + 'T23:59:59').getTime();
      return d >= start && d <= end;
    });
  };

  const isWorkingDay = (dateStr) => {
    if (!dateStr) return false;
    const ymd = dateStr.slice(0, 10);
    return workingDaysBeatmaker.some((d) => String(d).slice(0, 10) === ymd);
  };

  const handleCalendarDayClick = (dateStr) => {
    if (!dateStr || !isWorkingDay(dateStr) || isDateBusy(dateStr)) return;
    const ymd = dateStr.slice(0, 10);
    setSelectedBookingDates((prev) =>
      prev.includes(ymd) ? prev.filter((d) => d !== ymd) : [...prev, ymd].sort()
    );
  };

  const bookingDatesSorted = [...selectedBookingDates].sort();
  const dateStart = bookingDatesSorted.length > 0 ? bookingDatesSorted[0] : '';
  const dateEnd = bookingDatesSorted.length > 0 ? bookingDatesSorted[bookingDatesSorted.length - 1] : '';
  const bookingDaysCount = bookingDatesSorted.length;

  const BASE_RECORDING_PRICE = 1000;
  const EXTRA_DAY_PRICE = 200;
  const totalBookingPrice = bookingDaysCount < 1 ? 0 : BASE_RECORDING_PRICE + (bookingDaysCount - 1) * EXTRA_DAY_PRICE;

  const validate = () => {
    if (!firstName.trim()) {
      showAlert('Укажите имя.', 'error');
      return false;
    }
    if (!lastName.trim()) {
      showAlert('Укажите фамилию.', 'error');
      return false;
    }
    if (!phone.trim()) {
      showAlert('Укажите телефон.', 'error');
      return false;
    }
    if (!musicGenre) {
      showAlert('Сначала выберите тип записи и жанр на странице «Запись».', 'error');
      return false;
    }
    if (!songsCount.trim() || Number(songsCount) < 1) {
      showAlert('Укажите количество песен (не менее 1).', 'error');
      return false;
    }
    if (selectedBookingDates.length < 1) {
      showAlert('Выберите хотя бы один день записи в календаре (нажмите на зелёные дни).', 'error');
      return false;
    }
    if (hasMusicians === '') {
      showAlert('Ответьте: есть ли у вас музыканты или группа?', 'error');
      return false;
    }
    if (needSessionMusicians === '') {
      showAlert('Ответьте: нужны ли сессионные музыканты?', 'error');
      return false;
    }
    if (needProducer === '') {
      showAlert('Ответьте: нужен ли продюсер?', 'error');
      return false;
    }
    if (needEngineer === '') {
      showAlert('Ответьте: нужен ли звукорежиссёр?', 'error');
      return false;
    }
    return true;
  };

  const buildBody = () => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    email: '',
    intlPrefix: intlPrefix.trim() || undefined,
    musicGenre: musicGenre || undefined,
    songsCount: Number(songsCount),
    musicDetails: musicDetails.trim() || undefined,
    dateStart: bookingDatesSorted.length > 0 ? bookingDatesSorted[0] : '',
    dateEnd: bookingDatesSorted.length > 0 ? bookingDatesSorted[bookingDatesSorted.length - 1] : '',
    hasMusicians: hasMusicians === 'yes',
    needSessionMusicians: needSessionMusicians === 'yes',
    needProducer: needProducer === 'yes',
    needEngineer: needEngineer === 'yes',
    additionalInfo: additionalInfo.trim() || undefined,
    beatmakerId: selectedBeatmakerId || undefined
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setAlert(null);

    try {
      let url = recordingType === 'home-recording'
        ? `${API_URL}/studio-booking/home-recording`
        : `${API_URL}/studio-booking/with-music`;
      let body = buildBody();
      if (recordingType === 'with-music') {
        url = `${API_URL}/studio-booking/with-music`;
        try {
          const stored = sessionStorage.getItem('studioBookingBeatIds');
          if (stored) {
            const ids = JSON.parse(stored);
            if (Array.isArray(ids) && ids.length) {
              body.beatIds = ids;
              body.beatId = ids[0];
            }
            sessionStorage.removeItem('studioBookingBeatIds');
          }
        } catch (_) {}
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showAlert('Заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setMusicGenre('');
        setSongsCount('');
        setMusicDetails('');
        setSelectedBookingDates([]);
        setHasMusicians('');
        setNeedSessionMusicians('');
        setNeedProducer('');
        setNeedEngineer('');
        setAdditionalInfo('');
        sessionStorage.removeItem('studioBookingRecordingType');
        sessionStorage.removeItem('studioBookingMusicStyle');
        if (data.bookingId && (recordingType === 'home-recording' || recordingType === 'with-music') && onNavigate) {
          localStorage.setItem('pendingStudioBookingId', String(data.bookingId));
          localStorage.setItem('paymentPageSummaryOnly', '1');
          setTimeout(() => onNavigate('payment'), 800);
        }
      } else {
        showAlert(data.message || data.error || 'Не удалось отправить заявку. Попробуйте позже.', 'error');
      }
    } catch (err) {
      showAlert('Ошибка соединения. Проверьте интернет и попробуйте снова.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="studio-booking-page">
      <div className="studio-booking-container">
        <header className="studio-booking-header">
          <h1>Запись на студию</h1>
          <p className="studio-booking-subtitle">
            Заполните форму — мы подберём время и ответим на все вопросы
          </p>
        </header>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        <form className="studio-booking-form" onSubmit={handleSubmit} noValidate>
          {/* Тип записи */}
          <section className="booking-section booking-section-type">
            <h2 className="booking-section-title">Тип записи</h2>
            <p className="booking-section-desc">Выберите формат записи</p>
            <div className="booking-type-row">
              {RECORDING_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`booking-type-chip ${recordingType === t.id ? 'selected' : ''}`}
                  onClick={() => setRecordingType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Выбор битмейкера */}
          {beatmakers.length > 0 && (
            <section className="booking-section booking-section-beatmaker">
              <h2 className="booking-section-title">Битмейкер</h2>
              <p className="booking-section-desc">Выберите, к кому хотите записаться</p>
              <div className="booking-beatmakers-row">
                {beatmakers.map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    className={`booking-beatmaker-chip ${selectedBeatmakerId === bm.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBeatmakerId(selectedBeatmakerId === bm.id ? null : bm.id)}
                  >
                    <span className="booking-beatmaker-chip-avatar">
                      {resolveAvatarUrl(bm.avatar_path) ? (
                        <img src={resolveAvatarUrl(bm.avatar_path)} alt="" />
                      ) : (
                        <span>{bm.name ? bm.name.charAt(0) : '?'}</span>
                      )}
                    </span>
                    <span className="booking-beatmaker-chip-name">{bm.name || 'Битмейкер'}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Контактные данные */}
          <section className="booking-section">
            <h2 className="booking-section-title">Контактные данные</h2>
            <div className="booking-fields booking-fields-inline">
              <div className="form-group booking-name-group">
                <label htmlFor="booking-first">Ваше имя *</label>
                <input
                  id="booking-first"
                  type="text"
                  placeholder="Как к вам обращаться"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group booking-name-group">
                <label htmlFor="booking-last">Фамилия *</label>
                <input
                  id="booking-last"
                  type="text"
                  placeholder="Фамилия"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="booking-fields booking-fields-inline booking-phone-row">
              <div className="form-group">
                <label htmlFor="booking-phone">Телефон для связи *</label>
                <input
                  id="booking-phone"
                  type="tel"
                  placeholder="+7 999 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="form-group booking-intl">
                <label htmlFor="booking-intl">Код страны</label>
                <input
                  id="booking-intl"
                  type="text"
                  placeholder="+7"
                  value={intlPrefix}
                  onChange={(e) => setIntlPrefix(e.target.value)}
                />
              </div>
            </div>
            {musicGenre ? (
              <p className="booking-genre-hint">Жанр: <strong>{musicGenre}</strong> (задан на странице «Запись»)</p>
            ) : (
              <p className="booking-genre-hint booking-genre-hint-warn">Сначала выберите тип записи и жанр на странице «Запись».</p>
            )}
          </section>

          {/* Детали проекта */}
          <section className="booking-section">
            <h2 className="booking-section-title">Детали проекта</h2>
            <div className="booking-fields">
              <div className="form-group form-group-narrow">
                <label htmlFor="booking-songs">Количество песен *</label>
                <input
                  id="booking-songs"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={songsCount}
                  onChange={(e) => setSongsCount(e.target.value)}
                />
                <span className="field-hint">Сколько треков планируете записать?</span>
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-details">О проекте</label>
                <textarea
                  id="booking-details"
                  rows={4}
                  placeholder="Стиль, идеи, ссылки на демо или референсы"
                  value={musicDetails}
                  onChange={(e) => setMusicDetails(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Даты записи */}
          <section className="booking-section">
            <h2 className="booking-section-title">Период записи</h2>
            {selectedBeatmakerId && (
              <div className="booking-calendar-wrap">
                <div className="booking-calendar-header">
                  <button
                    type="button"
                    className="booking-calendar-nav"
                    onClick={() => {
                      if (calendarMonth === 1) {
                        setCalendarYear((y) => y - 1);
                        setCalendarMonth(12);
                      } else setCalendarMonth((m) => m - 1);
                    }}
                  >
                    ← Назад
                  </button>
                  <h3 className="booking-calendar-title">
                    {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
                  </h3>
                  <button
                    type="button"
                    className="booking-calendar-nav"
                    onClick={() => {
                      if (calendarMonth === 12) {
                        setCalendarYear((y) => y + 1);
                        setCalendarMonth(1);
                      } else setCalendarMonth((m) => m + 1);
                    }}
                  >
                    Вперёд →
                  </button>
                </div>
                <p className="booking-calendar-hint">Зелёные дни — рабочие у битмейкера. Нажимайте на дни, чтобы выбрать несколько дней записи (повторное нажатие снимает выбор).</p>
                {workingDaysLoading ? (
                  <div className="booking-calendar-loading">Загрузка…</div>
                ) : (
                  <div className="booking-calendar-grid">
                    {WEEKDAY_NAMES.map((name) => (
                      <div key={name} className="booking-calendar-weekday">{name}</div>
                    ))}
                    {getCalendarDays().map((dateStr, idx) => {
                      const working = dateStr && isWorkingDay(dateStr);
                      const busy = dateStr && isDateBusy(dateStr);
                      const clickable = working && !busy;
                      const ymd = dateStr ? dateStr.slice(0, 10) : '';
                      const selected = ymd && selectedBookingDates.includes(ymd);
                      return (
                        <div
                          key={dateStr || `e-${idx}`}
                          className={`booking-calendar-day ${dateStr ? '' : 'booking-calendar-day-empty'} ${working ? 'booking-calendar-day-working' : ''} ${busy ? 'booking-calendar-day-busy' : ''} ${selected ? 'booking-calendar-day-selected' : ''}`}
                          role={clickable ? 'button' : undefined}
                          tabIndex={clickable ? 0 : undefined}
                          onClick={() => clickable && handleCalendarDayClick(dateStr)}
                          onKeyDown={(e) => clickable && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleCalendarDayClick(dateStr))}
                          aria-label={dateStr ? (clickable ? `Выбрать ${dateStr}` : undefined) : undefined}
                        >
                          {dateStr ? new Date(dateStr + 'T12:00:00').getDate() : ''}
                          {working && !busy && <span className="booking-calendar-day-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {selectedBeatmakerId && (
              <div className="booking-calendar-summary">
                {bookingDaysCount > 0 ? (
                  <>
                    <p className="booking-calendar-dates-hint">
                      Выбрано дней: <strong>{bookingDaysCount}</strong>
                      {dateStart && dateEnd && dateStart !== dateEnd && ` • Период: ${dateStart} — ${dateEnd}`}
                      {dateStart && dateEnd && dateStart === dateEnd && ` • Дата: ${dateStart}`}
                    </p>
                    <p className="booking-calendar-price">
                      Стоимость: <strong>{totalBookingPrice.toLocaleString('ru-RU')} ₽</strong>
                      {bookingDaysCount > 1 && (
                        <span className="booking-calendar-price-extra"> (1 день — {BASE_RECORDING_PRICE.toLocaleString('ru-RU')} ₽, за каждый дополнительный день +{EXTRA_DAY_PRICE} ₽)</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="booking-calendar-dates-hint">Нажмите на зелёные дни в календаре, чтобы выбрать дни записи.</p>
                )}
              </div>
            )}
            {!selectedBeatmakerId && (
              <p className="booking-calendar-no-beatmaker">Выберите битмейкера на главной (секция «Почему выбирают нас») и нажмите «Записаться», затем выберите тип записи и перейдите к форме.</p>
            )}
          </section>

          {/* Услуги */}
          <section className="booking-section">
            <h2 className="booking-section-title">Услуги</h2>
            <div className="booking-radio-group">
              <div className="booking-radio-item">
                <span className="booking-radio-label">У вас есть музыканты или группа? *</span>
                <div className="booking-radio-options">
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="hasMusicians"
                      value="yes"
                      checked={hasMusicians === 'yes'}
                      onChange={() => setHasMusicians('yes')}
                    />
                    <span>Да</span>
                  </label>
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="hasMusicians"
                      value="no"
                      checked={hasMusicians === 'no'}
                      onChange={() => setHasMusicians('no')}
                    />
                    <span>Нет</span>
                  </label>
                </div>
              </div>
              <div className="booking-radio-item">
                <span className="booking-radio-label">Нужны сессионные музыканты? *</span>
                <div className="booking-radio-options">
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needSessionMusicians"
                      value="yes"
                      checked={needSessionMusicians === 'yes'}
                      onChange={() => setNeedSessionMusicians('yes')}
                    />
                    <span>Да</span>
                  </label>
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needSessionMusicians"
                      value="no"
                      checked={needSessionMusicians === 'no'}
                      onChange={() => setNeedSessionMusicians('no')}
                    />
                    <span>Нет</span>
                  </label>
                </div>
              </div>
              <div className="booking-radio-item">
                <span className="booking-radio-label">Нужен продюсер? *</span>
                <span className="field-hint booking-radio-hint">Рекомендуем «Да», если сомневаетесь.</span>
                <div className="booking-radio-options">
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needProducer"
                      value="yes"
                      checked={needProducer === 'yes'}
                      onChange={() => setNeedProducer('yes')}
                    />
                    <span>Да</span>
                  </label>
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needProducer"
                      value="no"
                      checked={needProducer === 'no'}
                      onChange={() => setNeedProducer('no')}
                    />
                    <span>Нет</span>
                  </label>
                </div>
              </div>
              <div className="booking-radio-item">
                <span className="booking-radio-label">Нужен звукорежиссёр? *</span>
                <span className="field-hint booking-radio-hint">Рекомендуем «Да», если сомневаетесь.</span>
                <div className="booking-radio-options">
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needEngineer"
                      value="yes"
                      checked={needEngineer === 'yes'}
                      onChange={() => setNeedEngineer('yes')}
                    />
                    <span>Да</span>
                  </label>
                  <label className="booking-radio-opt">
                    <input
                      type="radio"
                      name="needEngineer"
                      value="no"
                      checked={needEngineer === 'no'}
                      onChange={() => setNeedEngineer('no')}
                    />
                    <span>Нет</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Дополнительно */}
          <section className="booking-section">
            <h2 className="booking-section-title">Пожелания</h2>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-extra">Особые запросы</label>
                <textarea
                  id="booking-extra"
                  rows={3}
                  placeholder="Оборудование, время суток, другие пожелания"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="booking-submit-wrap">
            <button
              type="submit"
              className="booking-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </div>
        </form>

        {onNavigate && (
          <p className="studio-booking-back">
            <button
              type="button"
              className="booking-back-link"
              onClick={() => onNavigate('home')}
            >
              ← На главную
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default StudioBookingPage;
