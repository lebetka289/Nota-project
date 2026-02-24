import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserProfile.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function UserProfile() {
  const { user, token, refreshUser } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [purchases, setPurchases] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingRecordingId, setPayingRecordingId] = useState(null);
  const [payingBeatId, setPayingBeatId] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [pendingBookingLoading, setPendingBookingLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('recordings');
  const [selectedBeatIds, setSelectedBeatIds] = useState(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageRecordings, setPageRecordings] = useState(1);
  const [pagePaid, setPagePaid] = useState(1);
  const PER_PAGE = 6;

  const filterByDate = (list, dateKey = 'created_at') => {
    if (!dateFrom && !dateTo) return list;
    return list.filter((item) => {
      const raw = item[dateKey] || item.paid_at;
      const d = raw ? new Date(raw) : null;
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
    'home-recording': 'Запись из дома',
    'video-clip': 'Съёмка видеоклипа'
  };

  const statusNames = {
    'pending': 'Ожидает оплаты',
    'paid': 'Оплачено',
    'in-progress': 'В работе',
    'completed': 'Завершено',
    'cancelled': 'Отменено'
  };

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  const pendingStudioBookingId = typeof window !== 'undefined' ? localStorage.getItem('pendingStudioBookingId') : null;

  useEffect(() => {
    if (!user || !token || !pendingStudioBookingId) {
      if (!pendingStudioBookingId) setPendingBooking(null);
      return;
    }
    let cancelled = false;
    setPendingBookingLoading(true);
    fetch(`${API_URL}/studio-booking/${pendingStudioBookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data && data.isPaid) {
          localStorage.removeItem('pendingStudioBookingId');
          setPendingBooking(null);
        } else if (data) {
          setPendingBooking(data);
        } else {
          setPendingBooking(null);
        }
      })
      .catch(() => { if (!cancelled) setPendingBooking(null); })
      .finally(() => { if (!cancelled) setPendingBookingLoading(false); });
    return () => { cancelled = true; };
  }, [user, token, pendingStudioBookingId]);

  const fetchData = async () => {
    if (!user || !user.id) return;
    
    try {
      const [recordingsRes, purchasesRes, pendingPurchasesRes] = await Promise.all([
        fetch(`${API_URL}/recordings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/users/${user.id}/purchases`),
        fetch(`${API_URL}/users/${user.id}/purchases/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (recordingsRes.ok) {
        const recordingsData = await recordingsRes.json();
        setRecordings(recordingsData);
      }

      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData);
      } else if (purchasesRes.status === 404) {
        setPurchases([]);
      }

      if (pendingPurchasesRes.ok) {
        const pendingData = await pendingPurchasesRes.json();
        setPendingPurchases(Array.isArray(pendingData) ? pendingData : []);
      } else {
        setPendingPurchases([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayRecording = async (recording) => {
    if (!token) return;
    
    try {
      setPayingRecordingId(recording.id);
      const response = await fetch(`${API_URL}/payments/yookassa/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_id: recording.id,
          recording_type: recording.recording_type,
          music_style: recording.music_style
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      if (data.mock) {
        setAlert({ message: 'Оплата проведена в тестовом режиме.', type: 'success' });
        fetchData();
        localStorage.removeItem('pendingStudioBookingId');
        setPendingBooking(null);
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setAlert({ message: 'Платеж создан, но нет ссылки на оплату', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка оплаты', type: 'error' });
    } finally {
      setPayingRecordingId(null);
    }
  };

  const handlePayBooking = async (booking) => {
    if (!token) return;
    try {
      setPayingBookingId(booking.id);
      const response = await fetch(`${API_URL}/payments/yookassa/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_type: 'with-music',
          music_style: booking.musicGenre,
          purchased_beat_id: booking.beatId || null,
          studio_booking_id: booking.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      if (data.mock) {
        setAlert({ message: 'Оплата проведена в тестовом режиме. Статус заявки обновлён у битмейкера.', type: 'success' });
        fetchData();
        localStorage.removeItem('pendingStudioBookingId');
        setPendingBooking(null);
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setAlert({ message: 'Платеж создан, но нет ссылки на оплату', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка оплаты', type: 'error' });
    } finally {
      setPayingBookingId(null);
    }
  };

  const handlePayBeat = async (beatId) => {
    if (!token) return setAlert({ message: 'Войдите, чтобы оплатить', type: 'warning' });
    try {
      setPayingBeatId(beatId);
      const response = await fetch(`${API_URL}/payments/beat/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ beat_id: beatId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      if (data.free || data.mock) {
        setAlert({ message: 'Оплата проведена в тестовом режиме.', type: 'success' });
        fetchData();
        setSelectedBeatIds((prev) => {
          const next = new Set(prev);
          next.delete(beatId);
          return next;
        });
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setAlert({ message: 'Платеж создан, но нет ссылки на оплату', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка оплаты', type: 'error' });
    } finally {
      setPayingBeatId(null);
    }
  };

  const toggleBeatSelection = (beatId) => {
    setSelectedBeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(beatId)) next.delete(beatId);
      else next.add(beatId);
      return next;
    });
  };

  const handlePaySelectedBeats = () => {
    const first = [...selectedBeatIds][0];
    if (first != null) handlePayBeat(first);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !token) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAlert({ message: 'Разрешены только JPG, PNG, GIF, WebP', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ message: 'Размер файла не более 5 МБ', type: 'error' });
      return;
    }
    setAvatarUploading(true);
    setAlert(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const r = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
      refreshUser();
      setAlert({ message: 'Аватар обновлён', type: 'success' });
    } catch (err) {
      setAlert({ message: err.message || 'Не удалось загрузить аватар', type: 'error' });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const resolveCoverUrl = (coverPath) => {
    if (!coverPath) return null;
    if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
      return coverPath;
    }
    const baseUrl = API_URL.replace('/api', '');
    const normalized = coverPath.startsWith('/uploads/')
      ? coverPath
      : coverPath.startsWith('uploads/')
        ? `/${coverPath}`
        : `/uploads/${coverPath}`;
    return `${baseUrl}${normalized}`;
  };

  const pendingRecordings = recordings.filter(r => r.status === 'pending');
  const paidRecordings = recordings.filter(r => r.status === 'paid' || r.status === 'in-progress' || r.status === 'completed');
  const filteredPaid = filterByDate(paidRecordings, 'paid_at');
  const totalPagesPaid = Math.max(1, Math.ceil(filteredPaid.length / PER_PAGE));
  const paginatedPaid = paginate(filteredPaid, pagePaid);
  const filteredPending = filterByDate(pendingRecordings);
  const totalPagesPending = Math.max(1, Math.ceil(filteredPending.length / PER_PAGE));
  const paginatedPending = paginate(filteredPending, pageRecordings);

  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-container">
          <div className="auth-required">
            <h2>Требуется авторизация</h2>
            <p>Войдите в аккаунт, чтобы просмотреть личный кабинет</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="profile-container">
        <div className="profile-header">
          <h1>Личный кабинет</h1>
          <div className="user-info-card profile-user-card">
            <div className="profile-avatar-block">
              <div className="profile-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" />
                ) : (
                  <span>{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="profile-avatar-upload">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="profile-avatar-input"
                  aria-label="Выбрать фото"
                />
                <button
                  type="button"
                  className="profile-avatar-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Загрузка...' : 'Загрузить аватар'}
                </button>
              </div>
            </div>
            <div className="profile-user-info">
              <h2>{user.name}</h2>
              <p className="user-email">{user.email}</p>
              <p className="user-role">
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </p>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'recordings' ? 'active' : ''}`}
            onClick={() => setActiveTab('recordings')}
          >
            Записи
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            Оплаченные заявки
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'purchased' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchased')}
          >
            Купленные биты
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'unpaid-beats' ? 'active' : ''}`}
            onClick={() => setActiveTab('unpaid-beats')}
          >
            Неоплаченные биты
            {pendingPurchases.length > 0 && (
              <span className="profile-tab-count">{pendingPurchases.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'recordings' && (
          <div className="profile-tab-panel">
            {pendingBookingLoading && (
              <div className="recordings-section">
                <div className="loading">Загрузка заявки…</div>
              </div>
            )}
            {pendingBooking && (pendingBooking.status === 'rejected' || !pendingBooking.isPaid) && (
              <div className="recordings-section">
                <h2>Заявка на запись</h2>
                {pendingBooking.status === 'rejected' ? (
                  <p className="profile-section-hint">Битмейкер отклонил заявку. Причина указана ниже.</p>
                ) : (
                  <p className="profile-section-hint">Оплатите заявку — после оплаты статус автоматически передаётся битмейкеру.</p>
                )}
                <div className={`recording-card booking-pending-card ${pendingBooking.status === 'rejected' ? 'booking-rejected' : ''}`}>
                  <div className="recording-header">
                    <h3>Запись с покупкой музыки</h3>
                    {pendingBooking.status === 'rejected' ? (
                      <span className="status-badge status-cancelled">Отменено</span>
                    ) : (
                      <span className="status-badge status-pending">Ожидает оплаты</span>
                    )}
                  </div>
                  <div className="recording-details">
                    <div className="detail-item">
                      <span className="detail-label">Стиль:</span>
                      <span className="detail-value">{musicStylesNames[pendingBooking.musicGenre] || pendingBooking.musicGenre}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата заявки:</span>
                      <span className="detail-value">{pendingBooking.createdAt ? new Date(pendingBooking.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Период записи:</span>
                      <span className="detail-value">{pendingBooking.dateStart} — {pendingBooking.dateEnd}</span>
                    </div>
                    {pendingBooking.status === 'rejected' && pendingBooking.rejectionReason && (
                      <div className="detail-item detail-item-reason">
                        <span className="detail-label">Причина отклонения:</span>
                        <span className="detail-value rejection-reason">{pendingBooking.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                  {pendingBooking.status !== 'rejected' && (
                    <button
                      className="pay-recording-btn"
                      onClick={() => handlePayBooking(pendingBooking)}
                      disabled={payingBookingId === pendingBooking.id}
                    >
                      {payingBookingId === pendingBooking.id ? 'Обработка...' : 'Оплатить'}
                    </button>
                  )}
                </div>
              </div>
            )}
            {(pendingRecordings.length > 0 || dateFrom || dateTo) && (
              <div className="recordings-section">
                <h2>Записи, ожидающие оплаты</h2>
                <div className="profile-date-filter">
                  <label>
                    <span className="profile-date-label">Дата от</span>
                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPageRecordings(1); }} className="profile-date-input" />
                  </label>
                  <label>
                    <span className="profile-date-label">Дата до</span>
                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPageRecordings(1); }} className="profile-date-input" />
                  </label>
                </div>
                {filteredPending.length === 0 ? (
                  <div className="empty-recordings"><p>Нет записей по выбранным датам</p></div>
                ) : (
                <>
                  <div className="recordings-list">
                    {paginatedPending.map(recording => (
                      <div key={recording.id} className="recording-card">
                        <div className="recording-header">
                          <h3>{recordingTypesNames[recording.recording_type] || recording.recording_type}</h3>
                          <span className={`status-badge status-${recording.status}`}>
                            {statusNames[recording.status] || recording.status}
                          </span>
                        </div>
                        <div className="recording-details">
                          <div className="detail-item">
                            <span className="detail-label">Стиль музыки:</span>
                            <span className="detail-value">
                              {musicStylesNames[recording.music_style] || recording.music_style}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Дата создания:</span>
                            <span className="detail-value">
                              {new Date(recording.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {recording.price && (
                            <div className="detail-item">
                              <span className="detail-label">Стоимость:</span>
                              <span className="detail-value price">
                                {parseFloat(recording.price).toLocaleString('ru-RU')} ₽
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          className="pay-recording-btn"
                          onClick={() => handlePayRecording(recording)}
                          disabled={payingRecordingId === recording.id}
                        >
                          {payingRecordingId === recording.id ? 'Обработка...' : 'Оплатить'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="profile-pagination">
                    <button type="button" className="profile-pagination-btn" onClick={() => setPageRecordings((p) => Math.max(1, p - 1))} disabled={pageRecordings <= 1}>←</button>
                    <span className="profile-pagination-info">Страница {pageRecordings} из {totalPagesPending}</span>
                    <button type="button" className="profile-pagination-btn" onClick={() => setPageRecordings((p) => Math.min(totalPagesPending, p + 1))} disabled={pageRecordings >= totalPagesPending}>→</button>
                  </div>
                </>
                )}
              </div>
            )}
            {!pendingBooking?.isPaid && !pendingBookingLoading && pendingRecordings.length === 0 && (
              <div className="recordings-section">
                <div className="empty-recordings">
                  <p>Нет записей, ожидающих оплаты</p>
                  <span className="empty-icon">—</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'paid' && (
          <div className="profile-tab-panel">
            <div className="recordings-section">
              <h2>Оплаченные заявки</h2>
              <div className="profile-date-filter">
                <label>
                  <span className="profile-date-label">Дата от</span>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPagePaid(1); }} className="profile-date-input" />
                </label>
                <label>
                  <span className="profile-date-label">Дата до</span>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPagePaid(1); }} className="profile-date-input" />
                </label>
              </div>
              {loading ? (
                <div className="loading">Загрузка...</div>
              ) : filteredPaid.length === 0 ? (
                <div className="empty-recordings">
                  <p>Нет оплаченных записей по выбранным датам</p>
                  <span className="empty-icon">—</span>
                </div>
              ) : (
                <>
                <div className="recordings-list">
                  {paginatedPaid.map(recording => (
                    <div key={recording.id} className="recording-card">
                      <div className="recording-header">
                        <h3>{recordingTypesNames[recording.recording_type] || recording.recording_type}</h3>
                        <span className={`status-badge status-${recording.status}`}>
                          {statusNames[recording.status] || recording.status}
                        </span>
                      </div>
                      <div className="recording-details">
                        <div className="detail-item">
                          <span className="detail-label">Стиль музыки:</span>
                          <span className="detail-value">
                            {musicStylesNames[recording.music_style] || recording.music_style}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Дата оплаты:</span>
                          <span className="detail-value">
                            {recording.paid_at ? new Date(recording.paid_at).toLocaleDateString('ru-RU') : '-'}
                          </span>
                        </div>
                        {recording.price && (
                          <div className="detail-item">
                            <span className="detail-label">Стоимость:</span>
                            <span className="detail-value price">
                              {parseFloat(recording.price).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="profile-pagination">
                  <button type="button" className="profile-pagination-btn" onClick={() => setPagePaid((p) => Math.max(1, p - 1))} disabled={pagePaid <= 1}>←</button>
                  <span className="profile-pagination-info">Страница {pagePaid} из {totalPagesPaid}</span>
                  <button type="button" className="profile-pagination-btn" onClick={() => setPagePaid((p) => Math.min(totalPagesPaid, p + 1))} disabled={pagePaid >= totalPagesPaid}>→</button>
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'purchased' && (
          <div className="profile-tab-panel">
            <div className="purchases-section">
              <h2>Купленные биты</h2>
              {loading ? (
                <div className="loading">Загрузка...</div>
              ) : purchases.length === 0 ? (
                <div className="empty-recordings">
                  <p>У вас пока нет купленных битов</p>
                  <span className="empty-icon">Empty</span>
                </div>
              ) : (
                <div className="purchases-list">
                  {purchases.map(purchase => (
                    <div key={purchase.purchase_id} className="purchase-card">
                      <div className="purchase-cover">
                        {resolveCoverUrl(purchase.cover_path) ? (
                          <img
                            src={resolveCoverUrl(purchase.cover_path)}
                            alt={purchase.title}
                          />
                        ) : (
                          <div className="purchase-cover-placeholder">—</div>
                        )}
                      </div>
                      <div className="purchase-info">
                        <div className="purchase-title">{purchase.title}</div>
                        <div className="purchase-meta">
                          <span className="purchase-chip">{purchase.genre}</span>
                          <span className="purchase-chip">{purchase.bpm} BPM</span>
                          <span className="purchase-chip">
                            {Number(purchase.price).toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="purchase-date">
                            {new Date(purchase.paid_at || purchase.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'unpaid-beats' && (
          <div className="profile-tab-panel">
            <div className="purchases-section">
              <h2>Неоплаченные биты</h2>
              <p className="profile-section-hint">Отметьте заявки и нажмите «Оплатить выбранные» для оплаты.</p>
              {loading ? (
                <div className="loading">Загрузка...</div>
              ) : pendingPurchases.length === 0 ? (
                <div className="empty-recordings">
                  <p>Нет неоплаченных битов</p>
                  <span className="empty-icon">—</span>
                </div>
              ) : (
                <>
                  <div className="unpaid-beats-table-wrap">
                    <table className="unpaid-beats-table">
                      <thead>
                        <tr>
                          <th>Заявка</th>
                          <th>Жанр</th>
                          <th>BPM</th>
                          <th>Цена</th>
                          <th>Выбрать</th>
                          <th>Оплатить</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPurchases.map(purchase => (
                          <tr key={purchase.purchase_id}>
                            <td className="unpaid-beats-title">{purchase.title}</td>
                            <td>{purchase.genre}</td>
                            <td>{purchase.bpm}</td>
                            <td className="unpaid-beats-price">{Number(purchase.price).toLocaleString('ru-RU')} ₽</td>
                            <td>
                              <label className="unpaid-beats-check">
                                <input
                                  type="checkbox"
                                  checked={selectedBeatIds.has(purchase.beat_id)}
                                  onChange={() => toggleBeatSelection(purchase.beat_id)}
                                />
                                <span>Выбрать</span>
                              </label>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="pay-beat-btn pay-beat-btn-row"
                                onClick={() => handlePayBeat(purchase.beat_id)}
                                disabled={payingBeatId === purchase.beat_id}
                              >
                                {payingBeatId === purchase.beat_id ? 'Обработка...' : 'Оплатить'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedBeatIds.size > 0 && (
                    <div className="unpaid-beats-actions">
                      <button
                        type="button"
                        className="pay-recording-btn"
                        onClick={handlePaySelectedBeats}
                        disabled={payingBeatId != null}
                      >
                        Оплатить выбранные ({selectedBeatIds.size})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
