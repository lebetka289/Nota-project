import './Footer.css';

function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  const link = (page, label) => (
    <button className="footer-link" onClick={() => onNavigate?.(page)}>
      {label}
    </button>
  );

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">NOTA</div>
            <p className="footer-tagline">
              Студия звукозаписи • сведение • мастеринг • биты
            </p>
            <div className="footer-badges">
              <span className="badge">PRO SOUND</span>
              <span className="badge">MIX/MASTER</span>
              <span className="badge accent">REC</span>
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-title">Навигация</div>
            <div className="footer-links">
              {link('home', 'Главная')}
              {link('recording', 'Запись')}
              {link('shop', 'Биты')}
              {link('profile', 'Личный кабинет')}
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-title">Контакты</div>
            <div className="footer-text">
              <div className="footer-row">
                <span className="i">📍</span>
                <span>Москва, ул. Тверская, 10</span>
              </div>
              <div className="footer-row">
                <span className="i">🕐</span>
                <span>Пн–Пт 10:00–22:00 • Сб–Вс 12:00–20:00</span>
              </div>
              <div className="footer-row">
                <span className="i">📞</span>
                <span>+7 (495) 123-45-67</span>
              </div>
              <div className="footer-row">
                <span className="i">✉️</span>
                <span>info@notastudio.ru</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-mini">
            <span className="footer-dot" />
            <span>© {year} Nota Studio</span>
            <span className="sep">•</span>
            <span className="muted">Все права защищены</span>
          </div>
          <div className="footer-mini muted">
            Оплата • Запись • Поддержка • Условия
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
