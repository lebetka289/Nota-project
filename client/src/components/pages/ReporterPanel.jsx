import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ReporterPanel.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ReporterPanel() {
  const { token, isReporter } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    published: false
  });
  const [imageUploadType, setImageUploadType] = useState('url'); // 'url' or 'file'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isReporter && token) {
      fetchNews();
    }
  }, [isReporter, token]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${API_URL}/news/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setAlert({ message: 'Ошибка загрузки новостей', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAlert({ message: 'Выберите файл изображения', type: 'warning' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageFile = async () => {
    if (!imageFile || !token) return null;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${API_URL}/news/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        return data.image_url;
      } else {
        setAlert({ message: data.error || 'Ошибка загрузки изображения', type: 'error' });
        return null;
      }
    } catch (error) {
      setAlert({ message: 'Ошибка загрузки изображения', type: 'error' });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !isReporter) return;

    try {
      let finalImageUrl = formData.image_url;
      
      // Если выбрана загрузка файла, загружаем его
      if (imageUploadType === 'file' && imageFile) {
        const uploadedUrl = await uploadImageFile();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          return; // Ошибка загрузки
        }
      }

      const url = editingNews
        ? `${API_URL}/news/${editingNews.id}`
        : `${API_URL}/news`;
      const method = editingNews ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          image_url: finalImageUrl
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAlert({ message: editingNews ? 'Новость обновлена' : 'Новость создана', type: 'success' });
        fetchNews();
        resetForm();
      } else {
        setAlert({ message: data.error || 'Ошибка сохранения новости', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;
    if (!token || !isReporter) return;

    try {
      const response = await fetch(`${API_URL}/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setAlert({ message: 'Новость удалена', type: 'success' });
        fetchNews();
      } else {
        setAlert({ message: data.error || 'Ошибка удаления новости', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'Ошибка подключения к серверу', type: 'error' });
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      image_url: newsItem.image_url || '',
      published: newsItem.published === 1
    });
    setImageUploadType(newsItem.image_url ? 'url' : 'url');
    setImageFile(null);
    setImagePreview(newsItem.image_url || null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      published: false
    });
    setImageUploadType('url');
    setImageFile(null);
    setImagePreview(null);
    setEditingNews(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isReporter) {
    return (
      <div className="reporter-panel">
        <div className="reporter-access-denied">
          <h2>Доступ запрещен</h2>
          <p>Требуется роль репортера</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="reporter-panel loading">Загрузка...</div>;
  }

  return (
    <div className="reporter-panel">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      
      <div className="reporter-header">
        <h2>Панель репортера</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-button">
          {showForm ? 'Отмена' : '+ Добавить новость'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="reporter-form">
          <h3>{editingNews ? 'Редактировать новость' : 'Новая новость'}</h3>
          
          <div className="form-group">
            <label>Заголовок *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Заголовок новости"
            />
          </div>

          <div className="form-group">
            <label>Содержание *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows="10"
              placeholder="Текст новости"
            />
          </div>

          <div className="form-group">
            <label>Изображение</label>
            <div className="image-upload-type">
              <label>
                <input
                  type="radio"
                  name="imageType"
                  value="url"
                  checked={imageUploadType === 'url'}
                  onChange={(e) => {
                    setImageUploadType(e.target.value);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                />
                По ссылке
              </label>
              <label>
                <input
                  type="radio"
                  name="imageType"
                  value="file"
                  checked={imageUploadType === 'file'}
                  onChange={(e) => {
                    setImageUploadType(e.target.value);
                    setFormData({ ...formData, image_url: '' });
                  }}
                />
                С компьютера
              </label>
            </div>
            {imageUploadType === 'url' ? (
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
              />
            )}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              Опубликовать сразу
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingNews ? 'Сохранить' : 'Добавить'}
            </button>
            {editingNews && (
              <button type="button" onClick={resetForm} className="cancel-button">
                Отмена
              </button>
            )}
          </div>
        </form>
      )}

      <div className="reporter-news-list">
        <h3>Мои новости ({news.length})</h3>
        {news.length === 0 ? (
          <div className="empty-state">Новостей пока нет</div>
        ) : (
          <div className="news-grid">
            {news.map((item) => (
              <div key={item.id} className="news-card">
                {item.image_url && (
                  <div className="news-card-image">
                    <img src={item.image_url} alt={item.title} />
                  </div>
                )}
                <div className="news-card-content">
                  <h4>{item.title}</h4>
                  <div className="news-card-meta">
                    <span className={`news-status ${item.published === 1 ? 'published' : 'draft'}`}>
                      {item.published === 1 ? 'Опубликовано' : 'Черновик'}
                    </span>
                    <span className="news-card-date">{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                  <p className="news-card-preview">
                    {item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content}
                  </p>
                  <div className="news-card-actions">
                    <button onClick={() => handleEdit(item)} className="edit-button">
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="delete-button">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReporterPanel;
