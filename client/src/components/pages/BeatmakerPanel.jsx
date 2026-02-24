import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './BeatmakerPanel.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const GENRES = [
  { id: 'hyperpop', name: 'Хайпер поп' },
  { id: 'pop-rock', name: 'Поп рок' },
  { id: 'indie', name: 'Инди' },
  { id: 'lofi', name: 'Low-fi' },
  { id: 'russian-rap', name: 'Русский реп' },
  { id: 'funk', name: 'Фонк' }
];

const BOOKING_GENRE_NAMES = {
  pop: 'Поп',
  rap: 'Рэп / Хип-хоп',
  'russian-rap': 'Русский рэп',
  indie: 'Инди',
  rock: 'Рок',
  electronic: 'Электронная музыка',
  rnb: 'R&B',
  jazz: 'Джаз',
  folk: 'Фолк / Авторская',
  other: 'Другое'
};

function BookingCard({
  booking,
  onTakeToWork,
  takingId,
  onRejectClick,
  onRejectSubmit,
  onRejectCancel,
  rejectingBookingId,
  rejectReason,
  onRejectReasonChange,
  rejectingId
}) {
  const taking = takingId === booking.id;
  const rejecting = rejectingId === booking.id;
  const showRejectForm = rejectingBookingId === booking.id;
  const genreLabel = BOOKING_GENRE_NAMES[booking.musicGenre] || booking.musicGenre;

  return (
    <div className="bm-booking-card">
      <div className="bm-booking-header">
        <span className="bm-booking-name">{booking.firstName} {booking.lastName}</span>
        <span className="bm-booking-date">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('ru-RU') : ''}</span>
      </div>
      <div className="bm-booking-grid">
        <div className="bm-booking-row">
          <span className="bm-booking-label">Контакты</span>
          <span>{booking.phone}</span>
          <span>{booking.email}</span>
          {booking.website && <a href={booking.website} target="_blank" rel="noreferrer">{booking.website}</a>}
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Жанр</span>
          <span className="bm-pill">{genreLabel}</span>
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Песен</span>
          <span>{booking.songsCount}</span>
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Даты</span>
          <span>{booking.dateStart} — {booking.dateEnd}</span>
        </div>
        <div className="bm-booking-row bm-booking-services">
          <span className="bm-booking-label">Услуги</span>
          <span>Музыканты/группа: {booking.hasMusicians ? 'Да' : 'Нет'}</span>
          <span>Сессионные: {booking.needSessionMusicians ? 'Да' : 'Нет'}</span>
          <span>Продюсер: {booking.needProducer ? 'Да' : 'Нет'}</span>
          <span>Звукорежиссёр: {booking.needEngineer ? 'Да' : 'Нет'}</span>
        </div>
        {booking.musicDetails && (
          <div className="bm-booking-row bm-booking-details">
            <span className="bm-booking-label">О музыке</span>
            <p>{booking.musicDetails}</p>
          </div>
        )}
        {booking.additionalInfo && (
          <div className="bm-booking-row bm-booking-details">
            <span className="bm-booking-label">Дополнительно</span>
            <p>{booking.additionalInfo}</p>
          </div>
        )}
      </div>
      {(onTakeToWork || onRejectClick) && (
        <div className="bm-booking-actions">
          {!showRejectForm ? (
            <>
              {onTakeToWork && (
                <button
                  type="button"
                  className="bm-btn-take"
                  onClick={() => onTakeToWork(booking.id)}
                  disabled={taking}
                >
                  {taking ? 'Отправка…' : 'Взять в работу'}
                </button>
              )}
              {onRejectClick && (
                <button
                  type="button"
                  className="bm-btn-reject"
                  onClick={() => onRejectClick(booking.id)}
                >
                  Не принять
                </button>
              )}
            </>
          ) : (
            <div className="bm-reject-form">
              <label className="bm-reject-label">Причина отклонения</label>
              <textarea
                className="bm-reject-textarea"
                placeholder="Укажите причину (по желанию)"
                value={rejectReason}
                onChange={(e) => onRejectReasonChange(e.target.value)}
                rows={3}
              />
              <div className="bm-reject-buttons">
                <button
                  type="button"
                  className="bm-btn-reject-submit"
                  onClick={() => onRejectSubmit(booking.id)}
                  disabled={rejecting}
                >
                  {rejecting ? 'Отправка…' : 'Отправить'}
                </button>
                <button
                  type="button"
                  className="bm-btn-reject-cancel"
                  onClick={onRejectCancel}
                >
                  Отменить
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingInWorkCard({ booking, onDownloadBeat, onUploadTrack, onSendTrack, uploadingId, sendingId }) {
  const genreLabel = BOOKING_GENRE_NAMES[booking.musicGenre] || booking.musicGenre;
  const isPaid = booking.isPaid === true;
  const hasRecording = Boolean(booking.recordingId);
  const hasTrack = Boolean(booking.trackFilePath);

  return (
    <div className="bm-booking-card bm-booking-in-work">
      <div className="bm-booking-header">
        <span className="bm-booking-name">{booking.firstName} {booking.lastName}</span>
        <span className="bm-booking-date">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('ru-RU') : ''}</span>
        <span className={`bm-booking-paid-badge ${isPaid ? 'paid' : 'not-paid'}`}>
          {isPaid ? 'Оплачено' : 'Не оплачено'}
        </span>
      </div>
      <div className="bm-booking-grid">
        <div className="bm-booking-row">
          <span className="bm-booking-label">Контакты</span>
          <span>{booking.phone}</span>
          {booking.email && <span>{booking.email}</span>}
          {isPaid && booking.userEmail && <span className="bm-booking-email">Email: {booking.userEmail}</span>}
          {booking.website && <a href={booking.website} target="_blank" rel="noreferrer">{booking.website}</a>}
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Жанр</span>
          <span className="bm-pill">{genreLabel}</span>
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Песен</span>
          <span>{booking.songsCount}</span>
        </div>
        <div className="bm-booking-row">
          <span className="bm-booking-label">Даты</span>
          <span>{booking.dateStart} — {booking.dateEnd}</span>
        </div>
        {booking.beat && (
          <div className="bm-booking-row bm-booking-beat">
            <span className="bm-booking-label">Выбранный бит</span>
            <span>{booking.beat.title || 'Бит'}</span>
            <button
              type="button"
              className="bm-link"
              onClick={() => onDownloadBeat(booking.beat.id)}
            >
              Скачать бит
            </button>
          </div>
        )}
        <div className="bm-booking-row bm-booking-services">
          <span className="bm-booking-label">Услуги</span>
          <span>Музыканты/группа: {booking.hasMusicians ? 'Да' : 'Нет'}</span>
          <span>Сессионные: {booking.needSessionMusicians ? 'Да' : 'Нет'}</span>
          <span>Продюсер: {booking.needProducer ? 'Да' : 'Нет'}</span>
          <span>Звукорежиссёр: {booking.needEngineer ? 'Да' : 'Нет'}</span>
        </div>
        {booking.musicDetails && (
          <div className="bm-booking-row bm-booking-details">
            <span className="bm-booking-label">О музыке</span>
            <p>{booking.musicDetails}</p>
          </div>
        )}
        {booking.additionalInfo && (
          <div className="bm-booking-row bm-booking-details">
            <span className="bm-booking-label">Дополнительно</span>
            <p>{booking.additionalInfo}</p>
          </div>
        )}
      </div>
      {isPaid && hasRecording && (
        <div className="bm-booking-in-work-actions">
          <div className="bm-booking-track-status">
            {hasTrack ? 'Обработанный файл загружен' : 'Обработанный файл не загружен'}
          </div>
          <label className="bm-booking-upload-label">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadTrack(booking.recordingId, f);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
              disabled={uploadingId === booking.recordingId}
            />
            <span className="bm-link" style={{ opacity: uploadingId === booking.recordingId ? 0.6 : 1 }}>
              {uploadingId === booking.recordingId ? 'Загрузка…' : hasTrack ? 'Заменить файл' : 'Загрузить обработанный файл'}
            </span>
          </label>
          {hasTrack && (
            <button
              type="button"
              className="bm-link"
              onClick={() => onSendTrack(booking.recordingId)}
              disabled={sendingId === booking.recordingId}
            >
              {sendingId === booking.recordingId ? 'Отправка…' : 'Отправить на email пользователю'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BeatmakerPanel() {
  const { user, token, isBeatmaker } = useAuth();
  const [activeTab, setActiveTab] = useState('form-orders');

  const [beats, setBeats] = useState([]);
  const [paidRecordings, setPaidRecordings] = useState([]);
  const [formOrdersNew, setFormOrdersNew] = useState([]);
  const [formOrdersInWork, setFormOrdersInWork] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [uploadingTrackId, setUploadingTrackId] = useState(null);
  const [sendingTrackId, setSendingTrackId] = useState(null);
  const [takingBookingId, setTakingBookingId] = useState(null);
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [alert, setAlert] = useState(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageNew, setPageNew] = useState(1);
  const [pageInWork, setPageInWork] = useState(1);
  const PER_PAGE = 8;

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [workingDays, setWorkingDays] = useState([]);
  const [selectedWorkingDays, setSelectedWorkingDays] = useState([]);
  const [workingDaysLoading, setWorkingDaysLoading] = useState(false);
  const [savingWorkingDays, setSavingWorkingDays] = useState(false);

  const filterByDate = (list, dateKey = 'createdAt') => {
    if (!dateFrom && !dateTo) return list;
    return list.filter((item) => {
      const d = item[dateKey] ? new Date(item[dateKey]) : null;
      if (!d || isNaN(d.getTime())) return true;
      if (dateFrom && d < new Date(dateFrom + 'T00:00:00')) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  };

  const paginate = (list, page) => {
    const start = (page - 1) * PER_PAGE;
    return list.slice(start, start + PER_PAGE);
  };

  const filteredNew = filterByDate(formOrdersNew);
  const filteredInWork = filterByDate(formOrdersInWork);
  const totalPagesNew = Math.max(1, Math.ceil(filteredNew.length / PER_PAGE));
  const totalPagesInWork = Math.max(1, Math.ceil(filteredInWork.length / PER_PAGE));
  const paginatedNew = paginate(filteredNew, pageNew);
  const paginatedInWork = paginate(filteredInWork, pageInWork);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('hyperpop');
  const [bpm, setBpm] = useState(140);
  const [price, setPrice] = useState(0);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);

  const loadMine = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/beats/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      setBeats(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!token) return;
    try {
      setBookingsLoading(true);
      const r = await fetch(`${API_URL}/studio-booking/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      setFormOrdersNew(Array.isArray(data.new) ? data.new : []);
      setFormOrdersInWork(Array.isArray(data.in_work) ? data.in_work : []);
    } catch (e) {
      console.error(e);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && isBeatmaker) {
      loadMine();
      loadPaidRecordings();
      loadBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, isBeatmaker]);

  const normalizeDateStr = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    try { return new Date(d).toISOString().slice(0, 10); } catch (_) { return ''; }
  };

  const loadWorkingDays = async () => {
    if (!token) return;
    setWorkingDaysLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/studio-booking/working-days?year=${calendarYear}&month=${calendarMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      const dates = (Array.isArray(data.dates) ? data.dates : []).map(normalizeDateStr).filter(Boolean);
      setWorkingDays(dates);
    } catch (e) {
      setWorkingDays([]);
    } finally {
      setWorkingDaysLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'calendar' && token) loadWorkingDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, calendarYear, calendarMonth, token]);

  useEffect(() => {
    setSelectedWorkingDays(workingDays);
  }, [workingDays]);

  const toggleSelectedDay = (dateStr) => {
    setSelectedWorkingDays((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  const getSameWeekdaysInMonth = (year, month, sourceDates) => {
    if (!Array.isArray(sourceDates) || sourceDates.length === 0) return [];
    const weekdays = [...new Set(sourceDates.map((d) => new Date(d + 'T12:00:00').getDay()))];
    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (weekdays.includes(new Date(dateStr + 'T12:00:00').getDay())) result.push(dateStr);
    }
    return result;
  };

  const saveWorkingDays = async () => {
    if (!token || savingWorkingDays) return;
    setSavingWorkingDays(true);
    try {
      const r = await fetch(`${API_URL}/studio-booking/working-days`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: calendarYear,
          month: calendarMonth,
          dates: selectedWorkingDays
        })
      });
      const data = await r.json();
      if (r.ok) {
        const saved = (Array.isArray(data.dates) ? data.dates : []).map(normalizeDateStr).filter(Boolean);
        setWorkingDays(saved);
        setSelectedWorkingDays(saved);
        setAlert({ message: 'Рабочие дни сохранены и продублированы на следующий месяц.', type: 'success' });
        const nextMonth = calendarMonth === 12 ? 1 : calendarMonth + 1;
        const nextYear = calendarMonth === 12 ? calendarYear + 1 : calendarYear;
        const nextMonthDates = getSameWeekdaysInMonth(nextYear, nextMonth, selectedWorkingDays);
        if (nextMonthDates.length > 0) {
          await fetch(`${API_URL}/studio-booking/working-days`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: nextYear, month: nextMonth, dates: nextMonthDates })
          });
        }
      } else {
        setAlert({ message: data.error || 'Ошибка сохранения', type: 'error' });
      }
    } catch (e) {
      setAlert({ message: 'Ошибка сохранения рабочих дней', type: 'error' });
    } finally {
      setSavingWorkingDays(false);
    }
  };

  const loadPaidRecordings = async () => {
    if (!token) return;
    try {
      setRecordingsLoading(true);
      const r = await fetch(`${API_URL}/recordings/paid`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      setPaidRecordings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setRecordingsLoading(false);
    }
  };

  const handleTakeToWork = async (bookingId) => {
    try {
      setTakingBookingId(bookingId);
      const r = await fetch(`${API_URL}/studio-booking/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'in_work' })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка');
      setAlert({ message: 'Заявка переведена в работу.', type: 'success' });
      await loadBookings();
      setActiveTab('in-work');
    } catch (err) {
      setAlert({ message: err.message || 'Не удалось перевести в работу', type: 'error' });
    } finally {
      setTakingBookingId(null);
    }
  };

  const handleRejectClick = (bookingId) => {
    setRejectingBookingId(bookingId);
    setRejectReason('');
  };

  const handleRejectCancel = () => {
    setRejectingBookingId(null);
    setRejectReason('');
  };

  const handleRejectSubmit = async (bookingId) => {
    try {
      setRejectingId(bookingId);
      const r = await fetch(`${API_URL}/studio-booking/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected', rejectionReason: rejectReason })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка');
      setAlert({ message: 'Заявка отклонена с указанной причиной.', type: 'success' });
      setRejectingBookingId(null);
      setRejectReason('');
      await loadBookings();
    } catch (err) {
      setAlert({ message: err.message || 'Не удалось отклонить заявку', type: 'error' });
    } finally {
      setRejectingId(null);
    }
  };

  const handleTrackUpload = async (recordingId, trackFile) => {
    if (!trackFile) return setAlert({ message: 'Выберите файл трека', type: 'warning' });
    try {
      setUploadingTrackId(recordingId);
      const formData = new FormData();
      formData.append('track', trackFile);
      const response = await fetch(`${API_URL}/recordings/${recordingId}/upload-track`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки файла');
      setAlert({ message: 'Файл трека загружен.', type: 'success' });
      await loadPaidRecordings();
      await loadBookings();
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка загрузки файла', type: 'error' });
    } finally {
      setUploadingTrackId(null);
    }
  };

  const handleSendTrack = async (recordingId) => {
    if (!confirm('Отправить трек на email пользователя?')) return;
    try {
      setSendingTrackId(recordingId);
      const response = await fetch(`${API_URL}/recordings/${recordingId}/send-track`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка отправки');
      setAlert({ message: 'Трек отправлен на email пользователя.', type: 'success' });
      await loadPaidRecordings();
      await loadBookings();
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка отправки трека', type: 'error' });
    } finally {
      setSendingTrackId(null);
    }
  };

  const handleDownloadBeat = async (beatId) => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/beats/${beatId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не удалось скачать файл');
      const blob = await r.blob();
      const name = r.headers.get('Content-Disposition')?.match(/filename\*?=(?:UTF-8'')?([^;]+)/)?.[1]?.replace(/^"|"$/g, '') || `beat-${beatId}.mp3`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = decodeURIComponent(name) || `beat-${beatId}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAlert({ message: err.message || 'Ошибка скачивания бита', type: 'error' });
    }
  };

  const recordingTypesNames = {
    'own-music': 'Запись на свою музыку',
    'with-music': 'Запись с покупкой музыки',
    'buy-music': 'Покупка музыки',
    'home-recording': 'Запись из дома',
    'video-clip': 'Съёмка видеоклипа'
  };

  const musicStylesNames = {
    hyperpop: 'Хайпер поп',
    'pop-rock': 'Поп рок',
    indie: 'Инди',
    lofi: 'Low-fi',
    'russian-rap': 'Русский реп',
    funk: 'Фонк',
    'video-clip': 'Видеоклип'
  };

  const uploadBeat = async (e) => {
    e.preventDefault();
    if (!file) return setAlert({ message: 'Выбери файл бита (mp3/wav)', type: 'warning' });
    if (!title.trim()) return setAlert({ message: 'Введите название', type: 'warning' });
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('genre', genre);
      fd.append('bpm', String(bpm));
      fd.append('price', String(price));
      fd.append('file', file);
      if (cover) fd.append('cover', cover);
      const r = await fetch(`${API_URL}/beats`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return setAlert({ message: data.error || 'Ошибка загрузки', type: 'error' });
      setTitle('');
      setBpm(140);
      setPrice(0);
      setFile(null);
      setCover(null);
      await loadMine();
      setAlert({ message: 'Бит загружен.', type: 'success' });
    } catch (err) {
      console.error(err);
      setAlert({ message: 'Ошибка загрузки бита.', type: 'error' });
    }
  };

  const removeBeat = async (id) => {
    if (!confirm('Удалить бит?')) return;
    const r = await fetch(`${API_URL}/beats/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    if (!r.ok) return setAlert({ message: data.error || 'Ошибка удаления', type: 'error' });
    await loadMine();
  };

  if (!user) {
    return <div className="bm-page"><div className="bm-card">Войдите, чтобы открыть панель битмейкера.</div></div>;
  }
  if (!isBeatmaker) {
    return <div className="bm-page"><div className="bm-card">Доступ только для роли beatmaker/admin.</div></div>;
  }

  const tabs = [
    { id: 'form-orders', label: 'Заказы с формы' },
    { id: 'in-work', label: 'Заказы в работе' },
    { id: 'calendar', label: 'Календарь' },
    { id: 'beats', label: 'Созданные биты' }
  ];

  const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

  return (
    <div className="bm-page">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="bm-head">
        <h1>Панель битмейкера</h1>
        <div className="bm-sub">Заявки с формы • заказы в работе • создание битов</div>
      </div>

      <div className="bm-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`bm-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'form-orders' && (
        <div className="bm-tab-panel">
          <div className="bm-list-title">Новые заявки с формы записи на студию</div>
          <div className="bm-date-filter">
            <label>
              <span className="bm-date-label">Дата от</span>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPageNew(1); }} className="bm-date-input" />
            </label>
            <label>
              <span className="bm-date-label">Дата до</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPageNew(1); }} className="bm-date-input" />
            </label>
          </div>
          {bookingsLoading ? (
            <div className="bm-muted">Загрузка…</div>
          ) : filteredNew.length === 0 ? (
            <div className="bm-muted">Нет заявок по выбранным датам</div>
          ) : (
            <>
              <div className="bm-booking-list">
                {paginatedNew.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onTakeToWork={handleTakeToWork}
                    takingId={takingBookingId}
                    onRejectClick={handleRejectClick}
                    onRejectSubmit={handleRejectSubmit}
                    onRejectCancel={handleRejectCancel}
                    rejectingBookingId={rejectingBookingId}
                    rejectReason={rejectReason}
                    onRejectReasonChange={setRejectReason}
                    rejectingId={rejectingId}
                  />
                ))}
              </div>
              <div className="bm-pagination">
                <button type="button" className="bm-pagination-btn" onClick={() => setPageNew((p) => Math.max(1, p - 1))} disabled={pageNew <= 1} aria-label="Предыдущая страница">←</button>
                <span className="bm-pagination-info">Страница {pageNew} из {totalPagesNew}</span>
                <button type="button" className="bm-pagination-btn" onClick={() => setPageNew((p) => Math.min(totalPagesNew, p + 1))} disabled={pageNew >= totalPagesNew} aria-label="Следующая страница">→</button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'in-work' && (
        <div className="bm-tab-panel">
          <div className="bm-list-title">Заявки в работе (с формы)</div>
          <div className="bm-date-filter">
            <label>
              <span className="bm-date-label">Дата от</span>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPageInWork(1); }} className="bm-date-input" />
            </label>
            <label>
              <span className="bm-date-label">Дата до</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPageInWork(1); }} className="bm-date-input" />
            </label>
          </div>
          {bookingsLoading ? (
            <div className="bm-muted">Загрузка…</div>
          ) : filteredInWork.length === 0 ? (
            <div className="bm-muted">Нет заявок в работе по выбранным датам</div>
          ) : (
            <>
              <div className="bm-booking-list">
                {paginatedInWork.map((b) => (
                  <BookingInWorkCard
                    key={b.id}
                    booking={b}
                    onDownloadBeat={handleDownloadBeat}
                    onUploadTrack={handleTrackUpload}
                    onSendTrack={handleSendTrack}
                  uploadingId={uploadingTrackId}
                  sendingId={sendingTrackId}
                />
              ))}
              </div>
              <div className="bm-pagination">
                <button type="button" className="bm-pagination-btn" onClick={() => setPageInWork((p) => Math.max(1, p - 1))} disabled={pageInWork <= 1} aria-label="Предыдущая страница">←</button>
                <span className="bm-pagination-info">Страница {pageInWork} из {totalPagesInWork}</span>
                <button type="button" className="bm-pagination-btn" onClick={() => setPageInWork((p) => Math.min(totalPagesInWork, p + 1))} disabled={pageInWork >= totalPagesInWork} aria-label="Следующая страница">→</button>
              </div>
            </>
          )}

          <div className="bm-list" style={{ marginTop: '2rem' }}>
            <div className="bm-list-title">Оплаченные заявки на запись</div>
            {recordingsLoading ? (
              <div className="bm-muted">Загрузка…</div>
            ) : paidRecordings.length === 0 ? (
              <div className="bm-muted">Нет оплаченных заявок</div>
            ) : (
              <div className="bm-items">
                {paidRecordings.map((recording) => (
                  <div key={recording.id} className="bm-item">
                    <div className="bm-item-main">
                      <div className="bm-item-title">
                        {recordingTypesNames[recording.recording_type] || recording.recording_type}
                      </div>
                      <div className="bm-item-sub">
                        <span className="bm-pill">{musicStylesNames[recording.music_style] || recording.music_style}</span>
                        <span className="bm-pill">{recording.user_name || recording.user_email}</span>
                        {recording.price && (
                          <span className="bm-pill accent">{Number(recording.price).toLocaleString('ru-RU')} ₽</span>
                        )}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {recording.track_file_path ? 'Файл загружен' : 'Файл не загружен'}
                      </div>
                    </div>
                    <div className="bm-item-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleTrackUpload(recording.id, f);
                            e.target.value = '';
                          }}
                          style={{ display: 'none' }}
                          disabled={uploadingTrackId === recording.id}
                        />
                        <span
                          className="bm-link"
                          style={{ display: 'inline-block', pointerEvents: uploadingTrackId === recording.id ? 'none' : 'auto', opacity: uploadingTrackId === recording.id ? 0.6 : 1 }}
                        >
                          {uploadingTrackId === recording.id ? 'Загрузка...' : recording.track_file_path ? 'Заменить файл' : 'Загрузить файл'}
                        </span>
                      </label>
                      {recording.track_file_path && (
                        <button
                          type="button"
                          className="bm-link"
                          onClick={() => handleSendTrack(recording.id)}
                          disabled={sendingTrackId === recording.id}
                        >
                          {sendingTrackId === recording.id ? 'Отправка...' : 'Отправить на email'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bm-tab-panel">
          <div className="bm-calendar-wrap">
            <div className="bm-calendar-header">
              <button
                type="button"
                className="bm-calendar-nav"
                onClick={() => {
                  if (calendarMonth === 1) {
                    setCalendarYear((y) => y - 1);
                    setCalendarMonth(12);
                  } else setCalendarMonth((m) => m - 1);
                }}
              >
                ← Назад
              </button>
              <h2 className="bm-calendar-title">
                {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
              </h2>
              <button
                type="button"
                className="bm-calendar-nav"
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
            <p className="bm-calendar-hint">Выберите дни и нажмите «Сохранить», чтобы записать их как рабочие.</p>
            {workingDaysLoading ? (
              <div className="bm-muted">Загрузка календаря…</div>
            ) : (
              <>
                <div className="bm-calendar-grid">
                  {WEEKDAY_NAMES.map((name) => (
                    <div key={name} className="bm-calendar-weekday">
                      {name}
                    </div>
                  ))}
                  {getCalendarDays().map((dateStr, idx) => (
                    <div
                      key={dateStr || `empty-${idx}`}
                      className={`bm-calendar-day ${dateStr ? '' : 'bm-calendar-day-empty'} ${dateStr && selectedWorkingDays.includes(dateStr) ? 'bm-calendar-day-working' : ''}`}
                      role={dateStr ? 'button' : undefined}
                      tabIndex={dateStr ? 0 : undefined}
                      onClick={() => dateStr && toggleSelectedDay(dateStr)}
                      onKeyDown={(e) => dateStr && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleSelectedDay(dateStr))}
                      aria-label={dateStr ? (selectedWorkingDays.includes(dateStr) ? `Рабочий день ${dateStr}` : `День ${dateStr}`) : undefined}
                    >
                      {dateStr ? new Date(dateStr + 'T12:00:00').getDate() : ''}
                      {dateStr && selectedWorkingDays.includes(dateStr) && <span className="bm-calendar-day-check">✓</span>}
                    </div>
                  ))}
                </div>
                <div className="bm-calendar-save-wrap">
                  <button
                    type="button"
                    className="bm-calendar-save-btn"
                    onClick={saveWorkingDays}
                    disabled={savingWorkingDays}
                  >
                    {savingWorkingDays ? 'Сохранение…' : 'Сохранить рабочие дни'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'beats' && (
        <div className="bm-tab-panel">
          <form className="bm-form" onSubmit={uploadBeat}>
            <div className="bm-list-title">Создать бит</div>
            <div className="bm-grid">
              <div className="bm-field">
                <label>Название</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: NOTA_HYPERPOP_01" />
              </div>
              <div className="bm-field">
                <label>Жанр</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                  {GENRES.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="bm-field">
                <label>BPM</label>
                <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} min={40} max={240} />
              </div>
              <div className="bm-field">
                <label>Цена (₽)</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step={50} />
              </div>
              <div className="bm-field bm-file">
                <label>Файл (mp3/wav)</label>
                <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="bm-field bm-file">
                <label>Обложка (png/jpg/webp)</label>
                <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="bm-actions">
              <button className="bm-upload" type="submit">Загрузить бит</button>
            </div>
          </form>

          <div className="bm-list" style={{ marginTop: '2rem' }}>
            <div className="bm-list-title">Мои биты</div>
            {loading ? (
              <div className="bm-muted">Загрузка…</div>
            ) : beats.length === 0 ? (
              <div className="bm-muted">Пока пусто. Загрузите первый бит.</div>
            ) : (
              <div className="bm-items">
                {beats.map((b) => (
                  <div key={b.id} className="bm-item">
                    <div className="bm-item-main">
                      <div className="bm-item-title">{b.title}</div>
                      <div className="bm-item-sub">
                        <span className="bm-pill">{b.genre}</span>
                        <span className="bm-pill">BPM {b.bpm}</span>
                        <span className="bm-pill accent">{Number(b.price).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <audio controls preload="none" src={b.file_url} />
                    </div>
                    <div className="bm-item-actions">
                      <a className="bm-link" href={b.file_url} target="_blank" rel="noreferrer">Открыть</a>
                      <button className="bm-delete" onClick={() => removeBeat(b.id)}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BeatmakerPanel;
