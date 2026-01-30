import { useState } from 'react';
import Alert from '../widgets/Alert';
import './StudioBookingPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MUSIC_GENRES = [
  { value: '', label: 'Выберите жанр' },
  { value: 'pop', label: 'Поп' },
  { value: 'rap', label: 'Рэп / Хип-хоп' },
  { value: 'russian-rap', label: 'Русский рэп' },
  { value: 'indie', label: 'Инди' },
  { value: 'rock', label: 'Рок' },
  { value: 'electronic', label: 'Электронная музыка' },
  { value: 'rnb', label: 'R&B' },
  { value: 'jazz', label: 'Джаз' },
  { value: 'folk', label: 'Фолк / Авторская' },
  { value: 'other', label: 'Другое' }
];

function StudioBookingPage({ onNavigate }) {
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [intlPrefix, setIntlPrefix] = useState('+7');
  const [website, setWebsite] = useState('');
  const [musicGenre, setMusicGenre] = useState('');

  const [songsCount, setSongsCount] = useState('');
  const [musicDetails, setMusicDetails] = useState('');

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [hasMusicians, setHasMusicians] = useState('');
  const [needSessionMusicians, setNeedSessionMusicians] = useState('');
  const [needProducer, setNeedProducer] = useState('');
  const [needEngineer, setNeedEngineer] = useState('');

  const [additionalInfo, setAdditionalInfo] = useState('');

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

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
    if (!email.trim()) {
      showAlert('Укажите email.', 'error');
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showAlert('Некорректный email.', 'error');
      return false;
    }
    if (!musicGenre) {
      showAlert('Выберите жанр музыки.', 'error');
      return false;
    }
    if (!songsCount.trim() || Number(songsCount) < 1) {
      showAlert('Укажите количество песен (не менее 1).', 'error');
      return false;
    }
    if (!dateStart) {
      showAlert('Укажите желаемую дату начала записи.', 'error');
      return false;
    }
    if (!dateEnd) {
      showAlert('Укажите желаемую дату окончания.', 'error');
      return false;
    }
    if (new Date(dateEnd) < new Date(dateStart)) {
      showAlert('Дата окончания не может быть раньше даты начала.', 'error');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_URL}/studio-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          intlPrefix: intlPrefix.trim() || undefined,
          website: website.trim() || undefined,
          musicGenre,
          songsCount: Number(songsCount),
          musicDetails: musicDetails.trim() || undefined,
          dateStart,
          dateEnd,
          hasMusicians: hasMusicians === 'yes',
          needSessionMusicians: needSessionMusicians === 'yes',
          needProducer: needProducer === 'yes',
          needEngineer: needEngineer === 'yes',
          additionalInfo: additionalInfo.trim() || undefined
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showAlert('Заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setWebsite('');
        setMusicGenre('');
        setSongsCount('');
        setMusicDetails('');
        setDateStart('');
        setDateEnd('');
        setHasMusicians('');
        setNeedSessionMusicians('');
        setNeedProducer('');
        setNeedEngineer('');
        setAdditionalInfo('');
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
          {/* Контактные данные */}
          <section className="booking-section">
            <h2 className="booking-section-title">Контактные данные</h2>
            <div className="booking-fields booking-fields-inline">
              <div className="form-group booking-name-group">
                <label htmlFor="booking-first">Имя *</label>
                <input
                  id="booking-first"
                  type="text"
                  placeholder="Имя"
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
            <div className="booking-fields booking-phone-row">
              <div className="form-group">
                <label htmlFor="booking-phone">Телефон *</label>
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
                <label htmlFor="booking-intl">Межд. префикс</label>
                <input
                  id="booking-intl"
                  type="text"
                  placeholder="+7"
                  value={intlPrefix}
                  onChange={(e) => setIntlPrefix(e.target.value)}
                />
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-email">Email *</label>
                <input
                  id="booking-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-website">Сайт</label>
                <input
                  id="booking-website"
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-genre">Жанр музыки *</label>
                <select
                  id="booking-genre"
                  value={musicGenre}
                  onChange={(e) => setMusicGenre(e.target.value)}
                >
                  {MUSIC_GENRES.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                <span className="field-hint">Сколько песен планируете записать?</span>
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-details">О вашей музыке</label>
                <textarea
                  id="booking-details"
                  rows={4}
                  placeholder="Опишите стиль, идеи и по возможности приложите ссылки на треки."
                  value={musicDetails}
                  onChange={(e) => setMusicDetails(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Даты записи */}
          <section className="booking-section">
            <h2 className="booking-section-title">Когда хотите записаться?</h2>
            <div className="booking-fields booking-fields-inline">
              <div className="form-group">
                <label htmlFor="booking-date-start">Начало *</label>
                <input
                  id="booking-date-start"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-date-end">Окончание *</label>
                <input
                  id="booking-date-end"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>
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
            <h2 className="booking-section-title">Дополнительно</h2>
            <div className="booking-fields">
              <div className="form-group">
                <label htmlFor="booking-extra">Всё остальное</label>
                <textarea
                  id="booking-extra"
                  rows={3}
                  placeholder="Пожелания по времени, оборудованию, особые запросы."
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
