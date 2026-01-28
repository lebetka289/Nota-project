import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../widgets/Alert';
import './RecordingPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function RecordingPage({ onNavigate }) {
  const { user, token } = useAuth();
  const [alert, setAlert] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileRecordings, setProfileRecordings] = useState([]);
  const [profilePurchases, setProfilePurchases] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [videoSlideIndex, setVideoSlideIndex] = useState(0);
  const [videoItemsPerView, setVideoItemsPerView] = useState(2);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const videoRefs = useRef({});
  const [purchasedBeats, setPurchasedBeats] = useState([]);
  const [selectedBeatId, setSelectedBeatId] = useState(null);
  const [showBeatDropdown, setShowBeatDropdown] = useState(false);
  const beatDropdownRef = useRef(null);

  const recordingTypes = [
    { id: 'with-music', title: 'Запись с покупкой музыки', description: 'Выберите бит и запишите на него свой вокал', icon: 'MIC' },
    { id: 'home-recording', title: 'Запись на дому', description: 'Профессиональная сводка трека по жанрам', icon: 'HOME' }
  ];

  const musicStyles = [
    { id: 'hyperpop', name: 'Хайпер поп', icon: 'HP', color: '#FF6B9D' },
    { id: 'pop-rock', name: 'Поп рок', icon: 'PR', color: '#4ECDC4' },
    { id: 'indie', name: 'Инди', icon: 'IN', color: '#95E1D3' },
    { id: 'lofi', name: 'Low-fi', icon: 'LF', color: '#F38181' },
    { id: 'russian-rap', name: 'Русский реп', icon: 'RR', color: '#AA96DA' },
    { id: 'funk', name: 'Фонк', icon: 'FN', color: '#FCBAD3' }
  ];

  const recordingTypeNames = {
    'own-music': 'Запись на свою музыку',
    'with-music': 'Запись с покупкой музыки',
    'home-recording': 'Запись на дому',
    'video-clip': 'Съёмка видеоклипа'
  };

  const musicStyleNames = {
    hyperpop: 'Хайпер поп',
    'pop-rock': 'Поп рок',
    indie: 'Инди',
    lofi: 'Low-fi',
    'russian-rap': 'Русский реп',
    funk: 'Фонк',
    'video-clip': 'Видеоклип'
  };

  const roleNames = {
    admin: 'Администратор',
    support: 'Поддержка',
    beatmaker: 'Битмейкер',
    user: 'Покупатель'
  };

  const statusNames = {
    pending: 'Ожидает оплаты',
    paid: 'Оплачено',
    'in-progress': 'В работе',
    completed: 'Завершено',
    cancelled: 'Отменено'
  };

  // Загрузка купленных битов для with-music
  useEffect(() => {
    if (selectedType === 'with-music' && user && token) {
      const loadPurchasedBeats = async () => {
        try {
          const response = await fetch(`${API_URL}/beats/purchased`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setPurchasedBeats(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error('Ошибка загрузки купленных битов:', error);
        }
      };
      loadPurchasedBeats();
    }
  }, [selectedType, user, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (beatDropdownRef.current && !beatDropdownRef.current.contains(e.target)) {
        setShowBeatDropdown(false);
      }
    };
    if (showBeatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBeatDropdown]);

  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError('');
      try {
        const response = await fetch(`${API_URL}/reviews`);
        if (!response.ok) {
          throw new Error('Ошибка загрузки отзывов');
        }
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        setReviewsError('Не удалось загрузить отзывы');
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, []);

  useEffect(() => {
    const updateItemsPerView = () => {
      setVideoItemsPerView(window.innerWidth <= 900 ? 1 : 2);
    };
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const videoWorks = [
    {
      id: 'clip-1',
      title: 'Песня в подарок мужу — С тобой мне очень хорошо',
      subtitle: 'Съёмка видеоклипа',
      image: '/videos/clip-1.jpg',
      video: '/videos/clip-1.mp4'
    },
    {
      id: 'clip-2',
      title: 'Кавер — Я по полюшку',
      subtitle: 'Съёмка видеоклипа',
      image: '/videos/clip-2.jpg',
      video: '/videos/clip-2.mp4'
    },
    {
      id: 'clip-3',
      title: 'Urban Light',
      subtitle: 'Съёмка видеоклипа',
      image: '/videos/clip-3.jpg',
      video: '/videos/clip-3.mp4'
    },
    {
      id: 'clip-4',
      title: 'Night Session',
      subtitle: 'Съёмка видеоклипа',
      image: '/videos/clip-4.jpg',
      video: '/videos/clip-4.mp4'
    }
  ];

  const maxVideoSlide = Math.max(0, videoWorks.length - videoItemsPerView);

  useEffect(() => {
    setVideoSlideIndex((prev) => Math.min(prev, Math.max(0, videoWorks.length - videoItemsPerView)));
  }, [videoItemsPerView, videoWorks.length]);

  const pauseAllVideos = () => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video && !video.paused) {
        video.pause();
      }
    });
  };

  const handleVideoToggle = (videoId) => {
    pauseAllVideos();
    const video = videoRefs.current[videoId];
    if (!video) return;

    if (playingVideoId === videoId) {
      video.pause();
      setPlayingVideoId(null);
    } else {
      video.play().catch((error) => {
        console.error('Ошибка воспроизведения видео:', error);
      });
      setPlayingVideoId(videoId);
    }
  };

  const handleVideoPrev = () => {
    setVideoSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleVideoNext = () => {
    setVideoSlideIndex((prev) => Math.min(maxVideoSlide, prev + 1));
  };

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!profileUserId) return;

      setProfileLoading(true);
      setProfileError('');

      try {
        const [profileRes, recordingsRes, purchasesRes] = await Promise.all([
          fetch(`${API_URL}/users/${profileUserId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }),
          fetch(`${API_URL}/recordings?user_id=${profileUserId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }),
          fetch(`${API_URL}/beats/purchased?user_id=${profileUserId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          })
        ]);

        if (!profileRes.ok) {
          throw new Error('Профиль не найден');
        }

        const profileJson = await profileRes.json();
        const recordingsJson = recordingsRes.ok ? await recordingsRes.json() : [];
        const purchasesJson = purchasesRes.ok ? await purchasesRes.json() : [];

        if (isActive) {
          setProfileData(profileJson);
          setProfileRecordings(recordingsJson);
          setProfilePurchases(purchasesJson);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        if (isActive) {
          setProfileError('Не удалось загрузить профиль');
        }
      } finally {
        if (isActive) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [profileUserId]);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setIsPopupOpen(true);
    document.body.style.overflow = 'hidden';
    setSelectedBeatId(null);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedStyle(null);
    setSelectedBeatId(null);
    document.body.style.overflow = 'auto';
  };

  const handleStyleSelect = async (styleId) => {
    setSelectedStyle(styleId);
    
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы продолжить', type: 'warning' });
      if (onNavigate) {
        onNavigate('auth');
      }
      closePopup();
      return;
    }

    const style = musicStyles.find(s => s.id === styleId);
    
    // Сохраняем данные в localStorage
    const recordingData = {
      recordingType: selectedType,
      musicStyle: styleId,
      styleName: style.name
    };

    // Для with-music добавляем выбранный бит
    if (selectedType === 'with-music' && selectedBeatId) {
      recordingData.purchasedBeatId = selectedBeatId;
    }

    localStorage.setItem('recordingData', JSON.stringify(recordingData));

    // Сохраняем в БД
    try {
      await fetch(`${API_URL}/recordings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recording_type: selectedType,
          music_style: styleId,
          purchased_beat_id: selectedType === 'with-music' ? selectedBeatId : null
        })
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    // Переход на страницу оплаты
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('payment');
      }
      closePopup();
    }, 500);
  };

  const renderStars = (value) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={`star-${index}`}
        className={`review-star ${index < value ? 'filled' : ''}`}
        aria-hidden="true"
      >
        *
      </span>
    ));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы оставить отзыв', type: 'warning' });
      if (onNavigate) {
        onNavigate('auth');
      }
      return;
    }

    if (reviewRating < 1) {
      setReviewsError('Поставьте оценку от 1 до 5');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewsError('Введите комментарий');
      return;
    }

    setReviewSubmitting(true);
    setReviewsError('');
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка отправки отзыва');
      }

      const newReview = await response.json();
      setReviews((prev) => [newReview, ...prev]);
      setReviewRating(0);
      setReviewComment('');
    } catch (error) {
      console.error('Ошибка отправки отзыва:', error);
      setReviewsError(error.message || 'Не удалось отправить отзыв');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleVideoOrder = () => {
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы продолжить', type: 'warning' });
      if (onNavigate) {
        onNavigate('auth');
      }
      return;
    }

    localStorage.setItem('recordingData', JSON.stringify({
      recordingType: 'video-clip',
      musicStyle: 'video-clip',
      styleName: 'Видеоклип'
    }));

    if (onNavigate) {
      onNavigate('payment');
    }
  };

  const handleOpenProfile = (userId) => {
    setProfileUserId(userId);
  };

  const closeProfile = () => {
    setProfileUserId(null);
    setProfileData(null);
    setProfileRecordings([]);
    setProfilePurchases([]);
    setProfileError('');
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

  const currentType = recordingTypes.find(type => type.id === selectedType);
  const selectedBeat = purchasedBeats.find(b => b.id === selectedBeatId);

  return (
    <div className="recording-page">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="recording-page-header">
        <h1>Запись</h1>
        <p>Выберите тип записи и стиль музыки</p>
      </div>

      <div className="recording-types-grid">
        {recordingTypes.map(type => (
          <div
            key={type.id}
            className={`recording-type-card ${selectedType === type.id ? 'active' : ''}`}
            onClick={() => handleTypeSelect(type.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTypeSelect(type.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={type.title}
          >
            <div className="type-icon">{type.icon}</div>
            <h3 className="type-title">{type.title}</h3>
            <p className="type-description">{type.description}</p>
          </div>
        ))}
      </div>

      <section className="video-clip-section">
        <div className="video-clip-header">
          <div className="video-clip-title">
            <div className="video-clip-badge">СЪЕМКА ВИДЕОКЛИПА</div>
            <h2>СЪЕМКА ВИДЕОКЛИПА</h2>
            <p>Создаем сценарий и снимаем клип по вашей истории или песне</p>
          </div>
          <div className="video-clip-controls">
            <span>Листайте</span>
            <div className="video-clip-buttons">
              <button type="button" className="video-clip-btn" onClick={handleVideoPrev} aria-label="Предыдущий клип">
                ←
              </button>
              <button type="button" className="video-clip-btn primary" onClick={handleVideoNext} aria-label="Следующий клип">
                →
              </button>
            </div>
          </div>
        </div>

        <div className="video-clip-slider">
          <div
            className="video-clip-track"
            style={{ transform: `translateX(-${videoSlideIndex * (100 / videoItemsPerView)}%)` }}
          >
            {videoWorks.map((work) => (
              <div key={work.id} className="video-clip-item">
                <div
                  className={`video-clip-media ${playingVideoId === work.id ? 'playing' : ''}`}
                  onClick={() => handleVideoToggle(work.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleVideoToggle(work.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Воспроизвести клип: ${work.title}`}
                >
                  <video
                    className="video-clip-video"
                    src={work.video}
                    poster={work.image}
                    preload="metadata"
                    playsInline
                    ref={(el) => {
                      if (el) {
                        videoRefs.current[work.id] = el;
                      } else {
                        delete videoRefs.current[work.id];
                      }
                    }}
                    onPlay={() => setPlayingVideoId(work.id)}
                    onPause={() => setPlayingVideoId((current) => (current === work.id ? null : current))}
                    onEnded={() => setPlayingVideoId(null)}
                  />
                  <div className="video-clip-play">▶</div>
                </div>
                <div className="video-clip-caption">
                  <div className="video-clip-name">{work.title}</div>
                  <div className="video-clip-sub">{work.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="video-clip-info">
          <div className="video-clip-includes">
            <h3>Что входит</h3>
            <ul>
              <li>Память на всю жизнь</li>
              <li>Сценарий клипа</li>
              <li>Профессиональный видеоклип с записи песни</li>
              <li>Профессиональный свет</li>
            </ul>
          </div>
          <button type="button" className="video-clip-order" onClick={handleVideoOrder}>
            Заказать видеоклип
          </button>
        </div>
      </section>

      <section className="reviews-section">
        <div className="reviews-card">
          <div className="reviews-header">
            <div>
              <h2>Отзывы покупателей</h2>
              <p>Поделитесь впечатлением и посмотрите, что думают другие</p>
            </div>
            <div className="reviews-badge">
              {reviews.length} отзывов
            </div>
          </div>

          <div className="reviews-body">
            <div className="reviews-form">
              <h3>Оставить отзыв</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="review-rating">
                  <span className="rating-label">Оценка:</span>
                  <div className="rating-stars">
                    {Array.from({ length: 5 }, (_, index) => (
                      <button
                        key={`rating-${index}`}
                        type="button"
                        className={`rating-star-btn ${index < reviewRating ? 'active' : ''}`}
                        onClick={() => setReviewRating(index + 1)}
                        aria-label={`Оценка ${index + 1}`}
                      >
                        *
                      </button>
                    ))}
                  </div>
                </div>

                <div className="review-textarea">
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Напишите ваш отзыв..."
                    maxLength={1500}
                    rows={5}
                  />
                  <div className="review-counter">
                    {reviewComment.length}/1500
                  </div>
                </div>

                {reviewsError && (
                  <div className="review-error">{reviewsError}</div>
                )}

                <button
                  type="submit"
                  className="review-submit"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Отправка...' : 'Опубликовать'}
                </button>
              </form>
            </div>

            <div className="reviews-divider" aria-hidden="true" />

            <div className="reviews-list">
              <h3>Отзывы</h3>
              {reviewsLoading ? (
                <div className="review-loading">Загрузка...</div>
              ) : reviews.length === 0 ? (
                <div className="review-empty">Пока нет отзывов</div>
              ) : (
                <div className="review-items">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-top">
                        <div className="review-user-block">
                          <div className="review-avatar">
                            {(review.user_name || 'Покупатель').trim().charAt(0).toUpperCase()}
                          </div>
                          <div className="review-user-info">
                            <button
                              type="button"
                              className="review-user"
                              onClick={() => handleOpenProfile(review.user_id)}
                            >
                              {review.user_name || 'Покупатель'}
                            </button>
                            <div className="review-meta">
                              <span className="review-role">
                                {roleNames[review.user_role] || 'Покупатель'}
                              </span>
                              <span className="review-date">
                                {new Date(review.created_at).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="review-stars">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Попап окно */}
      {isPopupOpen && (
        <div
          className="recording-popup-overlay"
          onClick={closePopup}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePopup();
          }}
          tabIndex={-1}
        >
          <div
            className="recording-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="recording-popup-close"
              onClick={closePopup}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="popup-header-content">
              <h2 className="popup-title">{currentType?.title}</h2>
              <p className="popup-description">{currentType?.description}</p>
            </div>

            {/* Выбор купленного бита для with-music */}
            {selectedType === 'with-music' && purchasedBeats.length > 0 && (
              <div className="purchased-beats-selector" ref={beatDropdownRef}>
                <label className="purchased-beats-label">Использовать купленный бит:</label>
                <div className="purchased-beats-dropdown">
                  <button
                    type="button"
                    className="purchased-beats-dropdown-btn"
                    onClick={() => setShowBeatDropdown(!showBeatDropdown)}
                  >
                    {selectedBeat ? selectedBeat.title : 'Выберите бит'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {showBeatDropdown && (
                    <div className="purchased-beats-dropdown-menu">
                      <button
                        type="button"
                        className={`purchased-beats-dropdown-item ${!selectedBeatId ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedBeatId(null);
                          setShowBeatDropdown(false);
                        }}
                      >
                        Не использовать купленный бит
                      </button>
                      {purchasedBeats.map((beat) => (
                        <button
                          key={beat.id}
                          type="button"
                          className={`purchased-beats-dropdown-item ${selectedBeatId === beat.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedBeatId(beat.id);
                            setShowBeatDropdown(false);
                          }}
                        >
                          <div className="purchased-beats-dropdown-cover">
                            {beat.cover_url ? (
                              <img src={beat.cover_url} alt={beat.title} />
                            ) : (
                              <div className="purchased-beats-dropdown-placeholder">—</div>
                            )}
                          </div>
                          <div className="purchased-beats-dropdown-info">
                            <div className="purchased-beats-dropdown-title">{beat.title}</div>
                            <div className="purchased-beats-dropdown-meta">{beat.genre} • BPM {beat.bpm}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="music-styles-container">
              <h3 className="styles-title">Выберите стиль музыки</h3>
              <div className="music-styles-grid">
                {musicStyles.map(style => (
                  <div
                    key={style.id}
                    className={`music-style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => handleStyleSelect(style.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStyleSelect(style.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Выбрать стиль ${style.name}`}
                    style={{ '--style-color': style.color }}
                  >
                    <div className="style-icon">{style.icon}</div>
                    <div className="style-name">{style.name}</div>
                    {selectedStyle === style.id && (
                      <div className="style-check">OK</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile modal - остальной код без изменений */}
      {profileUserId && (
        <div
          className="profile-modal-overlay"
          onClick={closeProfile}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeProfile();
          }}
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-modal-close"
              onClick={closeProfile}
              aria-label="Закрыть"
            >
              ×
            </button>

            {profileLoading ? (
              <div className="profile-loading">Загрузка профиля...</div>
            ) : profileError ? (
              <div className="profile-error">{profileError}</div>
            ) : profileData ? (
              <>
                <div className="profile-header">
                  <div className="profile-info">
                    <h3>{profileData.name || 'Пользователь'}</h3>
                    <div className="profile-meta">
                      <span className="profile-role-badge">
                        {roleNames[profileData.role] || 'Покупатель'}
                      </span>
                      <span className="profile-date">
                        На сервисе с {new Date(profileData.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-sections">
                  <div className="profile-section">
                    <h4>Записи</h4>
                    {profileRecordings.length === 0 ? (
                      <div className="profile-empty">Нет записей</div>
                    ) : (
                      <div className="profile-recordings">
                        {profileRecordings.map((recording) => (
                          <div key={recording.id} className="profile-recording-item">
                            <div className="recording-info">
                              <div className="recording-type">
                                {recordingTypeNames[recording.recording_type] || recording.recording_type}
                              </div>
                              <div className="recording-style">
                                {musicStyleNames[recording.music_style] || recording.music_style}
                              </div>
                              <div className="recording-date">
                                {new Date(recording.created_at).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                            <div className="recording-status">
                              <span className={`status-badge status-${recording.status}`}>
                                {statusNames[recording.status] || recording.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="profile-section">
                    <h4>Покупки</h4>
                    {profilePurchases.length === 0 ? (
                      <div className="profile-empty">Нет покупок</div>
                    ) : (
                      <div className="profile-purchases">
                        {profilePurchases.map((purchase) => (
                          <div key={purchase.id} className="profile-purchase-item">
                            <div className="purchase-cover">
                              {purchase.cover_url ? (
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
                                {purchase.genre} • BPM {purchase.bpm}
                              </div>
                              <div className="purchase-date">
                                Куплено {new Date(purchase.purchased_at).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordingPage;
