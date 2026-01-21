import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './BeatsTable.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const GENRES = [
  { id: 'all', name: 'Все жанры' },
  { id: 'hyperpop', name: 'Хайпер поп' },
  { id: 'pop-rock', name: 'Поп рок' },
  { id: 'indie', name: 'Инди' },
  { id: 'lofi', name: 'Low-fi' },
  { id: 'russian-rap', name: 'Русский реп' },
  { id: 'funk', name: 'Фонк' }
];

function BeatsTable() {
  const { token, user } = useAuth();
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [cartBeatIds, setCartBeatIds] = useState(new Set());
  const [activeBeat, setActiveBeat] = useState(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('newest');

  const sortOptions = [
    { id: 'newest', name: 'Сначала новые' },
    { id: 'oldest', name: 'Сначала старые' },
    { id: 'bpm-low', name: 'BPM: по возрастанию' },
    { id: 'bpm-high', name: 'BPM: по убыванию' },
    { id: 'price-low', name: 'Цена: по возрастанию' },
    { id: 'price-high', name: 'Цена: по убыванию' },
    { id: 'name-asc', name: 'Название: А-Я' },
    { id: 'name-desc', name: 'Название: Я-А' }
  ];

  const fetchBeats = async () => {
    try {
      const params = new URLSearchParams();
      if (genre && genre !== 'all') params.set('genre', genre);
      if (q.trim()) params.set('q', q.trim());

      const url = `${API_URL}/beats${params.toString() ? `?${params}` : ''}`;
      const r = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await r.json();
      const mapped = (Array.isArray(data) ? data : []).map((b) => ({
        ...b,
        download_url: `${API_URL}/beats/${b.id}/download`
      }));
      setBeats(mapped);
    } catch (e) {
      console.error('Ошибка загрузки битов:', e);
      setBeats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, token]);

  const fetchFavorites = async () => {
    if (!token) return setFavorites(new Set());
    try {
      const r = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return setFavorites(new Set());
      const data = await r.json();
      const s = new Set((Array.isArray(data) ? data : []).map((x) => x.beat_id));
      setFavorites(s);
    } catch {
      setFavorites(new Set());
    }
  };

  const fetchCart = async () => {
    if (!token) return setCartBeatIds(new Set());
    try {
      const r = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return setCartBeatIds(new Set());
      const data = await r.json();
      const s = new Set((Array.isArray(data) ? data : []).map((x) => x.beat_id));
      setCartBeatIds(s);
    } catch {
      setCartBeatIds(new Set());
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchFavorites();
      fetchCart();
    } else {
      setFavorites(new Set());
      setCartBeatIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const filtered = useMemo(() => {
    let arr = [...beats];

    // сортировка (сервер уже отдаёт newest, но оставим клиентскую сортировку для остальных)
    arr.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'bpm-low':
          return Number(a.bpm) - Number(b.bpm);
        case 'bpm-high':
          return Number(b.bpm) - Number(a.bpm);
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'name-asc':
          return String(a.title).localeCompare(String(b.title), 'ru');
        case 'name-desc':
          return String(b.title).localeCompare(String(a.title), 'ru');
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return arr;
  }, [beats, sort]);

  const genreName = (id) => GENRES.find((g) => g.id === id)?.name || id;

  const toggleFavorite = async (beatId) => {
    if (!token) return alert('Войдите, чтобы добавить в избранное');
    const isFav = favorites.has(beatId);
    const r = await fetch(`${API_URL}/favorites${isFav ? `/${beatId}` : ''}`, {
      method: isFav ? 'DELETE' : 'POST',
      headers: {
        ...(isFav ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`
      },
      body: isFav ? undefined : JSON.stringify({ beat_id: beatId })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return alert(data.error || 'Ошибка избранного');
    await fetchFavorites();
  };

  const addToCart = async (beatId) => {
    if (!token) return alert('Войдите, чтобы добавить в корзину');
    const r = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ beat_id: beatId })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return alert(data.error || 'Ошибка корзины');
    await fetchCart();
  };

  const formatTime = (sec) => {
    if (!Number.isFinite(sec)) return '0:00';
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  // аудио события
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnded = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
  }, [volume]);

  const openBeat = async (b) => {
    const a = audioRef.current;
    if (!a) return;

    // если это уже активный трек — просто play/pause
    if (activeBeat?.id === b.id) {
      if (a.paused) {
        try {
          await a.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      } else {
        a.pause();
        setPlaying(false);
      }
      return;
    }

    setActiveBeat(b);
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      // ignore
    }
    a.src = b.file_url;
    a.load();
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (v) => {
    const a = audioRef.current;
    if (!a) return;
    const next = Number(v);
    a.currentTime = next;
    setCurrent(next);
  };

  const parseFilenameFromDisposition = (value) => {
    if (!value) return null;
    const match = /filename\*?=(?:UTF-8''|\"?)([^\";]+)/i.exec(value);
    if (!match?.[1]) return null;
    try {
      return decodeURIComponent(match[1].replace(/\"/g, ''));
    } catch {
      return match[1].replace(/\"/g, '');
    }
  };

  const downloadBeat = async (b) => {
    if (!token) return alert('Войдите, чтобы скачать');
    if (!b.purchased && Number(b.price) > 0) return alert('Скачивание доступно только после покупки');
    try {
      const r = await fetch(`${API_URL}/beats/${b.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        return alert(data.error || 'Ошибка скачивания');
      }
      const blob = await r.blob();
      const disp = r.headers.get('content-disposition');
      const filename = parseFilenameFromDisposition(disp) || `${b.title}.mp3`;
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
      alert('Ошибка скачивания');
    }
  };

  return (
    <div className="beats-page">
      <audio ref={audioRef} />
      <div className="beats-head">
        <h1>Биты</h1>
        <div className="beats-sub">
          Таблица треков по жанрам • BPM для удобной записи
        </div>
      </div>

      <div className="beats-filters">
        <input
          className="beats-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию…"
        />
        <button className="beats-search-btn" onClick={fetchBeats}>
          Найти
        </button>
        <select className="beats-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
          {GENRES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className="beats-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {sortOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="beats-wrap">
        {loading ? (
          <div className="beats-empty">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="beats-empty">Пока нет битов. Загрузите их с ролью beatmaker.</div>
        ) : (
          <table className="beats-table">
            <thead>
              <tr>
                <th>Трек</th>
                <th>Жанр</th>
                <th>BPM</th>
                <th>Цена</th>
                <th>Прослушать</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const expanded = activeBeat?.id === b.id;

                if (expanded) {
                  return (
                    <tr key={b.id} className="beats-tr-expanded">
                      <td colSpan={6}>
                        <div className="beats-expanded">
                          <div className="beats-expanded-left" onClick={() => openBeat(b)} role="button" tabIndex={0}>
                            <div className="beats-cover expanded">
                              {b.cover_url ? <img src={b.cover_url} alt="" /> : <div className="beats-cover-ph">♪</div>}
                            </div>
                            <div className="beats-title-text">
                              <div className="beats-title-main">{b.title}</div>
                            </div>
                          </div>

                          <div className="beats-expanded-player">
                            <button className="beats-round" onClick={togglePlay} title={playing ? 'Пауза' : 'Плей'}>
                              {playing ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                  <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                  <path d="M9 7v10l9-5-9-5z" fill="currentColor" />
                                </svg>
                              )}
                            </button>

                            <div className="beats-progress">
                              <div className="beats-time">{formatTime(current)}</div>
                              <input
                                className="beats-range"
                                type="range"
                                min={0}
                                max={duration || 0}
                                value={Math.min(current, duration || 0)}
                                onChange={(e) => seek(e.target.value)}
                              />
                              <div className="beats-time">{formatTime(duration)}</div>
                            </div>

                            <div className="beats-volume">
                              <input
                                className="beats-range"
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <div className="beats-expanded-actions">
                            <button
                              className="beats-buy"
                              onClick={() => addToCart(b.id)}
                              disabled={cartBeatIds.has(b.id)}
                            >
                              {cartBeatIds.has(b.id) ? 'В корзине' : 'В корзину'}
                            </button>
                            <button
                              className={`beats-fav ${favorites.has(b.id) ? 'active' : ''}`}
                              onClick={() => toggleFavorite(b.id)}
                              title="Избранное"
                            >
                              {favorites.has(b.id) ? '♥' : '♡'}
                            </button>
                            {b.purchased || Number(b.price) === 0 ? (
                              <button className="beats-download icon" onClick={() => downloadBeat(b)}>
                                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                  <path d="M12 3v10m0 0l4-4m-4 4l-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Скачать</span>
                              </button>
                            ) : (
                              <div className="beats-muted">Сначала купите</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={b.id} className="beats-tr">
                    <td className="beats-title">
                      <div className="beats-title-row">
                        <div className="beats-cover clickable" onClick={() => openBeat(b)} title="Открыть плеер">
                          {b.cover_url ? <img src={b.cover_url} alt="" /> : <div className="beats-cover-ph">♪</div>}
                        </div>
                        <div className="beats-title-text">
                          <div className="beats-title-main">{b.title}</div>
                          <div className="beats-title-sub">ID: #{b.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="beats-badge">{genreName(b.genre)}</span>
                    </td>
                    <td className="beats-bpm">{b.bpm}</td>
                    <td className="beats-price">{Number(b.price).toLocaleString('ru-RU')} ₽</td>
                    <td className="beats-audio">
                      <div className="beats-muted">Нажмите на обложку</div>
                    </td>
                    <td className="beats-actions">
                      <button
                        className="beats-buy"
                        onClick={() => addToCart(b.id)}
                        disabled={cartBeatIds.has(b.id)}
                      >
                        {cartBeatIds.has(b.id) ? 'В корзине' : 'В корзину'}
                      </button>
                      <button
                        className={`beats-fav ${favorites.has(b.id) ? 'active' : ''}`}
                        onClick={() => toggleFavorite(b.id)}
                        title="Избранное"
                      >
                        {favorites.has(b.id) ? '♥' : '♡'}
                      </button>
                      {b.purchased || Number(b.price) === 0 ? (
                        <button className="beats-download icon" onClick={() => downloadBeat(b)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path d="M12 3v10m0 0l4-4m-4 4l-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>Скачать</span>
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BeatsTable;
