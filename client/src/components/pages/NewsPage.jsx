import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import './NewsPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const TEXT_PREVIEW_LENGTH = 200;

// Мемоизированный компонент новости
const NewsItem = memo(({ item, onOpenPopup, formatDate }) => {
  const previewText = useMemo(() => {
    return item.content.length > TEXT_PREVIEW_LENGTH 
      ? item.content.substring(0, TEXT_PREVIEW_LENGTH) + '...'
      : item.content;
  }, [item.content]);

  const handleImageClick = useCallback(() => {
    onOpenPopup(item);
  }, [item, onOpenPopup]);

  const handleReadMore = useCallback(() => {
    onOpenPopup(item);
  }, [item, onOpenPopup]);

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
        </div>
        <div className="news-text-wrapper">
          <div className="news-text">{previewText}</div>
          {item.content.length > TEXT_PREVIEW_LENGTH && (
            <button className="news-read-more" onClick={handleReadMore}>
              Смотреть больше
            </button>
          )}
        </div>
        <div className="news-social-links">
          <a href="https://vk.com" target="_blank" rel="noopener noreferrer" className="news-social-link vk">
            VK
          </a>
          <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="news-social-link telegram">
            Telegram
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="news-social-link youtube">
            YouTube
          </a>
        </div>
      </div>
    </article>
  );
});

NewsItem.displayName = 'NewsItem';

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupNews, setPopupNews] = useState(null);
  const [imageZoomed, setImageZoomed] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${API_URL}/news`);
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

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleOpenPopup = useCallback((item) => {
    setPopupNews(item);
    setImageZoomed(false);
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
            <NewsItem 
              key={item.id} 
              item={item} 
              onOpenPopup={handleOpenPopup}
              formatDate={formatDate}
            />
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
                  </div>
                  <div className="news-popup-text">{popupNews.content}</div>
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
