import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './NewsPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const TEXT_PREVIEW_LENGTH = 200;

// Превращает URL в тексте в кликабельные ссылки
const linkify = (text) => {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="news-content-link">{part}</a>
    ) : (
      part
    )
  );
};

// Форматирование даты и времени для комментариев
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Мемоизированный компонент новости
const NewsItem = memo(({ item, onOpenPopup, formatDate, onLikeToggle, token }) => {
  const previewText = useMemo(() => {
    return item.content.length > TEXT_PREVIEW_LENGTH 
      ? item.content.substring(0, TEXT_PREVIEW_LENGTH) + '...'
      : item.content;
  }, [item.content]);

  const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [].concat(item.tags) : []);
  const likesCount = item.likes_count ?? 0;
  const userHasLiked = item.user_has_liked ?? false;
  const commentsCount = item.comments_count ?? 0;

  const handleImageClick = useCallback(() => {
    onOpenPopup(item);
  }, [item, onOpenPopup]);

  const handleReadMore = useCallback(() => {
    onOpenPopup(item);
  }, [item, onOpenPopup]);

  const handleLikeClick = useCallback(() => {
    if (token && onLikeToggle) onLikeToggle(item.id);
  }, [item.id, token, onLikeToggle]);

  return (
    <article className="news-item">
      {item.image_url && (
        <div className="news-image" onClick={handleImageClick}>
          <img 
            src={item.image_url} 
            alt={item.title}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <div className="news-content">
        <h2 className="news-title">{item.title}</h2>
        <div className="news-meta">
          <div className="news-author-block">
            {item.author_avatar_url ? (
              <img src={item.author_avatar_url} alt="" className="news-author-avatar" />
            ) : (
              <span className="news-author-letter">{(item.author_name || 'А').charAt(0)}</span>
            )}
            <span className="news-author">{item.author_name}</span>
          </div>
          <span className="news-date">{formatDate(item.published_at || item.created_at)}</span>
          <span className="news-views">Просмотров: {item.view_count ?? 0}</span>
        </div>
        {tags.length > 0 && (
          <div className="news-tags">
            {tags.map((tag, i) => (
              <span key={i} className="news-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="news-text-wrapper">
          <div className="news-text">{linkify(previewText)}</div>
          {item.content.length > TEXT_PREVIEW_LENGTH && (
            <button className="news-read-more" onClick={handleReadMore}>
              Смотреть больше
            </button>
          )}
        </div>
        <div className="news-actions">
          <button
            type="button"
            className={`news-like-btn ${userHasLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            title={token ? (userHasLiked ? 'Убрать лайк' : 'Нравится') : 'Войдите, чтобы поставить лайк'}
            disabled={!token}
          >
            <span className="news-like-icon">{userHasLiked ? '♥' : '♡'}</span>
            <span className="news-like-count">{likesCount}</span>
          </button>
          <button type="button" className="news-comments-count" onClick={() => onOpenPopup(item)}>
            Комментарии ({commentsCount})
          </button>
        </div>
      </div>
    </article>
  );
});

NewsItem.displayName = 'NewsItem';

function NewsPage({ openNewsId = null, onOpenNewsHandled }) {
  const { token } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupNews, setPopupNews] = useState(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [popupComments, setPopupComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [popupLiked, setPopupLiked] = useState(false);
  const [popupLikesCount, setPopupLikesCount] = useState(0);
  const itemRefs = useRef({});

  const fetchComments = useCallback(async (newsId) => {
    try {
      const r = await fetch(`${API_URL}/news/${newsId}/comments`);
      if (r.ok) {
        const data = await r.json();
        setPopupComments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Ошибка загрузки комментариев:', e);
    }
  }, []);

  const handleOpenPopup = useCallback(async (item) => {
    setPopupNews(item);
    setImageZoomed(false);
    setPopupLiked(item.user_has_liked ?? false);
    setPopupLikesCount(item.likes_count ?? 0);
    setPopupComments([]);
    setCommentText('');
    fetchComments(item.id);
    try {
      const r = await fetch(`${API_URL}/news/${item.id}/view`, { method: 'POST' });
      if (r.ok) {
        const data = await r.json();
        const newCount = data.view_count ?? (item.view_count ?? 0) + 1;
        setNews((prev) => prev.map((n) => n.id === item.id ? { ...n, view_count: newCount } : n));
        setPopupNews((prev) => prev ? { ...prev, view_count: newCount } : null);
      }
    } catch (e) {
      console.error('Ошибка счётчика просмотров:', e);
    }
  }, [fetchComments]);

  useEffect(() => {
    fetchNews();
  }, [token]);

  // Плавный скролл к новости и открытие попапа при переходе из поиска
  useEffect(() => {
    if (!openNewsId || loading || news.length === 0) return;
    const item = news.find((n) => n.id === openNewsId);
    if (!item) return;
    const el = itemRefs.current[openNewsId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => {
        handleOpenPopup(item);
        onOpenNewsHandled?.();
      }, 600);
      return () => clearTimeout(t);
    }
    onOpenNewsHandled?.();
  }, [openNewsId, loading, news, handleOpenPopup, onOpenNewsHandled]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${API_URL}/news`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = useCallback(async (newsId) => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/news/${newsId}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const data = await r.json();
      setNews((prev) =>
        prev.map((n) =>
          n.id === newsId
            ? { ...n, likes_count: data.likes_count, user_has_liked: data.liked }
            : n
        )
      );
      if (popupNews?.id === newsId) {
        setPopupLiked(data.liked);
        setPopupLikesCount(data.likes_count);
      }
    } catch (e) {
      console.error('Ошибка лайка:', e);
    }
  }, [token, popupNews?.id]);

  const handleAddComment = useCallback(async () => {
    if (!popupNews || !token || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const r = await fetch(`${API_URL}/news/${popupNews.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: commentText.trim() })
      });
      if (r.ok) {
        const newComment = await r.json();
        setPopupComments((prev) => [...prev, newComment]);
        setCommentText('');
        setNews((prev) =>
          prev.map((n) =>
            n.id === popupNews.id
              ? { ...n, comments_count: (n.comments_count ?? 0) + 1 }
              : n
          )
        );
        setPopupNews((prev) => (prev ? { ...prev, comments_count: (prev.comments_count ?? 0) + 1 } : null));
      }
    } catch (e) {
      console.error('Ошибка отправки комментария:', e);
    } finally {
      setSendingComment(false);
    }
  }, [popupNews, token, commentText]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupNews(null);
    setImageZoomed(false);
  }, []);

  const handleImageZoom = useCallback((e) => {
    e.stopPropagation(); // Предотвращаем закрытие popup при клике на изображение
    setImageZoomed(prev => !prev);
  }, []);

  const handleZoomedImageClick = useCallback((e) => {
    // При клике на увеличенное изображение - уменьшаем его
    e.stopPropagation();
    setImageZoomed(false);
  }, []);

  const handleZoomedOverlayClick = useCallback(() => {
    // При клике на overlay когда изображение увеличено - уменьшаем изображение
    setImageZoomed(false);
  }, []);

  const handleOverlayClick = useCallback(() => {
    handleClosePopup();
  }, [handleClosePopup]);

  if (loading) {
    return <div className="news-page loading">Загрузка...</div>;
  }

  return (
    <div className="news-page">
      <div className="news-header">
        <h1>Новости о музыкантах</h1>
      </div>

      {news.length === 0 ? (
        <div className="news-empty">Новостей пока нет</div>
      ) : (
        <div className="news-list">
          {news.map((item) => (
            <div
              key={item.id}
              ref={(el) => { if (el) itemRefs.current[item.id] = el; }}
              data-news-id={item.id}
            >
              <NewsItem 
                item={item} 
                onOpenPopup={handleOpenPopup}
                formatDate={formatDate}
                onLikeToggle={handleLikeToggle}
                token={token}
              />
            </div>
          ))}
        </div>
      )}

      {popupNews && (
        <>
          {imageZoomed && popupNews.image_url ? (
            <div 
              className="news-popup-overlay image-zoomed"
              onClick={handleZoomedOverlayClick}
            >
              <div 
                className="news-popup-image-zoomed-fullscreen"
                onClick={handleZoomedImageClick}
              >
                <button className="news-popup-close-zoomed" onClick={handleZoomedImageClick}>×</button>
                <img 
                  src={popupNews.image_url} 
                  alt={popupNews.title}
                  loading="eager"
                />
                <div className="news-popup-zoom-hint-fullscreen">
                  Кликните, чтобы уменьшить
                </div>
              </div>
            </div>
          ) : (
            <div className="news-popup-overlay" onClick={handleOverlayClick}>
              <div className="news-popup" onClick={(e) => e.stopPropagation()}>
                <button className="news-popup-close" onClick={handleClosePopup}>×</button>
                {popupNews.image_url && (
                  <div 
                    className="news-popup-image"
                    onClick={handleImageZoom}
                  >
                    <img 
                      src={popupNews.image_url} 
                      alt={popupNews.title}
                      loading="eager"
                    />
                    <div className="news-popup-zoom-hint">
                      Кликните, чтобы увеличить
                    </div>
                  </div>
                )}
                <div className="news-popup-content">
                  <h2 className="news-popup-title">{popupNews.title}</h2>
                  <div className="news-popup-meta">
                    <div className="news-author-block">
                      {popupNews.author_avatar_url ? (
                        <img src={popupNews.author_avatar_url} alt="" className="news-author-avatar" />
                      ) : (
                        <span className="news-author-letter">{(popupNews.author_name || 'А').charAt(0)}</span>
                      )}
                      <span className="news-popup-author">{popupNews.author_name}</span>
                    </div>
                    <span className="news-popup-date">{formatDate(popupNews.published_at || popupNews.created_at)}</span>
                    <span className="news-popup-views">Просмотров: {popupNews.view_count ?? 0}</span>
                  </div>
                  {Array.isArray(popupNews.tags) && popupNews.tags.length > 0 && (
                    <div className="news-tags news-popup-tags">
                      {popupNews.tags.map((tag, i) => (
                        <span key={i} className="news-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="news-popup-text">{linkify(popupNews.content)}</div>

                  <div className="news-popup-actions">
                    <button
                      type="button"
                      className={`news-like-btn ${popupLiked ? 'liked' : ''}`}
                      onClick={() => handleLikeToggle(popupNews.id)}
                      title={token ? (popupLiked ? 'Убрать лайк' : 'Нравится') : 'Войдите, чтобы поставить лайк'}
                      disabled={!token}
                    >
                      <span className="news-like-icon">{popupLiked ? '♥' : '♡'}</span>
                      <span className="news-like-count">{popupLikesCount}</span>
                    </button>
                  </div>

                  <div className="news-popup-comments">
                    <h4 className="news-comments-title">Комментарии ({popupComments.length})</h4>
                    <div className="news-comments-list">
                      {popupComments.length === 0 ? (
                        <p className="news-comments-empty">Пока нет комментариев</p>
                      ) : (
                        popupComments.map((c) => (
                          <div key={c.id} className="news-comment">
                            <div className="news-comment-header">
                              <span className="news-comment-author">{c.user_name}</span>
                              <span className="news-comment-date">{formatDateTime(c.created_at)}</span>
                            </div>
                            <div className="news-comment-body">{c.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                    {token && (
                      <div className="news-comment-form">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Написать комментарий..."
                          rows={2}
                          className="news-comment-input"
                        />
                        <button
                          type="button"
                          className="news-comment-submit"
                          onClick={handleAddComment}
                          disabled={!commentText.trim() || sendingComment}
                        >
                          {sendingComment ? 'Отправка...' : 'Отправить'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NewsPage;
