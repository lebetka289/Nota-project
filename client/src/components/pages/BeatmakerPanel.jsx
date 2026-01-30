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

function BookingCard({ booking, onTakeToWork, takingId }) {
  const taking = takingId === booking.id;
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
      {onTakeToWork && (
        <div className="bm-booking-actions">
          <button
            type="button"
            className="bm-btn-take"
            onClick={() => onTakeToWork(booking.id)}
            disabled={taking}
          >
            {taking ? 'Отправка…' : 'Взять в работу'}
          </button>
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
  const [alert, setAlert] = useState(null);

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
    { id: 'beats', label: 'Созданные биты' }
  ];

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
          {bookingsLoading ? (
            <div className="bm-muted">Загрузка…</div>
          ) : formOrdersNew.length === 0 ? (
            <div className="bm-muted">Нет новых заявок</div>
          ) : (
            <div className="bm-booking-list">
              {formOrdersNew.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onTakeToWork={handleTakeToWork}
                  takingId={takingBookingId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'in-work' && (
        <div className="bm-tab-panel">
          <div className="bm-list-title">Заявки в работе (с формы)</div>
          {bookingsLoading ? (
            <div className="bm-muted">Загрузка…</div>
          ) : formOrdersInWork.length === 0 ? (
            <div className="bm-muted">Нет заявок в работе</div>
          ) : (
            <div className="bm-booking-list">
              {formOrdersInWork.map((b) => (
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
