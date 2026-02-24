import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Header({ onNavigate }) {
  const { user, token, logout, isAdmin, isSupport, isBeatmaker, isReporter } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);

  const refreshCartCount = async () => {
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const r = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const data = await r.json();
      setCartCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    if (showMenu || showSearchResults) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showSearchResults]);

  useEffect(() => {
    refreshCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  useEffect(() => {
    const onCartUpdated = () => refreshCartCount();
    window.addEventListener('nota:cart-updated', onCartUpdated);
    return () => window.removeEventListener('nota:cart-updated', onCartUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleNav = (page, searchParam = null, state = null) => {
    if (searchParam !== null) {
      onNavigate?.(page, searchParam, state);
    } else {
      onNavigate?.(page, null, state);
    }
    setShowMenu(false);
    setMobileOpen(false);
    setShowSearchResults(false);
  };

  const searchBeatsAndNews = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const [beatsRes, newsRes] = await Promise.all([
        fetch(`${API_URL}/beats?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        }),
        fetch(`${API_URL}/news?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
      ]);
      const beats = beatsRes.ok ? (await beatsRes.json()) : [];
      const news = newsRes.ok ? (await newsRes.json()) : [];
      const beatsList = Array.isArray(beats) ? beats.slice(0, 5).map((b) => ({ ...b, type: 'beat' })) : [];
      const newsList = Array.isArray(news) ? news.slice(0, 5).map((n) => ({ ...n, type: 'news' })) : [];
      setSearchResults([...beatsList, ...newsList].slice(0, 8));
      setShowSearchResults(beatsList.length + newsList.length > 0);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchBeatsAndNews(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleNav('shop', searchQuery.trim());
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleBeatClick = (beat) => {
    handleNav('shop', beat.title);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleNewsClick = (news) => {
    handleNav('news', null, { openNewsId: news.id });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <>
      {/* ASOS-style top bar: dark grey */}
      <header className="asos-header">
        <div className="asos-header-inner">
          <button
            type="button"
            className="asos-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            <span className="asos-mobile-toggle-bar" />
            <span className="asos-mobile-toggle-bar" />
            <span className="asos-mobile-toggle-bar" />
          </button>

          <button
            type="button"
            onClick={() => handleNav('home')}
            className="asos-logo"
          >
            Нота бель
          </button>

          {/* Navigation: Главная, Запись, Кабинет */}
          <nav className="asos-nav">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="asos-nav-link"
            >
              Главная
            </button>
            <button
              type="button"
              onClick={() => handleNav('shop')}
              className="asos-nav-link"
            >
              Биты
            </button>
            <button
              type="button"
              onClick={() => handleNav('news')}
              className="asos-nav-link"
            >
              Новости
            </button>
            <button
              type="button"
              onClick={() => handleNav('recording')}
              className="asos-nav-link"
            >
              Запись
            </button>
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className="asos-nav-link"
            >
              Кабинет
            </button>
          </nav>

          {/* Centered search with dropdown */}
          <div className="asos-search-container" ref={searchRef}>
            <form className="asos-search-wrap" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                className="asos-search"
                placeholder="Поиск битов и новостей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                aria-label="Поиск битов и новостей"
              />
              <button type="submit" className="asos-search-btn" aria-label="Искать">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>
            
            {/* Search results dropdown: биты, разделитель, новости */}
            {showSearchResults && searchResults.length > 0 && (() => {
              const beats = searchResults.filter((i) => i.type === 'beat');
              const news = searchResults.filter((i) => i.type === 'news');
              return (
                <div className="asos-search-results" ref={searchResultsRef}>
                  {beats.map((item) => (
                    <button
                      key={`beat-${item.id}`}
                      type="button"
                      className="asos-search-result-item"
                      onClick={() => handleBeatClick(item)}
                    >
                      <div className="asos-search-result-cover">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt={item.title} />
                        ) : (
                          <div className="asos-search-result-placeholder">—</div>
                        )}
                      </div>
                      <div className="asos-search-result-info">
                        <div className="asos-search-result-title">{item.title}</div>
                        <div className="asos-search-result-meta">Бит</div>
                      </div>
                    </button>
                  ))}
                  {beats.length > 0 && news.length > 0 && (
                    <div className="asos-search-results-divider" aria-hidden="true" />
                  )}
                  {news.map((item) => (
                    <button
                      key={`news-${item.id}`}
                      type="button"
                      className="asos-search-result-item"
                      onClick={() => handleNewsClick(item)}
                    >
                      <div className="asos-search-result-cover">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} />
                        ) : (
                          <div className="asos-search-result-placeholder">—</div>
                        )}
                      </div>
                      <div className="asos-search-result-info">
                        <div className="asos-search-result-title">{item.title}</div>
                        <div className="asos-search-result-meta">Новость</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Right icons */}
          <div className="asos-actions">
            {user ? (
              <div className="asos-profile-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="asos-icon-btn asos-profile-btn"
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Аккаунт"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="asos-header-avatar" />
                  ) : (
                    <span className="asos-header-avatar-letter">{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>
                  )}
                </button>
                {showMenu && (
                  <div className="asos-dropdown">
                    <div className="asos-dropdown-info">
                      <div className="asos-dropdown-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          <span>{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="asos-dropdown-email">{user.email}</div>
                      <div className="asos-dropdown-role">{user.role}</div>
                    </div>
                    <div className="asos-dropdown-actions">
                      <button type="button" className="asos-dropdown-item" onClick={() => handleNav('profile')}>
                        Личный кабинет
                      </button>
                      {isBeatmaker && (
                        <button type="button" className="asos-dropdown-item" onClick={() => handleNav('beatmaker')}>
                          Битмейкер
                        </button>
                      )}
                      {isSupport && (
                        <button type="button" className="asos-dropdown-item" onClick={() => handleNav('support')}>
                          Поддержка
                        </button>
                      )}
                      {isAdmin && (
                        <button type="button" className="asos-dropdown-item" onClick={() => handleNav('admin')}>
                          Админ
                        </button>
                      )}
                      {isReporter && (
                        <button type="button" className="asos-dropdown-item" onClick={() => handleNav('reporter')}>
                          Репортер
                        </button>
                      )}
                    </div>
                    <button type="button" className="asos-dropdown-logout" onClick={() => { logout(); setShowMenu(false); }}>
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="asos-icon-btn asos-profile-btn"
                onClick={() => handleNav('auth')}
                aria-label="Войти"
              >
                <span className="asos-header-avatar-letter">?</span>
              </button>
            )}
            <button
              type="button"
              className="asos-icon-btn"
              onClick={() => handleNav('favorites')}
              aria-label="Избранное"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="asos-icon-btn-wrap">
              <button
                type="button"
                className="asos-icon-btn"
                onClick={() => handleNav('cart')}
                aria-label="Корзина"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {user && <span className="asos-cart-count">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`asos-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button type="button" className="asos-mobile-close" onClick={() => setMobileOpen(false)}>×</button>
        <button type="button" className="asos-mobile-link" onClick={() => handleNav('home')}>Главная</button>
        <button type="button" className="asos-mobile-link" onClick={() => handleNav('shop')}>Биты</button>
        <button type="button" className="asos-mobile-link" onClick={() => handleNav('news')}>Новости</button>
        <button type="button" className="asos-mobile-link" onClick={() => handleNav('recording')}>Запись</button>
        <button type="button" className="asos-mobile-link" onClick={() => handleNav('profile')}>Кабинет</button>
      </div>
    </>
  );
}

export default Header;
