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

function BeatmakerPanel() {
  const { user, token, isBeatmaker } = useAuth();
  const [beats, setBeats] = useState([]);
  const [paidRecordings, setPaidRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [uploadingTrackId, setUploadingTrackId] = useState(null);
  const [sendingTrackId, setSendingTrackId] = useState(null);
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

  useEffect(() => {
    if (user && token && isBeatmaker) {
      loadMine();
      loadPaidRecordings();
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
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки файла');
      }

      setAlert({ message: 'Файл трека загружен.', type: 'success' });
      await loadPaidRecordings();
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
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки');
      }

      setAlert({ message: 'Трек отправлен на email пользователя.', type: 'success' });
      await loadPaidRecordings();
    } catch (error) {
      setAlert({ message: error.message || 'Ошибка отправки трека', type: 'error' });
    } finally {
      setSendingTrackId(null);
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
    'hyperpop': 'Хайпер поп',
    'pop-rock': 'Поп рок',
    'indie': 'Инди',
    'lofi': 'Low-fi',
    'russian-rap': 'Русский реп',
    'funk': 'Фонк',
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
      if (!r.ok) return setAlert({ message: data.error || 'Ошибка загрузки (проверь роль beatmaker и токен)', type: 'error' });

      setTitle('');
      setBpm(140);
      setPrice(0);
      setFile(null);
      setCover(null);
      await loadMine();
      setAlert({ message: 'Бит загружен.', type: 'success' });
    } catch (err) {
      console.error(err);
      setAlert({ message: 'Ошибка загрузки: сервер недоступен или вернул ошибку. Открой DevTools → Network → /api/beats', type: 'error' });
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

  return (
    <div className="bm-page">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="bm-head">
        <h1>Панель битмейкера</h1>
        <div className="bm-sub">Загрузка битов • жанр • BPM • цена</div>
      </div>

      <form className="bm-form" onSubmit={uploadBeat}>
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
          <button className="bm-upload" type="submit">Загрузить</button>
        </div>
      </form>

      <div className="bm-list">
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

      <div className="bm-list" style={{ marginTop: '3rem' }}>
        <div className="bm-list-title">Оплаченные заявки</div>
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
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>
                    {recording.track_file_path ? 'Файл загружен' : 'Файл не загружен'}
                  </div>
                </div>
                <div className="bm-item-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTrackUpload(recording.id, file);
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
  );
}

export default BeatmakerPanel;
