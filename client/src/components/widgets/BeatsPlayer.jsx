import { useEffect, useMemo, useRef, useState } from 'react';
import './BeatsPlayer.css';

const formatTime = (sec) => {
  if (!Number.isFinite(sec)) return '0:00';
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

function BeatsPlayer({ beat }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const cover = useMemo(() => beat?.cover_url || null, [beat]);

  const incrementPlayCount = async (beatId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/beats/${beatId}/play`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Ошибка обновления счетчика прослушиваний:', error);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !beat) return;
    a.pause();
    a.currentTime = 0;
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    a.volume = volume;
    a.src = beat.file_url;
    a.load();
    // autoplay when selecting a beat
    a.play().then(() => {
      setPlaying(true);
      // Отслеживание прослушивания
      incrementPlayCount(beat.id);
    }).catch(() => setPlaying(false));
  }, [beat]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
  }, [volume]);

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

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
        // Отслеживание прослушивания при первом запуске
        if (beat && a.currentTime === 0) {
          incrementPlayCount(beat.id);
        }
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

  if (!beat) return null;

  return (
    <div className="bp-wrap">
      <audio ref={audioRef} />
      <div className="bp-left">
        <div className="bp-cover">
          {cover ? <img src={cover} alt="" /> : <div className="bp-cover-ph">—</div>}
        </div>
        <div className="bp-meta">
          <div className="bp-title">{beat.title}</div>
          <div className="bp-sub">
            <span className="bp-pill">{beat.genre}</span>
            <span className="bp-pill">BPM {beat.bpm}</span>
            <span className="bp-pill accent">{Number(beat.price).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      </div>

      <div className="bp-center">
        <button className="bp-play" onClick={toggle}>
          {playing ? 'Пауза' : 'Плей'}
        </button>

        <div className="bp-progress">
          <div className="bp-time">{formatTime(current)}</div>
          <input
            className="bp-range"
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(current, duration || 0)}
            onChange={(e) => seek(e.target.value)}
          />
          <div className="bp-time">{formatTime(duration)}</div>
        </div>
      </div>

      <div className="bp-right">
        <div className="bp-vol">
          <div className="bp-vol-label">Громкость</div>
          <input
            className="bp-range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
        <a className="bp-download" href={beat.download_url} rel="noreferrer">
          Скачать
        </a>
      </div>
    </div>
  );
}

export default BeatsPlayer;
