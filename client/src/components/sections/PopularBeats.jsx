import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PopularBeats.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const formatTime = (sec) => {
  if (!Number.isFinite(sec)) return '0:00';
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

function PopularBeats() {
  const { token } = useAuth();
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBeatId, setActiveBeatId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const audioRef = useRef(null);
  const playCountTrackedRef = useRef(new Set());

  useEffect(() => {
    const fetchPopularBeats = async () => {
      try {
        const response = await fetch(`${API_URL}/beats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (response.ok) {
          const data = await response.json();
          // Сортируем по play_count и берем топ-6
          const popular = [...data]
            .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
            .slice(0, 6);
          setBeats(popular);
        }
      } catch (error) {
        console.error('Ошибка загрузки популярных битов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularBeats();
  }, [token]);

  const incrementPlayCount = async (beatId) => {
    // Отслеживаем, чтобы не отправлять повторные запросы для одного бита
    if (playCountTrackedRef.current.has(beatId)) return;
    
    try {
      await fetch(`${API_URL}/beats/${beatId}/play`, {
        method: 'POST'
      });
      playCountTrackedRef.current.add(beatId);
      
      // Обновляем локальное состояние счетчика
      setBeats(prev => prev.map(b => 
        b.id === beatId ? { ...b, play_count: (b.play_count || 0) + 1 } : b
      ));
    } catch (error) {
      console.error('Ошибка обновления счетчика прослушиваний:', error);
    }
  };

  const handleBeatClick = (beat) => {
    const a = audioRef.current;
    
    if (activeBeatId === beat.id && a) {
      // Если это уже активный бит - просто play/pause
      if (a.paused) {
        a.play().then(() => {
          setPlaying(true);
          if (a.currentTime === 0 && !playCountTrackedRef.current.has(beat.id)) {
            incrementPlayCount(beat.id);
          }
        }).catch(() => setPlaying(false));
      } else {
        a.pause();
        setPlaying(false);
      }
    } else {
      // Новый бит - загружаем и играем
      setActiveBeatId(beat.id);
      setPlaying(true);
      setCurrent(0);
      
      if (a) {
        a.pause();
        a.src = beat.file_url;
        a.load();
        a.play().then(() => {
          if (!playCountTrackedRef.current.has(beat.id)) {
            incrementPlayCount(beat.id);
          }
        }).catch(() => setPlaying(false));
      }
    }
  };

  // Обработка событий аудио
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTimeUpdate = () => setCurrent(a.currentTime || 0);
    const onLoadedMetadata = () => setDuration(a.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    a.addEventListener('timeupdate', onTimeUpdate);
    a.addEventListener('loadedmetadata', onLoadedMetadata);
    a.addEventListener('ended', onEnded);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);

    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate);
      a.removeEventListener('loadedmetadata', onLoadedMetadata);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
  }, [volume]);

  // Обновление источника аудио при смене активного бита
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !activeBeatId) return;

    const beat = beats.find(b => b.id === activeBeatId);
    if (!beat) return;

    a.pause();
    a.src = beat.file_url;
    a.load();
    if (playing) {
      a.play().catch(() => setPlaying(false));
    }
  }, [activeBeatId, beats, playing]);

  const seek = (value) => {
    const a = audioRef.current;
    if (!a) return;
    const next = Number(value);
    a.currentTime = next;
    setCurrent(next);
  };

  if (loading) {
    return (
      <div className="popular-beats-section">
        <div className="section-header">
          <h2>Популярные биты</h2>
          <p className="section-subtitle">Топ треков по прослушиваниям</p>
        </div>
        <div className="popular-beats-loading">Загрузка...</div>
      </div>
    );
  }

  if (beats.length === 0) {
    return null;
  }

  const activeBeat = beats.find(b => b.id === activeBeatId);

  return (
    <div className="popular-beats-section">
      <div className="section-header">
        <h2>Популярные биты</h2>
        <p className="section-subtitle">Топ треков по прослушиваниям</p>
      </div>
      
      {/* Встроенный плеер */}
      {activeBeat && (
        <div className="popular-beats-player">
          <audio ref={audioRef} />
          <div className="popular-beats-player-info">
            <div className="popular-beats-player-cover">
              {activeBeat.cover_url ? (
                <img src={activeBeat.cover_url} alt={activeBeat.title} />
              ) : (
                <div className="popular-beats-player-placeholder">—</div>
              )}
            </div>
            <div className="popular-beats-player-details">
              <div className="popular-beats-player-title">{activeBeat.title}</div>
              <div className="popular-beats-player-meta">
                <span>{activeBeat.genre}</span>
                <span>BPM {activeBeat.bpm}</span>
              </div>
            </div>
          </div>
          <div className="popular-beats-player-controls">
            <button
              className="popular-beats-player-play-btn"
              onClick={() => handleBeatClick(activeBeat)}
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 7v10l9-5-9-5z" />
                </svg>
              )}
            </button>
            <div className="popular-beats-player-progress">
              <div className="popular-beats-player-time">{formatTime(current)}</div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={Math.min(current, duration || 0)}
                onChange={(e) => seek(e.target.value)}
                className="popular-beats-player-range"
              />
              <div className="popular-beats-player-time">{formatTime(duration)}</div>
            </div>

            <div className="popular-beats-player-volume">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="popular-beats-player-volume-range"
                aria-label="Громкость"
              />
            </div>
          </div>
        </div>
      )}

      <div className="popular-beats-grid">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className={`popular-beat-card ${activeBeatId === beat.id ? 'active' : ''}`}
            onClick={() => handleBeatClick(beat)}
          >
            <div className="beat-card-cover">
              {beat.cover_url ? (
                <img src={beat.cover_url} alt={beat.title} />
              ) : (
                <div className="beat-card-placeholder">—</div>
              )}
              <div className="beat-card-overlay">
                <div className="beat-play-icon">
                  {activeBeatId === beat.id && playing ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 7v10l9-5-9-5z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="beat-play-count">
                {beat.play_count || 0}
              </div>
            </div>
            <div className="beat-card-info">
              <h3 className="beat-card-title">{beat.title}</h3>
              <div className="beat-card-meta">
                <span className="beat-card-genre">{beat.genre}</span>
                <span className="beat-card-bpm">BPM {beat.bpm}</span>
              </div>
              <div className="beat-card-price">{Number(beat.price).toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PopularBeats;
