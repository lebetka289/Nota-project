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
  const [selectedBeatIds, setSelectedBeatIds] = useState([]);
  const [showBeatDropdown, setShowBeatDropdown] = useState(false);
  const beatDropdownRef = useRef(null);

  // Форма уточнения для «Запись с покупкой музыки» (передаётся битмейкеру)
  const [wmFirstName, setWmFirstName] = useState('');
  const [wmLastName, setWmLastName] = useState('');
  const [wmPhone, setWmPhone] = useState('');
  const [wmIntlPrefix, setWmIntlPrefix] = useState('+7');
  const [wmMusicGenre, setWmMusicGenre] = useState('');
  const [wmSongsCount, setWmSongsCount] = useState('');
  const [wmMusicDetails, setWmMusicDetails] = useState('');
  const [wmDateStart, setWmDateStart] = useState('');
  const [wmDateEnd, setWmDateEnd] = useState('');
  const [wmHasMusicians, setWmHasMusicians] = useState('');
  const [wmNeedSessionMusicians, setWmNeedSessionMusicians] = useState('');
  const [wmNeedProducer, setWmNeedProducer] = useState('');
  const [wmNeedEngineer, setWmNeedEngineer] = useState('');
  const [wmAdditionalInfo, setWmAdditionalInfo] = useState('');
  const [wmFormSubmitting, setWmFormSubmitting] = useState(false);
  const [wmFormSent, setWmFormSent] = useState(false);

  const recordingTypes = [
    { id: 'with-music', title: 'Запись с покупкой музыки', description: 'Выберите бит и запишите на него свой вокал', icon: 'MIC', image: '/recording/type-music.png' },
    { id: 'home-recording', title: 'Запись на дому', description: 'Профессиональная сводка трека по жанрам', icon: 'HOME', image: '/recording/type-home.png' }
  ];

  const VIDEO_CLIP_PRICE = 10000;

  const formatPhone = (v) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits[0] === '8' || digits[0] === '7') {
      const d = digits.slice(0, 11);
      if (d.length <= 1) return '+7';
      if (d.length <= 4) return `+7 (${d.slice(1)}`;
      if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
      return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
    }
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d ? `+7 (${d}` : '+7';
    if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
  };

  const handleWmPhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setWmPhone(formatted);
  };

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
    setSelectedBeatIds([]);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedStyle(null);
    setSelectedBeatId(null);
    setSelectedBeatIds([]);
    setWmFormSent(false);
    setWmFirstName('');
    setWmLastName('');
    setWmPhone('');
    setWmIntlPrefix('+7');
    setWmMusicGenre('');
    setWmSongsCount('');
    setWmMusicDetails('');
    setWmDateStart('');
    setWmDateEnd('');
    setWmHasMusicians('');
    setWmNeedSessionMusicians('');
    setWmNeedProducer('');
    setWmNeedEngineer('');
    setWmAdditionalInfo('');
    document.body.style.overflow = 'auto';
  };

  const proceedToPayment = async () => {
    if (!selectedStyle) return;
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы продолжить', type: 'warning' });
      if (onNavigate) onNavigate('auth');
      closePopup();
      return;
    }
    const styleId = selectedStyle;
    const style = musicStyles.find(s => s.id === styleId);
    const recordingData = {
      recordingType: selectedType,
      musicStyle: styleId,
      styleName: style.name
    };
    if (selectedType === 'with-music' && selectedBeatIds.length > 0) {
      recordingData.purchasedBeatIds = selectedBeatIds;
      recordingData.purchasedBeatId = selectedBeatIds[0];
    }
    localStorage.setItem('recordingData', JSON.stringify(recordingData));
    try {
      await fetch(`${API_URL}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          recording_type: selectedType,
          music_style: styleId,
          purchased_beat_id: selectedType === 'with-music' && selectedBeatIds.length > 0 ? selectedBeatIds[0] : null,
          purchased_beat_ids: selectedType === 'with-music' ? selectedBeatIds : undefined
        })
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
    setTimeout(() => {
      if (onNavigate) onNavigate('payment');
      closePopup();
    }, 300);
  };

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
    if (selectedType === 'with-music') {
      setWmMusicGenre(styleId);
      return;
    }
    if (selectedType === 'home-recording') {
      setWmMusicGenre(styleId);
      return;
    }
    if (!user) {
      setAlert({ message: 'Войдите в аккаунт, чтобы продолжить', type: 'warning' });
      if (onNavigate) onNavigate('auth');
      closePopup();
      return;
    }
    proceedToPayment();
  };

  const toggleBeatSelection = (beatId) => {
    setSelectedBeatIds(prev => prev.includes(beatId) ? prev.filter(id => id !== beatId) : [...prev, beatId]);
    setSelectedBeatId(null);
  };

  const handleWithMusicFormSubmit = async (e) => {
    e.preventDefault();
    if (!wmFirstName.trim()) { setAlert({ message: 'Укажите имя', type: 'error' }); return; }
    if (!wmLastName.trim()) { setAlert({ message: 'Укажите фамилию', type: 'error' }); return; }
    if (!wmPhone.trim()) { setAlert({ message: 'Укажите телефон', type: 'error' }); return; }
    if (!wmMusicGenre && !selectedStyle) { setAlert({ message: 'Выберите стиль музыки (кнопками выше)', type: 'error' }); return; }
    const count = Number(wmSongsCount);
    if (!Number.isInteger(count) || count < 1) { setAlert({ message: 'Укажите количество песен (не менее 1)', type: 'error' }); return; }
    if (!wmDateStart) { setAlert({ message: 'Укажите дату начала', type: 'error' }); return; }
    if (!wmDateEnd) { setAlert({ message: 'Укажите дату окончания', type: 'error' }); return; }
    if (new Date(wmDateEnd) < new Date(wmDateStart)) { setAlert({ message: 'Дата окончания не может быть раньше даты начала', type: 'error' }); return; }
    if (wmHasMusicians === '') { setAlert({ message: 'Ответьте: есть ли музыканты или группа?', type: 'error' }); return; }
    if (wmNeedSessionMusicians === '') { setAlert({ message: 'Ответьте: нужны ли сессионные музыканты?', type: 'error' }); return; }
    if (wmNeedProducer === '') { setAlert({ message: 'Ответьте: нужен ли продюсер?', type: 'error' }); return; }
    if (wmNeedEngineer === '') { setAlert({ message: 'Ответьте: нужен ли звукорежиссёр?', type: 'error' }); return; }

    setWmFormSubmitting(true);
    setAlert(null);
    try {
      const r = await fetch(`${API_URL}/studio-booking/with-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: wmFirstName.trim(),
          lastName: wmLastName.trim(),
          phone: wmPhone.trim(),
          intlPrefix: wmIntlPrefix.trim() || undefined,
          musicGenre: wmMusicGenre || selectedStyle,
          songsCount: Number(wmSongsCount),
          musicDetails: wmMusicDetails.trim() || undefined,
          dateStart: wmDateStart,
          dateEnd: wmDateEnd,
          hasMusicians: wmHasMusicians === 'yes',
          needSessionMusicians: wmNeedSessionMusicians === 'yes',
          needProducer: wmNeedProducer === 'yes',
          needEngineer: wmNeedEngineer === 'yes',
          additionalInfo: wmAdditionalInfo.trim() || undefined,
          beatIds: selectedBeatIds.length > 0 ? selectedBeatIds : undefined,
          beatId: selectedBeatIds.length > 0 ? selectedBeatIds[0] : undefined
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || data.error || 'Ошибка отправки');
      if (data.bookingId) {
        const prev = JSON.parse(localStorage.getItem('recordingData') || '{}');
        localStorage.setItem('recordingData', JSON.stringify({
          ...prev,
          recordingType: 'with-music',
          musicStyle: wmMusicGenre || selectedStyle,
          studioBookingId: data.bookingId,
          purchasedBeatIds: selectedBeatIds.length > 0 ? selectedBeatIds : undefined,
          purchasedBeatId: selectedBeatIds.length > 0 ? selectedBeatIds[0] : undefined,
          songsCount: Number(wmSongsCount),
          dateStart: wmDateStart,
          dateEnd: wmDateEnd
        }));
        localStorage.setItem('pendingStudioBookingId', String(data.bookingId));
        localStorage.setItem('paymentPageSummaryOnly', '1');
      }
      setWmFormSent(true);
      setAlert({ message: 'Заявка отправлена.', type: 'success' });
      closePopup();
      if (onNavigate) onNavigate('payment');
    } catch (err) {
      setAlert({ message: err.message || 'Не удалось отправить данные', type: 'error' });
    } finally {
      setWmFormSubmitting(false);
    }
  };

  const handleHomeRecordingFormSubmit = async (e) => {
    e.preventDefault();
    if (!wmFirstName.trim()) { setAlert({ message: 'Укажите имя', type: 'error' }); return; }
    if (!wmLastName.trim()) { setAlert({ message: 'Укажите фамилию', type: 'error' }); return; }
    if (!wmPhone.trim()) { setAlert({ message: 'Укажите телефон', type: 'error' }); return; }
    if (!wmMusicGenre && !selectedStyle) { setAlert({ message: 'Выберите стиль музыки (кнопками выше)', type: 'error' }); return; }
    const count = Number(wmSongsCount);
    if (!Number.isInteger(count) || count < 1) { setAlert({ message: 'Укажите количество песен (не менее 1)', type: 'error' }); return; }
    if (!wmDateStart) { setAlert({ message: 'Укажите дату начала', type: 'error' }); return; }
    if (!wmDateEnd) { setAlert({ message: 'Укажите дату окончания', type: 'error' }); return; }
    if (new Date(wmDateEnd) < new Date(wmDateStart)) { setAlert({ message: 'Дата окончания не может быть раньше даты начала', type: 'error' }); return; }
    if (wmHasMusicians === '') { setAlert({ message: 'Ответьте: есть ли музыканты или группа?', type: 'error' }); return; }
    if (wmNeedSessionMusicians === '') { setAlert({ message: 'Ответьте: нужны ли сессионные музыканты?', type: 'error' }); return; }
    if (wmNeedProducer === '') { setAlert({ message: 'Ответьте: нужен ли продюсер?', type: 'error' }); return; }
    if (wmNeedEngineer === '') { setAlert({ message: 'Ответьте: нужен ли звукорежиссёр?', type: 'error' }); return; }

    setWmFormSubmitting(true);
    setAlert(null);
    try {
      const r = await fetch(`${API_URL}/studio-booking/home-recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: wmFirstName.trim(),
          lastName: wmLastName.trim(),
          phone: wmPhone.trim(),
          intlPrefix: wmIntlPrefix.trim() || undefined,
          musicGenre: wmMusicGenre || selectedStyle,
          songsCount: Number(wmSongsCount),
          musicDetails: wmMusicDetails.trim() || undefined,
          dateStart: wmDateStart,
          dateEnd: wmDateEnd,
          hasMusicians: wmHasMusicians === 'yes',
          needSessionMusicians: wmNeedSessionMusicians === 'yes',
          needProducer: wmNeedProducer === 'yes',
          needEngineer: wmNeedEngineer === 'yes',
          additionalInfo: wmAdditionalInfo.trim() || undefined
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || data.error || 'Ошибка отправки');
      if (data.bookingId) {
        const prev = JSON.parse(localStorage.getItem('recordingData') || '{}');
        localStorage.setItem('recordingData', JSON.stringify({
          ...prev,
          recordingType: 'home-recording',
          musicStyle: wmMusicGenre || selectedStyle,
          studioBookingId: data.bookingId,
          songsCount: Number(wmSongsCount),
          dateStart: wmDateStart,
          dateEnd: wmDateEnd
        }));
        localStorage.setItem('pendingStudioBookingId', String(data.bookingId));
        localStorage.setItem('paymentPageSummaryOnly', '1');
      }
      setWmFormSent(true);
      setAlert({ message: 'Заявка принята.', type: 'success' });
      closePopup();
      if (onNavigate) onNavigate('payment');
    } catch (err) {
      setAlert({ message: err.message || 'Не удалось отправить данные', type: 'error' });
    } finally {
      setWmFormSubmitting(false);
    }
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
  const selectedBeatsList = purchasedBeats.filter(b => selectedBeatIds.includes(b.id));

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
            className={`recording-type-card ${selectedType === type.id ? 'active' : ''} ${type.image ? 'recording-type-card--with-image' : ''}`}
            style={type.image ? { backgroundImage: `url(${type.image})` } : undefined}
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
            {!type.image && <div className="type-icon">{type.icon}</div>}
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
                    preload="auto"
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
          <div className="video-clip-pricing">
            <h3>Стоимость и как проходит съёмка</h3>
            <p className="video-clip-price-amount">Видеоклип: <strong>{VIDEO_CLIP_PRICE.toLocaleString('ru-RU')} ₽</strong></p>
            <p className="video-clip-price-desc">Как проходит: создаём сценарий по вашей истории или песне, затем профессиональная съёмка видеоклипа с светом и записью.</p>
          </div>
          <button type="button" className="video-clip-order" onClick={handleVideoOrder}>
            Заказать видеоклип
          </button>
        </div>
      </section>

      <section className="reviews-section-asos">
        <div className="reviews-asos-inner">
          <div className="reviews-asos-header">
            <div className="reviews-asos-badge">ОТЗЫВЫ</div>
            <h2 className="reviews-asos-title">Отзывы покупателей</h2>
            <p className="reviews-asos-sub">Поделитесь впечатлением и посмотрите, что думают другие</p>
            <div className="reviews-asos-count">{reviews.length} отзывов</div>
          </div>

          <div className="reviews-asos-body">
            <div className="reviews-asos-form-wrap">
              <h3 className="reviews-asos-form-title">Оставить отзыв</h3>
              <form className="reviews-asos-form" onSubmit={handleReviewSubmit}>
                <div className="reviews-asos-rating">
                  <span className="reviews-asos-rating-label">Оценка</span>
                  <div className="reviews-asos-stars">
                    {Array.from({ length: 5 }, (_, index) => (
                      <button
                        key={`rating-${index}`}
                        type="button"
                        className={`reviews-asos-star-btn ${index < reviewRating ? 'active' : ''}`}
                        onClick={() => setReviewRating(index + 1)}
                        aria-label={`Оценка ${index + 1}`}
                      >
                        *
                      </button>
                    ))}
                  </div>
                </div>
                <div className="reviews-asos-field">
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Напишите ваш отзыв..."
                    maxLength={1500}
                    rows={5}
                    className="reviews-asos-textarea"
                  />
                  <div className="reviews-asos-counter">{reviewComment.length}/1500</div>
                </div>
                {reviewsError && <div className="reviews-asos-error">{reviewsError}</div>}
                <button type="submit" className="reviews-asos-submit" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Отправка...' : 'Опубликовать'}
                </button>
              </form>
            </div>

            <div className="reviews-asos-list-wrap">
              <h3 className="reviews-asos-list-title">Отзывы</h3>
              {reviewsLoading ? (
                <div className="reviews-asos-loading">Загрузка...</div>
              ) : reviews.length === 0 ? (
                <div className="reviews-asos-empty">Пока нет отзывов</div>
              ) : (
                <div className="reviews-asos-grid">
                  {reviews.map((review) => (
                    <div key={review.id} className="reviews-asos-card">
                      <div className="reviews-asos-card-header">
                        <div className="reviews-asos-avatar">
                          {review.avatar_url ? (
                            <img src={review.avatar_url} alt="" />
                          ) : (
                            (review.user_name || 'П').trim().charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="reviews-asos-card-user">
                          <button
                            type="button"
                            className="reviews-asos-card-name"
                            onClick={() => handleOpenProfile(review.user_id)}
                          >
                            {review.user_name || 'Покупатель'}
                          </button>
                          <div className="reviews-asos-card-meta">
                            <span className="reviews-asos-role">{roleNames[review.user_role] || 'Покупатель'}</span>
                            <span className="reviews-asos-date">
                              {new Date(review.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="reviews-asos-card-stars">{renderStars(review.rating)}</div>
                      <p className="reviews-asos-card-text">{review.comment}</p>
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

            {/* Выбор купленных битов для with-music (несколько) */}
            {selectedType === 'with-music' && purchasedBeats.length > 0 && (
              <div className="purchased-beats-selector" ref={beatDropdownRef}>
                <label className="purchased-beats-label">Купленные биты для записи (можно выбрать несколько):</label>
                <div className="purchased-beats-dropdown">
                  <button
                    type="button"
                    className="purchased-beats-dropdown-btn"
                    onClick={() => setShowBeatDropdown(!showBeatDropdown)}
                  >
                    {selectedBeatsList.length > 0
                      ? `Выбрано битов: ${selectedBeatsList.length}${selectedBeatsList.length === 1 ? ` — ${selectedBeatsList[0].title}` : ''}`
                      : 'Выберите один или несколько битов'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {showBeatDropdown && (
                    <div className="purchased-beats-dropdown-menu">
                      {selectedBeatIds.length > 0 && (
                        <button
                          type="button"
                          className="purchased-beats-dropdown-item"
                          onClick={() => setSelectedBeatIds([])}
                        >
                          Снять выбор
                        </button>
                      )}
                      {purchasedBeats.map((beat) => (
                        <button
                          key={beat.id}
                          type="button"
                          className={`purchased-beats-dropdown-item ${selectedBeatIds.includes(beat.id) ? 'selected' : ''}`}
                          onClick={() => toggleBeatSelection(beat.id)}
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
                          {selectedBeatIds.includes(beat.id) && <span className="purchased-beats-check">✓</span>}
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

            {/* Форма уточнения для «Запись на дому» — та же система, без упоминания скидки */}
            {selectedType === 'home-recording' && selectedStyle && (
              <div className="popup-wm-form-wrap">
                <form className="popup-wm-form" onSubmit={handleHomeRecordingFormSubmit}>
                  <h3 className="popup-wm-form-title">Уточнение для записи на дому</h3>
                  <div className="popup-wm-form-grid">
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Имя *</label>
                        <input type="text" placeholder="Имя" value={wmFirstName} onChange={(e) => setWmFirstName(e.target.value)} />
                      </div>
                      <div className="popup-wm-field">
                        <label>Фамилия *</label>
                        <input type="text" placeholder="Фамилия" value={wmLastName} onChange={(e) => setWmLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Телефон *</label>
                        <input type="tel" placeholder="+7 (999) 123-45-67" value={wmPhone} onChange={handleWmPhoneChange} />
                      </div>
                      <div className="popup-wm-field popup-wm-intl">
                        <label>Межд. префикс</label>
                        <input type="text" placeholder="+7" value={wmIntlPrefix} onChange={(e) => setWmIntlPrefix(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>Количество песен *</label>
                        <input type="number" min={1} placeholder="1" value={wmSongsCount} onChange={(e) => setWmSongsCount(e.target.value)} />
                        <span className="popup-wm-hint">Сколько песен планируете записать?</span>
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>О вашей музыке</label>
                        <textarea rows={3} placeholder="Опишите стиль и по возможности приложите ссылки на треки." value={wmMusicDetails} onChange={(e) => setWmMusicDetails(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <span className="popup-wm-section-label">Когда хотите записаться?</span>
                    </div>
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Начало *</label>
                        <input type="date" value={wmDateStart} onChange={(e) => setWmDateStart(e.target.value)} />
                      </div>
                      <div className="popup-wm-field">
                        <label>Окончание *</label>
                        <input type="date" value={wmDateEnd} onChange={(e) => setWmDateEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">У вас есть музыканты или группа? *</span>
                      <label className="popup-wm-radio"><input type="radio" name="hrHasMusicians" value="yes" checked={wmHasMusicians === 'yes'} onChange={() => setWmHasMusicians('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="hrHasMusicians" value="no" checked={wmHasMusicians === 'no'} onChange={() => setWmHasMusicians('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужны сессионные музыканты? *</span>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedSession" value="yes" checked={wmNeedSessionMusicians === 'yes'} onChange={() => setWmNeedSessionMusicians('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedSession" value="no" checked={wmNeedSessionMusicians === 'no'} onChange={() => setWmNeedSessionMusicians('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужен продюсер? *</span>
                      <span className="popup-wm-hint">Рекомендуем «Да», если сомневаетесь.</span>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedProducer" value="yes" checked={wmNeedProducer === 'yes'} onChange={() => setWmNeedProducer('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedProducer" value="no" checked={wmNeedProducer === 'no'} onChange={() => setWmNeedProducer('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужен звукорежиссёр? *</span>
                      <span className="popup-wm-hint">Рекомендуем «Да», если сомневаетесь.</span>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedEngineer" value="yes" checked={wmNeedEngineer === 'yes'} onChange={() => setWmNeedEngineer('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="hrNeedEngineer" value="no" checked={wmNeedEngineer === 'no'} onChange={() => setWmNeedEngineer('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>Всё остальное</label>
                        <textarea rows={2} placeholder="Пожелания, особые запросы" value={wmAdditionalInfo} onChange={(e) => setWmAdditionalInfo(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-submit-row">
                      <button type="submit" className="popup-wm-submit" disabled={wmFormSubmitting}>
                        {wmFormSubmitting ? 'Отправка…' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Форма уточнения для «Запись с покупкой музыки» — передаётся битмейкеру */}
            {selectedType === 'with-music' && selectedStyle && (
              <div className="popup-wm-form-wrap">
                <form className="popup-wm-form" onSubmit={handleWithMusicFormSubmit}>
                  <h3 className="popup-wm-form-title">Уточнение для битмейкера</h3>
                  <div className="popup-wm-form-grid">
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Имя *</label>
                        <input type="text" placeholder="Имя" value={wmFirstName} onChange={(e) => setWmFirstName(e.target.value)} />
                      </div>
                      <div className="popup-wm-field">
                        <label>Фамилия *</label>
                        <input type="text" placeholder="Фамилия" value={wmLastName} onChange={(e) => setWmLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Телефон *</label>
                        <input type="tel" placeholder="+7 (999) 123-45-67" value={wmPhone} onChange={handleWmPhoneChange} />
                      </div>
                      <div className="popup-wm-field popup-wm-intl">
                        <label>Межд. префикс</label>
                        <input type="text" placeholder="+7" value={wmIntlPrefix} onChange={(e) => setWmIntlPrefix(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>Количество песен *</label>
                        <input type="number" min={1} placeholder="1" value={wmSongsCount} onChange={(e) => setWmSongsCount(e.target.value)} />
                        <span className="popup-wm-hint">Сколько песен планируете записать?</span>
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>О вашей музыке</label>
                        <textarea rows={3} placeholder="Опишите стиль и по возможности приложите ссылки на треки." value={wmMusicDetails} onChange={(e) => setWmMusicDetails(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row">
                      <span className="popup-wm-section-label">Когда хотите записаться?</span>
                    </div>
                    <div className="popup-wm-row popup-wm-row-inline">
                      <div className="popup-wm-field">
                        <label>Начало *</label>
                        <input type="date" value={wmDateStart} onChange={(e) => setWmDateStart(e.target.value)} />
                      </div>
                      <div className="popup-wm-field">
                        <label>Окончание *</label>
                        <input type="date" value={wmDateEnd} onChange={(e) => setWmDateEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">У вас есть музыканты или группа? *</span>
                      <label className="popup-wm-radio"><input type="radio" name="wmHasMusicians" value="yes" checked={wmHasMusicians === 'yes'} onChange={() => setWmHasMusicians('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="wmHasMusicians" value="no" checked={wmHasMusicians === 'no'} onChange={() => setWmHasMusicians('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужны сессионные музыканты? *</span>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedSession" value="yes" checked={wmNeedSessionMusicians === 'yes'} onChange={() => setWmNeedSessionMusicians('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedSession" value="no" checked={wmNeedSessionMusicians === 'no'} onChange={() => setWmNeedSessionMusicians('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужен продюсер? *</span>
                      <span className="popup-wm-hint">Рекомендуем «Да», если сомневаетесь.</span>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedProducer" value="yes" checked={wmNeedProducer === 'yes'} onChange={() => setWmNeedProducer('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedProducer" value="no" checked={wmNeedProducer === 'no'} onChange={() => setWmNeedProducer('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row popup-wm-radio-row">
                      <span className="popup-wm-label">Нужен звукорежиссёр? *</span>
                      <span className="popup-wm-hint">Рекомендуем «Да», если сомневаетесь.</span>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedEngineer" value="yes" checked={wmNeedEngineer === 'yes'} onChange={() => setWmNeedEngineer('yes')} /> Да</label>
                      <label className="popup-wm-radio"><input type="radio" name="wmNeedEngineer" value="no" checked={wmNeedEngineer === 'no'} onChange={() => setWmNeedEngineer('no')} /> Нет</label>
                    </div>
                    <div className="popup-wm-row">
                      <div className="popup-wm-field">
                        <label>Всё остальное</label>
                        <textarea rows={2} placeholder="Пожелания, особые запросы" value={wmAdditionalInfo} onChange={(e) => setWmAdditionalInfo(e.target.value)} />
                      </div>
                    </div>
                    <div className="popup-wm-row popup-wm-submit-row">
                      <button type="submit" className="popup-wm-submit" disabled={wmFormSubmitting}>
                        {wmFormSubmitting ? 'Отправка…' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
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
