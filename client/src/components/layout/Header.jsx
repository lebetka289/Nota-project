import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function Header({ onNavigate }) {
  const { user, logout, isAdmin, isSupport, isBeatmaker } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleNavClick = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setShowMenu(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Nota Studio</h1>
        </div>
        <nav className="nav">
          <button onClick={() => handleNavClick('home')} className="nav-link">
            Главная
          </button>
          <button onClick={() => handleNavClick('recording')} className="nav-link">
            Запись
          </button>
          <button onClick={() => handleNavClick('shop')} className="nav-link">
            Биты
          </button>
          {user && (
            <>
              <button onClick={() => handleNavClick('cart')} className="nav-link">
                Корзина
              </button>
              <button onClick={() => handleNavClick('favorites')} className="nav-link">
                Избранное
              </button>
            </>
          )}
        </nav>
        <div className="user-section">
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button 
                className="user-button"
                onClick={() => setShowMenu(!showMenu)}
              >
                {user.name} ▼
              </button>
              {showMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-email">{user.email}</div>
                    <div className="user-role">{user.role}</div>
                  </div>

                  <div className="user-actions">
                    <button className="menu-item" onClick={() => handleNavClick('profile')}>
                      <span className="mi-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span className="mi-text">Личный кабинет</span>
                    </button>

                    {isBeatmaker && (
                      <button className="menu-item" onClick={() => handleNavClick('beatmaker')}>
                        <span className="mi-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 3v10m0 0c-1.7-1.3-4-1.8-6-1.2-2.3.7-4 2.8-4 5.2 0 3 2.5 5.5 5.5 5.5 2.8 0 5-2 5.4-4.7.1-.3.1-.6.1-.8V7l9-2v8.2c-1.7-1.3-4-1.8-6-1.2-2.3.7-4 2.8-4 5.2 0 3 2.5 5.5 5.5 5.5S24 20 24 17V3l-12 3z" fill="currentColor"/>
                          </svg>
                        </span>
                        <span className="mi-text">Битмейкер</span>
                      </button>
                    )}

                    {isSupport && (
                      <button className="menu-item" onClick={() => handleNavClick('support')}>
                        <span className="mi-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M4 4h16v11H7l-3 3V4zm4 4h8v2H8V8zm0 4h6v2H8v-2z" fill="currentColor"/>
                          </svg>
                        </span>
                        <span className="mi-text">Поддержка</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button className="menu-item" onClick={() => handleNavClick('admin')}>
                        <span className="mi-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z" fill="currentColor"/>
                          </svg>
                        </span>
                        <span className="mi-text">Админ панель</span>
                      </button>
                    )}
                  </div>

                  <button onClick={() => { logout(); setShowMenu(false); }} className="logout-button">
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => handleNavClick('auth')} className="auth-button">
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
