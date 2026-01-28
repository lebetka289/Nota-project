import './Footer.css';

function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  const link = (page, label) => (
    <button className="asos-footer-link" onClick={() => onNavigate?.(page)}>
      {label}
    </button>
  );

  return (
    <footer className="asos-footer">
      <div className="asos-footer-inner">
        <div className="asos-footer-top">
          <div className="asos-footer-col asos-footer-brand">
            <div className="asos-footer-logo">NOTA STUDIO</div>
            <p className="asos-footer-tagline">
              Студия звукозаписи и музыкальный каталог
            </p>
          </div>

          <div className="asos-footer-col">
            <div className="asos-footer-title">Навигация</div>
            <div className="asos-footer-links">
              {link('home', 'Главная')}
              {link('recording', 'Запись')}
              {link('shop', 'Биты')}
              {link('profile', 'Кабинет')}
            </div>
          </div>

          <div className="asos-footer-col">
            <div className="asos-footer-title">Услуги</div>
            <div className="asos-footer-links">
              <span>Запись вокала</span>
              <span>Сведение и мастеринг</span>
              <span>Аренда студии</span>
              <span>Продажа битов</span>
            </div>
          </div>

          <div className="asos-footer-col">
            <div className="asos-footer-title">Контакты</div>
            <div className="asos-footer-links">
              <span>info@notastudio.ru</span>
              <span>+7 (495) 123-45-67</span>
              <span>Москва, ул. Тверская, 10</span>
              <span>Пн–Пт 10:00–22:00</span>
            </div>
          </div>
        </div>

        <div className="asos-footer-bottom">
          <span>© {year} Nota Studio</span>
          <span className="asos-footer-sep">|</span>
          <span>Все права защищены</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
