import './CategoryGridAsos.css';

const PLACEHOLDERS = [
  { id: 1, title: 'Запись вокала', slug: 'recording', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80' },
  { id: 2, title: 'Биты', slug: 'shop', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80' },
  { id: 3, title: 'Сведение и мастеринг', slug: 'recording', img: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&q=80' },
  { id: 4, title: 'Студия', slug: 'home', img: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80' },
];

function CategoryGridAsos({ onNavigate }) {
  return (
    <section className="category-grid-asos">
      <div className="category-grid-asos-inner">
        {PLACEHOLDERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="category-grid-asos-card"
            onClick={() => onNavigate?.(c.slug)}
          >
            <div className="category-grid-asos-img">
              <img src={c.img} alt="" />
            </div>
            <span className="category-grid-asos-title">{c.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default CategoryGridAsos;
