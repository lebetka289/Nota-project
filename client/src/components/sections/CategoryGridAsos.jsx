import './CategoryGridAsos.css';

// Фото загружаются в папку public/category-grid/: card1.png, card2.png, card3.png, card4.png
const CARDS = [
  { id: 1, title: 'Запись вокала', slug: 'recording', img: '/category-grid/card1.png' },
  { id: 2, title: 'Биты', slug: 'shop', img: '/category-grid/card2.png' },
  { id: 3, title: 'Сведение и мастеринг', slug: 'recording', img: '/category-grid/card3.png' },
  { id: 4, title: 'Студия', slug: 'home', img: '/category-grid/card4.png' },
];

function CategoryGridAsos({ onNavigate }) {
  return (
    <section className="category-grid-asos">
      <div className="category-grid-asos-inner">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="category-grid-asos-card"
            onClick={() => onNavigate?.(c.slug)}
          >
            <div className="category-grid-asos-img">
              <img src={c.img} alt="" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <span className="category-grid-asos-title">{c.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default CategoryGridAsos;
