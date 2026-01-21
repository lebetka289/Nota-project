import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function AdminPanel() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tshirts',
    sizes: '',
    price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (response.ok) {
        fetchProducts();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка сохранения товара');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления товара');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      sizes: product.sizes || '',
      price: product.price.toString()
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'tshirts',
      sizes: '',
      price: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="admin-panel loading">Загрузка...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Панель администратора</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-button">
          {showForm ? 'Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
          
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Категория *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="tshirts">Футболки</option>
                <option value="hoodies">Худи</option>
                <option value="pants">Штаны</option>
              </select>
            </div>

            <div className="form-group">
              <label>Цена (₽) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Размеры (через запятую, например: S,M,L,XL)</label>
            <input
              type="text"
              value={formData.sizes}
              onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
              placeholder="S, M, L, XL"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingProduct ? 'Сохранить' : 'Добавить'}
            </button>
            {editingProduct && (
              <button type="button" onClick={resetForm} className="cancel-button">
                Отмена
              </button>
            )}
          </div>
        </form>
      )}

      <div className="products-list">
        <h3>Товары ({products.length})</h3>
        {products.length === 0 ? (
          <div className="empty-state">Товаров пока нет</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-item">
                <div className="product-icon">
                  {product.category === 'tshirts' && '👕'}
                  {product.category === 'hoodies' && '🧥'}
                  {product.category === 'pants' && '👖'}
                </div>
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p className="product-category">
                    {product.category === 'tshirts' && 'Футболки'}
                    {product.category === 'hoodies' && 'Худи'}
                    {product.category === 'pants' && 'Штаны'}
                  </p>
                  <p className="product-price">{product.price} ₽</p>
                  {product.sizes && (
                    <p className="product-sizes">Размеры: {product.sizes}</p>
                  )}
                </div>
                <div className="product-actions">
                  <button onClick={() => handleEdit(product)} className="edit-button">
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="delete-button">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
